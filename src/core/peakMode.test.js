import {
  adjustActionForPeakMode,
  diasAteProva,
  getPeakModePolicy,
  getPeakPhase,
  shouldLimitNewTopics,
} from "./peakMode";

describe("peakMode", () => {
  test("calcula dias ate prova", () => {
    expect(diasAteProva("2026-09-13", "2026-09-10")).toBe(3);
  });

  test("classifica fases", () => {
    expect(getPeakPhase({ examDate: "2026-11-30", today: "2026-05-31" })).toBe("base");
    expect(getPeakPhase({ examDate: "2026-07-20", today: "2026-05-31" })).toBe("aproximacao");
    expect(getPeakPhase({ examDate: "2026-06-20", today: "2026-05-31" })).toBe("reta_final");
    expect(getPeakPhase({ examDate: "2026-06-02", today: "2026-05-31" })).toBe("vespera");
  });

  test("limita tema novo na reta final", () => {
    expect(shouldLimitNewTopics({ phase: "reta_final", backlog: 3, coverage: 80 })).toBe(true);
    expect(shouldLimitNewTopics({ phase: "aproximacao", backlog: 25, coverage: 80 })).toBe(true);
  });

  test("aumenta prioridade de revisao", () => {
    const policy = getPeakModePolicy("reta_final");
    const adjusted = adjustActionForPeakMode({ type: "review", priority: 50 }, policy);
    expect(adjusted.priority).toBe(75);
  });
});

