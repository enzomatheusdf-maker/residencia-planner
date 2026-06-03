import React from "react";
import { cx } from "./utils";

const variantStyles = {
  default: {},
  elevated: { boxShadow: "var(--med-shadow-soft)" },
  interactive: {},
  selected: {
    borderColor: "var(--med-border-focus)",
    boxShadow: "0 0 0 1px var(--med-border-focus), var(--med-shadow-card)",
  },
  critical: {
    borderColor: "rgba(239,68,68,.35)",
    background: "linear-gradient(180deg, rgba(239,68,68,.12), rgba(255,255,255,.028)), var(--med-surface-0)",
  },
  success: {
    borderColor: "rgba(16,185,129,.35)",
    background: "linear-gradient(180deg, rgba(16,185,129,.12), rgba(255,255,255,.028)), var(--med-surface-0)",
  },
};

export function Card({
  as: Component = "div",
  children,
  className,
  interactive = false,
  selected = false,
  style,
  variant = "default",
  ...props
}) {
  const resolvedVariant = selected ? "selected" : variant;
  return (
    <Component
      className={cx("med-card", interactive || variant === "interactive" ? "med-card-interactive med-focus-ring" : "", className)}
      style={{
        padding: 18,
        ...variantStyles[resolvedVariant],
        ...style,
      }}
      tabIndex={interactive && !props.tabIndex ? 0 : props.tabIndex}
      {...props}
    >
      {children}
    </Component>
  );
}
