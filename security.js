/**
 * security.js — Seguridad máxima para Poás Agua y Fuego
 * 18 capas de protección client-side para sitio estático en GitHub Pages
 * v3.0
 */
(function () {
    'use strict';

    const SITE_HOST = 'cesarluiscr.github.io';
    const ALLOWED_SCRIPT_HOSTS = [
        'script.google.com',
        'fonts.googleapis.com',
        'flagcdn.com',
        'unpkg.com',
        'cdn.jsdelivr.net'
    ];
    const RL_PREFIX = 'poas_rl_';

    /* ══════════════════════════════════════════
       1. SANITIZACIÓN PROFUNDA DE INPUTS
    ══════════════════════════════════════════ */
    function sanitize(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#x27;')
            .replace(/\//g, '&#x2F;')
            .replace(/`/g,  '&#x60;')
            .replace(/=/g,  '&#x3D;')
            .replace(/\x00/g, '')                        // null bytes
            .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '') // zero-width chars
            .replace(/\{\{|\}\}|\$\{|#\{/g, '')          // template injection
            .trim();
    }

    const DANGEROUS = [
        /<script/i, /javascript:/i, /vbscript:/i,
        /on\w+\s*=/i, /data:text\/html/i, /data:application/i,
        /<iframe/i, /<object/i, /<embed/i, /<link\s/i, /<meta\s/i,
        /expression\s*\(/i, /url\s*\(\s*javascript/i,
        /\beval\s*\(/i, /\bexec\s*\(/i,
        /document\.cookie/i, /document\.write/i, /window\.location/i,
        /\.innerHTML\s*=/i, /fromCharCode/i,
        /\\u00[0-9a-f]{2}/i, /\\x[0-9a-f]{2}/i,
        /%3[Cc]|%3[Ee]|%27|%22/,                        // URL-encoded XSS
        /&#\d+;/, /&#x[0-9a-f]+;/i                      // HTML entity XSS
    ];

    function hasDanger(val) {
        return DANGEROUS.some(function (p) { return p.test(val); });
    }

    function cleanInput(input) {
        if (!input) return;
        if (!input.maxLength || input.maxLength < 0 || input.maxLength > 2000) {
            input.maxLength = 2000;
        }
        input.addEventListener('input', function () {
            if (hasDanger(this.value)) {
                this.value = this.value.replace(/<[^>]*>/g, '');
                DANGEROUS.forEach(function (p) {
                    this.value = this.value.replace(p, '');
                }, this);
                showWarn('Entrada no permitida eliminada.');
                secLog('dangerous_input', { field: this.name || this.id });
            }
        });
    }

    function applyInputSanitization() {
        document.querySelectorAll(
            'input[type="text"], input[type="email"], input[type="tel"], textarea, input:not([type])'
        ).forEach(cleanInput);
    }

    /* ══════════════════════════════════════════
       2. RATE LIMITING PERSISTENTE (localStorage)
    ══════════════════════════════════════════ */
    function rateLimit(key, max, windowMs) {
        var sk = RL_PREFIX + key;
        var now = Date.now();
        var data;
        try { data = JSON.parse(localStorage.getItem(sk) || 'null'); } catch (e) { data = null; }
        if (!data) data = { attempts: [], blocked: false, blockUntil: 0 };

        if (data.blocked && now < data.blockUntil) {
            var waitMin = Math.ceil((data.blockUntil - now) / 60000);
            showWarn('Acceso bloqueado. Intente en ' + waitMin + ' minuto(s).');
            return false;
        }

        data.attempts = data.attempts.filter(function (t) { return now - t < windowMs; });
        data.attempts.push(now);

        if (data.attempts.length > max * 3) {
            data.blocked = true;
            data.blockUntil = now + 30 * 60 * 1000;
            localStorage.setItem(sk, JSON.stringify(data));
            showWarn('Demasiados intentos. Bloqueado por 30 minutos.');
            secLog('rate_limit_blocked', { key: key });
            return false;
        }
        if (data.attempts.length > max) {
            var wait = Math.ceil((windowMs - (now - data.attempts[0])) / 1000);
            localStorage.setItem(sk, JSON.stringify(data));
            showWarn('Demasiados intentos. Espere ' + wait + ' segundos.');
            return false;
        }
        localStorage.setItem(sk, JSON.stringify(data));
        return true;
    }

    /* ══════════════════════════════════════════
       3. DETECCIÓN DE BOTS (timing + interacción)
    ══════════════════════════════════════════ */
    var _human = false;
    var _pageLoadTime = Date.now();

    function initBotDetection() {
        function markHuman() { _human = true; }
        ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'].forEach(function (ev) {
            document.addEventListener(ev, markHuman, { once: true, passive: true });
        });
    }

    function isBot(formCreatedAt) {
        var elapsed = Date.now() - (formCreatedAt || _pageLoadTime);
        return elapsed < 1500; // menos de 1.5 s = bot
    }

    /* ══════════════════════════════════════════
       4. HONEYPOT ANTI-BOT (múltiples campos)
    ══════════════════════════════════════════ */
    function addHoneypot(form) {
        if (!form || form.querySelector('.hp-field')) return;
        var wrap = document.createElement('div');
        wrap.style.cssText = 'position:absolute;left:-9999px;opacity:0;height:0;overflow:hidden;pointer-events:none;';
        wrap.setAttribute('aria-hidden', 'true');
        ['website', 'phone_confirm', 'url_field'].forEach(function (name) {
            var inp = document.createElement('input');
            inp.type = 'text'; inp.name = name;
            inp.className = 'hp-field'; inp.tabIndex = -1;
            inp.setAttribute('autocomplete', 'off');
            wrap.appendChild(inp);
        });
        form.appendChild(wrap);

        // Timestamp oculto para verificar timing
        var ts = document.createElement('input');
        ts.type = 'hidden'; ts.name = '_rt'; ts.className = 'hp-ts';
        ts.value = Date.now().toString();
        form.appendChild(ts);
    }

    function honeypotTripped(form) {
        var tripped = false;
        form.querySelectorAll('.hp-field').forEach(function (hp) {
            if (hp.value.length > 0) tripped = true;
        });
        return tripped;
    }

    /* ══════════════════════════════════════════
       5. VALIDACIÓN DE CAMPOS
    ══════════════════════════════════════════ */
    function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254; }
    function validPhone(p) { return /^[\d\s\+\-\(\)]{7,15}$/.test(p); }

    /* ══════════════════════════════════════════
       6. PROTECCIÓN DE ENLACES EXTERNOS
    ══════════════════════════════════════════ */
    function hardenLinks() {
        document.querySelectorAll('a[href]').forEach(function (a) {
            var href = a.getAttribute('href') || '';
            if (/^(javascript|vbscript|data):/i.test(href.trim())) {
                a.removeAttribute('href');
                a.style.cursor = 'not-allowed';
                secLog('dangerous_href_blocked', { href: href });
                return;
            }
            var ext = href.startsWith('http') && !href.includes(location.hostname);
            if (ext || a.getAttribute('target') === '_blank') {
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    /* ══════════════════════════════════════════
       7. ANTI-CLICKJACKING
    ══════════════════════════════════════════ */
    function preventClickjacking() {
        if (window.top !== window.self) {
            try { window.top.location.href = window.self.location.href; }
            catch (e) {
                document.documentElement.style.visibility = 'hidden';
                setTimeout(function () {
                    document.body.innerHTML =
                        '<div style="padding:3rem;text-align:center;font-family:sans-serif">' +
                        '<h1 style="color:#C0392B">⚠ Acceso no permitido</h1>' +
                        '<p>Este sitio no puede cargarse dentro de un iframe.</p>' +
                        '<a href="https://' + SITE_HOST + '/poas-agua-y-fuego/">Abrir sitio directamente →</a>' +
                        '</div>';
                    document.documentElement.style.visibility = 'visible';
                }, 100);
            }
        }
    }

    /* ══════════════════════════════════════════
       8. ADVERTENCIA DE CONSOLA (anti-self-XSS)
    ══════════════════════════════════════════ */
    function consoleWarning() {
        var s1 = 'color:#FF4444;font-size:1.6rem;font-weight:bold;';
        var s2 = 'color:#222;font-size:0.95rem;background:#fff4e5;padding:4px;';
        var s3 = 'color:#1565C0;font-size:0.85rem;';
        console.log('%c⚠ ADVERTENCIA DE SEGURIDAD', s1);
        console.log('%cSi alguien te indicó pegar código aquí, es una ESTAFA (Self-XSS). Ejecutar comandos puede comprometer tu cuenta y los datos del sitio.', s2);
        console.log('%c✅ Sitio comunitario oficial del cantón de Poás, Costa Rica.', s3);
    }

    /* ══════════════════════════════════════════
       9. SESIÓN ADMIN CON TIMEOUT
    ══════════════════════════════════════════ */
    var ADMIN_TTL = 15 * 60 * 1000;
    var SK_AUTH = 'admin_auth', SK_TIME = 'admin_auth_time';

    function refreshAdmin() {
        if (sessionStorage.getItem(SK_AUTH)) sessionStorage.setItem(SK_TIME, Date.now().toString());
    }

    function checkAdminTimeout() {
        if (!sessionStorage.getItem(SK_AUTH)) return;
        var last = parseInt(sessionStorage.getItem(SK_TIME) || '0');
        if (Date.now() - last > ADMIN_TTL) {
            sessionStorage.removeItem(SK_AUTH);
            sessionStorage.removeItem(SK_TIME);
            var panel = document.getElementById('admin-panel');
            if (panel) { panel.style.display = 'none'; showWarn('Sesión de administrador expirada.'); }
        }
    }

    /* ══════════════════════════════════════════
       10. SANITIZACIÓN DE URL Y HASH
    ══════════════════════════════════════════ */
    function sanitizeURL() {
        var bad = /<|>|javascript:|data:|vbscript:|on\w+=|&#|%3[Cc]|%3[Ee]|%27|%22/gi;
        var params = new URLSearchParams(window.location.search);
        var danger = false;
        params.forEach(function (v) { if (bad.test(decodeURIComponent(v))) danger = true; });
        if (danger) { secLog('url_injection', { url: location.href }); location.replace(location.pathname); }
        var hash = window.location.hash;
        if (hash && /<|javascript:|data:|on\w+=/i.test(decodeURIComponent(hash))) {
            history.replaceState(null, '', location.pathname + location.search);
        }
    }

    /* ══════════════════════════════════════════
       11. META TAGS DE SEGURIDAD (CSP, Referrer)
    ══════════════════════════════════════════ */
    function enforceSecurityMeta() {
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            var csp = document.createElement('meta');
            csp.httpEquiv = 'Content-Security-Policy';
            csp.content = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' https://script.google.com https://unpkg.com https://cdn.jsdelivr.net",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdn.jsdelivr.net",
                "font-src 'self' https://fonts.gstatic.com https://unpkg.com",
                "img-src 'self' data: https: blob:",
                "media-src 'self' blob:",
                "connect-src 'self' https://script.google.com https://api.open-meteo.com https://nominatim.openstreetmap.org https://tile.openstreetmap.org",
                "worker-src blob: 'self'",
                "frame-src 'none'",
                "frame-ancestors 'none'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self' https://script.google.com"
            ].join('; ');
            /* NOTA: 'unsafe-inline' en script-src puede eliminarse una vez que admin.html
               no tenga más inline handlers. Actualmente admin.html usa event listeners,
               pero otras páginas pueden tener scripts inline. Revisar antes de quitar. */
            document.head.insertBefore(csp, document.head.firstChild);
        }
        if (!document.querySelector('meta[name="referrer"]')) {
            var ref = document.createElement('meta');
            ref.name = 'referrer'; ref.content = 'strict-origin-when-cross-origin';
            document.head.appendChild(ref);
        }
        if (!document.querySelector('meta[http-equiv="X-UA-Compatible"]')) {
            var ua = document.createElement('meta');
            ua.httpEquiv = 'X-UA-Compatible'; ua.content = 'IE=edge';
            document.head.appendChild(ua);
        }
    }

    /* ══════════════════════════════════════════
       12. UI DE ADVERTENCIA
    ══════════════════════════════════════════ */
    function showWarn(msg) {
        var toast = document.getElementById('sec-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'sec-toast';
            toast.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);' +
                'background:#C0392B;color:#fff;padding:0.75rem 1.5rem;border-radius:10px;' +
                'font-size:0.875rem;font-family:sans-serif;z-index:99999;' +
                'box-shadow:0 4px 20px rgba(0,0,0,0.3);max-width:90vw;text-align:center;';
            document.body.appendChild(toast);
        }
        toast.textContent = '⚠ ' + msg;
        toast.style.display = 'block';
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { toast.style.display = 'none'; }, 5000);
    }

    /* ══════════════════════════════════════════
       13. LOG DE EVENTOS DE SEGURIDAD
    ══════════════════════════════════════════ */
    function secLog(type, details) {
        try {
            var log = JSON.parse(sessionStorage.getItem('sec_log') || '[]');
            log.push({ type: type, details: details, url: location.href, ts: new Date().toISOString() });
            if (log.length > 50) log.shift();
            sessionStorage.setItem('sec_log', JSON.stringify(log));
        } catch (e) {}
        console.warn('[Security]', type, details);
    }

    /* ══════════════════════════════════════════
       14. PROTECCIÓN DE FORMULARIOS
    ══════════════════════════════════════════ */
    function secureForm(formId, opts) {
        var form = document.getElementById(formId);
        if (!form) return;
        var formCreated = Date.now();
        addHoneypot(form);

        form.addEventListener('submit', function (e) {
            // 1. Honeypot
            if (honeypotTripped(form)) {
                e.preventDefault();
                secLog('honeypot', { formId: formId });
                return;
            }
            // 2. Timing anti-bot
            if (isBot(formCreated)) {
                e.preventDefault();
                showWarn('Envío demasiado rápido. Intente de nuevo.');
                secLog('bot_timing', { formId: formId });
                return;
            }
            // 3. Interacción humana
            if (!_human) {
                e.preventDefault();
                showWarn('Se detectó comportamiento automatizado.');
                secLog('no_human', { formId: formId });
                return;
            }
            // 4. Rate limit persistente
            if (!rateLimit(formId, opts.maxSubmits || 3, opts.windowMs || 120000)) {
                e.preventDefault(); return;
            }
            // 5. Campos requeridos + contenido peligroso
            var valid = true;
            (opts.requiredFields || []).forEach(function (sel) {
                var el = form.querySelector(sel);
                if (!el) return;
                var val = (el.value || '').trim();
                if (!val) { el.style.borderColor = '#C0392B'; valid = false; }
                else if (hasDanger(val)) { el.value = ''; el.style.borderColor = '#C0392B'; valid = false; showWarn('Contenido no permitido detectado.'); }
                else { el.style.borderColor = ''; }
            });
            // 6. Email
            (opts.emailFields || []).forEach(function (sel) {
                var el = form.querySelector(sel);
                if (!el || !el.value) return;
                if (!validEmail(el.value)) { el.style.borderColor = '#C0392B'; showWarn('Correo inválido.'); valid = false; }
            });
            // 7. Longitud máxima
            form.querySelectorAll('input, textarea').forEach(function (el) {
                if ((el.value || '').length > 2000) el.value = el.value.substring(0, 2000);
            });
            if (!valid) { e.preventDefault(); showWarn('Complete todos los campos correctamente.'); }
        }, true);
    }

    /* ══════════════════════════════════════════
       15. BLOQUEAR SCRIPTS INYECTADOS (MutationObserver)
    ══════════════════════════════════════════ */
    function initScriptGuard() {
        if (!window.MutationObserver) return;
        var obs = new MutationObserver(function (muts) {
            muts.forEach(function (m) {
                m.addedNodes.forEach(function (node) {
                    if (node.tagName !== 'SCRIPT') return;
                    var src = node.src || '';
                    if (!src) return;
                    var own = src.includes(location.hostname);
                    var allowed = ALLOWED_SCRIPT_HOSTS.some(function (h) { return src.includes(h); });
                    if (!own && !allowed) {
                        node.remove();
                        secLog('script_blocked', { src: src });
                    }
                });
            });
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
    }

    /* ══════════════════════════════════════════
       16. BLOQUEAR PASTE MALICIOSO
    ══════════════════════════════════════════ */
    function initPasteProtection() {
        document.addEventListener('paste', function (e) {
            var cd = e.clipboardData || window.clipboardData;
            var text = cd ? cd.getData('text') : '';
            if (text && hasDanger(text)) {
                e.preventDefault();
                showWarn('Contenido pegado bloqueado: contiene código peligroso.');
                secLog('malicious_paste', {});
            }
        });
    }

    /* ══════════════════════════════════════════
       17. TOKEN CSRF-LIKE EN FORMULARIOS
    ══════════════════════════════════════════ */
    function addFormTokens() {
        if (!window.crypto || !crypto.getRandomValues) return;
        var arr = new Uint8Array(16);
        crypto.getRandomValues(arr);
        var token = Array.from(arr).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        sessionStorage.setItem('_form_token', token);
        document.querySelectorAll('form').forEach(function (form) {
            if (form.querySelector('[name="_token"]')) return;
            var inp = document.createElement('input');
            inp.type = 'hidden'; inp.name = '_token'; inp.value = token;
            form.appendChild(inp);
        });
    }

    /* ══════════════════════════════════════════
       18. PROTECCIÓN CONTRA OPEN REDIRECT
    ══════════════════════════════════════════ */
    function preventOpenRedirect() {
        document.addEventListener('click', function (e) {
            var a = e.target.closest('a');
            if (!a) return;
            var href = a.getAttribute('href') || '';
            // Block redirect tricks: //evil.com, ///evil.com, /\evil.com
            if (/^\/[\/\\]/.test(href) && !href.startsWith('//' + location.hostname)) {
                e.preventDefault();
                secLog('open_redirect_blocked', { href: href });
            }
        });
    }

    /* ══════════════════════════════════════════
       INICIALIZACIÓN
    ══════════════════════════════════════════ */
    // Protecciones críticas: inmediatamente
    preventClickjacking();
    sanitizeURL();
    enforceSecurityMeta();
    consoleWarning();
    initBotDetection();

    // Protecciones DOM: esperar DOMContentLoaded
    function onReady() {
        applyInputSanitization();
        hardenLinks();
        initScriptGuard();
        initPasteProtection();
        addFormTokens();
        preventOpenRedirect();

        setInterval(checkAdminTimeout, 30000);
        document.addEventListener('click',    refreshAdmin);
        document.addEventListener('keypress', refreshAdmin);

        secureForm('eventoForm',   { maxSubmits: 3, windowMs: 120000, requiredFields: ['[name="titulo"]', '[name="fecha"]'] });
        secureForm('quejasForm',   { maxSubmits: 5, windowMs: 120000, requiredFields: ['[name="categoria"]', '[name="descripcion"]'] });
        secureForm('historiaForm', { maxSubmits: 2, windowMs: 300000, requiredFields: ['[name="nombre"]', '[name="historia"]'], emailFields: ['[name="correo"]'] });
        secureForm('negocioForm',  { maxSubmits: 3, windowMs: 120000, requiredFields: ['[name="nombre"]', '[name="categoria"]'] });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }

    // API pública para uso interno
    window.__sec = {
        sanitize:   sanitize,
        showWarning: showWarn,
        logEvent:   secLog,
        getLog:     function () { return JSON.parse(sessionStorage.getItem('sec_log') || '[]'); }
    };

})();
