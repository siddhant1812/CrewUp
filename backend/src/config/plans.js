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

function stripeReady() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_PRO &&
      process.env.STRIPE_PRICE_BUSINESS
  );
}

function priceIdForPlan(planId) {
  if (planId === "pro") return process.env.STRIPE_PRICE_PRO || "";
  if (planId === "business") return process.env.STRIPE_PRICE_BUSINESS || "";
  return "";
}

function planIdFromPrice(priceId) {
  if (!priceId) return "starter";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return "business";
  return "starter";
}

function publicPlans() {
  return Object.values(PLANS).map((plan) => ({
    ...plan,
    stripePriceId: priceIdForPlan(plan.id) || null,
    checkoutEnabled: plan.id === "starter" || Boolean(priceIdForPlan(plan.id)),
  }));
}

module.exports = {
  PLANS,
  stripeReady,
  priceIdForPlan,
  planIdFromPrice,
  publicPlans,
};
