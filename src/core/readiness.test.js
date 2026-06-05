import { getReadinessData } from "./readiness";

function makeTema(id, area, acerto = 0.8, date = "2026-01-01") {
  return {
    id,
    nome: `Tema ${id}`,
    esp: area,
    d0: date,
    rev: {
      d0: { done: true, acerto, questoes: 40, date },
    },
  };
}

describe("readiness forecast integration", () => {
  test("getReadinessData mantem score e range legados", () => {
    const result = getReadinessData({
      temas: [
        makeTema("a", "Clinica Medica", 0.8),
        makeTema("b", "Cirurgia", 0.7),
      ],
      simulados: [{ pct: 76, totalQuestions: 100 }],
      meta: { dataProva: "2026-09-13" },
      plat: "res",
    });

    expect(typeof result.score).toBe("number");
    expect(result.range).toEqual([
      Math.max(0, result.score - 6),
      Math.min(100, result.score + 6),
    ]);
  });

  test("getReadinessData retorna forecast como campo novo", () => {
    const result = getReadinessData({
      temas: [makeTema("a", "Clinica Medica", 0.8)],
      simulados: [{ pct: 76, totalQuestions: 100 }],
      meta: { dataProva: "2026-09-13" },
      plat: "res",
    });

    expect(result.forecast).toEqual(expect.objectContaining({
      version: "forecast_v1",
      currentScore: expect.any(Number),
      projectedScore: expect.any(Number),
      warnings: expect.arrayContaining(["Forecast é proxy interno, não nota oficial."]),
    }));
  });

  test("getReadinessData nao quebra se forecast nao tiver dados", () => {
    const result = getReadinessData({
      temas: [],
      simulados: [],
      meta: {},
      plat: "res",
    });

    expect(result.score).toBe(0);
    expect(result.forecast).toEqual(expect.objectContaining({
      version: "forecast_v1",
      currentScore: null,
      projectedScore: null,
      displayMode: "collecting",
    }));
  });
});
