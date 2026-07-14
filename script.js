// Header con fondo al hacer scroll
document.addEventListener("DOMContentLoaded", function() {
    const header = document.querySelector(".main-header");

    window.addEventListener("scroll", function() {
        header.classList.toggle("scrolled", window.scrollY > 30);
    });
});

// Timecode del hero (HH:MM:SS)
document.addEventListener('DOMContentLoaded', () => {
    const tc = document.getElementById('timecode');
    if (!tc) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return; // se queda en 00:00:00, quieto

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

// Carrusel de marcas 
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.carousel-wrapper');
    const track = document.getElementById('linksTrack');
    const prevBtn = document.querySelector('.link-carousel .prev');
    const nextBtn = document.querySelector('.link-carousel .next');
    const dotsContainer = document.querySelector('.carousel-dots');
    const carousel = document.querySelector('.link-carousel');

    if (!track) return;

    const logos = Array.from(track.querySelectorAll('img')).map(img => ({
        src: img.getAttribute('src'),
        title: img.getAttribute('title') || ''
    }));

    const VISIBLE = 4;
    const AUTOPLAY_DELAY = 3200; // ms entre cada avance automático
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let currentIndex = 0;
    let isAnimating = false;
    let itemWidth = 0;
    let autoplayTimer = null;

    function createImg(logo) {
        const img = document.createElement('img');
        img.src = logo.src;
        img.title = logo.title;
        img.alt = logo.title;
        img.classList.add('social-link');
        return img;
    }

    function getLogoAt(i) {
        return logos[((i % logos.length) + logos.length) % logos.length];
    }

    function measure() {
        const style = getComputedStyle(track);
        const gap = parseFloat(style.columnGap || style.gap) || 0;
        const firstItem = track.querySelector('.social-link');
        const w = firstItem ? firstItem.getBoundingClientRect().width : 125;
        itemWidth = w + gap;
        wrapper.style.width = (itemWidth * VISIBLE - gap) + 'px';
    }

    function renderStatic() {
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';
        track.innerHTML = '';
        for (let i = 0; i < VISIBLE; i++) {
            track.appendChild(createImg(getLogoAt(currentIndex + i)));
        }
        measure();
        renderDots();
    }

    function renderDots() {
        dotsContainer.innerHTML = '';
        logos.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (i === currentIndex) dot.classList.add('active');
            dot.addEventListener('click', () => {
                if (isAnimating || i === currentIndex) return;
                currentIndex = i;
                renderStatic();
                restartAutoplay();
            });
            dotsContainer.appendChild(dot);
        });
    }

    function lockDuring(fn) {
        if (isAnimating) return;
        isAnimating = true;
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        fn(() => {
            isAnimating = false;
            prevBtn.disabled = false;
            nextBtn.disabled = false;
        });
    }

    function goNext() {
        lockDuring((unlock) => {
            track.style.transition = 'none';
            track.innerHTML = '';
            for (let i = 0; i < VISIBLE + 1; i++) {
                track.appendChild(createImg(getLogoAt(currentIndex + i)));
            }
            measure();
            track.style.transform = 'translateX(0)';

            void track.offsetWidth;

            track.style.transition = 'transform 0.4s ease';
            track.style.transform = `translateX(-${itemWidth}px)`;

            const onEnd = () => {
                track.removeEventListener('transitionend', onEnd);
                currentIndex = (currentIndex + 1) % logos.length;
                renderStatic();
                unlock();
            };
            track.addEventListener('transitionend', onEnd);
        });
    }

    function goPrev() {
        lockDuring((unlock) => {
            track.style.transition = 'none';
            track.innerHTML = '';
            track.appendChild(createImg(getLogoAt(currentIndex - 1)));
            for (let i = 0; i < VISIBLE; i++) {
                track.appendChild(createImg(getLogoAt(currentIndex + i)));
            }
            measure();
            track.style.transform = `translateX(-${itemWidth}px)`;

            void track.offsetWidth;

            track.style.transition = 'transform 0.4s ease';
            track.style.transform = 'translateX(0)';

            const onEnd = () => {
                track.removeEventListener('transitionend', onEnd);
                currentIndex = (currentIndex - 1 + logos.length) % logos.length;
                renderStatic();
                unlock();
            };
            track.addEventListener('transitionend', onEnd);
        });
    }

    // ---- Autoplay ----
    function startAutoplay() {
        if (prefersReducedMotion || logos.length <= VISIBLE) return;
        stopAutoplay();
        autoplayTimer = setInterval(() => {
            if (!isAnimating) goNext();
        }, AUTOPLAY_DELAY);
    }

    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function restartAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    prevBtn.addEventListener('click', () => { goPrev(); restartAutoplay(); });
    nextBtn.addEventListener('click', () => { goNext(); restartAutoplay(); });

    // Pausar al pasar el mouse o al enfocar con teclado, reanudar al salir
    if (carousel) {
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);
        carousel.addEventListener('focusin', stopAutoplay);
        carousel.addEventListener('focusout', startAutoplay);
    }

    // Pausar cuando la pestaña no está visible, para no acumular saltos
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAutoplay();
        else startAutoplay();
    });

    window.addEventListener('resize', () => {
        if (!isAnimating) measure();
    });

    renderStatic();
    startAutoplay();
});
