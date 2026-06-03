function toIsoNow() {
  return new Date().toISOString();
}

export const DEFAULT_VESTIBULAR_START = {
  completed: false,
  targetExam: null,
  examDate: null,
  baselineMode: null,
  planMode: "mentor",
  completedAt: null,
};

export function getVestibularStart(meta = {}) {
  const incoming = meta?.vestibularStart || {};
  return {
    ...DEFAULT_VESTIBULAR_START,
    ...incoming,
    completed: incoming.completed === true,
    planMode: incoming.planMode || "mentor",
  };
}

export function updateVestibularStart(meta = {}, patch = {}) {
  const current = getVestibularStart(meta);
  const next = {
    ...current,
    ...patch,
  };
  if (patch.completed === true) {
    next.completedAt = current.completedAt || toIsoNow();
  }
  return next;
}

export function isVestibularStartComplete(meta = {}) {
  return getVestibularStart(meta).completed === true;
}

function hasStartedTema(temas = []) {
  return (temas || []).some((tema) => tema?.unstarted === false);
}

export function recommendVestibularFirstAction({
  meta = {},
  temas = [],
  simulados = [],
}) {
  const start = getVestibularStart(meta);
  const sims = Array.isArray(simulados) ? simulados : [];
  const started = hasStartedTema(temas);

  if (start.baselineMode === "simulado" && sims.length === 0) {
    return {
      key: "registrar_simulado",
      title: "Registrar simulado diagnóstico",
      description: "Você escolheu começar com baseline. Registre um simulado recente para o Mentor priorizar a matéria fraca.",
      cta: "Abrir Simulados",
      view: "sims",
    };
  }

  if (!started) {
    return {
      key: "iniciar_tema",
      title: "Iniciar primeiro tema do plano",
      description: "Sem tema iniciado, o próximo melhor passo é abrir o Plano e começar um tópico de alta prioridade.",
      cta: "Abrir Plano",
      view: "crono",
    };
  }

  if (!start.examDate) {
    return {
      key: "configurar_data",
      title: "Configurar data-alvo",
      description: "Definir uma data ajuda o Mentor a calibrar ritmo, carga e prioridade de revisão.",
      cta: "Abrir Ajustes",
      view: "ajustes",
    };
  }

  return {
    key: "seguir_mentor",
    title: "Executar próxima ação do Mentor",
    description: "Com baseline e plano ativos, siga a próxima ação diária para manter consistência.",
    cta: "Ir para Hoje",
    view: "dash",
  };
}
