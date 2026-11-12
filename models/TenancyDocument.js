// const mongoose = require("mongoose");
// const sendEmail = require("../utils/sendEmail");

// const tenancyDocumentSchema = new mongoose.Schema(
//   {
//     // ==========================================
//     // PEOPLE
//     // ==========================================

//     landlord: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     tenant: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     // ==========================================
//     // PROPERTY
//     // ==========================================

//     property: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Property",
//       required: true,
//     },

//     apartment: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Apartment",
//       required: true,
//     },

//     // ==========================================
//     // DOCUMENT INFORMATION
//     // ==========================================

//     documentType: {
//       type: String,
//       enum: [
//         "agreement",
//         "renewal",
//       ],
//       required: true,
//     },

//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     description: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     // ==========================================
//     // ORIGINAL FILE
//     // ==========================================

//     originalFileName: {
//       type: String,
//       required: true,
//     },

//     originalFilePath: {
//       type: String,
//       required: true,
//     },

//     // ==========================================
//     // SIGNED FILE
//     // ==========================================

//     signedFileName: {
//       type: String,
//       default: null,
//     },

//     signedFilePath: {
//       type: String,
//       default: null,
//     },

//     // ==========================================
//     // SIGNATURE STATUS
//     // ==========================================

//     status: {
//       type: String,
//       enum: [
//         "pending_signature",
//         "signed",
//       ],
//       default: "pending_signature",
//     },

//     // ==========================================
//     // ELECTRONIC SIGNATURE
//     // ==========================================

//     signatureImage: {
//       type: String,
//       default: null,
//     },

//     signedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     signedAt: {
//       type: Date,
//       default: null,
//     },

//     // ==========================================
//     // AUDIT INFORMATION
//     // ==========================================

//     signatureIp: {
//       type: String,
//       default: null,
//     },

//     signatureUserAgent: {
//       type: String,
//       default: null,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model(
//   "TenancyDocument",
//   tenancyDocumentSchema
// );





const mongoose = require("mongoose");

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

    documentReference: {
      type: String,
      default: null,
      index: true,
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
        "completed",
      ],
      default: "pending_signature",
    },

    // ==========================================
    // EXISTING SIGNATURE FIELDS
    // RETAINED FOR COMPATIBILITY
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

    signatureIp: {
      type: String,
      default: null,
    },

    signatureUserAgent: {
      type: String,
      default: null,
    },

    // ==========================================
    // TENANT ELECTRONIC SIGNATURE
    // ==========================================

    tenantSignatureImage: {
      type: String,
      default: null,
    },

    tenantSignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    tenantSignedAt: {
      type: Date,
      default: null,
    },

    tenantSignatureIp: {
      type: String,
      default: null,
    },

    tenantSignatureUserAgent: {
      type: String,
      default: null,
    },

    // ==========================================
    // LANDLORD ELECTRONIC COUNTERSIGNATURE
    // ==========================================

    landlordSignatureImage: {
      type: String,
      default: null,
    },

    landlordSignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    landlordSignedAt: {
      type: Date,
      default: null,
    },

    landlordSignatureIp: {
      type: String,
      default: null,
    },

    landlordSignatureUserAgent: {
      type: String,
      default: null,
    },

    // ==========================================
    // LANDLORD APPROVAL
    // ==========================================

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // DOCUMENT COMPLETION
    // ==========================================

    completedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // AUDIT INFORMATION
    // ==========================================

    signatureAudit: [
      {
        signer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        role: {
          type: String,
          enum: [
            "tenant",
            "landlord",
          ],
        },

        signedAt: {
          type: Date,
        },

        ipAddress: {
          type: String,
          default: null,
        },

        userAgent: {
          type: String,
          default: null,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ==========================================
// INDEXES
// ==========================================

tenancyDocumentSchema.index({
  tenant: 1,
  status: 1,
});

tenancyDocumentSchema.index({
  landlord: 1,
  status: 1,
});

tenancyDocumentSchema.index({
  property: 1,
  apartment: 1,
});

module.exports = mongoose.model(
  "TenancyDocument",
  tenancyDocumentSchema
);
