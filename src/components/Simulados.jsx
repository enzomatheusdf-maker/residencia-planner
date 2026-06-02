// src/components/Simulados.jsx
import React, { useState, useMemo } from "react";
import { Target, Plus, X, Trash2, ShieldAlert, Award, BarChart3, Info, Brain, BookOpen, Activity } from "lucide-react";
import { useStore } from "../core/store";
import { todayStr, fmtDate, fmtFull, ESPS_RES, ESPS_VEST, STEPS } from "../core/fsrs";
import { calcMetricasElite, migrarSim } from "../hooks/useMetrics";
import { Btn, Modal, Field, Input, Select, Tabs } from "./Primitives";
import { getReadinessData, matchesArea, pickTargetProva } from "../core/readiness";
import { totalQuestoesFeitas, saldoRitmo } from "../core/volume";
import { getSimRecommendation, getResultActions, getSimuladoGuidance, getSimuladoProtocolo } from "../core/simStrategy";
import { trackEvent } from "../services/firebase";

const ZONA_UI = {
  vermelha: {
    bg: "bg-red-500/5",
    border: "border-red-500/25",
    text: "text-red-400",
    badgeBg: "bg-red-500/10 text-red-400 border-red-500/20",
    label: "Zona Vermelha",
    desc: "Alta Incidência × Baixo Domínio"
  },
  laranja: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/25",
    text: "text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    label: "Zona Laranja",
    desc: "Alta Incidência × Alto Domínio"
  },
  roxa: {
    bg: "bg-indigo-500/5",
    border: "border-indigo-500/25",
    text: "text-indigo-400",
    badgeBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    label: "Zona Roxa",
    desc: "Baixa Incidência × Baixo Domínio"
  },
  verde: {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/25",
    text: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    label: "Zona Verde",
    desc: "Baixa Incidência × Alto Domínio"
  }
};

function incLabel(inc) {
  if (inc >= 1.15) return "Alta";
  if (inc >= 0.95) return "Média";
  return "Baixa";
}

export function SimRegistroModal({ onClose, onSave, platKey }) {
  const [page, setPage] = useState(1);
  const esps = platKey === "res" ? ESPS_RES : ESPS_VEST;
  const [f, setF] = useState({ data: todayStr(), total: 100, acertos: "", tempoMin: "", ansiedade: "Normal", cansaco: "Normal" });
  
  // Controle de erros da página 2
  const [erradas, setErradas] = useState([]);
  const [newError, setNewError] = useState({ num: "", esp: esps[0], tipoErro: "lacuna", desc: "", virouCard: false });

  const addErrorToList = () => {
    if (!newError.num) return;
    setErradas([...erradas, { ...newError, id: Date.now(), corrigidaD7: null }]);
    setNewError({ num: "", esp: esps[0], tipoErro: "lacuna", desc: "", virouCard: false });
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
          <Field label="Data de Realização" info="A data em que você realizou a prova do simulado."><Input type="date" value={f.data} onChange={e => setF({...f, data: e.target.value})} /></Field>
          
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Questões" info="O número total de questões contidas na prova deste simulado."><Input type="number" value={f.total} onChange={e => setF({...f, total: e.target.value === "" ? "" : +e.target.value})} /></Field>
            <Field label="Total Acertos" info="O número de questões que você acertou no simulado."><Input type="number" value={f.acertos} onChange={e => setF({...f, acertos: e.target.value === "" ? "" : +e.target.value})} /></Field>
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
            disabled={!f.total || f.acertos === "" || f.acertos > f.total}
          >
            Próxima Etapa (Mapear Erros)
          </Btn>
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-left">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2">
            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">Mapeamento de Questões Erradas</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input type="number" placeholder="Nº Questão" value={newError.num} onChange={e => setNewError({...newError, num: e.target.value})} />
              <Select value={newError.esp} onChange={e => setNewError({...newError, esp: e.target.value})}>
                {esps.map(e => <option key={e}>{e}</option>)}
              </Select>
              <Select value={newError.tipoErro} onChange={e => setNewError({...newError, tipoErro: e.target.value})}>
                <option value="lacuna">Lacuna de Conteúdo</option>
                <option value="raciocinio">Erro Raciocínio</option>
                <option value="distractor">Caiu Distrator</option>
                <option value="descuido">Descuido/Atenção</option>
                <option value="nao_visto">Não Visto</option>
                {platKey === "vest" && <option value="interpretacao">Erro de Interpretação</option>}
              </Select>
            </div>
            <div className="flex gap-2 items-center">
              <Input type="text" placeholder="Fato atômico / Anotação do erro" value={newError.desc || ""} onChange={e => setNewError({...newError, desc: e.target.value})} className="flex-1" />
              <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer shrink-0 select-none">
                <input
                  type="checkbox"
                  checked={newError.virouCard}
                  onChange={e => setNewError({...newError, virouCard: e.target.checked})}
                  className="rounded border-white/20 text-blue-600 focus:ring-blue-500 bg-black h-4 w-4"
                />
                <span>Criou Card?</span>
              </label>
              <Btn onClick={addErrorToList} variant="ghost" className="py-2">Incluir</Btn>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto border border-white/5 rounded-xl divide-y divide-white/5">
            {erradas.length === 0 && <p className="text-center py-4 text-[11px] text-gray-600 italic">Nenhum erro inserido. Salvar como 100% corrigido.</p>}
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
            <Btn className="flex-1" onClick={handleSaveAll}>Finalizar Registro</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Simulados({ onStudy, setView }) {
  const { plat, addSim, deleteSim, marcarD7, meta } = useStore();
  const showToast = useStore((s) => s.showToast);
  const openConfirm = useStore((s) => s.openConfirm);
  const rawSims = useStore((s) => s[plat]?.simulados || []);
  const userName = useStore((s) => s.userName || "Estudante");
  const simulados = useMemo(() => rawSims.map(migrarSim), [rawSims]);
  const temas = useStore((s) => s[plat]?.temas || []);

  const [activeTab, setActiveTab] = useState("painel"); // painel | correcao | area | metricas
  const [modalOpen, setModalOpen] = useState(false);

  // Core calculations and readiness score
  const targetProva = useMemo(() => pickTargetProva(meta?.provasAlvo, plat), [meta?.provasAlvo, plat]);
  const readiness = useMemo(() => {
    return getReadinessData({ temas, simulados, meta, plat });
  }, [temas, simulados, meta, plat]);

  const analytics = useMemo(() => calcMetricasElite(simulados, plat, targetProva), [simulados, plat, targetProva]);
  const pcts = useMemo(() => simulados.map(s => s.pct), [simulados]);

  const simRecommendation = useMemo(() => {
    return getSimRecommendation(meta?.dataProva, simulados, temas, plat);
  }, [meta?.dataProva, simulados, temas, plat]);
  const simGuidance = useMemo(() => {
    return getSimuladoGuidance({
      dataProva: meta?.dataProva,
      simulados,
      cobertura: readiness.cobertura || 0,
      score: readiness.score || 0,
    });
  }, [meta?.dataProva, simulados, readiness.cobertura, readiness.score]);

  const todosErros = useMemo(() => {
    return simulados.flatMap(s => s.questoesErradas || []);
  }, [simulados]);

  const acoesErros = useMemo(() => {
    return getResultActions(todosErros);
  }, [todosErros]);

  const tabs = [
    { k: "painel", label: "Preparo", icon: Target },
    { k: "correcao", label: "Revisão D7", icon: Award },
    { k: "area", label: "Por Área", icon: BarChart3 },
    { k: "metricas", label: "Elite", icon: ShieldAlert }
  ];

  // Rhythm/Pace calculation
  const ritmoPace = useMemo(() => {
    if (!meta?.metaQuestoesDia) return null;
    const started = temas.filter(t => !t.unstarted);
    const firstD0 = started.length > 0 ? started.sort((a,b) => a.d0.localeCompare(b.d0))[0].d0 : null;
    return saldoRitmo(temas, meta, firstD0);
  }, [temas, meta]);

  // Priority list and quadrants calculation
  const priorityList = readiness.priorityList || [];
  const topPrioridade = priorityList[0] || null;
  const hasProvaSelecionada = (meta?.provasAlvo || []).length > 0;

  const handleAdicionarFila = (esp) => {
    const unstartedTemas = temas.filter(t => t.unstarted && matchesArea(t.esp, esp));
    if (unstartedTemas.length === 0) {
      showToast(`Todos os temas de ${esp} já estão na fila.`);
      return;
    }
    const target = unstartedTemas[0];
    useStore.getState().updateTema(plat, target.id, { unstarted: false, d0: todayStr() });
    showToast(`Tema "${target.nome}" de ${esp} acoplado à grade.`);
  };

  const handleFocarArea = (esp) => {
    const areaTemas = temas.filter(t => !t.unstarted && matchesArea(t.esp, esp));
    if (areaTemas.length === 0) {
      const allAreaTemas = temas.filter(t => matchesArea(t.esp, esp));
      if (allAreaTemas.length > 0) {
        // Activate the first one
        const target = allAreaTemas[0];
        useStore.getState().updateTema(plat, target.id, { unstarted: false, d0: todayStr() });
        if (onStudy && setView) {
          onStudy(target.id, "d0");
          setView("dash");
        } else {
          showToast(`Tema "${target.nome}" ativado. Vá ao Painel para estudar.`);
        }
      } else {
        showToast(`Nenhum tema cadastrado em ${esp}.`);
      }
      return;
    }
    
    // Find first topic and start/resume its study
    const firstTema = areaTemas[0];
    const pendingStep = STEPS.find(s => !firstTema.rev[s.key].done);
    const stepKey = pendingStep ? pendingStep.key : "d0";

    if (onStudy && setView) {
      onStudy(firstTema.id, stepKey);
      setView("dash");
    } else {
      showToast(`Foco em ${firstTema.nome}.`);
    }
  };

  const getReadinessMentorAdvice = () => {
    const tom = meta?.tomMentor || "gentil";
    const errorTypeNames = {
      lacuna: "Lacuna de Conteúdo (esquecimento ou base teórica)",
      raciocinio: "Erro de Raciocínio (aplicação incorreta de diretriz)",
      distractor: "Pegadinha/Distrator (armadilhas nas alternativas)",
      descuido: "Descuido ou Falta de Atenção",
      nao_visto: "Matéria Não Vista anteriormente",
      interpretacao: "Erro de Interpretação do enunciado"
    };

    const type = readiness.dominantError;
    const errors = readiness.totalErrors;

    if (!errors) {
      return `Olá, ${userName}. Ainda não há erros registrados nos simulados para eu formular seu diagnóstico de desvios cognitivos. Prossiga com seus estudos e registre os simulados com o mapeamento detalhado dos erros para eu calibrar minha análise de prontidão.`;
    }

    const typeName = errorTypeNames[type] || type;

    if (type === "lacuna") {
      return tom === "gentil"
        ? `Notei que boa parte dos seus erros se deve a ${typeName}. É super normal esquecer detalhes, especialmente com o volume de matérias. Sugiro priorizar as revisões da curva para consolidar esses pontos e preencher os buracos na teoria antes de prosseguir.`
        : tom === "firme"
        ? `Seu calcanhar de Aquiles é ${typeName}. Não adianta correr com matéria nova se a base está instável. Vá para o anki e finalize todas as revisões ativas pendentes antes de fechar o dia de hoje.`
        : `Identifiquei predominância de ${typeName} nos erros de simulado. Recomendo pausar avanços rápidos no cronograma e focar a curva de revisão na consolidação ativa dos tópicos que apresentaram falhas.`;
    } else if (type === "descuido") {
      return tom === "gentil"
        ? `Identifiquei que desatenção ou descuido (${typeName}) é o padrão dominante de erros. Geralmente é cansaço acumulado. Tente respirar fundo, alongar e, na hora da prova, fazer uma leitura reversa das alternativas para manter o foco.`
        : tom === "firme"
        ? `Você está desperdiçando pontos críticos por ${typeName}. Um concorrente de alto nível não se permite errar o que sabe por pressa. Leia com caneta ativa e revise a alternativa selecionada antes de ir para a próxima.`
        : `Desvios por ${typeName} detectados. Recomendo criar um ritual pré-simulado de 3 minutos de respiração e usar marcadores visuais no enunciado para destacar exceções e negações.`;
    } else if (type === "raciocinio") {
      return tom === "gentil"
        ? `Seus erros mostram uma tendência de ${typeName}. Você entende a matéria, mas a aplicação prática na questão confunde um pouco. Tente ler os comentários das questões erradas com foco no fluxo lógico de decisão.`
        : tom === "firme"
        ? `Você está falhando em ${typeName}. Acumular teoria não aprova ninguém se o raciocínio clínico não estiver afiado. Gaste mais tempo analisando o porquê da conduta recomendada nos gabaritos comentados.`
        : `Padrão de erro por ${typeName} mapeado. Sugiro focar em engenharia reversa de gabaritos e resolução estruturada de casos clínicos nas especialidades afetadas.`;
    } else if (type === "distractor" || type === "interpretacao") {
      return tom === "gentil"
        ? `Você tem caído em pegadinhas (${typeName}). Não desanime, as bancas são mesmo espertas. O segredo é ler as alternativas com desconfiança saudável e circular palavras absolutas.`
        : tom === "firme"
        ? `A banca está te pegando em ${typeName}. Você precisa ler as questões com malícia. Desconfie de alternativas excessivamente genéricas ou restritivas e filtre os distratores antes de responder.`
        : `Predominância de erros por ${typeName}. Recomendo estudo direcionado para decodificação de enunciados, sublinhando comandos centrais (ex: 'exceto', 'incorreto') para blindar a resposta.`;
    } else {
      return `Olá, ${userName}. Seu padrão de erros atual está sob análise, com leve tendência em ${typeName}. Continue alimentando o histórico de práticas para eu apurar as recomendações.`;
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-orange-400" />
          <h2 className="text-[15px] font-bold text-gray-100">Preparo e Simulados</h2>
        </div>
        <Btn onClick={() => setModalOpen(true)} className="gap-1.5"><Plus size={16} /> Registrar Simulado</Btn>
      </div>

      {/* Tabs Menu */}
      <div className="mb-2">
        <Tabs items={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Conteúdo Aba 1: Preparo */}
      {activeTab === "painel" && (
        <div className="flex flex-col gap-5">
          <div className="bg-[var(--surface-1)] border border-blue-500/20 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-blue-400 font-black">Quando fazer o próximo simulado</p>
            <p className="text-sm text-white font-bold mt-1">{simGuidance.titulo}</p>
            <p className="text-xs text-gray-300 mt-1">{simGuidance.recomendacao}</p>
            <p className="text-[11px] text-gray-500 mt-1">{simGuidance.porque}</p>
          </div>

          {/* ROADMAP DE FASES ATÉ A PROVA */}
          {meta?.dataProva && (() => {
            const fases = ["Construção", "Stamina", "Stamina+", "Confirmação", "Lapidação"];
            const faseAtual = simRecommendation.tipo;
            return (
              <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-black mb-3">Plano até a prova</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {fases.map((fase, i) => {
                    const isAtual = fase === faseAtual || (faseAtual === "Baseline" && i === 0);
                    const isPast = fases.indexOf(faseAtual) > i;
                    return (
                      <React.Fragment key={fase}>
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          isAtual
                            ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                            : isPast
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 opacity-60"
                            : "bg-white/[0.03] border-white/5 text-gray-600"
                        }`}>
                          {isAtual && <span className="mr-1">▶</span>}{fase}
                        </div>
                        {i < fases.length - 1 && <span className="text-gray-700 text-[10px]">→</span>}
                      </React.Fragment>
                    );
                  })}
                </div>
                {simRecommendation.cobertura !== undefined && (
                  <p className="text-[10px] text-gray-500 mt-2">Cobertura atual: <strong className="text-gray-300">{simRecommendation.cobertura}%</strong> · {simRecommendation.diasRestantes}d restantes</p>
                )}
              </div>
            );
          })()}

          {/* CARD: COMO FAZER ESTE SIMULADO */}
          {(() => {
            const protocolo = getSimuladoProtocolo(simRecommendation.tipo);
            return (
              <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-black mb-3 flex items-center gap-1.5">
                  <BookOpen size={12} className="text-blue-400" />
                  Como fazer este simulado
                </p>
                <div className="flex flex-col gap-3">
                  {protocolo.map((passo, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-[10px] font-black text-gray-600 font-mono mt-0.5 shrink-0 w-4">{i + 1}.</span>
                      <div>
                        <p className="text-[11.5px] font-bold text-gray-200">{passo.t}</p>
                        <p className="text-[10.5px] text-gray-500 leading-relaxed mt-0.5">{passo.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9.5px] text-gray-600 mt-3 italic">
                  Correlação simulado↔prova é parcial (r≈0,6–0,7). Use como bússola, não como nota final.
                </p>
              </div>
            );
          })()}
          {/* BLOCK 1: PRONTIDÃO GERAL (KPIs & Volume & Ritmo) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Preparo estimado */}
            <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-blue-600/5 blur-2xl pointer-events-none" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  Preparo estimado
                  <Info size={11} className="text-gray-600 cursor-help" title="Cálculo combinado: acertos simulados (média móvel 4 últimos), retenção longa D21+, cobertura e ritmo. Componentes sem dados ainda (simulados, retenção D21) não entram no cálculo e são incluídos automaticamente quando houver histórico." />
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className={`text-4xl font-black tabular-nums ${readiness.score !== null ? (readiness.score >= 75 ? "text-emerald-400" : readiness.score >= 60 ? "text-blue-400" : "text-amber-400") : "text-gray-600"}`}>
                    {readiness.score !== null ? `${readiness.score}/100` : "—"}
                  </p>
                </div>
                {readiness.range && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Intervalo real estimado: <span className="font-bold text-white">{readiness.range[0]}% – {readiness.range[1]}%</span>
                  </p>
                )}
                {readiness.tendenciaSim !== null && readiness.tendenciaSim !== undefined && (
                  <p className={`text-[10px] font-bold mt-1 ${readiness.tendenciaSim > 0 ? "text-emerald-400" : readiness.tendenciaSim < 0 ? "text-red-400" : "text-gray-500"}`}>
                    Tendência simulados: {readiness.tendenciaSim > 0 ? "▲ melhorando" : readiness.tendenciaSim < 0 ? "▼ caindo" : "→ estável"}
                  </p>
                )}
              </div>
              <p className="text-[9.5px] text-gray-600 mt-3 leading-relaxed">
                Calcula a faixa real de probabilidade de desempenho no exame alvo ({targetProva}).
              </p>
            </div>

            {/* Volume de Questões */}
            <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-cyan-600/5 blur-2xl pointer-events-none" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                  Volume de Questões
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-4xl font-black text-cyan-400 tabular-nums">
                    {totalQuestoesFeitas(temas)}
                  </p>
                  {meta?.metaQuestoesTotal > 0 && (
                    <span className="text-xs text-gray-500">/ {meta.metaQuestoesTotal} total</span>
                  )}
                </div>
                {meta?.metaQuestoesTotal > 0 ? (
                  <div className="w-full mt-2">
                    <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-cyan-500 h-full transition-all" style={{ width: `${Math.min(100, (totalQuestoesFeitas(temas) / meta.metaQuestoesTotal) * 100)}%` }} />
                    </div>
                    <p className="text-[9px] text-gray-500 mt-1 uppercase font-black font-mono">
                      Progresso: {Math.round((totalQuestoesFeitas(temas) / meta.metaQuestoesTotal) * 100)}%
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 mt-1 italic">Configure a meta total de questões nos ajustes.</p>
                )}
              </div>
              <p className="text-[9.5px] text-gray-600 mt-3">
                Soma cumulativa de questões resolvidas em sessões ativas da curva de revisão.
              </p>
            </div>

            {/* Ritmo de Estudos */}
            <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-orange-600/5 blur-2xl pointer-events-none" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                  Equilíbrio de Ritmo
                </p>
                {ritmoPace ? (
                  <div className="mt-2 space-y-1">
                    <p className={`text-4xl font-black tabular-nums ${ritmoPace.saldo >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                      {ritmoPace.saldo >= 0 ? `+${ritmoPace.saldo}` : ritmoPace.saldo}
                    </p>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                      {ritmoPace.saldo >= 0
                        ? "Excelente! Você está adiantado nas suas metas."
                        : `Você está ${Math.abs(ritmoPace.saldo)} questões atrás do planejado.`}
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <p className="text-xl font-bold text-gray-500">—</p>
                    <p className="text-[10px] text-gray-500 italic">Meta diária não configurada. Defina nos Ajustes para ativar o Equilíbrio de Ritmo e o Preparo estimado completo.</p>
                    <button
                      type="button"
                      onClick={() => setView && setView("ajustes")}
                      className="text-[9.5px] bg-blue-600/20 text-blue-400 border border-blue-500/25 px-2 py-1 rounded-xl font-bold cursor-pointer border-none"
                    >
                      Configurar meta
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[9.5px] text-gray-600 mt-3">
                Saldo de ritmo de questões resolvidas versus planejado por dia. Recalibrável.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* BLOCK 3: DIAGNÓSTICO CONVERSACIONAL (Mentor Advice) */}
            <div className="bg-gradient-to-br from-blue-600/10 via-[var(--surface-1)] to-sky-500/10 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4 shadow-lg select-none relative overflow-hidden text-left">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-900/40 shrink-0">
                <Brain size={18} className="text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[11px] font-black uppercase text-blue-400 tracking-wider">Direcionamento do Mentor</h4>
                <p className="text-[12px] leading-relaxed text-gray-300 font-medium">
                  {getReadinessMentorAdvice()}
                </p>
              </div>
            </div>

            {/* BLOCK 4: PRÓXIMO SIMULADO ESTRATÉGICO */}
            <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden text-left">
              <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-orange-600/5 blur-2xl pointer-events-none" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  Estratégia de Simulados
                  <Info size={11} className="text-gray-600" title="Estratégia recomendada de acordo com o edital e a proximidade da prova." />
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    simRecommendation.tipo === "Baseline" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    simRecommendation.tipo === "Stamina" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    simRecommendation.tipo === "Confirmação" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    "bg-white/5 text-gray-400 border border-white/10"
                  }`}>
                    {simRecommendation.tipo}
                  </span>
                  {simRecommendation.diasRestantes > 0 && (
                    <span className="text-[10px] text-gray-400 font-bold">
                      {simRecommendation.diasRestantes}d restantes
                    </span>
                  )}
                </div>

                <h4 className="text-[13px] font-black text-gray-100 uppercase mt-3 tracking-wide">{simRecommendation.titulo}</h4>
                <p className="text-[11.5px] text-gray-400 mt-1 leading-relaxed">
                  {simRecommendation.descricao}
                </p>
                <p className="text-[10.5px] text-gray-500 italic mt-2">
                  "{simRecommendation.justificativa}"
                </p>

                {simRecommendation.focoEspecialidades.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[9.5px] text-gray-500 font-bold uppercase tracking-wider">Foco Prioritário:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {simRecommendation.focoEspecialidades.map((esp, i) => (
                        <span key={i} className="text-[9px] bg-white/5 text-gray-300 border border-white/5 px-2 py-0.5 rounded-lg font-medium">
                          {esp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-white/5 pt-3 flex justify-between items-center text-[11px]">
                <span className="text-gray-500 font-bold uppercase">Frequência:</span>
                <span className="font-black text-white uppercase">{simRecommendation.frequenciaRecomendada}</span>
              </div>
            </div>
          </div>

          {/* AÇÕES CORRETIVAS DIRECIONADAS */}
          {acoesErros.length > 0 && (
            <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-lg text-left">
              <div>
                <h3 className="text-[13px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={15} className="text-orange-400" />
                  Ações Corretivas Direcionadas (Mapeamento de Falhas)
                </h3>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Diagnósticos gerados automaticamente a partir dos tipos de erros mais frequentes nos seus simulados.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {acoesErros.map((acao) => (
                  <div key={acao.tipoErro} className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.02] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-[11.5px] font-black text-white uppercase tracking-wide">{acao.label}</span>
                        <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-black font-mono">
                          {acao.pct}% dos erros
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                        {acao.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BLOCK 2: MAPA DE PRIORIDADE (80/20 principle: Incidence × Weakness) */}
          <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-[13px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={15} className="text-blue-400" />
                  Mapa de Prioridade da Prova Alvo ({targetProva})
                </h3>
                <span className="text-[10px] text-gray-500 font-medium">Princípio 80/20: Incidência × Fraqueza</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Direcionamento inteligente baseado nas estatísticas da banca e no seu domínio (retention).
              </p>
            </div>

            {/* Aviso de Prova Default */}
            {!hasProvaSelecionada && (
              <div className="bg-amber-500/5 border border-amber-500/25 rounded-xl p-3 flex items-center gap-2 text-[11px] text-amber-400">
                <ShieldAlert size={14} className="shrink-0" />
                <span>Nenhuma prova-alvo selecionada em Ajustes. Usando padrão do foco: <strong>{targetProva}</strong>.</span>
              </div>
            )}

            {/* Card Prioridade nº 1 */}
            {topPrioridade && (
              <div className="bg-gradient-to-br from-blue-600/15 via-[#16161a] to-sky-500/5 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      🎯 Prioridade Nº 1 Agora
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ZONA_UI[topPrioridade.zona].badgeBg}`}>
                      {ZONA_UI[topPrioridade.zona].label}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-100">{topPrioridade.area}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Incidência {incLabel(topPrioridade.incidence)} ({topPrioridade.incidence.toFixed(2)}) · Domínio {topPrioridade.retention !== null ? `${topPrioridade.retention}%` : "—"} · Cobertura {topPrioridade.cobertura}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleFocarArea(topPrioridade.area)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs transition-all shadow shadow-indigo-900/20 cursor-pointer shrink-0"
                >
                  Focar Agora
                </button>
              </div>
            )}

            {/* Lista Ranqueada */}
            <div className="space-y-2 mt-2">
              {priorityList.map((item, idx) => {
                const ui = ZONA_UI[item.zona];
                const isCritical = item.zona === "vermelha" || item.zona === "roxa";
                return (
                  <div key={item.area} className={`p-4 rounded-xl border ${ui.bg} ${ui.border} transition-all hover:bg-white/[0.01]`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Ranked number, name, badges */}
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-base font-black text-gray-500 w-5 shrink-0 mt-0.5">{idx + 1}.</span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-bold text-gray-200">{item.area}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${ui.badgeBg}`}>{ui.label}</span>
                            <span className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                              Inc: {incLabel(item.incidence)} ({item.incidence.toFixed(2)})
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10.5px] text-gray-400 font-medium mt-1 flex-wrap">
                            <span>Aproveitamento: <strong className={item.retention === null ? "text-gray-500" : item.retention >= 75 ? "text-emerald-400" : "text-red-400"}>{item.retention !== null ? `${item.retention}%` : "Sem dados"}</strong></span>
                            <span>·</span>
                            <span>Cobertura: <strong className="text-gray-300">{item.cobertura}%</strong></span>
                            {item.startedCount > 0 && (
                              <>
                                <span>·</span>
                                <span>Iniciados: <strong className="text-gray-300">{item.startedCount}</strong></span>
                              </>
                            )}
                          </div>

                          {/* Temas Quentes */}
                          {item.hotTopics.length > 0 && isCritical && (
                            <div className="mt-2.5 bg-black/40 rounded-xl p-2.5 border border-white/5">
                              <p className="text-[9px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                                🔥 Temas Quentes da Prova
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {item.hotTopics.map((topic, i) => (
                                  <span key={i} className="text-[9.5px] bg-white/5 text-gray-300 px-2 py-0.5 rounded-lg border border-white/5 font-medium leading-none">
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                        {isCritical ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAdicionarFila(item.area)}
                              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 active:scale-95 text-[10px] font-bold text-gray-300 rounded-lg border border-white/10 cursor-pointer transition-all"
                            >
                              + Fila
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFocarArea(item.area)}
                              className="px-2.5 py-1.5 bg-white/10 hover:bg-blue-600 hover:text-white active:scale-95 text-[10px] font-bold text-indigo-400 rounded-lg border border-indigo-500/10 cursor-pointer transition-all"
                            >
                              Focar
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 select-none font-mono flex items-center gap-1.5">
                            Domínio ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legenda das Zonas */}
            <div className="border-t border-white/5 pt-4 mt-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Legenda de Quadrantes</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(ZONA_UI).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-0.5">
                    <span className={`text-[10.5px] font-bold ${value.text}`}>{value.label}</span>
                    <span className="text-[9px] text-gray-600 leading-tight">{value.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
                    const col = s.pct >= 80 ? "text-emerald-400" : s.pct >= 65 ? "text-blue-400" : "text-red-400";
                    const bgCol = s.pct >= 80 ? "bg-emerald-500/10" : s.pct >= 65 ? "bg-blue-500/10" : "bg-red-500/10";
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

      {/* Conteúdo Aba 4: Métricas de Elite */}
      {activeTab === "metricas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
            <h3 className="text-[13px] font-bold text-white flex items-center gap-1.5"><ShieldAlert size={16} className="text-yellow-400"/> Fator Falta de Atenção Geral</h3>
            <p className="text-4xl font-black text-yellow-400 font-mono mt-2">{analytics.indiceDescuido != null ? `${analytics.indiceDescuido}%` : "—"}</p>
            <p className="text-[11px] text-gray-500 mt-1">Proporção de erros classificados puramente como distração ou falta de atenção.</p>
          </div>

          <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
            <h3 className="text-[13px] font-bold text-white flex items-center gap-1.5"><Award size={16} className="text-emerald-400"/> Taxa de Conversão D7</h3>
            <p className="text-4xl font-black text-emerald-400 font-mono mt-2">{analytics.taxaConversao != null ? `${analytics.taxaConversao}%` : "—"}</p>
            <p className="text-[11px] text-gray-500 mt-1">Eficiência de eliminação de erros após 1 semana de consolidação activa.</p>
          </div>

          {analytics.insights?.length > 0 && (
            <div className="md:col-span-2 bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-blue-400 mb-2">💡 Direcionamento Estratégico Baseado em Dados:</p>
              <ul className="text-[12px] text-gray-300 space-y-1.5 list-disc pl-4">
                {analytics.insights.map((ins, idx) => <li key={idx}>{ins}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <SimRegistroModal
          platKey={plat}
          onClose={() => setModalOpen(false)}
          onSave={(sim) => {
            addSim(plat, sim);
            trackEvent("simulado_registrado", { plat, pct: sim?.pct ?? 0, total: sim?.total ?? 0 });
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

