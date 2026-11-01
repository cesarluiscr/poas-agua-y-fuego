/*
 * inicio.js — indicadores climáticos e hidrológicos por zona.
 * Separa: estimaciones del modelo (últimos 30 días), pronóstico, reanálisis
 * (anomalía de lluvia) y estimación hidrológica (caudal GloFAS).
 */
(function () {
    'use strict';
    var OA = window.OA, C = OA.C, fmt = OA.fmt, sum = OA.sum;

    OA.forecastURL = function (lat, lon) {
        return 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
            '&current=temperature_2m,relative_humidity_2m,weather_code' +
            '&daily=precipitation_sum,et0_fao_evapotranspiration,precipitation_probability_max' +
            '&hourly=soil_moisture_3_to_9cm&past_days=30&forecast_days=8&timezone=' + encodeURIComponent(OA.TZ);
    };
    // Resumen: separa los 30 días previos (estimación), hoy y los días siguientes (pronóstico).
    OA.summarize = function (d) {
        var t = d.daily.time, p = d.daily.precipitation_sum, e = d.daily.et0_fao_evapotranspiration;
        var i = t.indexOf(OA.today()); if (i < 0) i = Math.min(30, t.length - 1);
        var past = p.slice(0, i), et = sum(e.slice(0, i));
        var missing = past.filter(function (v) { return v == null; }).length;
        return { idx: i, from: t[0], to: t[i - 1], today: p[i], rain7: sum(past.slice(-7)), rain30: sum(past), et30: et,
            next: p.slice(i + 1), nextDays: t.slice(i + 1), balance: sum(past) - et, missing: missing };
    };
    // Lectura del balance climático: describe el clima, no el estado del acuífero.
    OA.balanceStatus = function (b) {
        if (b > 50) return { cls: 'ok', txt: 'Superávit de lluvia', col: C.ok };
        if (b >= 0) return { cls: 'warn', txt: 'Lluvia similar a la evaporación', col: C.warn };
        if (b >= -50) return { cls: 'alert', txt: 'Déficit climático leve', col: C.alert };
        return { cls: 'bad', txt: 'Déficit climático marcado', col: C.bad };
    };
    // Porcentaje de lluvia respecto al promedio (PPN) del mismo periodo en años completos.
    OA.ppnClass = function (p) {
        if (p < 50) return { cls: 'bad', txt: 'Muy seco' };
        if (p < 80) return { cls: 'alert', txt: 'Seco' };
        if (p <= 120) return { cls: 'ok', txt: 'Normal' };
        if (p <= 150) return { cls: 'warn', txt: 'Húmedo' };
        return { cls: 'bad', txt: 'Muy húmedo' };
    };

    var WEATHER = { 0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado', 45: 'Neblina', 48: 'Neblina',
        51: 'Llovizna', 53: 'Llovizna', 55: 'Llovizna', 61: 'Lluvia', 63: 'Lluvia', 65: 'Lluvia fuerte', 80: 'Chubascos', 81: 'Chubascos',
        82: 'Chubascos fuertes', 95: 'Tormenta', 96: 'Tormenta', 99: 'Tormenta' };

    var TILES = [
        { id: 'today', ic: '🌧️', lab: 'Lluvia hoy', b: 'est' },
        { id: 'r7', ic: '☔', lab: 'Lluvia últimos 7 días', b: 'est' },
        { id: 'next', ic: '🔮', lab: 'Lluvia próximos 7 días', b: 'pro' },
        { id: 'ppn', ic: '📈', lab: 'Lluvia vs. su promedio', b: 'rea' },
        { id: 'soil', ic: '🌱', lab: 'Humedad del suelo', b: 'est' },
        { id: 'flow', ic: '🏞️', lab: 'Caudal estimado', b: 'pen' },
        { id: 'temp', ic: '🌡️', lab: 'Temperatura', b: 'est' },
        { id: 'et', ic: '☀️', lab: 'Evapotranspiración 30 días', b: 'est' }
    ];
    function renderTiles() {
        OA.html('tiles', TILES.map(function (t) {
            return '<div class="tile"><div class="tile-top"><span class="t-ic">' + t.ic + '</span>' + OA.badge(t.b) + '</div>' +
                '<span class="t-lab">' + t.lab + ' <button type="button" class="info" data-meta="' + t.id + '" aria-label="Metadatos de ' + t.lab + '">ⓘ</button></span>' +
                '<b id="k-' + t.id + '">--</b><small id="s-' + t.id + '">…</small></div>';
        }).join(''));
    }
    function tile(id, val, sub) { OA.html('k-' + id, val); OA.text('s-' + id, sub); }

    // Medidor semicircular: -100 mm a +150 mm
    function gauge(b) {
        var t = Math.max(0, Math.min(1, (b + 100) / 250)), st = OA.balanceStatus(b);
        var a = Math.PI * (1 - t), cx = 60, cy = 66, r = 46, x = cx + r * Math.cos(a), y = cy - r * Math.sin(a);
        OA.html('gauge', '<svg viewBox="0 0 120 120"><path d="M14 66 A46 46 0 0 1 106 66" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="12" stroke-linecap="round"/>' +
            '<path d="M14 66 A46 46 0 0 1 ' + x.toFixed(1) + ' ' + y.toFixed(1) + '" fill="none" stroke="' + st.col + '" stroke-width="12" stroke-linecap="round"/>' +
            '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7" fill="#fff"/><text x="60" y="92" text-anchor="middle" font-size="22">💧</text></svg>');
    }

    OA.renderZones = function () {
        var box = OA.$('zones'); box.innerHTML = '';
        OA.ZONES.forEach(function (z) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'zone'; b.textContent = z.name + ' · ' + z.place;
            b.setAttribute('aria-pressed', z === OA.zone ? 'true' : 'false');
            b.addEventListener('click', function () {
                if (z === OA.zone) return;
                OA.zone = z; OA.store('zone', z.id); OA.renderZones(); OA.loadLive();
            });
            box.appendChild(b);
        });
    };

    function loc(z, d) { return z.name + ' (' + z.place + ') · ' + z.lat + ', ' + z.lon + (d && d.elevation != null ? ' · celda a ' + fmt(d.elevation) + ' m' : ''); }

    OA.loadLive = function () {
        var z = OA.zone, btn = OA.$('btnRefresh');
        btn.classList.add('spin');
        renderTiles();
        OA.html('chartDaily', '<p class="empty">Cargando…</p>');
        OA.text('kBalanceTxt', 'Cargando…');

        var p1 = OA.getJSON(OA.forecastURL(z.lat, z.lon), 'fc-' + z.id, 12 * 36e5).then(function (res) {
            if (z !== OA.zone) return;
            var d = res.data, s = OA.summarize(d), c = d.current || {}, st = OA.balanceStatus(s.balance);
            var upd = OA.stamp(res.fetchedAt), periodo = OA.dateLabel(s.from) + ' – ' + OA.dateLabel(s.to);
            var src = '<a href="https://open-meteo.com/">Open-Meteo</a> · modelos de pronóstico combinados (best match)';

            gauge(s.balance);
            OA.html('kBalance', (s.balance > 0 ? '+' : '') + fmt(s.balance) + ' <small>mm</small>');
            OA.text('kBalanceTxt', st.txt + ' · lluvia ' + fmt(s.rain30) + ' − ET₀ ' + fmt(s.et30) + ' mm');
            OA.meta.balance = { titulo: 'Balance climático simplificado', tipos: ['est', 'calc'],
                formula: 'Σ lluvia − Σ evapotranspiración de referencia (ET₀ FAO-56) en los 30 días previos a hoy',
                unidad: 'mm', periodo: periodo + ' (30 días)', ubicacion: loc(z, d), actualizado: upd, fuente: src,
                resolucion: 'Celda del modelo, de 1 a 11 km según el modelo disponible',
                limitaciones: 'Es un indicador climático. No representa la recarga del acuífero ni la disponibilidad real de agua, que dependen de infiltración, escorrentía, suelo, geología, cobertura y almacenamiento. Umbrales de lectura: > +50 superávit; 0 a +50 similar; −50 a 0 déficit leve; < −50 déficit marcado.' + (s.missing ? ' Faltan ' + s.missing + ' días sin dato.' : '') };

            tile('today', fmt(s.today, 1) + ' <small>mm</small>', WEATHER[c.weather_code] || 'Acumulado del día');
            OA.meta.today = { titulo: 'Lluvia hoy', tipos: ['est'], formula: 'Suma de la precipitación horaria del día (incluye horas aún pronosticadas)', unidad: 'mm', periodo: OA.dateLabel(OA.today()), ubicacion: loc(z, d), actualizado: upd, fuente: src, limitaciones: 'Salida de modelo, no medición de pluviómetro.' };

            tile('r7', fmt(s.rain7) + ' <small>mm</small>', '30 días: ' + fmt(s.rain30) + ' mm');
            OA.meta.r7 = { titulo: 'Lluvia últimos 7 y 30 días', tipos: ['est'], formula: 'Σ precipitación diaria', unidad: 'mm', periodo: periodo, ubicacion: loc(z, d), actualizado: upd, fuente: src, limitaciones: 'Estimación de modelo; puede diferir de los pluviómetros locales, sobre todo en lluvias convectivas.' };

            var mi = s.next.length ? s.next.indexOf(Math.max.apply(null, s.next)) : -1;
            tile('next', fmt(sum(s.next)) + ' <small>mm</small>', mi >= 0 ? 'Día más lluvioso: ' + OA.dayLabel(s.nextDays[mi]) : '');
            OA.meta.next = { titulo: 'Pronóstico de lluvia', tipos: ['pro'], formula: 'Σ precipitación pronosticada', unidad: 'mm', periodo: s.nextDays.length ? OA.dateLabel(s.nextDays[0]) + ' – ' + OA.dateLabel(s.nextDays[s.nextDays.length - 1]) : '', ubicacion: loc(z, d), actualizado: upd, fuente: src, limitaciones: 'Valor esperado; la incertidumbre aumenta con los días.' };

            tile('et', fmt(s.et30) + ' <small>mm</small>', 'Agua que demanda la atmósfera');
            OA.meta.et = { titulo: 'Evapotranspiración de referencia (ET₀)', tipos: ['est'], formula: 'FAO-56 Penman-Monteith sobre pasto de referencia', unidad: 'mm', periodo: periodo, ubicacion: loc(z, d), actualizado: upd, fuente: src, limitaciones: 'Demanda atmosférica potencial; la evapotranspiración real de cada cobertura es distinta.' };

            tile('temp', fmt(c.temperature_2m) + ' <small>°C</small>', 'Humedad relativa ' + fmt(c.relative_humidity_2m) + '%');
            OA.meta.temp = { titulo: 'Temperatura y humedad', tipos: ['est'], formula: 'Valor actual del modelo a 2 m', unidad: '°C · %', periodo: c.time ? c.time.replace('T', ' ') : '', ubicacion: loc(z, d), actualizado: upd, fuente: src };

            var sm = null;
            if (d.hourly && c.time) { var hi = d.hourly.time.indexOf(c.time.slice(0, 13) + ':00'); sm = hi >= 0 ? d.hourly.soil_moisture_3_to_9cm[hi] : null; }
            if (sm != null) { var pc = sm * 100; tile('soil', fmt(pc) + ' <small>%</small>', 'Capa 3–9 cm · ' + (pc >= 40 ? 'saturada' : pc >= 25 ? 'húmeda' : pc >= 15 ? 'moderada' : 'seca')); }
            else tile('soil', '--', 'Sin dato');
            OA.meta.soil = { titulo: 'Humedad del suelo', tipos: ['est'], formula: 'Contenido volumétrico de agua (m³/m³ × 100) en la capa de 3 a 9 cm', unidad: '% en volumen', periodo: 'Hora actual', ubicacion: loc(z, d), actualizado: upd, fuente: src, limitaciones: 'Valor de modelo para un suelo genérico de la celda; no corresponde a una parcela.' };

            var items = d.daily.time.map(function (t, i) {
                var fut = i > s.idx, pr = d.daily.precipitation_probability_max && d.daily.precipitation_probability_max[i];
                return { lab: OA.dayLabel(t), v: d.daily.precipitation_sum[i], c: fut ? C.mist : C.blue,
                    tip: OA.dayLabel(t) + ': ' + fmt(d.daily.precipitation_sum[i], 1) + ' mm · ' + (fut ? 'pronóstico' + (pr != null ? ' (prob. ' + pr + '%)' : '') : 'estimación') };
            });
            OA.bars(OA.$('chartDaily'), items, { line: d.daily.et0_fao_evapotranspiration, mark: s.idx, every: 7, aria: 'Lluvia diaria' });
            OA.text('updDaily', 'actualizado ' + upd);
            OA.offline(res.cached ? (res.stale ? '⚠️ Sin conexión · datos ANTIGUOS (más de 12 h), del ' : 'Sin conexión · datos guardados el ') + upd : null);
        }).catch(function () {
            if (z !== OA.zone) return;
            OA.html('chartDaily', '<p class="empty">No hay conexión ni datos guardados para esta zona.</p>');
            OA.text('kBalanceTxt', 'Sin datos'); OA.offline('Sin conexión y sin datos guardados.');
        });

        var p2 = OA.getJSON('https://flood-api.open-meteo.com/v1/flood?latitude=' + z.flow.lat + '&longitude=' + z.flow.lon + '&daily=river_discharge&past_days=30&forecast_days=7', 'fl-' + z.id, 12 * 36e5)
            .then(function (res) {
                if (z !== OA.zone) return;
                var t = res.data.daily.time, q = res.data.daily.river_discharge, i = t.indexOf(OA.today()); if (i < 0) i = Math.min(30, t.length - 1);
                if (q[i] == null) throw 0;
                var past = q.slice(0, i).filter(function (v) { return v != null; }), avg = past.length ? sum(past) / past.length : 0;
                tile('flow', fmt(q[i], q[i] < 10 ? 2 : 1) + ' <small>m³/s</small>', avg ? (q[i] >= avg ? '▲ ' : '▼ ') + fmt(Math.abs((q[i] - avg) / avg * 100)) + '% vs. 30 días' : '');
                OA.meta.flow = { titulo: 'Caudal estimado del río', tipos: ['est', 'pen'], formula: 'Caudal diario del modelo hidrológico global GloFAS en la celda más cercana; comparación con la media de los 30 días previos',
                    unidad: 'm³/s', periodo: OA.dateLabel(OA.today()), ubicacion: 'Celda más cercana a ' + z.flow.lat + ', ' + z.flow.lon + ' (' + z.name + ')', actualizado: OA.stamp(res.fetchedAt),
                    fuente: '<a href="https://open-meteo.com/en/docs/flood-api">Open-Meteo Flood API</a> · GloFAS (Copernicus)', resolucion: '0,05° (~5 km)',
                    limitaciones: 'PENDIENTE DE VALIDACIÓN: no se ha verificado que la celda corresponda al cauce del río Poás. Útil solo como tendencia; no usar para alertas.' };
            }).catch(function () { if (z === OA.zone) tile('flow', '--', 'Sin estimación'); });

        var p3 = OA.getArchive(z).then(function (h) {
            if (z !== OA.zone) return;
            var a = OA.anomaly(h);
            if (!a) { tile('ppn', '--', 'Datos insuficientes'); return; }
            var k = OA.ppnClass(a.pct);
            tile('ppn', fmt(a.pct) + ' <small>%</small>', k.txt + ' · 30 días al ' + OA.dayLabel(a.to));
            OA.meta.ppn = { titulo: 'Lluvia vs. su promedio (sequía / exceso)', tipos: ['rea'],
                formula: 'PPN = lluvia acumulada en los últimos 30 días con reanálisis ÷ promedio de la lluvia de esas mismas fechas en ' + a.years + ' años completos × 100',
                unidad: '% del promedio', periodo: OA.dateLabel(a.from) + ' – ' + OA.dateLabel(a.to) + ' · referencia ' + a.ref,
                ubicacion: loc(z), actualizado: OA.stamp(h.fetchedAt), fuente: h.fuente, resolucion: h.resolucion,
                limitaciones: 'Método simple (porcentaje del promedio), no es el índice SPI. Clases: < 50 % muy seco; 50–79 % seco; 80–120 % normal; 121–150 % húmedo; > 150 % muy húmedo. El reanálisis tiene unos 5 días de retraso. Lluvia actual: ' + fmt(a.actual) + ' mm; promedio: ' + fmt(a.mean) + ' mm.' };
        }).catch(function () { if (z === OA.zone) tile('ppn', '--', 'Sin conexión'); });

        Promise.all([p1, p2, p3].map(function (p) { return p.catch(function () {}); })).then(function () { btn.classList.remove('spin'); });
    };

    // ─────────── época ───────────
    OA.season = function () {
        var m = new Date().getMonth();
        OA.text('season', m === 11 || m <= 3 ? '☀️ Época seca: menos lluvia y más demanda de agua.'
            : m === 6 || m === 7 ? '🌦️ Época lluviosa con posible “veranillo”.'
            : '🌧️ Época lluviosa.');
    };

    // ─────────── temas educativos (compartidos con Más → Educación) ───────────
    OA.TOPICS = [
        ['💦', 'Microcuencas', 'Dónde nace y drena el agua', '<p>Poás forma parte de la <b>subcuenca del río Poás</b>, dentro de la cuenca del <b>río Grande de Tárcoles</b>. Lo que ocurre en las partes altas —uso del suelo, deforestación, agroquímicos— repercute aguas abajo.</p><ul><li>La parte alta funciona como “fábrica de agua”.</li><li>Gestionar por microcuencas ayuda a priorizar dónde proteger.</li></ul>'],
        ['🏞️', 'Ríos y riberas', 'Cauces y su franja protectora', '<p>El <b>río Poás</b> nace en las faldas del volcán; el <b>Poasito</b> es uno de sus afluentes. La vegetación de las riberas filtra contaminantes, sostiene los taludes y da sombra que mantiene el agua fresca.</p><ul><li>La Ley Forestal establece áreas de protección a lo largo de ríos y quebradas.</li><li>No rellenés ni desviés cauces: aumenta el riesgo de inundación.</li></ul>'],
        ['⛲', 'Nacientes', 'Manantiales para las ASADAS', '<p>Las nacientes son puntos donde el agua subterránea aflora. Muchas ASADAS captan agua de ellas, y la ley establece áreas de protección a su alrededor.</p><ul><li>Evitá pastoreo, agroquímicos y construcciones cerca de nacientes.</li><li>Por seguridad, su ubicación exacta no se publica en la app.</li></ul>'],
        ['🕳️', 'Acuíferos y recarga', 'El agua bajo el volcán', '<p>Bajo el macizo Poás-Barva hay acuíferos volcánicos que abastecen a gran parte de la Gran Área Metropolitana. La recarga depende de la infiltración, el suelo, la geología y la cobertura vegetal, por eso no se puede medir solo con datos de lluvia.</p><ul><li>Impermeabilizar el suelo reduce la recarga.</li></ul>'],
        ['🧪', 'Calidad del agua', 'Potabilidad y vigilancia', '<p>Los operadores (Municipalidad, ASADAS) vigilan la calidad bajo la rectoría del AyA y el Ministerio de Salud. Los riesgos principales son los nitratos agrícolas y la contaminación por aguas residuales.</p><ul><li>Si el agua de tu casa cambia de color, olor o sabor, reportalo.</li></ul>'],
        ['☣️', 'Contaminación', 'Las principales amenazas', '<p>Agroquímicos, aguas residuales sin tratar, residuos en cauces y expansión urbana en zonas sensibles.</p><ul><li>Separá residuos y mantené tu tanque séptico en buen estado.</li></ul>'],
        ['🌡️', 'Cambio climático', 'Más extremos, más incertidumbre', '<p>Se esperan lluvias más intensas en menos días y periodos secos más marcados, sobre todo en años de El Niño. Eso aumenta tanto el riesgo de inundaciones como la presión sobre las fuentes en época seca.</p><ul><li>Proteger el bosque y las riberas ayuda a amortiguar ambos extremos.</li></ul>'],
        ['🚿', 'Uso eficiente', 'Cada litro cuenta', '<p>La ducha, el inodoro y la lavadora concentran la mayor parte del consumo de un hogar. Dispositivos eficientes y hábitos simples reducen el consumo sin perder comodidad.</p><ul><li>Calculá tu consumo en Más → Consumo.</li></ul>'],
        ['🌳', 'Reforestación', 'Árboles que cuidan el agua', '<p>Reforestar riberas y zonas de recarga con especies nativas mejora la infiltración y reduce la erosión. Las siembras suelen hacerse al inicio de la época lluviosa.</p>'],
        ['🛡️', 'Protección', 'Cómo cuidamos el recurso', '<p>Áreas protegidas, pago por servicios ambientales, áreas de protección de nacientes y educación ambiental impulsada por ASADAS y organizaciones comunales.</p>']
    ];
    OA.renderTopics = function (id) {
        var box = OA.$(id); if (!box) return; box.innerHTML = '';
        OA.TOPICS.forEach(function (t) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'topic';
            b.innerHTML = '<span>' + t[0] + '</span><b>' + t[1] + '</b><small>' + t[2] + '</small>';
            b.addEventListener('click', function () { OA.modal(t[0] + ' ' + t[1], t[3]); });
            box.appendChild(b);
        });
    };
})();
