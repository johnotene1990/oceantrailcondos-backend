const fs = require("fs");
const path = require("path");

const ServiceCharge = require("../models/ServiceCharge");
const User = require("../models/User");
const TenantNotification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");

const ADMIN_EMAIL =
  process.env.COMPANY_EMAIL ||
  "oceantrialcondoslekki@gmail.com";

/*
====================================================
TENANT - SUBMIT PAYMENT RECEIPT
====================================================
*/

const notifyTransferWithReceipt =
  async (req, res) => {
    try {
      const {
        serviceChargeId,
        senderName,
        senderBank,
        transactionReference,
      } = req.body;

      if (
        !serviceChargeId ||
        !senderName ||
        !transactionReference ||
        !req.file
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Service charge ID, sender name, transaction reference and receipt are required.",
        });
      }

      const charge =
        await ServiceCharge.findOne({
          _id: serviceChargeId,
          tenant: req.user._id,
        });

      if (!charge) {
        return res.status(404).json({
          success: false,
          message:
            "Service charge invoice not found.",
        });
      }

      if (
        ["paid", "cancelled"].includes(
          String(
            charge.status || ""
          ).toLowerCase()
        )
      ) {
        return res.status(400).json({
          success: false,
          message: `This service charge is already ${charge.status}.`,
        });
      }

      if (
        charge.status ===
        "pending_verification"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment proof has already been submitted and is awaiting admin verification.",
        });
      }

      const reference =
        String(
          transactionReference
        ).trim();

      const duplicate =
        await ServiceCharge.findOne({
          "paymentDetails.transactionReference":
            reference,

          _id: {
            $ne: charge._id,
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "This transaction reference has already been used.",
        });
      }

      charge.status =
        "pending_verification";

      charge.paymentDetails = {
        senderName:
          String(
            senderName
          ).trim(),

        senderBank:
          String(
            senderBank ||
              "N/A"
          ).trim(),

        transactionReference:
          reference,

        receiptUrl:
          `/api/service-charge-payments/${charge._id}/receipt`,

        receiptFileName:
          req.file.originalname,

        receiptContentType:
          req.file.mimetype,

        receiptSize:
          req.file.size,

        submittedAt:
          new Date(),
      };

      await charge.save();

      const tenant =
        await User.findById(
          req.user._id
        ).select(
          "fullName email phone"
        );

      /*
      Send receipt copy to company/admin email.
      */

      try {
        await sendEmail({
          to: ADMIN_EMAIL,

          subject:
            `Service Charge Receipt | ${tenant.fullName}`,

          replyTo:
            tenant.email,

          html: `
            <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;padding:28px">
              <h2 style="color:#4B4F93">
                Ocean Trail Condominium
              </h2>

              <h3>
                Service Charge Payment Receipt
              </h3>

              <p>
                <strong>Tenant:</strong>
                ${tenant.fullName}
              </p>

              <p>
                <strong>Email:</strong>
                ${tenant.email}
              </p>

              <p>
                <strong>Charge:</strong>
                ${charge.title}
              </p>

              <p>
                <strong>Amount:</strong>
                ₦${Number(
                  charge.amount || 0
                ).toLocaleString()}
              </p>

              <p>
                <strong>Reference:</strong>
                ${reference}
              </p>

              <p>
                The tenant's payment receipt
                is attached to this email.
              </p>
            </div>
          `,

          attachments: [
            {
              filename:
                req.file.originalname,

              path:
                req.file.path,

              contentType:
                req.file.mimetype,
            },
          ],
        });
      } catch (emailError) {
        console.error(
          "Service charge receipt email failed:",
          emailError
        );
      }

      return res.status(200).json({
        success: true,

        message:
          "Payment receipt submitted successfully. Awaiting admin confirmation.",

        charge,
      });
    } catch (error) {
      console.error(
        "Service charge receipt submission error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to submit service charge receipt.",
      });
    }
  };

/*
====================================================
VIEW RECEIPT
====================================================
*/

const getReceipt =
  async (req, res) => {
    try {
      const charge =
        await ServiceCharge.findById(
          req.params.id
        );

      if (
        !charge ||
        !charge.paymentDetails
          ?.receiptUrl
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Receipt not found.",
        });
      }

      const role =
        String(
          req.user?.role || ""
        ).toLowerCase();

      const isTenant =
        charge.tenant &&
        String(
          charge.tenant
        ) ===
          String(
            req.user._id
          );

      const isAdmin =
        role === "admin" ||
        role === "super_admin";

      if (
        !isTenant &&
        !isAdmin
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      const directory =
        path.join(
          __dirname,
          "../uploads/service-charges"
        );

      if (
        !fs.existsSync(
          directory
        )
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Receipt file not found.",
        });
      }

      const reference =
        String(
          charge.paymentDetails
            .transactionReference ||
            ""
        ).replace(
          /[^a-zA-Z0-9_-]/g,
          ""
        );

      const candidate =
        fs.readdirSync(
          directory
        ).find(
          (name) =>
            name.includes(
              String(
                charge._id
              )
            ) ||
            name.includes(
              reference
            )
        );

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message:
            "Receipt file not found.",
        });
      }

      const filePath =
        path.resolve(
          directory,
          candidate
        );

      res.setHeader(
        "Cache-Control",
        "private, no-store"
      );

      return res.sendFile(
        filePath
      );
    } catch (error) {
      console.error(
        "Get service charge receipt error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to open receipt.",
      });
    }
  };

/*
====================================================
ADMIN - GET PAYMENT RECORDS
====================================================
*/

const getAdminCharges =
  async (req, res) => {
    try {
      const charges =
        await ServiceCharge.find({})
          .populate(
            "tenant",
            "fullName email phone"
          )
          .populate(
            "property",
            "name address city state"
          )
          .populate(
            "apartment",
            "apartmentNumber block floor apartmentType"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        charges,
      });
    } catch (error) {
      console.error(
        "Get admin service charge payments error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load service charge payment records.",
      });
    }
  };

/*
====================================================
ADMIN - CONFIRM PAYMENT
====================================================
*/

const confirmPayment =
  async (req, res) => {
    try {
      const charge =
        await ServiceCharge.findById(
          req.params.id
        );

      if (!charge) {
        return res.status(404).json({
          success: false,
          message:
            "Service charge not found.",
        });
      }

      if (
        charge.status !==
        "pending_verification"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This service charge is not awaiting payment verification.",
        });
      }

      /*
      Full payment confirmation.
      */

      const amount =
        Number(
          charge.amount || 0
        );

      charge.paidAmount =
        amount;

      charge.outstandingBalance =
        0;

      charge.status =
        "paid";

      charge.paidAt =
        new Date();

      charge.paymentDetails = {
        ...(charge.paymentDetails ||
          {}),

        verifiedAt:
          new Date(),

        verifiedBy:
          req.user._id,
      };

      await charge.save();

      /*
      Notify tenant inside MongoDB.
      */

      try {
        await TenantNotification.create({
          recipient:
            charge.tenant,

          title:
            "Service Charge Payment Confirmed",

          message:
            `Your payment for ${charge.title} has been verified and marked as Paid.`,

          type: "payment",
        });
      } catch (notificationError) {
        console.error(
          "Service charge notification error:",
          notificationError
        );
      }

      /*
      Send confirmation email to tenant.
      */

      try {
        const tenant =
          await User.findById(
            charge.tenant
          ).select(
            "fullName email"
          );

        if (tenant?.email) {
          await sendEmail({
            to: tenant.email,

            subject:
              "Ocean Trail Condominium - Service Charge Payment Confirmed",

            html: `
              <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:28px">

                <h2 style="color:#4B4F93">
                  Payment Confirmed
                </h2>

                <p>
                  Hello ${tenant.fullName},
                </p>

                <p>
                  Your payment for
                  <strong>
                    ${charge.title}
                  </strong>
                  has been verified and marked as
                  <strong>PAID</strong>.
                </p>

                <p>
                  Amount:
                  <strong>
                    ₦${amount.toLocaleString()}
                  </strong>
                </p>

                <p>
                  Reference:
                  <strong>
                    ${
                      charge.paymentDetails
                        ?.transactionReference ||
                      "N/A"
                    }
                  </strong>
                </p>

              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error(
          "Tenant payment confirmation email error:",
          emailError
        );
      }

      const populated =
        await ServiceCharge.findById(
          charge._id
        )
          .populate(
            "tenant",
            "fullName email phone"
          )
          .populate(
            "property",
            "name address city state"
          )
          .populate(
            "apartment",
            "apartmentNumber block floor apartmentType"
          );

      return res.status(200).json({
        success: true,

        message:
          "Payment confirmed successfully. The tenant's service charge is now Paid.",

        charge:
          populated,
      });
    } catch (error) {
      console.error(
        "Confirm service charge payment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to confirm payment.",
      });
    }
  };

module.exports = {
  notifyTransferWithReceipt,
  getReceipt,
  getAdminCharges,
  confirmPayment,
};