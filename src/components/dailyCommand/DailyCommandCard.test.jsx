import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DailyCommandCard, { DailyProgressRing } from "./DailyCommandCard";
import { confidenceLabel, humanizeSignal } from "../../core/copy";

// ─── helpers ────────────────────────────────────────────────────────────────

function makeCommand(overrides = {}) {
  return {
    eyebrow: "Comando do dia",
    title: "Título do Comando",
    subtitle: "Subtítulo do comando.",
    primaryLabel: "Executar ação",
    secondaryLabel: "Ver por quê",
    tone: "blue",
    action: {
      type: "fila_do_dia",
      source: "mentor",
      explain: ["Razão de teste."],
      reason: "Razão de fallback.",
      confidence: 0.85,
      riskIfIgnored: "Risco de acúmulo.",
      sourceSignals: ["dueToday:5", "overdue:2", "track:r1"],
    },
    ...overrides,
  };
}

const defaultProps = {
  command: makeCommand(),
  todayLoadSummary: "5 revisões · 30 min · carga tranquila",
  topFilaItem: null,
  hasPendingClosure: false,
  showWhy: false,
  onToggleWhy: jest.fn(),
  onDismissPendingClosure: jest.fn(),
  onRunPrimary: jest.fn(),
  onOpenModal: jest.fn(),
};

// ─── CC-8: varredura de jargão — zero "FSRS" nos componentes de UI ───────────

describe("CC-8 — varredura de jargão FSRS na UI", () => {
  test("DailyCommandCard não contém o texto 'FSRS' em nenhum output renderizado", () => {
    const { container } = render(
      <DailyCommandCard {...defaultProps} showWhy={true} />
    );
    expect(container.textContent).not.toMatch(/FSRS/);
  });

  test("CommandWhyPanel não exibe 'FSRS' mesmo com explain[] populado", () => {
    const cmd = makeCommand({
      action: {
        type: "today_review",
        explain: ["Manter a curva de revisão diária previsível."],
        confidence: 0.9,
        riskIfIgnored: "A fila pode virar atraso amanhã.",
        sourceSignals: ["dueToday:3"],
      },
    });
    const { container } = render(
      <DailyCommandCard {...defaultProps} command={cmd} showWhy={true} />
    );
    expect(container.textContent).not.toMatch(/FSRS/);
  });
});

// ─── CC-8: razão curta sempre visível ────────────────────────────────────────

describe("CC-8 — razão curta sempre visível", () => {
  test("subtitle é renderizado mesmo com showWhy=false", () => {
    render(<DailyCommandCard {...defaultProps} showWhy={false} />);
    expect(screen.getByText("Subtítulo do comando.")).toBeInTheDocument();
  });

  test("subtitle é renderizado com showWhy=true", () => {
    render(<DailyCommandCard {...defaultProps} showWhy={true} />);
    expect(screen.getByText("Subtítulo do comando.")).toBeInTheDocument();
  });
});

// ─── CC-8: todos os tipos de ação renderizam explicação não-vazia ─────────────

const ACTION_TYPES = [
  {
    label: "fila_do_dia",
    action: { type: "fila_do_dia", explain: ["Fechar a fila diária mantém ritmo."], confidence: 0.85 },
  },
  {
    label: "overdue_review",
    action: { type: "overdue_review", explain: ["Revisões atrasadas comprometem retenção."], confidence: 0.9 },
  },
  {
    label: "plan_setup",
    action: { type: "plan_setup", explain: ["Sem plano, a interface só oferece atalhos genéricos."], confidence: 0.95 },
  },
  {
    label: "continue_session",
    action: { type: "continue_session", explain: ["Fechar a sessão atualiza o ciclo de feedback do Mentor."], confidence: 0.92 },
  },
  {
    label: "rest_or_light_day",
    action: { type: "rest_or_light_day", explain: ["Use o bloco leve para manter consistência."], confidence: 0.6 },
  },
  {
    label: "new_topic",
    action: { type: "new_topic", explain: ["Aumenta cobertura quando a fila está segura."], confidence: 0.7 },
  },
  {
    label: "simulation",
    action: { type: "simulation", explain: ["Calibra desempenho e revela gargalos."], confidence: 0.75 },
  },
  {
    label: "anki",
    action: { type: "anki", explain: ["Mantém reforço leve de memória com baixo custo."], confidence: 0.65 },
  },
  {
    label: "adjust_plan",
    action: { type: "adjust_plan", explain: ["Recoloca o plano dentro da capacidade atual."], confidence: 0.8 },
  },
  {
    label: "sem explain (fallback para reason)",
    action: { type: "today_review", reason: "Manter a curva de revisão diária." },
  },
  {
    label: "sem explain nem reason (fallback para subtitle)",
    action: { type: "today_review" },
  },
];

describe("CC-8 — todos os tipos de ação renderizam explicação não-vazia", () => {
  test.each(ACTION_TYPES)("$label exibe pelo menos um item de explicação", ({ action }) => {
    const cmd = makeCommand({ subtitle: "Razão curta de teste.", action });
    render(
      <DailyCommandCard {...defaultProps} command={cmd} showWhy={true} />
    );
    const region = screen.getByRole("region", { name: "Por que isso agora" });
    const bullets = region.querySelectorAll("li");
    expect(bullets.length).toBeGreaterThan(0);
    // Nenhum bullet vazio
    bullets.forEach((li) => {
      expect(li.textContent.trim().length).toBeGreaterThan(0);
    });
  });
});

// ─── CC-8: rótulo de confiança humano ─────────────────────────────────────────

describe("CC-8 — rótulo de confiança humano", () => {
  test("confidence >= 0.8 exibe 'Confiança alta'", () => {
    const cmd = makeCommand({ action: { ...makeCommand().action, confidence: 0.9 } });
    render(<DailyCommandCard {...defaultProps} command={cmd} showWhy={true} />);
    expect(screen.getByLabelText("Confiança alta")).toBeInTheDocument();
  });

  test("confidence 0.55–0.79 exibe 'Confiança média'", () => {
    const cmd = makeCommand({ action: { ...makeCommand().action, confidence: 0.65 } });
    render(<DailyCommandCard {...defaultProps} command={cmd} showWhy={true} />);
    expect(screen.getByLabelText("Confiança média")).toBeInTheDocument();
  });

  test("confidence < 0.55 exibe 'Confiança explorando'", () => {
    const cmd = makeCommand({ action: { ...makeCommand().action, confidence: 0.4 } });
    render(<DailyCommandCard {...defaultProps} command={cmd} showWhy={true} />);
    expect(screen.getByLabelText("Confiança explorando")).toBeInTheDocument();
  });

  test("ausência de confidence não renderiza badge", () => {
    const cmd = makeCommand({
      action: { type: "fila_do_dia", explain: ["Algo."] },
    });
    render(<DailyCommandCard {...defaultProps} command={cmd} showWhy={true} />);
    expect(screen.queryByLabelText(/Confiança/)).not.toBeInTheDocument();
  });
});

// ─── CC-8: riskIfIgnored renderizado quando presente ─────────────────────────

describe("CC-8 — riskIfIgnored", () => {
  test("renderiza riskIfIgnored quando presente", () => {
    render(<DailyCommandCard {...defaultProps} showWhy={true} />);
    expect(screen.getByText(/Se ignorado:/)).toBeInTheDocument();
    expect(screen.getByText("Risco de acúmulo.", { exact: false })).toBeInTheDocument();
  });

  test("não renderiza bloco de risco quando riskIfIgnored está ausente", () => {
    const cmd = makeCommand({
      action: { type: "fila_do_dia", explain: ["Algo."] },
    });
    render(<DailyCommandCard {...defaultProps} command={cmd} showWhy={true} />);
    expect(screen.queryByText(/Se ignorado:/)).not.toBeInTheDocument();
  });
});

// ─── CC-8: sinais humanizados ─────────────────────────────────────────────────

describe("CC-8 — sinais humanizados", () => {
  test("sourceSignals são renderizados como chips legíveis", () => {
    render(<DailyCommandCard {...defaultProps} showWhy={true} />);
    expect(screen.getByText("5 revisões para hoje")).toBeInTheDocument();
    expect(screen.getByText("2 atrasadas")).toBeInTheDocument();
    expect(screen.getByText("Trilha R1")).toBeInTheDocument();
  });

  test("tokens internos (mentor-v2, action:...) não são exibidos", () => {
    const cmd = makeCommand({
      action: {
        type: "fila_do_dia",
        explain: ["Algo."],
        sourceSignals: ["mentor-v2", "action:fila_do_dia", "dueToday:3"],
      },
    });
    render(<DailyCommandCard {...defaultProps} command={cmd} showWhy={true} />);
    expect(screen.queryByText("mentor-v2")).not.toBeInTheDocument();
    expect(screen.queryByText("action:fila_do_dia")).not.toBeInTheDocument();
    expect(screen.getByText("3 revisões para hoje")).toBeInTheDocument();
  });
});

// ─── CC-8: painel fechado por padrão ─────────────────────────────────────────

describe("CC-8 — visibilidade do painel", () => {
  test("showWhy=false não exibe o painel 'Por que isso agora?'", () => {
    render(<DailyCommandCard {...defaultProps} showWhy={false} />);
    expect(screen.queryByRole("region", { name: "Por que isso agora" })).not.toBeInTheDocument();
  });

  test("showWhy=true exibe o painel 'Por que isso agora?'", () => {
    render(<DailyCommandCard {...defaultProps} showWhy={true} />);
    expect(screen.getByRole("region", { name: "Por que isso agora" })).toBeInTheDocument();
    expect(screen.getByText("Por que isso agora?")).toBeInTheDocument();
  });
});

// ─── Testes pré-existentes (tom + interações) — mantidos sem alteração ────────

describe("DailyCommandCard — render por tom", () => {
  test("tom normal (blue): renderiza título e botão primário padrão", () => {
    render(<DailyCommandCard {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "Título do Comando" })).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: "Executar ação" });
    expect(btn.className).toMatch(/from-blue-600/);
  });

  test("tom alerta (amber): botão primário usa gradiente âmbar", () => {
    render(
      <DailyCommandCard
        {...defaultProps}
        command={makeCommand({ tone: "amber", primaryLabel: "Ação urgente" })}
      />
    );
    const btn = screen.getByRole("button", { name: "Ação urgente" });
    expect(btn.className).toMatch(/from-amber-500/);
  });

  test("tom alerta (red): botão primário usa gradiente vermelho", () => {
    render(
      <DailyCommandCard
        {...defaultProps}
        command={makeCommand({ tone: "red", primaryLabel: "Fechar pendência" })}
      />
    );
    const btn = screen.getByRole("button", { name: "Fechar pendência" });
    expect(btn.className).toMatch(/from-red-600/);
  });

  test("tom rest (emerald): botão primário usa estilo esmeralda", () => {
    render(
      <DailyCommandCard
        {...defaultProps}
        command={makeCommand({ tone: "emerald", primaryLabel: "Descanso" })}
      />
    );
    const btn = screen.getByRole("button", { name: "Descanso" });
    expect(btn.className).toMatch(/bg-emerald-600\/25/);
  });

  test("exibe todayLoadSummary como badge de carga", () => {
    render(<DailyCommandCard {...defaultProps} />);
    expect(screen.getByText("5 revisões · 30 min · carga tranquila")).toBeInTheDocument();
  });

  test("eyebrow é botão que chama onOpenModal", () => {
    const onOpenModal = jest.fn();
    render(<DailyCommandCard {...defaultProps} onOpenModal={onOpenModal} />);
    fireEvent.click(screen.getByTitle("Ver tarefas do Comando do dia"));
    expect(onOpenModal).toHaveBeenCalledTimes(1);
  });
});

describe("DailyCommandCard — interações", () => {
  test("botão primário chama onRunPrimary", () => {
    const onRunPrimary = jest.fn();
    render(<DailyCommandCard {...defaultProps} onRunPrimary={onRunPrimary} />);
    fireEvent.click(screen.getByRole("button", { name: "Executar ação" }));
    expect(onRunPrimary).toHaveBeenCalledTimes(1);
  });

  test("botão secundário sem pendingClosure chama onToggleWhy", () => {
    const onToggleWhy = jest.fn();
    render(
      <DailyCommandCard
        {...defaultProps}
        hasPendingClosure={false}
        onToggleWhy={onToggleWhy}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Ver por quê" }));
    expect(onToggleWhy).toHaveBeenCalledTimes(1);
  });

  test("botão secundário com pendingClosure chama onDismissPendingClosure", () => {
    const onDismiss = jest.fn();
    render(
      <DailyCommandCard
        {...defaultProps}
        hasPendingClosure={true}
        onDismissPendingClosure={onDismiss}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Ver por quê" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("topFilaItem.isOptimal + fila_do_dia exibe badge de ponto ótimo", () => {
    render(
      <DailyCommandCard
        {...defaultProps}
        topFilaItem={{ isOptimal: true }}
        command={makeCommand({ action: { type: "fila_do_dia" } })}
      />
    );
    expect(screen.getByText("Ponto exato de esquecimento detectado")).toBeInTheDocument();
  });
});

describe("DailyProgressRing", () => {
  test("renderiza progresso 0/3 sem crash", () => {
    const { container } = render(<DailyProgressRing value={0} goal={3} />);
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  test("renderiza progresso 2/3", () => {
    render(<DailyProgressRing value={2} goal={3} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("/3 hoje")).toBeInTheDocument();
  });
});

// ─── copy.js: confidenceLabel unit tests ─────────────────────────────────────

describe("confidenceLabel (copy.js)", () => {
  test("0.8 → 'alta'", () => expect(confidenceLabel(0.8)).toBe("alta"));
  test("0.99 → 'alta'", () => expect(confidenceLabel(0.99)).toBe("alta"));
  test("0.55 → 'média'", () => expect(confidenceLabel(0.55)).toBe("média"));
  test("0.79 → 'média'", () => expect(confidenceLabel(0.79)).toBe("média"));
  test("0.54 → 'explorando'", () => expect(confidenceLabel(0.54)).toBe("explorando"));
  test("0 → 'explorando'", () => expect(confidenceLabel(0)).toBe("explorando"));
  test("undefined → null", () => expect(confidenceLabel(undefined)).toBeNull());
  test("null → null", () => expect(confidenceLabel(null)).toBeNull());
  test("NaN → null", () => expect(confidenceLabel(NaN)).toBeNull());
  test("string → null", () => expect(confidenceLabel("alta")).toBeNull());
});

// ─── copy.js: humanizeSignal unit tests ──────────────────────────────────────

describe("humanizeSignal (copy.js)", () => {
  test("'dueToday:5' → '5 revisões para hoje'", () =>
    expect(humanizeSignal("dueToday:5")).toBe("5 revisões para hoje"));
  test("'dueToday:1' → '1 revisão para hoje' (singular)", () =>
    expect(humanizeSignal("dueToday:1")).toBe("1 revisão para hoje"));
  test("'overdue:3' → '3 atrasadas' (plural)", () =>
    expect(humanizeSignal("overdue:3")).toBe("3 atrasadas"));
  test("'overdue:1' → '1 atrasada' (singular)", () =>
    expect(humanizeSignal("overdue:1")).toBe("1 atrasada"));
  test("'minutes:45' → '~45 min estimados'", () =>
    expect(humanizeSignal("minutes:45")).toBe("~45 min estimados"));
  test("'track:r1' → 'Trilha R1'", () =>
    expect(humanizeSignal("track:r1")).toBe("Trilha R1"));
  test("'mentor-v2' (sem :) → null", () =>
    expect(humanizeSignal("mentor-v2")).toBeNull());
  test("'action:fila_do_dia' → null (token interno)", () =>
    expect(humanizeSignal("action:fila_do_dia")).toBeNull());
  test("string vazia → null", () =>
    expect(humanizeSignal("")).toBeNull());
  test("null → null", () =>
    expect(humanizeSignal(null)).toBeNull());
});
