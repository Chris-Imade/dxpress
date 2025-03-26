const express = require("express");
const router = express.Router();

// Controllers
const aboutController = require("../controllers/about");

// About page
router.get("/", aboutController.getAboutPage);

module.exports = router;
