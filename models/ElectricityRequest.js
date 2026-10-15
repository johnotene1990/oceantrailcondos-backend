const mongoose = require("mongoose");

const electricityRequestSchema = new mongoose.Schema(
  {
    meterNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    tenantName: { type: String },
    tenantEmail: { type: String },
    tenantPhone: { type: String },
    senderName: { type: String },
    senderBank: { type: String },
    transactionReference: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    token: { type: String },
    unitsKwh: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ElectricityRequest", electricityRequestSchema);