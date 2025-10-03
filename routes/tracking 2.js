const express = require("express");
const router = express.Router();
const trackingController = require("../controllers/tracking");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// Get live tracking data (public endpoint)
router.get("/live/:trackingId", trackingController.getLiveTracking);

// Admin-only routes
router.use(isAuthenticated);
router.use(isAdmin);

// Update tracking status manually
router.post("/update/:trackingId", trackingController.updateTrackingStatus);

// Sync all DHL shipments with live data
router.post("/sync-dhl", trackingController.syncDHLShipments);

module.exports = router;
