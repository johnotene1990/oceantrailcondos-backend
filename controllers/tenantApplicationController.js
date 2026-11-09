const TenantApplication = require("../models/TenantApplication");
const sendEmail = require("../utils/sendEmail");

// Submit new application
const submitApplication = async (req, res) => {
  try {
    const applicationData = req.body;

    const newApplication = await TenantApplication.create(applicationData);

    if (process.env.SMTP_USER) {
      try {
        await sendEmail({
          to: process.env.SMTP_USER,
          subject: `New Tenant & Guarantor Application - ${newApplication.applicantName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #4B4F93;">Ocean Trail Condominium</h2>
              <h3>New Tenant Application Submitted</h3>
              <p><strong>Applicant Name:</strong> ${newApplication.applicantName}</p>
              <p><strong>Email:</strong> ${newApplication.email}</p>
              <p><strong>Phone:</strong> ${newApplication.phone}</p>
              <p><strong>Guarantor Name:</strong> ${newApplication.guarantorName}</p>
               <p><strong>Email:</strong> ${newApplication.guarantorgemail}</p>
              <p><strong>Phone:</strong> ${newApplication.guarantorphone}</p>
              <p><strong>Address:</strong> ${newApplication.guarantoraddress}</p>
              <p>Please check your admin dashboard to review this submission.</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.error("Admin notification email error:", mailErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Application and guarantor form successfully submitted to management.",
      data: newApplication,
    });
  } catch (error) {
    console.error("Error submitting tenant application:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving application form.",
    });
  }
};

// Get all applications for Admin Dashboard
const getApplications = async (req, res) => {
  try {
    const applications = await TenantApplication.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching tenant applications:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching applications.",
    });
  }
};

module.exports = {
  submitApplication,
  getApplications,
};