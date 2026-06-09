import {
  STEPS,
  diffDays,
  todayStr,
  recalcAfterMark,
  getRetencaoArea,
} from "./fsrs";
import { getNextReviewForTema } from "./domainValidation";

const STEP_FLOW_ORDER = {
  d0: 0,
  d1: 1,
  d4: 2,
  d7: 3,
  d21: 4,
  manutencao: 5,
};

function formatDayDelta(dateStr, today = todayStr()) {
  if (!dateStr) return "";
  const days = diffDays(today, dateStr);
  if (days === 0) return "hoje";
  if (days === 1) return "em 1 dia";
  if (days > 1) return `em ${days} dias`;
  if (days === -1) return "atrasado ha 1 dia";
  return `atrasado ha ${Math.abs(days)} dias`;
}

function getTransitionVerb(currentStepKey, nextStepKey) {
  const currentOrder = STEP_FLOW_ORDER[currentStepKey] ?? 0;
  const nextOrder = STEP_FLOW_ORDER[nextStepKey] ?? currentOrder;
  if (nextOrder > currentOrder) return { tone: "advance", label: "Vai avancar" };
  if (nextOrder < currentOrder) return { tone: "regress", label: "Vai regredir" };
  return { tone: "repeat", label: "Vai repetir" };
}

function getRemediationSuffix(nextStepKey) {
  if (nextStepKey === "d0") return " para retomar o estudo completo";
  if (nextStepKey === "d1") return " para fazer brain dump e mapear lacunas";
  return "";
}

export function describeReviewTransition({ currentStepKey, nextReview, today = todayStr() }) {
  if (!nextReview) {
    return {
      tone: "complete",
      message: "Ciclo concluido. Nenhuma revisao pendente agora.",
      nextStepKey: null,
      daysUntil: null,
    };
  }

  const nextLabel = nextReview.label || String(nextReview.stepKey || "").toUpperCase();
  const timing = formatDayDelta(nextReview.date, today);
  const transition = getTransitionVerb(currentStepKey, nextReview.stepKey);
  const suffix = transition.tone === "advance" ? "" : getRemediationSuffix(nextReview.stepKey);
  const when = timing ? ` ${timing}` : "";

  return {
    tone: transition.tone,
    message: `${transition.label} para ${nextLabel}${when}${suffix}.`,
    nextStepKey: nextReview.stepKey,
    daysUntil: nextReview.date ? diffDays(today, nextReview.date) : null,
  };
}

export function buildReviewPreview({ tema, stepKey, acerto, meta = {} }) {
  if (!tema || !stepKey || acerto == null) return null;
  const currentStep = tema.rev?.[stepKey] || {};
  const reviewedAt = todayStr();
  const revMarked = {
    ...(tema.rev || {}),
    [stepKey]: {
      ...currentStep,
      done: true,
      acerto,
      reviewedAt,
      completedAt: reviewedAt,
      scheduledAt: currentStep.scheduledAt || currentStep.date || reviewedAt,
    },
  };

  const desiredRetention = getRetencaoArea(tema.esp, meta?.retencaoFSRS ?? 0.90);
  const maxInterval = meta?.intervaloMaxDias ?? 180;
  const examPhase = meta?.peakModePhase || "base";
  const overload = false;
  const history = tema.rev?.reviewHistory || [];
  const nextRev = recalcAfterMark(revMarked, stepKey, acerto, desiredRetention, maxInterval, tema.esp, {
    tema,
    examPhase,
    overload,
    history,
  });
  const nextTema = { ...tema, rev: nextRev };
  return describeReviewTransition({
    currentStepKey: stepKey,
    nextReview: getNextReviewForTema(nextTema),
  });
}

export function describeCurrentReviewTransition({ tema, stepKey }) {
  if (!tema || !stepKey) return null;
  return describeReviewTransition({
    currentStepKey: stepKey,
    nextReview: getNextReviewForTema(tema),
  });
}

export function getStepLabel(stepKey) {
  const step = STEPS.find((item) => item.key === stepKey);
  if (step?.label) return step.label;
  if (stepKey === "manutencao") return "Manutencao";
  return String(stepKey || "").toUpperCase();
}
