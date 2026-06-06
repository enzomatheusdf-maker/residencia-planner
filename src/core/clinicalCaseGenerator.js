// src/core/clinicalCaseGenerator.js
// RC-G: assistive CaseInstance draft generation. Drafts are never publication-ready.

const PRESENTATIONS = new Set(["typical", "atypical"]);

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function firstSentence(text) {
  return String(text || "")
    .split(/[.;]/)
    .map((item) => item.trim())
    .find(Boolean) || "";
}

function buildTypicalVignette(script, subtopic) {
  const dx = script.tema || script.diagnosticoFinal || subtopic || "script clinico";
  const enabling = firstSentence(script.enabling) || "paciente com contexto epidemiologico compativel";
  const consequences = firstSentence(script.consequences) || "quadro clinico sugestivo";
  const criticalAction = script.keyFeatures?.find((kf) => kf?.isCritical)?.expectedAction
    || script.keyFeatures?.[0]?.expectedAction
    || "definir o proximo passo critico";

  return [
    `Paciente com ${enabling}, chega com ${consequences}.`,
    `O caso esta no subtópico ${subtopic || script.subtopic || "ENAMED"} e deve levar o aluno a reconhecer ${dx}.`,
    `A decisão crítica e indicar ${criticalAction}, sem expandir para anamnese completa.`,
  ].join(" ");
}

function buildAtypicalVignette(script, subtopic) {
  const dx = script.tema || script.diagnosticoFinal || subtopic || "script clinico";
  const enabling = firstSentence(script.enabling) || "fator de risco relevante";
  const consequences = firstSentence(script.consequences) || "manifestacoes cardinais discretas";
  const negative = asArray(script.pertinentNegatives)[0] || "ausencia de um achado classico";
  const criticalAction = script.keyFeatures?.find((kf) => kf?.isCritical)?.expectedAction
    || script.keyFeatures?.[0]?.expectedAction
    || "buscar a pista discriminante";

  return [
    `Paciente com ${enabling}, mas apresenta ${consequences.toLowerCase()} de forma incompleta.`,
    `Ha ${negative.toLowerCase()}, criando risco de fechamento precoce contra ${dx}.`,
    `A key feature e manter ${criticalAction} como passo decisivo no subtópico ${subtopic || script.subtopic || "ENAMED"}.`,
  ].join(" ");
}

export function generateClinicalCaseDraft({
  script,
  subtopic,
  presentation = "typical",
  now = new Date().toISOString(),
} = {}) {
  if (!script || typeof script !== "object") {
    throw new Error("IllnessScript obrigatorio para gerar rascunho RC-G.");
  }

  const normalizedPresentation = PRESENTATIONS.has(presentation) ? presentation : "typical";
  const keyFeatures = asArray(script.keyFeatures).map((kf) => ({
    prompt: String(kf.prompt || "Qual e o passo critico de decisao neste caso?"),
    expectedAction: String(kf.expectedAction || "Definir acao critica"),
    isCritical: kf.isCritical !== false,
  }));
  const effectiveKeyFeatures = keyFeatures.length > 0
    ? keyFeatures
    : [{
        prompt: "Qual e o passo critico de decisao neste caso?",
        expectedAction: "Definir acao critica",
        isCritical: true,
      }];

  const expectedAction = effectiveKeyFeatures.find((kf) => kf.isCritical)?.expectedAction
    || effectiveKeyFeatures[0].expectedAction;

  return {
    vignette: normalizedPresentation === "atypical"
      ? buildAtypicalVignette(script, subtopic)
      : buildTypicalVignette(script, subtopic),
    keyFeatures: effectiveKeyFeatures,
    expertReasoningTrace: [
      `Reconhecer o illness script de ${script.tema || script.diagnosticoFinal || "diagnostico alvo"} pelo menor conjunto de pistas decisivas.`,
      `Identificar a key feature: ${expectedAction}.`,
      "Comparar com diagnosticos confundiveis antes de fechar a hipotese.",
    ],
    pertinentNegatives: asArray(script.pertinentNegatives),
    discriminators: asArray(script.discriminators).map((item) => ({
      vs: String(item.vs || ""),
      feature: String(item.feature || ""),
    })).filter((item) => item.vs || item.feature),
    commonErrors: asArray(script.commonErrors),
    humanReviewRequired: true,
    reviewStatus: "pending_human_review",
    publicationStatus: "draft_only",
    source: "rc_g_assisted_generation",
    scriptId: script.id || null,
    subtopic: subtopic || script.subtopic || null,
    presentation: normalizedPresentation,
    generatedAt: now,
  };
}

