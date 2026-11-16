const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    amount: 0,
    currency: "usd",
    interval: "month",
    priceLabel: "$0",
    period: "",
    blurb: "Get started and explore the marketplace.",
    features: [
      "Basic profile",
      "Browse projects & contractors",
      "Limited messaging",
      "Community access",
    ],
    popular: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    amount: 2900,
    currency: "usd",
    interval: "month",
    priceLabel: "$29",
    period: "/mo",
    blurb: "For active pros who need to win more work.",
    features: [
      "Everything in Starter",
      "Unlimited messaging",
      "Featured profile",
      "Project alerts",
      "Priority search ranking",
    ],
    popular: true,
  },
  business: {
    id: "business",
    name: "Business",
    amount: 9900,
    currency: "usd",
    interval: "month",
    priceLabel: "$99",
    period: "/mo",
    blurb: "For teams managing multiple crews and jobs.",
    features: [
      "Everything in Pro",
      "Team accounts (up to 10)",
      "Company brand page",
      "Priority support",
      "Advanced analytics",
    ],
    popular: false,
  },
};

// True once real Razorpay plan IDs + API keys are set in the environment.
function razorpayReady() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_PLAN_PRO &&
      process.env.RAZORPAY_PLAN_BUSINESS
  );
}

// Fake-checkout fallback used while real Razorpay keys aren't configured.
// On by default in dev so the subscribe flow is testable out of the box;
// set RAZORPAY_DEMO_MODE=false to turn it off explicitly (e.g. in prod).
function razorpayDemoMode() {
  if (razorpayReady()) return false;
  return process.env.RAZORPAY_DEMO_MODE !== "false";
}

function razorpayPlanIdForPlan(planId) {
  if (planId === "pro") return process.env.RAZORPAY_PLAN_PRO || "";
  if (planId === "business") return process.env.RAZORPAY_PLAN_BUSINESS || "";
  return "";
}

function planIdFromRazorpayPlan(razorpayPlanId) {
  if (!razorpayPlanId) return "starter";
  if (razorpayPlanId === process.env.RAZORPAY_PLAN_PRO) return "pro";
  if (razorpayPlanId === process.env.RAZORPAY_PLAN_BUSINESS) return "business";
  return "starter";
}

function publicPlans() {
  return Object.values(PLANS);
}

module.exports = {
  PLANS,
  razorpayReady,
  razorpayDemoMode,
  razorpayPlanIdForPlan,
  planIdFromRazorpayPlan,
  publicPlans,
};
