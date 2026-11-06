/*
 * mas.js — calculadora de consumo (supuestos editables y comparación con el
 * recibo), educación y calendario, privacidad y fuentes.
 */
(function () {
    'use strict';
    var OA = window.OA, C = OA.C, fmt = OA.fmt;

    // Supuestos típicos por tipo de dispositivo (editables por la persona usuaria).
    var PRESETS = {
        conv: { sDucha: 10, sInodoro: 9, sLavadora: 100, sGrifo: 8, sManguera: 15 },
        efic: { sDucha: 6, sInodoro: 4.8, sLavadora: 50, sGrifo: 5, sManguera: 12 }
    };
    var HAB = ['Personas', 'Ducha', 'Inodoro', 'Lavadora', 'Platos', 'Jardin'];
    var SUP = ['sDucha', 'sInodoro', 'sLavadora', 'sGrifo', 'sManguera'];
    var SUP_MAX = { sDucha: 40, sInodoro: 25, sLavadora: 250, sGrifo: 30, sManguera: 60 };
    var BILL = ['bM3', 'bDias', 'bTarifa'];

    function calc(h, s) {
        var p = Math.max(1, h.Personas);
        var ducha = h.Ducha * s.sDucha * p, ino = h.Inodoro * s.sInodoro * p, lav = h.Lavadora * s.sLavadora / 7;
        var coc = h.Platos * s.sGrifo, jar = h.Jardin * s.sManguera, hogar = ducha + ino + lav + coc + jar;
        return { p: p, hogar: hogar, per: hogar / p, parts: [['la ducha', ducha], ['el inodoro', ino], ['la lavadora', lav], ['el grifo de la cocina', coc], ['la manguera', jar]] };
    }

    function initCalc() {
        var saved = OA.load('calc2');
        Object.keys(PRESETS.conv).forEach(function (k) { OA.$(k).value = PRESETS.conv[k]; });
        if (saved && saved.v) Object.keys(saved.v).forEach(function (k) { if (OA.$(k) && saved.v[k] !== '' && saved.v[k] != null) OA.$(k).value = saved.v[k]; });

        function upd() {
            var h = {}, s = {}, st = {};
            HAB.forEach(function (id) { var el = OA.$('c' + id); h[id] = OA.num(el, +el.min, +el.max, 0); OA.$('o' + id).textContent = h[id]; st['c' + id] = el.value; });
            SUP.forEach(function (id) { s[id] = OA.num(id, 0, SUP_MAX[id], PRESETS.conv[id]); st[id] = OA.$(id).value; });
            BILL.forEach(function (id) { st[id] = OA.$(id).value; });
            OA.store('calc2', st);

            var r = calc(h, s);
            OA.html('rPersona', fmt(r.per) + ' <small>L/día</small>');
            OA.html('rDia', fmt(r.hogar) + ' L'); OA.html('rMes', fmt(r.hogar * 30 / 1000, 1) + ' m³');
            var m = OA.$('rMeter'); m.style.width = Math.min(100, r.per / 200 * 100) + '%';
            m.style.background = r.per <= 100 ? 'linear-gradient(90deg,' + C.ok + ',' + C.sky + ')' : r.per <= 150 ? C.warn : C.alert;
            OA.html('rRef', 'Referencia: la OMS estima que <b>50 a 100 L por persona al día</b> cubren la mayoría de las necesidades básicas (beber, cocinar e higiene). Es un nivel de servicio, no un máximo: el consumo adecuado depende del clima, la vivienda y los hábitos.');

            // Comparación con el recibo
            var m3 = parseFloat(OA.$('bM3').value), dias = parseFloat(OA.$('bDias').value), tar = parseFloat(OA.$('bTarifa').value);
            var tarifa = isFinite(tar) && tar > 0 ? tar : null;
            if (isFinite(m3) && m3 >= 0 && isFinite(dias) && dias >= 1) {
                var medDia = m3 * 1000 / dias, dif = r.hogar ? (medDia - r.hogar) / r.hogar * 100 : null;
                OA.html('bResult', '<div class="duo"><div><span class="t-lab">Medido (recibo)</span><b>' + fmt(medDia) + ' L/día</b><small class="muted">' + fmt(medDia / r.p) + ' L por persona</small></div>' +
                    '<div><span class="t-lab">Estimado</span><b>' + fmt(r.hogar) + ' L/día</b><small class="muted">' + (dif == null ? '' : (dif >= 0 ? '+' : '') + fmt(dif) + ' % de diferencia') + '</small></div></div>' +
                    (dif != null && dif > 30 ? '<p class="tiny warn-txt">El consumo medido supera bastante al estimado: revisá posibles fugas (inodoro que gotea, tanque, tuberías) o hábitos no incluidos.</p>'
                        : dif != null && dif < -30 ? '<p class="tiny muted">El estimado es mayor que lo medido: ajustá los minutos o los supuestos para que se parezcan a tu realidad.</p>' : '<p class="tiny muted">El estimado se parece a tu consumo real.</p>'));
            } else if (OA.$('bM3').value || OA.$('bDias').value) {
                OA.html('bResult', '<p class="tiny warn-txt">Ingresá un consumo (m³) de 0 o más y un periodo de al menos 1 día.</p>');
            } else OA.html('bResult', '<p class="tiny muted">Ingresá los m³ y los días del periodo que aparecen en tu recibo.</p>');

            // Ahorro potencial: mismos hábitos con dispositivos eficientes y duchas de 5 minutos
            var ef = {}; SUP.forEach(function (k) { ef[k] = Math.min(s[k], PRESETS.efic[k]); });
            var h5 = JSON.parse(JSON.stringify(h)); h5.Ducha = Math.min(h.Ducha, 5);
            var rEf = calc(h, ef), rBoth = calc(h5, ef);
            var ahorroDia = r.hogar - rBoth.hogar, ahorroMes = ahorroDia * 30 / 1000;
            var parts = r.parts.slice().sort(function (a, b) { return b[1] - a[1]; });
            var tips = [];
            if (r.hogar > 0) tips.push('Tu mayor consumo es <b>' + parts[0][0] + '</b> (' + fmt(parts[0][1] / r.hogar * 100) + ' % del total).');
            if (r.hogar - rEf.hogar > 1) tips.push('Con dispositivos eficientes ahorrarías unos <b>' + fmt((r.hogar - rEf.hogar) * 30 / 1000, 1) + ' m³</b> cada 30 días.');
            if (h.Ducha > 5) tips.push('Bajar las duchas a 5 minutos sumaría <b>' + fmt((rEf.hogar - rBoth.hogar) * 30 / 1000, 1) + ' m³</b> más.');
            if (ahorroMes > 0.05) tips.push('Ahorro total posible: <b>' + fmt(ahorroDia) + ' L/día ≈ ' + fmt(ahorroMes, 1) + ' m³ cada 30 días</b>' + (tarifa ? ' ≈ <b>₡' + fmt(ahorroMes * tarifa) + '</b> (con tu tarifa; las tarifas por bloques pueden variar el monto)' : ' (ingresá tu tarifa para estimar el costo)') + '.');
            if (h.Jardin > 0) tips.push('Regá temprano o al atardecer y aprovechá el agua de lluvia.');
            if (!tips.length) tips.push('Tu consumo ya es eficiente con estos supuestos.');
            tips.push('<span class="muted">Supuestos: los valores editables de arriba; el ahorro mantiene tus hábitos y solo cambia los equipos (y la ducha a 5 min).</span>');
            OA.html('rTips', tips.map(function (t) { return '<li>' + t + '</li>'; }).join(''));
        }
        ['calc', 'calcSup', 'calcRecibo'].forEach(function (id) { OA.$(id).addEventListener('input', upd); OA.$(id).addEventListener('change', upd); });
        document.querySelectorAll('[data-preset]').forEach(function (b) {
            b.addEventListener('click', function () { var p = PRESETS[b.getAttribute('data-preset')]; Object.keys(p).forEach(function (k) { OA.$(k).value = p[k]; }); upd(); });
        });
        upd();
    }

    function loadActividades() {
        OA.loadData('actividades').then(function (d) {
            var hoy = OA.today(), A = (d.actividades || []).slice().sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
            var prox = A.filter(function (a) { return a.fecha >= hoy; }), pas = A.filter(function (a) { return a.fecha < hoy; }).reverse();
            function item(a) {
                return '<div class="item"><div class="row-head"><b>' + OA.dateLabel(a.fecha) + (a.hora ? ' · ' + OA.esc(a.hora) : '') + '</b><span class="badge est">' + OA.esc(a.tipo || '') + '</span></div>' +
                    '<p><b>' + OA.esc(a.titulo) + '</b></p><p class="tiny muted">' + OA.esc(a.lugar || '') + (a.organiza ? ' · Organiza: ' + OA.esc(a.organiza) : '') + (a.contacto_publico ? ' · ' + OA.esc(a.contacto_publico) : '') + '</p>' +
                    (a.resultado ? '<p class="tiny">Resultado: ' + OA.esc(a.resultado) + (a.participantes ? ' · ' + fmt(+a.participantes) + ' participantes' : '') + '</p>' : '') + '</div>';
            }
            OA.html('actividades', (prox.length ? '<h3 class="sub">Próximas</h3>' + prox.map(item).join('') : '<div class="empty-state">📅<p class="muted">No hay actividades programadas publicadas por ahora.</p></div>') +
                (pas.length ? '<h3 class="sub">Realizadas</h3>' + pas.slice(0, 10).map(item).join('') : '') +
                '<p class="tiny muted">Calendario actualizado el ' + OA.dateLabel(d.actualizado) + ' (' + OA.esc(d.__origen) + ').</p>');
            var M = d.materiales || [];
            OA.html('materiales', M.length ? '<ul class="links">' + M.filter(function (m) { return /^https:\/\//.test(m.url || ''); }).map(function (m) {
                return '<li><a href="' + OA.esc(m.url) + '">📘 ' + OA.esc(m.titulo) + ' <small class="muted">· ' + OA.esc(m.publico || '') + '</small></a></li>';
            }).join('') + '</ul>' : '<p class="muted">Pronto se publicarán guías sobre nacientes, riberas, recarga, contaminación, cambio climático y uso eficiente del agua.</p>');
        }).catch(function () { OA.html('actividades', '<p class="muted">No se pudo cargar el calendario.</p>'); });
    }

    function fuentes() {
        var F = [
            ['Pronóstico y estimaciones diarias', 'Open-Meteo Forecast API (modelos combinados)', '1–11 km', 'Estimación / Pronóstico'],
            ['Histórico y anomalía de lluvia', 'Open-Meteo Historical API · ERA5 (Copernicus/ECMWF)', '0,25° (~28 km)', 'Reanálisis'],
            ['Caudal', 'Open-Meteo Flood API · GloFAS (Copernicus)', '~5 km', 'Estimación pendiente de validación'],
            ['Evapotranspiración', 'FAO-56 Penman-Monteith (Open-Meteo)', 'Celda del modelo', 'Estimación'],
            ['Mapa base', 'OpenStreetMap', '—', 'Cartografía colaborativa'],
            ['Capas temáticas, calidad, gobernanza y actividades', 'Registros del observatorio (datos-agua/*.json)', 'Según cada capa', 'Según cada registro']
        ];
        OA.html('fuentes', '<thead><tr><th>Dato</th><th>Fuente</th><th>Resolución</th><th>Tipo</th></tr></thead><tbody>' +
            F.map(function (f) { return '<tr><th>' + f[0] + '</th><td>' + f[1] + '</td><td>' + f[2] + '</td><td>' + f[3] + '</td></tr>'; }).join('') + '</tbody>');
        OA.text('appVersion', 'Versión ' + OA.VERSION + ' · Tech Center CR @ 2026');
    }

    OA.initMas = function () {
        initCalc();
        OA.renderTopics('topics2');
        fuentes();
        var actDone = false;
        OA.onPane.aprende = function () { if (!actDone) { actDone = true; loadActividades(); } };
        OA.$('wipe').addEventListener('click', function () {
            var pend = (OA.myReports() || []).filter(function (r) { return !r.confirmado; }).length;
            if (pend && !window.confirm('Tenés ' + pend + ' reporte(s) aún no confirmados por el servidor. Si borrás tus datos se perderán. ¿Continuar?')) return;
            OA.wipe();
            OA.text('wipeMsg', '✅ Se borraron los datos guardados en este teléfono.');
        });
    };
})();
