// Device Detection and PWA Install Handler
class DeviceManager {
    constructor() {
        this.isMobile = this.checkMobile();
        this.isInstalled = this.checkInstalled();
        this.deferredPrompt = null;
        this.init();
    }

    checkMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Check for mobile devices
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
        const isMobileDevice = mobileRegex.test(userAgent.toLowerCase());
        
        // Check screen size
        const isSmallScreen = window.innerWidth <= 768;
        
        // Check touch capability
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        return isMobileDevice || (isSmallScreen && isTouchDevice);
    }

    checkInstalled() {
        // Check if app is installed (standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = window.navigator.standalone === true;
        const wasInstalled = localStorage.getItem('pwa_installed') === 'true';
        
        return isStandalone || isIOSStandalone || wasInstalled;
    }

    init() {
        console.log('Device Check:', {
            isMobile: this.isMobile,
            isInstalled: this.isInstalled,
            userAgent: navigator.userAgent
        });

        if (!this.isMobile) {
            // Show desktop block screen
            this.showDesktopBlock();
        } else if (!this.isInstalled) {
            // Show PWA install modal
            this.setupPWAInstall();
        } else {
            // App is installed, proceed normally
            console.log('App is installed, proceeding...');
        }
    }

    showDesktopBlock() {
        const blockScreen = document.getElementById('desktopBlock');
        if (blockScreen) {
            blockScreen.style.display = 'flex';
        }
        
        // Hide all other content
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('onboardingOverlay').style.display = 'none';
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('mainNavbar').style.display = 'none';
    }

    setupPWAInstall() {
        // Listen for beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showPWAModal();
        });

        // Show modal after 1 second if not installed
        setTimeout(() => {
            if (!this.isInstalled) {
                this.showPWAModal();
            }
        }, 1000);

        window.addEventListener('appinstalled', () => {
            this.markAsInstalled();
            this.hidePWAModal();
        });
    }

    showPWAModal() {
        const modal = document.getElementById('pwaInstallModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Show install button if PWA is available
            const installBtn = document.querySelector('.pwa-install-btn');
            if (this.deferredPrompt && installBtn) {
                installBtn.style.display = 'block';
            }
            
            this.updateInstallInstructions();
        }
    }

    hidePWAModal() {
        const modal = document.getElementById('pwaInstallModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    updateInstallInstructions() {
        const stepsContainer = document.querySelector('.pwa-install-steps');
        const modalTitle = document.querySelector('.pwa-install-content h2');
        const modalDesc = document.querySelector('.pwa-install-content p');
        const installBtn = document.querySelector('.pwa-install-btn');
        
        if (!stepsContainer) return;

        // Always show button, hide steps
        if (modalTitle) modalTitle.textContent = 'أضف الموقع للشاشة الرئيسية';
        if (modalDesc) modalDesc.textContent = 'اضغط على الزر لإضافة الموقع لشاشتك الرئيسية';
        if (installBtn) installBtn.style.display = 'block';
        if (stepsContainer) stepsContainer.style.display = 'none';
    }

    async installApp() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                this.markAsInstalled();
                this.hidePWAModal();
            }
            
            this.deferredPrompt = null;
        } else {
            // For Android - check if shortcut was added
            const isAndroid = /Android/.test(navigator.userAgent);
            if (isAndroid) {
                this.showAndroidInstructions();
            } else {
                this.triggerAddToHomeScreen();
                this.markAsInstalled();
                this.hidePWAModal();
            }
        }
    }

    showAndroidInstructions() {
        const confirmed = confirm('لإضافة الموقع للشاشة الرئيسية:\n\n1. اضغط على النقاط الثلاث (⋮) في الأعلى\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"\n\nهل أضفت الموقع؟');
        
        if (confirmed) {
            this.markAsInstalled();
            this.hidePWAModal();
        }
    }

    triggerAddToHomeScreen() {
        // This will work on supported browsers
        if (window.BeforeInstallPromptEvent) {
            // Already handled by deferredPrompt
            return;
        }
        
        // For iOS - show alert to guide user
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
            alert('اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"');
        } else {
            alert('اضغط على قائمة المتصفح ثم "إضافة إلى الشاشة الرئيسية"');
        }
    }

    skipInstall() {
        localStorage.setItem('pwa_install_skipped', 'true');
        localStorage.setItem('pwa_skip_date', Date.now().toString());
        this.hidePWAModal();
    }

    markAsInstalled() {
        localStorage.setItem('pwa_installed', 'true');
        this.isInstalled = true;
    }

    shouldShowInstallPrompt() {
        const skipped = localStorage.getItem('pwa_install_skipped');
        const skipDate = localStorage.getItem('pwa_skip_date');
        
        if (!skipped) return true;
        
        // Show again after 7 days
        const daysSinceSkip = (Date.now() - parseInt(skipDate)) / (1000 * 60 * 60 * 24);
        return daysSinceSkip > 7;
    }
}

// Initialize device manager
let deviceManager;
document.addEventListener('DOMContentLoaded', () => {
    deviceManager = new DeviceManager();
});

// Global functions for button clicks
window.installPWA = function() {
    if (deviceManager) {
        deviceManager.installApp();
    }
};

window.skipPWA = function() {
    if (deviceManager) {
        deviceManager.skipInstall();
    }
};
