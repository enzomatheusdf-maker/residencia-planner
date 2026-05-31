import { matchesArea, getReadinessData } from "./readiness";

describe("Readiness Core Unification Logic Test Suite", () => {
  test("matchesArea correctly maps student specialty to target exam areas", () => {
    expect(matchesArea("Cirurgia", "Cirurgia Geral")).toBe(true);
    expect(matchesArea("GO", "Ginecologia e Obstetrícia")).toBe(true);
    expect(matchesArea("Preventiva", "Medicina Preventiva")).toBe(true);
    expect(matchesArea("Preventiva", "saúde coletiva")).toBe(true);
    expect(matchesArea("Exatas", "Matemática")).toBe(true);
    expect(matchesArea("Pediatria", "Pediatria")).toBe(true);
    expect(matchesArea("Cirurgia", "Pediatria")).toBe(false);
  });

  test("getReadinessData generates correct readiness object", () => {
    const temas = [
      {
        nome: "Apendicite",
        esp: "Cirurgia",
        unstarted: false,
        rev: {
          d0: { done: true, date: "2026-05-20", acerto: 0.8, S: 1 },
          d1: { done: true, date: "2026-05-21", acerto: 0.9, S: 2 },
          d3: { done: false, date: "2026-05-29", acerto: null }
        }
      },
      {
        nome: "HAS",
        esp: "Clínica Médica",
        unstarted: false,
        rev: {
          d0: { done: true, date: "2026-05-20", acerto: 0.7, S: 1 },
          d1: { done: false, date: "2026-05-29", acerto: null }
        }
      },
      {
        nome: "Tema Unstarted",
        esp: "Preventiva",
        unstarted: true,
        rev: {
          d0: { done: false, date: "2026-05-29", acerto: null }
        }
      }
    ];

    const simulados = [
      {
        id: 1,
        data: "2026-05-25",
        total: 50,
        acertos: 35,
        pct: 70,
        questoesErradas: [
          { num: 5, esp: "Cirurgia", tipoErro: "lacuna" },
          { num: 10, esp: "Clínica Médica", tipoErro: "descuido" },
          { num: 12, esp: "Cirurgia", tipoErro: "lacuna" }
        ]
      }
    ];

    const meta = {
      provasAlvo: ["SES-DF"],
      metaQuestoesDia: 0,
      metaQuestoesTotal: 100
    };

    const data = getReadinessData({ temas, simulados, meta, plat: "res" });
    
    // Coverage is startedTopics / totalTopics = 2 / 3 = 67%
    expect(data.cobertura).toBe(67);
    
    // Mock exam average
    expect(data.acertoSimulado).toBe(70);
    
    // Target exam details
    expect(data.targetProva).toBe("SES-DF");
    expect(data.examData.banca).toBe("IADES");
    
    // Error counts
    expect(data.totalErrors).toBe(3);
    expect(data.errorCounts.lacuna).toBe(2);
    expect(data.errorCounts.descuido).toBe(1);
    expect(data.dominantError).toBe("lacuna");
  });
});
