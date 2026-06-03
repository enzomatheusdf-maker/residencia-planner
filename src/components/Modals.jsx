// src/components/Modals.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Calendar, FileText, Zap, Target, BookOpen, 
  TrendingUp, Award, Edit2, Trash2, Search, User, Settings, Lock
} from "lucide-react";
import { CATALOGO_RES, CATALOGO_VEST, getSubtopics } from "../constants/catalogos";
import { PROVA_STATS_RES, PROVA_STATS_VEST, PROVAS_RES, PROVAS_VEST } from "../constants/provaStats";
import { getBrainDumpFields } from "../constants/stepDefinitions";
import { useStore } from "../core/store";
import { exportMedrevBackup, importMedrevBackup, validateMedrevBackup } from "../core/backup";
import {
  classificarDominio,
  DOMINIO_META,
  DOMINIO_PREVIO_MIN_QUESTOES,
} from "../core/domainValidation";
import { readSanitizedNumber, sanitizeNumericInput } from "../core/numberInput";
import { getAnonymousStorageKey, getOrCreateAnonymousSessionId, getUserScopedStorageKey } from "../core/userScope";
import { detectLegacyGlobalStore, migrateLegacyStoreToUserScope } from "../core/userDataMigration";
import { getReadinessData } from "../core/readiness";
import { getEnamedContextBadge } from "../core/enamedIntel";

import {
  STEPS, IMPORTANCIA, ESPS_RES, ESPS_VEST,
  todayStr, diffDays, fmtFull, addDays, getWorkloadProjection
} from "../core/fsrs";
import {
  Modal, Btn, Input, Textarea, Select, Field, MedRevLogo, Tabs, InfoTooltip
} from "./Primitives";
import { useFilaInteligente } from "../hooks/useMetrics";
import { getMentorPhrase, getRecentPhrases, trackRecentPhrase } from "../core/mentor";
import { Brain } from "lucide-react";
import { auth, excluirUsuarioEDados } from "../services/firebase";
import { ACHIEVEMENTS } from "../core/achievements";

const PROVA_STATS = {
  ...PROVA_STATS_RES,
  ...PROVA_STATS_VEST
};

// ==================================================
export function HelpModal({ onClose }) {
  const [tab, setTab] = useState("secoes");
  const sections = [
    { icon: LayoutDashboard, color: "#a78bfa", title: "Hoje", desc: "Comando diário, métricas de execução de hoje, plano curto e próxima ação." },
    { icon: Calendar, color: "#60a5fa", title: "Plano", desc: "Cronograma, agenda, temas, distribuição semanal, prioridades e ajustes." },
    { icon: Target, color: "#fb923c", title: "Simulados", desc: "Estratégia de simulados, registro obrigatório, correção D7, diagnóstico por área e padrões de erro." },
    { icon: Brain, color: "#2dd4bf", title: "Raciocínio Clínico", desc: "Casos, illness scripts, SCT, diferenciais e conduta educacional." },
    { icon: Zap, color: "#fbbf24", title: "Anki Audit", desc: "Auditoria operacional diária do Anki, sessão registrada, adesão e carga de novos cards." },
    { icon: FileText, color: "#f472b6", title: "Mais", desc: "Estatísticas, Banco de Temas, Perfil, Segurança, Academia, Guia e ferramentas complementares." },
  ];
  const workflow = [
    { step: "D0", icon: BookOpen, color: "#a78bfa", label: "Estudo Inicial", desc: "Leia o conteúdo, resolva questões e registre o acerto. A curva de revisão calcula automaticamente a data das próximas revisões." },
    { step: "D1", icon: Edit2, color: "#60a5fa", label: "Brain Dump", desc: "No dia seguinte, abra o assistente e escreva tudo que lembra (5 min, material fechado). Isso consolida a memória de trabalho para longo prazo." },
    { step: "D4", icon: Target, color: "#34d399", label: "Revisão Ativa", desc: "Questões focadas no tema. Seu acerto ajusta o intervalo da próxima revisão via curva de esquecimento." },
    { step: "D7", icon: TrendingUp, color: "#fb923c", label: "Questões + Anki", desc: "Sétimo dia: questões de prova + revisão do deck Anki correspondente. Corrija os erros do simulado se houver." },
    { step: "D21", icon: Award, color: "#f472b6", label: "Interleaved", desc: "Revisão misturada com outros temas. Maior intervalo = maior retenção. Após D21, o ciclo está completo." },
  ];
  return (
    <Modal onClose={onClose} wide>
      <div className="space-y-4 text-left">
        <div className="flex items-center gap-3">
          <MedRevLogo size="md" />
          <div>
            <h2 className="text-[16px] font-bold text-white">Guia de Uso</h2>
            <p className="text-[11px] text-gray-500">Curva de revisão · v7.1</p>
          </div>
        </div>

        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          {[["secoes","Seções"], ["fluxo","Fluxo FSRS"], ["glossario","Glossário"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold transition-all ${tab === k ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "text-gray-500 hover:text-gray-300"}`}>{l}</button>
          ))}
        </div>

        {tab === "secoes" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sections.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: s.color + "20" }}>
                    <Icon size={15} style={{ color: s.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-white">{s.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "fluxo" && (
          <div className="flex flex-col gap-2">
            {workflow.map((w, i) => {
              const Icon = w.icon;
              return (
                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: w.color + "20" }}>
                    <Icon size={14} style={{ color: w.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded" style={{ background: w.color + "20", color: w.color }}>{w.step}</span>
                      <p className="text-[13px] font-bold text-gray-200">{w.label}</p>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{w.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "glossario" && (
          <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-xs font-black text-blue-400 font-mono">FSRS (Free Spaced Repetition Scheduler)</span>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Algoritmo matemático de repetição espaçada que estima o nível de estabilidade da memória baseado nas suas taxas de acertos e calcula a data ideal de revisão para garantir retenção longa.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-xs font-black text-blue-400 font-mono">D0 → D21 (Ciclo Espaçado)</span>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Intervalos fixados cientificamente: D0 (estudo inicial ativo), D1 (recuperação ativa no dia seguinte via Brain Dump), D4 (reforço de questões), D7 (questões e flashcards) e D21 (revisão interleaved misturada).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-xs font-black text-blue-400 font-mono">Retenção longa D21+</span>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                A porcentagem real de acertos nas revisões de longo prazo (etapas D21 em diante). É a métrica mais pura do seu nível de aprendizado real. Ideal acima de 80%.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-xs font-black text-blue-400 font-mono">Fila Inteligente</span>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Score dinâmico que ordena seus temas na fila considerando a urgência do FSRS (atraso) combinada com a importância da especialidade nas provas e seu peso de dificuldade.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-xs font-black text-blue-400 font-mono">Viés Metacognitivo</span>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                A diferença entre a confiança estimada pelo estudante (percepção de domínio) e a taxa de acerto real nas questões. Um delta alto de excesso de confiança indica que o estudante está negligenciando lacunas graves.
              </p>
            </div>
          </div>
        )}

        <Btn className="w-full" onClick={onClose}>Entendido — vamos estudar!</Btn>
      </div>
    </Modal>
  );
}

// ==================================================
export function CycleCompleteModal({ tema, onClose }) {
  const { plat } = useStore();
  const userName = useStore((s) => s.userName || "Estudante");
  const temas = useStore((s) => s[plat]?.temas || []);

  const safeRevValues = (rev) => Object.values(rev || {}).filter((r) => r && typeof r === "object" && !Array.isArray(r));
  const done = safeRevValues(tema.rev).filter(r => r.done && r.acerto != null);
  const avgAcerto = done.length ? Math.round(done.reduce((a, r) => a + r.acerto, 0) / done.length * 100) : 0;

  // Specialty average accuracy
  const espTemas = temas.filter(t => t.esp === tema.esp);
  let sumEsp = 0;
  let countEsp = 0;
  espTemas.forEach(t => {
    safeRevValues(t.rev).forEach(r => {
      if (r.done && r.acerto != null) {
        sumEsp += r.acerto;
        countEsp++;
      }
    });
  });
  const avgEsp = countEsp > 0 ? Math.round((sumEsp / countEsp) * 100) : null;

  // Curve analysis & Mentor phrase
  const d0 = tema.rev.d0?.acerto;
  const d21 = tema.rev.d21?.acerto || tema.rev.d7?.acerto || tema.rev.d4?.acerto;
  
  let curveMsg = "";
  let curveStatus = "normal"; // normal, positive, negative
  
  if (d0 != null && d21 != null) {
    const d0Pct = Math.round(d0 * 100);
    const d21Pct = Math.round(d21 * 100);
    if (d21Pct > d0Pct) {
      curveStatus = "positive";
      curveMsg = `Evolução positiva! Seu rendimento subiu de ${d0Pct}% no D0 para ${d21Pct}% no final do ciclo. O espaçamento FSRS consolidou o tema.`;
    } else if (d21Pct < d0Pct) {
      curveStatus = "negative";
      curveMsg = `Atenção: queda de rendimento detectada (de ${d0Pct}% no D0 para ${d21Pct}% no final). Revise os distractors e force revisões extras.`;
    } else {
      curveMsg = `Desempenho estável: você manteve a precisão constante em ${d21Pct}% do início ao fim do ciclo.`;
    }
  } else {
    curveMsg = `Ciclo concluído com média sólida de ${avgAcerto}%. Continue mantendo a constância!`;
  }

  // Mentor phrase selection (pure)
  const recent = getRecentPhrases();
  let situation = "sessao_concluida_mid";
  if (avgAcerto >= 80) situation = "sessao_concluida_high";
  else if (avgAcerto < 60) situation = "sessao_concluida_low";
  
  const { text: mentorText, id: phraseId } = getMentorPhrase(situation, {
    userName,
    tema: tema.nome,
    acerto: avgAcerto,
    data: "hoje"
  }, recent, plat);
  
  // Track selected phrase to avoid repetition
  useEffect(() => {
    if (phraseId) {
      trackRecentPhrase(phraseId);
    }
  }, [phraseId]);

  // Recommended next action
  const nextFila = useFilaInteligente(temas).filter(item => item.temaId !== tema.id);
  const nextRecomendacao = nextFila.length > 0 ? nextFila[0] : null;

  // Steps data for SVG chart
  const stepsData = [
    { key: "d0", label: "D0" },
    { key: "d1", label: "D1" },
    { key: "d4", label: "D4" },
    { key: "d7", label: "D7" },
    { key: "d21", label: "D21" }
  ].map(s => {
    const revItem = tema.rev[s.key];
    return {
      label: s.label,
      done: !!revItem?.done,
      acerto: revItem?.acerto != null ? Math.round(revItem.acerto * 100) : null
    };
  });

  // Chart coordinates
  const xCoords = [35, 95, 155, 215, 275];
  const chartWidth = 310;
  const chartHeight = 110;
  const getY = (val) => val === null ? 90 : 90 - (val / 100) * 75; // 0% is at Y=90, 100% is at Y=15

  const linePoints = stepsData
    .map((s, idx) => s.acerto !== null ? `${xCoords[idx]},${getY(s.acerto)}` : null)
    .filter(Boolean)
    .join(" ");

  const firstPointIdx = stepsData.findIndex(s => s.acerto !== null);
  const lastPointIdx = [...stepsData].reverse().findIndex(s => s.acerto !== null);
  const correctedLastIdx = lastPointIdx === -1 ? -1 : stepsData.length - 1 - lastPointIdx;
  
  let fillPoints = "";
  if (firstPointIdx !== -1 && correctedLastIdx !== -1) {
    fillPoints = `${xCoords[firstPointIdx]},90 ` + linePoints + ` ${xCoords[correctedLastIdx]},90`;
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="text-center py-2 space-y-4 max-w-md mx-auto text-left">
        <div className="text-center">
          <p className="text-5xl mb-2 animate-pulse">🎉</p>
          <h2 className="text-xl font-black text-white">Ciclo Finalizado!</h2>
          <p className="text-[12px] text-gray-400 mt-1">Você concluiu todas as etapas da curva FSRS para:</p>
          <p className="text-sm text-blue-400 font-bold mt-0.5">{tema.nome}</p>
        </div>

        {/* Chart Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Curva de Evolução de Acertos</p>
          
          <div className="w-full overflow-x-auto select-none">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[280px] h-28 mt-1">
              <defs>
                <linearGradient id="modalChartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Threshold Lines */}
              <line x1="30" y1={getY(80)} x2="280" y2={getY(80)} stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
              <text x="285" y={getY(80) + 3} fill="#10b981" fontSize="7.5" className="font-bold font-mono">80%</text>

              <line x1="30" y1={getY(60)} x2="280" y2={getY(60)} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
              
              {/* Fill */}
              {fillPoints && (
                <polygon points={fillPoints} fill="url(#modalChartGlow)" />
              )}

              {/* Line */}
              {linePoints && (
                <polyline points={linePoints} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Dots & labels */}
              {stepsData.map((s, idx) => {
                const x = xCoords[idx];
                const y = getY(s.acerto);
                return (
                  <g key={s.label}>
                    {s.acerto !== null ? (
                      <>
                        <circle cx={x} cy={y} r="3" fill="#a78bfa" stroke="#0d0d18" strokeWidth="1.5" />
                        <text x={x} y={y - 7} fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" className="font-mono">
                          {s.acerto}%
                        </text>
                      </>
                    ) : (
                      <circle cx={x} cy="90" r="2" fill="#374151" />
                    )}
                    <text x={x} y="103" fill="#4b5563" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {s.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 border border-white/5 rounded-xl p-3">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Média do Ciclo</p>
            <p className={`text-xl font-black mt-0.5 ${avgAcerto >= 80 ? "text-emerald-400" : avgAcerto >= 65 ? "text-blue-400" : "text-red-400"}`}>
              {avgAcerto}%
            </p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl p-3">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Média em {tema.esp}</p>
            <p className="text-xl font-black text-gray-200 mt-0.5">
              {avgEsp !== null ? `${avgEsp}%` : "—"}
            </p>
          </div>
        </div>

        {/* Mentor Advice */}
        <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
          curveStatus === "positive" 
            ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300"
            : curveStatus === "negative"
            ? "bg-red-500/5 border-red-500/10 text-red-300"
            : "bg-white/5 border-white/5 text-gray-300"
        }`}>
          <div className="flex items-center gap-1.5 font-bold">
            <Brain size={13} className="text-blue-400" />
            <span>Conselho do Mentor</span>
          </div>
          <p className="font-semibold text-[12px]">{curveMsg}</p>
          {mentorText && (
            <p className="text-[11px] text-gray-400 italic border-t border-white/5 pt-1.5 mt-1 leading-relaxed">
              "{mentorText}"
            </p>
          )}
        </div>

        {/* Recommended Next Action */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Próxima Recomendação FSRS</p>
            <p className="text-xs font-bold text-gray-200 truncate mt-0.5">
              {nextRecomendacao ? nextRecomendacao.temaNome : "Fila zerada por hoje!"}
            </p>
          </div>
          {nextRecomendacao && (
            <div className="text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded shrink-0">
              Etapa {nextRecomendacao.stepKey.toUpperCase()}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-bold text-[12.5px] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-blue-900/10"
        >
          Continuar Planejamento
        </button>
      </div>
    </Modal>
  );
}

// ==================================================

export function OnboardingModal({ onComplete }) {
  const [nome, setNome] = useState("");
  const [plataforma, setPlataforma] = useState("res");
  const [tempoDisponivel, setTempoDisponivel] = useState(2);
  const [provasAlvo, setProvasAlvo] = useState(["ENAMED"]);
  const [treinarRaciocinioClinico, setTreinarRaciocinioClinico] = useState(false);

  useEffect(() => {
    setProvasAlvo(plataforma === "res" ? ["ENAMED"] : []);
  }, [plataforma]);

  const handleFinalize = () => {
    if (!nome.trim()) return;
    const finalPlatQuestoes = plataforma === "res" ? "MedEvo" : "Estuda.com";
    const dataProva = addDays(todayStr(), 180);
    onComplete(nome.trim(), plataforma, {
      dataProva,
      acerto: 80,
      provasAlvo: provasAlvo.length > 0 ? provasAlvo : (plataforma === "res" ? ["ENAMED"] : []),
      horarioPreferido: "Manhã",
      tempoDisponivel,
      plataformaQuestoes: finalPlatQuestoes,
      isSegundaTentativa: false,
      areaPuxouBaixo: "",
      acertosAlvo: 0,
      totalQuestoesAlvo: 100,
        notaCorteAlvo: 0,
        notasTentativaAnterior: {},
        tomMentor: "gentil",
        estrategiaRefinada: false,
        modulos: {
          raciocinioClinico: treinarRaciocinioClinico,
        },
      });
    };

  return (
    <div className="fixed inset-0 bg-[#05050d]/97 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-[#0d0d18] border border-white/10 rounded-3xl p-6 w-full max-w-md flex flex-col gap-5 shadow-2xl shadow-slate-900/20 animate-slide-up max-h-[92vh] overflow-y-auto">
        <div className="flex flex-col items-center text-center gap-4 py-1">
          <MedRevLogo size="md" showTagline />
          <h2 className="text-xl font-black text-white mt-2">Monte seu Perfil Clínico</h2>
          <p className="text-[11px] text-gray-500">Identificação, foco de estudo e sua rotina inicial.</p>
        </div>

        <div className="w-full flex flex-col gap-4 text-left">
          <Field label="Nome completo ou como prefere ser chamado" info="Seu nome para personalizarmos os alertas e mensagens do Mentor.">
            <Input
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu primeiro nome"
              className="py-2.5 text-xs"
            />
          </Field>

          <Field label="Foco de Estudo" info="Selecione Residência Médica para temas clínicos ou Vestibular para ENEM/Vestibulares.">
            <Select value={plataforma} onChange={(e) => setPlataforma(e.target.value)}>
              <option value="res">Residência Médica</option>
              <option value="vest">Vestibular / ENEM</option>
            </Select>
          </Field>

          <Field label="Tempo disponível para estudos por dia" info="Média de horas diárias dedicadas aos estudos. Usaremos para propor o teto diário de revisões.">
            <div className="grid grid-cols-5 gap-2 bg-black border border-white/10 rounded-xl p-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((hr) => (
                <button
                  key={hr}
                  type="button"
                  onClick={() => setTempoDisponivel(hr)}
                  className={`py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border-none ${
                    tempoDisponivel === hr ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {hr}h{hr === 5 && "+"}
                </button>
              ))}
            </div>
          </Field>

            <Field label="Provas-alvo" info="Selecione as provas que quer priorizar nas recomendações e estatísticas.">
              <div className="grid grid-cols-2 gap-2">
                {(plataforma === "res" ? PROVAS_RES : PROVAS_VEST).map((prova) => {
                  const selected = provasAlvo.includes(prova);
                return (
                  <button
                    key={prova}
                    type="button"
                    onClick={() => {
                      setProvasAlvo((prev) => prev.includes(prova) ? prev.filter((p) => p !== prova) : [...prev, prova]);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selected
                        ? "bg-blue-600/20 border-blue-500/30 text-blue-300"
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {prova}
                  </button>
                );
                })}
              </div>
            </Field>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Módulos opcionais</p>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Brain size={15} className="text-cyan-400 shrink-0" />
                    Treinar Raciocínio Clínico
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTreinarRaciocinioClinico((prev) => !prev)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                    treinarRaciocinioClinico
                      ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                      : "bg-white/5 text-gray-400 border-white/10 hover:text-gray-200"
                  }`}
                >
                  {treinarRaciocinioClinico ? "Ativado" : "Opcional"}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Além de passar na prova, treine anamnese, diagnósticos diferenciais e raciocínio para o dia a dia clínico (illness scripts, casos e Script Concordance). Pode ligar/desligar depois nos Ajustes.
              </p>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-2xl text-left space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 text-base">🎻</span>
              <h3 className="text-xs font-black text-indigo-300 uppercase tracking-wider">Maestro, não Banco de Questões</h3>
            </div>
            <p className="text-[10.5px] text-gray-400 leading-relaxed">
              O MedRev é seu <strong>maestro de revisão</strong>, não um banco de questões. Ele decide <strong>o que</strong> e <strong>quando</strong> revisar, com base na ciência do esquecimento — e te manda resolver as questões na sua plataforma preferida. Pense nele como o técnico, não o campo.
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 pt-2">
          <Btn className="flex-1 py-3 font-bold" onClick={handleFinalize} disabled={!nome.trim()}>🏁 Finalizar Perfil e Começar
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ==================================================
export function StructuredErrorsList({ erros, onChange, plat, esp }) {
  const subtopics = useMemo(() => getSubtopics(plat, esp), [plat, esp]);

  const addErro = () => {
    const newErro = {
      id: Date.now() + Math.random(),
      subtopico: subtopics[0] || "",
      tipoErro: "lacuna",
      anotacao: "",
      virouCard: false,
      revisado: false
    };
    onChange([...erros, newErro]);
  };

  const removeErro = (id) => {
    onChange(erros.filter(e => e.id !== id));
  };

  const updateErro = (id, fields) => {
    onChange(erros.map(e => e.id === id ? { ...e, ...fields } : e));
  };

  const tiposErro = [
    { k: "lacuna", l: "Lacuna de Conteúdo" },
    { k: "raciocinio", l: "Erro de Raciocínio" },
    { k: "distractor", l: "Caiu em Distrator" },
    { k: "descuido", l: "Descuido / Falta de Atenção" },
    { k: "nao_visto", l: "Conteúdo Não Visto" },
    ...(plat === "vest" ? [{ k: "interpretacao", l: "Erro de Interpretação" }] : [])
  ];

  return (
    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3 animate-fade-up">
      <div className="flex justify-between items-center">
        <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wide">🔍 Mapeamento de Erros Estruturados:</p>
        <button
          type="button"
          onClick={addErro}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-all"
        >
          + Adicionar Erro
        </button>
      </div>

      {erros.length === 0 ? (
        <p className="text-[11px] text-gray-500 italic text-center">Nenhum erro registrado. Clique em "+ Adicionar Erro".</p>
      ) : (
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {erros.map((e, idx) => (
            <div key={e.id} className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-2 relative">
              <button
                type="button"
                onClick={() => removeErro(e.id)}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-400 text-xs"
                title="Excluir erro"
              >
                ✕
              </button>
              
              <div className="text-[10px] text-gray-400 font-bold font-mono">ERRO #{idx + 1}</div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[9px] text-gray-500 uppercase font-bold">Subtópico</label>
                  {subtopics.length > 0 ? (
                    <select
                      value={e.subtopico}
                      onChange={(evt) => updateErro(e.id, { subtopico: evt.target.value })}
                      className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-blue-500"
                    >
                      {subtopics.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={e.subtopico}
                      onChange={(evt) => updateErro(e.id, { subtopico: evt.target.value })}
                      placeholder="Ex: Fórmula tal"
                      className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-blue-500"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] text-gray-500 uppercase font-bold">Tipo de Erro</label>
                  <select
                    value={e.tipoErro}
                    onChange={(evt) => updateErro(e.id, { tipoErro: evt.target.value })}
                    className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-blue-500"
                  >
                    {tiposErro.map(t => <option key={t.k} value={t.k}>{t.l}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] text-gray-500 uppercase font-bold">Anotação / O que errou?</label>
                <input
                  type="text"
                  value={e.anotacao}
                  onChange={(evt) => updateErro(e.id, { anotacao: evt.target.value })}
                  placeholder="Ex: Confundi sinal na fórmula..."
                  className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-[10.5px] text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={e.virouCard}
                    onChange={(evt) => updateErro(e.id, { virouCard: evt.target.checked })}
                    className="rounded border-white/20 text-blue-600 focus:ring-blue-500 bg-black"
                  />
                  <span>Criou card?</span>
                </label>

                <label className="flex items-center gap-1.5 text-[10.5px] text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={e.revisado}
                    onChange={(evt) => updateErro(e.id, { revisado: evt.target.checked })}
                    className="rounded border-white/20 text-blue-600 focus:ring-blue-500 bg-black"
                  />
                  <span>Revisado?</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================================================
// ==================================================
function RedacaoInputs({ c1, setC1, c2, setC2, c3, setC3, c4, setC4, c5, setC5 }) {
  const sum = (+c1 || 0) + (+c2 || 0) + (+c3 || 0) + (+c4 || 0) + (+c5 || 0);
  const comps = [
    { k: "c1", l: "C1: Norma Culta", val: c1, set: setC1, desc: "Gramática, ortografia, pontuação" },
    { k: "c2", l: "C2: Tema e Gênero", val: c2, set: setC2, desc: "Compreensão do tema e tipo de texto" },
    { k: "c3", l: "C3: Argumentação", val: c3, set: setC3, desc: "Coerência, seleção de ideias e tese" },
    { k: "c4", l: "C4: Coesão", val: c4, set: setC4, desc: "Recursos coesivos e conectivos" },
    { k: "c5", l: "C5: Proposta", val: c5, set: setC5, desc: "Ação, agente, meio, efeito e detalhe" }
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {comps.map(c => (
          <div key={c.k} className="space-y-1 bg-black/40 border border-white/5 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-black text-gray-300 uppercase tracking-wider">{c.l}</label>
              <span className="text-[9px] text-gray-500 font-medium">{c.desc}</span>
            </div>
            <select
              value={c.val}
              onChange={(e) => c.set(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500 transition-all mt-1"
            >
              {[200, 160, 120, 80, 40, 0].map(val => (
                <option key={val} value={val}>{val} pts</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 mt-2">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nota Final Calculada</span>
        <span className={`text-2xl font-black font-mono ${sum >= 800 ? "text-emerald-400" : sum >= 600 ? "text-blue-400" : "text-red-400"}`}>
          {sum} / 1000
        </span>
      </div>
    </div>
  );
}

export function MarkModal({ tema, stepKey, onConfirm, onCancel }) {
  const step    = STEPS.find((s) => s.key === stepKey) || (
    stepKey === "manutencao"
      ? { key: "manutencao", label: "Manutenção", desc: "Revisão de manutenção", checkbox: false }
      : { key: stepKey, label: String(stepKey || "").toUpperCase(), desc: "Revisão", checkbox: false }
  );
  const plat    = useStore((s) => s.plat);
  const [questoes, setQuestoes] = useState("");
  const [acertos, setAcertos]   = useState("");
  const [erros, setErros]       = useState([]);

  // Sprint 4 states
  const [comoFoi, setComoFoi] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [ansiedade, setAnsiedade] = useState("Normal");
  const [cansaco, setCansaco] = useState("Normal");
  const [confianca, setConfianca] = useState("Média");
  const [foco, setFoco] = useState("Normal");
  const [tempoMin, setTempoMin] = useState("");
  const sugerirDetalhes = useMemo(() => Math.random() < 0.25, []);

  // Redação states
  const [c1, setC1] = useState(160);
  const [c2, setC2] = useState(160);
  const [c3, setC3] = useState(160);
  const [c4, setC4] = useState(160);
  const [c5, setC5] = useState(160);

  // D1 self-evaluation state
  const [d1ForgotFields, setD1ForgotFields] = useState({});
  const brainDumpFields = useMemo(() => getBrainDumpFields(plat, tema?.esp), [plat, tema?.esp]);

  const isD1  = step.checkbox;
  const isRedacao = tema?.esp === "Redação";

  const totalQuestoes = +questoes || 0;
  const certasQuestoes = +acertos || 0;
  const pct = totalQuestoes > 0 ? Math.round((certasQuestoes / totalQuestoes) * 100) : 0;
  const showErroBox = pct < 75 && totalQuestoes > 0 && !isRedacao;

  const col   = pct >= 90 ? "text-emerald-400" : pct >= 75 ? "text-blue-400" : pct >= 55 ? "text-yellow-400" : "text-red-400";
  const label = pct >= 90 ? "Domínio sólido 🎯" : pct >= 75 ? "Bom progresso" : pct >= 55 ? "Em consolidação" : "Ponto fraco — revise mais";
  
  const isInvalid = !isRedacao && (totalQuestoes <= 0 || certasQuestoes > totalQuestoes);
  const confirmDisabled = !isD1 && isInvalid;

  // Calculate dynamic D1 acerto
  const forgotCount = Object.keys(d1ForgotFields).filter(k => d1ForgotFields[k]).length;
  let d1Acerto = 1.0;
  if (forgotCount === 1) d1Acerto = 0.85;
  else if (forgotCount === 2) d1Acerto = 0.65;
  else if (forgotCount >= 3) d1Acerto = 0.40;

  // Calculate Redação acerto
  const sumRedacao = (+c1 || 0) + (+c2 || 0) + (+c3 || 0) + (+c4 || 0) + (+c5 || 0);
  const redacaoAcerto = sumRedacao / 1000;

  return (
    <Modal onClose={onCancel}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-black text-[13px] shrink-0 font-mono">
          {step.label}
        </div>
        <div className="text-left">
          <p className="text-[14px] font-bold text-gray-100">{step.desc}</p>
          <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">{tema.nome}</p>
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {isD1 ? (
        <div className="space-y-4 text-left">
          <div className="bg-[#141421]/60 border border-blue-500/10 rounded-2xl p-4 mb-2">
            <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider">Auto-avaliação do Brain Dump</h4>
            <p className="text-[11.5px] text-gray-400 mt-1 leading-relaxed">
              Compare seu esforço de memória com o material. Marque o que você acabou esquecendo ou confundindo para calibrar o motor FSRS:
            </p>
          </div>

          <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1 text-left">
            {brainDumpFields.map(field => {
              const isForgot = !!d1ForgotFields[field.k];
              return (
                <label key={field.k} className="flex items-center gap-2.5 p-2.5 bg-black/40 border border-white/5 rounded-xl cursor-pointer select-none text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={isForgot}
                    onChange={(e) => setD1ForgotFields({ ...d1ForgotFields, [field.k]: e.target.checked })}
                    className="rounded border-white/20 text-blue-600 focus:ring-blue-500 bg-black cursor-pointer"
                  />
                  <span>Esqueci detalhes de {field.label.replace(/^[^\s]+\s+/, "")}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {isRedacao ? (
            <RedacaoInputs
              c1={c1} setC1={setC1}
              c2={c2} setC2={setC2}
              c3={c3} setC3={setC3}
              c4={c4} setC4={setC4}
              c5={c5} setC5={setC5}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 text-left">
                <Field label="Questões resolvidas" info="Quantidade total de exercícios práticos que você realizou na plataforma externa para este tema.">
                  <Input type="number" min={0} value={questoes} onChange={(e) => setQuestoes(e.target.value)} placeholder="ex: 20" />
                </Field>
                <Field label="Quantas acertou?" info="O número de acertos que obteve no bloco de questões (usado para calcular sua taxa de acerto no FSRS).">
                  <Input type="number" min={0} value={acertos} onChange={(e) => setAcertos(e.target.value)} placeholder="ex: 15" />
                </Field>
              </div>

              {totalQuestoes > 0 && (
                <div className="text-left">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Acerto calculado</span>
                    <span className={`text-3xl font-black font-mono tabular-nums ${col}`}>{pct}%</span>
                  </div>
                  <div className="text-[11px] text-right text-gray-500 italic">{label}</div>
                </div>
              )}

              {isInvalid && totalQuestoes > 0 && (
                <p className="text-[11px] text-red-400 italic text-left">Número de acertos não pode ser maior que o total de questões.</p>
              )}
            </>
          )}

          {/* Como Foi Emoji Selector */}
          <div className="space-y-2 text-left border-t border-white/5 pt-3">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Como foi o estudo deste tema? (Opcional)</label>
            <div className="flex gap-4">
              {[
                { key: "ruim", emoji: "😣", label: "Ruim / Exausto" },
                { key: "normal", emoji: "😐", label: "Ok / Normal" },
                { key: "bom", emoji: "🙂", label: "Bem / Produtivo" }
              ].map(item => {
                const isSelected = comoFoi === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setComoFoi(item.key);
                      if (item.key === "ruim") {
                        setCansaco("Alto");
                        setAnsiedade("Alta");
                        setConfianca("Baixa");
                      } else if (item.key === "normal") {
                        setCansaco("Normal");
                        setAnsiedade("Normal");
                        setConfianca("Média");
                      } else if (item.key === "bom") {
                        setCansaco("Baixo");
                        setAnsiedade("Baixa");
                        setConfianca("Alta");
                      }
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all duration-300 ${
                      isSelected 
                        ? "bg-blue-600/20 border-blue-500 text-white scale-[1.03]" 
                        : "bg-black/40 border-white/5 text-gray-400 hover:bg-black/60 hover:text-white"
                    }`}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[9px] font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible Details */}
          <div className="text-left">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className={`w-full py-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                showDetails 
                  ? "bg-white/10 border-white/10 text-white" 
                  : sugerirDetalhes 
                  ? "bg-blue-950/40 border-blue-500/40 text-blue-300 hover:bg-blue-900/40 hover:border-blue-500 animate-pulse" 
                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>📊 {showDetails ? "Ocultar Detalhes" : "Adicionar Detalhes / Refinar Diagnóstico"}</span>
              {sugerirDetalhes && !showDetails && <span className="bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold font-mono">Amostra</span>}
            </button>
            
            {sugerirDetalhes && !showDetails && (
              <p className="text-[10px] text-blue-400/80 mt-1 text-center italic leading-normal">
                💡 Coleta Amostral Diagnóstica: Considere expandir e detalhar como se sente hoje para calibrar o Mentor!
              </p>
            )}

            {showDetails && (
              <div className="border border-white/5 bg-black/20 rounded-2xl p-4 space-y-4 animate-fade-in mt-3">
                <div className="space-y-1">
                  <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide font-semibold">Nível de Cansaço / Exaustão</label>
                  <div className="flex gap-2">
                    {["Baixo", "Normal", "Alto"].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCansaco(val)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          cansaco === val 
                            ? "bg-blue-600 border-blue-500 text-white font-bold" 
                            : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide font-semibold">Ansiedade Subjetiva</label>
                  <div className="flex gap-2">
                    {["Baixa", "Normal", "Alta"].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAnsiedade(val)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          ansiedade === val 
                            ? "bg-blue-600 border-blue-500 text-white font-bold" 
                            : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide font-semibold">Confiança no Conteúdo</label>
                  <div className="flex gap-2">
                    {["Baixa", "Média", "Alta"].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setConfianca(val)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          confianca === val 
                            ? "bg-blue-600 border-blue-500 text-white font-bold" 
                            : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide font-semibold">Foco no Estudo</label>
                  <div className="flex gap-2">
                    {["Baixo", "Normal", "Alto"].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFoco(val)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          foco === val 
                            ? "bg-blue-600 border-blue-500 text-white font-bold" 
                            : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wide font-semibold">Tempo de Estudo (minutos)</label>
                  <Input
                    type="number"
                    min={1}
                    value={tempoMin}
                    onChange={(e) => setTempoMin(e.target.value)}
                    placeholder="Tempo gasto em minutos"
                  />
                </div>

                {!isRedacao && pct != null && pct < 75 && (
                  <div className="border-t border-white/5 pt-3">
                    <StructuredErrorsList erros={erros} onChange={setErros} plat={plat} esp={tema.esp} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-white/5 mt-2">
        <Btn className="flex-1"
          disabled={confirmDisabled}
          onClick={() => onConfirm({
            acerto: isD1 ? d1Acerto : (isRedacao ? redacaoAcerto : pct / 100),
            questoes: isD1 ? 1 : (isRedacao ? 5 : totalQuestoes || null),
            motivosErro: showErroBox ? erros.map(e => e.tipoErro) : [],
            erros: showErroBox ? erros : [],
            c1: isRedacao ? +c1 : undefined,
            c2: isRedacao ? +c2 : undefined,
            c3: isRedacao ? +c3 : undefined,
            c4: isRedacao ? +c4 : undefined,
            c5: isRedacao ? +c5 : undefined,
            tempoMin: +tempoMin || null,
            ansiedade,
            cansaco,
            confianca,
            foco
          })}>
          ✓ Confirmar
        </Btn>
        <Btn variant="ghost" className="flex-1" onClick={onCancel}>Cancelar</Btn>
      </div>
    </Modal>
  );
}

const getRecomendacao = (esp, provasAlvo = []) => {
  if (!provasAlvo || provasAlvo.length === 0) {
    return { nivel: "Média", msg: "Nenhuma prova alvo selecionada em Ajustes. Defina suas metas para obter recomendações direcionadas." };
  }

  const matches = [];
  provasAlvo.forEach((pr) => {
    const provaData = PROVA_STATS[pr];
    if (!provaData) return;
    
    // Mapear especialidade para o nome na prova
    let searchKey = esp;
    if (esp === "Cirurgia") searchKey = "Cirurgia Geral";
    if (esp === "Preventiva") {
      searchKey = "Preventiva";
      if (provaData.concorrencia && !provaData.concorrencia[searchKey] && provaData.concorrencia["Preventiva/MFC"]) {
        searchKey = "Preventiva/MFC";
      }
    }

    const concorrencia = provaData.concorrencia?.[searchKey] || provaData.concorrencia?.[esp];
    const temas = provaData.temasQuentes?.[searchKey] || provaData.temasQuentes?.[esp] || [];
    
    if (concorrencia) {
      let nivel = "Média";
      if (concorrencia === "altíssima" || concorrencia === "alta") nivel = "Risco Crítico";
      else if (concorrencia === "média-alta" || concorrencia === "média") nivel = "Alta";
      
      let msg = `Concorrência ${concorrencia} em ${pr}.`;
      if (temas.length > 0) {
        msg += ` Temas quentes: ${temas.join(", ")}.`;
      }
      matches.push({ prova: pr, nivel, msg });
    }
  });

  if (matches.length === 0) {
    return { nivel: "Média", msg: `Incidência regular nas provas selecionadas (${provasAlvo.join(", ")}).` };
  }

  const weight = { "Risco Crítico": 3, "Alta": 2, "Média": 1 };
  matches.sort((a, b) => weight[b.nivel] - weight[a.nivel]);

  const top = matches[0];
  const otherCriticals = matches.slice(1).filter((m) => m.nivel === "Risco Crítico").map((m) => m.prova);

  let label = `${top.prova}: ${top.msg}`;
  if (otherCriticals.length > 0) {
    label += ` (Também é crítico em: ${otherCriticals.join(", ")})`;
  }

  return { nivel: top.nivel, msg: label };
};

export function TemaModal({ initial, platKey, onSave, onCancel, onDelete }) {
  const openConfirm = useStore((s) => s.openConfirm);
  const esps = platKey === "res" ? ESPS_RES : ESPS_VEST;
  const meta = useStore((s) => s.meta) || { provasAlvo: [] };
  const [f, setF] = useState(() => {
    const defaults = {
      nome: "",
      esp: esps[0],
      d0: todayStr(),
      prio: "Alta",
      importancia: "ALTA",
      obs: "",
      pico: "",
      ankiDeck: ""
    };
    return { ...defaults, ...initial };
  });
  const [showOptional, setShowOptional] = useState(!!(initial?.ankiDeck || initial?.pico || initial?.obs));

  const filteredProvas = (meta.provasAlvo || []).filter(p => (platKey === "res" ? PROVAS_RES : PROVAS_VEST).includes(p));
  const rec = getRecomendacao(f.esp, filteredProvas);
  const enamedBadge = useMemo(
    () => platKey === "res" ? getEnamedContextBadge(f.esp, f.nome) : null,
    [platKey, f.esp, f.nome]
  );

  useEffect(() => {
    setF((prev) => ({ ...prev, prio: rec.nivel }));
  }, [f.esp, rec.nivel]);

  return (
    <Modal onClose={onCancel}>
      <h2 className="text-[15px] font-bold text-gray-100">
        {initial?.id ? "Editar tema" : initial?.unstarted ? "Priorizar Tópico" : "Novo tema"}
      </h2>

      <Field label="Nome do tema" info="O nome do tema ou assunto estudado (ex: Trauma de Tórax, Eletrodinâmica).">
        <Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="ex: Trauma de Tórax" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Área" info="Grande área ou especialidade do tema para peso de importância e organização.">
          <Select value={f.esp} onChange={(e) => setF({ ...f, esp: e.target.value })}>
            {esps.map((e) => <option key={e}>{e}</option>)}
          </Select>
        </Field>
        <Field label="Data D0" info="A data em que o estudo teórico inicial foi (ou será) realizado.">
          <Input type="date" value={f.d0} onChange={(e) => setF({ ...f, d0: e.target.value })} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-1.5">
            Recomendação Estratégica (Baseada nas Provas Alvo)
          </p>
          <div className={`p-3 rounded-xl border text-[11.5px] leading-relaxed transition-all ${
            rec.nivel === "Risco Crítico"
              ? "bg-red-500/5 border-red-500/20 text-red-300"
              : rec.nivel === "Alta"
              ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-300"
              : "bg-white/5 border-white/10 text-gray-400"
          }`}>
            <span className="font-bold block mb-1">
              {rec.nivel === "Risco Crítico" ? "🔴 " : rec.nivel === "Alta" ? "🟣 " : "⚪ "}
              {rec.nivel.toUpperCase()}
            </span>
            {rec.msg}
          </div>
        </div>
        {enamedBadge && (
          <div className="col-span-2">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-1.5">
              Incidência no ENAMED
            </p>
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              enamedBadge.nivel === "alto"
                ? "bg-orange-500/5 border-orange-500/20"
                : enamedBadge.nivel === "medio"
                ? "bg-amber-500/5 border-amber-500/20"
                : "bg-white/5 border-white/10"
            }`}>
              <span className="text-base shrink-0 leading-none mt-0.5">🔥</span>
              <div>
                <p className={`text-[11.5px] font-bold leading-snug ${
                  enamedBadge.nivel === "alto" ? "text-orange-300"
                  : enamedBadge.nivel === "medio" ? "text-amber-300"
                  : "text-gray-400"
                }`}>
                  {enamedBadge.subarea}
                  {enamedBadge.questoes ? ` · ~${enamedBadge.questoes} questões` : ` · ${enamedBadge.pctAbsoluto}%`}
                </p>
                <p className="text-[10.5px] text-gray-500 mt-0.5">
                  {enamedBadge.pctAbsoluto}% de {enamedBadge.area} no corpus ENAMED analisado
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="col-span-2">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-1.5">Importância Prova</p>
          <div className="flex gap-1 bg-black border border-white/10 rounded-xl p-0.5">
            {Object.entries(IMPORTANCIA).map(([k, v]) => (
              <button type="button" key={k} onClick={() => setF({ ...f, importancia: k })}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${f.importancia === k ? "bg-white/10 text-white" : "text-gray-500"}`}>
                {v.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button type="button" onClick={() => setShowOptional(!showOptional)} className="text-[11px] text-gray-500 hover:text-gray-300 font-semibold flex items-center gap-1.5 py-2 transition-colors">
        Campos opcionais {showOptional ? '▲' : '▼'}
      </button>

      {showOptional && (
        <>
          <Field label="Deck do Anki Correspondente (opcional)" info="Caso sincronize este tema com o Anki, insira o nome do deck correspondente.">
            <Input value={f.ankiDeck || ""} onChange={(e) => setF({ ...f, ankiDeck: e.target.value })} placeholder="ex: Medicina::Cirurgia::Trauma" />
          </Field>

           {platKey !== "vest" && (
            <Field label="PICO / Caso Clínico (opcional)" info="Resumo clínico rápido no padrão Paciente-Intervenção-Comparação-Outcome.">
              <Textarea
                rows={2}
                value={f.pico || ""}
                onChange={(e) => setF({ ...f, pico: e.target.value })}
                placeholder="ex: Paciente 25a, dor periumbilical migratória, febre leve. Conduta inicial?"
              />
            </Field>
          )}

          <Field label="Fonte / obs (opcional)" info="Anotação curta da origem do material ou observações adicionais.">
            <Input value={f.obs} placeholder="ex: MEDCOF Bloco 2" onChange={(e) => setF({ ...f, obs: e.target.value })} />
          </Field>
        </>
      )}

      <div className="flex gap-2 pt-1">
        <Btn className="flex-1" onClick={() => f.nome && onSave(f)} disabled={!f.nome}>Salvar</Btn>
        <Btn variant="ghost" className="flex-1" onClick={onCancel}>Cancelar</Btn>
        {initial && (
          <Btn
            variant="danger"
            onClick={() =>
              openConfirm({
                title: "Deletar tema",
                message: `Deletar "${initial.nome}"? Esta ação não pode ser desfeita facilmente.`,
                confirmLabel: "Deletar",
                danger: true,
                onConfirm: () => onDelete(initial.id),
              })
            }
          >
            <Trash2 size={16} />
          </Btn>
        )}
      </div>
    </Modal>
  );
}

// ==================================================
export function AjustesModal({
  onClose,
  overdueCount,
  onResetOnboarding,
  initialTab = "perfil",
  authScope = null,
  syncStatus = "saved",
}) {
  const { meta, setMeta, plat, setPlat, optimize, sprint, setSprint, userName, setUserName, userEmail, setUserEmail, gamif, toggleModulo } = useStore();
  const showToast = useStore((s) => s.showToast);
  const openConfirm = useStore((s) => s.openConfirm);
  const temas = useStore((s) => s[plat]?.temas || []);
  const simulados = useStore((s) => s[plat]?.simulados || []);
  const saveMeta = (newFields) => {
    setMeta({ ...meta, ...newFields, estrategiaRefinada: true });
  };
  const saveMetaNumber = (field, rawValue, options, fallback = null) => {
    const value = readSanitizedNumber(rawValue, options);
    if (value == null) {
      if (fallback != null) saveMeta({ [field]: fallback });
      return;
    }
    saveMeta({ [field]: value });
  };
  const esps = plat === "res" ? ESPS_RES : ESPS_VEST;

  const readiness = getReadinessData({ temas, simulados, meta, plat });
  const sprintRedAreas = (readiness.priorityList || [])
    .filter(p => p.zona === "vermelha")
    .map(p => {
      let name = p.area;
      if (name === "Cirurgia Geral") name = "Cirurgia";
      return name;
    })
    .filter(name => esps.includes(name));

  const aplicarFocoProva = () => {
    if (sprintRedAreas.length === 0) return;
    setSprint({
      ...sprint,
      ativa: true,
      semana: sprint.semana || `Foco ${readiness.targetProva}`,
      esps: sprintRedAreas
    });
  };
  const [activeTab, setActiveTab] = useState(initialTab || "perfil");
  useEffect(() => {
    setActiveTab(initialTab || "perfil");
  }, [initialTab]);
  const [customPauseDays, setCustomPauseDays] = useState("10");
  const [importFeedback, setImportFeedback] = useState(null);
  const daysLeft = meta.dataProva ? diffDays(todayStr(), meta.dataProva) : null;
  const urgency  = daysLeft == null ? "" : daysLeft <= 30 ? "text-red-400" : daysLeft <= 90 ? "text-yellow-400" : "text-blue-400";
  const currentUid = authScope?.uid || auth.currentUser?.uid || null;
  const scopeKey = authScope?.scopeKey || (
    currentUid
      ? getUserScopedStorageKey(currentUid)
      : getAnonymousStorageKey(getOrCreateAnonymousSessionId())
  );
  const legacyStore = detectLegacyGlobalStore();
  const isolationStatus = currentUid && scopeKey.includes(`:user:${currentUid}:`) ? "isolado" : "risco detectado";

  const xpAudit = gamif?.xpAudit || { acertos: 0, constancia: 0, outros: 0 };
  const totalAuditXp = (xpAudit.acertos || 0) + (xpAudit.constancia || 0) + (xpAudit.outros || 0);
  
  const pctAcertos = totalAuditXp > 0 ? Math.round((xpAudit.acertos / totalAuditXp) * 100) : 0;
  const pctConstancia = totalAuditXp > 0 ? Math.round((xpAudit.constancia / totalAuditXp) * 100) : 0;
  const pctOutros = totalAuditXp > 0 ? Math.round((xpAudit.outros / totalAuditXp) * 100) : 0;

  const tabs = [
    { k: "perfil", label: "Perfil", icon: User },
    { k: "ajustes", label: "Ajustes", icon: Settings },
    { k: "dados", label: "Estudos", icon: BookOpen },
    { k: "conta", label: "Conta", icon: Lock }
  ];

  const toggleSprintEsp = (esp) => {
    const currentEsps = sprint?.esps || [];
    if (currentEsps.includes(esp)) {
      setSprint({ ...sprint, esps: currentEsps.filter(e => e !== esp) });
    } else {
      setSprint({ ...sprint, esps: [...currentEsps, esp] });
    }
  };

  const handleExportBackup = () => {
    const state = useStore.getState();
    const backupData = exportMedrevBackup(state, {
      ownerUid: currentUid,
      appVersion: process.env.REACT_APP_VERSION || process.env.npm_package_version || "unknown",
    });

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `medrev_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        const validated = validateMedrevBackup(backup);
        if (!validated.valid) {
          showToast(`Arquivo de backup invalido: ${validated.errors.join(" | ")}`);
          return;
        }
        setImportFeedback(validated);
        openConfirm({
          title: "Importar backup",
          message: "Deseja importar este backup? Seus dados atuais deste usuario serao sobrescritos.",
          confirmLabel: "Importar",
          danger: true,
          onConfirm: () => {
            const imported = importMedrevBackup(backup, {
              currentUid,
              currentMeta: useStore.getState().meta,
              preserveLocalMeta: false,
            });
            if (!imported.ok) {
              showToast(imported.errors?.[0] || "Falha ao importar backup.");
              return;
            }
            useStore.setState({ ...imported.patch, updatedAt: Date.now() });
            showToast("Backup importado com sucesso!");
            onClose();
          }
        });
      } catch (err) {
        showToast("Erro ao processar o arquivo de backup: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleMigrateLegacy = () => {
    if (!currentUid) {
      showToast("Faca login para migrar dados legados.");
      return;
    }
    if (!legacyStore.found) {
      showToast("Nao ha store legada global para migracao.");
      return;
    }

    openConfirm({
      title: "Migrar dados legados",
      message: `Foi detectada a chave '${legacyStore.key}'. Migrar para o escopo atual deste uid?`,
      confirmLabel: "Migrar",
      danger: true,
      onConfirm: () => {
        const migration = migrateLegacyStoreToUserScope(currentUid, { confirm: true });
        if (!migration.ok) {
          showToast(`Falha na migracao: ${migration.error}`);
          return;
        }
        showToast("Migracao legada concluida.");
      },
    });
  };

  const handleExcluirConta = async () => {
    if (!auth.currentUser) {
      showToast("Nenhum usuário logado.");
      return;
    }
    openConfirm({
      title: "Excluir conta",
      message: "Você tem certeza que deseja excluir sua conta permanentemente? Todos os seus dados serão apagados.",
      confirmLabel: "Continuar",
      danger: true,
      onConfirm: () => {
        openConfirm({
          title: "Confirmação final",
          message: "Para excluir seus dados definitivamente da nossa base, confirme novamente.",
          confirmLabel: "Excluir conta",
          danger: true,
          onConfirm: async () => {
            try {
              const res = await excluirUsuarioEDados(auth.currentUser.uid);
              if (res.sucesso) {
                showToast("Sua conta foi excluída com sucesso.");
                useStore.getState().resetStore();
                onClose();
              } else if (res.erro && res.erro.includes("requires-recent-login")) {
                showToast("Ação requer login recente. Faça login novamente e tente de novo.");
              } else {
                showToast(`Erro ao excluir conta: ${res.erro}`);
              }
            } catch (e) {
              showToast(`Erro: ${e.message}`);
            }
          }
        });
      }
    });
  };

  const questPlatforms = plat === "res"
    ? ["MedEvo", "Medgrupo", "Sanar", "Estratégia", "Outro"]
    : ["Estuda Mais", "Revolução Vestibulares", "Descomplica", "Ferretto", "Outro"];

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h2 className="text-[16px] font-black text-gray-100 flex items-center gap-2">
          <span>Perfil & Configurações</span>
        </h2>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors">✕</button>
      </div>

      {/* Tabs Header */}
      <div className="mb-4">
        <Tabs items={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Contents */}
      <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        
        {/* TABA 1: PERFIL */}
        {activeTab === "perfil" && (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-center gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-black text-white text-2xl select-none shadow-xl shadow-slate-950/60">
                {(userName || "US").substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white leading-tight">{userName || "Estudante"}</h3>
                <p className="text-[10px] text-gray-500 font-mono">{userEmail || "Sem email cadastrado"}</p>
                <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-600/30 font-mono">
                  PLATAFORMA: {plat === "res" ? "Residência" : "Vestibular"}
                </span>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Identificação</p>
              <Field label="Nome de exibição" info="O nome que o Mentor usará ao se comunicar com você.">
                <Input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Seu nome" />
              </Field>
              <Field label="Endereço de email" info="O email cadastrado na sua conta para login e sincronização de dados.">
                <Input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="email@exemplo.com" />
              </Field>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Dados acadêmicos (opcional)</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Idade" info="Opcional — não afeta o algoritmo.">
                  <Input
                    type="number"
                    min="16" max="80"
                    value={meta?.perfilIdade || ""}
                    onChange={e => setMeta({ ...meta, perfilIdade: e.target.value })}
                    placeholder="ex: 24"
                  />
                </Field>
                <Field label="Ano/semestre do curso" info="Ano de conclusão da graduação ou semestre atual.">
                  <Input
                    type="text"
                    value={meta?.perfilAno || ""}
                    onChange={e => setMeta({ ...meta, perfilAno: e.target.value })}
                    placeholder="ex: 6º ano / R3"
                  />
                </Field>
                <Field label="Especialidade pretendida" info="Área de residência de interesse.">
                  <Input
                    type="text"
                    value={meta?.perfilEspecialidade || ""}
                    onChange={e => setMeta({ ...meta, perfilEspecialidade: e.target.value })}
                    placeholder="ex: Clínica Médica"
                  />
                </Field>
                <Field label="Cidade/UF (opcional)">
                  <Input
                    type="text"
                    value={meta?.perfilCidade || ""}
                    onChange={e => setMeta({ ...meta, perfilCidade: e.target.value })}
                    placeholder="ex: Brasília/DF"
                  />
                </Field>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Foco de Estudo Ativo</p>
              <div className="grid grid-cols-2 gap-2 bg-black/40 rounded-xl p-1">
                {[["res","Residência"],["vest","Vestibular"]].map(([k,l]) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => {
                      openConfirm({
                        title: "Alterar foco de estudo",
                        message: "Todas as métricas, temas e simulados serão alternados para a outra plataforma.",
                        confirmLabel: "Alterar",
                        onConfirm: () => setPlat(k),
                      });
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                      plat === k
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-900/25"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] bg-transparent border border-transparent"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-1 leading-normal">Trocar o foco muda todo o painel, cronograma e métricas.</p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Auditoria de Experiência (XP)</p>
              <div className="space-y-2">
                <div className="flex justify-between text-[11.5px]">
                  <span className="text-gray-400">Total Acumulado:</span>
                  <span className="font-bold text-blue-400">{gamif?.xp || 0} XP (Nível {gamif?.level || 1})</span>
                </div>
                <div className="bg-white/5 rounded-full h-2 overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${pctAcertos}%` }} title={`Acertos: ${pctAcertos}%`} />
                  <div className="bg-blue-500 h-full" style={{ width: `${pctConstancia}%` }} title={`Constância: ${pctConstancia}%`} />
                  <div className="bg-cyan-500 h-full" style={{ width: `${pctOutros}%` }} title={`Conquistas/Outros: ${pctOutros}%`} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10.5px] text-gray-500 pt-1">
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>Acertos: {pctAcertos}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    <span>Constância: {pctConstancia}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                    <span>Outros: {pctOutros}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Timeline de Conquistas ({gamif?.badges?.length || 0} / {ACHIEVEMENTS.length})</p>
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {ACHIEVEMENTS.map(ach => {
                  const unlocked = gamif?.badges?.includes(ach.id);
                  return (
                    <div key={ach.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${unlocked ? "bg-blue-500/[0.03] border-blue-500/20" : "bg-black/20 border-white/5 opacity-50"}`}>
                      <div className="text-2xl shrink-0">{ach.icon}</div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`text-[12px] font-bold leading-tight ${unlocked ? "text-white" : "text-gray-500"}`}>{ach.nome}</p>
                        <p className="text-[10px] text-gray-500 leading-normal mt-0.5">{ach.desc}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${unlocked ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" : "bg-white/5 text-gray-600 border border-white/5"}`}>
                          +{ach.xpReward} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TABA 2: AJUSTES & METAS */}
        {activeTab === "ajustes" && (
          <div className="space-y-4 animate-fade-up">
            <div className="bg-white/5 rounded-2xl p-4 space-y-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">🎯 Planejamento Geral</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data da prova" info="Data em que será realizado o seu exame principal (utilizado para calcular o cronograma e as regressivas de estudo).">
                  <Input type="date" value={meta.dataProva} onChange={(e) => saveMeta({ dataProva: e.target.value })} />
                </Field>
                <Field label="Meta de acerto da prova (%)" info="Meta de desempenho para simulados e acompanhamento. Não reorganiza o FSRS; quem regula a curva é a Retenção FSRS Desejada.">
                  <Input type="number" min={50} max={100} step={0.1} value={meta.acerto} onChange={(e) => saveMetaNumber("acerto", e.target.value, { allowDecimal: true, maxDecimals: 1, min: 50, max: 100 }, 85)} />
                </Field>
              </div>
              <p className="text-[9.5px] text-gray-500 pl-1 -mt-2">
                A meta de acerto é só alvo de prova. Para ajustar frequência de revisões, use Retenção FSRS Desejada.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Teto diário de revisões" info="O número máximo de cards de revisão exibidos no Dashboard por dia. Excessos são movidos de forma inteligente para a fila reserva para amanhã, aliviando a carga mental.">
                  <Input type="number" min={5} max={500} value={meta.maxRevisoesDia ?? 30} onChange={(e) => saveMetaNumber("maxRevisoesDia", e.target.value, { min: 5, max: 500 }, 30)} />
                </Field>
                <Field label="Intervalo Máximo (Dias)" info="O limite máximo de dias para o agendamento de uma revisão. Garante que você revise todos os temas consolidados pelo menos uma vez a cada N dias.">
                  <Input type="number" min={30} max={365} value={meta.intervaloMaxDias ?? 180} onChange={(e) => saveMetaNumber("intervaloMaxDias", e.target.value, { min: 30, max: 365 }, 180)} />
                </Field>
              </div>

              <Field label="Retenção FSRS Desejada (%)" info="A probabilidade de recall que você quer ter quando for agendar um card. Mais alto (ex: 90%) agenda revisões mais frequentes. Mais baixo (ex: 80%) diminui o ritmo diário e o volume de revisões.">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={70}
                    max={97}
                    value={Math.round((meta.retencaoFSRS || 0.90) * 100)}
                    onChange={(e) => saveMeta({ retencaoFSRS: parseFloat(e.target.value) / 100 })}
                    className="flex-1 accent-blue-600 cursor-pointer h-1.5 bg-white/10 rounded-lg outline-none"
                  />
                  <span className="font-mono font-bold text-xs text-white shrink-0">{Math.round((meta.retencaoFSRS || 0.90) * 100)}%</span>
                </div>
              </Field>

              <Field label="Meta diária de revisões (0 = ilimitada)" info="Número de revisões que você se compromete a fazer diariamente como meta pessoal (não confunda com o Teto Diário do FSRS).">
                <div className="flex gap-2">
                  <Input type="number" min={0} value={meta.metaDiaria ?? 0} onChange={(e) => saveMetaNumber("metaDiaria", e.target.value, { min: 0 }, 0)} className="flex-1" />
                  <button
                    type="button"
                    onClick={() => {
                      const avgWorkload = Math.round(
                        Object.values(getWorkloadProjection(temas, 14))
                          .reduce((sum, day) => sum + (day?.count || 0), 0) / 14
                      ) || 10;
                      saveMeta({ metaDiaria: avgWorkload });
                      showToast(`Meta diária calibrada em ${avgWorkload} revisões/dia.`);
                    }}
                    className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
                  >
                    🪄 Autocalcular
                  </button>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Meta diária de questões (0 = inativo)"
                  info="Quantidade de questões resolvidas que você quer atingir por dia. Se a data da prova estiver definida, o total é calculado automaticamente."
                >
                  <Input
                    type="number"
                    min={0}
                    value={meta.metaQuestoesDia ?? 0}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      const updates = { metaQuestoesDia: val, metaQuestoesFonte: "dia" };
                      if (val > 0 && daysLeft != null && daysLeft > 0) {
                        updates.metaQuestoesTotal = val * daysLeft;
                      }
                      saveMeta(updates);
                    }}
                  />
                </Field>
                <Field
                  label="Meta total de questões (0 = inativo)"
                  info="Quantidade total de questões que você quer resolver até a prova. Se a data da prova estiver definida, a meta diária é calculada automaticamente."
                >
                  <Input
                    type="number"
                    min={0}
                    value={meta.metaQuestoesTotal ?? 0}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      const updates = { metaQuestoesTotal: val, metaQuestoesFonte: "total" };
                      if (val > 0 && daysLeft != null && daysLeft > 0) {
                        updates.metaQuestoesDia = Math.ceil(val / daysLeft);
                      }
                      saveMeta(updates);
                    }}
                  />
                </Field>
              </div>
              {daysLeft != null && daysLeft > 0 && (meta.metaQuestoesDia > 0 || meta.metaQuestoesTotal > 0) && (
                <p className="text-[10px] text-blue-400/80 italic -mt-1">
                  Auto-calculado com base em {daysLeft} dias restantes.
                  {meta.metaQuestoesFonte === "dia"
                    ? ` Total = ${meta.metaQuestoesDia} × ${daysLeft}d.`
                    : meta.metaQuestoesFonte === "total"
                    ? ` Diária = ${meta.metaQuestoesTotal} ÷ ${daysLeft}d.`
                    : ""}
                </p>
              )}

              <Field label="Tom do Mentor" info="Ajuste a personalidade conversacional do seu Mentor. Gentil: tom de apoio e sem rigidez; Neutro: focado em dados e direto; Firme: disciplina rígida e focado na meta de aprovação.">
                <Select value={meta.tomMentor || "gentil"} onChange={(e) => saveMeta({ tomMentor: e.target.value })}>
                  <option value="gentil">Gentil</option>
                  <option value="neutro">Neutro</option>
                  <option value="firme">Firme</option>
                </Select>
              </Field>

              {daysLeft != null && (
                <p className="text-[11px] text-gray-500 italic">
                  Faltam <strong className={urgency}>{daysLeft} dias</strong> para a prova em {fmtFull(meta.dataProva)}.
                </p>
              )}
            </div>

            {/* Modo Pausa / Férias */}
            <div className="bg-white/5 rounded-2xl p-4 space-y-3 text-left">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>🌴 Modo Pausa / Férias</span>
                {meta.pausadoAte && todayStr() <= meta.pausadoAte && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-blue-500/20 text-blue-400 border border-blue-600/30">
                    CONGELADO
                  </span>
                )}
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Vai viajar ou dar um descanso? Congele seus agendamentos FSRS para não acumular revisões atrasadas enquanto estiver fora. O streak móvel é preservado.
              </p>
              {meta.pausadoAte && todayStr() <= meta.pausadoAte ? (
                <div className="space-y-2">
                  <p className="text-[10.5px] text-blue-300">
                    Seus agendamentos estão pausados até <strong>{fmtFull(meta.pausadoAte)}</strong>.
                  </p>
                  <Btn onClick={() => { useStore.getState().cancelarPausa(); }} className="w-full">
                    Retomar Estudos Agora
                  </Btn>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    {[3, 7, 15].map((dias) => (
                      <button
                        key={dias}
                        type="button"
                        onClick={() => {
                          openConfirm({
                            title: "Pausar estudos",
                            message: `Deseja pausar seus estudos por ${dias} dias? Seus agendamentos serão empurrados.`,
                            confirmLabel: "Pausar",
                            onConfirm: () => useStore.getState().iniciarFerias(dias),
                          });
                        }}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer"
                      >
                        {dias} dias
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const n = parseInt(customPauseDays, 10);
                        if (!(n > 0)) {
                          showToast("Informe um número válido de dias.");
                          return;
                        }
                        openConfirm({
                          title: "Pausar estudos",
                          message: `Deseja pausar seus estudos por ${n} dias?`,
                          confirmLabel: "Pausar",
                          onConfirm: () => useStore.getState().iniciarFerias(n),
                        });
                      }}
                      className="px-3 py-2 bg-white/5 hover:bg-[#1f1f23] text-gray-400 border border-white/10 rounded-xl text-[10.5px] font-bold cursor-pointer"
                    >
                      Outro...
                    </button>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={customPauseDays}
                    onChange={(e) => setCustomPauseDays(e.target.value)}
                    placeholder="Dias personalizados"
                  />
                </>
              )}
            </div>

            {/* Otimizador FSRS */}
            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={13} className="shrink-0" /><span>Otimizador de Ciclos FSRS</span>
                <InfoTooltip texto="Reorganiza as revisões que estão atrasadas de forma que você possa colocá-las em dia sem desregular o peso cognitivo agendado FSRS." />
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                Reagenda revisões vencidas acumuladas distribuindo-as no tempo e preservando os pesos de retenção.
                {overdueCount > 0 ? <> Você possui <strong className="text-red-400">{overdueCount} pendentes</strong>.</> : " Nenhuma pendência atualmente."}
              </p>
              <Btn onClick={() => { optimize(plat); onClose(); }} disabled={overdueCount === 0} className="w-full">
                Otimizar Filas {overdueCount > 0 ? `(${overdueCount})` : ""}
              </Btn>
            </div>

              <div className="bg-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Módulos opcionais</p>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Brain size={15} className="text-cyan-400 shrink-0" />
                      Treinar Raciocínio Clínico
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleModulo("raciocinioClinico", !meta.modulos?.raciocinioClinico)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                      meta.modulos?.raciocinioClinico
                        ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                        : "bg-white/5 text-gray-400 border-white/10 hover:text-gray-200"
                    }`}
                  >
                    {meta.modulos?.raciocinioClinico ? "Ativado" : "Desativado"}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Além de passar na prova, treine anamnese, diagnósticos diferenciais e raciocínio para o dia a dia clínico (illness scripts, casos e Script Concordance).
                </p>
                <p className="text-[10px] text-gray-500">
                  Você pode ligar ou desligar esse trilho a qualquer momento sem alterar os outros módulos do app.
                </p>
              </div>

              {/* Sprint Semanal */}
            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>🏃‍♂️ Sprint Semanal de Foco</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${sprint?.ativa ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-500"}`}>
                  {sprint?.ativa ? "ATIVO" : "INATIVO"}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Input placeholder="Nome da Sprint (ex: Semana 1)" value={sprint?.semana || ""} onChange={(e) => setSprint({ ...sprint, semana: e.target.value })} className="flex-1" />
                <button onClick={() => setSprint({ ...sprint, ativa: !sprint?.ativa })}
                  className={`px-3 py-2 rounded-xl text-[12px] font-bold transition-all ${sprint?.ativa ? "bg-red-600/20 text-red-400 border border-red-600/30" : "bg-blue-600 text-white"}`}>
                  {sprint?.ativa ? "Desativar" : "Ativar"}
                </button>
              </div>
              {sprintRedAreas.length > 0 && (
                <button
                  type="button"
                  onClick={aplicarFocoProva}
                  className="w-full py-2 bg-gradient-to-r from-red-600/20 to-rose-600/20 hover:from-red-600 hover:to-rose-500 hover:text-white border border-red-500/20 rounded-xl text-[11px] font-bold text-red-400 transition-all cursor-pointer"
                >
                  🎯 Focar a Zona Vermelha de {readiness.targetProva} ({sprintRedAreas.join(", ")})
                </button>
              )}
              <p className="text-[10px] text-gray-500">Filtrar painel para estas especialidades foco:</p>
              <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto border border-white/5 p-2 rounded-xl bg-black/40">
                {esps.map(esp => (
                  <label key={esp} className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={sprint?.esps?.includes(esp) || false} onChange={() => toggleSprintEsp(esp)} className="rounded border-white/20 text-blue-600 focus:ring-blue-500 bg-black" />
                    <span className="truncate">{esp}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Apoio ao Bem-estar (CVV 188) */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">🌱 Apoio ao Bem-estar</p>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Se o ritmo estiver pesado, lembre-se de que sua saúde mental vem primeiro. Apoio gratuito e sigiloso disponível 24h.
                </p>
              </div>
              <a
                href="https://cvv.org.br"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 text-[10px] font-bold rounded-xl transition-all flex items-center gap-1.5 hover:scale-105"
              >
                <span>CVV 188</span>
                <span className="text-[11px]">↗</span>
              </a>
            </div>
          </div>
        )}

        {/* TABA 3: DADOS DE ESTUDO */}
        {activeTab === "dados" && (
          <div className="space-y-4 animate-fade-up">
            <div className="bg-white/5 rounded-2xl p-4 space-y-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">📚 Dados e Provas Alvo</p>
              
              <div>
                <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold block mb-2">Exames Alvo</span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border border-white/5 p-2 rounded-xl bg-black/40">
                  {(plat === "res" ? [
                    "ENAMED","USP-SP","UNIFESP","UNICAMP","USP-RP","SUS-SP","SUS-BA","SES-DF","SES-PE",
                    "AMRIGS","PSU-MG","SURCE","HCPA","UFRJ","UERJ","IAMSPE","Einstein",
                    "Sírio-Libanês","Santa Casa SP","HC-FMUSP","FHDF","outra"
                  ] : PROVAS_VEST).map((pr) => {
                    const selected = (meta.provasAlvo || []).includes(pr);
                    return (
                      <button
                        key={pr}
                        type="button"
                        onClick={() => {
                          const current = meta.provasAlvo || [];
                          const next = selected ? current.filter((x) => x !== pr) : [...current, pr];
                          saveMeta({ provasAlvo: next });
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                          selected
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-slate-900/30"
                            : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        {pr}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Plataforma de Questões" info="A plataforma externa de questões em que você resolve seus blocos de exercícios.">
                  <Select
                    value={questPlatforms.includes(meta.ferramentas?.questoes) ? meta.ferramentas?.questoes : (meta.plataformaQuestoes && questPlatforms.includes(meta.plataformaQuestoes) ? meta.plataformaQuestoes : "Outro")}
                    onChange={(e) => {
                      const val = e.target.value;
                      saveMeta({
                        plataformaQuestoes: val,
                        ferramentas: { ...(meta.ferramentas || { flashcards: "Anki" }), questoes: val }
                      });
                    }}
                  >
                    {questPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </Field>

                <Field label="Ferramenta de Flashcards" info="A ferramenta de repetição espaçada externa usada para seus flashcards.">
                  <Select
                    value={["Anki", "RemNote", "Quizlet"].includes(meta.ferramentas?.flashcards) ? meta.ferramentas?.flashcards : "Outro"}
                    onChange={(e) => {
                      const val = e.target.value;
                      saveMeta({
                        ferramentas: { ...(meta.ferramentas || { questoes: "MedEvo" }), flashcards: val }
                      });
                    }}
                  >
                    {["Anki", "RemNote", "Quizlet", "Outro"].map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </Field>
              </div>

              {((meta.ferramentas?.questoes === "Outro" || (meta.ferramentas?.questoes && !questPlatforms.includes(meta.ferramentas?.questoes))) ||
                (meta.ferramentas?.flashcards === "Outro" || (meta.ferramentas?.flashcards && !["Anki", "RemNote", "Quizlet"].includes(meta.ferramentas?.flashcards)))) && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-black/20 border border-white/5 rounded-xl">
                  {(!meta.ferramentas?.questoes || meta.ferramentas?.questoes === "Outro" || !questPlatforms.includes(meta.ferramentas?.questoes)) ? (
                    <Field label="Nome da Plataforma de Questões" info="Escreva o nome personalizado da sua plataforma de questões.">
                      <Input
                        type="text"
                        value={meta.ferramentas?.questoes === "Outro" ? "" : (meta.ferramentas?.questoes || "")}
                        onChange={(e) => saveMeta({
                          plataformaQuestoes: e.target.value,
                          ferramentas: { ...(meta.ferramentas || { flashcards: "Anki" }), questoes: e.target.value }
                        })}
                        placeholder="Ex: Tec Concursos"
                      />
                    </Field>
                  ) : <div />}
                  {(!meta.ferramentas?.flashcards || meta.ferramentas?.flashcards === "Outro" || !["Anki", "RemNote", "Quizlet"].includes(meta.ferramentas?.flashcards)) ? (
                    <Field label="Nome da Ferramenta de Flashcards" info="Escreva o nome personalizado da sua ferramenta de flashcards.">
                      <Input
                        type="text"
                        value={meta.ferramentas?.flashcards === "Outro" ? "" : (meta.ferramentas?.flashcards || "")}
                        onChange={(e) => saveMeta({
                          ferramentas: { ...(meta.ferramentas || { questoes: "MedEvo" }), flashcards: e.target.value }
                        })}
                        placeholder="Ex: Flashcards Web"
                      />
                    </Field>
                  ) : <div />}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Tópicos por dia" info="Quantos temas novos (D0) pretende iniciar por dia. O Mentor usa isso para calibrar a carga.">
                  <Input type="number" min={1} max={10} value={meta.temasPerDay ?? meta.temasPerWeek ?? 1} onChange={(e) => saveMeta({ temasPerDay: Math.max(1, Math.min(10, Number(e.target.value))) })} />
                </Field>
                <Field label="Meta de questões/dia" info="Quantas questões quer responder por dia. Usado no card de progresso e no Dashboard.">
                  <Input type="number" min={0} max={500} value={meta.metaQuestoesDia ?? meta.metaDiaria ?? 0} onChange={(e) => saveMeta({ metaQuestoesDia: Math.max(0, Math.min(500, Number(e.target.value))), metaDiaria: Math.max(0, Math.min(500, Number(e.target.value))) })} />
                </Field>
              </div>

              {plat === "vest" && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <label className="flex items-center gap-2 text-[12px] text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={meta.isSegundaTentativa || false}
                      onChange={(e) => saveMeta({ isSegundaTentativa: e.target.checked })}
                      className="rounded border-white/20 text-blue-600 focus:ring-blue-500 bg-black"
                    />
                    <span>Segunda tentativa / Mais de um ano estudando</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Meta de Acertos (Nº Qs)" info="Sua meta de número de acertos na prova alvo.">
                      <Input
                        type="number"
                        min={0}
                        value={meta.acertosAlvo ?? 0}
                        onChange={(e) => {
                          const val = readSanitizedNumber(e.target.value, { min: 0 }) ?? 0;
                          const tot = meta.totalQuestoesAlvo ?? 100;
                          const pct = tot > 0 ? parseFloat(((val / tot) * 100).toFixed(2)) : 0;
                          saveMeta({ acertosAlvo: val, notaCorteAlvo: pct });
                        }}
                        placeholder="Ex: 75"
                      />
                    </Field>
                    <Field label="Total Questões Prova" info="O total de questões da sua prova alvo para cálculo de aproveitamento percentual estratégico.">
                      <Input
                        type="number"
                        min={1}
                        value={meta.totalQuestoesAlvo ?? 100}
                        onChange={(e) => {
                          const tot = readSanitizedNumber(e.target.value, { min: 1 }) ?? 1;
                          const val = meta.acertosAlvo ?? 0;
                          const pct = tot > 0 ? parseFloat(((val / tot) * 100).toFixed(2)) : 0;
                          saveMeta({ totalQuestoesAlvo: tot, notaCorteAlvo: pct });
                        }}
                        placeholder="Ex: 90"
                      />
                    </Field>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 pl-1">
                    Sua meta equivale a <strong className="text-emerald-400">{meta.notaCorteAlvo || 0}%</strong> de acerto. Recomendamos manter entre 85% e 90% para otimização da retenção no FSRS.
                  </p>
                  <Field label="Área de maior dificuldade" info="A grande área onde seu desempenho é historicamente mais fraco. O MedRev irá priorizar revisões desta área.">
                    <Select
                      value={meta.areaPuxouBaixo || ""}
                      onChange={(e) => saveMeta({ areaPuxouBaixo: e.target.value })}
                    >
                      <option value="">Nenhuma selecionada</option>
                      {esps.map(e => <option key={e} value={e}>{e}</option>)}
                    </Select>
                  </Field>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "conta" && (
          <div className="space-y-4 animate-fade-up">
            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">📁 Portabilidade de Dados</p>
              <p className="text-[11.5px] text-gray-500 leading-relaxed">
                Exporte seu progresso estruturado ou restaure a partir de um backup JSON.
              </p>
              {process.env.NODE_ENV !== "production" && (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-[10px] text-gray-300 space-y-1">
                  <p><span className="text-gray-500">Usuario atual:</span> {userEmail || "sem email"} / {currentUid || "nao autenticado"}</p>
                  <p className="break-all"><span className="text-gray-500">Escopo local:</span> {scopeKey}</p>
                  <p><span className="text-gray-500">Ultima hidratacao:</span> {authScope?.lastHydratedAt ? new Date(authScope.lastHydratedAt).toLocaleString() : "pendente"}</p>
                  <p><span className="text-gray-500">Ultimo sync:</span> {authScope?.lastSyncAt ? new Date(authScope.lastSyncAt).toLocaleString() : "sem sync"}</p>
                  <p><span className="text-gray-500">Status:</span> {isolationStatus} · sync {syncStatus}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold transition-all"
                >
                  Exportar Backup
                </button>
                <label className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer flex items-center justify-center">
                  Importar Backup
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
              {process.env.NODE_ENV !== "production" && (
                <button
                  type="button"
                  onClick={handleMigrateLegacy}
                  className="w-full px-3 py-2 bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-bold transition-all"
                >
                  Migrar legado
                </button>
              )}
              {importFeedback?.warnings?.length > 0 && (
                <p className="text-[10px] text-yellow-300">{importFeedback.warnings.join(" | ")}</p>
              )}
            </div>

            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ℹ Onboarding & Guia</p>
              <Btn variant="ghost" onClick={() => { onResetOnboarding(); onClose(); }} className="w-full">
                Ver Guia de Onboarding Novamente
              </Btn>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-red-400">⚠️ Conta (LGPD)</p>
              <p className="text-[11.5px] text-gray-500 leading-relaxed">
                Isso excluirá permanentemente sua conta no banco de dados e todos os dados associados. Esta ação não poderá ser desfeita.
              </p>
              <button
                type="button"
                onClick={handleExcluirConta}
                className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20 text-[11.5px] font-bold rounded-xl transition-all"
              >
                Excluir Definitivamente Minha Conta
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ==================================================
export function BrainDumpD1Modal({ tema, onConfirm, onCancel }) {
  const [seconds, setSeconds] = useState(300); // 5 Minutos
  const [timerActive, setTimerActive] = useState(true);
  const [fields, setFields] = useState({ epidemiologia: "", fisiopatologia: "", diagnostico: "", conduta: "", complicacoes: "" });

  useEffect(() => {
    let interval = null;
    if (timerActive && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0) setTimerActive(false);
    return () => clearInterval(interval);
  }, [timerActive, seconds]);

  const fmtTimer = () => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const formMapeamento = [
    { k: "epidemiologia", l: "📍 Epidemiologia / Fatores de Risco", p: "Quem? Quando? Ocorrência típica de prova...", info: "Quem é o paciente típico de prova? Idade, sexo, fatores predisponentes ou exposição." },
    { k: "fisiopatologia", l: "🔬 Fisiopatologia / Mecanismo", p: "Vias biológicas, gatilhos anatômicos cruciais...", info: "Como a doença se desenvolve no organismo. Alterações anatômicas ou bioquímicas principais." },
    { k: "diagnostico", l: "🔍 Critérios Diagnósticos / exames", p: "Padrão-ouro, sinais clínicos patognomônicos...", info: "Qual o exame padrão-ouro? Quais os critérios para fechar o diagnóstico e sinais clínicos típicos." },
    { k: "conduta", l: "💊 Conduta Inicial e Tratamento", p: "Medicamentos, doses, indicações cirúrgicas puras...", info: "Medidas iniciais no pronto-socorro, drogas de primeira escolha, doses e tratamento definitivo." },
    { k: "complicacoes", l: "⚠️ Complicações / Padrões de Erro", p: "O que o distrator de prova tenta induzir a errar...", info: "Complicações mais comuns da doença ou do tratamento e pegadinhas clássicas de prova." }
  ];

  return (
    <Modal onClose={onCancel} wide>
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div><h2 className="text-[15px] font-black text-white">{tema.nome}</h2><p className="text-[11px] text-gray-500">Brain Dump D1</p></div>
        <div className={`px-3 py-1 rounded-xl font-mono text-[16px] font-black ${seconds <= 60 ? "bg-red-600/20 text-red-400 border border-red-500/30 animate-pulse" : "bg-white/5 text-blue-400 border border-white/10"}`}>{fmtTimer()}</div>
      </div>
      <div className="space-y-3 my-2 max-h-[55vh] overflow-y-auto pr-1 text-left">
        {formMapeamento.map(f => (
          <div key={f.k} className="space-y-1">
            <Field label={f.l} info={f.info}>
              <Textarea rows={2} value={fields[f.k]} onChange={e => setFields({ ...fields, [f.k]: e.target.value })} placeholder={f.p} />
            </Field>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-white/5 pt-3">
        <Btn className="flex-1 bg-emerald-600 hover:bg-emerald-500" onClick={() => onConfirm(fields)}>✓ Concluir Brain Dump</Btn>
        <Btn variant="ghost" onClick={() => setTimerActive(!timerActive)}>{timerActive ? "Pausar" : "Retomar"}</Btn>
        <Btn variant="danger" onClick={onCancel}>Cancelar</Btn>
      </div>
    </Modal>
  );
}

// ==================================================
export function GlobalSearchModal({ onClose, temas, plat, onSelectTema, onIniciarTema }) {
  const [q, setQ] = useState("");
  
  const catalog = plat === "vest" ? CATALOGO_VEST : CATALOGO_RES;
  
  const allCatalogTopics = useMemo(() => {
    return catalog.flatMap(b => 
      b.t.map(topic => ({
        nome: topic[0],
        esp: topic[1],
        prio: topic[2],
        blockName: b.nome || `Bloco ${b.b}`
      }))
    );
  }, [catalog]);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const query = q.toLowerCase();
    
    const matched = allCatalogTopics.filter(t => 
      t.nome.toLowerCase().includes(query) || 
      t.esp.toLowerCase().includes(query) ||
      t.blockName.toLowerCase().includes(query)
    );
    
    return matched.map(m => {
      const activeTema = temas.find(t => t.nome === m.nome);
      return {
        ...m,
        active: activeTema,
      };
    });
  }, [q, allCatalogTopics, temas]);

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
        <Search size={18} className="text-gray-500 shrink-0" />
        <input
          autoFocus
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busque por qualquer matéria ou tema (ex: Cardiologia, Cinemática)..."
          className="w-full bg-transparent text-sm text-white placeholder-gray-600 outline-none"
        />
      </div>

      <div className="my-2 max-h-[50vh] overflow-y-auto pr-1 space-y-2 text-left">
        {q.trim() === "" ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            Digite algo para pesquisar no catálogo completo do {plat === "vest" ? "Vestibular" : "MedRev"}.
          </div>
        ) : results.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            Nenhum resultado encontrado para "{q}".
          </div>
        ) : (
          results.map((r, idx) => (
            <div
              key={idx}
              className="bg-white/[0.01] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                    {r.esp} · {r.blockName}
                  </span>
                  {r.active && !r.active.unstarted ? (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Iniciado
                    </span>
                  ) : (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
                      Disponível
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white mt-1.5 truncate">{r.nome}</h4>
              </div>

              <div className="shrink-0">
                {r.active && !r.active.unstarted ? (
                  <button
                    onClick={() => {
                      onSelectTema(r.active);
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-xl border border-white/10 transition-all active:scale-[0.98]"
                  >
                    Ver Painel
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onIniciarTema(r);
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-900/10"
                  >
                    Iniciar Ciclo
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="text-[9.5px] text-gray-600 text-center border-t border-white/5 pt-2 font-mono">
        Pressione ESC para fechar a busca global.
      </div>
    </Modal>
  );
}

export function LojaModal({ onClose }) {
  const gamif = useStore((s) => s.gamif) || { xp: 0, level: 1, freezesOwned: 1, recoveryOwned: 0, focusBoostActive: false };
  const buyItem = useStore((s) => s.buyItem);
  const showToast = useStore((s) => s.showToast);
  
  const items = [
    {
      key: "freeze",
      nome: "Congelamento de Streak",
      desc: "Protege sua streak de ser zerada por 1 dia inteiro de ausência de estudos. Ativado automaticamente.",
      icon: "❄️",
      costXp: 150,
      reqLevel: 2,
      efeto: "Estoque máximo de 2 freezes.",
      owned: gamif.freezesOwned || 0,
      maxed: (gamif.freezesOwned || 0) >= 2,
    },
    {
      key: "recovery",
      nome: "Recuperação de Streak",
      desc: "Restaura uma streak que foi quebrada nas últimas 48h. Uso manual através do painel.",
      icon: "🛟",
      costXp: 400,
      reqLevel: 4,
      efeto: "Permite reerguer sua ofensiva perdida.",
      owned: gamif.recoveryOwned || 0,
      maxed: false,
    },
    {
      key: "boost",
      nome: "Boost de Foco (Cosmético)",
      desc: "Habilita um tema alternativo verde esmeralda e ciano no dashboard.",
      icon: "🎯",
      costXp: 100,
      reqLevel: 3,
      efeto: "Visual premium extra para foco.",
      owned: gamif.focusBoostActive ? 1 : 0,
      maxed: gamif.focusBoostActive,
    }
  ];

  const handleBuy = (item) => {
    if (gamif.xp < item.costXp) {
      showToast("Você não possui XP suficiente!");
      return;
    }
    if (gamif.level < item.reqLevel) {
      showToast(`Este item requer Nível ${item.reqLevel}!`);
      return;
    }
    if (item.maxed) {
      showToast("Você já possui a quantidade máxima deste item!");
      return;
    }
    buyItem(item.key, item.costXp, item.reqLevel);
  };

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-950/20">
            <span className="text-sm">🏪</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Loja do Mentor</h3>
            <p className="text-[10px] text-gray-500">Troque seus pontos de esforço por itens estratégicos.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[9px] text-gray-500 font-bold uppercase">Seu Saldo</p>
            <p className="text-xs font-black text-amber-400 font-mono">{gamif.xp} XP</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-center">
            <p className="text-[8px] text-gray-500 font-bold uppercase leading-none">Nível</p>
            <p className="text-xs font-black text-blue-400 font-mono mt-0.5">{gamif.level}</p>
          </div>
        </div>
      </div>

      <div className="my-2 max-h-[60vh] overflow-y-auto pr-1 space-y-3 text-left">
        {items.map(item => {
          const canBuy = gamif.xp >= item.costXp && gamif.level >= item.reqLevel && !item.maxed;
          return (
            <div key={item.key} className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xl shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white leading-none">{item.nome}</h4>
                    {item.owned > 0 && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 leading-none">
                        Possui: {item.owned}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
                  <p className="text-[9.5px] text-gray-600 mt-1">{item.efeto}</p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3 sm:flex-col sm:items-end justify-between border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] text-gray-500 font-bold uppercase">Preço</p>
                  <p className="text-sm font-black text-amber-400 font-mono">{item.costXp} XP</p>
                  {gamif.level < item.reqLevel && (
                    <p className="text-[9px] text-red-400 font-bold mt-0.5">Requer Nvl {item.reqLevel}</p>
                  )}
                </div>

                <button
                  disabled={!canBuy}
                  onClick={() => handleBuy(item)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all active:scale-[0.98] ${
                    canBuy
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-900/10 cursor-pointer"
                      : "bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed"
                  }`}
                >
                  {item.maxed ? "Esgotado" : "Comprar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

// ─── MODAL VALIDAR DOMÍNIO ────────────────────────────────────────────────────

export function ModalValidarDominio({ tema, onConfirm, onCancel, onStartLater }) {
  const [questoes, setQuestoes] = React.useState(String(DOMINIO_PREVIO_MIN_QUESTOES));
  const [acertos, setAcertos] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const qtd = readSanitizedNumber(questoes, { min: 1, max: 50 }) ?? 0;
  const acertosNum = readSanitizedNumber(acertos, { min: 0, max: qtd || 50 });
  const pct = qtd > 0 && !isNaN(acertosNum) ? Math.round((acertosNum / qtd) * 100) : null;
  const classificacao = pct != null ? classificarDominio(pct) : null;
  const meta_ = classificacao ? DOMINIO_META[classificacao] : null;

  const canConfirm = qtd >= 1 && !isNaN(acertosNum) && acertosNum >= 0 && acertosNum <= qtd;

  function handleConfirm() {
    if (!canConfirm) return;
    setSubmitted(true);
    onConfirm({ questoes: qtd, acertos: acertosNum });
  }

  return (
    <Modal onClose={onCancel}>
      <div className="space-y-5 p-1">
        <div className="space-y-1">
          <h3 className="text-base font-black text-white">Validar Domínio Prévio</h3>
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-gray-300">{tema.nome}</span>
            {" · "}{tema.esp}
          </p>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Use "Já domino" apenas quando você realmente já domina o conteúdo.
            O sistema não marca domínio definitivo: ele cria uma validação curta
            e agenda a próxima revisão em D7 (80–89%) ou D21 (90%+).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Total de questões">
            <Input
              type="number"
              min="1"
              max="50"
              value={questoes}
              onChange={(e) => setQuestoes(sanitizeNumericInput(e.target.value, { min: 1, max: 50 }).text)}
              placeholder={String(DOMINIO_PREVIO_MIN_QUESTOES)}
            />
          </Field>
          <Field label="Acertos">
            <Input
              type="number"
              min="0"
              max={qtd || 50}
              value={acertos}
              onChange={(e) => setAcertos(sanitizeNumericInput(e.target.value, { min: 0, max: qtd || 50 }).text)}
              placeholder="ex: 13"
            />
          </Field>
        </div>

        {pct != null && meta_ && (
          <div
            className="rounded-xl p-3.5 space-y-1.5 border"
            style={{ background: meta_.color + "15", borderColor: meta_.color + "40" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black" style={{ color: meta_.color }}>
                {pct}% de acerto — {meta_.label}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">{meta_.desc}</p>
            {tema.importancia === "CRITICA" && classificacao === "alto" && (
              <p className="text-[10px] text-amber-400 font-semibold mt-1">
                Tema crítico: mesmo com domínio alto, entra em manutenção espaçada para garantir a retenção.
              </p>
            )}
          </div>
        )}
        {qtd > 0 && qtd < DOMINIO_PREVIO_MIN_QUESTOES && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3">
            <p className="text-[10px] text-amber-300 font-semibold">
              Amostra insuficiente: use pelo menos {DOMINIO_PREVIO_MIN_QUESTOES} questões para validação confiável.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={() => onStartLater && onStartLater()}
            className="flex-1 py-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 text-xs font-bold transition-all border border-blue-500/30 cursor-pointer"
          >
            Validar depois
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all border border-white/5 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || submitted}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitted ? "Aplicando..." : "Salvar resultado"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
