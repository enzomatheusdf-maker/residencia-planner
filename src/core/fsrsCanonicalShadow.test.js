import { Rating } from "ts-fsrs";
import {
  addDays,
  buildRev,
  recalcAfterMark,
  todayStr,
} from "./fsrs";
import {
  buildFsrsCanonicalShadow,
  compareLiteVsCanonical,
  getCanonicalScheduleOverride,
  mapLiteRatingToCanonical,
} from "./fsrsCanonicalShadow";

describe("fsrsCanonicalShadow", () => {
  test("maps Lite ratings to canonical ts-fsrs ratings", () => {
    expect(mapLiteRatingToCanonical("again")).toBe(Rating.Again);
    expect(mapLiteRatingToCanonical("hard")).toBe(Rating.Hard);
    expect(mapLiteRatingToCanonical("good")).toBe(Rating.Good);
    expect(mapLiteRatingToCanonical("easy")).toBe(Rating.Easy);
    expect(mapLiteRatingToCanonical("invalid")).toBeNull();
  });

  test("compares Lite and canonical intervals", () => {
    expect(compareLiteVsCanonical({ liteIntervalAfter: 4, canonicalIntervalAfter: 5 })).toMatchObject({
      diffDays: 1,
      absDiffDays: 1,
      direction: "canonical_later",
      severity: "low",
    });
    expect(compareLiteVsCanonical({ liteIntervalAfter: 7, canonicalIntervalAfter: 3 })).toMatchObject({
      diffDays: -4,
      absDiffDays: 4,
      direction: "canonical_earlier",
      severity: "moderate",
    });
    expect(compareLiteVsCanonical({ liteIntervalAfter: 21, canonicalIntervalAfter: 40 })).toMatchObject({
      diffDays: 19,
      absDiffDays: 19,
      direction: "canonical_later",
      severity: "high",
    });
    expect(compareLiteVsCanonical({ liteIntervalAfter: null, canonicalIntervalAfter: 5 })).toMatchObject({
      direction: "unknown",
      severity: "unknown",
    });
  });

  test("builds a serializable shadow event without changing official scheduling", () => {
    const shadow = buildFsrsCanonicalShadow({
      tema: { id: "tema-1", nome: "Sepse" },
      stepKey: "d4",
      acerto: 0.82,
      ratingLite: "good",
      effectiveRating: "good",
      scheduledAt: "2026-06-01",
      reviewedAt: "2026-06-04",
      atrasoDias: 3,
      phaseBefore: "learning",
      liteIntervalAfter: 4,
    });

    expect(shadow.enabled).toBe(true);
    expect(shadow.package).toBe("ts-fsrs");
    expect(shadow.input.temaId).toBe("tema-1");
    expect(shadow.input.ratingCanonicalInput).toBe("good");
    expect(shadow.output.ratingCanonical).toBe("Good");
    expect(shadow.comparison.liteIntervalAfter).toBe(4);
    expect(shadow.warnings).toContain("topic_as_card_adapter_not_authoritative");
    expect(() => JSON.stringify(shadow)).not.toThrow();
  });

  test("replays official history deterministically through one canonical card", () => {
    const tema = {
      id: "tema-replay",
      nome: "Choque",
      rev: {
        reviewHistory: [
          {
            stepKey: "d1",
            reviewedAt: "2026-06-01",
            scheduledAt: "2026-06-01",
            rating: "good",
            effectiveRating: "good",
            intervalAfter: 3,
            official: true,
          },
          {
            stepKey: "d4-shadow-only",
            reviewedAt: "2026-06-02",
            scheduledAt: "2026-06-02",
            rating: "again",
            effectiveRating: "again",
            intervalAfter: 1,
            official: false,
          },
        ],
      },
    };
    const input = {
      tema,
      stepKey: "d4",
      acerto: 0.86,
      ratingLite: "good",
      effectiveRating: "good",
      scheduledAt: "2026-06-04",
      reviewedAt: "2026-06-04",
      atrasoDias: 0,
      phaseBefore: "learning",
      liteIntervalAfter: 4,
    };

    const first = buildFsrsCanonicalShadow(input);
    const second = buildFsrsCanonicalShadow(input);

    expect(first).toEqual(second);
    expect(first.input.replayEventCount).toBe(2);
    expect(first.replay).toMatchObject({
      eventCount: 2,
      firstReviewedAt: "2026-06-01",
      latestReviewedAt: "2026-06-04",
      latestStepKey: "d4",
    });
    expect(first.officialPolicy).toBe("official_scheduler_with_lite_fallback");
    expect(first.output.scheduledDays).not.toBeNull();
  });

  test("canonical replay can drive official scheduling when topic context is present", () => {
    const today = todayStr();
    const initialRev = buildRev(today, "GO");
    initialRev.d1 = {
      ...initialRev.d1,
      done: true,
      reviewedAt: today,
      scheduledAt: today,
      date: today,
    };

    const updated = recalcAfterMark(initialRev, "d1", 0.9, 0.90, 180, "GO", {
      tema: { id: "tema-shadow-replay", nome: "Tema Shadow Replay", rev: initialRev },
    });
    const lastHist = updated.reviewHistory[updated.reviewHistory.length - 1];

    expect(lastHist.fsrsCanonicalShadow).toBeTruthy();
    expect(lastHist.fsrsCanonicalShadow.replay.eventCount).toBe(1);
    expect(lastHist.source).toBe("ts-fsrs");
    expect(lastHist.fsrsCanonicalOfficial.applied).toBe(true);
    expect(lastHist.liteIntervalAfter).not.toBeNull();
    expect(updated.d4.date).toBe(lastHist.fsrsCanonicalOfficial.due);
    expect(updated.d4.date).toBe(addDays(today, lastHist.intervalAfter));
    expect(updated.d4.date).toBe(updated.d4.scheduledAt);
  });

  test("extracts a bounded official schedule override from canonical shadow", () => {
    const shadow = buildFsrsCanonicalShadow({
      tema: { id: "tema-override", nome: "Tema Override" },
      stepKey: "d1",
      acerto: 0.9,
      ratingLite: "good",
      effectiveRating: "good",
      scheduledAt: "2026-06-01",
      reviewedAt: "2026-06-01",
      atrasoDias: 0,
      phaseBefore: "learning",
      liteIntervalAfter: 4,
    });

    const override = getCanonicalScheduleOverride(shadow, { minInterval: 1, maxInterval: 180 });
    expect(override.interval).toBeGreaterThanOrEqual(1);
    expect(override.due).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(override.S).not.toBeNull();
    expect(override.D).not.toBeNull();
  });
});
