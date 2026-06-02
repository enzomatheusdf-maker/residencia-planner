import React, { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useStore } from "../core/store";
import {
  getVestibularStart,
  updateVestibularStart,
  recommendVestibularFirstAction,
} from "../core/vestibularOnboarding";

const EXAM_OPTIONS = ["ENEM", "Fuvest", "Unicamp", "Outra"];

export default function VestibularStartTrail({ setView, onOpenAjustes }) {
  const plat = useStore((s) => s.plat);
  const meta = useStore((s) => s.meta || {});
  const temas = useStore((s) => s[plat]?.temas || []);
  const simulados = useStore((s) => s[plat]?.simulados || []);
  const showToast = useStore((s) => s.showToast);
  const [step, setStep] = useState(0);
  const [examDateInput, setExamDateInput] = useState("");

  const start = useMemo(() => getVestibularStart(meta), [meta]);
  const recommendation = useMemo(
    () => recommendVestibularFirstAction({ meta, temas, simulados }),
    [meta, temas, simulados]
  );

  if (plat !== "vest" || start.completed) return null;

  const applyPatch = (patch) => {
    const nextStart = updateVestibularStart(meta, patch);
    const nextMeta = { ...meta, vestibularStart: nextStart };
    if (nextStart.targetExam) {
      nextMeta.provasAlvo = [nextStart.targetExam];
    }
    if (nextStart.examDate) {
      nextMeta.dataProva = nextStart.examDate;
    }
    useStore.setState({ meta: nextMeta });
  };

  const completeTrail = () => {
    applyPatch({ completed: true });
    if (showToast) showToast("Trilha inicial do Vestibular concluída.");
  };

  const openRecommendation = () => {
    if (recommendation.view === "ajustes") {
      if (onOpenAjustes) onOpenAjustes({ initialTab: "ajustes" });
      return;
    }
    if (setView) setView(recommendation.view);
  };

  return (
    <section className="bg-[var(--surface-1)] border border-blue-500/20 rounded-2xl p-4 space-y-4">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-wider text-blue-300">Vestibular</p>
        <h3 className="text-sm font-black text-white">Configure sua trilha inicial</h3>
        <p className="text-[11px] text-gray-400">Leva 2 minutos e libera a primeira ação útil do Mentor.</p>
      </div>

      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all" style={{ width: `${((step + 1) / 5) * 100}%` }} />
      </div>

      {step === 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-gray-200">1. Qual prova você quer priorizar?</p>
          <div className="grid grid-cols-2 gap-2">
            {EXAM_OPTIONS.map((exam) => (
              <button
                key={exam}
                type="button"
                onClick={() => applyPatch({ targetExam: exam })}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${start.targetExam === exam ? "bg-blue-600/20 border-blue-500/30 text-blue-200" : "bg-white/5 border-white/10 text-gray-300"}`}
              >
                {exam}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-gray-200">2. Quando é a prova ou quando você quer estar pronto?</p>
          <div className="flex gap-2">
            <input
              type="date"
              value={examDateInput || start.examDate || ""}
              onChange={(e) => setExamDateInput(e.target.value)}
              className="flex-1 rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-[11px] text-gray-200"
            />
            <button
              type="button"
              onClick={() => applyPatch({ examDate: examDateInput || null })}
              className="px-3 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-200 text-[11px] font-bold cursor-pointer"
            >
              Salvar
            </button>
          </div>
          <button
            type="button"
            onClick={() => applyPatch({ examDate: null })}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold cursor-pointer"
          >
            Não sei ainda
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-gray-200">3. Você já tem simulado diagnóstico recente?</p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => applyPatch({ baselineMode: "simulado" })}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${start.baselineMode === "simulado" ? "bg-blue-600/20 border-blue-500/30 text-blue-200" : "bg-white/5 border-white/10 text-gray-300"}`}
            >
              Sim, quero registrar
            </button>
            <button
              type="button"
              onClick={() => applyPatch({ baselineMode: "sem_simulado" })}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${start.baselineMode === "sem_simulado" ? "bg-blue-600/20 border-blue-500/30 text-blue-200" : "bg-white/5 border-white/10 text-gray-300"}`}
            >
              Não, começar sem simulado
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-gray-200">4. Como quer começar?</p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => applyPatch({ planMode: "mentor" })}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${start.planMode === "mentor" ? "bg-blue-600/20 border-blue-500/30 text-blue-200" : "bg-white/5 border-white/10 text-gray-300"}`}
            >
              Modo Mentor
            </button>
            <button
              type="button"
              onClick={() => applyPatch({ planMode: "manual" })}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${start.planMode === "manual" ? "bg-blue-600/20 border-blue-500/30 text-blue-200" : "bg-white/5 border-white/10 text-gray-300"}`}
            >
              Manual
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">5. Primeira ação recomendada</p>
          <p className="text-sm font-black text-white">{recommendation.title}</p>
          <p className="text-[11px] text-emerald-100/90">{recommendation.description}</p>
          <button
            type="button"
            onClick={openRecommendation}
            className="px-3 py-2 rounded-xl bg-emerald-600/25 border border-emerald-500/30 text-emerald-100 text-[11px] font-bold cursor-pointer"
          >
            {recommendation.cta}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold cursor-pointer"
          disabled={step === 0}
        >
          Voltar
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((value) => Math.min(4, value + 1))}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold border-none cursor-pointer"
          >
            Próximo
          </button>
        ) : (
          <button
            type="button"
            onClick={completeTrail}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold border-none cursor-pointer inline-flex items-center gap-1"
          >
            <CheckCircle2 size={13} />
            Concluir trilha
          </button>
        )}
      </div>
    </section>
  );
}
