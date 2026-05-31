import {
  checkLaunchReadiness,
  getLaunchChecklistItems,
  summarizeLaunchRisks,
} from "./launchReadiness";

describe("launchReadiness", () => {
  test("fail quando nao ha calendario", () => {
    const checks = checkLaunchReadiness({
      meta: { onboarding: { completed: true }, modulos: { enamed: true, raciocinioClinico: true } },
      actionInbox: [{ id: "a1", status: "open" }],
      enamedAnalises: [{ id: 1 }],
      backupAvailable: true,
      calendarProvider: { activeId: "" },
    });
    const calendar = checks.find((item) => item.id === "calendar-provider");
    expect(calendar.status).toBe("fail");
  });

  test("warn quando ENAMED sem prova", () => {
    const checks = checkLaunchReadiness({
      meta: { onboarding: { completed: true }, modulos: { enamed: true, raciocinioClinico: true } },
      actionInbox: [{ id: "a1", status: "open" }],
      enamedAnalises: [],
      backupAvailable: true,
      calendarProvider: { activeId: "medcof" },
    });
    const enamed = checks.find((item) => item.id === "enamed");
    expect(enamed.status).toBe("warn");
  });

  test("ok quando mentor gera acao", () => {
    const checks = checkLaunchReadiness({
      meta: { onboarding: { completed: true }, modulos: { enamed: false, raciocinioClinico: true } },
      actionInbox: [{ id: "a1", status: "open" }],
      enamedAnalises: [],
      backupAvailable: true,
      calendarProvider: { activeId: "medcof" },
    });
    const mentor = checks.find((item) => item.id === "mentor-action");
    expect(mentor.status).toBe("ok");
  });

  test("backup disponivel", () => {
    const checks = checkLaunchReadiness({
      meta: { onboarding: { completed: true }, modulos: { enamed: false, raciocinioClinico: true } },
      actionInbox: [{ id: "a1", status: "open" }],
      enamedAnalises: [],
      backupAvailable: true,
      calendarProvider: { activeId: "medcof" },
    });
    const backup = checks.find((item) => item.id === "backup");
    expect(backup.status).toBe("ok");
  });

  test("checklist ordenada por severidade", () => {
    const items = getLaunchChecklistItems({
      meta: { onboarding: { completed: false }, modulos: { enamed: true, raciocinioClinico: false } },
      actionInbox: [],
      enamedAnalises: [],
      backupAvailable: true,
      calendarProvider: { activeId: "" },
    });
    expect(items[0].status).toBe("fail");
    expect(items[items.length - 1].status).toBe("ok");
    const summary = summarizeLaunchRisks(items);
    expect(summary.total).toBe(items.length);
  });
});
