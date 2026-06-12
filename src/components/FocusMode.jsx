import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Play, Pause, X, Brain, Plus, PenTool, Target, Layers, Zap, BookOpen, FileText } from "lucide-react";
import { useFilaInteligente } from "../hooks/useMetrics";
import { getStepDefinitions, getBrainDumpFields } from "../constants/stepDefinitions";
import { ESP_COLORS, DEMO_TEMA_ID } from "../core/fsrs";
import { useStore } from "../core/store";
import { TourBalloon, ProgressiveTooltip } from "./Primitives";
import { StructuredErrorsList } from "./Modals";
import DomainTestModal from "./DomainTestModal";
import SessionClosureModal from "./SessionClosureModal";
import { isTemaNaoIniciado } from "../core/domainValidation";
import { getMentorPhrase, getRecentPhrases, trackRecentPhrase, isExhaustionDetected } from "../core/mentor";
import { getFaseItem, todayStr, addDays, STEPS } from "../core/fsrs";
import { ERROR_TYPE, dominantErrorType } from "../core/errorTaxonomy";
import { createSessionReflection } from "../core/sessionReflection";
import ErrorActionPrompt from "./ErrorActionPrompt";
import ClinicalTaskPanel from "./ClinicalTaskPanel";
import { getReviewTaskForStep } from "../core/reviewTaskPlanner";
import { CLINICAL_CASES_INDEX } from "../constants/clinicalCasesIndex";
import { buildReviewPreview } from "../core/reviewOutcome";
import { buildInterleavingPlan } from "../core/interleavingPlanner";
import RetrievabilitySpark from "./RetrievabilitySpark";
import { getTemaStatsFromLearningEvents } from "../core/learningEvent";
import { deriveGroupReviewTask } from "../core/reviewGroups";

const STEP_ICONS = { pretest: FileText, leitura: BookOpen, esqueleto: Layers, braindump: Brain, questoes: PenTool, anki: Zap };

const getDemoItem = (plat, stepKey = "d0") => {
  const isVest = plat === "vest";
  const demoId = DEMO_TEMA_ID(plat);
  return {
    tema: {
      id: demoId,
      nome: isVest ? "Funções e Gráficos [DEMO]" : "Apendicite Aguda [DEMO]",
      esp: isVest ? "Matemática" : "Cirurgia",
      importancia: "ALTA",
      pico: "",
      ankiDeck: "",
      rev: {
        d0: { done: false, date: "2026-05-28" },
        d1: { done: false, date: "2026-05-29" },
        d4: { done: false, date: "2026-06-01" },
        d7: { done: false, date: "2026-06-04" },
        d21: { done: false, date: "2026-06-18" }
      }
    },
    stepKey
  };
};

export default function FocusMode({ onExit, plat, temas, onCompleteStep, targetedItem }) {
  const tourStep = useStore((s) => s.tourStep);
  const userName = useStore((s) => s.userName);
  const meta = useStore((s) => s.meta);
  
  // 1. SELECT TARGET THEME & STEP
  const intelligentQueue = useFilaInteligente(temas);
  const updateTema = useStore((s) => s.updateTema);
  const aplicarDomainTestResultado = useStore((s) => s.aplicarDomainTestResultado);
  const showToast = useStore((s) => s.showToast);
  const reviewGroups = useStore((s) => s.reviewGroups?.[plat] || []);
  const markGroupReview = useStore((s) => s.markGroupReview);
  const updateGamifStreak = useStore((s) => s.updateGamifStreak);
  const learningEvents = useStore((s) => s.learningEvents || []);
  const legacyTemaStats = useStore((s) => s.temaStats || {});
  const temaStats = useMemo(
    () => getTemaStatsFromLearningEvents(learningEvents, { plat, fallbackTemaStats: legacyTemaStats }),
    [learningEvents, plat, legacyTemaStats]
  );
  const addSessionReflection = useStore((s) => s.addSessionReflection);
  const rebuildActionInboxForToday = useStore((s) => s.rebuildActionInboxForToday);
  const casosProgresso = useStore((s) => s[plat]?.casosProgresso || {});

  const doneReviews = useMemo(() => {
    return temas.flatMap((t) => STEPS.map((s) => t.rev[s.key])).filter(r => r && r.done);
  }, [temas]);

  const exhaustionDetected = useMemo(() => {
    return isExhaustionDetected(temaStats, doneReviews);
  }, [temaStats, doneReviews]);

  const [exhaustionConfirmed, setExhaustionConfirmed] = useState(false);
  const [modoReduzidoAtivo, setModoReduzidoAtivo] = useState(false);

  const nRevisoes = useMemo(() => {
    return intelligentQueue.filter(item => item.stepKey !== "d0").length;
  }, [intelligentQueue]);

  const [completedInSession, setCompletedInSession] = useState(0);
  const [initialQueueLength, setInitialQueueLength] = useState(0);

  useEffect(() => {
    if (intelligentQueue.length > 0 && initialQueueLength === 0) {
      setInitialQueueLength(intelligentQueue.length);
    }
  }, [intelligentQueue, initialQueueLength]);

  const [currentTarget, setCurrentTarget] = useState(targetedItem);

  useEffect(() => {
    setCurrentTarget(targetedItem);
  }, [targetedItem]);

  const activeGroupTask = useMemo(() => {
    if (!currentTarget?.groupId) return null;
    const group = reviewGroups.find((item) => item.id === currentTarget.groupId);
    if (!group) return null;
    return deriveGroupReviewTask(group, temas, todayStr());
  }, [currentTarget, reviewGroups, temas]);

  const activeReviewItem = useMemo(() => {
    if (tourStep === "focus") {
      return getDemoItem(plat, "d0");
    }
    if (activeGroupTask) {
      return { groupTask: activeGroupTask, stepKey: "group_review" };
    }
    if (currentTarget) {
      const t = temas.find(x => x.id === currentTarget.temaId);
      if (t) return { tema: t, stepKey: currentTarget.stepKey };
      if (String(currentTarget.temaId).startsWith("demo-")) {
        return getDemoItem(plat, currentTarget.stepKey || "d0");
      }
      console.warn("FocusMode: targetedItem sem tema correspondente", currentTarget);
    }
    const savedSession = meta?.activeFocusSession;
    if (savedSession?.temaId && savedSession?.stepKey && (!savedSession.plat || savedSession.plat === plat)) {
      const savedTema = temas.find(x => String(x.id) === String(savedSession.temaId));
      const savedStep = savedTema?.rev?.[savedSession.stepKey];
      if (savedTema && savedStep && !savedStep.done && !savedStep.skipped && !savedStep.skippeadoPorDominio) {
        const stillQueued = intelligentQueue.some((item) => (
          String(item.temaId) === String(savedTema.id) && item.stepKey === savedSession.stepKey
        ));
        if (stillQueued) return { tema: savedTema, stepKey: savedSession.stepKey };
      }
    }
    if (intelligentQueue.length > 0) {
      const top = intelligentQueue[0];
      const t = temas.find(x => x.id === top.temaId);
      if (t) return { tema: t, stepKey: top.stepKey };
    }
    return null;
  }, [activeGroupTask, currentTarget, intelligentQueue, meta?.activeFocusSession, temas, tourStep, plat]);

  const activeReviewItemThemeId = activeReviewItem?.tema?.id;
  const activeReviewItemStepKey = activeReviewItem?.stepKey;

  useEffect(() => {
    if (activeReviewItemThemeId && activeReviewItemStepKey) {
      useStore.setState((state) => ({
        meta: {
          ...state.meta,
          lastFocusSessionAt: new Date().toISOString(),
          lastFocusThemeId: activeReviewItemThemeId,
          lastFocusStepKey: activeReviewItemStepKey,
        },
      }));
    }
  }, [activeReviewItemThemeId, activeReviewItemStepKey]);

  const tema = activeReviewItem?.tema;
  const stepKey = activeReviewItem?.stepKey;
  const groupTask = activeReviewItem?.groupTask || null;

  // P4-C: tarefa clinica multimodal para o step atual (res only, gated por modulo)
  const clinicalTask = useMemo(() => {
    if (!tema || !stepKey || plat !== "res") return null;
    return getReviewTaskForStep({
      tema,
      stepKey,
      casos: CLINICAL_CASES_INDEX,
      progresso: casosProgresso,
      plat,
      modulos: meta?.modulos,
    });
  }, [tema, stepKey, plat, casosProgresso, meta?.modulos]);

  const fase = useMemo(() => {
    if (!tema || !stepKey) return null;
    return getFaseItem(tema, stepKey);
  }, [tema, stepKey]);

  const mentorPhrase = useMemo(() => {
    if (!stepKey || stepKey === "d0") return null;
    const situation = modoReduzidoAtivo ? "modo_reduzido_recuperacao" : `etapa_${stepKey}`;
    const recent = getRecentPhrases();
    const { text, id } = getMentorPhrase(situation, { userName: userName || "Estudante", tema: tema?.nome || "" }, recent, plat, meta?.tomMentor || "gentil");
    if (id) {
      trackRecentPhrase(id);
    }
    return text;
  }, [stepKey, tema, plat, userName, meta?.tomMentor, modoReduzidoAtivo]);

  // Dynamic step definitions based on platform and area
  const stepDefs = useMemo(() => getStepDefinitions(plat, tema?.esp), [plat, tema?.esp]);
  const brainDumpFields = useMemo(() => getBrainDumpFields(plat, tema?.esp), [plat, tema?.esp]);

  const platformName = useStore((s) => s.meta?.plataformaQuestoes) || (plat === "res" ? "MedEvo" : "Estuda Mais");

  const formatTextWithPlatform = useCallback((text) => {
    if (!text) return "";
    return text.replace(/MedEvo/g, platformName);
  }, [platformName]);

  const [showTransitionScreen, setShowTransitionScreen] = useState(false);
  const [lastCompletedItem, setLastCompletedItem] = useState(null);
  const [lastDominantError, setLastDominantError] = useState(null);
  const [showSessionClosure, setShowSessionClosure] = useState(false);
  const [closureDraft, setClosureDraft] = useState(null);

  const isModoProva = useMemo(() => {
    return plat === "vest" && tema && tema.nome.toLowerCase().includes("simulado");
  }, [plat, tema]);

  const inferOutcome = useCallback((markData = {}) => {
    const score = typeof markData.acerto === "number" ? markData.acerto : null;
    if (score == null) return "medio";
    if (score >= 0.8) return "bom";
    if (score < 0.6) return "ruim";
    return "medio";
  }, []);

  const inferMainIssue = useCallback((markData = {}) => {
    const dominant = dominantErrorType(markData.erros || []);
    if (dominant === ERROR_TYPE.CONTENT || dominant === ERROR_TYPE.MEMORY) return "conteudo";
    // Raciocinio clinico: inclui os 5 novos tipos de P3-A
    if (
      dominant === ERROR_TYPE.REASONING ||
      dominant === ERROR_TYPE.PROBLEM_REPRESENTATION ||
      dominant === ERROR_TYPE.DIFFERENTIAL ||
      dominant === ERROR_TYPE.SCT_UNCERTAINTY ||
      dominant === ERROR_TYPE.MANAGEMENT
    ) return "raciocinio";
    if (dominant === ERROR_TYPE.INTERPRETATION || dominant === ERROR_TYPE.DISTRACTION) return "distracao";
    if (dominant === ERROR_TYPE.TIME || dominant === ERROR_TYPE.EXAM_STRATEGY) return "tempo";
    if (String(markData.cansaco || "").toLowerCase().startsWith("alt")) return "energia";
    return "nenhum";
  }, []);

  const inferNextAdjustment = useCallback((mainIssue, outcome) => {
    if (mainIssue === "energia") return "descanso";
    if (mainIssue === "raciocinio") return "caso";
    if (mainIssue === "tempo") return "questoes";
    if (mainIssue === "conteudo") return "revisar";
    if (outcome === "bom") return "manter";
    return "revisar";
  }, []);

  const persistSessionClosure = useCallback((payload = {}) => {
    if (!addSessionReflection) return;
    const reflection = createSessionReflection(payload);
    addSessionReflection(reflection);
    if (rebuildActionInboxForToday) rebuildActionInboxForToday();
    if (showToast) showToast("Fechamento salvo e adicionado na Caixa de Acoes.");
  }, [addSessionReflection, rebuildActionInboxForToday, showToast]);

  const handleStepSuccess = (temaId, stepKey, markData) => {
    const currentTemaName = tema?.nome || "Tema";
    const currentStepLabel = stepKey.toUpperCase();
    const completedAt = new Date().toISOString();
    
    onCompleteStep(temaId, stepKey, markData);
    useStore.setState((state) => ({
      meta: {
        ...state.meta,
        lastFocusSessionAt: completedAt,
        lastFocusThemeId: temaId,
        lastFocusStepKey: stepKey,
        lastCompletedFocusSessionAt: completedAt,
        lastCompletedFocusThemeId: temaId,
        lastCompletedFocusStepKey: stepKey,
        activeFocusSession: null,
      },
    }));
    
    setCompletedInSession(prev => prev + 1);
    setLastCompletedItem({
      nome: currentTemaName,
      stepLabel: currentStepLabel,
      id: temaId,
      esp: tema?.esp,
      c1: markData.c1,
      c2: markData.c2,
      c3: markData.c3,
      c4: markData.c4,
      c5: markData.c5
    });
    const outcome = inferOutcome(markData);
    const mainIssue = inferMainIssue(markData);
    const nextAdjustment = inferNextAdjustment(mainIssue, outcome);
    const confidenceRaw = String(markData.confianca || confianca || "media").toLowerCase();
    const confidence = confidenceRaw.startsWith("alt") ? "alta" : confidenceRaw.startsWith("baix") ? "baixa" : "media";
    // Captura erro dominante para exibir apos fechamento
    const stepErrors = Array.isArray(markData.erros) ? markData.erros : [];
    const stepDominant = dominantErrorType(stepErrors);
    setLastDominantError(stepDominant || null);
    setClosureDraft({
      source: "focus",
      tema: currentTemaName,
      area: tema?.esp || "",
      outcome,
      mainIssue,
      confidence,
      nextAdjustment,
    });
    setShowSessionClosure(true);
    
    resetSessionStates();
  };

  // States
  const [startedD0, setStartedD0] = useState(false);
  const [d0StepIdx, setD0StepIdx] = useState(0);
  const [expandedJustification, setExpandedJustification] = useState(false);
  const [showFocusBalloon, setShowFocusBalloon] = useState(true);
  const [showD0StatsForm, setShowD0StatsForm] = useState(false);
  const [temaValidando, setTemaValidando] = useState(null);

  // Sprint 4: Metacognitive D1 and two-layer completion states
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const [showSelfEvalD1, setShowSelfEvalD1] = useState(false);
  const [d1ForgotFields, setD1ForgotFields] = useState({});
  const [groupOverrideOpen, setGroupOverrideOpen] = useState(false);
  const [groupOverrides, setGroupOverrides] = useState({});
  const [comoFoi, setComoFoi] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [ansiedade, setAnsiedade] = useState("Normal");
  const [cansaco, setCansaco] = useState("Normal");
  const [confianca, setConfianca] = useState("Média");
  const [foco, setFoco] = useState("Normal");
  const sugerirDetalhes = useMemo(() => Math.random() < 0.25, []);

  useEffect(() => {
    setStepStartTime(Date.now());
  }, [activeReviewItem, stepKey, startedD0, d0StepIdx]);

  // D0 Prep state
  const [pico, setPico] = useState(tema?.pico || "");
  const [ankiDeck, setAnkiDeck] = useState(tema?.ankiDeck || "");

  // D1 state — dynamic fields, keyed by field.k
  const [d1Fields, setD1Fields] = useState({});

  // D4/D7/D21 + D0 stats state
  const [questoes, setQuestoes] = useState("");
  const [acertos, setAcertos] = useState("");
  const [previsao, setPrevisao] = useState("");
  const [clinicalSelfScore, setClinicalSelfScore] = useState(null);
  const [revelado, setRevelado] = useState(false);
  const [c1, setC1] = useState(160);
  const [c2, setC2] = useState(160);
  const [c3, setC3] = useState(160);
  const [c4, setC4] = useState(160);
  const [c5, setC5] = useState(160);
  const [erros, setErros] = useState([]);
  const [interleaved, setInterleaved] = useState(false);

  const interleavingPlan = useMemo(() => {
    return buildInterleavingPlan({
      tema,
      temas,
      stepKey,
      platKey: plat,
    });
  }, [tema, temas, stepKey, plat]);

  const canInterleave = !!interleavingPlan?.shouldRecommend;
  const canShowJaDomino = useMemo(() => {
    const status = tema?.dominioPrevio?.status;
    if (!tema) return false;
    if (tourStep === "focus") return false;
    if (!isTemaNaoIniciado(tema)) return false;
    return !["validacao_pendente", "validado_previo", "reprovado"].includes(status);
  }, [tema, tourStep]);

  // Derived accuracy
  const totalQuestoes = +questoes || 0;
  const acertosRaw = +acertos || 0;
  const certasQuestoes = Math.min(acertosRaw, totalQuestoes);
  const pct = totalQuestoes > 0 ? Math.round((certasQuestoes / totalQuestoes) * 100) : null;
  const hasValidQuestionResult = totalQuestoes > 0 && acertos !== "" && acertosRaw >= 0 && acertosRaw <= totalQuestoes;
  const canCompleteQuestionStep = tema?.esp === "Redação" || hasValidQuestionResult;
  const reviewAcertoFinal = useMemo(() => {
    if (tema?.esp === "Redação") return null;
    const accQuestoes = pct != null ? pct / 100 : null;
    const accClinico = clinicalSelfScore != null ? clinicalSelfScore / 100 : null;
    if (accQuestoes != null && accClinico != null) {
      return +(accQuestoes * 0.7 + accClinico * 0.3).toFixed(3);
    }
    return accQuestoes != null ? accQuestoes : accClinico;
  }, [clinicalSelfScore, pct, tema?.esp]);
  const schedulerPreview = useMemo(
    () => (groupTask ? null : buildReviewPreview({ tema, stepKey, acerto: reviewAcertoFinal, meta })),
    [groupTask, meta, reviewAcertoFinal, stepKey, tema]
  );

  // TIMER
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const timerRef = useRef(null);

  // Load target duration based on step/substep
  useEffect(() => {
    if (!activeReviewItem) return;

    const isDemo = tourStep === "focus";

    if (stepKey === "d0") {
      if (!startedD0) {
        setSecondsLeft(0);
      } else {
        const durationMin = isDemo ? 0 : (stepDefs[d0StepIdx]?.duration || 10);
        setSecondsLeft(durationMin * 60);
      }
    } else if (stepKey === "d1") {
      setSecondsLeft(isDemo ? 0 : 5 * 60);
    } else {
      setSecondsLeft(isDemo ? 0 : 25 * 60);
    }
    setTimerActive(true);
  }, [activeReviewItem, stepKey, startedD0, d0StepIdx, tourStep, stepDefs]);

  // Sync PICO/Anki state
  useEffect(() => {
    if (tema) {
      setPico(tema.pico || "");
      setAnkiDeck(tema.ankiDeck || "");
    }
  }, [tema]);

  // Auto-start D0 when running the demo tour to avoid the demo getting "stuck"
  useEffect(() => {
    if (tourStep === "focus") {
      setStartedD0(true);
    }
  }, [tourStep]);

  // TIMER interval loop
  useEffect(() => {
    if (timerActive && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(s => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && timerActive) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, secondsLeft]);

  const formatTimer = () => {
    const isNegative = secondsLeft < 0;
    const absSeconds = Math.abs(secondsLeft);
    const m = Math.floor(absSeconds / 60);
    const s = absSeconds % 60;
    return `${isNegative ? "-" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const extendTimer = () => {
    setSecondsLeft(prev => prev + 5 * 60);
  };

  // LOGGERS & COMPLETE HANDLERS
  const handleCompleteD0Step = () => {
    const isLastD0Substep = d0StepIdx === stepDefs.length - 1;
    if (!isLastD0Substep) {
      setD0StepIdx(prev => prev + 1);
      setExpandedJustification(false);
    } else {
      if (tourStep === "focus") {
        useStore.getState().setTourStep("dash");
        onExit();
        return;
      }
      setShowD0StatsForm(true);
    }
  };

  const handleBackD0Step = () => {
    if (d0StepIdx > 0) {
      setD0StepIdx(prev => prev - 1);
      setExpandedJustification(false);
    }
  };

  const handleCompleteD1 = () => {
    setShowSelfEvalD1(true);
  };

  const handleCompleteReview = () => {
    const elapsedMin = Math.max(1, Math.round((Date.now() - stepStartTime) / 60000));
    if (tema?.esp === "Redação") {
      const sum = (+c1) + (+c2) + (+c3) + (+c4) + (+c5);
      handleStepSuccess(tema.id, stepKey, {
        acerto: sum / 1000,
        questoes: 5,
        c1: +c1,
        c2: +c2,
        c3: +c3,
        c4: +c4,
        c5: +c5,
        interleaved: interleaved,
        interleavingPlan: interleavingPlan,
        interleavingStatus: interleavingPlan?.status || null,
        tempoMin: elapsedMin,
        ansiedade,
        cansaco,
        confianca,
        foco,
        modoReduzido: modoReduzidoAtivo
      });
    } else {
      const showErroBox = pct != null && pct < 75;
      handleStepSuccess(tema.id, stepKey, {
        acerto: reviewAcertoFinal,
        previsao: previsao !== "" ? (+previsao) / 100 : null,
        questoes: totalQuestoes || null,
        motivosErro: showErroBox ? erros.map(e => e.tipoErro) : [],
        erros: showErroBox ? erros : [],
        interleaved: interleaved,
        interleavingPlan: interleavingPlan,
        interleavingStatus: interleavingPlan?.status || null,
        tempoMin: elapsedMin,
        ansiedade,
        cansaco,
        confianca,
        foco,
        modoReduzido: modoReduzidoAtivo
      });
    }
  };

  const handleCompleteGroupReview = () => {
    if (!groupTask?.groupId || pct == null) return;
    const elapsedMin = Math.max(1, Math.round((Date.now() - stepStartTime) / 60000));
    const overrides = Object.fromEntries(
      Object.entries(groupOverrides)
        .map(([temaId, value]) => [temaId, Number(value)])
        .filter(([, value]) => Number.isFinite(value))
        .map(([temaId, value]) => [temaId, { acerto: Math.max(0, Math.min(1, value / 100)) }])
    );
    const result = markGroupReview(plat, groupTask.groupId, {
      acerto: reviewAcertoFinal,
      questoes: totalQuestoes || null,
      overrides,
      tempoMin: elapsedMin,
      ansiedade,
      cansaco,
      confianca,
      foco,
    });
    if (showToast) {
      showToast(result?.ok ? "Grupo de revisão registrado." : "Não foi possível registrar o grupo de revisão.");
    }
    if (result?.ok) {
      setGroupOverrides({});
      setGroupOverrideOpen(false);
      onExit();
    }
  };

  const resetSessionStates = () => {
    setStartedD0(false);
    setD0StepIdx(0);
    setD1Fields({});
    setQuestoes("");
    setAcertos("");
    setPrevisao("");
    setClinicalSelfScore(null);
    setRevelado(false);
    setErros([]);
    setInterleaved(false);
    setComoFoi(null);
    setShowDetails(false);
    setAnsiedade("Normal");
    setCansaco("Normal");
    setConfianca("Média");
    setFoco("Normal");
    setShowSelfEvalD1(false);
    setD1ForgotFields({});
    setExpandedJustification(false);
    setShowD0StatsForm(false);
    setC1(160);
    setC2(160);
    setC3(160);
    setC4(160);
    setC5(160);
    setModoReduzidoAtivo(false);
    setExhaustionConfirmed(false);
  };

  const focusSessionKey = tema?.id && stepKey ? `${plat}:${tema.id}:${stepKey}` : "";
  const savedFocusSession = meta?.activeFocusSession || null;
  const hydratedFocusTargetRef = useRef("");
  const skipNextFocusPersistRef = useRef(false);
  const currentStepRecord = tema?.rev?.[stepKey] || {};
  const canPersistActiveFocusSession =
    !!focusSessionKey &&
    tourStep !== "focus" &&
    !currentStepRecord.done &&
    !currentStepRecord.skipped &&
    !currentStepRecord.skippeadoPorDominio;

  useEffect(() => {
    if (!focusSessionKey || tourStep === "focus") return;
    if (hydratedFocusTargetRef.current === focusSessionKey) return;

    const savedKey = savedFocusSession?.temaId && savedFocusSession?.stepKey
      ? `${savedFocusSession.plat || plat}:${savedFocusSession.temaId}:${savedFocusSession.stepKey}`
      : "";
    const matchesSavedSession = savedKey === focusSessionKey;
    skipNextFocusPersistRef.current = matchesSavedSession;

    if (matchesSavedSession) {
      const safeD0StepIdx = Math.min(
        Math.max(Number(savedFocusSession.d0StepIdx) || 0, 0),
        Math.max(stepDefs.length - 1, 0)
      );
      setStartedD0(!!savedFocusSession.startedD0);
      setD0StepIdx(safeD0StepIdx);
      setExpandedJustification(!!savedFocusSession.expandedJustification);
      setShowD0StatsForm(!!savedFocusSession.showD0StatsForm);
      setShowSelfEvalD1(!!savedFocusSession.showSelfEvalD1);
      setD1Fields(savedFocusSession.d1Fields && typeof savedFocusSession.d1Fields === "object" ? savedFocusSession.d1Fields : {});
      setD1ForgotFields(savedFocusSession.d1ForgotFields && typeof savedFocusSession.d1ForgotFields === "object" ? savedFocusSession.d1ForgotFields : {});
      setQuestoes(savedFocusSession.questoes ?? "");
      setAcertos(savedFocusSession.acertos ?? "");
      setPrevisao(savedFocusSession.previsao ?? "");
      setClinicalSelfScore(savedFocusSession.clinicalSelfScore ?? null);
      setRevelado(!!savedFocusSession.revelado);
      setErros(Array.isArray(savedFocusSession.erros) ? savedFocusSession.erros : []);
      setInterleaved(!!savedFocusSession.interleaved);
      setComoFoi(savedFocusSession.comoFoi ?? null);
      setShowDetails(!!savedFocusSession.showDetails);
      setAnsiedade(savedFocusSession.ansiedade || "Normal");
      setCansaco(savedFocusSession.cansaco || "Normal");
      setConfianca(savedFocusSession.confianca || "Média");
      setFoco(savedFocusSession.foco || "Normal");
      setC1(Number.isFinite(Number(savedFocusSession.c1)) ? Number(savedFocusSession.c1) : 160);
      setC2(Number.isFinite(Number(savedFocusSession.c2)) ? Number(savedFocusSession.c2) : 160);
      setC3(Number.isFinite(Number(savedFocusSession.c3)) ? Number(savedFocusSession.c3) : 160);
      setC4(Number.isFinite(Number(savedFocusSession.c4)) ? Number(savedFocusSession.c4) : 160);
      setC5(Number.isFinite(Number(savedFocusSession.c5)) ? Number(savedFocusSession.c5) : 160);
      setModoReduzidoAtivo(!!savedFocusSession.modoReduzidoAtivo);
      setExhaustionConfirmed(!!savedFocusSession.exhaustionConfirmed);
      setPico(savedFocusSession.pico ?? tema?.pico ?? "");
      setAnkiDeck(savedFocusSession.ankiDeck ?? tema?.ankiDeck ?? "");
    } else {
      resetSessionStates();
    }

    hydratedFocusTargetRef.current = focusSessionKey;
  }, [focusSessionKey, plat, savedFocusSession, stepDefs.length, tema?.ankiDeck, tema?.pico, tourStep]);

  useEffect(() => {
    if (!canPersistActiveFocusSession) return;
    if (skipNextFocusPersistRef.current) {
      skipNextFocusPersistRef.current = false;
      return;
    }

    const updatedAt = new Date().toISOString();
    useStore.setState((state) => ({
      meta: {
        ...state.meta,
        lastFocusSessionAt: updatedAt,
        lastFocusThemeId: tema.id,
        lastFocusStepKey: stepKey,
        activeFocusSession: {
          plat,
          temaId: tema.id,
          stepKey,
          startedD0,
          d0StepIdx,
          expandedJustification,
          showD0StatsForm,
          showSelfEvalD1,
          d1Fields,
          d1ForgotFields,
          questoes,
          acertos,
          previsao,
          clinicalSelfScore,
          revelado,
          erros,
          interleaved,
          comoFoi,
          showDetails,
          ansiedade,
          cansaco,
          confianca,
          foco,
          c1,
          c2,
          c3,
          c4,
          c5,
          modoReduzidoAtivo,
          exhaustionConfirmed,
          pico,
          ankiDeck,
          updatedAt,
        },
      },
    }));
  }, [
    acertos,
    ansiedade,
    ankiDeck,
    c1,
    c2,
    c3,
    c4,
    c5,
    canPersistActiveFocusSession,
    cansaco,
    clinicalSelfScore,
    comoFoi,
    confianca,
    d0StepIdx,
    d1Fields,
    d1ForgotFields,
    erros,
    expandedJustification,
    exhaustionConfirmed,
    foco,
    interleaved,
    pico,
    plat,
    previsao,
    questoes,
    revelado,
    showD0StatsForm,
    showDetails,
    showSelfEvalD1,
    startedD0,
    stepKey,
    tema,
    modoReduzidoAtivo,
  ]);

  const currentStepDef = stepDefs[d0StepIdx];
  const espColor = tema ? (ESP_COLORS[tema.esp] || "#8b5cf6") : "#8b5cf6";

  if (showTransitionScreen) {
    const nextItem = intelligentQueue.find(item => item.temaId !== lastCompletedItem?.id);
    const nextReason = nextItem ? (plat === "vest"
      ? "Prioridade baseada nos pesos do vestibular e proximidade da nota de corte."
      : nextItem.esp === "Preventiva"
      ? "Preventiva tem peso estratégico no ENAMED (12%) e alto retorno por tempo de estudo."
      : nextItem.overdue
      ? "Este item está atrasado na curva de revisão e atingiu o ponto ideal de revisão."
      : "Item de alta prevalência e prioridade de memorização para a prova.") : "";

    const lowestComp = lastCompletedItem?.esp === "Redação" && lastCompletedItem.c1 !== undefined
      ? getRedacaoMentorAdvice(lastCompletedItem.c1, lastCompletedItem.c2, lastCompletedItem.c3, lastCompletedItem.c4, lastCompletedItem.c5)
      : null;

    return (
      <div className="fixed inset-0 bg-[#07070f] text-white flex flex-col items-center justify-center p-6 z-[200]">
        <div className="w-full max-w-md bg-[#0d0d14]/80 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md text-center animate-fade-up">
          <div className="text-5xl animate-bounce">🏆</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white font-sans">Etapa Concluída!</h2>
            <p className="text-xs text-gray-400">
              Você completou com sucesso a etapa <strong className="text-blue-400">{lastCompletedItem?.stepLabel}</strong> de <strong className="text-white">{lastCompletedItem?.nome}</strong>.
            </p>
          </div>

          {lowestComp && (
            <div className="p-4 rounded-2xl bg-[#fb923c]/10 border border-[#fb923c]/20 text-left space-y-1">
              <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest font-mono">💡 Direcionamento do Mentor (Redação)</span>
              <p className="text-xs text-gray-300 font-medium leading-relaxed">
                Menor nota em <strong className="text-white">{lowestComp.name}</strong> ({lowestComp.score} pts).
              </p>
              <p className="text-[11px] text-orange-200/90 italic leading-relaxed">
                "{lowestComp.advice}"
              </p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left space-y-3">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest font-mono">⚡ Próximo da fila</p>
            {nextItem ? (
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{nextItem.temaNome}</h4>
                  <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full inline-block mt-1">
                    ETAPA {nextItem.stepKey.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                  {nextReason}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Parabéns! Sua fila de hoje está totalmente limpa! 🎉</p>
            )}
          </div>

          {lastDominantError && (
            <ErrorActionPrompt
              dominantError={lastDominantError}
              context="pos-sessao"
              tema={lastCompletedItem?.nome || null}
              onAction={() => setShowTransitionScreen(false)}
              onDismiss={() => setLastDominantError(null)}
            />
          )}

          <div className="flex flex-col gap-2 pt-2">
            {nextItem && (
              <button
                onClick={() => {
                  setCurrentTarget({ temaId: nextItem.temaId, stepKey: nextItem.stepKey });
                  setShowTransitionScreen(false);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl font-black text-xs tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-slate-900/25 cursor-pointer border-none"
              >
                Próximo da Fila →
              </button>
            )}
            <button
              onClick={onExit}
              className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {nextItem ? "Parar por hoje (Descanso)" : "Sair do Modo Foco"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (groupTask) {
    return (
      <div className="fixed inset-0 bg-[#07070f] text-white flex flex-col z-[200] overflow-hidden select-none select-text-safe">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-black/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onExit}
              className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-blue-300 font-black">grupo de revisão</p>
              <h1 className="text-sm md:text-base font-black truncate">{groupTask.groupName || "Grupo de revisão"}</h1>
            </div>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            {groupTask.subItems.length} curvas de revisão
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-5">
            <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-blue-300" />
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-200">Sub-temas co-agendados</h2>
              </div>
              <div className="divide-y divide-white/5">
                {groupTask.subItems.map((item) => (
                  <div key={`${item.temaId}-${item.stepKey}`} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{item.temaNome}</p>
                      <p className="text-[10px] text-gray-500">
                        {item.area} · {String(item.stepKey).toUpperCase()} · {item.date}
                      </p>
                    </div>
                    <span className="text-[9px] rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-gray-300 uppercase font-black">
                      curva de revisão
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
              <AcertoInputs
                questoes={questoes}
                setQuestoes={setQuestoes}
                acertos={acertos}
                setAcertos={setAcertos}
                pct={pct}
                schedulerPreview={null}
              />

              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={groupOverrideOpen}
                  onChange={(event) => setGroupOverrideOpen(event.target.checked)}
                  className="accent-blue-500"
                />
                ajustar por tema
              </label>

              {groupOverrideOpen && (
                <div className="space-y-2 border-t border-white/5 pt-4">
                  {groupTask.subItems.map((item) => (
                    <div key={`override-${item.temaId}`} className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2 items-center">
                      <label className="text-[11px] text-gray-300 truncate" title={item.temaNome}>
                        {item.temaNome}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={groupOverrides[item.temaId] ?? ""}
                        onChange={(event) => setGroupOverrides((current) => ({
                          ...current,
                          [item.temaId]: event.target.value,
                        }))}
                        placeholder={pct == null ? "0-100" : `${pct}%`}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onExit}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold"
                >
                  Sair
                </button>
                <button
                  type="button"
                  onClick={handleCompleteGroupReview}
                  disabled={!hasValidQuestionResult}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black disabled:opacity-40"
                >
                  Confirmar grupo de revisão
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  if (!activeReviewItem) {
    return (
      <div className="fixed inset-0 bg-[#05050d] text-white flex flex-col items-center justify-center p-6 z-[200]">
        <div className="text-center space-y-5 max-w-sm animate-fade-up">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-black">Fila Totalmente Limpa!</h2>
          <p className="text-xs text-gray-400 leading-relaxed italic">
            "Fila zerada — e isso é vitória, não tédio. Descanso consolida. Te vejo amanhã!"
          </p>
          <button
            onClick={onExit}
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 font-bold text-[12.5px] transition-all cursor-pointer border-none text-white"
          >
            Sair do Modo Foco
          </button>
        </div>
      </div>
    );
  }

  if (exhaustionDetected && !exhaustionConfirmed) {
    if (fase === "aquisicao") {
      if (nRevisoes > 0) {
        return (
          <div className="fixed inset-0 bg-[#07070f] text-white flex flex-col items-center justify-center p-6 z-[200]">
            <div className="w-full max-w-md bg-[#0d0d14]/80 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md text-center animate-fade-up">
              <div className="text-5xl">⚠️</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white font-sans">Alerta de Exaustão</h2>
                <p className="text-sm text-yellow-500 font-bold uppercase tracking-wider">Modo Reduzido Ativo</p>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">
                "Hoje tá pesado. Tema novo agora vira tempo jogado fora — encoding exausto não fixa. Bora só nas {nRevisoes} revisões que já estão maduras? Elas pedem menos e rendem mais. O tema novo te espera amanhã."
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    const tomorrow = addDays(todayStr(), 1);
                    const newRev = {
                      ...tema.rev,
                      d0: {
                        ...tema.rev.d0,
                        date: tomorrow
                      }
                    };
                    updateTema(plat, tema.id, { rev: newRev });
                    
                    const firstPending = intelligentQueue.find(item => item.stepKey !== "d0");
                    if (firstPending) {
                      setCurrentTarget({ temaId: firstPending.temaId, stepKey: firstPending.stepKey });
                    } else {
                      onExit();
                    }
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl font-black text-xs tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-slate-900/25 cursor-pointer border-none"
                >
                  Bora para as Revisões
                </button>
                <button
                  onClick={() => {
                    setExhaustionConfirmed(true);
                  }}
                  className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Insistir no Tema Novo
                </button>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="fixed inset-0 bg-[#07070f] text-white flex flex-col items-center justify-center p-6 z-[200]">
            <div className="w-full max-w-md bg-[#0d0d14]/80 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md text-center animate-fade-up">
              <div className="text-5xl">❄️</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white font-sans">Descanso Prescrito</h2>
                <p className="text-sm text-cyan-400 font-bold uppercase tracking-wider">Modo Reduzido Ativo</p>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">
                "Você zerou as revisões e hoje não é dia de tema novo. Descansar não é falha — é o que consolida o que você já aprendeu. Te vejo amanhã, inteiro."
              </p>
              <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      updateGamifStreak(todayStr());
                      onExit();
                    }}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl font-black text-xs tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-slate-900/25 cursor-pointer border-none"
                >
                  Seguir Orientação e Descansar
                </button>
                <button
                  onClick={() => {
                    setExhaustionConfirmed(true);
                  }}
                  className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Insistir no Tema Novo
                </button>
              </div>
            </div>
          </div>
        );
      }
    } else if (fase === "recuperacao") {
      return (
        <div className="fixed inset-0 bg-[#07070f] text-white flex flex-col items-center justify-center p-6 z-[200]">
          <div className="w-full max-w-md bg-[#0d0d14]/80 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md text-center animate-fade-up">
            <div className="text-5xl">⚡</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white font-sans">Recuperação Reduzida</h2>
              <p className="text-sm text-blue-400 font-bold uppercase tracking-wider">Modo Reduzido Ativo</p>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-medium">
              "Dia difícil? Então vamos no essencial: um recall rápido e 10 questões de {tema.nome}. Mantém a curva sem te quebrar."
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setModoReduzidoAtivo(true);
                  setExhaustionConfirmed(true);
                  setQuestoes("10");
                }}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl font-black text-xs tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-slate-900/25 cursor-pointer border-none"
              >
                Ativar Modo Reduzido
              </button>
              <button
                onClick={() => {
                  setExhaustionConfirmed(true);
                }}
                className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Insistir na Sessão Completa
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="fixed inset-0 bg-[#07070f] text-white flex flex-col z-[200] overflow-hidden select-none select-text-safe">
      {modoReduzidoAtivo && (
        <div className="bg-blue-950/40 border-b border-blue-500/20 py-1 text-center select-none">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest font-mono">⚡ Modo Reduzido Ativo: 10 Questões + Recall Essencial</span>
        </div>
      )}
      {/* 1. TOP HEADER DISCRETO */}
      <header className="flex justify-between items-center px-6 py-4 bg-[#07070f]/90 border-b border-white/5 shrink-0 backdrop-blur">
        <div />
        <button
          onClick={onExit}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20 text-[11.5px] font-black transition-all"
        >
          <X size={13} /> Pausar Sessão
        </button>
      </header>

      {/* 2. BODY CONTENT */}
      <main className="flex-1 overflow-y-auto flex items-start md:items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl my-auto bg-[#0d0d14]/60 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md animate-fade-up">
          <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: espColor }} />

          {/* 3 de 7 da fila de hoje */}
          <div className="space-y-1.5 border-b border-white/5 pb-4">
            <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest font-mono">
              <span>Sessão Diária: {completedInSession + 1} de {initialQueueLength || 1} da fila de hoje</span>
              <span className="text-blue-400 font-extrabold">{Math.round(((completedInSession) / Math.max(1, initialQueueLength)) * 100)}%</span>
            </div>
            <div className="bg-white/5 rounded-full h-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-sky-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((completedInSession) / Math.max(1, initialQueueLength)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Theme Meta Header */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] px-2 py-0.5 rounded" style={{ background: espColor + "15", color: espColor }}>
                {tema.esp}
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-2">{tema.nome}</h2>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-gray-500 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
                ETAPA {stepKey.toUpperCase()}
              </span>
            </div>
          </div>

          {/* ─── RELAPSO DE TEMA MADURO: protocolo dirigido (Brain Dump + lacunas + caso) ─── */}
          {tema?.rev?.relearning?.protocol?.origem === "lapso_maduro" && (stepKey === "d0" || stepKey === "d1") && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5 text-left animate-fade-up">
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                Reabordagem dirigida — você esqueceu este tema
              </p>
              <p className="text-[12px] text-amber-100/90 leading-relaxed">
                A revisão caiu abaixo de 60%, então o tema voltou ao estudo base. Faça um <strong>Brain Dump</strong> do
                que lembra, estude as <strong>lacunas</strong> que aparecerem e mapeie os erros abaixo. A próxima revisão
                virá logo, com <strong>caso clínico + questões</strong> para consolidar a habilidade.
              </p>
            </div>
          )}

          {/* ─── D0 PREPARATION SCREEN ─── */}
          {stepKey === "d0" && !startedD0 && (
            <div className="space-y-5 text-left">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                <p className="text-[12.5px] text-gray-400 leading-relaxed font-medium">
                  {plat === "vest"
                    ? "Você iniciará o ciclo de estudos D0. Defina o deck do Anki para este tema (opcional)."
                    : "Você iniciará o ciclo de estudos D0. Antes de começar, defina as âncoras clínicas principais para este tema."}
                </p>

                {plat !== "vest" && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Target size={13} className="text-blue-400" /> Caso Clínico PICO / Âncora Mental (Opcional)
                    </label>
                    <textarea
                      rows={3}
                      value={pico}
                      onChange={(e) => setPico(e.target.value)}
                      placeholder="Ex: Paciente 35a com quadro compatível com Apendicite, dor em fossa ilíaca direita..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-all resize-none"
                    />
                    {canShowJaDomino && (
                      <div className="mt-2.5 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setTemaValidando(tema)}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-400/15"
                        >
                          Já domino este tema
                        </button>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          Se esta âncora clínica já é familiar, valide com questões para pular a exposição inicial sem burlar o ciclo.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Zap size={13} className="text-blue-400" /> Deck do Anki Alvo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={ankiDeck}
                    onChange={(e) => setAnkiDeck(e.target.value)}
                    placeholder={plat === "vest" ? "Ex: Vestibular::Matemática::Funções" : "Ex: Medicina::Ginecologia::Onco"}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                {canInterleave && (
                  <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3.5 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="interleave-toggle-d0"
                      checked={interleaved}
                      onChange={(e) => setInterleaved(e.target.checked)}
                      className="mt-1 rounded border-white/20 text-blue-600 focus:ring-blue-500 bg-black/40 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <label htmlFor="interleave-toggle-d0" className="flex-1 cursor-pointer select-none">
                      <div className="text-xs leading-relaxed text-gray-300">
                        <span className="font-bold text-blue-400 block mb-0.5">
                          {interleavingPlan.title || "Prática intercalada"}
                        </span>
                        <span>{interleavingPlan.message}</span>
                        {interleavingPlan.candidates?.length > 0 && (
                          <ul className="mt-2.5 space-y-2">
                            {interleavingPlan.candidates.map((c) => {
                              const candTema = temas.find(t => t.id === c.temaId);
                              return (
                                <li key={`${c.temaId}-${c.stepKey}`} className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5 shadow-inner">
                                  <div className="flex flex-col min-w-0 pr-2">
                                    <span className="text-[11px] text-white font-bold truncate">{c.temaNome}</span>
                                    <span className="text-[9.5px] text-gray-400 leading-normal">{c.reason}</span>
                                  </div>
                                  {candTema && (
                                    <div className="shrink-0 flex items-center bg-white/[0.02] border border-white/5 px-2 py-1 rounded-lg">
                                      <RetrievabilitySpark tema={candTema} />
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <p className="mt-2 text-[10px] text-gray-500 font-medium">
                          Apenas a revisão atual será concluída oficialmente.
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStartedD0(true)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl font-black text-xs tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-slate-900/25 flex items-center justify-center gap-2"
              >
                <Play size={14} /> Iniciar D0: {stepDefs.length} Etapas Científicas
              </button>
            </div>
          )}

          {/* ─── D0 ACTIVE STUDY STEPS ─── */}
          {stepKey === "d0" && startedD0 && !showD0StatsForm && (
            <div className="space-y-6 text-left">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${((d0StepIdx + 1) / stepDefs.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                  <span>Passo {d0StepIdx + 1} de {stepDefs.length} ({formatTextWithPlatform(currentStepDef.title)})</span>
                  <span>{Math.round(((d0StepIdx + 1) / stepDefs.length) * 100)}%</span>
                </div>
              </div>

              {/* Step info */}
              <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-blue-400 shrink-0">
                    {React.createElement(STEP_ICONS[currentStepDef.id] || FileText, { size: 22 })}
                  </div>
                  <div className="space-y-1.5 flex-1 text-left">
                    <div>
                      <h3 className="text-base font-black text-white leading-tight">{formatTextWithPlatform(currentStepDef.title)}</h3>
                      <p className="text-[12px] text-gray-400 mt-0.5">{formatTextWithPlatform(currentStepDef.description)}</p>
                    </div>
                    {/* Evidence / Justification no topo */}
                    {!isModoProva && currentStepDef.justification && (
                      <div className="border-t border-white/5 pt-2.5 space-y-1">
                        <div className="text-[11px] text-gray-400 leading-relaxed italic border-l-2 border-blue-500/40 pl-2">
                          {formatTextWithPlatform(currentStepDef.justification.split("\n")[0])}
                        </div>
                        {currentStepDef.justification.split("\n").length > 1 && (
                          <div>
                            <button
                              type="button"
                              onClick={() => setExpandedJustification(!expandedJustification)}
                              className="text-[9px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 border-none bg-transparent p-0 cursor-pointer"
                            >
                              <span>{expandedJustification ? "▼" : "▶"}</span>
                              Ver fonte científica
                            </button>
                            {expandedJustification && (
                              <div className="bg-blue-500/[0.01] border-l border-blue-500/20 p-2.5 rounded-r-xl mt-1.5 w-full animate-fade-up text-[10px] text-gray-500 leading-relaxed whitespace-pre-line italic">
                                {formatTextWithPlatform(currentStepDef.justification.split("\n").slice(1).join("\n"))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <p className="whitespace-pre-line text-xs leading-relaxed text-gray-300 font-medium">
                    {formatTextWithPlatform(currentStepDef.instruction)}
                  </p>
                </div>
              </div>

              {/* Timer & controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
                <div className="flex items-center gap-3">
                  <span className={`text-4xl font-black font-mono tracking-tight tabular-nums ${secondsLeft <= 60 ? "text-red-400 animate-pulse" : "text-blue-400"}`}>
                    {formatTimer()}
                  </span>
                  {!isModoProva && (
                    <button
                      onClick={() => setTimerActive(!timerActive)}
                      className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-300 text-xs font-semibold hover:text-white"
                    >
                      {timerActive ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                  )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {!isModoProva && (
                    <button
                      type="button"
                      onClick={extendTimer}
                      className="px-4 py-3.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus size={14} /> +5 Minutos
                    </button>
                  )}
                  {d0StepIdx > 0 && (
                    <button
                      type="button"
                      onClick={handleBackD0Step}
                      className="px-4 py-3.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
                    >
                      Voltar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCompleteD0Step}
                    className="flex-1 sm:flex-none px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[11px] transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20"
                  >
                    {d0StepIdx === stepDefs.length - 1 ? "Finalizar D0" : "Concluir Passo"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── D0 STATS COMPLETION SCREEN ─── */}
          {stepKey === "d0" && startedD0 && showD0StatsForm && (
            <div className="space-y-6 text-left animate-fade-up">
              <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide">Finalização do Estudo Ativo (D0)</h4>
                <p className="text-xs text-gray-400 leading-relaxed mt-1.5">
                  Informe o resultado das questões feitas para registrar seu ponto de partida e calibrar a curva de revisão.
                </p>
              </div>

              <div className="space-y-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                {tema?.esp === "Redação" ? (
                  <RedacaoInputs
                    c1={c1} setC1={setC1}
                    c2={c2} setC2={setC2}
                    c3={c3} setC3={setC3}
                    c4={c4} setC4={setC4}
                    c5={c5} setC5={setC5}
                  />
                ) : (
                  <AcertoInputs
                    questoes={questoes}
                    setQuestoes={setQuestoes}
                    acertos={acertos}
                    setAcertos={setAcertos}
                    pct={pct}
                    schedulerPreview={schedulerPreview}
                    previsao={""}
                    setPrevisao={() => {}}
                    revelado={true}
                    setRevelado={() => {}}
                    showPrevisao={false}
                  />
                )}

                {/* Como Foi Emoji Selector */}
                <div className="space-y-2 mt-4 text-left border-t border-white/5 pt-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Como foi o estudo deste tema? (Opcional)</label>
                  <div className="flex gap-4">
                    {[
                      { key: "ruim", emoji: "😣", label: "Ruim / Exausto" },
                      { key: "normal", emoji: "😐", label: "Ok / Normal" },
                      { key: "bom", emoji: "🙂", label: "Bem / Produtivo" }
                    ].map(item => {
                      const isSelected = comoFoi === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setComoFoi(item.key);
                            if (item.key === "ruim") {
                              setCansaco("Alto");
                              setAnsiedade("Alta");
                              setConfianca("Baixa");
                            } else if (item.key === "normal") {
                              setCansaco("Normal");
                              setAnsiedade("Normal");
                              setConfianca("Média");
                            } else if (item.key === "bom") {
                              setCansaco("Baixo");
                              setAnsiedade("Baixa");
                              setConfianca("Alta");
                            }
                          }}
                          className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all duration-300 ${
                            isSelected 
                              ? "bg-blue-600/20 border-blue-500 text-white scale-[1.03]" 
                              : "bg-black/40 border-white/5 text-gray-400 hover:bg-black/60 hover:text-white"
                          }`}
                        >
                          <span className="text-2xl">{item.emoji}</span>
                          <span className="text-[10px] font-semibold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Collapsible Details */}
                <div className="mt-3 text-left">
                  <button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    className={`w-full py-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      showDetails 
                        ? "bg-white/10 border-white/10 text-white" 
                        : sugerirDetalhes 
                        ? "bg-blue-950/40 border-blue-500/40 text-blue-300 hover:bg-blue-900/40 hover:border-blue-500 animate-pulse" 
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>📊 {showDetails ? "Ocultar Detalhes" : "Adicionar Detalhes / Refinar Diagnóstico"}</span>
                    {sugerirDetalhes && !showDetails && <span className="bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold font-mono">Amostra</span>}
                  </button>
                  
                  {sugerirDetalhes && !showDetails && (
                    <p className="text-[10px] text-blue-400/80 mt-1.5 text-center italic">
                      💡 Coleta Amostral Diagnóstica: Considere expandir e detalhar como se sente hoje para calibrar o Mentor!
                    </p>
                  )}

                  {showDetails && (
                    <div className="border border-white/5 bg-black/20 rounded-2xl p-4 space-y-4 animate-fade-in mt-3">
                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide">Nível de Cansaço / Exaustão</label>
                        <div className="flex gap-2">
                          {["Baixo", "Normal", "Alto"].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setCansaco(val)}
                              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                cansaco === val 
                                  ? "bg-blue-600 border-blue-500 text-white font-bold" 
                                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide">Ansiedade Subjetiva</label>
                        <div className="flex gap-2">
                          {["Baixa", "Normal", "Alta"].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setAnsiedade(val)}
                              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                ansiedade === val 
                                  ? "bg-blue-600 border-blue-500 text-white font-bold" 
                                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide">Confiança no Conteúdo</label>
                        <div className="flex gap-2">
                          {["Baixa", "Média", "Alta"].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setConfianca(val)}
                              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                confianca === val 
                                  ? "bg-blue-600 border-blue-500 text-white font-bold" 
                                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide">Foco no Estudo</label>
                        <div className="flex gap-2">
                          {["Baixo", "Normal", "Alto"].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setFoco(val)}
                              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                foco === val 
                                  ? "bg-blue-600 border-blue-500 text-white font-bold" 
                                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      {tema?.esp !== "Redação" && pct != null && pct < 75 && (
                        <div className="border-t border-white/5 pt-4">
                          <StructuredErrorsList erros={erros} onChange={setErros} plat={plat} esp={tema.esp} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowD0StatsForm(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#111113] hover:bg-white/5 text-gray-400 hover:text-white border border-white/5 rounded-xl text-xs font-semibold"
                >
                  Voltar para os Passos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!canCompleteQuestionStep) return;
                    const elapsedMin = Math.max(1, Math.round((Date.now() - stepStartTime) / 60000));
                    if (tema?.esp === "Redação") {
                      const sum = (+c1) + (+c2) + (+c3) + (+c4) + (+c5);
                      handleStepSuccess(tema.id, "d0", {
                        acerto: sum / 1000,
                        questoes: 5,
                        c1: +c1,
                        c2: +c2,
                        c3: +c3,
                        c4: +c4,
                        c5: +c5,
                        pico,
                        ankiDeck,
                        interleaved: interleaved,
                        interleavingPlan: interleavingPlan,
                        interleavingStatus: interleavingPlan?.status || null,
                        tempoMin: elapsedMin,
                        ansiedade,
                        cansaco,
                        confianca,
                        foco
                      });
                    } else {
                        const showErroBox = pct != null && pct < 75;
                        handleStepSuccess(tema.id, "d0", {
                        acerto: reviewAcertoFinal,
                        questoes: totalQuestoes || null,
                        motivosErro: showErroBox ? erros.map(e => e.tipoErro) : [],
                        erros: showErroBox ? erros : [],
                        pico,
                        ankiDeck,
                        interleaved: interleaved,
                        interleavingPlan: interleavingPlan,
                        interleavingStatus: interleavingPlan?.status || null,
                        tempoMin: elapsedMin,
                        ansiedade,
                        cansaco,
                        confianca,
                        foco
                      });
                    }
                  }}
                  disabled={!canCompleteQuestionStep}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl font-bold text-[11.5px] transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ✓ Concluir Estudo D0
                </button>
              </div>
            </div>
          )}

          {/* ─── D1 BRAIN DUMP FLUX ─── */}
          {stepKey === "d1" && (
            showSelfEvalD1 ? (
              <div className="space-y-5 text-left animate-fade-up">
                <div className="bg-[#141421]/60 border border-blue-500/10 rounded-2xl p-4 mb-2">
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider">Metacognição: Auto-avaliação do Brain Dump</h4>
                  <p className="text-[11.5px] text-gray-400 mt-1 leading-relaxed">
                    Compare o que você acabou de escrever de memória com as diretrizes do seu material de apoio. Sejam honestos: o que acabou faltando ou sendo esquecido?
                  </p>
                </div>

                <div className="space-y-3 bg-white/[0.01] border border-white/5 p-5 rounded-2xl max-h-[50vh] overflow-y-auto pr-1">
                  {brainDumpFields.map(field => {
                    const textTyped = d1Fields[field.k] || "—";
                    const isForgot = !!d1ForgotFields[field.k];
                    return (
                      <div key={field.k} className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2">
                        <div>
                          <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-wide block">{field.label}</span>
                          <p className="text-xs text-gray-300 italic mt-1 bg-black/20 p-2 rounded border border-white/5 whitespace-pre-wrap">{textTyped}</p>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isForgot}
                            onChange={(e) => setD1ForgotFields({ ...d1ForgotFields, [field.k]: e.target.checked })}
                            className="rounded border-white/20 text-blue-600 focus:ring-blue-500 bg-black cursor-pointer"
                          />
                          <span>Esqueci / confundi detalhes essenciais de {field.label.replace(/^[^\s]+\s+/, "")}</span>
                        </label>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSelfEvalD1(false)}
                    className="w-full sm:w-auto px-4 py-3 bg-[#111113] hover:bg-white/5 text-gray-400 hover:text-white border border-white/5 rounded-xl text-xs font-semibold"
                  >
                    ← Corrigir Texto
                  </button>
                  <button
                    type="button"
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl font-bold text-[11px] transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20"
                    onClick={() => {
                      const forgotCount = Object.keys(d1ForgotFields).filter(k => d1ForgotFields[k]).length;
                      let d1Acerto = 1.0;
                      if (forgotCount === 1) d1Acerto = 0.85;
                      else if (forgotCount === 2) d1Acerto = 0.65;
                      else if (forgotCount >= 3) d1Acerto = 0.40;

                      const elapsedMin = Math.max(1, Math.round((Date.now() - stepStartTime) / 60000));

                      handleStepSuccess(tema.id, "d1", {
                        fields: d1Fields,
                        acerto: d1Acerto,
                        tempoMin: elapsedMin,
                        modoReduzido: modoReduzidoAtivo,
                        interleaved: false,
                        interleavingPlan: null,
                        interleavingStatus: null
                      });
                    }}
                  >
                    Gravar Auto-avaliação e Avançar →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-left">
                <div className="bg-[#141421]/60 border border-blue-500/10 rounded-2xl p-4 mb-2">
                  <p className="text-[11.5px] text-blue-300 leading-relaxed italic">
                    🧠 {formatTextWithPlatform(mentorPhrase) || "D1 é recuperação ativa: escrever de memória (Brain Dump) sem olhar o material."}
                  </p>
                </div>

                <ProgressiveTooltip
                  tooltipId="brain_dump_d1"
                  text={plat === "vest"
                    ? "Este é o Brain Dump. Escreva tudo o que lembra sobre cada pilar do tópico de cabeça. Isso força o cérebro a consolidar as sinapses no D1."
                    : "Mentor: Este é o Brain Dump. Escreva tudo o que lembra sobre cada pilar clínico de cabeça antes de abrir os materiais. Isso força o cérebro a consolidar as sinapses no D1."}
                >
                  <div className="space-y-4 bg-white/[0.01] border border-white/5 p-5 rounded-2xl max-h-[50vh] overflow-y-auto pr-1">
                    {brainDumpFields.map(field => (
                      <div key={field.k} className="space-y-1">
                        <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide">{field.label}</label>
                        <textarea
                          rows={2}
                          value={d1Fields[field.k] || ""}
                          onChange={(e) => setD1Fields({ ...d1Fields, [field.k]: e.target.value })}
                          placeholder={field.placeholder}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-all resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </ProgressiveTooltip>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-4xl font-black font-mono tracking-tight tabular-nums ${secondsLeft <= 60 ? "text-red-400 animate-pulse" : "text-blue-400"}`}>
                      {formatTimer()}
                    </span>
                    {!isModoProva && (
                      <button
                        onClick={() => setTimerActive(!timerActive)}
                        className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-300 text-xs font-semibold hover:text-white"
                      >
                        {timerActive ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                    )}
                    <span className={`text-[10px] font-mono ${Object.values(d1Fields).reduce((sum, v) => sum + (v || "").trim().length, 0) >= 10 ? "text-emerald-400" : "text-amber-400"}`}>
                      {Object.values(d1Fields).reduce((sum, v) => sum + (v || "").trim().length, 0)}/10 caracteres
                    </span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {!isModoProva && (
                      <button
                        type="button"
                        onClick={extendTimer}
                        className="px-4 py-3.5 bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold rounded-xl transition-all"
                      >
                        +5 Minutos
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCompleteD1}
                      disabled={Object.values(d1Fields).reduce((sum, v) => sum + (v || "").trim().length, 0) < 10}
                      className={`flex-1 sm:flex-none px-6 py-3.5 rounded-xl font-bold text-[11px] transition-all active:scale-[0.98] shadow-lg ${
                        Object.values(d1Fields).reduce((sum, v) => sum + (v || "").trim().length, 0) >= 10
                          ? "bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-slate-900/20"
                          : "bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      ✓ Concluir Brain Dump
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* ─── D4 / D7 / D21 REVIEW STEPS ─── */}
          {["d4", "d7", "d21", "manutencao"].includes(stepKey) && (
            <div className="space-y-6 text-left">
              <div className="bg-[#141421]/60 border border-blue-500/10 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide">Mentor Científico</h4>
                <p className="text-xs text-gray-300 leading-relaxed mt-1.5 italic">
                  {formatTextWithPlatform(mentorPhrase) || formatTextWithPlatform(
                    stepKey === "d4" ? "Resolva questões ativas sobre o tema. O objetivo é forçar a recuperação mental de pontos-chave e mapear lacunas." :
                    stepKey === "d7" ? "Faça questões de prova e conclua a revisão do Deck do Anki correspondente. Ajuste os cards baseando-se nos erros." :
                    stepKey === "d21" ? "Revisão interleaved: resolva questões misturadas sobre o tema junto com outros conteúdos. É a etapa final de fixação." :
                    "Manutenção de Longo Prazo: Resolva questões ativas e revise materiais essenciais para manter este tema consolidado."
                  )}
                </p>
              </div>

              {/* P4-C: Tarefa clinica multimodal (res only, gated por modulo) */}
              {clinicalTask && tema?.esp !== "Redação" && (
                <ClinicalTaskPanel task={clinicalTask} onSelfScore={setClinicalSelfScore} />
              )}

              {tema?.esp !== "Redação" && (
                <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-2xl text-left space-y-1.5 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 text-sm">💻</span>
                    <h5 className="text-xs font-black text-indigo-300 uppercase tracking-wider">Treino Prático Externo</h5>
                  </div>
                  <p className="text-[10.5px] text-gray-400 leading-relaxed">
                    Hora de treinar no <strong>{platformName}</strong>. Resolva as questões lá e, ao finalizar, retorne aqui para registrar seu resultado. Eu uso esses dados para recalcular sua próxima revisão no momento ideal!
                  </p>
                </div>
              )}

              <div className="space-y-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                {tema?.esp === "Redação" ? (
                  <RedacaoInputs
                    c1={c1} setC1={setC1}
                    c2={c2} setC2={setC2}
                    c3={c3} setC3={setC3}
                    c4={c4} setC4={setC4}
                    c5={c5} setC5={setC5}
                  />
                ) : (
                  <AcertoInputs
                    questoes={questoes}
                    setQuestoes={setQuestoes}
                    acertos={acertos}
                    setAcertos={setAcertos}
                    pct={pct}
                    schedulerPreview={schedulerPreview}
                    previsao={previsao}
                    setPrevisao={setPrevisao}
                    revelado={revelado}
                    setRevelado={setRevelado}
                    showPrevisao={true}
                  />
                )}

                {canInterleave && (
                  <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3.5 flex items-start gap-3 mt-2">
                    <input
                      type="checkbox"
                      id="interleave-toggle-rev"
                      checked={interleaved}
                      onChange={(e) => setInterleaved(e.target.checked)}
                      className="mt-1 rounded border-white/20 text-blue-600 focus:ring-blue-500 bg-black/40 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <label htmlFor="interleave-toggle-rev" className="flex-1 cursor-pointer select-none">
                      <div className="text-xs leading-relaxed text-gray-300">
                        <span className="font-bold text-blue-400 block mb-0.5">
                          {interleavingPlan.title || "Prática intercalada"}
                        </span>
                        <span>{interleavingPlan.message}</span>
                        {interleavingPlan.candidates?.length > 0 && (
                          <ul className="mt-2.5 space-y-2">
                            {interleavingPlan.candidates.map((c) => {
                              const candTema = temas.find(t => t.id === c.temaId);
                              return (
                                <li key={`${c.temaId}-${c.stepKey}`} className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5 shadow-inner">
                                  <div className="flex flex-col min-w-0 pr-2">
                                    <span className="text-[11px] text-white font-bold truncate">{c.temaNome}</span>
                                    <span className="text-[9.5px] text-gray-400 leading-normal">{c.reason}</span>
                                  </div>
                                  {candTema && (
                                    <div className="shrink-0 flex items-center bg-white/[0.02] border border-white/5 px-2 py-1 rounded-lg">
                                      <RetrievabilitySpark tema={candTema} />
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <p className="mt-2 text-[10px] text-gray-500 font-medium">
                          Apenas a revisão atual será concluída oficialmente.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Como Foi Emoji Selector */}
                <div className="space-y-2 mt-4 text-left border-t border-white/5 pt-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Como foi o estudo deste tema? (Opcional)</label>
                  <div className="flex gap-4">
                    {[
                      { key: "ruim", emoji: "😣", label: "Ruim / Exausto" },
                      { key: "normal", emoji: "😐", label: "Ok / Normal" },
                      { key: "bom", emoji: "🙂", label: "Bem / Produtivo" }
                    ].map(item => {
                      const isSelected = comoFoi === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setComoFoi(item.key);
                            if (item.key === "ruim") {
                              setCansaco("Alto");
                              setAnsiedade("Alta");
                              setConfianca("Baixa");
                            } else if (item.key === "normal") {
                              setCansaco("Normal");
                              setAnsiedade("Normal");
                              setConfianca("Média");
                            } else if (item.key === "bom") {
                              setCansaco("Baixo");
                              setAnsiedade("Baixa");
                              setConfianca("Alta");
                            }
                          }}
                          className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all duration-300 ${
                            isSelected 
                              ? "bg-blue-600/20 border-blue-500 text-white scale-[1.03]" 
                              : "bg-black/40 border-white/5 text-gray-400 hover:bg-black/60 hover:text-white"
                          }`}
                        >
                          <span className="text-2xl">{item.emoji}</span>
                          <span className="text-[10px] font-semibold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Collapsible Details */}
                <div className="mt-3 text-left">
                  <button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    className={`w-full py-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      showDetails 
                        ? "bg-white/10 border-white/10 text-white" 
                        : sugerirDetalhes 
                        ? "bg-blue-950/40 border-blue-500/40 text-blue-300 hover:bg-blue-900/40 hover:border-blue-500 animate-pulse" 
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>📊 {showDetails ? "Ocultar Detalhes" : "Adicionar Detalhes / Refinar Diagnóstico"}</span>
                    {sugerirDetalhes && !showDetails && <span className="bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold font-mono">Amostra</span>}
                  </button>
                  
                  {sugerirDetalhes && !showDetails && (
                    <p className="text-[10px] text-blue-400/80 mt-1.5 text-center italic">
                      💡 Coleta Amostral Diagnóstica: Considere expandir e detalhar como se sente hoje para calibrar o Mentor!
                    </p>
                  )}

                  {showDetails && (
                    <div className="border border-white/5 bg-black/20 rounded-2xl p-4 space-y-4 animate-fade-in mt-3">
                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide">Nível de Cansaço / Exaustão</label>
                        <div className="flex gap-2">
                          {["Baixo", "Normal", "Alto"].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setCansaco(val)}
                              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                cansaco === val 
                                  ? "bg-blue-600 border-blue-500 text-white font-bold" 
                                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide">Ansiedade Subjetiva</label>
                        <div className="flex gap-2">
                          {["Baixa", "Normal", "Alta"].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setAnsiedade(val)}
                              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                ansiedade === val 
                                  ? "bg-blue-600 border-blue-500 text-white font-bold" 
                                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide">Confiança no Conteúdo</label>
                        <div className="flex gap-2">
                          {["Baixa", "Média", "Alta"].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setConfianca(val)}
                              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                confianca === val 
                                  ? "bg-blue-600 border-blue-500 text-white font-bold" 
                                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide">Foco no Estudo</label>
                        <div className="flex gap-2">
                          {["Baixo", "Normal", "Alto"].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setFoco(val)}
                              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                foco === val 
                                  ? "bg-blue-600 border-blue-500 text-white font-bold" 
                                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      {tema?.esp !== "Redação" && pct != null && pct < 75 && (
                        <div className="border-t border-white/5 pt-4">
                          <StructuredErrorsList erros={erros} onChange={setErros} plat={plat} esp={tema.esp} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
                <div className="flex items-center gap-3">
                  <span className={`text-4xl font-black font-mono tracking-tight tabular-nums ${secondsLeft <= 60 ? "text-red-400 animate-pulse" : "text-blue-400"}`}>
                    {formatTimer()}
                  </span>
                  {!isModoProva && (
                    <button
                      onClick={() => setTimerActive(!timerActive)}
                      className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-300 text-xs font-semibold hover:text-white"
                    >
                      {timerActive ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                  )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {!isModoProva && (
                    <button
                      type="button"
                      onClick={extendTimer}
                      className="px-4 py-3.5 bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold rounded-xl transition-all"
                    >
                      +5 Minutos
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCompleteReview}
                    disabled={tema?.esp !== "Redação" && !hasValidQuestionResult}
                    className="flex-1 sm:flex-none px-6 py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl font-bold text-[11.5px] transition-all active:scale-[0.98] shadow-lg shadow-slate-900/25 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ✓ Confirmar Revisão
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {tourStep === "focus" && showFocusBalloon && (
        <TourBalloon
          text={plat === "vest"
            ? "Este é o Modo Foco D0. São etapas científicas adaptadas ao vestibular — pré-teste, resolução guiada, mapa do tópico, brain dump e questões. Cada etapa tem uma justificativa baseada em evidências. Vamos avançar até concluir."
            : "Mentor: Este é o Foco D0. São 6 etapas científicas. Cada etapa tem uma razão de existir baseada na medicina de aprendizado — você pode clicar em 'Análise de Evidência Científica' para ler a justificativa teórica. Vamos avançar até concluir."}
          nextLabel="Entendido"
          onNext={() => setShowFocusBalloon(false)}
        />
      )}
      {temaValidando && (
        <DomainTestModal
          open
          tema={temaValidando}
          source="ja_domino"
          onApply={(domainTestRecord) => {
            const resultado = aplicarDomainTestResultado(plat, temaValidando.id, domainTestRecord);
            showToast(resultado?.observacao || domainTestRecord?.recommendation?.message || "Teste de dominio registrado para este tema.");
            setTemaValidando(null);
          }}
          onSaveDraft={() => {
            showToast("Rascunho do teste de dominio salvo localmente.");
          }}
          onClose={() => setTemaValidando(null)}
        />
      )}
      <SessionClosureModal
        open={showSessionClosure}
        source={closureDraft?.source || "focus"}
        tema={closureDraft?.tema || ""}
        area={closureDraft?.area || ""}
        initial={closureDraft}
        onSave={(payload) => {
          persistSessionClosure(payload);
          setShowSessionClosure(false);
          setShowTransitionScreen(true);
        }}
        onSkip={() => {
          setShowSessionClosure(false);
          setShowTransitionScreen(true);
        }}
        onClose={() => {
          setShowSessionClosure(false);
        }}
      />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function AcertoInputs({ questoes, setQuestoes, acertos, setAcertos, pct, schedulerPreview = null }) {
  const total = +questoes || 0;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Questões resolvidas</label>
          <input
            type="number"
            min={0}
            value={questoes}
            onChange={(e) => setQuestoes(e.target.value)}
            placeholder="Ex: 20"
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Quantas acertou?</label>
          <input
            type="number"
            min={0}
            max={total || undefined}
            value={acertos}
            onChange={(e) => setAcertos(e.target.value)}
            placeholder="Ex: 15"
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>
      {pct != null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-4 py-2.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Acerto calculado</span>
            <span className={`text-2xl font-black font-mono ${pct >= 80 ? "text-emerald-400" : pct >= 65 ? "text-blue-400" : "text-red-400"}`}>
              {pct}%
            </span>
          </div>
          {schedulerPreview?.message && (
            <div className={`rounded-xl border px-4 py-3 ${
              schedulerPreview.tone === "advance"
                ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-200"
                : schedulerPreview.tone === "regress"
                ? "bg-red-950/20 border-red-500/20 text-red-200"
                : "bg-amber-950/20 border-amber-500/20 text-amber-200"
            }`}>
              <p className="text-[10px] font-black uppercase tracking-wider opacity-70">Proximo efeito na curva</p>
              <p className="text-[12px] font-semibold mt-0.5">{schedulerPreview.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RedacaoInputs({ c1, setC1, c2, setC2, c3, setC3, c4, setC4, c5, setC5 }) {
  const sum = (+c1 || 0) + (+c2 || 0) + (+c3 || 0) + (+c4 || 0) + (+c5 || 0);
  const comps = [
    { k: "c1", l: "C1: Norma Culta", val: c1, set: setC1, desc: "Gramática, ortografia, pontuação" },
    { k: "c2", l: "C2: Tema e Gênero", val: c2, set: setC2, desc: "Compreensão do tema e tipo de texto" },
    { k: "c3", l: "C3: Argumentação", val: c3, set: setC3, desc: "Coerência, seleção de ideias e tese" },
    { k: "c4", l: "C4: Coesão", val: c4, set: setC4, desc: "Recursos coesivos e conectivos" },
    { k: "c5", l: "C5: Proposta", val: c5, set: setC5, desc: "Ação, agente, meio, efeito e detalhe" }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {comps.map(c => (
          <div key={c.k} className="space-y-1 bg-black/40 border border-white/5 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <label className="block text-[10.5px] font-black text-gray-300 uppercase tracking-wider">{c.l}</label>
              <span className="text-[10px] text-gray-500 font-medium">{c.desc}</span>
            </div>
            <select
              value={c.val}
              onChange={(e) => c.set(e.target.value)}
              className="w-full bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500 transition-all mt-1"
            >
              {[200, 160, 120, 80, 40, 0].map(val => (
                <option key={val} value={val}>{val} pts</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between bg-[#141421] border border-blue-500/20 rounded-xl px-4 py-3 mt-3">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nota Final Calculada</span>
          <span className="text-[9px] text-blue-300 font-medium">Soma das 5 competências ENEM</span>
        </div>
        <span className={`text-3xl font-black font-mono tracking-tight ${sum >= 800 ? "text-emerald-400" : sum >= 600 ? "text-blue-400" : "text-red-400"}`}>
          {sum} / 1000
        </span>
      </div>
    </div>
  );
}

function getRedacaoMentorAdvice(c1, c2, c3, c4, c5) {
  const scores = [
    { name: "C1 (Norma Culta)", score: c1, advice: "Sua C1 está baixa. Revise pontuação e concordância. Escrever com frases mais curtas evita erros de sintaxe." },
    { name: "C2 (Tema e Gênero)", score: c2, advice: "Sua C2 precisa de atenção. Garanta que você abordou a tese claramente na introdução e use repertórios validados." },
    { name: "C3 (Argumentação)", score: c3, advice: "Sua C3 está em desenvolvimento. Lembre-se de aprofundar a relação de causa e consequência em cada parágrafo de argumento." },
    { name: "C4 (Coesão)", score: c4, advice: "Sua C4 pode melhorar. Use conectivos interparágrafos na transição de parágrafos, e diversifique os conectores." },
    { name: "C5 (Proposta de Intervenção)", score: c5, advice: "Sua C5 está baixa. É a competência mais fácil de gabaritar! Treine os 5 elements: agente, ação, meio/modo, efeito e detalhamento." }
  ];
  scores.sort((a, b) => a.score - b.score);
  return scores[0];
}
