const express = require("express");
const router = express.Router();

const {
  requestElectricityToken,
  getPendingRequests,
  approveAndGenerateToken,
} = require("../controllers/electricityController");

// Guard checks to prevent router crash if imports evaluate to undefined
if (!requestElectricityToken || !getPendingRequests || !approveAndGenerateToken) {
  throw new Error(
    "Electricity controller handlers are undefined. Check backend/controllers/electricityController.js exports."
  );
}

// Tenant route to submit payment proof
router.post("/request", requestElectricityToken);

// Admin route to fetch pending Zenith Bank POP requests
router.get("/pending", getPendingRequests);

// Admin route to verify POP and generate smart meter token
router.post("/approve", approveAndGenerateToken);

module.exports = router;