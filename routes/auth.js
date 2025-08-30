const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");

// Modern signup/signin page
router.get("/", (req, res) => {
  res.render("auth/signup-signin", {
    title: "Sign In",
    layout: false,
    error: null,
  });
});

// Login route (legacy - redirects to main auth page)
router.get("/login", (req, res) => {
  res.redirect("/auth");
});

// Register route (legacy - redirects to main auth page with signup mode)
router.get("/register", (req, res) => {
  res.redirect("/auth?mode=signup");
});

// Login POST route - handle authentication
router.post("/login", authController.login);

// Register POST route - handle user registration
router.post("/register", authController.register);

// Forgot password routes
router.get("/forgot-password", (req, res) => {
  res.render("auth/forgot-password", {
    title: "Forgot Password",
    layout: false,
    error: null,
  });
});

router.post("/forgot-password", authController.forgotPassword);

// Reset password routes
router.get("/reset-password/:token", authController.getResetPassword);
router.post("/reset-password/:token", authController.resetPassword);

// Logout route
router.get("/logout", authController.logout);

module.exports = router;
