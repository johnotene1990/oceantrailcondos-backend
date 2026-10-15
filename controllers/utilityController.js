const UtilityWallet = require("../models/UtilityWallet");
const ElectricityToken = require("../models/ElectricityToken");
const { verifyPaystackPayment } = require("../Service/paystackService");
const { generateMomasToken } = require("../Service/momasService");
const User = require("../models/User");

/**
 * GET /api/utilities/wallet
 * Fetch tenant's utility wallet balance
 */
const getWallet = async (req, res) => {
  try {
    let wallet = await UtilityWallet.findOne({ tenant: req.user._id });
    if (!wallet) {
      wallet = await UtilityWallet.create({ tenant: req.user._id, balance: 0 });
    }
    return res.json({ success: true, wallet });
  } catch (error) {
    console.error("Get wallet error:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch wallet." });
  }
};

/**
 * POST /api/utilities/wallet/fund
 * Verify Paystack deposit and fund tenant wallet
 */
const fundWallet = async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ success: false, message: "Payment reference is required." });
    }

    // Verify payment securely via Paystack API
    const paymentData = await verifyPaystackPayment(reference);
    const amountPaid = paymentData.amount / 100; // Convert kobo to Naira

    let wallet = await UtilityWallet.findOne({ tenant: req.user._id });
    if (!wallet) {
      wallet = await UtilityWallet.create({ tenant: req.user._id, balance: 0 });
    }

    wallet.balance += amountPaid;
    await wallet.save();

    return res.json({
      success: true,
      message: `Wallet funded successfully with ₦${amountPaid.toLocaleString()}`,
      wallet,
    });
  } catch (error) {
    console.error("Fund wallet error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fund wallet." });
  }
};

/**
 * POST /api/utilities/buy-token
 * Deduct from wallet, trigger Momas API, allocate 5% commission, save token
 */
const buyElectricityToken = async (req, res) => {
  try {
    const { meterNumber, amount } = req.body;

    if (!meterNumber || !amount) {
      return res.status(400).json({ success: false, message: "Meter number and amount are required." });
    }

    const numericAmount = Number(amount);
    if (numericAmount < 20000 || numericAmount > 100000) {
      return res.status(400).json({
        success: false,
        message: "Token amount must be between ₦20,000 and ₦100,000.",
      });
    }

    const wallet = await UtilityWallet.findOne({ tenant: req.user._id });
    if (!wallet || wallet.balance < numericAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance. Please fund your utility wallet.",
      });
    }

    const tenant = await User.findById(req.user._id);

    // Calculate 5% Commission for Momas / Company
    const commissionDeducted = numericAmount * 0.05;

    // Call Momas Smart API to generate token
    const momasResult = await generateMomasToken({
      meterNumber,
      amount: numericAmount,
      tenantEmail: tenant?.email,
    });

    if (!momasResult.success) {
      return res.status(500).json({ success: false, message: "Momas token generation failed." });
    }

    // Deduct amount from tenant wallet
    wallet.balance -= numericAmount;
    await wallet.save();

    // Create unique reference for token transaction
    const txReference = `MOMAS-TOK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Save token record for tenant & admin reference
    const tokenRecord = await ElectricityToken.create({
      tenant: req.user._id,
      meterNumber,
      amountPaid: numericAmount,
      commissionDeducted,
      tokenCode: momasResult.token,
      units: `${momasResult.unitsValue} kWh`,
      reference: txReference,
      status: "success",
    });

    return res.status(201).json({
      success: true,
      message: "Electricity token generated successfully!",
      tokenData: tokenRecord,
      walletBalance: wallet.balance,
    });
  } catch (error) {
    console.error("Buy electricity token error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to complete token purchase." });
  }
};

/**
 * GET /api/utilities/tokens
 * Tenant views their generated token history
 */
const getTenantTokens = async (req, res) => {
  try {
    const tokens = await ElectricityToken.find({ tenant: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, tokens });
  } catch (error) {
    console.error("Get tenant tokens error:", error);
    return res.status(500).json({ success: false, message: "Unable to load token history." });
  }
};

/**
 * GET /api/utilities/admin/tokens
 * Admin views all electricity tokens generated across the estate for reference
 */
const getAdminTokens = async (req, res) => {
  try {
    const tokens = await ElectricityToken.find({})
      .populate("tenant", "fullName email phone block floor apartment")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, tokens });
  } catch (error) {
    console.error("Get admin tokens error:", error);
    return res.status(500).json({ success: false, message: "Unable to load admin token logs." });
  }
};

module.exports = {
  getWallet,
  fundWallet,
  buyElectricityToken,
  getTenantTokens,
  getAdminTokens,
};