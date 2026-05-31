// src/core/calibration.js
// Metacognitive calibration functions: measures prediction precision and bias

/**
 * Calculates user's calibration statistics based on completed sessions
 * @param {Array} stats - Flat array of stats objects (e.g. Object.values(temaStats).flat())
 * @returns {Object} calibration details
 */
export function calcCalibration(stats) {
  if (!Array.isArray(stats)) {
    return { status: "coletando", n: 0 };
  }
  
  const p = stats.filter(s => s && s.previsao != null && s.acerto != null);
  if (p.length < 5) {
    return { status: "coletando", n: p.length };
  }

  const erro = p.reduce((a, s) => a + Math.abs(s.previsao - s.acerto), 0) / p.length;
  const vies = p.reduce((a, s) => a + (s.previsao - s.acerto), 0) / p.length; // positive = overconfident, negative = underconfident

  return {
    status: "ok",
    precisao: Math.round((1 - erro) * 100),
    vies: Math.round(vies * 100),
    tendencia: vies > 0.1 ? "excesso_confianca" : vies < -0.1 ? "subestima" : "calibrado"
  };
}
