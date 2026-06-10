import { classifyError, dominantErrorType, ERROR_TYPE, summarizeErrors } from "./errorTaxonomy";

describe("errorTaxonomy", () => {
  test("classifica erro com alta confianca como confianca mal calibrada", () => {
    expect(classifyError({ acertou: false, confianca: "alta" })).toBe(ERROR_TYPE.CONFIDENCE_MISMATCH);
  });

  test("classifica acerto com baixa confianca como chute", () => {
    expect(classifyError({ acertou: true, confianca: "baixa" })).toBe(ERROR_TYPE.GUESS);
  });

  test("classifica tempo excedido", () => {
    expect(classifyError({ tempoExcedido: true, acertou: false })).toBe(ERROR_TYPE.TIME);
  });

  test("agrupa erros por tipo", () => {
    const summary = summarizeErrors([
      { tipoErro: "lacuna", acertou: false },
      { tipoErro: "raciocinio", acertou: false },
      { tipoErro: "lacuna", acertou: false },
    ]);
    expect(summary.conteudo).toBe(2);
    expect(summary.raciocinio).toBe(1);
  });

  test("identifica tipo dominante", () => {
    const dominant = dominantErrorType([
      { tipoErro: "raciocinio", acertou: false },
      { tipoErro: "lacuna", acertou: false },
      { tipoErro: "lacuna", acertou: false },
    ]);
    expect(dominant).toBe(ERROR_TYPE.CONTENT);
  });

  test("normaliza aliases de erro clinico para a taxonomia canonica", () => {
    const summary = summarizeErrors([
      { tipoErro: "clinical_reasoning_gap", acertou: false },
      { tipoErro: "premature_closure", acertou: false },
      { tipoErro: "overconfidence", acertou: false },
      { tipoErro: "discrimination_gap", acertou: false },
    ]);

    expect(summary[ERROR_TYPE.REASONING]).toBe(2);
    expect(summary[ERROR_TYPE.CONFIDENCE_MISMATCH]).toBe(1);
    expect(summary[ERROR_TYPE.DIFFERENTIAL]).toBe(1);
  });
});
