// src/core/mentor.test.js
import { getMentorDiagnosis, isExhaustionDetected } from "./mentor";

describe("Mentor Diagnosis - MedRev v14", () => {
  const dummyTemas = [];
  const dummyMeta = {};

  const makeLocalDateString = (hour, dayOffset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  it("deve retornar status de calibração se houver menos de 7 sessões", () => {
    const doneReviews = Array(5).fill({ done: true });
    const diag = getMentorDiagnosis("João", dummyTemas, doneReviews, {}, "res", dummyMeta);
    expect(diag.status).toBe("calibracao");
    expect(diag.message).toContain("Complete mais 2 sessões");
  });

  it("deve acusar exaustão se houver 3 sessões consecutivas tarde da noite com alta ansiedade", () => {
    // 7 done reviews to pass calibration check
    const doneReviews = Array(7).fill({ done: true, esp: "Pediatria", acerto: 0.8 });

    // 3 consecutive night logs with high anxiety in temaStats
    const temaStats = {
      "tema-1": [
        { completedAt: makeLocalDateString(23, -2), ansiedade: "Alta", acerto: 0.8 },
        { completedAt: makeLocalDateString(0, -1), ansiedade: "Alta", acerto: 0.8 },
      ],
      "tema-2": [
        { completedAt: makeLocalDateString(23, 0), ansiedade: "Alta", acerto: 0.7 },
      ]
    };

    const diag = getMentorDiagnosis("João", dummyTemas, doneReviews, temaStats, "res", dummyMeta);
    expect(diag.status).toBe("ativo");
    
    const exhaustionInsight = diag.insights.find(
      (ins) => ins.text.includes("Vi 3 noites seguidas de estudo tarde")
    );
    expect(exhaustionInsight).toBeDefined();
    expect(exhaustionInsight.type).toBe("alerta");
  });

  it("não deve acusar exaustão se as noites não forem consecutivas ou sem ansiedade alta", () => {
    const doneReviews = Array(7).fill({ done: true, esp: "Pediatria", acerto: 0.8 });

    // 3 night logs but broken by a daytime log or not all have high anxiety
    const temaStats = {
      "tema-1": [
        { completedAt: makeLocalDateString(23, -3), ansiedade: "Alta", acerto: 0.8 },
        { completedAt: makeLocalDateString(10, -2), ansiedade: "Alta", acerto: 0.8 }, // daytime study breaks consistency
        { completedAt: makeLocalDateString(23, -1), ansiedade: "Alta", acerto: 0.7 },
        { completedAt: makeLocalDateString(0, 0), ansiedade: "Alta", acerto: 0.8 },
      ]
    };

    const diag = getMentorDiagnosis("João", dummyTemas, doneReviews, temaStats, "res", dummyMeta);
    const exhaustionInsight = diag.insights.find(
      (ins) => ins.text.includes("Vi 3 noites seguidas de estudo tarde")
    );
    expect(exhaustionInsight).toBeUndefined();
  });

  describe("isExhaustionDetected", () => {
    let originalGetHours;
    beforeAll(() => {
      originalGetHours = Date.prototype.getHours;
    });
    afterAll(() => {
      Date.prototype.getHours = originalGetHours;
    });

    it("should return true when late night, high anxiety, and negative trend", () => {
      Date.prototype.getHours = () => 23; // late night
      const temaStats = {
        "tema-1": [{ completedAt: new Date().toISOString(), ansiedade: "Alta" }]
      };
      const doneReviews = [
        { done: true, acerto: 0.9 },
        { done: true, acerto: 0.8 },
        { done: true, acerto: 0.7 },
        { done: true, acerto: 0.6 }
      ];
      expect(isExhaustionDetected(temaStats, doneReviews)).toBe(true);
    });

    it("should return false when daytime", () => {
      Date.prototype.getHours = () => 10; // daytime
      const temaStats = {
        "tema-1": [{ completedAt: new Date().toISOString(), ansiedade: "Alta" }]
      };
      const doneReviews = [
        { done: true, acerto: 0.9 },
        { done: true, acerto: 0.8 },
        { done: true, acerto: 0.7 },
        { done: true, acerto: 0.6 }
      ];
      expect(isExhaustionDetected(temaStats, doneReviews)).toBe(false);
    });
  });
});
