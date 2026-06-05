import { buildInterleavingPlan } from "./interleavingPlanner";

const makeTema = (overrides = {}) => ({
  id: overrides.id || "t1",
  nome: overrides.nome || "Tema",
  esp: overrides.esp || "Clínica Médica",
  parentTopic: overrides.parentTopic || "Cardio",
  rev: overrides.rev || {
    d0: { done: true, date: "2026-06-01" },
    d1: { done: true, date: "2026-06-02" },
    d4: { done: true, date: "2026-06-05" },
    d7: { done: false, date: "2026-06-08" },
    d21: { done: false, date: "2026-06-22" },
  },
});

describe("Interleaving Planner Test Suite", () => {
  test("D21 recomenda candidatos vencidos sem marcar como oficiais", () => {
    const current = makeTema({ id: "current", nome: "IAM" });
    const due = makeTema({
      id: "due",
      nome: "Insuficiência cardíaca",
      rev: {
        d0: { done: true, date: "2026-06-01" },
        d1: { done: false, date: "2026-06-04" },
      },
    });

    const plan = buildInterleavingPlan({
      tema: current,
      temas: [current, due],
      stepKey: "d21",
      platKey: "res",
      today: "2026-06-04",
    });

    expect(plan.shouldRecommend).toBe(true);
    expect(plan.status).toBe("has_due_candidates");
    expect(plan.candidates[0].temaId).toBe("due");
    expect(plan.candidates[0].official).toBe(false);
  });

  test("Exclui o tema atual dos candidatos", () => {
    const current = makeTema({ id: "current", nome: "IAM" });
    current.rev.d21 = { done: false, date: "2026-06-04" };

    const plan = buildInterleavingPlan({
      tema: current,
      temas: [current],
      stepKey: "d21",
      platKey: "res",
      today: "2026-06-04",
    });

    expect(plan.candidates).toHaveLength(0);
    expect(plan.status).toBe("self_only");
  });

  test("Se não há vencidos mas há tema vencendo em 1-3 dias -> status near_due_only", () => {
    const current = makeTema({ id: "current", nome: "IAM" });
    const near = makeTema({
      id: "near",
      nome: "Valvopatias",
      rev: {
        d1: { done: false, date: "2026-06-06" }, // 2 dias no futuro
      },
    });

    const plan = buildInterleavingPlan({
      tema: current,
      temas: [current, near],
      stepKey: "d21",
      platKey: "res",
      today: "2026-06-04",
    });

    expect(plan.shouldRecommend).toBe(true);
    expect(plan.status).toBe("near_due_only");
    expect(plan.candidates[0].temaId).toBe("near");
    expect(plan.candidates[0].official).toBe(false);
  });

  test("Se não há vencidos nem próximos mas há tema maduro -> status mature_only", () => {
    const current = makeTema({ id: "current", nome: "IAM" });
    const mature = makeTema({
      id: "mature",
      nome: "Hipertensão",
      rev: {
        d21: { done: true, date: "2026-05-20" }, // d21.done indica tema maduro
      },
    });

    const plan = buildInterleavingPlan({
      tema: current,
      temas: [current, mature],
      stepKey: "d21",
      platKey: "res",
      today: "2026-06-04",
    });

    expect(plan.shouldRecommend).toBe(true);
    expect(plan.status).toBe("mature_only");
    expect(plan.candidates[0].temaId).toBe("mature");
    expect(plan.candidates[0].official).toBe(false);
  });

  test("Se não há nenhum candidato -> status self_only", () => {
    const current = makeTema({ id: "current", nome: "IAM" });

    const plan = buildInterleavingPlan({
      tema: current,
      temas: [current],
      stepKey: "d21",
      platKey: "res",
      today: "2026-06-04",
    });

    expect(plan.shouldRecommend).toBe(true);
    expect(plan.status).toBe("self_only");
    expect(plan.candidates).toHaveLength(0);
  });

  test("Garante que nenhum candidato é retornado como official: true", () => {
    const current = makeTema({ id: "current", nome: "IAM" });
    const other = makeTema({
      id: "other",
      rev: { d1: { done: false, date: "2026-06-04" } },
    });

    const plan = buildInterleavingPlan({
      tema: current,
      temas: [current, other],
      stepKey: "d21",
      platKey: "res",
      today: "2026-06-04",
    });

    plan.candidates.forEach((cand) => {
      expect(cand.official).toBe(false);
    });
  });

  test("D4 retorna shouldRecommend: false", () => {
    const current = makeTema({ id: "current", nome: "IAM" });

    const plan = buildInterleavingPlan({
      tema: current,
      temas: [current],
      stepKey: "d4",
      platKey: "res",
      today: "2026-06-04",
    });

    expect(plan.shouldRecommend).toBe(false);
  });

  test("D7 retorna recomendação leve", () => {
    const current = makeTema({ id: "current", nome: "IAM" });
    const other = makeTema({
      id: "other",
      rev: { d1: { done: false, date: "2026-06-04" } },
    });

    const plan = buildInterleavingPlan({
      tema: current,
      temas: [current, other],
      stepKey: "d7",
      platKey: "res",
      today: "2026-06-04",
    });

    expect(plan.shouldRecommend).toBe(true);
    expect(plan.status).toBe("has_due_candidates");
  });
});
