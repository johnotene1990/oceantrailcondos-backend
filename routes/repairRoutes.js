const express = require("express");
const multer = require("multer");

const {
  createRepairRequest,
  getTenantRepairRequests,
  getTenantRepairRequest,
  getLandlordRepairRequests,
  updateRepairRequest,

  // ADMIN REPAIR CONTROLLERS
  getAdminRepairRequests,
  adminUpdateRepairRequest,

  // REPAIR CONVERSATION
  addRepairMessage,
} = require("../controllers/repairController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// ======================================================
// MULTER CONFIGURATION
// ======================================================

const allowedMimeTypes = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",

  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",

  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per file
    files: 10, // Maximum 10 files per request
  },

  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Unsupported file type. Upload JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, PDF, DOC or DOCX files."
        )
      );
    }

    cb(null, true);
  },
});

// ======================================================
// UPLOAD FIELDS
// ======================================================
//
// Supports the existing frontend field:
// image
//
// Also supports:
// attachments
// video
// videos
// file
//
// This allows older frontend code to continue working.
// ======================================================

const repairUploadFields = upload.fields([
  {
    name: "image",
    maxCount: 10,
  },
  {
    name: "attachments",
    maxCount: 10,
  },
  {
    name: "video",
    maxCount: 10,
  },
  {
    name: "videos",
    maxCount: 10,
  },
  {
    name: "file",
    maxCount: 10,
  },
]);

// ======================================================
// UPLOAD ERROR HANDLER
// ======================================================

const handleRepairUploads = (req, res, next) => {
  repairUploadFields(req, res, (error) => {
    if (error) {
      console.error("Repair upload error:", error);

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Repair attachment upload failed.",
      });
    }

    next();
  });
};

// ======================================================
// AUTHENTICATION
// ======================================================
//
// All repair endpoints require authentication.
// ======================================================

router.use(protect);

// ======================================================
// TENANT
// ======================================================

// CREATE REPAIR REQUEST
//
// Accepts repair details and uploaded attachments.
//
// Existing frontend usage remains supported:
// formData.append("image", imageFile);
//
// New frontend usage:
// formData.append("attachments", file);
// ======================================================

router.post(
  "/",
  handleRepairUploads,
  createRepairRequest
);

// GET ALL TENANT REPAIR REQUESTS

router.get(
  "/tenant",
  getTenantRepairRequests
);

// GET SINGLE TENANT REPAIR REQUEST

router.get(
  "/tenant/:id",
  getTenantRepairRequest
);

// ======================================================
// REPAIR CONVERSATION
// ======================================================
//
// Tenants, landlords and authorised management users
// can send messages and attachments.
//
// The controller checks whether the logged-in user
// is allowed to access the particular repair request.
// ======================================================

router.post(
  "/:id/messages",
  handleRepairUploads,
  addRepairMessage
);

// ======================================================
// ADMIN
// ======================================================

// GET ALL REPAIR REQUESTS FOR ADMIN

router.get(
  "/admin",
  adminOnly,
  getAdminRepairRequests
);

// ADMIN UPDATE REPAIR REQUEST

router.put(
  "/admin/:id",
  adminOnly,
  handleRepairUploads,
  adminUpdateRepairRequest
);

// ======================================================
// LANDLORD
// ======================================================

// GET LANDLORD REPAIR REQUESTS

router.get(
  "/landlord",
  getLandlordRepairRequests
);

// LANDLORD UPDATE REPAIR REQUEST

router.put(
  "/:id",
  handleRepairUploads,
  updateRepairRequest
);

// ======================================================
// MULTER ERROR HANDLING
// ======================================================

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error("Multer repair error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Repair attachment upload failed.",
    });
  }

  next(error);
});

module.exports = router;
