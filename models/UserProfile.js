const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  label: { type: String, required: true }, // e.g., "Home", "Office", "Warehouse"
  name: { type: String, required: true },
  company: { type: String },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String },
  isDefault: { type: Boolean, default: false },
});

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    company: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    // Address book for quick selection
    addresses: [addressSchema],
    
    // Shipping preferences
    preferences: {
      defaultCarrier: {
        type: String,
        enum: ["dhl", "fedex", "ups", "usps"],
        default: "dhl",
      },
      defaultService: {
        type: String,
        default: "express",
      },
      autoInsurance: {
        type: Boolean,
        default: false,
      },
      signatureRequired: {
        type: Boolean,
        default: false,
      },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
    
    // Statistics
    stats: {
      totalShipments: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      averageShipmentValue: { type: Number, default: 0 },
      lastShipmentDate: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
userProfileSchema.index({ userId: 1 });

module.exports = mongoose.model("UserProfile", userProfileSchema);
