const express = require("express");
const router = express.Router();
const auditLogsController = require("../controllers/auditLogs");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// All routes require admin authentication
router.use(isAuthenticated);
router.use(isAdmin);

// Get audit logs page with filtering and export
router.get("/", auditLogsController.getAuditLogs);

module.exports = router;
