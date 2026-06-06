// src/core/clinicalReasoningScoring.test.js
import {
  normalizeClinicalReasoningProgress,
  calculateClinicalReasoningScore,
  calculateClinicalReasoningScoreDetailed,
  calcCoverageByArea,
  scoreClinicalReasoningSession,
} from "./clinicalReasoningScoring";

// ─── normalizeClinicalReasoningProgress ──────────────────────────────────────

describe("normalizeClinicalReasoningProgress", () => {
  test("retorna null para progresso nulo", () => {
    expect(normalizeClinicalReasoningProgress(null)).toBeNull();
    expect(normalizeClinicalReasoningProgress(undefined)).toBeNull();
  });

  test("retorna null para caso nao visitado (vistos=0)", () => {
    expect(normalizeClinicalReasoningProgress({ vistos: 0, fase2Acerto: 80, sctAcerto: 90 })).toBeNull();
  });

  test("retorna null se nao ha fase2Acerto nem sctAcerto", () => {
    expect(normalizeClinicalReasoningProgress({ vistos: 1 })).toBeNull();
  });

  test("formula ponderada correta: 80*0.6 + 70*0.4 = 76", () => {
    const score = normalizeClinicalReasoningProgress({ vistos: 1, fase2Acerto: 80, sctAcerto: 70 });
    expect(score).toBe(76);
  });

  test("formula adaptativa: so fase2 disponivel usa 100% do peso", () => {
    const score = normalizeClinicalReasoningProgress({ vistos: 1, fase2Acerto: 75 });
    expect(score).toBe(75);
  });

  test("formula adaptativa: so sct disponivel usa 100% do peso", () => {
    const score = normalizeClinicalReasoningProgress({ vistos: 1, sctAcerto: 60 });
    expect(score).toBe(60);
  });

  test("clamp: nao excede 100", () => {
    const score = normalizeClinicalReasoningProgress({ vistos: 1, fase2Acerto: 150, sctAcerto: 200 });
    expect(score).toBeLessThanOrEqual(100);
  });

  test("clamp: nao fica abaixo de 0", () => {
    const score = normalizeClinicalReasoningProgress({ vistos: 1, fase2Acerto: -10, sctAcerto: -20 });
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test("strings nao-numericas resultam em null", () => {
    expect(normalizeClinicalReasoningProgress({ vistos: 1, fase2Acerto: "abc" })).toBeNull();
  });
});

// ─── calculateClinicalReasoningScore ─────────────────────────────────────────

describe("calculateClinicalReasoningScore", () => {
  test("retorna null para progresso vazio", () => {
    expect(calculateClinicalReasoningScore({})).toBeNull();
    expect(calculateClinicalReasoningScore(null)).toBeNull();
  });

  test("retorna null se todos os casos nao visitados", () => {
    expect(calculateClinicalReasoningScore({ c1: { vistos: 0, fase2Acerto: 80 } })).toBeNull();
  });

  test("media de 2 casos com scores diferentes", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 }, // 76
      c2: { vistos: 1, fase2Acerto: 60, sctAcerto: 50 }, // 56
    };
    // (76 + 56) / 2 = 66
    expect(calculateClinicalReasoningScore(prog)).toBe(66);
  });

  test("ignora casos sem score", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 }, // 76
      c2: { vistos: 0 }, // null — ignorado
    };
    expect(calculateClinicalReasoningScore(prog)).toBe(76);
  });

  test("score 100 possivel com acertos maximos", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 100, sctAcerto: 100 },
    };
    expect(calculateClinicalReasoningScore(prog)).toBe(100);
  });
});

// ─── calculateClinicalReasoningScoreDetailed ─────────────────────────────────

describe("calculateClinicalReasoningScoreDetailed", () => {
  test("collecting=true e n=0 para progresso vazio", () => {
    const result = calculateClinicalReasoningScoreDetailed({});
    expect(result.score).toBeNull();
    expect(result.n).toBe(0);
    expect(result.collecting).toBe(true);
    expect(result.confident).toBe(false);
  });

  test("collecting=true quando n < 3", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 },
      c2: { vistos: 1, fase2Acerto: 60 },
    };
    const result = calculateClinicalReasoningScoreDetailed(prog);
    expect(result.n).toBe(2);
    expect(result.collecting).toBe(true);
    expect(result.confident).toBe(false);
  });

  test("confident=true quando n >= 3", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 },
      c2: { vistos: 1, fase2Acerto: 60, sctAcerto: 50 },
      c3: { vistos: 1, fase2Acerto: 90, sctAcerto: 85 },
    };
    const result = calculateClinicalReasoningScoreDetailed(prog);
    expect(result.n).toBe(3);
    expect(result.collecting).toBe(false);
    expect(result.confident).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  test("byCase inclui todos os casos com seus scores", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 },
      c2: { vistos: 0 },
    };
    const result = calculateClinicalReasoningScoreDetailed(prog);
    expect(result.byCase).toHaveLength(2);
    const c1 = result.byCase.find((c) => c.casoId === "c1");
    const c2 = result.byCase.find((c) => c.casoId === "c2");
    expect(c1.score).toBe(76);
    expect(c2.score).toBeNull();
  });
});

// ─── calcCoverageByArea ───────────────────────────────────────────────────────

describe("calcCoverageByArea", () => {
  const casos = [
    { id: "c1", area: "Cardiologia" },
    { id: "c2", area: "Cardiologia" },
    { id: "c3", area: "Pneumologia" },
  ];

  test("retorna objeto vazio para listas vazias", () => {
    expect(calcCoverageByArea([], {})).toEqual({});
    expect(calcCoverageByArea(null, {})).toEqual({});
  });

  test("cobertura 0% para casos nao visitados", () => {
    const result = calcCoverageByArea(casos, {});
    expect(result.Cardiologia.pctCobertura).toBe(0);
    expect(result.Cardiologia.notaMedia).toBeNull();
  });

  test("cobertura 50% para 1 de 2 casos em Cardiologia", () => {
    const prog = { c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 } };
    const result = calcCoverageByArea(casos, prog);
    expect(result.Cardiologia.pctCobertura).toBe(50);
    expect(result.Cardiologia.notaMedia).toBe(76);
  });

  test("cobertura 100% para area com 1 caso visitado", () => {
    const prog = { c3: { vistos: 1, fase2Acerto: 60, sctAcerto: 50 } };
    const result = calcCoverageByArea(casos, prog);
    expect(result.Pneumologia.pctCobertura).toBe(100);
    expect(result.Pneumologia.notaMedia).toBe(56);
  });

  test("nota media de 2 casos com scores diferentes", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 }, // 76
      c2: { vistos: 1, fase2Acerto: 60, sctAcerto: 50 }, // 56
    };
    const result = calcCoverageByArea(casos, prog);
    // (76 + 56) / 2 = 66
    expect(result.Cardiologia.notaMedia).toBe(66);
    expect(result.Cardiologia.pctCobertura).toBe(100);
  });

  test("ignora casos sem area definida", () => {
    const casosComSemArea = [...casos, { id: "c4" }];
    const result = calcCoverageByArea(casosComSemArea, {});
    expect(Object.keys(result)).not.toContain(undefined);
    expect(Object.keys(result)).not.toContain("undefined");
  });
});

// ─── Consistencia com readiness.js (formula de referencia) ──────────────────

describe("paridade com formula de readiness.js", () => {
  // readiness.js usa pesos adaptativos identicos — verifica paridade exata
  const referenceCases = [
    { input: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 }, expected: 76 },
    { input: { vistos: 1, fase2Acerto: 100, sctAcerto: 100 }, expected: 100 },
    { input: { vistos: 1, fase2Acerto: 0, sctAcerto: 0 }, expected: 0 },
    { input: { vistos: 1, fase2Acerto: 50 }, expected: 50 }, // so fase2
    { input: { vistos: 1, sctAcerto: 90 }, expected: 90 }, // so sct
  ];

  referenceCases.forEach(({ input, expected }) => {
    test(`fase2=${input.fase2Acerto} sct=${input.sctAcerto} -> ${expected}`, () => {
      expect(normalizeClinicalReasoningProgress(input)).toBe(expected);
    });
  });
});

describe("scoreClinicalReasoningSession", () => {
  const dummyScript = {
    tema: "Apendicite Aguda",
    consequences: "Dor migratória para FID, sinal de Blumberg",
    management: "Apendicectomia urgente",
    pertinentNegatives: ["Ausência de diarreia", "Sem febre alta"],
    keyFeatures: [
      { prompt: "Qual o exame inicial?", expectedAction: "USG de abdome", isCritical: true },
      { prompt: "Qual a conduta?", expectedAction: "Internação", isCritical: false }
    ]
  };

  test("negativo pertinente sobe o score", () => {
    // Session A: Sem contra-argumentos/negativos pertinentes
    const sessionA = {
      keyFeatures: ["USG de abdome", "Internação"],
      apoia: ["Dor migratória para FID"],
      contra: [],
      falta: [],
      conduta: "Apendicectomia urgente",
      confianca: "media"
    };

    // Session B: Com contra-argumentos/negativos pertinentes combinando com pertinentNegatives do script
    const sessionB = {
      ...sessionA,
      contra: ["Ausência de diarreia", "Sem febre alta"]
    };

    const resultA = scoreClinicalReasoningSession(sessionA, dummyScript);
    const resultB = scoreClinicalReasoningSession(sessionB, dummyScript);

    expect(resultB.score).toBeGreaterThan(resultA.score);
    expect(resultB.breakdown.negativos).toBe(2);
    expect(resultA.breakdown.negativos).toBe(0);
  });

  test("pular key feature crítico derruba o score", () => {
    // Session A: Realiza todos os key features
    const sessionA = {
      keyFeatures: ["USG de abdome", "Internação"],
      apoia: ["Dor migratória para FID"],
      contra: ["Ausência de diarreia"],
      falta: [],
      conduta: "Apendicectomia urgente",
      confianca: "media"
    };

    // Session B: Pula o key feature crítico ("USG de abdome")
    const sessionB = {
      ...sessionA,
      keyFeatures: ["Internação"]
    };

    const resultA = scoreClinicalReasoningSession(sessionA, dummyScript);
    const resultB = scoreClinicalReasoningSession(sessionB, dummyScript);

    expect(resultB.score).toBeLessThan(resultA.score);
    expect(resultB.breakdown.keyFeatures).toBe(2); // 1 kf matched * 2
    expect(resultA.breakdown.keyFeatures).toBe(4); // 2 kf matched * 2
  });

  test("fechamento precoce flag: pular key feature crítico com alta confiança", () => {
    // Session A: Pula key feature crítico, mas com confiança baixa
    const sessionA = {
      keyFeatures: ["Internação"],
      apoia: ["Dor migratória para FID"],
      contra: ["Ausência de diarreia"],
      falta: [],
      conduta: "Apendicectomia urgente",
      confianca: "baixa"
    };

    // Session B: Pula key feature crítico com confiança alta
    const sessionB = {
      ...sessionA,
      confianca: "alta"
    };

    const resultA = scoreClinicalReasoningSession(sessionA, dummyScript);
    const resultB = scoreClinicalReasoningSession(sessionB, dummyScript);

    expect(resultB.errosDetectados).toContain("premature_closure");
    expect(resultA.errosDetectados).not.toContain("premature_closure");
    // O score da Session B deve ter -20 pontos de penalidade em relação ao A
    expect(resultB.score).toBe(resultA.score - 20);
  });
});
