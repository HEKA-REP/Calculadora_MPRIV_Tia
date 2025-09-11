import React, { useMemo, useState, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { 
  activities, 
  areas, 
  intencionalidadOptions, 
  VDN,
  type Activity
} from '../data/mprivData';

interface FormData {
  area: string;
  activity: string;
  // IED inputs (según PDF)
  titulares: Record<string, number>; // cantidades por categoría (clientes, proveedores, etc.)
  titularesSeleccionados: string[]; // categorías marcadas por el usuario
  tieneVulnerables: boolean; // toggle para mostrar grupos vulnerables
  gruposVulnerables: string[]; // ids de grupos seleccionados
  // Otros factores
  intencionalidad: string;
}

interface CalculationResults {
  PDI: number;
  CDI: number;
  IED: number;
  INT: number;
  RER: number;
  SDI: number;
  multaFinal: number;
  severity: string;
  activityName: string;
}

const MPRIVCalculator: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    area: '',
    activity: '',
    titulares: {},
    titularesSeleccionados: [],
    tieneVulnerables: false,
    gruposVulnerables: [],
    intencionalidad: '',
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [activityDescription, setActivityDescription] = useState<string>('');
  const [showActivityDescription, setShowActivityDescription] = useState(false);
  const [descriptions, setDescriptions] = useState({
    intencionalidad: ''
  });

  // Estado para simulación Monte Carlo
  type SimulationStats = { min: number; avg: number; median: number; max: number };
  const [simStats, setSimStats] = useState<SimulationStats | null>(null);
  const [simSeries, setSimSeries] = useState<number[]>([]);
  const [histSeries, setHistSeries] = useState<{ labels: string[]; counts: number[] } | null>(null);
  const [simRunning, setSimRunning] = useState(false);

  // Constantes UI para TAV/TEV (pueden moverse a data/ si se requiere)
  const titularCategories: { id: string; label: string }[] = [
    { id: 'clientes', label: 'Clientes' },
    { id: 'proveedores', label: 'Proveedores' },
    { id: 'empleados', label: 'Empleados' },
    { id: 'prospectos', label: 'Prospectos / Leads' },
    { id: 'visitantes', label: 'Visitantes (Sitio/App)' }
  ];

  const vulnerableGroups: { id: string; label: string }[] = [
    { id: 'ninos_adolescentes', label: 'Niñas, niños y adolescentes' },
    { id: 'adultos_mayores', label: 'Personas adultas mayores' },
    { id: 'personas_discapacitadas', label: 'Personas con discapacidad' },
    { id: 'comunidades_indigenas', label: 'Pueblos y nacionalidades indígenas' },
    { id: 'migrantes_refugiados', label: 'Personas migrantes/refugiadas' },
    { id: 'privadas_libertad', label: 'Personas privadas de libertad' }
  ];

  // Ponderaciones según PDF
  const WEIGHTS = {
    TDP: 0.4,
    TAV: 0.2,
    NDV: 0.2,
    TEV: 0.2
  } as const;

  // Factor de normalización final (PDF: 0.6)
  const IED_NORMALIZATION = 0.6;
  // Valor fijo para RER (Reiteración/Reincidencia). Ajusta según política
  const RER_FIXED = 0; // 0 = No aplica (sin antecedentes)

  const pert = (a: number, b: number, c: number) => (a + 4 * b + c) / 6; // 0-100

  // Total de titulares de la empresa (dato fijo "quemado")
  // TODO: Ajustar este valor al total real de la empresa.
  const TOTAL_TITULARES_EMPRESA = 170000000;

  const formatCurrency = (amount: number): string => {
    return '$' + Math.round(amount).toLocaleString('es-EC');
  };

  const calculateMPRIV = (data: FormData): CalculationResults | null => {
    const { area, activity, intencionalidad } = data;
    
    if (!area || !activity || !intencionalidad) {
      return null;
    }

    const activityData = activities[area]?.[activity] as Activity;
    if (!activityData) return null;

    const isGrave = activityData.severity === 'grave';
    const RDM_min = isGrave ? 0.007 : 0.001;
    const RDM_max = isGrave ? 0.010 : 0.007;

    const PDI = activityData.pdi / 100;
    const CDI = (VDN * RDM_min) + (PDI * (VDN * (RDM_max - RDM_min)));

    // 1) TDP (interno por severidad; valores ejemplo del PDF)
    const tdpPert = activityData.severity === 'grave'
      ? { a: 30, b: 50, c: 70 }
      : { a: 10, b: 30, c: 50 };
    const TDP_expected = pert(tdpPert.a, tdpPert.b, tdpPert.c); // 0-100
    const TDP_weighted = (TDP_expected / 100) * WEIGHTS.TDP; // 0-0.4

    // 2) TAV (usuario: % de titulares afectados en relación al total)
  const totalAfectados = (data.titularesSeleccionados || []).reduce((sum, id) => sum + (Number(data.titulares?.[id]) || 0), 0);
  const bTAV = TOTAL_TITULARES_EMPRESA > 0 ? Math.min(100, Math.max(0, (totalAfectados / TOTAL_TITULARES_EMPRESA) * 100)) : 0;
    const margin = 10; // +/- 10% en ausencia de a/c explícitos
    const aTAV = Math.max(0, bTAV - margin);
    const cTAV = Math.min(100, bTAV + margin);
    const TAV_expected = pert(aTAV, bTAV, cTAV);
    const TAV_weighted = (TAV_expected / 100) * WEIGHTS.TAV; // 0-0.2

    // 3) NDV (interno por severidad; ejemplo PDF 50/70/90 para grave)
    const ndvPert = activityData.severity === 'grave'
      ? { a: 50, b: 70, c: 90 }
      : { a: 20, b: 40, c: 60 };
    const NDV_expected = pert(ndvPert.a, ndvPert.b, ndvPert.c);
    const NDV_weighted = (NDV_expected / 100) * WEIGHTS.NDV; // 0-0.2

    // 4) TEV (si hay grupos vulnerables). Tomamos b=85, a=70, c=100 como base; escalamos b con cantidad de grupos
    let TEV_weighted = 0;
    if (data.gruposVulnerables && data.gruposVulnerables.length > 0) {
      const count = data.gruposVulnerables.length;
      const baseB = Math.min(100, 85 + (count - 1) * 5);
      const baseA = Math.max(0, baseB - 15);
      const baseC = 100;
      const TEV_expected = pert(baseA, baseB, baseC);
      TEV_weighted = (TEV_expected / 100) * WEIGHTS.TEV; // 0-0.2
    }

    const IED_sum = TDP_weighted + TAV_weighted + NDV_weighted + TEV_weighted; // 0-1
  const IED = IED_sum * IED_NORMALIZATION; // normalización 0.6 (PDF)
  const INT = intencionalidadOptions[intencionalidad as keyof typeof intencionalidadOptions]?.value || 0;
  const RER = RER_FIXED;

    const SDI = (2 * (IED + INT + RER)) / 8;
    const multaFinal = CDI * SDI;

    return {
      PDI: activityData.pdi,
      CDI,
      IED,
      INT,
      RER,
      SDI,
      multaFinal,
      severity: activityData.severity,
      activityName: activityData.name
    };
  };

  // Simulación Monte Carlo basada en la versión PHP
  const runMonteCarloSimulation = (iterations = 1000) => {
    if (!results) return;
    setSimRunning(true);
    
    // Reproducir lógica exacta del PHP: variación en PDI (±10%) e IED/INT/RER (±15%)
    const isGrave = results.severity === 'grave';
    const RDM_min = isGrave ? 0.007 : 0.001;
    const RDM_max = isGrave ? 0.010 : 0.007;

    const simulationResults = [];
    const fines: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // Variabilidad en PDI (±10%) - igual que PHP: 0.9 + Math.random() * 0.2
      const pdiVariation = 0.9 + Math.random() * 0.2; 
      
      // Variabilidad en factores SDI (±15%) - igual que PHP: 0.85 + Math.random() * 0.3
      const iedVar = results.IED * (0.85 + Math.random() * 0.3);
      const intVar = results.INT * (0.85 + Math.random() * 0.3);
      const rerVar = results.RER * (0.85 + Math.random() * 0.3);

      // Recalcular CDI con variabilidad - exacto del PHP
      const variablePDI = (results.PDI * pdiVariation) / 100; // PDI a decimal con variación
      const simulatedCDI = (VDN * RDM_min) + (variablePDI * (VDN * (RDM_max - RDM_min)));
      
      // Recalcular SDI con variabilidad - exacto del PHP
      const simulatedSDI = (2 * (iedVar + intVar + rerVar)) / 8;

      // Multa final - exacto del PHP
      const finalFine = Math.max(0, simulatedCDI * simulatedSDI);

      simulationResults.push({
        iteration: i + 1,
        cdi: simulatedCDI,
        sdi: simulatedSDI,
        finalFine: finalFine
      });

      fines.push(finalFine);
    }

    // Calcular estadísticas - exacto del PHP
    const sortedFines = [...fines].sort((a, b) => a - b);
    const avgFine = fines.reduce((a, b) => a + b, 0) / fines.length;
    const minFine = Math.min(...fines);
    const maxFine = Math.max(...fines);
    const medianFine = sortedFines[Math.floor(sortedFines.length / 2)];

    setSimStats({ min: minFine, avg: avgFine, median: medianFine, max: maxFine });
    setSimSeries(fines);

    // Construir histograma (20 bins) - exacto del PHP
    const bins = 20;
    const binSize = (maxFine - minFine) / bins;
    const histogram = Array.from({ length: bins }, (_, i) => {
      const binStart = minFine + i * binSize;
      const binEnd = binStart + binSize;
      const count = fines.filter(f => f >= binStart && (i === bins - 1 ? f <= binEnd : f < binEnd)).length;
      return count;
    });
    
    const labels = Array.from({ length: bins }, (_, i) => {
      const binStart = minFine + i * binSize;
      const binEnd = binStart + binSize;
      return `${Math.round(binStart / 1000)}K - ${Math.round(binEnd / 1000)}K`;
    });

    setHistSeries({ labels, counts: histogram });
    setSimRunning(false);
  };

  const histChartRef = useRef<any>(null);

  const getChartDataUrls = () => {
    const histUrl = histChartRef.current?.toBase64Image?.() || histChartRef.current?.canvas?.toDataURL?.();
    return { histUrl };
  };

  const [downloading, setDownloading] = useState(false);
  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(/\/$/, '');
  const buildApiUrl = (path: string) => {
    if (/^https?:/i.test(path)) return path;
    const base = API_BASE || '';
    return base ? `${base}${path}` : path; // CRA proxy fallback si no hay base
  };

  const handleDownloadPDF = async () => {
    if (!results) return;
    setDownloading(true);
    const { histUrl } = getChartDataUrls();
    
    // Generar recomendaciones según severidad
    const recommendations = results.severity === 'grave' ? [
      '<strong>Mitigar:</strong> Se recomienda implementar medidas correctivas inmediatas para abordar la causa raíz de la infracción.',
      '<strong>Fortalecer Gobernanza:</strong> Considerar la designación de un Delegado de Protección de Datos (DPD) para supervisar el cumplimiento.',
      '<strong>Evaluar:</strong> Realizar una auditoría completa y una Evaluación de Impacto (DPIA) para los tratamientos de alto riesgo.',
      '<strong>Preparar:</strong> Establecer y probar procedimientos de respuesta a incidentes y notificación de vulneraciones.'
    ] : [
      '<strong>Mejorar:</strong> Implementar mejores prácticas y controles de seguridad para reducir la probabilidad y/o el impacto del riesgo.',
      '<strong>Capacitar:</strong> Formar a todo el personal involucrado en el tratamiento de datos sobre la normativa LOPDP y las políticas internas.',
      '<strong>Revisar:</strong> Actualizar periódicamente las políticas de privacidad y los mecanismos de consentimiento para asegurar su claridad y cumplimiento.',
      '<strong>Monitorear:</strong> Establecer controles y auditorías regulares para verificar el cumplimiento continuo.'
    ];

    const payload = {
      company: 'Almacenes Tía',
      multa: results.multaFinal,
      severity: results.severity,
      histChartDataUrl: histUrl || null,
      recommendations: recommendations,
      monteCarloStats: simStats || null,
      timestamp: Date.now()
    };
    try {
      const endpoint = buildApiUrl('/api/report/pdf');
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        let msg = 'Error al generar el PDF';
        try { const j = await resp.json(); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_mpriv.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e:any) {
      console.error('PDF download failed:', e);
      alert(e.message || 'No se pudo generar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  // Preparar datasets para gráficos
  useMemo(() => {
    // just to ensure ChartJS is registered once
  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = calculateMPRIV(formData);
    setResults(result);
  };

  const handleAreaChange = (area: string) => {
    setFormData(prev => ({ ...prev, area, activity: '' }));
    setShowActivityDescription(false);
  };

  const handleActivityChange = (activity: string) => {
    setFormData(prev => ({ ...prev, activity }));
    
    if (formData.area && activity) {
      const activityData = activities[formData.area]?.[activity] as Activity;
      if (activityData) {
        setActivityDescription(activityData.description);
        setShowActivityDescription(true);
      }
    }
  };

  // Handlers para TAV/TEV
  const handleTitularCountChange = (id: string, value: string) => {
    const num = Number(value.replace(/[^0-9.]/g, '')) || 0;
    setFormData(prev => ({ ...prev, titulares: { ...prev.titulares, [id]: num } }));
  };

  const handleToggleTitularCategory = (id: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      titularesSeleccionados: checked
        ? Array.from(new Set([...(prev.titularesSeleccionados || []), id]))
        : (prev.titularesSeleccionados || []).filter(x => x !== id)
    }));
  };

  const handleToggleVulnerables = (checked: boolean) => {
    setFormData(prev => ({ ...prev, tieneVulnerables: checked, gruposVulnerables: checked ? prev.gruposVulnerables : [] }));
  };

  const handleVulnerableGroupChange = (id: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      gruposVulnerables: checked
        ? Array.from(new Set([...(prev.gruposVulnerables || []), id]))
        : (prev.gruposVulnerables || []).filter(g => g !== id)
    }));
  };

  // Custom categories for TAV
  const [customTitularCategories, setCustomTitularCategories] = useState<{ id: string; label: string }[]>([]);
  const [newTitularName, setNewTitularName] = useState('');

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const handleAddTitularCategory = () => {
    const name = newTitularName.trim();
    if (!name) return;
    let idBase = slugify(name) || 'cat';
    let id = idBase;
    let i = 1;
    const existingIds = new Set<string>([
      ...titularCategories.map(c => c.id),
      ...customTitularCategories.map(c => c.id)
    ]);
    while (existingIds.has(id)) { id = `${idBase}_${i++}`; }
    const newCat = { id, label: name };
    setCustomTitularCategories(prev => [...prev, newCat]);
    setNewTitularName('');
  };

  const handleIntencionalidadChange = (intencionalidad: string) => {
    setFormData(prev => ({ ...prev, intencionalidad }));
    
    if (intencionalidad && intencionalidadOptions[intencionalidad as keyof typeof intencionalidadOptions]) {
      const option = intencionalidadOptions[intencionalidad as keyof typeof intencionalidadOptions];
      setDescriptions(prev => ({ ...prev, intencionalidad: option.description }));
    }
  };

  return (
    <div className="container-fluid py-2">
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h3 className="card-title mb-0">
                <i className="bi bi-file-text me-2"></i>
                Configuración del Cálculo
              </h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} id="mprivForm">
                <div className="mb-4">
                  <label htmlFor="area" className="form-label fw-bold h5">Área de la Empresa *</label>
                  <select 
                    className={`form-select ${!formData.area ? 'text-muted' : ''}`}
                    id="area" 
                    value={formData.area}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    required
                  >
                    {/* Placeholder no seleccionable */}
                    <option value="" disabled hidden>Seleccione un área</option>
                    {Object.entries(areas).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="activity" className="form-label fw-bold h5">Actividad de Tratamiento *</label>
                  <select 
                    className={`form-select ${!formData.activity ? 'text-muted' : ''}`} 
                    id="activity" 
                    value={formData.activity}
                    onChange={(e) => handleActivityChange(e.target.value)}
                    required
                  >
                    <option value="" disabled hidden>Seleccione una actividad</option>
                    {formData.area && activities[formData.area] && 
                      Object.entries(activities[formData.area]).map(([key, activity]) => (
                        <option key={key} value={key}>
                          {activity.name}
                        </option>
                      ))
                    }
                  </select>
                  {showActivityDescription && formData.area && formData.activity && (
                    <div className="mt-2">
                      <div className={`alert ${(activities[formData.area]?.[formData.activity] as Activity)?.severity === 'grave' ? 'alert-danger border-danger' : 'alert-warning border-warning'} border-start border-5`}>
                        <div className="d-flex align-items-center justify-content-start gap-2 mb-2">
                          <span className={`badge ${(activities[formData.area]?.[formData.activity] as Activity)?.severity === 'grave' ? 'bg-danger' : 'bg-warning text-dark'} fw-bold`}>
                            INFRACCIÓN {(activities[formData.area]?.[formData.activity] as Activity)?.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="small">
                          <strong>Descripción:</strong> {activityDescription}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* IED: Sección completa */}
                <div className="mb-4">
                  <h5 className="fw-bold mb-3">Impacto en los Derechos (IED) *</h5>
                  {/* TAV: Número de titulares afectados y volumen de datos */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Número de titulares afectados y volumen de datos (TAV)</label>
                    <div className="row g-2 mt-1">
                      {[...titularCategories, ...customTitularCategories].map(cat => {
                        const checked = (formData.titularesSeleccionados || []).includes(cat.id);
                        return (
                          <div className="col-md-6" key={cat.id}>
                            <div className="row g-2 align-items-center">
                              <div className="col">
                                <div className="form-check m-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`tit_${cat.id}`}
                                    checked={checked}
                                    onChange={(e) => handleToggleTitularCategory(cat.id, e.target.checked)}
                                  />
                                  <label className="form-check-label" htmlFor={`tit_${cat.id}`}>{cat.label}</label>
                                </div>
                              </div>
                              <div className="col-auto">
                                <input
                                  type="number"
                                  min={0}
                                  className="form-control text-end"
                                  style={{ width: '140px' }}
                                  value={formData.titulares[cat.id] ?? ''}
                                  onChange={(e) => handleTitularCountChange(cat.id, e.target.value)}
                                  placeholder="0"
                                  disabled={!checked}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Agregar nueva categoría de titular */}
                    <div className="mt-3">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nueva categoría (ej. Contratistas)"
                          value={newTitularName}
                          onChange={(e) => setNewTitularName(e.target.value)}
                        />
                        <button type="button" className="btn btn-outline-primary" onClick={handleAddTitularCategory}>
                          Agregar categoría
                        </button>
                      </div>
                    </div>
                    <div className="form-text mt-1">Total de titulares (fijo): {TOTAL_TITULARES_EMPRESA.toLocaleString('es-EC')}</div>
                  </div>
                  {/* TEV: Grupos especialmente vulnerables */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Grupos de titulares especialmente vulnerables (TEV)</label>
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="toggleVulnerables"
                        checked={formData.tieneVulnerables}
                        onChange={(e) => handleToggleVulnerables(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="toggleVulnerables">¿Existen grupos vulnerables?</label>
                    </div>
                    {formData.tieneVulnerables && (
                      <div className="row g-2">
                        {vulnerableGroups.map(g => (
                          <div className="col-md-6" key={g.id}>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`vg_${g.id}`}
                                checked={formData.gruposVulnerables.includes(g.id)}
                                onChange={(e) => handleVulnerableGroupChange(g.id, e.target.checked)}
                              />
                              <label className="form-check-label" htmlFor={`vg_${g.id}`}>{g.label}</label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* (Eliminado duplicado de TEV) */}

                <div className="mb-4">
                  <label htmlFor="intencionalidad" className="form-label fw-bold">
                    Intencionalidad - INT *
                  </label>
                  <select 
                    className={`form-select ${!formData.intencionalidad ? 'text-muted' : ''}`} 
                    id="intencionalidad" 
                    value={formData.intencionalidad}
                    onChange={(e) => handleIntencionalidadChange(e.target.value)}
                    required
                  >
                    <option value="" disabled hidden>Seleccione la intencionalidad</option>
                    {Object.entries(intencionalidadOptions).map(([key, option]) => (
                      <option key={key} value={key}>{option.name}</option>
                    ))}
                  </select>
                  {descriptions.intencionalidad && (
                    <div className="mt-2">
                      <div className="alert alert-warning border-start border-warning border-5">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="badge bg-warning text-dark">Valor: {intencionalidadOptions[formData.intencionalidad as keyof typeof intencionalidadOptions]?.value}</span>
                          <i className="bi bi-info-circle"></i>
                        </div>
                        <div className="small">{descriptions.intencionalidad}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RER se maneja como un valor fijo en la lógica; UI removida */}

                <button type="submit" className="btn btn-primary btn-lg w-100">
                  <i className="bi bi-calculator me-2"></i>
                  Calcular Multa MPRIV
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-success text-white">
              <h3 className="card-title mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Resultados del Cálculo
              </h3>
            </div>
            <div className="card-body">
              {!results ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-calculator display-1 text-muted mb-4"></i>
                  <h5>Complete el formulario para calcular la multa</h5>
                  <p>Todos los campos son obligatorios</p>
                </div>
              ) : (
                <div>
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="card result-card border-primary">
                        <div className="card-body text-center">
                          <div className="display-6 fw-bold text-primary">{formatCurrency(results.multaFinal)}</div>
                          <div className="text-muted">Multa final aproximada</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card result-card border-info">
                        <div className="card-body text-center">
                          <div className="display-6 fw-bold text-info">{results.severity.toUpperCase()}</div>
                          <div className="text-muted">Tipo de Infracción</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-12">
                      <h5 className="mb-3">Desglose del Cálculo</h5>
                      <div className="formula-step">
                        <strong>PDI (Porcentaje de Datos Impactados):</strong> {results.PDI}%
                      </div>
                      <div className="formula-step">
                        <strong>CDI (Cuantía de Datos Impactados):</strong> {formatCurrency(results.CDI)}
                      </div>
                      <div className="formula-step">
                        <strong>IED (Impacto en Derechos):</strong> {results.IED}
                      </div>
                      <div className="formula-step">
                        <strong>INT (Intencionalidad):</strong> {results.INT}
                      </div>
                      <div className="formula-step">
                        <strong>RER (Reiteración/Reincidencia):</strong> {results.RER}
                      </div>
                      <div className="formula-step">
                        <strong>SDI (Severidad del Impacto):</strong> {results.SDI.toFixed(4)}
                      </div>
                      <div className="formula-step bg-primary text-white">
                        <strong>Multa Final = CDI × SDI = {formatCurrency(results.multaFinal)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Sección de Recomendaciones */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="alert alert-primary">
                        <h6 className="fw-bold text-primary">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          Recomendaciones de Tratamiento del Riesgo
                        </h6>
                        {results.severity === 'grave' ? (
                          <ul className="mb-3">
                            <li><strong>Mitigar:</strong> Se recomienda implementar medidas correctivas inmediatas para abordar la causa raíz de la infracción.</li>
                            <li><strong>Fortalecer Gobernanza:</strong> Considerar la designación de un Delegado de Protección de Datos (DPD) para supervisar el cumplimiento.</li>
                            <li><strong>Evaluar:</strong> Realizar una auditoría completa y una Evaluación de Impacto (DPIA) para los tratamientos de alto riesgo.</li>
                            <li><strong>Preparar:</strong> Establecer y probar procedimientos de respuesta a incidentes y notificación de vulneraciones.</li>
                          </ul>
                        ) : (
                          <ul className="mb-3">
                            <li><strong>Mejorar:</strong> Implementar mejores prácticas y controles de seguridad para reducir la probabilidad y/o el impacto del riesgo.</li>
                            <li><strong>Capacitar:</strong> Formar a todo el personal involucrado en el tratamiento de datos sobre la normativa LOPDP y las políticas internas.</li>
                            <li><strong>Revisar:</strong> Actualizar periódicamente las políticas de privacidad y los mecanismos de consentimiento para asegurar su claridad y cumplimiento.</li>
                            <li><strong>Monitorear:</strong> Establecer controles y auditorías regulares para verificar el cumplimiento continuo.</li>
                          </ul>
                        )}
                        <div className="mt-3 pt-2 border-top border-light">
                          <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            <strong>Nota:</strong> Para descargar el reporte PDF completo, primero ejecute la simulación Monte Carlo desplazándose hacia abajo.
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de gráficos Monte Carlo */}
      {results && (
        <div className="row mt-5">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="card-title mb-0">
                  <i className="bi bi-bar-chart-line me-2"></i>
                  Simulación Monte Carlo
                </h4>
              </div>
              <div className="card-body">
                <p className="mb-4">La simulación Monte Carlo genera múltiples escenarios considerando la variabilidad en los factores de cálculo para proyectar un rango de posibles multas.</p>
                
                {simStats && (
                  <div className="row mb-4">
                    <div className="col-md-3 text-center">
                      <div className="card border-success h-100">
                        <div className="card-body">
                          <div className="fw-bold text-success">Optimista</div>
                          <div className="h5 mb-0">{formatCurrency(simStats.min)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 text-center">
                      <div className="card border-primary h-100">
                        <div className="card-body">
                          <div className="fw-bold text-primary">Promedio</div>
                          <div className="h5 mb-0">{formatCurrency(simStats.avg)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 text-center">
                      <div className="card border-info h-100">
                        <div className="card-body">
                          <div className="fw-bold text-info">Mediana</div>
                          <div className="h5 mb-0">{formatCurrency(simStats.median)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 text-center">
                      <div className="card border-danger h-100">
                        <div className="card-body">
                          <div className="fw-bold text-danger">Pesimista</div>
                          <div className="h5 mb-0">{formatCurrency(simStats.max)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-primary mb-4"
                  onClick={() => runMonteCarloSimulation(1000)}
                  disabled={simRunning}
                >
                  {simRunning ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" /> Ejecutando simulación…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-play-circle me-2"></i>
                      Ejecutar Simulación Monte Carlo (1,000 iteraciones)
                    </>
                  )}
                </button>

                {histSeries && (
                  <div className="chart-container mt-4">{/* Histograma movido arriba */}
                    <div style={{ height: '400px', margin: '20px 0' }}>
                      <Bar
                        ref={histChartRef}
                        data={{
                          labels: histSeries.labels,
                          datasets: [
                            {
                              label: 'Frecuencia',
                              data: histSeries.counts,
                              backgroundColor: 'rgba(75, 192, 192, 0.6)',
                              borderColor: 'rgba(75, 192, 192, 1)',
                              borderWidth: 1
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                            title: { display: true, text: 'Distribución de Frecuencias - Simulación Monte Carlo (1,000 iteraciones)' }
                          },
                          scales: { x: { title: { display: true, text: 'Rango de Multa' } }, y: { title: { display: true, text: 'Frecuencia' }, beginAtZero: true } },
                          maintainAspectRatio: false
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDownloadPDF}
                    disabled={!results || downloading || !histSeries}
                  >
                    {downloading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" /> Generando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-file-earmark-pdf me-2"></i>
                        Descargar Reporte PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MPRIVCalculator;
