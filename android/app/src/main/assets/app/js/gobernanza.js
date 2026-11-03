/*
 * gobernanza.js — tablero público de Gobernanza del Agua: actores,
 * proyectos, matriz de acuerdos, agenda e indicadores de éxito.
 * Los registros provienen de gobernanza.json (información no sensible).
 */
(function () {
    'use strict';
    var OA = window.OA, fmt = OA.fmt;

    function pct(a, b) { return b ? fmt(a / b * 100) + ' %' : 'Sin datos'; }
    function estadoAcuerdo(a, hoy) {
        if (a.estado === 'cumplido') return (a.fecha_cumplimiento && a.fecha_limite && a.fecha_cumplimiento > a.fecha_limite) ? 'tarde' : 'ok';
        return a.fecha_limite && a.fecha_limite < hoy ? 'vencido' : 'abierto';
    }
    var EST = { ok: ['ok', 'Cumplido en plazo'], tarde: ['warn', 'Cumplido fuera de plazo'], vencido: ['bad', 'Vencido'], abierto: ['pen', 'En plazo'] };

    OA.loadGobernanza = function () {
        var hoy = OA.today();
        Promise.all([OA.loadData('gobernanza'), OA.loadData('calidad').catch(function () { return {}; }),
            OA.loadData('capas').catch(function () { return {}; }), OA.loadData('actividades').catch(function () { return {}; })])
        .then(function (r) {
            var g = r[0], cal = r[1], capas = r[2], act = r[3];
            var P = g.proyectos || [], A = g.acuerdos || [], R = g.reuniones || [];
            OA.text('gobUpd', 'Registro actualizado el ' + OA.dateLabel(g.actualizado) + ' (' + g.__origen + ').');

            var activos = P.filter(function (p) { return p.estado === 'en ejecución'; }).length;
            var cls = A.map(function (a) { return estadoAcuerdo(a, hoy); });
            var vencidos = cls.filter(function (c) { return c === 'vencido'; }).length;
            var proximas = R.filter(function (x) { return x.fecha >= hoy; }).length;
            OA.html('gobKpis', [
                ['🤝', 'Actores', (g.actores || []).length, 'en el directorio'],
                ['📁', 'Proyectos en ejecución', activos, P.length + ' registrados'],
                ['✅', 'Acuerdos cumplidos en plazo', cls.filter(function (c) { return c === 'ok'; }).length, vencidos + ' vencidos · ' + A.length + ' en total'],
                ['📅', 'Próximas reuniones', proximas, R.length + ' registradas']
            ].map(function (k) { return '<div class="tile"><span class="t-ic">' + k[0] + '</span><span class="t-lab">' + k[1] + '</span><b>' + k[2] + '</b><small>' + k[3] + '</small></div>'; }).join(''));

            OA.html('gobProyectos', P.length ? P.map(function (p) {
                var av = Math.max(0, Math.min(100, +p.avance_pct || 0));
                return '<div class="item"><div class="row-head"><b>' + OA.esc(p.nombre) + '</b><span class="badge est">' + OA.esc(p.estado || '—') + '</span></div>' +
                    '<p class="muted tiny">' + OA.esc(p.objetivo || '') + '</p>' +
                    '<p class="tiny">Responsable: <b>' + OA.esc(p.responsable || '—') + '</b> · Microcuenca: ' + OA.esc(p.microcuenca || '—') + ' · ' + OA.dateLabel(p.inicio) + ' → ' + OA.dateLabel(p.fin) +
                    (p.presupuesto_crc ? ' · ₡' + fmt(+p.presupuesto_crc) : '') + (p.financiamiento ? ' (' + OA.esc(p.financiamiento) + ')' : '') + '</p>' +
                    '<div class="meter small"><span style="width:' + av + '%;background:var(--sky)"></span></div><p class="tiny muted">Avance ' + av + ' %</p></div>';
            }).join('') : '<div class="empty-state">📁<p class="muted">Aún no hay proyectos publicados. Cada proyecto incluirá objetivo, responsable, presupuesto, financiamiento, cronograma y avance.</p></div>');

            OA.html('gobAcuerdos', A.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Acuerdo</th><th>Responsable</th><th>Fecha límite</th><th>Estado</th></tr></thead><tbody>' +
                A.map(function (a, i) { var e = EST[cls[i]]; return '<tr><td>' + OA.esc(a.descripcion) + '</td><td>' + OA.esc(a.responsable || '—') + '</td><td>' + OA.dateLabel(a.fecha_limite) + '</td><td><i class="dot ' + e[0] + '"></i>' + e[1] + '</td></tr>'; }).join('') +
                '</tbody></table></div>' : '<div class="empty-state">📝<p class="muted">Sin acuerdos registrados. La matriz mostrará cada acuerdo con su responsable, fecha límite y estado de cumplimiento.</p></div>');

            OA.html('gobReuniones', R.length ? R.slice().sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }).map(function (x) {
                return '<div class="item"><b>' + OA.dateLabel(x.fecha) + ' · ' + OA.esc(x.tema) + '</b><p class="tiny muted">' + OA.esc(x.lugar || '') +
                    (x.acta_publica_url && /^https:\/\//.test(x.acta_publica_url) ? ' · <a href="' + OA.esc(x.acta_publica_url) + '">Acta pública</a>' : '') + '</p></div>';
            }).join('') : '<p class="muted">Sin reuniones publicadas.</p>');

            OA.html('gobActores', (g.actores || []).map(function (a) {
                var name = a.url && /^https:\/\//.test(a.url) ? '<a href="' + OA.esc(a.url) + '">' + OA.esc(a.nombre) + '</a>' : '<b>' + OA.esc(a.nombre) + '</b>';
                return '<li>' + name + '<span>' + OA.esc(a.rol) + '</span></li>';
            }).join(''));

            // Indicadores de éxito (sección 8 del análisis)
            var capasPub = (capas.capas || []).filter(function (c) { return c.publico !== false && c.elementos && c.elementos.length; });
            var capasMeta = capasPub.filter(function (c) { return c.fuente && c.fecha && c.escala; }).length;
            var muestras = cal.muestras || [], trazables = muestras.filter(OA.traceable).length;
            var mis = OA.myReports ? OA.myReports() : [], conf = mis.filter(function (x) { return x.confirmado; }).length;
            var cerr = A.filter(function (a) { return a.estado === 'cumplido'; }).length;
            var participantes = (act.actividades || []).reduce(function (s, a) { return s + (+a.participantes || 0); }, 0);
            var IND = [
                ['Datos', 'Capas con fuente, fecha y escala', pct(capasMeta, capasPub.length)],
                ['Reportes', 'Reportes con confirmación de recepción (este teléfono)', mis.length ? pct(conf, mis.length) + ' (' + conf + '/' + mis.length + ')' : 'Sin reportes'],
                ['Atención', 'Tiempo mediano de primera revisión', 'Requiere el panel institucional'],
                ['Resolución', 'Casos cerrados con evidencia', 'Requiere el panel institucional'],
                ['Monitoreo', 'Estaciones físicas con datos recientes', '0 integradas (solo modelos)'],
                ['Calidad', 'Muestras con trazabilidad completa', muestras.length ? pct(trazables, muestras.length) : 'Sin muestras'],
                ['Gobernanza', 'Acuerdos cumplidos dentro del plazo', A.length ? pct(cls.filter(function (c) { return c === 'ok'; }).length, cerr + vencidos || A.length) : 'Sin acuerdos'],
                ['Participación', 'Personas en actividades registradas', participantes ? fmt(participantes) : 'Sin registros']
            ];
            OA.html('gobIndicadores', '<thead><tr><th>Dimensión</th><th>Indicador</th><th>Valor</th></tr></thead><tbody>' +
                IND.map(function (i) { return '<tr><th>' + i[0] + '</th><td>' + i[1] + '</td><td>' + i[2] + '</td></tr>'; }).join('') + '</tbody>');
        }).catch(function () { OA.html('gobProyectos', '<p class="muted">No se pudo cargar el registro de gobernanza.</p>'); });
    };
})();
