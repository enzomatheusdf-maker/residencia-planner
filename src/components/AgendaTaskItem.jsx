import React from "react";
import { Info, Play } from "lucide-react";
import { estimateTaskMinutes } from "../core/agendaEngine";
import { getAgendaTaskLabel, getAgendaTaskTarget } from "../core/planExecution";

const TYPE_LABELS = {
  relearning: "Releitura",
  overdue: "Atrasado",
  review: "Revisao",
  d0_critical: "Novo critico",
  new_topic: "Novo topico",
  simulation: "Simulado",
  weekly: "Revisao semanal",
};

const TYPE_COLORS = {
  relearning: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  overdue: "border-red-500/30 bg-red-500/10 text-red-300",
  review: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  d0_critical: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  new_topic: "border-green-500/20 bg-green-500/10 text-green-300",
  simulation: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  weekly: "border-white/10 bg-white/5 text-gray-300",
};

function StepBadge({ stepKey, phase }) {
  const label = phase === "relearning" ? "Releitura" : (stepKey || "").toUpperCase();
  return <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{label}</span>;
}

export default function AgendaTaskItem({ item, onStartTask, onOpenPlan, onOpenDetails }) {
  const typeColor = TYPE_COLORS[item.type] || TYPE_COLORS.review;
  const typeLabel = TYPE_LABELS[item.type] || item.type;
  const mins = estimateTaskMinutes(item);
  const target = getAgendaTaskTarget(item);
  const label = getAgendaTaskLabel(item);

  function handleStart() {
    if (onStartTask) {
      onStartTask(item, target);
      return;
    }
    if (onOpenPlan) onOpenPlan();
  }

  return (
    <div className={`rounded-xl border p-3 space-y-2 ${typeColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold leading-snug truncate">{item.temaNome || "Topico"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] opacity-70">{item.area}</span>
            {item.stepKey && <StepBadge stepKey={item.stepKey} phase={item.phase} />}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold opacity-80">{typeLabel}</p>
          <p className="text-[10px] opacity-60">{mins} min</p>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={handleStart}
          className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[11px] font-black text-white hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5"
        >
          <Play size={12} /> {target?.action === "open_plan" ? "Ver plano" : label}
        </button>
        {onOpenDetails && (
          <button
            type="button"
            onClick={() => onOpenDetails(item)}
            className="w-9 rounded-lg border border-white/10 bg-black/25 text-gray-200 hover:bg-black/40 hover:text-white transition-colors flex items-center justify-center"
            title="Detalhes"
            aria-label="Detalhes da tarefa"
          >
            <Info size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
