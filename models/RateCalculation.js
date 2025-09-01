const mongoose = require("mongoose");

const rateCalculationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originAddress: {
      type: String,
      required: true,
    },
    destinationAddress: {
      type: String,
      required: true,
    },
    originCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    },
    destinationCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    },
    packageDetails: {
      weight: {
        type: Number,
        required: true,
        min: 0.1
      },
      dimensions: {
        length: { type: Number, required: true, min: 1 },
        width: { type: Number, required: true, min: 1 },
        height: { type: Number, required: true, min: 1 }
      },
      declaredValue: {
        type: Number,
        default: 0
      }
    },
    calculatedRates: [{
      carrier: {
        type: String,
        required: true,
        enum: ["dhl", "fedex", "ups", "royal-mail", "dpd", "hermes"]
      },
      service: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: "GBP"
      },
      estimatedDelivery: {
        days: { type: Number, required: true },
        description: { type: String }
      },
      features: [{
        type: String,
        enum: ["tracking", "insurance", "signature", "next-day", "weekend", "international"]
      }]
    }],
    selectedRate: {
      carrier: String,
      service: String,
      price: Number
    },
    calculationMetadata: {
      distance: Number, // in kilometers
      zone: String, // domestic, international, etc.
      calculationTime: { type: Date, default: Date.now },
      apiResponseTime: Number, // in milliseconds
      exchangeRates: mongoose.Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: ["calculated", "selected", "booked", "expired"],
      default: "calculated"
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
rateCalculationSchema.index({ user: 1, createdAt: -1 });
rateCalculationSchema.index({ status: 1, expiresAt: 1 });
rateCalculationSchema.index({ originAddress: "text", destinationAddress: "text" });
rateCalculationSchema.index({ "calculatedRates.carrier": 1, "calculatedRates.price": 1 });

// TTL index to automatically remove expired calculations
rateCalculationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for formatted addresses
rateCalculationSchema.virtual('route').get(function() {
  return `${this.originAddress} → ${this.destinationAddress}`;
});

// Method to get the cheapest rate
rateCalculationSchema.methods.getCheapestRate = function() {
  if (!this.calculatedRates || this.calculatedRates.length === 0) return null;
  return this.calculatedRates.reduce((cheapest, current) => 
    current.price < cheapest.price ? current : cheapest
  );
};

// Method to get rates by carrier
rateCalculationSchema.methods.getRatesByCarrier = function(carrier) {
  return this.calculatedRates.filter(rate => rate.carrier === carrier);
};

// Static method to get recent calculations for a user
rateCalculationSchema.statics.getRecentCalculations = function(userId, limit = 10) {
  return this.find({ user: userId, status: { $ne: 'expired' } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name email');
};

// Static method to get popular routes
rateCalculationSchema.statics.getPopularRoutes = function(limit = 5) {
  return this.aggregate([
    { $match: { status: { $ne: 'expired' } } },
    { 
      $group: {
        _id: {
          origin: '$originAddress',
          destination: '$destinationAddress'
        },
        count: { $sum: 1 },
        avgPrice: { $avg: '$selectedRate.price' },
        lastCalculated: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1, lastCalculated: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model("RateCalculation", rateCalculationSchema);
