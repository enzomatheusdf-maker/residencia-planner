import { fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { Badge, Button, Card, EmptyState, MetricRing, SegmentedControl, Skeleton, Tabs } from ".";

describe("premium ui primitives", () => {
  test("renders Button variants with pass-through className", () => {
    render(<Button className="custom-button">Salvar</Button>);
    expect(screen.getByRole("button", { name: "Salvar" })).toHaveClass("custom-button");
  });

  test("renders Card and Badge primitives", () => {
    render(
      <Card interactive>
        <Badge tone="green">OK</Badge>
      </Card>
    );
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  test("renders MetricRing with clamped accessible percentage", () => {
    render(<MetricRing label="Questoes" max={40} value={20} />);
    expect(screen.getByRole("img", { name: "Questoes: 50%" })).toBeInTheDocument();
  });

  test("SegmentedControl changes by click and keyboard", () => {
    function Demo() {
      const [value, setValue] = useState("dia");
      return (
        <SegmentedControl
          ariaLabel="Periodo"
          value={value}
          onChange={setValue}
          options={[
            { value: "dia", label: "Dia" },
            { value: "semana", label: "Semana" },
          ]}
        />
      );
    }

    render(<Demo />);
    fireEvent.click(screen.getByRole("radio", { name: "Semana" }));
    expect(screen.getByRole("radio", { name: "Semana" })).toHaveAttribute("aria-checked", "true");
    fireEvent.keyDown(screen.getByRole("radiogroup", { name: "Periodo" }), { key: "ArrowLeft" });
    expect(screen.getByRole("radio", { name: "Dia" })).toHaveAttribute("aria-checked", "true");
  });

  test("Tabs exposes selected tab and panel", () => {
    function Demo() {
      const [activeValue, setActiveValue] = useState("a");
      return (
        <Tabs
          activeValue={activeValue}
          ariaLabel="Secoes"
          onValueChange={setActiveValue}
          tabs={[
            { value: "a", label: "A", children: "Painel A" },
            { value: "b", label: "B", children: "Painel B" },
          ]}
        />
      );
    }

    render(<Demo />);
    fireEvent.click(screen.getByRole("tab", { name: "B" }));
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Painel B")).toBeVisible();
  });

  test("EmptyState and Skeleton render stable markup", () => {
    render(
      <>
        <EmptyState title="Sem dados" description="Coletando historico." />
        <Skeleton width={120} height={20} />
      </>
    );
    expect(screen.getByText("Sem dados")).toBeInTheDocument();
    expect(screen.getByText("Coletando historico.")).toBeInTheDocument();
  });
});
