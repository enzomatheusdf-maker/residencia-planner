import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import DomainTestModal from "./DomainTestModal";

describe("DomainTestModal", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("runs the main flow and applies a consolidated classification", () => {
    const onApply = jest.fn();
    const onClose = jest.fn();

    render(
      <DomainTestModal
        open
        tema={{ id: "tema-1", nome: "Apendicite" }}
        source="ja_domino"
        onApply={onApply}
        onClose={onClose}
      />
    );

    expect(screen.getByRole("dialog", { name: "Teste de Domínio" })).toBeInTheDocument();
    expect(screen.getByText(/Apendicite/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Finalizar Brain Dump/i }));

    screen.getAllByRole("button", { name: "Bom" }).forEach((button) => {
      fireEvent.click(button);
    });

    fireEvent.click(screen.getByRole("button", { name: /Ir para questões/i }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Número de acertos" }), {
      target: { value: "16" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Classificar tema/i }));

    expect(screen.getByText("Tema consolidado")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Aplicar conduta/i }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0].classification).toEqual({
      label: "consolidated",
      recommendedAction: "light_review",
      fsrsEntry: "d21_or_maintenance",
    });
    expect(onApply.mock.calls[0][0].source).toBe("ja_domino");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
