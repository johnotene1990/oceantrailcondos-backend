const mongoose = require("mongoose");

const tenantNotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "general",
        "payment",
        "maintenance",
        "complaint",
        "renewal",
        "visitor",
        "utility",
        "message",
        "system",
      ],
      default: "general",
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

tenantNotificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "TenantNotification",
  tenantNotificationSchema
);