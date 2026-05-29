// src/components/CronogramaVestHub.jsx
import React, { useState } from "react";
import Cronograma from "./Cronograma";
import CronogramaVest from "./CronogramaVest";
import { BookOpen, Calendar } from "lucide-react";
import { Tabs } from "./Primitives";
import { CATALOGO_VEST } from "../constants/catalogos";

export default function CronogramaVestHub({ onStep, onEdit, onIniciarTema }) {
  const [subView, setSubView] = useState("catalogo"); // "catalogo" | "semanal"

  const tabs = [
    { k: "catalogo", label: "Catálogo de Matérias", icon: BookOpen },
    { k: "semanal", label: "Grade Semanal Planejada", icon: Calendar }
  ];

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in">
      {/* Sub-navegação interna (Tabs) */}
      <div>
        <Tabs items={tabs} active={subView} onChange={setSubView} />
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
