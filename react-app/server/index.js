/* Simple Express server to generate PDF reports with Puppeteer */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

// POST /api/report/pdf -> returns application/pdf
app.post('/api/report/pdf', async (req, res) => {
  const startedAt = Date.now();
  try {
    const { company = 'Almacenes Tía', multa, severity, histChartDataUrl, timestamp, monteCarloStats } = req.body || {};
    if (typeof multa !== 'number' || !severity) {
      return res.status(400).json({ error: 'Datos insuficientes para generar el reporte.' });
    }

    // Generar cuadros de estadísticas Monte Carlo
    const formatCurrency = (amount) => `$${Math.round(amount).toLocaleString('es-EC')}`;
    const monteCarloStatsHtml = monteCarloStats ? `
      <div class="stats-grid">
        <div class="stat-card stat-optimista">
          <div class="stat-label">Optimista</div>
          <div class="stat-value">${formatCurrency(monteCarloStats.min)}</div>
        </div>
        <div class="stat-card stat-promedio">
          <div class="stat-label">Promedio</div>
          <div class="stat-value">${formatCurrency(monteCarloStats.avg)}</div>
        </div>
        <div class="stat-card stat-mediana">
          <div class="stat-label">Mediana</div>
          <div class="stat-value">${formatCurrency(monteCarloStats.median)}</div>
        </div>
        <div class="stat-card stat-pesimista">
          <div class="stat-label">Pesimista</div>
          <div class="stat-value">${formatCurrency(monteCarloStats.max)}</div>
        </div>
      </div>
    ` : '';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Reporte de Multa MPRIV</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #212529; }
  h1, h2, h3 { margin: 0 0 8px; }
  .header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px; }
  .meta { font-size: 12px; color:#6c757d; }
  .badge { display:inline-block; padding:4px 8px; border-radius: 4px; font-weight:600; font-size: 12px; }
  .badge-danger { background:#dc3545; color:white; }
  .badge-warning { background:#ffc107; color:#212529; }
  .card { border:1px solid #dee2e6; border-radius:8px; padding:12px 16px; margin-bottom: 12px; }
  .grid { display:grid; grid-template-columns: 1fr; gap: 12px; margin-top: 24px; }
  .charts img { width:100%; height:auto; border:1px solid #dee2e6; border-radius:6px; }
  .chart-container { page-break-inside: avoid; margin-bottom: 20px; }
  .amount { font-size: 28px; font-weight: 700; }
  .recommendations { background:#cff4fc; border:1px solid #b6effb; padding:16px; border-radius:8px; margin-top: 16px; margin-bottom: 24px; }
  .recommendations h3 { color:#055160; margin-bottom: 12px; }
  .recommendations ul { margin: 0; padding-left: 20px; }
  .recommendations li { margin-bottom: 8px; line-height: 1.4; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .stat-card { border: 1px solid #dee2e6; border-radius: 8px; padding: 16px; text-align: center; }
  .stat-optimista { border-color: #198754; }
  .stat-promedio { border-color: #0d6efd; }
  .stat-mediana { border-color: #0dcaf0; }
  .stat-pesimista { border-color: #dc3545; }
  .stat-label { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
  .stat-optimista .stat-label { color: #198754; }
  .stat-promedio .stat-label { color: #0d6efd; }
  .stat-mediana .stat-label { color: #0dcaf0; }
  .stat-pesimista .stat-label { color: #dc3545; }
  .stat-value { font-size: 20px; font-weight: 700; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h2>Reporte de Multa</h2>
      <div class="meta">${company} • ${new Date(timestamp || Date.now()).toLocaleString('es-EC')}</div>
    </div>
    <div class="badge ${severity === 'grave' ? 'badge-danger' : 'badge-warning'}">Infracción: ${severity.toUpperCase()}</div>
  </div>

  <div class="card">
    <div>Multa aproximada</div>
    <div class="amount">$${Math.round(multa).toLocaleString('es-EC')}</div>
  </div>

  ${monteCarloStatsHtml ? `
  <div class="card">
    <h3>Simulación Monte Carlo - Escenarios</h3>
    ${monteCarloStatsHtml}
  </div>
  ` : ''}

  <div class="grid charts">
    ${histChartDataUrl ? `<div class="card chart-container"><h3>Distribución de Frecuencias - Monte Carlo</h3><img src="${histChartDataUrl}" /></div>` : ''}
  </div>
</body>
</html>`;

    let browser;
    try {
      browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    } catch (launchErr) {
      console.error('[PDF] Error lanzando Puppeteer (primer intento):', launchErr.message);
      // Intento de fallback sin flags especiales (algunos entornos locales)
      browser = await puppeteer.launch({ headless: true });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', right: '12mm', bottom: '16mm', left: '12mm' }
    });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_mpriv.pdf"');
    console.log(`[PDF] Generado OK en ${(Date.now() - startedAt)}ms tamaño=${(pdf.length/1024).toFixed(1)}KB`);
    return res.status(200).send(pdf);
  } catch (err) {
    console.error('[PDF] Error general:', err);
    return res.status(500).json({ error: 'Error al generar el PDF', detail: process.env.NODE_ENV !== 'production' ? String(err) : undefined });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`PDF server running on http://localhost:${PORT}`));
