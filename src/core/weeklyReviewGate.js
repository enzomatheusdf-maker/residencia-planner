import { addDays, todayStr } from "./fsrs";

function collectDates(context = {}) {
  const dates = [];

  for (const tema of context.temas || []) {
    if (tema?.d0) dates.push(tema.d0);
    if (tema?.createdAt) dates.push(String(tema.createdAt).slice(0, 10));
  }

  for (const reflection of context.sessionReflections || []) {
    if (reflection?.date) dates.push(reflection.date);
  }

  for (const simulado of context.simulados || []) {
    if (simulado?.data) dates.push(simulado.data);
  }

  return dates.filter(Boolean).sort();
}

export function canShowWeeklyReview(context = {}) {
  const sessionsCompleted = Number(context.sessionsCompleted ?? context.sessionReflections?.length ?? 0);
  const trackedVolume = Number(context.trackedVolume ?? 0);
  if (sessionsCompleted >= 5 || trackedVolume >= 20) return true;

  const firstDate = context.firstActivityDate || collectDates(context)[0];
  if (!firstDate) return false;

  const threshold = addDays(context.today || todayStr(), -6);
  return firstDate <= threshold;
}

export function buildContextualWeeklyActions(context = {}) {
  const actions = [];

  if (!context.hasSchedule) {
    actions.push({ id: "import_calendar", label: "Importar cronograma", action: { type: "import_calendar", label: "Importar cronograma" } });
  }
  if ((context.sessionsCompleted ?? 0) === 0) {
    actions.push({ id: "first_cycle", label: "Começar primeiro ciclo", action: { type: "setView", view: "crono", label: "Começar primeiro ciclo" } });
  }
  if (context.weakArea) {
    actions.push({ id: "focus_area", label: "Focar área fraca", action: { type: "focar", esp: context.weakArea, label: "Focar área fraca" } });
  }
  if (context.hasUnstartedTopics) {
    actions.push({ id: "ja_domino", label: "Usar Já domino", action: { type: "ja_domino", label: "Usar Já domino" } });
  }
  if ((context.overdueCount ?? 0) > 0) {
    actions.push({ id: "recover_overdue", label: "Recuperar atrasadas", action: { type: "setView", view: "crono", label: "Recuperar atrasadas" } });
  }

  return actions.slice(0, 3);
}

export const WEEKLY_REVIEW_LOCKED_MESSAGE =
  "Sua revisão semanal será liberada após alguns dias de uso. Por enquanto, conclua o primeiro ciclo.";
