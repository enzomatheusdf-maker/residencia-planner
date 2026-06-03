// src/core/calendarImportCsv.js
// Parser CSV para importação de cronograma customizado.
// Colunas: semana,dia,data,area,tema,subtema,ordem,duracaoMin,prioridade,observacoes
// Obrigatórios: semana, area, tema
// Aceita separadores , e ;

import { normalizeCalendarTopic } from "./calendarProvider";
import { CALENDAR_PROVIDER_IDS } from "../constants/calendarProviders";

// ─── Template ─────────────────────────────────────────────────────────────────

export const CSV_TEMPLATE_HEADER =
  "semana,dia,data,area,tema,subtema,ordem,duracaoMin,prioridade,observacoes";

export const CSV_TEMPLATE_EXAMPLE = [
  CSV_TEMPLATE_HEADER,
  "Semana 1,Segunda,2026-06-02,CARDIOLOGIA,Hipertensão,,1,50,ALTA,Foco em crise hipertensiva",
  "Semana 1,Terça,2026-06-03,CARDIOLOGIA,Insuficiência Cardíaca,,2,50,ALTA,",
  "Semana 2,Segunda,2026-06-09,PEDIATRIA,Bronquiolite,,1,50,CRITICA,",
].join("\n");

// ─── detectSeparator ─────────────────────────────────────────────────────────

function detectSeparator(headerLine = "") {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas     = (headerLine.match(/,/g) || []).length;
  return semicolons > commas ? ";" : ",";
}

// ─── parseCsvLine ─────────────────────────────────────────────────────────────

function parseCsvLine(line, sep) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ─── Required column validation ──────────────────────────────────────────────

const REQUIRED_COLS = ["semana", "area", "tema"];

function normalizeHeader(h = "") {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// ─── parseCalendarCsv ─────────────────────────────────────────────────────────

/**
 * Converte texto CSV em array de calendarTopics normalizados.
 *
 * @param {string} raw - conteúdo do CSV (texto bruto)
 * @returns {{ topics: Array, errors: Array<{line:number, message:string}>, skipped: number }}
 */
export function parseCalendarCsv(raw = "") {
  const errors = [];
  const topics = [];
  let skipped = 0;

  const lines = String(raw)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { topics, errors: [{ line: 0, message: "Arquivo vazio." }], skipped };
  }

  const headerLine = lines[0];
  const sep = detectSeparator(headerLine);
  const rawHeaders = parseCsvLine(headerLine, sep).map(normalizeHeader);

  // Validate required columns
  const missingCols = REQUIRED_COLS.filter((c) => !rawHeaders.includes(normalizeHeader(c)));
  if (missingCols.length > 0) {
    return {
      topics,
      errors: [
        {
          line: 1,
          message: `Colunas obrigatórias ausentes: ${missingCols.join(", ")}. Cabeçalho detectado: ${rawHeaders.join(", ")}`,
        },
      ],
      skipped,
    };
  }

  // Build column index map
  const colIdx = {};
  rawHeaders.forEach((h, i) => { colIdx[h] = i; });

  const get = (row, col) => {
    const idx = colIdx[normalizeHeader(col)];
    return idx != null ? (row[idx] || "").trim() : "";
  };

  // Parse data rows
  for (let lineNum = 1; lineNum < lines.length; lineNum++) {
    const row = parseCsvLine(lines[lineNum], sep);

    const semana = get(row, "semana");
    const area   = get(row, "area");
    const tema   = get(row, "tema");

    if (!semana || !area || !tema) {
      errors.push({
        line: lineNum + 1,
        message: `Linha ${lineNum + 1}: campos obrigatórios ausentes (semana="${semana}", area="${area}", tema="${tema}").`,
      });
      skipped++;
      continue;
    }

    const raw_data = get(row, "data") || null;
    const dia      = get(row, "dia") || null;
    const subtema  = get(row, "subtema") || null;
    const ordem    = get(row, "ordem") ? Number(get(row, "ordem")) : null;
    const duracao  = get(row, "duracaoMin") ? Number(get(row, "duracaoMin")) : null;
    const prio     = get(row, "prioridade") || "ALTA";
    const obs      = get(row, "observacoes") || null;

    const normalized = normalizeCalendarTopic(
      {
        semana,
        dia,
        data: raw_data,
        scheduledDate: raw_data || undefined,
        area,
        areaOriginal: area,
        tema,
        temaOriginal: tema,
        subtema,
        ordem,
        duracaoMin: isNaN(duracao) ? null : duracao,
        prioridade: prio,
        importancia: prio.toUpperCase(),
        observacoes: obs,
        sourceType: "csv_import",
      },
      CALENDAR_PROVIDER_IDS.USER_IMPORTED
    );

    topics.push(normalized);
  }

  return { topics, errors, skipped };
}

// ─── validateCsvText ─────────────────────────────────────────────────────────

/**
 * Valida sem parsear: retorna lista de erros de estrutura.
 */
export function validateCsvText(raw = "") {
  const { errors, skipped } = parseCalendarCsv(raw);
  return { valid: errors.length === 0, errors, skipped };
}
