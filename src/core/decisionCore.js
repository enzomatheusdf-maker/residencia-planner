import { buildMentorContext } from "./mentorSignals";
import { decideMentorAction, buildMentorTodayPlan } from "./mentorDecisionPolicy";
import { buildActionInbox, createAction } from "./actionInbox";
import { buildDailyCommand } from "./dailyCommandEngine";
import { reflectionToAction } from "./sessionReflection";
import { todayStr, addDays } from "./fsrs";

const EMPTY_INBOX_STATE = { dismissed: {}, accepted: {}, done: {} };

function normalizeText(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizePlat(value) {
  return value === "vest" ? "vest" : value === "res" ? "res" : "";
}

function scopeActionId(id, plat) {
  if (!id || !plat) return id;
  return String(id).includes(`_${plat}_`) || String(id).endsWith(`_${plat}`)
    ? id
    : `${id}_${plat}`;
}

function reflectionMatchesPlat(reflection = {}, state = {}, plat = "res") {
  const explicitPlat = normalizePlat(reflection.plat);
  if (explicitPlat) return explicitPlat === plat;

  const temaKey = normalizeText(reflection.tema);
  const areaKey = normalizeText(reflection.area);
  if (!temaKey && !areaKey) return true;

  const matchesPlat = (platKey) => (state[platKey]?.temas || []).some((tema) => {
    const nome = normalizeText(tema?.nome);
    const esp = normalizeText(tema?.esp || tema?.area);
    return (temaKey && nome === temaKey) || (areaKey && esp === areaKey);
  });

  const currentMatches = matchesPlat(plat);
  const otherMatches = matchesPlat(plat === "vest" ? "res" : "vest");
  if (currentMatches || otherMatches) return currentMatches;
  return true;
}

/**
 * Cria o snapshot unificado com a decisao do Mentor v2.
 * @param {Object} state - Estado atual da store.
 * @param {Object} options - Opcoes adicionais (e.g., today).
 */
export function buildDecisionCoreSnapshot(state = {}, options = {}) {
  const today = options.today || todayStr();
  const plat = options.plat || state.plat || "res";
  const context = buildMentorContext(state, plat, { ...options, today });
  const primaryAction = decideMentorAction(context);
  const mentorAction = primaryAction;
  const todayPlan = buildMentorTodayPlan(context);
  const dailyCommand = buildDailyCommand({
    snapshot: { today, plat, context, primaryAction, mentorAction, todayPlan },
    context,
  });
  const primaryInboxAction = mentorActionToInboxAction(primaryAction, { today, plat });
  const reflectionActions = (state.sessionReflections || [])
    .filter((reflection) => reflection?.date && reflection.date >= addDays(today, -7))
    .filter((reflection) => reflectionMatchesPlat(reflection, state, plat))
    .map((reflection) => reflectionToAction({ ...reflection, plat: reflection.plat || plat }))
    .map((action) => createAction({ ...action, dueDate: today }));
  const inboxActions = [primaryInboxAction, ...reflectionActions].filter(Boolean);

  return {
    today,
    plat,
    context,
    dailyCommand,
    primaryAction,
    mentorAction,
    todayPlan,
    inboxActions,
    diagnosticsLite: {
      safety: primaryAction?.safety || "ok",
      decisionType: primaryAction?.type || "none",
      priority: primaryAction?.priority || 0,
      confidence: primaryAction?.confidence ?? null,
    },
    warnings: [],
  };
}

/**
 * Adapta uma acao do mentor (de mentorDecisionPolicy) para o formato da ActionInbox.
 * @param {Object} mentorAction - Acao decidida pelo mentor.
 * @param {Object} options - Opcoes adicionais (e.g., today).
 */
export function mentorActionToInboxAction(mentorAction, options = {}) {
  if (!mentorAction) return null;
  const today = options.today || todayStr();
  const plat = normalizePlat(options.plat);
  const legacyId = mentorAction.id;

  return createAction({
    id: scopeActionId(mentorAction.id, plat),
    legacyId: plat ? legacyId : "",
    type: mentorAction.type,
    title: mentorAction.title,
    reason: mentorAction.reason || (Array.isArray(mentorAction.explain) ? mentorAction.explain.join(" ") : ""),
    priority: mentorAction.priority,
    source: mentorAction.source || "mentor-v2",
    dueDate: mentorAction.dueDate || today,
    createdAt: mentorAction.createdAt || today,
    target: { ...(mentorAction.target || {}), plat: plat || undefined },
    plat,
    // Informacoes adicionais preservadas para a UI/Dashboard
    subtitle: mentorAction.subtitle,
    explain: mentorAction.explain,
    cta: mentorAction.cta,
    ctaView: mentorAction.ctaView,
    estimatedMinutes: mentorAction.estimatedMinutes,
    confidence: mentorAction.confidence,
    safety: mentorAction.safety,
  });
}

/**
 * Constroi a ActionInbox do dia consumindo a decisao do decisionCore.
 * @param {Object} state - Estado atual da store.
 * @param {Object} options - Opcoes adicionais (e.g., today).
 */
export function buildActionInboxFromDecisionCore(state = {}, options = {}) {
  const today = options.today || todayStr();
  const snapshot = options.snapshot || buildDecisionCoreSnapshot(state, { ...options, today });
  return buildActionInbox({
    today,
    actions: snapshot.inboxActions || [],
    actionInboxState: state.actionInboxState || EMPTY_INBOX_STATE,
  });
}
