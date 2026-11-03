const express = require("express");

const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// REGISTER
// ==========================================

router.post("/register", registerUser);

// ==========================================
// LOGIN
// ==========================================

router.post("/login", loginUser);

// ==========================================
// LOGOUT
// ==========================================

router.post("/logout", logoutUser);

// ==========================================
// CURRENT USER
// ==========================================

router.get("/me", protect, getMe);

// ==========================================
// PROFILE ROUTES
// ==========================================

router
  .route("/profile")
  .get(protect, getProfile)
  .put(protect, updateProfile);

// Alias route for tenant profile calls
router
  .route("/tenant/profile")
  .get(protect, getProfile)
  .put(protect, updateProfile);

// ==========================================
// FORGOT PASSWORD
// ==========================================

router.post("/forgot-password", forgotPassword);

// ==========================================
// RESET PASSWORD
// ==========================================

router.post("/reset-password/:token", resetPassword);

module.exports = router;




// const express = require("express");

// const {
//   registerUser,
//   loginUser,
//   logoutUser,
//   getMe,
//   getProfile,
//   updateProfile,
//   forgotPassword,
//   resetPassword,
// } = require("../controllers/authController");

// const protect = require("../middleware/authMiddleware");

// const router = express.Router();

// // ==========================================
// // REGISTER
// // ==========================================

// router.post("/register", registerUser);

// // ==========================================
// // LOGIN
// // ==========================================

// router.post("/login", loginUser);

// // ==========================================
// // LOGOUT
// // ==========================================

// router.post("/logout", logoutUser);

// // ==========================================
// // CURRENT USER
// // ==========================================

// router.get("/me", protect, getMe);

// // ==========================================
// // PROFILE ROUTES
// // ==========================================

// router
//   .route("/profile")
//   .get(protect, getProfile)
//   .put(protect, updateProfile);

// // Alias route for tenant profile calls
// router
//   .route("/tenant/profile")
//   .get(protect, getProfile)
//   .put(protect, updateProfile);

// // ==========================================
// // FORGOT PASSWORD
// // ==========================================

// router.post("/forgot-password", forgotPassword);

// // ==========================================
// // RESET PASSWORD
// // ==========================================

// router.post("/reset-password/:token", resetPassword);

// module.exports = router;