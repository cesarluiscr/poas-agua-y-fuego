/* Prueba de práctica de Matemática — lógica de la aplicación.
   Depende de preguntas.js, que define la constante global PREGUNTAS. */
(function () {
  "use strict";

  var LETRAS = ["A", "B", "C", "D"];
  var NOTA_MINIMA = 70;
  var CLAVE_HISTORIAL = "practica-matematica-historial";
  var MAX_HISTORIAL = 10;

  var el = function (id) { return document.getElementById(id); };

  /* ------------------------------------------------------------- estado */
  var estado = {
    preguntas: [],      // preguntas del intento, ya barajadas
    respuestas: [],     // índice marcado por la persona, o null
    indice: 0,
    tema: "todos",
    mostrarTema: true
  };

  /* ------------------------------------------------------------ utilidades */
  function barajar(lista) {
    var copia = lista.slice();
    for (var i = copia.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = copia[i]; copia[i] = copia[j]; copia[j] = t;
    }
    return copia;
  }

  function mostrarSeccion(id) {
    ["inicio", "prueba", "resultados"].forEach(function (nombre) {
      el(nombre).classList.toggle("oculto", nombre !== id);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function temaDe(pregunta) {
    return pregunta.bloque + " · " + pregunta.afirmacion;
  }

  function preguntasDelTema(tema) {
    if (tema === "todos") { return PREGUNTAS; }
    return PREGUNTAS.filter(function (p) { return temaDe(p) === tema; });
  }

  /* ----------------------------------------------------- pantalla de inicio */
  function armarSelectorDeTemas() {
    var selector = el("filtro-tema");
    var vistos = [];
    PREGUNTAS.forEach(function (p) {
      var tema = temaDe(p);
      if (vistos.indexOf(tema) === -1) { vistos.push(tema); }
    });
    vistos.forEach(function (tema) {
      var opcion = document.createElement("option");
      opcion.value = tema;
      opcion.textContent = tema;
      selector.appendChild(opcion);
    });
    el("total-banco").textContent = PREGUNTAS.length;
  }

  function armarTemario() {
    var lista = el("temario");
    var conteos = {};
    var orden = [];
    PREGUNTAS.forEach(function (p) {
      var tema = temaDe(p);
      if (!conteos[tema]) { conteos[tema] = 0; orden.push(tema); }
      conteos[tema] += 1;
    });
    orden.forEach(function (tema) {
      var li = document.createElement("li");
      var n = document.createElement("span");
      n.className = "conteo";
      n.textContent = conteos[tema];
      var t = document.createElement("span");
      t.textContent = tema;
      li.appendChild(n);
      li.appendChild(t);
      lista.appendChild(li);
    });
  }

  function actualizarAviso() {
    var tema = el("filtro-tema").value;
    var disponibles = preguntasDelTema(tema).length;
    var pedidas = parseInt(el("filtro-cantidad").value, 10);
    var usadas = (pedidas === 0) ? disponibles : Math.min(pedidas, disponibles);
    var texto = "Se usarán " + usadas + " de las " + disponibles +
                " preguntas disponibles en este tema.";
    el("aviso-disponibles").textContent = texto;
  }

  /* ------------------------------------------------------------ la prueba */
  function comenzar() {
    var tema = el("filtro-tema").value;
    var disponibles = preguntasDelTema(tema);
    var pedidas = parseInt(el("filtro-cantidad").value, 10);
    var cuantas = (pedidas === 0) ? disponibles.length
                                  : Math.min(pedidas, disponibles.length);

    var barajarOpciones = el("barajar-opciones").checked;
    estado.mostrarTema = el("mostrar-tema").checked;
    estado.tema = tema;
    estado.preguntas = barajar(disponibles).slice(0, cuantas).map(function (p) {
      if (!barajarOpciones) {
        return { base: p, opciones: p.opciones.slice(), correcta: p.correcta };
      }
      var orden = barajar([0, 1, 2, 3]);
      return {
        base: p,
        opciones: orden.map(function (i) { return p.opciones[i]; }),
        correcta: orden.indexOf(p.correcta)
      };
    });
    estado.respuestas = estado.preguntas.map(function () { return null; });
    estado.indice = 0;

    armarMapa();
    pintarPregunta();
    mostrarSeccion("prueba");
  }

  function armarMapa() {
    var mapa = el("mapa");
    mapa.innerHTML = "";
    estado.preguntas.forEach(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = i + 1;
      b.setAttribute("aria-label", "Ir a la pregunta " + (i + 1));
      b.addEventListener("click", function () {
        estado.indice = i;
        pintarPregunta();
      });
      mapa.appendChild(b);
    });
  }

  function refrescarMapa() {
    var botones = el("mapa").children;
    for (var i = 0; i < botones.length; i++) {
      botones[i].classList.toggle("contestada", estado.respuestas[i] !== null);
      botones[i].classList.toggle("actual", i === estado.indice);
    }
  }

  function pintarPregunta() {
    var item = estado.preguntas[estado.indice];
    var total = estado.preguntas.length;

    el("contador").textContent = "Pregunta " + (estado.indice + 1) + " de " + total;
    var contestadas = estado.respuestas.filter(function (r) { return r !== null; }).length;
    el("contestadas").textContent = contestadas + " contestada" +
      (contestadas === 1 ? "" : "s");
    el("progreso").style.width = ((estado.indice + 1) / total * 100) + "%";

    var etiqueta = el("tema-actual");
    etiqueta.textContent = item.base.habilidad;
    etiqueta.classList.toggle("oculto", !estado.mostrarTema);

    el("enunciado").textContent = item.base.pregunta;

    var caja = el("opciones");
    caja.innerHTML = "";
    item.opciones.forEach(function (texto, i) {
      var etiquetaOpcion = document.createElement("label");
      etiquetaOpcion.className = "opcion";

      var radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "opcion";
      radio.value = i;
      radio.checked = estado.respuestas[estado.indice] === i;
      radio.addEventListener("change", function () {
        estado.respuestas[estado.indice] = i;
        refrescarMapa();
        var hechas = estado.respuestas.filter(function (r) { return r !== null; }).length;
        el("contestadas").textContent = hechas + " contestada" + (hechas === 1 ? "" : "s");
      });

      var letra = document.createElement("span");
      letra.className = "letra";
      letra.textContent = LETRAS[i] + ".";

      var cuerpo = document.createElement("span");
      cuerpo.className = "texto";
      cuerpo.textContent = texto;

      etiquetaOpcion.appendChild(radio);
      etiquetaOpcion.appendChild(letra);
      etiquetaOpcion.appendChild(cuerpo);
      caja.appendChild(etiquetaOpcion);
    });

    el("btn-anterior").disabled = estado.indice === 0;
    el("btn-siguiente").disabled = estado.indice === total - 1;
    refrescarMapa();
  }

  function mover(salto) {
    var destino = estado.indice + salto;
    if (destino < 0 || destino >= estado.preguntas.length) { return; }
    estado.indice = destino;
    pintarPregunta();
  }

  /* ----------------------------------------------------------- calificación */
  function calificar() {
    var total = estado.preguntas.length;
    var correctas = 0, incorrectas = 0, blanco = 0;
    var porTema = {};
    var ordenTemas = [];

    estado.preguntas.forEach(function (item, i) {
      var marcada = estado.respuestas[i];
      var acerto = marcada === item.correcta;
      if (marcada === null) { blanco += 1; }
      else if (acerto) { correctas += 1; }
      else { incorrectas += 1; }

      var tema = temaDe(item.base);
      if (!porTema[tema]) { porTema[tema] = { bien: 0, total: 0 }; ordenTemas.push(tema); }
      porTema[tema].total += 1;
      if (acerto) { porTema[tema].bien += 1; }
    });

    var nota = total ? (correctas / total) * 100 : 0;
    var notaTexto = (Math.round(nota * 10) / 10).toString().replace(".", ",");
    var aprobado = nota >= NOTA_MINIMA;

    el("nota-cifra").textContent = notaTexto;
    el("veredicto").textContent = aprobado ? "Prueba aprobada" : "Prueba no aprobada";
    el("detalle-nota").textContent =
      correctas + " de " + total + " preguntas correctas. " +
      "La nota mínima de aprobación considerada es " + NOTA_MINIMA + ".";
    el("tarjeta-nota").classList.toggle("aprobado", aprobado);
    el("tarjeta-nota").classList.toggle("reprobado", !aprobado);

    el("dato-correctas").textContent = correctas;
    el("dato-incorrectas").textContent = incorrectas;
    el("dato-blanco").textContent = blanco;

    var cuerpo = el("tabla-temas");
    cuerpo.innerHTML = "";
    ordenTemas.forEach(function (tema) {
      var d = porTema[tema];
      var fila = document.createElement("tr");
      [tema, d.bien, d.total, Math.round(d.bien / d.total * 100) + "\u00a0%"]
        .forEach(function (valor, i) {
          var celda = document.createElement("td");
          if (i > 0) { celda.className = "num"; }
          celda.textContent = valor;
          fila.appendChild(celda);
        });
      cuerpo.appendChild(fila);
    });

    pintarRevision(false);
    guardarEnHistorial(notaTexto, total);
    el("btn-solo-errores").textContent = "Ver solo las falladas";
    mostrarSeccion("resultados");
  }

  function pintarRevision(soloErrores) {
    var caja = el("revision");
    caja.innerHTML = "";

    estado.preguntas.forEach(function (item, i) {
      var marcada = estado.respuestas[i];
      var acerto = marcada === item.correcta;
      if (soloErrores && acerto) { return; }

      var clase = marcada === null ? "blanco" : (acerto ? "bien" : "mal");
      var texto = marcada === null ? "Sin responder" : (acerto ? "Correcta" : "Incorrecta");

      var bloque = document.createElement("article");
      bloque.className = "revision-item " + clase;

      var cabecera = document.createElement("div");
      cabecera.className = "cabecera-revision";
      var numero = document.createElement("span");
      numero.className = "numero";
      numero.textContent = "Pregunta " + (i + 1);
      var marca = document.createElement("span");
      marca.className = "marca-estado";
      marca.textContent = texto;
      var tema = document.createElement("span");
      tema.className = "tema";
      tema.textContent = item.base.habilidad;
      cabecera.appendChild(numero);
      cabecera.appendChild(marca);
      cabecera.appendChild(tema);

      var enunciado = document.createElement("p");
      enunciado.className = "enunciado";
      enunciado.style.fontSize = "1rem";
      enunciado.textContent = item.base.pregunta;

      var lista = document.createElement("ul");
      lista.className = "lista-respuestas";
      item.opciones.forEach(function (opcionTexto, j) {
        var li = document.createElement("li");
        if (j === item.correcta) { li.className = "es-correcta"; }
        else if (j === marcada) { li.className = "elegida-mal"; }

        var letra = document.createElement("span");
        letra.className = "letra";
        letra.textContent = LETRAS[j] + ".";
        var cuerpo = document.createElement("span");
        cuerpo.textContent = opcionTexto;
        li.appendChild(letra);
        li.appendChild(cuerpo);

        if (j === item.correcta || j === marcada) {
          var pie = document.createElement("span");
          pie.className = "pie-opcion";
          pie.textContent = (j === item.correcta)
            ? (j === marcada ? "Respuesta correcta · su respuesta" : "Respuesta correcta")
            : "Su respuesta";
          li.appendChild(pie);
        }
        lista.appendChild(li);
      });

      var explicacion = document.createElement("p");
      explicacion.className = "explicacion";
      var rotulo = document.createElement("b");
      rotulo.textContent = "Por qué: ";
      explicacion.appendChild(rotulo);
      explicacion.appendChild(document.createTextNode(item.base.explicacion));

      bloque.appendChild(cabecera);
      bloque.appendChild(enunciado);
      bloque.appendChild(lista);
      bloque.appendChild(explicacion);
      caja.appendChild(bloque);
    });

    if (!caja.children.length) {
      var aviso = document.createElement("p");
      aviso.className = "tarjeta";
      aviso.textContent = "No hay preguntas falladas: todas las respuestas fueron correctas.";
      caja.appendChild(aviso);
    }
  }

  /* -------------------------------------------------------------- historial */
  function leerHistorial() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL)) || [];
    } catch (e) {
      return [];
    }
  }

  function guardarEnHistorial(nota, total) {
    var registros = leerHistorial();
    registros.unshift({
      fecha: new Date().toISOString(),
      tema: estado.tema === "todos" ? "Todos los temas" : estado.tema,
      total: total,
      nota: nota
    });
    try {
      localStorage.setItem(CLAVE_HISTORIAL,
                           JSON.stringify(registros.slice(0, MAX_HISTORIAL)));
    } catch (e) { /* almacenamiento no disponible: se continúa sin historial */ }
    pintarHistorial();
  }

  function pintarHistorial() {
    var registros = leerHistorial();
    el("tarjeta-historial").classList.toggle("oculto", registros.length === 0);
    var cuerpo = el("cuerpo-historial");
    cuerpo.innerHTML = "";
    registros.forEach(function (r) {
      var fila = document.createElement("tr");
      var fecha = new Date(r.fecha);
      var textoFecha = isNaN(fecha) ? "—" : fecha.toLocaleString("es-CR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
      [textoFecha, r.tema, r.total, r.nota].forEach(function (valor, i) {
        var celda = document.createElement("td");
        if (i > 1) { celda.className = "num"; }
        celda.textContent = valor;
        fila.appendChild(celda);
      });
      cuerpo.appendChild(fila);
    });
  }

  /* ---------------------------------------------------------------- eventos */
  function conectarEventos() {
    el("filtro-tema").addEventListener("change", actualizarAviso);
    el("filtro-cantidad").addEventListener("change", actualizarAviso);
    el("btn-comenzar").addEventListener("click", comenzar);

    el("btn-anterior").addEventListener("click", function () { mover(-1); });
    el("btn-siguiente").addEventListener("click", function () { mover(1); });

    el("btn-terminar").addEventListener("click", function () {
      var faltan = estado.respuestas.filter(function (r) { return r === null; }).length;
      if (faltan > 0) {
        var mensaje = "Quedan " + faltan + " pregunta" + (faltan === 1 ? "" : "s") +
                      " sin responder. Se contarán como incorrectas. ¿Desea calificar ahora?";
        if (!window.confirm(mensaje)) { return; }
      }
      calificar();
    });

    el("btn-abandonar").addEventListener("click", function () {
      if (!window.confirm("Se perderán las respuestas de este intento. ¿Desea salir?")) {
        return;
      }
      mostrarSeccion("inicio");
    });

    el("btn-repetir").addEventListener("click", function () { mostrarSeccion("inicio"); });
    el("btn-imprimir").addEventListener("click", function () { window.print(); });

    el("btn-solo-errores").addEventListener("click", function () {
      var soloErrores = this.textContent.indexOf("solo") !== -1;
      pintarRevision(soloErrores);
      this.textContent = soloErrores ? "Ver todas las preguntas" : "Ver solo las falladas";
    });

    el("btn-borrar-historial").addEventListener("click", function () {
      if (!window.confirm("¿Desea borrar el historial de intentos de este dispositivo?")) {
        return;
      }
      try { localStorage.removeItem(CLAVE_HISTORIAL); } catch (e) { /* nada que hacer */ }
      pintarHistorial();
    });

    document.addEventListener("keydown", function (evento) {
      if (el("prueba").classList.contains("oculto")) { return; }
      var etiqueta = (evento.target.tagName || "").toLowerCase();
      if (etiqueta === "input" && evento.target.type !== "radio") { return; }
      if (etiqueta === "select" || etiqueta === "textarea") { return; }

      if (evento.key >= "1" && evento.key <= "4") {
        var i = parseInt(evento.key, 10) - 1;
        var radios = el("opciones").querySelectorAll("input[type=radio]");
        if (radios[i]) {
          radios[i].checked = true;
          radios[i].dispatchEvent(new Event("change"));
          evento.preventDefault();
        }
      } else if (evento.key === "ArrowRight") {
        mover(1); evento.preventDefault();
      } else if (evento.key === "ArrowLeft") {
        mover(-1); evento.preventDefault();
      }
    });
  }

  /* ----------------------------------------------------------------- inicio */
  function iniciar() {
    if (typeof PREGUNTAS === "undefined" || !PREGUNTAS.length) {
      el("inicio").innerHTML =
        '<div class="tarjeta"><h2>No se pudo cargar el banco de preguntas</h2>' +
        '<p class="ayuda">Recargue la página. Si el problema persiste, verifique que el ' +
        'archivo preguntas.js esté disponible.</p></div>';
      return;
    }
    armarSelectorDeTemas();
    armarTemario();
    actualizarAviso();
    pintarHistorial();
    conectarEventos();
  }

  document.addEventListener("DOMContentLoaded", iniciar);
}());
