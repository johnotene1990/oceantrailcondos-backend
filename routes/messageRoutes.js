// backend/routes/messageRoutes.js
const express = require("express");
const router = express.Router();

// Import Middlewares safely
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const protect = typeof authMiddleware === "function" ? authMiddleware : (authMiddleware?.protect || ((req, res, next) => next()));
const adminOnly = typeof adminMiddleware === "function" ? adminMiddleware : (adminMiddleware?.adminOnly || ((req, res, next) => next()));

// Import Controller Functions
const messageController = require("../controllers/messageController");

const {
  getMessages,
  getAdminMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
} = messageController || {};

// Placeholder middleware for missing handlers to prevent app crash
const fallbackHandler = (name) => (req, res) => {
  res.status(501).json({
    success: false,
    message: `Handler '${name}' is not implemented in messageController.js`,
  });
};

// ==========================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ==========================================
router.use(protect);

// ==========================================
// MESSAGE ROUTES
// ==========================================

// GET /api/messages - Fetch tenant messages
router.get("/", getMessages || fallbackHandler("getMessages"));

// GET /api/messages/admin - Fetch all messages for admin
router.get(
  "/admin",
  adminOnly,
  getAdminMessages || getMessages || fallbackHandler("getAdminMessages")
);

// POST /api/messages - Send a new message
router.post("/", sendMessage || fallbackHandler("sendMessage"));

// PATCH /api/messages/:id/read - Mark message as read
router.patch("/:id/read", markAsRead || fallbackHandler("markAsRead"));

// DELETE /api/messages/:id - Delete a message
router.delete("/:id", deleteMessage || fallbackHandler("deleteMessage"));

module.exports = router;



// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");
// const adminMiddleware = require("../middleware/adminMiddleware");

// const protect =
//   typeof authMiddleware === "function"
//     ? authMiddleware
//     : authMiddleware?.protect || ((req, res, next) => next());

// const adminOnly =
//   typeof adminMiddleware === "function"
//     ? adminMiddleware
//     : adminMiddleware?.adminOnly || ((req, res, next) => next());

// const {
//   sendMessage,
//   getMessages,
//   getAdminMessages,
//   markAsRead,
//   replyToMessage,
//   deleteMessage,
// } = require("../controllers/messageController");

// router.use(protect);

// // ==========================================
// // STATIC ROUTES (MUST BE BEFORE /:id ROUTES)
// // ==========================================
// router.get("/admin", adminOnly, getAdminMessages);
// router.get("/", getMessages);
// router.post("/", sendMessage);

// // ==========================================
// // PARAMETERIZED ROUTES (MUST BE AFTER STATIC)
// // ==========================================
// router.patch("/:id/reply", adminOnly, replyToMessage);
// router.patch("/:id/read", markAsRead);
// router.delete("/:id", adminOnly, deleteMessage);

// module.exports = router;