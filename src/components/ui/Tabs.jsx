import React, { useId } from "react";
import { cx } from "./utils";

export function Tabs({ activeValue, ariaLabel, className, onValueChange, style, tabs = [] }) {
  const id = useId();
  const enabled = tabs.filter((tab) => !tab.disabled);

  function move(delta) {
    if (!enabled.length) return;
    const current = enabled.findIndex((tab) => tab.value === activeValue);
    const nextIndex = current >= 0 ? (current + delta + enabled.length) % enabled.length : 0;
    onValueChange?.(enabled[nextIndex].value);
  }

  return (
    <div className={className} style={style}>
      <div
        aria-label={ariaLabel}
        className="med-surface"
        role="tablist"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
        }}
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          padding: 5,
          borderRadius: "var(--med-radius-md)",
        }}
      >
        {tabs.map((tab) => {
          const active = tab.value === activeValue;
          return (
            <button
              aria-controls={`${id}-panel-${tab.value}`}
              aria-selected={active}
              className={cx("med-button-reset med-pressable med-focus-ring")}
              disabled={tab.disabled}
              id={`${id}-tab-${tab.value}`}
              key={tab.value}
              onClick={() => onValueChange?.(tab.value)}
              role="tab"
              tabIndex={active ? 0 : -1}
              type="button"
              style={{
                minHeight: 36,
                padding: "0 14px",
                border: `1px solid ${active ? "var(--med-border-strong)" : "transparent"}`,
                borderRadius: "var(--med-radius-sm)",
                background: active ? "var(--med-surface-2)" : "transparent",
                color: active ? "var(--med-text-strong)" : "var(--med-text-muted)",
                cursor: tab.disabled ? "not-allowed" : "pointer",
                fontSize: "var(--med-text-sm)",
                fontWeight: 850,
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          aria-labelledby={`${id}-tab-${tab.value}`}
          hidden={tab.value !== activeValue}
          id={`${id}-panel-${tab.value}`}
          key={tab.value}
          role="tabpanel"
          style={{ paddingTop: 14 }}
        >
          {tab.children}
        </div>
      ))}
    </div>
  );
}
