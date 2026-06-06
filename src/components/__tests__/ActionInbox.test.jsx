import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ActionInbox from "../ActionInbox";

const mockState = {
  actionInbox: [
    {
      id: "act_queue_today",
      type: "fila_do_dia",
      title: "Fechar fila de hoje",
      reason: "Fechar a fila diaria mantem ritmo.",
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
  showToast: jest.fn(),
};

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

describe("ActionInbox", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("starts today's queue action from the first intelligent queue item", () => {
    const onStudy = jest.fn();
    const setView = jest.fn();

    render(<ActionInbox onStudy={onStudy} setView={setView} />);

    fireEvent.click(screen.getByRole("button", { name: /Executar fila de hoje/i }));

    expect(onStudy).toHaveBeenCalledWith("tema-1", "d1");
    expect(setView).not.toHaveBeenCalled();
  });
});
