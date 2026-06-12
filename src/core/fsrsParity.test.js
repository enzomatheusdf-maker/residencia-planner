import { getNextReviewForTema } from "./domainValidation";
import {
  addDays,
  buildRev,
  diffDays,
  getRetencaoArea,
  normalizeTema,
  recalcAfterMark,
  todayStr,
} from "./fsrs";
import {
  buildReviewPreview,
  describeReviewTransition,
} from "./reviewOutcome";

const STEP_KEYS = ["d0", "d1", "d4", "d7", "d21", "manutencao"];
const RATING_CASES = [
  { rating: "again", acerto: 0.4 },
  { rating: "hard", acerto: 0.65 },
  { rating: "good", acerto: 0.82 },
  { rating: "easy", acerto: 0.95 },
];
const STATE_CASES = [
  { state: "no_prazo", dayShift: 0 },
  { state: "atraso_3d", dayShift: -3 },
  { state: "atraso_15d", dayShift: -15 },
  { state: "adiantado", dayShift: 3 },
  { state: "relearning_ativo", dayShift: 0, relearning: true },
  { state: "tema_maduro_com_lapso", dayShift: 0, mature: true },
];
const META = {
  retencaoFSRS: 0.9,
  intervaloMaxDias: 180,
  peakModePhase: "base",
};
const STEP_ORDER = ["d0", "d1", "d4", "d7", "d21"];

function makeMaintenanceStep(date, overrides = {}) {
  return {
    done: false,
    date,
    scheduledAt: date,
    reviewedAt: null,
    acerto: null,
    questoes: 20,
    S: 60,
    D: 0.5,
    interval: 60,
    phase: "maintenance",
    ...overrides,
  };
}

function makeTemaForScenario({ stepKey, stateCase }) {
  const today = todayStr();
  const rev = buildRev(addDays(today, -30), "GO");
  const currentDate = addDays(today, stateCase.dayShift);
  const currentIndex = STEP_ORDER.indexOf(stepKey);

  STEP_ORDER.forEach((key, index) => {
    const isPast = currentIndex === -1 || index < currentIndex;
    const date = isPast ? addDays(today, -30 + index) : addDays(today, index + 1);
    rev[key] = {
      ...rev[key],
      date,
      scheduledAt: date,
      reviewedAt: isPast ? date : null,
      done: isPast,
      acerto: isPast ? 0.9 : null,
      questoes: 20,
      phase: key === "d21" ? "review" : "learning",
    };
  });

  if (stepKey === "manutencao") {
    STEP_ORDER.forEach((key, index) => {
      const date = addDays(today, -35 + index);
      rev[key] = {
        ...rev[key],
        date,
        scheduledAt: date,
        reviewedAt: date,
        done: true,
        acerto: 0.9,
      };
    });
    rev.manutencao = makeMaintenanceStep(currentDate);
    rev.phase = "maintenance";
  } else {
    rev[stepKey] = {
      ...rev[stepKey],
      done: false,
      date: currentDate,
      scheduledAt: currentDate,
      reviewedAt: null,
      acerto: null,
      questoes: 20,
      S: stateCase.mature ? 75 : rev[stepKey].S,
      phase: stepKey === "d21" ? "review" : "learning",
    };
    rev.phase = stateCase.mature && stepKey === "d21" ? "review" : "learning";
  }

  if (stateCase.relearning) {
    rev.phase = "relearning";
    rev.relearning = {
      fromStep: "d21",
      targetStep: stepKey,
      startedAt: addDays(today, -2),
      reason: "cc4_parity_fixture",
    };
    if (rev[stepKey]) {
      rev[stepKey] = {
        ...rev[stepKey],
        phase: stepKey === "manutencao" ? "maintenance" : "relearning",
      };
    }
  } else {
    rev.relearning = null;
  }

  if (stateCase.mature) {
    if (stepKey === "d21") {
      rev.d21 = { ...rev.d21, S: 75, D: 0.5, phase: "review" };
      rev.manutencao = makeMaintenanceStep(addDays(today, 45), { S: 75 });
    }
    if (stepKey === "manutencao") {
      rev.manutencao = makeMaintenanceStep(currentDate, { S: 90, interval: 90 });
      rev.phase = "maintenance";
    }
  }

  return {
    id: `tema_${stepKey}_${stateCase.state}`,
    nome: `Tema ${stepKey} ${stateCase.state}`,
    esp: "GO",
    d0: addDays(today, -30),
    rev,
  };
}

function markForReview(rev, stepKey, acerto) {
  const reviewedAt = todayStr();
  const currentStep = rev?.[stepKey] || {};
  return {
    ...rev,
    [stepKey]: {
      ...currentStep,
      done: true,
      acerto,
      reviewedAt,
      completedAt: reviewedAt,
      scheduledAt: currentStep.scheduledAt || currentStep.date || reviewedAt,
    },
  };
}

function applyRealOutcome(tema, stepKey, acerto) {
  const desiredRetention = getRetencaoArea(tema.esp, META.retencaoFSRS);
  const marked = markForReview(tema.rev, stepKey, acerto);
  return recalcAfterMark(
    marked,
    stepKey,
    acerto,
    desiredRetention,
    META.intervaloMaxDias,
    tema.esp,
    {
      tema,
      examPhase: META.peakModePhase,
      overload: false,
      history: tema.rev?.reviewHistory || [],
    }
  );
}

function dateFromPreview(preview) {
  if (!preview || preview.daysUntil == null) return null;
  return addDays(todayStr(), preview.daysUntil);
}

function relearningFlags(relearning) {
  if (!relearning) return null;
  return {
    fromStep: relearning.fromStep || null,
    targetStep: relearning.targetStep || null,
    reason: relearning.reason || null,
    hasProtocol: Boolean(relearning.protocol),
  };
}

function expectPhaseAndRelearningCoherent(nextRev, actualNextReview, lastOfficialEvent) {
  expect(nextRev.phase || null).toBe(lastOfficialEvent?.phaseAfter || nextRev.phase || null);
  if (actualNextReview?.stepKey) {
    expect(nextRev[actualNextReview.stepKey]?.phase || null).not.toBeNull();
  }
  if (nextRev.phase === "relearning") {
    expect(nextRev.relearning).toEqual(expect.objectContaining({
      fromStep: expect.any(String),
      targetStep: expect.any(String),
      startedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    }));
    expect(relearningFlags(nextRev.relearning)?.targetStep).toBe(nextRev.relearning.targetStep);
  } else if (lastOfficialEvent?.phaseBefore === "relearning" && ["good", "easy"].includes(lastOfficialEvent.rating)) {
    expect(nextRev.relearning).toBeNull();
  }
}

describe("CC-4 FSRS preview parity", () => {
  test.each(
    STEP_KEYS.flatMap((stepKey) =>
      RATING_CASES.flatMap((ratingCase) =>
        STATE_CASES.map((stateCase) => ({
          name: `${stepKey} ${ratingCase.rating} ${stateCase.state}`,
          stepKey,
          ratingCase,
          stateCase,
        }))
      )
    )
  )(
    "preview matches applied outcome for $name",
    ({ stepKey, ratingCase, stateCase }) => {
      const tema = makeTemaForScenario({ stepKey, stateCase });
      const preview = buildReviewPreview({
        tema,
        stepKey,
        acerto: ratingCase.acerto,
        meta: META,
      });
      const nextRev = applyRealOutcome(tema, stepKey, ratingCase.acerto);
      const nextTema = { ...tema, rev: nextRev };
      const actualNextReview = getNextReviewForTema(nextTema);
      const actualTransition = describeReviewTransition({
        currentStepKey: stepKey,
        nextReview: actualNextReview,
      });
      const lastOfficialEvent = nextRev.reviewHistory?.[nextRev.reviewHistory.length - 1] || null;

      expect(preview).toEqual(actualTransition);
      expect(actualNextReview?.stepKey || null).toBe(preview.nextStepKey);
      expect(actualNextReview?.date || null).toBe(dateFromPreview(preview));
      expect(actualNextReview?.date ? diffDays(todayStr(), actualNextReview.date) : null).toBe(preview.daysUntil);
      expectPhaseAndRelearningCoherent(nextRev, actualNextReview, lastOfficialEvent);
    }
  );

  test("shadowContext keeps reviewHistory official and shadow data scoped to fsrsCanonicalShadow", () => {
    const today = todayStr();
    const rev = buildRev(today, "GO");
    const tema = {
      id: "tema-shadow-purity",
      nome: "Tema Shadow Purity",
      esp: "GO",
      rev,
    };
    const fakeShadow = {
      enabled: true,
      adapterVersion: "topic-as-card-v1",
      officialPolicy: "official_scheduler_with_lite_fallback",
      input: { temaId: tema.id, reviewedAt: today },
      output: {
        due: addDays(today, 5),
        scheduledDays: 5,
        stability: 8.5,
        difficulty: 0.42,
        state: "Review",
      },
      replay: { eventCount: 1 },
      comparison: { liteIntervalAfter: 3, canonicalIntervalAfter: 5 },
    };

    const nextRev = recalcAfterMark(
      markForReview(rev, "d1", 0.95),
      "d1",
      0.95,
      0.9,
      180,
      "GO",
      {
        tema,
        history: [{ id: "official_seed", official: true, stepKey: "d0", reviewedAt: addDays(today, -1) }],
        buildFsrsCanonicalShadow: () => fakeShadow,
      }
    );

    expect(nextRev.reviewHistory.length).toBeGreaterThan(0);
    expect(nextRev.reviewHistory.every((event) => event.official !== false)).toBe(true);
    const lastEvent = nextRev.reviewHistory[nextRev.reviewHistory.length - 1];
    expect(lastEvent.fsrsCanonicalShadow).toEqual(fakeShadow);
    expect(lastEvent.replay).toBeUndefined();
    expect(lastEvent.comparison).toBeUndefined();
    expect(lastEvent.adapterVersion).toBeUndefined();
    expect(lastEvent.fsrsCanonicalOfficial).toEqual(expect.objectContaining({ applied: true }));
  });

  test("D14 migration removes legacy key without orphaning or duplicating the next review", () => {
    const today = todayStr();
    const legacyD14Date = addDays(today, 2);
    const rev = buildRev(addDays(today, -30), "GO");
    ["d0", "d1", "d4", "d7"].forEach((key, index) => {
      const date = addDays(today, -20 + index);
      rev[key] = {
        ...rev[key],
        date,
        scheduledAt: date,
        reviewedAt: date,
        done: true,
        acerto: 0.9,
      };
    });
    rev.d14 = {
      date: legacyD14Date,
      scheduledAt: legacyD14Date,
      reviewedAt: null,
      done: false,
      acerto: null,
      phase: "review",
    };
    rev.d21 = {
      ...rev.d21,
      date: addDays(today, 21),
      scheduledAt: addDays(today, 21),
      reviewedAt: null,
      done: false,
      acerto: null,
    };

    const normalized = normalizeTema({
      id: "tema-d14-migration",
      nome: "Tema D14 Migration",
      esp: "GO",
      d0: addDays(today, -30),
      rev,
    });
    const reviewKeys = Object.keys(normalized.rev).filter((key) => /^d\d+$/.test(key));

    expect(normalized.rev.d14).toBeUndefined();
    expect(reviewKeys.filter((key) => key === "d21")).toHaveLength(1);
    expect(normalized.rev.d21.done).toBe(false);
    expect(normalized.rev.d21.date).toBe(legacyD14Date);
    expect(normalized.rev.d21.scheduledAt).toBe(legacyD14Date);
    expect(getNextReviewForTema(normalized)?.stepKey).toBe("d21");
  });
});
