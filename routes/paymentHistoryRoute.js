const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  getPaymentHistory,
} = require("../controllers/paymentHistoryController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| Tenant payment history
|--------------------------------------------------------------------------
*/

/*
 * GET /api/payment-history
 *
 * Returns a combined history of:
 *
 * - Service charge payments
 * - Electricity / utility payments
 */
router.get(
  "/",
  getPaymentHistory
);

module.exports = router;