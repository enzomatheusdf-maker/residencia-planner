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
    description: "Fluxo principal de estudo e simulados.",
    desktop: true,
    mobile: true,
  },
  {
    view: "stats",
    label: COPY.views.stats,
    mobileLabel: "Stats",
    description: "Metricas e paineis de progresso.",
    desktop: true,
    mobile: true,
  },
  {
    view: "banco",
    label: COPY.views.banco,
    mobileLabel: "Banco",
    description: "Banco de dados e consultas.",
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
    view: "raciocinio",
    label: "Racioc\u00ednio Cl\u00ednico",
    description: "Treine racioc\u00ednio diagn\u00f3stico, hip\u00f3teses e condutas simuladas.",
    onlyPlat: "res",
    requiresFeature: "raciocinioClinico",
  },
  {
    view: "anki",
    label: "Anki Audit",
    description: "Auditoria de aderencia e consistencia no Anki.",
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
  if (item.devOnly && !IS_DEV) return false;
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
