const express = require("express");
const multer = require("multer");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  getTenantCharges,
  submitPaymentProof,
} = require("../controllers/serviceChargeController");

const {
  getAdminApartments,
  getAdminPaymentRecords,
  createOrUpdateApartmentServiceCharge,
  confirmPayment,
  getPaymentReceipt,
  deleteServiceCharge,
} = require("../controllers/adminServiceChargeController");

const router = express.Router();

// ==========================================================
// MULTER SETUP FOR PAYMENT RECEIPTS
// ==========================================================
//
// Receipt files remain attached to the ServiceCharge record.
// No new receipt collection or storage system is created.
//
// Maximum: 5MB
// Allowed: PDF, JPG, JPEG, PNG, WEBP
// ==========================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only PDF, JPG, JPEG, PNG and WEBP receipt files are allowed."
        )
      );
    }

    cb(null, true);
  },
});

// ==========================================================
// PROTECT ALL SERVICE CHARGE ROUTES
// ==========================================================

router.use(protect);

// ==========================================================
// TENANT
// ==========================================================

// Tenant gets own service charges
router.get(
  "/tenant",
  getTenantCharges
);

// ==========================================================
// TENANT RECEIPT SUBMISSION
// ==========================================================
//
// Existing endpoint:
//
// POST /api/service-charges/:id/submit-proof
//
// ==========================================================

router.post(
  "/:id/submit-proof",
  upload.single("receipt"),
  submitPaymentProof
);

// ==========================================================
// TENANT RECEIPT COMPATIBILITY ROUTE
// ==========================================================
//
// TenantServiceCharge currently sends:
//
// POST /api/service-charge-payments/notify-transfer
//
// server.js maps:
//
// /api/service-charge-payments
//
// to this same router.
//
// Therefore this route connects that existing frontend
// request to submitPaymentProof.
//
// ==========================================================

router.post(
  "/notify-transfer",
  upload.single("receipt"),
  (req, res, next) => {
    // Tenant frontend sends the ID inside FormData.
    //
    // Existing controller expects:
    //
    // req.params.id
    //
    // Connect the two without changing the controller.

    req.params.id =
      req.body.serviceChargeId;

    return submitPaymentProof(
      req,
      res,
      next
    );
  }
);

// ==========================================================
// ADMIN PAYMENT RECORDS
// ==========================================================
//
// IMPORTANT FIX:
//
// This is the endpoint that the admin page calls:
//
// GET /api/service-charge-payments/admin
//
// adminOnly now uses the corrected centralized role check.
//
// ==========================================================

router.get(
  "/admin",
  adminOnly,
  getAdminPaymentRecords
);

// ==========================================================
// ADMIN APARTMENTS
// ==========================================================

router.get(
  "/admin/apartments",
  adminOnly,
  getAdminApartments
);

// ==========================================================
// ADMIN CREATE / UPDATE SERVICE CHARGE
// ==========================================================

router.post(
  "/admin/apartment",
  adminOnly,
  createOrUpdateApartmentServiceCharge
);

// ==========================================================
// ADMIN CONFIRM PAYMENT
// ==========================================================
//
// Existing admin page calls:
//
// PATCH /api/service-charge-payments/:id/confirm
//
// ==========================================================

router.patch(
  "/:id/confirm",
  adminOnly,
  confirmPayment
);

// ==========================================================
// ADMIN CONFIRM PAYMENT - ORIGINAL ROUTE
// ==========================================================
//
// Keep the existing endpoint too:
//
// PATCH /api/service-charges/admin/:id/confirm
//
// ==========================================================

router.patch(
  "/admin/:id/confirm",
  adminOnly,
  confirmPayment
);

// ==========================================================
// ADMIN VIEW RECEIPT
// ==========================================================
//
// Admin page calls:
//
// GET /api/service-charge-payments/:id/receipt
//
// ==========================================================

router.get(
  "/:id/receipt",
  adminOnly,
  getPaymentReceipt
);

// ==========================================================
// ADMIN VIEW RECEIPT - ORIGINAL ROUTE
// ==========================================================

router.get(
  "/admin/:id/receipt",
  adminOnly,
  getPaymentReceipt
);

// ==========================================================
// ADMIN DELETE SERVICE CHARGE
// ==========================================================

router.delete(
  "/admin/:id",
  adminOnly,
  deleteServiceCharge
);

// ==========================================================
// EXPORT
// ==========================================================

module.exports = router;