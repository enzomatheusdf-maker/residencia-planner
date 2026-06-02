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
