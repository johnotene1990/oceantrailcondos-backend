const nodemailer = require("nodemailer");
const path = require("path");

const Complaint = require("../models/Complaint");
const Apartment = require("../models/Apartment");

// ==========================================
// EMAIL CONFIGURATION
// ==========================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "oceantrailcondoslekki@gmail.com";

// ==========================================
// ROLE AND ACCESS HELPERS
// ==========================================

const getUserRole = (user) => {
  return String(user?.role || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
};

const isManagement = (user) => {
  const role = getUserRole(user);

  return [
    "admin",
    "super_admin",
    "property_manager",
  ].includes(role);
};

const canManageComplaint = (user, complaint) => {
  if (isManagement(user)) {
    return true;
  }

  const role = getUserRole(user);

  // A landlord can only manage complaints assigned to them.
  if (role === "landlord") {
    return (
      complaint.landlord &&
      complaint.landlord.toString() === user._id.toString()
    );
  }

  return false;
};

const isComplaintOwner = (user, complaint) => {
  return (
    complaint.tenant &&
    complaint.tenant.toString() === user._id.toString()
  );
};

// ==========================================
// FILE ATTACHMENT HELPER
// Supports images, videos and documents.
// Current upload route uses Multer disk storage.
// ==========================================

const buildAttachments = (files = []) => {
  return files
    .filter((file) => file && file.filename)
    .map((file) => {
      const mimeType = file.mimetype || "application/octet-stream";

      let resourceType = "document";

      if (mimeType.startsWith("image/")) {
        resourceType = "image";
      } else if (mimeType.startsWith("video/")) {
        resourceType = "video";
      }

      return {
        originalName: file.originalname || path.basename(file.filename),
        url: `/uploads/complaints/${file.filename}`,
        mimeType,
        resourceType,
        size: file.size || 0,
      };
    });
};

const getUploadedFiles = (req) => {
  if (Array.isArray(req.files)) {
    return req.files;
  }

  // Backward compatibility with the old upload.single("attachment") route.
  if (req.file) {
    return [req.file];
  }

  return [];
};

// ==========================================
// POPULATE COMPLAINT DETAILS
// ==========================================

const populateComplaint = (query) => {
  return query
    .populate("tenant", "fullName email phone")
    .populate("landlord", "fullName email phone")
    .populate("property", "name address city state")
    .populate(
      "apartment",
      "apartmentNumber block floor apartmentType"
    )
    .populate("messages.sender", "fullName email role");
};

// ==========================================
// CREATE TENANT COMPLAINT
// ==========================================

const createComplaint = async (req, res) => {
  try {
    const {
      subject,
      category,
      description,
      priority,
    } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required.",
      });
    }

    if (subject.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: "Subject cannot exceed 150 characters.",
      });
    }

    if (description.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 2000 characters.",
      });
    }

    // Find the tenant's apartment.
    const apartment = await Apartment.findOne({
      tenant: req.user._id,
    });

    // Property and apartment are required by the Complaint model.
    if (!apartment || !apartment.property) {
      return res.status(400).json({
        success: false,
        message:
          "Your account is not currently assigned to an apartment. Please contact management.",
      });
    }

    const uploadedFiles = getUploadedFiles(req);
    const attachments = buildAttachments(uploadedFiles);

    // Preserve the old attachment field for compatibility.
    const legacyAttachment =
      attachments.length > 0 ? attachments[0].url : null;

    const complaint = await Complaint.create({
      tenant: req.user._id,
      property: apartment.property,
      apartment: apartment._id,
      subject: subject.trim(),
      category: category || "Other",
      description: description.trim(),
      priority: priority || "Medium",
      attachment: legacyAttachment,
      attachments,
    });

    const populatedComplaint = await populateComplaint(
      Complaint.findById(complaint._id)
    );

    // ======================================
    // EMAIL NOTIFICATION TO ADMIN
    // ======================================

    const tenantName =
      populatedComplaint.tenant?.fullName ||
      req.user.fullName ||
      "Tenant";

    const apartmentInfo = populatedComplaint.apartment
      ? `${populatedComplaint.apartment.apartmentNumber || "N/A"} (Block ${
          populatedComplaint.apartment.block || "N/A"
        })`
      : "Unassigned Unit";

    const attachmentHtml =
      attachments.length > 0
        ? `
          <div style="margin-top:20px;">
            <strong>Attachments submitted:</strong>
            <ul>
              ${attachments
                .map(
                  (item) => `
                    <li>
                      ${item.originalName} (${item.resourceType})
                    </li>
                  `
                )
                .join("")}
            </ul>
          </div>
        `
        : "";

    const mailOptions = {
      from: `"Ocean Trail Condos Management" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `[${(priority || "Medium").toUpperCase()} PRIORITY] New Tenant Complaint: ${subject.trim()}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:#4B4F93;padding:24px;text-align:center;color:white;">
            <h2 style="margin:0;">Ocean Trail Condos Lekki</h2>
            <p>New Tenant Complaint Received</p>
          </div>

          <div style="padding:24px;color:#374151;">
            <p><strong>Tenant:</strong> ${tenantName}</p>
            <p><strong>Apartment:</strong> ${apartmentInfo}</p>
            <p><strong>Category:</strong> ${category || "Other"}</p>
            <p><strong>Priority:</strong> ${priority || "Medium"}</p>
            <p><strong>Subject:</strong> ${subject.trim()}</p>

            <div style="background:#f9fafb;padding:16px;border-left:4px solid #4B4F93;">
              <strong>Description:</strong>
              <p>${description.trim()}</p>
            </div>

            ${attachmentHtml}

            <p style="font-size:12px;color:#9ca3af;margin-top:25px;">
              Submitted: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
    };

    transporter.sendMail(mailOptions).catch((error) => {
      console.error(
        "Failed to send complaint notification:",
        error
      );
    });

    return res.status(201).json({
      success: true,
      message:
        "Complaint submitted successfully and forwarded to management.",
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
    const complaints = await populateComplaint(
      Complaint.find({
        tenant: req.user._id,
      }).sort({ createdAt: -1 })
    );

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
    const complaint = await populateComplaint(
      Complaint.findOne({
        _id: req.params.id,
        tenant: req.user._id,
      })
    );

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
// GET ALL COMPLAINTS FOR MANAGEMENT
// ==========================================

const getLandlordComplaints = async (req, res) => {
  try {
    if (!isManagement(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorised to view all complaints.",
      });
    }

    const complaints = await populateComplaint(
      Complaint.find({}).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Get management complaints error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load complaints.",
    });
  }
};

// ==========================================
// ADD MESSAGE TO COMPLAINT CONVERSATION
// Tenant, assigned landlord or management
// ==========================================

const addComplaintMessage = async (req, res) => {
  try {
    const { message } = req.body;

    const uploadedFiles = getUploadedFiles(req);
    const attachments = buildAttachments(uploadedFiles);

    if ((!message || !message.trim()) && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a message or attach a file.",
      });
    }

    if (message && message.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 2000 characters.",
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    const isOwner = isComplaintOwner(req.user, complaint);
    const isManager = canManageComplaint(req.user, complaint);

    if (!isOwner && !isManager) {
      return res.status(403).json({
        success: false,
        message: "You are not authorised to reply to this complaint.",
      });
    }

    const senderRole = getUserRole(req.user);

    complaint.messages.push({
      sender: req.user._id,
      senderRole,
      message: message ? message.trim() : "",
      attachments,
      createdAt: new Date(),
    });

    // Keep legacy response fields updated for older frontend screens.
    if (isManager && message && message.trim()) {
      complaint.adminResponse = message.trim();
      complaint.landlordResponse = message.trim();
      complaint.respondedAt = new Date();
    }

    // A new tenant response reopens the conversation for management.
    if (isOwner && complaint.status === "Resolved") {
      complaint.status = "Awaiting Tenant";
    }

    await complaint.save();

    const updatedComplaint = await populateComplaint(
      Complaint.findById(complaint._id)
    );

    return res.status(201).json({
      success: true,
      message: "Your message has been added to the complaint.",
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Add complaint message error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to send your message.",
    });
  }
};

// ==========================================
// MANAGEMENT UPDATE COMPLAINT
// Update status and/or send a response.
// ==========================================

const updateComplaint = async (req, res) => {
  try {
    const {
      status,
      landlordResponse,
      adminResponse,
    } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    if (!canManageComplaint(req.user, complaint)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorised to update this complaint.",
      });
    }

    const validStatuses = [
      "Pending",
      "Under Review",
      "In Progress",
      "Awaiting Tenant",
      "Resolved",
      "Closed",
    ];

    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid complaint status.",
        });
      }

      complaint.status = status;

      complaint.resolvedAt =
        status === "Resolved" || status === "Closed"
          ? new Date()
          : null;
    }

    // Support both old response field names.
    const responseText =
      adminResponse !== undefined
        ? adminResponse
        : landlordResponse;

    if (responseText !== undefined) {
      if (typeof responseText !== "string") {
        return res.status(400).json({
          success: false,
          message: "Response must be text.",
        });
      }

      if (responseText.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Response cannot exceed 2000 characters.",
        });
      }

      complaint.adminResponse = responseText.trim();
      complaint.landlordResponse = responseText.trim();

      if (responseText.trim()) {
        complaint.respondedAt = new Date();

        // Also save the response in conversation history.
        complaint.messages.push({
          sender: req.user._id,
          senderRole: getUserRole(req.user),
          message: responseText.trim(),
          attachments: [],
          createdAt: new Date(),
        });
      }
    }

    await complaint.save();

    const updatedComplaint = await populateComplaint(
      Complaint.findById(complaint._id)
    );

    return res.status(200).json({
      success: true,
      message: "Complaint updated successfully.",
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Update complaint error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to update complaint.",
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createComplaint,
  getTenantComplaints,
  getTenantComplaint,
  getLandlordComplaints,
  addComplaintMessage,
  updateComplaint,
};
