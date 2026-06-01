// src/components/BottomNav.jsx
import React, { useMemo } from "react";
import { useStore } from "../core/store";
import { STEPS, todayStr } from "../core/fsrs";
import { calcStreaks } from "../hooks/useMetrics";
import { X, LayoutDashboard, Calendar, BarChart3, FileText, Target, Zap, Stethoscope, GraduationCap, ShieldCheck, ClipboardCheck, BookOpen, Settings, Info, MoreHorizontal } from "lucide-react";
import { featureEnabled } from "../core/platformFeatures";
import { NAV_VIEW, getMoreNavItems, getPrimaryNavItems, normalizeView } from "../core/navigationModel";

const ICON_BY_VIEW = {
  [NAV_VIEW.TODAY]: LayoutDashboard,
  [NAV_VIEW.PLAN]: Calendar,
  [NAV_VIEW.STUDY]: Target,
  [NAV_VIEW.STATS]: FileText,
  [NAV_VIEW.DATABASE]: BarChart3,
  [NAV_VIEW.MORE]: MoreHorizontal,
  [NAV_VIEW.CLINICAL_REASONING]: Stethoscope,
  [NAV_VIEW.ANKI]: Zap,
  [NAV_VIEW.WEEKLY_REVIEW]: ClipboardCheck,
  [NAV_VIEW.ACADEMY]: GraduationCap,
  [NAV_VIEW.DATA_SAFETY]: ShieldCheck,
  [NAV_VIEW.LAUNCH_CHECKLIST]: ClipboardCheck,
  [NAV_VIEW.GUIDE]: BookOpen,
  [NAV_VIEW.SETTINGS]: Settings,
};

function getMoreActionLabel(item) {
  if (item.view === NAV_VIEW.GUIDE) return "Abrir guia";
  if (item.view === NAV_VIEW.SETTINGS) return "Abrir ajustes";
  if (
    item.view === NAV_VIEW.DATA_SAFETY
    || item.view === NAV_VIEW.WEEKLY_REVIEW
    || item.view === NAV_VIEW.LAUNCH_CHECKLIST
  ) {
    return "Abrir Stats";
  }
  return "Abrir";
}

export default function BottomNav({ view, setView, onOpenAjustes, onOpenHelp }) {
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

  const navFeatures = useMemo(() => ({
    mobile: true,
    modulos: meta.modulos,
    raciocinioClinico: featureEnabled(plat, "raciocinioClinico") && meta.modulos?.raciocinioClinico === true,
  }), [meta.modulos, plat]);
  const primaryNav = useMemo(() => getPrimaryNavItems(plat, navFeatures), [plat, navFeatures]);
  const moreNav = useMemo(() => getMoreNavItems(plat, navFeatures), [plat, navFeatures]);
  const normalizedView = normalizeView(view);

  const handleMoreAction = (targetView) => {
    if (targetView === NAV_VIEW.GUIDE) {
      if (onOpenHelp) onOpenHelp();
      else setView(NAV_VIEW.MORE);
      setMoreOpen(false);
      return;
    }
    if (targetView === NAV_VIEW.SETTINGS) {
      if (onOpenAjustes) onOpenAjustes();
      else setView(NAV_VIEW.MORE);
      setMoreOpen(false);
      return;
    }
    if (
      targetView === NAV_VIEW.DATA_SAFETY
      || targetView === NAV_VIEW.WEEKLY_REVIEW
      || targetView === NAV_VIEW.LAUNCH_CHECKLIST
    ) {
      setView(NAV_VIEW.STATS);
      setMoreOpen(false);
      return;
    }
    setView(targetView);
    setMoreOpen(false);
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#07070f]/95 backdrop-blur-md border-t border-white/5 z-40 flex items-stretch justify-around pt-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}>
      {primaryNav.map((n) => {
        const Icon = ICON_BY_VIEW[n.view] || Info;
        const isMoreItem = n.view === NAV_VIEW.MORE;
        const isActive = isMoreItem
          ? normalizedView === NAV_VIEW.MORE || moreNav.some((item) => item.view === normalizedView)
          : normalizedView === n.view;
        const showStreakWarning = n.view === NAV_VIEW.TODAY && streakEmRisco;
        return (
          <button
            aria-label={n.label}
            key={n.view}
            onClick={() => (isMoreItem ? setMoreOpen(true) : setView(n.view))}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 px-3 py-1 transition-colors relative ${isActive ? "text-indigo-400" : "text-gray-600"}`}
          >
            <Icon size={21} />
            <span className="text-[9px] font-semibold">{n.mobileLabel || n.label}</span>
            {showStreakWarning && (
              <span className="absolute top-1 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
            )}
          </button>
        );
      })}
      {moreOpen && (
        <div className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm flex items-end" onClick={() => setMoreOpen(false)}>
          <div className="w-full bg-[var(--surface-1)] border-t border-white/10 rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Mais opções</h3>
              <button aria-label="Fechar" onClick={() => setMoreOpen(false)} className="text-gray-400 hover:text-white border-none bg-transparent"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {moreNav.map((n) => {
                const Icon = ICON_BY_VIEW[n.view] || Info;
                return (
                  <button
                    aria-label={n.label}
                    key={n.view}
                    onClick={() => handleMoreAction(n.view)}
                    className={`min-h-[44px] rounded-xl border ${normalizedView === n.view ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-white/10 bg-white/5 text-gray-300"} flex flex-col items-center justify-center gap-1`}
                  >
                    <Icon size={18} />
                    <span className="text-[10px] font-semibold">{n.mobileLabel || n.label}</span>
                    <span className="text-[9px] text-gray-500">{getMoreActionLabel(n)}</span>
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
