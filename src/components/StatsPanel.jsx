// src/components/StatsPanel.jsx
// Estatisticas reorganizadas em 7 secoes diagnosticaveis.
// Cada secao responde: o que mede / da pra confiar / o que fazer.
import React, { useMemo, useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  BarChart3, Flame, BookOpen, AlertCircle, Trophy,
  Brain, Activity, Info, AlertTriangle, TrendingDown, TrendingUp, Zap, Unlock,
  Target, ChevronRight, CheckCircle,
} from "lucide-react";
import { useStore } from "../core/store";
import { STEPS, ESP_COLORS, todayStr, addDays, fmtDate, diffDays } from "../core/fsrs";
import { calcCalibration } from "../core/calibration";
import { getMentorPhrase, getMentorDiagnosis } from "../core/mentor";
import { getReadinessData, hasTemaBeenSeen } from "../core/readiness";
import {
  ERROR_TYPE_LABEL, dominantErrorType, summarizeErrors,
} from "../core/errorTaxonomy";
import {
  evaluateMetric, formatMetricValue, METRIC_STATUS,
} from "../core/metricsRegistry";
import { compareReadinessToSimulado, createReadinessSnapshot, summarizeForecastBacktests } from "../core/readinessValidation";
import { calcPrevisaoDesempenho, CONFIDENCE_LABEL } from "../core/forecast";
import { safeTrackEvent } from "../core/telemetry";
import { calcTrueRetentionDetailed } from "../hooks/useMetrics";
import { saldoRitmo } from "../core/volume";
import { getEnamedIntel } from "../core/enamedIntel";
import { calculateClinicalReasoningScoreDetailed, summarizeClinicalCompetence } from "../core/clinicalReasoningScoring";
import { getTemaStatsFromLearningEvents } from "../core/learningEvent";
import { CLINICAL_CASES_INDEX } from "../constants/clinicalCasesIndex";
import EnamedMapa from "./EnamedMapa";
import AdvancedSection from "./AdvancedSection";
import MetricCard from "./MetricCard";
import ErrorActionCenter from "./ErrorActionCenter";
import { computeGrowth } from "../core/growthMetrics";
import { Badge, Card, SegmentedControl } from "./ui";
import { MotionPresence, MotionProgressBar, MotionStep } from "./motion";

const EnamedProvaAnalyzer = lazy(() => import("./EnamedProvaAnalyzer"));

// ─── Secoes ───────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "aprendizagem",label: "Aprendizagem",icon: BookOpen,      forPlat: ["res", "vest"] },
  { id: "provas",      label: "Provas/Simulados", icon: Trophy,   forPlat: ["res", "vest"] },
  { id: "erros",       label: "Erros",      icon: AlertCircle,    forPlat: ["res", "vest"] },
  { id: "revisoes",    label: "Revisoes",   icon: Flame,          forPlat: ["res", "vest"] },
  { id: "raciocinio",  label: "Raciocinio", icon: Brain,         forPlat: ["res"] },
  { id: "atividade",   label: "Atividade",  icon: Activity,      forPlat: ["res", "vest"] },
  { id: "validacao",   label: "Validacao",  icon: BarChart3,     forPlat: ["res", "vest"] },
];

// ─── Navegacao entre secoes ──────────────────────────────────────────────────

function SectionNav({ sections, active, onChange }) {
  return (
    <SegmentedControl
      ariaLabel="Seções de estatísticas"
      value={active}
      onChange={onChange}
      options={sections.map((section) => ({ value: section.id, label: section.label }))}
    />
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
  const { plat, userName, meta } = useStore();
  const temas = useStore((s) => s[plat]?.temas || []);
  const simulados = useStore((s) => s[plat]?.simulados || []);
  const weeklyReviews = useStore((s) => s.weeklyReviews || []);
  const enamedAnalises = useStore((s) => s.enamedAnalises || []);
  const casosProgresso = useStore((s) => s[plat]?.casosProgresso || {});
  const sessionReflections = useStore((s) => s.sessionReflections || []);
  const learningEvents = useStore((s) => s.learningEvents || []);
  const legacyTemaStats = useStore((s) => s.temaStats || {});
  const temaStats = useMemo(
    () => getTemaStatsFromLearningEvents(learningEvents, { plat, fallbackTemaStats: legacyTemaStats }),
    [learningEvents, plat, legacyTemaStats]
  );

  const [activeSection, setActiveSection] = useState("aprendizagem");
  const lastReadinessTelemetryRef = useRef("");

  // Filtrar secoes para plataforma atual
  const availableSections = SECTIONS.filter(
    (s) => s.forPlat.includes(plat) && (!s.devOnly || process.env.NODE_ENV !== "production")
  );

  // Garantir que secao ativa e valida para esta plataforma
  const currentSection = availableSections.find((s) => s.id === activeSection)
    ? activeSection
    : availableSections[0]?.id || "aprendizagem";

  // ─── Calculos compartilhados ────────────────────────────────────────────────

  const startedTemas = useMemo(() => temas.filter((t) => hasTemaBeenSeen(t, temaStats)), [temas, temaStats]);

  // Retencao real
  const retentionDetailed = useMemo(() => calcTrueRetentionDetailed(temas), [temas]);

  // Readiness
  const readinessData = useMemo(
    () => getReadinessData({ temas, simulados, meta, plat, casosProgresso, temaStats }),
    [temas, simulados, meta, plat, casosProgresso, temaStats]
  );

  const growth = useMemo(() => {
    return computeGrowth(learningEvents, {
      window: 30,
      targetRetention: meta.retencaoFSRS || 0.90,
      targetAcerto: (meta.acerto || 85) / 100
    });
  }, [learningEvents, meta]);
  const readinessValidation = useMemo(() => {
    const latestSimulado = simulados[simulados.length - 1] || null;
    return compareReadinessToSimulado(
      createReadinessSnapshot({ score: readinessData.score, plat }),
      latestSimulado || {}
    );
  }, [plat, readinessData.score, simulados]);
  const forecastBacktestSummary = useMemo(() => {
    const records = (meta?.forecastBacktests || []).filter((record) => !record?.plat || record.plat === plat);
    return summarizeForecastBacktests(records);
  }, [meta?.forecastBacktests, plat]);

  useEffect(() => {
    if (readinessData.score == null) return;
    const key = `${todayStr()}:${plat}:${readinessData.score}:${readinessValidation.status}:${readinessValidation.absoluteError ?? "na"}`;
    if (lastReadinessTelemetryRef.current === key) return;
    safeTrackEvent("readiness_snapshot", { plat, score: readinessData.score, confidence: readinessData.confidence || "coletando" }, { state: { meta } });
    if (readinessValidation.status !== "coletando") {
      safeTrackEvent(
        "readiness_vs_simulado_result",
        { plat, status: readinessValidation.status, absolute_error: readinessValidation.absoluteError },
        { state: { meta } }
      );
    }
    lastReadinessTelemetryRef.current = key;
  }, [meta, plat, readinessData.confidence, readinessData.score, readinessValidation.absoluteError, readinessValidation.status]);

  // Sparkline de prontidao (kept for potential future use)
  // eslint-disable-next-line no-unused-vars
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

  const calibrationMetric = useMemo(() => {
    return evaluateMetric("confidenceCalibration", calibrationData?.score ?? null, {
      n: calibrationData?.n || 0,
    });
  }, [calibrationData]);

  const calibrationMentorPhrase = useMemo(() => {
    if (!calibrationData || calibrationData.status !== "ok") {
      return calibrationData?.action || calibrationMetric?.action || "Continue registrando previsao antes das revisoes.";
    }
    const key = `calibracao_${calibrationData.tendencia}`;
    const phraseObj = getMentorPhrase(key, { userName: userName || "Estudante" }, [], plat);
    return calibrationData.action || phraseObj.text;
  }, [calibrationData, calibrationMetric, userName, plat]);

  // Analise de Desempenho (migrada do Dashboard)
  const doneForDiag = useMemo(() => {
    return temas
      .flatMap((t) => STEPS.map((s) => ({
        ...t.rev?.[s.key],
        esp: t.esp, step: s, temaNome: t.nome, temaId: t.id,
      })))
      .filter((r) => r.done && !r.skipped && r.skipReason !== "dominio_previo" && !r.skippeadoPorDominio);
  }, [temas]);

  const totalSessions = useMemo(() => {
    return temas
      .flatMap((t) => [...STEPS.map((s) => t.rev?.[s.key]), t.rev?.manutencao])
      .filter((r) => r?.done === true && !r.skipped && r.skipReason !== "dominio_previo" && !r.skippeadoPorDominio)
      .length;
  }, [temas]);

  const diagDesempenho = useMemo(
    () => getMentorDiagnosis(userName, temas, doneForDiag, temaStats, plat, meta),
    [userName, temas, doneForDiag, temaStats, plat, meta]
  );

  const nonCriticalInsights = useMemo(() => {
    if (!diagDesempenho?.insights) return [];
    return diagDesempenho.insights.filter(
      (ins) => ins.type !== "alerta" && ins.type !== "vies_excesso" && ins.type !== "vies_inseguranca"
    );
  }, [diagDesempenho]);

  const handleInsightActionStats = (action) => {
    if (!action) return;
    if (action.type === "setView" && setView) setView(action.view);
    else if (setView) setView("crono");
  };

  // Equilíbrio de Ritmo para secao Provas
  const ritmoPaceStats = useMemo(() => {
    if (!meta?.metaQuestoesDia) return null;
    const firstD0 = startedTemas.length > 0
      ? [...startedTemas].sort((a, b) => (a.d0 || "").localeCompare(b.d0 || ""))[0].d0
      : null;
    return saldoRitmo(temas, meta, firstD0);
  }, [temas, meta, startedTemas]);

  // Erros avancados de simulados para secao Provas
  const statsErrosSimulados = useMemo(() => {
    const allErrors = simulados.flatMap((s) => s.questoesErradas || []);
    const porTipo = {};
    const porArea = {};
    const porTema = {};
    allErrors.forEach((e) => {
      const t = e.tipoErro || "lacuna";
      porTipo[t] = (porTipo[t] || 0) + 1;
      const area = e.esp || "Geral";
      porArea[area] = (porArea[area] || 0) + 1;
      if (e.tema) porTema[e.tema] = (porTema[e.tema] || 0) + 1;
    });
    return {
      total: allErrors.length,
      corrigidos: allErrors.filter((e) => e.corrigidaD7 === true).length,
      cards: allErrors.filter((e) => e.virouCard).length,
      porTipo: Object.entries(porTipo).sort((a, b) => b[1] - a[1]).slice(0, 6),
      porArea: Object.entries(porArea).sort((a, b) => b[1] - a[1]).slice(0, 6),
      temasRecorrentes: Object.entries(porTema)
        .filter(([, v]) => v > 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    };
  }, [simulados]);

  // ENAMED Intel para o Mapa de Prioridades (somente res)
  const enamedIntelData = useMemo(() => {
    if (plat !== "res") return null;
    return getEnamedIntel(temas);
  }, [plat, temas]);

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

  const readinessSample = useMemo(() => {
    const totalQuestions = personalStats?.totalQuestoes || 0;
    const areasWithData = (personalStats?.espStats || []).filter((area) => area.questoes > 0 || area.acc != null).length;
    const activeDays = doneDays.size;
    const hasMinimum =
      totalQuestions >= 300
      && areasWithData >= 3
      && simulados.length >= 1
      && activeDays >= 14;
    const missing = [];
    if (totalQuestions < 300) missing.push(`${300 - totalQuestions} questoes`);
    if (areasWithData < 3) missing.push(`${3 - areasWithData} areas com dados`);
    if (simulados.length < 1) missing.push("1 simulado diagnostico");
    if (activeDays < 14) missing.push(`${14 - activeDays} dias de uso`);
    return { totalQuestions, areasWithData, activeDays, hasMinimum, missing };
  }, [doneDays, personalStats, simulados.length]);

  // Nova previsao de desempenho — ancorada em simulados/provas (v1)
  const previsaoForecast = useMemo(() => {
    const acertoGeral = personalStats?.espStats?.length
      ? Math.round(personalStats.espStats.filter(e => e.acc != null).reduce((s, e) => s + e.acc, 0) /
        (personalStats.espStats.filter(e => e.acc != null).length || 1))
      : null;
    const cobertura = temas.length > 0
      ? Math.round((startedTemas.length / temas.length) * 100)
      : null;
    const indiceDescuido = (() => {
      const allErros = simulados.flatMap(s => s.questoesErradas || []);
      const descuidos = allErros.filter(e => e.tipoErro === "descuido" || e.tipoErro === "distracao").length;
      return allErros.length > 0 ? Math.round((descuidos / allErros.length) * 100) : null;
    })();

    return calcPrevisaoDesempenho({
      simulados,
      acertoQuestoes: acertoGeral,
      cobertura,
      saldoRitmoNorm: readinessData?.saldoRitmoNorm ?? null,
      indiceDescuido,
    });
  }, [simulados, personalStats, startedTemas.length, temas.length, readinessData]);

  // Métricas de metas para o card de progresso
  const metasProgresso = useMemo(() => {
    const metaDia = meta?.metaQuestoesDia || meta?.metaDiaria || 0;
    const daysToProva = meta?.dataProva
      ? diffDays(todayStr(), meta.dataProva)
      : null;
    const metaTotal = meta?.metaQuestoesTotal || (
      metaDia > 0 && daysToProva != null && daysToProva > 0
        ? metaDia * daysToProva
        : 0
    );
    const totalFeitas = personalStats?.totalQuestoes || 0;
    const progresso = metaTotal > 0 ? Math.min(100, Math.round((totalFeitas / metaTotal) * 100)) : null;
    const ritmoNecessario = (daysToProva != null && daysToProva > 0 && metaTotal > totalFeitas)
      ? Math.ceil((metaTotal - totalFeitas) / daysToProva)
      : null;
    return { metaDia, metaTotal, totalFeitas, progresso, daysToProva, ritmoNecessario };
  }, [meta, personalStats]);

  // Raciocinio clinico — dados existentes sem calculo duplicado
  // P4-A: usa fonte canonica de clinicalReasoningScoring.js
  const clinicalCases = useMemo(() => {
    const customCases = Array.isArray(meta?.clinicalCustomCases) ? meta.clinicalCustomCases : [];
    return [...CLINICAL_CASES_INDEX, ...customCases];
  }, [meta?.clinicalCustomCases]);

  const raciocinioStats = useMemo(() => {
    const detailed = calculateClinicalReasoningScoreDetailed(casosProgresso);
    const casosFeitos = detailed.byCase.filter((c) => c.vistos > 0).length;
    const competencia = summarizeClinicalCompetence({
      casos: clinicalCases,
      casosProgresso,
      learningEvents,
    });
    return {
      casosFeitos,
      score: detailed.score,
      n: detailed.n,
      collecting: detailed.collecting,
      confident: detailed.confident,
      competencia,
    };
  }, [casosProgresso, clinicalCases, learningEvents]);
  const clinicalCompetence = raciocinioStats.competencia || {
    scriptsMadurosPorArea: [],
    totalScriptsMaduros: 0,
    errosQueSumiram: [],
  };

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
    confidenceCalibration: evaluateMetric("confidenceCalibration", calibrationData?.score ?? null, { n: calibrationData?.n || 0 }),
    ankiAdherence: evaluateMetric("ankiAdherence", ankiAdherencePct, { days: (meta?.ankiAdesao?.datas || []).length }),
    weeklyConsistency: evaluateMetric("weeklyConsistency", activeLastWeek, { totalDays: 7 }),
    coverageByArea: evaluateMetric("coverageByArea", readinessData.cobertura, { total: temas.length }),
    enamedGap: evaluateMetric("enamedGap", null, { hasAnalise: enamedAnalises.length > 0 }),
  }), [
    retentionDetailed, overdueCount, relearningCount, errorAnalytics,
    readinessData, simulados, raciocinioStats, calibrationData, ankiAdherencePct, meta,
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
      <Card variant="elevated" className="med-animate-in" style={{ padding: 18, background: "linear-gradient(180deg, rgba(16,185,129,.08), rgba(59,130,246,.04)), var(--med-surface-0)" }}>
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-500/20">
            <BarChart3 size={20} />
          </div>
          <div>
            <Badge tone="green">Relatório</Badge>
            <h2 className="mt-2 text-xl font-black tracking-tight text-white">Estatísticas acionáveis</h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-gray-400">
              Aprendizagem, provas, erros e revisões organizados por decisão prática.
            </p>
          </div>
        </div>
      </Card>

      {/* Navegacao */}
      <SectionNav
        sections={availableSections}
        active={currentSection}
        onChange={setActiveSection}
      />

      <MotionPresence>
      <MotionStep stepKey={currentSection} className="space-y-4">
      {/* ── SECAO 7: VALIDACAO DO PREPARO ─────────────────────────────────── */}
      {currentSection === "validacao" && (
        <div className="space-y-4">
          <p className="text-[11px] text-gray-500">Preparo estimado ancorado em simulados/provas. A banda de confianca estreita com mais registros espaçados.</p>

          {/* Novo preparo estimado do plano v1 */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Preparo estimado do plano</p>
                {previsaoForecast.score != null && readinessSample.hasMinimum ? (
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black tabular-nums text-blue-400">{previsaoForecast.score}%</p>
                    <p className="text-[11px] text-gray-500">[{previsaoForecast.bandMin}–{previsaoForecast.bandMax}%]</p>
                  </div>
                ) : (
                  <p className="text-3xl font-black text-gray-500">Coletando</p>
                )}
                <p className="text-[10px] text-gray-600 mt-1">
                  {readinessSample.hasMinimum && previsaoForecast.score != null
                    ? `${previsaoForecast.amostra}`
                    : `Complete: ${readinessSample.missing.join(", ")}.`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                  previsaoForecast.confidence === "alta" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  previsaoForecast.confidence === "media" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}>
                  {previsaoForecast.confidence === "alta" ? "Alta confiança" :
                   previsaoForecast.confidence === "media" ? "Moderada" :
                   previsaoForecast.nSimulados === 0 ? "Sem simulados" : "Baixa confiança"}
                </span>
                <p className="text-[9px] text-gray-600 mt-1">{previsaoForecast.nSimulados} simulado{previsaoForecast.nSimulados !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Barra de banda de confiança */}
            {previsaoForecast.score != null && (
              <div className="space-y-1">
                <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                     className="absolute h-full bg-blue-500/30 rounded-full"
                     style={{ left: `${previsaoForecast.bandMin}%`, width: `${previsaoForecast.bandMax - previsaoForecast.bandMin}%` }}
                  />
                  <div
                    className="absolute h-full w-0.5 bg-blue-400"
                    style={{ left: `${previsaoForecast.score}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-gray-600">
                  <span>0%</span>
                  <span>Intervalo: ±{previsaoForecast.banda}pts</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            <p className="text-[10px] text-gray-500 border-t border-white/5 pt-2">
              {CONFIDENCE_LABEL[previsaoForecast.confidence] || ""}. Âncora: simulados/provas (45%) + questões por área (25%) + cobertura (15%) + ritmo (10%) + calibração (5%).
            </p>
          </div>

          {/* Gráfico de evolução dos simulados como proxy do preparo estimado */}
          {simulados.length >= 2 && (
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-300">Evolução dos simulados</p>
              <div className="flex items-end gap-1.5 h-16">
                {simulados.map((s, i) => {
                  const metaAcerto = s.metaAcerto || 0;
                  const hitsMeta = metaAcerto > 0 && s.pct >= metaAcerto;
                  const col = hitsMeta ? "bg-blue-700" : s.pct >= 80 ? "bg-emerald-500" : s.pct >= 65 ? "bg-blue-500" : s.pct >= 50 ? "bg-amber-500" : "bg-red-400";
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-gray-600 tabular-nums">{s.pct}%</span>
                      <div className={`w-full rounded-t-sm ${col} opacity-80`} style={{ height: `${Math.max(4, (s.pct / 100) * 44)}px` }} title={`${s.nome || "Simulado"} · ${s.pct}%`} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-gray-700">
                <span>1º simulado</span>
                <span>mais recente</span>
              </div>
            </div>
          )}

          {/* Validação do preparo estimado vs resultado real */}
          <div className="rounded-2xl border border-white/5 bg-[#111113] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Validacao do preparo estimado vs resultado real</p>
            <p className="mt-1 text-[12px] text-gray-300">
              {readinessValidation.status === "coletando"
                ? "Registre simulados para comparar o preparo estimado com o resultado real."
                : readinessValidation.status === "alinhado"
                ? `Preparo estimado alinhado ao resultado real (erro ${readinessValidation.absoluteError} pts).`
                : readinessValidation.status === "superestimado"
                ? `Preparo estimado acima do resultado real — erro de ${readinessValidation.absoluteError} pts. Aumente a frequência de simulados.`
                : `Preparo estimado abaixo do resultado real — erro de ${readinessValidation.absoluteError} pts. Bom sinal de crescimento.`}
            </p>
            <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Backtest do forecast</p>
                <Badge tone={
                  forecastBacktestSummary.status === "alinhado" ? "green" :
                  forecastBacktestSummary.status === "observando" ? "blue" :
                  forecastBacktestSummary.status === "recalibrar" ? "amber" :
                  "neutral"
                }>
                  {forecastBacktestSummary.n} amostra{forecastBacktestSummary.n === 1 ? "" : "s"}
                </Badge>
              </div>
              <p className="mt-2 text-[12px] text-gray-300">
                {forecastBacktestSummary.n === 0
                  ? "Ainda sem backtest persistido. O proximo simulado registrado vai comparar o forecast anterior com o resultado real."
                  : `Erro medio absoluto: ${forecastBacktestSummary.meanAbsoluteError} pts. ${
                    forecastBacktestSummary.status === "alinhado"
                      ? "Modelo alinhado para uso como sinal interno."
                      : forecastBacktestSummary.status === "observando"
                        ? "Modelo em observacao; use a banda de confianca."
                        : "Modelo precisa de mais simulados antes de orientar decisoes fortes."
                  }`}
              </p>
              {forecastBacktestSummary.latest && (
                <p className="mt-1 text-[10px] text-gray-500">
                  Ultimo: estimado {forecastBacktestSummary.latest.estimated}% vs real {forecastBacktestSummary.latest.actual}%.
                </p>
              )}
            </div>
          </div>

          {/* KPIs adicionais */}
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
            <div className="bg-blue-950/20 border border-blue-500/10 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1">Proximo passo recomendado</p>
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
              { label: "Temas totais", value: temas.length, color: "text-blue-300" },
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

          {/* Card de metas com progresso */}
          {(metasProgresso.metaDia > 0 || metasProgresso.metaTotal > 0) && (
            <div className="bg-[#111113] border border-blue-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-black uppercase tracking-wider text-gray-200">Progresso em relação às metas</h3>
                {metasProgresso.daysToProva != null && metasProgresso.daysToProva > 0 && (
                  <span className="text-[10px] font-bold text-gray-500">{metasProgresso.daysToProva}d até a prova</span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
                  <p className="text-gray-500 font-bold uppercase text-[9px]">Meta diária</p>
                  <p className="text-white font-black text-lg">{metasProgresso.metaDia > 0 ? `${metasProgresso.metaDia}/dia` : "—"}</p>
                </div>
                <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
                  <p className="text-gray-500 font-bold uppercase text-[9px]">Total feitas</p>
                  <p className="text-blue-400 font-black text-lg">{metasProgresso.totalFeitas}</p>
                </div>
                <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
                  <p className="text-gray-500 font-bold uppercase text-[9px]">Meta total</p>
                  <p className="text-gray-200 font-black text-lg">{metasProgresso.metaTotal > 0 ? metasProgresso.metaTotal : "—"}</p>
                </div>
                {metasProgresso.ritmoNecessario != null && (
                  <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
                    <p className="text-gray-500 font-bold uppercase text-[9px]">Ritmo necessário</p>
                    <p className={`font-black text-lg ${metasProgresso.ritmoNecessario > (metasProgresso.metaDia || 0) ? "text-amber-400" : "text-emerald-400"}`}>
                      {metasProgresso.ritmoNecessario}/dia
                    </p>
                  </div>
                )}
                {metasProgresso.progresso != null && (
                  <div className="sm:col-span-2 rounded-xl bg-black/20 border border-white/5 px-3 py-2">
                    <p className="text-gray-500 font-bold uppercase text-[9px] mb-1">Progresso total</p>
                    <div className="flex items-center gap-2">
                      <MotionProgressBar value={metasProgresso.progresso} className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden" />
                      <span className="text-white font-black text-[12px]">{metasProgresso.progresso}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cobertura */}
          <MetricCard
            label={metricsEvaluated.coverageByArea.label}
            value={formatMetricValue("coverageByArea", metricsEvaluated.coverageByArea.value)}
            status={metricsEvaluated.coverageByArea.status}
            description={metricsEvaluated.coverageByArea.description}
            emptyState={metricsEvaluated.coverageByArea.emptyState}
            action={metricsEvaluated.coverageByArea.action}
            className="sm:col-span-2"
            pastDelta={growth.masteryByAreaDelta}
            goalDelta={growth.vsGoal.acerto}
            onActionClick={() => setView && setView("crono")}
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
                      <span className="text-[9.5px] font-mono text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity select-none">{d.count}</span>
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
                    <MotionProgressBar
                      value={e.progress}
                      className="h-2 bg-black rounded-full overflow-hidden border border-white/5"
                      barClassName="h-full rounded-full"
                      barStyle={{ background: espC + "cc" }}
                    />
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
            {calibrationData.status !== "ok" ? (
              <div className="bg-black/25 border border-white/5 p-4 rounded-xl text-center space-y-1.5">
                <p className="text-[11px] text-gray-400">
                  {calibrationData.status === "coletando"
                    ? `Coletando dados — faltam ${Math.max(0, (calibrationData.minPreview || 5) - calibrationData.n)} sessoes para o primeiro sinal.`
                    : `Sinal inicial — faltam ${Math.max(0, (calibrationData.minRequired || 10) - calibrationData.n)} sessoes para analise confiavel.`}
                </p>
                <MotionProgressBar
                  value={Math.min(100, ((calibrationData?.n || 0) / (calibrationData?.minRequired || 10)) * 100)}
                  className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden"
                  barClassName="bg-blue-600 h-full"
                />
                <p className="text-[10px] text-blue-300/80 leading-relaxed">{calibrationMentorPhrase}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Precisao de Previsao</span>
                  <span className="text-3xl font-black font-mono text-blue-400">{calibrationData.score ?? calibrationData.precisao}%</span>
                  <span className="text-[9px] text-gray-600 mt-1">Proximidade com o resultado real</span>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Vies de Confianca</span>
                  <span className={`text-3xl font-black font-mono ${(calibrationData.biasPct ?? calibrationData.vies) > 0 ? "text-amber-400" : (calibrationData.biasPct ?? calibrationData.vies) < 0 ? "text-blue-400" : "text-emerald-400"}`}>
                    {(calibrationData.biasPct ?? calibrationData.vies) > 0 ? `+${calibrationData.biasPct ?? calibrationData.vies}%` : `${calibrationData.biasPct ?? calibrationData.vies}%`}
                  </span>
                  <span className="text-[9px] text-gray-600 mt-1">
                    {(calibrationData.biasPct ?? calibrationData.vies) > 0 ? "Excesso de confianca" : (calibrationData.biasPct ?? calibrationData.vies) < 0 ? "Subestimacao" : "Alinhado"}
                  </span>
                </div>
                <div className="bg-blue-950/20 border border-blue-500/10 rounded-xl p-4 flex flex-col justify-center text-left">
                  <span className="text-[9.5px] font-bold text-blue-300 uppercase tracking-wider block mb-1">{metricsEvaluated.confidenceCalibration.confident ? "Acao recomendada" : "Sinal em coleta"}</span>
                  <p className="text-[11.5px] text-gray-400 leading-relaxed mt-0.5 italic">"{calibrationMentorPhrase}"</p>
                </div>
              </div>
            )}
          </div>

          {/* Analise de Desempenho (migrada do Dashboard) */}
          <div className="bg-[#0d0d10] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute -left-12 -bottom-12 w-28 h-28 rounded-full bg-cyan-600/5 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <BarChart3 size={16} className="text-blue-400" />
                <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-wider mr-2">Análise de Desempenho</h3>
                <span className="text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  {totalSessions < 7 ? "Fase 1: Calibração" : totalSessions < 30 ? "Fase 2: Ritmo" : "Fase 3: Consolidação"}
                </span>
              </div>
              {diagDesempenho?.projection && (
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Projeção: {diagDesempenho.projection.score}%
                </span>
              )}
            </div>

            {diagDesempenho?.status === "calibracao" ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl flex-col sm:flex-row">
                  <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                      Dados insuficientes para análise completa. Conclua mais sessões para liberar as métricas avançadas.
                    </p>
                    <div className="space-y-1">
                      <MotionProgressBar
                        value={Math.min(100, (totalSessions / 7) * 100)}
                        className="bg-white/5 rounded-full h-2 overflow-hidden border border-white/5"
                      />
                      <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-wider font-mono">
                        <span>Progresso de Calibração</span>
                        <span>{totalSessions} de 7 sessões concluídas</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-wide">
                      <Unlock size={11} className="shrink-0" /> A partir de 7 sessões
                    </span>
                    <p className="text-[10.5px] text-gray-400 leading-relaxed">
                      Libera análise de horário ótimo, fraquezas por especialidade e detecção de viés de confiança.
                    </p>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-sky-400 uppercase tracking-wide">
                      <Unlock size={11} className="shrink-0" /> A partir de 30 sessões
                    </span>
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
                              onClick={() => handleInsightActionStats(insight.action)}
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
                {diagDesempenho?.projection && (
                  <p className="text-[11px] text-gray-500 italic mt-1 pl-1">
                    {diagDesempenho.projection.text}
                  </p>
                )}
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

              <ErrorActionCenter onNavigate={setView} />
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
            pastDelta={growth.masteryByAreaDelta}
            goalDelta={growth.vsGoal.acerto}
            onActionClick={() => setView && setView("sims")}
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


      {currentSection === "aprendizagem" && (
        <>
          {/* Preparo estimado do plano */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-cyan-400" />
                <h3 className="text-[12px] font-black uppercase tracking-wider text-gray-200">Preparo estimado do plano</h3>
              </div>
              {readinessData.score != null && (
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                  readinessData.score >= 75 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : readinessData.score >= 60 ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}>
                  {readinessData.score}/100
                </span>
              )}
            </div>
            {!readinessSample.hasMinimum ? (
              <div className="space-y-1">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Libera apos: <strong className="text-gray-200">{readinessSample.missing.join(", ")}</strong>.
                </p>
                <p className="text-[10px] text-gray-600 italic">Volume minimo e simulado diagnostico necessarios.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {readinessData.range && (
                  <p className="text-[11px] text-gray-300">
                    Intervalo estimado:{" "}
                    <strong className="text-white">{readinessData.range[0]}% &ndash; {readinessData.range[1]}%</strong>
                  </p>
                )}
                {readinessData.tendenciaSim != null && (
                  <p className={`text-[11px] font-bold ${readinessData.tendenciaSim > 0 ? "text-emerald-400" : readinessData.tendenciaSim < 0 ? "text-red-400" : "text-gray-500"}`}>
                    Tendencia simulados:{" "}
                    {readinessData.tendenciaSim > 0 ? "melhorando" : readinessData.tendenciaSim < 0 ? "caindo" : "estavel"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Equilibrio de Ritmo */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-emerald-400" />
              <h3 className="text-[12px] font-black uppercase tracking-wider text-gray-200">Equilibrio de Ritmo</h3>
            </div>
            {ritmoPaceStats ? (
              <>
                <p className={`text-3xl font-black tabular-nums ${ritmoPaceStats.saldo >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                  {ritmoPaceStats.saldo >= 0 ? `+${ritmoPaceStats.saldo}` : ritmoPaceStats.saldo}
                </p>
                <p className="text-[10.5px] text-gray-400">
                  {ritmoPaceStats.saldo >= 0
                    ? "Adiantado nas metas de questoes."
                    : `${Math.abs(ritmoPaceStats.saldo)} questoes atras do planejado.`}
                </p>
              </>
            ) : (
              <p className="text-[11px] text-gray-500 italic">Configure a meta diaria de questoes nos Ajustes.</p>
            )}
          </div>
        </>
      )}

      {currentSection === "provas" && (
        <>
          {/* Erros avancados de simulados */}
          {statsErrosSimulados.total > 0 && (
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-red-400" />
                  <h3 className="text-[12px] font-black uppercase tracking-wider text-gray-200">Erros de Simulados</h3>
                </div>
                <div className="flex gap-3 text-[10px]">
                  <span className="text-red-400 font-bold">{statsErrosSimulados.total} erros</span>
                  <span className="text-emerald-400 font-bold">{statsErrosSimulados.corrigidos} D7 corrigidos</span>
                </div>
              </div>
              {statsErrosSimulados.porTipo.length > 0 && (
                <div>
                  <p className="text-[9.5px] font-bold text-gray-500 uppercase tracking-wider mb-2">Por tipo</p>
                  <div className="space-y-1.5">
                    {statsErrosSimulados.porTipo.map(([tipo, count]) => {
                      const pct = Math.round((count / statsErrosSimulados.total) * 100);
                      const lbs = { lacuna: "Lacuna", raciocinio: "Raciocinio", distractor: "Distrator", descuido: "Descuido", nao_visto: "Nao visto", interpretacao: "Interpretacao", conteudo: "Conteudo", memoria: "Memoria" };
                      return (
                        <div key={tipo} className="flex items-center gap-2">
                          <div className="w-20 shrink-0 text-[9.5px] text-gray-400 truncate">{lbs[tipo] || tipo}</div>
                          <MotionProgressBar value={pct} className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden" barClassName="bg-red-500/70 h-full" />
                          <span className="text-[9px] text-gray-500 w-7 text-right tabular-nums">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {statsErrosSimulados.porArea.length > 0 && (
                <div>
                  <p className="text-[9.5px] font-bold text-gray-500 uppercase tracking-wider mb-2">Por area</p>
                  <div className="space-y-1.5">
                    {statsErrosSimulados.porArea.map(([area, count]) => {
                      const pct = Math.round((count / statsErrosSimulados.total) * 100);
                      return (
                        <div key={area} className="flex items-center gap-2">
                          <div className="w-20 shrink-0 text-[9.5px] text-gray-400 truncate">{area}</div>
                          <MotionProgressBar value={pct} className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden" barClassName="bg-amber-500/60 h-full" />
                          <span className="text-[9px] text-gray-500 w-7 text-right tabular-nums">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {statsErrosSimulados.temasRecorrentes.length > 0 && (
                <div>
                  <p className="text-[9.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Temas recorrentes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {statsErrosSimulados.temasRecorrentes.map(([tema, count]) => (
                      <span key={tema} className="text-[9px] bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded-lg font-bold">
                        {tema} ({count}x)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mapa de Prioridades ENAMED — somente Residencia */}
          {plat === "res" && enamedIntelData && (
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 size={15} className="text-blue-400" />
                  <h3 className="text-[12px] font-black uppercase tracking-wider text-gray-200">Mapa de Prioridades ENAMED</h3>
                </div>
                <span className="text-[10px] text-gray-500">Incidencia x Dominio</span>
              </div>
              <p className="text-[11px] text-gray-500 -mt-2">
                Areas por gap real: peso ENAMED ponderado pelo dominio atual.
                Clique nos temas quentes para ir ao Plano e comecar a estudar.
              </p>
              <div className="space-y-3">
                {enamedIntelData.lista.map((item) => {
                  const scMap = {
                    critica: { border: "border-red-500/20", badge: "bg-red-500/10 text-red-400 border-red-500/20", label: "Critica", bar: "bg-red-500" },
                    atencao: { border: "border-amber-500/15", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Atencao", bar: "bg-amber-500" },
                    ok: { border: "border-emerald-500/10", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "OK", bar: "bg-emerald-500" },
                    sem_dados: { border: "border-white/5", badge: "bg-white/5 text-gray-500 border-white/10", label: "Sem dados", bar: "bg-gray-600" },
                  };
                  const sc = scMap[item.status] || scMap.sem_dados;
                  return (
                    <div key={item.area} className={`rounded-2xl border bg-white/[0.015] p-4 space-y-3 ${sc.border}`}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-black text-white">{item.area}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${sc.badge}`}>{sc.label}</span>
                        </div>
                        <div className="flex gap-3 text-[10px] text-gray-500">
                          <span>Dom: <strong className="text-gray-300">{item.retencao != null ? `${item.retencao}%` : "---"}</strong></span>
                          <span>Cob: <strong className="text-gray-300">{item.cobertura}%</strong></span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] text-gray-600 uppercase font-mono mb-0.5">
                          <span>Gap</span><span>{item.gap}%</span>
                        </div>
                        <MotionProgressBar value={item.gap} className="bg-white/5 rounded-full h-1.5 overflow-hidden" barClassName={`h-full rounded-full ${sc.bar}`} />
                        <p className="text-[9px] text-gray-600 italic mt-0.5">{item.motivo}</p>
                      </div>
                      {item.hotTopicsPendentes.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Estudar a seguir:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {item.hotTopicsPendentes.map((hot) => (
                              <button
                                key={hot.subarea}
                                type="button"
                                onClick={() => setView && setView("crono")}
                                className="flex items-center gap-1 text-[9.5px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                                title={`~${hot.pct}% das questoes ENAMED de ${item.area}`}
                              >
                                {hot.subarea}
                                <span className="text-blue-400/60 text-[8px]">~{hot.pct}%</span>
                                <ChevronRight size={10} className="text-blue-400/50" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.hotTopicsCobertos.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.hotTopicsCobertos.map((hot) => (
                            <span key={hot.subarea} className="flex items-center gap-1 text-[9px] text-emerald-500/70 border border-emerald-500/10 px-1.5 py-0.5 rounded">
                              <CheckCircle size={9} /> {hot.subarea}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── SECAO 5: REVISOES ──────────────────────────────────────────────── */}
      {currentSection === "revisoes" && (
        <div className="space-y-4">
          <p className="text-[11px] text-gray-500">Retencao longa, vencidas, carga futura e aderencia Anki.</p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <MetricCard
              label={metricsEvaluated.trueRetention.label}
              value={formatMetricValue("trueRetention", metricsEvaluated.trueRetention.value)}
              status={metricsEvaluated.trueRetention.status}
              description={metricsEvaluated.trueRetention.description}
              emptyState={metricsEvaluated.trueRetention.emptyState}
              action={metricsEvaluated.trueRetention.action}
              pastDelta={growth.retentionDelta}
              goalDelta={growth.vsGoal.retention}
              onActionClick={() => setView && setView("dash")}
            />
            <MetricCard
              label={metricsEvaluated.overdueReviews.label}
              value={formatMetricValue("overdueReviews", metricsEvaluated.overdueReviews.value)}
              status={metricsEvaluated.overdueReviews.status}
              description="Revisoes vencidas que devem entrar antes de tema novo."
              emptyState="Nenhuma revisao vencida"
              action={metricsEvaluated.overdueReviews.action}
            />
            <MetricCard
              label={metricsEvaluated.relearningCount.label}
              value={formatMetricValue("relearningCount", metricsEvaluated.relearningCount.value)}
              status={metricsEvaluated.relearningCount.status}
              description="Temas que precisam de reancoragem."
              emptyState="Nenhum tema em relearning"
              action={metricsEvaluated.relearningCount.action}
            />
            <MetricCard
              label={metricsEvaluated.ankiAdherence.label}
              value={formatMetricValue("ankiAdherence", metricsEvaluated.ankiAdherence.value)}
              status={metricsEvaluated.ankiAdherence.status}
              description="Dias com Anki registrado nos ultimos 7."
              emptyState={metricsEvaluated.ankiAdherence.emptyState}
              action={metricsEvaluated.ankiAdherence.action}
            />
          </div>

          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-3 shadow-lg">
            <div>
              <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Carga FSRS dos proximos 14 dias</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Projecao operacional de revisoes reais ja agendadas.</p>
            </div>
            <div className="w-full overflow-x-auto select-none pt-2">
              <div className="flex items-end justify-between gap-2.5 min-w-[500px] h-32 border-b border-white/5 pb-2 px-2">
                {forecastData.map((d, idx) => {
                  const maxCount = Math.max(...forecastData.map((x) => x.count), 1);
                  const h = (d.count / maxCount) * 80;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <span className="text-[9.5px] font-mono text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity select-none">{d.count}</span>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Scripts maduros por área</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">Casos com score alto e reexposição suficiente.</p>
                </div>
                <p className="text-2xl font-black text-emerald-400 tabular-nums">{clinicalCompetence.totalScriptsMaduros}</p>
              </div>
              {clinicalCompetence.scriptsMadurosPorArea.some((row) => row.maduros > 0) ? (
                <div className="space-y-2">
                  {clinicalCompetence.scriptsMadurosPorArea.filter((row) => row.maduros > 0).slice(0, 5).map((row) => (
                    <div key={row.area} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-gray-300 truncate">{row.area}</span>
                        <span className="text-[10px] font-black text-emerald-300 tabular-nums">{row.maduros}/{row.total}</span>
                      </div>
                      <MotionProgressBar value={row.pct} className="h-1.5 rounded-full bg-white/5 overflow-hidden" barClassName="h-full rounded-full bg-emerald-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Ainda nenhum script maduro. Reexponha casos já vistos até estabilizar acima de 80%.
                </p>
              )}
            </div>

            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Erros que sumiram</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">Padrões que apareceram antes e não reapareceram na reexposição madura.</p>
                </div>
                <p className="text-2xl font-black text-blue-300 tabular-nums">{clinicalCompetence.errosQueSumiram.length}</p>
              </div>
              {clinicalCompetence.errosQueSumiram.length > 0 ? (
                <div className="space-y-2">
                  {clinicalCompetence.errosQueSumiram.map((item) => (
                    <div key={item.key} className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-3">
                      <p className="text-[11px] font-black text-blue-200">{item.label}</p>
                      <p className="mt-0.5 text-[10px] text-gray-500">{item.script} · {item.area}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Complete uma reexposição com acerto alto após um erro para registrar a competência recuperada.
                </p>
              )}
            </div>
          </div>

          <div className="bg-purple-950/10 border border-purple-500/10 rounded-2xl p-5 flex items-start gap-3">
            <Brain size={16} className="text-purple-300 mt-0.5 shrink-0" />
            <div>
              <p className="text-[12px] font-bold text-purple-300">Racioc\u00ednio Cl\u00ednico integrado \u00e0 curva de revis\u00e3o (P4)</p>
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
              <p className="text-2xl font-black text-purple-300 tabular-nums">{sessionReflections.length}</p>
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
      </MotionStep>
      </MotionPresence>

      {/* ── SECAO 7: SISTEMA ─────────────────────────────────────────────────── */}
    </div>
  );
}
