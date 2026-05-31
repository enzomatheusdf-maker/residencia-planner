import {
  calcularDominioPrevio,
  DOMINIO_PREVIO_MIN_QUESTOES,
  DOMINIO_PREVIO_MIN_ACERTO,
} from "./domainValidation";

describe("dominio previo", () => {
  test("rejeita amostra insuficiente", () => {
    const r = calcularDominioPrevio({ acertos: 10, total: 12 });
    expect(r.valido).toBe(false);
    expect(r.status).toBe("amostra_insuficiente");
  });

  test("reprova abaixo de 80%", () => {
    const r = calcularDominioPrevio({ acertos: 11, total: 15 });
    expect(r.valido).toBe(false);
    expect(r.status).toBe("reprovado");
    expect(r.percentual).toBeLessThan(DOMINIO_PREVIO_MIN_ACERTO);
  });

  test("valida com 80-89 e agenda D7", () => {
    const r = calcularDominioPrevio({ acertos: 12, total: 15 });
    expect(r.valido).toBe(true);
    expect(r.status).toBe("validado_previo");
    expect(r.intervaloInicial).toBe(7);
    expect(r.proximaRevisao).toBeTruthy();
  });

  test("valida com 90+ e agenda D14", () => {
    const r = calcularDominioPrevio({ acertos: 18, total: 20 });
    expect(r.valido).toBe(true);
    expect(r.status).toBe("validado_previo");
    expect(r.intervaloInicial).toBe(14);
    expect(r.proximaRevisao).toBeTruthy();
  });

  test("rejeita valores invalidos", () => {
    expect(calcularDominioPrevio({ acertos: 20, total: 10 }).valido).toBe(false);
    expect(calcularDominioPrevio({ acertos: -1, total: 15 }).valido).toBe(false);
    expect(calcularDominioPrevio({ acertos: 1, total: 0 }).valido).toBe(false);
  });

  test("constante minima de questoes permanece 15", () => {
    expect(DOMINIO_PREVIO_MIN_QUESTOES).toBe(15);
  });
});
