const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Stripe = require("stripe");
const { PLANS } = require("../src/config/plans");

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Set STRIPE_SECRET_KEY in backend/.env first (Stripe Dashboard → Developers → API keys).");
    process.exit(1);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const created = {};

  for (const plan of [PLANS.pro, PLANS.business]) {
    const product = await stripe.products.create({
      name: `CrewUp ${plan.name}`,
      description: plan.blurb,
      metadata: { crewupPlan: plan.id },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: plan.currency,
      recurring: { interval: plan.interval },
      metadata: { crewupPlan: plan.id },
    });

    created[plan.id] = { product: product.id, price: price.id };
    console.log(`${plan.name}: product ${product.id}  price ${price.id}`);
  }

  console.log("\nAdd these to backend/.env:\n");
  console.log(`STRIPE_PRICE_PRO=${created.pro.price}`);
  console.log(`STRIPE_PRICE_BUSINESS=${created.business.price}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
