import React from "react";
import { clamp, cx, getToneVars } from "./utils";

export function MetricRing({
  className,
  label,
  max = 100,
  size = 112,
  style,
  sublabel,
  tone = "blue",
  value = 0,
}) {
  const vars = getToneVars(tone);
  const safeMax = Number(max) > 0 ? Number(max) : 100;
  const percent = clamp((Number(value) / safeMax) * 100, 0, 100);
  const rounded = Math.round(percent);

  return (
    <div
      className={cx("med-animate-scale", className)}
      role="img"
      aria-label={`${label}: ${rounded}%`}
      style={{
        width: size,
        minWidth: size,
        textAlign: "center",
        ...style,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: `conic-gradient(${vars.color} ${percent}%, var(--med-surface-2) 0)`,
          boxShadow: "inset 0 0 0 1px var(--med-border-subtle)",
        }}
      >
        <div
          style={{
            width: `calc(${size}px - 24px)`,
            height: `calc(${size}px - 24px)`,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "var(--med-bg-2)",
            border: "1px solid var(--med-border-subtle)",
          }}
        >
          <strong style={{ color: "var(--med-text-strong)", fontSize: 24, lineHeight: 1 }}>{rounded}%</strong>
        </div>
      </div>
      <div style={{ marginTop: 10, color: "var(--med-text)", fontSize: "var(--med-text-sm)", fontWeight: 800 }}>{label}</div>
      {sublabel ? <div style={{ color: "var(--med-text-muted)", fontSize: "var(--med-text-xs)" }}>{sublabel}</div> : null}
    </div>
  );
}
