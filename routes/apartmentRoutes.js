// const express = require("express");

// const {
//   createApartment,
//   getMyApartments,
//   getApartmentsByProperty,
//   getApartment,
//   updateApartment,
//   deleteApartment,
//   getAvailableTenants,
//   assignTenant,
//   unassignTenant,
// } = require("../controllers/apartmentController");

// const protect = require("../middleware/authMiddleware");

// const router = express.Router();

// router.use(protect);

// // ======================================================
// // APARTMENTS
// // ======================================================

// // CREATE
// router.post("/", createApartment);

// // GET ALL LANDLORD APARTMENTS
// router.get("/", getMyApartments);

// // STATIC / SPECIFIC ROUTES (Must be placed ABOVE /:id routes)
// router.get("/tenants/available", getAvailableTenants);
// router.get("/property/:propertyId", getApartmentsByProperty);

// // PARAMETERIZED ROUTES (Must be placed BELOW static routes)
// router.get("/:id", getApartment);

// // UPDATE & DELETE
// router.put("/:id", updateApartment);
// router.delete("/:id", deleteApartment);

// // ASSIGN / UNASSIGN TENANT
// router.put("/:id/assign-tenant", assignTenant);
// router.put("/:id/unassign-tenant", unassignTenant);

// module.exports = router;



const express = require("express");

const {
  createApartment,
  getMyApartments,
  getTenantApartment,
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

// ======================================================
// AUTHENTICATION
// All apartment routes require authentication.
// ======================================================

router.use(protect);

// ======================================================
// APARTMENTS
// ======================================================

// CREATE APARTMENT
router.post("/", createApartment);

// GET ALL LANDLORD APARTMENTS
router.get("/", getMyApartments);

// GET LANDLORD APARTMENTS FOR DASHBOARD
router.get("/landlord", getMyApartments);

// GET LOGGED-IN TENANT'S ASSIGNED APARTMENT
router.get("/tenant", getTenantApartment);

// GET AVAILABLE TENANTS
router.get("/tenants/available", getAvailableTenants);

// GET APARTMENTS BELONGING TO A PROPERTY
router.get("/property/:propertyId", getApartmentsByProperty);

// ======================================================
// PARAMETERIZED APARTMENT ROUTES
// Keep these below all static routes.
// ======================================================

// GET SINGLE APARTMENT
router.get("/:id", getApartment);

// UPDATE APARTMENT
router.put("/:id", updateApartment);

// DELETE APARTMENT
router.delete("/:id", deleteApartment);

// ASSIGN TENANT
router.put("/:id/assign-tenant", assignTenant);

// UNASSIGN TENANT
router.put("/:id/unassign-tenant", unassignTenant);

module.exports = router;
