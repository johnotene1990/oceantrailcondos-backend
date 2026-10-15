const axios = require("axios");

// ==========================================
// RECHARGE SMART METER
// ==========================================

const rechargeMeter = async ({
  meterNumber,
  amount,
  reference,
}) => {
  const baseUrl =
    process.env.SMART_METER_API_URL;

  const token =
    process.env.SMART_METER_API_TOKEN;

  const path =
    process.env.SMART_METER_RECHARGE_PATH ||
    "/recharge";

  if (!baseUrl || !token) {
    return {
      success: false,
      status: "not_configured",
      message:
        "Smart Meter partner API is not configured.",
    };
  }

  try {
    const response =
      await axios.post(
        `${baseUrl}${path}`,
        {
          meterNumber,
          amount,
          reference,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          timeout: 30000,
        }
      );

    const data =
      response.data;

    return {
      success:
        data?.success === true ||
        data?.status === true,

      status:
        data?.status ||
        "unknown",

      reference:
        data?.reference ||
        data?.data?.reference ||
        reference,

      message:
        data?.message ||
        "Meter recharge request completed.",

      raw: data,
    };
  } catch (error) {
    console.error(
      "Smart meter API error:",
      error.response?.data ||
        error.message
    );

    return {
      success: false,
      status: "failed",
      message:
        error.response?.data?.message ||
        "Smart meter recharge failed.",
    };
  }
};

module.exports = {
  rechargeMeter,
};