// src/components/BottomNav.jsx
import React, { useMemo } from "react";
import { NAV } from "./Sidebar";
import { useStore } from "../core/store";
import { STEPS, todayStr } from "../core/fsrs";
import { calcStreaks } from "../hooks/useMetrics";
import { MoreHorizontal, X } from "lucide-react";
import { featureEnabled } from "../core/platformFeatures";

export default function BottomNav({ view, setView }) {
  const { plat, meta } = useStore();
  const temas = useStore((s) => s[plat]?.temas || []);
  const [moreOpen, setMoreOpen] = React.useState(false);

  const streakEmRisco = useMemo(() => {
    const doneReviews = temas.flatMap((t) => STEPS.map((s) => ({ ...t.rev[s.key], date: t.rev[s.key].date })))
      .filter((r) => r.done);
    const doneDays = new Set(doneReviews.map((r) => r.date));
    const { current: streakCurrent } = calcStreaks(doneDays);
    return streakCurrent > 0 && !doneDays.has(todayStr());
  }, [temas]);

  const filteredNav = useMemo(() => {
    return NAV.filter((n) => {
      if (n.requiresModule && meta.modulos?.[n.requiresModule] !== true) {
        return false;
      }
      if (plat === "vest" && n.k === "anki") {
        return false;
      }
      if (n.k === "raciocinio" && !featureEnabled(plat, "raciocinioClinico")) {
        return false;
      }
      return true;
    });
  }, [meta.modulos, plat]);
  const primaryKeys = ["dash", "crono", "sims", "stats"];
  const primaryNav = filteredNav.filter((n) => primaryKeys.includes(n.k));
  const moreNav = filteredNav.filter((n) => !primaryKeys.includes(n.k));
  const mobileLabel = (key, fallback) => {
    if (key === "dash") return "Hoje";
    if (key === "crono") return "Crono";
    if (key === "sims") return "Estudar";
    if (key === "stats") return "Stats";
    return fallback.split(" ")[0];
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#07070f]/95 backdrop-blur-md border-t border-white/5 z-40 flex items-stretch justify-around pt-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}>
      {primaryNav.map((n) => {
        const Icon = n.icon;
        const isActive = view === n.k;
        const showStreakWarning = n.k === "dash" && streakEmRisco;
        return (
          <button aria-label={n.label} key={n.k} onClick={() => setView(n.k)} className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 px-3 py-1 transition-colors relative ${isActive ? "text-indigo-400" : "text-gray-600"}`}>
            <Icon size={21} />
            <span className="text-[9px] font-semibold">{mobileLabel(n.k, n.label)}</span>
            {showStreakWarning && (
              <span className="absolute top-1 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
            )}
          </button>
        );
      })}
      <button
        aria-label="Mais"
        onClick={() => setMoreOpen(true)}
        className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 px-3 py-1 transition-colors ${moreOpen ? "text-indigo-400" : "text-gray-600"}`}
      >
        <MoreHorizontal size={21} />
        <span className="text-[9px] font-semibold">Mais</span>
      </button>
      {moreOpen && (
        <div className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm flex items-end" onClick={() => setMoreOpen(false)}>
          <div className="w-full bg-[var(--surface-1)] border-t border-white/10 rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Mais opções</h3>
              <button aria-label="Fechar" onClick={() => setMoreOpen(false)} className="text-gray-400 hover:text-white border-none bg-transparent"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {moreNav.map((n) => {
                const Icon = n.icon;
                return (
                  <button
                    aria-label={n.label}
                    key={n.k}
                    onClick={() => { setView(n.k); setMoreOpen(false); }}
                    className={`min-h-[44px] rounded-xl border ${view === n.k ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-white/10 bg-white/5 text-gray-300"} flex flex-col items-center justify-center gap-1`}
                  >
                    <Icon size={18} />
                    <span className="text-[10px] font-semibold">{mobileLabel(n.k, n.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
