import { todayStr } from "./fsrs";

function toScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
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
  const actual = toScore(simulado.pct ?? simulado.resultadoReal);

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
