// const express = require("express");

// const protect = require("../middleware/authMiddleware");
// const adminOnly = require("../middleware/adminMiddleware");

// const {
//   getNotifications,
//   markRead,
//   markAllRead,
//   adminBroadcast,
// } = require("../controllers/notificationController");

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | All notification routes require authentication
// |--------------------------------------------------------------------------
// */

// router.use(protect);

// /*
// |--------------------------------------------------------------------------
// | Tenant notification routes
// |--------------------------------------------------------------------------
// */

// /*
//  * Get current user's notifications
//  *
//  * GET /api/tenant-notifications
//  */
// router.get(
//   "/",
//   getNotifications
// );

// /*
//  * Mark one notification as read
//  *
//  * PATCH /api/tenant-notifications/:id/read
//  */
// router.patch(
//   "/:id/read",
//   markRead
// );

// /*
//  * Mark every notification as read
//  *
//  * PATCH /api/tenant-notifications/read-all
//  */
// router.patch(
//   "/read-all",
//   markAllRead
// );

// /*
// |--------------------------------------------------------------------------
// | Admin notification broadcast
// |--------------------------------------------------------------------------
// */

// /*
//  * Send a notification to:
//  *
//  * - one tenant using tenantId
//  * OR
//  * - all active tenant accounts
//  *
//  * POST /api/tenant-notifications/admin/broadcast
//  *
//  * Example for one tenant:
//  *
//  * {
//  *   "tenantId": "MONGODB_USER_ID",
//  *   "title": "Important Notice",
//  *   "message": "Water maintenance will take place tomorrow.",
//  *   "type": "general"
//  * }
//  *
//  * Example for everyone:
//  *
//  * {
//  *   "title": "Estate Notice",
//  *   "message": "The estate gate will close at 11pm today.",
//  *   "type": "general"
//  * }
//  */
// router.post(
//   "/admin/broadcast",
//   adminOnly,
//   adminBroadcast
// );

// module.exports = router;





const express = require("express");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  getNotifications,
  markRead,
  markAllRead,
  adminBroadcast,
} = require("../controllers/notificationController");

const router = express.Router();

// All notification routes require authentication.
router.use(protect);

// ==========================================
// GENERAL NOTIFICATIONS
// ==========================================

// GET /api/notifications
// GET /api/tenant-notifications
router.get("/", getNotifications);

// GET /api/notifications/landlord
// GET /api/notifications/tenant
//
// Both endpoints currently use the authenticated
// user's notifications.
router.get("/landlord", getNotifications);
router.get("/tenant", getNotifications);

// Mark one notification as read.
router.patch("/:id/read", markRead);

// Mark all notifications as read.
router.patch("/read-all", markAllRead);

// ==========================================
// ADMIN NOTIFICATION BROADCAST
// ==========================================

router.post(
  "/admin/broadcast",
  adminOnly,
  adminBroadcast
);

module.exports = router;
