import { createEmptyCard, fsrs, Rating } from "ts-fsrs";

export const FSRS_CANONICAL_ADAPTER_VERSION = "topic-as-card-v1";

const DAY_MS = 86_400_000;

export function mapLiteRatingToCanonical(rating) {
  if (rating === "again") return Rating.Again;
  if (rating === "hard") return Rating.Hard;
  if (rating === "good") return Rating.Good;
  if (rating === "easy") return Rating.Easy;
  return null;
}

export function getCanonicalRatingLabel(rating) {
  if (rating == null) return null;
  return Rating[rating] || String(rating);
}

export function compareLiteVsCanonical({ liteIntervalAfter, canonicalIntervalAfter } = {}) {
  const lite = Number(liteIntervalAfter);
  const canonical = Number(canonicalIntervalAfter);
  const validLite = liteIntervalAfter != null && liteIntervalAfter !== "" && Number.isFinite(lite);
  const validCanonical = canonicalIntervalAfter != null && canonicalIntervalAfter !== "" && Number.isFinite(canonical);

  if (!validLite || !validCanonical) {
    return {
      liteIntervalAfter: validLite ? lite : null,
      canonicalIntervalAfter: validCanonical ? canonical : null,
      diffDays: null,
      absDiffDays: null,
      direction: "unknown",
      severity: "unknown",
    };
  }

  const diff = canonical - lite;
  const abs = Math.abs(diff);

  return {
    liteIntervalAfter: lite,
    canonicalIntervalAfter: canonical,
    diffDays: diff,
    absDiffDays: abs,
    direction: diff > 0 ? "canonical_later" : diff < 0 ? "canonical_earlier" : "same",
    severity: abs <= 1 ? "low" : abs <= 6 ? "moderate" : "high",
  };
}

function toReviewDate(value, fallback = new Date()) {
  const date = value ? new Date(`${String(value).slice(0, 10)}T12:00:00`) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function toIsoDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function serializeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null;
}

export function buildFsrsCanonicalShadow({
  tema,
  stepKey,
  acerto,
  ratingLite,
  effectiveRating,
  rawRatingFromAcerto,
  matureLapseAppliedByLite = false,
  scheduledAt,
  reviewedAt,
  atrasoDias,
  phaseBefore,
  liteIntervalAfter,
} = {}) {
  const ratingCanonicalInput = effectiveRating || ratingLite;
  const canonicalRating = mapLiteRatingToCanonical(ratingCanonicalInput);

  if (!canonicalRating) {
    return {
      enabled: true,
      adapterVersion: FSRS_CANONICAL_ADAPTER_VERSION,
      failed: true,
      error: "missing_canonical_rating",
    };
  }

  const reviewedDate = toReviewDate(reviewedAt);
  const cardCreatedAt = toReviewDate(scheduledAt || reviewedAt, reviewedDate);
  const scheduler = fsrs();
  const card = createEmptyCard(cardCreatedAt);
  const result = scheduler.next(card, reviewedDate, canonicalRating);
  const nextCard = result?.card || {};
  const canonicalDue = nextCard.due ? new Date(nextCard.due) : null;
  const canonicalIntervalAfter = canonicalDue && !Number.isNaN(canonicalDue.getTime())
    ? Math.max(0, Math.round((canonicalDue.getTime() - reviewedDate.getTime()) / DAY_MS))
    : null;

  return {
    enabled: true,
    adapterVersion: FSRS_CANONICAL_ADAPTER_VERSION,
    package: "ts-fsrs",
    input: {
      temaId: tema?.id ?? null,
      stepKey,
      acerto,
      ratingLite,
      effectiveRating,
      ratingCanonicalInput,
      ratingCanonical: getCanonicalRatingLabel(canonicalRating),
      rawRatingFromAcerto: rawRatingFromAcerto || ratingLite || null,
      matureLapseAppliedByLite: !!matureLapseAppliedByLite,
      reviewedAt,
      scheduledAt,
      atrasoDias,
      phaseBefore,
    },
    output: {
      ratingCanonical: getCanonicalRatingLabel(canonicalRating),
      elapsedDays: Number.isFinite(Number(atrasoDias)) ? Number(atrasoDias) : null,
      due: toIsoDate(canonicalDue),
      scheduledDays: canonicalIntervalAfter,
      stability: serializeNumber(nextCard.stability),
      difficulty: serializeNumber(nextCard.difficulty),
      retrievability: serializeNumber(nextCard.retrievability),
      state: nextCard.state == null ? null : String(nextCard.state),
    },
    comparison: compareLiteVsCanonical({
      liteIntervalAfter,
      canonicalIntervalAfter,
    }),
    warnings: ["topic_as_card_adapter_not_authoritative"],
  };
}
