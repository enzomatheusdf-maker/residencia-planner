// src/core/confusableSets.test.js
import { buildConfusableSets } from "./confusableSets";

describe("Confusable Sets Grouping", () => {
  test("groups themes by parentTopic when there are 2 or more members", () => {
    const temas = [
      { id: "t1", nome: "Glomerulonefrite", parentTopic: "Nefrologia" },
      { id: "t2", nome: "Nefrolitíase", parentTopic: "Nefrologia" },
      { id: "t3", nome: "Asma", parentTopic: "Pneumologia" },
    ];
    
    const sets = buildConfusableSets(temas, []);
    
    expect(sets).toHaveLength(1);
    expect(sets[0].key).toBe("parent:Nefrologia");
    expect(sets[0].members).toEqual(["t1", "t2"]);
    expect(sets[0].reason).toBe("mesmo macrotema");
  });

  test("groups themes by shared clinical case differentials (SCA, TEP, dissecção, pericardite)", () => {
    const temas = [
      { id: "t-dor", nome: "Dor Torácica Coronariana" },
      { id: "t-sca", nome: "SCASSST - Síndrome Coronária Aguda Sem Supra do Segmento ST" },
      { id: "t-tep", nome: "Tromboembolismo Pulmonar (TEP)" },
      { id: "t-dissec", nome: "Dissecção de Aorta" },
      { id: "t-peri", nome: "Doenças do Pericárdio (Pericardite)" },
      { id: "t-outros", nome: "Outro tema qualquer" },
    ];

    const casos = [
      {
        id: "dor-toracica-coronariana",
        tema: "Dor Torácica Coronariana",
        diferenciais: [
          { dx: "SCA com supra", plausibilidade: "alta" },
          { dx: "Disseccao de aorta", plausibilidade: "media" },
          { dx: "TEP", plausibilidade: "baixa" },
          { dx: "Pericardite", plausibilidade: "baixa" },
        ],
      },
    ];

    const sets = buildConfusableSets(temas, casos);
    
    // We expect at least the case-based set to be created
    const caseSet = sets.find(s => s.key.startsWith("case:"));
    expect(caseSet).toBeDefined();
    expect(caseSet.members).toContain("t-dor");
    expect(caseSet.members).toContain("t-sca");
    expect(caseSet.members).toContain("t-tep");
    expect(caseSet.members).toContain("t-dissec");
    expect(caseSet.members).toContain("t-peri");
    expect(caseSet.members).not.toContain("t-outros");
    expect(caseSet.reason).toBe("diagnóstico diferencial");
  });

  test("does not group when there is only one theme in the parentTopic", () => {
    const temas = [
      { id: "t1", nome: "Asma", parentTopic: "Pneumologia" },
    ];
    const sets = buildConfusableSets(temas, []);
    expect(sets).toHaveLength(0);
  });
});
