// src/components/AnkiAudit.jsx
import React, { useMemo, useState } from "react";
import { Zap, Plus, AlertTriangle, CheckCircle } from "lucide-react";
import { useStore } from "../core/store";
import { todayStr, fmtFull, diffDays, fmtDate, fmtRelativo, addDays } from "../core/fsrs";
import { Btn, Input, Field, Modal, InfoTooltip } from "./Primitives";

export default function AnkiAudit() {
  const { plat, addAnki, marcarAnkiHoje } = useStore();
  const ankiLog = useStore((s) => s[plat]?.ankiLog || []);
  const temas = useStore((s) => s[plat]?.temas || []);
  const simulados = useStore((s) => s[plat]?.simulados || []);
  const adesaoDatas = useStore((s) => s.meta?.ankiAdesao?.datas || []);

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("errors");
  const [f, setF] = useState({ data: todayStr(), revisados: "", again: "", novos: "", tempoMin: "", deck: "", obs: "" });

  const hoje = todayStr();
  const ankiFeitoHoje = adesaoDatas.includes(hoje);

  const adesaoAnki7d = useMemo(() => {
    let hits = 0;
    for (let i = 0; i < 7; i++) {
      if (adesaoDatas.includes(addDays(hoje, -i))) hits++;
    }
    return Math.round((hits / 7) * 100);
  }, [adesaoDatas, hoje]);

  const streakAnki = useMemo(() => {
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      if (adesaoDatas.includes(addDays(hoje, -i))) { streak++; } else { break; }
    }
    return streak;
  }, [adesaoDatas, hoje]);

  const tempoEstimadoHoje = useMemo(() => {
    return ankiLog
      .filter(l => l.data === hoje)
      .reduce((s, l) => s + (l.tempoMin || 0), 0);
  }, [ankiLog, hoje]);

  const cardsFromErrors = useMemo(() => {
    const list = [];

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
              data: stepData.reviewedAt || stepData.completedAt || stepData.date || hoje,
            });
          }
        });
      });
    });

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
            data: s.data,
          });
        }
      });
    });

    return list.sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [temas, simulados, hoje]);

  const newCardsThisWeek = useMemo(() => {
    let count = 0;

    ankiLog.forEach((l) => {
      if (l.data && diffDays(l.data, hoje) <= 7) {
        count += l.novos || 0;
      }
    });

    cardsFromErrors.forEach((c) => {
      if (c.data && diffDays(c.data, hoje) <= 7) {
        count++;
      }
    });

    return count;
  }, [ankiLog, cardsFromErrors, hoje]);

  const isOverloaded = newCardsThisWeek > 50;

  const atomicityStats = useMemo(() => {
    const eligibleCards = cardsFromErrors.filter((c) => (c.anotacao || "").trim().length >= 8);
    if (eligibleCards.length === 0) {
      return { score: 100, nonAtomicCount: 0 };
    }

    let nonAtomicCount = 0;
    eligibleCards.forEach((c) => {
      const text = c.anotacao || "";
      const hasBulletPoints = /[-*•]/.test(text);
      const hasNumberedList = /\d\.\s/.test(text);
      const commaCount = (text.match(/[,;]/g) || []).length;
      const isList = hasBulletPoints || hasNumberedList || commaCount >= 3;

      if (isList) nonAtomicCount++;
    });

    const score = Math.round(((eligibleCards.length - nonAtomicCount) / eligibleCards.length) * 100);
    return { score, nonAtomicCount };
  }, [cardsFromErrors]);

  return (
    <div className="flex flex-col gap-4 animate-fade-up text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-gray-400" />
          <h2 className="text-[15px] font-bold text-gray-100">Anki Audit</h2>
          <InfoTooltip texto="Prioriza cards gerados por erros reais, estima a atomicidade do deck e acompanha a adesão recente ao Anki." />
        </div>
        <Btn onClick={() => setOpen(true)} className="gap-2"><Plus size={16} /> Registrar Sessão</Btn>
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10.5px] uppercase tracking-wider font-semibold text-gray-500">Adesão diária</p>
          <p className="text-[12px] text-gray-300">
            Marque quando revisar seus cards. Esse check entra com peso leve na previsão de desempenho.
          </p>
        </div>
        <Btn onClick={marcarAnkiHoje} disabled={ankiFeitoHoje} className="gap-2 sm:shrink-0">
          <CheckCircle size={16} />
          {ankiFeitoHoje ? "Revisão de hoje registrada" : "Revisei meus cards hoje"}
        </Btn>
      </div>

      {isOverloaded && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-4 rounded-2xl flex items-start gap-3 animate-fade-up">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider">Alerta de Sobrecarga do Deck (Over-load)</h4>
            <p className="text-[11.5px] leading-relaxed text-gray-300">
              Você adicionou <strong className="text-white">{newCardsThisWeek} cards</strong> nos últimos 7 dias. Criar cards em excesso gera ansiedade e inviabiliza revisões futuras.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            l: "Streak",
            v: `${streakAnki}d`,
            c: streakAnki >= 7 ? "text-emerald-400" : streakAnki >= 3 ? "text-blue-400" : "text-gray-400",
            tooltip: "Dias consecutivos com revisão de Anki registrada. Meta: ≥7 dias.",
          },
          {
            l: "Adesão (7d)",
            v: `${adesaoAnki7d}%`,
            c: adesaoAnki7d >= 85 ? "text-emerald-400" : adesaoAnki7d >= 50 ? "text-yellow-400" : "text-red-400",
            tooltip: "Percentual de dias com revisão marcada nos últimos 7 dias.",
          },
          {
            l: "Novos na Semana",
            v: newCardsThisWeek,
            c: isOverloaded ? "text-amber-400 font-black" : "text-blue-400",
            tooltip: "Total de novos flashcards criados via sessões ou erros nos últimos 7 dias. Meta: até 50 cards.",
          },
          {
            l: "Tempo hoje",
            v: tempoEstimadoHoje > 0 ? `${tempoEstimadoHoje}min` : "--",
            c: tempoEstimadoHoje > 0 ? "text-cyan-400" : "text-gray-500",
            tooltip: "Tempo total de revisão de Anki registrado hoje.",
          },
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

      <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 rounded-lg text-[12px] font-black transition-all border-none cursor-pointer ${
            activeTab === "logs" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300 bg-transparent"
          }`}
        >
          Auditoria avançada (opcional)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("errors")}
          className={`px-4 py-2 rounded-lg text-[12px] font-black transition-all border-none cursor-pointer ${
            activeTab === "errors" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300 bg-transparent"
          }`}
        >
          Cards por Erros Reais ({cardsFromErrors.length})
        </button>
      </div>

      {activeTab === "logs" && (
        <div className="flex flex-col gap-2">
          <div className="bg-black/20 rounded-2xl border border-white/5 p-4 text-[12px] text-gray-400">
            O log manual continua disponível para quem já usa, mas ficou como trilha secundária. O foco principal agora são cards gerados por erros reais.
          </div>
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
                    ["Revisados", l.revisados, "text-blue-400"],
                    ["Novos", l.novos || 0, "text-blue-400"],
                    ["Again (Erros)", `${pct}%`, col],
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
            const hasMinText = text.trim().length >= 8;
            const isComplex = hasMinText && (hasBulletPoints || hasNumberedList || commaCount >= 3);

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
                  ) : !hasMinText ? (
                    <span className="text-[9.5px] font-black uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle size={10} /> Texto curto demais
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

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <h2 className="text-[15px] font-bold text-gray-100 mb-2">Registrar sessão Anki</h2>
          <Field label="Data" info="A data referente aos registros de revisão do Anki."><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Field label="Revisados" info="Número total de cards revisados neste dia."><Input type="number" value={f.revisados} onChange={(e) => setF({ ...f, revisados: +e.target.value })} /></Field>
            <Field label='"Again"' info="Número de cards errados neste dia."><Input type="number" value={f.again} onChange={(e) => setF({ ...f, again: +e.target.value })} /></Field>
            <Field label="Novos" info="Número de novos cards inseridos neste dia."><Input type="number" value={f.novos} onChange={(e) => setF({ ...f, novos: +e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Tempo (min)" info="Tempo aproximado gasto na sessão."><Input type="number" value={f.tempoMin} onChange={(e) => setF({ ...f, tempoMin: e.target.value === "" ? "" : +e.target.value })} /></Field>
            <Field label="Deck" info="Deck principal revisado."><Input value={f.deck} onChange={(e) => setF({ ...f, deck: e.target.value })} placeholder="ex: Residência / Pediatria" /></Field>
          </div>
          <Field label="Observação opcional" info="Use para registrar anomalias de carga, deck ou retenção."><Input value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} placeholder="ex: muitos cards de erro de simulado" /></Field>
          {f.revisados > 0 && (
            <p className="text-center text-xl font-black text-blue-400 tabular-nums my-2">
              {Math.round((f.again / f.revisados) * 100)}% de Erro Real
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <Btn
              className="flex-1"
              onClick={() => {
                if (f.revisados) {
                  addAnki(plat, f);
                  marcarAnkiHoje();
                  setOpen(false);
                  setF({ data: todayStr(), revisados: "", again: "", novos: "", tempoMin: "", deck: "", obs: "" });
                }
              }}
              disabled={!f.revisados}
            >
              Gravar Histórico
            </Btn>
            <Btn variant="ghost" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
