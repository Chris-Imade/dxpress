const mongoose = require('mongoose');

const shipmentTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Sender Information
  senderName: String,
  senderEmail: String,
  senderPhone: String,
  senderAddress: String,
  senderCity: String,
  senderPostalCode: String,
  senderCountry: String,
  
  // Recipient Information (optional)
  recipientName: String,
  recipientEmail: String,
  recipientPhone: String,
  recipientAddress: String,
  recipientCity: String,
  recipientState: String,
  recipientPostalCode: String,
  recipientCountry: String,
  
  // Package Information
  packageType: String,
  packageWeight: Number,
  packageLength: Number,
  packageWidth: Number,
  packageHeight: Number,
  packageValue: Number,
  packageDescription: String,
  
  // Shipping Options
  shippingProvider: {
    type: String,
    default: 'fedex'
  },
  
  // Additional Services
  insurance: {
    type: Boolean,
    default: false
  },
  signature: {
    type: Boolean,
    default: false
  },
  tracking: {
    type: Boolean,
    default: true
  },
  notifications: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
shipmentTemplateSchema.index({ createdBy: 1, name: 1 });
shipmentTemplateSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('ShipmentTemplate', shipmentTemplateSchema);
