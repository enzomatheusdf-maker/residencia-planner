import { validateStateIntegrity, validateTemaIntegrity } from "./dataIntegrity";

describe("dataIntegrity", () => {
  test("detecta tema sem id/nome/rev", () => {
    const result = validateTemaIntegrity({}, "res.temas[0]");
    expect(result.criticals.length).toBeGreaterThan(0);
  });

  test("aceita estado simples bem formado", () => {
    const result = validateStateIntegrity({
      ownerUid: "u1",
      res: { temas: [{ id: "t1", nome: "Cardio", rev: { d0: { date: "2026-06-02", acerto: 0.8 } } }] },
      vest: { temas: [] },
    });
    expect(result.valid).toBe(true);
    expect(result.summary.criticalCount).toBe(0);
  });

  test("marca warning para dominio previo incoerente", () => {
    const result = validateStateIntegrity({
      res: { temas: [{ id: "t1", nome: "Cardio", rev: { d0: {} }, dominioPrevio: { validado: true, primeiraRevisao: "d1" } }] },
      vest: { temas: [] },
    });
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
