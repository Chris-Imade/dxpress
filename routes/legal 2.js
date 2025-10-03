const express = require("express");
const router = express.Router();

// Terms of Service page
router.get("/terms", (req, res) => {
  res.render("legal/terms", {
    title: "Terms of Service",
    layout: false
  });
});

// Privacy Policy page
router.get("/privacy", (req, res) => {
  res.render("legal/privacy", {
    title: "Privacy Policy",
    layout: false
  });
});

module.exports = router;
