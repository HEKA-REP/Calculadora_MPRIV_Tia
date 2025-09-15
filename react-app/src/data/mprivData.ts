export const VDN = 170000000;

// Tipos para mejor tipado
export interface Activity {
  name: string;
  severity: 'leve' | 'grave';
  description: string;
  pdi: number;
}

export interface ActivityGroup {
  [key: string]: Activity;
}

export interface Activities {
  [key: string]: ActivityGroup;
}

export const activities: Activities = {
  marketing: {
    email_marketing: {
      name: "Email Marketing",
      severity: "leve",
      description: "Envío de correos promocionales sin consentimiento explícito",
      pdi: 30
    },
    publicidad_dirigida: {
      name: "Publicidad Dirigida",
      severity: "grave",
      description: "Segmentación y perfilado sin base legal adecuada",
      pdi: 60
    },
    analisis_comportamiento: {
      name: "Análisis de Comportamiento",
      severity: "grave",
      description: "Tracking y análisis sin consentimiento explícito",
      pdi: 80
    }
  },
  ventas: {
    gestion_clientes: {
      name: "Gestión de Clientes (CRM)",
      severity: "leve",
      description: "Almacenamiento inadecuado de datos de clientes",
      pdi: 20
    },
    procesamiento_pagos: {
      name: "Procesamiento de Pagos",
      severity: "grave",
      description: "Manejo inadecuado de datos financieros sensibles",
      pdi: 90
    },
    historial_compras: {
      name: "Historial de Compras",
      severity: "leve",
      description: "Uso no autorizado del historial transaccional",
      pdi: 40
    }
  },
  rrhh: {
    datos_empleados: {
      name: "Datos de Empleados",
      severity: "grave",
      description: "Tratamiento inadecuado de información laboral",
      pdi: 50
    },
    nomina: {
      name: "Nómina y Beneficios",
      severity: "grave",
      description: "Exposición no autorizada de datos salariales",
      pdi: 70
    },
    evaluacion_desempeno: {
      name: "Evaluación de Desempeño",
      severity: "leve",
      description: "Uso inadecuado de evaluaciones laborales",
      pdi: 30
    }
  },
  financiero: {
    facturacion: {
      name: "Facturación",
      severity: "leve",
      description: "Manejo inadecuado de datos fiscales",
      pdi: 40
    },
    credito_cobranza: {
      name: "Crédito y Cobranza",
      severity: "grave",
      description: "Uso no autorizado para evaluación crediticia",
      pdi: 80
    },
    reportes_financieros: {
      name: "Reportes Financieros",
      severity: "leve",
      description: "Divulgación inadecuada de informes",
      pdi: 25
    }
  },
  logistica: {
    gestion_entregas: {
      name: "Gestión de Entregas",
      severity: "leve",
      description: "Uso inadecuado de datos de entrega",
      pdi: 20
    },
    tracking_productos: {
      name: "Tracking de Productos",
      severity: "leve",
      description: "Seguimiento no autorizado con datos del cliente",
      pdi: 35
    },
    proveedores: {
      name: "Gestión de Proveedores",
      severity: "leve",
      description: "Compartir datos inadecuadamente con terceros",
      pdi: 50
    }
  },
  ecommerce: {
    tienda_online: {
      name: "Tienda Online",
      severity: "grave",
      description: "Falta de medidas de seguridad en e-commerce",
      pdi: 60
    },
    cookies_tracking: {
      name: "Cookies y Tracking",
      severity: "grave",
      description: "Cookies de seguimiento sin consentimiento válido",
      pdi: 70
    },
    integracion_redes: {
      name: "Integración Redes Sociales",
      severity: "grave",
      description: "Transferencia no autorizada a redes sociales",
      pdi: 55
    }
  }
};

export const areas = {
  marketing: 'Marketing y Publicidad',
  ventas: 'Ventas y Atención al Cliente',
  rrhh: 'Recursos Humanos',
  financiero: 'Área Financiera',
  logistica: 'Logística y Distribución',
  ecommerce: 'E-commerce y Digital'
};

export const impactoDerechosOptions = {
  minimo: {
    name: "Impacto Mínimo (1-3)",
    value: 2,
    description: "Afectación menor, sin daño significativo a los titulares de datos"
  },
  bajo: {
    name: "Impacto Bajo (4-5)",
    value: 4.5,
    description: "Afectación limitada con consecuencias menores"
  },
  moderado: {
    name: "Impacto Moderado (6-7)",
    value: 6.5,
    description: "Afectación considerable pero controlable"
  },
  alto: {
    name: "Impacto Alto (8-10)",
    value: 9,
    description: "Afectación grave a derechos fundamentales"
  }
};

export const intencionalidadOptions = {
  sin_intencion: {
  name: "Sin intención",
  description: "Accidental; con controles básicos.",
  pert: { a: 10, b: 20, c: 30 }
  },
  negligencia_leve: {
  name: "Negligencia leve",
  description: "Descuido puntual; controles vigentes.",
  pert: { a: 25, b: 40, c: 55 }
  },
  negligencia_grave: {
  name: "Negligencia grave",
  description: "Deficiencia seria o sin controles.",
  pert: { a: 50, b: 70, c: 85 }
  },
  intencion_directa: {
  name: "Intención directa",
  description: "Decisión consciente de infringir.",
  pert: { a: 75, b: 90, c: 100 }
  }
};

export const naturalezaVulneracionOptions = {
  solo_disponibilidad: {
    name: "Solo disponibilidad afectada",
    description: "Únicamente se ve comprometida la disponibilidad de los datos",
    pert: { a: 10, b: 15, c: 25 }
  },
  integridad_comprometida: {
    name: "Integridad comprometida",
    description: "La integridad de los datos se encuentra comprometida",
    pert: { a: 35, b: 50, c: 65 }
  },
  confidencialidad_vulnerada: {
    name: "Confidencialidad vulnerada",
    description: "Se ha vulnerado la confidencialidad de los datos personales",
    pert: { a: 55, b: 70, c: 85 }
  },
  multiples_aspectos: {
    name: "Múltiples aspectos afectados",
    description: "Múltiples aspectos de seguridad se encuentran comprometidos",
    pert: { a: 70, b: 85, c: 100 }
  }
};

export const reincidenciaOptions = {
  ninguna: {
    name: "No Aplica (0)",
    value: 0,
    description: "Primera infracción, sin antecedentes"
  },
  reiteracion_menor: {
    name: "Reiteración Menor (1-3)",
    value: 2,
    description: "Conducta similar reciente de baja gravedad"
  },
  reiteracion_moderada: {
    name: "Reiteración Moderada (4-6)",
    value: 5,
    description: "Repetición de conductas similares"
  },
  reincidencia: {
    name: "Reincidencia Alta (7-10)",
    value: 8.5,
    description: "Múltiples infracciones previas graves"
  }
};

// ---- Catálogos y constantes compartidas para el cálculo ----

export type Sensibilidad = 'baja' | 'media' | 'alta' | 'muy_alta';

export interface TitularCategory { id: string; label: string }
export interface VulnerableGroup { id: string; label: string }
export interface TipoDatoPersonal {
  id: string;
  label: string;
  sensibilidad: Sensibilidad;
  params: { a: number; b: number; c: number };
}

// Catálogo: categorías de titulares (TAV)
export const titularCategories: TitularCategory[] = [
  { id: 'clientes', label: 'Clientes' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'empleados', label: 'Empleados' },
  { id: 'prospectos', label: 'Prospectos / Leads' },
  { id: 'visitantes', label: 'Visitantes (Sitio/App)' }
];

// Catálogo: grupos vulnerables (TEV)
export const vulnerableGroups: VulnerableGroup[] = [
  { id: 'ninos_adolescentes', label: 'Niñas, niños y adolescentes' },
  { id: 'adultos_mayores', label: 'Personas adultas mayores' },
  { id: 'personas_discapacitadas', label: 'Personas con discapacidad' },
  { id: 'comunidades_indigenas', label: 'Pueblos y nacionalidades indígenas' },
  { id: 'migrantes_refugiados', label: 'Personas migrantes/refugiados' },
  { id: 'privadas_libertad', label: 'Personas privadas de libertad' }
];

// Catálogo: tipos de datos personales (TDP)
export const tiposDatosPersonales: TipoDatoPersonal[] = [
  { id: 'identificativos', label: 'Datos identificativos básicos (nombre, cédula, dirección)', sensibilidad: 'baja', params: { a: 10, b: 20, c: 30 } },
  { id: 'contacto', label: 'Datos de contacto (email, teléfono)', sensibilidad: 'baja', params: { a: 15, b: 25, c: 35 } },
  { id: 'laborales', label: 'Datos laborales (puesto, salario, empresa)', sensibilidad: 'media', params: { a: 25, b: 40, c: 55 } },
  { id: 'financieros', label: 'Datos financieros (tarjetas, cuentas bancarias)', sensibilidad: 'alta', params: { a: 50, b: 70, c: 85 } },
  { id: 'biometricos', label: 'Datos biométricos (huellas, reconocimiento facial)', sensibilidad: 'muy_alta', params: { a: 70, b: 85, c: 95 } },
  { id: 'salud', label: 'Datos de salud (historial médico, condiciones)', sensibilidad: 'muy_alta', params: { a: 75, b: 90, c: 100 } },
  { id: 'ubicacion', label: 'Datos de ubicación (GPS, geolocalización)', sensibilidad: 'media', params: { a: 30, b: 45, c: 60 } },
  { id: 'comportamiento', label: 'Datos de comportamiento (navegación, preferencias)', sensibilidad: 'media', params: { a: 20, b: 35, c: 50 } },
  { id: 'ideologicos', label: 'Datos ideológicos (religión, política, orientación sexual)', sensibilidad: 'muy_alta', params: { a: 65, b: 80, c: 95 } }
];

// Ponderaciones y constantes del modelo
export const WEIGHTS = {
  TDP: 0.4,
  TAV: 0.2,
  NDV: 0.2,
  TEV: 0.2,
} as const;

export const IED_NORMALIZATION = 0.6; // Factor de normalización final del IED
export const RER_FIXED = 0;            // Reiteración/Reincidencia fija (0 = no aplica)
export const TOTAL_TITULARES_EMPRESA = 4_500_000; // Total máximo de titulares

// Pesos del SDI conforme a la guía: IED 60%, INT 40%, RER opcional con 20% adicional
// Nota: En la guía, RER se aplica como agravante adicional (20%) en casos que corresponda.
export const SDI_WEIGHTS = {
  IED: 0.6,
  INT: 0.4,
  RER: 0.2,
} as const;
