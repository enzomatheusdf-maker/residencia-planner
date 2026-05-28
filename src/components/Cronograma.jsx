// src/components/Cronograma.jsx
import React, { useState } from "react";
import { Edit2, Plus, Play } from "lucide-react";
import { useStore } from "../core/store";
import { ESP_COLORS, STEPS, IMPORTANCIA, MEDCOF } from "../core/fsrs";
import { stepState, STATE_DOT, STATE_TW, Badge, SBadge, Btn, Input } from "./Primitives";

export function CronoCard({ tema, onStep, onEdit, onIniciarTema }) {
  const esp     = ESP_COLORS[tema.esp] || "#94a3b8";
  const allDone = STEPS.every((s) => tema.rev[s.key].done);
  const next    = STEPS.find((s) => !tema.rev[s.key].done);
  const nextState = next ? stepState(tema.rev[next.key]) : "done";
  const imp     = IMPORTANCIA[tema.importancia || "ALTA"];

  return (
    <div
      className={`bg-[#111113] border border-white/5 rounded-3xl overflow-hidden transition-all text-left ${allDone ? "opacity-50" : "hover:border-white/10 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]"}`}
      style={{ borderLeft: `4px solid ${esp}` }}
      onClick={() => next && onStep(tema.id, next.key)}>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500 truncate">{tema.esp}</p>
              {imp && <Badge color={imp.color}>{imp.label}</Badge>}
              {next && <SBadge S={tema.rev[next.key]?.S} nextDate={tema.rev[next.key]?.date} />}
            </div>
            <p className="text-lg font-semibold text-gray-100 leading-tight line-clamp-2">{tema.nome}</p>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(tema); }}
            className="w-8 h-8 rounded-full border border-white/10 bg-black hover:border-white/30 transition-colors flex items-center justify-center shrink-0">
            <Edit2 size={14} className="text-gray-400 hover:text-white" />
          </button>
        </div>
        {tema.pico && (
          <p className="text-[11px] text-gray-400 italic leading-relaxed line-clamp-3 border-l-2 pl-3" style={{ borderColor: esp + "66" }}>
            {tema.pico}
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex gap-1.5">
            {STEPS.map((s) => {
              const st2 = stepState(tema.rev[s.key]);
              return <div key={s.key} title={`${s.label} · ${s.desc}`} className={`flex-1 h-2 rounded-full transition-all ${tema.rev[s.key].done ? "bg-emerald-500" : STATE_DOT[st2]}`} />;
            })}
          </div>
          <span className={`text-[11px] font-semibold ${STATE_TW[nextState]}`}>RO: {next ? next.label : "Fixação"}</span>
        </div>
      </div>
    </div>
  );
}

export default function Cronograma({ onStep, onEdit, onIniciarTema }) {
  const { plat } = useStore();
  const temas = useStore((s) => s[plat].temas);
  const [q, setQ]         = useState("");
  const [filter, setFilter] = useState("todos");
  const [impFilter, setImpFilter] = useState("TODAS");

  const temaMap = new Map(temas.map((t) => [t.nome, t]));

  return (
    <div className="flex flex-col gap-5 animate-fade-up text-left">
      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Buscar tema..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-[200px]" />
        <div className="flex gap-1 bg-[#111113] border border-white/5 rounded-xl p-1">
          {[["todos","Todos"],["iniciados","Iniciados"],["nao","Não iniciados"]].map(([v, l]) => (
            <button type="button" key={v} onClick={() => setFilter(v)} className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold ${filter === v ? "bg-violet-600 text-white" : "text-gray-500"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#111113] border border-white/5 rounded-xl p-1">
          {["TODAS", "CRITICA", "ALTA", "MEDIA"].map((imp) => (
            <button type="button" key={imp} onClick={() => setImpFilter(imp)} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${impFilter === imp ? "bg-white/10 text-white" : "text-gray-600"}`}>
              {imp === "TODAS" ? "Todas" : IMPORTANCIA[imp]?.icon}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Btn onClick={() => onEdit({})} className="text-[12px] gap-2"><Plus size={16} /> Novo tema</Btn>
      </div>

      {MEDCOF.map((bl) => {
        const blTemas = bl.t.filter(([nome, , , impEst]) => {
          if (q && !nome.toLowerCase().includes(q.toLowerCase())) return false;
          const mTema = temaMap.get(nome);
          const currentImp = mTema ? mTema.importancia : (impEst || "ALTA");
          if (impFilter !== "TODAS" && currentImp !== impFilter) return false;
          const ativo = temaMap.has(nome);
          if (filter === "iniciados" && !ativo) return false;
          if (filter === "nao" && ativo) return false;
          return true;
        });
        if (blTemas.length === 0) return null;

        return (
          <div key={bl.b} className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400">Bloco {bl.b}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {blTemas.map(([nome, esp, prio]) => {
                const tema = temaMap.get(nome);
                if (tema) return <CronoCard key={nome} tema={tema} onStep={onStep} onEdit={onEdit} onIniciarTema={onIniciarTema} />;

                const espC  = ESP_COLORS[esp] || "#94a3b8";
                return (
                  <div key={nome} className="bg-[#111113]/60 rounded-3xl p-5 flex flex-col gap-4 border border-white/5 border-dashed" style={{ borderLeft: `4px dashed ${espC}` }}>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-1">{esp}</p>
                      <p className="text-[14px] font-semibold text-gray-300 line-clamp-2">{nome}</p>
                    </div>
                    <button type="button" onClick={() => onIniciarTema({ nome, esp, prio, importancia: "ALTA", obs: `MEDCOF Bloco ${bl.b}` })}
                      className="w-full py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-violet-600/20 text-[12px] font-bold text-violet-400 flex items-center justify-center gap-1.5">
                      <Play size={13} /> Iniciar Ciclo Hoje
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
