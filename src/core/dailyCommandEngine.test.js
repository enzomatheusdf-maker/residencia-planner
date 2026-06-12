import {
  buildDailyCommand,
  buildPendingClosureCommand,
  legacyActionToDailyCommand,
} from "./dailyCommandEngine";

describe("dailyCommandEngine", () => {
  test("sessao aberta vira continue_session com target executavel", () => {
    const command = buildPendingClosureCommand({
      hasPendingClosure: true,
      theme: { id: "t1", nome: "Apendicite" },
      stepKey: "d1",
    }, { plat: "res" });

    expect(command.type).toBe("continue_session");
    expect(command.target).toEqual({ route: "session_closure", params: { temaId: "t1", stepKey: "d1" } });
    expect(command.reason).toBeTruthy();
  });

  test("sem plano completo vira plan_setup", () => {
    const command = buildDailyCommand({
      requirePlanSetup: true,
      context: { plat: "res" },
    });

    expect(command.type).toBe("plan_setup");
    expect(command.target.route).toBe("settings");
    expect(command.blockedReason).toBe("plan_setup_incomplete");
  });

  test("revisao vencida com tema e etapa abre foco direto", () => {
    const command = legacyActionToDailyCommand({
      type: "revisao_vencida",
      title: "Resolver vencida: GO",
      reason: "Atraso exige revisao.",
      target: { temaId: "tema-1", stepKey: "d4" },
    }, { plat: "res" });

    expect(command.type).toBe("overdue_review");
    expect(command.target).toEqual({ route: "focus", params: { temaId: "tema-1", stepKey: "d4", phase: null } });
  });

  test("grupo de revisão abre foco com groupId", () => {
    const command = legacyActionToDailyCommand({
      type: "fila_do_dia",
      title: "Revisar grupo",
      reason: "Grupo co-agendado.",
      target: { groupId: "grupo-1", plat: "res" },
    }, { plat: "res" });

    expect(command.target).toEqual({ route: "focus", params: { groupId: "grupo-1", plat: "res" } });
  });

  test("fila do dia sem item especifico abre fila executavel", () => {
    const command = legacyActionToDailyCommand({
      type: "fila_do_dia",
      reason: "Fechar fila.",
      target: { action: "close_today_queue", plat: "res" },
    }, { plat: "res" });

    expect(command.type).toBe("today_review");
    expect(command.target.route).toBe("focus");
    expect(command.target.params.mode).toBe("queue");
  });

  test("simulado pendente de analise vira simulation_audit", () => {
    const command = legacyActionToDailyCommand({
      type: "exam_analysis",
      reason: "Analisar prova.",
      target: { action: "analyze_exam" },
    }, { plat: "res" });

    expect(command.type).toBe("simulation_audit");
    expect(command.target.route).toBe("simulations");
  });

  test("anki usa rota anki e sempre tem contrato completo", () => {
    const command = legacyActionToDailyCommand({
      type: "anki_check",
      reason: "Bloco curto.",
      target: { action: "anki_quick_block" },
    }, { plat: "res" });

    expect(command.type).toBe("anki");
    expect(command.target.route).toBe("anki");
    expect(command.expectedBenefit).toBeTruthy();
    expect(command.riskIfIgnored).toBeTruthy();
    expect(command.sourceSignals.length).toBeGreaterThan(0);
  });

  test("fallback nunca e vazio", () => {
    const command = buildDailyCommand({ context: { plat: "vest" } });

    expect(command.type).toBe("rest_or_light_day");
    expect(command.title).toBeTruthy();
    expect(command.reason).toBeTruthy();
    expect(command.target.route).toBe("stats");
  });

  test("ajustar plano usa settings e nao uma view falsa", () => {
    const command = legacyActionToDailyCommand({
      type: "replan_intention",
      reason: "Plano precisa ajuste.",
      ctaView: "ajustes",
      target: { action: "replan_intention" },
    }, { plat: "res" });

    expect(command.type).toBe("adjust_plan");
    expect(command.target.route).toBe("settings");
    expect(command.target.params.tab).toBe("ajustes");
  });

  test("comando sempre tem target route e reason nos tipos criticos", () => {
    const actions = [
      { type: "workload_relief", reason: "Carga alta.", target: { action: "rebalance_workload" } },
      { type: "simulation", reason: "Calibrar.", target: { action: "simulation", recommended: true } },
      { type: "clinical_case", reason: "Caso venceu.", target: { casoId: "c1" } },
      { type: "new_topic", reason: "Fila segura.", target: { action: "start_new_topic" } },
      { type: "rest", reason: "Dia leve.", target: { action: "light_block_or_rest" } },
    ];

    actions.forEach((action) => {
      const command = legacyActionToDailyCommand(action, { plat: "res" });
      expect(command.reason).toBeTruthy();
      expect(command.target.route).toBeTruthy();
    });
  });
});
