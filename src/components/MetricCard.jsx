// src/components/MetricCard.jsx
// Card padrao para exibir uma metrica do registry com:
//   valor, status de confianca, descricao curta, acao recomendada.
import React from "react";
import { AlertTriangle, Info, TrendingUp, TrendingDown } from "lucide-react";
import { METRIC_STATUS } from "../core/metricsRegistry";
import { Badge, Card } from "./ui";

const STATUS_STYLE = {
  [METRIC_STATUS.COLLECTING]: {
    badge: "bg-gray-700/60 text-gray-400 border-gray-600/30",
    tone: "neutral",
    label: "Coletando",
    icon: Info,
    valueColor: "text-gray-500",
  },
  [METRIC_STATUS.LOW_CONFIDENCE]: {
    badge: "bg-yellow-900/30 text-yellow-400 border-yellow-600/20",
    tone: "amber",
    label: "Baixa amostra",
    icon: Info,
    valueColor: "text-yellow-400",
  },
  [METRIC_STATUS.OK]: {
    badge: "bg-emerald-900/30 text-emerald-400 border-emerald-600/20",
    tone: "green",
    label: "OK",
    icon: null,
    valueColor: "text-emerald-400",
  },
  [METRIC_STATUS.WARNING]: {
    badge: "bg-amber-900/30 text-amber-400 border-amber-600/20",
    tone: "amber",
    label: "Atencao",
    icon: AlertTriangle,
    valueColor: "text-amber-400",
  },
  [METRIC_STATUS.CRITICAL]: {
    badge: "bg-red-900/30 text-red-400 border-red-600/20",
    tone: "red",
    label: "Critico",
    icon: AlertTriangle,
    valueColor: "text-red-400",
  },
};

/**
 * MetricCard
 *
 * Props:
 *   label       string          nome da metrica
 *   value       string          valor ja formatado (use formatMetricValue)
 *   status      METRIC_STATUS   define a cor/badge
 *   description string          descricao curta do que mede
 *   emptyState  string          texto quando coletando
 *   action      string|null     acao recomendada quando ruim
 *   trend       number|null     delta numerico (+5/-3) para sparkline textual
 *   className   string          classes extras
 */
export default function MetricCard({
  label,
  value,
  status = METRIC_STATUS.COLLECTING,
  description,
  emptyState,
  action,
  trend,
  className = "",
}) {
  const style = STATUS_STYLE[status] || STATUS_STYLE[METRIC_STATUS.COLLECTING];
  const StatusIcon = style.icon;
  const isCollecting = status === METRIC_STATUS.COLLECTING || status === METRIC_STATUS.LOW_CONFIDENCE;

  return (
    <Card
      className={`flex min-h-[100px] flex-col justify-between gap-2 ${className}`}
      style={{ padding: 16, background: "var(--med-surface-0)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] text-gray-500 uppercase font-semibold leading-tight flex-1">{label}</p>
        <Badge tone={style.tone} className="shrink-0">
          {StatusIcon && <StatusIcon size={9} />}
          {style.label}
        </Badge>
      </div>

      {/* Valor */}
      <div className="flex items-baseline gap-2">
        <p className={`text-2xl font-black tabular-nums leading-none ${style.valueColor}`}>
          {isCollecting ? "—" : value}
        </p>
        {trend != null && !isCollecting && (
          <span
            className={`text-[10px] font-bold flex items-center gap-0.5 ${
              trend > 0 ? "text-emerald-400" : trend < 0 ? "text-red-400" : "text-gray-500"
            }`}
          >
            {trend > 0 ? <TrendingUp size={11} /> : trend < 0 ? <TrendingDown size={11} /> : null}
            {trend > 0 ? `+${trend}` : trend}
          </span>
        )}
      </div>

      {/* Descricao / estado vazio */}
      {isCollecting ? (
        <p className="text-[10px] text-gray-500 leading-relaxed">
          {status === METRIC_STATUS.LOW_CONFIDENCE
            ? `Amostra insuficiente — ${description}`
            : emptyState}
        </p>
      ) : description ? (
        <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-2">{description}</p>
      ) : null}

      {/* Acao recomendada */}
      {action && !isCollecting && (
        <p className={`text-[10px] leading-relaxed border-t border-white/5 pt-1.5 mt-0.5 ${style.valueColor} opacity-80`}>
          {action}
        </p>
      )}
    </Card>
  );
}
