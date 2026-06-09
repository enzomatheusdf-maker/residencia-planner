import { CASOS_CLINICOS } from "./casosClinicos";
import {
  GENERATED_CASES_META,
  generatedCaseInstances,
  generatedIllnessScripts,
} from "./generatedClinicalCases";

const REQUIRED_AREAS = [
  "Clínica Médica",
  "Cirurgia",
  "GO",
  "Pediatria",
  "Preventiva",
];

const GENERIC_DIFFERENTIALS = [
  /^variante benigna\/autolimitada$/i,
  /^condi[cç][aã]o grave a excluir$/i,
];

describe("casosClinicos schema", () => {
  test("lista possui ids unicos", () => {
    const ids = CASOS_CLINICOS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("cada caso possui campos obrigatorios", () => {
    CASOS_CLINICOS.forEach((caso) => {
      expect(caso.id).toBeTruthy();
      expect(caso.area).toBeTruthy();
      expect(caso.subarea).toBeTruthy();
      expect(caso.tema).toBeTruthy();
      expect(caso.vinheta).toBeTruthy();
      expect(caso.script).toBeTruthy();
      expect(caso.script.enabling).toBeTruthy();
      expect(caso.script.fault).toBeTruthy();
      expect(caso.script.consequences).toBeTruthy();
      expect(caso.script.management).toBeTruthy();
      expect(Array.isArray(caso.diferenciais)).toBe(true);
      expect(caso.diferenciais.length).toBeGreaterThan(0);
      expect(Array.isArray(caso.workup)).toBe(true);
      expect(caso.workup.length).toBeGreaterThan(0);
      expect(caso.diagnosticoFinal).toBeTruthy();
      expect(caso.justificativa).toBeTruthy();
      expect(Array.isArray(caso.sct)).toBe(true);
      expect(caso.anamnese).toBeTruthy();
      expect(caso.anamnese.queixa).toBeTruthy();
      expect(Array.isArray(caso.anamnese.roteiro)).toBe(true);
      expect(Array.isArray(caso.anamnese.redFlags)).toBe(true);
    });
  });

  test("ha cobertura minima nas 5 grandes areas", () => {
    const covered = new Set(CASOS_CLINICOS.map((caso) => caso.area));
    REQUIRED_AREAS.forEach((area) => {
      expect(covered.has(area)).toBe(true);
    });
  });

  test("ha pelo menos um caso por area com dificuldade media ou dificil", () => {
    REQUIRED_AREAS.forEach((area) => {
      expect(
        CASOS_CLINICOS.some(
          (caso) => caso.area === area && ["media", "dificil"].includes(caso.dificuldade)
        )
      ).toBe(true);
    });
  });

  test("lote gerado esta integrado ao banco consumido pela app", () => {
    expect(GENERATED_CASES_META.scripts).toBe(generatedIllnessScripts.length);
    expect(GENERATED_CASES_META.instances).toBe(generatedCaseInstances.length);
    expect(generatedIllnessScripts).toHaveLength(304);
    expect(generatedCaseInstances).toHaveLength(608);

    const appCaseIds = new Set(CASOS_CLINICOS.map((caso) => caso.id));
    generatedIllnessScripts.forEach((script) => {
      expect(appCaseIds.has(script.id)).toBe(true);
    });
  });

  test("scripts gerados preservam estrutura atomica e campos de revisao", () => {
    generatedIllnessScripts.forEach((script) => {
      expect(script.keyFeatures.length).toBeGreaterThan(0);
      expect(script.keyFeatures.length).toBeLessThanOrEqual(3);
      expect(script.discriminators.length).toBeGreaterThan(0);
      expect(script.pertinentNegatives.length).toBeGreaterThan(0);
      expect(script.commonErrors.length).toBeGreaterThan(0);
      expect(script._revisar).toBeTruthy();
    });
  });

  test("instancias geradas comecam pela determinacao sindromica e diferenciais da mesma sindrome", () => {
    const instancesByScriptId = generatedCaseInstances.reduce((acc, instance) => {
      const current = acc.get(instance.scriptId) || [];
      current.push(instance);
      acc.set(instance.scriptId, current);
      return acc;
    }, new Map());

    generatedIllnessScripts.forEach((script) => {
      const presentations = (instancesByScriptId.get(script.id) || [])
        .map((instance) => instance.presentation)
        .sort();
      expect(presentations).toEqual(["atypical", "typical"]);
    });

    generatedCaseInstances.forEach((instance) => {
      const instanceKeys = Object.keys(instance);
      expect(instanceKeys.indexOf("determinacaoSindromica")).toBeLessThan(
        instanceKeys.indexOf("differentials")
      );
      expect(instance.determinacaoSindromica).toBeTruthy();
      expect(instance.determinacaoSindromica.sindromeCorreta).toBeTruthy();
      expect(instance.expertReasoningTrace[0]).toMatch(/representar|s[ií]ndrome/i);
      expect(instance.differentials.length).toBeGreaterThanOrEqual(3);
      expect(instance._revisar).toBeTruthy();

      const diferenciaisDaSindrome = new Set(
        instance.determinacaoSindromica.diferenciaisDaSindrome || []
      );

      instance.differentials.forEach((differential) => {
        expect(differential.dx).toBeTruthy();
        expect(GENERIC_DIFFERENTIALS.some((pattern) => pattern.test(differential.dx))).toBe(false);
        expect(diferenciaisDaSindrome.has(differential.dx)).toBe(true);
      });
    });
  });
});
