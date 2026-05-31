// src/core/gamif.test.js
import {
  getYearWeek,
  computeStreakOnStudy,
  recoverStreak,
  xpForReview,
  levelForXp,
  xpToNextLevel
} from "./gamif";

describe("Gamificação - MedRev v14", () => {
  describe("getYearWeek", () => {
    it("deve retornar o ano e a semana ISO corretos", () => {
      expect(getYearWeek("2026-05-29")).toBe("2026-W22");
    });
  });

  describe("computeStreakOnStudy", () => {
    const defaultGamif = {
      xp: 0,
      level: 1,
      streakCurrent: 0,
      streakBest: 0,
      lastStudyDate: null,
      freezesOwned: 1,
      freezesUsedDates: [],
      recoveryOwned: 0,
      badges: [],
      graceUsedThisWeek: false
    };

    it("deve iniciar a streak no primeiro estudo", () => {
      const state = computeStreakOnStudy(defaultGamif, "2026-05-29");
      expect(state.streakCurrent).toBe(1);
      expect(state.streakBest).toBe(1);
      expect(state.lastStudyDate).toBe("2026-05-29");
    });

    it("deve incrementar a streak no estudo do dia seguinte", () => {
      let state = computeStreakOnStudy(defaultGamif, "2026-05-28");
      state = computeStreakOnStudy(state, "2026-05-29");
      expect(state.streakCurrent).toBe(2);
      expect(state.streakBest).toBe(2);
    });

    it("não deve alterar a streak no estudo do mesmo dia", () => {
      let state = computeStreakOnStudy(defaultGamif, "2026-05-29");
      state = computeStreakOnStudy(state, "2026-05-29");
      expect(state.streakCurrent).toBe(1);
    });

    it("deve rastrear corretamente os dias de estudo na janela móvel de 7 dias", () => {
      let state = computeStreakOnStudy(defaultGamif, "2026-05-20"); // Quarta
      expect(state.streakCurrent).toBe(1);

      state = computeStreakOnStudy(state, "2026-05-22"); // Sexta
      expect(state.streakCurrent).toBe(2);

      state = computeStreakOnStudy(state, "2026-05-25"); // Segunda
      expect(state.streakCurrent).toBe(3); // 20, 22 e 25 estão na janela de 7 dias
    });

    it("deve descartar datas fora da janela móvel de 7 dias", () => {
      let state = computeStreakOnStudy(defaultGamif, "2026-05-10");
      expect(state.streakCurrent).toBe(1);

      // Estuda 10 dias depois (fora da janela de 7 dias)
      state = computeStreakOnStudy(state, "2026-05-20");
      expect(state.streakCurrent).toBe(1); // Somente dia 20 ativo na janela
    });

    it("deve manter freeze e grace period inalterados no cálculo básico", () => {
      let state = { ...defaultGamif, freezesOwned: 1, graceUsedThisWeek: false };
      state = computeStreakOnStudy(state, "2026-05-25");
      expect(state.freezesOwned).toBe(1);
      expect(state.graceUsedThisWeek).toBe(false);
    });
  });

  describe("recoverStreak", () => {
    it("deve recuperar a streak anterior usando recovery", () => {
      const brokenGamif = {
        streakCurrent: 1,
        streakPriorToReset: 5,
        recoveryOwned: 1,
        lostStreakDate: "2026-05-25"
      };

      const restored = recoverStreak(brokenGamif);
      expect(restored.streakCurrent).toBe(6);
      expect(restored.recoveryOwned).toBe(0);
      expect(restored.streakPriorToReset).toBe(0);
      expect(restored.lostStreakDate).toBeNull();
    });
  });

  describe("xpForReview", () => {
    it("deve calcular pontuação base de XP", () => {
      expect(xpForReview({ acerto: 0.5, stepKey: "d4", isInterleaved: false })).toBe(10);
    });

    it("deve conceder bônus por acerto elevado", () => {
      expect(xpForReview({ acerto: 0.85, stepKey: "d4", isInterleaved: false })).toBe(15);
    });

    it("deve conceder bônus por etapa d21", () => {
      expect(xpForReview({ acerto: 0.5, stepKey: "d21", isInterleaved: false })).toBe(20);
    });

    it("deve conceder bônus por interleaved", () => {
      expect(xpForReview({ acerto: 0.5, stepKey: "d4", isInterleaved: true })).toBe(15);
    });
  });

  describe("Níveis de XP", () => {
    it("deve calcular nível baseado no XP acumulado", () => {
      expect(levelForXp(0)).toBe(1);
      expect(levelForXp(49)).toBe(1);
      expect(levelForXp(50)).toBe(2);
      expect(levelForXp(200)).toBe(3);
    });

    it("deve retornar XP restante para o próximo nível", () => {
      expect(xpToNextLevel(30)).toBe(20);
      expect(xpToNextLevel(50)).toBe(150); // Nível 2 precisa de 200 XP para Nível 3 (3^2 * 50 = 450. Espera, 2^2*50=200 min XP para lvl3)
    });
  });
});
