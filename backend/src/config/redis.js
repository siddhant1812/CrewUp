const { createClient } = require("redis");

let status = "disabled";

function getRedisStatus() {
  return status;
}

async function connectRedis() {
  const url = process.env.REDIS_URL;

  if (!url) {
    status = "disabled";
    console.log("REDIS_URL not set. Rate limits stay in this server's memory.");
    return null;
  }

  const client = createClient({
    url,
    socket: { connectTimeout: 2000 },
  });

  client.on("error", (err) => {
    console.error("Redis error:", err.message);
  });

  try {
    await client.connect();
    status = "connected";
    console.log("Redis connected");
    return client;
  } catch (err) {
    status = "unavailable";
    console.warn(
      "Redis unavailable. Rate limits stay in this server's memory.",
      err.message
    );
    try {
      await client.disconnect();
    } catch {
      /* ignore */
    }
    return null;
  }
}

module.exports = { connectRedis, getRedisStatus };
