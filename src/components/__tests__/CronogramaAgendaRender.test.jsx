import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Cronograma from "../Cronograma";
import { buildPlanAgendaTarget } from "../../core/navigationModel";

jest.mock("../../core/store", () => {
  const state = {
    plat: "res",
    cronogramaSel: { res: "res-medcof-2026" },
    setCronogramaSel: jest.fn(),
    tourStep: null,
    setTourStep: jest.fn(),
    calendarProvider: {
      activeId: "medcof",
      importedTopics: [],
      customTopics: [],
      scheduledTopics: [],
    },
    setCalendarProvider: jest.fn(),
    saveImportedCalendarTopics: jest.fn(),
    addTema: jest.fn(),
    meta: { planSetup: { completedAt: "2026-06-02" } },
    setMeta: jest.fn(),
    iniciarValidacaoDominioPrevio: jest.fn(),
    validarDominio: jest.fn(),
    aplicarDomainTestResultado: jest.fn(),
    showToast: jest.fn(),
    res: { temas: [], simulados: [] },
    vest: { temas: [], simulados: [] },
  };
  const useStore = (selector) => (selector ? selector(state) : state);
  useStore.getState = () => state;
  useStore.setState = jest.fn();
  return { useStore };
});

describe("Cronograma render smoke", () => {
  it("renders Plano tab", () => {
    render(<Cronograma catalogo={[]} onStep={jest.fn()} onEdit={jest.fn()} onIniciarTema={jest.fn()} />);
    expect(screen.getByText("Plano")).toBeInTheDocument();
  });

  it("renders Agenda tab without undefined component crash", () => {
    render(<Cronograma catalogo={[]} onStep={jest.fn()} onEdit={jest.fn()} onIniciarTema={jest.fn()} />);
    fireEvent.click(screen.getByText("Agenda"));
    expect(screen.getByText(/Junho/)).toBeInTheDocument();
  });

  it("opens directly on Agenda when navigationTarget requests it", async () => {
    const onConsumed = jest.fn();
    render(
      <Cronograma
        catalogo={[]}
        onStep={jest.fn()}
        onEdit={jest.fn()}
        onIniciarTema={jest.fn()}
        navigationTarget={buildPlanAgendaTarget({ date: "2026-06-03" })}
        onNavigationTargetConsumed={onConsumed}
      />
    );

    expect(screen.getByText(/Junho/)).toBeInTheDocument();
    await waitFor(() => expect(onConsumed).toHaveBeenCalledTimes(1));
  });
});
