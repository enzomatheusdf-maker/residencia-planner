import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Dashboard from "../Dashboard";
import { safeTrackEvent } from "../../core/telemetry";
import { todayStr } from "../../core/fsrs";
import { DECISION_CORE_ENGINE_VERSION } from "../../core/decisionCore";

let mockState;

jest.mock("../../services/firebase", () => ({
  auth: { currentUser: null },
}));

jest.mock("../../core/store", () => {
  const useStore = (selector) => (selector ? selector(mockState) : mockState);
  useStore.getState = () => mockState;
  useStore.setState = (next) => {
    const patch = typeof next === "function" ? next(mockState) : next;
    mockState = { ...mockState, ...patch };
  };
  return { useStore };
});

jest.mock("../../core/telemetry", () => ({
  safeTrackEvent: jest.fn(),
}));

jest.mock("../../hooks/useMetrics", () => ({
  calcTrueRetention: () => 0.9,
  calcBleedingScore: () => [],
  useFilaInteligente: () => [
    {
      temaId: "tema-1",
      stepKey: "d1",
      overdue: false,
      step: { key: "d1", label: "D1", desc: "Revisao de D1" },
      esp: "Clinica Medica",
      temaNome: "Cardiologia CC1",
    },
  ],
  PESOS_PROVA_VEST: { ENEM: {}, UnB: {}, UFG: {} },
}));

jest.mock("../../core/mentor", () => ({
  getMentorDiagnosis: () => ({ insights: [] }),
}));

jest.mock("../../core/readiness", () => ({
  getReadinessData: () => ({ score: 0, cobertura: 0 }),
}));

jest.mock("../../core/enamedIntel", () => ({
  getEnamedBottleneckExplanation: () => null,
  getEnamedIntel: () => ({}),
}));

jest.mock("../../core/growthMetrics", () => ({
  computeGrowth: () => ({
    masteryByAreaDelta: 0,
    retentionDelta: 0,
    vsGoal: { acerto: 0, retention: 0 },
  }),
}));

jest.mock("../../core/clinicalReasoningScoring", () => ({
  summarizeClinicalCompetence: () => ({ score: 0, total: 0 }),
}));

jest.mock("../../core/sessionClosure", () => ({
  getPendingSessionClosure: () => ({ hasPendingClosure: false, theme: null }),
}));

jest.mock("../../core/dailyBriefing", () => ({
  buildDailyBriefing: () => null,
  canShowDailyBriefing: () => false,
  dismissDailyBriefing: jest.fn(),
  getDailyBriefingStorageKey: () => "daily-briefing-test",
}));

jest.mock("../../core/onboardingGate", () => ({
  isPlanSetupComplete: () => true,
}));

jest.mock("../../core/vestibularOnboarding", () => ({
  isVestibularStartComplete: () => true,
}));

jest.mock("../../hooks/useCountUp", () => (value) => value);

jest.mock("../ActionInbox", () => () => null);
jest.mock("../WeeklyReview", () => () => null);
jest.mock("../DomainTestModal", () => () => null);
jest.mock("../RetrievabilitySpark", () => () => null);
jest.mock("../DicaContextual", () => () => null);
jest.mock("../TrilhaJornada", () => () => null);
jest.mock("../VestibularStartTrail", () => () => null);
jest.mock("../SessionClosureModal", () => () => null);

jest.mock("../Primitives", () => ({
  TourBalloon: () => null,
  Modal: ({ children }) => <div>{children}</div>,
  Btn: ({ children, ...props }) => <button {...props}>{children}</button>,
  ConfettiOverlay: () => null,
  ProgressiveTooltip: ({ children }) => <>{children}</>,
  InfoTooltip: () => null,
}));

jest.mock("../motion", () => ({
  MotionSection: ({ children, as: Component = "div", ...props }) => (
    <Component {...props}>{children}</Component>
  ),
}));

jest.mock("../ui", () => ({
  Badge: ({ children }) => <span>{children}</span>,
  Card: ({ children }) => <div>{children}</div>,
  MetricRing: ({ label }) => <div>{label}</div>,
}));

function makeTema() {
  const today = todayStr();
  return {
    id: "tema-1",
    nome: "Cardiologia CC1",
    esp: "Clinica Medica",
    importancia: "ALTA",
    rev: {
      d0: { done: true, date: today },
      d1: { done: false, date: today },
      d4: { done: false, date: today },
      d7: { done: false, date: today },
      d21: { done: false, date: today },
      manutencao: { done: true, date: today },
    },
  };
}

function makeRestSnapshot(overrides = {}) {
  return {
    plat: "res",
    forDate: todayStr(),
    engineVersion: DECISION_CORE_ENGINE_VERSION,
    primaryAction: {
      id: "rest-primary",
      type: "rest",
      source: "mentor-policy",
    },
    dailyCommand: {
      id: "daily-rest",
      type: "rest_or_light_day",
      title: "Descanso CC1 do engine",
      subtitle: "Rest veio do snapshot fresco.",
      reason: "Rest deliberado.",
      primaryLabel: "Manter descanso",
      secondaryLabel: "Ver por que",
      tone: "emerald",
      source: "daily-command-engine",
      target: { route: "stats" },
      explain: ["Rest fresco nao deve ser sobrescrito."],
    },
    todayPlan: [],
    context: { plat: "res", scheduler: { dueTodayCount: 0 } },
    ...overrides,
  };
}

function makeState(decisionSnapshot) {
  return {
    plat: "res",
    sprint: { ativa: false, esps: [] },
    tourStep: null,
    setTourStep: jest.fn(),
    setOnboardingDone: jest.fn(),
    onboardingDone: true,
    showToast: jest.fn(),
    openConfirm: jest.fn(),
    aplicarDomainTestResultado: jest.fn(),
    addTema: jest.fn(),
    gamif: { streakCurrent: 0 },
    res: {
      temas: [makeTema()],
      simulados: [],
      ankiLog: [],
      cronogramas: [],
      casosProgresso: {},
    },
    vest: {
      temas: [],
      simulados: [],
      ankiLog: [],
      cronogramas: [],
      casosProgresso: {},
    },
    learningEvents: [],
    temaStats: {},
    meta: {
      dataProva: "2026-09-13",
      acerto: 85,
      retencaoFSRS: 0.9,
      maxRevisoesDia: 30,
      intervaloMaxDias: 180,
      tempoDisponivel: 2,
      prontidaoHist: [],
      provasAlvo: ["ENAMED"],
      ankiAdesao: { datas: [] },
      modulos: { raciocinioClinico: false },
      onboarding: { completed: true },
      vestibularStart: { completed: true },
      temasPerWeek: 6,
    },
    enamedAnalises: [],
    sessionReflections: [],
    marcarAnkiHoje: jest.fn(),
    addSessionReflection: jest.fn(),
    rebuildActionInboxForToday: jest.fn(),
    actionInbox: [],
    rebalanceTodayWorkload: jest.fn(),
    decisionSnapshot,
    calendarProvider: { activeId: "medcof", importedTopics: [], customTopics: [], scheduledTopics: [] },
    cronogramaSel: { res: "res-medcof-2026", vest: "vest-base" },
    autoCatchUp: jest.fn(),
    setSprint: jest.fn(),
  };
}

function renderDashboard(decisionSnapshot) {
  mockState = makeState(decisionSnapshot);
  safeTrackEvent.mockClear();
  return render(
    <Dashboard
      userName="Teste"
      onEditName={jest.fn()}
      onStudy={jest.fn()}
      setView={jest.fn()}
      showToast={jest.fn()}
      onOpenAjustes={jest.fn()}
      onOpenAgenda={jest.fn()}
      onOpenClinicalCase={jest.fn()}
    />
  );
}

describe("Dashboard CC-1 command selection", () => {
  test("CC-1: snapshot fresco com rest e pending vivo exibe o rest do engine", async () => {
    renderDashboard(makeRestSnapshot());

    expect(screen.getByRole("heading", { name: "Descanso CC1 do engine" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Fechar fila de hoje" })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(safeTrackEvent).toHaveBeenCalledWith(
        "mentor_action_seen",
        expect.objectContaining({
          plat: "res",
          action_type: "rest_or_light_day",
          source: "daily-command-engine",
        }),
        expect.any(Object)
      );
    });
  });

  test("CC-1: snapshot ausente com pending vivo usa fallback defensivo", async () => {
    renderDashboard(null);

    expect(screen.getByRole("heading", { name: "Fechar fila de hoje" })).toBeInTheDocument();

    await waitFor(() => {
      expect(safeTrackEvent).toHaveBeenCalledWith(
        "mentor_action_seen",
        expect.objectContaining({
          plat: "res",
          source: "dashboard-defensive-fallback",
        }),
        expect.any(Object)
      );
    });
  });

  test("CC-1: snapshot de outro plat e tratado como ausente", async () => {
    renderDashboard(makeRestSnapshot({ plat: "vest" }));

    expect(screen.getByRole("heading", { name: "Fechar fila de hoje" })).toBeInTheDocument();

    await waitFor(() => {
      expect(safeTrackEvent).toHaveBeenCalledWith(
        "mentor_action_seen",
        expect.objectContaining({
          plat: "res",
          source: "dashboard-defensive-fallback",
        }),
        expect.any(Object)
      );
    });
  });

  test("CC-3: registra target missing quando o executor nao consegue tratar o comando", async () => {
    const snapshot = makeRestSnapshot();
    snapshot.dailyCommand = {
      ...snapshot.dailyCommand,
      target: { route: "broken_route", params: { origin: "dashboard-test" } },
    };

    renderDashboard(snapshot);

    fireEvent.click(screen.getByRole("button", { name: "Manter descanso" }));

    await waitFor(() => {
      expect(safeTrackEvent).toHaveBeenCalledWith(
        "mentor_action_target_missing",
        {
          plat: "res",
          route: "broken_route",
          outcome: "unknown_route",
          source: "daily-command-engine",
        },
        expect.any(Object)
      );
    });
  });
});
