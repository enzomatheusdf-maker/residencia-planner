import { getRetencaoArea, recalcAfterMark, todayStr, toRating } from "./fsrs";

export const REVIEW_GROUP_STEP_ORDER = ["d1", "d4", "d7", "d21", "manutencao"];

function asId(value) {
  return String(value ?? "");
}

function uniqueIds(ids = []) {
  const seen = new Set();
  return ids.map(asId).filter((id) => {
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function normalizeOverride(overrides = {}, temaId, fallbackAcerto) {
  const raw = overrides?.[temaId] ?? overrides?.[asId(temaId)];
  if (raw == null) return fallbackAcerto;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim() !== "") return Number(raw);
  return raw.acerto ?? raw.rating ?? fallbackAcerto;
}

function isPendingStep(step = {}) {
  return Boolean(
    step
      && !step.done
      && !step.skipped
      && step.skipReason !== "dominio_previo"
      && !step.skippeadoPorDominio
      && step.date
  );
}

export function createGroup(plat, input = {}, createdAt = todayStr()) {
  const temaIds = uniqueIds(input.temaIds || []);
  const safeName = String(input.nome || "Grupo de revisão").trim() || "Grupo de revisão";
  return {
    id: input.id || `review_group_${plat}_${temaIds.join("_")}_${createdAt}`.replace(/[^a-zA-Z0-9_-]/g, "_"),
    plat,
    nome: safeName,
    temaIds,
    criadoEm: input.criadoEm || createdAt,
    anchorStrategy: "same_day",
  };
}

export function validateGroup(group = {}, temas = [], plat = group.plat) {
  const temaIds = uniqueIds(group.temaIds || []);
  const temaById = new Map((temas || []).map((tema) => [asId(tema.id), tema]));
  const errors = [];
  if (!plat) errors.push("plat_missing");
  if (temaIds.length < 2) errors.push("min_two_topics");
  const missingTemaIds = temaIds.filter((id) => !temaById.has(id));
  if (missingTemaIds.length) errors.push("missing_topics");
  const crossPlatTemaIds = temaIds.filter((id) => {
    const tema = temaById.get(id);
    return tema?.plat && tema.plat !== plat;
  });
  if (crossPlatTemaIds.length) errors.push("cross_platform_topics");

  return {
    ok: errors.length === 0,
    errors,
    temaIds,
    temas: temaIds.map((id) => temaById.get(id)).filter(Boolean),
    missingTemaIds,
    crossPlatTemaIds,
  };
}

export function getGroupForTema(reviewGroups = [], temaId) {
  const id = asId(temaId);
  return (reviewGroups || []).find((group) => (group.temaIds || []).map(asId).includes(id)) || null;
}

export function getNextGroupReviewForTema(tema = {}, today = todayStr()) {
  const rev = tema?.rev || {};
  const relearning = rev.relearning;
  if (relearning && !relearning.done && relearning.date) {
    return {
      temaId: tema.id,
      temaNome: tema.nome || "",
      area: tema.esp || tema.area || "Outro",
      stepKey: relearning.targetStep || "d1",
      phase: "relearning",
      date: relearning.date,
      overdue: relearning.date < today,
      source: "relearning",
    };
  }

  for (const stepKey of REVIEW_GROUP_STEP_ORDER) {
    const step = rev[stepKey];
    if (isPendingStep(step)) {
      return {
        temaId: tema.id,
        temaNome: tema.nome || "",
        area: tema.esp || tema.area || "Outro",
        stepKey,
        phase: step.phase || (stepKey === "manutencao" ? "maintenance" : "learning"),
        date: step.date,
        overdue: step.date < today,
        source: step.source || null,
      };
    }
    if (step && !step.done && !step.skipped && !step.skippeadoPorDominio) break;
  }

  return null;
}

export function deriveGroupReviewTask(group = {}, temas = [], today = todayStr()) {
  const validation = validateGroup(group, temas, group.plat);
  if (!validation.ok) return null;

  const subItems = validation.temas
    .map((tema) => getNextGroupReviewForTema(tema, today))
    .filter((item) => item?.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  if (subItems.length < 2) return null;
  const anchorDate = subItems[0].date;
  const overdue = anchorDate < today;
  const anchorDay = overdue ? today : anchorDate;
  const sameDateCount = subItems.filter((item) => item.date === anchorDate).length;
  const area = subItems[0]?.area || "Outro";
  const estimatedMinutes = subItems.reduce((sum, item) => {
    if (item.phase === "relearning") return sum + 20;
    if (item.stepKey === "d7") return sum + 30;
    if (item.stepKey === "d21") return sum + 35;
    if (item.stepKey === "manutencao") return sum + 25;
    return sum + 25;
  }, 0);

  return {
    id: `review-group-${group.id}-${anchorDate}`,
    type: "group_review",
    groupId: group.id,
    groupName: group.nome,
    temaNome: group.nome,
    area,
    stepKey: "group_review",
    phase: "group_review",
    date: anchorDay,
    originalDate: anchorDate,
    overdue,
    estimatedMinutes,
    priority: "ALTA",
    subItems,
    sameDateCount,
    target: {
      action: "group_review",
      route: "focus",
      params: { groupId: group.id, plat: group.plat },
    },
  };
}

export function collapseReviewItemsByGroups(items = [], reviewGroups = [], temas = [], today = todayStr(), horizonDate = "9999-12-31") {
  if (!Array.isArray(reviewGroups) || reviewGroups.length === 0) return items;

  const hiddenKeys = new Set();
  const groupTasks = [];
  reviewGroups.forEach((group) => {
    const task = deriveGroupReviewTask(group, temas, today);
    if (!task || task.originalDate > horizonDate) return;
    task.subItems.forEach((subItem) => hiddenKeys.add(`${asId(subItem.temaId)}:${subItem.stepKey}`));
    groupTasks.push(task);
  });

  if (!groupTasks.length) return items;
  const visibleItems = items.filter((item) => {
    if (!["review", "overdue", "relearning"].includes(item.type)) return true;
    return !hiddenKeys.has(`${asId(item.temaId)}:${item.stepKey}`);
  });
  return [...visibleItems, ...groupTasks];
}

export function propagateRating(group = {}, temas = [], acerto, options = {}) {
  const today = options.today || todayStr();
  const validation = validateGroup(group, temas, group.plat);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors, results: [] };
  }

  const results = validation.temas.map((tema) => {
    const next = getNextGroupReviewForTema(tema, today);
    if (!next?.stepKey) {
      return { ok: false, temaId: tema.id, error: "no_pending_review" };
    }

    const appliedAcerto = normalizeOverride(options.overrides || {}, tema.id, acerto);
    const currentStep = tema.rev?.[next.stepKey] || {};
    const revMarked = {
      ...tema.rev,
      meta: {
        ...(tema.rev?.meta || {}),
        importancia: tema.importancia,
      },
      [next.stepKey]: {
        ...currentStep,
        done: true,
        acerto: appliedAcerto,
        questoes: options.questoes ?? currentStep.questoes,
        reviewedAt: today,
        completedAt: today,
        scheduledAt: currentStep.scheduledAt || currentStep.date || today,
        motivosErro: options.motivosErro || [],
        erros: options.erros || [],
      },
    };

    const desiredRetention = typeof options.getDesiredRetention === "function"
      ? options.getDesiredRetention(tema)
      : getRetencaoArea(tema.esp, options.desiredRetention ?? 0.90);
    const maxInterval = options.maxInterval ?? 180;
    const shadowContext = typeof options.getShadowContext === "function"
      ? options.getShadowContext(tema)
      : { tema, history: options.history || [] };
    const nextRev = recalcAfterMark(revMarked, next.stepKey, appliedAcerto, desiredRetention, maxInterval, tema.esp, shadowContext);

    return {
      ok: true,
      temaId: tema.id,
      temaNome: tema.nome || "",
      area: tema.esp || tema.area || "Outro",
      stepKey: next.stepKey,
      acerto: appliedAcerto,
      rating: toRating(appliedAcerto),
      tema: { ...tema, rev: nextRev },
    };
  });

  return {
    ok: results.every((result) => result.ok),
    errors: results.filter((result) => !result.ok).map((result) => result.error),
    results,
  };
}
