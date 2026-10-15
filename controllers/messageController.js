const TenantMessage = require("../models/Message");
const User = require("../models/User");
const TenantNotification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");

const ADMIN_EMAIL =
  process.env.COMPANY_EMAIL ||
  "oceantrialcondoslekki@gmail.com";

/**
 * POST
 * /api/tenant-messages
 *
 * Tenant sends a message to Ocean Trail management.
 *
 * The message is:
 * 1. Saved in MongoDB.
 * 2. Sent to the company's email.
 * 3. Recorded as a tenant notification.
 */
const sendMessage = async (
  req,
  res
) => {
  try {
    const {
      subject,
      body,
    } = req.body;

    if (
      !subject ||
      !body
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject and message are required.",
      });
    }

    if (
      subject.trim().length ===
      0 ||
      body.trim().length ===
      0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject and message cannot be empty.",
      });
    }

    const tenant =
      await User.findById(
        req.user._id
      ).select(
        "fullName email phone"
      );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message:
          "Tenant account could not be found.",
      });
    }

    /**
     * Save message.
     */
    const message =
      await TenantMessage.create(
        {
          sender:
            req.user._id,

          senderRole:
            req.user.role ||
            "tenant",

          recipientEmail:
            ADMIN_EMAIL,

          subject:
            subject.trim(),

          body:
            body.trim(),
        }
      );

    /**
     * Send message to company mailbox.
     */
    try {
      await sendEmail({
        to:
          ADMIN_EMAIL,

        subject:
          `Tenant Message | ${subject.trim()}`,

        replyTo:
          tenant.email,

        html: `
          <div
            style="
              font-family:Arial,sans-serif;
              max-width:680px;
              margin:auto;
              padding:28px;
            "
          >

            <h2
              style="
                color:#4B4F93;
              "
            >
              Tenant Message
            </h2>

            <p>
              <strong>Tenant:</strong>
              ${tenant.fullName}
            </p>

            <p>
              <strong>Email:</strong>
              ${tenant.email}
            </p>

            <p>
              <strong>Phone:</strong>
              ${tenant.phone || "N/A"}
            </p>

            <h3>
              ${subject.trim()}
            </h3>

            <p
              style="
                white-space:pre-wrap;
                line-height:1.7;
              "
            >
              ${body.trim()}
            </p>

          </div>
        `,
      });
    } catch (emailError) {
      console.error(
        "Tenant message email error:",
        emailError
      );
    }

    /**
     * Create notification for tenant.
     */
    try {
      await TenantNotification.create({
        recipient:
          req.user._id,

        title:
          "Message Sent",

        message:
          "Your message has been sent to Ocean Trail management.",

        type:
          "message",
      });
    } catch (
      notificationError
    ) {
      console.error(
        "Message notification error:",
        notificationError
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Message sent successfully.",
      record:
        message,
    });
  } catch (error) {
    console.error(
      "Send tenant message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send your message.",
    });
  }
};

/**
 * GET
 * /api/tenant-messages
 *
 * Tenant sees messages they have sent.
 */
const getMessages = async (
  req,
  res
) => {
  try {
    const messages =
      await TenantMessage.find(
        {
          sender:
            req.user._id,
        }
      )
        .sort({
          createdAt: -1,
        })
        .limit(100);

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(
      "Get tenant messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load your messages.",
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};
