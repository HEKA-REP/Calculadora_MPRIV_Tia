export const VDN = 700000000;

export interface RiesgoIdentificado {
  name: string;
  nombre_completo: string;
  descripcion: string;
  severity: 'leve' | 'grave';
  pdi: number;
}

export interface Proceso {
  name: string;
  riesgos: {
    [key: string]: RiesgoIdentificado;
  };
}

export interface Area {
  name: string;
  procesos: {
    [key: string]: Proceso;
  };
}

export interface Activities {
  [key: string]: Area;
}

export const activities: Activities = {
  marketing_digital: {
    name: "Marketing Digital",
    procesos: {
      mailup: {
        name: "Mailup",
        riesgos: {
          transferencia_bases: {
            name: "Transferencia de bases no estandarizada",
            nombre_completo: "Transferencia de bases por canales no estandarizados y envío directo al proveedor",
            descripcion: "Este riesgo se refiere a la práctica de enviar bases de datos de clientes a proveedores externos utilizando canales no oficiales o no seguros, como correos personales, aplicaciones de mensajería o medios de almacenamiento no controlados, sin seguir los protocolos establecidos de seguridad y privacidad de datos.",
            severity: "leve",
            pdi: 50
          },
          control_acceso: {
            name: "Falta de control en el acceso",
            nombre_completo: "Falta de control en el acceso a bases administradas por el proveedor",
            descripcion: "Se presenta cuando no existen mecanismos adecuados para controlar, monitorear o limitar quién puede acceder a las bases de datos que están bajo la administración de proveedores externos, generando riesgos de acceso no autorizado o uso indebido de la información personal.",
            severity: "leve",
            pdi: 50
          }
        }
      },
      formularios_google: {
        name: "Formularios Google",
        riesgos: {
          cuentas_no_corporativas: {
            name: "Uso de cuentas no corporativas",
            nombre_completo: "Uso de cuentas no corporativas para formularios históricos sin depuración",
            descripcion: "Este riesgo implica la utilización de cuentas de correo o servicios personales en lugar de cuentas corporativas oficiales para la gestión de formularios y datos históricos, lo que puede comprometer la seguridad y el control sobre la información personal recopilada.",
            severity: "grave",
            pdi: 50
          }
        }
      },
      portal_ganadores: {
        name: "Portal corporativo ganadores",
        riesgos: {
          correos_personales: {
            name: "Dependencia de correos personales",
            nombre_completo: "Dependencia de correos personales para formularios y concursos",
            descripcion: "Este riesgo se relaciona con el uso de cuentas de correo personales en lugar de corporativas para la gestión de formularios institucionales y actividades comerciales, lo que puede afectar la trazabilidad y control de datos personales.",
            severity: "grave",
            pdi: 50
          }
        }
      },
      radio_redes: {
        name: "Atención por radio/redes (captación de ganadores)",
        riesgos: {
          transferencia_redes: {
            name: "Transferencia de datos en redes sociales",
            nombre_completo: "Transferencia de datos en redes sociales y sorteos sin aviso visible",
            descripcion: "En las dinámicas en vivo se captan datos personales y se formaliza su recepción mediante acta de entrega, pero el aviso de protección de datos no se muestra durante la transmisión. Esto puede generar tratamientos sin consentimiento informado",
            severity: "leve",
            pdi: 50
          }
        }
      }
    }
  },
  servicio_cliente: {
    name: "Servicio al cliente",
    procesos: {
      fresh_mensajea: {
        name: "Fresh / Mensajea / Freshcaller",
        riesgos: {
          visibilidad_tickets: {
            name: "Visibilidad universal de tickets",
            severity: "grave",
            nombre_completo: "Visibilidad universal de tickets",
            descripcion: "Todos los asesores pueden revisar tickets y registros de historiales de chat con clientes de otros compañeros, sin restricciones. Existen grabaciones de llamadas y tickets conservados.",
            pdi: 50
          }
        }
      },
      limites_visibilidad: {
        name: "Límites de visibilidad",
        riesgos: {
          visibilidad_ampliada: {
            name: "Visibilidad ampliada en grupos",
            severity: "grave",
            nombre_completo: "Visibilidad ampliada en grupos de mensajería y llamadas",
            descripcion: "Todos los agentes pueden acceder a conversaciones y llamadas internas, lo que incrementa el riesgo de exposición de datos y de pérdida de confidencialidad.",
            pdi: 50
          }
        }
      }
    }
  },
  data_science: {
    name: "Data Science",
    procesos: {
      analitica_clientes: {
        name: "Analítica de Clientes / Data Science",
        riesgos: {
          acceso_bases: {
            name: "Acceso a bases de datos",
            severity: "leve",
            nombre_completo: "Acceso a bases de datos",
            descripcion: "Todos los analistas tienen acceso a las bases de datos de clientes sin restricciones, lo que puede aumentar el riesgo de exposición o uso indebido de la información personal.",
            pdi: 50
          }
        }
      }
    }
  },
  data_science_fidelizacion: {
    name: "Data Science/Fidelización",
    procesos: {
      whatsapp_publimex: {
        name: "WhatsApp Marketing (Publimex)",
        riesgos: {
          campanas_universo_amplio: {
            name: "Envío de campañas a universo amplio",
            severity: "grave",
            nombre_completo: "Envío de campañas a un universo amplio de clientes",
            descripcion: "Envío de campañas a un universo amplio de clientes sin segmentación adecuada, lo que puede resultar en comunicaciones no deseadas y afectar la percepción de la marca.",
            pdi: 50
          }
        }
      }
    }
  },
  sistemas_fidelizacion: {
    name: "Sistemas/Fidelización",
    procesos: {
      capa_tecnica: {
        name: "Capa técnica / Datos (Integraciones)",
        riesgos: {
          desincronizacion: {
            name: "Desincronización de equipos y flujos",
            severity: "grave",
            nombre_completo: "Desincronización de equipos y flujos de datos",
            descripcion: "Desincronización de equipos y flujos de datos y demás procesos relacionados, lo que puede generar inconsistencias en la información y en la atención al cliente.",
            pdi: 50
          }
        }
      }
    }
  },
  fidelizacion: {
    name: "Fidelización",
    procesos: {
      consentimientos_correo: {
        name: "Consentimientos / Correo masivo",
        riesgos: {
          verificacion_consentimientos: {
            name: "Falta de verificación masiva de consentimientos",
            severity: "grave",
            nombre_completo: "Falta de verificación masiva de consentimientos",
            descripcion: "Falta de verificación masiva de consentimientos, lo que puede resultar en el envío de comunicaciones a personas que no han otorgado su consentimiento explícito, incumpliendo las normativas de protección de datos.",
            pdi: 50
          }
        }
      },
      whatsapp_numeracion: {
        name: "WhatsApp marketing (numeración)",
        riesgos: {
          bases_compartidas: {
            name: "Bases de datos con almacenamiento compartido",
            severity: "grave",
            nombre_completo: "Bases de datos con almacenamiento compartido y contratos ambiguos",
            descripcion: "Este riesgo se refiere a la práctica de almacenar bases de datos de clientes en plataformas compartidas entre múltiples clientes o usuarios, lo que puede generar confusión sobre la propiedad y el control de los datos. Además, los contratos ambiguos con los proveedores pueden dificultar la gestión adecuada de la privacidad y seguridad de la información personal.",
            pdi: 50
          }
        }
      },
      alianzas_farmaenlace: {
        name: "Alianzas (Farmaenlace - validación por API)",
        riesgos: {
          envio_aliados: {
            name: "Envío de datos por aliados",
            severity: "grave",
            nombre_completo: "Envío de datos por aliados con distintos niveles de información",
            descripcion: "Este riesgo se refiere a la transferencia de datos personales a través de aliados o terceros que pueden tener diferentes niveles de acceso o información sobre los titulares de los datos. Esto puede generar inconsistencias en la gestión de la privacidad y aumentar el riesgo de exposición o uso indebido de la información personal.",
            pdi: 50
          }
        }
      },
      landing_pages: {
        name: "Landing pages / Formularios externos",
        riesgos: {
          bases_paralelas: {
            name: "Creación de bases paralelas",
            severity: "grave",
            nombre_completo: "Creación de bases paralelas con baja integridad en contingencias",
            descripcion: "Este riesgo se refiere a la práctica de crear y mantener bases de datos paralelas para la gestión de datos personales, especialmente en situaciones de contingencia. Estas bases pueden tener baja integridad, lo que implica que la información puede estar incompleta, desactualizada o incorrecta, afectando la calidad del servicio y la protección de los datos personales.",
            pdi: 50
          }
        }
      }
    }
  },
  creditia: {
    name: "Creditía",
    procesos: {
      jelou_activaciones: {
        name: "Jelou - activaciones",
        riesgos: {
          almacenamiento_indefinido: {
            name: "Almacenamiento indefinido de registros",
            severity: "grave",
            nombre_completo: "Almacenamiento indefinido de registros de activación por WhatsApp",
            descripcion: "Almacenamiento indefinido de registros de activación por WhatsApp, lo que puede implicar la retención innecesaria de datos personales más allá del tiempo requerido para la finalidad original, aumentando el riesgo de exposición o uso indebido de la información.",
            pdi: 50
          }
        }
      },
      usuarios_permisos: {
        name: "Usuarios y permisos en tiendas",
        riesgos: {
          cuentas_genericas: {
            name: "Uso de cuentas genéricas por tienda",
            severity: "grave",
            nombre_completo: "Uso de cuentas genéricas por tienda",
            descripcion: "Uso de cuentas genéricas por tienda, lo que dificulta la trazabilidad y responsabilidad individual en el manejo de datos personales, aumentando el riesgo de acceso no autorizado o uso indebido de la información.",
            pdi: 50
          }
        }
      },
      cobranzas_terceros: {
        name: "Cobranzas – terceros",
        riesgos: {
          envio_carteras: {
            name: "Envío de carteras vencidas a terceros",
            severity: "grave",
            nombre_completo: "Envío de carteras vencidas a terceros por correo electrónico",
            descripcion: "Envío de carteras vencidas a terceros por correo electrónico, lo que puede comprometer la seguridad y confidencialidad de los datos personales contenidos en dichas carteras, aumentando el riesgo de acceso no autorizado o uso indebido de la información.",
            pdi: 50
          }
        }
      },
      verificaciones_externas: {
        name: "Verificaciones externas",
        riesgos: {
          validacion_identidad: {
            name: "Validación de identidad y evaluación crediticia",
            severity: "leve",
            nombre_completo: "Validación de identidad y evaluación crediticia con contratos pendientes de actualización",
            descripcion: "Validación de identidad y evaluación crediticia con contratos pendientes de actualización, lo que puede generar incertidumbre sobre las responsabilidades y obligaciones de las partes involucradas en el manejo de datos personales.",
            pdi: 50
          }
        }
      }
    }
  },
  fidelizacion_marketing_btl_creditia: {
    name: "Fidelización/Marketing/BTL/Creditía",
    procesos: {
      consumo_empresarial: {
        name: "Consumo Empresarial (SGC / iDempiere)",
        riesgos: {
          procedimiento_eliminacion: {
            name: "Ausencia de procedimiento formal para eliminación",
            severity: "grave",
            nombre_completo: "Ausencia de procedimiento formal para eliminación de datos en listados recibidos por correo",
            descripcion: "Ausencia de procedimiento formal para eliminación de datos en listados recibidos por correo, lo que puede resultar en la retención innecesaria de datos personales y aumentar el riesgo de incumplimiento de las normativas de protección de datos.",
            pdi: 50
          }
        }
      }
    }
  },
  fidelizacion_servicio_cliente: {
    name: "Fidelización/Servicio al cliente",
    procesos: {
      alianzas_barcelona: {
        name: "Alianzas (Socios Barcelona y otros)",
        riesgos: {
          procedimiento_borrado: {
            name: "Ausencia de procedimiento formal para borrado",
            severity: "grave",
            nombre_completo: "Ausencia de procedimiento formal para borrado de datos",
            descripcion: "Ausencia de procedimiento formal para borrado de datos, lo que puede llevar a la retención innecesaria de información personal y aumentar el riesgo de incumplimiento de las leyes de protección de datos.",
            pdi: 50
          }
        }
      }
    }
  },
  consumo_empresarial: {
    name: "Consumo Empresarial",
    procesos: {
      comunicaciones: {
        name: "Comunicaciones",
        riesgos: {
          intercambio_urgencia: {
            name: "Intercambio de datos en casos de urgencia",
            severity: "grave",
            nombre_completo: "Intercambio de datos por correo y WhatsApp en casos de urgencia",
            descripcion: "Intercambio de datos por correo y WhatsApp en casos de urgencia, lo que puede comprometer la seguridad y confidencialidad de la información personal al utilizar canales no oficiales o no seguros.",
            pdi: 50
          }
        }
      }
    }
  },
  sistemas: {
    name: "Sistemas",
    procesos: {
      core_continuidad: {
        name: "Core / Continuidad",
        riesgos: {
          ausencia_backup: {
            name: "Ausencia de respaldo (backup)",
            severity: "grave",
            nombre_completo: "Ausencia de respaldo (backup) en el sistema core",
            descripcion: "Ausencia de respaldo (backup) en el sistema core, lo que puede poner en riesgo la disponibilidad y recuperación de datos en caso de fallos o incidentes, afectando la continuidad del negocio y la protección de los datos personales.",
            pdi: 50
          }
        }
      },
      core_consentimientos: {
        name: "Core / Consentimientos",
        riesgos: {
          falta_captacion: {
            name: "Falta de captación de consentimientos",
            severity: "grave",
            nombre_completo: "Falta de captación de consentimientos por caída del sistema",
            descripcion: "Falta de captación de consentimientos por caída del sistema, lo que puede resultar en el tratamiento de datos personales sin el consentimiento adecuado de los titulares, incumpliendo las normativas de protección de datos.",
            pdi: 50
          }
        }
      },
      terceros_uruguay: {
        name: "Terceros (Corporativo Uruguay)",
        riesgos: {
          ausencia_sla: {
            name: "Ausencia de acuerdo de nivel de servicio (SLA)",
            severity: "grave",
            nombre_completo: "Ausencia de acuerdo de nivel de servicio (SLA) en soporte internacional",
            descripcion: "Ausencia de acuerdo de nivel de servicio (SLA) en soporte internacional, lo que puede generar incertidumbre sobre los tiempos y calidad del servicio proporcionado, afectando la gestión adecuada de los datos personales.",
            pdi: 50
          }
        }
      }
    }
  },
  sac: {
    name: "SAC",
    procesos: {
      sac_proceso: {
        name: "SAC",
        riesgos: {
          bases_externas: {
            name: "Uso de bases externas para campañas",
            severity: "grave",
            nombre_completo: "Uso de bases externas para campañas",
            descripcion: "Uso de bases externas para campañas, lo que puede comprometer la calidad y seguridad de los datos personales al depender de fuentes externas que pueden no cumplir con las normativas de protección de datos.",
            pdi: 50
          }
        }
      }
    }
  }
};

export const areas = {
  marketing_digital: 'Marketing Digital',
  servicio_cliente: 'Servicio al cliente',
  data_science: 'Data Science',
  data_science_fidelizacion: 'Data Science/Fidelización',
  sistemas_fidelizacion: 'Sistemas/Fidelización',
  fidelizacion: 'Fidelización',
  creditia: 'Creditía',
  fidelizacion_marketing_btl_creditia: 'Fidelización/Marketing/BTL/Creditía',
  fidelizacion_servicio_cliente: 'Fidelización/Servicio al cliente',
  consumo_empresarial: 'Consumo Empresarial',
  sistemas: 'Sistemas',
  sac: 'SAC'
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
  { id: 'colaboradores', label: 'Colaboradores' },
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
  { id: 'identificativos', label: '<strong>Datos Identificativos:</strong> Información que permite la identificación de una persona.', sensibilidad: 'baja', params: { a: 10, b: 20, c: 30 } },
  { id: 'contacto', label: '<strong>Datos de Contacto:</strong> Incluyen detalles para comunicarse con la persona, como correos electrónicos o números de teléfono.', sensibilidad: 'baja', params: { a: 15, b: 25, c: 35 } },
  { id: 'demograficos', label: '<strong>Datos Demográficos:</strong> Características de la población, como edad o género.', sensibilidad: 'media', params: { a: 20, b: 30, c: 40 } },
  { id: 'financieros', label: '<strong>Datos Financieros:</strong> Información económica o bancaria de las personas.', sensibilidad: 'alta', params: { a: 50, b: 70, c: 85 } },
  { id: 'biometricos', label: '<strong>Datos Biométricos:</strong> Datos relacionados con características físicas o de comportamiento únicas, como huellas dactilares o reconocimiento facial.', sensibilidad: 'muy_alta', params: { a: 70, b: 85, c: 95 } },
  { id: 'academicos', label: '<strong>Datos Académicos:</strong> Información sobre el historial educativo de una persona.', sensibilidad: 'media', params: { a: 25, b: 35, c: 45 } },
  { id: 'salud', label: '<strong>Datos de Salud:</strong> Información relacionada con la condición de salud física o mental.', sensibilidad: 'muy_alta', params: { a: 75, b: 90, c: 100 } }
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
