/**
 * ============================================================
 *  POÁS AGUA Y FUEGO – Google Apps Script (backend de formularios)
 * ============================================================
 *
 *  Recibe los envíos de los formularios del sitio y los guarda en
 *  hojas separadas según el tipo: Contacto, Suscriptores/Empleo,
 *  Quejas, Eventos y un respaldo genérico "Otros".
 *
 *  INSTRUCCIONES DE INSTALACIÓN:
 *  1. En drive.google.com → Nuevo → Hoja de cálculo de Google.
 *  2. Nómbrala "Poás Agua y Fuego – Formularios".
 *  3. Extensiones → Apps Script.
 *  4. Borrá el código de ejemplo y pegá TODO este archivo. Guardá (Ctrl+S).
 *  5. Implementar → Nueva implementación → Tipo: Aplicación web.
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier persona
 *  6. Implementar → Autorizar → Copiar la URL que termina en /exec.
 *  7. Pegá esa URL en script.js, en la constante APPS_SCRIPT_URL.
 * ============================================================
 */

// El token de lectura NO se guarda en este archivo: este repositorio es publico.
// Se configura una sola vez dentro del editor de Apps Script:
//   Configuracion del proyecto -> Propiedades del script -> Agregar propiedad
//   Nombre: READ_TOKEN     Valor: (tu token privado)
function getReadToken() {
  return PropertiesService.getScriptProperties().getProperty('READ_TOKEN') || '';
}

// Evita inyección de fórmulas en Sheets.
function sanitizeForSheet(value) {
  var str = String(value == null ? '' : value).trim();
  if (str.length > 3000) str = str.substring(0, 3000);
  return /^[=+\-@]/.test(str) ? "'" + str : str;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

// Devuelve (o crea) una hoja con sus encabezados.
function getSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight('bold').setBackground('#0E5E6F').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function detectTipo(data) {
  var t = String(data.tipo || '').toLowerCase();
  if (t) return t;
  if (data.titulo && data.fecha) return 'evento';
  if (data.categoria && data.descripcion) return 'queja';
  if ((data.nombreCompleto || data.nombre) && data.correo) return 'suscriptor';
  return 'otro';
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ success: false, error: 'Sin datos.' });
    }
    var data = JSON.parse(e.postData.contents);
    var fecha = Utilities.formatDate(new Date(), 'America/Costa_Rica', 'dd/MM/yyyy HH:mm:ss');
    var tipo = detectTipo(data);
    var S = sanitizeForSheet;

    if (tipo === 'contacto') {
      if (!isValidEmail(data.correo)) return json({ success: false, error: 'Correo inválido.' });
      getSheet('Contacto', ['Fecha', 'Nombre', 'Correo', 'Asunto', 'Mensaje'])
        .appendRow([fecha, S(data.nombre), S(data.correo), S(data.asunto), S(data.mensaje)]);

    } else if (tipo === 'queja' || tipo === 'quejas') {
      getSheet('Quejas', ['Fecha', 'Categoría', 'Descripción', 'Nombre', 'Contacto'])
        .appendRow([fecha, S(data.categoria), S(data.descripcion), S(data.nombre), S(data.contacto || data.telefono || data.correo)]);

    } else if (tipo === 'reporte_agua') {
      return guardarReporteAgua(data, fecha);

    } else if (tipo === 'evento' || tipo === 'eventos') {
      getSheet('Eventos', ['Fecha registro', 'Título', 'Categoría', 'Fecha evento', 'Hora', 'Lugar', 'Descripción'])
        .appendRow([fecha, S(data.titulo), S(data.categoria), S(data.fecha), S(data.hora), S(data.lugar), S(data.descripcion)]);

    } else if (tipo === 'suscriptor' || tipo === 'empleo' || tipo === 'suscripcion' || tipo === 'subscribe') {
      var nombre = S(data.nombreCompleto || data.nombre);
      var correo = S(data.correo || data.email);
      if (!nombre || !isValidEmail(correo)) return json({ success: false, error: 'Nombre y correo son obligatorios.' });
      getSheet('Suscriptores', ['Fecha', 'Nombre Completo', 'Correo', 'Distrito', 'Interés'])
        .appendRow([fecha, nombre, correo, S(data.distrito), S(data.interes)]);

    } else {
      // Respaldo: guarda todo el JSON para no perder ningún envío.
      getSheet('Otros', ['Fecha', 'Tipo', 'Datos'])
        .appendRow([fecha, S(tipo), S(JSON.stringify(data)).substring(0, 3000)]);
    }

    return json({ success: true });
  } catch (err) {
    return json({ success: false, error: String(err) });
  }
}

// GET: verificación de vida y lectura autenticada para el Buzón del sitio.
//   ?action=list&sheet=Quejas&token=TU_TOKEN  → devuelve las filas de esa hoja (más recientes primero).
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'list') {
    var expected = getReadToken();
    // Sin READ_TOKEN configurado no se expone nada, y nunca se acepta un token vacio.
    if (!expected || !p.token || p.token !== expected) {
      return json({ ok: false, error: 'No autorizado' });
    }
    var permitidas = ['Contacto', 'Quejas', 'Suscriptores', 'Eventos', 'Otros', 'Reportes Agua'];
    var name = permitidas.indexOf(p.sheet) !== -1 ? p.sheet : 'Quejas';
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if (!sh || sh.getLastRow() < 1) return json({ ok: true, sheet: name, headers: [], rows: [] });
    var values = sh.getDataRange().getValues();
    var headers = values.shift();
    return json({ ok: true, sheet: name, headers: headers, rows: values.reverse() });
  }
  // Consulta pública del avance de un reporte del Observatorio del Agua-Poás.
  // Solo devuelve el estado, la fecha y la acción registrada; nunca datos personales.
  if (p.accion === 'estado' && p.codigo) {
    return json(estadoReporteAgua(String(p.codigo)));
  }
  return json({ ok: true, service: 'Poás Agua y Fuego – Formularios' });
}

// ─────────── Observatorio del Agua-Poás · reportes ciudadanos ───────────
var REPORTES_AGUA_HEADERS = ['Código', 'Fecha recepción', 'Fecha del reporte', 'Tipo', 'Referencia', 'Latitud', 'Longitud', 'Precisión',
  'Descripción', 'Nombre', 'Contacto', 'Consentimiento', 'Evidencia', 'Estado', 'Responsable', 'Acción / cierre', 'Fecha actualización', 'App'];
var ESTADOS_AGUA = ['recibido', 'en revisión', 'asignado', 'en atención', 'resuelto'];

function guardarReporteAgua(data, fecha) {
  var S = sanitizeForSheet;
  var codigo = S(data.codigo);
  if (!/^OAP-\d{6}-[A-Z0-9]{5}$/.test(codigo)) return json({ success: false, error: 'Código inválido.' });
  if (data.consentimiento !== true) return json({ success: false, error: 'Falta el consentimiento.' });
  var desc = S(data.descripcion);
  if (desc.length < 10) return json({ success: false, error: 'Descripción insuficiente.' });

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet('Reportes Agua', REPORTES_AGUA_HEADERS);
    // Idempotente: si el código ya existe (reintento), se confirma sin duplicar.
    var existente = buscarCodigo(sheet, codigo);
    if (existente) return json({ success: true, codigo: codigo, estado: existente.estado, duplicado: true });

    var evidencia = '';
    if (data.foto && data.foto_mime === 'image/jpeg' && data.foto.length < 4000000) {
      try { evidencia = guardarFoto(codigo, data.foto); } catch (e) { evidencia = 'Error al guardar la foto: ' + e; }
    }
    var lat = Number(data.lat), lon = Number(data.lon);
    var latOk = isFinite(lat) && Math.abs(lat) <= 90 && data.lat !== null, lonOk = isFinite(lon) && Math.abs(lon) <= 180 && data.lon !== null;
    sheet.appendRow([codigo, fecha, S(data.creado), S(data.categoria), S(data.ubicacion), latOk ? lat : '', lonOk ? lon : '', S(data.precision),
      desc, S(data.nombre), S(data.contacto), 'Sí', evidencia, 'recibido', '', '', fecha, S(data.app)]);
    return json({ success: true, codigo: codigo, estado: 'recibido' });
  } finally {
    lock.releaseLock();
  }
}

function buscarCodigo(sheet, codigo) {
  if (sheet.getLastRow() < 2) return null;
  var vals = sheet.getRange(2, 1, sheet.getLastRow() - 1, REPORTES_AGUA_HEADERS.length).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (vals[i][0] === codigo) return { fila: i + 2, estado: String(vals[i][13] || 'recibido'), accion: vals[i][15], actualizado: vals[i][16] };
  }
  return null;
}

function estadoReporteAgua(codigo) {
  if (!/^OAP-\d{6}-[A-Z0-9]{5}$/.test(codigo)) return { ok: false, error: 'Código inválido.' };
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reportes Agua');
  var r = sheet && buscarCodigo(sheet, codigo);
  if (!r) return { ok: false, error: 'No encontrado.' };
  var estado = ESTADOS_AGUA.indexOf(r.estado.toLowerCase()) >= 0 ? r.estado.toLowerCase() : 'en revisión';
  return { ok: true, codigo: codigo, estado: estado, accion: estado === 'resuelto' ? String(r.accion || '') : '', actualizado: String(r.actualizado || '') };
}

// Guarda la fotografía en una carpeta privada de Drive y devuelve el enlace (solo para el equipo).
function guardarFoto(codigo, base64) {
  var nombre = 'Observatorio del Agua-Poás – Evidencias';
  var it = DriveApp.getFoldersByName(nombre);
  var carpeta = it.hasNext() ? it.next() : DriveApp.createFolder(nombre);
  var blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', codigo + '.jpg');
  return carpeta.createFile(blob).getUrl();
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Prueba manual (ejecutala desde el editor de Apps Script).
function testScript() {
  var r = doPost({ postData: { contents: JSON.stringify({
    tipo: 'contacto', nombre: 'Prueba', correo: 'prueba@email.com', asunto: 'Hola', mensaje: 'Mensaje de prueba'
  }) } });
  Logger.log(r.getContent());
}
