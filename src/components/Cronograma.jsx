// src/components/Cronograma.jsx
import React, { useState } from "react";
import { Edit2, Plus, Play, ChevronDown } from "lucide-react";
import { useStore } from "../core/store";
import { ESP_COLORS, STEPS, IMPORTANCIA, DEMO_TEMA_ID } from "../core/fsrs";
import { CATALOGO_RES, CATALOGO_VEST, parseCatalogEntry } from "../constants/catalogos";
import { stepState, STATE_DOT, STATE_TW, Badge, SBadge, Btn, Input, TourBalloon } from "./Primitives";

export function CronoCard({ tema, onStep, onEdit, onIniciarTema }) {
  const esp     = ESP_COLORS[tema.esp] || "#94a3b8";
  const allDone = STEPS.every((s) => tema.rev[s.key].done);
  const next    = STEPS.find((s) => !tema.rev[s.key].done);
  const nextState = next ? stepState(tema.rev[next.key]) : "done";
  const imp     = IMPORTANCIA[tema.importancia || "ALTA"];

  const stepsWithData = STEPS.map(s => tema.rev[s.key]).filter(r => r && r.done && r.confianca != null && r.acerto != null);
  const hasVies = stepsWithData.length >= 2 && (() => {
    const avgConf = stepsWithData.reduce((acc, r) => acc + r.confianca, 0) / stepsWithData.length;
    const avgAcc = stepsWithData.reduce((acc, r) => acc + r.acerto, 0) / stepsWithData.length;
    return (avgConf * 20 - avgAcc * 100) > 15;
  })();

  return (
    <div
      className={`bg-[#111113] border rounded-3xl overflow-hidden transition-all text-left ${
        hasVies 
          ? "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
          : "border-white/5"
      } ${allDone ? "opacity-50" : "hover:border-white/10 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]"}`}
      style={{ borderLeft: `4px solid ${esp}` }}
      onClick={() => next && onStep(tema.id, next.key)}>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500 truncate">{tema.esp}</p>
              {imp && <Badge color={imp.color}>{imp.label}</Badge>}
              {next && <SBadge S={tema.rev[next.key]?.S} nextDate={tema.rev[next.key]?.date} />}
              {hasVies && (
                <span 
                  className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded font-medium flex items-center gap-1 group relative cursor-help"
                  onClick={(e) => e.stopPropagation()}
                >
                  ⚠️ Viés Metacognitivo
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#1a1a1e] border border-amber-500/30 text-[10px] text-gray-300 rounded-xl p-2 font-normal leading-normal opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[99] shadow-xl shadow-black/50 text-center">
                    Sua confiança declarada está muito acima do acerto real nesta especialidade. Seja mais autocrítico ao marcar seu nível de segurança.
                    <span className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a1e] border-r border-b border-amber-500/30 rotate-45 -mt-[5px]" />
                  </span>
                </span>
              )}
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

export default function Cronograma({ onStep, onEdit, onIniciarTema, catalogo }) {
  const { plat, tourStep, setTourStep } = useStore();
  const temas = useStore((s) => s[plat].temas);
  const cat = catalogo || (plat === "vest" ? CATALOGO_VEST : CATALOGO_RES);
  const [q, setQ]         = useState("");
  const [filter, setFilter] = useState("todos");
  const [impFilter, setImpFilter] = useState("TODAS");
  const [openBlocks, setOpenBlocks] = useState({ 1: true });
  const [expandedTopics, setExpandedTopics] = useState({});

  const toggleTopic = (topicName) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicName]: !prev[topicName]
    }));
  };

  const toggleBlock = (blockId) => {
    setOpenBlocks((prev) => ({
      ...prev,
      [blockId]: !prev[blockId],
    }));
  };

  const temaMap = new Map(temas.map((t) => [t.nome, t]));

  return (
    <div className="flex flex-col gap-5 animate-fade-up text-left">
      {tourStep === "crono" && (
        <div className="bg-[#111113] border border-violet-500/30 rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden" style={{ borderLeft: "4px solid #a78bfa" }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] px-2 py-0.5 rounded bg-violet-500/15 text-violet-400">
                {plat === "vest" ? "Matemática" : "Cirurgia"}
              </span>
              <Badge color="#ec4899">Alta</Badge>
            </div>
            <h3 className="text-lg font-semibold text-gray-100 leading-tight">
              {plat === "vest" ? "Funções e Gráficos [DEMO]" : "Apendicite Aguda [DEMO]"}
            </h3>
          </div>
          <p className="text-[11px] text-gray-400 italic">
            Tema demonstrativo de onboarding do Mentor.
          </p>
          <button
            type="button"
            onClick={() => {
              setTourStep("focus");
              onStep(DEMO_TEMA_ID(plat), "d0");
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-[12px] font-bold text-white flex items-center justify-center gap-1.5"
          >
            <Play size={13} /> Iniciar Ciclo de Estudos
          </button>
        </div>
      )}

      {tourStep === "crono" && (
        <TourBalloon
          text={plat === "vest"
            ? "Mentor: Este é o Cronograma. Cada card é um tema com ciclos D0→D21. Clique em 'Iniciar Ciclo de Estudos' no tema de Funções e Gráficos para eu mostrar como funciona o Modo Foco."
            : "Mentor: Este é o Cronograma. Cada card é um tema com ciclos D0→D21. Clique em 'Iniciar Ciclo de Estudos' no tema de Apendicite para eu mostrar como funciona o Modo Foco."
          }
          nextLabel="Iniciar Ciclo"
          onNext={() => {
            setTourStep("focus");
            onStep(DEMO_TEMA_ID(plat), "d0");
          }}
        />
      )}

      {tourStep !== "crono" && (
        <>
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

          {cat.map((bl) => {
            const blTemas = bl.t.filter((entry) => {
              const { nome, esp, prio, subs } = parseCatalogEntry(entry);
              const nameMatches = !q || nome.toLowerCase().includes(q.toLowerCase());
              const subMatches = !q || subs.some(s => s.toLowerCase().includes(q.toLowerCase()));
              if (!nameMatches && !subMatches) return false;
              
              const mTema = temaMap.get(nome);
              const currentImp = mTema ? mTema.importancia : "ALTA";
              if (impFilter !== "TODAS" && currentImp !== impFilter) return false;

              const hasSubs = subs.length > 0;
              if (hasSubs) {
                const activeSubsCount = subs.filter(sub => {
                  const subTema = temas.find(t => t.parentTopic === nome && (t.nome === `${nome} — ${sub}` || t.nome === sub));
                  return subTema && !subTema.unstarted;
                }).length;
                if (filter === "iniciados" && activeSubsCount === 0) return false;
                if (filter === "nao" && activeSubsCount === subs.length) return false;
              } else {
                const ativo = temaMap.has(nome) && !temaMap.get(nome).unstarted;
                if (filter === "iniciados" && !ativo) return false;
                if (filter === "nao" && ativo) return false;
              }
              return true;
            });
            if (blTemas.length === 0) return null;

            const isOpen = !!openBlocks[bl.b];

            return (
              <div key={bl.b} className="border border-white/5 bg-[#111113]/25 rounded-3xl p-4 transition-all">
                <button
                  type="button"
                  onClick={() => toggleBlock(bl.b)}
                  className="w-full flex items-center justify-between text-left select-none outline-none group py-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 rounded-full bg-violet-600 group-hover:bg-pink-500 transition-colors" />
                    <h3 className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                      {bl.nome || `Bloco ${bl.b}`}
                    </h3>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 group-hover:text-white transition-all duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {blTemas.map((entry) => {
                      const { nome: topNome, esp, prio: topPrio, subs } = parseCatalogEntry(entry);
                      const hasSubs = subs.length > 0;

                      if (hasSubs) {
                        const activeSubsCount = subs.filter(sub => {
                          const subTema = temas.find(t => t.parentTopic === topNome && (t.nome === `${topNome} — ${sub}` || t.nome === sub));
                          return subTema && !subTema.unstarted;
                        }).length;

                        return (
                          <div key={topNome} className="bg-[#111113] border border-white/5 rounded-3xl overflow-hidden transition-all text-left">
                            <div
                              className="p-5 flex flex-col gap-3 cursor-pointer hover:bg-white/[0.01]"
                              onClick={() => toggleTopic(topNome)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <span className="text-[10px] uppercase tracking-[0.25em] text-gray-500">{esp}</span>
                                  <h3 className="text-base font-semibold text-gray-100 mt-1">{topNome}</h3>
                                </div>
                                <ChevronDown
                                  size={18}
                                  className={`text-gray-400 transition-transform ${expandedTopics[topNome] ? "rotate-180" : ""}`}
                                />
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-violet-600 rounded-full transition-all"
                                    style={{ width: `${(activeSubsCount / subs.length) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10.5px] font-bold text-gray-500 whitespace-nowrap">
                                  {activeSubsCount}/{subs.length} subtópicos
                                </span>
                              </div>
                            </div>

                            {expandedTopics[topNome] && (
                              <div className="border-t border-white/5 bg-black/20 divide-y divide-white/5">
                                {subs.map((sub) => {
                                  const subName = `${topNome} — ${sub}`;
                                  const subTema = temas.find(t => t.parentTopic === topNome && (t.nome === subName || t.nome === sub) || t.nome === subName);
                                  const isStarted = subTema && !subTema.unstarted;

                                  if (isStarted) {
                                    const allDone = STEPS.every((s) => subTema.rev[s.key].done);
                                    const next = STEPS.find((s) => !subTema.rev[s.key].done);
                                    const nextState = next ? stepState(subTema.rev[next.key]) : "done";

                                    return (
                                      <div key={sub} className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.01] transition-colors">
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-semibold text-gray-200">{sub}</p>
                                          <div className="flex items-center gap-3 mt-2">
                                            <div className="flex gap-1 max-w-[120px] flex-1">
                                              {STEPS.map((s) => (
                                                <div
                                                  key={s.key}
                                                  title={`${s.label} · ${s.desc}`}
                                                  className={`h-1.5 rounded-full flex-1 ${subTema.rev[s.key].done ? "bg-emerald-500" : STATE_DOT[stepState(subTema.rev[s.key])]}`}
                                                />
                                              ))}
                                            </div>
                                            <span className={`text-[9.5px] font-bold ${STATE_TW[nextState]}`}>
                                              RO: {next ? next.label : "Fixado"}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => onEdit(subTema)}
                                            className="w-7 h-7 rounded-lg border border-white/5 bg-black hover:border-white/10 transition-colors flex items-center justify-center cursor-pointer"
                                          >
                                            <Edit2 size={12} className="text-gray-500 hover:text-white" />
                                          </button>
                                          {next && (
                                            <button
                                              type="button"
                                              onClick={() => onStep(subTema.id, next.key)}
                                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                                            >
                                              <Play size={10} fill="white" /> Estudar
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div key={sub} className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.01] transition-colors">
                                      <p className="text-xs font-medium text-gray-400 min-w-0 flex-1">{sub}</p>
                                      <button
                                        type="button"
                                        onClick={() => onIniciarTema(subTema || { nome: subName, esp, prio: topPrio, parentTopic: topNome })}
                                        className="px-2.5 py-1.5 rounded-lg bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white text-[10px] font-black transition-all border border-violet-500/10 shrink-0 cursor-pointer"
                                      >
                                        Iniciar FSRS
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      const tema = temaMap.get(topNome);
                      if (tema && !tema.unstarted) return <CronoCard key={topNome} tema={tema} onStep={onStep} onEdit={onEdit} onIniciarTema={onIniciarTema} />;

                      const espC  = ESP_COLORS[esp] || "#94a3b8";
                      const currentPrio = tema ? tema.prio : topPrio;
                      const currentImp = tema ? tema.importancia : "ALTA";

                      return (
                        <div
                          key={topNome}
                          onClick={() => onEdit(tema || { nome: topNome, esp, prio: currentPrio, importancia: currentImp, obs: `${bl.nome || "MEDCOF Bloco " + bl.b}`, unstarted: true })}
                          className="bg-[#111113]/60 hover:bg-[#111113]/80 hover:border-white/10 cursor-pointer rounded-3xl p-5 flex flex-col gap-4 border border-white/5 border-dashed transition-all"
                          style={{ borderLeft: `4px dashed ${espC}` }}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">{esp}</p>
                              {tema && <span className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5 font-medium">Personalizado</span>}
                              {IMPORTANCIA[currentImp] && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${IMPORTANCIA[currentImp].color}15`, color: IMPORTANCIA[currentImp].color, border: `1px solid ${IMPORTANCIA[currentImp].color}25` }}>
                                  {IMPORTANCIA[currentImp].label}
                                </span>
                              )}
                            </div>
                            <p className="text-[14px] font-semibold text-gray-300 line-clamp-2 mt-1.5">{topNome}</p>
                            {tema && (
                              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-gray-500 font-medium">
                                <span>Prioridade: <strong className="text-gray-400">{currentPrio}</strong></span>
                                {tema.obs && <span className="truncate max-w-[120px]">· {tema.obs}</span>}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onIniciarTema(tema || { nome: topNome, esp, prio: currentPrio, importancia: currentImp, obs: `${bl.nome || "MEDCOF Bloco " + bl.b}` });
                            }}
                            className="w-full py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-violet-600/20 text-[12px] font-bold text-violet-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Play size={13} /> Iniciar Ciclo Hoje
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
