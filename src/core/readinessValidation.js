import { todayStr } from "./fsrs";

function toScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function getSimuladoScore(simulado = {}) {
  const direct = toScore(
    simulado.pct
    ?? simulado.resultadoReal
    ?? simulado.percentual
    ?? simulado.acertoPct
    ?? simulado.scorePct
    ?? simulado.score
  );
  if (direct != null) return direct;

  const acertos = Number(simulado.acertos ?? simulado.correct ?? simulado.acertosTotal);
  const total = Number(simulado.total ?? simulado.totalQuestions ?? simulado.totalQuestoes ?? simulado.questoes);
  if (Number.isFinite(acertos) && Number.isFinite(total) && total > 0) {
    return toScore((acertos / total) * 100);
  }

  return null;
}

export function createReadinessSnapshot(input = {}) {
  const score = toScore(input.score ?? input.readinessScore ?? input.preparoEstimado);
  return {
    id: input.id || `readiness_${Date.now()}`,
    recordedAt: input.recordedAt || todayStr(),
    plat: input.plat || "res",
    score,
    confidence: input.confidence || "coletando",
    sampleSize: Number(input.sampleSize ?? 0),
  };
}

export function compareReadinessToSimulado(snapshot = {}, simulado = {}) {
  const estimated = toScore(snapshot.score);
  const actual = getSimuladoScore(simulado);

  if (estimated == null || actual == null) {
    return {
      status: "coletando",
      estimated,
      actual,
      absoluteError: null,
    };
  }

  const delta = estimated - actual;
  const absoluteError = Math.abs(delta);
  let status = "alinhado";
  if (delta > 5) status = "superestimado";
  if (delta < -5) status = "subestimado";

  return {
    status,
    estimated,
    actual,
    absoluteError,
  };
}

export function createForecastSnapshot(input = {}) {
  const forecast = input.forecast || input;
  const score = toScore(
    input.score
    ?? forecast.projectedScore
    ?? forecast.currentScore
  );

  return {
    id: input.id || `forecast_${Date.now()}`,
    recordedAt: input.recordedAt || todayStr(),
    plat: input.plat || "res",
    score,
    forecastVersion: forecast.version || "forecast_v1",
    confidence: forecast.confidence || "insufficient",
    displayMode: forecast.displayMode || "collecting",
    band: Array.isArray(forecast.band) ? forecast.band : null,
    bandWidth: forecast.bandWidth ?? null,
    nSimulados: forecast.components?.simuladoAnchor != null
      ? Number(forecast.sample?.nSimulados ?? forecast.sample?.simulados ?? 0)
      : Number(input.nSimulados ?? 0),
  };
}

export function compareForecastToSimulado(snapshot = {}, simulado = {}) {
  const base = compareReadinessToSimulado(snapshot, simulado);
  return {
    ...base,
    forecastVersion: snapshot.forecastVersion || "forecast_v1",
    confidence: snapshot.confidence || "insufficient",
    displayMode: snapshot.displayMode || "collecting",
  };
}

export function createForecastBacktestRecord({ forecast, simulado, plat = "res", recordedAt = todayStr() } = {}) {
  const snapshot = createForecastSnapshot({ forecast, plat, recordedAt });
  const comparison = compareForecastToSimulado(snapshot, simulado);
  if (comparison.estimated == null || comparison.actual == null) return null;

  return {
    id: `forecast_backtest_${simulado?.id || Date.now()}`,
    recordedAt,
    simuladoId: simulado?.id || null,
    simuladoDate: simulado?.data || simulado?.date || recordedAt,
    plat,
    estimated: comparison.estimated,
    actual: comparison.actual,
    delta: comparison.estimated - comparison.actual,
    absoluteError: comparison.absoluteError,
    status: comparison.status,
    confidence: comparison.confidence,
    displayMode: comparison.displayMode,
    forecastVersion: comparison.forecastVersion,
  };
}

export function summarizeForecastBacktests(records = []) {
  const valid = (Array.isArray(records) ? records : [])
    .filter((record) => Number.isFinite(Number(record?.absoluteError)));
  if (!valid.length) {
    return {
      n: 0,
      meanAbsoluteError: null,
      status: "coletando",
      latest: null,
    };
  }

  const meanAbsoluteError = Math.round(
    valid.reduce((sum, record) => sum + Number(record.absoluteError), 0) / valid.length
  );
  const latest = valid[valid.length - 1];
  const status = meanAbsoluteError <= 5
    ? "alinhado"
    : meanAbsoluteError <= 10
      ? "observando"
      : "recalibrar";

  return {
    n: valid.length,
    meanAbsoluteError,
    status,
    latest,
  };
}
