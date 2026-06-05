import { getPeakPhase } from "./peakMode";

export const OPERATIONAL_MODE = Object.freeze({
  DATA_ISSUE: "dados_inconsistentes",
  PAUSED: "pausado",
  OVERLOAD: "sobrecarga",
  RECOVERY: "recuperacao",
  EXAM_NEAR: "prova_proxima",
  NORMAL: "normal",
});

export const EXPERIENCE_MODE = Object.freeze({
  FOCUS: "foco",
  MENTOR: "mentor",
  MANUAL: "manual",
});

const SOURCE = "operational-mode-v1";
const FINAL_EXAM_PHASES = ["reta_final", "vespera"];
const NEAR_EXAM_PHASES = ["aproximacao", ...FINAL_EXAM_PHASES];

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function activeUntil(dateStr, today) {
  if (!dateStr || !today) return false;
  return String(dateStr) >= String(today);
}

export function deriveExperienceMode({ focusMode, modoSimples, mentorMode } = {}) {
  if (focusMode) return EXPERIENCE_MODE.FOCUS;
  if (modoSimples || mentorMode) return EXPERIENCE_MODE.MENTOR;
  return EXPERIENCE_MODE.MANUAL;
}

function buildMode(partial = {}) {
  return {
    mode: partial.mode || OPERATIONAL_MODE.NORMAL,
    label: partial.label || "Normal",
    severity: partial.severity || "ok",
    rank: safeNumber(partial.rank, 10),
    reasonCodes: Array.isArray(partial.reasonCodes) ? partial.reasonCodes : [],
    explain: Array.isArray(partial.explain) ? partial.explain : [],
    examPhase: partial.examPhase || "base",
    experienceMode: partial.experienceMode || EXPERIENCE_MODE.MENTOR,
    flags: {
      canStartNewTopic: true,
      shouldPreferReview: false,
      shouldPreferRecovery: false,
      shouldSuggestRest: false,
      shouldReduceVolume: false,
      shouldPreferExamPractice: false,
      ...(partial.flags || {}),
    },
    policy: {
      newTopicBias: 0,
      reviewBias: 0,
      recoveryBias: 0,
      examPracticeBias: 0,
      restBias: 0,
      ...(partial.policy || {}),
    },
    source: SOURCE,
  };
}

export function deriveOperationalMode(input = {}) {
  const scheduler = input.scheduler || {};
  const meta = input.meta || {};
  const today = input.today;
  const examPhase = input.examPhase || getPeakPhase({ examDate: meta.dataProva, today });
  const experienceMode = deriveExperienceMode(input);
  const userAvailableMinutes = input.userAvailableMinutes == null
    ? null
    : safeNumber(input.userAvailableMinutes, 0);

  const missingRatingWarnings = safeNumber(scheduler.missingRatingWarnings);
  const missingReviewedAtCount = safeNumber(scheduler.missingReviewedAtCount);
  const todayMinutes = safeNumber(scheduler.todayMinutes);
  const overloadDays = safeNumber(scheduler.overloadDays);
  const relearningCount = safeNumber(scheduler.relearningCount);
  const overdueCount = safeNumber(scheduler.overdueCount);
  const maxDelayDays = safeNumber(scheduler.maxDelayDays);
  const overloadLevelToday = scheduler.overloadLevelToday || "ok";

  if (missingRatingWarnings > 0 || missingReviewedAtCount > 0) {
    return buildMode({
      mode: OPERATIONAL_MODE.DATA_ISSUE,
      label: "Dados de revisao inconsistentes",
      severity: "critical",
      rank: 100,
      examPhase,
      experienceMode,
      reasonCodes: [
        missingRatingWarnings > 0 ? "missing_rating_warnings" : null,
        missingReviewedAtCount > 0 ? "missing_reviewed_at" : null,
      ].filter(Boolean),
      explain: [
        "Ha revisoes concluidas com dados faltando.",
        "Corrigir o historico vem antes de otimizar o plano.",
      ],
      flags: {
        canStartNewTopic: false,
        shouldReduceVolume: true,
      },
      policy: {
        newTopicBias: -100,
      },
    });
  }

  if (activeUntil(meta.pausadoAte, today)) {
    return buildMode({
      mode: OPERATIONAL_MODE.PAUSED,
      label: "Plano pausado",
      severity: "info",
      rank: 90,
      examPhase,
      experienceMode,
      reasonCodes: ["paused_until_active"],
      explain: ["O plano esta pausado ate a data configurada."],
      flags: {
        canStartNewTopic: false,
        shouldSuggestRest: true,
        shouldReduceVolume: true,
      },
      policy: {
        newTopicBias: -100,
        restBias: 30,
      },
    });
  }

  const exceedsAvailable = userAvailableMinutes > 0 && todayMinutes > userAvailableMinutes * 1.2;
  const exceedsDefault = userAvailableMinutes == null && todayMinutes > 120;
  const highOverload = overloadLevelToday === "high" || overloadDays >= 2 || exceedsAvailable || exceedsDefault;
  const moderateOverload = overloadLevelToday === "moderate" && overloadDays >= 1;

  if (highOverload || moderateOverload) {
    return buildMode({
      mode: OPERATIONAL_MODE.OVERLOAD,
      label: "Sobrecarga",
      severity: "caution",
      rank: 80,
      examPhase,
      experienceMode,
      reasonCodes: [
        overloadLevelToday === "high" ? "overload_today_high" : null,
        overloadLevelToday === "moderate" ? "overload_today_moderate" : null,
        overloadDays >= 2 ? "overload_days_ge_2" : null,
        moderateOverload ? "moderate_plus_future_overload" : null,
        exceedsAvailable ? "exceeds_available_minutes" : null,
        exceedsDefault ? "exceeds_default_minutes" : null,
      ].filter(Boolean),
      explain: [
        "A carga estimada esta acima do ideal para hoje.",
        "Tema novo deve ficar em segundo plano ate estabilizar a fila.",
      ],
      flags: {
        canStartNewTopic: false,
        shouldPreferReview: true,
        shouldSuggestRest: true,
        shouldReduceVolume: true,
      },
      policy: {
        newTopicBias: -50,
        reviewBias: 25,
        restBias: 20,
      },
    });
  }

  if (relearningCount > 0 || overdueCount > 0 || maxDelayDays >= 3) {
    return buildMode({
      mode: OPERATIONAL_MODE.RECOVERY,
      label: "Recuperacao",
      severity: "caution",
      rank: 70,
      examPhase,
      experienceMode,
      reasonCodes: [
        relearningCount > 0 ? "relearning_active" : null,
        overdueCount > 0 ? "overdue_reviews" : null,
        maxDelayDays >= 3 ? "max_delay_ge_3" : null,
      ].filter(Boolean),
      explain: [
        "Ha revisao vencida ou tema em reaprendizado.",
        "Recuperacao ativa vem antes de abrir frente nova.",
      ],
      flags: {
        canStartNewTopic: false,
        shouldPreferReview: true,
        shouldPreferRecovery: true,
        shouldReduceVolume: true,
      },
      policy: {
        newTopicBias: -40,
        reviewBias: 25,
        recoveryBias: 30,
      },
    });
  }

  if (NEAR_EXAM_PHASES.includes(examPhase)) {
    const finalPhase = FINAL_EXAM_PHASES.includes(examPhase);
    return buildMode({
      mode: OPERATIONAL_MODE.EXAM_NEAR,
      label: "Prova proxima",
      severity: "info",
      rank: 60,
      examPhase,
      experienceMode,
      reasonCodes: [`exam_phase_${examPhase}`],
      explain: [
        "A data da prova esta proxima.",
        finalPhase
          ? "Priorize revisao, simulado e descanso; evite expansao agressiva."
          : "Aumente o peso de prova e revisao sem abandonar avanco planejado.",
      ],
      flags: {
        canStartNewTopic: examPhase === "aproximacao",
        shouldPreferReview: true,
        shouldSuggestRest: examPhase === "vespera",
        shouldReduceVolume: finalPhase,
        shouldPreferExamPractice: true,
      },
      policy: {
        newTopicBias: examPhase === "aproximacao" ? -10 : -50,
        reviewBias: finalPhase ? 35 : 15,
        examPracticeBias: finalPhase ? 30 : 20,
        restBias: examPhase === "vespera" ? 30 : 10,
      },
    });
  }

  return buildMode({
    mode: OPERATIONAL_MODE.NORMAL,
    label: "Normal",
    severity: "ok",
    rank: 10,
    examPhase,
    experienceMode,
    reasonCodes: ["stable"],
    explain: ["Sem sobrecarga, atraso critico ou restricao de prova detectada."],
  });
}
