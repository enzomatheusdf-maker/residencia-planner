import {
  applyOnboardingChoice,
  getOnboardingDefaults,
  getRecommendedDefaultsForGoal,
  isOnboardingComplete,
} from "./onboarding";

describe("onboarding", () => {
  test("defaults para ENAMED", () => {
    const defaults = getRecommendedDefaultsForGoal("enamed");
    expect(defaults.calendarProvider).toBe("medcof");
    expect(defaults.mentorMode).toBe(true);
    expect(defaults.modules.enamed).toBe(true);
  });

  test("defaults para residencia", () => {
    const defaults = getRecommendedDefaultsForGoal("residencia");
    expect(defaults.mentorMode).toBe(true);
    expect(defaults.calendarProvider).toBe("custom");
    expect(defaults.modules.enamed).toBe(false);
  });

  test("onboarding completo", () => {
    const merged = applyOnboardingChoice(
      { onboarding: getOnboardingDefaults() },
      { goal: "ambos", calendarProvider: "estrategia_extensivo_user", completed: true, step: 2 }
    );
    expect(isOnboardingComplete({ onboarding: merged })).toBe(true);
    expect(merged.completedAt).toBeTruthy();
    expect(merged.calendarProvider).toBe("estrategia_extensivo_user");
  });

  test("nao sobrescreve onboarding existente", () => {
    const base = {
      modulos: { anki: true },
      onboarding: {
        completed: false,
        completedAt: null,
        step: 1,
        goal: "enamed",
        calendarProvider: "medcof",
        mentorMode: true,
        modules: {
          raciocinioClinico: true,
          anki: true,
          enamed: true,
        },
      },
    };

    const defaults = getOnboardingDefaults(base);
    expect(defaults.modules.anki).toBe(true);

    const merged = applyOnboardingChoice(base, { goal: "residencia" });
    expect(merged.modules.anki).toBe(true);
  });
});
