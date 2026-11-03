// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const crypto = require("crypto");

// const User = require("../models/User");
// const sendEmail = require("../utils/sendEmail");

// // ==========================================
// // CREATE JWT
// // ==========================================

// const generateToken = (userId) => {
//   return jwt.sign(
//     {
//       id: userId,
//     },
//     process.env.JWT_SECRET,
//     {
//       expiresIn: "7d",
//     }
//   );
// };

// // ==========================================
// // COOKIE OPTIONS
// // ==========================================

// const cookieOptions = {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite:
//     process.env.NODE_ENV === "production"
//       ? "none"
//       : "lax",
//   maxAge: 7 * 24 * 60 * 60 * 1000,
// };

// // ==========================================
// // REGISTER USER
// // ==========================================

// const registerUser = async (req, res) => {
//   try {
//     const {
//       fullName,
//       email,
//       phone,
//       password,
//       role,
//       accountType,
//     } = req.body;

//     // ========================================
//     // VALIDATION
//     // ========================================

//     if (!fullName || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Please provide full name, email, and password.",
//       });
//     }

//     // ========================================
//     // PASSWORD
//     // ========================================

//     if (password.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Password must be at least 6 characters.",
//       });
//     }

//     // ========================================
//     // ROLE / ACCOUNT TYPE
//     // ========================================

//     const requestedRole =
//       role || accountType || "tenant";

//     const allowedRoles = [
//       "tenant",
//       "landlord",
//       "property_manager",
//       "security",
//       "admin",
//       "super_admin",
//     ];

//     if (!allowedRoles.includes(requestedRole)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid account type.",
//       });
//     }

//     // ========================================
//     // NORMALIZE EMAIL
//     // ========================================

//     const normalizedEmail = String(email)
//       .trim()
//       .toLowerCase();

//     // ========================================
//     // CHECK EXISTING USER
//     // ========================================

//     const existingUser = await User.findOne({
//       email: normalizedEmail,
//     });

//     if (existingUser) {
//       return res.status(409).json({
//         success: false,
//         message:
//           "An account with this email already exists.",
//       });
//     }

//     // ========================================
//     // HASH PASSWORD
//     // ========================================

//     const salt = await bcrypt.genSalt(10);

//     const hashedPassword = await bcrypt.hash(
//       password,
//       salt
//     );

//     // ========================================
//     // CREATE USER
//     // ========================================

//     const user = await User.create({
//       fullName: fullName.trim(),
//       email: normalizedEmail,
//       phone: phone ? String(phone).trim() : "",
//       password: hashedPassword,
//       role: requestedRole,

//       // Optional property fields
//       block: null,
//       floor: null,
//       apartment: null,

//       isActive: true,
//     });

//     // ========================================
//     // GENERATE TOKEN
//     // ========================================

//     const token = generateToken(user._id);

//     // ========================================
//     // LOGIN USER IMMEDIATELY
//     // ========================================

//     res.cookie(
//       "token",
//       token,
//       cookieOptions
//     );

//     // ========================================
//     // WELCOME EMAIL
//     // ========================================

//     const welcomeEmail = `
//       <div style="
//         font-family: Arial, sans-serif;
//         max-width: 650px;
//         margin: auto;
//         padding: 30px;
//         color: #000;
//       ">

//         <h2 style="color: #4B4F93;">
//           Ocean Trail Condominium
//         </h2>

//         <h3>
//           Welcome, ${user.fullName}
//         </h3>

//         <p>
//           Your Ocean Trail Condominium account has been successfully created.
//         </p>

//         <div style="
//           background: #f5f5f5;
//           padding: 20px;
//           border-radius: 8px;
//           margin: 25px 0;
//         ">

//           <p>
//             <strong>Name:</strong>
//             ${user.fullName}
//           </p>

//           <p>
//             <strong>Email:</strong>
//             ${user.email}
//           </p>

//           <p>
//             <strong>Phone:</strong>
//             ${user.phone || "N/A"}
//           </p>

//           <p>
//             <strong>Account Type:</strong>
//             ${user.role}
//           </p>

//         </div>

//         <p>
//           You can now sign in to access your Ocean Trail account.
//         </p>

//         <hr style="margin: 30px 0;" />

//         <p style="font-size: 13px; color: #555;">
//           Ocean Trail Condominium<br />
//           Property Management
//         </p>

//       </div>
//     `;

//     // ========================================
//     // ADMIN EMAIL
//     // ========================================

//     const adminEmail = `
//       <div style="
//         font-family: Arial, sans-serif;
//         max-width: 700px;
//         margin: auto;
//         padding: 30px;
//         color: #000;
//       ">

//         <h2 style="color: #4B4F93;">
//           Ocean Trail Condominium
//         </h2>

//         <h3>
//           New ${user.role.toUpperCase()} Registration
//         </h3>

//         <p>
//           A new ${user.role} has registered on the Ocean Trail platform.
//         </p>

//         <div style="
//           background: #f5f5f5;
//           padding: 20px;
//           border-radius: 8px;
//           margin-top: 20px;
//         ">

//           <p>
//             <strong>Full Name:</strong>
//             ${user.fullName}
//           </p>

//           <p>
//             <strong>Email:</strong>
//             ${user.email}
//           </p>

//           <p>
//             <strong>Phone:</strong>
//             ${user.phone || "N/A"}
//           </p>

//           <p>
//             <strong>Account Type:</strong>
//             ${user.role}
//           </p>

//           <p>
//             <strong>Registration Date:</strong>
//             ${new Date().toLocaleString()}
//           </p>

//         </div>

//       </div>
//     `;

//     // ========================================
//     // EMAILS IN BACKGROUND
//     // ========================================

//     Promise.all([
//       sendEmail({
//         to: user.email,
//         subject:
//           "Welcome to Ocean Trail Condominium",
//         html: welcomeEmail,
//       }),

//       sendEmail({
//         to: process.env.COMPANY_EMAIL,
//         subject:
//           `New ${user.role.toUpperCase()} Registration - ${user.fullName}`,
//         html: adminEmail,
//         replyTo: user.email,
//       }),
//     ])
//       .then(() => {
//         console.log(
//           `Registration emails sent for ${user.email}`
//         );
//       })
//       .catch((emailError) => {
//         console.error(
//           "Registration email error:",
//           emailError
//         );
//       });

//     // ========================================
//     // RESPONSE
//     // ========================================

//     return res.status(201).json({
//       success: true,
//       message: "Account created successfully.",
//       user: {
//         id: user._id,
//         fullName: user.fullName,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         block: user.block,
//         floor: user.floor,
//         apartment: user.apartment,
//         isActive: user.isActive,
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Register error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Server error while creating account.",
//     });
//   }
// };

// // ==========================================
// // LOGIN
// // ==========================================

// const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // ========================================
//     // VALIDATION
//     // ========================================

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Email and password are required.",
//       });
//     }

//     // ========================================
//     // NORMALIZE EMAIL
//     // ========================================

//     const normalizedEmail = String(email)
//       .trim()
//       .toLowerCase();

//     // ========================================
//     // FIND USER
//     // ========================================

//     const user = await User.findOne({
//       email: normalizedEmail,
//     }).select("+password");

//     // ========================================
//     // ACCOUNT NOT REGISTERED
//     // ========================================

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "No account is registered with this email address. Please create an account first.",
//         code: "ACCOUNT_NOT_REGISTERED",
//       });
//     }

//     // ========================================
//     // ACCOUNT DEACTIVATED
//     // ========================================

//     if (!user.isActive) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "Your account has been deactivated. Please contact management.",
//         code: "ACCOUNT_DEACTIVATED",
//       });
//     }

//     // ========================================
//     // CHECK PASSWORD
//     // ========================================

//     const passwordMatch =
//       await bcrypt.compare(
//         password,
//         user.password
//       );

//     // ========================================
//     // WRONG PASSWORD
//     // ========================================

//     if (!passwordMatch) {
//       return res.status(401).json({
//         success: false,
//         message:
//           "The password you entered is incorrect. Please try again or use Forgot Password.",
//         code: "INCORRECT_PASSWORD",
//       });
//     }

//     // ========================================
//     // GENERATE TOKEN
//     // ========================================

//     const token = generateToken(user._id);

//     // ========================================
//     // SET AUTH COOKIE
//     // ========================================

//     res.cookie(
//       "token",
//       token,
//       cookieOptions
//     );

//     // ========================================
//     // SUCCESS RESPONSE
//     // ========================================

//     return res.status(200).json({
//       success: true,
//       message: "Login successful.",
//       user: {
//         id: user._id,
//         fullName: user.fullName,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         block: user.block,
//         floor: user.floor,
//         apartment: user.apartment,
//         isActive: user.isActive,
//         isVerified: user.isVerified,
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Login error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Server error while logging in.",
//     });
//   }
// };

// // ==========================================
// // LOGOUT
// // ==========================================

// const logoutUser = async (req, res) => {
//   try {
//     res.clearCookie("token", {
//       httpOnly: true,
//       secure:
//         process.env.NODE_ENV === "production",
//       sameSite:
//         process.env.NODE_ENV === "production"
//           ? "none"
//           : "lax",
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Logged out successfully.",
//     });
//   } catch (error) {
//     console.error(
//       "Logout error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Server error while logging out.",
//     });
//   }
// };

// // ==========================================
// // CURRENT USER
// // ==========================================

// const getMe = async (req, res) => {
//   try {
//     const userId =
//       req.user._id || req.user.id;

//     const user = await User.findById(
//       userId
//     ).select("-password");

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       user: {
//         id: user._id,
//         fullName: user.fullName,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         block: user.block,
//         floor: user.floor,
//         apartment: user.apartment,
//         isActive: user.isActive,
//         isVerified: user.isVerified,
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Get user error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to retrieve user information.",
//     });
//   }
// };

// // ==========================================
// // GET USER PROFILE
// // ==========================================

// const getProfile = async (req, res) => {
//   try {
//     const userId =
//       req.user._id || req.user.id;

//     const user = await User.findById(
//       userId
//     ).select("-password");

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Profile not found.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       user: {
//         id: user._id,
//         fullName: user.fullName,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         block: user.block,
//         floor: user.floor,
//         apartment: user.apartment,
//         isActive: user.isActive,
//         isVerified: user.isVerified,
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Get profile error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Server error while fetching profile.",
//     });
//   }
// };

// // ==========================================
// // UPDATE USER PROFILE
// // ==========================================

// const updateProfile = async (req, res) => {
//   try {
//     const userId =
//       req.user._id || req.user.id;

//     const {
//       fullName,
//       phone,
//     } = req.body;

//     const user = await User.findById(
//       userId
//     );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found.",
//       });
//     }

//     if (fullName) {
//       user.fullName =
//         fullName.trim();
//     }

//     if (phone !== undefined) {
//       user.phone = phone.trim();
//     }

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message:
//         "Profile updated successfully.",
//       user: {
//         id: user._id,
//         fullName: user.fullName,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         block: user.block,
//         floor: user.floor,
//         apartment: user.apartment,
//         isActive: user.isActive,
//         isVerified: user.isVerified,
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Update profile error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Server error while updating profile.",
//     });
//   }
// };

// // ==========================================
// // FORGOT PASSWORD
// // ==========================================

// // const forgotPassword = async (req, res) => {
// //   try {
// //     const { email } = req.body;

// //     if (!email) {
// //       return res.status(400).json({
// //         success: false,
// //         message:
// //           "Please provide your email address.",
// //       });
// //     }

// //     const normalizedEmail = String(email)
// //       .trim()
// //       .toLowerCase();

// //     const user = await User.findOne({
// //       email: normalizedEmail,
// //     });

// //     if (!user) {
// //       return res.status(200).json({
// //         success: true,
// //         message:
// //           "If an account exists with this email, a password reset link has been sent.",
// //       });
// //     }

// //     const resetToken =
// //       crypto.randomBytes(32).toString("hex");

// //     const hashedToken =
// //       crypto
// //         .createHash("sha256")
// //         .update(resetToken)
// //         .digest("hex");

// //     user.resetPasswordToken = hashedToken;
// //     user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

// //     await user.save({
// //       validateBeforeSave: false,
// //     });

// //     const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
// //     const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

// //     const html = `
// //       <div style="
// //         font-family: Arial, sans-serif;
// //         max-width: 600px;
// //         margin: auto;
// //         padding: 30px;
// //       ">

// //         <h2 style="color:#4B4F93;">
// //           Ocean Trail Condominium
// //         </h2>

// //         <p>
// //           Hello ${user.fullName},
// //         </p>

// //         <p>
// //           We received a request to reset your Ocean Trail account password.
// //         </p>

// //         <div style="margin:30px 0;">

// //           <a
// //             href="${resetUrl}"
// //             style="
// //               background:#4B4F93;
// //               color:white;
// //               padding:14px 25px;
// //               text-decoration:none;
// //               border-radius:6px;
// //               display:inline-block;
// //             "
// //           >
// //             Reset Password
// //           </a>

// //         </div>

// //         <p>
// //           This link will expire in <strong>15 minutes</strong>.
// //         </p>

// //         <p>
// //           If you did not request this password reset, you can safely ignore this email.
// //         </p>

// //       </div>
// //     `;

// //     try {
// //       await sendEmail({
// //         to: user.email,
// //         subject:
// //           "Ocean Trail Condominium - Password Reset",
// //         html,
// //       });

// //       return res.status(200).json({
// //         success: true,
// //         message:
// //           "If an account exists with this email, a password reset link has been sent.",
// //         testResetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined
// //       });
// //     } catch (emailError) {
// //       user.resetPasswordToken = null;
// //       user.resetPasswordExpire = null;

// //       await user.save({
// //         validateBeforeSave: false,
// //       });

// //       throw emailError;
// //     }
// //   } catch (error) {
// //     console.error(
// //       "Forgot password error:",
// //       error
// //     );

// //     return res.status(500).json({
// //       success: false,
// //       message:
// //         "Unable to process password reset request.",
// //     });
// //   }
// // };




// // ==========================================
// // FORGOT PASSWORD
// // ==========================================

// const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide your email address.",
//       });
//     }

//     const normalizedEmail = String(email).trim().toLowerCase();

//     const user = await User.findOne({
//       email: normalizedEmail,
//     });

//     if (!user) {
//       return res.status(200).json({
//         success: true,
//         message: "If an account exists with this email, a password reset link has been sent.",
//       });
//     }

//     const resetToken = crypto.randomBytes(32).toString("hex");

//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(resetToken)
//       .digest("hex");

//     user.resetPasswordToken = hashedToken;
//     user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

//     await user.save({
//       validateBeforeSave: false,
//     });

//     const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
//     const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

//     // Always log the reset link to the server terminal for instant development & testing
//     console.log(`\n========================================`);
//     console.log(`PASSWORD RESET LINK FOR: ${user.email}`);
//     console.log(resetUrl);
//     console.log(`========================================\n`);

//     const html = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px;">
//         <h2 style="color:#4B4F93;">Ocean Trail Condominium</h2>
//         <p>Hello ${user.fullName},</p>
//         <p>We received a request to reset your Ocean Trail account password.</p>
//         <div style="margin:30px 0;">
//           <a href="${resetUrl}" style="background:#4B4F93; color:white; padding:14px 25px; text-decoration:none; border-radius:6px; display:inline-block;">
//             Reset Password
//           </a>
//         </div>
//         <p>This link will expire in <strong>15 minutes</strong>.</p>
//         <p>If you did not request this password reset, you can safely ignore this email.</p>
//       </div>
//     `;

//     // Attempt to send email, but do not crash the request if SMTP fails
//     try {
//       if (typeof sendEmail === "function") {
//         await sendEmail({
//           to: user.email,
//           subject: "Ocean Trail Condominium - Password Reset",
//           html,
//         });
//       }
//     } catch (emailError) {
//       console.warn("SMTP email dispatch skipped/failed, but reset token generated successfully:", emailError.message);
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Password reset link generated successfully.",
//       testResetUrl: resetUrl // Returned securely so you can test it directly from the UI
//     });

//   } catch (error) {
//     console.error("Forgot password error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Unable to process password reset request.",
//     });
//   }
// };

// // ==========================================
// // RESET PASSWORD
// // ==========================================

// const resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     if (!password) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Please provide a new password.",
//       });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Password must be at least 6 characters.",
//       });
//     }

//     const hashedToken =
//       crypto
//         .createHash("sha256")
//         .update(token)
//         .digest("hex");

//     const user = await User.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpire: {
//         $gt: Date.now(),
//       },
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Password reset link is invalid or has expired.",
//       });
//     }

//     const salt = await bcrypt.genSalt(10);

//     user.password = await bcrypt.hash(
//       password,
//       salt
//     );

//     user.resetPasswordToken = null;
//     user.resetPasswordExpire = null;

//     await user.save();

//     const loginToken = generateToken(user._id);

//     res.cookie(
//       "token",
//       loginToken,
//       cookieOptions
//     );

//     return res.status(200).json({
//       success: true,
//       message:
//         "Password reset successfully.",
//       user: {
//         id: user._id,
//         fullName: user.fullName,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Reset password error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to reset password.",
//     });
//   }
// };

// // ==========================================
// // EXPORT
// // ==========================================

// module.exports = {
//   registerUser,
//   loginUser,
//   logoutUser,
//   getMe,
//   getProfile,
//   updateProfile,
//   forgotPassword,
//   resetPassword,
// };



const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// ==========================================
// CREATE JWT
// ==========================================

const generateToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ==========================================
// COOKIE OPTIONS
// ==========================================

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? "none"
      : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ==========================================
// REGISTER USER
// ==========================================

const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      role,
      accountType,
    } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide full name, email, and password.",
      });
    }

    // ========================================
    // PASSWORD
    // ========================================

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    // ========================================
    // ROLE / ACCOUNT TYPE
    // ========================================

    const requestedRole =
      role || accountType || "tenant";

    const allowedRoles = [
      "tenant",
      "landlord",
      "property_manager",
      "security",
      "admin",
      "super_admin",
    ];

    if (!allowedRoles.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account type.",
      });
    }

    // ========================================
    // NORMALIZE EMAIL
    // ========================================

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    // ========================================
    // CHECK EXISTING USER
    // ========================================

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    // ========================================
    // HASH PASSWORD
    // ========================================

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    // ========================================
    // CREATE USER
    // ========================================

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : "",
      password: hashedPassword,
      role: requestedRole,

      // Optional property fields
      block: null,
      floor: null,
      apartment: null,

      isActive: true,
    });

    // ========================================
    // SIGN-IN URL FOR CLIENT EMAIL
    // ========================================

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const signInUrl = `${clientUrl}/login?role=${user.role}`;

    // ========================================
    // WELCOME EMAIL WITH SIGN-IN LINK
    // ========================================

    const welcomeEmail = `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 650px;
        margin: auto;
        padding: 30px;
        color: #000;
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
      ">

        <h2 style="color: #4B4F93; margin-top: 0;">
          Ocean Trail Condominium
        </h2>

        <h3>
          Welcome, ${user.fullName}!
        </h3>

        <p>
          Your Ocean Trail Condominium account has been successfully created. You can now sign in to your portal to manage your property services and communications.
        </p>

        <div style="
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        ">

          <p style="margin: 5px 0;">
            <strong>Name:</strong>
            ${user.fullName}
          </p>

          <p style="margin: 5px 0;">
            <strong>Email:</strong>
            ${user.email}
          </p>

          <p style="margin: 5px 0;">
            <strong>Phone:</strong>
            ${user.phone || "N/A"}
          </p>

          <p style="margin: 5px 0;">
            <strong>Account Type:</strong>
            ${user.role}
          </p>

        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a
            href="${signInUrl}"
            style="
              background-color: #4B4F93;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              display: inline-block;
            "
          >
            Sign In to Your Account
          </a>
        </div>

        <p style="font-size: 13px; color: #555; word-break: break-all;">
          If the button above doesn't work, copy and paste this link into your browser:<br />
          <a href="${signInUrl}" style="color: #4B4F93;">${signInUrl}</a>
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;" />

        <p style="font-size: 12px; color: #777;">
          Ocean Trail Condominium<br />
          2 Prince Babatunde Oloto Street, Off Mayor Bolaji Ariyo Street, Bevera Estate, Ilasan, Lekki, Lagos State.
        </p>

      </div>
    `;

    // ========================================
    // ADMIN EMAIL
    // ========================================

    const adminEmail = `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 700px;
        margin: auto;
        padding: 30px;
        color: #000;
      ">

        <h2 style="color: #4B4F93;">
          Ocean Trail Condominium
        </h2>

        <h3>
          New ${user.role.toUpperCase()} Registration
        </h3>

        <p>
          A new ${user.role} has registered on the Ocean Trail platform.
        </p>

        <div style="
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        ">

          <p>
            <strong>Full Name:</strong>
            ${user.fullName}
          </p>

          <p>
            <strong>Email:</strong>
            ${user.email}
          </p>

          <p>
            <strong>Phone:</strong>
            ${user.phone || "N/A"}
          </p>

          <p>
            <strong>Account Type:</strong>
            ${user.role}
          </p>

          <p>
            <strong>Registration Date:</strong>
            ${new Date().toLocaleString()}
          </p>

        </div>

      </div>
    `;

    // ========================================
    // EMAILS IN BACKGROUND
    // ========================================

    Promise.all([
      sendEmail({
        to: user.email,
        subject:
          "Welcome to Ocean Trail Condominium - Sign In",
        html: welcomeEmail,
      }),

      process.env.COMPANY_EMAIL ? sendEmail({
        to: process.env.COMPANY_EMAIL,
        subject:
          `New ${user.role.toUpperCase()} Registration - ${user.fullName}`,
        html: adminEmail,
        replyTo: user.email,
      }) : Promise.resolve(),
    ])
      .then(() => {
        console.log(
          `Registration emails sent for ${user.email}`
        );
      })
      .catch((emailError) => {
        console.error(
          "Registration email error:",
          emailError.message
        );
      });

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,
      message: "Your Ocean Trail Condominium account has been successfully created. Kindly check your email to sign in.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        block: user.block,
        floor: user.floor,
        apartment: user.apartment,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating account.",
    });
  }
};

// ==========================================
// LOGIN
// ==========================================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    // ========================================
    // NORMALIZE EMAIL
    // ========================================

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    // ========================================
    // FIND USER
    // ========================================

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    // ========================================
    // ACCOUNT NOT REGISTERED
    // ========================================

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account is registered with this email address. Please create an account first.",
        code: "ACCOUNT_NOT_REGISTERED",
      });
    }

    // ========================================
    // ACCOUNT DEACTIVATED
    // ========================================

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Please contact management.",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    // ========================================
    // CHECK PASSWORD
    // ========================================

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    // ========================================
    // WRONG PASSWORD
    // ========================================

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "The password you entered is incorrect. Please try again or use Forgot Password.",
        code: "INCORRECT_PASSWORD",
      });
    }

    // ========================================
    // GENERATE TOKEN
    // ========================================

    const token = generateToken(user._id);

    // ========================================
    // SET AUTH COOKIE
    // ========================================

    res.cookie(
      "token",
      token,
      cookieOptions
    );

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        block: user.block,
        floor: user.floor,
        apartment: user.apartment,
        isActive: user.isActive,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while logging in.",
    });
  }
};

// ==========================================
// LOGOUT
// ==========================================

const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error(
      "Logout error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while logging out.",
    });
  }
};

// ==========================================
// CURRENT USER
// ==========================================

const getMe = async (req, res) => {
  try {
    const userId =
      req.user._id || req.user.id;

    const user = await User.findById(
      userId
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        block: user.block,
        floor: user.floor,
        apartment: user.apartment,
        isActive: user.isActive,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error(
      "Get user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve user information.",
    });
  }
};

// ==========================================
// GET USER PROFILE
// ==========================================

const getProfile = async (req, res) => {
  try {
    const userId =
      req.user._id || req.user.id;

    const user = await User.findById(
      userId
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        block: user.block,
        floor: user.floor,
        apartment: user.apartment,
        isActive: user.isActive,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching profile.",
    });
  }
};

// ==========================================
// UPDATE USER PROFILE
// ==========================================

const updateProfile = async (req, res) => {
  try {
    const userId =
      req.user._id || req.user.id;

    const {
      fullName,
      phone,
    } = req.body;

    const user = await User.findById(
      userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (fullName) {
      user.fullName =
        fullName.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        block: user.block,
        floor: user.floor,
        apartment: user.apartment,
        isActive: user.isActive,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating profile.",
    });
  }
};

// ==========================================
// FORGOT PASSWORD
// ==========================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save({
      validateBeforeSave: false,
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    console.log(`\n========================================`);
    console.log(`PASSWORD RESET LINK FOR: ${user.email}`);
    console.log(resetUrl);
    console.log(`========================================\n`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px;">
        <h2 style="color:#4B4F93;">Ocean Trail Condominium</h2>
        <p>Hello ${user.fullName},</p>
        <p>We received a request to reset your Ocean Trail account password.</p>
        <div style="margin:30px 0;">
          <a href="${resetUrl}" style="background:#4B4F93; color:white; padding:14px 25px; text-decoration:none; border-radius:6px; display:inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in <strong>15 minutes</strong>.</p>
        <p>If you did not request this password reset, you can safely ignore this email.</p>
      </div>
    `;

    try {
      if (typeof sendEmail === "function") {
        await sendEmail({
          to: user.email,
          subject: "Ocean Trail Condominium - Password Reset",
          html,
        });
      }
    } catch (emailError) {
      console.warn("SMTP email dispatch skipped/failed, but reset token generated successfully:", emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Password reset link generated successfully.",
      testResetUrl: resetUrl
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request.",
    });
  }
};

// ==========================================
// RESET PASSWORD
// ==========================================

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a new password.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    const hashedToken =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset link is invalid or has expired.",
      });
    }

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(
      password,
      salt
    );

    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    const loginToken = generateToken(user._id);

    res.cookie(
      "token",
      loginToken,
      cookieOptions
    );

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset password.",
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
};