import { importMedrevBackup, validateMedrevBackup } from "./backup";

function makeBackup(overrides = {}) {
  return {
    version: "reviewflow-v6-backup",
    schema: "medrev-backup-v1",
    ownerUid: "uid-a",
    meta: {},
    res: { temas: [] },
    vest: { temas: [] },
    ...overrides,
  };
}

describe("backup", () => {
  test("aceita backup minimo bem formado", () => {
    const result = validateMedrevBackup(makeBackup());
    expect(result.valid).toBe(true);
    expect(result.summary.temas).toBe(0);
  });

  test("rejeita shape invalido antes de importar", () => {
    const result = validateMedrevBackup(makeBackup({ ownerUid: 123, res: [] }));
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/ownerUid|res/);
  });

  test("importMedrevBackup nao gera patch para backup malformado", () => {
    const result = importMedrevBackup(makeBackup({ meta: [] }));
    expect(result.ok).toBe(false);
    expect(result.patch).toBeNull();
  });
});
