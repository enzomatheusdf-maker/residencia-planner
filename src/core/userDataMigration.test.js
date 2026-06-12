import {
  detectLegacyGlobalStore,
  backupLegacyGlobalStore,
  migrateLegacyStoreToUserScope,
  clearLegacyGlobalStoreAfterConfirm,
} from "./userDataMigration";

describe("userDataMigration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("detecta store global legada", () => {
    localStorage.setItem("reviewflow-v6", JSON.stringify({ state: { userName: "Alice" } }));
    const found = detectLegacyGlobalStore();
    expect(found.found).toBe(true);
    expect(found.key).toBe("reviewflow-v6");
  });

  test("gera backup do payload legado", () => {
    localStorage.setItem("reviewflow-v6", "{\"state\":{\"userName\":\"Alice\"}}");
    const backup = backupLegacyGlobalStore();
    expect(backup.ok).toBe(true);
    expect(backup.backup.key).toBe("reviewflow-v6");
    expect(backup.backup.payload).toContain("Alice");
  });

  test("nao migra sem confirmacao explicita", () => {
    localStorage.setItem("reviewflow-v6", "{\"state\":{\"res\":{}}}");
    const result = migrateLegacyStoreToUserScope("uid-a");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("confirmation_required");
  });

  test("migra para chave por uid quando confirmado", () => {
    localStorage.setItem("reviewflow-v6", "{\"state\":{\"res\":{}}}");
    const result = migrateLegacyStoreToUserScope("uid-a", { confirm: true, env: "prod" });
    expect(result.ok).toBe(true);
    expect(result.to).toBe("medrev:prod:user:uid-a:store");
    expect(localStorage.getItem(result.to)).toContain("\"state\"");
  });

  test("bloqueia migracao de payload legado invalido", () => {
    localStorage.setItem("reviewflow-v6", "not-json");
    const result = migrateLegacyStoreToUserScope("uid-a", { confirm: true, env: "prod" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid_legacy_store");
    expect(result.migrated).toBe(false);
  });

  test("nao sobrescreve escopo destino existente sem overwrite", () => {
    localStorage.setItem("reviewflow-v6", "{\"state\":{\"res\":{\"temas\":[1]}}}");
    localStorage.setItem("medrev:prod:user:uid-a:store", "{\"state\":{\"res\":{\"temas\":[2]}}}");
    const result = migrateLegacyStoreToUserScope("uid-a", { confirm: true, env: "prod" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("target_scope_already_has_data");
    expect(localStorage.getItem("medrev:prod:user:uid-a:store")).toContain("[2]");
  });

  test("limpa legado apenas com confirmacao", () => {
    localStorage.setItem("reviewflow-v6", "{}");
    const denied = clearLegacyGlobalStoreAfterConfirm();
    expect(denied.ok).toBe(false);
    expect(localStorage.getItem("reviewflow-v6")).toBe("{}");

    const cleared = clearLegacyGlobalStoreAfterConfirm({ confirm: true });
    expect(cleared.ok).toBe(true);
    expect(localStorage.getItem("reviewflow-v6")).toBeNull();
  });
});
