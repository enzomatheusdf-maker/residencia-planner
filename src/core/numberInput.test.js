import { readSanitizedNumber, sanitizeNumericInput } from "./numberInput";

describe("numberInput", () => {
  test("converte O e o para zero", () => {
    expect(sanitizeNumericInput("O10").text).toBe("10");
    expect(readSanitizedNumber("1o", { min: 0 })).toBe(10);
  });

  test("remove notacao cientifica e caracteres invalidos", () => {
    expect(sanitizeNumericInput("1e5", { max: 500 }).value).toBe(15);
    expect(sanitizeNumericInput("12-3.4", { allowDecimal: true, maxDecimals: 1 }).text).toBe("123.4");
  });

  test("aplica min e max preservando zero valido", () => {
    expect(readSanitizedNumber("0", { min: 0, max: 10 })).toBe(0);
    expect(readSanitizedNumber("999", { min: 0, max: 30 })).toBe(30);
  });

  test("aceita decimal apenas quando permitido", () => {
    expect(sanitizeNumericInput("85,75", { allowDecimal: true, maxDecimals: 1 }).text).toBe("85.7");
    expect(sanitizeNumericInput("85.75", { allowDecimal: false }).text).toBe("8575");
  });

  test("retorna vazio para entrada vazia", () => {
    expect(sanitizeNumericInput("-", { min: 0 }).value).toBeNull();
    expect(sanitizeNumericInput(".", { allowDecimal: true }).value).toBeNull();
  });
});
