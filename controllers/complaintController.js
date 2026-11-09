// const nodemailer = require("nodemailer");
// const Complaint = require("../models/Complaint");
// const Apartment = require("../models/Apartment");

// // ==========================================
// // NODEMAILER TRANSPORTER CONFIGURATION
// // ==========================================
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // Admin email configuration
// const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "oceantrailcondoslekki@gmail.com";

// // ==========================================
// // CREATE TENANT COMPLAINT
// // ==========================================
// const createComplaint = async (req, res) => {
//   try {
//     const { subject, category, description, priority } = req.body;

//     // 1. VALIDATION
//     if (!subject || !description) {
//       return res.status(400).json({
//         success: false,
//         message: "Subject and description are required.",
//       });
//     }

//     // 2. FIND TENANT APARTMENT (Optional / Fallback safe)
//     const apartment = await Apartment.findOne({
//       tenant: req.user._id,
//     });

//     const propertyId = apartment?.property || null;
//     const apartmentId = apartment?._id || null;

//     // Handle File Path if Uploaded
//     const attachmentUrl = req.file
//       ? `/uploads/complaints/${req.file.filename}`
//       : null;

//     // 3. CREATE COMPLAINT IN DATABASE (Targeted to Admin)
//     const complaint = await Complaint.create({
//       tenant: req.user._id,
//       property: propertyId,
//       apartment: apartmentId,
//       subject: subject.trim(),
//       category: category || "Other",
//       description: description.trim(),
//       priority: priority || "Medium",
//       attachment: attachmentUrl,
//     });

//     // 4. POPULATE COMPLAINT DETAILS
//     const populatedComplaint = await Complaint.findById(complaint._id)
//       .populate("tenant", "fullName email phone")
//       .populate("property", "name address city state")
//       .populate("apartment", "apartmentNumber block floor apartmentType");

//     // 5. DISPATCH EMAIL NOTIFICATION TO ADMIN EXCLUSIVELY
//     const tenantName = populatedComplaint.tenant
//       ? populatedComplaint.tenant.fullName
//       : req.user.fullName || "Tenant";

//     const unitInfo = populatedComplaint.apartment
//       ? `${populatedComplaint.apartment.apartmentNumber} (Block ${
//           populatedComplaint.apartment.block || "N/A"
//         })`
//       : "Unassigned Unit";

//     const mailOptions = {
//       from: `"Ocean Trail Condos Management" <${process.env.EMAIL_USER}>`,
//       to: ADMIN_EMAIL,
//       subject: `🚨 [${(
//         priority || "Medium"
//       ).toUpperCase()} PRIORITY] New Admin Complaint: ${subject.trim()}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
//           <div style="background-color: #4B4F93; padding: 24px; text-align: center; color: #ffffff;">
//             <h2 style="margin: 0; font-size: 20px;">Ocean Trail Condos Lekki</h2>
//             <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">New Tenant Complaint Received</p>
//           </div>
          
//           <div style="padding: 24px; color: #374151;">
//             <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
//               <tr>
//                 <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #4b5563;">Tenant Name:</td>
//                 <td style="padding: 8px 0; color: #111827;">${tenantName}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Apartment/Unit:</td>
//                 <td style="padding: 8px 0; color: #111827;">${unitInfo}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Category:</td>
//                 <td style="padding: 8px 0; color: #111827;">${category || "Other"}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Priority:</td>
//                 <td style="padding: 8px 0;">
//                   <span style="color: ${
//                     priority === "Urgent" || priority === "High"
//                       ? "#dc2626"
//                       : "#2563eb"
//                   }; font-weight: bold;">
//                     ${priority || "Medium"}
//                   </span>
//                 </td>
//               </tr>
//               <tr>
//                 <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Subject:</td>
//                 <td style="padding: 8px 0; font-weight: bold; color: #111827;">${subject.trim()}</td>
//               </tr>
//             </table>

//             <div style="background-color: #f9fafb; border-left: 4px solid #4B4F93; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
//               <p style="margin: 0; font-weight: bold; font-size: 13px; color: #6b7280; text-transform: uppercase;">Description:</p>
//               <p style="margin: 8px 0 0; font-size: 14px; line-height: 1.6; color: #374151;">${description.trim()}</p>
//             </div>

//             ${
//               attachmentUrl
//                 ? `<p style="font-size: 13px; color: #4B4F93;"><strong>Attachment Uploaded:</strong> ${attachmentUrl}</p>`
//                 : ""
//             }

//             <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
//               Submitted at: ${new Date().toLocaleString()}
//             </p>
//           </div>
//         </div>
//       `,
//     };

//     // Dispatch email asynchronously to admin
//     transporter.sendMail(mailOptions).catch((err) => {
//       console.error("Failed to send admin complaint notification email:", err);
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Complaint submitted successfully and forwarded to management.",
//       complaint: populatedComplaint,
//     });
//   } catch (error) {
//     console.error("Create complaint error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Unable to submit complaint.",
//     });
//   }
// };

// // ==========================================
// // GET TENANT COMPLAINTS
// // ==========================================
// const getTenantComplaints = async (req, res) => {
//   try {
//     const complaints = await Complaint.find({
//       tenant: req.user._id,
//     })
//       .populate("property", "name address")
//       .populate("apartment", "apartmentNumber block floor")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: complaints.length,
//       complaints,
//     });
//   } catch (error) {
//     console.error("Get tenant complaints error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to load complaints.",
//     });
//   }
// };

// // ==========================================
// // GET SINGLE TENANT COMPLAINT
// // ==========================================
// const getTenantComplaint = async (req, res) => {
//   try {
//     const complaint = await Complaint.findOne({
//       _id: req.params.id,
//       tenant: req.user._id,
//     })
//       .populate("property", "name address city state")
//       .populate("apartment", "apartmentNumber block floor apartmentType");

//     if (!complaint) {
//       return res.status(404).json({
//         success: false,
//         message: "Complaint not found.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       complaint,
//     });
//   } catch (error) {
//     console.error("Get tenant complaint error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to load complaint.",
//     });
//   }
// };

// // ==========================================
// // GET ADMIN COMPLAINTS (FOR ADMIN DASHBOARD)
// // ==========================================
// const getLandlordComplaints = async (req, res) => {
//   try {
//     // Admin route: Retrieves all submitted tenant complaints for the admin portal
//     const complaints = await Complaint.find({})
//       .populate("tenant", "fullName email phone")
//       .populate("property", "name address city state")
//       .populate("apartment", "apartmentNumber block floor apartmentType")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: complaints.length,
//       complaints,
//     });
//   } catch (error) {
//     console.error("Get admin complaints error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to load complaints.",
//     });
//   }
// };

// // ==========================================
// // ADMIN UPDATE COMPLAINT
// // ==========================================
// const updateComplaint = async (req, res) => {
//   try {
//     const { status, landlordResponse, adminResponse } = req.body;

//     // Admin query: Locate complaint by ID
//     const complaint = await Complaint.findById(req.params.id);

//     if (!complaint) {
//       return res.status(404).json({
//         success: false,
//         message: "Complaint not found.",
//       });
//     }

//     if (status !== undefined) {
//       complaint.status = status;
//       complaint.resolvedAt =
//         status === "Resolved" || status === "Closed" ? new Date() : null;
//     }

//     // Supports both adminResponse and legacy landlordResponse fields
//     const responseText = adminResponse || landlordResponse;
//     if (responseText !== undefined) {
//       complaint.adminResponse = responseText.trim();
//       complaint.landlordResponse = responseText.trim(); // Keep fallback compatible
//       if (responseText.trim()) {
//         complaint.respondedAt = new Date();
//       }
//     }

//     await complaint.save();

//     const updated = await Complaint.findById(complaint._id)
//       .populate("tenant", "fullName email phone")
//       .populate("property", "name address")
//       .populate("apartment", "apartmentNumber block floor");

//     return res.status(200).json({
//       success: true,
//       message: "Complaint updated successfully.",
//       complaint: updated,
//     });
//   } catch (error) {
//     console.error("Update complaint error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to update complaint.",
//     });
//   }
// };

// module.exports = {
//   createComplaint,
//   getTenantComplaints,
//   getTenantComplaint,
//   getLandlordComplaints,
//   updateComplaint,
// };



const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const Complaint = require("../models/Complaint");
const Apartment = require("../models/Apartment");

// ==========================================
// NODEMAILER TRANSPORTER CONFIGURATION
// ==========================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Admin email configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "oceantrailcondoslekki@gmail.com";

// ==========================================
// CREATE TENANT COMPLAINT
// ==========================================
const createComplaint = async (req, res) => {
  try {
    const { subject, category, description, priority } = req.body;

    // 1. VALIDATION
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required.",
      });
    }

    // 2. FIND TENANT APARTMENT (Optional / Fallback safe)
    const apartment = await Apartment.findOne({
      tenant: req.user._id,
    });

    const propertyId = apartment?.property || null;
    const apartmentId = apartment?._id || null;

    // Ensure complaints upload directory exists before saving file
    if (req.file) {
      const uploadDir = path.join(__dirname, "../uploads/complaints");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    }

    // Handle File Path if Uploaded
    const attachmentUrl = req.file
      ? `/uploads/complaints/${req.file.filename}`
      : null;

    // 3. CREATE COMPLAINT IN DATABASE (Targeted to Admin)
    const complaint = await Complaint.create({
      tenant: req.user._id,
      property: propertyId,
      apartment: apartmentId,
      subject: subject.trim(),
      category: category || "Other",
      description: description.trim(),
      priority: priority || "Medium",
      attachment: attachmentUrl,
    });

    // 4. POPULATE COMPLAINT DETAILS
    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("tenant", "fullName email phone")
      .populate("property", "name address city state")
      .populate("apartment", "apartmentNumber block floor apartmentType");

    // 5. DISPATCH EMAIL NOTIFICATION TO ADMIN EXCLUSIVELY
    const tenantName = populatedComplaint.tenant
      ? populatedComplaint.tenant.fullName
      : req.user.fullName || "Tenant";

    const unitInfo = populatedComplaint.apartment
      ? `${populatedComplaint.apartment.apartmentNumber} (Block ${
          populatedComplaint.apartment.block || "N/A"
        })`
      : "Unassigned Unit";

    const mailOptions = {
      from: `"Ocean Trail Condos Management" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `🚨 [${(
        priority || "Medium"
      ).toUpperCase()} PRIORITY] New Admin Complaint: ${subject.trim()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #4B4F93; padding: 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px;">Ocean Trail Condos Lekki</h2>
            <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">New Tenant Complaint Received</p>
          </div>
          
          <div style="padding: 24px; color: #374151;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #4b5563;">Tenant Name:</td>
                <td style="padding: 8px 0; color: #111827;">${tenantName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Apartment/Unit:</td>
                <td style="padding: 8px 0; color: #111827;">${unitInfo}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Category:</td>
                <td style="padding: 8px 0; color: #111827;">${category || "Other"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Priority:</td>
                <td style="padding: 8px 0;">
                  <span style="color: ${
                    priority === "Urgent" || priority === "High"
                      ? "#dc2626"
                      : "#2563eb"
                  }; font-weight: bold;">
                    ${priority || "Medium"}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Subject:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #111827;">${subject.trim()}</td>
              </tr>
            </table>

            <div style="background-color: #f9fafb; border-left: 4px solid #4B4F93; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0; font-weight: bold; font-size: 13px; color: #6b7280; text-transform: uppercase;">Description:</p>
              <p style="margin: 8px 0 0; font-size: 14px; line-height: 1.6; color: #374151;">${description.trim()}</p>
            </div>

            ${
              attachmentUrl
                ? `<p style="font-size: 13px; color: #4B4F93;"><strong>Attachment Uploaded:</strong> ${attachmentUrl}</p>`
                : ""
            }

            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
              Submitted at: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
    };

    // Dispatch email asynchronously to admin
    transporter.sendMail(mailOptions).catch((err) => {
      console.error("Failed to send admin complaint notification email:", err);
    });

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully and forwarded to management.",
      complaint: populatedComplaint,
    });
  } catch (error) {
    console.error("Create complaint error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to submit complaint.",
    });
  }
};

// ==========================================
// GET TENANT COMPLAINTS
// ==========================================
const getTenantComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      tenant: req.user._id,
    })
      .populate("property", "name address")
      .populate("apartment", "apartmentNumber block floor")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Get tenant complaints error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load complaints.",
    });
  }
};

// ==========================================
// GET SINGLE TENANT COMPLAINT
// ==========================================
const getTenantComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      tenant: req.user._id,
    })
      .populate("property", "name address city state")
      .populate("apartment", "apartmentNumber block floor apartmentType");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    return res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error("Get tenant complaint error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load complaint.",
    });
  }
};

// ==========================================
// GET ADMIN COMPLAINTS (FOR ADMIN DASHBOARD)
// ==========================================
const getLandlordComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({})
      .populate("tenant", "fullName email phone")
      .populate("property", "name address city state")
      .populate("apartment", "apartmentNumber block floor apartmentType")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Get admin complaints error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load complaints.",
    });
  }
};

// ==========================================
// ADMIN UPDATE COMPLAINT
// ==========================================
const updateComplaint = async (req, res) => {
  try {
    const { status, landlordResponse, adminResponse } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    if (status !== undefined) {
      complaint.status = status;
      complaint.resolvedAt =
        status === "Resolved" || status === "Closed" ? new Date() : null;
    }

    const responseText = adminResponse || landlordResponse;
    if (responseText !== undefined) {
      complaint.adminResponse = responseText.trim();
      complaint.landlordResponse = responseText.trim();
      if (responseText.trim()) {
        complaint.respondedAt = new Date();
      }
    }

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate("tenant", "fullName email phone")
      .populate("property", "name address")
      .populate("apartment", "apartmentNumber block floor");

    return res.status(200).json({
      success: true,
      message: "Complaint updated successfully.",
      complaint: updated,
    });
  } catch (error) {
    console.error("Update complaint error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update complaint.",
    });
  }
};

module.exports = {
  createComplaint,
  getTenantComplaints,
  getTenantComplaint,
  getLandlordComplaints,
  updateComplaint,
};