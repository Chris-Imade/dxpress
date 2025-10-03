const Shipment = require("../models/Shipment");
const carrierService = require("../services/carriers");
const AuditLog = require("../models/AuditLog");

// Get live tracking data for user dashboard
exports.getLiveTracking = async (req, res) => {
  try {
    const { trackingId } = req.params;
    
    // Find shipment in database
    const shipment = await Shipment.findOne({ trackingId });
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    let trackingData = null;
    
    // Get live tracking data based on carrier
    const carrierTrackingNumber = shipment.carrierTrackingNumber || shipment.trackingId;
    
    try {
      // Try to get live tracking from the carrier service
      if (shipment.carrier && shipment.carrier.toLowerCase() === 'fedex') {
        trackingData = await carrierService.trackShipment(carrierTrackingNumber, 'fedex');
        
        // Update shipment status if different
        if (trackingData.status !== shipment.status) {
          shipment.status = trackingData.status;
          shipment.trackingHistory = trackingData.events.map(event => ({
            status: event.status,
            location: event.location,
            timestamp: event.timestamp,
            description: event.description,
          }));
          await shipment.save();
        }
      } else {
        // Use database data for other carriers or fallback
        trackingData = {
          trackingNumber: shipment.trackingId,
          status: shipment.status,
          location: shipment.trackingHistory?.[0]?.location || "Unknown",
          estimatedDelivery: shipment.estimatedDelivery,
          events: shipment.trackingHistory || [],
        };
      }
    } catch (error) {
      console.error(`${shipment.carrier} tracking error:`, error);
      // Fall back to database data
      trackingData = {
        trackingNumber: shipment.trackingId,
        status: shipment.status,
        location: shipment.trackingHistory?.[0]?.location || "Unknown",
        estimatedDelivery: shipment.estimatedDelivery,
        events: shipment.trackingHistory || [],
      };
    }

    res.json({
      success: true,
      shipment: {
        trackingId: shipment.trackingId,
        customerName: shipment.customerName,
        origin: shipment.origin,
        destination: shipment.destination,
        carrier: shipment.carrier,
        service: shipment.service,
        ...trackingData,
      },
    });
  } catch (error) {
    console.error("Get live tracking error:", error);
    res.status(500).json({ error: "Failed to get tracking information" });
  }
};

// Update tracking status (admin only)
exports.updateTrackingStatus = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { status, location, note } = req.body;

    const shipment = await Shipment.findOne({ trackingId });
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // Add new status to history
    shipment.trackingHistory.unshift({
      status,
      location,
      description: note || "",
      timestamp: new Date(),
    });

    // Update current status
    shipment.status = status;
    await shipment.save();

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: "UPDATE_SHIPMENT",
      resource: "shipment",
      resourceId: shipment._id.toString(),
      details: {
        trackingId: shipment.trackingId,
        newStatus: status,
        location,
        note,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ success: true, message: "Tracking status updated successfully" });
  } catch (error) {
    console.error("Update tracking status error:", error);
    res.status(500).json({ error: "Failed to update tracking status" });
  }
};

// Sync all carrier shipments with live data
exports.syncCarrierShipments = async (req, res) => {
  try {
    const { carrier = 'fedex' } = req.query;
    
    const activeShipments = await Shipment.find({ 
      carrier: { $regex: new RegExp(carrier, 'i') },
      carrierTrackingNumber: { $exists: true },
      status: { $nin: ['delivered', 'cancelled'] }
    });

    let syncedCount = 0;
    let errorCount = 0;

    for (const shipment of activeShipments) {
      try {
        const trackingData = await carrierService.trackShipment(
          shipment.carrierTrackingNumber || shipment.trackingId, 
          carrier.toLowerCase()
        );
        
        // Update if status changed
        if (trackingData.status !== shipment.status) {
          shipment.status = trackingData.status;
          shipment.trackingHistory = trackingData.events.map(event => ({
            status: event.status,
            location: event.location,
            timestamp: event.timestamp,
            description: event.description,
          }));
          await shipment.save();
          syncedCount++;
        }
      } catch (error) {
        console.error(`Failed to sync shipment ${shipment.trackingId}:`, error);
        errorCount++;
      }
    }

    // Log the sync operation
    await AuditLog.create({
      userId: req.user._id,
      action: "API_CALL",
      resource: "shipment",
      details: {
        operation: `${carrier}_sync`,
        totalShipments: activeShipments.length,
        syncedCount,
        errorCount,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      success: true,
      message: `Synced ${syncedCount} ${carrier} shipments, ${errorCount} errors`,
      syncedCount,
      errorCount,
    });
  } catch (error) {
    console.error(`Sync ${req.query.carrier || 'carrier'} shipments error:`, error);
    res.status(500).json({ error: `Failed to sync ${req.query.carrier || 'carrier'} shipments` });
  }
};

// Legacy DHL sync endpoint (for backward compatibility)
exports.syncDHLShipments = async (req, res) => {
  req.query.carrier = 'dhl';
  return exports.syncCarrierShipments(req, res);
};

// New FedEx sync endpoint
exports.syncFedExShipments = async (req, res) => {
  req.query.carrier = 'fedex';
  return exports.syncCarrierShipments(req, res);
};
