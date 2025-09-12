const express = require("express");
const router = express.Router();
const apiController = require("../controllers/api");
const adminController = require("../controllers/admin");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.get("/shipping-rates", apiController.getShippingRates);

// Payment API endpoints
router.post("/payments/create", apiController.createPayment);
router.post("/payments/confirm", apiController.confirmPayment);

// Shipment API endpoints
router.post("/shipments/create", apiController.createShipment);

// Admin API endpoints
router.post("/admin/newsletter/send", isAuthenticated, isAdmin, adminController.sendNewsletter);
router.post("/admin/notifications/broadcast", isAuthenticated, isAdmin, adminController.broadcastNotification);

module.exports = router;
