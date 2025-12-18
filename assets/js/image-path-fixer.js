// Image Path Fixer - Ensures all images have data/upload/ prefix
class ImagePathFixer {
    constructor() {
        this.init();
    }

    init() {
        // Fix images on page load
        this.fixAllImages();
        
        // Fix images when new content is added
        this.observeChanges();
    }

    fixAllImages() {
        // Fix all img tags
        document.querySelectorAll('img').forEach(img => {
            this.fixImageSrc(img);
        });

        // Fix background images
        document.querySelectorAll('[style*="background-image"]').forEach(element => {
            this.fixBackgroundImage(element);
        });
    }

    fixImageSrc(img) {
        if (!img.src) return;
        
        const src = img.getAttribute('src');
        if (!src) return;

        // Skip if already has data/upload/ or is external URL
        if (src.includes('data/upload/') || src.startsWith('http') || src.startsWith('//')) {
            return;
        }

        // Skip default images
        if (src.includes('default-') || src.includes('placeholder')) {
            return;
        }

        // Add data/upload/ prefix if it's just a filename
        if (!src.includes('/') || src.startsWith('assets/')) {
            return; // Keep assets and other paths as is
        }

        // Fix the path
        const filename = src.split('/').pop();
        if (filename && !src.startsWith('data/upload/')) {
            img.src = `data/upload/${filename}`;
        }
    }

    fixBackgroundImage(element) {
        const style = element.style.backgroundImage;
        if (!style || !style.includes('url(')) return;

        const urlMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (!urlMatch) return;

        const url = urlMatch[1];
        if (url.includes('data/upload/') || url.startsWith('http')) return;

        const filename = url.split('/').pop();
        if (filename && !url.startsWith('data/upload/')) {
            element.style.backgroundImage = `url('data/upload/${filename}')`;
        }
    }

    observeChanges() {
        // Watch for new images being added to the DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if the node itself is an image
                        if (node.tagName === 'IMG') {
                            this.fixImageSrc(node);
                        }
                        
                        // Check for images within the node
                        const images = node.querySelectorAll ? node.querySelectorAll('img') : [];
                        images.forEach(img => this.fixImageSrc(img));
                        
                        // Check for background images
                        if (node.style && node.style.backgroundImage) {
                            this.fixBackgroundImage(node);
                        }
                        
                        const bgElements = node.querySelectorAll ? node.querySelectorAll('[style*="background-image"]') : [];
                        bgElements.forEach(el => this.fixBackgroundImage(el));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Static method to fix a specific image path
    static fixPath(imagePath) {
        if (!imagePath) return 'data/upload/default-avatar.png';
        
        // If already has data/upload/ or is external, return as is
        if (imagePath.includes('data/upload/') || imagePath.startsWith('http') || imagePath.startsWith('//')) {
            return imagePath;
        }
        
        // If it's just a filename, add data/upload/
        const filename = imagePath.split('/').pop();
        return `data/upload/${filename}`;
    }
}

// Initialize image path fixer
const imagePathFixer = new ImagePathFixer();

// Make static method globally available
window.fixImagePath = ImagePathFixer.fixPath;