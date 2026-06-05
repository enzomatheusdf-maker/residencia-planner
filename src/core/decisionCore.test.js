import { buildDecisionCoreSnapshot, buildActionInboxFromDecisionCore } from "./decisionCore";
import { useStore } from "./store";

function baseState(overrides = {}) {
  const plat = overrides.plat || "res";
  return {
    plat,
    [plat]: {
      temas: [],
      simulados: [],
      ankiLog: [],
      cronogramas: [],
      casosProgresso: {},
      ...overrides[plat]
    },
    calendarProvider: { activeId: "medcof", ...(overrides.calendarProvider || {}) },
    enamedAnalises: overrides.enamedAnalises || [],
    actionInbox: overrides.actionInbox || [],
    actionInboxState: overrides.actionInboxState || { dismissed: {}, accepted: {}, done: {} },
    sessionReflections: overrides.sessionReflections || [],
    meta: {
      dataProva: "2026-09-13",
      tempoDisponivel: 2,
      ...(overrides.meta || {})
    },
    ...overrides
  };
}

describe("decisionCore", () => {
  const today = "2026-06-04";

  test("1. revisao vencida gera acao primaria de revisao", () => {
    const state = baseState({
      res: {
        temas: [
          {
            id: 1,
            nome: "Apendicite",
            unstarted: false,
            rev: {
              d1: { done: false, date: "2026-06-01" } // data passada
            }
          }
        ]
      }
    });

    const snapshot = buildDecisionCoreSnapshot(state, { today });
    expect(snapshot.today).toBe(today);
    expect(snapshot.plat).toBe("res");
    expect(snapshot.primaryAction).toBe(snapshot.mentorAction);
    expect(snapshot.mentorAction.type).toBe("revisao_vencida");
    expect(snapshot.inboxActions[0].type).toBe("revisao_vencida");

    const inbox = buildActionInboxFromDecisionCore(state, { today });
    expect(inbox.length).toBeGreaterThan(0);
    expect(inbox[0].type).toBe("revisao_vencida");
  });

  test("2. sobrecarga tem prioridade sobre tema novo", () => {
    // Para gerar sobrecarga alta, precisamos de > 120 minutos estimativos hoje
    // Vamos criar 3 temas com d0 agendado para hoje (3 * 45 = 135 minutos)
    const state = baseState({
      res: {
        temas: [
          {
            id: 1,
            nome: "Tema 1",
            unstarted: false,
            rev: {
              d0: { done: false, date: today }
            }
          },
          {
            id: 2,
            nome: "Tema 2",
            unstarted: false,
            rev: {
              d0: { done: false, date: today }
            }
          },
          {
            id: 3,
            nome: "Tema 3",
            unstarted: false,
            rev: {
              d0: { done: false, date: today }
            }
          }
        ]
      }
    });

    const snapshot = buildDecisionCoreSnapshot(state, { today });
    // Sobrecarga deve resultar em workload_relief
    expect(snapshot.mentorAction.type).toBe("workload_relief");
    expect(snapshot.diagnosticsLite).toMatchObject({
      safety: "caution",
      decisionType: "workload_relief",
      priority: 95,
      confidence: 0.9
    });
    expect(snapshot.warnings).toEqual([]);

    const inbox = buildActionInboxFromDecisionCore(state, { today });
    expect(inbox.length).toBeGreaterThan(0);
    expect(inbox[0].type).toBe("workload_relief");
  });

  test("3. ActionInbox gerado contem fonte mentor-v2", () => {
    const state = baseState({
      res: {
        temas: [
          {
            id: 1,
            nome: "Apendicite",
            unstarted: false,
            rev: {
              d1: { done: false, date: "2026-06-01" }
            }
          }
        ]
      }
    });

    const inbox = buildActionInboxFromDecisionCore(state, { today });
    expect(inbox.length).toBeGreaterThan(0);
    expect(inbox[0].source).toBe("mentor-v2");
  });

  test("4. nao duplica acao de revisao por politica do store", () => {
    // Se houvesse politicas duplicadas, o buildActionInbox original adicionaria itens baseados em candidates + overdue + pending.
    // Mas buildActionInboxFromDecisionCore deve usar apenas o mentorAction retornado do decisionCore snapshot
    // e nenhuma acao paralela do store antiga de candidatos.
    const state = baseState({
      res: {
        temas: [
          {
            id: 1,
            nome: "Apendicite",
            unstarted: false,
            rev: {
              d1: { done: false, date: "2026-06-01" }
            }
          }
        ]
      }
    });

    const inbox = buildActionInboxFromDecisionCore(state, { today });
    // Deve haver apenas 1 acao correspondente a revisao vencida
    const reviews = inbox.filter(act => act.type === "revisao_vencida");
    expect(reviews.length).toBe(1);
  });

  test("5. mantem accepted/dismissed/done do actionInboxState", () => {
    const state = baseState({
      res: {
        temas: [
          {
            id: 1,
            nome: "Apendicite",
            unstarted: false,
            rev: {
              d1: { done: false, date: "2026-06-01" }
            }
          }
        ]
      },
      actionInboxState: {
        dismissed: {
          "mentor_revisao_vencida_1": today
        },
        done: {},
        accepted: {}
      }
    });

    const inbox = buildActionInboxFromDecisionCore(state, { today });
    // Como a acao unica de revisao_vencida (id: mentor_revisao_vencida_1) esta descartada (dismissed),
    // ela nao deve estar presente no inbox final.
    const hasOverdue = inbox.some(act => act.id === "mentor_revisao_vencida_1");
    expect(hasOverdue).toBe(false);
  });

  test("6. preserva acao accepted e filtra dismissed/done via actionInboxState", () => {
    const state = baseState({
      res: {
        temas: [
          {
            id: 1,
            nome: "Apendicite",
            unstarted: false,
            rev: {
              d1: { done: false, date: "2026-06-01" }
            }
          }
        ]
      },
      sessionReflections: [
        { id: "keep", date: today, outcome: "medio", mainIssue: "tempo", confidence: "media", nextAdjustment: "questoes", tema: "Tempo" },
        { id: "drop", date: today, outcome: "medio", mainIssue: "energia", confidence: "media", nextAdjustment: "descanso", tema: "Energia" },
        { id: "done", date: today, outcome: "medio", mainIssue: "conteudo", confidence: "media", nextAdjustment: "revisar", tema: "Conteudo" },
      ],
      actionInboxState: {
        accepted: { act_ref_keep: today },
        dismissed: { act_ref_drop: today },
        done: { act_ref_done: today }
      }
    });

    const inbox = buildActionInboxFromDecisionCore(state, { today });
    expect(inbox.find((act) => act.id === "act_ref_keep")?.status).toBe("accepted");
    expect(inbox.some((act) => act.id === "act_ref_drop")).toBe(false);
    expect(inbox.some((act) => act.id === "act_ref_done")).toBe(false);
  });

  test("7. rebuildActionInboxForToday grava decisionSnapshot e evita politica paralela do store", () => {
    useStore.getState().resetStore({ touchUpdatedAt: false });
    useStore.setState({
      plat: "res",
      res: {
        temas: [
          {
            id: 1,
            nome: "Apendicite",
            unstarted: false,
            rev: {
              d1: { done: false, date: "2026-06-01" }
            }
          }
        ],
        simulados: [],
        ankiLog: [],
        cronogramas: [],
        casosProgresso: {}
      },
      actionInbox: [],
      actionInboxState: { dismissed: {}, accepted: {}, done: {} },
      decisionSnapshot: null,
      sessionReflections: []
    });

    useStore.getState().rebuildActionInboxForToday();
    const state = useStore.getState();

    expect(state.decisionSnapshot?.primaryAction?.type).toBe("revisao_vencida");
    expect(state.decisionSnapshot?.primaryAction).toEqual(state.decisionSnapshot?.mentorAction);
    const overdueActions = state.actionInbox.filter((act) => act.type === "revisao_vencida");
    expect(overdueActions).toHaveLength(1);
    expect(overdueActions[0].source).toBe("mentor-v2");
  });
});
