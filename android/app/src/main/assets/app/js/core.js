/*
 * Observatorio del Agua-Poás · Gobernanza del Agua
 * core.js — utilidades compartidas: almacenamiento, red, datos, gráficos,
 * fichas de metadatos y navegación. Todos los módulos cuelgan de window.OA.
 */
(function () {
    'use strict';

    var OA = window.OA = {};
    OA.VERSION = '2.1.2';
    OA.TZ = 'America/Costa_Rica';
    OA.MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    OA.C = { deep: '#03045E', blue: '#0077B6', sky: '#00B4D8', mist: '#90E0EF', ok: '#2A9D8F', warn: '#E9C46A', alert: '#F4A261', bad: '#E76F51' };
    // Datos editables publicados en el sitio; si no hay red se usa la copia incluida en la app.
    OA.DATA_REMOTE = 'https://cesarluiscr.github.io/poas-agua-y-fuego/datos-agua/';
    OA.DATA_LOCAL = 'data/';

    OA.ZONES = [
        { id: 'alta',  name: 'Zona alta',  place: 'Volcán y Poasito',          lat: 10.170, lon: -84.222, flow: { lat: 10.150, lon: -84.230 } },
        { id: 'media', name: 'Zona media', place: 'San Juan y Sabana Redonda', lat: 10.098, lon: -84.235, flow: { lat: 10.090, lon: -84.245 } },
        { id: 'baja',  name: 'Zona baja',  place: 'San Pedro y Carrillos',     lat: 10.060, lon: -84.255, flow: { lat: 10.040, lon: -84.270 } }
    ];
    OA.zone = OA.ZONES[1];

    // ─────────── utilidades ───────────
    OA.$ = function (id) { return document.getElementById(id); };
    OA.fmt = function (n, d) {
        if (n == null || typeof n !== 'number' || !isFinite(n)) return '--';
        return n.toLocaleString('es-CR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
    };
    OA.sum = function (a) { return a.reduce(function (x, y) { return x + (typeof y === 'number' && isFinite(y) ? y : 0); }, 0); };
    OA.esc = function (s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    };
    OA.html = function (id, v) { var e = OA.$(id); if (e) e.innerHTML = v; };
    OA.text = function (id, v) { var e = OA.$(id); if (e) e.textContent = v; };
    OA.today = function () { return new Date().toLocaleDateString('en-CA', { timeZone: OA.TZ }); };
    OA.isoAdd = function (iso, days) { var d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
    OA.lastDayOfMonth = function (ym) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7); return ym + '-' + String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0'); };
    OA.dayLabel = function (iso) { var p = iso.split('-'); return parseInt(p[2], 10) + ' ' + OA.MESES[parseInt(p[1], 10) - 1]; };
    OA.dateLabel = function (iso) { if (!iso) return '—'; var p = iso.slice(0, 10).split('-'); return parseInt(p[2], 10) + ' ' + OA.MESES[parseInt(p[1], 10) - 1] + ' ' + p[0]; };
    OA.stamp = function (t) { return new Date(t).toLocaleString('es-CR', { timeZone: OA.TZ, dateStyle: 'medium', timeStyle: 'short' }); };
    OA.num = function (el, min, max, def) {
        var v = parseFloat(typeof el === 'string' ? OA.$(el).value : el.value);
        if (!isFinite(v)) return def;
        return Math.min(max, Math.max(min, v));
    };

    // ─────────── almacenamiento local (prefijo propio; migra el de versiones previas) ───────────
    var P = 'oap:';
    (function migrate() {
        try {
            for (var i = localStorage.length - 1; i >= 0; i--) {
                var k = localStorage.key(i);
                if (k && k.indexOf('aqua:') === 0) {
                    var nk = P + k.slice(5);
                    if (localStorage.getItem(nk) == null) localStorage.setItem(nk, localStorage.getItem(k));
                    localStorage.removeItem(k);
                }
            }
        } catch (e) {}
    })();
    OA.store = function (k, v) {
        try { localStorage.setItem(P + k, JSON.stringify({ t: Date.now(), v: v })); return true; } catch (e) { return false; }
    };
    OA.load = function (k) { try { return JSON.parse(localStorage.getItem(P + k)); } catch (e) { return null; } };
    OA.wipe = function () {
        try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(P) === 0 || k.indexOf('aqua:') === 0) localStorage.removeItem(k); }); } catch (e) {}
    };

    // ─────────── red ───────────
    OA.fetchT = function (url, opts, ms) {
        var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ms || 20000) : null;
        opts = opts || {};
        if (ctrl) opts.signal = ctrl.signal;
        return fetch(url, opts).finally(function () { if (timer) clearTimeout(timer); });
    };
    /*
     * Descarga JSON con respaldo en caché. Devuelve {data, fetchedAt, cached, stale}.
     * maxAge: antigüedad a partir de la cual el dato guardado se marca como antiguo.
     */
    OA.getJSON = function (url, key, maxAge) {
        return OA.fetchT(url).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).then(function (d) {
            if (d && d.error) throw new Error(d.reason || 'error de la API');
            var now = Date.now();
            if (key) OA.store(key, d);
            return { data: d, fetchedAt: now, cached: false, stale: false };
        }).catch(function (err) {
            var c = key && OA.load(key);
            if (c) return { data: c.v, fetchedAt: c.t, cached: true, stale: maxAge ? (Date.now() - c.t > maxAge) : false };
            throw err;
        });
    };
    // Archivos de datos del observatorio: primero el sitio (actualizable), luego la copia de la app.
    var dataMem = {};
    OA.loadData = function (name) {
        if (dataMem[name]) return dataMem[name];   // una sola descarga por sesión y archivo
        var p = dataMem[name] = loadDataRaw(name);
        p.catch(function () { delete dataMem[name]; });
        return p;
    };
    function loadDataRaw(name) {
        return OA.fetchT(OA.DATA_REMOTE + name + '.json', { cache: 'no-cache' }, 8000)
            .then(function (r) { if (!r.ok) throw 0; return r.json(); })
            .then(function (d) { d.__origen = 'sitio web del observatorio'; OA.store('data-' + name, d); return d; })
            .catch(function () {
                var c = OA.load('data-' + name);
                if (c && c.v) { c.v.__origen = 'copia guardada en el teléfono'; return c.v; }
                return fetch(OA.DATA_LOCAL + name + '.json').then(function (r) { return r.json(); })
                    .then(function (d) { d.__origen = 'copia incluida en la app'; return d; });
            });
    }

    // ─────────── avisos ───────────
    OA.offline = function (msg) {
        var el = OA.$('offline');
        if (!msg) { el.hidden = true; return; }
        el.textContent = msg; el.hidden = false;
    };

    // ─────────── fichas de metadatos ───────────
    OA.meta = {};
    OA.BADGES = {
        obs: ['obs', 'Observado'], est: ['est', 'Estimación'], rea: ['rea', 'Reanálisis'],
        pro: ['pro', 'Pronóstico'], pen: ['pen', 'Por validar'], calc: ['est', 'Cálculo']
    };
    OA.badge = function (t) { var b = OA.BADGES[t] || OA.BADGES.est; return '<span class="badge ' + b[0] + '">' + b[1] + '</span>'; };
    OA.showMeta = function (key) {
        var m = OA.meta[key];
        if (!m) return;
        var rows = [['Tipo de dato', (m.tipos || []).map(OA.badge).join(' ')], ['Fórmula / método', OA.esc(m.formula)], ['Unidad', OA.esc(m.unidad)],
            ['Periodo', OA.esc(m.periodo)], ['Ubicación', OA.esc(m.ubicacion)], ['Actualizado', OA.esc(m.actualizado)],
            ['Fuente', m.fuente], ['Resolución', OA.esc(m.resolucion)], ['Limitaciones', OA.esc(m.limitaciones)]]
            .filter(function (r) { return r[1]; });
        OA.modal(m.titulo, '<table class="tbl kv-tbl">' + rows.map(function (r) { return '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join('') + '</table>');
    };
    document.addEventListener('click', function (e) {
        var b = e.target.closest('[data-meta]');
        if (b) { e.preventDefault(); OA.showMeta(b.getAttribute('data-meta')); }
    });

    // ─────────── modal ───────────
    var lastFocus = null;
    OA.modal = function (title, body) {
        var m = OA.$('modal'), wasOpen = !m.hidden;
        OA.text('modalTitle', title); OA.html('modalBody', body);
        if (!wasOpen) { lastFocus = document.activeElement; m.hidden = false; history.pushState({ modal: true }, ''); }
        OA.$('modalClose').focus();
    };
    // Cerrar = retroceder en el historial, para que el botón Atrás de Android cierre la ficha.
    OA.closeModal = function () { if (!OA.$('modal').hidden) { if (history.state && history.state.modal) history.back(); else hideModal(); } };
    function hideModal() { OA.$('modal').hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
    window.addEventListener('popstate', function () { if (!OA.$('modal').hidden) hideModal(); });
    // Mantener el foco dentro de la ficha abierta
    document.addEventListener('keydown', function (e) {
        var m = OA.$('modal'); if (m.hidden || e.key !== 'Tab') return;
        var f = m.querySelectorAll('button, a[href], input, select, textarea'); if (!f.length) return;
        var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    });

    // ─────────── gráficos SVG ───────────
    function niceStep(v) { var raw = v / 4, mag = Math.pow(10, Math.floor(Math.log10(raw || 1))), r = raw / mag; return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * mag; }
    function bindTip(box) {
        var tip = document.createElement('div'); tip.className = 'tip'; box.appendChild(tip);
        function at(ev) {
            var t = ev.target.closest('[data-tip]'); if (!t) { tip.style.opacity = 0; return; }
            var r = box.getBoundingClientRect();
            tip.textContent = t.getAttribute('data-tip');
            tip.style.left = Math.min(Math.max(ev.clientX - r.left, 80), r.width - 80) + 'px';
            tip.style.top = (ev.clientY - r.top) + 'px'; tip.style.opacity = 1;
        }
        box.addEventListener('click', at); box.addEventListener('mousemove', at);
        box.addEventListener('mouseleave', function () { tip.style.opacity = 0; });
    }
    OA.bars = function (box, items, o) {
        o = o || {};
        if (!items.length) { box.innerHTML = '<p class="empty">Sin datos.</p>'; return; }
        var W = 360, H = o.h || 180, L = 30, R = 4, T = 8, B = 22, n = items.length, C = OA.C;
        var vals = items.map(function (i) { return i.v || 0; }).concat(o.line || [], [o.avg || 0, 1]);
        var mx = Math.max.apply(null, vals.filter(isFinite));
        var top = Math.ceil(mx / niceStep(mx)) * niceStep(mx);
        var cw = (W - L - R) / n, bw = Math.max(1.5, cw * .7);
        var y = function (v) { return T + (H - T - B) * (1 - (v || 0) / top); };
        var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + OA.esc(o.aria || 'Gráfico') + '">';
        for (var g = 0; g <= 4; g++) {
            var gy = y(top * g / 4);
            s += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '"/><text class="ax" x="' + (L - 4) + '" y="' + (gy + 3) + '" text-anchor="end">' + Math.round(top * g / 4) + '</text>';
        }
        var every = o.every || Math.ceil(n / 6);
        items.forEach(function (it, i) {
            var x = L + i * cw, yt = y(it.v);
            if (it.v != null) s += '<rect x="' + (x + (cw - bw) / 2).toFixed(1) + '" y="' + yt.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0, H - B - yt).toFixed(1) + '" rx="1.5" fill="' + it.c + '"/>';
            s += '<rect x="' + x.toFixed(1) + '" y="' + T + '" width="' + cw.toFixed(1) + '" height="' + (H - T - B) + '" fill="transparent" data-tip="' + OA.esc(it.tip) + '"/>';
            if (it.lab && i % every === 0) s += '<text class="ax" x="' + (x + cw / 2).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + OA.esc(it.lab) + '</text>';
        });
        if (o.line) s += '<polyline points="' + o.line.map(function (v, i) { return (L + i * cw + cw / 2).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ') + '" fill="none" stroke="' + C.alert + '" stroke-width="2" pointer-events="none"/>';
        if (o.avg) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(o.avg) + '" y2="' + y(o.avg) + '" stroke="' + C.alert + '" stroke-width="1.5" stroke-dasharray="5 4" pointer-events="none"/>';
        if (o.mark != null) { var mx2 = L + o.mark * cw; s += '<line x1="' + mx2 + '" x2="' + mx2 + '" y1="' + T + '" y2="' + (H - B) + '" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="2 3"/><text class="ax" x="' + (mx2 + 3) + '" y="' + (T + 9) + '">hoy</text>'; }
        box.innerHTML = s + '</svg>';
        bindTip(box);
    };

    // ─────────── navegación ───────────
    OA.onShow = {};   // vista -> función al mostrarse
    OA.onPane = {};   // panel -> función al mostrarse
    OA.show = function (route) {
        lastRoute = route;
        var parts = String(route || '').split('/'), v = parts[0];
        if (!OA.$('v-' + v)) v = 'inicio';
        document.querySelectorAll('.view').forEach(function (s) { s.hidden = s.id !== 'v-' + v; });
        document.querySelectorAll('.tabbar a').forEach(function (a) {
            var on = a.getAttribute('data-v') === v;
            a.classList.toggle('active', on);
            if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        });
        window.scrollTo(0, 0);
        if (parts[1]) OA.pane(v, parts[1]);
        if (OA.onShow[v]) OA.onShow[v]();
    };
    OA.pane = function (view, p) {
        var seg = document.querySelector('#v-' + view + ' .seg');
        if (!seg || !OA.$('p-' + p)) return;
        seg.querySelectorAll('[data-p]').forEach(function (b) {
            var on = b.getAttribute('data-p') === p;
            b.setAttribute('aria-selected', on ? 'true' : 'false');
            OA.$('p-' + b.getAttribute('data-p')).hidden = !on;
        });
        if (OA.onPane[p]) OA.onPane[p]();
    };
    document.addEventListener('click', function (e) {
        var b = e.target.closest('.seg [data-p]');
        if (b) { var v = b.closest('.view').id.slice(2); OA.pane(v, b.getAttribute('data-p')); return; }
        var g = e.target.closest('[data-go]');
        if (g) { e.preventDefault(); location.hash = g.getAttribute('data-go'); }
    });
    var lastRoute = null;
    window.addEventListener('hashchange', function () { var r = location.hash.slice(1); if (r !== lastRoute) OA.show(r); });

    // Puente con la parte nativa (exportar archivos, imprimir a PDF, abrir enlaces)
    OA.nativo = window.ObservatorioNativo || null;
})();
