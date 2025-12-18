// User Session Management
class UserSession {
    constructor() {
        this.init();
    }

    init() {
        // Check if user has visited before
        const hasVisited = localStorage.getItem('ebyar_visited');
        const userId = localStorage.getItem('ebyar_user_id');
        
        if (!hasVisited) {
            // First time visitor - show onboarding
            this.showOnboarding();
        } else {
            // Returning visitor - skip to main content
            this.skipToMain();
        }
    }

    showOnboarding() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('onboardingOverlay').classList.remove('d-none');
    }

    skipToMain() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('onboardingOverlay').classList.add('d-none');
        document.getElementById('authModal').classList.add('d-none');
        document.getElementById('mainNavbar').classList.remove('d-none');
        document.getElementById('mainContent').classList.remove('d-none');
        document.getElementById('bottomNav').classList.remove('d-none');
    }

    completeOnboarding() {
        // Mark as visited
        localStorage.setItem('ebyar_visited', 'true');
        localStorage.setItem('ebyar_visit_date', new Date().toISOString());
        
        // Generate user ID if not exists
        if (!localStorage.getItem('ebyar_user_id')) {
            const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('ebyar_user_id', userId);
        }
        
        // Hide onboarding and show auth modal
        document.getElementById('onboardingOverlay').classList.add('d-none');
        document.getElementById('authModal').classList.remove('d-none');
    }

    continueAsGuest() {
        document.getElementById('authModal').classList.add('d-none');
        document.getElementById('mainNavbar').classList.remove('d-none');
        document.getElementById('mainContent').classList.remove('d-none');
        document.getElementById('bottomNav').classList.remove('d-none');
        
        // Register as guest
        this.registerGuest();
    }

    async registerGuest() {
        const userId = localStorage.getItem('ebyar_user_id');
        try {
            await fetch('backend/auto_guest.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    action: 'register_guest'
                })
            });
        } catch (error) {
            console.log('Guest registration failed:', error);
        }
    }
}

// Initialize session management
const userSession = new UserSession();

// Global functions for onboarding
window.testSkip = function() {
    userSession.completeOnboarding();
};

window.testNext = function() {
    // Handle onboarding navigation
    const currentSlide = document.querySelector('.onboarding-slide.active');
    const nextSlide = currentSlide.nextElementSibling;
    
    if (nextSlide && nextSlide.classList.contains('onboarding-slide')) {
        currentSlide.classList.remove('active');
        nextSlide.classList.add('active');
        
        // Update dots
        const currentDot = document.querySelector('.dot.active');
        const nextDot = currentDot.nextElementSibling;
        if (nextDot) {
            currentDot.classList.remove('active');
            nextDot.classList.add('active');
        }
        
        // Update button text
        const nextBtn = document.getElementById('nextSlide');
        if (!nextSlide.nextElementSibling || !nextSlide.nextElementSibling.classList.contains('onboarding-slide')) {
            nextBtn.textContent = 'ابدأ';
            nextBtn.onclick = () => userSession.completeOnboarding();
        }
    } else {
        userSession.completeOnboarding();
    }
};

// Auth modal handlers
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('continueGuest').addEventListener('click', function() {
        userSession.continueAsGuest();
    });
    
    document.getElementById('registerUser').addEventListener('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('registerModal'));
        modal.show();
    });
    
    document.getElementById('loginUser').addEventListener('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    });
});