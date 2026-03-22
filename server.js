const express = require('express');
const ExcelJS  = require('exceljs');
const cors     = require('cors');
const path     = require('path');

const app        = express();
const PORT       = 3000;
const EXCEL_FILE = path.join(__dirname, 'suscriptores.xlsx');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // sirve el sitio web completo

// ── POST /subscribe ──────────────────────────────────────────────
app.post('/subscribe', async (req, res) => {
    try {
        const { nombreCompleto, correo, distrito, interes } = req.body;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXCEL_FILE);

        const sheet = workbook.getWorksheet('Suscriptores');

        const fecha = new Date().toLocaleString('es-CR', {
            timeZone: 'America/Costa_Rica',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        sheet.addRow([fecha, nombreCompleto || '', correo || '', distrito || '', interes || '']);

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
