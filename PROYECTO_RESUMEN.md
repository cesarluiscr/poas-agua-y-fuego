# Resumen del Proyecto: Poás Agua y Fuego

## Descripción General
Sitio web comunitario e informativo del **Cantón de Poás, Alajuela, Costa Rica**.
- **URL**: https://cesarluiscr.github.io/poas-agua-y-fuego/
- **Repo**: https://github.com/cesarluiscr/poas-agua-y-fuego
- **Ramas**: `master` y `main` (sincronizadas — siempre pushear a ambas)
- **Deploy**: GitHub Pages automático desde rama `master/main`

---

## Estructura de Archivos

### Páginas Principales
| Archivo | Descripción |
|---------|-------------|
| `index.html` / `index-en.html` | Página principal (ES/EN) |
| `galeria.html` / `galeria-en.html` | Galería de fotos |
| `directorio-comercial.html` / `-en` | Directorio de negocios |
| `quejas.html` / `quejas-en.html` | Quejas y sugerencias |
| `techcenter.html` / `techcenter-en.html` | Tech Center |

### Páginas Secundarias (autocontenidas)
| Archivo | Descripción |
|---------|-------------|
| `historia-canton.html` / `-en` | Historia del cantón |
| `agricultura.html` / `-en` | Agricultura del cantón |
| `ecologia.html` / `-en` | Ecología / Ecobarrio |
| `patrimonio-hidrico.html` / `-en` | Patrimonio hídrico |
| `guerra-civil-poasena.html` / `-en` | Guerra Civil 1948 |
| `plan-regulador.html` / `-en` | Plan Regulador |
| `plan-regulador-comunicacion.html` | Comunicación Plan Regulador (de PDF INVU) |
| `ruta-gastronomica.html` / `-en` | Ruta Gastronómica |
| `eventos.html` / `-en` | Eventos del cantón |
| `bolsa-empleo.html` / `-en` | Bolsa de Empleo |
| `seguridad-ciudadana.html` / `-en` | Seguridad Ciudadana |
| `historia-imagenes.html` / `-en` | Historia en Imágenes |
| `biblioteca-publica.html` | Biblioteca Pública |
| `como-llegar.html` / `como-llegar-en.html` | Cómo Llegar |
| `admin.html` | Panel de administración |

### Archivos de Soporte
| Archivo | Descripción |
|---------|-------------|
| `style.css` | Estilos globales (~4379 líneas) |
| `script.js` | JS principal (~564 líneas) |
| `security.js` | Seguridad básica |
| `search.js` | Buscador |
| `server.js` | Servidor Node (desarrollo) |
| `google-apps-script.js` | Integración Google Apps |

---

## Arquitectura del Navbar

### Regla fundamental
**Todas las páginas usan `<nav class="navbar">` estándar** con la misma estructura de `index.html`.

```html
<nav class="navbar">
    <div class="logo">Poás <span>...</span></div>
    <ul class="nav-links">...</ul>
    <div class="nav-lang">
        <a href="[pagina].html" class="lang-btn active">🇨🇷 <span class="lang-label">Español</span></a>
        <a href="[pagina]-en.html" class="lang-btn">🇺🇸 <span class="lang-label">English</span></a>
    </div>
    <div class="hamburger" id="hamburger"><span></span><span></span><span></span><em class="hamburger-label">Menú</em></div>
</nav>
<nav class="mobile-nav" id="mobileNav">
    <div class="mobile-nav-panel" id="mobileNavPanel">
        <div class="mobile-nav-header">...</div>
        <div class="mobile-nav-links">... (13 links con emojis)</div>
        <div class="mobile-nav-lang">...</div>
        <div class="mobile-nav-footer">Cantón de Poás · Alajuela · Costa Rica</div>
    </div>
</nav>
```

### Páginas que cargan `script.js`
`galeria`, `directorio-comercial`, `quejas`, `techcenter` — **NO agregar IIFE del hamburger** (ya lo maneja script.js). Solo definir `window.closeMobileNav`.

### Páginas que NO cargan `script.js`
Todas las demás — agregar IIFE completo del hamburger al final antes de `</body>`.

---

## Git — Procedimiento de Push
```bash
git add [archivos]
git commit -m "mensaje"
git push origin master master:main
```

---

## Configuración Claude (`~/.claude/settings.json`)
```json
{
  "spinnerTipsEnabled": false,
  "permissions": { "defaultMode": "acceptEdits" },
  "alwaysThinkingEnabled": false,
  "prefersReducedMotion": true
}
```

---

## Secciones de index.html (orden actual)
1. Hero (Fuego vs Agua)
2. Barra alerta volcánica
3. Patrimonio Hídrico
4. Galería de Fotos
5. Corazón Poaseño (Tarjeta Volcán)
6. Clima en Tiempo Real
7. Mapa Interactivo del Cantón
8. Banner Historia del Cantón
9. Seguridad Ciudadana
10. Quejas
11. Contacto y Redes Sociales

### Secciones eliminadas (ocultas con `display:none`)
- `#empleo`, `#eventos`, `#turismo`, `.regulador-preview-section`
- Noticias y Anuncios Comunitarios ✅ eliminada
- Estadísticas del Cantón ✅ eliminada
- Plan Regulador (debajo del directorio) ✅ eliminada

---

## Mejoras Sugeridas Pendientes (usuario las pidió)
- Hero section impactante con CTA "Reserva tu visita hoy"
- Botón flotante de WhatsApp (esquina inferior derecha)
  - Link: `https://wa.me/50624337171?text=Hola,%20me%20gustaría%20más%20información%20sobre%20el%20club`
- Formulario de contacto (nombre, email, mensaje)
- Mapa interactivo de ubicación
- Horarios de atención
- Galería con lightbox
- Testimonios con fotos
- Schema markup SEO local
- Lazy loading de imágenes
- ⚠️ Estas mejoras se mencionaron en contexto del **Club Campestre La Cueva** — verificar si aplican a poas-volcano o a otro proyecto

---

## Proyecto Secundario: Club Campestre La Cueva
- El usuario tiene otro proyecto (`club-campestre-la-cueva.html`) pero no se encontró el archivo
- Repo posible: `https://github.com/cesarluiscr/cueva2`
- Las mejoras listadas arriba probablemente son para ese proyecto
- Pendiente confirmar ubicación del archivo

---

## Problemas Conocidos Resueltos
| Problema | Solución |
|----------|----------|
| Páginas secundarias sin navbar móvil | Reemplazadas con `class="navbar"` estándar |
| Banderas de idioma no visibles en móvil | `nav-lang` con `display:flex` en media query |
| Hamburger con doble binding | Páginas con script.js solo usan `window.closeMobileNav` |
| GitHub Pages no actualizaba | Cambios no commiteados — push del archivo real |
| CSS custom interfería con navbar | Removidos `.ag-nav`, `.ec-nav`, `.hist-nav` |

---

## Notas de Desarrollo
- **Viewport móvil**: breakpoint principal en `max-width: 1100px`
- **Fuentes**: Outfit (principal), Playfair Display (títulos especiales)
- **Colores principales**: turquesa (#40E0D0), rojo volcán (#C0392B), verde agua (#17A589)
- **WhatsApp del proyecto**: 50687058612
- **247 commits** en el repo hasta la fecha
