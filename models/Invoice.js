const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  shipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    required: false
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: false
  },
  
  // Invoice Details
  issueDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  
  // Billing Information
  billTo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    company: String,
    taxId: String
  },
  
  // Invoice Items
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    category: {
      type: String,
      enum: ['shipping', 'insurance', 'customs', 'handling', 'fuel_surcharge', 'other'],
      default: 'shipping'
    }
  }],
  
  // Financial Details
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'GBP' },
  
  // Status and Payment
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paidAmount: { type: Number, default: 0 },
  paidDate: Date,
  
  // Additional Information
  notes: String,
  terms: String,
  
  // Tracking
  sentDate: Date,
  viewedDate: Date,
  remindersSent: { type: Number, default: 0 },
  lastReminderDate: Date
}, {
  timestamps: true
});

// Generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      invoiceNumber: new RegExp(`^INV-${year}-`)
    });
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  
  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.taxAmount = this.subtotal * (this.taxRate / 100);
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  
  // Set due date if not provided (30 days from issue date)
  if (!this.dueDate) {
    this.dueDate = new Date(this.issueDate.getTime() + (30 * 24 * 60 * 60 * 1000));
  }
  
  next();
});

// Update payment status based on paid amount
invoiceSchema.methods.updatePaymentStatus = function() {
  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'paid';
    this.status = 'paid';
    if (!this.paidDate) this.paidDate = new Date();
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'unpaid';
    // Check if overdue
    if (this.dueDate < new Date() && this.status !== 'cancelled') {
      this.status = 'overdue';
    }
  }
};

// Static method to create invoice from shipment
invoiceSchema.statics.createFromShipment = async function(shipmentId, userId) {
  const Shipment = mongoose.model('Shipment');
  const shipment = await Shipment.findById(shipmentId);
  
  if (!shipment) {
    throw new Error('Shipment not found');
  }
  
  const invoice = new this({
    userId,
    shipmentId,
    billTo: {
      name: shipment.sender.name,
      email: shipment.sender.email,
      address: shipment.sender.address,
      company: shipment.sender.company
    },
    items: [{
      description: `Shipping service: ${shipment.service || 'Standard'} (${shipment.origin.city} → ${shipment.destination.city})`,
      quantity: 1,
      unitPrice: shipment.totalCost || 0,
      totalPrice: shipment.totalCost || 0,
      category: 'shipping'
    }],
    currency: shipment.currency || 'GBP'
  });
  
  return invoice;
};

module.exports = mongoose.model('Invoice', invoiceSchema);
