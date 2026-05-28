// src/components/Modals.jsx
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Calendar, BarChart3, FileText, Zap, Target, BookOpen, 
  TrendingUp, Award, Edit2, Trash2
} from "lucide-react";
import { useStore } from "../core/store";
import {
  STEPS, PRIO, IMPORTANCIA, ESPS_RES, ESPS_VEST,
  todayStr, diffDays, fmtFull
} from "../core/fsrs";
import {
  Modal, Btn, Input, Textarea, Select, Field, MedRevLogo
} from "./Primitives";

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
          {[["secoes","Seções"], ["fluxo","Fluxo FSRS"]].map(([k,l]) => (
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

        <Btn className="w-full" onClick={onClose}>Entendido — vamos estudar!</Btn>
      </div>
    </Modal>
  );
}

// ─── CYCLE COMPLETE MODAL ─────────────────────────────────────────────────────
export function CycleCompleteModal({ tema, onClose }) {
  const done = Object.values(tema.rev).filter(r => r.done && r.acerto != null);
  const avgAcerto = done.length ? Math.round(done.reduce((a, r) => a + r.acerto, 0) / done.length * 100) : 0;

  return (
    <Modal onClose={onClose}>
      <div className="text-center py-6">
        <p className="text-6xl mb-4">🎉</p>
        <h2 className="text-2xl font-black text-white mb-2">Ciclo Completo!</h2>
        <p className="text-gray-400 text-sm mb-4">Você completou todos os passos de <span className="text-violet-400 font-bold">{tema.nome}</span></p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Acerto Médio do Ciclo</p>
          <p className={`text-3xl font-black ${avgAcerto >= 80 ? "text-emerald-400" : avgAcerto >= 65 ? "text-violet-400" : "text-red-400"}`}>
            {avgAcerto}%
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white rounded-xl font-bold text-[13px] transition-all">
          Continuar
        </button>
      </div>
    </Modal>
  );
}

// ─── ONBOARDING MODAL ──────────────────────────────────────────────────────────
export function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [plataforma, setPlataforma] = useState("res");
  const [dataProva, setDataProva] = useState("2026-10-25");
  const [metaAcerto, setMetaAcerto] = useState(85);
  const TOTAL_STEPS = 5;

  const next = () => {
    if (step === 2 && !nome.trim()) return;
    if (step < TOTAL_STEPS) setStep(step + 1);
    else onComplete(nome.trim() || "Estudante", plataforma, { dataProva, acerto: metaAcerto });
  };
  const prev = () => { if (step > 1) setStep(step - 1); };

  return (
    <div className="fixed inset-0 bg-[#05050d]/97 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-[#0d0d18] border border-white/10 rounded-3xl p-6 w-full max-w-md flex flex-col gap-5 shadow-2xl shadow-purple-900/20 animate-slide-up">
        {/* Progress bar */}
        <div className="flex gap-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < step ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/10"}`} />
          ))}
        </div>

        <div className="flex flex-col items-center text-center gap-4 py-1 min-h-[340px]">
          {step === 1 && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="mt-2">
                <MedRevLogo size="lg" showTagline />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mt-3">Bem-vindo ao MedRev</h2>
                <p className="text-[13px] text-gray-400 mt-2 leading-relaxed">
                  O sistema de performance científica para quem leva a residência médica a sério.
                </p>
              </div>
              <div className="w-full flex flex-col gap-2 mt-1">
                {[
                  { icon: "🧠", text: "Algoritmo FSRS-Lite com espaçamento por curva de esquecimento" },
                  { icon: "📊", text: "Métricas de elite: True Retention, Bleeding Score e Elite Analytics" },
                  { icon: "🎯", text: "Fila inteligente priorizada por importância × urgência × acerto" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl text-left">
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <p className="text-[12px] text-gray-300 leading-tight">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="w-full flex flex-col items-center gap-4 mt-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20">
                👋
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-1">Como te chamamos?</h2>
                <p className="text-[12px] text-gray-400">Personalizamos a experiência para você.</p>
              </div>
              <Input
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && nome.trim() && next()}
                placeholder="Seu primeiro nome"
                className="text-center text-sm py-3 max-w-xs"
              />
            </div>
          )}

          {step === 3 && (
            <div className="w-full flex flex-col items-center gap-4 mt-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">
                🎯
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-1">Qual o seu foco?</h2>
                <p className="text-[12px] text-gray-400">Define especialidades e currículo do painel.</p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button onClick={() => setPlataforma("res")} className={`p-4 rounded-2xl border text-left transition-all ${plataforma === "res" ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-900/20" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏥</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-white">Residência Médica</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Cirurgia · Clínica · GO · Pediatria · Preventiva</p>
                    </div>
                    {plataforma === "res" && <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shrink-0" />}
                  </div>
                </button>
                <button onClick={() => setPlataforma("vest")} className={`p-4 rounded-2xl border text-left transition-all ${plataforma === "vest" ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-900/20" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📚</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-white">Vestibular / ENEM</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Exatas · Humanas · Linguagens · Natureza · Redação</p>
                    </div>
                    {plataforma === "vest" && <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shrink-0" />}
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="w-full flex flex-col items-center gap-4 mt-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20">
                ⚙️
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-1">Configure suas metas</h2>
                <p className="text-[12px] text-gray-400">Usamos para calcular urgência e projeção.</p>
              </div>
              <div className="flex flex-col gap-4 w-full">
                <Field label="Data da prova">
                  <Input type="date" value={dataProva} onChange={(e) => setDataProva(e.target.value)} />
                </Field>
                <div>
                  <div className="flex justify-between items-baseline mb-2.5">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Meta de acerto</span>
                    <span className={`text-2xl font-black tabular-nums ${metaAcerto >= 85 ? "text-emerald-400" : metaAcerto >= 70 ? "text-yellow-400" : "text-red-400"}`}>{metaAcerto}%</span>
                  </div>
                  <input type="range" min={50} max={100} step={5} value={metaAcerto}
                    onChange={(e) => setMetaAcerto(+e.target.value)}
                    className="w-full accent-purple-500 cursor-pointer h-1" />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-700">50%</span>
                    <span className="text-[10px] text-gray-700">100%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="w-full flex flex-col items-center gap-4 mt-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-violet-500/20">
                🚀
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-1">Tudo pronto{nome ? `, ${nome}` : ""}!</h2>
                <p className="text-[12px] text-gray-400">O ciclo de revisão funciona assim:</p>
              </div>
              <div className="flex flex-col gap-2 w-full text-left">
                {[
                  { step: "D0", emoji: "📖", label: "Estude + resolva questões, marque o acerto" },
                  { step: "D1", emoji: "✍️", label: "Brain dump de memória (5 min, sem material)" },
                  { step: "D4", emoji: "📝", label: "Revisão ativa com questões focadas no tema" },
                  { step: "D7", emoji: "🔄", label: "Questões + Anki + corrija erros do simulado" },
                  { step: "D21", emoji: "🎯", label: "Revisão interleaved — ciclo completo!" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3 p-2.5 bg-white/[0.03] border border-white/5 rounded-xl">
                    <span className="text-base shrink-0">{item.emoji}</span>
                    <span className="text-[10px] font-black font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded shrink-0">{item.step}</span>
                    <p className="text-[12px] text-gray-300 leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {step > 1 && (
            <Btn variant="ghost" onClick={prev} className="flex-none px-4">←</Btn>
          )}
          <Btn className="flex-1" onClick={next} disabled={step === 2 && !nome.trim()}>
            {step === TOTAL_STEPS ? "🚀 Entrar no MedRev" : "Continuar →"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── MARK MODAL ───────────────────────────────────────────────────────────────
export function MarkModal({ tema, stepKey, onConfirm, onCancel }) {
  const step    = STEPS.find((s) => s.key === stepKey);
  const [acerto,   setAcerto]   = useState(75);
  const [questoes, setQuestoes] = useState("");
  const [motivos, setMotivos]   = useState([]);
  const isD1  = step.checkbox;
  const col   = acerto >= 90 ? "text-emerald-400" : acerto >= 75 ? "text-violet-400" : acerto >= 55 ? "text-yellow-400" : "text-red-400";
  const label = acerto >= 90 ? "Domínio sólido 🎯" : acerto >= 75 ? "Bom progresso" : acerto >= 55 ? "Em consolidação" : "Ponto fraco — revise mais";

  const tiposErro = [
    { k: "lacuna", l: "Lacuna de Conteúdo" },
    { k: "raciocinio", l: "Erro de Raciocínio" },
    { k: "distractor", l: "Caiu em Distrator" },
    { k: "descuido", l: "Falta de Atenção / Descuido" },
    { k: "nao_visto", l: "Conteúdo Não Visto" }
  ];

  const toggleMotivo = (k) => {
    if (motivos.includes(k)) setMotivos(motivos.filter(m => m !== k));
    else setMotivos([...motivos, k]);
  };

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
          <Field label="Questões resolvidas nesta sessão">
            <Input type="number" value={questoes} onChange={(e) => setQuestoes(e.target.value)} placeholder="ex: 30" />
          </Field>
          <div>
            <div className="flex justify-between items-baseline mb-2.5">
              <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">% de acerto</span>
              <span className={`text-3xl font-black font-mono tabular-nums ${col}`}>{acerto}%</span>
            </div>
            <input type="range" min={0} max={100} value={acerto}
              onChange={(e) => setAcerto(+e.target.value)}
              className="w-full accent-violet-500 h-1 cursor-pointer" />
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-gray-700">0%</span>
              <span className={`text-[11px] font-semibold ${col}`}>{label}</span>
              <span className="text-[10px] text-gray-700">100%</span>
            </div>
          </div>

          {acerto < 75 && (
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 animate-fade-up">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mb-2">🔍 Auditoria de Causa de Erros:</p>
              <div className="flex flex-col gap-1.5">
                {tiposErro.map(t => (
                  <label key={t.k} className="flex items-center gap-2 text-[12px] text-gray-300 cursor-pointer select-none">
                    <input type="checkbox" checked={motivos.includes(t.k)} onChange={() => toggleMotivo(t.k)} className="rounded border-white/20 text-violet-600 focus:ring-violet-500 bg-black" />
                    {t.l}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Btn className="flex-1"
          onClick={() => onConfirm({ acerto: isD1 ? null : acerto / 100, questoes: questoes ? +questoes : null, motivosErro: motivos })}>
          ✓ Confirmar
        </Btn>
        <Btn variant="ghost" className="flex-1" onClick={onCancel}>Cancelar</Btn>
      </div>
    </Modal>
  );
}

// ─── TEMA MODAL ───────────────────────────────────────────────────────────────
export function TemaModal({ initial, platKey, onSave, onCancel, onDelete }) {
  const esps = platKey === "res" ? ESPS_RES : ESPS_VEST;
  const [f, setF] = useState(
    initial || { nome: "", esp: esps[0], d0: todayStr(), prio: "Alta", importancia: "ALTA", obs: "", pico: "", ankiDeck: "" }
  );
  const [showOptional, setShowOptional] = useState(!!(initial?.ankiDeck || initial?.pico || initial?.obs));

  return (
    <Modal onClose={onCancel}>
      <h2 className="text-[15px] font-bold text-gray-100">{initial ? "Editar tema" : "Novo tema"}</h2>

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
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-1.5">Prioridade</p>
          <Select value={f.prio} onChange={(e) => setF({ ...f, prio: e.target.value })}>
            {Object.keys(PRIO).map((k) => <option key={k}>{k}</option>)}
          </Select>
        </div>
        <div>
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

          <Field label="PICO / Caso Clínico (opcional)">
            <Textarea
              rows={2}
              value={f.pico || ""}
              onChange={(e) => setF({ ...f, pico: e.target.value })}
              placeholder="ex: Paciente 25a, dor periumbilical migratória, febre leve. Conduta inicial?"
            />
          </Field>

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
  const { meta, setMeta, plat, optimize, sprint, setSprint } = useStore();
  const esps = plat === "res" ? ESPS_RES : ESPS_VEST;
  const daysLeft = meta.dataProva ? diffDays(todayStr(), meta.dataProva) : null;
  const urgency  = daysLeft == null ? "" : daysLeft <= 30 ? "text-red-400" : daysLeft <= 90 ? "text-yellow-400" : "text-violet-400";

  const toggleSprintEsp = (esp) => {
    const currentEsps = sprint?.esps || [];
    if (currentEsps.includes(esp)) {
      setSprint({ ...sprint, esps: currentEsps.filter(e => e !== esp) });
    } else {
      setSprint({ ...sprint, esps: [...currentEsps, esp] });
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-gray-100">⚙ Ajustes</h2>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-lg transition-colors">✕</button>
      </div>

      <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">🎯 Metas</p>
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
          <p className="text-[12px] text-gray-500">
            Faltam <strong className={urgency}>{daysLeft} dias</strong> · {fmtFull(meta.dataProva)}
          </p>
        )}
      </div>

      {/* Módulo Volátil Sprint Semanal Focado */}
      <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-3">
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

      <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">⚡ Reordenar ciclo</p>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          Reagenda revisões vencidas preservando os tempos algorítmicos.
          {overdueCount > 0 ? <> Você tem <strong className="text-red-400">{overdueCount} vencidas</strong>.</> : " Tudo regularizado."}
        </p>
        <Btn onClick={() => { optimize(plat); onClose(); }} disabled={overdueCount === 0} className="w-full">
          Otimizar Filas {overdueCount > 0 ? `(${overdueCount})` : ""}
        </Btn>
      </div>

      <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ℹ️ Tutoriais</p>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          Reveja o guia de onboarding e aprenda mais sobre como usar o MedRev.
        </p>
        <Btn variant="ghost" onClick={() => { onResetOnboarding(); onClose(); }} className="w-full">
          Ver Guia de Boas-vindas
        </Btn>
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
