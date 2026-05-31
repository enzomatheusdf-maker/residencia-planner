import { buildActionInbox, pickPrimaryAction, sortActions } from "./actionInbox";
import { adjustActionForPeakMode, getPeakModePolicy, getPeakPhase, shouldLimitNewTopics } from "./peakMode";
import { featureEnabled } from "./platformFeatures";

function buildAction(type, priority, title, reason, ctaView = null, target = {}) {
  return { type, priority, title, reason, ctaView, target };
}

function toInboxAction(action = {}) {
  return {
    id: `mentor_${action.type}_${action.target?.area || action.target?.tema || "root"}`,
    type: action.type,
    title: action.title,
    reason: action.reason,
    priority: action.priority,
    source: "mentor",
    dueDate: action.dueDate,
    target: { ...action.target, view: action.ctaView || action.target?.view || null },
  };
}

export function getMentorNextAction(context = {}) {
  const plat = context.plat || "res";
  const pending = Number(context.pending || 0);
  const overdue = Number(context.overdue || 0);
  const enamed = context.enamed || {};
  const areaCritica = enamed?.resumo?.areaCritica || null;
  const materiaFracaVest = context.materiaFracaVest || context.weakSubject || null;
  const readiness = Number(context.readiness || 0);
  const examDate = context.examDate || context.meta?.dataProva;

  const phase = getPeakPhase({ examDate, today: context.today });
  const policy = getPeakModePolicy(phase);

  const candidates = [];
  if (overdue > 0) {
    candidates.push(
      buildAction(
        "revisao_vencida",
        100,
        "Resolver revisoes vencidas agora",
        "Ha revisoes vencidas, e isso corroi retencao de curto prazo.",
        "dash",
        { tema: "fila_vencida" }
      )
    );
  }
  if (pending > 0) {
    candidates.push(
      buildAction(
        "fila_do_dia",
        90,
        "Zerar fila de hoje",
        "Completar a fila de hoje mantem cadencia e protege a ofensiva.",
        "dash",
        { tema: "fila_do_dia" }
      )
    );
  }
  if (featureEnabled(plat, "enamed") && areaCritica) {
    candidates.push(
      buildAction(
        "enamed_critico",
        80,
        `Atacar lacuna de ${areaCritica}`,
        "A analise ENAMED apontou esta area como maior gargalo recente.",
        "stats",
        { area: areaCritica }
      )
    );
  } else if (!featureEnabled(plat, "enamed") && materiaFracaVest) {
    candidates.push(
      buildAction(
        "vestibular_materia_fraca",
        80,
        `Reforcar ${materiaFracaVest} hoje`,
        "Seu último simulado mostrou perda de pontos nesta matéria.",
        "stats",
        { area: materiaFracaVest }
      )
    );
  }
  if (readiness < 60) {
    candidates.push(
      buildAction(
        "fundamentos",
        70,
        "Reforcar fundamentos antes de avancar",
        featureEnabled(plat, "enamed")
          ? "Preparo estimado ainda baixo; reduzir novidade melhora eficiencia."
          : "Preparo estimado ainda baixo para a prova; consolidar base melhora acerto.",
        "crono"
      )
    );
  }

  if (!shouldLimitNewTopics({ phase, backlog: context.backlog || pending, coverage: context.coverage || readiness })) {
    candidates.push(
      buildAction(
        "new_topic",
        55,
        featureEnabled(plat, "enamed") ? "Iniciar tema novo estrategico" : "Iniciar matéria nova estratégica",
        featureEnabled(plat, "enamed")
          ? "Com a fila sob controle, o melhor ganho vem de cobertura em tema de incidencia."
          : "Com a fila sob controle, avance na cobertura da matéria com maior peso de prova.",
        "crono"
      )
    );
  }

  if (!candidates.length) {
    return {
      ...buildAction(
        "manutencao",
        10,
        "Manter consistencia leve",
        "Sem urgencia critica detectada. Siga o plano e preserve constancia.",
        "dash"
      ),
      peakPhase: phase,
      peakPolicy: policy,
    };
  }

  const adapted = candidates.map((action) => adjustActionForPeakMode(toInboxAction(action), policy));
  const inbox = buildActionInbox({
    actions: adapted,
    actionInboxState: context.actionInboxState || {},
    reflectionActions: context.reflectionActions || [],
    shouldRest: Boolean(context.lowEnergy || context.exhaustionDetected),
  });
  const primary = pickPrimaryAction(inbox) || sortActions(adapted)[0];
  const fallback = candidates.find((item) => item.type === primary?.type);

  return {
    ...(fallback || {
      type: primary?.type || "manutencao",
      priority: primary?.priority || 10,
      title: primary?.title || "Manter consistencia leve",
      reason: primary?.reason || "Sem acao prioritaria.",
      ctaView: primary?.target?.view || "dash",
    }),
    peakPhase: phase,
    peakPolicy: policy,
  };
}

export function getMentorTodayPlan(context = {}) {
  const next = getMentorNextAction(context);
  const plat = context.plat || "res";
  const plan = [next.title];
  if (next.type !== "revisao_vencida" && Number(context.pending || 0) > 0) {
    plan.push("Fechar a fila restante do dia");
  }
  if (featureEnabled(plat, "enamed") && context.enamed?.resumo?.areaCritica) {
    plan.push(`Reservar bloco para ${context.enamed.resumo.areaCritica}`);
  } else if (!featureEnabled(plat, "enamed") && (context.materiaFracaVest || context.weakSubject)) {
    plan.push(`Treinar ${context.materiaFracaVest || context.weakSubject} com simulado dirigido`);
  }
  if (next.peakPhase && next.peakPhase !== "base") {
    plan.push(`Aplicar politica de ${next.peakPhase.replace("_", " ")}`);
  }
  return plan;
}

export function explainMentorAction(action = {}) {
  if (!action?.title) return "Sem acao definida.";
  return `${action.title}: ${action.reason || "sem justificativa disponivel."}`;
}
