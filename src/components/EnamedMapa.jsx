// src/components/EnamedMapa.jsx
import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle, Flame, Target, TrendingUp } from "lucide-react";
import { useStore } from "../core/store";
import { ESP_COLORS } from "../core/fsrs";
import { getEnamedAction, getEnamedIntel, calcPreparoEnamed } from "../core/enamedIntel";
import { InfoTooltip } from "./Primitives";

function statusClass(status) {
  if (status === "critica") return "border-red-500/25 bg-red-500/10 text-red-300";
  if (status === "atencao") return "border-amber-500/25 bg-amber-500/10 text-amber-300";
  if (status === "ok") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  return "border-white/10 bg-white/[0.03] text-gray-400";
}

function statusLabel(status) {
  if (status === "critica") return "crítico";
  if (status === "atencao") return "atenção";
  if (status === "ok") return "manter";
  return "coletando";
}

export default function EnamedMapa({ compact = false, onFocar }) {
  const plat = useStore((s) => s.plat);
  const temas = useStore((s) => s[plat]?.temas || []);

  const intel = useMemo(() => getEnamedIntel(temas), [temas]);
  const preparo = useMemo(() => calcPreparoEnamed(temas), [temas]);
  const action = useMemo(() => getEnamedAction(intel), [intel]);

  if (plat !== "res") return null;

  const handleFocar = () => {
    if (onFocar) onFocar(action.area || intel.gargalo?.area || null);
  };

  return (
    <section className="bg-[#111113] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Target size={15} className="text-blue-400" /> Mapa ENAMED
            <InfoTooltip texto="Mapa de preparo por macroárea RES. O gap combina peso da prova, cobertura e retenção para sugerir onde você tende a ganhar mais por hora de estudo." />
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">
            Performance profunda: cobertura, retenção e tópicos quentes por área.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-right">
            <p className="text-[9px] uppercase font-black tracking-wider text-blue-300">Preparo ENAMED</p>
            <p className="text-xl font-black text-blue-100 tabular-nums">
              {preparo == null ? "coletando" : `${preparo}%`}
            </p>
          </div>
        </div>
      </div>

      {intel.gargalo && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={17} className="text-red-300 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-red-100">{action.title}</p>
              <p className="text-[11px] text-red-100/70 mt-0.5">{action.detail}</p>
            </div>
          </div>
          {onFocar && (
            <button
              type="button"
              onClick={handleFocar}
              className="shrink-0 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] border-none cursor-pointer transition-colors"
            >
              Abrir cronograma
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {intel.lista.map((item) => {
          const color = ESP_COLORS[item.area] || "#60a5fa";
          return (
            <div key={item.area} className="rounded-xl border border-white/5 bg-black/25 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[12px] font-black text-gray-100">{item.area}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusClass(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 tabular-nums">
                  gap {item.gap}%
                </span>
              </div>

              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.gap}%`, backgroundColor: color }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="rounded-lg bg-white/[0.03] p-2">
                  <p className="text-[9px] text-gray-500 uppercase font-bold">Cobertura</p>
                  <p className="text-[13px] font-black text-gray-100 tabular-nums">{item.cobertura}%</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-2">
                  <p className="text-[9px] text-gray-500 uppercase font-bold">Retenção</p>
                  <p className="text-[13px] font-black text-gray-100 tabular-nums">{item.retencao == null ? "—" : `${item.retencao}%`}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-2">
                  <p className="text-[9px] text-gray-500 uppercase font-bold">Temas</p>
                  <p className="text-[13px] font-black text-gray-100 tabular-nums">{item.iniciados}/{item.total}</p>
                </div>
              </div>

              {!compact && (
                <div className="mt-3 space-y-1.5">
                  {item.hotTopicsPendentes?.length > 0 && (
                    <p className="text-[10.5px] text-gray-500 flex items-start gap-1.5 flex-wrap">
                      <Flame size={12} className="text-amber-400 mt-0.5 shrink-0" />
                      <span>
                        Próximos tópicos quentes: {item.hotTopicsPendentes.map((h) => `${h.subarea} (${h.pct}%)`).join(" · ")}
                      </span>
                    </p>
                  )}
                  {item.hotTopicsCobertos?.length > 0 && (
                    <p className="text-[10.5px] text-gray-600 flex items-start gap-1.5 flex-wrap">
                      <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>
                        Já cobertos: {item.hotTopicsCobertos.slice(0, 3).map((h) => h.subarea).join(" · ")}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!compact && (
        <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3 flex items-start gap-2">
          <TrendingUp size={14} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Leitura: o maior gap não significa “pior matéria” isoladamente. Ele indica maior retorno provável por hora estudada, combinando peso de prova, baixa cobertura e/ou baixa retenção.
          </p>
        </div>
      )}
    </section>
  );
}
