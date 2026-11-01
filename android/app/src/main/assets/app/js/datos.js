/*
 * datos.js — histórico climático (reanálisis), comparación de zonas,
 * calidad del agua y exportación CSV/PDF.
 *
 * Periodo del histórico: los 10 años calendario completos anteriores al actual
 * más el año en curso hasta el último día disponible del reanálisis. Un mes solo
 * cuenta como completo si tiene dato todos sus días.
 */
(function () {
    'use strict';
    var OA = window.OA, C = OA.C, fmt = OA.fmt, sum = OA.sum;
    var YEARS = 10;

    // ─────────── reanálisis (ERA5-Land, con respaldo a ERA5) ───────────
    var archMem = {};
    OA.getArchive = function (z, force) {
        if (archMem[z.id] && !force) return archMem[z.id];
        var y = new Date().getFullYear(), start = (y - YEARS) + '-01-01', end = OA.isoAdd(OA.today(), -5);
        var base = 'https://archive-api.open-meteo.com/v1/archive?latitude=' + z.lat + '&longitude=' + z.lon +
            '&start_date=' + start + '&end_date=' + end + '&daily=precipitation_sum&timezone=' + encodeURIComponent(OA.TZ);
        var p = OA.getJSON(base + '&models=era5_land', 'arch-land-' + z.id, 2 * 864e5).then(function (r) {
            r.modelo = 'ERA5-Land'; r.resolucion = '0,1° (~11 km)'; return r;
        }).catch(function () {
            return OA.getJSON(base + '&models=era5', 'arch-era5-' + z.id, 2 * 864e5).then(function (r) { r.modelo = 'ERA5'; r.resolucion = '0,25° (~28 km)'; return r; });
        }).then(function (r) {
            var t = r.data.daily.time, v = r.data.daily.precipitation_sum, last = -1;
            for (var i = v.length - 1; i >= 0; i--) if (v[i] != null) { last = i; break; }
            r.fuente = '<a href="https://open-meteo.com/en/docs/historical-weather-api">Open-Meteo Historical API</a> · reanálisis ' + r.modelo + ' (Copernicus/ECMWF)';
            r.start = t[0]; r.end = last >= 0 ? t[last] : null;
            r.byDate = {}; t.forEach(function (d, k) { r.byDate[d] = v[k]; });
            return r;
        });
        archMem[z.id] = p;
        p.catch(function () { delete archMem[z.id]; });
        return p;
    };

    // Lluvia de los últimos 30 días disponibles vs. el promedio de esas mismas fechas en años completos.
    OA.anomaly = function (h) {
        if (!h.end) return null;
        var to = h.end, from = OA.isoAdd(to, -29), actual = 0, n = 0;
        for (var d = from; d <= to; d = OA.isoAdd(d, 1)) { if (h.byDate[d] == null) return null; actual += h.byDate[d]; n++; }
        var cy = +to.slice(0, 4), totals = [];
        for (var y = cy - YEARS; y < cy; y++) {
            var off = y - cy, s = 0, ok = true;
            for (var k = 0; k < 30; k++) {
                var dd = OA.isoAdd(from, k), sh = (+dd.slice(0, 4) + off) + dd.slice(4);
                if (h.byDate[sh] == null) { if (sh.slice(5) === '02-29') continue; ok = false; break; }
                s += h.byDate[sh];
            }
            if (ok) totals.push(s);
        }
        if (totals.length < 5) return null;
        var mean = sum(totals) / totals.length;
        return { from: from, to: to, actual: actual, mean: mean, pct: mean > 0 ? actual / mean * 100 : null, years: totals.length, ref: (cy - YEARS) + '–' + (cy - 1) };
    };

    // Agrega por mes y año, distinguiendo periodos completos.
    OA.aggregate = function (h) {
        var mo = {}, order = [];
        Object.keys(h.byDate).sort().forEach(function (d) {
            var k = d.slice(0, 7);
            if (!mo[k]) { mo[k] = { sum: 0, days: 0, missing: 0 }; order.push(k); }
            if (h.byDate[d] == null) mo[k].missing++; else { mo[k].sum += h.byDate[d]; mo[k].days++; }
        });
        order.forEach(function (k) {
            var m = mo[k], needed = +OA.lastDayOfMonth(k).slice(8);
            m.complete = m.missing === 0 && m.days === needed;
        });
        var full = order.filter(function (k) { return mo[k].complete; });
        // Años de referencia: años calendario anteriores al actual con sus 12 meses completos.
        var curY = String(new Date().getFullYear()), refYears = {};
        order.forEach(function (k) { var y = k.slice(0, 4); if (y !== curY) refYears[y] = (refYears[y] || 0) + (mo[k].complete ? 1 : 0); });
        var ref = full.filter(function (k) { return refYears[k.slice(0, 4)] === 12; });
        var avgM = [];
        for (var i = 1; i <= 12; i++) {
            var mk = String(i).padStart(2, '0'), arr = ref.filter(function (k) { return k.slice(5) === mk; }).map(function (k) { return mo[k].sum; });
            avgM.push(arr.length ? { v: sum(arr) / arr.length, n: arr.length } : { v: null, n: 0 });
        }
        var yrs = {};
        order.forEach(function (k) {
            var y = k.slice(0, 4);
            if (!yrs[y]) yrs[y] = { sum: 0, months: 0, completeMonths: 0 };
            yrs[y].sum += mo[k].sum; yrs[y].months++; if (mo[k].complete) yrs[y].completeMonths++;
        });
        Object.keys(yrs).forEach(function (y) { yrs[y].complete = y !== curY && yrs[y].completeMonths === 12; });
        var fullYears = Object.keys(yrs).filter(function (y) { return yrs[y].complete; }).sort();
        var avgY = fullYears.length ? sum(fullYears.map(function (y) { return yrs[y].sum; })) / fullYears.length : null;
        return { mo: mo, order: order, full: full, avgM: avgM, yrs: yrs, fullYears: fullYears, avgY: avgY };
    };

    // ─────────── histórico ───────────
    var lastHist = null;
    OA.loadHistory = function (force) {
        var z = OA.zone;
        OA.html('chartMonthly', '<p class="empty">Cargando…</p>'); OA.html('chartYearly', '<p class="empty">Cargando…</p>'); OA.html('hStats', '');
        OA.getArchive(z, force).then(function (h) {
            if (z !== OA.zone) return;
            var a = OA.aggregate(h); lastHist = { z: z, h: h, a: a };
            var cur = String(new Date().getFullYear());
            var periodo = a.fullYears.length ? a.fullYears[0] + '–' + a.fullYears[a.fullYears.length - 1] + ' (' + a.fullYears.length + ' años completos)' : 'sin años completos';
            OA.html('histMeta', '<div class="row-head"><h2>' + OA.esc(z.name + ' · ' + z.place) + '</h2>' + OA.badge('rea') + '</div>' +
                '<table class="tbl kv-tbl"><tr><th>Periodo de referencia</th><td>' + periodo + '</td></tr>' +
                '<tr><th>Año en curso</th><td>' + cur + ', del 1 Ene al ' + OA.dateLabel(h.end) + ' (último dato disponible)</td></tr>' +
                '<tr><th>Variable</th><td>Precipitación diaria acumulada (mm)</td></tr>' +
                '<tr><th>Fuente</th><td>' + h.fuente + '</td></tr><tr><th>Resolución</th><td>' + h.resolucion + ' · punto ' + z.lat + ', ' + z.lon + '</td></tr>' +
                '<tr><th>Actualizado</th><td>' + OA.stamp(h.fetchedAt) + (h.cached ? ' (copia guardada)' : '') + '</td></tr>' +
                '<tr><th>Datos faltantes</th><td>' + (a.order.filter(function (k) { return a.mo[k].missing; }).length ? 'Hay meses con días sin dato; se excluyen de los promedios.' : 'Ninguno en el periodo') + '</td></tr>' +
                '<tr><th>Limitaciones</th><td>El reanálisis suaviza los contrastes locales (el relieve del volcán genera diferencias que una celda de ' + h.resolucion + ' no capta). Contrastar con pluviómetros locales cuando existan.</td></tr></table>');

            OA.bars(OA.$('chartMonthly'), a.order.map(function (k) {
                var mi = +k.slice(5) - 1, m = a.mo[k], avg = a.avgM[mi].v;
                return { lab: mi === 0 ? k.slice(0, 4) : '', v: m.sum, c: !m.complete ? C.mist : avg != null && m.sum >= avg ? C.blue : C.bad,
                    tip: OA.MESES[mi] + ' ' + k.slice(0, 4) + ': ' + fmt(m.sum) + ' mm' + (m.complete ? ' (prom. ' + fmt(avg) + ' mm, n=' + a.avgM[mi].n + ')' : ' · incompleto (' + m.days + ' días)') };
            }), { every: 1, aria: 'Lluvia mensual' });

            var keys = Object.keys(a.yrs).sort();
            OA.bars(OA.$('chartYearly'), keys.map(function (y) {
                var Y = a.yrs[y];
                return { lab: Y.complete ? y.slice(2) : y.slice(2) + '*', v: Y.sum, c: Y.complete ? C.sky : C.mist, tip: y + ': ' + fmt(Y.sum) + ' mm' + (Y.complete ? '' : ' (parcial, ' + Y.completeMonths + ' meses completos)') };
            }), { every: 1, avg: a.avgY, h: 160, aria: 'Lluvia anual' });

            var wet = a.fullYears.slice().sort(function (p, q) { return a.yrs[q].sum - a.yrs[p].sum; })[0];
            var dry = a.fullYears.slice().sort(function (p, q) { return a.yrs[p].sum - a.yrs[q].sum; })[0];
            var ytdK = a.full.filter(function (k) { return k.slice(0, 4) === cur; });
            var ytd = sum(ytdK.map(function (k) { return a.mo[k].sum; })), ytdA = sum(ytdK.map(function (k) { return a.avgM[+k.slice(5) - 1].v; }));
            var diff = ytdA ? (ytd - ytdA) / ytdA * 100 : null, k = diff == null ? null : OA.ppnClass(100 + diff);
            OA.html('hStats', [
                ['📏', 'Promedio anual', fmt(a.avgY), 'mm · ' + periodo],
                ['💧', 'Año más lluvioso', wet || '--', wet ? fmt(a.yrs[wet].sum) + ' mm' : ''],
                ['🏜️', 'Año más seco', dry || '--', dry ? fmt(a.yrs[dry].sum) + ' mm' : ''],
                ['📅', cur + ' (meses completos)', fmt(ytd), ytdK.length ? (diff >= 0 ? '+' : '') + fmt(diff) + '% vs. promedio de Ene–' + OA.MESES[ytdK.length - 1] + (k ? ' · ' + k.txt : '') : 'Aún no hay meses completos']
            ].map(function (s) { return '<div class="tile"><div class="tile-top"><span class="t-ic">' + s[0] + '</span>' + OA.badge('rea') + '</div><span class="t-lab">' + s[1] + '</span><b>' + OA.esc(s[2]) + '</b><small>' + OA.esc(s[3]) + '</small></div>'; }).join(''));
        }).catch(function () {
            OA.html('chartMonthly', '<p class="empty">Sin conexión para cargar el histórico.</p>'); OA.html('chartYearly', '');
            OA.html('histMeta', '<p class="muted">No se pudieron obtener los datos del reanálisis.</p>');
        });
    };

    // ─────────── exportación ───────────
    function csvNum(v, d) { return v == null || !isFinite(v) ? '' : v.toFixed(d == null ? 1 : d).replace('.', ','); }
    function exportCSV() {
        var msg = OA.$('expMsg');
        if (!lastHist) { msg.textContent = 'Primero cargá el histórico.'; return; }
        var z = lastHist.z, h = lastHist.h, a = lastHist.a;
        var L = ['# Observatorio del Agua-Poás · Proyecto Gobernanza del Agua',
            '# Zona;' + z.name + ' (' + z.place + ');' + z.lat + ';' + z.lon,
            '# Fuente;Open-Meteo Historical API · reanálisis ' + h.modelo + ' · resolución ' + h.resolucion,
            '# Periodo;' + h.start + ' a ' + h.end + ';descargado ' + OA.stamp(h.fetchedAt),
            '# Nota;Los meses incompletos se excluyen de los promedios.', '',
            'mes;lluvia_mm;dias_con_dato;mes_completo;promedio_mes_mm;anios_en_promedio'];
        a.order.forEach(function (k) {
            var m = a.mo[k], av = a.avgM[+k.slice(5) - 1];
            L.push([k, csvNum(m.sum), m.days, m.complete ? 'si' : 'no', csvNum(av.v), av.n].join(';'));
        });
        L.push('', 'anio;lluvia_mm;anio_completo');
        Object.keys(a.yrs).sort().forEach(function (y) { L.push([y, csvNum(a.yrs[y].sum), a.yrs[y].complete ? 'si' : 'no'].join(';')); });
        var name = 'observatorio-agua-poas_lluvia_' + z.id + '_' + OA.today() + '.csv', content = '﻿' + L.join('\r\n');
        if (OA.nativo && OA.nativo.guardarArchivo) {
            msg.textContent = OA.nativo.guardarArchivo(name, 'text/csv', content);
        } else {
            var url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
            var ln = document.createElement('a'); ln.href = url; ln.download = name; document.body.appendChild(ln); ln.click(); ln.remove();
            setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
            msg.textContent = 'Archivo generado: ' + name;
        }
    }
    function exportPDF() {
        document.body.classList.add('printing');
        if (OA.nativo && OA.nativo.imprimir) OA.nativo.imprimir('Observatorio del Agua-Poás · Histórico de lluvia ' + OA.zone.name);
        else window.print();
        setTimeout(function () { document.body.classList.remove('printing'); }, 1500);
    }

    // ─────────── comparar zonas ───────────
    OA.loadCompare = function () {
        OA.html('compTable', '<p class="empty">Cargando las tres zonas…</p>');
        Promise.all(OA.ZONES.map(function (z) {
            return Promise.all([
                OA.getJSON(OA.forecastURL(z.lat, z.lon), 'fc-' + z.id, 12 * 36e5).then(function (r) { return OA.summarize(r.data); }).catch(function () { return null; }),
                OA.getArchive(z).then(function (h) { return { a: OA.aggregate(h), ppn: OA.anomaly(h), h: h }; }).catch(function () { return null; })
            ]);
        })).then(function (res) {
            var rows = [
                ['Lluvia últimos 30 días', 'est', function (s) { return s.f ? fmt(s.f.rain30) + ' mm' : '--'; }],
                ['ET₀ últimos 30 días', 'est', function (s) { return s.f ? fmt(s.f.et30) + ' mm' : '--'; }],
                ['Balance climático 30 días', 'est', function (s) { return s.f ? (s.f.balance > 0 ? '+' : '') + fmt(s.f.balance) + ' mm' : '--'; }],
                ['Pronóstico 7 días', 'pro', function (s) { return s.f ? fmt(sum(s.f.next)) + ' mm' : '--'; }],
                ['Lluvia vs. promedio (30 días)', 'rea', function (s) { return s.r && s.r.ppn ? fmt(s.r.ppn.pct) + ' % · ' + OA.ppnClass(s.r.ppn.pct).txt : '--'; }],
                ['Promedio anual (años completos)', 'rea', function (s) { return s.r && s.r.a.avgY ? fmt(s.r.a.avgY) + ' mm' : '--'; }]
            ];
            var S = res.map(function (r) { return { f: r[0], r: r[1] }; });
            var ref = S.filter(function (s) { return s.r; })[0];
            OA.html('compTable', '<div class="table-wrap"><table class="tbl comp"><thead><tr><th>Indicador</th>' +
                OA.ZONES.map(function (z) { return '<th>' + z.name.replace('Zona ', '') + '</th>'; }).join('') + '</tr></thead><tbody>' +
                rows.map(function (row) { return '<tr><th>' + row[0] + ' ' + OA.badge(row[1]) + '</th>' + S.map(function (s) { return '<td>' + row[2](s) + '</td>'; }).join('') + '</tr>'; }).join('') +
                '</tbody></table></div><p class="muted tiny">Periodo de referencia del reanálisis: ' + (ref && ref.r.a.fullYears.length ? ref.r.a.fullYears[0] + '–' + ref.r.a.fullYears[ref.r.a.fullYears.length - 1] : '—') +
                ' · Pronóstico y estimaciones: Open-Meteo · Reanálisis: ' + (ref ? ref.r.h.modelo + ' (' + ref.r.h.resolucion + ')' : '—') + '.</p>');
        });
    };

    // ─────────── calidad del agua ───────────
    var PARAMS = [
        ['pH', 'unidades de pH', 'Valor, escala, método y equipo; calibración del medidor.'],
        ['Turbidez', 'NTU', 'Valor, método (nefelométrico) y calibración.'],
        ['Conductividad', 'µS/cm', 'Valor y temperatura de referencia (25 °C).'],
        ['Temperatura', '°C', 'Valor, fecha y hora de la medición.'],
        ['Oxígeno disuelto', 'mg/L', 'Valor, método y equipo.'],
        ['Nitratos', 'mg/L NO₃⁻', 'Resultado, límite de detección y laboratorio.'],
        ['E. coli / coliformes', 'NMP o UFC por 100 mL', 'Resultado microbiológico, método y laboratorio.']
    ];
    function traceable(m) {
        var base = m.sitio && m.lat != null && m.lon != null && m.fecha && m.responsable && m.laboratorio && m.parametros && m.parametros.length;
        return !!(base && m.parametros.every(function (p) { return p.unidad && p.metodo && p.valor != null; }));
    }
    OA.loadCalidad = function () {
        OA.html('calParams', '<thead><tr><th>Parámetro</th><th>Unidad</th><th>Requisito de registro</th></tr></thead><tbody>' +
            PARAMS.map(function (p) { return '<tr><th>' + p[0] + '</th><td>' + p[1] + '</td><td>' + p[2] + '</td></tr>'; }).join('') + '</tbody>');
        OA.loadData('calidad').then(function (d) {
            OA.calidad = d;
            var n = d.norma_referencia || {};
            OA.html('calNorma', 'Norma de referencia: <b>' + OA.esc(n.nombre || '—') + '</b> · ' + OA.esc(n.version || '') + ' · aplica a: ' + OA.esc(n.aplica_a || '—') +
                '. Los límites no se extrapolan entre usos distintos. Datos: ' + OA.esc(d.__origen) + ', actualizado ' + OA.dateLabel(d.actualizado) + '.');
            var ms = (d.muestras || []);
            if (!ms.length) {
                OA.html('calResultados', '<div class="empty-state">🧪<p><b>Aún no hay resultados publicados.</b></p><p class="muted">Se mostrarán aquí cuando un laboratorio o equipo de campo registre muestras con trazabilidad completa. Los resultados preliminares aparecerán separados de los validados.</p></div>');
                return;
            }
            function card(m) {
                var ok = traceable(m);
                return '<div class="sample"><div class="row-head"><b>' + OA.esc(m.sitio) + '</b>' + (m.estado === 'validado' ? '<span class="badge obs">Validado</span>' : '<span class="badge pen">Preliminar</span>') + '</div>' +
                    '<p class="muted tiny">' + OA.dateLabel(m.fecha) + (m.hora ? ' ' + OA.esc(m.hora) : '') + ' · ' + OA.esc(m.responsable || '—') + ' · ' + OA.esc(m.laboratorio || '—') + ' · uso: ' + OA.esc(m.uso || '—') +
                    (ok ? '' : ' · <b class="warn-txt">trazabilidad incompleta</b>') + '</p>' +
                    '<div class="table-wrap"><table class="tbl"><thead><tr><th>Parámetro</th><th>Valor</th><th>Método / equipo</th><th>LD</th></tr></thead><tbody>' +
                    (m.parametros || []).map(function (p) { return '<tr><th>' + OA.esc(p.parametro) + '</th><td>' + OA.esc(p.valor) + ' ' + OA.esc(p.unidad) + '</td><td>' + OA.esc([p.metodo, p.equipo].filter(Boolean).join(' · ')) + '</td><td>' + OA.esc(p.limite_deteccion == null ? '—' : p.limite_deteccion) + '</td></tr>'; }).join('') +
                    '</tbody></table></div>' + (m.informe_url && /^https:\/\//.test(m.informe_url) ? '<a class="link-btn" href="' + OA.esc(m.informe_url) + '">📄 Informe de laboratorio</a>' : '') + '</div>';
            }
            var val = ms.filter(function (m) { return m.estado === 'validado'; }), pre = ms.filter(function (m) { return m.estado !== 'validado'; });
            OA.html('calResultados', '<h3 class="sub">Resultados validados (' + val.length + ')</h3>' + (val.map(card).join('') || '<p class="muted">Ninguno.</p>') +
                '<h3 class="sub">Resultados preliminares (' + pre.length + ')</h3>' + (pre.map(card).join('') || '<p class="muted">Ninguno.</p>'));
        }).catch(function () { OA.html('calResultados', '<p class="muted">No se pudo cargar el registro de calidad.</p>'); });
    };
    OA.traceable = traceable;

    OA.initDatos = function () {
        OA.$('expCsv').addEventListener('click', exportCSV);
        OA.$('expPdf').addEventListener('click', exportPDF);
        var shownZone = null, compDone = false, calDone = false;
        OA.onShow.datos = function () {
            var p = document.querySelector('#segDatos [aria-selected="true"]').getAttribute('data-p');
            OA.onPane[p] && OA.onPane[p]();
        };
        OA.onPane.hist = function () { if (shownZone !== OA.zone.id) { shownZone = OA.zone.id; OA.loadHistory(); } };
        OA.onPane.comp = function () { if (!compDone) { compDone = true; OA.loadCompare(); } };
        OA.onPane.cal = function () { if (!calDone) { calDone = true; OA.loadCalidad(); } };
        OA.resetDatos = function () { shownZone = null; compDone = false; };
    };
})();
