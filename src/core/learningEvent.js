/**
 * Cria um objeto de evento de aprendizagem (LearningEvent) normalizado.
 * @param {Object} input - Dados de entrada do evento.
 */
export function createLearningEvent(input = {}) {
  const timestamp = input.timestamp || new Date().toISOString();
  const date = input.date || timestamp.slice(0, 10);
  const performance = {
    acerto: input.performance?.acerto ?? input.acerto,
    previsao: input.performance?.previsao ?? input.previsao,
    questoes: input.performance?.questoes ?? input.questoes,
    rating: input.performance?.rating ?? input.rating ?? null,
  };
  const regulation = {
    confianca: input.regulation?.confianca ?? input.confianca,
    ansiedade: input.regulation?.ansiedade ?? input.ansiedade,
    cansaco: input.regulation?.cansaco ?? input.cansaco,
    foco: input.regulation?.foco ?? input.foco,
    tempoMin: input.regulation?.tempoMin ?? input.tempoMin,
  };
  const errors = {
    motivosErro: Array.isArray(input.errors?.motivosErro)
      ? input.errors.motivosErro
      : (Array.isArray(input.motivosErro) ? input.motivosErro : []),
    dominantError: input.errors?.dominantError ?? input.dominantError ?? null,
  };
  const normalizedPerformance = {
    acerto: performance.acerto !== undefined && performance.acerto !== null ? Number(performance.acerto) : null,
    previsao: performance.previsao !== undefined && performance.previsao !== null ? Number(performance.previsao) : null,
    questoes: performance.questoes !== undefined && performance.questoes !== null ? Number(performance.questoes) : null,
    rating: performance.rating || null,
  };
  const normalizedRegulation = {
    confianca: regulation.confianca !== undefined && regulation.confianca !== null ? String(regulation.confianca) : null,
    ansiedade: regulation.ansiedade !== undefined && regulation.ansiedade !== null ? String(regulation.ansiedade) : null,
    cansaco: regulation.cansaco !== undefined && regulation.cansaco !== null ? String(regulation.cansaco) : null,
    foco: regulation.foco !== undefined && regulation.foco !== null ? String(regulation.foco) : null,
    tempoMin: regulation.tempoMin !== undefined && regulation.tempoMin !== null ? Number(regulation.tempoMin) : null,
  };
  const normalizedErrors = {
    motivosErro: errors.motivosErro,
    dominantError: errors.dominantError,
  };

  return {
    id: input.id || `le_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    source: input.source || "review",
    topicId: input.topicId || null,
    topicName: input.topicName || "",
    area: input.area || "",
    plat: input.plat || "res",
    stepKey: input.stepKey || null,
    date,
    timestamp,
    officialSchedulingImpact: input.officialSchedulingImpact !== false,

    performance: normalizedPerformance,
    regulation: normalizedRegulation,
    errors: normalizedErrors,
    tags: Array.isArray(input.tags) ? input.tags : [],
    meta: input.meta && typeof input.meta === "object" ? input.meta : {},

    // Metricas de Desempenho e Algoritmo
    acerto: normalizedPerformance.acerto,
    previsao: normalizedPerformance.previsao,
    questoes: normalizedPerformance.questoes,
    rating: normalizedPerformance.rating,

    // Calibracao e Estado Afetivo
    confianca: normalizedRegulation.confianca,
    ansiedade: normalizedRegulation.ansiedade,
    cansaco: normalizedRegulation.cansaco,
    foco: normalizedRegulation.foco,
    tempoMin: normalizedRegulation.tempoMin,

    // Diagnostico de Erros
    motivosErro: normalizedErrors.motivosErro,
    dominantError: normalizedErrors.dominantError,
  };
}

/**
 * Adiciona um evento de aprendizagem a uma lista append-only com limite de tamanho.
 * @param {Array} events - Lista atual de eventos.
 * @param {Object} input - Dados do novo evento.
 * @param {number} limit - Limite de tamanho da lista (padrao 1000).
 */
export function appendLearningEvent(events = [], input = {}, limit = 1000) {
  const list = Array.isArray(events) ? events : [];
  const event = createLearningEvent(input);
  return [...list, event].slice(-limit);
}

/**
 * Sumariza estatisticas basicas dos eventos de aprendizagem acumulados.
 * @param {Array} events - Lista de eventos de aprendizagem.
 */
export function summarizeLearningEvents(events = []) {
  const list = Array.isArray(events) ? events : [];
  const total = list.length;

  let acertoSum = 0;
  let acertoCount = 0;
  const ratingCounts = {};
  const errorCounts = {};
  const platCounts = {};
  const sourceCounts = {};

  for (const ev of list) {
    if (ev.acerto !== null && ev.acerto !== undefined) {
      const val = Number(ev.acerto);
      if (Number.isFinite(val)) {
        acertoSum += val;
        acertoCount++;
      }
    }

    if (ev.rating) {
      ratingCounts[ev.rating] = (ratingCounts[ev.rating] || 0) + 1;
    }
    if (ev.dominantError) {
      errorCounts[ev.dominantError] = (errorCounts[ev.dominantError] || 0) + 1;
    }
    if (ev.plat) {
      platCounts[ev.plat] = (platCounts[ev.plat] || 0) + 1;
    }
    if (ev.source) {
      sourceCounts[ev.source] = (sourceCounts[ev.source] || 0) + 1;
    }
  }

  let topError = null;
  let topErrorCount = 0;
  for (const [err, cnt] of Object.entries(errorCounts)) {
    if (cnt > topErrorCount) {
      topError = err;
      topErrorCount = cnt;
    }
  }

  return {
    total,
    averageAcerto: acertoCount > 0 ? acertoSum / acertoCount : null,
    ratingCounts,
    platCounts,
    sourceCounts,
    topError,
  };
}
