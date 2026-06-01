import { STEPS, todayStr, diffDays, getWorkloadProjection } from "./fsrs";
import { calcTrueRetentionDetailed } from "../hooks/useMetrics";

function getStepEntries(rev = {}) {
  const entries = [];
  for (const step of STEPS) {
    if (rev?.[step.key]) entries.push([step.key, rev[step.key]]);
  }
  if (rev?.manutencao) entries.push(["manutencao", rev.manutencao]);
  return entries;
}

function inferWeakSubjectFromSimulados(simulados = []) {
  const latest = simulados[simulados.length - 1];
  if (!latest) return null;
  const rows = Array.isArray(latest.porArea) ? latest.porArea : [];
  if (rows.length > 0) {
    const normalized = rows
      .map((row) => {
        const total = Number(row.total || row.questoes || 0);
        const acertos = Number(row.acertos || row.hits || 0);
        if (total <= 0) return null;
        return {
          area: row.area || row.esp || row.nome || null,
          pct: (acertos / total) * 100,
        };
      })
      .filter(Boolean);
    if (normalized.length > 0) {
      normalized.sort((a, b) => a.pct - b.pct);
      return normalized[0].area || null;
    }
  }
  return null;
}

function collectClinicalCaseSignals(casosProgresso = {}, today = todayStr()) {
  const due = Object.entries(casosProgresso)
    .filter(([, item]) => item?.proximaData && item.proximaData <= today)
    .map(([casoId, item]) => ({
      casoId,
      proximaData: item.proximaData,
      atualizadoEm: item.atualizadoEm || null,
    }));
  return {
    dueCount: due.length,
    dueItems: due.slice(0, 20),
  };
}

export function collectMentorSchedulerSignals(temas = [], options = {}) {
  const today = options.today || todayStr();
  const projectionDays = options.projectionDays || 14;
  const workloadProjection = getWorkloadProjection(temas, projectionDays);
  const workloadEntries = Object.values(workloadProjection);
  const todayEntry = workloadProjection[today] || {
    count: 0,
    estimatedMinutes: 0,
    overloadLevel: "ok",
  };
  const next7DaysMinutes = workloadEntries
    .slice(0, 7)
    .reduce((sum, day) => sum + (day?.estimatedMinutes || 0), 0);
  const maxDayMinutes = workloadEntries.reduce((max, day) => Math.max(max, day?.estimatedMinutes || 0), 0);
  const overloadDays = workloadEntries.filter((day) => day?.overloadLevel !== "ok").length;

  let overdueCount = 0;
  let dueTodayCount = 0;
  let maxDelayDays = 0;
  let missingReviewedAtCount = 0;
  let missingRatingWarnings = 0;
  let reviewHistoryEvents = 0;
  const dueItems = [];
  const relearningItems = [];

  for (const tema of temas) {
    if (!tema || tema.unstarted) continue;
    const rev = tema.rev || {};
    const history = Array.isArray(rev.reviewHistory) ? rev.reviewHistory : [];
    reviewHistoryEvents += history.length;
    if (rev.meta?.schedulerWarning === "missing_rating") {
      missingRatingWarnings += 1;
    }
    if (rev.phase === "relearning" || rev.relearning?.startedAt) {
      relearningItems.push({
        temaId: tema.id,
        temaNome: tema.nome,
        esp: tema.esp,
        fromStep: rev.relearning?.fromStep || null,
        targetStep: rev.relearning?.targetStep || null,
        startedAt: rev.relearning?.startedAt || null,
      });
    }

    for (const [stepKey, step] of getStepEntries(rev)) {
      if (!step) continue;
      if (step.done && !step.reviewedAt) {
        missingReviewedAtCount += 1;
      }
      if (step.done && step.acerto == null) {
        missingRatingWarnings += 1;
      }
      if (step.done || !step.date) continue;

      if (step.date < today) {
        overdueCount += 1;
        const delayDays = Math.max(0, diffDays(step.date, today));
        maxDelayDays = Math.max(maxDelayDays, delayDays);
        dueItems.push({
          temaId: tema.id,
          temaNome: tema.nome,
          esp: tema.esp,
          stepKey,
          date: step.date,
          delayDays,
          phase: step.phase || null,
        });
      } else if (step.date === today) {
        dueTodayCount += 1;
        dueItems.push({
          temaId: tema.id,
          temaNome: tema.nome,
          esp: tema.esp,
          stepKey,
          date: step.date,
          delayDays: 0,
          phase: step.phase || null,
        });
      }
    }
  }

  dueItems.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const nextDueItem = dueItems[0] || null;
  const trueRetention = calcTrueRetentionDetailed(temas);

  return {
    workloadProjection,
    todayCount: todayEntry.count || 0,
    todayMinutes: todayEntry.estimatedMinutes || 0,
    next7DaysMinutes,
    overloadLevelToday: todayEntry.overloadLevel || "ok",
    overloadDays,
    maxDayMinutes,
    overdueCount,
    dueTodayCount,
    maxDelayDays,
    nextDueItem,
    relearningCount: relearningItems.length,
    relearningItems,
    missingRatingWarnings,
    missingReviewedAtCount,
    reviewHistoryEvents,
    trueRetentionPct: trueRetention.pct,
    trueRetentionN: trueRetention.n,
    trueRetentionTotalQuestoes: trueRetention.totalQuestoes,
    trueRetentionCollecting: trueRetention.collecting,
  };
}

export function buildMentorContext(state = {}, platArg, extras = {}) {
  const plat = platArg || state.plat || "res";
  const today = extras.today || todayStr();
  const platState = state[plat] || {};
  const temas = extras.temas || platState.temas || [];
  const simulados = extras.simulados || platState.simulados || [];
  const meta = extras.meta || state.meta || {};
  const scheduler = collectMentorSchedulerSignals(temas, {
    today,
    projectionDays: extras.projectionDays || 14,
  });

  const enamedAnalises = extras.enamedAnalises || state.enamedAnalises || [];
  const latestEnamed = enamedAnalises[enamedAnalises.length - 1] || null;
  const weakSubject = extras.weakSubject
    || meta?.areaPuxouBaixo
    || inferWeakSubjectFromSimulados(simulados);
  const clinical = collectClinicalCaseSignals(platState.casosProgresso || {}, today);
  const userAvailableMinutes = Number(meta?.tempoDisponivel || 0) > 0
    ? Number(meta.tempoDisponivel) * 60
    : null;
  const pendingExamAnalysis = Boolean(simulados.length > 0 && !latestEnamed);

  return {
    plat,
    today,
    meta,
    calendarProvider: state.calendarProvider || {},
    actionInbox: state.actionInbox || [],
    sessionReflections: state.sessionReflections || [],
    scheduler,
    enamed: latestEnamed,
    weakSubject: weakSubject || null,
    pendingExamAnalysis,
    clinical,
    readinessData: extras.readinessData || null,
    userAvailableMinutes,
    lowEnergy: Boolean(extras.lowEnergy),
    exhaustionDetected: Boolean(extras.exhaustionDetected),
  };
}
