import { createEmptyCard, fsrs, Rating } from "ts-fsrs";

export const FSRS_CANONICAL_ADAPTER_VERSION = "topic-as-card-v1";
export const FSRS_CANONICAL_OFFICIAL_POLICY = "observer_only_never_writes_official_schedule";

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

function eventReviewDateValue(event = {}) {
  return event.reviewedAt || event.date || event.completedAt || event.timestamp || null;
}

function normalizeReplayEvent(event = {}, fallback = {}) {
  const ratingInput = event.effectiveRating || event.ratingLite || event.rating || fallback.effectiveRating || fallback.ratingLite;
  const canonicalRating = mapLiteRatingToCanonical(ratingInput);
  const reviewedAt = eventReviewDateValue(event) || fallback.reviewedAt;
  const reviewedDate = toReviewDate(reviewedAt);
  const scheduledAt = event.scheduledAt || event.date || fallback.scheduledAt || reviewedAt;

  if (!canonicalRating || !reviewedAt) return null;

  return {
    ...event,
    stepKey: event.stepKey || fallback.stepKey || null,
    acerto: event.acerto ?? fallback.acerto ?? null,
    ratingLite: event.ratingLite || event.rating || fallback.ratingLite || null,
    effectiveRating: event.effectiveRating || fallback.effectiveRating || null,
    ratingCanonicalInput: ratingInput,
    ratingCanonical: canonicalRating,
    scheduledAt,
    reviewedAt,
    reviewedDate,
    liteIntervalAfter: event.intervalAfter ?? event.liteIntervalAfter ?? fallback.liteIntervalAfter ?? null,
    atrasoDias: event.atrasoDias ?? fallback.atrasoDias ?? null,
    phaseBefore: event.phaseBefore || fallback.phaseBefore || null,
    originalIndex: fallback.originalIndex ?? 0,
  };
}

function getOfficialReplayHistory(tema = {}) {
  const history = Array.isArray(tema?.rev?.reviewHistory)
    ? tema.rev.reviewHistory
    : Array.isArray(tema?.reviewHistory)
      ? tema.reviewHistory
      : [];

  return history.filter((event) => event && event.official !== false);
}

function buildReplayEvents({ tema, currentEvent } = {}) {
  const historyEvents = getOfficialReplayHistory(tema).map((event, index) => (
    normalizeReplayEvent(event, { originalIndex: index })
  )).filter(Boolean);
  const current = normalizeReplayEvent(currentEvent, { originalIndex: historyEvents.length });
  const replayEvents = current ? [...historyEvents, current] : historyEvents;

  return replayEvents
    .map((event, replayIndex) => ({ ...event, replayIndex }))
    .sort((a, b) => {
      const dateA = a.reviewedDate.getTime();
      const dateB = b.reviewedDate.getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.replayIndex - b.replayIndex;
    });
}

function intervalFromDue(due, reviewedDate) {
  const canonicalDue = due ? new Date(due) : null;
  if (!canonicalDue || Number.isNaN(canonicalDue.getTime())) return { canonicalDue: null, canonicalIntervalAfter: null };
  return {
    canonicalDue,
    canonicalIntervalAfter: Math.max(0, Math.round((canonicalDue.getTime() - reviewedDate.getTime()) / DAY_MS)),
  };
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
  const currentEvent = {
    stepKey,
    acerto,
    rating: ratingLite,
    ratingLite,
    effectiveRating,
    scheduledAt,
    reviewedAt,
    atrasoDias,
    phaseBefore,
    intervalAfter: liteIntervalAfter,
  };
  const replayEvents = buildReplayEvents({ tema, currentEvent });

  if (replayEvents.length === 0) {
    return {
      enabled: true,
      adapterVersion: FSRS_CANONICAL_ADAPTER_VERSION,
      officialPolicy: FSRS_CANONICAL_OFFICIAL_POLICY,
      failed: true,
      error: "missing_canonical_rating",
    };
  }

  const scheduler = fsrs();
  const cardCreatedAt = toReviewDate(replayEvents[0].scheduledAt || replayEvents[0].reviewedAt, replayEvents[0].reviewedDate);
  let card = createEmptyCard(cardCreatedAt);
  let latestResult = null;

  replayEvents.forEach((event) => {
    latestResult = scheduler.next(card, event.reviewedDate, event.ratingCanonical);
    card = latestResult?.card || card;
  });

  const latestEvent = replayEvents[replayEvents.length - 1];
  const nextCard = latestResult?.card || {};
  const { canonicalDue, canonicalIntervalAfter } = intervalFromDue(nextCard.due, latestEvent.reviewedDate);
  const ratingCanonicalInput = latestEvent.ratingCanonicalInput;
  const canonicalRating = latestEvent.ratingCanonical;

  return {
    enabled: true,
    adapterVersion: FSRS_CANONICAL_ADAPTER_VERSION,
    officialPolicy: FSRS_CANONICAL_OFFICIAL_POLICY,
    package: "ts-fsrs",
    input: {
      temaId: tema?.id ?? null,
      stepKey: latestEvent.stepKey,
      acerto: latestEvent.acerto,
      ratingLite: latestEvent.ratingLite,
      effectiveRating: latestEvent.effectiveRating,
      ratingCanonicalInput,
      ratingCanonical: getCanonicalRatingLabel(canonicalRating),
      rawRatingFromAcerto: rawRatingFromAcerto || ratingLite || null,
      matureLapseAppliedByLite: !!matureLapseAppliedByLite,
      reviewedAt: latestEvent.reviewedAt,
      scheduledAt: latestEvent.scheduledAt,
      atrasoDias: latestEvent.atrasoDias,
      phaseBefore: latestEvent.phaseBefore,
      replayEventCount: replayEvents.length,
    },
    output: {
      ratingCanonical: getCanonicalRatingLabel(canonicalRating),
      elapsedDays: Number.isFinite(Number(latestEvent.atrasoDias)) ? Number(latestEvent.atrasoDias) : null,
      due: toIsoDate(canonicalDue),
      scheduledDays: canonicalIntervalAfter,
      stability: serializeNumber(nextCard.stability),
      difficulty: serializeNumber(nextCard.difficulty),
      retrievability: serializeNumber(nextCard.retrievability),
      state: nextCard.state == null ? null : String(nextCard.state),
    },
    comparison: compareLiteVsCanonical({
      liteIntervalAfter: latestEvent.liteIntervalAfter,
      canonicalIntervalAfter,
    }),
    replay: {
      eventCount: replayEvents.length,
      firstReviewedAt: replayEvents[0]?.reviewedAt || null,
      latestReviewedAt: latestEvent.reviewedAt || null,
      latestStepKey: latestEvent.stepKey || null,
    },
    warnings: ["topic_as_card_adapter_not_authoritative"],
  };
}
