// src/core/domainValidation.js
// Lógica de validação de domínio prévio (puramente funcional).

import { STEPS, S_BASE, addDays, todayStr, getAreaPrior, inferPhaseFromStep } from "./fsrs";

export const DOMINIO_PREVIO_MIN_QUESTOES = 15;
export const DOMINIO_PREVIO_MIN_ACERTO = 80;

const REVIEW_DISPLAY_ORDER = ["d0", "d1", "d4", "d7", "d21", "manutencao"];

function getStepLabel(stepKey) {
  const step = STEPS.find((item) => item.key === stepKey);
  if (step?.label) return step.label;
  if (stepKey === "manutencao") return "Manutenção";
  return String(stepKey || "").toUpperCase();
}

function isSkippedReview(step = {}) {
  return step?.skipped === true || step?.skipReason === "dominio_previo" || step?.skippeadoPorDominio === true;
}

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
 *  - alto: >= 90% (D21)
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
    desc: "Domínio prévio validado. Próxima revisão inicial em D21.",
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
      motivo: "Melhor iniciar pelo estudo guiado. Este tema ainda não está seguro para pular a exposicao inicial.",
    };
  }

  const intervaloInicial = percentual >= 90 ? 21 : 7;
  return {
    valido: true,
    status: "validado_previo",
    percentual,
    intervaloInicial,
    proximaRevisao: addDays(todayStr(), intervaloInicial),
    motivo:
      percentual >= 90
        ? "Validado com alta seguranca. Proxima revisao em D21."
        : "Validado. Proxima revisao em D7.",
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
  const primeiraRevisao = resultado.intervaloInicial >= 21 ? "d21" : resultado.intervaloInicial === 7 ? "d7" : null;
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
    primeiraRevisao,
    primeiraRevisaoLabel: primeiraRevisao ? getStepLabel(primeiraRevisao) : null,
    primeiraRevisaoDate: resultado.proximaRevisao || null,
    observacao: resultado.motivo,
  };
}

/**
 * Constrói ciclo pós-validação:
 * - insuficiente: null (mantém ciclo original)
 * - intermediario: próxima revisão em D7
 * - alto: próxima revisão em D21
 */
export function buildRevComDominio(d0, esp, importancia, classificacao, pctAcerto) {
  const prior = getAreaPrior(esp);
  const hoje = todayStr();
  const baseDate = d0 >= hoje ? d0 : hoje;

  if (classificacao === "insuficiente") return null;

  const intervaloInicial = classificacao === "alto" ? 21 : 7;
  const acertoFrac = Math.max(0, Math.min(1, Number(pctAcerto || 0) / 100));
  const rev = {};
  STEPS.forEach((step) => {
    const stepDate = addDays(hoje, step.offset);
    rev[step.key] = {
      date: stepDate,
      scheduledAt: stepDate,
      reviewedAt: null,
      done: false,
      acerto: null,
      questoes: null,
      S: S_BASE[step.key],
      D: prior.difBase,
      motivosErro: [],
      phase: inferPhaseFromStep(step.key),
    };
  });

  rev.d0 = {
    ...rev.d0,
    date: baseDate,
    scheduledAt: baseDate,
    reviewedAt: baseDate,
    done: true,
    acerto: acertoFrac,
    questoes: null,
    skippeadoPorDominio: true,
    source: "dominio_previo",
  };

  rev.d1 = {
    ...rev.d1,
    done: true,
    skipped: true,
    skipReason: "dominio_previo",
    reviewedAt: hoje,
    completedAt: hoje,
    acerto: acertoFrac,
    source: "dominio_previo",
  };
  rev.d4 = {
    ...rev.d4,
    done: true,
    skipped: true,
    skipReason: "dominio_previo",
    reviewedAt: hoje,
    completedAt: hoje,
    acerto: acertoFrac,
    source: "dominio_previo",
  };
  // Alto (≥90%): pula até D7 inclusive; primeira revisão ativa é D21.
  // Intermediário (80-89%): D7 fica ativo como primeira revisão.
  rev.d7 = {
    ...rev.d7,
    date: addDays(hoje, 7),
    scheduledAt: addDays(hoje, 7),
    ...(intervaloInicial >= 21 ? {
      done: true,
      skipped: true,
      skipReason: "dominio_previo",
      reviewedAt: hoje,
      completedAt: hoje,
      acerto: acertoFrac,
      source: "dominio_previo",
    } : {
      done: false,
      skipped: false,
      skipReason: null,
      source: "dominio_previo",
    }),
  };
  rev.d21 = {
    ...rev.d21,
    date: addDays(hoje, 21),
    scheduledAt: addDays(hoje, 21),
    done: false,
    source: "dominio_previo",
  };
  rev.reviewHistory = [];
  rev.phase = "learning";
  rev.relearning = null;

  return rev;
}

function normalizeAcertoInput(rawAcertos, total) {
  const totalNum = Number(total);
  const acertosNum = Number(rawAcertos);
  if (!Number.isFinite(acertosNum) || !Number.isFinite(totalNum) || totalNum <= 0) {
    return Number.NaN;
  }
  if (acertosNum <= 1) {
    return Math.round(acertosNum * totalNum);
  }
  return Math.round(acertosNum);
}

export function applyDominioPrevioToTema(tema, resultado, options = {}) {
  if (!tema || !resultado) return tema;
  const total = Number(resultado.questoes ?? resultado.total);
  const acertosNormalizados = normalizeAcertoInput(
    resultado.acertos ?? resultado.acerto,
    total
  );
  const validacao = calcularDominioPrevio({ acertos: acertosNormalizados, total });

  if (!validacao.valido) {
    return {
      ...tema,
      status: tema.status || "novo",
      unstarted: tema.unstarted !== false,
      dominioPrevio: finalizarValidacaoDominioPrevio({ total, acertos: acertosNormalizados }),
    };
  }

  const registro = criarRegistroDominio(total, acertosNormalizados);
  const novoRevBase = buildRevComDominio(
    tema.d0 || todayStr(),
    tema.esp,
    tema.importancia,
    registro.classificacao,
    registro.pctAcerto
  ) || tema.rev;
  const hoje = todayStr();
  const acertoFrac = Math.max(0, Math.min(1, Number(total > 0 ? acertosNormalizados / total : 0)));
  const intervalo = validacao.intervaloInicial || 7;
  const primeiraRevisao = intervalo >= 21 ? "d21" : "d7";
  const reviewEvent = {
    stepKey: "d0",
    reviewedAt: hoje,
    source: "dominio_previo",
    rating: intervalo >= 21 ? "easy" : "good",
    acerto: acertoFrac,
    questoes: total,
    official: true,
  };
  const reviewHistory = Array.isArray(novoRevBase?.reviewHistory) ? novoRevBase.reviewHistory : [];
  const nextRev = {
    ...novoRevBase,
    d0: {
      ...(novoRevBase?.d0 || {}),
      done: true,
      reviewedAt: hoje,
      completedAt: hoje,
      scheduledAt: novoRevBase?.d0?.scheduledAt || hoje,
      date: novoRevBase?.d0?.date || hoje,
      acerto: acertoFrac,
      questoes: total,
      source: "dominio_previo",
      skippeadoPorDominio: true,
    },
    reviewHistory: [...reviewHistory, reviewEvent].slice(-100),
  };
  const dominioPrevio = {
    ...finalizarValidacaoDominioPrevio({ total, acertos: acertosNormalizados }),
    validado: true,
    questoes: total,
    acerto: acertoFrac,
    validatedAt: hoje,
    primeiraRevisao,
    primeiraRevisaoLabel: getStepLabel(primeiraRevisao),
    primeiraRevisaoDate: validacao.proximaRevisao || nextRev?.[primeiraRevisao]?.date || null,
    source: "ja_domino",
  };

  return {
    ...tema,
    status: "validado_previo",
    unstarted: false,
    dominio: registro,
    dominioPrevio,
    rev: nextRev,
    parentTopic: tema.parentTopic || options.parentTopic || null,
  };
}

export function getDominioPrevioStatus(tema = {}) {
  const dp = tema?.dominioPrevio || {};
  const isValidated = dp.validado === true || dp.status === "validado_previo";
  if (!isValidated) return { isValidated: false };

  const rawFirstReview = dp.primeiraRevisao || (Number(dp.intervaloInicial || 0) >= 14 ? "d21" : "d7");
  // Compat: dominioPrevio antigo podia ter "d14"; o passo foi removido → reaponta p/ D21.
  const firstReviewStep = rawFirstReview === "d14" ? "d21" : rawFirstReview;
  const storedLabel = dp.primeiraRevisaoLabel === "D14" ? null : dp.primeiraRevisaoLabel;
  const firstReviewLabel = storedLabel || getStepLabel(firstReviewStep);
  const firstReviewDate = dp.primeiraRevisaoDate || dp.proximaRevisao || tema?.rev?.[firstReviewStep]?.date || null;
  const acerto = Number.isFinite(Number(dp.acerto))
    ? Number(dp.acerto)
    : Number.isFinite(Number(dp.percentual))
    ? Number(dp.percentual) / 100
    : null;

  return {
    isValidated: true,
    acerto,
    questoes: Number(dp.questoes ?? dp.total ?? 0) || null,
    validatedAt: dp.validatedAt || dp.validadoEm || null,
    firstReviewStep,
    firstReviewLabel,
    firstReviewDate,
  };
}

export function getReviewDisplayLabel(tema, stepKey) {
  const status = getDominioPrevioStatus(tema);
  if (status.isValidated) {
    if (stepKey === status.firstReviewStep) return status.firstReviewLabel;
    const step = tema?.rev?.[stepKey];
    if (!isSkippedReview(step) && step?.date === status.firstReviewDate) {
      return status.firstReviewLabel;
    }
  }
  return getStepLabel(stepKey);
}

export function getReviewDisplayMeta(tema, stepKey) {
  const step = tema?.rev?.[stepKey] || {};
  return {
    stepKey,
    label: getReviewDisplayLabel(tema, stepKey),
    date: step.date || step.scheduledAt || null,
    source: step.source || null,
    skipped: isSkippedReview(step),
  };
}

export function getNextReviewForTema(tema = {}, today = todayStr()) {
  const rev = tema?.rev || {};
  const status = getDominioPrevioStatus(tema);

  if (status.isValidated && status.firstReviewStep) {
    const firstRuntimeStepKey = rev[status.firstReviewStep]
      ? status.firstReviewStep
      : Object.keys(rev).find((key) => {
        const step = rev[key];
        return step && typeof step === "object" && !step.done && !isSkippedReview(step) && step.date === status.firstReviewDate;
      });
    const firstStep = rev[firstRuntimeStepKey] || {};
    if (!firstStep.done && !isSkippedReview(firstStep)) {
      return {
        stepKey: firstRuntimeStepKey || status.firstReviewStep,
        label: status.firstReviewLabel,
        date: firstStep.date || firstStep.scheduledAt || status.firstReviewDate,
        source: "dominio_previo",
        overdue: Boolean((firstStep.date || status.firstReviewDate) < today),
      };
    }
  }

  const keys = Object.keys(rev)
    .filter((key) => rev[key] && typeof rev[key] === "object")
    .filter((key) => !["reviewHistory", "meta", "phase", "relearning"].includes(key))
    .sort((a, b) => {
      const orderA = REVIEW_DISPLAY_ORDER.includes(a) ? REVIEW_DISPLAY_ORDER.indexOf(a) : 99;
      const orderB = REVIEW_DISPLAY_ORDER.includes(b) ? REVIEW_DISPLAY_ORDER.indexOf(b) : 99;
      if (orderA !== orderB) return orderA - orderB;
      return String(rev[a]?.date || "").localeCompare(String(rev[b]?.date || ""));
    });

  for (const key of keys) {
    const step = rev[key];
    if (step.done || isSkippedReview(step) || !step.date) continue;
    return {
      stepKey: key,
      label: getReviewDisplayLabel(tema, key),
      date: step.date,
      source: step.source || null,
      overdue: step.date < today,
    };
  }

  return null;
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
