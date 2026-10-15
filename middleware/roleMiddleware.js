const normalizeRole = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
};

// ==========================================================
// TENANT ONLY
// ==========================================================

const tenantOnly = (
  req,
  res,
  next
) => {
  const role = normalizeRole(
    req.user?.role
  );

  if (role !== "tenant") {
    return res.status(403).json({
      success: false,
      message:
        "Tenant access required.",
    });
  }

  next();
};

// ==========================================================
// LANDLORD ONLY
// ==========================================================

const landlordOnly = (
  req,
  res,
  next
) => {
  const role = normalizeRole(
    req.user?.role
  );

  if (role !== "landlord") {
    return res.status(403).json({
      success: false,
      message:
        "Landlord access required.",
    });
  }

  next();
};

// ==========================================================
// ADMIN ONLY
// ==========================================================
//
// IMPORTANT:
//
// This now uses the same administrative roles as
// adminMiddleware.js.
//
// ==========================================================

const adminOnly = (
  req,
  res,
  next
) => {
  const role = normalizeRole(
    req.user?.role
  );

  const allowedRoles = [
    "admin",
    "super_admin",
    "property_manager",
    "administrator",
  ];

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      message:
        "Administrator access required.",
    });
  }

  next();
};

module.exports = {
  tenantOnly,
  landlordOnly,
  adminOnly,
};