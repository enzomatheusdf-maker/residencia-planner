// src/components/ErrorActionCenter.jsx
// Centro de Erros: mostra padrao de erros + acoes corretivas especificas por tipo.
// Aparece em: Stats > Erros, Mais > ferramentas.
// Nao e uma aba solta — e embutido nas secoes corretas.
import React, { useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { useStore } from "../core/store";
import { STEPS } from "../core/fsrs";
import {
  ERROR_TYPE_LABEL, dominantErrorType, summarizeErrors,
} from "../core/errorTaxonomy";
import { getCorrectiveAction, getActionsForPlatform } from "../core/errorActionMap";

// ─── Helpers ────────────────────────────────────────────────────────────────

function severityColor(count, max) {
  if (count === 0) return "text-gray-600";
  const ratio = max > 0 ? count / max : 0;
  if (ratio >= 0.5) return "text-red-400";
  if (ratio >= 0.25) return "text-amber-400";
  return "text-blue-400";
}

// ─── Linha de tipo de erro ────────────────────────────────────────────────────

function ErrorTypeRow({ tipo, count, max, action, expanded, onToggle }) {
  const label = ERROR_TYPE_LABEL[tipo] || tipo;
  const color = severityColor(count, max);

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-[#111113] hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-xl font-black tabular-nums w-8 text-right shrink-0 ${color}`}>{count}</span>
          <span className="text-[12px] font-semibold text-gray-200 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {count === 0 && <span className="text-[10px] text-gray-600">sem ocorrencias</span>}
          {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </div>
      </button>

      {expanded && action && count > 0 && (
        <div className="bg-black/30 border-t border-white/5 p-4 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">O que e</p>
            <p className="text-[12px] text-gray-300 leading-relaxed">{action.definition}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Acoes corretivas</p>
            <ul className="space-y-1.5">
              {action.correctiveActions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-gray-400 leading-relaxed">
                  <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
          {action.fsrsEffect && (
            <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold mb-0.5">Efeito no FSRS</p>
              <p className="text-[11px] text-gray-400">{action.fsrsEffect}</p>
            </div>
          )}
        </div>
      )}

      {expanded && count === 0 && (
        <div className="bg-black/20 border-t border-white/5 p-3">
          <p className="text-[11px] text-gray-600">Nenhuma ocorrencia deste tipo de erro ainda.</p>
        </div>
      )}
    </div>
  );
}

// ─── ErrorActionCenter ────────────────────────────────────────────────────────

/**
 * Props:
 *   compact  bool    se true, mostra apenas os top 3 erros com > 0 ocorrencias
 */
export default function ErrorActionCenter({ compact = false }) {
  const plat = useStore((s) => s.plat);
  const temas = useStore((s) => s[plat]?.temas || []);
  const simulados = useStore((s) => s[plat]?.simulados || []);

  const [expanded, setExpanded] = useState({});
  const toggleExpanded = (tipo) => setExpanded((prev) => ({ ...prev, [tipo]: !prev[tipo] }));

  // Coletar erros de revisoes e simulados
  const { summary, dominant, total } = useMemo(() => {
    const fromReviews = temas.flatMap((tema) =>
      STEPS.flatMap((step) => {
        const review = tema.rev?.[step.key];
        if (!review?.done) return [];
        const structured = Array.isArray(review.erros) ? review.erros : [];
        const fallback = Array.isArray(review.motivosErro)
          ? review.motivosErro.map((tipoErro) => ({ tipoErro, acertou: false, confianca: review.confianca }))
          : [];
        return [...structured, ...fallback];
      })
    );
    const fromSimulados = simulados.flatMap((sim) =>
      (sim.questoesErradas || []).map((q) => ({
        tipoErro: q.tipoErro,
        acertou: false,
        confianca: q.confianca,
        tempoExcedido: Boolean(q.tempoExcedido),
      }))
    );
    const allErrors = [...fromReviews, ...fromSimulados];
    return {
      summary: summarizeErrors(allErrors),
      dominant: dominantErrorType(allErrors),
      total: allErrors.length,
    };
  }, [temas, simulados]);

  // Tipos validos para a plataforma
  const platformActions = useMemo(() => getActionsForPlatform(plat), [plat]);
  const platformTypes = platformActions.map((a) => a.type);

  // Ordenar tipos por contagem decrescente, depois por tipo
  const sortedTypes = useMemo(() => {
    return platformTypes
      .map((tipo) => ({ tipo, count: summary[tipo] || 0 }))
      .sort((a, b) => b.count - a.count || a.tipo.localeCompare(b.tipo));
  }, [platformTypes, summary]);

  const maxCount = sortedTypes[0]?.count || 1;

  // Modo compacto: so tipos com > 0 ocorrencias (max 4)
  const displayTypes = compact
    ? sortedTypes.filter((t) => t.count > 0).slice(0, 4)
    : sortedTypes;

  if (total === 0) {
    return (
      <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 text-center space-y-2">
        <Info size={24} className="text-gray-700 mx-auto" />
        <p className="text-[12px] text-gray-500">
          Sem erros suficientes para padrao dominante.
        </p>
        <p className="text-[11px] text-gray-600">
          Complete mais sessoes e simulados para ver o painel de acoes corretivas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[13px] font-bold text-white">Centro de Erros</p>
          <p className="text-[11px] text-gray-500">
            {total} ocorrencias · Erro dominante:{" "}
            <span className="text-amber-300 font-semibold">
              {dominant ? (ERROR_TYPE_LABEL[dominant] || dominant) : "—"}
            </span>
          </p>
        </div>
        {dominant && (
          <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-900/30 text-amber-400 border border-amber-600/20 flex items-center gap-1 shrink-0">
            <AlertTriangle size={9} /> {ERROR_TYPE_LABEL[dominant] || dominant}
          </span>
        )}
      </div>

      {/* Lista de tipos */}
      <div className="space-y-1.5">
        {displayTypes.map(({ tipo, count }) => {
          const action = getCorrectiveAction(tipo);
          return (
            <ErrorTypeRow
              key={tipo}
              tipo={tipo}
              count={count}
              max={maxCount}
              action={action}
              expanded={Boolean(expanded[tipo])}
              onToggle={() => toggleExpanded(tipo)}
            />
          );
        })}
      </div>

      {compact && sortedTypes.filter((t) => t.count > 0).length > 4 && (
        <p className="text-[10px] text-gray-600 text-center">
          + {sortedTypes.filter((t) => t.count > 0).length - 4} outros tipos. Veja a secao Erros completa.
        </p>
      )}
    </div>
  );
}
