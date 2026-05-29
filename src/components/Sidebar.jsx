// src/components/Sidebar.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Calendar, BarChart3, FileText, Target, Zap,
  ChevronRight, Info, Settings, LogOut
} from "lucide-react";
import { useStore } from "../core/store";
import { diffDays, todayStr, STEPS } from "../core/fsrs";
import { MedRevLogo } from "./Primitives";
import { calcStreaks } from "../hooks/useMetrics";

export const NAV = [
  { k: "dash",  icon: LayoutDashboard, label: "Dashboard"     },
  { k: "crono", icon: Calendar,        label: "Cronograma"     },
  { k: "banco", icon: BarChart3,       label: "Banco de Dados" },
  { k: "stats", icon: FileText,        label: "Estatísticas"   },
  { k: "sims",  icon: Target,          label: "Simulados"      },
  { k: "anki",  icon: Zap,             label: "Anki Audit"     }
];

export default function Sidebar({ view, setView, setAjustes, overdueCount, setHelpModal, usuarioLogado, syncStatus, onLogout }) {
  const { plat, setPlat, meta, focusMode } = useStore();
  const userName = useStore((s) => s.userName);
  const temas = useStore((s) => s[plat]?.temas || []);
  const [collapsed, setCollapsed] = useState(false);

  const streakEmRisco = useMemo(() => {
    const doneReviews = temas.flatMap((t) => STEPS.map((s) => ({ ...t.rev[s.key], date: t.rev[s.key].date })))
      .filter((r) => r.done);
    const doneDays = new Set(doneReviews.map((r) => r.date));
    const { current: streakCurrent } = calcStreaks(doneDays);
    return streakCurrent > 0 && !doneDays.has(todayStr());
  }, [temas]);

  // Auto-collapse when focusMode is activated
  useEffect(() => {
    if (focusMode) {
      setCollapsed(true);
    }
  }, [focusMode]);

  const daysLeft = meta.dataProva ? diffDays(todayStr(), meta.dataProva) : null;
  const urgency  = daysLeft == null ? "text-violet-400" : daysLeft <= 30 ? "text-red-400" : daysLeft <= 90 ? "text-yellow-400" : "text-violet-400";

  return (
    <aside className={`hidden md:flex flex-col bg-[#07070f] border-r border-white/5 shrink-0 transition-all duration-200 ${collapsed ? "w-[60px]" : "w-60"}`}>
      {/* Logo header */}
      <div className={`flex items-center border-b border-white/5 p-3 gap-2 ${collapsed ? "justify-center" : "justify-between"}`}
           style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.05) 100%)" }}>
        <MedRevLogo collapsed={collapsed} size={collapsed ? "sm" : "md"} />
        <button onClick={() => setCollapsed(!collapsed)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 transition-colors shrink-0">
          {collapsed ? <ChevronRight size={16} /> : <ChevronRight size={16} style={{transform: 'scaleX(-1)'}} />}
        </button>
      </div>

      {/* Platform switcher */}
      {!collapsed && (
        <div className="flex gap-1 p-3 pb-2">
          {[["res","Residência"],["vest","Vestibular"]].map(([k, l]) => (
            <button key={k} onClick={() => setPlat(k)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${plat === k ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-300 bg-white/5"}`}>
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((n) => {
          const Icon = n.icon;
          const isActive = view === n.k;
          const showStreakWarning = n.k === "dash" && streakEmRisco;
          return (
            <button key={n.k} onClick={() => setView(n.k)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all text-left group ${isActive ? "bg-gradient-to-r from-purple-600/20 to-pink-500/10 text-white border border-purple-500/20" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"}`}>
              <Icon size={18} className={`shrink-0 transition-colors ${isActive ? "text-purple-400" : "group-hover:text-gray-300"}`} />
              {!collapsed && <span className="text-[12.5px] font-medium truncate flex-1">{n.label}</span>}
              {showStreakWarning && (
                <span className="flex h-2.5 w-2.5 relative" title="Ofensiva em risco!">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                </span>
              )}
              {!collapsed && isActive && !showStreakWarning && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-2 border-t border-white/5 flex flex-col gap-1">
        {!collapsed && daysLeft != null && (
          <div className={`rounded-xl px-3 py-2 mb-1 border ${daysLeft <= 30 ? "bg-red-500/5 border-red-500/20" : daysLeft <= 90 ? "bg-yellow-500/5 border-yellow-500/20" : "bg-purple-500/5 border-purple-500/20"}`}>
            <p className="text-[10px] text-gray-600 uppercase mb-0.5">Prova em</p>
            <p className={`text-xl font-black tabular-nums ${urgency}`}>{daysLeft}d</p>
          </div>
        )}
        <button onClick={() => setHelpModal(true)} className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-gray-600 hover:text-purple-400 hover:bg-purple-500/5 transition-all">
          <Info size={16} className="shrink-0"/>{!collapsed && <span className="text-[12px]">Guia de Uso</span>}
        </button>
        <button onClick={() => setAjustes(true)} className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all">
          <Settings size={16} className="shrink-0"/>{!collapsed && <span className="text-[12px]">Ajustes</span>}
        </button>

        {/* ── User Profile Card (fixo, sem popup) ── */}
        {usuarioLogado && (
          <div className={`mt-1.5 pt-2 border-t border-white/5 ${collapsed ? "flex justify-center" : "block"}`}>
             {collapsed ? (
              /* Collapsed: só avatar + logout em coluna */
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  <div onClick={() => setAjustes(true)} className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center font-bold text-white text-xs shrink-0 select-none shadow-md shadow-purple-950/50 cursor-pointer hover:brightness-110 transition-all">
                    {(userName || usuarioLogado.displayName || usuarioLogado.email || "US").substring(0, 2).toUpperCase()}
                  </div>
                  {syncStatus === 'saving' && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 border border-[#07070f] animate-pulse" title="Sincronizando..." />}
                  {syncStatus === 'saved' && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#07070f]" title="Sincronizado com nuvem ✓" />}
                  {syncStatus === 'offline' && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#07070f]" title="Modo Offline" />}
                </div>
                <button onClick={onLogout} title="Sair da conta" className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              /* Expanded: card completo */
              <div onClick={() => setAjustes(true)} className="rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-2.5 flex items-center gap-2.5 hover:border-white/12 hover:bg-white/[0.06] transition-colors cursor-pointer">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center font-black text-white text-[13px] shrink-0 select-none shadow-lg shadow-purple-950/60">
                  {(userName || usuarioLogado.displayName || usuarioLogado.email || "US").substring(0, 2).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-[12px] font-bold text-gray-100 truncate leading-tight">
                      {userName || usuarioLogado.displayName || usuarioLogado.email?.split("@")[0]}
                    </p>
                    {syncStatus === 'saving' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" title="Sincronizando..." />}
                    {syncStatus === 'saved' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Sincronizado com nuvem ✓" />}
                    {syncStatus === 'offline' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Modo Offline" />}
                  </div>
                  <p className="text-[9.5px] text-gray-500 truncate leading-none mt-0.5 font-mono">
                    {plat === "res" ? "Residência Médica" : "Vestibular"}
                  </p>
                </div>
                {/* Logout */}
                <button
                  onClick={onLogout}
                  title="Sair da conta"
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
