const PRIMARY_ITEMS = [
  {
    view: "dash",
    label: "Hoje",
    mobileLabel: "Hoje",
    description: "Resumo do dia com comando do Mentor.",
    desktop: true,
    mobile: true,
  },
  {
    view: "crono",
    label: "Plano",
    mobileLabel: "Plano",
    description: "Cronograma e planejamento de temas.",
    desktop: true,
    mobile: true,
  },
  {
    view: "sims",
    label: "Estudar",
    mobileLabel: "Estudar",
    description: "Fluxo principal de estudo e simulados.",
    desktop: true,
    mobile: true,
  },
  {
    view: "stats",
    label: "Estatisticas",
    mobileLabel: "Stats",
    description: "Metricas e paineis de progresso.",
    desktop: true,
    mobile: true,
  },
  {
    view: "banco",
    label: "Banco",
    mobileLabel: "Banco",
    description: "Banco de dados e consultas.",
    desktop: true,
    mobile: false,
  },
  {
    view: "more",
    label: "Mais",
    mobileLabel: "Mais",
    description: "Ferramentas avancadas e sistema.",
    desktop: true,
    mobile: true,
  },
];

const MORE_ITEMS = [
  {
    view: "raciocinio",
    label: "Raciocinio Clinico",
    description: "Treine problem representation, hipoteses e illness scripts.",
    onlyPlat: "res",
    requiresFeature: "raciocinioClinico",
  },
  {
    view: "anki",
    label: "Anki Audit",
    description: "Auditoria de aderencia e consistencia no Anki.",
  },
  {
    view: "weekly_review",
    label: "Weekly Review",
    description: "Revisao executiva da semana com acoes sugeridas.",
  },
  {
    view: "academia",
    label: "Academia / Metodo",
    description: "Fundamentos do metodo e guias de estudo.",
  },
  {
    view: "data_safety",
    label: "Data Safety",
    description: "Checklist de seguranca de dados e confiabilidade.",
  },
  {
    view: "launch_checklist",
    label: "Launch Checklist",
    description: "Checklist de prontidao para lancamento.",
  },
  {
    view: "guia",
    label: "Guia",
    description: "Guia rapido de uso do MedRev.",
  },
  {
    view: "ajustes",
    label: "Ajustes",
    description: "Configuracoes de conta, plano e aplicativo.",
  },
];

const LEGACY_VIEW_MAP = {
  dashboard: "dash",
  hoje: "dash",
  home: "dash",
  plano: "crono",
  cronograma: "crono",
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
  dash: "Hoje",
  crono: "Plano",
  sims: "Estudar",
  stats: "Estatisticas",
  banco: "Banco",
  more: "Mais",
  raciocinio: "Raciocinio Clinico",
  anki: "Anki Audit",
  weekly_review: "Weekly Review",
  academia: "Academia / Metodo",
  data_safety: "Data Safety",
  launch_checklist: "Launch Checklist",
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
