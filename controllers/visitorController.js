// const crypto = require("crypto");

// const VisitorAccess = require("../models/VisitorCode");
// const TenantNotification = require("../models/Notification");

// /**
//  * Generate a short random visitor code.
//  */
// const generateCode = () => {
//   return crypto
//     .randomBytes(4)
//     .toString("hex")
//     .toUpperCase();
// };

// /**
//  * POST
//  * /api/visitors
//  *
//  * Tenant creates a visitor access code.
//  */
// const createVisitorCode = async (
//   req,
//   res
// ) => {
//   try {
//     const {
//       visitorName,
//       visitorPhone,
//       purpose,
//       estateLocation,
//       timeIn,
//       timeOut,
//     } = req.body;

//     if (
//       !visitorName ||
//       !purpose ||
//       !estateLocation ||
//       !timeIn ||
//       !timeOut
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Visitor name, purpose, estate location, time in and time out are required.",
//       });
//     }

//     const inDate =
//       new Date(timeIn);

//     const requestedOut =
//       new Date(timeOut);

//     const now =
//       new Date();

//     if (
//       Number.isNaN(
//         inDate.getTime()
//       ) ||
//       Number.isNaN(
//         requestedOut.getTime()
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Please provide valid visitor dates and times.",
//       });
//     }

//     if (
//       requestedOut <=
//       inDate
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Time out must be after time in.",
//       });
//     }

//     /**
//      * Visitor access may never remain
//      * active for more than 1 hour.
//      */
//     const maxExpiry =
//       new Date(
//         now.getTime() +
//           60 * 60 * 1000
//       );

//     const expiresAt =
//       requestedOut <
//       maxExpiry
//         ? requestedOut
//         : maxExpiry;

//     /**
//      * Generate unique code.
//      */
//     let accessCode =
//       generateCode();

//     while (
//       await VisitorAccess.exists(
//         {
//           accessCode,
//         }
//       )
//     ) {
//       accessCode =
//         generateCode();
//     }

//     const record =
//       await VisitorAccess.create(
//         {
//           tenant:
//             req.user._id,

//           visitorName:
//             visitorName.trim(),

//           visitorPhone:
//             visitorPhone ||
//             "",

//           purpose:
//             purpose.trim(),

//           estateLocation:
//             estateLocation.trim(),

//           timeIn:
//             inDate,

//           timeOut:
//             requestedOut,

//           accessCode,

//           expiresAt,

//           status:
//             "active",
//         }
//       );

//     /**
//      * Notify tenant inside dashboard.
//      */
//     try {
//       await TenantNotification.create({
//         recipient:
//           req.user._id,

//         title:
//           "Visitor Access Code Generated",

//         message:
//           `Access code ${accessCode} has been generated for ${visitorName}.`,

//         type:
//           "visitor",
//       });
//     } catch (
//       notificationError
//     ) {
//       console.error(
//         "Visitor notification error:",
//         notificationError
//       );
//     }

//     return res.status(201).json({
//       success: true,
//       message:
//         "Visitor access code generated successfully.",
//       visitor:
//         record,
//     });
//   } catch (error) {
//     console.error(
//       "Create visitor code error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to generate visitor access code.",
//     });
//   }
// };

// /**
//  * GET
//  * /api/visitors/tenant
//  *
//  * Tenant views their visitor codes.
//  */
// const getTenantVisitors = async (
//   req,
//   res
// ) => {
//   try {
//     const visitors =
//       await VisitorAccess.find(
//         {
//           tenant:
//             req.user._id,
//         }
//       ).sort({
//         createdAt: -1,
//       });

//     const now =
//       new Date();

//     /**
//      * Automatically expire codes
//      * whose expiry time has passed.
//      */
//     for (
//       const visitor of visitors
//     ) {
//       if (
//         visitor.status ===
//           "active" &&
//         visitor.expiresAt <
//           now
//       ) {
//         visitor.status =
//           "expired";

//         await visitor.save();
//       }
//     }

//     return res.json({
//       success: true,
//       visitors,
//     });
//   } catch (error) {
//     console.error(
//       "Get tenant visitors error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to load visitor codes.",
//     });
//   }
// };

// /**
//  * GET
//  * /api/visitors/security/active
//  *
//  * Security desk sees currently active
//  * visitor passes.
//  */
// const getSecurityVisitors = async (
//   req,
//   res
// ) => {
//   try {
//     const now =
//       new Date();

//     const visitors =
//       await VisitorAccess.find(
//         {
//           status:
//             "active",

//           expiresAt:
//             {
//               $gt: now,
//             },
//         }
//       )
//         .populate(
//           "tenant",
//           "fullName email phone block floor apartment"
//         )
//         .sort({
//           timeIn: 1,
//         });

//     return res.json({
//       success: true,
//       visitors,
//     });
//   } catch (error) {
//     console.error(
//       "Get security visitors error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to load active visitor access codes.",
//     });
//   }
// };

// /**
//  * POST
//  * /api/visitors/security/use
//  *
//  * Security verifies a visitor code
//  * and consumes the one-time pass.
//  */
// const useVisitorCode = async (
//   req,
//   res
// ) => {
//   try {
//     const accessCode =
//       String(
//         req.body.accessCode ||
//           ""
//       )
//         .trim()
//         .toUpperCase();

//     if (!accessCode) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Visitor access code is required.",
//       });
//     }

//     const record =
//       await VisitorAccess.findOne(
//         {
//           accessCode,
//         }
//       ).populate(
//         "tenant",
//         "fullName email phone block floor apartment"
//       );

//     if (!record) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Visitor code not found.",
//       });
//     }

//     if (
//       record.expiresAt <
//         new Date() ||
//       record.status !==
//         "active"
//     ) {
//       if (
//         record.status ===
//           "active" &&
//         record.expiresAt <
//           new Date()
//       ) {
//         record.status =
//           "expired";

//         await record.save();
//       }

//       return res.status(400).json({
//         success: false,
//         message:
//           "Visitor code is expired or inactive.",
//       });
//     }

//     /**
//      * One-time access:
//      * once security accepts it,
//      * it becomes USED.
//      */
//     record.status =
//       "used";

//     record.usedAt =
//       new Date();

//     await record.save();

//     return res.json({
//       success: true,
//       message:
//         "Visitor code accepted.",
//       visitor:
//         record,
//     });
//   } catch (error) {
//     console.error(
//       "Use visitor code error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to validate visitor code.",
//     });
//   }
// };

// module.exports = {
//   createVisitorCode,
//   getTenantVisitors,
//   getSecurityVisitors,
//   useVisitorCode,
// };



const crypto = require("crypto");
const VisitorAccess = require("../models/VisitorCode");
const TenantNotification = require("../models/Notification");

/**
 * Generate a short random visitor code.
 */
const generateCode = () => {
  return crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();
};

/**
 * POST /api/visitors
 * Tenant creates a visitor access code with structured location.
 */
const createVisitorCode = async (req, res) => {
  try {
    const {
      visitorName,
      visitorPhone,
      purpose,
      estateLocation,
      timeIn,
      timeOut,
    } = req.body;

    if (!visitorName || !purpose || !estateLocation || !timeIn || !timeOut) {
      return res.status(400).json({
        success: false,
        message: "Visitor name, purpose, estate location, time in and time out are required.",
      });
    }

    const inDate = new Date(timeIn);
    const requestedOut = new Date(timeOut);
    const now = new Date();

    if (Number.isNaN(inDate.getTime()) || Number.isNaN(requestedOut.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid visitor dates and times.",
      });
    }

    if (requestedOut <= inDate) {
      return res.status(400).json({
        success: false,
        message: "Time out must be after time in.",
      });
    }

    const maxExpiry = new Date(now.getTime() + 60 * 60 * 1000);
    const expiresAt = requestedOut < maxExpiry ? requestedOut : maxExpiry;

    let accessCode = generateCode();
    while (await VisitorAccess.exists({ accessCode })) {
      accessCode = generateCode();
    }

    // Auto-format detailed location (Block, Flat, Floor) from tenant profile
    const blockText = req.user.block ? `Block ${req.user.block}` : "";
    const flatText = req.user.apartment ? `flat ${req.user.apartment}` : "";
    const floorText = req.user.floor ? `${req.user.floor} floor` : "";

    let formattedLocation = estateLocation.trim();
    const subLocationParts = [blockText, flatText, floorText].filter(Boolean);
    
    if (subLocationParts.length > 0) {
      formattedLocation = `${estateLocation.trim()}: ${subLocationParts.join(", ")}`;
    }

    const record = await VisitorAccess.create({
      tenant: req.user._id,
      visitorName: visitorName.trim(),
      visitorPhone: visitorPhone || "",
      purpose: purpose.trim(),
      estateLocation: formattedLocation,
      timeIn: inDate,
      timeOut: requestedOut,
      accessCode,
      expiresAt,
      status: "active",
    });

    try {
      await TenantNotification.create({
        recipient: req.user._id,
        title: "Visitor Access Code Generated",
        message: `Access code ${accessCode} has been generated for ${visitorName}.`,
        type: "visitor",
      });
    } catch (notificationError) {
      console.error("Visitor notification error:", notificationError);
    }

    return res.status(201).json({
      success: true,
      message: "Visitor access code generated successfully.",
      visitor: record,
    });
  } catch (error) {
    console.error("Create visitor code error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to generate visitor access code.",
    });
  }
};

/**
 * GET /api/visitors/tenant
 * Tenant views their visitor codes.
 */
const getTenantVisitors = async (req, res) => {
  try {
    const visitors = await VisitorAccess.find({
      tenant: req.user._id,
    }).sort({ createdAt: -1 });

    const now = new Date();
    for (const visitor of visitors) {
      if (visitor.status === "active" && visitor.expiresAt < now) {
        visitor.status = "expired";
        await visitor.save();
      }
    }

    return res.json({ success: true, visitors });
  } catch (error) {
    console.error("Get tenant visitors error:", error);
    return res.status(500).json({ success: false, message: "Unable to load visitor codes." });
  }
};

/**
 * GET /api/visitors/security/active
 * PUBLIC: Security desk pulls all currently active visitor passes.
 */
const getSecurityVisitors = async (req, res) => {
  try {
    const now = new Date();

    const visitors = await VisitorAccess.find({
      status: "active",
      expiresAt: { $gt: now },
    })
      .populate("tenant", "fullName email phone block floor apartment")
      .sort({ timeIn: 1 });

    return res.json({ success: true, visitors });
  } catch (error) {
    console.error("Get security visitors error:", error);
    return res.status(500).json({ success: false, message: "Unable to load active visitor access codes." });
  }
};

/**
 * POST /api/visitors/security/use
 * Security verifies a visitor code.
 */
const useVisitorCode = async (req, res) => {
  try {
    const accessCode = String(req.body.accessCode || "").trim().toUpperCase();

    if (!accessCode) {
      return res.status(400).json({ success: false, message: "Visitor access code is required." });
    }

    const record = await VisitorAccess.findOne({ accessCode }).populate(
      "tenant",
      "fullName email phone block floor apartment"
    );

    if (!record) {
      return res.status(404).json({ success: false, message: "Visitor code not found." });
    }

    if (record.expiresAt < new Date() || record.status !== "active") {
      if (record.status === "active" && record.expiresAt < new Date()) {
        record.status = "expired";
        await record.save();
      }
      return res.status(400).json({ success: false, message: "Visitor code is expired or inactive." });
    }

    record.status = "used";
    record.usedAt = new Date();
    await record.save();

    return res.json({ success: true, message: "Visitor code accepted.", visitor: record });
  } catch (error) {
    console.error("Use visitor code error:", error);
    return res.status(500).json({ success: false, message: "Unable to validate visitor code." });
  }
};

module.exports = {
  createVisitorCode,
  getTenantVisitors,
  getSecurityVisitors,
  useVisitorCode,
};