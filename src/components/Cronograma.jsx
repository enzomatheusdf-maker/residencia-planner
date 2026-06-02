// src/components/Cronograma.jsx
import React, { useMemo, useState } from "react";
import { Edit2, Plus, Play, ChevronDown, ChevronUp, Calendar, BadgeCheck } from "lucide-react";
import { useStore } from "../core/store";
import { ESP_COLORS, STEPS, IMPORTANCIA, DEMO_TEMA_ID, todayStr } from "../core/fsrs";
import { parseCatalogEntry } from "../constants/catalogos";
import { getCronogramasByPlat, getDefaultCronogramaId, resolveCatalogo } from "../constants/cronogramas";
import { stepState, STATE_DOT, STATE_TW, Badge, SBadge, Btn, Input, TourBalloon, InfoTooltip } from "./Primitives";
import { CALENDAR_PROVIDER_IDS } from "../constants/calendarProviders";
import { attachCalendarIntelligence, getProviderSeed, matchMedcofTopic } from "../core/calendarProvider";
import {
  calcularDominioPrevio,
  getDominioPrevioStatus,
  getNextReviewForTema,
  getReviewDisplayMeta,
} from "../core/domainValidation";
import { getEnamedContextBadge } from "../core/enamedIntel";
import CalendarProviderSelector from "./CalendarProviderSelector";
import { ModalValidarDominio } from "./Modals";
import RetrievabilitySpark from "./RetrievabilitySpark";
import EmptyState from "./EmptyState";

const CalendarImportWizard = React.lazy(() => import("./CalendarImportWizard"));
const CalendarMappingPanel = React.lazy(() => import("./CalendarMappingPanel"));

function prioToImportancia(prio) {
  switch ((prio || "").toLowerCase()) {
    case "diamante": return "CRITICA";
    case "alta":     return "ALTA";
    case "média": case "media": return "MEDIA";
    case "baixa": case "bônus": case "bonus": return "MEDIA";
    default: return "ALTA";
  }
}

function formatShortDate(date) {
  if (!date) return "agendada";
  const [year, month, day] = String(date).split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}`;
}

export function CronoCard({ tema, onStep, onEdit, onIniciarTema, plat = "res" }) {
  const esp     = ESP_COLORS[tema.esp] || "#94a3b8";
  const dominioStatus = getDominioPrevioStatus(tema);
  const semanticNextReview = getNextReviewForTema(tema);
  const allDone = STEPS.every((s) => tema.rev[s.key].done || tema.rev[s.key].skipped) && !semanticNextReview;
  const next    = semanticNextReview
    ? { key: semanticNextReview.stepKey, label: semanticNextReview.label, desc: semanticNextReview.label }
    : STEPS.find((s) => !tema.rev[s.key].done && !tema.rev[s.key].skipped);
  const nextMeta = next ? getReviewDisplayMeta(tema, next.key) : null;
  const nextState = next ? stepState(tema.rev[next.key]) : "done";
  const imp     = IMPORTANCIA[tema.importancia || "ALTA"];
  const dominioPrevio = tema?.dominioPrevio || {};
  const enamedBadge = plat === "res" ? getEnamedContextBadge(tema.esp, tema.nome) : null;
  const isValidadoPrevio = dominioStatus.isValidated || dominioPrevio.status === "validado_previo";
  const acertoValidacao = dominioStatus.acerto != null ? Math.round(dominioStatus.acerto * 100) : null;

  const stepsWithData = STEPS.map(s => tema.rev[s.key]).filter(r => r && r.done && r.confianca != null && r.acerto != null);
  const hasVies = stepsWithData.length >= 2 && (() => {
    const avgConf = stepsWithData.reduce((acc, r) => acc + r.confianca, 0) / stepsWithData.length;
    const avgAcc = stepsWithData.reduce((acc, r) => acc + r.acerto, 0) / stepsWithData.length;
    return (avgConf * 20 - avgAcc * 100) > 15;
  })();

  return (
    <div
      className={`bg-[var(--surface-1)] border rounded-3xl overflow-hidden transition-all text-left ${
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
              {enamedBadge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 shrink-0 ${
                    enamedBadge.nivel === "alto"
                      ? "bg-orange-500/15 text-orange-400 border border-orange-500/25"
                      : enamedBadge.nivel === "medio"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-white/5 text-gray-500 border border-white/10"
                  }`}
                  title={`${enamedBadge.subarea} · ${enamedBadge.pctAbsoluto}% de ${enamedBadge.area} no ENAMED${enamedBadge.questoes ? ` (~${enamedBadge.questoes} questões)` : ""}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  Hot {enamedBadge.questoes ? `~${enamedBadge.questoes}q` : `${enamedBadge.pctAbsoluto}%`}
                </span>
              )}
              {hasVies && (
                <span
                  className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded font-medium flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  Viés Metacognitivo
                  <InfoTooltip texto="Sua confiança declarada está acima do acerto real nesta especialidade. Ajuste o nível de segurança com mais rigor." />
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
        {isValidadoPrevio && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
            <p className="text-[10px] font-bold text-emerald-200 truncate">
              Validado previamente
              {acertoValidacao != null ? ` · ${acertoValidacao}%` : ""}
              {" · Próxima revisão: "}
              <span className="text-emerald-100">
                {dominioStatus.firstReviewLabel || nextMeta?.label || "D7"} · {formatShortDate(dominioStatus.firstReviewDate || nextMeta?.date)}
              </span>
            </p>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1 flex gap-1.5 min-w-[120px]">
            {STEPS.map((s) => {
              const st2 = stepState(tema.rev[s.key]);
              const meta = getReviewDisplayMeta(tema, s.key);
              return <div key={s.key} title={`${meta.label} · ${s.desc}${meta.skipped ? " · pulado por domínio prévio" : ""}`} className={`flex-1 h-2 rounded-full transition-all ${meta.skipped ? "bg-emerald-500/40" : tema.rev[s.key].done ? "bg-emerald-500" : STATE_DOT[st2]}`} />;
            })}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RetrievabilitySpark tema={tema} />
            <span className={`text-[11px] font-semibold ${STATE_TW[nextState]}`}>RO: {nextMeta ? nextMeta.label : "Fixação"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Cronograma({ onStep, onEdit, onIniciarTema, catalogo }) {
  const {
    plat,
    cronogramaSel,
    setCronogramaSel,
    tourStep,
    setTourStep,
    calendarProvider,
    setCalendarProvider,
    saveImportedCalendarTopics,
    addTema,
    meta,
  } = useStore();
  const setMeta = useStore((s) => s.setMeta);
  const iniciarValidacaoDominioPrevio = useStore((s) => s.iniciarValidacaoDominioPrevio);
  const validarDominio = useStore((s) => s.validarDominio);
  const showToast = useStore((s) => s.showToast);
  const temas = useStore((s) => s[plat].temas);
  const planos = getCronogramasByPlat(plat);
  const selId = cronogramaSel?.[plat] || getDefaultCronogramaId(plat);
  const activeProvider = calendarProvider?.activeId || CALENDAR_PROVIDER_IDS.MEDCOF;
  const importedTopics = useMemo(
    () => calendarProvider?.importedTopics || [],
    [calendarProvider?.importedTopics]
  );
  const customTopics = useMemo(
    () => calendarProvider?.customTopics || [],
    [calendarProvider?.customTopics]
  );
  const providerTopics = useMemo(
    () => (
      activeProvider === CALENDAR_PROVIDER_IDS.USER_IMPORTED
        ? importedTopics
        : activeProvider === CALENDAR_PROVIDER_IDS.CUSTOM
          ? customTopics
          : []
    ),
    [activeProvider, importedTopics, customTopics]
  );
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showMappingPanel, setShowMappingPanel] = useState(false);
  const [temaValidando, setTemaValidando] = useState(null);
  const cat = useMemo(() => {
    if (catalogo) return catalogo;
    if (plat !== "res") return resolveCatalogo(plat, selId);
    if (activeProvider === CALENDAR_PROVIDER_IDS.MEDCOF) {
      return resolveCatalogo(plat, selId);
    }
    if (!providerTopics.length) return [];
    const byWeek = providerTopics.reduce((acc, topic) => {
      const week = topic.semana || "Sem semana definida";
      if (!acc[week]) acc[week] = [];
      acc[week].push(topic);
      return acc;
    }, {});
    return Object.entries(byWeek).map(([semana, topics], idx) => ({
      b: idx + 1,
      nome: semana,
      t: [...topics]
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
        .map((topic) => {
          const intel = attachCalendarIntelligence(topic);
          const prioridade = intel.intelligence?.enamedHotness >= 0.1 ? "Alta" : "Média";
          return [topic.temaOriginal, topic.areaCanonica || topic.area || "Outro", prioridade];
        }),
    }));
  }, [catalogo, plat, selId, activeProvider, providerTopics]);
  const showSelector = !catalogo && planos.length >= 1;
  const [q, setQ]         = useState("");
  const [filter, setFilter] = useState("todos");
  const [impFilter, setImpFilter] = useState("TODAS");
  const [openBlocks, setOpenBlocks] = useState({ 1: true });
  const [expandedTopics, setExpandedTopics] = useState({});
  const [showPlanPanel, setShowPlanPanel] = useState(true);
  const medcofTemas = useMemo(
    () => (resolveCatalogo("res", getDefaultCronogramaId("res")) || []).flatMap((bl) =>
      (bl.t || []).map((entry) => ({ nome: parseCatalogEntry(entry).nome }))
    ),
    []
  );
  const importedMappingStats = useMemo(() => {
    if (!importedTopics.length) return { mapped: 0, pending: 0 };
    const mapped = importedTopics.reduce((acc, topic) => {
      const { score } = matchMedcofTopic(topic.temaOriginal, medcofTemas);
      return acc + (score >= 0.6 ? 1 : 0);
    }, 0);
    return { mapped, pending: Math.max(0, importedTopics.length - mapped) };
  }, [importedTopics, medcofTemas]);

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

  const beginDomainValidation = (payload) => {
    if (!payload) return;
    const existingById = payload.id ? temas.find((t) => t.id === payload.id) : null;
    const existingByName = temas.find((t) => t.nome === payload.nome);
    const targetTema = existingById || existingByName;
    if (targetTema) {
      setTemaValidando(targetTema);
      return;
    }
    const newTema = {
      id: Date.now(),
      nome: payload.nome,
      esp: payload.esp || "Outro",
      prio: payload.prio || "Alta",
      importancia: payload.importancia || prioToImportancia(payload.prio || "Alta"),
      obs: payload.obs || "Tema criado para validação de domínio prévio.",
      unstarted: true,
      d0: todayStr(),
      parentTopic: payload.parentTopic || null,
    };
    addTema(plat, newTema);
    setTemaValidando(newTema);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-up text-left">
      {tourStep === "crono" && (
        <div className="bg-[var(--surface-1)] border border-blue-500/30 rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden" style={{ borderLeft: "4px solid #a78bfa" }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">
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
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-[12px] font-bold text-white flex items-center justify-center gap-1.5"
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
          <div className="bg-[var(--surface-1)] border border-white/5 rounded-3xl p-4 mb-2 select-none animate-fade-in">
            {showSelector && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[12px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-400" /> Plano Ativo + Prioridades
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowPlanPanel((v) => !v)}
                    className="text-[10px] px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-1.5"
                  >
                    {showPlanPanel ? "Minimizar" : "Expandir"}
                    {showPlanPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {showPlanPanel && (
                  <div className="space-y-3 mt-3">
                    {/* Configuração: temas por semana */}
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-black text-white uppercase tracking-wider">Temas por semana</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Quantos tópicos você quer estudar por bloco semanal</p>
                        </div>
                        <span className="text-2xl font-black text-blue-400 tabular-nums min-w-[2.5rem] text-right">{meta?.temasPerWeek ?? 6}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={12}
                        step={1}
                        value={meta?.temasPerWeek ?? 6}
                        onChange={(e) => setMeta({ ...meta, temasPerWeek: Number(e.target.value) })}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-gray-600 font-mono select-none">
                        <span>1 — leve</span>
                        <span>6 — padrão</span>
                        <span>12 — intensivo</span>
                      </div>
                      {/* Data de início do cronograma */}
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                        <div>
                          <p className="text-[10px] font-bold text-gray-300">Data de início do cronograma</p>
                          <p className="text-[9px] text-gray-600 mt-0.5">Define a semana atual na distribuição</p>
                        </div>
                        <input
                          type="date"
                          value={meta?.estrategiaStartDate || ""}
                          onChange={(e) => setMeta({ ...meta, estrategiaStartDate: e.target.value || null })}
                          className="text-[11px] bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-gray-200 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                        />
                      </div>
                    </div>

                    {plat === "res" && !catalogo && (
                      <>
                        <CalendarProviderSelector
                          activeId={activeProvider}
                          importedCount={importedTopics.length}
                          onChange={(id) => {
                            setCalendarProvider(id);
                            if (id === CALENDAR_PROVIDER_IDS.USER_IMPORTED && importedTopics.length === 0) {
                              setShowImportWizard(true);
                            }
                          }}
                          onOpenImport={() => setShowImportWizard(true)}
                          planos={planos}
                          selectedPlanId={selId}
                          onPlanChange={(id) => setCronogramaSel(plat, id)}
                        />

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setShowMappingPanel((v) => !v)}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-[11px] font-bold"
                            disabled={importedTopics.length === 0}
                          >
                            {showMappingPanel ? "Ocultar mapeamento" : "Ver mapeamento"}
                          </button>
                          <button
                            type="button"
                            onClick={() => saveImportedCalendarTopics(getProviderSeed(CALENDAR_PROVIDER_IDS.USER_IMPORTED))}
                            className="px-3 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/25 text-[11px] font-bold"
                          >
                            Usar amostra de desenvolvimento
                          </button>
                        </div>

                        <p className="text-[10px] text-gray-400">
                          {activeProvider === CALENDAR_PROVIDER_IDS.USER_IMPORTED
                            ? `Estratégia MED — importado pelo usuário · ${importedTopics.length} tópicos importados · ${importedMappingStats.mapped} mapeados · ${importedMappingStats.pending} pendentes.`
                            : activeProvider === CALENDAR_PROVIDER_IDS.CUSTOM
                              ? "Custom — trilho montado manualmente."
                              : "MEDCOF — catálogo oficial do app."}
                        </p>

                        {showMappingPanel && importedTopics.length > 0 && (
                          <React.Suspense fallback={<div className="text-[11px] text-gray-500">Carregando mapeamento...</div>}>
                            <CalendarMappingPanel importedTopics={importedTopics} medcofTemas={medcofTemas} />
                          </React.Suspense>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            <div className={`flex flex-wrap gap-3 items-center ${showSelector ? "mt-3" : ""}`}>
              <Input placeholder="Buscar tema..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-[200px]" />
              <div className="flex gap-1 bg-[#0d0d10] border border-white/5 rounded-xl p-1">
                {[["todos","Todos"],["iniciados","Iniciados"],["nao","Não iniciados"]].map(([v, l]) => (
                  <button type="button" key={v} onClick={() => setFilter(v)} className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold ${filter === v ? "bg-blue-600 text-white" : "text-gray-500"}`}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-[#0d0d10] border border-white/5 rounded-xl p-1">
                {["TODAS", "CRITICA", "ALTA", "MEDIA"].map((imp) => (
                  <button type="button" key={imp} onClick={() => setImpFilter(imp)} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${impFilter === imp ? "bg-white/10 text-white" : "text-gray-600"}`}>
                    {imp === "TODAS" ? "Todas" : IMPORTANCIA[imp]?.icon}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <Btn onClick={() => onEdit({})} className="text-[12px] gap-2"><Plus size={16} /> Novo tema</Btn>
            </div>
          </div>

          {cat.map((bl) => {
            const blTemas = bl.t.filter((entry) => {
              const { nome, subs, prio: topPrio } = parseCatalogEntry(entry);
              const nameMatches = !q || nome.toLowerCase().includes(q.toLowerCase());
              const subMatches = !q || subs.some(s => s.toLowerCase().includes(q.toLowerCase()));
              if (!nameMatches && !subMatches) return false;
              
              const mTema = temaMap.get(nome);
              const currentImp = mTema ? (mTema.importancia || prioToImportancia(topPrio)) : prioToImportancia(topPrio);
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
              <div key={bl.b} className="border border-white/5 bg-[var(--surface-1)]/25 rounded-3xl p-4 transition-all">
                <button
                  type="button"
                  onClick={() => toggleBlock(bl.b)}
                  className="w-full flex items-center justify-between text-left select-none outline-none group py-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 rounded-full bg-blue-600 group-hover:bg-sky-500 transition-colors" />
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
                          <div key={topNome} className="bg-[var(--surface-1)] border border-white/5 rounded-3xl overflow-hidden transition-all text-left">
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
                                    className="h-full bg-blue-600 rounded-full transition-all"
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
                                  const subTema = temas.find(t => (t.parentTopic === topNome && (t.nome === subName || t.nome === sub)) || t.nome === subName);
                                  const isStarted = subTema && !subTema.unstarted;

                                  if (isStarted) {
                                    const semanticNext = getNextReviewForTema(subTema);
                                    const next = semanticNext
                                      ? { key: semanticNext.stepKey, label: semanticNext.label, desc: semanticNext.label }
                                      : STEPS.find((s) => !subTema.rev[s.key].done && !subTema.rev[s.key].skipped);
                                    const nextMeta = next ? getReviewDisplayMeta(subTema, next.key) : null;
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
                                                  title={`${getReviewDisplayMeta(subTema, s.key).label} · ${s.desc}${subTema.rev[s.key].skipped ? " · pulado por domínio prévio" : ""}`}
                                                  className={`h-1.5 rounded-full flex-1 ${subTema.rev[s.key].skipped ? "bg-emerald-500/40" : subTema.rev[s.key].done ? "bg-emerald-500" : STATE_DOT[stepState(subTema.rev[s.key])]}`}
                                                />
                                              ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <RetrievabilitySpark tema={subTema} />
                                              <span className={`text-[9.5px] font-bold ${STATE_TW[nextState]}`}>
                                                RO: {nextMeta ? nextMeta.label : "Fixado"}
                                              </span>
                                            </div>
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
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-gray-400">{sub}</p>
                                        <div className="mt-2">
                                          <RetrievabilitySpark tema={subTema || { id: `sub_${topNome}_${sub}`, nome: subName, esp, unstarted: true }} />
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => onIniciarTema(subTema || { nome: subName, esp, prio: topPrio, parentTopic: topNome })}
                                          className="px-2.5 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-black transition-all border border-blue-500/10 cursor-pointer"
                                        >
                                          Iniciar revisão
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            beginDomainValidation(subTema || { nome: subName, esp, prio: topPrio, parentTopic: topNome });
                                          }}
                                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-[10px] font-black transition-all border border-white/10 flex items-center justify-center gap-1 cursor-pointer"
                                          title="Use se você já estudou este tema. O app cria validação curta: 15+ questões e 80%+ para entrar no ciclo de revisão."
                                        >
                                          <BadgeCheck size={11} /> Já domino
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      const tema = temaMap.get(topNome);
                      if (tema && !tema.unstarted) return <CronoCard key={topNome} tema={tema} plat={plat} onStep={onStep} onEdit={onEdit} onIniciarTema={onIniciarTema} />;

                      const espC  = ESP_COLORS[esp] || "#94a3b8";
                      const currentPrio = tema ? tema.prio : topPrio;
                      const currentImp = tema ? (tema.importancia || prioToImportancia(topPrio)) : prioToImportancia(topPrio);

                      return (
                        <div
                          key={topNome}
                          onClick={() => onEdit(tema || { nome: topNome, esp, prio: currentPrio, importancia: currentImp, obs: `${bl.nome || "MEDCOF Bloco " + bl.b}`, unstarted: true })}
                          className="bg-[var(--surface-1)]/60 hover:bg-[var(--surface-1)]/80 hover:border-white/10 cursor-pointer rounded-3xl p-5 flex flex-col gap-4 border border-white/5 border-dashed transition-all"
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
                            <div className="mt-3">
                              <RetrievabilitySpark tema={tema || { id: `catalog_${topNome}`, nome: topNome, esp, unstarted: true }} />
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onIniciarTema(tema || { nome: topNome, esp, prio: currentPrio, importancia: currentImp, obs: `${bl.nome || "MEDCOF Bloco " + bl.b}` });
                              }}
                              className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-600/20 text-[12px] font-bold text-blue-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Play size={13} /> Iniciar Ciclo Hoje
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                beginDomainValidation(tema || { nome: topNome, esp, prio: currentPrio, importancia: currentImp, obs: `${bl.nome || "MEDCOF Bloco " + bl.b}` });
                              }}
                              className="flex-1 py-2 rounded-xl bg-black/25 border border-white/10 hover:bg-white/10 text-[12px] font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              title="Use se você já estudou este tema. O app cria validação curta: 15+ questões e 80%+ para entrar no ciclo de revisão."
                            >
                              <BadgeCheck size={13} /> Já domino
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-relaxed">
                            Use se você já estudou este tema.
                            {" "}
                            <InfoTooltip texto="O app cria uma validação curta: 15+ questões e 80%+ para pular exposição inicial e entrar no ciclo de revisão." />
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {plat === "res" && !catalogo && activeProvider !== CALENDAR_PROVIDER_IDS.MEDCOF && cat.length === 0 && (
            <EmptyState
              icon={Calendar}
              title="Nenhum cronograma ativo"
              description="Escolha MEDCOF, importe Estrategia MED ou crie um personalizado."
              primaryAction={{ label: "Importar calendario", onClick: () => setShowImportWizard(true) }}
              secondaryAction={{
                label: "Usar amostra",
                onClick: () => saveImportedCalendarTopics(getProviderSeed(CALENDAR_PROVIDER_IDS.USER_IMPORTED)),
              }}
            />
          )}
        </>
      )}
      {showImportWizard && (
        <React.Suspense fallback={null}>
          <CalendarImportWizard
            onClose={() => setShowImportWizard(false)}
            onSave={(topics) => {
              saveImportedCalendarTopics(topics);
              setCalendarProvider(CALENDAR_PROVIDER_IDS.USER_IMPORTED);
              setShowImportWizard(false);
            }}
          />
        </React.Suspense>
      )}
      {temaValidando && (
        <ModalValidarDominio
          tema={temaValidando}
          onConfirm={({ questoes, acertos }) => {
            const resultado = calcularDominioPrevio({ total: questoes, acertos });
            validarDominio(plat, temaValidando.id, { questoes, acertos });
            if (showToast) {
              if (resultado.valido) {
                if ((resultado.intervaloInicial || 7) >= 14) {
                  showToast("Tema validado com alta segurança. Próxima revisão: D14.");
                } else {
                  showToast("Tema validado. Próxima revisão: D7.");
                }
              } else {
                showToast("Validação insuficiente. Comece pelo estudo guiado para proteger sua base.");
              }
            }
            setTemaValidando(null);
          }}
          onStartLater={() => {
            iniciarValidacaoDominioPrevio(plat, temaValidando.id);
            if (showToast) showToast("Validação marcada como pendente para este tema.");
            setTemaValidando(null);
          }}
          onCancel={() => setTemaValidando(null)}
        />
      )}
    </div>
  );
}
