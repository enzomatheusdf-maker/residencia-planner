// src/components/ErrorActionPrompt.jsx
// CTA compacto de acao corretiva — aparece pos-sessao, pos-simulado e no Mentor.
// Nao e uma aba solta. E um componente embutido em contextos especificos.
import React from "react";
import { AlertTriangle, ChevronRight, X } from "lucide-react";
import { getCorrectiveAction } from "../core/errorActionMap";
import { ERROR_TYPE_LABEL } from "../core/errorTaxonomy";
import { MotionCard } from "./motion";

/**
 * ErrorActionPrompt
 *
 * Props:
 *   dominantError   string        tipo canonico de erro dominante
 *   context         string        "pos-sessao" | "pos-simulado" | "mentor" | "stats"
 *   tema            string|null   nome do tema (opcional)
 *   onAction        fn()          callback quando usuario clica em Ver acao corretiva
 *   onDismiss       fn()|null     callback para fechar (null = nao mostra X)
 *   className       string
 */
export default function ErrorActionPrompt({
  dominantError,
  context = "pos-sessao",
  tema = null,
  onAction,
  onDismiss = null,
  className = "",
}) {
  const action = dominantError ? getCorrectiveAction(dominantError) : null;
  if (!action) return null;

  const label = ERROR_TYPE_LABEL[dominantError] || dominantError;
  const firstAction = action.correctiveActions[0] || "";

  const CONTEXT_PREFIX = {
    "pos-sessao": "Sessao concluida.",
    "pos-simulado": "Simulado analisado.",
    "mentor": "Padrao identificado.",
    "stats": "Padrao de erros.",
  };

  return (
    <MotionCard interactive={false} className={`bg-amber-950/20 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 ${className}`}>
      <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-amber-300 font-bold">
          {CONTEXT_PREFIX[context] || ""}{" "}
          <span className="text-amber-200">Erro dominante: {label}.</span>
        </p>
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{firstAction}</p>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors"
          >
            Ver acao corretiva <ChevronRight size={12} />
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-gray-600 hover:text-gray-400 transition-colors shrink-0 mt-0.5"
          aria-label="Fechar"
        >
          <X size={14} />
        </button>
      )}
    </MotionCard>
  );
}
