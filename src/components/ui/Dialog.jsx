import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cx } from "./utils";

function getFocusable(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  ).filter((node) => !node.disabled && node.getAttribute("aria-hidden") !== "true");
}

export function Dialog({ open, title, description, children, footer, onClose, mobileSheet = false, formDirty = false, className, wide = false }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousActive = document.activeElement;
    document.body.style.overflow = "hidden";
    const focusables = getFocusable(panelRef.current);
    (focusables[0] || panelRef.current)?.focus?.();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !formDirty) {
        onClose?.();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = getFocusable(panelRef.current);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActive?.focus?.();
    };
  }, [formDirty, onClose, open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--med-z-modal)] flex items-end justify-center bg-black/72 p-3 backdrop-blur-sm md:items-center md:p-6"
      onMouseDown={() => {
        if (!formDirty) onClose?.();
      }}
    >
      <div
        aria-describedby={description ? "med-dialog-description" : undefined}
        aria-labelledby={title ? "med-dialog-title" : undefined}
        aria-modal="true"
        className={cx(
          "med-card med-animate-scale relative flex max-h-[92dvh] w-full flex-col overflow-hidden outline-none",
          wide ? "max-w-2xl" : "max-w-lg",
          mobileSheet ? "rounded-t-[var(--med-radius-xl)] md:rounded-[var(--med-radius-lg)]" : "",
          className
        )}
        onMouseDown={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
        style={{ background: "var(--med-surface-solid)", padding: 0 }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            {title ? <h2 id="med-dialog-title" className="text-base font-black text-white">{title}</h2> : null}
            {description ? <p id="med-dialog-description" className="mt-1 text-[12px] leading-relaxed text-gray-400">{description}</p> : null}
          </div>
          <button
            aria-label="Fechar"
            className="med-button-reset med-pressable med-focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
            onClick={onClose}
            type="button"
          >
            <X size={17} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="sticky bottom-0 border-t border-white/10 bg-[#111827]/95 px-5 py-4 backdrop-blur">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

export function DialogFooter({ cancelLabel = "Cancelar", confirmLabel = "Confirmar", danger = false, onCancel, onConfirm }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
      <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
    </div>
  );
}
