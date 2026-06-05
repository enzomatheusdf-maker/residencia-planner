import {
  FORECAST_CONFIDENCE,
  FORECAST_DISPLAY_MODE,
  calculateForecastBand,
  calculateForecastSampleV2,
  calculateOperationalRisk,
  calculateSimuladoAnchor,
  calculateTimePotential,
  daysBetweenDates,
  estimateAreaForecasts,
  estimateReadinessForecast,
  normalizeSimulados,
  parseExamDate,
} from "./forecast";

function addDays(base, days) {
  const date = new Date(`${base}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function makeTema(id, area, acerto = 0.82, date = "2026-01-01", questoes = 25) {
  return {
    id,
    nome: `Tema ${id}`,
    esp: area,
    d0: date,
    rev: {
      d0: { done: true, acerto, questoes, date },
    },
  };
}

function makeTemas({ acerto = 0.82 } = {}) {
  const areas = ["Clinica Medica", "Cirurgia", "Pediatria", "Preventiva"];
  return Array.from({ length: 14 }, (_, index) => (
    makeTema(`t${index + 1}`, areas[index % areas.length], acerto, addDays("2026-01-01", index), 25)
  ));
}

describe("forecast datas", () => {
  test("parseExamDate usa meta.dataProva valida", () => {
    expect(parseExamDate({ dataProva: "2026-09-13" })).toBe("2026-09-13");
  });

  test("parseExamDate rejeita formato invalido e usa fallback valido", () => {
    expect(parseExamDate({ dataProva: "13/09/2026" }, "2026-09-13")).toBe("2026-09-13");
    expect(parseExamDate({ dataProva: "2026-02-30" })).toBeNull();
  });

  test("daysBetweenDates calcula diferenca correta", () => {
    expect(daysBetweenDates("2026-01-01", "2026-01-31")).toBe(30);
  });

  test("data passada vira daysUntilExam 0 no forecast", () => {
    const result = estimateReadinessForecast({
      temas: makeTemas(),
      simulados: [{ pct: 70, data: "2026-01-10", totalQuestions: 120 }],
      meta: { dataProva: "2026-01-01" },
      today: "2026-02-01",
    });
    expect(result.daysUntilExam).toBe(0);
  });
});

describe("forecast simulados", () => {
  test("normalizeSimulados aceita pct 0-100 e 0-1", () => {
    const result = normalizeSimulados([
      { pct: 72, data: "2026-02-01", totalQuestions: 100 },
      { percentual: 0.81, data: "2026-02-10", questoes: 120 },
    ]);
    expect(result.map((item) => item.pct)).toEqual([72, 81]);
    expect(result[1].totalQuestions).toBe(120);
  });

  test("normalizeSimulados ignora pct invalido", () => {
    expect(normalizeSimulados([{ pct: "x" }, { score: 63 }])).toHaveLength(1);
  });

  test("calculateSimuladoAnchor pondera ultimos 4", () => {
    const anchor = calculateSimuladoAnchor([
      { pct: 40, data: "2026-01-01" },
      { pct: 50, data: "2026-01-10" },
      { pct: 60, data: "2026-01-20" },
      { pct: 70, data: "2026-01-30" },
      { pct: 80, data: "2026-02-10" },
    ]);
    expect(anchor.n).toBe(5);
    expect(anchor.recent.map((item) => item.pct)).toEqual([50, 60, 70, 80]);
    expect(anchor.value).toBeGreaterThan(65);
  });

  test("adicionar simulado recente maior aumenta anchor", () => {
    const before = calculateSimuladoAnchor([{ pct: 60 }, { pct: 64 }]);
    const after = calculateSimuladoAnchor([{ pct: 60 }, { pct: 64 }, { pct: 82 }]);
    expect(after.value).toBeGreaterThan(before.value);
  });
});

describe("forecast amostra e modos", () => {
  test("sem simulado fica insufficient e collecting", () => {
    const result = estimateReadinessForecast({
      temas: makeTemas(),
      simulados: [],
      meta: { dataProva: "2026-09-13" },
      today: "2026-02-01",
    });
    expect(result.confidence).toBe(FORECAST_CONFIDENCE.INSUFFICIENT);
    expect(result.displayMode).toBe(FORECAST_DISPLAY_MODE.COLLECTING);
    expect(result.isActionable).toBe(false);
  });

  test("1 simulado com amostra pequena vira preview", () => {
    const result = estimateReadinessForecast({
      temas: [makeTema("a", "Clinica Medica", 0.7)],
      simulados: [{ pct: 70, totalQuestions: 60 }],
      meta: { dataProva: "2026-09-13" },
      today: "2026-02-01",
    });
    expect(result.confidence).toBe(FORECAST_CONFIDENCE.LOW);
    expect(result.displayMode).toBe(FORECAST_DISPLAY_MODE.PREVIEW);
  });

  test("3 simulados e amostra minima viram forecast forte", () => {
    const result = estimateReadinessForecast({
      temas: makeTemas({ acerto: 0.84 }),
      simulados: [
        { pct: 70, data: "2026-01-01", totalQuestions: 120 },
        { pct: 74, data: "2026-01-15", totalQuestions: 120 },
        { pct: 78, data: "2026-02-01", totalQuestions: 120 },
      ],
      meta: { dataProva: "2026-09-13" },
      today: "2026-02-01",
    });
    expect(result.sample.hasMinimumForStrongNumber).toBe(true);
    expect(result.confidence).toBe(FORECAST_CONFIDENCE.HIGH);
    expect(result.displayMode).toBe(FORECAST_DISPLAY_MODE.FORECAST);
    expect(result.isActionable).toBe(true);
  });

  test("amostra pequena aumenta bandWidth", () => {
    const sampleSmall = { hasMinimumForStrongNumber: false };
    const sampleOk = { hasMinimumForStrongNumber: true };
    expect(calculateForecastBand({ nSimulados: 2, confidence: "medium", sample: sampleSmall }))
      .toBeGreaterThan(calculateForecastBand({ nSimulados: 2, confidence: "medium", sample: sampleOk }));
  });

  test("calculateForecastSampleV2 relata pendencias", () => {
    const sample = calculateForecastSampleV2({
      temas: [],
      simulados: [],
      studentMastery: null,
      today: "2026-02-01",
    });
    expect(sample.missing).toContain("1 simulado válido");
    expect(sample.hasMinimumForStrongNumber).toBe(false);
  });
});

describe("forecast Student Model e areaForecasts", () => {
  test("maestria alta aumenta currentScore", () => {
    const base = {
      simulados: [{ pct: 70, totalQuestions: 120 }],
      meta: { dataProva: "2026-09-13" },
      today: "2026-02-01",
    };
    const low = estimateReadinessForecast({ ...base, temas: makeTemas({ acerto: 0.35 }) });
    const high = estimateReadinessForecast({ ...base, temas: makeTemas({ acerto: 0.92 }) });
    expect(high.components.masteryIndex).toBeGreaterThan(low.components.masteryIndex);
    expect(high.currentScore).toBeGreaterThan(low.currentScore);
  });

  test("areaForecasts ordena maior gap ponderado primeiro", () => {
    const result = estimateAreaForecasts({
      studentMastery: {
        byArea: {
          Forte: { area: "Forte", pMastery: 0.9, confidence: "high", weight: 1 },
          Fraca: { area: "Fraca", pMastery: 0.4, confidence: "low", weight: 2 },
        },
      },
      daysUntilExam: 90,
    });
    expect(result[0].area).toBe("Fraca");
    expect(result[0].reasons).toContain("baixa_maestria_projetada");
    expect(result[0].reasons).toContain("baixa_confianca_da_estimativa");
  });
});

describe("forecast monotonicidade e seguranca", () => {
  test("se todos os componentes melhoram, projectedScore nao cai", () => {
    const low = estimateReadinessForecast({
      temas: makeTemas({ acerto: 0.45 }),
      simulados: [{ pct: 55, totalQuestions: 120 }],
      meta: { dataProva: "2026-09-13" },
      today: "2026-02-01",
      calibration: { score: 50 },
    });
    const high = estimateReadinessForecast({
      temas: makeTemas({ acerto: 0.88 }),
      simulados: [{ pct: 72, totalQuestions: 120 }, { pct: 78, totalQuestions: 120 }],
      meta: { dataProva: "2026-09-13" },
      today: "2026-02-01",
      calibration: { score: 85 },
    });
    expect(high.projectedScore).toBeGreaterThanOrEqual(low.projectedScore);
  });

  test("adicionar simulado maior nao reduz currentScore", () => {
    const base = {
      temas: makeTemas({ acerto: 0.75 }),
      meta: { dataProva: "2026-09-13" },
      today: "2026-02-01",
    };
    const before = estimateReadinessForecast({ ...base, simulados: [{ pct: 60 }, { pct: 65 }] });
    const after = estimateReadinessForecast({ ...base, simulados: [{ pct: 60 }, { pct: 65 }, { pct: 85 }] });
    expect(after.currentScore).toBeGreaterThanOrEqual(before.currentScore);
  });

  test("sobrecarga aumenta bandWidth ou reduz confianca", () => {
    const base = {
      temas: makeTemas({ acerto: 0.82 }),
      simulados: [
        { pct: 70, totalQuestions: 120 },
        { pct: 73, totalQuestions: 120 },
        { pct: 76, totalQuestions: 120 },
      ],
      meta: { dataProva: "2026-09-13" },
      today: "2026-02-01",
    };
    const normal = estimateReadinessForecast({ ...base, operationalMode: { mode: "normal" } });
    const overload = estimateReadinessForecast({ ...base, operationalMode: { mode: "sobrecarga" } });
    expect(overload.bandWidth).toBeGreaterThanOrEqual(normal.bandWidth);
    expect(overload.risks.map((risk) => risk.code)).toContain("overload");
  });

  test("menos dias ate a prova nao aumenta timePotential", () => {
    expect(calculateTimePotential(14)).toBeLessThanOrEqual(calculateTimePotential(120));
  });

  test("forecast sempre inclui warnings de proxy e TRI para res", () => {
    const result = estimateReadinessForecast({
      temas: makeTemas(),
      simulados: [{ pct: 70 }],
      meta: { dataProva: "2026-09-13" },
      plat: "res",
      today: "2026-02-01",
    });
    expect(result.warnings).toContain("Forecast é proxy interno, não nota oficial.");
    expect(result.warnings).toContain("ENAMED/ENARE usa escala de proficiência; este modelo não estima TRI oficial.");
  });

  test("sem simulado nao retorna displayMode forecast", () => {
    const result = estimateReadinessForecast({
      temas: makeTemas(),
      simulados: [],
      meta: { dataProva: "2026-09-13" },
      today: "2026-02-01",
    });
    expect(result.displayMode).not.toBe(FORECAST_DISPLAY_MODE.FORECAST);
  });

  test("forecast nao muta inputs", () => {
    const temas = makeTemas();
    const simulados = [{ pct: 70, totalQuestions: 120 }];
    const before = JSON.stringify({ temas, simulados });
    estimateReadinessForecast({
      temas,
      simulados,
      meta: { dataProva: "2026-09-13" },
      today: "2026-02-01",
    });
    expect(JSON.stringify({ temas, simulados })).toBe(before);
  });

  test("calculateOperationalRisk reconhece modos principais", () => {
    expect(calculateOperationalRisk("normal")).toBe(0);
    expect(calculateOperationalRisk({ mode: "dados_inconsistentes" })).toBe(30);
  });
});
