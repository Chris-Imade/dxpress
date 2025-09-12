const GlobalSettings = require("../models/GlobalSettings");
const dhlService = require("../services/dhlService");
const Shipment = require("../models/Shipment");
const paymentService = require("../services/paymentService");
const NotificationService = require("../services/notificationService");

exports.getShippingRates = async (req, res) => {
  try {
    const { from, to, weight, length, width, height, packageType, declaredValue } = req.query;
    
    // Validate required parameters for real-time calculation
    if (!from || !to || !weight || !length || !width || !height) {
      return res.json({
        success: false,
        message: "Missing required parameters: from, to, weight, length, width, height"
      });
    }

    // Load carrier settings to get additional fees
    const defaultCarrierSettings = {
      dhl: { additionalFees: 5.0, enabled: true, apiIntegrated: true },
      fedex: { baseRate: 35.5, additionalFees: 3.5, enabled: false, maintenanceMode: true },
      ups: { baseRate: 40.75, additionalFees: 4.25, enabled: false, maintenanceMode: true }
    };
    
    const carrierSettings = await GlobalSettings.getSetting("carrier_settings", defaultCarrierSettings);
    
    // Parse addresses (simplified)
    const originParts = from.split(',');
    const destParts = to.split(',');
    
    const shipmentData = {
      origin: {
        address: from,
        city: originParts[0]?.trim() || "London",
        postalCode: originParts[1]?.trim() || "SW1A 1AA",
        country: originParts[2]?.trim() || "United Kingdom"
      },
      destination: {
        address: to,
        city: destParts[0]?.trim() || "New York",
        postalCode: destParts[1]?.trim() || "10001",
        country: destParts[2]?.trim() || "United States"
      },
      weight: parseFloat(weight),
      dimensions: {
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height)
      },
      packageType: packageType || "medium_box",
      declaredValue: parseFloat(declaredValue) || 100
    };

    const rates = {};
    
    // DHL - calculate real rates with user data
    if (carrierSettings.dhl?.enabled) {
      try {
        const dhlRates = await dhlService.calculateRatesWithFees(
          shipmentData, 
          carrierSettings.dhl.additionalFees || 5.0
        );
        rates.dhl = dhlRates;
      } catch (error) {
        console.error("DHL API error:", error);
        rates.dhl = [{
          service: "DHL Express (Unavailable)",
          error: "Service temporarily unavailable"
        }];
      }
    }
    
    res.json({ success: true, rates });
  } catch (error) {
    console.error("Get shipping rates error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create shipment
exports.createShipment = async (req, res) => {
  try {
    const shipmentData = req.body;
    
    // Create shipment in database
    const shipment = new Shipment({
      ...shipmentData,
      status: "draft",
      paymentStatus: "unpaid",
      trackingId: `DX${Date.now()}${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date()
    });
    
    await shipment.save();
    
    res.json({
      success: true,
      message: "Shipment created successfully",
      shipment: {
        id: shipment._id,
        trackingId: shipment.trackingId
      }
    });
  } catch (error) {
    console.error("Create shipment error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create shipment" 
    });
  }
};

// Create payment intent
exports.createPayment = async (req, res) => {
  try {
    const { shipmentId, provider, amount } = req.body;
    
    if (!shipmentId || !provider || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: shipmentId, provider, amount"
      });
    }
    
    // Find the shipment
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found"
      });
    }
    
    if (provider === 'stripe') {
      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message: "Stripe is not configured. Please contact support."
        });
      }
      
      // Initialize Stripe
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'gbp',
        metadata: {
          shipmentId: shipmentId,
          trackingId: shipment.trackingId
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        }
      });
    } else if (provider === 'paypal') {
      // Check if PayPal is configured
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        return res.status(500).json({
          success: false,
          message: "PayPal is not configured. Please contact support."
        });
      }
      
      // Create PayPal order with fixed amount using newer SDK
      const { Client, Environment, OrdersController } = require('@paypal/paypal-server-sdk');
      
      // PayPal client setup
      const client = new Client({
        clientCredentialsAuthCredentials: {
          oAuthClientId: process.env.PAYPAL_CLIENT_ID,
          oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
        },
        timeout: 0,
        environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
      });
      
      const ordersController = new OrdersController(client);
      
      try {
        const orderRequest = {
          intent: 'CAPTURE',
          purchaseUnits: [{
            amount: {
              currencyCode: 'GBP',
              value: amount.toFixed(2)
            },
            description: `DXpress Shipment - ${shipment.trackingId}`,
            customId: shipmentId,
            referenceId: shipment.trackingId
          }],
          applicationContext: {
            returnUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/dashboard/payment-success?shipmentId=${shipmentId}`,
            cancelUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/dashboard/create-shipment?cancelled=true`
          }
        };
        
        const { body: order } = await ordersController.ordersCreate({ body: orderRequest });
        const approvalUrl = order.links.find(link => link.rel === 'approve').href;
        
        res.json({
          success: true,
          data: {
            orderId: order.id,
            approvalUrl: approvalUrl,
            shipmentId: shipmentId
          }
        });
      } catch (paypalError) {
        console.error('PayPal order creation error:', paypalError);
        res.status(500).json({
          success: false,
          message: "Failed to create PayPal order"
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: "Unsupported payment provider"
      });
    }
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment"
    });
  }
};

// Confirm payment
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, shipmentId } = req.body;
    
    if (!paymentIntentId || !shipmentId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: paymentIntentId, shipmentId"
      });
    }
    
    // Verify payment with Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update shipment status
      const shipment = await Shipment.findById(shipmentId);
      if (shipment) {
        shipment.status = 'processing';
        shipment.paymentStatus = 'paid';
        shipment.paymentMethod = 'stripe';
        shipment.paymentIntentId = paymentIntentId;
        
        // Add tracking history
        shipment.trackingHistory.push({
          status: 'processing',
          location: shipment.origin.city,
          description: 'Payment confirmed, shipment processing',
          timestamp: new Date()
        });
        
        await shipment.save();
        
        res.json({
          success: true,
          message: "Payment confirmed successfully",
          shipment: {
            id: shipment._id,
            trackingId: shipment.trackingId,
            status: shipment.status
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Shipment not found"
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: "Payment not confirmed"
      });
    }
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment"
    });
  }
};
