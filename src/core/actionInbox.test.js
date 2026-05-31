import { buildActionInbox, createAction, dedupeActions, pickPrimaryAction, sortActions } from "./actionInbox";

describe("actionInbox", () => {
  test("deduplica por tipo + tema/area + dueDate", () => {
    const deduped = dedupeActions([
      createAction({ type: "review", title: "Revisar GO", priority: 80, dueDate: "2026-06-01", target: { tema: "GO" } }),
      createAction({ type: "review", title: "Revisar GO 2", priority: 95, dueDate: "2026-06-01", target: { tema: "GO" } }),
    ]);
    expect(deduped.length).toBe(1);
    expect(deduped[0].priority).toBe(95);
  });

  test("ordena por prioridade", () => {
    const sorted = sortActions([
      createAction({ type: "review", title: "A", priority: 70 }),
      createAction({ type: "review", title: "B", priority: 90 }),
    ]);
    expect(sorted[0].title).toBe("B");
  });

  test("acao vencida sobe para o topo", () => {
    const sorted = sortActions([
      createAction({ type: "review", title: "Hoje", priority: 95, dueDate: "2099-12-01" }),
      createAction({ type: "review", title: "Vencida", priority: 10, dueDate: "2020-01-01" }),
    ]);
    expect(sorted[0].title).toBe("Vencida");
  });

  test("escolhe acao principal", () => {
    const primary = pickPrimaryAction([
      createAction({ type: "review", title: "Menor", priority: 20 }),
      createAction({ type: "review", title: "Maior", priority: 80 }),
    ]);
    expect(primary.title).toBe("Maior");
  });

  test("status dismiss/done remove da fila derivada", () => {
    const inbox = buildActionInbox({
      actions: [
        { id: "a1", type: "review", title: "R1", priority: 90 },
        { id: "a2", type: "review", title: "R2", priority: 80 },
      ],
      actionInboxState: {
        dismissed: { a1: true },
        done: { a2: true },
      },
    });
    expect(inbox.length).toBe(0);
  });
});

