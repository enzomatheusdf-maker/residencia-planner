// src/components/Dashboard.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Edit2, Info, TrendingUp, CheckCircle, ChevronDown, ChevronUp, Brain, Flame, Calendar, AlertTriangle, X, Zap, BookOpen } from "lucide-react";
import { useStore } from "../core/store";
import { STEPS, ESP_COLORS, isOverdue, isDueToday, todayStr, fmtDate, getRetrievability } from "../core/fsrs";
import { calcStreaks, calcTrueRetention, calcBleedingScore, calcFilaInteligente, PESOS_PROVA_VEST } from "../hooks/useMetrics";
import { getMentorDiagnosis } from "../core/mentor";
import { TourBalloon, Modal, Btn, ConfettiOverlay, ProgressiveTooltip } from "./Primitives";
import { Check } from "lucide-react";

/* ─── WELCOME POPUP ─────────────────────────────────────────────────────────── */
function WelcomePopup({ userName, pending, streakCurrent, totalSessions, onClose, onStartFocus }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // pequeno delay para a animação de entrada
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  // Mensagem contextual da mentora
  const mentorMsg = useMemo(() => {
    if (totalSessions === 0) {
      return `${greeting}, ${userName}! Você está começando uma jornada de elite. O algoritmo já sabe quando você vai esquecer — tudo que precisa é iniciar o primeiro tema.`;
    }
    if (streakCurrent >= 7) {
      return `${greeting}, ${userName}! ${streakCurrent} dias seguidos. Isso é consistência de aprovado. Continue.`;
    }
    if (pending >= 5) {
      return `${greeting}, ${userName}! Há ${pending} revisões esperando por você. Cada uma que você atrasa custa retenção — vamos resolver isso agora?`;
    }
    if (pending === 0 && totalSessions > 0) {
      return `${greeting}, ${userName}! Fila zerada. Aproveite para consolidar ou antecipar um novo tema.`;
    }
    return `${greeting}, ${userName}! Você tem ${pending} revisão${pending === 1 ? "" : "ões"} para hoje. O algoritmo está calibrado — confie no processo.`;
  }, [userName, pending, streakCurrent, totalSessions, greeting]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  const handleStart = () => {
    setVisible(false);
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
        className="relative w-full max-w-sm"
        style={{
          transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.93) translateY(16px)",
          opacity: visible ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* glow ambiental */}
        <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-violet-600/20 via-pink-600/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative bg-[#0e0e18] border border-violet-500/25 rounded-2xl overflow-hidden shadow-2xl shadow-purple-950/50">
          {/* barra de acento superior */}
          <div className="h-[3px] w-full bg-gradient-to-r from-violet-600 via-pink-500 to-violet-600" />

          {/* header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-900/40">
                <span className="text-sm">🧠</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-400">
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
                  <p className="text-[13px] font-black text-white">{streakCurrent} {streakCurrent === 1 ? "dia" : "dias"}</p>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
                <BookOpen size={14} className="text-violet-400" />
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Hoje</p>
                  <p className={`text-[13px] font-black ${pending > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {pending > 0 ? `${pending} pendente${pending === 1 ? "" : "s"}` : "Fila zerada ✓"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* actions */}
          <div className="flex gap-2 px-5 pb-5">
            {pending > 0 ? (
              <button
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white font-black text-[12px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-900/30"
              >
                <Zap size={13} />
                Iniciar Foco Agora
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white font-black text-[12px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-900/30"
              >
                Entendido!
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-gray-400 hover:text-gray-200 font-semibold text-[12px] border border-white/8 transition-all"
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
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-md relative overflow-hidden text-left">
      <div className="absolute -right-8 -top-8 w-20 h-20 rounded-full bg-violet-600/5 blur-2xl pointer-events-none" />
      
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-violet-400" />
          <span className="text-[10.5px] font-black uppercase text-gray-300 tracking-wider">
            Quadro de Revisão & Cronograma
          </span>
        </div>
        {activeCrono && (
          <button
            onClick={() => setView && setView("crono")}
            className="text-[9.5px] font-bold text-violet-400 hover:text-violet-300 transition-colors border-none p-0 bg-transparent cursor-pointer"
          >
            Ver Completo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Column 1: FSRS Due Today */}
        <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 space-y-2 flex flex-col justify-between min-h-[145px]">
          <div className="space-y-1">
            <span className="text-[9.5px] text-gray-500 font-bold uppercase tracking-wider block">
              Revisões FSRS de Hoje ({dueTodayItems.length})
            </span>
            <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
              {dueTodayItems.length === 0 ? (
                <p className="text-[10.5px] text-gray-500 italic py-4 text-center">Fila zerada! Parabéns. 🎉</p>
              ) : (
                dueTodayItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 bg-black/20 rounded-lg text-[10.5px]">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-gray-200 truncate" title={item.temaNome}>{item.temaNome}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5 uppercase">{item.esp} · {item.step.label}</p>
                    </div>
                    <button
                      onClick={() => onStudy && onStudy(item.temaId, item.step.key)}
                      className="px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-[9.5px] font-bold transition-all shrink-0 cursor-pointer border-none"
                    >
                      Focar
                    </button>
                  </div>
                ))
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
                <span className="text-[9px] text-violet-400 font-bold uppercase">Semana {currentSemana?.numero || 1} ({pct}%)</span>
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
                className="text-[9px] bg-violet-600/20 text-violet-400 border border-violet-500/25 px-2 py-1 rounded-xl font-bold border-none cursor-pointer"
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
          <span className="flex items-center gap-1 text-violet-400">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> Confiança
          </span>
          <span className="flex items-center gap-1 text-pink-400">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Acerto Real
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
            stroke="#8b5cf6"
            strokeWidth={1.5}
            points={confPoints}
            className="drop-shadow"
          />
          <polyline
            fill="none"
            stroke="#ec4899"
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
                fill="#8b5cf6"
                stroke="#0e0e18"
                strokeWidth={0.5}
              />
              <circle
                cx={getX(i)}
                cy={getY(d.acerto)}
                r={2.5}
                fill="#ec4899"
                stroke="#0e0e18"
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

export default function Dashboard({ onStudy, onDelete, userName, onEditName, focusMode, modoSimples, toggleModoSimples, setView }) {
  const { plat, sprint, tourStep, setTourStep, setOnboardingDone, onboardingDone } = useStore();
  const temas           = useStore((s) => s[plat]?.temas || []);
  const temaStats       = useStore((s) => s.temaStats || {});
  const meta            = useStore((s) => s.meta);

  const [showDetailedPanels, setShowDetailedPanels] = useState(false);
  const [showTourBalloon, setShowTourBalloon] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showConfettiLocal, setShowConfettiLocal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
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

  const allRev  = temasFiltrados.flatMap((t) => STEPS.map((s) => ({ ...t.rev[s.key], esp: t.esp, step: s, temaNome: t.nome, temaId: t.id, ankiDeck: t.ankiDeck })));
  const overdue = allRev.filter((r) => isOverdue(r.date)  && !r.done);
  const today_  = allRev.filter((r) => isDueToday(r.date) && !r.done);
  const done    = allRev.filter((r) => r.done);
  const pending = overdue.length + today_.length;

  const totalSessions = useMemo(() => {
    return temas.flatMap((t) => Object.values(t.rev)).filter((r) => r.done).length;
  }, [temas]);

  const doneDays = useMemo(() => new Set(done.map((r) => r.date)), [done]);
  const { current: streakCurrent, best: streakBest } = useMemo(() => calcStreaks(doneDays), [doneDays]);
  const trueRet = calcTrueRetention(temasFiltrados);
  const bleeding = calcBleedingScore(temasFiltrados);

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
    const provaAlvo = (meta?.provasAlvo || [])[0] || "ENEM";
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

  // ─── WELCOME POPUP: show once per browser session, after onboarding ─────────
  useEffect(() => {
    if (!onboardingDone) return;       // still in tour — don't show
    if (tourStep) return;              // tour in progress
    const shown = sessionStorage.getItem(SESSION_KEY);
    if (shown) return;                 // already shown this session
    const t = setTimeout(() => {
      setShowWelcome(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 600);                           // small delay so UI renders first
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingDone, tourStep]);

  const acertoMedio = useMemo(() => {
    const rs = done.filter(r => r.acerto != null);
    return rs.length ? Math.round(rs.reduce((a, r) => a + r.acerto, 0) / rs.length * 100) : null;
  }, [done]);

  const filaInteligente = useMemo(() => calcFilaInteligente(temasFiltrados, plat, meta), [temasFiltrados, plat, meta]);

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

  const diag = useMemo(() => {
    return getMentorDiagnosis(userName, temasFiltrados, done, temaStats, plat, meta);
  }, [userName, temasFiltrados, done, temaStats, plat, meta]);

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

  const concluidosHoje = useMemo(() => {
    return done.filter(r => r.date === todayStr()).length;
  }, [done]);

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

        <div className="bg-gradient-to-br from-violet-600/10 via-pink-600/5 to-purple-600/10 border border-violet-500/20 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center gap-6 shadow-xl shadow-purple-900/5 my-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30 animate-pulse">
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
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white font-bold text-[13px] transition-all hover:scale-[1.02] shadow-lg shadow-purple-900/20"
          >
            Ir para o Cronograma
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-up text-left max-w-5xl mx-auto">
      {/* 1. COMPACT SINGLE-LINE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111113] border border-white/5 rounded-2xl p-4 shadow-sm">
        {/* Left side: greeting + streak + freeze */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-black text-white tracking-tight">{greeting}, {userName}.</h1>
            <button type="button" onClick={onEditName} className="text-gray-500 hover:text-gray-300 transition-colors border-none p-0 bg-transparent cursor-pointer">
              <Edit2 size={13} />
            </button>
          </div>
          
          <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/25 px-2 py-0.5 rounded-full text-orange-400 text-[10px] font-black uppercase tracking-wider">
            🔥 {streakCurrent} {streakCurrent === 1 ? "dia" : "dias"}
          </div>

          {/* Streak Freeze Toggle */}
          {meta?.streakFreezeUsed ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Deseja recarregar seu Streak Freeze?")) {
                  resetStreakFreeze();
                }
              }}
              className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[9.5px] font-bold border border-blue-500/30 transition-all border-none cursor-pointer"
            >
              ❄️ Freeze Ativo (Reorganizar)
            </button>
          ) : meta?.streakFreezeAvailable ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Deseja usar o seu Streak Freeze semanal para proteger a ofensiva hoje?")) {
                  triggerStreakFreeze();
                }
              }}
              className="px-2 py-0.5 rounded-full bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 text-[9.5px] font-bold border border-blue-500/25 transition-all cursor-pointer"
            >
              ❄️ Proteger Ofensiva
            </button>
          ) : (
            <span className="text-[9.5px] text-gray-600 font-semibold select-none">
              ❄️ Freeze Esgotado
            </span>
          )}
        </div>

        {/* Right side: 7-day mini heatmap + exam countdown */}
        <div className="flex items-center gap-3.5 flex-wrap">
          {/* Mini weekly consistency strip */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/5 p-1 rounded-xl">
            <span className="text-[8.5px] font-bold text-gray-500 uppercase tracking-wider mr-1 select-none">Consistência:</span>
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - 6 + i);
              const dStr = d.toISOString().slice(0, 10);
              const active = doneDays.has(dStr);
              return (
                <div
                  key={i}
                  title={fmtDate(dStr)}
                  className={`w-2.5 h-2.5 rounded-sm transition-all ${
                    active
                      ? "bg-gradient-to-br from-violet-500 to-pink-500 shadow-sm shadow-purple-950/20"
                      : "bg-white/[0.04]"
                  }`}
                />
              );
            })}
          </div>

          {/* Exam countdown */}
          {daysToProva != null && (
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-2.5 py-1 rounded-xl text-gray-300 text-[10.5px] font-black">
              <span className="text-gray-500 font-bold uppercase tracking-wider text-[8.5px] select-none">Prova:</span>
              <span className={daysToProva <= 30 ? "text-red-400" : "text-violet-400"}>
                {daysToProva <= 0 ? "Hoje!" : `${daysToProva}d`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. MILESTONE CELEBRATION */}
      {showMilestoneCelebration && (
        <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Marco de Consistência!</h4>
              <p className="text-[11.5px] text-amber-400 font-medium">Você atingiu a marca de <strong className="text-white font-extrabold">{streakCurrent} dias seguidos</strong> de estudos!</p>
            </div>
          </div>
          <span className="text-[9.5px] bg-amber-500 text-black font-black px-2 py-0.5 rounded-full select-none">Incrível!</span>
        </div>
      )}

      {/* 3. 4 KPIs ABOVE THE FOLD WITH TOOLTIPS */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 select-none">
        {/* 1. Revisões Hoje */}
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-3 relative group flex flex-col justify-between">
          <div>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 cursor-help">
              Pendentes Hoje
              <Info size={10} className="text-gray-600 hover:text-gray-400 transition-colors" />
            </p>
            <p className={`text-lg font-black tabular-nums ${pending > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {pending}
            </p>
          </div>
          <div className="absolute bottom-full left-0 mb-2 w-52 bg-[#141417] border border-white/10 rounded-xl p-3 text-[10px] text-gray-400 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed">
            Total de revisões programadas pelo algoritmo de repetição espaçada FSRS para o dia atual.
          </div>
        </div>

        {/* 2. Acerto Médio */}
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-3 relative group flex flex-col justify-between">
          <div>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 cursor-help">
              Acerto Médio
              <Info size={10} className="text-gray-600 hover:text-gray-400 transition-colors" />
            </p>
            <p className={`text-lg font-black tabular-nums ${acertoMedio != null ? (acertoMedio >= 80 ? "text-emerald-400" : acertoMedio >= 65 ? "text-violet-400" : "text-red-400") : "text-gray-500"}`}>
              {acertoMedio != null ? `${acertoMedio}%` : "—"}
            </p>
          </div>
          <div className="absolute bottom-full left-0 mb-2 w-52 bg-[#141417] border border-white/10 rounded-xl p-3 text-[10px] text-gray-400 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed">
            Precisão média ponderada das questões resolvidas nas etapas D0/revisão concluídas.
          </div>
        </div>

        {/* 3. Dominados (D21) */}
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-3 relative group flex flex-col justify-between">
          <div>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 cursor-help">
              Dominados (D21)
              <Info size={10} className="text-gray-600 hover:text-gray-400 transition-colors" />
            </p>
            <p className="text-lg font-black text-emerald-400">
              {temasFiltrados.length > 0 ? `${temasFiltrados.filter(t => STEPS.every(s => t.rev[s.key].done)).length}/${temasFiltrados.length}` : "0"}
            </p>
          </div>
          <div className="absolute bottom-full left-0 mb-2 w-52 bg-[#141417] border border-white/10 rounded-xl p-3 text-[10px] text-gray-400 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed">
            Número de temas cadastrados que completaram o ciclo completo de fixação no FSRS.
          </div>
        </div>

        {/* 4. True Retention */}
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-3 relative group flex flex-col justify-between">
          <div>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 cursor-help">
              True Retention
              <Info size={10} className="text-gray-600 hover:text-gray-400 transition-colors" />
            </p>
            <p className={`text-lg font-black tabular-nums ${trueRet != null ? (trueRet >= 80 ? "text-emerald-400" : trueRet >= 65 ? "text-violet-400" : "text-red-400") : "text-gray-500"}`}>
              {trueRet != null ? `${trueRet}%` : "—"}
            </p>
          </div>
          <div className="absolute bottom-full left-0 mb-2 w-52 bg-[#141417] border border-white/10 rounded-xl p-3 text-[10px] text-gray-400 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed">
            Taxa de acerto real medida apenas em etapas com intervalos maiores de 15 dias (D21+).
          </div>
        </div>

        {/* 5. Ação Recomendada CTA (only visible on xl screens) */}
        <div className="hidden xl:flex bg-gradient-to-br from-violet-950/40 via-[#111113] to-pink-950/20 border border-violet-500/20 rounded-2xl p-3 relative overflow-hidden flex-col justify-between shadow-sm">
          <div className="absolute -right-8 -top-8 w-16 h-16 rounded-full bg-violet-600/10 blur-xl pointer-events-none" />
          <div className="min-w-0">
            <p className="text-[9px] text-violet-400 uppercase tracking-wider font-bold mb-0.5">Ação Recomendada</p>
            {pending > 0 ? (
              <>
                <h4 className="text-[11px] font-black text-white leading-tight">Você tem {pending} revisões.</h4>
                {topFilaItem && (
                  <div className="mt-1">
                    <p className="text-[10px] text-gray-300 font-semibold truncate" title={topFilaItem.temaNome}>
                      Focar: {topFilaItem.temaNome}
                    </p>
                    {topFilaItem.isOptimal && (
                      <span className="text-[8px] text-amber-400 font-extrabold uppercase tracking-wide block mt-0.5">
                        🎯 Ponto Exato de Esquecimento
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <h4 className="text-[11px] font-black text-emerald-400 leading-tight">Fila Zerada! 🎉</h4>
                <p className="text-[9.5px] text-gray-400 mt-1 leading-snug">Curva protegida.</p>
              </>
            )}
          </div>
          <div className="mt-2 shrink-0">
            {pending > 0 && topFilaItem ? (
              <button
                type="button"
                onClick={() => onStudy(topFilaItem.temaId, topFilaItem.stepKey)}
                className="w-full py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white font-black text-[9.5px] shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] border-none cursor-pointer"
              >
                ⚡ Iniciar Foco
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setView && setView("crono")}
                className="w-full py-1.5 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-400 hover:text-white border border-emerald-500/25 text-[9.5px] font-black transition-all cursor-pointer"
              >
                Novo Tema
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. ACTION CARD / QUEUE ZERO (hidden on xl screens) */}
      <div className="xl:hidden">
        {pending > 0 ? (
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 relative overflow-hidden shadow-sm">
            <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Ação Recomendada</p>
                <h2 className="text-sm font-black text-white leading-tight">Você tem {pending} revisão agendada para hoje.</h2>
                {topFilaItem && (
                  <div className="mt-0.5">
                    <p className="text-[11px] text-gray-400 truncate">
                      Sugestão de impacto: <strong className="text-violet-400 font-semibold">{topFilaItem.temaNome}</strong> ({topFilaItem.stepKey.toUpperCase()})
                    </p>
                    {topFilaItem.isOptimal && (
                      <p className="text-[10px] text-amber-400 font-bold mt-1">
                        💡 Estes itens estão no ponto exato de esquecimento - revisá-los agora rende o dobro.
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {topFilaItem && (
                <button
                  type="button"
                  onClick={() => onStudy(topFilaItem.temaId, topFilaItem.stepKey)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white font-black text-[11px] shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 border-none cursor-pointer"
                >
                  ⚡ Iniciar Foco
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#111113] border border-emerald-500/10 rounded-2xl p-5 relative overflow-hidden shadow-sm text-center flex flex-col items-center justify-center gap-3 py-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg animate-bounce select-none">
              🏆
            </div>
            <div>
              <h2 className="text-[14px] font-black text-white leading-tight">Fila Zerada! Missão Cumprida.</h2>
              <p className="text-[11px] text-gray-400 mt-0.5 max-w-sm">
                Você concluiu todas as revisões programadas pelo algoritmo para hoje. Curva de retenção protegida!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setView && setView("crono")}
              className="px-4 py-2 rounded-xl bg-emerald-600/25 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/25 text-[10px] font-black transition-all hover:scale-105 cursor-pointer"
            >
              Estudar novos temas
            </button>
          </div>
        )}
      </div>

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
            className="w-full flex items-center justify-between px-5 py-3.5 bg-[#111113] border border-white/5 rounded-2xl hover:bg-white/[0.02] transition-colors border-none text-left"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Brain size={14} className="text-violet-400" />
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
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 shadow-lg relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-emerald-600/5 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-emerald-400" />
              <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-wider">Nota Projetada</h3>
              <span className="text-[9px] text-gray-600">({(meta?.provasAlvo || [])[0] || "ENEM"})</span>
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
              !meta?.notaCorteAlvo || meta.notaCorteAlvo === 0 ? "text-violet-400"
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
                    : "bg-gradient-to-r from-violet-500 to-pink-500"
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
      <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-lg relative overflow-hidden">
        <div className="absolute -left-12 -bottom-12 w-28 h-28 rounded-full bg-cyan-600/5 blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Brain size={16} className="text-violet-400" />
            <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-wider mr-2">Diagnóstico do Mentor</h3>
            <span className="text-[9px] font-black uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">
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
                      className="bg-gradient-to-r from-violet-500 to-pink-500 h-full transition-all duration-500"
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
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-wide">🔓 Nível 7+ (Calibrado)</span>
                <p className="text-[10.5px] text-gray-400 leading-relaxed">
                  Desbloqueia análise de horário ótimo, fraquezas por especialidade e detecção de viés de confiança.
                </p>
              </div>
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                <span className="text-[10px] font-black text-pink-400 uppercase tracking-wide">🔓 Nível 30+ (Elite)</span>
                <p className="text-[10.5px] text-gray-400 leading-relaxed">
                  Desbloqueia projeção estatística de nota/aprovação com base no seu histórico e peso das provas.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-start gap-3 p-3 bg-violet-500/5 text-violet-300 border border-violet-500/10 rounded-xl mb-1">
              <span className="text-base shrink-0 mt-0.5">🧠</span>
              <p className="text-[12px] leading-relaxed font-bold">
                {totalSessions < 30 
                  ? "Já conheço seu ritmo. Ajustei a fila para seus horários de pico." 
                  : "Perfil completo. A fila agora é 100% sua."}
              </p>
            </div>
            {diag.insights.map((insight, idx) => {
              let icon = "💡";
              let colorClass = "bg-white/[0.02] text-gray-300 border border-white/5";
              if (insight.type === "alerta" || insight.type === "vies_excesso") {
                icon = "⚠️";
                colorClass = "bg-amber-500/5 text-amber-300 border border-amber-500/10";
              } else if (insight.type === "tendencia_baixa") {
                icon = "📉";
                colorClass = "bg-red-500/5 text-red-300 border border-red-500/10";
              } else if (insight.type === "tendencia_alta") {
                icon = "📈";
                colorClass = "bg-emerald-500/5 text-emerald-300 border border-emerald-500/10";
              } else if (insight.type === "horario") {
                icon = "⚡";
                colorClass = "bg-purple-500/5 text-purple-300 border border-purple-500/10";
              }
              return (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${colorClass}`}>
                  <span className="text-base shrink-0 mt-0.5">{icon}</span>
                  <p className="text-[12px] leading-relaxed font-medium">{insight.text}</p>
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
              <p className={`text-2xl font-black tabular-nums ${acertoMedio >= 80 ? "text-emerald-400" : acertoMedio >= 65 ? "text-violet-400" : "text-red-400"}`}>
                {acertoMedio}%
              </p>
            ) : (
              <button onClick={() => setView && setView("crono")} className="text-[11px] font-bold text-purple-400 hover:text-purple-300 transition-colors mt-1 block text-left">
                Iniciar tema →
              </button>
            )}
            <div className="absolute bottom-full left-0 mb-2 w-52 bg-[#141417] border border-white/10 rounded-xl p-3 text-[10px] text-gray-400 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed">
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
            <div className="absolute bottom-full left-0 mb-2 w-52 bg-[#141417] border border-white/10 rounded-xl p-3 text-[10px] text-gray-400 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed">
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
                <p className={`text-2xl font-black tabular-nums ${trueRet >= 80 ? "text-emerald-400" : trueRet >= 65 ? "text-violet-400" : "text-red-400"}`}>
                  {trueRet}%
                </p>
              ) : (
                <span className="text-[10px] text-gray-500 block mt-1">Requer D21+ concluído</span>
              )}
              <div className="absolute bottom-full left-0 mb-2 w-52 bg-[#141417] border border-white/10 rounded-xl p-3 text-[10px] text-gray-400 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed">
                Rendimento em revisões feitas em intervalos maiores (D21+). Mede o verdadeiro aprendizado de longo prazo.
              </div>
            </div>
          </ProgressiveTooltip>
        </div>
      ) : (
        /* Estado Vazio Inteligente: temas cadastrados mas nenhuma sessão iniciada */
        <div className="bg-gradient-to-br from-violet-600/8 via-transparent to-pink-600/5 border border-violet-500/15 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-xl shrink-0 shadow-lg shadow-purple-900/30">
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
            className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white font-bold text-[11.5px] transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-purple-900/20"
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
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
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
                text="Mentor: Esta é a Fila Inteligente. Ordenamos seus temas com base em um cálculo dinâmico de urgência e importância para maximizar sua retenção diária."
              >
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 shadow-sm w-full">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={15} className="text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fila de Prioridade Inteligente</h3>
                  </div>
                  {filaInteligente.length === 0 ? (
                    <p className="text-[11px] text-gray-600 italic py-3 text-center">Nenhuma pendência inteligente no momento.</p>
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
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-violet-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fila Cronológica</h3>
                </div>
                <span className="text-[10px] bg-white/5 text-gray-400 border border-white/5 px-2 py-0.5 rounded-full font-bold">
                  {pending} pendentes
                </span>
              </div>
              
              {pending === 0 ? (
                <div className="text-center text-gray-600 text-xs py-6 flex flex-col items-center gap-2">
                  <CheckCircle size={20} className="text-emerald-500 animate-pulse" /> Fila limpa por hoje!
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
                          className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[10.5px] font-semibold hover:bg-violet-500 transition-all shrink-0 active:scale-95"
                        >
                          Revisar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Estatísticas e Heatmap Colapsável */}
        {totalSessions >= 7 && (
          <div className="bg-[#111113] border border-white/5 rounded-2xl shadow-sm overflow-hidden">
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
                              ? "bg-gradient-to-br from-violet-600 to-pink-500 shadow-sm shadow-purple-900/40"
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
          onClose={() => setShowWelcome(false)}
          onStartFocus={() => {
            setShowWelcome(false);
            if (topFilaItem) {
              onStudy(topFilaItem.temaId, topFilaItem.stepKey);
            }
          }}
        />
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
              <span className="font-bold text-violet-400 block mb-1">🧠 Mentor:</span>
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
