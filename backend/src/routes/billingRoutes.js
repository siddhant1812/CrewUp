const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  listPlans,
  getBilling,
  createCheckout,
  createPortal,
  cancelSubscription,
  resumeSubscription,
} = require("../controllers/billingController");

const router = express.Router();

router.get("/plans", listPlans);
router.get("/me", protect, getBilling);
router.post("/checkout", protect, createCheckout);
router.post("/portal", protect, createPortal);
router.post("/cancel", protect, cancelSubscription);
router.post("/resume", protect, resumeSubscription);

module.exports = router;
