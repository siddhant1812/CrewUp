const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

function securityHeaders() {
  return helmet({ contentSecurityPolicy: false });
}

// BUG FIX: this login guards the single most powerful account type in the
// app (admin), but had no throttling at all — unlike the main backend's
// /api/auth/login, which rate-limits by IP+email. Without this, the admin
// login was wide open to unlimited password-guessing.
function createAuthLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    // Plain string concatenation of req.ip breaks IPv6 clients (each one
    // has many valid textual forms for the same address, so it's trivial to
    // dodge the limit) — ipKeyGenerator normalizes it the same way the main
    // backend's security.js already does.
    keyGenerator: (req) => {
      const email = String(req.body?.workEmail || "").toLowerCase().trim();
      return `${ipKeyGenerator(req.ip)}|${email}`;
    },
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many attempts. Try again in a few minutes.",
      });
    },
  });
}

module.exports = { securityHeaders, createAuthLimiter };
