// App.js — ReviewFlow v6
// Tailwind puro · FSRS-Lite · Dashboard com métricas de elite
// Safe-area iOS · Campo PICO/Caso Clínico · Feedback tátil · Onboarding Integrado

import React, { useState, useEffect, useCallback, useMemo } from "react";
import SessaoPage from "./components/SessaoPage";
import AuthModal from "./components/AuthModal";
import CronogramaCecilia, { CronogramaWidget } from "./components/CronogramaCecilia_MEGA";
import { monitorarAuth, sincronizarComFirebase, carregarDadosUsuario, fazerLogout } from "./firebaseAuth";
import {
  LayoutDashboard, Calendar, BarChart3, FileText, Zap, Settings,
  ChevronRight, AlertCircle, Trash2, Edit2, X, Plus, CheckCircle,
  Play, Info, ChevronLeft,
  ChevronDown, BookOpen, Check, TrendingUp, ShieldAlert, Award, EyeOff, Eye, Target
} from "lucide-react";
import {
  useStore, STEPS, ESP_COLORS, PRIO, IMPORTANCIA, ESPS_RES, ESPS_VEST, MEDCOF,
  todayStr, diffDays, fmtDate, fmtFull,
  isOverdue, isDueToday, isDueSoon,
  calcBleedingScore, calcTrueRetention,
  calcFilaInteligente, migrarSim, calcMetricasElite, calcProjecao, calcStreaks
} from "./useStore";

// ─── DADOS ESTÁTICOS DE PROVAS (V7 CONSTANTS) ────────────────────────────────
const PROVA_STATS = {
  ENAMED: {
    areas: [
      { name: "Cirurgia Geral", pct: 20 }, { name: "Clínica Médica", pct: 20 },
      { name: "Ginecologia e Obstetrícia", pct: 20 }, { name: "Pediatria", pct: 20 },
      { name: "Medicina Preventiva", pct: 20 }
    ],
    subtemasCirurgia: [
      { name: "Trauma de Tórax e Abdominal", pct: 32 }, { name: "Abdome Agudo (Inflamatório/Obstrutivo)", pct: 28 },
      { name: "Hérnias da Parede Abdominal", pct: 18 }, { name: "Cuidados Pré/Pós-Operatórios (REMIT)", pct: 14 },
      { name: "Atendimento Inicial ao Politraumatizado", pct: 8 }
    ],
    gaps2025: [
      { name: "Queimaduras Graves e Reposição Volumétrica", especialidade: "Cirurgia / Emergência", risk: "Crítico" },
      { name: "Níveis de Prevenção e Indicadores de Saúde APS", especialidade: "Preventiva", risk: "Alto" },
      { name: "Emergências Hiperglicêmicas (CAD / EHH)", especialidade: "Clínica Médica", risk: "Alto" }
    ]
  },
  "USP-SP": {
    areas: [
      { name: "Cirurgia Especializada", pct: 22 }, { name: "Clínica Médica", pct: 21 },
      { name: "Obstetrícia e Ginecologia", pct: 19 }, { name: "Pediatria Pura", pct: 18 },
      { name: "Epidemiologia e SUS", pct: 20 }
    ],
    subtemasCirurgia: [
      { name: "Atendimento Avançado no Trauma (ATLS 10)", pct: 35 }, { name: "Afecções Cirúrgicas do Esôfago e Estômago", pct: 25 },
      { name: "Abdome Agudo Vascular e Isquêmico", pct: 20 }, { name: "Cicatrização, Fios e Anestésicos Locais", pct: 12 },
      { name: "Urologia de Emergência (Escroto Agudo)", pct: 8 }
    ],
    gaps2025: [
      { name: "Trauma Cranioencefálico (TCE) e Drenagem", especialidade: "Cirurgia", risk: "Crítico" },
      { name: "Infecções Congênitas e Triagem Neonatal", especialidade: "Pediatria", risk: "Alto" }
    ]
  },
  "UNIFESP": {
    areas: [
      { name: "Cirurgia Geral e Trauma", pct: 23 }, { name: "Clínica Médica", pct: 20 },
      { name: "Saúde Coletiva", pct: 19 }, { name: "Pediatria", pct: 18 },
      { name: "Ginecologia de Alta Complexidade", pct: 20 }
    ],
    subtemasCirurgia: [
      { name: "Pancreatite Aguda e Urgências Biliares", pct: 30 }, { name: "Nódulos Hepáticos e Carcinoma Hepatocelular", pct: 25 },
      { name: "Hérnias Inguinais (Anatomia do Canal)", pct: 22 }, { name: "Apendicite Aguda e Complicações Obstrutivas", pct: 15 },
      { name: "Trombose Venosa Profunda e Profilaxia", pct: 8 }
    ],
    gaps2025: [
      { name: "Diverticulite Aguda e Classificação de Hinchey", especialidade: "Cirurgia", risk: "Crítico" },
      { name: "Nefrologia Pediátrica e Glomerulopatias", especialidade: "Pediatria", risk: "Alto" }
    ]
  }
};

// ─── STATUS HELPERS ───────────────────────────────────────────────────────────
function stepState(r) {
  if (!r) return "future";
  if (r.done)              return "done";
  if (isOverdue(r.date))   return "overdue";
  if (isDueToday(r.date))  return "today";
  if (isDueSoon(r.date))   return "soon";
  return "future";
}
const STATE_DOT = { done:"bg-emerald-500",   overdue:"bg-red-400",   today:"bg-violet-400",   soon:"bg-blue-400",   future:"bg-white/10" };
const STATE_TW  = { done: "text-emerald-400", overdue: "text-red-400", today: "text-violet-400", soon: "text-blue-400", future: "text-gray-600" };

function Badge({ color, children }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border"
      style={{ background: color + "22", color, borderColor: color + "44" }}>
      {children}
    </span>
  );
}

// ─── MEDREV LOGO ─────────────────────────────────────────────────────────────
function MedRevLogo({ collapsed = false, showTagline = false, size = "md" }) {
  const iconSizes = { sm: "w-7 h-7", md: "w-9 h-9", lg: "w-12 h-12" };
  const textSizes = { sm: "text-[13px]", md: "text-[15px]", lg: "text-[20px]" };
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-[60%] h-[60%]">
          <rect x="9" y="2" width="6" height="20" rx="2" fill="white" opacity="0.95"/>
          <rect x="2" y="9" width="20" height="6" rx="2" fill="white" opacity="0.95"/>
          <polyline points="15,13 18,10 21,12" stroke="rgba(255,180,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="18" cy="10" r="1" fill="rgba(255,200,255,0.9)"/>
        </svg>
      </div>
      {!collapsed && (
        <div>
          <p className={`${textSizes[size]} font-black tracking-tight leading-none`}>
            <span className="text-white">Med</span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Rev</span>
          </p>
          {showTagline && <p className="text-[8px] text-gray-500 tracking-[0.18em] font-semibold mt-1 uppercase">Medicina · Revisão · Performance</p>}
        </div>
      )}
    </div>
  );
}

// ─── PRIMITIVOS ───────────────────────────────────────────────────────────────
function Btn({ onClick, variant = "primary", disabled, children, className = "" }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold text-[13px] px-4 py-2 transition-all active:scale-95 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100";
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-lg shadow-purple-900/30",
    ghost:   "bg-white/8 hover:bg-white/10 text-gray-300 border border-white/10",
    danger:  "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-colors ${className}`}
      {...props}
    />
  );
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-colors resize-none ${className}`}
      {...props}
    />
  );
}

function Select({ children, className = "", ...props }) {
  return (
    <select
      className={`w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white outline-none focus:border-violet-500 cursor-pointer ${className}`}
      {...props}>
      {children}
    </select>
  );
}

function Field({ label, info, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="block text-[11px] text-gray-500 font-semibold tracking-wide uppercase">{label}</label>
        {info && <InfoTooltip texto={info} />}
      </div>
      {children}
    </div>
  );
}

function InfoTooltip({ texto }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        className="text-gray-700 hover:text-violet-400 transition-colors focus:outline-none"
      >
        <Info size={13} />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-[#1a1a1e] border border-white/15 rounded-xl p-3 text-[11px] text-gray-300 shadow-2xl z-[60] leading-relaxed pointer-events-none">
          {texto}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a1e] border-r border-b border-white/15 rotate-45 -mt-[5px]" />
        </div>
      )}
    </div>
  );
}

function HelpModal({ onClose }) {
  const [tab, setTab] = useState("secoes");
  const sections = [
    { icon: LayoutDashboard, color: "#a78bfa", title: "Dashboard", desc: "Painel central com fila cronológica, fila inteligente (score algorítmico), heatmap de consistência 35 dias, True Retention D21 e Zonas de Alerta por especialidade." },
    { icon: Calendar, color: "#60a5fa", title: "Cronograma", desc: "Grade MEDCOF 2026 completa (26 blocos, 23 especialidades). Inicie ciclos direto de um tema ou monte cronogramas semanais com criação manual ou importação de PDF." },
    { icon: BarChart3, color: "#34d399", title: "Banco de Dados", desc: "Tabela de todos os temas. Ordene por nome, progresso, questões ou acerto. Exporte em CSV para análise externa." },
    { icon: FileText, color: "#f472b6", title: "Estatísticas", desc: "Análise de provas-alvo (ENAMED, USP-SP, UNIFESP) com incidência por área e tópicos de risco 2026. Inclui aba 'Meu Desempenho' com seus dados pessoais." },
    { icon: Target, color: "#fb923c", title: "Simulados", desc: "Registre práticas e simulados. Acompanhe a evolução do percentual, gerencie correção D7 de erros, veja diagnóstico por área e métricas de elite (índice de descuido, taxa de conversão)." },
    { icon: Zap, color: "#fbbf24", title: "Anki Audit", desc: "Monitore a calibração do Anki. Registre sessões e acompanhe a taxa de 'Again' — ideal abaixo de 15% para retenção de longo prazo." },
  ];
  const workflow = [
    { step: "D0", icon: BookOpen, color: "#a78bfa", label: "Estudo Inicial", desc: "Leia o conteúdo, resolva questões e registre o acerto. O FSRS-Lite calcula automaticamente a data das próximas revisões." },
    { step: "D1", icon: Edit2, color: "#60a5fa", label: "Brain Dump", desc: "No dia seguinte, abra o assistente e escreva tudo que lembra (5 min, material fechado). Isso consolida a memória de trabalho para longo prazo." },
    { step: "D4", icon: Target, color: "#34d399", label: "Revisão Ativa", desc: "Questões focadas no tema. Seu acerto ajusta o intervalo da próxima revisão via curva de esquecimento." },
    { step: "D7", icon: TrendingUp, color: "#fb923c", label: "Questões + Anki", desc: "Sétimo dia: questões de prova + revisão do deck Anki correspondente. Corrija os erros do simulado se houver." },
    { step: "D21", icon: Award, color: "#f472b6", label: "Interleaved", desc: "Revisão misturada com outros temas. Maior intervalo = maior retenção. Após D21, o ciclo está completo." },
  ];
  return (
    <Modal onClose={onClose} wide>
      <div className="space-y-4 text-left">
        <div className="flex items-center gap-3">
          <MedRevLogo size="md" />
          <div>
            <h2 className="text-[16px] font-bold text-white">Guia de Uso</h2>
            <p className="text-[11px] text-gray-500">Motor FSRS-Lite · v7.1</p>
          </div>
        </div>

        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          {[["secoes","Seções"], ["fluxo","Fluxo FSRS"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold transition-all ${tab === k ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "text-gray-500 hover:text-gray-300"}`}>{l}</button>
          ))}
        </div>

        {tab === "secoes" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sections.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: s.color + "20" }}>
                    <Icon size={15} style={{ color: s.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-white">{s.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "fluxo" && (
          <div className="flex flex-col gap-2">
            {workflow.map((w, i) => {
              const Icon = w.icon;
              return (
                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: w.color + "20" }}>
                    <Icon size={14} style={{ color: w.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded" style={{ background: w.color + "20", color: w.color }}>{w.step}</span>
                      <p className="text-[13px] font-bold text-gray-200">{w.label}</p>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{w.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Btn className="w-full" onClick={onClose}>Entendido — vamos estudar!</Btn>
      </div>
    </Modal>
  );
}

// ─── MODAL PRIMITIVO ──────────────────────────────────────────────────────────
function Modal({ children, onClose, wide = false }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div
        className={`bg-[#111113] border border-white/10 rounded-2xl p-6 w-full ${wide ? "max-w-xl" : "max-w-sm"} max-h-[92vh] flex flex-col gap-4 animate-slide-up overflow-y-auto relative`}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

// ─── TOAST / UNDO ─────────────────────────────────────────────────────────────
function Toast({ toast, onUndo, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);
  if (!toast) return null;
  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#111113] border border-white/10 rounded-2xl px-5 py-3 shadow-2xl shadow-black/80 min-w-[260px] max-w-sm animate-fade-up">
      <span className="text-[13px] text-gray-100 flex-1">{toast.msg}</span>
      {toast.undo && (
        <button onClick={onUndo} className="text-violet-400 font-bold text-[12px] hover:text-violet-300 shrink-0 transition-colors">
          Desfazer
        </button>
      )}
      <button onClick={onDismiss} className="text-gray-600 hover:text-gray-300 transition-colors shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

// ─── CONFETTI OVERLAY ──────────────────────────────────────────────────────────
function ConfettiOverlay() {
  const pieces = useMemo(() => {
    const colors = ["#ec4899", "#a855f7", "#8b5cf6", "#fb923c", "#fbbf24", "#34d399"];
    return Array.from({ length: 20 }, () => ({
      id: Math.random(),
      left: Math.random() * 100,
      delay: Math.random() * 0.2,
      duration: 2.5 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      swayAmount: -20 + Math.random() * 40,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards, confetti-sway ${p.duration * 0.6}s ease-in-out ${p.delay}s forwards`,
            "--sway-amount": `${p.swayAmount}px`,
          }}
        />
      ))}
    </div>
  );
}

// ─── CYCLE COMPLETE MODAL ──────────────────────────────────────────────────────
function CycleCompleteModal({ tema, onClose }) {
  const done = Object.values(tema.rev).filter(r => r.done && r.acerto != null);
  const avgAcerto = done.length ? Math.round(done.reduce((a, r) => a + r.acerto, 0) / done.length * 100) : 0;

  return (
    <Modal onClose={onClose}>
      <div className="text-center py-6">
        <p className="text-6xl mb-4">🎉</p>
        <h2 className="text-2xl font-black text-white mb-2">Ciclo Completo!</h2>
        <p className="text-gray-400 text-sm mb-4">Você completou todos os passos de <span className="text-violet-400 font-bold">{tema.nome}</span></p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Acerto Médio do Ciclo</p>
          <p className={`text-3xl font-black ${avgAcerto >= 80 ? "text-emerald-400" : avgAcerto >= 65 ? "text-violet-400" : "text-red-400"}`}>
            {avgAcerto}%
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white rounded-xl font-bold text-[13px] transition-all">
          Continuar
        </button>
      </div>
    </Modal>
  );
}

// ─── ONBOARDING MODAL (V7 — SETUP COMPLETO) ──────────────────────────────────
function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [plataforma, setPlataforma] = useState("res");
  const [dataProva, setDataProva] = useState("2026-10-25");
  const [metaAcerto, setMetaAcerto] = useState(85);
  const TOTAL_STEPS = 5;

  const next = () => {
    if (step === 2 && !nome.trim()) return;
    if (step < TOTAL_STEPS) setStep(step + 1);
    else onComplete(nome.trim() || "Estudante", plataforma, { dataProva, acerto: metaAcerto });
  };
  const prev = () => { if (step > 1) setStep(step - 1); };

  return (
    <div className="fixed inset-0 bg-[#05050d]/97 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-[#0d0d18] border border-white/10 rounded-3xl p-6 w-full max-w-md flex flex-col gap-5 shadow-2xl shadow-purple-900/20 animate-slide-up">

        {/* Progress bar */}
        <div className="flex gap-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < step ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/10"}`} />
          ))}
        </div>

        <div className="flex flex-col items-center text-center gap-4 py-1 min-h-[340px]">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="mt-2">
                <MedRevLogo size="lg" showTagline />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mt-3">Bem-vindo ao MedRev</h2>
                <p className="text-[13px] text-gray-400 mt-2 leading-relaxed">
                  O sistema de performance científica para quem leva a residência médica a sério.
                </p>
              </div>
              <div className="w-full flex flex-col gap-2 mt-1">
                {[
                  { icon: "🧠", text: "Algoritmo FSRS-Lite com espaçamento por curva de esquecimento" },
                  { icon: "📊", text: "Métricas de elite: True Retention, Bleeding Score e Elite Analytics" },
                  { icon: "🎯", text: "Fila inteligente priorizada por importância × urgência × acerto" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl text-left">
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <p className="text-[12px] text-gray-300 leading-tight">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Name */}
          {step === 2 && (
            <div className="w-full flex flex-col items-center gap-4 mt-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20">
                👋
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-1">Como te chamamos?</h2>
                <p className="text-[12px] text-gray-400">Personalizamos a experiência para você.</p>
              </div>
              <Input
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && nome.trim() && next()}
                placeholder="Seu primeiro nome"
                className="text-center text-sm py-3 max-w-xs"
              />
            </div>
          )}

          {/* Step 3: Platform */}
          {step === 3 && (
            <div className="w-full flex flex-col items-center gap-4 mt-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">
                🎯
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-1">Qual o seu foco?</h2>
                <p className="text-[12px] text-gray-400">Define especialidades e currículo do painel.</p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button onClick={() => setPlataforma("res")} className={`p-4 rounded-2xl border text-left transition-all ${plataforma === "res" ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-900/20" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏥</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-white">Residência Médica</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Cirurgia · Clínica · GO · Pediatria · Preventiva</p>
                    </div>
                    {plataforma === "res" && <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shrink-0" />}
                  </div>
                </button>
                <button onClick={() => setPlataforma("vest")} className={`p-4 rounded-2xl border text-left transition-all ${plataforma === "vest" ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-900/20" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📚</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-white">Vestibular / ENEM</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Exatas · Humanas · Linguagens · Natureza · Redação</p>
                    </div>
                    {plataforma === "vest" && <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shrink-0" />}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Configuration */}
          {step === 4 && (
            <div className="w-full flex flex-col items-center gap-4 mt-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20">
                ⚙️
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-1">Configure suas metas</h2>
                <p className="text-[12px] text-gray-400">Usamos para calcular urgência e projeção.</p>
              </div>
              <div className="flex flex-col gap-4 w-full">
                <Field label="Data da prova">
                  <Input type="date" value={dataProva} onChange={(e) => setDataProva(e.target.value)} />
                </Field>
                <div>
                  <div className="flex justify-between items-baseline mb-2.5">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Meta de acerto</span>
                    <span className={`text-2xl font-black tabular-nums ${metaAcerto >= 85 ? "text-emerald-400" : metaAcerto >= 70 ? "text-yellow-400" : "text-red-400"}`}>{metaAcerto}%</span>
                  </div>
                  <input type="range" min={50} max={100} step={5} value={metaAcerto}
                    onChange={(e) => setMetaAcerto(+e.target.value)}
                    className="w-full accent-purple-500 cursor-pointer h-1" />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-700">50%</span>
                    <span className="text-[10px] text-gray-700">100%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: FSRS Explanation */}
          {step === 5 && (
            <div className="w-full flex flex-col items-center gap-4 mt-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-violet-500/20">
                🚀
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-1">Tudo pronto{nome ? `, ${nome}` : ""}!</h2>
                <p className="text-[12px] text-gray-400">O ciclo de revisão funciona assim:</p>
              </div>
              <div className="flex flex-col gap-2 w-full text-left">
                {[
                  { step: "D0", emoji: "📖", label: "Estude + resolva questões, marque o acerto" },
                  { step: "D1", emoji: "✍️", label: "Brain dump de memória (5 min, sem material)" },
                  { step: "D4", emoji: "📝", label: "Revisão ativa com questões focadas no tema" },
                  { step: "D7", emoji: "🔄", label: "Questões + Anki + corrija erros do simulado" },
                  { step: "D21", emoji: "🎯", label: "Revisão interleaved — ciclo completo!" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3 p-2.5 bg-white/[0.03] border border-white/5 rounded-xl">
                    <span className="text-base shrink-0">{item.emoji}</span>
                    <span className="text-[10px] font-black font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded shrink-0">{item.step}</span>
                    <p className="text-[12px] text-gray-300 leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {step > 1 && (
            <Btn variant="ghost" onClick={prev} className="flex-none px-4">←</Btn>
          )}
          <Btn className="flex-1" onClick={next} disabled={step === 2 && !nome.trim()}>
            {step === TOTAL_STEPS ? "🚀 Entrar no MedRev" : "Continuar →"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── REFLEXÃO MODAL (V6) ──────────────────────────────────────────────────────
// ─── MARK MODAL (V6) ──────────────────────────────────────────────────────────
function MarkModal({ tema, stepKey, onConfirm, onCancel }) {
  const step    = STEPS.find((s) => s.key === stepKey);
  const [acerto,   setAcerto]   = useState(75);
  const [questoes, setQuestoes] = useState("");
  const [motivos, setMotivos]   = useState([]);
  const isD1  = step.checkbox;
  const col   = acerto >= 90 ? "text-emerald-400" : acerto >= 75 ? "text-violet-400" : acerto >= 55 ? "text-yellow-400" : "text-red-400";
  const label = acerto >= 90 ? "Domínio sólido 🎯" : acerto >= 75 ? "Bom progresso" : acerto >= 55 ? "Em consolidação" : "Ponto fraco — revise mais";

  const tiposErro = [
    { k: "lacuna", l: "Lacuna de Conteúdo" },
    { k: "raciocinio", l: "Erro de Raciocínio" },
    { k: "distractor", l: "Caiu em Distrator" },
    { k: "descuido", l: "Falta de Atenção / Descuido" },
    { k: "nao_visto", l: "Conteúdo Não Visto" }
  ];

  const toggleMotivo = (k) => {
    if (motivos.includes(k)) setMotivos(motivos.filter(m => m !== k));
    else setMotivos([...motivos, k]);
  };

  return (
    <Modal onClose={onCancel}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 font-black text-[13px] shrink-0">
          {step.label}
        </div>
        <div>
          <p className="text-[14px] font-bold text-gray-100">{step.desc}</p>
          <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">{tema.nome}</p>
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {isD1 ? (
        <div className="text-center py-3">
          <div className="text-4xl mb-3">✍️</div>
          <p className="text-[13px] text-gray-400 leading-relaxed">
            Brain dump escrito de 5 min, material fechado.<br />Você fez?
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Field label="Questões resolvidas nesta sessão">
            <Input type="number" value={questoes} onChange={(e) => setQuestoes(e.target.value)} placeholder="ex: 30" />
          </Field>
          <div>
            <div className="flex justify-between items-baseline mb-2.5">
              <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">% de acerto</span>
              <span className={`text-3xl font-black font-mono tabular-nums ${col}`}>{acerto}%</span>
            </div>
            <input type="range" min={0} max={100} value={acerto}
              onChange={(e) => setAcerto(+e.target.value)}
              className="w-full accent-violet-500 h-1 cursor-pointer" />
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-gray-700">0%</span>
              <span className={`text-[11px] font-semibold ${col}`}>{label}</span>
              <span className="text-[10px] text-gray-700">100%</span>
            </div>
          </div>

          {acerto < 75 && (
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 animate-fade-up">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mb-2">🔍 Auditoria de Causa de Erros:</p>
              <div className="flex flex-col gap-1.5">
                {tiposErro.map(t => (
                  <label key={t.k} className="flex items-center gap-2 text-[12px] text-gray-300 cursor-pointer select-none">
                    <input type="checkbox" checked={motivos.includes(t.k)} onChange={() => toggleMotivo(t.k)} className="rounded border-white/20 text-violet-600 focus:ring-violet-500 bg-black" />
                    {t.l}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Btn className="flex-1"
          onClick={() => onConfirm({ acerto: isD1 ? null : acerto / 100, questoes: questoes ? +questoes : null, motivosErro: motivos })}>
          ✓ Confirmar
        </Btn>
        <Btn variant="ghost" className="flex-1" onClick={onCancel}>Cancelar</Btn>
      </div>
    </Modal>
  );
}

// ─── TEMA MODAL (V6) ──────────────────────────────────────────────────────────
function TemaModal({ initial, platKey, onSave, onCancel, onDelete }) {
  const esps = platKey === "res" ? ESPS_RES : ESPS_VEST;
  const [f, setF] = useState(
    initial || { nome: "", esp: esps[0], d0: todayStr(), prio: "Alta", importancia: "ALTA", obs: "", pico: "", ankiDeck: "" }
  );

  return (
    <Modal onClose={onCancel}>
      <h2 className="text-[15px] font-bold text-gray-100">{initial ? "Editar tema" : "Novo tema"}</h2>

      <Field label="Nome do tema">
        <Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="ex: Trauma de Tórax" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Área">
          <Select value={f.esp} onChange={(e) => setF({ ...f, esp: e.target.value })}>
            {esps.map((e) => <option key={e}>{e}</option>)}
          </Select>
        </Field>
        <Field label="Data D0">
          <Input type="date" value={f.d0} onChange={(e) => setF({ ...f, d0: e.target.value })} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-1.5">Prioridade</p>
          <Select value={f.prio} onChange={(e) => setF({ ...f, prio: e.target.value })}>
            {Object.keys(PRIO).map((k) => <option key={k}>{k}</option>)}
          </Select>
        </div>
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-1.5">Importância Prova</p>
          <div className="flex gap-1 bg-black border border-white/10 rounded-xl p-0.5">
            {Object.entries(IMPORTANCIA).map(([k, v]) => (
              <button type="button" key={k} onClick={() => setF({ ...f, importancia: k })}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${f.importancia === k ? "bg-white/10 text-white" : "text-gray-500"}`}>
                {v.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Field label="Deck do Anki Correspondente (opcional)">
        <Input value={f.ankiDeck || ""} onChange={(e) => setF({ ...f, ankiDeck: e.target.value })} placeholder="ex: Medicina::Cirurgia::Trauma" />
      </Field>

      <Field label="PICO / Caso Clínico (opcional)">
        <Textarea
          rows={2}
          value={f.pico || ""}
          onChange={(e) => setF({ ...f, pico: e.target.value })}
          placeholder="ex: Paciente 25a, dor periumbilical migratória, febre leve. Conduta inicial?"
        />
      </Field>

      <Field label="Fonte / obs (opcional)">
        <Input value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} placeholder="ex: MEDCOF Bloco 2" />
      </Field>

      <div className="flex gap-2 pt-1">
        <Btn className="flex-1" onClick={() => f.nome && onSave(f)} disabled={!f.nome}>Salvar</Btn>
        <Btn variant="ghost" className="flex-1" onClick={onCancel}>Cancelar</Btn>
        {initial && <Btn variant="danger" onClick={() => { if (window.confirm(`Deletar "${initial.nome}"? Esta ação não pode ser desfeita facilmente.`)) onDelete(initial.id); }}><Trash2 size={16} /></Btn>}
      </div>
    </Modal>
  );
}

// ─── AJUSTES MODAL (V6) ───────────────────────────────────────────────────────
function AjustesModal({ onClose, overdueCount, onResetOnboarding }) {
  const { meta, setMeta, plat, optimize, sprint, setSprint } = useStore();
  const esps = plat === "res" ? ESPS_RES : ESPS_VEST;
  const daysLeft = meta.dataProva ? diffDays(todayStr(), meta.dataProva) : null;
  const urgency  = daysLeft == null ? "" : daysLeft <= 30 ? "text-red-400" : daysLeft <= 90 ? "text-yellow-400" : "text-violet-400";

  const toggleSprintEsp = (esp) => {
    const currentEsps = sprint?.esps || [];
    if (currentEsps.includes(esp)) {
      setSprint({ ...sprint, esps: currentEsps.filter(e => e !== esp) });
    } else {
      setSprint({ ...sprint, esps: [...currentEsps, esp] });
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-gray-100">⚙ Ajustes</h2>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-lg transition-colors">✕</button>
      </div>

      <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">🎯 Metas</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data da prova">
            <Input type="date" value={meta.dataProva} onChange={(e) => setMeta({ ...meta, dataProva: e.target.value })} />
          </Field>
          <Field label="Meta de acerto (%)">
            <Input type="number" min={50} max={100} value={meta.acerto} onChange={(e) => setMeta({ ...meta, acerto: +e.target.value })} />
          </Field>
        </div>
        {daysLeft != null && (
          <p className="text-[12px] text-gray-500">
            Faltam <strong className={urgency}>{daysLeft} dias</strong> · {fmtFull(meta.dataProva)}
          </p>
        )}
      </div>

      {/* Módulo Volátil Sprint Semanal Focado */}
      <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
          <span>🏃‍♂️ Sprint Semanal de Foco</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${sprint?.ativa ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-500"}`}>
            {sprint?.ativa ? "ATIVO" : "INATIVO"}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Input placeholder="Nome da Sprint (ex: Semana 1)" value={sprint?.semana || ""} onChange={(e) => setSprint({ ...sprint, semana: e.target.value })} className="flex-1" />
          <button onClick={() => setSprint({ ...sprint, ativa: !sprint?.ativa })}
            className={`px-3 py-2 rounded-xl text-[12px] font-bold transition-all ${sprint?.ativa ? "bg-red-600/20 text-red-400 border border-red-600/30" : "bg-violet-600 text-white"}`}>
            {sprint?.ativa ? "Desativar" : "Ativar"}
          </button>
        </div>
        <p className="text-[10px] text-gray-500">Filtrar painel para estas especialidades foco:</p>
        <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto border border-white/5 p-2 rounded-xl bg-black/40">
          {esps.map(esp => (
            <label key={esp} className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer">
              <input type="checkbox" checked={sprint?.esps?.includes(esp) || false} onChange={() => toggleSprintEsp(esp)} className="rounded border-white/20 text-violet-600 focus:ring-violet-500 bg-black" />
              <span className="truncate">{esp}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">⚡ Reordenar ciclo</p>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          Reagenda revisões vencidas preservando os tempos algorítmicos.
          {overdueCount > 0 ? <> Você tem <strong className="text-red-400">{overdueCount} vencidas</strong>.</> : " Tudo regularizado."}
        </p>
        <Btn onClick={() => { optimize(plat); onClose(); }} disabled={overdueCount === 0} className="w-full">
          Otimizar Filas {overdueCount > 0 ? `(${overdueCount})` : ""}
        </Btn>
      </div>

      <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ℹ️ Tutoriais</p>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          Reveja o guia de onboarding e aprenda mais sobre como usar o MedRev.
        </p>
        <Btn variant="ghost" onClick={() => { onResetOnboarding(); onClose(); }} className="w-full">
          Ver Guia de Boas-vindas
        </Btn>
      </div>
    </Modal>
  );
}

// ─── CRONO CARD ───────────────────────────────────────────────────────────────
// ─── CRONO CARD ───────────────────────────────────────────────────────────────
function CronoCard({ tema, onStep, onEdit, onIniciarTema }) {
  const esp     = ESP_COLORS[tema.esp] || "#94a3b8";
  const allDone = STEPS.every((s) => tema.rev[s.key].done);
  const next    = STEPS.find((s) => !tema.rev[s.key].done);
  const nextState = next ? stepState(tema.rev[next.key]) : "done";
  const imp     = IMPORTANCIA[tema.importancia || "ALTA"];

  return (
    <div
      className={`bg-[#111113] border border-white/5 rounded-3xl overflow-hidden transition-all text-left ${allDone ? "opacity-50" : "hover:border-white/10 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]"}`}
      style={{ borderLeft: `4px solid ${esp}` }}
      onClick={() => next && onStep(tema.id, next.key)}>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500 truncate">{tema.esp}</p>
              {imp && <Badge color={imp.color}>{imp.label}</Badge>}
            </div>
            <p className="text-lg font-semibold text-gray-100 leading-tight line-clamp-2">{tema.nome}</p>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(tema); }}
            className="w-8 h-8 rounded-full border border-white/10 bg-black hover:border-white/30 transition-colors flex items-center justify-center shrink-0">
            <Edit2 size={14} className="text-gray-400 hover:text-white" />
          </button>
        </div>
        {tema.pico && (
          <p className="text-[11px] text-gray-400 italic leading-relaxed line-clamp-3 border-l-2 pl-3" style={{ borderColor: esp + "66" }}>
            {tema.pico}
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex gap-1.5">
            {STEPS.map((s) => {
              const st2 = stepState(tema.rev[s.key]);
              return <div key={s.key} title={`${s.label} · ${s.desc}`} className={`flex-1 h-2 rounded-full transition-all ${tema.rev[s.key].done ? "bg-emerald-500" : STATE_DOT[st2]}`} />;
            })}
          </div>
          <span className={`text-[11px] font-semibold ${STATE_TW[nextState]}`}>RO: {next ? next.label : "Fixação"}</span>
        </div>
      </div>
    </div>
  );
}

function Cronograma({ onStep, onEdit, onIniciarTema }) {
  const { plat } = useStore();
  const temas = useStore((s) => s[plat].temas);
  const [q, setQ]         = useState("");
  const [filter, setFilter] = useState("todos");
  const [impFilter, setImpFilter] = useState("TODAS");

  const temaMap = new Map(temas.map((t) => [t.nome, t]));

  return (
    <div className="flex flex-col gap-5 animate-fade-up text-left">
      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Buscar tema..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-[200px]" />
        <div className="flex gap-1 bg-[#111113] border border-white/5 rounded-xl p-1">
          {[["todos","Todos"],["iniciados","Iniciados"],["nao","Não iniciados"]].map(([v, l]) => (
            <button type="button" key={v} onClick={() => setFilter(v)} className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold ${filter === v ? "bg-violet-600 text-white" : "text-gray-500"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#111113] border border-white/5 rounded-xl p-1">
          {["TODAS", "CRITICA", "ALTA", "MEDIA"].map((imp) => (
            <button type="button" key={imp} onClick={() => setImpFilter(imp)} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${impFilter === imp ? "bg-white/10 text-white" : "text-gray-600"}`}>
              {imp === "TODAS" ? "Todas" : IMPORTANCIA[imp]?.icon}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Btn onClick={() => onEdit({})} className="text-[12px] gap-2"><Plus size={16} /> Novo tema</Btn>
      </div>

      {MEDCOF.map((bl) => {
        const blTemas = bl.t.filter(([nome, , , impEst]) => {
          if (q && !nome.toLowerCase().includes(q.toLowerCase())) return false;
          const mTema = temaMap.get(nome);
          const currentImp = mTema ? mTema.importancia : (impEst || "ALTA");
          if (impFilter !== "TODAS" && currentImp !== impFilter) return false;
          const ativo = temaMap.has(nome);
          if (filter === "iniciados" && !ativo) return false;
          if (filter === "nao" && ativo) return false;
          return true;
        });
        if (blTemas.length === 0) return null;

        return (
          <div key={bl.b} className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400">Bloco {bl.b}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {blTemas.map(([nome, esp, prio]) => {
                const tema = temaMap.get(nome);
                if (tema) return <CronoCard key={nome} tema={tema} onStep={onStep} onEdit={onEdit} onIniciarTema={onIniciarTema} />;

                const espC  = ESP_COLORS[esp] || "#94a3b8";
                return (
                  <div key={nome} className="bg-[#111113]/60 rounded-3xl p-5 flex flex-col gap-4 border border-white/5 border-dashed" style={{ borderLeft: `4px dashed ${espC}` }}>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-1">{esp}</p>
                      <p className="text-[14px] font-semibold text-gray-300 line-clamp-2">{nome}</p>
                    </div>
                    <button type="button" onClick={() => onIniciarTema({ nome, esp, prio, importancia: "ALTA", obs: `MEDCOF Bloco ${bl.b}` })}
                      className="w-full py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-violet-600/20 text-[12px] font-bold text-violet-400 flex items-center justify-center gap-1.5">
                      <Play size={13} /> Iniciar Ciclo Hoje
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PÁGINAS
// ═════════════════════════════════════════════════════════════════════════════

/* DASHBOARD (V6) ───────────────────────────────────────────────────────────── */// ─── DASHBOARD ───────────────────────────────────────────────────
function Dashboard({ onStudy, onDelete, userName, onEditName, focusMode, concluidosHoje, totalFilaHoje }) {
  const { plat, sprint }  = useStore();
  const temas           = useStore((s) => s[plat].temas);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const temasFiltrados = useMemo(() => {
    if (sprint?.ativa && sprint?.esps?.length > 0) return temas.filter(t => sprint.esps.includes(t.esp));
    return temas;
  }, [temas, sprint]);

  const allRev  = temasFiltrados.flatMap((t) => STEPS.map((s) => ({ ...t.rev[s.key], esp: t.esp, step: s, temaNome: t.nome, temaId: t.id, ankiDeck: t.ankiDeck })));
  const overdue = allRev.filter((r) => isOverdue(r.date)  && !r.done);
  const today_  = allRev.filter((r) => isDueToday(r.date) && !r.done);
  const done    = allRev.filter((r) => r.done);
  const pending = overdue.length + today_.length;

  const totalQ    = done.reduce((a, r) => a + (r.questoes || 0), 0);
  const doneDays = new Set(done.map((r) => r.date));
  const { current: streakCurrent, best: streakBest } = useMemo(() => calcStreaks(doneDays), [doneDays]);
  const trueRet = calcTrueRetention(temasFiltrados);
  const bleeding = calcBleedingScore(temasFiltrados);

  const acertoMedio = useMemo(() => {
    const rs = done.filter(r => r.acerto != null);
    return rs.length ? Math.round(rs.reduce((a, r) => a + r.acerto, 0) / rs.length * 100) : null;
  }, [done]);

  const emBreve = useMemo(
    () => allRev.filter(r => isDueSoon(r.date) && !r.done).length,
    [allRev]
  );
  const filaInteligente = useMemo(() => calcFilaInteligente(temasFiltrados).slice(0, 5), [temasFiltrados]);

  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 34 + i);
    return d.toISOString().slice(0, 10);
  });

  const espAbbr = (esp) => {
    const map = { "Cirurgia": "CI", "Clínica Médica": "CM", "GO": "GO", "Pediatria": "PE", "Preventiva": "PR" };
    return map[esp] || esp.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-up text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {userName}.</h1>
          <button type="button" onClick={onEditName} className="text-gray-500 hover:text-gray-300 transition-colors">
            <Edit2 size={18} />
          </button>
        </div>
      </div>

      {/* Streak Banner */}
      {streakCurrent > 0 ? (
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="text-5xl">🔥</div>
          <div>
            <p className="text-sm text-gray-400">Sequência</p>
            <p className="text-2xl font-black text-orange-400">{streakCurrent} dias seguidos</p>
          </div>
        </div>
      ) : streakBest > 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-gray-500 text-sm">
          Sua melhor sequência foi <span className="font-bold text-violet-400">{streakBest} dias</span>. Comece uma nova hoje!
        </div>
      ) : null}

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative group">
          <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
            Acerto Médio
            <button className="text-gray-600 hover:text-gray-400"><Info size={13} /></button>
          </p>
          <p className={`text-3xl font-black tabular-nums ${acertoMedio == null ? "text-gray-600" : acertoMedio >= 80 ? "text-emerald-400" : acertoMedio >= 65 ? "text-violet-400" : "text-red-400"}`}>
            {acertoMedio != null ? `${acertoMedio}%` : "—"}
          </p>
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1a1e] border border-white/15 rounded-xl p-2.5 text-[10px] text-gray-300 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            Taxa média de acerto em todas as revisões. Melhora conforme você completa ciclos FSRS.
          </div>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative group">
          <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
            Dominados
            <button className="text-gray-600 hover:text-gray-400"><Info size={13} /></button>
          </p>
          <p className="text-3xl font-black text-emerald-400">{temasFiltrados.filter(t => STEPS.every(s => t.rev[s.key].done)).length}/{temasFiltrados.length}</p>
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1a1e] border border-white/15 rounded-xl p-2.5 text-[10px] text-gray-300 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            Número de temas com todos os ciclos (D0→D21) completados.
          </div>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative group">
          <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
            Em Breve
            <button className="text-gray-600 hover:text-gray-400"><Info size={13} /></button>
          </p>
          <p className={`text-3xl font-black tabular-nums ${emBreve > 0 ? "text-cyan-400" : "text-gray-600"}`}>
            {emBreve > 0 ? `+${emBreve}` : "0"}
          </p>
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1a1e] border border-white/15 rounded-xl p-2.5 text-[10px] text-gray-300 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            Temas agendados para revisão nos próximos 3 dias.
          </div>
        </div>
      </div>

      {temasFiltrados.length === 0 && (
        <div className="bg-gradient-to-br from-violet-500/10 to-pink-500/5 border border-violet-500/20 rounded-2xl p-6 flex flex-col gap-4 text-center">
          <div className="text-3xl">🎯</div>
          <div>
            <p className="text-[15px] font-bold text-white">Tudo pronto! Agora inicie seu primeiro tema.</p>
            <p className="text-[12px] text-gray-400 mt-1">Vá em <strong className="text-violet-400">Cronograma</strong> e clique em <strong className="text-violet-400">"Iniciar Ciclo Hoje"</strong> em qualquer tema para começar.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`${focusMode ? "lg:col-span-12" : "lg:col-span-8"} flex flex-col gap-5`}>
          {!focusMode && (
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Fila Padrão Diária</p>
                  <div className="flex items-end gap-2">
                    <span className={`text-[56px] font-black leading-none tabular-nums ${pending > 0 ? "text-white" : "text-emerald-400"}`}>{pending}</span>
                    <span className="text-[14px] text-gray-500 mb-2">pendentes</span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center gap-1">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Questões Concluídas</p>
                  <p className="text-[22px] font-black text-violet-400 tabular-nums leading-none">{totalQ > 0 ? totalQ.toLocaleString("pt-BR") : "0"}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-400" />
              <h3 className="text-[13px] font-bold text-white">Fila de Prioridade Inteligente (Score Algorítmico)</h3>
            </div>
            {filaInteligente.length === 0 ? (
              <p className="text-[12px] text-gray-600 italic py-4 text-center">Nenhuma recomendação prioritária no momento.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {filaInteligente.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded">Score: {item.score}</span>
                        <p className="text-[13px] font-bold text-gray-200 truncate">{item.temaNome}</p>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.esp} · Etapa {item.step.label}</p>
                    </div>
                    <button type="button" onClick={() => onStudy(item.temaId, item.stepKey)} className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold transition-all">
                      Focar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-[13px] font-bold text-white">Fila Cronológica Diária</h3>
            {pending === 0 ? (
              <div className="text-center text-gray-600 text-[13px] py-6 flex flex-col items-center gap-2">
                <CheckCircle size={24} className="text-emerald-400" /> Meta batida por hoje!
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/5">
                {[...overdue, ...today_].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0" style={{ background: (ESP_COLORS[r.esp] || "#94a3b8") + "22", color: ESP_COLORS[r.esp] }}>
                      {espAbbr(r.esp)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-white truncate">{r.temaNome}</p>
                      <p className="text-[11px] text-gray-500 uppercase font-mono mt-0.5">{r.step.label} · {r.step.desc}</p>
                    </div>
                    <button type="button" onClick={() => onStudy(r.temaId, r.step.key)} className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-[11px] font-semibold hover:bg-violet-500">
                      Revisar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <CronogramaWidget />
        </div>

        {!focusMode && (
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold">Consistência Diária</p>
              <div className="grid grid-cols-7 gap-1.5">
                {days.map((d) => <div key={d} className={`aspect-square rounded-sm ${doneDays.has(d) ? "bg-violet-500" : "bg-white/[0.04]"}`} />)}
              </div>
            </div>

            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-[10.5px] text-gray-500 uppercase font-semibold">True Retention (D21)</p>
              <span className="text-3xl font-black text-emerald-400">{trueRet != null ? `${trueRet}%` : "—"}</span>
            </div>

            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-[10.5px] text-gray-500 uppercase font-semibold">Zonas de Alerta Crítico</p>
              {bleeding.map(b => (
                <div key={b.esp} className="flex justify-between p-1.5 border border-red-500/10 rounded-lg bg-red-500/[0.01]">
                  <span className="text-[12px] text-gray-300">{b.esp}</span>
                  <span className="text-[12px] font-black text-red-400">{b.acc}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* BANCO DE DADOS ─────────────────────────────────────────────────────────────── */
function BancoDados() {
  const { plat } = useStore();
  const temas    = useStore((s) => s[plat].temas);
  const [sort, setSort] = useState("nome");
  const [q, setQ]       = useState("");

  const rows = temas
    .filter((t) => !q || t.nome.toLowerCase().includes(q.toLowerCase()))
    .map((t) => {
      const done    = STEPS.filter((s) => t.rev[s.key].done);
      const questoes= done.reduce((a, s) => a + (t.rev[s.key].questoes || 0), 0);
      const rs      = done.filter((s) => t.rev[s.key].acerto != null);
      const acc     = rs.length ? Math.round(rs.reduce((a, s) => a + t.rev[s.key].acerto, 0) / rs.length * 100) : null;
      const next    = STEPS.find((s) => !t.rev[s.key].done);
      return { ...t, doneN: done.length, questoes, acc, nextStep: next?.key, nextDate: next ? t.rev[next.key].date : null };
    })
    .sort((a, b) => {
      if (sort === "nome") return a.nome.localeCompare(b.nome);
      if (sort === "acc")  return (b.acc ?? -1) - (a.acc ?? -1);
      if (sort === "q")    return b.questoes - a.questoes;
      if (sort === "prog") return b.doneN - a.doneN;
      return 0;
    });

  const exportCSV = () => {
    const h = ["Nome","Área","Progresso","Questões","Acerto%","Importância","Insight"];
    const d = rows.map((r) => [r.nome, r.esp, `${r.doneN}/${STEPS.length}`, r.questoes, r.acc ?? "", r.importancia || "ALTA", (r.reflexao?.texto || "").replace(/,/g," ")]);
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent([h, ...d].map((r) => r.join(",")).join("\n"));
    a.download = "reviewflow_v6.csv"; a.click();
  };

  const Th = ({ k, children }) => (
    <th onClick={() => setSort(k)}
      className={`px-4 py-3 text-left text-[10.5px] uppercase tracking-wider font-bold cursor-pointer select-none whitespace-nowrap border-b border-white/5 transition-colors ${sort === k ? "text-violet-400" : "text-gray-600 hover:text-gray-400"}`}>
      {children}{sort === k ? " ↓" : ""}
    </th>
  );

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-[220px]" />
        <span className="text-[12px] text-gray-600">{rows.length} temas integrados</span>
        <div className="flex-1" />
        <Btn variant="ghost" onClick={exportCSV} className="text-[12px] gap-2"><FileText size={16} /> Exportar CSV</Btn>
      </div>
      <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-white/5">
              <tr><Th k="nome">Tema</Th><Th k="prog">Progresso</Th><Th k="q">Questões</Th><Th k="acc">Acerto</Th>
                <th className="px-4 py-3 text-left text-[10.5px] uppercase tracking-wider font-bold text-gray-600 border-b border-white/5">Próximo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const espC   = ESP_COLORS[r.esp] || "#94a3b8";
                const accCol = r.acc == null ? "text-gray-600" : r.acc >= 80 ? "text-emerald-400" : r.acc >= 55 ? "text-yellow-400" : "text-red-400";
                return (
                  <tr key={r.id} className={`border-b border-white/5/50 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[12.5px] font-semibold text-gray-200">{r.nome}</p>
                        <span className="text-[10px]">{IMPORTANCIA[r.importancia || "ALTA"]?.icon}</span>
                      </div>
                      <p className="text-[10.5px] font-bold mt-0.5" style={{ color: espC }}>{r.esp}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {STEPS.map((s) => (
                            <div key={s.key} className="w-2 h-2 rounded-full transition-colors"
                              style={{ background: r.rev[s.key].done ? espC : "#374151" }} title={s.label} />
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-600">{r.doneN}/{STEPS.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-gray-200">
                      {r.questoes > 0 ? r.questoes.toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.acc != null
                        ? <span className={`text-[12px] font-bold tabular-nums ${accCol}`}>{r.acc}%</span>
                        : <span className="text-gray-700 text-[12px]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.nextStep
                        ? <span className={`text-[11.5px] font-semibold ${isOverdue(r.nextDate) ? "text-red-400" : isDueToday(r.nextDate) ? "text-violet-400" : "text-gray-500"}`}>
                            {r.nextStep.toUpperCase()} · {isOverdue(r.nextDate) ? "vencido" : isDueToday(r.nextDate) ? "hoje" : fmtDate(r.nextDate)}
                          </span>
                        : <span className="text-[11px] font-bold text-emerald-400">✓ concluído</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* MODAL REGISTRO DE SIMULADO (V6) ─────────────────────────────────────────────── */
function SimRegistroModal({ onClose, onSave, platKey }) {
  const [page, setPage] = useState(1);
  const esps = platKey === "res" ? ESPS_RES : ESPS_VEST;
  const [f, setF] = useState({ data: todayStr(), total: 100, acertos: "", tempoMin: "", ansiedade: "Normal", cansaco: "Normal" });
  
  // Controle de erros da página 2
  const [erradas, setErradas] = useState([]);
  const [newError, setNewError] = useState({ num: "", esp: esps[0], tipoErro: "lacuna", desc: "" });

  const addErrorToList = () => {
    if (!newError.num) return;
    setErradas([...erradas, { ...newError, id: Date.now(), corrigidaD7: null }]);
    setNewError({ num: "", esp: esps[0], tipoErro: "lacuna", desc: "" });
  };

  const handleSaveAll = () => {
    const pct = f.total > 0 ? Math.round((+f.acertos / +f.total) * 100) : 0;
    onSave({
      ...f,
      pct,
      questoesErradas: erradas,
      statusCorrecao: erradas.length > 0 ? "parcial" : "concluida"
    });
  };

  return (
    <Modal onClose={onClose} wide={page === 2}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[15px] font-bold text-white">Registrar Prática/Simulado (Pág {page}/2)</h2>
        <span className="text-[11px] text-gray-500 font-mono">V6 Analytics</span>
      </div>

      {page === 1 ? (
        <div className="flex flex-col gap-3">
          <Field label="Data de Realização"><Input type="date" value={f.data} onChange={e => setF({...f, data: e.target.value})} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Questões"><Input type="number" value={f.total} onChange={e => setF({...f, total: +e.target.value})} /></Field>
            <Field label="Total Acertos"><Input type="number" value={f.acertos} onChange={e => setF({...f, acertos: +e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Tempo (Min)"><Input type="number" placeholder="ex: 240" value={f.tempoMin} onChange={e => setF({...f, tempoMin: +e.target.value})} /></Field>
            <Field label="Ansiedade">
              <Select value={f.ansiedade} onChange={e => setF({...f, ansiedade: e.target.value})}>
                <option>Baixa</option><option>Normal</option><option>Alta</option>
              </Select>
            </Field>
            <Field label="Cansaço">
              <Select value={f.cansaco} onChange={e => setF({...f, cansaco: e.target.value})}>
                <option>Baixo</option><option>Normal</option><option>Alto</option>
              </Select>
            </Field>
          </div>
          <Btn className="w-full mt-2" onClick={() => setPage(2)} disabled={!f.total || !f.acertos}>Próxima Etapa (Mapear Erros)</Btn>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <p className="text-[11px] font-bold text-violet-400 uppercase tracking-wider mb-2">Mapeamento de Questões Erradas</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
              <Input type="number" placeholder="Nº Q" value={newError.num} onChange={e => setNewError({...newError, num: e.target.value})} className="sm:col-span-1" />
              <Select value={newError.esp} onChange={e => setNewError({...newError, esp: e.target.value})}>
                {esps.map(e => <option key={e}>{e}</option>)}
              </Select>
              <Select value={newError.tipoErro} onChange={e => setNewError({...newError, tipoErro: e.target.value})}>
                <option value="lacuna">Lacuna de Conteúdo</option>
                <option value="raciocinio">Erro Raciocínio</option>
                <option value="distractor">Caiu Distrator</option>
                <option value="descuido">Descuido/Atenção</option>
                <option value="nao_visto">Não Visto</option>
              </Select>
              <Btn onClick={addErrorToList} variant="ghost" className="w-full py-2">Incluir</Btn>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto border border-white/5 rounded-xl divide-y divide-white/5">
            {erradas.length === 0 && <p className="text-center py-4 text-[11px] text-gray-600 italic">Nenhum erro inserido. Salvar como 100% corrigido.</p>}
            {erradas.map((err, idx) => (
              <div key={idx} className="p-2 text-[12px] flex items-center justify-between bg-black/20">
                <span className="font-mono text-red-400 font-bold">Q-{err.num}</span>
                <span className="text-gray-400 text-[11px] truncate">{err.esp}</span>
                <span className="text-yellow-500 text-[11px] uppercase font-bold">{err.tipoErro}</span>
                <button onClick={() => setErradas(erradas.filter(e => e.id !== err.id))} className="text-gray-600 hover:text-red-400"><X size={14}/></button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Btn variant="ghost" onClick={() => setPage(1)}>Voltar</Btn>
            <Btn className="flex-1" onClick={handleSaveAll}>Finalizar Registro</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── BRAIN DUMP D1 ASSISTENTE MODAL (V7) ─────────────────────────────────────
function BrainDumpD1Modal({ tema, onConfirm, onCancel }) {
  const [seconds, setSeconds] = useState(300); // 5 Minutos
  const [timerActive, setTimerActive] = useState(true);
  const [fields, setFields] = useState({ epidemiologia: "", fisiopatologia: "", diagnostico: "", conduta: "", complicacoes: "" });

  useEffect(() => {
    let interval = null;
    if (timerActive && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0) setTimerActive(false);
    return () => clearInterval(interval);
  }, [timerActive, seconds]);

  const fmtTimer = () => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const formMapeamento = [
    { k: "epidemiologia", l: "📍 Epidemiologia / Fatores de Risco", p: "Quem? Quando? Ocorrência típica de prova..." },
    { k: "fisiopatologia", l: "🔬 Fisiopatologia / Mecanismo", p: "Vias biológicas, gatilhos anatômicos cruciais..." },
    { k: "diagnostico", l: "🔍 Critérios Diagnósticos / exames", p: "Padrão-ouro, sinais clínicos patognomônicos..." },
    { k: "conduta", l: "💊 Conduta Inicial e Tratamento", p: "Medicamentos, doses, indicações cirúrgicas puras..." },
    { k: "complicacoes", l: "⚠️ Complicações / Padrões de Erro", p: "O que o distrator de prova tenta induzir a errar..." }
  ];

  return (
    <Modal onClose={onCancel} wide>
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div><h2 className="text-[15px] font-black text-white">{tema.nome}</h2><p className="text-[11px] text-gray-500">Brain Dump D1</p></div>
        <div className={`px-3 py-1 rounded-xl font-mono text-[16px] font-black ${seconds <= 60 ? "bg-red-600/20 text-red-400 border border-red-500/30 animate-pulse" : "bg-white/5 text-violet-400 border border-white/10"}`}>{fmtTimer()}</div>
      </div>
      <div className="space-y-3 my-2 max-h-[55vh] overflow-y-auto pr-1 text-left">
        {formMapeamento.map(f => (
          <div key={f.k} className="space-y-1"><label className="block text-[11px] font-bold text-gray-400 uppercase">{f.l}</label><Textarea rows={2} value={fields[f.k]} onChange={e => setFields({ ...fields, [f.k]: e.target.value })} placeholder={f.p} /></div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-white/5 pt-3">
        <Btn className="flex-1 bg-emerald-600 hover:bg-emerald-500" onClick={() => onConfirm(fields)}>✓ Concluir Brain Dump</Btn>
        <Btn variant="ghost" onClick={() => setTimerActive(!timerActive)}>{timerActive ? "Pausar" : "Retomar"}</Btn>
        <Btn variant="danger" onClick={onCancel}>Cancelar</Btn>
      </div>
    </Modal>
  );
}

// ─── PAINEL ESTATÍSTICO (V7 — PESSOAL + PROVAS) ───────────────────────────────
function StatsPanel() {
  const [mainTab, setMainTab] = useState("meu");
  const [selectedProva, setSelectedProva] = useState(null);
  const { plat } = useStore();
  const temas = useStore((s) => s[plat].temas);
  const rawSimulados = useStore((s) => s[plat].simulados || []);

  // Determine available provas based on platform
  const provasDisponiveis = plat === "res" ? Object.keys(PROVA_STATS) : ["ENEM", "FUVEST"];

  // Initialize selectedProva on first render or when platform changes
  if (selectedProva === null) {
    const firstProva = provasDisponiveis[0];
    if (firstProva !== selectedProva) {
      setSelectedProva(firstProva);
    }
  }

  // Ensure selectedProva is valid for current platform
  const validProva = selectedProva && provasDisponiveis.includes(selectedProva) ? selectedProva : provasDisponiveis[0];
  const prova = PROVA_STATS[validProva] || {};

  const simulados = useMemo(() => rawSimulados.map(migrarSim), [rawSimulados]);

  const personalStats = useMemo(() => {
    if (!temas.length) return null;
    const byEsp = {};
    let totalQuestoes = 0, totalDoneSteps = 0;
    temas.forEach(t => {
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
    const allAcertos = temas.flatMap(t => STEPS.map(s => t.rev[s.key])).filter(r => r.done && r.acerto != null);
    const overallAcc = allAcertos.length ? Math.round(allAcertos.reduce((a, r) => a + r.acerto, 0) / allAcertos.length * 100) : null;
    const totalConcluidos = temas.filter(t => STEPS.every(s => t.rev[s.key].done)).length;
    const simPcts = simulados.map(s => s.pct);
    const simAvg = simPcts.length ? Math.round(simPcts.reduce((a, b) => a + b) / simPcts.length) : null;
    return { espStats, totalQuestoes, totalDoneSteps, bestEsp, worstEsp, overallAcc, totalConcluidos, simAvg };
  }, [temas, simulados]);

  return (
    <div className="space-y-5 animate-fade-up text-left">
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
        <button onClick={() => setMainTab("meu")} className={`px-4 py-2 rounded-lg text-[12px] font-black transition-all ${mainTab === "meu" ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "text-gray-500 hover:text-gray-300"}`}>Meu Desempenho</button>
        <button onClick={() => setMainTab("provas")} className={`px-4 py-2 rounded-lg text-[12px] font-black transition-all ${mainTab === "provas" ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-300"}`}>Análise de Provas</button>
      </div>

      {/* ─── ABA: MEU DESEMPENHO ─────────────────────────────────────────── */}
      {mainTab === "meu" && (
        <div className="space-y-5">
          {!temas.length ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <BarChart3 size={40} className="text-gray-700" />
              <p className="text-[13px] text-gray-500">Adicione temas ao seu banco para ver estatísticas pessoais.</p>
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Temas", value: temas.length, color: "text-purple-400" },
                  { label: "Questões", value: (personalStats?.totalQuestoes || 0).toLocaleString("pt-BR"), color: "text-blue-400" },
                  { label: "Ciclos Completos", value: personalStats?.totalConcluidos ?? 0, color: "text-emerald-400" },
                  { label: "Acerto Médio", value: personalStats?.overallAcc != null ? `${personalStats.overallAcc}%` : "—",
                    color: personalStats?.overallAcc == null ? "text-gray-500" : personalStats.overallAcc >= 80 ? "text-emerald-400" : personalStats.overallAcc >= 65 ? "text-yellow-400" : "text-red-400" },
                ].map(s => (
                  <div key={s.label} className="bg-[#111113] border border-white/5 rounded-2xl p-4">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
                    <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Simulados avg + best/worst */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Média Simulados</p>
                  <p className={`text-2xl font-black tabular-nums ${personalStats?.simAvg == null ? "text-gray-600" : personalStats.simAvg >= 70 ? "text-cyan-400" : "text-yellow-400"}`}>
                    {personalStats?.simAvg != null ? `${personalStats.simAvg}%` : "—"}
                  </p>
                </div>
                {personalStats?.bestEsp && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                    <p className="text-[10px] text-emerald-400/70 uppercase font-bold mb-1">🏆 Melhor Área</p>
                    <p className="text-[13px] font-bold text-white truncate">{personalStats.bestEsp.esp}</p>
                    <p className="text-2xl font-black text-emerald-400">{personalStats.bestEsp.acc}%</p>
                  </div>
                )}
                {personalStats?.worstEsp && personalStats.worstEsp.esp !== personalStats.bestEsp?.esp && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                    <p className="text-[10px] text-red-400/70 uppercase font-bold mb-1">⚠️ Zona de Risco</p>
                    <p className="text-[13px] font-bold text-white truncate">{personalStats.worstEsp.esp}</p>
                    <p className="text-2xl font-black text-red-400">{personalStats.worstEsp.acc}%</p>
                  </div>
                )}
              </div>

              {/* By specialty */}
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Desempenho por Especialidade</h3>
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
            </>
          )}
        </div>
      )}

      {/* ─── ABA: ANÁLISE DE PROVAS ──────────────────────────────────────── */}
      {mainTab === "provas" && (
        <div className="space-y-5">
          {plat === "res" ? (
            <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
              {provasDisponiveis.map(p => (
                <button type="button" key={p} onClick={() => setSelectedProva(p)} className={`px-4 py-2 rounded-lg text-[12px] font-black transition-all ${validProva === p ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-300"}`}>{p}</button>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-[13px] text-gray-400">Análise de provas específicas em desenvolvimento para vestibular.</p>
            </div>
          )}
          {plat === "res" && prova && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Incidência Geral por Área</h3>
                <div className="space-y-3">
                  {prova.areas?.map(a => (
                    <div key={a.name} className="space-y-1">
                      <div className="flex justify-between text-[11.5px] font-semibold text-gray-300">
                        <span>{a.name}</span><span className="font-mono text-purple-400">{a.pct}%</span>
                      </div>
                      <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all" style={{ width: `${a.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-[13px] font-bold text-orange-400 uppercase tracking-wider">Subtemas Cirurgia Mais Cobrados</h3>
                <div className="space-y-3">
                  {prova.subtemasCirurgia?.map(s => (
                    <div key={s.name} className="space-y-1">
                      <div className="flex justify-between text-[11.5px] font-semibold text-gray-300">
                        <span>{s.name}</span><span className="font-mono text-orange-400">{s.pct}%</span>
                      </div>
                      <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-3">
                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-red-400" /> Tópicos de Risco — Prova 2026
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {prova.gaps2025?.map((g, idx) => (
                    <div key={idx} className="p-3 border border-red-500/15 rounded-xl bg-red-500/[0.02]">
                      <p className="text-[13px] font-bold text-gray-200">{g.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{g.especialidade}</p>
                      <span className="mt-2 inline-block text-[9px] font-black tracking-widest uppercase bg-red-600/20 text-red-400 border border-red-600/30 px-1.5 py-0.5 rounded">Risco {g.risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* SIMULADOS COMPONENT (5 TABS AVANÇADOS V6) ──────────────────────────────────── */
function Simulados() {
  const { plat, addSim, deleteSim, marcarD7 } = useStore();
  const rawSims = useStore((s) => s[plat].simulados || []);
  const simulados = useMemo(() => rawSims.map(migrarSim), [rawSims]);

  const [activeTab, setActiveTab] = useState("painel"); // painel | correcao | area | metricas
  const [modalOpen, setModalOpen] = useState(false);

  // Cálculos do Elite Analytics do useStore
  const analytics = useMemo(() => calcMetricasElite(simulados), [simulados]);
  const pcts = useMemo(() => simulados.map(s => s.pct), [simulados]);
  const projecao = useMemo(() => calcProjecao(pcts, 2), [pcts]);

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-orange-400" />
          <h2 className="text-[15px] font-bold text-gray-100">Simulados e Práticas</h2>
        </div>
        <Btn onClick={() => setModalOpen(true)} className="gap-1.5"><Plus size={16} /> Registrar Simulado</Btn>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-1 overflow-x-auto bg-white/5 p-1 rounded-xl border border-white/5 shrink-0">
        {[
          {id:"painel", l:"Painel Geral"},
          {id:"correcao", l:"Revisão D7"},
          {id:"area", l:"Por Área"},
          {id:"metricas", l:"Elite"}
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all whitespace-nowrap ${activeTab === t.id ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "text-gray-500 hover:text-gray-300"}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Conteúdo Aba 1: Painel Geral */}
      {activeTab === "painel" && (
        <div className="flex flex-col gap-4">
          {simulados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <Target size={44} className="text-gray-700" />
              <div>
                <p className="text-[14px] font-bold text-gray-400">Nenhum simulado registrado ainda</p>
                <p className="text-[12px] text-gray-600 mt-1">Clique em "Registrar Simulado" para começar a mapear seu desempenho.</p>
              </div>
              <Btn onClick={() => setModalOpen(true)} className="gap-1.5"><Plus size={16} /> Registrar primeiro simulado</Btn>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4">
                  <p className="text-[10.5px] text-gray-500 uppercase font-semibold mb-1">Média Geral</p>
                  <p className={`text-3xl font-black tabular-nums ${pcts.length && pcts.reduce((a,b)=>a+b)/pcts.length >= 70 ? "text-violet-400" : "text-yellow-400"}`}>
                    {pcts.length ? Math.round(pcts.reduce((a,b)=>a+b)/pcts.length) : 0}%
                  </p>
                </div>
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4">
                  <p className="text-[10.5px] text-gray-500 uppercase font-semibold mb-1">Projeção Próximo</p>
                  <p className={`text-3xl font-black tabular-nums ${projecao && projecao >= 70 ? "text-cyan-400" : "text-orange-400"}`}>{projecao != null ? `${projecao}%` : "—"}</p>
                  {projecao != null && (
                    <p className="text-[10px] text-gray-600 mt-0.5">{projecao > (pcts[pcts.length-1] || 0) ? "↑ tendência positiva" : projecao < (pcts[pcts.length-1] || 0) ? "↓ queda no desempenho" : "→ estável"}</p>
                  )}
                </div>
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4">
                  <p className="text-[10.5px] text-gray-500 uppercase font-semibold mb-1">Simulados</p>
                  <p className="text-3xl font-black text-emerald-400 tabular-nums">{simulados.length}</p>
                </div>
              </div>

              {/* Mini evolução visual */}
              {pcts.length >= 2 && (
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4">
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-3">Evolução de Acertos</p>
                  <div className="flex items-end gap-1.5 h-16">
                    {pcts.map((pct, i) => {
                      const col = pct >= 80 ? "bg-emerald-500" : pct >= 65 ? "bg-violet-500" : "bg-red-400";
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] text-gray-600 tabular-nums">{pct}%</span>
                          <div className={`w-full rounded-t-sm ${col} opacity-80 transition-all`} style={{ height: `${Math.max(4, (pct / 100) * 44)}px` }} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-gray-700">1º simulado</span>
                    <span className="text-[9px] text-gray-700">mais recente</span>
                  </div>
                </div>
              )}

              {/* Lista de simulados */}
              <div className="flex flex-col gap-2">
                {[...simulados].reverse().map((s) => {
                  const col = s.pct >= 80 ? "text-emerald-400" : s.pct >= 65 ? "text-violet-400" : "text-red-400";
                  const bgCol = s.pct >= 80 ? "bg-emerald-500/10" : s.pct >= 65 ? "bg-violet-500/10" : "bg-red-500/10";
                  const errosPend = (s.questoesErradas || []).filter(q => q.corrigidaD7 == null).length;
                  return (
                    <div key={s.id} className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${bgCol} tabular-nums shrink-0`}>
                          <span className={`${col} text-[15px]`}>{s.pct}%</span>
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-gray-200">{fmtFull(s.data)}</p>
                          <p className="text-[11.5px] text-gray-500 mt-0.5">
                            {s.acertos}/{s.total} questões
                            {s.tempoMin ? ` · ${s.tempoMin} min` : ""}
                            {s.ansiedade && s.ansiedade !== "Normal" ? ` · Ansiedade ${s.ansiedade}` : ""}
                          </p>
                          {(s.questoesErradas || []).length > 0 && (
                            <p className="text-[10px] mt-0.5">
                              <span className="text-red-400 font-bold">{(s.questoesErradas || []).length} erros mapeados</span>
                              {errosPend > 0 && <span className="text-yellow-500 ml-1">· {errosPend} aguardando D7</span>}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded hidden sm:inline ${s.statusCorrecao === "concluida" ? "bg-emerald-500/15 text-emerald-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                          {s.statusCorrecao === "concluida" ? "✓ Revisado" : "Pendente"}
                        </span>
                        <button onClick={() => { if (window.confirm("Remover este simulado?")) deleteSim(plat, s.id); }} className="text-gray-700 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10">
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Conteúdo Aba 2: Correção de Erros Ativa D7 */}
      {activeTab === "correcao" && (
        <div className="flex flex-col gap-3">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <h3 className="text-[13px] font-bold text-white mb-1">Fila Dinâmica de Auditoria de Erros (D7 Retest)</h3>
            <p className="text-[12px] text-gray-400">Marque se você re-executou a questão errada após 7 dias e conseguiu convertê-la com sucesso.</p>
          </div>

          <div className="flex flex-col gap-2">
            {simulados.flatMap(s => (s.questoesErradas || []).map(q => ({...q, simId: s.id, simData: s.data}))).filter(q => q.corrigidaD7 == null).length === 0 ? (
              <p className="text-center py-12 text-[12px] text-gray-600 italic">Nenhuma questão errada pendente de reteste!</p>
            ) : (
              simulados.flatMap(s => (s.questoesErradas || []).map(q => ({...q, simId: s.id, simData: s.data})))
                .filter(q => q.corrigidaD7 == null)
                .map(q => (
                  <div key={q.id} className="p-3 bg-[#111113] border border-white/5 rounded-xl flex items-center justify-between animate-fade-up">
                    <div>
                      <span className="text-[11px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold">Questão {q.num}</span>
                      <p className="text-[13px] font-semibold text-gray-200 mt-1">{q.esp}</p>
                      <p className="text-[11px] text-gray-500">Origem: Simulado de {fmtDate(q.simData)} · Causa: <span className="text-yellow-500 font-bold uppercase">{q.tipoErro}</span></p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => marcarD7(plat, q.simId, q.id, true)} className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[11px] font-bold hover:bg-emerald-600/30 transition-all">✓ Convertida</button>
                      <button onClick={() => marcarD7(plat, q.simId, q.id, false)} className="p-2 bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-bold hover:bg-red-600/30 transition-all">✕ Mantém Erro</button>
                    </div>
                  </div>
                )
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo Aba 3: Desempenho por Áreas Clínicas */}
      {activeTab === "area" && (
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-[13px] font-bold text-white">Rastreador de Lacunas Volumétricas por Matéria</h3>
          {(!analytics?.diagnostico || analytics.diagnostico.length === 0) ? (
            <p className="text-center text-gray-600 text-[12px] py-6">Alimente os simulados com erros para gerar o diagnóstico de área.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {analytics.diagnostico.map(d => (
                <div key={d.esp} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[13px] font-bold text-gray-200">{d.esp}</span>
                    <span className="text-[11px] text-red-400 font-bold">{d.total} erros mapeados</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                    <span>Erro Dominante: <strong className="text-yellow-500 uppercase">{d.dominante}</strong></span>
                    <span>Erros por Descuido: {d.pctDescuido}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo Aba 4: Métricas de Elite */}
      {activeTab === "metricas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
            <h3 className="text-[13px] font-bold text-white flex items-center gap-1.5"><ShieldAlert size={16} className="text-yellow-400"/> Fator Falta de Atenção Geral</h3>
            <p className="text-4xl font-black text-yellow-400 font-mono mt-2">{analytics.indiceDescuido != null ? `${analytics.indiceDescuido}%` : "—"}</p>
            <p className="text-[11px] text-gray-500 mt-1">Proporção de erros classificados puramente como distração ou falta de atenção.</p>
          </div>

          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
            <h3 className="text-[13px] font-bold text-white flex items-center gap-1.5"><Award size={16} className="text-emerald-400"/> Taxa de Conversão D7</h3>
            <p className="text-4xl font-black text-emerald-400 font-mono mt-2">{analytics.taxaConversao != null ? `${analytics.taxaConversao}%` : "—"}</p>
            <p className="text-[11px] text-gray-500 mt-1">Eficiência de eliminação de erros após 1 semana de consolidação ativa.</p>
          </div>

          {analytics.insights?.length > 0 && (
            <div className="md:col-span-2 bg-violet-600/10 border border-violet-500/20 rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-violet-400 mb-2">💡 Direcionamento Estratégico Baseado em Dados:</p>
              <ul className="text-[12px] text-gray-300 space-y-1.5 list-disc pl-4">
                {analytics.insights.map((ins, idx) => <li key={idx}>{ins}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <SimRegistroModal platKey={plat} onClose={() => setModalOpen(false)} onSave={(sim) => { addSim(plat, sim); setModalOpen(false); }} />
      )}
    </div>
  );
}

/* ANKI AUDIT ─────────────────────────────────────────────────────────────────── */
function AnkiAudit() {
  const { plat, addAnki } = useStore();
  const ankiLog = useStore((s) => s[plat].ankiLog || []);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ data: todayStr(), revisados: "", again: "", novos: "" });
  const avgAgain = ankiLog.length
    ? Math.round(ankiLog.reduce((a, l) => a + (l.revisados ? l.again / l.revisados * 100 : 0), 0) / ankiLog.length)
    : null;

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-gray-400" />
          <h2 className="text-[15px] font-bold text-gray-100">Anki Audit</h2>
          <InfoTooltip texto='Mapeia o índice de retention do Anki. Manter a taxa de "Again" estritamente abaixo de 15% garante a calibração perfeita dos seus decks.' />
        </div>
        <Btn onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Registrar Sessão</Btn>
      </div>
      {ankiLog.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[["Cards Revisados", ankiLog.reduce((a, l) => a + (l.revisados || 0), 0).toLocaleString("pt-BR"), "text-violet-400"],
            ["Cards Novos", ankiLog.reduce((a, l) => a + (l.novos || 0), 0).toLocaleString("pt-BR"), "text-blue-400"],
            ["Média de Erros", avgAgain != null ? avgAgain + "%" : "—", avgAgain != null && avgAgain < 15 ? "text-emerald-400" : "text-yellow-400"]].map(([l, v, c]) => (
            <div key={l} className="bg-[#111113] border border-white/5 rounded-2xl p-4">
              <p className="text-[10.5px] text-gray-500 uppercase tracking-wider mb-2">{l}</p>
              <p className={`text-3xl font-black tabular-nums ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {ankiLog.length === 0 && (
          <div className="text-center py-16 text-gray-600 text-[13px]">Nenhuma auditoria de Anki gravada.</div>
        )}
        {[...ankiLog].reverse().map((l) => {
          const pct = l.revisados ? Math.round(l.again / l.revisados * 100) : 0;
          const col = pct < 15 ? "text-emerald-400" : pct < 30 ? "text-yellow-400" : "text-red-400";
          return (
            <div key={l.id} className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
              <span className="text-[12px] text-gray-500 shrink-0 w-20">{fmtFull(l.data)}</span>
              <div className="flex gap-5 flex-1">
                {[["Revisados", l.revisados, "text-violet-400"], ["Novos", l.novos || 0, "text-blue-400"], ["Again (Erros)", pct + "%", col]].map(([lbl, val, c]) => (
                  <div key={lbl} className="text-center">
                    <p className="text-[10px] text-gray-600 mb-0.5">{lbl}</p>
                    <p className={`text-[14px] font-bold tabular-nums ${c}`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <h2 className="text-[15px] font-bold text-gray-100">Auditar Estatísticas Anki</h2>
          <Field label="Data"><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Revisados"><Input type="number" value={f.revisados} onChange={(e) => setF({ ...f, revisados: +e.target.value })} /></Field>
            <Field label='"Again"'><Input type="number" value={f.again} onChange={(e) => setF({ ...f, again: +e.target.value })} /></Field>
            <Field label="Novos"><Input type="number" value={f.novos} onChange={(e) => setF({ ...f, novos: +e.target.value })} /></Field>
          </div>
          {f.revisados > 0 && (
            <p className="text-center text-2xl font-black text-violet-400 tabular-nums">
              {Math.round(f.again / f.revisados * 100)}% de Erro Real
            </p>
          )}
          <div className="flex gap-2">
            <Btn className="flex-1"
              onClick={() => { if (f.revisados) { addAnki(plat, f); setOpen(false); setF({ data: todayStr(), revisados: "", again: "", novos: "" }); } }}
              disabled={!f.revisados}>Gravar Histórico</Btn>
            <Btn variant="ghost" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* IMPORTADOR / PARSER DE PDF CRONOGRAMA ───────────────────────────────────────── */
const DIAS_SEMANA = ["SEG","TER","QUA","QUI","SEX","SÁB","DOM"];
const BLOCOS_TEMPLATE = [
  { horario: "07:00–08:00", nome: "ANKI BASE" },
  { horario: "08:00–11:30", nome: "BLOCO DE FOCO 1" },
  { horario: "11:30–12:30", nome: "ALMOÇO / DESCANSO" },
  { horario: "12:30–15:30", nome: "BLOCO DE FOCO 2" },
  { horario: "16:00–19:00", nome: "REVISÃO ESPAÇADA / PRÁTICA" },
];

function parsePDFText(texto, titulo = "Cronograma") {
  const text = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const semanas = [];
  const partes = text.split(/(?=SEMANA\s+\d+)/i);

  for (const parte of partes) {
    const mNum = parte.match(/SEMANA\s+(\d+)/i);
    if (!mNum) continue;
    const numero = parseInt(mNum[1]);

    const mFase = parte.match(/FASE\s+(\d+)\s*[—–-]\s*([^\n·]+)/i);
    const fase   = mFase ? `FASE ${mFase[1]}` : "";
    const tituloFase = mFase ? mFase[2].trim() : "";
    const mPer  = parte.match(/[·•]\s*([\d/]+\s*[–—-]\s*[\d/]+)/);
    const periodo = mPer ? mPer[1].trim() : "";

    const mDatas = [...parte.matchAll(/(?:SEG|TER|QUA|QUI|SEX|SÁB|DOM)\s+(\d{2}\/\d{2})/gi)];
    const mDatasAlt = [...parte.matchAll(/(\d{2}\/\d{2})/g)].slice(0, 7);
    const mBlocos = [...parte.matchAll(/(07:00|08:00|11:30|12:30|16:00)[–—-]\d{2}:\d{2}[\s\S]*?(?=(?:07:00|08:00|11:30|12:30|16:00)[–—-]|\n*SEMANA\s+\d+|$)/gi)];

    const dias = DIAS_SEMANA.map((dia, di) => {
      const data = mDatas[di]?.[1] || mDatasAlt[di]?.[1] || "";
      return {
        dia,
        data,
        blocos: BLOCOS_TEMPLATE.map((b, bi) => {
          let conteudo = "";
          if (mBlocos[bi]) {
            const blocoTexto = mBlocos[bi][0];
            const linhas = blocoTexto.split("\n").filter(l => l.trim() && !/^\d{2}:\d{2}/.test(l.trim()));
            const porDia = Math.ceil(linhas.length / 7);
            const fatia  = linhas.slice(di * porDia, (di + 1) * porDia);
            conteudo = fatia.join("\n").trim();
          }
          return { horario: b.horario, nome: b.nome, conteudo, concluido: false };
        }),
      };
    });

    semanas.push({ id: Date.now() + Math.random(), numero, fase, tituloFase, periodo, dias });
  }
  return semanas.length === 0 ? null : { id: Date.now(), titulo, semanas, criadoEm: todayStr() };
}

function gerarCronogramaVazio(titulo, dataInicio, numSemanas) {
  const semanas = [];
  for (let i = 0; i < numSemanas; i++) {
    const base = new Date(dataInicio + "T12:00:00");
    base.setDate(base.getDate() + i * 7);
    const diasArr = DIAS_SEMANA.map((dia, di) => {
      const d = new Date(base);
      d.setDate(d.getDate() + di);
      const data = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
      return {
        dia,
        data,
        blocos: BLOCOS_TEMPLATE.map(b => ({ ...b, conteudo: "", concluido: false })),
      };
    });
    semanas.push({ id: Date.now() + Math.random() + i, numero: i+1, fase: "", tituloFase: "", periodo: "", dias: diasArr });
  }
  return { id: Date.now(), titulo, semanas, criadoEm: todayStr() };
}

function DiaCard({ dia, diaIdx, eHoje, semanaIdx, crono, plat, toggleBloco }) {
  const [open, setOpen] = useState(eHoje);
  const feitos = dia.blocos.filter(b => b.concluido).length;
  const total  = dia.blocos.length;
  const pct    = Math.round(feitos / total * 100);

  return (
    <div className={`bg-[#111113] border rounded-2xl overflow-hidden transition-all ${eHoje ? "border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.1)]" : "border-white/5"}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${eHoje ? "bg-violet-600" : "bg-white/5"}`}>
          <span className="text-[9px] font-bold text-gray-400 leading-none">{dia.dia}</span>
          <span className={`text-[13px] font-black leading-none mt-0.5 ${eHoje ? "text-white" : "text-gray-200"}`}>{dia.data?.split("/")[0] || ""}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-semibold ${eHoje ? "text-violet-300" : "text-gray-300"}`}>
              {dia.dia}{dia.data ? `, ${dia.data}` : ""}
            </span>
            {eHoje && <span className="text-[9px] bg-violet-600 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">Hoje</span>}
            {feitos === total && total > 0 && <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">✓ Completo</span>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-violet-500"}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-gray-600 tabular-nums shrink-0">{feitos}/{total}</span>
          </div>
        </div>
        <ChevronDown size={16} className={`text-gray-600 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-white/5 divide-y divide-white/5">
          {dia.blocos.map((bloco, bi) => {
            return (
              <div key={bi} className="flex gap-3 px-4 py-3">
                <button
                  onClick={() => toggleBloco(plat, crono.id, semanaIdx, diaIdx, bi)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${bloco.concluido ? "bg-emerald-500 border-emerald-500" : "border-white/20 hover:border-violet-500"}`}>
                  {bloco.concluido && <Check size={12} className="text-white" strokeWidth={3} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`text-[12px] font-bold ${bloco.concluido ? "text-emerald-400 line-through opacity-60" : "text-gray-200"}`}>
                      {bloco.nome}
                    </span>
                    <span className="text-[10px] text-gray-700 font-mono">{bloco.horario}</span>
                  </div>
                  {bloco.conteudo && (
                    <p className={`text-[11px] mt-1 leading-relaxed whitespace-pre-line ${bloco.concluido ? "text-gray-700" : "text-gray-400"}`}>
                      {bloco.conteudo}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* CRONOGRAMA VESTIBULAR (BUG TELA PRETA FIXADO EM DEFINITIVO COM USEEFFECT) ───── */
function CronogramaVest() {
  const { plat, addCronograma, deleteCronograma, toggleBloco } = useStore();
  const _rawCronos   = useStore((s) => s[plat]?.cronogramas);
  const cronogramas  = useMemo(() => _rawCronos || [], [_rawCronos]);

  const [modo, setModo]           = useState("lista"); 
  const [cronoAtivo, setCronoAtivo] = useState(null);
  const [semanaIdx, setSemanaIdx]   = useState(0);
  const [criarModal, setCriarModal] = useState(false);

  const [cfTitulo, setCfTitulo]     = useState("Meu Cronograma Focal");
  const [cfDataIni, setCfDataIni]   = useState(todayStr());
  const [cfSemanas, setCfSemanas]   = useState(22);
  const [cfPDFText, setCfPDFText]   = useState("");
  const [cfModo, setCfModo]         = useState("manual"); 

  // SOLUÇÃO CRÍTICA DO RENDERING: Validação sem loop infinito
  useEffect(() => {
    if (modo === "ver" && cronoAtivo) {
      const exists = cronogramas.find(c => c.id === cronoAtivo.id);
      if (!exists || !exists.semanas?.length) {
        setModo("lista");
        setCronoAtivo(null);
      }
    }
  }, [cronogramas]); // Apenas cronogramas como dependência

  const calcSemanaHoje = (crono) => {
    if (!crono?.semanas?.length) return 0;
    const hoje = todayStr();
    for (let i = 0; i < crono.semanas.length; i++) {
      const s = crono.semanas[i];
      const primeiraData = s.dias[0]?.data;
      if (!primeiraData) continue;
      const ultimaData = s.dias[6]?.data;
      if (!primeiraData || !ultimaData) continue;
      const ano = new Date().getFullYear();
      const toISO = (dd) => {
        const [d, m] = dd.split("/");
        return `${ano}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
      };
      if (hoje >= toISO(primeiraData) && hoje <= toISO(ultimaData)) return i;
    }
    return 0;
  };

  const handleVerCrono = (crono) => {
    setCronoAtivo(crono);
    setSemanaIdx(calcSemanaHoje(crono));
    setModo("ver");
  };

  const handleCriar = () => {
    let crono;
    if (cfModo === "pdf" && cfPDFText.trim()) {
      crono = parsePDFText(cfPDFText, cfTitulo);
      if (!crono) { alert("Formato inválido. Não detectamos semanas."); return; }
    } else {
      crono = gerarCronogramaVazio(cfTitulo, cfDataIni, cfSemanas);
    }
    addCronograma(plat, crono);
    setCfTitulo("Meu Cronograma Focal"); setCfPDFText(""); setCfSemanas(22);
    setCriarModal(false);
  };

  if (modo === "lista") {
    return (
      <div className="flex flex-col gap-5 animate-fade-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-gray-100">Cronogramas de Estudo Semanais</h2>
          </div>
          <Btn onClick={() => setCriarModal(true)} className="gap-2"><Plus size={16} /> Novo Planeamento</Btn>
        </div>

        {cronogramas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <BookOpen size={48} className="text-gray-700" />
            <p className="text-[14px] text-gray-500 text-center">Nenhum cronograma montado.<br />Importe seu PDF de planejamento acadêmico.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cronogramas.map((c) => {
              const total  = c.semanas.reduce((a, s) => a + s.dias.reduce((b, d) => b + d.blocos.length, 0), 0);
              const feitos = c.semanas.reduce((a, s) => a + s.dias.reduce((b, d) => b + d.blocos.filter(b2 => b2.concluido).length, 0), 0);
              const pct    = total > 0 ? Math.round(feitos / total * 100) : 0;
              return (
                <div key={c.id} className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 hover:border-white/10 transition-colors cursor-pointer"
                  onClick={() => handleVerCrono(c)}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-white truncate">{c.titulo}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{c.semanas.length} semanas · Criado {fmtDate(c.criadoEm)}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); if (window.confirm("Remover cronograma completo?")) deleteCronograma(plat, c.id); }}
                      className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center shrink-0 ml-2 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                      <span>Progresso Geral dos Blocos</span>
                      <span className="tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {criarModal && (
          <Modal onClose={() => setCriarModal(false)} wide>
            <h2 className="text-[15px] font-bold text-gray-100">Estruturar Nova Grade</h2>
            <Field label="Nome/Título"><Input value={cfTitulo} onChange={e => setCfTitulo(e.target.value)} /></Field>

            <div className="flex gap-1 bg-black/40 border border-white/10 rounded-xl p-1">
              {[["manual","Manual"],["pdf","Importar Texto de PDF"]].map(([v,l]) => (
                <button key={v} onClick={() => setCfModo(v)}
                  className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${cfModo === v ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                  {l}
                </button>
              ))}
            </div>

            {cfModo === "manual" ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Início"><Input type="date" value={cfDataIni} onChange={e => setCfDataIni(e.target.value)} /></Field>
                <Field label="Semanas"><Input type="number" value={cfSemanas} onChange={e => setCfSemanas(+e.target.value)} /></Field>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Textarea rows={6} value={cfPDFText} onChange={e => setCfPDFText(e.target.value)} placeholder="Cole aqui as linhas textuais do PDF..." className="text-[11px] font-mono" />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Btn className="flex-1" onClick={handleCriar} disabled={!cfTitulo}>Gerar</Btn>
              <Btn variant="ghost" className="flex-1" onClick={() => setCriarModal(false)}>Cancelar</Btn>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  const crono = cronogramas.find(c => c.id === cronoAtivo?.id) || cronoAtivo;
  if (!crono || !crono.semanas || crono.semanas.length === 0) return null;
  const semana  = crono.semanas[semanaIdx];
  const hoje    = todayStr();

  const diaHoje = (() => {
    if (!semana) return -1;
    const ano = new Date().getFullYear();
    return semana.dias.findIndex(d => {
      if (!d.data) return false;
      const [dd, mm] = d.data.split("/");
      return `${ano}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}` === hoje;
    });
  })();

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <button onClick={() => setModo("lista")} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[14px] font-bold text-white truncate">{crono.titulo}</h2>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button onClick={() => setSemanaIdx(Math.max(0, semanaIdx - 1))} className="w-9 h-9 rounded-xl bg-white/5 disabled:opacity-30 flex items-center justify-center" disabled={semanaIdx === 0}>
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-[13px] font-bold text-white">Semana {semana?.numero}</p>
            {semana?.fase && <p className="text-[10px] text-violet-400 font-semibold">{semana.fase}</p>}
          </div>
          <button onClick={() => setSemanaIdx(Math.min(crono.semanas.length - 1, semanaIdx + 1))} className="w-9 h-9 rounded-xl bg-white/5 disabled:opacity-30 flex items-center justify-center" disabled={semanaIdx === crono.semanas.length - 1}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {semana && (
        <div className="flex flex-col gap-3">
          {semana.dias.map((dia, di) => (
            <DiaCard key={di} dia={dia} diaIdx={di} eHoje={di === diaHoje} semanaIdx={semanaIdx} crono={crono} plat={plat} toggleBloco={toggleBloco} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ERROR BOUNDARY ─────────────────────────────────────────────────────────────── */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-[13px] text-red-400 font-semibold">Instabilidade detectada na renderização.</p>
          <Btn onClick={() => this.setState({ error: null })} variant="ghost">Reiniciar Módulo</Btn>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── NAV INDEX ────────────────────────────────────────────────────────────────
const NAV = [
  { k: "dash",  icon: LayoutDashboard, label: "Dashboard"     },
  { k: "crono", icon: Calendar,        label: "Cronograma"     },
  { k: "banco", icon: BarChart3,       label: "Banco de Dados" },
  { k: "stats", icon: FileText,        label: "Estatísticas"   },
  { k: "sims",  icon: Target,          label: "Simulados"      },
  { k: "anki",  icon: Zap,             label: "Anki Audit"     }
];

/* SIDEBAR DESKTOP ────────────────────────────────────────────────────────────── */
function Sidebar({ view, setView, setAjustes, overdueCount, setHelpModal }) {
  const { plat, setPlat, meta } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const daysLeft = meta.dataProva ? diffDays(todayStr(), meta.dataProva) : null;
  const urgency  = daysLeft == null ? "text-violet-400" : daysLeft <= 30 ? "text-red-400" : daysLeft <= 90 ? "text-yellow-400" : "text-violet-400";

  return (
    <aside className={`hidden md:flex flex-col bg-[#07070f] border-r border-white/5 shrink-0 transition-all duration-200 ${collapsed ? "w-[60px]" : "w-60"}`}>
      {/* Logo header */}
      <div className={`flex items-center border-b border-white/5 p-3 gap-2 ${collapsed ? "justify-center" : "justify-between"}`}
           style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.05) 100%)" }}>
        <MedRevLogo collapsed={collapsed} size={collapsed ? "sm" : "md"} />
        <button onClick={() => setCollapsed(!collapsed)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 transition-colors shrink-0">
          {collapsed ? <ChevronRight size={16} /> : <ChevronRight size={16} style={{transform: 'scaleX(-1)'}} />}
        </button>
      </div>

      {/* Platform switcher */}
      {!collapsed && (
        <div className="flex gap-1 p-3 pb-2">
          {[["res","Residência"],["vest","Vestibular"]].map(([k, l]) => (
            <button key={k} onClick={() => setPlat(k)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${plat === k ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-300 bg-white/5"}`}>
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((n) => {
          const Icon = n.icon;
          const isActive = view === n.k;
          return (
            <button key={n.k} onClick={() => setView(n.k)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all text-left group ${isActive ? "bg-gradient-to-r from-purple-600/20 to-pink-500/10 text-white border border-purple-500/20" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"}`}>
              <Icon size={18} className={`shrink-0 transition-colors ${isActive ? "text-purple-400" : "group-hover:text-gray-300"}`} />
              {!collapsed && <span className="text-[12.5px] font-medium truncate flex-1">{n.label}</span>}
              {!collapsed && isActive && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-2 border-t border-white/5 flex flex-col gap-1">
        {!collapsed && daysLeft != null && (
          <div className={`rounded-xl px-3 py-2 mb-1 border ${daysLeft <= 30 ? "bg-red-500/5 border-red-500/20" : daysLeft <= 90 ? "bg-yellow-500/5 border-yellow-500/20" : "bg-purple-500/5 border-purple-500/20"}`}>
            <p className="text-[10px] text-gray-600 uppercase mb-0.5">Prova em</p>
            <p className={`text-xl font-black tabular-nums ${urgency}`}>{daysLeft}d</p>
          </div>
        )}
        <button onClick={() => setHelpModal(true)} className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-gray-600 hover:text-purple-400 hover:bg-purple-500/5 transition-all">
          <Info size={16} className="shrink-0"/>{!collapsed && <span className="text-[12px]">Guia de Uso</span>}
        </button>
        <button onClick={() => setAjustes(true)} className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all">
          <Settings size={16} className="shrink-0"/>{!collapsed && <span className="text-[12px]">Ajustes</span>}
        </button>
      </div>
    </aside>
  );
}

/* BOTTOM NAV MOBILE ──────────────────────────────────────────────────────────── */
function BottomNav({ view, setView, overdueCount }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#07070f]/95 backdrop-blur-md border-t border-white/5 z-40 flex items-stretch justify-around pt-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}>
      {NAV.map((n) => {
        const Icon = n.icon;
        const isActive = view === n.k;
        return (
          <button key={n.k} onClick={() => setView(n.k)} className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${isActive ? "text-purple-400" : "text-gray-600"}`}>
            <Icon size={21} />
            <span className="text-[9px] font-semibold">{n.label.split(" ")[0]}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* APP ROOT MAIN ENTRY (V7 ARCHITECTURE) ──────────────────────────────────────── */
export default function App() {
  const { plat, setPlat, setMeta, pushUndo, undo, markStep, addTema, updateTema, deleteTema, userName, setUserName, onboardingDone, setOnboardingDone, resetOnboarding, exportKey, importKey, focusMode, toggleFocusMode, setBrainDumpD1, addTemaStats, resetStore } = useStore();
  const temas = useStore((s) => s[plat]?.temas || []);

  // ─── AUTENTICAÇÃO FIREBASE ────────────────────────────────────────────────
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const [view, setView] = useState("dash");
  const [temaParaIniciar, setTemaParaIniciar] = useState(null);
  const [interactiveBrainDump, setInteractiveBrainDump] = useState(null);
  const [helpModal, setHelpModal] = useState(false);

  const [toast,          setToast]          = useState(null);
  const [marking,        setMarking]        = useState(null);
  const [temaEdit,       setTemaEdit]       = useState(null);
  const [ajustes,        setAjustes]        = useState(false);
  const [editName,       setEditName]       = useState(false);
  const [showConfetti,   setShowConfetti]   = useState(false);
  const [cycleComplete,  setCycleComplete]  = useState(null);

  // ─── MONITORAR AUTENTICAÇÃO ───────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const unsubscribe = monitorarAuth(async (user) => {
      if (!isMounted) return;
      console.log("🔐 monitorarAuth callback:", user ? `Logado como ${user.email}` : "NÃO logado");

      if (user) {
        setUsuarioLogado(user);
        setUserName(user.displayName || user.email);

        // Carregar dados do Firebase
        const resultado = await carregarDadosUsuario(user.uid);
        if (resultado.sucesso) {
          const dados = resultado.dados;
          if (dados.plat) setPlat(dados.plat);
          if (dados.meta) setMeta(dados.meta);
        }
      } else {
        setUsuarioLogado(null);
      }

      if (isMounted) {
        setCarregandoAuth(false);
        clearTimeout(timeoutId);
      }
    });

    // Timeout de segurança: se Firebase não responder em 5s, mostra AuthModal de qualquer forma
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log("⚠️ Firebase auth timeout - mostrando AuthModal");
        setCarregandoAuth(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [setUserName, setPlat, setMeta]);

  // ─── SINCRONIZAR DADOS COM FIREBASE (AO MUDAR DADOS) ────────────────────────
  useEffect(() => {
    if (!usuarioLogado) return;

    // Debounce de 3s para evitar múltiplas sincronizações
    const timeout = setTimeout(() => {
      sincronizarComFirebase(usuarioLogado.uid, {
        plat,
        userName,
        temas,
        meta: useStore.getState().meta,
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [usuarioLogado, plat, userName, temas]);

  const filaHoje = useMemo(() => calcFilaInteligente(temas), [temas]);
  const totalFilaHoje = filaHoje.length;
  const concluidosHoje = useMemo(() => {
    return temas.flatMap(t => STEPS.map(s => t.rev[s.key])).filter(r => r.done && r.date === todayStr()).length;
  }, [temas]);

  const overdueCount = useMemo(() => temas.reduce(
    (a, t) => a + STEPS.filter((s) => isOverdue(t.rev[s.key]?.date) && !t.rev[s.key]?.done).length, 0
  ), [temas]);

  const showToast    = useCallback((msg, withUndo = false) => setToast({ msg, undo: withUndo }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const handleMarkConfirm = useCallback(({ acerto, questoes, motivosErro }) => {
    if (!marking) return;
    pushUndo(plat);
    markStep(plat, marking.temaId, marking.stepKey, { acerto, questoes, motivosErro });
    addTemaStats(marking.temaId, { stepKey: marking.stepKey, acerto, questoes, motivosErro });

    // Detectar D21 (mostrar confetes)
    if (marking.stepKey === "d21") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    }

    // Detectar ciclo completo (após postfix)
    setTimeout(() => {
      const state = useStore.getState();
      const temaAtualizado = state[plat].temas.find(t => t.id === marking.temaId);
      if (temaAtualizado && STEPS.every(s => temaAtualizado.rev[s.key].done)) {
        setCycleComplete(temaAtualizado);
      }
    }, 100);

    // Detectar milestones de streak
    const allDone = Object.values(useStore.getState().temaStats).flat().length + 1;
    if ([7, 14, 30, 100, 200].includes(allDone)) {
      setTimeout(() => showToast(`🎯 Marco de ${allDone} revisões concluídas!`), 1500);
    }

    setMarking(null);
    showToast(`✓ Etapa computada com sucesso!`, true);
  }, [marking, plat, pushUndo, markStep, showToast, addTemaStats]);

  const handleSaveTema = useCallback((f) => {
    pushUndo(plat);
    if (!temaEdit?.id) { addTema(plat, f);              showToast(`✓ "${f.nome}" acoplado à grade`, true); }
    else               { updateTema(plat, temaEdit.id, f); showToast("✓ Configurações do tema atualizadas", true); }
    setTemaEdit(null);
  }, [plat, temaEdit, pushUndo, addTema, updateTema, showToast]);

  // ─── SE ESTÁ CARREGANDO, MOSTRA LOADING ────────────────────────────────────
  if (carregandoAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#07070f]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // ─── SE NÃO ESTÁ LOGADO, MOSTRA MODAL DE LOGIN ────────────────────────────
  if (!usuarioLogado) {
    return <AuthModal onSuccess={(user) => setUsuarioLogado(user)} />;
  }

  const handleStudyTrigger = (temaId, stepKey) => {
    const targetTema = temas.find(t => t.id === temaId);
    if (!targetTema) return;
    if (stepKey === "d1") {
      setInteractiveBrainDump({ tema: targetTema, stepKey });
    } else {
      setMarking({ temaId, stepKey });
    }
  };

  const handleBrainDumpComplete = (fields) => {
    if (!interactiveBrainDump) return;
    pushUndo(plat);
    setBrainDumpD1(interactiveBrainDump.tema.id, { ...fields, completedAt: new Date().toISOString() });
    addTemaStats(interactiveBrainDump.tema.id, { stepKey: interactiveBrainDump.stepKey, brainDump: true, ...fields });
    markStep(plat, interactiveBrainDump.tema.id, interactiveBrainDump.stepKey, { acerto: 1.0, questoes: 1, motivosErro: [] });
    setInteractiveBrainDump(null);
    showToast("🧠 Brain Dump consolidado e gravado no perfil!");
  };

  return (
    <div className="flex h-screen bg-[#07070f] text-white font-sans antialiased overflow-hidden">
      {!onboardingDone && <OnboardingModal onComplete={(nome, foco, metaConfig) => { setUserName(nome); setPlat(foco); if (metaConfig) setMeta(metaConfig); setOnboardingDone(); }} />}
      <Sidebar view={view} setView={setView} setAjustes={setAjustes} overdueCount={overdueCount} setHelpModal={setHelpModal} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-[#07070f]/95 border-b border-white/5 shrink-0 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="md:hidden"><MedRevLogo size="sm" /></div>
            <span className="hidden sm:inline-flex text-[10px] font-bold text-gray-600 bg-white/5 px-2 py-0.5 rounded border border-white/5">v7.1</span>
          </div>
          <div className="flex items-center gap-4">
            {!focusMode && (
              <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono font-bold">
                <span>Hoje:</span>
                <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-violet-600 transition-all" style={{ width: `${totalFilaHoje > 0 ? (concluidosHoje / (totalFilaHoje + concluidosHoje)) * 100 : 100}%` }} />
                </div>
                <span>{concluidosHoje}/{totalFilaHoje + concluidosHoje}</span>
              </div>
            )}
            <button type="button" onClick={toggleFocusMode}
              className={`px-3 py-1 rounded-xl text-[12px] font-bold transition-all border flex items-center gap-1 ${focusMode ? "bg-violet-600 text-white border-violet-500" : "bg-white/5 text-gray-400 border-white/10 hover:text-white"}`}>
              {focusMode ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{focusMode ? "Foco On" : "Modo Foco"}</span>
            </button>

            {/* Usuário logado e Logout */}
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] text-gray-600">logado como</p>
                <p className="text-[11px] font-bold text-gray-300 truncate max-w-[100px]">{usuarioLogado?.displayName || usuarioLogado?.email?.split("@")[0]}</p>
              </div>
              <button
                title="Sair"
                onClick={async () => {
                  await sincronizarComFirebase(usuarioLogado.uid, {
                    plat, userName, temas,
                    meta: useStore.getState().meta,
                  });
                  await fazerLogout();
                  resetStore();
                  setUsuarioLogado(null);
                }}
                className="p-1.5 rounded-lg text-[11px] font-bold bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all border border-red-600/30 flex items-center gap-1">
                <X size={14} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-7 md:py-6 pb-28 md:pb-6">
          {view === "sessao" && temaParaIniciar && (
            <SessaoPage 
              temaInicial={temaParaIniciar}
              onCancel={() => { setTemaParaIniciar(null); setView("crono"); }}
              onComplete={(temaCompletado) => {
                const novoId = Date.now();
                addTema(plat, { ...temaCompletado, id: novoId, d0: todayStr() });
                setMarking({ temaId: novoId, stepKey: 'd0' });
                setTemaParaIniciar(null);
                setView("dash");
              }}
            />
          )}

          {view === "dash"  && <Dashboard onStudy={handleStudyTrigger} onDelete={(id) => { deleteTema(plat, id); showToast("🗑 Tema deletado"); }} userName={userName} onEditName={() => setEditName(true)} focusMode={focusMode} concluidosHoje={concluidosHoje} totalFilaHoje={totalFilaHoje} />}
          {view === "crono" && plat === "res" && <Cronograma onStep={handleStudyTrigger} onEdit={(t) => setTemaEdit(t)} onIniciarTema={(tema) => { setTemaParaIniciar(tema); setView("sessao"); }} />}
          {view === "crono" && plat === "vest" && <ErrorBoundary><CronogramaCecilia /></ErrorBoundary>}
          {view === "banco" && <BancoDados />}
          {view === "stats" && <StatsPanel />}
          {view === "sims"  && <ErrorBoundary><Simulados /></ErrorBoundary>}
          {view === "anki"  && <AnkiAudit />}
        </main>
      </div>

      <BottomNav view={view} setView={setView} />

      {marking && temas.find(t => t.id === marking.temaId) && (
        <MarkModal tema={temas.find(t => t.id === marking.temaId)} stepKey={marking.stepKey} onConfirm={handleMarkConfirm} onCancel={() => setMarking(null)} />
      )}
      {interactiveBrainDump && (
        <BrainDumpD1Modal tema={interactiveBrainDump.tema} onConfirm={handleBrainDumpComplete} onCancel={() => setInteractiveBrainDump(null)} />
      )}
      {temaEdit !== null && (
        <TemaModal initial={temaEdit?.id ? temaEdit : null} platKey={plat} onSave={handleSaveTema} onCancel={() => setTemaEdit(null)} onDelete={(id) => { deleteTema(plat, id); setTemaEdit(null); showToast("🗑 Tema removido"); }} />
      )}
      {ajustes && <AjustesModal onClose={() => setAjustes(false)} overdueCount={overdueCount} onResetOnboarding={resetOnboarding} />}

      {showConfetti && <ConfettiOverlay />}
      {cycleComplete && <CycleCompleteModal tema={cycleComplete} onClose={() => setCycleComplete(null)} />}
      {helpModal && <HelpModal onClose={() => setHelpModal(false)} />}

      {editName && (
        <Modal onClose={() => setEditName(false)}>
          <h2 className="text-[14px] font-bold text-white mb-2">Alterar Identificação</h2>
          <Input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} />
          <Btn className="w-full mt-3" onClick={() => setEditName(false)}>Atualizar</Btn>
        </Modal>
      )}

      <Toast toast={toast} onUndo={() => { undo(); dismissToast(); showToast("✓ Desfeito!"); }} onDismiss={dismissToast} />
    </div>
  );
}