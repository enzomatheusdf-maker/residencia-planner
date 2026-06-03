import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarCheck2, ChevronDown, ChevronUp, X } from "lucide-react";
import { addDays, STEPS, todayStr } from "../core/fsrs";
import { buildWeeklyReview } from "../core/sessionReflection";
import { dominantErrorType, ERROR_TYPE_LABEL } from "../core/errorTaxonomy";
import {
  buildContextualWeeklyActions,
  canShowWeeklyReview,
  WEEKLY_REVIEW_LOCKED_MESSAGE,
} from "../core/weeklyReviewGate";
import { useStore } from "../core/store";

function countRecentDoneSteps(temas = [], days = 7) {
  const cutoff = addDays(todayStr(), -(days - 1));
  return temas
    .flatMap((tema) => STEPS.map((step) => tema.rev?.[step.key]))
    .filter((review) => review?.done && review?.date && review.date >= cutoff).length;
}

export default function WeeklyReview({ onAdjust, onAction }) {
  const plat = useStore((s) => s.plat);
  const temas = useStore((s) => s[plat]?.temas || []);
  const simulados = useStore((s) => s[plat]?.simulados || []);
  const casosProgresso = useStore((s) => s[plat]?.casosProgresso || {});
  const enamedAnalises = useStore((s) => s.enamedAnalises || []);
  const actionInbox = useStore((s) => s.actionInbox || []);
  const cronogramas = useStore((s) => s[plat]?.cronogramas || []);
  const sessionReflections = useStore((s) => s.sessionReflections || []);
  const weeklyReviews = useStore((s) => s.weeklyReviews || []);
  const saveWeeklyReview = useStore((s) => s.saveWeeklyReview);
  const showToast = useStore((s) => s.showToast);

  const shouldOpenByDefault = useMemo(() => new Date().getDay() === 0, []);
  const [expanded, setExpanded] = useState(shouldOpenByDefault);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  const review = useMemo(() => {
    const today = todayStr();
    const cutoff = addDays(today, -6);
    const recentCases = Object.values(casosProgresso).filter((item) => item?.atualizadoEm && item.atualizadoEm >= cutoff).length;
    const recentAnalises = enamedAnalises.filter((item) => item?.data ? item.data >= cutoff : false).length;

    // Revisões FSRS concluídas nos últimos 7d — métrica distinta de "sessões"
    // (que passa a ser o nº de reflexões/sessões de estudo registradas, via summary.total).
    const revisoesDone = countRecentDoneSteps(temas, 7);

    // Erro recorrente REAL: coleta erros das revisões (reviewedAt nos últimos 7d) + simulados (data nos últimos 7d).
    const fromReviews = temas.flatMap((tema) =>
      STEPS.flatMap((step) => {
        const r = tema.rev?.[step.key];
        if (!r?.done) return [];
        if (r.reviewedAt && r.reviewedAt < cutoff) return [];
        const structured = Array.isArray(r.erros) ? r.erros : [];
        const fallback = Array.isArray(r.motivosErro) ? r.motivosErro.map((tipoErro) => ({ tipoErro })) : [];
        return [...structured, ...fallback];
      })
    );
    const fromSimulados = simulados
      .filter((sim) => !sim.data || sim.data >= cutoff)
      .flatMap((sim) => (sim.questoesErradas || []).map((q) => ({ tipoErro: q.tipoErro })));
    const dominantRaw = dominantErrorType([...fromReviews, ...fromSimulados]);
    const dominantError = dominantRaw ? (ERROR_TYPE_LABEL[dominantRaw] || dominantRaw) : null;

    // Tema novo: próximo tema ainda não iniciado.
    const newTopicTema = temas.find((t) => t.unstarted === true || t.status === "novo");

    // Revisão crítica: tema com revisão pendente mais atrasada.
    let criticalReview = null;
    let oldestDue = null;
    const considerDue = (nome, due) => {
      if (due && due <= today && (!oldestDue || due < oldestDue)) {
        oldestDue = due;
        criticalReview = nome;
      }
    };
    temas.forEach((t) => {
      if (t.unstarted) return;
      STEPS.forEach((step) => {
        const r = t.rev?.[step.key];
        if (!r || r.done || r.skipped) return;
        considerDue(t.nome, r.date || r.scheduledAt);
      });
      const m = t.rev?.manutencao;
      if (m && !m.done) considerDue(t.nome, m.date || m.scheduledAt);
    });

    // Caso clínico: re-encontro mais próximo/vencido.
    const casosArr = Object.values(casosProgresso)
      .filter((c) => c?.proximaData)
      .sort((a, b) => (a.proximaData < b.proximaData ? -1 : 1));
    const clinicalCase = casosArr[0]?.temaNome || casosArr[0]?.casoId || null;

    return buildWeeklyReview({
      today,
      reflections: sessionReflections,
      actionInbox,
      revisoesDone,
      clinicalCases: recentCases,
      examAnalyses: recentAnalises,
      weakArea: enamedAnalises.slice(-1)[0]?.resumo?.areaCritica || null,
      highLoad: actionInbox.some((action) => action.type === "review" && action.priority >= 95),
      dominantError,
      newTopic: newTopicTema?.nome || null,
      criticalReview,
      clinicalCase,
    });
  }, [actionInbox, casosProgresso, enamedAnalises, sessionReflections, simulados, temas]);

  const lastReviewDate = weeklyReviews.slice(-1)[0]?.date;
  const alreadyReviewedThisWeek = Boolean(lastReviewDate && lastReviewDate >= addDays(todayStr(), -6));
  const overdueCount = actionInbox.filter((action) => action.type === "review").length;
  const reviewUnlocked = canShowWeeklyReview({
    today: todayStr(),
    temas,
    simulados,
    sessionReflections,
    sessionsCompleted: review.executed.sessions,
    trackedVolume: review.executed.sessions + review.executed.revisoes + simulados.length,
  });
  const contextualActions = buildContextualWeeklyActions({
    hasSchedule: cronogramas.length > 0,
    sessionsCompleted: review.executed.sessions,
    weakArea: review.blocked.areaFraca,
    hasUnstartedTopics: temas.some((tema) => tema?.unstarted),
    overdueCount,
  });

  const handleAccept = () => {
    if (saveWeeklyReview) saveWeeklyReview({ ...review, status: "accepted" });
    if (showToast) showToast("Plano semanal aceito.");
    setExpanded(false);
  };

  const triggerAction = (action) => {
    if (!action) return;
    if (onAction) onAction(action);
    if (onAdjust) onAdjust(action);
    setShowAdjustModal(false);
  };

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

      {!reviewUnlocked && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3">
          <p className="text-[12px] leading-relaxed text-gray-400">{WEEKLY_REVIEW_LOCKED_MESSAGE}</p>
        </div>
      )}

      {expanded && reviewUnlocked && (
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
              {review.blocked.areaFraca ? `Area mais fraca: ${review.blocked.areaFraca}.` : "Nenhum bloqueio dominante apareceu com confiança suficiente."}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">3. Plano da proxima semana</p>
            <ul className="mt-1 space-y-1 text-[12px] text-gray-300">
              {review.plan.priorities.length > 0 ? (
                review.plan.priorities.map((priority) => <li key={priority}>• {priority}</li>)
              ) : (
                <li>• Ainda sem prioridade forte o bastante para um plano fechado.</li>
              )}
              {review.plan.newTopic ? <li>• Tema novo: {review.plan.newTopic}</li> : null}
              {review.plan.criticalReview ? <li>• Revisao critica: {review.plan.criticalReview}</li> : null}
              {review.plan.clinicalCase ? <li>• Caso clinico: {review.plan.clinicalCase}</li> : null}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold border-none cursor-pointer"
            >
              Aceitar plano
            </button>
            <button
              type="button"
              onClick={() => {
                if (saveWeeklyReview) saveWeeklyReview({ ...review, status: "manual_adjust" });
                setShowAdjustModal(true);
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

      {showAdjustModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[410] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdjustModal(false)}>
          <div
            className="w-full max-w-lg bg-[var(--surface-2)] border border-white/10 rounded-2xl p-4 space-y-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-[12px] font-black uppercase tracking-wider text-gray-100">Ajustes da próxima semana</h4>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 flex items-center justify-center border border-white/10 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              Escolha o que quer ajustar agora. Isso sincroniza o plano do Mentor com o Dashboard.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {contextualActions.length > 0 ? contextualActions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => triggerAction(item.action)}
                  className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-[11px] font-bold text-left cursor-pointer"
                >
                  {item.label}
                </button>
              )) : (
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Ainda não há ajuste contextual forte o bastante para automatizar.
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
