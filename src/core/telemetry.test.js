import { isTelemetryDisabled, sanitizeTelemetryPayload } from "./telemetry";

describe("telemetry", () => {
  test("remove campos sensiveis e preserva schema permitido", () => {
    expect(
      sanitizeTelemetryPayload("activation_first_review_done", {
        plat: "RES",
        step: "D21",
        uid: "abc",
        tema: "Cardio",
      })
    ).toEqual({ plat: "res", step: "d21" });
  });

  test("mantem metricas numericas finitas", () => {
    expect(
      sanitizeTelemetryPayload("simulation_result_recorded", {
        plat: "vest",
        pct: 78.333,
        total: 120,
      })
    ).toEqual({ plat: "vest", pct: 78.33, total: 120 });
  });

  test("respeita opt-out em meta.analytics.disabled", () => {
    expect(isTelemetryDisabled({ meta: { analytics: { disabled: true } } })).toBe(true);
  });
});
