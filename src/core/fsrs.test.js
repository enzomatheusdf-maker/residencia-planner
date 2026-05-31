import { 
  buildRev,
  recalcAfterMark, 
  nextInterval, 
  normalizeTema, 
  todayStr, 
  addDays, 
  diffDays,
  STEPS,
  getFaseItem,
  getWorkloadProjection,
  getAreaPrior,
  getRetencaoArea,
  updateDifficulty
} from "./fsrs";

describe("FSRS Core Logic Test Suite", () => {
  test("todayStr returns YYYY-MM-DD format", () => {
    const today = todayStr();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("addDays correctly shifts date", () => {
    const start = "2026-05-29";
    expect(addDays(start, 0)).toBe("2026-05-29");
    expect(addDays(start, 1)).toBe("2026-05-30");
    expect(addDays(start, 5)).toBe("2026-06-03");
  });

  test("diffDays computes correct intervals", () => {
    expect(diffDays("2026-05-29", "2026-05-30")).toBe(1);
    expect(diffDays("2026-05-29", "2026-06-03")).toBe(5);
    expect(diffDays("2026-06-03", "2026-05-29")).toBe(-5);
  });

  test("normalizeTema fills in missing steps for legacy topics", () => {
    const legacyTema = {
      nome: "Tema Antigo",
      d0: "2026-05-20",
      rev: {
        d0: { done: true, date: "2026-05-20", acerto: 0.8 }
      }
    };

    const normalized = normalizeTema(legacyTema);
    expect(normalized.rev.d0.done).toBe(true);
    expect(normalized.rev.d0.D).toBe(getAreaPrior(legacyTema.esp).difBase);
    expect(normalized.rev.d1).toBeDefined();
    expect(normalized.rev.d1.done).toBe(false);
    expect(normalized.rev.d1.D).toBe(getAreaPrior(legacyTema.esp).difBase);
    expect(normalized.rev.d21).toBeDefined();
    expect(normalized.rev.d21.done).toBe(false);
  });

  test("buildRev initializes Difficulty D from area prior", () => {
    const rev = buildRev("2026-05-29", "Preventiva");
    expect(rev.d0.D).toBeCloseTo(0.45);
    expect(rev.d21.D).toBeCloseTo(0.45);
  });

  test("updateDifficulty raises D on errors and lowers D on easy answers", () => {
    expect(updateDifficulty(0.5, 0.4)).toBeCloseTo(0.65);
    expect(updateDifficulty(0.5, 1.0)).toBeCloseTo(0.42);
  });

  test("recalcAfterMark with rating again reschedules same step for tomorrow", () => {
    const initialRev = {
      d0: { date: "2026-05-29", done: false, acerto: null, questoes: null, S: 1.0, D: 0.55 },
      d1: { date: "2026-05-30", done: false, acerto: null, questoes: null, S: 2.0, D: 0.55 }
    };

    // Simulated 40% accuracy -> rating = "again"
    const newRev = recalcAfterMark(initialRev, "d0", 0.4);

    // Should keep d0.done as false
    expect(newRev.d0.done).toBe(false);
    // Should reschedule d0 to tomorrow
    const tomorrow = addDays(todayStr(), 1);
    expect(newRev.d0.date).toBe(tomorrow);
    // Stability S should decay (be lower than initial 1.0)
    expect(newRev.d0.S).toBeLessThan(1.0);
    expect(newRev.d0.D).toBeGreaterThan(0.55);
  });

  test("recalcAfterMark with rating good schedules next step in the future", () => {
    const initialRev = {
      d0: { date: todayStr(), done: false, acerto: null, S: 1.0, D: 0.55 },
      d1: { date: addDays(todayStr(), 1), done: false, acerto: null, S: 2.0, D: 0.55 }
    };

    // Simulated 90% accuracy -> rating = "good"
    const newRev = recalcAfterMark(initialRev, "d0", 0.9);

    // d0 remains unchanged or updated stability
    expect(newRev.d0.S).toBeGreaterThanOrEqual(1.0);
    expect(newRev.d0.D).toBeLessThan(0.55);
    // Next step (d1) date should be shifted in the future
    expect(newRev.d1.date > todayStr()).toBe(true);
  });

  test("nextInterval anchors fixed offsets to a 15 percent band", () => {
    expect(nextInterval(30, 7, 0.90, 180, 0.4)).toBe(8);
    expect(nextInterval(1, 7, 0.90, 180, 0.8)).toBe(6);
    expect(nextInterval(10, 1, 0.90, 180, 0.5)).toBe(1);
  });

  test("recalcAfterMark keeps D7 near fixed offset after D4 performance", () => {
    const today = todayStr();
    const initialRev = {
      d4: { date: today, done: true, S: 4, D: 0.55 },
      d7: { date: addDays(today, 7), done: false, S: 7, D: 0.55 }
    };

    const high = recalcAfterMark(initialRev, "d4", 1.0, 0.90, 180, "GO");
    const highInterval = diffDays(today, high.d7.date);
    expect(highInterval).toBeGreaterThanOrEqual(6);
    expect(highInterval).toBeLessThanOrEqual(8);

    const low = recalcAfterMark(initialRev, "d4", 0.60, 0.90, 180, "GO");
    expect(diffDays(today, low.d7.date)).toBe(6);
  });

  test("getRetencaoArea raises Preventiva target retention slightly", () => {
    expect(getRetencaoArea("Preventiva", 0.90)).toBeCloseTo(0.91);
    expect(getRetencaoArea("Cirurgia", 0.90)).toBeCloseTo(0.897);
  });

  test("getFaseItem returns aquisicao for undone D0 step and recuperacao otherwise", () => {
    const temaUndoneD0 = {
      rev: {
        d0: { done: false }
      }
    };
    const temaDoneD0 = {
      rev: {
        d0: { done: true }
      }
    };

    expect(getFaseItem(temaUndoneD0, "d0")).toBe("aquisicao");
    expect(getFaseItem(temaDoneD0, "d0")).toBe("recuperacao");
    expect(getFaseItem(temaUndoneD0, "d1")).toBe("recuperacao");
  });

  test("getWorkloadProjection returns correct workloads", () => {
    const today = todayStr();
    const mockTemas = [
      {
        unstarted: false,
        rev: {
          d0: { done: true, date: today },
          d1: { done: false, date: today }
        }
      },
      {
        unstarted: false,
        rev: {
          d0: { done: false, date: addDays(today, 2) }
        }
      },
      {
        unstarted: true,
        rev: {
          d0: { done: false, date: today }
        }
      }
    ];

    const proj = getWorkloadProjection(mockTemas, 3);
    expect(proj[today]).toBe(1); // Only active non-done scheduled for today or earlier
    expect(proj[addDays(today, 1)]).toBe(0);
    expect(proj[addDays(today, 2)]).toBe(1);
  });

  test("recalcAfterMark with D1 dynamic acertos recalcs correctly", () => {
    const today = todayStr();
    const initialRev = {
      d1: { date: today, done: false, S: 1.0, D: 0.5 }
    };

    // 1. Excellent (0 items forgot -> acerto = 1.0)
    const rev1 = recalcAfterMark(initialRev, "d1", 1.0);
    expect(rev1.d1.S).toBeGreaterThanOrEqual(1.0);
    expect(rev1.d1.D).toBeLessThan(0.5);

    // 2. Insufficient (3+ items forgot -> acerto = 0.40)
    const rev2 = recalcAfterMark(initialRev, "d1", 0.40);
    expect(rev2.d1.done).toBe(false); // Should reset/reschedule for tomorrow
    expect(rev2.d1.date).toBe(addDays(today, 1));
    expect(rev2.d1.S).toBeLessThan(1.0);
    expect(rev2.d1.D).toBeGreaterThan(0.5);
  });
});
