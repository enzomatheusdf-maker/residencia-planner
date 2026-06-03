import {
  buildContextualWeeklyActions,
  canShowWeeklyReview,
  WEEKLY_REVIEW_LOCKED_MESSAGE,
} from "./weeklyReviewGate";

describe("weeklyReviewGate", () => {
  test("libera por numero minimo de sessoes", () => {
    expect(canShowWeeklyReview({ sessionsCompleted: 5 })).toBe(true);
  });

  test("libera por volume rastreado", () => {
    expect(canShowWeeklyReview({ trackedVolume: 20 })).toBe(true);
  });

  test("bloqueia quando ainda nao ha maturidade", () => {
    expect(canShowWeeklyReview({ today: "2026-06-08", firstActivityDate: "2026-06-05", sessionsCompleted: 2, trackedVolume: 5 })).toBe(false);
    expect(WEEKLY_REVIEW_LOCKED_MESSAGE).toMatch(/alguns dias de uso/);
  });

  test("monta acoes contextuais sem itens genericos", () => {
    const actions = buildContextualWeeklyActions({
      hasSchedule: false,
      sessionsCompleted: 0,
      weakArea: "Preventiva",
      hasUnstartedTopics: true,
      overdueCount: 4,
    });
    expect(actions.map((item) => item.label)).toContain("Importar cronograma");
    expect(actions.map((item) => item.label)).toContain("Começar primeiro ciclo");
    expect(actions.some((item) => item.label === "Focar área fraca" || item.label === "Recuperar atrasadas")).toBe(true);
  });
});
