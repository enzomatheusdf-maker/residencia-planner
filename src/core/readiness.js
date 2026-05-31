import { STEPS } from "./fsrs";
import { PROVA_STATS_RES, PROVA_STATS_VEST, PROVAS_RES, PROVAS_VEST } from "../constants/provaStats";
import { saldoRitmo, scoreProntidao } from "./volume";
import { calcTrueRetention } from "../hooks/useMetrics";

// Combined stats lookup
const PROVA_STATS = {
  ...PROVA_STATS_RES,
  ...PROVA_STATS_VEST
};

export function pickTargetProva(provasAlvo, plat) {
  const list = plat === "res" ? PROVAS_RES : PROVAS_VEST;
  const filtered = (provasAlvo || []).filter(p => list.includes(p));
  return filtered[0] || (plat === "res" ? "SES-DF" : "UnB");
}

// Maps student specialty to exam area names
export function matchesArea(studentEsp, examAreaName) {
  const s = studentEsp.toLowerCase().trim();
  const e = examAreaName.toLowerCase().trim();
  if (s === e) return true;
  if (s === "cirurgia" && e === "cirurgia geral") return true;
  if (s === "go" && (e === "ginecologia e obstetrícia" || e === "go")) return true;
  if (s === "preventiva" && (e === "medicina preventiva" || e === "preventiva/mfc" || e === "saúde coletiva")) return true;
  if (s === "exatas" && e === "matemática") return true;
  return false;
}

export function getReadinessData({ temas, simulados, meta, plat }) {
  const startedTemas = temas.filter(t => !t.unstarted);
  
  // 1. Calculate Coverage (Cobertura) percentage of target topics in grade
  const totalTopics = temas.length;
  const startedTopics = startedTemas.length;
  const cobertura = totalTopics > 0 ? Math.round((startedTopics / totalTopics) * 100) : 0;

  // 2. True Retention (FSRS retention on D15+ steps)
  const trueRetention = calcTrueRetention(temas); // returns 0-100 or null

  // 3. Mock Exam average (Acerto Simulado)
  const simPcts = simulados.map(s => s.pct);
  const acertoSimulado = simPcts.length > 0
    ? Math.round(simPcts.reduce((a, b) => a + b, 0) / simPcts.length)
    : null;

  // 4. Rhythm Balance Normalized (0-100)
  // Positive/zero balance = 100%, negative is normalized down
  let saldoRitmoNorm = null;
  if (meta.metaQuestoesDia > 0) {
    const startStr = startedTemas.length > 0 ? startedTemas[0].d0 : null;
    const pace = saldoRitmo(temas, meta, startStr);
    if (pace) {
      if (pace.saldo >= 0) {
        saldoRitmoNorm = 100;
      } else {
        // e.g. if we are behind, scale it relative to expected
        const ratio = pace.esperado > 0 ? Math.max(0, (pace.feito / pace.esperado)) : 1;
        saldoRitmoNorm = Math.round(ratio * 100);
      }
    }
  }

  // 5. Calculate unified score
  const score = scoreProntidao({
    trueRetention: trueRetention,
    acertoSimulado: acertoSimulado,
    cobertura: cobertura,
    saldoRitmoNorm: saldoRitmoNorm
  });

  // 6. Confidence range (e.g. +/- 6 points, bounded by 0-100)
  const rangeMin = score !== null ? Math.max(0, score - 6) : null;
  const rangeMax = score !== null ? Math.min(100, score + 6) : null;

  // 7. Map Target Provas weights to student performance
  const targetProva = pickTargetProva(meta.provasAlvo, plat);
  const examData = PROVA_STATS[targetProva];

  const areaRetention = {};
  const areaIncidence = {};
  const areaCobertura = {};
  const areaHotTopics = {};
  const areaStartedCount = {};
  const priorityList = [];

  if (examData && examData.perfil && examData.perfil.areas) {
    examData.perfil.areas.forEach(areaName => {
      const totalAreaTemas = temas.filter(t => matchesArea(t.esp, areaName));
      const startedAreaTemas = totalAreaTemas.filter(t => !t.unstarted);
      
      const doneSteps = startedAreaTemas.flatMap(t => STEPS.map(s => t.rev?.[s.key])).filter(r => r?.done && r.acerto != null);
      
      areaRetention[areaName] = doneSteps.length > 0
        ? Math.round((doneSteps.reduce((sum, r) => sum + r.acerto, 0) / doneSteps.length) * 100)
        : null;

      const concLevel = examData.concorrencia?.[areaName] || "média";
      const concFactor = {
        "altíssima": 1.2,
        "alta": 1.1,
        "média-alta": 1.05,
        "média": 1.0,
        "baixa-média": 0.95,
        "baixa": 0.9
      }[concLevel] || 1.0;

      const hotCount = examData.temasQuentes?.[areaName]?.length || 0;
      const hotFactor = 0.8 + hotCount * 0.1;
      const incidence = Number((concFactor * hotFactor).toFixed(2));
      
      areaIncidence[areaName] = Math.max(0.6, Math.min(1.4, incidence));
      areaCobertura[areaName] = totalAreaTemas.length > 0
        ? Math.round((startedAreaTemas.length / totalAreaTemas.length) * 100)
        : 0;
      areaHotTopics[areaName] = examData.temasQuentes?.[areaName] || [];
      areaStartedCount[areaName] = startedAreaTemas.length;

      // principle 80/20 priority
      const retention = areaRetention[areaName];
      const fraqueza = retention !== null ? (100 - retention) / 100 : 1.0;
      const prioridade = areaIncidence[areaName] * (0.35 + 0.65 * fraqueza);
      
      let zona = "verde";
      const isAltaInc = areaIncidence[areaName] >= 0.95;
      const isAltoDominio = retention !== null && retention >= 75;
      if (isAltaInc) {
        zona = isAltoDominio ? "laranja" : "vermelha";
      } else {
        zona = isAltoDominio ? "verde" : "roxa";
      }

      priorityList.push({
        area: areaName,
        retention,
        incidence: areaIncidence[areaName],
        cobertura: areaCobertura[areaName],
        hotTopics: areaHotTopics[areaName],
        startedCount: areaStartedCount[areaName],
        prioridade,
        zona
      });
    });

    priorityList.sort((a, b) => b.prioridade - a.prioridade);
  }

  // 8. Error Patterns & Diagnostics
  const errorCounts = { lacuna: 0, raciocinio: 0, distractor: 0, descuido: 0, nao_visto: 0, interpretacao: 0 };
  let totalErrors = 0;

  simulados.forEach(s => {
    (s.questoesErradas || []).forEach(q => {
      if (q.tipoErro && errorCounts[q.tipoErro] !== undefined) {
        errorCounts[q.tipoErro]++;
        totalErrors++;
      }
    });
  });

  let dominantError = null;
  let maxCount = 0;
  Object.entries(errorCounts).forEach(([k, v]) => {
    if (v > maxCount) {
      maxCount = v;
      dominantError = k;
    }
  });

  return {
    score,
    range: score !== null ? [rangeMin, rangeMax] : null,
    cobertura,
    trueRetention,
    acertoSimulado,
    saldoRitmoNorm,
    targetProva,
    examData,
    areaRetention,
    areaIncidence,
    areaCobertura,
    areaHotTopics,
    priorityList,
    totalErrors,
    errorCounts,
    dominantError,
  };
}
