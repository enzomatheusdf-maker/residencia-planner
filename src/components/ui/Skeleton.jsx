import React from "react";
import { cx } from "./utils";

export function Skeleton({ className, height = 16, radius = "var(--med-radius-sm)", style, width = "100%" }) {
  return (
    <span
      aria-hidden="true"
      className={cx("med-animate-in", className)}
      style={{
        display: "block",
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, var(--med-surface-0), var(--med-surface-2), var(--med-surface-0))",
        backgroundSize: "220% 100%",
        opacity: .9,
        ...style,
      }}
    />
  );
}
