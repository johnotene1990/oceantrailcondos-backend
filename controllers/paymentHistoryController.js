const ServiceCharge = require("../models/ServiceCharge");
const UtilityBillPayment = require("../models/UtilityBill");

const getPaymentHistory = async (
  req,
  res
) => {
  try {
    const [
      charges,
      utilities,
    ] = await Promise.all([
      /**
       * Service charges
       */
      ServiceCharge.find({
        tenant:
          req.user._id,
      })
        .populate(
          "property",
          "name"
        )
        .populate(
          "apartment",
          "apartmentNumber block floor"
        ),

      /**
       * Electricity / utility payments
       */
      UtilityBillPayment.find({
        tenant:
          req.user._id,
      }),
    ]);

    /**
     * Convert service charges into
     * a common payment-history format.
     */
    const serviceChargeHistory =
      charges.map(
        (charge) => ({
          id:
            `service-${charge._id}`,

          sourceId:
            charge._id,

          service:
            "Service Charge",

          description:
            charge.title,

          amount:
            charge.amount,

          status:
            charge.status,

          reference:
            charge.paymentDetails
              ?.transactionReference ||
            null,

          date:
            charge.paidAt ||
            charge.createdAt,

          receiptUrl:
            charge.paymentDetails
              ?.receiptUrl ||
            null,

          property:
            charge.property
              ? {
                  name:
                    charge
                      .property
                      .name,
                }
              : null,

          apartment:
            charge.apartment
              ? {
                  apartmentNumber:
                    charge
                      .apartment
                      .apartmentNumber,

                  block:
                    charge
                      .apartment
                      .block,

                  floor:
                    charge
                      .apartment
                      .floor,
                }
              : null,
        })
      );

    /**
     * Convert utility payments into
     * the same common format.
     */
    const utilityHistory =
      utilities.map(
        (payment) => ({
          id:
            `utility-${payment._id}`,

          sourceId:
            payment._id,

          service:
            "Utility Bill",

          description:
            `${payment.utilityType} payment - Meter ${payment.meterNumber}`,

          amount:
            payment.amount,

          status:
            payment.status,

          reference:
            payment.transactionReference,

          date:
            payment.vendedAt ||
            payment.confirmedAt ||
            payment.createdAt,

          token:
            payment.token ||
            null,

          units:
            payment.units ??
            null,

          meterNumber:
            payment.meterNumber,

          utilityType:
            payment.utilityType,
        })
      );

    /**
     * Combine all payments.
     */
    const history = [
      ...serviceChargeHistory,
      ...utilityHistory,
    ].sort(
      (a, b) =>
        new Date(
          b.date
        ) -
        new Date(
          a.date
        )
    );

    return res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error(
      "Payment history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load payment history.",
    });
  }
};

module.exports = {
  getPaymentHistory,
};