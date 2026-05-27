// App.jsx — medrev v5.1
// Tailwind puro · FSRS-Lite · Dashboard com métricas de elite
// Safe-area iOS · Campo PICO/Caso Clínico · Feedback tátil

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Calendar, BarChart3, FileText, Zap, Settings,
  ChevronRight, AlertCircle, Trash2, Edit2, X, Plus, CheckCircle,
  Play, HelpCircle, Download, Upload, Copy
} from "lucide-react";
import {
  useStore, STEPS, ESP_COLORS, PRIO, ESPS_RES, ESPS_VEST, MEDCOF,
  todayStr, addDays, diffDays, fmtDate, fmtFull, fmtMonth,
  isOverdue, isDueToday, isDueSoon, buildRev,
  calcStreaks, calcBleedingScore, calcTrueRetention,
} from "./useStore";

// ─── STATUS HELPERS ───────────────────────────────────────────────────────────
function stepState(r) {
  if (!r) return "future";
  if (r.done)              return "done";
  if (isOverdue(r.date))   return "overdue";
  if (isDueToday(r.date))  return "today";
  if (isDueSoon(r.date))   return "soon";
  return "future";
}
const STATE_TW  = { done:"text-emerald-400", overdue:"text-red-400", today:"text-violet-400", soon:"text-blue-400", future:"text-gray-600" };
const STATE_DOT = { done:"bg-emerald-400",   overdue:"bg-red-400",   today:"bg-violet-400",   soon:"bg-blue-400",   future:"bg-white/10" };

// ─── PRIMITIVOS ───────────────────────────────────────────────────────────────
function Badge({ color, children }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border"
      style={{ background: color + "22", color, borderColor: color + "44" }}>
      {children}
    </span>
  );
}

function Btn({ onClick, variant = "primary", disabled, children, className = "" }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold text-[13px] px-4 py-2 transition-all active:scale-95 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100";
  const variants = {
    primary: "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30",
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

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] text-gray-500 font-semibold mb-1.5 tracking-wide uppercase">{label}</label>
      {children}
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
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

// ─── MARK MODAL ───────────────────────────────────────────────────────────────
function MarkModal({ tema, stepKey, onConfirm, onCancel }) {
  const step    = STEPS.find((s) => s.key === stepKey);
  const [acerto,   setAcerto]   = useState(75);
  const [questoes, setQuestoes] = useState("");
  const isD1  = step.checkbox;
  const col   = acerto >= 90 ? "text-emerald-400" : acerto >= 75 ? "text-violet-400" : acerto >= 55 ? "text-yellow-400" : "text-red-400";
  const label = acerto >= 90 ? "Domínio sólido 🎯" : acerto >= 75 ? "Bom progresso" : acerto >= 55 ? "Em consolidação" : "Ponto fraco — revise mais";

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
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Btn className="flex-1"
          onClick={() => onConfirm({ acerto: isD1 ? null : acerto / 100, questoes: questoes ? +questoes : null })}>
          ✓ Confirmar
        </Btn>
        <Btn variant="ghost" className="flex-1" onClick={onCancel}>Cancelar</Btn>
      </div>
    </Modal>
  );
}

// ─── TEMA MODAL ───────────────────────────────────────────────────────────────
function TemaModal({ initial, platKey, onSave, onCancel, onDelete }) {
  const esps = platKey === "res" ? ESPS_RES : ESPS_VEST;
  const [f, setF] = useState(
    initial || { nome: "", esp: esps[0], d0: todayStr(), prio: "Alta", obs: "", pico: "" }
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

      <div>
        <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-2">Prioridade</p>
        <div className="flex gap-1.5">
          {Object.entries(PRIO).map(([k, { c }]) => (
            <button key={k} onClick={() => setF({ ...f, prio: k })}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold border transition-all active:scale-95 ${f.prio === k ? "border-transparent" : "bg-transparent border-white/10 text-gray-600 hover:text-gray-400"}`}
              style={f.prio === k ? { background: c + "22", color: c, border: `1px solid ${c}55` } : {}}>
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Campo PICO / Caso Clínico — PBL */}
      <Field label="PICO / Caso Clínico (opcional)">
        <Textarea
          rows={3}
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
        {initial && <Btn variant="danger" onClick={() => onDelete(initial.id)}><Trash2 size={16} /></Btn>}
      </div>
    </Modal>
  );
}

// ─── AJUSTES MODAL ────────────────────────────────────────────────────────────
function AjustesModal({ onClose, overdueCount }) {
  const { meta, setMeta, plat, optimize } = useStore();
  const daysLeft = meta.dataProva ? diffDays(todayStr(), meta.dataProva) : null;
  const urgency  = daysLeft == null ? "" : daysLeft <= 30 ? "text-red-400" : daysLeft <= 90 ? "text-yellow-400" : "text-violet-400";

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

      <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">⚡ Otimizar revisões</p>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          Reagenda revisões vencidas a partir de hoje preservando a ordem D0→D1→D4→D7→D21.
          {overdueCount > 0
            ? <> Você tem <strong className="text-red-400">{overdueCount} vencidas</strong>.</>
            : " Nenhuma revisão vencida."}
        </p>
        <Btn onClick={() => { optimize(plat); onClose(); }} disabled={overdueCount === 0} className="w-full">
          Reorganizar {overdueCount > 0 ? `(${overdueCount})` : ""}
        </Btn>
      </div>

      <div className="bg-white/5 rounded-2xl p-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">🧠 FSRS-Lite</p>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          Algoritmo de espaçamento adaptativo ativo. Acertos altos (≥90%) esticam o próximo intervalo em até 80%.
          Acertos baixos (&lt;55%) puxam a revisão 40% mais cedo.
        </p>
      </div>
    </Modal>
  );
}

// ─── CRONO CARD ───────────────────────────────────────────────────────────────
function CronoCard({ tema, onStep, onEdit }) {
  const esp     = ESP_COLORS[tema.esp] || "#94a3b8";
  const allDone = STEPS.every((s) => tema.rev[s.key].done);
  const next    = STEPS.find((s) => !tema.rev[s.key].done);
  const nextR   = next ? tema.rev[next.key] : null;
  const st      = nextR ? stepState(nextR) : "done";
  const status  = st === "overdue" ? "Vencido" : st === "today" ? "Hoje" : fmtDate(nextR.date);

  return (
    <div
      className={`bg-[#111113] border border-white/5 rounded-3xl overflow-hidden transition-all ${allDone ? "opacity-50" : "hover:border-white/10 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]"}`}
      style={{ borderLeft: `4px solid ${esp}` }}
      onClick={() => next && onStep(tema.id, next.key)}>

      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500 mb-2">{tema.esp}</p>
            <p className="text-lg font-semibold text-gray-100 leading-tight line-clamp-2">{tema.nome}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onEdit(tema); }}
            className="w-8 h-8 rounded-full border border-white/10 bg-black hover:border-white/30 transition-colors flex items-center justify-center shrink-0">
            <Edit2 size={14} className="text-gray-400 hover:text-white" />
          </button>
        </div>

        {tema.pico && (
          <p className="text-[11px] text-gray-400 italic leading-relaxed line-clamp-3 border-l-2 pl-3"
            style={{ borderColor: esp + "66" }}>
            {tema.pico}
          </p>
        )}

        {!allDone && next && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${st === "overdue" ? "bg-red-600/15 text-red-200" : st === "today" ? "bg-violet-600/15 text-violet-200" : "bg-white/5 text-gray-300"}`}>
              {status}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">{next.label}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 flex gap-1.5">
            {STEPS.map((s) => {
              const st2 = stepState(tema.rev[s.key]);
              return (
                <div key={s.key} title={`${s.label} · ${s.desc}`}
                  className={`flex-1 h-2 rounded-full transition-all ${tema.rev[s.key].done ? "bg-emerald-500" : STATE_DOT[st2]}`} />
              );
            })}
          </div>
          <span className="text-[11px] text-gray-400 font-semibold">RO: {next ? next.label : "Fixação"}</span>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PÁGINAS
// ═════════════════════════════════════════════════════════════════════════════

/* DASHBOARD ─────────────────────────────────────────────────────────────────── */
function Dashboard({ onStudy, onDelete, userName, onEditName }) {
  const { plat, meta }  = useStore();
  const temas           = useStore((s) => s[plat].temas);
  const metaA           = meta.acerto || 80;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const allRev  = temas.flatMap((t) => STEPS.map((s) => ({ ...t.rev[s.key], esp: t.esp, step: s, temaNome: t.nome, temaId: t.id, temaObs: t.obs })));
  const overdue = allRev.filter((r) => isOverdue(r.date)  && !r.done);
  const today_  = allRev.filter((r) => isDueToday(r.date) && !r.done);
  const soon_   = allRev.filter((r) => isDueSoon(r.date)  && !r.done);
  const done    = allRev.filter((r) => r.done);
  const pending = overdue.length + today_.length;
  const totalToday = pending + done.filter((r) => r.date === todayStr()).length;
  const doneToday  = done.filter((r) => r.date === todayStr()).length;
  const progressPct = totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : 0;

  const totalQ    = done.reduce((a, r) => a + (r.questoes || 0), 0);
  const accs      = done.filter((r) => r.acerto != null).map((r) => r.acerto);
  const acc       = accs.length ? Math.round(accs.reduce((a, b) => a + b) / accs.length * 100) : null;
  const dominados = temas.filter((t) => STEPS.every((s) => t.rev[s.key].done)).length;

  const doneDays = new Set(done.map((r) => r.date));
  const { current: streakCur, best: streakBest } = calcStreaks(doneDays);
  const trueRet = calcTrueRetention(temas);
  const bleeding = calcBleedingScore(temas);

  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 34 + i);
    return d.toISOString().slice(0, 10);
  });

  const stepStats = STEPS.filter((s) => s.key !== "d1").map((s) => {
    const rs = done.filter((r) => r.step.key === s.key && r.acerto != null);
    return { ...s, n: rs.length, media: rs.length ? rs.reduce((a, b) => a + b.acerto, 0) / rs.length * 100 : null };
  });

  const noData = <span className="text-[12px] text-gray-600 italic">Dados insuficientes</span>;

  // Abreviação de especialidade (2 letras)
  const espAbbr = (esp) => {
    const map = {
      "Cirurgia": "CI", "Clínica Médica": "CM", "GO": "GO", "Pediatria": "PE",
      "Preventiva": "PR", "Outro": "OU", "Exatas": "EX", "Humanas": "HU",
      "Linguagens": "LI", "Ciências da Natureza": "CN", "Redação": "RE",
    };
    return map[esp] || esp.slice(0, 2).toUpperCase();
  };

  const espColor = (esp) => ESP_COLORS[esp] || "#94a3b8";

  return (
    <div className="flex flex-col gap-5 animate-fade-up">

      {/* Saudação + progresso */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {userName}.</h1>
          <button onClick={onEditName} className="text-gray-500 hover:text-gray-300 transition-colors">
            <Edit2 size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-[11px] text-gray-500 shrink-0 tabular-nums">{progressPct}% de hoje</span>
        </div>
      </div>

      {overdue.length > 3 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-[13px] text-gray-200">
            <strong className="text-red-400">{overdue.length} revisões vencidas.</strong>{" "}
            Ajustes → Otimizar para reagendar.
          </p>
        </div>
      )}

      {/* Grid assimétrico: col principal (8) + métricas (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Coluna esquerda: span 8 ── */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* Card gigante "Para Fazer Hoje" */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Para fazer hoje</p>
                <div className="flex items-end gap-2">
                  <span className={`text-[56px] font-black leading-none tabular-nums ${pending > 0 ? "text-white" : "text-emerald-400"}`}>
                    {pending}
                  </span>
                  <span className="text-[14px] text-gray-500 mb-2">pendentes</span>
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center gap-1">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Questões totais</p>
                <p className="text-[22px] font-black text-violet-400 tabular-nums leading-none">
                  {totalQ > 0 ? totalQ.toLocaleString("pt-BR") : "0"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/5">
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Acerto médio</p>
                <p className={`text-[18px] font-black tabular-nums ${acc == null ? "text-gray-600" : acc >= metaA ? "text-emerald-400" : acc >= 55 ? "text-yellow-400" : "text-red-400"}`}>
                  {acc != null ? acc + "%" : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Dominados</p>
                <p className="text-[18px] font-black text-emerald-400 tabular-nums">{dominados}<span className="text-[11px] text-gray-600 font-normal"> / {temas.length}</span></p>
              </div>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Em breve</p>
                <p className="text-[18px] font-black text-blue-400 tabular-nums">+{soon_.length}</p>
              </div>
            </div>
          </div>

          {/* Lista da Fila de Hoje */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-bold text-white">Fila de hoje</h3>
              {pending > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 leading-none">{pending}</span>
              )}
            </div>
            {pending === 0
              ? <div className="text-center text-gray-600 text-[13px] py-8 flex flex-col items-center gap-2"><CheckCircle size={28} className="text-emerald-400" /> Tudo em dia!</div>
              : <div className="flex flex-col divide-y divide-white/5">
                  {[...overdue, ...today_].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      {/* Badge especialidade */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0"
                        style={{ background: espColor(r.esp) + "22", color: espColor(r.esp) }}>
                        {espAbbr(r.esp)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-white truncate">{r.temaNome}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-600 uppercase tracking-wide">{r.step.label}</span>
                          <span className="text-gray-700">·</span>
                          <span className="text-[10px] text-gray-600">{r.step.desc}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => onStudy(r.temaId, r.step.key)}
                          className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-[11px] font-semibold hover:bg-violet-500 transition-colors">
                          Revisar
                        </button>
                        {r.temaObs?.includes("MEDCOF") && (
                          <button onClick={() => onDelete(r.temaId)}
                            className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center">
                            <Trash2 size={16} />
                          </button>
                        )}
                        <span className={`text-[10px] font-bold ${isOverdue(r.date) ? "text-red-400" : "text-violet-400"}`}>
                          {isOverdue(r.date) ? "vencido" : "hoje"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>}
          </div>

          {/* Acerto por intervalo */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-[13px] font-bold text-white">Acerto por intervalo (FSRS-Lite)</h3>
            {stepStats.every((s) => s.n === 0)
              ? <p className="text-[13px] text-gray-600 py-4 text-center">{noData}</p>
              : stepStats.map((s) => {
                  const col     = s.media == null ? "bg-white/10" : s.media >= metaA ? "bg-emerald-500" : s.media >= 55 ? "bg-yellow-500" : "bg-red-500";
                  const textCol = s.media == null ? "text-gray-600" : s.media >= metaA ? "text-emerald-400" : s.media >= 55 ? "text-yellow-400" : "text-red-400";
                  return (
                    <div key={s.key}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[12px] text-gray-400">
                          {s.label} · {s.desc}
                          <span className="text-gray-700 ml-1.5">({s.n})</span>
                        </span>
                        <span className={`text-[12px] font-bold tabular-nums ${textCol}`}>
                          {s.media != null ? Math.round(s.media) + "%" : "—"}
                        </span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full">
                        {s.media != null && (
                          <div className={`h-full rounded-full transition-all duration-500 ${col}`}
                            style={{ width: `${s.media}%` }} />
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* ── Coluna direita: span 4 ── */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* Heatmap */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold">Constância</p>
            <div className="grid grid-cols-7 gap-1.5">
              {["D","S","T","Q","Q","S","S"].map((d, i) => (
                <div key={i} className="text-center text-[9px] text-gray-700 font-bold">{d}</div>
              ))}
              {days.map((d) => (
                <div key={d} title={fmtFull(d)}
                  className={`aspect-square rounded-sm transition-colors ${doneDays.has(d) ? "bg-violet-500" : d === todayStr() ? "bg-white/10 ring-1 ring-violet-500/40" : "bg-white/[0.04]"}`} />
              ))}
            </div>
            <p className="text-[10px] text-gray-600">Últimos 35 dias</p>
          </div>

          {/* True Retention */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold">True Retention</p>
            {trueRet == null
              ? <div className="flex-1 flex items-center py-2">{noData}</div>
              : <>
                  <span className={`text-[36px] font-black leading-none tabular-nums ${trueRet >= metaA ? "text-emerald-400" : trueRet >= 55 ? "text-yellow-400" : "text-red-400"}`}>
                    {trueRet}%
                  </span>
                  <div className="h-1 bg-white/5 rounded-full">
                    <div className={`h-full rounded-full transition-all ${trueRet >= metaA ? "bg-emerald-500" : trueRet >= 55 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${trueRet}%` }} />
                  </div>
                  <p className="text-[11px] text-gray-600">
                    {trueRet >= metaA ? "Consolidação sólida no D21" : "Conhecimento não sobrevivendo ao tempo"}
                  </p>
                </>}
          </div>

          {/* Momentum */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold">Momentum</p>
            {streakCur === 0 && streakBest === 0
              ? <div className="py-2">{noData}</div>
              : <>
                  <div className="flex items-end gap-2">
                    <span className={`text-[36px] font-black leading-none tabular-nums ${streakCur > 0 ? "text-emerald-400" : "text-gray-600"}`}>
                      {streakCur}
                    </span>
                    <span className="text-[12px] text-gray-500 mb-1">dias</span>
                  </div>
                  <p className="text-[11px] text-gray-600">
                    Recorde: <strong className="text-gray-400">{streakBest}d</strong>
                  </p>
                </>}
          </div>

          {/* Bleeding Score */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold">Pontos Críticos</p>
            {bleeding.length === 0
              ? <div className="py-2">{noData}</div>
              : <div className="flex flex-col gap-2.5">
                  {bleeding.map((b, i) => (
                    <div key={b.esp} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] text-gray-600 shrink-0 w-4 font-bold">#{i + 1}</span>
                        <span className="text-[12px] text-gray-300 truncate font-medium">{b.esp}</span>
                      </div>
                      <span className={`text-[13px] font-black tabular-nums shrink-0 ${b.acc < 55 ? "text-red-400" : b.acc < 70 ? "text-orange-400" : "text-yellow-400"}`}>
                        {b.acc}%
                      </span>
                    </div>
                  ))}
                  <p className="text-[10px] text-gray-600 mt-1">Mín. 10 questões por área</p>
                </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* CRONOGRAMA ─────────────────────────────────────────────────────────────────── */
function Cronograma({ onStep, onEdit }) {
  const { plat, addTema, pushUndo } = useStore();
  const temas = useStore((s) => s[plat].temas);
  const [q, setQ]         = useState("");
  const [filter, setFilter] = useState("todos");

  const temaMap = new Map(temas.map((t) => [t.nome, t]));

  const handleIniciar = (nome, esp, prio, blocoNum) => {
    pushUndo(plat);
    addTema(plat, { nome, esp, prio, d0: todayStr(), obs: `MEDCOF Bloco ${blocoNum}`, pico: "" });
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="Buscar tema..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-[220px]" />
        <div className="flex gap-1 bg-[#111113] border border-white/5 rounded-xl p-1">
          {[["todos","Todos"],["iniciados","Iniciados"],["nao","Não iniciados"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all ${filter === v ? "bg-violet-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Btn onClick={() => onEdit({})} className="text-[12px] gap-2"><Plus size={16} /> Novo tema</Btn>
      </div>

      {MEDCOF.map((bl) => {
        const blTemas = bl.t.filter(([nome]) => {
          if (q && !nome.toLowerCase().includes(q.toLowerCase())) return false;
          const ativo = temaMap.has(nome);
          if (filter === "iniciados" && !ativo) return false;
          if (filter === "nao" && ativo) return false;
          return true;
        });
        if (blTemas.length === 0) return null;

        const startedCount  = bl.t.filter(([nome]) => temaMap.has(nome)).length;
        const progressPct   = Math.round((startedCount / bl.t.length) * 100);

        return (
          <div key={bl.b} className="space-y-4">
            <div className="rounded-3xl border border-white/5 bg-[#111113]/80 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15 text-sm font-bold text-violet-200">
                    {bl.b}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-100">Bloco {bl.b}</p>
                    <p className="text-[11px] text-gray-500">{startedCount} de {bl.t.length} iniciados</p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-400">{progressPct}% iniciado</div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {blTemas.map(([nome, esp, prio]) => {
                const tema = temaMap.get(nome);
                if (tema) return <CronoCard key={nome} tema={tema} onStep={onStep} onEdit={onEdit} />;

                const espC  = ESP_COLORS[esp] || "#94a3b8";
                const prioC = PRIO[prio]?.c   || "#94a3b8";
                return (
                  <div key={nome}
                    className="bg-[#111113]/60 rounded-3xl p-5 flex flex-col gap-4 opacity-70 hover:opacity-90 transition-opacity"
                    style={{ border: `1px dashed ${espC}33`, borderLeft: `4px dashed ${espC}55` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.35em] mb-1.5" style={{ color: espC + "99" }}>{esp}</p>
                        <p className="text-[14px] font-semibold text-gray-400 leading-tight line-clamp-2">{nome}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5"
                        style={{ background: prioC + "22", color: prioC }}>{prio}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {STEPS.map((s) => (
                        <div key={s.key} className="flex-1 h-1.5 rounded-full bg-white/[0.06]" title={s.label} />
                      ))}
                    </div>
                    <button
                      onClick={() => handleIniciar(nome, esp, prio, bl.b)}
                      className="w-full py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-violet-600/20 hover:border-violet-500/40 text-[12px] font-semibold text-gray-500 hover:text-violet-300 transition-all active:scale-95 flex items-center justify-center gap-2">
                      <Play size={14} /> Iniciar Hoje
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
    const h = ["Nome","Área","D0","Progresso","Questões","Acerto%","Próximo","Data","PICO"];
    const d = rows.map((r) => [r.nome, r.esp, r.rev.d0.date, `${r.doneN}/${STEPS.length}`, r.questoes, r.acc ?? "", r.nextStep ?? "concluído", r.nextDate ?? "", (r.pico||"").replace(/,/g,"")]);
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent([h, ...d].map((r) => r.join(",")).join("\n"));
    a.download = "reviewflow.csv"; a.click();
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
        <span className="text-[12px] text-gray-600">{rows.length} temas</span>
        <div className="flex-1" />
        <Btn variant="ghost" onClick={exportCSV} className="text-[12px] gap-2"><FileText size={16} /> CSV</Btn>
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
                      <p className="text-[12.5px] font-semibold text-gray-200">{r.nome}</p>
                      <p className="text-[10.5px] font-bold mt-0.5" style={{ color: espC }}>{r.esp}</p>
                      {r.pico && <p className="text-[10px] text-gray-600 italic mt-0.5 line-clamp-1">{r.pico}</p>}
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
        {rows.length === 0 && <p className="text-center text-gray-600 text-[13px] py-12">Nenhum tema encontrado.</p>}
      </div>
    </div>
  );
}

/* SIMULADOS ──────────────────────────────────────────────────────────────────── */
function Simulados() {
  const { plat, addSim, deleteSim } = useStore();
  const simulados = useStore((s) => s[plat].simulados);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ data: todayStr(), total: 120, acertos: "" });
  const avg  = simulados.length ? Math.round(simulados.reduce((a, s) => a + s.pct, 0) / simulados.length) : null;
  const best = simulados.length ? Math.max(...simulados.map((s) => s.pct)) : null;

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-gray-400" />
          <h2 className="text-[15px] font-bold text-gray-100">Simulados</h2>
        </div>
        <Btn onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Registrar</Btn>
      </div>
      {simulados.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[["Média", avg != null ? avg + "%" : "—", avg >= 80 ? "text-emerald-400" : avg >= 55 ? "text-yellow-400" : "text-red-400"],
            ["Melhor", best != null ? best + "%" : "—", best >= 80 ? "text-emerald-400" : best >= 55 ? "text-yellow-400" : "text-red-400"],
            ["Total", simulados.length, "text-violet-400"]].map(([l, v, c]) => (
            <div key={l} className="bg-[#111113] border border-white/5 rounded-2xl p-4">
              <p className="text-[10.5px] text-gray-500 uppercase tracking-wider mb-2">{l}</p>
              <p className={`text-3xl font-black tabular-nums ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {simulados.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <FileText size={48} className="text-gray-600" />
            <p className="text-[14px] text-gray-500">Nenhum simulado registrado.</p>
          </div>
        )}
        {[...simulados].reverse().map((s) => {
          const col = s.pct >= 80 ? "text-emerald-400" : s.pct >= 55 ? "text-yellow-400" : "text-red-400";
          const bar = s.pct >= 80 ? "bg-emerald-500" : s.pct >= 55 ? "bg-yellow-500" : "bg-red-500";
          return (
            <div key={s.id} className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[14px] font-black shrink-0 tabular-nums ${col}`}
                style={{ background: s.pct >= 80 ? "#34d39922" : s.pct >= 55 ? "#fbbf2422" : "#f8717122" }}>
                {s.pct}%
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-200">{fmtFull(s.data)}</p>
                <p className="text-[11.5px] text-gray-500 mt-0.5">{s.acertos} de {s.total} questões</p>
              </div>
              <div className="hidden sm:block w-24 h-1.5 bg-white/5 rounded-full shrink-0">
                <div className={`h-full rounded-full ${bar}`} style={{ width: `${s.pct}%` }} />
              </div>
              <button onClick={() => deleteSim(plat, s.id)} className="text-gray-700 hover:text-red-400 transition-colors shrink-0"><Trash2 size={18} /></button>
            </div>
          );
        })}
      </div>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <h2 className="text-[15px] font-bold text-gray-100">Registrar simulado</h2>
          <Field label="Data"><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total"><Input type="number" value={f.total} onChange={(e) => setF({ ...f, total: +e.target.value })} /></Field>
            <Field label="Acertos"><Input type="number" value={f.acertos} onChange={(e) => setF({ ...f, acertos: +e.target.value })} /></Field>
          </div>
          {f.acertos && f.total && (
            <p className="text-center text-3xl font-black text-violet-400 tabular-nums">
              {Math.round(f.acertos / f.total * 100)}%
            </p>
          )}
          <div className="flex gap-2">
            <Btn className="flex-1"
              onClick={() => { if (f.acertos && f.total) { addSim(plat, { ...f, pct: Math.round(f.acertos / f.total * 100) }); setOpen(false); setF({ data: todayStr(), total: 120, acertos: "" }); } }}
              disabled={!f.acertos || !f.total}>Salvar</Btn>
            <Btn variant="ghost" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ANKI AUDIT ─────────────────────────────────────────────────────────────────── */
function AnkiAudit() {
  const { plat, addAnki } = useStore();
  const ankiLog = useStore((s) => s[plat].ankiLog);
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
        </div>
        <Btn onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Registrar</Btn>
      </div>
      {ankiLog.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[["Revisados", ankiLog.reduce((a, l) => a + (l.revisados || 0), 0).toLocaleString("pt-BR"), "text-violet-400"],
            ["Novos cards", ankiLog.reduce((a, l) => a + (l.novos || 0), 0).toLocaleString("pt-BR"), "text-blue-400"],
            ["Again médio", avgAgain != null ? avgAgain + "%" : "—", avgAgain != null && avgAgain < 15 ? "text-emerald-400" : "text-yellow-400"]].map(([l, v, c]) => (
            <div key={l} className="bg-[#111113] border border-white/5 rounded-2xl p-4">
              <p className="text-[10.5px] text-gray-500 uppercase tracking-wider mb-2">{l}</p>
              <p className={`text-3xl font-black tabular-nums ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {ankiLog.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <Zap size={48} className="text-gray-600" />
            <p className="text-[14px] text-gray-500">Nenhuma sessão registrada.</p>
          </div>
        )}
        {[...ankiLog].reverse().map((l) => {
          const pct = l.revisados ? Math.round(l.again / l.revisados * 100) : 0;
          const col = pct < 15 ? "text-emerald-400" : pct < 30 ? "text-yellow-400" : "text-red-400";
          return (
            <div key={l.id} className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
              <span className="text-[12px] text-gray-500 shrink-0 w-20">{fmtFull(l.data)}</span>
              <div className="flex gap-5 flex-1">
                {[["Revisados", l.revisados, "text-violet-400"], ["Novos", l.novos || 0, "text-blue-400"], ["Again", pct + "%", col]].map(([lbl, val, c]) => (
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
          <h2 className="text-[15px] font-bold text-gray-100">Sessão Anki</h2>
          <Field label="Data"><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Revisados"><Input type="number" value={f.revisados} onChange={(e) => setF({ ...f, revisados: +e.target.value })} /></Field>
            <Field label='"Again"'><Input type="number" value={f.again} onChange={(e) => setF({ ...f, again: +e.target.value })} /></Field>
            <Field label="Novos"><Input type="number" value={f.novos} onChange={(e) => setF({ ...f, novos: +e.target.value })} /></Field>
          </div>
          {f.revisados > 0 && (
            <p className="text-center text-2xl font-black text-violet-400 tabular-nums">
              {Math.round(f.again / f.revisados * 100)}% Again
            </p>
          )}
          <div className="flex gap-2">
            <Btn className="flex-1"
              onClick={() => { if (f.revisados) { addAnki(plat, f); setOpen(false); setF({ data: todayStr(), revisados: "", again: "", novos: "" }); } }}
              disabled={!f.revisados}>Salvar</Btn>
            <Btn variant="ghost" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
  { k: "dash",  icon: LayoutDashboard, label: "Dashboard"     },
  { k: "crono", icon: Calendar,        label: "Cronograma"     },
  { k: "banco", icon: BarChart3,       label: "Banco de Dados" },
  { k: "sims",  icon: FileText,        label: "Simulados"      },
  { k: "anki",  icon: Zap,             label: "Anki Audit"     },
];

// ─── SIDEBAR (desktop) ────────────────────────────────────────────────────────
function Sidebar({ view, setView, setAjustes, overdueCount, setHelpModal, setSyncModal }) {
  const { plat, setPlat, meta } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const daysLeft = meta.dataProva ? diffDays(todayStr(), meta.dataProva) : null;
  const urgency  = daysLeft == null ? "text-violet-400" : daysLeft <= 30 ? "text-red-400" : daysLeft <= 90 ? "text-yellow-400" : "text-violet-400";

  return (
    <aside className={`hidden md:flex flex-col bg-black border-r border-white/5 shrink-0 transition-all duration-200 ${collapsed ? "w-[60px]" : "w-56"}`}>

      <div className={`flex items-center border-b border-white/5 p-3 gap-2 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && <span className="text-[15px] font-black text-violet-400 tracking-tight select-none">medrev</span>}
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 transition-colors shrink-0">
          {collapsed ? <ChevronRight size={16} /> : <ChevronRight size={16} style={{transform: 'scaleX(-1)'}} />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex gap-1 p-3 pb-2">
          {[["res","Residência"],["vest","Vestibular"]].map(([k, l]) => (
            <button key={k} onClick={() => setPlat(k)}
              className={`flex-1 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all ${plat === k ? "bg-violet-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}>
              {l}
            </button>
          ))}
        </div>
      )}

      <nav className="flex-1 p-2 pt-2 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <button key={n.k} onClick={() => setView(n.k)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all text-left ${view === n.k ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"} ${collapsed ? "justify-center" : ""}`}>
              <Icon size={20} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className={`text-[13px] truncate flex-1 ${view === n.k ? "font-semibold" : "font-medium"}`}>{n.label}</span>
                  {n.k === "crono" && overdueCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{overdueCount}</span>
                  )}
                </>
              )}
              {collapsed && n.k === "crono" && overdueCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-white/5 flex flex-col gap-1">
        {!collapsed && daysLeft != null && (
          <div className="bg-white/5 rounded-xl px-3 py-2.5 mb-1">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Prova em</p>
            <p className={`text-2xl font-black leading-none tabular-nums ${urgency}`}>
              {daysLeft}<span className="text-[12px] font-normal text-gray-600"> dias</span>
            </p>
            <p className="text-[10px] text-gray-600 mt-1">{fmtFull(meta.dataProva)}</p>
          </div>
        )}
        <button onClick={() => setHelpModal(true)}
          className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all ${collapsed ? "justify-center" : ""}`}>
          <HelpCircle size={20} className="shrink-0" />
          {!collapsed && <span className="text-[13px] font-medium">Ajuda</span>}
        </button>
        <button onClick={() => setSyncModal(true)}
          className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all ${collapsed ? "justify-center" : ""}`}>
          <Download size={20} className="shrink-0" />
          {!collapsed && <span className="text-[13px] font-medium">Sincronizar</span>}
        </button>
        <button onClick={() => setAjustes(true)}
          className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all ${collapsed ? "justify-center" : ""}`}>
          <Settings size={20} className="shrink-0" />
          {!collapsed && <span className="text-[13px] font-medium">Ajustes</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── BOTTOM NAV (mobile) — safe-area iOS corrigida ────────────────────────────
function BottomNav({ view, setView, overdueCount }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-black/90 backdrop-blur-md border-t border-white/5 z-40 flex items-stretch justify-around pt-2"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}>
      {NAV.map((n) => {
        const Icon = n.icon;
        return (
          <button key={n.k} onClick={() => setView(n.k)}
            className={`relative flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all active:scale-90 ${view === n.k ? "text-violet-400" : "text-gray-600 active:text-gray-400"}`}>
            <Icon size={24} className="leading-none" />
            <span className={`text-[9px] font-semibold leading-none ${view === n.k ? "text-violet-400" : "text-gray-600"}`}>
              {n.label.split(" ")[0]}
            </span>
            {n.k === "crono" && overdueCount > 0 && (
              <span className="absolute top-0.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-1 ring-gray-900" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const { plat, setPlat, pushUndo, undo, markStep, addTema, updateTema, deleteTema, userName, setUserName, exportKey, importKey } = useStore();
  const temas = useStore((s) => s[plat].temas);

  const [view,        setView]        = useState("dash");
  const [toast,       setToast]       = useState(null);
  const [marking,     setMarking]     = useState(null);
  const [temaEdit,    setTemaEdit]    = useState(null);
  const [ajustes,     setAjustes]     = useState(false);
  const [syncModal,   setSyncModal]   = useState(false);
  const [helpModal,   setHelpModal]   = useState(false);
  const [editName,    setEditName]    = useState(false);
  const [searchQ,     setSearchQ]     = useState("");

  const overdueCount = temas.reduce(
    (a, t) => a + STEPS.filter((s) => isOverdue(t.rev[s.key].date) && !t.rev[s.key].done).length, 0
  );

  const showToast   = useCallback((msg, withUndo = false) => setToast({ msg, undo: withUndo }), []);
  const dismissToast= useCallback(() => setToast(null), []);

  const handleUndo = useCallback(() => {
    undo();
    dismissToast();
    showToast("✓ Desfeito");
  }, [undo, dismissToast, showToast]);

  const handleMarkConfirm = useCallback(({ acerto, questoes }) => {
    if (!marking) return;
    pushUndo(plat);
    markStep(plat, marking.temaId, marking.stepKey, { acerto, questoes });
    const step = STEPS.find((s) => s.key === marking.stepKey);
    setMarking(null);
    showToast(`✓ ${step.label} marcado!`, true);
  }, [marking, plat, pushUndo, markStep, showToast]);

  const handleSaveTema = useCallback((f) => {
    pushUndo(plat);
    if (!temaEdit?.id) { addTema(plat, f);              showToast(`✓ "${f.nome}" adicionado`, true); }
    else               { updateTema(plat, temaEdit.id, f); showToast("✓ Tema atualizado", true); }
    setTemaEdit(null);
  }, [plat, temaEdit, pushUndo, addTema, updateTema, showToast]);

  const handleStudy = useCallback((temaId, stepKey) => {
    setMarking({ temaId, stepKey });
  }, []);

  const handleDeleteTema = useCallback((id) => {
    pushUndo(plat);
    deleteTema(plat, id);
    setTemaEdit(null);
    showToast("🗑 Tema removido", true);
  }, [plat, pushUndo, deleteTema, showToast]);

  const curTema = marking ? temas.find((t) => t.id === marking.temaId) : null;

  return (
    <div className="flex h-screen bg-black text-white font-sans antialiased overflow-hidden">
      <Sidebar view={view} setView={setView} setAjustes={setAjustes} overdueCount={overdueCount} setHelpModal={setHelpModal} setSyncModal={setSyncModal} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile */}
        <header className="md:hidden flex flex-col gap-3 px-4 py-3 bg-black border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-black text-violet-400 select-none">medrev</span>
            <div className="flex items-center gap-1.5">
              {overdueCount > 0 && (
                <span className="bg-red-500/15 text-red-400 border border-red-500/25 text-[10px] font-bold rounded-full px-2 py-0.5">
                  {overdueCount}
                </span>
              )}
              <button onClick={() => setHelpModal(true)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
                <HelpCircle size={16} />
              </button>
              <button onClick={() => setSyncModal(true)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
                <Download size={16} />
              </button>
              <button onClick={() => setAjustes(true)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
                <Settings size={16} />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            {[["res","Residência"],["vest","Vestibular"]].map(([k, l]) => (
              <button key={k} onClick={() => setPlat(k)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${plat === k ? "bg-violet-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}>
                {l}
              </button>
            ))}
          </div>
        </header>

        {/* Área de scroll principal */}
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-7 md:py-6 pb-28 md:pb-6">
          {view === "dash"  && <Dashboard onStudy={handleStudy} onDelete={handleDeleteTema} userName={userName} onEditName={() => setEditName(true)} />}
          {view === "crono" && (
            <Cronograma
              onStep={(tId, sKey) => setMarking({ temaId: tId, stepKey: sKey })}
              onEdit={(t) => setTemaEdit(t)} />
          )}
          {view === "banco" && <BancoDados />}
          {view === "sims"  && <Simulados />}
          {view === "anki"  && <AnkiAudit />}
        </main>
      </div>

      <BottomNav view={view} setView={setView} overdueCount={overdueCount} />

      {/* Modais */}
      {marking && curTema && (
        <MarkModal tema={curTema} stepKey={marking.stepKey} onConfirm={handleMarkConfirm} onCancel={() => setMarking(null)} />
      )}
      {temaEdit !== null && (
        <TemaModal initial={temaEdit?.id ? temaEdit : null} platKey={plat} onSave={handleSaveTema} onCancel={() => setTemaEdit(null)} onDelete={handleDeleteTema} />
      )}
      {ajustes && <AjustesModal onClose={() => setAjustes(false)} overdueCount={overdueCount} />}

      {syncModal && (
        <Modal onClose={() => setSyncModal(false)} wide>
          <h2 className="text-[15px] font-bold text-gray-100">💾 Sincronizar dados</h2>
          <p className="text-[12px] text-gray-500">Copie a chave abaixo para backup ou compartilhe com outro dispositivo.</p>
          <div className="bg-black/50 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-gray-300 break-all max-h-24 overflow-y-auto">
            {exportKey()}
          </div>
          <div className="flex gap-2">
            <Btn className="flex-1 gap-2" onClick={() => { navigator.clipboard.writeText(exportKey()); showToast("✓ Chave copiada"); }}>
              <Copy size={16} /> Copiar
            </Btn>
          </div>
          <p className="text-[12px] text-gray-500 mt-4">Ou importe uma chave existente:</p>
          <Textarea placeholder="Cole a chave aqui..." className="text-[12px]" id="importInput" />
          <Btn variant="ghost" className="w-full gap-2" onClick={() => {
            const input = document.getElementById("importInput");
            if (importKey(input.value)) { showToast("✓ Dados importados"); setSyncModal(false); } else { showToast("✗ Chave inválida"); }
          }}>
            <Upload size={16} /> Importar
          </Btn>
        </Modal>
      )}

      {editName && (
        <Modal onClose={() => setEditName(false)}>
          <h2 className="text-[15px] font-bold text-gray-100">Seu nome</h2>
          <Input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Ex: Enzo" />
          <Btn className="w-full" onClick={() => setEditName(false)}>Pronto</Btn>
        </Modal>
      )}

      {helpModal && (
        <Modal onClose={() => setHelpModal(false)} wide>
          <h2 className="text-[15px] font-bold text-gray-100 mb-3">📚 Como funciona</h2>
          <div className="space-y-4 text-[12px] text-gray-400">
            <div>
              <p className="font-semibold text-gray-200 mb-1">📊 Dashboard</p>
              <p>Visão geral do seu progresso hoje, com métricas de acerto, dominados e próximas revisões.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-200 mb-1">📋 Cronograma</p>
              <p>26 blocos MEDCOF. Clique "Iniciar Hoje" em temas adormecidos ou revise os já iniciados.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-200 mb-1">📊 Banco de Dados</p>
              <p>Todos os seus temas em uma tabela. Veja progresso, acerto % e próximas revisões.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-200 mb-1">📝 Simulados</p>
              <p>Registre seus simulados e acompanhe a evolução da sua % de acerto.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-200 mb-1">⚡ Anki Audit</p>
              <p>Rastreie suas sessões Anki e a taxa de "Again" para otimizar o deck.</p>
            </div>
          </div>
        </Modal>
      )}

      <Toast toast={toast} onUndo={handleUndo} onDismiss={dismissToast} />
    </div>
  );
}