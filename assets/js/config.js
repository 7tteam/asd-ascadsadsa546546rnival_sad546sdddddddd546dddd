// API Configuration
const API_CONFIG = {
    BASE_URL: 'https://user.7tteam.com/ebyar/backend',
    DATA_URL: 'https://user.7tteam.com/ebyar/data',
    
    endpoints: {
        directory: '/directory.php',
        news: '/news.php',
        events: '/events.php',
        search: '/search.php',
        like: '/like.php',
        rsvp: '/rsvp.php',
        subscribe: '/subscribe.php',
        session: '/session.php'
    },
    
    getURL(endpoint) {
        return this.BASE_URL + (this.endpoints[endpoint] || '');
    },
    
    getDataURL(path) {
        return this.DATA_URL + (path.startsWith('/') ? path : '/' + path);
    },
    
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }
};
