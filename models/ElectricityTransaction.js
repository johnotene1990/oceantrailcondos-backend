const mongoose = require('mongoose');

const electricityTransactionSchema = new mongoose.Schema(
  {
    // Tenant & Property Associations
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
    },
    
    // Smart Meter Data
    meterNumber: {
      type: String,
      required: [true, 'Meter number is required'],
      trim: true,
      index: true,
    },
    
    // Payment Details
    amountPaid: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    bankName: {
      type: String,
      default: 'Zenith Bank',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'SUCCESSFUL', 'FAILED'],
      default: 'PENDING',
    },

    // Smart Meter API Handshake Results
    vendingStatus: {
      type: String,
      enum: ['PENDING', 'SUCCESSFUL', 'FAILED', 'MANUAL_INTERVENTION_REQUIRED'],
      default: 'PENDING',
      index: true,
    },
    token: {
      type: String,
      trim: true,
    },
    unitsPurchased: {
      type: String, // e.g. "117.65 kWh"
      trim: true,
    },
    externalVendorRef: {
      type: String, // Reference returned by the external smart meter API
      trim: true,
    },
    vendingErrorMessage: {
      type: String,
    },

    // Token Delivery Tracking
    deliveryStatus: {
      email: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        recipient: { type: String },
        error: { type: String },
      },
      sms: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        recipient: { type: String },
        error: { type: String },
      },
    },
  },
  {
    timestamps: true, // Auto-creates createdAt and updatedAt
  }
);

// Compound Index for quick history lookups per tenant
electricityTransactionSchema.index({ tenant: 1, createdAt: -1 });

module.exports = mongoose.model('ElectricityTransaction', electricityTransactionSchema);