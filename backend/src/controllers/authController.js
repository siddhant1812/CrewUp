const path = require("path");
const fs = require("fs");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const uploadDir = path.join(__dirname, "../../uploads/profiles");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Profile photo must be an image."));
    }
    cb(null, true);
  },
});

const uploadProfilePhoto = upload.single("profilePhoto");

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

function ensureDb(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: "Database is not connected. Check MongoDB / Atlas settings.",
    });
    return false;
  }
  return true;
}

function publicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    workEmail: user.workEmail,
    company: user.company,
    contractorType: user.contractorType,
    profilePhoto: user.profilePhoto || user.profileImage || "",
    role: user.role,
    plan: user.plan || "starter",
    subscriptionStatus: user.subscriptionStatus || "none",
  };
}

const register = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const {
      fullName,
      workEmail,
      company,
      contractorType,
      password,
      confirmPassword,
      acceptTerms,
    } = req.body;

    const termsOk =
      acceptTerms === true ||
      acceptTerms === "true" ||
      acceptTerms === "on" ||
      acceptTerms === "1";

    if (!fullName || !workEmail || !contractorType || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    if (!termsOk) {
      return res.status(400).json({
        success: false,
        message: "You must accept the Terms of Service and Privacy Policy.",
      });
    }

    if (!["general_contractor", "subcontractor"].includes(contractorType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contractor type.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(workEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid work email.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const existingUser = await User.findOne({
      workEmail: workEmail.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const profilePhoto = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : "";

    const user = await User.create({
      fullName: fullName.trim(),
      workEmail: workEmail.toLowerCase().trim(),
      company: company ? company.trim() : "",
      contractorType,
      profilePhoto,
      password: hashedPassword,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      role: "business",
      plan: "starter",
      subscriptionStatus: "none",
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong while creating your account.",
    });
  }
};

const login = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { workEmail, password } = req.body;

    if (!workEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Work email and password are required.",
      });
    }

    const user = await User.findOne({
      workEmail: workEmail.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in.",
    });
  }
};

module.exports = { register, login, uploadProfilePhoto };
