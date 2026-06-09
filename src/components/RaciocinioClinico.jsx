// src/components/RaciocinioClinico.jsx
import React, { useMemo, useState } from "react";
import { Brain, ClipboardList, MessageSquareText, Stethoscope, Eye, CalendarDays, Pill, AlertTriangle, Plus, RefreshCw, Search, Filter, X } from "lucide-react";
import { CASOS_CLINICOS } from "../constants/casosClinicos";
import { useStore } from "../core/store";
import { Textarea, Field, Input } from "./Primitives";
import { Badge, Button as PremiumButton, Card, Dialog, MetricRing, SegmentedControl, Tooltip } from "./ui";
import { fmtRelativo, todayStr, addDays } from "../core/fsrs";
import { updateBayesianMastery } from "../core/mastery";
import { agendarReencontro } from "../core/illnessScript";
import SessionClosureModal from "./SessionClosureModal";
import EmptyState from "./EmptyState";
import { calculateClinicalReasoningScore, scoreClinicalReasoningSession } from "../core/clinicalReasoningScoring";
import { illnessScripts } from "../constants/illnessScripts";
import { caseInstances } from "../constants/caseInstances";
import { buildConfusableSets } from "../core/confusableSets";
import { calcCalibration } from "../core/calibration";
import { generateClinicalCaseDraft } from "../core/clinicalCaseGenerator";
import { selectNextDrill } from "../core/clinicalDrillSelector";

const FASES = [
  { k: "script", label: "Illness Scripts", icon: Brain },
  { k: "caso", label: "Casos", icon: ClipboardList },
  { k: "sct", label: "SCT", icon: MessageSquareText },
  { k: "anamnese", label: "Anamnese", icon: Stethoscope },
  { k: "conduta", label: "Conduta", icon: Pill },
];

const EMPTY_ANAMNESE = { queixa: "", roteiro: [], redFlags: [] };
const EMPTY_CLINICAL_CASE = {
  id: "",
  tema: "Caso clinico",
  diagnosticoFinal: "",
  area: "Geral",
  subarea: "",
  vinheta: "",
  script: {},
  diferenciais: [],
  workup: [],
  keyFeatureAnswers: [],
  expertReasoningTrace: [],
  sct: [],
  anamnese: EMPTY_ANAMNESE,
};

function normalizeClinicalCase(caseItem = {}) {
  const anamnese = caseItem.anamnese && typeof caseItem.anamnese === "object"
    ? caseItem.anamnese
    : EMPTY_ANAMNESE;
  return {
    ...EMPTY_CLINICAL_CASE,
    ...caseItem,
    script: caseItem.script && typeof caseItem.script === "object" ? caseItem.script : {},
    diferenciais: Array.isArray(caseItem.diferenciais) ? caseItem.diferenciais : [],
    workup: Array.isArray(caseItem.workup) ? caseItem.workup : [],
    keyFeatureAnswers: Array.isArray(caseItem.keyFeatureAnswers) ? caseItem.keyFeatureAnswers : [],
    expertReasoningTrace: Array.isArray(caseItem.expertReasoningTrace) ? caseItem.expertReasoningTrace : [],
    sct: Array.isArray(caseItem.sct) ? caseItem.sct : [],
    anamnese: {
      ...EMPTY_ANAMNESE,
      ...anamnese,
      roteiro: Array.isArray(anamnese.roteiro)
        ? anamnese.roteiro.map((bloco) => ({
            ...bloco,
            bloco: bloco?.bloco || "Roteiro",
            perguntasChave: Array.isArray(bloco?.perguntasChave) ? bloco.perguntasChave : [],
          }))
        : [],
      redFlags: Array.isArray(anamnese.redFlags) ? anamnese.redFlags : [],
    },
  };
}

// Campos da fase de conduta simulada
const CONDUTA_FIELDS = [
  { key: "estabilizacao", label: "Estabilizacao inicial", placeholder: "Vias aereas, acesso venoso, monitoracao, posicao, O2..." },
  { key: "examesIniciais", label: "Exames iniciais", placeholder: "Laboratoriais, imagem, ECG, culturas..." },
  { key: "tratamento", label: "Tratamento definitivo", placeholder: "Cirurgia, clinico, procedimento, internacao..." },
  { key: "medicacoes", label: "Medicacoes e doses", placeholder: "Nome, dose, via, frequencia (uso educacional)" },
  { key: "internacao", label: "Internacao ou ambulatorio", placeholder: "Criterios de internacao / ambulatorio / UTI" },
  { key: "redFlags", label: "Red flags para reavaliacao", placeholder: "Sinais de alarme que exigem reavaliacao imediata" },
  { key: "contraindicacoes", label: "Contraindicacoes relevantes", placeholder: "O que NAO fazer neste caso especifico" },
  { key: "seguimento", label: "Seguimento e retorno", placeholder: "Consulta de retorno, exames de controle, orientacoes de alta" },
];

function dificuldadeClass(dificuldade) {
  if (dificuldade === "dificil") return "text-red-300 bg-red-500/10 border-red-500/20";
  if (dificuldade === "media") return "text-amber-300 bg-amber-500/10 border-amber-500/20";
  return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
}

const COMPARTIMENTOS_METADATA = {
  enabling: {
    label: "Predisponentes / Epidemiologia",
    canonicalPath: (c) => c.script?.enabling || ""
  },
  fault: {
    label: "Mecanismo (Fisiopato)",
    canonicalPath: (c) => c.script?.fault || ""
  },
  consequences: {
    label: "Quadro Cardinal",
    canonicalPath: (c) => c.script?.consequences || ""
  },
  discriminators: {
    label: "Diferenciais Obrigatórios",
    canonicalPath: (c) => (c.diferenciais || []).map(d => `${d.dx}: ${d.pista}`).join("\n")
  },
  workup: {
    label: "Workup-chave",
    canonicalPath: (c) => (c.workup || []).join(", ")
  },
  management: {
    label: "Conduta de 1ª Linha",
    canonicalPath: (c) => c.script?.management || ""
  },
  redFlags: {
    label: "Red Flags",
    canonicalPath: (c) => (c.anamnese?.redFlags || []).join(", ")
  }
};

function normalizeClinicalText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textMatchesExpected(userText, expectedText) {
  const user = normalizeClinicalText(userText);
  const expected = normalizeClinicalText(expectedText);
  if (!user || !expected) return false;
  if (user.includes(expected) || expected.includes(user)) return true;

  const expectedTokens = expected.split(" ").filter((token) => token.length >= 3);
  if (!expectedTokens.length) return false;
  const matched = expectedTokens.filter((token) => user.includes(token)).length;
  return matched / expectedTokens.length >= 0.5;
}

function resolveConfusableCase(memberId, allCases = [], temas = []) {
  const memberKey = String(memberId);
  const direct = allCases.find((item) => String(item.id) === memberKey);
  if (direct) return direct;

  const tema = temas.find((item) => String(item.id) === memberKey);
  if (tema?.nome) {
    const temaName = normalizeClinicalText(tema.nome);
    const byTema = allCases.find((item) => {
      const candidates = [item.tema, item.diagnosticoFinal, item.subarea].map(normalizeClinicalText);
      return candidates.some((name) => name && (name.includes(temaName) || temaName.includes(name)));
    });
    if (byTema) return byTema;
  }

  const normalizedMember = normalizeClinicalText(memberId);
  return allCases.find((item) => {
    const candidates = [item.id, item.tema, item.diagnosticoFinal, item.subarea].map(normalizeClinicalText);
    return candidates.some((name) => name && (name === normalizedMember || name.includes(normalizedMember) || normalizedMember.includes(name)));
  }) || null;
}

function getCaseScript(caseItem) {
  return normalizeClinicalCase(illnessScripts.find((script) => script.id === caseItem?.id) || caseItem || {});
}

function findDiscriminatorFeature(targetCase, currentCase, currentScript) {
  const targetScript = getCaseScript(targetCase);
  const direct = (targetScript.discriminators || []).find((item) => item.vs === currentCase?.id);
  if (direct?.feature) return direct.feature;

  const fromCurrent = (currentScript?.discriminators || []).find((item) => item.vs === targetCase?.id);
  if (fromCurrent?.feature) return fromCurrent.feature;

  const ownDifferential = (targetScript.diferenciais || targetCase?.diferenciais || []).find((item) => {
    const dx = normalizeClinicalText(item.dx);
    const tema = normalizeClinicalText(targetCase?.tema);
    const finalDx = normalizeClinicalText(targetCase?.diagnosticoFinal);
    return dx && (dx === tema || dx === finalDx || tema.includes(dx) || finalDx.includes(dx));
  });
  if (ownDifferential?.pista) return ownDifferential.pista;

  return targetScript.justificativa || targetCase?.justificativa || "";
}

// Removido: calcRaciocinioScore local substituida por calculateClinicalReasoningScore
// de clinicalReasoningScoring.js (fonte canonica unica — P4-A)

export default function RaciocinioClinico() {
  const plat = useStore((s) => s.plat);
  const registrarCaso = useStore((s) => s.registrarCasoClinico || s.registrarCaso);
  const casosProgresso = useStore((s) => s[plat]?.casosProgresso || {});
  const addSessionReflection = useStore((s) => s.addSessionReflection);
  const rebuildActionInboxForToday = useStore((s) => s.rebuildActionInboxForToday);
  const showToast = useStore((s) => s.showToast);
  const meta = useStore((s) => s.meta);
  const setMeta = useStore((s) => s.setMeta);
  const learningEvents = useStore((s) => s.learningEvents || []);

  const [activeCasoId, setActiveCasoId] = useState(CASOS_CLINICOS[0]?.id || "");
  const [activeFase, setActiveFase] = useState("script");
  const [scriptAberto, setScriptAberto] = useState(false);
  const [sctRespostas, setSctRespostas] = useState({});
  const [sctRevelado, setSctRevelado] = useState(false);
  const [anamneseChecks, setAnamneseChecks] = useState({});
  const [anamneseRevelada, setAnamneseRevelada] = useState(false);
  const [showClosure, setShowClosure] = useState(false);
  const [closureDraft, setClosureDraft] = useState(null);
  // P4-D: fase conduta
  const [conductaAvisoAceito, setConductaAvisoAceito] = useState(false);
  const [conductaRespostas, setConductaRespostas] = useState({});
  const [conductaRevelada, setConductaRevelada] = useState(false);
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1-6
  const [temaQuery, setTemaQuery] = useState("");
  const [showTemaDropdown, setShowTemaDropdown] = useState(false);
  const [caseDraft, setCaseDraft] = useState({
    tema: "", temaId: null, area: "", subarea: "", fonte: "custom",
    vinheta: "", novaInfo1: "", novaInfo2: "",
    diagnostico: "", diferenciais: "", conduta: "",
  });
  const [generationPresentation, setGenerationPresentation] = useState("typical");
  const [generatedCaseDraft, setGeneratedCaseDraft] = useState(null);
  const [generatedDraftReviewed, setGeneratedDraftReviewed] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");
  const [caseAreaFilter, setCaseAreaFilter] = useState("all");
  const [caseDifficultyFilter, setCaseDifficultyFilter] = useState("all");
  const [caseStatusFilter, setCaseStatusFilter] = useState("all");

  // Drill 0 Recall state
  const [drillStep, setDrillStep] = useState("idle"); // idle, direction, despejo, mapeamento, autoavaliacao
  const [drillDirection, setDrillDirection] = useState("doenca_to_achados");
  const [writtenDiagnosis, setWrittenDiagnosis] = useState("");
  const [diagnosisFeedback, setDiagnosisFeedback] = useState(null);
  const [despejoText, setDespejoText] = useState("");
  const [timerCount, setTimerCount] = useState(60);
  const [recallData, setRecallData] = useState({
    enabling: "",
    fault: "",
    consequences: "",
    discriminators: "",
    workup: "",
    management: "",
    redFlags: ""
  });
  const [revealedCompartments, setRevealedCompartments] = useState({});
  const [compartmentRatings, setCompartmentRatings] = useState({
    enabling: null,
    fault: null,
    consequences: null,
    discriminators: null,
    workup: null,
    management: null,
    redFlags: null
  });

  // Drill B states
  const [drillBStep, setDrillBStep] = useState("diagnostico"); // diagnostico, colunas, autoexplicacao, reveal
  const [leadDiagnosis, setLeadDiagnosis] = useState("");
  const [confidence, setConfidence] = useState(5);
  const [apoiaItems, setApoiaItems] = useState([]);
  const [contraItems, setContraItems] = useState([]);
  const [faltaItems, setFaltaItems] = useState([]);
  const [customItemText, setCustomItemText] = useState("");
  const [autoExplanation, setAutoExplanation] = useState("");
  const [drillBScore, setDrillBScore] = useState(null);
  const [flashcardCreated, setFlashcardCreated] = useState(false);
  const [contrastStarted, setContrastStarted] = useState(false);

  // Selector state for drills
  const [activeDrillType, setActiveDrillType] = useState("drillB"); // drillA, drillB, drillC
  const [recommendedDrillApplied, setRecommendedDrillApplied] = useState(false);

  // Drill A states
  const [drillAStep, setDrillAStep] = useState("diagnostico"); // diagnostico, reveal
  const [drillAHypothesis, setDrillAHypothesis] = useState("");
  const [drillAConfidence, setDrillAConfidence] = useState(5);
  const [drillAKeyFeatureAnswer, setDrillAKeyFeatureAnswer] = useState("");
  const [drillAScore, setDrillAScore] = useState(null);
  const [drillAResult, setDrillAResult] = useState(null);

  // Drill C states
  const [drillCStep, setDrillCStep] = useState("jogo"); // jogo, reveal
  const [drillCAssignments, setDrillCAssignments] = useState({}); // caseId -> pistaText
  const [drillCSelectedCaseId, setDrillCSelectedCaseId] = useState(null);
  const [drillCScore, setDrillCScore] = useState(null);

  React.useEffect(() => {
    let interval;
    if (drillStep === "despejo" && timerCount > 0) {
      interval = setInterval(() => {
        setTimerCount((t) => t - 1);
      }, 1000);
    } else if (drillStep === "despejo" && timerCount === 0) {
      setDrillStep("mapeamento");
    }
    return () => clearInterval(interval);
  }, [drillStep, timerCount]);

  const startDrill0 = () => {
    const views = progresso.vistos || 0;
    const chosenDir = (views % 2 === 0) ? "doenca_to_achados" : "achado_to_doenca";
    setDrillDirection(chosenDir);
    setWrittenDiagnosis("");
    setDiagnosisFeedback(null);
    setDespejoText("");
    setTimerCount(60);
    setRecallData({
      enabling: "",
      fault: "",
      consequences: "",
      discriminators: "",
      workup: "",
      management: "",
      redFlags: ""
    });
    setRevealedCompartments({});
    setCompartmentRatings({
      enabling: null,
      fault: null,
      consequences: null,
      discriminators: null,
      workup: null,
      management: null,
      redFlags: null
    });
    setDrillStep("direction");
  };

  const finishDrill0 = () => {
    const nextCompartimentos = { ...(progresso.compartimentos || {}) };
    const subtopic = caso.subarea || caso.subtopic || caso.tema || "";

    Object.keys(compartmentRatings).forEach((compKey) => {
      const rating = compartmentRatings[compKey] || "good";
      
      let noteValue = 80;
      let acertoValue = 0.8;
      if (rating === "vermelho") {
        noteValue = 40;
        acertoValue = 0.0;
      } else if (rating === "amarelo") {
        noteValue = 60;
        acertoValue = 0.55;
      } else if (rating === "verde") {
        noteValue = 92;
        acertoValue = 1.0;
      }

      const prevComp = nextCompartimentos[compKey] || { mastery: 0.30, S: 2, proximaData: todayStr() };
      
      const nextMastery = updateBayesianMastery(prevComp.mastery ?? 0.30, {
        acerto: acertoValue,
        subtopic: subtopic
      });

      const prevSched = { S: prevComp.S ?? 2 };
      const sched = agendarReencontro(prevSched, noteValue);

      nextCompartimentos[compKey] = {
        mastery: nextMastery,
        S: sched.S,
        intervalo: sched.intervalo,
        proximaData: sched.proximaData,
        views: (prevComp.views || 0) + 1,
        lastRating: rating
      };
    });

    const correctCount = Object.values(compartmentRatings).filter(r => r === "verde").length;
    const partialCount = Object.values(compartmentRatings).filter(r => r === "amarelo").length;
    const finalScore = Math.round(((correctCount * 100) + (partialCount * 60)) / 7);

    const dueDates = Object.values(nextCompartimentos).map(c => c.proximaData).filter(Boolean);
    const minDueDate = dueDates.length > 0 ? dueDates.reduce((min, d) => d < min ? d : min, dueDates[0]) : addDays(todayStr(), 2);

    registrar({
      compartimentos: nextCompartimentos,
      fase1Ok: finalScore >= 70,
      fase1Acerto: finalScore,
      vistos: (progresso.vistos || 0) + 1,
      proximaData: minDueDate,
    });

    setDrillStep("idle");
    setActiveFase("caso");
    if (showToast) {
      showToast(`Recall concluído! Score: ${finalScore}%. Redirecionando para o Drill de Caso.`);
    }
  };

  const handleAddSuggestion = (text, column) => {
    // Remove from other columns first
    setApoiaItems(prev => prev.filter(x => x !== text));
    setContraItems(prev => prev.filter(x => x !== text));
    setFaltaItems(prev => prev.filter(x => x !== text));

    // If it was already in this column, clicking toggles it off
    if (column === "apoia" && apoiaItems.includes(text)) return;
    if (column === "contra" && contraItems.includes(text)) return;
    if (column === "falta" && faltaItems.includes(text)) return;

    if (column === "apoia") setApoiaItems(prev => [...prev, text]);
    if (column === "contra") setContraItems(prev => [...prev, text]);
    if (column === "falta") setFaltaItems(prev => [...prev, text]);
  };

  const handleCommitDrillB = () => {
    const userActions = [];
    const allUserTexts = [...apoiaItems, ...contraItems, ...faltaItems, autoExplanation];
    
    activeScript.keyFeatures?.forEach(kf => {
      const cleanExpected = kf.expectedAction
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
        
      const matched = allUserTexts.some(text => {
        const cleanText = String(text || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return cleanText && cleanExpected && (cleanText.includes(cleanExpected) || cleanExpected.includes(cleanText));
      });
      
      if (matched) {
        userActions.push(kf.expectedAction);
      }
    });

    const userAnswers = {
      keyFeatures: userActions,
      apoia: apoiaItems,
      contra: contraItems,
      falta: faltaItems,
      conduta: autoExplanation,
      confianca: confidence >= 8 ? "alta" : "baixa"
    };

    const result = scoreClinicalReasoningSession(userAnswers, activeScript);
    setDrillBScore(result);
    setDrillBStep("reveal");

    // Save session results to the database
    registrar({
      fase2Acerto: result.score,
      confianca: confidence,
      acertou: result.score >= 70,
      vistos: (progresso.vistos || 0) + 1,
      dominantError: result.errosDetectados?.[0] || (result.score < 80 ? "clinical_reasoning_gap" : null),
      meta: {
        drillType: "B",
        errosDetectados: result.errosDetectados || [],
        leadDiagnosis,
      },
    });

    abrirFechamento({
      outcome: result.score >= 80 ? "bom" : result.score >= 60 ? "medio" : "ruim",
      mainIssue: result.score < 80 ? "raciocinio" : "nenhum",
      nextAdjustment: result.score < 80 ? "caso" : "manter",
    });
  };

  const temas = useStore((s) => s[plat]?.temas || []);

  const customCases = useMemo(() => Array.isArray(meta?.clinicalCustomCases) ? meta.clinicalCustomCases : [], [meta?.clinicalCustomCases]);
  const allCases = useMemo(() => [...CASOS_CLINICOS, ...customCases].map(normalizeClinicalCase), [customCases]);
  const caseAreaOptions = useMemo(() => (
    Array.from(new Set(allCases.map((item) => item.area || "Geral")))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  ), [allCases]);
  const caseDifficultyOptions = useMemo(() => (
    Array.from(new Set(allCases.map((item) => item.dificuldade || "")))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  ), [allCases]);
  const filteredCases = useMemo(() => {
    const query = normalizeClinicalText(caseSearch);
    const hoje = todayStr();
    return allCases.filter((item) => {
      if (caseAreaFilter !== "all" && item.area !== caseAreaFilter) return false;
      if (caseDifficultyFilter !== "all" && item.dificuldade !== caseDifficultyFilter) return false;

      const progress = casosProgresso[item.id] || {};
      if (caseStatusFilter === "due" && !(progress.proximaData && progress.proximaData <= hoje)) return false;
      if (caseStatusFilter === "seen" && !(progress.vistos > 0)) return false;
      if (caseStatusFilter === "new" && progress.vistos > 0) return false;

      if (query) {
        const haystack = normalizeClinicalText([
          item.tema,
          item.diagnosticoFinal,
          item.area,
          item.subarea,
          item.id,
        ].filter(Boolean).join(" "));
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [allCases, caseSearch, caseAreaFilter, caseDifficultyFilter, caseStatusFilter, casosProgresso]);
  const hasCaseFilters = Boolean(
    caseSearch.trim()
    || caseAreaFilter !== "all"
    || caseDifficultyFilter !== "all"
    || caseStatusFilter !== "all"
  );
  const resetCaseFilters = () => {
    setCaseSearch("");
    setCaseAreaFilter("all");
    setCaseDifficultyFilter("all");
    setCaseStatusFilter("all");
  };
  const recommendedDrill = useMemo(() => selectNextDrill({
    scripts: allCases,
    casosProgresso,
    learningEvents,
    today: todayStr(),
  }), [allCases, casosProgresso, learningEvents]);

  React.useEffect(() => {
    if (recommendedDrillApplied || !recommendedDrill?.scriptId) return;
    setActiveCasoId(recommendedDrill.scriptId);
    setActiveFase(recommendedDrill.phase || "caso");
    if (recommendedDrill.drillType && recommendedDrill.drillType !== "drill0") {
      setActiveDrillType(recommendedDrill.drillType);
    }
    setRecommendedDrillApplied(true);
  }, [recommendedDrillApplied, recommendedDrill]);

  const casoBase = allCases.find((item) => item.id === activeCasoId) || allCases[0] || EMPTY_CLINICAL_CASE;
  const progresso = casosProgresso[casoBase?.id] || {};

  const allInstancesForScript = useMemo(() => {
    if (!casoBase?.id) return [];
    return caseInstances.filter(inst => inst.scriptId === casoBase.id);
  }, [casoBase?.id]);

  const activeInstance = useMemo(() => {
    const isOverdue = progresso.proximaData && progresso.proximaData <= todayStr();
    if (isOverdue) {
      const atypical = allInstancesForScript.find(inst => inst.presentation === "atypical");
      if (atypical) return atypical;
    }
    return allInstancesForScript.find(inst => inst.presentation === "typical") || allInstancesForScript[0] || {};
  }, [allInstancesForScript, progresso.proximaData]);

  const caso = useMemo(() => {
    return normalizeClinicalCase({
      ...casoBase,
      vinheta: activeInstance.vignette || casoBase.vinheta,
      keyFeatureAnswers: activeInstance.keyFeatureAnswers || casoBase.keyFeatureAnswers || [],
      expertReasoningTrace: activeInstance.expertReasoningTrace || casoBase.expertReasoningTrace || []
    });
  }, [casoBase, activeInstance]);

  const activeScript = useMemo(() => {
    return normalizeClinicalCase(illnessScripts.find(s => s.id === caso?.id) || caso);
  }, [caso]);

  const raciocinioScore = useMemo(() => calculateClinicalReasoningScore(casosProgresso), [casosProgresso]);
  const casosFeitos = useMemo(
    () => Object.values(casosProgresso || {}).filter((item) => item?.vistos > 0).length,
    [casosProgresso]
  );

  const registrar = (payload) => registrarCaso(plat, caso.id, payload);

  const activeConfusableSet = useMemo(() => {
    const allSets = buildConfusableSets(temas, allCases);
    const match = allSets.find((set) => {
      const resolved = set.members
        .map((member) => resolveConfusableCase(member, allCases, temas))
        .filter(Boolean);
      return resolved.some((item) => item.id === caso.id);
    });
    if (match) {
      const members = match.members
        .map((member) => resolveConfusableCase(member, allCases, temas))
        .filter(Boolean)
        .map((item) => item.id);
      if (new Set(members).size >= 2) {
        return {
          ...match,
          members: Array.from(new Set(members)).slice(0, 3),
        };
      }
    }

    const discriminatorMembers = [
      caso.id,
      ...(activeScript?.discriminators || [])
        .map((item) => resolveConfusableCase(item.vs, allCases, temas)?.id)
        .filter(Boolean),
    ];
    if (new Set(discriminatorMembers).size >= 2) {
      return {
        key: `script:${caso.id}`,
        members: Array.from(new Set(discriminatorMembers)).slice(0, 3),
        reason: "discriminadores do script",
      };
    }

    const areaCases = allCases.filter(c => c.area === caso.area);
    if (areaCases.length >= 2) {
      return {
        key: `fallback-area:${caso.area}`,
        members: areaCases.map(c => c.id).slice(0, 3),
        reason: `Diferenciais de ${caso.area}`
      };
    }
    return {
      key: `fallback-global`,
      members: allCases.map(c => c.id).slice(0, 3),
      reason: "Diferenciais gerais"
    };
  }, [caso, allCases, temas, activeScript]);

  const confusableCases = useMemo(() => {
    const seen = new Set();
    const resolved = activeConfusableSet.members
      .map((member) => resolveConfusableCase(member, allCases, temas))
      .filter(Boolean)
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    if (resolved.length >= 2) return resolved.slice(0, 3);

    return allCases
      .filter((item) => item.id === caso.id || item.area === caso.area)
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .slice(0, 3);
  }, [activeConfusableSet, allCases, temas, caso]);

  const confusableDrillItems = useMemo(() => {
    return confusableCases
      .map((item) => {
        const instance = caseInstances.find((inst) => inst.scriptId === item.id && inst.presentation === "typical")
          || caseInstances.find((inst) => inst.scriptId === item.id)
          || {};
        return {
          ...item,
          diagnosis: item.diagnosticoFinal || item.tema,
          vinheta: instance.vignette || item.vinheta,
          discriminator: findDiscriminatorFeature(item, caso, activeScript),
        };
      })
      .filter((item) => item.vinheta && item.discriminator)
      .slice(0, 3);
  }, [confusableCases, caso, activeScript]);

  const shuffledPistas = useMemo(() => {
    const pistas = confusableDrillItems.map(c => c.discriminator).filter(Boolean);
    return [...pistas].sort((a, b) => a.localeCompare(b));
  }, [confusableDrillItems]);

  const drillAOptions = useMemo(() => {
    const opts = new Set();
    if (caso.diagnosticoFinal) opts.add(caso.diagnosticoFinal);
    if (caso.diferenciais) {
      caso.diferenciais.forEach(d => {
        if (d.dx) opts.add(d.dx);
      });
    }
    if (opts.size < 3) {
      opts.add("Diagnóstico diferencial 1");
      opts.add("Diagnóstico diferencial 2");
    }
    return Array.from(opts);
  }, [caso]);

  const clinicalCalibrationStats = useMemo(() => {
    return learningEvents
      .filter((ev) => ev.source === "clinical_drill")
      .map((ev) => ({
        id: ev.id,
        previsao: ev.previsao ?? ev.performance?.previsao,
        acerto: ev.acerto ?? ev.performance?.acerto,
        questoes: ev.questoes ?? ev.performance?.questoes ?? 1,
        completedAt: ev.timestamp,
      }))
      .filter((sample) => sample.previsao !== null && sample.previsao !== undefined && sample.acerto !== null && sample.acerto !== undefined);
  }, [learningEvents]);

  const drillACalibration = useMemo(() => {
    if (!drillAResult) return null;
    const hasCurrentSample = clinicalCalibrationStats.some((sample) => (
      Number(sample.previsao) === Number(drillAResult.prediction)
      && Number(sample.acerto) === Number(drillAResult.accuracy)
      && String(sample.completedAt || "").slice(0, 10) === todayStr()
    ));
    const samples = hasCurrentSample
      ? clinicalCalibrationStats
      : [
          ...clinicalCalibrationStats,
          {
            id: "drill-a-current",
            previsao: drillAResult.prediction,
            acerto: drillAResult.accuracy,
            questoes: 1,
            completedAt: todayStr(),
          },
        ];
    return calcCalibration(samples, { minPreview: 1, minRequired: 1 });
  }, [clinicalCalibrationStats, drillAResult]);

  const rcgSourceScript = useMemo(() => {
    const query = normalizeClinicalText(caseDraft.tema || temaQuery);
    if (query) {
      const match = illnessScripts.find((script) => {
        const names = [script.id, script.tema, script.diagnosticoFinal, script.subtopic].map(normalizeClinicalText);
        return names.some((name) => name && (name === query || name.includes(query) || query.includes(name)));
      });
      if (match) return match;
    }
    return illnessScripts.find((script) => script.id === caso?.id) || activeScript;
  }, [caseDraft.tema, temaQuery, caso?.id, activeScript]);

  const generatedCaseJson = useMemo(() => {
    return generatedCaseDraft ? JSON.stringify(generatedCaseDraft, null, 2) : "";
  }, [generatedCaseDraft]);

  if (!allCases.length) {
    return (
      <Card className="text-center text-gray-500" style={{ padding: 28 }}>
        <p>Banco em construção — crie um caso clínico manual para começar.</p>
        <PremiumButton className="mt-3" onClick={() => setShowCreateCase(true)}>
          <Plus size={15} /> Criar caso clínico
        </PremiumButton>
      </Card>
    );
  }

  const handleCommitDrillA = () => {
    const keyFeature = activeScript.keyFeatures?.[0] || {};
    const isHypothesisCorrect = normalizeClinicalText(drillAHypothesis) === normalizeClinicalText(caso.diagnosticoFinal);
    const isKeyFeatureCorrect = textMatchesExpected(drillAKeyFeatureAnswer, keyFeature.expectedAction);
    const score = (isHypothesisCorrect ? 50 : 0) + (isKeyFeatureCorrect ? 50 : 0);
    const prediction = drillAConfidence / 10;
    const accuracy = score / 100;

    registrar({
      fase1Acerto: score,
      confianca: drillAConfidence,
      acertou: score >= 70,
      vistos: (progresso.vistos || 0) + 1,
      questoes: 1,
      tags: ["drillA", "calibration", "key_feature"],
      dominantError: score < 70 ? (drillAConfidence >= 8 ? "overconfidence" : "clinical_reasoning_gap") : null,
      meta: {
        drillType: "A",
        hypothesis: drillAHypothesis,
        expectedDiagnosis: caso.diagnosticoFinal,
        keyFeaturePrompt: keyFeature.prompt || "",
        keyFeatureAnswer: drillAKeyFeatureAnswer,
        expectedAction: keyFeature.expectedAction || "",
        hypothesisCorrect: isHypothesisCorrect,
        keyFeatureCorrect: isKeyFeatureCorrect,
      },
    });

    setDrillAScore(score);
    setDrillAResult({
      score,
      prediction,
      accuracy,
      isHypothesisCorrect,
      isKeyFeatureCorrect,
      expectedAction: keyFeature.expectedAction || "",
      keyFeaturePrompt: keyFeature.prompt || "",
    });
    setDrillAStep("reveal");

    abrirFechamento({
      outcome: score >= 80 ? "bom" : score >= 50 ? "medio" : "ruim",
      mainIssue: score < 80 ? "raciocinio" : "nenhum",
      nextAdjustment: score < 80 ? "caso" : "manter",
    });
  };

  const handleCommitDrillC = () => {
    if (confusableDrillItems.length < 2) return;
    let correct = 0;
    confusableDrillItems.forEach(c => {
      const assigned = drillCAssignments[c.id];
      if (assigned === c.discriminator) {
        correct += 1;
      }
    });

    const score = Math.round((correct / confusableDrillItems.length) * 100);

    registrar({
      sctAcerto: score,
      acertou: score === 100,
      vistos: (progresso.vistos || 0) + 1,
      questoes: confusableDrillItems.length,
      tags: ["drillC", "discrimination", "confusable_set"],
      dominantError: score < 100 ? "discrimination_gap" : null,
      meta: {
        drillType: "C",
        confusableSetKey: activeConfusableSet.key,
        confusableSetReason: activeConfusableSet.reason,
        answers: confusableDrillItems.map((item) => ({
          caseId: item.id,
          diagnosis: item.diagnosis,
          selected: drillCAssignments[item.id] || "",
          expected: item.discriminator,
          correct: drillCAssignments[item.id] === item.discriminator,
        })),
      },
    });

    setDrillCScore(score);
    setDrillCStep("reveal");

    abrirFechamento({
      outcome: score >= 80 ? "bom" : score >= 50 ? "medio" : "ruim",
      mainIssue: score < 100 ? "raciocinio" : "nenhum",
      nextAdjustment: score < 100 ? "caso" : "manter",
    });
  };

  const generateRcgDraft = () => {
    if (!rcgSourceScript?.id) {
      if (showToast) showToast("Selecione um illness script antes de gerar o rascunho.");
      return;
    }

    const draft = generateClinicalCaseDraft({
      script: rcgSourceScript,
      subtopic: caseDraft.subarea || rcgSourceScript.subtopic,
      presentation: generationPresentation,
    });
    setGeneratedCaseDraft(draft);
    setGeneratedDraftReviewed(false);
    setCaseDraft((prev) => ({
      ...prev,
      fonte: "rc_g_assisted_generation",
      tema: rcgSourceScript.tema || prev.tema,
      area: rcgSourceScript.area || prev.area,
      subarea: rcgSourceScript.subtopic || prev.subarea,
      vinheta: draft.vignette,
      diagnostico: rcgSourceScript.diagnosticoFinal || rcgSourceScript.tema || prev.diagnostico,
      diferenciais: draft.discriminators.map((item) => item.feature).join(", "),
      conduta: rcgSourceScript.management || prev.conduta,
    }));
    if (showToast) showToast("Rascunho RC-G gerado. Revise antes de salvar.");
  };

  const saveCustomCase = () => {
    if (!caseDraft.tema.trim() || !caseDraft.vinheta.trim()) return;
    if (caseDraft.fonte === "rc_g_assisted_generation" && !generatedDraftReviewed) {
      if (showToast) showToast("Revise e marque a revisão humana antes de salvar o rascunho RC-G.");
      return;
    }
    const nextCase = {
      id: `custom-${Date.now()}`,
      tema: caseDraft.tema.trim(),
      area: caseDraft.area.trim() || "Custom",
      subarea: caseDraft.subarea.trim() || "Caso criado",
      dificuldade: "media",
      source: caseDraft.fonte,
      reviewStatus: caseDraft.fonte === "rc_g_assisted_generation" ? "human_reviewed" : "manual",
      generatedDraft: caseDraft.fonte === "rc_g_assisted_generation" ? generatedCaseDraft : null,
      vinheta: caseDraft.vinheta.trim(),
      diagnosticoFinal: caseDraft.diagnostico.trim() || "Diagnostico a completar",
      justificativa: "Caso criado manualmente para treino vinculado ao cronograma.",
      workup: ["Definir exames iniciais", "Listar dados discriminantes"],
      diferenciais: [
        { dx: caseDraft.diagnostico.trim() || "Hipotese principal", plausibilidade: "principal", pista: "Compare com sinais discriminantes do caso." },
      ],
      script: {
        predisponentes: "Definir contexto e fatores de risco.",
        fisiopatologia: "Explicar mecanismo central.",
        achados: "Separar achados positivos e negativos importantes.",
        management: caseDraft.conduta.trim() || "Definir conduta educacional.",
      },
      sct: [
        {
          hipotese: caseDraft.diagnostico.trim() || "Hipotese principal",
          novaInfo: "Nova informacao discriminante",
          efeitoPainel: 0,
          racional: "Edite o caso no futuro para detalhar o racional.",
        },
      ],
      anamnese: {
        queixa: "Queixa guia do caso",
        roteiro: [{ bloco: "Dados discriminantes", perguntasChave: ["O que aumenta ou reduz a probabilidade da hipotese?"] }],
        redFlags: ["Definir sinais de alarme"],
      },
      keyFeatures: generatedCaseDraft?.keyFeatures || [],
      keyFeatureAnswers: (generatedCaseDraft?.keyFeatures || []).map((item) => item.expectedAction).filter(Boolean),
      expertReasoningTrace: generatedCaseDraft?.expertReasoningTrace || [],
      pertinentNegatives: generatedCaseDraft?.pertinentNegatives || [],
      discriminators: generatedCaseDraft?.discriminators || [],
      commonErrors: generatedCaseDraft?.commonErrors || [],
    };
    setMeta({ ...meta, clinicalCustomCases: [...customCases, nextCase] });
    setActiveCasoId(nextCase.id);
    setShowCreateCase(false);
    setWizardStep(1);
    setCaseDraft({ tema: "", temaId: null, area: "", subarea: "", fonte: "custom", vinheta: "", novaInfo1: "", novaInfo2: "", diagnostico: "", diferenciais: "", conduta: "" });
    setGeneratedCaseDraft(null);
    setGeneratedDraftReviewed(false);
    setTemaQuery("");
    if (showToast) showToast("Caso clinico criado e vinculado ao treino.");
  };

  const abrirFechamento = (payload) => {
    setClosureDraft({
      source: "raciocinio",
      tema: caso.tema,
      area: caso.area,
      ...payload,
    });
    setShowClosure(true);
  };

  const marcarPrecisoRelembrar = () => {
    registrar({ precisaRelembrar: true, confianca: 1, acertou: false, nextAdjustment: "illness_script" });
    abrirFechamento({
      outcome: "medio",
      mainIssue: "raciocinio",
      nextAdjustment: "illness_script",
    });
  };

  const revelarSct = () => {
    setSctRevelado(true);
    const total = caso.sct.length || 1;
    const score = caso.sct.reduce((sum, item, idx) => {
      const resposta = Number(sctRespostas[idx]);
      if (Number.isNaN(resposta)) return sum;
      const diff = Math.abs(resposta - item.efeitoPainel);
      return sum + Math.max(0, 100 - diff * 25);
    }, 0);
    const sctAcerto = Math.round(score / total);
    registrar({ sctAcerto, confianca: sctAcerto >= 75 ? 4 : 2, acertou: sctAcerto >= 75 });
    abrirFechamento({
      outcome: sctAcerto >= 80 ? "bom" : sctAcerto >= 60 ? "medio" : "ruim",
      mainIssue: sctAcerto < 80 ? "raciocinio" : "nenhum",
      nextAdjustment: sctAcerto < 80 ? "caso" : "manter",
    });
  };

  const revelarAnamnese = () => {
    setAnamneseRevelada(true);
    const totalPerguntas = caso.anamnese.roteiro.reduce((sum, bloco) => sum + bloco.perguntasChave.length, 0);
    const marcadas = Object.values(anamneseChecks).filter(Boolean).length;
    registrar({ anamneseCobertura: totalPerguntas ? Math.round((marcadas / totalPerguntas) * 100) : 0, acertou: marcadas >= Math.ceil(totalPerguntas * 0.6) });
    abrirFechamento({
      outcome: marcadas >= Math.ceil(totalPerguntas * 0.6) ? "bom" : "medio",
      mainIssue: marcadas >= Math.ceil(totalPerguntas * 0.6) ? "nenhum" : "raciocinio",
      nextAdjustment: marcadas >= Math.ceil(totalPerguntas * 0.6) ? "manter" : "caso",
    });
  };

  // P4-D: revelar e pontuar conduta simulada
  const revelarConduta = () => {
    setConductaRevelada(true);
    // Score por cobertura: campos preenchidos / total
    const preenchidos = CONDUTA_FIELDS.filter((f) =>
      String(conductaRespostas[f.key] || "").trim().length >= 5
    ).length;
    const managementScore = Math.round((preenchidos / CONDUTA_FIELDS.length) * 100);
    registrar({
      managementScore,
      acertou: managementScore >= 60,
      confianca: managementScore >= 75 ? 4 : 2,
    });
    abrirFechamento({
      outcome: managementScore >= 80 ? "bom" : managementScore >= 60 ? "medio" : "ruim",
      mainIssue: managementScore < 80 ? "raciocinio" : "nenhum",
      nextAdjustment: managementScore < 80 ? "caso" : "manter",
    });
  };

  return (
    <div className="flex flex-col gap-4 med-animate-in text-left">
      <Card
        variant="elevated"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ background: "linear-gradient(180deg, rgba(147,51,234,.1), rgba(59,130,246,.045)), var(--med-surface-0)" }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-200">
              <Stethoscope size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="purple">P4 clínico</Badge>
                <Tooltip content="Treino faseado com illness scripts, casos estruturados, Script Concordance e anamnese dirigida.">
                  <span className="grid h-6 w-6 cursor-help place-items-center rounded-full border border-white/10 bg-white/5 text-[10px] font-black text-gray-400">i</span>
                </Tooltip>
              </div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white">Raciocínio Clínico</h2>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-[12px] leading-relaxed text-gray-400">
            Treine transferência clínica com scripts, diferenciais, SCT, anamnese dirigida e conduta educacional.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex flex-wrap justify-end gap-2">
            <PremiumButton variant="secondary" onClick={() => setShowWhy(true)}>Por que usar?</PremiumButton>
            <PremiumButton onClick={() => setShowCreateCase(true)}><Plus size={15} /> Criar caso clínico</PremiumButton>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <MetricRing value={raciocinioScore || 0} label="score" tone="purple" size={62} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Casos vistos</p>
              <p className="text-2xl font-black text-white tabular-nums">{casosFeitos}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
        {casosFeitos === 0 && (
          <EmptyState
            icon={Stethoscope}
            title="Treine seu primeiro caso clinico"
            description="Comece com um caso ligado ao seu cronograma ou um caso recomendado pelo Mentor."
            primaryAction={{
              label: "Iniciar caso",
              onClick: () => {
                setActiveCasoId(recommendedDrill?.scriptId || CASOS_CLINICOS[0]?.id || "");
                setActiveFase(recommendedDrill?.phase || "caso");
                if (recommendedDrill?.drillType && recommendedDrill.drillType !== "drill0") {
                  setActiveDrillType(recommendedDrill.drillType);
                }
                setDrillBStep("diagnostico");
                setLeadDiagnosis("");
                setConfidence(5);
                setApoiaItems([]);
                setContraItems([]);
                setFaltaItems([]);
                setCustomItemText("");
                setAutoExplanation("");
                setDrillBScore(null);
                setFlashcardCreated(false);
                setContrastStarted(false);
                setDrillAStep("diagnostico");
                setDrillAHypothesis("");
                setDrillAConfidence(5);
                setDrillAKeyFeatureAnswer("");
                setDrillAScore(null);
                setDrillCStep("jogo");
                setDrillCAssignments({});
                setDrillCSelectedCaseId(null);
                setDrillCScore(null);
              },
            }}
            className="lg:col-span-2"
          />
        )}
        <aside className="min-h-0 lg:sticky lg:top-3 lg:max-h-[calc(100dvh-132px)]">
          <div className="flex min-h-0 flex-col gap-2 lg:max-h-[calc(100dvh-132px)]">
            <Card className="shrink-0 space-y-2" style={{ padding: 12 }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-blue-300" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Temas</span>
                </div>
                <span className="text-[10px] font-bold tabular-nums text-gray-500">
                  {filteredCases.length}/{allCases.length}
                </span>
              </div>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <Input
                  value={caseSearch}
                  onChange={(event) => setCaseSearch(event.target.value)}
                  placeholder="Pesquisar tema, area, diagnostico..."
                  className="pl-9 pr-8 text-[12px]"
                />
                {caseSearch && (
                  <button
                    type="button"
                    aria-label="Limpar pesquisa"
                    onClick={() => setCaseSearch("")}
                    className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-lg border border-transparent bg-transparent text-gray-600 transition-colors hover:border-white/10 hover:text-gray-300"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                <select
                  value={caseAreaFilter}
                  onChange={(event) => setCaseAreaFilter(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-black px-3 py-2 text-[12px] text-white outline-none transition-colors focus:border-blue-500"
                >
                  <option value="all">Todas as areas</option>
                  {caseAreaOptions.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={caseDifficultyFilter}
                    onChange={(event) => setCaseDifficultyFilter(event.target.value)}
                    className="w-full cursor-pointer rounded-xl border border-white/10 bg-black px-3 py-2 text-[12px] text-white outline-none transition-colors focus:border-blue-500"
                  >
                    <option value="all">Dificuldade</option>
                    {caseDifficultyOptions.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                  <select
                    value={caseStatusFilter}
                    onChange={(event) => setCaseStatusFilter(event.target.value)}
                    className="w-full cursor-pointer rounded-xl border border-white/10 bg-black px-3 py-2 text-[12px] text-white outline-none transition-colors focus:border-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="due">Vencidos</option>
                    <option value="seen">Vistos</option>
                    <option value="new">Novos</option>
                  </select>
                </div>
              </div>
              {hasCaseFilters && (
                <button
                  type="button"
                  onClick={resetCaseFilters}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-gray-300 transition-colors hover:bg-white/10"
                >
                  <X size={13} /> Limpar filtros
                </button>
              )}
            </Card>

            <div className="min-h-[280px] space-y-2 overflow-y-auto pr-1 lg:min-h-0 lg:flex-1">
              {filteredCases.map((item) => {
                const ativo = item.id === caso.id;
                const p = casosProgresso[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveCasoId(item.id);
                      setScriptAberto(false);
                      setSctRevelado(false);
                      setAnamneseRevelada(false);
                      setConductaRevelada(false);
                      setConductaRespostas({});
                      setConductaAvisoAceito(false);
                      setDrillBStep("diagnostico");
                      setLeadDiagnosis("");
                      setConfidence(5);
                      setApoiaItems([]);
                      setContraItems([]);
                      setFaltaItems([]);
                      setCustomItemText("");
                      setAutoExplanation("");
                      setDrillBScore(null);
                      setFlashcardCreated(false);
                      setContrastStarted(false);
                      setDrillAStep("diagnostico");
                      setDrillAHypothesis("");
                      setDrillAConfidence(5);
                      setDrillAKeyFeatureAnswer("");
                      setDrillAScore(null);
                      setDrillCStep("jogo");
                      setDrillCAssignments({});
                      setDrillCSelectedCaseId(null);
                      setDrillCScore(null);
                    }}
                    className="w-full text-left transition-all"
                    style={{ background: "transparent", border: 0, padding: 0 }}
                  >
                    <Card interactive selected={ativo} style={{ padding: 12 }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 flex-1 text-[12px] font-black leading-snug text-gray-100">{item.tema}</span>
                        <span className={`shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded border ${dificuldadeClass(item.dificuldade)}`}>
                          {item.dificuldade}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10.5px] leading-snug text-gray-500">{item.area} · {item.subarea}</p>
                      {p?.proximaData && (
                        <p className="text-[10px] text-blue-300 mt-2 flex items-center gap-1">
                          <CalendarDays size={11} /> reencontro {fmtRelativo(p.proximaData)}
                        </p>
                      )}
                    </Card>
                  </button>
                );
              })}
              {filteredCases.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center">
                  <p className="text-[12px] font-bold text-gray-300">Nenhum tema encontrado</p>
                  {hasCaseFilters && (
                    <button
                      type="button"
                      onClick={resetCaseFilters}
                      className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-gray-300 transition-colors hover:bg-white/10"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        <Card className="flex flex-col gap-4" style={{ padding: 18 }}>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge tone="blue">{caso.area}</Badge>
              <span className="text-[10px] text-gray-500 font-mono">{caso.id}</span>
              {progresso.vistos > 0 && <Badge tone="green">{progresso.vistos} encontro(s)</Badge>}
            </div>
            <h3 className="text-lg font-black text-white">{caso.tema}</h3>
            <p className="text-[13px] text-gray-300 leading-relaxed mt-2">{caso.vinheta}</p>
            <button
              type="button"
              onClick={marcarPrecisoRelembrar}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] font-black text-amber-200 hover:bg-amber-500/20"
            >
              <RefreshCw size={13} />
              Preciso relembrar
            </button>
          </div>

          <SegmentedControl
            ariaLabel="Fases do treino clínico"
            className="max-w-full overflow-x-auto"
            onChange={setActiveFase}
            options={FASES.map((fase) => ({ value: fase.k, label: fase.label }))}
            value={activeFase}
          />

          {activeFase === "script" && (
            <div className="space-y-4">
              {drillStep === "idle" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/5 bg-black/25 p-4">
                    <p className="text-[12px] text-gray-300 leading-relaxed">
                      O <strong>Drill 0 (Fixar o Script)</strong> treina o active recall gerativo para fixar o illness script completo da doença base na memória de longo prazo antes de aplicá-lo.
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Estrutura Completa</span>
                        <p className="mt-1 text-[11.5px] text-gray-400">Recupere de memória os 7 compartimentos essenciais: predisponentes, mecanismo, quadro, diferenciais, workup, conduta e red flags.</p>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Andaime Inteligente</span>
                        <p className="mt-1 text-[11.5px] text-gray-400">Os compartimentos mais consolidados em sua memória terão as dicas/labels ocultadas (andaime desvanecido) para um desafio superior.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <PremiumButton onClick={startDrill0}>
                      <Brain size={15} className="mr-1.5" /> Iniciar Drill 0: Recall de Memória
                    </PremiumButton>
                    
                    <PremiumButton variant="secondary" onClick={() => setScriptAberto((v) => !v)}>
                      <Eye size={15} className="mr-1.5" /> {scriptAberto ? "Ocultar Script Canônico" : "Ver Script Canônico"}
                    </PremiumButton>
                  </div>

                  {scriptAberto && (
                    <div className="grid gap-2 sm:grid-cols-2 med-animate-in">
                      {Object.keys(COMPARTIMENTOS_METADATA).map((compKey) => {
                        const metaInfo = COMPARTIMENTOS_METADATA[compKey];
                        const canonicalText = metaInfo.canonicalPath(caso);
                        return (
                          <Card key={compKey} style={{ padding: 12, background: "rgba(0,0,0,.22)" }}>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{metaInfo.label}</p>
                            <p className="text-[12px] text-gray-200 mt-1 leading-relaxed whitespace-pre-line">{canonicalText}</p>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {drillStep === "direction" && (
                <div className="space-y-4 med-animate-in">
                  <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Drill 0 · Etapa 1</span>
                    <h4 className="mt-1 text-lg font-black text-white">
                      {drillDirection === "doenca_to_achados" ? "Doença ➔ Achados" : "Achado ➔ Doença"}
                    </h4>
                    
                    {drillDirection === "doenca_to_achados" ? (
                      <div className="mt-4 space-y-4">
                        <p className="text-[13px] text-gray-300 leading-relaxed">
                          Você vai reconstruir o illness script da doença base:
                        </p>
                        <p className="text-xl font-black text-purple-200 uppercase tracking-wide">
                          {caso.tema}
                        </p>
                        <PremiumButton onClick={() => setDrillStep("despejo")}>
                          Avançar para o Despejo Livre
                        </PremiumButton>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4 max-w-md mx-auto">
                        <p className="text-[13px] text-gray-300 leading-relaxed">
                          Identifique o diagnóstico que apresenta o seguinte quadro clínico cardinal:
                        </p>
                        <div className="rounded-xl bg-black/30 border border-white/5 p-3 text-[12px] text-gray-200 italic leading-relaxed">
                          "{caso.script?.consequences || COMPARTIMENTOS_METADATA.consequences.canonicalPath(caso)}"
                        </div>
                        
                        <div className="space-y-2 text-left">
                          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-500">Qual é o diagnóstico líder?</label>
                          <Input
                            placeholder="Escreva sua hipótese diagnóstica..."
                            value={writtenDiagnosis}
                            onChange={(e) => setWrittenDiagnosis(e.target.value)}
                          />
                        </div>

                        {diagnosisFeedback === null ? (
                          <PremiumButton 
                            disabled={!writtenDiagnosis.trim()} 
                            onClick={() => {
                              const input = writtenDiagnosis.trim().toLowerCase();
                              const finalDx = caso.diagnosticoFinal.toLowerCase();
                              const isMatch = input.includes(finalDx) || finalDx.includes(input) || (caso.diferenciais || []).some(d => d.dx.toLowerCase().includes(input) && d.plausibilidade === "alta");
                              setDiagnosisFeedback(isMatch ? "correct" : "incorrect");
                            }}
                          >
                            Verificar Diagnóstico
                          </PremiumButton>
                        ) : (
                          <div className="space-y-4">
                            <div className={`rounded-xl p-3 text-[12px] font-bold ${diagnosisFeedback === "correct" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border border-red-500/20 text-red-300"}`}>
                              {diagnosisFeedback === "correct" ? "Excelente! Diagnóstico identificado com sucesso." : `Incorreto. O diagnóstico de referência é: ${caso.diagnosticoFinal}`}
                            </div>
                            <PremiumButton onClick={() => setDrillStep("despejo")}>
                              Iniciar Recall Completo
                            </PremiumButton>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {drillStep === "despejo" && (
                <div className="space-y-4 med-animate-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Drill 0 · Etapa 2</span>
                      <h4 className="text-base font-black text-white">Despejo Livre de Memória</h4>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[12px] font-mono font-bold text-purple-300">
                      <span>00:{String(timerCount).padStart(2, "0")}</span>
                    </div>
                  </div>
                  
                  <p className="text-[12.5px] text-gray-300 leading-relaxed">
                    Escreva o máximo de informações e palavras-chave que você lembra sobre <strong className="text-white">{caso.tema}</strong>. Não se preocupe com formato agora.
                  </p>

                  <Textarea
                    rows={6}
                    value={despejoText}
                    onChange={(e) => setDespejoText(e.target.value)}
                    placeholder="Comece a digitar aqui..."
                    autoFocus
                  />

                  <PremiumButton onClick={() => setDrillStep("mapeamento")}>
                    Próximo: Mapear nos Compartimentos
                  </PremiumButton>
                </div>
              )}

              {drillStep === "mapeamento" && (
                <div className="space-y-4 med-animate-in">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Drill 0 · Etapa 3</span>
                    <h4 className="text-base font-black text-white">Mapeamento em Compartimentos</h4>
                    <p className="mt-1 text-[12.5px] text-gray-400">Distribua suas ideias organizando-as de acordo com a estrutura do illness script:</p>
                  </div>

                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                    {Object.keys(COMPARTIMENTOS_METADATA).map((compKey) => {
                      const metaInfo = COMPARTIMENTOS_METADATA[compKey];
                      const compData = (progresso.compartimentos || {})[compKey] || {};
                      const mastery = compData.mastery ?? 0.3;
                      const isFaded = mastery >= 0.7;
                      const isRevealed = !!revealedCompartments[compKey];

                      if (isFaded && !isRevealed) {
                        return (
                          <div key={compKey} className="rounded-2xl border border-white/5 bg-black/40 p-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[12px] font-black text-gray-400 flex items-center gap-1.5">
                                Compartimento Oculto (Maestria: {Math.round(mastery * 100)}%)
                              </p>
                              <p className="text-[10.5px] text-gray-600 mt-0.5">Scaffolding Faded: Recorde o nome e conteúdo do compartimento por conta própria.</p>
                            </div>
                            <PremiumButton 
                              variant="secondary" 
                              onClick={() => setRevealedCompartments(prev => ({ ...prev, [compKey]: true }))}
                            >
                              Revelar Guia
                            </PremiumButton>
                          </div>
                        );
                      }

                      return (
                        <div key={compKey} className="space-y-1">
                          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-300">
                            {metaInfo.label} {isFaded && <span className="text-purple-300 font-mono text-[9px] uppercase px-1 border border-purple-500/20 rounded">(faded)</span>}
                          </label>
                          <Textarea
                            rows={2}
                            value={recallData[compKey] || ""}
                            onChange={(e) => setRecallData(prev => ({ ...prev, [compKey]: e.target.value }))}
                            placeholder={`Despeje o recall de memória para ${metaInfo.label.toLowerCase()}...`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <PremiumButton onClick={() => setDrillStep("autoavaliacao")}>
                    Próximo: Autoavaliar
                  </PremiumButton>
                </div>
              )}

              {drillStep === "autoavaliacao" && (
                <div className="space-y-4 med-animate-in">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Drill 0 · Etapa 4</span>
                    <h4 className="text-base font-black text-white">Autoavaliação e Revelação</h4>
                    <p className="mt-1 text-[12px] text-gray-400">Compare o que você recordou (à esquerda) com o script canônico do especialista (à direita) e avalie honestamente cada compartimento.</p>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {Object.keys(COMPARTIMENTOS_METADATA).map((compKey) => {
                      const metaInfo = COMPARTIMENTOS_METADATA[compKey];
                      const userText = recallData[compKey] || despejoText || "(Em branco)";
                      const canonicalText = metaInfo.canonicalPath(caso);
                      const currentRating = compartmentRatings[compKey];

                      return (
                        <Card key={compKey} style={{ padding: 14, background: "rgba(0,0,0,.22)" }}>
                          <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 mb-2">{metaInfo.label}</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl bg-black/40 border border-white/5 p-3">
                              <p className="text-[10px] uppercase font-bold text-gray-500">Seu Recall</p>
                              <p className="mt-1 text-[12px] text-gray-300 leading-relaxed whitespace-pre-line">{userText}</p>
                            </div>
                            <div className="rounded-xl bg-purple-950/10 border border-purple-500/10 p-3">
                              <p className="text-[10px] uppercase font-bold text-purple-400">Canônico</p>
                              <p className="mt-1 text-[12px] text-gray-200 leading-relaxed whitespace-pre-line">{canonicalText}</p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/5">
                            <span className="text-[10px] text-gray-500">Avalie seu recall deste compartimento:</span>
                            <div className="flex gap-1">
                              {[
                                { k: "vermelho", label: "Não recordei", class: "border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20" },
                                { k: "amarelo", label: "Parcial", class: "border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20" },
                                { k: "verde", label: "Total", class: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20" }
                              ].map((btn) => {
                                const selected = currentRating === btn.k;
                                return (
                                  <button
                                    key={btn.k}
                                    type="button"
                                    onClick={() => setCompartmentRatings(prev => ({ ...prev, [compKey]: btn.k }))}
                                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${selected ? "bg-white/10 text-white border-white" : btn.class}`}
                                  >
                                    {btn.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  <PremiumButton 
                    onClick={finishDrill0}
                    disabled={Object.values(compartmentRatings).some(v => v === null)}
                  >
                    Concluir Drill 0 e Ir para Aplicação
                  </PremiumButton>
                </div>
              )}
            </div>
          )}

          {activeFase === "caso" && (
            <div className="space-y-4 med-animate-in text-left">
              {/* Seletor de Modo de Drill */}
              <div className="flex flex-col gap-2 border-b border-white/5 pb-3">
                <span className="text-[9px] font-black uppercase tracking-wider text-purple-400">
                  Selecione o tipo de Drill clínico
                </span>
                <SegmentedControl
                  ariaLabel="Tipo de Drill"
                  className="w-full"
                  onChange={setActiveDrillType}
                  options={[
                    { value: "drillA", label: "Drill A: Gestalt / Calibração" },
                    { value: "drillB", label: "Drill B: Defenda o Diagnóstico" },
                    { value: "drillC", label: "Drill C: Separe os Gêmeos" }
                  ]}
                  value={activeDrillType}
                />
              </div>

              {/* DRILL A: PRIMEIRA IMPRESSÃO */}
              {activeDrillType === "drillA" && (
                <div className="space-y-4">
                  {drillAStep === "diagnostico" && (
                    <div className="space-y-4 med-animate-in">
                      <div className="rounded-2xl border border-white/5 bg-black/25 p-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Vinheta Clínica</p>
                        <p className="text-[13.5px] text-gray-200 leading-relaxed font-serif italic">
                          "{caso.vinheta}"
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300">
                          Sua primeira impressão (Gestalt diagnóstica):
                        </label>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {drillAOptions.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setDrillAHypothesis(opt)}
                              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                                drillAHypothesis === opt
                                  ? "bg-purple-600 text-white border-purple-500 shadow-lg"
                                  : "bg-white/5 text-gray-300 border-white/5 hover:bg-white/10"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 flex justify-between">
                          <span>Nível de confiança diagnóstica:</span>
                          <span className="text-purple-300 font-mono font-bold">{drillAConfidence}/10</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={drillAConfidence}
                          onChange={(e) => setDrillAConfidence(Number(e.target.value))}
                          className="w-full accent-purple-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase px-1">
                          <span>1 - Palpite</span>
                          <span>5 - Provável</span>
                          <span>10 - Certeza</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300">
                          Key Feature: {activeScript.keyFeatures?.[0]?.prompt || "Qual é a conduta ou exame crítico de confirmação?"}
                        </label>
                        <Textarea
                          placeholder="Digite aqui o passo de decisão crítico..."
                          value={drillAKeyFeatureAnswer}
                          onChange={(e) => setDrillAKeyFeatureAnswer(e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div className="pt-2">
                        <PremiumButton
                          fullWidth
                          disabled={!drillAHypothesis || !drillAKeyFeatureAnswer.trim()}
                          onClick={handleCommitDrillA}
                        >
                          Comprometer Decisão
                        </PremiumButton>
                      </div>
                    </div>
                  )}

                  {drillAStep === "reveal" && (
                    <div className="space-y-4 med-animate-in">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Seu pensamento */}
                        <div className="rounded-xl border border-white/5 bg-black/30 p-4 space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Sua Resposta</span>
                          <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase">Hipótese Principal</p>
                            <p className={`text-sm font-black mt-0.5 ${
                              drillAHypothesis === caso.diagnosticoFinal ? "text-emerald-400" : "text-red-400"
                            }`}>
                              {drillAHypothesis} {drillAHypothesis === caso.diagnosticoFinal ? "✓" : "✗"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase">Confiança Estimada</p>
                            <p className="text-sm font-black text-white mt-0.5">{drillAConfidence}/10</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase">Key Feature Respondido</p>
                            <p className="text-sm text-gray-300 mt-0.5 italic">"{drillAKeyFeatureAnswer}"</p>
                          </div>
                        </div>

                        {/* Expert */}
                        <div className="rounded-xl border border-purple-500/10 bg-purple-950/5 p-4 space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">Gabarito do Especialista</span>
                          <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase">Diagnóstico Correto</p>
                            <p className="text-sm font-black text-purple-300 mt-0.5">{caso.diagnosticoFinal}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase">Key Feature Esperado</p>
                            <p className="text-[12px] text-emerald-300 font-black mt-0.5">{activeScript.keyFeatures?.[0]?.expectedAction}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase">Justificativa Clínica</p>
                            <p className="text-[12.5px] text-gray-300 mt-0.5 leading-relaxed">{caso.justificativa}</p>
                          </div>
                        </div>
                      </div>

                      {/* Calibração metacognitiva */}
                      {drillACalibration && drillAResult && (() => {
                        const cal = drillACalibration;
                        let alertTone = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                        let trendLabel = "Calibrado";
                        if (cal.tendencia === "excesso_confianca") {
                          alertTone = "text-red-400 bg-red-500/10 border-red-500/20";
                          trendLabel = "Excesso de Confiança";
                        } else if (cal.tendencia === "subestima") {
                          alertTone = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                          trendLabel = "Subestimação";
                        }
                        const currentGap = Math.round((drillAResult.prediction - drillAResult.accuracy) * 100);

                        return (
                          <Card style={{ padding: 14, background: "rgba(0,0,0,.22)" }}>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2.5 mb-3">
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                                Feedback de Calibração
                              </span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${alertTone}`}>
                                {trendLabel}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center mb-3">
                              <div className="bg-black/30 rounded-xl p-2 border border-white/5">
                                <p className="text-[9px] font-bold text-gray-500 uppercase">Score do caso</p>
                                <p className="text-base font-black text-white mt-0.5">{drillAScore}%</p>
                              </div>
                              <div className="bg-black/30 rounded-xl p-2 border border-white/5">
                                <p className="text-[9px] font-bold text-gray-500 uppercase">Precisão global</p>
                                <p className="text-base font-black text-purple-300 mt-0.5">{cal.precisao ?? "--"}%</p>
                              </div>
                              <div className="bg-black/30 rounded-xl p-2 border border-white/5">
                                <p className="text-[9px] font-bold text-gray-500 uppercase">Gap atual</p>
                                <p className={`text-base font-black mt-0.5 ${currentGap > 0 ? "text-red-300" : currentGap < 0 ? "text-amber-300" : "text-emerald-300"}`}>
                                  {currentGap > 0 ? `+${currentGap}%` : `${currentGap}%`}
                                </p>
                              </div>
                            </div>
                            <p className="text-[12px] text-gray-300 leading-relaxed">
                              Você previu {Math.round(drillAResult.prediction * 100)}% e entregou {Math.round(drillAResult.accuracy * 100)}%.
                              {drillAResult.isKeyFeatureCorrect
                                ? " A pergunta de key feature sustentou a hipótese."
                                : " A pergunta de key feature não confirmou a hipótese no nível esperado."}
                            </p>
                            <p className="text-[11px] text-purple-300 mt-2 font-bold border-t border-white/5 pt-2 italic">
                              Próximo ajuste: <span className="font-normal text-gray-300">{cal.action}</span>
                            </p>
                          </Card>
                        );
                      })()}

                      <div className="flex gap-2 pt-1">
                        <PremiumButton
                          onClick={() => {
                            setDrillAStep("diagnostico");
                            setDrillAHypothesis("");
                            setDrillAConfidence(5);
                            setDrillAKeyFeatureAnswer("");
                            setDrillAScore(null);
                            setDrillAResult(null);
                          }}
                        >
                          Tentar Outro Caso (Drill A)
                        </PremiumButton>
                        <PremiumButton
                          variant="secondary"
                          onClick={() => {
                            setActiveDrillType("drillB");
                            setDrillBStep("diagnostico");
                          }}
                        >
                          Seguir para Drill B
                        </PremiumButton>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DRILL B: DEFENDA O DIAGNÓSTICO (Original) */}
              {activeDrillType === "drillB" && (
                <div className="space-y-4">
                  {/* Stepper indicator */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
                      <Brain size={12} /> Drill B · Defenda o Diagnóstico
                    </span>
                    <div className="flex items-center gap-1">
                      {["diagnostico", "colunas", "autoexplicacao", "reveal"].map((step, idx) => {
                        const stepLabels = ["Diagnóstico", "Justificativa", "Compromisso", "Resultado"];
                        const active = drillBStep === step;
                        const completed = 
                          (step === "diagnostico" && drillBStep !== "diagnostico") ||
                          (step === "colunas" && (drillBStep === "autoexplicacao" || drillBStep === "reveal")) ||
                          (step === "autoexplicacao" && drillBStep === "reveal");
                        
                        return (
                          <div key={step} className="flex items-center" title={stepLabels[idx]}>
                            <span className={`h-1.5 w-6 rounded-full transition-all ${
                              active ? "bg-purple-500" : completed ? "bg-purple-600/50" : "bg-white/10"
                            }`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 1: Diagnóstico Líder */}
                  {drillBStep === "diagnostico" && (
                    <div className="space-y-4 med-animate-in">
                      <div className="rounded-2xl border border-white/5 bg-black/25 p-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Vinheta Clínica</p>
                        <p className="text-[13.5px] text-gray-200 leading-relaxed font-serif italic">
                          "{caso.vinheta}"
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300">
                          Qual é o seu diagnóstico líder principal? (Geração/Write-in)
                        </label>
                        <Input
                          placeholder="Ex: Apendicite Aguda, SCA com supra..."
                          value={leadDiagnosis}
                          onChange={(e) => setLeadDiagnosis(e.target.value)}
                          autoFocus
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 flex justify-between">
                          <span>Qual é o seu grau de confiança neste diagnóstico?</span>
                          <span className="text-purple-300 font-mono font-bold">
                            {confidence}/10 ({confidence >= 8 ? "Alta" : confidence >= 5 ? "Média" : "Baixa"})
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={confidence}
                            onChange={(e) => setConfidence(Number(e.target.value))}
                            className="w-full accent-purple-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase px-1">
                          <span>1 - Palpite</span>
                          <span>5 - Provável</span>
                          <span>10 - Certeza Absoluta</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <PremiumButton
                          fullWidth
                          disabled={!leadDiagnosis.trim()}
                          onClick={() => setDrillBStep("colunas")}
                        >
                          Avançar para Justificativa
                        </PremiumButton>
                      </div>
                    </div>
                  )}

                  {/* Step 2: 3 Colunas Justificativa */}
                  {drillBStep === "colunas" && (
                    <div className="space-y-4 med-animate-in">
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                          Justificativa Estruturada
                        </h4>
                        <p className="text-[11.5px] text-gray-400 mt-0.5 leading-normal">
                          Classifique as informações clínicas nas colunas correspondentes para defender o seu diagnóstico (<strong className="text-purple-300">{leadDiagnosis}</strong>).
                        </p>
                      </div>

                      {/* 3 Columns Display */}
                      <div className="grid gap-3 md:grid-cols-3">
                        {(() => {
                          const renderColumnList = (title, items, type, colorClass, headerBg) => {
                            return (
                              <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/30 overflow-hidden">
                                <div className={`px-3 py-2 border-b border-white/5 font-black text-[10px] uppercase tracking-wider ${headerBg} flex items-center justify-between`}>
                                  <span className={colorClass}>{title}</span>
                                  <Badge tone={type === "apoia" ? "green" : type === "contra" ? "red" : "yellow"}>
                                    {items.length}
                                  </Badge>
                                </div>
                                <div className="p-3 flex-1 min-h-[100px] flex flex-col gap-1.5">
                                  {items.length === 0 ? (
                                    <p className="text-[11px] text-gray-600 italic my-auto text-center">Nenhum item</p>
                                  ) : (
                                    items.map((item, index) => (
                                      <div key={index} className="flex items-center justify-between gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 border border-white/5">
                                        <span className="text-[11.5px] text-gray-300 leading-normal">{item}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (type === "apoia") setApoiaItems(prev => prev.filter(x => x !== item));
                                            if (type === "contra") setContraItems(prev => prev.filter(x => x !== item));
                                            if (type === "falta") setFaltaItems(prev => prev.filter(x => x !== item));
                                          }}
                                          className="text-gray-500 hover:text-red-400 transition-colors p-0.5"
                                          style={{ background: "transparent", border: 0 }}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            );
                          };

                          return (
                            <>
                              {renderColumnList("APOIA (Achados presentes)", apoiaItems, "apoia", "text-emerald-300", "bg-emerald-500/5")}
                              {renderColumnList("CONTRA (Negativos pertinentes)", contraItems, "contra", "text-red-300", "bg-red-500/5")}
                              {renderColumnList("FALTA (Ausente mas esperado)", faltaItems, "falta", "text-amber-300", "bg-amber-500/5")}
                            </>
                          );
                        })()}
                      </div>

                      {/* Manual custom input */}
                      <div className="rounded-xl border border-white/5 bg-white/5 p-3 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Digitar pista personalizada</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ex: Ausência de febre, Blumberg positivo..."
                            value={customItemText}
                            onChange={(e) => setCustomItemText(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <PremiumButton
                            variant="secondary"
                            size="sm"
                            disabled={!customItemText.trim()}
                            onClick={() => {
                              handleAddSuggestion(customItemText.trim(), "apoia");
                              setCustomItemText("");
                            }}
                          >
                            + Apoia
                          </PremiumButton>
                          <PremiumButton
                            variant="secondary"
                            size="sm"
                            disabled={!customItemText.trim()}
                            onClick={() => {
                              handleAddSuggestion(customItemText.trim(), "contra");
                              setCustomItemText("");
                            }}
                          >
                            - Contra
                          </PremiumButton>
                          <PremiumButton
                            variant="secondary"
                            size="sm"
                            disabled={!customItemText.trim()}
                            onClick={() => {
                              handleAddSuggestion(customItemText.trim(), "falta");
                              setCustomItemText("");
                            }}
                          >
                            ? Falta
                          </PremiumButton>
                        </div>
                      </div>

                      {/* Suggestions list from IllnessScript (pertinentNegatives, workup, keyFeatures) */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pistas sugeridas pelo caso (toque para classificar)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(() => {
                            const suggestions = new Set();
                            activeScript.pertinentNegatives?.forEach(x => suggestions.add(x));
                            activeScript.workup?.forEach(x => suggestions.add(x));
                            activeScript.keyFeatures?.forEach(x => suggestions.add(x.expectedAction));
                            
                            if (suggestions.size === 0) {
                              suggestions.add("Febre");
                              suggestions.add("Irritação peritoneal");
                              suggestions.add("Exames laboratoriais");
                            }

                            return Array.from(suggestions).map((item) => {
                              const alreadyApoia = apoiaItems.includes(item);
                              const alreadyContra = contraItems.includes(item);
                              const alreadyFalta = faltaItems.includes(item);

                              let activeClass = "bg-white/5 text-gray-300 border-white/5 hover:bg-white/10";
                              if (alreadyApoia) activeClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                              if (alreadyContra) activeClass = "bg-red-500/20 text-red-300 border-red-500/30";
                              if (alreadyFalta) activeClass = "bg-amber-500/20 text-amber-300 border-amber-500/30";

                              return (
                                <div key={item} className={`flex items-center rounded-xl border text-[11px] font-bold overflow-hidden transition-all ${activeClass}`}>
                                  <span className="px-2.5 py-1.5">{item}</span>
                                  <div className="flex border-l border-white/5">
                                    <button
                                      type="button"
                                      title="Apoia (Presente)"
                                      onClick={() => handleAddSuggestion(item, "apoia")}
                                      className="px-2 py-1.5 hover:bg-emerald-500/30 text-emerald-400/80 border-r border-white/5"
                                      style={{ background: "transparent" }}
                                    >
                                      +
                                    </button>
                                    <button
                                      type="button"
                                      title="Contra (Negativo Pertinente)"
                                      onClick={() => handleAddSuggestion(item, "contra")}
                                      className="px-2 py-1.5 hover:bg-red-500/30 text-red-400/80 border-r border-white/5"
                                      style={{ background: "transparent" }}
                                    >
                                      -
                                    </button>
                                    <button
                                      type="button"
                                      title="Falta (Esperado Ausente)"
                                      onClick={() => handleAddSuggestion(item, "falta")}
                                      className="px-2 py-1.5 hover:bg-amber-500/30 text-amber-400/80"
                                      style={{ background: "transparent" }}
                                    >
                                      ?
                                    </button>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      <div className="pt-2">
                        <PremiumButton
                          fullWidth
                          onClick={() => setDrillBStep("autoexplicacao")}
                        >
                          Avançar para Compromisso
                        </PremiumButton>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Autoexplicação / Commit */}
                  {drillBStep === "autoexplicacao" && (
                    <div className="space-y-4 med-animate-in">
                      <div className="rounded-2xl border border-white/5 bg-black/25 p-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Seu Compromisso</p>
                        <p className="text-[12.5px] text-gray-300">
                          Para consolidar o aprendizado, escreva uma única frase explicando seu raciocínio antes de revelarmos o caso.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300">
                          Autoexplicação (1 frase descritiva)
                        </label>
                        <Textarea
                          placeholder="Ex: Trata-se de dor torácica anginosa em paciente com alto risco cardiovascular, exigindo ECG em 10 minutos."
                          value={autoExplanation}
                          onChange={(e) => setAutoExplanation(e.target.value)}
                          rows={3}
                          autoFocus
                        />
                      </div>

                      <div className="pt-2 flex gap-2">
                        <PremiumButton
                          variant="secondary"
                          onClick={() => setDrillBStep("colunas")}
                        >
                          Voltar
                        </PremiumButton>
                        <PremiumButton
                          disabled={!autoExplanation.trim()}
                          onClick={handleCommitDrillB}
                          className="flex-1"
                        >
                          Comprometer Decisão e Revelar
                        </PremiumButton>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Reveal Lado a Lado */}
                  {drillBStep === "reveal" && drillBScore && (
                    <div className="space-y-4 med-animate-in">
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Lado Esquerdo: Você */}
                        <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-4">
                          <div className="border-b border-white/5 pb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Seu Raciocínio</span>
                          </div>
                          
                          <div>
                            <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">Diagnóstico Líder</p>
                            <p className="text-sm font-black text-white mt-0.5">{leadDiagnosis} ({confidence}/10)</p>
                          </div>

                          <div className="grid gap-2 grid-cols-3">
                            <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                              <p className="text-[9px] font-bold text-emerald-400 uppercase">Apoia ({apoiaItems.length})</p>
                              <p className="text-[11px] text-gray-300 mt-1 leading-tight">{apoiaItems.join(", ") || "Nenhum"}</p>
                            </div>
                            <div className="p-2 rounded-xl bg-red-500/5 border border-red-500/10">
                              <p className="text-[9px] font-bold text-red-400 uppercase">Contra ({contraItems.length})</p>
                              <p className="text-[11px] text-gray-300 mt-1 leading-tight">{contraItems.join(", ") || "Nenhum"}</p>
                            </div>
                            <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                              <p className="text-[9px] font-bold text-amber-400 uppercase">Ausente ({faltaItems.length})</p>
                              <p className="text-[11px] text-gray-300 mt-1 leading-tight">{faltaItems.join(", ") || "Nenhum"}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">Sua Justificativa</p>
                            <p className="text-[12px] text-gray-300 mt-1 italic leading-relaxed">"{autoExplanation}"</p>
                          </div>
                        </div>

                        {/* Lado Direito: Expert */}
                        <div className="rounded-2xl border border-purple-500/10 bg-purple-950/5 p-4 space-y-4">
                          <div className="border-b border-white/5 pb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Raciocínio do Expert</span>
                          </div>

                          <div>
                            <p className="text-[10.5px] font-bold uppercase tracking-wider text-purple-400">Diagnóstico Final</p>
                            <p className="text-sm font-black text-purple-200 mt-0.5">{caso.diagnosticoFinal}</p>
                          </div>

                          <div>
                            <p className="text-[10.5px] font-bold uppercase tracking-wider text-purple-400">Etapas do Pensamento Especialista</p>
                            <ul className="text-[11.5px] text-gray-300 mt-1.5 space-y-1.5 list-disc pl-4 leading-relaxed">
                              {caso.expertReasoningTrace?.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <p className="text-[10.5px] font-bold uppercase tracking-wider text-purple-400">Key Features Críticos</p>
                            <div className="mt-1 space-y-1">
                              {activeScript.keyFeatures?.map((kf, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                  <span className="h-1 w-1.5 rounded bg-emerald-400" />
                                  <span className="text-gray-400">{kf.prompt}:</span>
                                  <strong className="text-emerald-300 font-bold">{kf.expectedAction}</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Scorecard */}
                      <Card style={{ padding: 16 }}>
                        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Scorecard Clínico</span>
                            <h4 className="text-base font-black text-white mt-0.5">Pontuação por Componente</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400">Sessão Global</span>
                            <p className="text-2xl font-black text-purple-300 mt-0.5">{drillBScore.score}/100</p>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 mb-4">
                          {[
                            { label: "Key Features", val: drillBScore.breakdown?.keyFeatures, max: 20, desc: "Ações essenciais identificadas" },
                            { label: "Pistas a Favor (Apoia)", val: drillBScore.breakdown?.apoia, max: 30, desc: "Achados clínicos selecionados" },
                            { label: "Negativos Pertinentes", val: drillBScore.breakdown?.contra, max: 30, desc: "Dados de exclusão apontados" },
                            { label: "Esperado mas Ausente", val: drillBScore.breakdown?.falta, max: 20, desc: "Análise de hipóteses secundárias" }
                          ].map((b) => (
                            <div key={b.label} className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                              <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                                <span className="text-gray-400">{b.label}</span>
                                <span className="text-white">{b.val || 0}/{b.max}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1 leading-normal">{b.desc}</p>
                            </div>
                          ))}
                        </div>

                        {/* Cognitive error panel */}
                        {drillBScore.errosDetectados?.length > 0 && (
                          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3.5 space-y-1.5 med-animate-in">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                              <AlertTriangle size={13} /> Alerta de Viés Clínico Detectado
                            </p>
                            <p className="text-[12.5px] text-red-200 font-bold leading-normal">
                              {drillBScore.errosDetectados.includes("premature_closure") 
                                ? "Fechamento Precoce (Premature Closure)" 
                                : "Ancoragem Diagnóstica (Anchoring)"}
                            </p>
                            <p className="text-[12px] text-gray-300 leading-normal">
                              Você tomou uma decisão com alto grau de confiança ({confidence}/10), porém ignorou ou pulou etapas diagnósticas cruciais (como realizar um exame crítico ou excluir diferenciais imediatos).
                            </p>
                          </div>
                        )}
                      </Card>

                      {/* Remediation Next Step */}
                      <div className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Recomendação de Prática Dirigida</span>
                        
                        {drillBScore.errosDetectados?.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-[12.5px] text-gray-300 leading-relaxed">
                              Você cometeu um **Erro de Raciocínio**. O sistema recomenda treinar a discriminação contra diagnósticos parecidos usando o **Drill C (Separe os Gêmeos)**.
                            </p>
                            
                            {contrastStarted ? (
                              <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-[12px] font-bold text-purple-300 flex items-center gap-2 med-animate-in">
                                <span className="h-2 w-2 rounded-full bg-purple-400" />
                                Carregando o drill de diferenciação clínica...
                              </div>
                            ) : (
                              <PremiumButton
                                onClick={() => {
                                  setContrastStarted(true);
                                  setTimeout(() => {
                                    setActiveDrillType("drillC");
                                    setDrillCStep("jogo");
                                    setContrastStarted(false);
                                  }, 700);
                                }}
                              >
                                <RefreshCw size={14} className="mr-1.5" /> Treinar Contraste Clínico (Drill C)
                              </PremiumButton>
                            )}
                          </div>
                        ) : drillBScore.score < 80 ? (
                          <div className="space-y-2">
                            <p className="text-[12.5px] text-gray-300 leading-relaxed">
                              Você cometeu uma **Lacuna de Fato** (diagnóstico incorreto ou faltou ação crítica). Crie um flashcard de revisão estruturado sobre {caso.tema} para fixar esse detalhe.
                            </p>
                            
                            {flashcardCreated ? (
                              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-[12px] font-bold text-emerald-300 flex items-center gap-2 med-animate-in">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                Flashcard de revisão adicionado ao seu deck com sucesso!
                              </div>
                            ) : (
                              <PremiumButton
                                onClick={() => {
                                  setFlashcardCreated(true);
                                  if (showToast) showToast("Flashcard de revisão adicionado ao seu deck!");
                                }}
                              >
                                <Plus size={14} className="mr-1.5" /> Criar Flashcard de Revisão
                              </PremiumButton>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-[12.5px] text-gray-300 leading-relaxed">
                              Perfeito! Você diagnosticou e justificou com precisão de especialista. Continue evoluindo seu conhecimento.
                            </p>
                            <PremiumButton
                              onClick={() => {
                                setActiveFase("sct");
                                if (showToast) showToast("Avançando para a fase SCT");
                              }}
                            >
                              Seguir para Fase SCT
                            </PremiumButton>
                          </div>
                        )}
                      </div>

                      {/* Finish / Next buttons */}
                      <div className="flex gap-2 pt-2">
                        <PremiumButton
                          variant="secondary"
                          onClick={() => setDrillBStep("autoexplicacao")}
                        >
                          Voltar ao Rascunho
                        </PremiumButton>
                        <PremiumButton
                          onClick={() => {
                            setDrillBStep("diagnostico");
                            setLeadDiagnosis("");
                            setConfidence(5);
                            setApoiaItems([]);
                            setContraItems([]);
                            setFaltaItems([]);
                            setCustomItemText("");
                            setAutoExplanation("");
                            setDrillBScore(null);
                            setFlashcardCreated(false);
                            setContrastStarted(false);
                          }}
                        >
                          Treinar Outro Caso
                        </PremiumButton>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DRILL C: SEPARE OS GÊMEOS */}
              {activeDrillType === "drillC" && (
                <div className="space-y-4">
                  {drillCStep === "jogo" && (
                    <div className="space-y-4 med-animate-in">
                      <div className="rounded-2xl border border-white/5 bg-black/25 p-4 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Instruções do Drill C</span>
                        <h4 className="text-sm font-black text-white">Associação e Contraste Clínico</h4>
                        <p className="text-[12px] text-gray-400 leading-normal">
                          Para cada cenário clínico abaixo, identifique a pista/justificativa correta do pool de pistas do especialista. Toque em um cenário e depois selecione a pista de contraste correspondente.
                        </p>
                      </div>

                      {/* Vignettes Stack */}
                      <div className="space-y-3">
                        {confusableDrillItems.map((c) => {
                          const isSelected = drillCSelectedCaseId === c.id;
                          const assignedPista = drillCAssignments[c.id];

                          return (
                            <div
                              key={c.id}
                              onClick={() => setDrillCSelectedCaseId(c.id)}
                              className={`rounded-2xl border p-4 cursor-pointer text-left transition-all ${
                                isSelected
                                  ? "bg-purple-950/15 border-purple-500/80 shadow-md ring-2 ring-purple-500/10"
                                  : "bg-black/20 border-white/5 hover:bg-white/5"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2 mb-2">
                                <span className="text-[11.5px] font-black text-white uppercase">{c.diagnosis}</span>
                                <Badge tone={assignedPista ? "green" : "yellow"}>
                                  {assignedPista ? "Pista Atribuída" : "Aguardando"}
                                </Badge>
                              </div>
                              <p className="text-[12.5px] text-gray-300 italic font-serif leading-relaxed mb-3">
                                "{c.vinheta}"
                              </p>

                              <div className="rounded-xl bg-black/40 border border-white/5 p-3 min-h-[50px] flex items-center justify-between">
                                {assignedPista ? (
                                  <>
                                    <span className="text-[12px] text-purple-300 font-bold leading-normal">{assignedPista}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDrillCAssignments(prev => {
                                          const next = { ...prev };
                                          delete next[c.id];
                                          return next;
                                        });
                                      }}
                                      className="text-gray-500 hover:text-red-400 font-bold text-sm ml-2 p-0.5 transition-colors"
                                      style={{ background: "transparent", border: 0 }}
                                    >
                                      ×
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[11px] text-gray-500 italic">
                                    {isSelected ? "Selecione uma pista do pool abaixo..." : "Toque para selecionar este cenário..."}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pool of Pistas */}
                      <div className="space-y-2.5 rounded-2xl border border-white/5 bg-white/5 p-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Pool de Pistas Discriminantes (Shuffled)
                        </span>
                        <div className="flex flex-col gap-2 pt-1.5">
                          {shuffledPistas.map((pista) => {
                            const isAssigned = Object.values(drillCAssignments).includes(pista);

                            return (
                              <button
                                key={pista}
                                type="button"
                                disabled={isAssigned || !drillCSelectedCaseId}
                                onClick={() => {
                                  if (drillCSelectedCaseId) {
                                    setDrillCAssignments(prev => ({
                                      ...prev,
                                      [drillCSelectedCaseId]: pista
                                    }));
                                    setDrillCSelectedCaseId(null);
                                  }
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl border text-[11.5px] font-medium transition-all ${
                                  isAssigned
                                    ? "bg-white/5 text-gray-600 border-white/5 cursor-not-allowed italic line-through"
                                    : !drillCSelectedCaseId
                                    ? "bg-white/5 text-gray-400 border-white/5 cursor-not-allowed"
                                    : "bg-purple-950/20 text-purple-200 border-purple-500/20 hover:bg-purple-950/40 hover:border-purple-500/40"
                                }`}
                              >
                                {pista}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-2">
                        <PremiumButton
                          fullWidth
                          disabled={confusableDrillItems.length < 2 || Object.keys(drillCAssignments).length !== confusableDrillItems.length}
                          onClick={handleCommitDrillC}
                        >
                          Revelar Discriminação
                        </PremiumButton>
                      </div>
                    </div>
                  )}

                  {drillCStep === "reveal" && (
                    <div className="space-y-4 med-animate-in">
                      {/* Score card */}
                      <Card style={{ padding: 16 }}>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2.5 mb-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Resultado do Contraste</span>
                            <h4 className="text-base font-black text-white mt-0.5">Pontuação de Discriminação</h4>
                          </div>
                          <p className="text-2xl font-black text-purple-300">{drillCScore}%</p>
                        </div>
                        <p className="text-[12.5px] text-gray-300 leading-relaxed">
                          {drillCScore === 100 
                            ? "Espetacular! Você identificou e diferenciou cada um dos illness scripts confundíveis perfeitamente." 
                            : "Ainda há sobreposição diagnóstica no seu raciocínio. Estude a Tabela de Discriminação abaixo para consolidar as diferenças fundamentais."}
                        </p>
                      </Card>

                      {/* Association Comparison */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Comparação Detalhada</span>
                        {confusableDrillItems.map((c) => {
                          const assigned = drillCAssignments[c.id];
                          const isCorrect = assigned === c.discriminator;

                          return (
                            <div key={c.id} className="rounded-2xl border border-white/5 bg-black/20 p-4 space-y-2">
                              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-[11.5px] font-black text-white uppercase">{c.diagnosis}</span>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                  isCorrect ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"
                                }`}>
                                  {isCorrect ? "Correto ✓" : "Incorreto ✗"}
                                </span>
                              </div>
                              <p className="text-[12px] text-gray-400 italic">"{c.vinheta}"</p>
                              <div className="grid gap-2 sm:grid-cols-2 pt-1">
                                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                                  <p className="text-[9px] font-bold text-gray-500 uppercase">Sua Escolha</p>
                                  <p className="text-[11.5px] text-gray-300 mt-1 leading-normal">{assigned || "(Vazio)"}</p>
                                </div>
                                <div className="bg-purple-950/10 p-2.5 rounded-xl border border-purple-500/15">
                                  <p className="text-[9px] font-bold text-purple-400 uppercase">Gabarito do Especialista</p>
                                  <p className="text-[11.5px] text-purple-200 mt-1 leading-normal font-semibold">{c.discriminator}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Tabela de Discriminação */}
                      <Card style={{ padding: 14 }}>
                        <p className="text-[10px] font-black uppercase tracking-wider text-purple-400 mb-3 border-b border-white/5 pb-2">
                          Tabela de Discriminação Canônica do Expert
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[12px] border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-gray-400 font-bold uppercase text-[9.5px]">
                                <th className="pb-2 pr-3">Diagnóstico</th>
                                <th className="pb-2">Diferencial Crítico / Pista Canônica</th>
                              </tr>
                            </thead>
                            <tbody>
                              {confusableDrillItems.map((c) => (
                                <tr key={c.id} className="border-b border-white/5">
                                  <td className="py-2.5 pr-3 font-bold text-purple-300">{c.diagnosis}</td>
                                  <td className="py-2.5 text-gray-300 leading-relaxed">{c.discriminator}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>

                      <div className="flex gap-2 pt-2">
                        <PremiumButton
                          onClick={() => {
                            setDrillCStep("jogo");
                            setDrillCAssignments({});
                            setDrillCSelectedCaseId(null);
                            setDrillCScore(null);
                          }}
                        >
                          Treinar Novamente (Drill C)
                        </PremiumButton>
                        <PremiumButton
                          variant="secondary"
                          onClick={() => {
                            setActiveDrillType("drillB");
                            setDrillBStep("diagnostico");
                          }}
                        >
                          Seguir para Drill B
                        </PremiumButton>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeFase === "sct" && (
            <div className="space-y-3">
              {caso.sct.map((item, idx) => (
                <Card key={`${item.hipotese}-${idx}`} style={{ padding: 12, background: "rgba(0,0,0,.22)" }}>
                  <p className="text-[12px] text-gray-200"><strong>Hipótese:</strong> {item.hipotese}</p>
                  <p className="text-[12px] text-gray-400 mt-1"><strong>Nova informação:</strong> {item.novaInfo}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {[-2, -1, 0, 1, 2].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSctRespostas((prev) => ({ ...prev, [idx]: value }))}
                        className={`min-h-11 px-3 rounded-xl border text-xs font-black ${Number(sctRespostas[idx]) === value ? "bg-blue-600 text-white border-blue-500" : "bg-white/5 text-gray-400 border-white/10"}`}
                      >
                        {value > 0 ? `+${value}` : value}
                      </button>
                    ))}
                  </div>
                  {sctRevelado && (
                    <p className="text-[12px] text-gray-300 mt-3">
                      Painel: <strong className="text-white">{item.efeitoPainel > 0 ? `+${item.efeitoPainel}` : item.efeitoPainel}</strong>. {item.racional}
                    </p>
                  )}
                </Card>
              ))}
              <PremiumButton onClick={revelarSct}>Comparar com painel</PremiumButton>
            </div>
          )}

          {activeFase === "anamnese" && (
            <div className="space-y-3">
              <p className="text-[12px] text-gray-400">Queixa-guia: <strong className="text-gray-100">{caso.anamnese.queixa}</strong></p>
              {caso.anamnese.roteiro.map((bloco) => (
                <Card key={bloco.bloco} style={{ padding: 12, background: "rgba(0,0,0,.22)" }}>
                  <p className="text-[12px] font-black text-gray-100 mb-2">{bloco.bloco}</p>
                  <div className="grid gap-2">
                    {bloco.perguntasChave.map((pergunta) => (
                      <label key={pergunta} className="flex items-center gap-2 text-[12px] text-gray-300 min-h-11">
                        <input
                          type="checkbox"
                          checked={!!anamneseChecks[pergunta]}
                          onChange={(e) => setAnamneseChecks((prev) => ({ ...prev, [pergunta]: e.target.checked }))}
                        />
                        {pergunta}
                      </label>
                    ))}
                  </div>
                </Card>
              ))}
              <PremiumButton onClick={revelarAnamnese}>Revelar roteiro e red flags</PremiumButton>
              {anamneseRevelada && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-red-300 font-black">Red flags</p>
                  <p className="text-[12px] text-gray-200 mt-1">{caso.anamnese.redFlags.join(", ")}</p>
                </div>
              )}
            </div>
          )}

          {/* P4-D: Conduta / Prescricao simulada */}
          {activeFase === "conduta" && (
            <div className="space-y-4">
              {/* Aviso educacional obrigatorio — deve ser aceito antes de prosseguir */}
              {!conductaAvisoAceito ? (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
                    <div className="space-y-2">
                      <p className="text-[13px] font-bold text-amber-300">Aviso obrigatorio antes de continuar</p>
                      <p className="text-[12px] text-gray-300 leading-relaxed">
                        Esta fase simula a elaboracao de conduta e prescricao para fins exclusivamente educacionais.
                      </p>
                      <ul className="space-y-1.5 mt-2">
                        {[
                          "Nao aplicar qualquer decisao terapeutica em pacientes reais com base neste exercicio.",
                          "Doses e medicamentos sugeridos sao hipoteticos e nao substituem diretrizes clinicas vigentes.",
                          "Utilize esta fase apenas para treinar raciocinio de conduta, nao para prescricao real.",
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11.5px] text-gray-400">
                            <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConductaAvisoAceito(true)}
                    className="w-full py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-bold text-[12px] rounded-xl transition-colors"
                  >
                    Entendi — iniciar simulacao educacional
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[12px] text-gray-400 leading-relaxed">
                    Simule a conduta completa para <strong className="text-gray-200">{caso.tema}</strong>.
                    Preencha o maximo que conseguir antes de revelar o gabarito.
                  </p>

                  {/* Lembrete compacto pos-aceite */}
                  <div className="flex items-center gap-2 bg-amber-950/10 border border-amber-500/10 rounded-xl px-3 py-2">
                    <AlertTriangle size={11} className="text-amber-500 shrink-0" />
                    <p className="text-[10px] text-amber-600">Uso educacional. Nao aplicar em paciente real.</p>
                  </div>

                  {/* Campos de conduta simulada */}
                  <div className="space-y-3">
                    {CONDUTA_FIELDS.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          {field.label}
                        </label>
                        <Textarea
                          rows={2}
                          value={conductaRespostas[field.key] || ""}
                          onChange={(e) =>
                            setConductaRespostas((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Indicador de preenchimento */}
                  {!conductaRevelada && (() => {
                    const preenchidos = CONDUTA_FIELDS.filter(
                      (f) => String(conductaRespostas[f.key] || "").trim().length >= 5
                    ).length;
                    return (
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${(preenchidos / CONDUTA_FIELDS.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 shrink-0">
                          {preenchidos}/{CONDUTA_FIELDS.length} campos
                        </span>
                      </div>
                    );
                  })()}

                  {!conductaRevelada && (
                    <PremiumButton onClick={revelarConduta}>
                      <Eye size={14} /> Revelar gabarito de conduta
                    </PremiumButton>
                  )}

                  {/* Gabarito pos-revelacao */}
                  {conductaRevelada && (
                    <div className="space-y-3">
                      <Card className="space-y-3" style={{ padding: 16, background: "rgba(0,0,0,.22)" }}>
                        <p className="text-[10px] uppercase tracking-wider text-blue-300 font-bold">Gabarito educacional</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Conduta base</p>
                            <p className="text-[12px] text-gray-200 leading-relaxed">
                              {caso.script?.management || "Conduta especifica nao descrita neste caso."}
                            </p>
                          </div>
                          {caso.workup?.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Workup inicial</p>
                              <p className="text-[12px] text-gray-200 leading-relaxed">
                                {caso.workup.join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                        {caso.anamnese?.redFlags?.length > 0 && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                            <p className="text-[10px] uppercase tracking-wider text-red-300 font-black mb-1">Red flags</p>
                            <p className="text-[12px] text-gray-200">{caso.anamnese.redFlags.join(", ")}</p>
                          </div>
                        )}
                      </Card>
                      {/* Score de cobertura */}
                      {(() => {
                        const preenchidos = CONDUTA_FIELDS.filter(
                          (f) => String(conductaRespostas[f.key] || "").trim().length >= 5
                        ).length;
                        const pct = Math.round((preenchidos / CONDUTA_FIELDS.length) * 100);
                        return (
                          <Card className="flex items-center gap-3" style={{ padding: "12px 16px" }}>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Cobertura da conduta</p>
                            <p className={`text-xl font-black tabular-nums ml-auto ${pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400"}`}>
                              {pct}%
                            </p>
                          </Card>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Card>
      </div>
      <SessionClosureModal
        open={showClosure}
        source={closureDraft?.source || "raciocinio"}
        tema={closureDraft?.tema || caso?.tema || ""}
        area={closureDraft?.area || caso?.area || ""}
        initial={closureDraft}
        onSave={(payload) => {
          if (addSessionReflection) addSessionReflection(payload);
          if (rebuildActionInboxForToday) rebuildActionInboxForToday();
          if (showToast) showToast("Fechamento do caso salvo.");
          setShowClosure(false);
        }}
        onSkip={() => setShowClosure(false)}
        onClose={() => setShowClosure(false)}
      />
      <Dialog
        open={showWhy}
        onClose={() => setShowWhy(false)}
        title="Por que usar essa função?"
        description="Raciocínio clínico treina transferência, não só memória."
        wide
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Illness scripts", "Organizam predisponentes, mecanismo, consequências e conduta para reduzir raciocínio solto."],
            ["Casos variantes", "Forçam aplicar o mesmo tema em contexto novo, que é onde questões clínicas cobram discriminação."],
            ["Diferenciais", "Treinam separar hipóteses parecidas pelos dados discriminantes."],
            ["SCT e conduta", "Treinam decisão sob incerteza e justificativa educacional de manejo."],
          ].map(([title, body]) => (
            <Card key={title} style={{ padding: 12 }}>
              <p className="text-[12px] font-bold text-gray-100">{title}</p>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
      </Dialog>
      {showCreateCase && (() => {
        const filteredTemas = (() => {
          const q = temaQuery.trim().toLowerCase();
          if (!q) return [];
          return temas.filter(t => t.nome.toLowerCase().includes(q)).slice(0, 8);
        })();
        const STEPS_WIZARD = [
          "Escolher tema",
          "Vinheta base",
          "Nova informação 1",
          "Nova informação 2",
          "Diagnóstico e diferenciais",
          "Conduta educacional",
        ];
        const canAdvance = [
          caseDraft.tema.trim().length > 0,
          caseDraft.vinheta.trim().length > 10,
          true,
          true,
          caseDraft.diagnostico.trim().length > 0,
          caseDraft.conduta.trim().length > 0,
        ][wizardStep - 1];

        return (
          <Dialog
            open={showCreateCase}
            onClose={() => {
              setShowCreateCase(false);
              setWizardStep(1);
              setGeneratedCaseDraft(null);
              setGeneratedDraftReviewed(false);
            }}
            title={STEPS_WIZARD[wizardStep - 1]}
            description={`Criar caso clínico · Passo ${wizardStep}/${STEPS_WIZARD.length}`}
            wide
          >
            <div className="space-y-4 text-left">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {STEPS_WIZARD.map((_, i) => (
                    <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i < wizardStep ? "bg-blue-500" : "bg-white/10"}`} />
                  ))}
                </div>
              </div>

              {/* Passo 1: Tema */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-400">Vincule o caso a um tema do seu cronograma.</p>
                  <div className="relative">
                    <Input
                      placeholder="Buscar tema no plano..."
                      value={temaQuery}
                      onChange={e => { setTemaQuery(e.target.value); setCaseDraft(d => ({ ...d, tema: e.target.value, temaId: null, area: "" })); setShowTemaDropdown(true); }}
                      onFocus={() => setShowTemaDropdown(true)}
                      onBlur={() => setTimeout(() => setShowTemaDropdown(false), 200)}
                    />
                    {showTemaDropdown && filteredTemas.length > 0 && (
                      <div className="absolute z-50 top-full mt-1 w-full bg-[#18181b] border border-white/15 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                        {filteredTemas.map(t => (
                          <button key={t.id} type="button"
                            className="w-full text-left px-3 py-2 text-[11px] text-gray-200 hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
                            onMouseDown={() => { setTemaQuery(t.nome); setCaseDraft(d => ({ ...d, tema: t.nome, temaId: t.id, area: t.esp || "" })); setShowTemaDropdown(false); }}
                          >
                            <span className="font-bold">{t.nome}</span>
                            <span className="text-gray-500 ml-1.5">· {t.esp}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="Área" info="Preenchida automaticamente ao selecionar o tema.">
                      <Input value={caseDraft.area} onChange={e => setCaseDraft(d => ({ ...d, area: e.target.value }))} placeholder="ex: Cirurgia" />
                    </Field>
                    <Field label="Subárea (opcional)">
                      <Input value={caseDraft.subarea} onChange={e => setCaseDraft(d => ({ ...d, subarea: e.target.value }))} placeholder="ex: Trauma abdominal" />
                    </Field>
                  </div>

                  <div className="rounded-2xl border border-purple-500/20 bg-purple-950/10 p-4 space-y-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-purple-300">RC-G · Geração assistida</p>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        Gere um JSON de CaseInstance a partir do illness script. O rascunho fica bloqueado para publicação até revisão humana.
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
                      <label className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Illness script</span>
                        <select
                          value={rcgSourceScript?.id || ""}
                          onChange={(e) => {
                            const script = illnessScripts.find((item) => item.id === e.target.value);
                            if (!script) return;
                            setTemaQuery(script.tema || "");
                            setCaseDraft((prev) => ({
                              ...prev,
                              tema: script.tema || "",
                              area: script.area || "",
                              subarea: script.subtopic || "",
                              diagnostico: script.diagnosticoFinal || script.tema || "",
                            }));
                          }}
                          className="w-full min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-[12px] text-gray-100 outline-none"
                        >
                          {illnessScripts.map((script) => (
                            <option key={script.id} value={script.id}>{script.tema || script.id}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Apresentação</span>
                        <select
                          value={generationPresentation}
                          onChange={(e) => setGenerationPresentation(e.target.value)}
                          className="w-full min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-[12px] text-gray-100 outline-none"
                        >
                          <option value="typical">Típica</option>
                          <option value="atypical">Atípica</option>
                        </select>
                      </label>
                    </div>

                    <PremiumButton type="button" variant="secondary" onClick={generateRcgDraft} fullWidth>
                      Gerar rascunho JSON RC-G
                    </PremiumButton>

                    {generatedCaseDraft && (
                      <div className="space-y-3">
                        <Textarea rows={8} value={generatedCaseJson} readOnly />
                        <label className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-[11.5px] text-gray-300 leading-relaxed">
                          <input
                            type="checkbox"
                            checked={generatedDraftReviewed}
                            onChange={(e) => setGeneratedDraftReviewed(e.target.checked)}
                            className="mt-0.5"
                          />
                          Revisei a vinheta, key features, negativos, discriminadores e erros comuns. Este rascunho pode ser salvo como caso revisado.
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Passo 2: Vinheta */}
              {wizardStep === 2 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400">Construa o caso base: queixa guia, contexto, dados vitais, achados positivos e negativos importantes.</p>
                  <Textarea rows={5} placeholder="Ex: Paciente masculino, 28 anos, dor abdominal em FID há 12 horas, iniciou em região periumbilical, náuseas, sem febre. Sinal de Blumberg positivo, Rovsing positivo, defesa muscular local." value={caseDraft.vinheta} onChange={e => setCaseDraft(d => ({ ...d, vinheta: e.target.value }))} />
                </div>
              )}

              {/* Passo 3: Nova informação 1 */}
              {wizardStep === 3 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400">Acrescente um dado clínico/laboratorial que modifica ou confirma a hipótese. Como impacta a probabilidade do diagnóstico?</p>
                  <Textarea rows={4} placeholder="Ex: Leucocitose 14.000 com desvio à esquerda. TC abdominal com espessamento do apêndice e infiltração de gordura periapendicular." value={caseDraft.novaInfo1} onChange={e => setCaseDraft(d => ({ ...d, novaInfo1: e.target.value }))} />
                </div>
              )}

              {/* Passo 4: Nova informação 2 */}
              {wizardStep === 4 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400">Acrescente um dado que muda conduta ou diagnóstico. Use para criar dilema clínico ou reforçar o raciocínio.</p>
                  <Textarea rows={4} placeholder="Ex: Febre 38.5°C nas últimas 2 horas. Peristaltismo ausente. Defesa abdominal difusa — pensar em perfuração." value={caseDraft.novaInfo2} onChange={e => setCaseDraft(d => ({ ...d, novaInfo2: e.target.value }))} />
                </div>
              )}

              {/* Passo 5: Diagnóstico e diferenciais */}
              {wizardStep === 5 && (
                <div className="space-y-3">
                  <Field label="Diagnóstico central" info="Diagnóstico de referência ou hipótese principal do caso.">
                    <Input value={caseDraft.diagnostico} onChange={e => setCaseDraft(d => ({ ...d, diagnostico: e.target.value }))} placeholder="ex: Apendicite aguda" />
                  </Field>
                  <Field label="Diferenciais principais (separe por vírgula)" info="Hipóteses que devem ser discriminadas.">
                    <Input value={caseDraft.diferenciais} onChange={e => setCaseDraft(d => ({ ...d, diferenciais: e.target.value }))} placeholder="ex: Cólica renal, DIP, hérnia encarcerada" />
                  </Field>
                </div>
              )}

              {/* Passo 6: Conduta */}
              {wizardStep === 6 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400">Descreva a conduta educacional: exames iniciais, manejo, red flags e contraindicações específicas do caso.</p>
                  <Textarea rows={5} placeholder="Ex: Laparotomia de urgência. Exames: Hb, Ht, leucograma, creatinina, tipagem. Contraindicação a opióides antes do diagnóstico firmado. Red flag: febre alta + defesa difusa = peritonite." value={caseDraft.conduta} onChange={e => setCaseDraft(d => ({ ...d, conduta: e.target.value }))} />
                </div>
              )}

              {/* Botões de navegação */}
              <div className="flex gap-2 pt-2">
                {wizardStep > 1 && <PremiumButton variant="secondary" onClick={() => setWizardStep(s => s - 1)}>Anterior</PremiumButton>}
                {wizardStep < STEPS_WIZARD.length ? (
                  <PremiumButton fullWidth onClick={() => setWizardStep(s => s + 1)} disabled={!canAdvance}>
                    Próximo →
                  </PremiumButton>
                ) : (
                  <PremiumButton
                    fullWidth
                    onClick={saveCustomCase}
                    disabled={!caseDraft.tema.trim() || !caseDraft.vinheta.trim() || !caseDraft.diagnostico.trim() || (caseDraft.fonte === "rc_g_assisted_generation" && !generatedDraftReviewed)}
                  >
                    Salvar e vincular ao plano
                  </PremiumButton>
                )}
              </div>
            </div>
          </Dialog>
        );
      })()}
    </div>
  );
}
