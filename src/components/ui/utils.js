export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function clamp(value, min = 0, max = 100) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

export const toneVars = Object.freeze({
  blue: { color: "var(--med-blue)", soft: "var(--med-blue-soft)" },
  green: { color: "var(--med-green)", soft: "var(--med-green-soft)" },
  amber: { color: "var(--med-amber)", soft: "var(--med-amber-soft)" },
  red: { color: "var(--med-red)", soft: "var(--med-red-soft)" },
  purple: { color: "var(--med-purple)", soft: "var(--med-purple-soft)" },
  cyan: { color: "var(--med-cyan)", soft: "var(--med-cyan-soft)" },
  neutral: { color: "var(--med-neutral)", soft: "var(--med-neutral-soft)" },
});

export function getToneVars(tone = "neutral") {
  return toneVars[tone] || toneVars.neutral;
}
