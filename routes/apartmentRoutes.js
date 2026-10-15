const express = require("express");

const {
  createApartment,
  getMyApartments,
  getApartmentsByProperty,
  getApartment,
  updateApartment,
  deleteApartment,
  getAvailableTenants,
  assignTenant,
  unassignTenant,
} = require("../controllers/apartmentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// ======================================================
// APARTMENTS
// ======================================================

// CREATE
router.post("/", createApartment);

// GET ALL LANDLORD APARTMENTS
router.get("/", getMyApartments);

// STATIC / SPECIFIC ROUTES (Must be placed ABOVE /:id routes)
router.get("/tenants/available", getAvailableTenants);
router.get("/property/:propertyId", getApartmentsByProperty);

// PARAMETERIZED ROUTES (Must be placed BELOW static routes)
router.get("/:id", getApartment);

// UPDATE & DELETE
router.put("/:id", updateApartment);
router.delete("/:id", deleteApartment);

// ASSIGN / UNASSIGN TENANT
router.put("/:id/assign-tenant", assignTenant);
router.put("/:id/unassign-tenant", unassignTenant);

module.exports = router;