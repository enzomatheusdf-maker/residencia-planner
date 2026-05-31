import { explainMentorAction, getMentorNextAction, getMentorTodayPlan } from "./mentorAutopilot";

describe("mentorAutopilot", () => {
  test("prioriza revisão vencida quando existe", () => {
    const action = getMentorNextAction({ pending: 6, overdue: 2, readiness: 70 });
    expect(action.type).toBe("revisao_vencida");
  });

  test("usa lacuna ENAMED quando não há pendência urgente", () => {
    const action = getMentorNextAction({
      pending: 0,
      overdue: 0,
      enamed: { resumo: { areaCritica: "GO" } },
      readiness: 75,
    });
    expect(action.type).toBe("enamed_critico");
  });

  test("gera plano de hoje com pelo menos uma ação", () => {
    const plan = getMentorTodayPlan({ pending: 0, overdue: 0, readiness: 85 });
    expect(Array.isArray(plan)).toBe(true);
    expect(plan.length).toBeGreaterThan(0);
  });

  test("vest prioriza matéria fraca e não usa ação ENAMED", () => {
    const action = getMentorNextAction({
      plat: "vest",
      pending: 0,
      overdue: 0,
      enamed: { resumo: { areaCritica: "GO" } },
      weakSubject: "Matemática",
      readiness: 75,
    });
    expect(action.type).toBe("vestibular_materia_fraca");
  });

  test("explicação textual inclui motivo", () => {
    const text = explainMentorAction({
      title: "Zerar fila",
      reason: "evitar acúmulo",
    });
    expect(text).toMatch("evitar acúmulo");
  });
});
