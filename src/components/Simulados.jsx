// src/components/Simulados.jsx
import React, { useState, useMemo } from "react";
import { Target, Plus, X, Trash2, ShieldAlert, Award, BarChart3, Info, BookOpen } from "lucide-react";
import { useStore } from "../core/store";
import { todayStr, fmtDate, fmtFull, ESPS_RES, ESPS_VEST } from "../core/fsrs";
import { calcMetricasElite, migrarSim } from "../hooks/useMetrics";
import { Btn, Modal, Field, Input, Select } from "./Primitives";
import { pickTargetProva } from "../core/readiness";
import { getSimRecommendation, getSimuladoProtocolo, getNextSimuladoDate } from "../core/simStrategy";
import { safeTrackEvent } from "../core/telemetry";
import { Badge, Button as PremiumButton, Card, SegmentedControl } from "./ui";



const SIM_ERROR_TYPES = [
  { value: "lacuna", label: "Lacuna de conteúdo" },
  { value: "raciocinio", label: "Raciocínio" },
  { value: "interpretacao", label: "Interpretação" },
  { value: "distractor", label: "Distrator" },
  { value: "descuido", label: "Descuido" },
  { value: "tempo", label: "Tempo" },
  { value: "confianca_mal_calibrada", label: "Confiança/calibração" },
  { value: "nao_visto", label: "Não visto" },
  { value: "conduta", label: "Conduta/prescrição" },
];

const SIM_ERROR_TYPE_GUIDE = [
  { value: "lacuna", label: "Lacuna de conteúdo", desc: "Você não sabia o fato clínico ou teórico exigido pela questão.", acao: "Crie um flashcard atômico com o fato. Revise o tema no cronograma." },
  { value: "raciocinio", label: "Raciocínio", desc: "Você conhecia o conteúdo mas chegou a conclusão errada.", acao: "Refaça a questão com atenção ao encadeamento lógico. Crie um illness script do tema." },
  { value: "interpretacao", label: "Interpretação", desc: "Você errou na leitura do enunciado ou na identificação do que era pedido.", acao: "Pratique grifar o comando da questão. Releia os enunciados com atenção ao 'exceto' e 'mais provável'." },
  { value: "distrator", label: "Distrator", desc: "Você foi atraído por uma alternativa plausível que parecia certa.", acao: "Estude os diferenciais do tema. Faça illness script comparando diagnósticos próximos." },
  { value: "descuido", label: "Descuido", desc: "Você sabia a resposta mas clicou na alternativa errada ou não leu com cuidado.", acao: "Monitore o padrão. Se frequente, reveja seu ritmo durante a prova." },
  { value: "tempo", label: "Tempo", desc: "Você não conseguiu responder com qualidade por falta de tempo.", acao: "Treine simulados cronometrados. Marque questões longas para revisar no fim." },
  { value: "confianca_mal_calibrada", label: "Confiança/calibração", desc: "Você tinha certeza mas errou — ou duvida mas acertou por chute.", acao: "Compare sua confiança declarada com o acerto nos relatórios. Ajuste a calibração metacognitiva." },
  { value: "nao_visto", label: "Não visto", desc: "O tema cobrado ainda não foi estudado no seu plano.", acao: "Verifique se o tema está no calendário. Se não, adicione ao plano." },
  { value: "conduta", label: "Conduta/prescrição", desc: "Você errou a conduta clínica específica exigida (para Residência).", acao: "Revise o protocolo de conduta do tema. Use raciocínio clínico e illness script." },
];

export function SimRegistroModal({ onClose, onSave, platKey, temas = [] }) {
  const [page, setPage] = useState(1);
  const esps = platKey === "res" ? ESPS_RES : ESPS_VEST;
  const [errorsGuideOpen, setErrorsGuideOpen] = useState(false);
  const [temaQuery, setTemaQuery] = useState("");
  const [showTemaDropdown, setShowTemaDropdown] = useState(false);
  const [f, setF] = useState({
    tipo: "simulado",
    nome: "",
    instituicao: "",
    ano: "",
    data: todayStr(),
    total: 100,
    acertos: "",
    tempoMin: "",
    modo: "cronometrado",
    areasIncluidas: [],
    metaAcerto: "",
    ansiedade: "Normal",
    cansaco: "Normal",
  });
  
  // Controle de erros da página 2
  const [erradas, setErradas] = useState([]);
  const [newError, setNewError] = useState({ num: "", esp: esps[0], tema: "", tipoErro: "lacuna", desc: "", virouCard: false });
  const realErrors = Math.max(0, Number(f.total || 0) - Number(f.acertos || 0));
  const pageOneValid =
    f.tipo
    && String(f.nome || "").trim()
    && String(f.instituicao || "").trim()
    && f.data
    && Number(f.total) > 0
    && f.acertos !== ""
    && Number(f.acertos) >= 0
    && Number(f.acertos) <= Number(f.total)
    && Number(f.tempoMin) > 0
    && f.modo
    && f.areasIncluidas.length > 0
    && Number(f.metaAcerto) > 0;
  const errorMapComplete = erradas.length === realErrors;

  const filteredTemas = useMemo(() => {
    const q = temaQuery.trim().toLowerCase();
    if (!q || temas.length === 0) return [];
    return temas.filter(t => t.nome.toLowerCase().includes(q)).slice(0, 8);
  }, [temaQuery, temas]);

  const addErrorToList = () => {
    if (erradas.length >= realErrors) return;
    if (!newError.num) return;
    setErradas([...erradas, { ...newError, id: Date.now(), corrigidaD7: null }]);
    setNewError({ num: "", esp: esps[0], tema: "", temaId: null, tipoErro: "lacuna", desc: "", virouCard: false });
    setTemaQuery("");
  };

  const handleSaveAll = () => {
    if (!errorMapComplete) return;
    const pct = f.total > 0 ? Math.round((+f.acertos / +f.total) * 100) : 0;
    onSave({
      ...f,
      pct,
      questoesErradas: erradas,
      errosReais: realErrors,
      statusCorrecao: "concluida"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Tipo" info="Classifica o registro para estatísticas futuras."><Select value={f.tipo} onChange={e => setF({ ...f, tipo: e.target.value })}>
              <option value="simulado">Simulado</option>
              <option value="prova_antiga">Prova antiga</option>
              <option value="bloco_area">Bloco por área</option>
            </Select></Field>
            <Field label="Nome da prova" info="Identifique a prova ou simulado realizado."><Input value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} placeholder="ex: ENAMED diagnóstico" /></Field>
            <Field label="Instituição/banca" info="Banca, instituição ou origem do simulado."><Input value={f.instituicao} onChange={e => setF({ ...f, instituicao: e.target.value })} placeholder="ex: ENAMED, USP-SP" /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Field label="Ano" info="Obrigatório apenas para prova antiga; opcional nos demais tipos."><Input type="number" value={f.ano} onChange={e => setF({ ...f, ano: e.target.value })} placeholder="2025" /></Field>
            <Field label="Modo" info="Define se a prova foi feita em tempo real."><Select value={f.modo} onChange={e => setF({ ...f, modo: e.target.value })}>
              <option value="cronometrado">Cronometrado</option>
              <option value="sem_tempo">Sem tempo</option>
            </Select></Field>
            <Field label="Meta de acerto (%)" info="Meta usada para cor e recompensa do resultado."><Input type="number" value={f.metaAcerto} onChange={e => setF({ ...f, metaAcerto: e.target.value === "" ? "" : +e.target.value })} placeholder="75" /></Field>
            <Field label="Data de Realização" info="A data em que você realizou a prova do simulado."><Input type="date" value={f.data} onChange={e => setF({...f, data: e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Questões" info="O número total de questões contidas na prova deste simulado."><Input type="number" value={f.total} onChange={e => setF({...f, total: e.target.value === "" ? "" : +e.target.value})} /></Field>
            <Field label="Total Acertos" info="O número de questões que você acertou no simulado."><Input type="number" value={f.acertos} onChange={e => setF({...f, acertos: e.target.value === "" ? "" : +e.target.value})} /></Field>
          </div>

          <Field label="Áreas incluídas" info="Selecione ao menos uma área para alimentar estatísticas por prova.">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1.5 max-h-36 overflow-y-auto">
              {esps.map((esp) => {
                const checked = f.areasIncluidas.includes(esp);
                return (
                  <label key={esp} className={`min-h-10 rounded-xl border px-2 py-1.5 text-[10.5px] font-bold cursor-pointer flex items-center gap-1.5 ${checked ? "bg-blue-500/10 border-blue-500/30 text-blue-200" : "bg-white/5 border-white/10 text-gray-400"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setF((prev) => ({
                          ...prev,
                          areasIncluidas: e.target.checked
                            ? [...prev.areasIncluidas, esp]
                            : prev.areasIncluidas.filter((item) => item !== esp),
                        }));
                      }}
                    />
                    <span className="truncate">{esp}</span>
                  </label>
                );
              })}
            </div>
          </Field>

          {f.acertos > f.total && (
            <p className="text-red-400 text-xs font-bold mt-1 bg-red-500/10 border border-red-500/25 p-2 rounded-xl inline-flex items-center gap-1.5">
              <ShieldAlert size={14} aria-hidden="true" />
              O número de acertos não pode ser maior que o total de questões.
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
            <Field label="Tempo (Min)" info="O tempo total em minutos que você levou para resolver a prova."><Input type="number" placeholder="ex: 240" value={f.tempoMin} onChange={e => setF({...f, tempoMin: e.target.value === "" ? "" : +e.target.value})} /></Field>
            
            <Field label="Ansiedade" info="Seu nível subjetivo de ansiedade/estresse sentido durante a realização do simulado.">
              <div className="flex gap-1.5 bg-black/40 rounded-xl p-1 border border-white/10 mt-1.5">
                {["Baixa", "Normal", "Alta"].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setF({ ...f, ansiedade: level })}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-none ${
                      f.ansiedade === level
                        ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow"
                        : "text-gray-400 hover:text-gray-200 bg-transparent"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Cansaço" info="Seu nível de exaustão física ou mental sentido durante a realização da prova.">
              <div className="flex gap-1.5 bg-black/40 rounded-xl p-1 border border-white/10 mt-1.5">
                {["Baixo", "Normal", "Alto"].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setF({ ...f, cansaco: level })}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-none ${
                      f.cansaco === level
                        ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow"
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
            disabled={!pageOneValid}
          >
            Próxima Etapa ({realErrors} erro{realErrors === 1 ? "" : "s"} para diagnosticar)
          </Btn>
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-left">
          <div className={`rounded-xl border p-3 ${errorMapComplete ? "border-emerald-500/20 bg-emerald-500/10" : "border-amber-500/25 bg-amber-500/10"}`}>
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-200">
              Erros diagnosticados: {erradas.length}/{realErrors}
            </p>
            <p className="text-[10.5px] text-gray-400 mt-0.5">
              Para salvar, a quantidade de erros mapeados precisa bater com total - acertos.
            </p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Mapeamento de Questões Erradas</p>
              <button
                type="button"
                onClick={() => setErrorsGuideOpen(true)}
                className="text-[10px] font-bold text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-1 border-none bg-transparent cursor-pointer"
              >
                <Info size={11} /> Tipos de erro
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input type="number" placeholder="Nº Questão" value={newError.num} onChange={e => setNewError({...newError, num: e.target.value})} />
              <Select value={newError.esp} onChange={e => setNewError({...newError, esp: e.target.value})}>
                {esps.map(e => <option key={e}>{e}</option>)}
              </Select>
              <Select value={newError.tipoErro} onChange={e => setNewError({...newError, tipoErro: e.target.value})}>
                {SIM_ERROR_TYPES.filter((item) => platKey === "res" || item.value !== "conduta").map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2 items-start flex-wrap">
              {/* Tema com autocomplete */}
              <div className="relative flex-1 min-w-[160px]">
                <Input
                  type="text"
                  placeholder="Tema vinculado (buscar...)"
                  value={temaQuery}
                  onChange={e => { setTemaQuery(e.target.value); setNewError({...newError, tema: e.target.value, temaId: null}); setShowTemaDropdown(true); }}
                  onFocus={() => setShowTemaDropdown(true)}
                  onBlur={() => setTimeout(() => setShowTemaDropdown(false), 200)}
                />
                {showTemaDropdown && filteredTemas.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-[#18181b] border border-white/15 rounded-xl shadow-xl max-h-36 overflow-y-auto">
                    {filteredTemas.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-[11px] text-gray-200 hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
                        onMouseDown={() => { setTemaQuery(t.nome); setNewError(prev => ({...prev, tema: t.nome, temaId: t.id})); setShowTemaDropdown(false); }}
                      >
                        <span className="font-bold">{t.nome}</span>
                        <span className="text-gray-500 ml-1.5">· {t.esp}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Input type="text" placeholder="Fato atômico / Anotação" value={newError.desc || ""} onChange={e => setNewError({...newError, desc: e.target.value})} className="flex-1 min-w-[140px]" />
              <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer shrink-0 select-none">
                <input type="checkbox" checked={newError.virouCard} onChange={e => setNewError({...newError, virouCard: e.target.checked})} className="rounded border-white/20 text-blue-600 bg-black h-4 w-4" />
                <span>Card?</span>
              </label>
              <Btn onClick={addErrorToList} variant="ghost" className="py-2 shrink-0">Incluir</Btn>
            </div>
          </div>

          {errorsGuideOpen && (
            <Modal onClose={() => setErrorsGuideOpen(false)} wide>
              <div className="space-y-4">
                <div>
                  <h3 className="text-[14px] font-black text-white">Tipos de Erro — O que fazer com cada um</h3>
                  <p className="text-[11px] text-gray-400 mt-1">Identificar o tipo certo direciona a correção para o que realmente resolve o erro.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SIM_ERROR_TYPE_GUIDE.filter(g => platKey === "res" || g.value !== "conduta").map(g => (
                    <div key={g.value} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] font-black text-blue-300 uppercase tracking-wider">{g.label}</p>
                      <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">{g.desc}</p>
                      <p className="text-[10px] text-emerald-400 mt-1.5 font-bold">→ {g.acao}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Modal>
          )}

          <div className="max-h-40 overflow-y-auto border border-white/5 rounded-xl divide-y divide-white/5">
            {erradas.length === 0 && <p className="text-center py-4 text-[11px] text-gray-600 italic">{realErrors === 0 ? "Nenhum erro real. Pode salvar como corrigido." : "Insira os erros reais para liberar o salvamento."}</p>}
            {erradas.map((err, idx) => (
              <div key={idx} className="p-2 text-[12px] flex items-center justify-between bg-black/20 gap-2">
                <span className="font-mono text-red-400 font-bold shrink-0">Q-{err.num}</span>
                <span className="text-gray-400 text-[11px] truncate flex-1">{err.esp} - <span className="italic text-gray-500">{err.desc || "sem anotação"}</span></span>
                <span className="text-yellow-500 text-[11px] uppercase font-bold shrink-0">{err.tipoErro}</span>
                {err.virouCard && <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded shrink-0">Anki</span>}
                <button onClick={() => setErradas(erradas.filter(e => e.id !== err.id))} className="text-gray-600 hover:text-red-400 shrink-0"><X size={14}/></button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Btn variant="ghost" onClick={() => setPage(1)}>Voltar</Btn>
            <Btn className="flex-1" onClick={handleSaveAll} disabled={!errorMapComplete}>Finalizar Registro</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Simulados({ onStudy, setView }) {
  const { plat, addSim, deleteSim, marcarD7, meta } = useStore();
  const openConfirm = useStore((s) => s.openConfirm);
  const rawSims = useStore((s) => s[plat]?.simulados || []);
  const simulados = useMemo(() => rawSims.map(migrarSim), [rawSims]);
  const temas = useStore((s) => s[plat]?.temas || []);

  const [activeTab, setActiveTab] = useState("painel"); // painel | correcao | area | metricas
  const [modalOpen, setModalOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [showSimConfetti, setShowSimConfetti] = useState(false);

  const targetProva = useMemo(() => pickTargetProva(meta?.provasAlvo, plat), [meta?.provasAlvo, plat]);

  const analytics = useMemo(() => calcMetricasElite(simulados, plat, targetProva), [simulados, plat, targetProva]);
  const pcts = useMemo(() => simulados.map(s => s.pct), [simulados]);

  // Estatísticas de erro expandidas
  const statsErros = useMemo(() => {
    const allErrors = simulados.flatMap(s => s.questoesErradas || []);
    const porTipo = {};
    const porArea = {};
    const porTema = {};
    allErrors.forEach(e => {
      const t = e.tipoErro || "lacuna";
      porTipo[t] = (porTipo[t] || 0) + 1;
      const area = e.esp || "Geral";
      porArea[area] = (porArea[area] || 0) + 1;
      if (e.tema) porTema[e.tema] = (porTema[e.tema] || 0) + 1;
    });
    return {
      total: allErrors.length,
      corrigidos: allErrors.filter(e => e.corrigidaD7 === true).length,
      cards: allErrors.filter(e => e.virouCard).length,
      porTipo: Object.entries(porTipo).sort((a, b) => b[1] - a[1]).slice(0, 6),
      porArea: Object.entries(porArea).sort((a, b) => b[1] - a[1]).slice(0, 6),
      temasRecorrentes: Object.entries(porTema).filter(([, v]) => v > 1).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [simulados]);

  const simRecommendation = useMemo(() => {
    return getSimRecommendation(meta?.dataProva, simulados, temas, plat);
  }, [meta?.dataProva, simulados, temas, plat]);

  const nextSimDate = useMemo(() => {
    return getNextSimuladoDate(simulados, simRecommendation.intervaloDias);
  }, [simulados, simRecommendation.intervaloDias]);

  const daysUntilNextSim = useMemo(() => {
    if (!nextSimDate) return null;
    const today = todayStr();
    if (nextSimDate <= today) return 0;
    const diff = Math.ceil((new Date(nextSimDate) - new Date(today)) / (1000 * 60 * 60 * 24));
    return diff;
  }, [nextSimDate]);

  const tabs = [
    { k: "painel", label: "Estratégia", icon: Target },
    { k: "correcao", label: "Revisão D7", icon: Award },
    { k: "area", label: "Por Área", icon: BarChart3 },
  ];






  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <Card variant="elevated" className="med-animate-in" style={{ padding: 18, background: "linear-gradient(180deg, rgba(6,182,212,.1), rgba(59,130,246,.045)), var(--med-surface-0)" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/12 text-cyan-300 ring-1 ring-cyan-500/20">
              <Target size={20} />
            </div>
            <div>
              <Badge tone="cyan">Simulados</Badge>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white">Estratégia de prova</h2>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-gray-400">
                Registre provas, classifique erros e transforme cada simulado em plano de revisão.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PremiumButton variant="secondary" onClick={() => setHowToOpen(true)} size="sm">
              <BookOpen size={16} /> Como fazer
            </PremiumButton>
            <PremiumButton onClick={() => setModalOpen(true)} size="sm">
              <Plus size={16} /> Registrar
            </PremiumButton>
          </div>
        </div>
      </Card>

      {/* Tabs Menu */}
      <div className="mb-2">
        <SegmentedControl
          ariaLabel="Seções de simulados"
          value={activeTab}
          onChange={setActiveTab}
          options={tabs.map((tab) => ({ value: tab.k, label: tab.label }))}
        />
      </div>

      {/* Conteúdo Aba 1: Estratégia */}
      {activeTab === "painel" && (
        <div className="flex flex-col gap-5">

          {/* CARD ÚNICO: ESTRATÉGIA DE SIMULADOS (diagnóstico → calibração → cadência → próxima data) */}
          <Card variant="elevated" style={{ padding: 20, borderColor: "rgba(59,130,246,.25)", background: "linear-gradient(135deg, rgba(6,182,212,.08), rgba(59,130,246,.06)), var(--med-surface-0)" }}>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                  <Target size={16} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Estratégia de Simulados</p>
                  <h3 className="text-[14px] font-black text-white leading-tight">{simRecommendation.titulo}</h3>
                </div>
              </div>
              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                simRecommendation.tipo === "Baseline" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                simRecommendation.tipo === "Stamina" || simRecommendation.tipo === "Stamina+" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                simRecommendation.tipo === "Confirmação" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                simRecommendation.tipo === "Lapidação" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                "bg-white/5 text-gray-400 border-white/10"
              }`}>
                {simRecommendation.tipo}
              </span>
            </div>

            {/* 1. Diagnóstico / descrição */}
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 mb-3">
              <p className="text-[12px] text-gray-200 leading-relaxed font-medium">{simRecommendation.descricao}</p>
              <p className="text-[11px] text-gray-500 italic mt-1">"{simRecommendation.justificativa}"</p>
            </div>

            {/* 2. Calibração (após 1º simulado) */}
            {simulados.length >= 1 && (
              <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 mb-3">
                <Info size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-300 leading-relaxed">
                  <strong>Calibrado com {simulados.length} simulado{simulados.length > 1 ? "s" : ""}.</strong> O sistema ajusta a estratégia conforme seus resultados históricos.
                </p>
              </div>
            )}

            {/* 3. Cadência + próxima data */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-center">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Cadência</p>
                <p className="text-[13px] font-black text-white mt-1">{simRecommendation.frequenciaRecomendada}</p>
              </div>
              <div className={`border rounded-xl p-3 text-center ${
                daysUntilNextSim === 0
                  ? "bg-amber-500/10 border-amber-500/25"
                  : daysUntilNextSim != null && daysUntilNextSim <= 3
                  ? "bg-orange-500/10 border-orange-500/25"
                  : "bg-black/30 border-white/5"
              }`}>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Próximo simulado</p>
                {nextSimDate ? (
                  <>
                    <p className={`text-[13px] font-black mt-1 ${daysUntilNextSim === 0 ? "text-amber-400" : daysUntilNextSim <= 3 ? "text-orange-400" : "text-white"}`}>
                      {daysUntilNextSim === 0 ? "Hoje!" : `em ${daysUntilNextSim}d`}
                    </p>
                    <p className="text-[9px] text-gray-600 mt-0.5">{nextSimDate}</p>
                  </>
                ) : (
                  <p className="text-[12px] font-black text-gray-500 mt-1">—</p>
                )}
              </div>
            </div>

            {/* 4. Foco de especialidades (se houver) */}
            {simRecommendation.focoEspecialidades.length > 0 && (
              <div>
                <p className="text-[9.5px] text-gray-500 font-bold uppercase tracking-wider mb-1">Foco Prioritário</p>
                <div className="flex flex-wrap gap-1">
                  {simRecommendation.focoEspecialidades.map((esp, i) => (
                    <span key={i} className="text-[9px] bg-white/5 text-gray-300 border border-white/5 px-2 py-0.5 rounded-lg font-medium">
                      {esp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Registrar */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <PremiumButton onClick={() => setModalOpen(true)} size="sm" className="w-full sm:w-auto">
                <Plus size={14} /> Registrar simulado
              </PremiumButton>
            </div>
          </Card>

          {/* HISTÓRICO DE SIMULADOS (LIST) */}
          <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-black text-white uppercase tracking-wider">Histórico de Simulados</h3>
              <span className="text-[10px] font-bold text-gray-500">{simulados.length} provas cadastradas</span>
            </div>

            {simulados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <Target size={32} className="text-gray-700" />
                <p className="text-[12px] text-gray-500 italic max-w-sm mx-auto">
                  Seus simulados e anotações cronológicas aparecerão aqui após o primeiro registro.
                </p>
              </div>
            ) : (
              <>
                {/* Mini evolução visual */}
                {pcts.length >= 2 && (
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-3">Gráfico de Evolução Temporária</p>
                    <div className="flex items-end gap-1.5 h-16">
                      {pcts.map((pct, i) => {
                        const col = pct >= 80 ? "bg-emerald-500" : pct >= 65 ? "bg-blue-500" : "bg-red-400";
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[9px] text-gray-600 tabular-nums">{pct}%</span>
                            <div className={`w-full rounded-t-sm ${col} opacity-80 transition-all`} style={{ height: `${Math.max(4, (pct / 100) * 44)}px` }} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1.5 select-none">
                      <span className="text-[9px] text-gray-700">1º simulado</span>
                      <span className="text-[9px] text-gray-700">mais recente</span>
                    </div>
                  </div>
                )}

                {/* Lista de simulados */}
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {[...simulados].reverse().map((s) => {
                    const metaAcerto = s.metaAcerto || 0;
                    const hitsMeta = metaAcerto > 0 && s.pct >= metaAcerto;
                    const col = hitsMeta ? "text-blue-200" : s.pct >= 80 ? "text-emerald-400" : s.pct >= 65 ? "text-blue-400" : s.pct >= 50 ? "text-amber-400" : "text-red-400";
                    const bgCol = hitsMeta ? "bg-blue-800/30 border border-blue-500/30" : s.pct >= 80 ? "bg-emerald-500/10" : s.pct >= 65 ? "bg-blue-500/10" : "bg-red-500/10";
                    const errosPend = (s.questoesErradas || []).filter(q => q.corrigidaD7 == null).length;
                    return (
                      <div key={s.id} className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-white/10 transition-all">
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
                          <button onClick={() => { openConfirm({ title: "Remover simulado", message: "Deseja remover este simulado?", confirmLabel: "Remover", danger: true, onConfirm: () => deleteSim(plat, s.id) }); }} className="text-gray-700 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10">
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
                  <div key={q.id} className="p-3 bg-[var(--surface-1)] border border-white/5 rounded-xl flex items-center justify-between animate-fade-up">
                    <div>
                      <span className="text-[11px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold">Questão {q.num}</span>
                      <p className="text-[13px] font-semibold text-gray-200 mt-1">{q.esp}</p>
                      <p className="text-[11px] text-gray-500">Origem: Simulado de {fmtDate(q.simData)} · Causa: <span className="text-yellow-500 font-bold uppercase">{q.tipoErro}</span></p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => marcarD7(plat, q.simId, q.id, true)} className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[11px] font-bold hover:bg-emerald-600/30 transition-all cursor-pointer">✓ Convertida</button>
                      <button onClick={() => marcarD7(plat, q.simId, q.id, false)} className="p-2 bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-bold hover:bg-red-600/30 transition-all cursor-pointer">✕ Mantém Erro</button>
                    </div>
                  </div>
                )
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo Aba 3: Desempenho por Áreas Clínicas */}
      {activeTab === "area" && (
        <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-[13px] font-bold text-white">Rastreador de Lacunas Volumétricas por Matéria</h3>
          {(!analytics?.diagnostico || analytics.diagnostico.length === 0) ? (
            <p className="text-center text-gray-600 text-[12px] py-6">Alimente os simulados com erros para gerar o diagnóstico de área.</p>
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

      {/* Conteudo Aba 4: Erros avancados */}
      {activeTab === "metricas" && (
        <div className="space-y-4">
          {/* Overview de erros */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: "Erros totais", v: statsErros.total, c: statsErros.total > 0 ? "text-red-400" : "text-gray-500" },
              { l: "Corrigidos (D7)", v: statsErros.corrigidos, c: "text-emerald-400" },
              { l: "Viraram Card", v: statsErros.cards, c: "text-blue-400" },
              { l: "Desc./Atenção", v: analytics.indiceDescuido != null ? `${analytics.indiceDescuido}%` : "—", c: "text-yellow-400" },
            ].map(kpi => (
              <div key={kpi.l} className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{kpi.l}</p>
                <p className={`text-3xl font-black tabular-nums mt-2 ${kpi.c}`}>{kpi.v}</p>
              </div>
            ))}
          </div>

          {statsErros.total > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Por tipo */}
              {statsErros.porTipo.length > 0 && (
                <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4 space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-gray-300">Erros por tipo</p>
                  {statsErros.porTipo.map(([tipo, count]) => {
                    const label = SIM_ERROR_TYPES.find(t => t.value === tipo)?.label || tipo;
                    const pct = statsErros.total > 0 ? Math.round((count / statsErros.total) * 100) : 0;
                    return (
                      <div key={tipo} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-300">{label}</span>
                          <span className="text-gray-500 font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500/50 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Por área */}
              {statsErros.porArea.length > 0 && (
                <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4 space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-gray-300">Erros por área</p>
                  {statsErros.porArea.map(([area, count]) => {
                    const pct = statsErros.total > 0 ? Math.round((count / statsErros.total) * 100) : 0;
                    return (
                      <div key={area} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-300">{area}</span>
                          <span className="text-gray-500 font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500/50 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Temas recorrentes */}
              {statsErros.temasRecorrentes.length > 0 && (
                <div className="bg-[var(--surface-1)] border border-red-500/15 rounded-2xl p-4 space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-red-400">Temas com erros recorrentes</p>
                  {statsErros.temasRecorrentes.map(([tema, count]) => (
                    <div key={tema} className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-300">{tema}</span>
                      <span className="text-red-400 font-bold">{count}x erros</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Taxa de conversão */}
              <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                <h3 className="text-[12px] font-bold text-white flex items-center gap-1.5"><Award size={14} className="text-emerald-400"/> Taxa de Conversão D7</h3>
                <p className="text-3xl font-black text-emerald-400 font-mono">{analytics.taxaConversao != null ? `${analytics.taxaConversao}%` : "—"}</p>
                <p className="text-[10px] text-gray-500">Eficiência de eliminação de erros após 1 semana de consolidação.</p>
              </div>
            </div>
          )}

          {statsErros.total === 0 && (
            <p className="text-center py-8 text-gray-500 text-[12px] italic">Nenhum erro mapeado ainda. Registre simulados com auditoria de erros para ver estas estatísticas.</p>
          )}

          {analytics.insights?.length > 0 && (
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-blue-400 mb-2">Direcionamento estratégico</p>
              <ul className="text-[12px] text-gray-300 space-y-1.5 list-disc pl-4">
                {analytics.insights.map((ins, idx) => <li key={idx}>{ins}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {howToOpen && (
        <Modal onClose={() => setHowToOpen(false)} wide>
          <div className="space-y-4 text-left">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-300">Como fazer este simulado</p>
              <h2 className="text-[16px] font-black text-white mt-1">{simRecommendation.titulo}</h2>
              <p className="text-[12px] text-gray-400 mt-1">Use como checklist operacional antes de registrar a sessão.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {getSimuladoProtocolo(simRecommendation.tipo).map((passo, i) => (
                <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-wider">Passo {i + 1}</p>
                  <p className="text-[12px] font-bold text-gray-100 mt-1">{passo.t}</p>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{passo.d}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-[11px] font-bold text-amber-200">Regra de produto</p>
              <p className="text-[11px] text-gray-300 mt-1">
                Cronometre, misture areas quando fizer prova completa, classifique todos os erros, revise o racional das erradas e refaca pontos criticos em 48-72h.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {showSimConfetti && (
        <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                backgroundColor: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#a78bfa"][i % 5],
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${1 + Math.random()}s`,
                transform: `translateY(${Math.random() * -80}vh)`,
              }}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <SimRegistroModal
          platKey={plat}
          temas={temas}
          onClose={() => setModalOpen(false)}
          onSave={(sim) => {
            addSim(plat, sim);
            safeTrackEvent("simulation_result_recorded", { plat, pct: sim?.pct ?? 0, total: sim?.total ?? 0 }, { state: useStore.getState() });
            if (sim.metaAcerto > 0 && sim.pct >= sim.metaAcerto) {
              setShowSimConfetti(true);
              setTimeout(() => setShowSimConfetti(false), 3500);
            }
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
