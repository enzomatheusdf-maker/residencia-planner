// src/core/domainValidation.js
// Lógica de validação de domínio prévio (puramente funcional).

import { STEPS, S_BASE, addDays, todayStr, getAreaPrior } from "./fsrs";

export const DOMINIO_PREVIO_MIN_QUESTOES = 15;
export const DOMINIO_PREVIO_MIN_ACERTO = 80;

export function isTemaNaoIniciado(tema = {}) {
  const dp = tema.dominioPrevio || tema.validacaoDominio || {};
  if (["validacao_pendente", "validado_previo", "reprovado"].includes(dp.status)) return false;

  const status = String(tema.status || "").toLowerCase();
  const hasFsrsSignal = Boolean(
    tema.fsrs && (
      tema.fsrs.last_review ||
      Number(tema.fsrs.reps || 0) > 0 ||
      Number(tema.fsrs.S || 0) > 0 ||
      Number(tema.fsrs.D || 0) > 0
    )
  );
  const hasRevSignal = STEPS.some((step) => Boolean(tema.rev?.[step.key]?.done));

  const sinais = [
    tema.iniciadoEm,
    tema.estudadoEm,
    tema.concluidoEm,
    tema.lastReview,
    tema.last_review,
    tema.revisadoEm,
    status && !["novo", "nao_iniciado", "não_iniciado", ""].includes(status),
    Number(tema.revisoes || tema.reviews || tema.reps || 0) > 0,
    Number(tema.acertos || tema.respondidas || tema.totalQuestoes || 0) > 0,
    hasFsrsSignal,
    hasRevSignal,
    !tema.unstarted,
  ];

  return !sinais.some(Boolean);
}

/**
 * Classificação de domínio usada na UI:
 *  - alto: >= 90% (D14)
 *  - intermediario: 80-89% (D7)
 *  - insuficiente: < 80%
 */
export function classificarDominio(pctAcerto) {
  if (pctAcerto >= 90) return "alto";
  if (pctAcerto >= DOMINIO_PREVIO_MIN_ACERTO) return "intermediario";
  return "insuficiente";
}

export const DOMINIO_META = {
  alto: {
    label: "Domínio Alto",
    desc: "Domínio prévio validado. Próxima revisão inicial em D14.",
    color: "#10b981",
  },
  intermediario: {
    label: "Domínio Intermediário",
    desc: "Domínio prévio validado. Próxima revisão inicial em D7.",
    color: "#f59e0b",
  },
  insuficiente: {
    label: "Domínio Insuficiente",
    desc: "Tema mantido no fluxo normal de estudo.",
    color: "#f87171",
  },
};

export function calcularDominioPrevio({ acertos, total }) {
  const a = Number(acertos);
  const t = Number(total);

  if (!Number.isFinite(a) || !Number.isFinite(t) || t <= 0 || a < 0 || a > t) {
    return {
      valido: false,
      status: "invalido",
      percentual: 0,
      motivo: "Informe total e acertos válidos.",
    };
  }

  const percentual = Math.round((a / t) * 100);
  if (t < DOMINIO_PREVIO_MIN_QUESTOES) {
    return {
      valido: false,
      status: "amostra_insuficiente",
      percentual,
      motivo: `Resolva pelo menos ${DOMINIO_PREVIO_MIN_QUESTOES} questões para validar domínio prévio.`,
    };
  }

  if (percentual < DOMINIO_PREVIO_MIN_ACERTO) {
    return {
      valido: false,
      status: "reprovado",
      percentual,
      motivo: "Domínio ainda não está estável; o tema volta para o fluxo normal.",
    };
  }

  const intervaloInicial = percentual >= 90 ? 14 : 7;
  return {
    valido: true,
    status: "validado_previo",
    percentual,
    intervaloInicial,
    proximaRevisao: addDays(todayStr(), intervaloInicial),
    motivo:
      percentual >= 90
        ? "Domínio prévio forte: tema entra em revisão inicial D14."
        : "Domínio prévio suficiente: tema entra em revisão inicial D7.",
  };
}

export function criarValidacaoDominioPrevio() {
  return {
    status: "validacao_pendente",
    iniciadoEm: todayStr(),
    validadoEm: null,
    metodo: "ja_domino",
    questoesAlvo: DOMINIO_PREVIO_MIN_QUESTOES,
    total: null,
    acertos: null,
    percentual: null,
    intervaloInicial: null,
    proximaRevisao: null,
    observacao: null,
  };
}

export function finalizarValidacaoDominioPrevio({ acertos, total }) {
  const resultado = calcularDominioPrevio({ acertos, total });
  return {
    status: resultado.valido ? "validado_previo" : "reprovado",
    iniciadoEm: todayStr(),
    validadoEm: todayStr(),
    metodo: "ja_domino",
    questoesAlvo: DOMINIO_PREVIO_MIN_QUESTOES,
    total: Number(total),
    acertos: Number(acertos),
    percentual: resultado.percentual,
    intervaloInicial: resultado.intervaloInicial || null,
    proximaRevisao: resultado.proximaRevisao || null,
    observacao: resultado.motivo,
  };
}

/**
 * Constrói ciclo pós-validação:
 * - insuficiente: null (mantém ciclo original)
 * - intermediario: próxima revisão em D7
 * - alto: próxima revisão em D14
 */
export function buildRevComDominio(d0, esp, importancia, classificacao, pctAcerto) {
  const prior = getAreaPrior(esp);
  const hoje = todayStr();
  const baseDate = d0 >= hoje ? d0 : hoje;

  if (classificacao === "insuficiente") return null;

  const intervaloInicial = classificacao === "alto" ? 14 : 7;
  const acertoFrac = Math.max(0, Math.min(1, Number(pctAcerto || 0) / 100));
  const rev = {};
  STEPS.forEach((step) => {
    rev[step.key] = {
      date: addDays(hoje, step.offset),
      done: false,
      acerto: null,
      questoes: null,
      S: S_BASE[step.key],
      D: prior.difBase,
      motivosErro: [],
    };
  });

  rev.d0 = {
    ...rev.d0,
    date: baseDate,
    done: true,
    acerto: acertoFrac,
    questoes: null,
    skippeadoPorDominio: true,
  };

  rev.d1 = {
    ...rev.d1,
    date: addDays(hoje, intervaloInicial),
  };
  rev.d4 = {
    ...rev.d4,
    date: addDays(hoje, intervaloInicial + 3),
  };
  rev.d7 = {
    ...rev.d7,
    date: addDays(hoje, intervaloInicial + 7),
  };
  rev.d21 = {
    ...rev.d21,
    date: addDays(hoje, intervaloInicial + 21),
  };

  return rev;
}

export function criarRegistroDominio(questoes, acertos) {
  const pct = questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;
  return {
    questoes,
    acertos,
    pctAcerto: pct,
    classificacao: classificarDominio(pct),
    validadoEm: todayStr(),
  };
}
