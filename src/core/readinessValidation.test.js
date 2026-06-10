import {
  compareForecastToSimulado,
  compareReadinessToSimulado,
  createForecastBacktestRecord,
  createForecastSnapshot,
  createReadinessSnapshot,
  summarizeForecastBacktests,
} from "./readinessValidation";

describe("readinessValidation", () => {
  test("cria snapshot padronizado", () => {
    const snapshot = createReadinessSnapshot({ score: 74.6, plat: "vest" });
    expect(snapshot.score).toBe(75);
    expect(snapshot.plat).toBe("vest");
  });

  test("classifica alinhado/superestimado/subestimado", () => {
    expect(compareReadinessToSimulado({ score: 80 }, { pct: 77 }).status).toBe("alinhado");
    expect(compareReadinessToSimulado({ score: 90 }, { pct: 70 }).status).toBe("superestimado");
    expect(compareReadinessToSimulado({ score: 60 }, { pct: 80 }).status).toBe("subestimado");
  });

  test("retorna coletando quando faltam dados", () => {
    expect(compareReadinessToSimulado({}, {}).status).toBe("coletando");
  });

  test("compara simulado calculando percentual por acertos e total", () => {
    const result = compareReadinessToSimulado({ score: 80 }, { acertos: 72, total: 100 });
    expect(result.actual).toBe(72);
    expect(result.absoluteError).toBe(8);
    expect(result.status).toBe("superestimado");
  });

  test("cria snapshot de forecast sem prometer nota oficial", () => {
    const snapshot = createForecastSnapshot({
      forecast: {
        version: "forecast_v1",
        projectedScore: 76,
        confidence: "medium",
        displayMode: "forecast",
        band: [68, 84],
        bandWidth: 8,
      },
      plat: "res",
      recordedAt: "2026-06-10",
    });

    expect(snapshot).toMatchObject({
      score: 76,
      confidence: "medium",
      displayMode: "forecast",
      band: [68, 84],
      forecastVersion: "forecast_v1",
    });
  });

  test("compara forecast anterior com simulado real", () => {
    const comparison = compareForecastToSimulado(
      createForecastSnapshot({ forecast: { projectedScore: 72, confidence: "low" } }),
      { pct: 64 }
    );

    expect(comparison.status).toBe("superestimado");
    expect(comparison.absoluteError).toBe(8);
    expect(comparison.confidence).toBe("low");
  });

  test("cria e resume backtests de forecast", () => {
    const record = createForecastBacktestRecord({
      forecast: { projectedScore: 78, confidence: "medium", displayMode: "forecast" },
      simulado: { id: "sim-1", data: "2026-06-10", acertos: 70, total: 100 },
      plat: "res",
      recordedAt: "2026-06-10",
    });
    const summary = summarizeForecastBacktests([
      record,
      { absoluteError: 4, estimated: 74, actual: 70, status: "alinhado" },
    ]);

    expect(record).toMatchObject({
      simuladoId: "sim-1",
      estimated: 78,
      actual: 70,
      absoluteError: 8,
      status: "superestimado",
    });
    expect(summary.n).toBe(2);
    expect(summary.meanAbsoluteError).toBe(6);
    expect(summary.status).toBe("observando");
  });
});
