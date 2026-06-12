import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Minus,
  Plus,
  Save,
  Timer,
} from "lucide-react";
import { Badge, Button, Card, Dialog } from "./ui";
import {
  DOMAIN_TEST_BRAIN_DUMP_FIELDS,
  DOMAIN_TEST_CONDUTA_LABELS,
  DOMAIN_TEST_ERROR_TYPES,
  DOMAIN_TEST_FSRS_ENTRY_LABELS,
  DOMAIN_TEST_LIMITS,
  calculateBrainDumpScore,
  calculateQuestionPercent,
  classifyDomainTest,
  getDomainTestRecommendation,
  normalizeDomainTestErrorTypes,
  validateDomainTestInput,
} from "../core/domainTest";

const STEPS = [
  { key: "brain", label: "Brain Dump" },
  { key: "checklist", label: "Checklist" },
  { key: "questions", label: "Questões" },
  { key: "result", label: "Resultado" },
];

const FIELD_LABELS = {
  definitionDiagnosis: "Definição / diagnóstico",
  pathophysiology: "Fisiopatologia essencial",
  clinicalPicture: "Quadro clínico",
  redFlags: "Red flags",
  exams: "Exames",
  management: "Conduta",
  differentials: "Diferenciais",
  examTraps: "Pegadinhas de prova",
};

const ERROR_LABELS = {
  content: "Conteúdo",
  reasoning: "Raciocínio",
  interpretation: "Interpretação",
  distractor: "Distrator",
  careless: "Descuido",
  time: "Tempo",
  calibration: "Confiança/calibração",
  notSeen: "Tema não visto",
  irrelevantDetail: "Detalhe irrelevante",
};

const RESULT_META = {
  consolidated: {
    title: "Tema consolidado",
    tag: "Sólido",
    tone: "green",
    icon: CheckCircle2,
    border: "rgba(16,185,129,.35)",
  },
  rescue: {
    title: "Tema de resgate",
    tag: "Resgate",
    tone: "amber",
    icon: ClipboardList,
    border: "rgba(245,158,11,.35)",
  },
  treat_as_new: {
    title: "Tema novo",
    tag: "Novo",
    tone: "red",
    icon: AlertTriangle,
    border: "rgba(239,68,68,.35)",
  },
  fragile_base: {
    title: "Base frágil",
    tag: "Frágil",
    tone: "amber",
    icon: Brain,
    border: "rgba(245,158,11,.35)",
  },
  detail_noise: {
    title: "Detalhe irrelevante",
    tag: "Detalhe",
    tone: "blue",
    icon: FileText,
    border: "rgba(59,130,246,.35)",
  },
};

function emptyTextByField() {
  return DOMAIN_TEST_BRAIN_DUMP_FIELDS.reduce((acc, field) => {
    acc[field] = "";
    return acc;
  }, {});
}

function emptyChecklist() {
  return DOMAIN_TEST_BRAIN_DUMP_FIELDS.reduce((acc, field) => {
    acc[field] = 0;
    return acc;
  }, {});
}

function emptyErrorTypes() {
  return DOMAIN_TEST_ERROR_TYPES.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {});
}

function formatTimer(seconds) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
}

function makeDraftKey(tema, source) {
  const rawId = tema?.id || tema?.temaId || tema?.nome || tema?.name || "manual";
  return `medrev_domain_test_draft_${source}_${String(rawId)}`;
}

function normalizeInitialDraft(initialDraft) {
  return {
    textByField: {
      ...emptyTextByField(),
      ...(initialDraft?.brainDump?.textByField || initialDraft?.textByField || {}),
    },
    checklist: {
      ...emptyChecklist(),
      ...(initialDraft?.brainDump?.checklist || initialDraft?.checklist || {}),
    },
    questionBlock: {
      total: initialDraft?.questionBlock?.total ?? initialDraft?.total ?? DOMAIN_TEST_LIMITS.minQuestions,
      correct: initialDraft?.questionBlock?.correct ?? initialDraft?.correct ?? 0,
      errorTypes: {
        ...emptyErrorTypes(),
        ...(initialDraft?.questionBlock?.errorTypes || initialDraft?.errorTypes || {}),
      },
      notes: initialDraft?.questionBlock?.notes || initialDraft?.notes || "",
    },
    remainingSeconds: Number.isFinite(Number(initialDraft?.remainingSeconds))
      ? Number(initialDraft.remainingSeconds)
      : DOMAIN_TEST_LIMITS.brainDumpDurationSeconds,
  };
}

function StepButton({ active, done, disabled, index, label, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`med-button-reset med-focus-ring flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-lg border px-2 text-[10px] font-black transition-colors sm:min-h-[42px] sm:flex-row sm:gap-2 sm:px-3 sm:text-[11px] ${
        active
          ? "border-blue-400/50 bg-blue-500/15 text-blue-100"
          : done
            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
            : "border-white/10 bg-white/[.035] text-gray-400 hover:bg-white/[.07] hover:text-gray-200"
      } ${disabled ? "cursor-not-allowed opacity-45 hover:bg-white/[.035] hover:text-gray-400" : "cursor-pointer"}`}
    >
      <span
        aria-hidden="true"
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-black ${
          active
            ? "border-blue-300/60 bg-blue-500/30 text-white"
            : done
              ? "border-emerald-400/50 bg-emerald-500/25 text-emerald-100"
              : "border-white/15 bg-white/5 text-gray-500"
        }`}
      >
        {done ? <Check size={11} /> : index}
      </span>
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <label className="space-y-1">
      <span className="block text-[11px] font-black uppercase tracking-wide text-gray-400">{children}</span>
      {hint ? <span className="block text-[11px] leading-relaxed text-gray-500">{hint}</span> : null}
    </label>
  );
}

function NumberStepper({ ariaLabel, max, min = 0, onChange, value }) {
  const numericValue = Number(value) || 0;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Diminuir ${ariaLabel}`}
        onClick={() => onChange(clampNumber(numericValue - 1, min, max))}
        className="med-button-reset med-focus-ring grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
      >
        <Minus size={14} />
      </button>
      <input
        aria-label={ariaLabel}
        type="number"
        min={min}
        max={max}
        value={numericValue}
        onChange={(event) => onChange(clampNumber(event.target.value, min, max))}
        className="h-9 w-16 rounded-lg border border-white/10 bg-black/20 px-2 text-center text-sm font-black text-white outline-none focus:border-blue-400"
      />
      <button
        type="button"
        aria-label={`Aumentar ${ariaLabel}`}
        onClick={() => onChange(clampNumber(numericValue + 1, min, max))}
        className="med-button-reset med-focus-ring grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export default function DomainTestModal({
  open,
  tema = null,
  source = "manual",
  initialDraft = null,
  onApply,
  onClose,
  onSaveDraft,
}) {
  const draftKey = useMemo(() => makeDraftKey(tema, source), [source, tema]);
  const normalizedInitial = useMemo(() => normalizeInitialDraft(initialDraft), [initialDraft]);

  const [activeStep, setActiveStep] = useState("brain");
  const [textByField, setTextByField] = useState(normalizedInitial.textByField);
  const [checklist, setChecklist] = useState(normalizedInitial.checklist);
  const [questionBlock, setQuestionBlock] = useState(normalizedInitial.questionBlock);
  const [remainingSeconds, setRemainingSeconds] = useState(normalizedInitial.remainingSeconds);
  const [timerRunning, setTimerRunning] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [validation, setValidation] = useState(null);

  useEffect(() => {
    if (!open) return;

    let nextDraft = normalizedInitial;
    try {
      const saved = window.localStorage?.getItem(draftKey);
      if (saved) nextDraft = normalizeInitialDraft(JSON.parse(saved));
    } catch (_error) {
      nextDraft = normalizedInitial;
    }

    setActiveStep("brain");
    setTextByField(nextDraft.textByField);
    setChecklist(nextDraft.checklist);
    setQuestionBlock(nextDraft.questionBlock);
    setRemainingSeconds(nextDraft.remainingSeconds);
    setTimerRunning(true);
    setDraftStatus("");
    setValidation(null);
  }, [draftKey, normalizedInitial, open]);

  useEffect(() => {
    if (!open || activeStep !== "brain" || !timerRunning) return undefined;
    if (remainingSeconds <= 0) {
      setTimerRunning(false);
      return undefined;
    }

    const id = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [activeStep, open, remainingSeconds, timerRunning]);

  const brainDumpScore = useMemo(() => calculateBrainDumpScore(checklist), [checklist]);
  const questionPct = useMemo(() => {
    try {
      return calculateQuestionPercent(questionBlock.correct, questionBlock.total);
    } catch (_error) {
      return null;
    }
  }, [questionBlock.correct, questionBlock.total]);
  const normalizedErrorTypes = useMemo(
    () => normalizeDomainTestErrorTypes(questionBlock.errorTypes),
    [questionBlock.errorTypes]
  );
  const liveClassification = useMemo(() => {
    if (questionPct === null) return null;
    return classifyDomainTest({
      brainDumpScore,
      questionPct,
      errorTypes: normalizedErrorTypes,
    });
  }, [brainDumpScore, normalizedErrorTypes, questionPct]);
  const recommendation = liveClassification ? getDomainTestRecommendation(liveClassification) : null;

  const canOpenChecklist = activeStep !== "brain" || !timerRunning || remainingSeconds <= 0;
  const canOpenQuestions = canOpenChecklist;
  const canOpenResult = Boolean(validation?.valid);
  const activeStepIndex = STEPS.findIndex((step) => step.key === activeStep);
  const topicName = tema?.nome || tema?.name || tema?.titulo || "Tema antigo";

  function updateTextField(field, value) {
    setTextByField((current) => ({ ...current, [field]: value }));
  }

  function updateChecklist(field, value) {
    setChecklist((current) => ({ ...current, [field]: Number(value) }));
  }

  function updateQuestionField(field, value) {
    setQuestionBlock((current) => {
      const next = { ...current, [field]: value };
      if (field === "total") {
        next.correct = Math.min(Number(next.correct) || 0, Number(value) || 0);
      }
      return next;
    });
    setValidation(null);
  }

  function updateErrorType(type, value) {
    setQuestionBlock((current) => ({
      ...current,
      errorTypes: {
        ...current.errorTypes,
        [type]: Math.max(0, Number(value) || 0),
      },
    }));
    setValidation(null);
  }

  function buildDraft() {
    return {
      temaId: tema?.id || tema?.temaId || null,
      source,
      remainingSeconds,
      brainDump: {
        durationSeconds: DOMAIN_TEST_LIMITS.brainDumpDurationSeconds,
        textByField,
        checklist,
        score: brainDumpScore,
      },
      questionBlock: {
        ...questionBlock,
        percent: questionPct,
        errorTypes: normalizedErrorTypes,
      },
    };
  }

  function handleSaveDraft() {
    const draft = buildDraft();
    try {
      window.localStorage?.setItem(draftKey, JSON.stringify(draft));
      setDraftStatus("Rascunho salvo localmente.");
    } catch (_error) {
      setDraftStatus("Não foi possível salvar no armazenamento local.");
    }
    onSaveDraft?.(draft);
  }

  function handleFinishBrainDump() {
    setTimerRunning(false);
    setActiveStep("checklist");
  }

  function validateAndShowResult() {
    const result = validateDomainTestInput({
      brainDump: {
        textByField,
        checklist,
      },
      questionBlock,
    });
    setValidation(result);
    if (result.valid) setActiveStep("result");
  }

  function buildDomainTestRecord() {
    const checked = validation?.valid ? validation : validateDomainTestInput({ brainDump: { checklist }, questionBlock });
    const classification = checked.normalized.classification || liveClassification;
    const rec = getDomainTestRecommendation(classification);
    const now = new Date().toISOString();

    return {
      id: `domain_test_${Date.now()}`,
      temaId: tema?.id || tema?.temaId || null,
      createdAt: now,
      source,
      brainDump: {
        durationSeconds: DOMAIN_TEST_LIMITS.brainDumpDurationSeconds,
        textByField,
        checklist,
        score: brainDumpScore,
      },
      questionBlock: {
        total: Number(questionBlock.total),
        correct: Number(questionBlock.correct),
        percent: questionPct,
        errorTypes: normalizedErrorTypes,
        notes: String(questionBlock.notes || "").trim(),
      },
      classification: {
        label: rec.label,
        recommendedAction: rec.recommendedAction,
        fsrsEntry: rec.fsrsEntry,
      },
      recommendation: rec,
    };
  }

  function handleApply() {
    const result = validateDomainTestInput({
      brainDump: {
        textByField,
        checklist,
      },
      questionBlock,
    });
    setValidation(result);
    if (!result.valid) {
      setActiveStep("questions");
      return;
    }

    const record = buildDomainTestRecord();
    try {
      window.localStorage?.removeItem(draftKey);
    } catch (_error) {
      // localStorage cleanup is best effort.
    }
    onApply?.(record);
    onClose?.();
  }

  function setStep(key) {
    if (key === "checklist" && !canOpenChecklist) return;
    if (key === "questions" && !canOpenQuestions) return;
    if (key === "result" && !canOpenResult) return;
    setActiveStep(key);
  }

  function renderBrainStep() {
    return (
      <div className="space-y-4">
        <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between" style={{ padding: 16 }}>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-blue-300">Brain Dump — 8 minutos</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-300">
              Escreva sem olhar nada. O objetivo não é ficar bonito; é revelar o que sua memória consegue recuperar.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white">
            <Timer size={18} className="text-blue-300" />
            <span className="font-mono text-lg font-black tabular-nums">{formatTimer(remainingSeconds)}</span>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-2">
          {DOMAIN_TEST_BRAIN_DUMP_FIELDS.map((field) => (
            <div key={field} className="space-y-2">
              <FieldLabel>{FIELD_LABELS[field]}</FieldLabel>
              <textarea
                value={textByField[field]}
                onChange={(event) => updateTextField(field, event.target.value)}
                rows={4}
                className="min-h-[108px] w-full resize-y rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-relaxed text-white outline-none placeholder:text-gray-600 focus:border-blue-400"
                placeholder="Escreva de memória."
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderChecklistStep() {
    return (
      <div className="space-y-4">
        <Card style={{ padding: 16 }}>
          <p className="text-[11px] font-black uppercase tracking-wide text-blue-300">Autocorreção guiada</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-300">
            Compare seu Brain Dump com uma fonte confiável e marque cada eixo como ausente, parcial ou bom. Não há avaliação por IA.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={brainDumpScore >= 70 ? "green" : brainDumpScore >= 40 ? "amber" : "red"}>
              Brain Dump {brainDumpScore}%
            </Badge>
            <span className="text-[11px] text-gray-500">Bom ≥ 70 · Frágil 40–69 · Vazio/fraco &lt; 40</span>
          </div>
        </Card>

        <div className="grid gap-3">
          {DOMAIN_TEST_BRAIN_DUMP_FIELDS.map((field) => (
            <Card key={field} className="grid gap-3 md:grid-cols-[1fr_auto]" style={{ padding: 14 }}>
              <div>
                <p className="text-sm font-black text-white">{FIELD_LABELS[field]}</p>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-gray-500">
                  {textByField[field]?.trim() || "Sem texto registrado neste eixo."}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 0, label: "Ausente" },
                  { value: 1, label: "Parcial" },
                  { value: 2, label: "Bom" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={checklist[field] === option.value}
                    onClick={() => updateChecklist(field, option.value)}
                    className={`med-button-reset med-focus-ring min-h-[34px] rounded-lg border px-3 text-[11px] font-black ${
                      checklist[field] === option.value
                        ? "border-blue-400/50 bg-blue-500/15 text-blue-100"
                        : "border-white/10 bg-white/[.035] text-gray-400 hover:bg-white/[.07]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function renderQuestionsStep() {
    const fieldErrors = validation?.errors || [];

    return (
      <div className="space-y-4">
        <Card style={{ padding: 16 }}>
          <p className="text-[11px] font-black uppercase tracking-wide text-blue-300">Bloco diagnóstico — 20 a 30 questões</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-300">
            Não estude antes. O objetivo é diagnóstico, não performance.
          </p>
        </Card>

        <div className="grid gap-3 md:grid-cols-3">
          <Card style={{ padding: 14 }}>
            <FieldLabel hint="Válido de 20 a 30.">Número de questões</FieldLabel>
            <div className="mt-3">
              <NumberStepper
                ariaLabel="Número de questões"
                min={DOMAIN_TEST_LIMITS.minQuestions}
                max={DOMAIN_TEST_LIMITS.maxQuestions}
                value={questionBlock.total}
                onChange={(value) => updateQuestionField("total", value)}
              />
            </div>
          </Card>

          <Card style={{ padding: 14 }}>
            <FieldLabel hint="Não pode passar do total.">Número de acertos</FieldLabel>
            <div className="mt-3">
              <NumberStepper
                ariaLabel="Número de acertos"
                min={0}
                max={Number(questionBlock.total) || DOMAIN_TEST_LIMITS.maxQuestions}
                value={questionBlock.correct}
                onChange={(value) => updateQuestionField("correct", value)}
              />
            </div>
          </Card>

          <Card style={{ padding: 14 }}>
            <FieldLabel hint="Calculado automaticamente.">Percentual</FieldLabel>
            <div className="mt-3 text-3xl font-black text-white">{questionPct === null ? "--" : `${questionPct}%`}</div>
          </Card>
        </div>

        <Card style={{ padding: 16 }}>
          <FieldLabel hint="Conte os principais tipos de erro observados no bloco.">Tipos de erro</FieldLabel>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {DOMAIN_TEST_ERROR_TYPES.map((type) => (
              <div key={type} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 p-3">
                <span className="min-w-0 text-[12px] font-bold text-gray-300">{ERROR_LABELS[type]}</span>
                <NumberStepper
                  ariaLabel={ERROR_LABELS[type]}
                  min={0}
                  max={DOMAIN_TEST_LIMITS.maxQuestions}
                  value={normalizedErrorTypes[type]}
                  onChange={(value) => updateErrorType(type, value)}
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-2">
          <FieldLabel>Observação curta</FieldLabel>
          <textarea
            value={questionBlock.notes}
            onChange={(event) => updateQuestionField("notes", event.target.value)}
            rows={3}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-relaxed text-white outline-none placeholder:text-gray-600 focus:border-blue-400"
            placeholder="Ex.: errei conduta por confundir criterio de gravidade."
          />
        </div>

        {fieldErrors.length > 0 ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-[12px] font-black uppercase tracking-wide text-red-200">Corrija antes de classificar</p>
            <ul className="mt-2 space-y-1 text-[12px] text-red-100">
              {fieldErrors.map((error) => (
                <li key={`${error.field}-${error.code}`}>{error.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  function renderResultStep() {
    const meta = RESULT_META[recommendation?.label] || RESULT_META.treat_as_new;
    const ResultIcon = meta.icon;

    return (
      <div className="space-y-4">
        <Card
          className="space-y-4"
          style={{
            padding: 18,
            borderColor: meta.border,
            background: "linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.025)), var(--med-surface-0)",
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-white">
                <ResultIcon size={20} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-blue-300">Classificação automática</p>
                <h3 className="mt-1 text-xl font-black text-white">{meta.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">{recommendation?.message}</p>
              </div>
            </div>
            <Badge tone={meta.tone}>{meta.tag || recommendation?.label}</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/15 p-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">Brain Dump</p>
              <p className="mt-1 text-2xl font-black text-white">{brainDumpScore}%</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/15 p-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">Questões</p>
              <p className="mt-1 text-2xl font-black text-white">{questionPct ?? "--"}%</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/15 p-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">Entrada FSRS</p>
              <p className="mt-1 text-sm font-black text-white">{DOMAIN_TEST_FSRS_ENTRY_LABELS[recommendation?.fsrsEntry] || recommendation?.fsrsEntry}</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 16 }}>
          <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">Conduta</p>
          <p className="mt-1 text-sm font-black text-white">{DOMAIN_TEST_CONDUTA_LABELS[recommendation?.conduta] || recommendation?.conduta}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-gray-400">
            Ao aplicar a conduta, o DT3 vai usar esta classificação para decidir entre revisão leve, resgate, D0, revisão conceitual ou registro de padrão.
          </p>
        </Card>
      </div>
    );
  }

  const footer = (
    <div className="flex flex-col gap-3">
      {draftStatus ? <p className="text-[12px] font-semibold text-gray-400">{draftStatus}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="secondary" onClick={handleSaveDraft}>
          <Save size={15} />
          Salvar rascunho
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row">
          {activeStep !== "brain" ? (
            <Button
              variant="outline"
              onClick={() => {
                const index = STEPS.findIndex((step) => step.key === activeStep);
                setActiveStep(STEPS[Math.max(0, index - 1)].key);
              }}
            >
              <ChevronLeft size={15} />
              Voltar
            </Button>
          ) : null}

          {activeStep === "brain" ? (
            <Button onClick={handleFinishBrainDump}>
              Finalizar Brain Dump
              <ChevronRight size={15} />
            </Button>
          ) : null}

          {activeStep === "checklist" ? (
            <Button onClick={() => setActiveStep("questions")}>
              Ir para questões
              <ChevronRight size={15} />
            </Button>
          ) : null}

          {activeStep === "questions" ? (
            <Button onClick={validateAndShowResult}>
              Classificar tema
              <ChevronRight size={15} />
            </Button>
          ) : null}

          {activeStep === "result" ? (
            <Button variant="success" onClick={handleApply}>
              <CheckCircle2 size={15} />
              Aplicar conduta
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      wide
      mobileSheet
      formDirty
      title="Teste de Domínio"
      description={`Antes de marcar "${topicName}" como dominado, vamos testar se ele está realmente sólido.`}
      onClose={onClose}
      footer={footer}
      className="max-w-5xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((step, index) => (
            <StepButton
              key={step.key}
              index={index + 1}
              active={activeStep === step.key}
              done={index < activeStepIndex}
              disabled={
                (step.key === "checklist" && !canOpenChecklist) ||
                (step.key === "questions" && !canOpenQuestions) ||
                (step.key === "result" && !canOpenResult)
              }
              label={step.label}
              onClick={() => setStep(step.key)}
            />
          ))}
        </div>

        <AnimatePresence>
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, position: "absolute", width: "100%" }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeStep === "brain" ? renderBrainStep() : null}
            {activeStep === "checklist" ? renderChecklistStep() : null}
            {activeStep === "questions" ? renderQuestionsStep() : null}
            {activeStep === "result" ? renderResultStep() : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </Dialog>
  );
}
