const mongoose = require("mongoose");

const shipmentRateSchema = new mongoose.Schema(
  {
    carrier: {
      type: String,
      required: true,
      enum: ["dhl", "fedex", "ups", "custom"],
    },
    service: {
      type: String,
      required: true,
    },
    baseRate: {
      type: Number,
      required: true,
    },
    markup: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalRate: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "GBP",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    weightRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 999999 },
    },
    zone: {
      type: String,
      default: "domestic",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
shipmentRateSchema.index({ carrier: 1, service: 1, isActive: 1 });
shipmentRateSchema.index({ weightRange: 1, zone: 1 });

module.exports = mongoose.model("ShipmentRate", shipmentRateSchema);
