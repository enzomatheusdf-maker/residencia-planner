function toDateSafe(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function diasAteProva(examDate, today = new Date()) {
  const prova = toDateSafe(examDate);
  const agora = toDateSafe(today) || new Date();
  if (!prova) return null;
  const diffMs = prova.getTime() - agora.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getPeakPhase({ examDate, today } = {}) {
  const dias = diasAteProva(examDate, today);
  if (dias == null) return "base";
  if (dias <= 3) return "vespera";
  if (dias <= 21) return "reta_final";
  if (dias <= 60) return "aproximacao";
  return "base";
}

export function getPeakModePolicy(phase = "base") {
  if (phase === "aproximacao") {
    return {
      allowNewTopics: true,
      maxNewTopicsPerWeek: 4,
      reviewBias: 10,
      examAnalysisBias: 10,
      restBias: 0,
    };
  }
  if (phase === "reta_final") {
    return {
      allowNewTopics: "limited",
      maxNewTopicsPerWeek: 1,
      reviewBias: 25,
      examAnalysisBias: 25,
      restBias: 10,
    };
  }
  if (phase === "vespera") {
    return {
      allowNewTopics: false,
      maxNewTopicsPerWeek: 0,
      reviewBias: 40,
      examAnalysisBias: 15,
      restBias: 30,
    };
  }
  return {
    allowNewTopics: true,
    maxNewTopicsPerWeek: null,
    reviewBias: 0,
    examAnalysisBias: 0,
    restBias: 0,
  };
}

export function adjustActionForPeakMode(action = {}, policy = getPeakModePolicy("base")) {
  if (!action || typeof action !== "object") return action;
  const basePriority = Number(action.priority || 0);
  let nextPriority = basePriority;

  if (action.type === "new_topic") {
    if (policy.allowNewTopics === false) nextPriority -= 60;
    if (policy.allowNewTopics === "limited") nextPriority -= 30;
  }
  if (action.type === "review") nextPriority += Number(policy.reviewBias || 0);
  if (action.type === "exam_analysis") nextPriority += Number(policy.examAnalysisBias || 0);
  if (action.type === "rest") nextPriority += Number(policy.restBias || 0);

  return {
    ...action,
    priority: Math.round(nextPriority),
    peakAdjusted: true,
  };
}

export function shouldLimitNewTopics({ phase, backlog = 0, coverage = 100 } = {}) {
  if (phase === "reta_final" || phase === "vespera") return true;
  if (phase === "aproximacao" && (Number(backlog || 0) > 20 || Number(coverage || 0) < 60)) return true;
  return false;
}

