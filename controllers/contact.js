const Contact = require("../models/Contact");

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

    // Render contact page with success message
    res.render("contact", {
      title: "Contact Us",
      path: "/contact",
      successMessage:
        "Your message has been sent successfully! We will contact you soon.",
      errorMessage: null,
      formData: {},
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.render("contact", {
      title: "Contact Us",
      path: "/contact",
      successMessage: null,
      errorMessage:
        "An error occurred while sending your message. Please try again.",
      formData: req.body,
    });
  }
};

exports.postContactForm = (req, res) => {
  // In a real application, you would process the form data here
  // For example, saving to database, sending an email, etc.

  const { name, email, phone, subject, message } = req.body;

  // For demonstration, we're just redirecting with a success message
  res.render("contact", {
    title: "Contact Us",
    path: "/contact",
    message: {
      type: "success",
      text: "Thank you for your message! We will get back to you soon.",
    },
  });
};
