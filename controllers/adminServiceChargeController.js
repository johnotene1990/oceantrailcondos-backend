const mongoose = require("mongoose");
const Apartment = require("../models/Apartment");
const ServiceCharge = require("../models/ServiceCharge");
const TenantNotification = require("../models/Notification");

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const createTenantNotification = async ({
  tenantId,
  title,
  message,
}) => {
  if (!tenantId) return;

  try {
    await TenantNotification.create({
      recipient: tenantId,
      title,
      message,
      type: "payment",
    });
  } catch (error) {
    console.error(
      "Tenant notification error:",
      error
    );
  }
};

/*
====================================================
ADMIN - GET ALL APARTMENTS + TENANTS + CHARGES
====================================================
*/

const getAdminApartments = async (req, res) => {
  try {
    const apartments = await Apartment.find({})
      .populate(
        "tenant",
        "fullName email phone role"
      )
      .populate(
        "property",
        "name address city state landlord"
      )
      .sort({
        block: 1,
        apartmentNumber: 1,
      });

    const apartmentIds = apartments.map(
      (apartment) => apartment._id
    );

    const charges =
      apartmentIds.length > 0
        ? await ServiceCharge.find({
            apartment: {
              $in: apartmentIds,
            },
            status: {
              $ne: "cancelled",
            },
          })
            .select(
              "-paymentDetails.receiptData"
            )
            .sort({
              createdAt: -1,
            })
        : [];

    const latestChargeByApartment =
      new Map();

    for (const charge of charges) {
      const apartmentId = String(
        charge.apartment
      );

      if (
        !latestChargeByApartment.has(
          apartmentId
        )
      ) {
        latestChargeByApartment.set(
          apartmentId,
          charge
        );
      }
    }

    const result = apartments.map(
      (apartment) => {
        const charge =
          latestChargeByApartment.get(
            String(apartment._id)
          ) || null;

        const amount = charge
          ? safeNumber(charge.amount)
          : 0;

        const paidAmount = charge
          ? safeNumber(charge.paidAmount)
          : 0;

        const outstandingBalance = charge
          ? safeNumber(
              charge.outstandingBalance,
              Math.max(
                0,
                amount - paidAmount
              )
            )
          : 0;

        return {
          apartment,

          tenant:
            apartment.tenant || null,

          property:
            apartment.property || null,

          currentCharge: charge
            ? {
                ...charge.toObject(),

                paidAmount,

                outstandingBalance,
              }
            : null,
        };
      }
    );

    return res.status(200).json({
      success: true,

      apartments: result,

      summary: {
        totalApartments:
          result.length,

        occupiedApartments:
          result.filter(
            (item) => item.tenant
          ).length,

        chargesConfigured:
          result.filter(
            (item) =>
              item.currentCharge
          ).length,
      },
    });
  } catch (error) {
    console.error(
      "Get admin apartments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load apartments and tenants.",
    });
  }
};

/*
====================================================
ADMIN - GET ALL PAYMENT RECORDS / RECEIPTS FOR REVIEW
====================================================
*/

const getAdminPaymentRecords = async (
  req,
  res
) => {
  try {
    const charges =
      await ServiceCharge.find({
        $or: [
          {
            status:
              "pending_verification",
          },

          {
            "paymentDetails.transactionReference":
              {
                $exists: true,
                $ne: null,
              },
          },
        ],
      })
        .populate(
          "tenant",
          "fullName email phone"
        )
        .populate({
          path: "apartment",

          populate: {
            path: "property",

            select:
              "name address city state",
          },
        })

        .select(
          "-paymentDetails.receiptData"
        )

        .sort({
          updatedAt: -1,
        });

    return res.status(200).json({
      success: true,

      // ==========================================
      // EXISTING RESPONSE PROPERTY
      // ==========================================
      payments: charges,

      // ==========================================
      // FIX:
      // Keep "charges" available as well.
      //
      // This prevents a mismatch if the existing
      // AdminServiceCharge.jsx reads data.charges.
      //
      // No existing "payments" property is removed.
      // ==========================================
      charges: charges,
    });
  } catch (error) {
    console.error(
      "Get admin payment records error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load payment records.",
    });
  }
};

/*
====================================================
ADMIN - ADD / UPDATE SERVICE CHARGE
FOR TENANT/APARTMENT
====================================================
*/

const createOrUpdateApartmentServiceCharge =
  async (req, res) => {
    try {
      const {
        apartmentId,
        title,
        description,
        amount,
        dueDate,
        periodStart,
        periodEnd,
      } = req.body;

      if (
        !apartmentId ||
        !isValidObjectId(apartmentId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid Apartment ID is required.",
        });
      }

      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Service charge amount must be greater than zero.",
        });
      }

      const apartment =
        await Apartment.findById(
          apartmentId
        )
          .populate(
            "tenant",
            "fullName email phone role"
          )
          .populate(
            "property",
            "name address city state landlord"
          );

      if (!apartment) {
        return res.status(404).json({
          success: false,
          message:
            "Apartment not found.",
        });
      }

      if (!apartment.tenant) {
        return res.status(400).json({
          success: false,
          message:
            "This apartment does not have an assigned tenant.",
        });
      }

      let charge =
        await ServiceCharge.findOne({
          apartment: apartment._id,

          status: {
            $ne: "cancelled",
          },
        }).sort({
          createdAt: -1,
        });

      if (charge) {
        charge.title = String(
          title || "Service Charge"
        ).trim();

        charge.description = String(
          description || ""
        ).trim();

        charge.amount =
          numericAmount;

        charge.dueDate =
          dueDate || null;

        charge.periodStart =
          periodStart || null;

        charge.periodEnd =
          periodEnd || null;

        charge.outstandingBalance =
          Math.max(
            0,
            numericAmount -
              safeNumber(
                charge.paidAmount
              )
          );

        if (
          charge.outstandingBalance ===
          0
        ) {
          charge.status = "paid";
        } else {
          charge.status = "pending";
        }
      } else {
        charge =
          new ServiceCharge({
            tenant:
              apartment.tenant._id,

            landlord:
              apartment.property?.landlord,

            property:
              apartment.property?._id,

            apartment:
              apartment._id,

            title: String(
              title ||
                "Service Charge"
            ).trim(),

            description: String(
              description || ""
            ).trim(),

            amount:
              numericAmount,

            paidAmount: 0,

            outstandingBalance:
              numericAmount,

            status: "pending",

            dueDate:
              dueDate || null,

            periodStart:
              periodStart || null,

            periodEnd:
              periodEnd || null,
          });
      }

      await charge.save();

      apartment.serviceCharge =
        numericAmount;

      await apartment.save();

      await createTenantNotification({
        tenantId:
          apartment.tenant._id,

        title:
          "New Service Charge Assigned",

        message: `Management has posted a service charge of ₦${numericAmount.toLocaleString()} for Apartment ${apartment.apartmentNumber}.`,
      });

      return res.status(200).json({
        success: true,

        message:
          "Service charge saved successfully and updated on tenant view.",

        charge,
      });
    } catch (error) {
      console.error(
        "Create/update apartment service charge error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to save service charge.",
      });
    }
  };

/*
====================================================
ADMIN - CONFIRM PAYMENT
Changes status to PAID
====================================================
*/

const confirmPayment = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const adminId =
      req.user?._id ||
      req.user?.id;

    if (
      !isValidObjectId(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid service charge ID.",
      });
    }

    const charge =
      await ServiceCharge.findById(
        id
      );

    if (!charge) {
      return res.status(404).json({
        success: false,
        message:
          "Service charge not found.",
      });
    }

    charge.paidAmount =
      charge.amount;

    charge.outstandingBalance = 0;

    charge.status = "paid";

    if (charge.paymentDetails) {
      charge.paymentDetails.confirmedAt =
        new Date();

      charge.paymentDetails.confirmedBy =
        adminId;
    }

    await charge.save();

    await createTenantNotification({
      tenantId:
        charge.tenant,

      title:
        "Payment Confirmed",

      message: `Your payment for service charge "${charge.title}" has been verified and confirmed by management. Status is now Paid.`,
    });

    return res.status(200).json({
      success: true,

      message:
        "Payment confirmed successfully. Tenant status updated to Paid.",

      charge,
    });
  } catch (error) {
    console.error(
      "Confirm payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to confirm payment.",
    });
  }
};

/*
====================================================
ADMIN - VIEW PAYMENT RECEIPT FILE
====================================================
*/

const getPaymentReceipt = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !isValidObjectId(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID.",
      });
    }

    const charge =
      await ServiceCharge.findById(
        id
      ).select(
        "paymentDetails"
      );

    if (
      !charge ||
      !charge.paymentDetails ||
      !charge.paymentDetails.receiptData
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Receipt attachment not found.",
      });
    }

    res.setHeader(
      "Content-Type",
      charge.paymentDetails
        .contentType ||
        "application/octet-stream"
    );

    return res.send(
      charge.paymentDetails
        .receiptData
    );
  } catch (error) {
    console.error(
      "Get receipt error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load receipt file.",
    });
  }
};

/*
====================================================
ADMIN - DELETE SERVICE CHARGE
====================================================
*/

const deleteServiceCharge =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid service charge ID.",
        });
      }

      const charge =
        await ServiceCharge.findById(
          id
        );

      if (!charge) {
        return res.status(404).json({
          success: false,
          message:
            "Service charge not found.",
        });
      }

      if (
        charge.status === "paid"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A paid service charge cannot be deleted.",
        });
      }

      await ServiceCharge.deleteOne({
        _id: id,
      });

      if (charge.apartment) {
        await Apartment.findByIdAndUpdate(
          charge.apartment,
          {
            $set: {
              serviceCharge: 0,
            },
          }
        );
      }

      await createTenantNotification({
        tenantId:
          charge.tenant,

        title:
          "Service Charge Removed",

        message: `Your service charge "${charge.title}" has been removed by management.`,
      });

      return res.status(200).json({
        success: true,
        message:
          "Service charge deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete service charge error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete service charge.",
      });
    }
  };

module.exports = {
  getAdminApartments,
  getAdminPaymentRecords,
  createOrUpdateApartmentServiceCharge,
  confirmPayment,
  getPaymentReceipt,
  deleteServiceCharge,
};