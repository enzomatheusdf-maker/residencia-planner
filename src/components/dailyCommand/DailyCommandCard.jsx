import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { confidenceLabel, humanizeSignal } from "../../core/copy";

export function DailyProgressRing({ value, goal }) {
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

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

function formatTaskMinutes(minutes) {
  const value = Math.max(0, Math.round(Number(minutes) || 0));
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const remainder = value % 60;
  return remainder > 0 ? `${hours}h${String(remainder).padStart(2, "0")}` : `${hours}h`;
}

export function DailyCommandModal({ open, onClose, tasks, completedCount, totalMinutes, onRunPrimary, primaryLabel }) {
  if (!open) return null;
  const safeTasks = tasks.length > 0 ? tasks : [{
    id: "empty",
    title: "Manter consistência leve",
    detail: "Sem tarefas críticas abertas agora.",
    badge: "Hoje",
    tone: "emerald",
  }];
  const total = safeTasks.length;
  const done = Math.min(completedCount || 0, total);
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const badgeClass = {
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    blue: "border-blue-400/25 bg-blue-400/12 text-blue-200",
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Comando do dia">
      <div className="w-full max-w-xl overflow-hidden rounded-[26px] border border-blue-400/20 bg-[#0b1220] p-5 shadow-[0_40px_120px_rgba(0,0,0,.62)]">
        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">Comando do dia</p>
              <h3 className="mt-1 text-xl font-black text-white">
                Hoje: {total} {pluralize(total, "tarefa", "tarefas")} · {formatTaskMinutes(totalMinutes)}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
              aria-label="Fechar Comando do dia"
            >
              <X size={17} />
            </button>
          </div>

          <div className="my-4">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span>Progresso do dia</span>
              <span>{done} / {total}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="max-h-[48vh] space-y-2.5 overflow-y-auto pr-1">
            {safeTasks.map((task, index) => (
              <div
                key={task.id || `${task.title}-${index}`}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-300/10 text-[10px] font-black text-cyan-200">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-black text-white">{task.title}</span>
                  <span className="block truncate text-[11px] text-slate-400">{task.detail}</span>
                </span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${badgeClass[task.tone] || badgeClass.blue}`}>
                  {task.badge}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-blue-400/25 bg-blue-500/12 p-3.5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">Próxima ação</p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRunPrimary();
              }}
              className="mt-2 inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 text-[12px] font-black leading-none text-white shadow-lg shadow-blue-950/25 hover:from-blue-500 hover:to-sky-400"
            >
              {primaryLabel || "Executar ação"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CONFIDENCE_STYLES = {
  alta: {
    bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    dot: "bg-emerald-400",
  },
  média: {
    bg: "bg-blue-500/10 border-blue-500/20 text-blue-300",
    dot: "bg-blue-400",
  },
  explorando: {
    bg: "bg-amber-500/10 border-amber-500/20 text-amber-300",
    dot: "bg-amber-400",
  },
};

function CommandWhyPanel({ action = {}, subtitle = "" }) {
  const explainItems = (Array.isArray(action.explain) && action.explain.length > 0
    ? action.explain
    : [action.reason || subtitle]
  ).filter(Boolean).slice(0, 4);

  const confLabel = confidenceLabel(action.confidence);
  const confStyle = confLabel ? CONFIDENCE_STYLES[confLabel] : null;

  const signalChips = (Array.isArray(action.sourceSignals) ? action.sourceSignals : [])
    .map(humanizeSignal)
    .filter(Boolean);

  const risk = action.riskIfIgnored || null;

  return (
    <div
      className="max-w-2xl rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3"
      role="region"
      aria-label="Por que isso agora"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
        Por que isso agora?
      </p>

      <ul className="space-y-1.5">
        {explainItems.map((item, index) => (
          <li key={`explain-${index}`} className="flex gap-2 text-[12px] text-gray-300 leading-relaxed">
            <span className="mt-[3px] shrink-0 text-blue-400">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {(confStyle || signalChips.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {confStyle && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${confStyle.bg}`}
              aria-label={`Confiança ${confLabel}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${confStyle.dot}`} aria-hidden="true" />
              Confiança {confLabel}
            </span>
          )}
          {signalChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-gray-400"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {risk && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2.5">
          <AlertTriangle size={13} className="mt-[1px] shrink-0 text-amber-400" aria-hidden="true" />
          <p className="text-[11px] font-semibold leading-snug text-amber-200">
            <span className="mr-1 font-black text-amber-300">Se ignorado:</span>
            {risk}
          </p>
        </div>
      )}
    </div>
  );
}

export default function DailyCommandCard({
  command,
  todayLoadSummary,
  topFilaItem,
  hasPendingClosure,
  showWhy,
  onToggleWhy,
  onDismissPendingClosure,
  onRunPrimary,
  onOpenModal,
}) {
  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={onOpenModal}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-transparent bg-transparent p-0 text-[10px] font-bold uppercase tracking-wide text-blue-300 transition-colors hover:text-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
          title="Ver tarefas do Comando do dia"
        >
          {command.eyebrow}
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          {command.title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-2)]">
          {command.subtitle}
        </p>
        <p className="inline-flex w-fit rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-200">
          {todayLoadSummary}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onRunPrimary}
          className={`medrev-cta-primary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-extrabold leading-none shadow-lg border-none cursor-pointer whitespace-nowrap ${
            command.tone === "red"
              ? "bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-red-950/25 hover:from-red-500 hover:to-orange-400"
              : command.tone === "amber"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-950/25 hover:from-amber-400 hover:to-orange-400"
              : command.tone === "emerald"
              ? "bg-emerald-600/25 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-600/40 hover:text-white"
              : "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-blue-950/25 hover:from-blue-500 hover:to-sky-400"
          }`}
        >
          {command.primaryLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            if (hasPendingClosure) {
              onDismissPendingClosure();
            } else {
              onToggleWhy();
            }
          }}
          className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold leading-none text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer whitespace-nowrap"
        >
          {command.secondaryLabel}
        </button>
        {topFilaItem?.isOptimal && command.action?.type === "fila_do_dia" && (
          <span className="text-[11px] font-bold text-amber-300">
            Ponto exato de esquecimento detectado
          </span>
        )}
      </div>
      {showWhy && (
        <CommandWhyPanel action={command.action} subtitle={command.subtitle} />
      )}
    </>
  );
}
