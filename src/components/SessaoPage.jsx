// src/components/SessaoPage.jsx
import React, { useState, useMemo } from 'react';
import { getStepDefinitions } from '../constants/stepDefinitions';
import { useStore } from '../core/store';
import { 
  BookOpen, FileText, Brain, Target, PenTool, Layers, 
  ChevronLeft, ChevronRight, Zap, Play 
} from 'lucide-react';
import { ESP_COLORS } from '../core/fsrs';

const STEP_ICONS = { pretest: FileText, leitura: BookOpen, esqueleto: Layers, braindump: Brain, questoes: PenTool, anki: Zap };

export default function SessaoPage({ temaInicial, onComplete, onCancel }) {
  const { plat } = useStore();
  const platformName = useStore((s) => s.meta?.plataformaQuestoes) || (plat === "res" ? "MedEvo" : "Estuda Mais");
  
  // 1. Estados locais do componente (Hooks no topo)
  const [started, setStarted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [expandedJustification, setExpandedJustification] = useState(null);
  const [pico, setPico] = useState(temaInicial?.pico || '');
  const [ankiDeck, setAnkiDeck] = useState(temaInicial?.ankiDeck || '');

  // 2. Trava de segurança contra renderização sem objeto
  if (!temaInicial) return null;

  const formatText = (text) => {
    if (!text) return "";
    return text.replace(/MedEvo/g, platformName);
  };

  const stepDefinitions = useMemo(() => getStepDefinitions(plat, temaInicial.esp), [plat, temaInicial.esp]);
  const currentStep = stepDefinitions[currentStepIndex];
  const isLastStep = currentStepIndex === stepDefinitions.length - 1;
  const espColor = ESP_COLORS[temaInicial.esp] || "#8b5cf6";

  const handleNextStep = () => {
    if (isLastStep) {
      onComplete?.({ ...temaInicial, pico: pico.trim(), ankiDeck: ankiDeck.trim() });
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
      setExpandedJustification(null);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setExpandedJustification(null);
    }
  };

  // ─── TELA 1: PREPARAÇÃO DA ÂNCORA MENTAL (PICO) ───────────────────────────
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-up text-left">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: espColor }}>
              {temaInicial.esp}
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight mt-1">{temaInicial.nome}</h2>
          </div>
          <button type="button" onClick={() => onCancel?.()} className="text-[13px] text-gray-500 hover:text-white transition-colors border-none p-0 bg-transparent cursor-pointer">
            Cancelar e Voltar
          </button>
        </div>

        <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
          <p className="text-[12px] text-gray-400">Antes de iniciar o Foco D0, defina a âncora clínica do tema e o deck alvo.</p>
          
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Target size={14} className="text-blue-400"/> Caso Clínico PICO (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Paciente masculino, 24 anos, dor abdominal periumbilical que migrou para FID..."
              value={pico}
              onChange={(e) => setPico(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Zap size={14} className="text-blue-400"/> Deck do Anki (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Medicina::Cirurgia::Apendicite"
              value={ankiDeck}
              onChange={(e) => setAnkiDeck(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setStarted(true)}
            className="w-full px-4 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-900/20 border-none cursor-pointer"
          >
            <Play size={15} /> Confirmar e Iniciar D0
          </button>
        </div>
      </div>
    );
  }

  // ─── TELA 2: FLUXO DAS MICROTAREFAS CIENTÍFICAS ─────────────────────────
  const StepIconComponent = STEP_ICONS[currentStep?.id] || FileText;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-up text-left">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: espColor }}>Foco D0 Ativo</span>
          <h3 className="text-[14px] font-bold text-white truncate mt-0.5">{temaInicial.nome}</h3>
        </div>
        <span className="text-[10px] font-bold text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-mono">
          v11
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / stepDefinitions.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-semibold text-gray-600 uppercase tracking-wider font-mono">
          <span>Passo {currentStepIndex + 1} de {stepDefinitions.length}</span>
          <span>{Math.round(((currentStepIndex + 1) / stepDefinitions.length) * 100)}%</span>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/5 p-6 rounded-2xl space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: espColor }} />
        
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-blue-400 shrink-0">
            <StepIconComponent size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{formatText(currentStep?.title)}</h3>
            <p className="text-[12.5px] text-gray-400 mt-0.5 leading-relaxed">{formatText(currentStep?.description)}</p>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <p className="whitespace-pre-line text-[13px] leading-relaxed font-medium text-gray-300">
            {formatText(currentStep?.instruction)}
          </p>
        </div>

        <div className="border-t border-white/5 pt-2">
          <button
            type="button"
            onClick={() => setExpandedJustification(expandedJustification === currentStep?.id ? null : currentStep?.id)}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5 py-1 border-none bg-transparent cursor-pointer"
          >
            <span>{expandedJustification === currentStep?.id ? '▼' : '▶'}</span>
            Análise de Evidência Científica
          </button>
          {expandedJustification === currentStep?.id && (
            <div className="bg-blue-500/[0.02] border-l-2 border-blue-500/30 p-4 rounded-r-xl mt-2 w-full animate-fade-up">
              <p className="text-[11.5px] leading-relaxed whitespace-pre-line text-gray-500 italic">
                {formatText(currentStep?.justification)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
          className="px-4 bg-[#111113] hover:bg-white/5 text-gray-400 disabled:opacity-20 border border-white/5 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-1 shrink-0 border-none cursor-pointer"
        >
          <ChevronLeft size={16} /> Voltar
        </button>

        <button
          type="button"
          onClick={handleNextStep}
          className="flex-1 px-4 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[13px] transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20 flex items-center justify-center gap-1.5 border-none cursor-pointer"
        >
          {isLastStep ? 'Fiz todos os passos → Finalizar D0' : `Concluir ${currentStep?.title}`} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}