const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  getEligibility,
  createRenewalRequest,
  getTenantRenewals,
  uploadLandlordAgreement,
  signAgreement,
  getAgreementFile,
  getAdminRenewals,
  updateRenewalStatus,
} = require("../controllers/tenancyController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Upload directories
|--------------------------------------------------------------------------
*/

const uploadDirectory = path.join(
  __dirname,
  "../uploads/tenancy-renewals"
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

/*
|--------------------------------------------------------------------------
| Multer storage
|--------------------------------------------------------------------------
*/

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

    const safeExtension =
      extension.toLowerCase();

    cb(
      null,
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${safeExtension}`
    );
  },
});

/*
|--------------------------------------------------------------------------
| Landlord/management agreement upload
|--------------------------------------------------------------------------
|
| Only PDF files are accepted here.
|
*/

const agreementUpload = multer({
  storage,

  limits: {
    fileSize:
      10 * 1024 * 1024,
  },

  fileFilter: (
    req,
    file,
    cb
  ) => {
    if (
      file.mimetype ===
      "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF tenancy agreement files are allowed."
        )
      );
    }
  },
});

/*
|--------------------------------------------------------------------------
| Tenant signature upload
|--------------------------------------------------------------------------
|
| The tenancy controller embeds the signature with
| pdf-lib's embedPng(), so the signature must be PNG.
|
*/

const signatureUpload =
  multer({
    storage,

    limits: {
      fileSize:
        5 * 1024 * 1024,
    },

    fileFilter: (
      req,
      file,
      cb
    ) => {
      if (
        file.mimetype ===
        "image/png"
      ) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Only PNG signature images are allowed."
          )
        );
      }
    },
  });

/*
|--------------------------------------------------------------------------
| All routes require authentication
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| Tenant routes
|--------------------------------------------------------------------------
*/

/*
 * Check tenancy renewal eligibility
 *
 * GET /api/tenancy-renewals/eligibility
 */
router.get(
  "/eligibility",
  getEligibility
);

/*
 * Submit renewal request
 *
 * POST /api/tenancy-renewals
 */
router.post(
  "/",
  createRenewalRequest
);

/*
 * Get tenant renewal history
 *
 * GET /api/tenancy-renewals/tenant
 */
router.get(
  "/tenant",
  getTenantRenewals
);

/*
 * Upload agreement supplied by management
 *
 * POST /api/tenancy-renewals/:id/agreement
 */
router.post(
  "/:id/agreement",
  agreementUpload.single(
    "agreement"
  ),
  uploadLandlordAgreement
);

/*
 * Electronically sign agreement
 *
 * POST /api/tenancy-renewals/:id/sign
 *
 * Frontend field name:
 * signature
 */
router.post(
  "/:id/sign",
  signatureUpload.single(
    "signature"
  ),
  signAgreement
);

/*
 * Open agreement PDF
 *
 * GET /api/tenancy-renewals/:id/agreement?type=draft
 *
 * OR
 *
 * GET /api/tenancy-renewals/:id/agreement?type=signed
 */
router.get(
  "/:id/agreement",
  getAgreementFile
);

/*
|--------------------------------------------------------------------------
| Admin routes
|--------------------------------------------------------------------------
*/

/*
 * Admin gets all renewal requests
 *
 * GET /api/tenancy-renewals/admin
 */
router.get(
  "/admin",
  adminOnly,
  getAdminRenewals
);

/*
 * Admin changes renewal status
 *
 * PATCH /api/tenancy-renewals/:id/status
 *
 * Body example:
 * {
 *   "status": "approved"
 * }
 */
router.patch(
  "/:id/status",
  adminOnly,
  updateRenewalStatus
);

/*
|--------------------------------------------------------------------------
| Multer error handler
|--------------------------------------------------------------------------
|
| This converts upload-related errors into JSON
| instead of allowing Express to return an HTML page.
|--------------------------------------------------------------------------
*/

router.use(
  (error, req, res, next) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      return res.status(400).json({
        success: false,
        message:
          `File upload error: ${error.message}`,
      });
    }

    if (
      error &&
      error.message
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    next(error);
  }
);

module.exports = router;