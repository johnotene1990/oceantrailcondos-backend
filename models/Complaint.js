const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    // ==========================================
    // TENANT
    // ==========================================

    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================
    // LANDLORD
    // ==========================================

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Made optional to prevent validation errors when sending to admin
    },

    // ==========================================
    // PROPERTY
    // ==========================================

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    // ==========================================
    // APARTMENT
    // ==========================================

    apartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
    },

    // ==========================================
    // COMPLAINT INFORMATION
    // ==========================================

    subject: {
      type: String,
      required: [true, "Complaint subject is required"],
      trim: true,
      maxlength: 150,
    },

    category: {
      type: String,
      enum: [
        "Maintenance", // Added to support your frontend submission
        "Noise",
        "Water",
        "Electricity",
        "Security",
        "Cleanliness",
        "Parking",
        "Facility",
        "Neighbour",
        "Management",
        "Other",
      ],
      default: "Other",
    },

    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
      maxlength: 2000,
    },

    priority: {
      type: String,
      enum: [
        "Low",
        "Medium",
        "High",
        "Urgent",
      ],
      default: "Medium",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Under Review",
        "In Progress",
        "Resolved",
        "Closed",
      ],
      default: "Pending",
    },

    // ==========================================
    // RESPONSES
    // ==========================================

    landlordResponse: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    adminResponse: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // CLOSING
    // ==========================================

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Complaint",
  complaintSchema
);