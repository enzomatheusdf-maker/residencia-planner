// src/core/errorActionMap.test.js
import {
  getCorrectiveAction,
  getActionsForPlatform,
  dominantErrorToInboxAction,
  getErrorTypesBySeverity,
  ACTION_MAP,
  recommendRemediationFromError,
} from "./errorActionMap";
import { ERROR_TYPE, normalizeErrorType } from "./errorTaxonomy";

// ─── Todos os tipos canonicos tem acao corretiva ──────────────────────────────

describe("errorActionMap — cobertura de tipos canonicos", () => {
  const CANONICAL_TYPES = [
    ERROR_TYPE.CONTENT,
    ERROR_TYPE.MEMORY,
    ERROR_TYPE.REASONING,
    ERROR_TYPE.PROBLEM_REPRESENTATION,
    ERROR_TYPE.DIFFERENTIAL,
    ERROR_TYPE.SCT_UNCERTAINTY,
    ERROR_TYPE.MANAGEMENT,
    ERROR_TYPE.INTERPRETATION,
    ERROR_TYPE.DISTRACTION,
    ERROR_TYPE.TIME,
    ERROR_TYPE.CONFIDENCE_MISMATCH,
    ERROR_TYPE.EXAM_STRATEGY,
    ERROR_TYPE.GUESS,
  ];

  test("todos os tipos canonicos tem acao corretiva", () => {
    CANONICAL_TYPES.forEach((tipo) => {
      const action = getCorrectiveAction(tipo);
      expect(action).not.toBeNull();
      expect(action.type).toBe(tipo);
    });
  });

  test("cada acao tem correctiveActions com pelo menos 1 item", () => {
    CANONICAL_TYPES.forEach((tipo) => {
      const action = getCorrectiveAction(tipo);
      expect(Array.isArray(action.correctiveActions)).toBe(true);
      expect(action.correctiveActions.length).toBeGreaterThan(0);
    });
  });

  test("cada acao tem mentorActionType e preferredTask definidos", () => {
    CANONICAL_TYPES.forEach((tipo) => {
      const action = getCorrectiveAction(tipo);
      expect(typeof action.mentorActionType).toBe("string");
      expect(typeof action.preferredTask).toBe("string");
    });
  });
});

// ─── Mapeamento legado ────────────────────────────────────────────────────────

describe("normalizeErrorType — compatibilidade legada", () => {
  test("lacuna mapeia para conteudo", () => {
    expect(normalizeErrorType("lacuna")).toBe(ERROR_TYPE.CONTENT);
  });

  test("nao_visto mapeia para conteudo", () => {
    expect(normalizeErrorType("nao_visto")).toBe(ERROR_TYPE.CONTENT);
  });

  test("distractor mapeia para diferencial", () => {
    expect(normalizeErrorType("distractor")).toBe(ERROR_TYPE.DIFFERENTIAL);
  });

  test("descuido mapeia para distracao", () => {
    expect(normalizeErrorType("descuido")).toBe(ERROR_TYPE.DISTRACTION);
  });

  test("raciocinio_clinico mapeia para raciocinio", () => {
    expect(normalizeErrorType("raciocinio_clinico")).toBe(ERROR_TYPE.REASONING);
  });

  test("getCorrectiveAction aceita tipo legado lacuna", () => {
    const action = getCorrectiveAction("lacuna");
    expect(action).not.toBeNull();
    expect(action.type).toBe(ERROR_TYPE.CONTENT);
  });

  test("getCorrectiveAction aceita tipo legado distractor", () => {
    const action = getCorrectiveAction("distractor");
    expect(action).not.toBeNull();
    expect(action.type).toBe(ERROR_TYPE.DIFFERENTIAL);
  });
});

// ─── Isolamento por plataforma ────────────────────────────────────────────────

describe("getActionsForPlatform — isolamento vest", () => {
  test("conduta_prescricao nao aparece no vestibular", () => {
    const vestActions = getActionsForPlatform("vest");
    const types = vestActions.map((a) => a.type);
    expect(types).not.toContain(ERROR_TYPE.MANAGEMENT);
  });

  test("representacao_problema nao aparece no vestibular", () => {
    const vestActions = getActionsForPlatform("vest");
    const types = vestActions.map((a) => a.type);
    expect(types).not.toContain(ERROR_TYPE.PROBLEM_REPRESENTATION);
  });

  test("diferencial nao aparece no vestibular", () => {
    const vestActions = getActionsForPlatform("vest");
    const types = vestActions.map((a) => a.type);
    expect(types).not.toContain(ERROR_TYPE.DIFFERENTIAL);
  });

  test("incerteza_sct nao aparece no vestibular", () => {
    const vestActions = getActionsForPlatform("vest");
    const types = vestActions.map((a) => a.type);
    expect(types).not.toContain(ERROR_TYPE.SCT_UNCERTAINTY);
  });

  test("conteudo, memoria, tempo aparecem no vestibular", () => {
    const vestActions = getActionsForPlatform("vest");
    const types = vestActions.map((a) => a.type);
    expect(types).toContain(ERROR_TYPE.CONTENT);
    expect(types).toContain(ERROR_TYPE.MEMORY);
    expect(types).toContain(ERROR_TYPE.TIME);
  });

  test("todos os tipos aparecem no res", () => {
    const resActions = getActionsForPlatform("res");
    const types = resActions.map((a) => a.type);
    expect(types).toContain(ERROR_TYPE.MANAGEMENT);
    expect(types).toContain(ERROR_TYPE.PROBLEM_REPRESENTATION);
    expect(types).toContain(ERROR_TYPE.DIFFERENTIAL);
    expect(types).toContain(ERROR_TYPE.SCT_UNCERTAINTY);
  });
});

// ─── dominantErrorToInboxAction — compatibilidade com actionInbox ─────────────

describe("dominantErrorToInboxAction — geracao de action para inbox", () => {
  test("retorna objeto compativel com actionInbox para tipo valido", () => {
    const result = dominantErrorToInboxAction(ERROR_TYPE.REASONING, {
      tema: "Apendicite Aguda",
      area: "Cirurgia",
      plat: "res",
      dueDate: "2026-06-01",
    });
    expect(result).not.toBeNull();
    expect(result.type).toBe("clinical_case");
    expect(result.title).toContain("Apendicite Aguda");
    expect(result.priority).toBeGreaterThan(0);
    expect(result.source).toBe("error_action");
    expect(result.target.errorType).toBe(ERROR_TYPE.REASONING);
    expect(result.target.preferredTask).toBe("caso");
  });

  test("retorna null para tipo invalido", () => {
    expect(dominantErrorToInboxAction("tipo_que_nao_existe")).toBeNull();
  });

  test("retorna null quando plataforma nao e valida para o tipo", () => {
    const result = dominantErrorToInboxAction(ERROR_TYPE.MANAGEMENT, {
      tema: "Matematica",
      plat: "vest",
    });
    expect(result).toBeNull();
  });

  test("funciona sem tema/area no contexto", () => {
    const result = dominantErrorToInboxAction(ERROR_TYPE.CONTENT, { plat: "res" });
    expect(result).not.toBeNull();
    expect(typeof result.title).toBe("string");
  });

  test("action gerada nao colide em dedupe: tem type e target distintos", () => {
    const r1 = dominantErrorToInboxAction(ERROR_TYPE.CONTENT, { tema: "Topico A", plat: "res", dueDate: "2026-06-01" });
    const r2 = dominantErrorToInboxAction(ERROR_TYPE.REASONING, { tema: "Topico B", plat: "res", dueDate: "2026-06-01" });
    expect(r1.type).not.toBe(r2.type);
    expect(r1.target.errorType).not.toBe(r2.target.errorType);
  });
});

// ─── getErrorTypesBySeverity ──────────────────────────────────────────────────

describe("getErrorTypesBySeverity", () => {
  test("retorna lista com todos os tipos do ACTION_MAP", () => {
    const list = getErrorTypesBySeverity();
    expect(list.length).toBe(Object.keys(ACTION_MAP).length);
  });
});

// ─── Novos tipos — taxonomia extendida ──────────────────────────────────────

describe("errorTaxonomy — novos tipos do P3-A", () => {
  test("ERROR_TYPE.PROBLEM_REPRESENTATION existe e tem valor correto", () => {
    expect(ERROR_TYPE.PROBLEM_REPRESENTATION).toBe("representacao_problema");
  });

  test("ERROR_TYPE.DIFFERENTIAL existe e tem valor correto", () => {
    expect(ERROR_TYPE.DIFFERENTIAL).toBe("diferencial");
  });

  test("ERROR_TYPE.SCT_UNCERTAINTY existe e tem valor correto", () => {
    expect(ERROR_TYPE.SCT_UNCERTAINTY).toBe("incerteza_sct");
  });

  test("ERROR_TYPE.MANAGEMENT existe e tem valor correto", () => {
    expect(ERROR_TYPE.MANAGEMENT).toBe("conduta_prescricao");
  });

  test("ERROR_TYPE.EXAM_STRATEGY existe e tem valor correto", () => {
    expect(ERROR_TYPE.EXAM_STRATEGY).toBe("estrategia_prova");
  });
});

describe("recommendRemediationFromError (B4)", () => {
  test("conteudo/fato retorna flashcard com o fato específico", () => {
    const event = {
      dominantError: "conteudo",
      topicName: "Apendicite Aguda",
      fato: "Sinal de Blumberg positivo indica irritação peritoneal",
    };
    const recommendation = recommendRemediationFromError(event);
    expect(recommendation).toEqual({
      kind: "flashcard",
      payload: "Sinal de Blumberg positivo indica irritação peritoneal",
    });
  });

  test("raciocinio retorna case com o tema", () => {
    const event = {
      dominantError: "raciocinio",
      topicName: "Apendicite Aguda",
    };
    const recommendation = recommendRemediationFromError(event);
    expect(recommendation).toEqual({
      kind: "case",
      payload: "Apendicite Aguda",
    });
  });

  test("diferencial retorna illness_script com o tema", () => {
    const event = {
      dominantError: "diferencial",
      topicName: "Diverticulite",
    };
    const recommendation = recommendRemediationFromError(event);
    expect(recommendation).toEqual({
      kind: "illness_script",
      payload: "Diverticulite",
    });
  });

  test("calibracao/chute retorna calibration_flag com o tema", () => {
    const event = {
      dominantError: "chute",
      topicName: "Obstetrícia",
    };
    const recommendation = recommendRemediationFromError(event);
    expect(recommendation).toEqual({
      kind: "calibration_flag",
      payload: "Obstetrícia",
    });
  });

  test("retorna null para eventos sem erro correspondente", () => {
    const event = {
      dominantError: "outro_tipo",
    };
    expect(recommendRemediationFromError(event)).toBeNull();
  });
});
