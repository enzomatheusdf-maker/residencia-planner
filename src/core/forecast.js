// src/core/forecast.js
import { estimateStudentMastery } from "./mastery";
import { saldoRitmo } from "./volume";

// Previsão de desempenho ancorada em simulados/provas.
// Base científica: avaliações práticas são o preditor mais forte de desempenho real
// (erro médio ±5–8 pts p/ NBME self-assessments). 2 formas espaçadas ~2 semanas estreitam
// a banda de previsão; 3 formas é melhor.
// Ref: PMC7198101, PMC10362906, PMC4673073

export const FORECAST_CONFIDENCE = Object.freeze({
  INSUFFICIENT: "insufficient",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
});

export const FORECAST_DISPLAY_MODE = Object.freeze({
  COLLECTING: "collecting",
  PREVIEW: "preview",
  FORECAST: "forecast",
});

export const DEFAULT_FORECAST_WEIGHTS = Object.freeze({
  simuladoAnchor: 0.40,
  masteryIndex: 0.30,
  coverageIndex: 0.15,
  adherenceIndex: 0.10,
  calibrationIndex: 0.05,
});

export const FORECAST_LABEL = Object.freeze({
  collecting: "Coletando dados",
  preview: "Prévia de trajetória",
  forecast: "Forecast de prontidão",
});

const FORECAST_EXPLANATION = Object.freeze({
  collecting: "Ainda não há dados suficientes para uma previsão útil. Registre pelo menos 1 simulado e mais revisões espaçadas.",
  preview: "Prévia fraca baseada em dados parciais. Use como orientação, não como meta rígida.",
  forecast: "Estimativa interna de trajetória até a prova, com banda de incerteza. Não é nota oficial.",
});

const MS_PER_DAY = 86400000;

function clamp(value, min = 0, max = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

function clampRound(value, min = 0, max = 100) {
  const n = clamp(value, min, max);
  return n == null ? null : Math.round(n);
}

function normalize01or100(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n >= 0 && n <= 1) return n;
  if (n >= 0 && n <= 100) return n / 100;
  return null;
}

export function isValidDateStr(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function defaultTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function parseExamDate(meta = {}, fallback = null) {
  const candidates = [meta?.dataProva, meta?.targetDate, fallback];
  return candidates.find(isValidDateStr) || null;
}

export function daysBetweenDates(startStr, endStr) {
  if (!isValidDateStr(startStr) || !isValidDateStr(endStr)) return null;
  const start = new Date(`${startStr}T00:00:00`);
  const end = new Date(`${endStr}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.round((end - start) / MS_PER_DAY);
}

function getSimuladoPct(simulado) {
  const candidates = [
    simulado?.pct,
    simulado?.percentual,
    simulado?.acertoPct,
    simulado?.scorePct,
    simulado?.score,
  ];

  for (const value of candidates) {
    const n = Number(value);
    if (!Number.isFinite(n)) continue;
    if (n >= 0 && n <= 1) return Math.round(n * 100);
    if (n >= 0 && n <= 100) return Math.round(n);
  }

  return null;
}

function getSimuladoDate(simulado) {
  const candidates = [simulado?.date, simulado?.data, simulado?.dia, simulado?.createdAt];
  const found = candidates.find((value) => typeof value === "string" && isValidDateStr(value.slice(0, 10)));
  return found ? found.slice(0, 10) : null;
}

function getSimuladoTotalQuestions(simulado) {
  const candidates = [
    simulado?.totalQuestions,
    simulado?.questoes,
    simulado?.questions,
    simulado?.nQuestoes,
    simulado?.totalQuestoes,
  ];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) return Math.round(n);
  }
  return null;
}

export function normalizeSimulados(simulados = []) {
  if (!Array.isArray(simulados)) return [];

  return simulados
    .map((simulado, index) => {
      const pct = getSimuladoPct(simulado);
      if (pct == null) return null;
      return {
        pct,
        date: getSimuladoDate(simulado),
        totalQuestions: getSimuladoTotalQuestions(simulado),
        source: "simulado",
        originalIndex: index,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.date && b.date && a.date !== b.date) return a.date.localeCompare(b.date);
      return a.originalIndex - b.originalIndex;
    })
    .map(({ originalIndex, ...item }) => item);
}

export function calculateSimuladoAnchor(simulados = []) {
  const valid = normalizeSimulados(simulados);
  if (!valid.length) {
    return {
      value: null,
      n: 0,
      recent: [],
      confidence: FORECAST_CONFIDENCE.INSUFFICIENT,
      reason: "no_simulado",
    };
  }

  const recent = valid.slice(-4);
  const weights = recent.map((_, i) => 1 + i * 0.15);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const value = Math.round(
    recent.reduce((sum, item, index) => sum + item.pct * weights[index], 0) / totalWeight
  );

  const n = valid.length;
  const confidence = n >= 3
    ? FORECAST_CONFIDENCE.HIGH
    : n >= 2
      ? FORECAST_CONFIDENCE.MEDIUM
      : FORECAST_CONFIDENCE.LOW;

  return { value, n, recent, confidence, reason: "ok" };
}

function getMasteryIndex(studentMastery) {
  if (studentMastery?.global && Number(studentMastery.global.topicsWithEvidence || 0) <= 0) {
    return null;
  }

  const candidates = [
    studentMastery?.global?.pMastery,
    studentMastery?.pMastery,
    studentMastery?.globalMastery,
    studentMastery?.index,
    studentMastery?.score,
  ];

  for (const value of candidates) {
    const normalized = normalize01or100(value);
    if (normalized != null) return Math.round(normalized * 100);
  }

  return null;
}

function calculateCoverageIndex(temas = []) {
  if (!Array.isArray(temas) || temas.length === 0) return null;
  const started = temas.filter((tema) => !tema?.unstarted).length;
  return Math.round((started / temas.length) * 100);
}

function calculateAdherenceIndex({ temas = [], meta = {} } = {}) {
  try {
    if (!meta?.metaQuestoesDia || !Array.isArray(temas) || temas.length === 0) return null;
    const started = temas.filter((tema) => !tema?.unstarted);
    const startStr = started[0]?.d0 || null;
    const pace = saldoRitmo(temas, meta, startStr);
    if (!pace) return null;
    if (pace.saldo >= 0) return 100;
    const ratio = pace.esperado > 0 ? Math.max(0, pace.feito / pace.esperado) : 1;
    return Math.round(ratio * 100);
  } catch {
    return null;
  }
}

function getCalibrationIndex(calibration) {
  const candidates = [calibration?.score, calibration?.calibrationScore, calibration?.index];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n)) return clampRound(n);
  }
  return null;
}

export function calculateOperationalRisk(operationalMode) {
  const mode = operationalMode?.mode || operationalMode;
  if (!mode) return 0;

  const map = {
    normal: 0,
    prova_proxima: 5,
    recuperacao: 10,
    sobrecarga: 18,
    pausado: 25,
    dados_inconsistentes: 30,
  };

  return map[mode] ?? 0;
}

export function calculateTimePotential(daysUntilExam, operationalMode = null) {
  if (!Number.isFinite(daysUntilExam)) return null;
  if (daysUntilExam <= 0) return 0;

  let base;
  if (daysUntilExam >= 180) base = 12;
  else if (daysUntilExam >= 120) base = 10;
  else if (daysUntilExam >= 90) base = 8;
  else if (daysUntilExam >= 60) base = 6;
  else if (daysUntilExam >= 30) base = 4;
  else if (daysUntilExam >= 14) base = 2;
  else base = 1;

  const risk = calculateOperationalRisk(operationalMode);
  const riskFactor = Math.max(0.55, 1 - risk / 100);
  return Math.round(base * riskFactor);
}

function inferActiveDaysFromTemas(temas = []) {
  const dates = new Set();
  (Array.isArray(temas) ? temas : []).forEach((tema) => {
    if (isValidDateStr(tema?.d0)) dates.add(tema.d0);
    Object.values(tema?.rev || {}).forEach((entry) => {
      const candidates = [entry?.reviewedAt, entry?.doneAt, entry?.date, entry?.data];
      candidates.forEach((value) => {
        if (typeof value === "string" && isValidDateStr(value.slice(0, 10))) {
          dates.add(value.slice(0, 10));
        }
      });
    });
  });
  return dates.size;
}

function totalQuestionsFromTemas(temas = []) {
  return (Array.isArray(temas) ? temas : []).reduce((sum, tema) => {
    const direct = Number(tema?.questoes ?? tema?.questions ?? tema?.qtdQuestoes ?? 0);
    const directSafe = Number.isFinite(direct) ? direct : 0;
    const revTotal = Object.values(tema?.rev || {}).reduce((revSum, entry) => {
      const q = Number(entry?.questoes ?? entry?.questions ?? 0);
      return revSum + (Number.isFinite(q) ? q : 0);
    }, 0);
    return sum + directSafe + revTotal;
  }, 0);
}

function getAreaArray(studentMastery) {
  const rawAreas = studentMastery?.areas || studentMastery?.areaMastery || studentMastery?.byArea || [];
  return Array.isArray(rawAreas) ? rawAreas : Object.values(rawAreas || {});
}

export function calculateForecastSampleV2({
  temas = [],
  simulados = [],
  studentMastery = null,
  today = null,
} = {}) {
  const simNorm = normalizeSimulados(simulados);
  const nSimulados = simNorm.length;
  const totalQuestionsFromSims = simNorm.reduce((sum, simulado) => sum + (Number(simulado.totalQuestions) || 0), 0);
  const totalQuestions = Math.max(totalQuestionsFromSims, totalQuestionsFromTemas(temas));
  const areasWithMastery = getAreaArray(studentMastery).filter((area) => {
    const p = area?.pMastery ?? area?.mastery ?? area?.score;
    return normalize01or100(p) != null;
  }).length;
  const activeDays = inferActiveDaysFromTemas(temas);

  const missing = [];
  if (nSimulados < 1) missing.push("1 simulado válido");
  if (totalQuestions < 300) missing.push(`${300 - totalQuestions} questões registradas`);
  if (areasWithMastery < 3) missing.push(`${3 - areasWithMastery} áreas com maestria estimada`);
  if (activeDays < 14) missing.push(`${14 - activeDays} dias ativos`);

  return {
    nSimulados,
    totalQuestions,
    areasWithMastery,
    activeDays,
    hasMinimumForStrongNumber: missing.length === 0,
    missing,
    today: today || null,
  };
}

function weightedScore(parts, weights = DEFAULT_FORECAST_WEIGHTS) {
  const valid = Object.entries(weights)
    .map(([key, weight]) => ({ key, weight, value: parts[key] }))
    .filter((part) => Number.isFinite(part.value));

  if (!valid.length) return null;
  const weightSum = valid.reduce((sum, part) => sum + part.weight, 0);
  return Math.round(valid.reduce((sum, part) => sum + part.value * (part.weight / weightSum), 0));
}

export function calculateForecastBand({
  nSimulados = 0,
  confidence = FORECAST_CONFIDENCE.INSUFFICIENT,
  daysUntilExam = null,
  operationalRisk = 0,
  sample = {},
} = {}) {
  let width;
  if (nSimulados <= 0) width = 18;
  else if (nSimulados === 1) width = 14;
  else if (nSimulados === 2) width = 10;
  else if (nSimulados === 3) width = 7;
  else width = 5;

  if (daysUntilExam != null) {
    if (daysUntilExam > 180) width += 4;
    else if (daysUntilExam > 120) width += 2;
    else if (daysUntilExam < 14) width += 2;
  }

  if (operationalRisk >= 20) width += 4;
  else if (operationalRisk >= 10) width += 2;

  if (!sample?.hasMinimumForStrongNumber) width += 3;

  if (confidence === FORECAST_CONFIDENCE.HIGH) width -= 1;
  if (confidence === FORECAST_CONFIDENCE.INSUFFICIENT) width += 2;

  return Math.max(5, Math.min(24, Math.round(width)));
}

export function estimateAreaForecasts({
  studentMastery,
  daysUntilExam,
  operationalMode,
  plat = "res",
} = {}) {
  const areas = getAreaArray(studentMastery);
  if (!areas.length) return [];

  const timePotential = calculateTimePotential(daysUntilExam, operationalMode) || 0;
  const risk = calculateOperationalRisk(operationalMode);
  const riskFactor = Math.max(0.55, 1 - risk / 100);

  return areas
    .map((area) => {
      const current = normalize01or100(area?.pMastery ?? area?.mastery ?? area?.score);
      const currentPct = current == null ? null : Math.round(current * 100);
      const gapPct = currentPct == null ? null : Math.max(0, 100 - currentPct);
      const gain = gapPct == null ? 0 : Math.min(timePotential, Math.round(gapPct * 0.18 * riskFactor));
      const projected = currentPct == null ? null : Math.min(100, currentPct + gain);

      const riskLevel = projected == null
        ? "high"
        : projected < 60
          ? "high"
          : projected < 75
            ? "medium"
            : "low";

      const reasons = [];
      if (projected != null && projected < 60) reasons.push("baixa_maestria_projetada");
      if (area?.confidence === "low") reasons.push("baixa_confianca_da_estimativa");
      if (risk >= 10) reasons.push("risco_operacional_alto");

      return {
        area: area?.area || area?.name || area?.esp || (plat === "vest" ? "Área sem nome" : "Área sem nome"),
        currentMastery: currentPct,
        projectedMastery: projected,
        confidence: area?.confidence || "low",
        weight: Number.isFinite(Number(area?.weight)) ? Number(area.weight) : 1,
        gap: projected == null ? 100 : Math.max(0, 100 - projected),
        riskLevel,
        reasons,
      };
    })
    .sort((a, b) => (b.gap * b.weight) - (a.gap * a.weight));
}

function deriveForecastConfidence({ simAnchor, sample, operationalMode }) {
  const mode = operationalMode?.mode || operationalMode;
  if (mode === "dados_inconsistentes") return FORECAST_CONFIDENCE.INSUFFICIENT;
  if (!simAnchor?.n) return FORECAST_CONFIDENCE.INSUFFICIENT;
  if (simAnchor.n >= 3 && sample?.hasMinimumForStrongNumber) return FORECAST_CONFIDENCE.HIGH;
  if (simAnchor.n >= 2) return FORECAST_CONFIDENCE.MEDIUM;
  return FORECAST_CONFIDENCE.LOW;
}

function deriveDisplayMode(confidence, sample) {
  if (confidence === FORECAST_CONFIDENCE.INSUFFICIENT) return FORECAST_DISPLAY_MODE.COLLECTING;
  if (!sample?.hasMinimumForStrongNumber) return FORECAST_DISPLAY_MODE.PREVIEW;
  return FORECAST_DISPLAY_MODE.FORECAST;
}

function buildForecastRisks({ sample, simAnchor, operationalMode, daysUntilExam, projectedScore }) {
  const risks = [];
  const mode = operationalMode?.mode || operationalMode;

  if (!simAnchor?.n) {
    risks.push({ code: "no_simulado", severity: "warning", message: "Forecast sem simulado é apenas prévia fraca." });
  }
  if (!sample?.hasMinimumForStrongNumber) {
    risks.push({ code: "small_sample", severity: "warning", message: "Amostra ainda pequena para número forte." });
  }
  if (mode === "sobrecarga") {
    risks.push({ code: "overload", severity: "critical", message: "Sobrecarga aumenta incerteza e reduz ganho provável." });
  }
  if (mode === "recuperacao") {
    risks.push({ code: "recovery_mode", severity: "warning", message: "Há atraso/reaprendizagem; previsão deve ser conservadora." });
  }
  if (daysUntilExam != null && daysUntilExam < 30) {
    risks.push({ code: "exam_close", severity: "warning", message: "Prova próxima: ganho projetado é limitado." });
  }
  if (projectedScore != null && projectedScore < 60) {
    risks.push({ code: "low_projected_score", severity: "critical", message: "Prontidão projetada baixa." });
  }

  return risks;
}

function buildForecastWarnings({ plat, masteryIndex }) {
  const warnings = ["Forecast é proxy interno, não nota oficial."];
  if (plat === "res") {
    warnings.push("ENAMED/ENARE usa escala de proficiência; este modelo não estima TRI oficial.");
  }
  if (masteryIndex == null) {
    warnings.push("Student Model sem índice global utilizável; forecast ignora maestria latente.");
  }
  return Array.from(new Set(warnings));
}

export function estimateReadinessForecast({
  temas = [],
  temaStats = {},
  simulados = [],
  meta = {},
  plat = "res",
  today = null,
  operationalMode = null,
  calibration = null,
} = {}) {
  const todaySafe = isValidDateStr(today) ? today : defaultTodayStr();
  const targetDate = parseExamDate(meta);
  const rawDaysUntilExam = targetDate ? daysBetweenDates(todaySafe, targetDate) : null;
  const daysUntilExam = rawDaysUntilExam == null ? null : Math.max(0, rawDaysUntilExam);
  const simAnchor = calculateSimuladoAnchor(simulados);
  const context = { operationalMode, plat, today: todaySafe };
  const studentMastery = estimateStudentMastery({ temas, temaStats, context });
  const masteryIndex = getMasteryIndex(studentMastery);
  const coverageIndex = calculateCoverageIndex(temas);
  const adherenceIndex = calculateAdherenceIndex({ temas, meta });
  const calibrationIndex = getCalibrationIndex(calibration);
  const operationalRisk = calculateOperationalRisk(operationalMode);
  const timePotential = calculateTimePotential(daysUntilExam, operationalMode);
  const sample = calculateForecastSampleV2({ temas, simulados, studentMastery, today: todaySafe });

  const components = {
    simuladoAnchor: simAnchor.value,
    masteryIndex,
    coverageIndex,
    adherenceIndex,
    calibrationIndex,
    timePotential,
    operationalRisk,
  };
  const currentScore = weightedScore(components);
  const gap = currentScore != null ? Math.max(0, 100 - currentScore) : 0;
  const effectiveGain = currentScore != null && timePotential != null
    ? Math.min(timePotential, Math.round(gap * 0.20))
    : 0;
  const projectedScore = currentScore != null ? Math.min(100, currentScore + effectiveGain) : null;
  const confidence = deriveForecastConfidence({ simAnchor, sample, operationalMode });
  const displayMode = deriveDisplayMode(confidence, sample);
  const bandWidth = calculateForecastBand({
    nSimulados: simAnchor.n,
    confidence,
    daysUntilExam,
    operationalRisk,
    sample,
  });
  const band = projectedScore == null
    ? null
    : [Math.max(0, projectedScore - bandWidth), Math.min(100, projectedScore + bandWidth)];

  const risks = buildForecastRisks({ sample, simAnchor, operationalMode, daysUntilExam, projectedScore });
  const warnings = buildForecastWarnings({ plat, masteryIndex });

  return {
    version: "forecast_v1",
    targetDate,
    daysUntilExam,
    currentScore,
    projectedScore,
    band,
    bandWidth,
    confidence,
    isActionable: displayMode === FORECAST_DISPLAY_MODE.FORECAST,
    displayMode,
    sample,
    components,
    weightsUsed: { ...DEFAULT_FORECAST_WEIGHTS },
    areaForecasts: estimateAreaForecasts({ studentMastery, daysUntilExam, operationalMode, plat }),
    risks,
    assumptions: [
      "Ganho projetado é conservador e limitado pelo tempo até a prova.",
      "Simulados ancoram o forecast quando existem dados válidos.",
      "Forecast não altera agenda, FSRS ou fila de ações.",
    ],
    warnings,
    label: FORECAST_LABEL[displayMode],
    explanation: FORECAST_EXPLANATION[displayMode],
  };
}

/**
 * Calcula a banda de confiança baseada no número de simulados.
 * A banda estreita com mais simulados espaçados.
 */
function calcBanda(nSimulados) {
  if (nSimulados === 0) return 18;
  if (nSimulados === 1) return 14;
  if (nSimulados === 2) return 10;
  if (nSimulados === 3) return 7;
  return 5; // 4+ simulados = banda estável
}

/**
 * Previsão de desempenho v1.
 *
 * Pesos:
 *   - Simulados/provas antigas: 45% (âncora — preditor mais forte)
 *   - Acerto de questões por área ponderado por incidência: 25%
 *   - Cobertura de temas prioritários: 15%
 *   - Aderência a revisões (saldo de ritmo): 10%
 *   - Calibração/erro recorrente: 5%
 *
 * @param {Object} params
 * @param {Array}  params.simulados     - array de simulados registrados (com .pct)
 * @param {number|null} params.acertoQuestoes - acerto médio global de questões (0–100)
 * @param {number|null} params.acertoQuestoesIncidencia - acerto de questões ponderado por incidência ENAMED (0–100)
 * @param {number|null} params.cobertura - cobertura de temas prioritários (0–100)
 * @param {number|null} params.saldoRitmoNorm - saldo de ritmo normalizado (0–100)
 * @param {number|null} params.indiceDescuido - índice de erro por descuido (0–100; menor = melhor)
 * @returns {{ score: number|null, bandMin: number|null, bandMax: number|null, banda: number, nSimulados: number, confidence: string, amostra: string }}
 */
export function calcPrevisaoDesempenho({
  simulados = [],
  acertoQuestoes = null,
  acertoQuestoesIncidencia = null,
  cobertura = null,
  saldoRitmoNorm = null,
  indiceDescuido = null,
} = {}) {
  const nSims = simulados.length;

  // Âncora: média ponderada dos simulados recentes (últimos 4, peso decrescente)
  let acertoSimuladoAncorado = null;
  if (nSims > 0) {
    const recentes = simulados.slice(-4);
    // Últimos simulados têm peso ligeiramente maior
    const pesos = recentes.map((_, i) => 1 + i * 0.15);
    const totalPeso = pesos.reduce((s, p) => s + p, 0);
    acertoSimuladoAncorado = Math.round(
      recentes.reduce((sum, s, i) => sum + s.pct * pesos[i], 0) / totalPeso
    );
  }

  // Componente de questões: usa ponderada por incidência se disponível, senão acerto global
  const compQuestoes = acertoQuestoesIncidencia ?? acertoQuestoes;

  // Componente de calibração: descuido alto penaliza (inverte 0–100 → penalidade)
  const compCalibracao = indiceDescuido != null
    ? Math.max(0, 100 - indiceDescuido)
    : null;

  // Monte os termos com pesos
  const parts = [
    { v: acertoSimuladoAncorado, w: 0.45 },
    { v: compQuestoes, w: 0.25 },
    { v: cobertura, w: 0.15 },
    { v: saldoRitmoNorm, w: 0.10 },
    { v: compCalibracao, w: 0.05 },
  ].filter(p => p.v != null);

  if (parts.length === 0) return { score: null, bandMin: null, bandMax: null, banda: 18, nSimulados: nSims, confidence: "sem_dado", amostra: "" };

  // Normaliza pesos para não penalizar quando componentes faltam
  const wsum = parts.reduce((s, p) => s + p.w, 0);
  const score = Math.round(parts.reduce((s, p) => s + p.v * (p.w / wsum), 0));

  const banda = calcBanda(nSims);
  const bandMin = Math.max(0, score - banda);
  const bandMax = Math.min(100, score + banda);

  const confidence = nSims === 0 ? "sem_simulado"
    : nSims < 2 ? "baixa"
    : nSims < 3 ? "media"
    : "alta";

  const amostraParts = [];
  if (nSims > 0) amostraParts.push(`${nSims} simulado${nSims > 1 ? "s" : ""}`);
  if (compQuestoes != null) amostraParts.push("questões");
  if (cobertura != null) amostraParts.push("cobertura");
  if (saldoRitmoNorm != null) amostraParts.push("ritmo");
  const amostra = amostraParts.join(" · ");

  return { score, bandMin, bandMax, banda, nSimulados: nSims, confidence, amostra };
}

/**
 * Verifica se a amostra mínima para mostrar o "número forte" foi atingida.
 * Critérios conservadores baseados nas evidências:
 *   - Mínimo de questões: garante que acerto não é aleatório
 *   - Mínimo de áreas: garante cobertura
 *   - Mínimo de simulados: a âncora precisa de ao menos 1 registro
 *   - Mínimo de dias: garante que não é um snap de 1 sessão
 */
export function calcForecastSample({ totalQuestions, areasWithData, nSimulados, activeDays }) {
  const MIN_QUESTIONS = 300;
  const MIN_AREAS = 3;
  const MIN_SIMULADOS = 1;
  const MIN_DAYS = 14;

  const hasMinimum =
    totalQuestions >= MIN_QUESTIONS &&
    areasWithData >= MIN_AREAS &&
    nSimulados >= MIN_SIMULADOS &&
    activeDays >= MIN_DAYS;

  const missing = [];
  if (totalQuestions < MIN_QUESTIONS) missing.push(`${MIN_QUESTIONS - totalQuestions} questões`);
  if (areasWithData < MIN_AREAS) missing.push(`${MIN_AREAS - areasWithData} área${MIN_AREAS - areasWithData > 1 ? "s" : ""} com dados`);
  if (nSimulados < MIN_SIMULADOS) missing.push("1 simulado");
  if (activeDays < MIN_DAYS) missing.push(`${MIN_DAYS - activeDays} dias`);

  return { hasMinimum, missing, totalQuestions, areasWithData, nSimulados, activeDays };
}

export const CONFIDENCE_LABEL = {
  sem_dado: "Sem dado",
  sem_simulado: "Sem simulado — coletando",
  baixa: "Confiança baixa — adicione mais simulados",
  media: "Confiança moderada — 2+ simulados",
  alta: "Confiança alta — 3+ simulados",
};
