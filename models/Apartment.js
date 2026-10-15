const mongoose = require("mongoose");

const apartmentSchema = new mongoose.Schema(
  {
    // ==========================================
    // PROPERTY
    // ==========================================

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    // ==========================================
    // TENANT
    // ==========================================

    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ==========================================
    // APARTMENT INFORMATION
    // ==========================================

    apartmentNumber: {
      type: String,
      required: [
        true,
        "Apartment number is required",
      ],
      trim: true,
    },

    block: {
      type: String,
      trim: true,
      default: "",
    },

    floor: {
      type: String,
      trim: true,
      default: "",
    },

    apartmentType: {
      type: String,
      enum: [
        "Studio",
        "1 Bedroom",
        "2 Bedroom",
        "3 Bedroom",
        "4 Bedroom",
        "Penthouse",
        "Other",
      ],
      default: "2 Bedroom",
    },

    // ==========================================
    // FINANCIAL INFORMATION
    // ==========================================

    monthlyRent: {
      type: Number,
      default: 0,
      min: 0,
    },

    serviceCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================================
    // STATUS
    // ==========================================

    status: {
      type: String,
      enum: [
        "available",
        "occupied",
        "maintenance",
        "reserved",
      ],
      default: "available",
    },

    // ==========================================
    // DESCRIPTION
    // ==========================================

    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// PREVENT DUPLICATE APARTMENT NUMBERS
// WITHIN SAME PROPERTY/BLOCK
// ==========================================

apartmentSchema.index(
  {
    property: 1,
    block: 1,
    apartmentNumber: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "Apartment",
  apartmentSchema
);