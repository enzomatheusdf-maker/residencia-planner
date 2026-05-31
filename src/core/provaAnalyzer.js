import { ENAMED_BLUEPRINT } from "../constants/enamedIncidencia";
import { classifyError, dominantErrorType, ERROR_TYPE, summarizeErrors } from "./errorTaxonomy";

const AREA_ALIASES = {
  clinica: "Clínica Médica",
  "clínica médica": "Clínica Médica",
  "clinica medica": "Clínica Médica",
  cirurgia: "Cirurgia",
  go: "GO",
  ginecologia: "GO",
  obstetricia: "GO",
  obstetrícia: "GO",
  pediatria: "Pediatria",
  preventiva: "Preventiva",
};

function normalizeArea(area) {
  const key = String(area || "").trim().toLowerCase();
  return AREA_ALIASES[key] || area || "Outro";
}

function clampPct(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function scoreAreaPriority({ acertos = 0, total = 0, pesoBlueprint = 0.2 }) {
  if (!total || total <= 0) return 0;
  const pct = clampPct((acertos / total) * 100);
  const gap = 100 - pct;
  return Math.round(gap * pesoBlueprint * 100) / 100;
}

export function analyzeProvaEnamed(payload = {}) {
  const total = Number(payload.total || 0);
  const acertos = Number(payload.acertos || 0);
  const pctGeral = total > 0 ? clampPct((acertos / total) * 100) : 0;
  const inputAreas = Array.isArray(payload.areas) ? payload.areas : [];
  const payloadErrors = Array.isArray(payload.errors) ? payload.errors : [];

  const areaErrors = inputAreas.flatMap((row) => {
    if (!Array.isArray(row.errors)) return [];
    return row.errors.map((error) => ({ ...error, area: normalizeArea(row.area) }));
  });
  const allErrors = [...payloadErrors, ...areaErrors];
  const errorSummary = summarizeErrors(allErrors);
  const dominantError = dominantErrorType(allErrors);
  const confidenceMismatchCount = allErrors.reduce((sum, error) => (
    classifyError(error) === ERROR_TYPE.CONFIDENCE_MISMATCH ? sum + 1 : sum
  ), 0);

  const areas = inputAreas
    .map((row) => {
      const area = normalizeArea(row.area);
      const totalArea = Number(row.total || 0);
      const acertosArea = Number(row.acertos || 0);
      const pct = totalArea > 0 ? clampPct((acertosArea / totalArea) * 100) : 0;
      const pesoBlueprint = ENAMED_BLUEPRINT[area] ?? 0.2;
      const prioridade = scoreAreaPriority({ acertos: acertosArea, total: totalArea, pesoBlueprint });
      const errorsArea = Array.isArray(row.errors) ? row.errors : [];
      return {
        area,
        total: totalArea,
        acertos: acertosArea,
        pct,
        pesoBlueprint,
        prioridade,
        erroDominante: dominantErrorType(errorsArea),
        resumoErros: summarizeErrors(errorsArea),
      };
    })
    .sort((a, b) => b.prioridade - a.prioridade);

  const areaCritica = areas[0] || null;
  const areaForte = [...areas].sort((a, b) => b.pct - a.pct)[0] || null;

  return {
    nome: payload.nome || "Prova ENAMED",
    data: payload.data || null,
    total,
    acertos,
    pctGeral,
    areas,
    resumo: {
      areaCritica: areaCritica?.area || null,
      areaForte: areaForte?.area || null,
      recomendacao:
        areaCritica && areaCritica.prioridade > 0
          ? `Priorize ${areaCritica.area} no próximo ciclo com revisão ativa e questões direcionadas.`
          : "Sem dados suficientes por área para recomendação específica.",
    },
    errors: {
      total: allErrors.length,
      resumo: errorSummary,
      dominante: dominantError,
      confiancaMalCalibrada: confidenceMismatchCount,
    },
  };
}
