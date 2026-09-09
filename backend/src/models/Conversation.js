const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    /** Sorted participant ids joined with "_" for unique 1:1 lookup */
    pairKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    projectTitle: {
      type: String,
      default: "",
      trim: true,
    },

    projectLocation: {
      type: String,
      default: "",
      trim: true,
    },

    projectType: {
      type: String,
      default: "Commercial",
      trim: true,
    },

    budget: {
      type: String,
      default: "",
      trim: true,
    },

    bidDeadline: {
      type: Date,
      default: null,
    },

    trades: {
      type: [String],
      default: [],
    },

    projectImage: {
      type: String,
      default: "",
    },

    lastMessage: {
      text: { type: String, default: "" },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      createdAt: { type: Date, default: null },
    },

    unread: {
      type: Map,
      of: Number,
      default: {},
    },

    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
