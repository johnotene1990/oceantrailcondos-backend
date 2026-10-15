const mongoose = require("mongoose");

const utilityWalletSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "NGN",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UtilityWallet", utilityWalletSchema);