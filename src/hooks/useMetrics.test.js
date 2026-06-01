import { 
  calcFilaInteligente, 
  calcStreaks, 
  calcTrueRetention, 
  calcBleedingScore 
} from "./useMetrics";
import { todayStr, addDays } from "../core/fsrs";

describe("Metrics Calculation Test Suite", () => {
  test("calcFilaInteligente filters out unstarted topics and correctly prioritizing active overdue steps", () => {
    const today = todayStr();
    const mockTemas = [
      {
        id: 1,
        nome: "Tema Unstarted",
        esp: "GO",
        importancia: "ALTA",
        unstarted: true,
        rev: {
          d0: { date: today, done: false, S: 1.0 }
        }
      },
      {
        id: 2,
        nome: "Tema Ativo Atrasado",
        esp: "Cirurgia",
        importancia: "CRITICA",
        rev: {
          d0: { date: addDays(today, -3), done: false, S: 1.0 }, // Overdue
          d1: { date: addDays(today, 1), done: false, S: 2.0 }
        }
      },
      {
        id: 3,
        nome: "Tema Ativo Futuro",
        esp: "Preventiva",
        importancia: "MEDIA",
        rev: {
          d0: { date: addDays(today, 2), done: false, S: 1.0 } // Not due yet
        }
      }
    ];

    const queue = calcFilaInteligente(mockTemas);
    
    // Should NOT contain the unstarted topic (id: 1)
    expect(queue.some(item => item.temaId === 1)).toBe(false);

    // Should NOT contain the future topic (id: 3)
    expect(queue.some(item => item.temaId === 3)).toBe(false);

    // Should contain the active overdue topic (id: 2, step: d0)
    expect(queue.length).toBe(1);
    expect(queue[0].temaId).toBe(2);
    expect(queue[0].stepKey).toBe("d0");
  });

  test("calcFilaInteligente applies ENAMED weights and BONUS_RETORNO_RAPIDO under 60% for Preventive", () => {
    const today = todayStr();
    const mockTemas = [
      {
        id: 1,
        nome: "Preventiva Baixo",
        esp: "Preventiva",
        importancia: "ALTA",
        rev: {
          d0: { date: today, done: false, S: 1.0 }
        }
      }
    ];
    // Case 1: acertoMedia defaults to 0.5 (which is < 0.6) -> should apply Preventive bonus (0.10)
    const queue = calcFilaInteligente(mockTemas, "res");
    // score = (1 - 0.5) * 2.0 * 1.0 * 1.10 + 0.10 = 1.20
    expect(queue[0].score).toBe(1.20);
  });

  test("calcStreaks calculates active study consistency streaks", () => {
    const today = todayStr();
    const yesterday = addDays(today, -1);
    const twoDaysAgo = addDays(today, -2);
    const fourDaysAgo = addDays(today, -4);

    // 1. Consistent consecutive days (2, 1, 0 days ago)
    const activeDays1 = new Set([twoDaysAgo, yesterday, today]);
    const streak1 = calcStreaks(activeDays1);
    expect(streak1.current).toBe(3);
    expect(streak1.best).toBe(3);

    // 2. Broken streak (studied 4 days ago and yesterday, but skipped 2 and 3 days ago)
    const activeDays2 = new Set([fourDaysAgo, yesterday]);
    const streak2 = calcStreaks(activeDays2);
    expect(streak2.current).toBe(2);
    expect(streak2.best).toBe(2);
  });

  test("calcTrueRetention returns average of D21 mature step outcomes", () => {
    const mockTemas = [
      {
        id: 1,
        esp: "Pediatria",
        rev: {
          reviewHistory: [
            { stepKey: "d21", reviewedAt: "2026-06-01", acerto: 0.8, questoes: 20, official: true },
            { stepKey: "manutencao", phaseAfter: "maintenance", reviewedAt: "2026-06-10", acerto: 0.9, questoes: 10, official: true },
          ],
          d0: { done: true, acerto: 0.9 },
          d21: { done: true, acerto: 0.8 }
        }
      },
      {
        id: 2,
        esp: "Clinica",
        rev: {
          reviewHistory: [
            { stepKey: "d21", reviewedAt: "2026-06-01", acerto: 0.6, questoes: 30, official: true },
          ],
          d21: { done: true, acerto: 0.6 }
        }
      },
      {
        id: 3,
        esp: "GO",
        rev: {
          reviewHistory: [
            { stepKey: "d7", reviewedAt: "2026-06-01", acerto: 1.0, questoes: 50, official: true },
          ],
          d21: { done: false, acerto: null }
        }
      }
    ];

    const trueRetention = calcTrueRetention(mockTemas);
    // Weighted: (0.8*20 + 0.9*10 + 0.6*30) / (20+10+30) = 0.716...
    expect(trueRetention).toBe(72);
  });

  test("calcTrueRetention returns null when no long-retention evidence exists", () => {
    const mockTemas = [
      {
        id: 1,
        esp: "GO",
        rev: {
          reviewHistory: [{ stepKey: "d7", reviewedAt: "2026-06-01", acerto: 0.9, official: true }],
          d7: { done: true, acerto: 0.9 },
        },
      },
    ];
    expect(calcTrueRetention(mockTemas)).toBeNull();
  });

  test("calcTrueRetention ignores unofficial review events", () => {
    const mockTemas = [
      {
        id: 1,
        esp: "GO",
        rev: {
          reviewHistory: [
            { stepKey: "d21", reviewedAt: "2026-06-01", acerto: 1, questoes: 100, official: false },
          ],
        },
      },
    ];
    expect(calcTrueRetention(mockTemas)).toBeNull();
  });

  test("calcBleedingScore scores the lowest areas with sufficient question counts", () => {
    const mockTemas = [
      {
        id: 1,
        esp: "Pediatria",
        rev: {
          d0: { done: true, acerto: 0.5, questoes: 10 } // 50% on 10 Qs
        }
      },
      {
        id: 2,
        esp: "Cirurgia",
        rev: {
          d0: { done: true, acerto: 0.9, questoes: 12 } // 90% on 12 Qs
        }
      },
      {
        id: 3,
        esp: "GO",
        rev: {
          d0: { done: true, acerto: 0.4, questoes: 5 } // Skip (under 10 Qs)
        }
      }
    ];

    const bleeding = calcBleedingScore(mockTemas);
    
    // Only Pediatria (10 Qs) and Cirurgia (12 Qs) have >= 10 Qs.
    // Pediatria (50%) is lower than Cirurgia (90%).
    expect(bleeding.length).toBe(2);
    expect(bleeding[0].esp).toBe("Pediatria");
    expect(bleeding[0].acc).toBe(50);
  });
});
