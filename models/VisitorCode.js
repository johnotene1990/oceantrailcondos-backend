const mongoose = require("mongoose");

const visitorAccessSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    visitorName: {
      type: String,
      required: true,
      trim: true,
    },

    visitorPhone: {
      type: String,
      default: "",
      trim: true,
    },

    purpose: {
      type: String,
      required: true,
      trim: true,
    },

    estateLocation: {
      type: String,
      required: true,
      trim: true,
    },

    timeIn: {
      type: Date,
      required: true,
    },

    timeOut: {
      type: Date,
      required: true,
    },

    accessCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "active",
        "used",
        "expired",
        "cancelled",
      ],
      default: "active",
    },

    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "VisitorAccess",
  visitorAccessSchema
);