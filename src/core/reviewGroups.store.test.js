import { buildAgendaItems } from "./agendaEngine";
import { buildRev, todayStr } from "./fsrs";
import { useStore } from "./store";
import * as telemetry from "./telemetry";

function makeTema(id, nome, overrides = {}) {
  const today = todayStr();
  return {
    id,
    nome,
    esp: "Clínica Médica",
    importancia: "ALTA",
    unstarted: false,
    d0: today,
    rev: {
      ...buildRev(today, "Clínica Médica"),
      d0: { date: today, done: true, scheduledAt: today },
      d1: { date: today, done: false, scheduledAt: today, phase: "learning" },
      d4: { date: "2099-01-04", done: false, scheduledAt: "2099-01-04", phase: "learning" },
      d7: { date: "2099-01-07", done: false, scheduledAt: "2099-01-07", phase: "learning" },
      d21: { date: "2099-01-21", done: false, scheduledAt: "2099-01-21", phase: "review" },
      manutencao: null,
      reviewHistory: [],
      phase: "learning",
      relearning: null,
    },
    ...overrides,
  };
}

function seedState(temas, reviewGroups = { res: [], vest: [] }) {
  const current = useStore.getState();
  useStore.setState({
    plat: "res",
    meta: {
      ...current.meta,
      retencaoFSRS: 0.9,
      intervaloMaxDias: 180,
      modulos: { ...(current.meta?.modulos || {}), raciocinioClinico: false },
    },
    res: { temas, simulados: [], ankiLog: [], cronogramas: [], casosProgresso: {} },
    vest: { temas: [], simulados: [], ankiLog: [], cronogramas: [], casosProgresso: {} },
    reviewGroups,
    learningEvents: [],
    actionInbox: [],
    decisionSnapshot: null,
  });
}

describe("reviewGroups store actions", () => {
  let trackSpy;

  beforeEach(() => {
    useStore.getState().resetStore({ touchUpdatedAt: false });
    trackSpy = jest.spyOn(telemetry, "safeTrackEvent").mockImplementation(() => {});
  });

  afterEach(() => {
    trackSpy.mockRestore();
  });

  test("fluxo completo: selecionar 3 temas, Ja domino no bloco, agenda agrupada e rating unico", () => {
    const temas = [
      makeTema("a", "Hipo I", { unstarted: true, rev: buildRev(todayStr(), "Clínica Médica") }),
      makeTema("b", "Hipo II", { unstarted: true, rev: buildRev(todayStr(), "Clínica Médica") }),
      makeTema("c", "Hipo III", { unstarted: true, rev: buildRev(todayStr(), "Clínica Médica") }),
    ];
    seedState(temas);

    const groupResult = useStore.getState().createReviewGroup("res", {
      nome: "Grupo de revisão Hipo",
      temaIds: ["a", "b", "c"],
    });
    expect(groupResult.ok).toBe(true);

    trackSpy.mockClear();
    const dominioResult = useStore.getState().applyJaDominoToGroup("res", groupResult.group.id, {
      questoesShared: 20,
      acertosShared: 18,
    });
    expect(dominioResult.ok).toBe(true);
    expect(trackSpy).toHaveBeenCalledTimes(1);

    const afterDominio = useStore.getState();
    expect(afterDominio.res.temas.every((tema) => tema.rev.d0.reviewedAt === todayStr())).toBe(true);
    expect(afterDominio.res.temas.every((tema) => tema.dominioPrevio?.validado === true)).toBe(true);

    const agendaItems = buildAgendaItems(
      afterDominio.res.temas,
      [],
      [],
      {},
      "res",
      90,
      todayStr(),
      afterDominio.reviewGroups.res
    );
    const groupTask = agendaItems.find((item) => item.type === "group_review");
    expect(groupTask).toBeTruthy();
    expect(groupTask.subItems).toHaveLength(3);

    trackSpy.mockClear();
    const markResult = useStore.getState().markGroupReview("res", groupResult.group.id, {
      acerto: 0.9,
      questoes: 20,
    });
    expect(markResult.ok).toBe(true);
    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(useStore.getState().learningEvents.filter((event) => event.meta?.groupId === groupResult.group.id)).toHaveLength(3);
  });

  test("markGroupReview aplica override apenas no sub-tema alvo", () => {
    const group = {
      id: "grupo-hipo",
      plat: "res",
      nome: "Grupo de revisão Hipo",
      temaIds: ["a", "b", "c"],
      criadoEm: todayStr(),
      anchorStrategy: "same_day",
    };
    seedState([
      makeTema("a", "Hipo I"),
      makeTema("b", "Hipo II"),
      makeTema("c", "Hipo III"),
    ], { res: [group], vest: [] });

    const result = useStore.getState().markGroupReview("res", group.id, {
      acerto: 0.92,
      questoes: 20,
      overrides: { b: { acerto: 0.4 } },
    });

    expect(result.ok).toBe(true);
    const events = useStore.getState().learningEvents.filter((event) => event.meta?.groupId === group.id);
    expect(events.find((event) => event.topicId === "a").rating).toBe("easy");
    expect(events.find((event) => event.topicId === "b").rating).toBe("again");
    expect(events.find((event) => event.topicId === "c").rating).toBe("easy");
  });

  test("applyJaDominoToGroup aceita resultados por tema com 1 rebuild", () => {
    const group = {
      id: "grupo-hipo",
      plat: "res",
      nome: "Grupo de revisão Hipo",
      temaIds: ["a", "b"],
      criadoEm: todayStr(),
      anchorStrategy: "same_day",
    };
    seedState([
      makeTema("a", "Hipo I", { unstarted: true, rev: buildRev(todayStr(), "Clínica Médica") }),
      makeTema("b", "Hipo II", { unstarted: true, rev: buildRev(todayStr(), "Clínica Médica") }),
    ], { res: [group], vest: [] });

    trackSpy.mockClear();
    const result = useStore.getState().applyJaDominoToGroup("res", group.id, {
      questoesPorTema: { a: 15, b: 30 },
      acertosPorTema: { a: 6, b: 27 },
    });

    expect(result.ok).toBe(true);
    expect(trackSpy).toHaveBeenCalledTimes(1);
    const temas = useStore.getState().res.temas;
    expect(temas.find((tema) => tema.id === "a").dominioPrevio.status).toBe("reprovado");
    expect(temas.find((tema) => tema.id === "b").dominioPrevio.status).toBe("validado_previo");
    expect(temas.find((tema) => tema.id === "b").dominioPrevio.primeiraRevisao).toBe("d21");
  });

  test("merge persistido tolera ausencia de reviewGroups", () => {
    const merge = useStore.persist.getOptions().merge;
    const initial = useStore.getState();
    const merged = merge({ res: { temas: [] }, vest: { temas: [] }, meta: {} }, initial);

    expect(merged.reviewGroups).toEqual({ res: [], vest: [] });
  });
});
