const ShipmentRate = require("../models/ShipmentRate");
const AuditLog = require("../models/AuditLog");
const dhlService = require("../services/dhlService");

// Get all rates (admin view)
exports.getRates = async (req, res) => {
  try {
    const rates = await ShipmentRate.find({ isActive: true })
      .populate("updatedBy", "name email")
      .sort({ carrier: 1, service: 1 });

    res.render("admin/rates", {
      title: "Manage Rates",
      path: "/admin/rates",
      layout: "layouts/admin-dashboard",
      rates,
      stylesheets: "",
      scripts: "",
      req: req,
    });
  } catch (error) {
    console.error("Get rates error:", error);
    res.status(500).render("admin/500", {
      title: "Server Error",
      path: "/500",
      layout: "layouts/admin-dashboard",
      error: process.env.NODE_ENV === "production" ? null : error,
      stylesheets: "",
      scripts: "",
    });
  }
};

// Update DHL rates with markup
exports.updateDHLRates = async (req, res) => {
  try {
    const { markupPercentage } = req.body;
    const markup = parseFloat(markupPercentage) || 0;

    // Sample shipment data for rate calculation
    const sampleShipment = {
      origin: {
        address: "123 Sample St",
        city: "London",
        postalCode: "SW1A 1AA",
        country: "United Kingdom",
      },
      destination: {
        address: "456 Test Ave",
        city: "Manchester",
        postalCode: "M1 1AA",
        country: "United Kingdom",
      },
      weight: 1,
      dimensions: { length: 10, width: 10, height: 10 },
      packageType: "small_box",
      declaredValue: 100,
    };

    // Get rates from DHL
    const dhlRates = await dhlService.calculateRates(sampleShipment);
    
    // Apply markup and save to database
    const savedRates = await dhlService.applyMarkupAndSave(dhlRates, markup);

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: "UPDATE_RATES",
      resource: "rates",
      details: {
        carrier: "dhl",
        markupPercentage: markup,
        ratesUpdated: savedRates.length,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.redirect("/admin/rates?message=DHL rates updated successfully");
  } catch (error) {
    console.error("Update DHL rates error:", error);
    
    // Log the error
    await AuditLog.create({
      userId: req.user._id,
      action: "UPDATE_RATES",
      resource: "rates",
      details: { carrier: "dhl", error: error.message },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: false,
      errorMessage: error.message,
    });

    res.redirect("/admin/rates?error=Failed to update DHL rates: " + error.message);
  }
};

// Update custom rate
exports.updateRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { baseRate, markup, isActive } = req.body;

    const rate = await ShipmentRate.findById(id);
    if (!rate) {
      return res.status(404).redirect("/admin/rates?error=Rate not found");
    }

    const finalRate = parseFloat(baseRate) + parseFloat(markup || 0);

    rate.baseRate = parseFloat(baseRate);
    rate.markup = parseFloat(markup || 0);
    rate.finalRate = finalRate;
    rate.isActive = isActive === "on";
    rate.updatedBy = req.user._id;
    rate.lastUpdated = new Date();

    await rate.save();

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: "UPDATE_RATES",
      resource: "rates",
      resourceId: rate._id.toString(),
      details: {
        carrier: rate.carrier,
        service: rate.service,
        oldRate: rate.finalRate,
        newRate: finalRate,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.redirect("/admin/rates?message=Rate updated successfully");
  } catch (error) {
    console.error("Update rate error:", error);
    res.redirect("/admin/rates?error=Failed to update rate: " + error.message);
  }
};

// Create custom rate
exports.createRate = async (req, res) => {
  try {
    const { carrier, service, baseRate, markup, currency, weightMin, weightMax, zone } = req.body;

    const finalRate = parseFloat(baseRate) + parseFloat(markup || 0);

    const rate = new ShipmentRate({
      carrier,
      service,
      baseRate: parseFloat(baseRate),
      markup: parseFloat(markup || 0),
      finalRate,
      currency: currency || "GBP",
      weightRange: {
        min: parseFloat(weightMin || 0),
        max: parseFloat(weightMax || 999999),
      },
      zone: zone || "domestic",
      updatedBy: req.user._id,
    });

    await rate.save();

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: "UPDATE_RATES",
      resource: "rates",
      resourceId: rate._id.toString(),
      details: {
        action: "create",
        carrier: rate.carrier,
        service: rate.service,
        finalRate,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.redirect("/admin/rates?message=Rate created successfully");
  } catch (error) {
    console.error("Create rate error:", error);
    res.redirect("/admin/rates?error=Failed to create rate: " + error.message);
  }
};

// Delete rate
exports.deleteRate = async (req, res) => {
  try {
    const { id } = req.params;
    const rate = await ShipmentRate.findById(id);
    
    if (!rate) {
      return res.status(404).redirect("/admin/rates?error=Rate not found");
    }

    await ShipmentRate.findByIdAndDelete(id);

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: "UPDATE_RATES",
      resource: "rates",
      resourceId: id,
      details: {
        action: "delete",
        carrier: rate.carrier,
        service: rate.service,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.redirect("/admin/rates?message=Rate deleted successfully");
  } catch (error) {
    console.error("Delete rate error:", error);
    res.redirect("/admin/rates?error=Failed to delete rate: " + error.message);
  }
};
