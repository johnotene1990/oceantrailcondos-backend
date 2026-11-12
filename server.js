// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const cookieParser = require("cookie-parser");
// const path = require("path");
// const fs = require("fs");
// const multer = require("multer");

// const connectDB = require("./config/db");

// // ==========================================
// // LOAD ENVIRONMENT VARIABLES FIRST
// // ==========================================

// dotenv.config();

// // ==========================================
// // IMPORT EXISTING ROUTES & CONTROLLERS
// // ==========================================

// const authRoutes = require("./routes/authRoutes");
// const propertyRoutes = require("./routes/propertyRoutes");
// const apartmentRoutes = require("./routes/apartmentRoutes");
// const complaintRoutes = require("./routes/complaintRoutes");
// const repairRoutes = require("./routes/repairRoutes");
// const tenancyDocumentRoutes = require("./routes/tenancyDocumentRoutes");

// // SERVICE CHARGE ROUTES
// const serviceChargeRoutes = require("./routes/serviceChargeRoutes");

// // PAYMENT / RECEIPT ROUTES
// const receiptRoutes = require("./routes/receiptRoutes");

// // UTILITY / ELECTRICITY ROUTES
// //const utilityRoutes = require("./routes/utilityRoutes");
// const electricityRoutes = require("./routes/electricityRoutes");

// // VISITOR / NOTIFICATION / MESSAGE ROUTES
// const visitorRoutes = require("./routes/visitorRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");
// const messageRoutes = require("./routes/messageRoutes");

// // DASHBOARD
// const dashboardRoutes = require("./routes/dashboardRoutes");

// // TENANT / RENEWAL / PAYMENT HISTORY
// const tenancyRenewalRoutes = require("./routes/tenantRenewalRoutes");
// const paymentHistoryRoutes = require("./routes/paymentHistoryRoute");
// const tenantApplicationRoutes = require("./routes/tenantApplicationRoutes");

// // UTILITY / ELECTRICITY ROUTES
// const utilityRoutes = require("./routes/utilityRoutes");

// // SAFE CONTROLLER & MIDDLEWARE IMPORTS WITH FALLBACKS
// const tenancyController = require("./controllers/tenancyController");
// const messageController = require("./controllers/messageController");
// const authMiddleware = require("./middleware/authMiddleware");
// const adminMiddleware = require("./middleware/adminMiddleware");

// const contactRoutes = require("./routes/contactRoutes");

// const sendAgreementByApartment =
//   typeof tenancyController?.sendAgreementByApartment === "function"
//     ? tenancyController.sendAgreementByApartment
//     : (req, res) => res.status(501).json({ success: false, message: "Controller not implemented" });

// const replyToMessage =
//   typeof messageController?.replyToMessage === "function"
//     ? messageController.replyToMessage
//     : (req, res) => res.status(501).json({ success: false, message: "Controller not implemented" });

// const protect =
//   typeof authMiddleware === "function"
//     ? authMiddleware
//     : authMiddleware?.protect || ((req, res, next) => next());

// const adminOnly =
//   typeof adminMiddleware === "function"
//     ? adminMiddleware
//     : adminMiddleware?.adminOnly || ((req, res, next) => next());

// // ==========================================
// // CREATE EXPRESS APP
// // ==========================================

// const app = express();

// // ==========================================
// // PORT
// // ==========================================

// const PORT = process.env.PORT || 5000;

// // ==========================================
// // DATABASE CONNECTION
// // ==========================================

// connectDB();

// // ==========================================
// // CORS CONFIGURATION
// // ==========================================

// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://oceantrailcondominium.com/",
//   "https://oceantrailcondos-backend.onrender.com/",
//   "https://oceantrailcondominium.com/",
//   "https://oceantrailcondos-backend.onrender.com/",
//   process.env.CLIENT_URL,
// ].filter(Boolean);

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) {
//         return callback(null, true);
//       }

//       if (allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }

//       console.warn(
//         `CORS request from unlisted origin: ${origin}`
//       );

//       return callback(null, true);
//     },

//     credentials: true,

//     methods: [
//       "GET",
//       "POST",
//       "PUT",
//       "DELETE",
//       "PATCH",
//       "OPTIONS",
//     ],

//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "X-Requested-With",
//     ],
//   })
// );

// // ==========================================
// // JSON BODY PARSER
// // ==========================================

// app.use(
//   express.json({
//     limit: "10mb",
//   })
// );

// // ==========================================
// // URL-ENCODED BODY PARSER
// // ==========================================

// app.use(
//   express.urlencoded({
//     extended: true,
//     limit: "10mb",
//   })
// );

// // ==========================================
// // COOKIE PARSER
// // ==========================================

// app.use(cookieParser());

// // ==========================================
// // STATIC UPLOADS
// // ==========================================

// app.use(
//   "/uploads",
//   express.static(path.join(__dirname, "uploads"))
// );

// // ==========================================
// // MULTER STORAGE FOR TENANCY RENEWAL AGREEMENTS
// // ==========================================

// const tenancyAgreementStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, "uploads/tenancy-renewals");
//     fs.mkdirSync(uploadDir, { recursive: true });
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const uploadTenancyAgreement = multer({ storage: tenancyAgreementStorage });

// // ==========================================
// // AUTHENTICATION
// // ==========================================

// app.use(
//   "/api/auth",
//   authRoutes
// );

// app.use("/api/utilities", utilityRoutes);

// // ==========================================
// // PROPERTY / APARTMENT
// // ==========================================

// app.use(
//   "/api/properties",
//   propertyRoutes
// );

// app.use(
//   "/api/apartments",
//   apartmentRoutes
// );

// app.use("/api/contact", contactRoutes);
// // ==========================================
// // TENANT REQUESTS
// // ==========================================
// // Mount the route
// app.use("/api/tenant", tenantApplicationRoutes);

// app.use(
//   "/api/complaints",
//   complaintRoutes
// );

// app.use(
//   "/api/repairs",
//   repairRoutes
// );

// app.use(
//   "/api/tenancy-documents",
//   tenancyDocumentRoutes
// );

// // ==========================================
// // SERVICE CHARGES
// // ==========================================

// app.use(
//   "/api/service-charges",
//   serviceChargeRoutes
// );

// app.use(
//   "/api/service-charge-payments",
//   serviceChargeRoutes
// );

// // ==========================================
// // PAYMENTS
// // ==========================================

// app.use(
//   "/api/receipts",
//   receiptRoutes
// );

// app.use(
//   "/api/electricity",
//   electricityRoutes
// );

// // ==========================================
// // VISITORS
// // ==========================================

// app.use(
//   "/api/visitors",
//   visitorRoutes
// );

// // ==========================================
// // NOTIFICATIONS
// // ==========================================

// app.use(
//   "/api/notifications",
//   notificationRoutes
// );

// app.use(
//   "/api/tenant-notifications",
//   notificationRoutes
// );

// // ==========================================
// // MESSAGES
// // ==========================================

// app.use(
//   "/api/messages",
//   messageRoutes
// );

// app.use(
//   "/api/tenant-messages",
//   messageRoutes
// );

// // ==========================================
// // DASHBOARD
// // ==========================================

// app.use(
//   "/api/dashboard",
//   dashboardRoutes
// );

// // ==========================================
// // TENANCY RENEWALS
// // ==========================================

// app.use(
//   "/api/tenancy-renewals",
//   tenancyRenewalRoutes
// );

// // ======================================================
// // DIRECT BULLETPROOF ROUTES FOR SENDING AGREEMENT & REPLIES
// // ======================================================

// app.post(
//   "/api/tenancy-renewals/send-agreement",
//   protect,
//   uploadTenancyAgreement.single("agreement"),
//   sendAgreementByApartment
// );

// app.patch(
//   "/api/messages/:id/reply",
//   protect,
//   adminOnly,
//   replyToMessage
// );

// app.patch(
//   "/api/tenant-messages/:id/reply",
//   protect,
//   adminOnly,
//   replyToMessage
// );

// // ==========================================
// // PAYMENT HISTORY
// // ==========================================

// app.use(
//   "/api/payment-history",
//   paymentHistoryRoutes
// );

// // ==========================================
// // HOME / API TEST ROUTE
// // ==========================================

// app.get("/", (req, res) => {
//   return res.status(200).json({
//     success: true,
//     message:
//       "Ocean Trail Condominium API is running successfully.",
//   });
// });

// // ==========================================
// // API HEALTH CHECK
// // ==========================================

// app.get("/api/health", (req, res) => {
//   return res.status(200).json({
//     success: true,
//     message:
//       "Ocean Trail Condominium API is healthy.",
//     database: "Connected",
//     timestamp: new Date().toISOString(),
//   });
// });

// // ==========================================
// // 404 API ROUTE HANDLER
// // ==========================================

// app.use((req, res, next) => {
//   if (req.path.startsWith("/api/")) {
//     return res.status(404).json({
//       success: false,
//       message: `API route not found: ${req.method} ${req.originalUrl}`,
//     });
//   }

//   next();
// });

// // ==========================================
// // INVALID JSON ERROR HANDLER
// // ==========================================

// app.use(
//   (error, req, res, next) => {
//     if (
//       error instanceof SyntaxError &&
//       error.status === 400 &&
//       error.type === "entity.parse.failed"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid JSON request body. Please check that all text values are wrapped in double quotes.",
//       });
//     }

//     next(error);
//   }
// );

// // ==========================================
// // MULTER FILE UPLOAD ERROR HANDLER
// // ==========================================

// app.use(
//   (error, req, res, next) => {
//     if (error instanceof multer.MulterError) {
//       return res.status(400).json({
//         success: false,
//         message: `File upload error: ${error.message}`,
//       });
//     }

//     next(error);
//   }
// );

// // ==========================================
// // GENERAL ERROR HANDLER
// // ==========================================

// app.use(
//   (error, req, res, next) => {
//     console.error(
//       "Unhandled server error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         error.message ||
//         "An unexpected server error occurred.",
//     });
//   }
// );

// // ==========================================
// // START SERVER
// // ==========================================

// app.listen(PORT, () => {
//   console.log(
//     `Ocean Trail backend running on port ${PORT}`
//   );

//   console.log(
//     `Ocean Trail API: http://localhost:${PORT}`
//   );

//   console.log(
//     `Health check: http://localhost:${PORT}/api/health`
//   );
// });



const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const connectDB = require("./config/db");

// ==========================================
// LOAD ENVIRONMENT VARIABLES FIRST
// ==========================================

dotenv.config();

// Ensure upload directories exist on server startup
const uploadsDir = path.join(__dirname, "uploads");
const complaintsUploadDir = path.join(__dirname, "uploads/complaints");
const renewalsUploadDir = path.join(__dirname, "uploads/tenancy-renewals");

[uploadsDir, complaintsUploadDir, renewalsUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ==========================================
// IMPORT EXISTING ROUTES & CONTROLLERS
// ==========================================

const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const apartmentRoutes = require("./routes/apartmentRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const repairRoutes = require("./routes/repairRoutes");
const tenancyDocumentRoutes = require("./routes/tenancyDocumentRoutes");
const rentPaymentRoutes = require("./routes/rentPaymentRoutes");

// SERVICE CHARGE ROUTES
const serviceChargeRoutes = require("./routes/serviceChargeRoutes");

// PAYMENT / RECEIPT ROUTES
const receiptRoutes = require("./routes/receiptRoutes");

// UTILITY / ELECTRICITY ROUTES
const electricityRoutes = require("./routes/electricityRoutes");

// VISITOR / NOTIFICATION / MESSAGE ROUTES
const visitorRoutes = require("./routes/visitorRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const messageRoutes = require("./routes/messageRoutes");

// DASHBOARD
const dashboardRoutes = require("./routes/dashboardRoutes");

// TENANT / RENEWAL / PAYMENT HISTORY
const tenancyRenewalRoutes = require("./routes/tenantRenewalRoutes");
const paymentHistoryRoutes = require("./routes/paymentHistoryRoute");
const tenantApplicationRoutes = require("./routes/tenantApplicationRoutes");

// UTILITY / ELECTRICITY ROUTES
const utilityRoutes = require("./routes/utilityRoutes");

// SAFE CONTROLLER & MIDDLEWARE IMPORTS WITH FALLBACKS
const tenancyController = require("./controllers/tenancyController");
const messageController = require("./controllers/messageController");
const authMiddleware = require("./middleware/authMiddleware");
const adminMiddleware = require("./middleware/adminMiddleware");

const contactRoutes = require("./routes/contactRoutes");

const sendAgreementByApartment =
  typeof tenancyController?.sendAgreementByApartment === "function"
    ? tenancyController.sendAgreementByApartment
    : (req, res) => res.status(501).json({ success: false, message: "Controller not implemented" });

const replyToMessage =
  typeof messageController?.replyToMessage === "function"
    ? messageController.replyToMessage
    : (req, res) => res.status(501).json({ success: false, message: "Controller not implemented" });

const protect =
  typeof authMiddleware === "function"
    ? authMiddleware
    : authMiddleware?.protect || ((req, res, next) => next());

const adminOnly =
  typeof adminMiddleware === "function"
    ? adminMiddleware
    : adminMiddleware?.adminOnly || ((req, res, next) => next());

// ==========================================
// CREATE EXPRESS APP
// ==========================================

const app = express();

// ==========================================
// PORT
// ==========================================

const PORT = process.env.PORT || 5000;

// ==========================================
// DATABASE CONNECTION
// ==========================================

connectDB();

// ==========================================
// CORS CONFIGURATION
// ==========================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://oceantrailcondominium.com",
  "https://oceantrailcondos-backend.onrender.com",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, true);
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
  })
);

// ==========================================
// JSON BODY PARSER
// ==========================================

app.use(
  express.json({
    limit: "10mb",
  })
);

// ==========================================
// URL-ENCODED BODY PARSER
// ==========================================

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ==========================================
// COOKIE PARSER
// ==========================================

app.use(cookieParser());

// ==========================================
// STATIC UPLOADS
// ==========================================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ==========================================
// MULTER STORAGE FOR TENANCY RENEWAL AGREEMENTS
// ==========================================

const tenancyAgreementStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads/tenancy-renewals");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadTenancyAgreement = multer({ storage: tenancyAgreementStorage });

// ==========================================
// AUTHENTICATION
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);

app.use("/api/utilities", utilityRoutes);

// ==========================================
// PROPERTY / APARTMENT
// ==========================================

app.use(
  "/api/properties",
  propertyRoutes
);

app.use(
  "/api/apartments",
  apartmentRoutes
);

app.use("/api/contact", contactRoutes);
app.use("/api/rent-payments", rentPaymentRoutes);

// ==========================================
// TENANT REQUESTS
// ==========================================

app.use("/api/tenant", tenantApplicationRoutes);

app.use(
  "/api/complaints",
  complaintRoutes
);

app.use(
  "/api/repairs",
  repairRoutes
);

app.use(
  "/api/tenancy-documents",
  tenancyDocumentRoutes
);

// ==========================================
// SERVICE CHARGES
// ==========================================

app.use(
  "/api/service-charges",
  serviceChargeRoutes
);

app.use(
  "/api/service-charge-payments",
  serviceChargeRoutes
);

// ==========================================
// PAYMENTS
// ==========================================

app.use(
  "/api/receipts",
  receiptRoutes
);

app.use(
  "/api/electricity",
  electricityRoutes
);

// ==========================================
// VISITORS
// ==========================================

app.use(
  "/api/visitors",
  visitorRoutes
);

// ==========================================
// NOTIFICATIONS
// ==========================================

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/tenant-notifications",
  notificationRoutes
);

// ==========================================
// MESSAGES
// ==========================================

app.use(
  "/api/messages",
  messageRoutes
);

app.use(
  "/api/tenant-messages",
  messageRoutes
);

// ==========================================
// DASHBOARD
// ==========================================

app.use(
  "/api/dashboard",
  dashboardRoutes
);

// ==========================================
// TENANCY RENEWALS
// ==========================================

app.use(
  "/api/tenancy-renewals",
  tenancyRenewalRoutes
);

// ======================================================
// DIRECT BULLETPROOF ROUTES FOR SENDING AGREEMENT & REPLIES
// ======================================================

app.post(
  "/api/tenancy-renewals/send-agreement",
  protect,
  uploadTenancyAgreement.single("agreement"),
  sendAgreementByApartment
);

app.patch(
  "/api/messages/:id/reply",
  protect,
  adminOnly,
  replyToMessage
);

app.patch(
  "/api/tenant-messages/:id/reply",
  protect,
  adminOnly,
  replyToMessage
);

// ==========================================
// PAYMENT HISTORY
// ==========================================

app.use(
  "/api/payment-history",
  paymentHistoryRoutes
);

// ==========================================
// HOME / API TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "Ocean Trail Condominium API is running successfully.",
  });
});

// ==========================================
// API HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "Ocean Trail Condominium API is healthy.",
    database: "Connected",
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 404 API ROUTE HANDLER
// ==========================================

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  }

  next();
});

// ==========================================
// INVALID JSON ERROR HANDLER
// ==========================================

app.use(
  (error, req, res, next) => {
    if (
      error instanceof SyntaxError &&
      error.status === 400 &&
      error.type === "entity.parse.failed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid JSON request body. Please check that all text values are wrapped in double quotes.",
      });
    }

    next(error);
  }
);

// ==========================================
// MULTER FILE UPLOAD ERROR HANDLER
// ==========================================

app.use(
  (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `File upload error: ${error.message}`,
      });
    }

    next(error);
  }
);

// ==========================================
// GENERAL ERROR HANDLER
// ==========================================

app.use(
  (error, req, res, next) => {
    console.error(
      "Unhandled server error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "An unexpected server error occurred.",
    });
  }
);

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `Ocean Trail backend running on port ${PORT}`
  );

  console.log(
    `Ocean Trail API: http://localhost:${PORT}`
  );

  console.log(
    `Health check: http://localhost:${PORT}/api/health`
  );
});