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
router.get(
  "/dashboard",
  isAuthenticated,
  isStaff,
  adminController.getDashboard
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
router.delete(
  "/shipments/:id",
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

// Setup route (for initial admin creation) - should be removed or secured in production
if (process.env.NODE_ENV !== "production") {
  router.post("/setup", authController.createAdminUser);
}

// Admin login route
router.get("/login", (req, res) => {
  res.render("admin/login", {
    // layout: "admin/layouts/login",
    title: "Admin Login",
  });
});

module.exports = router; // Export only the router
