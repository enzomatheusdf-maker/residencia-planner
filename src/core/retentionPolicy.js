// src/core/retentionPolicy.js
// Retention policy logic based on preparation phase, overload, and history.

/**
 * Recommends a desired retention target based on the exam phase, overload status, and history.
 *
 * @param {Object} params
 * @param {string} params.examPhase - The current phase of preparation (e.g., "inicial", "base", "reta_final", "vespera")
 * @param {boolean} params.overload - Whether the student is currently overloaded
 * @param {Array} params.history - The student's review history events
 * @returns {Object} { desiredRetention, rationale }
 */
export function recommendDesiredRetention({ examPhase, overload, history } = {}) {
  const base = 0.88;
  let desiredRetention = base;
  let rationale = "Fase padrão. Retenção recomendada em 88% para equilibrar a carga diária e a consolidação do conhecimento.";

  if (examPhase === "reta_final" || examPhase === "vespera") {
    desiredRetention = 0.92;
    rationale = "Reta final ou véspera da prova. Retenção elevada para 92% para garantir que os temas fiquem frescos na memória de curto/médio prazo.";
  } else if ((examPhase === "inicial" || examPhase === "base") && !overload) {
    desiredRetention = 0.85;
    rationale = "Fase inicial e sem sobrecarga. Retenção recomendada em 85% para aliviar o volume diário de revisões.";
  }

  if (overload) {
    if (desiredRetention > base) {
      desiredRetention = base;
      rationale = "Sobrecarga de estudos detectada. O alvo de retenção foi limitado ao valor base de 88% para evitar explosão de carga.";
    }
  }

  return { desiredRetention, rationale };
}
