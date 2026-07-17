// Preloader: 
(() => {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const SHOW_AFTER_MS = 400;  
    const MAX_MS = 8000;        
    let shown = false;
    let done = false;

    function show() {
        if (done || shown) return;
        shown = true;
        preloader.classList.add('is-visible');
        document.body.classList.add('is-loading');
    }

    function finish() {
        if (done) return;
        done = true;
        clearTimeout(showTimer);
        document.body.classList.remove('is-loading');

        if (!shown) {
            preloader.remove();
            return;
        }

        preloader.classList.remove('is-visible');

        preloader.addEventListener('transitionend', () => preloader.remove(), { once: true });
        setTimeout(() => preloader.remove(), 900); 
    }


    const showTimer = setTimeout(show, Math.max(0, SHOW_AFTER_MS - performance.now()));

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish);

    setTimeout(finish, MAX_MS);
})();

// Timecode del hero (HH:MM:SS)
document.addEventListener('DOMContentLoaded', () => {
    const tc = document.getElementById('timecode');
    if (!tc) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return; 

    const start = Date.now();

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function tick() {
        const totalSeconds = Math.floor((Date.now() - start) / 1000);
        const seconds = totalSeconds % 60;
        const totalMinutes = Math.floor(totalSeconds / 60);
        const minutes = totalMinutes % 60;
        const hours = Math.floor(totalMinutes / 60);
        tc.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    tick();
    setInterval(tick, 1000);
});

// Header con fondo al hacer scroll 
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.main-header');
    const links = Array.from(document.querySelectorAll('.main-nav ul a[href^="#"]'));

    const targets = links
        .map(link => {
            const section = document.querySelector(link.getAttribute('href'));
            return section ? { link, section } : null;
        })
        .filter(Boolean);

    let ticking = false;

    function update() {
        ticking = false;

        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 30);
        }

        if (!targets.length) return;

        const line = window.scrollY + 120;
        let active = targets[0];
        targets.forEach(t => {
            if (t.section.offsetTop <= line) active = t;
        });

        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
            active = targets[targets.length - 1];
        }

        links.forEach(l => l.classList.toggle('active', l === active.link));
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
        }
    }, { passive: true });

    update();
});

// Menú móvil
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('mainNav');
    if (!toggle || !nav) return;

    function setOpen(open) {
        nav.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        document.body.classList.toggle('nav-open', open);
    }

    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));

    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') setOpen(false);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) setOpen(false);
    });
});

// Reveal escalonado al hacer scroll (servicios y portafolio)
document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = document.querySelectorAll('.service-card, .reel-card');
    if (!items.length) return;

    if (prefersReducedMotion) {
        items.forEach(el => el.classList.add('in-view'));
        return;
    }

    items.forEach((el, i) => {
        el.style.setProperty('--delay', `${(i % 6) * 80}ms`);
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    items.forEach(el => observer.observe(el));
});

document.addEventListener('DOMContentLoaded', () => {
    const marquee = document.getElementById('brandMarquee');
    const track = document.getElementById('marqueeTrack');
    if (!marquee || !track) return;

    const original = track.querySelector('.marquee-group');
    if (!original) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const SPEED = 55; 
    let lastWidth = 0;

    function build() {
        const containerWidth = marquee.offsetWidth;
        if (!containerWidth) return;

        track.querySelectorAll('.marquee-group').forEach((group, i) => {
            if (i > 0) group.remove();
        });

        const groupWidth = original.getBoundingClientRect().width;
        if (!groupWidth) return;

        const copies = Math.ceil(containerWidth / groupWidth) + 1;
        for (let i = 0; i < copies; i++) {
            const clone = original.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true'); // duplicados decorativos
            track.appendChild(clone);
        }

        track.style.setProperty('--marquee-distance', `-${groupWidth}px`);
        track.style.setProperty('--marquee-duration', `${groupWidth / SPEED}s`);
        lastWidth = containerWidth;
    }

    build();

    window.addEventListener('load', build);

    let resizeTimer;
    window.addEventListener('resize', () => {

        if (marquee.offsetWidth === lastWidth) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 150);
    });
});

// Año del footer
document.addEventListener('DOMContentLoaded', () => {
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
});

// Conteo ascendente (Nosotros)
document.addEventListener('DOMContentLoaded', () => {
    const stats = document.querySelectorAll('.stat-num[data-count-to]');
    if (!stats.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function render(el, value) {
        const prefix = el.dataset.prefix || '';
        const pad = parseInt(el.dataset.pad, 10) || 0;
        const digits = pad ? String(value).padStart(pad, '0') : String(value);
        el.textContent = prefix + digits;
    }

    function animate(el) {
        const target = parseInt(el.dataset.countTo, 10);
        if (Number.isNaN(target)) return;

        if (prefersReducedMotion) {
            render(el, target);
            return;
        }

        const duration = 1300;
        const start = performance.now();

        function step(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - (1 - progress) * (1 - progress);
            render(el, Math.round(eased * target));

            if (progress < 1) requestAnimationFrame(step);
            else render(el, target);
        }

        requestAnimationFrame(step);
    }

    stats.forEach(el => render(el, 0));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animate(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(el => observer.observe(el));
});
