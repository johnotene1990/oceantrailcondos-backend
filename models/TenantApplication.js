const mongoose = require("mongoose");

const tenantApplicationSchema = new mongoose.Schema(
  {
    applicantName: { type: String, required: true },
    dob: { type: String, required: true },
    sex: { type: String, required: true },
    maritalStatus: { type: String, required: true },
    contactAddress: { type: String, required: true },
    postalAddress: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    city: { type: String, required: true },
    stateOfOrigin: { type: String, required: true },
    phone: { type: String, required: true },

    nextOfKinName: { type: String, required: true },
    nextOfKinRelationship: { type: String, required: true },
    nextOfKinPhone: { type: String, required: true },

    employmentType: { type: String, required: true },
    employerName: { type: String, required: true },
    employerPhone: { type: String, required: true },
    employerAddress: { type: String, required: true },
    lengthOfService: { type: String, required: true },

    refereeName: { type: String, required: true },
    refereeAddress: { type: String, required: true },
    refereeEmployer: { type: String, required: true },
    refereePhone: { type: String, required: true },
    refereeEmployerAddress: { type: String, required: true },
    refereeLengthOfService: { type: String, required: true },
    refereeDesignation: { type: String, required: true },

    guarantorName: { type: String, required: true },
    guarantorDob: { type: String, required: true },
    guarantorSex: { type: String, required: true },
    guarantorMaritalStatus: { type: String, required: true },
    guarantorAddress: { type: String, required: true },
    guarantorEmail: { type: String, required: true },
    guarantorCity: { type: String, required: true },
    guarantorStateOfOrigin: { type: String, required: true },
    guarantorPhone: { type: String, required: true },
    guarantorOccupation: { type: String, required: true },
    guarantorEmployer: { type: String, required: true },
    guarantorEmployerAddress: { type: String, required: true },
    guarantorRelationship: { type: String, required: true },

    acknowledgementName: { type: String, required: true },
    electronicSignature: { type: String, required: true },
    acknowledgementDate: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TenantApplication", tenantApplicationSchema);