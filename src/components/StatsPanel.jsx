// src/components/StatsPanel.jsx
import React, { useMemo, lazy, Suspense } from "react";
import { BarChart3, Flame } from "lucide-react";
import { useStore } from "../core/store";
import { STEPS, ESP_COLORS, todayStr, addDays, fmtDate } from "../core/fsrs";
import { calcCalibration } from "../core/calibration";
import { getMentorPhrase } from "../core/mentor";
import { getReadinessData } from "../core/readiness";
import { ERROR_TYPE_LABEL, dominantErrorType, summarizeErrors } from "../core/errorTaxonomy";
import EnamedMapa from "./EnamedMapa";
import AdvancedSection from "./AdvancedSection";
import LaunchChecklistPanel from "./LaunchChecklistPanel";

const EnamedProvaAnalyzer = lazy(() => import("./EnamedProvaAnalyzer"));
const WeeklyReview = lazy(() => import("./WeeklyReview"));
const DataSafetyPanel = lazy(() => import("./DataSafetyPanel"));

export default function StatsPanel({ setView }) {
  const { plat, temaStats, userName, meta } = useStore();
  const temas = useStore((s) => s[plat]?.temas || []);
  const simulados = useStore((s) => s[plat]?.simulados || []);
  const weeklyReviews = useStore((s) => s.weeklyReviews || []);

  const personalStats = useMemo(() => {
    const startedTemas = temas.filter(t => !t.unstarted);
    if (!startedTemas.length) return null;
    const byEsp = {};
    let totalQuestoes = 0, totalDoneSteps = 0;
    startedTemas.forEach(t => {
      if (!byEsp[t.esp]) byEsp[t.esp] = { questoes: 0, acertos: [], doneSteps: 0, total: 0 };
      STEPS.forEach(s => {
        const r = t.rev[s.key];
        byEsp[t.esp].total++;
        if (r.done) {
          byEsp[t.esp].doneSteps++;
          totalDoneSteps++;
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
    const withAcc = espStats.filter(e => e.acc != null);
    const bestEsp  = withAcc.length ? [...withAcc].sort((a, b) => b.acc - a.acc)[0]  : null;
    const worstEsp = withAcc.length ? [...withAcc].sort((a, b) => a.acc - b.acc)[0]  : null;
    const allAcertos = startedTemas.flatMap(t => STEPS.map(s => t.rev[s.key])).filter(r => r.done && r.acerto != null);
    const overallAcc = allAcertos.length ? Math.round(allAcertos.reduce((a, r) => a + r.acerto, 0) / allAcertos.length * 100) : null;
    const totalConcluidos = startedTemas.filter(t => STEPS.every(s => t.rev[s.key].done)).length;
    return { espStats, totalQuestoes, totalDoneSteps, bestEsp, worstEsp, overallAcc, totalConcluidos };
  }, [temas]);

  // 12-Week Heatmap generation
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    // Go back to the Sunday of 11 weeks ago (total 12 weeks = 84 days)
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - 83);
    const dayOfWeek = startDay.getDay();
    startDay.setDate(startDay.getDate() - dayOfWeek); // Adjust to Sunday

    for (let i = 0; i < 84; i++) {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, []);

  const doneDays = useMemo(() => {
    const dates = new Set();
    temas.forEach(t => {
      STEPS.forEach(s => {
        const r = t.rev?.[s.key];
        if (r && r.done && r.date) {
          dates.add(r.date);
        }
      });
    });
    Object.values(temaStats || {}).forEach(logs => {
      if (Array.isArray(logs)) {
        logs.forEach(log => {
          if (log.completedAt) {
            dates.add(log.completedAt.slice(0, 10));
          }
        });
      }
    });
    return dates;
  }, [temas, temaStats]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = "";
    for (let i = 0; i < 12; i++) {
      const dayIndex = i * 7;
      const dateStr = heatmapDays[dayIndex];
      if (!dateStr) {
        labels.push("");
        continue;
      }
      const date = new Date(dateStr + "T12:00:00");
      const monthName = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      if (monthName !== lastMonth) {
        labels.push(monthName);
        lastMonth = monthName;
      } else {
        labels.push("");
      }
    }
    return labels;
  }, [heatmapDays]);

  // Chronological Accuracy Trend Data
  const chronologicalAccuracy = useMemo(() => {
    const list = [];
    Object.entries(temaStats || {}).forEach(([temaId, logs]) => {
      if (Array.isArray(logs)) {
        logs.forEach(log => {
          if (log.acerto != null && log.completedAt) {
            list.push({
              completedAt: new Date(log.completedAt),
              acerto: Math.round(log.acerto * 100)
            });
          }
        });
      }
    });
    list.sort((a, b) => a.completedAt - b.completedAt);
    return list;
  }, [temaStats]);

  const svgWidth = 500;
  const svgHeight = 130;
  const pointsInfo = useMemo(() => {
    if (chronologicalAccuracy.length < 2) return { line: "", area: "", pts: [] };
    const len = chronologicalAccuracy.length;
    const startX = 15;
    const endX = svgWidth - 15;
    const bottomY = svgHeight - 10;
    
    const pts = chronologicalAccuracy.map((p, i) => {
      const x = (i / (len - 1)) * (endX - startX) + startX;
      const y = svgHeight - (p.acerto / 100) * (svgHeight - 25) - 15;
      return { x, y, val: p.acerto };
    });
    
    const line = `M ${pts.map(p => `${p.x},${p.y}`).join(" L ")}`;
    const area = `${line} L ${pts[pts.length - 1].x},${bottomY} L ${pts[0].x},${bottomY} Z`;
    
    return { line, area, pts };
  }, [chronologicalAccuracy]);

  // Chronological Redação Competency Trend Data (only for vest)
  const redacaoHistory = useMemo(() => {
    const list = [];
    Object.entries(temaStats || {}).forEach(([temaId, logs]) => {
      if (Array.isArray(logs)) {
        logs.forEach(log => {
          if (log.c1 !== undefined && log.completedAt) {
            list.push({
              completedAt: new Date(log.completedAt),
              c1: log.c1 || 0,
              c2: log.c2 || 0,
              c3: log.c3 || 0,
              c4: log.c4 || 0,
              c5: log.c5 || 0,
            });
          }
        });
      }
    });
    list.sort((a, b) => a.completedAt - b.completedAt);
    return list;
  }, [temaStats]);

  const redacaoPoints = useMemo(() => {
    if (redacaoHistory.length < 2) return { c1: { path: "", pts: [] }, c2: { path: "", pts: [] }, c3: { path: "", pts: [] }, c4: { path: "", pts: [] }, c5: { path: "", pts: [] } };
    const len = redacaoHistory.length;
    const startX = 15;
    const endX = svgWidth - 15;

    const buildPath = (key) => {
      const pts = redacaoHistory.map((p, i) => {
        const x = (i / (len - 1)) * (endX - startX) + startX;
        const val = p[key]; // 0 to 200
        const y = svgHeight - (val / 200) * (svgHeight - 25) - 15;
        return { x, y, val };
      });
      const path = `M ${pts.map(p => `${p.x},${p.y}`).join(" L ")}`;
      return { path, pts };
    };

    return {
      c1: buildPath("c1"),
      c2: buildPath("c2"),
      c3: buildPath("c3"),
      c4: buildPath("c4"),
      c5: buildPath("c5"),
    };
  }, [redacaoHistory]);

  // FSRS Forecast: count number of uncompleted cards scheduled for each of next 14 days
  const forecastData = useMemo(() => {
    const counts = {};
    for (let i = 0; i < 14; i++) {
      const d = addDays(todayStr(), i);
      counts[d] = 0;
    }
    temas.forEach(t => {
      STEPS.forEach(s => {
        const r = t.rev?.[s.key];
        if (r && !r.done && r.date) {
          if (counts[r.date] !== undefined) counts[r.date]++;
        }
      });
    });
    return Object.entries(counts).map(([date, count]) => ({
      date,
      label: fmtDate(date),
      count
    }));
  }, [temas]);

  const calibrationData = useMemo(() => {
    const flatStats = Object.values(temaStats || {}).flat();
    return calcCalibration(flatStats);
  }, [temaStats]);

  const calibrationMentorPhrase = useMemo(() => {
    if (!calibrationData || calibrationData.status === "coletando") {
      const remaining = 5 - (calibrationData?.n || 0);
      return `Ainda estou reunindo dados. Faltam mais ${remaining} ${remaining === 1 ? "revisão" : "revisões"} com previsão preenchida para calibrarmos seu viés.`;
    }
    const key = `calibracao_${calibrationData.tendencia}`;
    const phraseObj = getMentorPhrase(key, { userName: userName || "Estudante" }, [], plat);
    return phraseObj.text;
  }, [calibrationData, userName, plat]);

  const readinessTrend = useMemo(() => {
    const hist = meta.prontidaoHist || [];
    if (hist.length === 0) {
      const state = useStore.getState();
      const simulados = state[plat]?.simulados || [];
      const score = getReadinessData({ temas, simulados, meta, plat }).score || 0;
      return { current: score, delta7: 0, delta30: 0 };
    }
    
    const current = hist[hist.length - 1]?.score || 0;
    
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
  }, [temas, plat, meta]);

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

    const fromSimulados = simulados.flatMap((simulado) =>
      (simulado.questoesErradas || []).map((questao) => ({
        tipoErro: questao.tipoErro,
        acertou: false,
        confianca: questao.confianca,
        tempoExcedido: Boolean(questao.tempoExcedido),
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
  }, [simulados, temas]);

  return (
    <div className="space-y-5 animate-fade-up text-left">
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <BarChart3 size={20} className="text-indigo-400" />
        <h2 className="text-[15px] font-bold text-gray-100">Histórico de Desempenho</h2>
      </div>

      <div className="space-y-5">
        {!temas.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <BarChart3 size={40} className="text-gray-700" />
            <p className="text-[13px] text-gray-500">Adicione temas ao seu banco para ver estatísticas pessoais.</p>
          </div>
        ) : (
          <>
            {plat === "res" && (
              <>
                <EnamedMapa
                  onFocar={() => {
                    if (setView) setView("crono");
                  }}
                />
                <AdvancedSection title="Analise ENAMED detalhada" defaultOpen={false} storageKey="stats-enamed-advanced">
                  <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando análise ENAMED...</div>}>
                    <EnamedProvaAnalyzer />
                  </Suspense>
                </AdvancedSection>
              </>
            )}

            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-3 shadow-lg">
              <div>
                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Padrao de Erros</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Classificacao unificada para reduzir falsa confianca e ajustar o treino.</p>
              </div>
              {errorAnalytics.total === 0 ? (
                <p className="text-[11px] text-gray-500">Sem erros suficientes para padrao dominante.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Dominante</p>
                    <p className="text-sm font-black text-white mt-1">{ERROR_TYPE_LABEL[errorAnalytics.dominant] || errorAnalytics.dominant || "—"}</p>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Alta confianca + erro</p>
                    <p className="text-sm font-black text-amber-300 mt-1">{errorAnalytics.confidenceMismatch}</p>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Erro por tempo</p>
                    <p className="text-sm font-black text-blue-300 mt-1">{errorAnalytics.time}</p>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Erro de raciocinio</p>
                    <p className="text-sm font-black text-red-300 mt-1">{errorAnalytics.reasoning}</p>
                  </div>
                </div>
              )}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { 
                  label: "Preparo estimado",
                  value: `${readinessTrend.current}%`, 
                  color: "text-blue-400",
                  trend: readinessTrend.delta7,
                  trend30: readinessTrend.delta30
                },
                { label: "Temas", value: temas.length, color: "text-indigo-400" },
                { label: "Questões", value: (personalStats?.totalQuestoes || 0).toLocaleString("pt-BR"), color: "text-blue-400" },
                { label: "Ciclos Completos", value: personalStats?.totalConcluidos ?? 0, color: "text-emerald-400" },
                { label: "Acerto Médio", value: personalStats?.overallAcc != null ? `${personalStats.overallAcc}%` : "—",
                  color: personalStats?.overallAcc == null ? "text-gray-500" : personalStats.overallAcc >= 80 ? "text-emerald-400" : personalStats.overallAcc >= 65 ? "text-yellow-400" : "text-red-400" },
              ].map(s => (
                <div key={s.label} className="bg-[#111113] border border-white/5 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between min-h-[92px]">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                      {s.trend !== undefined && (
                        <span className={`text-[9px] font-bold ${s.trend >= 0 ? "text-emerald-400" : "text-red-400"}`} title={`Acumulado de 7d/30d`}>
                          {s.trend >= 0 ? `▲ +${s.trend}%` : `▼ ${s.trend}%`}
                        </span>
                      )}
                    </div>
                  </div>
                  {s.label === "Preparo estimado" && sparklinePath && (
                    <div className="absolute bottom-0 left-0 right-0 h-5 opacity-40 pointer-events-none">
                      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
                        <path d={sparklinePath} fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Heatmap Section */}
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
              <div>
                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Flame size={15} className="text-orange-400" /> Consistência de Estudos (Últimas 12 Semanas)
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Visualize seus dias ativos na plataforma. Cada bloco colorido indica uma sessão finalizada.</p>
              </div>
              
              <div className="w-full overflow-x-auto select-none py-2">
                <div className="min-w-[420px] max-w-lg mx-auto">
                  {/* Months header */}
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
                    {/* Day Labels */}
                    <div className="flex flex-col justify-between text-[9px] text-gray-500 h-28 pr-1 py-1 font-semibold uppercase tracking-wider select-none shrink-0">
                      <span>Dom</span>
                      <span>Qua</span>
                      <span>Sáb</span>
                    </div>

                    {/* Heatmap Grid */}
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

            {/* Calibração Metacognitiva */}
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    🎯 Calibração Metacognitiva
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Mede o alinhamento entre o que você acha que vai acertar e seu acerto real.</p>
                </div>
                {calibrationData.status === "ok" && (
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                    calibrationData.tendencia === "calibrado" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : calibrationData.tendencia === "subestima"
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {calibrationData.tendencia === "calibrado" ? "Calibrado" : calibrationData.tendencia === "subestima" ? "Subestima" : "Excesso de Confiança"}
                  </span>
                )}
              </div>

              {calibrationData.status === "coletando" ? (
                <div className="bg-black/25 border border-white/5 p-4 rounded-xl text-center space-y-1.5">
                  <p className="text-[11px] text-gray-400">
                    💡 <strong>Coletando dados:</strong> Faltam {5 - calibrationData.n} sessões com previsões de acerto informadas para gerar sua calibração.
                  </p>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all" style={{ width: `${(calibrationData.n / 5) * 100}%` }} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Precisão de Previsão</span>
                    <span className="text-3xl font-black font-mono text-blue-400">{calibrationData.precisao}%</span>
                    <span className="text-[9px] text-gray-600 mt-1">Proximidade com o resultado real</span>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Viés de Confiança</span>
                    <span className={`text-3xl font-black font-mono ${calibrationData.vies > 0 ? "text-amber-400" : calibrationData.vies < 0 ? "text-blue-400" : "text-emerald-400"}`}>
                      {calibrationData.vies > 0 ? `+${calibrationData.vies}%` : `${calibrationData.vies}%`}
                    </span>
                    <span className="text-[9px] text-gray-600 mt-1">{calibrationData.vies > 0 ? "Otimista / Confiante" : calibrationData.vies < 0 ? "Pessimista / Prudente" : "Totalmente Alinhado"}</span>
                  </div>

                  <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-4 col-span-1 sm:col-span-1 flex flex-col justify-center text-left">
                    <span className="text-[9.5px] font-bold text-indigo-300 uppercase tracking-wider block mb-1 flex items-center gap-1">🤖 Mentor Metacognitivo</span>
                    <p className="text-[11.5px] text-gray-400 leading-relaxed mt-0.5 italic">
                      "{calibrationMentorPhrase}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Histórico e Evolução */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gráfico de Evolução de Acertos */}
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
                <div>
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Evolução Cronológica de Acertos</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Acompanhe a precisão média de cada sessão executada em ordem cronológica.</p>
                </div>
                
                <div className="h-44 flex items-center justify-center bg-black/40 border border-white/5 rounded-xl p-3">
                  {chronologicalAccuracy.length < 2 ? (
                    <p className="text-[11.5px] text-gray-500 text-center leading-relaxed">
                      ℹ️ Insuficientes dados para traçar gráfico de linha cronológica. Continue estudando!
                    </p>
                  ) : (
                    <div className="w-full h-full relative">
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0"/>
                          </linearGradient>
                          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                        
                        {/* Grid Lines */}
                        <line x1="15" y1={svgHeight - 10} x2={svgWidth - 15} y2={svgHeight - 10} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <line x1="15" y1={(svgHeight - 25) * 0.5 + 15} x2={svgWidth - 15} y2={(svgHeight - 25) * 0.5 + 15} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <line x1="15" y1={(svgHeight - 25) * 0.2 + 15} x2={svgWidth - 15} y2={(svgHeight - 25) * 0.2 + 15} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <line x1="15" y1="15" x2={svgWidth - 15} y2="15" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        
                        {/* Labels */}
                        <text x="17" y={svgHeight - 14} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">0%</text>
                        <text x="17" y={(svgHeight - 25) * 0.5 + 20} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">50%</text>
                        <text x="17" y={(svgHeight - 25) * 0.2 + 20} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">80%</text>
                        <text x="17" y="23" fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">100%</text>

                        {/* Gradient Shading */}
                        {pointsInfo.area && <path d={pointsInfo.area} fill="url(#areaGrad)" />}
                        
                        {/* Path Line */}
                        {pointsInfo.line && <path d={pointsInfo.line} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                        {/* Dots */}
                        {pointsInfo.pts.map((p, i) => (
                          <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="3.5"
                            fill="#ec4899"
                            stroke="#0e0e18"
                            strokeWidth="1.5"
                            className="hover:r-5 cursor-help transition-all"
                          >
                            <title>{`Sessão ${i + 1}: ${p.val}%`}</title>
                          </circle>
                        ))}
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Forecast Section (Previsão de Carga FSRS) */}
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
                <div>
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Previsão de Carga FSRS (Próximos 14 dias)</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Estimativa de revisões programadas por dia para guiar seu planejamento.</p>
                </div>
                
                <div className="w-full overflow-x-auto select-none pt-2">
                  <div className="flex items-end justify-between gap-2.5 min-w-[500px] h-32 border-b border-white/5 pb-2 px-2">
                    {forecastData.map((d, idx) => {
                      const maxCount = Math.max(...forecastData.map(x => x.count), 1);
                      const heightPercent = (d.count / maxCount) * 80;
                      const isToday = idx === 0;
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                          <span className="text-[9.5px] font-mono text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                            {d.count}
                          </span>
                          <div 
                            style={{ height: `${Math.max(4, heightPercent)}px` }}
                            className={`w-full rounded-t transition-all ${
                              d.count === 0 
                                ? "bg-white/5" 
                                : isToday 
                                ? "bg-gradient-to-t from-blue-600 to-sky-500" 
                                : "bg-blue-500/60 group-hover:bg-blue-400"
                            }`}
                          />
                          <span className={`text-[9px] font-mono font-bold mt-1 ${isToday ? "text-sky-400 font-black" : "text-gray-600"}`}>
                            {isToday ? "Hoje" : d.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Redação ENEM Competencies for Vestibular */}
            {plat === "vest" && (
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
                <div>
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Evolução por Competência (Redação ENEM)</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Evolução detalhada nas 5 competências do ENEM ao longo de suas redações escritas.</p>
                </div>
                
                {redacaoHistory.length === 0 ? (
                  <div className="p-8 text-center text-gray-600 text-xs border border-white/5 rounded-xl bg-black/20">
                    Nenhuma redação registrada ainda. Conclua o ciclo de estudos D0 ou revisões em temas de redação para ver a evolução.
                  </div>
                ) : redacaoHistory.length < 2 ? (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400 italic">Uma redação registrada. Registre pelo menos duas para visualizar a linha de tendência.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { label: "C1: Norma Culta", val: redacaoHistory[0].c1 },
                        { label: "C2: Tema/Gênero", val: redacaoHistory[0].c2 },
                        { label: "C3: Argumentação", val: redacaoHistory[0].c3 },
                        { label: "C4: Coesão", val: redacaoHistory[0].c4 },
                        { label: "C5: Proposta", val: redacaoHistory[0].c5 }
                      ].map((c, idx) => (
                        <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-3 text-center">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-1">{c.label}</span>
                          <span className="text-lg font-black text-blue-400">{c.val} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* SVG Chart */}
                    <div className="h-44 flex items-center justify-center bg-black/40 border border-white/5 rounded-xl p-3">
                      <div className="w-full h-full relative">
                        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                          {/* Grid Lines */}
                          <line x1="15" y1={svgHeight - 10} x2={svgWidth - 15} y2={svgHeight - 10} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          <line x1="15" y1={(svgHeight - 25) * 0.4 + 15} x2={svgWidth - 15} y2={(svgHeight - 25) * 0.4 + 15} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          <line x1="15" y1={(svgHeight - 25) * 0.8 + 15} x2={svgWidth - 15} y2={(svgHeight - 25) * 0.8 + 15} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          <line x1="15" y1="15" x2={svgWidth - 15} y2="15" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          
                          {/* Labels */}
                          <text x="17" y={svgHeight - 14} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">0</text>
                          <text x="17" y={(svgHeight - 25) * 0.4 + 20} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">120</text>
                          <text x="17" y={(svgHeight - 25) * 0.8 + 20} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">160</text>
                          <text x="17" y="23" fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">200</text>

                          {/* C1 Line */}
                          <path d={redacaoPoints.c1.path} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {/* C2 Line */}
                          <path d={redacaoPoints.c2.path} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {/* C3 Line */}
                          <path d={redacaoPoints.c3.path} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {/* C4 Line */}
                          <path d={redacaoPoints.c4.path} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {/* C5 Line */}
                          <path d={redacaoPoints.c5.path} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> C1: Norma Culta</span>
                      <span className="flex items-center gap-1.5 text-red-400"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> C2: Tema/Gênero</span>
                      <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> C3: Argumentação</span>
                      <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> C4: Coesão</span>
                      <span className="flex items-center gap-1.5 text-indigo-400"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> C5: Proposta</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Performance by Specialty */}
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
              <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">
                {plat === "vest" ? "Desempenho por Matéria" : "Desempenho por Especialidade"}
              </h3>
              <div className="space-y-4">
                {personalStats?.espStats.map(e => {
                  const espC = ESP_COLORS[e.esp] || "#94a3b8";
                  const accColor = e.acc == null ? "text-gray-600" : e.acc >= 80 ? "text-emerald-400" : e.acc >= 65 ? "text-yellow-400" : "text-red-400";
                  return (
                    <div key={e.esp} className="space-y-1.5">
                      <div className="flex justify-between text-[12px]">
                        <span className="font-semibold text-gray-300">{e.esp}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 text-[11px]">{e.questoes.toLocaleString("pt-BR")} questões</span>
                          <span className={`font-black tabular-nums ${accColor}`}>{e.acc != null ? `${e.acc}%` : "—"}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${e.progress}%`, background: espC + "cc" }} />
                      </div>
                      <p className="text-[10px] text-gray-600">{e.doneSteps}/{e.total} etapas · {e.progress}% do ciclo concluído</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <AdvancedSection title="Paineis avancados de lancamento" defaultOpen={false} storageKey="stats-launch-advanced">
              <div className="space-y-4">
                <LaunchChecklistPanel />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Revisoes executivas</span>
                    <span className="text-[10px] text-gray-500">{weeklyReviews.length} registradas</span>
                  </div>
                  <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando revisão semanal...</div>}>
                    <WeeklyReview onAdjust={() => setView && setView("crono")} />
                  </Suspense>
                </div>
                <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando painel de segurança...</div>}>
                  <DataSafetyPanel />
                </Suspense>
              </div>
            </AdvancedSection>
          </>
        )}
      </div>
    </div>
  );
}
