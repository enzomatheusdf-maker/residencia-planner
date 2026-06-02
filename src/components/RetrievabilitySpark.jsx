import React, { useMemo } from "react";
import { todayStr, addDays, diffDays, FSRS_FACTOR, FSRS_DECAY, STEPS, S_BASE } from "../core/fsrs";
import { getDominioPrevioStatus } from "../core/domainValidation";

function clampRetention(value) {
  return Math.max(0.01, Math.min(1, value));
}

function getDominioInitialRetention(dominioStatus) {
  const raw = Number(dominioStatus?.acerto);
  if (!Number.isFinite(raw)) return null;
  return clampRetention(raw > 1 ? raw / 100 : raw);
}

function getDominioHorizonDays(dominioStatus, today) {
  const fromDate = dominioStatus?.validatedAt || today;
  const toDate = dominioStatus?.firstReviewDate;
  if (toDate) {
    return Math.max(1, diffDays(fromDate, toDate));
  }
  return dominioStatus?.firstReviewStep === "d14" ? 14 : 7;
}

function normalizeAcerto(acerto) {
  if (acerto == null) return null;
  const value = Number(acerto);
  if (!Number.isFinite(value)) return null;
  return clampRetention(value > 1 ? value / 100 : value);
}

function emptyRetentionCurve(days = 14) {
  return Array.from({ length: days }, () => 0);
}

export default function RetrievabilitySpark({ tema }) {
  const dominioStatus = getDominioPrevioStatus(tema);
  const awaitingFirstDominioReview = dominioStatus.isValidated
    && dominioStatus.firstReviewStep
    && !tema?.rev?.[dominioStatus.firstReviewStep]?.done;

  const curve = useMemo(() => {
    if (awaitingFirstDominioReview) {
      const today = todayStr();
      const horizonDays = getDominioHorizonDays(dominioStatus, today);
      const initialRetention = getDominioInitialRetention(dominioStatus);
      if (initialRetention == null) return [];

      const currentS = horizonDays;
      const points = [];
      for (let i = 0; i <= horizonDays; i++) {
        const targetDate = addDays(today, i);
        const t = Math.max(0, diffDays(today, targetDate));
        const modeled = (1 + FSRS_FACTOR * t / currentS) ** FSRS_DECAY;
        points.push(Math.round(clampRetention(initialRetention * modeled) * 100));
      }
      return points;
    }
    if (!tema) {
      return [];
    }
    if (tema.unstarted) {
      return emptyRetentionCurve();
    }

    const today = todayStr();
    
    // Encontrar último evento de revisão e estabilidade atual
    let lastReviewDate = tema.d0 || today;
    let currentS = 1.0;

    const activeStepKey = STEPS.find(s => !tema.rev[s.key]?.done)?.key || "manutencao";

    if (activeStepKey === "d0") {
      const d0Acerto = normalizeAcerto(tema.rev?.d0?.acerto);
      if (d0Acerto == null) return emptyRetentionCurve();
      return Array.from({ length: 14 }, (_, i) => {
        const targetDate = addDays(today, i);
        const t = Math.max(0, diffDays(tema.rev?.d0?.reviewedAt || tema.rev?.d0?.date || today, targetDate));
        const modeled = (1 + FSRS_FACTOR * t / (tema.rev?.d0?.S || S_BASE.d0 || 1)) ** FSRS_DECAY;
        return Math.round(clampRetention(d0Acerto * modeled) * 100);
      });
    }

    // Encontrar o último passo concluído
    let latestDoneStepIdx = -1;
    for (let i = STEPS.length - 1; i >= 0; i--) {
      const review = tema.rev[STEPS[i].key];
      if (review?.done && !review?.skipped && review?.skipReason !== "dominio_previo" && !review?.skippeadoPorDominio) {
        latestDoneStepIdx = i;
        break;
      }
    }

    if (latestDoneStepIdx >= 0) {
      const key = STEPS[latestDoneStepIdx].key;
      lastReviewDate = tema.rev[key]?.date || tema.d0 || today;
      currentS = tema.rev[key]?.S || S_BASE[key] || 1.0;
    } else {
      return emptyRetentionCurve();
    }

    if (activeStepKey === "manutencao" && tema.rev.manutencao) {
      currentS = tema.rev.manutencao.S || 45.0;
      lastReviewDate = tema.rev.d21?.date || tema.d0 || today;
    }

    const points = [];
    const latestDoneStep = latestDoneStepIdx >= 0 ? tema.rev[STEPS[latestDoneStepIdx].key] : null;
    const initialRetention = normalizeAcerto(latestDoneStep?.acerto) ?? 1;
    for (let i = 0; i < 14; i++) {
      const targetDate = addDays(today, i);
      const t = Math.max(0, diffDays(lastReviewDate, targetDate));
      const R = (1 + FSRS_FACTOR * t / currentS) ** FSRS_DECAY;
      points.push(Math.round(clampRetention(initialRetention * R) * 100));
    }
    return points;
  }, [tema, awaitingFirstDominioReview, dominioStatus]);

  const sparklineData = useMemo(() => {
    if (curve.length < 2) return { path: "", fillPath: "", color: "#10b981", finalVal: null, finalY: 8 };
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
    const isUnmeasured = curve.every((value) => value === 0);
    let color = isUnmeasured ? "#64748b" : "#10b981"; // cinza sem medida, verde excelente
    let gradientId = `grad-${tema?.id || "default"}`;
    if (!isUnmeasured && finalVal < 65) {
      color = "#ef4444"; // vermelho (esquecimento crítico)
    } else if (!isUnmeasured && finalVal < 85) {
      color = "#3b82f6"; // azul (necessita atenção)
    }

    return { path, fillPath, color, finalVal, gradientId, finalY: coords[coords.length - 1]?.y ?? 8, isUnmeasured };
  }, [curve, tema?.id]);

  if (!tema) return null;
  if (curve.length < 2 || sparklineData.finalVal == null) return null;

  const horizonLabel = awaitingFirstDominioReview ? dominioStatus.firstReviewLabel : "D14";
  const isUnmeasured = sparklineData.isUnmeasured;
  const title = isUnmeasured
    ? "Retenção ainda não mensurada: conclua a primeira revisão para calibrar a curva."
    : `Retenção projetada até ${horizonLabel}. Hoje: ${curve[0]}% · ${horizonLabel}: ${sparklineData.finalVal}%`;

  return (
    <div className="flex items-center gap-1.5 select-none" title={title}>
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
            cy={sparklineData.finalY} 
            r="1.8" 
            fill={sparklineData.color} 
          />
        )}
      </svg>
      <span className={`text-[9px] font-bold font-mono shrink-0 ${
        isUnmeasured ? "text-slate-400" : sparklineData.finalVal >= 85 ? "text-emerald-400" : sparklineData.finalVal >= 65 ? "text-blue-400" : "text-red-400"
      }`}>
        {isUnmeasured ? "—" : `${sparklineData.finalVal}%`}
      </span>
    </div>
  );
}
