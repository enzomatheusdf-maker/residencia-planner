import {
  DEFAULT_MASTERY_PARAMS,
  MASTERY_CONFIDENCE,
  MASTERY_LEVELS,
  collectMasteryEvidence,
  estimateAreaMastery,
  estimateMastery,
  estimateStudentMastery,
  estimateTopicMastery,
  getEstadoDominio,
  getProntidaoGlobal,
  getWeakMasteryTargets,
  updateBayesianMastery,
  estimateSubtopicParams,
} from "./mastery";

const temaVazio = {
  id: "tema-vazio",
  nome: "Tema vazio",
  esp: "Clinica Medica",
  rev: {},
};

const temaD0Only = {
  id: "tema-d0",
  nome: "D0 perfeito",
  esp: "Clinica Medica",
  rev: {
    d0: { done: true, acerto: 1.0, S: 1.0, D: 0.4 },
  },
};

const temaConsolidando = {
  id: "tema-cons",
  nome: "Tema consolidando",
  esp: "Preventiva",
  rev: {
    d0: { done: true, acerto: 0.90, S: 1.0, D: 0.5 },
    d1: { done: true, acerto: 0.82, S: 2.0, D: 0.48 },
    d4: { done: true, acerto: 0.78, S: 5.0, D: 0.46 },
    d7: { done: true, acerto: 0.80, S: 9.0, D: 0.45 },
  },
};

const temaDominado = {
  id: "tema-dom",
  nome: "Tema dominado",
  esp: "Cirurgia",
  rev: {
    d0: { done: true, acerto: 0.90, S: 1.0, D: 0.5 },
    d1: { done: true, acerto: 0.86, S: 2.2, D: 0.48 },
    d4: { done: true, acerto: 0.84, S: 5.5, D: 0.46 },
    d7: { done: true, acerto: 0.88, S: 10.0, D: 0.44 },
    d21: { done: true, acerto: 0.86, S: 18.0, D: 0.42 },
  },
};

const temaLapse = {
  id: "tema-lapse",
  nome: "Tema com recaida",
  esp: "Pediatria",
  rev: {
    d0: { done: true, acerto: 0.90, S: 1.0, D: 0.5 },
    d1: { done: true, acerto: 0.88, S: 2.0, D: 0.48 },
    d4: { done: true, acerto: 0.86, S: 5.0, D: 0.46 },
    d7: { done: true, acerto: 0.40, S: 2.0, D: 0.65 },
  },
};

describe("mastery public contract", () => {
  test("exports publicos existem", () => {
    expect(MASTERY_LEVELS.MASTERED).toBe("dominado");
    expect(MASTERY_CONFIDENCE.HIGH).toBe("high");
    expect(DEFAULT_MASTERY_PARAMS.prior).toBeGreaterThan(0);
    expect(typeof updateBayesianMastery).toBe("function");
    expect(typeof collectMasteryEvidence).toBe("function");
    expect(typeof estimateMastery).toBe("function");
    expect(typeof estimateTopicMastery).toBe("function");
    expect(typeof estimateAreaMastery).toBe("function");
    expect(typeof estimateStudentMastery).toBe("function");
    expect(typeof getWeakMasteryTargets).toBe("function");
  });

  test("estimateTopicMastery nao quebra com tema null", () => {
    const result = estimateTopicMastery(null);
    expect(result.level).toBe(MASTERY_LEVELS.LEARNING);
    expect(result.evidenceCount).toBe(0);
    expect(result.confidence).toBe(MASTERY_CONFIDENCE.NONE);
  });

  test("estimateTopicMastery retorna objeto com campos esperados", () => {
    const result = estimateTopicMastery(temaD0Only);
    expect(result).toEqual(expect.objectContaining({
      topicId: "tema-d0",
      topicName: "D0 perfeito",
      area: "Clinica Medica",
      subtopic: "D0 perfeito",
      pMastery: expect.any(Number),
      level: expect.any(String),
      confidence: expect.any(String),
      evidenceCount: 1,
      raw: expect.objectContaining({ paramsVersion: "mastery-bkt-lite-v1" }),
    }));
  });

  test("funcoes nao mutam tema original", () => {
    const tema = JSON.parse(JSON.stringify(temaDominado));
    const before = JSON.stringify(tema);
    estimateTopicMastery(tema);
    estimateStudentMastery({ temas: [tema], temaStats: {} });
    expect(JSON.stringify(tema)).toBe(before);
  });
});

describe("mastery BKT-like update", () => {
  test("updateBayesianMastery aumenta p apos acerto alto", () => {
    const next = updateBayesianMastery(0.40, { acerto: 0.95, stepWeight: 1, evidenceWeight: 1 });
    expect(next).toBeGreaterThan(0.40);
  });

  test("updateBayesianMastery reduz p apos acerto baixo", () => {
    const next = updateBayesianMastery(0.70, { acerto: 0.05, stepWeight: 1, evidenceWeight: 1 });
    expect(next).toBeLessThan(0.70);
  });

  test("updateBayesianMastery lida com acerto continuo", () => {
    const low = updateBayesianMastery(0.50, { acerto: 0.30 });
    const mid = updateBayesianMastery(0.50, { acerto: 0.50 });
    const high = updateBayesianMastery(0.50, { acerto: 0.80 });
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
  });

  test("updateBayesianMastery faz clamp entre 0 e 1", () => {
    expect(updateBayesianMastery(2, { acerto: 2 })).toBeLessThanOrEqual(1);
    expect(updateBayesianMastery(-1, { acerto: -1 })).toBeGreaterThanOrEqual(0);
  });

  test("updateBayesianMastery nao lanca com input invalido", () => {
    expect(() => updateBayesianMastery("x", null)).not.toThrow();
    expect(updateBayesianMastery(0.42, null)).toBeCloseTo(0.42);
  });
});

describe("estimateMastery subtopic BKT/PFA", () => {
  const cardiologyEvents = [
    { tema: "Hipertensao arterial", area: "Clinica Medica", step: "d0", acerto: 0.82, questoes: 10, confianca: "media" },
    { tema: "Hipertensao arterial", area: "Clinica Medica", step: "d1", acerto: 0.86, questoes: 12, confianca: "alta" },
    { tema: "Hipertensao arterial", area: "Clinica Medica", step: "d4", acerto: 0.90, questoes: 15, confianca: "alta" },
    { tema: "Hipertensao arterial", area: "Clinica Medica", step: "d7", acerto: 0.88, questoes: 15, confianca: "alta" },
  ];

  test("acertos espacados sobem pKnown por subtopico canonico", () => {
    const result = estimateMastery(cardiologyEvents, { unit: "subtopic" });
    expect(result.Cardiologia).toEqual(expect.objectContaining({
      area: "Clínica Médica",
      pKnown: expect.any(Number),
      confidence: expect.any(String),
      sampleQuality: expect.objectContaining({
        spacedEvidenceCount: 3,
        status: expect.stringMatching(/media|alta/),
      }),
      params: expect.objectContaining({
        slip: expect.any(Number),
        guess: expect.any(Number),
        learn: expect.any(Number),
        prior: expect.any(Number),
      }),
    }));
    expect(result.Cardiologia.pKnown).toBeGreaterThan(0.75);
  });

  test("chute quase nao sobe pKnown e aumenta guess interpretavel", () => {
    const result = estimateMastery([
      { tema: "Infarto agudo do miocardio", area: "Clinica Medica", step: "d1", acerto: 1, questoes: 1, confianca: "baixa" },
    ], { unit: "subtopic" });

    expect(result.Cardiologia.pKnown).toBeLessThan(0.45);
    expect(result.Cardiologia.params.guess).toBeGreaterThan(DEFAULT_MASTERY_PARAMS.guess);
    expect(result.Cardiologia.sampleQuality.performanceFactors.guesses).toBe(1);
  });

  test("slip por erro com alta confianca derruba pouco", () => {
    const baseline = estimateMastery(cardiologyEvents, { unit: "subtopic" }).Cardiologia;
    const slipped = estimateMastery([
      ...cardiologyEvents,
      { tema: "Hipertensao arterial", area: "Clinica Medica", step: "d21", acerto: 0, questoes: 10, confianca: "alta" },
    ], { unit: "subtopic" }).Cardiologia;

    expect(slipped.params.slip).toBeGreaterThan(DEFAULT_MASTERY_PARAMS.slip);
    expect(slipped.sampleQuality.performanceFactors.slips).toBe(1);
    expect(baseline.pKnown - slipped.pKnown).toBeLessThan(0.18);
    expect(slipped.pKnown).toBeGreaterThan(0.65);
  });

  test("D0 100 isolado fica baixo e insuficiente", () => {
    const result = estimateMastery([
      { tema: "Apendicite aguda", area: "Cirurgia", step: "d0", acerto: 1, questoes: 20, confianca: "alta" },
    ], { unit: "subtopic" });

    expect(result["Cirurgia Geral"].pKnown).toBeLessThanOrEqual(0.55);
    expect(result["Cirurgia Geral"].sampleQuality.status).toBe("insuficiente");
    expect(result["Cirurgia Geral"].warnings).toContain("no_spaced_evidence");
  });

  test("compat com estado antigo baseado em temas/rev", () => {
    const oldState = {
      res: {
        temas: [{
          id: "old-cardio",
          nome: "Hipertensao arterial",
          esp: "Clinica Medica",
          rev: {
            d1: { done: true, acerto: 0.80, questoes: 12 },
            d4: { done: true, acerto: 0.84, questoes: 14 },
          },
        }],
      },
    };

    const result = estimateMastery(oldState, { unit: "subtopic" });
    expect(result.Cardiologia.evidenceCount).toBe(2);
    expect(result.Cardiologia.sampleQuality.spacedEvidenceCount).toBe(2);
  });
});

describe("mastery anti-falso dominio", () => {
  test("tema apenas com D0 100% continua aprendendo", () => {
    const result = estimateTopicMastery(temaD0Only);
    expect(result.level).toBe(MASTERY_LEVELS.LEARNING);
    expect(result.warnings).toContain("d0_only");
    expect(result.warnings).toContain("no_mature_evidence");
  });

  test("tema com uma unica evidencia alta nao vira dominado", () => {
    const result = estimateTopicMastery({
      id: "single",
      nome: "Single",
      esp: "Clinica",
      rev: { d21: { done: true, acerto: 1, S: 20, D: 0.3 } },
    });
    expect(result.level).not.toBe(MASTERY_LEVELS.MASTERED);
    expect(result.warnings).toContain("single_evidence");
  });

  test("tema sem D21/manutencao nao vira dominado", () => {
    const result = estimateTopicMastery(temaConsolidando);
    expect(result.pMastery).toBeGreaterThanOrEqual(0.65);
    expect(result.level).toBe(MASTERY_LEVELS.CONSOLIDATING);
    expect(result.warnings).toContain("no_mature_evidence");
  });

  test("tema com D21 alto, estabilidade alta e duas revisoes boas vira dominado", () => {
    const result = estimateTopicMastery(temaDominado);
    expect(result.level).toBe(MASTERY_LEVELS.MASTERED);
    expect(result.pMastery).toBeGreaterThanOrEqual(0.85);
    expect(result.matureEvidenceCount).toBeGreaterThanOrEqual(1);
    expect(result.highQualityEvidenceCount).toBeGreaterThanOrEqual(2);
    expect([MASTERY_CONFIDENCE.MEDIUM, MASTERY_CONFIDENCE.HIGH]).toContain(result.confidence);
  });

  test("lapse recente impede dominado", () => {
    const result = estimateTopicMastery(temaLapse);
    const consolidando = estimateTopicMastery(temaConsolidando);
    expect(result.level).not.toBe(MASTERY_LEVELS.MASTERED);
    expect(result.reasons).toContain("recent_lapse");
    expect(result.pMastery).toBeLessThan(consolidando.pMastery);
  });
});

describe("mastery compatibility", () => {
  test("getEstadoDominio retorna aprendendo sem rev", () => {
    expect(getEstadoDominio({ id: "x", nome: "Sem rev" })).toBe(MASTERY_LEVELS.LEARNING);
  });

  test("getEstadoDominio retorna consolidando para D7 adequado", () => {
    expect(getEstadoDominio(temaConsolidando)).toBe(MASTERY_LEVELS.CONSOLIDATING);
  });

  test("getEstadoDominio retorna dominado para D21 maduro", () => {
    expect(getEstadoDominio(temaDominado)).toBe(MASTERY_LEVELS.MASTERED);
  });

  test("getProntidaoGlobal preserva shape antigo", () => {
    const result = getProntidaoGlobal([temaDominado, temaConsolidando], {});
    expect(Object.keys(result).sort()).toEqual([
      "acertoMedioGeral",
      "index",
      "pctAreasProntas",
      "sugerirModoProva",
    ]);
    expect(typeof result.index).toBe("number");
    expect(typeof result.sugerirModoProva).toBe("boolean");
  });
});

describe("mastery aggregation", () => {
  test("estimateAreaMastery agrupa por esp", () => {
    const result = estimateAreaMastery([temaDominado, temaConsolidando, temaVazio], {});
    expect(result.Cirurgia.totalTopics).toBe(1);
    expect(result.Preventiva.totalTopics).toBe(1);
    expect(result["Clinica Medica"].totalTopics).toBe(1);
  });

  test("area com coverage baixo nao fica dominada", () => {
    const result = estimateAreaMastery([
      temaDominado,
      { ...temaVazio, id: "vazio-2", esp: "Cirurgia" },
      { ...temaVazio, id: "vazio-3", esp: "Cirurgia" },
    ], {});
    expect(result.Cirurgia.coverage).toBeLessThan(0.60);
    expect(result.Cirurgia.level).not.toBe(MASTERY_LEVELS.MASTERED);
  });

  test("estimateStudentMastery retorna global/byArea/byTopic/weakTargets", () => {
    const result = estimateStudentMastery({ temas: [temaDominado, temaConsolidando, temaLapse], temaStats: {} });
    expect(result.global.totalTopics).toBe(3);
    expect(result.byTopic).toHaveLength(3);
    expect(result.byArea.Cirurgia).toBeTruthy();
    expect(Array.isArray(result.weakTargets)).toBe(true);
  });

  test("getWeakMasteryTargets ordena do mais fraco para o menos fraco", () => {
    const targets = getWeakMasteryTargets({
      temas: [temaDominado, temaLapse, temaD0Only],
      temaStats: {},
      limit: 3,
    });
    expect(targets).toHaveLength(3);
    expect(targets[0].pMastery).toBeLessThanOrEqual(targets[1].pMastery);
    expect(targets[0].suggestedFocus).toBeTruthy();
  });
});

describe("mastery optional operationalMode context", () => {
  test("operationalMode sobrecarga nao altera pMastery", () => {
    const normal = estimateTopicMastery(temaDominado);
    const overload = estimateTopicMastery(temaDominado, [], { operationalMode: { mode: "sobrecarga" } });
    expect(overload.pMastery).toBeCloseTo(normal.pMastery);
  });

  test("operationalMode sobrecarga adiciona warning de confiabilidade", () => {
    const result = estimateTopicMastery(temaDominado, [], { operationalMode: { mode: "sobrecarga" } });
    expect(result.warnings).toContain("operational_overload_may_reduce_reliability");
    expect(result.confidence).toBe(MASTERY_CONFIDENCE.MEDIUM);
  });
});

describe("estimateSubtopicParams (B3)", () => {
  test("calcula n, guess, slip e suaviza com priors globais", () => {
    const eventsPequeno = [
      { tema: "Hipertensao", area: "Clinica Medica", step: "d1", acerto: 1, confianca: "baixa" }
    ];
    const paramsPequeno = estimateSubtopicParams(eventsPequeno);
    expect(paramsPequeno.Cardiologia.n).toBe(1);
    expect(paramsPequeno.Cardiologia.guess).toBeCloseTo(0.32, 2);
    expect(paramsPequeno.Cardiologia.slip).toBeCloseTo(0.12, 2);
  });

  test("muitos chutes => guess alto e acerto sobe pouco", () => {
    const eventsChutes = [];
    for (let i = 0; i < 15; i++) {
      eventsChutes.push({ tema: "Hipertensao", area: "Clinica Medica", step: "d1", acerto: 1, confianca: "baixa" });
    }
    const params = estimateSubtopicParams(eventsChutes);
    expect(params.Cardiologia.n).toBe(15);
    expect(params.Cardiologia.guess).toBe(0.45);

    const p1 = updateBayesianMastery(0.30, { subtopic: "Cardiologia", acerto: 1 }, { Cardiologia: { guess: 0.25, slip: 0.12 } });
    const p2 = updateBayesianMastery(0.30, { subtopic: "Cardiologia", acerto: 1 }, params);
    expect(p2).toBeLessThan(p1);
  });

  test("errar-sabendo (slips) => slip alto e erro derruba pouco", () => {
    const eventsSlips = [];
    for (let i = 0; i < 15; i++) {
      eventsSlips.push({ tema: "Hipertensao", area: "Clinica Medica", step: "d1", acerto: 0, confianca: "alta" });
    }
    const params = estimateSubtopicParams(eventsSlips);
    expect(params.Cardiologia.n).toBe(15);
    expect(params.Cardiologia.slip).toBe(0.45);

    const p1 = updateBayesianMastery(0.70, { subtopic: "Cardiologia", acerto: 0 }, { Cardiologia: { guess: 0.25, slip: 0.12 } });
    const p2 = updateBayesianMastery(0.70, { subtopic: "Cardiologia", acerto: 0 }, params);
    expect(p2).toBeGreaterThan(p1);
  });
});
