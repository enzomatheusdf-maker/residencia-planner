import {
  buildSchedulePreview,
  calculateFeasibility,
  calculatePlanningHorizon,
  calculateRedistributionSummary,
  calculateWeeklyCapacity,
  normalizeWeeklyTopicLimit,
  distributeTopics,
  generateSchedule,
  selectTopicsByScope,
} from "./scheduleWizard";

const TODAY      = "2026-06-02";
const START      = "2026-06-02";
const TARGET_6M  = "2026-12-02";
const TARGET_NEAR = "2026-06-20"; // < 4 semanas

// studyDays padrão: seg-sex com 3 tópicos/dia
const DEFAULT_STUDY_DAYS = {
  dom: { active: false, maxNewTopics: 0 },
  seg: { active: true,  maxNewTopics: 3 },
  ter: { active: true,  maxNewTopics: 3 },
  qua: { active: true,  maxNewTopics: 3 },
  qui: { active: true,  maxNewTopics: 3 },
  sex: { active: true,  maxNewTopics: 3 },
  sab: { active: false, maxNewTopics: 0 },
};

// planSetup mínimo
const BASE_PLAN = {
  startDate: START,
  targetDate: TARGET_6M,
  horizonMode: "target_date",
  horizonMonths: 6,
  studyDays: DEFAULT_STUDY_DAYS,
  scopeMode: "essential",
};

function makeTopic(overrides = {}) {
  return {
    id: overrides.id || "t1",
    nome: overrides.nome || "Hipertensão",
    esp: overrides.esp || "Clínica Médica",
    importancia: overrides.importancia || "ALTA",
    ...overrides,
  };
}

// ─── calculateWeeklyCapacity ──────────────────────────────────────────────────

describe("calculateWeeklyCapacity", () => {
  it("sums maxNewTopics for active days", () => {
    expect(calculateWeeklyCapacity(DEFAULT_STUDY_DAYS)).toBe(15); // 5 dias × 3
  });
  it("returns 0 for all inactive days", () => {
    const allOff = Object.fromEntries(
      ["dom","seg","ter","qua","qui","sex","sab"].map((k) => [k, { active: false, maxNewTopics: 3 }])
    );
    expect(calculateWeeklyCapacity(allOff)).toBe(0);
  });
  it("ignores inactive even if maxNewTopics > 0", () => {
    const days = {
      ...DEFAULT_STUDY_DAYS,
      sab: { active: false, maxNewTopics: 10 },
    };
    expect(calculateWeeklyCapacity(days)).toBe(15);
  });
  it("handles empty studyDays", () => {
    expect(calculateWeeklyCapacity({})).toBe(0);
  });
});

describe("weekly topic limit", () => {
  it("clamps weekly topic limit at 30", () => {
    expect(normalizeWeeklyTopicLimit(31)).toBe(30);
    expect(normalizeWeeklyTopicLimit(0)).toBe(1);
  });

  it("calculates estimated weeks without dropping topics", () => {
    expect(calculateRedistributionSummary(60, 30).estimatedWeeks).toBe(2);
    expect(calculateRedistributionSummary(75, 30).estimatedWeeks).toBe(3);
  });
});

// ─── calculatePlanningHorizon ─────────────────────────────────────────────────

describe("calculatePlanningHorizon", () => {
  it("uses targetDate when horizonMode=target_date", () => {
    const h = calculatePlanningHorizon(START, TARGET_6M, "target_date", 6);
    expect(h.endDate).toBe(TARGET_6M);
    expect(h.totalWeeks).toBeGreaterThan(20);
  });
  it("uses horizonMonths when horizonMode=duration", () => {
    const h = calculatePlanningHorizon(START, null, "duration", 3);
    expect(h.totalWeeks).toBeGreaterThan(11);
    expect(h.totalWeeks).toBeLessThan(15);
  });
  it("returns 0 weeks when endDate <= startDate", () => {
    const h = calculatePlanningHorizon(START, START, "target_date", 0);
    expect(h.totalWeeks).toBe(0);
  });
});

// ─── calculateFeasibility ─────────────────────────────────────────────────────

describe("calculateFeasibility", () => {
  it("status=comfortable when topics << capacity", () => {
    const topics = Array.from({ length: 10 }, (_, i) => makeTopic({ id: `t${i}` }));
    const f = calculateFeasibility(BASE_PLAN, topics);
    expect(f.status).toBe("comfortable");
    expect(f.warnings).toHaveLength(0);
  });

  it("status=infeasible when topics > capacity", () => {
    const topics = Array.from({ length: 2000 }, (_, i) => makeTopic({ id: `t${i}` }));
    const f = calculateFeasibility(BASE_PLAN, topics);
    expect(f.status).toBe("infeasible");
    expect(f.warnings.some((w) => w.code === "capacity_overflow")).toBe(true);
  });

  it("warns capacity_overflow when totalTopics > availableCapacity", () => {
    // 15 topics/week × ~26 weeks ≈ 390 capacity
    const topics = Array.from({ length: 500 }, (_, i) => makeTopic({ id: `t${i}` }));
    const f = calculateFeasibility(BASE_PLAN, topics);
    expect(f.warnings.some((w) => w.code === "capacity_overflow")).toBe(true);
  });

  it("warns too_many_topics_per_day when max > 6", () => {
    const heavyDays = {
      ...DEFAULT_STUDY_DAYS,
      seg: { active: true, maxNewTopics: 8 },
    };
    const f = calculateFeasibility({ ...BASE_PLAN, studyDays: heavyDays }, [makeTopic()]);
    expect(f.warnings.some((w) => w.code === "too_many_topics_per_day")).toBe(true);
  });

  it("warns no_rest_day when all 7 days active", () => {
    const allOn = Object.fromEntries(
      ["dom","seg","ter","qua","qui","sex","sab"].map((k) => [k, { active: true, maxNewTopics: 2 }])
    );
    const f = calculateFeasibility({ ...BASE_PLAN, studyDays: allOn }, [makeTopic()]);
    expect(f.warnings.some((w) => w.code === "no_rest_day")).toBe(true);
  });

  it("warns target_date_too_close when < 4 weeks", () => {
    const plan = { ...BASE_PLAN, targetDate: TARGET_NEAR, horizonMode: "target_date" };
    const f = calculateFeasibility(plan, [makeTopic()]);
    expect(f.warnings.some((w) => w.code === "target_date_too_close")).toBe(true);
  });

  it("exposes availableCapacity and ratio", () => {
    const topics = Array.from({ length: 75 }, (_, i) => makeTopic({ id: `t${i}` }));
    const f = calculateFeasibility(BASE_PLAN, topics);
    expect(f.availableCapacity).toBeGreaterThan(0);
    expect(f.totalTopics).toBe(75);
    expect(f.ratio).toBeGreaterThan(0);
  });
});

// ─── selectTopicsByScope ──────────────────────────────────────────────────────

describe("selectTopicsByScope", () => {
  const topics = [
    makeTopic({ id: "c1", importancia: "CRITICA" }),
    makeTopic({ id: "a1", importancia: "ALTA" }),
    makeTopic({ id: "m1", importancia: "MEDIA" }),
    makeTopic({ id: "b1", importancia: "BAIXA" }),
  ];

  it("essential keeps only CRITICA and ALTA", () => {
    const selected = selectTopicsByScope(topics, "essential");
    expect(selected.map((t) => t.id)).toEqual(["c1", "a1"]);
  });
  it("complete keeps all", () => {
    expect(selectTopicsByScope(topics, "complete")).toHaveLength(4);
  });
  it("intensive keeps all", () => {
    expect(selectTopicsByScope(topics, "intensive")).toHaveLength(4);
  });
  it("defaults to essential when scopeMode unknown", () => {
    const selected = selectTopicsByScope(topics, "unknown");
    // falls through to essential filter
    expect(selected.length).toBeLessThanOrEqual(2);
  });
});

// ─── distributeTopics ─────────────────────────────────────────────────────────

describe("distributeTopics", () => {
  it("schedules topics on active days only", () => {
    const topics = Array.from({ length: 5 }, (_, i) => makeTopic({ id: `t${i}` }));
    const result = distributeTopics(topics, BASE_PLAN, START, TODAY);
    result.forEach((st) => {
      const jsDay = new Date(st.scheduledDate + "T12:00:00").getDay();
      // 0=dom, 6=sab → inactive
      expect(jsDay).not.toBe(0);
      expect(jsDay).not.toBe(6);
    });
  });

  it("respects maxNewTopics per day", () => {
    const topics = Array.from({ length: 20 }, (_, i) => makeTopic({ id: `t${i}` }));
    const result = distributeTopics(topics, BASE_PLAN, START, TODAY);
    const byDate = result.reduce((acc, st) => {
      acc[st.scheduledDate] = (acc[st.scheduledDate] || 0) + 1;
      return acc;
    }, {});
    Object.values(byDate).forEach((count) => {
      expect(count).toBeLessThanOrEqual(3);
    });
  });

  it("schedules all topics even when > weekly capacity (overflow to next dates)", () => {
    const topics = Array.from({ length: 100 }, (_, i) => makeTopic({ id: `t${i}` }));
    const result = distributeTopics(topics, BASE_PLAN, START, TODAY);
    expect(result).toHaveLength(100);
  });

  it("uses explicit date when topic has scheduledDate >= startDate", () => {
    const topics = [makeTopic({ id: "explicit", scheduledDate: "2026-06-08" })];
    const result = distributeTopics(topics, BASE_PLAN, START, TODAY);
    const item = result.find((t) => t.temaId === "explicit");
    expect(item.scheduledDate).toBe("2026-06-08");
    expect(item.distributionReason).toBe("explicit_date");
  });

  it("uses topic.d0 as fallback for explicit date", () => {
    const topics = [makeTopic({ id: "d0-topic", d0: "2026-06-09" })];
    const result = distributeTopics(topics, BASE_PLAN, START, TODAY);
    const item = result.find((t) => t.temaId === "d0-topic");
    expect(item.scheduledDate).toBe("2026-06-09");
  });

  it("returns items sorted by scheduledDate", () => {
    const topics = Array.from({ length: 10 }, (_, i) => makeTopic({ id: `t${i}` }));
    const result = distributeTopics(topics, BASE_PLAN, START, TODAY);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].scheduledDate >= result[i - 1].scheduledDate).toBe(true);
    }
  });

  it("scheduledWeek label matches position relative to startDate", () => {
    const topics = [makeTopic()];
    const result = distributeTopics(topics, BASE_PLAN, START, TODAY);
    expect(result[0].scheduledWeek).toMatch(/^Semana \d+$/);
  });

  it("handles empty topics array", () => {
    expect(distributeTopics([], BASE_PLAN, START, TODAY)).toHaveLength(0);
  });
});

// ─── buildSchedulePreview ─────────────────────────────────────────────────────

describe("buildSchedulePreview", () => {
  it("returns feasibility + scheduledTopics + preview30d", () => {
    const topics = Array.from({ length: 30 }, (_, i) => makeTopic({ id: `t${i}` }));
    const preview = buildSchedulePreview(BASE_PLAN, topics, TODAY);
    expect(preview.feasibility).toBeDefined();
    expect(Array.isArray(preview.scheduledTopics)).toBe(true);
    expect(Array.isArray(preview.preview30d)).toBe(true);
    expect(preview.totalScheduled).toBe(preview.scheduledTopics.length);
  });

  it("preview30d contains only items within 30 days of today", () => {
    const topics = Array.from({ length: 200 }, (_, i) => makeTopic({ id: `t${i}` }));
    const preview = buildSchedulePreview(BASE_PLAN, topics, TODAY);
    preview.preview30d.forEach((t) => {
      expect(t.scheduledDate <= "2026-07-02").toBe(true);
    });
  });

  it("applies scope filtering", () => {
    const topics = [
      makeTopic({ id: "c", importancia: "CRITICA" }),
      makeTopic({ id: "m", importancia: "MEDIA" }),
    ];
    const preview = buildSchedulePreview({ ...BASE_PLAN, scopeMode: "essential" }, topics, TODAY);
    expect(preview.scheduledTopics.every((t) => t.temaId !== "m")).toBe(true);
  });
});

// ─── generateSchedule ────────────────────────────────────────────────────────

describe("generateSchedule", () => {
  it("returns same scheduledTopics as buildSchedulePreview.scheduledTopics", () => {
    const topics = Array.from({ length: 10 }, (_, i) => makeTopic({ id: `t${i}` }));
    const scheduled = generateSchedule(BASE_PLAN, topics, TODAY);
    const preview   = buildSchedulePreview(BASE_PLAN, topics, TODAY);
    expect(scheduled).toEqual(preview.scheduledTopics);
  });
});
