// src/components/Sidebar.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Calendar, BarChart3, FileText, Target, Zap,
  ChevronRight, Info, Settings, LogOut, Flame, Stethoscope, GraduationCap
} from "lucide-react";
import { useStore } from "../core/store";
import { diffDays, todayStr, STEPS } from "../core/fsrs";
import { levelForXp, xpToNextLevel } from "../core/gamif";
import { featureEnabled } from "../core/platformFeatures";
import { MedRevLogo } from "./Primitives";
import { calcStreaks } from "../hooks/useMetrics";

export const NAV = [
  { k: "dash",  icon: LayoutDashboard, label: "Dashboard"     },
  { k: "crono", icon: Calendar,        label: "Cronograma"     },
  { k: "academia", icon: GraduationCap, label: "Academia"      },
  { k: "banco", icon: BarChart3,       label: "Banco de Dados" },
  { k: "stats", icon: FileText,        label: "Estatísticas"   },
  { k: "sims",  icon: Target,          label: "Simulados"      },
  { k: "anki",  icon: Zap,             label: "Anki Audit"     },
  { k: "raciocinio", icon: Stethoscope, label: "Raciocínio", requiresModule: "raciocinioClinico" }
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
  const urgency  = daysLeft == null ? "text-blue-400" : daysLeft <= 30 ? "text-red-400" : daysLeft <= 90 ? "text-yellow-400" : "text-blue-400";
  const gamif = useStore((s) => s.gamif) || {};
  const xp = gamif.xp || 0;
  const level = gamif.level || levelForXp(xp);
  const streakCurrent = gamif.streakCurrent || 0;
  const prevLevelMinXp = (level - 1) ** 2 * 50;
  const nextLevelMinXp = level ** 2 * 50;
  const xpFalta = xpToNextLevel(xp);
  const levelPct = Math.min(100, Math.max(0, ((xp - prevLevelMinXp) / Math.max(1, nextLevelMinXp - prevLevelMinXp)) * 100));
  const displayName = userName || usuarioLogado?.displayName || usuarioLogado?.email?.split("@")[0] || "Estudante";
  const initials = (userName || usuarioLogado?.displayName || usuarioLogado?.email || "US").substring(0, 2).toUpperCase();
  const filteredNav = useMemo(() => {
    return NAV.filter((item) => {
      if (item.k === "raciocinio" && !featureEnabled(plat, "raciocinioClinico")) {
        return false;
      }
      return !item.requiresModule || meta.modulos?.[item.requiresModule] === true;
    });
  }, [meta.modulos, plat]);

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
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${plat === k ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-300 bg-white/5"}`}>
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
        {filteredNav.map((n) => {
          const Icon = n.icon;
          const isActive = view === n.k;
          const showStreakWarning = n.k === "dash" && streakEmRisco;
          return (
            <button key={n.k} onClick={() => setView(n.k)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all text-left group ${isActive ? "bg-gradient-to-r from-blue-600/20 to-sky-500/10 text-white border border-blue-500/20" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"}`}>
              <Icon size={18} className={`shrink-0 transition-colors ${isActive ? "text-indigo-400" : "group-hover:text-gray-300"}`} />
              {!collapsed && <span className="text-[12.5px] font-medium truncate flex-1">{n.label}</span>}
              {showStreakWarning && (
                <span className="flex h-2.5 w-2.5 relative" title="Ofensiva em risco!">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                </span>
              )}
              {!collapsed && isActive && !showStreakWarning && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* ===== Cockpit: Guia/Ajustes + Perfil + XP + Prova ===== */}
      <div className="p-2 border-t border-white/5 flex flex-col gap-1.5">

        {/* Guia + Ajustes */}
        <div className={`flex gap-1 ${collapsed ? "flex-col items-center" : ""}`}>
          <button onClick={() => setHelpModal(true)} title="Guia de Uso"
            className="flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-gray-600 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all">
            <Info size={16} className="shrink-0" />{!collapsed && <span className="text-[12px]">Guia</span>}
          </button>
          <button onClick={() => setAjustes(true)} title="Ajustes"
            className="flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all">
            <Settings size={16} className="shrink-0" />{!collapsed && <span className="text-[12px]">Ajustes</span>}
          </button>
        </div>

        {usuarioLogado && (collapsed ? (
          <div className="flex flex-col items-center gap-1.5 pt-1 mt-1 border-t border-white/5">
            <div onClick={() => setAjustes(true)} className="relative cursor-pointer"
                 title={`${displayName} · Nível ${level} · ${xp} XP`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center font-black text-white text-[12px] shadow-md shadow-slate-950/50 hover:brightness-110 transition-all">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 px-1 rounded-md bg-[#07070f] border border-blue-500/40 text-[8px] font-black text-blue-300 leading-tight">
                {level}
              </span>
              {syncStatus === "saving" && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 border border-[#07070f] animate-pulse" title="Sincronizando..." />}
              {syncStatus === "saved"  && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#07070f]" title="Sincronizado ✓" />}
              {syncStatus === "offline"&& <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#07070f]" title="Offline" />}
            </div>
            {daysLeft != null && <span className={`text-[10px] font-black tabular-nums ${urgency}`}>{daysLeft}d</span>}
            <button onClick={onLogout} title="Sair da conta"
              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden mt-0.5">

            <div onClick={() => setAjustes(true)}
              className="px-3 pt-2.5 pb-2 flex items-center gap-2.5 hover:bg-white/[0.05] transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center font-black text-white text-[13px] shrink-0 shadow-lg shadow-slate-950/60 select-none">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-[12px] font-bold text-gray-100 truncate leading-tight">{displayName}</p>
                  {syncStatus === "saving" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" title="Sincronizando..." />}
                  {syncStatus === "saved"  && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Sincronizado ✓" />}
                  {syncStatus === "offline"&& <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Offline" />}
                </div>
                <p className="text-[9.5px] text-gray-500 truncate leading-none mt-0.5 font-mono">
                  {plat === "res" ? "Residência Médica" : "Vestibular"}
                </p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onLogout(); }} title="Sair da conta"
                className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                <LogOut size={14} />
              </button>
            </div>

            <div className="px-3 pb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1 text-[10px] font-black text-blue-300">
                  <Zap size={11} className="text-blue-400" /> Nível {level}
                </span>
                <span className="text-[10px] font-bold text-gray-400 tabular-nums">{xp} XP</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-500 transition-all duration-500"
                     style={{ width: `${levelPct}%` }} />
              </div>
              <p className="text-[8.5px] text-gray-600 mt-0.5 text-right">
                faltam {xpFalta} XP p/ nível {level + 1}
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 border-t border-white/5 bg-black/20">
              {daysLeft != null ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <Calendar size={13} className={`shrink-0 ${urgency}`} />
                  <span className="text-[10px] text-gray-500">Prova em</span>
                  <span className={`text-[13px] font-black tabular-nums ${urgency}`}>{daysLeft}d</span>
                </div>
              ) : (
                <button onClick={() => setAjustes(true)}
                  className="flex-1 text-left text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
                  + definir data da prova
                </button>
              )}
              <div className="flex items-center gap-1 shrink-0" title="Ofensiva atual">
                <Flame size={13} className={streakCurrent > 0 ? "text-orange-400" : "text-gray-600"} />
                <span className="text-[11px] font-black text-gray-300 tabular-nums">{streakCurrent}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </aside>
  );
}
