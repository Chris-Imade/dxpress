const Shipment = require("../models/Shipment");
const Newsletter = require("../models/Newsletter");
const User = require("../models/User");
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
const customerShipmentConfirmationTemplate = (shipment) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a237e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; background-color: #f5f5f5; }
        .shipment-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .tracking-number { font-size: 18px; font-weight: bold; color: #1a237e; }
        .button { display: inline-block; background-color: #1a237e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Shipment is Confirmed!</h1>
        </div>
        <div class="content">
            <p>Dear ${shipment.customerName},</p>
            <p>Thank you for choosing DXpress for your shipping needs. Your shipment has been confirmed and is now being processed.</p>
            
            <div class="shipment-details">
                <p><strong>Tracking Number:</strong> <span class="tracking-number">${
                  shipment.trackingId
                }</span></p>
                <p><strong>Origin:</strong> ${shipment.origin}</p>
                <p><strong>Destination:</strong> ${shipment.destination}</p>
                <p><strong>Package Type:</strong> ${shipment.packageType}</p>
                <p><strong>Weight:</strong> ${shipment.weight} kg</p>
                <p><strong>Estimated Delivery:</strong> ${new Date(
                  shipment.estimatedDelivery
                ).toDateString()}</p>
                <p><strong>Status:</strong> ${shipment.status}</p>
            </div>
            
            <p>You can track your shipment at any time by visiting our website and entering your tracking number.</p>
            
            <a href="https://www.dxpress.uk/shipment/track?id=${
              shipment.trackingId
            }" class="button">Track Shipment</a>
            
            <p>If you have any questions about your shipment, please contact our customer service team at support@dxpress.uk or call +44 7506 323070.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The DXpress Team</p>
        </div>
    </div>
</body>
</html>
`;

const adminShipmentNotificationTemplate = (shipment) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a237e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; background-color: #f5f5f5; }
        .shipment-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .customer-info { background-color: #eff6ff; padding: 15px; margin: 15px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Shipment Created</h1>
        </div>
        <div class="content">
            <p>A new shipment has been created in the system by an administrator:</p>
            
            <div class="customer-info">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${shipment.customerName}</p>
                <p><strong>Email:</strong> ${shipment.customerEmail}</p>
                <p><strong>Phone:</strong> ${shipment.customerPhone}</p>
            </div>
            
            <div class="shipment-details">
                <h3>Shipment Details</h3>
                <p><strong>Tracking Number:</strong> ${shipment.trackingId}</p>
                <p><strong>Origin:</strong> ${shipment.origin}</p>
                <p><strong>Destination:</strong> ${shipment.destination}</p>
                <p><strong>Package Type:</strong> ${shipment.packageType}</p>
                <p><strong>Weight:</strong> ${shipment.weight} kg</p>
                <p><strong>Dimensions:</strong> ${
                  shipment.dimensions.length || "N/A"
                } x ${shipment.dimensions.width || "N/A"} x ${
  shipment.dimensions.height || "N/A"
} cm</p>
                <p><strong>Estimated Delivery:</strong> ${new Date(
                  shipment.estimatedDelivery
                ).toDateString()}</p>
                <p><strong>Status:</strong> ${shipment.status}</p>
                <p><strong>Fragile:</strong> ${
                  shipment.fragile ? "Yes" : "No"
                }</p>
                <p><strong>Insurance Included:</strong> ${
                  shipment.insuranceIncluded ? "Yes" : "No"
                }</p>
                <p><strong>Express Delivery:</strong> ${
                  shipment.expressDelivery ? "Yes" : "No"
                }</p>
                ${
                  shipment.additionalNotes
                    ? `<p><strong>Additional Notes:</strong> ${shipment.additionalNotes}</p>`
                    : ""
                }
            </div>
            
            <p>Please log in to the admin dashboard to manage this shipment.</p>
        </div>
        <div class="footer">
            <p>This is an automated message from the DXpress shipping system.</p>
        </div>
    </div>
</body>
</html>
`;

// Email template for shipment status update
const statusUpdateTemplate = (
  shipment,
  newStatus,
  statusLocation,
  statusNote
) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a237e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; background-color: #f5f5f5; }
        .shipment-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .status-update { background-color: #e8f5e9; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .status { font-weight: bold; font-size: 16px; }
        .tracking-number { font-weight: bold; color: #1a237e; }
        .button { display: inline-block; background-color: #1a237e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Shipment Status Update</h1>
        </div>
        <div class="content">
            <p>Dear ${shipment.customerName},</p>
            <p>Your shipment with DXpress has been updated:</p>
            
            <div class="status-update">
                <p><strong>New Status:</strong> <span class="status">${newStatus}</span></p>
                <p><strong>Location:</strong> ${statusLocation}</p>
                ${
                  statusNote
                    ? `<p><strong>Notes:</strong> ${statusNote}</p>`
                    : ""
                }
                <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="shipment-details">
                <p><strong>Tracking Number:</strong> <span class="tracking-number">${
                  shipment.trackingId
                }</span></p>
                <p><strong>Origin:</strong> ${shipment.origin}</p>
                <p><strong>Destination:</strong> ${shipment.destination}</p>
                <p><strong>Estimated Delivery:</strong> ${new Date(
                  shipment.estimatedDelivery
                ).toDateString()}</p>
            </div>
            
            <p>You can track your shipment at any time by visiting our website.</p>
            
            <a href="https://www.dxpress.uk/shipment/track?id=${
              shipment.trackingId
            }" class="button">Track Shipment</a>
            
            <p>If you have any questions about your shipment, please contact our customer service team at support@dxpress.uk or call +44 7506 323070.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The DXpress Team</p>
        </div>
    </div>
</body>
</html>
`;

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    // Log the authenticated user
    console.log(
      `Loading dashboard for user: ${req.user.email} (${req.user.role})`
    );

    // Get counts for dashboard
    const shipmentCount = await Shipment.countDocuments();
    const pendingShipmentCount = await Shipment.countDocuments({
      status: "Pending",
    });
    const deliveredShipmentCount = await Shipment.countDocuments({
      status: "Delivered",
    });
    const newsletterCount = await Newsletter.countDocuments();
    const contactCount = await Contact.countDocuments();

    // Get recent shipments
    const recentShipments = await Shipment.find()
      .sort({ createdAt: -1 })
      .limit(5);

    console.log("Dashboard data loaded successfully");

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      path: "/admin/dashboard",
      user: req.user,
      counts: {
        shipments: shipmentCount,
        pendingShipments: pendingShipmentCount,
        deliveredShipments: deliveredShipmentCount,
        newsletters: newsletterCount,
        contacts: contactCount,
      },
      recentShipments,
      layout: false,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).render("admin/dashboard", {
      title: "Admin Dashboard",
      path: "/admin/dashboard",
      user: req.user,
      errorMessage: "Failed to load dashboard data: " + error.message,
      counts: {
        shipments: 0,
        pendingShipments: 0,
        deliveredShipments: 0,
        newsletters: 0,
        contacts: 0,
      },
      recentShipments: [],
      layout: false,
    });
  }
};

// Shipments management
exports.getShipments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status || "";
    const searchQuery = req.query.search || "";

    // Build filter
    const filter = {};
    if (statusFilter) filter.status = statusFilter;

    // Add search functionality
    if (searchQuery) {
      filter.$or = [
        { trackingId: { $regex: searchQuery, $options: "i" } },
        { customerName: { $regex: searchQuery, $options: "i" } },
        { customerEmail: { $regex: searchQuery, $options: "i" } },
        { customerPhone: { $regex: searchQuery, $options: "i" } },
        { origin: { $regex: searchQuery, $options: "i" } },
        { destination: { $regex: searchQuery, $options: "i" } },
        { additionalNotes: { $regex: searchQuery, $options: "i" } },
        { packageType: { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Count total documents with filter
    const totalShipments = await Shipment.countDocuments(filter);
    const totalPages = Math.ceil(totalShipments / limit);

    // Get shipments with pagination
    const shipments = await Shipment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("admin/shipments", {
      title: "Manage Shipments",
      path: "/admin/shipments",
      shipments,
      currentPage: page,
      totalPages,
      limit,
      statusFilter,
      searchQuery,
      totalShipments,
      req: req,
      layout: false,
    });
  } catch (error) {
    console.error("Get shipments error:", error);
    res.status(500).render("admin/shipments", {
      title: "Manage Shipments",
      path: "/admin/shipments",
      errorMessage: "Failed to load shipments",
      shipments: [],
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 0,
        totalItems: 0,
      },
      searchQuery: req.query.search || "",
      req: req,
      filters: {},
      layout: false,
    });
  }
};

// Get create shipment page
exports.getCreateShipment = (req, res) => {
  res.render("admin/create-shipment", {
    title: "Create New Shipment",
    path: "/admin/shipments/create",
    errorMessage: null,
    formData: {},
    layout: false,
  });
};

// Create shipment
exports.createShipment = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      estimatedDelivery,
      weight,
      length,
      width,
      height,
      packageType,
      isFragile,
      insurance,
      expressDelivery,
      additionalNotes,
    } = req.body;

    // Create new shipment object - tracking ID will be automatically generated by the model's pre-save hook
    const shipment = new Shipment({
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      estimatedDelivery: new Date(estimatedDelivery),
      weight,
      dimensions: {
        length,
        width,
        height,
      },
      packageType,
      fragile: isFragile === "on",
      insuranceIncluded: insurance === "on",
      expressDelivery: expressDelivery === "on",
      additionalNotes,
      statusHistory: [
        {
          status: "Pending",
          location: origin,
          note: "Shipment created by admin",
          timestamp: new Date(),
        },
      ],
      status: "Pending",
    });

    // Save to database
    await shipment.save();
    console.log(
      `Created new shipment with tracking ID: ${shipment.trackingId}`
    );

    // Send email notifications
    try {
      // Send confirmation to customer
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: customerEmail,
        subject: "Your Shipment Confirmation - DXpress",
        html: customerShipmentConfirmationTemplate(shipment),
      });
      console.log(`Sent confirmation email to customer: ${customerEmail}`);

      // Send notification to admin
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: "support@dxpress.uk",
        subject: `New Shipment Created - ${shipment.trackingId}`,
        html: adminShipmentNotificationTemplate(shipment),
      });
      console.log("Sent notification email to admin");
    } catch (emailError) {
      console.error("Error sending shipment emails:", emailError);
      // Continue processing even if email fails
    }

    // Redirect to shipments page with success message
    res.redirect(
      "/admin/shipments?message=Shipment created successfully! Tracking ID: " +
        shipment.trackingId
    );
  } catch (error) {
    console.error("Create shipment error:", error);
    res.render("admin/create-shipment", {
      title: "Create New Shipment",
      path: "/admin/shipments/create",
      errorMessage:
        "An error occurred while creating the shipment: " + error.message,
      formData: req.body,
      layout: false,
    });
  }
};

// Get edit shipment page
exports.getEditShipment = async (req, res) => {
  try {
    const shipmentId = req.params.id;
    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).redirect("/admin/shipments");
    }

    res.render("admin/edit-shipment", {
      title: "Edit Shipment",
      path: "/admin/shipments/edit",
      shipment,
      errorMessage: null,
      layout: false,
    });
  } catch (error) {
    console.error("Get edit shipment error:", error);
    res.status(500).redirect("/admin/shipments");
  }
};

// Update shipment
exports.updateShipment = async (req, res) => {
  try {
    const shipmentId = req.params.id;

    // Debug: Log form data
    console.log("Form data received:", JSON.stringify(req.body, null, 2));

    const {
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      estimatedDelivery,
      status,
      statusLocation,
      statusNote,
      weight,
      length,
      width,
      height,
      packageType,
      isFragile,
      insurance,
      expressDelivery,
      additionalNotes,
      statusHistory,
    } = req.body;

    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).redirect("/admin/shipments");
    }

    // Store previous status to check if it changed
    const previousStatus = shipment.status;

    // Update shipment
    shipment.customerName = customerName;
    shipment.customerEmail = customerEmail;
    shipment.customerPhone = customerPhone;
    shipment.origin = origin;
    shipment.destination = destination;
    shipment.estimatedDelivery = new Date(estimatedDelivery);
    shipment.weight = weight;
    shipment.dimensions = {
      length,
      width,
      height,
    };
    shipment.packageType = packageType;
    shipment.fragile = isFragile === "on";
    shipment.insuranceIncluded = insurance === "on";
    shipment.expressDelivery = expressDelivery === "on";
    shipment.additionalNotes = additionalNotes;
    shipment.status = status;

    // Handle status history entries from the form
    try {
      // Get all the statusHistory entries from the request body
      const historyEntries = {};

      // Process form fields to collect status history entries
      for (const key in req.body) {
        // Check if this is a status history field (e.g., statusHistory[0][date])
        if (key.startsWith("statusHistory[") && key.includes("][")) {
          // Parse the index and field name from the key
          // Example: statusHistory[0][date] -> index=0, field=date
          const indexMatch = key.match(/\[(\d+)\]\[([^\]]+)\]/);
          if (indexMatch) {
            const index = indexMatch[1];
            const field = indexMatch[2];

            // Initialize the history entry object if needed
            if (!historyEntries[index]) {
              historyEntries[index] = {};
            }

            // Add the field value to the entry
            historyEntries[index][field] = req.body[key];
          }
        }
      }

      // Convert the collected entries to an array
      const newStatusHistory = Object.values(historyEntries)
        .filter((entry) => entry.date && entry.status && entry.location) // Ensure valid entries
        .map((entry) => ({
          status: entry.status,
          location: entry.location,
          timestamp: new Date(entry.date),
          note: entry.note || "",
        }));

      // Sort by date (newest first)
      if (newStatusHistory.length > 0) {
        newStatusHistory.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        // Update the shipment history
        shipment.statusHistory = newStatusHistory;

        console.log(
          "New status history:",
          JSON.stringify(newStatusHistory, null, 2)
        );
      } else if (status !== previousStatus) {
        // If status changed but no valid history entries, add a default one
        shipment.statusHistory.unshift({
          status,
          location: statusLocation || origin,
          note: statusNote || "",
          timestamp: new Date(),
        });

        // Send status update email to customer
        try {
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: shipment.customerEmail,
            subject: `Your Shipment Status Update - ${shipment.trackingId}`,
            html: statusUpdateTemplate(
              shipment,
              status,
              statusLocation || origin,
              statusNote || ""
            ),
          });
        } catch (emailError) {
          console.error("Error sending status update email:", emailError);
          // Continue processing even if email fails
        }
      }
    } catch (historyError) {
      console.error("Error processing status history:", historyError);
      // Continue processing even if status history update fails
    }

    await shipment.save();

    // Debug: Log updated shipment
    console.log(
      "Shipment after update:",
      JSON.stringify(
        {
          id: shipment._id,
          trackingId: shipment.trackingId,
          status: shipment.status,
          statusHistory: shipment.statusHistory,
        },
        null,
        2
      )
    );

    // Redirect to shipments page with success message
    res.redirect(
      "/admin/shipments?message=Shipment updated successfully! Tracking ID: " +
        shipment.trackingId
    );
  } catch (error) {
    console.error("Update shipment error:", error);
    const shipment = await Shipment.findById(req.params.id);
    res.render("admin/edit-shipment", {
      title: "Edit Shipment",
      path: "/admin/shipments/edit",
      shipment,
      errorMessage:
        "An error occurred while updating the shipment: " + error.message,
      layout: false,
    });
  }
};

// Delete shipment
exports.deleteShipment = async (req, res) => {
  try {
    const shipmentId = req.params.id;
    await Shipment.findByIdAndDelete(shipmentId);

    res.status(200).json({ message: "Shipment deleted successfully" });
  } catch (error) {
    console.error("Delete shipment error:", error);
    res.status(500).json({ message: "Failed to delete shipment" });
  }
};

// Newsletter subscribers
exports.getNewsletterSubscribers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Build filter
    const filter = {};
    if (search) filter.email = { $regex: search, $options: "i" };

    // Count total documents with filter
    const totalSubscribers = await Newsletter.countDocuments(filter);
    const totalPages = Math.ceil(totalSubscribers / limit);

    // Get subscribers with pagination
    const subscribers = await Newsletter.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("admin/newsletter", {
      title: "Newsletter Subscribers",
      path: "/admin/newsletter",
      subscribers,
      currentPage: page,
      totalPages,
      limit,
      search,
      searchQuery: search,
      totalSubscribers,
      layout: false,
    });
  } catch (error) {
    console.error("Get newsletter subscribers error:", error);
    res.status(500).render("admin/newsletter", {
      title: "Newsletter Subscribers",
      path: "/admin/newsletter",
      errorMessage: "Failed to load subscribers",
      subscribers: [],
      searchQuery: req.query.search || "",
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 0,
        totalItems: 0,
      },
      layout: false,
    });
  }
};

// Delete newsletter subscriber
exports.deleteNewsletterSubscriber = async (req, res) => {
  try {
    const subscriberId = req.params.id;
    await Newsletter.findByIdAndDelete(subscriberId);

    res.status(200).json({ message: "Subscriber deleted successfully" });
  } catch (error) {
    console.error("Delete subscriber error:", error);
    res.status(500).json({ message: "Failed to delete subscriber" });
  }
};

// Export newsletter subscribers to CSV
exports.exportNewsletterCSV = async (req, res) => {
  try {
    // Get all subscribers
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });

    // Create CSV content
    let csvContent = "Email,Subscribed On\n";

    subscribers.forEach((subscriber) => {
      const subscribedDate = new Date(
        subscriber.createdAt
      ).toLocaleDateString();
      csvContent += `${subscriber.email},"${subscribedDate}"\n`;
    });

    // Set response headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="newsletter_subscribers_${Date.now()}.csv"`
    );

    // Send CSV content
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Export newsletter CSV error:", error);
    res.status(500).json({ message: "Failed to export subscribers" });
  }
};
