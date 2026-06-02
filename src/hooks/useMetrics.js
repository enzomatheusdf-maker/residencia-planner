// src/hooks/useMetrics.js
// Optimized math and analytics calculation engines for FSRS study data

import { useMemo } from "react";
import { STEPS, IMPORTANCIA, todayStr, diffDays, addDays } from "../core/fsrs";
import { getAreaWeight, findHotnessSubarea, BONUS_RETORNO_RAPIDO } from "../core/provasStats";
import { useStore } from "../core/store";
import { getDominioPrevioStatus, getNextReviewForTema } from "../core/domainValidation";

// ─── VESTIBULAR WEIGHTS & SCORE ──────────────────────────────────────────────

/** Weights (%) per area per exam. Used to compute marginal-return priority. */
export const PESOS_PROVA_VEST = {
  ENEM: { "Exatas": 25, "Ciências da Natureza": 25, "Humanas": 25, "Linguagens": 20, "Redação": 5 },
  FUVEST: { "Exatas": 35, "Ciências da Natureza": 30, "Linguagens": 20, "Humanas": 15, "Redação": 0 },
  UNICAMP: { "Linguagens": 30, "Exatas": 22, "Ciências da Natureza": 22, "Humanas": 18, "Redação": 8 },
  "EEAR / ESA": { "Exatas": 55, "Linguagens": 25, "Ciências da Natureza": 10, "Humanas": 10, "Redação": 0 },
  "ITA / IME": { "Exatas": 70, "Ciências da Natureza": 20, "Linguagens": 10, "Humanas": 0, "Redação": 0 },
};

/**
 * Returns a priority multiplier based on how close the user is to the cutoff.
 * Areas near the cutoff have higher return per study hour.
 */
function calcRetornoMarginal(notaAtual, notaCorte, peso) {
  if (!notaCorte || notaCorte <= 0) return 1.0;
  const diferenca = notaCorte - notaAtual;
  if (diferenca <= 0) return 0.5; // já passou
  if (diferenca <= peso * 0.2) return 2.0;
  if (diferenca <= peso * 0.5) return 1.5;
  return 1.0;
}

/**
 * Vestibular-specific score for a (tema, step) pair.
 */
function scoreVestibular(t, s, today, meta) {
  const filtered = (meta?.provasAlvo || []).filter(p => ["UnB", "UFG"].includes(p));
  const provaAlvo = filtered[0] || "UnB";
  const pesos = PESOS_PROVA_VEST[provaAlvo] || PESOS_PROVA_VEST.ENEM;
  const peso = (pesos[t.esp] || 10) / 100; // normalize to 0–1

  const notasAnterior = meta?.notasTentativaAnterior || {};
  const notaAtual = notasAnterior[t.esp] ?? 50; // default 50%
  const notaCorte = meta?.notaCorteAlvo || 60;
  const retornoMarginal = calcRetornoMarginal(notaAtual, notaCorte, peso * 100);

  // Average acerto for this theme
  const revVals = STEPS.map(st => t.rev[st.key]).filter(r => r && r.done && r.acerto != null);
  const acertoMedia = revVals.length > 0
    ? revVals.reduce((a, r) => a + r.acerto, 0) / revVals.length
    : 0.5;

  const r = t.rev[s.key];
  const rDate = r.date;
  const overdue = rDate < today;
  const urgencia = overdue ? 1.5 : 1.0;
  const lacuna = 1 - acertoMedia;

  return +(lacuna * peso * urgencia * retornoMarginal).toFixed(3);
}

/**
 * Calculates the FSRS active queue sorted by urgency score.
 * Time Complexity: O(N) where N is total topics * steps.
 * Optimized to cache the today string and avoid string/date realocations.
 * Accepts optional plat and meta for vestibular-aware scoring.
 */
export function calcFilaInteligente(temas, plat, meta) {

  if (!temas || temas.length === 0) return [];
  
  const today = todayStr();
  const items = [];
  
  for (let i = 0; i < temas.length; i++) {
    const t = temas[i];
    if (t.unstarted) continue;
    const rev = t.rev;
    if (!rev) continue;
    
    // Calculate average score for the theme in a single pass
    let sumAcertos = 0;
    let doneStepsCount = 0;
    
    const stepKeys = STEPS.map((step) => step.key);
    for (let j = 0; j < stepKeys.length; j++) {
      const stepKey = stepKeys[j];
      const r = rev[stepKey];
      if (r && r.done && !r.skipped && r.skipReason !== "dominio_previo" && !r.skippeadoPorDominio && r.acerto != null) {
        sumAcertos += r.acerto;
        doneStepsCount++;
      }
    }
    
    const acertoMedia = doneStepsCount > 0 ? sumAcertos / doneStepsCount : 0.5;
    const imp = t.importancia || "ALTA";
    const pesoImp = IMPORTANCIA[imp]?.peso || 2.0;
    
    const isDominioPrevio = getDominioPrevioStatus(t).isValidated;
    const nextReview = isDominioPrevio ? getNextReviewForTema(t, today) : null;
    const queueSteps = isDominioPrevio && nextReview
      ? [{ key: nextReview.stepKey, label: nextReview.label, offset: 0, desc: nextReview.label, checkbox: false }]
      : STEPS;
    for (let j = 0; j < queueSteps.length; j++) {
      const s = queueSteps[j];
      const r = rev[s.key];
      if (!r || r.done || r.skipped || r.skipReason === "dominio_previo" || r.skippeadoPorDominio) continue;
      
      const rDate = r.date;
      if (!rDate) continue;
      
      const overdue = rDate < today;
      const isToday = rDate === today;
      if (!overdue && !isToday) continue;
      
      let score;
      if (plat === "vest") {
        score = scoreVestibular(t, s, today, meta);
        const weight = getAreaWeight(plat, t.esp, meta);
        score = score * weight;
      } else {
        const urgencia = overdue ? 1.5 : 1.0;
        const pesoArea = getAreaWeight(plat, t.esp, meta);
        const bonus = acertoMedia < 0.6 ? (BONUS_RETORNO_RAPIDO[t.esp] ?? 0) : 0;
        score = (1 - acertoMedia) * pesoImp * urgencia * pesoArea + bonus;

        const hotness = findHotnessSubarea(t.esp, t.subarea || t.nome);
        if (hotness) {
          score *= (0.85 + 0.3 * hotness.normalizado);
        }
      }
      
      items.push({
        temaId: t.id,
        temaNome: t.nome,
        esp: t.esp,
        importancia: imp,
        stepKey: s.key,
        step: s,
        date: rDate,
        overdue,
        score: +score.toFixed(2),
      });
    }
  }
  
  return items.sort((a, b) => b.score - a.score);
}

/**
 * Calculates elite learning analytics on mock exam logs in a single O(N) pass.
 */
export function calcMetricasElite(simulados, plat = "res", provaAlvo = "ENAMED") {
  if (!simulados || simulados.length === 0) {
    return { indiceDescuido: null, velEficiente: null, taxaConversao: null, diagnostico: [], insights: [] };
  }
  
  let totalErros = 0;
  let descuidos = 0;
  let simsComTempoCount = 0;
  let sumVelEficiente = 0;
  
  let verificadasCount = 0;
  let convertidasCount = 0;
  
  const porArea = {};
  
  for (let i = 0; i < simulados.length; i++) {
    const s = simulados[i];
    const questoesErradas = s.questoesErradas || [];
    const tempoMin = s.tempoMin;
    const acertos = s.acertos || 0;
    
    if (tempoMin > 0) {
      sumVelEficiente += acertos / (tempoMin / 60);
      simsComTempoCount++;
    }
    
    const qErradasLength = questoesErradas.length;
    totalErros += qErradasLength;
    
    for (let j = 0; j < qErradasLength; j++) {
      const q = questoesErradas[j];
      if (q.tipoErro === "descuido") {
        descuidos++;
      }
      
      if (q.corrigidaD7 != null) {
        verificadasCount++;
        if (q.corrigidaD7 === true) {
          convertidasCount++;
        }
      }
      
      const esp = q.esp;
      if (esp) {
        let area = porArea[esp];
        if (!area) {
          area = { total: 0, lacuna: 0, raciocinio: 0, distractor: 0, descuido: 0, nao_visto: 0 };
          porArea[esp] = area;
        }
        area.total++;
        const tipoErro = q.tipoErro;
        if (tipoErro && tipoErro in area) {
          area[tipoErro]++;
        }
      }
    }
  }
  
  const indiceDescuido = totalErros >= 3 ? Math.round((descuidos / totalErros) * 100) : null;
  const velEficiente = simsComTempoCount >= 2 ? +(sumVelEficiente / simsComTempoCount).toFixed(1) : null;
  const taxaConversao = verificadasCount >= 3 ? Math.round((convertidasCount / verificadasCount) * 100) : null;
  
  const diagnostico = Object.keys(porArea).map((esp) => {
    const v = porArea[esp];
    const tipos = ["lacuna", "raciocinio", "distractor", "descuido", "nao_visto"];
    let dominante = "lacuna";
    let maxVal = -1;
    for (let k = 0; k < tipos.length; k++) {
      const val = v[tipos[k]] || 0;
      if (val > maxVal) {
        maxVal = val;
        dominante = tipos[k];
      }
    }
    return {
      esp,
      ...v,
      dominante,
      pctDescuido: v.total ? Math.round((v.descuido || 0) / v.total * 100) : 0,
      pctRaciocinio: v.total ? Math.round((v.raciocinio || 0) / v.total * 100) : 0,
    };
  }).sort((a, b) => b.total - a.total);
  
  const insights = [];
  if (indiceDescuido > 25) {
    insights.push(`${indiceDescuido}% dos seus erros são descuido — o problema é atenção, não conteúdo.`);
  }
  if (velEficiente) {
    if (plat === "vest") {
      const targetVel = provaAlvo === "FUVEST" ? 24 : 36;
      insights.push(`Velocidade: ${velEficiente} certas/hora. Meta ${provaAlvo}: ${targetVel}/hora.`);
    } else {
      insights.push(`Velocidade: ${velEficiente} certas/hora. Meta ENAMED: 40/hora.`);
    }
  }
  if (taxaConversao !== null && taxaConversao < 70) {
    insights.push(`Taxa de conversão ${taxaConversao}% — abaixo de 70%. Revise o método de correção.`);
  }
  
  return {
    indiceDescuido,
    velEficiente,
    taxaConversao,
    diagnostico,
    insights: insights.slice(0, 3),
  };
}

export function calcTrend(values) {
  if (values.length < 2) return null;
  const n = values.length;
  const xs = values.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * values[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;
  return +((n * sumXY - sumX * sumY) / denom).toFixed(2);
}

export function calcProjecao(values, steps = 3) {
  const trend = calcTrend(values);
  if (trend === null) return null;
  const last = values[values.length - 1];
  return Math.min(100, Math.max(0, Math.round(last + trend * steps)));
}

export function calcStreaks(doneDays) {
  if (!doneDays) return { current: 0, best: 0 };
  const today = todayStr();
  
  // Calcula dias ativos nos últimos 7 dias
  const last7Days = [];
  for (let i = 0; i < 7; i++) {
    last7Days.push(addDays(today, -i));
  }
  const current = [...doneDays].filter(d => last7Days.includes(d)).length;

  let best = current;
  if (doneDays.size > 0) {
    const sorted = [...doneDays].sort();
    let curConsec = 1;
    let maxConsec = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = diffDays(sorted[i - 1], sorted[i]);
      if (diff === 1) {
        curConsec++;
        maxConsec = Math.max(maxConsec, curConsec);
      } else if (diff > 1) {
        curConsec = 1;
      }
    }
    best = Math.max(maxConsec, current);
  }
  
  return { current, best };
}

export function calcBleedingScore(temas) {
  const byEsp = {};
  for (let i = 0; i < temas.length; i++) {
    const t = temas[i];
    if (t.unstarted) continue;
    if (!byEsp[t.esp]) byEsp[t.esp] = { total: 0, questoes: 0 };
    
    for (let j = 0; j < STEPS.length; j++) {
      const s = STEPS[j];
      const r = t.rev[s.key];
      if (r && r.done && r.acerto != null && r.questoes) {
        byEsp[t.esp].total += r.acerto * r.questoes;
        byEsp[t.esp].questoes += r.questoes;
      }
    }
  }
  
  return Object.entries(byEsp)
    .filter(([, v]) => v.questoes >= 10)
    .map(([esp, v]) => ({ esp, acc: Math.round((v.total / v.questoes) * 100) }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 3);
}

export function calcTrueRetention(temas) {
  const detailed = calcTrueRetentionDetailed(temas);
  return detailed?.pct ?? null;
}

function shouldCountLongRetentionEvent(event = {}, now = todayStr()) {
  if (!event || event.acerto == null) return false;
  if (event.official === false) return false;
  if (event.stepKey === "d21") return true;
  if (event.phase === "maintenance" || event.phaseAfter === "maintenance") return true;
  if (Number(event.intervalBefore) >= 15) return true;
  if (event.scheduledAt && event.reviewedAt) {
    return Math.max(0, diffDays(event.scheduledAt, event.reviewedAt)) >= 15;
  }
  if (event.reviewedAt && event.previousReviewedAt) {
    return Math.max(0, diffDays(event.previousReviewedAt, event.reviewedAt)) >= 15;
  }
  return false;
}

export function calcTrueRetentionDetailed(temas = []) {
  let weightedHits = 0;
  let weightedTotal = 0;
  let n = 0;
  let totalQuestoes = 0;
  const now = todayStr();

  for (let i = 0; i < temas.length; i++) {
    const t = temas[i];
    if (!t || t.unstarted) continue;
    const history = Array.isArray(t.rev?.reviewHistory) ? t.rev.reviewHistory : [];

    for (let j = 0; j < history.length; j++) {
      const event = history[j];
      if (!shouldCountLongRetentionEvent(event, now)) continue;
      const acerto = Number(event.acerto);
      if (Number.isNaN(acerto)) continue;
      const questoes = Number(event.questoes);
      const weight = Number.isFinite(questoes) && questoes > 0 ? questoes : 1;
      weightedHits += acerto * weight;
      weightedTotal += weight;
      totalQuestoes += Number.isFinite(questoes) && questoes > 0 ? questoes : 0;
      n += 1;
    }

    if (!history.length) {
      const d21 = t.rev?.d21;
      if (d21?.done && d21.acerto != null) {
        const questoes = Number(d21.questoes);
        const weight = Number.isFinite(questoes) && questoes > 0 ? questoes : 1;
        weightedHits += Number(d21.acerto) * weight;
        weightedTotal += weight;
        totalQuestoes += Number.isFinite(questoes) && questoes > 0 ? questoes : 0;
        n += 1;
      }
    }
  }

  if (weightedTotal <= 0 || n <= 0) {
    return {
      value: null,
      pct: null,
      n: 0,
      totalQuestoes: 0,
      source: "d21+maintenance",
      collecting: true,
    };
  }

  const value = weightedHits / weightedTotal;
  return {
    value,
    pct: Math.round(value * 100),
    n,
    totalQuestoes,
    source: "d21+maintenance",
    collecting: false,
  };
}

// ─── CUSTOM REACT HOOK WRAPPERS ──────────────────────────────────────────────

export const migrarSim = (s) => ({
  tipo: "pratica", tempoMin: null, ansiedade: null, cansaco: null,
  turno: null, porArea: [],
  ...s,
  questoesErradas: s.questoesErradas || [],
  statusCorrecao: s.statusCorrecao || "concluida",
});

export function useFilaInteligente(overrideTemas) {
  const plat = useStore((s) => s.plat);
  const meta = useStore((s) => s.meta);
  const storeTemas = useStore((s) => s[plat]?.temas || []);
  const temas = overrideTemas !== undefined ? overrideTemas : storeTemas;
  return useMemo(() => calcFilaInteligente(temas, plat, meta), [temas, plat, meta]);
}

export function useMetricasElite(simulados) {
  return useMemo(() => calcMetricasElite(simulados), [simulados]);
}
