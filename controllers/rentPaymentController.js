
const mongoose = require("mongoose");

const RentPayment = require("../models/RentPayment");
const Property = require("../models/Property");
const Apartment = require("../models/Apartment");

const getId = (value) =>
  value?._id ? value._id : value;

// ==========================================================
// CREATE RENT PAYMENT
// POST /api/rent-payments
// ==========================================================

exports.createRentPayment = async (req, res) => {
  try {
    const tenantId = req.user?._id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const {
      apartment: apartmentId,
      amount,
      paymentReference,
      paymentMethod,
      paymentPeriod,
      description,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(apartmentId) ||
      !amount ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      !paymentReference ||
      !String(paymentReference).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Apartment, valid payment amount and payment reference are required.",
      });
    }

    // ======================================================
    // VERIFY TENANT APARTMENT
    // ======================================================

    const apartment = await Apartment.findById(apartmentId)
      .populate("property", "name landlord");

    if (!apartment) {
      return res.status(404).json({
        success: false,
        message: "Apartment not found.",
      });
    }

    if (
      !apartment.tenant ||
      String(getId(apartment.tenant)) !== String(tenantId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only submit rent payments for your assigned apartment.",
      });
    }

    const property = apartment.property;

    if (!property || !property.landlord) {
      return res.status(400).json({
        success: false,
        message:
          "This apartment does not have a valid landlord assignment.",
      });
    }

    // ======================================================
    // CHECK DUPLICATE PAYMENT REFERENCE
    // ======================================================

    const reference = String(paymentReference).trim();

    const existingPayment = await RentPayment.findOne({
      paymentReference: reference,
    });

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: "This payment reference has already been submitted.",
      });
    }

    // ======================================================
    // SAVE RECEIPT IN MONGODB
    //
    // Multer memoryStorage provides req.file.buffer.
    // Do not use req.file.path here.
    // ======================================================

    let receipt;

    if (req.file) {
      receipt = {
        originalName: req.file.originalname,
        data: req.file.buffer,
        path: null,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };
    }

    // ======================================================
    // CREATE RENT PAYMENT
    // ======================================================

    const payment = await RentPayment.create({
      tenant: tenantId,
      landlord: property.landlord,
      property: property._id,
      apartment: apartment._id,
      amount: Number(amount),
      paymentReference: reference,
      paymentMethod: paymentMethod || "bank_transfer",
      paymentPeriod: paymentPeriod || "",
      description: description || "",
      ...(receipt ? { receipt } : {}),
      status: "pending",
    });

    const populatedPayment = await RentPayment.findById(payment._id)
      .populate("tenant", "fullName email phone")
      .populate("landlord", "fullName email")
      .populate("property", "name address")
      .populate("apartment", "apartmentNumber block floor");

    return res.status(201).json({
      success: true,
      message: "Rent payment submitted successfully.",
      payment: populatedPayment,
    });
  } catch (error) {
    console.error("Create rent payment error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This payment reference has already been submitted.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to submit rent payment.",
      error: error.message,
    });
  }
};

// ==========================================================
// TENANT RENT PAYMENT HISTORY
// GET /api/rent-payments/tenant
// ==========================================================

exports.getTenantRentPayments = async (req, res) => {
  try {
    const payments = await RentPayment.find({
      tenant: req.user._id,
    })
      .populate("property", "name address city state")
      .populate("apartment", "apartmentNumber block floor")
      .populate("landlord", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Tenant rent history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve rent payment history.",
    });
  }
};

// ==========================================================
// LANDLORD RENT PAYMENT HISTORY
// GET /api/rent-payments/landlord
//
// Only payments belonging to apartments in properties
// owned by the authenticated landlord are returned.
// ==========================================================

exports.getLandlordRentPayments = async (req, res) => {
  try {
    const landlordId = req.user._id;

    const properties = await Property.find({
      landlord: landlordId,
    }).select("_id");

    const propertyIds = properties.map(
      (property) => property._id
    );

    const payments = await RentPayment.find({
      property: { $in: propertyIds },
    })
      .populate("tenant", "fullName email phone")
      .populate("landlord", "fullName email")
      .populate("property", "name address city state")
      .populate("apartment", "apartmentNumber block floor")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Landlord rent history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve landlord rent payment history.",
    });
  }
};

// ==========================================================
// ADMIN / SUPER ADMIN RENT PAYMENT HISTORY
// GET /api/rent-payments/admin
// ==========================================================

exports.getAdminRentPayments = async (req, res) => {
  try {
    const payments = await RentPayment.find({})
      .populate("tenant", "fullName email phone")
      .populate("landlord", "fullName email")
      .populate("property", "name address city state")
      .populate("apartment", "apartmentNumber block floor")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Admin rent history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve platform rent payment history.",
    });
  }
};

// ==========================================================
// ADMIN CONFIRM OR UPDATE RENT PAYMENT
// PATCH /api/rent-payments/:id/status
// ==========================================================

exports.updateRentPaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "successful",
      "failed",
      "reversed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rent payment ID.",
      });
    }

    const payment = await RentPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Rent payment not found.",
      });
    }

    payment.status = status;

    if (status === "successful") {
      payment.paidAt = payment.paidAt || new Date();
      payment.confirmedAt = new Date();
      payment.confirmedBy = req.user._id;
    }

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Rent payment status updated successfully.",
      payment,
    });
  } catch (error) {
    console.error("Update rent payment status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update rent payment status.",
    });
  }
};
