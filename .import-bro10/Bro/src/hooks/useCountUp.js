import { useEffect, useRef, useState } from "react";

export default function useCountUp(target, { duration = 600 } = {}) {
  const safeTarget = Number.isFinite(target) ? Number(target) : 0;
  const [value, setValue] = useState(safeTarget);
  const rafRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      setValue(safeTarget);
      return;
    }

    const startValue = value;
    const delta = safeTarget - startValue;
    if (delta === 0) return;

    const start = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const next = startValue + delta * easeOutCubic(t);
      setValue(t === 1 ? safeTarget : Math.round(next));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeTarget, duration]);

  return value;
}
