// src/core/scheduleWizard.js
// Cálculo de viabilidade + geração de planSetup.
// Puro (sem UI, sem store, sem Firebase).

import { todayStr, addDays, diffDays } from "./fsrs";

// Mapeamento: chave do studyDays → getDay() (0=dom, 1=seg, ..., 6=sab)
const DAY_KEY_TO_JS = {
  dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6,
};

const ALL_DAY_KEYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
export const MAX_WEEKLY_NEW_TOPICS = 30;

export function normalizeWeeklyTopicLimit(value, fallback = 6) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(MAX_WEEKLY_NEW_TOPICS, Math.round(parsed)));
}

export function calculateRedistributionSummary(totalTopics = 0, topicsPerWeek = 6) {
  const weeklyLimit = normalizeWeeklyTopicLimit(topicsPerWeek);
  const total = Math.max(0, Number(totalTopics) || 0);
  return {
    totalTopics: total,
    topicsPerWeek: weeklyLimit,
    estimatedWeeks: total > 0 ? Math.ceil(total / weeklyLimit) : 0,
    warning: weeklyLimit > MAX_WEEKLY_NEW_TOPICS ? "weekly_limit_clamped" : null,
  };
}

// ─── calculateWeeklyCapacity ──────────────────────────────────────────────────

/**
 * Soma dos maxNewTopics de todos os dias ativos da semana.
 * @param {Object} studyDays - { dom:{active,maxNewTopics}, seg:{...}, ... }
 * @returns {number}
 */
export function calculateWeeklyCapacity(studyDays = {}) {
  return ALL_DAY_KEYS.reduce((sum, key) => {
    const day = studyDays[key];
    if (!day || !day.active) return sum;
    return sum + Math.max(0, Number(day.maxNewTopics) || 0);
  }, 0);
}

// ─── calculatePlanningHorizon ─────────────────────────────────────────────────

/**
 * Retorna o número de semanas disponíveis para distribuição.
 * @param {string} startDate  - "YYYY-MM-DD"
 * @param {string|null} targetDate
 * @param {"target_date"|"duration"} horizonMode
 * @param {number} horizonMonths - usado quando horizonMode === "duration"
 * @returns {{ endDate:string, totalDays:number, totalWeeks:number }}
 */
export function calculatePlanningHorizon(startDate, targetDate, horizonMode, horizonMonths = 6) {
  const start = startDate || todayStr();
  let endDate;

  if (horizonMode === "target_date" && targetDate) {
    endDate = targetDate;
  } else {
    endDate = addDays(start, Math.round(horizonMonths * 30.44));
  }

  const totalDays  = Math.max(0, diffDays(start, endDate));
  const totalWeeks = Math.max(0, Math.floor(totalDays / 7));

  return { endDate, totalDays, totalWeeks };
}

// ─── calculateFeasibility ─────────────────────────────────────────────────────

/**
 * Verifica se o plano é viável dada a capacidade e o número de tópicos.
 * @param {Object} planSetup
 * @param {Array}  topics - lista de tópicos a distribuir
 * @returns {{ availableCapacity, totalTopics, ratio, status, warnings }}
 */
export function calculateFeasibility(planSetup = {}, topics = []) {
  const {
    startDate,
    targetDate,
    horizonMode = "duration",
    horizonMonths = 6,
    studyDays = {},
  } = planSetup;

  const weeklyCapacity = calculateWeeklyCapacity(studyDays);
  const { totalWeeks } = calculatePlanningHorizon(startDate, targetDate, horizonMode, horizonMonths);
  const availableCapacity = weeklyCapacity * totalWeeks;
  const totalTopics = topics.length;
  const ratio = availableCapacity > 0 ? totalTopics / availableCapacity : Infinity;

  let status;
  if (ratio <= 0.75)        status = "comfortable";
  else if (ratio <= 1.0)    status = "feasible";
  else if (ratio <= 1.25)   status = "tight";
  else                      status = "infeasible";

  const warnings = [];

  if (totalTopics > availableCapacity) {
    warnings.push({
      code: "capacity_overflow",
      message: `${totalTopics} tópicos para ${availableCapacity} vagas disponíveis.`,
      severity: "error",
    });
  }

  // Verifica se algum dia tem > 6 tópicos novos
  const maxPerDay = Math.max(
    ...ALL_DAY_KEYS.map((k) => (studyDays[k]?.active ? Number(studyDays[k]?.maxNewTopics || 0) : 0))
  );
  if (maxPerDay > 6) {
    warnings.push({
      code: "too_many_topics_per_day",
      message: `${maxPerDay} tópicos/dia é muito alto — risco de saturação.`,
      severity: "warning",
    });
  }

  // Verifica se há pelo menos 1 dia de descanso por semana
  const activeDaysCount = ALL_DAY_KEYS.filter((k) => studyDays[k]?.active).length;
  if (activeDaysCount >= 7) {
    warnings.push({
      code: "no_rest_day",
      message: "Nenhum dia de descanso na semana.",
      severity: "warning",
    });
  }

  // Horizonte muito curto
  if (totalWeeks < 4) {
    warnings.push({
      code: "target_date_too_close",
      message: `Apenas ${totalWeeks} semanas disponíveis — horizonte muito curto.`,
      severity: totalWeeks < 2 ? "error" : "warning",
    });
  }

  return { availableCapacity, totalTopics, ratio, status, warnings };
}

// ─── selectTopicsByScope ──────────────────────────────────────────────────────

/**
 * Filtra tópicos pelo escopo escolhido.
 * essential  → importancia CRITICA + ALTA
 * complete   → todos
 * intensive  → todos (ordenação mais densa no distributeTopics)
 */
export function selectTopicsByScope(topics = [], scopeMode = "essential") {
  if (scopeMode === "complete" || scopeMode === "intensive") return topics;
  // essential: só CRITICA e ALTA
  return topics.filter((t) => {
    const imp = (t.importancia || t.priority || "ALTA").toUpperCase();
    return imp === "CRITICA" || imp === "ALTA";
  });
}

const PRIORITY_ORDER = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };

function normalizeTopicArea(topic = {}) {
  return topic.esp || topic.area || topic.areaCanonica || "Outro";
}

function getTopicPriorityRank(topic = {}) {
  return PRIORITY_ORDER[(topic.importancia || topic.priority || "ALTA").toUpperCase()] ?? 2;
}

/**
 * Ordena tópicos sem data explícita preservando prioridade e alternando áreas
 * dentro do mesmo nível. Isso evita semanas monotemáticas sem rebaixar CRITICA/ALTA.
 */
export function balanceTopicsByArea(topics = []) {
  const queuesByArea = new Map();

  topics
    .map((topic, index) => ({ topic, index }))
    .sort((a, b) => {
      const priorityDiff = getTopicPriorityRank(a.topic) - getTopicPriorityRank(b.topic);
      if (priorityDiff !== 0) return priorityDiff;
      return a.index - b.index;
    })
    .forEach((item) => {
      const area = normalizeTopicArea(item.topic);
      if (!queuesByArea.has(area)) queuesByArea.set(area, []);
      queuesByArea.get(area).push(item);
    });

  const balanced = [];
  let lastArea = null;

  while ([...queuesByArea.values()].some((queue) => queue.length > 0)) {
    const available = [...queuesByArea.entries()].filter(([, queue]) => queue.length > 0);
    const bestPriority = Math.min(...available.map(([, queue]) => getTopicPriorityRank(queue[0].topic)));
    const samePriority = available.filter(([, queue]) => getTopicPriorityRank(queue[0].topic) === bestPriority);
    let preferred = samePriority[0];
    for (const candidate of samePriority) {
      if (candidate[0] !== lastArea) {
        preferred = candidate;
        break;
      }
    }
    const [area, queue] = preferred;

    balanced.push(queue.shift().topic);
    lastArea = area;
  }

  return balanced;
}

// ─── distributeTopics ─────────────────────────────────────────────────────────

/**
 * Distribui tópicos pelos dias ativos do planSetup.
 * Regras:
 * - Usa data explícita do tópico (t.scheduledDate / t.d0) quando disponível.
 * - Respeita dias ativos e maxNewTopics/dia.
 * - Overflow → próximas datas (nunca descarta tópico).
 * - Retorna Array<scheduledTopic>: { temaId, area, scheduledDate, scheduledWeek, distributionReason, priority }
 */
export function distributeTopics(topics = [], planSetup = {}, startDate, _today) {
  const today = _today || todayStr();
  const effectiveStart = startDate || planSetup.startDate || today;
  const { studyDays = {}, scopeMode = "essential" } = planSetup;

  // Separar os que têm data explícita dos que precisam ser agendados
  const withDate    = [];
  const withoutDate = [];

  topics.forEach((t) => {
    const explicit = t.scheduledDate || t.d0 || null;
    if (explicit && explicit >= effectiveStart) {
      withDate.push({ ...t, _explicit: explicit });
    } else {
      withoutDate.push(t);
    }
  });

  // Resultado
  const result = [];

  // Helper: semana relativa
  function weekLabel(dateStr) {
    const diff = diffDays(effectiveStart, dateStr);
    const weekNum = Math.floor(diff / 7) + 1;
    return `Semana ${weekNum}`;
  }

  // Tópicos com data explícita: respeitar mas checar capacidade
  withDate.forEach((t) => {
    result.push({
      temaId: t.id || t.temaId,
      area: t.esp || t.area || t.areaCanonica || "Outro",
      scheduledDate: t._explicit,
      scheduledWeek: weekLabel(t._explicit),
      distributionReason: "explicit_date",
      priority: t.importancia || t.priority || "ALTA",
      temaNome: t.nome || t.temaOriginal || "",
    });
  });

  // Para os sem data: construir slot iterator
  // Capacidade diária: { "YYYY-MM-DD": slotsLeft }
  const capacityMap = {};

  function ensureCapacity(dateStr) {
    if (capacityMap[dateStr] !== undefined) return;
    const jsDay = new Date(dateStr + "T12:00:00").getDay();
    const dayKey = ALL_DAY_KEYS.find((k) => DAY_KEY_TO_JS[k] === jsDay);
    const dayConfig = dayKey ? studyDays[dayKey] : null;
    capacityMap[dateStr] = dayConfig?.active ? Math.max(0, Number(dayConfig.maxNewTopics) || 0) : 0;
  }

  function findNextSlot(fromDate) {
    let cursor = fromDate;
    for (let i = 0; i < 365 * 2; i++) {
      ensureCapacity(cursor);
      if (capacityMap[cursor] > 0) return cursor;
      cursor = addDays(cursor, 1);
    }
    return cursor; // fallback (não deve chegar aqui)
  }

  let cursor = effectiveStart;

  const sorted = balanceTopicsByArea(withoutDate);

  sorted.forEach((t) => {
    const slot = findNextSlot(cursor);
    ensureCapacity(slot);
    capacityMap[slot] -= 1;

    result.push({
      temaId: t.id || t.temaId,
      area: normalizeTopicArea(t),
      scheduledDate: slot,
      scheduledWeek: weekLabel(slot),
      distributionReason: scopeMode === "intensive" ? "intensive_pack" : "auto",
      priority: t.importancia || t.priority || "ALTA",
      temaNome: t.nome || t.temaOriginal || "",
    });

    // Avança cursor se slot lotou
    if (capacityMap[slot] <= 0) {
      cursor = addDays(slot, 1);
    } else {
      cursor = slot;
    }
  });

  return result.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

// ─── buildSchedulePreview ─────────────────────────────────────────────────────

/**
 * Gera preview (sem persistir): feasibility + primeiros 30 dias de scheduledTopics.
 */
export function buildSchedulePreview(planSetup = {}, topics = [], _today) {
  const scoped = selectTopicsByScope(topics, planSetup.scopeMode);
  const feasibility = calculateFeasibility(planSetup, scoped);
  const scheduledTopics = distributeTopics(scoped, planSetup, planSetup.startDate, _today);

  const today = _today || todayStr();
  const previewEnd = addDays(today, 30);
  const preview30d = scheduledTopics.filter((t) => t.scheduledDate <= previewEnd);

  return {
    feasibility,
    scheduledTopics,
    preview30d,
    totalScheduled: scheduledTopics.length,
    scopeMode: planSetup.scopeMode || "essential",
  };
}

// ─── generateSchedule ────────────────────────────────────────────────────────

/**
 * Gera e retorna o array de scheduledTopics completo.
 * Chamado pelo onboardingEngine ao persistir o planSetup.
 */
export function generateSchedule(planSetup = {}, topics = [], _today) {
  const scoped = selectTopicsByScope(topics, planSetup.scopeMode);
  return distributeTopics(scoped, planSetup, planSetup.startDate, _today);
}
