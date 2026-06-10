import {
  DOMAIN_TEST_BRAIN_DUMP_FIELDS,
  calculateBrainDumpScore,
  calculateQuestionPercent,
  classifyDomainTest,
  getDomainTestRecommendation,
  validateDomainTestInput,
} from "./domainTest";

function checklistWith(value) {
  return DOMAIN_TEST_BRAIN_DUMP_FIELDS.reduce((acc, field) => {
    acc[field] = value;
    return acc;
  }, {});
}

describe("domain test engine", () => {
  test(">=80 percent questions plus brain dump >=70 classifies as consolidated", () => {
    const brainDumpScore = calculateBrainDumpScore(checklistWith(2));
    const questionPct = calculateQuestionPercent(24, 30);

    const classification = classifyDomainTest({ brainDumpScore, questionPct });

    expect(brainDumpScore).toBe(100);
    expect(questionPct).toBe(80);
    expect(classification.label).toBe("consolidated");
    expect(classification.recommendedAction).toBe("light_review");
    expect(classification.fsrsEntry).toBe("d21_or_maintenance");
  });

  test("65 to 79 percent questions classifies as rescue", () => {
    const classification = classifyDomainTest({
      brainDumpScore: 100,
      questionPct: calculateQuestionPercent(21, 30),
    });

    expect(classification.label).toBe("rescue");
    expect(classification.recommendedAction).toBe("directed_review");
    expect(classification.fsrsEntry).toBe("rescue_review");
  });

  test("less than 65 percent questions classifies as treat_as_new", () => {
    const classification = classifyDomainTest({
      brainDumpScore: 100,
      questionPct: calculateQuestionPercent(12, 20),
    });

    expect(classification.label).toBe("treat_as_new");
    expect(classification.recommendedAction).toBe("full_d0");
    expect(classification.fsrsEntry).toBe("d0");
  });

  test("brain dump below 40 with questions >=65 classifies as fragile_base", () => {
    const classification = classifyDomainTest({
      brainDumpScore: calculateBrainDumpScore(checklistWith(0)),
      questionPct: calculateQuestionPercent(18, 20),
    });

    expect(classification.label).toBe("fragile_base");
    expect(classification.recommendedAction).toBe("conceptual_review");
    expect(classification.fsrsEntry).toBe("conceptual_then_rescue");
  });

  test("many irrelevant detail errors classify as detail_noise", () => {
    const classification = classifyDomainTest({
      brainDumpScore: 100,
      questionPct: calculateQuestionPercent(24, 30),
      errorTypes: {
        irrelevantDetail: 4,
        content: 1,
      },
    });

    expect(classification.label).toBe("detail_noise");
    expect(classification.recommendedAction).toBe("pattern_log");
    expect(classification.fsrsEntry).toBe("pattern_only");
  });

  test("question total below 20 fails validation", () => {
    const result = validateDomainTestInput({
      checklist: checklistWith(2),
      total: 19,
      correct: 15,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "total_below_min")).toBe(true);
  });

  test("question total above 30 fails validation", () => {
    const result = validateDomainTestInput({
      checklist: checklistWith(2),
      total: 31,
      correct: 25,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "total_above_max")).toBe(true);
  });

  test("correct answers above total fails validation", () => {
    const result = validateDomainTestInput({
      checklist: checklistWith(2),
      total: 20,
      correct: 21,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "correct_above_total")).toBe(true);
  });

  test("recommendation maps classification to product status", () => {
    const recommendation = getDomainTestRecommendation("consolidated");

    expect(recommendation.status).toBe("validated_previously");
    expect(recommendation.conduta).toBe("nao_fazer_d0");
    expect(recommendation.message).toContain("Tema consolidado");
  });
});
