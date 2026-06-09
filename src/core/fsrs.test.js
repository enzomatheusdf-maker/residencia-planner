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
  spacingFactorFromTiming,
  updateDifficulty,
  updateStability,
  toRating,
  applyRelearningRecoveryBonus,
  appendReviewHistory,
  relapseSeedStability,
  MATURE_LAPSE_THRESHOLD,
  isMatureStep,
  getAdaptiveLearningInterval
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

  test("spacing factor keeps on-time reviews unchanged", () => {
    expect(spacingFactorFromTiming(0, 21)).toBeCloseTo(1, 5);
    const legacy = updateStability(10, 0.9, 0.5, 1.0, "good", 1.0);
    const onTime = updateStability(10, 0.9, 0.5, 1.0, "good");
    expect(onTime).toBeCloseTo(legacy, 5);
  });

  test("spacing factor increases stability gain for delayed successful reviews", () => {
    const onTime = updateStability(10, 0.9, 0.5, 1.0, "good", 1.0);
    const delayed = updateStability(10, 0.9, 0.5, 1.0, "good", spacingFactorFromTiming(20, 21));
    expect(delayed).toBeGreaterThan(onTime);
  });

  test("spacing factor does not change again behavior", () => {
    const withSpacing = updateStability(10, 0.2, 0.5, 1.0, "again", 1.4);
    const withoutSpacing = updateStability(10, 0.2, 0.5, 1.0, "again", 1.0);
    expect(withSpacing).toBeCloseTo(withoutSpacing, 5);
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

  test("recalcAfterMark keeps D7 near fixed offset after D4 performance (adaptive transition)", () => {
    const today = todayStr();
    const initialRev = {
      d4: { date: today, done: true, S: 4, D: 0.55 },
      d7: { date: addDays(today, 7), done: false, S: 7, D: 0.55 }
    };

    const high = recalcAfterMark(initialRev, "d4", 1.0, 0.90, 180, "GO");
    const highInterval = diffDays(today, high.d7.date);
    expect(highInterval).toBeGreaterThanOrEqual(2);
    expect(highInterval).toBeLessThanOrEqual(6);

    const low = recalcAfterMark(initialRev, "d4", 0.60, 0.90, 180, "GO");
    const lowInterval = diffDays(today, low.d7.date);
    expect(lowInterval).toBeGreaterThanOrEqual(2);
    expect(lowInterval).toBeLessThanOrEqual(6);
    expect(lowInterval).toBeLessThanOrEqual(highInterval);
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

  test("D21 with again severe relapses to D0 (mature lapse, full re-study)", () => {
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
    expect(updated.d0.date).toBe(addDays(today, 1));
    expect(updated.relearning?.protocol?.clinicalCaseNext).toBe(true);
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

  test("maintenance with again severe relapses to D0 (full re-study)", () => {
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
    expect(updated.d0.date).toBe(addDays(today, 1));
    expect(updated.relearning?.targetStep).toBe("d0");
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

  test("maintenance again-common (<60%) relapses to D1 with seeded stability (não fica na manutenção)", () => {
    const today = todayStr();
    const base = {
      ...buildRev(addDays(today, -120), "GO"),
      manutencao: { done: true, date: today, scheduledAt: today, reviewedAt: today, S: 90, D: 0.5, interval: 90 },
    };
    // acerto 0.5 → lapso comum (30–60%) em tema maduro → volta ao estudo base (D1), NÃO remarca +5d.
    const updated = recalcAfterMark(base, "manutencao", 0.5, 0.90, 180, "GO");
    expect(updated.phase).toBe("relearning");
    expect(updated.d1.date).toBe(addDays(today, 1));
    expect(updated.relearning?.targetStep).toBe("d1");
    expect(updated.relearning?.protocol?.brainDump).toBe(true);
    // semente: herda do S maduro (90*0.45≈40.5), bem acima do S_BASE.d1 (1) → sobe mais rápido.
    expect(updated.d1.S).toBeGreaterThan(20);
  });

  test("mature review at 58% is a lapse, not a hard pass (limiar < 60%)", () => {
    const today = todayStr();
    const base = {
      ...buildRev(addDays(today, -120), "GO"),
      manutencao: { done: true, date: today, scheduledAt: today, reviewedAt: today, S: 70, D: 0.5, interval: 70 },
    };
    // 0.58 → toRating "hard", mas em tema maduro é tratado como AGAIN → relearning (não cresce o intervalo).
    const updated = recalcAfterMark(base, "manutencao", 0.58, 0.90, 180, "GO");
    expect(updated.phase).toBe("relearning");
    expect(updated.d1.date).toBe(addDays(today, 1));
    const last = updated.reviewHistory[updated.reviewHistory.length - 1];
    expect(last.matureLapse).toBe(true);
    expect(last.rating).toBe("hard"); // rating real preservado no histórico
  });

  test("relapseSeedStability inherits part of the mature stability (common > severe > virgin)", () => {
    expect(relapseSeedStability(90, "common")).toBeCloseTo(40.5);
    expect(relapseSeedStability(90, "severe")).toBeCloseTo(27);
    expect(relapseSeedStability(90, "common")).toBeGreaterThan(relapseSeedStability(90, "severe"));
    expect(relapseSeedStability(0, "common")).toBe(1); // fallback S_BASE.d1
  });

  test("isMatureStep / MATURE_LAPSE_THRESHOLD basics", () => {
    expect(MATURE_LAPSE_THRESHOLD).toBe(0.60);
    expect(isMatureStep("d21")).toBe(true);
    expect(isMatureStep("manutencao")).toBe(true);
    expect(isMatureStep("d7")).toBe(false);
    expect(isMatureStep("d0")).toBe(false);
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

  test("adaptive learning keeps D0 to D1 fixed at 1", () => {
    expect(getAdaptiveLearningInterval({
      doneKey: "d0",
      S: 10,
      D: 0.2,
      acerto: 1,
      rating: "easy",
      questoes: 40,
    })).toBe(1);
  });

  test("adaptive learning bounds D1 inside [2, 5] and D1 hard <= easy", () => {
    const hard = getAdaptiveLearningInterval({
      doneKey: "d1",
      S: 2,
      D: 0.8,
      acerto: 0.6,
      rating: "hard",
      questoes: 10,
    });

    const easy = getAdaptiveLearningInterval({
      doneKey: "d1",
      S: 12,
      D: 0.2,
      acerto: 0.95,
      rating: "easy",
      questoes: 25,
    });

    expect(hard).toBeGreaterThanOrEqual(2);
    expect(easy).toBeLessThanOrEqual(5);
    expect(hard).toBeLessThanOrEqual(easy);
  });

  test("adaptive learning bounds D4 inside [2, 6]", () => {
    const minD4 = getAdaptiveLearningInterval({
      doneKey: "d4",
      S: 1,
      D: 0.9,
      acerto: 0.5,
      rating: "hard",
      questoes: 1,
    });

    const maxD4 = getAdaptiveLearningInterval({
      doneKey: "d4",
      S: 20,
      D: 0.1,
      acerto: 1.0,
      rating: "easy",
      questoes: 40,
    });

    expect(minD4).toBeGreaterThanOrEqual(2);
    expect(maxD4).toBeLessThanOrEqual(6);
  });

  test("adaptive learning bounds D7 inside [10, 21]", () => {
    const minD7 = getAdaptiveLearningInterval({
      doneKey: "d7",
      S: 3,
      D: 0.9,
      acerto: 0.5,
      rating: "hard",
      questoes: 2,
    });

    const maxD7 = getAdaptiveLearningInterval({
      doneKey: "d7",
      S: 100,
      D: 0.1,
      acerto: 1.0,
      rating: "easy",
      questoes: 50,
    });

    expect(minD7).toBeGreaterThanOrEqual(10);
    expect(maxD7).toBeLessThanOrEqual(21);
  });

  test("low questions reduces interval via trust multiplier", () => {
    const withManyQuestions = getAdaptiveLearningInterval({
      doneKey: "d1",
      S: 5,
      D: 0.4,
      acerto: 0.9,
      rating: "good",
      questoes: 20,
    });

    const withFewQuestions = getAdaptiveLearningInterval({
      doneKey: "d1",
      S: 5,
      D: 0.4,
      acerto: 0.9,
      rating: "good",
      questoes: 2,
    });

    expect(withFewQuestions).toBeLessThanOrEqual(withManyQuestions);
  });

  test("overconfidence encurta intervalo", () => {
    const overconfident = getAdaptiveLearningInterval({
      doneKey: "d1",
      S: 5,
      D: 0.4,
      acerto: 0.7,
      rating: "good",
      questoes: 20,
      previsao: 1.0,
    });

    const calibrated = getAdaptiveLearningInterval({
      doneKey: "d1",
      S: 5,
      D: 0.4,
      acerto: 0.7,
      rating: "good",
      questoes: 20,
      previsao: 0.7,
    });

    expect(overconfident).toBeLessThanOrEqual(calibrated);
  });

  test("recalcAfterMark integrates adaptive interval and persists interleaved details in history", () => {
    const today = todayStr();
    const initialRev = buildRev(today, "GO");
    initialRev.d1.interleaved = true;
    initialRev.d1.interleavingStatus = "near_due_only";
    initialRev.d1.interleavingCandidateIds = ["t2", "t3"];

    const updated = recalcAfterMark(initialRev, "d1", 0.9);
    expect(updated.reviewHistory.length).toBeGreaterThan(0);
    const lastHist = updated.reviewHistory[updated.reviewHistory.length - 1];
    expect(lastHist.interleaved).toBe(true);
    expect(lastHist.interleavingStatus).toBe("near_due_only");
    expect(lastHist.interleavingCandidateIds).toContain("t2");
  });

  test("recalcAfterMark uses canonical FSRS as official schedule when topic context is present", () => {
    const today = todayStr();
    const initialRev = buildRev(today, "GO");
    initialRev.d1 = {
      ...initialRev.d1,
      done: true,
      reviewedAt: today,
      scheduledAt: today,
      date: today,
    };
    const fakeShadow = {
      enabled: true,
      adapterVersion: "topic-as-card-v1",
      officialPolicy: "official_scheduler_with_lite_fallback",
      package: "ts-fsrs",
      input: {
        temaId: "tema-shadow",
        reviewedAt: today,
      },
      output: {
        due: addDays(today, 5),
        scheduledDays: 5,
        stability: 8.5,
        difficulty: 0.42,
        state: "Review",
      },
      replay: {
        eventCount: 1,
      },
      comparison: {
        liteIntervalAfter: 3,
        canonicalIntervalAfter: 5,
      },
    };

    const updated = recalcAfterMark(initialRev, "d1", 0.9, 0.90, 180, "GO", {
      tema: { id: "tema-shadow", nome: "Tema Shadow" },
      buildFsrsCanonicalShadow: () => fakeShadow,
    });
    const lastHist = updated.reviewHistory[updated.reviewHistory.length - 1];

    expect(lastHist.fsrsCanonicalShadow).toBeTruthy();
    expect(lastHist.fsrsCanonicalShadow.enabled).toBe(true);
    expect(lastHist.fsrsCanonicalShadow.input.temaId).toBe("tema-shadow");
    expect(lastHist.source).toBe("ts-fsrs");
    expect(lastHist.fsrsCanonicalOfficial.applied).toBe(true);
    expect(lastHist.intervalAfter).toBe(5);
    expect(lastHist.liteIntervalAfter).not.toBeNull();
    expect(updated.d4.S).toBe(8.5);
    expect(updated.d4.D).toBe(0.42);
    expect(updated.d4.date).toBe(addDays(today, 5));
    expect(updated.d4.date).toBe(updated.d4.scheduledAt);
  });

  test("recalcAfterMark falls back to Lite schedule when canonical FSRS fails", () => {
    const today = todayStr();
    const initialRev = buildRev(today, "GO");
    initialRev.d1 = {
      ...initialRev.d1,
      done: true,
      reviewedAt: today,
      scheduledAt: today,
      date: today,
    };

    const updated = recalcAfterMark(initialRev, "d1", 0.9, 0.90, 180, "GO", {
      tema: { id: "tema-shadow-fail", nome: "Tema Shadow Fail", rev: initialRev },
      buildFsrsCanonicalShadow: () => {
        throw new Error("shadow unavailable");
      },
    });
    const lastHist = updated.reviewHistory[updated.reviewHistory.length - 1];

    expect(updated.d4.date).toBe(addDays(today, lastHist.intervalAfter));
    expect(lastHist.source).toBe("fsrs-lite-fallback");
    expect(lastHist.fsrsCanonicalOfficial.applied).toBe(false);
    expect(lastHist.fsrsCanonicalOfficial.fallbackReason).toBe("canonical_adapter_error");
    expect(lastHist.fsrsCanonicalShadow.failed).toBe(true);
    expect(lastHist.fsrsCanonicalShadow.error).toContain("shadow unavailable");
  });
});
