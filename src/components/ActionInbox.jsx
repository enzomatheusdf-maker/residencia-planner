import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Inbox, Play, XCircle } from "lucide-react";
import { useStore } from "../core/store";
import EmptyState from "./EmptyState";

function resolveActionCTA(action, onStudy, setView, rebalanceTodayWorkload, plat, showToast) {
  const temaId = action?.target?.temaId;
  const stepKey = action?.target?.stepKey || "d0";
  const view = action?.ctaView || action?.target?.view;

  if (temaId && onStudy) {
    return { label: "Iniciar", onClick: () => onStudy(temaId, stepKey) };
  }
  if (action?.target?.action === "rebalance_workload" && rebalanceTodayWorkload) {
    return {
      label: action.cta || "Rebalancear",
      onClick: () => {
        const result = rebalanceTodayWorkload(plat);
        if (showToast) {
          if (result?.movedCount > 0) {
            showToast(`Rebalanceamento aplicado: ${result.movedCount} revisao(oes) movida(s).`);
          } else {
            showToast("Nenhuma revisao elegivel para mover agora.");
          }
        }
      },
    };
  }
  if (view && setView) {
    return { label: action?.cta || "Abrir", onClick: () => setView(view) };
  }
  return null;
}

export default function ActionInbox({ mode = "mentor", onStudy, setView }) {
  const actionInbox = useStore((s) => s.actionInbox || []);
  const rebuildActionInboxForToday = useStore((s) => s.rebuildActionInboxForToday);
  const acceptAction = useStore((s) => s.acceptAction);
  const dismissAction = useStore((s) => s.dismissAction);
  const markActionDone = useStore((s) => s.markActionDone);
  const rebalanceTodayWorkload = useStore((s) => s.rebalanceTodayWorkload);
  const plat = useStore((s) => s.plat);
  const showToast = useStore((s) => s.showToast);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (rebuildActionInboxForToday) rebuildActionInboxForToday();
  }, [rebuildActionInboxForToday]);

  const openActions = useMemo(
    () => actionInbox.filter((action) => action.status !== "done" && action.status !== "dismissed"),
    [actionInbox]
  );

  if (!openActions.length) {
    return (
      <EmptyState
        icon={Inbox}
        title="Plano executado por enquanto"
        description="Quando o Comando do Mentor gerar próximos passos, eles aparecem aqui como execução do plano."
      />
    );
  }

  const primary = openActions[0];
  const rest = mode === "manual" || expanded ? openActions.slice(1) : openActions.slice(1, 3);
  const primaryCTA = resolveActionCTA(primary, onStudy, setView, rebalanceTodayWorkload, plat, showToast);

  return (
    <section className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Inbox size={16} className="text-blue-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">Execução do plano</h3>
        </div>
        {openActions.length > 3 && mode !== "manual" && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="text-[10px] text-blue-300 hover:text-blue-200 font-bold border-none bg-transparent cursor-pointer"
          >
            {expanded ? "Recolher" : "Ver tudo"}
          </button>
        )}
      </div>

      <article className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 space-y-2">
        <p className="text-[10px] uppercase tracking-wider font-black text-blue-300">Próximo passo do comando</p>
        <p className="text-sm font-black text-white">{primary.title}</p>
        <p className="text-[11px] text-gray-300">{primary.reason}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {primaryCTA && (
            <button
              type="button"
              onClick={primaryCTA.onClick}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold border-none cursor-pointer inline-flex items-center gap-1"
            >
              <Play size={12} /> {primaryCTA.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => acceptAction && acceptAction(primary.id)}
            disabled={primary.status === "accepted"}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-[11px] font-bold border border-white/10 cursor-pointer"
          >
            {primary.status === "accepted" ? "Aceito" : "Aceitar"}
          </button>
          <button
            type="button"
            onClick={() => markActionDone && markActionDone(primary.id)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 text-[11px] font-bold border border-emerald-500/25 cursor-pointer inline-flex items-center gap-1"
          >
            <CheckCircle2 size={12} /> Marcar feito
          </button>
          <button
            type="button"
            onClick={() => dismissAction && dismissAction(primary.id)}
            className="px-3 py-1.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 text-red-300 text-[11px] font-bold border border-red-500/25 cursor-pointer inline-flex items-center gap-1"
          >
            <XCircle size={12} /> Dispensar
          </button>
        </div>
      </article>

      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((action) => (
            <article key={action.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
              <p className="text-[12px] font-bold text-white">{action.title}</p>
              <p className="text-[11px] text-gray-400 mt-1">{action.reason}</p>
              <div className="flex gap-2 pt-2">
                {action.status === "accepted" && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-600/15 text-blue-300 text-[10px] font-bold border border-blue-500/20">
                    Aceito
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => markActionDone && markActionDone(action.id)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 text-[10px] font-bold border border-emerald-500/25 cursor-pointer"
                >
                  Marcar feito
                </button>
                <button
                  type="button"
                  onClick={() => dismissAction && dismissAction(action.id)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold border border-white/10 cursor-pointer"
                >
                  Dispensar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
