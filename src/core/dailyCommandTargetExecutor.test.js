import { executeDailyCommandTarget } from "./dailyCommandTargetExecutor";

describe("dailyCommandTargetExecutor", () => {
  it("opens a specific clinical case when clinical target has casoId", () => {
    const onOpenClinicalCase = jest.fn();
    const setView = jest.fn();

    const result = executeDailyCommandTarget(
      {
        type: "clinical_reasoning",
        target: {
          route: "clinical",
          params: { casoId: "diarreia-aguda-pediatria", phase: "caso" },
        },
      },
      { onOpenClinicalCase, setView }
    );

    expect(result).toEqual({
      ok: true,
      outcome: "handled",
      route: "clinical",
      params: { casoId: "diarreia-aguda-pediatria", phase: "caso" },
    });
    expect(onOpenClinicalCase).toHaveBeenCalledWith({
      caseId: "diarreia-aguda-pediatria",
      phase: "caso",
    });
    expect(setView).not.toHaveBeenCalled();
  });

  it("returns missing_handler and preserves the clinical fallback when no handler exists", () => {
    const setView = jest.fn();

    const result = executeDailyCommandTarget(
      { target: { route: "clinical", params: { casoId: "caso-x" } } },
      { setView }
    );

    expect(result).toEqual({
      ok: false,
      outcome: "missing_handler",
      route: "clinical",
      params: { casoId: "caso-x" },
    });
    expect(setView).toHaveBeenCalledWith("raciocinio");
  });

  it("returns missing_handler for queue focus without a queue item", () => {
    const onStudy = jest.fn();
    const setView = jest.fn();

    const result = executeDailyCommandTarget(
      { target: { route: "focus", params: { mode: "queue" } } },
      { onStudy, setView }
    );

    expect(result).toEqual({
      ok: false,
      outcome: "missing_handler",
      route: "focus",
      params: { mode: "queue" },
    });
    expect(onStudy).not.toHaveBeenCalled();
    expect(setView).toHaveBeenCalledWith("crono");
  });

  it("handles focus target with groupId through onStudyGroup", () => {
    const onStudyGroup = jest.fn();

    const result = executeDailyCommandTarget(
      { target: { route: "focus", params: { groupId: "grupo-1" } } },
      { onStudyGroup }
    );

    expect(result).toEqual({
      ok: true,
      outcome: "handled",
      route: "focus",
      params: { groupId: "grupo-1" },
    });
    expect(onStudyGroup).toHaveBeenCalledWith("grupo-1");
  });

  it("returns missing_handler for groupId without onStudyGroup", () => {
    const setView = jest.fn();

    const result = executeDailyCommandTarget(
      { target: { route: "focus", params: { groupId: "grupo-1" } } },
      { setView }
    );

    expect(result).toEqual({
      ok: false,
      outcome: "missing_handler",
      route: "focus",
      params: { groupId: "grupo-1" },
    });
    expect(setView).toHaveBeenCalledWith("crono");
  });

  it("returns unknown_route and falls back to dashboard for unknown routes", () => {
    const setView = jest.fn();

    const result = executeDailyCommandTarget(
      { target: { route: "broken_route", params: { source: "test" } } },
      { setView }
    );

    expect(result).toEqual({
      ok: false,
      outcome: "unknown_route",
      route: "broken_route",
      params: { source: "test" },
    });
    expect(setView).toHaveBeenCalledWith("dash");
  });

  it("returns fallback_view for legacy actions without a concrete target", () => {
    const setView = jest.fn();

    const result = executeDailyCommandTarget(
      { type: "rest", target: { tema: "energia" } },
      { setView }
    );

    expect(result).toEqual({
      ok: true,
      outcome: "fallback_view",
      route: "dashboard",
      params: { tema: "energia" },
    });
    expect(setView).toHaveBeenCalledWith("dash");
  });

  it("keeps canonical view routes handled when setView is present", () => {
    const setView = jest.fn();

    const result = executeDailyCommandTarget(
      { target: { route: "stats", params: { action: "light_block_or_rest" } } },
      { setView }
    );

    expect(result).toEqual({
      ok: true,
      outcome: "handled",
      route: "stats",
      params: { action: "light_block_or_rest" },
    });
    expect(setView).toHaveBeenCalledWith("stats");
  });
});
