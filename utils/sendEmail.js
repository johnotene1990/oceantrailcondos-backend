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
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 587);

    const secure =
        process.env.SMTP_SECURE !== undefined
            ? String(process.env.SMTP_SECURE).toLowerCase() === "true"
            : port === 465;

    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (!user || !pass) {
        throw new Error(
            "SMTP authentication missing. Check SMTP_USER and SMTP_PASS in Render."
        );
    }

    if (![465, 587].includes(port)) {
        console.warn("Unusual SMTP port configured:", port);
    }

    return nodemailer.createTransport({
        host,
        port,
        secure,

        auth: {
            user,
            pass,
        },

        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,

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
    attachments,
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

    const senderEmail =
        process.env.SMTP_USER || process.env.EMAIL_USER;

    const transporter = createTransporter();

    const mailOptions = {
        from:
            process.env.SMTP_FROM ||
            `"Ocean Trail Condominium" <${senderEmail}>`,

        to,
        subject,

        ...(text ? { text } : {}),
        ...(html ? { html } : {}),
        ...(replyTo ? { replyTo } : {}),
        ...(attachments ? { attachments } : {}),
    };

    try {
        const result = await transporter.sendMail(mailOptions);

        console.log("OCEAN TRAIL EMAIL RESULT:", {
            to,
            subject,
            messageId: result.messageId,
            accepted: result.accepted,
            rejected: result.rejected,
            response: result.response,
        });

        if (!result.accepted || result.accepted.length === 0) {
            throw new Error(
                `SMTP did not accept the email for ${to}.`
            );
        }

        return result;
    } catch (error) {
        console.error("OCEAN TRAIL EMAIL DELIVERY FAILED:", {
            to,
            subject,
            message: error.message,
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            response: error.response,
            stack: error.stack,
        });

        throw error;
    } finally {
        transporter.close();
    }
};

// =====================================================
// VERIFY SMTP CONNECTION
// =====================================================

sendEmail.verifyConnection = async () => {
    const transporter = createTransporter();

    try {
        await transporter.verify();

        console.log(
            "OCEAN TRAIL SMTP CONNECTION VERIFIED SUCCESSFULLY."
        );

        return true;
    } catch (error) {
        console.error("OCEAN TRAIL SMTP VERIFICATION FAILED:", {
            message: error.message,
            code: error.code,
            responseCode: error.responseCode,
            response: error.response,
        });

        throw error;
    } finally {
        transporter.close();
    }
};

module.exports = sendEmail;
