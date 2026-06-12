import {
  validateBackupFileShape,
  validateCalendarCsvRaw,
  validateCalendarImportJson,
  validatePersistedStateShape,
} from "./boundarySchemas";

describe("boundarySchemas", () => {
  test("valida CSV bruto somente como texto nao vazio", () => {
    expect(validateCalendarCsvRaw("semana,area,tema\nSemana 1,CARDIO,IAM").valid).toBe(true);
    expect(validateCalendarCsvRaw("").valid).toBe(false);
    expect(validateCalendarCsvRaw({ raw: true }).valid).toBe(false);
  });

  test("valida JSON de calendario como lista de itens com tema", () => {
    expect(validateCalendarImportJson([{ temaOriginal: "Hipertensao", areaOriginal: "CARDIOLOGIA" }]).valid).toBe(true);
    expect(validateCalendarImportJson([]).valid).toBe(false);
    expect(validateCalendarImportJson([{ areaOriginal: "CARDIOLOGIA" }]).valid).toBe(false);
  });

  test("valida shape minimo de backup antes da integridade profunda", () => {
    const valid = validateBackupFileShape({
      version: "reviewflow-v6-backup",
      schema: "medrev-backup-v1",
      meta: {},
      res: { temas: [] },
      vest: { temas: [] },
    });

    expect(valid.valid).toBe(true);
    expect(validateBackupFileShape({ version: "reviewflow-v6-backup", res: [], vest: {} }).valid).toBe(false);
  });

  test("valida payload persistido do Zustand ou estado direto", () => {
    expect(validatePersistedStateShape({ state: { res: {}, vest: {} }, version: 0 }).valid).toBe(true);
    expect(validatePersistedStateShape({ res: {}, vest: {} }).valid).toBe(true);
    expect(validatePersistedStateShape(null).valid).toBe(false);
  });
});
