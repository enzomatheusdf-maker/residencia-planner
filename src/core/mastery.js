// src/core/mastery.js

export const MASTERY_LEVELS = Object.freeze({
  LEARNING: "aprendendo",
  CONSOLIDATING: "consolidando",
  MASTERED: "dominado",
});

export const MASTERY_CONFIDENCE = Object.freeze({
  NONE: "none",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
});

export const DEFAULT_MASTERY_PARAMS = Object.freeze({
  prior: 0.30,
  learn: 0.08,
  guess: 0.25,
  slip: 0.12,
  minEvidenceForMedium: 3,
  minEvidenceForHigh: 5,
  masteredThreshold: 0.85,
  consolidatingThreshold: 0.65,
});

const PARAMS_VERSION = "mastery-bkt-lite-v1";
const STEP_ORDER = ["d0", "d1", "d4", "d7", "d21", "manutencao"];
const STEP_WEIGHT = Object.freeze({
  d0: 0.45,
  d1: 0.75,
  d4: 1.00,
  d7: 1.20,
  d21: 1.55,
  manutencao: 1.70,
});

const CONFIDENCE_RANK = Object.freeze({
  [MASTERY_CONFIDENCE.NONE]: 0,
  [MASTERY_CONFIDENCE.LOW]: 1,
  [MASTERY_CONFIDENCE.MEDIUM]: 2,
  [MASTERY_CONFIDENCE.HIGH]: 3,
});

function clamp01(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

function safeNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeAccuracy(value) {
  const n = safeNumber(value, null);
  if (n == null) return null;
  if (n > 1 && n <= 100) return clamp01(n / 100, null);
  return clamp01(n, null);
}

function normalizeStepKey(step) {
  if (step == null) return null;
  const raw = String(step)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!raw) return null;
  if (raw === "maintenance" || raw === "maint" || raw === "manutencao") return "manutencao";
  if (raw === "d0" || raw === "d1" || raw === "d4" || raw === "d7" || raw === "d21") return raw;
  return null;
}

function getTopicName(tema) {
  return tema?.nome || tema?.titulo || "Tema";
}

function getTopicArea(tema) {
  return tema?.esp || tema?.area || "Geral";
}

function getTopicSubtopic(tema) {
  return tema?.subtopico || tema?.subarea || tema?.nome || tema?.titulo || String(tema?.id ?? "Tema");
}

function confidenceDowngrade(confidence) {
  if (confidence === MASTERY_CONFIDENCE.HIGH) return MASTERY_CONFIDENCE.MEDIUM;
  if (confidence === MASTERY_CONFIDENCE.MEDIUM) return MASTERY_CONFIDENCE.LOW;
  if (confidence === MASTERY_CONFIDENCE.LOW) return MASTERY_CONFIDENCE.NONE;
  return MASTERY_CONFIDENCE.NONE;
}

function evidenceWeightFromQuestions(questoes) {
  const q = safeNumber(questoes, null);
  if (q == null) return 1;
  if (q >= 20) return 1.15;
  if (q >= 1 && q <= 9) return 0.90;
  return 1;
}

function makeEvidence({ source, step, entry }) {
  const normalizedStep = normalizeStepKey(step ?? entry?.stepKey ?? entry?.step);
  const acerto = normalizeAccuracy(entry?.acerto ?? entry?.accuracy);
  if (!normalizedStep || acerto == null) return null;

  const questoes = safeNumber(entry?.questoes ?? entry?.questions, null);
  const spaced = normalizedStep !== "d0";
  const mature = normalizedStep === "d21" || normalizedStep === "manutencao";
  const highQuality = spaced && acerto >= 0.80;

  return {
    source,
    step: normalizedStep,
    acerto,
    S: safeNumber(entry?.S ?? entry?.stability, null),
    D: safeNumber(entry?.D ?? entry?.difficulty, null),
    questoes,
    date: entry?.date || entry?.data || null,
    timestamp: safeNumber(entry?.timestamp, null),
    stepWeight: STEP_WEIGHT[normalizedStep] || 1,
    evidenceWeight: evidenceWeightFromQuestions(questoes),
    mature,
    spaced,
    highQuality,
  };
}

function summarizeEvidence(evidence = []) {
  const counts = {
    evidenceCount: evidence.length,
    spacedEvidenceCount: 0,
    matureEvidenceCount: 0,
    highQualityEvidenceCount: 0,
  };

  for (const ev of evidence) {
    if (ev.spaced) counts.spacedEvidenceCount += 1;
    if (ev.mature) counts.matureEvidenceCount += 1;
    if (ev.highQuality) counts.highQualityEvidenceCount += 1;
  }

  return counts;
}

function latestEvidence(evidence = []) {
  return evidence.length > 0 ? evidence[evidence.length - 1] : null;
}

function deriveMasteryConfidence(counts, latest, context = {}) {
  let confidence = MASTERY_CONFIDENCE.NONE;
  if (counts.evidenceCount === 0) {
    confidence = MASTERY_CONFIDENCE.NONE;
  } else if (counts.evidenceCount < DEFAULT_MASTERY_PARAMS.minEvidenceForMedium) {
    confidence = MASTERY_CONFIDENCE.LOW;
  } else if (counts.matureEvidenceCount >= 1 && counts.spacedEvidenceCount >= 2) {
    confidence = MASTERY_CONFIDENCE.HIGH;
  } else {
    confidence = MASTERY_CONFIDENCE.MEDIUM;
  }

  if (context?.operationalMode?.mode === "sobrecarga" && latest) {
    return confidenceDowngrade(confidence);
  }

  return confidence;
}

function deriveMemoryStrength(latest) {
  if (!latest || latest.S == null) return null;
  return clamp01(latest.S / 21, null);
}

function deriveDifficulty(latest) {
  if (!latest || latest.D == null) return null;
  return clamp01(latest.D, null);
}

function hasRecentLapse(latest) {
  return !!latest && latest.spaced && latest.acerto < 0.60;
}

function deriveMasteryLevel({ pMastery, confidence, counts, latest, params }) {
  const confidenceRank = CONFIDENCE_RANK[confidence] || 0;
  const recentLapse = hasRecentLapse(latest);

  if (
    !recentLapse &&
    pMastery >= params.masteredThreshold &&
    confidenceRank >= CONFIDENCE_RANK[MASTERY_CONFIDENCE.MEDIUM] &&
    counts.matureEvidenceCount >= 1 &&
    counts.highQualityEvidenceCount >= 2 &&
    counts.spacedEvidenceCount >= 2
  ) {
    return MASTERY_LEVELS.MASTERED;
  }

  if (
    pMastery >= params.consolidatingThreshold &&
    counts.evidenceCount >= 2 &&
    counts.spacedEvidenceCount >= 1
  ) {
    return MASTERY_LEVELS.CONSOLIDATING;
  }

  return MASTERY_LEVELS.LEARNING;
}

function buildReasonsAndWarnings({ evidence, counts, latest, confidence, context }) {
  const reasons = [];
  const warnings = [];

  if (counts.evidenceCount === 0) warnings.push("no_evidence");
  if (counts.evidenceCount === 1) warnings.push("single_evidence");
  if (counts.evidenceCount > 0 && counts.spacedEvidenceCount === 0) warnings.push("d0_only");
  if (counts.matureEvidenceCount === 0) warnings.push("no_mature_evidence");
  if (counts.evidenceCount > 0 && counts.evidenceCount < DEFAULT_MASTERY_PARAMS.minEvidenceForMedium) warnings.push("low_sample");
  if (confidence === MASTERY_CONFIDENCE.LOW || confidence === MASTERY_CONFIDENCE.NONE) warnings.push("low_confidence");

  if (counts.highQualityEvidenceCount >= 2) reasons.push("high_spaced_accuracy");
  if (counts.matureEvidenceCount >= 1 && latest?.acerto >= 0.80) reasons.push("mature_success");
  if (hasRecentLapse(latest)) reasons.push("recent_lapse");
  if (context?.operationalMode?.mode === "sobrecarga") {
    warnings.push("operational_overload_may_reduce_reliability");
  }

  return { reasons: Array.from(new Set(reasons)), warnings: Array.from(new Set(warnings)) };
}

function confidenceForArea(topicsWithEvidence, coverage) {
  if (topicsWithEvidence === 0) return MASTERY_CONFIDENCE.NONE;
  if (topicsWithEvidence < 3 || coverage < 0.40) return MASTERY_CONFIDENCE.LOW;
  if (topicsWithEvidence < 5) return MASTERY_CONFIDENCE.MEDIUM;
  return MASTERY_CONFIDENCE.HIGH;
}

function areaLevel(pMastery, coverage, confidence) {
  const confidenceRank = CONFIDENCE_RANK[confidence] || 0;
  if (pMastery >= 0.85 && coverage >= 0.60 && confidenceRank >= CONFIDENCE_RANK[MASTERY_CONFIDENCE.MEDIUM]) {
    return MASTERY_LEVELS.MASTERED;
  }
  if (pMastery >= 0.65 && coverage >= 0.40) return MASTERY_LEVELS.CONSOLIDATING;
  return MASTERY_LEVELS.LEARNING;
}

function suggestedFocusFor(estimate) {
  if (estimate.pMastery < 0.45) return "reaprendizagem";
  if (estimate.pMastery < 0.65) return "revisao_ativa";
  if (estimate.pMastery < 0.80 || estimate.confidence === MASTERY_CONFIDENCE.LOW) return "questoes";
  return "manter";
}

export function updateBayesianMastery(prior, observation = {}, params = DEFAULT_MASTERY_PARAMS) {
  const p = clamp01(prior, params.prior);
  const a = clamp01(observation?.acerto, null);
  if (a == null) return p;

  const guess = clamp01(params.guess, 0.25);
  const slip = clamp01(params.slip, 0.12);
  const learn = clamp01(params.learn, 0.08);

  const denomCorrect = (p * (1 - slip)) + ((1 - p) * guess);
  const denomIncorrect = (p * slip) + ((1 - p) * (1 - guess));
  if (denomCorrect <= 0 || denomIncorrect <= 0) return p;

  const posteriorCorrect = (p * (1 - slip)) / denomCorrect;
  const posteriorIncorrect = (p * slip) / denomIncorrect;
  const posterior = (a * posteriorCorrect) + ((1 - a) * posteriorIncorrect);

  const stepWeight = Math.max(0.1, safeNumber(observation?.stepWeight, 1));
  const evidenceWeight = Math.max(0.1, safeNumber(observation?.evidenceWeight, 1));
  const effectiveLearn = clamp01(learn * stepWeight * evidenceWeight, learn);

  return clamp01(posterior + ((1 - posterior) * effectiveLearn));
}

export function collectMasteryEvidence(tema, stats = []) {
  const evidence = [];

  if (tema?.rev && typeof tema.rev === "object") {
    for (const [key, entry] of Object.entries(tema.rev)) {
      if (!entry || entry.done !== true) continue;
      const ev = makeEvidence({ source: "tema.rev", step: key, entry });
      if (ev) evidence.push(ev);
    }
  }

  const statsList = Array.isArray(stats) ? stats : [];
  for (const stat of statsList) {
    if (!stat || typeof stat !== "object") continue;
    const step = stat.stepKey ?? stat.key ?? stat.step;
    const ev = makeEvidence({ source: "stats", step, entry: stat });
    if (ev) evidence.push(ev);
  }

  return evidence.sort((a, b) => {
    const stepDiff = STEP_ORDER.indexOf(a.step) - STEP_ORDER.indexOf(b.step);
    if (stepDiff !== 0) return stepDiff;
    const aTime = a.timestamp ?? 0;
    const bTime = b.timestamp ?? 0;
    return aTime - bTime;
  });
}

export function estimateTopicMastery(tema, stats = [], context = {}) {
  const params = context?.params || DEFAULT_MASTERY_PARAMS;
  const evidence = collectMasteryEvidence(tema, stats);
  let pMastery = clamp01(params.prior, DEFAULT_MASTERY_PARAMS.prior);

  for (const ev of evidence) {
    pMastery = updateBayesianMastery(pMastery, {
      acerto: ev.acerto,
      stepWeight: ev.stepWeight,
      evidenceWeight: ev.evidenceWeight,
    }, params);
  }

  const counts = summarizeEvidence(evidence);
  const latest = latestEvidence(evidence);
  const confidence = deriveMasteryConfidence(counts, latest, context);
  const level = deriveMasteryLevel({ pMastery, confidence, counts, latest, params });
  const { reasons, warnings } = buildReasonsAndWarnings({ evidence, counts, latest, confidence, context });

  return {
    topicId: tema?.id ?? null,
    topicName: getTopicName(tema),
    area: getTopicArea(tema),
    subtopic: getTopicSubtopic(tema),
    pMastery,
    level,
    confidence,
    evidenceCount: counts.evidenceCount,
    spacedEvidenceCount: counts.spacedEvidenceCount,
    matureEvidenceCount: counts.matureEvidenceCount,
    highQualityEvidenceCount: counts.highQualityEvidenceCount,
    latestStep: latest?.step ?? null,
    latestAccuracy: latest?.acerto ?? null,
    latestStability: latest?.S ?? null,
    memoryStrength: deriveMemoryStrength(latest),
    difficulty: deriveDifficulty(latest),
    reasons,
    warnings,
    raw: {
      prior: clamp01(params.prior, DEFAULT_MASTERY_PARAMS.prior),
      paramsVersion: PARAMS_VERSION,
    },
  };
}

export function estimateAreaMastery(temas = [], temaStats = {}, context = {}) {
  const list = Array.isArray(temas) ? temas : [];
  const grouped = {};

  list.forEach((tema, index) => {
    const area = getTopicArea(tema);
    const stats = temaStats?.[tema?.id] || [];
    const estimate = { ...estimateTopicMastery(tema, stats, context), originalIndex: index };
    if (!grouped[area]) grouped[area] = [];
    grouped[area].push(estimate);
  });

  const result = {};
  for (const [area, estimates] of Object.entries(grouped)) {
    const withEvidence = estimates.filter((item) => item.evidenceCount > 0);
    const topicsWithEvidence = withEvidence.length;
    const totalTopics = estimates.length;
    const coverage = totalTopics > 0 ? topicsWithEvidence / totalTopics : 0;
    const pMastery = topicsWithEvidence > 0
      ? withEvidence.reduce((sum, item) => sum + item.pMastery, 0) / topicsWithEvidence
      : 0;
    const confidence = confidenceForArea(topicsWithEvidence, coverage);
    const masteredTopics = estimates.filter((item) => item.level === MASTERY_LEVELS.MASTERED).length;
    const consolidatingTopics = estimates.filter((item) => item.level === MASTERY_LEVELS.CONSOLIDATING).length;
    const learningTopics = estimates.filter((item) => item.level === MASTERY_LEVELS.LEARNING).length;
    const weakTopics = estimates
      .slice()
      .sort((a, b) => a.pMastery - b.pMastery || a.originalIndex - b.originalIndex)
      .slice(0, 5);
    const reasonCounts = {};
    estimates.forEach((item) => {
      [...item.reasons, ...item.warnings].forEach((reason) => {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
    });

    result[area] = {
      area,
      pMastery,
      level: areaLevel(pMastery, coverage, confidence),
      confidence,
      totalTopics,
      topicsWithEvidence,
      masteredTopics,
      consolidatingTopics,
      learningTopics,
      coverage,
      weakTopics,
      topRiskReasons: Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 5)
        .map(([reason]) => reason),
    };
  }

  return result;
}

export function estimateStudentMastery({ temas = [], temaStats = {}, context = {} } = {}) {
  const list = Array.isArray(temas) ? temas : [];
  const byTopic = list.map((tema) => estimateTopicMastery(tema, temaStats?.[tema?.id] || [], context));
  const byArea = estimateAreaMastery(list, temaStats, context);
  const topicsWithEvidence = byTopic.filter((item) => item.evidenceCount > 0).length;
  const totalTopics = byTopic.length;
  const coverage = totalTopics > 0 ? topicsWithEvidence / totalTopics : 0;
  const pMastery = topicsWithEvidence > 0
    ? byTopic.filter((item) => item.evidenceCount > 0).reduce((sum, item) => sum + item.pMastery, 0) / topicsWithEvidence
    : 0;
  const confidence = confidenceForArea(topicsWithEvidence, coverage);
  const masteredTopics = byTopic.filter((item) => item.level === MASTERY_LEVELS.MASTERED).length;

  return {
    global: {
      pMastery,
      level: areaLevel(pMastery, coverage, confidence),
      confidence,
      totalTopics,
      topicsWithEvidence,
      masteredTopics,
      coverage,
    },
    byArea,
    byTopic,
    weakTargets: getWeakMasteryTargets({ temas: list, temaStats, context }),
    paramsVersion: PARAMS_VERSION,
  };
}

export function getWeakMasteryTargets({ temas = [], temaStats = {}, context = {}, limit = 5 } = {}) {
  const list = Array.isArray(temas) ? temas : [];
  return list
    .map((tema, index) => {
      const estimate = estimateTopicMastery(tema, temaStats?.[tema?.id] || [], context);
      return { ...estimate, originalIndex: index };
    })
    .sort((a, b) => {
      const pDiff = a.pMastery - b.pMastery;
      if (pDiff !== 0) return pDiff;
      const confDiff = (CONFIDENCE_RANK[a.confidence] || 0) - (CONFIDENCE_RANK[b.confidence] || 0);
      if (confDiff !== 0) return confDiff;
      const lapseDiff = Number(b.reasons.includes("recent_lapse")) - Number(a.reasons.includes("recent_lapse"));
      if (lapseDiff !== 0) return lapseDiff;
      return a.originalIndex - b.originalIndex;
    })
    .slice(0, Math.max(0, limit))
    .map((estimate) => ({
      topicId: estimate.topicId,
      topicName: estimate.topicName,
      area: estimate.area,
      subtopic: estimate.subtopic,
      pMastery: estimate.pMastery,
      level: estimate.level,
      confidence: estimate.confidence,
      reasons: estimate.reasons,
      suggestedFocus: suggestedFocusFor(estimate),
    }));
}

export function getEstadoDominio(tema, stats = []) {
  return estimateTopicMastery(tema, stats).level;
}

export function getProntidaoGlobal(temas, temaStats = {}) {
  const list = Array.isArray(temas) ? temas : [];
  if (list.length === 0) {
    return { index: 0, sugerirModoProva: false };
  }

  let totalCompletedReviews = 0;
  let sumAcerto = 0;
  for (const tema of list) {
    if (!tema?.rev) continue;
    for (const review of Object.values(tema.rev)) {
      const acerto = normalizeAccuracy(review?.acerto);
      if (review?.done && acerto != null) {
        totalCompletedReviews += 1;
        sumAcerto += acerto;
      }
    }
  }

  const acertoMedioGeral = totalCompletedReviews > 0 ? sumAcerto / totalCompletedReviews : 0;
  const byArea = estimateAreaMastery(list, temaStats);
  const areas = Object.values(byArea);
  if (areas.length === 0) {
    return { index: 0, sugerirModoProva: false };
  }

  const areasProntas = areas.filter((area) =>
    area.level === MASTERY_LEVELS.CONSOLIDATING || area.level === MASTERY_LEVELS.MASTERED
  ).length;
  const pctAreasProntas = areasProntas / areas.length;
  const sugerirModoProva = acertoMedioGeral >= 0.80 && pctAreasProntas >= 0.70;
  const index = (acertoMedioGeral + pctAreasProntas) / 2;

  return {
    index,
    acertoMedioGeral,
    pctAreasProntas,
    sugerirModoProva,
  };
}
