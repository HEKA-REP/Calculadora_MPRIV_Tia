import React, { useMemo, useState, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { 
  activities, 
  areas, 
  intencionalidadOptions,
  naturalezaVulneracionOptions,
  VDN,
  titularCategories,
  vulnerableGroups,
  tiposDatosPersonales,
  WEIGHTS,
  IED_NORMALIZATION,
  RER_FIXED,
  TOTAL_TITULARES_EMPRESA,
  SDI_WEIGHTS,
  type Activity
} from '../data/mprivData';

interface FormData {
  area: string;
  activity: string;
  // IED inputs 
  titulares: Record<string, number>; // cantidades por categoría (clientes, proveedores, etc.)
  titularesSeleccionados: string[]; // categorías marcadas por el usuario
  tieneVulnerables: boolean; // toggle para mostrar grupos vulnerables
  gruposVulnerables: string[]; // ids de grupos seleccionados
  // TDP - Tipos de datos personales
  tiposDatosSeleccionados: string[]; // ids de tipos de datos seleccionados
  // Naturaleza de la vulneración
  naturalezaVulneracion: string;
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
    tiposDatosSeleccionados: [],
    naturalezaVulneracion: '',
    intencionalidad: '',
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [activityDescription, setActivityDescription] = useState<string>('');
  const [showActivityDescription, setShowActivityDescription] = useState(false);
  const [descriptions, setDescriptions] = useState({
    intencionalidad: '',
    naturalezaVulneracion: ''
  });

  // Estado para simulación Monte Carlo
  type SimulationStats = { min: number; avg: number; median: number; max: number };
  const [simStats, setSimStats] = useState<SimulationStats | null>(null);
  const [histSeries, setHistSeries] = useState<{ labels: string[]; counts: number[] } | null>(null);
  const [simRunning, setSimRunning] = useState(false);

  // Catálogos y constantes se importan desde data/mprivData

  const pert = (a: number, b: number, c: number) => (a + 4 * b + c) / 6; // 0-100

  const formatCurrency = (amount: number): string => {
    return '$' + Math.round(amount).toLocaleString('es-EC');
  };

  const calculateMPRIV = (data: FormData): CalculationResults | null => {
    const { area, activity, intencionalidad, naturalezaVulneracion } = data;
    
    if (!area || !activity || !intencionalidad || !naturalezaVulneracion) {
      return null;
    }

    const activityData = activities[area]?.[activity] as Activity;
    if (!activityData) return null;

    const isGrave = activityData.severity === 'grave';
    const RDM_min = isGrave ? 0.007 : 0.001;
    const RDM_max = isGrave ? 0.010 : 0.007;

    const PDI = activityData.pdi / 100;
    const CDI = (VDN * RDM_min) + (PDI * (VDN * (RDM_max - RDM_min)));

    // 1) TDP
    let TDP_weighted = 0;
    if (data.tiposDatosSeleccionados && data.tiposDatosSeleccionados.length > 0) {
      // Obtener los parámetros de cada tipo seleccionado
      const tiposSeleccionados = data.tiposDatosSeleccionados.map(id => 
        tiposDatosPersonales.find(tipo => tipo.id === id)
      ).filter(tipo => tipo !== undefined);
      
      if (tiposSeleccionados.length > 0) {
        // Calcular el promedio ponderado de los parámetros
        let totalA = 0, totalB = 0, totalC = 0;
        let pesoTotal = 0;
        
        tiposSeleccionados.forEach(tipo => {
          // Peso según sensibilidad: muy_alta=4, alta=3, media=2, baja=1
          const peso = tipo!.sensibilidad === 'muy_alta' ? 4 : 
                      tipo!.sensibilidad === 'alta' ? 3 :
                      tipo!.sensibilidad === 'media' ? 2 : 1;
          
          totalA += tipo!.params.a * peso;
          totalB += tipo!.params.b * peso;
          totalC += tipo!.params.c * peso;
          pesoTotal += peso;
        });
        
        // Promedio ponderado
        const avgA = totalA / pesoTotal;
        const avgB = totalB / pesoTotal;
        const avgC = totalC / pesoTotal;
        
        const TDP_expected = pert(avgA, avgB, avgC); // 0-100
        TDP_weighted = (TDP_expected / 100) * WEIGHTS.TDP; // 0-0.4
      }
    }
    
    // Si no hay tipos seleccionados, usar valor mínimo
    if (TDP_weighted === 0 && (!data.tiposDatosSeleccionados || data.tiposDatosSeleccionados.length === 0)) {
      const TDP_expected = pert(5, 10, 15); // Valores mínimos por defecto
      TDP_weighted = (TDP_expected / 100) * WEIGHTS.TDP;
    }

    // 2) TAV
    const totalAfectados = (data.titularesSeleccionados || []).reduce((sum, id) => sum + (Number(data.titulares?.[id]) || 0), 0);
    
    // Validación: Si excede el total de titulares, ajustar al máximo
    const totalAfectadosValid = Math.min(totalAfectados, TOTAL_TITULARES_EMPRESA);
    const porcentajeAfectados = TOTAL_TITULARES_EMPRESA > 0 ? (totalAfectadosValid / TOTAL_TITULARES_EMPRESA) * 100 : 0;

    // Determinar nivel TAV según conteo absoluto o porcentaje (el que primero aplique)
    let tavParams = { a: 0, b: 0, c: 0 };

    if (totalAfectadosValid < 100 || porcentajeAfectados < 0.1) {
      tavParams = { a: 0.05, b: 0.10, c: 0.20 };
    } else if ((totalAfectadosValid >= 100 && totalAfectadosValid <= 1000) || (porcentajeAfectados >= 0.1 && porcentajeAfectados <= 1)) {
      tavParams = { a: 0.20, b: 0.30, c: 0.40 };
    } else if ((totalAfectadosValid >= 1001 && totalAfectadosValid <= 10000) || (porcentajeAfectados >= 1 && porcentajeAfectados <= 10)) {
      tavParams = { a: 0.40, b: 0.50, c: 0.60 };
    } else if ((totalAfectadosValid >= 10001 && totalAfectadosValid <= 100000) || (porcentajeAfectados >= 10 && porcentajeAfectados <= 50)) {
      tavParams = { a: 0.60, b: 0.75, c: 0.85 };
    } else {
      tavParams = { a: 0.85, b: 0.95, c: 1.00 };
    }

    // Aplicar distribución triangular (PERT) al nivel determinado
    const TAV_expected = pert(tavParams.a * 100, tavParams.b * 100, tavParams.c * 100); // Convertir a escala 0-100
    const TAV_weighted = (TAV_expected / 100) * WEIGHTS.TAV; // 0-0.2

    // 3) NDV (usando selección del usuario)
    const ndvOpt = naturalezaVulneracionOptions[naturalezaVulneracion as keyof typeof naturalezaVulneracionOptions] as any;
    const NDV_expected = ndvOpt?.pert ? pert(ndvOpt.pert.a, ndvOpt.pert.b, ndvOpt.pert.c) : 0;
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
  const IED = IED_sum * IED_NORMALIZATION; // normalización 0.6 
  // INT ahora en 0-100 por PERT; fallback a value si no hay pert
  const intOpt = intencionalidadOptions[intencionalidad as keyof typeof intencionalidadOptions] as any;
  const INT_percent = intOpt?.pert ? pert(intOpt.pert.a, intOpt.pert.b, intOpt.pert.c) : (intOpt?.value || 0);
  const RER = RER_FIXED;

    // SDI con pesos: convertir a puntos 0-10 antes de mezclar
    const IED_points = IED * 10;           // IED 0-1 -> 0-10
    const INT_points = INT_percent / 10;   // INT 0-100 -> 0-10
    const RER_points = RER;                // mantener escala usada previamente (0-10 si se parametriza)
    const SDI = 2 * (
      SDI_WEIGHTS.IED * IED_points +
      SDI_WEIGHTS.INT * INT_points +
      SDI_WEIGHTS.RER * RER_points
    );
    const multaFinal = CDI * SDI;

    return {
      PDI: activityData.pdi,
      CDI,
      IED,
  INT: INT_points,
      RER,
      SDI,
      multaFinal,
      severity: activityData.severity,
      activityName: activityData.name
    };
  };

  // Simulación Monte Carlo
  const runMonteCarloSimulation = (iterations = 1000) => {
    if (!results) return;
    setSimRunning(true);
    
    // Variación en PDI (±10%) e IED/INT/RER (±15%)
    const isGrave = results.severity === 'grave';
    const RDM_min = isGrave ? 0.007 : 0.001;
    const RDM_max = isGrave ? 0.010 : 0.007;

    const simulationResults = [];
    const fines: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // Variabilidad en PDI (±10%) - 0.9 + Math.random() * 0.2
      const pdiVariation = 0.9 + Math.random() * 0.2; 
      
      // Variabilidad en factores SDI (±15%) - 0.85 + Math.random() * 0.3
  const iedVar = results.IED * (0.85 + Math.random() * 0.3);
  const intVar = results.INT * (0.85 + Math.random() * 0.3);
  const rerVar = results.RER * (0.85 + Math.random() * 0.3);

      // Recalcular CDI con variabilidad
      const variablePDI = (results.PDI * pdiVariation) / 100; // PDI a decimal con variación
      const simulatedCDI = (VDN * RDM_min) + (variablePDI * (VDN * (RDM_max - RDM_min)));
      
      // Recalcular SDI con variabilidad (usar mismo esquema de puntos/pesos)
      const iedPointsVar = iedVar * 10;      // IED 0-1 -> 0-10
      const intPointsVar = intVar;           // INT ya almacenado en puntos 0-10
      const rerPointsVar = rerVar;           // RER puntos
      const simulatedSDI = 2 * (
        SDI_WEIGHTS.IED * iedPointsVar +
        SDI_WEIGHTS.INT * intPointsVar +
        SDI_WEIGHTS.RER * rerPointsVar
      );

      // Multa final - exacto del documento
      const finalFine = Math.max(0, simulatedCDI * simulatedSDI);

      simulationResults.push({
        iteration: i + 1,
        cdi: simulatedCDI,
        sdi: simulatedSDI,
        finalFine: finalFine
      });

      fines.push(finalFine);
    }

    // Calcular estadísticas
    const sortedFines = [...fines].sort((a, b) => a - b);
    const avgFine = fines.reduce((a, b) => a + b, 0) / fines.length;
    const minFine = Math.min(...fines);
    const maxFine = Math.max(...fines);
    const medianFine = sortedFines[Math.floor(sortedFines.length / 2)];

    setSimStats({ min: minFine, avg: avgFine, median: medianFine, max: maxFine });

    // Construir histograma (20 bins)
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
      // Mejorar formato: mostrar como $85K - $95K en lugar de 85K - 95K
      return `$${Math.round(binStart / 1000)}K - $${Math.round(binEnd / 1000)}K`;
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
    
    // Construir resumen para PDF
    const activityData = formData.area && formData.activity ? (activities[formData.area]?.[formData.activity] as Activity) : null;
    const tiposSeleccionadosNombres = (formData.tiposDatosSeleccionados || []).map(id => {
      const t = tiposDatosPersonales.find(tp => tp.id === id);
      return t ? t.label.split('(')[0].trim() : '';
    }).filter(Boolean).join(', ');
    const totalAfectados = (formData.titularesSeleccionados || []).reduce((sum: number, id: string) => sum + (Number(formData.titulares?.[id]) || 0), 0);
    const gruposVulnText = formData.gruposVulnerables.length > 0 ? 'SI (' + formData.gruposVulnerables.map(id => {
      const g = vulnerableGroups.find(v => v.id === id);
      return g ? g.label.split('(')[0].trim() : '';
    }).filter(Boolean).join(', ') + ')' : 'NO';
    const intLabel = formData.intencionalidad ? intencionalidadOptions[formData.intencionalidad as keyof typeof intencionalidadOptions].name : '';
    const ndvLabel = formData.naturalezaVulneracion ? naturalezaVulneracionOptions[formData.naturalezaVulneracion as keyof typeof naturalezaVulneracionOptions].name : '';

    const pdfSummary = {
      area: formData.area ? areas[formData.area as keyof typeof areas] : '',
      actividad: activityData?.name || '',
      riesgo: activityData?.description || '',
      categoriaInfraccion: activityData ? (activityData.severity === 'grave' ? 'Grave (0.7% al 1.0%)' : 'Leve (0.1% al 0.7%)') : '',
      titularesAfectados: totalAfectados,
      tiposDatos: tiposSeleccionadosNombres,
      gruposVulnerables: gruposVulnText,
      naturalezaVulneracion: ndvLabel,
      intencionalidad: intLabel,
      multaEstimacion: results.multaFinal
    };

    const narrative = `Dentro de la simulación, la empresa expone NO aplicar medidas administrativas adicionales respecto a la actividad evaluada. La multa estimada resultante se basa en los parámetros seleccionados y la distribución de escenarios generada.`;

    const payload = {
      company: 'Almacenes Tía',
      multa: results.multaFinal,
      severity: results.severity,
      histChartDataUrl: histUrl || null,
      monteCarloStats: simStats || null,
      timestamp: Date.now(),
      summary: pdfSummary,
      narrative
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
    let num = Number(value.replace(/[^0-9.]/g, '')) || 0;
    
    // Limitar al total máximo de titulares
    if (num > TOTAL_TITULARES_EMPRESA) {
      num = TOTAL_TITULARES_EMPRESA;
    }
    
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

  const handleTipoDatoChange = (id: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tiposDatosSeleccionados: checked
        ? Array.from(new Set([...(prev.tiposDatosSeleccionados || []), id]))
        : (prev.tiposDatosSeleccionados || []).filter(t => t !== id)
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

  const handleNaturalezaVulneracionChange = (naturalezaVulneracion: string) => {
    setFormData(prev => ({ ...prev, naturalezaVulneracion }));
    
    if (naturalezaVulneracion && naturalezaVulneracionOptions[naturalezaVulneracion as keyof typeof naturalezaVulneracionOptions]) {
      const option = naturalezaVulneracionOptions[naturalezaVulneracion as keyof typeof naturalezaVulneracionOptions];
      setDescriptions(prev => ({ ...prev, naturalezaVulneracion: option.description }));
    }
  };

  return (
    <div className="container-fluid py-3">
      {/* Sección superior: Configuración del Cálculo */}
      <div className="mb-4">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h3 className="card-title mb-0">
              <i className="bi bi-sliders me-2"></i>
              Configuración del Cálculo
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} id="mprivForm">
              {/* Paso 1: Contexto */}
              <div className="section mb-4">
                <div className="section-title d-flex align-items-center mb-3">
                  <span className="section-number me-2">1</span>
                  <h5 className="mb-0 fw-bold">Contexto de la actividad</h5>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="area" className="form-label fw-semibold">Área de la Empresa *</label>
                    <select
                      className={`form-select ${!formData.area ? 'text-muted' : ''}`}
                      id="area"
                      value={formData.area}
                      onChange={(e) => handleAreaChange(e.target.value)}
                      required
                    >
                      <option value="" disabled hidden>Seleccione un área</option>
                      {Object.entries(areas).map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="activity" className="form-label fw-semibold">Actividad de Tratamiento *</label>
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
                          <option key={key} value={key}>{activity.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
                {showActivityDescription && formData.area && formData.activity && (
                  <div className="mt-3">
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

              {/* Paso 2: IED */}
              <div className="section mb-4">
                <div className="section-title d-flex align-items-center mb-3">
                  <span className="section-number me-2">2</span>
                  <h5 className="mb-0 fw-bold">Impacto en los Derechos (IED) *</h5>
                </div>

                {/* 2.1 TDP */}
                <div className="subsection mb-4">
                  <div className="d-flex align-items-center mb-2">
                    <span className="subsection-bullet me-2">2.1</span>
                    <label className="form-label fw-semibold mb-0">Tipos de datos personales tratados (TDP)</label>
                  </div>
                  <div className="form-text mb-2">Seleccione los tipos de datos personales que se procesan en esta actividad:</div>
                  <div className="row g-3">
                    {tiposDatosPersonales.map(tipo => {
                      const checked = (formData.tiposDatosSeleccionados || []).includes(tipo.id);
                      const sensibilidadColor = tipo.sensibilidad === 'muy_alta' ? 'danger' :
                                               tipo.sensibilidad === 'alta' ? 'warning' :
                                               tipo.sensibilidad === 'media' ? 'info' : 'secondary';
                      const tileClass = `tdp-tile border rounded p-2 h-100 d-flex align-items-center ${checked ? 'tdp-tile-selected' : ''}`;
                      return (
                        <div className="col-sm-6 col-lg-4" key={tipo.id}>
                          <label className={tileClass} htmlFor={`tdp_${tipo.id}`}> 
                            <input
                              className="form-check-input me-2 flex-shrink-0"
                              type="checkbox"
                              id={`tdp_${tipo.id}`}
                              checked={checked}
                              onChange={(e) => handleTipoDatoChange(tipo.id, e.target.checked)}
                            />
                            <div className="flex-grow-1 me-2">
                              <small>{tipo.label}</small>
                            </div>
                            <span className={`badge bg-${sensibilidadColor} flex-shrink-0`} style={{fontSize: '0.65rem'}}>
                              {tipo.sensibilidad === 'muy_alta' ? 'Muy Alta' :
                               tipo.sensibilidad === 'alta' ? 'Alta' :
                               tipo.sensibilidad === 'media' ? 'Media' : 'Baja'}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  {formData.tiposDatosSeleccionados && formData.tiposDatosSeleccionados.length > 0 && (
                    <div className="mt-2 p-2 bg-light rounded">
                      <small>
                        <strong>Tipos seleccionados:</strong> {formData.tiposDatosSeleccionados.length} tipo(s)
                      </small>
                    </div>
                  )}
                </div>

                {/* 2.2 TAV */}
                <div className="subsection mb-4">
                  <div className="d-flex align-items-center mb-2">
                    <span className="subsection-bullet me-2">2.2</span>
                    <label className="form-label fw-semibold mb-0">Número de titulares afectados y volumen de datos (TAV)</label>
                  </div>
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
                                max={TOTAL_TITULARES_EMPRESA}
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
                  <div className="form-text mt-1">
                    {formData.titularesSeleccionados && formData.titularesSeleccionados.length > 0 && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <small>
                          <strong>Clasificación TAV:</strong>
                          <br />
                          {(() => {
                            const totalAfectados = (formData.titularesSeleccionados || []).reduce((sum: number, id: string) => sum + (Number(formData.titulares?.[id]) || 0), 0);
                            const porcentajeAfectados = TOTAL_TITULARES_EMPRESA > 0 ? (totalAfectados / TOTAL_TITULARES_EMPRESA) * 100 : 0;

                            if (totalAfectados > TOTAL_TITULARES_EMPRESA) {
                              return (
                                <span className="text-danger">
                                  ⚠️ Error: El total de titulares afectados ({totalAfectados.toLocaleString('es-EC')}) excede el total disponible ({TOTAL_TITULARES_EMPRESA.toLocaleString('es-EC')})
                                </span>
                              );
                            }

                            let nivelTAV = '';
                            if (totalAfectados < 100 || porcentajeAfectados < 0.1) {
                              nivelTAV = 'Muy bajo';
                            } else if ((totalAfectados >= 100 && totalAfectados <= 1000) || (porcentajeAfectados >= 0.1 && porcentajeAfectados <= 1)) {
                              nivelTAV = 'Bajo';
                            } else if ((totalAfectados >= 1001 && totalAfectados <= 10000) || (porcentajeAfectados >= 1 && porcentajeAfectados <= 10)) {
                              nivelTAV = 'Medio';
                            } else if ((totalAfectados >= 10001 && totalAfectados <= 100000) || (porcentajeAfectados >= 10 && porcentajeAfectados <= 50)) {
                              nivelTAV = 'Alto';
                            } else {
                              nivelTAV = 'Muy alto';
                            }

                            return `Nivel: ${nivelTAV} (${totalAfectados.toLocaleString('es-EC')} titulares - ${porcentajeAfectados.toFixed(4)}%)`;
                          })()}
                        </small>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2.3 NDV */}
                <div className="subsection mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <span className="subsection-bullet me-2">2.3</span>
                    <label className="form-label fw-semibold mb-0">Naturaleza de la vulneración (NDV)</label>
                  </div>
                  <select
                    className={`form-select mb-3 ${!formData.naturalezaVulneracion ? 'text-muted' : ''}`}
                    id="naturalezaVulneracion"
                    value={formData.naturalezaVulneracion}
                    onChange={(e) => handleNaturalezaVulneracionChange(e.target.value)}
                    required
                  >
                    <option value="" disabled hidden>Seleccione la naturaleza de la vulneración</option>
                    {Object.entries(naturalezaVulneracionOptions).map(([key, option]) => (
                      <option key={key} value={key}>{option.name}</option>
                    ))}
                  </select>
                  {descriptions.naturalezaVulneracion && (
                    <div className="mt-2">
                      {(() => {
                        const key = formData.naturalezaVulneracion as keyof typeof naturalezaVulneracionOptions;
                        // Colores según gravedad del NDV
                        const alertClass =
                          key === 'solo_disponibilidad' ? 'alert-success border-success' :
                          key === 'integridad_comprometida' ? 'alert-info border-info' :
                          key === 'confidencialidad_vulnerada' ? 'alert-warning border-warning' :
                          key === 'multiples_aspectos' ? 'alert-danger border-danger' :
                          'alert-dark border-dark';
                        return (
                          <div className={`alert ${alertClass} border-start border-5`}>
                            <div className="small"><strong>Descripción:</strong> {descriptions.naturalezaVulneracion}</div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* 2.4 TEV */}
                <div className="subsection mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <span className="subsection-bullet me-2">2.4</span>
                    <label className="form-label fw-semibold mb-0">Grupos de titulares especialmente vulnerables (TEV)</label>
                  </div>
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

                {/* Eliminar la sección NDV duplicada que estaba aquí */}
              </div>

              {/* Paso 3: INT */}
              <div className="section mb-4">
                <div className="section-title d-flex align-items-center mb-3">
                  <span className="section-number me-2">3</span>
                  <h5 className="mb-0 fw-bold">Intencionalidad (INT) *</h5>
                </div>
                <select
                  className={`form-select mb-3 ${!formData.intencionalidad ? 'text-muted' : ''}`}
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
                    {(() => {
                      const key = formData.intencionalidad as keyof typeof intencionalidadOptions;
                      // Colores según gravedad de la intencionalidad
                      const alertClass =
                        key === 'sin_intencion' ? 'alert-success border-success' :
                        key === 'negligencia_leve' ? 'alert-warning border-warning' :
                        key === 'negligencia_grave' ? 'alert-danger border-danger' :
                        'alert-dark border-dark'; // intencion_directa diferenciado de "grave"
                      return (
                        <div className={`alert ${alertClass} border-start border-5`}>
                          <div className="small"><strong>Descripción:</strong> {descriptions.intencionalidad}</div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Acción */}
              <div className="section">
                <button type="submit" className="btn btn-primary btn-lg w-100">
                  <i className="bi bi-calculator me-2"></i>
                  Calcular Multa MPRIV
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Sección inferior: Resultados del Cálculo */}
      <div className="mb-4">
        <div className="card">
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

                  {/* Simulación Monte Carlo integrada en Resultados */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="card">
                        <div className="card-header bg-info text-white">
                          <h5 className="card-title mb-0">
                            <i className="bi bi-bar-chart-line me-2"></i>
                            Simulación Monte Carlo
                          </h5>
                        </div>
                        <div className="card-body">
                          <p className="mb-4">La simulación Monte Carlo genera múltiples escenarios considerando la variabilidad en los factores de cálculo para proyectar un rango de posibles multas.</p>
                          
                          {simStats && (
                            <div className="row mb-4">
                              <div className="col-md-3 text-center">
                                <div className="card border-success h-100">
                                  <div className="card-body">
                                    <div className="fw-bold text-success">Optimista</div>
                                    <div className="h6 mb-0 fw-bold" style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>{formatCurrency(simStats.min)}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-3 text-center">
                                <div className="card border-primary h-100">
                                  <div className="card-body">
                                    <div className="fw-bold text-primary">Promedio</div>
                                    <div className="h6 mb-0 fw-bold" style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>{formatCurrency(simStats.avg)}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-3 text-center">
                                <div className="card border-info h-100">
                                  <div className="card-body">
                                    <div className="fw-bold text-info">Mediana</div>
                                    <div className="h6 mb-0 fw-bold" style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>{formatCurrency(simStats.median)}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-3 text-center">
                                <div className="card border-danger h-100">
                                  <div className="card-body">
                                    <div className="fw-bold text-danger">Pesimista</div>
                                    <div className="h6 mb-0 fw-bold" style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>{formatCurrency(simStats.max)}</div>
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
                            <div className="chart-container mt-4">
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
                                      title: { 
                                        display: true, 
                                        text: 'Distribución de Frecuencias - Simulación Monte Carlo (1,000 iteraciones)',
                                        font: { size: 14, weight: 'bold' }
                                      }
                                    },
                                    scales: { 
                                      x: { 
                                        title: { display: true, text: 'Rango de Multa (USD)' },
                                        ticks: {
                                          maxRotation: 45,
                                          minRotation: 45,
                                          font: { size: 10 }
                                        }
                                      }, 
                                      y: { 
                                        title: { display: true, text: 'Número de Casos' }, 
                                        beginAtZero: true,
                                        ticks: {
                                          stepSize: 1,
                                          font: { size: 11 }
                                        }
                                      }
                                    },
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
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MPRIVCalculator;
