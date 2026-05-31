import { getMentorDiagnosis, proximaAcao } from "./mentor";

function mkReview(esp, acerto, confianca = 3) {
  return { esp, acerto, confianca, completedAt: new Date().toISOString() };
}

describe("mentor upgrade smoke", () => {
  test("prioriza insight de gargalo quando area < 60%", () => {
    const done = [
      mkReview("GO", 0.5),
      mkReview("GO", 0.55),
      mkReview("CM", 0.9),
      mkReview("CM", 0.85),
      mkReview("PED", 0.8),
      mkReview("PED", 0.75),
      mkReview("CIR", 0.7),
    ];
    const diag = getMentorDiagnosis("user", [], done, {}, "res", {});
    expect(diag.insights.length).toBeGreaterThan(0);
    expect(diag.insights[0].type).toBe("gargalo");
    expect(diag.insights[0].action?.type).toBe("focar");
    expect(diag.insights[0].action?.esp).toBe("GO");
  });

  test("adiciona insight de fluencia quando ha vies_excesso", () => {
    const done = [
      mkReview("GO", 0.5, 5),
      mkReview("GO", 0.5, 5),
      mkReview("CM", 0.52, 5),
      mkReview("CM", 0.54, 5),
      mkReview("PED", 0.56, 5),
      mkReview("PED", 0.57, 5),
      mkReview("CIR", 0.58, 5),
      mkReview("CIR", 0.59, 5),
    ];
    const diag = getMentorDiagnosis("user", [], done, {}, "res", {});
    const hasFluencia = diag.insights.some((i) => i.type === "fluencia");
    expect(hasFluencia).toBe(true);
  });

  test("proximaAcao respeita ordem: fila -> gargalo -> cobertura", () => {
    const acaoFila = proximaAcao({ temas: [], pending: 3, diag: { insights: [] }, readiness: { priorityList: [] } });
    expect(acaoFila.label).toMatch(/Revisar fila/);

    const acaoGargalo = proximaAcao({
      temas: [],
      pending: 0,
      diag: { insights: [{ type: "gargalo", action: { esp: "GO" } }] },
      readiness: { priorityList: [{ area: "CM", zona: "vermelha" }] },
    });
    expect(acaoGargalo.label).toMatch(/Fortalecer GO/);

    const acaoCobertura = proximaAcao({
      temas: [{ id: "1", esp: "CM", nome: "Hipertensao" }],
      pending: 0,
      diag: { insights: [] },
      readiness: { priorityList: [{ area: "CM", zona: "vermelha" }] },
    });
    expect(acaoCobertura.label).toMatch(/Iniciar tema de alta incid/);
    expect(acaoCobertura.action?.type).toBe("study");
  });
});
