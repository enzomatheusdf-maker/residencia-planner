// src/core/errorActionMap.js
// Mapeia tipo canonico de erro -> acao corretiva.
// Consome APENAS os tipos de errorTaxonomy.js — nao cria enum paralelo.
// Saida compativel com actionInbox.createAction (type/target/priority).

import { ERROR_TYPE, ERROR_TYPE_LABEL, ERROR_TYPE_PLATFORMS, normalizeErrorType } from "./errorTaxonomy";

// ─── Mapa tipo -> definicao de acao corretiva ────────────────────────────────

/**
 * Cada entrada define:
 *   type             string       tipo canonico de erro
 *   label            string       rotulo legivel
 *   definition       string       o que este erro significa (1 linha)
 *   correctiveActions string[]    lista de acoes em linguagem natural
 *   preferredTask    string       acao principal ("revisao"|"caso"|"questoes"|"anki"|"sct"|"conduta"|"bloco_cronometrado")
 *   mentorActionType string       tipo compativel com actionInbox.createAction.type
 *   fsrsEffect       string       como afeta o agendamento FSRS
 *   platforms        string[]     plataformas validas (herda de ERROR_TYPE_PLATFORMS)
 */
const ACTION_MAP = Object.freeze({
  [ERROR_TYPE.CONTENT]: {
    type: ERROR_TYPE.CONTENT,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.CONTENT],
    definition: "Nao sabe o conteudo — lacuna de conhecimento basico.",
    correctiveActions: [
      "Revisao curta do topico (max 20 min).",
      "Resolver questoes externas sobre o tema.",
      "Adicionar flashcard Anki com o conceito central.",
    ],
    preferredTask: "revisao",
    mentorActionType: "review",
    fsrsEffect: "Reagendar tema para D1 se lacuna grave.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.CONTENT],
  },

  [ERROR_TYPE.MEMORY]: {
    type: ERROR_TYPE.MEMORY,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.MEMORY],
    definition: "Sabia, mas nao conseguiu recuperar na hora da prova.",
    correctiveActions: [
      "Revisao FSRS/Anki no proximo dia.",
      "Brain dump rapido do topico sem consultar fonte.",
      "Criar cue visual ou mnemonica para o ponto critico.",
    ],
    preferredTask: "anki",
    mentorActionType: "anki",
    fsrsEffect: "Reducao do intervalo FSRS para o step atual.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.MEMORY],
  },

  [ERROR_TYPE.REASONING]: {
    type: ERROR_TYPE.REASONING,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.REASONING],
    definition: "Sabe o conteudo, mas o raciocinio diagnostico falhou.",
    correctiveActions: [
      "Mini caso clinico com problem representation.",
      "Listar hipoteses antes de revelar o diagnostico.",
      "Refazer o raciocinio da questao passo a passo.",
    ],
    preferredTask: "caso",
    mentorActionType: "clinical_case",
    fsrsEffect: "Planejar caso clinico no D7.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.REASONING],
  },

  [ERROR_TYPE.PROBLEM_REPRESENTATION]: {
    type: ERROR_TYPE.PROBLEM_REPRESENTATION,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.PROBLEM_REPRESENTATION],
    definition: "Nao conseguiu sintetizar os dados clinicos em um one-liner diagnostico.",
    correctiveActions: [
      "Escrever um one-liner com: paciente + contexto + queixa principal + dados discriminantes.",
      "Identificar os 2-3 dados mais importantes da vinheta antes de pensar em hipoteses.",
      "Comparar seu problem representation com o do gabarito.",
    ],
    preferredTask: "caso",
    mentorActionType: "clinical_case",
    fsrsEffect: "Incluir etapa de problem representation no proximo caso.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.PROBLEM_REPRESENTATION],
  },

  [ERROR_TYPE.DIFFERENTIAL]: {
    type: ERROR_TYPE.DIFFERENTIAL,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.DIFFERENTIAL],
    definition: "Foi enganado por um diferencial plausivel ou nao considerou o must-not-miss.",
    correctiveActions: [
      "Listar 3 diferenciais + must-not-miss do caso.",
      "Comparar o diferencial correto com o que voce escolheu: quais dados discriminavam?",
      "Revisar os achados discriminantes da doenca-armadilha.",
    ],
    preferredTask: "caso",
    mentorActionType: "clinical_case",
    fsrsEffect: "Adicionar illness script comparativo ao plano de revisao.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.DIFFERENTIAL],
  },

  [ERROR_TYPE.SCT_UNCERTAINTY]: {
    type: ERROR_TYPE.SCT_UNCERTAINTY,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.SCT_UNCERTAINTY],
    definition: "Dificuldade em ajustar probabilidade diante de nova informacao (raciocinio bayesiano clinico).",
    correctiveActions: [
      "Praticar SCT curto: hipotese → nova informacao → quanto muda a probabilidade?",
      "Rever o racional do SCT da questao errada.",
      "Treinar calibracao: estimar 0-100 antes de revelar o painel.",
    ],
    preferredTask: "sct",
    mentorActionType: "clinical_case",
    fsrsEffect: "Planejar sessao SCT no D21.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.SCT_UNCERTAINTY],
  },

  [ERROR_TYPE.MANAGEMENT]: {
    type: ERROR_TYPE.MANAGEMENT,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.MANAGEMENT],
    definition: "Sabe o diagnostico, mas errou a conduta, prescricao ou disposicao do paciente.",
    correctiveActions: [
      "Management station educacional: estabilizacao, exames iniciais, tratamento.",
      "Revisar doses e classes de medicamentos do tema.",
      "Verificar criterios de internacao/ambulatorio e red flags.",
    ],
    preferredTask: "conduta",
    mentorActionType: "clinical_case",
    fsrsEffect: "Adicionar fase de conduta ao proximo caso clinico.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.MANAGEMENT],
  },

  [ERROR_TYPE.INTERPRETATION]: {
    type: ERROR_TYPE.INTERPRETATION,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.INTERPRETATION],
    definition: "Interpretou incorretamente dados da questao (exame, imagem, ECG, lab).",
    correctiveActions: [
      "Treino de leitura diagnostica: voltar para a questao e reler sistematicamente.",
      "Resolver questoes de interpretacao do mesmo tipo de exame.",
      "Revisar criterios de interpretacao do exame especifico.",
    ],
    preferredTask: "questoes",
    mentorActionType: "exam_analysis",
    fsrsEffect: "Resolver questoes do mesmo tipo na proxima sessao.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.INTERPRETATION],
  },

  [ERROR_TYPE.DISTRACTION]: {
    type: ERROR_TYPE.DISTRACTION,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.DISTRACTION],
    definition: "Sabia a resposta, mas cometeu erro de descuido ou falta de atencao.",
    correctiveActions: [
      "Bloco cronometrado com checklist de leitura (releia a ultima linha da questao).",
      "Reduzir distractores no ambiente de estudo.",
      "Marcar questoes em que houve erro de descuido para revisao critica.",
    ],
    preferredTask: "bloco_cronometrado",
    mentorActionType: "review",
    fsrsEffect: "Repetir questoes do mesmo tema com tempo controlado.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.DISTRACTION],
  },

  [ERROR_TYPE.TIME]: {
    type: ERROR_TYPE.TIME,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.TIME],
    definition: "Nao finalizou ou apressou a questao por falta de tempo.",
    correctiveActions: [
      "Bloco cronometrado: 1-2 min por questao, sem parar.",
      "Praticar abandono estrategico de questoes dificeis.",
      "Revisar questao errada para identificar onde perdeu tempo.",
    ],
    preferredTask: "bloco_cronometrado",
    mentorActionType: "exam_analysis",
    fsrsEffect: "Treinar em condicoes de tempo real.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.TIME],
  },

  [ERROR_TYPE.CONFIDENCE_MISMATCH]: {
    type: ERROR_TYPE.CONFIDENCE_MISMATCH,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.CONFIDENCE_MISMATCH],
    definition: "Alta confianca + erro — ou baixa confianca + acerto. Calibracao metacognitiva falhando.",
    correctiveActions: [
      "Estimativa previa antes de cada sessao: 'Vou acertar X%.'",
      "Revisao calibrada: comparar estimativa vs resultado real.",
      "Identificar os temas com maior discrepancia de confianca.",
    ],
    preferredTask: "revisao",
    mentorActionType: "review",
    fsrsEffect: "Ajustar nivel de confianca nos proximos flashcards.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.CONFIDENCE_MISMATCH],
  },

  [ERROR_TYPE.EXAM_STRATEGY]: {
    type: ERROR_TYPE.EXAM_STRATEGY,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.EXAM_STRATEGY],
    definition: "Erro de estrategia de prova: ordem, eliminacao, gestao de tempo ou nervosismo.",
    correctiveActions: [
      "Analisar o simulado completo focando na estrategia, nao so no conteudo.",
      "Praticar a tecnica de 2 leituras (rapida + revisao).",
      "Ensaiar condicoes de prova real (barulho, pressao de tempo, postura).",
    ],
    preferredTask: "questoes",
    mentorActionType: "exam_analysis",
    fsrsEffect: "Incluir simulado completo no proximo ciclo.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.EXAM_STRATEGY],
  },

  [ERROR_TYPE.GUESS]: {
    type: ERROR_TYPE.GUESS,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.GUESS],
    definition: "Acertou por chute ou respondeu sem base — falsa confianca no resultado.",
    correctiveActions: [
      "Revisar o conteudo do topico como se tivesse errado.",
      "Marcar questoes de chute para revisao explicita.",
      "Avaliar calibracao: voce sabia ou sorte?",
    ],
    preferredTask: "revisao",
    mentorActionType: "review",
    fsrsEffect: "Considerar step como nao-consolidado.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.GUESS],
  },
});

// ─── API publica ──────────────────────────────────────────────────────────────

/**
 * Retorna a definicao de acao corretiva para um tipo de erro.
 * Aceita tanto o tipo canonico quanto valores legados — normaliza internamente.
 *
 * @param {string} rawType  - tipo de erro (canonico ou legado)
 * @returns {object|null}
 */
export function getCorrectiveAction(rawType) {
  if (!rawType) return null;
  const canonical = normalizeErrorType(rawType);
  return ACTION_MAP[canonical] ?? null;
}

/**
 * Retorna todas as acoes corretivas validas para uma plataforma.
 *
 * @param {string} plat  - "res" | "vest"
 * @returns {object[]}
 */
export function getActionsForPlatform(plat = "res") {
  return Object.values(ACTION_MAP).filter((a) => a.platforms.includes(plat));
}

/**
 * Converte um tipo de erro dominante em uma action compativel com actionInbox.createAction.
 * Nao chama createAction — retorna um objeto plano para o caller montar a acao.
 *
 * @param {string} rawDominantType  - tipo de erro dominante
 * @param {object} context          - { tema, area, dueDate, plat }
 * @returns {{ type, title, reason, priority, source, dueDate, target } | null}
 */
export function dominantErrorToInboxAction(rawDominantType, context = {}) {
  const action = getCorrectiveAction(rawDominantType);
  if (!action) return null;

  const plat = context.plat || "res";
  if (!action.platforms.includes(plat)) return null;

  return {
    type: action.mentorActionType,
    title: context.tema
      ? `Acao corretiva (${action.label}): ${context.tema}`
      : `Acao corretiva: ${action.label}`,
    reason: action.definition,
    priority: 80,
    source: "error_action",
    dueDate: context.dueDate || null,
    target: {
      tema: context.tema || undefined,
      area: context.area || undefined,
      errorType: action.type,
      preferredTask: action.preferredTask,
    },
  };
}

/**
 * Retorna os tipos canonicos de erro ordenados por severidade decrescente.
 * @returns {string[]}
 */
export function getErrorTypesBySeverity() {
  return Object.keys(ACTION_MAP);
}

/**
 * Recommends remediation based on the dominant error or motives of an event.
 *
 * @param {Object} event
 * @returns {{ kind: "flashcard" | "case" | "illness_script" | "calibration_flag", payload: string } | null}
 */
export function recommendRemediationFromError(event) {
  if (!event) return null;

  const rawError = event.dominantError || 
                   event.errors?.dominantError || 
                   (event.motivosErro && event.motivosErro[0]) || 
                   (event.errors?.motivosErro && event.errors.motivosErro[0]) || 
                   null;
  const errorType = normalizeErrorType(rawError);

  const tema = event.topicName || event.tema || "";
  const fato = event.fato || event.fatoEspecifico || event.errors?.fato || event.meta?.fato || event.meta?.fatoEspecifico || "";

  if (errorType === ERROR_TYPE.CONTENT || errorType === ERROR_TYPE.MEMORY) {
    return {
      kind: "flashcard",
      payload: fato || (tema ? `Fato relacionado ao tema: ${tema}` : "Fato específico do erro"),
    };
  }

  if (
    errorType === ERROR_TYPE.REASONING ||
    errorType === ERROR_TYPE.MANAGEMENT ||
    errorType === ERROR_TYPE.PROBLEM_REPRESENTATION ||
    errorType === ERROR_TYPE.DIFFERENTIAL ||
    errorType === ERROR_TYPE.SCT_UNCERTAINTY ||
    errorType === ERROR_TYPE.INTERPRETATION
  ) {
    const isScript = [ERROR_TYPE.DIFFERENTIAL, ERROR_TYPE.PROBLEM_REPRESENTATION, ERROR_TYPE.SCT_UNCERTAINTY].includes(errorType);
    return {
      kind: isScript ? "illness_script" : "case",
      payload: tema,
    };
  }

  if (errorType === ERROR_TYPE.CONFIDENCE_MISMATCH || errorType === ERROR_TYPE.GUESS) {
    return {
      kind: "calibration_flag",
      payload: tema,
    };
  }

  return null;
}

export { ACTION_MAP };

