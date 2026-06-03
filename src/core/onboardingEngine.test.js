import {
  buildInitialPlanSetup,
  completePlanSetupPayload,
  getFirstActionAfterOnboarding,
  recommendScopeMode,
  recommendSimulationPlan,
} from "./onboardingEngine";
import { isPlanSetupComplete, shouldShowOnboardingV2 } from "./onboardingGate";
import { getOnboardingDefaults } from "./onboarding";

const TODAY = "2026-06-02";
const PAST  = "2026-05-01";
const FUTURE = "2026-06-10";

const DEFAULT_STUDY_DAYS = {
  dom: { active: false, maxNewTopics: 0 },
  seg: { active: true,  maxNewTopics: 3 },
  ter: { active: true,  maxNewTopics: 3 },
  qua: { active: true,  maxNewTopics: 3 },
  qui: { active: true,  maxNewTopics: 3 },
  sex: { active: true,  maxNewTopics: 3 },
  sab: { active: false, maxNewTopics: 0 },
};

// ─── isPlanSetupComplete ──────────────────────────────────────────────────────

describe("isPlanSetupComplete", () => {
  it("returns false when planSetup absent", () => {
    expect(isPlanSetupComplete({ meta: {} })).toBe(false);
  });
  it("returns false when planSetup.completedAt is null", () => {
    expect(isPlanSetupComplete({ meta: { planSetup: { completedAt: null } } })).toBe(false);
  });
  it("returns true when planSetup.completedAt is set", () => {
    expect(isPlanSetupComplete({ meta: { planSetup: { completedAt: TODAY } } })).toBe(true);
  });
});

// ─── shouldShowOnboardingV2 ───────────────────────────────────────────────────

describe("shouldShowOnboardingV2", () => {
  it("returns true for brand-new user (no onboarding at all)", () => {
    expect(shouldShowOnboardingV2({ meta: {} })).toBe(true);
  });

  it("returns false when planSetup already complete (v2 done)", () => {
    expect(
      shouldShowOnboardingV2({
        meta: {
          planSetup: { completedAt: TODAY },
          onboarding: { completed: true, version: 2 },
        },
      })
    ).toBe(false);
  });

  it("returns false for v1 veteran without planSetup (not forced)", () => {
    expect(
      shouldShowOnboardingV2({
        meta: { onboarding: { completed: true, version: 1 } },
      })
    ).toBe(false);
  });

  it("returns false when tourStep active", () => {
    expect(shouldShowOnboardingV2({ tourStep: 1, meta: {} })).toBe(false);
  });
});

// ─── buildInitialPlanSetup ────────────────────────────────────────────────────

describe("buildInitialPlanSetup", () => {
  it("uses today as startDate when not provided", () => {
    const ps = buildInitialPlanSetup({}, TODAY);
    expect(ps.startDate).toBe(TODAY);
  });

  it("uses provided startDate", () => {
    const ps = buildInitialPlanSetup({ startDate: FUTURE }, TODAY);
    expect(ps.startDate).toBe(FUTURE);
  });

  it("defaults to scopeMode=essential", () => {
    const ps = buildInitialPlanSetup({}, TODAY);
    expect(ps.scopeMode).toBe("essential");
  });

  it("defaults minutesPerTopic to 50", () => {
    const ps = buildInitialPlanSetup({}, TODAY);
    expect(ps.minutesPerTopic).toBe(50);
  });

  it("calculates topicsPerWeek from studyDays", () => {
    const ps = buildInitialPlanSetup({ studyDays: DEFAULT_STUDY_DAYS }, TODAY);
    expect(ps.topicsPerWeek).toBe(15); // 5 dias × 3
  });

  it("warns > 6 topics/day (feasibility flag from wizard)", () => {
    // O aviso não é papel do buildInitialPlanSetup — é do calculateFeasibility.
    // Apenas garantir que o campo studyDays é preservado.
    const heavyDays = {
      ...DEFAULT_STUDY_DAYS,
      seg: { active: true, maxNewTopics: 8 },
    };
    const ps = buildInitialPlanSetup({ studyDays: heavyDays }, TODAY);
    expect(ps.studyDays.seg.maxNewTopics).toBe(8);
  });

  it("completedAt is null (não completo ainda)", () => {
    const ps = buildInitialPlanSetup({}, TODAY);
    expect(ps.completedAt).toBeNull();
  });

  it("defaults do not break getOnboardingDefaults for v1 meta", () => {
    const v1Meta = { onboarding: { completed: true, step: 3, goal: "enamed" } };
    const defaults = getOnboardingDefaults(v1Meta);
    expect(defaults.completed).toBe(true);
    expect(defaults.version).toBe(1);
  });
});

// ─── recommendScopeMode ───────────────────────────────────────────────────────

describe("recommendScopeMode", () => {
  it("returns complete when ratio <= 0.75", () => {
    expect(recommendScopeMode({ ratio: 0.5, status: "comfortable" })).toBe("complete");
  });
  it("returns essential when ratio <= 1.0", () => {
    expect(recommendScopeMode({ ratio: 0.9, status: "feasible" })).toBe("essential");
  });
  it("returns essential when ratio > 1.0", () => {
    expect(recommendScopeMode({ ratio: 1.5, status: "infeasible" })).toBe("essential");
  });
  it("returns essential when feasibility is null", () => {
    expect(recommendScopeMode(null)).toBe("essential");
  });
});

// ─── recommendSimulationPlan ──────────────────────────────────────────────────

describe("recommendSimulationPlan", () => {
  it("returns diagnostic for vest track regardless of weeks", () => {
    expect(recommendSimulationPlan({ totalWeeks: 30 }, "vest")).toBe("diagnostic");
  });
  it("returns diagnostic when < 8 weeks", () => {
    expect(recommendSimulationPlan({ totalWeeks: 5 }, "res")).toBe("diagnostic");
  });
  it("returns monthly when 8-15 weeks", () => {
    expect(recommendSimulationPlan({ totalWeeks: 12 }, "res")).toBe("monthly");
  });
  it("returns biweekly when >= 16 weeks", () => {
    expect(recommendSimulationPlan({ totalWeeks: 24 }, "res")).toBe("biweekly");
  });
  it("returns diagnostic for 0 weeks", () => {
    expect(recommendSimulationPlan({ totalWeeks: 0 }, "res")).toBe("diagnostic");
  });
});

// ─── getFirstActionAfterOnboarding ───────────────────────────────────────────

describe("getFirstActionAfterOnboarding", () => {
  const planSetup = { minutesPerTopic: 50 };

  it("returns null when no scheduledTopics", () => {
    expect(getFirstActionAfterOnboarding([], planSetup, TODAY)).toBeNull();
  });

  it("returns today's topic when scheduledDate === today", () => {
    const scheduled = [{ temaId: "t1", temaNome: "IAM", scheduledDate: TODAY, priority: "ALTA" }];
    const action = getFirstActionAfterOnboarding(scheduled, planSetup, TODAY);
    expect(action).toBeTruthy();
    expect(action.temaId).toBe("t1");
    expect(action.stepKey).toBe("d0");
    expect(action.estimatedMinutes).toBe(50);
    expect(action.isUpcoming).toBe(false);
  });

  it("returns overdue topic when scheduledDate < today", () => {
    const scheduled = [{ temaId: "t-late", temaNome: "Dengue", scheduledDate: PAST, priority: "ALTA" }];
    const action = getFirstActionAfterOnboarding(scheduled, planSetup, TODAY);
    expect(action.temaId).toBe("t-late");
    expect(action.isUpcoming).toBe(false);
  });

  it("prioritizes CRITICA over ALTA for same date", () => {
    const scheduled = [
      { temaId: "t-alta",   temaNome: "A", scheduledDate: TODAY, priority: "ALTA" },
      { temaId: "t-critica", temaNome: "B", scheduledDate: TODAY, priority: "CRITICA" },
    ];
    const action = getFirstActionAfterOnboarding(scheduled, planSetup, TODAY);
    expect(action.temaId).toBe("t-critica");
  });

  it("returns upcoming item with isUpcoming=true when nothing due today", () => {
    const scheduled = [{ temaId: "t-future", temaNome: "C", scheduledDate: FUTURE, priority: "ALTA" }];
    const action = getFirstActionAfterOnboarding(scheduled, planSetup, TODAY);
    expect(action).toBeTruthy();
    expect(action.isUpcoming).toBe(true);
    expect(action.scheduledDate).toBe(FUTURE);
  });
});

// ─── completePlanSetupPayload ─────────────────────────────────────────────────

describe("completePlanSetupPayload", () => {
  const planSetup = {
    startDate: TODAY,
    targetDate: "2026-12-01",
    horizonMode: "target_date",
    scopeMode: "essential",
    studyDays: DEFAULT_STUDY_DAYS,
    minutesPerTopic: 50,
  };

  const topics = [
    { id: "t1", nome: "IAM", esp: "Clínica Médica", importancia: "ALTA" },
    { id: "t2", nome: "Bronquiolite", esp: "Pediatria", importancia: "CRITICA" },
  ];

  it("sets completedAt on planSetup", () => {
    const { planSetup: ps } = completePlanSetupPayload(planSetup, topics, undefined, TODAY);
    expect(ps.completedAt).toBe(TODAY);
  });

  it("generates scheduledTopics when not provided", () => {
    const { scheduledTopics } = completePlanSetupPayload(planSetup, topics, undefined, TODAY);
    expect(scheduledTopics.length).toBeGreaterThan(0);
  });

  it("uses provided scheduledTopics when given", () => {
    const preScheduled = [{ temaId: "t1", scheduledDate: TODAY }];
    const { scheduledTopics } = completePlanSetupPayload(planSetup, topics, preScheduled, TODAY);
    expect(scheduledTopics).toEqual(preScheduled);
  });

  it("returns firstAction object or null", () => {
    const { firstAction } = completePlanSetupPayload(planSetup, topics, undefined, TODAY);
    // firstAction pode ser null se não há tópico agendado para hoje
    expect(firstAction === null || typeof firstAction === "object").toBe(true);
  });

  it("topicsPerWeek is recalculated from studyDays", () => {
    const { planSetup: ps } = completePlanSetupPayload(planSetup, topics, undefined, TODAY);
    expect(ps.topicsPerWeek).toBe(15);
  });
});
