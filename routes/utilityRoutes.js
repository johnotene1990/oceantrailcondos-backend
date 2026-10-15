const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const protect =
  typeof authMiddleware === "function"
    ? authMiddleware
    : authMiddleware?.protect || ((req, res, next) => next());

const adminOnly =
  typeof adminMiddleware === "function"
    ? adminMiddleware
    : adminMiddleware?.adminOnly || ((req, res, next) => next());

const {
  getWallet,
  fundWallet,
  buyElectricityToken,
  getTenantTokens,
  getAdminTokens,
} = require("../controllers/utilityController");

router.use(protect);

// Tenant Utility Wallet & Token Routes
router.get("/wallet", getWallet);
router.post("/wallet/fund", fundWallet);
router.post("/buy-token", buyElectricityToken);
router.get("/tokens", getTenantTokens);

// Admin Electricity Token Reference Log Route
router.get("/admin/tokens", adminOnly, getAdminTokens);

module.exports = router;