const express = require("express");
const multer = require("multer");

const {
  createRepairRequest,
  getTenantRepairRequests,
  getTenantRepairRequest,
  getLandlordRepairRequests,
  updateRepairRequest,

  // ==========================================
  // ADMIN REPAIR CONTROLLERS
  // ==========================================
  getAdminRepairRequests,
  adminUpdateRepairRequest,
} = require("../controllers/repairController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// ==========================================
// MULTER CONFIGURATION
// ==========================================
//
// The tenant repair page submits FormData because
// it can contain an optional image.
//
// We use memoryStorage for now because the current
// RepairRequest model does not need to permanently
// store the image.
//
// This allows req.body to be correctly populated
// from multipart/form-data without changing the
// tenant UI.
//
// Maximum image size: 5MB
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only JPG, JPEG, PNG and WEBP images are allowed."
        )
      );
    }

    cb(null, true);
  },
});

// ==========================================
// AUTHENTICATION
// ==========================================
//
// All repair endpoints require a logged-in user.
// ==========================================

router.use(protect);

// ==========================================
// TENANT
// ==========================================

// CREATE REPAIR REQUEST
//
// IMPORTANT:
// upload.single("image") matches the frontend:
//
// formData.append("image", imageFile);
//
// The image is accepted but not permanently stored
// at this stage.
// ==========================================

router.post(
  "/",
  (req, res, next) => {
    upload.single("image")(req, res, (error) => {
      if (error) {
        console.error(
          "Repair image upload error:",
          error
        );

        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      next();
    });
  },
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

// ==========================================
// ADMIN
// ==========================================
//
// These routes are deliberately separate from
// the landlord routes.
//
// This allows the admin dashboard to see every
// repair request, regardless of landlord.
// ==========================================

// GET ALL REPAIR REQUESTS FOR ADMIN
router.get(
  "/admin",
  adminOnly,
  getAdminRepairRequests
);

// ADMIN RESPOND / UPDATE REPAIR REQUEST
router.put(
  "/admin/:id",
  adminOnly,
  adminUpdateRepairRequest
);

// ==========================================
// LANDLORD
// ==========================================

// GET LANDLORD REPAIR REQUESTS
router.get(
  "/landlord",
  getLandlordRepairRequests
);

// LANDLORD UPDATE REPAIR REQUEST
router.put(
  "/:id",
  updateRepairRequest
);

// ==========================================
// MULTER ERROR HANDLING
// ==========================================
//
// Handles any Multer error that somehow reaches
// the router.
// ==========================================

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error(
      "Multer repair error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Repair image upload failed.",
    });
  }

  next(error);
});

module.exports = router;