// src/core/studyPlanIntentions.js

/**
 * Creates an implementation intention.
 * @param {Object} params - The params object.
 * @param {string} params.cue - The context or cue trigger (e.g., "Ao acordar", "Chegar em casa").
 * @param {string} params.action - The target study action (e.g., "abrir o MedRev e fazer a fila").
 * @param {string} [params.window] - The time window (e.g., "08:00", "20:00").
 * @returns {Object} The intention object.
 */
export function createIntention({ cue, action, window }) {
  if (!cue || !action) {
    throw new Error("Cue and action are required to create a study plan intention.");
  }
  return {
    cue,
    action,
    window: window || "08:00",
    createdAt: new Date().toISOString()
  };
}

/**
 * Calculates the next reminder details for a study plan intention.
 * If 7-day adherence is below the threshold (70%), needsReplan is set to true.
 * @param {Object} intention - The intention object.
 * @param {string} today - Today's date string (YYYY-MM-DD).
 * @param {number|Array} adherence - Adherence rate (number between 0 and 1, or array of completion outcomes).
 * @returns {Object|null} Reminder details.
 */
export function nextReminderFor(intention, today, adherence) {
  if (!intention) return null;

  let rate = 1.0;
  if (typeof adherence === "number") {
    rate = adherence;
  } else if (Array.isArray(adherence)) {
    if (adherence.length > 0) {
      // Look at the last 7 days of adherence
      const last7 = adherence.slice(-7);
      const successes = last7.filter(val => val === true || val === 1 || (typeof val === "object" && val?.done)).length;
      rate = successes / last7.length;
    }
  } else if (adherence && typeof adherence === "object") {
    rate = adherence.rate != null ? adherence.rate : 1.0;
  }

  const threshold = 0.70; // 70% threshold
  const needsReplan = rate < threshold;

  return {
    scheduledDate: today,
    scheduledTime: intention.window || "08:00",
    cue: intention.cue,
    action: intention.action,
    needsReplan,
    adherenceRate: rate,
  };
}

/**
 * Helper to calculate 7-day study adherence rate from learning events.
 * Returns a number between 0 and 1.
 * @param {Array} learningEvents List of learning events.
 * @param {string} today YYYY-MM-DD date string.
 * @returns {number} Adherence rate.
 */
export function calculate7DayAdherence(learningEvents = [], today) {
  if (!today) return 1.0;
  
  // Get date strings for the last 7 days
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(`${today}T00:00:00`);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dates.push(dateStr);
  }

  const eventDates = new Set(
    learningEvents
      .map(e => {
        if (!e) return null;
        const dateStr = e.date || (e.timestamp && e.timestamp.slice(0, 10));
        return dateStr ? dateStr.slice(0, 10) : null;
      })
      .filter(Boolean)
  );

  const daysWithActivity = dates.filter(d => eventDates.has(d)).length;
  return daysWithActivity / 7;
}
