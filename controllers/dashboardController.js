const Property = require(
  "../models/Property"
);

const Apartment = require(
  "../models/Apartment"
);

const Complaint = require(
  "../models/Complaint"
);

const RepairRequest = require(
  "../models/RepairRequest"
);

const ServiceCharge = require(
  "../models/ServiceCharge"
);

const UtilityBill = require(
  "../models/UtilityBill"
);

const Payment = require(
  "../models/Payment"
);

const Notification = require(
  "../models/Notification"
);

// ==========================================
// TENANT
// ==========================================

const getTenantStats =
  async (req, res) => {
    try {
      const tenantId =
        req.user._id;

      const apartment =
        await Apartment.findOne({
          tenant:
            tenantId,
        });

      const openComplaints =
        await Complaint.countDocuments({
          tenant: tenantId,
          status: {
            $nin: [
              "Resolved",
              "Closed",
            ],
          },
        });

      const openRepairs =
        await RepairRequest.countDocuments({
          tenant: tenantId,
          status: {
            $nin: [
              "Completed",
              "Cancelled",
            ],
          },
        });

      const outstandingServiceCharges =
        await ServiceCharge.aggregate([
          {
            $match: {
              tenant: tenantId,
              status: {
                $in: [
                  "pending",
                  "overdue",
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$amount",
              },
            },
          },
        ]);

      const outstandingUtilities =
        await UtilityBill.aggregate([
          {
            $match: {
              tenant: tenantId,
              status: {
                $in: [
                  "unpaid",
                  "recharge_failed",
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$amount",
              },
            },
          },
        ]);

      const paymentTotal =
        await Payment.aggregate([
          {
            $match: {
              tenant: tenantId,
              status:
                "successful",
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$amount",
              },
            },
          },
        ]);

      const unreadNotifications =
        await Notification.countDocuments({
          recipient: tenantId,
          readAt: null,
        });

      return res.status(200).json({
        success: true,
        stats: {
          apartment:
            apartment || null,

          openComplaints,

          openRepairs,

          outstandingServiceCharges:
            outstandingServiceCharges[0]
              ?.total || 0,

          outstandingUtilities:
            outstandingUtilities[0]
              ?.total || 0,

          totalPayments:
            paymentTotal[0]?.total ||
            0,

          unreadNotifications,
        },
      });
    } catch (error) {
      console.error(
        "Tenant dashboard stats error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load dashboard statistics.",
      });
    }
  };

// ==========================================
// LANDLORD
// ==========================================

const getLandlordStats =
  async (req, res) => {
    try {
      const landlordId =
        req.user._id;

      const properties =
        await Property.find({
          landlord:
            landlordId,
        }).select("_id");

      const propertyIds =
        properties.map(
          (item) => item._id
        );

      const apartments =
        await Apartment.countDocuments({
          property: {
            $in: propertyIds,
          },
        });

      const occupied =
        await Apartment.countDocuments({
          property: {
            $in: propertyIds,
          },
          status:
            "occupied",
        });

      const tenants =
        await Apartment.countDocuments({
          property: {
            $in: propertyIds,
          },
          tenant: {
            $ne: null,
          },
        });

      const complaints =
        await Complaint.countDocuments({
          landlord:
            landlordId,
          status: {
            $nin: [
              "Resolved",
              "Closed",
            ],
          },
        });

      const repairs =
        await RepairRequest.countDocuments({
          landlord:
            landlordId,
          status: {
            $nin: [
              "Completed",
              "Cancelled",
            ],
          },
        });

      const outstandingCharges =
        await ServiceCharge.aggregate([
          {
            $match: {
              landlord:
                landlordId,
              status: {
                $in: [
                  "pending",
                  "overdue",
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$amount",
              },
            },
          },
        ]);

      const successfulPayments =
        await Payment.aggregate([
          {
            $match: {
              landlord:
                landlordId,
              status:
                "successful",
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$amount",
              },
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        stats: {
          properties:
            properties.length,

          apartments,

          occupied,

          vacant:
            apartments -
            occupied,

          tenants,

          openComplaints:
            complaints,

          openRepairs:
            repairs,

          outstandingCharges:
            outstandingCharges[0]
              ?.total || 0,

          successfulPayments:
            successfulPayments[0]
              ?.total || 0,
        },
      });
    } catch (error) {
      console.error(
        "Landlord dashboard stats error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load dashboard statistics.",
      });
    }
  };

module.exports = {
  getTenantStats,
  getLandlordStats,
};