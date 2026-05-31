import React, { useMemo } from "react";
import { todayStr, addDays, diffDays, FSRS_FACTOR, FSRS_DECAY, STEPS, S_BASE } from "../core/fsrs";

export default function RetrievabilitySpark({ tema }) {
  const curve = useMemo(() => {
    if (!tema || tema.unstarted) {
      return Array(14).fill(100);
    }

    const today = todayStr();
    
    // Encontrar último evento de revisão e estabilidade atual
    let lastReviewDate = tema.d0 || today;
    let currentS = 1.0;

    const activeStepKey = STEPS.find(s => !tema.rev[s.key]?.done)?.key || "manutencao";

    if (activeStepKey === "d0") {
      return Array(14).fill(100);
    }

    // Encontrar o último passo concluído
    let latestDoneStepIdx = -1;
    for (let i = STEPS.length - 1; i >= 0; i--) {
      if (tema.rev[STEPS[i].key]?.done) {
        latestDoneStepIdx = i;
        break;
      }
    }

    if (latestDoneStepIdx >= 0) {
      const key = STEPS[latestDoneStepIdx].key;
      lastReviewDate = tema.rev[key]?.date || tema.d0 || today;
      currentS = tema.rev[key]?.S || S_BASE[key] || 1.0;
    } else {
      lastReviewDate = tema.d0 || today;
      currentS = S_BASE.d0 || 1.0;
    }

    if (activeStepKey === "manutencao" && tema.rev.manutencao) {
      currentS = tema.rev.manutencao.S || 45.0;
      lastReviewDate = tema.rev.d21?.date || tema.d0 || today;
    }

    const points = [];
    for (let i = 0; i < 14; i++) {
      const targetDate = addDays(today, i);
      const t = Math.max(0, diffDays(lastReviewDate, targetDate));
      const R = (1 + FSRS_FACTOR * t / currentS) ** FSRS_DECAY;
      points.push(Math.round(R * 100));
    }
    return points;
  }, [tema]);

  const sparklineData = useMemo(() => {
    if (curve.length < 2) return { path: "", fillPath: "", color: "#10b981" };
    const width = 60;
    const height = 16;
    const padding = 1.5;
    const maxVal = 100;
    const minVal = 0;
    const dx = width / (curve.length - 1);

    const coords = curve.map((val, i) => {
      const x = i * dx;
      const y = height - padding - ((val - minVal) / (maxVal - minVal)) * (height - padding * 2);
      return { x, y };
    });

    const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
    const fillPath = `${path} L ${width.toFixed(1)} ${height.toFixed(1)} L 0 ${height.toFixed(1)} Z`;

    // Cor dinâmica com base na retentibilidade final (daqui a 14 dias)
    const finalVal = curve[curve.length - 1];
    let color = "#10b981"; // verde (excelente)
    let gradientId = `grad-${tema.id || "default"}`;
    if (finalVal < 65) {
      color = "#ef4444"; // vermelho (esquecimento crítico)
    } else if (finalVal < 85) {
      color = "#8b5cf6"; // violeta (necessita atenção)
    }

    return { path, fillPath, color, finalVal, gradientId };
  }, [curve, tema.id]);

  if (!tema || tema.unstarted) return null;

  return (
    <div className="flex items-center gap-1.5 select-none" title={`Retentibilidade FSRS projetada para 14 dias. Hoje: ${curve[0]}% · D14: ${sparklineData.finalVal}%`}>
      <svg width="60" height="16" className="overflow-visible">
        <defs>
          <linearGradient id={sparklineData.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sparklineData.color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={sparklineData.color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Preenchimento sob a curva */}
        <path d={sparklineData.fillPath} fill={`url(#${sparklineData.gradientId})`} />
        {/* Linha da curva */}
        <path d={sparklineData.path} fill="none" stroke={sparklineData.color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Ponto final */}
        {curve.length > 0 && (
          <circle 
            cx="60" 
            cy={sparklineData.path ? sparklineData.path.split(" ").slice(-2)[1] : 8} 
            r="1.8" 
            fill={sparklineData.color} 
          />
        )}
      </svg>
      <span className={`text-[9px] font-bold font-mono shrink-0 ${
        sparklineData.finalVal >= 85 ? "text-emerald-400" : sparklineData.finalVal >= 65 ? "text-violet-400" : "text-red-400"
      }`}>
        {sparklineData.finalVal}%
      </span>
    </div>
  );
}
