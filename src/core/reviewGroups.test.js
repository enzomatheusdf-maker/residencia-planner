import { buildRev } from "./fsrs";
import {
  createGroup,
  deriveGroupReviewTask,
  propagateRating,
  validateGroup,
} from "./reviewGroups";

const TODAY = "2026-06-12";

function makeTema(id, overrides = {}) {
  return {
    id,
    nome: `Tema ${id}`,
    esp: "Clínica Médica",
    importancia: "ALTA",
    unstarted: false,
    rev: {
      ...buildRev(TODAY, "Clínica Médica"),
      d0: { date: TODAY, done: true, scheduledAt: TODAY },
      d1: { date: TODAY, done: false, scheduledAt: TODAY, phase: "learning" },
      d4: { date: "2026-06-16", done: false, scheduledAt: "2026-06-16", phase: "learning" },
      d7: { date: "2026-06-19", done: false, scheduledAt: "2026-06-19", phase: "learning" },
      d21: { date: "2026-07-03", done: false, scheduledAt: "2026-07-03", phase: "review" },
      manutencao: null,
      reviewHistory: [],
      phase: "learning",
      relearning: null,
      ...(overrides.rev || {}),
    },
    ...overrides,
  };
}

describe("reviewGroups", () => {
  test("validateGroup exige mesma plataforma, temas existentes e pelo menos 2 temas", () => {
    const temas = [makeTema("a"), makeTema("b")];

    expect(validateGroup(createGroup("res", { temaIds: ["a", "b"] }, TODAY), temas, "res").ok).toBe(true);
    expect(validateGroup(createGroup("res", { temaIds: ["a"] }, TODAY), temas, "res").errors).toContain("min_two_topics");
    expect(validateGroup(createGroup("res", { temaIds: ["a", "x"] }, TODAY), temas, "res").errors).toContain("missing_topics");
    expect(validateGroup(createGroup("res", { temaIds: ["a", "b"] }, TODAY), [makeTema("a"), makeTema("b", { plat: "vest" })], "res").errors).toContain("cross_platform_topics");
  });

  test("deriveGroupReviewTask escolhe a data real mais próxima sem projetar datas", () => {
    const temas = [
      makeTema("a", { rev: { d1: { date: "2026-06-15", done: false, scheduledAt: "2026-06-15" } } }),
      makeTema("b", { rev: { d1: { date: "2026-06-13", done: false, scheduledAt: "2026-06-13" } } }),
      makeTema("c", { rev: { d1: { date: "2026-06-20", done: false, scheduledAt: "2026-06-20" } } }),
    ];
    const group = createGroup("res", { id: "g1", nome: "Grupo de revisão", temaIds: ["a", "b", "c"] }, TODAY);

    const task = deriveGroupReviewTask(group, temas, TODAY);

    expect(task.type).toBe("group_review");
    expect(task.originalDate).toBe("2026-06-13");
    expect(task.subItems.map((item) => item.date)).toEqual(["2026-06-13", "2026-06-15", "2026-06-20"]);
  });

  test("propagateRating gera N recalculos e respeita override por sub-tema", () => {
    const temas = [makeTema("a"), makeTema("b"), makeTema("c")];
    const group = createGroup("res", { id: "g1", temaIds: ["a", "b", "c"] }, TODAY);

    const result = propagateRating(group, temas, 0.92, {
      today: TODAY,
      overrides: { b: { acerto: 0.4 } },
      desiredRetention: 0.9,
      maxInterval: 180,
    });

    expect(result.ok).toBe(true);
    expect(result.results).toHaveLength(3);
    expect(result.results.find((item) => item.temaId === "a").rating).toBe("easy");
    expect(result.results.find((item) => item.temaId === "b").rating).toBe("again");
    expect(result.results.find((item) => item.temaId === "c").rating).toBe("easy");
  });
});
