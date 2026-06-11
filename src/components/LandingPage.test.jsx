import { fireEvent, render, screen } from "@testing-library/react";
import LandingPage from "./LandingPage";

describe("LandingPage", () => {
  test("renderiza headline, CTA beta gratuito e FAQ", () => {
    render(<LandingPage onLogin={jest.fn()} onSignup={jest.fn()} />);

    expect(screen.getByRole("heading", { name: /sistema operacional de estudos/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /beta gratuito/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/O MedRev tem banco de quest/i)).toBeInTheDocument();
  });

  test("botao de entrar chama callback", () => {
    const onLogin = jest.fn();
    render(<LandingPage onLogin={onLogin} onSignup={jest.fn()} />);

    fireEvent.click(screen.getAllByRole("button", { name: /^Entrar$/i })[0]);

    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  test("botao comecar beta chama callback", () => {
    const onSignup = jest.fn();
    render(<LandingPage onLogin={jest.fn()} onSignup={onSignup} />);

    fireEvent.click(screen.getAllByRole("button", { name: /beta gratuito/i })[0]);

    expect(onSignup).toHaveBeenCalledTimes(1);
  });

  test("renderiza secao de dor real com fechamento", () => {
    render(<LandingPage onLogin={jest.fn()} onSignup={jest.fn()} />);

    expect(screen.getByText(/O MedRev conecta essas pe/i)).toBeInTheDocument();
  });

  test("renderiza antes e depois — labels presentes", () => {
    render(<LandingPage onLogin={jest.fn()} onSignup={jest.fn()} />);

    // "Sem o MedRev" aparece no painel inicial do toggle (pode ter >1 ocorrência)
    expect(screen.getAllByText(/Sem o MedRev/i).length).toBeGreaterThan(0);
    // "Com o MedRev" aparece no ChaosSection (card central)
    expect(screen.getAllByText(/Com o MedRev/i).length).toBeGreaterThan(0);
  });

  test("renderiza sem promessa de aprovacao", () => {
    render(<LandingPage onLogin={jest.fn()} onSignup={jest.fn()} />);

    // Pode aparecer no título da seção E no card de transparência
    expect(screen.getAllByText(/Sem promessa de aprova/i).length).toBeGreaterThan(0);
  });

  test("renderiza secao Como o MedRev pensa", () => {
    render(<LandingPage onLogin={jest.fn()} onSignup={jest.fn()} />);

    expect(screen.getByText(/transforma sinais soltos em decis/i)).toBeInTheDocument();
    expect(screen.getByText(/Mentor de decis/i)).toBeInTheDocument();
  });

  test("renderiza feature showcase com tabs de recursos", () => {
    render(<LandingPage onLogin={jest.fn()} onSignup={jest.fn()} />);

    expect(screen.getByRole("tab", { name: /FSRS/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Simulados/i })).toBeInTheDocument();
  });

  test("renderiza metodo por tras", () => {
    render(<LandingPage onLogin={jest.fn()} onSignup={jest.fn()} />);

    expect(screen.getByText(/Um método de estudo/i)).toBeInTheDocument();
    expect(screen.getByText(/Pr.tica de recupera/i)).toBeInTheDocument();
  });

  test("renderiza secao beta gratuito sem cobranca", () => {
    render(<LandingPage onLogin={jest.fn()} onSignup={jest.fn()} />);

    expect(screen.getByText(/Beta gratuito\. Constru/i)).toBeInTheDocument();
    // "Sem cobrança" aparece no Hero e na seção Beta
    expect(screen.getAllByText(/Sem cobran/i).length).toBeGreaterThan(0);
  });
});
