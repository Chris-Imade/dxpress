const User = require("../models/User");
const Shipment = require("../models/Shipment");
const Notification = require("../models/Notification");
const Invoice = require("../models/Invoice");
const dhlService = require("../services/dhlService");
const fedexService = require("../services/carriers/fedex");
const upsService = require("../services/carriers/ups");
const paymentService = require("../services/paymentService");
const NotificationService = require('../services/notificationService');
const GlobalSettings = require("../models/GlobalSettings");

// Helper function to map package types from form to model enum values
function mapPackageType(formPackageType) {
  const packageTypeMap = {
    'envelope': 'envelope',
    'box': 'medium_box',
    'small_box': 'small_box',
    'medium_box': 'medium_box', 
    'large_box': 'large_box',
    'tube': 'medium_box', // Map tube to medium_box
    'pallet': 'pallet',
    'custom': 'medium_box' // Map custom to medium_box as default
  };
  
  return packageTypeMap[formPackageType] || 'medium_box';
}

// Get dashboard overview
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's shipment statistics
    const totalShipments = await Shipment.countDocuments({ 
      customerEmail: req.user.email 
    });
    
    const inTransitShipments = await Shipment.countDocuments({
      customerEmail: req.user.email,
      status: "in_transit"
    });
    
    const deliveredThisWeek = await Shipment.countDocuments({
      customerEmail: req.user.email,
      status: "delivered",
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    // Get recent shipments
    const recentShipments = await Shipment.find({
      customerEmail: req.user.email
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
    
    // Get active shipments for GPS tracking
    const activeShipments = await Shipment.find({
      customerEmail: req.user.email,
      status: { $in: ["processing", "in_transit"] }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    res.render("dashboard/index", {
      title: "Dashboard",
      layout: "layouts/dashboard",
      user: req.user,
      path: "/dashboard",
      stats: {
        totalShipments,
        inTransitShipments,
        deliveredThisWeek
      },
      recentShipments,
      activeShipments
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to load dashboard"
    });
  }
};

// Get shipping rates
exports.getRates = async (req, res) => {
  try {
    const { 
      'origin.address': originAddress, 'origin.city': originCity, 'origin.postalCode': originPostalCode, 'origin.country': originCountry,
      'destination.address': destAddress, 'destination.city': destCity, 'destination.postalCode': destPostalCode, 'destination.country': destCountry,
      weight, length, width, height, packageType, declaredValue 
    } = req.query;
    
    if (!originAddress || !originCity || !originPostalCode || !originCountry ||
        !destAddress || !destCity || !destPostalCode || !destCountry ||
        !weight || !length || !width || !height) {
      return res.json({
        success: false,
        message: "All shipping parameters including complete address information are required"
      });
    }

    // Load carrier settings to get additional fees
    const defaultCarrierSettings = {
      dhl: { additionalFees: 5.0, enabled: true, apiIntegrated: true },
      fedex: { baseRate: 35.5, additionalFees: 3.5, enabled: false, maintenanceMode: true },
      ups: { baseRate: 40.75, additionalFees: 4.25, enabled: false, maintenanceMode: true }
    };
    
    const carrierSettings = await GlobalSettings.getSetting("carrier_settings", defaultCarrierSettings);
    
    const shipmentData = {
      userId: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
      origin: {
        address: originAddress,
        city: originCity,
        postalCode: originPostalCode,
        country: originCountry
      },
      destination: {
        address: destAddress,
        city: destCity,
        postalCode: destPostalCode,
        country: destCountry
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

    const rates = [];
    
    // DHL - calculate real rates with user data and additional fees
    if (carrierSettings.dhl?.enabled) {
      try {
        const dhlRates = await dhlService.calculateRatesWithFees(
          shipmentData, 
          carrierSettings.dhl.additionalFees || 5.0
        );
        
        const formattedRates = dhlRates.map(rate => ({
          service: rate.service,
          serviceCode: rate.serviceCode,
          baseRate: rate.totalRate, // This includes API rate + additional fees
          originalBaseRate: rate.originalBaseRate,
          additionalFees: rate.additionalFees,
          currency: rate.currency || "GBP",
          deliveryTime: rate.deliveryTime || "1-2 business days",
          available: true,
          carrier: "DHL",
          isLive: !rate.isApiFallback
        }));
        
        rates.push(...formattedRates);
      } catch (error) {
        console.error("DHL API error:", error);
        rates.push({
          service: "DHL Express (Unavailable)",
          baseRate: 0,
          currency: "GBP",
          deliveryTime: "Service temporarily unavailable",
          available: false,
          carrier: "DHL",
          error: "Service temporarily unavailable"
        });
      }
    }
    
    // Add other carriers as "Under Maintenance"
    const maintenanceCarriers = [
      { 
        name: "FedEx", 
        service: "FedEx Priority", 
        deliveryTime: "2-3 business days",
        message: "API integration in development"
      },
      { 
        name: "UPS", 
        service: "UPS Ground", 
        deliveryTime: "3-5 business days",
        message: "API integration in development"
      },
      { 
        name: "USPS", 
        service: "USPS Priority", 
        deliveryTime: "2-3 business days",
        message: "API integration in development"
      }
    ];
    
    maintenanceCarriers.forEach(carrier => {
      rates.push({
        service: carrier.service,
        baseRate: 0,
        currency: "GBP",
        deliveryTime: carrier.deliveryTime,
        available: false,
        carrier: carrier.name,
        maintenanceMode: true,
        message: carrier.message
      });
    });

    res.json({
      success: true,
      rates: rates
    });
  } catch (error) {
    console.error("Rate calculation error:", error);
    res.json({
      success: false,
      message: "Failed to calculate shipping rates"
    });
  }
};

// Step 1: Save shipment data (before payment)
exports.saveShipmentData = async (req, res) => {
  try {
    const {
      senderName, senderCompany, senderPhone, senderEmail, senderAddress, senderCity, senderPostalCode, senderCountry,
      recipientName, recipientCompany, recipientPhone, recipientEmail, recipientAddress, recipientCity, recipientPostalCode, recipientCountry,
      packageType, packageWeight, packageLength, packageWidth, packageHeight,
      packageDescription, packageValue
    } = req.body;

    // Validate required fields including structured addresses
    if (!senderName || !senderPhone || !senderEmail || !senderAddress || !senderCity || !senderPostalCode || !senderCountry ||
        !recipientName || !recipientPhone || !recipientAddress || !recipientCity || !recipientPostalCode || !recipientCountry ||
        !packageType || !packageWeight || !packageLength || !packageWidth || !packageHeight ||
        !packageDescription) {
      return res.json({
        success: false,
        message: "All required fields including complete address information must be filled"
      });
    }

    // Use structured address data
    const origin = {
      address: senderAddress,
      city: senderCity,
      postalCode: senderPostalCode,
      country: senderCountry
    };
    
    const destination = {
      address: recipientAddress,
      city: recipientCity,
      postalCode: recipientPostalCode,
      country: recipientCountry
    };
    
    // Calculate final price including admin fees if shipping cost is provided
    let finalPrice = 45.99; // Default fallback price
    
    if (req.body.shippingCost) {
      finalPrice = parseFloat(req.body.shippingCost);
    } else if (req.body.selectedCarrier === "DHL Express") {
      // If no shipping cost provided, calculate with admin fees
      try {
        const globalSettings = await GlobalSettings.findOne();
        const dhlAdditionalFees = globalSettings?.carrierSettings?.dhl?.additionalFees || 0;
        finalPrice = 45.99 + dhlAdditionalFees; // Base DHL rate + admin fees
      } catch (error) {
        console.error("Error getting admin fees:", error);
      }
    }

    const shipmentData = {
      customerName: senderName,
      customerEmail: senderEmail,
      customerPhone: senderPhone,
      origin: {
        address: senderAddress,
        city: originParts[originParts.length - 2]?.trim() || "London",
        postalCode: "SW1A 1AA",
        country: "United Kingdom"
      },
      destination: {
        address: recipientAddress,
        city: destParts[destParts.length - 2]?.trim() || "New York",
        postalCode: "10001",
        country: "United States"
      },
      packageType: mapPackageType(packageType),
      weight: parseFloat(packageWeight),
      dimensions: {
        length: parseFloat(packageLength),
        width: parseFloat(packageWidth),
        height: parseFloat(packageHeight)
      },
      declaredValue: parseFloat(packageValue) || 100,
      // Add required fields with calculated price including admin fees
      carrier: req.body.selectedCarrier || "DHL Express",
      service: req.body.selectedService || "Express Worldwide", 
      price: finalPrice, // Total price including admin fees
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      status: "draft", // Draft status until payment
      paymentStatus: "unpaid"
    };

    // Check for existing draft shipment to prevent duplicates using more unique identifiers
    const existingDraft = await Shipment.findOne({
      userId: req.user._id,
      status: "draft",
      paymentStatus: "unpaid",
      'origin.address': origin.address,
      'destination.address': destination.address,
      customerEmail: customerEmail,
      weight: parseFloat(packageWeight),
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Within last 10 minutes
    }).sort({ createdAt: -1 });
    
    if (existingDraft) {
      // Update existing draft instead of creating new one
      Object.assign(existingDraft, shipmentData);
      existingDraft.updatedAt = new Date();
      await existingDraft.save();
      
      return res.json({
        success: true,
        message: "Shipment data updated successfully",
        shipmentId: existingDraft._id
      });
    }

    // Create shipment in database as draft
    const shipment = new Shipment(shipmentData);
    await shipment.save();
    
    res.json({
      success: true,
      message: "Shipment data saved successfully",
      shipmentId: shipment._id
    });
  } catch (error) {
    console.error("Save shipment data error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to save shipment data" 
    });
  }
};

// Step 2: Select carrier and proceed to payment
exports.selectCarrierAndProceedToPayment = async (req, res) => {
  try {
    const { shipmentId, selectedCarrier, selectedService, shippingCost } = req.body;

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.json({
        success: false,
        message: "Shipment not found"
      });
    }

    // Update shipment with carrier selection
    shipment.carrier = selectedCarrier || "DHL Express";
    shipment.service = selectedService || "Express Worldwide";
    shipment.price = parseFloat(shippingCost) || 45.99;
    shipment.estimatedDelivery = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    
    await shipment.save();

    res.json({
      success: true,
      message: "Carrier selected successfully!",
      shipmentId: shipment._id,
      step: 3, // Next step: payment
      paymentAmount: shipment.price
    });

  } catch (error) {
    console.error("Carrier selection error:", error);
    res.json({
      success: false,
      message: "Failed to select carrier"
    });
  }
};

// Step 3: Process payment and finalize shipment
exports.processPaymentAndCreateShipment = async (req, res) => {
  try {
    const { shipmentId, paymentMethod, amount } = req.body;

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.json({
        success: false,
        message: "Shipment not found"
      });
    }

    // Validate amount matches shipment price
    const paymentAmount = parseFloat(amount);
    console.log('Payment validation:', {
      frontendAmount: paymentAmount,
      shipmentPrice: shipment.price,
      difference: Math.abs(paymentAmount - shipment.price),
      shipmentCarrier: shipment.carrier,
      shipmentService: shipment.service
    });
    
    if (Math.abs(paymentAmount - shipment.price) > 0.01) {
      return res.json({
        success: false,
        message: `Payment amount mismatch: Expected £${shipment.price}, received £${paymentAmount}`
      });
    }

    // Process payment
    const paymentResult = await paymentService.processShipmentPayment(shipment, {
      userId: req.user._id,
      shipmentId: shipment._id,
      amount: paymentAmount,
      currency: 'GBP',
      paymentMethod: paymentMethod || 'stripe'
    });

    if (paymentResult.success) {
      // Update shipment status - both Stripe and PayPal are processed immediately in our system
      shipment.status = "processing";
      shipment.paymentStatus = "paid";
      shipment.paymentMethod = paymentMethod;
      
      // Try to create with DHL API if it's a DHL shipment
      if (shipment.carrier === "DHL Express" || shipment.carrier === "dhl") {
        try {
          const dhlResponse = await dhlService.createShipment(shipment);
          
          if (dhlResponse && dhlResponse.trackingNumber) {
            shipment.trackingId = dhlResponse.trackingNumber;
            shipment.dhlShipmentId = dhlResponse.dhlShipmentId;
            shipment.labelUrl = dhlResponse.labelUrl;
          }
          
          shipment.trackingHistory.push({
            status: "processing",
            location: shipment.origin.city,
            description: "Shipment created and processing with DHL",
            timestamp: new Date()
          });
        } catch (error) {
          console.error("DHL shipment creation error:", error);
          // Continue with local shipment creation
          shipment.trackingHistory.push({
            status: "processing", 
            location: shipment.origin.city,
            description: "Shipment created and processing",
            timestamp: new Date()
          });
        }
      } else {
        shipment.trackingHistory.push({
          status: "processing",
          location: shipment.origin.city, 
          description: "Shipment created and processing",
          timestamp: new Date()
        });
      }

      // Create success notification
      await NotificationService.createShipmentNotification(
        req.user._id, 
        shipment, 
        'created'
      );

      await shipment.save();

      res.json({
        success: true,
        message: `Payment successful via ${paymentMethod}! Shipment created.`,
        trackingNumber: shipment.trackingId,
        shipmentId: shipment._id,
        paymentId: paymentResult.payment._id
      });
    } else {
      res.json({
        success: false,
        message: paymentResult.message || "Payment processing failed"
      });
    }

  } catch (error) {
    console.error("Payment processing error:", error);
    res.json({
      success: false,
      message: "Failed to process payment"
    });
  }
};

// Handle payment webhook/callback
exports.handlePaymentCallback = async (req, res) => {
  try {
    const { paymentId, status, transactionId, paymentDetails } = req.body;

    const result = await paymentService.updatePaymentStatus(paymentId, status, {
      transactionId,
      paymentDetails
    });

    if (result.success) {
      res.json({
        success: true,
        message: "Payment status updated successfully"
      });
    } else {
      res.json({
        success: false,
        message: "Failed to update payment status"
      });
    }

  } catch (error) {
    console.error("Payment callback error:", error);
    res.status(500).json({
      success: false,
      message: "Payment callback processing failed"
    });
  }
};

// Legacy create shipment method (for backward compatibility)
exports.createShipment = async (req, res) => {
  // Redirect to new multi-step process
  return this.saveShipmentData(req, res);
};

// Track shipment
exports.trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    // Find shipment in database
    const shipment = await Shipment.findOne({ trackingId: trackingNumber });
    
    if (!shipment) {
      return res.json({
        success: false,
        message: "Shipment not found"
      });
    }

    // Try to get live tracking from DHL if it's a DHL shipment
    let liveTracking = null;
    if (shipment.carrier === "DHL Express" || shipment.carrier === "dhl") {
      try {
        liveTracking = await dhlService.trackShipment(trackingNumber);
        
        // Update local tracking history with live data
        if (liveTracking.events && liveTracking.events.length > 0) {
          const latestEvent = liveTracking.events[0];
          const existingEvent = shipment.trackingHistory.find(
            event => event.timestamp.getTime() === latestEvent.timestamp.getTime()
          );
          
          if (!existingEvent) {
            shipment.trackingHistory.push({
              status: latestEvent.status,
              location: latestEvent.location,
              description: latestEvent.description,
              timestamp: latestEvent.timestamp
            });
            
            shipment.status = latestEvent.status;
            await shipment.save();
          }
        }
      } catch (error) {
        console.error("DHL tracking error:", error);
        // Use local tracking data
      }
    }

    const trackingData = {
      trackingNumber: shipment.trackingId,
      status: shipment.status,
      carrier: shipment.carrier,
      service: shipment.service,
      estimatedDelivery: shipment.estimatedDelivery,
      origin: shipment.origin,
      destination: shipment.destination,
      weight: shipment.weight,
      trackingHistory: shipment.trackingHistory.sort((a, b) => b.timestamp - a.timestamp),
      liveData: liveTracking
    };

    res.json({
      success: true,
      data: trackingData
    });

  } catch (error) {
    console.error("Tracking error:", error);
    res.json({
      success: false,
      message: "Failed to track shipment"
    });
  }
};

// Get user's shipments
exports.getShipments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;
    
    const query = { customerEmail: req.user.email };
    if (status) {
      query.status = status;
    }
    
    const shipments = await Shipment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Shipment.countDocuments(query);
    
    res.json({
      success: true,
      shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get shipments error:", error);
    res.json({
      success: false,
      message: "Failed to fetch shipments"
    });
  }
};

// Get GPS tracking data for active shipments
exports.getGPSTracking = async (req, res) => {
  try {
    const activeShipments = await Shipment.find({
      customerEmail: req.user.email,
      status: { $in: ["processing", "in_transit"] }
    }).lean();

    const trackingData = [];
    
    for (const shipment of activeShipments) {
      // Try to get live GPS data from DHL
      let gpsData = null;
      if (shipment.carrier === "DHL Express" || shipment.carrier === "dhl") {
        try {
          const liveTracking = await dhlService.trackShipment(shipment.trackingId);
          gpsData = {
            lat: 40.7128 + (Math.random() - 0.5) * 0.1, // Demo coordinates with slight randomization
            lng: -74.0060 + (Math.random() - 0.5) * 0.1,
            lastUpdate: new Date(),
            currentLocation: liveTracking.currentLocation || "In Transit"
          };
        } catch (error) {
          // Use fallback GPS data
          gpsData = {
            lat: 40.7128,
            lng: -74.0060,
            lastUpdate: new Date(),
            currentLocation: "GPS data unavailable"
          };
        }
      }
      
      trackingData.push({
        trackingId: shipment.trackingId,
        status: shipment.status,
        carrier: shipment.carrier,
        origin: shipment.origin,
        destination: shipment.destination,
        gps: gpsData,
        estimatedDelivery: shipment.estimatedDelivery
      });
    }

    res.json({
      success: true,
      trackingData
    });
  } catch (error) {
    console.error("GPS tracking error:", error);
    res.json({
      success: false,
      message: "Failed to get GPS tracking data"
    });
  }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { preferences } = req.body;

    console.log('🔧 [DEBUG] Updating preferences for user:', userId);
    console.log('📝 [DEBUG] Preferences data:', JSON.stringify(preferences, null, 2));

    // Update user preferences
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { preferences },
      { new: true }
    );

    res.json({ success: true, message: "Preferences updated successfully" });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Handle PayPal payment success
exports.handlePayPalSuccess = async (req, res) => {
  try {
    const { shipmentId, token, PayerID } = req.query;
    
    if (!shipmentId || !token || !PayerID) {
      return res.redirect('/dashboard/create-shipment?error=invalid_payment_data');
    }
    
    // Find the shipment
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.redirect('/dashboard/create-shipment?error=shipment_not_found');
    }
    
    // Capture PayPal payment
    const { Client, Environment, OrdersController } = require('@paypal/paypal-server-sdk');
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
      // Capture the order
      const { body: captureResult } = await ordersController.ordersCapture({
        id: token,
        body: {}
      });
      
      if (captureResult.status === 'COMPLETED') {
        // Update shipment status
        shipment.status = 'confirmed';
        shipment.paymentStatus = 'paid';
        shipment.paymentMethod = 'paypal';
        shipment.paymentId = captureResult.id;
        
        // Create DHL shipment if not already created
        if (!shipment.dhlShipmentId) {
          try {
            const dhlService = require('../services/dhlService');
            const dhlShipment = await dhlService.createShipment({
              sender: shipment.sender,
              recipient: shipment.recipient,
              package: shipment.package,
              service: shipment.service || 'P'
            });
            
            if (dhlShipment && dhlShipment.shipmentTrackingNumber) {
              shipment.dhlShipmentId = dhlShipment.shipmentTrackingNumber;
              shipment.trackingId = dhlShipment.shipmentTrackingNumber;
            }
          } catch (dhlError) {
            console.error('DHL shipment creation error:', dhlError);
            // Continue with payment success even if DHL creation fails
          }
        }
        
        await shipment.save();
        
        // Create notification
        const notificationService = require('../services/notificationService');
        await notificationService.createNotification({
          userId: req.user._id,
          type: 'payment_success',
          title: 'Payment Successful',
          message: `Your payment for shipment ${shipment.trackingId} has been processed successfully.`,
          data: { shipmentId: shipment._id, trackingId: shipment.trackingId }
        });
        
        // Redirect to tracking page with success message
        res.redirect(`/dashboard/tracking?id=${shipment.trackingId}&payment=success`);
      } else {
        res.redirect('/dashboard/create-shipment?error=payment_failed');
      }
    } catch (paypalError) {
      console.error('PayPal capture error:', paypalError);
      res.redirect('/dashboard/create-shipment?error=payment_capture_failed');
    }
  } catch (error) {
    console.error('PayPal success handler error:', error);
    res.redirect('/dashboard/create-shipment?error=payment_processing_failed');
  }
};

// Test DHL API integration
exports.testDHLIntegration = async (req, res) => {
  try {
    const dhlService = require('../services/dhlService');
    
    // Test OAuth token
    console.log('🧪 [DHL Test] Testing OAuth authentication...');
    const token = await dhlService.getAccessToken();
    
    if (!token) {
      return res.json({
        success: false,
        message: 'Failed to get DHL OAuth token',
        details: 'Check your DHL API credentials'
      });
    }
    
    console.log('✅ [DHL Test] OAuth token obtained successfully');
    
    // Test rate calculation with sample data
    const testShipmentData = {
      origin: {
        address: "123 Test Street",
        city: "London",
        postalCode: "SW1A 1AA",
        country: "United Kingdom"
      },
      destination: {
        address: "456 Sample Avenue",
        city: "New York",
        postalCode: "10001",
        country: "United States"
      },
      weight: 2.5,
      dimensions: {
        length: 30,
        width: 20,
        height: 15
      },
      packageType: "medium_box",
      declaredValue: 150
    };
    
    console.log('🧪 [DHL Test] Testing rate calculation...');
    const rates = await dhlService.calculateRatesWithFees(testShipmentData, 5.0);
    
    res.json({
      success: true,
      message: 'DHL API integration test completed',
      results: {
        authentication: 'SUCCESS',
        tokenObtained: true,
        rateCalculation: rates.length > 0 ? 'SUCCESS' : 'FALLBACK',
        rates: rates,
        environment: process.env.NODE_ENV === 'production' ? 'LIVE' : 'SANDBOX',
        apiUrl: dhlService.baseURL
      }
    });
    
  } catch (error) {
    console.error('❌ [DHL Test] Integration test failed:', error);
    res.json({
      success: false,
      message: 'DHL API integration test failed',
      error: error.message,
      details: error.response?.data || 'Check server logs for more details'
    });
  }
};
