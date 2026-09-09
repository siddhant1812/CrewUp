const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const projectRoutes = require("./routes/projectRoutes");
const billingRoutes = require("./routes/billingRoutes");
const { stripeWebhook } = require("./controllers/billingController");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/billing", billingRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CrewUp API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  const connected = await connectDB();

  if (!connected) {
    console.error("No database available. Fix MONGO_URI / Atlas, then restart.");
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
