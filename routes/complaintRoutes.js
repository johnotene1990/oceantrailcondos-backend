const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  createComplaint,
  getTenantComplaints,
  getTenantComplaint,
  getLandlordComplaints,
  updateComplaint,
} = require("../controllers/complaintController");

const protect = require("../middleware/authMiddleware");

// Configure Multer Storage for File Attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/complaints/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
});

const router = express.Router();

router.use(protect);

// ==========================================
// TENANT ROUTES
// ==========================================

// Parse multipart form payload (text fields + optional attachment)
router.post("/", upload.single("attachment"), createComplaint);
router.get("/tenant", getTenantComplaints);
router.get("/tenant/:id", getTenantComplaint);

// ==========================================
// LANDLORD / ADMIN ROUTES
// ==========================================

router.get("/landlord", getLandlordComplaints);
router.put("/:id", updateComplaint);

module.exports = router;