/*
 * enhance.js — Mejoras de accesibilidad para Poás Agua y Fuego
 *  1) Ampliar imágenes al tocarlas (lightbox centrado con zoom por pellizco y doble toque).
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
    '.pz-overlay{position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.94);' +
      'display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s ease;' +
      'touch-action:none;overflow:hidden;-webkit-user-select:none;user-select:none;}' +
    '.pz-overlay.pz-open{opacity:1;}' +
    '.pz-overlay img{max-width:100%;max-height:100%;object-fit:contain;transform-origin:center center;' +
      'will-change:transform;-webkit-user-drag:none;user-drag:none;pointer-events:none;display:block;}' +
    '.pz-close{position:fixed;top:12px;right:14px;z-index:1000000;width:46px;height:46px;border:none;' +
      'border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:26px;line-height:46px;' +
      'text-align:center;cursor:pointer;padding:0;}' +
    '.pz-hint{position:fixed;bottom:18px;left:0;right:0;text-align:center;color:rgba(255,255,255,.85);' +
      'font-size:.85rem;pointer-events:none;font-family:sans-serif;padding:0 12px;}' +
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
    '.fs-fab button[disabled]{opacity:.35;cursor:default;}' +
    /* Pista de menú (flecha) */
    '.mh-tip{position:fixed;z-index:99997;pointer-events:none;font-family:sans-serif;max-width:88vw;}' +
    '.mh-tip.mh-hide{opacity:0;transition:opacity .35s ease;pointer-events:none;}' +
    '.mh-inner{display:flex;flex-direction:column;align-items:flex-end;pointer-events:auto;' +
      'animation:mhBounce 1.1s ease-in-out infinite;}' +
    '.mh-arrow{font-size:32px;line-height:1;color:#FF5A5F;text-shadow:0 2px 6px rgba(0,0,0,.35);margin-right:8px;}' +
    '.mh-label{margin-top:1px;background:#FF5A5F;color:#fff;font-size:12.5px;font-weight:700;' +
      'padding:6px 12px;border-radius:16px;box-shadow:0 6px 18px rgba(0,0,0,.3);white-space:nowrap;cursor:pointer;}' +
    '@keyframes mhBounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ================================================================= */
  /*  1) LIGHTBOX DE IMÁGENES CON ZOOM                                 */
  /*  Modelo: la imagen se centra sola (flex + object-fit:contain).    */
  /*  El zoom se aplica con transform desde el CENTRO.                 */
  /* ================================================================= */
  var overlay, imgEl, closeBtn, hintEl;
  var scale = 1, tx = 0, ty = 0;          // estado de la transformación
  var natW = 0, natH = 0;                  // tamaño natural de la imagen
  var MIN = 1, MAX = 6;

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

  // Tamaño con el que se dibuja la imagen ajustada al viewport (object-fit:contain).
  function fittedSize() {
    var vw = window.innerWidth, vh = window.innerHeight;
    if (!natW || !natH) return { w: vw, h: vh };
    var ar = natW / natH, arV = vw / vh, w, h;
    if (ar > arV) { w = vw; h = vw / ar; } else { h = vh; w = vh * ar; }
    return { w: w, h: h };
  }

  function applyTransform() {
    imgEl.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
  }

  function reset() {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  }

  function clampPan() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var f = fittedSize();
    var maxX = Math.max(0, (f.w * scale - vw) / 2);
    var maxY = Math.max(0, (f.h * scale - vh) / 2);
    tx = Math.min(maxX, Math.max(-maxX, tx));
    ty = Math.min(maxY, Math.max(-maxY, ty));
  }

  function openLightbox(src, alt) {
    if (!overlay) buildOverlay();
    hintEl.style.display = '';
    natW = 0; natH = 0;
    reset();
    imgEl.alt = alt || '';
    imgEl.onload = function () {
      natW = imgEl.naturalWidth || imgEl.width;
      natH = imgEl.naturalHeight || imgEl.height;
      reset();
    };
    imgEl.src = src;
    overlay.style.display = 'flex';
    requestAnimationFrame(function () { overlay.classList.add('pz-open'); });
    document.documentElement.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!overlay) return;
    overlay.classList.remove('pz-open');
    document.documentElement.style.overflow = '';
    setTimeout(function () { overlay.style.display = 'none'; imgEl.src = ''; }, 200);
  }

  function setupGestures() {
    var pointers = {};
    var startDist = 0, startScale = 1;
    var startTx = 0, startTy = 0, startMid = { x: 0, y: 0 };
    var panStart = null;
    var lastTap = 0;

    function pts() { return Object.keys(pointers).map(function (k) { return pointers[k]; }); }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

    overlay.addEventListener('pointerdown', function (e) {
      if (e.target === closeBtn) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { overlay.setPointerCapture(e.pointerId); } catch (err) {}
      var p = pts();
      if (p.length === 2) {
        startDist = dist(p[0], p[1]);
        startScale = scale;
        startMid = mid(p[0], p[1]);
        startTx = tx; startTy = ty;
        panStart = null;
      } else if (p.length === 1) {
        panStart = { x: e.clientX, y: e.clientY, tx: tx, ty: ty };
      }
    });

    overlay.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var p = pts();
      if (p.length === 2 && startDist > 0) {
        var d = dist(p[0], p[1]);
        scale = Math.min(MAX, Math.max(MIN, startScale * (d / startDist)));
        // Mantener el punto medio del pellizco relativamente estable.
        var m = mid(p[0], p[1]);
        tx = startTx + (m.x - startMid.x);
        ty = startTy + (m.y - startMid.y);
        clampPan();
        applyTransform();
      } else if (p.length === 1 && panStart && scale > MIN + 0.001) {
        tx = panStart.tx + (e.clientX - panStart.x);
        ty = panStart.ty + (e.clientY - panStart.y);
        clampPan();
        applyTransform();
      }
    });

    function onUp(e) {
      delete pointers[e.pointerId];
      var p = pts();
      if (p.length < 2) startDist = 0;
      if (p.length === 1) panStart = { x: p[0].x, y: p[0].y, tx: tx, ty: ty };
      else if (p.length === 0) panStart = null;
    }
    overlay.addEventListener('pointerup', onUp);
    overlay.addEventListener('pointercancel', onUp);

    // Doble toque / doble clic para acercar y alejar.
    overlay.addEventListener('pointerup', function (e) {
      if (e.target === closeBtn || e.target === overlay) return;
      var now = Date.now();
      if (now - lastTap < 300) {
        hintEl.style.display = 'none';
        if (scale > MIN + 0.01) {
          reset();
        } else {
          scale = 2.5; tx = 0; ty = 0;
          clampPan();
          applyTransform();
        }
      }
      lastTap = now;
    });

    window.addEventListener('resize', function () {
      if (overlay && overlay.classList.contains('pz-open')) { clampPan(); applyTransform(); }
    });
  }

  // Marca las imágenes de contenido como ampliables.
  function markImages(root) {
    var imgs = (root || document).querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (img.dataset.pzInit) continue;
      if (img.closest('a')) continue;                 // no romper enlaces
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
      label.textContent = Math.round(STEPS[idx] * 100) + '%';
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

  /* ================================================================= */
  /*  3) PISTA DE MENÚ (flecha que señala el botón)                    */
  /* ================================================================= */
  function buildMenuHint() {
    var DONE = 'poas-menu-hint-done';
    try { if (localStorage.getItem(DONE)) return; } catch (e) {}

    var ham = document.querySelector('.hamburger');
    if (!ham) return;
    // Solo si el botón es visible (en móvil). En escritorio suele estar oculto.
    if (!ham.offsetWidth && !ham.offsetHeight) return;

    var tip = document.createElement('div');
    tip.className = 'mh-tip';
    tip.innerHTML = '<div class="mh-inner"><div class="mh-arrow">▲</div>' +
      '<div class="mh-label">¡Aquí está el menú!</div></div>';
    document.body.appendChild(tip);

    function place() {
      var r = ham.getBoundingClientRect();
      // Anclar al borde derecho del botón: la etiqueta crece hacia adentro y no se corta.
      tip.style.right = Math.max(6, window.innerWidth - r.right) + 'px';
      tip.style.left = 'auto';
      tip.style.top = (r.bottom + 6) + 'px';
    }
    place();

    function hide() { tip.classList.add('mh-hide'); }
    function done() {
      try { localStorage.setItem(DONE, '1'); } catch (e) {}
      hide();
      setTimeout(function () { if (tip.parentNode) tip.parentNode.removeChild(tip); }, 400);
    }

    ham.addEventListener('click', done);
    tip.addEventListener('click', done);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, { passive: true });
    setTimeout(hide, 10000); // se atenúa sola tras 10 s (volverá a mostrarse hasta que abran el menú)
  }

  /* ----------------------------------------------------------------- */
  /*  Inicialización                                                    */
  /* ----------------------------------------------------------------- */
  function init() {
    markImages(document);
    buildFontControl();
    buildMenuHint();
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
