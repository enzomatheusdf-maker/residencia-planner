import {
  NAV_VIEW,
  getPrimaryNavItems,
  getMoreNavItems,
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

test("sims label is Estudar", () => {
  expect(resolveViewLabel("sims")).toBe("Estudar");
});

test("raciocinio is in more for residencia", () => {
  const views = getMoreNavItems("res", { raciocinioClinico: true }).map((item) => item.view);
  expect(views).toContain(NAV_VIEW.CLINICAL_REASONING);
});

test("raciocinio is not available for vestibular", () => {
  expect(isViewAvailable("raciocinio", "vest", { raciocinioClinico: true })).toBe(false);
});

test("guide/settings stay hidden and weekly review/data safety are exposed in more", () => {
  const views = getMoreNavItems("res").map((item) => item.view);
  expect(views).not.toContain(NAV_VIEW.GUIDE);
  expect(views).not.toContain(NAV_VIEW.SETTINGS);
  expect(views).toContain(NAV_VIEW.WEEKLY_REVIEW);
  expect(views).toContain(NAV_VIEW.DATA_SAFETY);
  expect(views).not.toContain(NAV_VIEW.LAUNCH_CHECKLIST);
});

test("legacy view labels still resolve", () => {
  expect(normalizeView("dashboard")).toBe("dash");
  expect(resolveViewLabel("simulados")).toBe("Estudar");
  expect(resolveViewLabel("estatisticas")).toBe("Estatísticas");
});
