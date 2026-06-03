// src/core/onboardingEngine.js
// Funções puras de onboarding v2: constrói planSetup, recomenda escopo/simulados,
// determina a primeira ação executável. Sem UI, sem store, sem Firebase.

import { todayStr } from "./fsrs";
import { DEFAULT_PLAN_SETUP } from "./onboarding";
import { calculateWeeklyCapacity } from "./scheduleWizard";
import { generateSchedule } from "./scheduleWizard";

// ─── buildInitialPlanSetup ────────────────────────────────────────────────────

/**
 * Constrói um planSetup inicial com defaults sensatos a partir das respostas
 * do wizard (parciais ou completas).
 *
 * @param {Object} wizardAnswers - respostas do wizard (pode ser parcial)
 * @param {string} [_today]     - injeção de data para testes
 * @returns {Object} planSetup completo com defaults
 */
export function buildInitialPlanSetup(wizardAnswers = {}, _today) {
  const today = _today || todayStr();

  const studyDays = wizardAnswers.studyDays || DEFAULT_PLAN_SETUP.studyDays;
  const weeklyCapacity = calculateWeeklyCapacity(studyDays);

  const planSetup = {
    ...DEFAULT_PLAN_SETUP,
    startDate: wizardAnswers.startDate || today,
    targetDate: wizardAnswers.targetDate || null,
    horizonMode: wizardAnswers.horizonMode || "duration",
    horizonMonths: wizardAnswers.horizonMonths || 6,
    studyDays,
    topicsPerWeek: weeklyCapacity,
    scopeMode: wizardAnswers.scopeMode || "essential",
    minutesPerTopic: wizardAnswers.minutesPerTopic || 50,
    focusMode: wizardAnswers.focusMode || "medrev_base",
    institutions: wizardAnswers.institutions || ["ENAMED"],
    simulationPlan: wizardAnswers.simulationPlan || "none",
    feasibility: wizardAnswers.feasibility || null,
    completedAt: null,
  };

  return planSetup;
}

// ─── recommendScopeMode ───────────────────────────────────────────────────────

/**
 * Recomenda o scopeMode baseado na viabilidade calculada.
 * - ratio <= 0.75 → complete (tem espaço para tudo)
 * - ratio <= 1.0  → essential (equilibrado)
 * - ratio > 1.0   → essential com aviso de inviabilidade
 *
 * @param {{ ratio: number, status: string } | null} feasibility
 * @returns {"essential" | "complete" | "intensive"}
 */
export function recommendScopeMode(feasibility) {
  if (!feasibility) return "essential";
  const { ratio } = feasibility;
  if (ratio <= 0.75) return "complete";
  return "essential";
}

// ─── recommendSimulationPlan ──────────────────────────────────────────────────

/**
 * Recomenda o plano de simulados baseado no horizonte e track.
 * - track=vest ou horizon < 8 semanas → "diagnostic" (só diagnóstico)
 * - horizon < 16 semanas → "monthly"
 * - horizon >= 16 semanas → "biweekly"
 *
 * @param {{ totalWeeks: number }} horizon
 * @param {"res" | "vest"} track
 * @returns {"none" | "diagnostic" | "monthly" | "biweekly" | "weekly_final"}
 */
export function recommendSimulationPlan(horizon = {}, track = "res") {
  const weeks = horizon.totalWeeks || 0;
  if (track === "vest" || weeks < 8) return "diagnostic";
  if (weeks < 16) return "monthly";
  return "biweekly";
}

// ─── getFirstActionAfterOnboarding ───────────────────────────────────────────

/**
 * Determina a primeira ação executável após o onboarding.
 * Procura o primeiro scheduledTopic com date <= today (D0 do dia de hoje
 * ou atrasado). Retorna null se não há nada para fazer hoje.
 *
 * @param {Array}  scheduledTopics - resultado de generateSchedule
 * @param {Object} planSetup
 * @param {string} [_today]
 * @returns {{ temaId, temaNome, stepKey:"d0", estimatedMinutes, scheduledDate } | null}
 */
export function getFirstActionAfterOnboarding(scheduledTopics = [], planSetup = {}, _today) {
  const today = _today || todayStr();
  const minutesPerTopic = planSetup.minutesPerTopic || 50;

  const due = scheduledTopics
    .filter((t) => t.scheduledDate && t.scheduledDate <= today)
    .sort((a, b) => {
      // CRITICA primeiro
      const pw = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };
      const pa = pw[(a.priority || "ALTA").toUpperCase()] ?? 1;
      const pb = pw[(b.priority || "ALTA").toUpperCase()] ?? 1;
      return pa - pb || a.scheduledDate.localeCompare(b.scheduledDate);
    });

  if (due.length === 0) {
    // Nada hoje: retorna o próximo item futuro (preview)
    const next = scheduledTopics
      .filter((t) => t.scheduledDate && t.scheduledDate > today)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];

    if (!next) return null;
    return {
      temaId: next.temaId,
      temaNome: next.temaNome || "",
      stepKey: "d0",
      estimatedMinutes: minutesPerTopic,
      scheduledDate: next.scheduledDate,
      isUpcoming: true,
    };
  }

  const first = due[0];
  return {
    temaId: first.temaId,
    temaNome: first.temaNome || "",
    stepKey: "d0",
    estimatedMinutes: minutesPerTopic,
    scheduledDate: first.scheduledDate,
    isUpcoming: false,
  };
}

// ─── completePlanSetupPayload ─────────────────────────────────────────────────

/**
 * Prepara o payload completo para a action `completePlanSetup` no store.
 * Gera scheduledTopics se não passados.
 *
 * @param {Object} planSetup
 * @param {Array}  topics        - tópicos do cronograma escolhido
 * @param {Array}  [scheduledTopics] - se já gerado externamente
 * @param {string} [_today]
 * @returns {{ planSetup: Object, scheduledTopics: Array, firstAction: Object|null }}
 */
export function completePlanSetupPayload(planSetup, topics = [], scheduledTopics, _today) {
  const today = _today || todayStr();
  const finalScheduled = scheduledTopics || generateSchedule(planSetup, topics, today);

  const finalPlanSetup = {
    ...planSetup,
    completedAt: today,
    topicsPerWeek: calculateWeeklyCapacity(planSetup.studyDays || {}),
  };

  const firstAction = getFirstActionAfterOnboarding(finalScheduled, finalPlanSetup, today);

  return { planSetup: finalPlanSetup, scheduledTopics: finalScheduled, firstAction };
}
