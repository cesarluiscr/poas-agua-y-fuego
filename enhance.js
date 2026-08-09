/*
 * enhance.js — Mejoras de accesibilidad para Poás Agua y Fuego
 *  1) Ampliar imágenes al tocarlas (lightbox con zoom por pellizco y doble toque).
 *  2) Control para aumentar / disminuir el tamaño de la letra (persistente).
 *
 * Autónomo: inyecta su propio CSS. Solo requiere <script src="enhance.js"></script>.
 */
(function () {
  'use strict';

  /* ----------------------------------------------------------------- */
  /*  Estilos                                                           */
  /* ----------------------------------------------------------------- */
  var css = '' +
    '.pz-overlay{position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.93);' +
      'display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s ease;' +
      'touch-action:none;overflow:hidden;-webkit-user-select:none;user-select:none;}' +
    '.pz-overlay.pz-open{opacity:1;}' +
    '.pz-overlay img{max-width:100%;max-height:100%;transform-origin:0 0;will-change:transform;' +
      '-webkit-user-drag:none;user-drag:none;pointer-events:none;}' +
    '.pz-close{position:fixed;top:12px;right:14px;z-index:1000000;width:46px;height:46px;border:none;' +
      'border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:26px;line-height:46px;' +
      'text-align:center;cursor:pointer;padding:0;}' +
    '.pz-hint{position:fixed;bottom:18px;left:0;right:0;text-align:center;color:rgba(255,255,255,.85);' +
      'font-size:.85rem;pointer-events:none;font-family:sans-serif;}' +
    'img.pz-able{cursor:zoom-in;}' +
    /* Control de tamaño de letra */
    '.fs-fab{position:fixed;left:14px;bottom:16px;z-index:99998;display:flex;align-items:center;gap:6px;' +
      'background:rgba(47,54,53,.92);color:#fff;border-radius:30px;padding:6px;box-shadow:0 6px 20px rgba(0,0,0,.28);' +
      'font-family:sans-serif;backdrop-filter:blur(4px);}' +
    '.fs-fab button{border:none;background:transparent;color:#fff;cursor:pointer;border-radius:50%;' +
      'width:38px;height:38px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0;}' +
    '.fs-fab button:active{background:rgba(255,255,255,.18);}' +
    '.fs-fab .fs-minus{font-size:15px;}' +
    '.fs-fab .fs-plus{font-size:22px;}' +
    '.fs-fab .fs-label{font-size:12px;min-width:34px;text-align:center;opacity:.9;}' +
    '.fs-fab button[disabled]{opacity:.35;cursor:default;}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ================================================================= */
  /*  1) LIGHTBOX DE IMÁGENES CON ZOOM                                 */
  /* ================================================================= */
  var overlay, imgEl, closeBtn, hintEl;
  var scale = 1, tx = 0, ty = 0, baseScale = 1;
  var natW = 0, natH = 0, fitScale = 1;

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'pz-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    imgEl = document.createElement('img');
    overlay.appendChild(imgEl);

    closeBtn = document.createElement('button');
    closeBtn.className = 'pz-close';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.innerHTML = '&times;';
    overlay.appendChild(closeBtn);

    hintEl = document.createElement('div');
    hintEl.className = 'pz-hint';
    hintEl.textContent = 'Pellizca o doble toque para acercar · Toca fuera para cerrar';
    overlay.appendChild(hintEl);

    document.body.appendChild(overlay);

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('pz-open')) closeLightbox();
    });

    setupGestures();
  }

  function applyTransform() {
    imgEl.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
  }

  function centerImage() {
    // Ajusta la imagen al viewport y la centra.
    var vw = window.innerWidth, vh = window.innerHeight;
    fitScale = Math.min(vw / natW, vh / natH, 1);
    scale = fitScale;
    baseScale = fitScale;
    tx = (vw - natW * scale) / 2;
    ty = (vh - natH * scale) / 2;
    applyTransform();
  }

  function openLightbox(src, alt) {
    if (!overlay) buildOverlay();
    hintEl.style.display = '';
    var loader = new Image();
    loader.onload = function () {
      natW = loader.naturalWidth || loader.width;
      natH = loader.naturalHeight || loader.height;
      imgEl.style.width = natW + 'px';
      imgEl.style.height = natH + 'px';
      imgEl.src = src;
      imgEl.alt = alt || '';
      centerImage();
      overlay.style.display = 'flex';
      requestAnimationFrame(function () { overlay.classList.add('pz-open'); });
      document.documentElement.style.overflow = 'hidden';
    };
    loader.src = src;
  }

  function closeLightbox() {
    if (!overlay) return;
    overlay.classList.remove('pz-open');
    document.documentElement.style.overflow = '';
    setTimeout(function () { overlay.style.display = 'none'; }, 200);
  }

  function clampPan() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var w = natW * scale, h = natH * scale;
    if (w <= vw) { tx = (vw - w) / 2; }
    else { tx = Math.min(0, Math.max(vw - w, tx)); }
    if (h <= vh) { ty = (vh - h) / 2; }
    else { ty = Math.min(0, Math.max(vh - h, ty)); }
  }

  function setupGestures() {
    var pointers = {};
    var startDist = 0, startScale = 1, startMid = { x: 0, y: 0 };
    var startTx = 0, startTy = 0;
    var panStart = null;
    var lastTap = 0;

    function ptArr() { return Object.keys(pointers).map(function (k) { return pointers[k]; }); }

    overlay.addEventListener('pointerdown', function (e) {
      if (e.target === closeBtn) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      overlay.setPointerCapture(e.pointerId);
      var pts = ptArr();
      if (pts.length === 2) {
        startDist = dist(pts[0], pts[1]);
        startScale = scale;
        startMid = mid(pts[0], pts[1]);
        startTx = tx; startTy = ty;
        panStart = null;
      } else if (pts.length === 1) {
        panStart = { x: e.clientX, y: e.clientY, tx: tx, ty: ty };
      }
    });

    overlay.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var pts = ptArr();
      if (pts.length === 2) {
        var d = dist(pts[0], pts[1]);
        var newScale = Math.min(Math.max(startScale * (d / startDist), fitScale), 8);
        // Zoom hacia el punto medio del pellizco.
        var m = startMid;
        tx = m.x - (m.x - startTx) * (newScale / startScale);
        ty = m.y - (m.y - startTy) * (newScale / startScale);
        scale = newScale;
        clampPan();
        applyTransform();
      } else if (pts.length === 1 && panStart && scale > fitScale + 0.001) {
        tx = panStart.tx + (e.clientX - panStart.x);
        ty = panStart.ty + (e.clientY - panStart.y);
        clampPan();
        applyTransform();
      }
    });

    function onUp(e) {
      delete pointers[e.pointerId];
      var pts = ptArr();
      if (pts.length < 2) { startDist = 0; }
      if (pts.length === 1) {
        panStart = { x: pts[0].x, y: pts[0].y, tx: tx, ty: ty };
      } else if (pts.length === 0) {
        panStart = null;
      }
    }
    overlay.addEventListener('pointerup', onUp);
    overlay.addEventListener('pointercancel', onUp);

    // Doble toque / doble clic para acercar-alejar.
    overlay.addEventListener('pointerup', function (e) {
      if (e.target === closeBtn || e.target === overlay) return;
      var now = Date.now();
      if (now - lastTap < 300) {
        hintEl.style.display = 'none';
        if (scale > fitScale + 0.01) {
          centerImage();
        } else {
          var target = Math.min(fitScale * 3, 6);
          var f = target / scale;
          tx = e.clientX - (e.clientX - tx) * f;
          ty = e.clientY - (e.clientY - ty) * f;
          scale = target;
          clampPan();
          applyTransform();
        }
      }
      lastTap = now;
    });

    window.addEventListener('resize', function () {
      if (overlay && overlay.classList.contains('pz-open')) centerImage();
    });
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

  // Marca las imágenes de contenido como ampliables.
  function markImages(root) {
    var imgs = (root || document).querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (img.dataset.pzInit) continue;
      // Excluir imágenes dentro de enlaces (para no romper navegación) e íconos pequeños.
      if (img.closest('a')) continue;
      if (img.hasAttribute('data-no-zoom')) continue;
      var w = img.getAttribute('width');
      if ((img.clientWidth && img.clientWidth < 70) || (w && parseInt(w, 10) < 70)) continue;
      img.dataset.pzInit = '1';
      img.classList.add('pz-able');
      img.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var full = this.getAttribute('data-full') || this.currentSrc || this.src;
        openLightbox(full, this.alt);
      });
    }
  }

  /* ================================================================= */
  /*  2) CONTROL DE TAMAÑO DE LETRA                                    */
  /* ================================================================= */
  var STEPS = [1, 1.15, 1.3, 1.45, 1.6];
  var BASE_PX = 16;
  var KEY = 'poas-font-scale';

  function currentIdx() {
    var saved = parseFloat(localStorage.getItem(KEY));
    var idx = STEPS.indexOf(saved);
    return idx === -1 ? 0 : idx;
  }

  function applyScale(idx) {
    document.documentElement.style.fontSize = (BASE_PX * STEPS[idx]) + 'px';
    try { localStorage.setItem(KEY, String(STEPS[idx])); } catch (e) {}
  }

  function buildFontControl() {
    var idx = currentIdx();
    applyScale(idx);

    var fab = document.createElement('div');
    fab.className = 'fs-fab';
    fab.setAttribute('role', 'group');
    fab.setAttribute('aria-label', 'Tamaño del texto');

    var minus = document.createElement('button');
    minus.className = 'fs-minus';
    minus.type = 'button';
    minus.setAttribute('aria-label', 'Reducir tamaño del texto');
    minus.textContent = 'A';

    var label = document.createElement('span');
    label.className = 'fs-label';

    var plus = document.createElement('button');
    plus.className = 'fs-plus';
    plus.type = 'button';
    plus.setAttribute('aria-label', 'Aumentar tamaño del texto');
    plus.textContent = 'A';

    fab.appendChild(minus);
    fab.appendChild(label);
    fab.appendChild(plus);
    document.body.appendChild(fab);

    function refresh() {
      var pct = Math.round(STEPS[idx] * 100);
      label.textContent = pct + '%';
      minus.disabled = idx === 0;
      plus.disabled = idx === STEPS.length - 1;
    }
    minus.addEventListener('click', function () {
      if (idx > 0) { idx--; applyScale(idx); refresh(); }
    });
    plus.addEventListener('click', function () {
      if (idx < STEPS.length - 1) { idx++; applyScale(idx); refresh(); }
    });
    refresh();
  }

  /* ----------------------------------------------------------------- */
  /*  Inicialización                                                    */
  /* ----------------------------------------------------------------- */
  function init() {
    markImages(document);
    buildFontControl();
    // Reobservar imágenes añadidas dinámicamente (galerías, etc.).
    if (window.MutationObserver) {
      var mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (muts[i].addedNodes && muts[i].addedNodes.length) { markImages(document); break; }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
