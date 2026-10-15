const Property = require("../models/Property");
const Apartment = require("../models/Apartment");
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
// CREATE PROPERTY
// LANDLORD
// ======================================================

const createProperty = async (req, res) => {
  try {
    const {
      name,
      propertyType,
      address,
      city,
      state,
      description,
      numberOfBlocks,
      contactPhone,
      contactEmail,
    } = req.body;

    if (!name || !address || !city || !state) {
      return res.status(400).json({
        success: false,
        message:
          "Property name, address, city and state are required.",
      });
    }

    const property = await Property.create({
      landlord: req.user._id,
      name: name.trim(),
      propertyType: propertyType || "Condominium",
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      description: description?.trim() || "",
      numberOfBlocks: Number(numberOfBlocks) || 1,
      contactPhone: contactPhone?.trim() || "",
      contactEmail:
        contactEmail?.trim().toLowerCase() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Property created successfully.",
      property,
    });
  } catch (error) {
    console.error("Create property error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create property.",
    });
  }
};


// ======================================================
// GET LANDLORD PROPERTIES
// ======================================================

const getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      landlord: req.user._id,
    }).sort({
      createdAt: -1,
    });

    const propertiesWithCounts = await Promise.all(
      properties.map(async (property) => {
        const apartmentCount =
          await Apartment.countDocuments({
            property: property._id,
          });

        const occupiedCount =
          await Apartment.countDocuments({
            property: property._id,
            status: "occupied",
          });

        const availableCount =
          await Apartment.countDocuments({
            property: property._id,
            status: "available",
          });

        return {
          ...property.toObject(),
          apartmentCount,
          occupiedCount,
          availableCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: properties.length,
      properties: propertiesWithCounts,
    });
  } catch (error) {
    console.error("Get properties error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve properties.",
    });
  }
};


// ======================================================
// GET SINGLE PROPERTY
// LANDLORD
// ======================================================

const getProperty = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      landlord: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const apartments = await Apartment.find({
      property: property._id,
    })
      .populate(
        "tenant",
        "fullName email phone"
      )
      .sort({
        block: 1,
        floor: 1,
        apartmentNumber: 1,
      });

    return res.status(200).json({
      success: true,
      property,
      apartments,
    });
  } catch (error) {
    console.error("Get property error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve property.",
    });
  }
};


// ======================================================
// UPDATE PROPERTY
// LANDLORD
// ======================================================

const updateProperty = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      landlord: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const allowedFields = [
      "name",
      "propertyType",
      "address",
      "city",
      "state",
      "description",
      "numberOfBlocks",
      "status",
      "contactPhone",
      "contactEmail",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        property[field] =
          typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];
      }
    });

    if (property.contactEmail) {
      property.contactEmail =
        property.contactEmail.toLowerCase();
    }

    await property.save();

    return res.status(200).json({
      success: true,
      message: "Property updated successfully.",
      property,
    });
  } catch (error) {
    console.error("Update property error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update property.",
    });
  }
};


// ======================================================
// DELETE PROPERTY
// LANDLORD
// ======================================================

const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      landlord: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const apartmentCount =
      await Apartment.countDocuments({
        property: property._id,
      });

    if (apartmentCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete a property that still has apartments. Delete the apartments first.",
      });
    }

    await property.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Property deleted successfully.",
    });
  } catch (error) {
    console.error("Delete property error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete property.",
    });
  }
};


// ======================================================
// LANDLORD DASHBOARD STATISTICS
// ======================================================

const getPropertyStats = async (req, res) => {
  try {
    const properties = await Property.find({
      landlord: req.user._id,
    }).select("_id");

    const propertyIds = properties.map(
      (property) => property._id
    );

    const totalProperties = propertyIds.length;

    const totalApartments =
      await Apartment.countDocuments({
        property: {
          $in: propertyIds,
        },
      });

    const occupiedApartments =
      await Apartment.countDocuments({
        property: {
          $in: propertyIds,
        },
        status: "occupied",
      });

    const availableApartments =
      await Apartment.countDocuments({
        property: {
          $in: propertyIds,
        },
        status: "available",
      });

    return res.status(200).json({
      success: true,
      stats: {
        totalProperties,
        totalApartments,
        occupiedApartments,
        availableApartments,
      },
    });
  } catch (error) {
    console.error(
      "Property statistics error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve property statistics.",
    });
  }
};


// ======================================================
// ADMIN CREATE PROPERTY + APARTMENTS
// ======================================================

const adminCreateProperty = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Administrator access required.",
      });
    }

    const {
      name,
      propertyType,
      address,
      city,
      state,
      description,
      numberOfBlocks,
      contactPhone,
      contactEmail,
      apartments,
      landlordId,
    } = req.body;

    if (!name || !address || !city || !state) {
      return res.status(400).json({
        success: false,
        message:
          "Property name, address, city and state are required.",
      });
    }

    /*
      Property.landlord is required by the existing model.

      If a landlordId is supplied, verify that user exists.
      Otherwise the administrator becomes the landlord reference.
      This keeps the database relationship valid.
    */

    let landlord = req.user._id;

    if (landlordId) {
      const landlordUser = await User.findOne({
        _id: landlordId,
        role: "landlord",
        isActive: true,
      });

      if (!landlordUser) {
        return res.status(400).json({
          success: false,
          message:
            "The selected landlord was not found or is not active.",
        });
      }

      landlord = landlordUser._id;
    }

    const property = await Property.create({
      landlord,
      name: name.trim(),
      propertyType:
        propertyType || "Condominium",
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      description:
        description?.trim() || "",
      numberOfBlocks:
        Number(numberOfBlocks) || 1,
      numberOfApartments: 0,
      contactPhone:
        contactPhone?.trim() || "",
      contactEmail:
        contactEmail?.trim().toLowerCase() || "",
    });

    const createdApartments = [];
    const tenantWarnings = [];

    if (Array.isArray(apartments)) {
      for (const apartmentData of apartments) {
        if (
          !apartmentData ||
          !apartmentData.apartmentNumber
        ) {
          continue;
        }

        const apartmentNumber =
          String(
            apartmentData.apartmentNumber
          ).trim();

        const block =
          String(
            apartmentData.block || ""
          ).trim();

        const existingApartment =
          await Apartment.findOne({
            property: property._id,
            block,
            apartmentNumber,
          });

        if (existingApartment) {
          continue;
        }

        let tenantId = null;

        const tenantEmail =
          apartmentData.occupantEmail
            ?.trim()
            .toLowerCase();

        const tenantIdFromRequest =
          apartmentData.tenantId;

        if (tenantIdFromRequest) {
          const tenant = await User.findOne({
            _id: tenantIdFromRequest,
            role: "tenant",
            isActive: true,
          });

          if (tenant) {
            tenantId = tenant._id;
          }
        } else if (tenantEmail) {
          const tenant = await User.findOne({
            email: tenantEmail,
            role: "tenant",
            isActive: true,
          });

          if (tenant) {
            tenantId = tenant._id;
          } else {
            tenantWarnings.push(
              `Tenant ${tenantEmail} was not found. Apartment ${apartmentNumber} was created without tenant assignment.`
            );
          }
        }

        const apartment =
          await Apartment.create({
            property: property._id,
            apartmentNumber,
            block,
            floor:
              String(
                apartmentData.floor || ""
              ).trim(),
            apartmentType:
              apartmentData.apartmentType ||
              "2 Bedroom",
            monthlyRent:
              Number(
                apartmentData.monthlyRent
              ) || 0,
            serviceCharge:
              Number(
                apartmentData.serviceCharge
              ) || 0,
            description:
              apartmentData.description
                ?.trim() || "",
            tenant: tenantId,
            status: tenantId
              ? "occupied"
              : "available",
          });

        if (tenantId) {
          await User.findByIdAndUpdate(
            tenantId,
            {
              block:
                apartment.block || null,
              floor:
                apartment.floor || null,
              apartment:
                apartment.apartmentNumber,
            }
          );
        }

        createdApartments.push(apartment);
      }
    }

    property.numberOfApartments =
      await Apartment.countDocuments({
        property: property._id,
      });

    await property.save();

    const populatedProperty =
      await Property.findById(
        property._id
      );

    const populatedApartments =
      await Apartment.find({
        property: property._id,
      })
        .populate(
          "tenant",
          "fullName email phone"
        )
        .sort({
          block: 1,
          floor: 1,
          apartmentNumber: 1,
        });

    return res.status(201).json({
      success: true,
      message:
        tenantWarnings.length > 0
          ? "Property and apartments saved, but some tenant assignments require attention."
          : "Property and apartments saved successfully.",
      property: populatedProperty,
      apartments: populatedApartments,
      warnings: tenantWarnings,
    });
  } catch (error) {
    console.error(
      "Admin create property error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to create property.",
    });
  }
};


// ======================================================
// ADMIN GET ALL PROPERTIES
// ======================================================

const adminGetProperties = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Administrator access required.",
      });
    }

    const properties =
      await Property.find({})
        .populate(
          "landlord",
          "fullName email phone"
        )
        .sort({
          createdAt: -1,
        });

    const results = await Promise.all(
      properties.map(async (property) => {
        const apartments =
          await Apartment.find({
            property: property._id,
          })
            .populate(
              "tenant",
              "fullName email phone"
            )
            .sort({
              block: 1,
              floor: 1,
              apartmentNumber: 1,
            });

        return {
          ...property.toObject(),
          apartments,
          apartmentCount:
            apartments.length,
          occupiedCount:
            apartments.filter(
              (item) =>
                item.status === "occupied"
            ).length,
          availableCount:
            apartments.filter(
              (item) =>
                item.status === "available"
            ).length,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: results.length,
      properties: results,
    });
  } catch (error) {
    console.error(
      "Admin get properties error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve properties.",
    });
  }
};


// ======================================================
// ADMIN GET SINGLE PROPERTY
// ======================================================

const adminGetProperty = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Administrator access required.",
      });
    }

    const property =
      await Property.findById(
        req.params.id
      ).populate(
        "landlord",
        "fullName email phone"
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const apartments =
      await Apartment.find({
        property: property._id,
      })
        .populate(
          "tenant",
          "fullName email phone"
        )
        .sort({
          block: 1,
          floor: 1,
          apartmentNumber: 1,
        });

    return res.status(200).json({
      success: true,
      property,
      apartments,
    });
  } catch (error) {
    console.error(
      "Admin get property error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve property.",
    });
  }
};


// ======================================================
// ADMIN UPDATE PROPERTY + APARTMENTS
// ======================================================

const adminUpdateProperty = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Administrator access required.",
      });
    }

    const property =
      await Property.findById(
        req.params.id
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const propertyFields = [
      "name",
      "propertyType",
      "address",
      "city",
      "state",
      "description",
      "numberOfBlocks",
      "status",
      "contactPhone",
      "contactEmail",
    ];

    propertyFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        property[field] =
          typeof req.body[field] ===
          "string"
            ? req.body[field].trim()
            : req.body[field];
      }
    });

    if (property.contactEmail) {
      property.contactEmail =
        property.contactEmail.toLowerCase();
    }

    if (req.body.landlordId) {
      const landlord =
        await User.findOne({
          _id: req.body.landlordId,
          role: "landlord",
          isActive: true,
        });

      if (!landlord) {
        return res.status(400).json({
          success: false,
          message:
            "The selected landlord was not found or is not active.",
        });
      }

      property.landlord =
        landlord._id;
    }

    await property.save();

    /*
      Update supplied apartments.

      We intentionally do NOT automatically delete
      apartments that are missing from the request.
      This prevents accidental deletion of existing
      property records.
    */

    if (
      Array.isArray(req.body.apartments)
    ) {
      for (const apartmentData of
        req.body.apartments) {

        if (
          !apartmentData ||
          !apartmentData.apartmentNumber
        ) {
          continue;
        }

        let apartment = null;

        if (apartmentData.id) {
          apartment =
            await Apartment.findOne({
              _id: apartmentData.id,
              property: property._id,
            });
        }

        if (!apartment) {
          const apartmentNumber =
            String(
              apartmentData.apartmentNumber
            ).trim();

          const block =
            String(
              apartmentData.block || ""
            ).trim();

          apartment =
            await Apartment.findOne({
              property: property._id,
              block,
              apartmentNumber,
            });
        }

        if (!apartment) {
          apartment =
            new Apartment({
              property:
                property._id,
            });
        }

        apartment.apartmentNumber =
          String(
            apartmentData.apartmentNumber
          ).trim();

        apartment.block =
          String(
            apartmentData.block || ""
          ).trim();

        apartment.floor =
          String(
            apartmentData.floor || ""
          ).trim();

        apartment.apartmentType =
          apartmentData.apartmentType ||
          "2 Bedroom";

        apartment.monthlyRent =
          Number(
            apartmentData.monthlyRent
          ) || 0;

        apartment.serviceCharge =
          Number(
            apartmentData.serviceCharge
          ) || 0;

        apartment.description =
          apartmentData.description
            ?.trim() || "";

        /*
          Tenant assignment.
        */

        let tenantId =
          apartment.tenant || null;

        const tenantEmail =
          apartmentData.occupantEmail
            ?.trim()
            .toLowerCase();

        if (
          apartmentData.tenantId
        ) {
          const tenant =
            await User.findOne({
              _id:
                apartmentData.tenantId,
              role: "tenant",
              isActive: true,
            });

          if (tenant) {
            tenantId = tenant._id;
          }
        } else if (tenantEmail) {
          const tenant =
            await User.findOne({
              email: tenantEmail,
              role: "tenant",
              isActive: true,
            });

          if (tenant) {
            tenantId = tenant._id;
          }
        }

        apartment.tenant =
          tenantId;

        apartment.status =
          tenantId
            ? "occupied"
            : "available";

        await apartment.save();

        if (tenantId) {
          await User.findByIdAndUpdate(
            tenantId,
            {
              block:
                apartment.block ||
                null,
              floor:
                apartment.floor ||
                null,
              apartment:
                apartment.apartmentNumber,
            }
          );
        }
      }
    }

    property.numberOfApartments =
      await Apartment.countDocuments({
        property: property._id,
      });

    await property.save();

    const updatedProperty =
      await Property.findById(
        property._id
      ).populate(
        "landlord",
        "fullName email phone"
      );

    const updatedApartments =
      await Apartment.find({
        property: property._id,
      })
        .populate(
          "tenant",
          "fullName email phone"
        )
        .sort({
          block: 1,
          floor: 1,
          apartmentNumber: 1,
        });

    return res.status(200).json({
      success: true,
      message:
        "Property and apartment records updated successfully.",
      property: updatedProperty,
      apartments: updatedApartments,
    });
  } catch (error) {
    console.error(
      "Admin update property error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to update property.",
    });
  }
};


// ======================================================
// ADMIN DELETE PROPERTY
// ======================================================

const adminDeleteProperty = async (
  req,
  res
) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Administrator access required.",
      });
    }

    const property =
      await Property.findById(
        req.params.id
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const apartments =
      await Apartment.find({
        property: property._id,
      });

    const occupied =
      apartments.some(
        (apartment) =>
          apartment.tenant
      );

    if (occupied) {
      return res.status(400).json({
        success: false,
        message:
          "This property has apartments assigned to tenants. Unassign the tenants before deleting the property.",
      });
    }

    await Apartment.deleteMany({
      property: property._id,
    });

    await property.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Property and its apartments were deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Admin delete property error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete property.",
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createProperty,
  getMyProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  getPropertyStats,

  adminCreateProperty,
  adminGetProperties,
  adminGetProperty,
  adminUpdateProperty,
  adminDeleteProperty,
};