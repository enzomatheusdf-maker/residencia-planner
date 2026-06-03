// src/components/AgendaDayDetails.jsx
// Lista de itens de um dia de agenda — read-only.
// Recebe um daySummary de getAgendaDaySummary (agendaEngine.js).

import React from "react";
import AgendaTaskItem from "./AgendaTaskItem";

export default function AgendaDayDetails({ daySummary, onStartTask, onOpenPlan }) {
  if (!daySummary || daySummary.isEmpty) return null;

  const { date, items, totalMinutes, overdueCount, newCount } = daySummary;
  const [, m, d] = (date || "").split("-");
  const dateLabel = date ? `${d}/${m}` : "";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f19] p-4 space-y-3">
      {/* Cabeçalho do dia */}
      <div className="flex items-center justify-between">
        <h4 className="text-[12px] font-black text-white">
          Agenda — {dateLabel}
        </h4>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          {overdueCount > 0 && (
            <span className="text-red-400 font-bold">{overdueCount} atrasado{overdueCount > 1 ? "s" : ""}</span>
          )}
          {newCount > 0 && (
            <span className="text-green-400 font-bold">{newCount} novo{newCount > 1 ? "s" : ""}</span>
          )}
          <span>{totalMinutes} min</span>
        </div>
      </div>

      {/* Lista de itens */}
      <div className="space-y-2">
        {items.map((item) => (
          <AgendaTaskItem key={item.id} item={item} onStartTask={onStartTask} onOpenPlan={onOpenPlan} />
        ))}
      </div>

      <p className="text-[10px] text-gray-600 text-center">
        Use o botão de cada tarefa para abrir o alvo executável.
      </p>
    </div>
  );
}
