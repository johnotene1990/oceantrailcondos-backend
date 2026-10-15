const mongoose = require("mongoose");
const ServiceCharge = require("../models/ServiceCharge");
const TenantNotification = require("../models/Notification");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const createTenantNotification = async ({ tenantId, title, message }) => {
  if (!tenantId) return;
  try {
    await TenantNotification.create({
      recipient: tenantId,
      title,
      message,
      type: "payment",
    });
  } catch (error) {
    console.error("Tenant notification error:", error);
  }
};

/*
====================================================
TENANT - GET CHARGES (Reflects instantly on tenant page)
====================================================
*/
const getTenantCharges = async (req, res) => {
  try {
    const tenantId = req.user?._id || req.user?.id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Tenant ID not found.",
      });
    }

    const charges = await ServiceCharge.find({
      tenant: tenantId,
      status: { $ne: "cancelled" },
    })
      .populate("property", "name address city state")
      .populate("apartment", "apartmentNumber block floor")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      charges,
    });
  } catch (error) {
    console.error("Get tenant charges error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load tenant service charges.",
    });
  }
};

/*
====================================================
TENANT - SUBMIT PAYMENT RECEIPT PROOF
====================================================
*/
const submitPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?._id || req.user?.id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid service charge ID." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please attach a payment receipt file." });
    }

    const charge = await ServiceCharge.findOne({ _id: id, tenant: tenantId });

    if (!charge) {
      return res.status(404).json({ success: false, message: "Service charge record not found." });
    }

    // Attach receipt data and update status to proof_submitted
    charge.paymentDetails = {
      receiptData: req.file.buffer,
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      submittedAt: new Date(),
    };
    charge.status = "proof_submitted";

    await charge.save();

    return res.status(200).json({
      success: true,
      message: "Payment receipt submitted successfully to management for confirmation.",
      charge,
    });
  } catch (error) {
    console.error("Submit payment proof error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit payment receipt.",
    });
  }
};

module.exports = {
  getTenantCharges,
  submitPaymentProof,
};