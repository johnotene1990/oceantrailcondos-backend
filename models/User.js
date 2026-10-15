const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ==================================
    // PERSONAL INFORMATION
    // ==================================

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: false, // Optional to prevent 400 validation errors during fast registration/admin creation
      trim: true,
      default: "",
    },

    // ==================================
    // AUTHENTICATION
    // ==================================

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, 
    },


    // ==================================
    // USER ROLE
    // ==================================

    role: {
      type: String,
      enum: [
        "tenant",
        "landlord",
        "property_manager",
        "security",
        "admin",
        "super_admin",
      ],
      default: "tenant",
    },

    // ==================================
    // PROPERTY INFORMATION
    // ==================================

    block: {
      type: String,
      trim: true,
      default: null,
    },

    floor: {
      type: String,
      trim: true,
      default: null,
    },

    apartment: {
      type: String,
      trim: true,
      default: null,
    },

    // ==================================
    // ACCOUNT STATUS
    // ==================================

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpire: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;