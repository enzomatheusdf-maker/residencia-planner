import {
  NAV_VIEW,
  PLAN_TAB,
  buildPlanAgendaTarget,
  getPrimaryNavItems,
  getMoreNavItems,
  getPlanTabFromTarget,
  normalizePlanTab,
  resolveViewLabel,
  normalizeView,
  isViewAvailable,
} from "./navigationModel";

test("primary desktop navigation has at most 6 items", () => {
  expect(getPrimaryNavItems("res").length).toBeLessThanOrEqual(6);
});

test("mobile primary navigation has at most 5 items", () => {
  expect(getPrimaryNavItems("res", { mobile: true }).length).toBeLessThanOrEqual(5);
});

test("dash label is Hoje", () => {
  expect(resolveViewLabel("dash")).toBe("Hoje");
});

test("crono label is Plano", () => {
  expect(resolveViewLabel("crono")).toBe("Plano");
});

test("sims label is Simulados", () => {
  expect(resolveViewLabel("sims")).toBe("Simulados");
});

test("raciocinio is primary for residencia when enabled", () => {
  const views = getPrimaryNavItems("res", { raciocinioClinico: true }).map((item) => item.view);
  expect(views).toContain(NAV_VIEW.CLINICAL_REASONING);
});

test("raciocinio is not available for vestibular", () => {
  expect(isViewAvailable("raciocinio", "vest", { raciocinioClinico: true })).toBe(false);
});

test("stats/database/guide and safety tools are exposed in more", () => {
  const views = getMoreNavItems("res").map((item) => item.view);
  expect(views).toContain(NAV_VIEW.STATS);
  expect(views).toContain(NAV_VIEW.DATABASE);
  expect(views).toContain(NAV_VIEW.GUIDE);
  expect(views).toContain(NAV_VIEW.DATA_SAFETY);
  expect(views).not.toContain(NAV_VIEW.LAUNCH_CHECKLIST);
});

test("legacy view labels still resolve", () => {
  expect(normalizeView("dashboard")).toBe("dash");
  expect(resolveViewLabel("simulados")).toBe("Simulados");
  expect(resolveViewLabel("estatisticas")).toBe("Estatísticas");
});

test("buildPlanAgendaTarget creates a direct Agenda target for Plano", () => {
  expect(buildPlanAgendaTarget({ date: "2026-06-03" })).toEqual({
    view: NAV_VIEW.PLAN,
    tab: PLAN_TAB.AGENDA,
    date: "2026-06-03",
  });
});

test("getPlanTabFromTarget accepts only valid Plano tabs", () => {
  expect(getPlanTabFromTarget({ view: "agenda", tab: "agenda" })).toBe(PLAN_TAB.AGENDA);
  expect(getPlanTabFromTarget({ view: "stats", tab: "agenda" })).toBe(PLAN_TAB.PLAN);
  expect(getPlanTabFromTarget({ view: "crono", tab: "bogus" })).toBe(PLAN_TAB.PLAN);
  expect(normalizePlanTab("AGENDA")).toBe(PLAN_TAB.AGENDA);
});
