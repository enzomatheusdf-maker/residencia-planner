// src/components/DicaContextual.jsx
import React, { useMemo } from "react";
import { X, Lightbulb, ChevronRight } from "lucide-react";
import { useStore } from "../core/store";
import { CONCEITOS_METODO } from "../constants/metodo";
import { getReadinessData } from "../core/readiness";
import { todayStr } from "../core/fsrs";

export default function DicaContextual({ onNavigateToAcademia, onNavigate }) {
  const { meta, setMeta, plat } = useStore();
  const temas = useStore((s) => s[plat]?.temas || []);
  const simulados = useStore((s) => s[plat]?.simulados || []);

  const activeTip = useMemo(() => {
    const vistas = meta?.dicasVistas || [];
    const readiness = getReadinessData({ temas, simulados, meta, plat });

    // Priority rules — contextual hints first
    const contextualCandidates = [];

    // No temas → suggest pretest
    if (temas.length === 0 && !vistas.includes("pretest")) {
      contextualCandidates.push("pretest");
    }

    // Dominant error is descuido → questoes diagnosis
    if (readiness.dominantError === "descuido" && !vistas.includes("corrigir_questao")) {
      contextualCandidates.push("corrigir_questao");
    }
    if (readiness.dominantError === "descuido" && !vistas.includes("questoes")) {
      contextualCandidates.push("questoes");
    }

    // No simulados yet → suggest how to do one
    if (simulados.length === 0 && temas.some(t => !t.unstarted) && !vistas.includes("simulado")) {
      contextualCandidates.push("simulado");
    }

    // Many temas, no Anki pattern → suggest anki
    const hasActiveTemas = temas.some(t => !t.unstarted);
    if (hasActiveTemas && !vistas.includes("anki") && !meta?.ankiAdesao?.datas?.length) {
      contextualCandidates.push("anki");
    }

    // Overdue items → suggest atraso
    if (readiness.saldoRitmoNorm != null && readiness.saldoRitmoNorm < 30 && !vistas.includes("atraso")) {
      contextualCandidates.push("atraso");
    }

    // Check contextual candidates first
    for (const id of contextualCandidates) {
      const tip = CONCEITOS_METODO.find(c => c.id === id);
      if (tip && !vistas.includes(tip.id)) return tip;
    }

    // Rotate through all remaining unseen tips in a seeded-daily order
    // Seed by today's date so same tip shows all day (not random per render)
    const unseen = CONCEITOS_METODO.filter(c => !vistas.includes(c.id));
    if (unseen.length === 0) {
      // All tips seen — rotate by day index so user sees a different one each day
      const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
      return CONCEITOS_METODO[dayIndex % CONCEITOS_METODO.length];
    }

    // Pick unseen tip seeded by today so it stays stable during the day
    const today = todayStr();
    const dayHash = today.split("-").reduce((acc, n) => acc + parseInt(n, 10), 0);
    return unseen[dayHash % unseen.length];
  }, [temas, simulados, meta, plat]);

  const handleDismiss = () => {
    if (!activeTip) return;
    const vistas = meta?.dicasVistas || [];
    if (vistas.includes(activeTip.id)) return;
    setMeta({
      ...meta,
      dicasVistas: [...vistas, activeTip.id],
    });
  };

  const handleCta = () => {
    if (!activeTip?.ctaTarget) {
      onNavigateToAcademia?.();
      return;
    }
    if (activeTip.ctaTarget === "academia") {
      onNavigateToAcademia?.();
    } else {
      onNavigate?.(activeTip.ctaTarget);
    }
  };

  if (!activeTip) return null;

  return (
    <div className="bg-gradient-to-br from-blue-600/10 via-[#111113] to-sky-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3.5 relative overflow-hidden select-none text-left animate-fade-in shadow-md">
      <div className="absolute right-0 top-0 w-20 h-20 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />

      <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
        <Lightbulb size={16} />
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">Dica do Método</span>
          <h4 className="text-xs font-black text-gray-100 uppercase tracking-wide">{activeTip.titulo}</h4>
        </div>
        <p className="text-[11.5px] text-gray-300 leading-relaxed font-medium">
          {activeTip.l1}
        </p>

        <button
          type="button"
          onClick={handleCta}
          className="mt-2.5 flex items-center gap-0.5 text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider border-none bg-transparent cursor-pointer p-0"
        >
          {activeTip.ctaLabel || "Acessar Academia do Método"}
          <ChevronRight size={10} className="mt-0.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3.5 right-3.5 text-gray-600 hover:text-gray-400 transition-colors border-none bg-transparent cursor-pointer"
        title="Dispensar dica"
      >
        <X size={14} />
      </button>
    </div>
  );
}
