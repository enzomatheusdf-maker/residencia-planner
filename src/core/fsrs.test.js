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
  updateDifficulty,
  toRating,
  applyRelearningRecoveryBonus,
  appendReviewHistory
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

  test("toRating returns null for null/undefined/NaN", () => {
    expect(toRating(null)).toBeNull();
    expect(toRating(undefined)).toBeNull();
    expect(toRating("abc")).toBeNull();
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
    expect(proj[today].count).toBe(1); // Only active non-done scheduled for today or earlier
    expect(proj[addDays(today, 1)].count).toBe(0);
    expect(proj[addDays(today, 2)].count).toBe(1);
    expect(proj[today].estimatedMinutes).toBeGreaterThan(0);
  });

  test("getWorkloadProjection ignores skipped domain validation steps", () => {
    const today = todayStr();
    const temas = [
      {
        unstarted: false,
        rev: {
          d1: { done: true, skipped: true, skipReason: "dominio_previo", date: today },
          d4: { done: true, skipped: true, skipReason: "dominio_previo", date: today },
          d7: { done: false, date: today, source: "dominio_previo" },
        },
      },
    ];

    const proj = getWorkloadProjection(temas, 1);
    expect(proj[today].count).toBe(1);
    expect(proj[today].items[0].stepKey).toBe("d7");
  });

  test("recalcAfterMark advances D7 and reschedules D21 (D14 removed)", () => {
    const today = todayStr();
    const initialRev = buildRev(today, "Clínica Médica");
    const marked = {
      ...initialRev,
      d7: { ...initialRev.d7, done: true, date: today, scheduledAt: today, reviewedAt: today, acerto: 0.9 },
    };

    const updated = recalcAfterMark(marked, "d7", 0.9, 0.90, 180, "Clínica Médica");

    expect(updated.d7.S).toBeGreaterThan(0);
    expect(updated.d21.done).toBe(false);
    expect(updated.d21.date > today).toBe(true);
    expect(updated.reviewHistory.at(-1).stepKey).toBe("d7");
    // O passo D14 não existe mais no ciclo construído por buildRev.
    expect(updated.d14).toBeUndefined();
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

  test("D7 with again common repeats D7 tomorrow", () => {
    const today = todayStr();
    const initialRev = buildRev(today, "GO");
    const marked = {
      ...initialRev,
      d7: {
        ...initialRev.d7,
        done: true,
        reviewedAt: today,
        scheduledAt: addDays(today, -1),
        acerto: 0.4,
      },
    };

    const updated = recalcAfterMark(marked, "d7", 0.4);
    expect(updated.d7.done).toBe(false);
    expect(updated.d7.date).toBe(addDays(today, 1));
    expect(updated.phase).toBe("learning");
  });

  test("D7 with again severe downgrades to D4 and enters relearning", () => {
    const today = todayStr();
    const initialRev = buildRev(today, "GO");
    const marked = {
      ...initialRev,
      d7: {
        ...initialRev.d7,
        done: true,
        reviewedAt: today,
        scheduledAt: addDays(today, -2),
        acerto: 0.2,
      },
    };

    const updated = recalcAfterMark(marked, "d7", 0.2);
    expect(updated.phase).toBe("relearning");
    expect(updated.relearning?.fromStep).toBe("d7");
    expect(updated.d7.done).toBe(false);
    expect(updated.d4.done).toBe(false);
    expect(updated.d4.date).toBe(addDays(today, 1));
  });

  test("D21 with again severe enters relearning and targets D7", () => {
    const today = todayStr();
    const initialRev = buildRev(addDays(today, -21), "GO");
    const marked = {
      ...initialRev,
      d21: {
        ...initialRev.d21,
        done: true,
        reviewedAt: today,
        scheduledAt: addDays(today, -3),
        acerto: 0.2,
      },
      manutencao: {
        done: false,
        date: addDays(today, 40),
        scheduledAt: addDays(today, 40),
        S: 30,
        D: 0.5,
      },
    };

    const updated = recalcAfterMark(marked, "d21", 0.2);
    expect(updated.phase).toBe("relearning");
    expect(updated.d21.done).toBe(false);
    expect(updated.d7.done).toBe(false);
    expect(updated.d7.date).toBe(addDays(today, 1));
  });

  test("missing rating does not leave step completed", () => {
    const today = todayStr();
    const initialRev = buildRev(today, "GO");
    const marked = {
      ...initialRev,
      d1: {
        ...initialRev.d1,
        done: true,
        scheduledAt: today,
        reviewedAt: today,
      },
    };
    const updated = recalcAfterMark(marked, "d1", null);
    expect(updated.d1.done).toBe(false);
    expect(updated.d1.reviewedAt).toBeNull();
    expect(updated.meta?.schedulerWarning).toBe("missing_rating");
  });

  test("maintenance with again severe returns to D7 relearning", () => {
    const today = todayStr();
    const initialRev = buildRev(addDays(today, -60), "GO");
    const marked = {
      ...initialRev,
      manutencao: {
        done: true,
        date: addDays(today, -1),
        scheduledAt: addDays(today, -3),
        reviewedAt: today,
        acerto: 0.2,
        S: 40,
        D: 0.5,
        interval: 45,
      },
    };

    const updated = recalcAfterMark(marked, "manutencao", 0.2);
    expect(updated.phase).toBe("relearning");
    expect(updated.d7.date).toBe(addDays(today, 1));
  });

  test("applyRelearningRecoveryBonus is small and bounded", () => {
    expect(applyRelearningRecoveryBonus(10, "easy", { wasRelearning: true })).toBeCloseTo(11.2);
    expect(applyRelearningRecoveryBonus(10, "good", { wasRelearning: true })).toBeCloseTo(10.5);
    expect(applyRelearningRecoveryBonus(10, "hard", { wasRelearning: true })).toBeCloseTo(10);
  });

  test("maintenance interval grows with stability, never shrinks on a pass, and respects the cap", () => {
    const today = todayStr();
    const initialRev = buildRev(addDays(today, -30), "GO");
    const marked = {
      ...initialRev,
      manutencao: {
        done: true,
        date: today,
        scheduledAt: today,
        reviewedAt: today,
        acerto: 0.9,
        S: 45,
        D: 0.5,
        interval: 45,
      },
    };

    const updated = recalcAfterMark(marked, "manutencao", 0.9, 0.90, 180, "GO");
    expect(updated.manutencao.interval).toBeDefined();
    expect(updated.manutencao.interval).toBeGreaterThanOrEqual(45); // piso: não encurta após acerto
    expect(updated.manutencao.interval).toBeLessThanOrEqual(180);   // teto global
    expect(updated.manutencao.date).toBe(addDays(today, updated.manutencao.interval));
  });

  test("maintenance: easy yields a longer next interval than hard from the same state", () => {
    const today = todayStr();
    const base = {
      ...buildRev(addDays(today, -60), "GO"),
      manutencao: { done: true, date: today, scheduledAt: today, reviewedAt: today, S: 60, D: 0.5, interval: 60 },
    };
    const easy = recalcAfterMark(base, "manutencao", 1.0, 0.90, 180, "GO");
    const hard = recalcAfterMark(base, "manutencao", 0.6, 0.90, 180, "GO");
    expect(easy.manutencao.interval).toBeGreaterThan(hard.manutencao.interval);
  });

  test("maintenance multi-cycle keeps growing while capped at maxInterval", () => {
    const today = todayStr();
    let rev = {
      ...buildRev(addDays(today, -120), "GO"),
      manutencao: { done: true, date: today, scheduledAt: today, reviewedAt: today, S: 80, D: 0.4, interval: 80 },
    };
    const first = recalcAfterMark(rev, "manutencao", 1.0, 0.90, 180, "GO");
    const cycle2 = {
      ...first,
      manutencao: { ...first.manutencao, done: true, reviewedAt: today, scheduledAt: today, date: today },
    };
    const second = recalcAfterMark(cycle2, "manutencao", 1.0, 0.90, 180, "GO");
    expect(second.manutencao.interval).toBeGreaterThanOrEqual(first.manutencao.interval);
    expect(second.manutencao.interval).toBeLessThanOrEqual(180);
  });

  test("maintenance again-common preserves the interval field (no silent reset to 45)", () => {
    const today = todayStr();
    const base = {
      ...buildRev(addDays(today, -120), "GO"),
      manutencao: { done: true, date: today, scheduledAt: today, reviewedAt: today, S: 90, D: 0.5, interval: 90 },
    };
    // acerto 0.5 → rating "again", severidade "common" (>= 0.30)
    const updated = recalcAfterMark(base, "manutencao", 0.5, 0.90, 180, "GO");
    expect(updated.phase).toBe("maintenance");
    expect(updated.manutencao.interval).toBeDefined();
    expect(updated.manutencao.interval).not.toBeNull();
  });

  test("nextInterval never exceeds maxInterval", () => {
    // baseOffset alto faz a banda passar de 180 → o teto deve cortar em 180.
    expect(nextInterval(10000, 1000, 0.90, 180, 0.3)).toBe(180);
  });

  test("reviewHistory receives events and is limited", () => {
    const today = todayStr();
    const rev = buildRev(today, "GO");
    const withHistory = {
      ...rev,
      reviewHistory: Array.from({ length: 100 }, (_, idx) => ({
        id: `h_${idx}`,
        stepKey: "d1",
        reviewedAt: today,
      })),
      d1: {
        ...rev.d1,
        done: true,
        reviewedAt: today,
        scheduledAt: today,
      },
    };

    const updated = recalcAfterMark(withHistory, "d1", 0.9);
    expect(updated.reviewHistory.length).toBe(100);
    expect(updated.reviewHistory[99].stepKey).toBe("d1");
    expect(updated.reviewHistory[99].reviewedAt).toBe(today);
  });

  test("appendReviewHistory enforces limit", () => {
    const rev = { reviewHistory: Array.from({ length: 3 }, (_, idx) => ({ id: `x_${idx}` })) };
    const out = appendReviewHistory(rev, { id: "x_3", stepKey: "d1" }, 3);
    expect(out.length).toBe(3);
    expect(out[0].id).toBe("x_1");
    expect(out[2].id).toBe("x_3");
  });
});
