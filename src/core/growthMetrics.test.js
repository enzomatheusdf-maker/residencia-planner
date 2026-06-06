// src/core/growthMetrics.test.js
import { computeGrowth } from "./growthMetrics";

describe("Growth Metrics Test Suite", () => {
  test("calculates positive deltas when metrics improve from previous window", () => {
    // window = 30 days.
    // Current window: 0 to 29 days ago.
    // Previous window: 30 to 59 days ago.
    const events = [
      // Current Period (study on 2026-06-05, today is 2026-06-06 -> 1 day ago)
      { date: "2026-06-05", acerto: 1.0, confianca: "Alta", area: "Cardiologia" },
      { date: "2026-06-04", acerto: 0.8, confianca: "Alta", area: "Cardiologia" },
      // Previous Period (study on 2026-05-01 -> 36 days ago)
      { date: "2026-05-01", acerto: 0.6, confianca: "Baixa", area: "Cardiologia" },
      { date: "2026-04-28", acerto: 0.4, confianca: "Baixa", area: "Cardiologia" },
    ];

    const growth = computeGrowth(events, { window: 30, today: "2026-06-06" });

    // Retention: Current (0.9) vs Previous (0.5) -> Delta +0.40
    expect(growth.retentionDelta).toBeCloseTo(0.40);
    // Calibration:
    // Current error: |1.0 - 1.0| = 0; |1.0 - 0.8| = 0.2 -> Avg error = 0.1 -> score = 0.9
    // Previous error: |0.2 - 0.6| = 0.4; |0.2 - 0.4| = 0.2 -> Avg error = 0.3 -> score = 0.7
    // Calibration Delta: 0.9 - 0.7 = +0.20
    expect(growth.calibrationDelta).toBeCloseTo(0.20);
    // Mastery By Area: Current (0.9) vs Previous (0.5) -> Delta +0.40
    expect(growth.masteryByAreaDelta).toBeCloseTo(0.40);
  });

  test("calculates deltas correctly against goals", () => {
    const events = [
      { date: "2026-06-05", acerto: 0.85, area: "GO" },
    ];

    const growth = computeGrowth(events, {
      window: 30,
      today: "2026-06-06",
      targetRetention: 0.90,
      targetAcerto: 0.80,
    });

    // vsGoal:
    // retention: 0.85 - 0.90 = -0.05
    // acerto: 0.85 - 0.80 = +0.05
    expect(growth.vsGoal.retention).toBeCloseTo(-0.05);
    expect(growth.vsGoal.acerto).toBeCloseTo(0.05);
  });
});
