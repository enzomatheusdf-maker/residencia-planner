// src/components/CronogramaVestHub.jsx
import React, { useEffect, useState } from "react";
import Cronograma from "./Cronograma";
import CronogramaVest from "./CronogramaVest";
import { BookOpen, Calendar } from "lucide-react";
import { Tabs } from "./Primitives";
export default function CronogramaVestHub({ onStep, onEdit, onIniciarTema, initialSubView, onSubViewTargetConsumed }) {
  const [subView, setSubView] = useState("catalogo"); // "catalogo" | "semanal"

  useEffect(() => {
    if (!["catalogo", "semanal"].includes(initialSubView)) return;
    setSubView(initialSubView);
    if (onSubViewTargetConsumed) onSubViewTargetConsumed();
  }, [initialSubView, onSubViewTargetConsumed]);

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
          />
        ) : (
          <CronogramaVest onStudy={onStep} onEdit={onEdit} onIniciarTema={onIniciarTema} />
        )}
      </div>
    </div>
  );
}
