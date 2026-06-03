import React from "react";
import { render, screen } from "@testing-library/react";
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
