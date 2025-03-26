const express = require("express");
const router = express.Router();

// Login route
router.get("/login", (req, res) => {
  res.render("auth/login", {
    title: "Login",
    layout: false,
    error: null,
  });
});

// Login POST route - handle authentication
router.post("/login", (req, res) => {
  // This would be implemented with proper authentication logic
  // For now just redirecting
  res.redirect("/admin/dashboard");
});

// Register route
router.get("/register", (req, res) => {
  res.render("auth/register", {
    title: "Register",
    layout: false,
    error: null,
  });
});

// Register POST route
router.post("/register", (req, res) => {
  // This would be implemented with user creation logic
  res.redirect("/auth/login");
});

// Logout route
router.get("/logout", (req, res) => {
  // Clear session
  if (req.session) {
    req.session.destroy();
  }
  res.redirect("/");
});

module.exports = router;
