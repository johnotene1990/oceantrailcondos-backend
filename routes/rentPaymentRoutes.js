
const express = require("express");
const multer = require("multer");

const protect = require("../middleware/authMiddleware");

const {
  createRentPayment,
  getTenantRentPayments,
  getLandlordRentPayments,
  getAdminRentPayments,
  updateRentPaymentStatus,
} = require("../controllers/rentPaymentController");

const router = express.Router();

// ==========================================================
// RECEIPT UPLOAD
// ==========================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only PDF, JPG, PNG and WEBP receipts are allowed."
        )
      );
    }

    cb(null, true);
  },
});

// ==========================================================
// ROLE CHECK
// ==========================================================

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const role = normalizeRole(
    req.user.role ||
      req.user.userRole ||
      req.user.userType ||
      req.user.accountType
  );

  if (
    ![
      "admin",
      "super_admin",
      "administrator",
      "property_manager",
    ].includes(role)
  ) {
    return res.status(403).json({
      success: false,
      message: "Administrator access required.",
    });
  }

  req.user.role = role;
  next();
};

// ==========================================================
// AUTHENTICATION
// ==========================================================

router.use(protect);

// ==========================================================
// TENANT
// ==========================================================

router.post(
  "/",
  upload.single("receipt"),
  createRentPayment
);

router.get(
  "/tenant",
  getTenantRentPayments
);

// ==========================================================
// LANDLORD
// ==========================================================

router.get(
  "/landlord",
  getLandlordRentPayments
);

// ==========================================================
// ADMIN
// ==========================================================

router.get(
  "/admin",
  adminOnly,
  getAdminRentPayments
);

router.patch(
  "/:id/status",
  adminOnly,
  updateRentPaymentStatus
);

module.exports = router;
