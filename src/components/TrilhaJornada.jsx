import React, { useEffect, useMemo } from "react";
import { CheckCircle2, Circle, X, Flag } from "lucide-react";
import { useStore } from "../core/store";

export default function TrilhaJornada({ totalSessions = 0, onOpenAjustes, setView, onStudy, showToast }) {
  const plat = useStore((s) => s.plat);
  const temas = useStore((s) => s[plat]?.temas || []);
  const gamif = useStore((s) => s.gamif) || {};
  const meta = useStore((s) => s.meta);
  const provasAlvo = useMemo(() => meta?.provasAlvo || [], [meta?.provasAlvo]);
  const trilhaDispensada = !!meta?.trilhaDispensada;
  const trilhaXpDados = useMemo(() => meta?.trilhaXpDados || {}, [meta?.trilhaXpDados]);
  const addXp = useStore((s) => s.addXp);
  const showToastGlobal = useStore((s) => s.showToast);

  const steps = useMemo(() => {
    const hasTemaIniciado = temas.some((t) => !t.unstarted);
    const hasD0 = temas.some((t) => t?.rev?.d0?.done);
    const hasD1D4 = temas.some((t) => t?.rev?.d1?.done || t?.rev?.d4?.done);
    const streak3 = (gamif?.streakCurrent || 0) >= 3;
    const nextTema = temas.find((t) => !t.unstarted && t?.rev?.d0 && !t.rev.d0.done) || temas.find((t) => !t.unstarted);
    const nextReviewTema = temas.find((t) => t?.rev?.d1 && !t.rev.d1.done) || temas.find((t) => t?.rev?.d4 && !t.rev.d4.done);

    return [
      {
        id: "prova",
        icon: "🎯",
        title: "Definir prova-alvo",
        desc: "Sem prova-alvo, a priorização perde precisão.",
        done: provasAlvo.length > 0,
        cta: "Abrir Ajustes",
        action: () => onOpenAjustes && onOpenAjustes(),
      },
      {
        id: "tema",
        icon: "📘",
        title: "Iniciar 1º tema",
        desc: "Tração inicial em menos de 60 segundos.",
        done: hasTemaIniciado,
        cta: "Ir ao Cronograma",
        action: () => setView && setView("crono"),
      },
      {
        id: "d0",
        icon: "✅",
        title: "Concluir 1º D0",
        desc: "Primeiro recall é a base da curva.",
        done: hasD0,
        cta: "Abrir Foco",
        action: () => nextTema && onStudy && onStudy(nextTema.id, "d0"),
      },
      {
        id: "rev",
        icon: "🧠",
        title: "1ª revisão espaçada (D1/D4)",
        desc: "É aqui que começa a memória de longo prazo.",
        done: hasD1D4,
        cta: "Revisar Agora",
        action: () => {
          if (!nextReviewTema || !onStudy) return;
          const step = nextReviewTema?.rev?.d1 && !nextReviewTema.rev.d1.done ? "d1" : "d4";
          onStudy(nextReviewTema.id, step);
        },
      },
      {
        id: "streak",
        icon: "🔥",
        title: "Hábito (3 dias seguidos)",
        desc: "Consistência real, sem pressão ou culpa.",
        done: streak3,
        cta: "",
        action: null,
      },
    ];
  }, [provasAlvo, temas, gamif?.streakCurrent, onOpenAjustes, setView, onStudy]);

  const doneCount = steps.filter((s) => s.done).length;
  const hidden = doneCount === 5 || totalSessions >= 10 || trilhaDispensada;

  useEffect(() => {
    const awarded = trilhaXpDados;
    let changed = false;
    const nextAwards = { ...awarded };
    for (const step of steps) {
      if (step.done && !nextAwards[step.id]) {
        nextAwards[step.id] = true;
        addXp(50, "outros");
        (showToast || showToastGlobal)(`Marco concluído: ${step.title} (+50 XP)`);
        changed = true;
      }
    }
    if (changed) {
      useStore.setState({ meta: { ...(meta || {}), trilhaXpDados: nextAwards } });
    }
  }, [steps, trilhaXpDados, addXp, showToast, showToastGlobal, meta]);

  if (hidden) return null;
  const nextStep = steps.find((s) => !s.done) || steps[steps.length - 1];

  const dismiss = () => {
    useStore.setState({ meta: { ...(meta || {}), trilhaDispensada: true } });
  };

  return (
    <section className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4 md:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Trilha de Jornada</p>
          <p className="text-sm text-white font-bold">{doneCount}/5 marcos concluídos</p>
        </div>
        <button type="button" onClick={dismiss} className="text-gray-500 hover:text-gray-300 border-none bg-transparent cursor-pointer" title="Dispensar trilha">
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500" style={{ width: `${Math.max(8, (doneCount / 5) * 100)}%` }} />
      </div>

      <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-blue-300 font-bold">Próximo marco</p>
            <p className="text-sm text-white font-bold mt-0.5">{nextStep.icon} {nextStep.title}</p>
            <p className="text-[11px] text-gray-300 mt-1">{nextStep.desc}</p>
          </div>
          {!nextStep.done && nextStep.action && nextStep.cta ? (
            <button type="button" onClick={nextStep.action} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold border-none cursor-pointer shrink-0">
              {nextStep.cta}
            </button>
          ) : (
            <span className="text-emerald-400 shrink-0"><Flag size={16} /></span>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {steps.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              {s.done ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <Circle size={16} className="text-gray-500 shrink-0" />}
              <span className={`text-xs font-semibold truncate ${s.done ? "text-emerald-300" : "text-gray-300"}`}>{s.title}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
