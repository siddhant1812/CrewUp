const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  accountKind,
  buildPermissions,
  authorizePermission,
} = require("../auth/permissions");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active.",
      });
    }

    req.user = user;
    req.accountKind = accountKind(user);
    req.permissions = buildPermissions(user);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
};

// Reads the JWT if present and attaches req.user, but never blocks the
// request — for routes that are public but behave differently when logged in.
const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (user && user.accountStatus === "active") {
      req.user = user;
      req.accountKind = accountKind(user);
      req.permissions = buildPermissions(user);
    }
  } catch {
    /* invalid/expired token on a public route: just proceed as a guest */
  }
  next();
};

// Use after `protect`. Only a user with role "admin" may proceed — the
// admin panel's routes use this instead of authorizePermission(), since
// admin access is an unconditional override, not a per-feature permission.
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  requireAdmin,
  authorizePermission,
};
