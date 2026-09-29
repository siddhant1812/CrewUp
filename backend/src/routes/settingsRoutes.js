const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadDocument,
  uploadProfilePhoto,
  updateProfilePhoto,
  getSettings,
  updateAccount,
  updateCompany,
  updateNotifications,
  updateBidPreferences,
  updatePayouts,
  changePassword,
  toggleTwoFactor,
  listTeam,
  inviteTeam,
  removeTeam,
  listDocuments,
  uploadAccountDocument,
  deleteDocument,
  listActivity,
} = require("../controllers/settingsController");

const router = express.Router();
router.use(protect);

router.get("/", getSettings);
router.post("/photo", (req, res) => {
  uploadProfilePhoto(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid profile photo.",
      });
    }
    return updateProfilePhoto(req, res);
  });
});
router.patch("/account", updateAccount);
router.patch("/company", updateCompany);
router.patch("/notifications", updateNotifications);
router.patch("/bid-preferences", updateBidPreferences);
router.patch("/payouts", updatePayouts);
router.patch("/password", changePassword);
router.patch("/two-factor", toggleTwoFactor);
router.get("/team", listTeam);
router.post("/team", inviteTeam);
router.delete("/team/:id", removeTeam);
router.get("/documents", listDocuments);
router.post("/documents", (req, res) => {
  uploadDocument(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid file upload.",
      });
    }
    return uploadAccountDocument(req, res);
  });
});
router.delete("/documents/:id", deleteDocument);
router.get("/activity", listActivity);

module.exports = router;
