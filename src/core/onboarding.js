const DEFAULT_MODULES = {
  raciocinioClinico: true,
  anki: false,
  enamed: true,
};

function toIsoNow() {
  return new Date().toISOString();
}

export function getRecommendedDefaultsForGoal(goal) {
  const normalizedGoal = goal === "residencia" || goal === "ambos" || goal === "enamed" ? goal : null;
  const base = {
    goal: normalizedGoal,
    mentorMode: true,
    calendarProvider: "medcof",
    modules: { ...DEFAULT_MODULES },
  };

  if (normalizedGoal === "residencia") {
    return {
      ...base,
      calendarProvider: "custom",
      modules: {
        ...base.modules,
        enamed: false,
      },
    };
  }

  if (normalizedGoal === "ambos") {
    return {
      ...base,
      calendarProvider: "medcof",
      modules: {
        ...base.modules,
        enamed: true,
      },
    };
  }

  return base;
}

export function getOnboardingDefaults(existingMeta = {}) {
  const previous = existingMeta?.onboarding || {};
  const recommended = getRecommendedDefaultsForGoal(previous.goal || null);
  const previousModules = previous.modules || {};
  const existingAnkiEnabled = existingMeta?.modulos?.anki === true || previousModules.anki === true;

  return {
    completed: previous.completed === true,
    completedAt: previous.completedAt || null,
    step: Number.isFinite(previous.step) ? previous.step : 0,
    goal: previous.goal || null,
    calendarProvider: previous.calendarProvider || recommended.calendarProvider || null,
    mentorMode: previous.mentorMode == null ? true : previous.mentorMode === true,
    modules: {
      ...DEFAULT_MODULES,
      ...recommended.modules,
      ...previousModules,
      anki: existingAnkiEnabled || previousModules.anki === true,
    },
  };
}

export function applyOnboardingChoice(meta = {}, choice = {}) {
  const current = getOnboardingDefaults(meta);
  const recommended = getRecommendedDefaultsForGoal(choice.goal || current.goal);
  const selectedModules = choice.modules || {};
  const preserveAnki = current.modules?.anki === true;
  const shouldComplete = choice.completed === true;

  const merged = {
    ...current,
    ...recommended,
    ...choice,
    step: Number.isFinite(choice.step) ? choice.step : current.step,
    completed: shouldComplete ? true : current.completed === true,
    completedAt: shouldComplete ? (current.completedAt || toIsoNow()) : current.completedAt,
    modules: {
      ...DEFAULT_MODULES,
      ...recommended.modules,
      ...current.modules,
      ...selectedModules,
      anki: preserveAnki || selectedModules.anki === true,
    },
  };

  return merged;
}

export function isOnboardingComplete(meta = {}) {
  return getOnboardingDefaults(meta).completed === true;
}
