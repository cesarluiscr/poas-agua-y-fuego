/* main.js — arranque del Observatorio del Agua-Poás. */
(function () {
    'use strict';
    var OA = window.OA;

    var saved = OA.load('zone');
    if (saved) OA.zone = OA.ZONES.filter(function (z) { return z.id === saved.v; })[0] || OA.zone;

    OA.$('modalClose').addEventListener('click', OA.closeModal);
    OA.$('modal').addEventListener('click', function (e) { if (e.target.id === 'modal') OA.closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') OA.closeModal(); });

    OA.season();
    OA.renderZones();
    OA.renderTopics('topics');
    OA.initDatos();
    OA.initReportes();
    OA.initMas();

    OA.onShow.mapa = OA.initMap;
    var gobDone = false;
    OA.onShow.gob = function () { if (!gobDone) { gobDone = true; OA.loadGobernanza(); } };

    // Al cambiar de zona se invalidan los datos que dependen de ella.
    var loadLive = OA.loadLive;
    OA.loadLive = function () { if (OA.resetDatos) OA.resetDatos(); loadLive(); };

    OA.$('btnRefresh').addEventListener('click', function () {
        OA.loadLive();
        OA.processQueue();
        if (!OA.$('v-datos').hidden) { OA.loadHistory(true); }
    });
    window.addEventListener('online', function () { OA.offline(null); OA.loadLive(); });
    window.addEventListener('offline', function () { OA.offline('Sin conexión · se muestran los últimos datos guardados.'); });

    OA.loadLive();
    OA.show(location.hash.slice(1) || 'inicio');
})();
