import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Cronograma from "../Cronograma";
import { buildPlanAgendaTarget } from "../../core/navigationModel";
import { useStore } from "../../core/store";

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
    createReviewGroup: jest.fn(() => ({ ok: true, group: { id: "group-1" } })),
    applyJaDominoToGroup: jest.fn(() => ({ ok: true })),
    reviewGroups: { res: [], vest: [] },
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
  beforeEach(() => {
    const state = useStore.getState();
    Object.values(state).forEach((value) => {
      if (typeof value?.mockClear === "function") value.mockClear();
    });
    state.res = { temas: [], simulados: [] };
    state.vest = { temas: [], simulados: [] };
    state.reviewGroups = { res: [], vest: [] };
    state.createReviewGroup.mockImplementation(() => ({ ok: true, group: { id: "group-1" } }));
    state.applyJaDominoToGroup.mockImplementation(() => ({ ok: true }));
  });

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

  it("configura Já domino no bloco com resultado compartilhado antes de aplicar", () => {
    const state = useStore.getState();
    state.res.temas = [
      { id: "a", nome: "Tema A", esp: "Clínica Médica", unstarted: true },
      { id: "b", nome: "Tema B", esp: "Clínica Médica", unstarted: true },
    ];
    const catalogo = [{ b: 1, nome: "Bloco 1", t: [["Tema A", "Clínica Médica", "Alta"], ["Tema B", "Clínica Médica", "Alta"]] }];

    render(<Cronograma catalogo={catalogo} onStep={jest.fn()} onEdit={jest.fn()} onIniciarTema={jest.fn()} />);
    fireEvent.click(screen.getByText("Banco de Temas"));
    screen.getAllByTitle("Selecionar para grupo de revisão").forEach((button) => fireEvent.click(button));
    fireEvent.click(screen.getByRole("button", { name: "Já domino no bloco" }));

    expect(screen.getByText("Resultado único para todos")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Total de questões para todos"), { target: { value: "24" } });
    fireEvent.change(screen.getByLabelText("Acertos para todos"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar ao grupo de revisão" }));

    expect(state.createReviewGroup).toHaveBeenCalledWith("res", {
      nome: "Grupo de revisão · Clínica Médica",
      temaIds: ["a", "b"],
    });
    expect(state.applyJaDominoToGroup).toHaveBeenCalledWith("res", "group-1", {
      questoesShared: 24,
      acertosShared: 20,
    });
    expect(state.applyJaDominoToGroup).not.toHaveBeenCalledWith("res", "group-1", {
      questoesShared: 20,
      acertosShared: 18,
    });
  });

  it("configura Já domino no bloco com ajuste por tema e permite preview de retomada", () => {
    const state = useStore.getState();
    state.res.temas = [
      { id: "a", nome: "Tema A", esp: "Clínica Médica", unstarted: true },
      { id: "b", nome: "Tema B", esp: "Clínica Médica", unstarted: true },
    ];
    const catalogo = [{ b: 1, nome: "Bloco 1", t: [["Tema A", "Clínica Médica", "Alta"], ["Tema B", "Clínica Médica", "Alta"]] }];

    render(<Cronograma catalogo={catalogo} onStep={jest.fn()} onEdit={jest.fn()} onIniciarTema={jest.fn()} />);
    fireEvent.click(screen.getByText("Banco de Temas"));
    screen.getAllByTitle("Selecionar para grupo de revisão").forEach((button) => fireEvent.click(button));
    fireEvent.click(screen.getByRole("button", { name: "Já domino no bloco" }));
    fireEvent.click(screen.getByRole("button", { name: "Ajustar por tema" }));

    fireEvent.change(screen.getByLabelText("Total de questões para Tema A"), { target: { value: "15" } });
    fireEvent.change(screen.getByLabelText("Acertos para Tema A"), { target: { value: "6" } });
    fireEvent.change(screen.getByLabelText("Total de questões para Tema B"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText("Acertos para Tema B"), { target: { value: "27" } });

    expect(screen.getByText("Retomada recomendada")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aplicar ao grupo de revisão" }));

    expect(state.applyJaDominoToGroup).toHaveBeenCalledWith("res", "group-1", {
      questoesPorTema: { a: 15, b: 30 },
      acertosPorTema: { a: 6, b: 27 },
    });
  });

  it("bloqueia confirmação do modal quando acertos passam do total", () => {
    const state = useStore.getState();
    state.res.temas = [
      { id: "a", nome: "Tema A", esp: "Clínica Médica", unstarted: true },
      { id: "b", nome: "Tema B", esp: "Clínica Médica", unstarted: true },
    ];
    const catalogo = [{ b: 1, nome: "Bloco 1", t: [["Tema A", "Clínica Médica", "Alta"], ["Tema B", "Clínica Médica", "Alta"]] }];

    render(<Cronograma catalogo={catalogo} onStep={jest.fn()} onEdit={jest.fn()} onIniciarTema={jest.fn()} />);
    fireEvent.click(screen.getByText("Banco de Temas"));
    screen.getAllByTitle("Selecionar para grupo de revisão").forEach((button) => fireEvent.click(button));
    fireEvent.click(screen.getByRole("button", { name: "Já domino no bloco" }));
    fireEvent.change(screen.getByLabelText("Total de questões para todos"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Acertos para todos"), { target: { value: "11" } });

    expect(screen.getByText("Dados incompletos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aplicar ao grupo de revisão" })).toBeDisabled();
  });
});
