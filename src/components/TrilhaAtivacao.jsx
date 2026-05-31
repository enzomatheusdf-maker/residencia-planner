import React, { useMemo } from "react";
import { CheckCircle2, Circle, X } from "lucide-react";
import { useStore } from "../core/store";

export default function TrilhaAtivacao({ totalSessions = 0, onOpenAjustes, setView, onStudy }) {
  const plat = useStore((s) => s.plat);
  const temas = useStore((s) => s[plat]?.temas || []);
  const gamif = useStore((s) => s.gamif) || {};
  const meta = useStore((s) => s.meta) || {};

  const steps = useMemo(() => {
    const hasTemaIniciado = temas.some((t) => !t.unstarted);
    const hasD0 = temas.some((t) => t?.rev?.d0?.done);
    const hasPosD0 = temas.some((t) => (t?.rev?.d1?.done || t?.rev?.d4?.done || t?.rev?.d7?.done || t?.rev?.d21?.done));
    const streak3 = (gamif?.streakCurrent || 0) >= 3;
    return [
      { id: "prova", label: "Definir prova-alvo", done: (meta?.provasAlvo || []).length > 0, action: () => onOpenAjustes && onOpenAjustes(), cta: "Abrir Ajustes" },
      { id: "tema", label: "Iniciar 1º tema", done: hasTemaIniciado, action: () => setView && setView("crono"), cta: "Ir ao Cronograma" },
      { id: "d0", label: "Concluir 1º D0", done: hasD0, action: () => {
        const tema = temas.find((t) => !t.unstarted && t?.rev?.d0 && !t.rev.d0.done) || temas.find((t) => !t.unstarted);
        if (tema && onStudy) onStudy(tema.id, "d0");
      }, cta: "Abrir Foco" },
      { id: "rev", label: "1ª revisão (D1/D4)", done: hasPosD0, action: () => {
        const tema = temas.find((t) => t?.rev?.d1 && !t.rev.d1.done) || temas.find((t) => t?.rev?.d4 && !t.rev.d4.done);
        if (tema && onStudy) onStudy(tema.id, tema.rev.d1 && !tema.rev.d1.done ? "d1" : "d4");
      }, cta: "Revisar Agora" },
      { id: "streak", label: "Ativar ofensiva (3 dias)", done: streak3, action: () => setView && setView("dash"), cta: "Ver Progresso" },
    ];
  }, [meta?.provasAlvo, temas, gamif?.streakCurrent, onOpenAjustes, setView, onStudy]);

  const doneCount = steps.filter((s) => s.done).length;
  const hidden = doneCount === 5 || totalSessions >= 10 || meta?.ativacaoDispensada;
  if (hidden) return null;

  const dismiss = () => {
    useStore.setState({ meta: { ...meta, ativacaoDispensada: true } });
  };

  return (
    <section className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4 md:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Trilha de ativação</p>
          <p className="text-sm text-white font-bold">{doneCount}/5 marcos concluídos</p>
        </div>
        <button type="button" onClick={dismiss} className="text-gray-500 hover:text-gray-300 border-none bg-transparent cursor-pointer" title="Dispensar">
          <X size={16} />
        </button>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500" style={{ width: `${Math.max(8, (doneCount / 5) * 100)}%` }} />
      </div>
      <div className="mt-3 grid gap-2">
        {steps.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              {s.done ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <Circle size={16} className="text-gray-500 shrink-0" />}
              <span className={`text-xs font-semibold truncate ${s.done ? "text-emerald-300" : "text-gray-300"}`}>{s.label}</span>
            </div>
            {!s.done && (
              <button type="button" onClick={s.action} className="text-[10px] px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold border-none cursor-pointer">
                {s.cta}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
