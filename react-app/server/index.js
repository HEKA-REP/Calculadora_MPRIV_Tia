/* Simple Express server to generate PDF reports with Puppeteer */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

const formatCurrency = (amount) => `$${Math.round(amount).toLocaleString('es-EC')}`;

// Function to get logo as base64
const getLogoBase64 = async () => {
  const fs = require('fs');
  const path = require('path');
  try {
    const logoPath = path.join(__dirname, '..', 'public', 'assets', 'logo_tia_white.webp');
    const logoBuffer = fs.readFileSync(logoPath);
    return logoBuffer.toString('base64');
  } catch (error) {
    console.warn('[PDF] Logo not found, using placeholder');
    // Return a small transparent PNG as fallback
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
};

app.post('/api/report/pdf', async (req, res) => {
  const startedAt = Date.now();
  try {
    const { company = 'Almacenes Tía', multa, severity, histChartDataUrl, timestamp, monteCarloStats, summary, narrative } = req.body || {};
    if (typeof multa !== 'number' || !severity) {
      return res.status(400).json({ error: 'Datos insuficientes para generar el reporte.' });
    }

    // Bloque estadísticas Monte Carlo
    const monteCarloStatsHtml = monteCarloStats ? `
      <div class="stats-grid">
        <div class="stat-card stat-minimo">
          <div class="stat-label">Valor Mínimo</div>
          <div class="stat-value">${formatCurrency(monteCarloStats.min)}</div>
        </div>
        <div class="stat-card stat-probable">
          <div class="stat-label">Valor Más Probable</div>
          <div class="stat-value">${formatCurrency(monteCarloStats.median)}</div>
        </div>
        <div class="stat-card stat-maximo">
          <div class="stat-label">Valor Máximo</div>
          <div class="stat-value">${formatCurrency(monteCarloStats.max)}</div>
        </div>
      </div>` : '';

    const narrativaSection = narrative ? `<div class="narrativa"><p>${narrative}</p></div>` : '';
    const resumenSection = summary ? `
      <div class="spacer"></div>
      <div class="card summary-section">
        <h3 class="section-title">Resumen del Cálculo</h3>
        <table class="tabla-resumen">
          <thead><tr><th>Parámetro</th><th>Valor Seleccionado</th></tr></thead>
          <tbody>
            <tr><td>Área</td><td>${summary.area || ''}</td></tr>
            <tr><td>Actividad</td><td>${summary.actividad || ''}</td></tr>
            <tr><td>Riesgo Identificado</td><td>${summary.riesgo || ''}</td></tr>
            <tr><td>Categoría de la Infracción</td><td>${summary.categoriaInfraccion || ''}</td></tr>
            <tr><td>Titulares Afectados</td><td>${(summary.titularesAfectados || 0).toLocaleString('es-EC')}</td></tr>
            <tr><td>Tipos de Datos Afectados</td><td>${summary.tiposDatos || ''}</td></tr>
            <tr><td>Naturaleza de la Vulneración</td><td>${summary.naturalezaVulneracion || ''}</td></tr>
            <tr><td>Incluye Grupos Vulnerables</td><td>${summary.gruposVulnerables || 'NO'}</td></tr>
            <tr><td>Nivel de Intencionalidad</td><td>${summary.intencionalidad || ''}</td></tr>
            <tr><td>Multa Administrativa Estimada</td><td class="highlight-amount">$${Math.round(summary.multaEstimacion || 0).toLocaleString('es-EC')}</td></tr>
          </tbody>
        </table>
      </div>` : '';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte de Multa MPRIV</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      margin: 0; 
      padding: 24px; 
      color: #2c1810; 
      background: #fafafa;
      line-height: 1.4;
    }
    h1, h2, h3 { margin: 0 0 12px; color: #E4002B; font-weight: 600; }
    .header { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      margin-bottom: 24px; 
      padding: 20px 24px;
      background: linear-gradient(135deg, #E4002B 0%, #FF4D6A 100%);
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 16px rgba(228, 0, 43, 0.25);
      min-height: 80px;
    }
    .header-left { 
      display: flex; 
      align-items: center; 
      gap: 20px; 
      flex: 1;
    }
    .logo { 
      width: 64px; 
      height: 64px; 
      object-fit: contain; 
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 4px;
    }
    .header-title { 
      margin: 0; 
      font-size: 26px; 
      font-weight: 700; 
      color: white;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .meta { 
      font-size: 14px; 
      color: rgba(255,255,255,0.85); 
      margin-top: 6px; 
      font-weight: 400;
    }
    .badge { 
      display: inline-flex;
      align-items: center;
      padding: 10px 18px; 
      border-radius: 25px; 
      font-weight: 700; 
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      white-space: nowrap;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
    .badge-danger { background: #E4002B; color: white; box-shadow: 0 2px 8px rgba(228, 0, 43, 0.3); }
    .badge-warning { background: #FF6347; color: white; box-shadow: 0 2px 8px rgba(255, 99, 71, 0.3); }
    .card { 
      border: 1px solid #f0d5d5; 
      border-radius: 12px; 
      padding: 20px 24px; 
      margin-bottom: 20px; 
      background: white;
      box-shadow: 0 2px 8px rgba(228, 0, 43, 0.08);
    }
    .spacer { height: 24px; }
    .summary-section { border-left: 4px solid #E4002B; }
    .section-title { color: #E4002B; font-size: 18px; font-weight: 700; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 20px; }
    .charts img { width: 100%; height: auto; border: 1px solid #e8d5d5; border-radius: 8px; }
    .chart-container { page-break-inside: avoid; margin-bottom: 24px; }
    .amount { 
      font-size: 32px; 
      font-weight: 800; 
      color: #E4002B;
      text-shadow: 0 1px 2px rgba(228, 0, 43, 0.1);
    }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
    .stat-card { 
      border: 2px solid #e8d5d5; 
      border-radius: 10px; 
      padding: 16px; 
      text-align: center; 
      background: white;
      transition: all 0.3s ease;
    }
    .stat-minimo { border-color: #22c55e; background: linear-gradient(135deg, #f0fff0 0%, #e6ffe6 100%); }
    .stat-probable { border-color: #f59e0b; background: linear-gradient(135deg, #fffbf0 0%, #fef3e6 100%); }
    .stat-maximo { border-color: #dc2626; background: linear-gradient(135deg, #fff0f0 0%, #ffe6e6 100%); }
    .stat-label { font-size: 13px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-minimo .stat-label { color: #22c55e; }
    .stat-probable .stat-label { color: #f59e0b; }
    .stat-maximo .stat-label { color: #dc2626; }
    .stat-value { font-size: 18px; font-weight: 700; }
    .narrativa { 
      background: linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%); 
      border: 1px solid #f5c6cb; 
      padding: 18px 22px; 
      border-radius: 10px; 
      font-size: 14px; 
      line-height: 1.6;
      border-left: 4px solid #E4002B;
      box-shadow: 0 2px 6px rgba(228, 0, 43, 0.1);
    }
    .tabla-resumen { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 13px; 
      margin-top: 12px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(228, 0, 43, 0.1);
    }
    .tabla-resumen th { 
      background: linear-gradient(135deg, #E4002B 0%, #FF4D6A 100%); 
      color: white; 
      text-align: left; 
      padding: 12px 16px; 
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 12px;
    }
    .tabla-resumen td { 
      border-bottom: 1px solid #f0d5d5; 
      padding: 12px 16px; 
      vertical-align: top;
      background: white;
    }
    .tabla-resumen tr:nth-child(even) td { background: #fdf8f8; }
    .tabla-resumen tr:hover td { background: #fff0f0; }
    .highlight-amount { color: #E4002B; font-weight: 700; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <img src="data:image/png;base64,${await getLogoBase64()}" alt="Tía Logo" class="logo" />
      <div>
        <h2 class="header-title">Reporte de Multa MPRIV</h2>
        <div class="meta">${company} • ${new Date(timestamp || Date.now()).toLocaleString('es-EC')}</div>
      </div>
    </div>
    <div class="badge ${severity === 'grave' ? 'badge-danger' : 'badge-warning'}">Infracción ${severity.toUpperCase()}</div>
  </div>

  <div class="card">
    <div>Multa aproximada</div>
    <div class="amount">$${Math.round(multa).toLocaleString('es-EC')}</div>
  </div>

  ${narrativaSection}
  ${resumenSection}

  ${monteCarloStatsHtml ? `<div class="card"><h3 class="section-title">Simulación Monte Carlo - Escenarios</h3>${monteCarloStatsHtml}</div>` : ''}

  <div class="grid charts">
    ${histChartDataUrl ? `<div class="card chart-container"><h3 class="section-title">Distribución de Frecuencias - Monte Carlo</h3><img src="${histChartDataUrl}" /></div>` : ''}
  </div>
</body>
</html>`;

    let browser;
    try {
      browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    } catch (launchErr) {
      console.error('[PDF] Error lanzando Puppeteer (primer intento):', launchErr.message);
      browser = await puppeteer.launch({ headless: true });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '16mm', right: '12mm', bottom: '16mm', left: '12mm' } });
    await browser.close();

    // Generar nombre de archivo con fecha en formato DD-MM-YYYY
    const fechaActual = new Date(timestamp || Date.now());
    const dia = fechaActual.getDate().toString().padStart(2, '0');
    const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaActual.getFullYear();
    const fechaFormateada = `${dia}-${mes}-${año}`;
    const nombreArchivo = `Informe_Simulacion_Multa_${fechaFormateada}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    console.log(`[PDF] Generado OK en ${(Date.now() - startedAt)}ms tamaño=${(pdf.length/1024).toFixed(1)}KB`);
    return res.status(200).send(pdf);
  } catch (err) {
    console.error('[PDF] Error general:', err);
    return res.status(500).json({ error: 'Error al generar el PDF', detail: process.env.NODE_ENV !== 'production' ? String(err) : undefined });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`PDF server running on http://localhost:${PORT}`));
