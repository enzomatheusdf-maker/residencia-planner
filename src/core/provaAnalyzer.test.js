import { analyzeProvaEnamed, scoreAreaPriority } from "./provaAnalyzer";

describe("provaAnalyzer", () => {
  test("scoreAreaPriority cresce quando acerto cai", () => {
    const high = scoreAreaPriority({ acertos: 9, total: 10, pesoBlueprint: 0.2 });
    const low = scoreAreaPriority({ acertos: 4, total: 10, pesoBlueprint: 0.2 });
    expect(low).toBeGreaterThan(high);
  });

  test("analisa prova e ordena áreas por prioridade", () => {
    const out = analyzeProvaEnamed({
      nome: "Simulado ENAMED 01",
      total: 100,
      acertos: 72,
      areas: [
        { area: "Clínica Médica", total: 20, acertos: 18 },
        { area: "Cirurgia", total: 20, acertos: 10 },
      ],
    });

    expect(out.pctGeral).toBe(72);
    expect(out.areas[0].area).toBe("Cirurgia");
    expect(out.resumo.areaCritica).toBe("Cirurgia");
  });
});

