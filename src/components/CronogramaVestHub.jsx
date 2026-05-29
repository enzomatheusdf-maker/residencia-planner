// src/components/CronogramaVestHub.jsx
import React, { useState } from "react";
import Cronograma from "./Cronograma";
import CronogramaVest from "./CronogramaVest";
import { CATALOGO_VEST } from "../constants/catalogos";
import { BookOpen, Calendar } from "lucide-react";

export default function CronogramaVestHub({ onStep, onEdit, onIniciarTema }) {
  const [subView, setSubView] = useState("catalogo"); // "catalogo" | "semanal"

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in">
      {/* Sub-navegação interna (Tabs) */}
      <div className="flex border-b border-white/5 pb-1 gap-2">
        <button
          type="button"
          onClick={() => setSubView("catalogo")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] font-bold transition-all relative ${
            subView === "catalogo"
              ? "text-violet-400 bg-white/[0.03] border border-white/5"
              : "text-gray-400 hover:text-white bg-transparent border border-transparent"
          }`}
        >
          <BookOpen size={14} />
          <span>Catálogo de Matérias</span>
        </button>
        <button
          type="button"
          onClick={() => setSubView("semanal")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] font-bold transition-all relative ${
            subView === "semanal"
              ? "text-violet-400 bg-white/[0.03] border border-white/5"
              : "text-gray-400 hover:text-white bg-transparent border border-transparent"
          }`}
        >
          <Calendar size={14} />
          <span>Grade Semanal Planejada</span>
        </button>
      </div>

      <div className="min-h-[400px]">
        {subView === "catalogo" ? (
          <Cronograma
            onStep={onStep}
            onEdit={onEdit}
            onIniciarTema={onIniciarTema}
            catalogo={CATALOGO_VEST}
          />
        ) : (
          <CronogramaVest onStudy={onStep} onEdit={onEdit} onIniciarTema={onIniciarTema} />
        )}
      </div>
    </div>
  );
}
