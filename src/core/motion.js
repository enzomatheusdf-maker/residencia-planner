export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function withViewTransition(fn) {
  if (typeof fn !== "function") return undefined;
  if (prefersReducedMotion()) return fn();
  const starter = typeof document !== "undefined" ? document.startViewTransition : null;
  if (typeof starter !== "function") return fn();
  return starter.call(document, fn);
}

export function getStaggerStyle(index, stepMs = 40) {
  const safeIndex = Math.max(0, Number(index) || 0);
  const safeStep = Math.max(0, Number(stepMs) || 0);
  if (safeIndex === 0 || safeStep === 0) return {};
  return { animationDelay: `${safeIndex * safeStep}ms` };
}
