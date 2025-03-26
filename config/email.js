const nodemailer = require("nodemailer");

// Create email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `DXpress Courier <${process.env.EMAIL_USERNAME}>`,
      to: to,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

// Send welcome email to new newsletter subscribers
const sendWelcomeEmail = async (email) => {
  const subject = "Welcome to DXpress Newsletter";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://dxpress.com/assets/images/logo/logo.png" alt="DXpress Logo" style="max-width: 150px;">
      </div>
      <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Thank You for Subscribing!</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 15px;">
        Dear Subscriber,
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 15px;">
        Thank you for subscribing to our newsletter. We're excited to have you join our community!
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 15px;">
        You'll now receive regular updates on:
      </p>
      <ul style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px;">
        <li>New shipping services and offerings</li>
        <li>Discounts and promotions</li>
        <li>Shipping tips and best practices</li>
        <li>Industry news and updates</li>
      </ul>
      <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 15px;">
        If you have any questions or need assistance, please don't hesitate to contact us.
      </p>
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 14px; color: #999;">
          © ${new Date().getFullYear()} DXpress Courier. All rights reserved.
        </p>
        <p style="font-size: 14px; color: #999;">
          If you wish to unsubscribe, please <a href="https://dxpress.com/unsubscribe?email=${email}" style="color: #555;">click here</a>.
        </p>
      </div>
    </div>
  `;

  return await sendEmail(email, subject, html);
};

module.exports = {
  transporter,
  sendEmail,
  sendWelcomeEmail,
};
