// src/core/userState.test.js
import { getUserState } from "./userState";

describe("userState - getUserState", () => {
  test("returns 'new' for recently created user with no sessions", () => {
    const state = getUserState("2026-05-28", [], "2026-05-30");
    expect(state).toBe("new");
  });

  test("returns 'new' for recently created user with less than 3 sessions", () => {
    const state = getUserState("2026-05-25", ["2026-05-26", "2026-05-27"], "2026-05-30");
    expect(state).toBe("new");
  });

  test("returns 'dormant' if user was created 15 days ago and has no sessions", () => {
    const state = getUserState("2026-05-15", [], "2026-05-30");
    expect(state).toBe("dormant");
  });

  test("returns 'dormant' if last session was 15 days ago", () => {
    const state = getUserState("2026-05-01", ["2026-05-10", "2026-05-15"], "2026-05-30");
    expect(state).toBe("dormant");
  });

  test("returns 'at_risk' if user is inactive between 7 and 13 days", () => {
    const state = getUserState("2026-05-01", ["2026-05-10", "2026-05-22"], "2026-05-30");
    expect(state).toBe("at_risk");
  });

  test("returns 'resurrected' if user had a 7+ day gap and returned in past 48h", () => {
    // Gap of 10 days between first and second session, last session was yesterday (29th)
    const state = getUserState("2026-05-01", ["2026-05-05", "2026-05-29"], "2026-05-30");
    expect(state).toBe("resurrected");
  });

  test("returns 'current' for active regular user", () => {
    const state = getUserState("2026-05-01", ["2026-05-27", "2026-05-28", "2026-05-29"], "2026-05-30");
    expect(state).toBe("current");
  });
});
