// Brand Animation Controller
class BrandAnimationController {
    constructor() {
        this.init();
    }

    init() {
        this.createAnimatedText();
        this.createMagicParticles();
        this.createShootingStars();
        this.startAnimationCycle();
    }

    createAnimatedText() {
        const brandText = document.querySelector('.brand-text');
        if (!brandText) return;

        const text = brandText.textContent;
        brandText.innerHTML = '';

        // Split text into individual letters
        text.split('').forEach((letter, index) => {
            const span = document.createElement('span');
            span.textContent = letter === ' ' ? '\u00A0' : letter;
            span.style.animationDelay = `${index * 0.1}s`;
            brandText.appendChild(span);
        });
    }

    createMagicParticles() {
        const brandContainer = document.querySelector('.video-text-brand');
        if (!brandContainer) return;

        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'magic-particles';

        // Create 3 simple particles
        for (let i = 0; i < 3; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.animationDelay = `${i * 1}s`;
            particlesContainer.appendChild(particle);
        }

        brandContainer.appendChild(particlesContainer);
    }

    createShootingStars() {
        // Simplified - no shooting stars for cleaner look
        return;
    }

    startAnimationCycle() {
        // Change animation every 5 seconds
        setInterval(() => {
            this.cycleAnimations();
        }, 5000);
    }

    cycleAnimations() {
        const brandText = document.querySelector('.brand-text');
        if (!brandText) return;

        const animations = [
            'gentleGlow 3s ease-in-out infinite',
            'pulseGlow 2s ease-in-out infinite'
        ];

        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
        brandText.style.animation = randomAnimation;

        // Reset after animation
        setTimeout(() => {
            brandText.style.animation = 'gentleGlow 3s ease-in-out infinite';
        }, 3000);
    }

    // Add special effects on hover
    addHoverEffects() {
        const navbar = document.querySelector('.navbar-brand');
        if (!navbar) return;

        navbar.addEventListener('mouseenter', () => {
            this.createBurstEffect();
        });
    }

    createBurstEffect() {
        const brandContainer = document.querySelector('.video-text-brand');
        if (!brandContainer) return;

        // Create burst particles
        for (let i = 0; i < 8; i++) {
            const burst = document.createElement('div');
            burst.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, #ffd700, #ff6b6b);
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                animation: burstOut 0.8s ease-out forwards;
                animation-delay: ${i * 0.1}s;
                pointer-events: none;
            `;

            const angle = (i / 8) * 360;
            burst.style.setProperty('--angle', `${angle}deg`);

            brandContainer.appendChild(burst);

            // Remove after animation
            setTimeout(() => {
                burst.remove();
            }, 1000);
        }
    }
}

// Add burst animation CSS
if (!document.getElementById('burst-animation-css')) {
    const burstCSS = `
    @keyframes burstOut {
        0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0px);
            opacity: 1;
            scale: 1;
        }
        100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(30px);
            opacity: 0;
            scale: 0.5;
        }
    }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'burst-animation-css';
    styleElement.textContent = burstCSS;
    document.head.appendChild(styleElement);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const brandController = new BrandAnimationController();
    brandController.addHoverEffects();
});