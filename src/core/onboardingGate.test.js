import {
  shouldShowDailyBriefing,
  shouldShowGlobalOnboarding,
  shouldShowOnboardingV2,
  shouldShowVestibularStartTrail,
} from "./onboardingGate";

describe("onboardingGate", () => {
  test("mostra onboarding global quando ainda nao concluiu", () => {
    expect(shouldShowGlobalOnboarding({ onboardingDone: false, meta: { onboarding: { completed: false } } })).toBe(true);
  });

  test("nao mostra onboarding global quando ja concluiu", () => {
    expect(shouldShowGlobalOnboarding({ onboardingDone: true, meta: { onboarding: { completed: true } } })).toBe(false);
  });

  test("mostra trilha vestibular quando onboarding geral terminou mas a trilha nao", () => {
    expect(
      shouldShowVestibularStartTrail({
        plat: "vest",
        onboardingDone: true,
        meta: { onboarding: { completed: true }, vestibularStart: { completed: false } },
      })
    ).toBe(true);
  });

  test("bloqueia daily briefing enquanto onboarding ou trilha inicial estiverem ativos", () => {
    expect(shouldShowDailyBriefing({ onboardingDone: false, meta: { onboarding: { completed: false } } })).toBe(false);
    expect(
      shouldShowDailyBriefing({
        plat: "vest",
        onboardingDone: true,
        meta: { onboarding: { completed: true }, vestibularStart: { completed: false } },
      })
    ).toBe(false);
  });

  describe("shouldShowOnboardingV2", () => {
    test("mostra para usuario novo (onboarding ainda nao concluido)", () => {
      expect(shouldShowOnboardingV2({ meta: {} })).toBe(true);
      expect(shouldShowOnboardingV2({ meta: { onboarding: { completed: false } } })).toBe(true);
    });

    test("NAO reabre depois de pular (completed:true + version:2) — regressao do bug de skip", () => {
      expect(
        shouldShowOnboardingV2({
          meta: { onboarding: { completed: true, version: 2, source: "skipped" } },
        })
      ).toBe(false);
    });

    test("nao mostra quando planSetup ja foi concluido", () => {
      expect(
        shouldShowOnboardingV2({
          meta: { planSetup: { completedAt: "2026-06-02" }, onboarding: { version: 2 } },
        })
      ).toBe(false);
    });

    test("reabre v2 quando replay manual foi solicitado", () => {
      expect(
        shouldShowOnboardingV2({
          meta: { planSetup: { completedAt: "2026-06-02" }, onboarding: { version: 2, replayV2: true } },
        })
      ).toBe(true);
    });

    test("nao forca veterano v1 (completed:true, sem version 2)", () => {
      expect(shouldShowOnboardingV2({ meta: { onboarding: { completed: true } } })).toBe(false);
    });

    test("respeita dismissedAt e tourStep", () => {
      expect(shouldShowOnboardingV2({ meta: { onboarding: { dismissedAt: "2026-06-02" } } })).toBe(false);
      expect(shouldShowOnboardingV2({ tourStep: "dash", meta: {} })).toBe(false);
    });
  });
});
