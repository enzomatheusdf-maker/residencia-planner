import React, { useMemo, useState } from "react";
import { CalendarCheck2, ChevronDown, ChevronUp } from "lucide-react";
import { addDays, STEPS, todayStr } from "../core/fsrs";
import { buildWeeklyReview } from "../core/sessionReflection";
import { useStore } from "../core/store";

function countRecentDoneSteps(temas = [], days = 7) {
  const cutoff = addDays(todayStr(), -(days - 1));
  return temas
    .flatMap((tema) => STEPS.map((step) => tema.rev?.[step.key]))
    .filter((review) => review?.done && review?.date && review.date >= cutoff).length;
}

export default function WeeklyReview({ onAdjust }) {
  const plat = useStore((s) => s.plat);
  const temas = useStore((s) => s[plat]?.temas || []);
  const casosProgresso = useStore((s) => s[plat]?.casosProgresso || {});
  const enamedAnalises = useStore((s) => s.enamedAnalises || []);
  const actionInbox = useStore((s) => s.actionInbox || []);
  const sessionReflections = useStore((s) => s.sessionReflections || []);
  const weeklyReviews = useStore((s) => s.weeklyReviews || []);
  const saveWeeklyReview = useStore((s) => s.saveWeeklyReview);

  const shouldOpenByDefault = useMemo(() => new Date().getDay() === 0, []);
  const [expanded, setExpanded] = useState(shouldOpenByDefault);

  const review = useMemo(() => {
    const cutoff = addDays(todayStr(), -6);
    const recentCases = Object.values(casosProgresso).filter((item) => item?.atualizadoEm && item.atualizadoEm >= cutoff).length;
    const recentAnalises = enamedAnalises.filter((item) => item?.data ? item.data >= cutoff : false).length;
    const sessionsCompleted = countRecentDoneSteps(temas, 7);

    return buildWeeklyReview({
      today: todayStr(),
      reflections: sessionReflections,
      actionInbox,
      sessionsCompleted,
      revisoesDone: sessionsCompleted,
      clinicalCases: recentCases,
      examAnalyses: recentAnalises,
      weakArea: enamedAnalises.slice(-1)[0]?.resumo?.areaCritica || null,
      highLoad: actionInbox.some((action) => action.type === "review" && action.priority >= 95),
    });
  }, [actionInbox, casosProgresso, enamedAnalises, sessionReflections, temas]);

  const lastReviewDate = weeklyReviews.slice(-1)[0]?.date;
  const alreadyReviewedThisWeek = Boolean(lastReviewDate && lastReviewDate >= addDays(todayStr(), -6));

  return (
    <section className="bg-[var(--surface-1)] border border-white/5 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left border-none bg-transparent cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <CalendarCheck2 size={15} className="text-blue-400" />
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-200">Revisao da Semana</span>
          {alreadyReviewedThisWeek && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
              Ja revisado
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5">
          <div className="pt-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">1. O que voce executou</p>
            <p className="text-[12px] text-gray-300 mt-1">
              {review.executed.sessions} sessoes concluidas, {review.executed.revisoes} revisoes, {review.executed.casosClinicos} casos clinicos, {review.executed.provasAnalisadas} analises de prova.
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">2. O que travou</p>
            <p className="text-[12px] text-gray-300 mt-1">
              {review.blocked.baixaEnergia ? "Baixa energia detectada. " : ""}
              {review.blocked.errosRecorrentes ? `Erro recorrente: ${review.blocked.errosRecorrentes}. ` : ""}
              {review.blocked.areaFraca ? `Area mais fraca: ${review.blocked.areaFraca}.` : "Sem bloqueio dominante."}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">3. Plano da proxima semana</p>
            <ul className="mt-1 space-y-1 text-[12px] text-gray-300">
              {review.plan.priorities.length > 0 ? (
                review.plan.priorities.map((priority) => <li key={priority}>• {priority}</li>)
              ) : (
                <li>• Definir 3 prioridades no inicio da semana.</li>
              )}
              <li>• Tema novo: {review.plan.newTopic || "a definir"}</li>
              <li>• Revisao critica: {review.plan.criticalReview || "a definir"}</li>
              <li>• Caso clinico: {review.plan.clinicalCase || "a definir"}</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => saveWeeklyReview && saveWeeklyReview({ ...review, status: "accepted" })}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold border-none cursor-pointer"
            >
              Aceitar plano
            </button>
            <button
              type="button"
              onClick={() => {
                if (saveWeeklyReview) saveWeeklyReview({ ...review, status: "manual_adjust" });
                if (onAdjust) onAdjust();
              }}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-[11px] font-bold border border-white/10 cursor-pointer"
            >
              Ajustar manualmente
            </button>
            <button
              type="button"
              onClick={() => saveWeeklyReview && saveWeeklyReview({ ...review, status: "skipped" })}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-[11px] font-bold border border-white/10 cursor-pointer"
            >
              Pular
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

