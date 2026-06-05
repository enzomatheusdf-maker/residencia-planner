import {
  DEFAULT_MASTERY_PARAMS,
  MASTERY_CONFIDENCE,
  MASTERY_LEVELS,
  collectMasteryEvidence,
  estimateAreaMastery,
  estimateStudentMastery,
  estimateTopicMastery,
  getEstadoDominio,
  getProntidaoGlobal,
  getWeakMasteryTargets,
  updateBayesianMastery,
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
