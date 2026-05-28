// src/core/store.js
// Zustand Store for central state management

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { buildRev, recalcAfterMark, STEPS, S_BASE, todayStr, addDays } from "./fsrs";

const initialPlat = () => ({ temas: [], simulados: [], ankiLog: [], cronogramas: [] });

const initialVestibularPlat = () => {
  const temasData = [
    // BLOCO 1: EXATAS
    { id: 1, nome: "Matemática - Fundamentos", esp: "Exatas", prio: "Alta", importancia: "CRITICA", d0: "2026-05-25", obs: "CdM + UFG provas" },
    { id: 2, nome: "Matemática - Nível Avançado", esp: "Exatas", prio: "Alta", importancia: "CRITICA", d0: "2026-06-01", obs: "EsPCEx dificil" },
    { id: 3, nome: "Física - Mecânica", esp: "Exatas", prio: "Alta", importancia: "ALTA", d0: "2026-05-28", obs: "CdM + UFG provas" },
    { id: 4, nome: "Física - Óptica e Ondulatória", esp: "Exatas", prio: "Alta", importancia: "ALTA", d0: "2026-06-04", obs: "EsPCEx avançada" },

    // BLOCO 2: CIÊNCIAS DA NATUREZA
    { id: 5, nome: "Química - Geral", esp: "Ciências da Natureza", prio: "Alta", importancia: "CRITICA", d0: "2026-05-26", obs: "CdM + UFG provas" },
    { id: 6, nome: "Química - Orgânica", esp: "Ciências da Natureza", prio: "Alta", importancia: "ALTA", d0: "2026-06-02", obs: "EsPCEx" },
    { id: 7, nome: "Biologia - Citologia e Genética", esp: "Ciências da Natureza", prio: "Alta", importancia: "CRITICA", d0: "2026-05-27", obs: "CdM + UFG provas" },
    { id: 8, nome: "Biologia - Ecologia e Evolução", esp: "Ciências da Natureza", prio: "Alta", importancia: "ALTA", d0: "2026-06-03", obs: "Estuda 15q dificeis" },

    // BLOCO 3: HUMANAS
    { id: 9, nome: "História Geral", esp: "Humanas", prio: "Média", importancia: "ALTA", d0: "2026-05-28", obs: "CdM 2 tópicos + Estuda UFG" },
    { id: 10, nome: "História Brasil", esp: "Humanas", prio: "Média", importancia: "ALTA", d0: "2026-06-04", obs: "CdM 2 tópicos + Estuda UFG" },
    { id: 11, nome: "Geografia", esp: "Humanas", prio: "Média", importancia: "MEDIA", d0: "2026-06-02", obs: "CdM 2 tópicos + Estuda UFG" },
    { id: 12, nome: "Filosofia", esp: "Humanas", prio: "Média", importancia: "MEDIA", d0: "2026-06-04", obs: "CdM revisão 3 aulas essenciais" },
    { id: 13, nome: "Sociologia", esp: "Humanas", prio: "Média", importancia: "MEDIA", d0: "2026-06-05", obs: "CdM 2 tópicos + Estuda UFG" },

    // BLOCO 3: LINGUAGENS
    { id: 14, nome: "Redação - Estrutura", esp: "Linguagens", prio: "Alta", importancia: "CRITICA", d0: "2026-05-29", obs: "Escreve em 1h. Revisão tripla" },
    { id: 15, nome: "Redação - Argumentação", esp: "Linguagens", prio: "Alta", importancia: "CRITICA", d0: "2026-06-03", obs: "Foco C5: 5 elements" },
    { id: 16, nome: "Português - Gramática", esp: "Linguagens", prio: "Média", importancia: "ALTA", d0: "2026-06-05", obs: "Prova UFG linguagens" },
    { id: 17, nome: "Português - Literatura", esp: "Linguagens", prio: "Média", importancia: "ALTA", d0: "2026-06-13", obs: "1 obra literária UFU/UFG" },
    { id: 18, nome: "Espanhol", esp: "Linguagens", prio: "Baixa", importancia: "MEDIA", d0: "2026-06-12", obs: "Prova UFG + espanhol" },

    // BLOCO 3: ARTES
    { id: 19, nome: "Artes - Música", esp: "Linguagens", prio: "Baixa", importancia: "MEDIA", d0: "2026-05-30", obs: "Som, Villa-Lobos, Choro, Bossa Nova" },
    { id: 20, nome: "Artes - Visuais", esp: "Linguagens", prio: "Baixa", importancia: "MEDIA", d0: "2026-05-30", obs: "Pré-história ao Renascimento" },
    { id: 21, nome: "Artes - Cênicas e Cinema", esp: "Linguagens", prio: "Baixa", importancia: "MEDIA", d0: "2026-05-30", obs: "Teatro Grego, Brasil, Cinema" },

    // EXTRA: SIMULADOS E REVISÃO
    { id: 22, nome: "Simulado UFG 2023", esp: "Exatas", prio: "Alta", importancia: "ALTA", d0: "2026-05-30", obs: "Condição real: sem celular, cronometrado" },
    { id: 23, nome: "Simulado UFG 2022", esp: "Humanas", prio: "Alta", importancia: "ALTA", d0: "2026-06-06", obs: "Cronometrado, sem pausa" },
    { id: 24, nome: "Simulado UFG 2021", esp: "Ciências da Natureza", prio: "Alta", importancia: "ALTA", d0: "2026-06-13", obs: "Condição adversa: cadeira dura, ruído" },
  ];

  const temas = temasData.map((t) => ({ ...t, rev: buildRev(t.d0) }));
  return { temas, simulados: [], ankiLog: [], cronogramas: [] };
};

export const useStore = create(
  persist(
    (set, get) => ({
      plat: "res",
      userName: "Estudante",
      meta: { dataProva: "2026-10-25", acerto: 85, metaDiaria: 0 },
      res: initialPlat(),
      vest: initialVestibularPlat(),
      undoStack: [],
      onboardingDone: false,
      sprint: { esps: [], ativa: false, semana: "" },

      // ─── ESTADOS DE MEMÓRIA V7 ─────────────────────────────────────────────
      focusMode: false,
      modoSimples: true,
      brainDumpD1Data: {},
      temaStats: {},
      setPlat: (p) => set({ plat: p }),
      setUserName: (name) => set({ userName: name }),
      setMeta: (meta) => set({ meta }),
      setOnboardingDone: () => set({ onboardingDone: true }),
      resetOnboarding: () => set({ onboardingDone: false }),
      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
      toggleModoSimples: () => set((state) => ({ modoSimples: !state.modoSimples })),

      setBrainDumpD1: (temaId, data) =>
        set((state) => ({
          brainDumpD1Data: {
            ...state.brainDumpD1Data,
            [temaId]: { ...data, timestamp: new Date() },
          },
        })),

      addTemaStats: (temaId, stats) =>
        set((state) => ({
          temaStats: {
            ...state.temaStats,
            [temaId]: [...(state.temaStats[temaId] || []), { ...stats, completedAt: new Date().toISOString() }],
          },
        })),
      setSprint: (s) => set({ sprint: s }),

      exportKey: () => {
        const s = get();
        return btoa(
          JSON.stringify({
            userName: s.userName,
            plat: s.plat,
            meta: s.meta,
            res: s.res,
            vest: s.vest,
            onboardingDone: s.onboardingDone,
          })
        );
      },
      importKey: (key) => {
        try {
          const data = JSON.parse(atob(key));
          set({
            userName: data.userName,
            plat: data.plat,
            meta: data.meta,
            res: data.res,
            vest: data.vest,
            onboardingDone: data.onboardingDone,
          });
          return true;
        } catch {
          return false;
        }
      },

      addTema: (platKey, tema) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            temas: [
              ...s[platKey].temas,
              {
                ...tema,
                id: tema.id || Date.now(), // Fixed the bug: preserve ID if provided
                importancia: tema.importancia || "ALTA",
                ankiDeck: tema.ankiDeck || "",
                rev: buildRev(tema.d0),
              },
            ],
          },
        })),

      updateTema: (platKey, id, fields) =>
        set((s) => {
          const old = s[platKey].temas.find((t) => t.id === id);
          if (!old) return {};
          let newRev = old.rev;
          if (fields.d0 && fields.d0 !== old.d0) {
            newRev = buildRev(fields.d0);
            STEPS.forEach((step) => {
              newRev[step.key].done = old.rev[step.key].done;
              newRev[step.key].acerto = old.rev[step.key].acerto;
              newRev[step.key].questoes = old.rev[step.key].questoes;
              newRev[step.key].S = old.rev[step.key].S ?? S_BASE[step.key];
            });
          }
          return {
            [platKey]: {
              ...s[platKey],
              temas: s[platKey].temas.map((t) => (t.id === id ? { ...t, ...fields, rev: newRev } : t)),
            },
          };
        }),

      deleteTema: (platKey, id) =>
        set((s) => ({ [platKey]: { ...s[platKey], temas: s[platKey].temas.filter((t) => t.id !== id) } })),

      markStep: (platKey, temaId, stepKey, { acerto, questoes, motivosErro, tempoMin, ansiedade, cansaco, confianca, dificuldade, foco }) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            temas: s[platKey].temas.map((t) => {
              if (t.id !== temaId) return t;
              const revMarked = {
                ...t.rev,
                [stepKey]: {
                  ...t.rev[stepKey],
                  done: true,
                  acerto,
                  questoes,
                  motivosErro: motivosErro || [],
                  tempoMin: tempoMin ?? t.rev[stepKey].tempoMin,
                  ansiedade: ansiedade ?? t.rev[stepKey].ansiedade,
                  cansaco: cansaco ?? t.rev[stepKey].cansaco,
                  confianca: confianca ?? t.rev[stepKey].confianca,
                  dificuldade: dificuldade ?? t.rev[stepKey].dificuldade,
                  foco: foco ?? t.rev[stepKey].foco,
                },
              };
              return { ...t, rev: recalcAfterMark(revMarked, stepKey, acerto) };
            }),
          },
        })),

      markD0FromCronograma: (platKey, temaId) =>
        set((s) => {
          const tema = s[platKey].temas.find((t) => t.id === temaId);
          if (!tema || tema.rev.d0.done) return {};
          return {
            [platKey]: {
              ...s[platKey],
              temas: s[platKey].temas.map((t) =>
                t.id !== temaId
                  ? t
                  : {
                      ...t,
                      rev: { ...t.rev, d0: { ...t.rev.d0, done: true, acerto: 1.0, questoes: 0, motivosErro: [] } },
                    }
              ),
            },
          };
        }),

      importTemas: (platKey, items, d0) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            temas: [
              ...s[platKey].temas,
              ...items.map((it) => ({
                id: Date.now() + Math.random(),
                nome: it.nome,
                esp: it.esp,
                prio: it.prio,
                importancia: "ALTA",
                obs: "MEDCOF 2026",
                pico: "",
                ankiDeck: "",
                d0,
                rev: buildRev(d0),
              })),
            ],
          },
        })),

      optimize: (platKey) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            temas: s[platKey].temas.map((t) => {
              const nr = { ...t.rev };
              let lastDate = todayStr();
              STEPS.forEach((step, i) => {
                if (!nr[step.key].done && nr[step.key].date < todayStr()) {
                  nr[step.key] = { ...nr[step.key], date: i === 0 ? todayStr() : addDays(lastDate, 1) };
                } else if (nr[step.key].done) {
                  lastDate = nr[step.key].date || lastDate;
                }
              });
              return { ...t, rev: nr };
            }),
          },
        })),

      pushUndo: (platKey) =>
        set((s) => ({ undoStack: [{ platKey, temas: [...s[platKey].temas] }, ...s.undoStack].slice(0, 10) })),

      undo: () =>
        set((s) => {
          if (!s.undoStack.length) return {};
          const [snap, ...rest] = s.undoStack;
          return { [snap.platKey]: { ...s[snap.platKey], temas: snap.temas }, undoStack: rest };
        }),

      addSim: (platKey, sim) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            simulados: [...s[platKey].simulados, { questoesErradas: [], statusCorrecao: "pendente", porArea: [], ...sim, id: Date.now() }],
          },
        })),

      deleteSim: (platKey, id) =>
        set((s) => ({ [platKey]: { ...s[platKey], simulados: s[platKey].simulados.filter((x) => x.id !== id) } })),

      addQuestaoErrada: (platKey, simId, questao) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            simulados: s[platKey].simulados.map((sim) =>
              sim.id !== simId
                ? sim
                : {
                    ...sim,
                    questoesErradas: [...(sim.questoesErradas || []), { ...questao, id: Date.now() }],
                    statusCorrecao: "parcial",
                  }
            ),
          },
        })),

      marcarD7: (platKey, simId, questaoId, acertou) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            simulados: s[platKey].simulados.map((sim) => {
              if (sim.id !== simId) return sim;
              const qes = (sim.questoesErradas || []).map((q) => (q.id !== questaoId ? q : { ...q, corrigidaD7: acertou }));
              return {
                ...sim,
                questoesErradas: qes,
                statusCorrecao: qes.length > 0 && qes.every((q) => q.corrigidaD7 != null) ? "concluida" : "parcial",
              };
            }),
          },
        })),

      updateSim: (platKey, simId, fields) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            simulados: s[platKey].simulados.map((sim) => (sim.id !== simId ? { ...sim, ...fields } : sim)),
          },
        })),

      addReflexao: (platKey, temaId, reflexao) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            temas: s[platKey].temas.map((t) => (t.id !== temaId ? t : { ...t, reflexao: { ...reflexao, data: todayStr() } })),
          },
        })),

      addAnki: (platKey, log) =>
        set((s) => ({ [platKey]: { ...s[platKey], ankiLog: [...s[platKey].ankiLog, { ...log, id: Date.now() }] } })),

      addCronograma: (platKey, crono) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            cronogramas: [...(s[platKey].cronogramas || []), { ...crono, id: Date.now() }],
          },
        })),

      deleteCronograma: (platKey, id) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            cronogramas: (s[platKey].cronogramas || []).filter((c) => c.id !== id),
          },
        })),

      toggleBloco: (platKey, cronoId, semanaIdx, diaIdx, blocoIdx) =>
        set((s) => {
          const list = [...(s[platKey].cronogramas || [])];
          const ci = list.findIndex((c) => c.id === cronoId);
          if (ci === -1) return {};
          const crono = JSON.parse(JSON.stringify(list[ci]));
          const b = crono.semanas[semanaIdx]?.dias[diaIdx]?.blocos[blocoIdx];
          if (b) b.concluido = !b.concluido;
          list[ci] = crono;
          return { [platKey]: { ...s[platKey], cronogramas: list } };
        }),

      updateBlocoConteudo: (platKey, cronoId, semanaIdx, diaIdx, blocoIdx, conteudo) =>
        set((s) => {
          const list = [...(s[platKey].cronogramas || [])];
          const ci = list.findIndex((c) => c.id === cronoId);
          if (ci === -1) return {};
          const crono = JSON.parse(JSON.stringify(list[ci]));
          const b = crono.semanas[semanaIdx]?.dias[diaIdx]?.blocos[blocoIdx];
          if (b) b.conteudo = conteudo;
          list[ci] = crono;
          return { [platKey]: { ...s[platKey], cronogramas: list } };
        }),

      resetStore: () =>
        set({
          plat: "res",
          userName: "Estudante",
          meta: { dataProva: "2026-10-25", acerto: 85, metaDiaria: 0 },
          onboardingDone: false,
          focusMode: false,
          modoSimples: true,
          brainDumpD1Data: {},
          temaStats: {},
        }),
    }),
    {
      name: "reviewflow-v6",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        plat: s.plat,
        meta: s.meta,
        res: s.res,
        vest: s.vest,
        userName: s.userName,
        onboardingDone: s.onboardingDone,
        focusMode: s.focusMode,
        modoSimples: s.modoSimples,
        brainDumpD1Data: s.brainDumpD1Data,
        temaStats: s.temaStats,
      }),
      merge: (persisted, initial) => ({
        ...initial,
        ...persisted,
        res: { ...initial.res, ...(persisted.res || {}) },
        vest: { ...initial.vest, ...(persisted.vest || {}) },
        focusMode: persisted.focusMode ?? initial.focusMode,
        modoSimples: persisted.modoSimples ?? initial.modoSimples,
        brainDumpD1Data: persisted.brainDumpD1Data ?? initial.brainDumpD1Data,
        temaStats: persisted.temaStats ?? initial.temaStats,
      }),
    }
  )
);
