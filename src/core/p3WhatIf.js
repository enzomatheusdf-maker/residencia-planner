const DEFAULT_SCENARIOS = Object.freeze([
  {
    id: "manter_plano",
    label: "Manter plano atual",
    delta: 0,
    bandPenalty: 0,
    assumptions: ["Mantem carga, simulados e ritmo atuais."],
  },
  {
    id: "carga_sustentavel",
    label: "Carga sustentavel",
    delta: 3,
    bandPenalty: -1,
    assumptions: ["Aumenta consistencia sem dobrar volume.", "Prioriza revisoes vencidas antes de novos temas."],
  },
  {
    id: "simulado_calibrado",
    label: "Simulado calibrado",
    delta: 4,
    bandPenalty: -2,
    assumptions: ["Inclui simulado com correcao por area.", "Usa erros para ajustar proximos alvos."],
  },
  {
    id: "sobrecarga",
    label: "Sobrecarga",
    delta: -5,
    bandPenalty: 3,
    assumptions: ["Volume sobe acima da capacidade sustentavel.", "Incerteza aumenta por queda de qualidade."],
  },
]);

function clamp(value, min = 0, max = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

function clampRound(value, min = 0, max = 100) {
  const n = clamp(value, min, max);
  return n == null ? null : Math.round(n);
}

function getForecastScore(forecast = {}) {
  return clampRound(
    forecast.projectedScore
      ?? forecast.currentScore
      ?? forecast.score
      ?? forecast.preparoEstimado
  );
}

function getBandWidth(forecast = {}) {
  const explicit = Number(forecast.bandWidth);
  if (Number.isFinite(explicit) && explicit > 0) return Math.round(explicit);
  if (Array.isArray(forecast.band) && forecast.band.length === 2) {
    const low = Number(forecast.band[0]);
    const high = Number(forecast.band[1]);
    if (Number.isFinite(low) && Number.isFinite(high) && high >= low) {
      return Math.max(5, Math.round((high - low) / 2));
    }
  }
  return 14;
}

function buildBand(score, width) {
  if (score == null) return null;
  return [Math.max(0, score - width), Math.min(100, score + width)];
}

function normalizeScenario(scenario, baseScore, baseWidth) {
  const delta = Number(scenario.delta) || 0;
  const projectedScore = clampRound(baseScore + delta);
  const bandWidth = Math.max(5, Math.min(24, baseWidth + (Number(scenario.bandPenalty) || 0)));
  return {
    id: scenario.id,
    label: scenario.label,
    projectedScore,
    delta: projectedScore == null ? null : projectedScore - baseScore,
    band: buildBand(projectedScore, bandWidth),
    bandWidth,
    assumptions: scenario.assumptions || [],
  };
}

export function isP3WhatIfOptedIn({ enabled = false, meta = {} } = {}) {
  return Boolean(
    enabled
      || meta?.featureFlags?.p3WhatIf === true
      || meta?.modulos?.p3WhatIf === true
      || meta?.experiments?.p3WhatIf === true
  );
}

export function buildP3WhatIfScenarios({
  forecast = {},
  meta = {},
  enabled = false,
  scenarios = DEFAULT_SCENARIOS,
} = {}) {
  if (!isP3WhatIfOptedIn({ enabled, meta })) {
    return {
      enabled: false,
      status: "disabled",
      scenarios: [],
      reason: "feature_flag_disabled",
    };
  }

  const baseScore = getForecastScore(forecast);
  if (baseScore == null) {
    return {
      enabled: true,
      status: "collecting",
      scenarios: [],
      reason: "forecast_unavailable",
      warnings: ["What-if P3 depende de forecast existente e nao gera nota oficial."],
    };
  }

  const baseWidth = getBandWidth(forecast);
  const normalizedScenarios = scenarios.map((scenario) => normalizeScenario(scenario, baseScore, baseWidth));

  return {
    enabled: true,
    status: forecast.displayMode === "forecast" ? "ready" : "preview",
    version: "p3_what_if_v1",
    baseScore,
    baseBand: buildBand(baseScore, baseWidth),
    baseBandWidth: baseWidth,
    scenarios: normalizedScenarios,
    assumptions: [
      "Cenarios sao diagnosticos e nao alteram agenda, FSRS ou ActionInbox.",
      "Deltas sao conservadores e devem ser recalibrados por backtest de simulados.",
    ],
    warnings: ["What-if P3 e experimental e nao estima nota oficial."],
  };
}
