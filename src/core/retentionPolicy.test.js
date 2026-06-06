// src/core/retentionPolicy.test.js
import { recommendDesiredRetention } from "./retentionPolicy";

describe("retentionPolicy", () => {
  test("default base retention is 0.88", () => {
    const normalResult = recommendDesiredRetention({ examPhase: "outra_fase", overload: false });
    expect(normalResult.desiredRetention).toBe(0.88);
  });

  test("reta_final and vespera recommend 0.92 when not overloaded", () => {
    const rf = recommendDesiredRetention({ examPhase: "reta_final", overload: false });
    expect(rf.desiredRetention).toBe(0.92);

    const v = recommendDesiredRetention({ examPhase: "vespera", overload: false });
    expect(v.desiredRetention).toBe(0.92);
  });

  test("inicial or base without overload recommends 0.85", () => {
    const ini = recommendDesiredRetention({ examPhase: "inicial", overload: false });
    expect(ini.desiredRetention).toBe(0.85);

    const base = recommendDesiredRetention({ examPhase: "base", overload: false });
    expect(base.desiredRetention).toBe(0.85);
  });

  test("overload caps retention to base 0.88 and never raises it", () => {
    // reta_final would be 0.92, but with overload it should be capped to base 0.88
    const rfOverload = recommendDesiredRetention({ examPhase: "reta_final", overload: true });
    expect(rfOverload.desiredRetention).toBe(0.88);

    // inicial with overload should not go to 0.85 because the !overload condition is false, so it remains 0.88
    const iniOverload = recommendDesiredRetention({ examPhase: "inicial", overload: true });
    expect(iniOverload.desiredRetention).toBe(0.88);
  });
});
