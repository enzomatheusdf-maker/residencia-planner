// src/core/agendaEngine.js
// Motor de agenda: une revisões FSRS + D0 planejado + atrasadas + simulados.
// Puro (sem UI, sem store). Aceita `_today` para facilitar testes.

import { STEP_ESTIMATED_MINUTES, todayStr, addDays, diffDays } from "./fsrs";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function priorityWeight(p) {
  switch ((p || "").toUpperCase()) {
    case "CRITICA": return 0;
    case "ALTA":    return 1;
    case "MEDIA":   return 2;
    default:        return 3;
  }
}

function stepWeight(key) {
  const order = { d1: 0, d4: 1, d7: 2, d21: 3, manutencao: 4 };
  return order[key] ?? 5;
}

function isPendingReview(review) {
  return review && !review.done && !review.skipped && review.skipReason !== "dominio_previo" && !review.skippeadoPorDominio;
}

function makeReviewItem(tema, stepKey, review, horizonDate, today) {
  if (!isPendingReview(review) || !review.date || review.date > horizonDate) return null;
  const overdue = review.date < today;
  return {
    id: `${tema.id}-${stepKey}`,
    temaId: tema.id,
    temaNome: tema.nome || "",
    area: tema.esp || tema.area || "Outro",
    stepKey,
    phase: review.phase || (stepKey === "manutencao" ? "maintenance" : "learning"),
    date: overdue ? today : review.date,
    originalDate: review.date,
    overdue,
    estimatedMinutes: STEP_ESTIMATED_MINUTES[stepKey] ?? STEP_ESTIMATED_MINUTES.d4,
    type: overdue ? "overdue" : "review",
    priority: tema.importancia || "ALTA",
    target: { temaId: tema.id, stepKey },
  };
}

// ─── Public: estimateTaskMinutes ──────────────────────────────────────────────

export function estimateTaskMinutes(item) {
  if (!item) return 0;
  if (item.estimatedMinutes != null) return item.estimatedMinutes;
  if (item.type === "new_topic" || item.type === "d0_critical") return 50;
  const stepKey = item.stepKey;
  if (item.phase === "relearning") return STEP_ESTIMATED_MINUTES.relearning;
  return STEP_ESTIMATED_MINUTES[stepKey] || STEP_ESTIMATED_MINUTES.d4;
}

// ─── Collectors ──────────────────────────────────────────────────────────────

function collectReviewItems(temas = [], horizonDate, today) {
  const items = [];

  temas.forEach((tema) => {
    if (tema.unstarted) return;
    const rev = tema.rev || {};

    // Relearning has priority over regular review scheduling.
    const rl = rev.relearning;
    if (rl && !rl.done && rl.date && rl.date <= horizonDate) {
      const overdue = rl.date < today;
      items.push({
        id: `${tema.id}-relearning`,
        temaId: tema.id,
        temaNome: tema.nome || "",
        area: tema.esp || tema.area || "Outro",
        stepKey: rl.targetStep || "d1",
        phase: "relearning",
        date: overdue ? today : rl.date,
        originalDate: rl.date,
        overdue,
        estimatedMinutes: STEP_ESTIMATED_MINUTES.relearning,
        type: "relearning",
        priority: tema.importancia || "ALTA",
        target: { temaId: tema.id, stepKey: rl.targetStep || "d1" },
      });
      return;
    }

    // Only the next real pending step is eligible. Do not project D4/D7/D21
    // while an earlier scheduled step is still pending or missing a real date.
    const reviewOrder = ["d1", "d4", "d7", "d21", "manutencao"];
    for (const stepKey of reviewOrder) {
      const item = makeReviewItem(tema, stepKey, rev[stepKey], horizonDate, today);
      if (item) items.push(item);
      if (isPendingReview(rev[stepKey])) break;
    }
  });

  return items;
}

function collectScheduledD0Items(scheduledTopics = [], temas = [], horizonDate, today) {
  const startedIds = new Set(
    temas.filter((t) => !t.unstarted && t.rev?.d0?.done).map((t) => t.id)
  );

  return scheduledTopics
    .filter((st) => {
      if (!st.scheduledDate || st.scheduledDate > horizonDate) return false;
      if (startedIds.has(st.temaId)) return false;
      return true;
    })
    .map((st) => {
      const overdue = st.scheduledDate < today;
      const isCritical = (st.priority || "").toUpperCase() === "CRITICA";
      return {
        id: `sched-d0-${st.temaId || st.id || st.scheduledDate}`,
        temaId: st.temaId || null,
        temaNome: st.tema || st.temaNome || st.temaOriginal || "",
        area: st.area || "Outro",
        stepKey: "d0",
        phase: "learning",
        date: overdue ? today : st.scheduledDate,
        originalDate: st.scheduledDate,
        overdue,
        estimatedMinutes: 50,
        type: isCritical ? "d0_critical" : "new_topic",
        priority: st.priority || "ALTA",
        distributionReason: st.distributionReason || null,
        target: { temaId: st.temaId || null, stepKey: "d0", action: "start_topic" },
      };
    });
}

function collectSimulados(simulados = [], horizonDate, today) {
  return simulados
    .filter((s) => s.date && s.date <= horizonDate && !s.done)
    .map((s) => ({
      id: `sim-${s.id || s.date}`,
      temaId: null,
      temaNome: s.nome || s.title || "Simulado",
      area: "Simulado",
      stepKey: null,
      phase: null,
      date: s.date < today ? today : s.date,
      originalDate: s.date,
      overdue: s.date < today,
      estimatedMinutes: s.estimatedMinutes || 120,
      type: "simulation",
      priority: "ALTA",
      target: { action: "simulation", simuladoId: s.id || null },
    }));
}

// ─── Public: sortAgendaItemsForDay ────────────────────────────────────────────

export function sortAgendaItemsForDay(items = []) {
  function weight(item) {
    switch (item.type) {
      case "relearning":  return 0;
      case "overdue":     return 10 + priorityWeight(item.priority);
      case "review":      return 20 + stepWeight(item.stepKey) + priorityWeight(item.priority) * 0.1;
      case "d0_critical": return 30;
      case "new_topic":   return 40 + priorityWeight(item.priority);
      case "simulation":  return 50;
      case "weekly":      return 60;
      default:            return 70;
    }
  }
  return [...items].sort((a, b) => weight(a) - weight(b));
}

// ─── Public: groupAgendaByDate ────────────────────────────────────────────────

export function groupAgendaByDate(items = []) {
  const groups = {};
  for (const item of items) {
    if (!item.date) continue;
    if (!groups[item.date]) groups[item.date] = [];
    groups[item.date].push(item);
  }
  return groups;
}

// ─── Public: getAgendaDaySummary ─────────────────────────────────────────────

export function getAgendaDaySummary(items = [], date) {
  const dayItems = date ? items.filter((i) => i.date === date) : items;
  const sorted = sortAgendaItemsForDay(dayItems);
  const totalMinutes = sorted.reduce((sum, i) => sum + estimateTaskMinutes(i), 0);

  return {
    date: date || null,
    items: sorted,
    totalItems: sorted.length,
    totalCount: sorted.length,
    estimatedMinutes: totalMinutes,
    totalMinutes,
    overdueCount: sorted.filter((i) => i.overdue).length,
    newTopicCount: sorted.filter((i) => i.type === "new_topic" || i.type === "d0_critical").length,
    newCount: sorted.filter((i) => i.type === "new_topic" || i.type === "d0_critical").length,
    reviewCount: sorted.filter((i) => i.type === "review" || i.type === "relearning" || i.type === "overdue").length,
    overloaded: totalMinutes > 180 || sorted.length > 6,
    isEmpty: sorted.length === 0,
    firstAction: sorted[0] || null,
    firstItem: sorted[0] || null,
  };
}

// ─── Public: buildAgendaItems ─────────────────────────────────────────────────

export function buildAgendaItems(
  temas = [],
  scheduledTopics = [],
  simulados = [],
  planSetup = {},
  plat = "res",
  horizonDays = 90,
  _today
) {
  const today = _today || todayStr();
  const horizonDate = addDays(today, horizonDays);

  const reviewItems = collectReviewItems(temas, horizonDate, today);
  const d0Items = collectScheduledD0Items(scheduledTopics, temas, horizonDate, today);
  const simItems = collectSimulados(simulados, horizonDate, today);

  return [...reviewItems, ...d0Items, ...simItems];
}

// ─── Public: buildAgendaMonth ─────────────────────────────────────────────────

export function buildAgendaMonth(
  temas = [],
  scheduledTopics = [],
  simulados = [],
  planSetup = {},
  plat = "res",
  monthStr,
  _today
) {
  const today = _today || todayStr();
  const ref = monthStr || today.slice(0, 7);
  const [year, month] = ref.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const pad = (n) => String(n).padStart(2, "0");
  const firstDay = `${year}-${pad(month)}-01`;
  const lastDay  = `${year}-${pad(month)}-${pad(daysInMonth)}`;

  const horizonDays = Math.max(30, diffDays(today, lastDay) + 1);
  const allItems = buildAgendaItems(temas, scheduledTopics, simulados, planSetup, plat, horizonDays, today);

  const monthItems = allItems.filter((i) => i.date >= firstDay && i.date <= lastDay);
  const grouped = groupAgendaByDate(monthItems);

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month)}-${pad(d)}`;
    days.push(getAgendaDaySummary(grouped[dateStr] || [], dateStr));
  }

  return {
    month: ref,
    days,
    totalItems: monthItems.length,
    totalMinutes: days.reduce((sum, d) => sum + d.totalMinutes, 0),
  };
}
