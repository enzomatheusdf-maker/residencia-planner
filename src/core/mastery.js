// src/core/mastery.js

import { ENAMED_HOTNESS, ENAMED_SUBTOPIC_ALIASES } from "../constants/enamedIncidencia";
import { ERROR_TYPE, classifyError, normalizeErrorType } from "./errorTaxonomy";

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

export const MASTERY_SAMPLE_STATUS = Object.freeze({
  NO_EVIDENCE: "sem_evidencia",
  INSUFFICIENT: "insuficiente",
  LOW: "baixa",
  MEDIUM: "media",
  HIGH: "alta",
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
const SUBTOPIC_PARAMS_VERSION = "mastery-bkt-pfa-subtopic-v1";
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

function normalizeSearchText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCanonicalArea(area) {
  const normalized = normalizeSearchText(area);
  if (!normalized) return null;
  return Object.keys(ENAMED_HOTNESS).find((key) => normalizeSearchText(key) === normalized) || null;
}

function buildSubtopicSearchIndex() {
  const rows = [];
  for (const [area, subtopics] of Object.entries(ENAMED_HOTNESS || {})) {
    for (const subtopic of Object.keys(subtopics || {})) {
      const tokens = new Set([normalizeSearchText(subtopic)]);
      const aliases = ENAMED_SUBTOPIC_ALIASES?.[area]?.[subtopic] || [];
      aliases.forEach((alias) => tokens.add(normalizeSearchText(alias)));
      rows.push({
        area,
        subtopic,
        tokens: Array.from(tokens).filter(Boolean),
      });
    }
  }
  return rows;
}

const SUBTOPIC_SEARCH_INDEX = buildSubtopicSearchIndex();

function canonicalizeSubtopic({ area, subtopic, topicName } = {}) {
  const canonicalArea = normalizeCanonicalArea(area);
  const explicitSubtopic = normalizeSearchText(subtopic);
  const topicText = normalizeSearchText(topicName);
  const haystack = [explicitSubtopic, topicText].filter(Boolean).join(" ");
  const candidates = canonicalArea
    ? SUBTOPIC_SEARCH_INDEX.filter((row) => row.area === canonicalArea)
    : SUBTOPIC_SEARCH_INDEX;

  for (const row of candidates) {
    if (explicitSubtopic && normalizeSearchText(row.subtopic) === explicitSubtopic) {
      return { area: row.area, subtopic: row.subtopic, match: "exact" };
    }
  }

  let best = null;
  for (const row of candidates) {
    for (const token of row.tokens) {
      if (!token) continue;
      const score = haystack && haystack === token ? 3 : haystack.includes(token) ? 2 : haystack && token.includes(haystack) ? 1 : 0;
      if (score > 0 && (!best || score > best.score || token.length > best.token.length)) {
        best = { ...row, score, token };
      }
    }
  }

  if (best) return { area: best.area, subtopic: best.subtopic, match: best.score >= 2 ? "alias" : "partial" };

  return {
    area: canonicalArea || area || "Geral",
    subtopic: subtopic || topicName || "Subtopico geral",
    match: "fallback",
  };
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

function normalizeObservationAccuracy(event = {}) {
  const raw = event?.performance?.acerto
    ?? event?.performance?.accuracy
    ?? event?.acerto
    ?? event?.accuracy
    ?? event?.score
    ?? null;
  const acerto = normalizeAccuracy(raw);
  if (acerto != null) return acerto;

  if (Object.prototype.hasOwnProperty.call(event, "acertou")) return event.acertou ? 1 : 0;
  if (Object.prototype.hasOwnProperty.call(event, "correct")) return event.correct ? 1 : 0;
  if (Object.prototype.hasOwnProperty.call(event, "isCorrect")) return event.isCorrect ? 1 : 0;
  return null;
}

function normalizeMasteryConfidenceValue(raw) {
  if (raw == null) return null;
  const numeric = safeNumber(raw, null);
  if (numeric != null) {
    if (numeric > 1) {
      if (numeric >= 4) return "alta";
      if (numeric <= 2) return "baixa";
      return "media";
    }
    if (numeric >= 0.75) return "alta";
    if (numeric <= 0.40) return "baixa";
    return "media";
  }

  const normalized = normalizeSearchText(raw);
  if (!normalized) return null;
  if (normalized.startsWith("alt") || normalized === "high") return "alta";
  if (normalized.startsWith("baix") || normalized === "low") return "baixa";
  if (normalized.startsWith("med") || normalized === "medium") return "media";
  return normalized;
}

function normalizeQuestionCount(event = {}) {
  return safeNumber(event?.performance?.questoes ?? event?.questoes ?? event?.questions, null);
}

function normalizeObservationStep(event = {}) {
  return normalizeStepKey(
    event?.stepKey
    ?? event?.step
    ?? event?.reviewStep
    ?? event?.fase
    ?? event?.phase
    ?? event?.key
  ) || "d0";
}

function extractErrorCandidates(event = {}) {
  const candidates = [];
  const direct = event?.tipoErro ?? event?.type ?? event?.tipo ?? event?.errorType ?? null;
  if (direct) candidates.push(direct);

  const arrays = [event?.erros, event?.errors, event?.motivosErro, event?.errorTypes];
  for (const list of arrays) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item === "string") {
        candidates.push(item);
      } else if (item && typeof item === "object") {
        candidates.push(item.tipoErro ?? item.type ?? item.tipo ?? item.errorType);
      }
    }
  }

  return candidates.map(normalizeErrorType).filter(Boolean);
}

function classifyObservationErrorTypes(event = {}, acerto = null) {
  const confidence = normalizeMasteryConfidenceValue(event?.confianca ?? event?.confidence ?? null);
  const explicit = extractErrorCandidates(event);
  const classified = classifyError({
    acertou: acerto != null ? acerto >= 0.50 : Boolean(event?.acertou ?? event?.correct ?? event?.isCorrect),
    confianca: confidence,
    tipoErro: explicit[0] || null,
    tempoExcedido: event?.tempoExcedido ?? event?.timeExceeded,
  });

  return Array.from(new Set([...explicit, classified].filter(Boolean)));
}

function observationSortValue(event = {}) {
  const timestamp = safeNumber(event.timestamp ?? event.createdAt ?? event.reviewedAt, null);
  if (timestamp != null) return timestamp;
  const date = event.date ?? event.data ?? event.createdAt ?? event.reviewedAt ?? null;
  const parsed = date ? Date.parse(date) : NaN;
  if (Number.isFinite(parsed)) return parsed;
  const step = normalizeObservationStep(event);
  const stepIndex = STEP_ORDER.indexOf(step);
  return stepIndex >= 0 ? stepIndex : 0;
}

function legacyTopicObservations(tema, stats = []) {
  const evidence = collectMasteryEvidence(tema, stats);
  return evidence.map((ev) => ({
    source: ev.source,
    topicId: tema?.id ?? null,
    topicName: getTopicName(tema),
    area: getTopicArea(tema),
    subtopic: getTopicSubtopic(tema),
    acerto: ev.acerto,
    step: ev.step,
    questoes: ev.questoes,
    date: ev.date,
    timestamp: ev.timestamp,
    S: ev.S,
    D: ev.D,
  }));
}

function expandMasteryInput(input) {
  if (Array.isArray(input)) {
    return input.flatMap((item) => {
      if (item?.rev && typeof item.rev === "object") return legacyTopicObservations(item);
      return item;
    });
  }

  if (!input || typeof input !== "object") return [];

  const explicitEvents = input.events || input.learningEvents || input.eventos;
  if (Array.isArray(explicitEvents)) return explicitEvents;

  const temas = Array.isArray(input.temas)
    ? input.temas
    : Array.isArray(input.res?.temas)
      ? input.res.temas
      : Array.isArray(input.vest?.temas)
        ? input.vest.temas
        : [];
  const temaStats = input.temaStats || input.res?.temaStats || input.vest?.temaStats || {};
  return temas.flatMap((tema) => legacyTopicObservations(tema, temaStats?.[tema?.id] || []));
}

function normalizeMasteryObservation(event = {}, index = 0) {
  const acerto = normalizeObservationAccuracy(event);
  if (acerto == null) return null;

  const topicName = event.topicName
    ?? event.temaNome
    ?? event.tema
    ?? event.nome
    ?? event.topic
    ?? event.name
    ?? null;
  const area = event.areaCanonica ?? event.area ?? event.esp ?? event.specialty ?? "Geral";
  const rawSubtopic = event.subtopic
    ?? event.subtopico
    ?? event.subarea
    ?? event.parentTopic
    ?? event.blockName
    ?? null;
  const canonical = canonicalizeSubtopic({ area, subtopic: rawSubtopic, topicName });
  const step = normalizeObservationStep(event);
  const errorTypes = classifyObservationErrorTypes(event, acerto);

  return {
    source: event.source || "event",
    originalIndex: index,
    topicId: event.topicId ?? event.temaId ?? event.id ?? null,
    topicName: topicName || canonical.subtopic,
    area: canonical.area,
    rawArea: area,
    subtopic: canonical.subtopic,
    rawSubtopic,
    canonicalMatch: canonical.match,
    acerto,
    step,
    questoes: normalizeQuestionCount(event),
    confidenceDeclared: normalizeMasteryConfidenceValue(event?.confianca ?? event?.confidence ?? null),
    errorTypes,
    timestamp: observationSortValue(event),
    spaced: step !== "d0",
    mature: step === "d21" || step === "manutencao",
    stepWeight: STEP_WEIGHT[step] || 1,
    evidenceWeight: evidenceWeightFromQuestions(normalizeQuestionCount(event)),
  };
}

function paramsForMasteryObservation(observation, baseParams = DEFAULT_MASTERY_PARAMS) {
  const isGuess = observation.errorTypes.includes(ERROR_TYPE.GUESS);
  const isSlip = observation.errorTypes.includes(ERROR_TYPE.CONFIDENCE_MISMATCH);
  const isCorrect = observation.acerto >= 0.50;
  const isIncorrect = observation.acerto < 0.50;

  let slip = clamp01(baseParams.slip, DEFAULT_MASTERY_PARAMS.slip);
  let guess = clamp01(baseParams.guess, DEFAULT_MASTERY_PARAMS.guess);
  let learn = clamp01(baseParams.learn, DEFAULT_MASTERY_PARAMS.learn);

  if (isSlip && isIncorrect) {
    slip = Math.max(slip, 0.34);
    learn *= 0.70;
  }

  if (isGuess && isCorrect) {
    guess = Math.max(guess, 0.62);
    learn *= 0.45;
  }

  if (!observation.spaced) learn *= 0.55;
  if (observation.spaced && observation.acerto >= 0.80 && !isGuess) learn *= 1.12;
  if (observation.acerto < 0.50) learn *= 0.50;

  return {
    prior: clamp01(baseParams.prior, DEFAULT_MASTERY_PARAMS.prior),
    learn: clamp01(learn, DEFAULT_MASTERY_PARAMS.learn),
    guess: clamp01(guess, DEFAULT_MASTERY_PARAMS.guess),
    slip: clamp01(slip, DEFAULT_MASTERY_PARAMS.slip),
  };
}

function summarizeSubtopicObservations(observations = []) {
  const counts = {
    evidenceCount: observations.length,
    spacedEvidenceCount: 0,
    matureEvidenceCount: 0,
    highQualityEvidenceCount: 0,
    questionCount: 0,
    successFactor: 0,
    failureFactor: 0,
    spacedSuccessFactor: 0,
    guessCount: 0,
    slipCount: 0,
  };

  for (const obs of observations) {
    if (obs.spaced) counts.spacedEvidenceCount += 1;
    if (obs.mature) counts.matureEvidenceCount += 1;
    if (obs.spaced && obs.acerto >= 0.80) counts.highQualityEvidenceCount += 1;
    counts.questionCount += obs.questoes != null ? Math.max(0, obs.questoes) : 1;
    counts.successFactor += obs.acerto;
    counts.failureFactor += 1 - obs.acerto;
    if (obs.spaced) counts.spacedSuccessFactor += obs.acerto;
    if (obs.errorTypes.includes(ERROR_TYPE.GUESS)) counts.guessCount += 1;
    if (obs.errorTypes.includes(ERROR_TYPE.CONFIDENCE_MISMATCH)) counts.slipCount += 1;
  }

  return counts;
}

function deriveSubtopicSampleQuality(counts) {
  const warnings = [];
  if (counts.evidenceCount === 0) warnings.push("no_evidence");
  if (counts.evidenceCount === 1) warnings.push("single_evidence");
  if (counts.evidenceCount > 0 && counts.spacedEvidenceCount === 0) warnings.push("no_spaced_evidence");
  if (counts.evidenceCount > 0 && counts.spacedEvidenceCount === 0) warnings.push("d0_only");
  if (counts.evidenceCount > 0 && counts.evidenceCount < DEFAULT_MASTERY_PARAMS.minEvidenceForMedium) warnings.push("low_sample");
  if (counts.matureEvidenceCount === 0) warnings.push("no_mature_evidence");
  if (counts.guessCount > 0) warnings.push("guess_in_sample");
  if (counts.slipCount > 0) warnings.push("confidence_mismatch_in_sample");

  let status = MASTERY_SAMPLE_STATUS.NO_EVIDENCE;
  if (counts.evidenceCount > 0 && counts.spacedEvidenceCount === 0) {
    status = MASTERY_SAMPLE_STATUS.INSUFFICIENT;
  } else if (counts.evidenceCount > 0 && (counts.evidenceCount < 3 || counts.spacedEvidenceCount < 2)) {
    status = MASTERY_SAMPLE_STATUS.LOW;
  } else if (counts.matureEvidenceCount >= 1 && counts.spacedEvidenceCount >= 3) {
    status = MASTERY_SAMPLE_STATUS.HIGH;
  } else if (counts.evidenceCount > 0) {
    status = MASTERY_SAMPLE_STATUS.MEDIUM;
  }

  let score = 0;
  if (counts.evidenceCount > 0) {
    score = (
      Math.min(counts.evidenceCount / 5, 1) * 0.22
      + Math.min(counts.spacedEvidenceCount / 3, 1) * 0.34
      + Math.min(counts.matureEvidenceCount, 1) * 0.18
      + Math.min(counts.highQualityEvidenceCount / 2, 1) * 0.16
      + Math.min(counts.questionCount / 50, 1) * 0.10
    );
    if (counts.spacedEvidenceCount === 0) score = Math.min(score, 0.25);
    if (status === MASTERY_SAMPLE_STATUS.LOW) score = Math.min(score, 0.55);
  }

  return {
    status,
    score: clamp01(score),
    uncertainty: clamp01(1 - score),
    evidenceCount: counts.evidenceCount,
    spacedEvidenceCount: counts.spacedEvidenceCount,
    matureEvidenceCount: counts.matureEvidenceCount,
    highQualityEvidenceCount: counts.highQualityEvidenceCount,
    questionCount: counts.questionCount,
    performanceFactors: {
      successes: counts.successFactor,
      failures: counts.failureFactor,
      spacedSuccesses: counts.spacedSuccessFactor,
      guesses: counts.guessCount,
      slips: counts.slipCount,
    },
    warnings: Array.from(new Set(warnings)),
  };
}

function confidenceFromSampleQuality(sampleQuality) {
  if (sampleQuality.status === MASTERY_SAMPLE_STATUS.NO_EVIDENCE) return MASTERY_CONFIDENCE.NONE;
  if (sampleQuality.status === MASTERY_SAMPLE_STATUS.INSUFFICIENT) return MASTERY_CONFIDENCE.LOW;
  if (sampleQuality.status === MASTERY_SAMPLE_STATUS.LOW) return MASTERY_CONFIDENCE.LOW;
  if (sampleQuality.status === MASTERY_SAMPLE_STATUS.HIGH) return MASTERY_CONFIDENCE.HIGH;
  return MASTERY_CONFIDENCE.MEDIUM;
}

function applySubtopicEvidenceGate(pKnown, sampleQuality, params) {
  if (sampleQuality.evidenceCount === 0) return clamp01(params.prior, DEFAULT_MASTERY_PARAMS.prior);
  if (sampleQuality.spacedEvidenceCount === 0) return Math.min(pKnown, 0.55);
  if (sampleQuality.evidenceCount < DEFAULT_MASTERY_PARAMS.minEvidenceForMedium) return Math.min(pKnown, 0.74);
  return pKnown;
}

function averageEffectiveParams(paramsList, baseParams) {
  if (!paramsList.length) {
    return {
      slip: clamp01(baseParams.slip, DEFAULT_MASTERY_PARAMS.slip),
      guess: clamp01(baseParams.guess, DEFAULT_MASTERY_PARAMS.guess),
      learn: clamp01(baseParams.learn, DEFAULT_MASTERY_PARAMS.learn),
      prior: clamp01(baseParams.prior, DEFAULT_MASTERY_PARAMS.prior),
    };
  }

  const sums = paramsList.reduce((acc, params) => ({
    slip: acc.slip + params.slip,
    guess: acc.guess + params.guess,
    learn: acc.learn + params.learn,
    prior: acc.prior + params.prior,
  }), { slip: 0, guess: 0, learn: 0, prior: 0 });
  const n = paramsList.length;
  return {
    slip: sums.slip / n,
    guess: sums.guess / n,
    learn: sums.learn / n,
    prior: sums.prior / n,
  };
}

export function estimateMastery(events = [], options = {}) {
  const unit = options?.unit || "subtopic";
  const baseParams = options?.params || DEFAULT_MASTERY_PARAMS;
  const observations = expandMasteryInput(events)
    .map((event, index) => normalizeMasteryObservation(event, index))
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp || a.originalIndex - b.originalIndex);

  const grouped = {};
  for (const observation of observations) {
    const key = unit === "subtopic" ? observation.subtopic : observation.subtopic;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(observation);
  }

  const result = {};
  for (const [subtopic, rows] of Object.entries(grouped)) {
    let pKnown = clamp01(baseParams.prior, DEFAULT_MASTERY_PARAMS.prior);
    const effectiveParams = [];

    for (const row of rows) {
      const params = paramsForMasteryObservation(row, baseParams);
      effectiveParams.push(params);
      pKnown = updateBayesianMastery(pKnown, {
        acerto: row.acerto,
        stepWeight: row.stepWeight,
        evidenceWeight: row.evidenceWeight,
      }, params);
    }

    const counts = summarizeSubtopicObservations(rows);
    const sampleQuality = deriveSubtopicSampleQuality(counts);
    pKnown = applySubtopicEvidenceGate(pKnown, sampleQuality, baseParams);
    const params = averageEffectiveParams(effectiveParams, baseParams);
    const latest = rows[rows.length - 1] || null;

    result[subtopic] = {
      subtopic,
      area: latest?.area || "Geral",
      pKnown,
      pMastery: pKnown,
      confidence: confidenceFromSampleQuality(sampleQuality),
      sampleQuality,
      params,
      evidenceCount: counts.evidenceCount,
      spacedEvidenceCount: counts.spacedEvidenceCount,
      latestStep: latest?.step ?? null,
      latestAccuracy: latest?.acerto ?? null,
      canonicalMatch: latest?.canonicalMatch ?? null,
      warnings: sampleQuality.warnings,
      raw: {
        unit,
        paramsVersion: SUBTOPIC_PARAMS_VERSION,
      },
    };
  }

  return result;
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
