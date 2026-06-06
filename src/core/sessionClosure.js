function parseTime(value) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function datePart(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const time = parseTime(value);
  return time == null ? "" : new Date(time).toISOString().slice(0, 10);
}

function reflectionMatchesPlatform(reflection = {}, plat) {
  if (!plat || !reflection.plat) return true;
  return reflection.plat === plat;
}

export function hasSessionClosureHistory({ sessionReflections = [], completedAt, plat } = {}) {
  const completedTime = parseTime(completedAt);
  if (completedTime == null) return false;

  const completedDate = datePart(completedAt);

  return (sessionReflections || []).some((reflection) => {
    if (!reflection || !reflectionMatchesPlatform(reflection, plat)) return false;

    const reflectionTime = parseTime(
      reflection.createdAt || reflection.completedAt || reflection.closedAt || reflection.timestamp
    );
    if (reflectionTime != null) return reflectionTime >= completedTime;

    return completedDate && datePart(reflection.date) === completedDate;
  });
}

export function getPendingSessionClosure({ meta = {}, sessionReflections = [], temas = [], plat } = {}) {
  const completedAt = meta.lastCompletedFocusSessionAt;
  if (!completedAt) return { hasPendingClosure: false, theme: null };

  const themeId = meta.lastCompletedFocusThemeId;
  const theme = themeId ? (temas || []).find((item) => String(item.id) === String(themeId)) || null : null;
  if (!theme) return { hasPendingClosure: false, theme: null };

  const reflectionTime = parseTime(meta.lastReflectionAt);
  const completedTime = parseTime(completedAt);
  if (reflectionTime != null && completedTime != null && reflectionTime >= completedTime) {
    return { hasPendingClosure: false, theme: null };
  }

  if (hasSessionClosureHistory({ sessionReflections, completedAt, plat })) {
    return { hasPendingClosure: false, theme: null };
  }

  return {
    hasPendingClosure: true,
    theme,
    completedAt,
    stepKey: meta.lastCompletedFocusStepKey || "",
  };
}
