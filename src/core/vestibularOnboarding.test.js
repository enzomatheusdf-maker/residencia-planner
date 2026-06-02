import {
  getVestibularStart,
  updateVestibularStart,
  recommendVestibularFirstAction,
} from "./vestibularOnboarding";

test("vestibular start is incomplete by default", () => {
  const state = getVestibularStart({});
  expect(state.completed).toBe(false);
});

test("selecting target exam stores target", () => {
  const updated = updateVestibularStart({}, { targetExam: "ENEM" });
  expect(updated.targetExam).toBe("ENEM");
});

test("simulado baseline path recommends registering simulado", () => {
  const recommendation = recommendVestibularFirstAction({
    meta: { vestibularStart: { baselineMode: "simulado" } },
    simulados: [],
    temas: [],
  });
  expect(recommendation.key).toBe("registrar_simulado");
  expect(recommendation.view).toBe("sims");
});

test("without simulado recommends plan setup or first topic", () => {
  const recommendation = recommendVestibularFirstAction({
    meta: { vestibularStart: { baselineMode: "sem_simulado" } },
    simulados: [],
    temas: [{ id: 1, unstarted: true }],
  });
  expect(recommendation.key).toBe("iniciar_tema");
  expect(recommendation.view).toBe("crono");
});

test("mentor mode is default", () => {
  const state = getVestibularStart({});
  expect(state.planMode).toBe("mentor");
});

test("clinical reasoning is never recommended for vest", () => {
  const recommendation = recommendVestibularFirstAction({
    meta: { vestibularStart: { baselineMode: "simulado" } },
    simulados: [],
    temas: [],
  });
  expect(recommendation.title.toLowerCase()).not.toContain("raciocinio");
  expect(recommendation.description.toLowerCase()).not.toContain("clinico");
});

test("ENAMED is never recommended for vest", () => {
  const recommendation = recommendVestibularFirstAction({
    meta: { vestibularStart: { baselineMode: "sem_simulado" } },
    simulados: [],
    temas: [],
  });
  expect(recommendation.title.toLowerCase()).not.toContain("enamed");
  expect(recommendation.description.toLowerCase()).not.toContain("enamed");
});
