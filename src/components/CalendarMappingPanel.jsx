import React, { useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import { matchMedcofTopic } from "../core/calendarProvider";

export default function CalendarMappingPanel({ importedTopics = [], medcofTemas = [] }) {
  const [showAll, setShowAll] = useState(false);
  const mapped = useMemo(() => {
    return importedTopics.map((topic) => {
      const { best, score } = matchMedcofTopic(topic.temaOriginal, medcofTemas);
      const status = score >= 0.6 ? "mapeado" : "pendente";
      return {
        topic: topic.temaOriginal,
        semana: topic.semana || "Sem semana",
        best: best?.nome || null,
        score,
        status,
      };
    });
  }, [importedTopics, medcofTemas]);
  const mappedCount = mapped.filter((row) => row.status === "mapeado").length;
  const pendingCount = mapped.length - mappedCount;
  const visibleRows = showAll ? mapped : mapped.slice(0, 8);

  if (!importedTopics.length) return null;

  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-3.5 space-y-2 text-left">
      <div className="flex items-center gap-2">
        <Link2 size={14} className="text-blue-400" />
        <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-200">Mapeamento para MEDCOF</h4>
      </div>
      <p className="text-[10px] text-gray-500">
        O mapeamento melhora integração com ENAMED, casos clínicos e recomendações do Mentor.
      </p>
      <p className="text-[10px] text-gray-400">
        {importedTopics.length} tópicos importados · {mappedCount} mapeados · {pendingCount} pendentes
      </p>
      <ul className="space-y-1.5 text-[11px]">
        {visibleRows.map((row) => (
          <li key={row.topic} className="text-gray-300">
            {row.semana} · {row.topic} {"→"} {row.best || "sem match automático"} {row.best ? ` (${Math.round(row.score * 100)}%)` : ""}
          </li>
        ))}
      </ul>
      {mapped.length > 8 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-[10px] font-bold text-blue-300 hover:text-blue-200"
        >
          {showAll ? "Ver resumo" : "Ver todos"}
        </button>
      )}
    </div>
  );
}
