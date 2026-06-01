import {
  getAuthStatusConstants,
  getInitialAuthSession,
  buildAuthSession,
  assertActiveUserScope,
  resolveAuthStatus,
} from "./authSession";

describe("authSession", () => {
  test("estado inicial fica em loading e nao hidratado", () => {
    const initial = getInitialAuthSession();
    expect(initial.status).toBe(getAuthStatusConstants().LOADING);
    expect(initial.hydrated).toBe(false);
    expect(initial.uid).toBeNull();
  });

  test("resolve status autenticado", () => {
    expect(resolveAuthStatus({ uid: "u1" })).toBe("authenticated");
    expect(resolveAuthStatus(null)).toBe("signed_out");
  });

  test("buildAuthSession deriva scope do uid", () => {
    const session = buildAuthSession({ user: { uid: "u1", email: "u1@example.com" } });
    expect(session.uid).toBe("u1");
    expect(session.status).toBe("authenticated");
    expect(session.scopeKey).toContain(":user:u1:");
  });

  test("bloqueia sync com uid divergente", () => {
    expect(() => assertActiveUserScope("u1", "u2")).toThrow("User scope mismatch");
  });

  test("permite sync quando uid coincide", () => {
    expect(assertActiveUserScope("u1", "u1")).toBe("u1");
  });
});

