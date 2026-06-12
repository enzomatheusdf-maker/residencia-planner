import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import AgendaDayDetails from "../AgendaDayDetails";
import AgendaMonthGrid from "../AgendaMonthGrid";
import AgendaTaskItem from "../AgendaTaskItem";

const TODAY = "2026-06-02";

const task = {
  id: "task-1",
  type: "review",
  temaId: "tema-1",
  temaNome: "Apendicite",
  area: "Cirurgia",
  stepKey: "d1",
  phase: "learning",
  date: TODAY,
  estimatedMinutes: 25,
  priority: "ALTA",
};

describe("Agenda render smoke", () => {
  it("renders AgendaTaskItem with executable label", () => {
    render(<AgendaTaskItem item={task} />);
    expect(screen.getByText("Apendicite")).toBeInTheDocument();
    expect(screen.getByText("Revisar")).toBeInTheDocument();
  });

  it("renders expandable group review sub-items", () => {
    render(
      <AgendaTaskItem
        item={{
          ...task,
          id: "group-1",
          type: "group_review",
          temaNome: "Grupo de revisão Hipo",
          groupId: "group-1",
          stepKey: "group_review",
          subItems: [
            { temaId: "a", temaNome: "Hipo I", stepKey: "d21", date: TODAY },
            { temaId: "b", temaNome: "Hipo II", stepKey: "d21", date: TODAY },
          ],
          target: { action: "group_review", route: "focus", params: { groupId: "group-1" } },
        }}
      />
    );

    fireEvent.click(screen.getByText("2 curvas de revisão"));
    expect(screen.getByText("Hipo I")).toBeInTheDocument();
    expect(screen.getByText("Hipo II")).toBeInTheDocument();
  });

  it("renders Domain Test classification labels in AgendaTaskItem", () => {
    render(
      <AgendaTaskItem
        item={{
          ...task,
          type: "relearning",
          phase: "relearning",
          domainTestClassification: "detail_noise",
          domainTestAgendaLabel: "Padrao de erro",
        }}
      />
    );

    expect(screen.getByText("Padrao de erro")).toBeInTheDocument();
    expect(screen.getByText("Padrao")).toBeInTheDocument();
    expect(screen.getByText("Revisar padrao")).toBeInTheDocument();
  });

  it("renders AgendaDayDetails with minimal summary", () => {
    render(
      <AgendaDayDetails
        daySummary={{
          date: TODAY,
          items: [task],
          totalMinutes: 25,
          overdueCount: 0,
          newCount: 0,
          isEmpty: false,
        }}
      />
    );
    expect(screen.getByText(/Agenda/)).toBeInTheDocument();
    expect(screen.getByText("Apendicite")).toBeInTheDocument();
  });

  it("renders Domain Test guidance inside AgendaDayDetails modal", () => {
    const domainTask = {
      ...task,
      type: "relearning",
      phase: "relearning",
      domainTestClassification: "rescue",
      domainTestAgendaLabel: "Resgate dirigido",
      domainTestConduta: "revisao_dirigida_mais_questoes",
    };

    render(
      <AgendaDayDetails
        daySummary={{
          date: TODAY,
          items: [domainTask],
          totalMinutes: 25,
          overdueCount: 0,
          newCount: 0,
          isEmpty: false,
        }}
        temas={[{
          id: "tema-1",
          nome: "Apendicite",
          esp: "Cirurgia",
          rev: {
            d1: { done: false, date: TODAY, phase: "relearning", domainTestClassification: "rescue" },
          },
        }]}
      />
    );

    fireEvent.click(screen.getByLabelText("Detalhes da tarefa"));

    expect(screen.getAllByText(/Revisao dirigida/).length).toBeGreaterThan(1);
    expect(screen.getByText(/Teste de Dominio: Resgate dirigido/)).toBeInTheDocument();
    expect(screen.getByText(/revisao_dirigida_mais_questoes/)).toBeInTheDocument();
  });

  it("renders AgendaMonthGrid with minimal props", () => {
    render(
      <AgendaMonthGrid
        temas={[{
          id: "tema-1",
          nome: "Apendicite",
          esp: "Cirurgia",
          importancia: "ALTA",
          rev: {
            d0: { done: true, date: "2026-06-01" },
            d1: { done: false, date: TODAY },
          },
        }]}
        plat="res"
      />
    );
    expect(screen.getByText(/Junho/)).toBeInTheDocument();
  });
});
