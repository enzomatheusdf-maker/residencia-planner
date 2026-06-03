import { trackEvent as trackFirebaseEvent } from "../services/firebase";

const EVENT_SCHEMAS = {
  activation_first_plan_created: ["plat"],
  activation_first_review_done: ["plat", "step"],
  mentor_action_seen: ["plat", "action_type", "source"],
  mentor_action_started: ["plat", "action_type", "source"],
  mentor_action_completed: ["plat", "action_type", "source"],
  review_completed: ["plat", "step"],
  simulation_result_recorded: ["plat", "pct", "total"],
  readiness_snapshot: ["plat", "score", "confidence"],
  readiness_vs_simulado_result: ["plat", "status", "absolute_error"],
  retorno_d1: ["gap_dias"],
  retorno_d7: ["gap_dias"],
  revisoes_zeradas_dia: ["plat"],
  dominio_previo_avaliado: ["plat", "percentual", "status"],
  onboarding_done: [],
};

function sanitizeString(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_:-]/g, "")
    .slice(0, 40);
}

function sanitizeValue(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 100) / 100;
  if (typeof value === "string") {
    const normalized = sanitizeString(value);
    return normalized || undefined;
  }
  return undefined;
}

export function isTelemetryDisabled(state = {}) {
  return Boolean(state?.meta?.analytics?.disabled);
}

export function sanitizeTelemetryPayload(eventName, payload = {}) {
  const allowedKeys = EVENT_SCHEMAS[eventName] || [];
  const sanitized = {};

  for (const key of allowedKeys) {
    if (/(uid|email|name|message|note|texto|tema)/i.test(key)) continue;
    const value = sanitizeValue(payload[key]);
    if (value !== undefined) sanitized[key] = value;
  }

  return sanitized;
}

export function safeTrackEvent(eventName, payload = {}, options = {}) {
  if (!eventName || isTelemetryDisabled(options.state)) return false;
  const sanitized = sanitizeTelemetryPayload(eventName, payload);
  trackFirebaseEvent(eventName, sanitized);
  return true;
}
