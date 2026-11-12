
const mongoose = require("mongoose");

const rentPaymentSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    apartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "NGN",
      trim: true,
    },

    paymentReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "cash", "card", "other"],
      default: "bank_transfer",
    },

    paymentPeriod: {
      type: String,
      default: "",
      trim: true,
    },

    // ======================================================
    // PAYMENT RECEIPT
    // ======================================================

    receipt: {
      originalName: {
        type: String,
        default: null,
      },

      data: {
        type: Buffer,
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
      enum: ["pending", "successful", "failed", "reversed"],
      default: "pending",
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// ==========================================================
// INDEXES
// ==========================================================

rentPaymentSchema.index({ tenant: 1, createdAt: -1 });

rentPaymentSchema.index({ landlord: 1, createdAt: -1 });

rentPaymentSchema.index({
  property: 1,
  apartment: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "RentPayment",
  rentPaymentSchema
);
