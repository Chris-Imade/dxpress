/**
 * In-app Notification System
 * Handles real-time notifications for user dashboard
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.isInitialized = false;
        this.refreshInterval = null;
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        this.createNotificationWidget();
        await this.loadNotifications();
        this.startAutoRefresh();
        this.isInitialized = true;
    }

    createNotificationWidget() {
        // Create notification bell widget
        const widget = document.createElement('div');
        widget.id = 'notification-widget';
        widget.innerHTML = `
            <div class="notification-bell" onclick="notificationManager.toggleDropdown()">
                <i class="fas fa-bell"></i>
                <span class="notification-badge" id="notification-badge" style="display: none;">0</span>
            </div>
            <div class="notification-dropdown" id="notification-dropdown" style="display: none;">
                <div class="notification-header">
                    <h4>Notifications</h4>
                    <button class="mark-all-read" onclick="notificationManager.markAllAsRead()">
                        Mark all read
                    </button>
                </div>
                <div class="notification-list" id="notification-list">
                    <div class="loading">Loading...</div>
                </div>
                <div class="notification-footer">
                    <a href="/dashboard/notifications">View all notifications</a>
                </div>
            </div>
        `;

        // Add styles
        const styles = `
            <style>
                #notification-widget {
                    position: relative;
                    display: inline-block;
                }

                .notification-bell {
                    position: relative;
                    padding: 0.5rem;
                    cursor: pointer;
                    color: #64748b;
                    transition: color 0.2s;
                }

                .notification-bell:hover {
                    color: #3b82f6;
                }

                .notification-badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: #ef4444;
                    color: white;
                    font-size: 0.7rem;
                    padding: 0.1rem 0.3rem;
                    border-radius: 10px;
                    min-width: 16px;
                    text-align: center;
                    font-weight: 600;
                }

                .notification-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    width: 350px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    max-height: 400px;
                    overflow: hidden;
                }

                .notification-header {
                    padding: 1rem;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .notification-header h4 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #032330;
                }

                .mark-all-read {
                    background: none;
                    border: none;
                    color: #3b82f6;
                    font-size: 0.8rem;
                    cursor: pointer;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }

                .mark-all-read:hover {
                    background: #f3f4f6;
                }

                .notification-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .notification-item {
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid #f3f4f6;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                }

                .notification-item:hover {
                    background: #f9fafb;
                }

                .notification-item.unread {
                    background: #eff6ff;
                    border-left: 3px solid #3b82f6;
                }

                .notification-item:last-child {
                    border-bottom: none;
                }

                .notification-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    flex-shrink: 0;
                    margin-top: 0.1rem;
                }

                .notification-icon.info { background: #dbeafe; color: #3b82f6; }
                .notification-icon.success { background: #d1fae5; color: #10b981; }
                .notification-icon.warning { background: #fef3c7; color: #f59e0b; }
                .notification-icon.error { background: #fee2e2; color: #ef4444; }
                .notification-icon.shipment { background: #e0e7ff; color: #6366f1; }
                .notification-icon.payment { background: #ecfdf5; color: #059669; }

                .notification-content {
                    flex: 1;
                    min-width: 0;
                }

                .notification-title {
                    font-weight: 500;
                    color: #032330;
                    font-size: 0.85rem;
                    margin-bottom: 0.25rem;
                    line-height: 1.3;
                }

                .notification-message {
                    color: #64748b;
                    font-size: 0.8rem;
                    line-height: 1.3;
                    margin-bottom: 0.25rem;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .notification-time {
                    color: #9ca3af;
                    font-size: 0.7rem;
                }

                .notification-footer {
                    padding: 0.75rem 1rem;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                }

                .notification-footer a {
                    color: #3b82f6;
                    text-decoration: none;
                    font-size: 0.85rem;
                    font-weight: 500;
                }

                .notification-footer a:hover {
                    text-decoration: underline;
                }

                .loading {
                    text-align: center;
                    padding: 2rem;
                    color: #64748b;
                    font-size: 0.9rem;
                }

                .empty-notifications {
                    text-align: center;
                    padding: 2rem;
                    color: #64748b;
                    font-size: 0.9rem;
                }
            </style>
        `;

        // Add to page
        document.head.insertAdjacentHTML('beforeend', styles);
        
        // Find a suitable container (navbar, header, etc.)
        const container = document.querySelector('.navbar-nav') || 
                         document.querySelector('.header-actions') || 
                         document.querySelector('nav') || 
                         document.body;
        
        container.appendChild(widget);

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!widget.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications?limit=5');
            const data = await response.json();

            if (data.success) {
                this.notifications = data.notifications;
                this.unreadCount = data.unreadCount;
                this.updateWidget();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    updateWidget() {
        // Update badge
        const badge = document.getElementById('notification-badge');
        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }

        // Update list
        const list = document.getElementById('notification-list');
        if (this.notifications.length === 0) {
            list.innerHTML = '<div class="empty-notifications">No notifications</div>';
            return;
        }

        list.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${!notification.isRead ? 'unread' : ''}" 
                 onclick="notificationManager.handleNotificationClick('${notification._id}', '${notification.actionUrl || ''}')">
                <div class="notification-icon ${notification.type}">
                    <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.createdAt)}</div>
                </div>
            </div>
        `).join('');
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            shipment: 'box',
            payment: 'credit-card',
            system: 'cog'
        };
        return icons[type] || 'bell';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }

    toggleDropdown() {
        const dropdown = document.getElementById('notification-dropdown');
        const isVisible = dropdown.style.display !== 'none';
        
        if (isVisible) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        const dropdown = document.getElementById('notification-dropdown');
        dropdown.style.display = 'block';
        this.loadNotifications(); // Refresh when opened
    }

    closeDropdown() {
        const dropdown = document.getElementById('notification-dropdown');
        dropdown.style.display = 'none';
    }

    async handleNotificationClick(notificationId, actionUrl) {
        // Mark as read
        if (notificationId) {
            await this.markAsRead([notificationId]);
        }

        // Navigate to action URL
        if (actionUrl) {
            window.location.href = actionUrl;
        }

        this.closeDropdown();
    }

    async markAsRead(notificationIds) {
        try {
            const response = await fetch('/api/notifications/mark-read', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notificationIds })
            });

            if (response.ok) {
                await this.loadNotifications();
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    }

    async markAllAsRead() {
        const unreadIds = this.notifications
            .filter(n => !n.isRead)
            .map(n => n._id);

        if (unreadIds.length > 0) {
            await this.markAsRead(unreadIds);
        }
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadNotifications();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Show toast notification
    showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add toast styles if not already added
        if (!document.querySelector('#toast-styles')) {
            const toastStyles = `
                <style id="toast-styles">
                    .notification-toast {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: white;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                        padding: 1rem;
                        display: flex;
                        align-items: flex-start;
                        gap: 0.75rem;
                        max-width: 400px;
                        z-index: 10000;
                        animation: slideInRight 0.3s ease;
                    }

                    .notification-toast.success { border-left: 4px solid #10b981; }
                    .notification-toast.error { border-left: 4px solid #ef4444; }
                    .notification-toast.warning { border-left: 4px solid #f59e0b; }
                    .notification-toast.info { border-left: 4px solid #3b82f6; }

                    .toast-icon {
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.9rem;
                        flex-shrink: 0;
                    }

                    .notification-toast.success .toast-icon { background: #d1fae5; color: #10b981; }
                    .notification-toast.error .toast-icon { background: #fee2e2; color: #ef4444; }
                    .notification-toast.warning .toast-icon { background: #fef3c7; color: #f59e0b; }
                    .notification-toast.info .toast-icon { background: #dbeafe; color: #3b82f6; }

                    .toast-content {
                        flex: 1;
                    }

                    .toast-title {
                        font-weight: 600;
                        color: #032330;
                        font-size: 0.9rem;
                        margin-bottom: 0.25rem;
                    }

                    .toast-message {
                        color: #64748b;
                        font-size: 0.85rem;
                        line-height: 1.4;
                    }

                    .toast-close {
                        background: none;
                        border: none;
                        color: #9ca3af;
                        cursor: pointer;
                        padding: 0.25rem;
                        border-radius: 4px;
                        transition: background-color 0.2s;
                    }

                    .toast-close:hover {
                        background: #f3f4f6;
                        color: #64748b;
                    }

                    @keyframes slideInRight {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', toastStyles);
        }

        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
}

// Initialize notification manager when DOM is ready
let notificationManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        notificationManager = new NotificationManager();
    });
} else {
    notificationManager = new NotificationManager();
}

// Export for global access
window.notificationManager = notificationManager;
