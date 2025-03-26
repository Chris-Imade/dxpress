const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
    required: true,
  },
  origin: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  shipmentDate: {
    type: Date,
    default: Date.now,
  },
  estimatedDelivery: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "In Transit", "Delivered", "Delayed", "Cancelled"],
    default: "Pending",
  },
  statusHistory: [
    {
      status: String,
      location: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      note: String,
    },
  ],
  weight: {
    type: Number,
    required: true,
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  packageType: {
    type: String,
    enum: ["Document", "Parcel", "Freight", "Express"],
    required: true,
  },
  fragile: {
    type: Boolean,
    default: false,
  },
  insuranceIncluded: {
    type: Boolean,
    default: false,
  },
  expressDelivery: {
    type: Boolean,
    default: false,
  },
  additionalNotes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // New fields for e-commerce shipping platform
  carrier: {
    type: String,
    enum: ["DHL", "FedEx", "UPS", "USPS", "Other"],
  },
  carrierServiceLevel: String,
  carrierTrackingId: String,
  shippingCost: {
    amount: Number,
    currency: {
      type: String,
      default: "USD",
    },
  },
  shippingRates: [
    {
      carrier: String,
      serviceLevel: String,
      cost: Number,
      estimatedDays: Number,
      selected: {
        type: Boolean,
        default: false,
      },
    },
  ],
  paymentStatus: {
    type: String,
    enum: ["Unpaid", "Paid", "Refunded"],
    default: "Unpaid",
  },
  paymentMethod: String,
  paymentId: String,
  invoiceId: String,
});

// Generate tracking ID pre-save
shipmentSchema.pre("save", async function (next) {
  if (!this.isNew) {
    this.updatedAt = new Date();
    return next();
  }

  try {
    // If trackingId is already set manually (e.g. by admin), use it
    if (this.trackingId) {
      return next();
    }

    // Generate a new tracking ID with format DX123456ABC
    const timestamp = new Date().getTime().toString().slice(-6);
    const randomChars = Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase();
    let candidate = `DX${timestamp}${randomChars}`;

    // Check if this ID already exists, if so, try again with a different random part
    const Shipment = mongoose.model("Shipment");
    let existingShipment = await Shipment.findOne({ trackingId: candidate });

    if (existingShipment) {
      // If collision, generate a new random part
      const newRandomChars = Math.random()
        .toString(36)
        .substring(2, 5)
        .toUpperCase();
      candidate = `DX${timestamp}${newRandomChars}`;
    }

    this.trackingId = candidate;
    this.updatedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Shipment", shipmentSchema);
