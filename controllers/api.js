const Shipment = require("../models/Shipment");
const shippingRateCalculator = require("../services/shippingRateCalculator");
const paymentService = require("../services/paymentService");

/**
 * Calculate shipping rates based on shipment details
 * @route POST /api/shipments/calculate-rates
 */
exports.calculateShippingRates = async (req, res) => {
  try {
    const { origin, destination, weight, dimensions, packageType, carriers } =
      req.body;

    // Validate required fields
    if (!origin || !destination || !weight) {
      return res.status(400).json({
        success: false,
        message: "Origin, destination and weight are required fields",
      });
    }

    // Calculate rates from multiple carriers
    const rates = await shippingRateCalculator.calculateRates({
      origin,
      destination,
      weight,
      dimensions,
      packageType,
      carriers,
    });

    return res.status(200).json({
      success: true,
      data: {
        rates,
        // Include estimated delivery dates
        estimatedDeliveryDates: rates.map((rate) => ({
          carrier: rate.carrier,
          serviceLevel: rate.serviceLevel,
          estimatedDeliveryDate: shippingRateCalculator.estimateDeliveryDate(
            rate.estimatedDays
          ),
        })),
      },
    });
  } catch (error) {
    console.error("Calculate shipping rates error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate shipping rates",
      error: error.message,
    });
  }
};

/**
 * Create a new shipment
 * @route POST /api/shipments
 */
exports.createShipment = async (req, res) => {
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
        message: "Missing required shipment details",
      });
    }

    // If a rate was selected, use it
    let carrier, carrierServiceLevel, shippingCost, estimatedDelivery;

    if (selectedRate) {
      carrier = selectedRate.carrier;
      carrierServiceLevel = selectedRate.serviceLevel;
      shippingCost = {
        amount: selectedRate.cost,
        currency: "USD",
      };

      // Calculate estimated delivery date
      estimatedDelivery = shippingRateCalculator.estimateDeliveryDate(
        selectedRate.estimatedDays
      );
    } else {
      // Default estimated delivery (5 business days)
      estimatedDelivery = shippingRateCalculator.estimateDeliveryDate(5);
    }

    // Generate invoice ID
    const invoiceId = paymentService.generateInvoiceNumber();

    // Create new shipment
    const shipment = new Shipment({
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      estimatedDelivery,
      weight,
      dimensions,
      packageType,
      fragile: isFragile === true,
      insuranceIncluded: insuranceIncluded === true,
      expressDelivery: expressDelivery === true,
      additionalNotes,
      carrier,
      carrierServiceLevel,
      shippingCost,
      invoiceId,
      paymentStatus: "Unpaid",
      statusHistory: [
        {
          status: "Pending",
          location: origin,
          note: "Shipment created via API",
          timestamp: new Date(),
        },
      ],
      status: "Pending",
    });

    // Save to database
    await shipment.save();

    return res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      data: {
        shipmentId: shipment._id,
        trackingId: shipment.trackingId,
        invoiceId: shipment.invoiceId,
        paymentStatus: shipment.paymentStatus,
        estimatedDelivery: shipment.estimatedDelivery,
      },
    });
  } catch (error) {
    console.error("Create shipment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create shipment",
      error: error.message,
    });
  }
};

/**
 * Get a specific shipment by ID
 * @route GET /api/shipments/:id
 */
exports.getShipment = async (req, res) => {
  try {
    const shipmentId = req.params.id;

    // Find shipment by ID or tracking ID
    const shipment = await Shipment.findOne({
      $or: [
        { _id: shipmentId.match(/^[0-9a-fA-F]{24}$/) ? shipmentId : null },
        { trackingId: shipmentId },
      ],
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    console.error("Get shipment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve shipment",
      error: error.message,
    });
  }
};

/**
 * Get shipments for a user or by filter
 * @route GET /api/shipments
 */
exports.getShipments = async (req, res) => {
  try {
    const { page = 1, limit = 10, customerEmail, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};

    if (customerEmail) {
      filter.customerEmail = customerEmail;
    }

    if (status) {
      filter.status = status;
    }

    // Count total shipments matching filter
    const totalShipments = await Shipment.countDocuments(filter);
    const totalPages = Math.ceil(totalShipments / limit);

    // Get shipments
    const shipments = await Shipment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        shipments,
        pagination: {
          total: totalShipments,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Get shipments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve shipments",
      error: error.message,
    });
  }
};

/**
 * Track a shipment by tracking ID
 * @route GET /api/tracking/:id
 */
exports.trackShipment = async (req, res) => {
  try {
    const trackingId = req.params.id;

    // Find shipment by tracking ID
    const shipment = await Shipment.findOne({ trackingId });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // Format tracking information for API response
    const trackingInfo = {
      trackingId: shipment.trackingId,
      status: shipment.status,
      estimatedDelivery: shipment.estimatedDelivery,
      origin: shipment.origin,
      destination: shipment.destination,
      carrier: shipment.carrier,
      lastUpdate: shipment.updatedAt,
      history: shipment.statusHistory.map((entry) => ({
        status: entry.status,
        location: entry.location,
        timestamp: entry.timestamp,
        note: entry.note,
      })),
    };

    return res.status(200).json({
      success: true,
      data: trackingInfo,
    });
  } catch (error) {
    console.error("Track shipment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to track shipment",
      error: error.message,
    });
  }
};

/**
 * Create a payment for a shipment
 * @route POST /api/payments/create
 */
exports.createPayment = async (req, res) => {
  try {
    const { shipmentId, provider } = req.body;

    if (!shipmentId || !provider) {
      return res.status(400).json({
        success: false,
        message: "Shipment ID and payment provider are required",
      });
    }

    // Verify shipment exists
    const shipment = await Shipment.findOne({
      $or: [
        { _id: shipmentId.match(/^[0-9a-fA-F]{24}$/) ? shipmentId : null },
        { trackingId: shipmentId },
      ],
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // Check if shipment is already paid
    if (shipment.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Shipment is already paid",
      });
    }

    // Get payment amount from shipment
    const amount =
      shipment.shippingCost && shipment.shippingCost.amount
        ? shipment.shippingCost.amount
        : 0;

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipment cost",
      });
    }

    // Initialize payment
    const paymentResult = await paymentService.initiatePayment(provider, {
      amount,
      currency: shipment.shippingCost.currency || "USD",
      shipmentId: shipment.trackingId,
      customerEmail: shipment.customerEmail,
    });

    // Update shipment with payment information
    shipment.paymentMethod = provider;
    shipment.paymentId =
      provider === "stripe" ? paymentResult.id : paymentResult.id;
    await shipment.save();

    return res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      data: {
        ...paymentResult,
        shipmentId: shipment.trackingId,
      },
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error.message,
    });
  }
};

/**
 * Complete a payment for a shipment
 * @route POST /api/payments/complete
 */
exports.completePayment = async (req, res) => {
  try {
    const { shipmentId, provider, paymentId, paymentIntentId, orderId } =
      req.body;

    if (!shipmentId || !provider) {
      return res.status(400).json({
        success: false,
        message: "Shipment ID and payment provider are required",
      });
    }

    // Verify shipment exists
    const shipment = await Shipment.findOne({
      $or: [
        { _id: shipmentId.match(/^[0-9a-fA-F]{24}$/) ? shipmentId : null },
        { trackingId: shipmentId },
      ],
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // Check if shipment is already paid
    if (shipment.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Shipment is already paid",
      });
    }

    // Complete payment based on provider
    let paymentResult;
    if (provider === "stripe") {
      paymentResult = await paymentService.completePayment(provider, {
        paymentIntentId: paymentIntentId || shipment.paymentId,
      });
    } else if (provider === "paypal") {
      paymentResult = await paymentService.completePayment(provider, {
        orderId: orderId || shipment.paymentId,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported payment provider",
      });
    }

    // Update shipment payment status
    shipment.paymentStatus = "Paid";
    await shipment.save();

    return res.status(200).json({
      success: true,
      message: "Payment completed successfully",
      data: {
        shipmentId: shipment.trackingId,
        paymentId: paymentId || shipment.paymentId,
        status: paymentResult.status,
        paymentStatus: shipment.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Complete payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete payment",
      error: error.message,
    });
  }
};

/**
 * Get payment details
 * @route GET /api/payments/:id
 */
exports.getPayment = async (req, res) => {
  try {
    const paymentId = req.params.id;

    // Find shipment by payment ID
    const shipment = await Shipment.findOne({ paymentId });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Format payment information
    const paymentInfo = {
      paymentId: shipment.paymentId,
      shipmentId: shipment.trackingId,
      amount: shipment.shippingCost?.amount,
      currency: shipment.shippingCost?.currency || "USD",
      status: shipment.paymentStatus,
      paymentMethod: shipment.paymentMethod,
      invoiceId: shipment.invoiceId,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
    };

    return res.status(200).json({
      success: true,
      data: paymentInfo,
    });
  } catch (error) {
    console.error("Get payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payment information",
      error: error.message,
    });
  }
};
