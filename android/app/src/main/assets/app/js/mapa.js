/*
 * mapa.js — mapa hídrico cantonal. Las capas vienen de capas.json con su
 * fuente, fecha, escala y nivel de confianza. Las capas no públicas
 * (ubicaciones sensibles) nunca se dibujan.
 */
(function () {
    'use strict';
    var OA = window.OA, C = OA.C, fmt = OA.fmt, sum = OA.sum;
    var map = null;
    OA.mapPoint = null;

    var CONF = { alta: 'Alta', media: 'Media', baja: 'Baja (referencia aproximada)' };
    function fichaCapa(c) {
        return '<table class="tbl kv-tbl">' +
            '<tr><th>Fuente</th><td>' + OA.esc(c.fuente || '—') + '</td></tr>' +
            '<tr><th>Fecha del dato</th><td>' + (c.fecha ? OA.dateLabel(c.fecha) : '—') + '</td></tr>' +
            '<tr><th>Escala</th><td>' + OA.esc(c.escala || '—') + '</td></tr>' +
            '<tr><th>Confianza</th><td>' + OA.esc(CONF[c.confianza] || c.confianza || '—') + '</td></tr></table>';
    }

    function dot(c) { return { radius: 9, color: '#fff', weight: 3, fillColor: c, fillOpacity: 1 }; }

    function consultPoint(lat, lon) {
        OA.mapPoint = { lat: lat, lon: lon };
        OA.html('sheetTxt', '<h3>📍 ' + lat + ', ' + lon + '</h3><p class="muted">Consultando…</p>');
        OA.getJSON(OA.forecastURL(lat, lon)).then(function (res) {
            if (!OA.mapPoint || OA.mapPoint.lat !== lat || OA.mapPoint.lon !== lon) return;
            var d = res.data, s = OA.summarize(d), st = OA.balanceStatus(s.balance);
            OA.html('sheetTxt', '<div class="row-head"><h3>📍 ' + lat + ', ' + lon + '</h3>' + OA.badge('est') + '</div><div class="kv">' +
                '<div><span>Elevación de la celda</span><b>' + fmt(d.elevation) + ' m</b></div>' +
                '<div><span>Lluvia hoy</span><b>' + fmt(s.today, 1) + ' mm</b></div>' +
                '<div><span>Lluvia 7 / 30 días</span><b>' + fmt(s.rain7) + ' / ' + fmt(s.rain30) + ' mm</b></div>' +
                '<div><span>Pronóstico 7 días</span><b>' + fmt(sum(s.next)) + ' mm</b></div>' +
                '<div><span>Balance climático 30 d</span><b>' + (s.balance > 0 ? '+' : '') + fmt(s.balance) + ' mm</b></div>' +
                '<div><span>Lectura</span><b><i class="dot ' + st.cls + '"></i>' + st.txt + '</b></div></div>' +
                '<p class="muted tiny">Open-Meteo · ' + OA.stamp(res.fetchedAt) + ' · estimación del modelo, no medición local. Podés usar este punto en Reportar.</p>');
        }).catch(function () {
            OA.html('sheetTxt', '<h3>📍 ' + lat + ', ' + lon + '</h3><p class="muted">Sin conexión para consultar este punto.</p>');
        });
    }

    OA.initMap = function () {
        if (map || typeof L === 'undefined') { if (map) map.invalidateSize(); return; }
        map = L.map('map', { zoomControl: false }).setView([10.115, -84.235], 12);
        L.control.zoom({ position: 'topright' }).addTo(map);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© colaboradores de OpenStreetMap' }).addTo(map);

        var bar = OA.$('layers');
        OA.loadData('capas').then(function (d) {
            var pend = [];
            (d.capas || []).forEach(function (c) {
                if (c.publico === false) { pend.push(c); return; }       // ubicaciones sensibles: no se dibujan
                if (!c.elementos || !c.elementos.length) { pend.push(c); return; }
                var g = L.layerGroup();
                c.elementos.forEach(function (e) {
                    var pop = '<b>' + OA.esc(e.nombre) + '</b>' + (e.detalle ? '<br>' + OA.esc(e.detalle) : '') +
                        '<hr><small><b>Capa:</b> ' + OA.esc(c.nombre) + '<br><b>Fuente:</b> ' + OA.esc(c.fuente) + '<br><b>Fecha:</b> ' + (c.fecha ? OA.dateLabel(c.fecha) : '—') +
                        ' · <b>Confianza:</b> ' + OA.esc(CONF[c.confianza] || c.confianza || '—') + '</small>';
                    var lyr = e.tipo === 'circulo'
                        ? L.circle([e.lat, e.lon], { radius: e.radio_m || 500, color: c.color, weight: 1.5, fillOpacity: .12, dashArray: '4 4' })
                        : L.circleMarker([e.lat, e.lon], dot(c.color));
                    lyr.bindPopup(pop).addTo(g);
                });
                if (c.visible) g.addTo(map);
                var b = document.createElement('button');
                b.type = 'button'; b.className = 'chip'; b.textContent = c.icono + ' ' + c.nombre;
                b.setAttribute('aria-pressed', c.visible ? 'true' : 'false');
                b.addEventListener('click', function () {
                    var on = b.getAttribute('aria-pressed') !== 'true';
                    b.setAttribute('aria-pressed', on ? 'true' : 'false');
                    if (on) g.addTo(map); else map.removeLayer(g);
                });
                b.addEventListener('contextmenu', function (ev) { ev.preventDefault(); OA.modal(c.icono + ' ' + c.nombre, fichaCapa(c)); });
                bar.appendChild(b);
            });
            var info = document.createElement('button');
            info.type = 'button'; info.className = 'chip'; info.textContent = 'ⓘ Capas y fuentes';
            info.addEventListener('click', function () {
                OA.modal('Capas del mapa hídrico',
                    '<p class="muted">Registro de capas actualizado el ' + OA.dateLabel(d.actualizado) + ' (' + OA.esc(d.__origen) + ').</p>' +
                    (d.capas || []).filter(function (c) { return c.publico !== false && c.elementos && c.elementos.length; })
                        .map(function (c) { return '<h3 class="sub">' + c.icono + ' ' + OA.esc(c.nombre) + '</h3>' + fichaCapa(c); }).join('') +
                    '<h3 class="sub">Pendientes de datos oficiales</h3><ul>' + pend.map(function (c) {
                        return '<li><b>' + c.icono + ' ' + OA.esc(c.nombre) + '</b> — ' + OA.esc(c.fuente) + (c.publico === false ? ' <i>(no se mostrará públicamente: ubicación sensible)</i>' : '') + '</li>';
                    }).join('') + '</ul>');
            });
            bar.appendChild(info);
        }).catch(function () {});

        // Acceso rápido a zonas
        var zb = document.createElement('div'); zb.className = 'zone-jump';
        OA.ZONES.forEach(function (z) {
            var b = document.createElement('button'); b.type = 'button'; b.textContent = z.name.replace('Zona ', '');
            b.addEventListener('click', function () { map.setView([z.lat, z.lon], 13); });
            zb.appendChild(b);
        });
        OA.$('v-mapa').appendChild(zb);

        // Toque en el mapa con antirrebote
        var mk = null, timer = null;
        map.on('click', function (e) {
            var lat = +e.latlng.lat.toFixed(4), lon = +e.latlng.lng.toFixed(4);
            if (mk) mk.setLatLng(e.latlng); else mk = L.circleMarker(e.latlng, dot(C.deep)).addTo(map);
            clearTimeout(timer);
            timer = setTimeout(function () { consultPoint(lat, lon); }, 350);
        });
    };
})();
