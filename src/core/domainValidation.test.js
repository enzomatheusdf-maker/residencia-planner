import {
  applyDominioPrevioToTema,
  calcularDominioPrevio,
  DOMINIO_PREVIO_MIN_QUESTOES,
  DOMINIO_PREVIO_MIN_ACERTO,
  getDominioPrevioStatus,
  getNextReviewForTema,
  getReviewDisplayLabel,
} from "./domainValidation";
import { addDays, buildRev, todayStr } from "./fsrs";
import { calcFilaInteligente } from "../hooks/useMetrics";

describe("dominio previo", () => {
  test("rejects dominio previo with fewer than 15 questions", () => {
    const r = calcularDominioPrevio({ acertos: 10, total: 12 });
    expect(r.valido).toBe(false);
    expect(r.status).toBe("amostra_insuficiente");
  });

  test("rejects dominio previo below 80 percent", () => {
    const r = calcularDominioPrevio({ acertos: 11, total: 15 });
    expect(r.valido).toBe(false);
    expect(r.status).toBe("reprovado");
    expect(r.percentual).toBeLessThan(DOMINIO_PREVIO_MIN_ACERTO);
  });

  test("below 40 percent routes to D0 recovery", () => {
    const r = calcularDominioPrevio({ acertos: 7, total: 20 });
    expect(r.valido).toBe(false);
    expect(r.proximaEtapa).toBe("d0");
  });

  test("40 to 59 percent routes to D1 lacuna review", () => {
    const r = calcularDominioPrevio({ acertos: 10, total: 20 });
    expect(r.valido).toBe(false);
    expect(r.proximaEtapa).toBe("d1");
  });

  test("80 to 89 percent schedules first review at D7", () => {
    const r = calcularDominioPrevio({ acertos: 12, total: 15 });
    expect(r.valido).toBe(true);
    expect(r.status).toBe("validado_previo");
    expect(r.intervaloInicial).toBe(7);
    expect(r.proximaRevisao).toBeTruthy();
  });

  test("90 percent or more schedules first review at D21", () => {
    const r = calcularDominioPrevio({ acertos: 18, total: 20 });
    expect(r.valido).toBe(true);
    expect(r.status).toBe("validado_previo");
    expect(r.intervaloInicial).toBe(21);
    expect(r.proximaRevisao).toBeTruthy();
  });

  test("rejeita valores invalidos", () => {
    expect(calcularDominioPrevio({ acertos: 20, total: 10 }).valido).toBe(false);
    expect(calcularDominioPrevio({ acertos: -1, total: 15 }).valido).toBe(false);
    expect(calcularDominioPrevio({ acertos: 1, total: 0 }).valido).toBe(false);
  });

  test("constante minima de questoes permanece 15", () => {
    expect(DOMINIO_PREVIO_MIN_QUESTOES).toBe(15);
  });

  test("validated topic is no longer unstarted", () => {
    const tema = {
      id: 1,
      nome: "Tema",
      esp: "Clínica Médica",
      importancia: "ALTA",
      d0: todayStr(),
      unstarted: true,
      rev: buildRev(todayStr(), "Clínica Médica"),
    };
    const updated = applyDominioPrevioToTema(tema, { questoes: 15, acertos: 13 });
    expect(updated.unstarted).toBe(false);
    expect(updated.status).toBe("validado_previo");
  });

  test("failed dominio below 40 reopens D0 today", () => {
    const tema = {
      id: 20,
      nome: "Tema 20",
      esp: "Clínica Médica",
      importancia: "ALTA",
      d0: todayStr(),
      unstarted: true,
      rev: buildRev(todayStr(), "Clínica Médica"),
    };
    const updated = applyDominioPrevioToTema(tema, { questoes: 20, acertos: 7 });
    const next = getNextReviewForTema(updated);
    expect(updated.unstarted).toBe(false);
    expect(updated.status).toBe("reprovado");
    expect(next.stepKey).toBe("d0");
    expect(updated.rev.d0.done).toBe(false);
  });

  test("failed dominio from 40 to 59 opens D1 today", () => {
    const tema = {
      id: 21,
      nome: "Tema 21",
      esp: "Clínica Médica",
      importancia: "ALTA",
      d0: todayStr(),
      unstarted: true,
      rev: buildRev(todayStr(), "Clínica Médica"),
    };
    const updated = applyDominioPrevioToTema(tema, { questoes: 20, acertos: 10 });
    const next = getNextReviewForTema(updated);
    expect(updated.unstarted).toBe(false);
    expect(updated.status).toBe("reprovado");
    expect(updated.rev.d0.done).toBe(true);
    expect(next.stepKey).toBe("d1");
    expect(next.date).toBe(todayStr());
  });

  test("validated topic receives dominioPrevio metadata", () => {
    const tema = {
      id: 2,
      nome: "Tema 2",
      esp: "Clínica Médica",
      importancia: "ALTA",
      d0: todayStr(),
      unstarted: true,
      rev: buildRev(todayStr(), "Clínica Médica"),
    };
    const updated = applyDominioPrevioToTema(tema, { questoes: 15, acertos: 14 });
    expect(updated.dominioPrevio?.validado).toBe(true);
    expect(updated.dominioPrevio?.source).toBe("ja_domino");
    expect(updated.dominioPrevio?.primeiraRevisao).toBe("d21");
  });

  test("validated topic receives reviewHistory event", () => {
    const tema = {
      id: 3,
      nome: "Tema 3",
      esp: "Clínica Médica",
      importancia: "ALTA",
      d0: todayStr(),
      unstarted: true,
      rev: buildRev(todayStr(), "Clínica Médica"),
    };
    const updated = applyDominioPrevioToTema(tema, { questoes: 15, acertos: 12 });
    const history = updated.rev?.reviewHistory || [];
    expect(history.length).toBeGreaterThan(0);
    expect(history[history.length - 1].source).toBe("dominio_previo");
    expect(history[history.length - 1].stepKey).toBe("d0");
  });

  test("acerto can be input as 85 or 0.85", () => {
    const temaBase = {
      id: 4,
      nome: "Tema 4",
      esp: "Clínica Médica",
      importancia: "ALTA",
      d0: todayStr(),
      unstarted: true,
      rev: buildRev(todayStr(), "Clínica Médica"),
    };
    const percentInput = applyDominioPrevioToTema(temaBase, { questoes: 20, acertos: 17 });
    const fractionInput = applyDominioPrevioToTema(temaBase, { questoes: 20, acertos: 0.85 });
    expect(percentInput.status).toBe("validado_previo");
    expect(fractionInput.status).toBe("validado_previo");
    expect(fractionInput.dominioPrevio?.percentual).toBe(85);
  });

  test("does not mark as mastered or dominado definitivo", () => {
    const tema = {
      id: 5,
      nome: "Tema 5",
      esp: "Clínica Médica",
      importancia: "ALTA",
      d0: todayStr(),
      unstarted: true,
      rev: buildRev(todayStr(), "Clínica Médica"),
    };
    const updated = applyDominioPrevioToTema(tema, { questoes: 20, acertos: 18 });
    expect(updated.status).toBe("validado_previo");
    expect(updated.dominio?.classificacao).not.toBe("dominado_definitivo");
  });

  test("80 to 89 percent schedules D7 and never D1", () => {
    const tema = {
      id: 6,
      nome: "Tema 6",
      esp: "Clínica Médica",
      importancia: "ALTA",
      d0: todayStr(),
      unstarted: true,
      rev: buildRev(todayStr(), "Clínica Médica"),
    };
    const updated = applyDominioPrevioToTema(tema, { questoes: 20, acertos: 17 });
    const next = getNextReviewForTema(updated);

    expect(getDominioPrevioStatus(updated).firstReviewLabel).toBe("D7");
    expect(next.label).toBe("D7");
    expect(next.stepKey).toBe("d7");
    expect(getReviewDisplayLabel(updated, next.stepKey)).toBe("D7");
    expect(getReviewDisplayLabel(updated, next.stepKey)).not.toBe("D1");
    expect(updated.rev.d1.skipped).toBe(true);
    expect(updated.rev.d4.skipped).toBe(true);
    expect(updated.rev.d7.done).toBe(false);
  });

  test("90 percent or more schedules D21 and never D1", () => {
    const tema = {
      id: 7,
      nome: "Tema 7",
      esp: "Clínica Médica",
      importancia: "ALTA",
      d0: todayStr(),
      unstarted: true,
      rev: buildRev(todayStr(), "Clínica Médica"),
    };
    const updated = applyDominioPrevioToTema(tema, { questoes: 20, acertos: 19 });
    const next = getNextReviewForTema(updated);

    expect(getDominioPrevioStatus(updated).firstReviewLabel).toBe("D21");
    expect(next.label).toBe("D21");
    expect(next.stepKey).toBe("d21");
    expect(getReviewDisplayLabel(updated, next.stepKey)).toBe("D21");
    expect(getReviewDisplayLabel(updated, next.stepKey)).not.toBe("D1");
    expect(updated.rev.d1.skipped).toBe(true);
    expect(updated.rev.d4.skipped).toBe(true);
    expect(updated.rev.d7.skipped).toBe(true);
    expect(updated.rev.d21.done).toBe(false);
    // D14 não existe mais no ciclo "alto".
    expect(updated.rev.d14).toBeUndefined();
  });

  test("validated topic display accuracy uses dominioPrevio acerto", () => {
    const tema = {
      id: 8,
      nome: "Tema 8",
      esp: "Clínica Médica",
      importancia: "ALTA",
      d0: todayStr(),
      unstarted: true,
      rev: buildRev(todayStr(), "Clínica Médica"),
    };
    const updated = applyDominioPrevioToTema(tema, { questoes: 20, acertos: 18 });
    expect(getDominioPrevioStatus(updated).acerto).toBeCloseTo(0.9);
  });

  test("legacy validated d1 container displays first review label instead of D1", () => {
    const legacy = {
      id: 9,
      nome: "Tema 9",
      esp: "Clínica Médica",
      importancia: "ALTA",
      unstarted: false,
      dominioPrevio: {
        status: "validado_previo",
        validado: true,
        acerto: 0.92,
        questoes: 15,
        intervaloInicial: 21,
        primeiraRevisao: "d21",
        proximaRevisao: addDays(todayStr(), 21),
      },
      rev: {
        ...buildRev(todayStr(), "Clínica Médica"),
        d0: { done: true, date: todayStr(), acerto: 0.92 },
        d21: { done: true, date: todayStr() },
        d1: { done: false, date: addDays(todayStr(), 21) },
      },
    };
    const next = getNextReviewForTema(legacy);
    expect(next.stepKey).toBe("d1");
    expect(next.label).toBe("D21");
    expect(getReviewDisplayLabel(legacy, "d1")).toBe("D21");
  });

  test("skipped steps are ignored by queue", () => {
    const tema = {
      id: 10,
      nome: "Tema 10",
      esp: "Clínica Médica",
      importancia: "ALTA",
      d0: todayStr(),
      unstarted: true,
      rev: buildRev(todayStr(), "Clínica Médica"),
    };
    const updated = applyDominioPrevioToTema(tema, { questoes: 20, acertos: 18 });
    const dueD21 = {
      ...updated,
      rev: {
        ...updated.rev,
        d21: { ...updated.rev.d21, date: todayStr(), scheduledAt: todayStr() },
      },
    };
    const queue = calcFilaInteligente([dueD21], "res", {});
    expect(queue).toHaveLength(1);
    expect(queue[0].stepKey).toBe("d21");
    expect(queue[0].step.label).toBe("D21");
    expect(queue.some((item) => item.stepKey === "d1")).toBe(false);
  });
});
