const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/service");

router.get("/", serviceController.getDxpressJournalPage);

module.exports = router;
