const Notification = require('../models/Notification');
const User = require('../models/User');

// Get user notifications page
exports.getUserNotificationsPage = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false, 
      isArchived: false 
    });

    res.render("dashboard/notifications", {
      title: "Notifications",
      layout: "layouts/dashboard",
      user: req.user,
      path: "/dashboard/notifications",
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications page error:', error);
    res.status(500).render('dashboard/notifications', {
      title: "Notifications",
      layout: "layouts/dashboard",
      user: req.user,
      path: "/dashboard/notifications",
      notifications: [],
      unreadCount: 0,
      error: 'Failed to load notifications'
    });
  }
};

// Get user notifications API
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, category, type, isRead, archived } = req.query;

    const filter = { userId };
    
    // Handle archived filter
    if (archived === 'true') {
      filter.isArchived = true;
    } else {
      filter.isArchived = false;
    }
    
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark notifications as read
exports.markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'Notification IDs array is required'
      });
    }

    const result = await Notification.updateMany(
      { 
        userId: userId, 
        _id: { $in: notificationIds } 
      },
      { 
        isRead: true 
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
};

// Archive notifications
exports.archiveNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'Notification IDs array is required'
      });
    }

    const result = await Notification.updateMany(
      { 
        userId: userId, 
        _id: { $in: notificationIds } 
      },
      { 
        isArchived: true 
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications archived`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Archive notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive notifications'
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

// Admin: Broadcast notification to all users
exports.broadcastNotification = async (req, res) => {
  try {
    const { title, message, type, category, priority, actionUrl, actionText, expiresAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const result = await NotificationService.broadcastToAllUsers({
      title,
      message,
      type: type || 'info',
      category: category || 'system_announcement',
      priority: priority || 'medium',
      actionUrl,
      actionText,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    res.json({
      success: true,
      message: `Notification sent to ${result.count} users`,
      count: result.count
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast notification'
    });
  }
};

// Admin: Get notification statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const stats = await NotificationService.getNotificationStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics'
    });
  }
};
