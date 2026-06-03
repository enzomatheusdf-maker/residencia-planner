// src/components/PomodoroWidget.jsx
// Relógio Pomodoro flutuante (canto inferior esquerdo).
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Pause, Play, RotateCcw, X, Settings, Info } from "lucide-react";
import { Modal } from "./Primitives";

const DEFAULT_CONFIG = {
  focoMin: 25,
  pausaCurtaMin: 5,
  pausaLongaMin: 15,
  ciclosAtesPausaLonga: 4,
};

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export default function PomodoroWidget() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [phase, setPhase] = useState("foco"); // foco | pausa_curta | pausa_longa
  const [cicloAtual, setCicloAtual] = useState(0);
  const [seconds, setSeconds] = useState(config.focoMin * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const totalSeconds = phase === "foco"
    ? config.focoMin * 60
    : phase === "pausa_curta"
    ? config.pausaCurtaMin * 60
    : config.pausaLongaMin * 60;

  const progress = 1 - seconds / totalSeconds;

  const resetTimer = useCallback((newPhase = "foco", newConfig = config) => {
    setRunning(false);
    clearInterval(intervalRef.current);
    const t = newPhase === "foco"
      ? newConfig.focoMin * 60
      : newPhase === "pausa_curta"
      ? newConfig.pausaCurtaMin * 60
      : newConfig.pausaLongaMin * 60;
    setSeconds(t);
    setPhase(newPhase);
  }, [config]);

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          // Auto-advance phase
          if (phase === "foco") {
            const nextCiclo = cicloAtual + 1;
            setCicloAtual(nextCiclo);
            if (nextCiclo % config.ciclosAtesPausaLonga === 0) {
              resetTimer("pausa_longa");
            } else {
              resetTimer("pausa_curta");
            }
          } else {
            resetTimer("foco");
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, cicloAtual, config]);

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="fixed bottom-20 left-4 z-40 w-11 h-11 rounded-2xl bg-[#111113] border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/25 transition-all shadow-xl cursor-pointer"
        title="Abrir Pomodoro"
      >
        <Timer size={18} />
      </button>
    );
  }

  const phaseLabel = phase === "foco" ? "Foco" : phase === "pausa_curta" ? "Pausa curta" : "Pausa longa";
  const phaseColor = phase === "foco" ? "#3b82f6" : phase === "pausa_curta" ? "#10b981" : "#a78bfa";
  const circumference = 2 * Math.PI * 26;

  return (
    <>
      <div className="fixed bottom-20 left-4 z-40 bg-[#111113] border border-white/10 rounded-2xl p-3 shadow-2xl w-52 select-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Timer size={13} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase text-gray-400">Pomodoro</span>
            <span className="text-[9px] text-gray-600">Ciclo {cicloAtual + 1}</span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setShowWhy(true)} className="text-gray-600 hover:text-blue-400 border-none bg-transparent cursor-pointer p-0.5"><Info size={12} /></button>
            <button type="button" onClick={() => setShowSettings(true)} className="text-gray-600 hover:text-gray-300 border-none bg-transparent cursor-pointer p-0.5"><Settings size={12} /></button>
            <button type="button" onClick={() => { setVisible(false); setRunning(false); }} className="text-gray-600 hover:text-gray-300 border-none bg-transparent cursor-pointer p-0.5"><X size={12} /></button>
          </div>
        </div>

        {/* Ring */}
        <div className="flex items-center justify-center my-2">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
              <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle
                cx="30" cy="30" r="26"
                fill="none" stroke={phaseColor}
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[16px] font-black tabular-nums text-white">{fmtTime(seconds)}</span>
            </div>
          </div>
        </div>

        {/* Phase label */}
        <p className="text-center text-[10px] font-bold mb-2" style={{ color: phaseColor }}>{phaseLabel}</p>

        {/* Controls */}
        <div className="flex gap-1.5 justify-center">
          <button
            type="button"
            onClick={() => setRunning(r => !r)}
            className="flex-1 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer border-none transition-all"
            style={{ background: phaseColor + "25", color: phaseColor, border: `1px solid ${phaseColor}40` }}
          >
            {running ? <><Pause size={11} /> Pausar</> : <><Play size={11} /> Iniciar</>}
          </button>
          <button
            type="button"
            onClick={() => resetTimer("foco")}
            className="w-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 flex items-center justify-center cursor-pointer border border-white/10"
            title="Reiniciar"
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <Modal onClose={() => setShowSettings(false)}>
          <div className="space-y-3 text-left">
            <h3 className="text-[14px] font-black text-white">Configurações do Pomodoro</h3>
            {[
              { key: "focoMin", label: "Tempo de foco (min)", min: 5, max: 90 },
              { key: "pausaCurtaMin", label: "Pausa curta (min)", min: 1, max: 30 },
              { key: "pausaLongaMin", label: "Pausa longa (min)", min: 5, max: 60 },
              { key: "ciclosAtesPausaLonga", label: "Ciclos até pausa longa", min: 1, max: 8 },
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between gap-3">
                <label className="text-[12px] text-gray-300">{f.label}</label>
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  value={config[f.key]}
                  onChange={e => setConfig(c => ({ ...c, [f.key]: Math.max(f.min, Math.min(f.max, Number(e.target.value))) }))}
                  className="w-16 bg-white/5 border border-white/10 rounded-xl text-white text-center text-[12px] py-1"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => { resetTimer("foco", config); setShowSettings(false); }}
              className="w-full py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 border border-blue-500/20 text-[12px] font-bold cursor-pointer"
            >
              Aplicar e reiniciar
            </button>
          </div>
        </Modal>
      )}

      {/* Why modal */}
      {showWhy && (
        <Modal onClose={() => setShowWhy(false)}>
          <div className="space-y-3 text-left">
            <h3 className="text-[14px] font-black text-white">Por que usar o Pomodoro?</h3>
            <p className="text-[12px] text-gray-300 leading-relaxed">
              O método Pomodoro ajuda a reduzir a <strong className="text-white">fricção de início</strong> (é mais fácil começar sabendo que vai parar em 25 min) e organiza o estudo em blocos de foco com pausas restauradoras.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 text-[11px]">
              {[
                ["Foco sem distrações", "25 minutos de atenção total reduzem o custo de alternar entre tarefas."],
                ["Pausas programadas", "O cérebro consolida memória durante pausas. Não pular é parte do método."],
                ["Não substitui", "Pomodoro organiza o tempo; retrieval practice, espaçamento e questões são o que consolida o conteúdo."],
                ["Flexível", "Adapte o tempo ao seu ritmo. Alguns usam 50+10; outros 25+5. O que importa é a consistência."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <p className="font-black text-gray-100">{t}</p>
                  <p className="text-gray-400 mt-0.5 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
