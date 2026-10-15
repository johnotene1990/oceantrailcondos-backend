// backend/services/notificationService.js
const nodemailer = require('nodemailer');

// Email Transporter Configuration (SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send Token via Email to Tenant and Admin
 */
const sendTokenEmail = async ({ email, tenantName, token, units, meterNumber, amount }) => {
  try {
    if (!email) throw new Error("Target tenant email address is missing");

    const formattedAmount = Number(amount || 0).toLocaleString();
    const companyEmail = process.env.COMPANY_EMAIL || process.env.SMTP_USER;

    // 1. Send Email to Tenant
    const tenantMailOptions = {
      from: `"Ocean Trail Estate" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Electricity Token - Ocean Trail Estate',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b; margin-top: 0;">Hello ${tenantName || 'Resident'},</h2>
          <p style="color: #475569; font-size: 15px;">Your electricity payment of <strong>₦${formattedAmount}</strong> was successful and verified.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; margin: 24px 0;">
            <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold; letter-spacing: 1px;">ELECTRICITY TOKEN</p>
            <h1 style="margin: 10px 0; font-size: 30px; letter-spacing: 3px; color: #059669; font-family: 'Courier New', monospace;">${token}</h1>
            <p style="margin: 0; font-size: 14px; color: #475569;">Units: <strong>${units || 0} kWh</strong> | Meter: <strong>${meterNumber}</strong></p>
          </div>

          <p style="color: #64748b; font-size: 13px;">Key in this code into your smart meter keypad. Thank you for choosing Ocean Trail Estate.</p>
        </div>
      `,
    };

    // 2. Send Admin Copy Notification
    const adminMailOptions = {
      from: `"Ocean Trail System" <${process.env.SMTP_USER}>`,
      to: companyEmail,
      subject: `[ADMIN COPY] Generated Token for Meter #${meterNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px; max-width: 600px;">
          <h3 style="color: #0f172a; margin-top: 0;">Electricity Token Dispatch Audit Log</h3>
          <p style="font-size: 14px; color: #334155;">A new smart meter token has been generated and issued to the tenant.</p>
          
          <table style="width: 100%; text-align: left; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
            <tr><th style="padding: 6px 0; color: #64748b;">Tenant Name:</th><td>${tenantName || 'Resident'}</td></tr>
            <tr><th style="padding: 6px 0; color: #64748b;">Tenant Email:</th><td>${email}</td></tr>
            <tr><th style="padding: 6px 0; color: #64748b;">Meter Number:</th><td>${meterNumber}</td></tr>
            <tr><th style="padding: 6px 0; color: #64748b;">Amount Paid:</th><td>₦${formattedAmount}</td></tr>
            <tr><th style="padding: 6px 0; color: #64748b;">Generated Units:</th><td>${units || 0} kWh</td></tr>
            <tr><th style="padding: 6px 0; color: #64748b;">Token Code:</th><td><strong style="color: #059669;">${token}</strong></td></tr>
          </table>
        </div>
      `,
    };

    // Send both emails concurrently
    await Promise.all([
      transporter.sendMail(tenantMailOptions),
      transporter.sendMail(adminMailOptions),
    ]);

    console.log(`[EMAIL] Token sent successfully to tenant (${email}) and copy sent to admin (${companyEmail})`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL DISPATCH ERROR]', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * General Estate Service Notifications via Email
 */
const sendEstateNotificationEmail = async ({ email, subject, title, message, tenantName }) => {
  try {
    if (!email) return { success: false, error: "No email provided" };

    const mailOptions = {
      from: `"Ocean Trail Estate" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject || 'Ocean Trail Estate Notification',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a56db;">${title || 'Estate Update'}</h2>
          <p>Hello <strong>${tenantName || 'Resident'}</strong>,</p>
          <div style="font-size: 15px; color: #333; line-height: 1.6; margin: 15px 0;">
            ${message}
          </div>
          <p style="font-size: 12px; color: #777;">Ocean Trail Estate Management</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('[GENERAL EMAIL ERROR]', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendTokenEmail,
  sendEstateNotificationEmail,
};