// src/components/CronogramaVest.jsx
import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Check, BookOpen, Trash2, Plus, Zap } from "lucide-react";
import { useStore } from "../core/store";
import { todayStr, fmtDate, STEPS } from "../core/fsrs";
import { getEstadoDominio } from "../core/mastery";
import { getTemaStatsFromLearningEvents } from "../core/learningEvent";
import { canUseMultipleSchedules } from "../core/entitlements";
import { CATALOGO_VEST, parseCatalogEntry } from "../constants/catalogos";
import { Btn, Input, Textarea, Modal, Field } from "./Primitives";

const DIAS_SEMANA = ["SEG","TER","QUA","QUI","SEX","SÁB","DOM"];

const BLOCOS_TEMPLATE = [
  { horario: "07:00–08:00", nome: "ANKI BASE", tipo: "revisao" },
  { horario: "08:00–11:30", nome: "BLOCO DE FOCO 1", tipo: "foco" },
  { horario: "11:30–12:30", nome: "ALMOÇO / DESCANSO", tipo: "descanso" },
  { horario: "12:30–15:30", nome: "BLOCO DE FOCO 2", tipo: "foco" },
  { horario: "16:00–19:00", nome: "REVISÃO ESPAÇADA / PRÁTICA", tipo: "revisao" },
];

const getTemplatesForHours = (horas) => {
  if (horas <= 2) {
    return [
      { horario: "08:00–08:30", nome: "REVISÃO ESPAÇADA / ANKI", tipo: "revisao" },
      { horario: "08:30–10:00", nome: "BLOCO DE FOCO PRINCIPAL", tipo: "foco" }
    ];
  } else if (horas <= 4) {
    return [
      { horario: "08:00–08:45", nome: "REVISÃO ESPAÇADA / ANKI", tipo: "revisao" },
      { horario: "09:00–10:30", nome: "BLOCO DE FOCO 1", tipo: "foco" },
      { horario: "10:30–12:00", nome: "BLOCO DE FOCO 2", tipo: "foco" }
    ];
  } else if (horas <= 6) {
    return [
      { horario: "08:00–09:00", nome: "REVISÃO ESPAÇADA / ANKI", tipo: "revisao" },
      { horario: "09:00–11:00", nome: "BLOCO DE FOCO 1", tipo: "foco" },
      { horario: "11:00–12:00", nome: "DESCANSO / ALMOÇO", tipo: "descanso" },
      { horario: "12:00–14:00", nome: "BLOCO DE FOCO 2", tipo: "foco" }
    ];
  } else {
    return [
      { horario: "08:00–09:00", nome: "REVISÃO ESPAÇADA / ANKI", tipo: "revisao" },
      { horario: "09:00–11:30", nome: "BLOCO DE FOCO 1", tipo: "foco" },
      { horario: "11:30–12:30", nome: "DESCANSO / ALMOÇO", tipo: "descanso" },
      { horario: "12:30–15:00", nome: "BLOCO DE FOCO 2", tipo: "foco" },
      { horario: "15:30–17:30", nome: "BATERIA DE QUESTÕES / PRÁTICA", tipo: "questoes" }
    ];
  }
};

export function parsePDFText(texto, titulo = "Cronograma") {
  const text = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const semanas = [];
  const partes = text.split(/(?=SEMANA\s+\d+)/i);

  for (const parte of partes) {
    const mNum = parte.match(/SEMANA\s+(\d+)/i);
    if (!mNum) continue;
    const numero = parseInt(mNum[1]);

    const mFase = parte.match(/FASE\s+(\d+)\s*[—–-]\s*([^\n·]+)/i);
    const fase   = mFase ? `FASE ${mFase[1]}` : "";
    const tituloFase = mFase ? mFase[2].trim() : "";
    const mPer  = parte.match(/[·•]\s*([\d/]+\s*[–—-]\s*[\d/]+)/);
    const periodo = mPer ? mPer[1].trim() : "";

    const mDatas = [...(parte.matchAll ? parte.matchAll(/(?:SEG|TER|QUA|QUI|SEX|SÁB|DOM)\s+(\d{2}\/\d{2})/gi) : [])];
    const mDatasAlt = [...(parte.match(/(\d{2}\/\d{2})/g) || [])].slice(0, 7);
    const mBlocos = [...(parte.match(/(07:00|08:00|11:30|12:30|16:00)[–—-]\d{2}:\d{2}[\s\S]*?(?=(?:07:00|08:00|11:30|12:30|16:00)[–—-]|\n*SEMANA\s+\d+|$)/gi) || [])];

    const dias = DIAS_SEMANA.map((dia, di) => {
      const data = mDatas[di]?.[1] || mDatasAlt[di] || "";
      let isoDate = "";
      if (data) {
        const [d, m] = data.split("/");
        const year = new Date().getFullYear();
        isoDate = `${year}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
      }
      return {
        dia,
        data,
        isoDate,
        blocos: BLOCOS_TEMPLATE.map((b, bi) => {
          let conteudo = "";
          if (mBlocos[bi]) {
            const blocoTexto = mBlocos[bi];
            const linhas = blocoTexto.split("\n").filter(l => l.trim() && !/^\d{2}:\d{2}/.test(l.trim()));
            const porDia = Math.ceil(linhas.length / 7);
            const fatia  = linhas.slice(di * porDia, (di + 1) * porDia);
            conteudo = fatia.join("\n").trim();
          }
          return { horario: b.horario, nome: b.nome, conteudo, concluido: false };
        }),
      };
    });

    semanas.push({ id: Date.now() + Math.random(), numero, fase, tituloFase, periodo, dias });
  }
  return semanas.length === 0 ? null : { id: Date.now(), titulo, semanas, criadoEm: todayStr() };
}

export function gerarCronogramaVazio(titulo, dataInicio, numSemanas) {
  const semanas = [];
  for (let i = 0; i < numSemanas; i++) {
    const base = new Date(dataInicio + "T12:00:00");
    base.setDate(base.getDate() + i * 7);
    const diasArr = DIAS_SEMANA.map((dia, di) => {
      const d = new Date(base);
      d.setDate(d.getDate() + di);
      const data = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
      const isoDate = d.toISOString().slice(0, 10);
      return {
        dia,
        data,
        isoDate,
        blocos: BLOCOS_TEMPLATE.map(b => ({ ...b, conteudo: "", concluido: false })),
      };
    });
    semanas.push({ id: Date.now() + Math.random() + i, numero: i+1, fase: "", tituloFase: "", periodo: "", dias: diasArr });
  }
  return { id: Date.now(), titulo, semanas, criadoEm: todayStr() };
}

export function gerarCronogramaInteligente(titulo, dataInicio, numSemanas, horasDisponiveis, materiasAlvo) {
  const semanas = [];
  const state = useStore.getState();
  const plat = state.plat;
  const temas = state[plat]?.temas || [];
  const temaStats = getTemaStatsFromLearningEvents(state.learningEvents || [], {
    plat,
    fallbackTemaStats: state.temaStats || {},
  });

  const targetSubjects = materiasAlvo && materiasAlvo.length > 0
    ? CATALOGO_VEST.filter(x => materiasAlvo.includes(x.nome))
    : CATALOGO_VEST;
  
  const topicsQueue = [];
  
  if (state.modoProva) {
    // Only study themes auto-generated from simulado errors
    temas.forEach(t => {
      if (t.obs && t.obs.includes("Auto-gerado via erro em simulado")) {
        topicsQueue.push({
          nome: t.nome,
          esp: t.esp,
          prio: t.prio || "Alta",
          weight: t.prio === "Diamante" ? 4 : t.prio === "Alta" ? 3 : t.prio === "Média" ? 2 : 1
        });
      }
    });
  } else {
    // Standard catalog-based queue
    targetSubjects.forEach(sub => {
      sub.t.forEach(topic => {
        const { nome, esp, prio } = parseCatalogEntry(topic);
        topicsQueue.push({ nome, esp, prio, weight: prio === "Diamante" ? 4 : prio === "Alta" ? 3 : prio === "Média" ? 2 : 1 });
      });
    });
  }
  
  // Sort topics by priority desc
  topicsQueue.sort((a, b) => b.weight - a.weight);
  
  let topicIndex = 0;
  const blocksTemplate = getTemplatesForHours(horasDisponiveis);

  const nextQueuedTopic = () => {
    if (!topicsQueue.length) return null;
    const topic = topicsQueue[topicIndex % topicsQueue.length];
    topicIndex++;
    return topic;
  };

  const buildDia = (dia, di, base) => {
    const d = new Date(base);
    d.setDate(d.getDate() + di);
    const data = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
    const isoDate = d.toISOString().slice(0, 10);

    const blocos = blocksTemplate.map(b => {
      let conteudo = "";
      let tNome = null;
      let tEsp = null;
      let finalTipo = b.tipo;

      if (b.tipo === "foco") {
        const t = nextQueuedTopic();
        if (t) {
          tNome = t.nome;
          tEsp = t.esp;

          const existingTema = temas.find(x => x.nome === t.nome);
          const currentStats = existingTema ? (temaStats[existingTema.id] || []) : [];
          const dominio = getEstadoDominio(existingTema, currentStats);

          const areaTemas = temas.filter(x => x.esp === t.esp);
          const countConsolidandoOuDomino = areaTemas.filter(x => {
            const st = getEstadoDominio(x, temaStats[x.id] || []);
            return st === "consolidando" || st === "dominado";
          }).length;
          const isAreaConsolidando = areaTemas.length > 0 && (countConsolidandoOuDomino / areaTemas.length) >= 0.6;

          if (dominio === "dominado") {
            const simuladosNames = ["Simulado UFG 2023", "Simulado UFG 2022", "Simulado UFG 2021"];
            const simNome = simuladosNames[topicIndex % 3];
            conteudo = `Simulado / Prova Antiga: ${simNome} (Área: ${t.esp})`;
            tNome = simNome;
            tEsp = t.esp;
            finalTipo = "simulado";
          } else if (isAreaConsolidando || dominio === "consolidando") {
            conteudo = `Bateria de Questões Focadas: ${t.esp} - ${t.nome}`;
          } else {
            conteudo = `${t.esp} - ${t.nome} (Estudo + Questões)`;
          }
        } else {
          const simuladosNames = ["Simulado UFG 2023", "Simulado UFG 2022", "Simulado UFG 2021"];
          const simNome = simuladosNames[topicIndex % 3];
          conteudo = `Simulado UFG / Prova Antiga: ${simNome}`;
          tNome = simNome;
          tEsp = "Geral";
          finalTipo = "simulado";
          topicIndex++;
        }
      } else if (b.tipo === "revisao") {
        conteudo = "Revisar fila inteligente da curva de revisão + Anki";
      } else if (b.tipo === "questoes") {
        conteudo = "Resolver 15-20 questões do simulado anterior";
      } else {
        conteudo = "Pausa recomendada";
      }

      return {
        horario: b.horario,
        nome: b.nome,
        conteudo,
        temaNome: tNome,
        temaEsp: tEsp,
        concluido: false,
        tipo: finalTipo
      };
    });

    return { dia, data, isoDate, blocos };
  };

  for (let i = 0; i < numSemanas; i++) {
    const base = new Date(dataInicio + "T12:00:00");
    base.setDate(base.getDate() + i * 7);
    const diasArr = DIAS_SEMANA.map((dia, di) => buildDia(dia, di, base));
    
    semanas.push({
      id: Date.now() + Math.random() + i,
      numero: i + 1,
      fase: i < numSemanas / 2 ? "FASE 1 - Fundações" : "FASE 2 - Avançado/Simulados",
      tituloFase: "",
      periodo: "",
      dias: diasArr
    });
  }
  return { id: Date.now(), titulo, semanas, criadoEm: todayStr(), configuracao: { horasDisponiveis, materiasAlvo } };
}

export function DiaCard({ dia, diaIdx, eHoje, semanaIdx, crono, plat, toggleBloco, onStudy, onIniciarTema }) {
  const [open, setOpen] = useState(eHoje);
  const temas = useStore((s) => s[plat]?.temas || []);

  const feitos = dia.blocos.filter(b => b.concluido).length;
  const total  = dia.blocos.length;
  const pct    = Math.round(total > 0 ? (feitos / total * 100) : 0);

  // FSRS workloads
  const reviewsCount = useMemo(() => {
    if (!dia.isoDate) return 0;
    return temas.reduce((acc, t) => {
      if (t.unstarted) return acc;
      return acc + STEPS.reduce((sAcc, s) => {
        const r = t.rev?.[s.key];
        if (r && !r.done && r.date === dia.isoDate) {
          return sAcc + 1;
        }
        return sAcc;
      }, 0);
    }, 0);
  }, [temas, dia.isoDate]);

  const newStudiesCount = useMemo(() => {
    return dia.blocos.filter(b => b.temaNome && !b.concluido).length;
  }, [dia.blocos]);

  return (
    <div className={`bg-[#111113] border rounded-2xl overflow-hidden transition-all ${eHoje ? "border-blue-500/40 shadow-[0_0_20px_rgba(139,92,246,0.1)]" : "border-white/5"}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left border-none">
        <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${eHoje ? "bg-blue-600" : "bg-white/5"}`}>
          <span className="text-[9px] font-bold text-gray-400 leading-none">{dia.dia}</span>
          <span className={`text-[13px] font-black leading-none mt-0.5 ${eHoje ? "text-white" : "text-gray-200"}`}>{dia.data?.split("/")[0] || ""}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-semibold ${eHoje ? "text-blue-300" : "text-gray-300"}`}>
              {dia.dia}{dia.data ? `, ${dia.data}` : ""}
            </span>
            {eHoje && <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">Hoje</span>}
            {feitos === total && total > 0 && <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">✓ Completo</span>}
          </div>
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] text-gray-600 tabular-nums shrink-0">{feitos}/{total}</span>
            </div>
            
            {(reviewsCount > 0 || newStudiesCount > 0) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25">
                  Carga: {reviewsCount} revisões da curva + {newStudiesCount} novos estudos
                </span>
              </div>
            )}
          </div>
        </div>
        <ChevronDown size={16} className={`text-gray-600 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-white/5 divide-y divide-white/5">
          {dia.blocos.map((bloco, bi) => {
            const startedTema = temas.find(t => t.nome === bloco.temaNome && !t.unstarted);

            return (
              <div key={bi} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-white/[0.01] transition-colors">
                <div className="flex gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleBloco(plat, crono.id, semanaIdx, diaIdx, bi)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${bloco.concluido ? "bg-emerald-500 border-emerald-500" : "border-white/20 hover:border-blue-500"}`}>
                    {bloco.concluido && <Check size={12} className="text-white" strokeWidth={3} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`text-[12px] font-bold ${bloco.concluido ? "text-emerald-400 line-through opacity-60" : "text-gray-200"}`}>
                        {bloco.nome}
                      </span>
                      <span className="text-[10px] text-gray-700 font-mono">{bloco.horario}</span>
                    </div>
                    {bloco.conteudo && (
                      <p className={`text-[11px] mt-1 leading-relaxed whitespace-pre-line ${bloco.concluido ? "text-gray-700" : "text-gray-400"}`}>
                        {bloco.conteudo}
                      </p>
                    )}
                  </div>
                </div>

                {bloco.temaNome && (
                  <div className="shrink-0 flex items-center gap-2">
                    {startedTema ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextStep = STEPS.find(s => !startedTema.rev[s.key].done);
                          if (nextStep && onStudy) {
                            onStudy(startedTema.id, nextStep.key);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-black transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1 shadow-md shadow-emerald-950/20"
                      >
                        <Zap size={11} /> Estudar ({STEPS.find(s => !startedTema.rev[s.key].done)?.label || "OK"})
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onIniciarTema) {
                            onIniciarTema({ nome: bloco.temaNome, esp: bloco.temaEsp });
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-black transition-all border border-blue-500/20"
                      >
                        Iniciar revisão
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CronogramaVest({ onStudy, onEdit, onIniciarTema }) {
  const { plat, addCronograma, deleteCronograma, toggleBloco } = useStore();
  const openConfirm = useStore((s) => s.openConfirm);
  const showToast = useStore((s) => s.showToast);
  const _rawCronos   = useStore((s) => s[plat]?.cronogramas);
  const cronogramas  = useMemo(() => _rawCronos || [], [_rawCronos]);

  const [modo, setModo]           = useState("lista"); 
  const [cronoAtivo, setCronoAtivo] = useState(null);
  const [semanaIdx, setSemanaIdx]   = useState(0);
  const [criarModal, setCriarModal] = useState(false);

  const [cfTitulo, setCfTitulo]     = useState("Meu Cronograma Focal");
  const [cfDataIni, setCfDataIni]   = useState(todayStr());
  const [cfSemanas, setCfSemanas]   = useState(22);
  const [cfPDFText, setCfPDFText]   = useState("");
  const [cfModo, setCfModo]         = useState("inteligente"); // default is intelligent now!
  const [previewCrono, setPreviewCrono] = useState(null);

  // Intelligent generator settings
  const [horasDisponiveis, setHorasDisponiveis] = useState(4);
  const [selectedMaterias, setSelectedMaterias] = useState([]);

  useEffect(() => {
    if (modo === "ver" && cronoAtivo) {
      const exists = cronogramas.find(c => c.id === cronoAtivo.id);
      if (!exists || !exists.semanas?.length) {
        setModo("lista");
        setCronoAtivo(null);
      }
    }
  }, [modo, cronoAtivo, cronogramas]);

  const calcSemanaHoje = (crono) => {
    if (!crono?.semanas?.length) return 0;
    const hoje = todayStr();
    for (let i = 0; i < crono.semanas.length; i++) {
      const s = crono.semanas[i];
      const primeiraData = s.dias[0]?.isoDate || "";
      const ultimaData = s.dias[6]?.isoDate || "";
      if (primeiraData && ultimaData && hoje >= primeiraData && hoje <= ultimaData) {
        return i;
      }
    }
    return 0;
  };

  const handleVerCrono = (crono) => {
    setCronoAtivo(crono);
    setSemanaIdx(calcSemanaHoje(crono));
    setModo("ver");
  };

  const handleCriar = () => {
    if (!canUseMultipleSchedules() && cronogramas.length >= 1) {
      showToast("Seu plano atual permite 1 cronograma ativo.");
      return;
    }
    if (cfModo === "pdf") {
      if (!previewCrono) {
        if (!cfPDFText.trim()) return;
        const crono = parsePDFText(cfPDFText, cfTitulo);
        if (!crono) {
          openConfirm({
            title: "Importação não detectada",
            message: "Não conseguimos detectar semanas no texto do PDF. Deseja mudar para o modo Inteligente?",
            confirmLabel: "Mudar modo",
            onConfirm: () => setCfModo("inteligente"),
          });
          return;
        }
        setPreviewCrono(crono);
      } else {
        addCronograma(plat, previewCrono);
        setCfTitulo("Meu Cronograma Focal");
        setCfPDFText("");
        setCfSemanas(22);
        setPreviewCrono(null);
        setCriarModal(false);
      }
    } else if (cfModo === "inteligente") {
      const crono = gerarCronogramaInteligente(cfTitulo, cfDataIni, cfSemanas, horasDisponiveis, selectedMaterias);
      addCronograma(plat, crono);
      setCfTitulo("Meu Cronograma Focal");
      setCfPDFText("");
      setCfSemanas(22);
      setSelectedMaterias([]);
      setPreviewCrono(null);
      setCriarModal(false);
    } else {
      const crono = gerarCronogramaVazio(cfTitulo, cfDataIni, cfSemanas);
      addCronograma(plat, crono);
      setCfTitulo("Meu Cronograma Focal");
      setCfPDFText("");
      setCfSemanas(22);
      setPreviewCrono(null);
      setCriarModal(false);
    }
  };

  if (modo === "lista") {
    return (
      <div className="flex flex-col gap-5 animate-fade-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-gray-100">Cronogramas de Estudo Semanais</h2>
          </div>
          <Btn onClick={() => setCriarModal(true)} className="gap-2"><Plus size={16} /> Novo Planeamento</Btn>
        </div>

        {cronogramas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-[#111113]/30 border border-white/5 rounded-3xl p-8">
            <BookOpen size={48} className="text-gray-700" />
            <div className="text-center">
              <p className="text-[14px] text-gray-400 font-semibold">Nenhum cronograma montado</p>
              <p className="text-[11px] text-gray-500 mt-1 max-w-xs leading-relaxed">
                Crie um cronograma estruturado inteligente baseado na sua carga horária ou importe seu PDF de matérias.
              </p>
            </div>
            <Btn onClick={() => setCriarModal(true)} className="gap-1.5 mt-2">
              <Plus size={15} /> Estruturar Cronograma
            </Btn>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cronogramas.map((c) => {
              const total  = c.semanas.reduce((a, s) => a + s.dias.reduce((b, d) => b + d.blocos.length, 0), 0);
              const feitos = c.semanas.reduce((a, s) => a + s.dias.reduce((b, d) => b + d.blocos.filter(b2 => b2.concluido).length, 0), 0);
              const pct    = total > 0 ? Math.round(feitos / total * 100) : 0;
              return (
                <div key={c.id} className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 hover:border-white/10 transition-colors cursor-pointer"
                  onClick={() => handleVerCrono(c)}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-white truncate">{c.titulo}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{c.semanas.length} semanas · Criado {fmtDate(c.criadoEm)}</p>
                    </div>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      openConfirm({
                        title: "Remover cronograma",
                        message: "Remover cronograma completo?",
                        confirmLabel: "Remover",
                        danger: true,
                        onConfirm: () => {
                          deleteCronograma(plat, c.id);
                          showToast("Cronograma removido.");
                        },
                      });
                    }}
                      className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center shrink-0 ml-2 transition-colors border-none">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                      <span>Progresso Geral dos Blocos</span>
                      <span className="tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {criarModal && (
          <Modal onClose={() => { setCriarModal(false); setPreviewCrono(null); }} wide>
            {previewCrono ? (
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="text-[14px] font-bold text-blue-400">🔍 Pré-visualização do Cronograma</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Confira abaixo se os blocos de estudo da Semana 1 foram importados conforme o modelo.</p>
                </div>
                
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 max-h-[50vh] overflow-y-auto space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-300">Título: {previewCrono.titulo}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{previewCrono.semanas.length} semanas detectadas.</p>
                  </div>
                  
                  {previewCrono.semanas[0] && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Semana 1 {previewCrono.semanas[0].fase && `— ${previewCrono.semanas[0].fase}`}</p>
                      <div className="space-y-2">
                        {previewCrono.semanas[0].dias.slice(0, 3).map((dia, di) => (
                          <div key={di} className="bg-white/[0.01] border border-white/5 rounded-xl p-3 space-y-1.5">
                            <div className="flex justify-between items-center text-[10.5px] font-bold text-gray-400 uppercase">
                              <span>📅 {dia.dia}</span>
                              <span className="text-gray-600">{dia.data || "Sem data"}</span>
                            </div>
                            <div className="space-y-1">
                              {dia.blocos.filter(b => b.conteudo).map((b, bi) => (
                                <div key={bi} className="text-[10.5px] bg-black/40 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                                  <span className="text-blue-400 font-mono font-semibold">{b.horario}</span> — <strong className="text-gray-300">{b.nome}</strong>:
                                  <p className="text-gray-400 mt-1 whitespace-pre-wrap">{b.conteudo}</p>
                                </div>
                              ))}
                              {dia.blocos.filter(b => b.conteudo).length === 0 && (
                                <p className="text-[9.5px] text-gray-600 italic">Sem blocos preenchidos para este dia.</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Btn className="flex-1" onClick={handleCriar}>Confirmar e Salvar</Btn>
                  <Btn variant="ghost" className="flex-1" onClick={() => setPreviewCrono(null)}>Voltar para Edição</Btn>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <h2 className="text-[15px] font-bold text-gray-100">Estruturar Nova Grade</h2>
                <Field label="Nome/Título" info="Um título amigável para este plano (ex: Reta Final, Intensivo)."><Input value={cfTitulo} onChange={e => setCfTitulo(e.target.value)} /></Field>

                <div className="flex gap-1 bg-black/40 border border-white/10 rounded-xl p-1">
                  {[["inteligente","Gerador Inteligente"],["manual","Manual Vazio"],["pdf","Importar PDF"]].map(([v,l]) => (
                    <button key={v} type="button" onClick={() => setCfModo(v)}
                      className={`flex-1 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all ${cfModo === v ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                      {l}
                    </button>
                  ))}
                </div>

                {cfModo === "manual" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Início" info="A data em que os blocos de estudos do cronograma começarão."><Input type="date" value={cfDataIni} onChange={e => setCfDataIni(e.target.value)} /></Field>
                    <Field label="Semanas" info="O número total de semanas de duração do cronograma."><Input type="number" value={cfSemanas} onChange={e => setCfSemanas(+e.target.value)} /></Field>
                  </div>
                )}

                {cfModo === "inteligente" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Data de Início" info="A data inicial para a distribuição de matérias."><Input type="date" value={cfDataIni} onChange={e => setCfDataIni(e.target.value)} /></Field>
                      <Field label="Semanas" info="O número total de semanas de duração do plano."><Input type="number" value={cfSemanas} onChange={e => setCfSemanas(+e.target.value)} /></Field>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <Field label="Carga Horária Diária (Horas)" info="Média de horas dedicadas diariamente aos estudos (gerará blocos compatíveis).">
                        <select
                          value={horasDisponiveis}
                          onChange={(e) => setHorasDisponiveis(+e.target.value)}
                          className="w-full padding-2 rounded-xl bg-black border border-white/10 text-gray-200 text-xs p-2.5"
                        >
                          <option value={2}>Até 2 horas/dia (Estudo Ultra Concentrado)</option>
                          <option value={4}>4 horas/dia (Padrão Equilibrado)</option>
                          <option value={6}>6 horas/dia (Semidedicado)</option>
                          <option value={8}>8+ horas/dia (Intensivo de Elite)</option>
                        </select>
                      </Field>

                      <div className="space-y-1">
                        <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Matérias-Alvo do Catálogo</label>
                        <p className="text-[10px] text-gray-500">Selecione as matérias que deseja distribuir na grade (deixe todas desmarcadas para usar o catálogo inteiro).</p>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-black/40 border border-white/5 p-3 rounded-xl">
                          {CATALOGO_VEST.map((item) => (
                            <label key={item.nome} className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedMaterias.includes(item.nome)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedMaterias([...selectedMaterias, item.nome]);
                                  } else {
                                    setSelectedMaterias(selectedMaterias.filter(x => x !== item.nome));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded border-white/10 text-blue-600 focus:ring-blue-500 bg-black"
                              />
                              {item.nome}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {cfModo === "pdf" && (
                  <div className="flex flex-col gap-3">
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-[11px] text-gray-400 space-y-1.5 leading-relaxed">
                      <p className="font-bold text-indigo-400">💡 Modelo de importação:</p>
                      <pre className="bg-black/60 p-2.5 rounded-xl text-[10px] text-gray-500 font-mono overflow-x-auto whitespace-pre leading-normal">
{`SEMANA 1
SEG 12/05
08:00–11:30
Cinemática (Mecânica)

TER 13/05
08:00–11:30
Ligações Químicas`}
                      </pre>
                    </div>
                    <Textarea rows={5} value={cfPDFText} onChange={e => setCfPDFText(e.target.value)} placeholder="Cole aqui as linhas textuais do PDF..." className="text-[11px] font-mono" />
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Btn className="flex-1" onClick={handleCriar} disabled={!cfTitulo}>{cfModo === "pdf" ? "Gerar Prévia" : "Gerar Cronograma"}</Btn>
                  <Btn variant="ghost" className="flex-1" onClick={() => setCriarModal(false)}>Cancelar</Btn>
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
    );
  }

  const crono = cronogramas.find(c => c.id === cronoAtivo?.id) || cronoAtivo;
  if (!crono || !crono.semanas || crono.semanas.length === 0) return null;
  const semana  = crono.semanas[semanaIdx];
  const hoje    = todayStr();

  const diaHoje = (() => {
    if (!semana) return -1;
    return semana.dias.findIndex(d => d.isoDate === hoje);
  })();

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <button onClick={() => setModo("lista")} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors border-none">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[14px] font-bold text-white truncate">{crono.titulo}</h2>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button onClick={() => setSemanaIdx(Math.max(0, semanaIdx - 1))} className="w-9 h-9 rounded-xl bg-white/5 disabled:opacity-30 flex items-center justify-center border-none" disabled={semanaIdx === 0}>
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-[13px] font-bold text-white">Semana {semana?.numero}</p>
            {semana?.fase && <p className="text-[10px] text-blue-400 font-semibold">{semana.fase}</p>}
          </div>
          <button onClick={() => setSemanaIdx(Math.min(crono.semanas.length - 1, semanaIdx + 1))} className="w-9 h-9 rounded-xl bg-white/5 disabled:opacity-30 flex items-center justify-center border-none" disabled={semanaIdx === crono.semanas.length - 1}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {semana && (
        <div className="flex flex-col gap-3">
          {semana.dias.map((dia, di) => (
            <DiaCard
              key={di}
              dia={dia}
              diaIdx={di}
              eHoje={di === diaHoje}
              semanaIdx={semanaIdx}
              crono={crono}
              plat={plat}
              toggleBloco={toggleBloco}
              onStudy={onStudy}
              onIniciarTema={onIniciarTema}
            />
          ))}
        </div>
      )}
    </div>
  );
}
