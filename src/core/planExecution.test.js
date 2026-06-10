import {
  PLAN_EXECUTION_STATES,
  buildPlanExecutionState,
  getAgendaTaskLabel,
  getAgendaTaskTarget,
} from "./planExecution";

describe("planExecution", () => {
  it("returns no_plan when there is no plan health and no tasks", () => {
    expect(buildPlanExecutionState({}).state).toBe(PLAN_EXECUTION_STATES.NO_PLAN);
  });

  it("returns ready_unaccepted when today's agenda has tasks", () => {
    const state = buildPlanExecutionState({
      agendaTodaySummary: { totalItems: 1, items: [{ id: "a", temaId: 1, stepKey: "d1" }], firstAction: { temaId: 1, stepKey: "d1" } },
      planHealth: "feasible",
    });
    expect(state.state).toBe(PLAN_EXECUTION_STATES.PLAN_READY_UNACCEPTED);
  });

  it("returns accepted_today when acceptedToday is true", () => {
    const state = buildPlanExecutionState({
      acceptedToday: true,
      agendaTodaySummary: { totalItems: 1, items: [{ id: "a", temaId: 1, stepKey: "d1" }], firstAction: { temaId: 1, stepKey: "d1" } },
      planHealth: "feasible",
    });
    expect(state.state).toBe(PLAN_EXECUTION_STATES.PLAN_ACCEPTED_TODAY);
  });

  it("maps task targets and labels", () => {
    const review = { type: "review", temaId: "t1", stepKey: "d4" };
    expect(getAgendaTaskLabel(review)).toBe("Revisar");
    expect(getAgendaTaskTarget(review)).toEqual({ action: "review", temaId: "t1", stepKey: "d4" });
    expect(getAgendaTaskLabel({ type: "relearning", domainTestClassification: "rescue" })).toBe("Revisao dirigida");
    expect(getAgendaTaskLabel({ type: "new_topic", domainTestClassification: "treat_as_new" })).toBe("Estudar D0");
  });
});
