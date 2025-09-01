const Shipment = require("../models/Shipment");
const UserProfile = require("../models/UserProfile");
const GlobalSettings = require("../models/GlobalSettings");
const ShipmentRate = require("../models/ShipmentRate");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const dhlService = require("../services/dhlService");
const paymentService = require("../services/paymentService");
const NotificationService = require("../services/notificationService");

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
    const { from, to, weight, length, width, height } = req.query;
    
    if (!from || !to || !weight || !length || !width || !height) {
      return res.json({
        success: false,
        message: "All shipping parameters are required"
      });
    }

    // Get global rate settings
    const globalMarkup = await GlobalSettings.getSetting("shipping_markup_percentage", 15);
    const enabledCarriers = await GlobalSettings.getSetting("enabled_carriers", ["dhl"]);
    
    const shipmentData = {
      origin: { 
        address: from,
        city: from.split(',')[0],
        postalCode: "SW1A 1AA", // Default for demo
        country: "United Kingdom"
      },
      destination: { 
        address: to,
        city: to.split(',')[0],
        postalCode: "10001", // Default for demo
        country: "United States"
      },
      weight: parseFloat(weight),
      dimensions: {
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height)
      },
      packageType: "medium_box",
      declaredValue: 100
    };

    const rates = [];
    
    // Only get DHL rates if enabled
    if (enabledCarriers.includes("dhl")) {
      try {
        const dhlRates = await dhlService.calculateRates(shipmentData);
        const markedUpRates = dhlRates.map(rate => ({
          ...rate,
          originalRate: rate.baseRate,
          baseRate: rate.baseRate * (1 + globalMarkup / 100),
          carrier: "DHL Express",
          available: true
        }));
        rates.push(...markedUpRates);
      } catch (error) {
        console.error("DHL rate error:", error);
        // Add fallback rate
        rates.push({
          service: "DHL Express",
          baseRate: 45.99,
          currency: "GBP",
          deliveryTime: "1-2 business days",
          available: true,
          carrier: "DHL Express"
        });
      }
    }
    
    // Add other carriers as "Coming Soon"
    const comingSoonCarriers = [
      { name: "FedEx Priority", estimatedRate: "38.50", deliveryTime: "2-3 business days" },
      { name: "UPS Ground", estimatedRate: "35.75", deliveryTime: "3-5 business days" },
      { name: "USPS Priority", estimatedRate: "29.99", deliveryTime: "2-3 business days" }
    ];
    
    comingSoonCarriers.forEach(carrier => {
      rates.push({
        service: carrier.name,
        baseRate: parseFloat(carrier.estimatedRate),
        currency: "GBP",
        deliveryTime: carrier.deliveryTime,
        available: false,
        carrier: carrier.name,
        comingSoon: true
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
      senderName, senderCompany, senderPhone, senderEmail, senderAddress,
      recipientName, recipientCompany, recipientPhone, recipientEmail, recipientAddress,
      packageType, packageWeight, packageLength, packageWidth, packageHeight,
      packageDescription, packageValue
    } = req.body;

    // Validate required fields
    if (!senderName || !senderPhone || !senderEmail || !senderAddress ||
        !recipientName || !recipientPhone || !recipientAddress ||
        !packageType || !packageWeight || !packageLength || !packageWidth || !packageHeight ||
        !packageDescription) {
      return res.json({
        success: false,
        message: "All required fields must be filled"
      });
    }

    // Parse addresses (simplified for demo)
    const originParts = senderAddress.split(',');
    const destParts = recipientAddress.split(',');
    
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
      packageType: packageType,
      weight: parseFloat(packageWeight),
      dimensions: {
        length: parseFloat(packageLength),
        width: parseFloat(packageWidth),
        height: parseFloat(packageHeight)
      },
      declaredValue: parseFloat(packageValue) || 100,
      status: "draft", // Draft status until payment
      paymentStatus: "unpaid"
    };

    // Create shipment in database as draft
    const shipment = new Shipment(shipmentData);
    await shipment.save();

    // Create notification for draft saved
    await NotificationService.createUserNotification(req.user._id, {
      title: 'Shipment Draft Saved',
      message: 'Your shipment information has been saved. Please select a carrier and complete payment.',
      type: 'info',
      category: 'shipment_update',
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      actionUrl: `/dashboard/create-shipment?step=2&id=${shipment._id}`,
      actionText: 'Continue'
    });

    res.json({
      success: true,
      message: "Shipment data saved successfully!",
      shipmentId: shipment._id,
      step: 2 // Next step: carrier selection
    });

  } catch (error) {
    console.error("Shipment data save error:", error);
    res.json({
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
    const { shipmentId, paymentMethod, paymentDetails } = req.body;

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.json({
        success: false,
        message: "Shipment not found"
      });
    }

    // Process payment
    const paymentResult = await paymentService.processShipmentPayment(shipment, {
      userId: req.user._id,
      shipmentId: shipment._id,
      amount: shipment.price,
      currency: 'GBP',
      paymentMethod: paymentMethod || 'stripe'
    });

    if (paymentResult.success) {
      // Update shipment status based on payment method
      if (paymentMethod === 'stripe') {
        // For Stripe, payment is processed immediately
        shipment.status = "processing";
        shipment.paymentStatus = "paid";
        
        // Try to create with DHL API if it's a DHL shipment
        if (shipment.carrier === "DHL Express" || shipment.carrier === "dhl") {
          try {
            const dhlResponse = await dhlService.createShipment(shipment);
            
            shipment.trackingHistory.push({
              status: "processing",
              location: shipment.origin.city,
              description: "Shipment created and processing",
              timestamp: new Date()
            });
          } catch (error) {
            console.error("DHL shipment creation error:", error);
            // Continue with local shipment creation
          }
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
          message: "Payment successful! Shipment created.",
          trackingNumber: shipment.trackingId,
          shipmentId: shipment._id,
          paymentId: paymentResult.payment._id
        });
      } else {
        // For other payment methods, redirect to payment gateway
        res.json({
          success: true,
          message: "Redirecting to payment gateway...",
          paymentUrl: paymentResult.paymentResult.links?.[0]?.href,
          paymentId: paymentResult.payment._id,
          shipmentId: shipment._id
        });
      }
    } else {
      res.json({
        success: false,
        message: "Payment processing failed"
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
