import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function readPersistedState(storageKey, fallback) {
  if (!storageKey || typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(storageKey);
  if (raw === null) return fallback;
  return raw === "1";
}

export default function AdvancedSection({
  title = "Painel avancado",
  defaultOpen = false,
  storageKey,
  children,
  className = "",
}) {
  const [open, setOpen] = useState(() => readPersistedState(storageKey, defaultOpen));

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, open ? "1" : "0");
  }, [open, storageKey]);

  return (
    <section className={`rounded-2xl border border-white/8 bg-black/20 ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left bg-transparent border-none cursor-pointer"
      >
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-black">Avancado</p>
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        <span className="text-gray-300">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </section>
  );
}
