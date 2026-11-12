// const Apartment = require("../models/Apartment");
// const Property = require("../models/Property");
// const User = require("../models/User");

// // ======================================================
// // HELPER
// // ======================================================

// const isAdmin = (req) => {
//   return (
//     req.user &&
//     String(req.user.role || "").trim().toLowerCase() ===
//       "admin"
//   );
// };


// // ======================================================
// // CREATE APARTMENT
// // ======================================================

// const createApartment = async (req, res) => {
//   try {
//     const {
//       property,
//       apartmentNumber,
//       block,
//       floor,
//       apartmentType,
//       monthlyRent,
//       serviceCharge,
//       description,
//     } = req.body;

//     if (!property || !apartmentNumber) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Property and apartment number are required.",
//       });
//     }

//     // ==============================================
//     // VERIFY PROPERTY ACCESS
//     // ==============================================

//     const propertyQuery = {
//       _id: property,
//     };

//     if (!isAdmin(req)) {
//       propertyQuery.landlord = req.user._id;
//     }

//     const propertyRecord =
//       await Property.findOne(propertyQuery);

//     if (!propertyRecord) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You do not have permission to use this property.",
//       });
//     }

//     // ==============================================
//     // CHECK DUPLICATE
//     // ==============================================

//     const existingApartment =
//       await Apartment.findOne({
//         property,
//         block: block?.trim() || "",
//         apartmentNumber:
//           apartmentNumber.trim(),
//       });

//     if (existingApartment) {
//       return res.status(409).json({
//         success: false,
//         message:
//           "This apartment already exists in this property.",
//       });
//     }

//     // ==============================================
//     // CREATE
//     // ==============================================

//     const apartment =
//       await Apartment.create({
//         property,
//         apartmentNumber:
//           apartmentNumber.trim(),
//         block:
//           block?.trim() || "",
//         floor:
//           floor?.trim() || "",
//         apartmentType:
//           apartmentType || "2 Bedroom",
//         monthlyRent:
//           Number(monthlyRent) || 0,
//         serviceCharge:
//           Number(serviceCharge) || 0,
//         description:
//           description?.trim() || "",
//         status: "available",
//       });

//     // ==============================================
//     // UPDATE PROPERTY COUNT
//     // ==============================================

//     await Property.findByIdAndUpdate(
//       property,
//       {
//         $inc: {
//           numberOfApartments: 1,
//         },
//       }
//     );

//     const populatedApartment =
//       await Apartment.findById(
//         apartment._id
//       )
//         .populate(
//           "property",
//           "name address city state"
//         )
//         .populate(
//           "tenant",
//           "fullName email phone"
//         );

//     return res.status(201).json({
//       success: true,
//       message:
//         "Apartment created successfully.",
//       apartment:
//         populatedApartment,
//     });
//   } catch (error) {
//     console.error(
//       "Create apartment error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to create apartment.",
//     });
//   }
// };


// // ======================================================
// // GET LANDLORD APARTMENTS
// // ======================================================

// const getMyApartments = async (
//   req,
//   res
// ) => {
//   try {
//     const properties =
//       await Property.find({
//         landlord: req.user._id,
//       }).select("_id");

//     const propertyIds =
//       properties.map(
//         (property) => property._id
//       );

//     const apartments =
//       await Apartment.find({
//         property: {
//           $in: propertyIds,
//         },
//       })
//         .populate(
//           "property",
//           "name address city state"
//         )
//         .populate(
//           "tenant",
//           "fullName email phone"
//         )
//         .sort({
//           createdAt: -1,
//         });

//     return res.status(200).json({
//       success: true,
//       count: apartments.length,
//       apartments,
//     });
//   } catch (error) {
//     console.error(
//       "Get apartments error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to retrieve apartments.",
//     });
//   }
// };


// // ======================================================
// // GET APARTMENTS BY PROPERTY
// // ======================================================

// const getApartmentsByProperty =
//   async (req, res) => {
//     try {
//       const propertyQuery = {
//         _id: req.params.propertyId,
//       };

//       if (!isAdmin(req)) {
//         propertyQuery.landlord =
//           req.user._id;
//       }

//       const property =
//         await Property.findOne(
//           propertyQuery
//         );

//       if (!property) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Property not found.",
//         });
//       }

//       const apartments =
//         await Apartment.find({
//           property: property._id,
//         })
//           .populate(
//             "tenant",
//             "fullName email phone"
//           )
//           .sort({
//             block: 1,
//             floor: 1,
//             apartmentNumber: 1,
//           });

//       return res.status(200).json({
//         success: true,
//         apartments,
//       });
//     } catch (error) {
//       console.error(
//         "Get property apartments error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Unable to retrieve apartments.",
//       });
//     }
//   };


// // ======================================================
// // GET SINGLE APARTMENT
// // ======================================================

// const getApartment = async (
//   req,
//   res
// ) => {
//   try {
//     const apartment =
//       await Apartment.findById(
//         req.params.id
//       )
//         .populate(
//           "property",
//           "name address city state landlord"
//         )
//         .populate(
//           "tenant",
//           "fullName email phone"
//         );

//     if (!apartment) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Apartment not found.",
//       });
//     }

//     if (!apartment.property) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "The property linked to this apartment no longer exists.",
//       });
//     }

//     if (
//       !isAdmin(req) &&
//       apartment.property.landlord.toString() !==
//         req.user._id.toString()
//     ) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You do not have permission to view this apartment.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       apartment,
//     });
//   } catch (error) {
//     console.error(
//       "Get apartment error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to retrieve apartment.",
//     });
//   }
// };


// // ======================================================
// // UPDATE APARTMENT
// // ======================================================

// const updateApartment = async (
//   req,
//   res
// ) => {
//   try {
//     const apartment =
//       await Apartment.findById(
//         req.params.id
//       ).populate(
//         "property",
//         "landlord"
//       );

//     if (!apartment) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Apartment not found.",
//       });
//     }

//     if (!apartment.property) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "The property linked to this apartment no longer exists.",
//       });
//     }

//     if (
//       !isAdmin(req) &&
//       apartment.property.landlord.toString() !==
//         req.user._id.toString()
//     ) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You do not have permission to update this apartment.",
//       });
//     }

//     const fields = [
//       "apartmentNumber",
//       "block",
//       "floor",
//       "apartmentType",
//       "monthlyRent",
//       "serviceCharge",
//       "status",
//       "description",
//     ];

//     fields.forEach((field) => {
//       if (req.body[field] !== undefined) {
//         apartment[field] =
//           typeof req.body[field] ===
//           "string"
//             ? req.body[field].trim()
//             : req.body[field];
//       }
//     });

//     if (
//       req.body.monthlyRent !==
//       undefined
//     ) {
//       apartment.monthlyRent =
//         Number(
//           req.body.monthlyRent
//         ) || 0;
//     }

//     if (
//       req.body.serviceCharge !==
//       undefined
//     ) {
//       apartment.serviceCharge =
//         Number(
//           req.body.serviceCharge
//         ) || 0;
//     }

//     await apartment.save();

//     const updated =
//       await Apartment.findById(
//         apartment._id
//       )
//         .populate(
//           "property",
//           "name address city state"
//         )
//         .populate(
//           "tenant",
//           "fullName email phone"
//         );

//     return res.status(200).json({
//       success: true,
//       message:
//         "Apartment updated successfully.",
//       apartment: updated,
//     });
//   } catch (error) {
//     console.error(
//       "Update apartment error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to update apartment.",
//     });
//   }
// };


// // ======================================================
// // DELETE APARTMENT
// // ======================================================

// const deleteApartment = async (
//   req,
//   res
// ) => {
//   try {
//     const apartment =
//       await Apartment.findById(
//         req.params.id
//       ).populate(
//         "property",
//         "landlord"
//       );

//     if (!apartment) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Apartment not found.",
//       });
//     }

//     if (!apartment.property) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "The property linked to this apartment no longer exists.",
//       });
//     }

//     if (
//       !isAdmin(req) &&
//       apartment.property.landlord.toString() !==
//         req.user._id.toString()
//     ) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You do not have permission to delete this apartment.",
//       });
//     }

//     if (apartment.tenant) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "You cannot delete an apartment assigned to a tenant. Unassign the tenant first.",
//       });
//     }

//     await apartment.deleteOne();

//     await Property.findByIdAndUpdate(
//       apartment.property._id,
//       {
//         $inc: {
//           numberOfApartments: -1,
//         },
//       }
//     );

//     return res.status(200).json({
//       success: true,
//       message:
//         "Apartment deleted successfully.",
//     });
//   } catch (error) {
//     console.error(
//       "Delete apartment error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to delete apartment.",
//     });
//   }
// };


// // ======================================================
// // GET AVAILABLE TENANTS
// // ======================================================

// const getAvailableTenants =
//   async (req, res) => {
//     try {
//       const tenants =
//         await User.find({
//           role: "tenant",
//           isActive: true,
//           $or: [
//             {
//               apartment: null,
//             },
//             {
//               apartment: "",
//             },
//             {
//               apartment: {
//                 $exists: false,
//               },
//             },
//           ],
//         }).select(
//           "fullName email phone block floor apartment"
//         );

//       return res.status(200).json({
//         success: true,
//         tenants,
//       });
//     } catch (error) {
//       console.error(
//         "Get available tenants error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Unable to retrieve tenants.",
//       });
//     }
//   };

// // ======================================================
// // ASSIGN TENANT - CORRECTED VERSION
// // ======================================================

// const assignTenant = async (req, res) => {
//   try {
//     const { tenantId, tenantEmail } = req.body;

//     if (!tenantId && !tenantEmail) {
//       return res.status(400).json({
//         success: false,
//         message: "Tenant ID or tenant email is required.",
//       });
//     }

//     // Find apartment and property
//     const apartment = await Apartment.findById(req.params.id)
//       .populate("property", "landlord");

//     if (!apartment) {
//       return res.status(404).json({
//         success: false,
//         message: "Apartment not found.",
//       });
//     }

//     if (!apartment.property) {
//       return res.status(404).json({
//         success: false,
//         message: "The property linked to this apartment no longer exists.",
//       });
//     }

//     // Verify permission
//     if (
//       !isAdmin(req) &&
//       String(apartment.property.landlord) !== String(req.user._id)
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "You do not have permission to assign this apartment.",
//       });
//     }

//     // Find tenant
//     let tenant;

//     if (tenantId) {
//       tenant = await User.findOne({
//         _id: tenantId,
//         role: "tenant",
//         isActive: true,
//       });
//     } else {
//       tenant = await User.findOne({
//         email: tenantEmail.trim().toLowerCase(),
//         role: "tenant",
//         isActive: true,
//       });
//     }

//     if (!tenant) {
//       return res.status(404).json({
//         success: false,
//         message: "Tenant not found or inactive.",
//       });
//     }

//     // --------------------------------------------------
//     // CHECK WHETHER APARTMENT HAS A REAL TENANT
//     // --------------------------------------------------

//     if (apartment.tenant) {
//       const existingTenant = await User.findById(apartment.tenant);

//       if (existingTenant) {
//         return res.status(400).json({
//           success: false,
//           message: "This apartment already has a tenant.",
//         });
//       }

//       // The old tenant reference points to a deleted user.
//       // Repair the stale reference.
//       apartment.tenant = null;
//     }

//     // --------------------------------------------------
//     // CHECK WHETHER TENANT IS ALREADY LINKED ELSEWHERE
//     // --------------------------------------------------

//     const existingAssignment = await Apartment.findOne({
//       tenant: tenant._id,
//       _id: { $ne: apartment._id },
//     });

//     if (existingAssignment) {
//       return res.status(400).json({
//         success: false,
//         message: "This tenant is already assigned to another apartment.",
//       });
//     }

//     // --------------------------------------------------
//     // CHECK APARTMENT STATUS
//     // --------------------------------------------------

//     // "occupied" without a real tenant reference is stale.
//     // Repair it instead of rejecting a valid assignment.
//     if (
//       apartment.status === "maintenance" ||
//       apartment.status === "reserved"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: `This apartment cannot be assigned because its status is ${apartment.status}.`,
//       });
//     }

//     // --------------------------------------------------
//     // CLEAR STALE TENANT DETAILS
//     // --------------------------------------------------

//     if (
//       tenant.apartment &&
//       String(tenant.apartment).trim() !== ""
//     ) {
//       // Only clear legacy fields if no actual apartment
//       // record currently references this tenant.
//       tenant.apartment = null;
//       tenant.block = null;
//       tenant.floor = null;
//     }

//     // --------------------------------------------------
//     // ATOMIC APARTMENT ASSIGNMENT
//     // --------------------------------------------------

//     const updatedApartment = await Apartment.findOneAndUpdate(
//       {
//         _id: apartment._id,
//         tenant: null,
//         status: { $in: ["available", "occupied"] },
//       },
//       {
//         $set: {
//           tenant: tenant._id,
//           status: "occupied",
//         },
//       },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     if (!updatedApartment) {
//       return res.status(409).json({
//         success: false,
//         message: "The apartment assignment has changed. Please refresh and try again.",
//       });
//     }

//     // --------------------------------------------------
//     // UPDATE TENANT INFORMATION
//     // --------------------------------------------------

//     try {
//       tenant.block = apartment.block || null;
//       tenant.floor = apartment.floor || null;
//       tenant.apartment = apartment.apartmentNumber;

//       await tenant.save();
//     } catch (tenantError) {
//       // Roll back apartment assignment if tenant update fails.
//       await Apartment.findOneAndUpdate(
//         {
//           _id: apartment._id,
//           tenant: tenant._id,
//         },
//         {
//           $set: {
//             tenant: null,
//             status: "available",
//           },
//         }
//       );

//       throw tenantError;
//     }

//     // --------------------------------------------------
//     // RETURN UPDATED RECORD
//     // --------------------------------------------------

//     const result = await Apartment.findById(apartment._id)
//       .populate("property", "name address city state")
//       .populate("tenant", "fullName email phone");

//     return res.status(200).json({
//       success: true,
//       message: "Tenant assigned successfully.",
//       apartment: result,
//     });

//   } catch (error) {
//     console.error("Assign tenant error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Unable to assign tenant.",
//     });
//   }
// };


// // ======================================================
// // UNASSIGN TENANT
// // ======================================================

// const unassignTenant =
//   async (req, res) => {
//     try {
//       const apartment =
//         await Apartment.findById(
//           req.params.id
//         ).populate(
//           "property",
//           "landlord"
//         );

//       if (!apartment) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Apartment not found.",
//         });
//       }

//       if (!apartment.property) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "The property linked to this apartment no longer exists.",
//         });
//       }

//       if (
//         !isAdmin(req) &&
//         apartment.property.landlord.toString() !==
//           req.user._id.toString()
//       ) {
//         return res.status(403).json({
//           success: false,
//           message:
//             "You do not have permission to manage this apartment.",
//         });
//       }

//       if (!apartment.tenant) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "This apartment has no tenant.",
//         });
//       }

//       const tenantId =
//         apartment.tenant;

//       await User.findByIdAndUpdate(
//         tenantId,
//         {
//           block: null,
//           floor: null,
//           apartment: null,
//         }
//       );

//       apartment.tenant = null;
//       apartment.status =
//         "available";

//       await apartment.save();

//       return res.status(200).json({
//         success: true,
//         message:
//           "Tenant unassigned successfully.",
//       });
//     } catch (error) {
//       console.error(
//         "Unassign tenant error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Unable to unassign tenant.",
//       });
//     }
//   };
  

//   // ======================================================
// // GET ALL APARTMENTS (FOR ADMIN USAGE)
// // ======================================================
// const getAllApartmentsForAdmin = async (req, res) => {
//   try {
//     const apartments = await Apartment.find({})
//       .populate("property", "name address")
//       .populate("tenant", "fullName email phone")
//       .sort({ block: 1, floor: 1, apartmentNumber: 1 });

//     return res.status(200).json({
//       success: true,
//       count: apartments.length,
//       apartments,
//     });
//   } catch (error) {
//     console.error("Get all apartments for admin error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Unable to retrieve apartments.",
//     });
//   }
// };

//   // ======================================================
// // GET TENANT APARTMENT
// // ======================================================

// const getTenantApartment = async (req, res) => {
//   try {
//     const apartment = await Apartment.findOne({
//       tenant: req.user._id,
//     })
//       .populate(
//         "property",
//         "name address city state"
//       )
//       .populate(
//         "tenant",
//         "fullName email phone"
//       );

//     if (!apartment) {
//       return res.status(200).json({
//         success: true,
//         apartment: null,
//         message:
//           "No apartment has been assigned to your account.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       apartment,
//     });
//   } catch (error) {
//     console.error(
//       "Get tenant apartment error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Unable to retrieve your apartment information.",
//     });
//   }
// };


// // ======================================================
// // EXPORTS
// // ======================================================

// module.exports = {
//   createApartment,
//   getMyApartments,
//   getApartmentsByProperty,
//   getApartment,
//   updateApartment,
//   deleteApartment,
//   getAvailableTenants,
//   assignTenant,
//   unassignTenant,
// };






const Apartment = require("../models/Apartment");
const Property = require("../models/Property");
const User = require("../models/User");

// ======================================================
// HELPER
// ======================================================

const isAdmin = (req) => {
  return (
    req.user &&
    String(req.user.role || "").trim().toLowerCase() === "admin"
  );
};

// ======================================================
// CREATE APARTMENT
// ======================================================

const createApartment = async (req, res) => {
  try {
    const {
      property,
      apartmentNumber,
      block,
      floor,
      apartmentType,
      monthlyRent,
      serviceCharge,
      description,
    } = req.body;

    if (!property || !apartmentNumber) {
      return res.status(400).json({
        success: false,
        message: "Property and apartment number are required.",
      });
    }

    // VERIFY PROPERTY ACCESS
    const propertyQuery = { _id: property };

    if (!isAdmin(req)) {
      propertyQuery.landlord = req.user._id;
    }

    const propertyRecord = await Property.findOne(propertyQuery);

    if (!propertyRecord) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to use this property.",
      });
    }

    // CHECK DUPLICATE
    const existingApartment = await Apartment.findOne({
      property,
      block: block?.trim() || "",
      apartmentNumber: apartmentNumber.trim(),
    });

    if (existingApartment) {
      return res.status(409).json({
        success: false,
        message: "This apartment already exists in this property.",
      });
    }

    // CREATE
    const apartment = await Apartment.create({
      property,
      apartmentNumber: apartmentNumber.trim(),
      block: block?.trim() || "",
      floor: floor?.trim() || "",
      apartmentType: apartmentType || "2 Bedroom",
      monthlyRent: Number(monthlyRent) || 0,
      serviceCharge: Number(serviceCharge) || 0,
      description: description?.trim() || "",
      status: "available",
    });

    // UPDATE PROPERTY COUNT
    await Property.findByIdAndUpdate(property, {
      $inc: { numberOfApartments: 1 },
    });

    const populatedApartment = await Apartment.findById(apartment._id)
      .populate("property", "name address city state")
      .populate("tenant", "fullName email phone");

    return res.status(201).json({
      success: true,
      message: "Apartment created successfully.",
      apartment: populatedApartment,
    });
  } catch (error) {
    console.error("Create apartment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create apartment.",
    });
  }
};

// ======================================================
// GET LANDLORD APARTMENTS
// ======================================================

const getMyApartments = async (req, res) => {
  try {
    const properties = await Property.find({
      landlord: req.user._id,
    }).select("_id");

    const propertyIds = properties.map((property) => property._id);

    const apartments = await Apartment.find({
      property: { $in: propertyIds },
    })
      .populate("property", "name address city state")
      .populate("tenant", "fullName email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: apartments.length,
      apartments,
    });
  } catch (error) {
    console.error("Get apartments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve apartments.",
    });
  }
};

// ======================================================
// GET APARTMENTS BY PROPERTY
// ======================================================

const getApartmentsByProperty = async (req, res) => {
  try {
    const propertyQuery = {
      _id: req.params.propertyId,
    };

    if (!isAdmin(req)) {
      propertyQuery.landlord = req.user._id;
    }

    const property = await Property.findOne(propertyQuery);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const apartments = await Apartment.find({
      property: property._id,
    })
      .populate("tenant", "fullName email phone")
      .sort({
        block: 1,
        floor: 1,
        apartmentNumber: 1,
      });

    return res.status(200).json({
      success: true,
      apartments,
    });
  } catch (error) {
    console.error("Get property apartments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve apartments.",
    });
  }
};

// ======================================================
// GET SINGLE APARTMENT
// ======================================================

const getApartment = async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.params.id)
      .populate("property", "name address city state landlord")
      .populate("tenant", "fullName email phone");

    if (!apartment) {
      return res.status(404).json({
        success: false,
        message: "Apartment not found.",
      });
    }

    if (!apartment.property) {
      return res.status(404).json({
        success: false,
        message: "The property linked to this apartment no longer exists.",
      });
    }

    if (
      !isAdmin(req) &&
      apartment.property.landlord.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this apartment.",
      });
    }

    return res.status(200).json({
      success: true,
      apartment,
    });
  } catch (error) {
    console.error("Get apartment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve apartment.",
    });
  }
};

// ======================================================
// UPDATE APARTMENT
// ======================================================

const updateApartment = async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.params.id).populate(
      "property",
      "landlord"
    );

    if (!apartment) {
      return res.status(404).json({
        success: false,
        message: "Apartment not found.",
      });
    }

    if (!apartment.property) {
      return res.status(404).json({
        success: false,
        message: "The property linked to this apartment no longer exists.",
      });
    }

    if (
      !isAdmin(req) &&
      apartment.property.landlord.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this apartment.",
      });
    }

    const fields = [
      "apartmentNumber",
      "block",
      "floor",
      "apartmentType",
      "monthlyRent",
      "serviceCharge",
      "status",
      "description",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        apartment[field] =
          typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];
      }
    });

    if (req.body.monthlyRent !== undefined) {
      apartment.monthlyRent = Number(req.body.monthlyRent) || 0;
    }

    if (req.body.serviceCharge !== undefined) {
      apartment.serviceCharge = Number(req.body.serviceCharge) || 0;
    }

    await apartment.save();

    const updated = await Apartment.findById(apartment._id)
      .populate("property", "name address city state")
      .populate("tenant", "fullName email phone");

    return res.status(200).json({
      success: true,
      message: "Apartment updated successfully.",
      apartment: updated,
    });
  } catch (error) {
    console.error("Update apartment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update apartment.",
    });
  }
};

// ======================================================
// DELETE APARTMENT
// ======================================================

const deleteApartment = async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.params.id).populate(
      "property",
      "landlord"
    );

    if (!apartment) {
      return res.status(404).json({
        success: false,
        message: "Apartment not found.",
      });
    }

    if (!apartment.property) {
      return res.status(404).json({
        success: false,
        message: "The property linked to this apartment no longer exists.",
      });
    }

    if (
      !isAdmin(req) &&
      apartment.property.landlord.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this apartment.",
      });
    }

    if (apartment.tenant) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete an apartment assigned to a tenant. Unassign the tenant first.",
      });
    }

    await apartment.deleteOne();

    await Property.findByIdAndUpdate(apartment.property._id, {
      $inc: { numberOfApartments: -1 },
    });

    return res.status(200).json({
      success: true,
      message: "Apartment deleted successfully.",
    });
  } catch (error) {
    console.error("Delete apartment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete apartment.",
    });
  }
};

// ======================================================
// GET AVAILABLE TENANTS
// ======================================================

const getAvailableTenants = async (req, res) => {
  try {
    const tenants = await User.find({
      role: "tenant",
      isActive: true,
      $or: [
        { apartment: null },
        { apartment: "" },
        { apartment: { $exists: false } },
      ],
    }).select("fullName email phone block floor apartment");

    return res.status(200).json({
      success: true,
      tenants,
    });
  } catch (error) {
    console.error("Get available tenants error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve tenants.",
    });
  }
};

// ======================================================
// ASSIGN TENANT
// ======================================================

const assignTenant = async (req, res) => {
  try {
    const { tenantId, tenantEmail } = req.body;

    if (!tenantId && !tenantEmail) {
      return res.status(400).json({
        success: false,
        message: "Tenant ID or tenant email is required.",
      });
    }

    // FIND APARTMENT AND PROPERTY
    const apartment = await Apartment.findById(req.params.id).populate(
      "property",
      "landlord"
    );

    if (!apartment) {
      return res.status(404).json({
        success: false,
        message: "Apartment not found.",
      });
    }

    if (!apartment.property) {
      return res.status(404).json({
        success: false,
        message: "The property linked to this apartment no longer exists.",
      });
    }

    // VERIFY PERMISSION
    if (
      !isAdmin(req) &&
      String(apartment.property.landlord) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to assign this apartment.",
      });
    }

    // FIND TENANT
    let tenant;

    if (tenantId) {
      tenant = await User.findOne({
        _id: tenantId,
        role: "tenant",
        isActive: true,
      });
    } else {
      tenant = await User.findOne({
        email: tenantEmail.trim().toLowerCase(),
        role: "tenant",
        isActive: true,
      });
    }

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found or inactive.",
      });
    }

    // CHECK WHETHER APARTMENT HAS A REAL TENANT
    if (apartment.tenant) {
      const existingTenant = await User.findById(apartment.tenant);

      if (existingTenant) {
        return res.status(400).json({
          success: false,
          message: "This apartment already has a tenant.",
        });
      }

      // REPAIR STALE TENANT REFERENCE
      apartment.tenant = null;
    }

    // CHECK WHETHER TENANT IS ALREADY LINKED ELSEWHERE
    const existingAssignment = await Apartment.findOne({
      tenant: tenant._id,
      _id: { $ne: apartment._id },
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: "This tenant is already assigned to another apartment.",
      });
    }

    // CHECK APARTMENT STATUS
    if (
      apartment.status === "maintenance" ||
      apartment.status === "reserved"
    ) {
      return res.status(400).json({
        success: false,
        message: `This apartment cannot be assigned because its status is ${apartment.status}.`,
      });
    }

    // CLEAR STALE TENANT DETAILS
    if (
      tenant.apartment &&
      String(tenant.apartment).trim() !== ""
    ) {
      tenant.apartment = null;
      tenant.block = null;
      tenant.floor = null;
    }

    // ATOMIC APARTMENT ASSIGNMENT
    const updatedApartment = await Apartment.findOneAndUpdate(
      {
        _id: apartment._id,
        tenant: null,
        status: { $in: ["available", "occupied"] },
      },
      {
        $set: {
          tenant: tenant._id,
          status: "occupied",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedApartment) {
      return res.status(409).json({
        success: false,
        message:
          "The apartment assignment has changed. Please refresh and try again.",
      });
    }

    // UPDATE TENANT INFORMATION
    try {
      tenant.block = apartment.block || null;
      tenant.floor = apartment.floor || null;
      tenant.apartment = apartment.apartmentNumber;

      await tenant.save();
    } catch (tenantError) {
      // ROLL BACK APARTMENT ASSIGNMENT IF TENANT UPDATE FAILS
      await Apartment.findOneAndUpdate(
        {
          _id: apartment._id,
          tenant: tenant._id,
        },
        {
          $set: {
            tenant: null,
            status: "available",
          },
        }
      );

      throw tenantError;
    }

    // RETURN UPDATED RECORD
    const result = await Apartment.findById(apartment._id)
      .populate("property", "name address city state")
      .populate("tenant", "fullName email phone");

    return res.status(200).json({
      success: true,
      message: "Tenant assigned successfully.",
      apartment: result,
    });
  } catch (error) {
    console.error("Assign tenant error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to assign tenant.",
    });
  }
};

// ======================================================
// UNASSIGN TENANT
// ======================================================

const unassignTenant = async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.params.id).populate(
      "property",
      "landlord"
    );

    if (!apartment) {
      return res.status(404).json({
        success: false,
        message: "Apartment not found.",
      });
    }

    if (!apartment.property) {
      return res.status(404).json({
        success: false,
        message: "The property linked to this apartment no longer exists.",
      });
    }

    if (
      !isAdmin(req) &&
      apartment.property.landlord.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to manage this apartment.",
      });
    }

    if (!apartment.tenant) {
      return res.status(400).json({
        success: false,
        message: "This apartment has no tenant.",
      });
    }

    const tenantId = apartment.tenant;

    await User.findByIdAndUpdate(tenantId, {
      block: null,
      floor: null,
      apartment: null,
    });

    apartment.tenant = null;
    apartment.status = "available";

    await apartment.save();

    return res.status(200).json({
      success: true,
      message: "Tenant unassigned successfully.",
    });
  } catch (error) {
    console.error("Unassign tenant error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to unassign tenant.",
    });
  }
};

// ======================================================
// GET ALL APARTMENTS (FOR ADMIN USAGE)
// ======================================================

const getAllApartmentsForAdmin = async (req, res) => {
  try {
    const apartments = await Apartment.find({})
      .populate("property", "name address")
      .populate("tenant", "fullName email phone")
      .sort({
        block: 1,
        floor: 1,
        apartmentNumber: 1,
      });

    return res.status(200).json({
      success: true,
      count: apartments.length,
      apartments,
    });
  } catch (error) {
    console.error("Get all apartments for admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve apartments.",
    });
  }
};

// ======================================================
// GET TENANT APARTMENT
// ======================================================

const getTenantApartment = async (req, res) => {
  try {
    const apartment = await Apartment.findOne({
      tenant: req.user._id,
    })
      .populate("property", "name address city state")
      .populate("tenant", "fullName email phone");

    if (!apartment) {
      return res.status(200).json({
        success: true,
        apartment: null,
        message: "No apartment has been assigned to your account.",
      });
    }

    return res.status(200).json({
      success: true,
      apartment,
    });
  } catch (error) {
    console.error("Get tenant apartment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your apartment information.",
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createApartment,
  getMyApartments,
  getApartmentsByProperty,
  getApartment,
  updateApartment,
  deleteApartment,
  getAvailableTenants,
  assignTenant,
  unassignTenant,
  getAllApartmentsForAdmin,
  getTenantApartment,
};