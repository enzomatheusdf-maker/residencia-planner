import React, { useId } from "react";
import { cx } from "./utils";

export function SegmentedControl({ ariaLabel, className, onChange, options = [], style, value }) {
  const id = useId();
  const enabled = options.filter((option) => !option.disabled);

  function move(delta) {
    if (!enabled.length) return;
    const current = enabled.findIndex((option) => option.value === value);
    const nextIndex = current >= 0 ? (current + delta + enabled.length) % enabled.length : 0;
    onChange?.(enabled[nextIndex].value);
  }

  return (
    <div
      aria-label={ariaLabel}
      className={cx("med-surface", className)}
      role="radiogroup"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          move(1);
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          move(-1);
        }
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: 4,
        borderRadius: "var(--med-radius-md)",
        ...style,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            aria-checked={active}
            className="med-button-reset med-pressable med-focus-ring"
            disabled={option.disabled}
            id={`${id}-${option.value}`}
            key={option.value}
            onClick={() => onChange?.(option.value)}
            role="radio"
            type="button"
            style={{
              minHeight: 32,
              padding: "0 12px",
              borderRadius: "var(--med-radius-sm)",
              color: active ? "var(--med-text-strong)" : "var(--med-text-muted)",
              background: active ? "var(--med-surface-2)" : "transparent",
              border: `1px solid ${active ? "var(--med-border-strong)" : "transparent"}`,
              cursor: option.disabled ? "not-allowed" : "pointer",
              fontSize: "var(--med-text-sm)",
              fontWeight: 800,
              opacity: option.disabled ? .5 : 1,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
