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
            "SMTP configuration is missing. Check SMTP_HOST, SMTP_USER and SMTP_PASS in Render environment variables."
        );
    }

    const port = Number(SMTP_PORT || 587);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("Invalid SMTP_PORT configuration.");
    }

    const secure = String(SMTP_SECURE).toLowerCase() === "true";

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure,

        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },

        // Prevent SMTP connection failures from hanging requests.
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,

        // Keep normal certificate validation enabled.
        tls: {
            rejectUnauthorized: true,
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
        from:
            process.env.SMTP_FROM ||
            `"Ocean Trail Website" <${process.env.SMTP_USER}>`,

        to,
        subject,

        ...(text ? { text } : {}),
        ...(html ? { html } : {}),
        ...(replyTo ? { replyTo } : {}),
    };

    try {
        const result = await transporter.sendMail(mailOptions);

        console.log("EMAIL SENT SUCCESSFULLY:", {
            to,
            subject,
            messageId: result.messageId,
            accepted: result.accepted,
            rejected: result.rejected,
        });

        return result;
    } catch (error) {
        console.error("EMAIL DELIVERY FAILED:", {
            to,
            subject,
            message: error.message,
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            response: error.response,
        });

        throw error;
    } finally {
        transporter.close();
    }
};

// =====================================================
// SMTP CONNECTION TEST
// =====================================================

sendEmail.verifyConnection = async () => {
    const transporter = createTransporter();

    try {
        const result = await transporter.verify();

        console.log("SMTP CONNECTION VERIFIED SUCCESSFULLY.");

        return result;
    } catch (error) {
        console.error("SMTP CONNECTION VERIFICATION FAILED:", {
            message: error.message,
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            response: error.response,
        });

        throw error;
    } finally {
        transporter.close();
    }
};

module.exports = sendEmail;
