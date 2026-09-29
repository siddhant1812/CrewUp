const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

function securityHeaders() {
  return helmet({
    // The Vite app calls this API from another origin and loads /uploads images.
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  });
}

function redisStore(client, prefix) {
  if (!client) return undefined;
  return new RedisStore({
    prefix,
    sendCommand: (...args) => client.sendCommand(args),
  });
}

function tooMany(message) {
  return (_req, res) => {
    res.status(429).json({ success: false, message });
  };
}

function createLimiters(client) {
  const shared = {
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
  };

  const apiLimiter = rateLimit({
    ...shared,
    windowMs: 60 * 1000,
    limit: 200,
    ...(client ? { store: redisStore(client, "rl:api:") } : {}),
    handler: tooMany("Too many requests. Try again in a minute."),
  });

  const authLimiter = rateLimit({
    ...shared,
    windowMs: 15 * 60 * 1000,
    limit: 8,
    skipSuccessfulRequests: true,
    ...(client ? { store: redisStore(client, "rl:auth:") } : {}),
    handler: tooMany("Too many attempts. Try again in a few minutes."),
  });

  return { apiLimiter, authLimiter };
}

module.exports = { securityHeaders, createLimiters };
