// src/components/BancoDados.jsx
import React, { useState } from "react";
import { FileText } from "lucide-react";
import { useStore } from "../core/store";
import { STEPS, ESP_COLORS, IMPORTANCIA, isOverdue, isDueToday, fmtDate, fmtRelativo } from "../core/fsrs";
import { Btn, Input } from "./Primitives";

export default function BancoDados() {
  const { plat, modoSimples, toggleModoSimples } = useStore();
  const temas    = useStore((s) => s[plat]?.temas || []);
  const [sort, setSort] = useState("nome");
  const [q, setQ]       = useState("");
  const [filtro, setFiltro] = useState("todos");

  const rows = temas
    .filter((t) => !t.unstarted)
    .filter((t) => !q || t.nome.toLowerCase().includes(q.toLowerCase()))
    .filter((t) => {
      const done    = STEPS.filter((s) => t.rev[s.key].done);
      const doneN   = done.length;
      const rs      = done.filter((s) => t.rev[s.key].acerto != null);
      const acc     = rs.length ? Math.round(rs.reduce((a, s) => a + t.rev[s.key].acerto, 0) / rs.length * 100) : null;

      if (filtro === "baixo_acerto") return acc != null && acc < 60 && doneN > 0;
      if (filtro === "atrasados") return STEPS.some((s) => isOverdue(t.rev[s.key]?.date) && !t.rev[s.key]?.done);
      if (filtro === "nunca_revisados") return doneN === 0;
      return true;
    })
    .map((t) => {
      const done    = STEPS.filter((s) => t.rev[s.key].done);
      const questoes= done.reduce((a, s) => a + (t.rev[s.key].questoes || 0), 0);
      const rs      = done.filter((s) => t.rev[s.key].acerto != null);
      const acc     = rs.length ? Math.round(rs.reduce((a, s) => a + t.rev[s.key].acerto, 0) / rs.length * 100) : null;
      const next    = STEPS.find((s) => !t.rev[s.key].done);
      return { ...t, doneN: done.length, questoes, acc, nextStep: next?.key, nextDate: next ? t.rev[next.key].date : null };
    })
    .sort((a, b) => {
      if (sort === "nome") return a.nome.localeCompare(b.nome);
      if (sort === "acc")  return (b.acc ?? -1) - (a.acc ?? -1);
      if (sort === "q")    return b.questoes - a.questoes;
      if (sort === "prog") return b.doneN - a.doneN;
      return 0;
    });

  const exportCSV = () => {
    const h = ["Nome","Área","Progresso","Questões","Acerto%","Importância","Insight"];
    const d = rows.map((r) => [r.nome, r.esp, `${r.doneN}/${STEPS.length}`, r.questoes, r.acc ?? "", r.importancia || "ALTA", (r.reflexao?.texto || "").replace(/,/g," ")]);
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent([h, ...d].map((r) => r.join(",")).join("\n"));
    a.download = "reviewflow_v6.csv"; a.click();
  };

  const Th = ({ k, children }) => (
    <th onClick={() => setSort(k)}
      className={`px-4 py-3 text-left text-[10.5px] uppercase tracking-wider font-bold cursor-pointer select-none whitespace-nowrap border-b border-white/5 transition-colors ${sort === k ? "text-violet-400" : "text-gray-600 hover:text-gray-400"}`}>
      {children}{sort === k ? " ↓" : ""}
    </th>
  );

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-[220px]" />
        <span className="text-[12px] text-gray-600">{rows.length} temas integrados</span>
        <div className="flex-1" />
        <Btn variant="ghost" onClick={exportCSV} className="text-[12px] gap-2"><FileText size={16} /> Exportar CSV</Btn>
      </div>

      <div className="flex gap-1 flex-wrap">
        {[["todos","Todos"],["baixo_acerto","Acerto < 60%"],["atrasados","Atrasados"],["nunca_revisados","Não Iniciados"]].map(([v, l]) => (
          <button type="button" key={v} onClick={() => setFiltro(v)} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${filtro === v ? "bg-violet-600 text-white" : "text-gray-500 bg-white/5 hover:text-gray-300"}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-white/5">
              <tr><Th k="nome">Tema</Th><Th k="prog">Progresso</Th><Th k="q">Questões</Th><Th k="acc">Acerto</Th>
                <th className="px-4 py-3 text-left text-[10.5px] uppercase tracking-wider font-bold text-gray-600 border-b border-white/5">Próximo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const espC   = ESP_COLORS[r.esp] || "#94a3b8";
                const accCol = r.acc == null ? "text-gray-600" : r.acc >= 80 ? "text-emerald-400" : r.acc >= 55 ? "text-yellow-400" : "text-red-400";
                return (
                  <tr key={r.id} className={`border-b border-white/5/50 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[12.5px] font-semibold text-gray-200">{r.nome}</p>
                        <span className="text-[10px]">{IMPORTANCIA[r.importancia || "ALTA"]?.icon}</span>
                      </div>
                      <p className="text-[10.5px] font-bold mt-0.5" style={{ color: espC }}>{r.esp}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {STEPS.map((s) => (
                            <div key={s.key} className="w-2 h-2 rounded-full transition-colors"
                              style={{ background: r.rev[s.key].done ? espC : "#374151" }} title={s.label} />
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-600">{r.doneN}/{STEPS.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-gray-200">
                      {r.questoes > 0 ? r.questoes.toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.acc != null
                        ? <span className={`text-[12px] font-bold tabular-nums ${accCol}`}>{r.acc}%</span>
                        : <span className="text-gray-700 text-[12px]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.nextStep
                        ? <span className={`text-[11.5px] font-semibold ${isOverdue(r.nextDate) ? "text-red-400" : isDueToday(r.nextDate) ? "text-violet-400" : "text-gray-500"}`}>
                            {r.nextStep.toUpperCase()} · {fmtRelativo(r.nextDate)}
                          </span>
                        : <span className="text-[11px] font-bold text-emerald-400">✓ concluído</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {modoSimples && (
          <div className="flex gap-2 justify-center mt-6 pb-4">
            <button
              type="button"
              onClick={toggleModoSimples}
              className="px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 border border-violet-600/30 rounded-xl text-[12px] font-bold transition-all">
              ▼ Ver modo avançado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
