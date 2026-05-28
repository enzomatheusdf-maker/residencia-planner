// src/components/CronogramaVest.jsx
import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Check, BookOpen, Trash2, Plus } from "lucide-react";
import { useStore } from "../core/store";
import { todayStr, fmtDate } from "../core/fsrs";
import { Btn, Input, Textarea, Modal, Field } from "./Primitives";

/* IMPORTADOR / PARSER DE PDF CRONOGRAMA ───────────────────────────────────────── */
const DIAS_SEMANA = ["SEG","TER","QUA","QUI","SEX","SÁB","DOM"];
const BLOCOS_TEMPLATE = [
  { horario: "07:00–08:00", nome: "ANKI BASE" },
  { horario: "08:00–11:30", nome: "BLOCO DE FOCO 1" },
  { horario: "11:30–12:30", nome: "ALMOÇO / DESCANSO" },
  { horario: "12:30–15:30", nome: "BLOCO DE FOCO 2" },
  { horario: "16:00–19:00", nome: "REVISÃO ESPAÇADA / PRÁTICA" },
];

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

    const mDatas = [...parte.matchAll(/(?:SEG|TER|QUA|QUI|SEX|SÁB|DOM)\s+(\d{2}\/\d{2})/gi)];
    const mDatasAlt = [...parte.matchAll(/(\d{2}\/\d{2})/g)].slice(0, 7);
    const mBlocos = [...parte.matchAll(/(07:00|08:00|11:30|12:30|16:00)[–—-]\d{2}:\d{2}[\s\S]*?(?=(?:07:00|08:00|11:30|12:30|16:00)[–—-]|\n*SEMANA\s+\d+|$)/gi)];

    const dias = DIAS_SEMANA.map((dia, di) => {
      const data = mDatas[di]?.[1] || mDatasAlt[di]?.[1] || "";
      return {
        dia,
        data,
        blocos: BLOCOS_TEMPLATE.map((b, bi) => {
          let conteudo = "";
          if (mBlocos[bi]) {
            const blocoTexto = mBlocos[bi][0];
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
      return {
        dia,
        data,
        blocos: BLOCOS_TEMPLATE.map(b => ({ ...b, conteudo: "", concluido: false })),
      };
    });
    semanas.push({ id: Date.now() + Math.random() + i, numero: i+1, fase: "", tituloFase: "", periodo: "", dias: diasArr });
  }
  return { id: Date.now(), titulo, semanas, criadoEm: todayStr() };
}

export function DiaCard({ dia, diaIdx, eHoje, semanaIdx, crono, plat, toggleBloco }) {
  const [open, setOpen] = useState(eHoje);
  const feitos = dia.blocos.filter(b => b.concluido).length;
  const total  = dia.blocos.length;
  const pct    = Math.round(feitos / total * 100);

  return (
    <div className={`bg-[#111113] border rounded-2xl overflow-hidden transition-all ${eHoje ? "border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.1)]" : "border-white/5"}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${eHoje ? "bg-violet-600" : "bg-white/5"}`}>
          <span className="text-[9px] font-bold text-gray-400 leading-none">{dia.dia}</span>
          <span className={`text-[13px] font-black leading-none mt-0.5 ${eHoje ? "text-white" : "text-gray-200"}`}>{dia.data?.split("/")[0] || ""}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-semibold ${eHoje ? "text-violet-300" : "text-gray-300"}`}>
              {dia.dia}{dia.data ? `, ${dia.data}` : ""}
            </span>
            {eHoje && <span className="text-[9px] bg-violet-600 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">Hoje</span>}
            {feitos === total && total > 0 && <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">✓ Completo</span>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-violet-500"}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-gray-600 tabular-nums shrink-0">{feitos}/{total}</span>
          </div>
        </div>
        <ChevronDown size={16} className={`text-gray-600 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-white/5 divide-y divide-white/5">
          {dia.blocos.map((bloco, bi) => {
            return (
              <div key={bi} className="flex gap-3 px-4 py-3">
                <button
                  onClick={() => toggleBloco(plat, crono.id, semanaIdx, diaIdx, bi)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${bloco.concluido ? "bg-emerald-500 border-emerald-500" : "border-white/20 hover:border-violet-500"}`}>
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
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CronogramaVest() {
  const { plat, addCronograma, deleteCronograma, toggleBloco } = useStore();
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
  const [cfModo, setCfModo]         = useState("manual"); 

  // SOLUÇÃO CRÍTICA DO RENDERING: Validação sem loop infinito
  useEffect(() => {
    if (modo === "ver" && cronoAtivo) {
      const exists = cronogramas.find(c => c.id === cronoAtivo.id);
      if (!exists || !exists.semanas?.length) {
        setModo("lista");
        setCronoAtivo(null);
      }
    }
  }, [cronogramas]); // Apenas cronogramas como dependência

  const calcSemanaHoje = (crono) => {
    if (!crono?.semanas?.length) return 0;
    const hoje = todayStr();
    for (let i = 0; i < crono.semanas.length; i++) {
      const s = crono.semanas[i];
      const primeiraData = s.dias[0]?.data;
      if (!primeiraData) continue;
      const ultimaData = s.dias[6]?.data;
      if (!primeiraData || !ultimaData) continue;
      const ano = new Date().getFullYear();
      const toISO = (dd) => {
        const [d, m] = dd.split("/");
        return `${ano}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
      };
      if (hoje >= toISO(primeiraData) && hoje <= toISO(ultimaData)) return i;
    }
    return 0;
  };

  const handleVerCrono = (crono) => {
    setCronoAtivo(crono);
    setSemanaIdx(calcSemanaHoje(crono));
    setModo("ver");
  };

  const handleCriar = () => {
    let crono;
    if (cfModo === "pdf" && cfPDFText.trim()) {
      crono = parsePDFText(cfPDFText, cfTitulo);
      if (!crono) { alert("Formato inválido. Não detectamos semanas."); return; }
    } else {
      crono = gerarCronogramaVazio(cfTitulo, cfDataIni, cfSemanas);
    }
    addCronograma(plat, crono);
    setCfTitulo("Meu Cronograma Focal"); setCfPDFText(""); setCfSemanas(22);
    setCriarModal(false);
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
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <BookOpen size={48} className="text-gray-700" />
            <p className="text-[14px] text-gray-500 text-center">Nenhum cronograma montado.<br />Importe seu PDF de planejamento acadêmico.</p>
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
                    <button onClick={(e) => { e.stopPropagation(); if (window.confirm("Remover cronograma completo?")) deleteCronograma(plat, c.id); }}
                      className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center shrink-0 ml-2 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                      <span>Progresso Geral dos Blocos</span>
                      <span className="tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {criarModal && (
          <Modal onClose={() => setCriarModal(false)} wide>
            <h2 className="text-[15px] font-bold text-gray-100">Estruturar Nova Grade</h2>
            <Field label="Nome/Título"><Input value={cfTitulo} onChange={e => setCfTitulo(e.target.value)} /></Field>

            <div className="flex gap-1 bg-black/40 border border-white/10 rounded-xl p-1">
              {[["manual","Manual"],["pdf","Importar Texto de PDF"]].map(([v,l]) => (
                <button key={v} onClick={() => setCfModo(v)}
                  className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${cfModo === v ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                  {l}
                </button>
              ))}
            </div>

            {cfModo === "manual" ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Início"><Input type="date" value={cfDataIni} onChange={e => setCfDataIni(e.target.value)} /></Field>
                <Field label="Semanas"><Input type="number" value={cfSemanas} onChange={e => setCfSemanas(+e.target.value)} /></Field>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Textarea rows={6} value={cfPDFText} onChange={e => setCfPDFText(e.target.value)} placeholder="Cole aqui as linhas textuais do PDF..." className="text-[11px] font-mono" />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Btn className="flex-1" onClick={handleCriar} disabled={!cfTitulo}>Gerar</Btn>
              <Btn variant="ghost" className="flex-1" onClick={() => setCriarModal(false)}>Cancelar</Btn>
            </div>
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
    const ano = new Date().getFullYear();
    return semana.dias.findIndex(d => {
      if (!d.data) return false;
      const [dd, mm] = d.data.split("/");
      return `${ano}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}` === hoje;
    });
  })();

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <button onClick={() => setModo("lista")} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[14px] font-bold text-white truncate">{crono.titulo}</h2>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button onClick={() => setSemanaIdx(Math.max(0, semanaIdx - 1))} className="w-9 h-9 rounded-xl bg-white/5 disabled:opacity-30 flex items-center justify-center" disabled={semanaIdx === 0}>
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-[13px] font-bold text-white">Semana {semana?.numero}</p>
            {semana?.fase && <p className="text-[10px] text-violet-400 font-semibold">{semana.fase}</p>}
          </div>
          <button onClick={() => setSemanaIdx(Math.min(crono.semanas.length - 1, semanaIdx + 1))} className="w-9 h-9 rounded-xl bg-white/5 disabled:opacity-30 flex items-center justify-center" disabled={semanaIdx === crono.semanas.length - 1}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {semana && (
        <div className="flex flex-col gap-3">
          {semana.dias.map((dia, di) => (
            <DiaCard key={di} dia={dia} diaIdx={di} eHoje={di === diaHoje} semanaIdx={semanaIdx} crono={crono} plat={plat} toggleBloco={toggleBloco} />
          ))}
        </div>
      )}
    </div>
  );
}
