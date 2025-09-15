PDF report feature (Puppeteer)

- Start dev with server and CRA:
  - npm install
  - npm run dev
- In production:
  - npm run build
  - Start server with: npm run server (ensure server serves from /server and CRA build is hosted separately or add static serving)

Environment Variables:
- REACT_APP_API_BASE: Base URL for API calls (optional, defaults to CRA proxy)

Endpoint: POST /api/report/pdf
Body JSON:
{
  "company": "Almacenes Tía",
  "multa": 12345.67,
  "severity": "grave" | "leve",
  "histChartDataUrl": "data:image/png;base64,...",
  "timestamp": 1690000000000,
  "monteCarloStats": {
    "min": 10000,
    "avg": 15000, 
    "median": 14500,
    "max": 20000
  },
  "summary": {
    "area": "Marketing y Publicidad",
    "actividad": "Email Marketing",
    "riesgo": "Envío de correos promocionales...",
    "categoriaInfraccion": "Leve (0.1% al 0.7%)",
    "titularesAfectados": 1500,
    "tiposDatos": "Datos identificativos básicos, Datos de contacto",
    "gruposVulnerables": "NO",
    "naturalezaVulneracion": "Confidencialidad vulnerada",
    "intencionalidad": "Negligencia leve",
    "multaEstimacion": 12345.67
  },
  "narrative": "Descripción narrativa del análisis..."
}

Response: application/pdf (attachment)
