import {
  buildAgendaItems,
  buildAgendaMonth,
  estimateTaskMinutes,
  getAgendaDaySummary,
  groupAgendaByDate,
  sortAgendaItemsForDay,
} from "./agendaEngine";

const TODAY = "2026-06-02";
const PAST  = "2026-05-01";
const NEAR  = "2026-06-10";
const FAR   = "2026-09-01";

function makeTema(overrides = {}) {
  const base = {
    id: "tema-1",
    nome: "Apendicite",
    esp: "Cirurgia",
    importancia: "ALTA",
    unstarted: false,
    rev: {
      d0:  { date: PAST, done: true,  scheduledAt: PAST,  phase: "learning" },
      d1:  { date: TODAY, done: false, scheduledAt: TODAY, phase: "learning" },
      d4:  { date: "2026-06-06", done: false, scheduledAt: "2026-06-06", phase: "learning" },
      d7:  { date: "2026-06-09", done: false, scheduledAt: "2026-06-09", phase: "learning" },
      d21: { date: "2026-06-23", done: false, scheduledAt: "2026-06-23", phase: "review" },
      manutencao: null,
      reviewHistory: [],
      phase: "learning",
      relearning: null,
    },
  };
  if (overrides.rev) {
    base.rev = { ...base.rev, ...overrides.rev };
    delete overrides.rev;
  }
  return { ...base, ...overrides };
}

// ─── estimateTaskMinutes ──────────────────────────────────────────────────────

describe("estimateTaskMinutes", () => {
  it("returns 50 for new_topic", () => {
    expect(estimateTaskMinutes({ type: "new_topic" })).toBe(50);
  });
  it("returns 50 for d0_critical", () => {
    expect(estimateTaskMinutes({ type: "d0_critical" })).toBe(50);
  });
  it("returns relearning minutes when phase=relearning", () => {
    expect(estimateTaskMinutes({ type: "review", stepKey: "d1", phase: "relearning" })).toBe(20);
  });
  it("returns correct minutes per FSRS step", () => {
    expect(estimateTaskMinutes({ type: "review", stepKey: "d7", phase: "learning" })).toBe(30);
    expect(estimateTaskMinutes({ type: "review", stepKey: "d4", phase: "learning" })).toBe(25);
    expect(estimateTaskMinutes({ type: "review", stepKey: "manutencao", phase: "maintenance" })).toBe(25);
  });
  it("falls back to d4 minutes for unknown step", () => {
    expect(estimateTaskMinutes({ type: "review", stepKey: "unknown", phase: "learning" })).toBe(25);
  });
  it("returns 0 for null", () => {
    expect(estimateTaskMinutes(null)).toBe(0);
  });
});

// ─── sortAgendaItemsForDay ────────────────────────────────────────────────────

describe("sortAgendaItemsForDay", () => {
  const items = [
    { id: "new",      type: "new_topic",   priority: "ALTA",   stepKey: "d0" },
    { id: "rl",       type: "relearning",  priority: "ALTA",   stepKey: "d1" },
    { id: "overdue",  type: "overdue",     priority: "CRITICA", stepKey: "d1" },
    { id: "review",   type: "review",      priority: "ALTA",   stepKey: "d1" },
    { id: "critical", type: "d0_critical", priority: "CRITICA", stepKey: "d0" },
    { id: "weekly",   type: "weekly",      priority: "ALTA" },
    { id: "sim",      type: "simulation",  priority: "ALTA" },
  ];

  it("puts relearning first", () => {
    const sorted = sortAgendaItemsForDay(items);
    expect(sorted[0].id).toBe("rl");
  });
  it("puts overdue before regular review", () => {
    const sorted = sortAgendaItemsForDay(items);
    const iOverdue = sorted.findIndex((i) => i.id === "overdue");
    const iReview  = sorted.findIndex((i) => i.id === "review");
    expect(iOverdue).toBeLessThan(iReview);
  });
  it("puts d0_critical before new_topic", () => {
    const sorted = sortAgendaItemsForDay(items);
    const iCritical = sorted.findIndex((i) => i.id === "critical");
    const iNew      = sorted.findIndex((i) => i.id === "new");
    expect(iCritical).toBeLessThan(iNew);
  });
  it("puts simulation before weekly", () => {
    const sorted = sortAgendaItemsForDay(items);
    const iSim    = sorted.findIndex((i) => i.id === "sim");
    const iWeekly = sorted.findIndex((i) => i.id === "weekly");
    expect(iSim).toBeLessThan(iWeekly);
  });
  it("puts weekly last", () => {
    const sorted = sortAgendaItemsForDay(items);
    expect(sorted[sorted.length - 1].id).toBe("weekly");
  });
  it("does not mutate input", () => {
    const copy = [...items];
    sortAgendaItemsForDay(items);
    expect(items.map((i) => i.id)).toEqual(copy.map((i) => i.id));
  });
});

// ─── buildAgendaItems ─────────────────────────────────────────────────────────

describe("buildAgendaItems", () => {
  it("returns FSRS review items for due steps", () => {
    const items = buildAgendaItems([makeTema()], [], [], {}, "res", 30, TODAY);
    const d1 = items.find((i) => i.stepKey === "d1" && i.temaId === "tema-1");
    expect(d1).toBeTruthy();
    expect(d1.type).toBe("review");
    expect(items.filter((i) => i.temaId === "tema-1" && ["d1", "d4", "d7", "d21"].includes(i.stepKey))).toHaveLength(1);
  });

  it("does not project D4 while D1 is pending", () => {
    const items = buildAgendaItems([makeTema()], [], [], {}, "res", 30, TODAY);
    expect(items.some((i) => i.stepKey === "d4")).toBe(false);
  });

  it("returns D4 when D1 is done and D4 has a real date", () => {
    const tema = makeTema({
      rev: {
        d1: { date: TODAY, done: true, scheduledAt: TODAY, phase: "learning" },
        d4: { date: "2026-06-06", done: false, scheduledAt: "2026-06-06", phase: "learning" },
      },
    });
    const items = buildAgendaItems([tema], [], [], {}, "res", 30, TODAY);
    expect(items.some((i) => i.stepKey === "d4")).toBe(true);
    expect(items.some((i) => i.stepKey === "d7")).toBe(false);
  });

  it("does not jump to later steps when the next pending step has no real date", () => {
    const tema = makeTema({
      rev: {
        d1: { done: false, scheduledAt: null, phase: "learning" },
        d4: { date: "2026-06-06", done: false, scheduledAt: "2026-06-06", phase: "learning" },
      },
    });
    const items = buildAgendaItems([tema], [], [], {}, "res", 30, TODAY);
    expect(items.filter((i) => i.temaId === "tema-1")).toHaveLength(0);
  });

  it("marks overdue items and bumps date to today", () => {
    const tema = makeTema({
      rev: {
        d1: { date: PAST, done: false, scheduledAt: PAST, phase: "learning" },
        d4: null, d7: null, d21: null, manutencao: null,
        reviewHistory: [], phase: "learning", relearning: null,
      },
    });
    const items = buildAgendaItems([tema], [], [], {}, "res", 30, TODAY);
    const d1 = items.find((i) => i.temaId === "tema-1" && i.stepKey === "d1");
    expect(d1.overdue).toBe(true);
    expect(d1.type).toBe("overdue");
    expect(d1.date).toBe(TODAY);
    expect(d1.originalDate).toBe(PAST);
  });

  it("skips done steps", () => {
    const tema = makeTema({
      rev: {
        d1: { date: TODAY, done: true,  scheduledAt: TODAY, phase: "learning" },
        d4: null, d7: null, d21: null, manutencao: null,
        reviewHistory: [], phase: "learning", relearning: null,
      },
    });
    const items = buildAgendaItems([tema], [], [], {}, "res", 30, TODAY);
    expect(items.find((i) => i.stepKey === "d1" && i.temaId === "tema-1")).toBeFalsy();
  });

  it("returns D0 items from scheduledTopics for unstarted topics", () => {
    const scheduledTopics = [{
      temaId: "nova-topic",
      tema: "Cardiologia Avancada",
      area: "Clínica Médica",
      scheduledDate: TODAY,
      priority: "ALTA",
    }];
    const items = buildAgendaItems([], scheduledTopics, [], {}, "res", 30, TODAY);
    const d0 = items.find((i) => i.temaId === "nova-topic");
    expect(d0).toBeTruthy();
    expect(d0.type).toBe("new_topic");
    expect(d0.estimatedMinutes).toBe(50);
    expect(d0.stepKey).toBe("d0");
  });

  it("marks CRITICA scheduled topic as d0_critical", () => {
    const scheduledTopics = [{
      temaId: "critica-topic",
      scheduledDate: TODAY,
      priority: "CRITICA",
    }];
    const items = buildAgendaItems([], scheduledTopics, [], {}, "res", 30, TODAY);
    const d0 = items.find((i) => i.temaId === "critica-topic");
    expect(d0.type).toBe("d0_critical");
  });

  it("skips D0 for topics already started (d0.done=true)", () => {
    const temas = [makeTema({ id: "existente" })];
    const scheduledTopics = [{ temaId: "existente", scheduledDate: TODAY }];
    const items = buildAgendaItems(temas, scheduledTopics, [], {}, "res", 30, TODAY);
    const d0 = items.find((i) => i.temaId === "existente" && i.stepKey === "d0" && i.type === "new_topic");
    expect(d0).toBeFalsy();
  });

  it("skips unstarted temas from FSRS steps", () => {
    const tema = makeTema({ unstarted: true });
    const items = buildAgendaItems([tema], [], [], {}, "res", 30, TODAY);
    expect(items.filter((i) => i.temaId === "tema-1")).toHaveLength(0);
  });

  it("respects horizonDays — excludes items beyond horizon", () => {
    const temaFar = makeTema({
      rev: {
        d21: { date: FAR, done: false, scheduledAt: FAR, phase: "review" },
        d0: { date: PAST, done: true }, d1: null, d4: null, d7: null,
        manutencao: null, reviewHistory: [], phase: "review", relearning: null,
      },
    });
    const near = buildAgendaItems([temaFar], [], [], {}, "res", 10, TODAY);
    expect(near.some((i) => i.stepKey === "d21")).toBe(false);
    const far = buildAgendaItems([temaFar], [], [], {}, "res", 120, TODAY);
    expect(far.some((i) => i.stepKey === "d21")).toBe(true);
  });

  it("includes relearning items", () => {
    const tema = makeTema({
      rev: {
        d0: { date: PAST, done: true },
        d1: null, d4: null, d7: null, d21: null, manutencao: null,
        reviewHistory: [],
        phase: "relearning",
        relearning: { date: TODAY, done: false, targetStep: "d1" },
      },
    });
    const items = buildAgendaItems([tema], [], [], {}, "res", 30, TODAY);
    const rl = items.find((i) => i.type === "relearning" && i.temaId === "tema-1");
    expect(rl).toBeTruthy();
    expect(rl.phase).toBe("relearning");
  });

  it("puts treat_as_new domain test into agenda as D0", () => {
    const tema = makeTema({
      dominioPrevio: { status: "treat_as_new", classification: "treat_as_new" },
      domainTest: { classification: { label: "treat_as_new" } },
      rev: {
        d0: {
          date: TODAY,
          scheduledAt: TODAY,
          done: false,
          phase: "learning",
          source: "domain_test_treat_as_new",
          domainTestClassification: "treat_as_new",
        },
      },
    });
    const items = buildAgendaItems([tema], [], [], {}, "res", 30, TODAY);
    const d0 = items.find((i) => i.temaId === "tema-1" && i.stepKey === "d0");
    expect(d0).toBeTruthy();
    expect(d0.type).toBe("new_topic");
    expect(d0.domainTestClassification).toBe("treat_as_new");
    expect(d0.domainTestAgendaLabel).toBe("D0 normal");
    expect(d0.target.action).toBe("start_topic");
  });

  it("labels rescue domain test relearning as directed rescue", () => {
    const tema = makeTema({
      dominioPrevio: { status: "rescue_needed", classification: "rescue", conduta: "revisao_dirigida_mais_questoes" },
      domainTest: { classification: { label: "rescue" } },
      rev: {
        d0: { date: TODAY, done: false, skipped: true, skipReason: "domain_test_rescue" },
        d1: { date: TODAY, done: false, scheduledAt: TODAY, phase: "relearning" },
        phase: "relearning",
        relearning: {
          date: TODAY,
          done: false,
          targetStep: "d1",
          domainTestClassification: "rescue",
          conduta: "revisao_dirigida_mais_questoes",
        },
      },
    });
    const items = buildAgendaItems([tema], [], [], {}, "res", 30, TODAY);
    const rl = items.find((i) => i.type === "relearning" && i.temaId === "tema-1");
    expect(rl).toBeTruthy();
    expect(rl.domainTestClassification).toBe("rescue");
    expect(rl.domainTestAgendaLabel).toBe("Resgate dirigido");
    expect(rl.domainTestTaskLabel).toBe("Revisao dirigida");
    expect(rl.target.domainTestClassification).toBe("rescue");
  });

  it("keeps consolidated domain test out of D0 and exposes D21 metadata", () => {
    const tema = makeTema({
      dominioPrevio: { status: "validado_previo", validado: true, classification: "consolidated", primeiraRevisao: "d21", primeiraRevisaoDate: TODAY },
      domainTest: { classification: { label: "consolidated" } },
      rev: {
        d0: { date: TODAY, done: true, skipped: true, skippeadoPorDominio: true, domainTestClassification: "consolidated" },
        d1: { date: TODAY, done: true, skipped: true, skipReason: "domain_test_consolidated" },
        d4: { date: TODAY, done: true, skipped: true, skipReason: "domain_test_consolidated" },
        d7: { date: TODAY, done: true, skipped: true, skipReason: "domain_test_consolidated" },
        d21: { date: TODAY, scheduledAt: TODAY, done: false, phase: "review", source: "domain_test", domainTestClassification: "consolidated" },
      },
    });
    const items = buildAgendaItems([tema], [], [], {}, "res", 30, TODAY);
    expect(items.some((i) => i.temaId === "tema-1" && i.stepKey === "d0")).toBe(false);
    const d21 = items.find((i) => i.temaId === "tema-1" && i.stepKey === "d21");
    expect(d21).toBeTruthy();
    expect(d21.domainTestClassification).toBe("consolidated");
    expect(d21.domainTestAgendaLabel).toBe("Dominio consolidado");
  });

  it("includes simulados", () => {
    const simulados = [{ id: "sim-1", date: NEAR, nome: "ENAMED 2026", done: false }];
    const items = buildAgendaItems([], [], simulados, {}, "res", 30, TODAY);
    const sim = items.find((i) => i.type === "simulation");
    expect(sim).toBeTruthy();
    expect(sim.estimatedMinutes).toBe(120);
  });

  it("adds recommended baseline simulado when exam date exists and no simulado was done", () => {
    const items = buildAgendaItems(
      [makeTema()],
      [],
      [],
      { dataProva: "2026-10-25" },
      "res",
      30,
      TODAY
    );
    const sim = items.find((i) => i.type === "simulation" && i.recommended);
    expect(sim).toBeTruthy();
    expect(sim.date).toBe(TODAY);
    expect(sim.target).toMatchObject({ action: "simulation", recommended: true, tipo: "Baseline" });
  });

  it("does not duplicate recommended simulado when an open scheduled simulado exists", () => {
    const simulados = [{ id: "sim-1", date: NEAR, nome: "ENAMED 2026", done: false }];
    const items = buildAgendaItems([makeTema()], [], simulados, { dataProva: "2026-10-25" }, "res", 30, TODAY);
    expect(items.filter((i) => i.type === "simulation")).toHaveLength(1);
    expect(items.some((i) => i.recommended)).toBe(false);
  });

  it("is platform-neutral (vest items not filtered here)", () => {
    const items = buildAgendaItems([makeTema()], [], [], {}, "vest", 30, TODAY);
    expect(Array.isArray(items)).toBe(true);
  });

  it("collapses review group into one expandable task with groupId target", () => {
    const temas = [
      makeTema({ id: "a", nome: "Hipo I" }),
      makeTema({ id: "b", nome: "Hipo II" }),
      makeTema({ id: "c", nome: "Hipo III" }),
    ];
    const items = buildAgendaItems(
      temas,
      [],
      [],
      {},
      "res",
      30,
      TODAY,
      [{ id: "g-hipo", plat: "res", nome: "Grupo de revisão Hipo", temaIds: ["a", "b", "c"], criadoEm: TODAY, anchorStrategy: "same_day" }]
    );

    expect(items.filter((item) => item.type === "review" && ["a", "b", "c"].includes(item.temaId))).toHaveLength(0);
    const group = items.find((item) => item.type === "group_review");
    expect(group).toBeTruthy();
    expect(group.groupId).toBe("g-hipo");
    expect(group.subItems).toHaveLength(3);
    expect(group.target.params.groupId).toBe("g-hipo");
  });
});

// ─── groupAgendaByDate ────────────────────────────────────────────────────────

describe("groupAgendaByDate", () => {
  it("groups items by date key", () => {
    const items = [
      { id: "a", date: "2026-06-02" },
      { id: "b", date: "2026-06-03" },
      { id: "c", date: "2026-06-02" },
    ];
    const grouped = groupAgendaByDate(items);
    expect(grouped["2026-06-02"]).toHaveLength(2);
    expect(grouped["2026-06-03"]).toHaveLength(1);
  });
  it("skips items without date", () => {
    const grouped = groupAgendaByDate([{ id: "x" }]);
    expect(Object.keys(grouped)).toHaveLength(0);
  });
});

// ─── getAgendaDaySummary ──────────────────────────────────────────────────────

describe("getAgendaDaySummary", () => {
  const items = [
    { id: "1", type: "review",   date: TODAY, estimatedMinutes: 25, overdue: false, stepKey: "d1", priority: "ALTA" },
    { id: "2", type: "overdue",  date: TODAY, estimatedMinutes: 30, overdue: true,  stepKey: "d4", priority: "ALTA" },
    { id: "3", type: "new_topic",date: TODAY, estimatedMinutes: 50, overdue: false, stepKey: "d0", priority: "ALTA" },
  ];

  it("counts correctly", () => {
    const s = getAgendaDaySummary(items, TODAY);
    expect(s.totalCount).toBe(3);
    expect(s.totalItems).toBe(3);
    expect(s.totalMinutes).toBe(105);
    expect(s.estimatedMinutes).toBe(105);
    expect(s.overdueCount).toBe(1);
    expect(s.newCount).toBe(1);
    expect(s.newTopicCount).toBe(1);
    expect(s.reviewCount).toBe(2);
    expect(s.firstAction).toBeTruthy();
  });
  it("returns isEmpty=true for empty day", () => {
    expect(getAgendaDaySummary([], TODAY).isEmpty).toBe(true);
  });
  it("sets firstItem to top-priority after sort", () => {
    const mixedItems = [
      { id: "low",  type: "new_topic",  date: TODAY, priority: "MEDIA", stepKey: "d0", estimatedMinutes: 50 },
      { id: "high", type: "relearning", date: TODAY, priority: "ALTA",  stepKey: "d1", estimatedMinutes: 20 },
    ];
    const s = getAgendaDaySummary(mixedItems, TODAY);
    expect(s.firstItem.id).toBe("high");
  });
  it("filters by date when date param provided", () => {
    const mixed = [
      ...items,
      { id: "other", type: "review", date: "2026-06-03", estimatedMinutes: 25, overdue: false, stepKey: "d1", priority: "ALTA" },
    ];
    const s = getAgendaDaySummary(mixed, TODAY);
    expect(s.totalCount).toBe(3);
  });
});

// ─── buildAgendaMonth ─────────────────────────────────────────────────────────

describe("buildAgendaMonth", () => {
  it("returns 30 days for June 2026", () => {
    const result = buildAgendaMonth([], [], [], {}, "res", "2026-06", TODAY);
    expect(result.days).toHaveLength(30);
    expect(result.month).toBe("2026-06");
  });
  it("returns 31 days for July", () => {
    const result = buildAgendaMonth([], [], [], {}, "res", "2026-07", TODAY);
    expect(result.days).toHaveLength(31);
  });
  it("today slot has items when temas have due reviews", () => {
    const result = buildAgendaMonth([makeTema()], [], [], {}, "res", "2026-06", TODAY);
    const todaySlot = result.days.find((d) => d.date === TODAY);
    expect(todaySlot.totalCount).toBeGreaterThan(0);
  });
  it("totalMinutes sums all days", () => {
    const result = buildAgendaMonth([makeTema()], [], [], {}, "res", "2026-06", TODAY);
    const expected = result.days.reduce((sum, d) => sum + d.totalMinutes, 0);
    expect(result.totalMinutes).toBe(expected);
  });
});
