// Real-time notification system for user dashboard
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.socket = null;
        this.pendingAudio = null;
        this.audioContextActivated = false;
        this.init();
    }

    init() {
        this.createNotificationContainer();
        this.bindEvents();
        this.loadStoredNotifications();
        this.connectWebSocket();
    }

    bindEvents() {
        // Activate audio context on first user interaction
        const activateAudio = () => {
            if (!this.audioContextActivated) {
                this.audioContextActivated = true;
                console.log('🎵 Audio context activated');
                
                // Play pending audio if any
                if (this.pendingAudio) {
                    this.pendingAudio.play()
                        .then(() => console.log('✅ Pending notification sound played'))
                        .catch(error => console.error('❌ Failed to play pending sound:', error));
                    this.pendingAudio = null;
                }
            }
        };

        // Listen for user interactions to activate audio
        ['click', 'touchstart', 'keydown'].forEach(event => {
            document.addEventListener(event, activateAudio, { once: true });
        });
    }

    createNotificationContainer() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    }

    connectWebSocket() {
        try {
            // Connect without authentication for now - using session-based auth
            this.socket = io();

            this.socket.on('connect', () => {
                console.log('Connected to notification server');
            });

            this.socket.on('new-notification', (notification) => {
                console.log('Received notification:', notification);
                this.addNotification(notification);
                this.showToastNotification(notification);
                this.updateNotificationBadge();
                this.playNotificationSound();
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from notification server');
            });

            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
            });

        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
        }
    }

    addNotification(notification) {
        // Add to notifications array
        this.notifications.unshift(notification);
        
        // Keep only last 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }
        
        // Store in localStorage
        this.storeNotifications();
    }

    showToastNotification(notification) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.style.cssText = `
            background: white;
            border: 1px solid #e5e7eb;
            border-left: 4px solid ${this.getNotificationColor(notification.type)};
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            pointer-events: auto;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            cursor: pointer;
            max-width: 380px;
            animation: slideInRight 0.3s ease forwards;
        `;

        toast.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${this.getNotificationColor(notification.type)}; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; flex-shrink: 0;">
                    <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px; font-size: 14px;">${notification.title}</div>
                    <div style="color: #6b7280; font-size: 13px; line-height: 1.4;">${notification.message}</div>
                    ${notification.actionUrl && notification.actionText ? 
                        `<a href="${notification.actionUrl}" style="display: inline-block; margin-top: 8px; color: ${this.getNotificationColor(notification.type)}; text-decoration: none; font-size: 12px; font-weight: 500;">${notification.actionText} →</a>` 
                        : ''
                    }
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 4px; font-size: 16px;">×</button>
            </div>
        `;

        // Add click handler for action
        if (notification.actionUrl) {
            toast.addEventListener('click', () => {
                window.open(notification.actionUrl, '_blank');
                toast.remove();
            });
        }

        container.appendChild(toast);

        // Auto remove after 8 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }
        }, 8000);
    }

    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        if (!badge) return;

        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    getNotificationColor(type) {
        const colors = {
            info: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            feature: '#8b5cf6',
            system: '#6b7280',
            shipment: '#059669',
            payment: '#dc2626',
            security: '#7c3aed'
        };
        return colors[type] || '#3b82f6';
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            feature: 'star',
            system: 'cog',
            shipment: 'box',
            payment: 'credit-card',
            security: 'shield-alt'
        };
        return icons[type] || 'bell';
    }

    storeNotifications() {
        try {
            localStorage.setItem('notifications', JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Failed to store notifications:', error);
        }
    }

    loadStoredNotifications() {
        try {
            const stored = localStorage.getItem('notifications');
            if (stored) {
                this.notifications = JSON.parse(stored);
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('Failed to load stored notifications:', error);
            this.notifications = [];
        }
    }

    async playNotificationSound() {
        try {
            // Check if sound is enabled
            const soundEnabled = this.getSoundSetting();
            if (!soundEnabled) {
                console.log('🔇 Notification sound disabled');
                return;
            }

            console.log('🔊 Playing notification sound...');
            
            // Try to use preloaded audio first
            let audio = window.preloadedNotificationAudio;
            
            if (audio && audio.readyState >= 2) {
                // Use preloaded audio
                console.log('🎵 Using preloaded audio');
                audio.currentTime = 0;
                audio.volume = 0.7;
                
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log('✅ Preloaded notification sound played successfully');
                        })
                        .catch(error => {
                            console.warn('⚠️ Preloaded audio failed, creating new:', error);
                            this.playFallbackSound();
                        });
                }
            } else {
                // Fallback to creating new audio
                console.log('🎵 Creating new audio instance');
                this.playFallbackSound();
            }
        } catch (error) {
            console.error('Failed to play notification sound:', error);
            this.playFallbackSound();
        }
    }

    playFallbackSound() {
        try {
            const audio = new Audio('/assets/sounds/chime.mp3');
            audio.volume = 0.7;
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('✅ Fallback notification sound played successfully');
                    })
                    .catch(error => {
                        console.warn('⚠️ Audio autoplay blocked:', error);
                        this.pendingAudio = audio;
                    });
            }
        } catch (error) {
            console.error('Fallback sound failed:', error);
        }
    }

    getSoundSetting() {
        try {
            // Check both localStorage and user preferences from server
            const localSetting = localStorage.getItem('notificationSound');
            console.log('🔊 [DEBUG] Local sound setting:', localSetting);
            
            // If user has explicitly disabled it, respect that
            if (localSetting === 'false') {
                console.log('🔇 [DEBUG] Sound disabled via localStorage');
                return false;
            }
            
            // Default to enabled
            console.log('🔊 [DEBUG] Sound enabled (default or explicit)');
            return true;
        } catch (error) {
            console.error('Failed to get sound setting:', error);
            return true; // Default to enabled
        }
    }

    async loadNotificationSound() {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src="/assets/sounds/notification.js"]')) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = '/assets/sounds/notification.js';
            script.onload = () => {
                console.log('Notification sound script loaded');
                if (typeof playNotificationSound === 'function') {
                    playNotificationSound().then(resolve).catch(reject);
                } else {
                    resolve();
                }
            };
            script.onerror = () => reject(new Error('Failed to load notification sound script'));
            document.head.appendChild(script);
        });
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
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
`;
document.head.appendChild(style);

// Initialize notification manager when DOM is loaded
let notificationManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        notificationManager = new NotificationManager();
    });
} else {
    notificationManager = new NotificationManager();
}

// Make it globally accessible
window.notificationManager = notificationManager;
