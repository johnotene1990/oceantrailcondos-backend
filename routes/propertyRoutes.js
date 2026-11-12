// const express = require("express");

// const {
//   createProperty,
//   getMyProperties,
//   getProperty,
//   updateProperty,
//   deleteProperty,
//   getPropertyStats,

//   // ADMIN PROPERTY MANAGEMENT
//   adminCreateProperty,
//   adminGetProperties,
//   adminGetProperty,
//   adminUpdateProperty,
//   adminDeleteProperty,
// } = require("../controllers/propertyController");

// const protect = require("../middleware/authMiddleware");

// const router = express.Router();

// router.use(protect);

// // ======================================================
// // LANDLORD PROPERTY ROUTES
// // ======================================================

// // CREATE PROPERTY
// router.post("/", createProperty);

// // GET ALL MY PROPERTIES
// router.get("/", getMyProperties);

// // STATISTICS
// // Must remain BEFORE /:id
// router.get("/stats", getPropertyStats);

// // GET SINGLE PROPERTY
// router.get("/:id", getProperty);

// // UPDATE PROPERTY
// router.put("/:id", updateProperty);

// // DELETE PROPERTY
// router.delete("/:id", deleteProperty);


// // ======================================================
// // ADMIN PROPERTY MANAGEMENT
// // ======================================================
// // These routes allow the Admin Properties page to save
// // Property + Apartments + Tenant assignment in MongoDB.
// // ======================================================

// // CREATE PROPERTY WITH APARTMENTS
// router.post("/admin/create", adminCreateProperty);

// // GET ALL ADMIN PROPERTIES
// router.get("/admin/all", adminGetProperties);

// // GET SINGLE ADMIN PROPERTY
// router.get("/admin/:id", adminGetProperty);

// // UPDATE PROPERTY + APARTMENTS
// router.put("/admin/:id", adminUpdateProperty);

// // DELETE ADMIN PROPERTY
// router.delete("/admin/:id", adminDeleteProperty);


// module.exports = router;







const express = require("express");

const {
  createProperty,
  getMyProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  getPropertyStats,

  // ADMIN PROPERTY MANAGEMENT
  adminCreateProperty,
  adminGetProperties,
  adminGetProperty,
  adminUpdateProperty,
  adminDeleteProperty,
} = require("../controllers/propertyController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// ======================================================
// LANDLORD PROPERTY ROUTES
// ======================================================

// CREATE PROPERTY
router.post("/", createProperty);

// GET ALL MY PROPERTIES
router.get("/", getMyProperties);

// GET LANDLORD PROPERTIES FOR LANDLORD DASHBOARD
router.get("/landlord", getMyProperties);

// STATISTICS
// Must remain BEFORE /:id
router.get("/stats", getPropertyStats);

// GET SINGLE PROPERTY
router.get("/:id", getProperty);

// UPDATE PROPERTY
router.put("/:id", updateProperty);

// DELETE PROPERTY
router.delete("/:id", deleteProperty);

// ======================================================
// ADMIN PROPERTY MANAGEMENT
// ======================================================

// CREATE PROPERTY WITH APARTMENTS
router.post("/admin/create", adminCreateProperty);

// GET ALL ADMIN PROPERTIES
router.get("/admin/all", adminGetProperties);

// GET SINGLE ADMIN PROPERTY
router.get("/admin/:id", adminGetProperty);

// UPDATE PROPERTY + APARTMENTS
router.put("/admin/:id", adminUpdateProperty);

// DELETE ADMIN PROPERTY
router.delete("/admin/:id", adminDeleteProperty);

module.exports = router;
