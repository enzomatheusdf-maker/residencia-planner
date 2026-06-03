export const uiTokens = Object.freeze({
  colors: Object.freeze({
    bg0: "#05070d",
    bg1: "#080b13",
    bg2: "#0d1320",
    surfaceSolid: "#111827",
    textStrong: "#f8fafc",
    text: "#dbe4f0",
    textMuted: "#94a3b8",
    textFaint: "#64748b",
    blue: "#3b82f6",
    blueStrong: "#2563eb",
    cyan: "#06b6d4",
    green: "#10b981",
    amber: "#f59e0b",
    red: "#ef4444",
    purple: "#8b5cf6",
    neutral: "#64748b",
  }),
  surfaces: Object.freeze({
    surface0: "rgba(255,255,255,.035)",
    surface1: "rgba(255,255,255,.055)",
    surface2: "rgba(255,255,255,.075)",
    borderSubtle: "rgba(255,255,255,.08)",
    borderStrong: "rgba(255,255,255,.14)",
  }),
  radius: Object.freeze({
    xs: 8,
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
    pill: 999,
  }),
  shadows: Object.freeze({
    soft: "0 18px 60px rgba(0,0,0,.28)",
    card: "0 16px 40px rgba(0,0,0,.22)",
    popover: "0 24px 80px rgba(0,0,0,.42)",
    focus: "0 0 0 4px rgba(59,130,246,.45)",
  }),
  zIndex: Object.freeze({
    base: 1,
    sticky: 30,
    dropdown: 100,
    popover: 300,
    tooltip: 400,
    overlay: 600,
    modal: 700,
    toast: 900,
  }),
  motion: Object.freeze({
    durationFast: 120,
    durationBase: 180,
    durationSlow: 260,
    easeOut: "cubic-bezier(.16,1,.3,1)",
    easeIn: "cubic-bezier(.7,0,.84,0)",
    easeStandard: "cubic-bezier(.2,0,0,1)",
  }),
  type: Object.freeze({
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
  }),
});

export const toneTokens = Object.freeze({
  blue: Object.freeze({ color: uiTokens.colors.blue, soft: "rgba(59,130,246,.14)" }),
  cyan: Object.freeze({ color: uiTokens.colors.cyan, soft: "rgba(6,182,212,.14)" }),
  green: Object.freeze({ color: uiTokens.colors.green, soft: "rgba(16,185,129,.14)" }),
  amber: Object.freeze({ color: uiTokens.colors.amber, soft: "rgba(245,158,11,.16)" }),
  red: Object.freeze({ color: uiTokens.colors.red, soft: "rgba(239,68,68,.14)" }),
  purple: Object.freeze({ color: uiTokens.colors.purple, soft: "rgba(139,92,246,.14)" }),
  neutral: Object.freeze({ color: uiTokens.colors.neutral, soft: "rgba(100,116,139,.16)" }),
});

export const toneNames = Object.freeze(Object.keys(toneTokens));

export function getToneToken(tone = "neutral") {
  return toneTokens[tone] || toneTokens.neutral;
}
