const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "GBP",
      enum: ["GBP", "USD", "EUR"],
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "paypal", "bank_transfer", "credit_card"],
      required: true,
    },
    paymentIntentId: {
      type: String, // Stripe payment intent ID or similar
    },
    transactionId: {
      type: String, // External payment processor transaction ID
    },
    paymentDetails: {
      last4: String, // Last 4 digits of card
      brand: String, // visa, mastercard, etc.
      country: String,
    },
    failureReason: {
      type: String,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundReason: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Additional payment processor data
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
paymentSchema.index({ shipmentId: 1 });
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ paymentIntentId: 1 });
paymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
