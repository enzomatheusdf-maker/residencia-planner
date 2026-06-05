const EMPTY_DIRECTIONS = Object.freeze({
  canonical_later: 0,
  canonical_earlier: 0,
  same: 0,
  unknown: 0,
});

function emptyStepSummary() {
  return {
    count: 0,
    averageAbsDiffDays: 0,
    medianAbsDiffDays: 0,
    p90AbsDiffDays: 0,
    percentAbsDiffOver3Days: 0,
    high: 0,
  };
}

function average(total, count) {
  return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
}

function percentile(values = [], p = 0.5) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function median(values = []) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return Math.round(((sorted[middle - 1] + sorted[middle]) / 2) * 100) / 100;
}

export function buildFsrsShadowReport(temas = []) {
  const byStepTotals = {};
  const byStep = {};
  const byDirection = { ...EMPTY_DIRECTIONS };
  const topDivergences = [];

  let totalEvents = 0;
  let shadowEvents = 0;
  let failedEvents = 0;
  let highDivergenceEvents = 0;
  let moderateDivergenceEvents = 0;
  let absDiffTotal = 0;
  let absDiffCount = 0;
  let absDiffOver3Days = 0;
  const absDiffValues = [];

  (Array.isArray(temas) ? temas : []).forEach((tema) => {
    const history = Array.isArray(tema?.rev?.reviewHistory) ? tema.rev.reviewHistory : [];
    history.forEach((event) => {
      totalEvents += 1;
      const shadow = event?.fsrsCanonicalShadow;
      if (!shadow) return;

      shadowEvents += 1;
      if (shadow.failed) {
        failedEvents += 1;
        return;
      }

      const comparison = shadow.comparison || {};
      const stepKey = event.stepKey || shadow.input?.stepKey || "unknown";
      const direction = comparison.direction || "unknown";
      byDirection[direction] = (byDirection[direction] ?? 0) + 1;

      if (!byStep[stepKey]) byStep[stepKey] = emptyStepSummary();
      if (!byStepTotals[stepKey]) byStepTotals[stepKey] = { abs: 0, values: [], over3: 0 };
      byStep[stepKey].count += 1;

      const absDiffDays = Number(comparison.absDiffDays);
      if (Number.isFinite(absDiffDays)) {
        absDiffTotal += absDiffDays;
        absDiffCount += 1;
        absDiffValues.push(absDiffDays);
        if (absDiffDays > 3) absDiffOver3Days += 1;
        byStepTotals[stepKey].abs += absDiffDays;
        byStepTotals[stepKey].values.push(absDiffDays);
        if (absDiffDays > 3) byStepTotals[stepKey].over3 += 1;
      }

      if (comparison.severity === "high") {
        highDivergenceEvents += 1;
        byStep[stepKey].high += 1;
      }
      if (comparison.severity === "moderate") {
        moderateDivergenceEvents += 1;
      }

      topDivergences.push({
        temaId: tema?.id ?? shadow.input?.temaId ?? null,
        temaNome: tema?.nome ?? null,
        stepKey,
        reviewedAt: event.reviewedAt || shadow.input?.reviewedAt || null,
        liteIntervalAfter: comparison.liteIntervalAfter ?? null,
        canonicalIntervalAfter: comparison.canonicalIntervalAfter ?? null,
        diffDays: comparison.diffDays ?? null,
        absDiffDays: Number.isFinite(absDiffDays) ? absDiffDays : null,
        direction,
        severity: comparison.severity || "unknown",
      });
    });
  });

  Object.keys(byStep).forEach((stepKey) => {
    const stepValues = byStepTotals[stepKey]?.values || [];
    byStep[stepKey].averageAbsDiffDays = average(byStepTotals[stepKey]?.abs || 0, stepValues.length);
    byStep[stepKey].medianAbsDiffDays = median(stepValues);
    byStep[stepKey].p90AbsDiffDays = percentile(stepValues, 0.9);
    byStep[stepKey].percentAbsDiffOver3Days = average((byStepTotals[stepKey]?.over3 || 0) * 100, stepValues.length);
  });

  return {
    totalEvents,
    shadowEvents,
    failedEvents,
    highDivergenceEvents,
    moderateDivergenceEvents,
    averageAbsDiffDays: average(absDiffTotal, absDiffCount),
    medianAbsDiffDays: median(absDiffValues),
    p90AbsDiffDays: percentile(absDiffValues, 0.9),
    percentAbsDiffOver3Days: average(absDiffOver3Days * 100, absDiffCount),
    byStep,
    byDirection,
    topDivergences: topDivergences
      .sort((a, b) => (b.absDiffDays ?? -1) - (a.absDiffDays ?? -1))
      .slice(0, 20),
  };
}
