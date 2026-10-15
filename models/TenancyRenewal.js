const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, default: null },
    path: { type: String, default: null },
    mimeType: { type: String, default: null },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const tenancyRenewalSchema = new mongoose.Schema(
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

    tenantPhone: {
      type: String,
      default: "",
      trim: true,
    },

    block: {
      type: String,
      default: "",
      trim: true,
    },

    floor: {
      type: String,
      default: "",
      trim: true,
    },

    apartment: {
      type: String,
      default: "",
      trim: true,
    },

    currentExpirationDate: {
      type: Date,
      required: true,
    },

    requestedRenewalStartDate: {
      type: Date,
      required: true,
    },

    requestedRenewalEndDate: {
      type: Date,
      required: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "agreement_issued",
        "signed",
        "approved",
        "declined",
      ],
      default: "submitted",
    },

    landlordAgreement: {
      type: fileSchema,
      default: null,
    },

    signedAgreement: {
      type: fileSchema,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "TenancyRenewal",
  tenancyRenewalSchema
);