// src/core/reviewTaskPlanner.test.js
import {
  TASK_TYPE,
  TASK_DESCRIPTIONS,
  isClinicalTaskEnabled,
  findClinicalCaseForTema,
  getReviewTaskForStep,
  estimateTaskDuration,
} from "./reviewTaskPlanner";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TEMA_CIRUGIA = { id: "t1", nome: "Apendicite Aguda", esp: "Cirurgia" };
const TEMA_CARDIO = { id: "t2", nome: "Infarto Agudo do Miocardio", esp: "Cardiologia" };
const TEMA_SEM_ESP = { id: "t3", nome: "Generico", esp: "" };

const CASOS = [
  { id: "c1", area: "Cirurgia", tema: "Apendicite Aguda", dificuldade: "media", vinheta: "..." },
  { id: "c2", area: "Cirurgia", tema: "Colecistite Aguda", dificuldade: "facil", vinheta: "..." },
  { id: "c3", area: "Cardiologia", tema: "IAM com supra", dificuldade: "dificil", vinheta: "..." },
];

const PROGRESSO = {
  c1: { vistos: 2, fase2Acerto: 80, sctAcerto: 70 },
  c2: { vistos: 0 },
  c3: { vistos: 1, fase2Acerto: 60 },
};

// ─── isClinicalTaskEnabled ────────────────────────────────────────────────────

describe("isClinicalTaskEnabled", () => {
  test("habilitado para res com modulo ativo", () => {
    expect(isClinicalTaskEnabled({ plat: "res", modulos: { raciocinioClinico: true } })).toBe(true);
  });

  test("desabilitado para vest mesmo com modulo ativo", () => {
    expect(isClinicalTaskEnabled({ plat: "vest", modulos: { raciocinioClinico: true } })).toBe(false);
  });

  test("desabilitado para res com modulo inativo", () => {
    expect(isClinicalTaskEnabled({ plat: "res", modulos: { raciocinioClinico: false } })).toBe(false);
  });

  test("desabilitado sem modulos", () => {
    expect(isClinicalTaskEnabled({ plat: "res" })).toBe(false);
  });

  test("desabilitado sem plat", () => {
    expect(isClinicalTaskEnabled({ modulos: { raciocinioClinico: true } })).toBe(false);
  });
});

// ─── findClinicalCaseForTema ─────────────────────────────────────────────────

describe("findClinicalCaseForTema", () => {
  test("retorna null para lista vazia", () => {
    expect(findClinicalCaseForTema(TEMA_CIRUGIA, [], {})).toBeNull();
  });

  test("retorna null para tema nulo", () => {
    expect(findClinicalCaseForTema(null, CASOS, {})).toBeNull();
  });

  test("match exato por nome de tema", () => {
    const result = findClinicalCaseForTema(TEMA_CIRUGIA, CASOS, {});
    expect(result).not.toBeNull();
    expect(result.id).toBe("c1");
  });

  test("match por area quando nao ha match de tema", () => {
    // TEMA_CARDIO.nome = "Infarto Agudo do Miocardio" — nao tem match exato
    // mas CASOS tem c3 com area "Cardiologia"
    const result = findClinicalCaseForTema(TEMA_CARDIO, CASOS, {});
    expect(result).not.toBeNull();
    expect(result.area).toBe("Cardiologia");
  });

  test("prioriza caso nao visitado quando match por area", () => {
    const progresso = { c1: { vistos: 5 }, c2: { vistos: 0 } };
    // c1 e c2 sao ambos Cirurgia, mas c1 foi mais visitado
    const result = findClinicalCaseForTema(TEMA_CIRUGIA, CASOS, progresso);
    // Deve retornar c1 por match exato de tema (ignora vistos para match exato)
    expect(result.id).toBe("c1");
  });

  test("prioriza menos visitado quando match so por area", () => {
    const temaSemMatchExato = { id: "t9", nome: "Outra Doenca", esp: "Cirurgia" };
    const progresso = { c1: { vistos: 5 }, c2: { vistos: 0 } };
    const result = findClinicalCaseForTema(temaSemMatchExato, CASOS, progresso);
    expect(result.id).toBe("c2"); // menos visitado
  });

  test("retorna null quando nao ha casos na area", () => {
    const temaSemArea = { id: "t9", nome: "Algo", esp: "Dermatologia" };
    const result = findClinicalCaseForTema(temaSemArea, CASOS, {});
    expect(result).toBeNull();
  });
});

// ─── TASK_TYPE e mapeamento de steps ─────────────────────────────────────────

describe("TASK_TYPE enum", () => {
  test("BRAIN_DUMP mapeado para d1", () => {
    const task = getReviewTaskForStep({
      tema: TEMA_CIRUGIA, stepKey: "d1", casos: CASOS, progresso: PROGRESSO,
      plat: "res", modulos: { raciocinioClinico: true },
    });
    expect(task?.taskType).toBe(TASK_TYPE.BRAIN_DUMP);
  });

  test("ILLNESS_RECALL mapeado para d4", () => {
    const task = getReviewTaskForStep({
      tema: TEMA_CIRUGIA, stepKey: "d4", casos: CASOS, progresso: PROGRESSO,
      plat: "res", modulos: { raciocinioClinico: true },
    });
    expect(task?.taskType).toBe(TASK_TYPE.ILLNESS_RECALL);
  });

  test("d7 nao gera tarefa clinica dedicada", () => {
    const task = getReviewTaskForStep({
      tema: TEMA_CIRUGIA, stepKey: "d7", casos: CASOS, progresso: PROGRESSO,
      plat: "res", modulos: { raciocinioClinico: true },
    });
    expect(task).toBeNull();
  });

  test("MINI_CASE mapeado para d21 quando caso disponivel", () => {
    const task = getReviewTaskForStep({
      tema: TEMA_CIRUGIA, stepKey: "d21", casos: CASOS, progresso: PROGRESSO,
      plat: "res", modulos: { raciocinioClinico: true },
    });
    expect(task?.taskType).toBe(TASK_TYPE.MINI_CASE);
    expect(task?.caso).not.toBeNull();
  });

  test("SCT mapeado para manutencao", () => {
    const task = getReviewTaskForStep({
      tema: TEMA_CIRUGIA, stepKey: "manutencao", casos: CASOS, progresso: PROGRESSO,
      plat: "res", modulos: { raciocinioClinico: true },
    });
    expect(task?.taskType).toBe(TASK_TYPE.SCT);
  });
});

// ─── getReviewTaskForStep ─────────────────────────────────────────────────────

describe("getReviewTaskForStep", () => {
  const OPTS = { tema: TEMA_CIRUGIA, casos: CASOS, progresso: PROGRESSO, plat: "res", modulos: { raciocinioClinico: true } };

  test("retorna null para vest", () => {
    const task = getReviewTaskForStep({ ...OPTS, plat: "vest" });
    expect(task).toBeNull();
  });

  test("retorna null para modulo inativo", () => {
    const task = getReviewTaskForStep({ ...OPTS, modulos: { raciocinioClinico: false } });
    expect(task).toBeNull();
  });

  test("retorna null para d0 (sem modalidade clinica)", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "d0" });
    expect(task).toBeNull();
  });

  test("retorna null para relearning", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "relearning" });
    expect(task).toBeNull();
  });

  test("d21 sem caso faz fallback para illness_recall", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "d21", casos: [] });
    expect(task).not.toBeNull();
    expect(task.taskType).toBe(TASK_TYPE.ILLNESS_RECALL);
  });

  test("d7 sem caso continua sem tarefa clinica", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "d7", casos: [] });
    expect(task).toBeNull();
  });

  test("task retornada tem tema, description e responses", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "d1" });
    expect(task).not.toBeNull();
    expect(task.tema).toBe(TEMA_CIRUGIA);
    expect(task.description).toBeDefined();
    expect(task.description.fields).toBeInstanceOf(Array);
    expect(task.responses).toEqual({});
  });

  test("description de brain dump tem 5 campos", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "d1" });
    expect(task.description.fields).toHaveLength(5);
  });

  test("description de sct tem 4 campos", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "manutencao" });
    expect(task.description.fields).toHaveLength(4);
  });

  test("description de mini_case tem 3 campos", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "d21" });
    expect(task.description.fields).toHaveLength(3);
  });
});

// ─── TASK_DESCRIPTIONS ───────────────────────────────────────────────────────

describe("TASK_DESCRIPTIONS", () => {
  test("todos os tipos tem label, instruction, fields e durationMin", () => {
    Object.values(TASK_TYPE).forEach((tipo) => {
      if (tipo === TASK_TYPE.STANDARD) return; // sem descricao — e o fallback
      const desc = TASK_DESCRIPTIONS[tipo];
      expect(desc).toBeDefined();
      expect(typeof desc.label).toBe("string");
      expect(typeof desc.instruction).toBe("string");
      expect(Array.isArray(desc.fields)).toBe(true);
      expect(desc.fields.length).toBeGreaterThan(0);
      expect(typeof desc.durationMin).toBe("number");
    });
  });
});

// ─── estimateTaskDuration ────────────────────────────────────────────────────

describe("estimateTaskDuration", () => {
  test("retorna standardMinutes para task nula", () => {
    expect(estimateTaskDuration(null, 20)).toBe(20);
  });

  test("soma durationMin da task com standardMinutes", () => {
    const task = getReviewTaskForStep({
      tema: TEMA_CIRUGIA, stepKey: "d1", casos: CASOS, progresso: PROGRESSO,
      plat: "res", modulos: { raciocinioClinico: true },
    });
    const expected = (task.description.durationMin || 15) + 20;
    expect(estimateTaskDuration(task, 20)).toBe(expected);
  });
});
