/**
 * INSTRUCCIONES DE CONFIGURACIÓN
 * ================================
 * 1. Abre Google Sheets: https://sheets.new
 * 2. Renombra la hoja a "Suscriptores"
 * 3. En el menú: Extensiones → Apps Script
 * 4. Borra el código existente y pega TODO este archivo
 * 5. Guarda (Ctrl+S)
 * 6. Clic en "Implementar" → "Nueva implementación"
 *    - Tipo: Aplicación web
 *    - Ejecutar como: Yo (tu cuenta)
 *    - Quién tiene acceso: Cualquier usuario
 * 7. Clic en "Implementar" → Autoriza los permisos
 * 8. Copia la URL que aparece ("URL de la aplicación web")
 * 9. Pégala en script.js donde dice: https://script.google.com/macros/s/AKfycbw0znMRVMFGSsThQx_H-rQcmrKo8IrSu-d74D35AiEFXCcTfk3Zzc9ThUiRTOcwz5bN/exec = '...'
 */

function doPost(e) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Suscriptores') || ss.getActiveSheet();

    // Crear encabezados si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Fecha', 'Nombre', 'Correo', 'Distrito', 'Interés']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#2F3635').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }

    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' }),
      data.nombreCompleto || '',
      data.correo         || '',
      data.distrito       || '',
      data.interes        || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Función de prueba — ejecútala manualmente desde Apps Script para verificar
function testInsert() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Suscriptores')
                || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Fecha', 'Nombre', 'Correo', 'Distrito', 'Interés']);
  }

  sheet.appendRow([
    new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' }),
    'Usuario de Prueba',
    'prueba@ejemplo.com',
    'San Pedro de Poás',
    'todo'
  ]);

  Logger.log('✅ Fila de prueba insertada correctamente.');
}
