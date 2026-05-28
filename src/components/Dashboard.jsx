// src/components/Dashboard.jsx
import React, { useMemo } from "react";
import { Edit2, Info, TrendingUp, CheckCircle } from "lucide-react";
import { useStore } from "../core/store";
import { STEPS, ESP_COLORS, isOverdue, isDueToday, isDueSoon } from "../core/fsrs";
import { calcStreaks, calcTrueRetention, calcBleedingScore, calcFilaInteligente } from "../hooks/useMetrics";
import { CronogramaWidget } from "./CronogramaCecilia_MEGA";

export default function Dashboard({ onStudy, onDelete, userName, onEditName, focusMode, modoSimples, toggleModoSimples, concluidosHoje, totalFilaHoje }) {
  const { plat, sprint }  = useStore();
  const temas           = useStore((s) => s[plat]?.temas || []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const temasFiltrados = useMemo(() => {
    if (sprint?.ativa && sprint?.esps?.length > 0) return temas.filter(t => sprint.esps.includes(t.esp));
    return temas;
  }, [temas, sprint]);

  const allRev  = temasFiltrados.flatMap((t) => STEPS.map((s) => ({ ...t.rev[s.key], esp: t.esp, step: s, temaNome: t.nome, temaId: t.id, ankiDeck: t.ankiDeck })));
  const overdue = allRev.filter((r) => isOverdue(r.date)  && !r.done);
  const today_  = allRev.filter((r) => isDueToday(r.date) && !r.done);
  const done    = allRev.filter((r) => r.done);
  const pending = overdue.length + today_.length;

  const totalQ    = done.reduce((a, r) => a + (r.questoes || 0), 0);
  const doneDays = useMemo(() => new Set(done.map((r) => r.date)), [done]);
  const { current: streakCurrent, best: streakBest } = useMemo(() => calcStreaks(doneDays), [doneDays]);
  const trueRet = calcTrueRetention(temasFiltrados);
  const bleeding = calcBleedingScore(temasFiltrados);

  const acertoMedio = useMemo(() => {
    const rs = done.filter(r => r.acerto != null);
    return rs.length ? Math.round(rs.reduce((a, r) => a + r.acerto, 0) / rs.length * 100) : null;
  }, [done]);

  const emBreve = useMemo(
    () => allRev.filter(r => isDueSoon(r.date) && !r.done).length,
    [allRev]
  );
  const filaInteligente = useMemo(() => calcFilaInteligente(temasFiltrados).slice(0, 5), [temasFiltrados]);

  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 34 + i);
    return d.toISOString().slice(0, 10);
  });

  const espAbbr = (esp) => {
    const map = { "Cirurgia": "CI", "Clínica Médica": "CM", "GO": "GO", "Pediatria": "PE", "Preventiva": "PR" };
    return map[esp] || esp.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-up text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {userName}.</h1>
          <button type="button" onClick={onEditName} className="text-gray-500 hover:text-gray-300 transition-colors">
            <Edit2 size={18} />
          </button>
        </div>
      </div>

      {/* Streak Banner */}
      {streakCurrent > 0 ? (
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="text-5xl">🔥</div>
          <div>
            <p className="text-sm text-gray-400">Sequência</p>
            <p className="text-2xl font-black text-orange-400">{streakCurrent} dias seguidos</p>
          </div>
        </div>
      ) : streakBest > 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-gray-500 text-sm">
          Sua melhor sequência foi <span className="font-bold text-violet-400">{streakBest} dias</span>. Comece uma nova hoje!
        </div>
      ) : null}

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative group">
          <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
            Acerto Médio
            <button className="text-gray-600 hover:text-gray-400"><Info size={13} /></button>
          </p>
          <p className={`text-3xl font-black tabular-nums ${acertoMedio == null ? "text-gray-600" : acertoMedio >= 80 ? "text-emerald-400" : acertoMedio >= 65 ? "text-violet-400" : "text-red-400"}`}>
            {acertoMedio != null ? `${acertoMedio}%` : "—"}
          </p>
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1a1e] border border-white/15 rounded-xl p-2.5 text-[10px] text-gray-300 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            Taxa média de acerto em todas as revisões. Melhora conforme você completa ciclos FSRS.
          </div>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative group">
          <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
            Dominados
            <button className="text-gray-600 hover:text-gray-400"><Info size={13} /></button>
          </p>
          <p className="text-3xl font-black text-emerald-400">{temasFiltrados.filter(t => STEPS.every(s => t.rev[s.key].done)).length}/{temasFiltrados.length}</p>
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1a1e] border border-white/15 rounded-xl p-2.5 text-[10px] text-gray-300 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            Número de temas com todos os ciclos (D0→D21) completados.
          </div>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative group">
          <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
            Em Breve
            <button className="text-gray-600 hover:text-gray-400"><Info size={13} /></button>
          </p>
          <p className={`text-3xl font-black tabular-nums ${emBreve > 0 ? "text-cyan-400" : "text-gray-600"}`}>
            {emBreve > 0 ? `+${emBreve}` : "0"}
          </p>
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1a1e] border border-white/15 rounded-xl p-2.5 text-[10px] text-gray-300 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            Temas agendados para revisão nos próximos 3 dias.
          </div>
        </div>
      </div>

      {temasFiltrados.length === 0 && (
        <div className="bg-gradient-to-br from-violet-500/10 to-pink-500/5 border border-violet-500/20 rounded-2xl p-6 flex flex-col gap-4 text-center">
          <div className="text-3xl">🎯</div>
          <div>
            <p className="text-[15px] font-bold text-white">Tudo pronto! Agora inicie seu primeiro tema.</p>
            <p className="text-[12px] text-gray-400 mt-1">Vá em <strong className="text-violet-400">Cronograma</strong> e clique em <strong className="text-violet-400">"Iniciar Ciclo Hoje"</strong> em qualquer tema para começar.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`${focusMode ? "lg:col-span-12" : "lg:col-span-8"} flex flex-col gap-5`}>
          {!focusMode && (
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Fila Padrão Diária</p>
                  <div className="flex items-end gap-2">
                    <span className={`text-[56px] font-black leading-none tabular-nums ${pending > 0 ? "text-white" : "text-emerald-400"}`}>{pending}</span>
                    <span className="text-[14px] text-gray-500 mb-2">pendentes</span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center gap-1">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Questões Concluídas</p>
                  <p className="text-[22px] font-black text-violet-400 tabular-nums leading-none">{totalQ > 0 ? totalQ.toLocaleString("pt-BR") : "0"}</p>
                </div>
              </div>
            </div>
          )}

          {!modoSimples && (
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-cyan-400" />
                <h3 className="text-[13px] font-bold text-white">Fila de Prioridade Inteligente (Score Algorítmico)</h3>
              </div>
              {filaInteligente.length === 0 ? (
                <p className="text-[12px] text-gray-600 italic py-4 text-center">Nenhuma recomendação prioritária no momento.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {filaInteligente.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded">Score: {item.score}</span>
                          <p className="text-[13px] font-bold text-gray-200 truncate">{item.temaNome}</p>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{item.esp} · Etapa {item.step.label}</p>
                      </div>
                      <button type="button" onClick={() => onStudy(item.temaId, item.stepKey)} className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold transition-all">
                        Focar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-[13px] font-bold text-white">Fila Cronológica Diária</h3>
            {pending === 0 ? (
              <div className="text-center text-gray-600 text-[13px] py-6 flex flex-col items-center gap-2">
                <CheckCircle size={24} className="text-emerald-400" /> Meta batida por hoje!
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/5">
                {[...overdue, ...today_].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0" style={{ background: (ESP_COLORS[r.esp] || "#94a3b8") + "22", color: ESP_COLORS[r.esp] }}>
                      {espAbbr(r.esp)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-white truncate">{r.temaNome}</p>
                      <p className="text-[11px] text-gray-500 uppercase font-mono mt-0.5">{r.step.label} · {r.step.desc}</p>
                    </div>
                    <button type="button" onClick={() => onStudy(r.temaId, r.step.key)} className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-[11px] font-semibold hover:bg-violet-500">
                      Revisar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!modoSimples && <CronogramaWidget />}
        </div>

        {!focusMode && !modoSimples && (
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-[10.5px] text-gray-500 uppercase tracking-wider font-semibold">Consistência Diária</p>
              <div className="grid grid-cols-7 gap-1.5">
                {days.map((d) => <div key={d} className={`aspect-square rounded-sm ${doneDays.has(d) ? "bg-violet-500" : "bg-white/[0.04]"}`} />)}
              </div>
            </div>

            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-[10.5px] text-gray-500 uppercase font-semibold">True Retention (D21)</p>
              <span className="text-3xl font-black text-emerald-400">{trueRet != null ? `${trueRet}%` : "—"}</span>
            </div>

            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-[10.5px] text-gray-500 uppercase font-semibold">Zonas de Alerta Crítico</p>
              {bleeding.map(b => (
                <div key={b.esp} className="flex justify-between p-1.5 border border-red-500/10 rounded-lg bg-red-500/[0.01]">
                  <span className="text-[12px] text-gray-300">{b.esp}</span>
                  <span className="text-[12px] font-black text-red-400">{b.acc}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
