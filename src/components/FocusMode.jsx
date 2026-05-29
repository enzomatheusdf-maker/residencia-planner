import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Play, Pause, X, Brain, Plus, PenTool, Target, Layers, Zap, BookOpen, FileText } from "lucide-react";
import { calcFilaInteligente } from "../hooks/useMetrics";
import { getStepDefinitions, getBrainDumpFields } from "../constants/stepDefinitions";
import { ESP_COLORS } from "../core/fsrs";
import { useStore } from "../core/store";
import { TourBalloon, ProgressiveTooltip } from "./Primitives";
import { StructuredErrorsList } from "./Modals";

const STEP_ICONS = { pretest: FileText, leitura: BookOpen, esqueleto: Layers, braindump: Brain, questoes: PenTool, anki: Zap };

export default function FocusMode({ onExit, plat, temas, onCompleteStep, targetedItem }) {
  const tourStep = useStore((s) => s.tourStep);
  // 1. SELECT TARGET THEME & STEP
  const intelligentQueue = useMemo(() => calcFilaInteligente(temas), [temas]);

  const activeReviewItem = useMemo(() => {
    if (tourStep === "focus") {
      const isVest = plat === "vest";
      return {
        tema: {
          id: isVest ? "demo-funcoes" : "demo-apendicite",
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
        stepKey: "d0"
      };
    }
    if (targetedItem) {
      const t = temas.find(x => x.id === targetedItem.temaId);
      if (t) return { tema: t, stepKey: targetedItem.stepKey };
    }
    if (intelligentQueue.length > 0) {
      const top = intelligentQueue[0];
      const t = temas.find(x => x.id === top.temaId);
      if (t) return { tema: t, stepKey: top.stepKey };
    }
    return null;
  }, [targetedItem, intelligentQueue, temas, tourStep, plat]);

  const tema = activeReviewItem?.tema;
  const stepKey = activeReviewItem?.stepKey;

  // Dynamic step definitions based on platform and area
  const stepDefs = useMemo(() => getStepDefinitions(plat, tema?.esp), [plat, tema?.esp]);
  const brainDumpFields = useMemo(() => getBrainDumpFields(plat, tema?.esp), [plat, tema?.esp]);

  const platformName = useStore((s) => s.meta?.plataformaQuestoes) || (plat === "res" ? "MedEvo" : "Estuda Mais");

  const formatTextWithPlatform = useCallback((text) => {
    if (!text) return "";
    return text.replace(/MedEvo/g, platformName);
  }, [platformName]);

  // States
  const [startedD0, setStartedD0] = useState(false);
  const [d0StepIdx, setD0StepIdx] = useState(0);
  const [expandedJustification, setExpandedJustification] = useState(false);
  const [showFocusBalloon, setShowFocusBalloon] = useState(true);
  const [showD0StatsForm, setShowD0StatsForm] = useState(false);

  // D0 Prep state
  const [pico, setPico] = useState(tema?.pico || "");
  const [ankiDeck, setAnkiDeck] = useState(tema?.ankiDeck || "");

  // D1 state — dynamic fields, keyed by field.k
  const [d1Fields, setD1Fields] = useState({});

  // D4/D7/D21 + D0 stats state
  const [questoes, setQuestoes] = useState("");
  const [acertos, setAcertos] = useState("");
  const [erros, setErros] = useState([]);

  // Derived accuracy
  const totalQuestoes = +questoes || 0;
  const certasQuestoes = Math.min(+acertos || 0, totalQuestoes);
  const pct = totalQuestoes > 0 ? Math.round((certasQuestoes / totalQuestoes) * 100) : null;

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

  const handleCompleteD1 = () => {
    onCompleteStep(tema.id, "d1", { fields: d1Fields });
    resetSessionStates();
  };

  const handleCompleteReview = () => {
    const showErroBox = pct != null && pct < 75;
    onCompleteStep(tema.id, stepKey, {
      acerto: pct != null ? pct / 100 : null,
      questoes: totalQuestoes || null,
      motivosErro: showErroBox ? erros.map(e => e.tipoErro) : [],
      erros: showErroBox ? erros : []
    });
    resetSessionStates();
  };

  const resetSessionStates = () => {
    setStartedD0(false);
    setD0StepIdx(0);
    setD1Fields({});
    setQuestoes("");
    setAcertos("");
    setErros([]);
    setExpandedJustification(false);
    setShowD0StatsForm(false);
  };

  const currentStepDef = stepDefs[d0StepIdx];
  const espColor = tema ? (ESP_COLORS[tema.esp] || "#8b5cf6") : "#8b5cf6";

  // Error categories — vest adds "interpretacao"
  const motivosList = [
    { k: "lacuna", l: "Lacuna de Conteúdo" },
    { k: "raciocinio", l: "Erro de Raciocínio" },
    { k: "distractor", l: "Caiu em Distrator" },
    { k: "descuido", l: "Descuido / Falta de Atenção" },
    { k: "nao_visto", l: "Conteúdo Não Visto" },
    ...(plat === "vest" ? [{ k: "interpretacao", l: "Erro de Interpretação" }] : [])
  ];

  if (!activeReviewItem) {
    return (
      <div className="fixed inset-0 bg-[#05050d] text-white flex flex-col items-center justify-center p-6 z-[200]">
        <div className="text-center space-y-5 max-w-sm animate-fade-up">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-black">Fila Totalmente Limpa!</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Você não possui pendências agendadas no FSRS para o momento. Aproveite seu descanso ou revise seus simulados!
          </p>
          <button
            onClick={onExit}
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 font-bold text-[12.5px] transition-all"
          >
            Sair do Modo Foco
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#07070f] text-white flex flex-col z-[200] overflow-hidden select-none select-text-safe">
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
      <main className="flex-1 overflow-y-auto flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl bg-[#0d0d14]/60 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md animate-fade-up">
          <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: espColor }} />

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
                      <Target size={13} className="text-violet-400" /> Caso Clínico PICO / Âncora Mental (Opcional)
                    </label>
                    <textarea
                      rows={3}
                      value={pico}
                      onChange={(e) => setPico(e.target.value)}
                      placeholder="Ex: Paciente 35a com quadro compatível com Apendicite, dor em fossa ilíaca direita..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-all resize-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Zap size={13} className="text-violet-400" /> Deck do Anki Alvo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={ankiDeck}
                    onChange={(e) => setAnkiDeck(e.target.value)}
                    placeholder={plat === "vest" ? "Ex: Vestibular::Matemática::Funções" : "Ex: Medicina::Ginecologia::Onco"}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStartedD0(true)}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white rounded-xl font-black text-xs tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-purple-900/25 flex items-center justify-center gap-2"
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
                    className="bg-violet-600 h-full transition-all duration-300"
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
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-violet-400 shrink-0">
                    {React.createElement(STEP_ICONS[currentStepDef.id] || FileText, { size: 22 })}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white leading-tight">{formatTextWithPlatform(currentStepDef.title)}</h3>
                    <p className="text-[12px] text-gray-400 mt-0.5">{formatTextWithPlatform(currentStepDef.description)}</p>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <p className="whitespace-pre-line text-xs leading-relaxed text-gray-300 font-medium">
                    {formatTextWithPlatform(currentStepDef.instruction)}
                  </p>
                </div>

                {/* Evidence */}
                <div className="border-t border-white/5 pt-2">
                  <button
                    type="button"
                    onClick={() => setExpandedJustification(!expandedJustification)}
                    className="text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                  >
                    <span>{expandedJustification ? "▼" : "▶"}</span>
                    Análise de Evidência Científica
                  </button>
                  {expandedJustification && (
                    <div className="bg-violet-500/[0.01] border-l border-violet-500/30 p-3.5 rounded-r-xl mt-2 w-full animate-fade-up text-[11px] text-gray-500 leading-relaxed whitespace-pre-line italic">
                      {formatTextWithPlatform(currentStepDef.justification)}
                    </div>
                  )}
                </div>
              </div>

              {/* Timer & controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
                <div className="flex items-center gap-3">
                  <span className={`text-4xl font-black font-mono tracking-tight tabular-nums ${secondsLeft <= 60 ? "text-red-400 animate-pulse" : "text-violet-400"}`}>
                    {formatTimer()}
                  </span>
                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-300 text-xs font-semibold hover:text-white"
                  >
                    {timerActive ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={extendTimer}
                    className="px-4 py-3.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
                  >
                    <Plus size={14} /> +5 Minutos
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteD0Step}
                    className="flex-1 sm:flex-none px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-[11px] transition-all active:scale-[0.98] shadow-lg shadow-violet-900/20"
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
                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wide">Finalização do Estudo Ativo (D0)</h4>
                <p className="text-xs text-gray-400 leading-relaxed mt-1.5">
                  Informe o resultado das questões feitas para registrar seu ponto de partida e calibrar o algoritmo FSRS.
                </p>
              </div>

              <div className="space-y-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                <AcertoInputs
                  questoes={questoes}
                  setQuestoes={setQuestoes}
                  acertos={acertos}
                  setAcertos={setAcertos}
                  pct={pct}
                />

                {pct != null && pct < 75 && (
                  <StructuredErrorsList erros={erros} onChange={setErros} plat={plat} esp={tema.esp} />
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowD0StatsForm(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-semibold"
                >
                  Voltar para os Passos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const showErroBox = pct != null && pct < 75;
                    onCompleteStep(tema.id, "d0", {
                      acerto: pct != null ? pct / 100 : null,
                      questoes: totalQuestoes || null,
                      motivosErro: showErroBox ? erros.map(e => e.tipoErro) : [],
                      erros: showErroBox ? erros : [],
                      pico,
                      ankiDeck
                    });
                    resetSessionStates();
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white rounded-xl font-bold text-[11.5px] transition-all active:scale-[0.98] shadow-lg shadow-purple-900/20"
                >
                  ✓ Concluir Estudo D0
                </button>
              </div>
            </div>
          )}

          {/* ─── D1 BRAIN DUMP FLUX ─── */}
          {stepKey === "d1" && (
            <div className="space-y-5 text-left">
              <p className="text-[12.5px] text-gray-400 leading-relaxed mb-2">
                <strong>Brain Dump de Memória (5 min)</strong>: Escreva de cabeça tudo o que você lembra sobre o tema antes de avançar.
              </p>

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
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-all resize-none"
                      />
                    </div>
                  ))}
                </div>
              </ProgressiveTooltip>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
                <div className="flex items-center gap-3">
                  <span className={`text-4xl font-black font-mono tracking-tight tabular-nums ${secondsLeft <= 60 ? "text-red-400 animate-pulse" : "text-violet-400"}`}>
                    {formatTimer()}
                  </span>
                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-300 text-xs font-semibold hover:text-white"
                  >
                    {timerActive ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={extendTimer}
                    className="px-4 py-3.5 bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold rounded-xl transition-all"
                  >
                    +5 Minutos
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteD1}
                    className="flex-1 sm:flex-none px-6 py-3.5 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white rounded-xl font-bold text-[11px] transition-all active:scale-[0.98] shadow-lg shadow-purple-900/20"
                  >
                    ✓ Concluir Brain Dump
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── D4 / D7 / D21 REVIEW STEPS ─── */}
          {["d4", "d7", "d21"].includes(stepKey) && (
            <div className="space-y-6 text-left">
              <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wide">Diretrizes da Etapa</h4>
                <p className="text-xs text-gray-400 leading-relaxed mt-1.5">
                  {stepKey === "d4" && "Resolva questões ativas sobre o tema. O objetivo é forçar a recuperação mental de pontos-chave e mapear lacunas."}
                  {stepKey === "d7" && "Faça questões de prova e conclua a revisão do Deck do Anki correspondente. Ajuste os cards baseando-se nos erros."}
                  {stepKey === "d21" && "Revisão interleaved: resolva questões misturadas sobre o tema junto com outros conteúdos. É a etapa final de fixação."}
                </p>
              </div>

              <div className="space-y-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                <AcertoInputs
                  questoes={questoes}
                  setQuestoes={setQuestoes}
                  acertos={acertos}
                  setAcertos={setAcertos}
                  pct={pct}
                />

                {pct != null && pct < 75 && (
                  <StructuredErrorsList erros={erros} onChange={setErros} plat={plat} esp={tema.esp} />
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
                <div className="flex items-center gap-3">
                  <span className={`text-4xl font-black font-mono tracking-tight tabular-nums ${secondsLeft <= 60 ? "text-red-400 animate-pulse" : "text-violet-400"}`}>
                    {formatTimer()}
                  </span>
                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-300 text-xs font-semibold hover:text-white"
                  >
                    {timerActive ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={extendTimer}
                    className="px-4 py-3.5 bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold rounded-xl transition-all"
                  >
                    +5 Minutos
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteReview}
                    className="flex-1 sm:flex-none px-6 py-3.5 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white rounded-xl font-bold text-[11.5px] transition-all active:scale-[0.98] shadow-lg shadow-purple-900/25"
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
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function AcertoInputs({ questoes, setQuestoes, acertos, setAcertos, pct }) {
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
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-all"
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
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-all"
          />
        </div>
      </div>
      {pct != null && (
        <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-4 py-2.5">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Acerto calculado</span>
          <span className={`text-2xl font-black font-mono ${pct >= 80 ? "text-emerald-400" : pct >= 65 ? "text-violet-400" : "text-red-400"}`}>
            {pct}%
          </span>
        </div>
      )}
    </div>
  );
}
