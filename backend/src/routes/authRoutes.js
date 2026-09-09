const express = require("express");
const {
  register,
  login,
  uploadProfilePhoto,
} = require("../controllers/authController");

const router = express.Router();

// Multipart signup (profile photo + fields from FormData)
router.post("/signup", (req, res) => {
  uploadProfilePhoto(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid profile photo upload.",
      });
    }
    return register(req, res);
  });
});

router.post("/login", login);

module.exports = router;
