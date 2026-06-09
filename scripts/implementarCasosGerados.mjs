import fs from "node:fs";
import path from "node:path";

const SOURCE_DIR = "casos_validos";
const TARGET_FILE = path.join("src", "constants", "generatedClinicalCases.js");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function asText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join("; ");
  return String(value || "");
}

function normalizeDifficulty(script) {
  const raw = String(script?.incidenciaEnamed || "").toLowerCase();
  if (raw.includes("baixa")) return "facil";
  if (raw.includes("alta")) return "media";
  return "media";
}

function firstInstance(instances, presentation) {
  return asArray(instances).find((instance) => instance?.presentation === presentation) || null;
}

function buildSct(script, typical) {
  const discriminator = asArray(script.discriminators)[0];
  const primaryDifferential = asArray(typical?.differentials)[0];
  const sct = [];

  if (discriminator?.feature) {
    sct.push({
      hipotese: script.entidade,
      novaInfo: discriminator.feature,
      efeitoPainel: 2,
      racional: "A pista discriminadora reforça o diagnóstico-alvo frente ao principal confundível.",
    });
  }

  if (primaryDifferential?.dx) {
    sct.push({
      hipotese: script.entidade,
      novaInfo: `Achados passam a favorecer ${primaryDifferential.dx}.`,
      efeitoPainel: -1,
      racional: "Quando o principal diferencial explica melhor a síndrome, a hipótese-alvo perde força.",
    });
  }

  return sct;
}

function buildAnamnese(script) {
  return {
    queixa: script.sindrome || script.entidade || "Queixa clínica",
    roteiro: [
      {
        bloco: "Representação sindrômica",
        perguntasChave: [
          "Qual é o tempo de evolução e o padrão dos sintomas?",
          "Quais achados definem a síndrome guarda-chuva?",
          "Há sinais de gravidade ou instabilidade?",
        ],
      },
      {
        bloco: "Diferenciais próximos",
        perguntasChave: [
          "Qual é o principal confundível?",
          "Que achado discrimina a hipótese líder?",
          "O que não pode ser perdido neste cenário?",
        ],
      },
    ],
    redFlags: asArray(script.redFlags).length ? asArray(script.redFlags) : ["instabilidade clínica", "sinais de gravidade"],
  };
}

function toIllnessScript(caseJson) {
  const script = caseJson.script;
  const typical = firstInstance(caseJson.instances, "typical") || asArray(caseJson.instances)[0] || {};
  const differentials = asArray(typical.differentials);
  const workup = asArray(typical.workupChave);

  return {
    id: script.id,
    area: script.area,
    subtopic: script.subtopico,
    tema: script.entidade,
    dificuldade: normalizeDifficulty(script),
    enabling: asText(script.enabling),
    fault: asText(script.fault),
    consequences: asText(script.consequences),
    management: asText(script.management),
    keyFeatures: asArray(script.keyFeatures),
    discriminators: asArray(script.discriminators),
    pertinentNegatives: asArray(script.pertinentNegatives),
    commonErrors: asArray(script.commonErrors),
    diferenciais: differentials,
    workup: workup.length ? workup : ["avaliar gravidade", "confirmar a síndrome", "comparar diferenciais próximos"],
    diagnosticoFinal: script.entidade,
    justificativa: typical.justificativa || `A representação do problema favorece ${script.entidade}.`,
    sct: buildSct(script, typical),
    anamnese: buildAnamnese(script),
    source: "codex_local_generated_cases",
    reviewStatus: "pending_human_review",
    _revisar: typical._revisar || caseJson._revisar || "Revisao humana pendente antes de publicar.",
  };
}

function toCaseInstance(caseJson, instance) {
  const keyFeatureAnswers = asArray(caseJson.script?.keyFeatures)
    .map((item) => item?.expectedAction)
    .filter(Boolean);

  return {
    id: instance.id,
    scriptId: instance.scriptId,
    vignette: instance.vignette,
    presentation: instance.presentation,
    determinacaoSindromica: instance.determinacaoSindromica,
    differentials: asArray(instance.differentials),
    workupChave: asArray(instance.workupChave),
    diagnosticoFinal: instance.diagnosticoFinal,
    justificativa: instance.justificativa,
    keyFeatureAnswers,
    expertReasoningTrace: asArray(instance.expertReasoningTrace),
    source: "codex_local_generated_cases",
    reviewStatus: "pending_human_review",
    _revisar: instance._revisar || "Revisao humana pendente antes de publicar.",
  };
}

if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`${SOURCE_DIR} não encontrado. Gere e valide os casos antes de implementar.`);
  process.exit(1);
}

const files = fs.readdirSync(SOURCE_DIR).filter((file) => file.endsWith(".json")).sort();
const cases = files.map((file) => readJson(path.join(SOURCE_DIR, file)));

const generatedIllnessScripts = cases.map(toIllnessScript);
const generatedCaseInstances = cases.flatMap((caseJson) =>
  asArray(caseJson.instances).map((instance) => toCaseInstance(caseJson, instance))
);

const scriptIds = new Set(generatedIllnessScripts.map((script) => script.id));
const instanceIds = new Set(generatedCaseInstances.map((instance) => instance.id));
if (scriptIds.size !== generatedIllnessScripts.length) throw new Error("IDs duplicados em generatedIllnessScripts");
if (instanceIds.size !== generatedCaseInstances.length) throw new Error("IDs duplicados em generatedCaseInstances");

const output = `// src/constants/generatedClinicalCases.js
// Gerado por scripts/implementarCasosGerados.mjs a partir de casos_validos/.
// Conteúdo médico educacional em revisão humana pendente.

export const GENERATED_CASES_META = ${JSON.stringify({
  sourceDir: SOURCE_DIR,
  generatedBy: "scripts/implementarCasosGerados.mjs",
  scripts: generatedIllnessScripts.length,
  instances: generatedCaseInstances.length,
  reviewStatus: "pending_human_review",
}, null, 2)};

export const generatedIllnessScripts = ${JSON.stringify(generatedIllnessScripts, null, 2)};

export const generatedCaseInstances = ${JSON.stringify(generatedCaseInstances, null, 2)};
`;

fs.writeFileSync(TARGET_FILE, output, "utf8");
console.log("Generated illness scripts:", generatedIllnessScripts.length);
console.log("Generated case instances:", generatedCaseInstances.length);
console.log("Wrote:", TARGET_FILE);
