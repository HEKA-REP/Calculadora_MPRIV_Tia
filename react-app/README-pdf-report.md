PDF report feature (Puppeteer)

- Start dev with server and CRA:
  - npm install
  - npm run dev
- In production:
  - npm run build
  - Start server with: npm run server (ensure server serves from /server and CRA build is hosted separately or add static serving)

Endpoint: POST /api/report/pdf
Body JSON:
{
  "company": "Almacenes Tía",
  "multa": 12345.67,
  "severity": "grave" | "leve",
  "lineChartDataUrl": "data:image/png;base64,...",
  "histChartDataUrl": "data:image/png;base64,...",
  "timestamp": 1690000000000
}

Response: application/pdf (attachment)

Front-end button “Descargar Reporte PDF” is shown under Monte Carlo charts.
