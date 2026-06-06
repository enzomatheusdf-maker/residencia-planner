import { decideMentorAction } from "./mentorDecisionPolicy";

function baseContext(overrides = {}) {
  return {
    plat: "res",
    scheduler: {
      overdueCount: 0,
      dueTodayCount: 0,
      todayMinutes: 30,
      overloadLevelToday: "ok",
      overloadDays: 0,
      maxDelayDays: 0,
      relearningCount: 0,
      relearningItems: [],
      missingRatingWarnings: 0,
      missingReviewedAtCount: 0,
      trueRetentionCollecting: false,
      ...overrides.scheduler,
    },
    calendarProvider: { activeId: "medcof" },
    enamed: null,
    weakSubject: null,
    clinical: { dueCount: 0, dueItems: [] },
    pendingExamAnalysis: false,
    userAvailableMinutes: 120,
    ...overrides,
  };
}

describe("mentorDecisionPolicy", () => {
  test("sobrecarga alta bloqueia tema novo", () => {
    const action = decideMentorAction(baseContext({
      scheduler: { overloadLevelToday: "high", overloadDays: 3, todayMinutes: 150 },
    }));
    expect(action.type).toBe("workload_relief");
  });

  test("relearning ganha de tema novo", () => {
    const action = decideMentorAction(baseContext({
      scheduler: {
        relearningCount: 1,
        relearningItems: [{ temaId: 1, temaNome: "Apendicite", targetStep: "d4" }],
      },
    }));
    expect(action.type).toBe("relearning");
  });

  test("revisão vencida ganha de ENAMED", () => {
    const action = decideMentorAction(baseContext({
      enamed: { resumo: { areaCritica: "GO" } },
      scheduler: {
        overdueCount: 1,
        nextDueItem: { temaId: 10, temaNome: "Tema X", stepKey: "d7", date: "2026-06-01" },
      },
    }));
    expect(action.type).toBe("revisao_vencida");
  });

  test("true retention coletando não vira preparo alto/baixo", () => {
    const action = decideMentorAction(baseContext({
      scheduler: { dueTodayCount: 2, trueRetentionCollecting: true },
    }));
    expect(action.explain.join(" ")).toMatch(/coletando/i);
  });

  test("ação sempre tem target e explain", () => {
    const action = decideMentorAction(baseContext());
    expect(action.target).toBeDefined();
    expect(Array.isArray(action.explain)).toBe(true);
    expect(action.explain.length).toBeGreaterThan(0);
  });

  test("plat vest não gera ação ENAMED", () => {
    const action = decideMentorAction(baseContext({
      plat: "vest",
      enamed: { resumo: { areaCritica: "GO" } },
    }));
    expect(action.type).not.toBe("enamed_critico");
  });

  test("plat vest não gera caso clínico", () => {
    const action = decideMentorAction(baseContext({
      plat: "vest",
      clinical: { dueCount: 2, dueItems: [{ casoId: "c1" }] },
    }));
    expect(action.type).not.toBe("clinical_case");
  });

  test("provider ativo influencia sugestão de tema novo", () => {
    const action = decideMentorAction(baseContext({
      calendarProvider: { activeId: "custom_provider" },
    }));
    expect(action.type).toBe("new_topic");
    expect(action.target.providerId).toBe("custom_provider");
  });

  test("fila vazia com duas areas consolidadas gera interleaving_block", () => {
    const action = decideMentorAction(baseContext({
      consolidatedCorpus: 2,
      operationalMode: {
        mode: "normal",
        flags: { canStartNewTopic: true },
        policy: { newTopicBias: 0 },
      },
      readinessData: {
        priorityList: [
          { area: "Clinica Medica", incidence: 1.4, prioridade: 1.2 },
          { area: "Cirurgia", incidence: 0.8, prioridade: 0.7 },
        ],
      },
      mastery: {
        byArea: {
          "Clinica Medica": { area: "Clinica Medica", pMastery: 0.3 },
          Cirurgia: { area: "Cirurgia", pMastery: 0.2 },
        },
      },
    }));

    expect(action.type).toBe("interleaving_block");
    expect(action.ctaView).toBe("focus");
    expect(action.target.action).toBe("interleaving_block");
    expect(action.target.area).toBe("Clinica Medica");
  });

  test("fila vazia sem corpus consolidado mantem tema novo", () => {
    const action = decideMentorAction(baseContext({
      consolidatedCorpus: 0,
      operationalMode: {
        mode: "normal",
        flags: { canStartNewTopic: true },
        policy: { newTopicBias: 0 },
      },
    }));

    expect(action.type).toBe("new_topic");
  });

  test("ação de prova pendente aparece quando fila está segura", () => {
    const action = decideMentorAction(baseContext({
      pendingExamAnalysis: true,
    }));
    expect(action.type).toBe("exam_analysis");
  });

  test("operationalMode de sobrecarga nunca retorna tema novo", () => {
    const action = decideMentorAction(baseContext({
      scheduler: { overloadLevelToday: "ok", overloadDays: 0, todayMinutes: 20 },
      operationalMode: {
        mode: "sobrecarga",
        flags: {
          canStartNewTopic: false,
          shouldPreferReview: true,
          shouldPreferRecovery: false,
          shouldReduceVolume: true,
        },
        policy: { newTopicBias: -50 },
      },
    }));

    // Invariante: sob sobrecarga nunca abre tema novo. Como hoje esta leve
    // (20 min, sem fila), o Rebalancear nao deve sequestrar a tela.
    expect(action.type).not.toBe("new_topic");
    expect(action.type).not.toBe("workload_relief");
  });

  test("sobrecarga de sobrecarga com hoje pesado ainda recomenda rebalancear", () => {
    const action = decideMentorAction(baseContext({
      scheduler: { overloadLevelToday: "high", overloadDays: 3, todayMinutes: 150 },
      operationalMode: {
        mode: "sobrecarga",
        flags: { canStartNewTopic: false, shouldReduceVolume: true },
        policy: { newTopicBias: -50 },
      },
    }));
    expect(action.type).toBe("workload_relief");
  });

  test("overload so de horizonte (hoje leve) nao mostra rebalancear; cai na fila do dia", () => {
    const action = decideMentorAction(baseContext({
      scheduler: { overloadLevelToday: "ok", overloadDays: 3, todayMinutes: 60, dueTodayCount: 2 },
    }));
    expect(action.type).not.toBe("workload_relief");
    expect(action.type).toBe("fila_do_dia");
  });

  test("apos rebalancear sem mover nada, nao reaparece rebalancear; cai na fila do dia", () => {
    const action = decideMentorAction(baseContext({
      today: "2026-06-06",
      scheduler: { overloadLevelToday: "high", overloadDays: 3, todayMinutes: 150, dueTodayCount: 3 },
      lastWorkloadRebalance: { date: "2026-06-06", movedCount: 0 },
    }));
    expect(action.type).not.toBe("workload_relief");
    expect(action.type).toBe("fila_do_dia");
  });

  test("tema novo escolhe area de baixa maestria e alta incidencia", () => {
    const action = decideMentorAction(baseContext({
      operationalMode: {
        mode: "normal",
        flags: { canStartNewTopic: true },
        policy: { newTopicBias: 0 },
      },
      readinessData: {
        priorityList: [
          { area: "Clinica Medica", incidence: 1.4, prioridade: 1.2 },
          { area: "Cirurgia", incidence: 0.6, prioridade: 0.8 },
        ],
      },
      mastery: {
        byArea: {
          "Clinica Medica": { area: "Clinica Medica", pMastery: 0.25 },
          Cirurgia: { area: "Cirurgia", pMastery: 0.4 },
        },
      },
    }));

    expect(action.type).toBe("new_topic");
    expect(action.target.area).toBe("Clinica Medica");
  });

  test("replan_intention vira acao recomendada quando needsReplan e true", () => {
    const action = decideMentorAction(baseContext({
      studyPlanIntention: { cue: "Ao acordar", action: "fazer MedRev", window: "07:00" },
      studyPlanIntentionNeedsReplan: true,
    }));
    expect(action.type).toBe("replan_intention");
    expect(action.priority).toBe(91);
    expect(action.explain.join(" ")).toContain("sugere redefinir o gatilho");
  });

  // anki_check fica abaixo de new_topic na cadeia; so dispara quando new_topic esta bloqueado.
  // Simulamos isso com operationalMode bloqueando canStartNewTopic.
  const ctxAnkiBase = {
    operationalMode: {
      mode: "sobrecarga",
      flags: { canStartNewTopic: false, shouldReduceVolume: true },
      policy: { newTopicBias: -100 },
    },
    scheduler: { overloadLevelToday: "ok", overloadDays: 0, todayMinutes: 20 },
  };

  test("anki_check nao aparece quando anki ja foi feito hoje (cai em rest)", () => {
    const action = decideMentorAction(baseContext({ ...ctxAnkiBase, ankiDoneToday: true }));
    expect(action.type).not.toBe("anki_check");
    expect(action.type).toBe("rest");
  });

  test("anki_check aparece quando anki nao foi feito hoje e new_topic bloqueado", () => {
    const action = decideMentorAction(baseContext({ ...ctxAnkiBase, ankiDoneToday: false }));
    expect(action.type).toBe("anki_check");
  });

  test("clinical_case vira acao recomendada com titulo especifico se temaName existe", () => {
    const actionA = decideMentorAction(baseContext({
      clinical: { dueCount: 1, dueItems: [{ casoId: "c1", temaName: "Apendicite" }] },
    }));
    expect(actionA.type).toBe("clinical_case");
    expect(actionA.title).toBe("Treinar raciocínio: Apendicite");

    const actionB = decideMentorAction(baseContext({
      clinical: { dueCount: 1, dueItems: [{ casoId: "c1" }] },
    }));
    expect(actionB.type).toBe("clinical_case");
    expect(actionB.title).toBe("Treinar caso clínico pendente");
  });
});
