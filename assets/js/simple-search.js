// Simple Search System
class SimpleSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = document.getElementById('searchResults');
        this.isOpen = false;
        this.init();
    }

    init() {
        if (!this.searchInput || !this.searchResults) {
            console.log('Search elements not found');
            return;
        }

        this.addEventListeners();
        console.log('Search initialized');
    }

    addEventListeners() {
        // Search input
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                this.showModal();
                this.performSearch(query);
            } else {
                this.hideModal();
            }
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.hideModal();
            }
        });
    }

    showModal() {
        if (!this.searchResults) return;

        this.searchResults.innerHTML = this.createModalHTML();
        this.searchResults.classList.remove('d-none');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
        console.log('Search modal opened');
    }

    hideModal() {
        if (!this.searchResults) return;

        this.searchResults.classList.add('d-none');
        this.isOpen = false;
        document.body.style.overflow = 'auto';
        this.searchInput.value = '';
        console.log('Search modal closed');
    }

    createModalHTML() {
        return `
            <div class="search-modal-overlay" onclick="window.simpleSearch.hideModal()">
                <div class="search-modal-content" onclick="event.stopPropagation()">
                    <div class="search-modal-header">
                        <h5><i class="fas fa-search me-2"></i>نتائج البحث</h5>
                        <button class="search-close-btn" onclick="window.simpleSearch.hideModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="search-modal-body" id="searchModalBody">
                        <div class="search-loading">
                            <div class="spinner-border text-primary"></div>
                            <p class="mt-3">جاري البحث...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async performSearch(query) {
        try {
            const response = await fetch(`backend/search.php?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            const modalBody = document.getElementById('searchModalBody');
            if (modalBody) {
                modalBody.innerHTML = this.renderResults(data.contacts || []);
            }
        } catch (error) {
            console.error('Search error:', error);
            const modalBody = document.getElementById('searchModalBody');
            if (modalBody) {
                modalBody.innerHTML = '<div class="search-error">حدث خطأ في البحث</div>';
            }
        }
    }

    renderResults(contacts) {
        if (contacts.length === 0) {
            return `
                <div class="search-no-results">
                    <i class="fas fa-search fa-3x mb-3"></i>
                    <h6>لا توجد نتائج</h6>
                    <p>جرب استخدام كلمات أخرى</p>
                </div>
            `;
        }

        return contacts.map(contact => `
            <div class="search-result-item" onclick="window.simpleSearch.selectContact(${contact.id})">
                <div class="search-result-content">
                    <img src="data/upload/${contact.image || 'default-avatar.png'}" 
                         alt="${contact.name}" 
                         class="search-result-avatar">
                    <div class="search-result-info">
                        <h6>${contact.name}</h6>
                        <p class="profession">${contact.profession}</p>
                        <p class="phone"><i class="fas fa-phone me-1"></i>${contact.phone}</p>
                    </div>
                    <div class="search-result-action">
                        <i class="fas fa-arrow-left"></i>
                    </div>
                </div>
            </div>
        `).join('');
    }

    selectContact(contactId) {
        this.hideModal();
        // Show contact modal if available
        if (window.showContactModal) {
            window.showContactModal(contactId);
        }
        console.log('Selected contact:', contactId);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.simpleSearch = new SimpleSearch();
});