// src/core/achievements.js
export const ACHIEVEMENTS = [
  {
    id: "streak_7",
    nome: "Hábito Iniciado",
    desc: "Atingiu 7 dias de streak de estudos",
    icon: "🔥",
    xpReward: 50,
    criterio: (s) => (s.gamif?.streakCurrent || 0) >= 7,
  },
  {
    id: "streak_30",
    nome: "Constância de Ferro",
    desc: "Atingiu 30 dias de streak de estudos",
    icon: "⚡",
    xpReward: 150,
    criterio: (s) => (s.gamif?.streakCurrent || 0) >= 30,
  },
  {
    id: "streak_100",
    nome: "Inabalável",
    desc: "Atingiu 100 dias de streak de estudos",
    icon: "🏆",
    xpReward: 500,
    criterio: (s) => (s.gamif?.streakCurrent || 0) >= 100,
  },
  {
    id: "revs_7",
    nome: "Primeiros Passos",
    desc: "Concluiu 7 revisões ativas no perfil",
    icon: "📚",
    xpReward: 30,
    criterio: (s) => {
      const statsList = Object.values(s.temaStats || {}).flat();
      return statsList.length >= 7;
    },
  },
  {
    id: "revs_30",
    nome: "Prática Consistente",
    desc: "Concluiu 30 revisões ativas",
    icon: "🎯",
    xpReward: 100,
    criterio: (s) => {
      const statsList = Object.values(s.temaStats || {}).flat();
      return statsList.length >= 30;
    },
  },
  {
    id: "revs_100",
    nome: "Veterano do FSRS",
    desc: "Concluiu 100 revisões ativas",
    icon: "🧠",
    xpReward: 300,
    criterio: (s) => {
      const statsList = Object.values(s.temaStats || {}).flat();
      return statsList.length >= 100;
    },
  },
  {
    id: "first_d21",
    nome: "Mente Retentiva",
    desc: "Completou o ciclo FSRS D0→D21 de um tema",
    icon: "💎",
    xpReward: 80,
    criterio: (s) => {
      const plat = s.plat || "res";
      const temas = s[plat]?.temas || [];
      return temas.some(t => {
        const rev = t.rev || {};
        return rev.d0?.done && rev.d1?.done && rev.d4?.done && rev.d7?.done && rev.d21?.done;
      });
    },
  },
  {
    id: "high_retention",
    nome: "Retenção de Elite",
    desc: "Alcançou True Retention global igual ou superior a 80%",
    icon: "📈",
    xpReward: 120,
    criterio: (s) => {
      const plat = s.plat || "res";
      const temas = s[plat]?.temas || [];
      const vals = [];
      temas.forEach(t => {
        if (t.unstarted) return;
        Object.keys(t.rev || {}).forEach(k => {
          if (k === "d21" || k === "d7") {
            const r = t.rev[k];
            if (r && r.done && r.acerto != null) {
              vals.push(r.acerto);
            }
          }
        });
      });
      if (vals.length < 5) return false;
      const tr = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100);
      return tr >= 80;
    },
  },
  {
    id: "coragem_erros",
    nome: "Encarando Falhas",
    desc: "Registrou 10 erros estruturados em simulados",
    icon: "🛡️",
    xpReward: 100,
    criterio: (s) => {
      const plat = s.plat || "res";
      const simulados = s[plat]?.simulados || [];
      const totalErros = simulados.reduce((a, sim) => a + (sim.questoesErradas || []).length, 0);
      return totalErros >= 10;
    },
  },
];
