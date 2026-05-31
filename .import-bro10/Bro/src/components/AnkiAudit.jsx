// src/components/AnkiAudit.jsx
import React, { useState, useMemo } from "react";
import { Zap, Plus, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { useStore } from "../core/store";
import { todayStr, fmtFull, diffDays, fmtDate, fmtRelativo } from "../core/fsrs";
import { Btn, Input, Field, Modal, InfoTooltip } from "./Primitives";

export default function AnkiAudit() {
  const { plat, addAnki } = useStore();
  const ankiLog = useStore((s) => s[plat]?.ankiLog || []);
  const temas = useStore((s) => s[plat]?.temas || []);
  const simulados = useStore((s) => s[plat]?.simulados || []);

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("logs");
  const [f, setF] = useState({ data: todayStr(), revisados: "", again: "", novos: "" });

  const avgAgain = ankiLog.length
    ? Math.round(ankiLog.reduce((a, l) => a + (l.revisados ? l.again / l.revisados * 100 : 0), 0) / ankiLog.length)
    : null;

  // 1. Collect all card-generating errors (virouCard === true) from study reviews and simulados
  const cardsFromErrors = useMemo(() => {
    const list = [];

    // Study errors
    temas.forEach((t) => {
      Object.entries(t.rev || {}).forEach(([stepKey, stepData]) => {
        const stepErros = stepData?.erros || [];
        stepErros.forEach((e) => {
          if (e.virouCard) {
            list.push({
              id: e.id || Math.random(),
              source: `Tema: ${t.nome} (${stepKey.toUpperCase()})`,
              subtopico: e.subtopico || t.nome,
              anotacao: e.anotacao || "Fato clínico/conteúdo memorizado",
              tipoErro: e.tipoErro,
              data: stepData.date || todayStr()
            });
          }
        });
      });
    });

    // Simulado errors
    simulados.forEach((s) => {
      const erradas = s.questoesErradas || [];
      erradas.forEach((e) => {
        if (e.virouCard) {
          list.push({
            id: e.id || Math.random(),
            source: `Simulado (${fmtDate(s.data)})`,
            subtopico: e.esp || "Geral",
            anotacao: `Questão ${e.num}: ${e.desc || "Mapeamento de erro"}`,
            tipoErro: e.tipoErro,
            data: s.data
          });
        }
      });
    });

    // Sort by date (descending)
    return list.sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [temas, simulados]);

  // 2. Health of the Deck: overload warning (criação excessiva de cards)
  const newCardsThisWeek = useMemo(() => {
    const today = todayStr();
    let count = 0;

    // From log entries in the last 7 days
    ankiLog.forEach((l) => {
      if (l.data && diffDays(l.data, today) <= 7) {
        count += (l.novos || 0);
      }
    });

    // From errors that generated cards in the last 7 days
    cardsFromErrors.forEach((c) => {
      if (c.data && diffDays(c.data, today) <= 7) {
        count++;
      }
    });

    return count;
  }, [ankiLog, cardsFromErrors]);

  const isOverloaded = newCardsThisWeek > 50;

  // 3. Atomicity Metric (Quality Score)
  const atomicityStats = useMemo(() => {
    if (cardsFromErrors.length === 0) {
      return { score: 100, nonAtomicCount: 0 };
    }

    let nonAtomicCount = 0;
    cardsFromErrors.forEach((c) => {
      const text = c.anotacao || "";
      // Check if it looks like a list (> 3 commas, bullet points, numbers)
      const hasBulletPoints = /[-*•]/.test(text);
      const hasNumberedList = /\d\.\s/.test(text);
      const commaCount = (text.match(/[,;]/g) || []).length;
      const isList = hasBulletPoints || hasNumberedList || commaCount >= 3;

      if (isList) {
        nonAtomicCount++;
      }
    });

    const score = Math.round(((cardsFromErrors.length - nonAtomicCount) / cardsFromErrors.length) * 100);
    return { score, nonAtomicCount };
  }, [cardsFromErrors]);

  return (
    <div className="flex flex-col gap-4 animate-fade-up text-left">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-gray-400" />
          <h2 className="text-[15px] font-bold text-gray-100">Anki Audit</h2>
          <InfoTooltip texto='Mapeia o índice de retenção do Anki, a atomicidade dos cards criados e a carga semanal para evitar sobrecarga cognitiva.' />
        </div>
        <Btn onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Registrar Sessão</Btn>
      </div>

      {/* OVERLOAD ALERT */}
      {isOverloaded && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-4 rounded-2xl flex items-start gap-3 animate-fade-up">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider">Alerta de Sobrecarga do Deck (Over-load)</h4>
            <p className="text-[11.5px] leading-relaxed text-gray-300">
              Você adicionou <strong className="text-white">{newCardsThisWeek} cards</strong> nos últimos 7 dias. Criar cards em excesso (grind) gera ansiedade e inviabiliza revisões futuras. Consolide e simplifique seus decks antes de adicionar novos fatos!
            </p>
          </div>
        </div>
      )}

      {/* KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            l: "Novos na Semana",
            v: newCardsThisWeek,
            c: isOverloaded ? "text-amber-400 font-black" : "text-blue-400",
            tooltip: "Total de novos flashcards criados via sessões ou erros nos últimos 7 dias. Meta: ≤ 50 cards."
          },
          {
            l: "Qualidade do Deck",
            v: `${atomicityStats.score}%`,
            c: atomicityStats.score >= 80 ? "text-emerald-400" : atomicityStats.score >= 60 ? "text-yellow-400" : "text-red-400",
            tooltip: "Proporção de cards curtos e atômicos (sem listas ou enumerações complexas). Ideal: ≥ 80%."
          },
          {
            l: "Média de Erros",
            v: avgAgain != null ? `${avgAgain}%` : "—",
            c: avgAgain != null && avgAgain < 15 ? "text-emerald-400" : "text-yellow-400",
            tooltip: "Sua taxa histórica de 'Again' registrada no Anki. Ideal: manter abaixo de 15%."
          }
        ].map((kpi) => (
          <div key={kpi.l} className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-[10.5px] uppercase tracking-wider font-semibold">{kpi.l}</span>
              <InfoTooltip texto={kpi.tooltip} />
            </div>
            <p className={`text-3xl font-black tabular-nums ${kpi.c}`}>{kpi.v}</p>
          </div>
        ))}
      </div>

      {/* TABS SWITCHER */}
      <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 rounded-lg text-[12px] font-black transition-all border-none cursor-pointer ${
            activeTab === "logs" ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-300 bg-transparent"
          }`}
        >
          Histórico de Sessões
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("errors")}
          className={`px-4 py-2 rounded-lg text-[12px] font-black transition-all border-none cursor-pointer ${
            activeTab === "errors" ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-300 bg-transparent"
          }`}
        >
          Cards por Erros Reais ({cardsFromErrors.length})
        </button>
      </div>

      {/* TAB CONTENT: LOGS */}
      {activeTab === "logs" && (
        <div className="flex flex-col gap-2">
          {ankiLog.length === 0 && (
            <div className="text-center py-16 text-gray-600 text-[13px] italic bg-black/20 rounded-2xl border border-white/5">
              Nenhuma auditoria de Anki gravada.
            </div>
          )}
          {[...ankiLog].reverse().map((l) => {
            const pct = l.revisados ? Math.round((l.again / l.revisados) * 100) : 0;
            const col = pct < 15 ? "text-emerald-400" : pct < 30 ? "text-yellow-400" : "text-red-400";
            return (
              <div
                key={l.id}
                className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/10 transition-colors gap-4"
              >
                <span className="text-[12px] text-gray-400 font-bold shrink-0">{fmtFull(l.data)}</span>
                <div className="flex gap-6">
                  {[
                    ["Revisados", l.revisados, "text-violet-400"],
                    ["Novos", l.novos || 0, "text-blue-400"],
                    ["Again (Erros)", `${pct}%`, col]
                  ].map(([lbl, val, c]) => (
                    <div key={lbl} className="text-center">
                      <p className="text-[10px] text-gray-600 mb-0.5">{lbl}</p>
                      <p className={`text-[13px] font-bold tabular-nums ${c}`}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT: CARDS FROM ERRORS */}
      {activeTab === "errors" && (
        <div className="flex flex-col gap-2">
          {cardsFromErrors.length === 0 && (
            <div className="text-center py-16 text-gray-600 text-[13px] italic bg-black/20 rounded-2xl border border-white/5">
              Nenhum card foi gerado a partir de erros de simulados ou estudos até o momento.
            </div>
          )}
          {cardsFromErrors.map((card) => {
            const text = card.anotacao || "";
            const hasBulletPoints = /[-*•]/.test(text);
            const hasNumberedList = /\d\.\s/.test(text);
            const commaCount = (text.match(/[,;]/g) || []).length;
            const isComplex = hasBulletPoints || hasNumberedList || commaCount >= 3;

            return (
              <div
                key={card.id}
                className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:border-white/10 transition-all gap-3 text-left"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-gray-200 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                      {card.subtopico}
                    </span>
                    <span className="text-[9.5px] font-mono text-gray-500">{card.source}</span>
                  </div>
                  <p className="text-xs text-gray-300 font-medium leading-relaxed italic">
                    "{card.anotacao}"
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  <span className="text-[10px] text-gray-500 font-mono">{fmtRelativo(card.data)}</span>
                  {isComplex ? (
                    <span className="text-[9.5px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertTriangle size={10} /> Lista complexa
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle size={10} /> Atômico
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <h2 className="text-[15px] font-bold text-gray-100 mb-2">Auditar Estatísticas Anki</h2>
          <Field label="Data" info="A data referente aos registros de revisão do Anki."><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Revisados" info="Número total de cards revisados (estudados) neste dia."><Input type="number" value={f.revisados} onChange={(e) => setF({ ...f, revisados: +e.target.value })} /></Field>
            <Field label='"Again"' info="Número de cards que você errou (marcou 'Again' ou 'De novo') neste dia."><Input type="number" value={f.again} onChange={(e) => setF({ ...f, again: +e.target.value })} /></Field>
            <Field label="Novos" info="Número de novos cards que você inseriu na sua rotina de estudos neste dia."><Input type="number" value={f.novos} onChange={(e) => setF({ ...f, novos: +e.target.value })} /></Field>
          </div>
          {f.revisados > 0 && (
            <p className="text-center text-xl font-black text-violet-400 tabular-nums my-2">
              {Math.round((f.again / f.revisados) * 100)}% de Erro Real
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <Btn className="flex-1"
              onClick={() => {
                if (f.revisados) {
                  addAnki(plat, f);
                  setOpen(false);
                  setF({ data: todayStr(), revisados: "", again: "", novos: "" });
                }
              }}
              disabled={!f.revisados}>Gravar Histórico</Btn>
            <Btn variant="ghost" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
