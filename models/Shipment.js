const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
});

const shipmentSchema = new mongoose.Schema(
  {
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
      type: addressSchema,
      required: true,
    },
    destination: {
      type: addressSchema,
      required: true,
    },
    packageType: {
      type: String,
      required: true,
      enum: ["envelope", "small_box", "medium_box", "large_box", "pallet"],
    },
    weight: {
      type: Number,
      required: true,
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    fragile: {
      type: Boolean,
      default: false,
    },
    insuranceRequired: {
      type: Boolean,
      default: false,
    },
    declaredValue: {
      type: Number,
    },
    carrier: {
      type: String,
      required: true,
    },
    service: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    estimatedDelivery: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "processing", "in_transit", "delivered", "cancelled", "exception", "payment_failed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed", "refunded"],
      default: "unpaid",
    },
    paymentProvider: {
      type: String,
      enum: ["stripe", "paypal"],
    },
    paymentIntentId: {
      type: String,
    },
    paymentCompletedAt: {
      type: Date,
    },
    trackingHistory: [
      {
        status: String,
        location: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        description: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generate tracking ID pre-save
shipmentSchema.pre("validate", async function (next) {
  if (!this.isNew) {
    this.updatedAt = new Date();
    return next();
  }

  try {
    // If trackingId is already set manually (e.g. by admin), use it
    if (this.trackingId) {
      // Still need to check for uniqueness even if set manually
      const Shipment = mongoose.model("Shipment");
      const existingWithId = await Shipment.findOne({
        trackingId: this.trackingId,
      });

      if (existingWithId && !existingWithId._id.equals(this._id)) {
        throw new Error(
          `Tracking ID ${this.trackingId} already exists. Please use a different ID.`
        );
      }
      return next();
    }

    // Generate a unique tracking ID with format DX123456ABC
    const Shipment = mongoose.model("Shipment");
    let isUnique = false;
    let candidate = "";
    let attempts = 0;
    const maxAttempts = 5;

    // Keep trying until we get a unique ID or max attempts reached
    while (!isUnique && attempts < maxAttempts) {
      // Generate a timestamp part that includes milliseconds for more uniqueness
      const timestamp = new Date().getTime().toString().slice(-6);

      // Generate random characters (3 chars, uppercase)
      const randomChars = Math.random()
        .toString(36)
        .substring(2, 5)
        .toUpperCase();

      candidate = `DX${timestamp}${randomChars}`;

      // Check if this ID already exists
      const existingShipment = await Shipment.findOne({
        trackingId: candidate,
      });

      if (!existingShipment) {
        isUnique = true;
      } else {
        attempts++;
        // Add small delay to ensure timestamp changes
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // If we couldn't generate a unique ID after max attempts, add more random data
    if (!isUnique) {
      const extraRandom = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const timestamp = new Date().getTime().toString().slice(-6);
      candidate = `DX${timestamp}${extraRandom}`;

      // Check one more time
      const existingShipment = await Shipment.findOne({
        trackingId: candidate,
      });
      if (existingShipment) {
        throw new Error(
          "Could not generate a unique tracking ID after multiple attempts"
        );
      }
    }

    this.trackingId = candidate;
    this.updatedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Shipment", shipmentSchema);
