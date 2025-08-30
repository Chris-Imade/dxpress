const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");

// Dashboard home
router.get("/", isAuthenticated, (req, res) => {
  res.render("dashboard/index", {
    title: "Dashboard",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard"
  });
});

// Order Tracking
router.get("/tracking", isAuthenticated, (req, res) => {
  res.render("dashboard/tracking", {
    title: "Order Tracking",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/tracking"
  });
});

// Shipping Rates
router.get("/rates", isAuthenticated, (req, res) => {
  res.render("dashboard/rates", {
    title: "Shipping Rates",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/rates"
  });
});

// Order Processing
router.get("/orders", isAuthenticated, (req, res) => {
  res.render("dashboard/orders", {
    title: "Order Processing",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/orders"
  });
});

// Invoice Management
router.get("/invoices", isAuthenticated, (req, res) => {
  res.render("dashboard/invoices", {
    title: "Invoice Management",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/invoices"
  });
});

// GPS Tracking
router.get("/gps-tracking", isAuthenticated, (req, res) => {
  res.render("dashboard/gps-tracking", {
    title: "GPS Tracking",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/gps-tracking"
  });
});

// Create Shipment
router.get("/create-shipment", isAuthenticated, (req, res) => {
  res.render("dashboard/create-shipment", {
    title: "Create Shipment",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/create-shipment"
  });
});

// Profile
router.get("/profile", isAuthenticated, (req, res) => {
  res.render("dashboard/profile", {
    title: "Profile",
    layout: "layouts/dashboard",
    user: req.user,
    path: "/dashboard/profile"
  });
});

module.exports = router;
