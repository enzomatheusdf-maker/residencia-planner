import { 
  recalcAfterMark, 
  nextInterval, 
  normalizeTema, 
  todayStr, 
  addDays, 
  diffDays,
  STEPS
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
    expect(normalized.rev.d1).toBeDefined();
    expect(normalized.rev.d1.done).toBe(false);
    expect(normalized.rev.d21).toBeDefined();
    expect(normalized.rev.d21.done).toBe(false);
  });

  test("recalcAfterMark with rating again reschedules same step for tomorrow", () => {
    const initialRev = {
      d0: { date: "2026-05-29", done: false, acerto: null, questoes: null, S: 1.0 },
      d1: { date: "2026-05-30", done: false, acerto: null, questoes: null, S: 2.0 }
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
  });

  test("recalcAfterMark with rating good schedules next step in the future", () => {
    const initialRev = {
      d0: { date: todayStr(), done: false, acerto: null, S: 1.0 },
      d1: { date: addDays(todayStr(), 1), done: false, acerto: null, S: 2.0 }
    };

    // Simulated 90% accuracy -> rating = "good"
    const newRev = recalcAfterMark(initialRev, "d0", 0.9);

    // d0 remains unchanged or updated stability
    expect(newRev.d0.S).toBeGreaterThanOrEqual(1.0);
    // Next step (d1) date should be shifted in the future
    expect(newRev.d1.date > todayStr()).toBe(true);
  });
});
