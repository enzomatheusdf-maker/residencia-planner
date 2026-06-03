// src/components/AgendaMonthGrid.jsx
// Grade mensal de agenda — exibe contagem de itens por dia.
// Consome buildAgendaMonth e getAgendaDaySummary de agendaEngine.js.

import React, { useMemo, useState } from "react";
import { buildAgendaMonth } from "../core/agendaEngine";
import { todayStr } from "../core/fsrs";
import AgendaDayDetails from "./AgendaDayDetails";

const MONTH_LABELS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const WEEKDAY_HEADERS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function monthOffset(yearMonth, delta) {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function firstDayOfWeek(yearMonth) {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m - 1, 1).getDay(); // 0=dom
}

export default function AgendaMonthGrid({
  temas = [],
  scheduledTopics = [],
  simulados = [],
  planSetup = {},
  plat = "res",
  onStartTask,
  onOpenPlan,
}) {
  const today = todayStr();
  const [currentMonth, setCurrentMonth] = useState(today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today);

  const monthData = useMemo(
    () => buildAgendaMonth(temas, scheduledTopics, simulados, planSetup, plat, currentMonth),
    [temas, scheduledTopics, simulados, planSetup, plat, currentMonth]
  );

  const [year, month] = currentMonth.split("-").map(Number);
  const startDow = firstDayOfWeek(currentMonth);

  // Build calendar grid: leading empty cells + day cells
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  monthData.days.forEach((day) => cells.push(day));

  const selectedDayData = monthData.days.find((d) => d.date === selectedDate) || null;

  function dotColor(count, hasOverdue) {
    if (hasOverdue) return "bg-red-400";
    if (count >= 5) return "bg-amber-400";
    if (count > 0) return "bg-blue-400";
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentMonth(monthOffset(currentMonth, -1))}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold hover:bg-white/10 cursor-pointer"
        >
          Anterior
        </button>
        <h4 className="text-sm font-black text-white">
          {MONTH_LABELS[month - 1]} {year}
        </h4>
        <button
          type="button"
          onClick={() => setCurrentMonth(monthOffset(currentMonth, 1))}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold hover:bg-white/10 cursor-pointer"
        >
          Próximo
        </button>
      </div>

      {/* Cabeçalhos dos dias da semana */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_HEADERS.map((h) => (
          <div key={h} className="text-[10px] font-bold text-gray-500 py-1">{h}</div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} />;
          }
          const [, , dd] = day.date.split("-");
          const isToday   = day.date === today;
          const isSelected = day.date === selectedDate;
          const dot = dotColor(day.totalCount, day.overdueCount > 0);

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDate(day.date)}
              className={`relative flex flex-col items-center justify-center rounded-xl py-2 text-[11px] font-bold transition-colors cursor-pointer ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : isToday
                  ? "bg-blue-500/20 border border-blue-500/40 text-blue-200"
                  : day.totalCount > 0
                  ? "bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              {dd}
              {dot && !isSelected && (
                <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${dot}`} />
              )}
              {day.totalCount > 0 && isSelected && (
                <span className="text-[9px] opacity-80 font-normal">{day.totalCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Resumo mensal */}
      <div className="flex items-center gap-4 text-[11px] text-gray-500">
        <span>{monthData.totalItems} itens no mês</span>
        <span>{Math.round(monthData.totalMinutes / 60)}h estimadas</span>
      </div>

      {/* Detalhes do dia selecionado */}
      {selectedDayData && !selectedDayData.isEmpty && (
        <AgendaDayDetails daySummary={selectedDayData} onStartTask={onStartTask} onOpenPlan={onOpenPlan} />
      )}
      {selectedDayData && selectedDayData.isEmpty && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
          <p className="text-[12px] text-gray-500">Nenhuma tarefa agendada para este dia.</p>
        </div>
      )}
    </div>
  );
}
