const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    workEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },

    company: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    contractorType: {
      type: String,
      enum: [
        "general_contractor",
        "subcontractor",
      ],
      default: "general_contractor",
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: [
        "business",
        "provider",
        "admin",
      ],
      default: "business",
    },

    termsAccepted: {
      type: Boolean,
      default: false,
    },

    termsAcceptedAt: {
      type: Date,
      default: null,
    },

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    emailPreferences: {
      projectUpdates: {
        type: Boolean,
        default: true,
      },

      newMessages: {
        type: Boolean,
        default: true,
      },

      proposalActivity: {
        type: Boolean,
        default: true,
      },

      marketingEmails: {
        type: Boolean,
        default: false,
      },
    },

    accountStatus: {
      type: String,
      enum: [
        "active",
        "deactivated",
        "deleted",
      ],
      default: "active",
    },

    plan: {
      type: String,
      enum: ["starter", "pro", "business"],
      default: "starter",
    },

    subscriptionStatus: {
      type: String,
      enum: [
        "none",
        "incomplete",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
      ],
      default: "none",
    },

    stripeCustomerId: {
      type: String,
      default: "",
      index: true,
    },

    stripeSubscriptionId: {
      type: String,
      default: "",
    },

    stripePriceId: {
      type: String,
      default: "",
    },

    currentPeriodEnd: {
      type: Date,
      default: null,
    },

    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },

    paymentMethodBrand: {
      type: String,
      default: "",
    },

    paymentMethodLast4: {
      type: String,
      default: "",
    },

    paymentMethodExpMonth: {
      type: Number,
      default: null,
    },

    paymentMethodExpYear: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "User",
  userSchema
);