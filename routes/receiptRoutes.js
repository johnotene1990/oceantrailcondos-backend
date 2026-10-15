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
  createOrUpdateApartmentServiceCharge,
  confirmPayment,
  getPaymentReceipt,
  deleteServiceCharge,
} = require("../controllers/adminServiceChargeController");

const router = express.Router();

// Multer setup for receipt uploads (memory storage, max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF, JPG, JPEG, PNG and WEBP receipt files are allowed."));
    }
    cb(null, true);
  },
});

// Protect all routes with authentication middleware
router.use(protect);

// ================= TENANT ROUTES =================
router.get("/tenant", getTenantCharges);
router.post("/:id/submit-proof", upload.single("receipt"), submitPaymentProof);

// ================= ADMIN ROUTES =================
router.get("/admin/apartments", adminOnly, getAdminApartments);
router.post("/admin/apartment", adminOnly, createOrUpdateApartmentServiceCharge);
router.patch("/admin/:id/confirm", adminOnly, confirmPayment);
router.get("/admin/:id/receipt", adminOnly, getPaymentReceipt);
router.delete("/admin/:id", adminOnly, deleteServiceCharge);

module.exports = router;