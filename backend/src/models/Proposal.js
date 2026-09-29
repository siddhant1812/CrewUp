const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    proposal: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8000,
    },
    timeline: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "withdrawn"],
      default: "pending",
    },
  },
  { timestamps: true }
);

proposalSchema.index({ project: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model("Proposal", proposalSchema);
