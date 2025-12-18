// دليل ابيار - Main Application JavaScript
class EbyarApp {
    constructor() {
        this.currentSection = 'home';
        this.currentUser = null;
        this.guestUser = null;
        this.currentCategory = null;
        this.currentSlide = 1;
        this.init();
    }

    async init() {
        this.showLoadingScreen();
        
        this.guestUser = await this.getOrCreateGuestUser();
        const savedUser = this.loadUserSession();
        if (savedUser) this.currentUser = savedUser;
        
        const isFirstVisit = await this.checkFirstVisit();
        
        setTimeout(() => {
            this.hideLoadingScreen();
            isFirstVisit ? this.showOnboarding() : this.showMainApp();
        }, 2500);
        
        this.setupEventListeners();
        this.setupPWA();
        this.requestNotificationPermission();
    }

    async getOrCreateGuestUser() {
        try {
            let guest = localStorage.getItem('ebyar_guest');
            if (guest) {
                guest = JSON.parse(guest);
                guest.visits = (guest.visits || 0) + 1;
            } else {
                guest = {
                    id: 'guest_' + Date.now(),
                    created: new Date().toISOString(),
                    visits: 1
                };
            }
            localStorage.setItem('ebyar_guest', JSON.stringify(guest));
            return guest;
        } catch (e) {
            return { id: 'guest_fallback', visits: 1 };
        }
    }

    async checkFirstVisit() {
        return !localStorage.getItem('ebyar_visited') && !this.getCookie('ebyar_visited');
    }

    showLoadingScreen() {
        document.getElementById('loadingScreen').style.display = 'flex';
    }

    hideLoadingScreen() {
        document.getElementById('loadingScreen').style.display = 'none';
    }

    showOnboarding() {
        document.getElementById('onboardingOverlay').style.display = 'flex';
        this.currentSlide = 1;
        this.setupOnboardingListeners();
    }

    setupOnboardingListeners() {
        setTimeout(() => {
            const nextBtn = document.getElementById('nextSlide');
            const skipBtn = document.getElementById('skipOnboarding');
            const dots = document.querySelectorAll('.dot');

            if (nextBtn) {
                nextBtn.onclick = (e) => {
                    e.preventDefault();
                    if (this.currentSlide < 3) {
                        this.currentSlide++;
                        this.updateOnboardingSlide();
                    } else {
                        this.finishOnboarding();
                    }
                };
            }

            if (skipBtn) {
                skipBtn.onclick = (e) => {
                    e.preventDefault();
                    this.finishOnboarding();
                };
            }

            dots.forEach(dot => {
                dot.onclick = (e) => {
                    e.preventDefault();
                    this.currentSlide = parseInt(e.target.dataset.slide);
                    this.updateOnboardingSlide();
                };
            });
        }, 100);
    }

    updateOnboardingSlide() {
        document.querySelectorAll('.onboarding-slide').forEach(slide => {
            slide.classList.remove('active');
        });
        
        const currentSlideElement = document.querySelector(`.onboarding-slide[data-slide="${this.currentSlide}"]`);
        if (currentSlideElement) currentSlideElement.classList.add('active');
        
        document.querySelectorAll('.dot').forEach(dot => {
            dot.classList.remove('active');
        });
        const currentDot = document.querySelector(`.dot[data-slide="${this.currentSlide}"]`);
        if (currentDot) currentDot.classList.add('active');
        
        const nextBtn = document.getElementById('nextSlide');
        if (nextBtn) {
            nextBtn.textContent = this.currentSlide === 3 ? 'ابدأ الآن' : 'التالي';
        }
    }

    finishOnboarding() {
        document.getElementById('onboardingOverlay').style.display = 'none';
        document.getElementById('authModal').classList.remove('d-none');
        
        try {
            localStorage.setItem('ebyar_visited', 'true');
        } catch (e) {
            console.log('Could not save to localStorage');
        }
        this.setCookie('ebyar_visited', 'true', 3650);
    }

    showMainApp() {
        document.getElementById('mainContent').classList.remove('d-none');
        document.getElementById('mainNavbar').classList.remove('d-none');
        document.getElementById('bottomNav').classList.remove('d-none');
        this.loadInitialData();
    }

    setupEventListeners() {
        document.getElementById('registerUser')?.addEventListener('click', () => this.handleRegister());
        document.getElementById('loginUser')?.addEventListener('click', () => this.handleLogin());
        document.getElementById('continueGuest')?.addEventListener('click', () => this.continueAsGuest());

        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]')?.dataset.section;
                if (section) this.switchSection(section);
            });
        });
        
        document.getElementById('notificationBtn')?.addEventListener('click', () => {
            this.showNotificationBox();
        });
        
        document.getElementById('editProfileBtn')?.addEventListener('click', () => {
            this.editProfile();
        });
        
        document.getElementById('requestAddBtn')?.addEventListener('click', () => {
            this.requestAddNumber();
        });
        
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitLogin();
        });
        
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitRegister();
        });

        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 1) {
                this.performGlobalSearch(query);
            } else {
                this.hideSearchResults();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSearchResults();
            }
        });
    }

    handleRegister() {
        document.getElementById('authModal').classList.add('d-none');
        const modal = new bootstrap.Modal(document.getElementById('registerModal'));
        modal.show();
    }

    handleLogin() {
        document.getElementById('authModal').classList.add('d-none');
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    }

    continueAsGuest() {
        document.getElementById('authModal').classList.add('d-none');
        this.showMainApp();
    }

    switchSection(section) {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
        const navItem = document.querySelector(`[data-section="${section}"]`);
        if (navItem) navItem.classList.add('active');

        document.querySelectorAll('.section-content').forEach(sec => sec.classList.add('d-none'));
        
        if (section === 'home') {
            const heroSection = document.querySelector('.hero-section');
            const containerSection = document.querySelector('.container.mt-4');
            if (heroSection) heroSection.style.display = 'block';
            if (containerSection) containerSection.style.display = 'block';
        } else {
            const heroSection = document.querySelector('.hero-section');
            const containerSection = document.querySelector('.container.mt-4');
            if (heroSection) heroSection.style.display = 'none';
            if (containerSection) containerSection.style.display = 'none';
            
            const targetSection = document.getElementById(`${section}Section`);
            if (targetSection) targetSection.classList.remove('d-none');
        }
        
        this.currentSection = section;
        this.loadSectionData(section);
        
        if (section === 'profile') this.loadProfileData();
    }

    async loadSectionData(section) {
        this.showLoading();
        
        try {
            switch(section) {
                case 'directory':
                    await this.loadDirectory();
                    break;
                case 'news':
                    await this.loadNews();
                    break;
                case 'events':
                    await this.loadEvents();
                    break;
            }
        } catch (error) {
            this.showNotification('حدث خطأ في تحميل البيانات', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadDirectory() {
        try {
            const response = await fetch(API_CONFIG.getURL('directory'));
            if (!response.ok) throw new Error('Backend not available');
            const data = await response.json();
        
            this.renderMainCategories(data.categories);
        } catch (e) {
            console.log('Backend not available');
            this.showDemoMessage();
        }
    }
    
    showDemoMessage() {
        const container = document.getElementById('mainCategories');
        if (container) {
            container.innerHTML = '<div class="alert alert-info">يتم تحميل البيانات...</div>';
        }
    }

    renderMainCategories(categories) {
        const container = document.getElementById('mainCategories');
        if (!container) return;
        
        container.innerHTML = '';
        
        categories.forEach(category => {
            const col = document.createElement('div');
            col.className = 'col-md-4 col-6';
            
            col.innerHTML = `
                <div class="main-category" data-category="${category.id}">
                    <i class="${category.icon}"></i>
                    <h5>${category.name}</h5>
                </div>
            `;
            
            col.querySelector('.main-category').addEventListener('click', () => {
                this.loadSubCategories(category);
            });
            
            container.appendChild(col);
        });
    }

    async loadSubCategories(category) {
        this.currentCategory = category;
        
        const container = document.getElementById('mainCategories');
        if (!container) return;
        
        container.innerHTML = `
            <div class="col-12 mb-3">
                <button class="btn btn-outline-primary" onclick="app.loadDirectory()">
                    <i class="fas fa-arrow-right"></i> رجوع
                </button>
            </div>
        `;
        
        try {
            const response = await fetch(API_CONFIG.getURL('directory') + `?category=${category.id}`);
            const data = await response.json();
            this.renderContacts(data.contacts);
        } catch (e) {
            this.showNotification('حدث خطأ في تحميل البيانات', 'error');
        }
    }

    renderContacts(contacts) {
        const container = document.getElementById('mainCategories');
        if (!container) return;
        
        contacts.forEach(contact => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-12 mb-3';
            
            col.innerHTML = `
                <div class="contact-card">
                    <img src="${contact.image || 'assets/images/default-avatar.png'}" alt="${contact.name}">
                    <div class="contact-info">
                        <h5>${contact.name}</h5>
                        <p>${contact.description || ''}</p>
                        <div class="contact-actions">
                            <a href="tel:${contact.phone}" class="btn btn-sm btn-primary">
                                <i class="fas fa-phone"></i> اتصال
                            </a>
                            ${contact.whatsapp ? `
                                <a href="https://wa.me/${contact.whatsapp}" class="btn btn-sm btn-success">
                                    <i class="fab fa-whatsapp"></i> واتساب
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(col);
        });
    }

    async loadNews() {
        try {
            const response = await fetch(API_CONFIG.getURL('news'));
            const data = await response.json();
            this.renderNews(data.posts);
        } catch (e) {
            this.showNotification('حدث خطأ في تحميل الأخبار', 'error');
        }
    }

    renderNews(posts) {
        const container = document.getElementById('newsFeed');
        if (!container) return;
        
        container.innerHTML = '';
        
        posts.forEach(post => {
            const article = document.createElement('article');
            article.className = 'news-card';
            
            article.innerHTML = `
                <div class="news-header">
                    <img src="${post.author_image || 'assets/images/default-avatar.png'}" alt="${post.author}">
                    <div>
                        <h6>${post.author}</h6>
                        <small>${post.date}</small>
                    </div>
                </div>
                <div class="news-content">
                    <p>${post.content}</p>
                    ${post.image ? `<img src="${post.image}" alt="Post image">` : ''}
                </div>
                <div class="news-actions">
                    <button class="btn btn-sm" onclick="app.toggleLike(${post.id})">
                        <i class="fas fa-heart ${post.liked ? 'text-danger' : ''}"></i>
                        <span>${post.likes || 0}</span>
                    </button>
                    <button class="btn btn-sm">
                        <i class="fas fa-comment"></i>
                        <span>${post.comments || 0}</span>
                    </button>
                </div>
            `;
            
            container.appendChild(article);
        });
    }

    async loadEvents() {
        try {
            const response = await fetch(API_CONFIG.getURL('events'));
            const data = await response.json();
            this.renderEvents(data.events);
        } catch (e) {
            this.showNotification('حدث خطأ في تحميل الأحداث', 'error');
        }
    }

    renderEvents(events) {
        const container = document.getElementById('eventsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';
            
            card.innerHTML = `
                <div class="event-date">
                    <span class="day">${new Date(event.date).getDate()}</span>
                    <span class="month">${new Date(event.date).toLocaleDateString('ar', {month: 'short'})}</span>
                </div>
                <div class="event-info">
                    <h5>${event.title}</h5>
                    <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                    <p><i class="fas fa-clock"></i> ${event.time}</p>
                    <button class="btn btn-primary btn-sm" onclick="app.rsvpEvent(${event.id})">
                        ${event.attending ? 'ملتحق' : 'سجل حضورك'}
                    </button>
                    <small>${event.attendees || 0} مشارك</small>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    async toggleLike(postId) {
        try {
            const response = await fetch(API_CONFIG.getURL('like'), {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({post_id: postId, user_id: this.currentUser?.id})
            });
            const data = await response.json();
            if (data.success) this.loadNews();
        } catch (e) {
            this.showNotification('حدث خطأ', 'error');
        }
    }

    async rsvpEvent(eventId) {
        try {
            const response = await fetch(API_CONFIG.getURL('rsvp'), {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({event_id: eventId, user_id: this.currentUser?.id})
            });
            const data = await response.json();
            if (data.success) {
                this.showNotification('تم تسجيل حضورك بنجاح', 'success');
                this.loadEvents();
            }
        } catch (e) {
            this.showNotification('حدث خطأ', 'error');
        }
    }

    async performGlobalSearch(query) {
        try {
            const response = await fetch(API_CONFIG.getURL('search') + `?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            this.showSearchResults(data.results);
        } catch (e) {
            console.error('Search error:', e);
        }
    }

    showSearchResults(results) {
        const container = document.getElementById('searchResults');
        if (!container) return;
        
        container.innerHTML = '';
        container.classList.remove('d-none');
        
        if (results.length === 0) {
            container.innerHTML = '<div class="p-3">لا توجد نتائج</div>';
            return;
        }
        
        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <i class="${result.icon}"></i>
                <div>
                    <strong>${result.title}</strong>
                    <small>${result.category}</small>
                </div>
            `;
            item.addEventListener('click', () => {
                this.handleSearchResultClick(result);
            });
            container.appendChild(item);
        });
    }

    hideSearchResults() {
        const container = document.getElementById('searchResults');
        if (container) container.classList.add('d-none');
    }

    handleSearchResultClick(result) {
        this.hideSearchResults();
        if (result.type === 'contact') {
            this.switchSection('directory');
        } else if (result.type === 'event') {
            this.switchSection('events');
        }
    }

    loadProfileData() {
        const user = this.currentUser || this.guestUser;
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileAvatar = document.getElementById('profileAvatar');
        
        if (profileName) profileName.textContent = user.name || 'زائر';
        if (profileEmail) profileEmail.textContent = user.email || 'غير مسجل';
        if (profileAvatar) profileAvatar.src = user.avatar || 'assets/images/default-avatar.png';
    }

    editProfile() {
        this.showNotification('قريباً: تعديل الملف الشخصي', 'info');
    }

    requestAddNumber() {
        this.showNotification('قريباً: طلب إضافة رقم', 'info');
    }

    async submitLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        this.currentUser = {
            id: 1,
            name: 'مستخدم تجريبي',
            email: email,
            avatar: 'assets/images/default-avatar.png'
        };
        
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        this.showMainApp();
        this.showNotification('تم تسجيل الدخول بنجاح', 'success');
    }

    async submitRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        
        this.currentUser = {
            id: Date.now(),
            name: name,
            email: email,
            avatar: 'assets/images/default-avatar.png'
        };
        
        bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
        this.showMainApp();
        this.showNotification('تم إنشاء الحساب بنجاح', 'success');
    }

    showNotificationBox() {
        this.showNotification('لا توجد إشعارات جديدة', 'info');
    }

    showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showLoading() {
        document.getElementById('loadingSpinner')?.classList.remove('d-none');
    }

    hideLoading() {
        document.getElementById('loadingSpinner')?.classList.add('d-none');
    }

    async loadInitialData() {
        await this.loadDirectory();
    }

    setCookie(name, value, days) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${value}; expires=${expires}; path=/`;
    }

    getCookie(name) {
        return document.cookie.split('; ').reduce((r, v) => {
            const parts = v.split('=');
            return parts[0] === name ? decodeURIComponent(parts[1]) : r;
        }, '');
    }

    loadUserSession() {
        const sessionData = localStorage.getItem('ebyar_user_session');
        if (!sessionData) return null;
        
        try {
            const data = JSON.parse(sessionData);
            if (data.expires > Date.now()) {
                return data.user;
            } else {
                localStorage.removeItem('ebyar_user_session');
                return null;
            }
        } catch (e) {
            return null;
        }
    }

    saveUserSession(user) {
        const sessionData = {
            user: user,
            expires: Date.now() + (100 * 24 * 60 * 60 * 1000)
        };
        localStorage.setItem('ebyar_user_session', JSON.stringify(sessionData));
    }

    setupPWA() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
        });
    }

    async requestNotificationPermission() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        }
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new EbyarApp();
});

// Sidebar functions
function openSidebar() {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}
