import {
  collectSchedulerSignalsForMentor,
  auditMentorInputCompleteness,
  buildMentorAuditSnapshot,
} from "./mentorAuditReadiness";
import { todayStr, addDays } from "./fsrs";

describe("mentorAuditReadiness", () => {
  test("detects lack of reviewHistory and marks completeness as not ok", () => {
    const today = todayStr();
    const temas = [
      {
        id: 1,
        nome: "Tema A",
        esp: "GO",
        rev: {
          phase: "learning",
          d0: { done: true, date: addDays(today, -1), reviewedAt: null, acerto: null },
          d1: { done: false, date: today },
        },
      },
    ];

    const audit = auditMentorInputCompleteness({ temas });
    expect(audit.ok).toBe(false);
    expect(audit.missing).toContain("reviewHistory");
  });

  test("flags true retention as collecting when no D21+ evidence exists", () => {
    const today = todayStr();
    const temas = [
      {
        id: 1,
        nome: "Tema B",
        esp: "Cirurgia",
        rev: {
          phase: "learning",
          reviewHistory: [],
          d0: { done: true, date: addDays(today, -1), reviewedAt: addDays(today, -1), acerto: 0.8 },
          d1: { done: false, date: today },
        },
      },
    ];

    const signals = collectSchedulerSignalsForMentor({ temas });
    expect(signals.trueRetention.collecting).toBe(true);
  });

  test("computes overloadDays from minute-based workload", () => {
    const today = todayStr();
    const temas = Array.from({ length: 5 }).map((_, idx) => ({
      id: idx + 1,
      nome: `Tema ${idx + 1}`,
      esp: "Preventiva",
      rev: {
        phase: "review",
        reviewHistory: [],
        d21: { done: false, date: today, phase: "review" },
        d7: { done: true, date: addDays(today, -1), reviewedAt: addDays(today, -1), acerto: 0.9 },
      },
    }));

    const signals = collectSchedulerSignalsForMentor({ temas, horizonDays: 3 });
    expect(signals.workload.overloadDays).toBeGreaterThanOrEqual(1);
  });

  test("lists relearning count correctly", () => {
    const today = todayStr();
    const temas = [
      {
        id: 1,
        nome: "Tema C",
        esp: "Clínica Médica",
        rev: {
          phase: "relearning",
          relearning: { fromStep: "d21", targetStep: "d7", startedAt: today },
          reviewHistory: [],
          d7: { done: false, date: today },
        },
      },
    ];
    const signals = collectSchedulerSignalsForMentor({ temas });
    expect(signals.relearning.count).toBe(1);
  });

  test("buildMentorAuditSnapshot returns recommendations when overloaded", () => {
    const today = todayStr();
    const temas = Array.from({ length: 6 }).map((_, idx) => ({
      id: idx + 1,
      nome: `Tema ${idx + 1}`,
      esp: "GO",
      rev: {
        phase: idx === 0 ? "relearning" : "review",
        relearning: idx === 0 ? { fromStep: "d21", targetStep: "d7", startedAt: today } : null,
        reviewHistory: [{ stepKey: "d21", reviewedAt: addDays(today, -20), acerto: 0.8, questoes: 10, official: true }],
        d21: { done: false, date: today, phase: "review" },
        d7: { done: true, date: addDays(today, -1), reviewedAt: addDays(today, -1), acerto: 0.8 },
      },
    }));

    const snapshot = buildMentorAuditSnapshot({ temas });
    expect(snapshot.signals.workload.overloadDays).toBeGreaterThanOrEqual(1);
    expect(snapshot.completeness.recommendations.length).toBeGreaterThan(0);
  });
});
