import { 
  totalQuestoesFeitas, 
  questoesHoje, 
  saldoRitmo, 
  metaPorArea, 
  scoreProntidao 
} from "./volume";
import { todayStr } from "./fsrs";

describe("Volume & Rhythm Core Logic Test Suite", () => {
  const today = todayStr();
  
  const mockTemas = [
    {
      unstarted: false,
      rev: {
        d0: { done: true, date: today, questoes: 20, acerto: 0.8 },
        d1: { done: true, date: today, questoes: 10, acerto: 0.9 },
        d3: { done: false, date: today, questoes: 15, acerto: null }
      }
    },
    {
      unstarted: false,
      rev: {
        d0: { done: true, date: "2026-05-20", questoes: 25, acerto: 0.7 },
        d1: { done: false, date: today, questoes: 5, acerto: null }
      }
    },
    {
      unstarted: true,
      rev: {
        d0: { done: true, date: today, questoes: 50, acerto: 0.9 }
      }
    }
  ];

  test("totalQuestoesFeitas sums up all questions from done reviews of active topics", () => {
    // 20 (mock1 d0) + 10 (mock1 d1) + 25 (mock2 d0) = 55
    // mock3 is unstarted, so it is ignored
    expect(totalQuestoesFeitas(mockTemas)).toBe(55);
  });

  test("questoesHoje sums up questions completed today", () => {
    // 20 (mock1 d0) + 10 (mock1 d1) = 30
    // mock2 d0 is past date, mock2 d1 is not done, mock3 is unstarted
    expect(questoesHoje(mockTemas)).toBe(30);
  });

  test("saldoRitmo returns pace balance", () => {
    const meta = { metaQuestoesDia: 10 };
    const pace = saldoRitmo(mockTemas, meta, today);
    // diffDays(today, today) = 0, so dias = 1.
    // esperado = 10 * 1 = 10
    // feito = 55
    // saldo = 55 - 10 = 45
    expect(pace).toEqual({
      feito: 55,
      esperado: 10,
      saldo: 45,
      dias: 1
    });

    const metaZero = { metaQuestoesDia: 0 };
    expect(saldoRitmo(mockTemas, metaZero, today)).toBeNull();
  });

  test("metaPorArea distributes questions prioritize weaknesses and exam weight", () => {
    const metaDia = 40;
    const acertoPorArea = {
      "Cirurgia": 0.8,
      "Clínica Médica": 0.6
    };
    const pesoArea = {
      "Cirurgia": 1.2,
      "Clínica Médica": 1.4
    };
    // raw values:
    // Cirurgia: (1 - 0.8) * 1.2 = 0.2 * 1.2 = 0.24
    // Clínica Médica: (1 - 0.6) * 1.4 = 0.4 * 1.4 = 0.56
    // Sum = 0.80
    // Distribution:
    // Cirurgia = 40 * 0.24 / 0.80 = 12
    // Clínica Médica = 40 * 0.56 / 0.80 = 28
    const distributed = metaPorArea(metaDia, acertoPorArea, pesoArea);
    expect(distributed["Cirurgia"]).toBe(12);
    expect(distributed["Clínica Médica"]).toBe(28);
  });

  test("scoreProntidao computes a weighted average of available indicators", () => {
    // 35% trueRetention, 30% acertoSimulado, 20% cobertura, 15% saldoRitmoNorm
    const score = scoreProntidao({
      trueRetention: 80,
      acertoSimulado: 70,
      cobertura: 50,
      saldoRitmoNorm: 100
    });
    // Expected: 80*0.35 + 70*0.30 + 50*0.20 + 100*0.15 = 28 + 21 + 10 + 15 = 74
    expect(score).toBe(74);

    // If one indicator is missing (e.g. acertoSimulado)
    const partialScore = scoreProntidao({
      trueRetention: 80,
      acertoSimulado: null,
      cobertura: 50,
      saldoRitmoNorm: 100
    });
    // Weights: 0.35 + 0.20 + 0.15 = 0.70
    // Value: (80*0.35 + 50*0.20 + 100*0.15) / 0.70 = (28 + 10 + 15) / 0.70 = 53 / 0.70 = 75.7 -> 76
    expect(partialScore).toBe(76);
  });
});
