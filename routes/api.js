const express = require("express");
const router = express.Router();
const apiController = require("../controllers/api");

router.get("/shipping-rates", apiController.getShippingRates);

module.exports = router;
