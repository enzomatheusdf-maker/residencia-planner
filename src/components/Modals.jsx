// src/components/Modals.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Calendar, BarChart3, FileText, Zap, Target, BookOpen, 
  TrendingUp, Award, Edit2, Trash2, Search
} from "lucide-react";
import { CATALOGO_RES, CATALOGO_VEST, getSubtopics } from "../constants/catalogos";
import { useStore } from "../core/store";
import {
  STEPS, IMPORTANCIA, ESPS_RES, ESPS_VEST,
  todayStr, diffDays, fmtFull
} from "../core/fsrs";
import {
  Modal, Btn, Input, Textarea, Select, Field, MedRevLogo
} from "./Primitives";
import { calcFilaInteligente } from "../hooks/useMetrics";
import { getMentorPhrase, getRecentPhrases, trackRecentPhrase } from "../core/mentor";
import { Brain } from "lucide-react";
import { auth, excluirUsuarioEDados } from "../services/firebase";

// ─── HELP MODAL ──────────────────────────────────────────────────────────────
export function HelpModal({ onClose }) {
  const [tab, setTab] = useState("secoes");
  const sections = [
    { icon: LayoutDashboard, color: "#a78bfa", title: "Dashboard", desc: "Painel central com fila cronológica, fila inteligente (score algorítmico), heatmap de consistência 35 dias, True Retention D21 e Zonas de Alerta por especialidade." },
    { icon: Calendar, color: "#60a5fa", title: "Cronograma", desc: "Grade MEDCOF 2026 completa (26 blocos, 23 especialidades). Inicie ciclos direto de um tema ou monte cronogramas semanais com criação manual ou importação de PDF." },
    { icon: BarChart3, color: "#34d399", title: "Banco de Dados", desc: "Tabela de todos os temas. Ordene por nome, progresso, questões ou acerto. Exporte em CSV para análise externa." },
    { icon: FileText, color: "#f472b6", title: "Estatísticas", desc: "Análise de provas-alvo (ENAMED, USP-SP, UNIFESP) com incidência por área e tópicos de risco 2026. Inclui aba 'Meu Desempenho' com seus dados pessoais." },
    { icon: Target, color: "#fb923c", title: "Simulados", desc: "Registre práticas e simulados. Acompanhe a evolução do percentual, gerencie correção D7 de erros, veja diagnóstico por área e métricas de elite (índice de descuido, taxa de conversão)." },
    { icon: Zap, color: "#fbbf24", title: "Anki Audit", desc: "Monitore a calibração do Anki. Registre sessões e acompanhe a taxa de 'Again' — ideal abaixo de 15% para retenção de longo prazo." },
  ];
  const workflow = [
    { step: "D0", icon: BookOpen, color: "#a78bfa", label: "Estudo Inicial", desc: "Leia o conteúdo, resolva questões e registre o acerto. O FSRS-Lite calcula automaticamente a data das próximas revisões." },
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
            <p className="text-[11px] text-gray-500">Motor FSRS-Lite · v7.1</p>
          </div>
        </div>

        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          {[["secoes","Seções"], ["fluxo","Fluxo FSRS"], ["glossario","Glossário"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold transition-all ${tab === k ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "text-gray-500 hover:text-gray-300"}`}>{l}</button>
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
              <span className="text-xs font-black text-violet-400 font-mono">FSRS (Free Spaced Repetition Scheduler)</span>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Algoritmo matemático de repetição espaçada que estima o nível de estabilidade da memória baseado nas suas taxas de acertos e calcula a data ideal de revisão para garantir 90% de retenção (True Retention).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-xs font-black text-violet-400 font-mono">D0 → D21 (Ciclo Espaçado)</span>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Intervalos fixados cientificamente: D0 (estudo inicial ativo), D1 (recuperação ativa no dia seguinte via Brain Dump), D4 (reforço de questões), D7 (questões e flashcards) e D21 (revisão interleaved misturada).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-xs font-black text-violet-400 font-mono">True Retention D21+</span>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                A porcentagem real de acertos nas revisões de longo prazo (etapas D21 em diante). É a métrica mais pura do seu nível de aprendizado real. Ideal acima de 80%.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-xs font-black text-violet-400 font-mono">Fila Inteligente</span>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Score dinâmico que ordena seus temas na fila considerando a urgência do FSRS (atraso) combinada com a importância da especialidade nas provas e seu peso de dificuldade.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-xs font-black text-violet-400 font-mono">Viés Metacognitivo</span>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                A diferença entre a confiança estimada pelo estudante (percepção de domínio) e a taxa de acerto real nas questões. Um delta alto de excesso de confiança indica que o estudante está negligenciando lacunas graves.
              </p>
            </div>
          </div>
        )}

        <Btn className="w-full" onClick={onClose}>Entendido — vamos estudar!</Btn>
      </div>
    </Modal>
  );
}

// ─── CYCLE COMPLETE MODAL ─────────────────────────────────────────────────────
export function CycleCompleteModal({ tema, onClose }) {
  const { plat } = useStore();
  const userName = useStore((s) => s.userName || "Estudante");
  const temas = useStore((s) => s[plat]?.temas || []);

  const done = Object.values(tema.rev).filter(r => r.done && r.acerto != null);
  const avgAcerto = done.length ? Math.round(done.reduce((a, r) => a + r.acerto, 0) / done.length * 100) : 0;

  // Specialty average accuracy
  const espTemas = temas.filter(t => t.esp === tema.esp);
  let sumEsp = 0;
  let countEsp = 0;
  espTemas.forEach(t => {
    Object.values(t.rev).forEach(r => {
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
  }, recent);
  
  // Track selected phrase to avoid repetition
  useEffect(() => {
    if (phraseId) {
      trackRecentPhrase(phraseId);
    }
  }, [phraseId]);

  // Recommended next action
  const nextFila = calcFilaInteligente(temas).filter(item => item.temaId !== tema.id);
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
          <p className="text-sm text-violet-400 font-bold mt-0.5">{tema.nome}</p>
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
            <p className={`text-xl font-black mt-0.5 ${avgAcerto >= 80 ? "text-emerald-400" : avgAcerto >= 65 ? "text-violet-400" : "text-red-400"}`}>
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
            <Brain size={13} className="text-violet-400" />
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
          className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white rounded-xl font-bold text-[12.5px] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-purple-900/10"
        >
          Continuar Planejamento
        </button>
      </div>
    </Modal>
  );
}

// ─── ONBOARDING MODAL ──────────────────────────────────────────────────────────
const PROVAS_RES = ["ENAMED", "USP-SP", "UNIFESP", "SCMSP", "SUS-SP", "UNICAMP", "UFRJ", "AMP"];
const PROVAS_VEST = ["ENEM", "FUVEST", "UNICAMP", "UNESP", "UFG", "UERJ", "UFSC"];

export function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [plataforma, setPlataforma] = useState("res");
  const [dataProva, setDataProva] = useState("2026-10-25");
  const [metaAcerto, setMetaAcerto] = useState(85);
  const [provasAlvo, setProvasAlvo] = useState([]);
  const [horarioPreferido, setHorarioPreferido] = useState("Manhã");
  const [tempoDisponivel, setTempoDisponivel] = useState(2);
  const [plataformaQuestoes, setPlataformaQuestoes] = useState("MedEvo");
  // Vestibular-specific
  const [isSegundaTentativa, setIsSegundaTentativa] = useState(false);
  const [areaPuxouBaixo, setAreaPuxouBaixo] = useState("");
  const [notaCorteAlvo, setNotaCorteAlvo] = useState(0);

  // Internal steps: 1 (identificação), 2 (vest context — skipped for res), 3 (rotina), 4 (plataforma)
  const TOTAL_STEPS = plataforma === "vest" ? 4 : 3;
  const visibleStep = plataforma === "vest" ? step : Math.max(1, step - (step > 1 ? 1 : 0));

  const next = () => {
    if (step === 1 && !nome.trim()) return;
    if (step === 1 && plataforma === "res") { setStep(3); return; } // skip vestibular step
    if (step === 4) {
      onComplete(nome.trim() || "Estudante", plataforma, {
        dataProva,
        acerto: metaAcerto,
        provasAlvo,
        horarioPreferido,
        tempoDisponivel,
        plataformaQuestoes,
        isSegundaTentativa,
        areaPuxouBaixo,
        notaCorteAlvo,
        notasTentativaAnterior: {},
      });
      return;
    }
    setStep(step + 1);
  };
  const prev = () => {
    if (step <= 1) return;
    if (step === 3 && plataforma === "res") { setStep(1); return; } // skip vestibular step backwards
    setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 bg-[#05050d]/97 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-[#0d0d18] border border-white/10 rounded-3xl p-6 w-full max-w-md flex flex-col gap-5 shadow-2xl shadow-purple-900/20 animate-slide-up max-h-[92vh] overflow-y-auto">
        {/* Progress bar */}
        <div className="flex gap-1 shrink-0">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < visibleStep ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/10"}`} />
          ))}
        </div>

        <div className="flex flex-col items-center text-center gap-4 py-1 min-h-[360px]">
          {/* TELA 1: Identificação e Metas */}
          {step === 1 && (
            <div className="w-full flex flex-col gap-4 text-left">
              <div className="text-center">
                <MedRevLogo size="md" showTagline />
                <h2 className="text-xl font-black text-white mt-4">Monte seu Perfil Clínico</h2>
                <p className="text-[11px] text-gray-500 mt-1">Identificação, foco de estudo e metas de aprovação.</p>
              </div>

              <Field label="Nome completo ou como prefere ser chamado">
                <Input
                  autoFocus
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu primeiro nome"
                  className="py-2.5 text-xs"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Foco de Estudo">
                  <Select value={plataforma} onChange={(e) => { setPlataforma(e.target.value); setProvasAlvo([]); }}>
                    <option value="res">Residência Médica</option>
                    <option value="vest">Vestibular / ENEM</option>
                  </Select>
                </Field>
                <Field label="Data da Prova">
                  <Input type="date" value={dataProva} onChange={(e) => setDataProva(e.target.value)} className="py-2 text-xs" />
                </Field>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Meta de acerto</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">{metaAcerto}%</span>
                </div>
                <input type="range" min={50} max={100} step={5} value={metaAcerto}
                  onChange={(e) => setMetaAcerto(+e.target.value)}
                  className="w-full accent-purple-500 cursor-pointer h-1" />
              </div>

              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold block mb-1.5">Instituições / Provas Alvo</span>
                <div className="flex flex-wrap gap-1 border border-white/5 p-2 rounded-xl bg-black/40 max-h-24 overflow-y-auto">
                  {(plataforma === "res" ? PROVAS_RES : PROVAS_VEST).map((pr) => {
                    const selected = provasAlvo.includes(pr);
                    return (
                      <button
                        key={pr}
                        type="button"
                        onClick={() => {
                          if (selected) setProvasAlvo(provasAlvo.filter(x => x !== pr));
                          else setProvasAlvo([...provasAlvo, pr]);
                        }}
                        className={`text-[9.5px] font-bold px-2 py-1 rounded-lg border transition-all ${
                          selected
                            ? "bg-purple-600 border-purple-500 text-white"
                            : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        {pr}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TELA 2: Contexto Vestibular (somente para vest) */}
          {step === 2 && plataforma === "vest" && (
            <div className="w-full flex flex-col gap-5 text-left mt-2">
              <div className="text-center">
                <span className="text-3xl">🎯</span>
                <h2 className="text-xl font-black text-white mt-3">Contexto do Vestibular</h2>
                <p className="text-[11px] text-gray-500 mt-1">Vamos calibrar sua estratégia com base no seu histórico.</p>
              </div>

              <div className="space-y-2">
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold">É uma segunda tentativa?</span>
                <div className="grid grid-cols-2 gap-2 bg-black border border-white/10 rounded-xl p-0.5">
                  {[["Sim, já prestei antes", true], ["Não, é minha primeira vez", false]].map(([lbl, val]) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setIsSegundaTentativa(val)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${isSegundaTentativa === val ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Nota de corte alvo (estimada)</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">{notaCorteAlvo > 0 ? notaCorteAlvo : "–"}</span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={notaCorteAlvo || ""}
                  onChange={(e) => setNotaCorteAlvo(+e.target.value)}
                  placeholder="ex: 680 pontos"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {isSegundaTentativa && (
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1.5">Área que mais te derrubou</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Exatas", "Ciências da Natureza", "Linguagens", "Humanas"].map(area => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setAreaPuxouBaixo(area === areaPuxouBaixo ? "" : area)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          areaPuxouBaixo === area
                            ? "bg-red-500/20 border-red-500/50 text-red-300"
                            : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                  {areaPuxouBaixo && (
                    <p className="text-[10px] text-amber-400/80 mt-2 pl-1">⚡ A fila inteligente vai priorizar {areaPuxouBaixo} automaticamente.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TELA 3: Rotina de Estudos */}
          {step === 3 && (
            <div className="w-full flex flex-col gap-5 text-left mt-2">
              <div className="text-center">
                <span className="text-3xl">📅</span>
                <h2 className="text-xl font-black text-white mt-3">Sua Rotina de Estudos</h2>
                <p className="text-[11px] text-gray-500 mt-1">Defina quando estuda e por quanto tempo.</p>
              </div>

              <div className="space-y-2">
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Horário preferido de estudo</span>
                <div className="grid grid-cols-3 gap-2 bg-black border border-white/10 rounded-xl p-0.5">
                  {["Manhã", "Tarde", "Noite"].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHorarioPreferido(h)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${horarioPreferido === h ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}
                    >
                      {h === "Manhã" ? "🌅 Manhã" : h === "Tarde" ? "☀️ Tarde" : "🌙 Noite"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Tempo disponível para estudos por dia</span>
                <div className="grid grid-cols-5 gap-2 bg-black border border-white/10 rounded-xl p-0.5">
                  {[1, 2, 3, 4, 5].map(hr => (
                    <button
                      key={hr}
                      type="button"
                      onClick={() => setTempoDisponivel(hr)}
                      className={`py-2 rounded-lg text-xs font-mono font-bold transition-all ${tempoDisponivel === hr ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}
                    >
                      {hr}h{hr === 5 && "+"}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 leading-normal pl-1">
                  O Mentor adaptará os lembretes de estudos e as sessões FSRS baseado no seu tempo disponível.
                </p>
              </div>
            </div>
          )}

          {/* TELA 4: Plataforma de Questões */}
          {step === 4 && (
            <div className="w-full flex flex-col gap-5 text-left mt-2">
              <div className="text-center">
                <span className="text-3xl">💻</span>
                <h2 className="text-xl font-black text-white mt-3">Banco de Questões</h2>
                <p className="text-[11px] text-gray-500 mt-1">Onde você resolve questões práticas de prova.</p>
              </div>

              <div className="space-y-2">
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Plataforma principal utilizada</span>
                <div className="grid grid-cols-2 gap-2">
                  {(plataforma === "vest"
                    ? ["Descomplica", "Khan Academy", "Gabarito", "Vestibulares (PDF)", "Outro"]
                    : ["MedEvo", "Medgrupo", "Sanar", "Estratégia", "Outro"]
                  ).map(platOpt => (
                    <button
                      key={platOpt}
                      type="button"
                      onClick={() => setPlataformaQuestoes(platOpt)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        plataformaQuestoes === platOpt
                          ? "border-purple-500 bg-purple-500/10 text-white shadow-lg font-bold"
                          : "border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-gray-200"
                      }`}
                    >
                      {platOpt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 shrink-0">
          {step > 1 && (
            <Btn variant="ghost" onClick={prev} className="flex-none px-4">←</Btn>
          )}
          <Btn className="flex-1" onClick={next} disabled={step === 1 && !nome.trim()}>
            {step === 4 ? "🏁 Finalizar Perfil" : "Continuar →"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── STRUCTURED ERRORS LIST ──────────────────────────────────────────────────
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
          className="px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-[10px] font-bold transition-all"
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
                      className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-violet-500"
                    >
                      {subtopics.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={e.subtopico}
                      onChange={(evt) => updateErro(e.id, { subtopico: evt.target.value })}
                      placeholder="Ex: Fórmula tal"
                      className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-violet-500"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] text-gray-500 uppercase font-bold">Tipo de Erro</label>
                  <select
                    value={e.tipoErro}
                    onChange={(evt) => updateErro(e.id, { tipoErro: evt.target.value })}
                    className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-violet-500"
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
                  className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-[10.5px] text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={e.virouCard}
                    onChange={(evt) => updateErro(e.id, { virouCard: evt.target.checked })}
                    className="rounded border-white/20 text-violet-600 focus:ring-violet-500 bg-black"
                  />
                  <span>Criou card?</span>
                </label>

                <label className="flex items-center gap-1.5 text-[10.5px] text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={e.revisado}
                    onChange={(evt) => updateErro(e.id, { revisado: evt.target.checked })}
                    className="rounded border-white/20 text-violet-600 focus:ring-violet-500 bg-black"
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

// ─── MARK MODAL ───────────────────────────────────────────────────────────────
export function MarkModal({ tema, stepKey, onConfirm, onCancel }) {
  const step    = STEPS.find((s) => s.key === stepKey);
  const plat    = useStore((s) => s.plat);
  const [questoes, setQuestoes] = useState("");
  const [acertos, setAcertos]   = useState("");
  const [erros, setErros]       = useState([]);

  const isD1  = step.checkbox;

  const totalQuestoes = +questoes || 0;
  const certasQuestoes = +acertos || 0;
  const pct = totalQuestoes > 0 ? Math.round((certasQuestoes / totalQuestoes) * 100) : 0;
  const showErroBox = pct < 75 && totalQuestoes > 0;

  const col   = pct >= 90 ? "text-emerald-400" : pct >= 75 ? "text-violet-400" : pct >= 55 ? "text-yellow-400" : "text-red-400";
  const label = pct >= 90 ? "Domínio sólido 🎯" : pct >= 75 ? "Bom progresso" : pct >= 55 ? "Em consolidação" : "Ponto fraco — revise mais";
  const isInvalid = totalQuestoes <= 0 || certasQuestoes > totalQuestoes;
  const confirmDisabled = !isD1 && isInvalid;

  return (
    <Modal onClose={onCancel}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 font-black text-[13px] shrink-0">
          {step.label}
        </div>
        <div>
          <p className="text-[14px] font-bold text-gray-100">{step.desc}</p>
          <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">{tema.nome}</p>
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {isD1 ? (
        <div className="text-center py-3">
          <div className="text-4xl mb-3">✍️</div>
          <p className="text-[13px] text-gray-400 leading-relaxed">
            Brain dump escrito de 5 min, material fechado.<br />Você fez?
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Questões resolvidas">
              <Input type="number" min={0} value={questoes} onChange={(e) => setQuestoes(e.target.value)} placeholder="ex: 20" />
            </Field>
            <Field label="Quantas acertou?">
              <Input type="number" min={0} value={acertos} onChange={(e) => setAcertos(e.target.value)} placeholder="ex: 15" />
            </Field>
          </div>

          {totalQuestoes > 0 && (
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Acerto calculado</span>
                <span className={`text-3xl font-black font-mono tabular-nums ${col}`}>{pct}%</span>
              </div>
              <div className="text-[11px] text-right text-gray-500 italic">{label}</div>
            </div>
          )}

          {isInvalid && totalQuestoes > 0 && (
            <p className="text-[11px] text-red-400 italic">Número de acertos não pode ser maior que o total de questões.</p>
          )}

          {showErroBox && (
            <StructuredErrorsList erros={erros} onChange={setErros} plat={plat} esp={tema.esp} />
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Btn className="flex-1"
          disabled={confirmDisabled}
          onClick={() => onConfirm({
            acerto: isD1 ? null : pct / 100,
            questoes: totalQuestoes || null,
            motivosErro: showErroBox ? erros.map(e => e.tipoErro) : [],
            erros: showErroBox ? erros : []
          })}>
          ✓ Confirmar
        </Btn>
        <Btn variant="ghost" className="flex-1" onClick={onCancel}>Cancelar</Btn>
      </div>
    </Modal>
  );
}

// ─── TEMA MODAL ───────────────────────────────────────────────────────────────
const PROVA_STATS = {
  "ENAMED": {
    "Preventiva": { nivel: "Risco Crítico", msg: "Preventiva representa 25% da prova no ENAMED (peso altíssimo)." },
    "Pediatria": { nivel: "Alta", msg: "Pediatria foca em Puericultura e Aleitamento." },
    "Cirurgia": { nivel: "Média", msg: "Foco em Trauma Inicial." },
    "Clínica Médica": { nivel: "Alta", msg: "Incidência distribuída em temas de atenção primária." },
    "GO": { nivel: "Risco Crítico", msg: "Ginecologia tem altíssima repetição de temas." }
  },
  "USP-SP": {
    "Cirurgia": { nivel: "Risco Crítico", msg: "Cirurgia Geral e do Trauma são extremamente puxadas na USP-SP." },
    "Clínica Médica": { nivel: "Risco Crítico", msg: "Questões de Clínica Médica exigem alto nível de raciocínio diagnóstico." },
    "Preventiva": { nivel: "Alta", msg: "Preventiva foca muito em epidemiologia molecular e bioestatística." },
    "Pediatria": { nivel: "Alta", msg: "Questões de Pediatria com imagens e condutas neonatais avançadas." },
    "GO": { nivel: "Média", msg: "Foco em Obstetrícia de alto risco." }
  },
  "UNIFESP": {
    "Clínica Médica": { nivel: "Risco Crítico", msg: "Medicina baseada em evidências e nefrologia/cardiologia complexas." },
    "Preventiva": { nivel: "Risco Crítico", msg: "Muito foco em SUS, saúde coletiva e portarias específicas." },
    "Cirurgia": { nivel: "Alta", msg: "Foco em condutas cirúrgicas práticas de pronto-socorro." },
    "Pediatria": { nivel: "Alta", msg: "Pediatria geral e terapia intensiva pediátrica." },
    "GO": { nivel: "Alta", msg: "Uroginecologia e oncologia ginecológica recorrentes." }
  },
  "SUS-SP": {
    "Preventiva": { nivel: "Risco Crítico", msg: "Epidemiologia e SUS clássico dominam a prova." },
    "Clínica Médica": { nivel: "Alta", msg: "Clínica Geral com ênfase em emergência médica." },
    "Cirurgia": { nivel: "Alta", msg: "Trauma e Cirurgia Geral básica." },
    "Pediatria": { nivel: "Alta", msg: "Puericultura clássica e vacinas." },
    "GO": { nivel: "Média", msg: "GO geral e pré-natal clássico." }
  },
  "SCMSP": {
    "Cirurgia": { nivel: "Alta", msg: "Urgência cirúrgica clássica." },
    "Clínica Médica": { nivel: "Alta", msg: "Semiologia médica refinada." }
  },
  "UNICAMP": {
    "Clínica Médica": { nivel: "Risco Crítico", msg: "Questões discursivas e casos clínicos integrados complexos." },
    "GO": { nivel: "Alta", msg: "Grande volume de obstetrícia fisiológica e patológica." }
  },
  "UFRJ": {
    "Clínica Médica": { nivel: "Alta", msg: "Clínica clássica com condutas de enfermaria." }
  },
  "AMP": {
    "Pediatria": { nivel: "Alta", msg: "Pediatria e vacinas têm alto peso na Região Sul." }
  },
  "ENEM": {
    "Ciências da Natureza": { nivel: "Risco Crítico", msg: "Ecologia, Química Orgânica e Eletrodinâmica são recorrentes." },
    "Redação": { nivel: "Risco Crítico", msg: "Redação nota 1000 representa peso decisivo." },
    "Humanas": { nivel: "Alta", msg: "História do Brasil e Geografia física/humana do país." },
    "Linguagens": { nivel: "Média", msg: "Interpretação textual intensa." },
    "Exatas": { nivel: "Risco Crítico", msg: "Matemática básica, estatística e funções determinam a nota TRI." }
  },
  "FUVEST": {
    "Exatas": { nivel: "Risco Crítico", msg: "Física e Matemática de nível altíssimo e analítico." },
    "Ciências da Natureza": { nivel: "Risco Crítico", msg: "Biologia e Química teórica aprofundada." },
    "Linguagens": { nivel: "Alta", msg: "Literatura com leitura obrigatória estrita." }
  },
  "UFG": {
    "Humanas": { nivel: "Alta", msg: "História e Geografia de Goiás recorrentes." },
    "Linguagens": { nivel: "Alta", msg: "Gêneros textuais específicos." }
  }
};

const getRecomendacao = (esp, provasAlvo = []) => {
  if (!provasAlvo || provasAlvo.length === 0) {
    return { nivel: "Média", msg: "Nenhuma prova alvo selecionada em Ajustes. Defina suas metas para obter recomendações direcionadas." };
  }

  const matches = [];
  provasAlvo.forEach((pr) => {
    const pStat = PROVA_STATS[pr]?.[esp];
    if (pStat) {
      matches.push({ prova: pr, ...pStat });
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

  const rec = getRecomendacao(f.esp, meta.provasAlvo);

  useEffect(() => {
    setF((prev) => ({ ...prev, prio: rec.nivel }));
  }, [f.esp, rec.nivel]);

  return (
    <Modal onClose={onCancel}>
      <h2 className="text-[15px] font-bold text-gray-100">
        {initial?.id ? "Editar tema" : initial?.unstarted ? "Priorizar Tópico" : "Novo tema"}
      </h2>

      <Field label="Nome do tema">
        <Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="ex: Trauma de Tórax" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Área">
          <Select value={f.esp} onChange={(e) => setF({ ...f, esp: e.target.value })}>
            {esps.map((e) => <option key={e}>{e}</option>)}
          </Select>
        </Field>
        <Field label="Data D0">
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
              ? "bg-purple-500/5 border-purple-500/20 text-purple-300"
              : "bg-white/5 border-white/10 text-gray-400"
          }`}>
            <span className="font-bold block mb-1">
              {rec.nivel === "Risco Crítico" ? "🔴 " : rec.nivel === "Alta" ? "🟣 " : "⚪ "}
              {rec.nivel.toUpperCase()}
            </span>
            {rec.msg}
          </div>
        </div>
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
          <Field label="Deck do Anki Correspondente (opcional)">
            <Input value={f.ankiDeck || ""} onChange={(e) => setF({ ...f, ankiDeck: e.target.value })} placeholder="ex: Medicina::Cirurgia::Trauma" />
          </Field>

           {platKey !== "vest" && (
            <Field label="PICO / Caso Clínico (opcional)">
              <Textarea
                rows={2}
                value={f.pico || ""}
                onChange={(e) => setF({ ...f, pico: e.target.value })}
                placeholder="ex: Paciente 25a, dor periumbilical migratória, febre leve. Conduta inicial?"
              />
            </Field>
          )}

          <Field label="Fonte / obs (opcional)">
            <Input value={f.obs} placeholder="ex: MEDCOF Bloco 2" onChange={(e) => setF({ ...f, obs: e.target.value })} />
          </Field>
        </>
      )}

      <div className="flex gap-2 pt-1">
        <Btn className="flex-1" onClick={() => f.nome && onSave(f)} disabled={!f.nome}>Salvar</Btn>
        <Btn variant="ghost" className="flex-1" onClick={onCancel}>Cancelar</Btn>
        {initial && <Btn variant="danger" onClick={() => { if (window.confirm(`Deletar "${initial.nome}"? Esta ação não pode ser desfeita facilmente.`)) onDelete(initial.id); }}><Trash2 size={16} /></Btn>}
      </div>
    </Modal>
  );
}

// ─── AJUSTES MODAL ────────────────────────────────────────────────────────────
export function AjustesModal({ onClose, overdueCount, onResetOnboarding }) {
  const { meta, setMeta, plat, optimize, sprint, setSprint, userName, setUserName, userEmail, setUserEmail } = useStore();
  const [activeTab, setActiveTab] = useState("perfil");
  const esps = plat === "res" ? ESPS_RES : ESPS_VEST;
  const daysLeft = meta.dataProva ? diffDays(todayStr(), meta.dataProva) : null;
  const urgency  = daysLeft == null ? "" : daysLeft <= 30 ? "text-red-400" : daysLeft <= 90 ? "text-yellow-400" : "text-violet-400";

  const tabs = [
    { k: "perfil", label: "👤 Perfil" },
    { k: "ajustes", label: "⚙ Ajustes" },
    { k: "dados", label: "📚 Estudos" },
    { k: "conta", label: "🔒 Conta" }
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
    const backupData = {
      plat: state.plat,
      userName: state.userName,
      meta: state.meta,
      res: state.res,
      vest: state.vest,
      onboardingDone: state.onboardingDone,
      focusMode: state.focusMode,
      modoSimples: state.modoSimples,
      brainDumpD1Data: state.brainDumpD1Data,
      temaStats: state.temaStats,
      vistos: state.vistos || [],
      updatedAt: state.updatedAt || Date.now(),
      version: "reviewflow-v6-backup"
    };
    
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
        if (backup.version !== "reviewflow-v6-backup") {
          alert("Arquivo de backup inválido.");
          return;
        }
        
        const confirmImport = window.confirm("Deseja importar este backup? Seus dados atuais serão sobrescritos.");
        if (!confirmImport) return;

        useStore.setState({
          plat: backup.plat ?? "res",
          userName: backup.userName ?? "Estudante",
          meta: backup.meta ?? { dataProva: "2026-10-25", acerto: 85, metaDiaria: 0 },
          res: backup.res ?? { temas: [], simulados: [], ankiLog: [], cronogramas: [] },
          vest: backup.vest ?? { temas: [], simulados: [], ankiLog: [], cronogramas: [] },
          onboardingDone: backup.onboardingDone ?? false,
          focusMode: backup.focusMode ?? false,
          modoSimples: backup.modoSimples ?? true,
          brainDumpD1Data: backup.brainDumpD1Data ?? {},
          temaStats: backup.temaStats ?? {},
          vistos: backup.vistos ?? [],
          updatedAt: Date.now(),
        });

        alert("Backup importado com sucesso!");
        onClose();
      } catch (err) {
        alert("Erro ao processar o arquivo de backup: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExcluirConta = async () => {
    if (!auth.currentUser) {
      alert("Nenhum usuário logado.");
      return;
    }
    const confirm1 = window.confirm("ATENÇÃO: Você tem certeza que deseja excluir sua conta permanentemente? Todos os seus dados de estudos e revisões serão apagados e não poderão ser recuperados.");
    if (!confirm1) return;
    const confirm2 = window.confirm("Confirmação final: Para excluir seus dados definitivamente da nossa base de dados, clique em OK.");
    if (!confirm2) return;

    try {
      const res = await excluirUsuarioEDados(auth.currentUser.uid);
      if (res.sucesso) {
        alert("Sua conta foi excluída com sucesso.");
        useStore.getState().resetStore();
        onClose();
      } else {
        if (res.erro && res.erro.includes("requires-recent-login")) {
          alert("Por motivos de segurança, esta ação requer um login recente. Por favor, saia da conta, faça o login novamente e tente excluir a conta em seguida.");
        } else {
          alert(`Erro ao excluir conta: ${res.erro}`);
        }
      }
    } catch (e) {
      alert(`Erro: ${e.message}`);
    }
  };

  const questPlatforms = plat === "res"
    ? ["MedEvo", "Medgrupo", "Sanar", "Estratégia", "Outro"]
    : ["Estuda Mais", "Revolução Vestibulares", "Descomplica", "Ferretto", "Outro"];

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h2 className="text-[16px] font-black text-gray-100 flex items-center gap-2">
          <span>⚙ Perfil & Configurações</span>
        </h2>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-lg transition-colors">✕</button>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-white/5">
        {tabs.map(t => (
          <button
            key={t.k}
            onClick={() => setActiveTab(t.k)}
            className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 ${
              activeTab === t.k
                ? "border-violet-500 text-white bg-white/[0.02]"
                : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.01]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        
        {/* TABA 1: PERFIL */}
        {activeTab === "perfil" && (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-center gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center font-black text-white text-2xl select-none shadow-xl shadow-purple-950/60">
                {(userName || "US").substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white leading-tight">{userName || "Estudante"}</h3>
                <p className="text-[10px] text-gray-500 font-mono">{userEmail || "Sem email cadastrado"}</p>
                <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-violet-600/20 text-violet-400 border border-violet-600/30">
                  PLATAFORMA: {plat === "res" ? "Residência" : "Vestibular"}
                </span>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Identificação</p>
              <Field label="Nome de exibição">
                <Input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Seu nome" />
              </Field>
              <Field label="Endereço de email">
                <Input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="email@exemplo.com" />
              </Field>
            </div>
          </div>
        )}

        {/* TABA 2: AJUSTES & METAS */}
        {activeTab === "ajustes" && (
          <div className="space-y-4 animate-fade-up">
            <div className="bg-white/5 rounded-2xl p-4 space-y-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">🎯 Planejamento Geral</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data da prova">
                  <Input type="date" value={meta.dataProva} onChange={(e) => setMeta({ ...meta, dataProva: e.target.value })} />
                </Field>
                <Field label="Meta de acerto (%)">
                  <Input type="number" min={50} max={100} value={meta.acerto} onChange={(e) => setMeta({ ...meta, acerto: +e.target.value })} />
                </Field>
              </div>
              <Field label="Meta diária de revisões (0 = ilimitada)">
                <Input type="number" min={0} value={meta.metaDiaria || 0} onChange={(e) => setMeta({ ...meta, metaDiaria: +e.target.value })} />
              </Field>

              {daysLeft != null && (
                <p className="text-[11px] text-gray-500 italic">
                  Faltam <strong className={urgency}>{daysLeft} dias</strong> para a prova em {fmtFull(meta.dataProva)}.
                </p>
              )}
            </div>

            {/* Otimizador FSRS */}
            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">⚡ Otimizador de Ciclos FSRS</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Reagenda revisões vencidas acumuladas distribuindo-as no tempo e preservando os pesos de retenção.
                {overdueCount > 0 ? <> Você possui <strong className="text-red-400">{overdueCount} pendentes</strong>.</> : " Nenhuma pendência atualmente."}
              </p>
              <Btn onClick={() => { optimize(plat); onClose(); }} disabled={overdueCount === 0} className="w-full">
                Otimizar Filas {overdueCount > 0 ? `(${overdueCount})` : ""}
              </Btn>
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
                  className={`px-3 py-2 rounded-xl text-[12px] font-bold transition-all ${sprint?.ativa ? "bg-red-600/20 text-red-400 border border-red-600/30" : "bg-violet-600 text-white"}`}>
                  {sprint?.ativa ? "Desativar" : "Ativar"}
                </button>
              </div>
              <p className="text-[10px] text-gray-500">Filtrar painel para estas especialidades foco:</p>
              <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto border border-white/5 p-2 rounded-xl bg-black/40">
                {esps.map(esp => (
                  <label key={esp} className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={sprint?.esps?.includes(esp) || false} onChange={() => toggleSprintEsp(esp)} className="rounded border-white/20 text-violet-600 focus:ring-violet-500 bg-black" />
                    <span className="truncate">{esp}</span>
                  </label>
                ))}
              </div>
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
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto border border-white/5 p-2 rounded-xl bg-black/40">
                  {(plat === "res" ? PROVAS_RES : PROVAS_VEST).map((pr) => {
                    const selected = (meta.provasAlvo || []).includes(pr);
                    return (
                      <button
                        key={pr}
                        type="button"
                        onClick={() => {
                          const current = meta.provasAlvo || [];
                          const next = selected ? current.filter((x) => x !== pr) : [...current, pr];
                          setMeta({ ...meta, provasAlvo: next });
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                          selected
                            ? "bg-purple-600 border-purple-500 text-white shadow-sm shadow-purple-900/30"
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
                <Field label="Plataforma de questões preferida">
                  <Select
                    value={meta.plataformaQuestoes || questPlatforms[0]}
                    onChange={(e) => setMeta({ ...meta, plataformaQuestoes: e.target.value })}
                  >
                    {questPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </Field>
                <Field label="Horas disponíveis / dia">
                  <Input type="number" min={1} max={24} value={meta.tempoDisponivel || 2} onChange={(e) => setMeta({ ...meta, tempoDisponivel: +e.target.value })} />
                </Field>
              </div>

              {plat === "vest" && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <label className="flex items-center gap-2 text-[12px] text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={meta.isSegundaTentativa || false}
                      onChange={(e) => setMeta({ ...meta, isSegundaTentativa: e.target.checked })}
                      className="rounded border-white/20 text-violet-600 focus:ring-violet-500 bg-black"
                    />
                    <span>Segunda tentativa / Mais de um ano estudando</span>
                  </label>
                  <Field label="Nota de corte alvo (ou nota desejada)">
                    <Input type="number" min={0} value={meta.notaCorteAlvo || 0} onChange={(e) => setMeta({ ...meta, notaCorteAlvo: +e.target.value })} placeholder="Ex: 820" />
                  </Field>
                  <Field label="Área de maior dificuldade">
                    <Select
                      value={meta.areaPuxouBaixo || ""}
                      onChange={(e) => setMeta({ ...meta, areaPuxouBaixo: e.target.value })}
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[11px] font-bold transition-all"
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

// ─── BRAIN DUMP D1 ASSISTENTE MODAL ───────────────────────────────────────────
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
    { k: "epidemiologia", l: "📍 Epidemiologia / Fatores de Risco", p: "Quem? Quando? Ocorrência típica de prova..." },
    { k: "fisiopatologia", l: "🔬 Fisiopatologia / Mecanismo", p: "Vias biológicas, gatilhos anatômicos cruciais..." },
    { k: "diagnostico", l: "🔍 Critérios Diagnósticos / exames", p: "Padrão-ouro, sinais clínicos patognomônicos..." },
    { k: "conduta", l: "💊 Conduta Inicial e Tratamento", p: "Medicamentos, doses, indicações cirúrgicas puras..." },
    { k: "complicacoes", l: "⚠️ Complicações / Padrões de Erro", p: "O que o distrator de prova tenta induzir a errar..." }
  ];

  return (
    <Modal onClose={onCancel} wide>
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div><h2 className="text-[15px] font-black text-white">{tema.nome}</h2><p className="text-[11px] text-gray-500">Brain Dump D1</p></div>
        <div className={`px-3 py-1 rounded-xl font-mono text-[16px] font-black ${seconds <= 60 ? "bg-red-600/20 text-red-400 border border-red-500/30 animate-pulse" : "bg-white/5 text-violet-400 border border-white/10"}`}>{fmtTimer()}</div>
      </div>
      <div className="space-y-3 my-2 max-h-[55vh] overflow-y-auto pr-1 text-left">
        {formMapeamento.map(f => (
          <div key={f.k} className="space-y-1"><label className="block text-[11px] font-bold text-gray-400 uppercase">{f.l}</label><Textarea rows={2} value={fields[f.k]} onChange={e => setFields({ ...fields, [f.k]: e.target.value })} placeholder={f.p} /></div>
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

// ─── GLOBAL SEARCH MODAL (Ctrl + K) ──────────────────────────────────────────
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
                    className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-purple-900/10"
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
