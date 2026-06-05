import { addDays, todayStr } from "./fsrs";
import { buildMentorContext, collectMentorSchedulerSignals } from "./mentorSignals";

describe("mentorSignals", () => {
  test("collectMentorSchedulerSignals expõe workload por minutos", () => {
    const today = todayStr();
    const temas = [
      {
        id: 1,
        nome: "Tema A",
        esp: "GO",
        rev: {
          phase: "review",
          reviewHistory: [],
          d1: { done: false, date: today, phase: "learning" },
          d7: { done: false, date: addDays(today, -1), phase: "review" },
        },
      },
    ];
    const signals = collectMentorSchedulerSignals(temas, { today, projectionDays: 7 });
    expect(signals.workloadProjection[today]).toBeDefined();
    expect(signals.todayCount).toBeGreaterThan(0);
    expect(signals.todayMinutes).toBeGreaterThan(0);
    expect(signals.overdueCount).toBeGreaterThan(0);
  });

  test("collectMentorSchedulerSignals conta relearning e warnings", () => {
    const today = todayStr();
    const temas = [
      {
        id: 2,
        nome: "Tema B",
        esp: "Clínica Médica",
        rev: {
          phase: "relearning",
          relearning: { fromStep: "d21", targetStep: "d7", startedAt: today },
          meta: { schedulerWarning: "missing_rating" },
          reviewHistory: [{ stepKey: "d21", reviewedAt: today, acerto: 0.7, official: true }],
          d21: { done: true, date: today, reviewedAt: null, acerto: null },
        },
      },
    ];
    const signals = collectMentorSchedulerSignals(temas, { today });
    expect(signals.relearningCount).toBe(1);
    expect(signals.missingRatingWarnings).toBeGreaterThan(0);
    expect(signals.missingReviewedAtCount).toBeGreaterThan(0);
  });

  test("mentor signal labels validated previous domain as D21 and not D1", () => {
    const today = todayStr();
    const temas = [
      {
        id: 3,
        nome: "Tema validado",
        esp: "Clínica Médica",
        unstarted: false,
        dominioPrevio: {
          status: "validado_previo",
          validado: true,
          acerto: 0.92,
          questoes: 15,
          intervaloInicial: 21,
          primeiraRevisao: "d21",
          primeiraRevisaoDate: today,
        },
        rev: {
          phase: "learning",
          reviewHistory: [],
          d1: { done: true, skipped: true, skipReason: "dominio_previo", date: today, reviewedAt: today, acerto: 0.92 },
          d4: { done: true, skipped: true, skipReason: "dominio_previo", date: today, reviewedAt: today, acerto: 0.92 },
          d7: { done: true, skipped: true, skipReason: "dominio_previo", date: today, reviewedAt: today, acerto: 0.92 },
          d21: { done: false, date: today, source: "dominio_previo" },
        },
      },
    ];

    const signals = collectMentorSchedulerSignals(temas, { today });
    expect(signals.dueTodayCount).toBe(1);
    expect(signals.nextDueItem.stepKey).toBe("d21");
    expect(signals.nextDueItem.label).toBe("D21");
    expect(signals.nextDueItem.label).not.toBe("D1");
  });

  test("buildMentorContext agrega provider e sinais de plataforma", () => {
    const today = todayStr();
    const state = {
      plat: "vest",
      meta: { tempoDisponivel: 2, areaPuxouBaixo: "Matemática" },
      calendarProvider: { activeId: "vest-base" },
      vest: {
        temas: [],
        simulados: [{ id: 1, porArea: [] }],
        casosProgresso: {},
      },
      enamedAnalises: [],
      actionInbox: [],
      sessionReflections: [],
    };
    const context = buildMentorContext(state, "vest", { today });
    expect(context.plat).toBe("vest");
    expect(context.calendarProvider.activeId).toBe("vest-base");
    expect(context.userAvailableMinutes).toBe(120);
    expect(context.weakSubject).toBe("Matemática");
  });

  test("buildMentorContext expoe operationalMode derivado", () => {
    const today = "2026-06-04";
    const state = {
      plat: "res",
      meta: { tempoDisponivel: 1, dataProva: "2026-12-01" },
      calendarProvider: { activeId: "medcof" },
      focusMode: false,
      modoSimples: true,
      mentorMode: true,
      res: {
        temas: [],
        simulados: [],
        casosProgresso: {},
      },
      enamedAnalises: [],
      actionInbox: [],
      sessionReflections: [],
    };

    const context = buildMentorContext(state, "res", { today });

    expect(context.operationalMode).toBeDefined();
    expect(context.operationalMode.mode).toBe("normal");
    expect(context.operationalMode.experienceMode).toBe("mentor");
    expect(context.operationalMode.source).toBe("operational-mode-v1");
  });
});
