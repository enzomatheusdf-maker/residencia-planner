import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ActionInbox from "../ActionInbox";
import { safeTrackEvent } from "../../core/telemetry";

let mockState;

function makeMockState(overrides = {}) {
  return {
    actionInbox: [
      {
        id: "act_queue_today",
        type: "fila_do_dia",
        title: "Fechar fila de hoje",
        reason: "Fechar a fila diaria mantem ritmo.",
        source: "mentor",
        status: "open",
        cta: "Executar fila de hoje",
        ctaView: "dash",
        target: { action: "close_today_queue" },
      },
    ],
    rebuildActionInboxForToday: jest.fn(),
    acceptAction: jest.fn(),
    dismissAction: jest.fn(),
    markActionDone: jest.fn(),
    rebalanceTodayWorkload: jest.fn(),
    plat: "res",
    meta: { analytics: { disabled: false } },
    showToast: jest.fn(),
    ...overrides,
  };
}

jest.mock("../../core/store", () => {
  const useStore = (selector) => (selector ? selector(mockState) : mockState);
  useStore.getState = () => mockState;
  return { useStore };
});

jest.mock("../../hooks/useMetrics", () => ({
  useFilaInteligente: () => [
    {
      temaId: "tema-1",
      stepKey: "d1",
      overdue: false,
    },
  ],
}));

jest.mock("../../core/telemetry", () => ({
  safeTrackEvent: jest.fn(),
}));

describe("ActionInbox", () => {
  beforeEach(() => {
    mockState = makeMockState();
    jest.clearAllMocks();
  });

  it("starts today's queue action from the first intelligent queue item", () => {
    const onStudy = jest.fn();
    const setView = jest.fn();

    render(<ActionInbox onStudy={onStudy} setView={setView} />);

    fireEvent.click(screen.getByRole("button", { name: /Executar fila de hoje/i }));

    expect(onStudy).toHaveBeenCalledWith("tema-1", "d1");
    expect(setView).not.toHaveBeenCalled();
    expect(safeTrackEvent).not.toHaveBeenCalledWith(
      "mentor_action_target_missing",
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("tracks mentor_action_target_missing when executor returns a bad outcome", () => {
    const setView = jest.fn();
    mockState = makeMockState({
      actionInbox: [
        {
          id: "act_broken",
          type: "broken",
          title: "Abrir rota quebrada",
          reason: "Teste CC-3.",
          source: "action-test",
          status: "open",
          cta: "Executar rota quebrada",
          target: { route: "broken_route", params: { origin: "test" } },
        },
      ],
    });

    render(<ActionInbox setView={setView} />);

    fireEvent.click(screen.getByRole("button", { name: /Executar rota quebrada/i }));

    expect(setView).toHaveBeenCalledWith("dash");
    expect(safeTrackEvent).toHaveBeenCalledWith(
      "mentor_action_target_missing",
      {
        plat: "res",
        route: "broken_route",
        outcome: "unknown_route",
        source: "action-test",
      },
      { state: { meta: mockState.meta } }
    );
  });
});
