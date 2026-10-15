
// ==========================================================
// AUTHENTICATION MIDDLEWARE
// ==========================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const normalizeRole = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
};

const protect = async (req, res, next) => {
  try {
    // ======================================================
    // GET AUTH TOKEN
    // ======================================================

    let token =
      req.cookies?.token ||
      req.cookies?.jwt ||
      req.cookies?.accessToken ||
      req.cookies?.auth_token;

    // ======================================================
    // FALLBACK: AUTHORIZATION HEADER
    // ======================================================

    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // ======================================================
    // NO TOKEN
    // ======================================================

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please sign in.",
      });
    }

    // ======================================================
    // VERIFY JWT
    // ======================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ======================================================
    // GET USER FROM DATABASE
    // ======================================================

    let user;

    try {
      user = await User.findById(decoded.id);
    } catch (dbError) {
      console.error(
        "Database connection error during auth lookup:",
        dbError
      );

      return res.status(500).json({
        success: false,
        message:
          "Database connection error. Please try again later.",
      });
    }

    // ======================================================
    // USER DOES NOT EXIST
    // ======================================================

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    // ======================================================
    // ACCOUNT DEACTIVATED
    // ======================================================

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated.",
      });
    }

    // ======================================================
    // NORMALIZE ROLE
    //
    // FIX:
    // The admin middleware must receive a consistent role
    // value regardless of capitalization, spaces or hyphens.
    //
    // Examples:
    //
    // Admin          -> admin
    // ADMIN          -> admin
    // Super Admin    -> super_admin
    // super-admin    -> super_admin
    // Property Manager -> property_manager
    // ======================================================

    const databaseRole =
      user.role ||
      user.userRole ||
      user.userType ||
      user.accountType ||
      "";

    const normalizedRole =
      normalizeRole(databaseRole);

    // Put the normalized role on the authenticated user object.
    //
    // This does NOT change the value stored in MongoDB.
    // It only makes req.user.role consistent for middleware.
    user.role = normalizedRole;

    // ======================================================
    // DEBUG INFORMATION
    //
    // This is intentionally server-side only.
    // It helps identify role problems without exposing
    // account information to the browser.
    // ======================================================

    console.log(
      `[AUTH] ${user.email || user._id} authenticated with role: ${user.role}`
    );

    // ======================================================
    // ATTACH USER TO REQUEST
    // ======================================================

    req.user = user;

    next();
  } catch (error) {
    console.error(
      "Auth middleware token error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Authentication failed. Please sign in again.",
    });
  }
};

module.exports = protect;

// const adminOnly = (req, res, next) => {
//   try {
//     // User must already be authenticated
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Authentication required.",
//       });
//     }

//     const role = String(req.user.role || "")
//       .trim()
//       .toLowerCase();

//     console.log("ADMIN AUTH CHECK:", {
//       userId: req.user._id,
//       email: req.user.email,
//       role,
//     });

//     const allowedRoles = [
//       "admin",
//       "super_admin",
//       "property_manager",
//     ];

//     // Only block users who are NOT administrators
//     if (!allowedRoles.includes(role)) {
//       console.warn("ADMIN ACCESS DENIED:", {
//         userId: req.user._id,
//         email: req.user.email,
//         role,
//         allowedRoles,
//       });

//       return res.status(403).json({
//         success: false,
//         message:
//           "Access denied. Only administrators can perform this action.",
//       });
//     }

//     // Administrator is allowed to continue
//     next();
//   } catch (error) {
//     console.error("Admin middleware error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to verify administrator access.",
//     });
//   }
// };

// module.exports = adminOnly;