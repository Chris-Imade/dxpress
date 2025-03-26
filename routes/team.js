const express = require("express");
const router = express.Router();

// Controllers
const teamController = require("../controllers/team");

// Team pages
router.get("/", teamController.getTeamPage);
router.get("/:id", teamController.getTeamDetailsPage);

module.exports = router;
