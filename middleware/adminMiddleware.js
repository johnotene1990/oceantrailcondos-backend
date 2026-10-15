
// ==========================================================
// ADMIN / PROPERTY MANAGER ONLY MIDDLEWARE
// ==========================================================

const normalizeRole = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
};

const adminOnly = (req, res, next) => {
  try {
    // ======================================================
    // CHECK AUTHENTICATION
    // ======================================================

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ======================================================
    // GET USER ROLE
    //
    // req.user.role should normally already be populated by
    // authMiddleware.
    //
    // The fallback fields make this middleware safer if an
    // older User record uses another role field.
    // ======================================================

    const rawRole =
      req.user.role ||
      req.user.userRole ||
      req.user.userType ||
      req.user.accountType ||
      "";

    const role = normalizeRole(rawRole);

    // ======================================================
    // KEEP ROLE AVAILABLE ON REQUEST
    // ======================================================

    req.user.role = role;

    // ======================================================
    // ALLOWED ADMINISTRATIVE ROLES
    // ======================================================

    const allowedRoles = [
      "admin",
      "super_admin",
      "property_manager",
      "administrator",
    ];

    // ======================================================
    // ADMIN ROLE CHECK
    // ======================================================

    if (!allowedRoles.includes(role)) {
      console.error(
        `[ADMIN AUTH] Access denied for ${
          req.user.email || req.user._id || "unknown user"
        }. Detected role: "${role}"`
      );

      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only administrators can perform this action.",
      });
    }

    // ======================================================
    // ADMIN ACCESS GRANTED
    // ======================================================

    next();
  } catch (error) {
    console.error(
      "Admin middleware error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify administrator access.",
    });
  }
};

module.exports = adminOnly;