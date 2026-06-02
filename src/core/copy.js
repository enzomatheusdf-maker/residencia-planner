export const COPY = {
  views: {
    dash: "Hoje",
    crono: "Plano",
    sims: "Estudar",
    stats: "Estatísticas",
    banco: "Banco",
    more: "Mais",
  },
  metrics: {
    readiness: "Preparo estimado",
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
