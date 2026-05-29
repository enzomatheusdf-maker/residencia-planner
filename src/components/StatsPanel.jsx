// src/components/StatsPanel.jsx
import React, { useState, useMemo } from "react";
import { BarChart3, ShieldAlert, Award, AlertTriangle, TrendingUp, Info, HelpCircle, Flame } from "lucide-react";
import { useStore } from "../core/store";
import { STEPS, ESP_COLORS, todayStr, addDays, fmtDate } from "../core/fsrs";
import { migrarSim, PESOS_PROVA_VEST } from "../hooks/useMetrics";

const PROVA_STATS = {
  ENAMED: {
    areas: [
      { name: "Cirurgia Geral", pct: 20 }, { name: "Clínica Médica", pct: 20 },
      { name: "Ginecologia e Obstetrícia", pct: 20 }, { name: "Pediatria", pct: 20 },
      { name: "Medicina Preventiva", pct: 20 }
    ],
    subtemasFoco: [
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
    subtemasFoco: [
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
    subtemasFoco: [
      { name: "Pancreatite Aguda e Urgências Biliares", pct: 30 }, { name: "Nódulos Hepáticos e Carcinoma Hepatocelular", pct: 25 },
      { name: "Hérnias Inguinais (Anatomia do Canal)", pct: 22 }, { name: "Apendicite Aguda e Complicações Obstrutivas", pct: 15 },
      { name: "Trombose Venosa Profunda e Profilaxia", pct: 8 }
    ],
    gaps2025: [
      { name: "Diverticulite Aguda e Classificação de Hinchey", especialidade: "Cirurgia", risk: "Crítico" },
      { name: "Nefrologia Pediátrica e Glomerulopatias", especialidade: "Pediatria", risk: "Alto" }
    ]
  },
  ENEM: {
    areas: [
      { name: "Matemática e suas Tecnologias", pct: 25 },
      { name: "Ciências da Natureza e suas Tecnologias", pct: 25 },
      { name: "Ciências Humanas e suas Tecnologias", pct: 25 },
      { name: "Linguagens, Códigos e suas Tecnologias", pct: 25 }
    ],
    subtemasFoco: [
      { name: "Geometria Plana e Espacial", pct: 30 },
      { name: "Funções (Afim e Quadrática)", pct: 25 },
      { name: "Estatística (Média, Mediana, Moda)", pct: 20 },
      { name: "Eletrodinâmica (Circuitos e Potência)", pct: 15 },
      { name: "Estequiometria e Soluções", pct: 10 }
    ],
    gaps2025: [
      { name: "Funções Trigonométricas e Gráficos", especialidade: "Matemática", risk: "Crítico" },
      { name: "Termodinâmica e Leis dos Gases", especialidade: "Física", risk: "Alto" },
      { name: "Genética Molecular e Biotecnologia", especialidade: "Biologia", risk: "Alto" }
    ]
  },
  FUVEST: {
    areas: [
      { name: "Matemática", pct: 20 },
      { name: "Física e Química", pct: 30 },
      { name: "Biologia", pct: 15 },
      { name: "História e Geografia", pct: 20 },
      { name: "Português e Literatura", pct: 15 }
    ],
    subtemasFoco: [
      { name: "Geometria Analítica e Cônicas", pct: 32 },
      { name: "Trigonometria no Ciclo", pct: 24 },
      { name: "Cinemática e Dinâmica", pct: 20 },
      { name: "Química Orgânica e Isomeria", pct: 14 },
      { name: "Citologia e Divisão Celular", pct: 10 }
    ],
    gaps2025: [
      { name: "Cônicas (Elipse, Hipérbole, Parábola)", especialidade: "Matemática", risk: "Crítico" },
      { name: "Equilíbrio Químico e pH", especialidade: "Química", risk: "Alto" },
      { name: "Obras Literárias Obrigatórias", especialidade: "Literatura", risk: "Alto" }
    ]
  },
  UFG: {
    areas: [
      { name: "Matemática", pct: 22 },
      { name: "Ciências da Natureza", pct: 28 },
      { name: "História e Geografia (Geral e Goiás)", pct: 24 },
      { name: "Linguagens e Literatura", pct: 26 }
    ],
    subtemasFoco: [
      { name: "Funções e Análise Gráfica", pct: 30 },
      { name: "Geografia Física e Climas de Goiás", pct: 25 },
      { name: "Estequiometria Básica", pct: 20 },
      { name: "História Regional de Goiás", pct: 15 },
      { name: "Ecologia e Impactos Ambientais", pct: 10 }
    ],
    gaps2025: [
      { name: "Geografia e Geologia de Goiás", especialidade: "Geografia", risk: "Crítico" },
      { name: "Cinemática Escalar e Vetores", especialidade: "Física", risk: "Alto" },
      { name: "Sintaxe do Período Composto", especialidade: "Português", risk: "Alto" }
    ]
  },
  UnB: {
    areas: [
      { name: "Matemática e Ciências da Natureza", pct: 35 },
      { name: "Ciências Humanas, Filosofia e Sociologia", pct: 30 },
      { name: "Linguagens, Literatura e Artes", pct: 35 }
    ],
    subtemasFoco: [
      { name: "Cálculo de Áreas e Volumes", pct: 28 },
      { name: "Eletromagnetismo e Indução", pct: 24 },
      { name: "Fisiologia Humana e Imunologia", pct: 20 },
      { name: "Química Geral e Termoquímica", pct: 16 },
      { name: "Vanguardas Europeias e Arte Brasileira", pct: 12 }
    ],
    gaps2025: [
      { name: "Obras Literárias do PAS / UnB", especialidade: "Literatura", risk: "Crítico" },
      { name: "Contratualistas e Ética", especialidade: "Filosofia", risk: "Alto" },
      { name: "Genética Mendeliana e Cruzamentos", especialidade: "Biologia", risk: "Alto" }
    ]
  }
};

export default function StatsPanel() {
  const [mainTab, setMainTab] = useState("meu");
  const [selectedProva, setSelectedProva] = useState(null);
  const { plat, temaStats } = useStore();
  const temas = useStore((s) => s[plat]?.temas || []);
  const rawSimulados = useStore((s) => s[plat]?.simulados || []);

  const totalSessions = useMemo(() => {
    return temas.flatMap((t) => Object.values(t.rev)).filter((r) => r.done).length;
  }, [temas]);

  // Determine available provas based on platform
  const provasDisponiveis = plat === "res" 
    ? ["ENAMED", "USP-SP", "UNIFESP"] 
    : ["ENEM", "FUVEST", "UFG", "UnB"];

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
    const startedTemas = temas.filter(t => !t.unstarted);
    if (!startedTemas.length) return null;
    const byEsp = {};
    let totalQuestoes = 0, totalDoneSteps = 0;
    startedTemas.forEach(t => {
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
    const allAcertos = startedTemas.flatMap(t => STEPS.map(s => t.rev[s.key])).filter(r => r.done && r.acerto != null);
    const overallAcc = allAcertos.length ? Math.round(allAcertos.reduce((a, r) => a + r.acerto, 0) / allAcertos.length * 100) : null;
    const totalConcluidos = startedTemas.filter(t => STEPS.every(s => t.rev[s.key].done)).length;
    const simPcts = simulados.map(s => s.pct);
    const simAvg = simPcts.length ? Math.round(simPcts.reduce((a, b) => a + b) / simPcts.length) : null;
    return { espStats, totalQuestoes, totalDoneSteps, bestEsp, worstEsp, overallAcc, totalConcluidos, simAvg };
  }, [temas, simulados]);

  // 12-Week Heatmap generation
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    // Go back to the Sunday of 11 weeks ago (total 12 weeks = 84 days)
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - 83);
    const dayOfWeek = startDay.getDay();
    startDay.setDate(startDay.getDate() - dayOfWeek); // Adjust to Sunday

    for (let i = 0; i < 84; i++) {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, []);

  const doneDays = useMemo(() => {
    const dates = new Set();
    temas.forEach(t => {
      STEPS.forEach(s => {
        const r = t.rev?.[s.key];
        if (r && r.done && r.date) {
          dates.add(r.date);
        }
      });
    });
    Object.values(temaStats || {}).forEach(logs => {
      if (Array.isArray(logs)) {
        logs.forEach(log => {
          if (log.completedAt) {
            dates.add(log.completedAt.slice(0, 10));
          }
        });
      }
    });
    return dates;
  }, [temas, temaStats]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = "";
    for (let i = 0; i < 12; i++) {
      const dayIndex = i * 7;
      const dateStr = heatmapDays[dayIndex];
      if (!dateStr) {
        labels.push("");
        continue;
      }
      const date = new Date(dateStr + "T12:00:00");
      const monthName = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      if (monthName !== lastMonth) {
        labels.push(monthName);
        lastMonth = monthName;
      } else {
        labels.push("");
      }
    }
    return labels;
  }, [heatmapDays]);

  // Chronological Accuracy Trend Data
  const chronologicalAccuracy = useMemo(() => {
    const list = [];
    Object.entries(temaStats || {}).forEach(([temaId, logs]) => {
      if (Array.isArray(logs)) {
        logs.forEach(log => {
          if (log.acerto != null && log.completedAt) {
            list.push({
              completedAt: new Date(log.completedAt),
              acerto: Math.round(log.acerto * 100)
            });
          }
        });
      }
    });
    list.sort((a, b) => a.completedAt - b.completedAt);
    return list;
  }, [temaStats]);

  const svgWidth = 500;
  const svgHeight = 130;
  const pointsInfo = useMemo(() => {
    if (chronologicalAccuracy.length < 2) return { line: "", area: "", pts: [] };
    const len = chronologicalAccuracy.length;
    const startX = 15;
    const endX = svgWidth - 15;
    const bottomY = svgHeight - 10;
    
    const pts = chronologicalAccuracy.map((p, i) => {
      const x = (i / (len - 1)) * (endX - startX) + startX;
      const y = svgHeight - (p.acerto / 100) * (svgHeight - 25) - 15;
      return { x, y, val: p.acerto };
    });
    
    const line = `M ${pts.map(p => `${p.x},${p.y}`).join(" L ")}`;
    const area = `${line} L ${pts[pts.length - 1].x},${bottomY} L ${pts[0].x},${bottomY} Z`;
    
    return { line, area, pts };
  }, [chronologicalAccuracy]);

  // Error Stats Breakdown
  const errorStats = useMemo(() => {
    const counts = {
      lacuna: 0,
      raciocinio: 0,
      distractor: 0,
      descuido: 0,
      nao_visto: 0,
      interpretacao: 0
    };
    const subtopicoCounts = {};
    let total = 0;
    
    temas.forEach(t => {
      STEPS.forEach(s => {
        const stepErros = t.rev?.[s.key]?.erros || [];
        stepErros.forEach(e => {
          if (e.tipoErro && counts[e.tipoErro] !== undefined) {
            counts[e.tipoErro]++;
            total++;
          }
          if (e.subtopico) {
            subtopicoCounts[e.subtopico] = (subtopicoCounts[e.subtopico] || 0) + 1;
          }
        });
      });
    });
    
    const tipoLabels = {
      lacuna: "Lacuna de Conteúdo",
      raciocinio: "Erro de Raciocínio",
      distractor: "Caiu em Pegadinha/Distrator",
      descuido: "Descuido / Falta de Atenção",
      nao_visto: "Conteúdo Nunca Visto",
      interpretacao: "Erro de Interpretação"
    };
    
    const distribution = Object.entries(counts).map(([k, count]) => ({
      key: k,
      label: tipoLabels[k] || k,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);
    
    const topSubtopics = Object.entries(subtopicoCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
      
    return { distribution, topSubtopics, total };
  }, [temas]);

  // Advanced Metrics Calculations (True Retention, Bleeding Areas, Projeção de Nota)
  const trueRet = useMemo(() => {
    const vals = [];
    temas.forEach(t => {
      if (t.unstarted) return;
      STEPS.forEach(s => {
        if (s.offset > 15) {
          const r = t.rev[s.key];
          if (r && r.done && r.acerto != null) vals.push(r.acerto);
        }
      });
    });
    return vals.length ? Math.round((vals.reduce((a, b) => a + b) / vals.length) * 100) : null;
  }, [temas]);

  const bleedingAreas = useMemo(() => {
    const byEsp = {};
    temas.forEach(t => {
      if (t.unstarted) return;
      if (!byEsp[t.esp]) byEsp[t.esp] = { total: 0, questoes: 0 };
      STEPS.forEach(s => {
        const r = t.rev[s.key];
        if (r && r.done && r.acerto != null && r.questoes) {
          byEsp[t.esp].total += r.acerto * r.questoes;
          byEsp[t.esp].questoes += r.questoes;
        }
      });
    });
    return Object.entries(byEsp)
      .map(([esp, v]) => ({ esp, acc: v.questoes > 0 ? Math.round((v.total / v.questoes) * 100) : 0 }))
      .filter(x => x.acc < 60)
      .sort((a, b) => a.acc - b.acc);
  }, [temas]);

  const areaRetention = useMemo(() => {
    const byArea = {};
    temas.forEach(t => {
      if (t.unstarted) return;
      if (!byArea[t.esp]) byArea[t.esp] = { sum: 0, count: 0 };
      STEPS.forEach(s => {
        const r = t.rev[s.key];
        if (r && r.done && r.acerto != null) {
          byArea[t.esp].sum += r.acerto;
          byArea[t.esp].count++;
        }
      });
    });
    return Object.fromEntries(
      Object.entries(byArea).map(([esp, v]) => [
        esp, v.count > 0 ? Math.round((v.sum / v.count) * 100) : null
      ])
    );
  }, [temas]);

  const notaProjetada = useMemo(() => {
    const meta = useStore.getState().meta;
    if (plat !== "vest") {
      return personalStats?.simAvg ?? personalStats?.overallAcc ?? 50;
    }
    const provaAlvo = (meta?.provasAlvo || [])[0] || "ENEM";
    const pesos = PESOS_PROVA_VEST[provaAlvo] || PESOS_PROVA_VEST.ENEM;
    let sumPeso = 0, sumScore = 0;
    for (const [area, peso] of Object.entries(pesos)) {
      if (!peso) continue;
      const ret = areaRetention[area];
      sumScore += (ret != null ? ret : 50) * peso;
      sumPeso += peso;
    }
    return sumPeso > 0 ? Math.round(sumScore / sumPeso) : null;
  }, [plat, areaRetention, personalStats]);

  const forecastData = useMemo(() => {
    const counts = {};
    for (let i = 0; i < 14; i++) {
      const dateStr = addDays(todayStr(), i);
      counts[dateStr] = 0;
    }
    temas.forEach(t => {
      if (t.unstarted) return;
      STEPS.forEach(s => {
        const r = t.rev?.[s.key];
        if (r && !r.done && r.date) {
          if (counts[r.date] !== undefined) counts[r.date]++;
        }
      });
    });
    return Object.entries(counts).map(([date, count]) => ({
      date,
      label: fmtDate(date),
      count
    }));
  }, [temas]);

  const subtemasTitle = plat === "vest" ? "Subtemas de Exatas Mais Cobrados" : "Subtemas de Cirurgia Mais Cobrados";
  const subtemasData = prova.subtemasFoco || prova.subtemasCirurgia || [];

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

              {/* Heatmap Section */}
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Flame size={15} className="text-orange-400" /> Consistência de Estudos (Últimas 12 Semanas)
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Visualize seus dias ativos na plataforma. Cada bloco colorido indica uma sessão finalizada.</p>
                </div>
                
                <div className="w-full overflow-x-auto select-none py-2">
                  <div className="min-w-[420px] max-w-lg mx-auto">
                    {/* Months header */}
                    <div className="flex gap-2 mb-1">
                      <div className="w-8 shrink-0" />
                      <div className="grid grid-cols-12 gap-1.5 w-full">
                        {monthLabels.map((lbl, i) => (
                          <span key={i} className="text-[9px] text-gray-500 font-bold text-center uppercase tracking-wider block truncate">
                            {lbl}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 items-start justify-center">
                      {/* Day Labels */}
                      <div className="flex flex-col justify-between text-[9px] text-gray-500 h-28 pr-1 py-1 font-semibold uppercase tracking-wider select-none shrink-0">
                        <span>Dom</span>
                        <span>Qua</span>
                        <span>Sáb</span>
                      </div>

                      {/* Heatmap Grid */}
                      <div className="grid grid-flow-col grid-rows-7 gap-1.5 h-28 w-full">
                        {heatmapDays.map((d) => {
                          const studied = doneDays.has(d);
                          return (
                            <div
                              key={d}
                              title={`${fmtDate(d)}: ${studied ? "Estudo Realizado" : "Nenhuma Atividade"}`}
                              className={`aspect-square w-3.5 h-3.5 rounded-sm transition-all duration-300 ${
                                studied
                                  ? "bg-gradient-to-br from-violet-500 to-pink-500 shadow-sm shadow-purple-950/50"
                                  : "bg-white/[0.03]"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Histórico e Evolução + Advanced Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Gráfico de Evolução de Acertos */}
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div>
                    <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Evolução Cronológica de Acertos</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Acompanhe a precisão média de cada sessão executada em ordem cronológica.</p>
                  </div>
                  
                  <div className="h-36 flex items-center justify-center bg-black/40 border border-white/5 rounded-xl p-3">
                    {chronologicalAccuracy.length < 2 ? (
                      <p className="text-[11.5px] text-gray-500 text-center leading-relaxed">
                        ℹ️ Insuficientes dados para traçar gráfico de linha cronológica. Continue estudando!
                      </p>
                    ) : (
                      <div className="w-full h-full relative">
                        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0"/>
                            </linearGradient>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                          </defs>
                          
                          {/* Grid Lines */}
                          <line x1="15" y1={svgHeight - 10} x2={svgWidth - 15} y2={svgHeight - 10} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          <line x1="15" y1={(svgHeight - 25) * 0.5 + 15} x2={svgWidth - 15} y2={(svgHeight - 25) * 0.5 + 15} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          <line x1="15" y1={(svgHeight - 25) * 0.2 + 15} x2={svgWidth - 15} y2={(svgHeight - 25) * 0.2 + 15} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          <line x1="15" y1="15" x2={svgWidth - 15} y2="15" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          
                          {/* Labels */}
                          <text x="17" y={svgHeight - 14} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">0%</text>
                          <text x="17" y={(svgHeight - 25) * 0.5 + 20} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">50%</text>
                          <text x="17" y={(svgHeight - 25) * 0.2 + 20} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">80%</text>
                          <text x="17" y="23" fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">100%</text>

                          {/* Gradient Shading */}
                          {pointsInfo.area && <path d={pointsInfo.area} fill="url(#areaGrad)" />}
                          
                          {/* Path Line */}
                          {pointsInfo.line && <path d={pointsInfo.line} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                          {/* Dots */}
                          {pointsInfo.pts.map((p, i) => (
                            <circle
                              key={i}
                              cx={p.x}
                              cy={p.y}
                              r="3.5"
                              fill="#ec4899"
                              stroke="#0e0e18"
                              strokeWidth="1.5"
                              className="hover:r-5 cursor-help transition-all"
                            >
                              <title>{`Sessão ${i + 1}: ${p.val}%`}</title>
                            </circle>
                          ))}
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Métricas Avançadas (True Retention, Bleeding Areas, Projeção de Nota) */}
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                  <div>
                    <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Award size={15} className="text-violet-400" /> Modelagem Estatística Avançada
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Indicadores FSRS e projeções baseadas no seu rendimento.</p>
                  </div>
                  
                  {/* Conteúdo a ser borrado */}
                  <div className={`space-y-4 flex flex-col justify-between h-[106px] ${totalSessions < 30 ? "blur-sm pointer-events-none select-none" : ""}`}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col gap-0.5">
                        <span className="text-[9.5px] text-gray-500 font-bold uppercase tracking-wider">True Retention</span>
                        <p className={`text-xl font-black ${trueRet >= 80 ? "text-emerald-400" : trueRet >= 65 ? "text-amber-400" : "text-red-400"}`}>
                          {trueRet != null ? `${trueRet}%` : "—"}
                        </p>
                      </div>
                      <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col gap-0.5">
                        <span className="text-[9.5px] text-gray-500 font-bold uppercase tracking-wider">Projeção de Nota</span>
                        <p className={`text-xl font-black text-violet-400`}>
                          {notaProjetada != null ? `${notaProjetada}%` : "—"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                      <span className="text-gray-400 font-semibold flex items-center gap-1">
                        <AlertTriangle size={12} className="text-amber-400" /> Bleeding Areas:
                      </span>
                      <span className="font-bold text-white">
                        {bleedingAreas.length === 0 
                          ? "Nenhuma zona de risco" 
                          : `${bleedingAreas.length} área${bleedingAreas.length > 1 ? "s" : ""} crítica${bleedingAreas.length > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  </div>

                  {/* Lock Overlay */}
                  {totalSessions < 30 && (
                    <div className="absolute inset-0 bg-[#0c0c12]/80 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center rounded-2xl border border-white/5">
                      <span className="text-2xl mb-1">🔒</span>
                      <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">Modelagem Bloqueada</h4>
                      <p className="text-[10.5px] text-gray-400 mt-1 max-w-xs leading-relaxed">
                        Conclua pelo menos 30 sessões de estudo para calibrar os modelos preditivos.
                      </p>
                      <div className="w-full max-w-[200px] mt-3">
                        <div className="bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5 relative">
                          <div className="bg-gradient-to-r from-violet-500 to-pink-500 h-full" style={{ width: `${Math.min(100, (totalSessions / 30) * 100)}%` }} />
                        </div>
                        <span className="text-[8.5px] font-mono text-gray-500 mt-1 block">{totalSessions} de 30 sessões</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Análise de Erros Estruturados */}
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Análise Metacognitiva de Erros</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Identifique os motivos por trás de seus erros e os subtópicos mais afetados.</p>
                </div>

                {errorStats.total === 0 ? (
                  <div className="p-8 text-center text-gray-600 text-xs border border-white/5 rounded-xl bg-black/20">
                    Nenhum erro estruturado registrado ainda. Registre erros detalhados no painel de marcação de etapas.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Tipo de Erros */}
                    <div className="space-y-3">
                      <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-bold">Distribuição por Categoria</p>
                      <div className="space-y-2.5">
                        {errorStats.distribution.map(item => (
                          <div key={item.key} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold">
                              <span className="text-gray-300">{item.label}</span>
                              <span className="text-violet-400 font-bold">{item.pct}% <span className="text-[9px] text-gray-500 font-normal">({item.count})</span></span>
                            </div>
                            <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                              <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full" style={{ width: `${item.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subtópicos com Mais Erros */}
                    <div className="space-y-3">
                      <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-bold">Principais Gaps / Subtópicos com Erro</p>
                      <div className="flex flex-col gap-2">
                        {errorStats.topSubtopics.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2.5 bg-white/[0.01] border border-white/5 rounded-xl">
                            <span className="text-[11.5px] font-semibold text-gray-200 truncate pr-3">{item.name}</span>
                            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold font-mono">
                              {item.count} erro{item.count > 1 ? "s" : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Forecast Section */}
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Previsão de Carga FSRS (Próximos 14 dias)</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Estimativa de revisões programadas por dia para guiar seu planejamento.</p>
                </div>
                
                <div className="w-full overflow-x-auto select-none pt-2">
                  <div className="flex items-end justify-between gap-2.5 min-w-[500px] h-32 border-b border-white/5 pb-2 px-2">
                    {forecastData.map((d, idx) => {
                      const maxCount = Math.max(...forecastData.map(x => x.count), 1);
                      const heightPercent = (d.count / maxCount) * 80;
                      const isToday = idx === 0;
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                          <span className="text-[9.5px] font-mono text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                            {d.count}
                          </span>
                          <div 
                            style={{ height: `${Math.max(4, heightPercent)}px` }}
                            className={`w-full rounded-t transition-all ${
                              d.count === 0 
                                ? "bg-white/5" 
                                : isToday 
                                ? "bg-gradient-to-t from-violet-600 to-pink-500" 
                                : "bg-violet-500/60 group-hover:bg-violet-400"
                            }`}
                          />
                          <span className={`text-[9px] font-mono font-bold mt-1 ${isToday ? "text-pink-400 font-black" : "text-gray-600"}`}>
                            {isToday ? "Hoje" : d.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
          <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
            {provasDisponiveis.map(p => (
              <button type="button" key={p} onClick={() => setSelectedProva(p)} className={`px-4 py-2 rounded-lg text-[12px] font-black transition-all ${validProva === p ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-300"}`}>{p}</button>
            ))}
          </div>
          
          {prova && (
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
                <h3 className="text-[13px] font-bold text-orange-400 uppercase tracking-wider">{subtemasTitle}</h3>
                <div className="space-y-3">
                  {subtemasData.map(s => (
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
