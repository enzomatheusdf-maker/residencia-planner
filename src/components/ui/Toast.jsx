import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const toneClasses = {
  success: "border-emerald-500/25 text-emerald-100",
  warning: "border-amber-500/25 text-amber-100",
  error: "border-red-500/25 text-red-100",
  info: "border-blue-500/25 text-blue-100",
};

export function Toast({ open = true, message, tone = "info", action, onDismiss, ms = 5000 }) {
  useEffect(() => {
    if (!open || !onDismiss) return undefined;
    const timer = setTimeout(onDismiss, ms);
    return () => clearTimeout(timer);
  }, [ms, onDismiss, open]);

  if (!open || !message) return null;

  return createPortal(
    <div className="fixed bottom-24 left-1/2 z-[var(--med-z-toast)] w-[min(calc(100vw-1.5rem),26rem)] -translate-x-1/2 md:bottom-6">
      <div className={`med-card med-animate-in flex items-center gap-3 px-4 py-3 ${toneClasses[tone] || toneClasses.info}`}>
        <p className="min-w-0 flex-1 text-[13px] font-semibold">{message}</p>
        {action ? (
          <button className="med-button-reset med-focus-ring text-[12px] font-black text-blue-300" onClick={action.onClick} type="button">
            {action.label}
          </button>
        ) : null}
        <button className="med-button-reset med-focus-ring grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:text-white" onClick={onDismiss} type="button" aria-label="Fechar aviso">
          <X size={16} />
        </button>
      </div>
    </div>,
    document.body
  );
}
