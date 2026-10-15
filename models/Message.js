const mongoose = require("mongoose");

const tenantMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    senderRole: {
      type: String,
      default: "tenant",
      trim: true,
    },

    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },

    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    status: {
      type: String,
      enum: [
        "sent",
        "read",
        "replied",
      ],
      default: "sent",
    },

    readAt: {
      type: Date,
      default: null,
    },

    replyBody: {
      type: String,
      default: "",
      trim: true,
    },

    repliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "TenantMessage",
  tenantMessageSchema
);