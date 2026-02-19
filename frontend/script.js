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
        document.querySelectorAll('.header-call-icon').forEach(icon => {
            icon.addEventListener('click', () => {
                document.body.classList.remove('nav-open');
                toggle.setAttribute('aria-expanded', 'false');
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

    // Вкладки каталога (старый вариант с .catalog-tab и .catalog-category)
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

    // Фильтры каталога категорий (карточки продукции)
    const catalogFilterBtns = document.querySelectorAll('.catalog-filter');
    const catalogCategoryCards = document.querySelectorAll('.catalog-category-card');
    if (catalogFilterBtns.length && catalogCategoryCards.length) {
        catalogFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                catalogFilterBtns.forEach(b => {
                    b.classList.toggle('active', b === btn);
                    b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
                });
                catalogCategoryCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    const show = filter === 'all' || category === filter;
                    card.classList.toggle('catalog-category-card--hidden', !show);
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

        const gap = 20;

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

    // Карусель сертификатов (каталог)
    const certCarousel = document.querySelector('.certificates-carousel');
    if (certCarousel) {
        const certTrack = certCarousel.querySelector('.certificates-carousel-track');
        const certCards = certCarousel.querySelectorAll('.certificate-card');
        const certDots = certCarousel.querySelector('.certificates-carousel-dots');
        const certPrev = certCarousel.querySelector('.certificates-carousel-btn--prev');
        const certNext = certCarousel.querySelector('.certificates-carousel-btn--next');
        const certTotal = certCards.length;
        let certIndex = 0;
        const certGap = 20;

        function getCertMaxIndex() {
            const wrap = certCarousel.querySelector('.certificates-carousel-track-wrap');
            const card = certCards[0];
            if (!wrap || !card) return certTotal - 1;
            const wrapW = wrap.offsetWidth;
            const cardW = card.offsetWidth;
            const visible = Math.max(1, Math.floor((wrapW + certGap) / (cardW + certGap)));
            return Math.max(0, certTotal - visible);
        }

        function updateCertCarousel() {
            const maxIdx = getCertMaxIndex();
            certIndex = Math.min(certIndex, maxIdx);
            const cardW = certCards[0] ? certCards[0].offsetWidth : 0;
            certTrack.style.transform = `translateX(-${certIndex * (cardW + certGap)}px)`;
            certDots.querySelectorAll('button').forEach((dot, i) => {
                dot.classList.toggle('is-active', i === certIndex);
                dot.setAttribute('aria-current', i === certIndex ? 'true' : 'false');
            });
            certPrev.style.visibility = certIndex === 0 ? 'hidden' : '';
            certNext.style.visibility = certIndex >= maxIdx ? 'hidden' : '';
        }

        certCards.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('aria-label', `Сертификат ${i + 1}`);
            dot.setAttribute('aria-current', i === 0 ? 'true' : 'false');
            dot.addEventListener('click', () => { certIndex = i; updateCertCarousel(); });
            certDots.appendChild(dot);
        });
        certPrev.addEventListener('click', () => { certIndex = Math.max(0, certIndex - 1); updateCertCarousel(); });
        certNext.addEventListener('click', () => { certIndex = Math.min(getCertMaxIndex(), certIndex + 1); updateCertCarousel(); });
        window.addEventListener('resize', () => updateCertCarousel());
        updateCertCarousel();
    }

    // Панель карточки проекта — раскрывается от карточки на 46% экрана
    const projectsGrid = document.querySelector('.projects-grid');
    const projectDetailPanel = document.getElementById('projectDetailPanel');
    const projectDetailOverlay = document.getElementById('projectDetailOverlay');
    if (projectsGrid && projectDetailPanel && projectDetailOverlay) {
        const galleryTrack = projectDetailPanel.querySelector('.project-detail-gallery-track');
        const galleryPrev = projectDetailPanel.querySelector('.project-detail-prev');
        const galleryNext = projectDetailPanel.querySelector('.project-detail-next');
        const galleryDots = projectDetailPanel.querySelector('.project-detail-dots');
        const panelTitle = projectDetailPanel.querySelector('.project-detail-title');
        const panelDesc = projectDetailPanel.querySelector('.project-detail-desc');
        const panelClose = projectDetailPanel.querySelector('.project-detail-close');
        const expandDuration = 400;
        let openCardRect = null;
        let galleryIndex = 0;
        let galleryImages = [];

        function setGallerySlide(index) {
            if (galleryImages.length === 0) return;
            galleryIndex = (index + galleryImages.length) % galleryImages.length;
            if (galleryTrack) galleryTrack.style.transform = `translateX(-${galleryIndex * 100}%)`;
            galleryDots.querySelectorAll('.project-detail-dot').forEach((dot, i) => dot.classList.toggle('is-active', i === galleryIndex));
        }

        function openProjectDetail(card) {
            const img = card.querySelector('img');
            const overlay = card.querySelector('.project-overlay');
            const h4 = overlay && overlay.querySelector('h4');
            const p = overlay && overlay.querySelector('p');
            if (!img || !h4 || !p) return;

            const dataImages = card.getAttribute('data-images');
            galleryImages = dataImages ? dataImages.split(',').map(s => s.trim()).filter(Boolean) : [img.src];
            if (galleryImages.length === 0) galleryImages = [img.src];
            if (galleryImages.length === 1) galleryImages = [img.src, img.src];

            const alt = img.alt || h4.textContent;
            galleryTrack.innerHTML = '';
            galleryImages.forEach((src) => {
                const slide = document.createElement('div');
                slide.className = 'project-detail-slide';
                const slideImg = document.createElement('img');
                slideImg.src = src;
                slideImg.alt = alt;
                slide.appendChild(slideImg);
                galleryTrack.appendChild(slide);
            });
            galleryDots.innerHTML = '';
            if (galleryImages.length > 1) {
                galleryImages.forEach((_, i) => {
                    const dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = 'project-detail-dot' + (i === 0 ? ' is-active' : '');
                    dot.setAttribute('aria-label', `Фото ${i + 1}`);
                    dot.addEventListener('click', () => setGallerySlide(i));
                    galleryDots.appendChild(dot);
                });
                if (galleryPrev) { galleryPrev.style.display = 'flex'; galleryPrev.onclick = () => setGallerySlide(galleryIndex - 1); }
                if (galleryNext) { galleryNext.style.display = 'flex'; galleryNext.onclick = () => setGallerySlide(galleryIndex + 1); }
            } else {
                if (galleryPrev) galleryPrev.style.display = 'none';
                if (galleryNext) galleryNext.style.display = 'none';
            }
            galleryIndex = 0;
            setGallerySlide(0);

            panelTitle.textContent = h4.textContent;
            panelDesc.textContent = p.textContent;

            const rect = card.getBoundingClientRect();
            openCardRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };

            projectDetailPanel.classList.remove('is-expanded');
            projectDetailPanel.style.left = rect.left + 'px';
            projectDetailPanel.style.top = rect.top + 'px';
            projectDetailPanel.style.width = rect.width + 'px';
            projectDetailPanel.style.height = rect.height + 'px';
            projectDetailPanel.classList.add('is-open');
            projectDetailOverlay.classList.add('is-open');
            projectDetailPanel.setAttribute('aria-hidden', 'false');
            projectDetailOverlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const size = Math.min(65 * window.innerWidth / 100, 65 * window.innerHeight / 100, 820);
                    projectDetailPanel.style.left = (window.innerWidth - size) / 2 + 'px';
                    projectDetailPanel.style.top = (window.innerHeight - size) / 2 + 'px';
                    projectDetailPanel.style.width = size + 'px';
                    projectDetailPanel.style.height = size + 'px';
                    projectDetailPanel.classList.add('is-expanded');
                });
            });
        }

        function closeProjectDetail() {
            if (!openCardRect) {
                projectDetailPanel.classList.remove('is-open', 'is-expanded');
                projectDetailOverlay.classList.remove('is-open');
                projectDetailPanel.setAttribute('aria-hidden', 'true');
                projectDetailOverlay.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
                return;
            }
            projectDetailPanel.classList.remove('is-expanded');
            projectDetailPanel.style.left = openCardRect.left + 'px';
            projectDetailPanel.style.top = openCardRect.top + 'px';
            projectDetailPanel.style.width = openCardRect.width + 'px';
            projectDetailPanel.style.height = openCardRect.height + 'px';
            setTimeout(() => {
                projectDetailPanel.classList.remove('is-open');
                projectDetailOverlay.classList.remove('is-open');
                projectDetailPanel.setAttribute('aria-hidden', 'true');
                projectDetailOverlay.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
                projectDetailPanel.style.left = '';
                projectDetailPanel.style.top = '';
                projectDetailPanel.style.width = '';
                projectDetailPanel.style.height = '';
                openCardRect = null;
            }, expandDuration);
        }

        projectsGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.project-item');
            if (card) {
                e.preventDefault();
                openProjectDetail(card);
            }
        });

        projectDetailOverlay.addEventListener('click', closeProjectDetail);
        if (panelClose) panelClose.addEventListener('click', closeProjectDetail);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && projectDetailPanel.classList.contains('is-open')) closeProjectDetail();
        });
        let galleryTouchStartX = 0;
        if (galleryTrack) {
            galleryTrack.addEventListener('touchstart', (e) => { galleryTouchStartX = e.touches[0].clientX; }, { passive: true });
            galleryTrack.addEventListener('touchend', (e) => {
                if (!projectDetailPanel.classList.contains('is-open') || galleryImages.length <= 1) return;
                const dx = e.changedTouches[0].clientX - galleryTouchStartX;
                if (Math.abs(dx) > 50) setGallerySlide(galleryIndex + (dx > 0 ? -1 : 1));
            }, { passive: true });
        }
    }
});
