const mongoose = require("mongoose");

// ==========================================
// REPAIR ATTACHMENT SCHEMA
// ==========================================

const repairAttachmentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      trim: true,
      default: "",
    },

    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      default: null,
    },

    mimeType: {
      type: String,
      default: "",
    },

    resourceType: {
      type: String,
      enum: ["image", "video", "raw", "document"],
      default: "document",
    },

    size: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

// ==========================================
// REPAIR CONVERSATION MESSAGE SCHEMA
// ==========================================

const repairMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderRole: {
      type: String,
      enum: [
        "tenant",
        "landlord",
        "admin",
        "super_admin",
        "property_manager",
      ],
      required: true,
    },

    message: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    attachments: {
      type: [repairAttachmentSchema],
      default: [],
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// ==========================================
// MAIN REPAIR REQUEST SCHEMA
// ==========================================

const repairRequestSchema = new mongoose.Schema(
  {
    // ======================================
    // RELATIONSHIPS
    // ======================================

    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },

    apartment: {
      type: mongoose.Schema.Types.ObjectId,
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
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    // ======================================
    // ORIGINAL REPAIR ATTACHMENTS
    // ======================================

    attachments: {
      type: [repairAttachmentSchema],
      default: [],
    },

    // ======================================
    // REPAIR CONVERSATION HISTORY
    // ======================================

    messages: {
      type: [repairMessageSchema],
      default: [],
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

    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    respondedByRole: {
      type: String,
      enum: [
        "admin",
        "landlord",
        "super_admin",
        "property_manager",
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

module.exports = mongoose.model(
  "RepairRequest",
  repairRequestSchema
);
