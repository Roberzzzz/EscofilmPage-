document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // 1. CONTROL DE DESPLAZAMIENTO DEL MENÚ CRISTALINO (NAVBAR)
    // ========================================================
    const cyberNav = document.querySelector('.cyber-nav');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            cyberNav.classList.add('scrolled');
        } else {
            cyberNav.classList.remove('scrolled');
        }
    });

    // ========================================================
    // 2. LOGICA APERTURA Y CIERRE DEL MENÚ MÓVIL
    // ========================================================
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinksContainer = document.querySelector('.nav-links');

    hamburgerBtn.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active');
        
        // Animación de las líneas del botón hamburguesa
        const lines = hamburgerBtn.querySelectorAll('.line');
        hamburgerBtn.classList.toggle('open');
        
        if (hamburgerBtn.classList.contains('open')) {
            lines[0].style.transform = 'translateY(7px) rotate(45deg)';
            lines[1].style.opacity = '0';
            lines[2].style.transform = 'translateY(-7px) rotate(-45deg)';
        } else {
            lines[0].style.transform = 'none';
            lines[1].style.opacity = '1';
            lines[2].style.transform = 'none';
        }
    });

    // ========================================================
    // 3. REPRODUCCIÓN INTERACTIVA AUTOMÁTICA EN VIDEOS DE PORTAFOLIO
    // Escucha eventos hover para inicializar o pausar nativamente
    // ========================================================
    const teaserCards = document.querySelectorAll('.teaser-card');

    teaserCards.forEach(card => {
        const nativeVideo = card.querySelector('.teaser-native-video');

        card.addEventListener('mouseenter', () => {
            // Se ejecuta la promesa nativa para evitar bloqueos del navegador
            const playPromise = nativeVideo.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Intercepción de reproducción fluida protegida por navegador:", error);
                });
            }
        });

        card.addEventListener('mouseleave', () => {
            nativeVideo.pause();
        });
    });

});