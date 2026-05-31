import React, { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, Lightbulb, GraduationCap } from "lucide-react";

export default function ConceitoCard({ conceito }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState("L1"); // "L1" | "L2" | "L3"

  const { titulo, icone, l1, l2, l3 } = conceito;

  return (
    <div 
      className={`border rounded-2xl transition-all duration-300 ${
        isOpen 
          ? "bg-[#111113]/90 border-violet-500/30 shadow-lg shadow-purple-950/20" 
          : "bg-[#111113]/40 border-white/5 hover:border-white/10 hover:bg-[#111113]/60"
      }`}
    >
      {/* Header clickable row */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left cursor-pointer border-none bg-transparent"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="text-2xl select-none" role="img" aria-label={titulo}>
            {icone}
          </span>
          <div className="min-w-0">
            <h4 className="text-[13.5px] font-black text-gray-100 tracking-wide uppercase">
              {titulo}
            </h4>
            <p className="text-[11px] text-gray-500 truncate mt-0.5 max-w-[280px] sm:max-w-[450px]">
              {l1}
            </p>
          </div>
        </div>
        <div className="text-gray-500 hover:text-gray-300 ml-2">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded Accordion Body */}
      {isOpen && (
        <div className="px-4 pb-5 pt-1 border-t border-white/5 space-y-4 animate-fade-in text-left">
          {/* Navigation/Progress tabs for Layers */}
          <div className="flex bg-black/40 border border-white/5 rounded-xl p-1 gap-1">
            {[
              { id: "L1", label: "L1 • O Quê?", icon: Lightbulb, color: "text-amber-400" },
              { id: "L2", label: "L2 • Como?", icon: GraduationCap, color: "text-violet-400" },
              { id: "L3", label: "L3 • Por Quê?", icon: BookOpen, color: "text-pink-400" }
            ].map(layer => {
              const Icon = layer.icon;
              const isActive = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => setActiveLayer(layer.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border-none cursor-pointer ${
                    isActive 
                      ? "bg-white/10 text-white shadow-sm" 
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
                  }`}
                >
                  <Icon size={12} className={isActive ? layer.color : "text-gray-500"} />
                  <span className="hidden sm:inline">{layer.label}</span>
                  <span className="sm:hidden">{layer.id}</span>
                </button>
              );
            })}
          </div>

          {/* Layer Contents */}
          <div className="min-h-[120px] transition-all duration-300">
            {activeLayer === "L1" && (
              <div className="space-y-2.5 animate-fade-in">
                <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl">
                  <Lightbulb className="text-amber-400 shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <p className="text-[12px] font-black text-white uppercase tracking-wider">O Conceito</p>
                    <p className="text-[12px] text-gray-300 leading-relaxed font-medium">
                      {l1}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 italic px-1">
                  💡 Clique na aba L2 para ver a instrução passo a passo de como aplicar na prática.
                </p>
              </div>
            )}

            {activeLayer === "L2" && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider pl-1">
                  Passo a Passo de Execução
                </p>
                <div className="space-y-2">
                  {l2.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white/[0.01] border border-white/5 p-3 rounded-xl hover:bg-white/[0.02] transition-all">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-600/20 text-violet-400 text-[10px] font-black shrink-0 mt-0.5 font-mono">
                        {idx + 1}
                      </span>
                      <p className="text-[11.5px] text-gray-300 leading-relaxed font-medium">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeLayer === "L3" && (
              <div className="space-y-2.5 animate-fade-in">
                <div className="flex items-start gap-2.5 bg-pink-500/5 border border-pink-500/10 p-3.5 rounded-xl">
                  <BookOpen className="text-pink-400 shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <p className="text-[12px] font-black text-white uppercase tracking-wider">Evidência Científica</p>
                    <p className="text-[12px] text-gray-300 leading-relaxed font-medium">
                      {l3}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 px-1 leading-normal">
                  📘 Métodos baseados em ciência cognitiva garantem maior fixação com menos tempo total de estudo do que resumos passivos ou releituras.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
