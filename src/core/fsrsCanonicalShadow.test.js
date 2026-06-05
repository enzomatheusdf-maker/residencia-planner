import { Rating } from "ts-fsrs";
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
});
