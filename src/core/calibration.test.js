import {
  CALIBRATION_STATUS,
  CALIBRATION_TREND,
  buildCalibrationBuckets,
  calcCalibration,
  clamp01,
  normalizeCalibrationSample,
} from "./calibration";

describe("calibration - normalizacao", () => {
  test("clamp01 aceita 0-1", () => {
    expect(clamp01(0.8)).toBe(0.8);
  });

  test("clamp01 aceita 0-100", () => {
    expect(clamp01(80)).toBe(0.8);
  });

  test("normalizeCalibrationSample ignora item sem previsao", () => {
    expect(normalizeCalibrationSample({ acerto: 0.7 })).toBeNull();
  });

  test("normalizeCalibrationSample calcula erro previsao - acerto", () => {
    const sample = normalizeCalibrationSample({ previsao: 0.9, acerto: 0.7, questoes: 20 });
    expect(sample.error).toBeCloseTo(0.2);
    expect(sample.absError).toBeCloseTo(0.2);
    expect(sample.weight).toBe(20);
  });
});

describe("calcCalibration - status e metricas", () => {
  test("retorna coletando para array vazio", () => {
    const result = calcCalibration([]);
    expect(result.status).toBe(CALIBRATION_STATUS.COLLECTING);
    expect(result.n).toBe(0);
    expect(result.score).toBeNull();
  });

  test("retorna coletando com menos de 5 amostras", () => {
    const result = calcCalibration([
      { previsao: 0.8, acerto: 0.7 },
      { previsao: 0.7, acerto: 0.7 },
      { previsao: 0.6, acerto: 0.8 },
      { previsao: 0.9, acerto: 0.8 },
    ]);
    expect(result.status).toBe(CALIBRATION_STATUS.COLLECTING);
    expect(result.n).toBe(4);
  });

  test("retorna baixa_confianca com 5 a 9 amostras", () => {
    const stats = Array.from({ length: 7 }, () => ({ previsao: 0.8, acerto: 0.7 }));
    const result = calcCalibration(stats);
    expect(result.status).toBe(CALIBRATION_STATUS.LOW_CONFIDENCE);
    expect(result.n).toBe(7);
  });

  test("retorna ok com 10+ amostras", () => {
    const stats = Array.from({ length: 10 }, () => ({ previsao: 0.8, acerto: 0.75 }));
    const result = calcCalibration(stats);
    expect(result.status).toBe(CALIBRATION_STATUS.OK);
    expect(result.n).toBe(10);
  });

  test("detecta excesso de confianca", () => {
    const stats = Array.from({ length: 10 }, () => ({ previsao: 0.9, acerto: 0.65 }));
    const result = calcCalibration(stats);
    expect(result.tendencia).toBe(CALIBRATION_TREND.OVERCONFIDENT);
    expect(result.vies).toBe(25);
    expect(result.score).toBe(75);
  });

  test("detecta subestimacao", () => {
    const stats = Array.from({ length: 10 }, () => ({ previsao: 0.55, acerto: 0.8 }));
    const result = calcCalibration(stats);
    expect(result.tendencia).toBe(CALIBRATION_TREND.UNDERCONFIDENT);
    expect(result.vies).toBe(-25);
  });

  test("detecta calibrado dentro da tolerancia", () => {
    const stats = Array.from({ length: 10 }, () => ({ previsao: 0.72, acerto: 0.70 }));
    const result = calcCalibration(stats);
    expect(result.tendencia).toBe(CALIBRATION_TREND.CALIBRATED);
    expect(result.score).toBe(98);
  });

  test("pondera por numero de questoes", () => {
    const result = calcCalibration([
      { previsao: 1.0, acerto: 0.0, questoes: 1 },
      { previsao: 0.8, acerto: 0.8, questoes: 20 },
      ...Array.from({ length: 8 }, () => ({ previsao: 0.8, acerto: 0.8, questoes: 20 })),
    ]);
    expect(result.score).toBeGreaterThan(90);
  });
});

describe("buildCalibrationBuckets", () => {
  test("gera 5 buckets fixos", () => {
    const buckets = buildCalibrationBuckets([]);
    expect(buckets).toHaveLength(5);
    expect(buckets.map((b) => b.id)).toEqual(["0-20", "20-40", "40-60", "60-80", "80-100"]);
  });

  test("agrega previsao e acerto no bucket correto", () => {
    const result = calcCalibration([
      ...Array.from({ length: 10 }, () => ({ previsao: 0.85, acerto: 0.7 })),
    ]);
    const high = result.buckets.find((b) => b.id === "80-100");
    expect(high.n).toBe(10);
    expect(high.gapPct).toBe(15);
  });
});
