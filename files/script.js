// pone fondo al header cuando haces scroll
document.addEventListener("DOMContentLoaded", function() {
    const header = document.querySelector(".main-header");

    window.addEventListener("scroll", function() {
        header.classList.toggle("scrolled", window.scrollY > 30);
    });
});

// timecode del hero, va sumando segundos como si estuviera grabando xd
document.addEventListener('DOMContentLoaded', () => {
    const tc = document.getElementById('timecode');
    if (!tc) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return; // se queda quieto en 00:00:00

    const start = Date.now();

    // agrega el 0 de relleno (1 -> 01)
    function pad(n) {
        return String(n).padStart(2, '0');
    }

    // calcula horas/min/seg desde que cargó la página y actualiza el texto
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

// hace que las cards de servicios y portafolio aparezcan poco a poco al hacer scroll
document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = document.querySelectorAll('.service-card, .reel-card');
    if (!items.length) return;

    if (prefersReducedMotion) {
        items.forEach(el => el.classList.add('in-view'));
        return;
    }

    // delay escalonado para que no aparezcan todas al mismo tiempo
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

// carrusel de logos/marcas
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.carousel-wrapper');
    const track = document.getElementById('linksTrack');
    const prevBtn = document.querySelector('.link-carousel .prev');
    const nextBtn = document.querySelector('.link-carousel .next');
    const dotsContainer = document.querySelector('.carousel-dots');

    if (!track) return;

    const logos = Array.from(track.querySelectorAll('img')).map(img => ({
        src: img.getAttribute('src'),
        title: img.getAttribute('title') || ''
    }));

    const VISIBLE = 4;
    let currentIndex = 0;
    let isAnimating = false;
    let itemWidth = 0;

    // crea un <img> de logo con sus atributos
    function createImg(logo) {
        const img = document.createElement('img');
        img.src = logo.src;
        img.title = logo.title;
        img.alt = logo.title;
        img.classList.add('social-link');
        return img;
    }

    // saca el logo que corresponde en el índice i (con wrap-around, por eso el modulo)
    function getLogoAt(i) {
        return logos[((i % logos.length) + logos.length) % logos.length];
    }

    // mide el ancho de un logo + el gap, para saber cuanto mover el track
    function measure() {
        const style = getComputedStyle(track);
        const gap = parseFloat(style.columnGap || style.gap) || 0;
        const firstItem = track.querySelector('.social-link');
        const w = firstItem ? firstItem.getBoundingClientRect().width : 125;
        itemWidth = w + gap;
        wrapper.style.width = (itemWidth * VISIBLE - gap) + 'px';
    }

    // pinta los logos visibles actuales sin animación (estado "de reposo")
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

    // dibuja los puntitos de abajo del carrusel
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
            });
            dotsContainer.appendChild(dot);
        });
    }

    // bloquea los botones mientras corre la animación, para que no se rompa el conteo
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

    // avanza un logo hacia adelante con transición
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

    // retrocede un logo hacia atrás con transición
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

    prevBtn.addEventListener('click', goPrev);
    nextBtn.addEventListener('click', goNext);

    window.addEventListener('resize', () => {
        if (!isAnimating) measure();
    });

    renderStatic();
});
