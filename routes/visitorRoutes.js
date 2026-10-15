const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  createVisitorCode,
  getTenantVisitors,
  getSecurityVisitors,
  useVisitorCode,
} = require("../controllers/visitorController");

const router = express.Router();

// ==========================================
// PUBLIC SECURITY FEED (NO LOGIN REQUIRED)
// ==========================================
// This route is completely open so the security screen can 
// pull all active tenant visitor codes in real-time without logging in.
router.get("/security/active", getSecurityVisitors);

// ==========================================
// PROTECTED ROUTES (Require Tenant/Admin Login)
// ==========================================
router.use(protect);

router.post("/", createVisitorCode);
router.get("/tenant", getTenantVisitors);
router.post("/security/use", useVisitorCode);

module.exports = router;