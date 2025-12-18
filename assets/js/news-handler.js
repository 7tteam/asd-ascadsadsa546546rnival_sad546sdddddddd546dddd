// News Handler - Like System & Read More
class NewsHandler {
    constructor() {
        this.userId = this.getUserId();
        this.likedPosts = this.getLikedPosts();
    }

    getUserId() {
        let userId = localStorage.getItem('ebyar_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('ebyar_user_id', userId);
        }
        return userId;
    }

    getLikedPosts() {
        const liked = localStorage.getItem('ebyar_liked_posts');
        return liked ? JSON.parse(liked) : [];
    }

    saveLikedPosts() {
        localStorage.setItem('ebyar_liked_posts', JSON.stringify(this.likedPosts));
    }

    isLiked(postId) {
        return this.likedPosts.includes(postId);
    }

    async toggleLike(postId) {
        if (!this.checkAuth()) return;
        
        try {
            const response = await fetch(API_CONFIG.getURL('like'), {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify({ 
                    postId: postId,
                    userId: this.userId,
                    action: 'like'
                })
            });
            
            const result = await response.json();
            if (result.success) {
                if (result.liked) {
                    this.likedPosts.push(postId);
                } else {
                    this.likedPosts = this.likedPosts.filter(id => id !== postId);
                }
                this.saveLikedPosts();
                this.updateLikeButton(postId, result.liked, result.likes);
            }
        } catch (error) {
            console.error('Like error:', error);
        }
    }

    updateLikeButton(postId, liked, count) {
        const btn = document.querySelector(`[data-post-id="${postId}"] .like-btn`);
        if (btn) {
            btn.classList.toggle('liked', liked);
            btn.querySelector('.like-count').textContent = count;
        }
    }

    async vote(postId, option) {
        if (!this.checkAuth()) return;
        
        const voted = localStorage.getItem(`ebyar_voted_${postId}`);
        if (voted) {
            alert('لقد صوت مسبقاً');
            return;
        }

        try {
            const response = await fetch(API_CONFIG.getURL('like'), {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify({ 
                    postId: postId,
                    userId: this.userId,
                    action: 'vote',
                    option: option
                })
            });
            
            const result = await response.json();
            if (result.success) {
                localStorage.setItem(`ebyar_voted_${postId}`, option);
                this.updatePollResults(postId, result.poll);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Vote error:', error);
        }
    }

    updatePollResults(postId, poll) {
        const pollContainer = document.querySelector(`[data-post-id="${postId}"] .poll-container`);
        if (!pollContainer) return;

        const total = Object.values(poll.options).reduce((a, b) => a + b, 0);
        
        pollContainer.innerHTML = `
            <h6 class="poll-question"><i class="fas fa-poll me-2"></i>${poll.question}</h6>
            <div class="poll-results-info">
                <span><i class="fas fa-users"></i> ${total} مصوت</span>
            </div>
            <div class="poll-options">
                ${Object.entries(poll.options).map(([option, votes]) => {
                    const percentage = total > 0 ? (votes / total * 100).toFixed(1) : 0;
                    const isWinning = votes === Math.max(...Object.values(poll.options)) && votes > 0;
                    return `
                        <div class="poll-result ${isWinning ? 'winning' : ''}">
                            <div class="poll-option-header">
                                <span class="poll-option-text">${option}</span>
                                <span class="poll-votes">${votes} صوت</span>
                            </div>
                            <div class="poll-bar">
                                <div class="poll-bar-fill" style="width: ${percentage}%">
                                    <span class="poll-percentage">${percentage}%</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    truncateText(text, wordLimit = 50) {
        const words = text.split(' ');
        if (words.length <= wordLimit) {
            return { text: text, truncated: false };
        }
        return {
            text: words.slice(0, wordLimit).join(' '),
            truncated: true,
            full: text
        };
    }

    createPostElement(post) {
        const isLiked = this.isLiked(post.id);
        const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
        
        const contentData = this.truncateText(post.content);
        
        const postDiv = document.createElement('div');
        postDiv.className = 'news-post fade-in';
        postDiv.dataset.postId = post.id;
        
        let pollHTML = '';
        if (post.type === 'poll' && post.poll) {
            const hasVoted = localStorage.getItem(`ebyar_voted_${post.id}`);
            const total = Object.values(post.poll.options).reduce((a, b) => a + b, 0);
            
            if (hasVoted) {
                pollHTML = `
                    <div class="poll-container">
                        <h6 class="poll-question"><i class="fas fa-poll me-2"></i>${post.poll.question}</h6>
                        <div class="poll-results-info">
                            <span><i class="fas fa-users"></i> ${total} مصوت</span>
                        </div>
                        <div class="poll-options">
                            ${Object.entries(post.poll.options).map(([option, votes]) => {
                                const percentage = total > 0 ? (votes / total * 100).toFixed(1) : 0;
                                const isWinning = votes === Math.max(...Object.values(post.poll.options)) && votes > 0;
                                return `
                                    <div class="poll-result ${isWinning ? 'winning' : ''}">
                                        <div class="poll-option-header">
                                            <span class="poll-option-text">${option}</span>
                                            <span class="poll-votes">${votes} صوت</span>
                                        </div>
                                        <div class="poll-bar">
                                            <div class="poll-bar-fill" style="width: ${percentage}%">
                                                <span class="poll-percentage">${percentage}%</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            } else {
                pollHTML = `
                    <div class="poll-container">
                        <h6 class="poll-question"><i class="fas fa-poll me-2"></i>${post.poll.question}</h6>
                        <div class="poll-options">
                            ${Object.keys(post.poll.options).map(option => `
                                <button class="poll-option-btn" onclick="newsHandler.vote('${post.id}', '${option}')">
                                    <i class="fas fa-check-circle me-2"></i>${option}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
        
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${post.author.charAt(0)}</div>
                <div>
                    <h6 class="mb-0">${post.author}</h6>
                    <small class="text-muted">${this.formatDate(post.date)}</small>
                </div>
                ${post.type === 'poll' ? '<span class="badge bg-primary ms-auto"><i class="fas fa-poll me-1"></i>تصويت</span>' : ''}
            </div>
            <div class="post-content">
                <p class="post-text" data-full="${contentData.full || ''}">${contentData.text}</p>
                ${contentData.truncated ? `<button class="read-more-btn" onclick="newsHandler.toggleReadMore(this)">قراءة المزيد <i class="fas fa-chevron-down ms-1"></i></button>` : ''}
                ${post.images && post.images.length > 0 ? post.images.map(img => `<img src="${img}" class="img-fluid rounded mb-2">`).join('') : ''}
                ${pollHTML}
            </div>
            <div class="post-actions">
                <button class="btn btn-sm like-btn ${isLiked ? 'liked' : ''}" onclick="newsHandler.toggleLike('${post.id}')">
                    <i class="fas fa-heart me-1"></i><span class="like-count">${likesCount}</span>
                </button>
                <button class="btn btn-sm">
                    <i class="fas fa-comment me-1"></i>${Array.isArray(post.comments) ? post.comments.length : 0}
                </button>
                <button class="btn btn-sm" onclick="newsHandler.sharePost('${post.id}')">
                    <i class="fas fa-share me-1"></i>مشاركة
                </button>
            </div>
        `;
        
        return postDiv;
    }

    toggleReadMore(btn) {
        const postText = btn.previousElementSibling;
        const fullText = postText.dataset.full;
        
        if (btn.textContent === 'قراءة المزيد') {
            postText.innerHTML = fullText;
            btn.textContent = 'إخفاء';
            postText.classList.add('expanded');
        } else {
            const truncated = this.truncateText(fullText);
            postText.innerHTML = truncated.text;
            btn.textContent = 'قراءة المزيد';
            postText.classList.remove('expanded');
        }
    }

    sharePost(postId) {
        const url = `${window.location.origin}${window.location.pathname}#post-${postId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'خبر من دليل ابيار',
                url: url
            });
        } else {
            navigator.clipboard.writeText(url);
            alert('تم نسخ الرابط');
        }
    }

    checkAuth() {
        if (!window.app || !window.app.currentUser) {
            const modal = new bootstrap.Modal(document.getElementById('loginModal'));
            modal.show();
            return false;
        }
        return true;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        if (days < 7) return `منذ ${days} يوم`;
        return date.toLocaleDateString('ar-SA');
    }
}

const newsHandler = new NewsHandler();
