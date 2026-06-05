import { buildFsrsShadowReport } from "./fsrsShadowReport";

describe("fsrsShadowReport", () => {
  test("aggregates shadow divergence events", () => {
    const temas = [
      {
        id: "t1",
        nome: "Sepse",
        rev: {
          reviewHistory: [
            {
              stepKey: "d1",
              reviewedAt: "2026-06-04",
              fsrsCanonicalShadow: {
                comparison: {
                  liteIntervalAfter: 3,
                  canonicalIntervalAfter: 4,
                  diffDays: 1,
                  absDiffDays: 1,
                  direction: "canonical_later",
                  severity: "low",
                },
              },
            },
            {
              stepKey: "d7",
              reviewedAt: "2026-06-05",
              fsrsCanonicalShadow: {
                comparison: {
                  liteIntervalAfter: 14,
                  canonicalIntervalAfter: 30,
                  diffDays: 16,
                  absDiffDays: 16,
                  direction: "canonical_later",
                  severity: "high",
                },
              },
            },
            {
              stepKey: "d4",
              reviewedAt: "2026-06-06",
              fsrsCanonicalShadow: {
                enabled: true,
                failed: true,
                error: "boom",
              },
            },
          ],
        },
      },
      {
        id: "t2",
        nome: "Dor toracica",
        rev: {
          reviewHistory: [
            {
              stepKey: "d4",
              reviewedAt: "2026-06-07",
            },
          ],
        },
      },
    ];

    const report = buildFsrsShadowReport(temas);

    expect(report.totalEvents).toBe(4);
    expect(report.shadowEvents).toBe(3);
    expect(report.failedEvents).toBe(1);
    expect(report.highDivergenceEvents).toBe(1);
    expect(report.averageAbsDiffDays).toBe(8.5);
    expect(report.medianAbsDiffDays).toBe(8.5);
    expect(report.p90AbsDiffDays).toBe(16);
    expect(report.percentAbsDiffOver3Days).toBe(50);
    expect(report.byStep.d1.averageAbsDiffDays).toBe(1);
    expect(report.byStep.d7.p90AbsDiffDays).toBe(16);
    expect(report.byStep.d7.percentAbsDiffOver3Days).toBe(100);
    expect(report.byStep.d7.high).toBe(1);
    expect(report.byDirection.canonical_later).toBe(2);
    expect(report.topDivergences[0]).toMatchObject({
      temaId: "t1",
      stepKey: "d7",
      absDiffDays: 16,
      severity: "high",
    });
  });
});
