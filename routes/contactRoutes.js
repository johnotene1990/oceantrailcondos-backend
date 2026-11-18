// const express = require("express");
// const router = express.Router();
// const sendEmail = require("../utils/sendEmail");

// // Company email that receives all contact enquiries
// const COMPANY_EMAIL = "oceantrailcondoslekki@gmail.com";

// // Allowed contact services
// const allowedServices = [
//     "property-sale",
//     "property-rental",
//     "short-let",
//     "construction",
//     "property-management",
//     "investment",
//     "other",
// ];

// // =====================================================
// // SEND CONTACT FORM MESSAGE
// // POST /api/contact
// // =====================================================

// router.post("/", async (req, res) => {
//     try {
//         const {
//             name,
//             email,
//             phone,
//             service,
//             message,
//             website,
//         } = req.body || {};

//         // Honeypot: silently accept automated form submissions
//         if (website) {
//             return res.status(200).json({
//                 success: true,
//                 message: "Your message has been received.",
//             });
//         }

//         // Validate required fields
//         if (
//             !name?.trim() ||
//             !email?.trim() ||
//             !service ||
//             !message?.trim()
//         ) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Please provide your name, email, service and message.",
//             });
//         }

//         // Validate field lengths
//         if (
//             name.trim().length > 100 ||
//             email.trim().length > 254 ||
//             (phone && phone.trim().length > 30) ||
//             message.trim().length > 5000
//         ) {
//             return res.status(400).json({
//                 success: false,
//                 message: "One or more fields exceed the allowed length.",
//             });
//         }

//         // Validate email format
//         const emailAddress = email.trim();
//         const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//         if (!emailPattern.test(emailAddress)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Please provide a valid email address.",
//             });
//         }

//         // Validate selected service
//         if (!allowedServices.includes(service)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Please select a valid service.",
//             });
//         }

//         // Prevent header injection
//         if (/[\r\n]/.test(emailAddress)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid email address.",
//             });
//         }

//         const serviceNames = {
//             "property-sale": "Property Purchase",
//             "property-rental": "Property Rental",
//             "short-let": "Short Let",
//             construction: "Building & Construction",
//             "property-management": "Property Management",
//             investment: "Real Estate Investment",
//             other: "Other Enquiry",
//         };

//         const safeName = name.trim();
//         const safePhone = (phone || "").trim();
//         const safeMessage = message.trim();
//         const selectedService = serviceNames[service];

//         // Escape user-provided values before inserting into HTML
//         const escapeHtml = (value = "") =>
//             String(value).replace(/[&<>"']/g, (character) => {
//                 const entities = {
//                     "&": "&amp;",
//                     "<": "&lt;",
//                     ">": "&gt;",
//                     '"': "&quot;",
//                     "'": "&#39;",
//                 };
//                 return entities[character];
//             });

//         const html = `
//             <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
//                 <div style="background: #4B4F93; color: white; padding: 20px;">
//                     <h2 style="margin: 0;">Ocean Trail Condominium</h2>
//                     <p style="margin: 5px 0 0;">New Contact Form Enquiry</p>
//                 </div>

//                 <div style="padding: 20px; border: 1px solid #eee;">
//                     <p><strong>Full Name:</strong> ${escapeHtml(safeName)}</p>
//                     <p><strong>Email Address:</strong> ${escapeHtml(emailAddress)}</p>
//                     <p><strong>Phone Number:</strong> ${escapeHtml(safePhone || "Not provided")}</p>
//                     <p><strong>Service:</strong> ${escapeHtml(selectedService)}</p>
//                     <hr />
//                     <h3>Message</h3>
//                     <p style="white-space: pre-wrap;">${escapeHtml(safeMessage)}</p>
//                 </div>

//                 <p style="font-size: 12px; color: #777;">
//                     This enquiry was submitted through the Ocean Trail Condominium website. You can reply directly to this email to respond to the sender.
//                 </p>
//             </div>
//         `;

//         const text = [
//             "OCEAN TRAIL CONDOMINIUM",
//             "New Contact Form Enquiry",
//             "",
//             `Full Name: ${safeName}`,
//             `Email Address: ${emailAddress}`,
//             `Phone Number: ${safePhone || "Not provided"}`,
//             `Service: ${selectedService}`,
//             "",
//             "Message:",
//             safeMessage,
//         ].join("\n");

//         // Send enquiry to the company's email with replyTo set to user's email
//         await sendEmail({
//             to: COMPANY_EMAIL,
//             subject: `Website Enquiry: ${selectedService} - ${safeName}`,
//             html,
//             text,
//             replyTo: emailAddress,
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Thank you! Your message has been sent successfully. Our team will contact you soon.",
//         });
//     } catch (error) {
//         console.error("Contact form email error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "We could not send your message right now. Please try again later.",
//         });
//     }
// });

// module.exports = router;


const express = require("express");
const router = express.Router();

const sendEmail = require("../utils/sendEmail");

// =====================================================
// COMPANY EMAIL
// =====================================================

const COMPANY_EMAIL =
    process.env.COMPANY_EMAIL ||
    "oceantrailcondoslekki@gmail.com";

// =====================================================
// ALLOWED CONTACT SERVICES
// =====================================================

const allowedServices = [
    "property-sale",
    "property-rental",
    "short-let",
    "construction",
    "property-management",
    "investment",
    "other",
];

// =====================================================
// HTML ESCAPING
// =====================================================

const escapeHtml = (value = "") => {
    const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    };

    return String(value).replace(/[&<>"']/g, (character) => {
        return entities[character];
    });
};

// =====================================================
// CONTACT FORM
// POST /api/contact
// =====================================================

router.post("/", async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            service,
            message,
            website,
        } = req.body || {};

        // -------------------------------------------------
        // HONEYPOT
        // -------------------------------------------------

        if (website) {
            return res.status(200).json({
                success: true,
                message: "Your message has been received.",
            });
        }

        // -------------------------------------------------
        // VALIDATE INPUT TYPES
        // -------------------------------------------------

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof service !== "string" ||
            typeof message !== "string" ||
            (phone !== undefined && typeof phone !== "string")
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid contact information.",
            });
        }

        const safeName = name.trim();
        const emailAddress = email.trim().toLowerCase();
        const safePhone = (phone || "").trim();
        const safeMessage = message.trim();

        // -------------------------------------------------
        // REQUIRED FIELDS
        // -------------------------------------------------

        if (
            !safeName ||
            !emailAddress ||
            !service ||
            !safeMessage
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide your name, email, service and message.",
            });
        }

        // -------------------------------------------------
        // FIELD LENGTH VALIDATION
        // -------------------------------------------------

        if (
            safeName.length > 100 ||
            emailAddress.length > 254 ||
            safePhone.length > 30 ||
            safeMessage.length > 5000
        ) {
            return res.status(400).json({
                success: false,
                message: "One or more fields exceed the allowed length.",
            });
        }

        // -------------------------------------------------
        // EMAIL VALIDATION
        // -------------------------------------------------

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(emailAddress)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        if (/[\r\n]/.test(emailAddress)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address.",
            });
        }

        // -------------------------------------------------
        // SERVICE VALIDATION
        // -------------------------------------------------

        if (!allowedServices.includes(service)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid service.",
            });
        }

        // -------------------------------------------------
        // SERVICE NAMES
        // -------------------------------------------------

        const serviceNames = {
            "property-sale": "Property Purchase",
            "property-rental": "Property Rental",
            "short-let": "Short Let",
            construction: "Building & Construction",
            "property-management": "Property Management",
            investment: "Real Estate Investment",
            other: "Other Enquiry",
        };

        const selectedService = serviceNames[service];

        // =================================================
        // COMPANY EMAIL CONTENT
        // =================================================

        const companyHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">

                <div style="background: #4B4F93; color: white; padding: 20px;">
                    <h2 style="margin: 0;">Ocean Trail Condominium</h2>
                    <p style="margin: 5px 0 0;">New Contact Form Enquiry</p>
                </div>

                <div style="padding: 20px; border: 1px solid #eee;">

                    <p><strong>Full Name:</strong>
                        ${escapeHtml(safeName)}
                    </p>

                    <p><strong>Email Address:</strong>
                        ${escapeHtml(emailAddress)}
                    </p>

                    <p><strong>Phone Number:</strong>
                        ${escapeHtml(safePhone || "Not provided")}
                    </p>

                    <p><strong>Service:</strong>
                        ${escapeHtml(selectedService)}
                    </p>

                    <hr />

                    <h3>Message</h3>

                    <p style="white-space: pre-wrap;">
                        ${escapeHtml(safeMessage)}
                    </p>

                </div>

                <p style="font-size: 12px; color: #777;">
                    This enquiry was submitted through the Ocean Trail
                    Condominium website. Reply directly to this email
                    to respond to the sender.
                </p>

            </div>
        `;

        const companyText = [
            "OCEAN TRAIL CONDOMINIUM",
            "New Contact Form Enquiry",
            "",
            `Full Name: ${safeName}`,
            `Email Address: ${emailAddress}`,
            `Phone Number: ${safePhone || "Not provided"}`,
            `Service: ${selectedService}`,
            "",
            "Message:",
            safeMessage,
        ].join("\n");

        // =================================================
        // CLIENT CONFIRMATION EMAIL CONTENT
        // =================================================

        const clientHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">

                <div style="background: #4B4F93; color: white; padding: 20px;">
                    <h2 style="margin: 0;">Ocean Trail Condominium</h2>
                    <p style="margin: 5px 0 0;">
                        Thank you for contacting us!
                    </p>
                </div>

                <div style="padding: 20px; border: 1px solid #eee;">

                    <p>Dear <strong>${escapeHtml(safeName)}</strong>,</p>

                    <p>
                        Thank you for reaching out to Ocean Trail Condominium.
                        We have successfully received your enquiry regarding
                        <strong>${escapeHtml(selectedService)}</strong>.
                        Our team will get back to you shortly.
                    </p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

                    <h4 style="color: #4B4F93;">
                        A copy of your enquiry details:
                    </h4>

                    <p>
                        <strong>Service Requested:</strong>
                        ${escapeHtml(selectedService)}
                    </p>

                    <p>
                        <strong>Phone Number:</strong>
                        ${escapeHtml(safePhone || "Not provided")}
                    </p>

                    <p><strong>Message:</strong></p>

                    <p style="background: #f9f9f9; padding: 12px; white-space: pre-wrap;">
                        ${escapeHtml(safeMessage)}
                    </p>

                </div>

                <p style="font-size: 12px; color: #777; margin-top: 20px;">
                    Ocean Trail Condominium | 2 Prince Babatunde Oloto
                    Street, Off Mayor Bolaji Ariyo Street, Bevera Estate,
                    Ilasan, Lekki, Lagos State.
                </p>

            </div>
        `;

        const clientText = [
            `Dear ${safeName},`,
            "",
            "Thank you for contacting Ocean Trail Condominium.",
            "We have received your enquiry and our team will get back to you shortly.",
            "",
            "Copy of your enquiry details:",
            `Service: ${selectedService}`,
            `Phone: ${safePhone || "Not provided"}`,
            `Message: ${safeMessage}`,
            "",
            "Best regards,",
            "Ocean Trail Condominium Team",
        ].join("\n");

        // =================================================
        // 1. SEND ENQUIRY TO COMPANY FIRST
        // =================================================

        try {
            await sendEmail({
                to: COMPANY_EMAIL,
                subject: `Service Enquiry: ${selectedService} - ${safeName}`,
                html: companyHtml,
                text: companyText,
                replyTo: emailAddress,
            });

            console.log(
                "OCEAN TRAIL COMPANY CONTACT EMAIL SENT:",
                COMPANY_EMAIL
            );
        } catch (companyEmailError) {
            console.error(
                "OCEAN TRAIL COMPANY CONTACT EMAIL FAILED:",
                {
                    message: companyEmailError.message,
                    code: companyEmailError.code,
                    response: companyEmailError.response,
                    responseCode: companyEmailError.responseCode,
                }
            );

            return res.status(502).json({
                success: false,
                message:
                    "We could not deliver your enquiry to Ocean Trail management. Please try again later.",
            });
        }

        // =================================================
        // 2. SEND CONFIRMATION TO CUSTOMER
        // =================================================

        let confirmationSent = false;

        try {
            await sendEmail({
                to: emailAddress,
                subject:
                    "Confirmation: We received your message - Ocean Trail Condominium",
                html: clientHtml,
                text: clientText,
                replyTo: COMPANY_EMAIL,
            });

            confirmationSent = true;

            console.log(
                "OCEAN TRAIL CUSTOMER CONFIRMATION SENT:",
                emailAddress
            );
        } catch (clientEmailError) {
            console.error(
                "OCEAN TRAIL CUSTOMER CONFIRMATION FAILED:",
                {
                    message: clientEmailError.message,
                    code: clientEmailError.code,
                    response: clientEmailError.response,
                    responseCode: clientEmailError.responseCode,
                }
            );
        }

        // =================================================
        // 3. RETURN RESPONSE
        // =================================================

        return res.status(200).json({
            success: true,
            message: confirmationSent
                ? "Thank you! Your enquiry has been sent successfully. A confirmation copy has also been sent to your email."
                : "Thank you! Your enquiry has been delivered to Ocean Trail management, but we could not send the confirmation email.",
            confirmationSent,
        });

    } catch (error) {
        console.error("OCEAN TRAIL CONTACT FORM ERROR:", {
            message: error.message,
            code: error.code,
            stack: error.stack,
        });

        return res.status(500).json({
            success: false,
            message:
                "We could not process your contact request right now. Please try again later.",
        });
    }
});

module.exports = router;
