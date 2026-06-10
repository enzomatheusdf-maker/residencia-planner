import { STEPS, todayStr, addDays } from "./fsrs";
import { PROVA_STATS_RES, PROVA_STATS_VEST, PROVAS_RES, PROVAS_VEST } from "../constants/provaStats";
import { saldoRitmo, scoreProntidao } from "./volume";
import { calcTrueRetention, calcTrend } from "../hooks/useMetrics";
import { getEnamedIntel, calcPreparoEnamed } from "./enamedIntel";
import { calculateClinicalReasoningScore } from "./clinicalReasoningScoring";
import { estimateReadinessForecast } from "./forecast";
import { P3_WHAT_IF_ENABLED } from "./devFlags";
import { buildP3WhatIfScenarios } from "./p3WhatIf";

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

function hasTemaStatsSignal(tema = {}, temaStats = {}) {
  const idCandidates = tema.id === undefined || tema.id === null ? [] : [tema.id, String(tema.id)];
  const candidates = [...idCandidates, tema.nome, tema.topicName]
    .filter((key) => key !== undefined && key !== null && key !== "");
  return candidates.some((key) => Array.isArray(temaStats?.[key]) && temaStats[key].length > 0);
}

export function hasTemaBeenSeen(tema = {}, temaStats = {}) {
  if (!tema) return false;
  const dominioPrevio = tema.dominioPrevio || tema.validacaoDominio || {};
  if (dominioPrevio.status === "validado_previo" || dominioPrevio.validado === true) return true;
  if (hasTemaStatsSignal(tema, temaStats)) return true;
  if (Array.isArray(tema.rev?.reviewHistory) && tema.rev.reviewHistory.length > 0) return true;
  return STEPS.some((step) => {
    const review = tema.rev?.[step.key];
    return Boolean(review?.done && !review.skipped && review.skipReason !== "dominio_previo" && !review.skippeadoPorDominio);
  });
}

// Removido: calcRaciocinioScore local substituida por calculateClinicalReasoningScore
// de clinicalReasoningScoring.js (fonte canonica unica — P4-A)

export function getReadinessData({
  temas = [],
  simulados = [],
  meta = {},
  plat = "res",
  casosProgresso = {},
  temaStats = {},
  operationalMode = null,
  calibration = null,
}) {
  const startedTemas = temas.filter(t => hasTemaBeenSeen(t, temaStats));
  const today = todayStr();
  
  // 1. Calculate Coverage (Cobertura) percentage of target topics in grade
  const totalTopics = temas.length;
  const startedTopics = startedTemas.length;
  const cobertura = totalTopics > 0 ? Math.round((startedTopics / totalTopics) * 100) : 0;

  // 2. True Retention (FSRS retention on D15+ steps)
  const trueRetention = calcTrueRetention(temas); // returns 0-100 or null

  // 3. Mock Exam average — média móvel dos últimos 4 simulados
  const simPcts = simulados.map(s => s.pct);
  const simsRecentes = simulados.slice(-4);
  const acertoSimulado = simsRecentes.length > 0
    ? Math.round(simsRecentes.reduce((a, s) => a + s.pct, 0) / simsRecentes.length)
    : null;
  const tendenciaSim = calcTrend(simPcts);

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

  let adesaoAnkiNorm = null;
  const adesaoDatas = meta?.ankiAdesao?.datas || [];
  if (adesaoDatas.length > 0) {
    let hits = 0;
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, -i);
      if (adesaoDatas.includes(date)) hits++;
    }
    adesaoAnkiNorm = Math.round((hits / 7) * 100);
  }

  // 5. Calculate unified score
  const score = scoreProntidao({
    trueRetention: trueRetention,
    acertoSimulado: acertoSimulado,
    cobertura: cobertura,
    saldoRitmoNorm: saldoRitmoNorm,
    adesaoAnkiNorm: adesaoAnkiNorm
  });
  const raciocinioScore = meta?.modulos?.raciocinioClinico
    ? calculateClinicalReasoningScore(casosProgresso)
    : null;
  const forecast = estimateReadinessForecast({
    temas,
    temaStats,
    simulados,
    meta,
    plat,
    today,
    operationalMode,
    calibration,
  });
  const p3WhatIf = buildP3WhatIfScenarios({
    forecast,
    meta,
    enabled: P3_WHAT_IF_ENABLED,
  });

  // 6. Confidence range (e.g. +/- 6 points, bounded by 0-100)
  const rangeMin = score !== null ? Math.max(0, score - 6) : null;
  const rangeMax = score !== null ? Math.min(100, score + 6) : null;

  // 7. Map Target Provas weights to student performance
  const targetProva = pickTargetProva(meta.provasAlvo, plat);
  // Resolve directly from source exports to avoid module-scope TDZ during HMR/circular partial init.
  const examData = PROVA_STATS_RES[targetProva] || PROVA_STATS_VEST[targetProva] || null;
  const enamedIntel = plat === "res" ? getEnamedIntel(temas) : null;
  const preparoEnamed = plat === "res" ? calcPreparoEnamed(temas) : null;

  const areaRetention = {};
  const areaIncidence = {};
  const areaCobertura = {};
  const areaHotTopics = {};
  const areaStartedCount = {};
  const priorityList = [];

  if (examData && examData.perfil && examData.perfil.areas) {
    examData.perfil.areas.forEach(areaName => {
      const totalAreaTemas = temas.filter(t => matchesArea(t.esp, areaName));
      const startedAreaTemas = totalAreaTemas.filter(t => hasTemaBeenSeen(t, temaStats));
      
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
    tendenciaSim,
    saldoRitmoNorm,
    adesaoAnkiNorm,
    raciocinioScore,
    forecast,
    p3WhatIf: p3WhatIf.enabled ? p3WhatIf : null,
    targetProva,
    examData,
    areaRetention,
    areaIncidence,
    areaCobertura,
    areaHotTopics,
    priorityList,
    enamedIntel,
    preparoEnamed,
    totalErrors,
    errorCounts,
    dominantError,
  };
}
