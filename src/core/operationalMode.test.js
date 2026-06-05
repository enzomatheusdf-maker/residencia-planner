import {
  deriveExperienceMode,
  deriveOperationalMode,
  EXPERIENCE_MODE,
  OPERATIONAL_MODE,
} from "./operationalMode";

describe("operationalMode", () => {
  test("modo normal quando nao ha risco", () => {
    const input = {
      today: "2026-06-04",
      meta: { dataProva: "2026-12-01" },
      scheduler: {
        overloadLevelToday: "ok",
        overloadDays: 0,
        todayMinutes: 30,
        overdueCount: 0,
        relearningCount: 0,
        missingRatingWarnings: 0,
        missingReviewedAtCount: 0,
      },
      modoSimples: true,
    };

    const out = deriveOperationalMode(input);

    expect(out.mode).toBe(OPERATIONAL_MODE.NORMAL);
    expect(out.flags.canStartNewTopic).toBe(true);
    expect(out.experienceMode).toBe(EXPERIENCE_MODE.MENTOR);
    expect(input.scheduler.overloadDays).toBe(0);
  });

  test("dados inconsistentes tem prioridade maxima", () => {
    const out = deriveOperationalMode({
      today: "2026-06-04",
      meta: { dataProva: "2026-06-10" },
      scheduler: {
        missingRatingWarnings: 1,
        overloadLevelToday: "high",
        overloadDays: 3,
        overdueCount: 4,
        relearningCount: 2,
      },
    });

    expect(out.mode).toBe(OPERATIONAL_MODE.DATA_ISSUE);
    expect(out.severity).toBe("critical");
    expect(out.flags.canStartNewTopic).toBe(false);
  });

  test("pausado vence sobrecarga se dados estiverem ok", () => {
    const out = deriveOperationalMode({
      today: "2026-06-04",
      meta: { pausadoAte: "2026-06-10", dataProva: "2026-09-13" },
      scheduler: {
        overloadLevelToday: "high",
        overloadDays: 3,
        missingRatingWarnings: 0,
        missingReviewedAtCount: 0,
      },
    });

    expect(out.mode).toBe(OPERATIONAL_MODE.PAUSED);
    expect(out.flags.shouldSuggestRest).toBe(true);
  });

  test("dados inconsistentes vencem pausa ativa", () => {
    const out = deriveOperationalMode({
      today: "2026-06-04",
      meta: { pausadoAte: "2026-06-10", dataProva: "2026-09-13" },
      scheduler: {
        missingReviewedAtCount: 1,
        overloadLevelToday: "ok",
      },
    });

    expect(out.mode).toBe(OPERATIONAL_MODE.DATA_ISSUE);
  });

  test("sobrecarga quando carga de hoje e alta", () => {
    const out = deriveOperationalMode({
      today: "2026-06-04",
      meta: { dataProva: "2026-12-01" },
      scheduler: {
        overloadLevelToday: "high",
        overloadDays: 0,
        todayMinutes: 150,
      },
    });

    expect(out.mode).toBe(OPERATIONAL_MODE.OVERLOAD);
    expect(out.flags.canStartNewTopic).toBe(false);
    expect(out.flags.shouldSuggestRest).toBe(true);
  });

  test("sobrecarga quando carga excede tempo disponivel em 20%", () => {
    const out = deriveOperationalMode({
      today: "2026-06-04",
      meta: { dataProva: "2026-12-01" },
      userAvailableMinutes: 60,
      scheduler: {
        overloadLevelToday: "ok",
        overloadDays: 0,
        todayMinutes: 80,
      },
    });

    expect(out.mode).toBe(OPERATIONAL_MODE.OVERLOAD);
    expect(out.reasonCodes).toContain("exceeds_available_minutes");
  });

  test("recuperacao quando ha relearning", () => {
    const out = deriveOperationalMode({
      today: "2026-06-04",
      meta: { dataProva: "2026-12-01" },
      scheduler: {
        overloadLevelToday: "ok",
        overloadDays: 0,
        relearningCount: 1,
        overdueCount: 0,
      },
    });

    expect(out.mode).toBe(OPERATIONAL_MODE.RECOVERY);
    expect(out.flags.shouldPreferRecovery).toBe(true);
  });

  test("revisao de hoje sem atraso nao vira recuperacao", () => {
    const out = deriveOperationalMode({
      today: "2026-06-04",
      meta: { dataProva: "2026-12-01" },
      scheduler: {
        overloadLevelToday: "ok",
        overloadDays: 0,
        dueTodayCount: 3,
        overdueCount: 0,
        relearningCount: 0,
        maxDelayDays: 0,
      },
    });

    expect(out.mode).toBe(OPERATIONAL_MODE.NORMAL);
  });

  test("prova proxima quando fase e reta_final e nao ha riscos maiores", () => {
    const out = deriveOperationalMode({
      today: "2026-06-04",
      meta: { dataProva: "2026-06-20" },
      scheduler: {
        overloadLevelToday: "ok",
        overloadDays: 0,
        overdueCount: 0,
        relearningCount: 0,
        missingRatingWarnings: 0,
        missingReviewedAtCount: 0,
      },
    });

    expect(out.mode).toBe(OPERATIONAL_MODE.EXAM_NEAR);
    expect(out.examPhase).toBe("reta_final");
    expect(out.flags.shouldPreferExamPractice).toBe(true);
  });

  test("sobrecarga vence prova proxima", () => {
    const out = deriveOperationalMode({
      today: "2026-06-04",
      meta: { dataProva: "2026-06-20" },
      scheduler: {
        overloadLevelToday: "high",
        overloadDays: 2,
        overdueCount: 0,
        relearningCount: 0,
      },
    });

    expect(out.examPhase).toBe("reta_final");
    expect(out.mode).toBe(OPERATIONAL_MODE.OVERLOAD);
  });

  test("experience mode foco tem prioridade sobre mentor e manual", () => {
    expect(deriveExperienceMode({ focusMode: true, modoSimples: true })).toBe(EXPERIENCE_MODE.FOCUS);
    expect(deriveExperienceMode({ focusMode: false, modoSimples: true })).toBe(EXPERIENCE_MODE.MENTOR);
    expect(deriveExperienceMode({ focusMode: false, modoSimples: false, mentorMode: false })).toBe(EXPERIENCE_MODE.MANUAL);
  });
});
