// src/core/calibration.js
// Metacognitive calibration: compara previsao previa do aluno com desempenho real.
// P1.2: modulo puro, sem React, Zustand ou persistencia.

export const CALIBRATION_STATUS = Object.freeze({
  COLLECTING: "coletando",
  LOW_CONFIDENCE: "baixa_confianca",
  OK: "ok",
});

export const CALIBRATION_TREND = Object.freeze({
  OVERCONFIDENT: "excesso_confianca",
  UNDERCONFIDENT: "subestima",
  CALIBRATED: "calibrado",
});

export const CALIBRATION_SEVERITY = Object.freeze({
  OK: "ok",
  WARNING: "warning",
  CRITICAL: "critical",
});

export const DEFAULT_CALIBRATION_OPTIONS = Object.freeze({
  minPreview: 5,
  minRequired: 10,
  calibratedBiasTolerance: 0.10,
  warningMae: 0.25,
  criticalMae: 0.35,
  returnSamples: false,
});

export function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n > 1 && n <= 100) return Math.max(0, Math.min(1, n / 100));
  return Math.max(0, Math.min(1, n));
}

export function normalizeCalibrationSample(raw = {}, index = 0) {
  if (!raw || typeof raw !== "object") return null;

  const prediction = clamp01(raw.previsao ?? raw.prediction ?? raw.expected ?? raw.confidencePrediction);
  const accuracy = clamp01(raw.acerto ?? raw.accuracy ?? raw.percentual ?? raw.result);

  if (prediction == null || accuracy == null) return null;

  const weightRaw = Number(raw.questoes ?? raw.questions ?? raw.weight ?? 1);
  const weight = Number.isFinite(weightRaw) && weightRaw > 0 ? Math.min(100, weightRaw) : 1;
  const error = prediction - accuracy;

  return {
    id: raw.id || `${raw.temaId || "sample"}_${raw.stepKey || "step"}_${raw.completedAt || raw.reviewedAt || index}`,
    prediction,
    accuracy,
    error,
    absError: Math.abs(error),
    squaredError: error ** 2,
    weight,
    temaId: raw.temaId ?? raw.topicId ?? null,
    temaNome: raw.temaNome ?? raw.topicName ?? raw.nome ?? null,
    esp: raw.esp ?? raw.area ?? raw.materia ?? null,
    stepKey: raw.stepKey ?? raw.step ?? null,
    date: raw.completedAt ?? raw.reviewedAt ?? raw.date ?? null,
  };
}

export function getCalibrationStatus(n, options = {}) {
  const opts = { ...DEFAULT_CALIBRATION_OPTIONS, ...options };
  if (n < opts.minPreview) return CALIBRATION_STATUS.COLLECTING;
  if (n < opts.minRequired) return CALIBRATION_STATUS.LOW_CONFIDENCE;
  return CALIBRATION_STATUS.OK;
}

export function classifyCalibrationTrend(bias, options = {}) {
  const opts = { ...DEFAULT_CALIBRATION_OPTIONS, ...options };
  if (bias > opts.calibratedBiasTolerance) return CALIBRATION_TREND.OVERCONFIDENT;
  if (bias < -opts.calibratedBiasTolerance) return CALIBRATION_TREND.UNDERCONFIDENT;
  return CALIBRATION_TREND.CALIBRATED;
}

export function classifyCalibrationSeverity(meanAbsError, options = {}) {
  const opts = { ...DEFAULT_CALIBRATION_OPTIONS, ...options };
  if (meanAbsError >= opts.criticalMae) return CALIBRATION_SEVERITY.CRITICAL;
  if (meanAbsError >= opts.warningMae) return CALIBRATION_SEVERITY.WARNING;
  return CALIBRATION_SEVERITY.OK;
}

function weightedMean(samples, selector) {
  const totalWeight = samples.reduce((sum, sample) => sum + sample.weight, 0);
  if (totalWeight <= 0) return null;
  return samples.reduce((sum, sample) => sum + selector(sample) * sample.weight, 0) / totalWeight;
}

function pct(value) {
  if (!Number.isFinite(Number(value))) return null;
  return Math.round(Number(value) * 100);
}

export function buildCalibrationBuckets(samples = []) {
  const buckets = [
    { id: "0-20", min: 0, max: 0.2, label: "0-20%" },
    { id: "20-40", min: 0.2, max: 0.4, label: "20-40%" },
    { id: "40-60", min: 0.4, max: 0.6, label: "40-60%" },
    { id: "60-80", min: 0.6, max: 0.8, label: "60-80%" },
    { id: "80-100", min: 0.8, max: 1.000001, label: "80-100%" },
  ];

  return buckets.map((bucket) => {
    const items = samples.filter((sample) => sample.prediction >= bucket.min && sample.prediction < bucket.max);
    const meanPrediction = items.length ? weightedMean(items, (sample) => sample.prediction) : null;
    const meanAccuracy = items.length ? weightedMean(items, (sample) => sample.accuracy) : null;
    const gap = meanPrediction != null && meanAccuracy != null ? meanPrediction - meanAccuracy : null;

    return {
      id: bucket.id,
      label: bucket.label,
      n: items.length,
      meanPredictionPct: pct(meanPrediction),
      meanAccuracyPct: pct(meanAccuracy),
      gapPct: pct(gap),
      tendency: gap == null ? null : classifyCalibrationTrend(gap),
    };
  });
}

export function getCalibrationAction(result = {}) {
  if (!result || result.status === CALIBRATION_STATUS.COLLECTING) {
    const remaining = Math.max(0, (result.minPreview || DEFAULT_CALIBRATION_OPTIONS.minPreview) - (result.n || 0));
    return `Registre previsao antes das revisoes. Faltam ${remaining} ${remaining === 1 ? "sessao" : "sessoes"} para o primeiro sinal.`;
  }

  if (result.status === CALIBRATION_STATUS.LOW_CONFIDENCE) {
    const remaining = Math.max(0, (result.minRequired || DEFAULT_CALIBRATION_OPTIONS.minRequired) - (result.n || 0));
    return `Continue estimando antes de responder. Faltam ${remaining} ${remaining === 1 ? "sessao" : "sessoes"} para analise confiavel.`;
  }

  if (result.tendencia === CALIBRATION_TREND.OVERCONFIDENT) {
    return "Antes de avancar tema, force recuperacao ativa e explique por que a alternativa correta e correta. Seu risco e falsa sensacao de dominio.";
  }

  if (result.tendencia === CALIBRATION_TREND.UNDERCONFIDENT) {
    return "Use o resultado real para reduzir retrabalho: se acertou bem, mantenha revisao programada e evite repetir conteudo cedo demais.";
  }

  return "Boa calibracao. Continue registrando previsao antes da sessao para preservar autoconsciencia do desempenho.";
}

export function getCalibrationInterpretation(result = {}) {
  if (!result || result.status === CALIBRATION_STATUS.COLLECTING) {
    return "Ainda ha poucos dados para comparar previsao e resultado real.";
  }

  if (result.status === CALIBRATION_STATUS.LOW_CONFIDENCE) {
    return "Ja existe um sinal inicial, mas a amostra ainda e pequena. Use como feedback leve, nao como diagnostico definitivo.";
  }

  if (result.tendencia === CALIBRATION_TREND.OVERCONFIDENT) {
    return "Suas previsoes estao acima do desempenho real nas ultimas sessoes.";
  }

  if (result.tendencia === CALIBRATION_TREND.UNDERCONFIDENT) {
    return "Suas previsoes estao abaixo do desempenho real nas ultimas sessoes.";
  }

  return "Sua previsao esta proxima do desempenho real. Isso ajuda a confiar mais nas suas autoavaliacoes.";
}

function emptyCalibrationResult(status, n, opts, samples = []) {
  const base = {
    status,
    n,
    minPreview: opts.minPreview,
    minRequired: opts.minRequired,
    score: null,
    precisao: null,
    meanAbsoluteErrorPct: null,
    rootMeanSquaredErrorPct: null,
    meanSquaredCalibrationLoss: null,
    brierLikeLoss: null,
    biasPct: null,
    vies: null,
    tendencia: CALIBRATION_TREND.CALIBRATED,
    severity: CALIBRATION_SEVERITY.OK,
    buckets: buildCalibrationBuckets(samples),
  };

  return {
    ...base,
    action: getCalibrationAction(base),
    interpretation: n === 0 ? "Sem dados de calibracao ainda." : getCalibrationInterpretation(base),
    ...(opts.returnSamples ? { samples } : {}),
  };
}

export function calcCalibration(stats, options = {}) {
  const opts = { ...DEFAULT_CALIBRATION_OPTIONS, ...options };
  if (!Array.isArray(stats)) {
    return emptyCalibrationResult(CALIBRATION_STATUS.COLLECTING, 0, opts);
  }

  const samples = stats
    .map((item, index) => normalizeCalibrationSample(item, index))
    .filter(Boolean);

  const n = samples.length;
  const status = getCalibrationStatus(n, opts);

  if (n === 0) {
    return emptyCalibrationResult(status, n, opts, samples);
  }

  const meanAbsError = weightedMean(samples, (sample) => sample.absError);
  const meanSquaredCalibrationLoss = weightedMean(samples, (sample) => sample.squaredError);
  const rmse = Math.sqrt(meanSquaredCalibrationLoss);
  const bias = weightedMean(samples, (sample) => sample.error);
  const tendencia = classifyCalibrationTrend(bias, opts);
  const severity = classifyCalibrationSeverity(meanAbsError, opts);
  const score = Math.max(0, Math.min(100, Math.round((1 - meanAbsError) * 100)));

  const result = {
    status,
    n,
    minPreview: opts.minPreview,
    minRequired: opts.minRequired,
    score,
    precisao: score,
    meanAbsoluteErrorPct: pct(meanAbsError),
    rootMeanSquaredErrorPct: pct(rmse),
    meanSquaredCalibrationLoss: Number(meanSquaredCalibrationLoss.toFixed(4)),
    brierLikeLoss: Number(meanSquaredCalibrationLoss.toFixed(4)),
    biasPct: pct(bias),
    vies: pct(bias),
    tendencia,
    severity,
    buckets: buildCalibrationBuckets(samples),
  };

  return {
    ...result,
    action: getCalibrationAction(result),
    interpretation: getCalibrationInterpretation(result),
    ...(opts.returnSamples ? { samples } : {}),
  };
}
