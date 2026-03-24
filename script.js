// ⬇️ Pegá aquí la URL de tu Google Apps Script después de implementarlo
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/TU_URL_AQUI/exec';

// ── Hamburger / Mobile Nav ──────────────────────────────────────────
const hamburger  = document.querySelector('.hamburger');
const mobileNav  = document.getElementById('mobileNav');

function closeMobileNav() {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
}

if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
        const isOpen = hamburger.classList.toggle('open');
        mobileNav.classList.toggle('open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on backdrop click
    mobileNav.addEventListener('click', (e) => {
        if (e.target === mobileNav) closeMobileNav();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMobileNav();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('nav-scrolled');
        } else {
            navbar.classList.remove('nav-scrolled');
        }
    });

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
                // Enviar datos a Google Sheets vía Apps Script
                // mode: 'no-cors' es necesario para evitar errores CORS con Google Apps Script
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(data)
                });

                // Con no-cors no podemos leer la respuesta, asumimos éxito
                registerForm.reset();
                registerSuccess.classList.remove('hidden');
                setTimeout(() => registerSuccess.classList.add('hidden'), 6000);

            } catch (err) {
                console.error('Error al enviar inscripción:', err);
                alert('Hubo un problema al inscribirte. Por favor intenta de nuevo.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Dynamic Hero effects based on mouse position (Desktop only)
    const hero = document.querySelector('.hero');
    const fireSide = document.querySelector('.hero-fire');
    const waterSide = document.querySelector('.hero-water');

    if (window.innerWidth > 768 && hero && fireSide && waterSide) {
        hero.addEventListener('mousemove', (e) => {
            const width = window.innerWidth;
            const mouseX = e.clientX;

            // Calculate percentage (0 to 100)
            let percentage = (mouseX / width) * 100;

            // Limit the shifting so one side doesn't disappear completely
            if (percentage < 20) percentage = 20;
            if (percentage > 80) percentage = 80;

            fireSide.style.flex = percentage;
            waterSide.style.flex = 100 - percentage;
        });

        hero.addEventListener('mouseleave', () => {
            // Reset to 50/50 when mouse leaves
            fireSide.style.flex = '1';
            waterSide.style.flex = '1';
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
            telefono: "",
            correo: "",
            sitio: "",
            direccion: "Poásito, Alajuela",
            logo: "img/monteluna_logo.jpg",
            imagenes: ["img/monteluna_aerea.jpg", "img/monteluna_cabana.jpg", "img/monteluna_interior.jpg"]
        },
        {
            id: 2,
            nombre: "Productos de Limpieza Don Luis",
            categoria: "servicio",
            emoji: "🧴",
            descripcion: "Venta de productos de limpieza para el hogar y empresas. Atención personalizada por Luis Murillo Vargas.",
            telefono: "8994-4301",
            correo: "luismurillo21@gmail.com",
            sitio: "https://www.facebook.com/luis.murillovargas.7?locale=es_LA",
            direccion: "Cantón de Poás"
        }
    ];

    const CATEGORIA_META = {
        restaurante: { emoji: "🍽️", label: "Restaurante" },
        hospedaje:   { emoji: "🏨", label: "Hospedaje" },
        tours:       { emoji: "🌋", label: "Tours" },
        tienda:      { emoji: "🛍️", label: "Tienda" },
        servicio:    { emoji: "⚙️", label: "Servicio" }
    };

    // Limpiar datos anteriores y forzar la lista actualizada
    const stored = JSON.parse(localStorage.getItem('poas_negocios'));
    const knownIds = DEFAULT_NEGOCIOS.map(n => n.id);
    if (!stored || !knownIds.every(id => stored.some(n => n.id === id))) {
        localStorage.removeItem('poas_negocios');
    }
    let negocios = JSON.parse(localStorage.getItem('poas_negocios')) || DEFAULT_NEGOCIOS;
    let activeFilter = 'all';

    const negociosGrid = document.getElementById('negociosGrid');
    const filterBtns   = document.querySelectorAll('.filter-btn');

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
            card.className = 'negocio-card';

            // Galería de imágenes si existe
            const galeriaHTML = (negocio.imagenes && negocio.imagenes.length > 0)
                ? `<div class="negocio-galeria">
                    ${negocio.imagenes.map(img => `<img src="${img}" alt="${negocio.nombre}" loading="lazy">`).join('')}
                   </div>`
                : '';

            // Logo o emoji en el encabezado
            const logoHTML = negocio.logo
                ? `<img src="${negocio.logo}" alt="Logo ${negocio.nombre}" class="negocio-logo">`
                : `<span class="negocio-emoji">${emoji}</span>`;

            card.innerHTML = `
                ${galeriaHTML}
                <div class="negocio-card-header">
                    ${logoHTML}
                    <div>
                        <h4>${negocio.nombre}</h4>
                        <span class="negocio-badge">${meta.label}</span>
                    </div>
                </div>
                <p class="negocio-desc">${negocio.descripcion}</p>
                <div class="negocio-meta">
                    ${negocio.direccion ? `<span>📍 ${negocio.direccion}</span>` : ''}
                    ${negocio.telefono  ? `<span>📞 ${negocio.telefono}</span>` : ''}
                    ${negocio.correo    ? `<a href="mailto:${negocio.correo}">✉️ ${negocio.correo}</a>` : ''}
                    ${negocio.sitio     ? `<a href="${negocio.sitio}" target="_blank" rel="noopener">${negocio.sitio.includes('facebook') ? '📘 Ver en Facebook' : '🌐 ' + negocio.sitio}</a>` : ''}
                </div>
            `;
            negociosGrid.appendChild(card);
        });
    }

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
