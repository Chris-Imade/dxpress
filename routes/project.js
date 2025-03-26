const express = require("express");
const router = express.Router();

// Controllers
const projectController = require("../controllers/project");

// Project pages
router.get("/", projectController.getProjectsPage);
router.get("/:id", projectController.getProjectDetailsPage);

module.exports = router;
