/**
 * ============================================================
 *  POÁS AGUA Y FUEGO – Google Apps Script para Suscriptores
 * ============================================================
 *
 *  INSTRUCCIONES DE INSTALACIÓN:
 *  1. Abre Google Sheets en drive.google.com → Nuevo → Hoja de cálculo
 *  2. Nómbrala "Suscriptores Poás Agua y Fuego"
 *  3. Ve a Extensiones → Apps Script
 *  4. Borrá el código de ejemplo y pegá TODO este archivo
 *  5. Guardá (Ctrl+S), dale un nombre al proyecto: "PoasScript"
 *  6. Clic en "Implementar" → "Nueva implementación"
 *  7. Tipo: Aplicación web
 *     - Descripción: v1
 *     - Ejecutar como: Yo
 *     - Quién puede acceder: Cualquier persona
 *  8. Clic en "Implementar" → Autorizar → Copiar la URL que aparece
 *  9. Pegá esa URL en script.js donde dice APPS_SCRIPT_URL
 * ============================================================
 */

function sanitizeForSheet(value) {
  var str = String(value || '').trim();
  return /^[=+\-@]/.test(str) ? "'" + str : str;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet()
                  .getSheetByName('Suscriptores');

    // Crear hoja "Suscriptores" si no existe
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Suscriptores');
    }

    // Agregar encabezados si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Fecha', 'Nombre Completo', 'Correo Electrónico', 'Distrito', 'Interés']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#0E5E6F').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }

    // Parsear los datos del formulario
    var data = JSON.parse(e.postData.contents);

    var fecha     = Utilities.formatDate(new Date(), 'America/Costa_Rica', 'dd/MM/yyyy HH:mm:ss');
    var nombre    = sanitizeForSheet(data.nombreCompleto || data.nombre || '');
    var correo    = sanitizeForSheet(data.correo || data.email || '');
    var distrito  = sanitizeForSheet(data.distrito || '');
    var interes   = sanitizeForSheet(data.interes || '');

    if (!nombre || !correo || !isValidEmail(correo)) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Datos inválidos. Nombre y correo son obligatorios.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Agregar la nueva fila
    sheet.appendRow([fecha, nombre, correo, distrito, interes]);

    // Auto-ajustar columnas
    sheet.autoResizeColumns(1, 5);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Suscriptor guardado.' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Función de prueba (opcional, ejecutala manualmente para verificar)
function testScript() {
  var testData = {
    postData: {
      contents: JSON.stringify({
        nombreCompleto: 'Usuario de Prueba',
        correo: 'prueba@email.com',
        distrito: 'San Pedro',
        interes: 'Turismo'
      })
    }
  };
  var result = doPost(testData);
  Logger.log(result.getContent());
}
