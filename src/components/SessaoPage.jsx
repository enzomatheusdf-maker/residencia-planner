// src/components/SessaoPage.jsx
import React, { useState } from 'react';
import { STEP_DEFINITIONS } from '../constants/stepDefinitions';
import { 
  BookOpen, FileText, Brain, Target, PenTool, Layers, 
  ChevronLeft, ChevronRight, Zap, Play 
} from 'lucide-react';
import { ESP_COLORS } from '../core/fsrs';

const STEP_ICONS = { pretest: FileText, leitura: BookOpen, esqueleto: Layers, braindump: Brain, questoes: PenTool, anki: Zap };

export default function SessaoPage({ temaInicial, onComplete, onCancel }) {
  // 1. Estados locais do componente (Hooks no topo)
  const [started, setStarted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [expandedJustification, setExpandedJustification] = useState(null);
  const [pico, setPico] = useState(temaInicial?.pico || '');
  const [ankiDeck, setAnkiDeck] = useState(temaInicial?.ankiDeck || '');

  // 2. Trava de segurança contra renderização sem objeto
  if (!temaInicial) return null;

  const currentStep = STEP_DEFINITIONS[currentStepIndex];
  const isLastStep = currentStepIndex === STEP_DEFINITIONS.length - 1;
  const espColor = ESP_COLORS[temaInicial.esp] || "#8b5cf6";

  const handleNextStep = () => {
    if (isLastStep) {
      // Devolve o objeto atualizado com o PICO e o Anki salvos para o App.js processar
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
          <button type="button" onClick={() => onCancel?.()} className="text-[13px] text-gray-500 hover:text-white transition-colors">
            Cancelar e Voltar
          </button>
        </div>

        <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
          <p className="text-[12px] text-gray-400">Antes de iniciar o Foco D0, defina a âncora clínica do tema e o deck alvo.</p>
          
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Target size={14} className="text-violet-400"/> Caso Clínico PICO (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Paciente masculino, 24 anos, dor abdominal periumbilical que migrou para FID..."
              value={pico}
              onChange={(e) => setPico(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Zap size={14} className="text-violet-400"/> Deck do Anki (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Medicina::Cirurgia::Apendicite"
              value={ankiDeck}
              onChange={(e) => setAnkiDeck(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setStarted(true)}
            className="w-full px-4 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-violet-900/20"
          >
            <Play size={15} /> Confirmar e Iniciar D0
          </button>
        </div>
      </div>
    );
  }

  // ─── TELA 2: FLUXO DAS 6 MICROTAREFAS CIENTÍFICAS ─────────────────────────
  const StepIconComponent = STEP_ICONS[currentStep.id] || FileText;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-up text-left">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: espColor }}>Foco D0 Ativo</span>
          <h3 className="text-[14px] font-bold text-white truncate mt-0.5">{temaInicial.nome}</h3>
        </div>
        <span className="text-[10px] font-bold text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-mono">
          v7 • 1.07
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
          <div
            className="bg-violet-600 h-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / STEP_DEFINITIONS.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-semibold text-gray-600 uppercase tracking-wider font-mono">
          <span>Passo {currentStepIndex + 1} de {STEP_DEFINITIONS.length}</span>
          <span>{Math.round(((currentStepIndex + 1) / STEP_DEFINITIONS.length) * 100)}%</span>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/5 p-6 rounded-2xl space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: espColor }} />
        
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-violet-400 shrink-0">
            <StepIconComponent size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{currentStep.title}</h3>
            <p className="text-[12.5px] text-gray-400 mt-0.5 leading-relaxed">{currentStep.description}</p>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <p className="whitespace-pre-line text-[13px] leading-relaxed font-medium text-gray-300">
            {currentStep.instruction}
          </p>
        </div>

        <div className="border-t border-white/5 pt-2">
          <button
            type="button"
            onClick={() => setExpandedJustification(expandedJustification === currentStep.id ? null : currentStep.id)}
            className="text-[11px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1.5 py-1"
          >
            <span>{expandedJustification === currentStep.id ? '▼' : '▶'}</span>
            Análise de Evidência Científica
          </button>
          {expandedJustification === currentStep.id && (
            <div className="bg-violet-500/[0.02] border-l-2 border-violet-500/30 p-4 rounded-r-xl mt-2 w-full animate-fade-up">
              <p className="text-[11.5px] leading-relaxed whitespace-pre-line text-gray-500 italic">
                {currentStep.justification}
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
          className="px-4 bg-[#111113] hover:bg-white/5 text-gray-400 disabled:opacity-20 border border-white/5 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-1 shrink-0"
        >
          <ChevronLeft size={16} /> Voltar
        </button>

        <button
          type="button"
          onClick={handleNextStep}
          className="flex-1 px-4 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-[13px] transition-all active:scale-[0.98] shadow-lg shadow-violet-900/20 flex items-center justify-center gap-1.5"
        >
          {isLastStep ? 'Fiz todos os passos → Finalizar D0' : `Concluir ${currentStep.title}`} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}