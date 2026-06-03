// src/components/Primitives.jsx
import React, { useState, useEffect, useMemo, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import { isOverdue, isDueToday, isDueSoon, fmtDate } from "../core/fsrs";
import { useStore } from "../core/store";

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
  today: "bg-blue-400",   
  soon: "bg-blue-400",   
  future: "bg-white/10" 
};

export const STATE_TW  = { 
  done: "text-emerald-400", 
  overdue: "text-red-400", 
  today: "text-blue-400", 
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
      className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
      S:{Math.round(S||1)}d
    </span>
  );
}

export function MedRevLogo({ collapsed = false, showTagline = false, size = "md" }) {
  const iconSizes = { sm: "w-7 h-7", md: "w-9 h-9", lg: "w-12 h-12" };
  const textSizes = { sm: "text-[13px]", md: "text-[15px]", lg: "text-[20px]" };
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={process.env.PUBLIC_URL + "/logo192.png"}
        alt="MedRev"
        className={`${iconSizes[size]} rounded-xl shrink-0 object-contain`}
        draggable="false"
      />
      {!collapsed && (
        <div>
          <p className={`${textSizes[size]} font-black tracking-tight leading-none`}>
            <span className="text-white">Med</span>
            <span className="bg-gradient-to-r from-blue-400 to-sky-400 bg-clip-text text-transparent">Rev</span>
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
    primary: "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-900/30",
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
      className={`w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors resize-none ${className}`}
      {...props}
    />
  );
}

export function Select({ children, className = "", ...props }) {
  return (
    <select
      className={`w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white outline-none focus:border-blue-500 cursor-pointer ${className}`}
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

export function SmartTooltip({ content, children, preferred = "top" }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, placement: preferred });
  const anchorRef = useRef(null);
  const bubbleRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    if (!open || isMobile || !anchorRef.current || !bubbleRef.current) return;
    const a = anchorRef.current.getBoundingClientRect();
    const b = bubbleRef.current.getBoundingClientRect();
    const gap = 8;
    let top = a.top - b.height - gap;
    let placement = "top";
    if (top < 8) {
      top = a.bottom + gap;
      placement = "bottom";
    }
    let left = a.left + (a.width / 2) - (b.width / 2);
    left = Math.max(8, Math.min(left, window.innerWidth - b.width - 8));
    setPos({ top, left, placement });
  }, [isMobile, open, preferred]);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    if (!isMobile) {
      window.addEventListener("scroll", close, true);
    }
    window.addEventListener("resize", close);
    return () => {
      if (!isMobile) {
        window.removeEventListener("scroll", close, true);
      }
      window.removeEventListener("resize", close);
    };
  }, [isMobile, open]);

  return (
    <span ref={anchorRef} className="inline-flex items-center">
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {children}
      </span>
      {open && !isMobile &&
        createPortal(
          <div
            ref={bubbleRef}
            role="tooltip"
            className="fixed z-[700] max-w-[min(18rem,calc(100vw-1rem))] rounded-xl border border-white/15 bg-[#1a1a1e] px-3 py-2 text-[11px] leading-relaxed text-gray-200 shadow-2xl"
            style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
          >
            {content}
            <span
              className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a1e] border-white/15 rotate-45"
              style={pos.placement === "top"
                ? { top: "100%", marginTop: "-1px", borderRightWidth: "1px", borderBottomWidth: "1px" }
                : { bottom: "100%", marginBottom: "-1px", borderLeftWidth: "1px", borderTopWidth: "1px" }}
            />
          </div>,
          document.body
        )}
      {open && isMobile &&
        createPortal(
          <div className="fixed inset-0 z-[720] flex items-end justify-center bg-black/60 backdrop-blur-sm p-3" onClick={() => setOpen(false)}>
            <div
              role="dialog"
              aria-label="Detalhes"
              className="w-full max-w-md rounded-[1.4rem] border border-white/10 bg-[#141418] p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-300">Detalhe</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300"
                  aria-label="Fechar detalhe"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="text-[12px] leading-relaxed text-gray-200">{content}</div>
            </div>
          </div>,
          document.body
        )}
    </span>
  );
}

export function InfoTooltip({ texto }) {
  return (
    <SmartTooltip content={texto}>
      <button type="button" className="text-gray-700 hover:text-blue-400 transition-colors focus:outline-none">
        <Info size={13} />
      </button>
    </SmartTooltip>
  );
}

export function Modal({ children, onClose, wide = false }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}>
      <div
        className={`bg-[#111113] border border-white/10 rounded-2xl p-6 w-full my-auto ${wide ? "max-w-xl" : "max-w-sm"} max-h-[90dvh] flex flex-col gap-4 animate-slide-up overflow-y-auto relative`}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function Toast({ toast, onUndo, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, toast.ms || 5000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);
  if (!toast) return null;
  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#111113] border border-white/10 rounded-2xl px-5 py-3 shadow-2xl shadow-black/80 min-w-[260px] max-w-sm animate-fade-up">
      <span className="text-[13px] text-gray-100 flex-1">{toast.msg}</span>
      {toast.undo && (
        <button onClick={onUndo} className="text-blue-400 font-bold text-[12px] hover:text-blue-300 shrink-0 transition-colors">
          Desfazer
        </button>
      )}
      <button onClick={onDismiss} className="text-gray-600 hover:text-gray-300 transition-colors shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

export function ConfirmDialog({ open, title = "Confirmar ação", message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", danger = false, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[520] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="w-full max-w-sm bg-[#111113] border border-white/10 rounded-2xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-black text-white">{title}</h3>
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">{message}</p>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 text-xs font-bold"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-xl text-xs font-black border-none ${danger ? "bg-red-600 hover:bg-red-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
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

// ─── PROGRESSIVE TOOLTIP (USE STORE TO REGISTER VISTOS) ────────────────────────
export function ProgressiveTooltip({ tooltipId, text, children }) {
  const vistos = useStore((s) => s.vistos || []);
  const adicionarVisto = useStore((s) => s.adicionarVisto);
  const [open, setOpen] = useState(false);
  const wrapperRef = React.useRef(null);
  const [placement, setPlacement] = useState("center");

  const visto = vistos.includes(tooltipId);

  useEffect(() => {
    if (!visto) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [visto]);

  useEffect(() => {
    if (open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      if (rect.left < 150) {
        setPlacement("left");
      } else if (window.innerWidth - rect.right < 150) {
        setPlacement("right");
      } else {
        setPlacement("center");
      }
    }
  }, [open]);

  if (visto) return children;

  let bubbleClasses = "absolute bottom-full mb-2.5 w-[min(16rem,calc(100vw-2rem))] bg-gradient-to-br from-[#1b1035] to-[#0c0c14] border border-blue-500/35 rounded-xl p-3 shadow-2xl z-[200] animate-slide-up text-left ";
  let arrowClasses = "absolute top-full w-2.5 h-2.5 bg-[#0c0c14] border-r border-b border-blue-500/35 rotate-45 -mt-[6px] ";

  if (placement === "center") {
    bubbleClasses += "left-1/2 -translate-x-1/2";
    arrowClasses += "left-1/2 -translate-x-1/2";
  } else if (placement === "left") {
    bubbleClasses += "left-0 translate-x-0";
    arrowClasses += "left-6";
  } else {
    bubbleClasses += "right-0 translate-x-0";
    arrowClasses += "right-6";
  }

  return (
    <div ref={wrapperRef} className="relative inline-block w-full">
      {children}
      {open && (
        <div className={bubbleClasses}>
          <p className="text-[11px] leading-relaxed text-gray-200 font-semibold">{text}</p>
          <div className="flex justify-end mt-2 border-t border-white/5 pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                adicionarVisto(tooltipId);
                setOpen(false);
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[9.5px] font-black rounded-lg transition-all"
            >
              Entendido
            </button>
          </div>
          <div className={arrowClasses} />
        </div>
      )}
    </div>
  );
}

// ─── TOUR BALLOON (WALKTHROUGH POPUPS) ──────────────────────────────────────────
export function TourBalloon({ text, onNext, nextLabel = "Continuar →" }) {
  return createPortal(
    <div className="fixed inset-0 z-[800] bg-black/40 backdrop-blur-[1px] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-[min(24rem,calc(100vw-2rem))] bg-gradient-to-br from-[#12121e] to-[#0a0a0f] border border-blue-500/30 rounded-2xl p-5 shadow-2xl shadow-blue-900/10 animate-slide-up text-left relative overflow-hidden max-h-[85dvh] my-auto flex flex-col">
        <div className="absolute -right-8 -top-8 w-20 h-20 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2 shrink-0">
          <span className="text-base">🧠</span>
          <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">Mentor do MedRev</span>
        </div>
        
        <div className="text-[12.5px] text-gray-200 leading-relaxed font-semibold overflow-y-auto pr-1 flex-1">
          {text}
        </div>
        
        <div className="flex justify-end mt-4 shrink-0">
          <button
            onClick={onNext}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function playTick() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 1400;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // Ignore audio context blocks
  }
}

export function CheckmarkOverlay({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#05050d]/85 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in">
      <div className="bg-[#111113] border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 animate-scale-up shadow-2xl shadow-emerald-500/10">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" className="animate-draw-checkmark" />
          </svg>
        </div>
        <p className="text-xs font-black text-gray-200 uppercase tracking-widest">Etapa Concluída</p>
      </div>
    </div>
  );
}

export function Tabs({ items, active, onChange }) {
  return (
    <div className="flex bg-black/40 rounded-xl p-1 overflow-x-auto snap-x scrollbar-none gap-1 w-full">
      {items.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.k;
        return (
          <button
            key={t.k}
            type="button"
            onClick={() => onChange(t.k)}
            className={`flex-1 snap-start py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-900/25"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] bg-transparent border border-transparent"
            }`}
          >
            {Icon && <Icon size={14} className={isActive ? "text-white" : "text-gray-500"} />}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
