// src/core/metricsRegistryCC7.test.js
// CC-7: testes do agregado de qualidade do Mentor e contratos de telemetria.
import {
  getMentorQualityAggregate,
  MENTOR_QUALITY_MIN_SAMPLE,
  getMetricDefinition,
  evaluateMetric,
  METRIC_STATUS,
} from "./metricsRegistry";
import { sanitizeTelemetryPayload } from "./telemetry";

const TODAY = "2026-06-12";
const YESTERDAY = "2026-06-11";
const TWO_DAYS_AGO = "2026-06-10";

function makeEvent(overrides = {}) {
  return {
    eventType: "seen",
    date: TODAY,
    plat: "res",
    action_type: "fila_do_dia",
    source: "mentor",
    seenAt: `${TODAY}T10:00:00.000Z`,
    ...overrides,
  };
}

// ─── Contratos de telemetria CC-7 ─────────────────────────────────────────────

describe("CC-7 — contratos de telemetria", () => {
  test("mentor_action_ignored sanitiza payload correto", () => {
    const payload = {
      plat: "res",
      action_type: "fila_do_dia",
      source: "mentor",
      hours_visible: 22,
    };
    const sanitized = sanitizeTelemetryPayload("mentor_action_ignored", payload);
    expect(sanitized.plat).toBe("res");
    expect(sanitized.action_type).toBe("fila_do_dia");
    expect(sanitized.source).toBe("mentor");
    expect(sanitized.hours_visible).toBe(22);
  });

  test("mentor_action_ignored rejeita chaves nao listadas", () => {
    const payload = {
      plat: "res",
      action_type: "fila_do_dia",
      source: "mentor",
      hours_visible: 8,
      campo_extra: "nao_deve_passar",
    };
    const sanitized = sanitizeTelemetryPayload("mentor_action_ignored", payload);
    expect(sanitized).not.toHaveProperty("campo_extra");
    expect(sanitized).toHaveProperty("hours_visible");
  });

  test("mentor_action_outcome sanitiza payload correto", () => {
    const payload = {
      plat: "res",
      action_type: "fila_do_dia",
      delta_metric: 5,
      window_days: 7,
    };
    const sanitized = sanitizeTelemetryPayload("mentor_action_outcome", payload);
    expect(sanitized.plat).toBe("res");
    expect(sanitized.action_type).toBe("fila_do_dia");
    expect(sanitized.window_days).toBe(7);
  });

  test("mentor_action_outcome aceita delta_metric null (best effort)", () => {
    const payload = {
      plat: "res",
      action_type: "fila_do_dia",
      delta_metric: null,
      window_days: 7,
    };
    const sanitized = sanitizeTelemetryPayload("mentor_action_outcome", payload);
    // null é sanitizado como undefined → omitido
    expect(sanitized).not.toHaveProperty("delta_metric");
    expect(sanitized).toHaveProperty("window_days");
  });
});

// ─── getMentorQualityAggregate — amostra mínima ───────────────────────────────

describe("getMentorQualityAggregate — regra de amostra mínima", () => {
  test("MENTOR_QUALITY_MIN_SAMPLE é 5", () => {
    expect(MENTOR_QUALITY_MIN_SAMPLE).toBe(5);
  });

  test("retorna collecting quando total < 5", () => {
    const events = [
      makeEvent({ eventType: "started" }),
      makeEvent({ eventType: "ignored", date: YESTERDAY }),
      makeEvent({ eventType: "started", date: TWO_DAYS_AGO }),
    ];
    const result = getMentorQualityAggregate(events, "res", 14);
    expect(result.status).toBe("collecting");
    expect(result.executionRate).toBeNull();
    expect(result.total).toBe(3);
  });

  test("retorna ok quando total >= 5", () => {
    const events = [
      makeEvent({ eventType: "started" }),
      makeEvent({ eventType: "started", date: YESTERDAY }),
      makeEvent({ eventType: "ignored", date: YESTERDAY }),
      makeEvent({ eventType: "started", date: TWO_DAYS_AGO }),
      makeEvent({ eventType: "ignored", date: TWO_DAYS_AGO }),
    ];
    const result = getMentorQualityAggregate(events, "res", 14);
    expect(result.status).toBe("ok");
    expect(result.executionRate).toBe(60); // 3/5 * 100
  });

  test("array vazio retorna collecting com total = 0", () => {
    const result = getMentorQualityAggregate([], "res", 14);
    expect(result.status).toBe("collecting");
    expect(result.total).toBe(0);
    expect(result.started).toBe(0);
    expect(result.ignored).toBe(0);
  });

  test("ignora eventos de outro plat", () => {
    const events = [
      makeEvent({ eventType: "started", plat: "vest" }),
      makeEvent({ eventType: "started", plat: "vest" }),
      makeEvent({ eventType: "started", plat: "vest" }),
      makeEvent({ eventType: "started", plat: "vest" }),
      makeEvent({ eventType: "started", plat: "vest" }),
    ];
    const result = getMentorQualityAggregate(events, "res", 14);
    expect(result.status).toBe("collecting");
    expect(result.total).toBe(0);
  });

  test("ignora eventos fora da janela de 14 dias", () => {
    const oldDate = "2026-05-01"; // > 14 dias atrás
    const events = [
      makeEvent({ eventType: "started", date: oldDate }),
      makeEvent({ eventType: "started", date: oldDate }),
      makeEvent({ eventType: "started", date: oldDate }),
      makeEvent({ eventType: "started", date: oldDate }),
      makeEvent({ eventType: "started", date: oldDate }),
    ];
    const result = getMentorQualityAggregate(events, "res", 14);
    expect(result.status).toBe("collecting");
    expect(result.total).toBe(0);
  });

  test("ignora eventos do tipo seen (não são started nem ignored)", () => {
    const events = Array.from({ length: 5 }, () => makeEvent({ eventType: "seen" }));
    const result = getMentorQualityAggregate(events, "res", 14);
    expect(result.status).toBe("collecting");
    expect(result.total).toBe(0);
  });

  test("calcula byType corretamente", () => {
    const events = [
      makeEvent({ eventType: "started", action_type: "fila_do_dia" }),
      makeEvent({ eventType: "started", action_type: "fila_do_dia" }),
      makeEvent({ eventType: "ignored", action_type: "fila_do_dia" }),
      makeEvent({ eventType: "started", action_type: "rest_or_light_day" }),
      makeEvent({ eventType: "ignored", action_type: "rest_or_light_day" }),
    ];
    const result = getMentorQualityAggregate(events, "res", 14);
    expect(result.status).toBe("ok");
    expect(result.byType["fila_do_dia"].started).toBe(2);
    expect(result.byType["fila_do_dia"].ignored).toBe(1);
    expect(result.byType["rest_or_light_day"].started).toBe(1);
    expect(result.byType["rest_or_light_day"].ignored).toBe(1);
  });

  test("executionRate é 100 quando todos iniciados", () => {
    const events = Array.from({ length: 5 }, () => makeEvent({ eventType: "started" }));
    const result = getMentorQualityAggregate(events, "res", 14);
    expect(result.status).toBe("ok");
    expect(result.executionRate).toBe(100);
  });

  test("executionRate é 0 quando todos ignorados", () => {
    const events = Array.from({ length: 5 }, () => makeEvent({ eventType: "ignored", date: YESTERDAY }));
    const result = getMentorQualityAggregate(events, "res", 14);
    expect(result.status).toBe("ok");
    expect(result.executionRate).toBe(0);
  });
});

// ─── Definição mentorQuality no registry ──────────────────────────────────────

describe("mentorQuality — definição no registry", () => {
  test("existe no registry com id correto", () => {
    const def = getMetricDefinition("mentorQuality");
    expect(def).not.toBeNull();
    expect(def.id).toBe("mentorQuality");
    expect(def.section).toBe("mentor");
    expect(def.platforms).toContain("res");
    expect(def.platforms).toContain("vest");
  });

  test("fica COLLECTING quando value é null", () => {
    const result = evaluateMetric("mentorQuality", null, { total: 0 });
    expect(result.status).toBe(METRIC_STATUS.COLLECTING);
  });

  test("fica LOW_CONFIDENCE quando total < 5", () => {
    const result = evaluateMetric("mentorQuality", 80, { total: 3 });
    expect(result.status).toBe(METRIC_STATUS.LOW_CONFIDENCE);
  });

  test("fica OK quando taxa >= 40 com amostra >= 5", () => {
    const result = evaluateMetric("mentorQuality", 60, { total: 10 });
    expect(result.status).toBe(METRIC_STATUS.OK);
  });

  test("fica WARNING quando taxa < 40", () => {
    const result = evaluateMetric("mentorQuality", 35, { total: 10 });
    expect(result.status).toBe(METRIC_STATUS.WARNING);
  });

  test("fica CRITICAL quando taxa < 20", () => {
    const result = evaluateMetric("mentorQuality", 15, { total: 10 });
    expect(result.status).toBe(METRIC_STATUS.CRITICAL);
  });
});

// ─── Rollover: lógica de detecção ────────────────────────────────────────────

describe("rollover detection — lógica pura", () => {
  function hasSeen(events, plat, date, action_type) {
    return events.some(
      (e) => e.eventType === "seen" && e.plat === plat && e.date === date && e.action_type === action_type
    );
  }
  function hasStarted(events, plat, date, action_type) {
    return events.some(
      (e) => e.eventType === "started" && e.plat === plat && e.date === date && e.action_type === action_type
    );
  }
  function hasIgnored(events, plat, date, action_type) {
    return events.some(
      (e) => e.eventType === "ignored" && e.plat === plat && e.date === date && e.action_type === action_type
    );
  }

  test("comando visto ontem sem started deve ser marcado como ignorado", () => {
    const events = [makeEvent({ eventType: "seen", date: YESTERDAY })];
    const today = TODAY;
    const seenOnPriorDays = events.filter(
      (e) => e.eventType === "seen" && e.plat === "res" && e.date < today
    );
    expect(seenOnPriorDays).toHaveLength(1);
    const toIgnore = seenOnPriorDays.filter((e) =>
      !hasStarted(events, e.plat, e.date, e.action_type) &&
      !hasIgnored(events, e.plat, e.date, e.action_type)
    );
    expect(toIgnore).toHaveLength(1);
  });

  test("comando visto ontem com started não deve ser marcado como ignorado", () => {
    const events = [
      makeEvent({ eventType: "seen", date: YESTERDAY }),
      makeEvent({ eventType: "started", date: YESTERDAY }),
    ];
    const today = TODAY;
    const seenOnPriorDays = events.filter(
      (e) => e.eventType === "seen" && e.plat === "res" && e.date < today
    );
    const toIgnore = seenOnPriorDays.filter((e) =>
      !hasStarted(events, e.plat, e.date, e.action_type) &&
      !hasIgnored(events, e.plat, e.date, e.action_type)
    );
    expect(toIgnore).toHaveLength(0);
  });

  test("não dispara ignored duas vezes (alreadyIgnored check)", () => {
    const events = [
      makeEvent({ eventType: "seen", date: YESTERDAY }),
      makeEvent({ eventType: "ignored", date: YESTERDAY }),
    ];
    const today = TODAY;
    const seenOnPriorDays = events.filter(
      (e) => e.eventType === "seen" && e.plat === "res" && e.date < today
    );
    const toIgnore = seenOnPriorDays.filter((e) =>
      !hasStarted(events, e.plat, e.date, e.action_type) &&
      !hasIgnored(events, e.plat, e.date, e.action_type)
    );
    expect(toIgnore).toHaveLength(0);
  });

  test("comando visto hoje não é candidate ao rollover", () => {
    const events = [makeEvent({ eventType: "seen", date: TODAY })];
    const today = TODAY;
    const seenOnPriorDays = events.filter(
      (e) => e.eventType === "seen" && e.plat === "res" && e.date < today
    );
    expect(seenOnPriorDays).toHaveLength(0);
  });

  test("seen e started em datas diferentes de action_type diferentes são independentes", () => {
    const events = [
      makeEvent({ eventType: "seen", date: YESTERDAY, action_type: "rest_or_light_day" }),
      makeEvent({ eventType: "started", date: YESTERDAY, action_type: "fila_do_dia" }), // outro tipo
    ];
    const today = TODAY;
    const seenOnPriorDays = events.filter(
      (e) => e.eventType === "seen" && e.plat === "res" && e.date < today
    );
    const toIgnore = seenOnPriorDays.filter((e) =>
      !hasStarted(events, e.plat, e.date, e.action_type) &&
      !hasIgnored(events, e.plat, e.date, e.action_type)
    );
    // rest_or_light_day foi visto mas não iniciado (o started foi para fila_do_dia)
    expect(toIgnore).toHaveLength(1);
    expect(toIgnore[0].action_type).toBe("rest_or_light_day");
  });
});
