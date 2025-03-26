const express = require("express");
const router = express.Router();
const newsletterController = require("../controllers/newsletter");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// Public routes
router.post("/subscribe", newsletterController.subscribe);
router.get("/unsubscribe", newsletterController.unsubscribe);

// Admin routes - protected
router.get(
  "/admin/newsletter",
  isAuthenticated,
  isAdmin,
  newsletterController.getNewsletterPage
);
router.delete(
  "/admin/newsletter/:id",
  isAuthenticated,
  isAdmin,
  newsletterController.deleteSubscriber
);

// Email routes - protected
router.post(
  "/admin/send-email",
  isAuthenticated,
  isAdmin,
  newsletterController.sendEmail
);
router.post(
  "/admin/send-mass-email",
  isAuthenticated,
  isAdmin,
  newsletterController.sendMassEmail
);

// Export route - protected
router.get(
  "/admin/newsletter/export",
  isAuthenticated,
  isAdmin,
  newsletterController.exportSubscribers
);

module.exports = router;
