import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { Dialog, Sheet, Toast, Tooltip } from ".";

describe("overlay primitives", () => {
  test("Dialog renders through portal and closes on Esc", () => {
    const onClose = jest.fn();
    render(<Dialog open title="Confirmar" onClose={onClose}>Conteudo</Dialog>);
    expect(screen.getByRole("dialog", { name: "Confirmar" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("Dialog keeps dirty forms open on backdrop and Esc", () => {
    const onClose = jest.fn();
    render(<Dialog open title="Editar" formDirty onClose={onClose}>Formulario</Dialog>);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog", { name: "Editar" }).parentElement);
    expect(onClose).not.toHaveBeenCalled();
  });

  test("Tooltip opens with click", () => {
    render(
      <Tooltip content="Explicacao">
        <button type="button">Info</button>
      </Tooltip>
    );
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    expect(screen.getByText("Explicacao")).toBeInTheDocument();
  });

  test("Toast auto-dismisses", async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<Toast message="Salvo" onDismiss={onDismiss} ms={100} />);
    expect(screen.getByText("Salvo")).toBeInTheDocument();
    jest.advanceTimersByTime(120);
    await waitFor(() => expect(onDismiss).toHaveBeenCalledTimes(1));
    jest.useRealTimers();
  });

  test("Sheet delegates dialog semantics", () => {
    render(<Sheet open title="Detalhes" onClose={() => {}}>Corpo</Sheet>);
    expect(screen.getByRole("dialog", { name: "Detalhes" })).toHaveTextContent("Corpo");
  });
});
