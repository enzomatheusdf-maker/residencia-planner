// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Calendar, BarChart3, FileText, Target, Zap,
  ChevronRight, Info, Settings, LogOut
} from "lucide-react";
import { useStore } from "../core/store";
import { diffDays, todayStr } from "../core/fsrs";
import { MedRevLogo } from "./Primitives";

export const NAV = [
  { k: "dash",  icon: LayoutDashboard, label: "Dashboard"     },
  { k: "crono", icon: Calendar,        label: "Cronograma"     },
  { k: "banco", icon: BarChart3,       label: "Banco de Dados" },
  { k: "stats", icon: FileText,        label: "Estatísticas"   },
  { k: "sims",  icon: Target,          label: "Simulados"      },
  { k: "anki",  icon: Zap,             label: "Anki Audit"     }
];

export default function Sidebar({ view, setView, setAjustes, overdueCount, setHelpModal, usuarioLogado, onLogout }) {
  const { plat, setPlat, meta, focusMode } = useStore();
  const [collapsed, setCollapsed] = useState(false);

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
          return (
            <button key={n.k} onClick={() => setView(n.k)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all text-left group ${isActive ? "bg-gradient-to-r from-purple-600/20 to-pink-500/10 text-white border border-purple-500/20" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"}`}>
              <Icon size={18} className={`shrink-0 transition-colors ${isActive ? "text-purple-400" : "group-hover:text-gray-300"}`} />
              {!collapsed && <span className="text-[12.5px] font-medium truncate flex-1">{n.label}</span>}
              {!collapsed && isActive && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />}
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

        {/* User Profile Card */}
        {usuarioLogado && (
          <div className={`mt-2 pt-2 border-t border-white/5 flex items-center gap-2.5 ${collapsed ? "justify-center" : "px-2.5 py-1.5"}`}>
            {/* Avatar / Iniciais */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center font-bold text-white text-xs shrink-0 select-none shadow-md shadow-purple-950/50">
              {(usuarioLogado.displayName || usuarioLogado.email || "US").substring(0, 2).toUpperCase()}
            </div>
            
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] font-bold text-gray-200 truncate leading-tight">
                  {usuarioLogado.displayName || usuarioLogado.email?.split("@")[0]}
                </p>
                <p className="text-[9.5px] text-gray-500 truncate leading-none mt-0.5">
                  {usuarioLogado.email}
                </p>
              </div>
            )}
            
            <button
              onClick={onLogout}
              title="Sair da conta"
              className={`p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ${collapsed ? "" : "shrink-0"}`}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
