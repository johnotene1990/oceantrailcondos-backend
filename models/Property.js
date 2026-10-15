const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    // ==========================================
    // PROPERTY OWNER
    // ==========================================

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================
    // PROPERTY INFORMATION
    // ==========================================

    name: {
      type: String,
      required: [true, "Property name is required"],
      trim: true,
    },

    propertyType: {
      type: String,
      enum: [
        "Condominium",
        "Apartment Building",
        "Estate",
        "House",
        "Commercial",
        "Other",
      ],
      default: "Condominium",
    },

    address: {
      type: String,
      required: [true, "Property address is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // PROPERTY STRUCTURE
    // ==========================================

    numberOfBlocks: {
      type: Number,
      default: 1,
      min: 1,
    },

    numberOfApartments: {
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
        "active",
        "inactive",
        "maintenance",
      ],
      default: "active",
    },

    // ==========================================
    // CONTACT
    // ==========================================

    contactPhone: {
      type: String,
      trim: true,
      default: "",
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Property",
  propertySchema
);