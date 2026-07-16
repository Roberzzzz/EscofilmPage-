// Preloader: la página carga en tiempo real. El aro NO se muestra salvo que
// a los SHOW_AFTER_MS desde el inicio de la navegación la carga siga en curso,
// y se va apenas termina — sin mínimos ni esperas artificiales.
//
// Este bloque corre de inmediato (no en DOMContentLoaded) por dos razones:
// el div del preloader ya existe cuando el parser llega hasta acá, y el umbral
// necesita contarse desde que el usuario pidió la página, no desde este script.
(() => {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const SHOW_AFTER_MS = 400;  // por debajo de esto no se ve absolutamente nada
    const MAX_MS = 8000;        // red de seguridad: si algo nunca carga, igual se va
    let shown = false;
    let done = false;

    function show() {
        if (done || shown) return;
        shown = true;
        preloader.classList.add('is-visible');
        // El bloqueo de scroll lo pone este código, nunca el HTML: si el JS
        // no llegara a correr, la página queda usable en vez de trabada
        document.body.classList.add('is-loading');
    }

    function finish() {
        if (done) return;
        done = true;
        clearTimeout(showTimer);
        document.body.classList.remove('is-loading');

        // Si nunca llegó a verse, fuera sin ceremonia ni fundido
        if (!shown) {
            preloader.remove();
            return;
        }

        preloader.classList.remove('is-visible');
        // Fuera del DOM al terminar el fundido: si no, el overlay sigue ahí
        // capturando clics aunque no se vea
        preloader.addEventListener('transitionend', () => preloader.remove(), { once: true });
        setTimeout(() => preloader.remove(), 900); // por si transitionend no dispara
    }

    // performance.now() = ms desde que arrancó la navegación
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

// Header con fondo al hacer scroll + link activo según la sección visible
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

        // La sección activa es la última cuyo inicio ya pasó bajo el header
        const line = window.scrollY + 120;
        let active = targets[0];
        targets.forEach(t => {
            if (t.section.offsetTop <= line) active = t;
        });

        // Al tocar fondo gana siempre la última: si no, una sección corta
        // al final nunca llegaría a marcarse
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

    // Si se agranda la ventana con el panel abierto, el body queda bloqueado
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

// Marquee de marcas — cinta infinita, sin flechas ni controles.
// El HTML solo trae el set real de logos una vez; aquí se clona hasta cubrir
// el ancho y se le dice a la animación que recorra exactamente el ancho de un
// grupo. Como el grupo siguiente es idéntico, el reinicio cae sobre el mismo
// fotograma y el bucle no se ve.
document.addEventListener('DOMContentLoaded', () => {
    const marquee = document.getElementById('brandMarquee');
    const track = document.getElementById('marqueeTrack');
    if (!marquee || !track) return;

    const original = track.querySelector('.marquee-group');
    if (!original) return;

    // Con reduced-motion la cinta no se anima: el CSS la deja deslizable a mano
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const SPEED = 55; // px/segundo — la velocidad no cambia si agregan logos
    let lastWidth = 0;

    function build() {
        const containerWidth = marquee.offsetWidth;
        if (!containerWidth) return;

        track.querySelectorAll('.marquee-group').forEach((group, i) => {
            if (i > 0) group.remove();
        });

        const groupWidth = original.getBoundingClientRect().width;
        if (!groupWidth) return;

        // Hace falta cubrir el viewport MÁS un grupo de sobra: la animación
        // desplaza un grupo entero, así que sin ese extra se abre un hueco
        // en blanco justo antes de reiniciar.
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

    // Los logos tienen tamaño fijo por CSS, pero si alguno llega tarde el
    // ancho del grupo puede cambiar
    window.addEventListener('load', build);

    let resizeTimer;
    window.addEventListener('resize', () => {
        // Reconstruir reinicia la animación: solo si el ancho cambió de verdad
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
