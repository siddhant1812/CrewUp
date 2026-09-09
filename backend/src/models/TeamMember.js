const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: [
        "admin",
        "manager",
        "member",
      ],
      default: "member",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "removed",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "TeamMember",
  teamMemberSchema
);