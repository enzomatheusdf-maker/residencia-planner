import React from "react";
import { CalendarDays, UploadCloud, CheckCircle2, BookOpen, Layers, Wrench } from "lucide-react";
import { CALENDAR_PROVIDERS, CALENDAR_PROVIDER_IDS } from "../constants/calendarProviders";

const PROVIDER_ICONS = {
  [CALENDAR_PROVIDER_IDS.MEDCOF]: BookOpen,
  [CALENDAR_PROVIDER_IDS.USER_IMPORTED]: UploadCloud,
  [CALENDAR_PROVIDER_IDS.CUSTOM]: Wrench,
};

export default function CalendarProviderSelector({
  activeId,
  importedCount = 0,
  onChange,
  onOpenImport,
  planos = [],
  selectedPlanId,
  onPlanChange,
}) {
  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-[#0d0e14] to-[#0d0e14] p-4 space-y-4 text-left shadow-lg shadow-blue-950/20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
          <CalendarDays size={13} className="text-blue-400" />
        </div>
        <h4 className="text-[11px] font-black uppercase tracking-wider text-blue-100">
          Provider de Calendário
        </h4>
      </div>

      {/* Provider options */}
      <div className="grid grid-cols-3 gap-2">
        {CALENDAR_PROVIDERS.map((provider) => {
          const isActive = provider.id === activeId;
          const Icon = PROVIDER_ICONS[provider.id] || Layers;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onChange(provider.id)}
              className={`relative text-left rounded-xl border px-3 py-2.5 transition-all group ${
                isActive
                  ? "border-blue-500/50 bg-blue-500/15 shadow-inner shadow-blue-900/30"
                  : "border-white/8 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15"
              }`}
            >
              {isActive && (
                <CheckCircle2
                  size={11}
                  className="absolute top-2 right-2 text-blue-400"
                />
              )}
              <Icon
                size={14}
                className={`mb-1.5 ${isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-400"}`}
              />
              <p className={`text-[10.5px] font-bold leading-tight ${isActive ? "text-blue-200" : "text-gray-300"}`}>
                {provider.label}
              </p>
              <p className={`text-[9px] mt-0.5 leading-snug ${isActive ? "text-blue-400/70" : "text-gray-600"}`}>
                {provider.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Sub-selection: MEDCOF plans */}
      {activeId === CALENDAR_PROVIDER_IDS.MEDCOF && planos.length > 1 && (
        <div className="space-y-1.5 pt-0.5">
          <p className="text-[9.5px] text-gray-500 font-bold uppercase tracking-wider">Plano ativo</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {planos.map((p) => {
              const isSel = p.id === selectedPlanId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPlanChange && onPlanChange(p.id)}
                  className={`text-left rounded-xl border px-3 py-2.5 transition-all ${
                    isSel
                      ? "border-indigo-500/40 bg-indigo-500/10"
                      : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-[10.5px] font-bold truncate ${isSel ? "text-indigo-200" : "text-gray-300"}`}>
                      {p.nome}
                    </p>
                    <span className={`text-[9px] font-mono shrink-0 ${isSel ? "text-indigo-400" : "text-gray-600"}`}>
                      {p.blocos}b
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-600 leading-snug truncate">{p.descricao}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-section: Import (Estratégia MED) */}
      {activeId === CALENDAR_PROVIDER_IDS.USER_IMPORTED && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/8 bg-black/25 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${importedCount > 0 ? "bg-emerald-400" : "bg-gray-600"}`} />
            <p className="text-[10px] text-gray-400 truncate">
              {importedCount > 0
                ? `${importedCount} tópico(s) importado(s)`
                : "Nenhum cronograma importado ainda."}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-300 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg px-2.5 py-1.5 shrink-0"
          >
            <UploadCloud size={11} />
            Importar
          </button>
        </div>
      )}
    </div>
  );
}
