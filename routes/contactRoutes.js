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

// Company email that receives all contact enquiries
const COMPANY_EMAIL = "oceantrailcondoslekki@gmail.com";

// Allowed contact services
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
// SEND CONTACT FORM MESSAGE
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

        // Honeypot: silently accept automated form submissions
        if (website) {
            return res.status(200).json({
                success: true,
                message: "Your message has been received.",
            });
        }

        // Validate required fields
        if (
            !name?.trim() ||
            !email?.trim() ||
            !service ||
            !message?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide your name, email, service and message.",
            });
        }

        // Validate field lengths
        if (
            name.trim().length > 100 ||
            email.trim().length > 254 ||
            (phone && phone.trim().length > 30) ||
            message.trim().length > 5000
        ) {
            return res.status(400).json({
                success: false,
                message: "One or more fields exceed the allowed length.",
            });
        }

        // Validate email format
        const emailAddress = email.trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(emailAddress)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        // Validate selected service
        if (!allowedServices.includes(service)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid service.",
            });
        }

        // Prevent header injection
        if (/[\r\n]/.test(emailAddress)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address.",
            });
        }

        const serviceNames = {
            "property-sale": "Property Purchase",
            "property-rental": "Property Rental",
            "short-let": "Short Let",
            construction: "Building & Construction",
            "property-management": "Property Management",
            investment: "Real Estate Investment",
            other: "Other Enquiry",
        };

        const safeName = name.trim();
        const safePhone = (phone || "").trim();
        const safeMessage = message.trim();
        const selectedService = serviceNames[service];

        // Escape user-provided values before inserting into HTML
        const escapeHtml = (value = "") =>
            String(value).replace(/[&<>"']/g, (character) => {
                const entities = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                };
                return entities[character];
            });

        // -----------------------------------------------------
        // 1. EMAIL CONTENT FOR COMPANY
        // -----------------------------------------------------
        const companyHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
                <div style="background: #4B4F93; color: white; padding: 20px;">
                    <h2 style="margin: 0;">Ocean Trail Condominium</h2>
                    <p style="margin: 5px 0 0;">New Contact Form Enquiry</p>
                </div>

                <div style="padding: 20px; border: 1px solid #eee;">
                    <p><strong>Full Name:</strong> ${escapeHtml(safeName)}</p>
                    <p><strong>Email Address:</strong> ${escapeHtml(emailAddress)}</p>
                    <p><strong>Phone Number:</strong> ${escapeHtml(safePhone || "Not provided")}</p>
                    <p><strong>Service:</strong> ${escapeHtml(selectedService)}</p>
                    <hr />
                    <h3>Message</h3>
                    <p style="white-space: pre-wrap;">${escapeHtml(safeMessage)}</p>
                </div>

                <p style="font-size: 12px; color: #777;">
                    This enquiry was submitted through the Ocean Trail Condominium website. You can reply directly to this email to respond to the sender.
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

        // -----------------------------------------------------
        // 2. EMAIL CONTENT FOR CLIENT (COPY / ACKNOWLEDGMENT)
        // -----------------------------------------------------
        const clientHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
                <div style="background: #4B4F93; color: white; padding: 20px;">
                    <h2 style="margin: 0;">Ocean Trail Condominium</h2>
                    <p style="margin: 5px 0 0;">Thank you for contacting us!</p>
                </div>

                <div style="padding: 20px; border: 1px solid #eee;">
                    <p>Dear <strong>${escapeHtml(safeName)}</strong>,</p>
                    <p>Thank you for reaching out to Ocean Trail Condominium. We have successfully received your enquiry regarding <strong>${escapeHtml(selectedService)}</strong> and our team will get back to you shortly.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    
                    <h4 style="margin-bottom: 10px; color: #4B4F93;">A copy of your enquiry details:</h4>
                    <p style="margin: 4px 0;"><strong>Service Requested:</strong> ${escapeHtml(selectedService)}</p>
                    <p style="margin: 4px 0;"><strong>Phone Number:</strong> ${escapeHtml(safePhone || "Not provided")}</p>
                    <p style="margin: 4px 0;"><strong>Message:</strong></p>
                    <p style="background: #f9f9f9; padding: 12px; border-radius: 6px; white-space: pre-wrap;">${escapeHtml(safeMessage)}</p>
                </div>

                <p style="font-size: 12px; color: #777; margin-top: 20px;">
                    Ocean Trail Condominium | 2 Prince Babatunde Oloto Street, Off mayor Bolaji Ariyo Street, Bevera Estate, Ilasan, Lekki, Lagos State.
                </p>
            </div>
        `;

        const clientText = [
            `Dear ${safeName},`,
            "",
            "Thank you for contacting Ocean Trail Condominium. We have received your enquiry and our team will get back to you shortly.",
            "",
            "Copy of your message details:",
            `Service: ${selectedService}`,
            `Phone: ${safePhone || "Not provided"}`,
            `Message: ${safeMessage}`,
            "",
            "Best regards,",
            "Ocean Trail Condominium Team",
        ].join("\n");

        // -----------------------------------------------------
        // 3. SEND BOTH EMAILS IN PARALLEL
        // -----------------------------------------------------
        await Promise.all([
            // Email 1: Send enquiry to the company email
            sendEmail({
                to: COMPANY_EMAIL,
                subject: `Service Enquiry: ${selectedService} - ${safeName}`,
                html: companyHtml,
                text: companyText,
                replyTo: emailAddress,
            }),

            // Email 2: Send copy/confirmation to the client's email address
            sendEmail({
                to: emailAddress,
                subject: `Confirmation: We received your message - Ocean Trail Condominium`,
                html: clientHtml,
                text: clientText,
                replyTo: COMPANY_EMAIL,
            }),
        ]);

        return res.status(200).json({
            success: true,
            message:
                "Thank you! Your message has been sent successfully. A confirmation copy has also been sent to your email.",
        });
    } catch (error) {
        console.error("Contact form email error:", error.message);

        return res.status(500).json({
            success: false,
            message:
                "We could not send your message right now. Please try again later.",
        });
    }
});

module.exports = router;