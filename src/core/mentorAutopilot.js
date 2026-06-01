import { buildMentorContext } from "./mentorSignals";
import { buildMentorTodayPlan, decideMentorAction } from "./mentorDecisionPolicy";

function normalizeLegacyContext(context = {}) {
  if (context.scheduler) return context;
  return {
    plat: context.plat || "res",
    meta: context.meta || {},
    scheduler: {
      overdueCount: Number(context.overdue || 0),
      dueTodayCount: Number(context.pending || 0),
      todayMinutes: Number(context.todayMinutes || 0),
      overloadLevelToday: context.overloadLevelToday || "ok",
      overloadDays: Number(context.overloadDays || 0),
      relearningCount: Number(context.relearningCount || 0),
      relearningItems: context.relearningItems || [],
      missingRatingWarnings: Number(context.missingRatingWarnings || 0),
      missingReviewedAtCount: Number(context.missingReviewedAtCount || 0),
      nextDueItem: context.nextDueItem || null,
      maxDelayDays: Number(context.maxDelayDays || 0),
      trueRetentionCollecting: Boolean(context.trueRetentionCollecting),
    },
    enamed: context.enamed || null,
    weakSubject: context.materiaFracaVest || context.weakSubject || null,
    clinical: context.clinical || { dueCount: 0, dueItems: [] },
    pendingExamAnalysis: Boolean(context.pendingExamAnalysis),
    calendarProvider: context.calendarProvider || {},
    userAvailableMinutes: context.userAvailableMinutes || null,
    lowEnergy: Boolean(context.lowEnergy),
    exhaustionDetected: Boolean(context.exhaustionDetected),
    readinessData: context.readinessData || null,
  };
}

export function getMentorNextAction(context = {}) {
  return decideMentorAction(normalizeLegacyContext(context));
}

export function getMentorTodayPlan(context = {}) {
  return buildMentorTodayPlan(normalizeLegacyContext(context));
}

export function explainMentorAction(action = {}) {
  if (!action?.title) return "Sem ação definida.";
  const explain = Array.isArray(action.explain) && action.explain.length > 0
    ? action.explain[0]
    : (action.reason || "sem justificativa disponível.");
  return `${action.title}: ${explain}`;
}

export { buildMentorContext };
