// const mongoose = require("mongoose");
// const fs = require("fs");
// const path = require("path");

// const RepairRequest = require("../models/RepairRequest");
// const Apartment = require("../models/Apartment");
// const User = require("../models/User");
// const TenantNotification = require("../models/Notification");
// const sendEmail = require("../utils/sendEmail");

// // ======================================================
// // CONFIGURATION
// // ======================================================

// const ADMIN_EMAIL =
//   process.env.COMPANY_EMAIL || "oceantrailcondoslekki@gmail.com";

// const allowedStatuses = [
//   "Pending",
//   "Assigned",
//   "In Progress",
//   "Completed",
//   "Cancelled",
// ];

// const MANAGEMENT_ROLES = [
//   "admin",
//   "super_admin",
//   "property_manager",
// ];

// const REPAIR_UPLOAD_DIRECTORY = path.join(
//   process.cwd(),
//   "uploads",
//   "repairs"
// );

// // Ensure the repair upload directory exists.
// if (!fs.existsSync(REPAIR_UPLOAD_DIRECTORY)) {
//   fs.mkdirSync(REPAIR_UPLOAD_DIRECTORY, { recursive: true });
// }

// // ======================================================
// // GENERAL HELPERS
// // ======================================================

// const getUserRole = (user) => {
//   return String(user?.role || "").toLowerCase();
// };

// const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// const getPublicFileUrl = (req, filename) => {
//   const baseUrl =
//     process.env.BACKEND_URL ||
//     `${req.protocol}://${req.get("host")}`;

//   return `${baseUrl.replace(/\/$/, "")}/uploads/repairs/${filename}`;
// };

// const getFileResourceType = (mimeType = "") => {
//   if (mimeType.startsWith("image/")) return "image";
//   if (mimeType.startsWith("video/")) return "video";

//   if (
//     mimeType === "application/pdf" ||
//     mimeType.includes("word") ||
//     mimeType.includes("document")
//   ) {
//     return "document";
//   }

//   return "raw";
// };

// const sanitizeFilename = (filename = "attachment") => {
//   return path
//     .basename(filename)
//     .replace(/[^a-zA-Z0-9._-]/g, "_")
//     .slice(-150);
// };

// /**
//  * Supports:
//  * - Multer memoryStorage: file.buffer
//  * - Multer diskStorage: file.path
//  * - upload.single(): req.file
//  * - upload.array()/fields(): req.files
//  *
//  * The Repair model must contain the attachments subdocument
//  * described in the previous model update.
//  */
// const saveUploadedFiles = async (req) => {
//   let files = [];

//   if (req.file) {
//     files.push(req.file);
//   }

//   if (Array.isArray(req.files)) {
//     files = files.concat(req.files);
//   } else if (req.files && typeof req.files === "object") {
//     Object.values(req.files).forEach((fileGroup) => {
//       if (Array.isArray(fileGroup)) {
//         files = files.concat(fileGroup);
//       }
//     });
//   }

//   const attachments = [];

//   for (const file of files) {
//     if (!file) continue;

//     let filename = file.filename;

//     // Save memoryStorage files to the repair uploads directory.
//     if (file.buffer) {
//       const safeOriginalName = sanitizeFilename(
//         file.originalname || file.originalName || "attachment"
//       );

//       const extension = path.extname(safeOriginalName);

//       filename = `${Date.now()}-${Math.random()
//         .toString(36)
//         .slice(2, 10)}${extension}`;

//       const destination = path.join(
//         REPAIR_UPLOAD_DIRECTORY,
//         filename
//       );

//       await fs.promises.writeFile(destination, file.buffer);
//     }

//     // For diskStorage, use the existing filename.
//     if (!filename && file.path) {
//       filename = path.basename(file.path);
//     }

//     if (!filename) continue;

//     const originalName =
//       file.originalname ||
//       file.originalName ||
//       filename;

//     attachments.push({
//       originalName,
//       url: getPublicFileUrl(req, filename),
//       mimeType: file.mimetype || "application/octet-stream",
//       resourceType: getFileResourceType(file.mimetype),
//       size: file.size || 0,
//     });
//   }

//   return attachments;
// };

// const getRepairPopulate = () => [
//   {
//     path: "tenant",
//     select: "fullName email phone role block floor apartment",
//   },
//   {
//     path: "landlord",
//     select: "fullName email phone role",
//   },
//   {
//     path: "property",
//     select: "name address city state",
//   },
//   {
//     path: "apartment",
//     select: "apartmentNumber block floor",
//   },
//   {
//     path: "respondedBy",
//     select: "fullName email role",
//   },
//   {
//     path: "messages.sender",
//     select: "fullName email role",
//   },
// ];

// const populateRepair = async (repair) => {
//   if (!repair) return null;

//   await repair.populate(getRepairPopulate());

//   return repair;
// };

// const getRequestMessage = (value) => {
//   if (typeof value !== "string") return "";
//   return value.trim().slice(0, 2000);
// };

// const sendRepairEmail = async ({ email, subject, message }) => {
//   if (!email) return;

//   try {
//     await sendEmail({
//       email,
//       subject,
//       message,
//     });
//   } catch (error) {
//     console.error("Repair email notification failed:", error.message);
//   }
// };

// const createRepairNotification = async ({
//   userId,
//   title,
//   message,
//   repairId,
// }) => {
//   if (!userId) return;

//   try {
//     await TenantNotification.create({
//       user: userId,
//       title,
//       message,
//       type: "repair",
//       relatedId: repairId,
//     });
//   } catch (error) {
//     // Notification failure must not prevent the repair conversation
//     // from being saved.
//     console.error(
//       "Repair database notification failed:",
//       error.message
//     );
//   }
// };

// // ======================================================
// // ACCESS CONTROL FOR REPAIR CONVERSATIONS
// // ======================================================

// const canAccessRepair = (repair, user) => {
//   if (!repair || !user) return false;

//   const role = getUserRole(user);
//   const userId = String(user._id);

//   if (MANAGEMENT_ROLES.includes(role)) {
//     return true;
//   }

//   if (role === "tenant") {
//     return String(repair.tenant) === userId;
//   }

//   if (role === "landlord") {
//     return (
//       repair.landlord &&
//       String(repair.landlord) === userId
//     );
//   }

//   return false;
// };

// const canSendRepairMessage = (repair, user) => {
//   return canAccessRepair(repair, user);
// };

// // ======================================================
// // CREATE REPAIR REQUEST - TENANT
// // ======================================================

// const createRepairRequest = async (req, res) => {
//   try {
//     const { title, category, description, priority } = req.body;

//     if (!title || !description) {
//       return res.status(400).json({
//         success: false,
//         message: "Repair title and description are required.",
//       });
//     }

//     const tenant = await User.findById(req.user._id).select(
//       "fullName email phone role block floor apartment"
//     );

//     if (!tenant) {
//       return res.status(404).json({
//         success: false,
//         message: "Tenant account not found.",
//       });
//     }

//     let apartmentRecord = null;

//     try {
//       apartmentRecord = await Apartment.findOne({
//         tenant: req.user._id,
//       }).populate("property", "name address city state landlord");
//     } catch (error) {
//       console.error("Apartment lookup failed:", error.message);
//     }

//     const attachments = await saveUploadedFiles(req);

//     const repairData = {
//       tenant: req.user._id,
//       title: title.trim(),
//       category: category || "General",
//       description: description.trim(),
//       priority: priority || "Medium",
//       status: "Pending",
//       attachments,
//       messages: [],
//     };

//     if (apartmentRecord) {
//       repairData.apartment = apartmentRecord._id;

//       if (apartmentRecord.property) {
//         repairData.property = apartmentRecord.property._id;

//         if (apartmentRecord.property.landlord) {
//           repairData.landlord =
//             apartmentRecord.property.landlord;
//         }
//       }
//     }

//     const repairRequest = await RepairRequest.create(repairData);

//     await populateRepair(repairRequest);

//     await sendRepairEmail({
//       email: ADMIN_EMAIL,
//       subject: "New Repair Request - Ocean Trail Condominium",
//       message: `
// A new repair request has been submitted.

// Tenant: ${tenant.fullName || "N/A"}
// Email: ${tenant.email || "N/A"}
// Phone: ${tenant.phone || "N/A"}

// Title: ${title}
// Category: ${category || "General"}
// Priority: ${priority || "Medium"}

// Description:
// ${description}

// Please log in to the Ocean Trail management dashboard to review this request.
//       `,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Repair request submitted successfully.",
//       repairRequest,
//     });
//   } catch (error) {
//     console.error("Create repair request error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to submit repair request.",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // GET TENANT REPAIR REQUESTS
// // ======================================================

// const getTenantRepairRequests = async (req, res) => {
//   try {
//     const repairRequests = await RepairRequest.find({
//       tenant: req.user._id,
//     })
//       .populate(getRepairPopulate())
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: repairRequests.length,
//       repairRequests,
//     });
//   } catch (error) {
//     console.error("Get tenant repair requests error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to retrieve repair requests.",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // GET SINGLE TENANT REPAIR REQUEST
// // ======================================================

// const getTenantRepairRequest = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!isValidId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid repair request ID.",
//       });
//     }

//     const repairRequest = await RepairRequest.findOne({
//       _id: id,
//       tenant: req.user._id,
//     }).populate(getRepairPopulate());

//     if (!repairRequest) {
//       return res.status(404).json({
//         success: false,
//         message: "Repair request not found.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       repairRequest,
//     });
//   } catch (error) {
//     console.error("Get single tenant repair error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to retrieve repair request.",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // GET LANDLORD REPAIR REQUESTS
// // ======================================================

// const getLandlordRepairRequests = async (req, res) => {
//   try {
//     const repairRequests = await RepairRequest.find({
//       landlord: req.user._id,
//     })
//       .populate(getRepairPopulate())
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: repairRequests.length,
//       repairRequests,
//     });
//   } catch (error) {
//     console.error("Get landlord repair requests error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to retrieve landlord repair requests.",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // UPDATE REPAIR REQUEST - LANDLORD
// // ======================================================

// const updateRepairRequest = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, managementResponse } = req.body;

//     if (!isValidId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid repair request ID.",
//       });
//     }

//     const repairRequest = await RepairRequest.findOne({
//       _id: id,
//       landlord: req.user._id,
//     });

//     if (!repairRequest) {
//       return res.status(404).json({
//         success: false,
//         message: "Repair request not found.",
//       });
//     }

//     if (status && !allowedStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid repair status.",
//       });
//     }

//     if (status) {
//       repairRequest.status = status;

//       if (status === "Completed") {
//         repairRequest.completedAt = new Date();
//       } else if (repairRequest.completedAt) {
//         repairRequest.completedAt = null;
//       }
//     }

//     const responseText = getRequestMessage(managementResponse);

//     if (responseText) {
//       repairRequest.managementResponse = responseText;
//       repairRequest.respondedAt = new Date();
//       repairRequest.respondedBy = req.user._id;
//       repairRequest.respondedByRole = "landlord";
//     }

//     const attachments = await saveUploadedFiles(req);

//     if (attachments.length) {
//       repairRequest.attachments.push(...attachments);
//     }

//     await repairRequest.save();

//     if (responseText) {
//       const tenant = await User.findById(repairRequest.tenant).select(
//         "fullName email"
//       );

//       await createRepairNotification({
//         userId: repairRequest.tenant,
//         title: "Update on Your Repair Request",
//         message: responseText,
//         repairId: repairRequest._id,
//       });

//       if (tenant?.email) {
//         await sendRepairEmail({
//           email: tenant.email,
//           subject: "Repair Request Update - Ocean Trail Condominium",
//           message: `
// Hello ${tenant.fullName || "Tenant"},

// Management has provided an update on your repair request.

// Repair: ${repairRequest.title}
// Status: ${repairRequest.status}

// Response:
// ${responseText}

// Please log in to your tenant dashboard for more details.
//           `,
//         });
//       }
//     }

//     await populateRepair(repairRequest);

//     return res.status(200).json({
//       success: true,
//       message: "Repair request updated successfully.",
//       repairRequest,
//     });
//   } catch (error) {
//     console.error("Landlord update repair error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to update repair request.",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // GET ALL REPAIR REQUESTS - ADMIN
// // ======================================================

// const getAdminRepairRequests = async (req, res) => {
//   try {
//     const repairRequests = await RepairRequest.find({})
//       .populate(getRepairPopulate())
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: repairRequests.length,
//       repairRequests,
//     });
//   } catch (error) {
//     console.error("Get admin repair requests error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to retrieve repair requests.",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // UPDATE REPAIR REQUEST - ADMIN
// // ======================================================

// const adminUpdateRepairRequest = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, managementResponse } = req.body;

//     if (!isValidId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid repair request ID.",
//       });
//     }

//     const repairRequest = await RepairRequest.findById(id);

//     if (!repairRequest) {
//       return res.status(404).json({
//         success: false,
//         message: "Repair request not found.",
//       });
//     }

//     if (status && !allowedStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid repair status.",
//       });
//     }

//     if (status) {
//       repairRequest.status = status;

//       if (status === "Completed") {
//         repairRequest.completedAt = new Date();
//       } else if (repairRequest.completedAt) {
//         repairRequest.completedAt = null;
//       }
//     }

//     const responseText = getRequestMessage(managementResponse);

//     if (responseText) {
//       repairRequest.managementResponse = responseText;
//       repairRequest.respondedAt = new Date();
//       repairRequest.respondedBy = req.user._id;
//       repairRequest.respondedByRole = getUserRole(req.user);
//     }

//     const attachments = await saveUploadedFiles(req);

//     if (attachments.length) {
//       repairRequest.attachments.push(...attachments);
//     }

//     await repairRequest.save();

//     if (responseText) {
//       const tenant = await User.findById(repairRequest.tenant).select(
//         "fullName email"
//       );

//       await createRepairNotification({
//         userId: repairRequest.tenant,
//         title: "Management Responded to Your Repair Request",
//         message: responseText,
//         repairId: repairRequest._id,
//       });

//       if (tenant?.email) {
//         await sendRepairEmail({
//           email: tenant.email,
//           subject: "Repair Request Update - Ocean Trail Condominium",
//           message: `
// Hello ${tenant.fullName || "Tenant"},

// Management has responded to your repair request.

// Repair: ${repairRequest.title}
// Status: ${repairRequest.status}

// Management response:
// ${responseText}

// Please log in to your tenant dashboard to view the full conversation.
//           `,
//         });
//       }
//     }

//     await populateRepair(repairRequest);

//     return res.status(200).json({
//       success: true,
//       message: "Repair request updated successfully.",
//       repairRequest,
//     });
//   } catch (error) {
//     console.error("Admin update repair error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to update repair request.",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // ADD MESSAGE TO REPAIR CONVERSATION
// // TENANT / LANDLORD / ADMIN / PROPERTY MANAGER
// // ======================================================

// const addRepairMessage = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const messageText = getRequestMessage(req.body.message);

//     if (!isValidId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid repair request ID.",
//       });
//     }

//     const repairRequest = await RepairRequest.findById(id);

//     if (!repairRequest) {
//       return res.status(404).json({
//         success: false,
//         message: "Repair request not found.",
//       });
//     }

//     if (!canSendRepairMessage(repairRequest, req.user)) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorised to access this repair conversation.",
//       });
//     }

//     const attachments = await saveUploadedFiles(req);

//     if (!messageText && attachments.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Enter a message or attach a file before sending.",
//       });
//     }

//     const senderRole = getUserRole(req.user);

//     repairRequest.messages.push({
//       sender: req.user._id,
//       senderRole,
//       message: messageText,
//       attachments,
//       createdAt: new Date(),
//     });

//     // Keep the existing management response fields updated
//     // for compatibility with older frontend components.
//     if (MANAGEMENT_ROLES.includes(senderRole) || senderRole === "landlord") {
//       if (messageText) {
//         repairRequest.managementResponse = messageText;
//       }

//       repairRequest.respondedAt = new Date();
//       repairRequest.respondedBy = req.user._id;
//       repairRequest.respondedByRole = senderRole;
//     }

//     await repairRequest.save();

//     const sender = await User.findById(req.user._id).select(
//       "fullName email role"
//     );

//     const senderName = sender?.fullName || "A user";

//     // Notify the tenant when management or landlord replies.
//     if (
//       senderRole !== "tenant" &&
//       repairRequest.tenant
//     ) {
//       const notificationMessage =
//         messageText ||
//         `${senderName} sent an attachment regarding your repair request.`;

//       await createRepairNotification({
//         userId: repairRequest.tenant,
//         title: "New Repair Conversation Message",
//         message: notificationMessage,
//         repairId: repairRequest._id,
//       });

//       const tenant = await User.findById(repairRequest.tenant).select(
//         "fullName email"
//       );

//       if (tenant?.email) {
//         await sendRepairEmail({
//           email: tenant.email,
//           subject: "New Repair Request Message - Ocean Trail Condominium",
//           message: `
// Hello ${tenant.fullName || "Tenant"},

// ${senderName} has sent a new message regarding your repair request.

// Repair: ${repairRequest.title}

// Message:
// ${messageText || "An attachment was sent."}

// Please log in to your tenant dashboard to view the conversation and attachments.
//           `,
//         });
//       }
//     }

//     // Notify management when the tenant sends a follow-up.
//     if (senderRole === "tenant") {
//       await sendRepairEmail({
//         email: ADMIN_EMAIL,
//         subject: "New Tenant Repair Conversation Message",
//         message: `
// A tenant has sent a new message regarding a repair request.

// Tenant: ${senderName}
// Repair: ${repairRequest.title}

// Message:
// ${messageText || "The tenant sent an attachment."}

// Please log in to the management dashboard to view the conversation.
//         `,
//       });
//     }

//     await populateRepair(repairRequest);

//     return res.status(201).json({
//       success: true,
//       message: "Message sent successfully.",
//       repairRequest,
//       messages: repairRequest.messages,
//     });
//   } catch (error) {
//     console.error("Add repair message error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to send repair conversation message.",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // EXPORT CONTROLLERS
// // ======================================================

// module.exports = {
//   createRepairRequest,
//   getTenantRepairRequests,
//   getTenantRepairRequest,
//   getLandlordRepairRequests,
//   updateRepairRequest,
//   getAdminRepairRequests,
//   adminUpdateRepairRequest,
//   addRepairMessage,
// };






const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const RepairRequest = require("../models/RepairRequest");
const Apartment = require("../models/Apartment");
const Property = require("../models/Property");
const User = require("../models/User");
const TenantNotification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");

// ======================================================
// CONFIGURATION
// ======================================================

const ADMIN_EMAIL =
  process.env.COMPANY_EMAIL || "oceantrailcondoslekki@gmail.com";

const allowedStatuses = [
  "Pending",
  "Assigned",
  "In Progress",
  "Completed",
  "Cancelled",
];

const MANAGEMENT_ROLES = [
  "admin",
  "super_admin",
  "property_manager",
];

const REPAIR_UPLOAD_DIRECTORY = path.join(
  process.cwd(),
  "uploads",
  "repairs"
);

if (!fs.existsSync(REPAIR_UPLOAD_DIRECTORY)) {
  fs.mkdirSync(REPAIR_UPLOAD_DIRECTORY, { recursive: true });
}

// ======================================================
// GENERAL HELPERS
// ======================================================

const getUserRole = (user) => {
  return String(user?.role || "").toLowerCase();
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getPublicFileUrl = (req, filename) => {
  const baseUrl =
    process.env.BACKEND_URL ||
    `${req.protocol}://${req.get("host")}`;

  return `${baseUrl.replace(/\/$/, "")}/uploads/repairs/${filename}`;
};

const getFileResourceType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";

  if (
    mimeType === "application/pdf" ||
    mimeType.includes("word") ||
    mimeType.includes("document")
  ) {
    return "document";
  }

  return "raw";
};

const sanitizeFilename = (filename = "attachment") => {
  return path
    .basename(filename)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-150);
};

/**
 * Supports:
 * - Multer memoryStorage
 * - Multer diskStorage
 * - upload.single()
 * - upload.array()
 * - upload.fields()
 */
const saveUploadedFiles = async (req) => {
  let files = [];

  if (req.file) {
    files.push(req.file);
  }

  if (Array.isArray(req.files)) {
    files = files.concat(req.files);
  } else if (req.files && typeof req.files === "object") {
    Object.values(req.files).forEach((fileGroup) => {
      if (Array.isArray(fileGroup)) {
        files = files.concat(fileGroup);
      }
    });
  }

  const attachments = [];

  for (const file of files) {
    if (!file) continue;

    let filename = file.filename;

    if (file.buffer) {
      const safeOriginalName = sanitizeFilename(
        file.originalname || file.originalName || "attachment"
      );

      const extension = path.extname(safeOriginalName);

      filename = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}${extension}`;

      const destination = path.join(
        REPAIR_UPLOAD_DIRECTORY,
        filename
      );

      await fs.promises.writeFile(destination, file.buffer);
    }

    if (!filename && file.path) {
      filename = path.basename(file.path);
    }

    if (!filename) continue;

    const originalName =
      file.originalname ||
      file.originalName ||
      filename;

    attachments.push({
      originalName,
      url: getPublicFileUrl(req, filename),
      mimeType: file.mimetype || "application/octet-stream",
      resourceType: getFileResourceType(file.mimetype),
      size: file.size || 0,
    });
  }

  return attachments;
};

const getRepairPopulate = () => [
  {
    path: "tenant",
    select: "fullName email phone role block floor apartment",
  },
  {
    path: "landlord",
    select: "fullName email phone role",
  },
  {
    path: "property",
    select: "name address city state",
  },
  {
    path: "apartment",
    select: "apartmentNumber block floor",
  },
  {
    path: "respondedBy",
    select: "fullName email role",
  },
  {
    path: "messages.sender",
    select: "fullName email role",
  },
];

const populateRepair = async (repair) => {
  if (!repair) return null;

  await repair.populate(getRepairPopulate());

  return repair;
};

const getRequestMessage = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 2000);
};

// ======================================================
// EMAIL HELPER
// ======================================================

const sendRepairEmail = async ({ email, subject, message }) => {
  if (!email) return;

  try {
    await sendEmail({
      to: email,
      subject,
      text: message,
    });
  } catch (error) {
    console.error(
      "Repair email notification failed:",
      error.message
    );
  }
};

// ======================================================
// NOTIFICATION HELPER
// ======================================================

const createRepairNotification = async ({
  userId,
  title,
  message,
  repairId,
}) => {
  if (!userId) return;

  try {
    await TenantNotification.create({
      user: userId,
      title,
      message,
      type: "repair",
      relatedId: repairId,
    });
  } catch (error) {
    console.error(
      "Repair database notification failed:",
      error.message
    );
  }
};

// ======================================================
// LANDLORD PROPERTY OWNERSHIP HELPERS
// ======================================================

/**
 * Retrieves all property and apartment IDs belonging
 * to the authenticated landlord.
 *
 * This also supports older repair records where the
 * landlord field was not saved directly.
 */
const getLandlordOwnership = async (landlordId) => {
  const properties = await Property.find({
    landlord: landlordId,
  }).select("_id");

  const propertyIds = properties.map(
    (property) => property._id
  );

  const apartments = await Apartment.find({
    property: { $in: propertyIds },
  }).select("_id");

  const apartmentIds = apartments.map(
    (apartment) => apartment._id
  );

  return {
    propertyIds,
    apartmentIds,
  };
};

/**
 * Creates a secure query for repair requests belonging
 * to the authenticated landlord.
 */
const getLandlordRepairFilter = async (landlordId) => {
  const { propertyIds, apartmentIds } =
    await getLandlordOwnership(landlordId);

  return {
    $or: [
      { landlord: landlordId },
      ...(propertyIds.length
        ? [{ property: { $in: propertyIds } }]
        : []),
      ...(apartmentIds.length
        ? [{ apartment: { $in: apartmentIds } }]
        : []),
    ],
  };
};

// ======================================================
// ACCESS CONTROL FOR REPAIR CONVERSATIONS
// ======================================================

const canAccessRepair = (repair, user) => {
  if (!repair || !user) return false;

  const role = getUserRole(user);
  const userId = String(user._id);

  if (MANAGEMENT_ROLES.includes(role)) {
    return true;
  }

  if (role === "tenant") {
    return String(repair.tenant?._id || repair.tenant) === userId;
  }

  if (role === "landlord") {
    return (
      String(repair.landlord?._id || repair.landlord) === userId
    );
  }

  return false;
};

/**
 * Additional asynchronous ownership check for landlords.
 * Used when legacy repair records have no landlord field.
 */
const canLandlordAccessRepair = async (repair, landlordId) => {
  if (!repair || !landlordId) return false;

  if (
    repair.landlord &&
    String(repair.landlord) === String(landlordId)
  ) {
    return true;
  }

  const { propertyIds, apartmentIds } =
    await getLandlordOwnership(landlordId);

  if (
    repair.property &&
    propertyIds.some(
      (id) => String(id) === String(repair.property)
    )
  ) {
    return true;
  }

  if (
    repair.apartment &&
    apartmentIds.some(
      (id) => String(id) === String(repair.apartment)
    )
  ) {
    return true;
  }

  return false;
};

const canSendRepairMessage = async (repair, user) => {
  if (!repair || !user) return false;

  const role = getUserRole(user);

  if (role === "landlord") {
    return canLandlordAccessRepair(repair, user._id);
  }

  return canAccessRepair(repair, user);
};

// ======================================================
// CREATE REPAIR REQUEST - TENANT
// ======================================================

const createRepairRequest = async (req, res) => {
  try {
    const { title, category, description, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Repair title and description are required.",
      });
    }

    const tenant = await User.findById(req.user._id).select(
      "fullName email phone role block floor apartment"
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant account not found.",
      });
    }

    let apartmentRecord = null;

    try {
      apartmentRecord = await Apartment.findOne({
        tenant: req.user._id,
      }).populate("property", "name address city state landlord");
    } catch (error) {
      console.error("Apartment lookup failed:", error.message);
    }

    const attachments = await saveUploadedFiles(req);

    const repairData = {
      tenant: req.user._id,
      title: title.trim(),
      category: category || "Other",
      description: description.trim(),
      priority: priority || "Medium",
      status: "Pending",
      attachments,
      messages: [],
    };

    if (apartmentRecord) {
      repairData.apartment = apartmentRecord._id;

      if (apartmentRecord.property) {
        repairData.property = apartmentRecord.property._id;

        if (apartmentRecord.property.landlord) {
          repairData.landlord =
            apartmentRecord.property.landlord;
        }
      }
    }

    const repairRequest = await RepairRequest.create(repairData);

    await populateRepair(repairRequest);

    await sendRepairEmail({
      email: ADMIN_EMAIL,
      subject: "New Repair Request - Ocean Trail Condominium",
      message: `
A new repair request has been submitted.

Tenant: ${tenant.fullName || "N/A"}
Email: ${tenant.email || "N/A"}
Phone: ${tenant.phone || "N/A"}

Title: ${title}
Category: ${category || "Other"}
Priority: ${priority || "Medium"}

Description:
${description}

Please log in to the Ocean Trail management dashboard to review this request.
      `,
    });

    return res.status(201).json({
      success: true,
      message: "Repair request submitted successfully.",
      repairRequest,
    });
  } catch (error) {
    console.error("Create repair request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit repair request.",
      error: error.message,
    });
  }
};

// ======================================================
// GET TENANT REPAIR REQUESTS
// ======================================================

const getTenantRepairRequests = async (req, res) => {
  try {
    const repairRequests = await RepairRequest.find({
      tenant: req.user._id,
    })
      .populate(getRepairPopulate())
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: repairRequests.length,
      repairRequests,
    });
  } catch (error) {
    console.error("Get tenant repair requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve repair requests.",
      error: error.message,
    });
  }
};

// ======================================================
// GET SINGLE TENANT REPAIR REQUEST
// ======================================================

const getTenantRepairRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repair request ID.",
      });
    }

    const repairRequest = await RepairRequest.findOne({
      _id: id,
      tenant: req.user._id,
    }).populate(getRepairPopulate());

    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: "Repair request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      repairRequest,
    });
  } catch (error) {
    console.error("Get single tenant repair error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve repair request.",
      error: error.message,
    });
  }
};

// ======================================================
// GET LANDLORD REPAIR REQUESTS
// ======================================================

const getLandlordRepairRequests = async (req, res) => {
  try {
    const landlordFilter = await getLandlordRepairFilter(
      req.user._id
    );

    const repairRequests = await RepairRequest.find(
      landlordFilter
    )
      .populate(getRepairPopulate())
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: repairRequests.length,
      repairRequests,
    });
  } catch (error) {
    console.error("Get landlord repair requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve landlord repair requests.",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE REPAIR REQUEST - LANDLORD
// ======================================================

const updateRepairRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managementResponse } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repair request ID.",
      });
    }

    const landlordFilter = await getLandlordRepairFilter(
      req.user._id
    );

    const repairRequest = await RepairRequest.findOne({
      _id: id,
      ...landlordFilter,
    });

    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: "Repair request not found.",
      });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repair status.",
      });
    }

    if (status) {
      repairRequest.status = status;

      if (status === "Completed") {
        repairRequest.completedAt = new Date();
      } else if (repairRequest.completedAt) {
        repairRequest.completedAt = null;
      }
    }

    // Ensure future queries can find this repair directly.
    if (!repairRequest.landlord) {
      repairRequest.landlord = req.user._id;
    }

    const responseText = getRequestMessage(managementResponse);

    if (responseText) {
      repairRequest.managementResponse = responseText;
      repairRequest.respondedAt = new Date();
      repairRequest.respondedBy = req.user._id;
      repairRequest.respondedByRole = "landlord";
    }

    const attachments = await saveUploadedFiles(req);

    if (attachments.length) {
      repairRequest.attachments.push(...attachments);
    }

    await repairRequest.save();

    if (responseText) {
      const tenant = await User.findById(repairRequest.tenant).select(
        "fullName email"
      );

      await createRepairNotification({
        userId: repairRequest.tenant,
        title: "Update on Your Repair Request",
        message: responseText,
        repairId: repairRequest._id,
      });

      if (tenant?.email) {
        await sendRepairEmail({
          email: tenant.email,
          subject: "Repair Request Update - Ocean Trail Condominium",
          message: `
Hello ${tenant.fullName || "Tenant"},

Management has provided an update on your repair request.

Repair: ${repairRequest.title}
Status: ${repairRequest.status}

Response:
${responseText}

Please log in to your tenant dashboard for more details.
          `,
        });
      }
    }

    await populateRepair(repairRequest);

    return res.status(200).json({
      success: true,
      message: "Repair request updated successfully.",
      repairRequest,
    });
  } catch (error) {
    console.error("Landlord update repair error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update repair request.",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL REPAIR REQUESTS - ADMIN
// ======================================================

const getAdminRepairRequests = async (req, res) => {
  try {
    const repairRequests = await RepairRequest.find({})
      .populate(getRepairPopulate())
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: repairRequests.length,
      repairRequests,
    });
  } catch (error) {
    console.error("Get admin repair requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve repair requests.",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE REPAIR REQUEST - ADMIN
// ======================================================

const adminUpdateRepairRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managementResponse } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repair request ID.",
      });
    }

    const repairRequest = await RepairRequest.findById(id);

    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: "Repair request not found.",
      });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repair status.",
      });
    }

    if (status) {
      repairRequest.status = status;

      if (status === "Completed") {
        repairRequest.completedAt = new Date();
      } else if (repairRequest.completedAt) {
        repairRequest.completedAt = null;
      }
    }

    const responseText = getRequestMessage(managementResponse);

    if (responseText) {
      repairRequest.managementResponse = responseText;
      repairRequest.respondedAt = new Date();
      repairRequest.respondedBy = req.user._id;
      repairRequest.respondedByRole = getUserRole(req.user);
    }

    const attachments = await saveUploadedFiles(req);

    if (attachments.length) {
      repairRequest.attachments.push(...attachments);
    }

    await repairRequest.save();

    if (responseText) {
      const tenant = await User.findById(repairRequest.tenant).select(
        "fullName email"
      );

      await createRepairNotification({
        userId: repairRequest.tenant,
        title: "Management Responded to Your Repair Request",
        message: responseText,
        repairId: repairRequest._id,
      });

      if (tenant?.email) {
        await sendRepairEmail({
          email: tenant.email,
          subject: "Repair Request Update - Ocean Trail Condominium",
          message: `
Hello ${tenant.fullName || "Tenant"},

Management has responded to your repair request.

Repair: ${repairRequest.title}
Status: ${repairRequest.status}

Management response:
${responseText}

Please log in to your tenant dashboard to view the full conversation.
          `,
        });
      }
    }

    await populateRepair(repairRequest);

    return res.status(200).json({
      success: true,
      message: "Repair request updated successfully.",
      repairRequest,
    });
  } catch (error) {
    console.error("Admin update repair error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update repair request.",
      error: error.message,
    });
  }
};

// ======================================================
// ADD MESSAGE TO REPAIR CONVERSATION
// TENANT / LANDLORD / ADMIN / PROPERTY MANAGER
// ======================================================

const addRepairMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const messageText = getRequestMessage(req.body.message);

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repair request ID.",
      });
    }

    const repairRequest = await RepairRequest.findById(id);

    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: "Repair request not found.",
      });
    }

    const hasAccess = await canSendRepairMessage(
      repairRequest,
      req.user
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorised to access this repair conversation.",
      });
    }

    const attachments = await saveUploadedFiles(req);

    if (!messageText && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a message or attach a file before sending.",
      });
    }

    const senderRole = getUserRole(req.user);

    repairRequest.messages.push({
      sender: req.user._id,
      senderRole,
      message: messageText,
      attachments,
      createdAt: new Date(),
    });

    if (
      MANAGEMENT_ROLES.includes(senderRole) ||
      senderRole === "landlord"
    ) {
      if (messageText) {
        repairRequest.managementResponse = messageText;
      }

      repairRequest.respondedAt = new Date();
      repairRequest.respondedBy = req.user._id;
      repairRequest.respondedByRole = senderRole;

      if (
        senderRole === "landlord" &&
        !repairRequest.landlord
      ) {
        repairRequest.landlord = req.user._id;
      }
    }

    await repairRequest.save();

    const sender = await User.findById(req.user._id).select(
      "fullName email role"
    );

    const senderName = sender?.fullName || "A user";

    // Notify the tenant when management or landlord replies.
    if (
      senderRole !== "tenant" &&
      repairRequest.tenant
    ) {
      const notificationMessage =
        messageText ||
        `${senderName} sent an attachment regarding your repair request.`;

      await createRepairNotification({
        userId: repairRequest.tenant,
        title: "New Repair Conversation Message",
        message: notificationMessage,
        repairId: repairRequest._id,
      });

      const tenant = await User.findById(repairRequest.tenant).select(
        "fullName email"
      );

      if (tenant?.email) {
        await sendRepairEmail({
          email: tenant.email,
          subject: "New Repair Request Message - Ocean Trail Condominium",
          message: `
Hello ${tenant.fullName || "Tenant"},

${senderName} has sent a new message regarding your repair request.

Repair: ${repairRequest.title}

Message:
${messageText || "An attachment was sent."}

Please log in to your tenant dashboard to view the conversation and attachments.
          `,
        });
      }
    }

    // Notify management when the tenant sends a follow-up.
    if (senderRole === "tenant") {
      await sendRepairEmail({
        email: ADMIN_EMAIL,
        subject: "New Tenant Repair Conversation Message",
        message: `
A tenant has sent a new message regarding a repair request.

Tenant: ${senderName}
Repair: ${repairRequest.title}

Message:
${messageText || "The tenant sent an attachment."}

Please log in to the management dashboard to view the conversation.
        `,
      });
    }

    await populateRepair(repairRequest);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      repairRequest,
      messages: repairRequest.messages,
    });
  } catch (error) {
    console.error("Add repair message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send repair conversation message.",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORT CONTROLLERS
// ======================================================

module.exports = {
  createRepairRequest,
  getTenantRepairRequests,
  getTenantRepairRequest,
  getLandlordRepairRequests,
  updateRepairRequest,
  getAdminRepairRequests,
  adminUpdateRepairRequest,
  addRepairMessage,
};
