// src/core/studyPlanIntentions.test.js
import { createIntention, nextReminderFor, calculate7DayAdherence } from "./studyPlanIntentions";

describe("Study Plan Intentions Test Suite", () => {
  test("creates an implementation intention successfully", () => {
    const intention = createIntention({
      cue: "Ao tomar o café da manhã",
      action: "fazer revisões do MedRev",
      window: "07:30",
    });

    expect(intention.cue).toBe("Ao tomar o café da manhã");
    expect(intention.action).toBe("fazer revisões do MedRev");
    expect(intention.window).toBe("07:30");
    expect(intention.createdAt).toBeDefined();
  });

  test("rejects intention creation without cue or action", () => {
    expect(() => createIntention({ cue: "", action: "fazer revisões" })).toThrow();
    expect(() => createIntention({ cue: "Ao acordar", action: "" })).toThrow();
  });

  test("schedules next reminder and calculates needsReplan based on adherence rate", () => {
    const intention = createIntention({
      cue: "Ao chegar do trabalho",
      action: "revisar 10 cards",
      window: "19:00",
    });

    // Good adherence (>= 70%) -> needsReplan: false
    const goodReminder = nextReminderFor(intention, "2026-06-06", 0.85);
    expect(goodReminder.needsReplan).toBe(false);
    expect(goodReminder.adherenceRate).toBe(0.85);
    expect(goodReminder.scheduledTime).toBe("19:00");

    // Poor adherence (< 70%) -> needsReplan: true
    const poorReminder = nextReminderFor(intention, "2026-06-06", 0.50);
    expect(poorReminder.needsReplan).toBe(true);
    expect(poorReminder.adherenceRate).toBe(0.50);
  });

  test("calculates needsReplan: true from history array with low adherence", () => {
    const intention = createIntention({
      cue: "Chegar em casa",
      action: "estudar",
      window: "20:00",
    });

    // Adherence array of last 7 days: 3 completed, 4 failed (3/7 ≈ 42.8% < 70%)
    const adherenceArray = [true, false, false, true, false, true, false];
    const reminder = nextReminderFor(intention, "2026-06-06", adherenceArray);

    expect(reminder.needsReplan).toBe(true);
    expect(reminder.adherenceRate).toBeCloseTo(3 / 7);
  });

  test("calculates needsReplan: false from history array with high adherence", () => {
    const intention = createIntention({
      cue: "Chegar em casa",
      action: "estudar",
      window: "20:00",
    });

    // Adherence array of last 7 days: 6 completed, 1 failed (6/7 ≈ 85.7% >= 70%)
    const adherenceArray = [true, true, true, false, true, true, true];
    const reminder = nextReminderFor(intention, "2026-06-06", adherenceArray);

    expect(reminder.needsReplan).toBe(false);
    expect(reminder.adherenceRate).toBeCloseTo(6 / 7);
  });

  test("calculates 7-day adherence rate from learning events", () => {
    const events = [
      { date: "2026-06-06T12:00:00Z" },
      { date: "2026-06-05" },
      { date: "2026-06-04" },
      { date: "2026-06-01" }, // 4 days with events in the 7-day window (06, 05, 04, 01)
      { date: "2026-05-20" }, // out of window
    ];

    const rate = calculate7DayAdherence(events, "2026-06-06");
    expect(rate).toBeCloseTo(4 / 7);
  });
});
