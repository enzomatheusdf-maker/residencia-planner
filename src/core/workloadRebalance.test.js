import { rebalanceWorkloadForToday } from "./workloadRebalance";

describe("rebalanceWorkloadForToday", () => {
  test("moves excess due-today reviews until the target minutes are respected", () => {
    const today = "2026-06-06";
    const temas = [
      { id: 1, nome: "Tema 1", rev: { d0: { done: false, date: today } } },
      { id: 2, nome: "Tema 2", rev: { d0: { done: false, date: today } } },
      { id: 3, nome: "Tema 3", rev: { d0: { done: false, date: today } } },
    ];

    const result = rebalanceWorkloadForToday(temas, { today, targetMinutes: 90 });

    expect(result.movedCount).toBe(1);
    expect(result.beforeTodayMinutes).toBe(135);
    expect(result.afterTodayMinutes).toBe(90);
    expect(result.temas.find((tema) => tema.id === 3).rev.d0.date).toBe("2026-06-07");
  });

  test("keeps the oldest pending reviews on today and moves less urgent items", () => {
    const today = "2026-06-06";
    const temas = [
      { id: 1, nome: "Mais antigo", rev: { d1: { done: false, date: "2026-06-01" } } },
      { id: 2, nome: "Hoje A", rev: { d4: { done: false, date: today } } },
      { id: 3, nome: "Hoje B", rev: { d4: { done: false, date: today } } },
    ];

    const result = rebalanceWorkloadForToday(temas, { today, targetMinutes: 30 });

    expect(result.movedCount).toBe(2);
    expect(result.afterTodayMinutes).toBe(12);
    expect(result.temas.find((tema) => tema.id === 1).rev.d1.date).toBe("2026-06-01");
    expect(result.temas.find((tema) => tema.id === 2).rev.d4.date).toBe("2026-06-07");
    expect(result.temas.find((tema) => tema.id === 3).rev.d4.date).toBe("2026-06-08");
  });

  test("returns a no-op result when the day is already under the target", () => {
    const today = "2026-06-06";
    const temas = [
      { id: 1, nome: "Tema 1", rev: { d1: { done: false, date: today } } },
    ];

    const result = rebalanceWorkloadForToday(temas, { today, targetMinutes: 60 });

    expect(result.movedCount).toBe(0);
    expect(result.temas).toBe(temas);
    expect(result.afterTodayMinutes).toBe(12);
  });
});
