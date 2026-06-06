import { STEPS, addDays, getEstimatedMinutesForStep, todayStr } from "./fsrs";

const DEFAULT_TARGET_MINUTES = 120;
const DEFAULT_MAX_ITEMS_TODAY = 30;
const REBALANCE_HORIZON_DAYS = 30;

function isPendingReview(step = {}) {
  return Boolean(
    step
      && !step.done
      && !step.skipped
      && step.skipReason !== "dominio_previo"
      && !step.skippeadoPorDominio
      && step.date
  );
}

function stepRank(stepKey) {
  const index = STEPS.findIndex((step) => step.key === stepKey);
  if (index >= 0) return index;
  if (stepKey === "manutencao") return STEPS.length;
  return STEPS.length + 1;
}

function sortByKeepPriority(a, b) {
  const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
  if (dateCompare !== 0) return dateCompare;
  const rankCompare = stepRank(a.stepKey) - stepRank(b.stepKey);
  if (rankCompare !== 0) return rankCompare;
  return String(a.temaNome || "").localeCompare(String(b.temaNome || ""));
}

function collectPendingReviews(temas = [], today) {
  const steps = [...STEPS.map((step) => step.key), "manutencao"];
  const items = [];

  temas.forEach((tema) => {
    if (!tema || tema.unstarted) return;
    const rev = tema.rev || {};

    steps.forEach((stepKey) => {
      const step = rev[stepKey];
      if (!isPendingReview(step)) return;

      items.push({
        temaId: tema.id,
        temaNome: tema.nome || "",
        stepKey,
        date: step.date,
        dueToday: step.date <= today,
        estimatedMinutes: getEstimatedMinutesForStep(stepKey, step),
      });
    });
  });

  return items;
}

function findNextDate(schedule, item, options) {
  const { today, targetMinutes, maxItemsToday } = options;

  for (let offset = 1; offset <= REBALANCE_HORIZON_DAYS; offset += 1) {
    const date = addDays(today, offset);
    const slot = schedule[date] || { count: 0, minutes: 0 };
    if (slot.count < maxItemsToday && slot.minutes + item.estimatedMinutes <= targetMinutes) {
      return date;
    }
  }

  return addDays(today, REBALANCE_HORIZON_DAYS + 1);
}

export function rebalanceWorkloadForToday(temas = [], options = {}) {
  const today = options.today || todayStr();
  const targetMinutes = Math.max(1, Number(options.targetMinutes) || DEFAULT_TARGET_MINUTES);
  const maxItemsToday = Math.max(1, Number(options.maxItemsToday) || DEFAULT_MAX_ITEMS_TODAY);
  const allItems = collectPendingReviews(temas, today);
  const dueItems = allItems.filter((item) => item.dueToday).sort(sortByKeepPriority);
  const beforeTodayMinutes = dueItems.reduce((sum, item) => sum + item.estimatedMinutes, 0);

  if (dueItems.length <= 1 || (beforeTodayMinutes <= targetMinutes && dueItems.length <= maxItemsToday)) {
    return {
      temas,
      movedCount: 0,
      beforeTodayMinutes,
      afterTodayMinutes: beforeTodayMinutes,
      beforeTodayCount: dueItems.length,
      afterTodayCount: dueItems.length,
      targetMinutes,
      maxItemsToday,
      movedItems: [],
    };
  }

  let afterTodayMinutes = beforeTodayMinutes;
  let afterTodayCount = dueItems.length;
  const moved = [];

  for (let index = dueItems.length - 1; index >= 0; index -= 1) {
    if (afterTodayMinutes <= targetMinutes && afterTodayCount <= maxItemsToday) break;
    if (afterTodayCount <= 1) break;

    const item = dueItems[index];
    moved.push(item);
    afterTodayMinutes -= item.estimatedMinutes;
    afterTodayCount -= 1;
  }

  if (moved.length === 0) {
    return {
      temas,
      movedCount: 0,
      beforeTodayMinutes,
      afterTodayMinutes,
      beforeTodayCount: dueItems.length,
      afterTodayCount: dueItems.length,
      targetMinutes,
      maxItemsToday,
      movedItems: [],
    };
  }

  const movedKeySet = new Set(moved.map((item) => `${item.temaId}::${item.stepKey}`));
  const schedule = {};
  allItems.forEach((item) => {
    const key = `${item.temaId}::${item.stepKey}`;
    if (item.date <= today || movedKeySet.has(key)) return;
    if (!schedule[item.date]) schedule[item.date] = { count: 0, minutes: 0 };
    schedule[item.date].count += 1;
    schedule[item.date].minutes += item.estimatedMinutes;
  });

  const movedByKey = {};
  moved
    .sort(sortByKeepPriority)
    .forEach((item) => {
      const newDate = findNextDate(schedule, item, { today, targetMinutes, maxItemsToday });
      if (!schedule[newDate]) schedule[newDate] = { count: 0, minutes: 0 };
      schedule[newDate].count += 1;
      schedule[newDate].minutes += item.estimatedMinutes;
      movedByKey[`${item.temaId}::${item.stepKey}`] = { ...item, newDate };
    });

  const nextTemas = temas.map((tema) => {
    if (!tema || tema.unstarted || !tema.rev) return tema;

    let changed = false;
    const nextRev = { ...tema.rev };
    Object.keys(nextRev).forEach((stepKey) => {
      const movedItem = movedByKey[`${tema.id}::${stepKey}`];
      if (!movedItem) return;
      nextRev[stepKey] = { ...nextRev[stepKey], date: movedItem.newDate };
      changed = true;
    });

    return changed ? { ...tema, rev: nextRev } : tema;
  });

  return {
    temas: nextTemas,
    movedCount: moved.length,
    beforeTodayMinutes,
    afterTodayMinutes,
    beforeTodayCount: dueItems.length,
    afterTodayCount,
    targetMinutes,
    maxItemsToday,
    movedItems: Object.values(movedByKey),
  };
}
