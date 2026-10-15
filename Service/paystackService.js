const https = require("https");

/**
 * Verifies Paystack transaction references securely against Paystack API.
 */
const verifyPaystackPayment = (reference) => {
  return new Promise((resolve, reject) => {
    const paystackSecret = (process.env.PAYSTACK_SECRET_KEY || "").trim();

    if (!paystackSecret || paystackSecret.includes("your_paystack_secret_key")) {
      return reject(new Error("Paystack secret key is not configured on the server."));
    }

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: `/transaction/verify/${encodeURIComponent(reference)}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          if (response.status && response.data?.status === "success") {
            resolve(response.data);
          } else {
            reject(new Error(response.message || "Paystack transaction verification failed."));
          }
        } catch (err) {
          reject(new Error("Unable to parse Paystack verification response."));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Paystack connection error: ${error.message}`));
    });

    req.end();
  });
};

module.exports = { verifyPaystackPayment };