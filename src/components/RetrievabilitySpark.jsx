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

function isOperationalReview(review) {
  return review
    && typeof review === "object"
    && !Array.isArray(review)
    && !review.skipped
    && review.skipReason !== "dominio_previo"
    && !review.skippeadoPorDominio;
}

const REVIEW_STEPS = [
  { key: "d0", label: "D0" },
  { key: "d1", label: "D1" },
  { key: "d4", label: "D4" },
  { key: "d7", label: "D7" },
  { key: "d14", label: "D14" },
  { key: "d21", label: "D21" },
];

function getNextReviewStep(tema) {
  if (!tema?.rev) return null;
  for (const step of REVIEW_STEPS) {
    const review = tema.rev[step.key];
    if (isOperationalReview(review) && !review.done) {
      return { ...step, date: review.date };
    }
  }
  if (isOperationalReview(tema.rev.manutencao) && !tema.rev.manutencao.done) {
    return { key: "manutencao", label: "Manutenção", date: tema.rev.manutencao.date };
  }
  return null;
}

function buildRetentionCurve({ startDate, currentS, initialRetention, horizonDays }) {
  if (!startDate || initialRetention == null) return [];
  const today = todayStr();
  const pointCount = Math.max(2, horizonDays + 1);
  return Array.from({ length: pointCount }, (_, i) => {
    const dayOffset = horizonDays === 0 ? 0 : i;
    const targetDate = addDays(today, dayOffset);
    const t = Math.max(0, diffDays(startDate, targetDate));
    const modeled = (1 + FSRS_FACTOR * t / currentS) ** FSRS_DECAY;
    return Math.round(clampRetention(initialRetention * modeled) * 100);
  });
}

export default function RetrievabilitySpark({ tema }) {
  const dominioStatus = getDominioPrevioStatus(tema);
  const awaitingFirstDominioReview = dominioStatus.isValidated
    && dominioStatus.firstReviewStep
    && !tema?.rev?.[dominioStatus.firstReviewStep]?.done;
  const nextReviewStep = useMemo(() => getNextReviewStep(tema), [tema]);

  const curve = useMemo(() => {
    if (!tema || tema.unstarted) {
      return [];
    }

    if (awaitingFirstDominioReview) {
      const today = todayStr();
      const horizonDays = Math.max(0, diffDays(today, dominioStatus.firstReviewDate || addDays(today, getDominioHorizonDays(dominioStatus, today))));
      const initialRetention = getDominioInitialRetention(dominioStatus);
      if (initialRetention == null) return [];

      return buildRetentionCurve({
        startDate: dominioStatus.validatedAt || today,
        currentS: Math.max(1, getDominioHorizonDays(dominioStatus, today)),
        initialRetention,
        horizonDays,
      });
    }

    const today = todayStr();
    
    // Encontrar último evento de revisão e estabilidade atual
    let lastReviewDate = tema.d0 || today;
    let currentS = 1.0;

    const activeStepKey = nextReviewStep?.key;
    if (!activeStepKey) return [];

    // Encontrar o último passo concluído
    let latestDoneStepIdx = -1;
    for (let i = STEPS.length - 1; i >= 0; i--) {
      const review = tema.rev[STEPS[i].key];
      if (isOperationalReview(review) && review.done) {
        latestDoneStepIdx = i;
        break;
      }
    }

    if (latestDoneStepIdx >= 0) {
      const key = STEPS[latestDoneStepIdx].key;
      lastReviewDate = tema.rev[key]?.reviewedAt || tema.rev[key]?.completedAt || tema.rev[key]?.date || tema.d0 || today;
      currentS = tema.rev[key]?.S || S_BASE[key] || 1.0;
    } else {
      return [];
    }

    if (activeStepKey === "manutencao" && tema.rev.manutencao) {
      currentS = tema.rev.manutencao.S || 45.0;
      lastReviewDate = tema.rev.d21?.reviewedAt || tema.rev.d21?.completedAt || tema.rev.d21?.date || tema.d0 || today;
    }

    const latestDoneStep = latestDoneStepIdx >= 0 ? tema.rev[STEPS[latestDoneStepIdx].key] : null;
    const initialRetention = normalizeAcerto(latestDoneStep?.acerto) ?? 1;
    const horizonDays = Math.max(0, diffDays(today, nextReviewStep?.date || addDays(today, 14)));
    return buildRetentionCurve({
      startDate: lastReviewDate,
      currentS,
      initialRetention,
      horizonDays,
    });
  }, [tema, awaitingFirstDominioReview, dominioStatus, nextReviewStep]);

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

  const horizonLabel = awaitingFirstDominioReview
    ? dominioStatus.firstReviewLabel
    : (nextReviewStep?.label || "próxima revisão");
  const today = todayStr();
  let daysUntil = null;
  if (awaitingFirstDominioReview) {
    const firstDate = dominioStatus.firstReviewDate || addDays(today, getDominioHorizonDays(dominioStatus, today));
    daysUntil = Math.max(0, diffDays(today, firstDate));
  } else if (nextReviewStep?.date) {
    daysUntil = Math.max(0, diffDays(today, nextReviewStep.date));
  }
  const horizonLabelWithDays = daysUntil != null ? `${horizonLabel} (em ${daysUntil}d)` : horizonLabel;
  const isUnmeasured = sparklineData.isUnmeasured;
  const title = isUnmeasured
    ? "Retenção ainda não mensurada: conclua a primeira revisão para calibrar a curva."
    : `Retenção projetada até ${horizonLabelWithDays}. Hoje: ${curve[0]}% · ${horizonLabelWithDays}: ${sparklineData.finalVal}%`;

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
      {daysUntil != null && !isUnmeasured && (
        <span className="text-[9px] text-slate-300 font-mono ml-1 shrink-0">{`${daysUntil}d`}</span>
      )}
    </div>
  );
}
