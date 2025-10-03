const mongoose = require('mongoose');

const carrierRateSchema = new mongoose.Schema({
  carrier: {
    type: String,
    required: true,
    enum: ['fedex', 'ups', 'dhl', 'usps']
  },
  version: {
    type: String,
    required: true, // e.g., "2025.1", "2025.2"
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    default: null // null means current/active
  },
  baseRates: {
    type: Map,
    of: Number,
    required: true
    // e.g., { "FEDEX_GROUND": 13.40, "FEDEX_EXPRESS_SAVER": 30.53 }
  },
  weightRates: {
    type: Map,
    of: Number,
    required: true
    // e.g., { "FEDEX_GROUND": 3.06, "FEDEX_EXPRESS_SAVER": 4.56 }
  },
  surcharges: {
    fuelSurchargeRate: {
      type: Number,
      required: true,
      default: 0.06 // 6%
    },
    deliveryAreaSurcharge: {
      type: Number,
      required: true,
      default: 4.50
    },
    residentialSurcharge: {
      type: Number,
      default: 4.20
    },
    oversizeSurcharge: {
      type: Number,
      default: 85.00
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
carrierRateSchema.index({ carrier: 1, version: 1 }, { unique: true });
carrierRateSchema.index({ carrier: 1, effectiveDate: -1 });
carrierRateSchema.index({ isActive: 1, effectiveDate: -1 });

// Static method to get current active rates
carrierRateSchema.statics.getCurrentRates = async function(carrier) {
  const currentDate = new Date();
  
  return await this.findOne({
    carrier: carrier.toLowerCase(),
    isActive: true,
    effectiveDate: { $lte: currentDate },
    $or: [
      { expiryDate: null },
      { expiryDate: { $gte: currentDate } }
    ]
  }).sort({ effectiveDate: -1 });
};

// Static method to get rate history
carrierRateSchema.statics.getRateHistory = async function(carrier, limit = 10) {
  return await this.find({
    carrier: carrier.toLowerCase()
  })
  .populate('createdBy', 'name email')
  .populate('updatedBy', 'name email')
  .sort({ effectiveDate: -1 })
  .limit(limit);
};

// Instance method to activate rate
carrierRateSchema.methods.activate = async function() {
  // Deactivate all other rates for this carrier
  await this.constructor.updateMany(
    { 
      carrier: this.carrier,
      _id: { $ne: this._id }
    },
    { isActive: false }
  );
  
  // Activate this rate
  this.isActive = true;
  return await this.save();
};

module.exports = mongoose.model('CarrierRate', carrierRateSchema);
