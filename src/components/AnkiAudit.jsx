// src/components/AnkiAudit.jsx
import React, { useState } from "react";
import { Zap, Plus } from "lucide-react";
import { useStore } from "../core/store";
import { todayStr, fmtFull } from "../core/fsrs";
import { Btn, Input, Field, Modal, InfoTooltip } from "./Primitives";

export default function AnkiAudit() {
  const { plat, addAnki } = useStore();
  const ankiLog = useStore((s) => s[plat]?.ankiLog || []);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ data: todayStr(), revisados: "", again: "", novos: "" });
  const avgAgain = ankiLog.length
    ? Math.round(ankiLog.reduce((a, l) => a + (l.revisados ? l.again / l.revisados * 100 : 0), 0) / ankiLog.length)
    : null;

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-gray-400" />
          <h2 className="text-[15px] font-bold text-gray-100">Anki Audit</h2>
          <InfoTooltip texto='Mapeia o índice de retention do Anki. Manter a taxa de "Again" estritamente abaixo de 15% garante a calibração perfeita dos seus decks.' />
        </div>
        <Btn onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Registrar Sessão</Btn>
      </div>
      {ankiLog.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[["Cards Revisados", ankiLog.reduce((a, l) => a + (l.revisados || 0), 0).toLocaleString("pt-BR"), "text-violet-400"],
            ["Cards Novos", ankiLog.reduce((a, l) => a + (l.novos || 0), 0).toLocaleString("pt-BR"), "text-blue-400"],
            ["Média de Erros", avgAgain != null ? avgAgain + "%" : "—", avgAgain != null && avgAgain < 15 ? "text-emerald-400" : "text-yellow-400"]].map(([l, v, c]) => (
            <div key={l} className="bg-[#111113] border border-white/5 rounded-2xl p-4">
              <p className="text-[10.5px] text-gray-500 uppercase tracking-wider mb-2">{l}</p>
              <p className={`text-3xl font-black tabular-nums ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {ankiLog.length === 0 && (
          <div className="text-center py-16 text-gray-600 text-[13px]">Nenhuma auditoria de Anki gravada.</div>
        )}
        {[...ankiLog].reverse().map((l) => {
          const pct = l.revisados ? Math.round(l.again / l.revisados * 100) : 0;
          const col = pct < 15 ? "text-emerald-400" : pct < 30 ? "text-yellow-400" : "text-red-400";
          return (
            <div key={l.id} className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
              <span className="text-[12px] text-gray-500 shrink-0 w-20">{fmtFull(l.data)}</span>
              <div className="flex gap-5 flex-1">
                {[["Revisados", l.revisados, "text-violet-400"], ["Novos", l.novos || 0, "text-blue-400"], ["Again (Erros)", pct + "%", col]].map(([lbl, val, c]) => (
                  <div key={lbl} className="text-center">
                    <p className="text-[10px] text-gray-600 mb-0.5">{lbl}</p>
                    <p className={`text-[14px] font-bold tabular-nums ${c}`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <h2 className="text-[15px] font-bold text-gray-100">Auditar Estatísticas Anki</h2>
          <Field label="Data"><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Revisados"><Input type="number" value={f.revisados} onChange={(e) => setF({ ...f, revisados: +e.target.value })} /></Field>
            <Field label='"Again"'><Input type="number" value={f.again} onChange={(e) => setF({ ...f, again: +e.target.value })} /></Field>
            <Field label="Novos"><Input type="number" value={f.novos} onChange={(e) => setF({ ...f, novos: +e.target.value })} /></Field>
          </div>
          {f.revisados > 0 && (
            <p className="text-center text-2xl font-black text-violet-400 tabular-nums">
              {Math.round(f.again / f.revisados * 100)}% de Erro Real
            </p>
          )}
          <div className="flex gap-2">
            <Btn className="flex-1"
              onClick={() => { if (f.revisados) { addAnki(plat, f); setOpen(false); setF({ data: todayStr(), revisados: "", again: "", novos: "" }); } }}
              disabled={!f.revisados}>Gravar Histórico</Btn>
            <Btn variant="ghost" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
