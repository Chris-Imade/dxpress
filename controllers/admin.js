const Shipment = require("../models/Shipment");
const Newsletter = require("../models/Newsletter");
const User = require("../models/User");
const Contact = require("../models/Contact");

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
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

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      path: "/admin/dashboard",
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
      errorMessage: "Failed to load dashboard data",
      counts: {},
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

    // Generate a unique tracking ID with format DX123456ABC
    const timestamp = new Date().getTime().toString().slice(-6);
    const randomChars = Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase();
    const trackingId = `DX${timestamp}${randomChars}`;

    // Create new shipment object
    const shipment = new Shipment({
      trackingId,
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

    // Redirect to shipments page with success message
    res.redirect(
      "/admin/shipments?message=Shipment created successfully! Tracking ID: " +
        trackingId
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
    } = req.body;

    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).redirect("/admin/shipments");
    }

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

    // If status changed, add to history
    if (status !== shipment.status) {
      shipment.status = status;
      shipment.statusHistory.unshift({
        status,
        location: statusLocation,
        note: statusNote,
        timestamp: new Date(),
      });
    }

    await shipment.save();

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
