const mongoose = require("mongoose");
const User = require("../models/User");
const {
  PLANS,
  stripeReady,
  priceIdForPlan,
  planIdFromPrice,
  publicPlans,
} = require("../config/plans");

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Lazy require so the server still boots without the package in odd setups
  const Stripe = require("stripe");
  return new Stripe(key);
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:5174").replace(/\/$/, "");
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
    currentPeriodEnd: user.currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(user.cancelAtPeriodEnd),
    stripeReady: stripeReady(),
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

async function applyPaymentMethod(user, stripe, paymentMethod) {
  if (!paymentMethod) return;
  try {
    const pm =
      typeof paymentMethod === "string"
        ? await stripe.paymentMethods.retrieve(paymentMethod)
        : paymentMethod;
    if (pm?.card) {
      user.paymentMethodBrand = pm.card.brand || "";
      user.paymentMethodLast4 = pm.card.last4 || "";
      user.paymentMethodExpMonth = pm.card.exp_month || null;
      user.paymentMethodExpYear = pm.card.exp_year || null;
    }
  } catch (err) {
    console.error("applyPaymentMethod:", err.message);
  }
}

async function applySubscription(user, stripe, subscription) {
  if (!subscription) return;

  const priceId = subscription.items?.data?.[0]?.price?.id || "";
  const planId = planIdFromPrice(priceId);
  const status = subscription.status || "none";

  user.stripeSubscriptionId = subscription.id || "";
  user.stripePriceId = priceId;
  user.plan = status === "canceled" || status === "unpaid" ? "starter" : planId;
  user.subscriptionStatus = status;
  user.cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
  user.currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;

  const pm = subscription.default_payment_method;
  if (pm) {
    await applyPaymentMethod(user, stripe, pm);
  }
}

async function getOrCreateCustomer(user, stripe) {
  if (user.stripeCustomerId) {
    try {
      await stripe.customers.retrieve(user.stripeCustomerId);
      return user.stripeCustomerId;
    } catch {
      user.stripeCustomerId = "";
    }
  }

  const customer = await stripe.customers.create({
    email: user.workEmail,
    name: user.fullName,
    metadata: { userId: String(user._id) },
  });

  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
}

async function listPlans(_req, res) {
  return res.json({
    success: true,
    stripeReady: stripeReady(),
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

async function createCheckout(req, res) {
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

    const stripe = getStripe();
    if (!stripe || !stripeReady()) {
      return res.status(503).json({
        success: false,
        message:
          "Stripe is not configured. Add STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, and STRIPE_PRICE_BUSINESS",
      });
    }

    const user = await User.findById(req.user._id);
    const customerId = await getOrCreateCustomer(user, stripe);
    const priceId = priceIdForPlan(planId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: String(user._id),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl()}/dashboard/settings?billing=success`,
      cancel_url: `${frontendUrl()}/dashboard/settings?billing=cancel`,
      payment_method_collection: "always",
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          userId: String(user._id),
          plan: planId,
        },
      },
      metadata: {
        userId: String(user._id),
        plan: planId,
      },
    });

    return res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("createCheckout:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to start checkout.",
    });
  }
}

async function createPortal(req, res) {
  try {
    if (!ensureDb(res)) return;

    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: "Stripe is not configured.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: "Add a paid plan first so we can save a payment method.",
      });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${frontendUrl()}/dashboard/settings`,
    });

    return res.json({
      success: true,
      url: portal.url,
    });
  } catch (error) {
    console.error("createPortal:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to open billing portal.",
    });
  }
}

async function cancelSubscription(req, res) {
  try {
    if (!ensureDb(res)) return;

    const stripe = getStripe();
    const user = await User.findById(req.user._id);

    if (!user.stripeSubscriptionId || !stripe) {
      user.plan = "starter";
      user.subscriptionStatus = "canceled";
      user.cancelAtPeriodEnd = false;
      user.stripeSubscriptionId = "";
      user.stripePriceId = "";
      await user.save();
      return res.json({ success: true, billing: billingPayload(user) });
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    await applySubscription(user, stripe, subscription);
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

    const stripe = getStripe();
    const user = await User.findById(req.user._id);

    if (!stripe || !user.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: "No subscription to resume.",
      });
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    await applySubscription(user, stripe, subscription);
    await user.save();

    return res.json({ success: true, billing: billingPayload(user) });
  } catch (error) {
    console.error("resumeSubscription:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resume subscription.",
    });
  }
}

async function downgradeToStarter(req, res) {
  const stripe = getStripe();
  const user = await User.findById(req.user._id);

  if (stripe && user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      user.cancelAtPeriodEnd = true;
      await user.save();
      return res.json({
        success: true,
        billing: billingPayload(user),
        message: "You'll move to Starter at the end of the current billing period.",
      });
    } catch (error) {
      console.error("downgradeToStarter:", error);
    }
  }

  user.plan = "starter";
  user.subscriptionStatus = user.stripeSubscriptionId ? "canceled" : "none";
  user.cancelAtPeriodEnd = false;
  await user.save();

  return res.json({ success: true, billing: billingPayload(user) });
}

async function findUserFromStripe(object) {
  const metaId = object?.metadata?.userId || object?.client_reference_id;
  if (metaId && mongoose.Types.ObjectId.isValid(metaId)) {
    const byId = await User.findById(metaId);
    if (byId) return byId;
  }
  if (object?.customer) {
    const customerId =
      typeof object.customer === "string" ? object.customer : object.customer.id;
    if (customerId) {
      return User.findOne({ stripeCustomerId: customerId });
    }
  }
  if (object?.subscription) {
    const subId =
      typeof object.subscription === "string"
        ? object.subscription
        : object.subscription.id;
    if (subId) return User.findOne({ stripeSubscriptionId: subId });
  }
  return null;
}

async function stripeWebhook(req, res) {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ success: false, message: "Stripe is not configured." });
  }

  const signature = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (secret) {
      event = stripe.webhooks.constructEvent(req.body, signature, secret);
    } else {
      event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (Buffer.isBuffer(req.body)) {
        event = JSON.parse(req.body.toString("utf8"));
      }
    }
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).json({ success: false, message: "Invalid webhook signature." });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const user = await findUserFromStripe(session);
        if (!user) break;
        if (session.customer) {
          user.stripeCustomerId =
            typeof session.customer === "string" ? session.customer : session.customer.id;
        }
        if (session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId, {
            expand: ["default_payment_method"],
          });
          await applySubscription(user, stripe, subscription);
        }
        await user.save();
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const user = await findUserFromStripe(subscription);
        if (!user) break;
        if (event.type === "customer.subscription.deleted") {
          user.plan = "starter";
          user.subscriptionStatus = "canceled";
          user.stripeSubscriptionId = "";
          user.stripePriceId = "";
          user.cancelAtPeriodEnd = false;
        } else {
          await applySubscription(user, stripe, subscription);
        }
        await user.save();
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const user = await findUserFromStripe(invoice);
        if (!user || !invoice.subscription) break;
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subId, {
          expand: ["default_payment_method"],
        });
        await applySubscription(user, stripe, subscription);
        await user.save();
        break;
      }
      case "payment_method.attached": {
        const pm = event.data.object;
        const user = await User.findOne({ stripeCustomerId: pm.customer });
        if (!user) break;
        await applyPaymentMethod(user, stripe, pm);
        await user.save();
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("stripeWebhook handler:", error);
    return res.status(500).json({ success: false, message: "Webhook handler failed." });
  }

  return res.json({ received: true });
}

module.exports = {
  listPlans,
  getBilling,
  createCheckout,
  createPortal,
  cancelSubscription,
  resumeSubscription,
  stripeWebhook,
};
