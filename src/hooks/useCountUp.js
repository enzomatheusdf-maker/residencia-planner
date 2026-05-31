import { useEffect, useState } from "react";

// Aceita o segundo argumento como número (ms) OU como objeto { duration }.
export default function useCountUp(target, options = 800) {
  const duration =
    typeof options === "number" ? options : (options?.duration ?? 800);

  const [value, setValue] = useState(0);

  useEffect(() => {
    const end = Number.isFinite(Number(target)) ? Number(target) : 0;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion) {
      setValue(end);
      return;
    }
    if (duration <= 0) {
      setValue(end);
      return;
    }

    const startTs = performance.now();
    let rafId;

    const tick = (now) => {
      const progress = Math.min(1, (now - startTs) / duration);
      setValue(Math.round(end * progress));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
}
