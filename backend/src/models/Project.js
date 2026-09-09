const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },

    location: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
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

    dueDate: {
      type: Date,
      default: null,
    },

    image: {
      type: String,
      default: "",
    },

    trades: {
      type: [String],
      default: [],
    },

    bidsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["draft", "open", "in_progress", "completed", "cancelled"],
      default: "open",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ createdBy: 1, updatedAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
