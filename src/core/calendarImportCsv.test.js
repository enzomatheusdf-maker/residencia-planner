import { parseCalendarCsv, validateCsvText, CSV_TEMPLATE_HEADER } from "./calendarImportCsv";

const HEADER_COMMA = "semana,dia,data,area,tema,subtema,ordem,duracaoMin,prioridade,observacoes";
const HEADER_SEMI  = "semana;dia;data;area;tema;subtema;ordem;duracaoMin;prioridade;observacoes";

function makeCsv(sep = ",", rows = []) {
  const header = HEADER_COMMA.replace(/,/g, sep);
  return [header, ...rows].join("\n");
}

// ─── parseCalendarCsv ─────────────────────────────────────────────────────────

describe("parseCalendarCsv", () => {
  it("parses a valid comma-separated row", () => {
    const csv = makeCsv(",", [
      "Semana 1,Segunda,2026-06-02,CARDIOLOGIA,Hipertensão,,1,50,ALTA,foco",
    ]);
    const { topics, errors, skipped } = parseCalendarCsv(csv);
    expect(errors).toHaveLength(0);
    expect(skipped).toBe(0);
    expect(topics).toHaveLength(1);
    expect(topics[0].areaOriginal).toBe("CARDIOLOGIA");
    expect(topics[0].temaOriginal).toBe("Hipertensão");
    expect(topics[0].semana).toBe("Semana 1");
  });

  it("parses a valid semicolon-separated row", () => {
    const csv = makeCsv(";", [
      "Semana 2;Terça;2026-06-09;PEDIATRIA;Bronquiolite;;;50;CRITICA;",
    ]);
    const { topics, errors } = parseCalendarCsv(csv);
    expect(errors).toHaveLength(0);
    expect(topics[0].temaOriginal).toBe("Bronquiolite");
    expect(topics[0].areaOriginal).toBe("PEDIATRIA");
  });

  it("returns error for missing required columns in header", () => {
    const csv = "dia,data,tema\nSegunda,2026-06-02,Hipertensão";
    const { topics, errors } = parseCalendarCsv(csv);
    expect(topics).toHaveLength(0);
    expect(errors[0].message).toMatch(/semana/i);
  });

  it("skips and reports rows with empty required fields", () => {
    const csv = makeCsv(",", [
      "Semana 1,Segunda,2026-06-02,,Hipertensão,,1,50,ALTA,", // area vazia
      "Semana 1,Terça,2026-06-03,PEDIATRIA,,,1,50,ALTA,",    // tema vazio
      "Semana 2,Qua,,CARDIOLOGIA,IAM,,2,50,ALTA,",           // data vazia — OK (data não é obrigatória)
    ]);
    const { topics, errors, skipped } = parseCalendarCsv(csv);
    expect(skipped).toBe(2);
    expect(errors).toHaveLength(2);
    expect(topics).toHaveLength(1);
    expect(topics[0].temaOriginal).toBe("IAM");
  });

  it("handles empty data column gracefully", () => {
    const csv = makeCsv(",", [
      "Semana 1,Segunda,,CARDIOLOGIA,IAM,,1,50,ALTA,",
    ]);
    const { topics, errors } = parseCalendarCsv(csv);
    expect(errors).toHaveLength(0);
    expect(topics[0].temaOriginal).toBe("IAM");
  });

  it("maps area to areaCanonica via normalizeCalendarTopic", () => {
    const csv = makeCsv(",", [
      "Semana 1,Segunda,2026-06-02,CARDIOLOGIA,Hipertensão,,1,50,ALTA,",
    ]);
    const { topics } = parseCalendarCsv(csv);
    expect(topics[0].areaCanonica).toBe("Clínica Médica");
  });

  it("returns error for empty file", () => {
    const { topics, errors } = parseCalendarCsv("");
    expect(topics).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(0);
  });

  it("handles quoted fields with commas inside", () => {
    const csv = `${HEADER_COMMA}\nSemana 1,Segunda,2026-06-02,CARDIOLOGIA,"Hipertensão, Crise",,1,50,ALTA,`;
    const { topics } = parseCalendarCsv(csv);
    expect(topics[0].temaOriginal).toBe("Hipertensão, Crise");
  });

  it("parses multiple rows correctly", () => {
    const csv = makeCsv(",", [
      "Semana 1,Segunda,2026-06-02,CARDIOLOGIA,Hipertensão,,1,50,ALTA,",
      "Semana 1,Terça,2026-06-03,PEDIATRIA,Bronquiolite,,2,50,CRITICA,",
      "Semana 2,Qua,2026-06-10,INFECTOLOGIA,Dengue,,3,50,ALTA,",
    ]);
    const { topics, errors, skipped } = parseCalendarCsv(csv);
    expect(errors).toHaveLength(0);
    expect(skipped).toBe(0);
    expect(topics).toHaveLength(3);
  });

  it("sets sourceType to csv_import", () => {
    const csv = makeCsv(",", ["Semana 1,Seg,2026-06-02,CARDIOLOGIA,IAM,,1,50,ALTA,"]);
    const { topics } = parseCalendarCsv(csv);
    expect(topics[0].sourceType).toBe("csv_import");
  });

  it("ignores blank lines between rows", () => {
    const csv = `${HEADER_COMMA}\nSemana 1,Seg,2026-06-02,CARDIOLOGIA,IAM,,1,50,ALTA,\n\nSemana 1,Ter,2026-06-03,PEDIATRIA,Bronquiolite,,2,50,ALTA,`;
    const { topics } = parseCalendarCsv(csv);
    expect(topics).toHaveLength(2);
  });
});

// ─── validateCsvText ─────────────────────────────────────────────────────────

describe("validateCsvText", () => {
  it("returns valid=true for a correct CSV", () => {
    const csv = makeCsv(",", ["Semana 1,Seg,2026-06-02,CARDIOLOGIA,IAM,,1,50,ALTA,"]);
    expect(validateCsvText(csv).valid).toBe(true);
  });

  it("returns valid=false when required columns missing", () => {
    expect(validateCsvText("dia,tema\nSeg,IAM").valid).toBe(false);
  });
});

// ─── CSV_TEMPLATE_HEADER ──────────────────────────────────────────────────────

describe("CSV_TEMPLATE_HEADER", () => {
  it("contains required column names", () => {
    expect(CSV_TEMPLATE_HEADER).toMatch("semana");
    expect(CSV_TEMPLATE_HEADER).toMatch("area");
    expect(CSV_TEMPLATE_HEADER).toMatch("tema");
  });
});
