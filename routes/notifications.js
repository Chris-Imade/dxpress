const express = require('express');
const router = express.Router();
const { isAuthenticated, isUser, isAdmin } = require('../middleware/auth');
const notificationsController = require('../controllers/notifications');

// User notification routes
router.get('/api/notifications', isAuthenticated, isUser, notificationsController.getUserNotifications);
router.get('/api/notifications/unread-count', isAuthenticated, isUser, notificationsController.getUnreadCount);
router.patch('/api/notifications/mark-read', isAuthenticated, isUser, notificationsController.markNotificationsAsRead);
router.patch('/api/notifications/archive', isAuthenticated, isUser, notificationsController.archiveNotifications);

// Admin notification routes
router.post('/api/admin/notifications/broadcast', isAuthenticated, isAdmin, notificationsController.broadcastNotification);
router.get('/api/admin/notifications/stats', isAuthenticated, isAdmin, notificationsController.getNotificationStats);

module.exports = router;
