import {
  getPendingSessionClosure,
  hasSessionClosureHistory,
} from "./sessionClosure";

const tema = { id: "tema-1", nome: "Apendicite", esp: "Cirurgia" };

describe("sessionClosure", () => {
  test("nao cria pendencia apenas por foco iniciado", () => {
    const result = getPendingSessionClosure({
      meta: {
        lastFocusSessionAt: "2026-06-04T10:00:00.000Z",
        lastFocusThemeId: "tema-1",
      },
      temas: [tema],
      sessionReflections: [],
      plat: "res",
    });

    expect(result.hasPendingClosure).toBe(false);
  });

  test("cria pendencia quando sessao concluida nao tem fechamento posterior", () => {
    const result = getPendingSessionClosure({
      meta: {
        lastCompletedFocusSessionAt: "2026-06-04T10:30:00.000Z",
        lastCompletedFocusThemeId: "tema-1",
        lastCompletedFocusStepKey: "d1",
        lastReflectionAt: "2026-06-04T10:00:00.000Z",
      },
      temas: [tema],
      sessionReflections: [],
      plat: "res",
    });

    expect(result.hasPendingClosure).toBe(true);
    expect(result.theme.nome).toBe("Apendicite");
    expect(result.stepKey).toBe("d1");
  });

  test("historico persistido no banco fecha a pendencia da sessao concluida", () => {
    expect(
      hasSessionClosureHistory({
        completedAt: "2026-06-04T10:30:00.000Z",
        plat: "res",
        sessionReflections: [
          {
            id: "ref-1",
            date: "2026-06-04",
            createdAt: "2026-06-04T10:35:00.000Z",
            plat: "res",
          },
        ],
      })
    ).toBe(true);

    const result = getPendingSessionClosure({
      meta: {
        lastCompletedFocusSessionAt: "2026-06-04T10:30:00.000Z",
        lastCompletedFocusThemeId: "tema-1",
      },
      temas: [tema],
      sessionReflections: [
        {
          id: "ref-1",
          date: "2026-06-04",
          createdAt: "2026-06-04T10:35:00.000Z",
          plat: "res",
        },
      ],
      plat: "res",
    });

    expect(result.hasPendingClosure).toBe(false);
  });
});
