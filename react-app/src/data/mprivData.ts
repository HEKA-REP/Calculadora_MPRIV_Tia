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
    name: "Sin Intención (1-3)",
    value: 2,
    description: "Error no intencional por desconocimiento"
  },
  negligencia_leve: {
    name: "Negligencia Leve (4-5)",
    value: 4.5,
    description: "Descuido menor en procedimientos"
  },
  negligencia_grave: {
    name: "Negligencia Grave (6-7)",
    value: 6.5,
    description: "Descuido grave en obligaciones conocidas"
  },
  intencion_directa: {
    name: "Intención Directa (8-10)",
    value: 9,
    description: "Violación consciente e intencional"
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
