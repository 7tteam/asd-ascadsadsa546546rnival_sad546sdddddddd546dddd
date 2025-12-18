// AdSense Manager - Smart Ad Placement & Refresh
class AdSenseManager {
    constructor() {
        this.adSlots = [];
        this.refreshInterval = 45000; // 45 seconds (safe for AdSense)
        this.minViewTime = 5000; // Minimum 5 seconds view before refresh
        this.isAdSenseLoaded = false;
        this.init();
    }

    init() {
        // Load AdSense script
        this.loadAdSenseScript();
        
        // Setup intersection observer for viewability
        this.setupViewabilityTracking();
    }

    loadAdSenseScript() {
        if (document.querySelector('script[src*="adsbygoogle"]')) {
            this.isAdSenseLoaded = true;
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9474857494274232';
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            this.isAdSenseLoaded = true;
        };
        document.head.appendChild(script);
    }

    createAdUnit(position = 'inline') {
        const adContainer = document.createElement('div');
        adContainer.className = `ad-container ad-${position}`;
        adContainer.style.cssText = 'margin: 20px 0; text-align: center; min-height: 100px;';
        
        const adLabel = document.createElement('div');
        adLabel.className = 'ad-label';
        adLabel.textContent = 'إعلان';
        adLabel.style.cssText = 'font-size: 10px; color: #999; margin-bottom: 5px;';
        
        const adSlot = document.createElement('ins');
        adSlot.className = 'adsbygoogle';
        adSlot.style.display = 'block';
        adSlot.setAttribute('data-ad-client', 'ca-pub-9474857494274232');
        adSlot.setAttribute('data-ad-slot', '3589570184');
        adSlot.setAttribute('data-ad-format', 'auto');
        adSlot.setAttribute('data-full-width-responsive', 'true');
        
        adContainer.appendChild(adLabel);
        adContainer.appendChild(adSlot);
        
        return { container: adContainer, slot: adSlot };
    }

    insertAdInDirectory() {
        const directoryCards = document.getElementById('directoryCards');
        if (!directoryCards) return;

        // Wait for cards to load
        const observer = new MutationObserver(() => {
            const cards = directoryCards.children;
            if (cards.length >= 3) {
                // Insert ad after every 6 cards
                for (let i = 6; i < cards.length; i += 7) {
                    if (!cards[i].classList.contains('ad-container')) {
                        const { container, slot } = this.createAdUnit('directory');
                        cards[i].parentNode.insertBefore(container, cards[i]);
                        this.pushAd(slot, container);
                    }
                }
                observer.disconnect();
            }
        });

        observer.observe(directoryCards, { childList: true });
    }

    insertAdInNews() {
        const newsFeed = document.getElementById('newsFeed');
        if (!newsFeed) return;

        const observer = new MutationObserver(() => {
            const posts = newsFeed.children;
            if (posts.length >= 2) {
                // Insert ad after every 3 posts
                for (let i = 3; i < posts.length; i += 4) {
                    if (!posts[i].classList.contains('ad-container')) {
                        const { container, slot } = this.createAdUnit('news');
                        posts[i].parentNode.insertBefore(container, posts[i]);
                        this.pushAd(slot, container);
                    }
                }
                observer.disconnect();
            }
        });

        observer.observe(newsFeed, { childList: true });
    }

    insertAdInEvents() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;

        const observer = new MutationObserver(() => {
            const events = eventsList.children;
            if (events.length >= 2) {
                // Insert ad after every 3 events
                for (let i = 3; i < events.length; i += 4) {
                    if (!events[i].classList.contains('ad-container')) {
                        const { container, slot } = this.createAdUnit('events');
                        events[i].parentNode.insertBefore(container, events[i]);
                        this.pushAd(slot, container);
                    }
                }
                observer.disconnect();
            }
        });

        observer.observe(eventsList, { childList: true });
    }

    pushAd(slot, container) {
        if (!this.isAdSenseLoaded) {
            setTimeout(() => this.pushAd(slot, container), 500);
            return;
        }

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            this.adSlots.push({ slot, container, viewTime: 0, lastRefresh: Date.now() });
        } catch (e) {
            console.log('Ad push failed:', e);
        }
    }

    setupViewabilityTracking() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const adData = this.adSlots.find(ad => ad.container === entry.target);
                if (!adData) return;

                if (entry.isIntersecting) {
                    adData.viewStartTime = Date.now();
                } else if (adData.viewStartTime) {
                    adData.viewTime += Date.now() - adData.viewStartTime;
                    adData.viewStartTime = null;
                }
            });
        }, { threshold: 0.5 });

        // Observe all ad containers
        setInterval(() => {
            this.adSlots.forEach(ad => {
                if (ad.container.parentNode) {
                    observer.observe(ad.container);
                }
            });
        }, 1000);
    }

    // Smart refresh - only refresh ads that have been viewed
    startSmartRefresh() {
        setInterval(() => {
            this.adSlots.forEach(ad => {
                const timeSinceRefresh = Date.now() - ad.lastRefresh;
                
                // Only refresh if:
                // 1. Ad has been viewed for minimum time
                // 2. Enough time has passed since last refresh
                // 3. Ad is currently in viewport
                if (ad.viewTime >= this.minViewTime && 
                    timeSinceRefresh >= this.refreshInterval &&
                    this.isInViewport(ad.container)) {
                    
                    this.refreshAd(ad);
                }
            });
        }, 10000); // Check every 10 seconds
    }

    refreshAd(adData) {
        // Create new ad slot
        const newSlot = document.createElement('ins');
        newSlot.className = 'adsbygoogle';
        newSlot.style.display = 'block';
        newSlot.setAttribute('data-ad-client', 'ca-pub-9474857494274232');
        newSlot.setAttribute('data-ad-slot', '3589570184');
        newSlot.setAttribute('data-ad-format', 'auto');
        newSlot.setAttribute('data-full-width-responsive', 'true');

        // Replace old slot
        adData.slot.parentNode.replaceChild(newSlot, adData.slot);
        adData.slot = newSlot;
        adData.lastRefresh = Date.now();
        adData.viewTime = 0;

        // Push new ad
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.log('Ad refresh failed:', e);
        }
    }

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Initialize ads for current section
    initAdsForSection(section) {
        setTimeout(() => {
            switch(section) {
                case 'directory':
                    this.insertAdInDirectory();
                    break;
                case 'news':
                    this.insertAdInNews();
                    break;
                case 'events':
                    this.insertAdInEvents();
                    break;
            }
        }, 1000);
    }
}

// Initialize AdSense Manager
const adsenseManager = new AdSenseManager();

// Start smart refresh (disabled by default - enable if needed)
// adsenseManager.startSmartRefresh();
