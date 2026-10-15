const mongoose = require("mongoose");

const serviceChargeSchema = new mongoose.Schema(
  {
    tenant: {
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
    title: {
      type: String,
      required: true,
      default: "Service Charge",
    },
    description: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "proof_submitted", "partially_paid", "paid", "overdue", "cancelled"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    periodStart: {
      type: Date,
      default: null,
    },
    periodEnd: {
      type: Date,
      default: null,
    },
    paymentDetails: {
      receiptData: Buffer, // Storing file buffer or use URL if uploaded to cloud storage
      contentType: String,
      originalName: String,
      submittedAt: Date,
      confirmedAt: Date,
      confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceCharge", serviceChargeSchema);