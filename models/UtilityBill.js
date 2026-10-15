const mongoose = require("mongoose");

const utilityBillPaymentSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tenantName: {
      type: String,
      required: true,
      trim: true,
    },

    tenantEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    utilityType: {
      type: String,
      enum: [
        "electricity",
        "water",
        "other",
      ],
      default: "electricity",
    },

    meterNumber: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    transactionReference: {
      type: String,
      required: true,
      trim: true,
    },

    billingPeriod: {
      type: String,
      default: "",
      trim: true,
    },

    receipt: {
      originalName: {
        type: String,
        default: null,
      },

      path: {
        type: String,
        default: null,
      },

      mimeType: {
        type: String,
        default: null,
      },

      size: {
        type: Number,
        default: 0,
      },
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "VENDED",
        "FAILED",
      ],
      default: "PENDING",
    },

    token: {
      type: String,
      default: null,
      trim: true,
    },

    units: {
      type: Number,
      default: null,
    },

    vendorReference: {
      type: String,
      default: null,
      trim: true,
    },

    vendorResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    vendedAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "UtilityBillPayment",
  utilityBillPaymentSchema
);