/*
 * AquaPoás — Observatorio del agua del cantón de Poás (app Android).
 * Datos: Open-Meteo (pronóstico, reanálisis ERA5, GloFAS). Mapa: Leaflet + OpenStreetMap.
 * Guarda la última consulta para poder mostrarla sin conexión.
 */
(function () {
    'use strict';

    var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyW2o0WW2cHvsuCyTqFQ4JxWUt_8Y2BkY666DvZPMRSo50Ox4shR9sz1P7dbDxPMP2z/exec';
    var WHATSAPP = '50687058612';
    var TZ = 'America/Costa_Rica';
    var MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    var C = { deep: '#03045E', blue: '#0077B6', sky: '#00B4D8', mist: '#90E0EF', ok: '#2A9D8F', warn: '#E9C46A', alert: '#F4A261', bad: '#E76F51' };

    var ZONES = [
        { id: 'alta',  name: 'Zona alta', place: 'Volcán y Poasito', lat: 10.170, lon: -84.222, flow: { lat: 10.150, lon: -84.230 } },
        { id: 'media', name: 'Zona media', place: 'San Juan y Sabana Redonda', lat: 10.098, lon: -84.235, flow: { lat: 10.090, lon: -84.245 } },
        { id: 'baja',  name: 'Zona baja', place: 'San Pedro y Carrillos', lat: 10.060, lon: -84.255, flow: { lat: 10.040, lon: -84.270 } }
    ];
    var zone = ZONES[1];
    var mapPoint = null;

    // ─────────── utilidades ───────────
    function $(id) { return document.getElementById(id); }
    function fmt(n, d) {
        if (n == null || isNaN(n)) return '--';
        return Number(n).toLocaleString('es-CR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
    }
    function sum(a) { return a.reduce(function (x, y) { return x + (y || 0); }, 0); }
    function today() { return new Date().toLocaleDateString('en-CA', { timeZone: TZ }); }
    function html(id, v) { var e = $(id); if (e) e.innerHTML = v; }
    function text(id, v) { var e = $(id); if (e) e.textContent = v; }
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function dayLabel(iso) { var p = iso.split('-'); return parseInt(p[2], 10) + ' ' + MESES[parseInt(p[1], 10) - 1]; }
    function store(k, v) { try { localStorage.setItem('aqua:' + k, JSON.stringify({ t: Date.now(), v: v })); } catch (e) {} }
    function load(k) { try { return JSON.parse(localStorage.getItem('aqua:' + k)); } catch (e) { return null; } }

    // Descarga con respaldo: si falla la red, usa lo último guardado.
    function getJSON(url, key) {
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).then(function (d) {
            if (key) store(key, d);
            return d;
        }).catch(function (err) {
            var c = key && load(key);
            if (c) { c.v.__cachedAt = c.t; return c.v; }
            throw err;
        });
    }
    function forecastURL(lat, lon) {
        return 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
            '&current=temperature_2m,relative_humidity_2m,weather_code' +
            '&daily=precipitation_sum,et0_fao_evapotranspiration,precipitation_probability_max' +
            '&hourly=soil_moisture_3_to_9cm&past_days=30&forecast_days=8&timezone=' + encodeURIComponent(TZ);
    }
    function summarize(d) {
        var t = d.daily.time, p = d.daily.precipitation_sum, e = d.daily.et0_fao_evapotranspiration;
        var i = t.indexOf(today()); if (i < 0) i = Math.min(30, t.length - 1);
        var past = p.slice(0, i), et = sum(e.slice(0, i));
        return { idx: i, today: p[i], rain7: sum(past.slice(-7)), rain30: sum(past), et30: et,
            next: p.slice(i + 1), nextDays: t.slice(i + 1), balance: sum(past) - et };
    }
    function status(b) {
        if (b > 50) return { cls: 'ok', txt: 'Recarga favorable', col: C.ok };
        if (b >= 0) return { cls: 'warn', txt: 'Recarga baja', col: C.warn };
        if (b >= -50) return { cls: 'alert', txt: 'Déficit leve', col: C.alert };
        return { cls: 'bad', txt: 'Déficit hídrico', col: C.bad };
    }
    var WEATHER = { 0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado', 45: 'Neblina', 48: 'Neblina',
        51: 'Llovizna', 53: 'Llovizna', 55: 'Llovizna', 61: 'Lluvia', 63: 'Lluvia', 65: 'Lluvia fuerte', 80: 'Chubascos', 81: 'Chubascos',
        82: 'Chubascos fuertes', 95: 'Tormenta', 96: 'Tormenta', 99: 'Tormenta' };

    // ─────────── navegación por pestañas ───────────
    var mapReady = false;
    function show(view) {
        var v = $('v-' + view) ? view : 'inicio';
        document.querySelectorAll('.view').forEach(function (s) { s.hidden = s.id !== 'v-' + v; });
        document.querySelectorAll('.tabbar a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-v') === v); });
        window.scrollTo(0, 0);
        if (v === 'mapa') { if (!mapReady) initMap(); else if (window._map) window._map.invalidateSize(); }
        if (v === 'historico') loadHistory();
    }
    window.addEventListener('hashchange', function () { show(location.hash.slice(1)); });

    // ─────────── época ───────────
    (function () {
        var m = new Date().getMonth();
        text('season', m === 11 || m <= 3 ? '☀️ Época seca: menor recarga y mayor demanda de agua.'
            : m === 6 || m === 7 ? '🌦️ Época lluviosa con posible “veranillo”.'
            : '🌧️ Época lluviosa: principal periodo de recarga de acuíferos.');
    })();

    // ─────────── gráficos SVG ───────────
    function niceStep(v) { var raw = v / 4, mag = Math.pow(10, Math.floor(Math.log10(raw || 1))), r = raw / mag; return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * mag; }
    function bindTip(box) {
        var tip = document.createElement('div'); tip.className = 'tip'; box.appendChild(tip);
        function at(ev) {
            var t = ev.target.closest('[data-tip]'); if (!t) { tip.style.opacity = 0; return; }
            var r = box.getBoundingClientRect();
            tip.textContent = t.getAttribute('data-tip');
            tip.style.left = Math.min(Math.max(ev.clientX - r.left, 70), r.width - 70) + 'px';
            tip.style.top = (ev.clientY - r.top) + 'px'; tip.style.opacity = 1;
        }
        box.addEventListener('click', at); box.addEventListener('mousemove', at);
        box.addEventListener('mouseleave', function () { tip.style.opacity = 0; });
    }
    function bars(box, items, o) {
        o = o || {};
        if (!items.length) { box.innerHTML = '<p class="empty">Sin datos.</p>'; return; }
        var W = 360, H = o.h || 180, L = 28, R = 4, T = 8, B = 22, n = items.length;
        var mx = Math.max.apply(null, items.map(function (i) { return i.v || 0; }).concat(o.line || [], [o.avg || 0, 1]));
        var top = Math.ceil(mx / niceStep(mx)) * niceStep(mx);
        var cw = (W - L - R) / n, bw = Math.max(1.5, cw * .7);
        var y = function (v) { return T + (H - T - B) * (1 - v / top); };
        var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria || 'Gráfico') + '">';
        for (var g = 0; g <= 4; g++) {
            var gy = y(top * g / 4);
            s += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '"/><text class="ax" x="' + (L - 4) + '" y="' + (gy + 3) + '" text-anchor="end">' + Math.round(top * g / 4) + '</text>';
        }
        var every = o.every || Math.ceil(n / 6);
        items.forEach(function (it, i) {
            var x = L + i * cw, v = it.v || 0, yt = y(v);
            s += '<rect x="' + (x + (cw - bw) / 2).toFixed(1) + '" y="' + yt.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0, H - B - yt).toFixed(1) + '" rx="1.5" fill="' + it.c + '"/>';
            s += '<rect x="' + x.toFixed(1) + '" y="' + T + '" width="' + cw.toFixed(1) + '" height="' + (H - T - B) + '" fill="transparent" data-tip="' + esc(it.tip) + '"/>';
            if (it.lab && i % every === 0) s += '<text class="ax" x="' + (x + cw / 2).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + esc(it.lab) + '</text>';
        });
        if (o.line) s += '<polyline points="' + o.line.map(function (v, i) { return (L + i * cw + cw / 2).toFixed(1) + ',' + y(v || 0).toFixed(1); }).join(' ') + '" fill="none" stroke="' + C.alert + '" stroke-width="2" pointer-events="none"/>';
        if (o.avg) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(o.avg) + '" y2="' + y(o.avg) + '" stroke="' + C.alert + '" stroke-width="1.5" stroke-dasharray="5 4" pointer-events="none"/>';
        if (o.mark != null) { var mx2 = L + o.mark * cw; s += '<line x1="' + mx2 + '" x2="' + mx2 + '" y1="' + T + '" y2="' + (H - B) + '" stroke="' + C.deep + '" stroke-opacity=".35" stroke-dasharray="2 3"/><text class="ax" x="' + (mx2 + 3) + '" y="' + (T + 9) + '">hoy</text>'; }
        box.innerHTML = s + '</svg>';
        bindTip(box);
    }
    function gauge(b) {
        // Semicírculo de -100 mm a +150 mm
        var t = Math.max(0, Math.min(1, (b + 100) / 250)), st = status(b);
        var a = Math.PI * (1 - t), cx = 60, cy = 66, r = 46;
        var x = cx + r * Math.cos(a), y = cy - r * Math.sin(a);
        $('gauge').innerHTML = '<svg viewBox="0 0 120 120"><path d="M14 66 A46 46 0 0 1 106 66" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="12" stroke-linecap="round"/>' +
            '<path d="M14 66 A46 46 0 0 1 ' + x.toFixed(1) + ' ' + y.toFixed(1) + '" fill="none" stroke="' + st.col + '" stroke-width="12" stroke-linecap="round"/>' +
            '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7" fill="#fff"/>' +
            '<text x="60" y="92" text-anchor="middle" font-size="22">💧</text></svg>';
    }

    // ─────────── inicio ───────────
    function renderZones() {
        var box = $('zones'); box.innerHTML = '';
        ZONES.forEach(function (z) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'zone'; b.textContent = z.name + ' · ' + z.place;
            b.setAttribute('aria-pressed', z === zone ? 'true' : 'false');
            b.addEventListener('click', function () { if (z !== zone) { zone = z; store('zone', z.id); renderZones(); loadLive(); } });
            box.appendChild(b);
        });
    }

    function loadLive() {
        var z = zone, btn = $('btnRefresh');
        btn.classList.add('spin');
        html('chartDaily', '<p class="empty">Cargando…</p>');
        var p1 = getJSON(forecastURL(z.lat, z.lon), 'fc-' + z.id).then(function (d) {
            if (z !== zone) return;
            var s = summarize(d), c = d.current || {}, st = status(s.balance);
            gauge(s.balance);
            html('kBalance', (s.balance > 0 ? '+' : '') + fmt(s.balance) + ' <small style="font-size:1rem">mm</small>');
            text('kBalanceTxt', st.txt + ' · lluvia ' + fmt(s.rain30) + ' − evap. ' + fmt(s.et30) + ' mm');
            text('kToday', fmt(s.today, 1)); text('kTodaySub', 'mm · ' + (WEATHER[c.weather_code] || 'acumulado'));
            text('k7', fmt(s.rain7)); text('k30', 'mm · 30 días: ' + fmt(s.rain30) + ' mm');
            text('kNext', fmt(sum(s.next)));
            if (s.next.length) { var mi = s.next.indexOf(Math.max.apply(null, s.next)); text('kNextSub', 'mm · pico el ' + dayLabel(s.nextDays[mi])); }
            text('kTemp', fmt(c.temperature_2m)); text('kTempSub', '°C · humedad ' + fmt(c.relative_humidity_2m) + '%');
            if (d.hourly && c.time) {
                var hi = d.hourly.time.indexOf(c.time.slice(0, 13) + ':00'), sm = hi >= 0 ? d.hourly.soil_moisture_3_to_9cm[hi] : null;
                if (sm != null) { var pc = sm * 100; text('kSoil', fmt(pc)); text('kSoilSub', '% · ' + (pc >= 40 ? 'saturado' : pc >= 25 ? 'húmedo' : pc >= 15 ? 'moderado' : 'seco')); }
            }
            bars($('chartDaily'), d.daily.time.map(function (t, i) {
                var fut = i > s.idx, pr = d.daily.precipitation_probability_max && d.daily.precipitation_probability_max[i];
                return { lab: dayLabel(t), v: d.daily.precipitation_sum[i], c: fut ? C.mist : C.blue,
                    tip: dayLabel(t) + ': ' + fmt(d.daily.precipitation_sum[i], 1) + ' mm' + (fut && pr != null ? ' · prob. ' + pr + '%' : '') };
            }), { line: d.daily.et0_fao_evapotranspiration, mark: s.idx, every: 7, aria: 'Lluvia diaria' });
            $('offline').hidden = !d.__cachedAt;
            if (d.__cachedAt) text('offline', 'Sin conexión · datos guardados el ' + new Date(d.__cachedAt).toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'short' }));
        }).catch(function () {
            if (z !== zone) return;
            html('chartDaily', '<p class="empty">No hay conexión ni datos guardados para esta zona.</p>');
            text('kBalanceTxt', 'Sin datos'); $('offline').hidden = false;
        });
        var p2 = getJSON('https://flood-api.open-meteo.com/v1/flood?latitude=' + z.flow.lat + '&longitude=' + z.flow.lon + '&daily=river_discharge&past_days=30&forecast_days=7', 'fl-' + z.id)
            .then(function (d) {
                if (z !== zone) return;
                var t = d.daily.time, q = d.daily.river_discharge, i = t.indexOf(today()); if (i < 0) i = Math.min(30, t.length - 1);
                if (q[i] == null) throw 0;
                var past = q.slice(0, i).filter(function (v) { return v != null; }), avg = past.length ? sum(past) / past.length : 0;
                text('kFlow', fmt(q[i], q[i] < 10 ? 2 : 1));
                text('kFlowSub', 'm³/s' + (avg ? ' · ' + (q[i] >= avg ? '▲ ' : '▼ ') + fmt(Math.abs((q[i] - avg) / avg * 100)) + '% vs. 30 días' : ''));
            }).catch(function () { if (z === zone) text('kFlowSub', 'Sin estimación'); });
        Promise.all([p1, p2].map(function (p) { return p.catch(function () {}); })).then(function () { btn.classList.remove('spin'); });
    }

    // ─────────── temas ───────────
    var TOPICS = [
        ['💦', 'Microcuencas', 'Dónde nace y drena el agua', '<p>Poás forma parte de la <b>subcuenca del río Poás</b>, dentro de la cuenca del <b>río Grande de Tárcoles</b>. Lo que ocurre en las partes altas —uso del suelo, deforestación, agroquímicos— repercute aguas abajo.</p><ul><li>La parte alta funciona como “fábrica de agua”.</li><li>Gestionar por microcuencas ayuda a priorizar dónde proteger.</li></ul>'],
        ['🏞️', 'Ríos', 'El Poás, el Poasito y más', '<p>El <b>río Poás</b> nace en las faldas del volcán y atraviesa el cantón; el <b>Poasito</b> es uno de sus afluentes. Hacia el norte, el macizo también da origen a cabeceras de la vertiente Caribe.</p><ul><li>El indicador de caudal de la app muestra la tendencia del modelo GloFAS.</li></ul>'],
        ['🌊', 'Quebradas', 'Cauces pequeños y sensibles', '<p>Decenas de quebradas drenan las laderas y alimentan al río Poás. Son sensibles a la deforestación, las aguas grises y el relleno con escombros.</p><ul><li>No bloquees ni rellenes cauces: aumenta el riesgo de inundación.</li></ul>'],
        ['⛲', 'Nacientes', 'Manantiales para las ASADAS', '<p>Las nacientes son puntos donde el agua subterránea aflora. Muchas ASADAS del cantón captan agua de ellas, y la ley establece áreas de protección a su alrededor.</p><ul><li>Evitá pastoreo, agroquímicos y construcciones cerca de nacientes.</li></ul>'],
        ['🕳️', 'Acuíferos', 'El agua bajo el volcán', '<p>Bajo el macizo Poás-Barva hay acuíferos volcánicos que abastecen a gran parte de la Gran Área Metropolitana. Sus suelos porosos infiltran mucho, pero los hacen <b>vulnerables a la contaminación</b>.</p>'],
        ['🌧️', 'Zonas de recarga', 'Donde la lluvia se infiltra', '<p>En la parte alta y media del cantón la lluvia y la neblina se infiltran y recargan los acuíferos. El bosque nuboso capta humedad directamente de las nubes.</p><ul><li>Impermeabilizar el suelo reduce la recarga.</li></ul>'],
        ['🧪', 'Calidad del agua', 'Potabilidad y vigilancia', '<p>Los operadores (Municipalidad, ASADAS) vigilan la calidad bajo la rectoría del AyA y el Ministerio de Salud. Los riesgos principales son los nitratos agrícolas y la contaminación por aguas residuales.</p>'],
        ['🌳', 'Reforestación', 'Árboles que cuidan el agua', '<p>Reforestar riberas y zonas de recarga con especies nativas mejora la infiltración y reduce la erosión. Las siembras suelen hacerse al inicio de la época lluviosa.</p>'],
        ['☣️', 'Contaminación', 'Las principales amenazas', '<p>Agroquímicos, aguas residuales sin tratar, residuos en cauces y expansión urbana en zonas sensibles.</p><ul><li>Separá residuos y mantené tu tanque séptico en buen estado.</li></ul>'],
        ['🛡️', 'Protección', 'Cómo cuidamos el recurso', '<p>Áreas protegidas, pago por servicios ambientales, áreas de protección de nacientes y educación ambiental impulsada por ASADAS y organizaciones comunales.</p>']
    ];
    function renderTopics() {
        var box = $('topics');
        TOPICS.forEach(function (t) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'topic';
            b.innerHTML = '<span>' + t[0] + '</span><b>' + t[1] + '</b><small>' + t[2] + '</small>';
            b.addEventListener('click', function () { openModal(t[0] + ' ' + t[1], t[3]); });
            box.appendChild(b);
        });
    }
    function openModal(title, body) { text('modalTitle', title); html('modalBody', body); $('modal').hidden = false; }
    function closeModal() { $('modal').hidden = true; }
    $('modalClose').addEventListener('click', closeModal);
    $('modal').addEventListener('click', function (e) { if (e.target.id === 'modal') closeModal(); });

    // ─────────── mapa ───────────
    function initMap() {
        if (typeof L === 'undefined') return;
        mapReady = true;
        var map = window._map = L.map('map', { zoomControl: false }).setView([10.115, -84.235], 12);
        L.control.zoom({ position: 'topright' }).addTo(map);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
        function dot(c) { return { radius: 9, color: '#fff', weight: 3, fillColor: c, fillOpacity: 1 }; }
        var groups = [
            ['🌋 Parque', true, function (g) {
                L.circle([10.197, -84.230], { radius: 3200, color: C.ok, weight: 1.5, fillOpacity: .12, dashArray: '4 4' }).bindPopup('<b>Parque Nacional Volcán Poás</b><br>Bosque nuboso y páramo: corazón de la recarga. <i>(Área aproximada)</i>').addTo(g);
                L.circleMarker([10.1997, -84.2306], dot(C.bad)).bindPopup('<b>Cráter principal</b><br>Laguna ácida; su actividad puede afectar la calidad del agua.').addTo(g);
                L.circleMarker([10.2045, -84.2275], dot(C.sky)).bindPopup('<b>Laguna Botos</b><br>Cráter inactivo con laguna de agua de lluvia.').addTo(g);
            }],
            ['📡 Monitoreo', true, function (g) {
                ZONES.forEach(function (z) { L.circleMarker([z.lat, z.lon], dot(C.blue)).bindPopup('<b>' + z.name + '</b><br>' + z.place + '<br>Punto de cálculo de los indicadores.').addTo(g); });
            }],
            ['🏘️ Comunidades', false, function (g) {
                [['San Pedro', 10.0756, -84.2425], ['San Juan', 10.0905, -84.2510], ['San Rafael', 10.0640, -84.2690],
                 ['Carrillos', 10.0395, -84.2705], ['Sabana Redonda', 10.1000, -84.2210], ['Poasito', 10.1667, -84.2194]]
                    .forEach(function (p) { L.circleMarker([p[1], p[2]], dot(C.warn)).bindPopup('<b>' + p[0] + '</b><br><i>Ubicación aproximada</i>').addTo(g); });
            }]
        ];
        var bar = $('layers');
        groups.forEach(function (gr) {
            var g = L.layerGroup(); gr[2](g); if (gr[1]) g.addTo(map);
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'chip'; b.textContent = gr[0]; b.setAttribute('aria-pressed', gr[1] ? 'true' : 'false');
            b.addEventListener('click', function () {
                var on = b.getAttribute('aria-pressed') !== 'true';
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
                if (on) g.addTo(map); else map.removeLayer(g);
            });
            bar.appendChild(b);
        });
        var mk = null;
        map.on('click', function (e) {
            var lat = +e.latlng.lat.toFixed(4), lon = +e.latlng.lng.toFixed(4);
            mapPoint = { lat: lat, lon: lon };
            if (mk) mk.setLatLng(e.latlng); else mk = L.circleMarker(e.latlng, dot(C.deep)).addTo(map);
            html('sheetTxt', '<h3>📍 ' + lat + ', ' + lon + '</h3><p class="muted">Consultando…</p>');
            getJSON(forecastURL(lat, lon)).then(function (d) {
                if (!mapPoint || mapPoint.lat !== lat || mapPoint.lon !== lon) return;
                var s = summarize(d), st = status(s.balance);
                html('sheetTxt', '<h3>📍 ' + lat + ', ' + lon + '</h3><div class="kv">' +
                    '<div><span>Elevación</span><b>' + fmt(d.elevation) + ' m</b></div>' +
                    '<div><span>Lluvia hoy</span><b>' + fmt(s.today, 1) + ' mm</b></div>' +
                    '<div><span>Lluvia 7 / 30 días</span><b>' + fmt(s.rain7) + ' / ' + fmt(s.rain30) + ' mm</b></div>' +
                    '<div><span>Próximos días</span><b>' + fmt(sum(s.next)) + ' mm</b></div>' +
                    '<div><span>Balance 30 días</span><b>' + (s.balance > 0 ? '+' : '') + fmt(s.balance) + ' mm</b></div>' +
                    '<div><span>Estado</span><b><i class="dot ' + st.cls + '"></i>' + st.txt + '</b></div></div>' +
                    '<p class="muted" style="margin-top:8px">Podés usar este punto en la pestaña Reportar.</p>');
            }).catch(function () { html('sheetTxt', '<h3>📍 ' + lat + ', ' + lon + '</h3><p class="muted">Sin conexión para consultar este punto.</p>'); });
        });
    }

    // ─────────── histórico ───────────
    var histZone = null;
    function loadHistory() {
        var z = zone;
        text('hZone', z.name + ' · ' + z.place);
        if (histZone === z.id) return;
        histZone = z.id;
        var now = new Date(), y0 = now.getFullYear() - 5;
        var end = new Date(now.getTime() - 6 * 864e5).toLocaleDateString('en-CA', { timeZone: TZ });
        html('chartMonthly', '<p class="empty">Cargando…</p>'); html('chartYearly', '<p class="empty">Cargando…</p>'); html('hStats', '');
        getJSON('https://archive-api.open-meteo.com/v1/archive?latitude=' + z.lat + '&longitude=' + z.lon + '&start_date=' + y0 + '-01-01&end_date=' + end + '&daily=precipitation_sum&timezone=' + encodeURIComponent(TZ), 'hist-' + z.id)
            .then(function (d) { if (z === zone) renderHistory(d.daily.time, d.daily.precipitation_sum, d.daily.time[d.daily.time.length - 1]); })
            .catch(function () { histZone = null; html('chartMonthly', '<p class="empty">Sin conexión para cargar el histórico.</p>'); html('chartYearly', ''); });
    }
    function renderHistory(times, vals, end) {
        var mo = {}, order = [];
        times.forEach(function (t, i) { var k = t.slice(0, 7); if (!(k in mo)) { mo[k] = 0; order.push(k); } mo[k] += vals[i] || 0; });
        var lastFull = end.slice(8, 10) >= '28' ? end.slice(0, 7) : null;
        var full = order.filter(function (k) { return k < end.slice(0, 7) || k === lastFull; });
        var avgM = [];
        for (var m = 1; m <= 12; m++) {
            var mk = (m < 10 ? '0' : '') + m, arr = full.filter(function (k) { return k.slice(5) === mk; }).map(function (k) { return mo[k]; });
            avgM.push(arr.length ? sum(arr) / arr.length : 0);
        }
        bars($('chartMonthly'), order.map(function (k) {
            var mi = parseInt(k.slice(5), 10) - 1, v = mo[k], partial = full.indexOf(k) < 0;
            return { lab: mi === 0 ? k.slice(0, 4) : '', v: v, c: partial ? C.mist : v >= avgM[mi] ? C.blue : C.bad,
                tip: MESES[mi] + ' ' + k.slice(0, 4) + ': ' + fmt(v) + ' mm (prom. ' + fmt(avgM[mi]) + ')' };
        }), { every: 1, aria: 'Lluvia mensual' });
        var yrs = {}, cur = String(new Date().getFullYear());
        order.forEach(function (k) { yrs[k.slice(0, 4)] = (yrs[k.slice(0, 4)] || 0) + mo[k]; });
        var keys = Object.keys(yrs).sort(), past = keys.filter(function (y) { return y !== cur; });
        var avgY = past.length ? sum(past.map(function (y) { return yrs[y]; })) / past.length : 0;
        bars($('chartYearly'), keys.map(function (y) {
            return { lab: y === cur ? y + '*' : y, v: yrs[y], c: y === cur ? C.mist : C.sky, tip: y + ': ' + fmt(yrs[y]) + ' mm' + (y === cur ? ' (en curso)' : '') };
        }), { every: 1, avg: avgY, h: 160, aria: 'Lluvia anual' });
        var wet = past.slice().sort(function (a, b) { return yrs[b] - yrs[a]; })[0], dry = past.slice().sort(function (a, b) { return yrs[a] - yrs[b]; })[0];
        var ytdK = full.filter(function (k) { return k.slice(0, 4) === cur; }), ytd = sum(ytdK.map(function (k) { return mo[k]; }));
        var ytdA = sum(ytdK.map(function (k) { return avgM[parseInt(k.slice(5), 10) - 1]; })), diff = ytdA ? (ytd - ytdA) / ytdA * 100 : 0;
        var cls = diff >= -10 ? 'ok' : diff >= -25 ? 'warn' : 'bad';
        html('hStats', [
            ['📏', 'Promedio anual', fmt(avgY), 'mm · ' + past[0] + '–' + past[past.length - 1]],
            ['💧', 'Año más lluvioso', wet || '--', wet ? fmt(yrs[wet]) + ' mm' : ''],
            ['🏜️', 'Año más seco', dry || '--', dry ? fmt(yrs[dry]) + ' mm' : ''],
            ['📅', cur + ' a la fecha', fmt(ytd), ytdK.length ? '<i class="dot ' + cls + '"></i>' + (diff >= 0 ? '+' : '') + fmt(diff) + '% vs. promedio' : 'mm']
        ].map(function (s) { return '<div class="tile"><span class="t-ic">' + s[0] + '</span><span class="t-lab">' + s[1] + '</span><b>' + s[2] + '</b><small>' + s[3] + '</small></div>'; }).join(''));
    }

    // ─────────── consumo ───────────
    function initCalc() {
        var ids = ['Personas', 'Ducha', 'Inodoro', 'Lavadora', 'Platos', 'Jardin'];
        function v(id) { return parseFloat($('c' + id).value); }
        var saved = load('calc');
        if (saved) Object.keys(saved.v).forEach(function (k) { if ($(k)) $(k).value = saved.v[k]; });
        function upd() {
            var vals = {};
            ids.forEach(function (id) { $('o' + id).textContent = $('c' + id).value; vals['c' + id] = $('c' + id).value; });
            vals.cEquipo = $('cEquipo').value; store('calc', vals);
            var f = parseFloat($('cEquipo').value), p = v('Personas');
            var ducha = v('Ducha') * 10 * f, ino = v('Inodoro') * 9 * f, lav = v('Lavadora') * 70 / 7, pla = v('Platos') * 8 * f, jar = v('Jardin') * 15;
            var hogar = (ducha + ino) * p + lav + pla + jar, per = hogar / p;
            html('rPersona', fmt(per) + ' <small style="font-size:1rem">L/día</small>');
            html('rDia', fmt(hogar) + ' L'); html('rMes', fmt(hogar * 30 / 1000, 1) + ' m³');
            var m = $('rMeter'); m.style.width = Math.min(100, per / 250 * 100) + '%';
            m.style.background = per <= 100 ? 'linear-gradient(90deg,' + C.ok + ',' + C.sky + ')' : per <= 150 ? C.warn : C.bad;
            text('rRef', per <= 100 ? '✅ Dentro de la referencia de 100 L por persona al día (OMS).' : '⚠️ ' + fmt(per - 100) + ' L sobre la referencia de 100 L por persona al día (OMS).');
            var parts = [['la ducha', ducha * p], ['el inodoro', ino * p], ['la lavadora', lav], ['lavar platos', pla], ['riego y lavado', jar]].sort(function (a, b) { return b[1] - a[1]; });
            var tips = ['Tu mayor consumo es <b>' + parts[0][0] + '</b> (' + fmt(parts[0][1] / hogar * 100) + '% del total).'];
            if (v('Ducha') > 5) tips.push('Duchas de 5 minutos ahorrarían unos <b>' + fmt((v('Ducha') - 5) * 10 * f * p * 30 / 1000, 1) + ' m³</b> al mes.');
            if (f === 1) tips.push('Reductores de caudal e inodoro de bajo consumo bajan hasta un 35% el uso interior.');
            if (v('Jardin') > 0) tips.push('Regá temprano o al atardecer y aprovechá el agua de lluvia.');
            if (v('Platos') > 10) tips.push('Enjabonar con el grifo cerrado ahorra cerca de <b>' + fmt((v('Platos') - 10) * 8 * f) + ' L</b> por día.');
            html('rTips', tips.map(function (t) { return '<li>' + t + '</li>'; }).join(''));
        }
        $('calc').addEventListener('input', upd); $('calc').addEventListener('change', upd); upd();
    }

    // ─────────── reportar ───────────
    function clean(s, n) { return s.replace(/<[^>]*>/g, '').replace(/[*_~`[\]]/g, '').trim().slice(0, n); }
    function initReport() {
        var msg = $('rMsg');
        $('rUseMap').addEventListener('click', function () {
            if (!mapPoint) { msg.style.color = C.alert; msg.textContent = 'Primero tocá un punto en la pestaña Mapa.'; return; }
            $('rUbic').value = clean(($('rUbic').value ? $('rUbic').value + ' · ' : '') + 'GPS ' + mapPoint.lat + ', ' + mapPoint.lon, 200);
            msg.textContent = '';
        });
        $('report').addEventListener('submit', function (e) {
            e.preventDefault();
            var tipo = $('rTipo').value, ubic = clean($('rUbic').value, 200), desc = clean($('rDesc').value, 1000);
            var nom = clean($('rNombre').value, 100), con = clean($('rContacto').value, 100);
            if (!desc) { msg.style.color = C.bad; msg.textContent = 'Por favor describí la situación.'; $('rDesc').focus(); return; }
            fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ tipo: 'queja', categoria: 'Agua (app AquaPoás) — ' + tipo, descripcion: desc + (ubic ? '\nUbicación: ' + ubic : ''), nombre: nom, contacto: con })
            }).catch(function () {});
            var t = '💧 REPORTE DEL AGUA — AquaPoás\n\nTipo: ' + tipo + '\n' + (ubic ? 'Ubicación: ' + ubic + '\n' : '') + (nom ? 'Nombre: ' + nom + '\n' : '') + (con ? 'Contacto: ' + con + '\n' : '') + '\nDescripción:\n' + desc;
            window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(t), '_blank');
            msg.style.color = C.ok; msg.textContent = '✅ Reporte enviado. ¡Gracias por cuidar el agua de Poás!';
            $('report').reset();
        });
    }

    // ─────────── inicio de la app ───────────
    var savedZone = load('zone');
    if (savedZone) zone = ZONES.filter(function (z) { return z.id === savedZone.v; })[0] || zone;
    $('btnRefresh').addEventListener('click', function () { histZone = null; loadLive(); if (!$('v-historico').hidden) loadHistory(); });
    window.addEventListener('online', function () { loadLive(); });
    window.addEventListener('offline', function () { $('offline').hidden = false; });
    renderZones();
    renderTopics();
    initCalc();
    initReport();
    loadLive();
    show(location.hash.slice(1) || 'inicio');
})();
