import { executeDailyCommandTarget } from "./dailyCommandTargetExecutor";

describe("dailyCommandTargetExecutor", () => {
  it("opens a specific clinical case when clinical target has casoId", () => {
    const onOpenClinicalCase = jest.fn();
    const setView = jest.fn();

    const handled = executeDailyCommandTarget(
      {
        type: "clinical_reasoning",
        target: {
          route: "clinical",
          params: { casoId: "diarreia-aguda-pediatria", phase: "caso" },
        },
      },
      { onOpenClinicalCase, setView }
    );

    expect(handled).toBe(true);
    expect(onOpenClinicalCase).toHaveBeenCalledWith({
      caseId: "diarreia-aguda-pediatria",
      phase: "caso",
    });
    expect(setView).not.toHaveBeenCalled();
  });

  it("falls back to the clinical view when no specific clinical handler exists", () => {
    const setView = jest.fn();

    const handled = executeDailyCommandTarget(
      { target: { route: "clinical", params: { casoId: "caso-x" } } },
      { setView }
    );

    expect(handled).toBe(true);
    expect(setView).toHaveBeenCalledWith("raciocinio");
  });
});
