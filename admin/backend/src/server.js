const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const { securityHeaders, createAuthLimiter } = require("./middleware/security");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const authLimiter = createAuthLimiter();

app.use(securityHeaders());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "CrewUp Admin API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

const PORT = process.env.PORT || 5001;

async function start() {
  const connected = await connectDB();

  if (!connected) {
    console.error("No database available. Fix MONGO_URI / Atlas, then restart.");
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Admin API running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start admin server:", err.message);
  process.exit(1);
});
