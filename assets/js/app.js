// دليل ابيار - Main Application JavaScript
class EbyarApp {
    constructor() {
        this.currentSection = 'home';
        this.currentUser = null;
        this.guestUser = this.getOrCreateGuestUser();
        this.isFirstVisit = this.checkFirstVisit();
        this.currentCategory = null;
        this.init();
    }

    async getOrCreateGuestUser() {
        try {
            const response = await fetch(API_CONFIG.getURL('session'), {
                headers: API_CONFIG.getHeaders()
            });
            if (!response.ok) throw new Error('Backend not available');
            const data = await response.json();
            
            if (data.guest) {
                // Update visit count
                data.guest.visits = (data.guest.visits || 0) + 1;
                data.guest.lastVisit = new Date().toISOString();
                await this.saveGuestUser(data.guest);
                return data.guest;
            } else {
                // Create new guest
                const guest = {
                    id: 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    ip: this.getUserIP(),
                    location: this.getUserLocation(),
                    created: new Date().toISOString(),
                    visits: 1,
                    name: null,
                    phone: null,
                    userAgent: navigator.userAgent
                };
                
                await this.saveGuestUser(guest);
                return guest;
            }
        } catch (e) {
            console.log('Backend not available, using local mode');
            // Use localStorage as fallback
            let guest = localStorage.getItem('ebyar_guest');
            if (guest) {
                guest = JSON.parse(guest);
                guest.visits = (guest.visits || 0) + 1;
            } else {
                guest = {
                    id: 'guest_fallback_' + Date.now(),
                    ip: 'unknown',
                    location: 'unknown',
                    created: new Date().toISOString(),
                    visits: 1
                };
            }
            localStorage.setItem('ebyar_guest', JSON.stringify(guest));
            return guest;
        }
    }
    
    async saveGuestUser(guestData) {
        try {
            await fetch(API_CONFIG.getURL('session'), {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify({
                    action: 'save_guest',
                    guestData: guestData
                })
            });
        } catch (e) {
            console.error('Failed to save guest user:', e);
        }
    }

    getUserIP() {
        return 'localhost';
    }

    getUserLocation() {
        return 'Unknown';
    }

    async checkFirstVisit() {
        // Always use local storage for first visit check
        const visited = localStorage.getItem('ebyar_visited') || this.getCookie('ebyar_visited');
        return !visited;
    }

    setCookie(name, value, days = 365) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    saveUserSession(user) {
        const sessionData = {
            user: user,
            expires: Date.now() + (100 * 24 * 60 * 60 * 1000)
        };
        localStorage.setItem('ebyar_user_session', JSON.stringify(sessionData));
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

    async init() {
        this.showLoadingScreen();
        
        // Check saved user session
        const savedUser = this.loadUserSession();
        if (savedUser) {
            this.currentUser = savedUser;
        }
        
        // Initialize guest user
        this.guestUser = await this.getOrCreateGuestUser();
        
        // Check if first visit
        const isFirstVisit = await this.checkFirstVisit();
        
        setTimeout(() => {
            this.hideLoadingScreen();
            if (isFirstVisit) {
                this.showOnboarding();
            } else {
                this.showMainApp();
            }
        }, 2500);
        
        this.setupEventListeners();
        this.setupPWA();
        this.requestNotificationPermission();
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
        console.log('Showing onboarding, current slide:', this.currentSlide);
        this.setupOnboardingListeners();
    }

    setupOnboardingListeners() {
        console.log('Setting up onboarding listeners');
        
        // Wait a bit for DOM to be ready
        setTimeout(() => {
            const nextBtn = document.getElementById('nextSlide');
            const skipBtn = document.getElementById('skipOnboarding');
            const dots = document.querySelectorAll('.dot');
            
            console.log('Found elements:', {
                nextBtn: !!nextBtn,
                skipBtn: !!skipBtn,
                dots: dots.length
            });

            if (nextBtn) {
                nextBtn.onclick = (e) => {
                    e.preventDefault();
                    console.log('Next button clicked, current slide:', this.currentSlide);
                    if (this.currentSlide < 3) {
                        this.currentSlide++;
                        this.updateOnboardingSlide();
                    } else {
                        this.finishOnboarding();
                    }
                };
            } else {
                console.log('Next button not found');
            }

            if (skipBtn) {
                skipBtn.onclick = (e) => {
                    e.preventDefault();
                    console.log('Skip button clicked');
                    this.finishOnboarding();
                };
            } else {
                console.log('Skip button not found');
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
        // Hide all slides
        document.querySelectorAll('.onboarding-slide').forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Show current slide
        const currentSlideElement = document.querySelector(`[data-slide="${this.currentSlide}"]`);
        if (currentSlideElement) {
            currentSlideElement.classList.add('active');
        }
        
        // Update dots
        document.querySelectorAll('.dot').forEach(dot => {
            dot.classList.remove('active');
        });
        const currentDot = document.querySelector(`.dot[data-slide="${this.currentSlide}"]`);
        if (currentDot) {
            currentDot.classList.add('active');
        }
        
        // Update button text
        const nextBtn = document.getElementById('nextSlide');
        if (nextBtn) {
            nextBtn.textContent = this.currentSlide === 3 ? 'ابدأ الآن' : 'التالي';
        }
    }

    finishOnboarding() {
        document.getElementById('onboardingOverlay').style.display = 'none';
        document.getElementById('authModal').classList.remove('d-none');
        
        // Save visited status to both localStorage and cookies
        try {
            localStorage.setItem('ebyar_visited', 'true');
        } catch (e) {
            console.log('Could not save to localStorage');
        }
        this.setCookie('ebyar_visited', 'true', 3650); // 10 years
    }

    showMainApp() {
        document.getElementById('mainContent').classList.remove('d-none');
        document.getElementById('mainNavbar').classList.remove('d-none');
        document.getElementById('bottomNav').classList.remove('d-none');
        this.loadInitialData();
    }

    setupEventListeners() {
        // Auth modal buttons
        document.getElementById('registerUser')?.addEventListener('click', () => this.handleRegister());
        document.getElementById('loginUser')?.addEventListener('click', () => this.handleLogin());
        document.getElementById('continueGuest')?.addEventListener('click', () => this.continueAsGuest());

        // Navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]')?.dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            });
        });
        
        // Notification button
        document.getElementById('notificationBtn')?.addEventListener('click', () => {
            this.showNotificationBox();
        });
        
        // Sidebar navigation
        document.querySelectorAll('.sidebar-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').dataset.section;
                this.switchSection(section);
                closeSidebar();
            });
        });
        
        // Profile actions
        document.getElementById('editProfileBtn')?.addEventListener('click', () => {
            this.editProfile();
        });
        
        document.getElementById('requestAddBtn')?.addEventListener('click', () => {
            this.requestAddNumber();
        });
        
        // Auth forms
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitLogin();
        });
        
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitRegister();
        });

        // Global Search
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 1) {
                this.performGlobalSearch(query);
            } else {
                this.hideSearchResults();
            }
        });
        
        // Directory Search
        document.getElementById('directorySearch')?.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                this.searchContacts(query);
            }
        });
        
        // Hide search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSearchResults();
            }
        });

        // Category filters
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-category]')) {
                this.filterByCategory(e.target.dataset.category);
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
        console.log('Guest user:', this.guestUser);
        document.getElementById('authModal').classList.add('d-none');
        this.showMainApp();
    }

    switchSection(section) {
        // Update bottom navigation
        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
        const navItem = document.querySelector(`[data-section="${section}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        // Hide all sections
        document.querySelectorAll('.section-content').forEach(sec => sec.classList.add('d-none'));
        
        if (section === 'home') {
            // Show home content (hero + dashboard)
            const heroSection = document.querySelector('.hero-section');
            const containerSection = document.querySelector('.container.mt-4');
            if (heroSection) heroSection.style.display = 'block';
            if (containerSection) containerSection.style.display = 'block';
        } else {
            // Hide home content and show specific section
            const heroSection = document.querySelector('.hero-section');
            const containerSection = document.querySelector('.container.mt-4');
            if (heroSection) heroSection.style.display = 'none';
            if (containerSection) containerSection.style.display = 'none';
            
            const targetSection = document.getElementById(`${section}Section`);
            if (targetSection) {
                targetSection.classList.remove('d-none');
            }
        }
        
        this.currentSection = section;
        this.loadSectionData(section);
        
        // Load profile data if switching to profile
        if (section === 'profile') {
            this.loadProfileData();
        }
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
            this.setupDirectorySearch();
        } catch (e) {
            console.log('Backend not available, showing demo data');
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
        
        document.getElementById('mainCategories').classList.add('d-none');
        document.getElementById('subCategoriesContainer').classList.remove('d-none');
        document.getElementById('categoryTitle').textContent = category.name;
        
        // Load sub-categories based on actual professions in the data
        const subCategories = await this.getSubCategories(category.id);
        this.renderSubCategories(subCategories);
        
        // Load all contacts for this category
        await this.loadCategoryContacts(category.id);
    }

    async getSubCategories(categoryId) {
        try {
            // Get all contacts for this category to extract professions
            const response = await fetch(API_CONFIG.getURL('directory') + `?category=${categoryId}`);
            const data = await response.json();
            
            if (!data.success || !data.contacts) {
                return [];
            }
            
            // Extract unique professions from contacts
            const professions = [...new Set(data.contacts.map(contact => contact.profession))];
            
            // Convert professions to sub-categories with appropriate icons
            const subCategories = professions.map(profession => {
                return {
                    id: profession.toLowerCase().replace(/\s+/g, '-'),
                    name: profession,
                    icon: this.getProfessionIcon(profession)
                };
            });
            
            return subCategories;
        } catch (error) {
            console.error('Error loading sub-categories:', error);
            return [];
        }
    }
    
    getProfessionIcon(profession) {
        const iconMap = {
            'طبيب': 'fas fa-user-md',
            'باطنة': 'fas fa-heartbeat',
            'جراحة': 'fas fa-cut',
            'أطفال': 'fas fa-baby',
            'أسنان': 'fas fa-tooth',
            'عيون': 'fas fa-eye',
            'مطعم': 'fas fa-utensils',
            'شعبي': 'fas fa-utensils',
            'وجبات سريعة': 'fas fa-hamburger',
            'حلويات': 'fas fa-birthday-cake',
            'مدرس': 'fas fa-chalkboard-teacher',
            'مهندس': 'fas fa-hard-hat',
            'خدمات': 'fas fa-tools',
            'صيانة': 'fas fa-wrench',
            'تنظيف': 'fas fa-broom'
        };
        
        // Try to find exact match first
        if (iconMap[profession]) {
            return iconMap[profession];
        }
        
        // Try partial matches
        for (const [key, icon] of Object.entries(iconMap)) {
            if (profession.includes(key) || key.includes(profession)) {
                return icon;
            }
        }
        
        // Default icon
        return 'fas fa-user';
    }

    renderSubCategories(subCategories) {
        const container = document.getElementById('subCategories');
        container.innerHTML = '';
        
        subCategories.forEach(subCat => {
            const subCatElement = document.createElement('div');
            subCatElement.className = 'sub-category';
            subCatElement.innerHTML = `
                <i class="${subCat.icon}"></i>
                <span>${subCat.name}</span>
            `;
            
            subCatElement.addEventListener('click', () => {
                this.filterBySubCategory(subCat.name);
            });
            
            container.appendChild(subCatElement);
        });
    }

    async loadCategoryContacts(categoryId) {
        const response = await fetch(API_CONFIG.getURL('directory') + `?category=${categoryId}`);
        const data = await response.json();
        this.renderDirectoryCards(data.contacts);
    }

    setupDirectorySearch() {
        const searchInput = document.getElementById('directorySearch');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                this.searchContacts(query);
            }
        });
        
        const backBtn = document.getElementById('backToMain');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showMainCategories();
            });
        }
    }

    showMainCategories() {
        document.getElementById('subCategoriesContainer').classList.add('d-none');
        document.getElementById('mainCategories').classList.remove('d-none');
        document.getElementById('directoryCards').innerHTML = '';
        this.currentCategory = null;
    }

    async searchContacts(query) {
        const response = await fetch(API_CONFIG.getURL('search') + `?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        this.renderDirectoryCards(data.contacts || []);
    }

    filterBySubCategory(profession) {
        console.log('Filtering by profession:', profession);
        
        // Filter displayed cards by profession
        const cards = document.querySelectorAll('.directory-card');
        cards.forEach(card => {
            const cardProfession = card.querySelector('.card-text').textContent.trim();
            const cardContainer = card.closest('.col-md-6');
            
            if (cardProfession.includes(profession)) {
                cardContainer.style.display = 'block';
            } else {
                cardContainer.style.display = 'none';
            }
        });
        
        // Update active sub-category
        document.querySelectorAll('.sub-category').forEach(sub => {
            sub.classList.remove('active');
        });
        
        // Find and activate the clicked sub-category
        const clickedSub = Array.from(document.querySelectorAll('.sub-category')).find(sub => 
            sub.querySelector('span').textContent === profession
        );
        if (clickedSub) {
            clickedSub.classList.add('active');
        }
    }

    async loadNews() {
        try {
            const response = await fetch(API_CONFIG.getURL('news'));
            if (!response.ok) throw new Error('Backend not available');
            const data = await response.json();
        
            this.renderNewsFeed(data.posts);
        } catch (e) {
            console.log('News not available');
        }
    }

    async loadEvents() {
        try {
            const response = await fetch(API_CONFIG.getURL('events'));
            if (!response.ok) throw new Error('Backend not available');
            const data = await response.json();
        
            this.renderEvents(data.events);
        } catch (e) {
            console.log('Events not available');
        }
    }

    renderCategories(categories) {
        const container = document.getElementById('categoryFilters');
        const allBtn = container.querySelector('[data-category="all"]');
        
        // Clear existing categories except "all"
        container.querySelectorAll('[data-category]:not([data-category="all"])').forEach(btn => btn.remove());
        
        categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-primary me-2 mb-2';
            btn.dataset.category = category.id;
            btn.textContent = category.name;
            container.appendChild(btn);
        });
    }

    renderDirectoryCards(contacts) {
        const container = document.getElementById('directoryCards');
        container.innerHTML = '';

        contacts.forEach(contact => {
            const card = this.createDirectoryCard(contact);
            container.appendChild(card);
        });
    }

    createDirectoryCard(contact) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        const imagePath = contact.image ? 
            (contact.image.startsWith('http') ? contact.image : API_CONFIG.getDataURL('/upload/' + contact.image)) : 
            'assets/images/default-avatar.png';
        
        col.innerHTML = `
            <div class="card directory-card" data-contact-id="${contact.id}">
                <img src="${imagePath}" class="card-img-top" alt="${contact.name}">
                <div class="card-body">
                    <h5 class="card-title">${contact.name}</h5>
                    <p class="card-text">
                        <i class="fas fa-briefcase text-primary me-1"></i>${contact.profession}
                    </p>
                    <button class="btn btn-primary btn-sm w-100" onclick="app.showContactModal(${contact.id})">
                        <i class="fas fa-eye me-1"></i>عرض التفاصيل
                    </button>
                </div>
            </div>
        `;
        
        return col;
    }

    async showContactModal(contactId) {
        try {
            const response = await fetch(API_CONFIG.getURL('directory') + `?contact_id=${contactId}`);
            const data = await response.json();
            const contact = data.contact;
            
            if (!contact) return;
            
            const imagePath = contact.image ? 
                (contact.image.startsWith('http') ? contact.image : API_CONFIG.getDataURL('/upload/' + contact.image)) : 
                'assets/images/default-avatar.png';
            document.getElementById('contactImage').src = imagePath;
            document.getElementById('contactName').textContent = contact.name;
            document.getElementById('contactProfession').textContent = contact.profession;
            document.getElementById('contactAddress').textContent = contact.address || '';
            
            document.getElementById('callBtn').href = `tel:${contact.phone}`;
            
            const whatsappBtn = document.getElementById('whatsappBtn');
            if (contact.whatsapp) {
                whatsappBtn.href = `https://wa.me/${contact.whatsapp}`;
                whatsappBtn.classList.remove('d-none');
            } else {
                whatsappBtn.classList.add('d-none');
            }
            
            document.getElementById('contactDescription').innerHTML = contact.description || '';
            
            const customFieldsContainer = document.getElementById('contactCustomFields');
            customFieldsContainer.innerHTML = '';
            
            if (contact.customFields) {
                Object.entries(contact.customFields).forEach(([key, value]) => {
                    const fieldDiv = document.createElement('div');
                    fieldDiv.className = 'custom-field';
                    fieldDiv.innerHTML = `<strong>${key}س:</strong> ${value}`;
                    customFieldsContainer.appendChild(fieldDiv);
                });
            }
            
            const modal = new bootstrap.Modal(document.getElementById('contactModal'));
            modal.show();
            
        } catch (error) {
            console.error('Error loading contact:', error);
            this.showNotification('حدث خطأ في تحميل بيانات الاتصال', 'error');
        }
    }

    renderCustomFields(fields) {
        return Object.entries(fields).map(([key, value]) => 
            `<p class="card-text small"><strong>${key}:</strong> ${value}</p>`
        ).join('');
    }

    renderNewsFeed(posts) {
        const container = document.getElementById('newsFeed');
        container.innerHTML = '';

        if (typeof newsHandler !== 'undefined') {
            posts.forEach(post => {
                const postElement = newsHandler.createPostElement(post);
                container.appendChild(postElement);
            });
        } else {
            posts.forEach(post => {
                const postElement = this.createNewsPost(post);
                container.appendChild(postElement);
            });
        }
    }

    createNewsPost(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'news-post';
        postDiv.dataset.postId = post.id;
        
        const likesCount = Array.isArray(post.likes) ? post.likes.length : (post.likes || 0);
        const commentsCount = Array.isArray(post.comments) ? post.comments.length : (post.comments || 0);
        
        let pollHTML = '';
        if (post.type === 'poll' && post.poll) {
            pollHTML = `
                <div class="poll-container">
                    <h6 class="poll-question">${post.poll.question}</h6>
                    <div class="poll-options">
                        ${Object.keys(post.poll.options).map(option => `
                            <button class="poll-option-btn" onclick="newsHandler.vote('${post.id}', '${option}')">
                                ${option}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${post.author.charAt(0)}</div>
                <div>
                    <h6 class="mb-0">${post.author}</h6>
                    <small class="text-muted">${this.formatDate(post.date)}</small>
                </div>
                ${post.type === 'poll' ? '<span class="badge bg-primary ms-auto">تصويت</span>' : ''}
            </div>
            <div class="post-content">
                <p>${post.content}</p>
                ${post.images && post.images.length > 0 ? post.images.map(img => `<img src="${img}" class="img-fluid rounded mb-2">`).join('') : ''}
                ${pollHTML}
            </div>
            <div class="post-actions">
                <button class="btn btn-sm like-btn" onclick="app.toggleLike('${post.id}')">
                    <i class="fas fa-heart me-1"></i><span class="like-count">${likesCount}</span>
                </button>
                <button class="btn btn-sm" onclick="app.showComments('${post.id}')">
                    <i class="fas fa-comment me-1"></i>${commentsCount}
                </button>
                <button class="btn btn-sm" onclick="app.sharePost('${post.id}')">
                    <i class="fas fa-share me-1"></i>مشاركة
                </button>
            </div>
        `;
        
        return postDiv;
    }

    renderEvents(events) {
        const container = document.getElementById('eventsList');
        container.innerHTML = '';

        events.forEach(event => {
            const eventElement = this.createEventCard(event);
            container.appendChild(eventElement);
        });
    }

    createEventCard(event) {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-card';
        
        eventDiv.innerHTML = `
            <div class="row g-0">
                <div class="col-md-2">
                    <div class="event-date">
                        <div>${this.formatEventDate(event.date)}</div>
                    </div>
                </div>
                <div class="col-md-10">
                    <div class="event-content">
                        <h5 class="event-title">${event.title}</h5>
                        <p class="event-description">${event.description}</p>
                        <div class="event-actions">
                            <button class="btn btn-success btn-sm" onclick="app.rsvpEvent(${event.id})">
                                <i class="fas fa-check me-1"></i>سأحضر (${event.attendees || 0})
                            </button>
                            <button class="btn btn-outline-primary btn-sm" onclick="app.shareEvent(${event.id})">
                                <i class="fas fa-share me-1"></i>مشاركة
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return eventDiv;
    }

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;

        this.showLoading();
        
        try {
            const response = await fetch(API_CONFIG.getURL('search') + `?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            
            if (this.currentSection === 'directory') {
                this.renderDirectoryCards(results.contacts || []);
            }
        } catch (error) {
            this.showNotification('حدث خطأ في البحث', 'error');
        } finally {
            this.hideLoading();
        }
    }

    filterByCategory(categoryId) {
        // Update active button
        document.querySelectorAll('[data-category]').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-category="${categoryId}"]`).classList.add('active');

        // Filter cards
        const cards = document.querySelectorAll('.directory-card');
        cards.forEach(card => {
            if (categoryId === 'all' || card.dataset.category === categoryId) {
                card.closest('.col-md-6').style.display = 'block';
            } else {
                card.closest('.col-md-6').style.display = 'none';
            }
        });
    }

    async toggleLike(postId) {
        try {
            const userId = this.guestUser?.id || 'guest_' + Date.now();
            const response = await fetch(API_CONFIG.getURL('like'), {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify({ 
                    postId: postId,
                    userId: userId,
                    action: 'like'
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.loadNews();
            }
        } catch (error) {
            this.showNotification('حدث خطأ', 'error');
        }
    }

    showComments(postId) {
        if (!this.currentUser) {
            const modal = new bootstrap.Modal(document.getElementById('loginModal'));
            modal.show();
            return;
        }
        
        const comment = prompt('اكتب تعليقك:');
        if (comment) {
            this.addComment(postId, comment);
        }
    }

    async addComment(postId, comment) {
        try {
            const response = await fetch(API_CONFIG.BASE_URL + '/comment.php', {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify({ 
                    postId, 
                    comment,
                    author: this.currentUser?.name || this.guestUser?.name || 'زائر'
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.showNotification('تم إضافة التعليق', 'success');
                this.loadNews();
            }
        } catch (error) {
            this.showNotification('حدث خطأ', 'error');
        }
    }

    sharePost(postId) {
        const url = `${window.location.origin}${window.location.pathname}#post-${postId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'خبر من دليل ابيار',
                text: 'شاهد هذا الخبر',
                url: url
            }).catch(() => {
                this.copyToClipboard(url);
            });
        } else {
            this.copyToClipboard(url);
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('تم نسخ الرابط', 'success');
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showNotification('تم نسخ الرابط', 'success');
        });
    }

    async rsvpEvent(eventId) {
        try {
            const response = await fetch(API_CONFIG.getURL('rsvp'), {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify({ eventId })
            });
            
            const result = await response.json();
            if (result.success) {
                this.showNotification('تم تسجيل حضورك بنجاح', 'success');
                this.loadEvents();
            }
        } catch (error) {
            this.showNotification('حدث خطأ', 'error');
        }
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('d-none');
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('d-none');
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${message}</span>
                <button class="btn-close btn-close-sm" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showNotificationBox() {
        const box = document.getElementById('notificationBox');
        if (box) {
            box.classList.remove('d-none');
            this.loadNotifications();
        }
    }

    loadNotifications() {
        const list = document.getElementById('notificationList');
        if (!list) return;
        
        const notifications = [
            { id: 1, message: 'مرحباً بك في دليل ابيار', time: 'منذ 5 دقائق' },
            { id: 2, message: 'تم إضافة جهة اتصال جديدة', time: 'منذ ساعة' }
        ];
        
        list.innerHTML = '';
        notifications.forEach(notif => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.innerHTML = `
                <div>${notif.message}</div>
                <div class="time">${notif.time}</div>
            `;
            list.appendChild(item);
        });
    }

    shareEvent(eventId) {
        if (navigator.share) {
            navigator.share({
                title: 'حدث من دليل ابيار',
                text: 'شاهد هذا الحدث المميز',
                url: window.location.href + '#event-' + eventId
            });
        } else {
            const url = window.location.href + '#event-' + eventId;
            navigator.clipboard.writeText(url);
            this.showNotification('تم نسخ رابط الحدث', 'success');
        }
    }

    showAddEventForm() {
        window.location.href = 'add-event.html';
    }

    async performGlobalSearch(query) {
        try {
            const response = await fetch(API_CONFIG.getURL('search') + `?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            this.showSearchResults(data, query);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    showSearchResults(data, query) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        let hasResults = false;
        
        // Add contacts
        if (data.contacts && data.contacts.length > 0) {
            data.contacts.slice(0, 3).forEach(contact => {
                hasResults = true;
                const item = this.createSearchResultItem(
                    contact.name,
                    contact.profession,
                    'fas fa-user',
                    'جهة اتصال',
                    () => this.showContactModal(contact.id)
                );
                resultsContainer.appendChild(item);
            });
        }
        
        // Add news
        if (data.news && data.news.length > 0) {
            data.news.slice(0, 2).forEach(post => {
                hasResults = true;
                const item = this.createSearchResultItem(
                    post.author,
                    post.content.substring(0, 50) + '...',
                    'fas fa-newspaper',
                    'خبر',
                    () => this.switchSection('news')
                );
                resultsContainer.appendChild(item);
            });
        }
        
        // Add events
        if (data.events && data.events.length > 0) {
            data.events.slice(0, 2).forEach(event => {
                hasResults = true;
                const item = this.createSearchResultItem(
                    event.title,
                    event.description.substring(0, 50) + '...',
                    'fas fa-calendar',
                    'حدث',
                    () => this.switchSection('events')
                );
                resultsContainer.appendChild(item);
            });
        }
        
        if (!hasResults) {
            resultsContainer.innerHTML = '<div class="search-result-item"><div class="text-muted">لا توجد نتائج</div></div>';
        }
        
        resultsContainer.classList.remove('d-none');
    }

    createSearchResultItem(title, subtitle, icon, type, onClick) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <div class="search-result-icon">
                <i class="${icon}"></i>
            </div>
            <div class="search-result-content">
                <div class="search-result-title">${title}</div>
                <div class="search-result-subtitle">${subtitle}</div>
            </div>
            <div class="search-result-type">${type}</div>
        `;
        
        item.addEventListener('click', () => {
            this.hideSearchResults();
            onClick();
        });
        
        return item;
    }

    hideSearchResults() {
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.classList.add('d-none');
        }
    }

    loadProfileData() {
        const profileName = document.getElementById('profileName');
        const profileId = document.getElementById('profileId');
        const visitCount = document.getElementById('visitCount');
        const joinDate = document.getElementById('joinDate');
        const editBtn = document.getElementById('editProfileBtn');
        const requestBtn = document.getElementById('requestAddBtn');
        const profileActions = document.querySelector('.profile-actions');
        
        if (this.currentUser) {
            if (profileName) profileName.textContent = this.currentUser.name;
            if (profileId) profileId.textContent = this.currentUser.email;
            if (visitCount) visitCount.textContent = this.currentUser.visits || 1;
            if (joinDate) {
                const date = new Date(this.currentUser.created_at);
                joinDate.textContent = date.toLocaleDateString('ar-SA');
            }
            if (editBtn) editBtn.style.display = 'inline-block';
            if (requestBtn) requestBtn.style.display = 'inline-block';
        } else {
            if (profileName) profileName.textContent = 'زائر';
            if (profileId) profileId.textContent = 'غير مسجل';
            if (visitCount) visitCount.textContent = this.guestUser?.visits || 1;
            if (joinDate) {
                const date = new Date(this.guestUser?.created || Date.now());
                joinDate.textContent = date.toLocaleDateString('ar-SA');
            }
            if (editBtn) editBtn.style.display = 'none';
            if (requestBtn) requestBtn.style.display = 'none';
            
            if (profileActions) {
                profileActions.innerHTML = `
                    <button class="btn btn-primary" onclick="app.handleLogin()">
                        <i class="fas fa-sign-in-alt me-1"></i>تسجيل الدخول
                    </button>
                    <button class="btn btn-success" onclick="app.handleRegister()">
                        <i class="fas fa-user-plus me-1"></i>إنشاء حساب
                    </button>
                `;
            }
        }
    }
    
    editProfile() {
        const name = prompt('أدخل اسمك:', this.guestUser.name || '');
        if (name !== null) {
            this.guestUser.name = name;
            this.saveGuestUser();
            this.loadProfileData();
            this.showNotification('تم حفظ الاسم بنجاح', 'success');
        }
    }
    
    requestAddNumber() {
        const phone = prompt('أدخل رقم هاتفك:');
        if (phone) {
            this.guestUser.phone = phone;
            this.saveGuestUser();
            this.showNotification('تم إرسال طلب إضافة الرقم للأدمن', 'success');
        }
    }
    
    async submitLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch(API_CONFIG.getURL('session'), {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.saveUserSession(data.user);
                this.showNotification(data.message, 'success');
                bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
                this.loadProfileData();
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('حدث خطأ في تسجيل الدخول', 'error');
        }
    }
    
    async submitRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const password = document.getElementById('registerPassword').value;
        
        try {
            const response = await fetch(API_CONFIG.getURL('session'), {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify({
                    action: 'register',
                    name: name,
                    email: email,
                    phone: phone,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.saveUserSession(data.user);
                this.showNotification(data.message, 'success');
                bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
                this.loadProfileData();
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('حدث خطأ في التسجيل', 'error');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA');
    }

    formatEventDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleDateString('ar-SA', { month: 'short' });
        return `${day}<br>${month}`;
    }

    async loadInitialData() {
        await this.loadHomeData();
    }

    async loadHomeData() {
        this.showLoading();
        
        try {
            // Load quick actions
            await this.loadQuickActions();
            
            // Load latest news (first 3)
            const newsResponse = await fetch(API_CONFIG.getURL('news'), {
                headers: API_CONFIG.getHeaders()
            });
            const newsData = await newsResponse.json();
            this.renderLatestNews(newsData.posts?.slice(0, 3) || []);
            
            // Load upcoming events (first 3)
            const eventsResponse = await fetch(API_CONFIG.getURL('events'), {
                headers: API_CONFIG.getHeaders()
            });
            const eventsData = await eventsResponse.json();
            this.renderUpcomingEvents(eventsData.events?.slice(0, 3) || []);
            
            // Load featured contacts
            const featuredResponse = await fetch(API_CONFIG.getURL('directory') + '?featured=true', {
                headers: API_CONFIG.getHeaders()
            });
            const featuredData = await featuredResponse.json();
            this.renderFeaturedContacts(featuredData.contacts || []);
            
        } catch (error) {
            this.showNotification('حدث خطأ في تحميل البيانات', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadQuickActions() {
        const quickActions = [
            { icon: 'fas fa-utensils', title: 'مطاعم', category: '1' },
            { icon: 'fas fa-user-md', title: 'أطباء', category: '2' },
            { icon: 'fas fa-chalkboard-teacher', title: 'مدرسين', category: '3' },
            { icon: 'fas fa-tools', title: 'خدمات', category: '4' },
            { icon: 'fas fa-newspaper', title: 'أخبار', section: 'news' },
            { icon: 'fas fa-calendar', title: 'أحداث', section: 'events' },
            { icon: 'fas fa-search', title: 'بحث', action: 'search' },
            { icon: 'fas fa-plus', title: 'إضافة', action: 'add' }
        ];
        
        this.renderQuickActions(quickActions);
    }

    renderQuickActions(actions) {
        const container = document.getElementById('quickActions');
        container.innerHTML = '';
        
        actions.forEach(action => {
            const actionElement = document.createElement('div');
            actionElement.className = 'quick-action';
            actionElement.innerHTML = `
                <i class="${action.icon}"></i>
                <span>${action.title}</span>
            `;
            
            actionElement.addEventListener('click', () => {
                if (action.section) {
                    this.switchSection(action.section);
                } else if (action.category) {
                    this.switchSection('directory');
                    setTimeout(() => this.filterByCategory(action.category), 100);
                } else if (action.action === 'search') {
                    document.getElementById('searchInput').focus();
                }
            });
            
            container.appendChild(actionElement);
        });
    }

    renderLatestNews(posts) {
        const container = document.getElementById('latestNews');
        container.innerHTML = '';
        
        if (posts.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">لا توجد أخبار حالياً</p>';
            return;
        }
        
        posts.forEach(post => {
            const newsElement = document.createElement('div');
            newsElement.className = 'compact-card d-flex align-items-center';
            newsElement.innerHTML = `
                <div class="card-icon">
                    <i class="fas fa-newspaper"></i>
                </div>
                <div class="card-content flex-grow-1">
                    <h6>${post.author}</h6>
                    <p>${post.content.substring(0, 80)}${post.content.length > 80 ? '...' : ''}</p>
                </div>
            `;
            
            newsElement.addEventListener('click', () => this.switchSection('news'));
            container.appendChild(newsElement);
        });
    }

    renderUpcomingEvents(events) {
        const container = document.getElementById('upcomingEvents');
        container.innerHTML = '';
        
        if (events.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">لا توجد أحداث قادمة</p>';
            return;
        }
        
        events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'compact-card d-flex align-items-center';
            eventElement.innerHTML = `
                <div class="card-icon">
                    <i class="fas fa-calendar"></i>
                </div>
                <div class="card-content flex-grow-1">
                    <h6>${event.title}</h6>
                    <p>${this.formatDate(event.date)} - ${event.location || 'غير محدد'}</p>
                </div>
            `;
            
            eventElement.addEventListener('click', () => this.switchSection('events'));
            container.appendChild(eventElement);
        });
    }

    renderFeaturedContacts(contacts) {
        const container = document.getElementById('featuredContacts');
        container.innerHTML = '';
        
        if (contacts.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">لا توجد جهات اتصال</p>';
            return;
        }
        
        // Show only first 6 contacts
        contacts.slice(0, 6).forEach(contact => {
            const contactCard = document.createElement('div');
            contactCard.className = 'featured-contact-card';
            const imagePath = contact.image ? 
                (contact.image.startsWith('http') ? contact.image : API_CONFIG.getDataURL('/upload/' + contact.image)) : 
                null;
            
            contactCard.innerHTML = `
                <div class="featured-contact-avatar">
                    ${imagePath ? 
                        `<img src="${imagePath}" alt="${contact.name}">` :
                        `<div class="default-avatar"><i class="fas fa-user"></i></div>`
                    }
                </div>
                <div class="featured-contact-name">${contact.name}</div>
                <div class="featured-contact-profession">${contact.profession}</div>
                <div class="featured-contact-actions">
                    <button class="btn btn-primary btn-sm" onclick="app.showContactModal(${contact.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <a href="tel:${contact.phone}" class="btn btn-success btn-sm">
                        <i class="fas fa-phone"></i>
                    </a>
                </div>
            `;
            
            container.appendChild(contactCard);
        });
    }

    setupPWA() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallPrompt();
        });
    }

    showInstallPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'install-prompt';
        prompt.innerHTML = `
            <div>
                <strong>تثبيت التطبيق</strong>
                <p>يمكنك تثبيت دليل ابيار على هاتفك</p>
                <button class="btn" onclick="app.installApp()">تثبيت</button>
                <button class="btn" onclick="this.parentElement.remove()">إلغاء</button>
            </div>
        `;
        document.body.appendChild(prompt);
    }

    async requestNotificationPermission() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.setupPushNotifications();
            }
        }
    }

    setupPushNotifications() {
        navigator.serviceWorker.ready.then(registration => {
            return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
            });
        }).then(subscription => {
            // Send subscription to server
            fetch(API_CONFIG.getURL('subscribe'), {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify(subscription)
            });
        });
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    showLoginModal() {
        this.showNotification('سيتم إضافة نظام تسجيل الدخول قريباً', 'info');
    }

    showRegisterModal() {
        this.showNotification('سيتم إضافة نظام التسجيل قريباً', 'info');
    }
}

// Test functions for debugging
window.testNext = function() {
    console.log('Test next clicked');
    if (window.app) {
        if (window.app.currentSlide < 3) {
            window.app.currentSlide++;
            window.app.updateOnboardingSlide();
        } else {
            window.app.finishOnboarding();
        }
    }
};

window.testSkip = function() {
    console.log('Test skip clicked');
    if (window.app) {
        window.app.finishOnboarding();
    }
};

window.closeNotifications = function() {
    const box = document.getElementById('notificationBox');
    if (box) {
        box.classList.add('d-none');
    }
};

window.shareEvent = function(eventId) {
    if (window.app) {
        window.app.shareEvent(eventId);
    }
};

window.openSidebar = function() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.remove('d-none');
};

window.closeSidebar = function() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.add('d-none');
};

window.showSettings = function() {
    alert('سيتم إضافة صفحة الإعدادات قريباً');
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app');
    window.app = new EbyarApp();
    
    // Add smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
});