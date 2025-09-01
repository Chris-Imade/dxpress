const express = require("express");
const router = express.Router();
const { isAuthenticated, isUser } = require("../middleware/auth");
const dashboardController = require("../controllers/dashboard");

// Dashboard home - Role-based redirection
router.get("/", isAuthenticated, (req, res) => {
  // Redirect admin users to admin dashboard
  if (req.user.role === "admin") {
    return res.redirect("/admin");
  }
  
  // Ensure only users can access user dashboard
  if (req.user.role !== "user") {
    return res.redirect("/auth");
  }
  
  // Use controller for dashboard data
  dashboardController.getDashboard(req, res);
});

// Order Tracking
router.get("/tracking", isAuthenticated, isUser, (req, res) => {
  res.render("dashboard/tracking", {
    title: "Order Tracking",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/tracking"
  });
});

// API: Track specific shipment
router.get("/api/track/:trackingNumber", isAuthenticated, isUser, dashboardController.trackShipment);

// Shipping Rates
router.get("/rates", isAuthenticated, isUser, (req, res) => {
  res.render("dashboard/rates", {
    title: "Shipping Rates",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/rates"
  });
});

// API: Calculate shipping rates
router.get("/api/rates", isAuthenticated, isUser, dashboardController.getRates);

// Order Processing
router.get("/orders", isAuthenticated, isUser, (req, res) => {
  res.render("dashboard/orders", {
    title: "Order Processing",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/orders"
  });
});

// API: Get user shipments
router.get("/api/shipments", isAuthenticated, isUser, dashboardController.getShipments);

// Invoice Management
router.get("/invoices", isAuthenticated, isUser, (req, res) => {
  res.render("dashboard/invoices", {
    title: "Invoice Management",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/invoices"
  });
});

// Invoice routes
const invoiceController = require("../controllers/invoices");
router.get("/invoices/view/:invoiceId", isAuthenticated, isUser, invoiceController.viewInvoice);
router.get("/api/invoices", isAuthenticated, isUser, invoiceController.getInvoices);
router.get("/api/invoices/:invoiceId", isAuthenticated, isUser, invoiceController.getInvoice);
router.post("/api/invoices/create", isAuthenticated, isUser, invoiceController.createInvoiceFromShipment);
router.put("/api/invoices/:invoiceId", isAuthenticated, isUser, invoiceController.updateInvoice);
router.delete("/api/invoices/:invoiceId", isAuthenticated, isUser, invoiceController.deleteInvoice);
router.post("/api/invoices/:invoiceId/send", isAuthenticated, isUser, invoiceController.sendInvoice);
router.post("/api/invoices/:invoiceId/payment", isAuthenticated, isUser, invoiceController.recordPayment);

// GPS Tracking
router.get("/gps-tracking", isAuthenticated, isUser, (req, res) => {
  res.render("dashboard/gps-tracking", {
    title: "GPS Tracking",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/gps-tracking"
  });
});

// API: Get GPS tracking data
router.get("/api/gps-tracking", isAuthenticated, isUser, dashboardController.getGPSTracking);

// Notifications page
router.get("/notifications", isAuthenticated, isUser, (req, res) => {
  res.render("dashboard/notifications", {
    title: "Notifications",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/notifications"
  });
});

// Create Shipment
router.get("/create-shipment", isAuthenticated, isUser, (req, res) => {
  res.render("dashboard/create-shipment", {
    title: "Create Shipment",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/create-shipment"
  });
});

// API: Multi-step shipment creation
router.post("/api/save-shipment-data", isAuthenticated, isUser, dashboardController.saveShipmentData);
router.post("/api/select-carrier", isAuthenticated, isUser, dashboardController.selectCarrierAndProceedToPayment);
router.post("/api/process-payment", isAuthenticated, isUser, dashboardController.processPaymentAndCreateShipment);
router.post("/api/payment-callback", dashboardController.handlePaymentCallback);

// API: Legacy create shipment (backward compatibility)
router.post("/api/create-shipment", isAuthenticated, isUser, dashboardController.createShipment);

// Profile
router.get("/profile", isAuthenticated, isUser, (req, res) => {
  res.render("dashboard/profile", {
    title: "Profile",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/profile"
  });
});

module.exports = router;
