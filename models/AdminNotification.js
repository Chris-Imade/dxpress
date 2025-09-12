const mongoose = require("mongoose");

const adminNotificationSchema = new mongoose.Schema(
  {
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
      enum: ["info", "success", "warning", "error", "feature", "system", "shipment", "payment", "security"],
      default: "info",
    },
    actionUrl: {
      type: String,
    },
    actionText: {
      type: String,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sentToCount: {
      type: Number,
      default: 0,
    },
    deliveredCount: {
      type: Number,
      default: 0,
    },
    readCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
adminNotificationSchema.index({ sentBy: 1, createdAt: -1 });
adminNotificationSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model("AdminNotification", adminNotificationSchema);
