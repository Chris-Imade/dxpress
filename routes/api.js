const express = require("express");
const router = express.Router();
const apiController = require("../controllers/api");
const authenticateApiKey = require("../middleware/apiAuth");
const Shipment = require("../models/Shipment");
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
const customerShipmentConfirmationTemplate = (shipmentData) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a237e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; background-color: #f5f5f5; }
        .tracking-info { background-color: #e8f5e9; padding: 15px; margin: 15px 0; border-radius: 5px; text-align: center; }
        .tracking-number { font-size: 24px; font-weight: bold; color: #1a237e; letter-spacing: 1px; }
        .shipment-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .button { display: inline-block; background-color: #1a237e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Shipment Confirmation</h1>
        </div>
        <div class="content">
            <p>Dear ${shipmentData.customerName},</p>
            <p>Thank you for choosing DXpress for your shipping needs. Your shipment has been successfully created and is being processed.</p>
            
            <div class="tracking-info">
                <p>Your Tracking Number:</p>
                <p class="tracking-number">${shipmentData.trackingId}</p>
                <p>You can use this number to track your shipment status at any time.</p>
                <a href="https://www.dxpress.uk/shipment/track" class="button">Track Your Shipment</a>
            </div>
            
            <div class="shipment-details">
                <h3>Shipment Details</h3>
                <p><strong>Origin:</strong> ${shipmentData.origin}</p>
                <p><strong>Destination:</strong> ${shipmentData.destination}</p>
                <p><strong>Carrier:</strong> ${
                  shipmentData.carrier || "DXpress"
                }</p>
                <p><strong>Service:</strong> ${
                  shipmentData.service || "Standard"
                }</p>
                <p><strong>Estimated Delivery:</strong> ${
                  shipmentData.estimatedDelivery
                    ? new Date(shipmentData.estimatedDelivery).toDateString()
                    : "Within 5-7 business days"
                }</p>
                <p><strong>Package Type:</strong> ${
                  shipmentData.packageType
                }</p>
                <p><strong>Weight:</strong> ${shipmentData.weight} kg</p>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our customer service team.</p>
        </div>
        <div class="footer">
            <p>Thank you for choosing DXpress</p>
            <p>© ${new Date().getFullYear()} DXpress Courier Services. All rights reserved.</p>
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
        .tracking-number { font-weight: bold; color: #1a237e; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Shipment Created</h1>
        </div>
        <div class="content">
            <p>A new shipment has been created through the website:</p>
            
            <div class="customer-info">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${shipment.customerName}</p>
                <p><strong>Email:</strong> ${shipment.customerEmail}</p>
                <p><strong>Phone:</strong> ${
                  shipment.customerPhone || "N/A"
                }</p>
            </div>
            
            <div class="shipment-details">
                <h3>Shipment Details</h3>
                <p><strong>Tracking Number:</strong> <span class="tracking-number">${
                  shipment.trackingId
                }</span></p>
                <p><strong>Origin:</strong> ${shipment.origin}</p>
                <p><strong>Destination:</strong> ${shipment.destination}</p>
                <p><strong>Carrier:</strong> ${
                  shipment.carrier || "DXpress"
                }</p>
                <p><strong>Service:</strong> ${
                  shipment.service || "Standard"
                }</p>
                <p><strong>Package Type:</strong> ${shipment.packageType}</p>
                <p><strong>Weight:</strong> ${shipment.weight} kg</p>
                <p><strong>Dimensions:</strong> ${
                  shipment.dimensions && shipment.dimensions.length
                    ? `${shipment.dimensions.length} × ${shipment.dimensions.width} × ${shipment.dimensions.height} cm`
                    : "Not specified"
                }</p>
                <p><strong>Estimated Delivery:</strong> ${
                  shipment.estimatedDelivery
                    ? new Date(shipment.estimatedDelivery).toDateString()
                    : "Not specified"
                }</p>
                <p><strong>Status:</strong> ${shipment.status || "Pending"}</p>
                <p><strong>Fragile:</strong> ${
                  shipment.fragile ? "Yes" : "No"
                }</p>
                <p><strong>Insurance Required:</strong> ${
                  shipment.insuranceRequired ? "Yes" : "No"
                }</p>
                ${
                  shipment.price
                    ? `<p><strong>Price:</strong> £${
                        typeof shipment.price === "number"
                          ? shipment.price.toFixed(2)
                          : shipment.price
                      }</p>`
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

// Apply API key check to all routes except those explicitly bypassed
const apiRoutes = express.Router();
apiRoutes.use(checkApiKey);
apiRoutes.use(authenticateApiKey);

// Public endpoint for creating shipments from the frontend (no auth required)
router.post("/shipments/create", async (req, res) => {
  try {
    const shipmentData = req.body;

    // Validate required fields
    if (
      !shipmentData.customerName ||
      !shipmentData.customerEmail ||
      !shipmentData.trackingId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required shipment details",
      });
    }

    // Map frontend package types to valid enum values
    const packageTypeMap = {
      envelope: "Document",
      small_box: "Parcel",
      medium_box: "Parcel",
      large_box: "Parcel",
      pallet: "Freight",
    };

    // Default to 'Parcel' if no valid mapping exists
    const mappedPackageType =
      packageTypeMap[shipmentData.packageType] || "Parcel";

    // Create estimated delivery date - either from the input or default to 7 days from now
    const estimatedDelivery = shipmentData.estimatedDelivery
      ? new Date(shipmentData.estimatedDelivery)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Format dimensions properly
    const dimensions = {
      length: parseFloat(shipmentData.dimensions.length) || 0,
      width: parseFloat(shipmentData.dimensions.width) || 0,
      height: parseFloat(shipmentData.dimensions.height) || 0,
    };

    // Store shipment in database
    const shipment = new Shipment({
      trackingId: shipmentData.trackingId,
      customerName: shipmentData.customerName,
      customerEmail: shipmentData.customerEmail,
      customerPhone: shipmentData.customerPhone,
      origin: shipmentData.origin,
      destination: shipmentData.destination,
      weight: parseFloat(shipmentData.weight),
      dimensions: dimensions,
      packageType: mappedPackageType,
      status: "Pending",
      carrier: shipmentData.carrier,
      carrierServiceLevel: shipmentData.service,
      fragile: shipmentData.fragile === true,
      insuranceIncluded: shipmentData.insuranceRequired === true,
      estimatedDelivery: estimatedDelivery,
      statusHistory: [
        {
          status: "Pending",
          location: shipmentData.origin,
          note: "Shipment created through website",
          timestamp: new Date(),
        },
      ],
    });

    // Save to database with proper error handling
    await shipment.save();
    console.log(
      "Shipment saved to database with tracking ID:",
      shipment.trackingId
    );

    // Send email notifications
    try {
      // Send confirmation to customer
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: shipmentData.customerEmail,
        subject: "Your Shipment Confirmation - DXpress",
        html: customerShipmentConfirmationTemplate(shipmentData),
      });

      // Send notification to admin
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: "support@dxpress.uk",
        subject: `New Shipment Created - ${shipmentData.trackingId}`,
        html: adminShipmentNotificationTemplate(shipmentData),
      });

      return res.status(200).json({
        success: true,
        message: "Shipment created and emails sent successfully",
        shipment: {
          id: shipment._id,
          trackingId: shipment.trackingId,
          status: shipment.status,
        },
      });
    } catch (emailError) {
      console.error("Error sending shipment emails:", emailError);
      return res.status(200).json({
        success: true,
        message: "Shipment created successfully but error sending emails",
        shipment: {
          id: shipment._id,
          trackingId: shipment.trackingId,
          status: shipment.status,
        },
      });
    }
  } catch (error) {
    console.error("Create shipment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create shipment",
      error: error.message,
    });
  }
});

// Mount the API routes that require authentication
router.use("/", apiRoutes);

/**
 * Shipment routes
 */
// Calculate shipping rates
apiRoutes.post(
  "/shipments/calculate-rates",
  apiController.calculateShippingRates
);

// Create a new shipment
apiRoutes.post("/shipments", apiController.createShipment);

// Get a specific shipment
apiRoutes.get("/shipments/:id", apiController.getShipment);

// Get shipments with optional filtering
apiRoutes.get("/shipments", apiController.getShipments);

/**
 * Tracking routes
 */
// Track a shipment
apiRoutes.get("/tracking/:id", apiController.trackShipment);

/**
 * Payment routes
 */
// Create a payment
apiRoutes.post("/payments/create", async (req, res) => {
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
