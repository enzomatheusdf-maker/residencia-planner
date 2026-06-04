import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Tooltip({ content, children, label = "Detalhes", preferred = "top" }) {
  const [open, setOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0, placement: preferred });
  const anchorRef = useRef(null);
  const bubbleRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const sync = () => {
      if (!window.matchMedia) {
        setIsTouch(false);
        return;
      }
      setIsTouch(window.matchMedia("(hover: none), (max-width: 767px)").matches);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useLayoutEffect(() => {
    if (!open || isTouch || !anchorRef.current || !bubbleRef.current) return;
    const anchor = anchorRef.current.getBoundingClientRect();
    const bubble = bubbleRef.current.getBoundingClientRect();
    const gap = 10;
    let top = preferred === "bottom" ? anchor.bottom + gap : anchor.top - bubble.height - gap;
    let placement = preferred;
    if (top < 8) {
      top = anchor.bottom + gap;
      placement = "bottom";
    }
    if (top + bubble.height > window.innerHeight - 8) {
      top = anchor.top - bubble.height - gap;
      placement = "top";
    }
    const left = Math.max(8, Math.min(anchor.left + anchor.width / 2 - bubble.width / 2, window.innerWidth - bubble.width - 8));
    setPos({ left, top, placement });
  }, [isTouch, open, preferred]);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <span className="inline-flex" ref={anchorRef}>
      <span
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        onMouseEnter={() => !isTouch && setOpen(true)}
        onMouseLeave={() => !isTouch && setOpen(false)}
      >
        {children}
      </span>
      {open && !isTouch && createPortal(
        <div
          className="fixed z-[var(--med-z-tooltip)] max-w-[min(20rem,calc(100vw-1rem))] rounded-xl border border-white/15 bg-[#111827] px-3 py-2 text-[11px] leading-relaxed text-gray-100 shadow-2xl"
          ref={bubbleRef}
          role="tooltip"
          style={{ left: pos.left, top: pos.top }}
        >
          {content}
          <span
            className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-white/15 bg-[#111827]"
            style={pos.placement === "top"
              ? { top: "100%", marginTop: -4, borderRightWidth: 1, borderBottomWidth: 1 }
              : { bottom: "100%", marginBottom: -4, borderLeftWidth: 1, borderTopWidth: 1 }}
          />
        </div>,
        document.body
      )}
      {open && isTouch && createPortal(
        <div className="fixed inset-0 z-[var(--med-z-tooltip)] flex items-end bg-black/64 p-3 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="med-card w-full rounded-t-[var(--med-radius-xl)] p-4" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-wider text-blue-300">{label}</p>
              <button className="med-button-reset med-focus-ring grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-gray-300" onClick={() => setOpen(false)} type="button" aria-label="Fechar detalhe">
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
