// const nodemailer = require("nodemailer");

// // =====================================================
// // OCEAN TRAIL EMAIL TRANSPORTER
// // =====================================================

// const createTransporter = () => {
//     const {
//         SMTP_HOST,
//         SMTP_PORT,
//         SMTP_SECURE,
//         SMTP_USER,
//         SMTP_PASS,
//     } = process.env;

//     if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
//         throw new Error(
//             "SMTP configuration is missing. Check SMTP_HOST, SMTP_USER and SMTP_PASS in your backend .env file."
//         );
//     }

//     const port = Number(SMTP_PORT || 587);

//     return nodemailer.createTransport({
//         host: SMTP_HOST,
//         port,
//         secure: String(SMTP_SECURE).toLowerCase() === "true",
//         auth: {
//             user: SMTP_USER,
//             pass: SMTP_PASS,
//         },
//         // Bypass strict self-signed certificate and chain validation errors
//         tls: {
//             rejectUnauthorized: false,
//         },
//     });
// };

// // =====================================================
// // SEND EMAIL
// // =====================================================

// const sendEmail = async ({
//     to,
//     subject,
//     html,
//     text,
//     replyTo,
// }) => {
//     if (!to) {
//         throw new Error("Email recipient is required.");
//     }

//     if (!subject) {
//         throw new Error("Email subject is required.");
//     }

//     if (!html && !text) {
//         throw new Error("Email content is required.");
//     }

//     const transporter = createTransporter();

//     const mailOptions = {
//         from: process.env.SMTP_FROM || `"Ocean Trail Website" <${process.env.SMTP_USER}>`,
//         to,
//         subject,
//         ...(text ? { text } : {}),
//         ...(html ? { html } : {}),
//         ...(replyTo ? { replyTo } : {}),
//     };

//     return transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;


const { Resend } = require("resend");

// =====================================================
// OCEAN TRAIL RESEND EMAIL SERVICE
// =====================================================

const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        throw new Error(
            "RESEND_API_KEY is missing from the backend environment."
        );
    }

    return new Resend(apiKey);
};

// =====================================================
// SENDER CONFIGURATION
// =====================================================

const getSender = () => {
    const sender =
        process.env.RESEND_FROM ||
        "Ocean Trail Condominium <notifications@oceantrailcondominium.com>";

    return sender;
};

// =====================================================
// NORMALIZE RECIPIENTS
// =====================================================

const normalizeRecipients = (to) => {
    if (!to) {
        throw new Error("Email recipient is required.");
    }

    const recipients = Array.isArray(to) ? to : [to];

    if (
        recipients.length === 0 ||
        recipients.some(
            (email) =>
                typeof email !== "string" ||
                !email.trim()
        )
    ) {
        throw new Error("Invalid email recipient.");
    }

    return recipients.map((email) => email.trim());
};

// =====================================================
// NORMALIZE ATTACHMENTS
// =====================================================

const normalizeAttachments = (attachments) => {
    if (!attachments) return undefined;

    return attachments.map((attachment) => {
        const normalized = {
            filename: attachment.filename,
        };

        if (attachment.content) {
            normalized.content = Buffer.isBuffer(attachment.content)
                ? attachment.content.toString("base64")
                : attachment.content;
        }

        if (attachment.path) {
            normalized.path = attachment.path;
        }

        if (attachment.contentType) {
            normalized.contentType = attachment.contentType;
        }

        if (attachment.contentId) {
            normalized.contentId = attachment.contentId;
        }

        return normalized;
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
    attachments,
}) => {
    if (!subject || typeof subject !== "string") {
        throw new Error("Email subject is required.");
    }

    if (!html && !text) {
        throw new Error("Email content is required.");
    }

    const recipients = normalizeRecipients(to);
    const resend = getResendClient();

    const emailPayload = {
        from: getSender(),
        to: recipients,
        subject,
        ...(html ? { html } : {}),
        ...(text ? { text } : {}),
        ...(replyTo ? { replyTo } : {}),
        ...(attachments
            ? { attachments: normalizeAttachments(attachments) }
            : {}),
    };

    try {
        const { data, error } = await resend.emails.send(emailPayload);

        if (error) {
            console.error("OCEAN TRAIL RESEND DELIVERY FAILED:", {
                to: recipients,
                subject,
                message: error.message,
                name: error.name,
            });

            throw new Error(error.message || "Resend email delivery failed.");
        }

        if (!data || !data.id) {
            throw new Error(
                "Resend did not return a valid email delivery ID."
            );
        }

        console.log("OCEAN TRAIL RESEND EMAIL SENT:", {
            to: recipients,
            subject,
            emailId: data.id,
        });

        // Preserve a familiar result shape for existing callers.
        return {
            messageId: data.id,
            accepted: recipients,
            rejected: [],
            response: "Email accepted by Resend",
            data,
        };
    } catch (error) {
        console.error("OCEAN TRAIL EMAIL ERROR:", {
            to: recipients,
            subject,
            message: error.message,
            name: error.name,
        });

        throw error;
    }
};

// =====================================================
// PROVIDER CONFIGURATION CHECK
// =====================================================

sendEmail.verifyConnection = async () => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not configured.");
    }

    console.log("OCEAN TRAIL RESEND API KEY CONFIGURED.");

    return true;
};

module.exports = sendEmail;
