import { createLearningEvent, appendLearningEvent, summarizeLearningEvents } from "./learningEvent";
import { useStore } from "./store";

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
});
