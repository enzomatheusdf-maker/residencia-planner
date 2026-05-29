// src/components/Simulados.jsx
import React, { useState, useMemo } from "react";
import { Target, Plus, X, Trash2, ShieldAlert, Award, BarChart3 } from "lucide-react";
import { useStore } from "../core/store";
import { todayStr, fmtDate, fmtFull, ESPS_RES, ESPS_VEST } from "../core/fsrs";
import { calcMetricasElite, calcProjecao, migrarSim } from "../hooks/useMetrics";
import { Btn, Modal, Field, Input, Select, Tabs } from "./Primitives";

export function SimRegistroModal({ onClose, onSave, platKey }) {
  const [page, setPage] = useState(1);
  const esps = platKey === "res" ? ESPS_RES : ESPS_VEST;
  const [f, setF] = useState({ data: todayStr(), total: 100, acertos: "", tempoMin: "", ansiedade: "Normal", cansaco: "Normal" });
  
  // Controle de erros da página 2
  const [erradas, setErradas] = useState([]);
  const [newError, setNewError] = useState({ num: "", esp: esps[0], tipoErro: "lacuna", desc: "" });

  const addErrorToList = () => {
    if (!newError.num) return;
    setErradas([...erradas, { ...newError, id: Date.now(), corrigidaD7: null }]);
    setNewError({ num: "", esp: esps[0], tipoErro: "lacuna", desc: "" });
  };

  const handleSaveAll = () => {
    const pct = f.total > 0 ? Math.round((+f.acertos / +f.total) * 100) : 0;
    onSave({
      ...f,
      pct,
      questoesErradas: erradas,
      statusCorrecao: erradas.length > 0 ? "parcial" : "concluida"
    });
  };

  return (
    <Modal onClose={onClose} wide={page === 2}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[15px] font-bold text-white">Registrar Prática/Simulado (Pág {page}/2)</h2>
        <span className="text-[11px] text-gray-500 font-mono">V6 Analytics</span>
      </div>

      {page === 1 ? (
        <div className="flex flex-col gap-3">
          <Field label="Data de Realização"><Input type="date" value={f.data} onChange={e => setF({...f, data: e.target.value})} /></Field>
          
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Questões"><Input type="number" value={f.total} onChange={e => setF({...f, total: e.target.value === "" ? "" : +e.target.value})} /></Field>
            <Field label="Total Acertos"><Input type="number" value={f.acertos} onChange={e => setF({...f, acertos: e.target.value === "" ? "" : +e.target.value})} /></Field>
          </div>

          {f.acertos > f.total && (
            <p className="text-red-400 text-xs font-bold mt-1 bg-red-500/10 border border-red-500/25 p-2 rounded-xl">
              ⚠️ O número de acertos não pode ser maior que o total de questões.
            </p>
          )}

          {f.total > 0 && f.acertos !== "" && f.acertos <= f.total && (
            <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-4 py-2.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Aproveitamento</span>
              <span className="text-sm font-black text-emerald-400">
                {Math.round((+f.acertos / +f.total) * 100)}%
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Tempo (Min)"><Input type="number" placeholder="ex: 240" value={f.tempoMin} onChange={e => setF({...f, tempoMin: e.target.value === "" ? "" : +e.target.value})} /></Field>
            
            <Field label="Ansiedade">
              <div className="flex gap-1.5 bg-black/40 rounded-xl p-1 border border-white/10">
                {["Baixa", "Normal", "Alta"].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setF({ ...f, ansiedade: level })}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-none ${
                      f.ansiedade === level
                        ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow"
                        : "text-gray-400 hover:text-gray-200 bg-transparent"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Cansaço">
              <div className="flex gap-1.5 bg-black/40 rounded-xl p-1 border border-white/10">
                {["Baixo", "Normal", "Alto"].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setF({ ...f, cansaco: level })}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-none ${
                      f.cansaco === level
                        ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow"
                        : "text-gray-400 hover:text-gray-200 bg-transparent"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          
          <Btn 
            className="w-full mt-2" 
            onClick={() => setPage(2)} 
            disabled={!f.total || f.acertos === "" || f.acertos > f.total}
          >
            Próxima Etapa (Mapear Erros)
          </Btn>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <p className="text-[11px] font-bold text-violet-400 uppercase tracking-wider mb-2">Mapeamento de Questões Erradas</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
              <Input type="number" placeholder="Nº Q" value={newError.num} onChange={e => setNewError({...newError, num: e.target.value})} className="sm:col-span-1" />
              <Select value={newError.esp} onChange={e => setNewError({...newError, esp: e.target.value})}>
                {esps.map(e => <option key={e}>{e}</option>)}
              </Select>
              <Select value={newError.tipoErro} onChange={e => setNewError({...newError, tipoErro: e.target.value})}>
                <option value="lacuna">Lacuna de Conteúdo</option>
                <option value="raciocinio">Erro Raciocínio</option>
                <option value="distractor">Caiu Distrator</option>
                <option value="descuido">Descuido/Atenção</option>
                <option value="nao_visto">Não Visto</option>
              </Select>
              <Btn onClick={addErrorToList} variant="ghost" className="w-full py-2">Incluir</Btn>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto border border-white/5 rounded-xl divide-y divide-white/5">
            {erradas.length === 0 && <p className="text-center py-4 text-[11px] text-gray-600 italic">Nenhum erro inserido. Salvar como 100% corrigido.</p>}
            {erradas.map((err, idx) => (
              <div key={idx} className="p-2 text-[12px] flex items-center justify-between bg-black/20">
                <span className="font-mono text-red-400 font-bold">Q-{err.num}</span>
                <span className="text-gray-400 text-[11px] truncate">{err.esp}</span>
                <span className="text-yellow-500 text-[11px] uppercase font-bold">{err.tipoErro}</span>
                <button onClick={() => setErradas(erradas.filter(e => e.id !== err.id))} className="text-gray-600 hover:text-red-400"><X size={14}/></button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Btn variant="ghost" onClick={() => setPage(1)}>Voltar</Btn>
            <Btn className="flex-1" onClick={handleSaveAll}>Finalizar Registro</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Simulados() {
  const { plat, addSim, deleteSim, marcarD7 } = useStore();
  const rawSims = useStore((s) => s[plat]?.simulados || []);
  const simulados = useMemo(() => rawSims.map(migrarSim), [rawSims]);

  const [activeTab, setActiveTab] = useState("painel"); // painel | correcao | area | metricas
  const [modalOpen, setModalOpen] = useState(false);

  // Cálculos do Elite Analytics do useStore
  const analytics = useMemo(() => calcMetricasElite(simulados), [simulados]);
  const pcts = useMemo(() => simulados.map(s => s.pct), [simulados]);
  const projecao = useMemo(() => calcProjecao(pcts, 2), [pcts]);

  const tabs = [
    { k: "painel", label: "Painel Geral", icon: Target },
    { k: "correcao", label: "Revisão D7", icon: Award },
    { k: "area", label: "Por Área", icon: BarChart3 },
    { k: "metricas", label: "Elite", icon: ShieldAlert }
  ];

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-orange-400" />
          <h2 className="text-[15px] font-bold text-gray-100">Simulados e Práticas</h2>
        </div>
        <Btn onClick={() => setModalOpen(true)} className="gap-1.5"><Plus size={16} /> Registrar Simulado</Btn>
      </div>

      {/* Tabs Menu */}
      <div className="mb-2">
        <Tabs items={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Conteúdo Aba 1: Painel Geral */}
      {activeTab === "painel" && (
        <div className="flex flex-col gap-4">
          {simulados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <Target size={44} className="text-gray-700" />
              <div>
                <p className="text-[14px] font-bold text-gray-400">Nenhum simulado registrado ainda</p>
                <p className="text-[12px] text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                  Registrar seus simulados alimenta o motor do mentor com métricas cruciais de tempo, ansiedade e cansaço, calibrando alertas e permitindo o diagnóstico inteligente de padrões de erros.
                </p>
              </div>
              <Btn onClick={() => setModalOpen(true)} className="gap-1.5"><Plus size={16} /> Registrar primeiro simulado</Btn>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4">
                  <p className="text-[10.5px] text-gray-500 uppercase font-semibold mb-1">Média Geral</p>
                  <p className={`text-3xl font-black tabular-nums ${pcts.length && pcts.reduce((a,b)=>a+b)/pcts.length >= 70 ? "text-violet-400" : "text-yellow-400"}`}>
                    {pcts.length ? Math.round(pcts.reduce((a,b)=>a+b)/pcts.length) : 0}%
                  </p>
                </div>
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4">
                  <p className="text-[10.5px] text-gray-500 uppercase font-semibold mb-1">Projeção Próximo</p>
                  <p className={`text-3xl font-black tabular-nums ${projecao && projecao >= 70 ? "text-cyan-400" : "text-orange-400"}`}>{projecao != null ? `${projecao}%` : "—"}</p>
                  {projecao != null && (
                    <p className="text-[10px] text-gray-600 mt-0.5">{projecao > (pcts[pcts.length-1] || 0) ? "↑ tendência positiva" : projecao < (pcts[pcts.length-1] || 0) ? "↓ queda no desempenho" : "→ estável"}</p>
                  )}
                </div>
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4">
                  <p className="text-[10.5px] text-gray-500 uppercase font-semibold mb-1">Simulados</p>
                  <p className="text-3xl font-black text-emerald-400 tabular-nums">{simulados.length}</p>
                </div>
              </div>

              {/* Mini evolução visual */}
              {pcts.length >= 2 && (
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4">
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-3">Evolução de Acertos</p>
                  <div className="flex items-end gap-1.5 h-16">
                    {pcts.map((pct, i) => {
                      const col = pct >= 80 ? "bg-emerald-500" : pct >= 65 ? "bg-violet-500" : "bg-red-400";
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] text-gray-600 tabular-nums">{pct}%</span>
                          <div className={`w-full rounded-t-sm ${col} opacity-80 transition-all`} style={{ height: `${Math.max(4, (pct / 100) * 44)}px` }} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-gray-700">1º simulado</span>
                    <span className="text-[9px] text-gray-700">mais recente</span>
                  </div>
                </div>
              )}

              {/* Lista de simulados */}
              <div className="flex flex-col gap-2">
                {[...simulados].reverse().map((s) => {
                  const col = s.pct >= 80 ? "text-emerald-400" : s.pct >= 65 ? "text-violet-400" : "text-red-400";
                  const bgCol = s.pct >= 80 ? "bg-emerald-500/10" : s.pct >= 65 ? "bg-violet-500/10" : "bg-red-500/10";
                  const errosPend = (s.questoesErradas || []).filter(q => q.corrigidaD7 == null).length;
                  return (
                    <div key={s.id} className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${bgCol} tabular-nums shrink-0`}>
                          <span className={`${col} text-[15px]`}>{s.pct}%</span>
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-gray-200">{fmtFull(s.data)}</p>
                          <p className="text-[11.5px] text-gray-500 mt-0.5">
                            {s.acertos}/{s.total} questões
                            {s.tempoMin ? ` · ${s.tempoMin} min` : ""}
                            {s.ansiedade && s.ansiedade !== "Normal" ? ` · Ansiedade ${s.ansiedade}` : ""}
                          </p>
                          {(s.questoesErradas || []).length > 0 && (
                            <p className="text-[10px] mt-0.5">
                              <span className="text-red-400 font-bold">{(s.questoesErradas || []).length} erros mapeados</span>
                              {errosPend > 0 && <span className="text-yellow-500 ml-1">· {errosPend} aguardando D7</span>}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded hidden sm:inline ${s.statusCorrecao === "concluida" ? "bg-emerald-500/15 text-emerald-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                          {s.statusCorrecao === "concluida" ? "✓ Revisado" : "Pendente"}
                        </span>
                        <button onClick={() => { if (window.confirm("Remover este simulado?")) deleteSim(plat, s.id); }} className="text-gray-700 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10">
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Conteúdo Aba 2: Correção de Erros Ativa D7 */}
      {activeTab === "correcao" && (
        <div className="flex flex-col gap-3">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <h3 className="text-[13px] font-bold text-white mb-1">Fila Dinâmica de Auditoria de Erros (D7 Retest)</h3>
            <p className="text-[12px] text-gray-400">Marque se você re-executou a questão errada após 7 dias e conseguiu convertê-la com sucesso.</p>
          </div>

          <div className="flex flex-col gap-2">
            {simulados.flatMap(s => (s.questoesErradas || []).map(q => ({...q, simId: s.id, simData: s.data}))).filter(q => q.corrigidaD7 == null).length === 0 ? (
              <p className="text-center py-12 text-[12px] text-gray-600 italic">Nenhuma questão errada pendente de reteste!</p>
            ) : (
              simulados.flatMap(s => (s.questoesErradas || []).map(q => ({...q, simId: s.id, simData: s.data})))
                .filter(q => q.corrigidaD7 == null)
                .map(q => (
                  <div key={q.id} className="p-3 bg-[#111113] border border-white/5 rounded-xl flex items-center justify-between animate-fade-up">
                    <div>
                      <span className="text-[11px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold">Questão {q.num}</span>
                      <p className="text-[13px] font-semibold text-gray-200 mt-1">{q.esp}</p>
                      <p className="text-[11px] text-gray-500">Origem: Simulado de {fmtDate(q.simData)} · Causa: <span className="text-yellow-500 font-bold uppercase">{q.tipoErro}</span></p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => marcarD7(plat, q.simId, q.id, true)} className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[11px] font-bold hover:bg-emerald-600/30 transition-all">✓ Convertida</button>
                      <button onClick={() => marcarD7(plat, q.simId, q.id, false)} className="p-2 bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-bold hover:bg-red-600/30 transition-all">✕ Mantém Erro</button>
                    </div>
                  </div>
                )
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo Aba 3: Desempenho por Áreas Clínicas */}
      {activeTab === "area" && (
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-[13px] font-bold text-white">Rastreador de Lacunas Volumétricas por Matéria</h3>
          {(!analytics?.diagnostico || analytics.diagnostico.length === 0) ? (
            <p className="text-center text-gray-600 text-[12px] py-6">Alimente os simulados with errors para gerar o diagnóstico de área.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {analytics.diagnostico.map(d => (
                <div key={d.esp} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[13px] font-bold text-gray-200">{d.esp}</span>
                    <span className="text-[11px] text-red-400 font-bold">{d.total} erros mapeados</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                    <span>Erro Dominante: <strong className="text-yellow-500 uppercase">{d.dominante}</strong></span>
                    <span>Erros por Descuido: {d.pctDescuido}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo Aba 4: Métricas de Elite */}
      {activeTab === "metricas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
            <h3 className="text-[13px] font-bold text-white flex items-center gap-1.5"><ShieldAlert size={16} className="text-yellow-400"/> Fator Falta de Atenção Geral</h3>
            <p className="text-4xl font-black text-yellow-400 font-mono mt-2">{analytics.indiceDescuido != null ? `${analytics.indiceDescuido}%` : "—"}</p>
            <p className="text-[11px] text-gray-500 mt-1">Proporção de erros classificados puramente como distração ou falta de atenção.</p>
          </div>

          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
            <h3 className="text-[13px] font-bold text-white flex items-center gap-1.5"><Award size={16} className="text-emerald-400"/> Taxa de Conversão D7</h3>
            <p className="text-4xl font-black text-emerald-400 font-mono mt-2">{analytics.taxaConversao != null ? `${analytics.taxaConversao}%` : "—"}</p>
            <p className="text-[11px] text-gray-500 mt-1">Eficiência de eliminação de erros após 1 semana de consolidação ativa.</p>
          </div>

          {analytics.insights?.length > 0 && (
            <div className="md:col-span-2 bg-violet-600/10 border border-violet-500/20 rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-violet-400 mb-2">💡 Direcionamento Estratégico Baseado em Dados:</p>
              <ul className="text-[12px] text-gray-300 space-y-1.5 list-disc pl-4">
                {analytics.insights.map((ins, idx) => <li key={idx}>{ins}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <SimRegistroModal platKey={plat} onClose={() => setModalOpen(false)} onSave={(sim) => { addSim(plat, sim); setModalOpen(false); }} />
      )}
    </div>
  );
}
