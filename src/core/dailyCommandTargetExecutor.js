import { legacyActionToDailyCommand } from "./dailyCommandEngine";

const KNOWN_ROUTES = new Set([
  "dashboard",
  "focus",
  "agenda",
  "plan",
  "settings",
  "simulations",
  "stats",
  "anki",
  "clinical",
  "session_closure",
]);

const viewByRoute = {
  dashboard: "dash",
  plan: "crono",
  simulations: "sims",
  stats: "stats",
  anki: "anki",
};

function normalizeCommand(input = {}, context = {}) {
  if (input?.target?.route) return input;
  return legacyActionToDailyCommand(input, context);
}

function buildResult(outcome, route, params) {
  return {
    ok: outcome === "handled" || outcome === "fallback_view",
    outcome,
    route: route || "unknown",
    params: params || {},
  };
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
  const hadExplicitRoute = Boolean(input?.target?.route);
  const command = normalizeCommand(input, { plat: handlers.plat });
  const target = command.target || {};
  const params = target.params || {};
  const route = target.route || "dashboard";

  const missingHandler = (fallbackView) => {
    if (fallbackView && handlers.setView) handlers.setView(fallbackView);
    return buildResult("missing_handler", route, params);
  };

  if (!KNOWN_ROUTES.has(route)) {
    if (handlers.setView) handlers.setView("dash");
    return buildResult("unknown_route", route, params);
  }

  if (route === "session_closure") {
    if (!handlers.openSessionClosure) return buildResult("missing_handler", route, params);
    handlers.openSessionClosure();
    return buildResult("handled", route, params);
  }

  if (route === "focus") {
    if (params.temaId && params.stepKey && handlers.onStudy) {
      handlers.onStudy(params.temaId, params.stepKey);
      return buildResult("handled", route, params);
    }
    const queueItem = handlers.queueItem || null;
    if (queueItem && handlers.onStudy) {
      handlers.onStudy(queueItem.temaId, queueItem.stepKey);
      return buildResult("handled", route, params);
    }
    return missingHandler("crono");
  }

  if (params.action === "rebalance_workload") {
    if (!handlers.rebalanceTodayWorkload) return missingHandler("dash");
    const result = handlers.rebalanceTodayWorkload
      ? handlers.rebalanceTodayWorkload(handlers.plat)
      : null;
    showRebalanceToast(result, handlers.showToast);
    return buildResult("handled", route, params);
  }

  if (route === "settings") {
    if (handlers.onOpenAjustes) {
      handlers.onOpenAjustes({ initialTab: params.tab || "ajustes" });
      return buildResult("handled", route, params);
    }
    return missingHandler("crono");
  }

  if (route === "agenda") {
    if (handlers.onOpenAgenda) {
      handlers.onOpenAgenda(params.date);
      return buildResult("handled", route, params);
    }
    return missingHandler("crono");
  }

  if (route === "clinical") {
    if (handlers.onOpenClinicalCase) {
      handlers.onOpenClinicalCase({
        caseId: params.casoId || null,
        phase: params.phase || "caso",
      });
      return buildResult("handled", route, params);
    }
    return missingHandler("raciocinio");
  }

  const nextView = viewByRoute[route];
  if (nextView && handlers.setView) {
    handlers.setView(nextView);
    return buildResult(!hadExplicitRoute && route === "dashboard" ? "fallback_view" : "handled", route, params);
  }

  return buildResult("missing_handler", route, params);
}
