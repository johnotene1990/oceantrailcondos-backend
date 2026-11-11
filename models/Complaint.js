// const mongoose = require("mongoose");

// const complaintSchema = new mongoose.Schema(
//   {
//     // ==========================================
//     // TENANT
//     // ==========================================

//     tenant: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     // ==========================================
//     // LANDLORD
//     // ==========================================

//     landlord: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: false, // Made optional to prevent validation errors when sending to admin
//     },

//     // ==========================================
//     // PROPERTY
//     // ==========================================

//     property: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Property",
//       required: true,
//     },

//     // ==========================================
//     // APARTMENT
//     // ==========================================

//     apartment: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Apartment",
//       required: true,
//     },

//     // ==========================================
//     // COMPLAINT INFORMATION
//     // ==========================================

//     subject: {
//       type: String,
//       required: [true, "Complaint subject is required"],
//       trim: true,
//       maxlength: 150,
//     },

//     category: {
//       type: String,
//       enum: [
//         "Maintenance", // Added to support your frontend submission
//         "Noise",
//         "Water",
//         "Electricity",
//         "Security",
//         "Cleanliness",
//         "Parking",
//         "Facility",
//         "Neighbour",
//         "Management",
//         "Other",
//       ],
//       default: "Other",
//     },

//     description: {
//       type: String,
//       required: [true, "Complaint description is required"],
//       trim: true,
//       maxlength: 2000,
//     },

//     priority: {
//       type: String,
//       enum: [
//         "Low",
//         "Medium",
//         "High",
//         "Urgent",
//       ],
//       default: "Medium",
//     },

//     status: {
//       type: String,
//       enum: [
//         "Pending",
//         "Under Review",
//         "In Progress",
//         "Resolved",
//         "Closed",
//       ],
//       default: "Pending",
//     },

//     // ==========================================
//     // RESPONSES
//     // ==========================================

//     landlordResponse: {
//       type: String,
//       trim: true,
//       default: "",
//       maxlength: 2000,
//     },

//     adminResponse: {
//       type: String,
//       trim: true,
//       default: "",
//       maxlength: 2000,
//     },

//     respondedAt: {
//       type: Date,
//       default: null,
//     },

//     // ==========================================
//     // CLOSING
//     // ==========================================

//     resolvedAt: {
//       type: Date,
//       default: null,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model(
//   "Complaint",
//   complaintSchema
// );





const mongoose = require("mongoose");

// ==========================================
// COMPLAINT ATTACHMENT SCHEMA
// Supports images, videos and documents
// ==========================================

const complaintAttachmentSchema = new mongoose.Schema(
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
      required: true,
    },

    resourceType: {
      type: String,
      enum: ["image", "video", "raw", "document"],
      default: "image",
    },

    size: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

// ==========================================
// COMPLAINT CONVERSATION SCHEMA
// Supports replies from tenants and admins
// ==========================================

const complaintMessageSchema = new mongoose.Schema(
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
      type: [complaintAttachmentSchema],
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
// MAIN COMPLAINT SCHEMA
// ==========================================

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
      required: false,
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
        "Maintenance",
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
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Under Review",
        "In Progress",
        "Awaiting Tenant",
        "Resolved",
        "Closed",
      ],
      default: "Pending",
    },

    // ==========================================
    // LEGACY SINGLE ATTACHMENT
    // Preserves compatibility with existing records
    // ==========================================

    attachment: {
      type: String,
      default: null,
    },

    // ==========================================
    // MULTIPLE COMPLAINT ATTACHMENTS
    // Images, videos and supporting documents
    // ==========================================

    attachments: {
      type: [complaintAttachmentSchema],
      default: [],
    },

    // ==========================================
    // TENANT / ADMIN CONVERSATION HISTORY
    // ==========================================

    messages: {
      type: [complaintMessageSchema],
      default: [],
    },

    // ==========================================
    // EXISTING RESPONSE FIELDS
    // Preserved for backward compatibility
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

// ==========================================
// DATABASE INDEXES
// ==========================================

complaintSchema.index({ tenant: 1, createdAt: -1 });

complaintSchema.index({ status: 1, createdAt: -1 });

complaintSchema.index({ property: 1, createdAt: -1 });

// ==========================================
// EXPORT MODEL
// ==========================================

module.exports = mongoose.model(
  "Complaint",
  complaintSchema
);
