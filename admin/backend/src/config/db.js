const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");

// Prefer IPv4 — fixes many Atlas TLS handshake failures on Windows/Node
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI missing in admin/backend/.env");
    return false;
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 12000,
        family: 4,
      });
      console.log("MongoDB Atlas connected (admin backend)");
      return true;
    } catch (error) {
      console.error(
        `Atlas connection failed (attempt ${attempt}/3):`,
        error.message.split("\n")[0]
      );
      try {
        await mongoose.disconnect();
      } catch {
        /* ignore */
      }
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }

  return false;
}

module.exports = connectDB;
