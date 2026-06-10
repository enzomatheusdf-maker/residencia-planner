import {
  appendLearningEvent,
  createLearningEvent,
  getEventsByTema,
  getLearningEventStatsList,
  getTemaStatsFromLearningEvents,
  summarizeByArea,
  summarizeLearningEvents,
  getRecentErrorEvents,
} from "./learningEvent";
import { migrateTemaStatsToLearningEventsState, TEMA_STATS_MIGRATION_FLAG, useStore } from "./store";

describe("learningEvent core rules", () => {
  test("createLearningEvent normaliza campos", () => {
    const raw = {
      topicId: 42,
      topicName: "Gastroenterologia",
      area: "Clinica Medica",
      plat: "res",
      stepKey: "d1",
      acerto: 0.85,
      previsao: 0.90,
      questoes: 20,
      rating: "good",
      confianca: "alta",
      ansiedade: "baixa",
      cansaco: "media",
      foco: "alta",
      tempoMin: 15,
      motivosErro: ["interpretacao"],
      dominantError: "interpretacao"
    };

    const ev = createLearningEvent(raw);
    expect(ev.id).toBeDefined();
    expect(ev.topicId).toBe(42);
    expect(ev.topicName).toBe("Gastroenterologia");
    expect(ev.area).toBe("Clinica Medica");
    expect(ev.plat).toBe("res");
    expect(ev.stepKey).toBe("d1");
    expect(ev.officialSchedulingImpact).toBe(true);
    expect(ev.acerto).toBe(0.85);
    expect(ev.previsao).toBe(0.90);
    expect(ev.questoes).toBe(20);
    expect(ev.rating).toBe("good");
    expect(ev.performance).toEqual({
      acerto: 0.85,
      previsao: 0.9,
      questoes: 20,
      rating: "good"
    });
    expect(ev.confianca).toBe("alta");
    expect(ev.ansiedade).toBe("baixa");
    expect(ev.cansaco).toBe("media");
    expect(ev.foco).toBe("alta");
    expect(ev.tempoMin).toBe(15);
    expect(ev.regulation).toEqual({
      confianca: "alta",
      ansiedade: "baixa",
      cansaco: "media",
      foco: "alta",
      tempoMin: 15
    });
    expect(ev.motivosErro).toEqual(["interpretacao"]);
    expect(ev.dominantError).toBe("interpretacao");
    expect(ev.errors).toEqual({
      motivosErro: ["interpretacao"],
      dominantError: "interpretacao"
    });
    expect(ev.tags).toEqual([]);
    expect(ev.meta).toEqual({});
  });

  test("createLearningEvent aceita schema aninhado mantendo compatibilidade flat", () => {
    const ev = createLearningEvent({
      source: "manual",
      officialSchedulingImpact: false,
      performance: { acerto: 0.7, previsao: 0.6, questoes: 12, rating: "hard" },
      regulation: { confianca: "baixa", ansiedade: "alta", cansaco: "media", foco: "baixa", tempoMin: 22 },
      errors: { motivosErro: ["memoria"], dominantError: "memoria" },
      tags: ["calibracao"],
      meta: { origem: "teste" }
    });

    expect(ev.officialSchedulingImpact).toBe(false);
    expect(ev.performance.acerto).toBe(0.7);
    expect(ev.acerto).toBe(0.7);
    expect(ev.regulation.confianca).toBe("baixa");
    expect(ev.confianca).toBe("baixa");
    expect(ev.errors.motivosErro).toEqual(["memoria"]);
    expect(ev.motivosErro).toEqual(["memoria"]);
    expect(ev.tags).toEqual(["calibracao"]);
    expect(ev.meta).toEqual({ origem: "teste" });
  });

  test("appendLearningEvent respeita o limite maximo", () => {
    let list = [];
    for (let i = 0; i < 5; i++) {
      list = appendLearningEvent(list, { topicId: i }, 3);
    }
    expect(list.length).toBe(3);
    expect(list[0].topicId).toBe(2);
    expect(list[2].topicId).toBe(4);
  });

  test("summarizeLearningEvents calcula estatisticas corretamente", () => {
    const events = [
      createLearningEvent({ acerto: 0.8, rating: "good", dominantError: "interpretacao", plat: "res" }),
      createLearningEvent({ acerto: 0.6, rating: "hard", dominantError: "memoria", plat: "res" }),
      createLearningEvent({ acerto: 1.0, rating: "easy", dominantError: "interpretacao", plat: "res" }),
    ];

    const summary = summarizeLearningEvents(events);
    expect(summary.total).toBe(3);
    expect(summary.averageAcerto).toBeCloseTo(0.8);
    expect(summary.ratingCounts).toEqual({ good: 1, hard: 1, easy: 1 });
    expect(summary.platCounts).toEqual({ res: 3 });
    expect(summary.topError).toBe("interpretacao");
  });

  test("seletores derivam o shape antigo de temaStats a partir de learningEvents", () => {
    const events = [
      createLearningEvent({
        id: "ev_1",
        topicId: 101,
        topicName: "Arritmias",
        area: "Clinica",
        plat: "res",
        stepKey: "d1",
        acerto: 0.8,
        previsao: 0.7,
        questoes: 10,
        completedAt: "2026-06-01T10:00:00.000Z",
      }),
      createLearningEvent({
        id: "ev_2",
        topicId: 101,
        topicName: "Arritmias",
        area: "Clinica",
        plat: "res",
        stepKey: "d4",
        acerto: 0.6,
        questoes: 5,
        completedAt: "2026-06-02T10:00:00.000Z",
      }),
      createLearningEvent({
        id: "ev_obs",
        topicId: 101,
        topicName: "Arritmias",
        area: "Clinica",
        plat: "res",
        source: "session_reflection",
        officialSchedulingImpact: false,
      }),
      createLearningEvent({
        id: "ev_vest",
        topicId: 202,
        area: "Exatas",
        plat: "vest",
        stepKey: "d1",
        acerto: 1,
      }),
    ];

    expect(getEventsByTema(events, 101)).toHaveLength(3);

    const temaStats = getTemaStatsFromLearningEvents(events, { plat: "res" });
    expect(Object.keys(temaStats)).toEqual(["101"]);
    expect(temaStats["101"]).toHaveLength(2);
    expect(temaStats["101"][0]).toMatchObject({
      topicId: 101,
      stepKey: "d1",
      acerto: 0.8,
      previsao: 0.7,
      questoes: 10,
      completedAt: "2026-06-01T10:00:00.000Z",
    });

    const flatStats = getLearningEventStatsList(events, { plat: "res" });
    expect(flatStats.map((stat) => stat.stepKey)).toEqual(["d1", "d4"]);

    const byArea = summarizeByArea(events, "res");
    expect(byArea.Clinica).toMatchObject({
      total: 2,
      questoes: 15,
      topicCount: 1,
      acertoMedio: 0.7,
    });
  });

  test("migra temaStats legado para learningEvents de forma idempotente", () => {
    const legacyState = {
      plat: "res",
      meta: {},
      learningEvents: [],
      temaStats: {
        101: [
          {
            stepKey: "d1",
            acerto: 0.8,
            previsao: 0.7,
            questoes: 10,
            confianca: "media",
            completedAt: "2026-06-01T10:00:00.000Z",
          },
          {
            stepKey: "d4",
            acerto: 0.6,
            questoes: 5,
            motivosErro: ["memoria"],
            completedAt: "2026-06-02T10:00:00.000Z",
          },
        ],
      },
      res: { temas: [{ id: 101, nome: "Arritmias", esp: "Clinica" }] },
      vest: { temas: [] },
    };

    const migrated = migrateTemaStatsToLearningEventsState(legacyState);
    expect(migrated.meta[TEMA_STATS_MIGRATION_FLAG]).toBe(true);
    expect(migrated.learningEvents).toHaveLength(2);
    expect(migrated.learningEvents[0]).toMatchObject({
      source: "review",
      topicId: "101",
      topicName: "Arritmias",
      area: "Clinica",
      plat: "res",
      stepKey: "d1",
      acerto: 0.8,
      previsao: 0.7,
      questoes: 10,
      officialSchedulingImpact: true,
    });

    const migratedAgain = migrateTemaStatsToLearningEventsState(migrated);
    expect(migratedAgain.learningEvents).toEqual(migrated.learningEvents);
  });

  test("migração preserva paridade dos agregados basicos de temaStats", () => {
    const legacyTemaStats = {
      101: [
        { stepKey: "d1", acerto: 0.8, questoes: 10, completedAt: "2026-06-01T10:00:00.000Z" },
        { stepKey: "d4", acerto: 0.6, questoes: 5, completedAt: "2026-06-02T10:00:00.000Z" },
      ],
      102: [
        { stepKey: "d1", acerto: 1, questoes: 8, completedAt: "2026-06-03T10:00:00.000Z" },
      ],
    };
    const migrated = migrateTemaStatsToLearningEventsState({
      plat: "res",
      meta: {},
      learningEvents: [],
      temaStats: legacyTemaStats,
      res: {
        temas: [
          { id: 101, nome: "Arritmias", esp: "Clinica" },
          { id: 102, nome: "Apendicite", esp: "Cirurgia" },
        ],
      },
      vest: { temas: [] },
    });

    const legacyFlat = Object.values(legacyTemaStats).flat();
    const migratedFlat = getLearningEventStatsList(migrated.learningEvents, { plat: "res" });
    const sum = (list, key) => list.reduce((acc, item) => acc + Number(item[key] || 0), 0);

    expect(migratedFlat).toHaveLength(legacyFlat.length);
    expect(sum(migratedFlat, "questoes")).toBe(sum(legacyFlat, "questoes"));
    expect(sum(migratedFlat, "acerto")).toBeCloseTo(sum(legacyFlat, "acerto"));
  });
});

describe("learningEvent integration with store markStep", () => {
  test("markStep registra evento de aprendizagem", () => {
    const temaId = 999;
    
    // Inicializa a store com um tema de teste na plataforma res
    useStore.setState({
      res: {
        temas: [
          {
            id: temaId,
            nome: "Hepatite A",
            esp: "Pediatria",
            unstarted: false,
            rev: {
              d1: { done: false, date: "2026-06-04", S: 2, D: 0.5 }
            }
          }
        ],
        casosProgresso: {}
      },
      learningEvents: []
    });

    // Executa markStep
    useStore.getState().markStep("res", temaId, "d1", {
      acerto: 0.9,
      previsao: 0.8,
      questoes: 10,
      motivosErro: ["distracao"],
      erros: [],
      tempoMin: 12,
      ansiedade: "baixa",
      cansaco: "alta",
      confianca: "media",
      foco: "alta"
    });

    const state = useStore.getState();
    expect(state.learningEvents.length).toBe(1);
    const ev = state.learningEvents[0];
    
    expect(ev.source).toBe("review");
    expect(ev.topicId).toBe(temaId);
    expect(ev.topicName).toBe("Hepatite A");
    expect(ev.area).toBe("Pediatria");
    expect(ev.plat).toBe("res");
    expect(ev.stepKey).toBe("d1");
    expect(ev.officialSchedulingImpact).toBe(true);
    expect(ev.acerto).toBe(0.9);
    expect(ev.previsao).toBe(0.8);
    expect(ev.questoes).toBe(10);
    expect(ev.rating).toBe("easy");
    expect(ev.confianca).toBe("media");
    expect(ev.ansiedade).toBe("baixa");
    expect(ev.cansaco).toBe("alta");
    expect(ev.foco).toBe("alta");
    expect(ev.tempoMin).toBe(12);
    expect(ev.motivosErro).toEqual(["distracao"]);
    expect(ev.dominantError).toBe("distracao");
    expect(ev.performance).toMatchObject({ acerto: 0.9, previsao: 0.8, questoes: 10, rating: "easy" });
    expect(ev.regulation).toMatchObject({ confianca: "media", ansiedade: "baixa", cansaco: "alta", foco: "alta", tempoMin: 12 });
    expect(ev.errors).toMatchObject({ motivosErro: ["distracao"], dominantError: "distracao" });
  });

  test("registrarCaso preserva taxonomia de erro clinico no evento e no progresso", () => {
    useStore.getState().resetStore({ touchUpdatedAt: false });
    useStore.setState({
      learningEvents: [],
      res: {
        temas: [],
        simulados: [],
        ankiLog: [],
        cronogramas: [],
        casosProgresso: {},
      },
    });

    useStore.getState().registrarCaso("res", "apendicite-classica", {
      fase2Acerto: 55,
      confianca: 4,
      acertou: false,
      motivosErro: ["premature_closure"],
      dominantError: "premature_closure",
      meta: { drillType: "B" },
    });

    const state = useStore.getState();
    const ev = state.learningEvents[0];
    expect(ev.source).toBe("clinical_drill");
    expect(ev.scriptId).toBe("apendicite-classica");
    expect(ev.acerto).toBe(0.55);
    expect(ev.motivosErro).toEqual(["premature_closure"]);
    expect(ev.dominantError).toBe("premature_closure");
    expect(ev.errors).toMatchObject({
      motivosErro: ["premature_closure"],
      dominantError: "premature_closure",
    });
    expect(state.res.casosProgresso["apendicite-classica"]).toMatchObject({
      motivosErro: ["premature_closure"],
      dominantError: "premature_closure",
      errors: {
        motivosErro: ["premature_closure"],
        dominantError: "premature_closure",
      },
    });
  });

  test("addSim registra backtest persistido do forecast anterior", () => {
    useStore.getState().resetStore({ touchUpdatedAt: false });
    useStore.setState({
      meta: {
        ...useStore.getState().meta,
        forecastBacktests: [],
        dataProva: "2026-09-13",
      },
      res: {
        temas: [
          {
            id: "cardio",
            nome: "Cardiologia",
            esp: "Clinica Medica",
            unstarted: false,
            d0: "2026-01-01",
            rev: {
              d0: { done: true, acerto: 0.8, questoes: 40, date: "2026-01-01" },
            },
          },
        ],
        simulados: [{ id: "sim-prev", pct: 70, data: "2026-05-01", totalQuestions: 100 }],
        ankiLog: [],
        cronogramas: [],
        casosProgresso: {},
      },
    });

    useStore.getState().addSim("res", {
      nome: "Simulado novo",
      acertos: 68,
      total: 100,
      data: "2026-06-10",
    });

    const state = useStore.getState();
    expect(state.meta.forecastBacktests).toHaveLength(1);
    expect(state.meta.forecastBacktests[0]).toMatchObject({
      plat: "res",
      actual: 68,
      forecastVersion: "forecast_v1",
    });
    expect(state.meta.forecastBacktests[0].absoluteError).toEqual(expect.any(Number));
  });

  test("addSessionReflection registra evento observacional sem impacto oficial", () => {
    useStore.getState().resetStore({ touchUpdatedAt: false });
    useStore.setState({ learningEvents: [], sessionReflections: [] });

    useStore.getState().addSessionReflection({
      id: "ref_teste",
      date: "2026-06-04",
      tema: "Apendicite",
      area: "Cirurgia",
      outcome: "ruim",
      mainIssue: "energia",
      confidence: "baixa",
      nextAdjustment: "descanso",
      note: "Sessao pesada"
    });

    const ev = useStore.getState().learningEvents[0];
    expect(ev.source).toBe("session_reflection");
    expect(ev.officialSchedulingImpact).toBe(false);
    expect(ev.topicName).toBe("Apendicite");
    expect(ev.area).toBe("Cirurgia");
    expect(ev.regulation.confianca).toBe("baixa");
    expect(ev.errors.dominantError).toBe("energia");
    expect(ev.tags).toEqual(["ruim", "descanso"]);
    expect(ev.meta).toMatchObject({ reflectionId: "ref_teste", mainIssue: "energia" });
  });

  test("addSessionReflection marca fechamento com timestamp comparavel ao inicio do foco", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-04T10:30:00.000Z"));
    try {
      useStore.getState().resetStore({ touchUpdatedAt: false });
      useStore.setState({
        learningEvents: [],
        sessionReflections: [],
        meta: {
          ...useStore.getState().meta,
          lastFocusSessionAt: "2026-06-04T10:00:00.000Z",
          lastReflectionAt: null,
        },
      });

      useStore.getState().addSessionReflection({
        id: "ref_fechamento",
        date: "2026-06-04",
        tema: "Apendicite",
        area: "Cirurgia",
      });

      const { lastFocusSessionAt, lastReflectionAt } = useStore.getState().meta;
      expect(lastReflectionAt).toBe("2026-06-04T10:30:00.000Z");
      expect(lastReflectionAt).not.toBe("2026-06-04");
      expect(lastReflectionAt >= lastFocusSessionAt).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("getRecentErrorEvents", () => {
  test("filtra e ordena eventos de erro corretamente por data/timestamp desc", () => {
    const events = [
      createLearningEvent({ id: "e1", acerto: 1.0, timestamp: "2026-06-01T10:00:00Z" }),
      createLearningEvent({ id: "e2", acerto: 0.5, timestamp: "2026-06-02T10:00:00Z" }), // error (acerto < 0.80)
      createLearningEvent({ id: "e3", acerto: 1.0, dominantError: "chute", timestamp: "2026-06-03T10:00:00Z" }), // error (has dominantError)
      createLearningEvent({ id: "e4", acerto: 0.9, timestamp: "2026-06-04T10:00:00Z" }),
    ];

    const result = getRecentErrorEvents(events, 5);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("e3"); // most recent error first
    expect(result[1].id).toBe("e2");
  });
});
