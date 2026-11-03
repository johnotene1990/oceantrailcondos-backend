const nodemailer = require("nodemailer");

// =====================================================
// OCEAN TRAIL EMAIL TRANSPORTER
// =====================================================

const createTransporter = () => {
    const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_SECURE,
        SMTP_USER,
        SMTP_PASS,
    } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        throw new Error(
            "SMTP configuration is missing. Check SMTP_HOST, SMTP_USER and SMTP_PASS in your backend .env file."
        );
    }

    const port = Number(SMTP_PORT || 587);

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: String(SMTP_SECURE).toLowerCase() === "true",
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
        // Bypass strict self-signed certificate and chain validation errors
        tls: {
            rejectUnauthorized: false,
        },
    });
};

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

    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.SMTP_FROM || `"Ocean Trail Website" <${process.env.SMTP_USER}>`,
        to,
        subject,
        ...(text ? { text } : {}),
        ...(html ? { html } : {}),
        ...(replyTo ? { replyTo } : {}),
    };

    return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;