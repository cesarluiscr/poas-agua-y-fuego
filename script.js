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
            logo: "img/techcenter_logo_0.png"
        },
        {
            id: 2,
            nombre: "Productos de Limpieza Don Luis",
            categoria: "servicio",
            emoji: "🧴",
            descripcion: "Venta de productos de limpieza para el hogar y empresas. Atención personalizada por Luis Murillo Vargas.",
            descripcion_en: "Cleaning products for homes and businesses. Personalized service by Luis Murillo Vargas.",
            whatsapp: "50689944301",
            facebook: "https://www.facebook.com/luis.murillovargas.7?locale=es_LA",
            correo: "luismurillo21@gmail.com",
            direccion: "Cantón de Poás"
        }
    ];

    const isEnglish = document.documentElement.lang === 'en';

    const CATEGORIA_META = {
        restaurante: { emoji: "🍽️", label: isEnglish ? "Restaurant"  : "Restaurante" },
        hospedaje:   { emoji: "🏨", label: isEnglish ? "Lodging"      : "Hospedaje" },
        tours:       { emoji: "🌋", label: isEnglish ? "Tours"        : "Tours" },
        tienda:      { emoji: "🛍️", label: isEnglish ? "Shop"         : "Tienda" },
        servicio:    { emoji: "⚙️", label: isEnglish ? "Service"      : "Servicio" },
        tecnologia:  { emoji: "💻", label: isEnglish ? "Technology"   : "Tecnología" }
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
            card.className = tieneGaleria ? 'negocio-card' : 'negocio-card negocio-card-simple';

            // Galería de imágenes si existe
            const galeriaHTML = (negocio.imagenes && negocio.imagenes.length > 0)
                ? `<div class="negocio-galeria">
                    ${negocio.imagenes.map((img, i) => `<img src="${img}" alt="${negocio.nombre} ${i+1}" loading="lazy" class="negocio-galeria-img" data-imgs='${JSON.stringify(negocio.imagenes)}' data-index="${i}">`).join('')}
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
                <p class="negocio-desc">${isEnglish && negocio.descripcion_en ? negocio.descripcion_en : negocio.descripcion}</p>
                <div class="negocio-meta">
                    ${negocio.direccion ? `<span>📍 ${negocio.direccion}</span>` : ''}
                    ${negocio.telefono  ? `<span>📞 ${negocio.telefono}</span>` : ''}
                    ${negocio.correo    ? `<a href="mailto:${negocio.correo}">✉️ ${negocio.correo}</a>` : ''}
                </div>
                ${(negocio.whatsapp || negocio.facebook || negocio.instagram || negocio.tiktok || negocio.waze || negocio.booking || negocio.sitio) ? `
                <div class="negocio-social">
                    ${negocio.sitio     ? `<a href="${negocio.sitio}" ${negocio.sitio.startsWith('http') ? 'target="_blank"' : ''} rel="noopener" class="social-btn ver-mas-btn">🌐 ${isEnglish ? 'See more' : 'Ver más'}</a>` : ''}
                    ${negocio.whatsapp  ? `<a href="https://wa.me/${negocio.whatsapp}" target="_blank" rel="noopener" class="social-btn wa-btn">💬 WhatsApp</a>` : ''}
                    ${negocio.facebook  ? `<a href="${negocio.facebook}" target="_blank" rel="noopener" class="social-btn fb-btn">📘 Facebook</a>` : ''}
                    ${negocio.instagram ? `<a href="${negocio.instagram}" target="_blank" rel="noopener" class="social-btn ig-btn">📸 Instagram</a>` : ''}
                    ${negocio.tiktok    ? `<a href="${negocio.tiktok}" target="_blank" rel="noopener" class="social-btn tt-btn">🎵 TikTok</a>` : ''}
                    ${negocio.booking   ? `<a href="${negocio.booking}" target="_blank" rel="noopener" class="social-btn bk-btn">🏨 ${isEnglish ? 'Book on Booking' : 'Reservar en Booking'}</a>` : ''}
                    ${negocio.waze      ? `<a href="${negocio.waze}" target="_blank" rel="noopener" class="social-btn wz-btn">📍 ${isEnglish ? 'Get directions' : 'Cómo llegar'}</a>` : ''}
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
