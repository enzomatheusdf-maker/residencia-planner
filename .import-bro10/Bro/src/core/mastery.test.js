// src/core/mastery.test.js
import { getEstadoDominio, getProntidaoGlobal } from "./mastery";

describe("Mastery Learning Logic Test Suite", () => {
  const baseTema = {
    nome: "Apendicite",
    esp: "Cirurgia",
    rev: {
      d0: { done: true, acerto: 1.0, S: 1.0 },
      d1: { done: false, acerto: null, S: 1.0 },
      d4: { done: false, acerto: null, S: 4.0 },
      d7: { done: false, acerto: null, S: 7.0 },
      d21: { done: false, acerto: null, S: 21.0 }
    }
  };

  test("Initially, topic is APRENDENDO because it is incomplete and has only D0 done", () => {
    expect(getEstadoDominio(baseTema)).toBe("aprendendo");
  });

  test("Topic becomes CONSOLIDANDO when D7 is done and average accuracy is >= 75%", () => {
    const tema = {
      ...baseTema,
      rev: {
        ...baseTema.rev,
        d1: { done: true, acerto: 0.8, S: 1.2 },
        d4: { done: true, acerto: 0.78, S: 4.5 },
        d7: { done: true, acerto: 0.8, S: 8.0 }
      }
    };
    expect(getEstadoDominio(tema)).toBe("consolidando");
  });

  test("Topic does not become DOMINADO even if accuracy is >= 80% if D21 is not done", () => {
    const tema = {
      ...baseTema,
      rev: {
        ...baseTema.rev,
        d1: { done: true, acerto: 0.85, S: 1.5 },
        d4: { done: true, acerto: 0.85, S: 5.0 },
        d7: { done: true, acerto: 0.85, S: 9.0 }
      }
    };
    expect(getEstadoDominio(tema)).toBe("consolidando");
  });

  test("Topic becomes DOMINADO when D21 is done, average accuracy is >= 80%, S >= 15, and has >= 80% accuracy in at least 2 spaced reviews", () => {
    const tema = {
      ...baseTema,
      rev: {
        ...baseTema.rev,
        d1: { done: true, acerto: 0.85, S: 1.5 },
        d4: { done: true, acerto: 0.85, S: 5.0 },
        d7: { done: true, acerto: 0.82, S: 9.0 },
        d21: { done: true, acerto: 0.85, S: 22.0 }
      }
    };
    expect(getEstadoDominio(tema)).toBe("dominado");
  });

  test("Topic returns to CONSOLIDANDO if average accuracy drops below 80%", () => {
    const tema = {
      ...baseTema,
      rev: {
        ...baseTema.rev,
        d1: { done: true, acerto: 0.85, S: 1.5 },
        // A bad review or low simulation score drops average
        d4: { done: true, acerto: 0.50, S: 2.0 },
        d7: { done: true, acerto: 0.82, S: 9.0 },
        d21: { done: true, acerto: 0.85, S: 22.0 }
      }
    };
    // Completed review steps: 5 (including d0 with 1.0).
    // Sum: 1.0 (d0) + 0.85 + 0.50 + 0.82 + 0.85 = 4.02.
    // Average: 4.02 / 5 = 80.4%. Still >= 80%.
    // Let's drop it further:
    tema.rev.d4.acerto = 0.40;
    // Sum: 1.0 + 0.85 + 0.40 + 0.82 + 0.85 = 3.92.
    // Average: 3.92 / 5 = 78.4%. Below 80%.
    expect(getEstadoDominio(tema)).toBe("consolidando");
  });
});
