// src/core/growthMetrics.js
import { todayStr, diffDays } from "./fsrs";

function getConfidenceVal(conf) {
  if (conf === null || conf === undefined) return 0.5;
  const c = String(conf).toLowerCase().trim();
  if (c === "alta" || c === "alto" || c === "3" || c === "high") return 1.0;
  if (c === "media" || c === "medio" || c === "normal" || c === "2" || c === "medium") return 0.6;
  if (c === "baixa" || c === "baixo" || c === "1" || c === "low") return 0.2;
  const n = parseFloat(conf);
  if (Number.isFinite(n)) {
    if (n > 1) return (n - 1) / 4; // Map 1-5 to 0-1
    return n;
  }
  return 0.5;
}

/**
 * Computes growth metrics and deltas for target windows.
 * @param {Array} events List of learning events.
 * @param {Object} options Configuration options.
 * @param {number} [options.window=30] The window size in days (defaults to 30).
 * @param {string} [options.today] Today's date string.
 * @param {number} [options.targetRetention=0.90] Target FSRS retention.
 * @param {number} [options.targetAcerto=0.85] Target correct rate.
 * @returns {Object} { retentionDelta, calibrationDelta, masteryByAreaDelta, vsGoal }
 */
export function computeGrowth(events = [], { window = 30, today = todayStr(), targetRetention = 0.90, targetAcerto = 0.85 } = {}) {
  const currentEvents = [];
  const previousEvents = [];

  for (const ev of events) {
    if (!ev) continue;
    const dateStr = ev.date || (ev.timestamp && ev.timestamp.slice(0, 10)) || (ev.completedAt && ev.completedAt.slice(0, 10));
    if (!dateStr) continue;

    const daysAgo = diffDays(dateStr.slice(0, 10), today);
    if (daysAgo >= 0 && daysAgo < window) {
      currentEvents.push(ev);
    } else if (daysAgo >= window && daysAgo < 2 * window) {
      previousEvents.push(ev);
    }
  }

  // Helper to calculate average acerto
  const calcAvgAcerto = (list) => {
    const valid = list.filter(e => e.acerto !== null && e.acerto !== undefined);
    if (valid.length === 0) return null;
    const sum = valid.reduce((acc, e) => acc + Number(e.acerto), 0);
    return sum / valid.length;
  };

  // Helper to calculate calibration score (1 - mean absolute error)
  const calcCalibration = (list) => {
    const valid = list.filter(e => e.acerto !== null && e.acerto !== undefined && e.confianca !== null && e.confianca !== undefined);
    if (valid.length === 0) return null;
    const sumError = valid.reduce((acc, e) => {
      const confVal = getConfidenceVal(e.confianca);
      return acc + Math.abs(confVal - Number(e.acerto));
    }, 0);
    return 1 - (sumError / valid.length);
  };

  // Helper to calculate average mastery by area
  const calcMasteryByArea = (list) => {
    const valid = list.filter(e => e.acerto !== null && e.acerto !== undefined && e.area);
    if (valid.length === 0) return null;

    const groups = {};
    for (const e of valid) {
      const a = e.area.trim();
      if (!groups[a]) groups[a] = [];
      groups[a].push(Number(e.acerto));
    }

    const averages = Object.values(groups).map(vals => vals.reduce((s, v) => s + v, 0) / vals.length);
    return averages.reduce((s, v) => s + v, 0) / averages.length;
  };

  // 1. Retention Delta
  const curRet = calcAvgAcerto(currentEvents);
  const prevRet = calcAvgAcerto(previousEvents);
  const retentionDelta = (curRet !== null && prevRet !== null) ? (curRet - prevRet) : 0;

  // 2. Calibration Delta
  const curCal = calcCalibration(currentEvents);
  const prevCal = calcCalibration(previousEvents);
  const calibrationDelta = (curCal !== null && prevCal !== null) ? (curCal - prevCal) : 0;

  // 3. Mastery By Area Delta
  const curMast = calcMasteryByArea(currentEvents);
  const prevMast = calcMasteryByArea(previousEvents);
  const masteryByAreaDelta = (curMast !== null && prevMast !== null) ? (curMast - prevMast) : 0;

  // 4. vsGoal
  const vsGoalRetention = curRet !== null ? (curRet - targetRetention) : 0;
  const vsGoalAcerto = curRet !== null ? (curRet - targetAcerto) : 0;

  return {
    retentionDelta,
    calibrationDelta,
    masteryByAreaDelta,
    vsGoal: {
      retention: vsGoalRetention,
      acerto: vsGoalAcerto
    }
  };
}
