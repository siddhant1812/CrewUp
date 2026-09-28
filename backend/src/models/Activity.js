const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    detail: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

activitySchema.index({ user: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);

async function logActivity(userId, type, title, detail = "") {
  if (!userId) return;
  try {
    await Activity.create({ user: userId, type, title, detail });
  } catch (err) {
    console.error("logActivity:", err.message);
  }
}

module.exports = { Activity, logActivity };
