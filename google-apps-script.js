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

// ⚠️ CAMBIÁ este token por uno privado tuyo. Se usa para leer los datos desde el Buzón del sitio.
var READ_TOKEN = 'CAMBIA_ESTE_TOKEN_PRIVADO';

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
    if (p.token !== READ_TOKEN) return json({ ok: false, error: 'No autorizado' });
    var permitidas = ['Contacto', 'Quejas', 'Suscriptores', 'Eventos', 'Otros'];
    var name = permitidas.indexOf(p.sheet) !== -1 ? p.sheet : 'Quejas';
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if (!sh || sh.getLastRow() < 1) return json({ ok: true, sheet: name, headers: [], rows: [] });
    var values = sh.getDataRange().getValues();
    var headers = values.shift();
    return json({ ok: true, sheet: name, headers: headers, rows: values.reverse() });
  }
  return json({ ok: true, service: 'Poás Agua y Fuego – Formularios' });
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
