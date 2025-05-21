const express = require("express");
const router = express.Router();
const Shipment = require("../models/Shipment");

// Controllers
const shipmentController = require("../controllers/shipment");

// Tracking page
router.get("/track", shipmentController.getTrackingPage);
router.post("/track", shipmentController.trackShipment);

// New shipment request
router.get("/request", shipmentController.getRequestPage);
router.post("/request", shipmentController.createShipmentRequest);

// Shipment confirmation page
router.get("/confirmation", async (req, res) => {
  try {
    const {
      shipmentId,
      payment_intent,
      payment_intent_client_secret,
      redirect_status,
    } = req.query;

    if (!shipmentId) {
      return res.status(400).render("error", {
        message: "Shipment ID is required",
      });
    }

    // Find the shipment
    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).render("error", {
        message: "Shipment not found",
      });
    }

    // If this is a Stripe payment redirect
    if (payment_intent && redirect_status === "succeeded") {
      // Update shipment payment status
      shipment.paymentStatus = "paid";
      shipment.paymentCompletedAt = new Date();
      await shipment.save();

      // Add tracking history entry
      shipment.trackingHistory.push({
        status: "processing",
        location: "Payment Processing Center",
        description: "Payment received, preparing shipment",
      });
      await shipment.save();
    }

    res.render("shipment/confirmation", {
      shipment,
      paymentStatus: redirect_status,
      paymentIntent: payment_intent,
    });
  } catch (error) {
    console.error("Error in confirmation page:", error);
    res.status(500).render("error", {
      message: "Error loading confirmation page",
    });
  }
});

module.exports = router;
