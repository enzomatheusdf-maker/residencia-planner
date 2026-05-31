import {
  attachCalendarIntelligence,
  getProviderSeed,
  mapAreaOriginalToCanonica,
  matchMedcofTopic,
  normalizeCalendarTopic,
  parseCalendarImport,
  parseEstrategiaText,
} from "./calendarProvider";
import { CALENDAR_PROVIDER_IDS } from "../constants/calendarProviders";

describe("calendarProvider", () => {
  test("parseia padrão área + tema do Estratégia", () => {
    const out = parseEstrategiaText("Semana 8\nCIRURGIA\nAbdome Agudo Inflamatório - Apendicite Aguda");
    expect(out.length).toBe(1);
    expect(out[0].areaOriginal).toBe("CIRURGIA");
    expect(out[0].temaOriginal).toMatch("Apendicite");
  });

  test("ignora linhas de navegação", () => {
    const out = parseEstrategiaText("Dashboard\nSimulados\nSemana 1\nCARDIOLOGIA\nHipertensão\nCronograma");
    expect(out.length).toBe(1);
    expect(out[0].temaOriginal).toBe("Hipertensão");
  });

  test("detecta semana corretamente", () => {
    const out = parseEstrategiaText("Semana 3\nPEDIATRIA\nBronquiolite");
    expect(out[0].semana).toBe("Semana 3");
  });

  test("parseCalendarImport aceita JSON", () => {
    const raw = JSON.stringify([{ temaOriginal: "GO - Pré-eclâmpsia", areaOriginal: "GINECOLOGIA" }]);
    const out = parseCalendarImport(raw, "json");
    expect(out[0].areaCanonica).toBe("GO");
  });

  test("mapeia área original para canônica", () => {
    expect(mapAreaOriginalToCanonica("CARDIOLOGIA")).toBe("Clínica Médica");
    expect(mapAreaOriginalToCanonica("OBSTETRICIA")).toBe("GO");
  });

  test("normaliza tema conhecido", () => {
    const topic = normalizeCalendarTopic({
      areaOriginal: "CIRURGIA",
      temaOriginal: "Abdome Agudo Inflamatório - Colecistite e Colangite Aguda",
    });
    expect(topic.temaNormalizado).toBe("Colecistite Aguda / Colangite");
  });

  test("não trunca tópicos no parser", () => {
    const raw = [
      "Semana 1",
      "CARDIOLOGIA",
      "Tema 1",
      "Tema 2",
      "Tema 3",
      "Tema 4",
      "Tema 5",
      "Tema 6",
      "Tema 7",
      "Tema 8",
      "Tema 9",
    ].join("\n");
    const out = parseEstrategiaText(raw);
    expect(out.length).toBe(9);
  });

  test("retorna mappingStatus no schema", () => {
    const out = normalizeCalendarTopic({
      areaOriginal: "CARDIOLOGIA",
      temaOriginal: "Hipertensão",
      temaMedcofMatch: "HAS",
    });
    expect(out.mappingStatus).toBe("mapeado");
  });

  test("getProviderSeed retorna mais de 5 itens para Estratégia dev", () => {
    const seed = getProviderSeed(CALENDAR_PROVIDER_IDS.USER_IMPORTED);
    expect(seed.length).toBeGreaterThan(5);
  });

  test("matchMedcofTopic encontra melhor correspondencia", () => {
    const { best, score } = matchMedcofTopic("Apendicite", [
      { nome: "Apendicite Aguda" },
      { nome: "Asma" },
    ]);
    expect(best.nome).toBe("Apendicite Aguda");
    expect(score).toBeGreaterThan(0.5);
  });

  test("attachCalendarIntelligence inclui bloco intelligence", () => {
    const out = attachCalendarIntelligence({
      area: "Clínica Médica",
      temaOriginal: "Cardiologia",
    });
    expect(out.intelligence).toBeTruthy();
    expect(typeof out.intelligence.priority).toBe("number");
    expect(out.mappingStatus).toBe("pendente");
  });
});
