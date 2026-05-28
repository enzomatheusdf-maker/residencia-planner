// src/components/StatsPanel.jsx
import React, { useState, useMemo } from "react";
import { BarChart3, ShieldAlert } from "lucide-react";
import { useStore } from "../core/store";
import { STEPS, ESP_COLORS } from "../core/fsrs";
import { migrarSim } from "../hooks/useMetrics";

const PROVA_STATS = {
  ENAMED: {
    areas: [
      { name: "Cirurgia Geral", pct: 20 }, { name: "Clínica Médica", pct: 20 },
      { name: "Ginecologia e Obstetrícia", pct: 20 }, { name: "Pediatria", pct: 20 },
      { name: "Medicina Preventiva", pct: 20 }
    ],
    subtemasCirurgia: [
      { name: "Trauma de Tórax e Abdominal", pct: 32 }, { name: "Abdome Agudo (Inflamatório/Obstrutivo)", pct: 28 },
      { name: "Hérnias da Parede Abdominal", pct: 18 }, { name: "Cuidados Pré/Pós-Operatórios (REMIT)", pct: 14 },
      { name: "Atendimento Inicial ao Politraumatizado", pct: 8 }
    ],
    gaps2025: [
      { name: "Queimaduras Graves e Reposição Volumétrica", especialidade: "Cirurgia / Emergência", risk: "Crítico" },
      { name: "Níveis de Prevenção e Indicadores de Saúde APS", especialidade: "Preventiva", risk: "Alto" },
      { name: "Emergências Hiperglicêmicas (CAD / EHH)", especialidade: "Clínica Médica", risk: "Alto" }
    ]
  },
  "USP-SP": {
    areas: [
      { name: "Cirurgia Especializada", pct: 22 }, { name: "Clínica Médica", pct: 21 },
      { name: "Obstetrícia e Ginecologia", pct: 19 }, { name: "Pediatria Pura", pct: 18 },
      { name: "Epidemiologia e SUS", pct: 20 }
    ],
    subtemasCirurgia: [
      { name: "Atendimento Avançado no Trauma (ATLS 10)", pct: 35 }, { name: "Afecções Cirúrgicas do Esôfago e Estômago", pct: 25 },
      { name: "Abdome Agudo Vascular e Isquêmico", pct: 20 }, { name: "Cicatrização, Fios e Anestésicos Locais", pct: 12 },
      { name: "Urologia de Emergência (Escroto Agudo)", pct: 8 }
    ],
    gaps2025: [
      { name: "Trauma Cranioencefálico (TCE) e Drenagem", especialidade: "Cirurgia", risk: "Crítico" },
      { name: "Infecções Congênitas e Triagem Neonatal", especialidade: "Pediatria", risk: "Alto" }
    ]
  },
  "UNIFESP": {
    areas: [
      { name: "Cirurgia Geral e Trauma", pct: 23 }, { name: "Clínica Médica", pct: 20 },
      { name: "Saúde Coletiva", pct: 19 }, { name: "Pediatria", pct: 18 },
      { name: "Ginecologia de Alta Complexidade", pct: 20 }
    ],
    subtemasCirurgia: [
      { name: "Pancreatite Aguda e Urgências Biliares", pct: 30 }, { name: "Nódulos Hepáticos e Carcinoma Hepatocelular", pct: 25 },
      { name: "Hérnias Inguinais (Anatomia do Canal)", pct: 22 }, { name: "Apendicite Aguda e Complicações Obstrutivas", pct: 15 },
      { name: "Trombose Venosa Profunda e Profilaxia", pct: 8 }
    ],
    gaps2025: [
      { name: "Diverticulite Aguda e Classificação de Hinchey", especialidade: "Cirurgia", risk: "Crítico" },
      { name: "Nefrologia Pediátrica e Glomerulopatias", especialidade: "Pediatria", risk: "Alto" }
    ]
  }
};

export default function StatsPanel() {
  const [mainTab, setMainTab] = useState("meu");
  const [selectedProva, setSelectedProva] = useState(null);
  const { plat } = useStore();
  const temas = useStore((s) => s[plat]?.temas || []);
  const rawSimulados = useStore((s) => s[plat]?.simulados || []);

  // Determine available provas based on platform
  const provasDisponiveis = plat === "res" ? Object.keys(PROVA_STATS) : ["ENEM", "FUVEST"];

  // Initialize selectedProva on first render or when platform changes
  if (selectedProva === null) {
    const firstProva = provasDisponiveis[0];
    if (firstProva !== selectedProva) {
      setSelectedProva(firstProva);
    }
  }

  // Ensure selectedProva is valid for current platform
  const validProva = selectedProva && provasDisponiveis.includes(selectedProva) ? selectedProva : provasDisponiveis[0];
  const prova = PROVA_STATS[validProva] || {};

  const simulados = useMemo(() => rawSimulados.map(migrarSim), [rawSimulados]);

  const personalStats = useMemo(() => {
    if (!temas.length) return null;
    const byEsp = {};
    let totalQuestoes = 0, totalDoneSteps = 0;
    temas.forEach(t => {
      if (!byEsp[t.esp]) byEsp[t.esp] = { questoes: 0, acertos: [], doneSteps: 0, total: 0 };
      STEPS.forEach(s => {
        const r = t.rev[s.key];
        byEsp[t.esp].total++;
        if (r.done) {
          byEsp[t.esp].doneSteps++;
          totalDoneSteps++;
          if (r.questoes) { byEsp[t.esp].questoes += r.questoes; totalQuestoes += r.questoes; }
          if (r.acerto != null) byEsp[t.esp].acertos.push(r.acerto);
        }
      });
    });
    const espStats = Object.entries(byEsp).map(([esp, v]) => ({
      esp,
      acc: v.acertos.length ? Math.round(v.acertos.reduce((a, b) => a + b) / v.acertos.length * 100) : null,
      questoes: v.questoes,
      doneSteps: v.doneSteps,
      total: v.total,
      progress: Math.round(v.doneSteps / v.total * 100),
    })).sort((a, b) => b.questoes - a.questoes);
    const withAcc = espStats.filter(e => e.acc != null);
    const bestEsp  = withAcc.length ? [...withAcc].sort((a, b) => b.acc - a.acc)[0]  : null;
    const worstEsp = withAcc.length ? [...withAcc].sort((a, b) => a.acc - b.acc)[0]  : null;
    const allAcertos = temas.flatMap(t => STEPS.map(s => t.rev[s.key])).filter(r => r.done && r.acerto != null);
    const overallAcc = allAcertos.length ? Math.round(allAcertos.reduce((a, r) => a + r.acerto, 0) / allAcertos.length * 100) : null;
    const totalConcluidos = temas.filter(t => STEPS.every(s => t.rev[s.key].done)).length;
    const simPcts = simulados.map(s => s.pct);
    const simAvg = simPcts.length ? Math.round(simPcts.reduce((a, b) => a + b) / simPcts.length) : null;
    return { espStats, totalQuestoes, totalDoneSteps, bestEsp, worstEsp, overallAcc, totalConcluidos, simAvg };
  }, [temas, simulados]);

  return (
    <div className="space-y-5 animate-fade-up text-left">
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
        <button onClick={() => setMainTab("meu")} className={`px-4 py-2 rounded-lg text-[12px] font-black transition-all ${mainTab === "meu" ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "text-gray-500 hover:text-gray-300"}`}>Meu Desempenho</button>
        <button onClick={() => setMainTab("provas")} className={`px-4 py-2 rounded-lg text-[12px] font-black transition-all ${mainTab === "provas" ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-300"}`}>Análise de Provas</button>
      </div>

      {/* ─── ABA: MEU DESEMPENHO ─────────────────────────────────────────── */}
      {mainTab === "meu" && (
        <div className="space-y-5">
          {!temas.length ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <BarChart3 size={40} className="text-gray-700" />
              <p className="text-[13px] text-gray-500">Adicione temas ao seu banco para ver estatísticas pessoais.</p>
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Temas", value: temas.length, color: "text-purple-400" },
                  { label: "Questões", value: (personalStats?.totalQuestoes || 0).toLocaleString("pt-BR"), color: "text-blue-400" },
                  { label: "Ciclos Completos", value: personalStats?.totalConcluidos ?? 0, color: "text-emerald-400" },
                  { label: "Acerto Médio", value: personalStats?.overallAcc != null ? `${personalStats.overallAcc}%` : "—",
                    color: personalStats?.overallAcc == null ? "text-gray-500" : personalStats.overallAcc >= 80 ? "text-emerald-400" : personalStats.overallAcc >= 65 ? "text-yellow-400" : "text-red-400" },
                ].map(s => (
                  <div key={s.label} className="bg-[#111113] border border-white/5 rounded-2xl p-4">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
                    <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Simulados avg + best/worst */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Média Simulados</p>
                  <p className={`text-2xl font-black tabular-nums ${personalStats?.simAvg == null ? "text-gray-600" : personalStats.simAvg >= 70 ? "text-cyan-400" : "text-yellow-400"}`}>
                    {personalStats?.simAvg != null ? `${personalStats.simAvg}%` : "—"}
                  </p>
                </div>
                {personalStats?.bestEsp && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                    <p className="text-[10px] text-emerald-400/70 uppercase font-bold mb-1">🏆 Melhor Área</p>
                    <p className="text-[13px] font-bold text-white truncate">{personalStats.bestEsp.esp}</p>
                    <p className="text-2xl font-black text-emerald-400">{personalStats.bestEsp.acc}%</p>
                  </div>
                )}
                {personalStats?.worstEsp && personalStats.worstEsp.esp !== personalStats.bestEsp?.esp && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                    <p className="text-[10px] text-red-400/70 uppercase font-bold mb-1">⚠️ Zona de Risco</p>
                    <p className="text-[13px] font-bold text-white truncate">{personalStats.worstEsp.esp}</p>
                    <p className="text-2xl font-black text-red-400">{personalStats.worstEsp.acc}%</p>
                  </div>
                )}
              </div>

              {/* By specialty */}
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Desempenho por Especialidade</h3>
                <div className="space-y-4">
                  {personalStats?.espStats.map(e => {
                    const espC = ESP_COLORS[e.esp] || "#94a3b8";
                    const accColor = e.acc == null ? "text-gray-600" : e.acc >= 80 ? "text-emerald-400" : e.acc >= 65 ? "text-yellow-400" : "text-red-400";
                    return (
                      <div key={e.esp} className="space-y-1.5">
                        <div className="flex justify-between text-[12px]">
                          <span className="font-semibold text-gray-300">{e.esp}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 text-[11px]">{e.questoes.toLocaleString("pt-BR")} questões</span>
                            <span className={`font-black tabular-nums ${accColor}`}>{e.acc != null ? `${e.acc}%` : "—"}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${e.progress}%`, background: espC + "cc" }} />
                        </div>
                        <p className="text-[10px] text-gray-600">{e.doneSteps}/{e.total} etapas · {e.progress}% do ciclo concluído</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── ABA: ANÁLISE DE PROVAS ──────────────────────────────────────── */}
      {mainTab === "provas" && (
        <div className="space-y-5">
          {plat === "res" ? (
            <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
              {provasDisponiveis.map(p => (
                <button type="button" key={p} onClick={() => setSelectedProva(p)} className={`px-4 py-2 rounded-lg text-[12px] font-black transition-all ${validProva === p ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-300"}`}>{p}</button>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-[13px] text-gray-400">Análise de provas específicas em desenvolvimento para vestibular.</p>
            </div>
          )}
          {plat === "res" && prova && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Incidência Geral por Área</h3>
                <div className="space-y-3">
                  {prova.areas?.map(a => (
                    <div key={a.name} className="space-y-1">
                      <div className="flex justify-between text-[11.5px] font-semibold text-gray-300">
                        <span>{a.name}</span><span className="font-mono text-purple-400">{a.pct}%</span>
                      </div>
                      <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all" style={{ width: `${a.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-[13px] font-bold text-orange-400 uppercase tracking-wider">Subtemas Cirurgia Mais Cobrados</h3>
                <div className="space-y-3">
                  {prova.subtemasCirurgia?.map(s => (
                    <div key={s.name} className="space-y-1">
                      <div className="flex justify-between text-[11.5px] font-semibold text-gray-300">
                        <span>{s.name}</span><span className="font-mono text-orange-400">{s.pct}%</span>
                      </div>
                      <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-3">
                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-red-400" /> Tópicos de Risco — Prova 2026
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {prova.gaps2025?.map((g, idx) => (
                    <div key={idx} className="p-3 border border-red-500/15 rounded-xl bg-red-500/[0.02]">
                      <p className="text-[13px] font-bold text-gray-200">{g.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{g.especialidade}</p>
                      <span className="mt-2 inline-block text-[9px] font-black tracking-widest uppercase bg-red-600/20 text-red-400 border border-red-600/30 px-1.5 py-0.5 rounded">Risco {g.risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
