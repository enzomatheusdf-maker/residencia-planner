import {
  canonicalArea,
  getEnamedIntel,
  calcPreparoEnamed,
  topHotness,
  getEnamedAction,
} from "./enamedIntel";

const rev = (acerto) => ({ d0: { done: true, acerto } });

describe("enamedIntel", () => {
  test("normaliza áreas canônicas", () => {
    expect(canonicalArea("Cirurgia Geral")).toBe("Cirurgia");
    expect(canonicalArea("Ginecologia e Obstetrícia")).toBe("GO");
    expect(canonicalArea("Medicina de Família")).toBe("Preventiva");
    expect(canonicalArea("Clínica Médica")).toBe("Clínica Médica");
  });

  test("gera lista com 5 áreas e gargalo", () => {
    const temas = [
      { esp: "Clínica Médica", tema: "Cardiologia", unstarted: false, rev: rev(0.90) },
      { esp: "Cirurgia", tema: "Abdome agudo", unstarted: false, rev: rev(0.40) },
      { esp: "GO", tema: "Pré-natal", unstarted: true, rev: {} },
      { esp: "Pediatria", tema: "Puericultura", unstarted: true, rev: {} },
      { esp: "Preventiva", tema: "APS", unstarted: false, rev: rev(0.75) },
    ];

    const intel = getEnamedIntel(temas);
    expect(intel.lista).toHaveLength(5);
    expect(intel.gargalo).toBeTruthy();
    expect(intel.areas.Cirurgia.retencao).toBe(40);
    expect(intel.areas.Cirurgia.cobertura).toBe(100);
  });

  test("preparo ENAMED retorna null sem dados", () => {
    expect(calcPreparoEnamed([])).toBeNull();
  });

  test("preparo ENAMED retorna número quando há dados", () => {
    const temas = [
      { esp: "Clínica Médica", tema: "Cardiologia", unstarted: false, rev: rev(0.80) },
      { esp: "Preventiva", tema: "APS", unstarted: false, rev: rev(0.70) },
    ];
    const score = calcPreparoEnamed(temas);
    expect(typeof score).toBe("number");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test("topHotness retorna subtópicos ordenados", () => {
    const top = topHotness("Clínica Médica", 3);
    expect(top).toHaveLength(3);
    expect(top[0].peso).toBeGreaterThanOrEqual(top[1].peso);
  });

  test("gera ação interpretável", () => {
    const intel = getEnamedIntel([
      { esp: "Cirurgia", tema: "Apendicite", unstarted: false, rev: rev(0.50) },
    ]);
    const action = getEnamedAction(intel);
    expect(action.title).toMatch(/Foque|Comece/);
  });
});
