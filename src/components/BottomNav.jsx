// src/components/BottomNav.jsx
import React from "react";
import { NAV } from "./Sidebar";

export default function BottomNav({ view, setView, overdueCount }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#07070f]/95 backdrop-blur-md border-t border-white/5 z-40 flex items-stretch justify-around pt-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}>
      {NAV.map((n) => {
        const Icon = n.icon;
        const isActive = view === n.k;
        return (
          <button key={n.k} onClick={() => setView(n.k)} className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${isActive ? "text-purple-400" : "text-gray-600"}`}>
            <Icon size={21} />
            <span className="text-[9px] font-semibold">{n.label.split(" ")[0]}</span>
          </button>
        );
      })}
    </nav>
  );
}
