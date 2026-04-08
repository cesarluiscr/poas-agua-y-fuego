/* ════════════════════════════════════════════════════
   Poás Agua y Fuego — Motor de Búsqueda Global
   Inyecta el botón en el navbar y el overlay en el body
   ════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* ── Índice de contenido ───────────────────────── */
    const SEARCH_INDEX = [
        {
            title: 'Inicio',
            desc: 'Página principal del cantón de Poás',
            url: 'index.html',
            icon: '🏠',
            tags: 'inicio home principal poás cantón alajuela costa rica'
        },
        {
            title: 'Patrimonio Hídrico',
            desc: 'Acuíferos, ríos, cuencas y recursos hídricos del cantón',
            url: 'patrimonio-hidrico.html',
            icon: '💧',
            tags: 'agua acuíferos ríos cuencas patrimonio hídrico nacientes lluvia'
        },
        {
            title: 'Galería de Fotos',
            desc: 'Imágenes del volcán Poás, paisajes y comunidad',
            url: 'galeria.html',
            icon: '📷',
            tags: 'fotos galería imágenes volcán naturaleza paisaje erupción craterlago'
        },
        {
            title: 'Bolsa de Empleo',
            desc: 'Ofertas de trabajo y oportunidades laborales en Poás',
            url: 'bolsa-empleo.html',
            icon: '💼',
            tags: 'empleo trabajo vacantes ofertas laboral inscripción puestos'
        },
        {
            title: 'Eventos',
            desc: 'Calendario de actividades, ferias y eventos del cantón',
            url: 'eventos.html',
            icon: '📅',
            tags: 'eventos actividades calendario agenda ferias festival comunidad'
        },
        {
            title: 'Directorio Turístico y Comercial',
            desc: 'Negocios, hospedajes, restaurantes y servicios locales',
            url: 'directorio-comercial.html',
            icon: '🛍️',
            tags: 'directorio negocios comercial turismo hospedaje restaurante tienda servicio tecnología'
        },
        {
            title: 'Plan Regulador',
            desc: 'Zonificación y normativa de desarrollo territorial del cantón',
            url: 'plan-regulador.html',
            icon: '🗺️',
            tags: 'plan regulador zonificación normativa territorial municipalidad distritos uso suelo'
        },
        {
            title: 'Seguridad Ciudadana',
            desc: 'Lineamientos para grupos de vigilancia vecinal comunitaria',
            url: 'seguridad-ciudadana.html',
            icon: '🛡️',
            tags: 'seguridad vigilancia comunitaria grupos vecinal protocolos fuerza pública delito prevención'
        },
        {
            title: 'Historia del Cantón',
            desc: 'Orígenes prehispánicos, época colonial y tradiciones de Poás',
            url: 'historia-canton.html',
            icon: '📜',
            tags: 'historia cantón orígenes colonial tradiciones prehispánico patrimonio fundación 1901'
        },
        {
            title: 'Historia en Imágenes',
            desc: 'Fotografías históricas del cantón de Poás: parque, templo, calles y comunidades',
            url: 'historia-imagenes.html',
            icon: '📷',
            tags: 'fotos históricas imágenes antiguas archivo parque templo san pedro comunidad 1970 1971 1975'
        },
        {
            title: 'Biblioteca Pública del Cantón de Poás',
            desc: 'Historia de la Biblioteca Pública "Prof. Eliécer Murillo Esquivel" del Cantón de Poás',
            url: 'biblioteca-publica.html',
            icon: '📚',
            tags: 'biblioteca pública municipal eliécer murillo esquivel libros cultura conocimiento 1971 2012 sinabi lectura'
        },
        {
            title: 'Guerra Civil Poaseña 1948',
            desc: 'La participación de Poás en la guerra civil costarricense de 1948',
            url: 'guerra-civil-poasena.html',
            icon: '⚔️',
            tags: 'guerra civil 1948 historia poaseña figueristas calderonistas batalla'
        },
        {
            title: 'Ruta Gastronómica',
            desc: 'Platillos típicos y gastronomía tradicional del cantón de Poás',
            url: 'ruta-gastronomica.html',
            icon: '🍽️',
            tags: 'gastronomía comida platillos típico cocina ruta gastronómica sabores tradición'
        },
        {
            title: 'Quejas y Denuncias',
            desc: 'Reporte de problemas e irregularidades en la comunidad',
            url: 'quejas.html',
            icon: '📢',
            tags: 'quejas denuncias reportar problemas irregularidades comunidad'
        },
        {
            title: 'Contacto',
            desc: 'WhatsApp, redes sociales y formas de contacto',
            url: 'index.html#contacto',
            icon: '📬',
            tags: 'contacto whatsapp redes sociales facebook instagram tiktok'
        }
    ];

    /* ── Normalizar texto (quita tildes, minúsculas) ── */
    function normalize(str) {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    /* ── Filtrar resultados ───────────────────────── */
    function filterResults(query) {
        const q = normalize(query.trim());
        if (!q) return [];
        return SEARCH_INDEX.filter(item =>
            normalize(item.title).includes(q) ||
            normalize(item.desc).includes(q) ||
            normalize(item.tags).includes(q)
        );
    }

    /* ── Renderizar resultados ───────────────────── */
    function renderResults(results, query) {
        const list = document.getElementById('search-results-list');
        const empty = document.getElementById('search-empty');
        if (!list) return;

        list.innerHTML = '';

        if (!query.trim()) {
            empty.style.display = 'none';
            list.innerHTML = SEARCH_INDEX.map(item => resultHTML(item)).join('');
            return;
        }

        if (results.length === 0) {
            empty.style.display = 'flex';
            return;
        }

        empty.style.display = 'none';
        list.innerHTML = results.map(item => resultHTML(item)).join('');
    }

    function resultHTML(item) {
        return `
            <a href="${item.url}" class="search-result-item">
                <span class="search-result-icon">${item.icon}</span>
                <div class="search-result-text">
                    <strong>${item.title}</strong>
                    <span>${item.desc}</span>
                </div>
                <svg class="search-result-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>`;
    }

    /* ── Abrir / cerrar overlay ──────────────────── */
    function openSearch() {
        const overlay = document.getElementById('search-overlay');
        const input   = document.getElementById('search-input');
        if (!overlay) return;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => input && input.focus(), 80);
        renderResults([], '');
    }

    function closeSearch() {
        const overlay = document.getElementById('search-overlay');
        if (!overlay) return;
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        const input = document.getElementById('search-input');
        if (input) input.value = '';
    }

    /* ── Inyectar botón en el navbar ─────────────── */
    function injectButton() {
        const navbar = document.querySelector('.navbar');
        if (!navbar || navbar.querySelector('.search-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'search-btn';
        btn.setAttribute('aria-label', 'Buscar en el sitio');
        btn.setAttribute('title', 'Buscar (/)');
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>`;

        const hamburger = navbar.querySelector('.hamburger');
        if (hamburger) {
            navbar.insertBefore(btn, hamburger);
        } else {
            navbar.appendChild(btn);
        }
        btn.addEventListener('click', openSearch);
    }

    /* ── Inyectar overlay en el body ─────────────── */
    function injectOverlay() {
        if (document.getElementById('search-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'search-overlay';
        overlay.className = 'search-overlay';
        overlay.innerHTML = `
            <div class="search-modal" role="dialog" aria-label="Buscar en el sitio">
                <div class="search-input-wrap">
                    <svg class="search-icon-input" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
                    <input
                        id="search-input"
                        type="search"
                        placeholder="Buscar páginas, temas, servicios…"
                        autocomplete="off"
                        spellcheck="false"
                    />
                    <kbd class="search-esc-hint">ESC</kbd>
                </div>
                <div id="search-results-list" class="search-results-list"></div>
                <div id="search-empty" class="search-empty" style="display:none">
                    <span>Sin resultados</span>
                    <p>Intentá con otra palabra clave</p>
                </div>
            </div>
            <div class="search-backdrop"></div>
        `;
        document.body.appendChild(overlay);

        /* Eventos del overlay */
        overlay.querySelector('.search-backdrop').addEventListener('click', closeSearch);

        const input = overlay.querySelector('#search-input');
        input.addEventListener('input', () => {
            const q = input.value;
            renderResults(filterResults(q), q);
        });

        /* Cerrar al hacer clic en un resultado */
        overlay.querySelector('#search-results-list').addEventListener('click', closeSearch);
    }

    /* ── Atajos de teclado ───────────────────────── */
    function setupKeyboard() {
        document.addEventListener('keydown', e => {
            const overlay = document.getElementById('search-overlay');
            if (!overlay) return;

            const isOpen = overlay.classList.contains('active');

            /* / o Ctrl+K abren la búsqueda */
            if (!isOpen && (e.key === '/' || (e.ctrlKey && e.key === 'k'))) {
                const tag = document.activeElement.tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
                e.preventDefault();
                openSearch();
                return;
            }

            /* Escape cierra */
            if (isOpen && e.key === 'Escape') {
                closeSearch();
            }
        });
    }

    /* ── Init ────────────────────────────────────── */
    function init() {
        injectButton();
        injectOverlay();
        setupKeyboard();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
