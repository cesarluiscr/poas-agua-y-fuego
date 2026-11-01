/*
 * reportes.js — reportes ciudadanos con seguimiento verificable.
 *
 * Reglas:
 *  - Cada reporte recibe un código único y fecha/hora al crearse.
 *  - Se guarda primero en el teléfono como "pendiente".
 *  - Solo pasa a "recibido" cuando el servidor responde {success:true}
 *    (petición CORS legible; nunca se usa no-cors).
 *  - La cola procesa TODOS los pendientes en cada intento, uno tras otro.
 *  - El estado de atención se consulta al servidor con el código.
 */
(function () {
    'use strict';
    var OA = window.OA, C = OA.C;
    var API = 'https://script.google.com/macros/s/AKfycbyW2o0WW2cHvsuCyTqFQ4JxWUt_8Y2BkY666DvZPMRSo50Ox4shR9sz1P7dbDxPMP2z/exec';
    var WHATSAPP = '50687058612';
    var KEY = 'reportes', MAX = 60;
    var ESTADOS = {
        pendiente: ['pen', '⏳ Pendiente de envío'], recibido: ['obs', '✅ Recibido por el servidor'], 'en revisión': ['est', '🔎 En revisión'],
        asignado: ['est', '📌 Asignado'], 'en atención': ['pro', '🛠️ En atención'], resuelto: ['obs', '✔️ Resuelto']
    };

    function list() { var c = OA.load(KEY); return c && Array.isArray(c.v) ? c.v : []; }
    function save(a) { return OA.store(KEY, a.slice(-MAX)); }
    function update(codigo, patch) {
        var a = list(); a.forEach(function (r) { if (r.codigo === codigo) Object.keys(patch).forEach(function (k) { r[k] = patch[k]; }); }); save(a);
    }
    OA.myReports = list;

    function newCode() {
        var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', rnd = new Uint8Array(5), s = '';
        (window.crypto || window.msCrypto).getRandomValues(rnd);
        for (var i = 0; i < rnd.length; i++) s += abc[rnd[i] % abc.length];
        var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
        return 'OAP-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + s;
    }
    function clean(s, n) { return String(s || '').replace(/<[^>]*>/g, '').replace(/[*_~`[\]]/g, '').trim().slice(0, n); }

    // Las fotos se guardan aparte para no agotar el almacenamiento de la lista.
    function fotoKey(c) { return 'foto-' + c; }
    function getFoto(c) { var f = OA.load(fotoKey(c)); return f && f.v; }
    function dropFoto(c) { try { localStorage.removeItem('oap:' + fotoKey(c)); } catch (e) {} }

    // Migra la cola de la versión 1.1 (sin código) a reportes con código.
    (function migrate() {
        var old = OA.load('pendientes');
        if (!old || !Array.isArray(old.v) || !old.v.length) return;
        var a = list();
        old.v.forEach(function (p) {
            a.push({ codigo: newCode(), creado: new Date(old.t).toISOString(), tipo: String(p.categoria || '').replace(/^.*—\s*/, '') || 'Otro',
                ubic: '', desc: p.descripcion || '', nombre: p.nombre || '', contacto: p.contacto || '', consentimiento: false,
                estado: 'pendiente', confirmado: false, intentos: 0, migrado: true });
        });
        save(a);
        try { localStorage.removeItem('oap:pendientes'); } catch (e) {}
    })();

    function payload(r) {
        var foto = getFoto(r.codigo);
        return {
            tipo: 'reporte_agua', codigo: r.codigo, creado: r.creado, categoria: 'Agua — ' + r.tipo,
            descripcion: r.desc + (r.ubic ? '\nReferencia: ' + r.ubic : '') + (r.lat != null ? '\nCoordenadas: ' + r.lat + ', ' + r.lon + ' (marcadas en el mapa)' : '') + '\nCódigo: ' + r.codigo,
            ubicacion: r.ubic, lat: r.lat, lon: r.lon, precision: r.lat != null ? 'punto elegido manualmente en el mapa' : '',
            nombre: r.nombre, contacto: r.contacto, consentimiento: !!r.consentimiento,
            foto: foto ? foto.split(',')[1] : '', foto_mime: foto ? 'image/jpeg' : '',
            app: 'observatorio-agua-poas/' + OA.VERSION
        };
    }

    // Envío con confirmación verificable: requiere JSON {success:true} del servidor.
    function send(r) {
        return OA.fetchT(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload(r)), redirect: 'follow' }, 30000)
            .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
            .then(function (j) {
                if (!j || (j.success !== true && j.ok !== true)) throw new Error((j && j.error) || 'respuesta no válida');
                var now = new Date().toISOString();
                update(r.codigo, { estado: j.estado || 'recibido', confirmado: true, confirmadoEn: now, actualizado: now, error: null });
                dropFoto(r.codigo);
                return true;
            })
            .catch(function (err) {
                update(r.codigo, { intentos: (r.intentos || 0) + 1, ultimoIntento: new Date().toISOString(), error: navigator.onLine ? String(err.message || err) : 'sin conexión' });
                return false;
            });
    }

    var busy = false;
    OA.processQueue = function () {
        if (busy) return Promise.resolve();
        var pend = list().filter(function (r) { return !r.confirmado; });
        if (!pend.length) return Promise.resolve();
        busy = true;
        // Todos los pendientes, en orden, sin detenerse en el primero que falle.
        return pend.reduce(function (p, r) { return p.then(function () { return send(r); }); }, Promise.resolve())
            .then(function () { busy = false; render(); });
    };

    // Consulta de avance: GET ?accion=estado&codigo=… (no devuelve datos personales).
    function checkStatus() {
        var conf = list().filter(function (r) { return r.confirmado && r.estado !== 'resuelto'; });
        return conf.reduce(function (p, r) {
            return p.then(function () {
                return OA.fetchT(API + '?accion=estado&codigo=' + encodeURIComponent(r.codigo), {}, 15000).then(function (res) { return res.json(); }).then(function (j) {
                    if (j && j.estado) update(r.codigo, { estado: String(j.estado).toLowerCase(), actualizado: j.actualizado || new Date().toISOString(), accion: j.accion || null, seguimiento: true });
                    else update(r.codigo, { seguimiento: false });
                }).catch(function () {});
            });
        }, Promise.resolve());
    }

    function render() {
        var a = list().slice().reverse();
        if (!a.length) { OA.html('myReports', '<p class="muted">Todavía no enviaste reportes desde este teléfono.</p>'); return; }
        OA.html('myReports', a.map(function (r) {
            var e = ESTADOS[r.estado] || ['est', OA.esc(r.estado)];
            var note = !r.confirmado
                ? '<p class="tiny warn-txt">Aún no confirmado por el servidor' + (r.intentos ? ' · ' + r.intentos + ' intento(s), último: ' + OA.stamp(r.ultimoIntento) + (r.error ? ' (' + OA.esc(r.error) + ')' : '') : '') + '. Se reintentará automáticamente.</p>'
                : '<p class="tiny muted">Confirmado el ' + OA.stamp(r.confirmadoEn) + (r.seguimiento === false ? ' · el seguimiento en línea aún no está habilitado por la institución' : r.actualizado ? ' · estado al ' + (/^\d{4}-\d{2}-\d{2}T/.test(r.actualizado) ? OA.stamp(r.actualizado) : OA.esc(r.actualizado)) : '') + (r.accion ? ' · ' + OA.esc(r.accion) : '') + '</p>';
            return '<div class="item report"><div class="row-head"><b class="mono">' + OA.esc(r.codigo) + '</b><span class="badge ' + e[0] + '">' + e[1] + '</span></div>' +
                '<p class="tiny">' + OA.esc(r.tipo) + ' · ' + OA.stamp(r.creado) + (r.ubic ? ' · ' + OA.esc(r.ubic) : '') + (r.lat != null ? ' · 📍' : '') + (getFoto(r.codigo) ? ' · 📷' : '') + '</p>' + note + '</div>';
        }).join(''));
    }

    // Reduce la foto a 1280 px y JPEG 0,8 para enviarla.
    function resize(file) {
        return new Promise(function (ok, fail) {
            if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return fail(new Error('Formato no permitido (usá JPG, PNG o WebP).'));
            if (file.size > 15 * 1024 * 1024) return fail(new Error('La imagen supera 15 MB.'));
            var url = URL.createObjectURL(file), img = new Image();
            img.onload = function () {
                var s = Math.min(1, 1280 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
                cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                URL.revokeObjectURL(url);
                ok(cv.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = function () { URL.revokeObjectURL(url); fail(new Error('No se pudo leer la imagen.')); };
            img.src = url;
        });
    }

    OA.initReportes = function () {
        var msg = OA.$('rMsg'), foto = null, point = null;
        function say(t, col) { msg.style.color = col; msg.textContent = t; }
        function coordTxt() {
            OA.html('rCoord', point ? '📍 ' + point.lat + ', ' + point.lon + ' <span class="muted">(punto elegido en el mapa)</span> <button type="button" class="link-btn" id="rClearPt">Quitar</button>'
                : 'Sin coordenadas. <button type="button" class="link-btn" id="rUseMap">📍 Usar el punto marcado en el mapa</button>');
        }
        coordTxt();
        OA.$('rCoord').addEventListener('click', function (e) {
            if (e.target.id === 'rUseMap') {
                if (!OA.mapPoint) { say('Primero tocá un punto en la pestaña Mapa.', C.alert); return; }
                point = { lat: OA.mapPoint.lat, lon: OA.mapPoint.lon }; coordTxt(); say('', C.ok);
            } else if (e.target.id === 'rClearPt') { point = null; coordTxt(); }
        });
        OA.$('rFoto').addEventListener('change', function (e) {
            var f = e.target.files && e.target.files[0]; if (!f) return;
            resize(f).then(function (d) {
                foto = d; var pv = OA.$('rFotoPrev');
                pv.innerHTML = '<img src="' + d + '" alt="Vista previa de la fotografía"><button type="button" class="link-btn" id="rFotoDel">Quitar foto</button>';
                pv.hidden = false;
                OA.$('rFotoDel').addEventListener('click', function () { foto = null; pv.hidden = true; pv.innerHTML = ''; OA.$('rFoto').value = ''; });
            }).catch(function (err) { say(err.message, C.bad); OA.$('rFoto').value = ''; });
        });

        OA.$('report').addEventListener('submit', function (e) {
            e.preventDefault();
            var desc = clean(OA.$('rDesc').value, 1000);
            if (desc.length < 10) { say('Describí la situación (al menos 10 caracteres).', C.bad); OA.$('rDesc').focus(); return; }
            if (!OA.$('rConsent').checked) { say('Para enviar el reporte es necesario aceptar el aviso de privacidad.', C.bad); return; }
            var r = { codigo: newCode(), creado: new Date().toISOString(), tipo: OA.$('rTipo').value, ubic: clean(OA.$('rUbic').value, 200),
                lat: point ? point.lat : null, lon: point ? point.lon : null, desc: desc,
                nombre: clean(OA.$('rNombre').value, 100), contacto: clean(OA.$('rContacto').value, 100),
                consentimiento: true, estado: 'pendiente', confirmado: false, intentos: 0 };
            var a = list(); a.push(r);
            if (!save(a)) { say('No hay espacio en el teléfono para guardar el reporte. Borrá reportes antiguos en Más → Privacidad.', C.bad); return; }
            var fotoGuardada = foto ? OA.store(fotoKey(r.codigo), foto) : true;
            var wa = OA.$('rWhats').checked;
            OA.$('rSend').disabled = true;
            say('Enviando ' + r.codigo + '…', C.blue);
            send(r).then(function (ok) {
                OA.$('rSend').disabled = false;
                if (ok) say('✅ Reporte ' + r.codigo + ' recibido por el servidor. Guardá el código para dar seguimiento.', C.ok);
                else say('⚠️ El servidor no confirmó la recepción. El reporte ' + r.codigo + ' quedó guardado en este teléfono y se reenviará automáticamente.' + (fotoGuardada ? '' : ' (La foto no cabía en el teléfono y no se guardó.)'), C.alert);
                if (wa) {
                    var t = '💧 REPORTE DEL AGUA — Observatorio del Agua-Poás\nCódigo: ' + r.codigo + '\nTipo: ' + r.tipo + '\n' + (r.ubic ? 'Referencia: ' + r.ubic + '\n' : '') +
                        (r.lat != null ? 'Coordenadas: ' + r.lat + ', ' + r.lon + '\n' : '') + '\n' + r.desc;
                    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(t), '_blank');
                }
                OA.$('report').reset(); foto = null; point = null; coordTxt();
                OA.$('rFotoPrev').hidden = true; OA.$('rFotoPrev').innerHTML = '';
                render();
            });
        });
        OA.$('rRetry').addEventListener('click', function () {
            OA.html('myReports', '<p class="empty">Sincronizando…</p>');
            OA.processQueue().then(checkStatus).then(render);
        });
        OA.onShow.reportar = render;
        window.addEventListener('online', function () { OA.processQueue(); });
        render();
        OA.processQueue();
    };
})();
