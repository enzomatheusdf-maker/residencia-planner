import { compareReadinessToSimulado, createReadinessSnapshot } from "./readinessValidation";

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
});
