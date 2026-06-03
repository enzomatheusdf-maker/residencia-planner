import { todayStr } from "./fsrs";
import { getAppEnvironment } from "./userScope";
import { shouldShowDailyBriefing } from "./onboardingGate";

export function getDailyBriefingStorageKey({ uid, scopeKey, env = getAppEnvironment(), date = todayStr() } = {}) {
  if (scopeKey) return `${scopeKey}:dailyBriefing:${date}`;
  if (uid) return `medrev:${env}:user:${uid}:dailyBriefing:${date}`;
  return `medrev:${env}:anonymous:dailyBriefing:${date}`;
}

export function isDailyBriefingDismissed(storage, key) {
  if (!storage || !key) return false;
  return storage.getItem(key) === "1";
}

export function dismissDailyBriefing(storage, key) {
  if (!storage || !key) return;
  storage.setItem(key, "1");
}

export function buildDailyBriefing({ state = {}, context = {} } = {}) {
  const pendingCount = Number(context.pendingCount ?? context.dueTodayCount ?? 0);
  const overdueCount = Number(context.overdueCount ?? 0);
  const estimatedMinutes = Number(context.estimatedMinutes ?? context.todayMinutes ?? pendingCount * 12);
  const priority = context.priority || (overdueCount > 0
    ? "Recuperar revisões vencidas primeiro."
    : pendingCount > 0
    ? "Fechar a fila de hoje mantém a curva estável."
    : "Dia leve: avance um tema novo ou revise o plano.");

  return {
    title: overdueCount > 0 ? "Resumo do dia" : "Seu plano de hoje",
    reviewsToday: pendingCount,
    estimatedMinutes,
    overdueCount,
    priority,
    helperText: overdueCount > 0
      ? `${overdueCount} revisão${overdueCount === 1 ? "" : "ões"} em atraso precisando de atenção.`
      : "Sem atraso crítico. Foque em manter o ritmo sustentável.",
    primaryCta: "Começar agora",
    secondaryCta: "Ver plano",
    userName: state.userName || "Estudante",
  };
}

export function canShowDailyBriefing({
  state = {},
  context = {},
  uid = null,
  scopeKey = null,
  env,
  date = todayStr(),
  storage = typeof window !== "undefined" ? window.localStorage : null,
} = {}) {
  if (!shouldShowDailyBriefing(state)) return false;
  const key = getDailyBriefingStorageKey({ uid, scopeKey, env, date });
  if (isDailyBriefingDismissed(storage, key)) return false;
  const pendingCount = Number(context.pendingCount ?? context.dueTodayCount ?? 0);
  const estimatedMinutes = Number(context.estimatedMinutes ?? context.todayMinutes ?? 0);
  return pendingCount > 0 || estimatedMinutes > 0 || Number(context.overdueCount ?? 0) > 0;
}
