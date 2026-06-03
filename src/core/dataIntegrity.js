import { STEPS } from "./fsrs";

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIsoLike(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value);
}

function normalizeAccuracy(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  if (value >= 0 && value <= 1) return value * 100;
  return value;
}

function pushIssue(target, severity, path, message) {
  target[severity].push({ path, message });
}

export function validateTemaIntegrity(tema = {}, path = "tema") {
  const issues = { criticals: [], warnings: [] };

  if (!isObject(tema)) {
    pushIssue(issues, "criticals", path, "Tema inválido.");
    return issues;
  }

  if (!tema.id) pushIssue(issues, "criticals", `${path}.id`, "Tema sem id.");
  if (!tema.nome) pushIssue(issues, "criticals", `${path}.nome`, "Tema sem nome.");
  if (!isObject(tema.rev)) pushIssue(issues, "criticals", `${path}.rev`, "Tema sem objeto de revisão.");

  if (isObject(tema.rev)) {
    const knownSteps = new Set([...STEPS.map((step) => step.key), "manutencao"]);
    for (const [stepKey, review] of Object.entries(tema.rev)) {
      if (stepKey === "reviewHistory") {
        if (!Array.isArray(review)) {
          pushIssue(issues, "warnings", `${path}.rev.reviewHistory`, "reviewHistory deveria ser array.");
        }
        continue;
      }

      if (!knownSteps.has(stepKey)) {
        pushIssue(issues, "warnings", `${path}.rev.${stepKey}`, "Step desconhecido.");
      }

      if (!isObject(review)) continue;

      for (const field of ["date", "scheduledAt", "reviewedAt"]) {
        if (review[field] && !isIsoLike(review[field])) {
          pushIssue(issues, "warnings", `${path}.rev.${stepKey}.${field}`, "Data fora do formato esperado.");
        }
      }

      const accuracy = normalizeAccuracy(review.acerto);
      if (accuracy != null && (accuracy < 0 || accuracy > 100)) {
        pushIssue(issues, "warnings", `${path}.rev.${stepKey}.acerto`, "Acerto fora do intervalo esperado.");
      }
    }
  }

  const dominio = tema.dominioPrevio;
  if (isObject(dominio)) {
    if (dominio.validado === true && !dominio.primeiraRevisao) {
      pushIssue(issues, "warnings", `${path}.dominioPrevio.primeiraRevisao`, "Domínio prévio validado sem primeira revisão.");
    }
    if (String(dominio.primeiraRevisao || "").toLowerCase() === "d1") {
      pushIssue(issues, "warnings", `${path}.dominioPrevio.primeiraRevisao`, "Domínio prévio não deveria iniciar em D1.");
    }
  }

  return issues;
}

export function validateStateIntegrity(state = {}) {
  const issues = { criticals: [], warnings: [] };
  const sections = [
    ["res.temas", state.res?.temas],
    ["vest.temas", state.vest?.temas],
  ];

  if (state.ownerUid != null && typeof state.ownerUid !== "string") {
    pushIssue(issues, "criticals", "ownerUid", "ownerUid inválido.");
  }

  for (const [path, temas] of sections) {
    if (!Array.isArray(temas)) {
      pushIssue(issues, "criticals", path, "Coleção de temas inválida.");
      continue;
    }

    temas.forEach((tema, index) => {
      const temaIssues = validateTemaIntegrity(tema, `${path}[${index}]`);
      issues.criticals.push(...temaIssues.criticals);
      issues.warnings.push(...temaIssues.warnings);
    });
  }

  return {
    valid: issues.criticals.length === 0,
    criticals: issues.criticals,
    warnings: issues.warnings,
    summary: {
      criticalCount: issues.criticals.length,
      warningCount: issues.warnings.length,
    },
  };
}
