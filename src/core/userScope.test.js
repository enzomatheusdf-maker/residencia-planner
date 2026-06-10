import {
  normalizeUid,
  assertUid,
  getAppEnvironment,
  getUserScopedStorageKey,
  getAnonymousStorageKey,
  getOrCreateAnonymousSessionId,
  getUserRootPath,
  getUserStatePath,
  isSameUserScope,
  assertOwnerUidMatchesScope,
} from "./userScope";

describe("userScope", () => {
  test("normaliza uid removendo espacos", () => {
    expect(normalizeUid("  abc  ")).toBe("abc");
    expect(normalizeUid(null)).toBe("");
  });

  test("assertUid falha com uid ausente", () => {
    expect(() => assertUid("")).toThrow("Missing authenticated user uid");
  });

  test("gera chave local por uid", () => {
    const key = getUserScopedStorageKey("u123", "prod");
    expect(key).toBe("medrev:prod:user:u123:store");
  });

  test("gera chave anonima com fallback de sessao", () => {
    const key = getAnonymousStorageKey("", "dev");
    expect(key).toMatch(/^medrev:dev:anonymous:anon-[a-z0-9]+-[a-z0-9]+:store$/);
    expect(getAnonymousStorageKey("", "dev")).toBe(key);
  });

  test("uids diferentes geram escopos diferentes", () => {
    expect(getUserScopedStorageKey("u1", "prod")).not.toBe(getUserScopedStorageKey("u2", "prod"));
  });

  test("cria sessao anonima persistida em sessionStorage", () => {
    const sid1 = getOrCreateAnonymousSessionId("test", sessionStorage);
    const sid2 = getOrCreateAnonymousSessionId("test", sessionStorage);
    expect(sid1).toBeTruthy();
    expect(sid1).toBe(sid2);
  });

  test("paths firebase incluem uid", () => {
    expect(getUserRootPath("u123")).toEqual(["usuarios", "u123"]);
    expect(getUserStatePath("u123")).toEqual(["usuarios", "u123"]);
  });

  test("compara escopo de usuario", () => {
    expect(isSameUserScope("abc", "abc")).toBe(true);
    expect(isSameUserScope("abc", "def")).toBe(false);
    expect(isSameUserScope("", "def")).toBe(false);
  });

  test("valida ownerUid contra escopo ativo", () => {
    expect(assertOwnerUidMatchesScope("abc", "abc")).toBe("abc");
    expect(assertOwnerUidMatchesScope("", "abc")).toBe("abc");
    expect(() => assertOwnerUidMatchesScope("abc", "def", "remote")).toThrow("Owner scope mismatch");
  });

  test("ambiente retorna token util", () => {
    const env = getAppEnvironment();
    expect(typeof env).toBe("string");
    expect(env.length).toBeGreaterThan(0);
  });
});
