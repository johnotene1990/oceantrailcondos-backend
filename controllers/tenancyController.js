const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const TenancyRenewal = require("../models/TenancyRenewal");
const User = require("../models/User");
const Apartment = require("../models/Apartment");
const TenantNotification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");

const ADMIN_EMAIL = process.env.COMPANY_EMAIL || "oceantrialcondoslekki@gmail.com";
const MONTHS_BEFORE_RENEWAL = 3;

const isWithinRenewalWindow = (expirationDate) => {
  const now = new Date();
  const expiry = new Date(expirationDate);
  const windowStart = new Date(expiry);
  windowStart.setMonth(windowStart.getMonth() - MONTHS_BEFORE_RENEWAL);
  return now >= windowStart && now <= expiry;
};

const getEligibility = async (req, res) => {
  try {
    const date = req.user.tenancyExpirationDate || req.user.leaseEndDate || null;
    if (!date) {
      return res.json({
        success: true,
        eligible: false,
        currentExpirationDate: null,
        message: "Your tenancy expiration date has not been configured.",
      });
    }
    return res.json({
      success: true,
      eligible: isWithinRenewalWindow(date),
      currentExpirationDate: date,
    });
  } catch (error) {
    console.error("Renewal eligibility error:", error);
    return res.status(500).json({ success: false, message: "Unable to check renewal eligibility." });
  }
};

const createRenewalRequest = async (req, res) => {
  try {
    const { currentExpirationDate, requestedRenewalStartDate, requestedRenewalEndDate, notes } = req.body;
    if (!currentExpirationDate || !requestedRenewalStartDate || !requestedRenewalEndDate) {
      return res.status(400).json({ success: false, message: "Dates are required." });
    }

    const expiry = new Date(currentExpirationDate);
    const start = new Date(requestedRenewalStartDate);
    const end = new Date(requestedRenewalEndDate);

    if (!isWithinRenewalWindow(expiry)) {
      return res.status(400).json({ success: false, message: "Renewal can only be requested within final 3 months." });
    }

    const tenant = await User.findById(req.user._id).select("fullName email phone block floor apartment");
    if (!tenant) return res.status(404).json({ success: false, message: "Tenant not found." });

    const renewal = await TenancyRenewal.create({
      tenant: req.user._id,
      tenantName: tenant.fullName,
      tenantEmail: tenant.email,
      tenantPhone: tenant.phone,
      block: tenant.block || "",
      floor: tenant.floor || "",
      apartment: tenant.apartment || "",
      currentExpirationDate: expiry,
      requestedRenewalStartDate: start,
      requestedRenewalEndDate: end,
      notes: notes || "",
    });

    return res.status(201).json({ success: true, message: "Renewal request submitted successfully.", renewal });
  } catch (error) {
    console.error("Create renewal request error:", error);
    return res.status(500).json({ success: false, message: "Unable to submit renewal request." });
  }
};

const getTenantRenewals = async (req, res) => {
  try {
    const renewals = await TenancyRenewal.find({ tenant: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, renewals });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load renewals." });
  }
};

/**
 * POST /api/tenancy-renewals/send-agreement
 * Admin proactively sends an unsigned tenancy agreement to an apartment tenant.
 */
const sendAgreementByApartment = async (req, res) => {
  try {
    const { apartmentId } = req.body;

    if (!apartmentId) {
      return res.status(400).json({ success: false, message: "Apartment ID is required." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload the tenancy agreement PDF." });
    }

    const apartment = await Apartment.findById(apartmentId).populate("tenant", "fullName email phone block floor apartmentNumber");

    if (!apartment) {
      return res.status(404).json({ success: false, message: "Apartment not found." });
    }

    if (!apartment.tenant) {
      return res.status(400).json({ success: false, message: "This apartment does not have an assigned tenant yet." });
    }

    const tenant = apartment.tenant;

    let renewal = await TenancyRenewal.findOne({
      tenant: tenant._id,
      status: { $nin: ["approved", "declined"] },
    });

    const agreementData = {
      originalName: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
    };

    if (renewal) {
      renewal.landlordAgreement = agreementData;
      renewal.status = "agreement_issued";
      await renewal.save();
    } else {
      renewal = await TenancyRenewal.create({
        tenant: tenant._id,
        tenantName: tenant.fullName,
        tenantEmail: tenant.email,
        tenantPhone: tenant.phone || "",
        block: apartment.block || "",
        floor: apartment.floor || "",
        apartment: apartment.apartmentNumber || "",
        currentExpirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        requestedRenewalStartDate: new Date(),
        requestedRenewalEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        landlordAgreement: agreementData,
        status: "agreement_issued",
      });
    }

    try {
      await TenantNotification.create({
        recipient: tenant._id,
        title: "New Tenancy Agreement Issued",
        message: "Management has sent your tenancy agreement. Please review, sign, and return it.",
        type: "renewal",
      });
    } catch (err) {
      console.error("Tenant notification error:", err);
    }

    return res.status(201).json({
      success: true,
      message: "Tenancy agreement successfully sent to tenant.",
      renewal,
    });
  } catch (error) {
    console.error("Send agreement by apartment error:", error);
    return res.status(500).json({ success: false, message: "Unable to send tenancy agreement." });
  }
};

const uploadLandlordAgreement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload the tenancy agreement PDF." });
    }

    const renewal = await TenancyRenewal.findById(req.params.id);
    if (!renewal) {
      return res.status(404).json({ success: false, message: "Renewal request not found." });
    }

    renewal.landlordAgreement = {
      originalName: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
    };
    renewal.status = "agreement_issued";
    await renewal.save();

    try {
      await TenantNotification.create({
        recipient: renewal.tenant,
        title: "Tenancy Agreement Issued",
        message: "Management has uploaded your tenancy agreement. Please review, sign, and return it.",
        type: "renewal",
      });
    } catch (err) {
      console.error("Notification error:", err);
    }

    return res.json({ success: true, message: "Tenancy agreement uploaded and sent.", renewal });
  } catch (error) {
    console.error("Upload landlord agreement error:", error);
    return res.status(500).json({ success: false, message: "Unable to upload agreement." });
  }
};

const signAgreement = async (req, res) => {
  try {
    const renewal = await TenancyRenewal.findOne({ _id: req.params.id, tenant: req.user._id });
    if (!renewal || !renewal.landlordAgreement?.path) {
      return res.status(404).json({ success: false, message: "Agreement PDF not found." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Signature image required." });
    }

    const sourcePdf = fs.readFileSync(renewal.landlordAgreement.path);
    const pdf = await PDFDocument.load(sourcePdf);
    const signatureImage = await pdf.embedPng(fs.readFileSync(req.file.path));

    const page = pdf.getPages()[pdf.getPageCount() - 1];
    const { width } = page.getSize();
    const sigWidth = 160;
    const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;

    page.drawImage(signatureImage, {
      x: Math.max(40, width - sigWidth - 50),
      y: 45,
      width: sigWidth,
      height: Math.min(80, sigHeight),
      opacity: 0.95,
    });

    const outDir = path.join(__dirname, "../uploads/tenancy-renewals");
    fs.mkdirSync(outDir, { recursive: true });

    const outPath = path.join(outDir, `signed-${renewal._id}-${Date.now()}.pdf`);
    fs.writeFileSync(outPath, await pdf.save());

    renewal.signedAgreement = {
      originalName: `signed-${renewal.landlordAgreement.originalName}`,
      path: outPath,
      mimeType: "application/pdf",
      size: fs.statSync(outPath).size,
    };
    renewal.status = "signed";
    await renewal.save();

    return res.json({ success: true, message: "Signed agreement submitted successfully.", renewal });
  } catch (error) {
    console.error("Sign agreement error:", error);
    return res.status(500).json({ success: false, message: "Unable to sign agreement." });
  }
};

const getAgreementFile = async (req, res) => {
  try {
    const record = await TenancyRenewal.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Renewal not found." });

    const requested = req.query.type === "signed" ? record.signedAgreement : record.landlordAgreement;
    if (!requested?.path || !fs.existsSync(requested.path)) {
      return res.status(404).json({ success: false, message: "File not found." });
    }

    return res.sendFile(path.resolve(requested.path));
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to open file." });
  }
};

const getAdminRenewals = async (req, res) => {
  try {
    const renewals = await TenancyRenewal.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, renewals });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load renewals." });
  }
};

const updateRenewalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const renewal = await TenancyRenewal.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!renewal) return res.status(404).json({ success: false, message: "Renewal not found." });
    return res.json({ success: true, message: "Status updated.", renewal });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update status." });
  }
};

module.exports = {
  getEligibility,
  createRenewalRequest,
  getTenantRenewals,
  sendAgreementByApartment,
  uploadLandlordAgreement,
  signAgreement,
  getAgreementFile,
  getAdminRenewals,
  updateRenewalStatus,
};