// Push Notifications System
class PushNotificationManager {
    constructor() {
        this.vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqI';
        this.init();
    }

    async init() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered:', registration);
                
                // Request notification permission on first visit
                await this.requestPermission();
                
                // Subscribe to push notifications
                await this.subscribeUser(registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    async requestPermission() {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('Notification permission granted');
            this.showWelcomeNotification();
        } else if (permission === 'denied') {
            console.log('Notification permission denied');
        } else {
            console.log('Notification permission default');
        }
        
        return permission;
    }

    showWelcomeNotification() {
        if (Notification.permission === 'granted') {
            new Notification('مرحباً بك في دليل ابيار! 🎉', {
                body: 'ستصلك إشعارات بآخر الأخبار والأحداث',
                icon: '/assets/images/icon-192.png',
                badge: '/assets/images/icon-72.png',
                tag: 'welcome',
                requireInteraction: false,
                silent: false
            });
        }
    }

    async subscribeUser(registration) {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });

            console.log('User subscribed:', subscription);
            
            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);
            
        } catch (error) {
            console.error('Failed to subscribe user:', error);
        }
    }

    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/backend/subscribe.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: subscription,
                    user_id: localStorage.getItem('ebyar_user_id')
                })
            });

            const result = await response.json();
            console.log('Subscription sent to server:', result);
        } catch (error) {
            console.error('Failed to send subscription to server:', error);
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Test notification
    async sendTestNotification() {
        if (Notification.permission === 'granted') {
            new Notification('إشعار تجريبي من دليل ابيار', {
                body: 'هذا إشعار تجريبي للتأكد من عمل النظام',
                icon: '/assets/images/icon-192.png',
                badge: '/assets/images/icon-72.png',
                tag: 'test',
                actions: [
                    {
                        action: 'view',
                        title: 'عرض',
                        icon: '/assets/images/view-icon.png'
                    },
                    {
                        action: 'close',
                        title: 'إغلاق',
                        icon: '/assets/images/close-icon.png'
                    }
                ]
            });
        }
    }
}

// Initialize push notifications
const pushManager = new PushNotificationManager();

// Make it globally available
window.pushManager = pushManager;