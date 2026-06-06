import { generateClinicalCaseDraft } from "./clinicalCaseGenerator";

const script = {
  id: "dor-toracica-coronariana",
  tema: "Dor Toracica Coronariana",
  subtopic: "Cardiologia",
  enabling: "Idade, tabagismo, hipertensao e diabetes aumentam risco de SCA.",
  consequences: "Dor anginosa tipica, sudorese e instabilidade em casos graves.",
  keyFeatures: [
    {
      prompt: "Qual exame obrigatorio realizar em ate 10 minutos?",
      expectedAction: "Eletrocardiograma (ECG)",
      isCritical: true,
    },
  ],
  pertinentNegatives: ["Ausencia de dor pleuritica"],
  discriminators: [{ vs: "tep", feature: "TEP: dispneia aguda predominante e dor pleuritica." }],
  commonErrors: ["premature_closure"],
};

describe("clinicalCaseGenerator RC-G", () => {
  test("gera rascunho JSON marcado para revisao humana", () => {
    const draft = generateClinicalCaseDraft({
      script,
      subtopic: "Cardiologia",
      presentation: "typical",
      now: "2026-06-06T00:00:00.000Z",
    });

    expect(draft).toMatchObject({
      humanReviewRequired: true,
      reviewStatus: "pending_human_review",
      publicationStatus: "draft_only",
      source: "rc_g_assisted_generation",
      scriptId: "dor-toracica-coronariana",
      subtopic: "Cardiologia",
      presentation: "typical",
    });
    expect(draft.vignette).toContain("Eletrocardiograma");
    expect(draft.keyFeatures).toEqual(script.keyFeatures);
    expect(draft.expertReasoningTrace).toHaveLength(3);
    expect(draft.discriminators).toEqual(script.discriminators);
  });

  test("apresentacao atipica inclui negativo pertinente e mantem key feature", () => {
    const draft = generateClinicalCaseDraft({
      script,
      subtopic: "Cardiologia",
      presentation: "atypical",
    });

    expect(draft.presentation).toBe("atypical");
    expect(draft.vignette).toContain("ausencia de dor pleuritica");
    expect(draft.keyFeatures[0].expectedAction).toBe("Eletrocardiograma (ECG)");
  });

  test("falha sem illness script", () => {
    expect(() => generateClinicalCaseDraft()).toThrow("IllnessScript obrigatorio");
  });
});

