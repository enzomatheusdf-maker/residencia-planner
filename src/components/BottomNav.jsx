// src/components/BottomNav.jsx
import React, { useMemo } from "react";
import { NAV } from "./Sidebar";
import { useStore } from "../core/store";
import { STEPS, todayStr } from "../core/fsrs";
import { calcStreaks } from "../hooks/useMetrics";

export default function BottomNav({ view, setView }) {
  const { plat } = useStore();
  const temas = useStore((s) => s[plat]?.temas || []);

  const streakEmRisco = useMemo(() => {
    const doneReviews = temas.flatMap((t) => STEPS.map((s) => ({ ...t.rev[s.key], date: t.rev[s.key].date })))
      .filter((r) => r.done);
    const doneDays = new Set(doneReviews.map((r) => r.date));
    const { current: streakCurrent } = calcStreaks(doneDays);
    return streakCurrent > 0 && !doneDays.has(todayStr());
  }, [temas]);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#07070f]/95 backdrop-blur-md border-t border-white/5 z-40 flex items-stretch justify-around pt-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}>
      {NAV.map((n) => {
        const Icon = n.icon;
        const isActive = view === n.k;
        const showStreakWarning = n.k === "dash" && streakEmRisco;
        return (
          <button key={n.k} onClick={() => setView(n.k)} className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors relative ${isActive ? "text-purple-400" : "text-gray-600"}`}>
            <Icon size={21} />
            <span className="text-[9px] font-semibold">{n.label.split(" ")[0]}</span>
            {showStreakWarning && (
              <span className="absolute top-1 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
