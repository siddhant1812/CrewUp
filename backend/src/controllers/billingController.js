const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const {
  PLANS,
  razorpayReady,
  razorpayDemoMode,
  razorpayPlanIdForPlan,
  planIdFromRazorpayPlan,
  publicPlans,
} = require("../config/plans");

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  // Lazy require so the server still boots without the package/keys in odd setups
  const Razorpay = require("razorpay");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// created/authenticated/pending: checkout started but not yet actively billing.
// halted: a renewal charge failed and Razorpay is retrying.
// cancelled/completed/expired: no further billing will happen.
function mapRazorpayStatus(status) {
  if (status === "active") return "active";
  if (status === "paused") return "paused";
  if (status === "halted") return "past_due";
  if (status === "cancelled" || status === "completed" || status === "expired") return "canceled";
  return "incomplete";
}

function ensureDb(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: "Database is not connected.",
    });
    return false;
  }
  return true;
}

function billingPayload(user) {
  const plan = PLANS[user.plan] || PLANS.starter;
  const hasCard = Boolean(user.paymentMethodLast4);
  return {
    plan: user.plan || "starter",
    planName: plan.name,
    priceLabel: plan.priceLabel,
    period: plan.period,
    subscriptionStatus: user.subscriptionStatus || "none",
    currentPeriodStart: user.currentPeriodStart,
    currentPeriodEnd: user.currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(user.cancelAtPeriodEnd),
    paymentGateway: user.paymentGateway || "",
    razorpayReady: razorpayReady(),
    razorpayDemo: razorpayDemoMode(),
    paymentMethod: hasCard
      ? {
          brand: user.paymentMethodBrand || "card",
          last4: user.paymentMethodLast4,
          expMonth: user.paymentMethodExpMonth,
          expYear: user.paymentMethodExpYear,
        }
      : null,
  };
}

async function listPlans(_req, res) {
  return res.json({
    success: true,
    razorpayReady: razorpayReady(),
    razorpayDemo: razorpayDemoMode(),
    plans: publicPlans(),
  });
}

async function getBilling(req, res) {
  try {
    if (!ensureDb(res)) return;
    return res.json({
      success: true,
      billing: billingPayload(req.user),
    });
  } catch (error) {
    console.error("getBilling:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load billing.",
    });
  }
}

async function downgradeToStarter(req, res) {
  const user = await User.findById(req.user._id);

  if (user.paymentGateway === "razorpay" && user.razorpaySubscriptionId) {
    try {
      const razorpay = getRazorpay();
      if (razorpay) {
        await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, true);
        user.cancelAtPeriodEnd = true;
        await user.save();
        return res.json({
          success: true,
          billing: billingPayload(user),
          message: "You'll move to Starter at the end of the current billing period.",
        });
      }
    } catch (error) {
      console.error("downgradeToStarter:", error);
    }
  }

  user.plan = "starter";
  user.subscriptionStatus = user.razorpaySubscriptionId ? "canceled" : "none";
  user.cancelAtPeriodEnd = false;
  user.currentPeriodStart = null;
  user.currentPeriodEnd = null;
  await user.save();

  return res.json({ success: true, billing: billingPayload(user) });
}

async function createRazorpaySubscription(req, res) {
  try {
    if (!ensureDb(res)) return;

    const planId = String(req.body.plan || "").toLowerCase();
    if (!PLANS[planId]) {
      return res.status(400).json({
        success: false,
        message: "Choose Starter, Pro, or Business.",
      });
    }

    if (planId === "starter") {
      return downgradeToStarter(req, res);
    }

    const razorpay = getRazorpay();
    if (!razorpay || !razorpayReady()) {
      return res.status(503).json({
        success: false,
        message:
          "Razorpay is not configured. Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_PRO, and RAZORPAY_PLAN_BUSINESS",
      });
    }

    const razorpayPlanId = razorpayPlanIdForPlan(planId);
    const user = await User.findById(req.user._id);

    // Razorpay subscriptions don't have a true "forever" option; a large cycle
    // count behaves like one for a monthly plan (10 years of renewals).
    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      total_count: 120,
      notes: {
        userId: String(user._id),
        plan: planId,
      },
    });

    return res.json({
      success: true,
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: planId,
      prefill: {
        name: user.fullName || "",
        email: user.workEmail || "",
      },
    });
  } catch (error) {
    console.error("createRazorpaySubscription:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to start Razorpay checkout.",
    });
  }
}

// Demo-only stand-in for the real Razorpay flow above: no Razorpay API call,
// no money moves. Lets the "Pay now" dialog simulate a successful payment
// while real API keys aren't working yet. Gated behind RAZORPAY_DEMO_MODE so
// it can never run unless someone explicitly turns it on in backend/.env.
async function demoRazorpaySubscribe(req, res) {
  try {
    if (!ensureDb(res)) return;

    if (!razorpayDemoMode()) {
      return res.status(503).json({
        success: false,
        message: "Demo checkout is not enabled.",
      });
    }

    const planId = String(req.body.plan || "").toLowerCase();
    if (!PLANS[planId] || planId === "starter") {
      return res.status(400).json({
        success: false,
        message: "Choose Pro or Business.",
      });
    }

    const user = await User.findById(req.user._id);
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    user.paymentGateway = "razorpay";
    user.razorpaySubscriptionId = `demo_sub_${user._id}_${Date.now()}`;
    user.razorpayPlanId = `demo_plan_${planId}`;
    user.plan = planId;
    user.subscriptionStatus = "active";
    user.cancelAtPeriodEnd = false;
    user.currentPeriodStart = periodStart;
    user.currentPeriodEnd = periodEnd;

    // A new (fake) card entered at checkout replaces what's on file; otherwise
    // keep an already-saved card, or fall back to a default demo card.
    const card = req.body.card;
    if (card && card.number) {
      const digits = String(card.number).replace(/\D/g, "");
      user.paymentMethodBrand = digits.startsWith("4")
        ? "Visa"
        : /^5[1-5]/.test(digits)
          ? "Mastercard"
          : /^3[47]/.test(digits)
            ? "Amex"
            : "Card";
      user.paymentMethodLast4 = digits.slice(-4) || "4242";
      const [mm, yy] = String(card.expiry || "")
        .split("/")
        .map((s) => s.trim());
      user.paymentMethodExpMonth = Number(mm) || 12;
      user.paymentMethodExpYear = yy
        ? yy.length === 2
          ? 2000 + Number(yy)
          : Number(yy)
        : periodEnd.getFullYear() + 3;
    } else if (!user.paymentMethodLast4) {
      user.paymentMethodBrand = "Visa (demo)";
      user.paymentMethodLast4 = "4242";
      user.paymentMethodExpMonth = 12;
      user.paymentMethodExpYear = periodEnd.getFullYear() + 3;
    }
    await user.save();

    return res.json({ success: true, billing: billingPayload(user) });
  } catch (error) {
    console.error("demoRazorpaySubscribe:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Demo checkout failed.",
    });
  }
}

async function verifyRazorpayPayment(req, res) {
  try {
    if (!ensureDb(res)) return;

    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Razorpay is not configured.",
      });
    }

    const {
      razorpay_payment_id: paymentId,
      razorpay_subscription_id: subscriptionId,
      razorpay_signature: signature,
    } = req.body;

    if (!paymentId || !subscriptionId || !signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment details.",
      });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({
        success: false,
        message: "Could not verify payment with Razorpay.",
      });
    }

    const user = await User.findById(req.user._id);
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    applyRazorpaySubscription(user, subscription);
    user.cancelAtPeriodEnd = false;
    await user.save();

    try {
      const payment = await razorpay.payments.fetch(paymentId);
      applyRazorpayPaymentMethod(user, payment);
      await user.save();
    } catch (err) {
      console.error("verifyRazorpayPayment (fetch payment method):", err.message);
    }

    return res.json({ success: true, billing: billingPayload(user) });
  } catch (error) {
    console.error("verifyRazorpayPayment:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm Razorpay payment.",
    });
  }
}

function applyRazorpaySubscription(user, subscription) {
  if (!subscription) return;

  const planId = planIdFromRazorpayPlan(subscription.plan_id);
  const status = mapRazorpayStatus(subscription.status);

  user.paymentGateway = "razorpay";
  user.razorpaySubscriptionId = subscription.id || "";
  user.razorpayPlanId = subscription.plan_id || "";
  user.plan = status === "canceled" ? "starter" : planId;
  user.subscriptionStatus = status;
  user.currentPeriodStart = subscription.current_start
    ? new Date(subscription.current_start * 1000)
    : null;
  user.currentPeriodEnd = subscription.current_end
    ? new Date(subscription.current_end * 1000)
    : null;
}

function applyRazorpayPaymentMethod(user, payment) {
  if (!payment) return;
  if (payment.method === "card" && payment.card) {
    user.paymentMethodBrand = payment.card.network || payment.card.type || "card";
    user.paymentMethodLast4 = payment.card.last4 || "";
    user.paymentMethodExpMonth = Number(payment.card.expiry_month) || null;
    user.paymentMethodExpYear = Number(payment.card.expiry_year) || null;
  } else {
    // UPI, netbanking, wallet, etc. don't carry card-style details to show.
    user.paymentMethodBrand = payment.method || "";
    user.paymentMethodLast4 = "";
    user.paymentMethodExpMonth = null;
    user.paymentMethodExpYear = null;
  }
}

async function findUserFromRazorpay(entity) {
  const userId = entity?.notes?.userId;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    const byId = await User.findById(userId);
    if (byId) return byId;
  }
  if (entity?.id) {
    return User.findOne({ razorpaySubscriptionId: entity.id });
  }
  return null;
}

async function razorpayWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(503).json({ success: false, message: "Razorpay webhook is not configured." });
  }

  const signature = req.headers["x-razorpay-signature"];
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;

  const Razorpay = require("razorpay");
  const valid = Razorpay.validateWebhookSignature(rawBody, signature, secret);
  if (!valid) {
    console.error("Razorpay webhook signature failed");
    return res.status(400).json({ success: false, message: "Invalid webhook signature." });
  }

  const event = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;

  try {
    switch (event.event) {
      case "subscription.activated":
      case "subscription.charged":
      case "subscription.updated":
      case "subscription.halted":
      case "subscription.paused":
      case "subscription.resumed":
      case "subscription.cancelled":
      case "subscription.completed": {
        const subscription = event.payload?.subscription?.entity;
        const user = await findUserFromRazorpay(subscription);
        if (!user) break;
        applyRazorpaySubscription(user, subscription);
        if (event.event === "subscription.cancelled" || event.event === "subscription.completed") {
          user.cancelAtPeriodEnd = false;
        }
        const payment = event.payload?.payment?.entity;
        if (payment) applyRazorpayPaymentMethod(user, payment);
        await user.save();
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("razorpayWebhook handler:", error);
    return res.status(500).json({ success: false, message: "Webhook handler failed." });
  }

  return res.json({ received: true });
}

async function cancelSubscription(req, res) {
  try {
    if (!ensureDb(res)) return;

    const user = await User.findById(req.user._id);

    if (user.paymentGateway === "razorpay" && user.razorpaySubscriptionId) {
      const razorpay = getRazorpay();
      if (!razorpay) {
        return res.status(503).json({ success: false, message: "Razorpay is not configured." });
      }
      await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, true);
      user.cancelAtPeriodEnd = true;
      await user.save();
      return res.json({ success: true, billing: billingPayload(user) });
    }

    user.plan = "starter";
    user.subscriptionStatus = "canceled";
    user.cancelAtPeriodEnd = false;
    user.currentPeriodStart = null;
    user.currentPeriodEnd = null;
    user.razorpaySubscriptionId = "";
    user.razorpayPlanId = "";
    await user.save();
    return res.json({ success: true, billing: billingPayload(user) });
  } catch (error) {
    console.error("cancelSubscription:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel subscription.",
    });
  }
}

async function resumeSubscription(req, res) {
  try {
    if (!ensureDb(res)) return;

    const user = await User.findById(req.user._id);

    if (user.paymentGateway === "razorpay" && user.razorpaySubscriptionId) {
      // Razorpay has no API to undo a scheduled cancel-at-cycle-end: once
      // requested, the subscription stops renewing. The caller should start a
      // fresh subscription instead.
      return res.status(400).json({
        success: false,
        message:
          "Razorpay can't resume a subscription that's scheduled to cancel — start a new subscription instead.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "No subscription to resume.",
    });
  } catch (error) {
    console.error("resumeSubscription:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resume subscription.",
    });
  }
}

module.exports = {
  listPlans,
  getBilling,
  downgradeToStarter,
  createRazorpaySubscription,
  demoRazorpaySubscribe,
  verifyRazorpayPayment,
  razorpayWebhook,
  cancelSubscription,
  resumeSubscription,
};
