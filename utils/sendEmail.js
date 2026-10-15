const nodemailer = require("nodemailer");

// =====================================================
// OCEAN TRAIL EMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure:
    String(process.env.SMTP_SECURE).toLowerCase() === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// =====================================================
// SEND EMAIL
// =====================================================

const sendEmail = async ({
  to,
  subject,
  html,
  text,
  replyTo,
}) => {
  if (!to) {
    throw new Error("Email recipient is required.");
  }

  if (!subject) {
    throw new Error("Email subject is required.");
  }

  if (!html && !text) {
    throw new Error("Email content is required.");
  }

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error(
      "SMTP configuration is missing. Check SMTP_HOST, SMTP_USER and SMTP_PASS in .env."
    );
  }

  const mailOptions = {
    from:
      process.env.SMTP_FROM ||
      `"Ocean Trail Condominium" <${process.env.SMTP_USER}>`,

    to,

    subject,

    ...(text ? { text } : {}),

    ...(html ? { html } : {}),

    ...(replyTo ? { replyTo } : {}),
  };

  return transporter.sendMail(mailOptions);
};

// =====================================================
// EXPORT
// IMPORTANT:
// authController.js uses:
// const sendEmail = require("../utils/sendEmail");
// Therefore we export the function directly.
// =====================================================

module.exports = sendEmail;