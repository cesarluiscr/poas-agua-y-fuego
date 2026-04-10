// v3 // ⬇️ Reemplazá TU_URL_AQUI con la URL de tu Google Apps Script desplegado
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/TU_URL_AQUI/exec';

// Valida que la URL esté configurada antes de usarla
function isAppsScriptConfigured() {
    return APPS_SCRIPT_URL && !APPS_SCRIPT_URL.includes('TU_URL_AQUI');
}

// ── Hamburger / Mobile Nav ──────────────────────────────────────────
const hamburger  = document.querySelector('.hamburger');
const mobileNav  = document.getElementById('mobileNav');

function closeMobileNav() {
    if (!hamburger || !mobileNav) return;
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
}

if (hamburger && mobileNav) {
    // Abrir al presionar hamburger
    hamburger.addEventListener('click', () => {
        const isOpen = hamburger.classList.toggle('open');
        mobileNav.classList.toggle('open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Cerrar al tocar el backdrop (fuera del panel)
    mobileNav.addEventListener('click', (e) => {
        if (!e.target.closest('#mobileNavPanel')) closeMobileNav();
    });

    // Cerrar con el botón X del panel
    const closeBtn = document.getElementById('mobileNavClose');
    if (closeBtn) closeBtn.addEventListener('click', closeMobileNav);

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMobileNav();
    });

    // Marcar el enlace activo según la página actual
    (function markActiveNavLink() {
        const currentPage = location.pathname.split('/').pop() || 'index.html';
        const linksContainer = document.querySelector('.mobile-nav-links');
        if (!linksContainer) return;
        linksContainer.querySelectorAll('a[href]').forEach(link => {
            const linkPage = (link.getAttribute('href') || '').split('#')[0];
            if (linkPage && linkPage === currentPage) {
                link.classList.add('nav-active');
            }
        });
    })();
}

document.addEventListener('DOMContentLoaded', () => {
    // ── Navbar sticky scroll effect ─────────────────────────────────────
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const onScroll = () => {
            if (window.scrollY > 30) {
                navbar.classList.add('nav-scrolled');
            } else {
                navbar.classList.remove('nav-scrolled');
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // aplicar estado inicial sin esperar el primer scroll
    }

    // ── Smooth Scroll con offset por navbar fijo ────────────────────────
    /**
     * Devuelve la altura actual del navbar (o 0 si no existe).
     * Se recalcula en cada llamada para manejar el cambio de tamaño
     * entre estado normal y nav-scrolled.
     */
    function getNavOffset() {
        const nav = document.querySelector('.navbar');
        return nav ? nav.getBoundingClientRect().height + 8 : 8;
    }

    /**
     * Desplaza suavemente hasta el elemento indicado,
     * compensando la altura del navbar fijo.
     * Respeta prefers-reduced-motion del usuario.
     */
    function smoothScrollTo(target) {
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.scrollY - getNavOffset();
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: Math.max(0, top), behavior: prefersReduced ? 'auto' : 'smooth' });
    }

    // Interceptar TODOS los <a href="#..."> de la página
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href]');
        if (!anchor) return;

        const href = anchor.getAttribute('href') || '';

        // Solo enlaces ancla de la misma página: "#id" o "paginaActual.html#id"
        let hash = '';
        if (href.startsWith('#')) {
            hash = href.slice(1);
        } else {
            // "archivo.html#seccion" → solo si apunta a la página actual
            const [filePart, hashPart] = href.split('#');
            if (hashPart) {
                const currentFile = location.pathname.split('/').pop() || 'index.html';
                if (!filePart || filePart === currentFile) {
                    hash = hashPart;
                }
            }
        }

        if (!hash) return; // deja que el browser maneje los demás links

        const target = document.getElementById(hash);
        if (!target) return; // ID no existe en esta página

        e.preventDefault();
        smoothScrollTo(target);

        // Actualizar la URL sin recargar la página
        history.pushState(null, '', '#' + hash);

        // Cerrar menú móvil si está abierto
        closeMobileNav();
    });

    // Scroll suave al cargar la página si la URL tiene un #hash
    if (location.hash) {
        const target = document.getElementById(location.hash.slice(1));
        if (target) {
            // Pequeño delay para que el layout esté completamente renderizado
            setTimeout(() => smoothScrollTo(target), 120);
        }
    }

    // ── Parallax Engine ─────────────────────────────────────────────────
    /**
     * Efecto parallax sutil para secciones con fondos de imagen/gradiente.
     * Usa requestAnimationFrame para 60fps sin jank.
     * Se desactiva automáticamente si prefers-reduced-motion está activo
     * o si el ancho de pantalla es < 768px (rendimiento móvil).
     *
     * Capas configuradas:
     *  • Hero Fuego   — pseudo-elemento ::before vía CSS custom property
     *  • Hero Agua    — pseudo-elemento ::before vía CSS custom property
     *  • Historia banner bg
     *  • Seguridad banner bg
     */
    (function initParallax() {
        // No ejecutar si el usuario prefiere movimiento reducido
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const LAYERS = [
            // { selector, speed, prop }
            // prop = 'var' → actualiza --parallax-y en el elemento padre (para ::before)
            // prop = 'transform' → aplica transform directamente al elemento
            { selector: '.hero-fire',         speed: 0.18, prop: 'var' },
            { selector: '.hero-water',        speed: 0.14, prop: 'var' },   // velocidad distinta → efecto divergente
            { selector: '.historia-banner-bg',speed: 0.22, prop: 'transform' },
            { selector: '.seguridad-banner-bg',speed: 0.20, prop: 'transform' },
        ];

        // Precalcular referencias al DOM
        const layers = LAYERS.map(cfg => ({
            el: document.querySelector(cfg.selector),
            speed: cfg.speed,
            prop: cfg.prop,
        })).filter(l => l.el !== null);

        if (!layers.length) return;

        let rafId = null;
        let lastScroll = -1;

        function tick() {
            rafId = null;
            const scrollY = window.scrollY;
            if (scrollY === lastScroll) return; // sin cambios, no hacer nada
            lastScroll = scrollY;

            // Desactivar en pantallas pequeñas (evitar jank en móvil)
            if (window.innerWidth < 768) return;

            layers.forEach(({ el, speed, prop }) => {
                const rect = el.getBoundingClientRect();
                // Desplazamiento relativo al centro de la sección
                const sectionMid  = rect.top + rect.height / 2;
                const viewportMid = window.innerHeight / 2;
                const offset = (sectionMid - viewportMid) * speed;
                const px = `${offset.toFixed(2)}px`;

                if (prop === 'var') {
                    // Pseudo-elemento ::before hereda la custom property del padre
                    el.style.setProperty('--parallax-y', px);
                } else {
                    el.style.transform = `translateY(${px})`;
                }
            });
        }

        function onScroll() {
            if (!rafId) rafId = requestAnimationFrame(tick);
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        tick(); // estado inicial
    })();

    // Registration form logic
    const registerForm = document.getElementById('registerForm');
    const registerSuccess = document.getElementById('registerSuccess');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Inscribiendo...';
            submitBtn.disabled = true;

            try {
                if (!isAppsScriptConfigured()) {
                    throw new Error('Google Apps Script no configurado. Contactá al administrador.');
                }

                // mode: 'no-cors' es necesario con Google Apps Script (limitación de la plataforma).
                // No podemos leer la respuesta, pero el envío llega si la URL es correcta.
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(data)
                });

                registerForm.reset();
                registerSuccess.classList.remove('hidden');
                setTimeout(() => registerSuccess.classList.add('hidden'), 6000);

            } catch (err) {
                console.error('Error al enviar inscripción:', err);
                alert(err.message || 'Hubo un problema al inscribirte. Por favor intenta de nuevo.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }


    // Lightbox Logic
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (lightbox && lightboxImg && galleryItems.length > 0) {
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                const caption = item.getAttribute('data-caption');
                
                lightboxImg.src = img.src;
                lightboxCaption.textContent = caption;
                lightbox.style.display = 'flex';
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            });
        });

        const closeLightbox = () => {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
        };

        lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.style.display === 'flex') {
                closeLightbox();
            }
        });
    }

    // =============================
    // Directorio de Negocios
    // =============================
    const DEFAULT_NEGOCIOS = [
        {
            id: 1,
            nombre: "MonteLuna",
            categoria: "hospedaje",
            emoji: "🏔️",
            descripcion: "Cabañas tipo A-frame en medio de la naturaleza, con vistas espectaculares al volcán Poás. Disfruta de una experiencia única rodeada de bosque y tranquilidad en Poásito, Alajuela.",
            descripcion_en: "A-frame cabins nestled in nature, with spectacular views of Poás Volcano. Enjoy a unique experience surrounded by forest and tranquility in Poásito, Alajuela.",
            whatsapp: "50664859189",
            correo: "",
            facebook: "https://www.facebook.com/share/18Py73sqeq/",
            instagram: "https://www.instagram.com/monte_lunacr?igsh=bXc3dDd4eTYzNGs3",
            tiktok: "https://www.tiktok.com/@monte_lunacr?_r=1&_t=ZS-94uvcxmxtxc",
            booking: "https://www.booking.com/Share-oHLrJI1",
            waze: "https://ul.waze.com/ul?ll=10.15711832%2C-84.19317842&navigate=yes&zoom=17&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location",
            direccion: "Poásito, Alajuela",
            logo: "img/monteluna_logo.jpg",
            imagenes: ["img/monteluna_aerea.jpg", "img/monteluna_cabana.jpg", "img/monteluna_interior.jpg"]
        },
        {
            id: 3,
            nombre: "Tech Center CR",
            categoria: "tecnologia",
            emoji: "💻",
            descripcion: "Soluciones tecnológicas para el cantón de Poás. Soporte técnico, desarrollo web, redes y servicios informáticos. Atención personalizada por César Luis Quesada Herrera.",
            descripcion_en: "Technology solutions for the Poás canton. Technical support, web development, networking and IT services. Personalized service by César Luis Quesada Herrera.",
            whatsapp: "50687058612",
            facebook: "https://www.facebook.com/techcentercr/",
            waze: "https://ul.waze.com/ul?ll=10.09587101%2C-84.24263835&navigate=yes&zoom=17&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location",
            sitio: "techcenter.html",
            direccion: "Cantón de Poás, Alajuela",
            logo: "img/techcenter_logo_0.png",
            bannerLogo: true
        },
        {
            id: 4,
            nombre: "Macrobiótica Presagio",
            categoria: "salud",
            emoji: "🌿",
            descripcion: "Tienda de productos naturales y macrobióticos en San Pedro de Poás. Semillas de moringa, moringa en polvo, cápsulas y más productos para tu salud y bienestar natural.",
            descripcion_en: "Natural and macrobiotic products store in San Pedro de Poás. Moringa seeds, moringa powder, capsules and more products for your health and natural wellbeing.",
            whatsapp: "50660793616",
            telefono: "24480219",
            correo: "presagioproductosnaturales@hotmail.com",
            facebook: "https://www.facebook.com/presagioproductosnaturales/?locale=es_LA",
            waze: "https://www.waze.com/es-419/live-map/directions/cr/provincia-de-alajuela/san-pedro-de-poas/macrobiotica-presagio?to=place.ChIJN2NI6rT3oI8RWThTt_0rus8",
            direccion: "San Pedro de Poás, Alajuela",
            logo: "img/macrobiotica_presagio_logo.png",
            bannerAncho: true,
            imagenes: ["img/macrobiotica_presagio_banner.jpg"]
        },
        {
            id: 5,
            nombre: "Distribuidora de Productos para Limpieza",
            categoria: "servicio",
            emoji: "🧴",
            descripcion: "Distribución de productos de limpieza para su vehículo, residencia, instituciones, hoteles, fábricas y oficinas. Propietario: Luis Murillo.",
            descripcion_en: "Cleaning products distributor for vehicles, homes, institutions, hotels, factories and offices. Owner: Luis Murillo.",
            whatsapp: "50689944301",
            telefono: "24486412",
            correo: "lamva55@hotmail.com",
            direccion: "Cantón de Poás, Alajuela",
            bannerAncho: true,
            imagenes: ["img/distribuidora_limpieza_banner.jpg"]
        }
    ];

    const isEnglish = document.documentElement.lang === 'en';

    const CATEGORIA_META = {
        restaurante: { emoji: "🍽️", label: isEnglish ? "Restaurant"  : "Restaurante" },
        hospedaje:   { emoji: "🏨", label: isEnglish ? "Lodging"      : "Hospedaje" },
        tours:       { emoji: "🌋", label: isEnglish ? "Tours"        : "Tours" },
        tienda:      { emoji: "🛍️", label: isEnglish ? "Shop"         : "Tienda" },
        servicio:    { emoji: "⚙️", label: isEnglish ? "Service"      : "Servicio" },
        tecnologia:  { emoji: "💻", label: isEnglish ? "Technology"   : "Tecnología" },
        salud:       { emoji: "🌿", label: isEnglish ? "Health & Nature" : "Salud Natural" }
    };

    // Los negocios por defecto siempre vienen del código (nunca del localStorage)
    // Solo se guardan en localStorage los negocios agregados por el admin
    const defaultIds = DEFAULT_NEGOCIOS.map(n => n.id);
    const stored = JSON.parse(localStorage.getItem('poas_negocios')) || [];
    const extraNegocios = stored.filter(n => !defaultIds.includes(n.id));
    let negocios = [...DEFAULT_NEGOCIOS, ...extraNegocios];
    let activeFilter = 'all';

    const negociosGrid = document.getElementById('negociosGrid');
    const filterBtns   = document.querySelectorAll('.filter-btn');

    /* Escapa HTML para evitar XSS en datos de negocios (incluye los del localStorage) */
    function escH(str) {
        return String(str || '')
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }
    /* Valida URLs — solo permite http/https y tel: mailto: */
    function safeUrl(url) {
        if (!url) return '#';
        const u = String(url).trim();
        return /^(https?:|tel:|mailto:)/.test(u) ? u : '#';
    }

    function renderNegocios() {
        if (!negociosGrid) return;
        const filtered = activeFilter === 'all'
            ? negocios
            : negocios.filter(n => n.categoria === activeFilter);

        negociosGrid.innerHTML = '';

        if (filtered.length === 0) {
            negociosGrid.innerHTML = '<p class="no-negocios">No hay negocios en esta categoría aún. ¡Sé el primero en registrarse!</p>';
            return;
        }

        filtered.forEach(negocio => {
            const meta = CATEGORIA_META[negocio.categoria] || { emoji: "🏢", label: negocio.categoria };
            const emoji = negocio.emoji || meta.emoji;
            const card = document.createElement('div');
            const tieneGaleria = negocio.imagenes && negocio.imagenes.length > 0;
            const tieneBannerLogo = negocio.bannerLogo && negocio.logo;
            card.className = (tieneGaleria || tieneBannerLogo) ? 'negocio-card' : 'negocio-card negocio-card-simple';

            // Galería de imágenes si existe
            let galeriaHTML = '';
            if (tieneBannerLogo) {
                // Logo como banner superior con fondo oscuro
                galeriaHTML = `<div class="negocio-logo-banner">
                    <img src="${negocio.logo}" alt="Logo ${negocio.nombre}" class="negocio-logo-banner-img">
                </div>`;
            } else if (tieneGaleria) {
                if (negocio.bannerAncho) {
                    // Banner a ancho completo
                    galeriaHTML = `<div class="negocio-banner-ancho">
                        <img src="${negocio.imagenes[0]}" alt="${negocio.nombre}" loading="lazy" class="negocio-galeria-img negocio-banner-img" data-imgs='${JSON.stringify(negocio.imagenes)}' data-index="0">
                    </div>`;
                } else {
                    galeriaHTML = `<div class="negocio-galeria">
                        ${negocio.imagenes.map((img, i) => `<img src="${img}" alt="${negocio.nombre} ${i+1}" loading="lazy" class="negocio-galeria-img" data-imgs='${JSON.stringify(negocio.imagenes)}' data-index="${i}">`).join('')}
                    </div>`;
                }
            }

            // Logo o emoji en el encabezado (ocultar logo si ya se muestra como banner)
            const logoHTML = (!tieneBannerLogo && negocio.logo)
                ? `<img src="${negocio.logo}" alt="Logo ${negocio.nombre}" class="negocio-logo">`
                : `<span class="negocio-emoji">${emoji}</span>`;

            card.innerHTML = `
                ${galeriaHTML}
                <div class="negocio-card-header">
                    ${logoHTML}
                    <div>
                        <h4>${escH(negocio.nombre)}</h4>
                        <span class="negocio-badge">${escH(meta.label)}</span>
                    </div>
                </div>
                <p class="negocio-desc">${escH(isEnglish && negocio.descripcion_en ? negocio.descripcion_en : negocio.descripcion)}</p>
                <div class="negocio-meta">
                    ${negocio.direccion ? `<span>📍 ${escH(negocio.direccion)}</span>` : ''}
                    ${negocio.telefono  ? `<a href="tel:+506${escH(negocio.telefono)}">📞 ${escH(negocio.telefono.replace(/(\d{4})(\d{4})/,'$1-$2'))}</a>` : ''}
                    ${negocio.correo    ? `<a href="mailto:${escH(negocio.correo)}">✉️ ${escH(negocio.correo)}</a>` : ''}
                </div>
                ${(negocio.whatsapp || negocio.facebook || negocio.instagram || negocio.tiktok || negocio.waze || negocio.booking || negocio.sitio) ? `
                <div class="negocio-social">
                    ${negocio.sitio     ? `<a href="${safeUrl(negocio.sitio)}" ${negocio.sitio.startsWith('http') ? 'target="_blank"' : ''} rel="noopener noreferrer" class="social-btn ver-mas-btn">🌐 ${isEnglish ? 'See more' : 'Ver más'}</a>` : ''}
                    ${negocio.whatsapp  ? `<a href="https://wa.me/${escH(negocio.whatsapp)}" target="_blank" rel="noopener noreferrer" class="social-btn wa-btn">💬 WhatsApp</a>` : ''}
                    ${negocio.facebook  ? `<a href="${safeUrl(negocio.facebook)}" target="_blank" rel="noopener noreferrer" class="social-btn fb-btn">📘 Facebook</a>` : ''}
                    ${negocio.instagram ? `<a href="${safeUrl(negocio.instagram)}" target="_blank" rel="noopener noreferrer" class="social-btn ig-btn">📸 Instagram</a>` : ''}
                    ${negocio.tiktok    ? `<a href="${safeUrl(negocio.tiktok)}" target="_blank" rel="noopener noreferrer" class="social-btn tt-btn">🎵 TikTok</a>` : ''}
                    ${negocio.booking   ? `<a href="${safeUrl(negocio.booking)}" target="_blank" rel="noopener noreferrer" class="social-btn bk-btn">🏨 ${isEnglish ? 'Book on Booking' : 'Reservar en Booking'}</a>` : ''}
                    ${negocio.waze      ? `<a href="${safeUrl(negocio.waze)}" target="_blank" rel="noopener noreferrer" class="social-btn wz-btn">📍 ${isEnglish ? 'Get directions' : 'Cómo llegar'}</a>` : ''}
                </div>` : ''}
            `;
            negociosGrid.appendChild(card);
        });
    }

    // Lightbox para galería de negocios
    function createLightbox() {
        if (document.getElementById('negocio-lightbox')) return;
        const lb = document.createElement('div');
        lb.id = 'negocio-lightbox';
        lb.innerHTML = `
            <div class="nlb-overlay"></div>
            <button class="nlb-close">✕</button>
            <button class="nlb-prev">&#8249;</button>
            <button class="nlb-next">&#8250;</button>
            <img class="nlb-img" src="" alt="">
            <div class="nlb-counter"></div>
        `;
        document.body.appendChild(lb);

        let imgs = [], current = 0;

        function show(index) {
            current = (index + imgs.length) % imgs.length;
            lb.querySelector('.nlb-img').src = imgs[current];
            lb.querySelector('.nlb-counter').textContent = `${current + 1} / ${imgs.length}`;
        }

        lb.querySelector('.nlb-close').addEventListener('click', () => lb.classList.remove('active'));
        lb.querySelector('.nlb-overlay').addEventListener('click', () => lb.classList.remove('active'));
        lb.querySelector('.nlb-prev').addEventListener('click', () => show(current - 1));
        lb.querySelector('.nlb-next').addEventListener('click', () => show(current + 1));
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('active')) return;
            if (e.key === 'Escape') lb.classList.remove('active');
            if (e.key === 'ArrowLeft') show(current - 1);
            if (e.key === 'ArrowRight') show(current + 1);
        });

        lb._open = function(imgList, index) {
            imgs = imgList; show(index); lb.classList.add('active');
        };
    }

    document.addEventListener('click', function(e) {
        const img = e.target.closest('.negocio-galeria-img');
        if (!img) return;
        createLightbox();
        const imgs = JSON.parse(img.dataset.imgs);
        const index = parseInt(img.dataset.index);
        document.getElementById('negocio-lightbox')._open(imgs, index);
    });

    // Filtros
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            renderNegocios();
        });
    });

    renderNegocios();
});
