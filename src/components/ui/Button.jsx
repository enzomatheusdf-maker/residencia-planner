import React from "react";
import { cx } from "./utils";

const variantStyles = {
  primary: {
    color: "var(--med-text-strong)",
    background: "linear-gradient(180deg, var(--med-blue), var(--med-blue-strong))",
    borderColor: "rgba(255,255,255,.16)",
  },
  secondary: {
    color: "var(--med-text-strong)",
    background: "var(--med-surface-2)",
    borderColor: "var(--med-border-strong)",
  },
  ghost: {
    color: "var(--med-text)",
    background: "transparent",
    borderColor: "transparent",
  },
  danger: {
    color: "var(--med-text-strong)",
    background: "linear-gradient(180deg, var(--med-red), #b91c1c)",
    borderColor: "rgba(255,255,255,.16)",
  },
  success: {
    color: "var(--med-text-strong)",
    background: "linear-gradient(180deg, var(--med-green), #047857)",
    borderColor: "rgba(255,255,255,.16)",
  },
  outline: {
    color: "var(--med-text)",
    background: "transparent",
    borderColor: "var(--med-border-strong)",
  },
  soft: {
    color: "var(--med-blue)",
    background: "var(--med-blue-soft)",
    borderColor: "rgba(59,130,246,.22)",
  },
};

const sizeStyles = {
  xs: { minHeight: 28, padding: "0 10px", fontSize: "var(--med-text-xs)" },
  sm: { minHeight: 34, padding: "0 12px", fontSize: "var(--med-text-sm)" },
  md: { minHeight: 40, padding: "0 16px", fontSize: "var(--med-text-base)" },
  lg: { minHeight: 48, padding: "0 20px", fontSize: "var(--med-text-md)" },
  icon: { width: 40, height: 40, padding: 0, fontSize: "var(--med-text-base)" },
};

export function Button({
  as: Component = "button",
  children,
  className,
  disabled = false,
  fullWidth = false,
  size = "md",
  style,
  type = "button",
  variant = "primary",
  ...props
}) {
  const isButton = Component === "button";
  return (
    <Component
      className={cx("med-button-reset med-pressable med-focus-ring", className)}
      disabled={isButton ? disabled : undefined}
      aria-disabled={!isButton && disabled ? "true" : undefined}
      type={isButton ? type : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: fullWidth ? "100%" : undefined,
        borderWidth: 1,
        borderStyle: "solid",
        borderRadius: "var(--med-radius-sm)",
        fontWeight: 800,
        letterSpacing: 0,
        opacity: disabled ? .52 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        userSelect: "none",
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
