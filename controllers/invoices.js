const Invoice = require('../models/Invoice');
const Shipment = require('../models/Shipment');
const Payment = require('../models/Payment');
const User = require('../models/User');

// Get all invoices for user
exports.getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;

    // Build query
    const query = { userId: req.user._id };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { invoiceNumber: new RegExp(search, 'i') },
        { 'billTo.name': new RegExp(search, 'i') },
        { 'billTo.email': new RegExp(search, 'i') }
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('shipmentId', 'trackingId service')
      .populate('paymentId', 'status method')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invoice.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Calculate summary stats
    const stats = await Invoice.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' },
          unpaidCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'unpaid'] }, 1, 0] }
          },
          overdueCount: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
          }
        }
      }
    ]);

    const summary = stats[0] || {
      totalInvoices: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidCount: 0,
      overdueCount: 0
    };

    res.json({
      success: true,
      invoices,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices'
    });
  }
};

// Get single invoice
exports.getInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await Invoice.findOne({
      $or: [
        { _id: invoiceId },
        { invoiceNumber: invoiceId }
      ],
      userId: req.user._id
    })
    .populate('shipmentId')
    .populate('paymentId')
    .populate('userId', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Mark as viewed if not already
    if (invoice.status === 'sent' && !invoice.viewedDate) {
      invoice.status = 'viewed';
      invoice.viewedDate = new Date();
      await invoice.save();
    }

    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice'
    });
  }
};

// Create invoice from shipment
exports.createInvoiceFromShipment = async (req, res) => {
  try {
    const { shipmentId } = req.body;
    
    // Check if invoice already exists for this shipment
    const existingInvoice = await Invoice.findOne({ shipmentId });
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this shipment'
      });
    }

    const invoice = await Invoice.createFromShipment(shipmentId, req.user._id);
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create invoice'
    });
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.invoiceNumber;
    delete updates.userId;
    delete updates.createdAt;
    delete updates.updatedAt;

    const invoice = await Invoice.findOneAndUpdate(
      { 
        $or: [{ _id: invoiceId }, { invoiceNumber: invoiceId }],
        userId: req.user._id 
      },
      updates,
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice'
    });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findOneAndDelete({
      $or: [{ _id: invoiceId }, { invoiceNumber: invoiceId }],
      userId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice'
    });
  }
};

// Send invoice (mark as sent)
exports.sendInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findOne({
      $or: [{ _id: invoiceId }, { invoiceNumber: invoiceId }],
      userId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    invoice.status = 'sent';
    invoice.sentDate = new Date();
    await invoice.save();

    // Here you would typically send the invoice via email
    // For now, we'll just mark it as sent

    res.json({
      success: true,
      message: 'Invoice sent successfully',
      invoice
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice'
    });
  }
};

// Record payment for invoice
exports.recordPayment = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { amount, paymentMethod, transactionId, notes } = req.body;

    const invoice = await Invoice.findOne({
      $or: [{ _id: invoiceId }, { invoiceNumber: invoiceId }],
      userId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Update paid amount
    invoice.paidAmount += parseFloat(amount);
    invoice.updatePaymentStatus();

    // Create payment record if Payment model exists
    try {
      const payment = new Payment({
        userId: req.user._id,
        invoiceId: invoice._id,
        amount: parseFloat(amount),
        method: paymentMethod,
        transactionId,
        status: 'completed',
        notes
      });
      await payment.save();
      invoice.paymentId = payment._id;
    } catch (paymentError) {
      console.log('Payment model not available, skipping payment record');
    }

    await invoice.save();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      invoice
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment'
    });
  }
};

// Render invoice view page
exports.viewInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await Invoice.findOne({
      $or: [
        { _id: invoiceId },
        { invoiceNumber: invoiceId }
      ],
      userId: req.user._id
    })
    .populate('shipmentId')
    .populate('paymentId')
    .populate('userId', 'name email');

    if (!invoice) {
      return res.render('dashboard/invoice-view', {
        title: 'Invoice Not Found',
        layout: 'layouts/dashboard',
        user: req.user,
        path: '/dashboard/invoices',
        invoice: null,
        error: 'Invoice not found'
      });
    }

    // Mark as viewed if not already
    if (invoice.status === 'sent' && !invoice.viewedDate) {
      invoice.status = 'viewed';
      invoice.viewedDate = new Date();
      await invoice.save();
    }

    res.render('dashboard/invoice-view', {
      title: `Invoice ${invoice.invoiceNumber}`,
      layout: 'layouts/dashboard',
      user: req.user,
      path: '/dashboard/invoices',
      invoice,
      error: null
    });
  } catch (error) {
    console.error('Error viewing invoice:', error);
    res.render('dashboard/invoice-view', {
      title: 'Invoice Error',
      layout: 'layouts/dashboard',
      user: req.user,
      path: '/dashboard/invoices',
      invoice: null,
      error: 'Failed to load invoice'
    });
  }
};
