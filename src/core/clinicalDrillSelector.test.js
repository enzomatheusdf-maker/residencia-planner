import { selectNextDrill } from "./clinicalDrillSelector";

const scripts = [
  { id: "apendicite-classica", area: "Cirurgia", subtopic: "Abdome agudo", tema: "Apendicite" },
  { id: "dor-toracica-coronariana", area: "Clínica Médica", subtopic: "Cardiologia", tema: "SCA" },
  { id: "atencao-primaria-saude", area: "Preventiva", subtopic: "APS", tema: "APS" },
];

describe("selectNextDrill", () => {
  test("script novo ou de baixa maestria entra pela fundacao Drill 0", () => {
    const next = selectNextDrill({
      scripts,
      casosProgresso: {
        "apendicite-classica": { vistos: 1, fase2Acerto: 90, proximaData: "2026-06-20" },
        "dor-toracica-coronariana": { vistos: 1, mastery: 0.8, proximaData: "2026-06-20" },
      },
      today: "2026-06-06",
    });

    expect(next.scriptId).toBe("atencao-primaria-saude");
    expect(next.drillType).toBe("drill0");
    expect(next.phase).toBe("script");
  });

  test("reencontro vencido aumenta prioridade contra script ainda nao vencido", () => {
    const next = selectNextDrill({
      scripts: scripts.slice(0, 2),
      casosProgresso: {
        "apendicite-classica": { vistos: 2, mastery: 0.62, proximaData: "2026-06-01" },
        "dor-toracica-coronariana": { vistos: 2, mastery: 0.62, proximaData: "2026-06-20" },
      },
      today: "2026-06-06",
    });

    expect(next.scriptId).toBe("apendicite-classica");
    expect(next.due).toBe(true);
  });

  test("ancoragem e fechamento precoce direcionam para Drill C", () => {
    const next = selectNextDrill({
      scripts: [scripts[0]],
      casosProgresso: {
        "apendicite-classica": { vistos: 2, mastery: 0.7, proximaData: "2026-06-01" },
      },
      learningEvents: [
        { source: "clinical_drill", scriptId: "apendicite-classica", dominantError: "premature_closure" },
      ],
      today: "2026-06-06",
    });

    expect(next.drillType).toBe("drillC");
    expect(next.phase).toBe("caso");
  });

  test("erro de calibracao ou excesso de confianca direciona para Drill A", () => {
    const next = selectNextDrill({
      scripts: [scripts[1]],
      casosProgresso: {
        "dor-toracica-coronariana": { vistos: 2, mastery: 0.7, proximaData: "2026-06-01" },
      },
      learningEvents: [
        { source: "clinical_drill", scriptId: "dor-toracica-coronariana", dominantError: "overconfidence" },
      ],
      today: "2026-06-06",
    });

    expect(next.drillType).toBe("drillA");
  });
});
