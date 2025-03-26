const Newsletter = require("../models/Newsletter");
const emailService = require("../config/email");
const crypto = require("crypto");

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({
          success: false,
          message: "This email is already subscribed to our newsletter",
        });
      } else {
        // Reactivate the subscription
        existingSubscriber.isActive = true;
        await existingSubscriber.save();

        // Send welcome email
        await emailService.sendWelcomeEmail(email);

        return res.status(200).json({
          success: true,
          message: "Your subscription has been reactivated successfully!",
        });
      }
    }

    // Generate confirmation token
    const confirmationToken = crypto.randomBytes(20).toString("hex");
    const confirmationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new subscriber
    const newSubscriber = new Newsletter({
      email,
      confirmationToken,
      confirmationExpires,
      isConfirmed: true, // Auto-confirm for now, can be changed to false if email confirmation is required
    });

    await newSubscriber.save();

    // Send welcome email
    await emailService.sendWelcomeEmail(email);

    res.status(200).json({
      success: true,
      message: "Thank you for subscribing to our newsletter!",
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your subscription",
    });
  }
};

// Confirm subscription through token
exports.confirmSubscription = async (req, res) => {
  try {
    const { token } = req.params;

    const subscriber = await Newsletter.findOne({
      confirmationToken: token,
      confirmationExpires: { $gt: new Date() },
    });

    if (!subscriber) {
      return res.render("newsletter/confirmation", {
        title: "Confirmation Failed",
        path: "/newsletter/confirmation",
        success: false,
        message: "Invalid or expired confirmation link",
      });
    }

    // Confirm subscription
    subscriber.isConfirmed = true;
    subscriber.confirmationToken = null;
    subscriber.confirmationExpires = null;
    await subscriber.save();

    return res.render("newsletter/confirmation", {
      title: "Subscription Confirmed",
      path: "/newsletter/confirmation",
      success: true,
      message: "Your subscription has been confirmed",
    });
  } catch (error) {
    console.error("Confirmation error:", error);
    return res.render("newsletter/confirmation", {
      title: "Confirmation Error",
      path: "/newsletter/confirmation",
      success: false,
      message: "An error occurred during confirmation",
    });
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const subscriber = await Newsletter.findOne({ email });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "This email is not subscribed to our newsletter",
      });
    }

    // Update subscription status
    subscriber.isActive = false;
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: "You have been unsubscribed from our newsletter successfully",
    });
  } catch (error) {
    console.error("Newsletter unsubscription error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
    });
  }
};

// Get all subscribers (admin only)
exports.getAllSubscribers = async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = "subscriptionDate",
      sortOrder = "desc",
    } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.email = { $regex: search, $options: "i" };
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get subscribers with pagination
    const subscribers = await Newsletter.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalSubscribers = await Newsletter.countDocuments(query);

    return {
      subscribers,
      totalPages: Math.ceil(totalSubscribers / limit),
      currentPage: parseInt(page),
      totalSubscribers,
    };
  } catch (error) {
    console.error("Error getting subscribers:", error);
    throw error;
  }
};

// Admin route to render newsletter subscribers page
exports.getNewsletterPage = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const data = await this.getAllSubscribers(req, res);

    res.render("admin/newsletter", {
      title: "Newsletter Subscribers",
      path: "/admin/newsletter",
      subscribers: data.subscribers,
      pagination: {
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        totalItems: data.totalSubscribers,
      },
      search: search || "",
      limit,
    });
  } catch (error) {
    console.error("Error rendering newsletter page:", error);
    res.status(500).render("admin/error", {
      title: "Error",
      path: "/admin/newsletter",
      message: "An error occurred while retrieving newsletter subscribers",
    });
  }
};

// Admin API to delete a subscriber
exports.deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await Newsletter.findById(id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found",
      });
    }

    await Newsletter.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Subscriber deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subscriber:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the subscriber",
    });
  }
};

// Send individual email to subscriber
exports.sendEmail = async (req, res) => {
  try {
    const { email, subject, content } = req.body;

    if (!email || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: "Email, subject, and content are required",
      });
    }

    // Send email
    const result = await emailService.sendEmail(email, subject, content);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send email",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while sending the email",
    });
  }
};

// Send mass email to all subscribers
exports.sendMassEmail = async (req, res) => {
  try {
    const { subject, content, activeOnly } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: "Subject and content are required",
      });
    }

    // Build query to get subscribers
    const query = activeOnly ? { isActive: true } : {};

    // Get all subscribers
    const subscribers = await Newsletter.find(query);

    if (subscribers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subscribers found to send email to",
      });
    }

    // Send emails in batches to avoid overwhelming the email server
    const batchSize = 10;
    const totalBatches = Math.ceil(subscribers.length / batchSize);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < totalBatches; i++) {
      const startIdx = i * batchSize;
      const endIdx = Math.min(startIdx + batchSize, subscribers.length);
      const batch = subscribers.slice(startIdx, endIdx);

      const promises = batch.map(async (subscriber) => {
        try {
          const result = await emailService.sendEmail(
            subscriber.email,
            subject,
            content
          );
          if (result.success) {
            successCount++;
            return { success: true, email: subscriber.email };
          } else {
            failCount++;
            return {
              success: false,
              email: subscriber.email,
              error: result.error,
            };
          }
        } catch (error) {
          failCount++;
          return {
            success: false,
            email: subscriber.email,
            error: error.message,
          };
        }
      });

      await Promise.all(promises);
    }

    res.status(200).json({
      success: true,
      message: `Email campaign completed: ${successCount} emails sent successfully, ${failCount} failed`,
      totalEmails: subscribers.length,
      successCount,
      failCount,
    });
  } catch (error) {
    console.error("Error sending mass email:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while sending emails",
    });
  }
};

// Export subscribers to CSV
exports.exportSubscribers = async (req, res) => {
  try {
    const { format = "csv", activeOnly } = req.query;

    if (format !== "csv") {
      return res.status(400).json({
        success: false,
        message: "Only CSV format is supported at this time",
      });
    }

    // Build query
    const query = activeOnly === "true" ? { isActive: true } : {};

    // Get all subscribers
    const subscribers = await Newsletter.find(query).sort({
      subscriptionDate: -1,
    });

    if (subscribers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subscribers found to export",
      });
    }

    // Create CSV header and content
    const header = "Email,Status,Subscription Date\n";
    let csvContent = subscribers
      .map((subscriber) => {
        const email = subscriber.email;
        const status = subscriber.isActive ? "Active" : "Inactive";
        const date = new Date(subscriber.subscriptionDate)
          .toISOString()
          .split("T")[0];
        return `${email},${status},${date}`;
      })
      .join("\n");

    // Combine header and content
    csvContent = header + csvContent;

    // Set response headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=newsletter_subscribers.csv"
    );

    // Send CSV content
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting subscribers:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while exporting subscribers",
    });
  }
};
