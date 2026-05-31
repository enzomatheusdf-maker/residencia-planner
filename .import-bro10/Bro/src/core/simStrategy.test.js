// src/core/simStrategy.test.js
import { getSimRecommendation, getResultActions, diffDays, todayStr } from "./simStrategy";

describe("simStrategy - diffDays & todayStr", () => {
  test("diffDays should calculate correct day difference", () => {
    expect(diffDays("2026-05-30", "2026-06-09")).toBe(10);
    expect(diffDays("2026-05-30", "2026-05-20")).toBe(-10);
    expect(diffDays("invalid", "2026-05-30")).toBe(0);
  });

  test("todayStr should return YYYY-MM-DD", () => {
    const today = todayStr();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("simStrategy - getSimRecommendation", () => {
  test("returns setup required if no dataProva provided", () => {
    const rec = getSimRecommendation(null);
    expect(rec.tipo).toBe("Configuração Pendente");
    expect(rec.frequenciaRecomendada).toBe("—");
  });

  test("returns Baseline recommendation when no simulados performed yet", () => {
    const dataProva = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 100 days from now
    const rec = getSimRecommendation(dataProva, []);
    expect(rec.tipo).toBe("Baseline");
    expect(rec.titulo).toBe("Simulado Baseline");
    expect(rec.frequenciaRecomendada).toBe("A cada 15 dias"); // since 100 days is <= 120 days
  });

  test("returns Stamina recommendation for mid-term preparation", () => {
    const dataProva = new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 150 days from now
    const rec = getSimRecommendation(dataProva, [{ id: 1, name: "Simulado 1", questoesErradas: [] }]);
    expect(rec.tipo).toBe("Stamina");
    expect(rec.frequenciaRecomendada).toBe("A cada 30 dias");
  });

  test("returns Confirmação recommendation when less than 30 days left", () => {
    const dataProva = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 25 days from now
    const rec = getSimRecommendation(dataProva, [{ id: 1, name: "Simulado 1", questoesErradas: [] }]);
    expect(rec.tipo).toBe("Confirmação");
    expect(rec.frequenciaRecomendada).toBe("A cada 7 dias");
  });

  test("returns Foco Revisão / Sem novos simulados when extremely close to exam", () => {
    const dataProva = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 5 days from now
    const rec = getSimRecommendation(dataProva, [{ id: 1, name: "Simulado 1", questoesErradas: [] }]);
    expect(rec.frequenciaRecomendada).toBe("Sem novos simulados (Foco em erros)");
  });

  test("lists top 3 specialities with errors as focus areas", () => {
    const dataProva = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const simulados = [
      {
        questoesErradas: [
          { esp: "Cirurgia" },
          { esp: "Cirurgia" },
          { esp: "Pediatria" },
          { esp: "Ginecologia" },
          { esp: "Ginecologia" },
          { esp: "Ginecologia" },
          { esp: "Clínica Médica" }
        ]
      }
    ];
    const rec = getSimRecommendation(dataProva, simulados);
    expect(rec.focoEspecialidades).toEqual(["Ginecologia", "Cirurgia", "Pediatria"]);
  });
});

describe("simStrategy - getResultActions", () => {
  test("returns empty list if no errors", () => {
    expect(getResultActions([])).toEqual([]);
    expect(getResultActions(null)).toEqual([]);
  });

  test("returns structured diagnostic recommendations based on error frequencies", () => {
    const errors = [
      { tipoErro: "lacuna" },
      { tipoErro: "lacuna" },
      { tipoErro: "descuido" },
      { tipoErro: "raciocinio" }
    ];

    const actions = getResultActions(errors);
    expect(actions.length).toBe(3);

    // sorted descending by percentage
    expect(actions[0].tipoErro).toBe("lacuna");
    expect(actions[0].pct).toBe(50);

    expect(actions[1].pct).toBe(25);
    expect(actions[2].pct).toBe(25);

    expect(actions.some(a => a.tipoErro === "descuido")).toBe(true);
    expect(actions.some(a => a.tipoErro === "raciocinio")).toBe(true);
  });
});
