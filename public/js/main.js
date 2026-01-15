document.addEventListener('DOMContentLoaded', function () {
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', function () {
    if (!navbar) return;
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });

  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', function () {
      this.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      link.addEventListener('click', function () {
        mobileMenuToggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });

    document.addEventListener('click', function (event) {
      if (!navMenu.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
        mobileMenuToggle.classList.remove('active');
        navMenu.classList.remove('active');
      }
    });
  }

  const yearElement = document.getElementById('currentYear');
  if (yearElement) yearElement.textContent = new Date().getFullYear();

  function formatDate(dateString) {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-fade-up, .animate-slide-left, .animate-slide-right').forEach((el) => {
    observer.observe(el);
  });

  const featuredArticlesContainer = document.getElementById('featuredArticles');
  if (featuredArticlesContainer) loadFeaturedArticles();

  async function loadFeaturedArticles() {
    try {
      const response = await fetch('/api/articles/recent');
      const articles = await response.json();

      if (Array.isArray(articles) && articles.length > 0) {
        featuredArticlesContainer.innerHTML = articles
          .map(
            (article, index) => `
            <a href="/article.html?slug=${encodeURIComponent(article.slug)}" class="article-card animate-fade-up" style="animation-delay: ${index * 0.1}s">
              <div class="article-image" style="background-image: url('${article.image || ''}')"></div>
              <div class="article-content">
                <div class="article-meta">
                  <span class="article-date">${formatDate(article.createdAt)}</span>
                  <span class="article-category">${article.category || 'General'}</span>
                </div>
                <h3 class="article-title">${escapeHtml(article.title || '')}</h3>
                <p class="article-excerpt">${escapeHtml(article.excerpt || '')}</p>
                <span class="article-link">Read Article</span>
              </div>
            </a>
          `
          )
          .join('');
      } else {
        featuredArticlesContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <p style="color: rgba(255,255,255,0.7);">No articles available yet. Check back soon.</p>
          </div>
        `;
      }
    } catch (error) {
      featuredArticlesContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <p style="color: rgba(255,255,255,0.7);">Unable to load articles at this time.</p>
        </div>
      `;
    }
  }

  const newsletterForm = document.getElementById('newsletterForm');
  const sidebarNewsletterForm = document.getElementById('sidebarNewsletterForm');

  if (newsletterForm) newsletterForm.addEventListener('submit', handleNewsletterSubmit);
  if (sidebarNewsletterForm) sidebarNewsletterForm.addEventListener('submit', handleSidebarNewsletterSubmit);

  async function handleNewsletterSubmit(e) {
    e.preventDefault();

    const emailInput = document.getElementById('newsletterEmail');
    const messageDiv = document.getElementById('newsletterMessage');
    const submitButton = e.target.querySelector('button[type="submit"]');

    const email = emailInput ? emailInput.value : '';
    if (!submitButton || !messageDiv) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Subscribing...';

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
    } catch {
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

  async function handleSidebarNewsletterSubmit(e) {
    e.preventDefault();

    const emailInput = e.target.querySelector('input[type="email"]');
    const messageDiv = document.getElementById('sidebarNewsletterMessage');
    const submitButton = e.target.querySelector('button[type="submit"]');

    const email = emailInput ? emailInput.value : '';
    if (!submitButton || !messageDiv) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Subscribing...';

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
    } catch {
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

  const contactForm = document.getElementById('contactForm');
  if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);

  async function handleContactSubmit(e) {
    e.preventDefault();

    const nameEl = document.getElementById('name');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');
    const messageEl = document.getElementById('message');

    const formData = {
      name: nameEl ? nameEl.value : '',
      email: emailEl ? emailEl.value : '',
      phone: phoneEl ? phoneEl.value : '',
      message: messageEl ? messageEl.value : '',
    };

    const messageDiv = document.getElementById('contactMessage');
    const submitButton = e.target.querySelector('button[type="submit"]');
    if (!messageDiv || !submitButton) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
    } catch {
      messageDiv.textContent = 'An error occurred. Please try again.';
      messageDiv.className = 'form-message error';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Send Message';

      setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'form-message';
      }, 5000);
    }
  }

  const articlesGrid = document.getElementById('articlesGrid');
  if (articlesGrid) initArticlesPage();

  function escapeHtml(str) {
    return String(str || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function toQueryString(params) {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      usp.set(k, String(v));
    });
    return usp.toString();
  }

  function initArticlesPage() {
    const searchInput = document.getElementById('articleSearch');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const categoriesList = document.getElementById('categoriesList');
    const popularContainer = document.getElementById('popularArticles');
    const paginationHost = document.getElementById('pagination');

    const urlParams = new URLSearchParams(window.location.search);
    const state = {
      page: parseInt(urlParams.get('page') || '1', 10),
      limit: 6,
      category: urlParams.get('category') || 'all',
      search: urlParams.get('q') || '',
    };

    if (searchInput) searchInput.value = state.search;

    filterBtns.forEach((btn) => {
      const cat = btn.getAttribute('data-category');
      btn.classList.toggle('active', (cat || '').toLowerCase() === String(state.category).toLowerCase());
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.category = cat === 'all' ? 'all' : cat;
        state.page = 1;
        syncUrl();
        loadAll();
      });
    });

    let searchTimer = null;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          state.search = (e.target.value || '').trim();
          state.page = 1;
          syncUrl();
          loadAll();
        }, 350);
      });
    }

    function syncUrl() {
      const qs = toQueryString({
        page: state.page,
        category: state.category !== 'all' ? state.category : '',
        q: state.search || '',
      });
      const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    async function loadArticles() {
      const container = articlesGrid;
      container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--grey);">Loading...</div>`;

      const endpoint = state.search || (state.category && state.category !== 'all') ? '/api/articles/search' : '/api/articles';
      const qs = toQueryString({
        page: state.page,
        limit: state.limit,
        q: state.search || '',
        category: state.category && state.category !== 'all' ? state.category : '',
      });

      const res = await fetch(`${endpoint}?${qs}`);
      const data = await res.json();

      const items = Array.isArray(data.articles) ? data.articles : [];
      if (items.length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--grey);">No articles found.</div>`;
      } else {
        container.innerHTML = items
          .map(
            (a) => `
            <a href="/article.html?slug=${encodeURIComponent(a.slug)}" class="article-card animate-fade-up">
              <div class="article-image" style="background-image: url('${a.image || ''}')"></div>
              <div class="article-content">
                <div class="article-meta">
                  <span class="article-date">${formatDate(a.createdAt)}</span>
                  <span class="article-category">${escapeHtml(a.category || 'General')}</span>
                </div>
                <h3 class="article-title">${escapeHtml(a.title || '')}</h3>
                <p class="article-excerpt">${escapeHtml(a.excerpt || '')}</p>
                <span class="article-link">Read Article</span>
              </div>
            </a>
          `
          )
          .join('');
      }

      renderPagination(data.currentPage || state.page, data.totalPages || 1);
    }

    function renderPagination(currentPage, totalPages) {
      const host = paginationHost;
      if (!host) return;

      const total = Math.max(1, parseInt(totalPages, 10) || 1);
      const current = Math.min(total, Math.max(1, parseInt(currentPage, 10) || 1));
      state.page = current;

      if (total <= 1) {
        host.innerHTML = '';
        return;
      }

      const windowSize = 5;
      let start = Math.max(1, current - Math.floor(windowSize / 2));
      let end = Math.min(total, start + windowSize - 1);
      start = Math.max(1, end - windowSize + 1);

      const btn = (label, page, disabled, active) => {
        const dis = disabled ? 'disabled' : '';
        const act = active ? 'active' : '';
        return `<button class="page-btn ${act}" data-page="${page}" ${dis}>${label}</button>`;
      };

      let html = '';
      html += btn('Prev', current - 1, current === 1, false);

      if (start > 1) html += btn('1', 1, false, current === 1);
      if (start > 2) html += `<span style="display:inline-flex;align-items:center;padding:0 6px;color:var(--grey);">...</span>`;

      for (let p = start; p <= end; p++) html += btn(String(p), p, false, p === current);

      if (end < total - 1) html += `<span style="display:inline-flex;align-items:center;padding:0 6px;color:var(--grey);">...</span>`;
      if (end < total) html += btn(String(total), total, false, current === total);

      html += btn('Next', current + 1, current === total, false);
      host.innerHTML = html;

      host.querySelectorAll('button.page-btn').forEach((b) => {
        b.addEventListener('click', () => {
          const p = parseInt(b.getAttribute('data-page') || '1', 10);
          if (Number.isNaN(p) || p < 1) return;
          if (p === state.page) return;
          state.page = p;
          syncUrl();
          loadArticles();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    }

    async function loadCategories() {
      if (!categoriesList) return;
      try {
        const res = await fetch('/api/articles/categories');
        const categories = await res.json();
        const list = Array.isArray(categories) ? categories : [];

        categoriesList.innerHTML = list
          .map(
            (c) => `
            <li class="category-item">
              <a href="#" class="category-link" data-cat="${escapeHtml(c._id)}">${escapeHtml(c._id)}</a>
              <span class="category-count">${c.count || 0}</span>
            </li>
          `
          )
          .join('');

        categoriesList.querySelectorAll('a.category-link').forEach((a) => {
          a.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = a.getAttribute('data-cat') || 'all';
            state.category = cat;
            state.page = 1;

            filterBtns.forEach((b) => {
              const bCat = b.getAttribute('data-category') || '';
              b.classList.toggle('active', bCat.toLowerCase() === cat.toLowerCase());
            });

            syncUrl();
            loadArticles();
          });
        });
      } catch {
        categoriesList.innerHTML = `<li class="category-item"><span style="color: var(--grey);">Unable to load categories</span></li>`;
      }
    }

    async function loadPopular() {
      if (!popularContainer) return;
      try {
        const res = await fetch(`/api/articles?${toQueryString({ page: 1, limit: 3, sort: 'popular' })}`);
        const data = await res.json();
        const items = Array.isArray(data.articles) ? data.articles : [];

        if (items.length === 0) {
          popularContainer.innerHTML = `<p style="font-size: 14px; color: var(--grey);">No popular articles yet.</p>`;
          return;
        }

        popularContainer.innerHTML = `
          <h3 class="sidebar-title">Popular Articles</h3>
          ${items
            .map(
              (a) => `
              <a href="/article.html?slug=${encodeURIComponent(a.slug)}" class="popular-post">
                <div class="popular-post-image" style="background-image: url('${a.image || ''}'); background-size: cover; background-position: center;"></div>
                <div class="popular-post-content">
                  <h4 class="popular-post-title">${escapeHtml(a.title || '')}</h4>
                  <p class="popular-post-date">${formatDate(a.createdAt)}</p>
                </div>
              </a>
            `
            )
            .join('')}
        `;
      } catch {
        popularContainer.innerHTML = `<p style="font-size: 14px; color: var(--grey);">Unable to load popular articles.</p>`;
      }
    }

    async function loadAll() {
      await Promise.all([loadArticles(), loadCategories(), loadPopular()]);
    }

    loadAll();
  }
});
