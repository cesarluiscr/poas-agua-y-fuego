/*
 * observatorio-agua.js — Observatorio Digital del Agua de Poás
 * Módulos: estado hídrico en vivo, mapa del agua, temas, histórico de lluvia,
 * calculadora de consumo y reporte ciudadano.
 * Fuentes: Open-Meteo (forecast, archive ERA5, flood/GloFAS). Sin dependencias salvo Leaflet.
 */
(function () {
    'use strict';

    var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyW2o0WW2cHvsuCyTqFQ4JxWUt_8Y2BkY666DvZPMRSo50Ox4shR9sz1P7dbDxPMP2z/exec';
    var WHATSAPP = '50687058612';
    var TZ = 'America/Costa_Rica';
    var MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

    // Puntos de monitoreo (zonas altitudinales del cantón)
    var ZONES = [
        { id: 'alta',  name: 'Zona alta · Volcán y Poasito', lat: 10.170, lon: -84.222, flow: { lat: 10.150, lon: -84.230 } },
        { id: 'media', name: 'Zona media · San Juan y Sabana Redonda', lat: 10.098, lon: -84.235, flow: { lat: 10.090, lon: -84.245 } },
        { id: 'baja',  name: 'Zona baja · San Pedro y Carrillos', lat: 10.060, lon: -84.255, flow: { lat: 10.040, lon: -84.270 } }
    ];
    var currentZone = ZONES[1];
    var lastMapPoint = null;

    // ───────────────────────── utilidades ─────────────────────────
    function $(id) { return document.getElementById(id); }
    function fmt(n, d) {
        if (n == null || isNaN(n)) return '--';
        return Number(n).toLocaleString('es-CR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
    }
    function sum(arr) { return arr.reduce(function (a, b) { return a + (b || 0); }, 0); }
    function todayCR() { return new Date().toLocaleDateString('en-CA', { timeZone: TZ }); }
    function setHTML(id, html) { var el = $(id); if (el) el.innerHTML = html; }
    function setText(id, txt) { var el = $(id); if (el) el.textContent = txt; }
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function getJSON(url) {
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        });
    }
    function dayLabel(iso) {
        var p = iso.split('-');
        return parseInt(p[2], 10) + ' ' + MESES[parseInt(p[1], 10) - 1];
    }

    function forecastURL(lat, lon) {
        return 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
            '&current=temperature_2m,relative_humidity_2m,precipitation,weather_code' +
            '&daily=precipitation_sum,et0_fao_evapotranspiration,precipitation_probability_max' +
            '&hourly=soil_moisture_3_to_9cm&past_days=30&forecast_days=8&timezone=' + encodeURIComponent(TZ);
    }

    // Resume la respuesta de pronóstico: pasado (30 d), hoy y próximos días.
    function summarize(d) {
        var t = d.daily.time, p = d.daily.precipitation_sum, e = d.daily.et0_fao_evapotranspiration;
        var i = t.indexOf(todayCR());
        if (i < 0) i = Math.min(30, t.length - 1);
        var past = p.slice(0, i), pastEt = e.slice(0, i);
        return {
            idx: i,
            today: p[i],
            rain7: sum(past.slice(-7)),
            rain30: sum(past),
            et30: sum(pastEt),
            next: p.slice(i + 1),
            nextDays: t.slice(i + 1),
            balance: sum(past) - sum(pastEt)
        };
    }

    function balanceStatus(b) {
        if (b > 50)  return { cls: 'ok',    txt: 'Recarga favorable de acuíferos' };
        if (b >= 0)  return { cls: 'warn',  txt: 'Recarga baja' };
        if (b >= -50) return { cls: 'alert', txt: 'Déficit hídrico leve' };
        return { cls: 'bad', txt: 'Déficit hídrico: suelos secándose' };
    }

    // ───────────────────────── época del año ─────────────────────────
    (function season() {
        var m = new Date().getMonth(); // 0-11
        var txt;
        if (m === 11 || m <= 3) txt = '☀️ Época seca (diciembre–abril): menor recarga y mayor demanda de agua';
        else if (m === 6 || m === 7) txt = '🌦️ Época lluviosa con posible “veranillo” (julio–agosto)';
        else txt = '🌧️ Época lluviosa (mayo–noviembre): principal periodo de recarga de acuíferos';
        setText('oaSeason', txt);
    })();

    // ───────────────────────── gráficos SVG ─────────────────────────
    function attachTip(container) {
        var tip = container.querySelector('.oa-tip');
        if (!tip) { tip = document.createElement('div'); tip.className = 'oa-tip'; container.appendChild(tip); }
        container.addEventListener('mousemove', function (ev) {
            var target = ev.target.closest('[data-tip]');
            if (!target) { tip.style.opacity = 0; return; }
            var r = container.getBoundingClientRect();
            tip.textContent = target.getAttribute('data-tip');
            tip.style.left = (ev.clientX - r.left) + 'px';
            tip.style.top = (ev.clientY - r.top) + 'px';
            tip.style.opacity = 1;
        });
        container.addEventListener('mouseleave', function () { tip.style.opacity = 0; });
        // Soporte táctil: tocar una barra muestra su valor
        container.addEventListener('click', function (ev) {
            var target = ev.target.closest('[data-tip]');
            if (!target) return;
            var r = container.getBoundingClientRect();
            tip.textContent = target.getAttribute('data-tip');
            tip.style.left = (ev.clientX - r.left) + 'px';
            tip.style.top = (ev.clientY - r.top) + 'px';
            tip.style.opacity = 1;
        });
    }

    /*
     * Gráfico de barras genérico.
     * items: [{label, value, color, dashed, tip}], opts: {height, line:[values], lineColor, lineTip, labelEvery, avgLine}
     */
    function barChart(container, items, opts) {
        opts = opts || {};
        var W = 760, H = opts.height || 240, padL = 34, padR = 8, padT = 10, padB = 26;
        var n = items.length;
        if (!n) { container.innerHTML = '<div class="oa-empty">Sin datos disponibles.</div>'; return; }
        var maxV = Math.max.apply(null, items.map(function (x) { return x.value || 0; }).concat(opts.line || []).concat([opts.avgLine || 0, 1]));
        var niceMax = Math.ceil(maxV / niceStep(maxV)) * niceStep(maxV);
        var cw = (W - padL - padR) / n, bw = Math.max(2, cw * 0.72);
        var y = function (v) { return padT + (H - padT - padB) * (1 - v / niceMax); };
        var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.aria || 'Gráfico') + '">';
        for (var g = 0; g <= 4; g++) {
            var gv = niceMax * g / 4, gy = y(gv);
            s += '<line class="grid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + gy + '" y2="' + gy + '"/>';
            s += '<text class="ax" x="' + (padL - 5) + '" y="' + (gy + 3) + '" text-anchor="end">' + Math.round(gv) + '</text>';
        }
        var every = opts.labelEvery || Math.ceil(n / 12);
        items.forEach(function (it, i) {
            var x = padL + i * cw + (cw - bw) / 2, v = it.value || 0, top = y(v);
            s += '<rect x="' + x.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0, (H - padB) - top).toFixed(1) +
                '" rx="2" fill="' + (it.color || '#4FC3F7') + '"' + (it.dashed ? ' stroke="#4FC3F7" stroke-dasharray="3 2"' : '') +
                ' data-tip="' + esc(it.tip || (it.label + ': ' + fmt(v, 1))) + '"/>';
            // zona invisible ampliada para facilitar el toque
            s += '<rect x="' + (padL + i * cw).toFixed(1) + '" y="' + padT + '" width="' + cw.toFixed(1) + '" height="' + (H - padT - padB) +
                '" fill="transparent" data-tip="' + esc(it.tip || (it.label + ': ' + fmt(v, 1))) + '"/>';
            if (i % every === 0) {
                s += '<text class="ax" x="' + (padL + i * cw + cw / 2).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(it.label) + '</text>';
            }
        });
        if (opts.line) {
            var pts = opts.line.map(function (v, i) { return (padL + i * cw + cw / 2).toFixed(1) + ',' + y(v || 0).toFixed(1); }).join(' ');
            s += '<polyline points="' + pts + '" fill="none" stroke="' + (opts.lineColor || '#e6c454') + '" stroke-width="2" stroke-linejoin="round" pointer-events="none"/>';
        }
        if (opts.avgLine) {
            var ay = y(opts.avgLine);
            s += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + ay + '" y2="' + ay + '" stroke="#e6c454" stroke-width="1.5" stroke-dasharray="5 4" pointer-events="none"/>';
        }
        if (opts.marker != null) {
            var mx = padL + opts.marker * cw;
            s += '<line x1="' + mx + '" x2="' + mx + '" y1="' + padT + '" y2="' + (H - padB) + '" stroke="rgba(255,255,255,.35)" stroke-dasharray="2 3"/>';
            s += '<text class="ax" x="' + (mx + 4) + '" y="' + (padT + 10) + '">hoy</text>';
        }
        s += '</svg>';
        container.innerHTML = s;
        attachTip(container);
    }
    function niceStep(v) {
        var raw = v / 4, mag = Math.pow(10, Math.floor(Math.log10(raw || 1))), r = raw / mag;
        return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * mag;
    }

    // ───────────────────────── 1. estado en vivo ─────────────────────────
    var codes = { 0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado', 45: 'Neblina', 48: 'Neblina',
        51: 'Llovizna', 53: 'Llovizna', 55: 'Llovizna', 61: 'Lluvia', 63: 'Lluvia', 65: 'Lluvia fuerte', 80: 'Chubascos', 81: 'Chubascos',
        82: 'Chubascos fuertes', 95: 'Tormenta', 96: 'Tormenta', 99: 'Tormenta' };

    function renderZones() {
        var box = $('oaZones');
        box.innerHTML = '';
        ZONES.forEach(function (z) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'oa-zone'; b.textContent = z.name;
            b.setAttribute('aria-pressed', z === currentZone ? 'true' : 'false');
            b.addEventListener('click', function () {
                if (z === currentZone) return;
                currentZone = z; renderZones(); loadLive(); loadHistory();
            });
            box.appendChild(b);
        });
    }

    function resetLive() {
        ['kRainToday', 'kRain7', 'kRainNext', 'kEt0', 'kBalance'].forEach(function (id) { setHTML(id, '--<small> mm</small>'); });
        setHTML('kSoil', '--<small>%</small>'); setHTML('kTemp', '--<small>°C</small>'); setHTML('kFlow', '--<small> m³/s</small>');
        $('chartDaily').innerHTML = '<div class="oa-empty">Cargando datos…</div>';
    }

    function loadLive() {
        var z = currentZone;
        resetLive();
        getJSON(forecastURL(z.lat, z.lon)).then(function (d) {
            if (z !== currentZone) return;
            var s = summarize(d), c = d.current || {};
            setHTML('kRainToday', fmt(s.today, 1) + '<small> mm</small>');
            setText('kRainTodaySub', (codes[c.weather_code] || 'Acumulado del día') + ' · ' + fmt(d.elevation) + ' m s.n.m.');
            setHTML('kRain7', fmt(s.rain7, 0) + '<small> mm</small>');
            setText('kRain30', '30 días: ' + fmt(s.rain30, 0) + ' mm');
            setHTML('kRainNext', fmt(sum(s.next), 0) + '<small> mm</small>');
            if (s.next.length) {
                var mi = s.next.indexOf(Math.max.apply(null, s.next));
                setText('kRainNextSub', 'Día más lluvioso: ' + dayLabel(s.nextDays[mi]) + ' (' + fmt(s.next[mi], 0) + ' mm)');
            }
            setHTML('kEt0', fmt(s.et30, 0) + '<small> mm</small>');
            setHTML('kBalance', (s.balance > 0 ? '+' : '') + fmt(s.balance, 0) + '<small> mm</small>');
            var st = balanceStatus(s.balance);
            setHTML('kBalanceSub', '<span class="oa-light ' + st.cls + '"></span>' + st.txt);
            setHTML('kTemp', fmt(c.temperature_2m, 0) + '<small>°C</small>');
            setText('kTempSub', 'Humedad relativa: ' + fmt(c.relative_humidity_2m) + '%');

            // Humedad del suelo a la hora actual
            if (d.hourly && d.hourly.soil_moisture_3_to_9cm && c.time) {
                var hk = c.time.slice(0, 13) + ':00', hi = d.hourly.time.indexOf(hk);
                var sm = hi >= 0 ? d.hourly.soil_moisture_3_to_9cm[hi] : null;
                if (sm != null) {
                    var pct = sm * 100;
                    setHTML('kSoil', fmt(pct, 0) + '<small>%</small>');
                    setText('kSoilSub', 'Capa de 3 a 9 cm · ' + (pct >= 40 ? 'suelo saturado' : pct >= 25 ? 'suelo húmedo' : pct >= 15 ? 'suelo moderado' : 'suelo seco'));
                }
            }

            // Gráfico diario
            var items = d.daily.time.map(function (t, i) {
                var fut = i > s.idx;
                var prob = d.daily.precipitation_probability_max ? d.daily.precipitation_probability_max[i] : null;
                return {
                    label: dayLabel(t), value: d.daily.precipitation_sum[i] || 0,
                    color: fut ? 'rgba(79,195,247,.35)' : '#4FC3F7', dashed: fut,
                    tip: dayLabel(t) + ': ' + fmt(d.daily.precipitation_sum[i], 1) + ' mm' + (fut && prob != null ? ' · prob. ' + prob + '%' : '') +
                        ' · ET₀ ' + fmt(d.daily.et0_fao_evapotranspiration[i], 1) + ' mm'
                };
            });
            barChart($('chartDaily'), items, { line: d.daily.et0_fao_evapotranspiration, marker: s.idx, labelEvery: 4, aria: 'Lluvia diaria' });
        }).catch(function () {
            if (z !== currentZone) return;
            $('chartDaily').innerHTML = '<div class="oa-empty">No se pudieron cargar los datos meteorológicos. Intentá de nuevo más tarde.</div>';
        });

        getJSON('https://flood-api.open-meteo.com/v1/flood?latitude=' + z.flow.lat + '&longitude=' + z.flow.lon +
            '&daily=river_discharge&past_days=30&forecast_days=7').then(function (d) {
            if (z !== currentZone) return;
            var t = d.daily.time, q = d.daily.river_discharge;
            var i = t.indexOf(todayCR()); if (i < 0) i = Math.min(30, t.length - 1);
            var now = q[i];
            if (now == null) throw new Error('sin caudal');
            var past = q.slice(0, i).filter(function (v) { return v != null; });
            var avg = past.length ? sum(past) / past.length : null;
            setHTML('kFlow', fmt(now, now < 10 ? 2 : 1) + '<small> m³/s</small>');
            if (avg) {
                var diff = (now - avg) / avg * 100;
                setText('kFlowSub', (diff >= 0 ? '▲ ' : '▼ ') + fmt(Math.abs(diff)) + '% vs. promedio de 30 días · GloFAS');
            }
        }).catch(function () {
            if (z !== currentZone) return;
            setText('kFlowSub', 'Sin estimación disponible para este punto');
        });
    }

    // ───────────────────────── 2. mapa ─────────────────────────
    function initMap() {
        if (typeof L === 'undefined' || !$('oaMap')) {
            if ($('oaMap')) $('oaMap').innerHTML = '<div class="oa-empty">No se pudo cargar el mapa.</div>';
            return;
        }
        var map = L.map('oaMap', { scrollWheelZoom: false }).setView([10.115, -84.235], 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18, attribution: '&copy; colaboradores de OpenStreetMap'
        }).addTo(map);

        function dot(color) {
            return { radius: 8, color: '#fff', weight: 2, fillColor: color, fillOpacity: .95 };
        }

        var layers = [
            {
                name: 'Parque Nacional Volcán Poás', color: '#26A69A', on: true,
                build: function () {
                    var g = L.layerGroup();
                    L.circle([10.197, -84.230], { radius: 3200, color: '#26A69A', weight: 1.5, fillOpacity: .12, dashArray: '4 4' })
                        .bindPopup('<strong>Parque Nacional Volcán Poás</strong><br>Bosque nuboso y páramo que capturan la humedad de la neblina: corazón de la recarga del acuífero Poás. <em>(Área aproximada)</em>').addTo(g);
                    L.circleMarker([10.1997, -84.2306], dot('#ef4444')).bindPopup('<strong>Cráter principal del Poás</strong><br>Laguna ácida caliente; su actividad volcánica puede afectar la calidad del agua y los cultivos por lluvia ácida y ceniza.').addTo(g);
                    L.circleMarker([10.2045, -84.2275], dot('#4FC3F7')).bindPopup('<strong>Laguna Botos</strong><br>Cráter inactivo convertido en laguna de agua fría y lluvia, rodeada de bosque nuboso.').addTo(g);
                    return g;
                }
            },
            {
                name: 'Puntos de monitoreo del observatorio', color: '#4FC3F7', on: true,
                build: function () {
                    var g = L.layerGroup();
                    ZONES.forEach(function (z) {
                        L.circleMarker([z.lat, z.lon], dot('#4FC3F7'))
                            .bindPopup('<strong>' + esc(z.name) + '</strong><br>Punto de cálculo de los indicadores en vivo.<br><a href="#vivo" data-zone="' + z.id + '">Ver indicadores →</a>')
                            .addTo(g);
                    });
                    return g;
                }
            },
            {
                name: 'Distritos y comunidades (ASADAS)', color: '#e6c454', on: false,
                build: function () {
                    var g = L.layerGroup();
                    [
                        ['San Pedro (cabecera)', 10.0756, -84.2425, 'Centro del cantón; servicio del acueducto municipal.'],
                        ['San Juan', 10.0905, -84.2510, 'ASADAS San Juan Norte y Calle Liles.'],
                        ['San Rafael', 10.0640, -84.2690, 'Zona media-baja con quebradas que drenan al río Poás.'],
                        ['Carrillos', 10.0395, -84.2705, 'Zona baja, límite con la cuenca del río Grande de Tárcoles.'],
                        ['Sabana Redonda', 10.1000, -84.2210, 'Zona media-alta de recarga, agricultura y lechería.'],
                        ['Poasito', 10.1667, -84.2194, 'ASADA Poasito; zona alta cercana al Parque Nacional.']
                    ].forEach(function (p) {
                        L.circleMarker([p[1], p[2]], dot('#e6c454')).bindPopup('<strong>' + p[0] + '</strong><br>' + p[3] + ' <em>(ubicación aproximada)</em>').addTo(g);
                    });
                    return g;
                }
            }
        ];

        var box = $('oaLayers');
        layers.forEach(function (ly) {
            ly.group = ly.build();
            if (ly.on) ly.group.addTo(map);
            var lab = document.createElement('label');
            lab.className = 'oa-layer';
            lab.innerHTML = '<input type="checkbox"' + (ly.on ? ' checked' : '') + '><span class="oa-swatch" style="background:' + ly.color + '"></span>' + esc(ly.name);
            lab.querySelector('input').addEventListener('change', function (e) {
                if (e.target.checked) ly.group.addTo(map); else map.removeLayer(ly.group);
            });
            box.appendChild(lab);
        });

        map.on('popupopen', function (e) {
            var a = e.popup.getElement().querySelector('[data-zone]');
            if (a) a.addEventListener('click', function () {
                var z = ZONES.filter(function (x) { return x.id === a.getAttribute('data-zone'); })[0];
                if (z && z !== currentZone) { currentZone = z; renderZones(); loadLive(); loadHistory(); }
            });
        });

        var clickMarker = null;
        map.on('click', function (e) {
            var lat = +e.latlng.lat.toFixed(4), lon = +e.latlng.lng.toFixed(4);
            lastMapPoint = { lat: lat, lon: lon };
            if (clickMarker) clickMarker.setLatLng(e.latlng); else clickMarker = L.circleMarker(e.latlng, dot('#ffffff')).addTo(map);
            setHTML('oaPoint', '<strong>Punto ' + lat + ', ' + lon + '</strong><br>Consultando…');
            getJSON(forecastURL(lat, lon)).then(function (d) {
                if (!lastMapPoint || lastMapPoint.lat !== lat || lastMapPoint.lon !== lon) return;
                var s = summarize(d), st = balanceStatus(s.balance);
                setHTML('oaPoint',
                    '<strong>Punto ' + lat + ', ' + lon + '</strong><br>' +
                    '⛰️ Elevación: ' + fmt(d.elevation) + ' m<br>' +
                    '🌧️ Lluvia hoy: ' + fmt(s.today, 1) + ' mm<br>' +
                    '☔ 7 días: ' + fmt(s.rain7) + ' mm · 30 días: ' + fmt(s.rain30) + ' mm<br>' +
                    '🔮 Próximos días: ' + fmt(sum(s.next)) + ' mm<br>' +
                    '⚖️ Balance 30 d: ' + (s.balance > 0 ? '+' : '') + fmt(s.balance) + ' mm<br>' +
                    '<span class="oa-light ' + st.cls + '"></span>' + st.txt);
            }).catch(function () {
                setHTML('oaPoint', '<strong>Punto ' + lat + ', ' + lon + '</strong><br>No se pudieron obtener datos para este punto.');
            });
        });
    }

    // ───────────────────────── 3. temas ─────────────────────────
    var TOPICS = [
        { ic: '💦', name: 'Microcuencas', short: 'Unidades de drenaje que nacen en el macizo.',
          body: '<p>Una microcuenca es el territorio que drena hacia un mismo cauce. Poás forma parte de la <strong>subcuenca del río Poás</strong>, dentro de la gran cuenca del <strong>río Grande de Tárcoles</strong>, una de las más pobladas del país. Lo que ocurre en las partes altas —uso del suelo, deforestación, agroquímicos— repercute aguas abajo.</p><ul><li>Gestionar por microcuencas permite priorizar dónde proteger y reforestar.</li><li>La parte alta funciona como “fábrica de agua”; la baja como receptora.</li></ul>' },
        { ic: '🏞️', name: 'Ríos', short: 'El Poás, el Poasito y sus afluentes.',
          body: '<p>El <strong>río Poás</strong> nace en las faldas del volcán y atraviesa el cantón de norte a sur; el <strong>río Poasito</strong> es uno de sus afluentes importantes. Hacia el norte, el macizo también da origen a cabeceras de la vertiente Caribe, como el Sarapiquí y el Toro.</p><ul><li>El indicador de <em>caudal estimado</em> de este observatorio muestra la tendencia del modelo GloFAS.</li><li>Las riberas requieren zonas de protección según la Ley Forestal.</li></ul>' },
        { ic: '🌊', name: 'Quebradas', short: 'Pequeños cauces que recargan los ríos.',
          body: '<p>Decenas de quebradas drenan las laderas del cantón y alimentan al río Poás. Son muy sensibles a la deforestación, los vertidos de aguas grises y el relleno con escombros, y en temporada lluviosa pueden crecer rápidamente.</p><ul><li>No bloquear ni rellenar cauces: aumenta el riesgo de inundación.</li><li>Reportá vertidos en la sección <a href="#reportar">Reportar</a>.</li></ul>' },
        { ic: '⛲', name: 'Nacientes', short: 'Manantiales que abastecen a las ASADAS.',
          body: '<p>Las nacientes son puntos donde el agua subterránea aflora a la superficie. Muchas de las ASADAS del cantón captan agua directamente de ellas. La legislación costarricense establece un área de protección alrededor de las nacientes captadas para consumo humano.</p><ul><li>Evitá pastoreo, agroquímicos y construcciones cerca de nacientes.</li><li>Conocé las ASADAS en <a href="patrimonio-hidrico.html">Patrimonio Hídrico</a>.</li></ul>' },
        { ic: '🕳️', name: 'Acuíferos', short: 'Reservas subterráneas Poás, Colima y Barva.',
          body: '<p>Bajo el macizo Poás-Barva se encuentran acuíferos volcánicos que abastecen a buena parte de la Gran Área Metropolitana. Los suelos volcánicos porosos permiten una gran infiltración, pero también hacen que el agua subterránea sea <strong>vulnerable a la contaminación</strong> por nitratos y agroquímicos.</p><ul><li>El balance hídrico del observatorio es un indicador simple de las condiciones de recarga.</li></ul>' },
        { ic: '🌧️', name: 'Zonas de recarga', short: 'Donde la lluvia se infiltra al subsuelo.',
          body: '<p>Las zonas de recarga son áreas —principalmente en la parte alta y media del cantón— donde la lluvia y la neblina se infiltran y alimentan los acuíferos. El bosque nuboso del Parque Nacional capta además humedad directamente de las nubes.</p><ul><li>Impermeabilizar el suelo (construcción, compactación) reduce la recarga.</li><li>El Plan Regulador define restricciones para estas zonas: <a href="plan-regulador.html">ver Plan Regulador</a>.</li></ul>' },
        { ic: '🧪', name: 'Calidad del agua', short: 'Potabilidad y salud de los cuerpos de agua.',
          body: '<p>La calidad del agua potable es vigilada por los operadores (Municipalidad, ASADAS) bajo la rectoría del AyA y el Ministerio de Salud. Los principales riesgos en el cantón son los nitratos de origen agrícola, la contaminación bacteriológica por aguas residuales y, eventualmente, la afectación por actividad volcánica.</p><ul><li>Si el agua de tu casa cambia de color, olor o sabor, reportalo a tu operador.</li></ul>' },
        { ic: '🛡️', name: 'Proyectos de protección', short: 'Conservación de nacientes y cauces.',
          body: '<p>La protección del agua en Poás combina áreas silvestres protegidas, la compra o el pago por servicios ambientales de terrenos en zonas de recarga, la delimitación de áreas de protección de nacientes y la educación ambiental impulsada por ASADAS, municipalidad y organizaciones comunales.</p><ul><li>¿Tu comunidad tiene un proyecto? Escribinos para incluirlo en el observatorio.</li></ul>' },
        { ic: '🌳', name: 'Reforestación', short: 'Árboles para asegurar el agua futura.',
          body: '<p>Reforestar riberas y zonas de recarga con especies nativas mejora la infiltración, reduce la erosión y protege la calidad del agua. Las campañas de siembra suelen realizarse al inicio de la época lluviosa (mayo–junio).</p><ul><li>Consultá actividades en <a href="eventos.html">Eventos</a> y <a href="ecologia.html">Ecología</a>.</li></ul>' },
        { ic: '☣️', name: 'Contaminación', short: 'Agroquímicos, aguas residuales y residuos.',
          body: '<p>Las principales presiones sobre el agua del cantón son el uso intensivo de agroquímicos en cultivos y pastos, las aguas residuales sin tratamiento adecuado, los residuos sólidos en cauces y la expansión urbana en zonas sensibles.</p><ul><li>Separá residuos y nunca los deposités en quebradas.</li><li>Mantené tu tanque séptico en buen estado.</li></ul>' },
        { ic: '📣', name: 'Denuncias ambientales', short: 'Reportá afectaciones al recurso hídrico.',
          body: '<p>Podés reportar fugas, vertidos, tala en zonas de recarga o afectaciones a nacientes desde el <a href="#reportar">formulario del observatorio</a>. Para denuncias formales ante el Estado usá el sistema <a href="https://sitada.minae.go.cr" target="_blank" rel="noopener noreferrer">SITADA del MINAE</a>.</p>' },
        { ic: '📊', name: 'Datos históricos', short: 'Evolución de la lluvia en el tiempo.',
          body: '<p>La sección <a href="#historico">Histórico</a> muestra la lluvia mensual y anual de los últimos cinco años en la zona seleccionada, comparada con el promedio. Esto ayuda a identificar años secos (por ejemplo, bajo influencia de El Niño) y a planificar el uso del agua.</p>' }
    ];

    function renderTopics() {
        var box = $('oaTopics'), det = $('oaTopicDetail');
        TOPICS.forEach(function (t, i) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'oa-topic'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'oaTopicDetail');
            b.innerHTML = '<span class="t-ic">' + t.ic + '</span><span class="t-name">' + t.name + '</span><span class="t-short">' + t.short + '</span>';
            b.addEventListener('click', function () {
                var open = b.getAttribute('aria-expanded') === 'true';
                box.querySelectorAll('.oa-topic').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
                if (open) { det.hidden = true; return; }
                b.setAttribute('aria-expanded', 'true');
                det.innerHTML = '<h3>' + t.ic + ' ' + t.name + '</h3>' + t.body;
                det.hidden = false;
                det.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
            box.appendChild(b);
        });
    }

    // ───────────────────────── 4. histórico ─────────────────────────
    var histCache = {};
    function loadHistory() {
        var z = currentZone;
        var now = new Date(), y0 = now.getFullYear() - 5;
        var end = new Date(now.getTime() - 6 * 864e5).toLocaleDateString('en-CA', { timeZone: TZ });
        $('chartMonthly').innerHTML = '<div class="oa-empty">Cargando histórico…</div>';
        $('chartYearly').innerHTML = '<div class="oa-empty">Cargando histórico…</div>';
        $('oaHistStats').innerHTML = '';
        var p = histCache[z.id] || getJSON('https://archive-api.open-meteo.com/v1/archive?latitude=' + z.lat + '&longitude=' + z.lon +
            '&start_date=' + y0 + '-01-01&end_date=' + end + '&daily=precipitation_sum&timezone=' + encodeURIComponent(TZ));
        histCache[z.id] = p;
        p.then(function (d) {
            if (z !== currentZone) return;
            renderHistory(d.daily.time, d.daily.precipitation_sum, end);
        }).catch(function () {
            delete histCache[z.id];
            if (z !== currentZone) return;
            $('chartMonthly').innerHTML = $('chartYearly').innerHTML = '<div class="oa-empty">No se pudo cargar el histórico. Intentá de nuevo más tarde.</div>';
        });
    }

    function renderHistory(times, vals, end) {
        var months = {}, order = [];
        times.forEach(function (t, i) {
            var k = t.slice(0, 7);
            if (!(k in months)) { months[k] = 0; order.push(k); }
            months[k] += vals[i] || 0;
        });
        // El último mes puede estar incompleto: solo meses completos para promedios
        var lastComplete = end.slice(8, 10) >= '28' ? end.slice(0, 7) : null;
        var complete = order.filter(function (k) { return k < end.slice(0, 7) || k === lastComplete; });

        var avgByMonth = [];
        for (var m = 1; m <= 12; m++) {
            var mk = (m < 10 ? '0' : '') + m;
            var arr = complete.filter(function (k) { return k.slice(5) === mk; }).map(function (k) { return months[k]; });
            avgByMonth.push(arr.length ? sum(arr) / arr.length : 0);
        }

        var items = order.map(function (k) {
            var mi = parseInt(k.slice(5), 10) - 1, v = months[k], a = avgByMonth[mi];
            var partial = complete.indexOf(k) < 0;
            return {
                label: mi === 0 ? k.slice(0, 4) : '',
                value: v,
                color: partial ? 'rgba(79,195,247,.35)' : (v >= a ? '#4FC3F7' : '#f97316'),
                tip: MESES[mi] + ' ' + k.slice(0, 4) + ': ' + fmt(v) + ' mm (promedio ' + fmt(a) + ' mm)' + (partial ? ' · mes en curso' : '')
            };
        });
        barChart($('chartMonthly'), items, { labelEvery: 1, aria: 'Lluvia mensual', height: 230 });
        setHTML('oaHistLegend', '<span><i style="background:#4FC3F7"></i>Sobre el promedio del mes</span><span><i style="background:#f97316"></i>Bajo el promedio</span>');

        // Totales anuales
        var years = {}, thisYear = String(new Date().getFullYear());
        order.forEach(function (k) { var yy = k.slice(0, 4); years[yy] = (years[yy] || 0) + months[k]; });
        var yKeys = Object.keys(years).sort();
        var full = yKeys.filter(function (yy) { return yy !== thisYear; });
        var avgYear = full.length ? sum(full.map(function (yy) { return years[yy]; })) / full.length : 0;
        barChart($('chartYearly'), yKeys.map(function (yy) {
            return { label: yy + (yy === thisYear ? '*' : ''), value: years[yy], color: yy === thisYear ? 'rgba(79,195,247,.35)' : '#26A69A',
                tip: yy + ': ' + fmt(years[yy]) + ' mm' + (yy === thisYear ? ' (año en curso)' : '') };
        }), { labelEvery: 1, avgLine: avgYear, aria: 'Lluvia anual', height: 200 });

        // Estadísticas
        var wettest = full.slice().sort(function (a, b) { return years[b] - years[a]; })[0];
        var driest = full.slice().sort(function (a, b) { return years[a] - years[b]; })[0];
        // Año en curso vs promedio de los mismos meses completos
        var ytdKeys = complete.filter(function (k) { return k.slice(0, 4) === thisYear; });
        var ytd = sum(ytdKeys.map(function (k) { return months[k]; }));
        var ytdAvg = sum(ytdKeys.map(function (k) { return avgByMonth[parseInt(k.slice(5), 10) - 1]; }));
        var diff = ytdAvg ? (ytd - ytdAvg) / ytdAvg * 100 : 0;
        var stats = [
            ['Promedio anual', fmt(avgYear) + '<small> mm</small>', full[0] + '–' + full[full.length - 1]],
            ['Año más lluvioso', wettest || '--', wettest ? fmt(years[wettest]) + ' mm' : ''],
            ['Año más seco', driest || '--', driest ? fmt(years[driest]) + ' mm' : ''],
            ['Año ' + thisYear + ' a la fecha', fmt(ytd) + '<small> mm</small>',
                ytdKeys.length ? '<span class="oa-light ' + (diff >= -10 ? 'ok' : diff >= -25 ? 'warn' : 'bad') + '"></span>' + (diff >= 0 ? '+' : '') + fmt(diff) + '% vs. promedio de ' + ytdKeys.length + ' meses' : 'Sin meses completos']
        ];
        setHTML('oaHistStats', stats.map(function (s) {
            return '<div class="oa-card"><div class="oa-label">' + s[0] + '</div><div class="oa-value">' + s[1] + '</div><div class="oa-sub">' + s[2] + '</div></div>';
        }).join(''));
    }

    // ───────────────────────── 5. calculadora ─────────────────────────
    function initCalc() {
        var ids = ['Personas', 'Ducha', 'Inodoro', 'Lavadora', 'Platos', 'Jardin'];
        function v(id) { return parseFloat($('c' + id).value); }
        function update() {
            ids.forEach(function (id) { $('o' + id).textContent = $('c' + id).value; });
            var f = parseFloat($('cEquipo').value), p = v('Personas');
            var ducha = v('Ducha') * 10 * f, inodoro = v('Inodoro') * 9 * f;
            var lav = v('Lavadora') * 70 / 7, platos = v('Platos') * 8 * f, jardin = v('Jardin') * 15;
            var hogar = (ducha + inodoro) * p + lav + platos + jardin, persona = hogar / p;
            $('rPersona').innerHTML = fmt(persona) + '<small style="font-size:1rem"> L/día</small>';
            $('rDia').innerHTML = fmt(hogar) + '<small> L</small>';
            $('rMes').innerHTML = fmt(hogar * 30 / 1000, 1) + '<small> m³</small>';
            $('rMeter').style.width = Math.min(100, persona / 250 * 100) + '%';
            $('rMeter').style.background = persona <= 100 ? 'linear-gradient(90deg,#26A69A,#4FC3F7)' : persona <= 150 ? '#eab308' : '#ef4444';
            $('rRef').textContent = persona <= 100 ? '✅ Dentro de la referencia de 100 L por persona al día (OMS).'
                : '⚠️ ' + fmt(persona - 100) + ' L por encima de la referencia de 100 L por persona al día (OMS).';
            var parts = [['la ducha', ducha * p], ['el inodoro', inodoro * p], ['la lavadora', lav], ['lavar platos', platos], ['riego y lavado', jardin]]
                .sort(function (a, b) { return b[1] - a[1]; });
            var tips = ['Tu mayor consumo es <strong>' + parts[0][0] + '</strong> (' + fmt(parts[0][1] / hogar * 100) + '% del total).'];
            if (v('Ducha') > 5) tips.push('Reducir la ducha a 5 minutos ahorraría unos ' + fmt((v('Ducha') - 5) * 10 * f * p * 30 / 1000, 1) + ' m³ al mes.');
            if (f === 1) tips.push('Instalar reductores de caudal e inodoro de bajo consumo puede bajar hasta un 35% el uso interior.');
            if (v('Jardin') > 0) tips.push('Regá temprano o al atardecer y usá agua de lluvia recolectada.');
            if (v('Platos') > 10) tips.push('Enjabonar con el grifo cerrado ahorra cerca de ' + fmt((v('Platos') - 10) * 8 * f) + ' L por día.');
            $('rTips').innerHTML = tips.map(function (t) { return '<li>' + t + '</li>'; }).join('');
        }
        $('oaCalc').addEventListener('input', update);
        $('oaCalc').addEventListener('change', update);
        update();
    }

    // ───────────────────────── 6. reporte ciudadano ─────────────────────────
    function clean(s, max) { return s.replace(/<[^>]*>/g, '').replace(/[*_~`[\]]/g, '').trim().slice(0, max); }
    function initReport() {
        $('rUseMap').addEventListener('click', function () {
            if (!lastMapPoint) {
                $('rMsg').style.color = '#e6c454';
                $('rMsg').textContent = 'Primero tocá un punto en el mapa del agua.';
                return;
            }
            var u = $('rUbic');
            u.value = clean((u.value ? u.value + ' · ' : '') + 'GPS ' + lastMapPoint.lat + ', ' + lastMapPoint.lon, 200);
            $('rMsg').textContent = '';
        });
        $('oaReport').addEventListener('submit', function (e) {
            e.preventDefault();
            var tipo = $('rTipo').value, ubic = clean($('rUbic').value, 200), desc = clean($('rDesc').value, 1000);
            var nombre = clean($('rNombre').value, 100), contacto = clean($('rContacto').value, 100);
            var msg = $('rMsg');
            if (!desc) { msg.style.color = '#f97316'; msg.textContent = 'Por favor describí la situación.'; $('rDesc').focus(); return; }

            fetch(APPS_SCRIPT_URL, {
                method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ tipo: 'queja', categoria: 'Agua — ' + tipo, descripcion: desc + (ubic ? '\nUbicación: ' + ubic : ''), nombre: nombre, contacto: contacto })
            }).catch(function () {});

            var text = '💧 REPORTE DEL AGUA — Observatorio Poás\n\nTipo: ' + tipo + '\n' + (ubic ? 'Ubicación: ' + ubic + '\n' : '') +
                (nombre ? 'Nombre: ' + nombre + '\n' : '') + (contacto ? 'Contacto: ' + contacto + '\n' : '') + '\nDescripción:\n' + desc;
            window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
            msg.style.color = '#7BE495';
            msg.textContent = '✅ Reporte registrado. ¡Gracias por cuidar el agua de Poás!';
            $('oaReport').reset();
        });
    }

    // ───────────────────────── navegación ─────────────────────────
    function initNav() {
        var hamburger = $('hamburger'), mobileNav = $('mobileNav');
        function closeMobileNav() {
            if (!hamburger || !mobileNav) return;
            hamburger.classList.remove('open'); mobileNav.classList.remove('open'); document.body.style.overflow = '';
        }
        window.closeMobileNav = closeMobileNav;
        if (hamburger && mobileNav) {
            hamburger.addEventListener('click', function () {
                var isOpen = hamburger.classList.toggle('open');
                mobileNav.classList.toggle('open', isOpen);
                document.body.style.overflow = isOpen ? 'hidden' : '';
            });
            mobileNav.addEventListener('click', function (e) { if (!e.target.closest('#mobileNavPanel')) closeMobileNav(); });
            var cb = $('mobileNavClose'); if (cb) cb.addEventListener('click', closeMobileNav);
            document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMobileNav(); });
        }
        var nav = document.querySelector('.navbar');
        // Las pestañas quedan justo debajo de la barra fija del sitio (su altura varía según el ancho)
        function syncNavH() {
            if (nav) document.documentElement.style.setProperty('--oa-nav-h', Math.round(nav.getBoundingClientRect().bottom) + 'px');
        }
        window.addEventListener('scroll', function () {
            if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
            syncNavH();
        }, { passive: true });
        window.addEventListener('resize', syncNavH);
        if (nav && 'ResizeObserver' in window) new ResizeObserver(syncNavH).observe(nav);
        syncNavH();

        // Pestaña activa según la sección visible
        var links = Array.prototype.slice.call(document.querySelectorAll('.oa-tabs a'));
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (!en.isIntersecting) return;
                    links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
                });
            }, { rootMargin: '-45% 0px -50% 0px' });
            document.querySelectorAll('main .oa-section').forEach(function (s) { io.observe(s); });
        }
    }

    // ───────────────────────── inicio ─────────────────────────
    initNav();
    renderZones();
    loadLive();
    initMap();
    renderTopics();
    loadHistory();
    initCalc();
    initReport();
})();
