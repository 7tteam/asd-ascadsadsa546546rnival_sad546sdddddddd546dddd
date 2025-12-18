// API Configuration
const API_CONFIG = {
    // Backend API URL - Change this to your backend server
    baseURL: 'https://user.7tteam.com/ebyar',  // أو ضع رابط السيرفر بتاع الـ backend
    
    // API Endpoints
    endpoints: {
        session: '/backend/session.php',
        directory: '/backend/directory.php',
        news: '/backend/news.php',
        events: '/backend/events.php',
        search: '/backend/search.php',
        like: '/backend/like.php',
        rsvp: '/backend/rsvp.php',
        subscribe: '/backend/subscribe.php',
        autoGuest: '/backend/auto_guest.php'
    },
    
    // Get full URL for endpoint
    getURL: function(endpoint) {
        return this.baseURL + (this.endpoints[endpoint] || endpoint);
    }
};

// Export for use in other files
window.API_CONFIG = API_CONFIG;
