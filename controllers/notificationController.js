const TenantNotification = require("../models/Notification");
const User = require("../models/User");

/**
 * GET
 * /api/tenant-notifications
 *
 * Logged-in tenant gets notifications.
 */
const getNotifications = async (
  req,
  res
) => {
  try {
    const notifications =
      await TenantNotification.find(
        {
          recipient:
            req.user._id,
        }
      )
        .sort({
          createdAt: -1,
        })
        .limit(200);

    const unreadCount =
      notifications.filter(
        (item) =>
          !item.readAt
      ).length;

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load notifications.",
    });
  }
};

/**
 * PATCH
 * /api/tenant-notifications/:id/read
 *
 * Mark one notification as read.
 */
const markRead = async (
  req,
  res
) => {
  try {
    const notification =
      await TenantNotification.findOneAndUpdate(
        {
          _id:
            req.params.id,

          recipient:
            req.user._id,
        },

        {
          readAt:
            new Date(),
        },

        {
          new: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found.",
      });
    }

    return res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update notification.",
    });
  }
};

/**
 * PATCH
 * /api/tenant-notifications/read-all
 *
 * Mark all tenant notifications as read.
 */
const markAllRead = async (
  req,
  res
) => {
  try {
    await TenantNotification.updateMany(
      {
        recipient:
          req.user._id,

        readAt:
          null,
      },

      {
        readAt:
          new Date(),
      }
    );

    return res.json({
      success: true,
      message:
        "All notifications marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update notifications.",
    });
  }
};

/**
 * POST
 * /api/tenant-notifications/admin/broadcast
 *
 * Admin sends notification either:
 * - to one specific tenant
 * - or to all active tenant accounts.
 */
const adminBroadcast = async (
  req,
  res
) => {
  try {
    const {
      title,
      message,
      type = "general",
      tenantId,
    } = req.body;

    if (
      !title ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title and message are required.",
      });
    }

    /**
     * Send to one tenant.
     */
    if (tenantId) {
      const exists =
        await User.exists({
          _id:
            tenantId,

          role:
            "tenant",
        });

      if (!exists) {
        return res.status(404).json({
          success: false,
          message:
            "Tenant account not found.",
        });
      }

      const created =
        await TenantNotification.create(
          {
            recipient:
              tenantId,

            title:
              title.trim(),

            message:
              message.trim(),

            type,
          }
        );

      return res.status(201).json({
        success: true,
        message:
          "Notification sent to tenant.",
        notification:
          created,
      });
    }

    /**
     * Send to all active tenants.
     */
    const tenants =
      await User.find({
        role:
          "tenant",

        isActive:
          {
            $ne: false,
          },
      }).select(
        "_id"
      );

    if (!tenants.length) {
      return res.status(200).json({
        success: true,
        message:
          "No tenant accounts are currently available.",
        count: 0,
      });
    }

    await TenantNotification.insertMany(
      tenants.map(
        (tenant) => ({
          recipient:
            tenant._id,

          title:
            title.trim(),

          message:
            message.trim(),

          type,
        })
      )
    );

    return res.status(201).json({
      success: true,
      message:
        "Notification broadcast to tenants.",
      count:
        tenants.length,
    });
  } catch (error) {
    console.error(
      "Admin broadcast notification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send notification.",
    });
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  adminBroadcast,
};