// src/components/Dashboard.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Edit2, Info, TrendingUp, CheckCircle, ChevronDown, ChevronUp, Brain, Flame, Calendar, AlertTriangle, X, Zap, BookOpen, Layers, Share2 } from "lucide-react";
import { useStore } from "../core/store";
import { STEPS, ESP_COLORS, isOverdue, isDueToday, todayStr, addDays, fmtDate, fmtFull, getRetrievability, getWorkloadProjection } from "../core/fsrs";
import { calcStreaks, calcTrueRetention, calcBleedingScore, useFilaInteligente, PESOS_PROVA_VEST } from "../hooks/useMetrics";
import { getMentorDiagnosis, getMentorVoice, getMentorPhrase, getRecentPhrases, trackRecentPhrase } from "../core/mentor";
import { getReadinessData } from "../core/readiness";
import { getUserState } from "../core/userState";
import { TourBalloon, Modal, Btn, ConfettiOverlay, ProgressiveTooltip, InfoTooltip } from "./Primitives";
import { Check } from "lucide-react";
import RetrievabilitySpark from "./RetrievabilitySpark";
import DicaContextual from "./DicaContextual";
import useCountUp from "../hooks/useCountUp";

/* ─── CARGA FUTURA WIDGET ─────────────────────────────────────────────────── */
function CargaFuturaWidget({ temas, maxRevisoesDia }) {
  const proj = getWorkloadProjection(temas, 14);
  const dates = Object.keys(proj);
  const maxCount = Math.max(...Object.values(proj), maxRevisoesDia, 1);
  
  return (
    <div className="medrev-card medrev-card-hover p-5 select-none animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[12px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
          📊 Carga de Revisões (Próximos 14 dias)
          <InfoTooltip texto="Projeção das revisões pendentes agendadas para os próximos 14 dias com base no algoritmo FSRS." />
        </h4>
        <span className="text-[10px] text-gray-500 font-mono">Teto: {maxRevisoesDia}</span>
      </div>
      
      <div className="flex items-end justify-between h-24 gap-1.5 pt-4">
        {dates.map((date) => {
          const count = proj[date];
          const pct = (count / maxCount) * 100;
          const exceeds = count > maxRevisoesDia;
          const today = date === todayStr();
          
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <div className="relative w-full flex justify-center">
                <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 text-[9px] text-gray-300 rounded px-1.5 py-0.5 whitespace-nowrap z-50 pointer-events-none font-mono">
                  {count} revs
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
    </div>
  );
}

/* ─── WELCOME POPUP ─────────────────────────────────────────────────────────── */
function WelcomePopup({ userName, pending, streakCurrent, totalSessions, onClose, onStartFocus, meta, naReserva, totalRevisoesFeitas, prontidao }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // pequeno delay para a animação de entrada
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const { plat } = useStore();
  const mentorMsg = useMemo(() => {
    return getMentorVoice({
      situation: "boas_vindas_diario",
      userName,
      pending,
      streakCurrent,
      meta,
      plat,
      tom: meta?.tomMentor || "gentil",
      totalSessions,
      totalRevisoesFeitas,
      prontidao
    });
  }, [userName, pending, streakCurrent, meta, plat, totalSessions, totalRevisoesFeitas, prontidao]);

  const handleClose = () => {
    setVisible(false);
    if (meta?.isRetornoAcolhedor) {
      useStore.setState({ meta: { ...meta, isRetornoAcolhedor: false } });
    }
    setTimeout(onClose, 250);
  };

  const handleStart = () => {
    setVisible(false);
    if (meta?.isRetornoAcolhedor) {
      useStore.setState({ meta: { ...meta, isRetornoAcolhedor: false } });
    }
    setTimeout(onStartFocus, 250);
  };

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      style={{
        background: "rgba(5,5,12,0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        transition: "opacity 0.25s ease",
        opacity: visible ? 1 : 0,
      }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[min(24rem,calc(100vw-2rem))]"
        style={{
          transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.93) translateY(16px)",
          opacity: visible ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* glow ambiental */}
        <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-blue-600/20 via-sky-600/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative bg-[var(--surface-2)] border border-blue-500/25 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-950/50">
          {/* barra de acento superior */}
          <div className="h-[3px] w-full bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600" />

          {/* header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                <span className="text-sm">🧠</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-400">
                Mentora · MedRev
              </span>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all"
            >
              <X size={15} />
            </button>
          </div>

          {/* mensagem */}
          <div className="px-5 py-4">
            <p className="text-[13px] leading-relaxed text-gray-200 font-semibold">
              {mentorMsg}
            </p>
          </div>

          {/* stats row */}
          {totalSessions > 0 && (
            <div className="mx-5 mb-4 grid grid-cols-2 gap-2">
              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
                <Flame size={14} className={streakCurrent > 0 ? "text-orange-400" : "text-gray-600"} />
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Streak</p>
                  <p className="text-[13px] font-black text-white">{streakCurrent}/7 dias</p>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
                <BookOpen size={14} className="text-blue-400" />
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Hoje</p>
                  <p className={`text-[13px] font-black ${pending > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {pending > 0 ? `${pending} pendente${pending === 1 ? "" : "s"}${naReserva > 0 ? ` (+${naReserva})` : ""}` : "Fila zerada âœ“"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* actions */}
          <div className="flex flex-col sm:flex-row gap-2 px-5 pb-5">
            {pending > 0 ? (
              <button
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-black text-[12px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-900/30"
              >
                <Zap size={13} />
                Iniciar Foco Agora
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-black text-[12px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-900/30"
              >
                Entendido!
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-gray-400 hover:text-gray-200 font-semibold text-[12px] border border-white/8 transition-all w-full sm:w-auto"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniCronogramaWidget({ plat, setView, onStudy, overdue = [], today_ = [] }) {
  const cronogramas = useStore((s) => s[plat]?.cronogramas || []);
  const activeCrono = useMemo(() => cronogramas[0] || null, [cronogramas]);
  const toggleBloco = useStore((s) => s.toggleBloco);
  const temas = useStore((s) => s[plat]?.temas || []);

  const dueTodayItems = useMemo(() => {
    return [...overdue, ...today_];
  }, [overdue, today_]);

  const hoje = todayStr();
  let currentSemana = activeCrono?.semanas[0];
  let semanaIdx = 0;
  if (activeCrono) {
    for (let i = 0; i < activeCrono.semanas.length; i++) {
      const s = activeCrono.semanas[i];
      const d0 = s.dias[0]?.isoDate || "";
      const d6 = s.dias[6]?.isoDate || "";
      if (d0 && d6 && hoje >= d0 && hoje <= d6) {
        currentSemana = s;
        semanaIdx = i;
        break;
      }
    }
  }

  const diaHoje = currentSemana?.dias.find(d => d.isoDate === hoje);
  const total = activeCrono ? activeCrono.semanas.reduce((a, s) => a + s.dias.reduce((b, d) => b + d.blocos.length, 0), 0) : 0;
  const feitos = activeCrono ? activeCrono.semanas.reduce((a, s) => a + s.dias.reduce((b, d) => b + d.blocos.filter(b2 => b2.concluido).length, 0), 0) : 0;
  const pct = total > 0 ? Math.round(feitos / total * 100) : 0;

  return (
    <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-md relative overflow-hidden text-left">
      <div className="absolute -right-8 -top-8 w-20 h-20 rounded-full bg-blue-600/5 blur-2xl pointer-events-none" />
      
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-blue-400" />
          <span className="text-[10.5px] font-black uppercase text-gray-300 tracking-wider">
            Quadro de Revisão & Cronograma
          </span>
        </div>
        {activeCrono && (
          <button
            onClick={() => setView && setView("crono")}
            className="text-[9.5px] font-bold text-blue-400 hover:text-blue-300 transition-colors border-none p-0 bg-transparent cursor-pointer"
          >
            Ver Completo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Column 1: FSRS Due Today */}
        <div className="bg-gradient-to-br from-blue-600/10 via-[var(--surface-1)] to-sky-500/5 border border-blue-500/20 rounded-xl p-3 space-y-2 flex flex-col justify-between min-h-[145px]">
          <div className="space-y-1">
            <span className="text-[9.5px] text-gray-500 font-bold uppercase tracking-wider block">
              Revisões FSRS de Hoje ({dueTodayItems.length})
            </span>
            <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
              {dueTodayItems.length === 0 ? (
                <p className="text-[10.5px] text-gray-500 italic py-4 text-center">Fila zerada! Parabéns. 🎉</p>
              ) : (
                dueTodayItems.map((item, idx) => {
                  const temaObj = temas.find(t => t.id === item.temaId);
                  return (
                    <div key={idx} className="flex items-center justify-between p-1.5 bg-black/20 rounded-lg text-[10.5px]">
                      <div className="min-w-0 flex-1 pr-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-200 truncate" title={item.temaNome}>{item.temaNome}</p>
                          <p className="text-[9px] text-gray-500 mt-0.5 uppercase">{item.esp} · {item.step.label}</p>
                        </div>
                        {temaObj && <RetrievabilitySpark tema={temaObj} />}
                      </div>
                      <button
                        onClick={() => onStudy && onStudy(item.temaId, item.step.key)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[9.5px] font-bold transition-all shrink-0 cursor-pointer border-none"
                      >
                        Focar
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Weekly Schedule Blocks */}
        <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 space-y-2 flex flex-col justify-between min-h-[145px]">
          {activeCrono ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] text-gray-500 font-bold uppercase tracking-wider">
                  Blocos de Hoje ({diaHoje ? diaHoje.dia : "Sem aulas"})
                </span>
                <span className="text-[9px] text-blue-400 font-bold uppercase">Semana {currentSemana?.numero || 1} ({pct}%)</span>
              </div>
              
              {diaHoje && diaHoje.blocos.length > 0 ? (
                <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {diaHoje.blocos.map((bloco, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 bg-black/20 rounded-lg text-[10.5px]">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className={`font-semibold truncate ${bloco.concluido ? "line-through text-gray-600" : "text-gray-200"}`}>{bloco.nome}</p>
                        <p className="text-[9px] text-gray-500 font-mono mt-0.5">{bloco.horario}</p>
                      </div>
                      <button
                        onClick={() => toggleBloco(plat, activeCrono.id, semanaIdx, currentSemana.dias.indexOf(diaHoje), idx)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 border-none cursor-pointer ${bloco.concluido ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}
                      >
                        {bloco.concluido && <Check size={10} className="text-white" strokeWidth={3} />}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10.5px] text-gray-500 italic py-4 text-center">Nenhum bloco de cronograma hoje.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-3 gap-2">
              <Calendar size={16} className="text-gray-600" />
              <p className="text-[9.5px] text-gray-500">Nenhum cronograma semanal configurado.</p>
              <button
                onClick={() => setView && setView("crono")}
                className="text-[9px] bg-blue-600/20 text-blue-400 border border-blue-500/25 px-2 py-1 rounded-xl font-bold border-none cursor-pointer"
              >
                Criar Cronograma
              </button>
            </div>
          )}
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
    </div>
  );
}

const SESSION_KEY = "medrev_welcome_shown";

function DashboardKpiCard({ label, value, tone = "text-white", children, action, tooltip, className = "", delayMs = 0 }) {
  return (
    <div
      className={`medrev-card medrev-card-hover p-5 min-h-[132px] relative group flex flex-col justify-between overflow-hidden animate-fade-up ${className}`}
      style={{ animationDelay: `${Math.min(delayMs, 300)}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wide font-bold flex items-center gap-1 cursor-help">
          {label}
          {tooltip && <Info size={11} className="text-gray-600 group-hover:text-gray-400 transition-colors" />}
        </p>
        {action}
      </div>
      <div>
        <p className={`text-3xl md:text-4xl font-bold tabular-nums tracking-normal ${tone}`}>
          {value}
        </p>
        {children}
      </div>
      {tooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-[min(13rem,calc(100vw-2rem))] bg-[#141417] border border-white/10 rounded-xl p-3 text-[10px] text-gray-400 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed">
          {tooltip}
        </div>
      )}
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
  const { plat, sprint, tourStep, setTourStep, setOnboardingDone, onboardingDone } = useStore();
  const showToastGlobal = useStore((s) => s.showToast);
  const openConfirm = useStore((s) => s.openConfirm);
  const gamif           = useStore((s) => s.gamif);
  const temas           = useStore((s) => s[plat]?.temas || []);
  const temaStats       = useStore((s) => s.temaStats || {});
  const meta            = useStore((s) => s.meta);

  const handleInsightAction = (action) => {
    if (action.type === "focar") {
      const matchedQueueItem = filaInteligente.find(item => {
        const t = temasFiltrados.find(x => x.id === item.temaId);
        return t && t.esp === action.esp;
      });
      if (matchedQueueItem) {
        onStudy(matchedQueueItem.temaId, matchedQueueItem.stepKey);
      } else {
        const matchedTema = temasFiltrados.find(t => t.esp === action.esp);
        if (matchedTema) {
          onStudy(matchedTema.id, "d0");
        } else {
          (showToast || showToastGlobal)(`Nenhum tema cadastrado em ${action.esp}`);
        }
      }
    } else if (action.type === "agendar") {
      const updatedMeta = { ...meta, horarioPreferido: action.time };
      useStore.setState({ meta: updatedMeta });
      if (showToast) {
        (showToast || showToastGlobal)(`Lembrete agendado para as ${action.time}.`);
      }
    } else if (action.type === "setView") {
      setView(action.view);
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
  const [showWeeklyDiag, setShowWeeklyDiag] = useState(false);
  const [showCompleto, setShowCompleto] = useState(false);

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

  const autoCatchUp = useStore((s) => s.autoCatchUp);
  useEffect(() => {
    autoCatchUp();
  }, [autoCatchUp]);

  const estaPausado = meta.pausadoAte && todayStr() <= meta.pausadoAte;
  const allRev  = estaPausado ? [] : temasFiltrados.flatMap((t) => STEPS.map((s) => ({ ...t.rev[s.key], esp: t.esp, step: s, temaNome: t.nome, temaId: t.id, ankiDeck: t.ankiDeck })));
  const done    = temasFiltrados.flatMap((t) => STEPS.map((s) => ({ ...t.rev[s.key], esp: t.esp, step: s, temaNome: t.nome, temaId: t.id, ankiDeck: t.ankiDeck }))).filter((r) => r.done);

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
  const userState = useMemo(() => {
    const dataCriacao = meta?.createdAt || meta?.lastActiveDate || todayStr();
    const datasSessoes = done.map((r) => r.date).filter(Boolean);
    return getUserState(dataCriacao, datasSessoes, todayStr());
  }, [meta?.createdAt, meta?.lastActiveDate, done]);
  const userStateMentorMsg = useMemo(() => {
    const key = `estado_${userState}`;
    const recent = getRecentPhrases();
    const phrase = getMentorPhrase(key, { userName }, recent, plat, meta?.tomMentor || "gentil");
    if (phrase?.id) trackRecentPhrase(phrase.id);
    return phrase?.text || "";
  }, [userState, userName, plat, meta?.tomMentor]);

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

  const totalSessions = useMemo(() => {
    return temas.flatMap((t) => Object.values(t.rev)).filter((r) => r.done).length;
  }, [temas]);

  const doneDays = useMemo(() => new Set(done.map((r) => r.date)), [done]);
  const streakCurrent = gamif?.streakCurrent || 0;
  const streakBest = gamif?.streakBest || 0;
  const trueRet = calcTrueRetention(temasFiltrados);
  const bleeding = calcBleedingScore(temasFiltrados);
  const temasManutencao = useMemo(() => {
    return temasFiltrados.filter(t => t.rev?.manutencao && !t.rev.manutencao.done);
  }, [temasFiltrados]);

  // ─── VESTIBULAR COMPUTED METRICS ────────────────────────────────────────────
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
  const semanaDeProva = daysToProva != null && daysToProva >= 0 && daysToProva <= 7;

  useEffect(() => {
    if (!onboardingDone) return;       // still in tour — don't show
    if (tourStep) return;              // tour in progress
    const shown = sessionStorage.getItem(SESSION_KEY);
    if (shown) {
      if (diag && diag.status !== "calibracao" && diag.insights && diag.insights.length > 0) {
        const lastShown = meta.lastWeeklyDiagnosisDate;
        const today = todayStr();
        if (!lastShown || (new Date(today) - new Date(lastShown)) / (1000 * 60 * 60 * 24) >= 7) {
          setShowWeeklyDiag(true);
        }
      }
      return;
    }
    const t = setTimeout(() => {
      setShowWelcome(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 600);                           // small delay so UI renders first
    return () => clearTimeout(t);
  }, [onboardingDone, tourStep, diag, meta.lastWeeklyDiagnosisDate]);

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

  const optimalItemsCount = useMemo(() => {
    return [...overdue, ...today_].filter(item => {
      const tema = temasFiltrados.find(t => t.id === item.temaId);
      if (!tema) return false;
      const R = getRetrievability(tema, item.step.key);
      return R >= 0.85 && R <= 0.90;
    }).length;
  }, [overdue, today_, temasFiltrados]);

  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 34 + i);
    return d.toISOString().slice(0, 10);
  });

  const espAbbr = (esp) => {
    const map = { "Cirurgia": "CI", "Clínica Médica": "CM", "GO": "GO", "Pediatria": "PE", "Preventiva": "PR" };
    return map[esp] || esp.slice(0, 2).toUpperCase();
  };

  const triggerStreakFreeze = useStore((s) => s.useStreakFreeze);
  const resetStreakFreeze = useStore((s) => s.resetStreakFreeze);

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
    ctx.fillText("ÍNDICE DE PRONTIDÃO GERAL", 45, 140);

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
      link.download = `medrev-prontidao-${todayStr()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      if (showToast) {
        showToast("🎨 Cartão de Prontidão exportado com sucesso!");
      }
    } catch (err) {
      console.error(err);
      (showToast || showToastGlobal)("Erro ao exportar o cartão de prontidão.");
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
  const trueRetCountUp = useCountUp(trueRet ?? 0, { duration: 600 });
  const streakCountUp = useCountUp(streakCurrent, { duration: 600 });
  const masteredCount = temasFiltrados.filter(t => STEPS.every(s => t.rev[s.key].done)).length;
  const masteredCountUp = useCountUp(masteredCount, { duration: 600 });

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

  // 📌 ESTADO VAZIO: Mostrar apenas o CTA de onboarding se não houver temas cadastrados
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

        <div className="bg-gradient-to-br from-blue-600/10 via-sky-600/5 to-indigo-600/10 border border-blue-500/20 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center gap-6 shadow-xl shadow-indigo-900/5 my-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30 animate-pulse">
            🎯
          </div>
          <div className="max-w-md">
            <h2 className="text-xl font-black text-white mb-2">Sua jornada começa aqui!</h2>
            <p className="text-[13px] text-gray-400 leading-relaxed">
              O seu cronograma e algoritmo de repetição FSRS estão prontos para rodar. Clique no botão abaixo para escolher ou cadastrar seu primeiro tema de estudo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView && setView("crono")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-[13px] transition-all hover:scale-[1.02] shadow-lg shadow-indigo-900/20"
          >
            Ir para o Cronograma
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-fade-up text-left max-w-6xl mx-auto">
      {(userState === "at_risk" || userState === "dormant" || userState === "resurrected") && userStateMentorMsg && (
        <div className="bg-[var(--surface-1)] border border-amber-500/25 rounded-2xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-amber-400 font-black">Intervenção do Mentor</p>
          <p className="text-xs text-gray-200 mt-1">{userStateMentorMsg}</p>
        </div>
      )}
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
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-black/25 px-2.5 py-1.5">
                  <span className="text-[8.5px] font-bold text-gray-500 uppercase tracking-wider mr-1 select-none flex items-center gap-1">
                    Consistencia
                    <InfoTooltip texto="Mapeia seu historico de estudos nos ultimos 7 dias. Cada bloco colorido indica que voce realizou revisoes naquele dia." />
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
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-300">Acao do dia</p>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {pending > 0 ? "Voce tem " + pending + " revisoes para hoje" : "Fila zerada por hoje"}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-2)]">
                {pending > 0
                  ? topFilaItem
                    ? "Comece por " + topFilaItem.temaNome + (naReserva > 0 ? " e mantenha " + naReserva + " na reserva." : ".")
                    : "O algoritmo ja ordenou sua fila pelo melhor custo cognitivo."
                  : "Curva protegida. Voce pode descansar ou iniciar um novo tema sem pressa."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {pending > 0 && topFilaItem ? (
                <button
                  type="button"
                  onClick={() => onStudy(topFilaItem.temaId, topFilaItem.stepKey)}
                  className="medrev-cta-primary min-h-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-950/25 hover:scale-[1.01] hover:from-blue-500 hover:to-sky-400 border-none cursor-pointer"
                >
                  Iniciar Foco
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setView && setView("crono")}
                  className="medrev-cta-primary min-h-[44px] rounded-xl bg-emerald-600/25 px-5 py-3 text-sm font-extrabold text-emerald-300 border border-emerald-500/25 hover:bg-emerald-600/40 hover:text-white cursor-pointer"
                >
                  Estudar novo tema
                </button>
              )}
              {topFilaItem?.isOptimal && (
                <span className="text-[11px] font-bold text-amber-300">
                  Ponto exato de esquecimento detectado
                </span>
              )}
            </div>
          </div>

          <DailyProgressRing value={dailyProgress} goal={dailyGoal} />
        </div>
      </section>

      {/* Camada secundaria: KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 select-none">
        <DashboardKpiCard
          label="Pendentes"
          value={String(pendingCountUp) + (naReserva > 0 ? " +" + naReserva : "")}
          tone={pending > 0 ? "text-amber-400" : "text-emerald-400"}
          tooltip="Total de revisoes programadas pelo algoritmo de repeticao espacada FSRS para o dia atual."
          delayMs={0}
        />
        <DashboardKpiCard
          label="Prontidao"
          value={String(readinessCountUp) + "%"}
          tone="text-blue-400"
          tooltip="Metrica Geral de Prontidao calculada com base na cobertura e acertos do cronograma e simulados."
          delayMs={50}
          action={(
            <button
              onClick={exportarCartaoProntidao}
              title="Compartilhar Cartao de Prontidao"
              className="text-gray-500 hover:text-blue-400 transition-colors focus:outline-none relative z-10 p-0.5"
              aria-label="Compartilhar Cartao de Prontidao"
            >
              <Share2 size={14} />
            </button>
          )}
        >
          {readinessTrend.delta7 !== undefined && (
            <span className={"text-[10px] font-bold " + (readinessTrend.delta7 >= 0 ? "text-emerald-400" : "text-red-400")} title="Evolucao em 7 dias">
              {readinessTrend.delta7 >= 0 ? "+" + readinessTrend.delta7 + "%" : readinessTrend.delta7 + "%"}
            </span>
          )}
          {sparklinePath && (
            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="mt-2 h-5 w-full opacity-50">
              <path d={sparklinePath} fill="none" stroke="var(--primary)" strokeWidth="1.5" />
            </svg>
          )}
        </DashboardKpiCard>
        <DashboardKpiCard
          label="Acerto"
          value={acertoMedio != null ? String(acertoCountUp) + "%" : "-"}
          tone={acertoMedio != null ? (acertoMedio >= 80 ? "text-emerald-400" : acertoMedio >= 65 ? "text-blue-400" : "text-red-400") : "text-gray-500"}
          tooltip="Precisao media ponderada das questoes resolvidas nas etapas D0/revisao concluidas."
          delayMs={100}
        />
        <DashboardKpiCard
          label="Dominados"
          value={temasFiltrados.length > 0 ? String(masteredCountUp) + "/" + temasFiltrados.length : "0"}
          tone="text-emerald-400"
          tooltip="Numero de temas cadastrados que completaram o ciclo completo de fixacao no FSRS."
          delayMs={150}
        />
        <DashboardKpiCard
          label="True Retention"
          value={trueRet != null ? String(trueRetCountUp) + "%" : "-"}
          tone={trueRet != null ? (trueRet >= 80 ? "text-emerald-400" : trueRet >= 65 ? "text-blue-400" : "text-red-400") : "text-gray-500"}
          tooltip="Taxa de acerto real medida apenas em etapas com intervalos maiores de 15 dias (D21+)."
          className="col-span-2 lg:col-span-1"
          delayMs={200}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="medrev-card medrev-card-hover p-5 min-h-[132px] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wide font-bold flex items-center gap-1">
              Ofensiva
              <InfoTooltip texto="Mede sua consistencia estudada na ultima semana. Menos punitivo que a contagem consecutiva classica." />
            </p>
            <div className="flex gap-1 select-none items-center">
              {Array.from({ length: 2 }).map((_, i) => (
                <span
                  key={i}
                  title={i < (gamif?.freezesOwned || 0) ? "Streak Freeze Disponivel" : "Streak Freeze Vazio"}
                  className={"text-xs " + (i < (gamif?.freezesOwned || 0) ? "opacity-100" : "opacity-25 grayscale")}
                >
                  S
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-bold tabular-nums text-orange-400">{streakCountUp}/7</p>
            <p className="text-[11px] text-[var(--text-3)] mt-1">dias ativos nos ultimos 7 dias</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {gamif?.lostStreakDate && (gamif?.recoveryOwned || 0) > 0 && (
              <button
                type="button"
                onClick={() => {
                  openConfirm({
                    title: "Recuperar ofensiva",
                    message: "Deseja usar 1 Recuperacao de Streak para reerguer sua ofensiva perdida?",
                    confirmLabel: "Usar recuperacao",
                    onConfirm: () => useStore.getState().useRecovery(),
                  });
                }}
                className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-[10px] rounded-xl shadow-md active:scale-95 transition-all border-none cursor-pointer"
              >
                Recuperar Ofensiva
              </button>
            )}
            {meta?.streakFreezeUsed ? (
              <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[10.5px] rounded-xl">
                Freeze Ativo
              </span>
            ) : (gamif?.freezesOwned || 0) > 0 ? (
              <span className="px-3 py-1.5 bg-blue-950/20 border border-blue-500/15 text-blue-400/90 font-medium text-[10.5px] rounded-xl">
                {gamif.freezesOwned} Freeze{(gamif.freezesOwned || 0) > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-white/5 text-gray-500 font-medium text-[10.5px] rounded-xl">
                Sem freezes
              </span>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          <DicaContextual onNavigateToAcademia={() => setView && setView("academia")} />
        </div>
      </section>

      {/* ALERTAS CRÃTICOS DO MENTOR */}
      {criticalAlerts.map((alert, idx) => {
        let borderStyle = "border-amber-500/25";
        let glowStyle = "from-amber-600/15 via-[var(--surface-1)] to-amber-950/20";
        let badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
        let icon = "âš ï¸";
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
                Você está utilizando configurações padrão. Personalize suas datas e metas de acerto para calibrar o motor FSRS.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAjustes}
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

      {/* MiniCronogramaWidget shown prominently on main page when in modoSimples */}
      {modoSimples && (
        <div className="mt-1">
          <MiniCronogramaWidget
            plat={plat}
            setView={setView}
            onStudy={onStudy}
            overdue={overdue}
            today_={today_}
          />
        </div>
      )}

      {/* Collapsible toggle for modoSimples detailed panels */}
      {modoSimples && (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setShowCompleto(!showCompleto)}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-[var(--surface-1)] border border-white/5 rounded-2xl hover:bg-white/[0.02] transition-colors border-none text-left"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Brain size={14} className="text-blue-400" />
              <span>Ver diagnóstico completo</span>
            </div>
            {showCompleto ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </button>
        </div>
      )}

      {(!modoSimples || showCompleto) && (
        <div className="space-y-5 flex flex-col gap-5">
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

      {/* ZONA 2 — Diagnóstico do Mentor */}
      <div className="medrev-card p-5 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute -left-12 -bottom-12 w-28 h-28 rounded-full bg-cyan-600/5 blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Brain size={16} className="text-blue-400" />
            <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-wider mr-2">Diagnóstico do Mentor</h3>
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
              <div className="text-2xl shrink-0">🤖</div>
              <div className="space-y-2 flex-1">
                <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                  Estou calibrando meu algoritmo de inteligência cognitiva para seu perfil.
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
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-wide">🔓 Nível 7+ (Calibrado)</span>
                <p className="text-[10.5px] text-gray-400 leading-relaxed">
                  Desbloqueia análise de horário ótimo, fraquezas por especialidade e detecção de viés de confiança.
                </p>
              </div>
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-wide">🔓 Nível 30+ (Elite)</span>
                <p className="text-[10.5px] text-gray-400 leading-relaxed">
                  Desbloqueia projeção estatística de nota/aprovação com base no seu histórico e peso das provas.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-start gap-3 p-3 bg-blue-500/5 text-blue-300 border border-blue-500/10 rounded-xl mb-1">
              <span className="text-base shrink-0 mt-0.5">🧠</span>
              <p className="text-[12px] leading-relaxed font-bold">
                {totalSessions < 30 
                  ? "Já conheço seu ritmo. Ajustei a fila para seus horários de pico." 
                  : "Perfil completo. A fila agora é 100% sua."}
              </p>
            </div>
            {nonCriticalInsights.map((insight, idx) => {
              let icon = "💡";
              let colorClass = "bg-white/[0.02] text-gray-300 border border-white/5";
              if (insight.type === "alerta" || insight.type === "vies_excesso") {
                icon = "🤝";
                colorClass = "bg-amber-500/5 text-amber-300 border border-amber-500/10";
              } else if (insight.type === "tendencia_baixa") {
                icon = "🤝";
                colorClass = "bg-red-500/5 text-red-300 border border-red-500/10";
              } else if (insight.type === "tendencia_alta") {
                icon = "🤝";
                colorClass = "bg-emerald-500/5 text-emerald-300 border border-emerald-500/10";
              } else if (insight.type === "horario") {
                icon = "🤝";
                colorClass = "bg-indigo-500/5 text-indigo-300 border border-indigo-500/10";
              }
              return (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${colorClass}`}>
                  <span className="text-base shrink-0 mt-0.5">{icon}</span>
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
                Iniciar tema â†’
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
              Número de temas cadastrados que completaram com sucesso todas as etapas da curva FSRS (D0 até o D21).
            </div>
          </div>

          {/* True Retention */}
          <ProgressiveTooltip
            tooltipId="true_retention"
            text="Mentor: True Retention mede a taxa de acerto nas revisões de longo prazo (D21+). Manter esse índice acima de 80% indica retenção sólida de conteúdo."
          >
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative group w-full">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5 cursor-help">
                True Retention
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
            Iniciar tema â†’
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
                    return (
                      <div key={i} className={`flex items-center gap-3 py-2.5 px-2 rounded-xl transition-all ${isOptimalItem ? "bg-amber-500/5 border border-amber-500/10" : ""}`}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0" style={{ background: (ESP_COLORS[r.esp] || "#94a3b8") + "15", color: ESP_COLORS[r.esp] }}>
                          {espAbbr(r.esp)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-bold text-white truncate">{r.temaNome}</p>
                            {isOptimalItem && (
                              <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-black shrink-0 ml-1.5" title="Retrievabilidade FSRS em ~87%: Ponto ideal de revisibilidade deliberada">
                                🎯 Ponto Ótimo
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase">{r.step.label} · {r.step.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onStudy(r.temaId, r.step.key)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[10.5px] font-semibold hover:bg-blue-500 transition-all shrink-0 active:scale-95"
                        >
                          Revisar
                        </button>
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
                <span>Painel de Estatísticas Avançadas & Heatmap</span>
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
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Minhas Ãreas</p>
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

                {!modoSimples && totalSessions >= 30 && (
                  <div className="border-t border-white/5 pt-4">
                    <MiniCronogramaWidget
                      plat={plat}
                      setView={setView}
                      onStudy={onStudy}
                      overdue={overdue}
                      today_={today_}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )}
      {showWelcome && (
        <WelcomePopup
          userName={userName}
          pending={pending}
          streakCurrent={streakCurrent}
          totalSessions={totalSessions}
          totalRevisoesFeitas={totalRevisoesFeitas}
          prontidao={prontidao}
          meta={meta}
          naReserva={naReserva}
          onClose={() => {
            setShowWelcome(false);
            if (diag && diag.status !== "calibracao" && diag.insights && diag.insights.length > 0) {
              const lastShown = meta.lastWeeklyDiagnosisDate;
              const today = todayStr();
              if (!lastShown || (new Date(today) - new Date(lastShown)) / (1000 * 60 * 60 * 24) >= 7) {
                setShowWeeklyDiag(true);
              }
            }
          }}
          onStartFocus={() => {
            setShowWelcome(false);
            if (topFilaItem) {
              onStudy(topFilaItem.temaId, topFilaItem.stepKey);
            }
          }}
        />
      )}

      {showWeeklyDiag && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4"
          style={{
            background: "rgba(5,5,12,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            transition: "opacity 0.25s ease",
          }}
          onClick={() => {
            setShowWeeklyDiag(false);
            useStore.setState({ meta: { ...meta, lastWeeklyDiagnosisDate: todayStr() } });
          }}
        >
          <div
            className="relative w-full max-w-[min(26rem,calc(100vw-2rem))] animate-fade-up bg-[var(--surface-2)] border border-blue-500/25 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-950/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-[3px] w-full bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600" />
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-blue-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Ritual de Retorno</h3>
              </div>
              <button
                onClick={() => {
                  setShowWeeklyDiag(false);
                  useStore.setState({ meta: { ...meta, lastWeeklyDiagnosisDate: todayStr() } });
                }}
                className="text-gray-500 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-white leading-tight">Sua semana em 3 frases:</h4>
                <p className="text-xs text-gray-400">Aqui está o ajuste de rota recomendado pelo seu Mentor:</p>
              </div>

              <div className="space-y-3">
                {diag?.insights && diag.insights.map((insight, idx) => {
                  let icon = "💡";
                  if (insight.type === "alerta" || insight.type === "vies_excesso") icon = "âš ï¸";
                  else if (insight.type === "tendencia_baixa") icon = "📉";
                  else if (insight.type === "tendencia_alta") icon = "📈";
                  else if (insight.type === "horario") icon = "âš¡";

                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-gray-300">
                      <span className="text-base shrink-0 mt-0.5">{icon}</span>
                      <p className="text-xs leading-relaxed font-medium">{insight.text}</p>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowWeeklyDiag(false);
                  useStore.setState({ meta: { ...meta, lastWeeklyDiagnosisDate: todayStr() } });
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl font-black text-xs tracking-wider transition-all active:scale-[0.98] cursor-pointer border-none shadow-lg shadow-indigo-900/25"
              >
                Bora ajustar! â†’
              </button>
            </div>
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

      {showCompletionModal && (
        <Modal onClose={() => {
          setShowCompletionModal(false);
          setOnboardingDone();
          setTourStep(null);
        }}>
          <div className="text-center py-4 space-y-4 max-w-sm mx-auto text-left">
            <div className="text-center">
              <span className="text-5xl animate-bounce block">🎓</span>
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


