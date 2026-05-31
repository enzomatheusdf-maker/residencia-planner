// src/core/illnessScript.test.js

import {
  agendarReencontro,
  analisarHipoteses,
  analisarProblemRepresentation,
  casosDeHoje,
  calcRaciocinioScore,
  coberturaRaciocinioPorArea,
  ratingDeNota,
  scoreCaso,
  scoreHipoteses,
  scoreIllnessRecallChecklist,
  scoreJustificativaKeywords,
  scoreProblemRepresentation,
  scoreSct,
} from "./illnessScript";

const casoApendicite = {
  id: "apendicite-classica",
  area: "Cirurgia",
  dificuldade: "media",
  vinheta: "Homem, 24 anos, dor periumbilical há 18h que migrou para fossa ilíaca direita, com anorexia, náusea e febre baixa.",
  problemRepKeywords: ["agudo", "homem jovem", "dor migratória", "fossa ilíaca direita", "febril", "horas"],
  diferenciais: [
    { dx: "Apendicite aguda", plausibilidade: "alta", aliases: ["apendicite"] },
    { dx: "Torção ovariana", plausibilidade: "baixa", mustNotMiss: true },
    { dx: "Cólica ureteral", plausibilidade: "media" },
  ],
  justificativaKeywords: ["migr", "peritone", "fid", "leucocit"],
  sct: [
    { hipotese: "Apendicite aguda", novaInfo: "TC com apendicolito", efeitoPainel: 2 },
    { hipotese: "Apendicite aguda", novaInfo: "USG com apêndice compressível", efeitoPainel: -2 },
  ],
};

describe("illnessScript engine", () => {
  test("scoreProblemRepresentation recompensa síntese com qualificadores e keywords", () => {
    const texto = "Homem jovem com dor aguda migratória para fossa ilíaca direita há horas, febril e com irritação peritoneal.";
    const score = scoreProblemRepresentation(texto, casoApendicite);
    expect(score).toBeGreaterThanOrEqual(70);

    const analise = analisarProblemRepresentation(texto, casoApendicite);
    expect(analise.categoriasCobertas).toBeGreaterThanOrEqual(3);
    expect(analise.keywordHits).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(analise.feedback)).toBe(true);
  });

  test("scoreProblemRepresentation penaliza texto vazio", () => {
    expect(scoreProblemRepresentation("", casoApendicite)).toBe(0);
  });

  test("scoreHipoteses prioriza diagnóstico principal e cobra must-not-miss", () => {
    const bom = scoreHipoteses(["Apendicite", "Torção ovariana", "Cólica ureteral"], casoApendicite);
    const ruim = scoreHipoteses(["Gastroenterite", "Cólica ureteral"], casoApendicite);

    expect(bom).toBeGreaterThan(ruim);

    const analise = analisarHipoteses(["Apendicite", "Cólica ureteral"], casoApendicite);
    expect(analise.mustNotMissAusentes).toContain("Torção ovariana");
    expect(analise.feedback.join(" ")).toMatch(/não pode perder/i);
  });

  test("scoreIllnessRecallChecklist aceita checklist booleano e numérico", () => {
    expect(scoreIllnessRecallChecklist({ enabling: true, fault: true, consequences: true, management: true })).toBe(100);
    expect(scoreIllnessRecallChecklist({ enabling: true, fault: false, consequences: 50, management: "parcial" })).toBeGreaterThan(30);
    expect(scoreIllnessRecallChecklist(82)).toBe(82);
  });

  test("scoreSct compara resposta do aluno ao painel", () => {
    expect(scoreSct([2, -2], casoApendicite)).toBe(100);
    expect(scoreSct([1, -1], casoApendicite)).toBe(75);
    expect(scoreSct([0, 0], casoApendicite)).toBe(50);
  });

  test("scoreJustificativaKeywords retorna cobertura leve por keywords", () => {
    const out = scoreJustificativaKeywords("Dor migratória para FID com sinais peritoneais", casoApendicite);
    expect(out.score).toBeGreaterThanOrEqual(50);
    expect(out.hits).toBeGreaterThanOrEqual(2);
  });

  test("scoreCaso pondera fases preenchidas", () => {
    const score = scoreCaso({
      problemRepScore: 80,
      hipotesesScore: 90,
      illnessRecallScore: 70,
      sctScore: 100,
      justificativaScore: 60,
    });

    expect(score).toBeGreaterThanOrEqual(75);
    expect(score).toBeLessThanOrEqual(90);
    expect(scoreCaso({})).toBeNull();
  });

  test("ratingDeNota usa faixas conservadoras", () => {
    expect(ratingDeNota(40)).toBe("again");
    expect(ratingDeNota(60)).toBe("hard");
    expect(ratingDeNota(80)).toBe("good");
    expect(ratingDeNota(92)).toBe("easy");
  });

  test("agendarReencontro retorna intervalo e próxima data", () => {
    const out = agendarReencontro({ S: 2 }, 92);
    expect(out.rating).toBe("easy");
    expect(out.intervalo).toBeGreaterThanOrEqual(2);
    expect(out.proximaData).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("casosDeHoje coloca reencontros antes de casos novos e prioriza áreas", () => {
    const casos = [
      { id: "cm-1", area: "Clínica Médica", dificuldade: "dificil" },
      { id: "cir-1", area: "Cirurgia", dificuldade: "facil" },
      { id: "ped-1", area: "Pediatria", dificuldade: "media" },
    ];
    const progresso = {
      "ped-1": { vistos: 1, proximaData: "2000-01-01", notaCaso: 75 },
    };

    const fila = casosDeHoje(casos, progresso, ["Clínica Médica"], { limiteNovos: 1 });
    expect(fila[0].caso.id).toBe("ped-1");
    expect(fila[0].motivo).toBe("reencontro");
    expect(fila[1].caso.id).toBe("cm-1");
  });

  test("calcRaciocinioScore e cobertura por área resumem progresso", () => {
    const casos = [
      { id: "a", area: "Cirurgia" },
      { id: "b", area: "Cirurgia" },
      { id: "c", area: "GO" },
    ];
    const progresso = {
      a: { vistos: 1, notaCaso: 80 },
      c: { vistos: 2, notaCaso: 60 },
    };

    expect(calcRaciocinioScore(progresso)).toBe(70);

    const cobertura = coberturaRaciocinioPorArea(casos, progresso);
    expect(cobertura.Cirurgia.pctCobertura).toBe(50);
    expect(cobertura.GO.pctCobertura).toBe(100);
    expect(cobertura.GO.notaMedia).toBe(60);
  });
});
