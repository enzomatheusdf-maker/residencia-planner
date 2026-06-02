// src/core/reviewTaskPlanner.js
// Mapeia step FSRS -> tarefa de revisao multimodal para Residencia.
// Gera uma tarefa especifica por step baseada em:
//   - estagio FSRS (D1, D4, D7, D21/manutencao)
//   - historico de erros do tema (tipo dominante)
//   - disponibilidade de casos clinicos para o tema/area
//   - flag de plataforma (res only)
//   - feature flag: meta.modulos.raciocinioClinico
//
// Nao tem React, nao tem Zustand, nao tem efeitos colaterais.
// Retorna um objeto de tarefa ou null se nao aplicavel.

// ─── Tipos de tarefa multimodal ──────────────────────────────────────────────

export const TASK_TYPE = Object.freeze({
  BRAIN_DUMP: "brain_dump",         // D1: recuperacao ativa livre
  ILLNESS_RECALL: "illness_recall", // D4: illness script recall estruturado
  MINI_CASE: "mini_case",           // D7: mini caso + diferenciais
  SCT: "sct",                       // D21/manutencao: SCT + conduta simulada
  STANDARD: "standard",             // fallback: revisao padrao sem modalidade clinica
});

// ─── Mapeamento step -> tarefa ────────────────────────────────────────────────

const STEP_TASK_MAP = Object.freeze({
  d1:          TASK_TYPE.BRAIN_DUMP,
  d4:          TASK_TYPE.ILLNESS_RECALL,
  d7:          TASK_TYPE.MINI_CASE,
  d21:         TASK_TYPE.SCT,
  manutencao:  TASK_TYPE.SCT,
  // Steps sem modalidade clinica — retornam null (fallback padrao)
  d0:          null,
  pretest:     null,
  relearning:  null,
});

// ─── Descricoes por tipo de tarefa ───────────────────────────────────────────

export const TASK_DESCRIPTIONS = Object.freeze({
  [TASK_TYPE.BRAIN_DUMP]: {
    label: "Recorda\u00e7\u00e3o estruturada",
    shortLabel: "D1",
    instruction: "Escreva tudo que lembra sobre o tema sem consultar nada. Foque nos 5 campos: defini\u00e7\u00e3o, diagn\u00f3stico, diferenciais, conduta e n\u00e3o-pode-perder.",
    fields: [
      { key: "definicao", label: "Defini\u00e7\u00e3o / epidemiologia", placeholder: "O que \u00e9? Quem pega? Por que?" },
      { key: "diagnostico", label: "Como diagnosticar", placeholder: "Cl\u00ednica, exames, crit\u00e9rios" },
      { key: "diferenciais", label: "Principais diferenciais", placeholder: "Quais condi\u00e7\u00f5es mimetizam? O que discrimina?" },
      { key: "conduta", label: "Conduta inicial", placeholder: "Estabiliza\u00e7\u00e3o, exames, tratamento" },
      { key: "naoPodePerder", label: "N\u00e3o pode perder", placeholder: "Qual diagn\u00f3stico grave n\u00e3o posso esquecer?" },
    ],
    durationMin: 10,
  },
  [TASK_TYPE.ILLNESS_RECALL]: {
    label: "Racioc\u00ednio diagn\u00f3stico",
    shortLabel: "D4",
    instruction: "Sem consultar: complete o racioc\u00ednio diagn\u00f3stico do tema: contexto, mecanismo, consequ\u00eancias e conduta.",
    fields: [
      { key: "enabling", label: "Contexto de risco", placeholder: "Quem tem risco? Fisiologia predisponente" },
      { key: "fault", label: "Mecanismo da doen\u00e7a", placeholder: "O que d\u00e1 errado e como evolui?" },
      { key: "consequences", label: "Consequ\u00eancias cl\u00ednicas", placeholder: "Sinais, sintomas, exames alterados" },
      { key: "management", label: "Conduta", placeholder: "Tratamento, doses, crit\u00e9rios de interna\u00e7\u00e3o" },
    ],
    durationMin: 8,
  },
  [TASK_TYPE.MINI_CASE]: {
    label: "Mini caso cl\u00ednico",
    shortLabel: "D7",
    instruction: "Resolva o mini caso: racioc\u00ednio diagn\u00f3stico -> hip\u00f3teses ranqueadas -> justificativa.",
    fields: [
      { key: "problemRep", label: "Racioc\u00ednio diagn\u00f3stico", placeholder: "Paciente de X anos, contexto, queixa principal + dados discriminantes" },
      { key: "hipoteses", label: "Top 3 hip\u00f3teses + n\u00e3o-pode-perder", placeholder: "1. ... 2. ... 3. ... N\u00e3o-pode-perder: ..." },
      { key: "justificativa", label: "Por que o diagn\u00f3stico principal vence", placeholder: "Dados que confirmam e que afastam os diferenciais" },
    ],
    durationMin: 15,
  },
  [TASK_TYPE.SCT]: {
    label: "Concord\u00e2ncia cl\u00ednica + conduta",
    shortLabel: "D21",
    instruction: "Teste de concord\u00e2ncia cl\u00ednica: para cada nova informa\u00e7\u00e3o, ajuste a probabilidade da hip\u00f3tese. Depois simule a conduta.",
    fields: [
      { key: "hipotese", label: "Hip\u00f3tese de trabalho", placeholder: "Qual \u00e9 o diagn\u00f3stico mais prov\u00e1vel?" },
      { key: "sct1", label: "Nova informa\u00e7\u00e3o 1 -> ajuste de probabilidade", placeholder: "Se... a hip\u00f3tese: aumenta / reduz / n\u00e3o muda. Por que?" },
      { key: "sct2", label: "Nova informa\u00e7\u00e3o 2 -> ajuste de probabilidade", placeholder: "Se... a hip\u00f3tese: aumenta / reduz / n\u00e3o muda. Por que?" },
      { key: "conduta", label: "Conduta simulada (educacional)", placeholder: "Estabiliza\u00e7\u00e3o, exames, tratamento, interna\u00e7\u00e3o/ambulat\u00f3rio" },
    ],
    durationMin: 20,
  },
});

// ─── Funcoes principais ───────────────────────────────────────────────────────

/**
 * Verifica se as pre-condicoes estao satisfeitas para tarefas clinicas.
 * Nao acessa store — recebe os dados por parametro.
 *
 * @param {{ plat: string, modulos: object }} options
 * @returns {boolean}
 */
export function isClinicalTaskEnabled({ plat, modulos } = {}) {
  return plat === "res" && Boolean(modulos?.raciocinioClinico);
}

/**
 * Encontra o caso clinico mais relevante para um tema/area.
 * Match por tema.nome (exato ou parcial) ou por area/esp.
 *
 * @param {object}   tema          - objeto tema do store
 * @param {object[]} casos         - lista de CASOS_CLINICOS
 * @param {object}   progresso     - casosProgresso do store
 * @returns {object|null}          - caso clinico ou null
 */
export function findClinicalCaseForTema(tema, casos = [], progresso = {}) {
  if (!tema || !casos.length) return null;

  const nomeNorm = (tema.nome || "").toLowerCase().replace(/[^a-z0-9À-ɏ]/g, " ").trim();
  const espNorm = (tema.esp || "").toLowerCase().trim();

  // 1. Match exato por tema
  const exactMatch = casos.find((c) => {
    const temaField = (c.tema || "").toLowerCase().replace(/[^a-z0-9À-ɏ]/g, " ").trim();
    return nomeNorm && temaField && (nomeNorm.includes(temaField) || temaField.includes(nomeNorm));
  });
  if (exactMatch) return exactMatch;

  // 2. Match por area/especialidade — prioriza casos nao visitados
  const areaMatches = casos.filter((c) => {
    const area = (c.area || "").toLowerCase().trim();
    return area && (area === espNorm || espNorm.includes(area) || area.includes(espNorm));
  });

  if (!areaMatches.length) return null;

  // Prioriza nao visitados, depois mais antigos (menos recentes)
  const sorted = [...areaMatches].sort((a, b) => {
    const visitedA = Number(progresso[a.id]?.vistos || 0);
    const visitedB = Number(progresso[b.id]?.vistos || 0);
    if (visitedA !== visitedB) return visitedA - visitedB; // menos visitado primeiro
    return 0;
  });

  return sorted[0];
}

/**
 * Retorna a tarefa de revisao para um step FSRS especifico.
 * Retorna null se:
 *   - plat nao e res
 *   - modulo nao habilitado
 *   - step nao tem modalidade clinica (d0, pretest, relearning)
 *   - nenhum caso clinico disponivel para o tema
 *
 * @param {object} params
 * @param {object}   params.tema        - objeto tema (com .nome, .esp)
 * @param {string}   params.stepKey     - chave do step FSRS ("d1", "d4", "d7", "d21", "manutencao")
 * @param {object[]} params.casos       - lista CASOS_CLINICOS
 * @param {object}   params.progresso   - casosProgresso do store
 * @param {string}   params.plat        - "res" | "vest"
 * @param {object}   params.modulos     - meta.modulos
 * @returns {{
 *   taskType: string,
 *   stepKey: string,
 *   tema: object,
 *   caso: object|null,
 *   description: object,
 *   responses: object,
 * } | null}
 */
export function getReviewTaskForStep({ tema, stepKey, casos = [], progresso = {}, plat, modulos } = {}) {
  if (!isClinicalTaskEnabled({ plat, modulos })) return null;

  const taskType = STEP_TASK_MAP[stepKey];
  if (!taskType) return null;

  const description = TASK_DESCRIPTIONS[taskType];
  if (!description) return null;

  // Encontrar caso associado (opcional para brain dump e illness recall que sao sobre o tema)
  const caso = [TASK_TYPE.MINI_CASE, TASK_TYPE.SCT].includes(taskType)
    ? findClinicalCaseForTema(tema, casos, progresso)
    : null;

  // Para mini caso e SCT, preferimos ter um caso associado
  // Para brain dump e illness recall, o tema e suficiente
  if ([TASK_TYPE.MINI_CASE, TASK_TYPE.SCT].includes(taskType) && !caso) {
    // Se nao tem caso estruturado, fallback para illness recall (disponivel sem caso)
    if (taskType === TASK_TYPE.MINI_CASE) {
      return {
        taskType: TASK_TYPE.ILLNESS_RECALL,
        stepKey,
        tema,
        caso: null,
        description: TASK_DESCRIPTIONS[TASK_TYPE.ILLNESS_RECALL],
        responses: {},
      };
    }
    return null; // SCT sem caso nao e possivel
  }

  return {
    taskType,
    stepKey,
    tema,
    caso,
    description,
    responses: {},
  };
}

/**
 * Calcula tempo estimado total de uma tarefa (incluindo revisao padrao).
 * @param {object|null} task
 * @param {number} standardMinutes  - tempo da revisao padrao (ex: minutos da sessao)
 * @returns {number}
 */
export function estimateTaskDuration(task, standardMinutes = 20) {
  if (!task) return standardMinutes;
  return (task.description?.durationMin || 15) + standardMinutes;
}
