const mockTodayStr = jest.fn(() => "2026-06-11");

jest.mock("./fsrs", () => {
  const actual = jest.requireActual("./fsrs");
  return {
    ...actual,
    todayStr: () => mockTodayStr(),
  };
});

jest.mock("./telemetry", () => ({
  safeTrackEvent: jest.fn(),
}));

const { useStore, isDecisionSnapshotFresh } = require("./store");
const { safeTrackEvent } = require("./telemetry");
const { DECISION_CORE_ENGINE_VERSION } = require("./decisionCore");
const { buildRev } = require("./fsrs");

function resetDecisionState() {
  useStore.getState().resetStore({ touchUpdatedAt: false });
  useStore.setState({
    plat: "res",
    res: {
      temas: [],
      simulados: [],
      ankiLog: [],
      cronogramas: [],
      casosProgresso: {},
    },
    actionInbox: [],
    decisionSnapshot: null,
    actionInboxState: { dismissed: {}, accepted: {}, done: {} },
    sessionReflections: [],
  });
  safeTrackEvent.mockClear();
}

function snapshot(overrides = {}) {
  return {
    plat: "res",
    forDate: mockTodayStr(),
    engineVersion: DECISION_CORE_ENGINE_VERSION,
    dailyCommand: { type: "rest_or_light_day" },
    primaryAction: { type: "rest" },
    todayPlan: [],
    context: { plat: "res" },
    ...overrides,
  };
}

describe("decisionSnapshot freshness contract", () => {
  beforeEach(() => {
    mockTodayStr.mockReturnValue("2026-06-11");
    resetDecisionState();
  });

  test("rebuilds when snapshot is absent and writes metadata", () => {
    const rebuilt = useStore.getState().ensureFreshDecisionSnapshot("missing_snapshot");
    const state = useStore.getState();

    expect(rebuilt).toBe(true);
    expect(state.decisionSnapshot).toMatchObject({
      plat: "res",
      forDate: "2026-06-11",
      engineVersion: DECISION_CORE_ENGINE_VERSION,
    });
    expect(Date.parse(state.decisionSnapshot.generatedAt)).not.toBeNaN();
    expect(safeTrackEvent).toHaveBeenCalledTimes(1);
    expect(safeTrackEvent).toHaveBeenCalledWith(
      "decision_rebuilt",
      { plat: "res", reason: "missing_snapshot" },
      expect.any(Object)
    );
  });

  test("rebuilds when snapshot plat diverges", () => {
    useStore.setState({ decisionSnapshot: snapshot({ plat: "vest" }) });
    safeTrackEvent.mockClear();

    expect(useStore.getState().ensureFreshDecisionSnapshot("plat_changed")).toBe(true);
    expect(useStore.getState().decisionSnapshot?.plat).toBe("res");
    expect(safeTrackEvent).toHaveBeenCalledTimes(1);
  });

  test("rebuilds when snapshot date is stale", () => {
    useStore.setState({ decisionSnapshot: snapshot({ forDate: "2026-06-10" }) });
    safeTrackEvent.mockClear();

    expect(useStore.getState().ensureFreshDecisionSnapshot("stale_date")).toBe(true);
    expect(useStore.getState().decisionSnapshot?.forDate).toBe("2026-06-11");
    expect(safeTrackEvent).toHaveBeenCalledTimes(1);
  });

  test("rebuilds when engineVersion diverges", () => {
    useStore.setState({ decisionSnapshot: snapshot({ engineVersion: "legacy-engine" }) });
    safeTrackEvent.mockClear();

    expect(useStore.getState().ensureFreshDecisionSnapshot("engine_changed")).toBe(true);
    expect(useStore.getState().decisionSnapshot?.engineVersion).toBe(DECISION_CORE_ENGINE_VERSION);
    expect(safeTrackEvent).toHaveBeenCalledTimes(1);
  });

  test("does not rebuild when snapshot is fresh", () => {
    useStore.setState({ decisionSnapshot: snapshot() });
    const before = useStore.getState().decisionSnapshot;
    safeTrackEvent.mockClear();

    expect(isDecisionSnapshotFresh(before, useStore.getState(), mockTodayStr())).toBe(true);
    expect(useStore.getState().ensureFreshDecisionSnapshot("noop")).toBe(false);
    expect(useStore.getState().decisionSnapshot).toBe(before);
    expect(safeTrackEvent).not.toHaveBeenCalled();
  });

  test("mocked day rollover marks yesterday snapshot stale and rebuilds once", () => {
    expect(useStore.getState().ensureFreshDecisionSnapshot("initial")).toBe(true);
    safeTrackEvent.mockClear();

    mockTodayStr.mockReturnValue("2026-06-12");
    expect(useStore.getState().ensureFreshDecisionSnapshot("day_rollover")).toBe(true);
    expect(useStore.getState().decisionSnapshot?.forDate).toBe("2026-06-12");
    expect(safeTrackEvent).toHaveBeenCalledTimes(1);

    safeTrackEvent.mockClear();
    expect(useStore.getState().ensureFreshDecisionSnapshot("day_rollover_noop")).toBe(false);
    expect(safeTrackEvent).not.toHaveBeenCalled();
  });

  test("gateway rebuild from setMeta writes snapshot and inbox together with set_meta reason", () => {
    safeTrackEvent.mockClear();

    useStore.getState().setMeta({
      ...useStore.getState().meta,
      dataProva: "2026-10-01",
    });
    const state = useStore.getState();

    expect(state.decisionSnapshot).toBeTruthy();
    expect(Array.isArray(state.actionInbox)).toBe(true);
    expect(safeTrackEvent).toHaveBeenCalledWith(
      "decision_rebuilt",
      { plat: "res", reason: "set_meta" },
      expect.any(Object)
    );
  });

  test("gateway rebuild from inbox rebuild writes snapshot and inbox together with inbox_rebuild reason", () => {
    safeTrackEvent.mockClear();

    useStore.getState().rebuildActionInboxForToday();
    const state = useStore.getState();

    expect(state.decisionSnapshot).toBeTruthy();
    expect(Array.isArray(state.actionInbox)).toBe(true);
    expect(safeTrackEvent).toHaveBeenCalledWith(
      "decision_rebuilt",
      { plat: "res", reason: "inbox_rebuild" },
      expect.any(Object)
    );
  });

  test("gateway rebuild from markStep writes snapshot and inbox together with mark_review reason", () => {
    const d0 = "2026-06-10";
    useStore.setState({
      res: {
        temas: [
          {
            id: "tema-mark-review",
            nome: "Tema Mark Review",
            esp: "GO",
            d0,
            rev: buildRev(d0, "GO"),
          },
        ],
        simulados: [],
        ankiLog: [],
        cronogramas: [],
        casosProgresso: {},
      },
    });
    safeTrackEvent.mockClear();

    useStore.getState().markStep("res", "tema-mark-review", "d1", {
      acerto: 0.9,
      questoes: 10,
    });
    const state = useStore.getState();

    expect(state.decisionSnapshot).toBeTruthy();
    expect(Array.isArray(state.actionInbox)).toBe(true);
    expect(safeTrackEvent).toHaveBeenCalledWith(
      "decision_rebuilt",
      { plat: "res", reason: "mark_review" },
      expect.any(Object)
    );
  });
});
