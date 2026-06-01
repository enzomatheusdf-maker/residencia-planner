import { STEPS, todayStr, diffDays, getWorkloadProjection } from "./fsrs";
import { calcTrueRetentionDetailed } from "../hooks/useMetrics";

function median(values = []) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function collectLatestStep(rev = {}) {
  if (rev?.manutencao?.S != null) return rev.manutencao;
  for (let i = STEPS.length - 1; i >= 0; i--) {
    const step = rev[STEPS[i].key];
    if (step?.S != null) return step;
  }
  return null;
}

export function collectSchedulerSignalsForMentor(context = {}) {
  const temas = context.temas || [];
  const horizonDays = context.horizonDays || 7;
  const today = context.today || todayStr();

  const trueRetention = calcTrueRetentionDetailed(temas);
  const workloadProjection = getWorkloadProjection(temas, horizonDays);
  const workloadDays = Object.values(workloadProjection);
  const todayEntry = workloadProjection[today] || { estimatedMinutes: 0 };

  const overdueItems = [];
  const relearningItems = [];
  const stabilityValues = [];
  let lowStabilityCount = 0;
  const highDifficultyAreas = {};
  let highDifficultyCount = 0;
  let missingReviewedAtCount = 0;
  let missingRatingCount = 0;
  let historyEvents = 0;

  for (let i = 0; i < temas.length; i++) {
    const tema = temas[i];
    if (!tema || tema.unstarted) continue;
    const rev = tema.rev || {};
    const history = Array.isArray(rev.reviewHistory) ? rev.reviewHistory : [];
    historyEvents += history.length;

    if (rev.phase === "relearning" || rev.relearning?.startedAt) {
      relearningItems.push({
        temaId: tema.id,
        temaNome: tema.nome,
        area: tema.esp,
        fromStep: rev.relearning?.fromStep || null,
        targetStep: rev.relearning?.targetStep || null,
      });
    }

    const latestStep = collectLatestStep(rev);
    if (latestStep?.S != null) {
      stabilityValues.push(latestStep.S);
      if (latestStep.S < 5) lowStabilityCount += 1;
    }
    if (latestStep?.D != null && latestStep.D >= 0.7) {
      highDifficultyCount += 1;
      highDifficultyAreas[tema.esp || "Outro"] = (highDifficultyAreas[tema.esp || "Outro"] || 0) + 1;
    }

    for (let j = 0; j < STEPS.length; j++) {
      const key = STEPS[j].key;
      const step = rev[key];
      if (!step) continue;
      if (!step.done && step.date && step.date < today) {
        overdueItems.push({
          temaId: tema.id,
          temaNome: tema.nome,
          area: tema.esp,
          stepKey: key,
          date: step.date,
          delayDays: Math.max(0, diffDays(step.date, today)),
        });
      }
      if (step.done && !step.reviewedAt) {
        missingReviewedAtCount += 1;
      }
      if (step.done && step.acerto == null) {
        missingRatingCount += 1;
      }
    }
  }

  const overloadDays = workloadDays.filter((day) => day.overloadLevel !== "ok").length;
  const next7DaysMinutes = workloadDays.reduce((sum, day) => sum + (day.estimatedMinutes || 0), 0);
  const maxDayMinutes = workloadDays.reduce((max, day) => Math.max(max, day.estimatedMinutes || 0), 0);
  const maxDelayDays = overdueItems.reduce((max, item) => Math.max(max, item.delayDays || 0), 0);

  return {
    trueRetention: {
      pct: trueRetention.pct,
      n: trueRetention.n,
      totalQuestoes: trueRetention.totalQuestoes,
      collecting: trueRetention.collecting,
    },
    workload: {
      todayMinutes: todayEntry.estimatedMinutes || 0,
      next7DaysMinutes,
      overloadDays,
      maxDayMinutes,
    },
    overdue: {
      count: overdueItems.length,
      maxDelayDays,
      items: overdueItems.slice(0, 25),
    },
    relearning: {
      count: relearningItems.length,
      items: relearningItems.slice(0, 25),
    },
    stability: {
      medianS: median(stabilityValues),
      lowStabilityCount,
    },
    difficulty: {
      highDifficultyCount,
      areas: Object.entries(highDifficultyAreas)
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => b.count - a.count),
    },
    reviewHealth: {
      missingReviewedAtCount,
      missingRatingCount,
      historyEvents,
    },
  };
}

export function auditMentorInputCompleteness(context = {}) {
  const signals = context.signals || collectSchedulerSignalsForMentor(context);
  const missing = [];
  const warnings = [];
  const recommendations = [];

  if (!signals.workload || signals.workload.next7DaysMinutes == null) {
    missing.push("workload");
  }
  if (!signals.trueRetention || signals.trueRetention.collecting) {
    warnings.push("trueRetention ainda coletando");
    if (!signals.trueRetention || signals.trueRetention.pct == null) {
      missing.push("trueRetention");
    }
  }
  if ((signals.reviewHealth?.historyEvents || 0) <= 0) {
    warnings.push("muitos temas sem reviewHistory");
    missing.push("reviewHistory");
  }
  if ((signals.reviewHealth?.missingReviewedAtCount || 0) > 0) {
    warnings.push("existem revisões concluídas sem reviewedAt");
    recommendations.push("rodar migração defensiva de reviewedAt para temas legados");
  }
  if ((signals.workload?.overloadDays || 0) >= 3) {
    recommendations.push("evitar tema novo até reduzir sobrecarga da semana");
  }
  if ((signals.relearning?.count || 0) > 0) {
    recommendations.push("priorizar temas em relearning antes de expansão de cobertura");
  }

  return {
    ok: missing.length === 0,
    missing: Array.from(new Set(missing)),
    warnings: Array.from(new Set(warnings)),
    recommendations: Array.from(new Set(recommendations)),
  };
}

export function buildMentorAuditSnapshot(context = {}) {
  const signals = collectSchedulerSignalsForMentor(context);
  const completeness = auditMentorInputCompleteness({ ...context, signals });
  return {
    generatedAt: todayStr(),
    signals,
    completeness,
  };
}
