// // const express = require("express");
// // const multer = require("multer");
// // const path = require("path");

// // const {
// //   createComplaint,
// //   getTenantComplaints,
// //   getTenantComplaint,
// //   getLandlordComplaints,
// //   updateComplaint,
// // } = require("../controllers/complaintController");

// // const protect = require("../middleware/authMiddleware");

// // // Configure Multer Storage for File Attachments
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, "uploads/complaints/");
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
// //     cb(null, uniqueSuffix + path.extname(file.originalname));
// //   },
// // });

// // const upload = multer({
// //   storage,
// //   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
// // });

// // const router = express.Router();

// // router.use(protect);

// // // ==========================================
// // // TENANT ROUTES
// // // ==========================================

// // // Parse multipart form payload (text fields + optional attachment)
// // router.post("/", upload.single("attachment"), createComplaint);
// // router.get("/tenant", getTenantComplaints);
// // router.get("/tenant/:id", getTenantComplaint);

// // // ==========================================
// // // LANDLORD / ADMIN ROUTES
// // // ==========================================

// // router.get("/landlord", getLandlordComplaints);
// // router.put("/:id", updateComplaint);

// // module.exports = router;


// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const {
//   createComplaint,
//   getTenantComplaints,
//   getTenantComplaint,
//   getLandlordComplaints,
//   addComplaintMessage,
//   updateComplaint,
// } = require("../controllers/complaintController");

// const { protect } = require("../middleware/authMiddleware");

// const router = express.Router();

// // ==========================================
// // ENSURE COMPLAINT UPLOAD DIRECTORY EXISTS
// // ==========================================

// const uploadDirectory = path.join(
//   __dirname,
//   "../uploads/complaints"
// );

// if (!fs.existsSync(uploadDirectory)) {
//   fs.mkdirSync(uploadDirectory, { recursive: true });
// }

// // ==========================================
// // MULTER STORAGE CONFIGURATION
// // ==========================================

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDirectory);
//   },

//   filename: (req, file, cb) => {
//     const extension = path.extname(file.originalname).toLowerCase();

//     const uniqueName = `${Date.now()}-${Math.round(
//       Math.random() * 1e9
//     )}${extension}`;

//     cb(null, uniqueName);
//   },
// });

// // ==========================================
// // ALLOWED FILE TYPES
// // ==========================================

// const allowedMimeTypes = [
//   // Images
//   "image/jpeg",
//   "image/png",
//   "image/webp",
//   "image/gif",

//   // Videos
//   "video/mp4",
//   "video/webm",
//   "video/quicktime",

//   // Documents (preserves existing upload support)
//   "application/pdf",
//   "application/msword",
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
// ];

// const fileFilter = (req, file, cb) => {
//   if (!allowedMimeTypes.includes(file.mimetype)) {
//     return cb(
//       new Error(
//         "Unsupported attachment. Upload JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, PDF or Word documents."
//       )
//     );
//   }

//   cb(null, true);
// };

// // ==========================================
// // MULTER UPLOAD CONFIGURATION
// // ==========================================

// const upload = multer({
//   storage,
//   fileFilter,

//   limits: {
//     fileSize: 50 * 1024 * 1024, // 50 MB per file
//     files: 10,
//   },
// });

// // ==========================================
// // VALIDATE UPLOAD FIELD NAMES
// // Supports old and new frontend fields:
// // attachment  = old single-file field
// // attachments = new multiple-file field
// // ==========================================

// const validateAttachmentFields = (req, res, next) => {
//   const files = Array.isArray(req.files) ? req.files : [];

//   const invalidFile = files.find(
//     (file) =>
//       !["attachment", "attachments"].includes(file.fieldname)
//   );

//   if (invalidFile) {
//     return res.status(400).json({
//       success: false,
//       message:
//         "Invalid upload field. Use attachment or attachments.",
//     });
//   }

//   next();
// };

// // ==========================================
// // AUTHENTICATION
// // All complaint routes require login.
// // ==========================================

// router.use(protect);

// // ==========================================
// // TENANT COMPLAINT ROUTES
// // ==========================================

// // Create complaint with one or multiple attachments.
// router.post(
//   "/",
//   upload.any(),
//   validateAttachmentFields,
//   createComplaint
// );

// // Get all complaints belonging to logged-in tenant.
// router.get("/tenant", getTenantComplaints);

// // Get one complaint belonging to logged-in tenant.
// router.get("/tenant/:id", getTenantComplaint);

// // ==========================================
// // MANAGEMENT COMPLAINT ROUTES
// // ==========================================

// // Get complaints for the management dashboard.
// // Controller checks management permissions.
// router.get("/landlord", getLandlordComplaints);

// // Update complaint status or send a management response.
// router.put("/:id", updateComplaint);

// // ==========================================
// // COMPLAINT CONVERSATION ROUTE
// // ==========================================

// // Tenant, assigned landlord or management can add
// // a text message and/or multiple attachments.
// router.post(
//   "/:id/messages",
//   upload.any(),
//   validateAttachmentFields,
//   addComplaintMessage
// );

// // ==========================================
// // MULTER ERROR HANDLING
// // ==========================================

// router.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     let message = err.message;

//     if (err.code === "LIMIT_FILE_SIZE") {
//       message = "Each attachment must not exceed 50 MB.";
//     }

//     if (err.code === "LIMIT_FILE_COUNT") {
//       message = "You can upload a maximum of 10 attachments.";
//     }

//     return res.status(400).json({
//       success: false,
//       message,
//     });
//   }

//   if (err) {
//     return res.status(400).json({
//       success: false,
//       message: err.message || "File upload failed.",
//     });
//   }

//   next();
// });

// module.exports = router;






const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  createComplaint,
  getTenantComplaints,
  getTenantComplaint,
  getLandlordComplaints,
  addComplaintMessage,
  updateComplaint,
} = require("../controllers/complaintController");

// IMPORTANT: authMiddleware exports protect directly.
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// ENSURE COMPLAINT UPLOAD DIRECTORY EXISTS
// ==========================================

const uploadDirectory = path.join(
  __dirname,
  "../uploads/complaints"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// ==========================================
// MULTER STORAGE CONFIGURATION
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`;

    cb(null, uniqueName);
  },
});

// ==========================================
// ALLOWED FILE TYPES
// ==========================================

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Unsupported attachment. Upload JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, PDF or Word documents."
      )
    );
  }

  cb(null, true);
};

// ==========================================
// MULTER UPLOAD CONFIGURATION
// ==========================================

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10,
  },
});

// ==========================================
// VALIDATE UPLOAD FIELD NAMES
// ==========================================

const validateAttachmentFields = (req, res, next) => {
  const files = Array.isArray(req.files) ? req.files : [];

  const invalidFile = files.find(
    (file) =>
      !["attachment", "attachments"].includes(file.fieldname)
  );

  if (invalidFile) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid upload field. Use attachment or attachments.",
    });
  }

  next();
};

// ==========================================
// AUTHENTICATION
// ==========================================

router.use(protect);

// ==========================================
// TENANT COMPLAINT ROUTES
// ==========================================

router.post(
  "/",
  upload.any(),
  validateAttachmentFields,
  createComplaint
);

router.get("/tenant", getTenantComplaints);

router.get("/tenant/:id", getTenantComplaint);

// ==========================================
// MANAGEMENT COMPLAINT ROUTES
// ==========================================

router.get("/landlord", getLandlordComplaints);

router.put("/:id", updateComplaint);

// ==========================================
// COMPLAINT CONVERSATION ROUTE
// ==========================================

router.post(
  "/:id/messages",
  upload.any(),
  validateAttachmentFields,
  addComplaintMessage
);

// ==========================================
// MULTER ERROR HANDLING
// ==========================================

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = err.message;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Each attachment must not exceed 50 MB.";
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      message = "You can upload a maximum of 10 attachments.";
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload failed.",
    });
  }

  next();
});

module.exports = router;
