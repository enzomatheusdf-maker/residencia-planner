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

