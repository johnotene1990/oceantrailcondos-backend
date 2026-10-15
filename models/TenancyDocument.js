const mongoose = require("mongoose");
const sendEmail = require("../utils/sendEmail");

const tenancyDocumentSchema = new mongoose.Schema(
  {
    // ==========================================
    // PEOPLE
    // ==========================================

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================
    // PROPERTY
    // ==========================================

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

    // ==========================================
    // DOCUMENT INFORMATION
    // ==========================================

    documentType: {
      type: String,
      enum: [
        "agreement",
        "renewal",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // ORIGINAL FILE
    // ==========================================

    originalFileName: {
      type: String,
      required: true,
    },

    originalFilePath: {
      type: String,
      required: true,
    },

    // ==========================================
    // SIGNED FILE
    // ==========================================

    signedFileName: {
      type: String,
      default: null,
    },

    signedFilePath: {
      type: String,
      default: null,
    },

    // ==========================================
    // SIGNATURE STATUS
    // ==========================================

    status: {
      type: String,
      enum: [
        "pending_signature",
        "signed",
      ],
      default: "pending_signature",
    },

    // ==========================================
    // ELECTRONIC SIGNATURE
    // ==========================================

    signatureImage: {
      type: String,
      default: null,
    },

    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    signedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // AUDIT INFORMATION
    // ==========================================

    signatureIp: {
      type: String,
      default: null,
    },

    signatureUserAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "TenancyDocument",
  tenancyDocumentSchema
);