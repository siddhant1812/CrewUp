const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");

// Prefer IPv4 — fixes many Atlas TLS handshake failures on Windows/Node
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

let memoryServer = null;

async function connectAtlas(uri) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 12000,
    family: 4,
  });
}

async function connectMemory() {
  const { MongoMemoryServer } = require("mongodb-memory-server");
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri("crewup");
  await mongoose.connect(uri);
  return uri;
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (uri) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await connectAtlas(uri);
        console.log("MongoDB Atlas connected");
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
  } else {
    console.warn("MONGO_URI missing in .env");
  }

  try {
    console.warn("Falling back to in-memory MongoDB for local development...");
    await connectMemory();
    console.log("In-memory MongoDB connected (data resets when server stops)");
    return true;
  } catch (error) {
    console.error("In-memory MongoDB failed:", error.message);
    return false;
  }
};

module.exports = connectDB;
