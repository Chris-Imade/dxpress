const Contact = require("../models/Contact");
const nodemailer = require("nodemailer");

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Add timeout settings to give more time for connection
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
});

// Email templates
const userReceiptTemplate = (name) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a237e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; background-color: #f5f5f5; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thank You for Contacting DXpress</h1>
        </div>
        <div class="content">
            <p>Dear ${name},</p>
            <p>Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
            <p>Our team typically responds within 24 hours during business days.</p>
            <p>If you have any urgent inquiries, please don't hesitate to call us at +44 7506 323070.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The DXpress Team</p>
        </div>
    </div>
</body>
</html>
`;

const adminNotificationTemplate = (formData) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a237e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; background-color: #f5f5f5; }
        .form-data { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Contact Form Submission</h1>
        </div>
        <div class="content">
            <p>A new contact form submission has been received:</p>
            <div class="form-data">
                <p><strong>Name:</strong> ${formData.name}</p>
                <p><strong>Email:</strong> ${formData.email}</p>
                <p><strong>Phone:</strong> ${formData.phone}</p>
                <p><strong>Subject:</strong> ${formData.subject}</p>
                <p><strong>Message:</strong></p>
                <p>${formData.message}</p>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated message from the DXpress contact form.</p>
        </div>
    </div>
</body>
</html>
`;

exports.getContactPage = (req, res) => {
  res.render("contact", {
    title: "Contact Us",
    path: "/contact",
    successMessage: null,
    errorMessage: null,
    formData: {},
  });
};

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Check if the request is expecting JSON (AJAX)
    const isAjax = req.xhr || req.headers.accept.indexOf("json") > -1;

    // Validate input
    if (!name || !email || !phone || !subject || !message) {
      if (isAjax) {
        return res.status(400).json({
          success: false,
          message: "Please fill in all required fields",
        });
      } else {
        return res.render("contact", {
          title: "Contact Us",
          path: "/contact",
          successMessage: null,
          errorMessage: "Please fill in all required fields",
          formData: req.body,
        });
      }
    }

    // Create new contact
    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message,
    });

    // Save to database
    await contact.save();

    try {
      // Send receipt to user
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Thank You for Contacting DXpress",
        html: userReceiptTemplate(name),
      });

      // Send notification to admin
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: "support@dxpress.uk",
        subject: "New Contact Form Submission",
        html: adminNotificationTemplate({
          name,
          email,
          phone,
          subject,
          message,
        }),
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Continue processing even if email fails
      // Don't throw the error here, just log it and continue
    }

    if (isAjax) {
      return res.status(200).json({
        success: true,
        message:
          "Your message has been sent successfully! We will contact you soon.",
      });
    } else {
      // Render contact page with success message
      return res.render("contact", {
        title: "Contact Us",
        path: "/contact",
        successMessage:
          "Your message has been sent successfully! We will contact you soon.",
        errorMessage: null,
        formData: {},
      });
    }
  } catch (error) {
    console.error("Error submitting contact form:", error);

    // Check if the request is expecting JSON (AJAX)
    const isAjax = req.xhr || req.headers.accept.indexOf("json") > -1;

    if (isAjax) {
      return res.status(500).json({
        success: false,
        message:
          "An error occurred while sending your message. Please try again.",
      });
    } else {
      return res.render("contact", {
        title: "Contact Us",
        path: "/contact",
        successMessage: null,
        errorMessage:
          "An error occurred while sending your message. Please try again.",
        formData: req.body,
      });
    }
  }
};
