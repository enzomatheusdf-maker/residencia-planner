export const ERROR_TYPE = Object.freeze({
  CONTENT: "conteudo",
  REASONING: "raciocinio",
  INTERPRETATION: "interpretacao",
  DISTRACTION: "distracao",
  TIME: "tempo",
  GUESS: "chute",
  CONFIDENCE_MISMATCH: "confianca_mal_calibrada",
  MEMORY: "memoria",
});

export const ERROR_TYPE_LABEL = Object.freeze({
  [ERROR_TYPE.CONTENT]: "Conteudo",
  [ERROR_TYPE.REASONING]: "Raciocinio",
  [ERROR_TYPE.INTERPRETATION]: "Interpretacao",
  [ERROR_TYPE.DISTRACTION]: "Distracao",
  [ERROR_TYPE.TIME]: "Tempo",
  [ERROR_TYPE.GUESS]: "Chute",
  [ERROR_TYPE.CONFIDENCE_MISMATCH]: "Confianca mal calibrada",
  [ERROR_TYPE.MEMORY]: "Memoria",
});

const LEGACY_ERROR_MAP = Object.freeze({
  lacuna: ERROR_TYPE.CONTENT,
  nao_visto: ERROR_TYPE.CONTENT,
  conteudo: ERROR_TYPE.CONTENT,
  raciocinio: ERROR_TYPE.REASONING,
  "raciocinio_clinico": ERROR_TYPE.REASONING,
  interpretacao: ERROR_TYPE.INTERPRETATION,
  distractor: ERROR_TYPE.DISTRACTION,
  distracao: ERROR_TYPE.DISTRACTION,
  descuido: ERROR_TYPE.DISTRACTION,
  tempo: ERROR_TYPE.TIME,
  chute: ERROR_TYPE.GUESS,
  memoria: ERROR_TYPE.MEMORY,
  confianca_mal_calibrada: ERROR_TYPE.CONFIDENCE_MISMATCH,
});

function normalizeErrorType(rawType) {
  if (!rawType) return null;
  const key = String(rawType).trim().toLowerCase();
  return LEGACY_ERROR_MAP[key] || key;
}

function normalizeConfidence(rawConfidence) {
  if (!rawConfidence) return null;
  const key = String(rawConfidence).trim().toLowerCase();
  if (key.startsWith("alt")) return "alta";
  if (key.startsWith("med")) return "media";
  if (key.startsWith("baix")) return "baixa";
  return key;
}

export function classifyError(input = {}) {
  const acertou = Boolean(input.acertou);
  const confianca = normalizeConfidence(input.confianca || input.confidence || null);
  const tipoErro = normalizeErrorType(input.tipoErro || input.type || input.tipo || null);
  const tempoExcedido = Boolean(input.tempoExcedido || input.timeExceeded);

  if (acertou && confianca === "baixa") return ERROR_TYPE.GUESS;
  if (!acertou && confianca === "alta") return ERROR_TYPE.CONFIDENCE_MISMATCH;
  if (tempoExcedido) return ERROR_TYPE.TIME;
  if (tipoErro) return tipoErro;
  if (!acertou) return ERROR_TYPE.CONTENT;
  return null;
}

export function errorSeverity(error = {}) {
  if (!error) return 0;
  const tipo =
    typeof error === "string"
      ? normalizeErrorType(error)
      : normalizeErrorType(error.tipo || error.tipoErro || classifyError(error));
  if (!tipo) return 0;
  if (tipo === ERROR_TYPE.CONFIDENCE_MISMATCH) return 100;
  if (tipo === ERROR_TYPE.REASONING) return 90;
  if (tipo === ERROR_TYPE.CONTENT) return 75;
  if (tipo === ERROR_TYPE.INTERPRETATION) return 65;
  if (tipo === ERROR_TYPE.TIME) return 55;
  if (tipo === ERROR_TYPE.DISTRACTION) return 45;
  if (tipo === ERROR_TYPE.GUESS) return 40;
  return 50;
}

export function summarizeErrors(errors = []) {
  const out = {};
  for (const error of errors) {
    const tipo = normalizeErrorType(error?.tipo || classifyError(error)) || "outro";
    out[tipo] = (out[tipo] || 0) + 1;
  }
  return out;
}

export function dominantErrorType(errors = []) {
  const summary = summarizeErrors(errors);
  return Object.entries(summary).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

