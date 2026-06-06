import { ENAMED_HOTNESS, MACRO_PESO_ENAMED } from "../constants/enamedIncidencia";
import { todayStr } from "./fsrs";

const ERROR_DRILL_MAP = Object.freeze({
  anchoring: "drillC",
  premature_closure: "drillC",
  fechamento_precoce: "drillC",
  discrimination_gap: "drillC",
  overconfidence: "drillA",
  calibration_gap: "drillA",
  slow_reasoning: "drillA",
  pertinent_negative_gap: "drillB",
  clinical_reasoning_gap: "drillB",
  low_score: "drillB",
});

function clamp01(value, fallback = 0.3) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function numericScoreFromProgress(progress = {}) {
  const score = progress.fase2Acerto ?? progress.fase1Acerto ?? progress.sctAcerto ?? progress.notaCaso;
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n)) / 100;
}

function averageCompartmentMastery(compartimentos = {}) {
  const values = Object.values(compartimentos)
    .map((item) => Number(item?.mastery))
    .filter(Number.isFinite);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function hasWeakCompartment(progress = {}) {
  return Object.values(progress.compartimentos || {}).some((item) => {
    const mastery = Number(item?.mastery);
    return item?.lastRating === "vermelho"
      || item?.lastRating === "amarelo"
      || (Number.isFinite(mastery) && mastery < 0.55);
  });
}

function inferMastery(progress = {}) {
  const explicit = progress.mastery ?? progress.pMastery ?? progress.p;
  if (explicit != null) return clamp01(explicit);

  const compartmentMastery = averageCompartmentMastery(progress.compartimentos);
  if (compartmentMastery != null) return clamp01(compartmentMastery);

  const scoreMastery = numericScoreFromProgress(progress);
  if (scoreMastery != null) return clamp01(scoreMastery);

  return Number(progress.vistos || 0) > 0 ? 0.45 : 0.25;
}

function getIncidenceWeight(script = {}) {
  const area = script.area || "Outro";
  const macro = MACRO_PESO_ENAMED[area] ?? MACRO_PESO_ENAMED.Outro ?? 1;
  const subtopic = script.subtopic || script.subarea || script.tema || "";
  const hotness = ENAMED_HOTNESS[area]?.[subtopic] ?? 0;
  return macro * (1 + hotness);
}

function latestClinicalError(learningEvents = [], scriptId) {
  for (let i = learningEvents.length - 1; i >= 0; i -= 1) {
    const event = learningEvents[i];
    const eventScriptId = event?.scriptId || event?.meta?.scriptId || event?.casoId;
    if (event?.source !== "clinical_drill" || String(eventScriptId) !== String(scriptId)) continue;
    const error = event.dominantError || event.errors?.dominantError || event.meta?.dominantError;
    if (error) return error;
  }
  return null;
}

function getErrorWeight(error) {
  if (!error) return 1;
  if (error === "anchoring" || error === "premature_closure" || error === "fechamento_precoce") return 1.35;
  if (error === "discrimination_gap") return 1.3;
  if (error === "overconfidence" || error === "calibration_gap") return 1.2;
  return 1.15;
}

function dueMultiplier(progress = {}, today) {
  if (progress.proximaData && String(progress.proximaData) <= today) return 1.5;
  if (!progress.vistos) return 1.25;
  return 0.85;
}

function chooseDrillType({ progress, mastery, dominantError }) {
  const isNew = Number(progress?.vistos || 0) === 0;
  if (isNew || mastery < 0.45 || hasWeakCompartment(progress)) return "drill0";
  return ERROR_DRILL_MAP[dominantError] || "drillB";
}

export function selectNextDrill({
  scripts = [],
  casosProgresso = {},
  learningEvents = [],
  today = todayStr(),
} = {}) {
  const candidates = (scripts || [])
    .filter((script) => script?.id)
    .map((script) => {
      const progress = casosProgresso?.[script.id] || {};
      const mastery = inferMastery(progress);
      const dominantError = latestClinicalError(learningEvents, script.id);
      const incidenceWeight = getIncidenceWeight(script);
      const priority = (1 - mastery)
        * incidenceWeight
        * getErrorWeight(dominantError)
        * dueMultiplier(progress, today);
      const drillType = chooseDrillType({ progress, mastery, dominantError });

      return {
        scriptId: script.id,
        drillType,
        phase: drillType === "drill0" ? "script" : "caso",
        priority: Math.round(priority * 1000) / 1000,
        mastery,
        incidenceWeight,
        dominantError,
        due: Boolean(progress.proximaData && String(progress.proximaData) <= today),
        reason: drillType === "drill0"
          ? "script novo ou compartimento fraco"
          : dominantError
            ? `erro dominante: ${dominantError}`
            : "aplicacao padrao",
      };
    })
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return normalizeText(a.scriptId).localeCompare(normalizeText(b.scriptId));
    });

  return candidates[0] || null;
}
