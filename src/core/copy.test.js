import fs from "fs";
import path from "path";
import { COPY, resolveViewCopy } from "./copy";

const FORBIDDEN_VISIBLE_COPY = [
  "Prontidão",
  "True Retention",
  "Modo Simples",
  "Analise ",
  "Acao ",
  "Nao ",
  "Voce ",
  "Faca ",
  "calendario",
  "validacao",
  "dominio",
];

describe("copy glossary", () => {
  test("exports key PT-BR labels", () => {
    expect(COPY.views.dash).toBe("Hoje");
    expect(COPY.views.crono).toBe("Plano");
    expect(COPY.metrics.readiness).toBe("Preparo estimado do plano");
    expect(COPY.metrics.trueRetention).toBe("Retenção longa");
    expect(COPY.actions.jaDomino).toBe("Já domino");
    expect(resolveViewCopy("sims")).toBe("Simulados");
  });

  test("forbidden visible copy is absent from primary UI files", () => {
    const files = [
      path.resolve(__dirname, "../components/ActionInbox.jsx"),
      path.resolve(__dirname, "../components/BottomNav.jsx"),
      path.resolve(__dirname, "../components/Sidebar.jsx"),
      path.resolve(__dirname, "../components/OnboardingWizard.jsx"),
    ];

    const offenders = [];
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, "utf8");
      FORBIDDEN_VISIBLE_COPY.forEach((term) => {
        if (content.includes(term)) {
          offenders.push(`${path.basename(filePath)}: ${term}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });

  test("readiness/copy validation for P0-E constraints", () => {
    const files = [
      path.resolve(__dirname, "../components/Dashboard.jsx"),
      path.resolve(__dirname, "../components/StatsPanel.jsx"),
      path.resolve(__dirname, "../components/ActionInbox.jsx"),
      path.resolve(__dirname, "../components/Sidebar.jsx"),
    ];

    const forbiddenP0ETerms = [
      "nota TRI estimada",
      "nota tri estimada",
      "probabilidade de aprovação",
      "probabilidade de aprovacao"
    ];

    const offenders = [];
    for (const filePath of files) {
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, "utf8");
      forbiddenP0ETerms.forEach((term) => {
        if (content.toLowerCase().includes(term.toLowerCase())) {
          offenders.push(`${path.basename(filePath)}: ${term}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});
