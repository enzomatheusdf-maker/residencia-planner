import React, { useMemo, useState } from "react";
import { CheckCircle2, FileJson, FileText } from "lucide-react";
import { Modal, Btn, Tabs } from "./Primitives";
import { parseCalendarImport } from "../core/calendarProvider";

const TABS = [
  { k: "text", label: "Texto", icon: FileText },
  { k: "json", label: "JSON", icon: FileJson },
];

export default function CalendarImportWizard({ onClose, onSave }) {
  const [tab, setTab] = useState("text");
  const [raw, setRaw] = useState("");

  const previewResult = useMemo(() => {
    if (!raw.trim()) return { items: [], error: "" };
    try {
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

  return (
    <Modal onClose={onClose} wide>
      <div className="space-y-4 text-left">
        <div>
          <h3 className="text-sm font-black text-white">Importar calendário do usuário</h3>
          <p className="text-[11px] text-gray-500 mt-1">
            Cole texto exportado ou JSON. Este conteúdo fica como `user_import`, não como cronograma oficial.
          </p>
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} />

        <textarea
          rows={8}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={
            tab === "text"
              ? "Ex: Semana 8\nCARDIOLOGIA\nInsuficiência Cardíaca (Parte 2): Tratamento\nCIRURGIA\nAbdome Agudo Inflamatório - Apendicite Aguda"
              : '[{"semana":"Semana 1","ordem":1,"areaOriginal":"CARDIOLOGIA","temaOriginal":"Hipertensão Arterial Sistêmica"}]'
          }
          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white placeholder-gray-600 outline-none focus:border-blue-500 resize-y"
        />

        {error && <p className="text-[11px] text-red-400">{error}</p>}

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

        <div className="flex gap-2">
          <Btn variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Btn>
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
