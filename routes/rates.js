const express = require("express");
const router = express.Router();
const ratesController = require("../controllers/rates");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// All routes require admin authentication
router.use(isAuthenticated);
router.use(isAdmin);

// Get rates management page
router.get("/", ratesController.getRates);

// Update DHL rates with markup
router.post("/dhl/update", ratesController.updateDHLRates);

// Create custom rate
router.post("/create", ratesController.createRate);

// Update existing rate
router.post("/update/:id", ratesController.updateRate);

// Delete rate
router.delete("/delete/:id", ratesController.deleteRate);

module.exports = router;
