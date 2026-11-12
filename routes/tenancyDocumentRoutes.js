// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const crypto = require("crypto");

// const {
//   uploadTenancyDocument,
//   getLandlordDocuments,
//   getTenantDocuments,
//   viewDocumentFile,
//   signDocument,
// } = require("../controllers/tenancyDocumentController");

// const protect =
//   require("../middleware/authMiddleware");

// const router = express.Router();

// // ==========================================
// // MULTER STORAGE
// // ==========================================

// const storage =
//   multer.diskStorage({
//     destination: (
//       req,
//       file,
//       cb
//     ) => {
//       cb(
//         null,
//         path.join(
//           __dirname,
//           "..",
//           "uploads",
//           "tenancy"
//         )
//       );
//     },

//     filename: (
//       req,
//       file,
//       cb
//     ) => {
//       const extension =
//         path.extname(
//           file.originalname
//         );

//       const randomName =
//         crypto
//           .randomBytes(16)
//           .toString("hex");

//       cb(
//         null,
//         `${Date.now()}-${randomName}${extension}`
//       );
//     },
//   });

// // ==========================================
// // PDF ONLY
// // ==========================================

// const upload =
//   multer({
//     storage,

//     limits: {
//       fileSize:
//         10 * 1024 * 1024,
//     },

//     fileFilter: (
//       req,
//       file,
//       cb
//     ) => {
//       const extension =
//         path.extname(
//           file.originalname
//         ).toLowerCase();

//       const isPdf =
//         extension === ".pdf" &&
//         file.mimetype ===
//           "application/pdf";

//       if (!isPdf) {
//         return cb(
//           new Error(
//             "Only PDF tenancy documents are allowed."
//           )
//         );
//       }

//       cb(null, true);
//     },
//   });

// // ==========================================
// // LANDLORD UPLOAD
// // ==========================================

// router.post(
//   "/",
//   protect,
//   upload.single("document"),
//   uploadTenancyDocument
// );

// // ==========================================
// // LANDLORD DOCUMENTS
// // ==========================================

// router.get(
//   "/landlord",
//   protect,
//   getLandlordDocuments
// );

// // ==========================================
// // TENANT DOCUMENTS
// // ==========================================

// router.get(
//   "/tenant",
//   protect,
//   getTenantDocuments
// );

// // ==========================================
// // VIEW PDF
// // ==========================================

// router.get(
//   "/:id/file",
//   protect,
//   viewDocumentFile
// );

// // ==========================================
// // TENANT ELECTRONIC SIGNATURE
// // ==========================================

// router.post(
//   "/:id/sign",
//   protect,
//   signDocument
// );

// // ==========================================
// // MULTER ERRORS
// // ==========================================

// router.use(
//   (
//     error,
//     req,
//     res,
//     next
//   ) => {
//     if (
//       error instanceof
//       multer.MulterError
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           error.message,
//       });
//     }

//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message:
//           error.message ||
//           "Document upload failed.",
//       });
//     }

//     next();
//   }
// );

// module.exports = router;





const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const {
  uploadTenancyDocument,
  getLandlordDocuments,
  getTenantDocuments,
  viewDocumentFile,
  signDocument,
  countersignDocument,
} = require("../controllers/tenancyDocumentController");

const protect =
  require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// MULTER STORAGE
// ==========================================

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "tenancy"
);

// Ensure upload directory exists.
const fs = require("fs");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (
    req,
    file,
    cb
  ) => {
    cb(null, uploadDirectory);
  },

  filename: (
    req,
    file,
    cb
  ) => {
    const extension = path.extname(
      file.originalname
    );

    const randomName = crypto
      .randomBytes(16)
      .toString("hex");

    cb(
      null,
      `${Date.now()}-${randomName}${extension}`
    );
  },
});

// ==========================================
// PDF ONLY
// ==========================================

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (
    req,
    file,
    cb
  ) => {
    const extension = path.extname(
      file.originalname
    ).toLowerCase();

    const isPdf =
      extension === ".pdf" &&
      file.mimetype === "application/pdf";

    if (!isPdf) {
      return cb(
        new Error(
          "Only PDF tenancy documents are allowed."
        )
      );
    }

    cb(null, true);
  },
});

// ==========================================
// LANDLORD UPLOAD
// ==========================================

router.post(
  "/",
  protect,
  upload.single("document"),
  uploadTenancyDocument
);

// ==========================================
// LANDLORD DOCUMENTS
// ==========================================

router.get(
  "/landlord",
  protect,
  getLandlordDocuments
);

// ==========================================
// TENANT DOCUMENTS
// ==========================================

router.get(
  "/tenant",
  protect,
  getTenantDocuments
);

// ==========================================
// VIEW PDF
// ==========================================

router.get(
  "/:id/file",
  protect,
  viewDocumentFile
);

// ==========================================
// TENANT ELECTRONIC SIGNATURE
// ==========================================

router.post(
  "/:id/sign",
  protect,
  signDocument
);

// ==========================================
// LANDLORD COUNTERSIGN / APPROVE
// ==========================================

router.post(
  "/:id/countersign",
  protect,
  countersignDocument
);

// ==========================================
// MULTER ERRORS
// ==========================================

router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof multer.MulterError
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Document upload failed.",
      });
    }

    next();
  }
);

module.exports = router;
