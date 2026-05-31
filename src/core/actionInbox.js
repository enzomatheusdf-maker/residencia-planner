function pad2(value) {
  return String(value).padStart(2, "0");
}

function toIsoDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function slug(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildActionId(input = {}) {
  if (input.id) return input.id;
  const type = input.type || "rest";
  const target = input.target || {};
  const seedTema = target.tema || target.area || input.title || "acao";
  const dueDate = input.dueDate || input.createdAt || toIsoDate();
  const source = input.source || "manual";
  return `act_${slug(type)}_${slug(seedTema).slice(0, 24)}_${slug(source)}_${dueDate}`;
}

export function createAction(input = {}) {
  const createdAt = input.createdAt || toIsoDate();
  const dueDate = input.dueDate || createdAt;
  return {
    id: buildActionId({ ...input, createdAt, dueDate }),
    type: input.type || "rest",
    title: input.title || "Acao recomendada",
    reason: input.reason || "Sem motivo informado.",
    priority: toNumber(input.priority, 50),
    source: input.source || "manual",
    status: input.status || "open",
    createdAt,
    dueDate,
    target: input.target && typeof input.target === "object" ? input.target : {},
  };
}

function buildDedupeKey(action = {}) {
  const target = action.target || {};
  return [
    action.type || "rest",
    slug(target.tema || ""),
    slug(target.area || ""),
    action.dueDate || "",
  ].join("|");
}

export function dedupeActions(actions = []) {
  const byKey = new Map();
  for (const rawAction of actions) {
    const action = createAction(rawAction);
    const key = buildDedupeKey(action);
    const previous = byKey.get(key);
    if (!previous || action.priority > previous.priority) {
      byKey.set(key, action);
    }
  }
  return Array.from(byKey.values());
}

export function actionNeedsAttention(action = {}, today) {
  const todayIso = today || toIsoDate();
  if (!action || action.status === "dismissed" || action.status === "done") return false;
  if (action.dueDate && action.dueDate < todayIso) return true;
  if (action.type === "rest") return true;
  return action.priority >= 95;
}

export function sortActions(actions = []) {
  const todayIso = toIsoDate();
  const attentionRank = (action = {}) => {
    if (!action || action.status === "dismissed" || action.status === "done") return 0;
    if (action.dueDate && action.dueDate < todayIso) return 3;
    if (action.type === "rest") return 2;
    if (action.priority >= 95) return 1;
    return 0;
  };

  return [...actions].sort((a, b) => {
    const aAttention = attentionRank(a);
    const bAttention = attentionRank(b);
    if (aAttention !== bAttention) return bAttention - aAttention;
    if ((a.priority || 0) !== (b.priority || 0)) return (b.priority || 0) - (a.priority || 0);
    if ((a.dueDate || "") !== (b.dueDate || "")) return (a.dueDate || "").localeCompare(b.dueDate || "");
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });
}

function applyInboxState(actions = [], actionInboxState = {}) {
  const doneMap = actionInboxState.done || {};
  const dismissedMap = actionInboxState.dismissed || {};
  const acceptedMap = actionInboxState.accepted || {};
  return actions
    .map((action) => {
      if (doneMap[action.id]) return { ...action, status: "done" };
      if (dismissedMap[action.id]) return { ...action, status: "dismissed" };
      if (acceptedMap[action.id]) return { ...action, status: "accepted" };
      return action;
    })
    .filter((action) => action.status !== "done" && action.status !== "dismissed");
}

export function buildActionInbox(context = {}) {
  const today = context.today || toIsoDate();
  const candidates = [];

  if (Array.isArray(context.actions)) {
    candidates.push(...context.actions.map((action) => createAction(action)));
  }

  if (context.mentorAction?.title || context.mentorAction?.label) {
    candidates.push(
      createAction({
        id: context.mentorAction.id,
        type: context.mentorAction.type || "review",
        title: context.mentorAction.title || context.mentorAction.label,
        reason: context.mentorAction.reason || context.mentorAction.sub || "Direcionamento do mentor.",
        priority: context.mentorAction.priority || 85,
        source: "mentor",
        dueDate: context.mentorAction.dueDate || today,
        target: context.mentorAction.target || {},
      })
    );
  }

  const areaCritica = context.enamed?.resumo?.areaCritica;
  if (areaCritica) {
    candidates.push(
      createAction({
        type: "exam_analysis",
        title: `Analisar lacuna em ${areaCritica}`,
        reason: "A ultima analise ENAMED apontou esta area como gargalo.",
        priority: 84,
        source: "enamed",
        dueDate: today,
        target: { area: areaCritica },
      })
    );
  }

  if (toNumber(context.overdue, 0) > 0) {
    candidates.push(
      createAction({
        type: "review",
        title: "Resolver revisoes vencidas",
        reason: "Existe fila atrasada que compromete a retencao.",
        priority: 100,
        source: "mentor",
        dueDate: today,
        target: { tema: "fila_vencida" },
      })
    );
  }

  if (toNumber(context.pending, 0) > 0) {
    candidates.push(
      createAction({
        type: "review",
        title: "Fechar fila de hoje",
        reason: "Manter a cadencia diaria protege o ritmo de aprovacao.",
        priority: 90,
        source: "mentor",
        dueDate: today,
        target: { tema: "fila_do_dia" },
      })
    );
  }

  if (Array.isArray(context.reflectionActions)) {
    candidates.push(...context.reflectionActions.map((action) => createAction(action)));
  }

  if (context.shouldRest) {
    candidates.push(
      createAction({
        type: "rest",
        title: "Recuperar energia hoje",
        reason: "Sinal de fadiga recente. Descanso estrategico evita queda de performance.",
        priority: 120,
        source: "mentor",
        dueDate: today,
        target: { tema: "energia" },
      })
    );
  }

  const deduped = dedupeActions(candidates);
  const withStatus = applyInboxState(deduped, context.actionInboxState || {});
  return sortActions(withStatus);
}

export function pickPrimaryAction(actions = []) {
  return sortActions(actions.filter((action) => action.status === "open" || action.status === "accepted"))[0] || null;
}
