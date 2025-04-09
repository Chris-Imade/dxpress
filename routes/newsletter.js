const express = require("express");
const router = express.Router();
const newsletterController = require("../controllers/newsletter");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// Public routes
router.post("/subscribe", async (req, res, next) => {
  try {
    await newsletterController.subscribe(req, res);
  } catch (error) {
    console.error("Newsletter subscription route error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your subscription",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/unsubscribe", async (req, res, next) => {
  try {
    await newsletterController.unsubscribe(req, res);
  } catch (error) {
    console.error("Newsletter unsubscribe route error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your unsubscribe request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Admin routes - protected
router.get(
  "/admin/newsletter",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    try {
      await newsletterController.getNewsletterPage(req, res);
    } catch (error) {
      console.error("Get newsletter page error:", error);
      res.status(500).render("admin/error", {
        title: "Error",
        path: "/admin/newsletter",
        message: "An error occurred while retrieving newsletter subscribers",
      });
    }
  }
);

router.delete(
  "/admin/newsletter/:id",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    try {
      await newsletterController.deleteSubscriber(req, res);
    } catch (error) {
      console.error("Delete subscriber error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while deleting the subscriber",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Email routes - protected
router.post(
  "/admin/send-email",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    try {
      await newsletterController.sendEmail(req, res);
    } catch (error) {
      console.error("Send email error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while sending the email",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

router.post(
  "/admin/send-mass-email",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    try {
      await newsletterController.sendMassEmail(req, res);
    } catch (error) {
      console.error("Send mass email error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while sending mass emails",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Export route - protected
router.get(
  "/admin/newsletter/export",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    try {
      await newsletterController.exportSubscribers(req, res);
    } catch (error) {
      console.error("Export subscribers error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while exporting subscribers",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
