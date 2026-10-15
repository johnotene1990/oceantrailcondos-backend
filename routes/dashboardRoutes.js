const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
  getTenantStats,
  getLandlordStats,
} = require("../controllers/dashboardController");

const router = express.Router();

router.get(
  "/tenant",
  protect,
  getTenantStats
);

router.get(
  "/landlord",
  protect,
  getLandlordStats
);

module.exports = router;