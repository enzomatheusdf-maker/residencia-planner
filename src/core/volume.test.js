import { scoreProntidao } from "./volume";

describe("scoreProntidao", () => {
  test("includes Anki adherence with the new weights", () => {
    const score = scoreProntidao({
      trueRetention: 80,
      acertoSimulado: 70,
      cobertura: 60,
      saldoRitmoNorm: 50,
      adesaoAnkiNorm: 100,
    });

    expect(score).toBe(70);
  });

  test("rescales weights when some signals are null", () => {
    const score = scoreProntidao({
      trueRetention: 90,
      acertoSimulado: null,
      cobertura: 60,
      saldoRitmoNorm: null,
      adesaoAnkiNorm: 70,
    });

    expect(score).toBe(78);
  });
});
