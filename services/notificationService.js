const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Notification Service
 * Handles all notification operations and broadcasting
 */

class NotificationService {
  /**
   * Create notification for specific user
   */
  static async createUserNotification(userId, data) {
    try {
      return await Notification.createNotification({
        userId,
        ...data
      });
    } catch (error) {
      console.error('Error creating user notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for all users (admin broadcast)
   */
  static async broadcastToAllUsers(data) {
    try {
      const users = await User.find({ role: 'user', active: true });
      const notifications = [];

      for (const user of users) {
        const notification = await Notification.createNotification({
          userId: user._id,
          ...data
        });
        notifications.push(notification);
      }

      return {
        success: true,
        count: notifications.length,
        notifications
      };
    } catch (error) {
      console.error('Error broadcasting notifications:', error);
      throw error;
    }
  }

  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        type,
        isRead,
        priority
      } = options;

      const query = { 
        userId, 
        isArchived: false 
      };

      if (category) query.category = category;
      if (type) query.type = type;
      if (typeof isRead === 'boolean') query.isRead = isRead;
      if (priority) query.priority = priority;

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.getUnreadCount(userId);

      return {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(userId, notificationIds) {
    try {
      const result = await Notification.markAsRead(userId, notificationIds);
      return {
        success: true,
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Archive notifications
   */
  static async archiveNotifications(userId, notificationIds) {
    try {
      const result = await Notification.updateMany(
        { 
          userId, 
          _id: { $in: notificationIds } 
        },
        { 
          isArchived: true 
        }
      );

      return {
        success: true,
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      console.error('Error archiving notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for admin
   */
  static async getNotificationStats() {
    try {
      const totalNotifications = await Notification.countDocuments({});
      const unreadNotifications = await Notification.countDocuments({ isRead: false });
      const notificationsByType = await Notification.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);

      const notificationsByCategory = await Notification.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      const recentNotifications = await Notification.find({})
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      return {
        totalNotifications,
        unreadNotifications,
        notificationsByType,
        notificationsByCategory,
        recentNotifications
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Create shipment-related notifications
   */
  static async createShipmentNotification(userId, shipment, type, customMessage = null) {
    try {
      const notificationMap = {
        'created': {
          title: 'Shipment Created',
          message: customMessage || `Your shipment ${shipment.trackingId} has been created successfully.`,
          type: 'success',
          category: 'shipment_update'
        },
        'processing': {
          title: 'Shipment Processing',
          message: customMessage || `Your shipment ${shipment.trackingId} is now being processed.`,
          type: 'info',
          category: 'shipment_update'
        },
        'in_transit': {
          title: 'Shipment In Transit',
          message: customMessage || `Your shipment ${shipment.trackingId} is now in transit.`,
          type: 'info',
          category: 'shipment_update'
        },
        'delivered': {
          title: 'Shipment Delivered',
          message: customMessage || `Your shipment ${shipment.trackingId} has been delivered successfully.`,
          type: 'success',
          category: 'shipment_update'
        },
        'delayed': {
          title: 'Shipment Delayed',
          message: customMessage || `Your shipment ${shipment.trackingId} has been delayed. We apologize for the inconvenience.`,
          type: 'warning',
          category: 'shipment_update',
          priority: 'high'
        },
        'exception': {
          title: 'Shipment Exception',
          message: customMessage || `There's an issue with your shipment ${shipment.trackingId}. Please contact support.`,
          type: 'error',
          category: 'shipment_update',
          priority: 'urgent'
        }
      };

      const notificationData = notificationMap[type];
      if (!notificationData) {
        throw new Error(`Unknown shipment notification type: ${type}`);
      }

      return await this.createUserNotification(userId, {
        ...notificationData,
        relatedId: shipment._id,
        relatedModel: 'Shipment',
        actionUrl: `/dashboard/tracking?id=${shipment.trackingId}`,
        actionText: 'Track Shipment'
      });
    } catch (error) {
      console.error('Error creating shipment notification:', error);
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      console.log(`Cleaned up ${result.deletedCount} expired notifications`);
      return result;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
