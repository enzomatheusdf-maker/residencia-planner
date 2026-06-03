// src/core/forecast.js
// Previsão de desempenho ancorada em simulados/provas.
// Base científica: avaliações práticas são o preditor mais forte de desempenho real
// (erro médio ±5–8 pts p/ NBME self-assessments). 2 formas espaçadas ~2 semanas estreitam
// a banda de previsão; 3 formas é melhor.
// Ref: PMC7198101, PMC10362906, PMC4673073

/**
 * Calcula a banda de confiança baseada no número de simulados.
 * A banda estreita com mais simulados espaçados.
 */
function calcBanda(nSimulados) {
  if (nSimulados === 0) return 18;
  if (nSimulados === 1) return 14;
  if (nSimulados === 2) return 10;
  if (nSimulados === 3) return 7;
  return 5; // 4+ simulados = banda estável
}

/**
 * Previsão de desempenho v1.
 *
 * Pesos:
 *   - Simulados/provas antigas: 45% (âncora — preditor mais forte)
 *   - Acerto de questões por área ponderado por incidência: 25%
 *   - Cobertura de temas prioritários: 15%
 *   - Aderência a revisões (saldo de ritmo): 10%
 *   - Calibração/erro recorrente: 5%
 *
 * @param {Object} params
 * @param {Array}  params.simulados     - array de simulados registrados (com .pct)
 * @param {number|null} params.acertoQuestoes - acerto médio global de questões (0–100)
 * @param {number|null} params.acertoQuestoesIncidencia - acerto de questões ponderado por incidência ENAMED (0–100)
 * @param {number|null} params.cobertura - cobertura de temas prioritários (0–100)
 * @param {number|null} params.saldoRitmoNorm - saldo de ritmo normalizado (0–100)
 * @param {number|null} params.indiceDescuido - índice de erro por descuido (0–100; menor = melhor)
 * @returns {{ score: number|null, bandMin: number|null, bandMax: number|null, banda: number, nSimulados: number, confidence: string, amostra: string }}
 */
export function calcPrevisaoDesempenho({
  simulados = [],
  acertoQuestoes = null,
  acertoQuestoesIncidencia = null,
  cobertura = null,
  saldoRitmoNorm = null,
  indiceDescuido = null,
} = {}) {
  const nSims = simulados.length;

  // Âncora: média ponderada dos simulados recentes (últimos 4, peso decrescente)
  let acertoSimuladoAncorado = null;
  if (nSims > 0) {
    const recentes = simulados.slice(-4);
    // Últimos simulados têm peso ligeiramente maior
    const pesos = recentes.map((_, i) => 1 + i * 0.15);
    const totalPeso = pesos.reduce((s, p) => s + p, 0);
    acertoSimuladoAncorado = Math.round(
      recentes.reduce((sum, s, i) => sum + s.pct * pesos[i], 0) / totalPeso
    );
  }

  // Componente de questões: usa ponderada por incidência se disponível, senão acerto global
  const compQuestoes = acertoQuestoesIncidencia ?? acertoQuestoes;

  // Componente de calibração: descuido alto penaliza (inverte 0–100 → penalidade)
  const compCalibracao = indiceDescuido != null
    ? Math.max(0, 100 - indiceDescuido)
    : null;

  // Monte os termos com pesos
  const parts = [
    { v: acertoSimuladoAncorado, w: 0.45 },
    { v: compQuestoes, w: 0.25 },
    { v: cobertura, w: 0.15 },
    { v: saldoRitmoNorm, w: 0.10 },
    { v: compCalibracao, w: 0.05 },
  ].filter(p => p.v != null);

  if (parts.length === 0) return { score: null, bandMin: null, bandMax: null, banda: 18, nSimulados: nSims, confidence: "sem_dado", amostra: "" };

  // Normaliza pesos para não penalizar quando componentes faltam
  const wsum = parts.reduce((s, p) => s + p.w, 0);
  const score = Math.round(parts.reduce((s, p) => s + p.v * (p.w / wsum), 0));

  const banda = calcBanda(nSims);
  const bandMin = Math.max(0, score - banda);
  const bandMax = Math.min(100, score + banda);

  const confidence = nSims === 0 ? "sem_simulado"
    : nSims < 2 ? "baixa"
    : nSims < 3 ? "media"
    : "alta";

  const amostraParts = [];
  if (nSims > 0) amostraParts.push(`${nSims} simulado${nSims > 1 ? "s" : ""}`);
  if (compQuestoes != null) amostraParts.push("questões");
  if (cobertura != null) amostraParts.push("cobertura");
  if (saldoRitmoNorm != null) amostraParts.push("ritmo");
  const amostra = amostraParts.join(" · ");

  return { score, bandMin, bandMax, banda, nSimulados: nSims, confidence, amostra };
}

/**
 * Verifica se a amostra mínima para mostrar o "número forte" foi atingida.
 * Critérios conservadores baseados nas evidências:
 *   - Mínimo de questões: garante que acerto não é aleatório
 *   - Mínimo de áreas: garante cobertura
 *   - Mínimo de simulados: a âncora precisa de ao menos 1 registro
 *   - Mínimo de dias: garante que não é um snap de 1 sessão
 */
export function calcForecastSample({ totalQuestions, areasWithData, nSimulados, activeDays }) {
  const MIN_QUESTIONS = 300;
  const MIN_AREAS = 3;
  const MIN_SIMULADOS = 1;
  const MIN_DAYS = 14;

  const hasMinimum =
    totalQuestions >= MIN_QUESTIONS &&
    areasWithData >= MIN_AREAS &&
    nSimulados >= MIN_SIMULADOS &&
    activeDays >= MIN_DAYS;

  const missing = [];
  if (totalQuestions < MIN_QUESTIONS) missing.push(`${MIN_QUESTIONS - totalQuestions} questões`);
  if (areasWithData < MIN_AREAS) missing.push(`${MIN_AREAS - areasWithData} área${MIN_AREAS - areasWithData > 1 ? "s" : ""} com dados`);
  if (nSimulados < MIN_SIMULADOS) missing.push("1 simulado");
  if (activeDays < MIN_DAYS) missing.push(`${MIN_DAYS - activeDays} dias`);

  return { hasMinimum, missing, totalQuestions, areasWithData, nSimulados, activeDays };
}

export const CONFIDENCE_LABEL = {
  sem_dado: "Sem dado",
  sem_simulado: "Sem simulado — coletando",
  baixa: "Confiança baixa — adicione mais simulados",
  media: "Confiança moderada — 2+ simulados",
  alta: "Confiança alta — 3+ simulados",
};
