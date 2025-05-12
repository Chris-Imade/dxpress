const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/service");
const journalController = require("../controllers/journal");

// Main journal page
router.get("/", serviceController.getDxpressJournalPage);

// Individual journal article pages
router.get("/:slug", journalController.getJournalArticle);

module.exports = router;
