const fs = require("fs");
const path = require("path");

const ServiceCharge = require("../models/ServiceCharge");
const User = require("../models/User");
const TenantNotification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");

const ADMIN_EMAIL =
  process.env.COMPANY_EMAIL ||
  "oceantrialcondoslekki@gmail.com";

const RECEIPT_DIRECTORY = path.join(
  __dirname,
  "../uploads/service-charges"
);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const ensureReceiptDirectory = () => {
  if (!fs.existsSync(RECEIPT_DIRECTORY)) {
    fs.mkdirSync(RECEIPT_DIRECTORY, {
      recursive: true,
    });
  }
};

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const sanitizeFilePart = (value) => {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);
};

const findReceiptFile = async (charge) => {
  ensureReceiptDirectory();

  if (!fs.existsSync(RECEIPT_DIRECTORY)) {
    return null;
  }

  const files = fs
    .readdirSync(RECEIPT_DIRECTORY)
    .filter((name) => {
      return (
        name.includes(
          String(charge._id)
        ) ||
        (
          charge.paymentDetails
            ?.transactionReference &&
          name.includes(
            sanitizeFilePart(
              charge.paymentDetails
                .transactionReference
            )
          )
        )
      );
    });

  if (!files.length) {
    return null;
  }

  /*
   * Use the newest matching file.
   */
  const candidates = files
    .map((name) => {
      const fullPath = path.join(
        RECEIPT_DIRECTORY,
        name
      );

      let modifiedAt = 0;

      try {
        modifiedAt =
          fs.statSync(fullPath).mtimeMs;
      } catch (error) {
        modifiedAt = 0;
      }

      return {
        name,
        fullPath,
        modifiedAt,
      };
    })
    .sort(
      (a, b) =>
        b.modifiedAt -
        a.modifiedAt
    );

  return candidates[0]?.fullPath || null;
};

/*
|--------------------------------------------------------------------------
| TENANT SUBMIT SERVICE CHARGE TRANSFER RECEIPT
|--------------------------------------------------------------------------
|
| POST
| /api/service-charge-payments/notify-transfer
|
| multipart/form-data:
|
| serviceChargeId
| senderName
| senderBank
| transactionReference
| receipt
|
|--------------------------------------------------------------------------
*/

const notifyTransferWithReceipt =
  async (req, res) => {
    let uploadedFilePath = null;

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
            "Service charge ID, sender name, transaction reference and payment receipt are required.",
        });
      }

      uploadedFilePath =
        req.file.path;

      /*
       * Find only a charge belonging to the
       * currently authenticated tenant.
       */
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

      /*
       * Do not allow payment proof against
       * cancelled invoices.
       */
      if (
        charge.status ===
        "cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This service charge has been cancelled.",
        });
      }

      /*
       * Do not allow a second submission for
       * an already paid invoice.
       */
      if (
        charge.status ===
        "paid"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This service charge has already been paid.",
        });
      }

      /*
       * Prevent duplicate submission.
       */
      if (
        charge.status ===
          "pending_verification" &&
        charge.paymentDetails
          ?.transactionReference
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment proof has already been submitted and is awaiting admin verification.",
        });
      }

      const cleanSenderName =
        String(senderName).trim();

      const cleanSenderBank =
        String(
          senderBank || "N/A"
        ).trim();

      const cleanReference =
        String(
          transactionReference
        ).trim();

      if (!cleanSenderName) {
        return res.status(400).json({
          success: false,
          message:
            "Sender name cannot be empty.",
        });
      }

      if (!cleanReference) {
        return res.status(400).json({
          success: false,
          message:
            "Transaction reference cannot be empty.",
        });
      }

      /*
       * Prevent use of the same bank reference
       * on another service charge.
       */
      const duplicate =
        await ServiceCharge.findOne({
          "paymentDetails.transactionReference":
            cleanReference,

          _id: {
            $ne: charge._id,
          },
        });

      if (duplicate) {
        /*
         * Delete the just-uploaded file because
         * the payment submission itself is rejected.
         */
        try {
          if (
            uploadedFilePath &&
            fs.existsSync(
              uploadedFilePath
            )
          ) {
            fs.unlinkSync(
              uploadedFilePath
            );
          }
        } catch (deleteError) {
          console.error(
            "Unable to delete duplicate receipt:",
            deleteError
          );
        }

        return res.status(409).json({
          success: false,
          message:
            "This transaction reference has already been used.",
        });
      }

      ensureReceiptDirectory();

      /*
       * Move the uploaded receipt into a predictable
       * filename so the receipt can be retrieved later.
       */
      const extension =
        path.extname(
          req.file.originalname
        ) || ".bin";

      const safeReference =
        sanitizeFilePart(
          cleanReference
        ) || "receipt";

      const finalFileName =
        `receipt-${charge._id}-${safeReference}-${Date.now()}${extension.toLowerCase()}`;

      const finalPath =
        path.join(
          RECEIPT_DIRECTORY,
          finalFileName
        );

      /*
       * If Multer already stored the file in the
       * same directory, rename it.
       *
       * Otherwise copy it.
       */
      if (
        path.resolve(
          uploadedFilePath
        ) ===
        path.resolve(
          finalPath
        )
      ) {
        // Nothing to do.
      } else {
        fs.renameSync(
          uploadedFilePath,
          finalPath
        );
      }

      uploadedFilePath =
        finalPath;

      /*
       * Save payment information.
       */
      charge.status =
        "pending_verification";

      charge.paymentDetails = {
        senderName:
          cleanSenderName,

        senderBank:
          cleanSenderBank,

        transactionReference:
          cleanReference,

        receiptUrl:
          `/api/service-charge-payments/${charge._id}/receipt`,

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
       * Notify tenant inside dashboard.
       */
      try {
        await TenantNotification.create(
          {
            recipient:
              req.user._id,

            title:
              "Service Charge Payment Submitted",

            message:
              `Your payment proof for ${charge.title} has been submitted and is awaiting admin verification.`,

            type:
              "payment",
          }
        );
      } catch (
        notificationError
      ) {
        console.error(
          "Service charge submission notification error:",
          notificationError
        );
      }

      /*
       * Email the company/admin mailbox.
       */
      try {
        await sendEmail({
          to:
            ADMIN_EMAIL,

          subject:
            `Service Charge Receipt | ${tenant?.fullName || "Tenant"}`,

          replyTo:
            tenant?.email,

          html: `
            <div
              style="
                font-family:Arial,sans-serif;
                max-width:680px;
                margin:auto;
                padding:28px;
                color:#111;
                background:#fff;
              "
            >

              <div
                style="
                  background:#4B4F93;
                  color:#fff;
                  padding:22px;
                  border-radius:12px 12px 0 0;
                "
              >
                <h2 style="margin:0;">
                  Ocean Trail Condominium
                </h2>

                <p style="margin:7px 0 0;">
                  Service Charge Payment Verification
                </p>
              </div>

              <div
                style="
                  border:1px solid #e5e7eb;
                  border-top:0;
                  padding:24px;
                "
              >

                <p>
                  <strong>Tenant:</strong>
                  ${escapeHtml(
                    tenant?.fullName ||
                      "N/A"
                  )}
                </p>

                <p>
                  <strong>Email:</strong>
                  ${escapeHtml(
                    tenant?.email ||
                      "N/A"
                  )}
                </p>

                <p>
                  <strong>Phone:</strong>
                  ${escapeHtml(
                    tenant?.phone ||
                      "N/A"
                  )}
                </p>

                <p>
                  <strong>Charge:</strong>
                  ${escapeHtml(
                    charge.title
                  )}
                </p>

                <p>
                  <strong>Amount:</strong>
                  ₦${Number(
                    charge.amount ||
                      0
                  ).toLocaleString()}
                </p>

                <p>
                  <strong>Sender Name:</strong>
                  ${escapeHtml(
                    cleanSenderName
                  )}
                </p>

                <p>
                  <strong>Sender Bank:</strong>
                  ${escapeHtml(
                    cleanSenderBank
                  )}
                </p>

                <p>
                  <strong>Transaction Reference:</strong>
                  ${escapeHtml(
                    cleanReference
                  )}
                </p>

                <p>
                  The tenant's payment receipt
                  is attached to this email.
                </p>

              </div>
            </div>
          `,

          attachments: [
            {
              filename:
                req.file.originalname,

              path:
                finalPath,

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
          "Payment receipt submitted successfully. The payment is awaiting admin verification.",
        charge,
      });
    } catch (error) {
      console.error(
        "Service charge receipt submission error:",
        error
      );

      /*
       * Remove uploaded file when processing fails
       * before the receipt is committed.
       */
      try {
        if (
          uploadedFilePath &&
          fs.existsSync(
            uploadedFilePath
          )
        ) {
          fs.unlinkSync(
            uploadedFilePath
          );
        }
      } catch (cleanupError) {
        console.error(
          "Receipt cleanup error:",
          cleanupError
        );
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to submit service charge receipt.",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| GET SERVICE CHARGE RECEIPT
|--------------------------------------------------------------------------
|
| GET
| /api/service-charge-payments/:id/receipt
|
| Allowed:
| - Tenant owning the charge
| - Admin
|
|--------------------------------------------------------------------------
*/

const getReceipt = async (
  req,
  res
) => {
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

    const role =
      String(
        req.user?.role || ""
      )
        .trim()
        .toLowerCase();

    const isTenant =
      charge.tenant &&
      charge.tenant
        .toString() ===
        req.user._id.toString();

    const isAdmin =
      role === "admin";

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

    if (
      !charge.paymentDetails
        ?.receiptUrl
    ) {
      return res.status(404).json({
        success: false,
        message:
          "No payment receipt has been submitted for this charge.",
      });
    }

    const receiptPath =
      await findReceiptFile(
        charge
      );

    if (
      !receiptPath ||
      !fs.existsSync(
        receiptPath
      )
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Receipt file not found.",
      });
    }

    return res.sendFile(
      path.resolve(
        receiptPath
      )
    );
  } catch (error) {
    console.error(
      "Get service charge receipt error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to open service charge receipt.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN GET ALL SERVICE CHARGES
|--------------------------------------------------------------------------
|
| GET
| /api/service-charge-payments/admin
|
|--------------------------------------------------------------------------
*/

const getAdminCharges = async (
  req,
  res
) => {
  try {
    const charges =
      await ServiceCharge.find(
        {}
      )
        .populate(
          "tenant",
          "fullName email phone block floor apartment"
        )
        .populate(
          "property",
          "name address landlord"
        )
        .populate(
          "apartment",
          "apartmentNumber block floor tenant"
        )
        .populate(
          "createdBy",
          "fullName email role"
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
      "Get admin service charges error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load service charge approvals.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN CONFIRM SERVICE CHARGE PAYMENT
|--------------------------------------------------------------------------
|
| PATCH
| /api/service-charge-payments/:id/confirm
|
|--------------------------------------------------------------------------
*/

const confirmPayment = async (
  req,
  res
) => {
  try {
    const role =
      String(
        req.user?.role || ""
      )
        .trim()
        .toLowerCase();

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only administrators can confirm service charge payments.",
      });
    }

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
      charge.status ===
      "paid"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This payment has already been confirmed.",
        charge,
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

    if (
      !charge.paymentDetails
        ?.transactionReference
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No transaction reference was submitted for this payment.",
      });
    }

    charge.status =
      "paid";

    charge.paidAt =
      new Date();

    await charge.save();

    /*
     * Notify tenant in dashboard.
     */
    try {
      await TenantNotification.create(
        {
          recipient:
            charge.tenant,

          title:
            "Service Charge Payment Confirmed",

          message:
            `Your payment for ${charge.title} has been verified and marked as Paid.`,

          type:
            "payment",
        }
      );
    } catch (
      notificationError
    ) {
      console.error(
        "Service charge confirmation notification error:",
        notificationError
      );
    }

    /*
     * Email tenant.
     */
    try {
      const tenant =
        await User.findById(
          charge.tenant
        ).select(
          "fullName email"
        );

      if (
        tenant?.email
      ) {
        await sendEmail({
          to:
            tenant.email,

          subject:
            "Ocean Trail Condominium - Service Charge Payment Confirmed",

          html: `
            <div
              style="
                font-family:Arial,sans-serif;
                max-width:650px;
                margin:auto;
                padding:28px;
              "
            >

              <h2
                style="
                  color:#4B4F93;
                "
              >
                Service Charge Payment Confirmed
              </h2>

              <p>
                Hello
                ${escapeHtml(
                  tenant.fullName
                )},
              </p>

              <p>
                Your payment for
                <strong>
                  ${escapeHtml(
                    charge.title
                  )}
                </strong>
                has been verified and marked as
                <strong>PAID</strong>.
              </p>

              <p>
                <strong>Amount:</strong>
                ₦${Number(
                  charge.amount ||
                    0
                ).toLocaleString()}
              </p>

              <p>
                <strong>Transaction Reference:</strong>
                ${escapeHtml(
                  charge
                    .paymentDetails
                    ?.transactionReference ||
                    "N/A"
                )}
              </p>

              <p>
                Thank you.
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

    return res.status(200).json({
      success: true,
      message:
        "Service charge payment confirmed successfully.",
      charge,
    });
  } catch (error) {
    console.error(
      "Confirm service charge payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to confirm service charge payment.",
    });
  }
};

module.exports = {
  notifyTransferWithReceipt,
  getReceipt,
  getAdminCharges,
  confirmPayment,
};