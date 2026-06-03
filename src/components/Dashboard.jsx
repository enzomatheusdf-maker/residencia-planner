// src/components/Dashboard.jsx
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Edit2, Info, TrendingUp, TrendingDown, CheckCircle, ChevronDown, ChevronUp, Brain, Flame, Calendar, AlertTriangle, X, Zap, Layers, Share2, Unlock, GraduationCap, BarChart3, ClipboardList, Target } from "lucide-react";
import { useStore } from "../core/store";
import { STEPS, ESP_COLORS, isOverdue, todayStr, addDays, fmtDate, fmtFull, getRetrievability, getWorkloadProjection } from "../core/fsrs";
import { calcTrueRetention, calcBleedingScore, useFilaInteligente, PESOS_PROVA_VEST } from "../hooks/useMetrics";
import { getMentorDiagnosis, isExhaustionDetected } from "../core/mentor";
import { buildMentorContext, getMentorNextAction, getMentorTodayPlan } from "../core/mentorAutopilot";
import { isPlanSetupComplete } from "../core/onboardingGate";
import { getReadinessData } from "../core/readiness";
import { TourBalloon, Modal, Btn, ConfettiOverlay, ProgressiveTooltip, InfoTooltip } from "./Primitives";
import { ModalValidarDominio } from "./Modals";
import {
  DOMINIO_META,
  isTemaNaoIniciado,
} from "../core/domainValidation";
import RetrievabilitySpark from "./RetrievabilitySpark";
import DicaContextual from "./DicaContextual";
import TrilhaJornada from "./TrilhaJornada";
import useCountUp from "../hooks/useCountUp";
import { auth } from "../services/firebase";
import { CALENDAR_PROVIDERS, CALENDAR_PROVIDER_IDS } from "../constants/calendarProviders";
import { getPeakModePolicy, getPeakPhase } from "../core/peakMode";
import { parseCatalogEntry } from "../constants/catalogos";
import { resolveCatalogo, getCronogramaById } from "../constants/cronogramas";
import { safeTrackEvent } from "../core/telemetry";
import {
  buildDailyBriefing,
  canShowDailyBriefing,
  dismissDailyBriefing,
  getDailyBriefingStorageKey,
} from "../core/dailyBriefing";
import { getEnamedBottleneckExplanation, getEnamedIntel } from "../core/enamedIntel";
import ActionInbox from "./ActionInbox";
import WeeklyReview from "./WeeklyReview";
import EmptyState from "./EmptyState";
import VestibularStartTrail from "./VestibularStartTrail";
import { isVestibularStartComplete } from "../core/vestibularOnboarding";

/* --- CARGA FUTURA WIDGET --- */
function CargaFuturaWidget({ temas, maxRevisoesDia }) {
  const proj = getWorkloadProjection(temas, 14);
  const dayEntries = Object.values(proj);
  const dates = dayEntries.map((entry) => entry.date);
  const maxCount = Math.max(...dayEntries.map((entry) => entry?.count || 0), maxRevisoesDia, 1);
  const diasSobrecarga = dayEntries.filter((entry) => (entry?.count || 0) > maxRevisoesDia).length;
  
  return (
    <div className="medrev-card medrev-card-hover p-5 select-none animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[12px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
          <BarChart3 size={13} className="text-blue-400" />
          Carga de Revisões (Próximos 14 dias)
          <InfoTooltip texto="Projeção das revisões pendentes agendadas para os próximos 14 dias com base na curva de revisão." />
        </h4>
        <span className="text-[10px] text-gray-500 font-mono">Teto: {maxRevisoesDia}/dia · {diasSobrecarga} dias acima do teto</span>
      </div>
      
      <div className="flex items-end justify-between h-24 gap-1.5 pt-4">
        {dates.map((date) => {
          const entry = proj[date] || { count: 0, estimatedMinutes: 0 };
          const count = entry.count || 0;
          const minutes = entry.estimatedMinutes || 0;
          const pct = (count / maxCount) * 100;
          const exceeds = count > maxRevisoesDia;
          const today = date === todayStr();
          
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <div className="relative w-full flex justify-center">
                <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 text-[9px] text-gray-300 rounded px-1.5 py-0.5 whitespace-nowrap z-50 pointer-events-none font-mono">
                  {count} revs · {minutes} min
                </span>
              </div>
              <div 
                className={`w-full rounded-t transition-all duration-500 ${
                  exceeds 
                    ? "bg-gradient-to-t from-red-600 to-red-400" 
                    : today 
                    ? "bg-gradient-to-t from-blue-600 to-sky-500" 
                    : "bg-white/10 hover:bg-white/20"
                }`}
                style={{ height: `${Math.max(pct, 5)}%` }}
              />
              <span className={`text-[8px] font-bold ${today ? "text-sky-400 font-black" : "text-gray-600"}`}>
                {fmtDate(date)}
              </span>
            </div>
          );
        })}
      </div>
      <p className={`mt-3 text-[10px] font-semibold ${diasSobrecarga >= 3 ? "text-amber-300" : "text-emerald-300"}`}>
        {diasSobrecarga >= 3
          ? "Ação: não iniciar tema novo até reduzir a sobrecarga."
          : diasSobrecarga === 0
          ? "Carga controlada para os próximos 14 dias."
          : "Monitorando sobrecarga leve para manter o ritmo."}
      </p>
    </div>
  );
}

function getPreparoCalibration({ readinessData, trueRet, totalSessions, temasFiltrados, totalRevisoesFeitas }) {
  const startedCount = (temasFiltrados || []).filter((t) => !t.unstarted).length;
  const hasCoverage = (readinessData?.cobertura || 0) > 0 && startedCount >= 3;
  const hasSimulado = readinessData?.acertoSimulado != null;
  const hasRetencaoLonga = trueRet != null || readinessData?.trueRetention != null;
  const hasRitmo = readinessData?.saldoRitmoNorm != null;
  const hasAnki = readinessData?.adesaoAnkiNorm != null;

  const evidencias = [hasCoverage, hasSimulado, hasRetencaoLonga, hasRitmo, hasAnki].filter(Boolean).length;

  let nivel = "baixa";
  let tone = "text-amber-300 border-amber-500/20 bg-amber-500/10";
  let label = "Estimativa inicial";

  if (evidencias >= 4 && totalSessions >= 30 && totalRevisoesFeitas >= 30) {
    nivel = "alta";
    tone = "text-emerald-300 border-emerald-500/20 bg-emerald-500/10";
    label = "Estimativa calibrada";
  } else if (evidencias >= 2 && totalSessions >= 7) {
    nivel = "media";
    tone = "text-blue-300 border-blue-500/20 bg-blue-500/10";
    label = "Estimativa em calibração";
  }

  const missing = [];
  if (!hasRetencaoLonga) missing.push("retenção longa D21+");
  if (!hasSimulado) missing.push("simulados");
  if (!hasRitmo) missing.push("ritmo de questões");
  if (!hasAnki) missing.push("adesão Anki");

  return {
    nivel,
    tone,
    label,
    evidencias,
    missing,
    trueRetentionStatus: hasRetencaoLonga ? "ativa" : "coletando",
  };
}

/* --- WELCOME POPUP --- */
function WelcomePopup({ briefing, streakCurrent, onClose, onStartFocus }) {
  if (!briefing) return null;

  return (
    <section className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/35 via-[var(--surface-1)] to-sky-950/20 p-4 shadow-lg shadow-slate-950/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">Resumo do dia</p>
          <h3 className="mt-1 text-sm font-black text-white">{briefing.title}</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-gray-300">{briefing.priority}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 hover:text-gray-200"
          aria-label="Fechar resumo do dia"
        >
          <X size={15} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">Revisões de hoje</p>
          <p className="mt-1 text-[14px] font-black text-white">{briefing.reviewsToday}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">Tempo estimado</p>
          <p className="mt-1 text-[14px] font-black text-white">{briefing.estimatedMinutes} min</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">Streak</p>
          <p className="mt-1 text-[14px] font-black text-white">{streakCurrent}/7 dias</p>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-gray-400">{briefing.helperText}</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onStartFocus}
          className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2.5 text-[12px] font-black text-white shadow-lg shadow-blue-950/25"
        >
          {briefing.primaryCta}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[12px] font-semibold text-gray-300"
        >
          {briefing.secondaryCta}
        </button>
      </div>
    </section>
  );
}

function MiniCronogramaWidget({
  plat,
  setView,
  onStudy,
  onMarkMastery,
  overdue = [],
  today_ = [],
  temas = [],
  calendarProvider,
  cronogramaSel,
  temasPerWeek,
  estrategiaStartDate,
  onAdjustWeeklyTopics,
}) {
  const cronogramas = useStore((s) => s[plat]?.cronogramas || []);
  const activeCrono = useMemo(() => cronogramas[0] || null, [cronogramas]);

  const dueTodayItems = useMemo(() => {
    return [...overdue, ...today_];
  }, [overdue, today_]);

  const activeProvider = calendarProvider?.activeId || CALENDAR_PROVIDER_IDS.MEDCOF;
  const importedTopics = calendarProvider?.importedTopics;
  const customTopics = calendarProvider?.customTopics;
  const selectedPlanId = cronogramaSel?.[plat] || "res-medcof-2026";
  const semanaBaseDate = estrategiaStartDate || todayStr();
  const diffDays = Math.max(0, Math.floor((new Date(todayStr()) - new Date(semanaBaseDate)) / (1000 * 60 * 60 * 24)));
  const semanaAtual = Math.floor(diffDays / 7) + 1;

  const weekPlan = useMemo(() => {
    if (plat !== "res") return { label: "Semana atual", topics: [] };

    if (activeProvider === CALENDAR_PROVIDER_IDS.MEDCOF) {
      const medcofCatalog = resolveCatalogo("res", selectedPlanId) || [];
      const idx = Math.min(Math.max(semanaAtual - 1, 0), Math.max(medcofCatalog.length - 1, 0));
      const bloco = medcofCatalog[idx];
      const topics = (bloco?.t || []).slice(0, temasPerWeek || 6).map((entry) => {
        const parsed = parseCatalogEntry(entry);
        return { nome: parsed.nome, esp: parsed.esp };
      });
      return {
        label: bloco?.nome || `MEDCOF · Semana ${semanaAtual}`,
        topics,
      };
    }

    const sourceTopicsRaw = activeProvider === CALENDAR_PROVIDER_IDS.CUSTOM ? customTopics : importedTopics;
    const sourceTopics = Array.isArray(sourceTopicsRaw) ? sourceTopicsRaw : [];
    if (!sourceTopics.length) return { label: "Sem tópicos importados", topics: [] };
    const weekMap = sourceTopics.reduce((acc, topic) => {
      const weekLabel = topic?.semana || "Sem semana definida";
      if (!acc[weekLabel]) acc[weekLabel] = [];
      acc[weekLabel].push(topic);
      return acc;
    }, {});
    const weekKeys = Object.keys(weekMap);
    if (!weekKeys.length) return { label: "Sem semana definida", topics: [] };
    const weekKey = weekKeys[Math.min(semanaAtual - 1, weekKeys.length - 1)];
    const topics = (weekMap[weekKey] || [])
      .sort((a, b) => (a?.ordem || 0) - (b?.ordem || 0))
      .slice(0, temasPerWeek || 6)
      .map((topic) => ({
        nome: topic.temaOriginal || topic.tema || "Tema importado",
        esp: topic.areaCanonica || topic.areaOriginal || topic.area || "Geral",
      }));

    return {
      label: weekKey,
      topics,
    };
  }, [plat, activeProvider, selectedPlanId, semanaAtual, temasPerWeek, importedTopics, customTopics]);

  const strategyName = useMemo(() => {
    if (activeProvider === CALENDAR_PROVIDER_IDS.USER_IMPORTED) return "Estratégia MED";
    if (activeProvider === CALENDAR_PROVIDER_IDS.CUSTOM) return "Custom";
    const plan = getCronogramaById(selectedPlanId);
    return plan?.nome || "MEDCOF 2026";
  }, [activeProvider, selectedPlanId]);

  return (
    <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-lg relative overflow-hidden text-left">
      <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />
      <div className="absolute left-0 -bottom-8 w-28 h-28 rounded-full bg-indigo-600/4 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
            <Calendar size={12} className="text-blue-400" />
          </div>
          <span className="text-[10.5px] font-black uppercase text-gray-200 tracking-wider">
            Revisão & Cronograma
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8.5px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
            {strategyName}
          </span>
          {activeCrono && (
            <button
              onClick={() => setView && setView("crono")}
              className="text-[9px] font-bold text-blue-400 hover:text-blue-300 transition-colors border-none p-0 bg-transparent cursor-pointer"
            >
              Ver tudo →
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* ── Column 1: Revisões de hoje ── */}
        <div className="flex flex-col gap-2 rounded-xl border border-blue-500/15 bg-gradient-to-b from-blue-950/30 to-transparent p-3 min-h-[150px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-blue-300/70">
              Revisões de hoje
            </span>
            <span className={`text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
              dueTodayItems.length === 0
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-blue-500/20 text-blue-300"
            }`}>
              {dueTodayItems.length === 0 ? "✓ zerada" : `${dueTodayItems.length} pendentes`}
            </span>
          </div>

          <div className="flex flex-col gap-1 max-h-[148px] overflow-y-auto pr-0.5">
            {dueTodayItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-5 gap-1">
                <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <span className="text-sm">✓</span>
                </div>
                <p className="text-[10px] text-emerald-400 font-semibold">Fila zerada!</p>
                <p className="text-[9px] text-gray-600">Parabéns pela consistência.</p>
              </div>
            ) : (
              dueTodayItems.map((item, idx) => {
                const temaObj = temas.find(t => t.id === item.temaId);
                const espColor = ESP_COLORS[item.esp] || "#94a3b8";
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2 py-1.5 bg-black/25 rounded-lg border border-white/[0.04] hover:border-white/10 transition-colors"
                  >
                    <div
                      className="w-0.5 h-7 rounded-full shrink-0"
                      style={{ backgroundColor: espColor + "cc" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-gray-100 truncate leading-tight" title={item.temaNome}>
                        {item.temaNome}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[8.5px] uppercase font-bold tracking-wide" style={{ color: espColor + "bb" }}>
                          {item.esp}
                        </span>
                        <span className="text-[8px] text-gray-600">·</span>
                        <span className="text-[8.5px] text-blue-400/70 font-mono">{item.step.label}</span>
                      </div>
                    </div>
                    {temaObj && <RetrievabilitySpark tema={temaObj} />}
                    <button
                      onClick={() => onStudy && onStudy(item.temaId, item.step.key)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg text-[9px] font-bold transition-all shrink-0 cursor-pointer border-none shadow-sm shadow-blue-900/40"
                    >
                      Focar
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Column 2: Cronograma da Semana ── */}
        <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/[0.015] p-3 min-h-[150px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">
              Plano da semana
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[8.5px] font-bold text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                Sem. {semanaAtual}
              </span>
            </div>
          </div>

          {weekPlan.label && (
            <p className="text-[9.5px] text-gray-500 italic leading-tight truncate" title={weekPlan.label}>
              {weekPlan.label}
            </p>
          )}

          {weekPlan.topics.length > 0 ? (
            <div className="flex flex-col gap-1 max-h-[148px] overflow-y-auto pr-0.5">
              {weekPlan.topics.map((item, idx) => {
                const temaExistente = temas.find((tema) => tema.nome === item.nome);
                const nextStep = temaExistente ? STEPS.find((step) => !temaExistente.rev?.[step.key]?.done) : null;
                const canFocus = Boolean(temaExistente && nextStep);
                const espColor = ESP_COLORS[item.esp] || "#94a3b8";
                return (
                  <div
                    key={`${item.nome}-${idx}`}
                    className="flex items-center gap-2 px-2 py-1.5 bg-black/20 rounded-lg border border-white/[0.04] hover:border-white/10 transition-colors"
                  >
                    <div
                      className="w-0.5 h-7 rounded-full shrink-0"
                      style={{ backgroundColor: espColor + "aa" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-gray-100 truncate leading-tight" title={item.nome}>
                        {item.nome}
                      </p>
                      <span className="text-[8.5px] uppercase font-bold tracking-wide" style={{ color: espColor + "99" }}>
                        {item.esp}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (canFocus && onStudy) {
                            onStudy(temaExistente.id, nextStep.key);
                          } else if (setView) {
                            setView("crono");
                          }
                        }}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg text-[9px] font-bold border-none cursor-pointer transition-all shadow-sm shadow-blue-900/40"
                      >
                        Focar
                      </button>
                      <button
                        type="button"
                        onClick={() => onMarkMastery && onMarkMastery(item)}
                        className="px-2 py-1 bg-white/[0.04] hover:bg-white/10 text-gray-400 hover:text-gray-200 rounded-lg text-[9px] font-bold border border-white/10 cursor-pointer transition-all"
                      >
                        Já domino
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-4">
              <p className="text-[10px] text-gray-600">Sem tópicos para esta semana.</p>
              <button
                type="button"
                onClick={() => setView && setView("crono")}
                className="text-[9px] bg-blue-600/15 text-blue-300 border border-blue-500/20 px-2.5 py-1.5 rounded-lg font-bold cursor-pointer hover:bg-blue-600/25 transition-all"
              >
                Configurar calendário
              </button>
            </div>
          )}

          <div className="pt-1.5 border-t border-white/5 flex gap-1.5">
            <button
              type="button"
              onClick={() => onAdjustWeeklyTopics && onAdjustWeeklyTopics(-1)}
              className="flex-1 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-gray-500 hover:text-gray-300 text-[9px] font-bold border border-white/8 cursor-pointer transition-all"
            >
              − temas/sem
            </button>
            <button
              type="button"
              onClick={() => onAdjustWeeklyTopics && onAdjustWeeklyTopics(1)}
              className="flex-1 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-gray-500 hover:text-gray-300 text-[9px] font-bold border border-white/8 cursor-pointer transition-all"
            >
              + temas/sem
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function MetacognitiveChart({ doneReviews }) {
  const chartData = useMemo(() => {
    if (!doneReviews) return [];
    return doneReviews
      .filter(r => r.confianca != null && r.acerto != null)
      .slice(-8)
      .map(r => ({
        label: r.step.label + " " + r.temaNome.slice(0, 10) + "...",
        conf: r.confianca * 20,
        acerto: Math.round(r.acerto * 100)
      }));
  }, [doneReviews]);

  if (chartData.length < 2) {
    return (
      <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center min-h-[140px] text-center">
        <TrendingUp size={16} className="text-gray-600 mb-1" />
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Calibração Metacognitiva</p>
        <p className="text-[10px] text-gray-600 mt-1 max-w-xs leading-relaxed">
          Dados insuficientes. Faça mais revisões declarando sua confiança para ver o gráfico de calibração.
        </p>
      </div>
    );
  }

  // SVG dimensions
  const width = 300;
  const height = 120;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // X & Y scaling
  const getX = (index) => padding + (index / (chartData.length - 1)) * chartWidth;
  const getY = (val) => height - padding - (val / 100) * chartHeight;

  // Path generators
  const confPoints = chartData.map((d, i) => `${getX(i)},${getY(d.conf)}`).join(" ");
  const acertoPoints = chartData.map((d, i) => `${getX(i)},${getY(d.acerto)}`).join(" ");

  return (
    <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Calibração: Confiança vs Acerto</p>
        <div className="flex items-center gap-3 text-[9px] font-bold">
          <span className="flex items-center gap-1 text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Confiança
          </span>
          <span className="flex items-center gap-1 text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Acerto Real
          </span>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Y Axis grid lines */}
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v} className="opacity-20">
              <line
                x1={padding}
                y1={getY(v)}
                x2={width - padding}
                y2={getY(v)}
                stroke="#fff"
                strokeWidth={0.5}
                strokeDasharray="2,2"
              />
              <text
                x={padding - 5}
                y={getY(v) + 2}
                fill="#fff"
                fontSize={6}
                textAnchor="end"
              >
                {v}%
              </text>
            </g>
          ))}

          {/* Lines */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth={1.5}
            points={confPoints}
            className="drop-shadow"
          />
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth={1.5}
            points={acertoPoints}
            className="drop-shadow"
          />

          {/* Dots */}
          {chartData.map((d, i) => (
            <g key={i}>
              <circle
                cx={getX(i)}
                cy={getY(d.conf)}
                r={2.5}
                fill="#3b82f6"
                stroke="var(--surface-2)"
                strokeWidth={0.5}
              />
              <circle
                cx={getX(i)}
                cy={getY(d.acerto)}
                r={2.5}
                fill="#38bdf8"
                stroke="var(--surface-2)"
                strokeWidth={0.5}
              />
            </g>
          ))}
        </svg>
      </div>
      <p className="text-[8.5px] text-gray-600 leading-normal">
        Idealmente, as linhas devem andar juntas. Se a linha de <strong>Confiança</strong> estiver muito acima da de <strong>Acerto</strong>, você está subestimando a dificuldade (excesso de confiança).
      </p>
    </div>,
    document.body
  );
}

function DashboardKpiCard({ label, value, tone = "text-white", children, action, tooltip, className = "", delayMs = 0, icon, accentColor }) {
  return (
    <div
      className={`medrev-card medrev-card-hover relative group flex flex-col justify-between overflow-hidden animate-fade-up ${className}`}
      style={{
        animationDelay: `${Math.min(delayMs, 300)}ms`,
        borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
        padding: "1.1rem 1.25rem",
        minHeight: "7.5rem",
      }}
    >
      {accentColor && (
        <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full blur-2xl pointer-events-none opacity-30" style={{ background: accentColor }} />
      )}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[9.5px] text-[var(--text-3)] uppercase tracking-[0.12em] font-black flex items-center gap-1.5">
          {icon && <span className="text-[13px] leading-none">{icon}</span>}
          {label}
          {tooltip && <InfoTooltip texto={tooltip} />}
        </p>
        {action}
      </div>
      <div className="mt-2">
        <p className={`text-[2rem] md:text-[2.25rem] font-black tabular-nums leading-none tracking-tight ${tone}`}>
          {value}
        </p>
        <div className="mt-1.5 space-y-0.5">
          {children}
        </div>
      </div>
    </div>
  );
}

function DailyProgressRing({ value, goal }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(value / goal, 1) : 0;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="url(#daily-progress)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset var(--dur-slow) var(--ease-out)" }}
        />
        <defs>
          <linearGradient id="daily-progress" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold tabular-nums text-white">{Math.min(value, goal)}</span>
        <span className="text-[10px] font-bold text-[var(--text-3)]">/{goal} hoje</span>
      </div>
    </div>
  );
}

export default function Dashboard({ onStudy, onDelete, userName, onEditName, focusMode, modoSimples, toggleModoSimples, setView, showToast, onOpenAjustes }) {
  const currentUid = auth.currentUser?.uid || null;
  const { plat, sprint, tourStep, setTourStep, setOnboardingDone, onboardingDone } = useStore();
  const showToastGlobal = useStore((s) => s.showToast);
  const openConfirm = useStore((s) => s.openConfirm);
  const validarDominio  = useStore((s) => s.validarDominio);
  const iniciarValidacaoDominioPrevio = useStore((s) => s.iniciarValidacaoDominioPrevio);
  const addTema = useStore((s) => s.addTema);
  const gamif           = useStore((s) => s.gamif);
  const temas           = useStore((s) => s[plat]?.temas || []);
  const temaStats       = useStore((s) => s.temaStats || {});
  const meta            = useStore((s) => s.meta);
  const enamedAnalises = useStore((s) => s.enamedAnalises || []);
  const sessionReflections = useStore((s) => s.sessionReflections || []);
  const rebuildActionInboxForToday = useStore((s) => s.rebuildActionInboxForToday);
  const telemetryMeta = useStore((s) => s.meta);
  const calendarProvider = useStore((s) => s.calendarProvider || { activeId: "medcof" });
  const cronogramaSel = useStore((s) => s.cronogramaSel);
  const providerAtivoLabel = useMemo(() => {
    const found = CALENDAR_PROVIDERS.find((p) => p.id === calendarProvider.activeId);
    return found?.label || "MEDCOF";
  }, [calendarProvider.activeId]);
  const openSetupAjustes = useCallback(() => {
    if (onOpenAjustes) {
      onOpenAjustes({ initialTab: "ajustes" });
      return;
    }
    if (setView) setView("crono");
  }, [onOpenAjustes, setView]);

  const handleMarkMastery = (item) => {
    if (!item?.nome) return;
    const existing = temas.find((tema) => tema.nome === item.nome);
    if (existing) {
      setTemaValidando(existing);
      return;
    }
    const novoTema = {
      id: Date.now(),
      nome: item.nome,
      esp: item.esp || "Outro",
      prio: "Alta",
      importancia: "ALTA",
      obs: "Criado pelo Dashboard para validação de domínio prévio.",
      unstarted: true,
      d0: todayStr(),
    };
    addTema(plat, novoTema);
    setTemaValidando(novoTema);
  };

  const handleAdjustWeeklyTopics = (delta) => {
    const current = Number(meta?.temasPerWeek ?? 6);
    const next = Math.min(12, Math.max(1, current + delta));
    useStore.setState({ meta: { ...meta, temasPerWeek: next } });
    (showToast || showToastGlobal)(`Temas por semana ajustado para ${next}.`);
  };

  const handleInsightAction = (action) => {
    if (action.type === "focar") {
      if (action.esp && plat === "res") {
        const nextSprint = { esps: [action.esp], ativa: true, semana: `foco-${todayStr()}` };
        useStore.getState().setSprint(nextSprint);
      }
      setView && setView("crono");
      (showToast || showToastGlobal)(`Priorizando ${action.esp}`);
    } else if (action.type === "agendar") {
      const updatedMeta = { ...meta, notif: { ...(meta?.notif || {}), hora: action.time, enabled: true } };
      useStore.setState({ meta: updatedMeta });
      openSetupAjustes();
      (showToast || showToastGlobal)(`Lembrete agendado para as ${action.time}.`);
    } else if (action.type === "study") {
      if (action.temaId && action.stepKey && onStudy) {
        onStudy(action.temaId, action.stepKey);
      } else {
        setView && setView("crono");
      }
    } else if (action.type === "setView") {
      setView(action.view);
    } else if (action.type === "import_calendar") {
      setView && setView("crono");
      (showToast || showToastGlobal)("Abra o bloco azul de calendário e use 'Importar cronograma'.");
    } else if (action.type === "ja_domino") {
      setView && setView("crono");
      (showToast || showToastGlobal)("No plano da semana, use o botão 'Já domino' no tema desejado.");
    } else if (action.type === "aliviar") {
      const currentCap = meta.maxRevisoesDia || 30;
      const newCap = Math.max(5, Math.round(currentCap / 2));
      const updatedMeta = { ...meta, maxRevisoesDia: newCap };
      useStore.setState({ meta: updatedMeta });
      if (showToast) {
        (showToast || showToastGlobal)(`Fila aliviada: limite diário ajustado de ${currentCap} para ${newCap}.`);
      }
    }
  };

  const [showDetailedPanels, setShowDetailedPanels] = useState(false);
  const [showTourBalloon, setShowTourBalloon] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showConfettiLocal, setShowConfettiLocal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCompleto, setShowCompleto] = useState(!modoSimples);
  const [showSetupFlow, setShowSetupFlow] = useState(false);
  const [showHeroMeta, setShowHeroMeta] = useState(false);
  const [temaValidando, setTemaValidando] = useState(null);
  const lastMentorSeenRef = useRef("");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const temasFiltrados = useMemo(() => {
    let list = temas;
    if (sprint?.ativa && sprint?.esps?.length > 0) {
      list = temas.filter(t => sprint.esps.includes(t.esp));
    }
    if (tourStep === "dash") {
      const isVest = plat === "vest";
      const mockTema = {
        id: isVest ? "demo-funcoes" : "demo-apendicite",
        nome: isVest ? "Funções e Gráficos [DEMO]" : "Apendicite Aguda [DEMO]",
        esp: isVest ? "Matemática" : "Cirurgia",
        importancia: "ALTA",
        pico: isVest ? "Função afim f(x)=ax+b, coeficiente angular, raiz da função, representação no plano cartesiano..." : "Paciente com dor epigástrica que migrou para a fossa ilíaca direita, sinal de Blumberg +",
        ankiDeck: isVest ? "Vestibular::Matemática" : "Medicina::Cirurgia",
        rev: {
          d0: { done: true, date: todayStr(), acerto: 1.0 },
          d1: { done: false, date: todayStr() },
          d4: { done: false, date: todayStr() },
          d7: { done: false, date: todayStr() },
          d21: { done: false, date: todayStr() }
        }
      };
      return [mockTema, ...list];
    }
    return list;
  }, [temas, sprint, tourStep, plat]);
  const enamedBottleneck = useMemo(() => (
    plat === "res"
      ? getEnamedBottleneckExplanation(getEnamedIntel(temasFiltrados), { minimumStarted: 2 })
      : null
  ), [plat, temasFiltrados]);

  const autoCatchUp = useStore((s) => s.autoCatchUp);
  useEffect(() => {
    autoCatchUp();
  }, [autoCatchUp]);

  const done    = temasFiltrados
    .flatMap((t) => STEPS.map((s) => ({ ...t.rev[s.key], esp: t.esp, step: s, temaNome: t.nome, temaId: t.id, ankiDeck: t.ankiDeck })))
    .filter((r) => r.done && !r.skipped && r.skipReason !== "dominio_previo" && !r.skippeadoPorDominio);

  const filaInteligente = useFilaInteligente(temasFiltrados);

  const cap = meta.maxRevisoesDia || 30;
  const allPendingSorted = useMemo(() => {
    return filaInteligente;
  }, [filaInteligente]);

  const exibidosHoje = useMemo(() => allPendingSorted.slice(0, cap), [allPendingSorted, cap]);
  const naReserva = Math.max(0, allPendingSorted.length - cap);

  const overdue = useMemo(() => {
    return exibidosHoje.filter(item => item.overdue).map(item => {
      const tema = temasFiltrados.find(t => t.id === item.temaId);
      return {
        ...(tema?.rev[item.stepKey] || {}),
        esp: item.esp,
        step: item.step,
        temaNome: item.temaNome,
        temaId: item.temaId,
        ankiDeck: tema?.ankiDeck || ""
      };
    });
  }, [exibidosHoje, temasFiltrados]);

  const today_ = useMemo(() => {
    return exibidosHoje.filter(item => !item.overdue).map(item => {
      const tema = temasFiltrados.find(t => t.id === item.temaId);
      return {
        ...(tema?.rev[item.stepKey] || {}),
        esp: item.esp,
        step: item.step,
        temaNome: item.temaNome,
        temaId: item.temaId,
        ankiDeck: tema?.ankiDeck || ""
      };
    });
  }, [exibidosHoje, temasFiltrados]);

  const pending = overdue.length + today_.length;

  const diag = useMemo(() => {
    return getMentorDiagnosis(userName, temasFiltrados, done, temaStats, plat, meta);
  }, [userName, temasFiltrados, done, temaStats, plat, meta]);

  const totalRevisoesFeitas = useMemo(() => done.length, [done]);

  const prontidao = useMemo(() => {
    const state = useStore.getState();
    const simulados = state[plat]?.simulados || [];
    const readiness = getReadinessData({ temas: temasFiltrados, simulados, meta, plat });
    return readiness.score || 0;
  }, [temasFiltrados, plat, meta]);
  const readinessData = useMemo(() => {
    const state = useStore.getState();
    const simulados = state[plat]?.simulados || [];
    return getReadinessData({ temas: temasFiltrados, simulados, meta, plat });
  }, [temasFiltrados, plat, meta]);

  const readinessTrend = useMemo(() => {
    const hist = meta.prontidaoHist || [];
    if (hist.length === 0) {
      return { current: prontidao, delta7: 0, delta30: 0 };
    }
    
    const current = prontidao;
    
    const sevenDaysAgo = addDays(todayStr(), -7);
    const rec7 = hist.find(r => r.d >= sevenDaysAgo) || hist[0];
    const val7 = rec7 ? rec7.score : current;
    
    const thirtyDaysAgo = addDays(todayStr(), -30);
    const rec30 = hist.find(r => r.d >= thirtyDaysAgo) || hist[0];
    const val30 = rec30 ? rec30.score : current;
    
    return {
      current,
      delta7: current - val7,
      delta30: current - val30
    };
  }, [meta.prontidaoHist, prontidao]);

  const sparklinePath = useMemo(() => {
    const hist = meta.prontidaoHist || [];
    if (hist.length < 2) return "";
    const width = 100;
    const height = 20;
    const padding = 2;
    const maxVal = 100;
    const dx = width / (hist.length - 1);
    
    return hist.map((p, i) => {
      const x = i * dx;
      const y = height - padding - (p.score / maxVal) * (height - padding * 2);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }, [meta.prontidaoHist]);

  const criticalAlerts = useMemo(() => {
    if (!diag || !diag.insights) return [];
    return diag.insights.filter(ins => ins.type === "alerta" || ins.type === "vies_excesso" || ins.type === "vies_inseguranca");
  }, [diag]);

  const nonCriticalInsights = useMemo(() => {
    if (!diag || !diag.insights) return [];
    return diag.insights.filter(ins => ins.type !== "alerta" && ins.type !== "vies_excesso" && ins.type !== "vies_inseguranca");
  }, [diag]);
  const hasExhaustionNow = useMemo(() => isExhaustionDetected(temaStats, done), [temaStats, done]);
  const totalSessions = useMemo(() => {
    return temas
      .flatMap((t) => [
        ...STEPS.map((s) => t.rev?.[s.key]),
        t.rev?.manutencao,
      ])
      .filter((r) => r?.done === true && !r.skipped && r.skipReason !== "dominio_previo" && !r.skippeadoPorDominio)
      .length;
  }, [temas]);

  const doneDays = useMemo(() => new Set(done.map((r) => r.date)), [done]);
  const streakCurrent = gamif?.streakCurrent || 0;
  const trueRet = calcTrueRetention(temasFiltrados);
  const bleeding = calcBleedingScore(temasFiltrados);
  const temasManutencao = useMemo(() => {
    return temasFiltrados.filter(t => t.rev?.manutencao && !t.rev.manutencao.done);
  }, [temasFiltrados]);

  // --- VESTIBULAR COMPUTED METRICS ---
  const areaRetention = useMemo(() => {
    if (plat !== "vest") return {};
    const byArea = {};
    for (const t of temasFiltrados) {
      if (t.unstarted) continue;
      if (!byArea[t.esp]) byArea[t.esp] = { sum: 0, count: 0 };
      for (const s of STEPS) {
        const r = t.rev[s.key];
        if (r && r.done && r.acerto != null) {
          byArea[t.esp].sum += r.acerto;
          byArea[t.esp].count++;
        }
      }
    }
    return Object.fromEntries(
      Object.entries(byArea).map(([esp, v]) => [
        esp, v.count > 0 ? Math.round((v.sum / v.count) * 100) : null
      ])
    );
  }, [plat, temasFiltrados]);

  const notaProjetada = useMemo(() => {
    if (plat !== "vest") return null;
    const filteredProvas = (meta?.provasAlvo || []).filter(p => ["UnB", "UFG"].includes(p));
    const provaAlvo = filteredProvas[0] || "UnB";
    const pesos = PESOS_PROVA_VEST[provaAlvo] || PESOS_PROVA_VEST.ENEM;
    let sumPeso = 0, sumScore = 0;
    for (const [area, peso] of Object.entries(pesos)) {
      if (!peso) continue;
      const ret = areaRetention[area];
      sumScore += (ret != null ? ret : 50) * peso;
      sumPeso += peso;
    }
    return sumPeso > 0 ? Math.round(sumScore / sumPeso) : null;
  }, [plat, meta, areaRetention]);

  const daysToProva = useMemo(() => {
    if (!meta?.dataProva) return null;
    const provaDate = new Date(meta.dataProva + "T12:00:00");
    return Math.ceil((provaDate - new Date()) / (1000 * 60 * 60 * 24));
  }, [meta?.dataProva]);
  const peakPhase = useMemo(() => getPeakPhase({ examDate: meta?.dataProva, today: todayStr() }), [meta?.dataProva]);
  const peakPolicy = useMemo(() => getPeakModePolicy(peakPhase), [peakPhase]);
  const peakModeAtivo = peakPhase !== "base";
  const hasPendingClosure = useMemo(() => {
    if (!meta?.lastFocusSessionAt) return false;
    if (!meta?.lastReflectionAt) return true;
    return meta.lastReflectionAt < meta.lastFocusSessionAt;
  }, [meta?.lastFocusSessionAt, meta?.lastReflectionAt]);
  const semanaDeProva = daysToProva != null && daysToProva >= 0 && daysToProva <= 7;

  useEffect(() => {
    if (!rebuildActionInboxForToday) return;
    rebuildActionInboxForToday();
  }, [rebuildActionInboxForToday, pending, overdue.length, meta?.dataProva, enamedAnalises.length, sessionReflections.length]);

  useEffect(() => {
    if (modoSimples) {
      setShowCompleto(false);
    }
  }, [modoSimples]);

  useEffect(() => {
    const shouldShow = canShowDailyBriefing({
      state: { plat, meta, onboardingDone, tourStep, userName },
      context: {
        pendingCount: pending,
        overdueCount: overdue.length,
        estimatedMinutes: pending * 12,
      },
      uid: currentUid,
    });
    setShowWelcome(shouldShow);
  }, [currentUid, meta, onboardingDone, overdue.length, pending, plat, tourStep, userName]);

  const acertoMedio = useMemo(() => {
    const rs = done.filter(r => r.acerto != null);
    return rs.length ? Math.round(rs.reduce((a, r) => a + r.acerto, 0) / rs.length * 100) : null;
  }, [done]);

  // ZONA 1 Target Foco
  const topFilaItem = useMemo(() => {
    // If we have items in the optimal FSRS retrievability window, prioritize them!
    const optimalFila = [...overdue, ...today_].filter(item => {
      const tema = temasFiltrados.find(t => t.id === item.temaId);
      if (!tema) return false;
      const R = getRetrievability(tema, item.step.key);
      return R >= 0.85 && R <= 0.90;
    });
    if (optimalFila.length > 0) {
      return {
        temaId: optimalFila[0].temaId,
        stepKey: optimalFila[0].step.key,
        temaNome: optimalFila[0].temaNome,
        isOptimal: true
      };
    }
    if (filaInteligente.length > 0) {
      const first = filaInteligente[0];
      const tema = temasFiltrados.find(t => t.id === first.temaId);
      const R = tema ? getRetrievability(tema, first.stepKey) : 1.0;
      return {
        ...first,
        isOptimal: R >= 0.85 && R <= 0.90
      };
    }
    const chronoFila = [...overdue, ...today_];
    if (chronoFila.length > 0) {
      const first = chronoFila[0];
      const tema = temasFiltrados.find(t => t.id === first.temaId);
      const R = tema ? getRetrievability(tema, first.step.key) : 1.0;
      return {
        temaId: first.temaId,
        stepKey: first.step.key,
        temaNome: first.temaNome,
        isOptimal: R >= 0.85 && R <= 0.90
      };
    }
    return null;
  }, [filaInteligente, overdue, today_, temasFiltrados]);

  const preparoCalibration = useMemo(() => {
    return getPreparoCalibration({
      readinessData,
      trueRet,
      totalSessions,
      temasFiltrados,
      totalRevisoesFeitas,
    });
  }, [readinessData, trueRet, totalSessions, temasFiltrados, totalRevisoesFeitas]);

  const mentorContext = useMemo(() => {
    const state = useStore.getState();
    return buildMentorContext(state, plat, {
      readinessData,
      lowEnergy: hasExhaustionNow,
      exhaustionDetected: hasExhaustionNow,
    });
  }, [plat, readinessData, hasExhaustionNow]);

  const mentorNextAction = useMemo(() => getMentorNextAction(mentorContext), [mentorContext]);
  const mentorTodayPlan = useMemo(() => getMentorTodayPlan(mentorContext), [mentorContext]);
  const agendaTodaySummary = mentorContext?.agendaTodaySummary || null;

  const comandoDoDia = useMemo(() => {
    const action = mentorNextAction || {};
    const tone = action.safety === "critical"
      ? "red"
      : action.safety === "caution"
      ? "amber"
      : action.type === "new_topic" || action.type === "rest" || action.type === "anki_check"
      ? "emerald"
      : "blue";
    const subtitle = action.subtitle
      || action.reason
      || mentorTodayPlan.slice(1).join(" ");
    return {
      eyebrow: "Comando do dia",
      title: action.title || "Manter consistência leve",
      subtitle: subtitle || "Sem urgência crítica detectada. Siga o plano com ritmo sustentável.",
      primaryLabel: action.cta || "Executar ação",
      secondaryLabel: "Ver por quê",
      tone,
      action,
    };
  }, [mentorNextAction, mentorTodayPlan]);

  const runMentorPrimaryAction = useCallback(() => {
    const action = mentorNextAction || {};
    const target = action.target || {};
    const actionType = action.type || target.view || action.ctaView || "mentor";
    safeTrackEvent(
      "mentor_action_started",
      { plat, action_type: actionType, source: action.source || "mentor" },
      { state: { meta: telemetryMeta } }
    );
    // 1. Alvo explícito de revisão (tema + etapa): inicia o Modo Foco direto.
    if (target.temaId && target.stepKey && onStudy) {
      onStudy(target.temaId, target.stepKey);
      safeTrackEvent("mentor_action_completed", { plat, action_type: actionType, source: action.source || "mentor" }, { state: { meta: telemetryMeta } });
      return;
    }
    // 2. Comandos de fila/revisão sem alvo explícito (ex.: "Fechar fila de hoje").
    //    O Mentor planeja, o aluno executa: abrimos a próxima revisão da fila.
    const view = action.ctaView || target.view || "dash";
    const isQueueCommand =
      ["fila_do_dia", "revisao_vencida", "relearning"].includes(action.type) || view === "focus";
    if (isQueueCommand) {
      if (topFilaItem && onStudy) {
        onStudy(topFilaItem.temaId, topFilaItem.stepKey);
      } else if (setView) {
        setView("crono");
      }
      safeTrackEvent("mentor_action_completed", { plat, action_type: actionType, source: action.source || "mentor" }, { state: { meta: telemetryMeta } });
      return;
    }
    // 3. Demais comandos: navega para a tela correspondente.
    if (setView) setView(view);
    safeTrackEvent("mentor_action_completed", { plat, action_type: actionType, source: action.source || "mentor" }, { state: { meta: telemetryMeta } });
  }, [mentorNextAction, onStudy, plat, setView, telemetryMeta, topFilaItem]);

  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 34 + i);
    return d.toISOString().slice(0, 10);
  });

  const espAbbr = (esp) => {
    const map = { "Cirurgia": "CI", "Clínica Médica": "CM", "GO": "GO", "Pediatria": "PE", "Preventiva": "PR" };
    return map[esp] || esp.slice(0, 2).toUpperCase();
  };

  const exportarCartaoProntidao = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 600, 600);
    bgGrad.addColorStop(0, "#0a090e");
    bgGrad.addColorStop(0.5, "#110f1b");
    bgGrad.addColorStop(1, "#171426");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 600);

    // 2. Decorative radial glow
    const glow = ctx.createRadialGradient(300, 240, 50, 300, 240, 250);
    glow.addColorStop(0, "rgba(59, 130, 246, 0.18)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 600, 600);

    // 3. Subtle borders
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, 584, 584);

    ctx.strokeStyle = "rgba(59, 130, 246, 0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 560, 560);

    // 4. Header: Logo & App Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 24px system-ui, -apple-system, sans-serif";
    ctx.fillText("MedRev", 45, 65);

    // Little blue light next to logo
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(155, 57, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Date (right-aligned)
    ctx.fillStyle = "#71717a"; // zinc-500
    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(fmtFull(todayStr()), 555, 62);
    ctx.textAlign = "left"; // reset alignment

    // 5. Main Title & Readiness metric
    ctx.fillStyle = "#a1a1aa"; // zinc-400
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.fillText("ÍNDICE DE PREPARO ESTIMADO", 45, 140);

    // Big score
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 100px system-ui, -apple-system, sans-serif";
    ctx.fillText(`${readinessTrend.current}%`, 45, 235);

    // Trend Indicator
    const deltaVal = readinessTrend.delta7 || 0;
    const isUp = deltaVal >= 0;
    const trendText = isUp ? `▲ +${deltaVal}% nos últimos 7 dias` : `▼ ${deltaVal}% nos últimos 7 dias`;
    ctx.fillStyle = isUp ? "#10b981" : "#ef4444";
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.fillText(trendText, 50, 270);

    // 6. Stats boxes (3-columns layout)
    const stats = [
      { label: "🔥 OFENSIVA", val: `${streakCurrent} dias`, color: "#f59e0b" },
      { label: "🎯 ACERTO", val: acertoMedio != null ? `${acertoMedio}%` : "—", color: "#3b82f6" },
      { label: "✅ REVISÕES", val: `${totalRevisoesFeitas}`, color: "#10b981" }
    ];

    const boxWidth = 160;
    const boxHeight = 85;
    const startX = 45;
    const startY = 320;
    const gap = 15;

    stats.forEach((st, idx) => {
      const x = startX + idx * (boxWidth + gap);
      
      // Box Background
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, startY, boxWidth, boxHeight, 10);
      } else {
        ctx.rect(x, startY, boxWidth, boxHeight);
      }
      ctx.fill();

      // Box border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Box text
      ctx.fillStyle = st.color;
      ctx.font = "900 11px system-ui, -apple-system, sans-serif";
      ctx.fillText(st.label, x + 15, startY + 28);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
      ctx.fillText(st.val, x + 15, startY + 58);
    });

    // 7. Footer slogan and signature
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "italic 13px system-ui, -apple-system, sans-serif";
    const slogan = "A única coisa que rouba o nosso conhecimento é o tempo: o que não revemos, se perde.";
    ctx.fillText(slogan, 45, 475);

    // Subtle line before bottom signature
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(45, 510);
    ctx.lineTo(555, 510);
    ctx.stroke();

    // App Link
    ctx.fillStyle = "rgba(139, 92, 246, 0.8)";
    ctx.font = "900 11px system-ui, -apple-system, sans-serif";
    ctx.fillText("RESIDENCIA.MEDREV.APP", 45, 545);

    // Download PNG
    try {
      const link = document.createElement("a");
      link.download = `medrev-preparo-${todayStr()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      if (showToast) {
        showToast("Cartão de preparo exportado com sucesso.");
      }
    } catch (err) {
      console.error(err);
      (showToast || showToastGlobal)("Erro ao exportar o cartão de preparo.");
    }
  };

  const concluidosHoje = useMemo(() => {
    return done.filter(r => r.date === todayStr()).length;
  }, [done]);
  const dailyGoal = 3;
  const dailyProgress = Math.min(concluidosHoje, dailyGoal);
  const pendingCountUp = useCountUp(pending, { duration: 600 });
  const readinessCountUp = useCountUp(readinessTrend.current, { duration: 600 });
  const acertoCountUp = useCountUp(acertoMedio ?? 0, { duration: 600 });
  const streakCountUp = useCountUp(streakCurrent, { duration: 600 });

  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  useEffect(() => {
    if (pending === 0 && concluidosHoje > 0 && !hasTriggeredConfetti) {
      setShowConfettiLocal(true);
      setHasTriggeredConfetti(true);
      setTimeout(() => setShowConfettiLocal(false), 5000);
    }
  }, [pending, concluidosHoje, hasTriggeredConfetti]);

  const showMilestoneCelebration = useMemo(() => {
    return streakCurrent > 0 && (streakCurrent === 7 || streakCurrent === 30 || streakCurrent === 100);
  }, [streakCurrent]);
  const todayLoadSignals = useMemo(() => {
    const scheduler = mentorContext?.scheduler || {};
    return {
      dueTodayCount: Number(scheduler.dueTodayCount ?? pending ?? 0),
      todayMinutes: Number(scheduler.todayMinutes ?? 0),
      overloadLevelToday: scheduler.overloadLevelToday || "ok",
      relearningCount: Number(scheduler.relearningCount ?? 0),
    };
  }, [mentorContext, pending]);
  const todayLoadSummary = useMemo(() => {
    const loadLabel = {
      high: "alta",
      moderate: "moderada",
      ok: "tranquila",
    }[todayLoadSignals.overloadLevelToday] || "tranquila";
    const relearningText = todayLoadSignals.relearningCount > 0
      ? ` · ${todayLoadSignals.relearningCount} reaprendendo`
      : "";
    return `${todayLoadSignals.dueTodayCount} revisões · ${todayLoadSignals.todayMinutes} min · carga ${loadLabel}${relearningText}`;
    }, [todayLoadSignals]);
  const dailyBriefing = useMemo(() => buildDailyBriefing({
    state: { plat, meta, onboardingDone, tourStep, userName },
    context: {
      pendingCount: pending,
      overdueCount: overdue.length,
      estimatedMinutes: todayLoadSignals.todayMinutes,
    },
  }), [meta, onboardingDone, overdue.length, pending, plat, todayLoadSignals.todayMinutes, tourStep, userName]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMentorWhy, setShowMentorWhy] = useState(false);
  const vestibularStartComplete = useMemo(() => {
    if (plat !== "vest") return true;
    return isVestibularStartComplete(meta);
  }, [plat, meta]);
  const dismissWelcome = useCallback(() => {
    dismissDailyBriefing(
      typeof window !== "undefined" ? window.localStorage : null,
      getDailyBriefingStorageKey({ uid: currentUid })
    );
    setShowWelcome(false);
  }, [currentUid]);

  useEffect(() => {
    const actionType = comandoDoDia.action?.type;
    if (!actionType) return;
    const eventKey = `${todayStr()}:${plat}:${actionType}`;
    if (lastMentorSeenRef.current === eventKey) return;
    safeTrackEvent(
      "mentor_action_seen",
      { plat, action_type: actionType, source: comandoDoDia.action?.source || "mentor" },
      { state: { meta: telemetryMeta } }
    );
    lastMentorSeenRef.current = eventKey;
  }, [comandoDoDia.action, plat, telemetryMeta]);

  useEffect(() => {
    if (streakCurrent >= 100 && !meta?.streakMaxAvisado) {
      (showToast || showToastGlobal)("Streak consolidado: agora priorize retenção real, não o número.");
      useStore.setState({ meta: { ...meta, streakMaxAvisado: true } });
    }
  }, [streakCurrent, meta, showToast, showToastGlobal]);

  // ESTADO VAZIO: Mostrar apenas o CTA de onboarding se não houver temas cadastrados
  if (temasFiltrados.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fade-up text-left max-w-4xl mx-auto py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {userName}.</h1>
            <button type="button" onClick={onEditName} className="text-gray-500 hover:text-gray-300 transition-colors">
              <Edit2 size={18} />
            </button>
          </div>
        </div>

        {isPlanSetupComplete({ meta }) ? (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 space-y-3">
            <p className="text-[11px] font-bold text-blue-300 uppercase tracking-wide">Plano ativo</p>
            <p className="text-lg font-black text-white">
              Hoje:{" "}
              {agendaTodaySummary && agendaTodaySummary.totalCount > 0
                ? `${agendaTodaySummary.totalCount} tarefa${agendaTodaySummary.totalCount > 1 ? "s" : ""} · ${agendaTodaySummary.totalMinutes} min`
                : "nenhuma tarefa agendada"}
            </p>
            <button
              type="button"
              onClick={() => setView && setView("crono")}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-bold border-none cursor-pointer"
            >
              Ver agenda
            </button>
          </div>
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="Comece em 2 minutos"
            description={"1. Escolha um calendário.\n2. Deixe o Mentor montar a primeira ação.\n3. Faça uma sessão curta."}
            primaryAction={{
              label: "Configurar agora",
              onClick: () => setShowSetupFlow(true),
            }}
            className="my-4 whitespace-pre-line"
          />
        )}

        {showSetupFlow && (
          <Modal onClose={() => setShowSetupFlow(false)}>
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-[15px] font-black text-white">Configuração inicial</h2>
                <p className="text-[12px] text-gray-400 leading-relaxed">
                  Escolha como quer começar: ajustar preferências do plano ou abrir o cronograma.
                </p>
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSetupFlow(false);
                    openSetupAjustes();
                  }}
                  className="w-full text-left rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2.5 hover:bg-blue-500/20 transition-colors cursor-pointer"
                >
                  <p className="text-[12px] font-bold text-blue-300">Abrir Ajustes</p>
                  <p className="text-[10px] text-blue-200/80 mt-0.5">Defina prova, metas e configurações do Mentor.</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSetupFlow(false);
                    if (setView) setView("crono");
                  }}
                  className="w-full text-left rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <p className="text-[12px] font-bold text-gray-200">Abrir Cronograma</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Escolha um bloco e inicie seu primeiro tema.</p>
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-fade-up text-left max-w-6xl mx-auto">
      {/* Camada primaria: mentor + acao do dia + progresso */}
      <section
        className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--surface-2)] p-5 md:p-7 shadow-[0_1px_0_rgba(255,255,255,.03)_inset,0_18px_42px_-28px_rgba(37,99,235,.45)]"
        style={{ background: "radial-gradient(circle at 82% 18%, rgba(59,130,246,.16), transparent 34%), var(--surface-2)" }}
      >
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-sm font-semibold text-[var(--text-2)]">{greeting}, {userName}.</p>
                <button type="button" onClick={onEditName} className="text-gray-500 hover:text-gray-300 transition-colors border-none p-1 bg-transparent cursor-pointer" aria-label="Editar nome">
                  <Edit2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHeroMeta((prev) => !prev)}
                  className="md:hidden rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-300"
                >
                  {showHeroMeta ? "Ocultar detalhes" : "Ver detalhes"}
                </button>
              </div>
              <div className={`${showHeroMeta ? "flex" : "hidden"} md:flex flex-wrap items-center gap-2.5`}>
                {plat === "res" && (
                  <>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-blue-300 border border-blue-500/30 bg-blue-500/10 rounded-lg px-2 py-1">
                      Provider: {providerAtivoLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleInsightAction({ type: "import_calendar" })}
                      className="text-[9px] uppercase tracking-wider font-bold text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 rounded-lg px-2 py-1 hover:bg-emerald-500/20 cursor-pointer"
                    >
                      Importar
                    </button>
                  </>
                )}
                <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-black/25 px-2.5 py-1.5">
                  <span className="text-[8.5px] font-bold text-gray-500 uppercase tracking-wider mr-1 select-none flex items-center gap-1">
                    Consistencia
                    <InfoTooltip texto="Mapeia seu histórico de estudos nos últimos 7 dias. Cada bloco colorido indica que você realizou revisões naquele dia." />
                  </span>
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - 6 + i);
                    const dStr = d.toISOString().slice(0, 10);
                    const active = doneDays.has(dStr);
                    return (
                      <div
                        key={i}
                        title={fmtDate(dStr)}
                        className={"h-2.5 w-2.5 rounded-sm transition-all " + (active ? "bg-gradient-to-br from-blue-500 to-sky-500" : "bg-white/[0.05]")}
                      />
                    );
                  })}
                </div>
                {daysToProva != null && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/5 px-2.5 py-1.5 text-[10.5px] font-bold text-gray-300">
                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[8.5px] select-none flex items-center gap-1">
                      Prova
                      <InfoTooltip texto="Quantidade de dias restantes ate o seu exame principal." />
                    </span>
                    <span className={daysToProva <= 30 ? "text-red-400" : "text-blue-400"}>
                      {daysToProva <= 0 ? "Hoje!" : String(daysToProva) + "d"}
                    </span>
                  </div>
                )}
                {peakModeAtivo && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-blue-500/25 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-bold text-blue-200">
                    <span className="uppercase tracking-wider text-[8px] text-blue-300">Reta final</span>
                    <span>{peakPhase.replace("_", " ")}</span>
                  </div>
                )}
              </div>
            </div>

            {showWelcome && (
              <WelcomePopup
                briefing={dailyBriefing}
                streakCurrent={streakCurrent}
                onClose={dismissWelcome}
                onStartFocus={() => {
                  dismissWelcome();
                  if (topFilaItem) {
                    onStudy(topFilaItem.temaId, topFilaItem.stepKey);
                  }
                }}
              />
            )}

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-300">{comandoDoDia.eyebrow}</p>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {comandoDoDia.title}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-2)]">
                {comandoDoDia.subtitle}
              </p>
              <p className="inline-flex w-fit rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-200">
                {todayLoadSummary}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={runMentorPrimaryAction}
                className={`medrev-cta-primary min-h-[44px] rounded-xl px-5 py-3 text-sm font-extrabold shadow-lg border-none cursor-pointer ${
                  comandoDoDia.tone === "red"
                    ? "bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-red-950/25 hover:from-red-500 hover:to-orange-400"
                    : comandoDoDia.tone === "amber"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-950/25 hover:from-amber-400 hover:to-orange-400"
                    : comandoDoDia.tone === "emerald"
                    ? "bg-emerald-600/25 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-600/40 hover:text-white"
                    : "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-blue-950/25 hover:from-blue-500 hover:to-sky-400"
                }`}
              >
                {comandoDoDia.primaryLabel}
              </button>
              <button
                type="button"
                onClick={() => setShowMentorWhy((prev) => !prev)}
                className="min-h-[44px] rounded-xl px-4 py-3 text-sm font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                {comandoDoDia.secondaryLabel}
              </button>
              {topFilaItem?.isOptimal && comandoDoDia.action?.type === "fila_do_dia" && (
                <span className="text-[11px] font-bold text-amber-300">
                  Ponto exato de esquecimento detectado
                </span>
              )}
            </div>
            {showMentorWhy && (
              <div className="max-w-2xl rounded-2xl border border-white/10 bg-black/20 p-3 text-[12px] text-gray-300">
                <p className="mb-2 font-black uppercase tracking-wider text-[10px] text-blue-300">Por que o Mentor escolheu isso</p>
                {(comandoDoDia.action?.explain?.length ? comandoDoDia.action.explain : [comandoDoDia.action?.reason || comandoDoDia.subtitle]).slice(0, 4).map((item, index) => (
                  <p key={`${item}-${index}`} className="leading-relaxed">• {item}</p>
                ))}
              </div>
            )}
          </div>

          <DailyProgressRing value={dailyProgress} goal={dailyGoal} />
        </div>
      </section>

      {plat === "vest" && !vestibularStartComplete && meta?.onboarding?.version !== 2 && (
        <VestibularStartTrail setView={setView} onOpenAjustes={onOpenAjustes} />
      )}

      <ActionInbox mode={modoSimples ? "mentor" : "manual"} onStudy={onStudy} setView={setView} />

      <MiniCronogramaWidget
        plat={plat}
        setView={setView}
        onStudy={onStudy}
        onMarkMastery={handleMarkMastery}
        overdue={overdue}
        today_={today_}
        temas={temasFiltrados}
        calendarProvider={calendarProvider}
        cronogramaSel={cronogramaSel}
        temasPerWeek={meta?.temasPerWeek}
        estrategiaStartDate={meta?.estrategiaStartDate}
        onAdjustWeeklyTopics={handleAdjustWeeklyTopics}
      />

      <WeeklyReview
        onAdjust={() => setView && setView("crono")}
        onAction={(action) => handleInsightAction(action)}
      />

      {/* Alertas compactos inline */}
      {(hasPendingClosure || peakModeAtivo) && (
        <div className="flex flex-wrap gap-2">
          {hasPendingClosure && (
            <button
              type="button"
              onClick={() => setView && setView("stats")}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <AlertTriangle size={12} />
              Sessão sem fechamento — registrar agora
            </button>
          )}
          {peakModeAtivo && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-bold">
              <Zap size={12} />
              Reta final ativa · {peakPolicy.maxNewTopicsPerWeek == null ? "sem limite" : peakPolicy.maxNewTopicsPerWeek} temas/semana · viés +{peakPolicy.reviewBias}
            </div>
          )}
        </div>
      )}

      <section className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-3">
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="w-full text-left flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider text-gray-300 hover:text-white cursor-pointer border-none bg-transparent"
        >
          <span>Avançado</span>
          <span className="text-[10px] text-gray-500">{showAdvanced ? "ocultar" : "mostrar"}</span>
        </button>
      </section>

      {showAdvanced && (
        <>
      {/* KPIs — 4 métricas primárias */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 select-none">
        <DashboardKpiCard
          label="Revisões de hoje"
          icon={<ClipboardList size={13} className="text-amber-300" />}
          accentColor={pending > 0 ? "#f59e0b" : "#10b981"}
          value={String(pendingCountUp) + (naReserva > 0 ? " +" + naReserva : "")}
          tone={pending > 0 ? "text-amber-400" : "text-emerald-400"}
          tooltip="Revisões programadas para hoje. A reserva mostra itens fora do teto diário atual."
          delayMs={0}
        >
          <p className="text-[9px] text-gray-500">
            {naReserva > 0 ? `+${naReserva} na reserva` : "dentro do teto"}
          </p>
        </DashboardKpiCard>

        <DashboardKpiCard
          label="Preparo"
          icon={<Target size={13} className="text-blue-300" />}
          accentColor="#3b82f6"
          value={String(readinessCountUp) + "%"}
          tone="text-blue-400"
          tooltip="Estimativa composta por cobertura, simulados, ritmo, Anki e retenção longa quando disponível."
          delayMs={50}
          action={(
            <button
              onClick={exportarCartaoProntidao}
              title="Compartilhar cartão de preparo"
              className="text-gray-500 hover:text-blue-400 transition-colors focus:outline-none relative z-10 p-0.5 cursor-pointer bg-transparent border-none"
              aria-label="Compartilhar cartão de preparo"
            >
              <Share2 size={13} />
            </button>
          )}
        >
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8.5px] font-bold border ${preparoCalibration.tone}`}>
            {preparoCalibration.label}
          </span>
          {readinessTrend.delta7 !== undefined && readinessTrend.delta7 !== 0 && (
            <span className={"text-[9.5px] font-bold block " + (readinessTrend.delta7 >= 0 ? "text-emerald-400" : "text-red-400")}>
              {readinessTrend.delta7 >= 0 ? "▲ +" : "▼ "}{readinessTrend.delta7}% (7d)
            </span>
          )}
          {sparklinePath && (
            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="mt-1.5 h-4 w-full opacity-40">
              <path d={sparklinePath} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
            </svg>
          )}
        </DashboardKpiCard>

        <DashboardKpiCard
          label="Acerto"
          icon={<CheckCircle size={13} className="text-emerald-300" />}
          accentColor={acertoMedio != null ? (acertoMedio >= 80 ? "#10b981" : acertoMedio >= 65 ? "#3b82f6" : "#ef4444") : "#6b7280"}
          value={acertoMedio != null ? String(acertoCountUp) + "%" : "—"}
          tone={acertoMedio != null ? (acertoMedio >= 80 ? "text-emerald-400" : acertoMedio >= 65 ? "text-blue-400" : "text-red-400") : "text-gray-500"}
          tooltip="Qualidade recente baseada em questões e revisões concluídas."
          delayMs={100}
        >
          <p className="text-[9px] text-gray-500">{acertoMedio != null ? "revisões concluídas" : "coletando dados"}</p>
        </DashboardKpiCard>

        <DashboardKpiCard
          label="Streak"
          icon={<Flame size={13} className="text-orange-300" />}
          accentColor="#f97316"
          value={String(streakCountUp) + "/7"}
          tone="text-orange-400"
          tooltip="Dias ativos de estudo nos últimos 7 dias."
          delayMs={150}
        >
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(); d.setDate(d.getDate() - 6 + i);
              const dStr = d.toISOString().slice(0, 10);
              const active = doneDays.has(dStr);
              return (
                <div key={i} className={"flex-1 h-1 rounded-full " + (active ? "bg-orange-400" : "bg-white/10")} />
              );
            })}
          </div>
          <p className="text-[9px] text-gray-500 mt-1">últimos 7 dias</p>
        </DashboardKpiCard>
      </section>

      {/* Análise rápida — Gargalo + Próxima ação */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-12 h-12 rounded-full bg-blue-600/8 blur-xl pointer-events-none" />
          <p className="text-[9.5px] text-gray-500 uppercase tracking-[0.12em] font-black flex items-center gap-1.5">
            <TrendingDown size={11} className="text-red-400" />
            {plat === "vest" ? "Frente prioritária" : "Gargalo ENAMED"}
          </p>
          {plat === "vest" && readinessData?.priorityList?.[0] ? (
            <>
              <div>
                <p className="text-sm font-black text-white leading-tight">{readinessData.priorityList[0].area}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  cobertura {Math.round(readinessData.priorityList[0].coverage || 0)}%
                  {readinessData.priorityList[0].retention != null ? ` · acerto ${Math.round(readinessData.priorityList[0].retention)}%` : " · acerto coletando"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView && setView("stats")}
                className="self-start px-2.5 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 text-[10px] font-bold cursor-pointer transition-colors"
              >
                Ver mapa completo →
              </button>
            </>
          ) : plat === "res" && enamedBottleneck ? (
            <>
              <div>
                <p className="text-sm font-black text-white leading-tight">{enamedBottleneck.area || "Ainda coletando gargalos"}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{enamedBottleneck.motivo}</p>
              </div>
              <div className="space-y-1">
                {enamedBottleneck.evidencias.slice(0, 2).map((item) => (
                  <p key={item} className="text-[10px] text-gray-500">• {item}</p>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setView && setView(enamedBottleneck.target?.view || "stats")}
                className="self-start px-2.5 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 text-[10px] font-bold cursor-pointer transition-colors"
              >
                {enamedBottleneck.actionLabel} →
              </button>
            </>
          ) : (
            <p className="text-[11px] text-gray-500 leading-relaxed">Complete revisões e simulados para gerar o mapa de prioridades.</p>
          )}
        </div>

        <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-12 h-12 rounded-full bg-emerald-600/8 blur-xl pointer-events-none" />
          {plat === "vest" ? (
            <>
              <p className="text-[9.5px] text-gray-500 uppercase tracking-[0.12em] font-black flex items-center gap-1.5">
                <Layers size={11} className="text-sky-400" /> Matéria urgente
              </p>
              <p className="text-sm font-black text-white leading-tight">
                {filaInteligente[0]?.esp || "Fila zerada"}
              </p>
              <p className="text-[10px] text-gray-500">{filaInteligente[0]?.esp ? "maior urgência hoje" : "revise ou avance temas novos"}</p>
              <button type="button" onClick={() => setView && setView("crono")}
                className="self-start px-2.5 py-1.5 rounded-xl bg-sky-600/15 hover:bg-sky-600/30 text-sky-400 border border-sky-500/20 text-[10px] font-bold cursor-pointer transition-colors">
                Abrir cronograma →
              </button>
            </>
          ) : meta.modulos?.raciocinioClinico ? (
            <>
              <p className="text-[9.5px] text-gray-500 uppercase tracking-[0.12em] font-black flex items-center gap-1.5">
                <Brain size={11} className="text-emerald-400" /> Raciocínio clínico
              </p>
              <p className="text-sm font-black text-white leading-tight">Casos clínicos ativos</p>
              <button type="button" onClick={() => setView && setView("raciocinio")}
                className="self-start px-2.5 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold cursor-pointer transition-colors">
                Treinar caso →
              </button>
            </>
          ) : (
            <>
              <p className="text-[9.5px] text-gray-500 uppercase tracking-[0.12em] font-black flex items-center gap-1.5">
                <Brain size={11} className="text-gray-500" /> Casos clínicos
              </p>
              <p className="text-[11px] text-gray-400 leading-relaxed">Ative o treino por casos para complementar questões com raciocínio.</p>
              <button type="button" onClick={openSetupAjustes}
                className="self-start px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-[10px] font-bold cursor-pointer transition-colors">
                Ativar em ajustes →
              </button>
            </>
          )}
        </div>
      </section>

        </>
      )}

      {/* ALERTAS CRÍTICOS DO MENTOR */}
      {criticalAlerts.map((alert, idx) => {
        let borderStyle = "border-amber-500/25";
        let glowStyle = "from-amber-600/15 via-[var(--surface-1)] to-amber-950/20";
        let badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
        let icon = "⚠️";
        if (alert.type === "vies_excesso") {
          borderStyle = "border-red-500/25";
          glowStyle = "from-red-600/15 via-[var(--surface-1)] to-red-950/20";
          badgeStyle = "bg-red-500/10 text-red-400 border-red-500/20";
          icon = "🤝";
        } else if (alert.type === "vies_inseguranca") {
          borderStyle = "border-emerald-500/25";
          glowStyle = "from-emerald-600/15 via-[var(--surface-1)] to-emerald-950/20";
          badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
          icon = "🤝";
        } else if (alert.action?.type === "aliviar") {
          borderStyle = "border-amber-500/25";
          glowStyle = "from-amber-600/15 via-[var(--surface-1)] to-amber-950/20";
          badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
          icon = "🤝";
        }
        return (
          <div key={idx} className={`bg-gradient-to-br ${glowStyle} border ${borderStyle} rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden shadow-lg shadow-black/40 select-none`}>
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <span className="text-4xl animate-pulse">{icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[13px] font-black text-white uppercase tracking-wider">Alerta Crítico</h4>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                    {alert.type === "alerta" ? "Fadiga" : "Viés Metacognitivo"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 mt-1.5 leading-relaxed max-w-2xl">
                  {alert.text}
                </p>
              </div>
            </div>
            {alert.action && (
              <button
                type="button"
                onClick={() => handleInsightAction(alert.action)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold text-[11px] rounded-xl shadow-md active:scale-95 transition-all border-none cursor-pointer shrink-0"
              >
                {alert.action.label}
              </button>
            )}
          </div>
        );
      })}

      {/* BANNER DE PAUSA / FÉRIAS */}
      {meta.pausadoAte && todayStr() <= meta.pausadoAte && (
        <div className="bg-gradient-to-br from-blue-500/10 via-[var(--surface-1)] to-indigo-950/20 border border-blue-500/15 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden shadow-lg select-none">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4">
            <span className="text-4xl animate-pulse">🌴</span>
            <div>
              <h4 className="text-[13px] font-black text-white uppercase tracking-wider">Modo Pausa / Férias Ativo</h4>
              <p className="text-[11px] text-gray-400 mt-1">
                Seus agendamentos estão congelados até {fmtFull(meta.pausadoAte)}. Aproveite para descansar sem culpa!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              openConfirm({
                title: "Retomar estudos",
                message: "Deseja cancelar a pausa e retomar suas revisões hoje?",
                confirmLabel: "Retomar",
                onConfirm: () => useStore.getState().cancelarPausa(),
              });
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-extrabold text-[11px] rounded-xl shadow-md active:scale-95 transition-all border-none cursor-pointer"
          >
            Retomar Estudos
          </button>
        </div>
      )}

      {/* CARD REFINAR ESTRATÉGIA */}
      {!meta?.estrategiaRefinada && (
        <div className="bg-gradient-to-br from-blue-600/10 via-[var(--surface-1)] to-sky-500/10 border border-blue-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden shadow-lg select-none">
          <div className="absolute right-0 top-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4">
            <span className="text-4xl">🎯</span>
            <div>
              <h4 className="text-[13px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                Refinar sua estratégia
                <InfoTooltip texto="Defina detalhes cruciais como a data da prova, meta de acertos e seu banco de questões para que o algoritmo do MedRev trabalhe perfeitamente ajustado ao seu objetivo." />
              </h4>
              <p className="text-[11px] text-gray-400 mt-1">
                Você está utilizando configurações padrão. Personalize suas datas e metas de acerto para calibrar a curva de revisão.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openSetupAjustes}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold text-[11px] rounded-xl shadow-md active:scale-95 transition-all border-none cursor-pointer"
          >
            Configurar Estratégia
          </button>
        </div>
      )}

      {/* 2. MILESTONE CELEBRATION */}
      {showMilestoneCelebration && (
        <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Marco de Consistência!</h4>
              <p className="text-[11.5px] text-amber-400 font-medium">Você atingiu a marca de <strong className="text-white font-extrabold">{streakCurrent} dias ativos nos últimos 7 dias</strong> de estudos!</p>
            </div>
          </div>
          <span className="text-[9.5px] bg-amber-500 text-black font-black px-2 py-0.5 rounded-full select-none">Incrível!</span>
        </div>
      )}

      {/* Camada terciaria: carga e detalhes */}
      <CargaFuturaWidget temas={temas} maxRevisoesDia={meta.maxRevisoesDia || 30} />

      {/* DICA P5: retenção alta demais → sobrecarga */}
      {(() => {
        const proj = getWorkloadProjection(temas, 14);
        const cap_ = meta.maxRevisoesDia || 30;
        const diasSobrecarga = Object.values(proj).filter((day) => (day?.count || 0) > cap_).length;
        const retAtual = meta?.retencaoFSRS || 0.90;
        if (diasSobrecarga >= 3 && retAtual >= 0.90) {
          return (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-400 font-black">Dica de eficiência da curva</p>
                <p className="text-[11.5px] text-gray-300 mt-1 leading-relaxed max-w-lg">
                  Você está afogado em revisões por {diasSobrecarga} dias. Considere baixar a retenção-alvo para 85% temporariamente — menos revisões/dia, mantendo a maior parte do conhecimento.
                </p>
              </div>
              <button
                type="button"
                onClick={openSetupAjustes}
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] border border-amber-500/25 cursor-pointer shrink-0"
              >
                Ajustar retenção
              </button>
            </div>
          );
        }
        return null;
      })()}

      {/* SEMANA DE PROVA — Banner de urgência (apenas vest, dentro de 7 dias) */}
      {plat === "vest" && semanaDeProva && (
        <div className="bg-gradient-to-r from-red-500/10 via-orange-500/8 to-red-500/10 border border-red-500/25 rounded-2xl p-4 flex items-center gap-4 animate-fade-up">
          <div className="text-2xl shrink-0 select-none">🏁</div>
          <div>
            <p className="text-[9.5px] text-red-400 uppercase tracking-wider font-bold">Semana de Prova</p>
            <p className="text-sm font-black text-white">{daysToProva === 0 ? "Hoje é o dia!" : `Faltam ${daysToProva} dia${daysToProva === 1 ? "" : "s"}`}</p>
            <p className="text-[10px] text-red-300/70 mt-0.5">Foco em revisões de alta prioridade. Descanse e confie no processo.</p>
          </div>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowCompleto(!showCompleto)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.025] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-600/15 flex items-center justify-center group-hover:bg-blue-600/25 transition-colors">
              <Brain size={13} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-200 uppercase tracking-wider">Mentor · Análise completa</p>
              <p className="text-[9.5px] text-gray-500 mt-0.5">Reflexão semanal, diagnóstico cognitivo e projeção</p>
            </div>
          </div>
          <div className={`w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center transition-transform duration-200 ${showCompleto ? "rotate-180" : ""}`}>
            <ChevronDown size={13} className="text-gray-500" />
          </div>
        </button>
      </div>

      {showCompleto && (
        <div className="space-y-5 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3 bg-[var(--surface-1)] border border-white/5 rounded-2xl p-3">
            <p className="text-[11px] text-gray-400">Análises avançadas e contexto de aprendizado.</p>
            <button
              type="button"
              onClick={() => setView && setView("stats")}
              className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 border border-blue-500/20 text-[11px] font-bold cursor-pointer"
            >
              Abrir Estatísticas
            </button>
          </div>

          {!modoSimples && (
            <TrilhaJornada
              totalSessions={totalSessions}
              onOpenAjustes={onOpenAjustes}
              setView={setView}
              onStudy={onStudy}
              showToast={showToast}
            />
          )}

          <DicaContextual onNavigateToAcademia={() => setView && setView("academia")} />

          {/* NOTA PROJETADA — só para Vestibular */}
          {plat === "vest" && totalSessions > 0 && notaProjetada != null && (
        <div className="medrev-card p-5 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-emerald-600/5 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-emerald-400" />
              <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-wider">Nota Projetada</h3>
              <span className="text-[9px] text-gray-600">({(meta?.provasAlvo || []).filter(p => ["UnB", "UFG"].includes(p))[0] || "UnB"})</span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
              meta?.notaCorteAlvo > 0 && notaProjetada >= meta.notaCorteAlvo
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {meta?.notaCorteAlvo > 0 && notaProjetada >= meta.notaCorteAlvo ? "✅ Aprovado" : meta?.notaCorteAlvo > 0 ? "⚠️ Abaixo da Corte" : "📊 Em progresso"}
            </span>
          </div>
          <div className="flex items-end gap-3">
            <p className={`text-3xl font-black tabular-nums ${
              !meta?.notaCorteAlvo || meta.notaCorteAlvo === 0 ? "text-blue-400"
                : notaProjetada >= meta.notaCorteAlvo ? "text-emerald-400"
                : notaProjetada >= meta.notaCorteAlvo * 0.9 ? "text-amber-400" : "text-red-400"
            }`}>{notaProjetada}%</p>
            {meta?.notaCorteAlvo > 0 && (
              <p className="text-xs text-gray-500 mb-1">meta: <span className="text-white font-bold">{meta.notaCorteAlvo}%</span></p>
            )}
          </div>
          {meta?.notaCorteAlvo > 0 && (
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  notaProjetada >= meta.notaCorteAlvo
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-blue-500 to-sky-500"
                }`}
                style={{ width: `${Math.min(100, Math.round(notaProjetada / meta.notaCorteAlvo * 100))}%` }}
              />
            </div>
          )}
          <p className="text-[9.5px] text-gray-600 leading-relaxed">
            Estimativa ponderada por área, baseada no seu acerto médio e nos pesos do exame.
          </p>
        </div>
      )}

      {/* ZONA 2 — Análise de desempenho (dados, não voz do mentor) */}
      <div className="medrev-card p-5 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute -left-12 -bottom-12 w-28 h-28 rounded-full bg-cyan-600/5 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <BarChart3 size={16} className="text-blue-400" />
            <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-wider mr-2">Análise de Desempenho</h3>
            <span className="text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
              {totalSessions < 7 ? "Fase 1: Calibração" : totalSessions < 30 ? "Fase 2: Ritmo" : "Fase 3: Elite"}
            </span>
          </div>
          {diag.projection && (
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Projeção: {diag.projection.score}%
            </span>
          )}
        </div>

        {diag.status === "calibracao" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl flex-col sm:flex-row">
              <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                  Dados insuficientes para análise completa. Conclua mais sessões para liberar as métricas avançadas.
                </p>
                <div className="space-y-1">
                  <div className="bg-white/5 rounded-full h-2 overflow-hidden border border-white/5 relative">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-sky-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalSessions / 7) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-wider font-mono">
                    <span>Progresso de Calibração</span>
                    <span>{totalSessions} de 7 sessões concluídas</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-wide"><Unlock size={11} className="shrink-0" /> A partir de 7 sessões</span>
                <p className="text-[10.5px] text-gray-400 leading-relaxed">
                  Libera análise de horário ótimo, fraquezas por especialidade e detecção de viés de confiança.
                </p>
              </div>
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                <span className="flex items-center gap-1.5 text-[10px] font-black text-sky-400 uppercase tracking-wide"><Unlock size={11} className="shrink-0" /> A partir de 30 sessões</span>
                <p className="text-[10.5px] text-gray-400 leading-relaxed">
                  Libera projeção estatística de nota/aprovação com base no seu histórico e peso das provas.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <p className="text-[11px] text-gray-500 leading-relaxed pl-1 mb-0.5">
              {totalSessions < 30
                ? "Fila ajustada aos seus horários de maior desempenho."
                : "Histórico suficiente: fila calibrada 100% pelo seu desempenho real."}
            </p>
            {nonCriticalInsights.map((insight, idx) => {
              let InsightIcon = Info;
              let colorClass = "bg-white/[0.02] text-gray-300 border border-white/5";
              if (insight.type === "alerta" || insight.type === "vies_excesso") {
                InsightIcon = AlertTriangle;
                colorClass = "bg-amber-500/5 text-amber-300 border border-amber-500/10";
              } else if (insight.type === "tendencia_baixa") {
                InsightIcon = TrendingDown;
                colorClass = "bg-red-500/5 text-red-300 border border-red-500/10";
              } else if (insight.type === "tendencia_alta") {
                InsightIcon = TrendingUp;
                colorClass = "bg-emerald-500/5 text-emerald-300 border border-emerald-500/10";
              } else if (insight.type === "horario") {
                InsightIcon = Zap;
                colorClass = "bg-indigo-500/5 text-indigo-300 border border-indigo-500/10";
              }
              return (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${colorClass}`}>
                  <InsightIcon size={16} className="shrink-0 mt-0.5" />
                  <div className="flex-1 flex flex-col gap-1.5 text-left">
                    <p className="text-[12px] leading-relaxed font-medium">{insight.text}</p>
                    <div className="flex items-center justify-between gap-2 mt-0.5 flex-wrap">
                      {insight.confidence && (
                        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
                          confiança: {insight.confidence}
                        </span>
                      )}
                      {insight.action && (
                        <button
                          type="button"
                          onClick={() => handleInsightAction(insight.action)}
                          className="px-2.5 py-1 bg-blue-600/90 hover:bg-blue-500 active:scale-[0.98] text-[9.5px] font-bold text-white rounded-lg transition-all border border-blue-500/20 cursor-pointer shadow-sm hover:shadow"
                        >
                          {insight.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {diag.projection && (
              <p className="text-[11px] text-gray-500 italic mt-1 pl-1">
                {diag.projection.text}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ZONA 3 — Métricas (Grid 3 colunas) — só exibe após a primeira sessão */}
      {totalSessions > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Acerto Médio */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative group">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5 cursor-help">
              Acerto Médio
              <Info size={13} className="text-gray-600 hover:text-gray-400 transition-colors" />
            </p>
            {acertoMedio != null ? (
              <p className={`text-2xl font-black tabular-nums ${acertoMedio >= 80 ? "text-emerald-400" : acertoMedio >= 65 ? "text-blue-400" : "text-red-400"}`}>
                {acertoMedio}%
              </p>
            ) : (
              <button onClick={() => setView && setView("crono")} className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors mt-1 block text-left">
                Iniciar tema →
              </button>
            )}
            <div className="absolute bottom-full left-0 mb-2 w-[min(13rem,calc(100vw-2rem))] bg-[#141417] border border-white/10 rounded-xl p-3 text-[10px] text-gray-400 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed">
              Média de precisão combinada das suas sessões de estudo. A recomendação padrão é manter acima de 80%.
            </div>
          </div>

          {/* Temas Dominados */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative group">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5 cursor-help">
              Dominados (D21)
              <Info size={13} className="text-gray-600 hover:text-gray-400 transition-colors" />
            </p>
            {temasFiltrados.length > 0 ? (
              <p className="text-2xl font-black text-emerald-400">
                {temasFiltrados.filter(t => STEPS.every(s => t.rev[s.key].done)).length}/{temasFiltrados.length}
              </p>
            ) : (
              <span className="text-[10px] text-gray-500 block mt-1">Nenhum tema ativo</span>
            )}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[min(13rem,calc(100vw-2rem))] bg-[#141417] border border-white/10 rounded-xl p-3 text-[10px] text-gray-400 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed">
              Número de temas cadastrados que completaram com sucesso todas as etapas da curva de revisão (D0 até o D21).
            </div>
          </div>

          {/* Retenção longa */}
          <ProgressiveTooltip
            tooltipId="true_retention"
            text="Mentor: Retenção longa mede a taxa de acerto nas revisões de longo prazo (D21+). Manter esse índice acima de 80% indica retenção sólida de conteúdo."
          >
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative group w-full">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5 cursor-help">
                Retenção longa
                <Info size={13} className="text-gray-600 hover:text-gray-400 transition-colors" />
              </p>
              {trueRet != null ? (
                <p className={`text-2xl font-black tabular-nums ${trueRet >= 80 ? "text-emerald-400" : trueRet >= 65 ? "text-blue-400" : "text-red-400"}`}>
                  {trueRet}%
                </p>
              ) : (
                <span className="text-[10px] text-gray-500 block mt-1">Requer D21+ concluído</span>
              )}
              <div className="absolute bottom-full right-0 mb-2 w-[min(13rem,calc(100vw-2rem))] bg-[#141417] border border-white/10 rounded-xl p-3 text-[10px] text-gray-400 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed">
                Rendimento em revisões feitas em intervalos maiores (D21+). Mede o verdadeiro aprendizado de longo prazo.
              </div>
            </div>
          </ProgressiveTooltip>
        </div>
      ) : (
        /* Estado Vazio Inteligente: temas cadastrados mas nenhuma sessão iniciada */
        <div className="bg-gradient-to-br from-blue-600/8 via-transparent to-sky-600/5 border border-blue-500/15 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-xl shrink-0 shadow-lg shadow-indigo-900/30">
            🚀
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-black text-white mb-0.5">Pronto para começar!</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Suas métricas vão aparecer aqui após a primeira sessão de estudo.
            </p>
          </div>
          <button
            onClick={() => setView && setView("crono")}
            className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-[11.5px] transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-indigo-900/20"
          >
            Iniciar tema →
          </button>
        </div>
      )}


      {/* ZONA 4 — Detalhe (Filas & Colapsável de Estatísticas) */}
      <div className="flex flex-col gap-5">
        {/* Filas Ativas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={`${focusMode ? "lg:col-span-12" : "lg:col-span-12"} flex flex-col gap-4`}>
            
            {/* TOP 3 TÓPICOS-ALAVANCA — apenas Vestibular */}
            {plat === "vest" && filaInteligente.length > 0 && (
              <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top 3 Tópicos-Alavanca</h3>
                  <span className="text-[9px] text-gray-600 ml-auto">prioridade por peso do exame</span>
                </div>
                <div className="flex flex-col gap-2">
                  {filaInteligente.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-white/[0.01] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base shrink-0">{["🥇","🥈","🥉"][index]}</span>
                          <p className="text-xs font-bold text-gray-200 truncate">{item.temaNome}</p>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 ml-6">{item.esp} · Etapa {item.step.label}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onStudy(item.temaId, item.stepKey)}
                        className="px-3 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-[10.5px] font-bold transition-all shrink-0 active:scale-95 ml-3"
                      >
                        Focar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fila Inteligente — apenas Residência (vest usa Top 3 acima) */}
            {!modoSimples && totalSessions >= 30 && plat !== "vest" && (
              <ProgressiveTooltip
                tooltipId="priority_queue"
                text="Mentor: Esta é a Fila Inteligente. Ordenamos seus temas com base em um cálculo dinâmico de urgência, importância e pesos de prova para maximizar sua retenção diária (INEP 2009–2024: CM 28% / GO 21% / Cir 19% / Ped 19% / Prev 12%)."
              >
                <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 shadow-sm w-full">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={15} className="text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fila de Prioridade Inteligente</h3>
                  </div>
                  {filaInteligente.length === 0 ? (
                    <p className="text-[10.5px] text-gray-500 italic py-4 text-center leading-relaxed">
                      "Fila inteligente limpa. Seu planejamento está em dia. Aproveite para descansar!"
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                      {filaInteligente.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2.5 bg-white/[0.01] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded">Score: {item.score}</span>
                              <p className="text-xs font-bold text-gray-200 truncate">{item.temaNome}</p>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">{item.esp} · Etapa {item.step.label}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onStudy(item.temaId, item.stepKey)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white text-[10.5px] font-bold transition-all shrink-0 active:scale-95"
                          >
                            Focar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ProgressiveTooltip>
            )}

            {/* Fila Cronológica */}
            <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-blue-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fila Cronológica</h3>
                </div>
                <span className="text-[10px] bg-white/5 text-gray-400 border border-white/5 px-2 py-0.5 rounded-full font-bold">
                  {pending} pendentes
                </span>
              </div>
              
              {pending === 0 ? (
                <div className="text-center p-6 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 animate-fade-up">
                  <CheckCircle size={24} className="text-emerald-400 animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-[12px] font-black text-gray-200 font-sans">Fila limpa por hoje!</p>
                    <p className="text-[10.5px] text-gray-500 italic max-w-xs mx-auto leading-relaxed">
                      "Fila zerada — e isso é vitória, não tédio. Descanso consolida. Te vejo amanhã."
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-white/5 max-h-72 overflow-y-auto pr-1">
                  {[...overdue, ...today_].map((r, i) => {
                    const tema = temasFiltrados.find(t => t.id === r.temaId);
                    const R = tema ? getRetrievability(tema, r.step.key) : 1.0;
                    const isOptimalItem = R >= 0.85 && R <= 0.90;
                    const dominio = tema?.dominio;
                    const domMeta = dominio ? DOMINIO_META[dominio.classificacao] : null;
                    const dominioPrevioStatus = tema?.dominioPrevio?.status;
                    const showValidarBtn =
                      r.step.key === "d0" &&
                      !dominio &&
                      isTemaNaoIniciado(tema) &&
                      !["validacao_pendente", "validado_previo", "reprovado"].includes(dominioPrevioStatus);
                    return (
                      <div key={i} className={`flex items-center gap-3 py-2.5 px-2 rounded-xl transition-all ${isOptimalItem ? "bg-amber-500/5 border border-amber-500/10" : ""}`}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0" style={{ background: (ESP_COLORS[r.esp] || "#94a3b8") + "15", color: ESP_COLORS[r.esp] }}>
                          {espAbbr(r.esp)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <p className="text-xs font-bold text-white truncate">{r.temaNome}</p>
                            {isOptimalItem && (
                              <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-black shrink-0" title="Ponto ideal de revisão em ~87% de retenção projetada">
                                🎯 Ponto Ótimo
                              </span>
                            )}
                            {domMeta && (
                              <span
                                className="text-[8px] px-1.5 py-0.5 rounded font-black shrink-0 border"
                                style={{ background: domMeta.color + "20", color: domMeta.color, borderColor: domMeta.color + "40" }}
                              >
                                {domMeta.label}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase">{r.step.label} · {r.step.desc}</p>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onStudy(r.temaId, r.step.key)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[10.5px] font-semibold hover:bg-blue-500 transition-all active:scale-95"
                          >
                            Revisar
                          </button>
                          {showValidarBtn && (
                            <button
                              type="button"
                              onClick={() => setTemaValidando(tema)}
                              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[9.5px] font-semibold transition-all active:scale-95 border border-white/5"
                            >
                              Já domino
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Seção Em Manutenção */}
            {temasManutencao.length > 0 && (
              <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 shadow-sm select-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={15} className="text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Temas em Manutenção (Pós-D21)</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    {temasManutencao.length} tema{temasManutencao.length > 1 ? "s" : ""}
                  </span>
                </div>
                
                <div className="flex flex-col divide-y divide-white/5 max-h-72 overflow-y-auto pr-1">
                  {temasManutencao.map((tema, idx) => {
                    const m = tema.rev.manutencao;
                    const overdueManut = isOverdue(m.date);
                    return (
                      <div key={idx} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-white/[0.01] transition-all">
                        <div className="min-w-0 flex-1 mr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded shrink-0" style={{ background: (ESP_COLORS[tema.esp] || "#3b82f6") + "15", color: ESP_COLORS[tema.esp] || "#3b82f6" }}>
                              {espAbbr ? espAbbr(tema.esp) : tema.esp}
                            </span>
                            <p className="text-xs font-bold text-white truncate">{tema.nome}</p>
                          </div>
                          <p className="text-[9.5px] text-gray-500 mt-1">
                            Próxima revisão em: <strong className={overdueManut ? "text-amber-400" : "text-gray-400"}>{m.date}</strong> (Intervalo: {m.interval} dias)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onStudy(tema.id, "manutencao")}
                          className={`px-3 py-1.5 rounded-lg text-[10.5px] font-semibold transition-all shrink-0 active:scale-95 border-none cursor-pointer ${overdueManut ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"}`}
                        >
                          Revisar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Estatísticas e Heatmap Colapsável */}
        {totalSessions >= 7 && (
          <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDetailedPanels(!showDetailedPanels)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors border-none text-left"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <TrendingUp size={15} className="text-gray-500" />
                <span>Painel analítico complementar</span>
              </div>
              {showDetailedPanels ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </button>

            {showDetailedPanels && (
              <div className="p-5 border-t border-white/5 flex flex-col gap-6 animate-slide-down">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Heatmap */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Consistência Diária (35 dias)</p>
                    <div className="grid grid-cols-7 gap-1.5 justify-center max-w-xs mx-auto">
                      {days.map((d) => (
                        <div
                          key={d}
                          title={d}
                          className={`aspect-square rounded-sm transition-all duration-300 ${
                            doneDays.has(d)
                              ? "bg-gradient-to-br from-blue-600 to-sky-500 shadow-sm shadow-indigo-900/40"
                              : "bg-white/[0.03]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Zonas de Alerta Crítico */}
                  <ProgressiveTooltip
                    tooltipId="bleeding_score"
                    text="Mentor: As Zonas de Alerta mostram especialidades onde seu acerto médio acumulado está abaixo de 60%. Concentre-se nelas para evitar perda de pontos na prova."
                  >
                    <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col gap-3 w-full">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                        Zonas de Alerta Crítico
                      </p>
                      {bleeding.length === 0 ? (
                        <p className="text-[11px] text-gray-600 italic py-4 text-center">Nenhuma zona crítica abaixo de 60%.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {bleeding.map(b => (
                            <div key={b.esp} className="flex items-center justify-between p-2 border border-red-500/10 rounded-lg bg-red-500/[0.02]">
                              <div className="flex items-center gap-2">
                                <AlertTriangle size={12} className="text-red-400 shrink-0" />
                                <span className="text-xs text-gray-300 font-semibold">{b.esp}</span>
                              </div>
                              <span className="text-xs font-black text-red-400">{b.acc}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ProgressiveTooltip>

                  {/* Calibração Metacognitiva */}
                  <MetacognitiveChart doneReviews={done} />
                </div>

                {/* GRID MINHAS ÁREAS — apenas Vestibular */}
                {plat === "vest" && Object.keys(areaRetention).length > 0 && (
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col gap-3 md:col-span-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Minhas Áreas</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(areaRetention).map(([area, ret]) => {
                        const retColor = ret == null ? "text-gray-600" : ret >= 80 ? "text-emerald-400" : ret >= 60 ? "text-amber-400" : "text-red-400";
                        const retBg = ret == null ? "bg-white/[0.02] border-white/5" : ret >= 80 ? "bg-emerald-500/5 border-emerald-500/10" : ret >= 60 ? "bg-amber-500/5 border-amber-500/10" : "bg-red-500/5 border-red-500/10";
                        return (
                          <div key={area} className={`p-3 rounded-xl border ${retBg} flex flex-col gap-1`}>
                            <p className="text-[10px] text-gray-400 font-semibold leading-tight">{area}</p>
                            <p className={`text-2xl font-black tabular-nums ${retColor}`}>
                              {ret != null ? `${ret}%` : "–"}
                            </p>
                            <p className="text-[9px] text-gray-600">{ret == null ? "sem dados" : ret >= 80 ? "sólido" : ret >= 60 ? "em progresso" : "reforçar"}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )}

      {tourStep === "dash" && showTourBalloon && (
        <TourBalloon
          text="Mentor: Viu as datas de D1, D4, D7, D21 que apareceram? Eu calculei quando você vai esquecer e agendei as revisões. Você nunca mais decide quando revisar — eu decido."
          nextLabel="Concluir Tour"
          onNext={() => {
            setShowTourBalloon(false);
            setShowConfettiLocal(true);
            setShowCompletionModal(true);
            setTimeout(() => setShowConfettiLocal(false), 5000);
          }}
        />
      )}

      {temaValidando && (
        <ModalValidarDominio
          tema={temaValidando}
          onConfirm={({ questoes, acertos }) => {
            const resultado = validarDominio(plat, temaValidando.id, { questoes, acertos });
            (showToast || showToastGlobal)(resultado?.observacao || "Validação de domínio registrada para este tema.");
              safeTrackEvent(
                "dominio_previo_avaliado",
                {
                  plat,
                  percentual: resultado?.percentual,
                  status: resultado?.status,
                },
                { state: { meta: telemetryMeta } }
              );
            setTemaValidando(null);
          }}
          onStartLater={() => {
            iniciarValidacaoDominioPrevio(plat, temaValidando.id);
            (showToast || showToastGlobal)("Validação marcada como pendente para este tema.");
            setTemaValidando(null);
          }}
          onCancel={() => setTemaValidando(null)}
        />
      )}

      {showCompletionModal && (
        <Modal onClose={() => {
          setShowCompletionModal(false);
            safeTrackEvent("onboarding_done", {}, { state: { meta: telemetryMeta } });
          setOnboardingDone();
          setTourStep(null);
        }}>
          <div className="text-center py-4 space-y-4 max-w-sm mx-auto text-left">
            <div className="text-center">
              <GraduationCap size={56} className="animate-bounce block mx-auto text-blue-400" />
              <h2 className="text-xl font-black text-white mt-3">Tour Concluído!</h2>
              <p className="text-xs text-gray-400 mt-1">Você está pronto para usar a metodologia de elite do MedRev.</p>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-xs leading-relaxed text-gray-300">
              <span className="font-bold text-blue-400 block mb-1">🧠 Mentor:</span>
              "Você completou o demo. Agora faça de verdade. Qual tema quer iniciar primeiro?"
            </div>

            <Btn
              className="w-full py-3"
              onClick={() => {
                setShowCompletionModal(false);
                safeTrackEvent("onboarding_done", {}, { state: { meta: telemetryMeta } });
                setOnboardingDone();
                setTourStep(null);
                setView && setView("crono");
              }}
            >
              Ir para o Cronograma
            </Btn>
          </div>
        </Modal>
      )}

      {showConfettiLocal && <ConfettiOverlay />}
    </div>
  );
}
