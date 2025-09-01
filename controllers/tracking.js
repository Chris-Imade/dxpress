const Shipment = require("../models/Shipment");
const dhlService = require("../services/dhlService");
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
    
    // Get live tracking from DHL if it's a DHL shipment
    if (shipment.carrier === 'dhl' && shipment.dhlShipmentId) {
      try {
        trackingData = await dhlService.trackShipment(shipment.dhlShipmentId);
        
        // Update shipment status if different
        if (trackingData.status !== shipment.status) {
          shipment.status = trackingData.status;
          shipment.statusHistory = trackingData.events.map(event => ({
            status: event.status,
            location: event.location,
            timestamp: event.timestamp,
            note: event.description,
          }));
          await shipment.save();
        }
      } catch (error) {
        console.error("DHL tracking error:", error);
        // Fall back to database data
        trackingData = {
          trackingNumber: shipment.trackingId,
          status: shipment.status,
          currentLocation: shipment.statusHistory?.[0]?.location || "Unknown",
          estimatedDelivery: shipment.estimatedDelivery,
          events: shipment.statusHistory || [],
        };
      }
    } else {
      // Use database data for non-DHL shipments
      trackingData = {
        trackingNumber: shipment.trackingId,
        status: shipment.status,
        currentLocation: shipment.statusHistory?.[0]?.location || "Unknown",
        estimatedDelivery: shipment.estimatedDelivery,
        events: shipment.statusHistory || [],
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
    shipment.statusHistory.unshift({
      status,
      location,
      note: note || "",
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

// Sync all DHL shipments with live data
exports.syncDHLShipments = async (req, res) => {
  try {
    const dhlShipments = await Shipment.find({ 
      carrier: 'dhl', 
      dhlShipmentId: { $exists: true },
      status: { $nin: ['delivered', 'cancelled'] }
    });

    let syncedCount = 0;
    let errorCount = 0;

    for (const shipment of dhlShipments) {
      try {
        const trackingData = await dhlService.trackShipment(shipment.dhlShipmentId);
        
        // Update if status changed
        if (trackingData.status !== shipment.status) {
          shipment.status = trackingData.status;
          shipment.statusHistory = trackingData.events.map(event => ({
            status: event.status,
            location: event.location,
            timestamp: event.timestamp,
            note: event.description,
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
        operation: "dhl_sync",
        totalShipments: dhlShipments.length,
        syncedCount,
        errorCount,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      success: true,
      message: `Synced ${syncedCount} shipments, ${errorCount} errors`,
      syncedCount,
      errorCount,
    });
  } catch (error) {
    console.error("Sync DHL shipments error:", error);
    res.status(500).json({ error: "Failed to sync DHL shipments" });
  }
};
