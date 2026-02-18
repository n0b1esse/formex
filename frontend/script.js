document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.lang-dropdown')) return;
        document.querySelectorAll('.lang-dropdown.is-open').forEach(d => {
            d.classList.remove('is-open');
            const t = d.querySelector('.lang-dropdown-trigger');
            if (t) t.setAttribute('aria-expanded', 'false');
        });
    });
    document.querySelectorAll('.lang-dropdown').forEach(dropdown => {
        const trigger = dropdown.querySelector('.lang-dropdown-trigger');
        const menu = dropdown.querySelector('.lang-dropdown-menu');
        const current = trigger?.getAttribute('data-current');
        if (!trigger || !menu) return;
        menu.querySelectorAll('a').forEach(link => {
            if (link.getAttribute('hreflang') === current) link.setAttribute('aria-current', 'true');
        });
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('is-open');
            trigger.setAttribute('aria-expanded', dropdown.classList.contains('is-open'));
        });
        menu.addEventListener('click', (e) => {
            if (e.target.closest('a')) dropdown.classList.remove('is-open');
        });
    });

    // Мобильное меню
    const toggle = document.querySelector('.nav-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('nav-open');
            toggle.setAttribute('aria-expanded', document.body.classList.contains('nav-open'));
            document.querySelectorAll('.lang-dropdown.is-open').forEach(d => d.classList.remove('is-open'));
        });
        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', () => {
                document.body.classList.remove('nav-open');
                toggle.setAttribute('aria-expanded', 'false');
                document.querySelectorAll('.lang-dropdown.is-open').forEach(d => d.classList.remove('is-open'));
            });
        });
    }

    // Появление элементов при скролле
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.js-fade-in, .js-slide-up, .js-card-anim').forEach(el => observer.observe(el));

    // Hero title анимация
    const title = document.querySelector('.js-title-animate');
    if (title) {
        title.style.transition = '1s cubic-bezier(0.22, 1, 0.36, 1)';
        requestAnimationFrame(() => {
            title.style.opacity = '1';
            title.style.transform = 'translateY(0)';
        });
    }

    // Плавная прокрутка по якорям
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Вкладки каталога
    const catalogTabs = document.querySelectorAll('.catalog-tab');
    const catalogCategories = document.querySelectorAll('.catalog-category');
    if (catalogTabs.length && catalogCategories.length) {
        catalogTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const categoryId = tab.getAttribute('data-category');
                catalogTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-category') === categoryId));
                catalogCategories.forEach(cat => {
                    const isActive = cat.getAttribute('data-category') === categoryId;
                    cat.classList.toggle('catalog-category--hidden', !isActive);
                    if (isActive) {
                        cat.querySelectorAll('.js-card-anim').forEach(card => card.classList.add('visible'));
                    }
                });
            });
        });
    }

    // Карусель отзывов
    const reviewsCarousel = document.querySelector('.reviews-carousel');
    if (reviewsCarousel) {
        const track = reviewsCarousel.querySelector('.reviews-carousel-track');
        const cards = reviewsCarousel.querySelectorAll('.review-card');
        const dotsContainer = reviewsCarousel.querySelector('.reviews-carousel-dots');
        const btnPrev = reviewsCarousel.querySelector('.reviews-carousel-btn--prev');
        const btnNext = reviewsCarousel.querySelector('.reviews-carousel-btn--next');
        const total = cards.length;
        let index = 0;

        const gap = 28;

        function getMaxIndex() {
            const wrap = reviewsCarousel.querySelector('.reviews-carousel-track-wrap');
            const card = cards[0];
            if (!wrap || !card) return total - 1;
            const wrapW = wrap.offsetWidth;
            const cardW = card.offsetWidth;
            const visible = Math.max(1, Math.floor((wrapW + gap) / (cardW + gap)));
            return Math.max(0, total - visible);
        }

        function updateCarousel() {
            const maxIdx = getMaxIndex();
            index = Math.min(index, maxIdx);
            const cardW = cards[0] ? cards[0].offsetWidth : 0;
            const stepPx = index * (cardW + gap);
            track.style.transform = `translateX(-${stepPx}px)`;
            dotsContainer.querySelectorAll('button').forEach((dot, i) => {
                dot.classList.toggle('is-active', i === index);
                dot.setAttribute('aria-current', i === index ? 'true' : 'false');
            });
            btnPrev.style.visibility = index === 0 ? 'hidden' : '';
            btnNext.style.visibility = index >= maxIdx ? 'hidden' : '';
        }

        cards.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('aria-label', `Отзыв ${i + 1}`);
            dot.setAttribute('aria-current', i === 0 ? 'true' : 'false');
            dot.addEventListener('click', () => { index = i; updateCarousel(); });
            dotsContainer.appendChild(dot);
        });

        btnPrev.addEventListener('click', () => { index = Math.max(0, index - 1); updateCarousel(); });
        btnNext.addEventListener('click', () => { index = Math.min(getMaxIndex(), index + 1); updateCarousel(); });

        window.addEventListener('resize', () => updateCarousel());
        updateCarousel();
    }
});
