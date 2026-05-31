import {
  buildWeeklyReview,
  createSessionReflection,
  reflectionToAction,
  summarizeReflections,
} from "./sessionReflection";

describe("sessionReflection", () => {
  test("cria reflection valida com defaults", () => {
    const reflection = createSessionReflection({ source: "focus", tema: "Apendicite" });
    expect(reflection.id.startsWith("ref_")).toBe(true);
    expect(reflection.source).toBe("focus");
    expect(reflection.outcome).toBe("medio");
  });

  test("sumariza ultimos 7 dias", () => {
    const summary = summarizeReflections(
      [
        createSessionReflection({ date: "2026-05-30", outcome: "ruim", mainIssue: "conteudo" }),
        createSessionReflection({ date: "2026-05-31", outcome: "bom", mainIssue: "energia" }),
        createSessionReflection({ date: "2026-04-01", outcome: "ruim", mainIssue: "raciocinio" }),
      ],
      7,
      "2026-05-31"
    );
    expect(summary.total).toBe(2);
    expect(summary.byIssue.conteudo).toBe(1);
    expect(summary.lowEnergyCount).toBe(1);
  });

  test("gera acao recomendada a partir do problema", () => {
    const action = reflectionToAction(
      createSessionReflection({
        outcome: "ruim",
        mainIssue: "raciocinio",
        tema: "Insuficiencia Cardiaca",
        source: "focus",
      })
    );
    expect(action.type).toBe("clinical_case");
    expect(action.priority).toBeGreaterThanOrEqual(90);
  });

  test("buildWeeklyReview monta plano enxuto", () => {
    const review = buildWeeklyReview({
      today: "2026-05-31",
      reflections: [createSessionReflection({ date: "2026-05-31", mainIssue: "tempo" })],
      actionInbox: [{ title: "Revisar GO", type: "review" }, { title: "Caso de Sepse", type: "clinical_case" }],
      sessionsCompleted: 4,
      revisoesDone: 12,
    });

    expect(review.executed.sessions).toBe(4);
    expect(review.plan.priorities.length).toBeGreaterThan(0);
  });
});

