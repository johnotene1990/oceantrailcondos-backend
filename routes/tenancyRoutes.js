const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  getEligibility,
  createRenewalRequest,
  getTenantRenewals,
  sendAgreementByApartment,
  uploadLandlordAgreement,
  signAgreement,
  getAgreementFile,
  getAdminRenewals,
  updateRenewalStatus,
} = require("../controllers/tenancyController");

const protect = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/tenancy-renewals"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const router = express.Router();

// ==========================================
// STATIC & ADMIN ROUTES (Must be ABOVE /:id)
// ==========================================
router.get("/eligibility", protect, getEligibility);
router.post("/", protect, createRenewalRequest);
router.get("/tenant", protect, getTenantRenewals);
router.get("/admin", protect, getAdminRenewals);
router.post("/send-agreement", protect, upload.single("agreement"), sendAgreementByApartment);

// ==========================================
// PARAMETERIZED ROUTES (Must be BELOW static routes)
// ==========================================
router.post("/:id/agreement", protect, upload.single("agreement"), uploadLandlordAgreement);
router.post("/:id/sign", protect, upload.single("signature"), signAgreement);
router.get("/:id/agreement", protect, getAgreementFile);
router.patch("/:id/status", protect, updateRenewalStatus);

module.exports = router;