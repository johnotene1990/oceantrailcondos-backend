const axios = require("axios");

/**
 * Communicates with Momas Smart Electricity API to generate STS tokens
 */
const generateMomasToken = async ({ meterNumber, amount, tenantEmail }) => {
  try {
    const MOMAS_URL = process.env.MOMAS_API_URL || "https://api.momasmetering.com/v1";
    const MOMAS_KEY = process.env.MOMAS_API_KEY;

    // If API key is not yet set in development, return a realistic simulated 20-digit STS token
    if (!MOMAS_KEY || MOMAS_KEY === "your_momas_api_key_here") {
      console.warn("Momas API Key missing. Generating simulated STS token for development.");
      const randomToken = Math.floor(1000 + Math.random() * 9000).toString() + "-" +
                          Math.floor(1000 + Math.random() * 9000).toString() + "-" +
                          Math.floor(1000 + Math.random() * 9000).toString() + "-" +
                          Math.floor(1000 + Math.random() * 9000).toString() + "-" +
                          Math.floor(1000 + Math.random() * 9000).toString();
      return {
        success: true,
        token: randomToken,
        unitsValue: (amount / 150).toFixed(2), // simulated unit conversion rate
      };
    }

    const response = await axios.post(
      `${MOMAS_URL}/token/generate`,
      {
        meterNumber,
        amount,
        email: tenantEmail,
      },
      {
        headers: {
          Authorization: `Bearer ${MOMAS_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      token: response.data.token || response.data.data?.token,
      unitsValue: response.data.units || "50.0",
    };
  } catch (error) {
    console.error("Momas API Error:", error.response?.data || error.message);
    throw new Error("Failed to generate token from Momas Electricity API.");
  }
};

module.exports = { generateMomasToken };




// MOMAS REAL LIFE TOKEN GENERATING CODE

// const axios = require("axios");

// /**
//  * Communicates with Momas Smart Electricity API to generate real-life STS tokens.
//  * Requires valid production/sandbox credentials in backend .env.
//  */
// const generateMomasToken = async ({ meterNumber, amount, tenantEmail }) => {
//   try {
//     const MOMAS_URL = process.env.MOMAS_API_URL || "https://api.momasmetering.com/v1";
//     const MOMAS_KEY = process.env.MOMAS_API_KEY;

//     if (!MOMAS_KEY) {
//       throw new Error("Momas API Key is not configured in the server environment.");
//     }

//     // Make live request to Momas Smart Electricity API
//     const response = await axios.post(
//       `${MOMAS_URL}/token/generate`,
//       {
//         meterNumber,
//         amount,
//         email: tenantEmail,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${MOMAS_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // Ensure the response structure matches expected fields from Momas API docs
//     const tokenData = response.data;
    
//     return {
//       success: true,
//       token: tokenData.token || tokenData.data?.token,
//       unitsValue: tokenData.units || tokenData.data?.units || "0.00",
//     };
//   } catch (error) {
//     console.error("Momas API Live Error:", error.response?.data || error.message);
    
//     const errorMessage =
//       error.response?.data?.message ||
//       error.message ||
//       "Failed to communicate with Momas Electricity API.";
      
//     throw new Error(errorMessage);
//   }
// };

// module.exports = { generateMomasToken };