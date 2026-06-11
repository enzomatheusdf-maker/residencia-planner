import { legacyActionToDailyCommand } from "./dailyCommandEngine";

function normalizeCommand(input = {}, context = {}) {
  if (input?.target?.route) return input;
  return legacyActionToDailyCommand(input, context);
}

function showRebalanceToast(result, toast) {
  if (!toast) return;
  if (result?.movedCount > 0) {
    const movedLabel = result.movedCount === 1 ? "1 revisão movida" : `${result.movedCount} revisões movidas`;
    toast(`Rebalanceamento aplicado: ${movedLabel}; carga hoje ${result.beforeTodayMinutes} -> ${result.afterTodayMinutes} min.`);
    return;
  }
  toast("Nenhuma revisão elegível para mover agora.");
}

export function executeDailyCommandTarget(input, handlers = {}) {
  const command = normalizeCommand(input, { plat: handlers.plat });
  const target = command.target || {};
  const params = target.params || {};

  if (target.route === "session_closure") {
    if (handlers.openSessionClosure) handlers.openSessionClosure();
    return true;
  }

  if (target.route === "focus") {
    if (params.temaId && params.stepKey && handlers.onStudy) {
      handlers.onStudy(params.temaId, params.stepKey);
      return true;
    }
    const queueItem = handlers.queueItem || null;
    if (queueItem && handlers.onStudy) {
      handlers.onStudy(queueItem.temaId, queueItem.stepKey);
      return true;
    }
    if (handlers.setView) handlers.setView("crono");
    return true;
  }

  if (params.action === "rebalance_workload") {
    const result = handlers.rebalanceTodayWorkload
      ? handlers.rebalanceTodayWorkload(handlers.plat)
      : null;
    showRebalanceToast(result, handlers.showToast);
    return true;
  }

  if (target.route === "settings") {
    if (handlers.onOpenAjustes) {
      handlers.onOpenAjustes({ initialTab: params.tab || "ajustes" });
      return true;
    }
    if (handlers.setView) handlers.setView("crono");
    return true;
  }

  if (target.route === "agenda") {
    if (handlers.onOpenAgenda) {
      handlers.onOpenAgenda(params.date);
      return true;
    }
    if (handlers.setView) handlers.setView("crono");
    return true;
  }

  if (target.route === "clinical") {
    if (handlers.onOpenClinicalCase) {
      handlers.onOpenClinicalCase({
        caseId: params.casoId || null,
        phase: params.phase || "caso",
      });
      return true;
    }
    if (handlers.setView) handlers.setView("raciocinio");
    return true;
  }

  const viewByRoute = {
    dashboard: "dash",
    plan: "crono",
    simulations: "sims",
    stats: "stats",
    anki: "anki",
  };
  const nextView = viewByRoute[target.route];
  if (nextView && handlers.setView) {
    handlers.setView(nextView);
    return true;
  }

  if (handlers.setView) handlers.setView("dash");
  return false;
}
