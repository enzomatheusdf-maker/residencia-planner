import React from "react";
import { cx, getToneVars } from "./utils";

export function Badge({ children, className, tone = "neutral", style, ...props }) {
  const vars = getToneVars(tone);
  return (
    <span
      className={cx("med-focus-ring", className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 22,
        padding: "0 9px",
        border: "1px solid color-mix(in srgb, currentColor 28%, transparent)",
        borderRadius: "var(--med-radius-pill)",
        color: vars.color,
        background: vars.soft,
        fontSize: "var(--med-text-xs)",
        fontWeight: 900,
        letterSpacing: 0,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
