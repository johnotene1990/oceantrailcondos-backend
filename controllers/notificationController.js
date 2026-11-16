// const TenantNotification = require("../models/Notification");
// const User = require("../models/User");

// /**
//  * GET
//  * /api/tenant-notifications
//  *
//  * Logged-in tenant gets notifications.
//  */
// const getNotifications = async (
//   req,
//   res
// ) => {
//   try {
//     const notifications =
//       await TenantNotification.find(
//         {
//           recipient:
//             req.user._id,
//         }
//       )
//         .sort({
//           createdAt: -1,
//         })
//         .limit(200);

//     const unreadCount =
//       notifications.filter(
//         (item) =>
//           !item.readAt
//       ).length;

//     return res.json({
//       success: true,
//       notifications,
//       unreadCount,
//     });
//   } catch (error) {
//     console.error(
//       "Get notifications error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to load notifications.",
//     });
//   }
// };

// /**
//  * PATCH
//  * /api/tenant-notifications/:id/read
//  *
//  * Mark one notification as read.
//  */
// const markRead = async (
//   req,
//   res
// ) => {
//   try {
//     const notification =
//       await TenantNotification.findOneAndUpdate(
//         {
//           _id:
//             req.params.id,

//           recipient:
//             req.user._id,
//         },

//         {
//           readAt:
//             new Date(),
//         },

//         {
//           new: true,
//         }
//       );

//     if (!notification) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Notification not found.",
//       });
//     }

//     return res.json({
//       success: true,
//       notification,
//     });
//   } catch (error) {
//     console.error(
//       "Mark notification read error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to update notification.",
//     });
//   }
// };

// /**
//  * PATCH
//  * /api/tenant-notifications/read-all
//  *
//  * Mark all tenant notifications as read.
//  */
// const markAllRead = async (
//   req,
//   res
// ) => {
//   try {
//     await TenantNotification.updateMany(
//       {
//         recipient:
//           req.user._id,

//         readAt:
//           null,
//       },

//       {
//         readAt:
//           new Date(),
//       }
//     );

//     return res.json({
//       success: true,
//       message:
//         "All notifications marked as read.",
//     });
//   } catch (error) {
//     console.error(
//       "Mark all notifications read error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to update notifications.",
//     });
//   }
// };

// /**
//  * POST
//  * /api/tenant-notifications/admin/broadcast
//  *
//  * Admin sends notification either:
//  * - to one specific tenant
//  * - or to all active tenant accounts.
//  */
// const adminBroadcast = async (
//   req,
//   res
// ) => {
//   try {
//     const {
//       title,
//       message,
//       type = "general",
//       tenantId,
//     } = req.body;

//     if (
//       !title ||
//       !message
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Title and message are required.",
//       });
//     }

//     /**
//      * Send to one tenant.
//      */
//     if (tenantId) {
//       const exists =
//         await User.exists({
//           _id:
//             tenantId,

//           role:
//             "tenant",
//         });

//       if (!exists) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Tenant account not found.",
//         });
//       }

//       const created =
//         await TenantNotification.create(
//           {
//             recipient:
//               tenantId,

//             title:
//               title.trim(),

//             message:
//               message.trim(),

//             type,
//           }
//         );

//       return res.status(201).json({
//         success: true,
//         message:
//           "Notification sent to tenant.",
//         notification:
//           created,
//       });
//     }

//     /**
//      * Send to all active tenants.
//      */
//     const tenants =
//       await User.find({
//         role:
//           "tenant",

//         isActive:
//           {
//             $ne: false,
//           },
//       }).select(
//         "_id"
//       );

//     if (!tenants.length) {
//       return res.status(200).json({
//         success: true,
//         message:
//           "No tenant accounts are currently available.",
//         count: 0,
//       });
//     }

//     await TenantNotification.insertMany(
//       tenants.map(
//         (tenant) => ({
//           recipient:
//             tenant._id,

//           title:
//             title.trim(),

//           message:
//             message.trim(),

//           type,
//         })
//       )
//     );

//     return res.status(201).json({
//       success: true,
//       message:
//         "Notification broadcast to tenants.",
//       count:
//         tenants.length,
//     });
//   } catch (error) {
//     console.error(
//       "Admin broadcast notification error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to send notification.",
//     });
//   }
// };

// module.exports = {
//   getNotifications,
//   markRead,
//   markAllRead,
//   adminBroadcast,
// };






const TenantNotification = require("../models/Notification");
const User = require("../models/User");

// ==========================================================
// HELPER: GET AUTHENTICATED USER ID
// ==========================================================

const getUserId = (req) => {
  return req.user?._id || req.user?.id;
};

// ==========================================================
// GET NOTIFICATIONS
//
// GET /api/notifications
// GET /api/notifications/tenant
// GET /api/notifications/landlord
// GET /api/notifications/admin
//
// Each authenticated user receives only notifications
// addressed to their own account.
// ==========================================================

const getNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const notifications = await TenantNotification.find({
      recipient: userId,
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const unreadCount = notifications.filter(
      (item) => !item.readAt
    ).length;

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load notifications.",
    });
  }
};

// ==========================================================
// MARK ONE NOTIFICATION AS READ
//
// PATCH /api/notifications/:id/read
// ==========================================================

const markRead = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required.",
      });
    }

    const notification =
      await TenantNotification.findOneAndUpdate(
        {
          _id: req.params.id,
          recipient: userId,
        },
        {
          $set: {
            readAt: new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notification.",
    });
  }
};

// ==========================================================
// MARK ALL NOTIFICATIONS AS READ
//
// PATCH /api/notifications/read-all
// ==========================================================

const markAllRead = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const result = await TenantNotification.updateMany(
      {
        recipient: userId,
        readAt: null,
      },
      {
        $set: {
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update notifications.",
    });
  }
};

// ==========================================================
// ADMIN BROADCAST NOTIFICATIONS
//
// POST /api/notifications/admin/broadcast
//
// Supported recipients:
// 1. One tenant using tenantId.
// 2. One landlord using landlordId.
// 3. All active tenants.
// 4. All active landlords.
// 5. All active tenants and landlords.
//
// Existing tenant broadcast requests remain supported.
// ==========================================================

const adminBroadcast = async (req, res) => {
  try {
    const {
      title,
      message,
      type = "general",
      tenantId,
      landlordId,
      recipientRole,
    } = req.body;

    if (
      !title ||
      !String(title).trim() ||
      !message ||
      !String(message).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required.",
      });
    }

    const cleanTitle = String(title).trim();
    const cleanMessage = String(message).trim();

    const allowedTypes = [
      "general",
      "payment",
      "maintenance",
      "complaint",
      "renewal",
      "visitor",
      "utility",
      "message",
      "system",
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification type.",
      });
    }

    // ------------------------------------------------------
    // SEND TO ONE TENANT
    // ------------------------------------------------------

    if (tenantId) {
      const tenant = await User.findOne({
        _id: tenantId,
        role: "tenant",
      }).select("_id");

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: "Tenant account not found.",
        });
      }

      const notification =
        await TenantNotification.create({
          recipient: tenant._id,
          title: cleanTitle,
          message: cleanMessage,
          type,
        });

      return res.status(201).json({
        success: true,
        message: "Notification sent to tenant.",
        notification,
      });
    }

    // ------------------------------------------------------
    // SEND TO ONE LANDLORD
    // ------------------------------------------------------

    if (landlordId) {
      const landlord = await User.findOne({
        _id: landlordId,
        role: "landlord",
      }).select("_id");

      if (!landlord) {
        return res.status(404).json({
          success: false,
          message: "Landlord account not found.",
        });
      }

      const notification =
        await TenantNotification.create({
          recipient: landlord._id,
          title: cleanTitle,
          message: cleanMessage,
          type,
        });

      return res.status(201).json({
        success: true,
        message: "Notification sent to landlord.",
        notification,
      });
    }

    // ------------------------------------------------------
    // SEND TO ALL ACTIVE TENANTS AND/OR LANDLORDS
    // ------------------------------------------------------

    const supportedRoles = [
      "tenant",
      "landlord",
    ];

    let roles;

    if (recipientRole === "all") {
      roles = supportedRoles;
    } else if (supportedRoles.includes(recipientRole)) {
      roles = [recipientRole];
    } else if (!recipientRole) {
      // Preserve the previous default behavior:
      // no recipientRole means all active tenants.
      roles = ["tenant"];
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Recipient role must be tenant, landlord, or all.",
      });
    }

    const users = await User.find({
      role: {
        $in: roles,
      },
      isActive: {
        $ne: false,
      },
    }).select("_id");

    if (!users.length) {
      return res.status(200).json({
        success: true,
        message: "No active recipients were found.",
        count: 0,
      });
    }

    const notifications = users.map((user) => ({
      recipient: user._id,
      title: cleanTitle,
      message: cleanMessage,
      type,
    }));

    await TenantNotification.insertMany(
      notifications
    );

    return res.status(201).json({
      success: true,
      message: "Notifications sent successfully.",
      count: notifications.length,
      recipientRoles: roles,
    });
  } catch (error) {
    console.error(
      "Admin broadcast notification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to send notification.",
    });
  }
};

// ==========================================================
// EXPORT CONTROLLERS
// ==========================================================

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  adminBroadcast,
};
