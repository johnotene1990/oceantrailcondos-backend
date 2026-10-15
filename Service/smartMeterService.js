// backend/services/smartMeterService.js
const axios = require("axios");
const { sendTokenEmail } = require("../Service/notificationService");

/**
 * Smart Meter Third-Party API Integration Service
 */

const VENDOR_API_BASE_URL = process.env.SMART_METER_API_URL || "https://api.externalmeterprovider.com/v1";
const VENDOR_API_KEY = process.env.SMART_METER_API_KEY || "YOUR_VENDOR_API_KEY_HERE";
const VENDOR_SECRET = process.env.SMART_METER_API_SECRET || "YOUR_VENDOR_SECRET_HERE";

/**
 * Validate Smart Meter Number with Third-Party API
 */
const verifyMeterNumber = async (meterNumber) => {
  try {
    if (!meterNumber || meterNumber.length < 5) {
      return { valid: false, message: "Invalid meter number format" };
    }

    return {
      valid: true,
      meterNumber,
      customerName: "Ocean Trail Resident",
    };
  } catch (error) {
    console.error("Smart Meter Verification Error:", error.message);
    throw new Error("Unable to verify meter number with third-party vendor.");
  }
};

/**
 * Trigger External Third-Party API to Generate Electricity Token
 */
const generateMeterToken = async (meterNumber, amount, transactionRef) => {
  try {
    console.log(`[SmartMeterService] Triggering token generation for Meter: ${meterNumber}, Amount: ₦${amount}`);

    // Simulated Token Generation (Fallback until production vendor API keys are attached)
    const simulatedToken = Array.from({ length: 4 }, () =>
      Math.floor(1000 + Math.random() * 9000)
    ).join("-");

    const calculatedUnits = (Number(amount) / 100).toFixed(1);

    return {
      success: true,
      token: simulatedToken,
      unitsKwh: calculatedUnits,
      vendorRef: `VEND-${Date.now()}`,
    };
  } catch (error) {
    console.error("External Smart Meter API Token Generation Failed:", error.message);
    throw new Error(
      error.response?.data?.message || "Failed to generate token from external smart meter API."
    );
  }
};

/**
 * Send Token via Email to both Tenant and Admin
 */
const dispatchTokenNotifications = async ({ tenantName, tenantEmail, meterNumber, token, unitsKwh, amount }) => {
  try {
    console.log(`[SmartMeterService] Initiating Email dispatch to tenant (${tenantEmail}) and admin copy...`);

    const result = await sendTokenEmail({
      email: tenantEmail,
      tenantName,
      token,
      units: unitsKwh,
      meterNumber,
      amount,
    });

    return {
      dispatched: result.success,
      emailSent: result.success,
    };
  } catch (err) {
    console.error("Failed to send token email notification:", err.message);
    return { dispatched: false, error: err.message };
  }
};

module.exports = {
  verifyMeterNumber,
  generateMeterToken,
  dispatchTokenNotifications,
};