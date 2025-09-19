/**
 * Payment Service
 * Handles payment processing for shipments with integrated notifications
 */

const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Shipment = require('../models/Shipment');
const Notification = require('../models/Notification');

let stripe;
const initializeStripe = () => {
  console.log("[Stripe Debug] Initializing Stripe...");
  if (!stripe) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    console.log("[Stripe Debug] Stripe key present:", !!stripeKey);
    console.log(
      "[Stripe Debug] Stripe key length:",
      stripeKey ? stripeKey.length : 0
    );

    if (!stripeKey) {
      console.error("[Stripe Debug] Stripe secret key is not configured");
      return null;
    }

    try {
      stripe = require("stripe")(stripeKey);
      console.log("[Stripe Debug] Stripe client initialized successfully");
    } catch (error) {
      console.error("[Stripe Debug] Error initializing Stripe:", error);
      return null;
    }
  }
  return stripe;
};

const paymentProviders = {
  stripe: {
    createPaymentIntent: async (amount, currency, metadata) => {
      try {
        console.log("[Stripe Debug] Creating payment intent...");
        const stripeClient = initializeStripe();
        if (!stripeClient) {
          throw new Error("Stripe is not properly configured");
        }

        // Ensure amount is a number and round to nearest integer (cents)
        const amountInCents = Math.round(parseFloat(amount) * 100);
        
        console.log("[Stripe Debug] Payment intent details:", {
          amount: amountInCents,
          currency,
          metadata,
        });

        const paymentIntent = await stripeClient.paymentIntents.create({
          amount: amountInCents,
          currency: currency.toLowerCase(),
          metadata,
          payment_method_types: ['card'],
          automatic_payment_methods: {
            enabled: true,
          },
        });

        console.log(
          "[Stripe Debug] Payment intent created successfully:",
          paymentIntent.id
        );
        return paymentIntent;
      } catch (error) {
        console.error("[Stripe Debug] Payment intent creation error:", {
          message: error.message,
          type: error.type,
          code: error.code,
          stack: error.stack,
        });
        throw error;
      }
    },

    confirmPayment: async (paymentIntentId) => {
      try {
        const stripeClient = initializeStripe();
        if (!stripeClient) {
          throw new Error("Stripe is not properly configured");
        }
        const paymentIntent = await stripeClient.paymentIntents.retrieve(
          paymentIntentId
        );
        return paymentIntent;
      } catch (error) {
        console.error("Stripe payment confirmation error:", error);
        throw error;
      }
    },
  },

  paypal: {
    createOrder: async (amount, currency, description) => {
      try {
        // For PayPal, we'll return the amount and currency for client-side processing
        return {
          success: true,
          amount: parseFloat(amount).toFixed(2),
          currency: currency.toLowerCase(),
          description: description || 'Shipment Payment',
          id: process.env.PAYPAL_HOSTED_BUTTON_ID || `PAYPAL_${Date.now()}`,
          status: "CREATED",
          links: [
            {
              href: `https://www.paypal.com/ncp/payment/${process.env.PAYPAL_HOSTED_BUTTON_ID}`,
              rel: "approve",
            },
          ],
        };
      } catch (error) {
        console.error("PayPal order creation error:", error);
        throw error;
      }
    },

    captureOrder: async (orderId) => {
      try {
        // For PayPal hosted buttons, the payment is already captured
        // We just need to verify the order ID matches our hosted button
        if (orderId === process.env.PAYPAL_HOSTED_BUTTON_ID) {
          return {
            id: orderId,
            status: "COMPLETED",
          };
        }
        throw new Error("Invalid PayPal order ID");
      } catch (error) {
        console.error("PayPal order capture error:", error);
        throw error;
      }
    },
  },
};

/**
 * Initialize a payment
 * @param {String} provider - Payment provider (stripe or paypal)
 * @param {Object} paymentDetails - Details about the payment
 * @returns {Promise<Object>} Payment initiation results
 */
exports.initiatePayment = async (provider, paymentDetails) => {
  try {
    if (!provider || !paymentDetails) {
      throw new Error("Provider and payment details are required");
    }

    if (!paymentProviders[provider]) {
      throw new Error(`Unsupported payment provider: ${provider}`);
    }

    const {
      amount,
      currency = "USD",
      shipmentId,
      customerEmail,
    } = paymentDetails;

    if (!amount || amount <= 0) {
      throw new Error("Valid payment amount is required");
    }

    // Route to appropriate payment provider
    if (provider === "stripe") {
      return await paymentProviders.stripe.createPaymentIntent(
        amount * 100, // Stripe uses cents
        currency,
        { shipmentId, customerEmail }
      );
    } else if (provider === "paypal") {
      return await paymentProviders.paypal.createOrder(
        amount,
        currency,
        `Payment for shipment ${shipmentId}`
      );
    }
  } catch (error) {
    console.error("Payment initiation error:", error);
    throw error;
  }
};

/**
 * Complete a payment
 * @param {String} provider - Payment provider (stripe or paypal)
 * @param {Object} completionDetails - Details required to complete the payment
 * @returns {Promise<Object>} Payment completion results
 */
exports.completePayment = async (provider, completionDetails) => {
  try {
    if (!provider || !completionDetails) {
      throw new Error("Provider and completion details are required");
    }

    if (!paymentProviders[provider]) {
      throw new Error(`Unsupported payment provider: ${provider}`);
    }

    // Route to appropriate payment provider
    if (provider === "stripe") {
      const { paymentIntentId } = completionDetails;
      if (!paymentIntentId) {
        throw new Error("Payment intent ID is required for Stripe");
      }
      return await paymentProviders.stripe.confirmPayment(paymentIntentId);
    } else if (provider === "paypal") {
      const { orderId } = completionDetails;
      if (!orderId) {
        throw new Error("Order ID is required for PayPal");
      }
      return await paymentProviders.paypal.captureOrder(orderId);
    }
  } catch (error) {
    console.error("Payment completion error:", error);
    throw error;
  }
};

/**
 * Create payment record and process payment
 * @param {Object} shipmentData - Shipment information
 * @param {Object} paymentData - Payment details
 * @param {Object} options - Additional options (e.g., session for transactions)
 * @returns {Promise<Object>} Payment processing result
 */
exports.processShipmentPayment = async (shipmentData, paymentData, options = {}) => {
  try {
    const { userId, shipmentId, amount, currency = 'GBP', paymentMethod = 'stripe' } = paymentData;
    
    // Create payment record
    const payment = new Payment({
      shipmentId,
      userId,
      amount,
      currency,
      status: 'pending',
      paymentMethod,
      metadata: {
        shipmentId: shipmentData._id?.toString(),
        trackingId: shipmentData.trackingId,
        customerEmail: shipmentData.customerEmail
      }
    });
    
    await payment.save();
    
    // Create notification for payment initiated
    const notification = new Notification({
      userId,
      type: 'payment',
      title: 'Payment Processing',
      message: `Payment of ${currency} ${amount.toFixed(2)} is being processed for your shipment.`,
      isRead: false,
      metadata: {
        paymentId: payment._id,
        amount,
        currency,
        status: 'pending'
      }
    });
    
    await notification.save();
    
    // Process payment based on method
    let paymentResult;
    try {
      if (paymentMethod === 'stripe') {
        // For demo purposes, simulate successful Stripe payment
        paymentResult = {
          id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'succeeded',
          amount: Math.round(amount * 100),
          currency: currency.toLowerCase()
        };
        
        payment.paymentIntentId = paymentResult.id;
        payment.transactionId = paymentResult.id;
        payment.status = 'completed';
        
      } else if (paymentMethod === 'paypal') {
        // For demo purposes, simulate successful PayPal payment
        paymentResult = {
          id: `PAYID-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          status: 'COMPLETED',
          amount: amount,
          currency: currency
        };
        
        payment.transactionId = paymentResult.id;
        payment.status = 'completed';
      }
      
      await payment.save();
      
      // Create success notification
      await Notification.createNotification({
        userId,
        title: 'Payment Successful',
        message: `Payment of ${currency} ${amount.toFixed(2)} completed successfully via ${paymentMethod}.`,
        type: 'success',
        category: 'payment_status',
        relatedId: payment._id,
        relatedModel: 'Payment',
        actionUrl: `/dashboard/orders`,
        actionText: 'View Order'
      });
      
      return {
        success: true,
        payment,
        paymentResult
      };
    } catch (error) {
      payment.status = 'failed';
      payment.failureReason = error.message;
      await payment.save();
      
      return {
        success: false,
        message: `Payment failed: ${error.message}`,
        payment
      };
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
};

/**
 * Update payment status and shipment accordingly
 * @param {String} paymentId - Payment record ID
 * @param {String} status - New payment status
 * @param {Object} details - Additional payment details
 * @returns {Promise<Object>} Update result
 */
exports.updatePaymentStatus = async (paymentId, status, details = {}) => {
  try {
    const payment = await Payment.findById(paymentId).populate('shipmentId');
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    const oldStatus = payment.status;
    payment.status = status;
    
    if (details.transactionId) {
      payment.transactionId = details.transactionId;
    }
    
    if (details.paymentDetails) {
      payment.paymentDetails = details.paymentDetails;
    }
    
    if (details.failureReason) {
      payment.failureReason = details.failureReason;
    }
    
    await payment.save();
    
    // Update shipment status based on payment
    const shipment = payment.shipmentId;
    if (status === 'completed') {
      shipment.paymentStatus = 'paid';
      shipment.status = 'processing'; // Move to processing after payment
      
      // Create success notification
      await Notification.createNotification({
        userId: payment.userId,
        title: 'Payment Successful',
        message: `Payment of ${payment.currency} ${payment.amount.toFixed(2)} completed successfully. Your shipment is now being processed.`,
        type: 'success',
        category: 'payment_status',
        relatedId: shipment._id,
        relatedModel: 'Shipment',
        actionUrl: `/dashboard/tracking?id=${shipment.trackingId}`,
        actionText: 'Track Shipment'
      });
    } else if (status === 'failed') {
      shipment.paymentStatus = 'unpaid';
      shipment.status = 'payment_failed';
      
      // Create failure notification
      await Notification.createNotification({
        userId: payment.userId,
        title: 'Payment Failed',
        message: `Payment of ${payment.currency} ${payment.amount.toFixed(2)} failed. Please try again or contact support.`,
        type: 'error',
        category: 'payment_status',
        relatedId: payment._id,
        relatedModel: 'Payment',
        priority: 'high',
        actionUrl: `/dashboard/orders`,
        actionText: 'Retry Payment'
      });
    }
    
    await shipment.save();
    
    return {
      success: true,
      payment,
      shipment,
      statusChanged: oldStatus !== status
    };
  } catch (error) {
    console.error('Payment status update error:', error);
    throw error;
  }
};

/**
 * Generate an invoice number
 * @returns {String} Unique invoice number
 */
exports.generateInvoiceNumber = () => {
  const prefix = "INV";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}${random}`;
};
