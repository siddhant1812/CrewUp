const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { accountKind, buildPermissions } = require("../auth/permissions");

const ADMIN_CODE = process.env.ADMIN_CODE;

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

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

function publicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    workEmail: user.workEmail,
    role: user.role,
    accountKind: accountKind(user),
    permissions: buildPermissions(user),
  };
}

// Anyone who can sign up here gets role: "admin" immediately — there is no
// lesser account type in this app, so a plain signup IS an admin signup.
// Keep that in mind before exposing this service's URL anywhere public.
const signup = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { fullName, workEmail, password, confirmPassword, adminCode } = req.body;

    if (!fullName || !workEmail || !password || !confirmPassword || !adminCode) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all fields.",
      });
    }

    if (adminCode !== ADMIN_CODE) {
      return res.status(403).json({ success: false, message: "Invalid admin code." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(workEmail)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email." });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    const normalizedEmail = workEmail.toLowerCase().trim();
    const existing = await User.findOne({ workEmail: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName: fullName.trim(),
      workEmail: normalizedEmail,
      password: hashed,
      role: "admin",
      accountStatus: "active",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Admin signup error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong while creating your account.",
    });
  }
};

// Only an account whose role is already "admin" (set here by signup, or via
// backend/scripts/make-admin.js for an existing CrewUp account) is allowed
// past this.
const login = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { workEmail, password, adminCode } = req.body;

    if (!workEmail || !password || !adminCode) {
      return res.status(400).json({
        success: false,
        message: "Work email, password, and admin code are required.",
      });
    }

    if (adminCode !== ADMIN_CODE) {
      return res.status(403).json({ success: false, message: "Invalid admin code." });
    }

    const normalizedEmail = workEmail.toLowerCase().trim();

    const user = await User.findOne({
      workEmail: normalizedEmail,
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

    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "This account does not have admin access.",
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
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in.",
    });
  }
};

module.exports = { login, signup };
