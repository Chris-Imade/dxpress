const CarrierRate = require('../../models/CarrierRate');

/**
 * ADMIN CARRIER RATE MANAGEMENT CONTROLLER
 * Handles CRUD operations for shipping rates across all carriers
 */

// Get carrier rates management page
exports.getRatesPage = async (req, res) => {
  try {
    const carriers = ['fedex', 'ups', 'dhl', 'usps'];
    const ratesData = {};
    
    // Get current active rates for each carrier
    for (const carrier of carriers) {
      const currentRate = await CarrierRate.getCurrentRates(carrier);
      const history = await CarrierRate.getRateHistory(carrier, 5);
      
      ratesData[carrier] = {
        current: currentRate,
        history: history
      };
    }
    
    res.render('admin/carrier-rates', {
      title: 'Carrier Rate Management',
      layout: 'layouts/admin',
      ratesData: ratesData,
      carriers: carriers
    });
  } catch (error) {
    console.error('Error loading carrier rates page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load carrier rates',
      error: error
    });
  }
};

// Get current rates for a specific carrier (API)
exports.getCurrentRates = async (req, res) => {
  try {
    const { carrier } = req.params;
    const rates = await CarrierRate.getCurrentRates(carrier);
    
    if (!rates) {
      return res.status(404).json({
        success: false,
        message: `No active rates found for ${carrier}`
      });
    }
    
    res.json({
      success: true,
      rates: rates
    });
  } catch (error) {
    console.error('Error getting current rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current rates',
      error: error.message
    });
  }
};

// Create new rate version
exports.createRateVersion = async (req, res) => {
  try {
    const {
      carrier,
      version,
      effectiveDate,
      baseRates,
      weightRates,
      surcharges,
      notes
    } = req.body;
    
    // Validate required fields
    if (!carrier || !version || !effectiveDate || !baseRates || !weightRates) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if version already exists
    const existingRate = await CarrierRate.findOne({ carrier, version });
    if (existingRate) {
      return res.status(400).json({
        success: false,
        message: `Rate version ${version} already exists for ${carrier}`
      });
    }
    
    // Create new rate
    const newRate = new CarrierRate({
      carrier: carrier.toLowerCase(),
      version,
      effectiveDate: new Date(effectiveDate),
      baseRates: new Map(Object.entries(baseRates)),
      weightRates: new Map(Object.entries(weightRates)),
      surcharges: surcharges || {},
      createdBy: req.user._id,
      notes: notes || ''
    });
    
    await newRate.save();
    
    res.json({
      success: true,
      message: `Rate version ${version} created successfully`,
      rateId: newRate._id
    });
  } catch (error) {
    console.error('Error creating rate version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create rate version',
      error: error.message
    });
  }
};

// Update existing rate version
exports.updateRateVersion = async (req, res) => {
  try {
    const { rateId } = req.params;
    const {
      baseRates,
      weightRates,
      surcharges,
      notes,
      effectiveDate
    } = req.body;
    
    const rate = await CarrierRate.findById(rateId);
    if (!rate) {
      return res.status(404).json({
        success: false,
        message: 'Rate version not found'
      });
    }
    
    // Update fields
    if (baseRates) rate.baseRates = new Map(Object.entries(baseRates));
    if (weightRates) rate.weightRates = new Map(Object.entries(weightRates));
    if (surcharges) rate.surcharges = { ...rate.surcharges, ...surcharges };
    if (notes !== undefined) rate.notes = notes;
    if (effectiveDate) rate.effectiveDate = new Date(effectiveDate);
    
    rate.updatedBy = req.user._id;
    
    await rate.save();
    
    res.json({
      success: true,
      message: 'Rate version updated successfully'
    });
  } catch (error) {
    console.error('Error updating rate version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rate version',
      error: error.message
    });
  }
};

// Activate a rate version
exports.activateRateVersion = async (req, res) => {
  try {
    const { rateId } = req.params;
    
    const rate = await CarrierRate.findById(rateId);
    if (!rate) {
      return res.status(404).json({
        success: false,
        message: 'Rate version not found'
      });
    }
    
    await rate.activate();
    
    res.json({
      success: true,
      message: `Rate version ${rate.version} activated for ${rate.carrier}`
    });
  } catch (error) {
    console.error('Error activating rate version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate rate version',
      error: error.message
    });
  }
};

// Delete rate version
exports.deleteRateVersion = async (req, res) => {
  try {
    const { rateId } = req.params;
    
    const rate = await CarrierRate.findById(rateId);
    if (!rate) {
      return res.status(404).json({
        success: false,
        message: 'Rate version not found'
      });
    }
    
    // Don't allow deletion of active rates
    if (rate.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active rate version. Please activate another version first.'
      });
    }
    
    await CarrierRate.findByIdAndDelete(rateId);
    
    res.json({
      success: true,
      message: 'Rate version deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rate version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rate version',
      error: error.message
    });
  }
};

// Import rates from CSV
exports.importRatesFromCSV = async (req, res) => {
  try {
    const { carrier, version, csvData } = req.body;
    
    // Parse CSV data (simplified - in production use proper CSV parser)
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    const baseRates = {};
    const weightRates = {};
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 3) {
        const serviceType = values[0].trim();
        const baseRate = parseFloat(values[1]);
        const weightRate = parseFloat(values[2]);
        
        if (serviceType && !isNaN(baseRate) && !isNaN(weightRate)) {
          baseRates[serviceType] = baseRate;
          weightRates[serviceType] = weightRate;
        }
      }
    }
    
    // Create new rate version
    const newRate = new CarrierRate({
      carrier: carrier.toLowerCase(),
      version,
      effectiveDate: new Date(),
      baseRates: new Map(Object.entries(baseRates)),
      weightRates: new Map(Object.entries(weightRates)),
      createdBy: req.user._id,
      notes: 'Imported from CSV'
    });
    
    await newRate.save();
    
    res.json({
      success: true,
      message: `Imported ${Object.keys(baseRates).length} rate entries`,
      rateId: newRate._id
    });
  } catch (error) {
    console.error('Error importing rates from CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import rates from CSV',
      error: error.message
    });
  }
};

// Get rate comparison between versions
exports.compareRateVersions = async (req, res) => {
  try {
    const { carrier, version1, version2 } = req.query;
    
    const rate1 = await CarrierRate.findOne({ carrier, version: version1 });
    const rate2 = await CarrierRate.findOne({ carrier, version: version2 });
    
    if (!rate1 || !rate2) {
      return res.status(404).json({
        success: false,
        message: 'One or both rate versions not found'
      });
    }
    
    // Calculate differences
    const comparison = {
      version1: version1,
      version2: version2,
      baseRateDifferences: {},
      weightRateDifferences: {},
      surchargeDifferences: {}
    };
    
    // Compare base rates
    for (const [service, rate] of rate1.baseRates) {
      const rate2Value = rate2.baseRates.get(service);
      if (rate2Value) {
        const difference = rate2Value - rate;
        const percentChange = ((difference / rate) * 100).toFixed(2);
        comparison.baseRateDifferences[service] = {
          old: rate,
          new: rate2Value,
          difference: difference,
          percentChange: percentChange
        };
      }
    }
    
    res.json({
      success: true,
      comparison: comparison
    });
  } catch (error) {
    console.error('Error comparing rate versions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare rate versions',
      error: error.message
    });
  }
};
