// Search Modal Controller
class SearchModalController {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = document.getElementById('searchResults');
        this.init();
    }

    init() {
        if (!this.searchInput || !this.searchResults) return;

        // Add search input event
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                this.showSearchModal();
                this.performSearch(query);
            } else {
                this.hideSearchModal();
            }
        });

        // Add escape key listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSearchModal();
            }
        });
    }

    showSearchModal() {
        this.searchResults.classList.remove('d-none');
        this.searchResults.innerHTML = this.createModalStructure();
        document.body.style.overflow = 'hidden';
    }

    hideSearchModal() {
        this.searchResults.classList.add('d-none');
        document.body.style.overflow = 'auto';
        this.searchInput.value = '';
    }

    createModalStructure() {
        return `
            <div class="search-results-content">
                <div class="search-results-header">
                    <h5 class="mb-0">
                        <i class="fas fa-search me-2"></i>نتائج البحث
                    </h5>
                    <button class="search-close-btn" onclick="searchModal.hideSearchModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="search-results-body" id="searchResultsBody">
                    <div class="search-loading">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">جاري البحث...</span>
                        </div>
                        <p class="mt-3 mb-0">جاري البحث...</p>
                    </div>
                </div>
            </div>
        `;
    }

    async performSearch(query) {
        try {
            const response = await fetch(`backend/search.php?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            const resultsBody = document.getElementById('searchResultsBody');
            if (resultsBody) {
                resultsBody.innerHTML = this.renderSearchResults(data.contacts || []);
            }
        } catch (error) {
            console.error('Search error:', error);
            const resultsBody = document.getElementById('searchResultsBody');
            if (resultsBody) {
                resultsBody.innerHTML = '<p class="text-center text-muted">حدث خطأ في البحث</p>';
            }
        }
    }

    renderSearchResults(contacts) {
        if (contacts.length === 0) {
            return `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <h6>لا توجد نتائج</h6>
                    <p class="mb-0">جرب استخدام كلمات أخرى</p>
                </div>
            `;
        }

        return contacts.map(contact => `
            <div class="search-result-item" onclick="searchModal.selectContact(${contact.id})">
                <div class="d-flex align-items-center">
                    <img src="data/upload/${contact.image || 'default-avatar.png'}" 
                         alt="${contact.name}" 
                         class="search-result-avatar me-3">
                    <div class="flex-grow-1 search-result-info">
                        <h6>${contact.name}</h6>
                        <p class="mb-1 text-muted">${contact.profession}</p>
                        <p class="mb-0 text-primary">
                            <i class="fas fa-phone me-1"></i>${contact.phone}
                        </p>
                    </div>
                    <div>
                        <button class="search-result-action">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    selectContact(contactId) {
        this.hideSearchModal();
        // Show contact modal
        if (window.showContactModal) {
            window.showContactModal(contactId);
        }
    }
}

// Initialize search modal
const searchModal = new SearchModalController();

// Add CSS for search result items
const searchResultCSS = `
<style>
.search-result-item {
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.search-result-item:hover {
    background-color: #f8f9fa;
}

.search-result-item:last-child .border-bottom {
    border-bottom: none !important;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', searchResultCSS);