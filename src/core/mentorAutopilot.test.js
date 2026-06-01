import { explainMentorAction, getMentorNextAction, getMentorTodayPlan } from "./mentorAutopilot";

describe("mentorAutopilot", () => {
  test("prioriza revisão vencida quando existe", () => {
    const action = getMentorNextAction({ overdue: 2, pending: 4 });
    expect(action.type).toBe("revisao_vencida");
    expect(action.target).toBeDefined();
  });

  test("gera ação com schema completo", () => {
    const action = getMentorNextAction({ pending: 0, overdue: 0, userAvailableMinutes: 120 });
    expect(action.id).toBeTruthy();
    expect(typeof action.priority).toBe("number");
    expect(Array.isArray(action.explain)).toBe(true);
    expect(action.target).toBeDefined();
  });

  test("vest usa matéria fraca e não usa ENAMED", () => {
    const action = getMentorNextAction({
      plat: "vest",
      pending: 0,
      overdue: 0,
      weakSubject: "Matemática",
      enamed: { resumo: { areaCritica: "GO" } },
    });
    expect(action.type).toBe("vestibular_materia_fraca");
  });

  test("plano diário retorna lista de ações explicáveis", () => {
    const plan = getMentorTodayPlan({ pending: 1, overdue: 0 });
    expect(Array.isArray(plan)).toBe(true);
    expect(plan.length).toBeGreaterThan(0);
  });

  test("explicação textual inclui motivo estruturado", () => {
    const text = explainMentorAction({
      title: "Fechar fila",
      explain: ["Evitar acúmulo nas próximas 24h."],
    });
    expect(text).toMatch("Evitar acúmulo");
  });
});
