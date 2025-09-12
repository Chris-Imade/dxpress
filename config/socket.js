const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    // For now, allow connections without strict JWT validation
    // In production, you should implement proper JWT validation
    console.log('User connected to socket');
    
    // Set a default user ID from session or other auth method
    if (socket.request.session && socket.request.session.user) {
      socket.userId = socket.request.session.user._id;
      socket.userRole = socket.request.session.user.role;
    } else {
      // Fallback - allow connection but mark as guest
      socket.userId = 'guest_' + Date.now();
      socket.userRole = 'user';
    }
    
    console.log(`User ${socket.userId} connected with role: ${socket.userRole}`);
    
    // Join user to their personal room
    socket.join(`user_${socket.userId}`);
    
    // Join admin users to admin room
    if (socket.userRole === 'admin') {
      socket.join('admin_room');
    }

    next();
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Handle admin broadcasting notifications
    socket.on('admin-broadcast', (notificationData) => {
      if (socket.userRole === 'admin') {
        // Broadcast to all connected users
        socket.broadcast.emit('new-notification', {
          id: Date.now(),
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          priority: notificationData.priority,
          actionUrl: notificationData.actionUrl,
          actionText: notificationData.actionText,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Broadcast notification to all users
const broadcastNotification = (notification) => {
  if (io) {
    io.emit('new-notification', {
      id: Date.now(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      timestamp: new Date().toISOString(),
      read: false
    });
  }
};

// Send notification to specific user
const sendNotificationToUser = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit('new-notification', {
      id: Date.now(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      timestamp: new Date().toISOString(),
      read: false
    });
  }
};

module.exports = {
  initializeSocket,
  getIO,
  broadcastNotification,
  sendNotificationToUser
};
