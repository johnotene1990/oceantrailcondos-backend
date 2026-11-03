// const express = require("express");
// const router = express.Router();
// const {
//   submitApplication,
//   getApplications,
// } = require("../controllers/tenantApplicationController");

// router.post("/application", submitApplication);
// router.get("/applications", getApplications);

// module.exports = router;


const express = require("express");
const router = express.Router();

const {
  submitApplication,
  getApplications,
} = require("../controllers/tenantApplicationController");

const {
  getProfile,
  updateProfile,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

// ==========================================
// TENANT APPLICATION ROUTES
// ==========================================
router.post("/application", submitApplication);
router.get("/applications", getApplications);

// ==========================================
// TENANT PROFILE ROUTES (/api/tenant/profile)
// ==========================================
router
  .route("/profile")
  .get(protect, getProfile)
  .put(protect, updateProfile);

module.exports = router;