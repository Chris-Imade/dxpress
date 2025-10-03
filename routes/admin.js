const express = require("express");
const router = express.Router();

// Import controllers
const authController = require("../controllers/auth");
const adminController = require("../controllers/admin");

// Import middleware
const { isAuthenticated, isAdmin, isStaff } = require("../middleware/auth");

// Authentication routes
router.get("/login", authController.getLoginPage);
router.post("/login", authController.login);
router.get("/logout", isAuthenticated, authController.logout);

// Password reset routes
router.get("/forgot-password", authController.getForgotPasswordPage);
router.post("/forgot-password", authController.forgotPassword);
router.get("/reset-password/:token", authController.getResetPasswordPage);
router.post("/reset-password", authController.resetPassword);

// Admin dashboard
router.get("/", isAuthenticated, isAdmin, adminController.getDashboard);

// Settings route
router.get("/settings", isAuthenticated, isAdmin, adminController.getSettings);
router.post(
  "/settings",
  isAuthenticated,
  isAdmin,
  adminController.postSettings
);

// Shipment management routes
router.get(
  "/shipments",
  isAuthenticated,
  isStaff,
  adminController.getShipments
);
router.get(
  "/shipments/create",
  isAuthenticated,
  isStaff,
  adminController.getCreateShipment
);
router.post(
  "/shipments/create",
  isAuthenticated,
  isStaff,
  adminController.createShipment
);
router.get(
  "/shipments/edit/:id",
  isAuthenticated,
  isStaff,
  adminController.getEditShipment
);
router.post(
  "/shipments/edit/:id",
  isAuthenticated,
  isStaff,
  adminController.updateShipment
);
router.post(
  "/shipments/delete/:id",
  isAuthenticated,
  isAdmin,
  adminController.deleteShipment
);

// Newsletter management
router.get(
  "/newsletter",
  isAuthenticated,
  isAdmin,
  adminController.getNewsletterSubscribers
);
router.get(
  "/newsletter/export-csv",
  isAuthenticated,
  isAdmin,
  adminController.exportNewsletterCSV
);
router.delete(
  "/newsletter/:id",
  isAuthenticated,
  isAdmin,
  adminController.deleteNewsletterSubscriber
);

// User management routes
router.get(
  "/users",
  isAuthenticated,
  isAdmin,
  adminController.getUsers
);
router.get(
  "/users/:id",
  isAuthenticated,
  isAdmin,
  adminController.getUser
);
router.post(
  "/users/:id",
  isAuthenticated,
  isAdmin,
  adminController.postUser
);
router.delete(
  "/users/:id",
  isAuthenticated,
  isAdmin,
  adminController.deleteUser
);

// Notifications management
router.get(
  "/notifications",
  isAuthenticated,
  isAdmin,
  adminController.getNotifications
);

// API routes for admin functionality
router.get(
  "/api/users/suggestions",
  isAuthenticated,
  isAdmin,
  adminController.getUserSuggestions
);

router.get(
  "/api/shipments/analytics",
  isAuthenticated,
  isAdmin,
  adminController.getShipmentAnalytics
);

// Shipment template API routes
router.get(
  "/api/shipment-templates",
  isAuthenticated,
  isStaff,
  adminController.getShipmentTemplates
);

router.get(
  "/api/shipment-templates/:id",
  isAuthenticated,
  isStaff,
  adminController.getShipmentTemplate
);

router.post(
  "/api/shipment-templates",
  isAuthenticated,
  isStaff,
  adminController.createShipmentTemplate
);

router.put(
  "/api/shipment-templates/:id",
  isAuthenticated,
  isStaff,
  adminController.updateShipmentTemplate
);

router.delete(
  "/api/shipment-templates/:id",
  isAuthenticated,
  isStaff,
  adminController.deleteShipmentTemplate
);

// Shipment draft API route
router.post(
  "/api/shipments/draft",
  isAuthenticated,
  isStaff,
  adminController.createShipmentDraft
);

// Enhanced shipment creation API
router.post(
  "/api/shipments",
  isAuthenticated,
  isStaff,
  adminController.createShipment
);

// Newsletter API routes
router.post(
  "/api/newsletter/send",
  isAuthenticated,
  isAdmin,
  adminController.sendNewsletter
);

// Notification API routes
router.post(
  "/api/notifications/broadcast",
  isAuthenticated,
  isAdmin,
  adminController.broadcastNotification
);

// Setup route (for initial admin creation) - should be removed or secured in production
if (process.env.NODE_ENV !== "production") {
  router.post("/setup", authController.createAdminUser);
}

module.exports = router;
