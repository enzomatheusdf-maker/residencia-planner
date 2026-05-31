import { CASOS_CLINICOS } from "./casosClinicos";

describe("casosClinicos schema", () => {
  test("lista possui ids unicos", () => {
    const ids = CASOS_CLINICOS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("cada caso possui campos obrigatorios", () => {
    CASOS_CLINICOS.forEach((caso) => {
      expect(caso.id).toBeTruthy();
      expect(caso.area).toBeTruthy();
      expect(caso.subarea).toBeTruthy();
      expect(caso.tema).toBeTruthy();
      expect(caso.vinheta).toBeTruthy();
      expect(caso.script).toBeTruthy();
      expect(caso.script.enabling).toBeTruthy();
      expect(caso.script.fault).toBeTruthy();
      expect(caso.script.consequences).toBeTruthy();
      expect(caso.script.management).toBeTruthy();
      expect(Array.isArray(caso.diferenciais)).toBe(true);
      expect(caso.diferenciais.length).toBeGreaterThan(0);
      expect(Array.isArray(caso.workup)).toBe(true);
      expect(caso.workup.length).toBeGreaterThan(0);
      expect(caso.diagnosticoFinal).toBeTruthy();
      expect(caso.justificativa).toBeTruthy();
      expect(Array.isArray(caso.sct)).toBe(true);
      expect(caso.anamnese).toBeTruthy();
      expect(caso.anamnese.queixa).toBeTruthy();
      expect(Array.isArray(caso.anamnese.roteiro)).toBe(true);
      expect(Array.isArray(caso.anamnese.redFlags)).toBe(true);
    });
  });
});
