const mongoose = require("mongoose");
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
      createdBy: req.user._id 
    });
    
    const inTransitShipments = await Shipment.countDocuments({
      createdBy: req.user._id,
      status: "in_transit"
    });
    
    const deliveredThisWeek = await Shipment.countDocuments({
      createdBy: req.user._id,
      status: "delivered",
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    // Get recent shipments
    const recentShipments = await Shipment.find({
      createdBy: req.user._id
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
    
    // Get active shipments for GPS tracking
    const activeShipments = await Shipment.find({
      createdBy: req.user._id,
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

// Calculate local shipping rates based on weight and dimensions
function calculateLocalRates(weight, dimensions, settings) {
  const { baseRate, weightRate, sizeRate, additionalFees = 0 } = settings;
  
  // Calculate weight-based cost (GBP per kg)
  const weightCost = weight * (weightRate || 2.5);
  
  // Calculate size-based cost (GBP per cubic meter)
  const volume = (dimensions.length * dimensions.width * dimensions.height) / 1000000; // Convert cm³ to m³
  const sizeCost = volume * (sizeRate || 50);
  
  // Calculate total base rate
  let total = baseRate + weightCost + sizeCost + additionalFees;
  
  // Ensure minimum charge
  total = Math.max(total, settings.minimumCharge || 5.99);
  
  // Round to 2 decimal places
  return parseFloat(total.toFixed(2));
}

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

    // Load shipping settings
    const defaultSettings = {
      baseRate: 3.99,
      weightRate: 1.25, // GBP per kg
      sizeRate: 25,     // GBP per m³
      additionalFees: 2.99,
      minimumCharge: 5.99,
      expressMultiplier: 1.8,
      standardDeliveryDays: '2-3',
      expressDeliveryDays: '1-2',
      sameDayDelivery: false,
      sameDayCutoff: '14:00',
      sameDaySurcharge: 9.99
    };
    
    const settings = await GlobalSettings.getSetting("shipping_settings", defaultSettings);
    
    const shipmentData = {
      createdBy: req.user?._id,
      customerName: req.user?.name || 'Guest',
      customerEmail: req.user?.email || 'guest@example.com',
      customerPhone: req.user?.phone || '',
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

    // Calculate base rate
    const standardRate = calculateLocalRates(
      shipmentData.weight, 
      shipmentData.dimensions,
      settings
    );
    
    // Define service levels
    const services = [
      {
        name: "Standard Delivery",
        code: "standard",
        description: "Regular shipping with tracking",
        deliveryTime: `${settings.standardDeliveryDays || '2-3'} business days`,
        multiplier: 1.0
      },
      {
        name: "Express Delivery",
        code: "express",
        description: "Faster shipping with priority handling",
        deliveryTime: `${settings.expressDeliveryDays || '1-2'} business days`,
        multiplier: settings.expressMultiplier || 1.8
      }
    ];
    
    // Add same-day delivery if enabled
    if (settings.sameDayDelivery) {
      services.push({
        name: "Same Day Delivery",
        code: "same_day",
        description: "Delivery on the same day if ordered before " + (settings.sameDayCutoff || '14:00'),
        deliveryTime: "Same day",
        multiplier: 3.5,
        surcharge: settings.sameDaySurcharge || 9.99
      });
    }
    
    // Generate rates for each service
    const rates = services.map(service => {
      let rate = standardRate * service.multiplier;
      
      // Add surcharge if applicable (e.g., for same-day delivery)
      if (service.surcharge) {
        rate += service.surcharge;
      }
      
      return {
        service: service.name,
        serviceCode: service.code,
        baseRate: parseFloat(rate.toFixed(2)),
        originalBaseRate: parseFloat(standardRate.toFixed(2)),
        additionalFees: service.surcharge || 0,
        currency: "GBP",
        deliveryTime: service.deliveryTime,
        available: true,
        carrier: "Local Delivery",
        description: service.description
      };
    });

    res.json({
      success: true,
      rates: rates,
      settings: {
        currency: "GBP",
        weightUnit: "kg",
        dimensionUnit: "cm"
      }
    });
  } catch (error) {
    console.error("Rate calculation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate shipping rates",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    
    console.log('💰 [DEBUG] Shipping cost from request:', req.body.shippingCost);
    
    if (req.body.shippingCost && !isNaN(parseFloat(req.body.shippingCost))) {
      finalPrice = parseFloat(req.body.shippingCost);
      console.log('💰 [DEBUG] Using provided shipping cost:', finalPrice);
    } else if (req.body.selectedCarrier === "DHL Express") {
      // If no shipping cost provided, calculate with admin fees
      try {
        const globalSettings = await GlobalSettings.findOne();
        const dhlAdditionalFees = globalSettings?.carrierSettings?.dhl?.additionalFees || 0;
        finalPrice = 45.99 + dhlAdditionalFees; // Base DHL rate + admin fees
        console.log('💰 [DEBUG] Using DHL rate with admin fees:', finalPrice);
      } catch (error) {
        console.error("Error getting admin fees:", error);
        finalPrice = 45.99; // Fallback
      }
    } else {
      console.log('💰 [DEBUG] Using default fallback price:', finalPrice);
    }
    
    // Ensure finalPrice is never NaN
    if (isNaN(finalPrice)) {
      console.error('💰 [ERROR] Final price is NaN, using fallback');
      finalPrice = 45.99;
    }

    const shipmentData = {
      customerName: senderName,
      customerEmail: senderEmail,
      customerPhone: senderPhone,
      origin: {
        address: senderAddress,
        city: senderCity,
        postalCode: senderPostalCode,
        country: senderCountry
      },
      destination: {
        address: recipientAddress,
        city: recipientCity,
        postalCode: recipientPostalCode,
        country: recipientCountry
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
      carrier: req.body.selectedCarrier || "fedex", // Use fedex as primary carrier
      carrierService: req.body.selectedService || "FEDEX_GROUND", // Add required carrierService field
      service: req.body.selectedService || "FedEx Ground", 
      price: finalPrice, // Total price including admin fees
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      status: "draft", // Draft status until payment
      paymentStatus: "unpaid"
    };

    // Check for existing draft shipment to prevent duplicates using more unique identifiers
    const existingDraft = await Shipment.findOne({
      createdBy: req.user._id,
      status: "draft",
      paymentStatus: "unpaid",
      'origin.address': origin.address,
      'destination.address': destination.address,
      customerEmail: senderEmail,
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
    return res.status(500).json({
      success: false,
      message: error.message || 'Error selecting carrier'
    });
  }
};

// Step 3: Process payment and finalize shipment
exports.processPaymentAndCreateShipment = async (req, res) => {
  let shipment;
  
  try {
    const { shipmentId, paymentMethod = 'stripe', amount } = req.body;
    
    // Validate required fields
    if (!shipmentId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: shipmentId and amount are required'
      });
    }
    
    console.log('Processing payment for shipment:', { shipmentId, paymentMethod, amount });

    // Find and lock the shipment for update
    shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Check if shipment is already paid
    if (shipment.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already processed for this shipment',
        shipmentId: shipment._id,
        trackingNumber: shipment.trackingId
      });
    }

    // Validate payment amount with tolerance for floating point precision
    const expectedAmount = parseFloat(shipment.price);
    const paymentAmount = parseFloat(amount);
    const amountDifference = Math.abs(paymentAmount - expectedAmount);
    const maxAllowedDifference = Math.max(0.10, expectedAmount * 0.01); // 1% or £0.10, whichever is larger

    console.log('Payment validation:', {
      expectedAmount,
      paymentAmount,
      difference: amountDifference,
      maxAllowedDifference,
      shipmentCarrier: shipment.carrier,
      shipmentService: shipment.service
    });
    
    if (isNaN(paymentAmount) || amountDifference > maxAllowedDifference) {
      return res.status(400).json({
        success: false,
        message: `Payment amount validation failed. Expected: £${expectedAmount.toFixed(2)}, Received: £${paymentAmount.toFixed(2)}`,
        expectedAmount: expectedAmount,
        receivedAmount: paymentAmount,
        difference: amountDifference.toFixed(2)
      });
    }

    // Process payment
    const paymentResult = await paymentService.processShipmentPayment(
      shipment,
      {
        userId: req.user._id,
        shipmentId: shipment._id,
        amount: paymentAmount,
        currency: 'GBP',
        paymentMethod: paymentMethod || 'stripe'
      }
    );

    if (!paymentResult || !paymentResult.success) {
      throw new Error(paymentResult?.message || 'Payment processing failed');
    }

    // Update shipment status
    shipment.status = 'processing';
    shipment.paymentStatus = 'paid';
    shipment.paymentMethod = paymentMethod;
    shipment.paidAt = new Date();
    shipment.paymentDetails = {
      amount: paymentAmount,
      currency: 'GBP',
      paymentMethod,
      transactionId: paymentResult.transactionId || `PAY_${Date.now()}`,
      status: 'completed'
    };

    // Save the updated shipment
    await shipment.save();
      
    // If it's a DHL shipment, create the shipment with DHL API
    const carrier = shipment.carrier?.toLowerCase();
    if (carrier === 'dhl' || carrier === 'dhl express') {
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
        // If we get here, payment was successful but there was an issue with DHL
        // We'll still mark the shipment as paid but log the error
        console.error('Error creating DHL shipment:', error);
        
        // Update shipment with error information
        shipment.status = 'processing';
        shipment.notes = 'Payment processed but there was an issue creating the DHL shipment. Please contact support.';
        await shipment.save();
        
        // Create a notification for the admin
        await Notification.create({
          userId: req.user._id,
          type: 'error',
          title: 'Shipment Creation Error',
          message: `Payment processed but failed to create DHL shipment for ${shipment.trackingId}`,
          isAdmin: true,
          metadata: {
            shipmentId: shipment._id,
            trackingId: shipment.trackingId,
            error: error.message
          }
        });
        
        return res.status(200).json({
          success: true,
          message: 'Payment processed successfully, but there was an issue creating the DHL shipment. Our team has been notified and will contact you shortly.',
          trackingNumber: shipment.trackingId,
          shipmentId: shipment._id,
          paymentStatus: 'paid',
          requiresSupport: true
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

    return res.json({
      success: true,
      message: `Payment successful via ${paymentMethod}! Shipment created.`,
      trackingNumber: shipment.trackingId,
      shipmentId: shipment._id,
      paymentId: paymentResult.payment._id
    });
  } catch (error) {
    console.error('Error processing payment:', {
      error: error.message,
      stack: error.stack,
      shipmentId: shipment?._id,
      userId: req.user?._id
    });
    
    // Create error notification
    if (shipment) {
      await Notification.create({
        userId: req.user?._id,
        type: 'error',
        title: 'Payment Processing Error',
        message: `Failed to process payment for shipment ${shipment.trackingId || shipmentId}`,
        isAdmin: true,
        metadata: {
          error: error.message,
          shipmentId: shipment._id,
          trackingId: shipment.trackingId,
          paymentMethod: paymentMethod || 'unknown',
          amount: amount || 0
        }
      }).catch(console.error);
    }
    
    // Handle payment callback processing failure
    if (shipment) {
      shipment.trackingHistory.push({
        status: "error",
        location: shipment.origin.city, 
        description: "Payment processing failed",
        timestamp: new Date(),
        message: error.message || "Payment processing failed"
      });
      
      try {
        await shipment.save();
      } catch (saveError) {
        console.error('Error saving shipment with error status:', saveError);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process payment',
      requiresSupport: true
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
    
    const query = { createdBy: req.user._id };
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
      createdBy: req.user._id,
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

// Handle payment callback from payment providers
exports.handlePaymentCallback = async (req, res) => {
  try {
    const { paymentId, token, PayerID, status } = req.query || req.body;
    
    if (!paymentId && !token) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment parameters'
      });
    }

    // Handle different payment providers
    if (paymentId && PayerID) {
      // Handle PayPal callback
      const result = await paymentService.executePayPalPayment(paymentId, PayerID);
      
      if (result.success) {
        // Update the shipment status to 'paid' or 'processing'
        await Shipment.findByIdAndUpdate(
          result.shipmentId,
          { 
            status: 'processing',
            paymentStatus: 'paid',
            paymentMethod: 'paypal',
            paymentId: paymentId
          },
          { new: true }
        );
        
        return res.redirect(`/dashboard/shipments?payment=success`);
      }
    } else if (token) {
      // Handle Stripe callback
      const result = await paymentService.verifyStripePayment(token);
      
      if (result.success) {
        await Shipment.findByIdAndUpdate(
          result.shipmentId,
          { 
            status: 'processing',
            paymentStatus: 'paid',
            paymentMethod: 'stripe',
            paymentId: result.paymentIntentId
          },
          { new: true }
        );
        
        return res.redirect(`/dashboard/shipments?payment=success`);
      }
    }
    
    // If we get here, payment failed
    return res.redirect('/dashboard/shipments?payment=failed');
    
  } catch (error) {
    console.error('Payment callback error:', error);
    return res.status(500).redirect('/dashboard/shipments?payment=error');
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
