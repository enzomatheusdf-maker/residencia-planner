import React from "react";
import { motion } from "framer-motion";
import { ChevronDown, Info, Play } from "lucide-react";
import { estimateTaskMinutes } from "../core/agendaEngine";
import { getDomainTestAgendaMeta } from "../core/domainTest";
import { getAgendaTaskLabel, getAgendaTaskTarget } from "../core/planExecution";
import { Badge, Button, Card } from "./ui";
import useReducedMotion from "../hooks/useReducedMotion";

const EASE = [0.22, 1, 0.36, 1];

const TYPE_LABELS = {
  relearning: "Releitura",
  overdue: "Atrasado",
  review: "Revisao",
  group_review: "Grupo de revisão",
  d0_critical: "Novo critico",
  new_topic: "Novo topico",
  simulation: "Simulado",
  weekly: "Revisao semanal",
};

const TYPE_TONES = {
  relearning: "purple",
  overdue: "red",
  review: "blue",
  group_review: "purple",
  d0_critical: "amber",
  new_topic: "green",
  simulation: "cyan",
  weekly: "neutral",
};

function StepBadge({ stepKey, phase, domainTestClassification }) {
  const domainMeta = getDomainTestAgendaMeta(domainTestClassification);
  const label = domainMeta?.stepLabel || (phase === "relearning" ? "Releitura" : (stepKey || "").toUpperCase());
  return <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{label}</span>;
}

export default function AgendaTaskItem({ item, onStartTask, onOpenPlan, onOpenDetails }) {
  const [expanded, setExpanded] = React.useState(false);
  const tone = TYPE_TONES[item.type] || TYPE_TONES.review;
  const domainMeta = getDomainTestAgendaMeta(item.domainTestClassification);
  const typeLabel = item.domainTestAgendaLabel || domainMeta?.agendaLabel || TYPE_LABELS[item.type] || item.type;
  const mins = estimateTaskMinutes(item);
  const target = getAgendaTaskTarget(item);
  const label = getAgendaTaskLabel(item);
  const isReduced = useReducedMotion();

  function handleStart() {
    if (onStartTask) {
      onStartTask(item, target);
      return;
    }
    if (onOpenPlan) onOpenPlan();
  }

  return (
    <Card
      as={motion.div}
      variant={item.overdue || item.type === "overdue" ? "critical" : "interactive"}
      interactive
      className="space-y-3"
      style={{ padding: 12 }}
      whileHover={!isReduced ? { y: -2, scale: 1.005 } : undefined}
      whileTap={!isReduced ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2, ease: EASE }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black leading-snug text-white truncate">{item.temaNome || "Topico"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] opacity-70">{item.area}</span>
            {item.stepKey && <StepBadge stepKey={item.stepKey} phase={item.phase} domainTestClassification={item.domainTestClassification} />}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <Badge tone={tone}>{typeLabel}</Badge>
          <p className="text-[10px] text-gray-500">{mins} min</p>
        </div>
      </div>
      {item.type === "group_review" && item.subItems?.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-black/20">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[10px] font-bold text-gray-300"
          >
            <span>{item.subItems.length} curvas de revisão</span>
            <ChevronDown size={13} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          {expanded && (
            <div className="border-t border-white/5 px-3 py-2 space-y-1.5">
              {item.subItems.map((subItem) => (
                <div key={`${subItem.temaId}-${subItem.stepKey}`} className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="truncate text-gray-300">{subItem.temaNome}</span>
                  <span className="font-mono text-gray-500 uppercase">{subItem.stepKey}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button
          type="button"
          onClick={handleStart}
          size="sm"
          variant={target?.action === "open_plan" ? "secondary" : "primary"}
        >
          <Play size={12} /> {target?.action === "open_plan" ? "Ver plano" : label}
        </Button>
        {onOpenDetails && (
          <Button
            type="button"
            onClick={() => onOpenDetails(item)}
            size="icon"
            variant="outline"
            aria-label="Detalhes da tarefa"
          >
            <Info size={13} />
          </Button>
        )}
      </div>
    </Card>
  );
}
