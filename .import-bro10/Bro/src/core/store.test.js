// src/core/store.test.js
import { useStore } from "./store";

describe("Zustand Store Migration (v13 to v15)", () => {
  it("should safely merge persisted state without gamif (v13) and populate defaults", () => {
    const persistOptions = useStore.persist.getOptions();
    expect(persistOptions).toBeDefined();
    expect(persistOptions.merge).toBeDefined();

    const mockInitialState = {
      plat: "res",
      userName: "Estudante",
      meta: { dataProva: "2026-10-25", acerto: 85 },
      gamif: {
        xp: 0,
        level: 1,
        streakCurrent: 0,
        streakBest: 0,
        lastStudyDate: null,
        freezesOwned: 1,
        freezesUsedDates: [],
        recoveryOwned: 0,
        badges: [],
        graceUsedThisWeek: false,
        focusBoostActive: false,
        xpAudit: { acertos: 0, constancia: 0, outros: 0 }
      }
    };

    const mockPersistedV13 = {
      plat: "res",
      userName: "V13 User",
      meta: { dataProva: "2026-12-01", acerto: 90 },
      res: { temas: [], simulados: [], ankiLog: [], cronogramas: [] },
      vest: { temas: [], simulados: [], ankiLog: [], cronogramas: [] }
    };

    const merged = persistOptions.merge(mockPersistedV13, mockInitialState);

    expect(merged.userName).toBe("V13 User");
    expect(merged.meta.dataProva).toBe("2026-12-01");
    // Gamif should be populated from initial state since it is absent in mockPersistedV13
    expect(merged.gamif).toBeDefined();
    expect(merged.gamif.xp).toBe(0);
    expect(merged.gamif.freezesOwned).toBe(1);
    expect(merged.gamif.xpAudit).toEqual({ acertos: 0, constancia: 0, outros: 0 });
  });

  it("should safely merge persisted state with partial gamif (v14) and preserve values", () => {
    const persistOptions = useStore.persist.getOptions();
    const mockInitialState = {
      gamif: {
        xp: 0,
        level: 1,
        streakCurrent: 0,
        streakBest: 0,
        lastStudyDate: null,
        freezesOwned: 1,
        freezesUsedDates: [],
        recoveryOwned: 0,
        badges: [],
        graceUsedThisWeek: false,
        focusBoostActive: false,
        xpAudit: { acertos: 0, constancia: 0, outros: 0 }
      }
    };

    const mockPersistedV14 = {
      gamif: {
        xp: 150,
        level: 3,
        streakCurrent: 5
        // missing freezesOwned, xpAudit, etc.
      }
    };

    const merged = persistOptions.merge(mockPersistedV14, mockInitialState);

    expect(merged.gamif).toBeDefined();
    expect(merged.gamif.xp).toBe(150);
    expect(merged.gamif.level).toBe(3);
    expect(merged.gamif.streakCurrent).toBe(5);
    // Missing items should merge defaults from initial
    expect(merged.gamif.freezesOwned).toBe(1);
    expect(merged.gamif.xpAudit).toEqual({ acertos: 0, constancia: 0, outros: 0 });
  });
});
