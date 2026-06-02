// src/components/StatsPanel.jsx
// Estatisticas reorganizadas em 7 secoes diagnosticaveis.
// Cada secao responde: o que mede / da pra confiar / o que fazer.
import React, { useMemo, useState, lazy, Suspense } from "react";
import {
  BarChart3, Flame, BookOpen, AlertCircle, Trophy,
  Brain, Activity,
} from "lucide-react";
import { useStore } from "../core/store";
import { STEPS, ESP_COLORS, todayStr, addDays, fmtDate } from "../core/fsrs";
import { calcCalibration } from "../core/calibration";
import { getMentorPhrase } from "../core/mentor";
import { getReadinessData } from "../core/readiness";
import {
  ERROR_TYPE_LABEL, dominantErrorType, summarizeErrors,
} from "../core/errorTaxonomy";
import {
  evaluateMetric, formatMetricValue, METRIC_STATUS,
} from "../core/metricsRegistry";
import { calcTrueRetentionDetailed } from "../hooks/useMetrics";
import { calculateClinicalReasoningScoreDetailed } from "../core/clinicalReasoningScoring";
import EnamedMapa from "./EnamedMapa";
import AdvancedSection from "./AdvancedSection";
import MetricCard from "./MetricCard";
import ErrorActionCenter from "./ErrorActionCenter";

const EnamedProvaAnalyzer = lazy(() => import("./EnamedProvaAnalyzer"));

// ─── Secoes ───────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "resumo",      label: "Resumo",     icon: BarChart3,     forPlat: ["res", "vest"] },
  { id: "aprendizagem",label: "Aprendizagem",icon: BookOpen,      forPlat: ["res", "vest"] },
  { id: "erros",       label: "Erros",      icon: AlertCircle,   forPlat: ["res", "vest"] },
  { id: "provas",      label: "Provas",     icon: Trophy,        forPlat: ["res", "vest"] },
  { id: "raciocinio",  label: "Raciocinio", icon: Brain,         forPlat: ["res"] },
  { id: "atividade",   label: "Atividade",  icon: Activity,      forPlat: ["res", "vest"] },
];

// ─── Navegacao entre secoes ──────────────────────────────────────────────────

function SectionNav({ sections, active, onChange }) {
  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex gap-1 min-w-max">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = s.id === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              <Icon size={12} />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

function Heatmap({ heatmapDays, doneDays, monthLabels }) {
  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
      <div>
        <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Flame size={15} className="text-orange-400" /> Consistencia (Ultimas 12 Semanas)
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5">Dias ativos na plataforma.</p>
      </div>
      <div className="w-full overflow-x-auto select-none py-2">
        <div className="min-w-[420px] max-w-lg mx-auto">
          <div className="flex gap-2 mb-1">
            <div className="w-8 shrink-0" />
            <div className="grid grid-cols-12 gap-1.5 w-full">
              {monthLabels.map((lbl, i) => (
                <span key={i} className="text-[9px] text-gray-500 font-bold text-center uppercase tracking-wider block truncate">
                  {lbl}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2 items-start justify-center">
            <div className="flex flex-col justify-between text-[9px] text-gray-500 h-28 pr-1 py-1 font-semibold uppercase tracking-wider select-none shrink-0">
              <span>Dom</span><span>Qua</span><span>Sab</span>
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 h-28 w-full">
              {heatmapDays.map((d) => {
                const studied = doneDays.has(d);
                return (
                  <div
                    key={d}
                    title={`${fmtDate(d)}: ${studied ? "Estudo Realizado" : "Nenhuma Atividade"}`}
                    className={`aspect-square w-3.5 h-3.5 rounded-sm transition-all duration-300 ${
                      studied
                        ? "bg-gradient-to-br from-blue-500 to-sky-500 shadow-sm shadow-slate-950/50"
                        : "bg-white/[0.03] hover:bg-white/[0.08]"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Grafico SVG de evolucao de acertos ──────────────────────────────────────

const SVG_W = 500;
const SVG_H = 130;

function AccuracyChart({ data }) {
  const { line, area, pts } = useMemo(() => {
    if (!data || data.length < 2) return { line: "", area: "", pts: [] };
    const len = data.length;
    const startX = 15;
    const endX = SVG_W - 15;
    const ptsArr = data.map((p, i) => {
      const x = (i / (len - 1)) * (endX - startX) + startX;
      const y = SVG_H - (p.acerto / 100) * (SVG_H - 25) - 15;
      return { x, y, val: p.acerto };
    });
    const l = `M ${ptsArr.map((p) => `${p.x},${p.y}`).join(" L ")}`;
    const a = `${l} L ${ptsArr[ptsArr.length - 1].x},${SVG_H - 10} L ${ptsArr[0].x},${SVG_H - 10} Z`;
    return { line: l, area: a, pts: ptsArr };
  }, [data]);

  if (!data || data.length < 2) {
    return (
      <p className="text-[11.5px] text-gray-500 text-center leading-relaxed p-8">
        Insuficientes dados para grafico cronologico. Continue estudando.
      </p>
    );
  }
  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <line x1="15" y1={SVG_H - 10} x2={SVG_W - 15} y2={SVG_H - 10} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <line x1="15" y1={(SVG_H - 25) * 0.5 + 15} x2={SVG_W - 15} y2={(SVG_H - 25) * 0.5 + 15} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <line x1="15" y1="15" x2={SVG_W - 15} y2="15" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <text x="17" y={SVG_H - 14} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">0%</text>
      <text x="17" y={(SVG_H - 25) * 0.5 + 20} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">50%</text>
      <text x="17" y="23" fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">100%</text>
      {area && <path d={area} fill="url(#areaGrad)" />}
      {line && <path d={line} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#ec4899" stroke="#0e0e18" strokeWidth="1.5">
          <title>{`Sessao ${i + 1}: ${p.val}%`}</title>
        </circle>
      ))}
    </svg>
  );
}

// ─── StatsPanel principal ─────────────────────────────────────────────────────

export default function StatsPanel({ setView = null }) {
  const { plat, temaStats, userName, meta } = useStore();
  const temas = useStore((s) => s[plat]?.temas || []);
  const simulados = useStore((s) => s[plat]?.simulados || []);
  const weeklyReviews = useStore((s) => s.weeklyReviews || []);
  const enamedAnalises = useStore((s) => s.enamedAnalises || []);
  const casosProgresso = useStore((s) => s[plat]?.casosProgresso || {});
  const sessionReflections = useStore((s) => s.sessionReflections || []);

  const [activeSection, setActiveSection] = useState("resumo");

  // Filtrar secoes para plataforma atual
  const availableSections = SECTIONS.filter(
    (s) => s.forPlat.includes(plat) && (!s.devOnly || process.env.NODE_ENV !== "production")
  );

  // Garantir que secao ativa e valida para esta plataforma
  const currentSection = availableSections.find((s) => s.id === activeSection)
    ? activeSection
    : availableSections[0]?.id || "resumo";

  // ─── Calculos compartilhados ────────────────────────────────────────────────

  const startedTemas = useMemo(() => temas.filter((t) => !t.unstarted), [temas]);

  // Retencao real
  const retentionDetailed = useMemo(() => calcTrueRetentionDetailed(temas), [temas]);

  // Readiness
  const readinessData = useMemo(
    () => getReadinessData({ temas, simulados, meta, plat, casosProgresso }),
    [temas, simulados, meta, plat, casosProgresso]
  );

  // Sparkline de prontidao
  const sparklinePath = useMemo(() => {
    const hist = meta.prontidaoHist || [];
    if (hist.length < 2) return "";
    const width = 100;
    const height = 20;
    const padding = 2;
    const dx = width / (hist.length - 1);
    return hist
      .map((p, i) => {
        const x = i * dx;
        const y = height - padding - (p.score / 100) * (height - padding * 2);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [meta.prontidaoHist]);

  // Erros
  const errorAnalytics = useMemo(() => {
    const fromReviews = temas.flatMap((tema) =>
      STEPS.flatMap((step) => {
        const review = tema.rev?.[step.key];
        if (!review?.done) return [];
        const structured = Array.isArray(review.erros) ? review.erros : [];
        const fallback = Array.isArray(review.motivosErro)
          ? review.motivosErro.map((tipoErro) => ({ tipoErro, acertou: false, confianca: review.confianca }))
          : [];
        return [...structured, ...fallback];
      })
    );
    const fromSimulados = simulados.flatMap((sim) =>
      (sim.questoesErradas || []).map((q) => ({
        tipoErro: q.tipoErro,
        acertou: false,
        confianca: q.confianca,
        tempoExcedido: Boolean(q.tempoExcedido),
      }))
    );
    const errors = [...fromReviews, ...fromSimulados];
    const summary = summarizeErrors(errors);
    const dominant = dominantErrorType(errors);
    return {
      total: errors.length,
      summary,
      dominant,
      confidenceMismatch: summary.confianca_mal_calibrada || 0,
      reasoning: summary.raciocinio || 0,
      time: summary.tempo || 0,
    };
  }, [temas, simulados]);

  // Calibracao
  const calibrationData = useMemo(() => {
    const flatStats = Object.values(temaStats || {}).flat();
    return calcCalibration(flatStats);
  }, [temaStats]);

  const calibrationMentorPhrase = useMemo(() => {
    if (!calibrationData || calibrationData.status === "coletando") {
      const remaining = 5 - (calibrationData?.n || 0);
      return `Ainda reunindo dados. Faltam mais ${remaining} ${remaining === 1 ? "revisao" : "revisoes"} com previsao preenchida.`;
    }
    const key = `calibracao_${calibrationData.tendencia}`;
    const phraseObj = getMentorPhrase(key, { userName: userName || "Estudante" }, [], plat);
    return phraseObj.text;
  }, [calibrationData, userName, plat]);

  // Heatmap 12 semanas
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - 83);
    const dow = startDay.getDay();
    startDay.setDate(startDay.getDate() - dow);
    for (let i = 0; i < 84; i++) {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, []);

  const doneDays = useMemo(() => {
    const dates = new Set();
    temas.forEach((t) => {
      STEPS.forEach((s) => {
        const r = t.rev?.[s.key];
        if (r?.done && r.date) dates.add(r.date);
      });
    });
    Object.values(temaStats || {}).forEach((logs) => {
      if (Array.isArray(logs)) {
        logs.forEach((log) => {
          if (log.completedAt) dates.add(log.completedAt.slice(0, 10));
        });
      }
    });
    return dates;
  }, [temas, temaStats]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = "";
    for (let i = 0; i < 12; i++) {
      const dateStr = heatmapDays[i * 7];
      if (!dateStr) { labels.push(""); continue; }
      const date = new Date(dateStr + "T12:00:00");
      const monthName = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      if (monthName !== lastMonth) { labels.push(monthName); lastMonth = monthName; }
      else labels.push("");
    }
    return labels;
  }, [heatmapDays]);

  // Grafico de acertos cronologico
  const chronologicalAccuracy = useMemo(() => {
    const list = [];
    Object.entries(temaStats || {}).forEach(([, logs]) => {
      if (Array.isArray(logs)) {
        logs.forEach((log) => {
          if (log.acerto != null && log.completedAt) {
            list.push({ completedAt: new Date(log.completedAt), acerto: Math.round(log.acerto * 100) });
          }
        });
      }
    });
    return list.sort((a, b) => a.completedAt - b.completedAt);
  }, [temaStats]);

  // Forecast FSRS 14 dias
  const forecastData = useMemo(() => {
    const counts = {};
    for (let i = 0; i < 14; i++) counts[addDays(todayStr(), i)] = 0;
    temas.forEach((t) => {
      STEPS.forEach((s) => {
        const r = t.rev?.[s.key];
        if (r && !r.done && r.date && counts[r.date] !== undefined) counts[r.date]++;
      });
    });
    return Object.entries(counts).map(([date, count]) => ({ date, label: fmtDate(date), count }));
  }, [temas]);

  // Stats por especialidade
  const personalStats = useMemo(() => {
    if (!startedTemas.length) return null;
    const byEsp = {};
    let totalQuestoes = 0;
    startedTemas.forEach((t) => {
      if (!byEsp[t.esp]) byEsp[t.esp] = { questoes: 0, acertos: [], doneSteps: 0, total: 0 };
      STEPS.forEach((s) => {
        const r = t.rev[s.key];
        byEsp[t.esp].total++;
        if (r.done) {
          byEsp[t.esp].doneSteps++;
          if (r.questoes) { byEsp[t.esp].questoes += r.questoes; totalQuestoes += r.questoes; }
          if (r.acerto != null) byEsp[t.esp].acertos.push(r.acerto);
        }
      });
    });
    const espStats = Object.entries(byEsp).map(([esp, v]) => ({
      esp,
      acc: v.acertos.length ? Math.round(v.acertos.reduce((a, b) => a + b) / v.acertos.length * 100) : null,
      questoes: v.questoes,
      doneSteps: v.doneSteps,
      total: v.total,
      progress: Math.round(v.doneSteps / v.total * 100),
    })).sort((a, b) => b.questoes - a.questoes);
    const withAcc = espStats.filter((e) => e.acc != null);
    return {
      espStats,
      totalQuestoes,
      totalConcluidos: startedTemas.filter((t) => STEPS.every((s) => t.rev[s.key].done)).length,
      bestEsp: withAcc.length ? [...withAcc].sort((a, b) => b.acc - a.acc)[0] : null,
      worstEsp: withAcc.length ? [...withAcc].sort((a, b) => a.acc - b.acc)[0] : null,
      overallAcc: (() => {
        const all = startedTemas.flatMap((t) => STEPS.map((s) => t.rev[s.key])).filter((r) => r.done && r.acerto != null);
        return all.length ? Math.round(all.reduce((a, r) => a + r.acerto, 0) / all.length * 100) : null;
      })(),
    };
  }, [startedTemas]);

  // Raciocinio clinico — dados existentes sem calculo duplicado
  // P4-A: usa fonte canonica de clinicalReasoningScoring.js
  const raciocinioStats = useMemo(() => {
    const detailed = calculateClinicalReasoningScoreDetailed(casosProgresso);
    const casosFeitos = detailed.byCase.filter((c) => c.vistos > 0).length;
    return {
      casosFeitos,
      score: detailed.score,
      n: detailed.n,
      collecting: detailed.collecting,
      confident: detailed.confident,
    };
  }, [casosProgresso]);

  // Dias ativos (ultima semana, para consistencia)
  const activeLastWeek = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 7; i++) {
      if (doneDays.has(addDays(todayStr(), -i))) count++;
    }
    return count;
  }, [doneDays]);

  // Vencidas e relearning
  const { overdueCount, relearningCount, todayPending } = useMemo(() => {
    const today = todayStr();
    let overdue = 0;
    let relearning = 0;
    let pending = 0;
    temas.forEach((t) => {
      STEPS.forEach((s) => {
        const r = t.rev?.[s.key];
        if (!r || r.done) return;
        if (r.date && r.date < today) overdue++;
        if (r.date === today) pending++;
        if (s.key === "relearning" && !r.done) relearning++;
      });
    });
    return { overdueCount: overdue, relearningCount: relearning, todayPending: pending };
  }, [temas]);

  // Adesao Anki (ultima semana)
  const ankiAdherencePct = useMemo(() => {
    const datas = meta?.ankiAdesao?.datas || [];
    if (!datas.length) return null;
    let hits = 0;
    for (let i = 0; i < 7; i++) if (datas.includes(addDays(todayStr(), -i))) hits++;
    return Math.round((hits / 7) * 100);
  }, [meta]);

  // ─── Metricas avaliadas via registry ────────────────────────────────────────

  const metricsEvaluated = useMemo(() => ({
    trueRetention: evaluateMetric("trueRetention", retentionDetailed?.pct ?? null, { n: retentionDetailed?.n ?? 0 }),
    overdueReviews: evaluateMetric("overdueReviews", overdueCount, {}),
    relearningCount: evaluateMetric("relearningCount", relearningCount, {}),
    dominantError: evaluateMetric("dominantError", errorAnalytics.dominant, { total: errorAnalytics.total }),
    simuladoAccuracy: evaluateMetric("simuladoAccuracy", readinessData.acertoSimulado, { n: simulados.length }),
    clinicalReasoningScore: evaluateMetric("clinicalReasoningScore", raciocinioStats.score, { n: raciocinioStats.n }),
    ankiAdherence: evaluateMetric("ankiAdherence", ankiAdherencePct, { days: (meta?.ankiAdesao?.datas || []).length }),
    weeklyConsistency: evaluateMetric("weeklyConsistency", activeLastWeek, { totalDays: 7 }),
    coverageByArea: evaluateMetric("coverageByArea", readinessData.cobertura, { total: temas.length }),
    enamedGap: evaluateMetric("enamedGap", null, { hasAnalise: enamedAnalises.length > 0 }),
  }), [
    retentionDetailed, overdueCount, relearningCount, errorAnalytics,
    readinessData, simulados, raciocinioStats, ankiAdherencePct, meta,
    activeLastWeek, temas, enamedAnalises,
  ]);

  // ─── Empty state global ─────────────────────────────────────────────────────

  if (!temas.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <BarChart3 size={40} className="text-gray-700" />
        <p className="text-[13px] text-gray-500">Adicione temas ao seu banco para ver estat\u00edsticas pessoais.</p>
      </div>
    );
  }

  // ─── Renderizacao por secao ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 animate-fade-up text-left">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <BarChart3 size={20} className="text-indigo-400" />
        <h2 className="text-[15px] font-bold text-gray-100">Estat\u00edsticas</h2>
      </div>

      {/* Navegacao */}
      <SectionNav
        sections={availableSections}
        active={currentSection}
        onChange={setActiveSection}
      />

      {/* ── SECAO 1: RESUMO ─────────────────────────────────────────────────── */}
      {currentSection === "resumo" && (
        <div className="space-y-4">
          <p className="text-[11px] text-gray-500">Diagnostico rapido: como voce esta de verdade agora.</p>

          {/* Preparo + KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Preparo estimado — card especial com sparkline */}
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between min-h-[100px] sm:col-span-2">
              <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Preparo estimado</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-3xl font-black tabular-nums text-blue-400">
                  {readinessData.score != null ? `${readinessData.score}%` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-gray-600 mt-1">
                Score ponderado: retencao + simulados + cobertura + ritmo + Anki.
              </p>
              {sparklinePath && (
                <div className="absolute bottom-0 left-0 right-0 h-5 opacity-40 pointer-events-none">
                  <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
                    <path d={sparklinePath} fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
            </div>

            <MetricCard
              label={metricsEvaluated.trueRetention.label}
              value={formatMetricValue("trueRetention", metricsEvaluated.trueRetention.value)}
              status={metricsEvaluated.trueRetention.status}
              description={metricsEvaluated.trueRetention.description}
              emptyState={metricsEvaluated.trueRetention.emptyState}
              action={metricsEvaluated.trueRetention.action}
            />
            <MetricCard
              label={metricsEvaluated.overdueReviews.label}
              value={formatMetricValue("overdueReviews", metricsEvaluated.overdueReviews.value)}
              status={metricsEvaluated.overdueReviews.status}
              description="Revisoes com data passada nao feitas."
              emptyState="Nenhuma revisao vencida"
              action={metricsEvaluated.overdueReviews.action}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              label={metricsEvaluated.relearningCount.label}
              value={formatMetricValue("relearningCount", metricsEvaluated.relearningCount.value)}
              status={metricsEvaluated.relearningCount.status}
              description="Temas que escaparam da memoria."
              emptyState="Nenhum em relearning"
              action={metricsEvaluated.relearningCount.action}
            />
            <MetricCard
              label="Carga de hoje"
              value={`${todayPending}`}
              status={todayPending === 0 ? METRIC_STATUS.OK : METRIC_STATUS.WARNING}
              description="Revisoes programadas para hoje."
              emptyState="Nenhuma revisao hoje"
              action={todayPending > 10 ? "Fila alta — priorize as mais antigas." : null}
            />
            <MetricCard
              label={metricsEvaluated.ankiAdherence.label}
              value={formatMetricValue("ankiAdherence", metricsEvaluated.ankiAdherence.value)}
              status={metricsEvaluated.ankiAdherence.status}
              description="Dias com Anki nos ultimos 7."
              emptyState={metricsEvaluated.ankiAdherence.emptyState}
              action={metricsEvaluated.ankiAdherence.action}
            />
            <MetricCard
              label={metricsEvaluated.weeklyConsistency.label}
              value={formatMetricValue("weeklyConsistency", metricsEvaluated.weeklyConsistency.value)}
              status={metricsEvaluated.weeklyConsistency.status}
              description="Dias de estudo nos ultimos 7."
              emptyState={metricsEvaluated.weeklyConsistency.emptyState}
              action={metricsEvaluated.weeklyConsistency.action}
            />
          </div>

          {/* Proxima acao do Mentor */}
          {readinessData.score != null && (
            <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1">Proximo passo recomendado</p>
              <p className="text-[12px] text-gray-300 leading-relaxed">
                {overdueCount > 0
                  ? `Resolva as ${overdueCount} revisoes vencidas antes de qualquer coisa.`
                  : relearningCount > 0
                  ? `${relearningCount} temas em relearning — priorize recupera-los.`
                  : retentionDetailed?.collecting
                  ? "Continue as revisoes D21+ para estimar retencao real."
                  : "Continue o ritmo — fila do dia em dia."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── SECAO 2: APRENDIZAGEM ────────────────────────────────────────────── */}
      {currentSection === "aprendizagem" && (
        <div className="space-y-4">
          <p className="text-[11px] text-gray-500">Cobertura, retencao por area e evolucao cronologica.</p>

          {/* KPIs rapidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Temas totais", value: temas.length, color: "text-indigo-400" },
              { label: "Iniciados", value: startedTemas.length, color: "text-blue-400" },
              { label: "Ciclos completos", value: personalStats?.totalConcluidos ?? 0, color: "text-emerald-400" },
              {
                label: "Acerto medio",
                value: personalStats?.overallAcc != null ? `${personalStats.overallAcc}%` : "—",
                color: personalStats?.overallAcc == null ? "text-gray-500" : personalStats.overallAcc >= 80 ? "text-emerald-400" : personalStats.overallAcc >= 65 ? "text-yellow-400" : "text-red-400",
              },
            ].map((s) => (
              <div key={s.label} className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[80px]">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">{s.label}</p>
                <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Cobertura */}
          <MetricCard
            label={metricsEvaluated.coverageByArea.label}
            value={formatMetricValue("coverageByArea", metricsEvaluated.coverageByArea.value)}
            status={metricsEvaluated.coverageByArea.status}
            description={metricsEvaluated.coverageByArea.description}
            emptyState={metricsEvaluated.coverageByArea.emptyState}
            action={metricsEvaluated.coverageByArea.action}
            className="sm:col-span-2"
          />

          {/* Grafico de acertos */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-3 shadow-lg">
            <div>
              <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Evolucao Cronologica de Acertos</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Precisao media de cada sessao em ordem cronologica.</p>
            </div>
            <div className="h-44 flex items-center justify-center bg-black/40 border border-white/5 rounded-xl p-3">
              <AccuracyChart data={chronologicalAccuracy} />
            </div>
          </div>

          {/* Forecast FSRS */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-3 shadow-lg">
            <div>
              <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Previsao de Carga FSRS (14 dias)</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Revisoes programadas por dia.</p>
            </div>
            <div className="w-full overflow-x-auto select-none pt-2">
              <div className="flex items-end justify-between gap-2.5 min-w-[500px] h-32 border-b border-white/5 pb-2 px-2">
                {forecastData.map((d, idx) => {
                  const maxCount = Math.max(...forecastData.map((x) => x.count), 1);
                  const h = (d.count / maxCount) * 80;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <span className="text-[9.5px] font-mono text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity select-none">{d.count}</span>
                      <div
                        style={{ height: `${Math.max(4, h)}px` }}
                        className={`w-full rounded-t transition-all ${
                          d.count === 0 ? "bg-white/5" : idx === 0 ? "bg-gradient-to-t from-blue-600 to-sky-500" : "bg-blue-500/60 group-hover:bg-blue-400"
                        }`}
                      />
                      <span className={`text-[9px] font-mono font-bold mt-1 ${idx === 0 ? "text-sky-400 font-black" : "text-gray-600"}`}>
                        {idx === 0 ? "Hoje" : d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desempenho por especialidade */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
            <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">
              {plat === "vest" ? "Desempenho por Materia" : "Desempenho por Especialidade"}
            </h3>
            <div className="space-y-4">
              {personalStats?.espStats.map((e) => {
                const espC = ESP_COLORS[e.esp] || "#94a3b8";
                const accColor = e.acc == null ? "text-gray-600" : e.acc >= 80 ? "text-emerald-400" : e.acc >= 65 ? "text-yellow-400" : "text-red-400";
                return (
                  <div key={e.esp} className="space-y-1.5">
                    <div className="flex justify-between text-[12px]">
                      <span className="font-semibold text-gray-300">{e.esp}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 text-[11px]">{e.questoes.toLocaleString("pt-BR")} questoes</span>
                        <span className={`font-black tabular-nums ${accColor}`}>{e.acc != null ? `${e.acc}%` : "—"}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${e.progress}%`, background: espC + "cc" }} />
                    </div>
                    <p className="text-[10px] text-gray-600">{e.doneSteps}/{e.total} etapas · {e.progress}% do ciclo</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calibracao metacognitiva */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Calibracao Metacognitiva</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Alinhamento entre o que voce acha que vai acertar e o resultado real.</p>
              </div>
              {calibrationData.status === "ok" && (
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  calibrationData.tendencia === "calibrado"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : calibrationData.tendencia === "subestima"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}>
                  {calibrationData.tendencia === "calibrado" ? "Calibrado" : calibrationData.tendencia === "subestima" ? "Subestima" : "Excesso de Confianca"}
                </span>
              )}
            </div>
            {calibrationData.status === "coletando" ? (
              <div className="bg-black/25 border border-white/5 p-4 rounded-xl text-center space-y-1.5">
                <p className="text-[11px] text-gray-400">
                  Coletando dados — faltam {5 - calibrationData.n} revisoes com previsao preenchida.
                </p>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all" style={{ width: `${(calibrationData.n / 5) * 100}%` }} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Precisao de Previsao</span>
                  <span className="text-3xl font-black font-mono text-blue-400">{calibrationData.precisao}%</span>
                  <span className="text-[9px] text-gray-600 mt-1">Proximidade com o resultado real</span>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Vies de Confianca</span>
                  <span className={`text-3xl font-black font-mono ${calibrationData.vies > 0 ? "text-amber-400" : calibrationData.vies < 0 ? "text-blue-400" : "text-emerald-400"}`}>
                    {calibrationData.vies > 0 ? `+${calibrationData.vies}%` : `${calibrationData.vies}%`}
                  </span>
                  <span className="text-[9px] text-gray-600 mt-1">
                    {calibrationData.vies > 0 ? "Otimista" : calibrationData.vies < 0 ? "Pessimista" : "Alinhado"}
                  </span>
                </div>
                <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-4 flex flex-col justify-center text-left">
                  <span className="text-[9.5px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">Mentor Metacognitivo</span>
                  <p className="text-[11.5px] text-gray-400 leading-relaxed mt-0.5 italic">"{calibrationMentorPhrase}"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SECAO 3: ERROS ──────────────────────────────────────────────────── */}
      {currentSection === "erros" && (
        <div className="space-y-4">
          <p className="text-[11px] text-gray-500">Padroes de erro para acao corretiva direcionada.</p>

          {errorAnalytics.total === 0 ? (
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-8 text-center text-gray-500 text-[12px]">
              Sem erros suficientes para identificar padrao dominante.
              <br />
              Complete mais sessoes e simulados.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <MetricCard
                  label="Erro dominante"
                  value={ERROR_TYPE_LABEL[errorAnalytics.dominant] || errorAnalytics.dominant || "—"}
                  status={metricsEvaluated.dominantError.status}
                  description="Tipo de erro mais frequente."
                  emptyState="Sem dados suficientes"
                  action={null}
                />
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Alta conf + erro</p>
                  <p className="text-2xl font-black text-amber-300 tabular-nums">{errorAnalytics.confidenceMismatch}</p>
                  <p className="text-[10px] text-gray-600">Acertei com alta confianca — ou o contrario.</p>
                </div>
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Erro por tempo</p>
                  <p className="text-2xl font-black text-blue-300 tabular-nums">{errorAnalytics.time}</p>
                  <p className="text-[10px] text-gray-600">Questoes perdidas por pressao de tempo.</p>
                </div>
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Erro de raciocinio</p>
                  <p className="text-2xl font-black text-red-300 tabular-nums">{errorAnalytics.reasoning}</p>
                  <p className="text-[10px] text-gray-600">Raciocinio clinico ou diagnostico falhou.</p>
                </div>
              </div>

              <ErrorActionCenter />
            </>
          )}
        </div>
      )}

      {/* ── SECAO 4: PROVAS/SIMULADOS ────────────────────────────────────────── */}
      {currentSection === "provas" && (
        <div className="space-y-4">
          <p className="text-[11px] text-gray-500">Desempenho em provas e simulados.</p>

          <MetricCard
            label={metricsEvaluated.simuladoAccuracy.label}
            value={formatMetricValue("simuladoAccuracy", metricsEvaluated.simuladoAccuracy.value)}
            status={metricsEvaluated.simuladoAccuracy.status}
            description={metricsEvaluated.simuladoAccuracy.description}
            emptyState={metricsEvaluated.simuladoAccuracy.emptyState}
            action={metricsEvaluated.simuladoAccuracy.action}
          />

          {plat === "res" && (
            <>
              <EnamedMapa onFocar={() => setView && setView("crono")} />
              {enamedAnalises.length > 0 && (
                <AdvancedSection title="An\u00e1lise ENAMED detalhada" defaultOpen={false} storageKey="stats-enamed-advanced">
                  <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando an\u00e1lise ENAMED...</div>}>
                    <EnamedProvaAnalyzer />
                  </Suspense>
                </AdvancedSection>
              )}
            </>
          )}

          {plat === "vest" && simulados.length === 0 && (
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-8 text-center text-gray-500 text-[12px]">
              Nenhum simulado registrado ainda. Registre simulados para ver evolu\u00e7\u00e3o.
            </div>
          )}
        </div>
      )}

      {/* ── SECAO 5: RACIOCINIO CLINICO (res only) ───────────────────────────── */}
      {currentSection === "raciocinio" && (
        <div className="space-y-4">
          <p className="text-[11px] text-gray-500">Score atual de racioc\u00ednio cl\u00ednico — dados existentes (n\u00e3o duplica c\u00e1lculo).</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard
              label="Score de racioc\u00ednio"
              value={formatMetricValue("clinicalReasoningScore", raciocinioStats.score)}
              status={metricsEvaluated.clinicalReasoningScore.status}
              description="Media ponderada: casos (60%) + SCT (40%)."
              emptyState="Nenhum caso clinico concluido"
              action={metricsEvaluated.clinicalReasoningScore.action}
            />
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Casos feitos</p>
              <p className="text-2xl font-black text-blue-400 tabular-nums">{raciocinioStats.casosFeitos}</p>
              <p className="text-[10px] text-gray-600">Casos clinicos ja visitados.</p>
            </div>
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Estado</p>
              <p className={`text-sm font-black ${raciocinioStats.confident ? "text-emerald-400" : "text-amber-400"}`}>
                {raciocinioStats.n === 0 ? "Sem dados" : raciocinioStats.collecting ? "Amostra baixa" : "Confiavel"}
              </p>
              <p className="text-[10px] text-gray-600">
                {raciocinioStats.collecting
                  ? `Faltam ${Math.max(0, 3 - raciocinioStats.n)} casos para score confiavel.`
                  : "Score baseado em amostra suficiente."}
              </p>
            </div>
          </div>

          {/* Placeholder P4 */}
          <div className="bg-indigo-950/10 border border-indigo-500/10 rounded-2xl p-5 flex items-start gap-3">
            <Brain size={16} className="text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[12px] font-bold text-indigo-300">Racioc\u00ednio Cl\u00ednico integrado \u00e0 curva de revis\u00e3o (P4)</p>
              <p className="text-[11px] text-gray-500 mt-1">
                Em breve: revis\u00e3o multimodal por est\u00e1gio da curva (D1 recorda\u00e7\u00e3o estruturada, D4 racioc\u00ednio diagn\u00f3stico, D7 mini caso, D21 concord\u00e2ncia cl\u00ednica + conduta),
                score \u00fanico e conduta/prescri\u00e7\u00e3o simulada.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECAO 6: ATIVIDADE ──────────────────────────────────────────────── */}
      {currentSection === "atividade" && (
        <div className="space-y-4">
          <p className="text-[11px] text-gray-500">Consistencia de estudos e historico recente.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard
              label="Consistencia semanal"
              value={formatMetricValue("weeklyConsistency", activeLastWeek)}
              status={metricsEvaluated.weeklyConsistency.status}
              description="Dias ativos nos ultimos 7."
              emptyState={metricsEvaluated.weeklyConsistency.emptyState}
              action={metricsEvaluated.weeklyConsistency.action}
            />
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Sessoes registradas</p>
              <p className="text-2xl font-black text-indigo-400 tabular-nums">{sessionReflections.length}</p>
              <p className="text-[10px] text-gray-600">Fechamentos de sessao acumulados.</p>
            </div>
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Revisoes executivas</p>
              <p className="text-2xl font-black text-emerald-400 tabular-nums">{weeklyReviews.length}</p>
              <p className="text-[10px] text-gray-600">Revisoes semanais registradas.</p>
            </div>
          </div>

          <Heatmap heatmapDays={heatmapDays} doneDays={doneDays} monthLabels={monthLabels} />
        </div>
      )}

      {/* ── SECAO 7: SISTEMA ─────────────────────────────────────────────────── */}
    </div>
  );
}
