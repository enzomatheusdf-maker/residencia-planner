// src/components/Conquistas.jsx
import React, { useMemo } from "react";
import { Trophy } from "lucide-react";
import { useStore } from "../core/store";
import { ACHIEVEMENTS } from "../core/achievements";

const CONQUISTAS_EXTRAS = [
  {
    id: "primeiro_d0",
    nome: "Primeiro D0",
    desc: "Completou o primeiro estudo inicial (D0) de um tema.",
    xpReward: 20,
    criterio: (s) => {
      const plat = s.plat || "res";
      return (s[plat]?.temas || []).some(t => t.rev?.d0?.done);
    },
  },
  {
    id: "primeira_semana_sem_atraso",
    nome: "Semana Perfeita",
    desc: "Completou 7 dias consecutivos sem itens vencidos.",
    xpReward: 80,
    criterio: (s) => (s.gamif?.streakCurrent || 0) >= 7,
  },
  {
    id: "questoes_100",
    nome: "100 Questões",
    desc: "Registrou 100 ou mais questões respondidas.",
    xpReward: 60,
    criterio: (s) => {
      const plat = s.plat || "res";
      const temas = s[plat]?.temas || [];
      let total = 0;
      temas.forEach(t => Object.values(t.rev || {}).forEach(r => { if (r?.done) total += r.questoes || 0; }));
      return total >= 100;
    },
  },
  {
    id: "questoes_500",
    nome: "500 Questões",
    desc: "Registrou 500 ou mais questões respondidas.",
    xpReward: 150,
    criterio: (s) => {
      const plat = s.plat || "res";
      const temas = s[plat]?.temas || [];
      let total = 0;
      temas.forEach(t => Object.values(t.rev || {}).forEach(r => { if (r?.done) total += r.questoes || 0; }));
      return total >= 500;
    },
  },
  {
    id: "primeiro_simulado",
    nome: "Primeiro Simulado",
    desc: "Registrou o primeiro simulado ou prova antiga.",
    xpReward: 40,
    criterio: (s) => {
      const plat = s.plat || "res";
      return (s[plat]?.simulados || []).length >= 1;
    },
  },
  {
    id: "tres_simulados_corrigidos",
    nome: "Auditor de Erros",
    desc: "Concluiu 3 simulados com diagnóstico completo de erros.",
    xpReward: 120,
    criterio: (s) => {
      const plat = s.plat || "res";
      const sims = s[plat]?.simulados || [];
      return sims.filter(sim => sim.statusCorrecao === "concluida").length >= 3;
    },
  },
  {
    id: "anki_7d",
    nome: "7 Dias de Anki",
    desc: "Registrou Anki por 7 dias ou mais.",
    xpReward: 60,
    criterio: (s) => (s.meta?.ankiAdesao?.datas || []).length >= 7,
  },
  {
    id: "primeiro_caso_clinico",
    nome: "Raciocínio Clínico",
    desc: "Completou o primeiro caso clínico.",
    xpReward: 50,
    criterio: (s) => {
      const plat = s.plat || "res";
      const prog = s[plat]?.casosProgresso || {};
      return Object.values(prog).some(p => p?.vistos > 0);
    },
  },
  {
    id: "primeiro_erro_corrigido",
    nome: "Erro Corrigido",
    desc: "Marcou o primeiro erro como corrigido no D7.",
    xpReward: 30,
    criterio: (s) => {
      const plat = s.plat || "res";
      const sims = s[plat]?.simulados || [];
      return sims.some(sim => (sim.questoesErradas || []).some(e => e.corrigidaD7 === true));
    },
  },
];

const ALL_ACHIEVEMENTS = [...ACHIEVEMENTS, ...CONQUISTAS_EXTRAS];

export default function Conquistas() {
  const gamif = useStore(s => s.gamif);

  const avaliadas = useMemo(() => {
    const state = useStore.getState();
    return ALL_ACHIEVEMENTS.map(a => ({
      ...a,
      obtida: a.criterio(state),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamif]);

  const obtidas = avaliadas.filter(a => a.obtida).length;
  const total = avaliadas.length;

  return (
    <div className="space-y-5 animate-fade-up text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy size={20} className="text-amber-400" />
          <h2 className="text-[15px] font-bold text-gray-100">Conquistas</h2>
        </div>
        <span className="text-[11px] font-bold text-gray-500">{obtidas}/{total} desbloqueadas</span>
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
          style={{ width: `${total > 0 ? Math.round((obtidas / total) * 100) : 0}%` }}
        />
      </div>

      {/* Grid de conquistas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {avaliadas.sort((a, b) => (b.obtida ? 1 : 0) - (a.obtida ? 1 : 0)).map(a => (
          <div
            key={a.id}
            className={`rounded-2xl border p-4 flex gap-3 transition-all ${
              a.obtida
                ? "border-amber-500/30 bg-amber-500/8"
                : "border-white/5 bg-white/[0.02] opacity-50"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
              a.obtida ? "bg-amber-500/20" : "bg-white/5"
            }`}>
              {a.obtida ? (a.icon || "🏅") : "🔒"}
            </div>
            <div className="min-w-0">
              <p className={`text-[12px] font-black leading-tight ${a.obtida ? "text-white" : "text-gray-500"}`}>{a.nome}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{a.desc}</p>
              {a.obtida && (
                <span className="inline-block mt-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                  +{a.xpReward} XP
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-center text-gray-600">As conquistas são avaliadas em tempo real com base no seu progresso.</p>
    </div>
  );
}
