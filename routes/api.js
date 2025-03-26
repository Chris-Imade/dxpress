const express = require("express");
const router = express.Router();
const apiController = require("../controllers/api");
const authenticateApiKey = require("../middleware/apiAuth");
const Shipment = require("../models/Shipment");

// Middleware to check API key
const checkApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      message: "Invalid or missing API key",
    });
  }
  next();
};

// Apply API key check to all routes
router.use(checkApiKey);

// Apply authentication middleware to all API routes
router.use(authenticateApiKey);

/**
 * Shipment routes
 */
// Calculate shipping rates
router.post("/shipments/calculate-rates", apiController.calculateShippingRates);

// Create a new shipment
router.post("/shipments", apiController.createShipment);

// Get a specific shipment
router.get("/shipments/:id", apiController.getShipment);

// Get shipments with optional filtering
router.get("/shipments", apiController.getShipments);

// Create shipment
router.post("/shipments", async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      weight,
      dimensions,
      packageType,
      selectedRate,
      isFragile,
      insuranceIncluded,
      expressDelivery,
      additionalNotes,
    } = req.body;

    // Validate required fields
    if (
      !customerName ||
      !customerEmail ||
      !origin ||
      !destination ||
      !weight ||
      !packageType
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Generate tracking ID
    const trackingId = `DXP${Date.now().toString().slice(-8)}`;

    // Create shipment
    const shipment = new Shipment({
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      weight,
      dimensions,
      packageType,
      selectedRate,
      isFragile,
      insuranceIncluded,
      expressDelivery,
      additionalNotes,
      trackingId,
      status: "Pending",
      paymentStatus: "Unpaid",
    });

    await shipment.save();

    res.json({
      success: true,
      message: "Shipment created successfully",
      data: {
        shipmentId: shipment._id,
        trackingId: shipment.trackingId,
        invoiceId: `INV-${Date.now()}-${shipment._id.toString().slice(-5)}`,
        paymentStatus: shipment.paymentStatus,
        estimatedDelivery: shipment.estimatedDelivery,
      },
    });
  } catch (error) {
    console.error("Error creating shipment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating shipment",
    });
  }
});

/**
 * Tracking routes
 */
// Track a shipment
router.get("/tracking/:id", apiController.trackShipment);

// Track shipment
router.get("/tracking/:id", async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      $or: [{ trackingId: req.params.id }, { _id: req.params.id }],
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    res.json({
      success: true,
      data: {
        trackingId: shipment.trackingId,
        status: shipment.status,
        estimatedDelivery: shipment.estimatedDelivery,
        origin: shipment.origin,
        destination: shipment.destination,
        carrier: shipment.selectedRate?.carrier,
        lastUpdate: shipment.updatedAt,
        history: shipment.trackingHistory || [],
      },
    });
  } catch (error) {
    console.error("Error tracking shipment:", error);
    res.status(500).json({
      success: false,
      message: "Error tracking shipment",
    });
  }
});

/**
 * Payment routes
 */
// Create a payment
router.post("/payments/create", async (req, res) => {
  try {
    const { shipmentId, provider } = req.body;

    if (!shipmentId || !provider) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const shipment = await Shipment.findOne({
      $or: [{ trackingId: shipmentId }, { _id: shipmentId }],
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    if (shipment.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Shipment is already paid",
      });
    }

    // Initialize payment based on provider
    let paymentIntent;
    if (provider === "stripe") {
      // Initialize Stripe payment
      paymentIntent = {
        id: `pi_${Date.now()}`,
        amount: shipment.selectedRate.cost * 100, // Convert to cents
        currency: shipment.selectedRate.currency.toLowerCase(),
      };
    } else if (provider === "paypal") {
      // Initialize PayPal payment
      paymentIntent = {
        id: `PAY-${Date.now()}`,
        amount: shipment.selectedRate.cost,
        currency: shipment.selectedRate.currency,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payment provider",
      });
    }

    // Update shipment with payment information
    shipment.paymentProvider = provider;
    shipment.paymentIntentId = paymentIntent.id;
    await shipment.save();

    res.json({
      success: true,
      data: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment",
    });
  }
});

// Complete payment
router.post("/payments/complete", async (req, res) => {
  try {
    const { shipmentId, provider, paymentIntentId, orderId } = req.body;

    if (!shipmentId || !provider) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const shipment = await Shipment.findOne({
      $or: [{ trackingId: shipmentId }, { _id: shipmentId }],
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    if (shipment.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Shipment is already paid",
      });
    }

    // Verify payment based on provider
    if (provider === "stripe" && paymentIntentId) {
      // Verify Stripe payment
      if (paymentIntentId !== shipment.paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment intent",
        });
      }
    } else if (provider === "paypal" && orderId) {
      // Verify PayPal payment
      if (orderId !== shipment.paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payment verification",
      });
    }

    // Update shipment payment status
    shipment.paymentStatus = "Paid";
    shipment.paymentCompletedAt = new Date();
    await shipment.save();

    res.json({
      success: true,
      message: "Payment completed successfully",
      data: {
        paymentStatus: shipment.paymentStatus,
        paymentCompletedAt: shipment.paymentCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error completing payment:", error);
    res.status(500).json({
      success: false,
      message: "Error completing payment",
    });
  }
});

// Get payment details
router.get("/payments/:id", apiController.getPayment);

module.exports = router;

router.get("/payments/:id", apiController.getPayment);

module.exports = router;
