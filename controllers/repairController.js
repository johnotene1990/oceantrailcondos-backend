// const mongoose = require("mongoose");

// const RepairRequest = require("../models/RepairRequest");
// const Apartment = require("../models/Apartment");
// const User = require("../models/User");
// const TenantNotification = require("../models/Notification");
// const sendEmail = require("../utils/sendEmail");

// // ==========================================
// // CONSTANTS
// // ==========================================

// const ADMIN_EMAIL =
//   process.env.COMPANY_EMAIL ||
//   "oceantrialcondoslekki@gmail.com";

// // ==========================================
// // HELPER
// // ==========================================

// const allowedStatuses = [
//   "Pending",
//   "Assigned",
//   "In Progress",
//   "Completed",
//   "Cancelled",
// ];

// // ==========================================
// // CREATE REPAIR REQUEST
// // ==========================================

// const createRepairRequest = async (req, res) => {
//   try {
//     // ==========================================
//     // IMPORTANT
//     // ==========================================
//     //
//     // Because repairRoutes.js now uses Multer,
//     // req.body correctly contains the FormData fields.
//     //
//     // ==========================================

//     const {
//       title,
//       category,
//       description,
//       priority,
//     } = req.body || {};

//     // ==========================================
//     // VALIDATION
//     // ==========================================

//     if (
//       typeof title !== "string" ||
//       !title.trim()
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Repair title is required.",
//       });
//     }

//     if (
//       typeof description !== "string" ||
//       !description.trim()
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Repair description is required.",
//       });
//     }

//     // ==========================================
//     // GET CURRENT TENANT
//     // ==========================================

//     const tenant = await User.findById(
//       req.user._id
//     ).select(
//       "fullName email phone role block floor apartment"
//     );

//     if (!tenant) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Tenant account could not be found.",
//       });
//     }

//     // ==========================================
//     // OPTIONAL APARTMENT LOOKUP
//     // ==========================================
//     //
//     // Your admin property records currently use
//     // localStorage, so we MUST NOT require an
//     // Apartment MongoDB document before accepting
//     // a repair request.
//     //
//     // If a backend Apartment exists and is already
//     // assigned to this tenant, we use it.
//     //
//     // If it does not exist, the repair request can
//     // still be created using the tenant account.
//     // ==========================================

//     let apartment = null;
//     let property = null;
//     let landlordId = null;

//     try {
//       apartment =
//         await Apartment.findOne({
//           tenant: req.user._id,
//         }).populate(
//           "property",
//           "name address city state landlord"
//         );

//       if (
//         apartment &&
//         apartment.property
//       ) {
//         property =
//           apartment.property;

//         landlordId =
//           property.landlord || null;
//       }
//     } catch (apartmentError) {
//       // ==========================================
//       // DO NOT FAIL THE REPAIR REQUEST
//       //
//       // A repair request should still be accepted
//       // even if the optional apartment lookup fails.
//       // ==========================================

//       console.error(
//         "Optional apartment lookup error:",
//         apartmentError
//       );
//     }

//     // ==========================================
//     // CREATE REPAIR REQUEST
//     // ==========================================

//     const repairData = {
//       tenant: tenant._id,

//       // landlord/property/apartment are now optional
//       // because the admin portal can manage repair
//       // requests independently of the localStorage
//       // property records.

//       landlord: landlordId || undefined,

//       property:
//         property?._id || undefined,

//       apartment:
//         apartment?._id || undefined,

//       title: title.trim(),

//       category:
//         typeof category === "string" &&
//         category.trim()
//           ? category.trim()
//           : "Other",

//       description:
//         description.trim(),

//       priority:
//         typeof priority === "string" &&
//         priority.trim()
//           ? priority.trim()
//           : "Medium",

//       status: "Pending",
//     };

//     // ==========================================
//     // CREATE DATABASE RECORD
//     // ==========================================

//     const repair =
//       await RepairRequest.create(
//         repairData
//       );

//     // ==========================================
//     // POPULATE CREATED RECORD
//     // ==========================================

//     const populated =
//       await RepairRequest.findById(
//         repair._id
//       )
//         .populate(
//           "tenant",
//           "fullName email phone role block floor apartment"
//         )
//         .populate(
//           "landlord",
//           "fullName email phone"
//         )
//         .populate(
//           "property",
//           "name address city state"
//         )
//         .populate(
//           "apartment",
//           "apartmentNumber block floor apartmentType"
//         );

//     // ==========================================
//     // ADMIN NOTIFICATION
//     // ==========================================
//     //
//     // Email failure must NOT make the repair
//     // request fail because the database record
//     // has already been successfully created.
//     // ==========================================

//     try {
//       await sendEmail({
//         to: ADMIN_EMAIL,

//         subject:
//           `New Repair Request | ${tenant.fullName}`,

//         replyTo: tenant.email,

//         html: `
//           <div style="
//             font-family: Arial, sans-serif;
//             max-width: 700px;
//             margin: auto;
//             padding: 30px;
//             color: #111111;
//             background: #ffffff;
//           ">

//             <div style="
//               background: #4B4F93;
//               color: #ffffff;
//               padding: 25px;
//               border-radius: 10px 10px 0 0;
//             ">
//               <h2 style="
//                 margin: 0;
//                 font-size: 24px;
//               ">
//                 Ocean Trail Condominium
//               </h2>

//               <p style="
//                 margin: 6px 0 0;
//                 opacity: 0.95;
//               ">
//                 New Repair Request
//               </p>
//             </div>

//             <div style="
//               border: 1px solid #eeeeee;
//               border-top: none;
//               padding: 30px;
//             ">

//               <h2 style="
//                 margin-top: 0;
//                 color: #111111;
//               ">
//                 New Repair Request Received
//               </h2>

//               <div style="
//                 background: #f7f7f7;
//                 border-left: 5px solid #4B4F93;
//                 padding: 20px;
//                 margin: 20px 0;
//               ">

//                 <p>
//                   <strong>Tenant:</strong><br />
//                   ${tenant.fullName}
//                 </p>

//                 <p>
//                   <strong>Email:</strong><br />
//                   ${tenant.email}
//                 </p>

//                 <p>
//                   <strong>Phone:</strong><br />
//                   ${tenant.phone || "Not provided"}
//                 </p>

//                 <p>
//                   <strong>Block:</strong><br />
//                   ${tenant.block || "Not provided"}
//                 </p>

//                 <p>
//                   <strong>Floor:</strong><br />
//                   ${tenant.floor || "Not provided"}
//                 </p>

//                 <p>
//                   <strong>Apartment:</strong><br />
//                   ${tenant.apartment || "Not provided"}
//                 </p>

//               </div>

//               <div style="
//                 margin: 20px 0;
//               ">

//                 <p>
//                   <strong>Title:</strong><br />
//                   ${title.trim()}
//                 </p>

//                 <p>
//                   <strong>Category:</strong><br />
//                   ${
//                     category ||
//                     "Other"
//                   }
//                 </p>

//                 <p>
//                   <strong>Priority:</strong><br />
//                   ${
//                     priority ||
//                     "Medium"
//                   }
//                 </p>

//                 <p>
//                   <strong>Description:</strong><br />
//                   ${description.trim()}
//                 </p>

//               </div>

//               <p style="
//                 color: #555555;
//                 line-height: 1.6;
//               ">
//                 This repair request has been recorded
//                 in the Ocean Trail Condominium system.
//                 Please open the admin dashboard to
//                 review and respond to the tenant.
//               </p>

//             </div>
//           </div>
//         `,
//       });
//     } catch (emailError) {
//       console.error(
//         "Repair admin email error:",
//         emailError
//       );
//     }

//     // ==========================================
//     // SUCCESS
//     // ==========================================

//     return res.status(201).json({
//       success: true,

//       message:
//         "Repair request submitted successfully.",

//       repairRequest: populated,
//     });

//   } catch (error) {
//     console.error(
//       "Create repair request error:",
//       error
//     );

//     // ==========================================
//     // IMPORTANT DEBUG INFORMATION
//     // ==========================================
//     //
//     // During development, returning the Mongoose
//     // message makes future backend problems much
//     // easier to identify.
//     //
//     // ==========================================

//     return res.status(500).json({
//       success: false,

//       message:
//         "Unable to submit repair request.",

//       error:
//         process.env.NODE_ENV !==
//         "production"
//           ? error.message
//           : undefined,
//     });
//   }
// };

// // ==========================================
// // GET TENANT REPAIR REQUESTS
// // ==========================================

// const getTenantRepairRequests =
//   async (req, res) => {
//     try {
//       const requests =
//         await RepairRequest.find({
//           tenant: req.user._id,
//         })
//           .populate(
//             "tenant",
//             "fullName email phone role block floor apartment"
//           )
//           .populate(
//             "property",
//             "name address city state"
//           )
//           .populate(
//             "apartment",
//             "apartmentNumber block floor apartmentType"
//           )
//           .populate(
//             "landlord",
//             "fullName email phone"
//           )
//           .populate(
//             "respondedBy",
//             "fullName email role"
//           )
//           .sort({
//             createdAt: -1,
//           });

//       return res.status(200).json({
//         success: true,

//         count:
//           requests.length,

//         repairRequests:
//           requests,
//       });

//     } catch (error) {
//       console.error(
//         "Get tenant repairs error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Unable to load repair requests.",
//       });
//     }
//   };

// // ==========================================
// // GET SINGLE TENANT REPAIR
// // ==========================================

// const getTenantRepairRequest =
//   async (req, res) => {
//     try {
//       if (
//         !mongoose.Types.ObjectId.isValid(
//           req.params.id
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid repair request ID.",
//         });
//       }

//       const request =
//         await RepairRequest.findOne({
//           _id: req.params.id,
//           tenant: req.user._id,
//         })
//           .populate(
//             "tenant",
//             "fullName email phone role block floor apartment"
//           )
//           .populate(
//             "property",
//             "name address city state"
//           )
//           .populate(
//             "apartment",
//             "apartmentNumber block floor apartmentType"
//           )
//           .populate(
//             "landlord",
//             "fullName email phone"
//           )
//           .populate(
//             "respondedBy",
//             "fullName email role"
//           );

//       if (!request) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Repair request not found.",
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         repairRequest: request,
//       });

//     } catch (error) {
//       console.error(
//         "Get repair request error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Unable to load repair request.",
//       });
//     }
//   };

// // ==========================================
// // GET LANDLORD REPAIRS
// // ==========================================

// const getLandlordRepairRequests =
//   async (req, res) => {
//     try {
//       const requests =
//         await RepairRequest.find({
//           landlord: req.user._id,
//         })
//           .populate(
//             "tenant",
//             "fullName email phone block floor apartment"
//           )
//           .populate(
//             "property",
//             "name address city state"
//           )
//           .populate(
//             "apartment",
//             "apartmentNumber block floor apartmentType"
//           )
//           .populate(
//             "respondedBy",
//             "fullName email role"
//           )
//           .sort({
//             createdAt: -1,
//           });

//       return res.status(200).json({
//         success: true,
//         count: requests.length,
//         repairRequests:
//           requests,
//       });

//     } catch (error) {
//       console.error(
//         "Get landlord repair requests error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Unable to load repair requests.",
//       });
//     }
//   };

// // ==========================================
// // LANDLORD UPDATE REPAIR
// // ==========================================
// //
// // Existing landlord functionality is preserved.
// //
// // Now, when a landlord replies, the tenant also
// // receives a notification/email.
// // ==========================================

// const updateRepairRequest =
//   async (req, res) => {
//     try {
//       const {
//         status,
//         managementResponse,
//       } = req.body || {};

//       const request =
//         await RepairRequest.findOne({
//           _id: req.params.id,
//           landlord: req.user._id,
//         });

//       if (!request) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Repair request not found.",
//         });
//       }

//       // ==========================================
//       // VALIDATE STATUS
//       // ==========================================

//       if (
//         status !== undefined &&
//         !allowedStatuses.includes(status)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid repair request status.",
//         });
//       }

//       // ==========================================
//       // UPDATE STATUS
//       // ==========================================

//       if (status !== undefined) {
//         request.status =
//           status;

//         if (
//           status === "Completed"
//         ) {
//           request.completedAt =
//             new Date();
//         } else {
//           request.completedAt =
//             null;
//         }
//       }

//       // ==========================================
//       // UPDATE RESPONSE
//       // ==========================================

//       let responseWasAdded = false;

//       if (
//         managementResponse !==
//         undefined
//       ) {
//         const cleanedResponse =
//           String(
//             managementResponse
//           ).trim();

//         request.managementResponse =
//           cleanedResponse;

//         if (cleanedResponse) {
//           request.respondedAt =
//             new Date();

//           request.respondedBy =
//             req.user._id;

//           request.respondedByRole =
//             "landlord";

//           responseWasAdded =
//             true;
//         }
//       }

//       await request.save();

//       // ==========================================
//       // NOTIFY TENANT
//       // ==========================================

//       if (responseWasAdded) {
//         const populatedForNotification =
//           await RepairRequest.findById(
//             request._id
//           ).populate(
//             "tenant",
//             "fullName email"
//           );

//         const tenant =
//           populatedForNotification
//             ?.tenant;

//         if (tenant) {
//           try {
//             await TenantNotification.create(
//               {
//                 recipient:
//                   tenant._id,

//                 sender:
//                   req.user._id,

//                 title:
//                   "Repair Request Update",

//                 message:
//                   `Management has responded to your repair request "${request.title}".`,

//                 type:
//                   "repair",
//               }
//             );
//           } catch (notificationError) {
//             console.error(
//               "Tenant repair notification error:",
//               notificationError
//             );
//           }

//           try {
//             await sendEmail({
//               to: tenant.email,

//               subject:
//                 `Repair Request Update | ${request.title}`,

//               html: `
//                 <div style="
//                   font-family: Arial, sans-serif;
//                   max-width: 700px;
//                   margin: auto;
//                   padding: 30px;
//                 ">

//                   <div style="
//                     background: #4B4F93;
//                     color: #ffffff;
//                     padding: 24px;
//                     border-radius: 10px 10px 0 0;
//                   ">

//                     <h2 style="
//                       margin: 0;
//                     ">
//                       Ocean Trail Condominium
//                     </h2>

//                     <p style="
//                       margin: 6px 0 0;
//                     ">
//                       Repair Request Update
//                     </p>

//                   </div>

//                   <div style="
//                     padding: 30px;
//                     border: 1px solid #eeeeee;
//                     border-top: none;
//                   ">

//                     <p>
//                       Dear ${tenant.fullName},
//                     </p>

//                     <p>
//                       Management has responded to
//                       your repair request.
//                     </p>

//                     <p>
//                       <strong>Repair Request:</strong><br />
//                       ${request.title}
//                     </p>

//                     <p>
//                       <strong>Status:</strong><br />
//                       ${request.status}
//                     </p>

//                     <div style="
//                       background: #f7f7f7;
//                       border-left: 5px solid #4B4F93;
//                       padding: 18px;
//                       margin: 20px 0;
//                     ">

//                       <strong>
//                         Management Response
//                       </strong>

//                       <p style="
//                         white-space: pre-wrap;
//                         line-height: 1.6;
//                       ">
//                         ${request.managementResponse}
//                       </p>

//                     </div>

//                     <p>
//                       Please log in to your Ocean Trail
//                       Condominium tenant portal to
//                       view the full repair request history.
//                     </p>

//                   </div>

//                 </div>
//               `,
//             });
//           } catch (emailError) {
//             console.error(
//               "Tenant repair email error:",
//               emailError
//             );
//           }
//         }
//       }

//       // ==========================================
//       // RETURN UPDATED RECORD
//       // ==========================================

//       const updated =
//         await RepairRequest.findById(
//           request._id
//         )
//           .populate(
//             "tenant",
//             "fullName email phone block floor apartment"
//           )
//           .populate(
//             "property",
//             "name address city state"
//           )
//           .populate(
//             "apartment",
//             "apartmentNumber block floor apartmentType"
//           )
//           .populate(
//             "landlord",
//             "fullName email phone"
//           )
//           .populate(
//             "respondedBy",
//             "fullName email role"
//           );

//       return res.status(200).json({
//         success: true,

//         message:
//           "Repair request updated successfully.",

//         repairRequest:
//           updated,
//       });

//     } catch (error) {
//       console.error(
//         "Update repair request error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Unable to update repair request.",
//       });
//     }
//   };

// // ==========================================
// // ADMIN GET ALL REPAIR REQUESTS
// // ==========================================

// const getAdminRepairRequests =
//   async (req, res) => {
//     try {
//       const requests =
//         await RepairRequest.find({})
//           .populate(
//             "tenant",
//             "fullName email phone role block floor apartment"
//           )
//           .populate(
//             "landlord",
//             "fullName email phone"
//           )
//           .populate(
//             "property",
//             "name address city state"
//           )
//           .populate(
//             "apartment",
//             "apartmentNumber block floor apartmentType"
//           )
//           .populate(
//             "respondedBy",
//             "fullName email role"
//           )
//           .sort({
//             createdAt: -1,
//           });

//       return res.status(200).json({
//         success: true,

//         count:
//           requests.length,

//         repairRequests:
//           requests,
//       });

//     } catch (error) {
//       console.error(
//         "Get admin repair requests error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,

//         message:
//           "Unable to load repair requests.",
//       });
//     }
//   };

// // ==========================================
// // ADMIN UPDATE / REPLY TO REPAIR REQUEST
// // ==========================================

// const adminUpdateRepairRequest =
//   async (req, res) => {
//     try {
//       const {
//         status,
//         managementResponse,
//       } = req.body || {};

//       // ==========================================
//       // VALIDATE ID
//       // ==========================================

//       if (
//         !mongoose.Types.ObjectId.isValid(
//           req.params.id
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid repair request ID.",
//         });
//       }

//       // ==========================================
//       // FIND REQUEST
//       // ==========================================

//       const request =
//         await RepairRequest.findById(
//           req.params.id
//         );

//       if (!request) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Repair request not found.",
//         });
//       }

//       // ==========================================
//       // VALIDATE STATUS
//       // ==========================================

//       if (
//         status !== undefined &&
//         !allowedStatuses.includes(status)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid repair request status.",
//         });
//       }

//       // ==========================================
//       // UPDATE STATUS
//       // ==========================================

//       if (status !== undefined) {
//         request.status =
//           status;

//         if (
//           status === "Completed"
//         ) {
//           request.completedAt =
//             new Date();
//         } else if (
//           status !==
//           "Completed"
//         ) {
//           request.completedAt =
//             null;
//         }
//       }

//       // ==========================================
//       // UPDATE ADMIN RESPONSE
//       // ==========================================

//       let responseWasAdded =
//         false;

//       if (
//         managementResponse !==
//         undefined
//       ) {
//         const cleanedResponse =
//           String(
//             managementResponse
//           ).trim();

//         request.managementResponse =
//           cleanedResponse;

//         if (cleanedResponse) {
//           request.respondedAt =
//             new Date();

//           request.respondedBy =
//             req.user._id;

//           request.respondedByRole =
//             "admin";

//           responseWasAdded =
//             true;
//         }
//       }

//       await request.save();

//       // ==========================================
//       // GET TENANT
//       // ==========================================

//       const tenant =
//         await User.findById(
//           request.tenant
//         ).select(
//           "fullName email phone block floor apartment"
//         );

//       // ==========================================
//       // NOTIFICATION TO TENANT
//       // ==========================================

//       if (
//         responseWasAdded &&
//         tenant
//       ) {
//         // ------------------------------------------
//         // DATABASE NOTIFICATION
//         // ------------------------------------------

//         try {
//           await TenantNotification.create(
//             {
//               recipient:
//                 tenant._id,

//               sender:
//                 req.user._id,

//               title:
//                 "Admin Replied to Your Repair Request",

//               message:
//                 `Management has replied to your repair request "${request.title}".`,

//               type:
//                 "repair",
//             }
//           );
//         } catch (notificationError) {
//           console.error(
//             "Admin repair notification error:",
//             notificationError
//           );
//         }

//         // ------------------------------------------
//         // EMAIL NOTIFICATION
//         // ------------------------------------------

//         try {
//           await sendEmail({
//             to: tenant.email,

//             subject:
//               `Admin Reply | Repair Request | ${request.title}`,

//             html: `
//               <div style="
//                 font-family: Arial, sans-serif;
//                 max-width: 700px;
//                 margin: auto;
//                 padding: 30px;
//                 color: #111111;
//                 background: #ffffff;
//               ">

//                 <div style="
//                   background: #4B4F93;
//                   color: #ffffff;
//                   padding: 25px;
//                   border-radius: 10px 10px 0 0;
//                 ">

//                   <h2 style="
//                     margin: 0;
//                   ">
//                     Ocean Trail Condominium
//                   </h2>

//                   <p style="
//                     margin: 6px 0 0;
//                   ">
//                     Repair Request Response
//                   </p>

//                 </div>

//                 <div style="
//                   border: 1px solid #eeeeee;
//                   border-top: none;
//                   padding: 30px;
//                 ">

//                   <p>
//                     Dear ${tenant.fullName},
//                   </p>

//                   <p>
//                     The Ocean Trail Condominium
//                     management team has replied to
//                     your repair request.
//                   </p>

//                   <div style="
//                     background: #f7f7f7;
//                     border-left: 5px solid #4B4F93;
//                     padding: 20px;
//                     margin: 20px 0;
//                   ">

//                     <p>
//                       <strong>Repair Request:</strong><br />
//                       ${request.title}
//                     </p>

//                     <p>
//                       <strong>Status:</strong><br />
//                       ${request.status}
//                     </p>

//                   </div>

//                   <div style="
//                     background: #ffffff;
//                     border: 1px solid #dddddd;
//                     border-radius: 8px;
//                     padding: 20px;
//                     margin: 20px 0;
//                   ">

//                     <h3 style="
//                       color: #4B4F93;
//                       margin-top: 0;
//                     ">
//                       Management Response
//                     </h3>

//                     <p style="
//                       white-space: pre-wrap;
//                       line-height: 1.7;
//                     ">
//                       ${request.managementResponse}
//                     </p>

//                   </div>

//                   <p style="
//                     color: #555555;
//                     line-height: 1.6;
//                   ">
//                     Please sign in to your tenant portal
//                     to view your complete repair request
//                     history and any further updates.
//                   </p>

//                 </div>

//               </div>
//             `,
//           });
//         } catch (emailError) {
//           console.error(
//             "Admin reply email error:",
//             emailError
//           );
//         }
//       }

//       // ==========================================
//       // RETURN UPDATED REQUEST
//       // ==========================================

//       const updated =
//         await RepairRequest.findById(
//           request._id
//         )
//           .populate(
//             "tenant",
//             "fullName email phone role block floor apartment"
//           )
//           .populate(
//             "landlord",
//             "fullName email phone"
//           )
//           .populate(
//             "property",
//             "name address city state"
//           )
//           .populate(
//             "apartment",
//             "apartmentNumber block floor apartmentType"
//           )
//           .populate(
//             "respondedBy",
//             "fullName email role"
//           );

//       return res.status(200).json({
//         success: true,

//         message:
//           responseWasAdded
//             ? "Repair request response sent successfully."
//             : "Repair request updated successfully.",

//         repairRequest:
//           updated,
//       });

//     } catch (error) {
//       console.error(
//         "Admin update repair request error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Unable to update repair request.",
//       });
//     }
//   };

// // ==========================================
// // EXPORT CONTROLLERS
// // ==========================================

// module.exports = {
//   createRepairRequest,

//   getTenantRepairRequests,

//   getTenantRepairRequest,

//   getLandlordRepairRequests,

//   updateRepairRequest,

//   // ADMIN
//   getAdminRepairRequests,
//   adminUpdateRepairRequest,
// };





const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const RepairRequest = require("../models/RepairRequest");
const Apartment = require("../models/Apartment");
const User = require("../models/User");
const TenantNotification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");

// ======================================================
// CONFIGURATION
// ======================================================

const ADMIN_EMAIL =
  process.env.COMPANY_EMAIL || "oceantrailcondoslekki@gmail.com";

const allowedStatuses = [
  "Pending",
  "Assigned",
  "In Progress",
  "Completed",
  "Cancelled",
];

const MANAGEMENT_ROLES = [
  "admin",
  "super_admin",
  "property_manager",
];

const REPAIR_UPLOAD_DIRECTORY = path.join(
  process.cwd(),
  "uploads",
  "repairs"
);

// Ensure the repair upload directory exists.
if (!fs.existsSync(REPAIR_UPLOAD_DIRECTORY)) {
  fs.mkdirSync(REPAIR_UPLOAD_DIRECTORY, { recursive: true });
}

// ======================================================
// GENERAL HELPERS
// ======================================================

const getUserRole = (user) => {
  return String(user?.role || "").toLowerCase();
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getPublicFileUrl = (req, filename) => {
  const baseUrl =
    process.env.BACKEND_URL ||
    `${req.protocol}://${req.get("host")}`;

  return `${baseUrl.replace(/\/$/, "")}/uploads/repairs/${filename}`;
};

const getFileResourceType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";

  if (
    mimeType === "application/pdf" ||
    mimeType.includes("word") ||
    mimeType.includes("document")
  ) {
    return "document";
  }

  return "raw";
};

const sanitizeFilename = (filename = "attachment") => {
  return path
    .basename(filename)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-150);
};

/**
 * Supports:
 * - Multer memoryStorage: file.buffer
 * - Multer diskStorage: file.path
 * - upload.single(): req.file
 * - upload.array()/fields(): req.files
 *
 * The Repair model must contain the attachments subdocument
 * described in the previous model update.
 */
const saveUploadedFiles = async (req) => {
  let files = [];

  if (req.file) {
    files.push(req.file);
  }

  if (Array.isArray(req.files)) {
    files = files.concat(req.files);
  } else if (req.files && typeof req.files === "object") {
    Object.values(req.files).forEach((fileGroup) => {
      if (Array.isArray(fileGroup)) {
        files = files.concat(fileGroup);
      }
    });
  }

  const attachments = [];

  for (const file of files) {
    if (!file) continue;

    let filename = file.filename;

    // Save memoryStorage files to the repair uploads directory.
    if (file.buffer) {
      const safeOriginalName = sanitizeFilename(
        file.originalname || file.originalName || "attachment"
      );

      const extension = path.extname(safeOriginalName);

      filename = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}${extension}`;

      const destination = path.join(
        REPAIR_UPLOAD_DIRECTORY,
        filename
      );

      await fs.promises.writeFile(destination, file.buffer);
    }

    // For diskStorage, use the existing filename.
    if (!filename && file.path) {
      filename = path.basename(file.path);
    }

    if (!filename) continue;

    const originalName =
      file.originalname ||
      file.originalName ||
      filename;

    attachments.push({
      originalName,
      url: getPublicFileUrl(req, filename),
      mimeType: file.mimetype || "application/octet-stream",
      resourceType: getFileResourceType(file.mimetype),
      size: file.size || 0,
    });
  }

  return attachments;
};

const getRepairPopulate = () => [
  {
    path: "tenant",
    select: "fullName email phone role block floor apartment",
  },
  {
    path: "landlord",
    select: "fullName email phone role",
  },
  {
    path: "property",
    select: "name address city state",
  },
  {
    path: "apartment",
    select: "apartmentNumber block floor",
  },
  {
    path: "respondedBy",
    select: "fullName email role",
  },
  {
    path: "messages.sender",
    select: "fullName email role",
  },
];

const populateRepair = async (repair) => {
  if (!repair) return null;

  await repair.populate(getRepairPopulate());

  return repair;
};

const getRequestMessage = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 2000);
};

const sendRepairEmail = async ({ email, subject, message }) => {
  if (!email) return;

  try {
    await sendEmail({
      email,
      subject,
      message,
    });
  } catch (error) {
    console.error("Repair email notification failed:", error.message);
  }
};

const createRepairNotification = async ({
  userId,
  title,
  message,
  repairId,
}) => {
  if (!userId) return;

  try {
    await TenantNotification.create({
      user: userId,
      title,
      message,
      type: "repair",
      relatedId: repairId,
    });
  } catch (error) {
    // Notification failure must not prevent the repair conversation
    // from being saved.
    console.error(
      "Repair database notification failed:",
      error.message
    );
  }
};

// ======================================================
// ACCESS CONTROL FOR REPAIR CONVERSATIONS
// ======================================================

const canAccessRepair = (repair, user) => {
  if (!repair || !user) return false;

  const role = getUserRole(user);
  const userId = String(user._id);

  if (MANAGEMENT_ROLES.includes(role)) {
    return true;
  }

  if (role === "tenant") {
    return String(repair.tenant) === userId;
  }

  if (role === "landlord") {
    return (
      repair.landlord &&
      String(repair.landlord) === userId
    );
  }

  return false;
};

const canSendRepairMessage = (repair, user) => {
  return canAccessRepair(repair, user);
};

// ======================================================
// CREATE REPAIR REQUEST - TENANT
// ======================================================

const createRepairRequest = async (req, res) => {
  try {
    const { title, category, description, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Repair title and description are required.",
      });
    }

    const tenant = await User.findById(req.user._id).select(
      "fullName email phone role block floor apartment"
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant account not found.",
      });
    }

    let apartmentRecord = null;

    try {
      apartmentRecord = await Apartment.findOne({
        tenant: req.user._id,
      }).populate("property", "name address city state landlord");
    } catch (error) {
      console.error("Apartment lookup failed:", error.message);
    }

    const attachments = await saveUploadedFiles(req);

    const repairData = {
      tenant: req.user._id,
      title: title.trim(),
      category: category || "General",
      description: description.trim(),
      priority: priority || "Medium",
      status: "Pending",
      attachments,
      messages: [],
    };

    if (apartmentRecord) {
      repairData.apartment = apartmentRecord._id;

      if (apartmentRecord.property) {
        repairData.property = apartmentRecord.property._id;

        if (apartmentRecord.property.landlord) {
          repairData.landlord =
            apartmentRecord.property.landlord;
        }
      }
    }

    const repairRequest = await RepairRequest.create(repairData);

    await populateRepair(repairRequest);

    await sendRepairEmail({
      email: ADMIN_EMAIL,
      subject: "New Repair Request - Ocean Trail Condominium",
      message: `
A new repair request has been submitted.

Tenant: ${tenant.fullName || "N/A"}
Email: ${tenant.email || "N/A"}
Phone: ${tenant.phone || "N/A"}

Title: ${title}
Category: ${category || "General"}
Priority: ${priority || "Medium"}

Description:
${description}

Please log in to the Ocean Trail management dashboard to review this request.
      `,
    });

    return res.status(201).json({
      success: true,
      message: "Repair request submitted successfully.",
      repairRequest,
    });
  } catch (error) {
    console.error("Create repair request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit repair request.",
      error: error.message,
    });
  }
};

// ======================================================
// GET TENANT REPAIR REQUESTS
// ======================================================

const getTenantRepairRequests = async (req, res) => {
  try {
    const repairRequests = await RepairRequest.find({
      tenant: req.user._id,
    })
      .populate(getRepairPopulate())
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: repairRequests.length,
      repairRequests,
    });
  } catch (error) {
    console.error("Get tenant repair requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve repair requests.",
      error: error.message,
    });
  }
};

// ======================================================
// GET SINGLE TENANT REPAIR REQUEST
// ======================================================

const getTenantRepairRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repair request ID.",
      });
    }

    const repairRequest = await RepairRequest.findOne({
      _id: id,
      tenant: req.user._id,
    }).populate(getRepairPopulate());

    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: "Repair request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      repairRequest,
    });
  } catch (error) {
    console.error("Get single tenant repair error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve repair request.",
      error: error.message,
    });
  }
};

// ======================================================
// GET LANDLORD REPAIR REQUESTS
// ======================================================

const getLandlordRepairRequests = async (req, res) => {
  try {
    const repairRequests = await RepairRequest.find({
      landlord: req.user._id,
    })
      .populate(getRepairPopulate())
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: repairRequests.length,
      repairRequests,
    });
  } catch (error) {
    console.error("Get landlord repair requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve landlord repair requests.",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE REPAIR REQUEST - LANDLORD
// ======================================================

const updateRepairRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managementResponse } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repair request ID.",
      });
    }

    const repairRequest = await RepairRequest.findOne({
      _id: id,
      landlord: req.user._id,
    });

    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: "Repair request not found.",
      });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repair status.",
      });
    }

    if (status) {
      repairRequest.status = status;

      if (status === "Completed") {
        repairRequest.completedAt = new Date();
      } else if (repairRequest.completedAt) {
        repairRequest.completedAt = null;
      }
    }

    const responseText = getRequestMessage(managementResponse);

    if (responseText) {
      repairRequest.managementResponse = responseText;
      repairRequest.respondedAt = new Date();
      repairRequest.respondedBy = req.user._id;
      repairRequest.respondedByRole = "landlord";
    }

    const attachments = await saveUploadedFiles(req);

    if (attachments.length) {
      repairRequest.attachments.push(...attachments);
    }

    await repairRequest.save();

    if (responseText) {
      const tenant = await User.findById(repairRequest.tenant).select(
        "fullName email"
      );

      await createRepairNotification({
        userId: repairRequest.tenant,
        title: "Update on Your Repair Request",
        message: responseText,
        repairId: repairRequest._id,
      });

      if (tenant?.email) {
        await sendRepairEmail({
          email: tenant.email,
          subject: "Repair Request Update - Ocean Trail Condominium",
          message: `
Hello ${tenant.fullName || "Tenant"},

Management has provided an update on your repair request.

Repair: ${repairRequest.title}
Status: ${repairRequest.status}

Response:
${responseText}

Please log in to your tenant dashboard for more details.
          `,
        });
      }
    }

    await populateRepair(repairRequest);

    return res.status(200).json({
      success: true,
      message: "Repair request updated successfully.",
      repairRequest,
    });
  } catch (error) {
    console.error("Landlord update repair error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update repair request.",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL REPAIR REQUESTS - ADMIN
// ======================================================

const getAdminRepairRequests = async (req, res) => {
  try {
    const repairRequests = await RepairRequest.find({})
      .populate(getRepairPopulate())
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: repairRequests.length,
      repairRequests,
    });
  } catch (error) {
    console.error("Get admin repair requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve repair requests.",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE REPAIR REQUEST - ADMIN
// ======================================================

const adminUpdateRepairRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managementResponse } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repair request ID.",
      });
    }

    const repairRequest = await RepairRequest.findById(id);

    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: "Repair request not found.",
      });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repair status.",
      });
    }

    if (status) {
      repairRequest.status = status;

      if (status === "Completed") {
        repairRequest.completedAt = new Date();
      } else if (repairRequest.completedAt) {
        repairRequest.completedAt = null;
      }
    }

    const responseText = getRequestMessage(managementResponse);

    if (responseText) {
      repairRequest.managementResponse = responseText;
      repairRequest.respondedAt = new Date();
      repairRequest.respondedBy = req.user._id;
      repairRequest.respondedByRole = getUserRole(req.user);
    }

    const attachments = await saveUploadedFiles(req);

    if (attachments.length) {
      repairRequest.attachments.push(...attachments);
    }

    await repairRequest.save();

    if (responseText) {
      const tenant = await User.findById(repairRequest.tenant).select(
        "fullName email"
      );

      await createRepairNotification({
        userId: repairRequest.tenant,
        title: "Management Responded to Your Repair Request",
        message: responseText,
        repairId: repairRequest._id,
      });

      if (tenant?.email) {
        await sendRepairEmail({
          email: tenant.email,
          subject: "Repair Request Update - Ocean Trail Condominium",
          message: `
Hello ${tenant.fullName || "Tenant"},

Management has responded to your repair request.

Repair: ${repairRequest.title}
Status: ${repairRequest.status}

Management response:
${responseText}

Please log in to your tenant dashboard to view the full conversation.
          `,
        });
      }
    }

    await populateRepair(repairRequest);

    return res.status(200).json({
      success: true,
      message: "Repair request updated successfully.",
      repairRequest,
    });
  } catch (error) {
    console.error("Admin update repair error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update repair request.",
      error: error.message,
    });
  }
};

// ======================================================
// ADD MESSAGE TO REPAIR CONVERSATION
// TENANT / LANDLORD / ADMIN / PROPERTY MANAGER
// ======================================================

const addRepairMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const messageText = getRequestMessage(req.body.message);

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repair request ID.",
      });
    }

    const repairRequest = await RepairRequest.findById(id);

    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: "Repair request not found.",
      });
    }

    if (!canSendRepairMessage(repairRequest, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorised to access this repair conversation.",
      });
    }

    const attachments = await saveUploadedFiles(req);

    if (!messageText && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a message or attach a file before sending.",
      });
    }

    const senderRole = getUserRole(req.user);

    repairRequest.messages.push({
      sender: req.user._id,
      senderRole,
      message: messageText,
      attachments,
      createdAt: new Date(),
    });

    // Keep the existing management response fields updated
    // for compatibility with older frontend components.
    if (MANAGEMENT_ROLES.includes(senderRole) || senderRole === "landlord") {
      if (messageText) {
        repairRequest.managementResponse = messageText;
      }

      repairRequest.respondedAt = new Date();
      repairRequest.respondedBy = req.user._id;
      repairRequest.respondedByRole = senderRole;
    }

    await repairRequest.save();

    const sender = await User.findById(req.user._id).select(
      "fullName email role"
    );

    const senderName = sender?.fullName || "A user";

    // Notify the tenant when management or landlord replies.
    if (
      senderRole !== "tenant" &&
      repairRequest.tenant
    ) {
      const notificationMessage =
        messageText ||
        `${senderName} sent an attachment regarding your repair request.`;

      await createRepairNotification({
        userId: repairRequest.tenant,
        title: "New Repair Conversation Message",
        message: notificationMessage,
        repairId: repairRequest._id,
      });

      const tenant = await User.findById(repairRequest.tenant).select(
        "fullName email"
      );

      if (tenant?.email) {
        await sendRepairEmail({
          email: tenant.email,
          subject: "New Repair Request Message - Ocean Trail Condominium",
          message: `
Hello ${tenant.fullName || "Tenant"},

${senderName} has sent a new message regarding your repair request.

Repair: ${repairRequest.title}

Message:
${messageText || "An attachment was sent."}

Please log in to your tenant dashboard to view the conversation and attachments.
          `,
        });
      }
    }

    // Notify management when the tenant sends a follow-up.
    if (senderRole === "tenant") {
      await sendRepairEmail({
        email: ADMIN_EMAIL,
        subject: "New Tenant Repair Conversation Message",
        message: `
A tenant has sent a new message regarding a repair request.

Tenant: ${senderName}
Repair: ${repairRequest.title}

Message:
${messageText || "The tenant sent an attachment."}

Please log in to the management dashboard to view the conversation.
        `,
      });
    }

    await populateRepair(repairRequest);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      repairRequest,
      messages: repairRequest.messages,
    });
  } catch (error) {
    console.error("Add repair message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send repair conversation message.",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORT CONTROLLERS
// ======================================================

module.exports = {
  createRepairRequest,
  getTenantRepairRequests,
  getTenantRepairRequest,
  getLandlordRepairRequests,
  updateRepairRequest,
  getAdminRepairRequests,
  adminUpdateRepairRequest,
  addRepairMessage,
};
