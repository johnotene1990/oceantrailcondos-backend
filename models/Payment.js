const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    apartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "service_charge",
        "utility",
        "other",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "NGN",
    },

    reference: {
      type: String,
      unique: true,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "successful",
        "failed",
        "reversed",
      ],
      default: "pending",
    },

    gateway: {
      type: String,
      default: "paystack",
    },

    gatewayTransactionId: {
      type: String,
      default: null,
    },

    gatewayChannel: {
      type: String,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Payment",
  paymentSchema
);