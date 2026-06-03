import { COPY } from "./copy";

// Itens marcados como devOnly so aparecem no build de desenvolvimento.
// No build de producao (o que o usuario recebe) eles ficam ocultos.
const IS_DEV = process.env.NODE_ENV === "development";

const PRIMARY_ITEMS = [
  {
    view: "dash",
    label: COPY.views.dash,
    mobileLabel: COPY.views.dash,
    description: "Resumo do dia com comando do Mentor.",
    desktop: true,
    mobile: true,
  },
  {
    view: "crono",
    label: COPY.views.crono,
    mobileLabel: COPY.views.crono,
    description: "Cronograma e planejamento de temas.",
    desktop: true,
    mobile: true,
  },
  {
    view: "sims",
    label: COPY.views.sims,
    mobileLabel: COPY.views.sims,
    description: "Estrategia, registro e correcao de simulados.",
    desktop: true,
    mobile: true,
  },
  {
    view: "raciocinio",
    label: "Racioc\u00ednio Cl\u00ednico",
    mobileLabel: "Cl\u00ednico",
    description: "Treino de casos, illness scripts, SCT e conduta.",
    onlyPlat: "res",
    requiresFeature: "raciocinioClinico",
    desktop: true,
    mobile: true,
  },
  {
    view: "anki",
    label: "Anki Audit",
    mobileLabel: "Anki",
    description: "Auditoria operacional diaria do Anki.",
    desktop: true,
    mobile: false,
  },
  {
    view: "more",
    label: COPY.views.more,
    mobileLabel: COPY.views.more,
    description: "Ferramentas avancadas e sistema.",
    desktop: true,
    mobile: true,
  },
];

const MORE_ITEMS = [
  {
    view: "anki",
    label: "Anki Audit",
    description: "Auditoria operacional diaria do Anki.",
    mobileOnly: true,
  },
  {
    view: "stats",
    label: COPY.views.stats,
    description: "Aprendizagem, provas, erros, revisoes e previsao.",
  },
  {
    view: "banco",
    label: COPY.views.banco,
    description: "Banco de temas e consultas auxiliares.",
  },
  {
    view: "academia",
    label: "Academia / M\u00e9todo",
    description: "Fundamentos do m\u00e9todo e guias de estudo.",
  },
  {
    view: "weekly_review",
    label: "Weekly Review",
    description: "Revisao executiva da semana com acoes sugeridas.",
  },
  {
    view: "data_safety",
    label: "Seguranca de Dados",
    description: "Backup, integridade e migracao dos seus dados.",
  },
  {
    view: "guia",
    label: "Guia de Uso",
    description: "Como navegar por Hoje, Plano, Simulados, Clinico, Anki e Mais.",
  },
  {
    view: "ajustes",
    label: "Perfil e Configuracoes",
    description: "Conta, estudos, mentor, seguranca e preferencias.",
  },
  {
    view: "conquistas",
    label: "Conquistas",
    description: "Realizacoes desbloqueadas com base no seu progresso.",
  },
  {
    view: "launch_checklist",
    label: "Checklist",
    description: "Itens de prontidao e verificacoes do app.",
    devOnly: true,
  },
];

const LEGACY_VIEW_MAP = {
  dashboard: "dash",
  hoje: "dash",
  home: "dash",
  plano: "crono",
  cronograma: "crono",
  agenda: "crono",
  estudar: "sims",
  simulado: "sims",
  simulados: "sims",
  estatisticas: "stats",
  estatistica: "stats",
  banco_de_dados: "banco",
  banco_dados: "banco",
  mais: "more",
  raciocinio_clinico: "raciocinio",
  raciocinioclinico: "raciocinio",
  metodo: "academia",
  academia_metodo: "academia",
  settings: "ajustes",
  config: "ajustes",
  configuracoes: "ajustes",
  guia_de_uso: "guia",
  weeklyreview: "weekly_review",
  datasafety: "data_safety",
  launchchecklist: "launch_checklist",
};

const LABELS_BY_VIEW = {
  dash: COPY.views.dash,
  crono: COPY.views.crono,
  sims: COPY.views.sims,
  stats: COPY.views.stats,
  banco: COPY.views.banco,
  more: COPY.views.more,
  raciocinio: "Racioc\u00ednio Cl\u00ednico",
  anki: "Anki Audit",
  weekly_review: "Weekly Review",
  academia: "Academia / M\u00e9todo",
  data_safety: "Data Safety",
  launch_checklist: "Launch Checklist",
  conquistas: "Conquistas",
  guia: "Guia",
  ajustes: "Ajustes",
};

export const NAV_VIEW = {
  TODAY: "dash",
  PLAN: "crono",
  STUDY: "sims",
  STATS: "stats",
  DATABASE: "banco",
  MORE: "more",
  ACADEMY: "academia",
  CLINICAL_REASONING: "raciocinio",
  ANKI: "anki",
  GUIDE: "guia",
  SETTINGS: "ajustes",
  DATA_SAFETY: "data_safety",
  WEEKLY_REVIEW: "weekly_review",
  LAUNCH_CHECKLIST: "launch_checklist",
};

export const PLAN_TAB = {
  PLAN: "plano",
  AGENDA: "agenda",
};

export function normalizePlanTab(tab, fallback = PLAN_TAB.PLAN) {
  const value = String(tab || "").trim().toLowerCase();
  return Object.values(PLAN_TAB).includes(value) ? value : fallback;
}

export function buildPlanAgendaTarget({ date } = {}) {
  return {
    view: NAV_VIEW.PLAN,
    tab: PLAN_TAB.AGENDA,
    date: date || null,
  };
}

export function getPlanTabFromTarget(target, fallback = PLAN_TAB.PLAN) {
  if (!target || typeof target !== "object") return fallback;
  if (normalizeView(target.view) !== NAV_VIEW.PLAN) return fallback;
  return normalizePlanTab(target.tab, fallback);
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isRaciocinioEnabled(plat, features = {}) {
  if (plat !== "res") return false;
  if (features.raciocinioClinico === true) return true;
  if (features.modulos?.raciocinioClinico === true) return true;
  return false;
}

function isItemAvailable(item, plat, features = {}) {
  if (item.devOnly && !IS_DEV) return false;
  if (item.mobileOnly && features.mobile !== true) return false;
  if (item.onlyPlat && item.onlyPlat !== plat) return false;
  if (item.requiresFeature === "raciocinioClinico") {
    return isRaciocinioEnabled(plat, features);
  }
  return true;
}

export function normalizeView(view) {
  const key = normalizeKey(view);
  if (!key) return NAV_VIEW.TODAY;
  if (key === "login") return "login";
  if (Object.values(NAV_VIEW).includes(key)) return key;
  return LEGACY_VIEW_MAP[key] || key;
}

export function isViewAvailable(view, plat, features = {}) {
  const normalized = normalizeView(view);
  if (normalized === "login") return true;
  const primary = PRIMARY_ITEMS.find((item) => item.view === normalized);
  if (primary) return isItemAvailable(primary, plat, features);
  const more = MORE_ITEMS.find((item) => item.view === normalized);
  if (more) return isItemAvailable(more, plat, features);
  return false;
}

export function getPrimaryNavItems(plat, features = {}) {
  const isMobile = features.mobile === true;
  return PRIMARY_ITEMS
    .filter((item) => (isMobile ? item.mobile : item.desktop))
    .filter((item) => isItemAvailable(item, plat, features));
}

export function getMoreNavItems(plat, features = {}) {
  return MORE_ITEMS.filter((item) => isItemAvailable(item, plat, features));
}

export function getNavigationItems(plat, features = {}) {
  return [
    ...getPrimaryNavItems(plat, { ...features, mobile: false }),
    ...getMoreNavItems(plat, features),
  ];
}

export function resolveViewLabel(view, plat = "res") {
  const normalized = normalizeView(view);
  const all = getNavigationItems(plat, {});
  const navItem = all.find((item) => item.view === normalized);
  if (navItem?.label) return navItem.label;
  return LABELS_BY_VIEW[normalized] || LABELS_BY_VIEW[NAV_VIEW.TODAY];
}
