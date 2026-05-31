import React from "react";
import { CalendarDays, UploadCloud } from "lucide-react";
import { CALENDAR_PROVIDERS, CALENDAR_PROVIDER_IDS } from "../constants/calendarProviders";

export default function CalendarProviderSelector({
  activeId,
  importedCount = 0,
  onChange,
  onOpenImport,
}) {
  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-3.5 space-y-3 text-left">
      <div className="flex items-center gap-2">
        <CalendarDays size={14} className="text-blue-400" />
        <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-200">Provider de calendário</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {CALENDAR_PROVIDERS.map((provider) => {
          const isActive = provider.id === activeId;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onChange(provider.id)}
              className={`text-left rounded-xl border px-3 py-2 transition-all ${
                isActive
                  ? "border-blue-500/40 bg-blue-500/10"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <p className={`text-[11px] font-bold ${isActive ? "text-blue-300" : "text-gray-200"}`}>{provider.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{provider.description}</p>
            </button>
          );
        })}
      </div>

      {activeId === CALENDAR_PROVIDER_IDS.USER_IMPORTED && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] text-gray-400">
            {importedCount > 0
              ? `${importedCount} tópico(s) importado(s) pelo usuário.`
              : "Nenhum cronograma importado ainda."}
          </p>
          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-300 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg px-2.5 py-1.5"
          >
            <UploadCloud size={12} />
            Importar
          </button>
        </div>
      )}
    </div>
  );
}

