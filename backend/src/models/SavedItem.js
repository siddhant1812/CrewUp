const mongoose = require("mongoose");

const savedItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    itemType: {
      type: String,
      enum: [
        "project",
        "contractor",
      ],
      required: true,
    },

    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

savedItemSchema.index(
  {
    user: 1,
    itemType: 1,
    itemId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "SavedItem",
  savedItemSchema
);