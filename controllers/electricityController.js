//const smartMeterService = require("../Service/smartMeterService");
const ElectricityRequest = require("../models/ElectricityRequest");

/**
 * Tenant Requests Electricity Token Purchase (Initiates Zenith Bank Transfer)
 */
const requestElectricityToken = async (req, res) => {
  try {
    const {
      meterNumber,
      amount,
      senderName,
      senderBank,
      transactionReference,
      tenantName,
      tenantEmail,
      tenantPhone,
    } = req.body;

    if (!meterNumber || !amount || !transactionReference) {
      return res.status(400).json({
        success: false,
        message: "Meter number, amount, and payment reference are required.",
      });
    }

    // Verify meter valid format
    const verification = await smartMeterService.verifyMeterNumber(meterNumber);
    if (!verification?.valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid meter number provided.",
      });
    }

    // Prevent duplicate transaction submissions
    const existing = await ElectricityRequest.findOne({ transactionReference });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This payment reference has already been submitted.",
      });
    }

    // Save request to MongoDB
    const newRequest = await ElectricityRequest.create({
      tenant: req.user ? req.user._id : null,
      tenantName: tenantName || (req.user ? req.user.name : "Tenant"),
      tenantEmail: tenantEmail || (req.user ? req.user.email : ""),
      tenantPhone: tenantPhone || (req.user ? req.user.phone : ""),
      meterNumber,
      amount,
      senderName,
      senderBank,
      transactionReference,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message:
        "Electricity token purchase request submitted! Awaiting admin payment verification.",
      requestId: newRequest._id,
      data: newRequest,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin Fetches Pending Electricity Token Requests for Approval Table
 */
const getPendingRequests = async (req, res) => {
  try {
    const requests = await ElectricityRequest.find({ status: "pending" }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin Verifies Zenith Bank Payment & Triggers Smart Meter API
 */
const approveAndGenerateToken = async (req, res) => {
  try {
    const { requestId, meterNumber, amount, tenantEmail, tenantPhone } = req.body;

    // Check if record exists in database
    const requestRecord = await ElectricityRequest.findById(requestId);

    // Prevent re-approving processed requests
    if (requestRecord && requestRecord.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "This request has already been approved and a token was generated.",
      });
    }

    const targetMeter = meterNumber || requestRecord?.meterNumber;
    const targetAmount = amount || requestRecord?.amount;
    const targetEmail = tenantEmail || requestRecord?.tenantEmail;
    const targetPhone = tenantPhone || requestRecord?.tenantPhone;

    // 1. Call External API via smartMeterService
    const tokenData = await smartMeterService.generateMeterToken(
      targetMeter,
      targetAmount,
      requestId
    );

    if (!tokenData || !tokenData.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate token from smart meter provider.",
      });
    }

    // 2. Dispatch Notifications (Safely caught to prevent pipeline failure)
    try {
      await smartMeterService.dispatchTokenNotifications({
        tenantEmail: targetEmail,
        tenantPhone: targetPhone,
        meterNumber: targetMeter,
        token: tokenData.token,
        unitsKwh: tokenData.unitsKwh,
        amount: targetAmount,
      });
    } catch (dispatchError) {
      console.error("[Notification Warning]: Failed to dispatch notifications:", dispatchError.message || dispatchError);
    }

    // 3. Update Database Status if record exists
    if (requestRecord) {
      requestRecord.status = "approved";
      requestRecord.token = tokenData.token;
      requestRecord.unitsKwh = tokenData.unitsKwh;
      if (req.user) requestRecord.approvedBy = req.user._id;
      requestRecord.approvedAt = new Date();
      await requestRecord.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified. Smart meter token generated and sent to tenant!",
      data: tokenData,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  requestElectricityToken,
  getPendingRequests,
  approveAndGenerateToken,
};