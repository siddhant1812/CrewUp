const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  listPlans,
  getBilling,
  downgradeToStarter,
  createRazorpaySubscription,
  demoRazorpaySubscribe,
  verifyRazorpayPayment,
  cancelSubscription,
  resumeSubscription,
} = require("../controllers/billingController");

const router = express.Router();

// razorpayWebhook is intentionally not routed here: it needs the raw request
// body for signature verification, but server.js applies express.json()
// globally before this router mounts, so the raw bytes are already gone by
// the time a request would reach it. Only wire it up once real Razorpay
// webhooks are needed, alongside a raw-body exception for this one path.

router.get("/plans", listPlans);
router.get("/me", protect, getBilling);
router.post("/downgrade", protect, downgradeToStarter);
router.post("/razorpay/subscribe", protect, createRazorpaySubscription);
router.post("/razorpay/verify", protect, verifyRazorpayPayment);
router.post("/razorpay/demo-subscribe", protect, demoRazorpaySubscribe);
router.post("/cancel", protect, cancelSubscription);
router.post("/resume", protect, resumeSubscription);

module.exports = router;
