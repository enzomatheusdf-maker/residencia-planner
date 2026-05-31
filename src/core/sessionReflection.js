function pad2(value) {
  return String(value).padStart(2, "0");
}

function toIsoDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function shiftDays(isoDate, days) {
  const base = isoDate ? new Date(`${isoDate}T12:00:00`) : new Date();
  base.setDate(base.getDate() + days);
  return toIsoDate(base);
}

function dominantKey(counter = {}) {
  return Object.entries(counter).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

const ALLOWED_OUTCOMES = new Set(["bom", "medio", "ruim"]);
const ALLOWED_ISSUES = new Set(["conteudo", "raciocinio", "tempo", "energia", "distracao", "nenhum", "memoria"]);
const ALLOWED_CONFIDENCE = new Set(["baixa", "media", "alta"]);
const ALLOWED_ADJUSTMENTS = new Set(["revisar", "questoes", "caso", "anki", "descanso", "manter"]);

export function suggestAdjustmentFromReflection(reflection = {}) {
  const mainIssue = reflection.mainIssue || "nenhum";
  const outcome = reflection.outcome || "medio";

  if (mainIssue === "energia") return "descanso";
  if (mainIssue === "raciocinio") return "caso";
  if (mainIssue === "tempo") return "questoes";
  if (mainIssue === "distracao") return "questoes";
  if (mainIssue === "conteudo" || mainIssue === "memoria") return "revisar";
  if (outcome === "bom") return "manter";
  return "revisar";
}

export function createSessionReflection(input = {}) {
  const outcome = ALLOWED_OUTCOMES.has(input.outcome) ? input.outcome : "medio";
  const mainIssue = ALLOWED_ISSUES.has(input.mainIssue) ? input.mainIssue : "nenhum";
  const confidence = ALLOWED_CONFIDENCE.has(input.confidence) ? input.confidence : "media";
  const rawAdjustment = input.nextAdjustment || suggestAdjustmentFromReflection({ ...input, outcome, mainIssue });
  const nextAdjustment = ALLOWED_ADJUSTMENTS.has(rawAdjustment) ? rawAdjustment : "revisar";
  const date = input.date || toIsoDate();
  const id = input.id || `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    id,
    date,
    source: input.source || "focus",
    tema: input.tema || "",
    area: input.area || "",
    outcome,
    mainIssue,
    confidence,
    nextAdjustment,
    note: String(input.note || "").trim(),
  };
}

export function summarizeReflections(reflections = [], days = 7, today = toIsoDate()) {
  const cutoff = shiftDays(today, -Math.max(0, days - 1));
  const recent = reflections.filter((item) => item && item.date && item.date >= cutoff && item.date <= today);

  const byOutcome = {};
  const byIssue = {};
  const byAdjustment = {};
  const byConfidence = {};

  for (const reflection of recent) {
    byOutcome[reflection.outcome] = (byOutcome[reflection.outcome] || 0) + 1;
    byIssue[reflection.mainIssue] = (byIssue[reflection.mainIssue] || 0) + 1;
    byAdjustment[reflection.nextAdjustment] = (byAdjustment[reflection.nextAdjustment] || 0) + 1;
    byConfidence[reflection.confidence] = (byConfidence[reflection.confidence] || 0) + 1;
  }

  return {
    total: recent.length,
    byOutcome,
    byIssue,
    byAdjustment,
    byConfidence,
    dominantIssue: dominantKey(byIssue),
    dominantAdjustment: dominantKey(byAdjustment),
    lowEnergyCount: byIssue.energia || 0,
  };
}

export function reflectionToAction(reflection = {}) {
  const normalized = createSessionReflection(reflection);
  const adjustment = normalized.nextAdjustment || suggestAdjustmentFromReflection(normalized);

  const actionTypeByAdjustment = {
    revisar: "review",
    questoes: "exam_analysis",
    caso: "clinical_case",
    anki: "anki",
    descanso: "rest",
    manter: "review",
  };

  const basePriority = normalized.outcome === "ruim" ? 92 : normalized.outcome === "medio" ? 78 : 64;
  const issueBonus = normalized.mainIssue === "energia" ? 20 : normalized.mainIssue === "raciocinio" ? 10 : 0;

  return {
    id: `act_ref_${normalized.id}`,
    type: actionTypeByAdjustment[adjustment] || "review",
    title: normalized.tema
      ? `${adjustment === "descanso" ? "Recuperar energia" : "Ajustar treino"}: ${normalized.tema}`
      : adjustment === "descanso"
      ? "Recuperar energia"
      : "Aplicar ajuste da sessao",
    reason:
      normalized.mainIssue === "nenhum"
        ? "Sessao registrada para manter consistencia."
        : `Fechamento indicou foco em ${normalized.mainIssue}.`,
    priority: basePriority + issueBonus,
    source: normalized.source || "focus",
    dueDate: normalized.date,
    target: {
      tema: normalized.tema || undefined,
      area: normalized.area || undefined,
      reflectionId: normalized.id,
    },
  };
}

export function buildWeeklyReview(context = {}) {
  const today = context.today || toIsoDate();
  const reflections = Array.isArray(context.reflections) ? context.reflections : [];
  const summary = summarizeReflections(reflections, 7, today);
  const actions = Array.isArray(context.actionInbox) ? context.actionInbox : [];

  const priorities = actions.slice(0, 3).map((action) => action.title);
  const newTopicAction = actions.find((action) => action.type === "new_topic");
  const criticalReviewAction = actions.find((action) => action.type === "review");
  const clinicalCaseAction = actions.find((action) => action.type === "clinical_case");

  return {
    id: context.id || `wr_${today}`,
    date: today,
    executed: {
      sessions: context.sessionsCompleted ?? summary.total,
      revisoes: context.revisoesDone ?? 0,
      casosClinicos: context.clinicalCases ?? 0,
      provasAnalisadas: context.examAnalyses ?? 0,
    },
    blocked: {
      cargaAlta: Boolean(context.highLoad),
      baixaEnergia: summary.lowEnergyCount > 0,
      errosRecorrentes: summary.dominantIssue || null,
      areaFraca: context.weakArea || null,
    },
    plan: {
      priorities,
      newTopic: newTopicAction?.title || null,
      criticalReview: criticalReviewAction?.title || null,
      clinicalCase: clinicalCaseAction?.title || null,
    },
    summary,
  };
}

