// src/core/calibration.test.js
import { calcCalibration } from "./calibration";

describe("Metacognitive Calibration Logic Test Suite", () => {
  test("Returns status 'coletando' if there are fewer than 5 valid stats", () => {
    const stats1 = [
      { previsao: 0.8, acerto: 0.8 },
      { previsao: 0.7, acerto: 0.9 }
    ];
    expect(calcCalibration(stats1)).toEqual({ status: "coletando", n: 2 });
    
    expect(calcCalibration([])).toEqual({ status: "coletando", n: 0 });
    expect(calcCalibration(null)).toEqual({ status: "coletando", n: 0 });
  });

  test("Calculates stats correctly for exactly calibrated predictions", () => {
    const stats = [
      { previsao: 0.8, acerto: 0.8 },
      { previsao: 0.7, acerto: 0.7 },
      { previsao: 0.9, acerto: 0.9 },
      { previsao: 0.6, acerto: 0.6 },
      { previsao: 0.85, acerto: 0.85 }
    ];
    const res = calcCalibration(stats);
    expect(res).toEqual({
      status: "ok",
      precisao: 100,
      vies: 0,
      tendencia: "calibrado"
    });
  });

  test("Detects overconfidence (excesso_confianca)", () => {
    const stats = [
      { previsao: 0.9, acerto: 0.7 },
      { previsao: 0.8, acerto: 0.6 },
      { previsao: 0.95, acerto: 0.8 },
      { previsao: 0.85, acerto: 0.7 },
      { previsao: 0.9, acerto: 0.6 }
    ];
    // error = (0.2 + 0.2 + 0.15 + 0.15 + 0.3) / 5 = 1.0 / 5 = 0.2
    // bias = (0.2 + 0.2 + 0.15 + 0.15 + 0.3) / 5 = 0.2 (overconfident)
    const res = calcCalibration(stats);
    expect(res.precisao).toBe(80);
    expect(res.vies).toBe(20);
    expect(res.tendencia).toBe("excesso_confianca");
  });

  test("Detects underestimation (subestima)", () => {
    const stats = [
      { previsao: 0.6, acerto: 0.8 },
      { previsao: 0.5, acerto: 0.7 },
      { previsao: 0.7, acerto: 0.85 },
      { previsao: 0.65, acerto: 0.8 },
      { previsao: 0.55, acerto: 0.75 }
    ];
    // error = (0.2 + 0.2 + 0.15 + 0.15 + 0.2) / 5 = 0.9 / 5 = 0.18
    // bias = (-0.2 - 0.2 - 0.15 - 0.15 - 0.2) / 5 = -0.18 (underestimating)
    const res = calcCalibration(stats);
    expect(res.precisao).toBe(82);
    expect(res.vies).toBe(-18);
    expect(res.tendencia).toBe("subestima");
  });
});
