export const COPY = {
  views: {
    dash: "Hoje",
    crono: "Plano",
    sims: "Simulados",
    stats: "Estatísticas",
    banco: "Banco",
    more: "Mais",
  },
  metrics: {
    readiness: "Preparo estimado do plano",
    trueRetention: "Retenção longa",
    workload: "Carga de hoje",
  },
  actions: {
    startNow: "Começar agora",
    seeWhy: "Ver por quê",
    configurePlan: "Configurar plano",
    jaDomino: "Já domino",
  },
};

export function resolveViewCopy(viewKey) {
  return COPY.views[viewKey] || COPY.views.dash;
}

/**
 * Maps a numeric confidence value to a human-readable label.
 * Returns null when confidence is absent so callers can skip rendering.
 */
export function confidenceLabel(confidence) {
  if (typeof confidence !== "number" || isNaN(confidence)) return null;
  if (confidence >= 0.8) return "alta";
  if (confidence >= 0.55) return "média";
  return "explorando";
}

/**
 * Translates a sourceSignal token (e.g. "dueToday:5") into user-visible text.
 * Returns null for internal/non-displayable tokens so callers can filter them out.
 */
export function humanizeSignal(signal) {
  if (!signal || typeof signal !== "string") return null;
  const colonIdx = signal.indexOf(":");
  if (colonIdx === -1) return null;
  const key = signal.slice(0, colonIdx);
  const value = signal.slice(colonIdx + 1);
  const n = Number(value);
  switch (key) {
    case "dueToday":
      return `${value} ${n !== 1 ? "revisões" : "revisão"} para hoje`;
    case "overdue":
      return `${value} ${n !== 1 ? "atrasadas" : "atrasada"}`;
    case "minutes":
      return `~${value} min estimados`;
    case "track":
      return `Trilha ${value.toUpperCase()}`;
    default:
      return null;
  }
}
