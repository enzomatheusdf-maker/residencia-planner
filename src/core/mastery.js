// src/core/mastery.js

/**
 * Classifies a topic into one of three mastery levels.
 * Threshold is updated to 80% as requested by the user.
 * 
 * - APRENDENDO: average accuracy < 75% or cycle incomplete (D7 not done).
 * - CONSOLIDANDO: average accuracy 75-79% and D7+ done, or >= 80% but D21/stability/successive relearning not met.
 * - DOMINADO: average accuracy >= 80% and D21 done and high stability (S >= 15) and >= 80% accuracy in at least 2 spaced reviews.
 * 
 * @param {Object} tema 
 * @param {Array} stats 
 * @returns {"aprendendo" | "consolidando" | "dominado"}
 */
export function getEstadoDominio(tema, stats = []) {
  if (!tema || !tema.rev) return "aprendendo";

  // 1. Calculate average accuracy from completed steps in rev
  const completedSteps = Object.keys(tema.rev)
    .map(key => ({ key, ...tema.rev[key] }))
    .filter(r => r.done && r.acerto != null);

  const totalAcerto = completedSteps.reduce((sum, r) => sum + r.acerto, 0);
  const acertoMedio = completedSteps.length > 0 ? totalAcerto / completedSteps.length : 0;

  // 2. Check maturity (D7 / D21 done)
  const d7Done = !!tema.rev.d7?.done;
  const d21Done = !!tema.rev.d21?.done;

  // 3. Check stability S (latest step stability or manutencao stability)
  let latestS = 0;
  if (tema.rev.manutencao && tema.rev.manutencao.S !== undefined) {
    latestS = tema.rev.manutencao.S;
  } else if (tema.rev.d21?.done) {
    latestS = tema.rev.d21.S;
  } else if (tema.rev.d7?.done) {
    latestS = tema.rev.d7.S;
  } else if (tema.rev.d4?.done) {
    latestS = tema.rev.d4.S;
  } else if (tema.rev.d1?.done) {
    latestS = tema.rev.d1.S;
  } else if (tema.rev.d0?.done) {
    latestS = tema.rev.d0.S;
  }

  // 4. Successive relearning check: acerto >= 80% in at least 2 spaced reviews (different steps/runs, excluding D0)
  const highAcertoReviews = completedSteps.filter(r => r.key !== "d0" && r.acerto >= 0.80);
  
  // Also check past stats history if available
  const pastHighAcertoStats = stats.filter(s => s.stepKey !== "d0" && s.acerto >= 0.80);
  
  const uniqueHighSteps = new Set([
    ...highAcertoReviews.map(r => r.key),
    ...pastHighAcertoStats.map(s => s.stepKey)
  ]);

  const hasTwoSpacedHighAcerto = uniqueHighSteps.size >= 2;

  // 5. DOMINADO criteria (threshold of 80%):
  if (acertoMedio >= 0.80 && d21Done && latestS >= 15 && hasTwoSpacedHighAcerto) {
    return "dominado";
  }

  // 6. CONSOLIDANDO criteria:
  if (acertoMedio >= 0.75 && d7Done) {
    return "consolidando";
  }

  return "aprendendo";
}

/**
 * Calculates global readiness for exams.
 */
export function getProntidaoGlobal(temas, temaStats = {}) {
  if (!temas || temas.length === 0) {
    return { index: 0, sugerirModoProva: false };
  }

  const areasMap = {};
  let totalCompletedReviews = 0;
  let sumAcerto = 0;

  temas.forEach(t => {
    if (!t.esp) return;
    if (!areasMap[t.esp]) {
      areasMap[t.esp] = [];
    }
    areasMap[t.esp].push(t);

    if (t.rev) {
      Object.values(t.rev).forEach(r => {
        if (r.done && r.acerto != null) {
          totalCompletedReviews++;
          sumAcerto += r.acerto;
        }
      });
    }
  });

  const acertoMedioGeral = totalCompletedReviews > 0 ? sumAcerto / totalCompletedReviews : 0;
  const areasList = Object.keys(areasMap);
  if (areasList.length === 0) {
    return { index: 0, sugerirModoProva: false };
  }

  let areasConsolidandoOuDomino = 0;

  areasList.forEach(areaName => {
    const areaTemas = areasMap[areaName];
    let countConsolidandoOuDomino = 0;

    areaTemas.forEach(t => {
      const stats = temaStats[t.id] || [];
      const state = getEstadoDominio(t, stats);
      if (state === "consolidando" || state === "dominado") {
        countConsolidandoOuDomino++;
      }
    });

    // If at least 60% of themes in this area are consolidando/dominado
    if (areaTemas.length > 0 && (countConsolidandoOuDomino / areaTemas.length) >= 0.6) {
      areasConsolidandoOuDomino++;
    }
  });

  const pctAreasProntas = areasConsolidandoOuDomino / areasList.length;

  // SUGERIR MODO PROVA criteria:
  // - Acerto médio geral >= 80% (since threshold shifted to 80%) and >= 70% of areas ready
  const sugerirModoProva = acertoMedioGeral >= 0.80 && pctAreasProntas >= 0.70;
  const index = (acertoMedioGeral + pctAreasProntas) / 2;

  return {
    index,
    acertoMedioGeral,
    pctAreasProntas,
    sugerirModoProva
  };
}
