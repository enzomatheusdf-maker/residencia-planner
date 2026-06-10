import { getDomainTestAgendaMeta } from "./domainTest";

export const PLAN_EXECUTION_STATES = {
  NO_PLAN: "no_plan",
  PLAN_READY_UNACCEPTED: "plan_ready_unaccepted",
  PLAN_ACCEPTED_TODAY: "plan_accepted_today",
  IN_PROGRESS: "in_progress",
  DONE_TODAY: "done_today",
  BLOCKED: "blocked",
};

function hasTarget(item) {
  return Boolean(item?.target || item?.temaId || item?.stepKey);
}

export function getAgendaTaskTarget(item = {}) {
  if (item.target) return item.target;
  if (item.type === "simulation") return { action: "simulation", simuladoId: item.simuladoId || null };
  if (item.type === "new_topic" || item.type === "d0_critical") {
    return { action: "start_topic", temaId: item.temaId || null, stepKey: "d0" };
  }
  if (item.temaId && item.stepKey) return { action: "review", temaId: item.temaId, stepKey: item.stepKey };
  return { action: "open_plan", view: "crono" };
}

export function getAgendaTaskLabel(item = {}) {
  const domainMeta = getDomainTestAgendaMeta(item.domainTestClassification);
  if (domainMeta?.taskLabel) return domainMeta.taskLabel;
  if (item.type === "simulation") return "Registrar simulado";
  if (item.type === "new_topic" || item.type === "d0_critical") return "Estudar tema";
  if (item.type === "review" || item.type === "overdue" || item.type === "relearning") return "Revisar";
  return "Ver plano";
}

export function buildPlanExecutionState({
  agendaTodaySummary = null,
  planHealth = null,
  mentorAction = null,
  acceptedToday = false,
  inProgress = false,
  doneToday = false,
} = {}) {
  const total = agendaTodaySummary?.totalItems ?? agendaTodaySummary?.totalCount ?? 0;
  const firstTask = agendaTodaySummary?.firstAction || agendaTodaySummary?.firstItem || mentorAction || null;
  const blocked = Boolean(firstTask && !hasTarget(firstTask));

  if (!planHealth && total === 0) {
    return { state: PLAN_EXECUTION_STATES.NO_PLAN, totalTasks: 0, firstTask: null, tasks: [] };
  }
  if (doneToday) {
    return { state: PLAN_EXECUTION_STATES.DONE_TODAY, totalTasks: total, firstTask, tasks: agendaTodaySummary?.items || [] };
  }
  if (blocked) {
    return { state: PLAN_EXECUTION_STATES.BLOCKED, totalTasks: total, firstTask, tasks: agendaTodaySummary?.items || [] };
  }
  if (inProgress) {
    return { state: PLAN_EXECUTION_STATES.IN_PROGRESS, totalTasks: total, firstTask, tasks: agendaTodaySummary?.items || [] };
  }
  if (acceptedToday) {
    return { state: PLAN_EXECUTION_STATES.PLAN_ACCEPTED_TODAY, totalTasks: total, firstTask, tasks: agendaTodaySummary?.items || [] };
  }
  return { state: PLAN_EXECUTION_STATES.PLAN_READY_UNACCEPTED, totalTasks: total, firstTask, tasks: agendaTodaySummary?.items || [] };
}
