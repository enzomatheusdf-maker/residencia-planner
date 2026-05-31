export const PLATFORM = {
  RES: "res",
  VEST: "vest",
};

export function getPlatformFeatures(plat) {
  const isVest = plat === PLATFORM.VEST;
  return {
    enamed: !isVest,
    raciocinioClinico: !isVest,
    illnessScript: !isVest,
    casosClinicos: !isVest,

    vestibularStats: isVest,
    vestibularCalendar: isVest,

    calendarProviders: true,
    customCalendar: true,
    mentor: true,
    fsrs: true,
    actionInbox: true,
    backup: true,
    focusMode: true,
    weeklyReview: true,
    peakMode: true,
  };
}

export function featureEnabled(plat, feature) {
  return Boolean(getPlatformFeatures(plat)[feature]);
}
