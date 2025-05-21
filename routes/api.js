const express = require("express");
const router = express.Router();
const apiController = require("../controllers/api");
const Shipment = require("../models/Shipment");
const nodemailer = require("nodemailer");

// Debug logging middleware for API routes
const apiLogger = (req, res, next) => {
  console.log("[API Debug]", {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    headers: {
      "content-type": req.headers["content-type"],
      "user-agent": req.headers["user-agent"],
    },
    body: req.body,
    query: req.query,
    params: req.params,
  });
  next();
};

// Apply logging middleware to all API routes
router.use(apiLogger);

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
});

// Verify SMTP connection
transporter.verify(function (error, success) {
  if (error) {
    console.error("[SMTP Error]", {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
    });
  } else {
    console.log("[SMTP Success] Server is ready to take our messages");
  }
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

// Create a shipment
router.post("/shipments/create", async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      packageType,
      weight,
      dimensions,
      fragile,
      insuranceRequired,
      carrier,
      service,
      price,
    } = req.body;

    // Validate required fields
    if (
      !customerName ||
      !customerEmail ||
      !origin ||
      !destination ||
      !packageType ||
      !weight
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Generate tracking ID
    const trackingId = `${carrier.toLowerCase()}-${Date.now().toString(36)}`;

    // Calculate estimated delivery date (2-3 business days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

    // Create new shipment
    const shipment = new Shipment({
      trackingId,
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      packageType,
      weight,
      dimensions,
      fragile,
      insuranceRequired,
      carrier,
      service,
      price,
      estimatedDelivery,
      status: "pending",
      paymentStatus: "pending",
    });

    // Save shipment
    await shipment.save();

    res.json({
      success: true,
      message: "Shipment created successfully",
      shipment: {
        id: shipment._id,
        trackingId: shipment.trackingId,
      },
    });
  } catch (error) {
    console.error("Error creating shipment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating shipment",
      error: error.message,
    });
  }
});

// Create a payment
router.post("/payments/create", async (req, res) => {
  try {
    const { shipmentId, provider, amount } = req.body;

    if (!shipmentId || !provider || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Find the shipment
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
    if (provider === "stripe") {
      try {
        // Initialize Stripe
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "gbp",
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            shipmentId: shipment.trackingId,
            customerEmail: shipment.customerEmail,
          },
        });

        // Update shipment with payment information
        shipment.paymentProvider = provider;
        shipment.paymentIntentId = paymentIntent.id;
        await shipment.save();

        res.json({
          success: true,
          data: {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
          },
        });
      } catch (error) {
        console.error("Stripe payment creation error:", error);
        res.status(500).json({
          success: false,
          message: "Error creating Stripe payment",
          error: error.message,
        });
      }
    } else if (provider === "paypal") {
      // Initialize PayPal payment
      const paymentIntent = {
        id: `PAY-${Date.now()}`,
        amount: amount,
        currency: "gbp",
      };

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
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payment provider",
      });
    }
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment",
      error: error.message,
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
