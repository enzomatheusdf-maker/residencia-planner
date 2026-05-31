// src/components/Sidebar.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Calendar, BarChart3, FileText, Target, Zap,
  ChevronRight, LogOut, GraduationCap, Store, CircleHelp, SlidersHorizontal
} from "lucide-react";
import { useStore } from "../core/store";
import { diffDays, todayStr, STEPS } from "../core/fsrs";
import { MedRevLogo } from "./Primitives";
import { calcStreaks } from "../hooks/useMetrics";

export const NAV = [
  { k: "dash", icon: LayoutDashboard, label: "Dashboard" },
  { k: "crono", icon: Calendar, label: "Cronograma" },
  { k: "academia", icon: GraduationCap, label: "Academia" },
  { k: "banco", icon: BarChart3, label: "Banco de Dados" },
  { k: "stats", icon: FileText, label: "Histórico" },
  { k: "sims", icon: Target, label: "Prontidão" },
  { k: "anki", icon: Zap, label: "Anki Audit" }
];

export default function Sidebar({ view, setView, setAjustes, overdueCount, setHelpModal, usuarioLogado, syncStatus, onLogout, onOpenLoja }) {
  const { plat, meta, focusMode } = useStore();
  const userName = useStore((s) => s.userName);
  const temas = useStore((s) => s[plat]?.temas || []);
  const [collapsed, setCollapsed] = useState(false);
  const [xpPulse, setXpPulse] = useState(false);

  const filteredNav = useMemo(() => {
    if (plat === "vest") return NAV.filter((n) => n.k !== "anki");
    return NAV;
  }, [plat]);

  const gamif = useStore((s) => s.gamif) || { xp: 0, level: 1 };
  const level = gamif.level || 1;
  const xp = gamif.xp || 0;
  const minXp = ((level - 1) ** 2) * 50;
  const maxXp = (level ** 2) * 50;
  const range = maxXp - minXp;
  const progress = xp - minXp;
  const xpPercent = Math.max(0, Math.min(100, (progress / range) * 100));
  const xpRemaining = maxXp - xp;
  const prevLevelRef = useRef(level);

  const streakEmRisco = useMemo(() => {
    const doneReviews = temas
      .flatMap((t) => STEPS.map((s) => ({ ...t.rev[s.key], date: t.rev[s.key].date })))
      .filter((r) => r.done);
    const doneDays = new Set(doneReviews.map((r) => r.date));
    const { current: streakCurrent } = calcStreaks(doneDays);
    return streakCurrent > 0 && !doneDays.has(todayStr());
  }, [temas]);

  useEffect(() => {
    if (focusMode) setCollapsed(true);
  }, [focusMode]);

  useEffect(() => {
    if (level > prevLevelRef.current) {
      setXpPulse(true);
      const t = setTimeout(() => setXpPulse(false), 280);
      prevLevelRef.current = level;
      return () => clearTimeout(t);
    }
    prevLevelRef.current = level;
  }, [level]);

  const daysLeft = meta.dataProva ? diffDays(todayStr(), meta.dataProva) : null;
  const urgency = daysLeft == null ? "text-blue-400" : daysLeft <= 30 ? "text-red-400" : daysLeft <= 90 ? "text-yellow-400" : "text-blue-400";

  return (
    <aside className={`hidden md:flex flex-col bg-[#07070f] border-r border-white/5 shrink-0 transition-all duration-200 ${collapsed ? "w-[60px]" : "w-60"}`}>
      <div
        className={`flex items-center border-b border-white/5 p-3 gap-2 ${collapsed ? "justify-center" : "justify-between"}`}
        style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.14) 0%, rgba(14,165,233,0.08) 100%)" }}
      >
        <MedRevLogo collapsed={collapsed} size={collapsed ? "sm" : "md"} />
        <button onClick={() => setCollapsed(!collapsed)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 transition-colors shrink-0">
          {collapsed ? <ChevronRight size={16} /> : <ChevronRight size={16} style={{ transform: "scaleX(-1)" }} />}
        </button>
      </div>

      <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
        {filteredNav.map((n) => {
          const Icon = n.icon;
          const isActive = view === n.k;
          const showStreakWarning = n.k === "dash" && streakEmRisco;
          return (
            <button
              key={n.k}
              onClick={() => setView(n.k)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all text-left group ${isActive ? "bg-gradient-to-r from-indigo-600/20 to-sky-500/10 text-white border border-indigo-500/20" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"}`}
            >
              <Icon size={18} className={`shrink-0 transition-colors ${isActive ? "text-indigo-400" : "group-hover:text-gray-300"}`} />
              {!collapsed && <span className="text-[12.5px] font-medium truncate flex-1">{n.label}</span>}
              {showStreakWarning && (
                <span className="flex h-2.5 w-2.5 relative" title="Ofensiva em risco!">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                </span>
              )}
              {!collapsed && isActive && !showStreakWarning && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-white/5 flex flex-col gap-1">
        <button onClick={onOpenLoja} className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-gray-600 hover:text-amber-400 hover:bg-amber-500/5 transition-all border-none bg-transparent cursor-pointer">
          <Store size={15} className="shrink-0" />
          {!collapsed && <span className="text-[12px]">Loja do Mentor</span>}
        </button>
        <button onClick={() => setHelpModal(true)} className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-gray-600 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all border-none bg-transparent cursor-pointer">
          <CircleHelp size={15} className="shrink-0" />
          {!collapsed && <span className="text-[12px]">Guia de Uso</span>}
        </button>
        <button onClick={() => setAjustes(true)} className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all border-none bg-transparent cursor-pointer">
          <SlidersHorizontal size={15} className="shrink-0" />
          {!collapsed && <span className="text-[12px]">Ajustes</span>}
        </button>

        {usuarioLogado && (
          <div className={`mt-1.5 pt-2 border-t border-white/5 ${collapsed ? "flex justify-center" : "block"}`}>
            {collapsed ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  <div onClick={() => setAjustes(true)} className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center font-bold text-white text-xs shrink-0 select-none shadow-md shadow-indigo-950/50 cursor-pointer hover:brightness-110 transition-all">
                    {(userName || usuarioLogado.displayName || usuarioLogado.email || "US").substring(0, 2).toUpperCase()}
                  </div>
                  {syncStatus === "saving" && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 border border-[#07070f] animate-pulse" title="Sincronizando..." />}
                  {syncStatus === "saved" && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#07070f]" title="Sincronizado com nuvem" />}
                  {syncStatus === "offline" && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#07070f]" title="Modo Offline" />}
                </div>
                <button onClick={onLogout} title="Sair da conta" className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3 flex flex-col gap-2.5 hover:border-white/12 hover:bg-white/[0.06] transition-colors select-none">
                <div className="flex items-center gap-2.5">
                  <div onClick={() => setAjustes(true)} className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center font-black text-white text-[13px] shrink-0 select-none shadow-lg shadow-indigo-950/60 cursor-pointer">
                    {(userName || usuarioLogado.displayName || usuarioLogado.email || "US").substring(0, 2).toUpperCase()}
                  </div>
                  <div onClick={() => setAjustes(true)} className="flex-1 min-w-0 cursor-pointer">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-[12px] font-bold text-gray-100 truncate leading-tight">{userName || usuarioLogado.displayName || usuarioLogado.email?.split("@")[0]}</p>
                      {syncStatus === "saving" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" title="Sincronizando..." />}
                      {syncStatus === "saved" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Sincronizado com nuvem" />}
                      {syncStatus === "offline" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Modo Offline" />}
                    </div>
                    <p className="text-[9.5px] text-gray-500 truncate leading-none mt-0.5 font-mono">{plat === "res" ? "Residência Médica" : "Vestibular"}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLogout();
                    }}
                    title="Sair da conta"
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  >
                    <LogOut size={14} />
                  </button>
                </div>

                <div className="border-t border-white/5 pt-2.5 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="text-gray-400 uppercase">Nível {level}</span>
                    <span className="text-amber-400 font-mono">{xp} XP</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                    <div
                      className={`h-full bg-gradient-to-r from-blue-500 to-sky-500 transition-[width,transform] duration-500 ease-out origin-left ${xpPulse ? "animate-scale-up" : ""}`}
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                  <p className="text-[8px] text-gray-500 font-medium">Faltam {xpRemaining} XP para o Nível {level + 1}</p>
                </div>

                {daysLeft != null && (
                  <div className="border-t border-white/5 pt-2 flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Prova em</span>
                    <span className={`text-[12px] font-black font-mono tabular-nums ${urgency}`}>{daysLeft} dias</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
