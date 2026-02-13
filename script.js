document.addEventListener('DOMContentLoaded', () => {
    // 0. Мобильное меню
    const toggle = document.querySelector('.nav-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('nav-open');
            toggle.setAttribute('aria-expanded', document.body.classList.contains('nav-open'));
        });
        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', () => {
                document.body.classList.remove('nav-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // 1. Появление элементов при скролле
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.js-fade-in, .js-slide-up, .js-card-anim').forEach(el => observer.observe(el));

    // 2. Анимация Hero Title
    const title = document.querySelector('.js-title-animate');
    if(title) {
        setTimeout(() => {
            title.style.opacity = '1';
            title.style.transform = 'translateY(0)';
            title.style.transition = '1s cubic-bezier(0.22, 1, 0.36, 1)';
        }, 300);
    }

    // 3. Плавная прокрутка
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // 4. Переключение вкладок каталога (главная и страница каталога)
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
});
