// src/components/AgendaDayDetails.jsx
// Lista de itens de um dia de agenda.
// Recebe um daySummary de getAgendaDaySummary (agendaEngine.js).

import React, { useMemo, useState } from "react";
import { Activity, BarChart3, CalendarDays, Clock, Target } from "lucide-react";
import AgendaTaskItem from "./AgendaTaskItem";
import { estimateTaskMinutes } from "../core/agendaEngine";
import { getEnamedContextBadge } from "../core/enamedIntel";
import { getRetrievability } from "../core/fsrs";
import { getAgendaTaskLabel, getAgendaTaskTarget } from "../core/planExecution";
import { Badge, Button, Card, Dialog } from "./ui";

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const normalized = Number(value) <= 1 ? Number(value) * 100 : Number(value);
  return `${Math.round(normalized)}%`;
}

function getTemaAttempts(tema = {}, stats = {}) {
  const direct = stats?.[tema.id] || stats?.[tema.nome] || [];
  const history = tema?.rev?.reviewHistory || tema?.reviewHistory || [];
  if (Array.isArray(direct) && direct.length) return direct;
  return Array.isArray(history) ? history : [];
}

function summarizeAttempts(attempts = []) {
  const valid = attempts.filter((attempt) => attempt && (attempt.acerto != null || attempt.score != null));
  if (!valid.length) return null;
  const values = valid.map((attempt) => Number(attempt.acerto ?? attempt.score)).filter((value) => Number.isFinite(value));
  if (!values.length) return null;
  const avg = values.reduce((sum, value) => sum + (value <= 1 ? value * 100 : value), 0) / values.length;
  return `${Math.round(avg)}% em ${values.length} registro${values.length === 1 ? "" : "s"}`;
}

function DetailMetric({ icon: Icon, label, value }) {
  return (
    <Card style={{ padding: 12 }}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
        <Icon size={12} /> {label}
      </div>
      <p className="mt-1 text-[13px] font-black text-gray-100">{value || "Sem dado real"}</p>
    </Card>
  );
}

function getAcaoRecomendada(item, review, enamedBadge, retrievability) {
  if (!item) return null;
  const R = parseFloat(retrievability) || null;
  const isOverdue = item.overdue;
  const isHotEnamed = enamedBadge?.nivel === "alto";
  const step = item.stepKey || "";

  if (isOverdue && isHotEnamed) return "Priorizar: tema atrasado com alta incidência ENAMED.";
  if (isOverdue) return "Executar agora: revisão atrasada acumulando risco de perda.";
  if (step === "d0") return "Estudo inicial: siga o fluxo D0 (pré-teste → leitura → brain dump → questões → flashcards).";
  if (step === "d1") return "1ª revisão: tente reconstruir o tema de memória antes de consultar material.";
  if (step === "d7") return "Revisão de diferencial: foque no que separa este tema dos diagnósticos próximos.";
  if (step === "d21") return "Mini-caso: resolva um caso clínico ou questão integradora do tema.";
  if (step === "manutencao") return "Manutenção: rápida revisão do illness script e dos achados-chave.";
  if (R != null && R < 40) return "Alta prioridade: retenção baixa — risco real de perda de memória.";
  if (isHotEnamed) return "Prioritário ENAMED: tema de alta incidência na prova.";
  return "Executar conforme o plano: sem alertas ativos para este item.";
}

function getDesempenhoTema(tema) {
  if (!tema?.rev) return null;
  const revs = Object.values(tema.rev).filter(r => r?.done && r.acerto != null);
  if (!revs.length) return null;
  const avg = revs.reduce((s, r) => s + r.acerto, 0) / revs.length;
  return Math.round(avg * 100);
}

function AgendaTaskDetailsModal({ item, tema, temaStats, onClose, onStartTask, onOpenPlan }) {
  const target = getAgendaTaskTarget(item);
  const startLabel = getAgendaTaskLabel(item);
  const review = item?.stepKey ? tema?.rev?.[item.stepKey] : null;
  const attempts = getTemaAttempts(tema, temaStats).slice(-4).reverse();
  const attemptsSummary = summarizeAttempts(attempts);
  const enamedBadge = item?.area && item?.temaNome ? getEnamedContextBadge(item.area, item.temaNome) : null;
  const retrievability = tema?.rev && item?.stepKey && item.stepKey !== "d0"
    ? formatPercent(getRetrievability(tema, item.stepKey))
    : null;
  const acaoRecomendada = getAcaoRecomendada(item, review, enamedBadge, retrievability);
  const desempenhoTema = getDesempenhoTema(tema);

  function handleStart() {
    if (onStartTask) {
      onStartTask(item, target);
      onClose();
      return;
    }
    if (onOpenPlan) onOpenPlan();
    onClose();
  }

  return (
    <Dialog
      open
      title="Detalhes da tarefa"
      description="Contexto executável do item selecionado na agenda."
      onClose={onClose}
      wide
      mobileSheet
      footer={(
        <Button fullWidth onClick={handleStart} variant={target?.action === "open_plan" ? "secondary" : "primary"}>
          {target?.action === "open_plan" ? "Ver plano" : startLabel}
        </Button>
      )}
    >
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-gray-500">{item.area || "Agenda"}</p>
            <h3 className="mt-1 text-xl font-black text-white leading-tight">{item.temaNome || "Tarefa da agenda"}</h3>
            <p className="mt-2 text-[12px] text-gray-400">
              {item.overdue ? "Reprogramada por atraso" : "Programada"} para {item.originalDate || item.date}
              {item.originalDate && item.originalDate !== item.date ? `, exibida em ${item.date}` : ""}.
            </p>
          </div>
          <Button
            type="button"
            onClick={onClose}
            size="sm"
            variant="secondary"
          >
            Fechar
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailMetric icon={Clock} label="Tempo" value={`${estimateTaskMinutes(item)} min`} />
          <DetailMetric icon={CalendarDays} label="Etapa" value={item.stepKey ? item.stepKey.toUpperCase() : item.type} />
          <DetailMetric icon={Activity} label="Retenção FSRS" value={retrievability} />
          <DetailMetric icon={Target} label="Estabilidade/Dificuldade" value={review ? `S ${review.S ?? "-"} · D ${review.D ?? "-"}` : null} />
        </div>

        <Card className="space-y-3" style={{ padding: 16 }}>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gray-300">
            <BarChart3 size={14} className="text-blue-300" /> Incidência e desempenho
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] text-gray-300">
            <p>
              <span className="text-gray-500">ENAMED: </span>
              {enamedBadge
                ? `${enamedBadge.subarea} · ${enamedBadge.pctAbsoluto}% da área · ~${enamedBadge.questoes || 0}q`
                : "sem correspondência quantitativa"}
            </p>
            <p>
              <span className="text-gray-500">Histórico: </span>
              {attemptsSummary || "sem tentativas registradas"}
            </p>
          </div>
          {attempts.length > 0 && (
            <div className="space-y-2">
              {attempts.map((attempt, index) => (
                <div key={attempt.id || `${attempt.reviewedAt || attempt.date || index}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2 text-[11px]">
                  <span className="text-gray-400 truncate">{attempt.stepKey || attempt.source || "registro"} · {attempt.reviewedAt || attempt.date || attempt.createdAt || "sem data"}</span>
                  <span className="font-black text-gray-100">{formatPercent(attempt.acerto ?? attempt.score) || "-"}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {acaoRecomendada && (
          <Card style={{ padding: 16, borderColor: "rgba(59,130,246,.22)", background: "var(--med-blue-soft)" }}>
            <Badge tone="blue">Ação recomendada</Badge>
            <p className="text-[12px] text-gray-200 leading-relaxed">{acaoRecomendada}</p>
          </Card>
        )}

        {desempenhoTema != null && (
          <Card style={{ padding: 16 }}>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Desempenho no tema</p>
            <p className={`text-[13px] font-black ${desempenhoTema >= 70 ? "text-emerald-400" : desempenhoTema >= 50 ? "text-amber-400" : "text-red-400"}`}>
              {desempenhoTema}% acerto médio ({Object.values(tema?.rev || {}).filter(r => r?.done && r.acerto != null).length} revisões)
            </p>
          </Card>
        )}
      </div>
    </Dialog>
  );
}

export default function AgendaDayDetails({ daySummary, temas = [], temaStats = {}, onStartTask, onOpenPlan }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const temaById = useMemo(
    () => new Map(temas.map((tema) => [String(tema.id), tema])),
    [temas]
  );

  if (!daySummary || daySummary.isEmpty) return null;

  const { date, items, totalMinutes, overdueCount, newCount } = daySummary;
  const [, m, d] = (date || "").split("-");
  const dateLabel = date ? `${d}/${m}` : "";

  return (
    <Card className="space-y-3" style={{ padding: 16, background: "linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.025)), var(--med-surface-solid)" }}>
      {/* Cabeçalho do dia */}
      <div className="flex items-center justify-between">
        <div>
          <Badge tone="blue">Agenda</Badge>
          <h4 className="mt-2 text-[12px] font-black text-white">{dateLabel}</h4>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-[10px] text-gray-500">
          {overdueCount > 0 && (
            <Badge tone="red">{overdueCount} atrasado{overdueCount > 1 ? "s" : ""}</Badge>
          )}
          {newCount > 0 && (
            <Badge tone="green">{newCount} novo{newCount > 1 ? "s" : ""}</Badge>
          )}
          <Badge tone="neutral">{totalMinutes} min</Badge>
        </div>
      </div>

      {/* Lista de itens */}
      <div className="space-y-2">
        {items.map((item) => (
          <AgendaTaskItem
            key={item.id}
            item={item}
            onStartTask={onStartTask}
            onOpenPlan={onOpenPlan}
            onOpenDetails={setSelectedTask}
          />
        ))}
      </div>

      <p className="text-[10px] text-gray-600 text-center">
        Use o botão de cada tarefa para abrir o alvo executável ou ver o contexto.
      </p>

      {selectedTask && (
        <AgendaTaskDetailsModal
          item={selectedTask}
          tema={temaById.get(String(selectedTask.temaId))}
          temaStats={temaStats}
          onClose={() => setSelectedTask(null)}
          onStartTask={onStartTask}
          onOpenPlan={onOpenPlan}
        />
      )}
    </Card>
  );
}
