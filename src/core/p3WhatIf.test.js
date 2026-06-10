import { buildP3WhatIfScenarios, isP3WhatIfOptedIn } from "./p3WhatIf";

describe("p3WhatIf", () => {
  test("fica desativado por padrao", () => {
    const result = buildP3WhatIfScenarios({
      forecast: { projectedScore: 72, bandWidth: 8 },
    });

    expect(result).toEqual({
      enabled: false,
      status: "disabled",
      scenarios: [],
      reason: "feature_flag_disabled",
    });
  });

  test("aceita opt-in por meta sem depender de ambiente", () => {
    expect(isP3WhatIfOptedIn({ meta: { featureFlags: { p3WhatIf: true } } })).toBe(true);
    expect(isP3WhatIfOptedIn({ meta: { modulos: { p3WhatIf: true } } })).toBe(true);
  });

  test("gera cenarios comparativos sem prometer nota oficial", () => {
    const result = buildP3WhatIfScenarios({
      enabled: true,
      forecast: {
        projectedScore: 72,
        bandWidth: 8,
        displayMode: "forecast",
      },
    });

    expect(result.status).toBe("ready");
    expect(result.baseScore).toBe(72);
    expect(result.scenarios).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "manter_plano", projectedScore: 72, delta: 0 }),
      expect.objectContaining({ id: "sobrecarga", projectedScore: 67, delta: -5 }),
    ]));
    expect(result.assumptions.join(" ")).toContain("nao alteram agenda");
    expect(result.warnings.join(" ")).toContain("nao estima nota oficial");
  });

  test("nao inventa cenario quando forecast ainda nao tem score", () => {
    const result = buildP3WhatIfScenarios({
      enabled: true,
      forecast: { displayMode: "collecting" },
    });

    expect(result.status).toBe("collecting");
    expect(result.scenarios).toEqual([]);
    expect(result.reason).toBe("forecast_unavailable");
  });
});
