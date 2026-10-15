const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const {
  PDFDocument,
  StandardFonts,
  rgb,
} = require("pdf-lib");

const TenancyDocument = require(
  "../models/TenancyDocument"
);

const Property = require(
  "../models/Property"
);

const Apartment = require(
  "../models/Apartment"
);

const User = require(
  "../models/User"
);

// ==========================================
// DIRECTORIES
// ==========================================

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "tenancy"
);

const signedDirectory = path.join(
  uploadDirectory,
  "signed"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

if (!fs.existsSync(signedDirectory)) {
  fs.mkdirSync(signedDirectory, {
    recursive: true,
  });
}

// ==========================================
// LANDLORD AUTHORIZATION
// ==========================================

const ensureLandlord = (req, res) => {
  if (
    !req.user ||
    !["landlord", "admin", "super_admin"].includes(
      req.user.role
    )
  ) {
    res.status(403).json({
      success: false,
      message:
        "Landlord access required.",
    });

    return false;
  }

  return true;
};

// ==========================================
// LANDLORD: UPLOAD AGREEMENT / RENEWAL
// ==========================================

const uploadTenancyDocument = async (
  req,
  res
) => {
  try {
    if (!ensureLandlord(req, res)) {
      return;
    }

    const {
      tenantId,
      propertyId,
      apartmentId,
      documentType,
      title,
      description,
    } = req.body;

    // ======================================
    // VALIDATION
    // ======================================

    if (
      !tenantId ||
      !propertyId ||
      !apartmentId ||
      !documentType ||
      !title
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Tenant, property, apartment, document type and title are required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload a PDF tenancy document.",
      });
    }

    if (
      !["agreement", "renewal"].includes(
        documentType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid document type.",
      });
    }

    // ======================================
    // VERIFY PROPERTY
    // ======================================

    const property =
      await Property.findOne({
        _id: propertyId,
        landlord: req.user._id,
      });

    if (!property) {
      fs.unlinkSync(req.file.path);

      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this property.",
      });
    }

    // ======================================
    // VERIFY APARTMENT
    // ======================================

    const apartment =
      await Apartment.findOne({
        _id: apartmentId,
        property: propertyId,
      }).populate(
        "tenant",
        "fullName email phone"
      );

    if (!apartment) {
      fs.unlinkSync(req.file.path);

      return res.status(404).json({
        success: false,
        message:
          "Apartment not found in this property.",
      });
    }

    // ======================================
    // VERIFY TENANT
    // ======================================

    const tenant =
      await User.findOne({
        _id: tenantId,
        role: "tenant",
        isActive: true,
      });

    if (!tenant) {
      fs.unlinkSync(req.file.path);

      return res.status(404).json({
        success: false,
        message:
          "Tenant not found.",
      });
    }

    // ======================================
    // TENANT MUST BELONG TO APARTMENT
    // ======================================

    if (
      !apartment.tenant ||
      apartment.tenant._id.toString() !==
        tenant._id.toString()
    ) {
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        success: false,
        message:
          "The selected tenant is not assigned to this apartment.",
      });
    }

    // ======================================
    // CREATE DOCUMENT
    // ======================================

    const document =
      await TenancyDocument.create({
        landlord: req.user._id,
        tenant: tenant._id,
        property: property._id,
        apartment: apartment._id,
        documentType,
        title: title.trim(),
        description:
          description?.trim() || "",
        originalFileName:
          req.file.originalname,
        originalFilePath:
          req.file.path,
      });

    const populated =
      await TenancyDocument.findById(
        document._id
      )
        .populate(
          "landlord",
          "fullName email phone"
        )
        .populate(
          "tenant",
          "fullName email phone"
        )
        .populate(
          "property",
          "name address city state"
        )
        .populate(
          "apartment",
          "apartmentNumber block floor apartmentType"
        );

    return res.status(201).json({
      success: true,
      message:
        `${
          documentType === "renewal"
            ? "Renewal"
            : "Tenancy agreement"
        } uploaded successfully.`,
      document: populated,
    });
  } catch (error) {
    console.error(
      "Upload tenancy document error:",
      error
    );

    if (
      req.file &&
      req.file.path &&
      fs.existsSync(req.file.path)
    ) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to upload tenancy document.",
    });
  }
};

// ==========================================
// LANDLORD: GET DOCUMENTS
// ==========================================

const getLandlordDocuments =
  async (req, res) => {
    try {
      if (!ensureLandlord(req, res)) {
        return;
      }

      const documents =
        await TenancyDocument.find({
          landlord: req.user._id,
        })
          .populate(
            "tenant",
            "fullName email phone"
          )
          .populate(
            "property",
            "name address"
          )
          .populate(
            "apartment",
            "apartmentNumber block floor"
          )
          .populate(
            "signedBy",
            "fullName email"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        documents,
      });
    } catch (error) {
      console.error(
        "Get landlord tenancy documents error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load tenancy documents.",
      });
    }
  };

// ==========================================
// TENANT: GET DOCUMENTS
// ==========================================

const getTenantDocuments =
  async (req, res) => {
    try {
      const documents =
        await TenancyDocument.find({
          tenant: req.user._id,
        })
          .populate(
            "landlord",
            "fullName email phone"
          )
          .populate(
            "property",
            "name address city state"
          )
          .populate(
            "apartment",
            "apartmentNumber block floor apartmentType"
          )
          .populate(
            "signedBy",
            "fullName email"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        documents,
      });
    } catch (error) {
      console.error(
        "Get tenant tenancy documents error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load tenancy documents.",
      });
    }
  };

// ==========================================
// FILE ACCESS AUTHORIZATION
// ==========================================

const findAuthorizedDocument =
  async (req) => {
    const document =
      await TenancyDocument.findById(
        req.params.id
      );

    if (!document) {
      return {
        error: "DOCUMENT_NOT_FOUND",
      };
    }

    const isOwner =
      document.landlord.toString() ===
      req.user._id.toString();

    const isTenant =
      document.tenant.toString() ===
      req.user._id.toString();

    const isAdmin = [
      "admin",
      "super_admin",
    ].includes(req.user.role);

    if (
      !isOwner &&
      !isTenant &&
      !isAdmin
    ) {
      return {
        error: "FORBIDDEN",
      };
    }

    return {
      document,
    };
  };

// ==========================================
// VIEW DOCUMENT FILE
// ==========================================

const viewDocumentFile =
  async (req, res) => {
    try {
      const result =
        await findAuthorizedDocument(
          req
        );

      if (
        result.error ===
        "DOCUMENT_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Document not found.",
        });
      }

      if (
        result.error ===
        "FORBIDDEN"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this document.",
        });
      }

      const {
        document,
      } = result;

      const filePath =
        document.signedFilePath &&
        document.status === "signed"
          ? document.signedFilePath
          : document.originalFilePath;

      if (
        !filePath ||
        !fs.existsSync(filePath)
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Document file not found.",
        });
      }

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${
          document.signedFileName ||
          document.originalFileName
        }"`
      );

      return res.sendFile(
        path.resolve(filePath)
      );
    } catch (error) {
      console.error(
        "View tenancy document error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to open document.",
      });
    }
  };

// ==========================================
// ELECTRONIC SIGNATURE
// ==========================================

const signDocument =
  async (req, res) => {
    try {
      const {
        signature,
      } = req.body;

      if (!signature) {
        return res.status(400).json({
          success: false,
          message:
            "Electronic signature is required.",
        });
      }

      const document =
        await TenancyDocument.findOne({
          _id: req.params.id,
          tenant: req.user._id,
        });

      if (!document) {
        return res.status(404).json({
          success: false,
          message:
            "Tenancy document not found.",
        });
      }

      if (
        document.status === "signed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This document has already been signed.",
        });
      }

      if (
        !document.originalFilePath ||
        !fs.existsSync(
          document.originalFilePath
        )
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Original document file not found.",
        });
      }

      // ======================================
      // VALIDATE SIGNATURE DATA
      // ======================================

      if (
        !signature.startsWith(
          "data:image/png;base64,"
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid signature format.",
        });
      }

      const signatureBase64 =
        signature.split(",")[1];

      const signatureBuffer =
        Buffer.from(
          signatureBase64,
          "base64"
        );

      // ======================================
      // LOAD ORIGINAL PDF
      // ======================================

      const originalPdf =
        fs.readFileSync(
          document.originalFilePath
        );

      const pdfDoc =
        await PDFDocument.load(
          originalPdf
        );

      const signatureImage =
        await pdfDoc.embedPng(
          signatureBuffer
        );

      const font =
        await pdfDoc.embedFont(
          StandardFonts.Helvetica
        );

      const boldFont =
        await pdfDoc.embedFont(
          StandardFonts.HelveticaBold
        );

      // ======================================
      // CREATE SIGNATURE PAGE
      // ======================================

      const page =
        pdfDoc.addPage([
          595.28,
          841.89,
        ]);

      const {
        width,
        height,
      } = page.getSize();

      page.drawText(
        "OCEAN TRAIL CONDOMINIUM",
        {
          x: 50,
          y: height - 70,
          size: 20,
          font: boldFont,
          color: rgb(
            0.294,
            0.31,
            0.576
          ),
        }
      );

      page.drawText(
        "Electronic Signature Record",
        {
          x: 50,
          y: height - 105,
          size: 15,
          font: boldFont,
        }
      );

      page.drawText(
        "Document:",
        {
          x: 50,
          y: height - 155,
          size: 11,
          font: boldFont,
        }
      );

      page.drawText(
        document.title,
        {
          x: 125,
          y: height - 155,
          size: 11,
          font,
          maxWidth: 420,
        }
      );

      page.drawText(
        "Document Type:",
        {
          x: 50,
          y: height - 180,
          size: 11,
          font: boldFont,
        }
      );

      page.drawText(
        document.documentType ===
        "renewal"
          ? "Tenancy Renewal"
          : "Tenancy Agreement",
        {
          x: 155,
          y: height - 180,
          size: 11,
          font,
        }
      );

      page.drawText(
        "Signed By:",
        {
          x: 50,
          y: height - 205,
          size: 11,
          font: boldFont,
        }
      );

      page.drawText(
        req.user.fullName,
        {
          x: 125,
          y: height - 205,
          size: 11,
          font,
        }
      );

      page.drawText(
        "Email:",
        {
          x: 50,
          y: height - 230,
          size: 11,
          font: boldFont,
        }
      );

      page.drawText(
        req.user.email,
        {
          x: 100,
          y: height - 230,
          size: 11,
          font,
        }
      );

      page.drawText(
        "Signed At:",
        {
          x: 50,
          y: height - 255,
          size: 11,
          font: boldFont,
        }
      );

      const signedAt =
        new Date();

      page.drawText(
        signedAt.toLocaleString(
          "en-NG"
        ),
        {
          x: 115,
          y: height - 255,
          size: 11,
          font,
        }
      );

      page.drawText(
        "Electronic Signature:",
        {
          x: 50,
          y: height - 310,
          size: 11,
          font: boldFont,
        }
      );

      // ======================================
      // DRAW SIGNATURE
      // ======================================

      const signatureWidth = 220;
      const signatureHeight = 80;

      page.drawImage(
        signatureImage,
        {
          x: 50,
          y: height - 410,
          width: signatureWidth,
          height: signatureHeight,
        }
      );

      page.drawLine({
        start: {
          x: 50,
          y: height - 415,
        },
        end: {
          x: 300,
          y: height - 415,
        },
        thickness: 1,
        color: rgb(
          0.4,
          0.4,
          0.4
        ),
      });

      page.drawText(
        "Tenant Signature",
        {
          x: 50,
          y: height - 435,
          size: 10,
          font,
          color: rgb(
            0.4,
            0.4,
            0.4
          ),
        }
      );

      // ======================================
      // DOCUMENT ID
      // ======================================

      const documentReference =
        `OT-${crypto
          .randomBytes(6)
          .toString("hex")
          .toUpperCase()}`;

      page.drawText(
        `Electronic Document Reference: ${documentReference}`,
        {
          x: 50,
          y: 100,
          size: 10,
          font,
          color: rgb(
            0.35,
            0.35,
            0.35
          ),
        }
      );

      page.drawText(
        "This page records the electronic signing event for this document.",
        {
          x: 50,
          y: 78,
          size: 9,
          font,
          color: rgb(
            0.45,
            0.45,
            0.45
          ),
        }
      );

      // ======================================
      // SAVE SIGNED PDF
      // ======================================

      const pdfBytes =
        await pdfDoc.save();

      const signedFileName =
        `${Date.now()}-signed-${document.originalFileName}`;

      const signedFilePath =
        path.join(
          signedDirectory,
          signedFileName
        );

      fs.writeFileSync(
        signedFilePath,
        pdfBytes
      );

      // ======================================
      // SAVE SIGNATURE DETAILS
      // ======================================

      document.signatureImage =
        signature;

      document.signedFileName =
        signedFileName;

      document.signedFilePath =
        signedFilePath;

      document.status =
        "signed";

      document.signedBy =
        req.user._id;

      document.signedAt =
        signedAt;

      document.signatureIp =
        req.ip ||
        req.headers[
          "x-forwarded-for"
        ] ||
        null;

      document.signatureUserAgent =
        req.headers[
          "user-agent"
        ] || null;

      await document.save();

      return res.status(200).json({
        success: true,
        message:
          "Document signed successfully.",
        document: {
          id: document._id,
          status: document.status,
          signedAt:
            document.signedAt,
          signedFileName:
            document.signedFileName,
        },
      });
    } catch (error) {
      console.error(
        "Sign tenancy document error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to sign document.",
      });
    }
  };

module.exports = {
  uploadTenancyDocument,
  getLandlordDocuments,
  getTenantDocuments,
  viewDocumentFile,
  signDocument,
};