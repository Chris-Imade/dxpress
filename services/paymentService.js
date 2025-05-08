/**
 * Payment Service
 * Handles payment processing for shipments
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const paymentProviders = {
  stripe: {
    createPaymentIntent: async (amount, currency, metadata) => {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          metadata,
          automatic_payment_methods: {
            enabled: true,
          },
        });
        return paymentIntent;
      } catch (error) {
        console.error("Stripe payment intent creation error:", error);
        throw error;
      }
    },

    confirmPayment: async (paymentIntentId) => {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
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
        // For PayPal hosted buttons, we don't need to create an order
        // The hosted button will handle the order creation
        return {
          id: process.env.PAYPAL_HOSTED_BUTTON_ID,
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
