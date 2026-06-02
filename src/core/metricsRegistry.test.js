// src/core/metricsRegistry.test.js
import {
  METRIC_STATUS,
  MANDATORY_METRIC_IDS,
  getMetricDefinition,
  evaluateMetric,
  getMetricsForSection,
  formatMetricValue,
  getAllSections,
} from "./metricsRegistry";

// ─── Definicoes obrigatorias ──────────────────────────────────────────────────

describe("metricsRegistry — definicoes obrigatorias", () => {
  const REQUIRED = [
    "trueRetention",
    "todayWorkloadMinutes",
    "overdueReviews",
    "relearningCount",
    "coverageByArea",
    "simuladoAccuracy",
    "enamedGap",
    "dominantError",
    "clinicalReasoningScore",
    "ankiAdherence",
    "weeklyConsistency",
  ];

  test("MANDATORY_METRIC_IDS contem todos os ids exigidos", () => {
    REQUIRED.forEach((id) => {
      expect(MANDATORY_METRIC_IDS).toContain(id);
    });
  });

  test("getMetricDefinition retorna objeto valido para cada metrica obrigatoria", () => {
    REQUIRED.forEach((id) => {
      const def = getMetricDefinition(id);
      expect(def).not.toBeNull();
      expect(def.id).toBe(id);
      expect(typeof def.label).toBe("string");
      expect(typeof def.description).toBe("string");
      expect(typeof def.emptyState).toBe("string");
      expect(typeof def.confidenceRule).toBe("function");
      expect(Array.isArray(def.platforms)).toBe(true);
      expect(def.platforms.length).toBeGreaterThan(0);
    });
  });

  test("getMetricDefinition retorna null para id desconhecido", () => {
    expect(getMetricDefinition("metricaInexistente")).toBeNull();
  });
});

// ─── trueRetention — regra de confianca ──────────────────────────────────────

describe("trueRetention — status baseado em amostra", () => {
  test("retorna COLLECTING quando value e null", () => {
    const result = evaluateMetric("trueRetention", null, { n: 0 });
    expect(result.status).toBe(METRIC_STATUS.COLLECTING);
    expect(result.confident).toBe(false);
  });

  test("retorna LOW_CONFIDENCE quando n < 5 mesmo com value preenchido", () => {
    const result = evaluateMetric("trueRetention", 80, { n: 3 });
    expect(result.status).toBe(METRIC_STATUS.LOW_CONFIDENCE);
    expect(result.confident).toBe(false);
  });

  test("retorna OK quando n >= 5 e value acima do threshold de warning", () => {
    const result = evaluateMetric("trueRetention", 80, { n: 5 });
    expect(result.status).toBe(METRIC_STATUS.OK);
    expect(result.confident).toBe(true);
  });

  test("retorna WARNING quando n >= 5 mas value abaixo de 70", () => {
    const result = evaluateMetric("trueRetention", 65, { n: 7 });
    expect(result.status).toBe(METRIC_STATUS.WARNING);
  });

  test("retorna CRITICAL quando n >= 5 e value abaixo de 55", () => {
    const result = evaluateMetric("trueRetention", 50, { n: 6 });
    expect(result.status).toBe(METRIC_STATUS.CRITICAL);
  });
});

// ─── Plataforma — vest nao recebe metricas exclusivas de res ─────────────────

describe("getMetricsForSection — isolamento por plataforma", () => {
  test("vest nao recebe enamedGap", () => {
    const vestSections = ["resumo", "aprendizagem", "erros", "provas", "raciocinio", "atividade", "sistema"];
    const vestMetrics = vestSections.flatMap((s) => getMetricsForSection(s, "vest"));
    const ids = vestMetrics.map((m) => m.id);
    expect(ids).not.toContain("enamedGap");
  });

  test("vest nao recebe clinicalReasoningScore", () => {
    const vestMetrics = getMetricsForSection("raciocinio", "vest");
    expect(vestMetrics).toHaveLength(0);
  });

  test("res recebe enamedGap", () => {
    const resMetrics = getMetricsForSection("provas", "res");
    const ids = resMetrics.map((m) => m.id);
    expect(ids).toContain("enamedGap");
  });

  test("res recebe clinicalReasoningScore", () => {
    const resMetrics = getMetricsForSection("raciocinio", "res");
    const ids = resMetrics.map((m) => m.id);
    expect(ids).toContain("clinicalReasoningScore");
  });

  test("trueRetention aparece em res e vest", () => {
    const resMetrics = getMetricsForSection("resumo", "res");
    const vestMetrics = getMetricsForSection("resumo", "vest");
    expect(resMetrics.map((m) => m.id)).toContain("trueRetention");
    expect(vestMetrics.map((m) => m.id)).toContain("trueRetention");
  });
});

// ─── formatMetricValue — resistencia a null ──────────────────────────────────

describe("formatMetricValue — seguranca com valores invalidos", () => {
  test("retorna — para null", () => {
    expect(formatMetricValue("trueRetention", null)).toBe("—");
  });

  test("retorna — para undefined", () => {
    expect(formatMetricValue("trueRetention", undefined)).toBe("—");
  });

  test("formata numero com unidade de percentual", () => {
    const result = formatMetricValue("trueRetention", 85);
    expect(result).toContain("85");
    expect(result).toContain("%");
  });

  test("formata numero sem unidade para overdueReviews", () => {
    const result = formatMetricValue("overdueReviews", 3);
    expect(result).toBe("3");
  });

  test("retorna — mesmo para id desconhecido com valor null", () => {
    expect(formatMetricValue("metricaDesconhecida", null)).toBe("—");
  });

  test("nao lanca excecao para value zero", () => {
    expect(() => formatMetricValue("trueRetention", 0)).not.toThrow();
  });

  test("formata string para dominantError", () => {
    expect(formatMetricValue("dominantError", "raciocinio")).toBe("raciocinio");
  });
});

// ─── evaluateMetric — comportamentos gerais ──────────────────────────────────

describe("evaluateMetric — comportamentos gerais", () => {
  test("retorna objeto com campos esperados para metrica valida", () => {
    const result = evaluateMetric("simuladoAccuracy", 70, { n: 4 });
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("value");
    expect(result).toHaveProperty("label");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("emptyState");
    expect(result).toHaveProperty("action");
    expect(result).toHaveProperty("confident");
  });

  test("id inexistente retorna COLLECTING sem lancar excecao", () => {
    expect(() => evaluateMetric("naoExiste", 50, {})).not.toThrow();
    const result = evaluateMetric("naoExiste", 50, {});
    expect(result.status).toBe(METRIC_STATUS.COLLECTING);
  });

  test("overdueReviews = 0 retorna OK", () => {
    const result = evaluateMetric("overdueReviews", 0, {});
    expect(result.status).toBe(METRIC_STATUS.OK);
  });

  test("overdueReviews = 5 retorna WARNING", () => {
    const result = evaluateMetric("overdueReviews", 5, {});
    expect(result.status).toBe(METRIC_STATUS.WARNING);
  });

  test("overdueReviews = 12 retorna CRITICAL", () => {
    const result = evaluateMetric("overdueReviews", 12, {});
    expect(result.status).toBe(METRIC_STATUS.CRITICAL);
  });

  test("action e null quando status OK", () => {
    const result = evaluateMetric("simuladoAccuracy", 80, { n: 4 });
    expect(result.action).toBeNull();
  });

  test("action e string quando status WARNING", () => {
    const result = evaluateMetric("simuladoAccuracy", 55, { n: 4 });
    expect(typeof result.action).toBe("string");
    expect(result.action.length).toBeGreaterThan(0);
  });
});

// ─── getAllSections ───────────────────────────────────────────────────────────

describe("getAllSections", () => {
  test("retorna array com as 7 secoes esperadas", () => {
    const sections = getAllSections();
    const expected = ["resumo", "aprendizagem", "erros", "provas", "raciocinio", "atividade"];
    expected.forEach((s) => expect(sections).toContain(s));
  });
});
