export const DOMAIN_TEST_BRAIN_DUMP_FIELDS = [
  "definitionDiagnosis",
  "pathophysiology",
  "clinicalPicture",
  "redFlags",
  "exams",
  "management",
  "differentials",
  "examTraps",
];

export const DOMAIN_TEST_ERROR_TYPES = [
  "content",
  "reasoning",
  "interpretation",
  "distractor",
  "careless",
  "time",
  "calibration",
  "notSeen",
  "irrelevantDetail",
];

export const DOMAIN_TEST_LIMITS = {
  brainDumpDurationSeconds: 480,
  checklistMaxScore: 2,
  minQuestions: 20,
  maxQuestions: 30,
  detailNoiseMinCount: 3,
  detailNoiseMinRatio: 0.5,
};

export const DOMAIN_TEST_CLASSIFICATIONS = {
  consolidated: {
    label: "consolidated",
    recommendedAction: "light_review",
    fsrsEntry: "d21_or_maintenance",
  },
  rescue: {
    label: "rescue",
    recommendedAction: "directed_review",
    fsrsEntry: "rescue_review",
  },
  treat_as_new: {
    label: "treat_as_new",
    recommendedAction: "full_d0",
    fsrsEntry: "d0",
  },
  fragile_base: {
    label: "fragile_base",
    recommendedAction: "conceptual_review",
    fsrsEntry: "conceptual_then_rescue",
  },
  detail_noise: {
    label: "detail_noise",
    recommendedAction: "pattern_log",
    fsrsEntry: "pattern_only",
  },
};

export const DOMAIN_TEST_RECOMMENDATIONS = {
  consolidated: {
    status: "validated_previously",
    conduta: "nao_fazer_d0",
    message: "Tema consolidado. Você não precisa reestudar agora. Vamos apenas manter esse tema vivo com revisão leve.",
  },
  rescue: {
    status: "rescue_needed",
    conduta: "revisao_dirigida_mais_questoes",
    message: "Tema parcialmente lembrado. Faça uma revisão dirigida e resolva novas questões antes de avançar.",
  },
  treat_as_new: {
    status: "treat_as_new",
    conduta: "d0_normal",
    message: "Esse tema ainda não está seguro. Ele voltará como tema novo no plano.",
  },
  fragile_base: {
    status: "fragile_base",
    conduta: "revisao_conceitual_curta",
    message: "Você acertou parte das questões, mas sua estrutura conceitual está frágil. Faça uma revisão curta antes de marcar como dominado.",
  },
  detail_noise: {
    status: "detail_noise",
    conduta: "registrar_padrao_de_erro",
    message: "Os erros parecem concentrados em detalhes. Registre o padrão, mas evite criar excesso de cards.",
  },
};

export const DOMAIN_TEST_CONDUTA_LABELS = {
  nao_fazer_d0: "Não refazer D0 — manter revisão leve",
  revisao_dirigida_mais_questoes: "Revisão dirigida + novo bloco de questões",
  d0_normal: "Estudar como tema novo (D0 completo)",
  revisao_conceitual_curta: "Revisão conceitual curta antes de avançar",
  registrar_padrao_de_erro: "Registrar padrão de erro, sem excesso de cards",
};

export const DOMAIN_TEST_FSRS_ENTRY_LABELS = {
  d21_or_maintenance: "D21 / manutenção",
  rescue_review: "Revisão de resgate",
  d0: "D0 completo",
  conceptual_then_rescue: "Conceitual → resgate",
  pattern_only: "Somente registro de padrão",
};

export const DOMAIN_TEST_AGENDA_META = {
  consolidated: {
    agendaLabel: "Domínio consolidado",
    stepLabel: "D21 leve",
    taskLabel: "Revisar D21",
    mentorTitle: "Manter domínio consolidado",
    mentorSubtitle: "Teste de Domínio validou base e questões.",
    mentorReason: "Tema consolidado não deve voltar como D0.",
    mentorExplain: "Manter revisão leve protege memória sem reabrir estudo inicial.",
    mentorCta: "Revisar leve",
    detailRecommendation: "Revisão leve: não reabra D0; preserve o tema vivo no D21/manutenção.",
  },
  rescue: {
    agendaLabel: "Resgate dirigido",
    stepLabel: "Resgate",
    taskLabel: "Revisão dirigida",
    mentorTitle: "Resgate dirigido",
    mentorSubtitle: "Teste de Domínio apontou lembrança parcial.",
    mentorReason: "65–79% ou base parcial pede revisão dirigida antes de avançar.",
    mentorExplain: "Foque lacunas do Brain Dump e refaça questões antes de liberar o ciclo normal.",
    mentorCta: "Fazer resgate",
    detailRecommendation: "Revisão dirigida: corrija lacunas do Brain Dump e resolva novo bloco curto de questões.",
  },
  treat_as_new: {
    agendaLabel: "D0 normal",
    stepLabel: "D0",
    taskLabel: "Estudar D0",
    mentorTitle: "Estudar como tema novo",
    mentorSubtitle: "Teste de Domínio não sustentou domínio prévio.",
    mentorReason: "Abaixo de 65% entra no plano como D0 normal.",
    mentorExplain: "Trate como aquisição: pré-teste, estudo guiado, Brain Dump e questões.",
    mentorCta: "Estudar D0",
    detailRecommendation: "Tema novo: execute D0 completo antes de contar revisão espaçada.",
  },
  fragile_base: {
    agendaLabel: "Revisão conceitual",
    stepLabel: "Conceitual",
    taskLabel: "Revisão conceitual",
    mentorTitle: "Revisão conceitual curta",
    mentorSubtitle: "Acerto sem estrutura conceitual segura.",
    mentorReason: "Brain Dump fraco impede falso domínio mesmo com questões razoáveis.",
    mentorExplain: "Reconstrua definição, mecanismo, red flags e conduta antes de novas questões.",
    mentorCta: "Revisar base",
    detailRecommendation: "Revisão conceitual: reconstrua a base do tema antes de seguir para questões.",
  },
  detail_noise: {
    agendaLabel: "Padrão de erro",
    stepLabel: "Padrão",
    taskLabel: "Revisar padrão",
    mentorTitle: "Revisar padrão de erro",
    mentorSubtitle: "Erros concentrados em detalhes.",
    mentorReason: "Erro por detalhe pede log e ajuste de prova, não explosão de cards.",
    mentorExplain: "Registre gatilhos de detalhe e faça bloco curto de questões sem criar cards infinitos.",
    mentorCta: "Revisar padrão",
    detailRecommendation: "Padrão de erro: registre o gatilho e evite criar excesso de cards.",
  },
};

export function normalizeDomainTestClassificationLabel(value) {
  const label = typeof value === "string" ? value : value?.label;
  return DOMAIN_TEST_CLASSIFICATIONS[label] ? label : null;
}

export function getDomainTestAgendaMeta(classification) {
  const label = normalizeDomainTestClassificationLabel(classification);
  return label ? { classification: label, ...DOMAIN_TEST_AGENDA_META[label] } : null;
}

function roundPercent(value) {
  return Number(value.toFixed(1));
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return Number.NaN;
  return Number(value);
}

function normalizeChecklistValue(value) {
  const numeric = toNumber(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(DOMAIN_TEST_LIMITS.checklistMaxScore, numeric));
}

export function calculateBrainDumpScore(checklist = {}) {
  const maxScore = DOMAIN_TEST_BRAIN_DUMP_FIELDS.length * DOMAIN_TEST_LIMITS.checklistMaxScore;
  const points = DOMAIN_TEST_BRAIN_DUMP_FIELDS.reduce(
    (sum, field) => sum + normalizeChecklistValue(checklist?.[field]),
    0
  );

  return roundPercent((points / maxScore) * 100);
}

export function calculateQuestionPercent(correct, total) {
  const correctNumber = toNumber(correct);
  const totalNumber = toNumber(total);

  if (!Number.isFinite(correctNumber) || !Number.isFinite(totalNumber) || totalNumber <= 0) {
    throw new RangeError("Question totals must be finite positive numbers.");
  }

  if (correctNumber < 0 || correctNumber > totalNumber) {
    throw new RangeError("Correct answers must be between zero and total questions.");
  }

  return roundPercent((correctNumber / totalNumber) * 100);
}

export function normalizeDomainTestErrorTypes(errorTypes = {}) {
  return DOMAIN_TEST_ERROR_TYPES.reduce((acc, key) => {
    const value = toNumber(errorTypes?.[key]);
    acc[key] = Number.isFinite(value) && value > 0 ? value : 0;
    return acc;
  }, {});
}

export function hasDetailNoise(errorTypes = {}) {
  const normalized = normalizeDomainTestErrorTypes(errorTypes);
  const totalErrors = DOMAIN_TEST_ERROR_TYPES.reduce((sum, key) => sum + normalized[key], 0);
  const irrelevantDetail = normalized.irrelevantDetail;

  if (totalErrors <= 0) return false;
  return (
    irrelevantDetail >= DOMAIN_TEST_LIMITS.detailNoiseMinCount &&
    irrelevantDetail / totalErrors >= DOMAIN_TEST_LIMITS.detailNoiseMinRatio
  );
}

function buildClassification(label) {
  return { ...DOMAIN_TEST_CLASSIFICATIONS[label] };
}

export function classifyDomainTest({ brainDumpScore, questionPct, errorTypes = {} } = {}) {
  const brainScore = toNumber(brainDumpScore);
  const questions = toNumber(questionPct);

  if (!Number.isFinite(brainScore) || !Number.isFinite(questions)) {
    return buildClassification("treat_as_new");
  }

  if (brainScore < 40 && questions >= 65) {
    return buildClassification("fragile_base");
  }

  if (questions >= 65 && hasDetailNoise(errorTypes)) {
    return buildClassification("detail_noise");
  }

  if (questions >= 80 && brainScore >= 70) {
    return buildClassification("consolidated");
  }

  if ((questions >= 65 && questions < 80) || (questions >= 65 && brainScore >= 40 && brainScore < 70)) {
    return buildClassification("rescue");
  }

  return buildClassification("treat_as_new");
}

export function getDomainTestRecommendation(classification) {
  const label = typeof classification === "string" ? classification : classification?.label;
  const normalizedLabel = DOMAIN_TEST_CLASSIFICATIONS[label] ? label : "treat_as_new";

  return {
    ...DOMAIN_TEST_CLASSIFICATIONS[normalizedLabel],
    ...DOMAIN_TEST_RECOMMENDATIONS[normalizedLabel],
  };
}

function validateChecklist(checklist, errors) {
  if (!checklist || typeof checklist !== "object") {
    errors.push({
      field: "brainDump.checklist",
      code: "missing_checklist",
      message: "Brain Dump checklist is required.",
    });
    return {};
  }

  return DOMAIN_TEST_BRAIN_DUMP_FIELDS.reduce((acc, field) => {
    const value = checklist[field];
    const numeric = toNumber(value);

    if (value === undefined || value === null || value === "") {
      errors.push({
        field: `brainDump.checklist.${field}`,
        code: "missing_checklist_score",
        message: "Checklist score is required.",
      });
      acc[field] = 0;
      return acc;
    }

    if (!Number.isInteger(numeric) || numeric < 0 || numeric > DOMAIN_TEST_LIMITS.checklistMaxScore) {
      errors.push({
        field: `brainDump.checklist.${field}`,
        code: "invalid_checklist_score",
        message: "Checklist score must be 0, 1, or 2.",
      });
      acc[field] = normalizeChecklistValue(value);
      return acc;
    }

    acc[field] = numeric;
    return acc;
  }, {});
}

function validateQuestionBlock(questionBlock, errors) {
  const initialErrorCount = errors.length;
  const total = toNumber(questionBlock?.total);
  const correct = toNumber(questionBlock?.correct);
  const normalized = {
    total: Number.isFinite(total) ? total : null,
    correct: Number.isFinite(correct) ? correct : null,
    percent: null,
    errorTypes: normalizeDomainTestErrorTypes(questionBlock?.errorTypes),
    notes: String(questionBlock?.notes || ""),
  };

  if (!Number.isInteger(total)) {
    errors.push({
      field: "questionBlock.total",
      code: "invalid_total",
      message: "Total questions must be an integer.",
    });
  } else if (total < DOMAIN_TEST_LIMITS.minQuestions) {
    errors.push({
      field: "questionBlock.total",
      code: "total_below_min",
      message: `Use at least ${DOMAIN_TEST_LIMITS.minQuestions} questions.`,
    });
  } else if (total > DOMAIN_TEST_LIMITS.maxQuestions) {
    errors.push({
      field: "questionBlock.total",
      code: "total_above_max",
      message: `Use at most ${DOMAIN_TEST_LIMITS.maxQuestions} questions.`,
    });
  }

  if (!Number.isInteger(correct)) {
    errors.push({
      field: "questionBlock.correct",
      code: "invalid_correct",
      message: "Correct answers must be an integer.",
    });
  } else if (correct < 0) {
    errors.push({
      field: "questionBlock.correct",
      code: "correct_below_zero",
      message: "Correct answers cannot be negative.",
    });
  } else if (Number.isFinite(total) && correct > total) {
    errors.push({
      field: "questionBlock.correct",
      code: "correct_above_total",
      message: "Correct answers cannot exceed total questions.",
    });
  }

  if (errors.length === initialErrorCount) {
    normalized.percent = calculateQuestionPercent(correct, total);
  }

  return normalized;
}

export function validateDomainTestInput(input = {}) {
  const errors = [];
  const brainDump = input?.brainDump || {};
  const questionBlock = input?.questionBlock || {};
  const checklist = validateChecklist(brainDump.checklist || input?.checklist, errors);
  const normalizedQuestionBlock = validateQuestionBlock(
    {
      total: questionBlock.total ?? input?.total,
      correct: questionBlock.correct ?? input?.correct,
      errorTypes: questionBlock.errorTypes ?? input?.errorTypes,
      notes: questionBlock.notes ?? input?.notes,
    },
    errors
  );
  const brainDumpScore = calculateBrainDumpScore(checklist);
  const questionPct = normalizedQuestionBlock.percent;
  const classification = questionPct === null
    ? null
    : classifyDomainTest({
      brainDumpScore,
      questionPct,
      errorTypes: normalizedQuestionBlock.errorTypes,
    });

  return {
    valid: errors.length === 0,
    errors,
    normalized: {
      brainDump: {
        durationSeconds: DOMAIN_TEST_LIMITS.brainDumpDurationSeconds,
        checklist,
        score: brainDumpScore,
      },
      questionBlock: normalizedQuestionBlock,
      classification,
    },
  };
}
