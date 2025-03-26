const Shipment = require("../models/Shipment");

// Get tracking page
exports.getTrackingPage = (req, res) => {
  res.render("shipment/track", {
    title: "Track Your Shipment",
    path: "/shipment/track",
    errorMessage: null,
    shipment: null,
  });
};

// Track a shipment
exports.trackShipment = async (req, res) => {
  const trackingId = req.body.trackingId;
  try {
    const shipment = await Shipment.findOne({ trackingId: trackingId });

    if (!shipment) {
      return res.render("shipment/track", {
        title: "Track Your Shipment",
        path: "/shipment/track",
        errorMessage: "No shipment found with that tracking ID",
        shipment: null,
      });
    }

    // Calculate progress percentage based on status
    let statusProgress = 5;
    if (shipment.status === "Pending") {
      statusProgress = 15;
    } else if (shipment.status === "In Transit") {
      statusProgress = 55;
    } else if (shipment.status === "Delivered") {
      statusProgress = 100;
    } else if (shipment.status === "Delayed") {
      statusProgress = 65;
    }

    res.render("shipment/track-result", {
      title: "Shipment Information",
      path: "/shipment/track",
      shipment: shipment,
      statusProgress: statusProgress,
    });
  } catch (error) {
    console.error("Error tracking shipment:", error);
    res.render("shipment/track", {
      title: "Track Your Shipment",
      path: "/shipment/track",
      errorMessage: "An error occurred while tracking your shipment",
      shipment: null,
    });
  }
};

// Get shipment request page
exports.getRequestPage = (req, res) => {
  res.render("shipment/request", {
    title: "Request a Shipment",
    path: "/shipment/request",
    errorMessage: null,
    formData: {},
  });
};

// Create a shipment request
exports.createShipmentRequest = async (req, res) => {
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
      fragile,
      insuranceIncluded,
      expressDelivery,
      additionalNotes,
    } = req.body;

    // Create new shipment object
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
      fragile: fragile === "on",
      insuranceIncluded: insuranceIncluded === "on",
      expressDelivery: expressDelivery === "on",
      additionalNotes,
      statusHistory: [
        {
          status: "Pending",
          location: origin,
          note: "Shipment created",
        },
      ],
    });

    // Save to database
    await shipment.save();

    // Render success page
    res.render("shipment/request-success", {
      title: "Shipment Request Successful",
      path: "/shipment/request",
      shipment: shipment,
    });
  } catch (error) {
    console.error("Error creating shipment:", error);
    res.render("shipment/request", {
      title: "Request a Shipment",
      path: "/shipment/request",
      errorMessage: "An error occurred while processing your request",
      formData: req.body,
    });
  }
};
