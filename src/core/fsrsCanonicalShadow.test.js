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
    expect(first.officialPolicy).toBe("observer_only_never_writes_official_schedule");
    expect(first.output.scheduledDays).not.toBeNull();
  });

  test("shadow replay remains observational and does not change official Lite dates", () => {
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
    expect(updated.d4.date).toBe(addDays(today, lastHist.intervalAfter));
    expect(updated.d4.date).toBe(updated.d4.scheduledAt);
  });
});
