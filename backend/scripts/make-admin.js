// One-time bootstrap: promote an existing CrewUp account to platform admin.
// There is no signup flow for admin accounts on purpose — this is the only
// way to create the first admin, and it must be run by someone with direct
// database access, not exposed as an API endpoint.
//
// Usage: node scripts/make-admin.js someone@example.com
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/make-admin.js someone@example.com");
    process.exit(1);
  }

  const connected = await connectDB();
  if (!connected) {
    console.error("Could not connect to a database.");
    process.exit(1);
  }

  const user = await User.findOneAndUpdate(
    { workEmail: email.toLowerCase().trim() },
    { role: "admin" },
    { new: true }
  );

  if (!user) {
    console.error(`No account found for ${email}.`);
  } else {
    console.log(`${user.fullName} <${user.workEmail}> is now an admin.`);
  }

  await mongoose.disconnect();
  process.exit(user ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
