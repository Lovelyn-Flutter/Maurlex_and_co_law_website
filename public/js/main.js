// ============================================
// MAURLEX & CO. LAW FIRM WEBSITE
// Main JavaScript File
// ============================================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // NAVIGATION - Scroll Effect
    // ============================================
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // ============================================
    // MOBILE MENU TOGGLE
    // ============================================
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
    
    // ============================================
    // CURRENT YEAR IN FOOTER
    // ============================================
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // ============================================
    // LOAD FEATURED ARTICLES (Homepage)
    // ============================================
    const featuredArticlesContainer = document.getElementById('featuredArticles');
    
    if (featuredArticlesContainer) {
        loadFeaturedArticles();
    }
    
    async function loadFeaturedArticles() {
        try {
            const response = await fetch('/api/articles/recent');
            const articles = await response.json();
            
            if (articles && articles.length > 0) {
                featuredArticlesContainer.innerHTML = articles.map((article, index) => `
                    <a href="/article.html?slug=${article.slug}" class="article-card animate-fade-up" style="animation-delay: ${index * 0.1}s">
                        <div class="article-image" style="background-image: url('${article.image}')"></div>
                        <div class="article-content">
                            <div class="article-meta">
                                <span class="article-date">
                                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/>
                                    </svg>
                                    ${formatDate(article.createdAt)}
                                </span>
                                <span class="article-category">${article.category}</span>
                            </div>
                            <h3 class="article-title">${article.title}</h3>
                            <p class="article-excerpt">${article.excerpt}</p>
                            <span class="article-link">Read Article →</span>
                        </div>
                    </a>
                `).join('');
            } else {
                featuredArticlesContainer.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                        <p style="color: rgba(255,255,255,0.7);">No articles available yet. Check back soon!</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading articles:', error);
            featuredArticlesContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <p style="color: rgba(255,255,255,0.7);">Unable to load articles at this time.</p>
                </div>
            `;
        }
    }
    
    // ============================================
    // NEWSLETTER SUBSCRIPTION
    // ============================================
    const newsletterForm = document.getElementById('newsletterForm');
    const sidebarNewsletterForm = document.getElementById('sidebarNewsletterForm');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
    
    if (sidebarNewsletterForm) {
        sidebarNewsletterForm.addEventListener('submit', handleSidebarNewsletterSubmit);
    }
    
    async function handleNewsletterSubmit(e) {
        e.preventDefault();
        
        const email = document.getElementById('newsletterEmail').value;
        const messageDiv = document.getElementById('newsletterMessage');
        const submitButton = e.target.querySelector('button[type="submit"]');
        
        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Subscribing...';
        
        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (data.success) {
                messageDiv.textContent = data.message;
                messageDiv.className = 'form-message success';
                e.target.reset();
            } else {
                messageDiv.textContent = data.message;
                messageDiv.className = 'form-message error';
            }
        } catch (error) {
            messageDiv.textContent = 'An error occurred. Please try again.';
            messageDiv.className = 'form-message error';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Subscribe';
            
            // Hide message after 5 seconds
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'form-message';
            }, 5000);
        }
    }
    
    async function handleSidebarNewsletterSubmit(e) {
        e.preventDefault();
        
        const email = e.target.querySelector('input[type="email"]').value;
        const messageDiv = document.getElementById('sidebarNewsletterMessage');
        const submitButton = e.target.querySelector('button[type="submit"]');
        
        submitButton.disabled = true;
        submitButton.textContent = 'Subscribing...';
        
        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (data.success) {
                messageDiv.textContent = data.message;
                messageDiv.className = 'form-message success';
                e.target.reset();
            } else {
                messageDiv.textContent = data.message;
                messageDiv.className = 'form-message error';
            }
        } catch (error) {
            messageDiv.textContent = 'An error occurred. Please try again.';
            messageDiv.className = 'form-message error';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Subscribe';
            
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'form-message';
            }, 5000);
        }
    }
    
    // ============================================
    // CONTACT FORM SUBMISSION
    // ============================================
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    async function handleContactSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            message: document.getElementById('message').value
        };
        
        const messageDiv = document.getElementById('contactMessage');
        const submitButton = e.target.querySelector('button[type="submit"]');
        
        submitButton.disabled = true;
        submitButton.innerHTML = 'Sending...';
        
        try {
            const response = await fetch('/api/contact/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                messageDiv.textContent = data.message;
                messageDiv.className = 'form-message success';
                e.target.reset();
            } else {
                messageDiv.textContent = data.message;
                messageDiv.className = 'form-message error';
            }
        } catch (error) {
            messageDiv.textContent = 'An error occurred. Please try again.';
            messageDiv.className = 'form-message error';
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = `
                Send Message
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-left: 8px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
            `;
            
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'form-message';
            }, 5000);
        }
    }
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    // Format date to readable string
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // ============================================
    // INTERSECTION OBSERVER FOR ANIMATIONS
    // ============================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all animated elements
    document.querySelectorAll('.animate-fade-up, .animate-slide-left, .animate-slide-right').forEach(el => {
        observer.observe(el);
    });
});