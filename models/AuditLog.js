const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "CREATE_SHIPMENT",
        "UPDATE_SHIPMENT",
        "DELETE_SHIPMENT",
        "UPDATE_RATES",
        "CREATE_USER",
        "UPDATE_USER",
        "DELETE_USER",
        "SUSPEND_USER",
        "LOGIN",
        "LOGOUT",
        "PAYMENT_PROCESSED",
        "REFUND_ISSUED",
        "SETTINGS_CHANGED",
        "API_CALL",
        "UPDATE_SHIPPING_SETTINGS",
        "OTHER",
      ],
    },
    resource: {
      type: String,
      required: true, // e.g., "shipment", "user", "rate", "payment"
    },
    resourceId: {
      type: String, // ID of the affected resource
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Store any additional details
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
