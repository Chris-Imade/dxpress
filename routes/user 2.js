const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");

// Dashboard routes are now handled by /routes/dashboard.js

// User profile
router.get("/profile", isAuthenticated, (req, res) => {
  res.render("user/profile", {
    title: "Profile",
    layout: false,
    user: req.user
  });
});

module.exports = router;
