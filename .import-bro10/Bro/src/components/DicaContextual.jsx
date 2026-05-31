import React, { useMemo } from "react";
import { X, Lightbulb, ChevronRight } from "lucide-react";
import { useStore } from "../core/store";
import { CONCEITOS_METODO } from "../constants/metodo";
import { getReadinessData } from "../core/readiness";

export default function DicaContextual({ onNavigateToAcademia }) {
  const { meta, setMeta, plat } = useStore();
  const temas = useStore((s) => s[plat]?.temas || []);
  const simulados = useStore((s) => s[plat]?.simulados || []);

  const activeTip = useMemo(() => {
    const vistas = meta?.dicasVistas || [];
    
    // 1. Sem temas cadastrados -> Sugerir Pré-teste
    if (temas.length === 0) {
      if (!vistas.includes("pretest")) {
        return CONCEITOS_METODO.find(c => c.id === "pretest");
      }
    }

    // 2. Erro dominante de descuido -> Sugerir Questões e Diagnóstico
    const readiness = getReadinessData({ temas, simulados, meta, plat });
    if (readiness.dominantError === "descuido") {
      if (!vistas.includes("questoes")) {
        return CONCEITOS_METODO.find(c => c.id === "questoes");
      }
    }

    // 3. Temas em progresso mas sem Anki revisado -> Sugerir Flashcards
    const hasActiveTemas = temas.some(t => !t.unstarted);
    if (hasActiveTemas) {
      if (!vistas.includes("anki")) {
        return CONCEITOS_METODO.find(c => c.id === "anki");
      }
      if (!vistas.includes("braindump")) {
        return CONCEITOS_METODO.find(c => c.id === "braindump");
      }
      if (!vistas.includes("leitura")) {
        return CONCEITOS_METODO.find(c => c.id === "leitura");
      }
    }

    // Fallback: qualquer dica não vista
    return CONCEITOS_METODO.find(c => !vistas.includes(c.id));
  }, [temas, simulados, meta, plat]);

  const handleDismiss = () => {
    if (!activeTip) return;
    const vistas = meta?.dicasVistas || [];
    setMeta({
      ...meta,
      dicasVistas: [...vistas, activeTip.id]
    });
  };

  if (!activeTip) return null;

  return (
    <div className="medrev-card medrev-card-hover min-h-[132px] p-5 flex items-start gap-3.5 relative overflow-hidden select-none text-left animate-fade-in">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent pointer-events-none" />
      
      <div className="w-9 h-9 rounded-lg bg-blue-600/15 text-blue-400 flex items-center justify-center shrink-0">
        <Lightbulb size={16} />
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">Dica do Método</span>
          <span className="text-xs">{activeTip.icone}</span>
          <h4 className="text-xs font-black text-gray-100 uppercase tracking-wide">{activeTip.titulo}</h4>
        </div>
        <p className="text-[11.5px] text-gray-300 leading-relaxed font-medium">
          {activeTip.l1}
        </p>
        
        {onNavigateToAcademia && (
          <button
            type="button"
            onClick={onNavigateToAcademia}
            className="mt-2.5 flex items-center gap-0.5 text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider border-none bg-transparent cursor-pointer p-0"
          >
            Acessar Academia do Método
            <ChevronRight size={10} className="mt-0.5" />
          </button>
        )}
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
