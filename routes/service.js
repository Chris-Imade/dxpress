const express = require("express");
const router = express.Router();

// Controllers
const serviceController = require("../controllers/service");

// Services pages
router.get("/", serviceController.getServicesPage);
router.get("/:id", serviceController.getServiceDetailsPage);
router.get(
  "/ecommerce-integration",
  serviceController.getEcommerceIntegrationPage
);

// DXpress Journal route
router.get("/dxpress-journal", serviceController.getDxpressJournalPage);

// International Shipping route
router.get(
  "/international-shipping",
  serviceController.getInternationalShippingPage
);

module.exports = router;
