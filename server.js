const express = require('express');
const ExcelJS  = require('exceljs');
const path     = require('path');

const app        = express();
const PORT       = 3000;
const EXCEL_FILE = path.join(__dirname, 'suscriptores.xlsx');

function sanitizeCell(value) {
    const str = String(value || '').trim();
    return /^[=+\-@]/.test(str) ? `'${str}` : str;
}

function validateString(field, maxLen = 200) {
    if (typeof field !== 'string') return '';
    return field.trim().slice(0, maxLen);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.use(express.json({ limit: '10kb' }));
app.use(express.static(__dirname)); // sirve el sitio web completo

// ── POST /subscribe ──────────────────────────────────────────────
app.post('/subscribe', async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ success: false, error: 'Payload inválido.' });
        }

        const nombreCompleto = validateString(req.body.nombreCompleto || req.body.nombre || '', 100);
        const correo = validateString(req.body.correo || req.body.email || '', 150);
        const distrito = validateString(req.body.distrito || '', 50);
        const interes = validateString(req.body.interes || '', 100);

        if (!nombreCompleto || !correo) {
            return res.status(400).json({ success: false, error: 'Nombre y correo son obligatorios.' });
        }

        if (!isValidEmail(correo)) {
            return res.status(400).json({ success: false, error: 'Correo inválido.' });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXCEL_FILE);

        const sheet = workbook.getWorksheet('Suscriptores');

        const fecha = new Date().toLocaleString('es-CR', {
            timeZone: 'America/Costa_Rica',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        sheet.addRow([
            fecha,
            sanitizeCell(nombreCompleto),
            sanitizeCell(correo),
            sanitizeCell(distrito),
            sanitizeCell(interes)
        ]);

        await workbook.xlsx.writeFile(EXCEL_FILE);

        console.log(`✅ Nuevo suscriptor: ${nombreCompleto} <${correo}>`);
        res.json({ success: true });

    } catch (err) {
        console.error('❌ Error al guardar suscriptor:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Inicio ───────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('🌋 Poás Agua y Fuego — Servidor local');
    console.log(`🌐 Sitio web:  http://localhost:${PORT}`);
    console.log(`📋 Excel:      suscriptores.xlsx`);
    console.log('');
    console.log('Presiona Ctrl+C para detener el servidor.');
    console.log('');
});
