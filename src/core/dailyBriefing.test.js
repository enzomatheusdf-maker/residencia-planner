import {
  buildDailyBriefing,
  canShowDailyBriefing,
  dismissDailyBriefing,
  getDailyBriefingStorageKey,
} from "./dailyBriefing";

describe("dailyBriefing", () => {
  test("gera chave por uid e data", () => {
    expect(getDailyBriefingStorageKey({ uid: "u1", env: "prod", date: "2026-06-02" }))
      .toBe("medrev:prod:user:u1:dailyBriefing:2026-06-02");
  });

  test("monta resumo com revisoes e atraso", () => {
    const briefing = buildDailyBriefing({
      state: { userName: "Ana" },
      context: { pendingCount: 8, overdueCount: 2, estimatedMinutes: 34 },
    });
    expect(briefing.reviewsToday).toBe(8);
    expect(briefing.overdueCount).toBe(2);
    expect(briefing.priority).toMatch(/Recuperar/);
  });

  test("respeita dismissal diario", () => {
    const storage = new Map();
    storage.getItem = storage.get.bind(storage);
    storage.setItem = storage.set.bind(storage);
    const key = getDailyBriefingStorageKey({ uid: "u1", env: "dev", date: "2026-06-02" });

    expect(
      canShowDailyBriefing({
        state: { onboardingDone: true, meta: { onboarding: { completed: true } } },
        context: { pendingCount: 3 },
        uid: "u1",
        env: "dev",
        date: "2026-06-02",
        storage,
      })
    ).toBe(true);

    dismissDailyBriefing(storage, key);

    expect(
      canShowDailyBriefing({
        state: { onboardingDone: true, meta: { onboarding: { completed: true } } },
        context: { pendingCount: 3 },
        uid: "u1",
        env: "dev",
        date: "2026-06-02",
        storage,
      })
    ).toBe(false);
  });
});
