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

    // Category: a project type (contractor posts) or trade category (subcontractor posts)
    projectType: {
      type: String,
      default: "Commercial",
      trim: true,
    },
    service: {
      type: String,
      default: "",
      trim: true,
    },
    postedByRole: {
      type: String,
      enum: ["contractor", "subcontractor"],
      default: "contractor",
      index: true,
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

    vacancies: {
      type: Number,
      default: 1,
      min: 1,
      max: 1000,
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

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
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
projectSchema.index({ status: 1, updatedAt: -1 });
projectSchema.index({ status: 1, location: 1 });
projectSchema.index({ status: 1, trades: 1 });

module.exports = mongoose.model("Project", projectSchema);
