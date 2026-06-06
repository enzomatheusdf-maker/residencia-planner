/**
 * Cria um objeto de evento de aprendizagem (LearningEvent) normalizado.
 * @param {Object} input - Dados de entrada do evento.
 */
export function createLearningEvent(input = {}) {
  const rawTimestamp = input.timestamp || input.completedAt || new Date().toISOString();
  const timestamp = typeof rawTimestamp === "number"
    ? new Date(rawTimestamp).toISOString()
    : String(rawTimestamp);
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

function sameTemaId(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function isOfficialTopicEvent(ev = {}) {
  return !!ev
    && ev.officialSchedulingImpact !== false
    && ev.topicId !== null
    && ev.topicId !== undefined;
}

function toTemaStat(ev = {}) {
  const completedAt = ev.completedAt || ev.reviewedAt || ev.timestamp || ev.date || null;
  const meta = ev.meta && typeof ev.meta === "object" ? ev.meta : {};
  return {
    id: ev.id,
    source: ev.source || "review",
    topicId: ev.topicId ?? null,
    topicName: ev.topicName || "",
    area: ev.area || "",
    plat: ev.plat || "res",
    stepKey: ev.stepKey || null,
    step: ev.stepKey || null,
    key: ev.stepKey || null,
    acerto: ev.performance?.acerto ?? ev.acerto ?? null,
    previsao: ev.performance?.previsao ?? ev.previsao ?? null,
    questoes: ev.performance?.questoes ?? ev.questoes ?? null,
    rating: ev.performance?.rating ?? ev.rating ?? null,
    confianca: ev.regulation?.confianca ?? ev.confianca ?? null,
    ansiedade: ev.regulation?.ansiedade ?? ev.ansiedade ?? null,
    cansaco: ev.regulation?.cansaco ?? ev.cansaco ?? null,
    foco: ev.regulation?.foco ?? ev.foco ?? null,
    tempoMin: ev.regulation?.tempoMin ?? ev.tempoMin ?? null,
    motivosErro: ev.errors?.motivosErro ?? ev.motivosErro ?? [],
    dominantError: ev.errors?.dominantError ?? ev.dominantError ?? null,
    completedAt,
    reviewedAt: completedAt,
    date: ev.date || (completedAt ? String(completedAt).slice(0, 10) : null),
    timestamp: ev.timestamp || completedAt,
    S: meta.S ?? meta.stability ?? ev.S ?? ev.stability ?? null,
    D: meta.D ?? meta.difficulty ?? ev.D ?? ev.difficulty ?? null,
    officialSchedulingImpact: ev.officialSchedulingImpact !== false,
    meta,
  };
}

function sortStatsByTime(a, b) {
  const aTime = Date.parse(a.completedAt || a.timestamp || a.date || "") || 0;
  const bTime = Date.parse(b.completedAt || b.timestamp || b.date || "") || 0;
  return aTime - bTime;
}

export function getEventsByTema(events = [], temaId) {
  const list = Array.isArray(events) ? events : [];
  return list.filter((ev) => sameTemaId(ev?.topicId, temaId));
}

export function getTemaStatsFromLearningEvents(events = [], options = {}) {
  const list = Array.isArray(events) ? events : [];
  const plat = options.plat || null;
  const fallbackTemaStats = options.fallbackTemaStats || null;
  const grouped = {};

  list
    .filter(isOfficialTopicEvent)
    .filter((ev) => !plat || !ev.plat || ev.plat === plat)
    .forEach((ev) => {
      const key = String(ev.topicId);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(toTemaStat(ev));
    });

  Object.keys(grouped).forEach((key) => {
    grouped[key].sort(sortStatsByTime);
  });

  if (Object.keys(grouped).length > 0 || !fallbackTemaStats) {
    return grouped;
  }

  return fallbackTemaStats && typeof fallbackTemaStats === "object" ? fallbackTemaStats : {};
}

export function getLearningEventStatsList(events = [], options = {}) {
  return Object.values(getTemaStatsFromLearningEvents(events, options)).flat();
}

export function summarizeByArea(events = [], plat = null) {
  const stats = getLearningEventStatsList(events, { plat });
  const grouped = {};

  stats.forEach((stat) => {
    const area = stat.area || "Sem area";
    if (!grouped[area]) {
      grouped[area] = {
        area,
        total: 0,
        questoes: 0,
        acertoSum: 0,
        acertoCount: 0,
        topics: new Set(),
        errorCounts: {},
        lastCompletedAt: null,
      };
    }
    const bucket = grouped[area];
    bucket.total += 1;
    bucket.topics.add(String(stat.topicId ?? stat.topicName ?? ""));
    if (Number.isFinite(Number(stat.questoes))) bucket.questoes += Number(stat.questoes);
    if (stat.acerto !== null && stat.acerto !== undefined && Number.isFinite(Number(stat.acerto))) {
      bucket.acertoSum += Number(stat.acerto);
      bucket.acertoCount += 1;
    }
    if (stat.dominantError) {
      bucket.errorCounts[stat.dominantError] = (bucket.errorCounts[stat.dominantError] || 0) + 1;
    }
    if (stat.completedAt && (!bucket.lastCompletedAt || String(stat.completedAt) > bucket.lastCompletedAt)) {
      bucket.lastCompletedAt = String(stat.completedAt);
    }
  });

  return Object.fromEntries(Object.entries(grouped).map(([area, bucket]) => {
    const topError = Object.entries(bucket.errorCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
    return [area, {
      area,
      total: bucket.total,
      questoes: bucket.questoes,
      acertoMedio: bucket.acertoCount > 0 ? bucket.acertoSum / bucket.acertoCount : null,
      averageAcerto: bucket.acertoCount > 0 ? bucket.acertoSum / bucket.acertoCount : null,
      topicCount: bucket.topics.size,
      topError,
      lastCompletedAt: bucket.lastCompletedAt,
    }];
  }));
}

/**
 * Returns the most recent error events (where the user had incorrect answers or reported errors).
 * @param {Array} events - List of learning events.
 * @param {number} limit - Maximum number of events to return.
 */
export function getRecentErrorEvents(events = [], limit = 10) {
  const list = Array.isArray(events) ? events : [];
  return list
    .filter((ev) => {
      const acerto = ev.acerto ?? ev.performance?.acerto;
      const hasErrors = ev.dominantError || 
                        ev.errors?.dominantError || 
                        (ev.motivosErro && ev.motivosErro.length > 0) || 
                        (ev.errors?.motivosErro && ev.errors.motivosErro.length > 0);
      return (acerto !== null && acerto < 0.80) || hasErrors;
    })
    .sort((a, b) => {
      const aTime = Date.parse(a.timestamp || a.date || "") || 0;
      const bTime = Date.parse(b.timestamp || b.date || "") || 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}

