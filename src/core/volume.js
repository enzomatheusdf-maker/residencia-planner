import { STEPS, todayStr, diffDays } from "./fsrs";

export function totalQuestoesFeitas(temas) {
  let n = 0;
  for (const t of temas) {
    if (t.unstarted || !t.rev) continue;
    for (const s of STEPS) {
      const r = t.rev[s.key];
      if (r?.done && r.questoes) n += r.questoes;
    }
  }
  return n;
}

export function questoesHoje(temas) {
  const hoje = todayStr();
  let n = 0;
  for (const t of temas) {
    if (t.unstarted || !t.rev) continue;
    for (const s of STEPS) {
      const r = t.rev[s.key];
      if (r?.done && r.questoes && r.date === hoje) n += r.questoes;
    }
  }
  return n;
}

// Saldo de ritmo: positivo = adiantado, negativo = atrás. SEM punição.
export function saldoRitmo(temas, meta, dataInicioStr) {
  if (!meta.metaQuestoesDia) return null;
  const dataInicio = dataInicioStr || todayStr();
  const dias = Math.max(1, diffDays(dataInicio, todayStr()) + 1);
  const esperado = dias * meta.metaQuestoesDia;
  const feito = totalQuestoesFeitas(temas);
  return { feito, esperado, saldo: feito - esperado, dias };
}

// Distribuição da meta diária por área, ponderada por fraqueza × peso de prova
export function metaPorArea(metaDia, acertoPorArea, pesoArea = {}) {
  const areas = Object.keys(pesoArea);
  if (areas.length === 0) return {};
  const raw = {};
  let soma = 0;
  for (const a of areas) {
    const acerto = acertoPorArea[a] ?? 0.5;
    const w = (1 - acerto) * (pesoArea[a] ?? 1); // pior acerto + maior peso => mais questões
    raw[a] = w;
    soma += w;
  }
  const out = {};
  for (const a of areas) {
    out[a] = soma > 0 ? Math.round(metaDia * raw[a] / soma) : 0;
  }
  return out;
}

// Score único de prontidão 0–100 (funde sinais que o app já tem; ignora null e reescala pesos)
export function scoreProntidao({ trueRetention, acertoSimulado, cobertura, saldoRitmoNorm }) {
  const parts = [
    { v: trueRetention, w: 0.35 },
    { v: acertoSimulado, w: 0.30 },
    { v: cobertura, w: 0.20 },
    { v: saldoRitmoNorm, w: 0.15 },
  ].filter(p => p.v != null);
  if (!parts.length) return null;
  const wsum = parts.reduce((sum, p) => sum + p.w, 0);
  const val = parts.reduce((sum, p) => sum + p.v * p.w, 0) / wsum;
  // Re-scale val from 0-1 to 0-100 if it was 0-1, but wait:
  // trueRetention is 0-100, acertoSimulado is 0-100, cobertura is 0-100 (ex. progress or coverage percentage), saldoRitmoNorm is 0-100.
  // So val is already 0-100.
  return Math.round(val);
}
