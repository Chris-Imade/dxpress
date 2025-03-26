const express = require("express");
const router = express.Router();

// Controllers
const contactController = require("../controllers/contact");

// Contact page
router.get("/", contactController.getContactPage);
router.post("/", contactController.submitContactForm);

module.exports = router;
