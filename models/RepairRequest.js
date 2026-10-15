const mongoose = require("mongoose");

const repairRequestSchema =
  new mongoose.Schema(
    {
      // ======================================
      // RELATIONSHIPS
      // ======================================

      // Tenant is always required because the
      // repair request must belong to a logged-in
      // tenant account.
      tenant: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // These fields are OPTIONAL because the
      // current admin property/occupant records
      // are maintained locally in the frontend.
      //
      // When a MongoDB apartment/property/landlord
      // exists, these relationships are populated.
      landlord: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      property: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Property",
        default: null,
      },

      apartment: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Apartment",
        default: null,
      },

      // ======================================
      // REQUEST INFORMATION
      // ======================================

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      category: {
        type: String,

        enum: [
          "Plumbing",
          "Electrical",
          "Air Conditioning",
          "Water",
          "Carpentry",
          "Painting",
          "Doors / Windows",
          "Appliances",
          "Generator / Power",
          "Cleaning",
          "Other",
        ],

        default: "Other",
      },

      description: {
        type: String,
        required: true,
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

      // ======================================
      // REPAIR STATUS
      // ======================================

      status: {
        type: String,

        enum: [
          "Pending",
          "Assigned",
          "In Progress",
          "Completed",
          "Cancelled",
        ],

        default: "Pending",

        index: true,
      },

      // ======================================
      // MANAGEMENT RESPONSE
      // ======================================

      managementResponse: {
        type: String,

        trim: true,

        default: "",

        maxlength: 2000,
      },

      respondedAt: {
        type: Date,

        default: null,
      },

      // ======================================
      // WHO RESPONDED
      // ======================================
      //
      // This allows the system to know whether
      // the response came from an admin or landlord.
      // ======================================

      respondedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },

      respondedByRole: {
        type: String,

        enum: [
          "admin",
          "landlord",
        ],

        default: null,
      },

      // ======================================
      // COMPLETION
      // ======================================

      completedAt: {
        type: Date,

        default: null,
      },
    },

    {
      timestamps: true,
    }
  );

// ==========================================
// INDEXES
// ==========================================
//
// These make the common dashboard queries
// more efficient.
// ==========================================

repairRequestSchema.index({
  tenant: 1,
  createdAt: -1,
});

repairRequestSchema.index({
  landlord: 1,
  createdAt: -1,
});

repairRequestSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports =
  mongoose.model(
    "RepairRequest",
    repairRequestSchema
  );