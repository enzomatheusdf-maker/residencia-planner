// src/components/Primitives.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Info, X } from "lucide-react";
import { isOverdue, isDueToday, isDueSoon, fmtDate } from "../core/fsrs";

export function stepState(r) {
  if (!r) return "future";
  if (r.done)              return "done";
  if (isOverdue(r.date))   return "overdue";
  if (isDueToday(r.date))  return "today";
  if (isDueSoon(r.date))   return "soon";
  return "future";
}

export const STATE_DOT = { 
  done: "bg-emerald-500",   
  overdue: "bg-red-400",   
  today: "bg-violet-400",   
  soon: "bg-blue-400",   
  future: "bg-white/10" 
};

export const STATE_TW  = { 
  done: "text-emerald-400", 
  overdue: "text-red-400", 
  today: "text-violet-400", 
  soon: "text-blue-400", 
  future: "text-gray-600" 
};

export function Badge({ color, children }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border"
      style={{ background: color + "22", color, borderColor: color + "44" }}>
      {children}
    </span>
  );
}

export function SBadge({ S, nextDate }) {
  return (
    <span title={`Estabilidade: ${Math.round(S||1)}d — próxima revisão ${fmtDate(nextDate)}`}
      className="text-[9px] font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded">
      S:{Math.round(S||1)}d
    </span>
  );
}

export function MedRevLogo({ collapsed = false, showTagline = false, size = "md" }) {
  const iconSizes = { sm: "w-7 h-7", md: "w-9 h-9", lg: "w-12 h-12" };
  const textSizes = { sm: "text-[13px]", md: "text-[15px]", lg: "text-[20px]" };
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-[60%] h-[60%]">
          <rect x="9" y="2" width="6" height="20" rx="2" fill="white" opacity="0.95"/>
          <rect x="2" y="9" width="20" height="6" rx="2" fill="white" opacity="0.95"/>
          <polyline points="15,13 18,10 21,12" stroke="rgba(255,180,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="18" cy="10" r="1" fill="rgba(255,200,255,0.9)"/>
        </svg>
      </div>
      {!collapsed && (
        <div>
          <p className={`${textSizes[size]} font-black tracking-tight leading-none`}>
            <span className="text-white">Med</span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Rev</span>
          </p>
          {showTagline && <p className="text-[8px] text-gray-500 tracking-[0.18em] font-semibold mt-1 uppercase">Medicina · Revisão · Performance</p>}
        </div>
      )}
    </div>
  );
}

export function Btn({ onClick, variant = "primary", disabled, children, className = "" }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold text-[13px] px-4 py-2 transition-all active:scale-95 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100";
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-lg shadow-purple-900/30",
    ghost:   "bg-white/8 hover:bg-white/10 text-gray-300 border border-white/10",
    danger:  "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-colors ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-colors resize-none ${className}`}
      {...props}
    />
  );
}

export function Select({ children, className = "", ...props }) {
  return (
    <select
      className={`w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white outline-none focus:border-violet-500 cursor-pointer ${className}`}
      {...props}>
      {children}
    </select>
  );
}

export function Field({ label, info, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="block text-[11px] text-gray-500 font-semibold tracking-wide uppercase">{label}</label>
        {info && <InfoTooltip texto={info} />}
      </div>
      {children}
    </div>
  );
}

export function InfoTooltip({ texto }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        className="text-gray-700 hover:text-violet-400 transition-colors focus:outline-none"
      >
        <Info size={13} />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-[#1a1a1e] border border-white/15 rounded-xl p-3 text-[11px] text-gray-300 shadow-2xl z-[60] leading-relaxed pointer-events-none">
          {texto}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a1e] border-r border-b border-white/15 rotate-45 -mt-[5px]" />
        </div>
      )}
    </div>
  );
}

export function Modal({ children, onClose, wide = false }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div
        className={`bg-[#111113] border border-white/10 rounded-2xl p-6 w-full ${wide ? "max-w-xl" : "max-w-sm"} max-h-[92vh] flex flex-col gap-4 animate-slide-up overflow-y-auto relative`}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

export function Toast({ toast, onUndo, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);
  if (!toast) return null;
  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#111113] border border-white/10 rounded-2xl px-5 py-3 shadow-2xl shadow-black/80 min-w-[260px] max-w-sm animate-fade-up">
      <span className="text-[13px] text-gray-100 flex-1">{toast.msg}</span>
      {toast.undo && (
        <button onClick={onUndo} className="text-violet-400 font-bold text-[12px] hover:text-violet-300 shrink-0 transition-colors">
          Desfazer
        </button>
      )}
      <button onClick={onDismiss} className="text-gray-600 hover:text-gray-300 transition-colors shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

export function ConfettiOverlay() {
  const pieces = useMemo(() => {
    const colors = ["#ec4899", "#a855f7", "#8b5cf6", "#fb923c", "#fbbf24", "#34d399"];
    return Array.from({ length: 20 }, () => ({
      id: Math.random(),
      left: Math.random() * 100,
      delay: Math.random() * 0.2,
      duration: 2.5 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      swayAmount: -20 + Math.random() * 40,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards, confetti-sway ${p.duration * 0.6}s ease-in-out ${p.delay}s forwards`,
            "--sway-amount": `${p.swayAmount}px`,
          }}
        />
      ))}
    </div>
  );
}
