const ROUTES = new Set([
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

const TYPE_MAP = {
  pending_closure: "continue_session",
  scheduler_warning: "adjust_plan",
  workload_relief: "adjust_plan",
  relearning: "rescue_topic",
  revisao_vencida: "overdue_review",
  fila_do_dia: "today_review",
  replan_intention: "adjust_plan",
  simulation: "simulation",
  exam_analysis: "simulation_audit",
  enamed_critico: "rescue_topic",
  vestibular_materia_fraca: "rescue_topic",
  clinical_case: "clinical_reasoning",
  new_topic: "new_topic",
  interleaving_block: "today_review",
  anki_check: "anki",
  rest: "rest_or_light_day",
};

const VIEW_ROUTE_MAP = {
  dash: "dashboard",
  focus: "focus",
  crono: "plan",
  agenda: "agenda",
  ajustes: "settings",
  settings: "settings",
  sims: "simulations",
  stats: "stats",
  anki: "anki",
  raciocinio: "clinical",
};

function compact(list = []) {
  return list.filter((item) => item != null && item !== "");
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeRoute(route) {
  return ROUTES.has(route) ? route : "dashboard";
}

function mapViewToRoute(view) {
  return VIEW_ROUTE_MAP[view] || normalizeRoute(view);
}

function buildTargetForAction(action = {}) {
  const target = action.target || {};
  if (target.route) {
    return {
      route: normalizeRoute(target.route),
      params: target.params || {},
    };
  }

  if (target.temaId && target.stepKey) {
    return {
      route: "focus",
      params: {
        temaId: target.temaId,
        stepKey: target.stepKey,
        phase: target.phase || null,
      },
    };
  }

  if (target.action === "close_today_queue") {
    return { route: "focus", params: { mode: "queue", plat: target.plat || action.plat || null } };
  }

  if (["fila_do_dia", "revisao_vencida", "relearning"].includes(action.type)) {
    return { route: "focus", params: { mode: "queue", plat: target.plat || action.plat || null } };
  }

  if (target.action === "rebalance_workload") {
    return { route: "dashboard", params: { action: "rebalance_workload", plat: target.plat || action.plat || null } };
  }

  if (target.action === "replan_intention") {
    return { route: "settings", params: { tab: "ajustes", action: "replan_intention" } };
  }

  if (target.action === "simulation" || target.action === "analyze_exam") {
    return { route: "simulations", params: { ...target } };
  }

  if (target.action === "anki_quick_block") {
    return { route: "anki", params: { action: "anki_quick_block" } };
  }

  if (target.action === "corrective_action" || target.action === "audit_review_data") {
    return { route: "stats", params: { ...target } };
  }

  if (target.action === "start_new_topic" || target.action === "open_plan") {
    return { route: "plan", params: { ...target } };
  }

  if (target.action === "interleaving_block") {
    return { route: "focus", params: { ...target } };
  }

  if (action.type === "clinical_case") {
    return { route: "clinical", params: { casoId: target.casoId || null } };
  }

  return {
    route: mapViewToRoute(action.ctaView || target.view || "dashboard"),
    params: { ...target },
  };
}

function expectedBenefitFor(type) {
  switch (type) {
    case "continue_session":
      return "Fecha o ciclo de execução e evita perder contexto da sessão.";
    case "overdue_review":
      return "Reduz atraso e protege retenção antes de abrir novas frentes.";
    case "today_review":
      return "Mantém a curva diária previsível.";
    case "simulation_audit":
      return "Transforma resultado de prova em plano tático.";
    case "simulation":
      return "Calibra desempenho e revela gargalos.";
    case "anki":
      return "Mantém reforço leve de memória com baixo custo.";
    case "clinical_reasoning":
      return "Consolida aplicação clínica após a base teórica.";
    case "adjust_plan":
      return "Recoloca o plano dentro da capacidade atual.";
    case "new_topic":
      return "Aumenta cobertura quando a fila está segura.";
    case "plan_setup":
      return "Libera uma primeira ação real para o dia.";
    default:
      return "Mantém consistência sem criar sobrecarga.";
  }
}

function riskFor(type) {
  switch (type) {
    case "continue_session":
      return "Sem fechamento, o Mentor perde sinal de ajuste e fadiga.";
    case "overdue_review":
      return "Atrasos acumulados aumentam custo de recuperação.";
    case "today_review":
      return "A fila pode virar atraso amanhã.";
    case "simulation_audit":
      return "Erros de prova ficam sem conversão para plano.";
    case "anki":
      return "Cards e erros leves podem sair da rotina.";
    case "adjust_plan":
      return "O plano pode seguir inviavel e gerar rebalanceamentos repetidos.";
    case "new_topic":
      return "Cobertura fica parada apesar de capacidade disponível.";
    case "plan_setup":
      return "Sem plano, o Dashboard fica sem próxima ação confiável.";
    default:
      return "Perder o ritmo hoje pode dificultar a retomada.";
  }
}

function toneFor(action = {}, type) {
  if (action.safety === "critical") return "red";
  if (action.safety === "caution") return "amber";
  if (["new_topic", "rest_or_light_day", "anki"].includes(type)) return "emerald";
  return "blue";
}

function sourceSignalsFor(action = {}, context = {}) {
  const scheduler = context.scheduler || {};
  return compact([
    action.source || "mentor-v2",
    action.type ? `action:${action.type}` : null,
    scheduler.dueTodayCount != null ? `dueToday:${scheduler.dueTodayCount}` : null,
    scheduler.overdueCount != null ? `overdue:${scheduler.overdueCount}` : null,
    scheduler.todayMinutes != null ? `minutes:${scheduler.todayMinutes}` : null,
    context.plat ? `track:${context.plat}` : null,
  ]);
}

export function legacyActionToDailyCommand(action = {}, context = {}) {
  const type = TYPE_MAP[action.type] || action.type || "rest_or_light_day";
  const target = buildTargetForAction(action);
  const reason = action.reason || action.subtitle || "Sem urgência crítica detectada.";
  const explain = Array.isArray(action.explain) && action.explain.length > 0
    ? action.explain
    : compact([reason]);

  return {
    id: action.id || `daily_${type}_${context.plat || "root"}`,
    type,
    title: action.title || "Manter consistência leve",
    reason,
    subtitle: action.subtitle || reason,
    expectedBenefit: action.expectedBenefit || expectedBenefitFor(type),
    riskIfIgnored: action.riskIfIgnored || riskFor(type),
    estimatedMinutes: safeNumber(action.estimatedMinutes, 15),
    priority: safeNumber(action.priority, 30),
    target,
    sourceSignals: sourceSignalsFor(action, context),
    blockedReason: action.blockedReason || null,
    primaryLabel: action.cta || "Executar ação",
    secondaryLabel: "Ver por que",
    tone: toneFor(action, type),
    explain,
    source: action.source || "mentor-v2",
    legacyAction: action,
  };
}

export function buildPendingClosureCommand(pendingClosure = {}, context = {}) {
  const theme = pendingClosure.theme || {};
  return {
    id: `daily_continue_session_${theme.id || context.plat || "root"}`,
    type: "continue_session",
    title: "Sessão sem fechamento",
    reason: "Uma sessão de estudos foi interrompida sem registro adequado de fechamento.",
    subtitle: "Uma sessão de estudos foi interrompida no meio sem o registro adequado e/ou finalização com reflexão.",
    expectedBenefit: expectedBenefitFor("continue_session"),
    riskIfIgnored: riskFor("continue_session"),
    estimatedMinutes: 5,
    priority: 100,
    target: {
      route: "session_closure",
      params: {
        temaId: theme.id || null,
        stepKey: pendingClosure.stepKey || "",
      },
    },
    sourceSignals: compact(["session_closure", context.plat ? `track:${context.plat}` : null]),
    blockedReason: null,
    primaryLabel: "Registrar fechamento",
    secondaryLabel: "Dispensar alerta",
    tone: "amber",
    explain: ["Fechar a sessão atualiza o ciclo de feedback do Mentor."],
    source: "session-closure",
  };
}

export function buildPlanSetupCommand(context = {}) {
  return {
    id: `daily_plan_setup_${context.plat || "root"}`,
    type: "plan_setup",
    title: "Configurar plano inicial",
    reason: "Sem plano completo, o Comando do Dia não consegue escolher uma ação segura.",
    subtitle: "Defina prova, calendário e preferências para liberar a primeira ação real.",
    expectedBenefit: expectedBenefitFor("plan_setup"),
    riskIfIgnored: riskFor("plan_setup"),
    estimatedMinutes: 5,
    priority: 98,
    target: { route: "settings", params: { tab: "ajustes", action: "plan_setup" } },
    sourceSignals: compact(["plan_setup", context.plat ? `track:${context.plat}` : null]),
    blockedReason: "plan_setup_incomplete",
    primaryLabel: "Configurar agora",
    secondaryLabel: "Ver por que",
    tone: "blue",
    explain: ["Sem plano, a interface só consegue oferecer atalhos genéricos."],
    source: "daily-command-engine",
  };
}

export function buildFallbackCommand(context = {}) {
  return {
    id: `daily_rest_${context.plat || "root"}`,
    type: "rest_or_light_day",
    title: "Bloco leve ou descanso ativo",
    reason: "Sem urgências detectadas, uma ação leve preserva consistência.",
    subtitle: "Sem urgência crítica detectada. Siga o plano com ritmo sustentável.",
    expectedBenefit: expectedBenefitFor("rest_or_light_day"),
    riskIfIgnored: riskFor("rest_or_light_day"),
    estimatedMinutes: 20,
    priority: 30,
    target: { route: "stats", params: { action: "light_block_or_rest" } },
    sourceSignals: compact(["fallback", context.plat ? `track:${context.plat}` : null]),
    blockedReason: null,
    primaryLabel: "Ver estatísticas",
    secondaryLabel: "Ver por que",
    tone: "emerald",
    explain: ["Use o bloco leve se quiser manter contato sem gerar sobrecarga."],
    source: "daily-command-engine",
  };
}

export function buildDailyCommand(input = {}) {
  const snapshot = input.snapshot || {};
  const context = input.context || snapshot.context || {};

  if (input.pendingClosure?.hasPendingClosure) {
    return buildPendingClosureCommand(input.pendingClosure, context);
  }

  if (input.requirePlanSetup) {
    return buildPlanSetupCommand(context);
  }

  const action = input.action || snapshot.primaryAction || snapshot.mentorAction || null;
  if (action) {
    return legacyActionToDailyCommand(action, context);
  }

  return buildFallbackCommand(context);
}
