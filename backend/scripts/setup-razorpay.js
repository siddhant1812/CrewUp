const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Razorpay = require("razorpay");
const { PLANS } = require("../src/config/plans");

async function main() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error(
      "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env first (Razorpay Dashboard → Settings → API Keys)."
    );
    process.exit(1);
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const created = {};

  for (const plan of [PLANS.pro, PLANS.business]) {
    const { amount, currency } = plan.razorpay;
    const created_plan = await razorpay.plans.create({
      period: "monthly",
      interval: 1,
      item: {
        name: `CrewUp ${plan.name}`,
        description: plan.blurb,
        amount,
        currency,
      },
      notes: { crewupPlan: plan.id },
    });

    created[plan.id] = created_plan.id;
    console.log(`${plan.name}: plan ${created_plan.id} (${amount / 100} ${currency}/mo)`);
  }

  console.log("\nAdd these to backend/.env:\n");
  console.log(`RAZORPAY_PLAN_PRO=${created.pro}`);
  console.log(`RAZORPAY_PLAN_BUSINESS=${created.business}`);
  console.log(
    "\nAlso add RAZORPAY_WEBHOOK_SECRET from Dashboard → Settings → Webhooks (point it at " +
      "<your backend url>/api/billing/webhook/razorpay, event types: subscription.*)."
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
