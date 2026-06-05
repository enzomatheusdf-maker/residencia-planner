// src/core/metricsRegistry.js
// Governa toda metrica exibida no StatsPanel e no Dashboard.
// Cada metrica responde: o que mede / da para confiar / o que fazer se ruim.
// Nao importa React nem hooks. Nao computa metricas — apenas define e avalia.

// ─── STATUS ──────────────────────────────────────────────────────────────────

export const METRIC_STATUS = Object.freeze({
  COLLECTING: "collecting",
  LOW_CONFIDENCE: "low_confidence",
  OK: "ok",
  WARNING: "warning",
  CRITICAL: "critical",
});

// ─── DEFINICOES ──────────────────────────────────────────────────────────────

/**
 * Cada definicao segue o contrato:
 * {
 *   id            string       identificador unico (camelCase)
 *   label         string       nome legivel
 *   shortLabel    string       versao curta para cards
 *   section       string       uma das 7 secoes: resumo|aprendizagem|erros|provas|raciocinio|atividade|sistema
 *   description   string       o que mede (1 linha)
 *   emptyState    string       texto quando nao ha dados suficientes
 *   confidenceRule fn(ctx)     retorna true quando o valor e confiavel
 *   actionWhenLow string       o que fazer quando estiver ruim ou coletando
 *   warningThreshold number|null  valor abaixo do qual e WARNING (0-100 ou unidade da metrica)
 *   criticalThreshold number|null valor abaixo do qual e CRITICAL
 *   higherIsBetter bool        false para metricas como overdueReviews
 *   unit          string       sufixo de exibicao: "%"|"min"|""|etc.
 *   platforms     string[]     ["res","vest"] | ["res"]
 * }
 */
const DEFINITIONS = [
  {
    id: "trueRetention",
    label: "Retencao longa",
    shortLabel: "Retencao",
    section: "resumo",
    description: "Acerto ponderado em revisoes D21+ e manutencao — proxy real de quanto ficou na memoria de longo prazo.",
    emptyState: "Coletando revisoes longas (D21+)",
    confidenceRule: ({ n = 0 }) => n >= 5,
    actionWhenLow: "Priorize revisoes longas e reduza temas novos por enquanto.",
    warningThreshold: 70,
    criticalThreshold: 55,
    higherIsBetter: true,
    unit: "%",
    platforms: ["res", "vest"],
  },
  {
    id: "todayWorkloadMinutes",
    label: "Carga de hoje",
    shortLabel: "Carga",
    section: "resumo",
    description: "Estimativa de minutos necessarios para fechar a fila de hoje (pendentes + vencidos).",
    emptyState: "Nenhuma revisao programada para hoje",
    confidenceRule: () => true,
    actionWhenLow: null,
    warningThreshold: null,
    criticalThreshold: null,
    higherIsBetter: false,
    unit: "min",
    platforms: ["res", "vest"],
  },
  {
    id: "overdueReviews",
    label: "Revisoes vencidas",
    shortLabel: "Vencidas",
    section: "resumo",
    description: "Revisoes com data passada ainda nao feitas. Acumulo compromete a retencao.",
    emptyState: "Nenhuma revisao vencida",
    confidenceRule: () => true,
    actionWhenLow: "Resolva a fila atrasada antes de iniciar temas novos.",
    warningThreshold: null,
    criticalThreshold: null,
    higherIsBetter: false,
    unit: "",
    platforms: ["res", "vest"],
  },
  {
    id: "relearningCount",
    label: "Reaprendendo",
    shortLabel: "Reaprendendo",
    section: "resumo",
    description: "Temas em fase de reaprendizagem — conteudo que escapou da memoria e precisa ser recuperado.",
    emptyState: "Nenhum tema em relearning",
    confidenceRule: () => true,
    actionWhenLow: "Feche os relearnings antes de abrir novos temas.",
    warningThreshold: null,
    criticalThreshold: null,
    higherIsBetter: false,
    unit: "",
    platforms: ["res", "vest"],
  },
  {
    id: "coverageByArea",
    label: "Cobertura do cronograma",
    shortLabel: "Cobertura",
    section: "aprendizagem",
    description: "Percentual de temas do cronograma que ja foram iniciados pelo menos uma vez.",
    emptyState: "Nenhum tema iniciado ainda",
    confidenceRule: ({ total = 0 }) => total >= 3,
    actionWhenLow: "Inicie os temas prioritarios do cronograma.",
    warningThreshold: 40,
    criticalThreshold: 20,
    higherIsBetter: true,
    unit: "%",
    platforms: ["res", "vest"],
  },
  {
    id: "confidenceCalibration",
    label: "Calibracao da confianca",
    shortLabel: "Calibracao",
    section: "aprendizagem",
    description: "Alinhamento entre previsao previa de desempenho e acerto real nas sessoes.",
    emptyState: "Registre previsao antes das revisoes para medir calibracao.",
    confidenceRule: ({ n = 0 }) => n >= 10,
    actionWhenLow: "Antes de responder, estime seu desempenho. Depois compare previsao e acerto real.",
    warningThreshold: 75,
    criticalThreshold: 60,
    higherIsBetter: true,
    unit: "%",
    platforms: ["res", "vest"],
  },
  {
    id: "simuladoAccuracy",
    label: "Acerto em simulados",
    shortLabel: "Simulados",
    section: "provas",
    description: "Media movel dos ultimos 4 simulados. Proxy de desempenho em condicoes de prova.",
    emptyState: "Nenhum simulado registrado ainda",
    confidenceRule: ({ n = 0 }) => n >= 2,
    actionWhenLow: "Analise os erros dos simulados por tipo e area.",
    warningThreshold: 60,
    criticalThreshold: 45,
    higherIsBetter: true,
    unit: "%",
    platforms: ["res", "vest"],
  },
  {
    id: "enamedGap",
    label: "Gap ENAMED",
    shortLabel: "ENAMED",
    section: "provas",
    description: "Diferenca entre seu desempenho estimado e a media historica do ENAMED por area.",
    emptyState: "Analise ENAMED ainda nao registrada",
    confidenceRule: ({ hasAnalise = false }) => hasAnalise,
    actionWhenLow: "Foque nas areas com maior gap. Veja o mapa ENAMED.",
    warningThreshold: null,
    criticalThreshold: null,
    higherIsBetter: false,
    unit: "pts",
    platforms: ["res"],
  },
  {
    id: "dominantError",
    label: "Tipo de erro dominante",
    shortLabel: "Erro dom.",
    section: "erros",
    description: "Tipo de erro mais frequente nas ultimas sessoes e simulados. Base para acao corretiva.",
    emptyState: "Sem erros suficientes para padrao dominante",
    confidenceRule: ({ total = 0 }) => total >= 5,
    actionWhenLow: "Continue registrando erros para identificar o padrao.",
    warningThreshold: null,
    criticalThreshold: null,
    higherIsBetter: false,
    unit: "",
    platforms: ["res", "vest"],
  },
  {
    id: "clinicalReasoningScore",
    label: "Score de raciocinio clinico",
    shortLabel: "Raciocinio",
    section: "raciocinio",
    description: "Media ponderada de acerto em casos clinicos (fase2 60%, SCT 40%). So Residencia.",
    emptyState: "Nenhum caso clinico concluido ainda",
    confidenceRule: ({ n = 0 }) => n >= 3,
    actionWhenLow: "Treine mais casos clinicos para calibrar o score.",
    warningThreshold: 65,
    criticalThreshold: 50,
    higherIsBetter: true,
    unit: "%",
    platforms: ["res"],
  },
  {
    id: "ankiAdherence",
    label: "Adesao ao Anki",
    shortLabel: "Anki",
    section: "atividade",
    description: "Percentual de dias nos ultimos 7 com sessao Anki registrada.",
    emptyState: "Nenhuma sessao Anki registrada esta semana",
    confidenceRule: ({ days = 0 }) => days >= 3,
    actionWhenLow: "Mantenha o Anki diario — mesmo 10 min protegem a retencao.",
    warningThreshold: 57,
    criticalThreshold: 30,
    higherIsBetter: true,
    unit: "%",
    platforms: ["res", "vest"],
  },
  {
    id: "weeklyConsistency",
    label: "Consistencia semanal",
    shortLabel: "Consistencia",
    section: "atividade",
    description: "Dias de estudo nos ultimos 7. Consistencia e mais importante que volume pontual.",
    emptyState: "Ainda nao ha historico desta semana",
    confidenceRule: ({ totalDays = 0 }) => totalDays >= 7,
    actionWhenLow: "Estude pelo menos 5 dias por semana para manter o ritmo.",
    warningThreshold: 4,
    criticalThreshold: 2,
    higherIsBetter: true,
    unit: "dias",
    platforms: ["res", "vest"],
  },
];

// Indice para lookup O(1)
const DEFINITIONS_MAP = Object.fromEntries(DEFINITIONS.map((d) => [d.id, d]));

// IDs obrigatorios (usados nos testes)
export const MANDATORY_METRIC_IDS = DEFINITIONS.map((d) => d.id);

// ─── API PUBLICA ──────────────────────────────────────────────────────────────

/**
 * Retorna a definicao de uma metrica pelo id.
 * @param {string} id
 * @returns {object|null}
 */
export function getMetricDefinition(id) {
  return DEFINITIONS_MAP[id] ?? null;
}

/**
 * Avalia o status de uma metrica dado o valor computado e o contexto.
 *
 * @param {string} id       - id da metrica
 * @param {*}      value    - valor ja computado (null = sem dados)
 * @param {object} context  - dados de contexto para confidenceRule (n, total, hasAnalise, etc.)
 * @returns {{ status: string, value: *, label: string, description: string,
 *             emptyState: string, action: string|null, confident: boolean }}
 */
export function evaluateMetric(id, value, context = {}) {
  const def = DEFINITIONS_MAP[id];
  if (!def) {
    return {
      status: METRIC_STATUS.COLLECTING,
      value: null,
      label: id,
      description: "",
      emptyState: "",
      action: null,
      confident: false,
    };
  }

  // Sem dados
  if (value == null) {
    return {
      status: METRIC_STATUS.COLLECTING,
      value: null,
      label: def.label,
      description: def.description,
      emptyState: def.emptyState,
      action: def.actionWhenLow,
      confident: false,
    };
  }

  const confident = def.confidenceRule(context);

  if (!confident) {
    return {
      status: METRIC_STATUS.LOW_CONFIDENCE,
      value,
      label: def.label,
      description: def.description,
      emptyState: def.emptyState,
      action: def.actionWhenLow,
      confident: false,
    };
  }

  // Metricas higherIsBetter com thresholds numericos
  let status = METRIC_STATUS.OK;
  if (def.higherIsBetter && typeof value === "number") {
    if (def.criticalThreshold != null && value < def.criticalThreshold) {
      status = METRIC_STATUS.CRITICAL;
    } else if (def.warningThreshold != null && value < def.warningThreshold) {
      status = METRIC_STATUS.WARNING;
    }
  } else if (!def.higherIsBetter && typeof value === "number") {
    // Metricas onde menor e melhor (ex: overdueReviews, relearningCount)
    // Qualquer valor > 0 e pelo menos WARNING, > 5 e CRITICAL
    if (id === "overdueReviews" || id === "relearningCount") {
      if (value >= 10) status = METRIC_STATUS.CRITICAL;
      else if (value > 0) status = METRIC_STATUS.WARNING;
    }
  }

  return {
    status,
    value,
    label: def.label,
    description: def.description,
    emptyState: def.emptyState,
    action: status !== METRIC_STATUS.OK ? def.actionWhenLow : null,
    confident: true,
  };
}

/**
 * Retorna as definicoes das metricas de uma secao para a plataforma especificada.
 *
 * @param {string} section  - nome da secao
 * @param {string} plat     - "res" | "vest"
 * @returns {object[]}
 */
export function getMetricsForSection(section, plat = "res") {
  return DEFINITIONS.filter(
    (d) => d.section === section && d.platforms.includes(plat)
  );
}

/**
 * Formata o valor de uma metrica para exibicao.
 * Nunca lanca excecao — retorna "—" se valor for null/undefined.
 *
 * @param {string} id
 * @param {*}      value
 * @param {object} context  - opcional, pode conter { locale }
 * @returns {string}
 */
export function formatMetricValue(id, value, context = {}) {
  if (value == null) return "—";
  const def = DEFINITIONS_MAP[id];
  if (!def) return String(value);

  const locale = context.locale || "pt-BR";

  // Valores textuais (ex: dominantError retorna string do tipo)
  if (typeof value === "string") return value;

  if (typeof value === "number") {
    const rounded = Number.isInteger(value) ? value : Math.round(value);
    const formatted = rounded.toLocaleString(locale);
    return def.unit ? `${formatted}${def.unit}` : formatted;
  }

  return String(value);
}

/**
 * Retorna todas as secoes distintas presentes nas definicoes.
 * @returns {string[]}
 */
export function getAllSections() {
  return [...new Set(DEFINITIONS.map((d) => d.section))];
}
