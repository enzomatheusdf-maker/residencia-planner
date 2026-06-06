// src/core/clinicalReasoningScoring.js
// UNICA fonte de calculo do score de raciocinio clinico.
// Substitui 3 implementacoes divergentes:
//   readiness.js:25    -> ponderada 0.6/0.4, weightSum adaptativo
//   RaciocinioClinico.jsx:24 -> media simples (errada — ignora pesos)
//   illnessScript.js:424    -> usa notaCaso que nunca e gravado pela UI
//
// Campos de casosProgresso gravados por registrarCaso (store.js):
//   fase2Acerto      number   acerto do caso estruturado (0-100)
//   sctAcerto        number   score SCT (0-100)
//   vistos           number   quantas vezes o caso foi visitado
//
// Formula canonica (fase atual):
//   Quando ambos disponíveis: fase2Acerto * 0.6 + sctAcerto * 0.4
//   Quando só um disponível: usa o que tem (weightSum adaptativo)
//   Threshold de confianca: n >= 3 casos com score
//
// P4-D futuro adicionara: problem_representation 0.20, hypotheses 0.25,
//   illness_recall 0.20, sct 0.20, management_safety 0.15

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v, min = 0, max = 100) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

// ─── Score por caso ───────────────────────────────────────────────────────────

/**
 * Deriva score normalizado (0-100) para UM caso a partir dos campos gravados.
 * Usa pesos adaptativos: se faltar um componente, normaliza pelo peso restante.
 * Retorna null se nao houver dados (caso nunca visitado ou sem acertos registrados).
 *
 * @param {object} casoProg  - entrada de casosProgresso para UM caso
 * @returns {number|null}
 */
export function normalizeClinicalReasoningProgress(casoProg) {
  if (!casoProg || Number(casoProg.vistos || 0) === 0) return null;

  const fase2 = clamp(casoProg.fase2Acerto);
  const sct = clamp(casoProg.sctAcerto);

  if (fase2 == null && sct == null) return null;

  // Pesos adaptativos: normaliza pelo peso total disponível
  const parts = [
    fase2 != null ? { value: fase2, weight: 0.6 } : null,
    sct != null ? { value: sct, weight: 0.4 } : null,
  ].filter(Boolean);

  const weightSum = parts.reduce((sum, p) => sum + p.weight, 0);
  const raw = parts.reduce((sum, p) => sum + p.value * p.weight, 0) / weightSum;
  return Math.round(raw);
}

// ─── Score geral ─────────────────────────────────────────────────────────────

/**
 * Calcula o score geral de raciocinio clinico.
 * Retorna null se sem dados suficientes.
 *
 * @param {object} casosProgresso  - mapa casoId -> progresso
 * @returns {number|null}
 */
export function calculateClinicalReasoningScore(casosProgresso) {
  const scores = Object.values(casosProgresso || {})
    .map((p) => normalizeClinicalReasoningProgress(p))
    .filter((s) => s != null);

  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

// ─── Score detalhado (com governanca de confianca) ───────────────────────────

/**
 * @param {object} casosProgresso
 * @returns {{
 *   score: number|null,
 *   n: number,
 *   collecting: boolean,
 *   confident: boolean,
 *   byCase: { casoId: string, score: number|null, vistos: number }[]
 * }}
 */
export function calculateClinicalReasoningScoreDetailed(casosProgresso) {
  const entries = Object.entries(casosProgresso || {});
  const byCase = entries.map(([casoId, p]) => ({
    casoId,
    score: normalizeClinicalReasoningProgress(p),
    vistos: Number(p?.vistos || 0),
  }));

  const withScore = byCase.filter((c) => c.score != null);
  const n = withScore.length;

  if (n === 0) {
    return { score: null, n: 0, collecting: true, confident: false, byCase };
  }

  const score = Math.round(withScore.reduce((sum, c) => sum + c.score, 0) / n);
  return {
    score,
    n,
    collecting: n < 3,
    confident: n >= 3,
    byCase,
  };
}

const CLINICAL_ERROR_LABELS = Object.freeze({
  premature_closure: "Fechamento precoce",
  anchoring: "Ancoragem",
  overconfidence: "Excesso de confianca",
  clinical_reasoning_gap: "Lacuna de raciocinio",
  discrimination_gap: "Discriminacao entre confundiveis",
  low_score: "Justificativa clinica incompleta",
});

function normalizeEventScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n > 1 ? n / 100 : n;
}

function getCaseArea(caso = {}) {
  return caso.area || caso.esp || "Outro";
}

function getCaseTitle(caso = {}, fallback = "Script clinico") {
  return caso.tema || caso.subarea || caso.subtopic || caso.diagnosticoFinal || fallback;
}

/**
 * Frame de competencia para raciocinio clinico:
 * - scripts maduros por area
 * - erros que deixaram de aparecer apos reexposicao bem sucedida
 */
export function summarizeClinicalCompetence({ casos = [], casosProgresso = {}, learningEvents = [] } = {}) {
  const casesById = new Map((casos || []).filter(Boolean).map((caso) => [String(caso.id), caso]));
  const byArea = {};

  (casos || []).forEach((caso) => {
    const area = getCaseArea(caso);
    if (!byArea[area]) byArea[area] = { area, total: 0, maduros: 0, vistos: 0, exemplos: [] };
    byArea[area].total += 1;
  });

  Object.entries(casosProgresso || {}).forEach(([casoId, progresso]) => {
    const caso = casesById.get(String(casoId)) || {};
    const area = getCaseArea(caso);
    if (!byArea[area]) byArea[area] = { area, total: 0, maduros: 0, vistos: 0, exemplos: [] };

    const score = normalizeClinicalReasoningProgress(progresso);
    const vistos = Number(progresso?.vistos || 0);
    const stableEnough = vistos >= 2 || Number(progresso?.S || 0) >= 9 || progresso?.rev?.d21?.done || progresso?.rev?.manutencao?.done;
    const isMature = score != null && score >= 80 && stableEnough;

    if (vistos > 0) byArea[area].vistos += 1;
    if (isMature) {
      byArea[area].maduros += 1;
      byArea[area].exemplos.push(getCaseTitle(caso, casoId));
    }
  });

  const scriptsMadurosPorArea = Object.values(byArea)
    .map((row) => ({
      ...row,
      pct: row.total > 0 ? Math.round((row.maduros / row.total) * 100) : 0,
      exemplos: row.exemplos.slice(0, 3),
    }))
    .sort((a, b) => b.maduros - a.maduros || b.vistos - a.vistos || a.area.localeCompare(b.area));

  const clinicalEvents = (learningEvents || [])
    .map((event, index) => {
      const scriptId = String(event?.scriptId || event?.meta?.scriptId || event?.casoId || "");
      if (!scriptId || event?.source !== "clinical_drill") return null;
      const acerto = normalizeEventScore(event.acerto);
      const dominantError = event.dominantError || (acerto != null && acerto < 0.8 ? "low_score" : null);
      return { ...event, index, scriptId, acerto, dominantError };
    })
    .filter(Boolean);

  const errosResolvidos = [];
  clinicalEvents.forEach((event) => {
    if (!event.dominantError) return;
    const resolvedLater = clinicalEvents.some((later) => (
      later.scriptId === event.scriptId
      && later.index > event.index
      && later.acerto != null
      && later.acerto >= 0.8
      && later.dominantError !== event.dominantError
    ));
    if (!resolvedLater) return;

    const key = `${event.scriptId}:${event.dominantError}`;
    if (errosResolvidos.some((item) => item.key === key)) return;
    const caso = casesById.get(event.scriptId) || {};
    errosResolvidos.push({
      key,
      tipo: event.dominantError,
      label: CLINICAL_ERROR_LABELS[event.dominantError] || event.dominantError,
      script: getCaseTitle(caso, event.scriptId),
      area: getCaseArea(caso),
    });
  });

  return {
    scriptsMadurosPorArea,
    totalScriptsMaduros: scriptsMadurosPorArea.reduce((sum, row) => sum + row.maduros, 0),
    errosQueSumiram: errosResolvidos.slice(0, 5),
  };
}

// ─── Cobertura por area ───────────────────────────────────────────────────────

/**
 * Calcula cobertura e nota media por area.
 * Substitui coberturaRaciocinioPorArea(illnessScript.js) que lia notaCaso
 * — campo nunca gravado pela UI, resultando sempre em null.
 *
 * @param {object[]} casos           - lista de casos clinicos
 * @param {object}   casosProgresso  - mapa casoId -> progresso
 * @returns {object}  mapa area -> { total, vistos, notaMedia, pctCobertura }
 */
export function calcCoverageByArea(casos, casosProgresso) {
  const out = {};

  for (const caso of casos || []) {
    if (!caso?.area) continue;
    const area = caso.area;
    if (!out[area]) {
      out[area] = { total: 0, vistos: 0, somaScore: 0, comScore: 0, pctCobertura: 0, notaMedia: null };
    }
    out[area].total += 1;
    const p = casosProgresso?.[caso.id];
    if (Number(p?.vistos || 0) > 0) {
      out[area].vistos += 1;
      const score = normalizeClinicalReasoningProgress(p);
      if (score != null) {
        out[area].somaScore += score;
        out[area].comScore += 1;
      }
    }
  }

  for (const area of Object.keys(out)) {
    const row = out[area];
    row.pctCobertura = row.total ? Math.round((row.vistos / row.total) * 100) : 0;
    row.notaMedia = row.comScore ? Math.round(row.somaScore / row.comScore) : null;
  }

  return out;
}

// ─── Scorecard de Justificativa e Erros Cognitivos (RC-1) ──────────────────────

function cleanText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textMatchesAny(text, list = []) {
  const cleanedText = cleanText(text);
  if (!cleanedText || !list.length) return false;
  return list.some(item => {
    const cleanedItem = cleanText(item);
    return cleanedItem && (cleanedText.includes(cleanedItem) || cleanedItem.includes(cleanedText));
  });
}

/**
 * Pontua justificativas baseadas em Key Features e componentes clínicos (0/1/2)
 * e detecta o erro cognitivo de Fechamento Precoce (pular KF crítico com alta confiança).
 *
 * @param {object} userAnswers  - respostas do usuário
 * @param {object} script       - illness script correspondente
 * @returns {{ score: number, breakdown: object, errosDetectados: string[] }}
 */
export function scoreClinicalReasoningSession(userAnswers = {}, script = {}) {
  const keyFeatures = script.keyFeatures || [];
  const pertinentNegatives = script.pertinentNegatives || [];
  
  // 1. Pontuação de Key Features (2 pontos por item correto)
  let keyFeaturesScore = 0;
  let missedCritical = false;
  const userActions = userAnswers.keyFeatures || [];

  keyFeatures.forEach(kf => {
    const matched = userActions.some(action => {
      const cleanAct = cleanText(action);
      const cleanExpected = cleanText(kf.expectedAction);
      return cleanAct && cleanExpected && (cleanAct.includes(cleanExpected) || cleanExpected.includes(cleanAct));
    });

    if (matched) {
      keyFeaturesScore += 2;
    } else {
      if (kf.isCritical) {
        missedCritical = true;
      }
    }
  });

  // 2. Componente: Apoio (supporting features)
  let apoiaScore = 0;
  const userApoia = userAnswers.apoia || [];
  let apoiaHits = 0;
  userApoia.forEach(item => {
    if (script.consequences && textMatchesAny(item, [script.consequences, script.tema])) {
      apoiaHits++;
    }
  });
  if (apoiaHits >= 2) apoiaScore = 2;
  else if (apoiaHits === 1) apoiaScore = 1;

  // 3. Componente: Negativos Pertinentes
  let negativesScore = 0;
  const userContra = userAnswers.contra || [];
  let negativeHits = 0;
  userContra.forEach(item => {
    if (textMatchesAny(item, pertinentNegatives)) {
      negativeHits++;
    }
  });
  if (negativeHits >= 2) negativesScore = 2;
  else if (negativeHits === 1) negativesScore = 1;

  // 4. Componente: Esperado mas Ausente (falta)
  let faltaScore = 0;
  const userFalta = userAnswers.falta || [];
  let faltaHits = 0;
  userFalta.forEach(item => {
    if (textMatchesAny(item, pertinentNegatives)) {
      faltaHits++;
    }
  });
  if (faltaHits >= 1) faltaScore = 2;

  // 5. Componente: Conduta (adequação de conduta)
  let condutaScore = 0;
  const userConduta = userAnswers.conduta || "";
  if (userConduta) {
    const cleanConduta = cleanText(userConduta);
    const cleanMgmt = cleanText(script.management);
    if (cleanConduta && cleanMgmt) {
      if (cleanConduta.includes(cleanMgmt) || cleanMgmt.includes(cleanConduta)) {
        condutaScore = 2;
      } else {
        const mgmtTokens = cleanMgmt.split(/\s+/).filter(t => t.length >= 4);
        const hits = mgmtTokens.filter(t => cleanConduta.includes(t)).length;
        if (hits >= Math.max(1, Math.ceil(mgmtTokens.length * 0.3))) {
          condutaScore = 1;
        }
      }
    }
  }

  // 6. Cálculo da Pontuação Consolidada
  const maxPoints = (keyFeatures.length * 2) + 8;
  const earnedPoints = keyFeaturesScore + apoiaScore + negativesScore + faltaScore + condutaScore;
  let score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;

  // 7. Detecção de Erros Cognitivos (Fechamento Precoce)
  const errosDetectados = [];
  const confianca = userAnswers.confianca;
  const isHighConfidence = confianca === "alta" || (typeof confianca === "number" && (confianca >= 8 || confianca >= 0.8));
  
  if (missedCritical && isHighConfidence) {
    errosDetectados.push("premature_closure");
    score = Math.max(0, score - 20); // Penalidade de 20 pontos
  }

  return {
    score,
    breakdown: {
      keyFeatures: keyFeaturesScore,
      apoia: apoiaScore,
      negativos: negativesScore,
      falta: faltaScore,
      conduta: condutaScore,
      maxPossiblePoints: maxPoints,
      earnedPoints: earnedPoints
    },
    errosDetectados
  };
}
