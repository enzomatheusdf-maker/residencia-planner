import React, { useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { Modal, Btn, Tabs } from "./Primitives";
import { getProviderSeed, parseCalendarImport } from "../core/calendarProvider";
import { CSV_TEMPLATE_EXAMPLE, CSV_TEMPLATE_HEADER, parseCalendarCsv } from "../core/calendarImportCsv";
import { CALENDAR_PROVIDER_IDS } from "../constants/calendarProviders";

const TABS = [
  { k: "text", label: "Texto", icon: FileText },
  { k: "csv", label: "CSV", icon: FileSpreadsheet },
  { k: "json", label: "JSON", icon: FileJson },
];

export default function CalendarImportWizard({ onClose, onSave }) {
  const [tab, setTab] = useState("text");
  const [raw, setRaw] = useState("");
  const fileInputRef = useRef(null);

  const previewResult = useMemo(() => {
    if (!raw.trim()) return { items: [], error: "" };
    try {
      if (tab === "csv") {
        const parsed = parseCalendarCsv(raw);
        return {
          items: parsed.topics,
          error: parsed.errors.length ? parsed.errors.map((e) => `Linha ${e.line}: ${e.message}`).join("\n") : "",
          skipped: parsed.skipped,
        };
      }
      return { items: parseCalendarImport(raw, tab), error: "" };
    } catch (_e) {
      return {
        items: [],
        error: "Não foi possível interpretar a importação. Revise o formato.",
      };
    }
  }, [raw, tab]);
  const preview = previewResult.items;
  const error = previewResult.error;

  function downloadCsvTemplate() {
    const blob = new Blob([CSV_TEMPLATE_EXAMPLE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-cronograma-medrev.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleCsvFile(file) {
    if (!file) return;
    file.text().then((text) => {
      setTab("csv");
      setRaw(text);
    });
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="space-y-4 text-left">
        <div>
          <h3 className="text-sm font-black text-white">Importar calendário do usuário</h3>
          <p className="text-[11px] text-gray-500 mt-1">
            Cole texto, carregue CSV ou use JSON. Este conteúdo fica como `user_import`, não como cronograma oficial.
          </p>
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} />

        {tab === "csv" && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-blue-100 border border-white/10 text-[11px] font-bold"
              >
                Upload .csv
              </button>
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-100 border border-blue-500/25 text-[11px] font-bold inline-flex items-center gap-1.5"
              >
                <Download size={12} /> Baixar modelo CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("csv");
                  setRaw(CSV_TEMPLATE_EXAMPLE);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-200 border border-emerald-500/25 text-[11px] font-bold"
              >
                Preencher exemplo
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleCsvFile(e.target.files?.[0])}
            />
            <div className="text-[11px] text-blue-100/80 space-y-2">
              <p>Se seu cronograma está em PDF, copie o texto e peça para uma IA converter para CSV no modelo MedRev.</p>
              <p className="rounded-lg bg-black/25 border border-white/10 p-2 font-mono text-[10px] text-blue-50">
                Transforme este cronograma em CSV com as colunas {CSV_TEMPLATE_HEADER}. Não invente temas. Se não houver data, deixe vazio.
              </p>
            </div>
          </div>
        )}

        <textarea
          rows={8}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={
            tab === "csv"
              ? CSV_TEMPLATE_EXAMPLE
              : tab === "text"
              ? "Ex: Semana 8\nCARDIOLOGIA\nInsuficiência Cardíaca (Parte 2): Tratamento\nCIRURGIA\nAbdome Agudo Inflamatório - Apendicite Aguda"
              : '[{"semana":"Semana 1","ordem":1,"areaOriginal":"CARDIOLOGIA","temaOriginal":"Hipertensão Arterial Sistêmica"}]'
          }
          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white placeholder-gray-600 outline-none focus:border-blue-500 resize-y"
        />

        {error && <p className="text-[11px] text-red-400 whitespace-pre-line">{error}</p>}

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] font-bold text-gray-300 mb-1.5">Preview ({preview.length})</p>
          {preview.length === 0 ? (
            <p className="text-[11px] text-gray-500">
              Sem itens para pré-visualizar. Para ver todos os temas do Estratégia, importe o texto completo do cronograma.
            </p>
          ) : (
            <ul className="max-h-40 overflow-y-auto pr-1 space-y-1 text-[11px]">
              {preview.slice(0, 12).map((item) => (
                <li key={item.id} className="text-gray-300">
                  {item.semana ? `${item.semana} · ` : ""}{item.dia ? `${item.dia} · ` : ""}{item.temaOriginal}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Btn variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Btn>
          <Btn
            variant="ghost"
            className="flex-1"
            onClick={() => onSave(getProviderSeed(CALENDAR_PROVIDER_IDS.USER_IMPORTED))}
          >
            Usar calendário de amostra
          </Btn>
          <Btn
            className="flex-1"
            disabled={preview.length === 0}
            onClick={() => onSave(preview)}
          >
            <CheckCircle2 size={14} /> Salvar cronograma importado
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
