/**
 * security.js — Módulo de seguridad para Poás Agua y Fuego
 * Protecciones client-side para sitio estático en GitHub Pages
 */
(function () {
    'use strict';

    /* ══════════════════════════════════════════
       1. SANITIZACIÓN DE INPUTS
    ══════════════════════════════════════════ */
    function sanitize(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .replace(/`/g, '&#x60;')
            .replace(/=/g, '&#x3D;')
            .trim();
    }

    function sanitizeInput(input) {
        if (!input) return;
        input.addEventListener('input', function () {
            // Bloquear caracteres peligrosos en tiempo real
            const dangerous = /<script|javascript:|on\w+\s*=|data:text\/html/gi;
            if (dangerous.test(this.value)) {
                this.value = this.value.replace(dangerous, '');
                showSecurityWarning('Entrada no permitida eliminada.');
            }
        });
    }

    function applyInputSanitization() {
        document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea, input:not([type])').forEach(sanitizeInput);
    }

    /* ══════════════════════════════════════════
       2. RATE LIMITING DE FORMULARIOS
    ══════════════════════════════════════════ */
    const FORM_LIMITS = {};

    function rateLimitForm(formId, maxSubmits, windowMs) {
        const key = 'rateLimit_' + formId;
        const now = Date.now();
        let data = JSON.parse(sessionStorage.getItem(key) || '{"count":0,"start":0}');

        if (now - data.start > windowMs) {
            data = { count: 0, start: now };
        }

        data.count++;
        sessionStorage.setItem(key, JSON.stringify(data));

        if (data.count > maxSubmits) {
            const waitSec = Math.ceil((windowMs - (now - data.start)) / 1000);
            showSecurityWarning(`Demasiados intentos. Por favor espere ${waitSec} segundos.`);
            return false;
        }
        return true;
    }

    /* ══════════════════════════════════════════
       3. HONEYPOT ANTI-BOT
    ══════════════════════════════════════════ */
    function addHoneypot(form) {
        if (!form || form.querySelector('.hp-field')) return;
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:absolute;left:-9999px;opacity:0;height:0;overflow:hidden;';
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.innerHTML = '<input type="text" name="website" class="hp-field" tabindex="-1" autocomplete="off">';
        form.appendChild(wrapper);
    }

    function isHoneypotTripped(form) {
        const hp = form.querySelector('.hp-field');
        return hp && hp.value.length > 0;
    }

    /* ══════════════════════════════════════════
       4. VALIDACIÓN DE FORMULARIOS
    ══════════════════════════════════════════ */
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePhone(phone) {
        return /^[\d\s\+\-\(\)]{7,15}$/.test(phone);
    }

    function validateLength(str, min, max) {
        const len = (str || '').trim().length;
        return len >= min && len <= max;
    }

    /* ══════════════════════════════════════════
       5. PROTECCIÓN DE ENLACES EXTERNOS
    ══════════════════════════════════════════ */
    function hardenExternalLinks() {
        document.querySelectorAll('a[href]').forEach(function (a) {
            const href = a.getAttribute('href') || '';
            const isExternal = href.startsWith('http') && !href.includes(location.hostname);
            if (isExternal || a.getAttribute('target') === '_blank') {
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    /* ══════════════════════════════════════════
       6. PROTECCIÓN CONTRA CLICKJACKING
    ══════════════════════════════════════════ */
    function preventClickjacking() {
        if (window.top !== window.self) {
            // El sitio está siendo cargado dentro de un iframe
            try {
                window.top.location.href = window.self.location.href;
            } catch (e) {
                document.body.innerHTML = '<div style="padding:2rem;text-align:center;font-family:sans-serif"><h1>Acceso no permitido</h1><p>Este sitio no puede cargarse dentro de un marco.</p></div>';
            }
        }
    }

    /* ══════════════════════════════════════════
       7. PROTECCIÓN DE CONSOLA / DEVTOOLS
    ══════════════════════════════════════════ */
    function consoleWarning() {
        const style = 'color: #FF4444; font-size: 1.5rem; font-weight: bold;';
        const style2 = 'color: #333; font-size: 0.9rem;';
        console.log('%c⚠ ADVERTENCIA DE SEGURIDAD', style);
        console.log('%cSi alguien te indicó pegar código aquí, es una estafa. Este es un sitio comunitario oficial. No ingreses ningún comando.', style2);
    }

    /* ══════════════════════════════════════════
       8. SESIÓN SEGURA ADMIN (timeout)
    ══════════════════════════════════════════ */
    const ADMIN_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos
    const SESSION_KEY = 'admin_auth';
    const SESSION_TIME_KEY = 'admin_auth_time';

    function refreshAdminSession() {
        if (sessionStorage.getItem(SESSION_KEY)) {
            sessionStorage.setItem(SESSION_TIME_KEY, Date.now().toString());
        }
    }

    function checkAdminSessionTimeout() {
        if (!sessionStorage.getItem(SESSION_KEY)) return;
        const lastActivity = parseInt(sessionStorage.getItem(SESSION_TIME_KEY) || '0');
        if (Date.now() - lastActivity > ADMIN_TIMEOUT_MS) {
            sessionStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_TIME_KEY);
            const panel = document.getElementById('admin-panel');
            if (panel) {
                panel.style.display = 'none';
                showSecurityWarning('Sesión de administrador expirada por inactividad.');
            }
        }
    }

    /* ══════════════════════════════════════════
       9. PROTECCIÓN CONTRA INYECCIÓN EN URLS
    ══════════════════════════════════════════ */
    function sanitizeURLParams() {
        const params = new URLSearchParams(window.location.search);
        const dangerous = /<|>|javascript:|data:|vbscript:|on\w+=/gi;
        params.forEach(function (value) {
            if (dangerous.test(decodeURIComponent(value))) {
                // Redirigir sin parámetros si hay inyección
                window.location.replace(window.location.pathname);
            }
        });
    }

    /* ══════════════════════════════════════════
       10. CSP DINÁMICA ADICIONAL
    ══════════════════════════════════════════ */
    function enforceCSP() {
        const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!existing) {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline'",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https:",
                "media-src 'self'",
                "connect-src 'self' https://script.google.com",
                "frame-ancestors 'none'"
            ].join('; ');
            document.head.insertBefore(meta, document.head.firstChild);
        }
    }

    /* ══════════════════════════════════════════
       11. UI DE ADVERTENCIA
    ══════════════════════════════════════════ */
    function showSecurityWarning(msg) {
        let toast = document.getElementById('sec-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'sec-toast';
            toast.style.cssText = [
                'position:fixed', 'bottom:1.5rem', 'left:50%',
                'transform:translateX(-50%)', 'background:#C0392B',
                'color:#fff', 'padding:0.75rem 1.5rem', 'border-radius:10px',
                'font-size:0.875rem', 'font-family:sans-serif',
                'z-index:99999', 'box-shadow:0 4px 20px rgba(0,0,0,0.3)',
                'max-width:90vw', 'text-align:center'
            ].join(';');
            document.body.appendChild(toast);
        }
        toast.textContent = '⚠ ' + msg;
        toast.style.display = 'block';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(function () { toast.style.display = 'none'; }, 4000);
    }

    /* ══════════════════════════════════════════
       12. PROTECCIÓN FORMULARIOS DEL SITIO
    ══════════════════════════════════════════ */
    function secureForm(formId, opts) {
        const form = document.getElementById(formId);
        if (!form) return;

        addHoneypot(form);

        form.addEventListener('submit', function (e) {
            // Honeypot check
            if (isHoneypotTripped(form)) {
                e.preventDefault();
                return;
            }

            // Rate limiting
            if (!rateLimitForm(formId, opts.maxSubmits || 3, opts.windowMs || 60000)) {
                e.preventDefault();
                return;
            }

            // Validar campos requeridos
            let valid = true;
            (opts.requiredFields || []).forEach(function (selector) {
                const el = form.querySelector(selector);
                if (!el) return;
                const val = (el.value || '').trim();
                if (!val) {
                    el.style.borderColor = '#C0392B';
                    valid = false;
                } else {
                    el.style.borderColor = '';
                }
            });

            // Email validation
            (opts.emailFields || []).forEach(function (selector) {
                const el = form.querySelector(selector);
                if (!el || !el.value) return;
                if (!validateEmail(el.value)) {
                    el.style.borderColor = '#C0392B';
                    showSecurityWarning('Correo electrónico inválido.');
                    valid = false;
                }
            });

            if (!valid) {
                e.preventDefault();
                showSecurityWarning('Por favor complete todos los campos correctamente.');
            }
        }, true);
    }

    /* ══════════════════════════════════════════
       INICIALIZACIÓN
    ══════════════════════════════════════════ */
    function init() {
        preventClickjacking();
        sanitizeURLParams();
        enforceCSP();
        consoleWarning();

        // Esperar DOM listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onDOMReady);
        } else {
            onDOMReady();
        }
    }

    function onDOMReady() {
        applyInputSanitization();
        hardenExternalLinks();

        // Timeout de sesión admin — revisar cada minuto
        setInterval(checkAdminSessionTimeout, 60000);
        document.addEventListener('click', refreshAdminSession);
        document.addEventListener('keypress', refreshAdminSession);

        // Asegurar formularios conocidos del sitio
        secureForm('eventoForm',  { maxSubmits: 3, windowMs: 120000, requiredFields: ['[name="titulo"]', '[name="fecha"]'] });
        secureForm('quejasForm',  { maxSubmits: 5, windowMs: 120000, requiredFields: ['[name="categoria"]', '[name="descripcion"]'] });
        secureForm('historiaForm',{ maxSubmits: 2, windowMs: 300000, requiredFields: ['[name="nombre"]', '[name="historia"]'], emailFields: ['[name="correo"]'] });
        secureForm('negocioForm', { maxSubmits: 3, windowMs: 120000, requiredFields: ['[name="nombre"]', '[name="categoria"]'] });

        // MutationObserver para defender contra inyección dinámica de scripts
        if (window.MutationObserver) {
            const observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (m) {
                    m.addedNodes.forEach(function (node) {
                        if (node.tagName === 'SCRIPT' && !node.src.includes(location.hostname) && node.src !== '') {
                            const allowed = [
                                'script.google.com',
                                'fonts.googleapis.com'
                            ];
                            const isSafe = allowed.some(function (d) { return node.src.includes(d); });
                            if (!isSafe && node.src) {
                                console.warn('[Security] Script externo bloqueado:', node.src);
                                node.remove();
                            }
                        }
                    });
                });
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }
    }

    init();

    // Exportar utilidades para uso interno
    window.__sec = { sanitize: sanitize, showWarning: showSecurityWarning };

})();
