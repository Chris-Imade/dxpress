const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error", "shipment", "payment", "system"],
      default: "info",
    },
    category: {
      type: String,
      enum: ["shipment_update", "payment_status", "system_announcement", "promotion", "security", "general"],
      default: "general",
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      // Can reference Shipment, Payment, or other entities
    },
    relatedModel: {
      type: String,
      enum: ["Shipment", "Payment", "User"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    actionUrl: {
      type: String, // URL to redirect when notification is clicked
    },
    actionText: {
      type: String, // Text for action button
    },
    expiresAt: {
      type: Date, // For temporary notifications
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Additional data
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, category: 1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  return await this.create({
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type || "info",
    category: data.category || "general",
    relatedId: data.relatedId,
    relatedModel: data.relatedModel,
    priority: data.priority || "medium",
    actionUrl: data.actionUrl,
    actionText: data.actionText,
    expiresAt: data.expiresAt,
    metadata: data.metadata,
  });
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(userId, notificationIds) {
  return await this.updateMany(
    { 
      userId: userId, 
      _id: { $in: notificationIds } 
    },
    { 
      isRead: true 
    }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ 
    userId: userId, 
    isRead: false, 
    isArchived: false 
  });
};

module.exports = mongoose.model("Notification", notificationSchema);
