const express = require("express");
const router = express.Router();
const shipmentController = require("../controllers/shipment");

// Handle both GET and POST requests for /track-shipment
router.get("/", (req, res) => {
  res.redirect("/shipment/track");
});

router.post("/", (req, res) => {
  // Forward the POST request to the shipment controller
  shipmentController.trackShipment(req, res);
});

module.exports = router;
