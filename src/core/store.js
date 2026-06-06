// src/core/store.js
// Zustand Store for central state management

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { buildRev, recalcAfterMark, STEPS, S_BASE, todayStr, addDays, normalizeTema, diffDays, getAreaPrior, getRetencaoArea, toRating } from "./fsrs";
import { computeStreakOnStudy, recoverStreak } from "./gamif";
import { createAction, sortActions } from "./actionInbox";
import { createSessionReflection } from "./sessionReflection";
import { getPeakPhase } from "./peakMode";
import { buildActionInboxFromDecisionCore, buildDecisionCoreSnapshot } from "./decisionCore";
import { appendLearningEvent, createLearningEvent, getTemaStatsFromLearningEvents } from "./learningEvent";
import { dominantErrorType } from "./errorTaxonomy";
import { getReadinessData } from "./readiness";
import { isExhaustionDetected } from "./mentor";
import { applyOnboardingChoice, getOnboardingDefaults, isOnboardingComplete } from "./onboarding";
import { getAnonymousStorageKey, getOrCreateAnonymousSessionId } from "./userScope";
import {
  applyDominioPrevioToTema,
  criarValidacaoDominioPrevio,
  isTemaNaoIniciado,
} from "./domainValidation";
import { agendarReencontro, clinicalCaseMatch } from "./illnessScript";
import { CASOS_CLINICOS } from "../constants/casosClinicos";

function prioToImportancia(prio) {
  switch ((prio || "").toLowerCase()) {
    case "diamante": return "CRITICA";
    case "alta":     return "ALTA";
    case "média": case "media": return "MEDIA";
    case "baixa": case "bônus": case "bonus": return "MEDIA";
    default: return "ALTA";
  }
}

const initialPlat = () => ({ temas: [], simulados: [], ankiLog: [], cronogramas: [], casosProgresso: {} });
const initialActionInboxState = () => ({ dismissed: {}, accepted: {}, done: {} });
const DEFAULT_PERSIST_SCOPE_KEY = getAnonymousStorageKey(getOrCreateAnonymousSessionId());

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

  const temas = temasData.map((t) => ({ ...t, rev: buildRev(t.d0, t.esp) }));
  return { temas, simulados: [], ankiLog: [], cronogramas: [], casosProgresso: {} };
};

export const TEMA_STATS_MIGRATION_FLAG = "migratedTemaStats";

function hasTemaStatsEntries(temaStats = {}) {
  return Object.values(temaStats || {}).some((logs) => Array.isArray(logs) && logs.length > 0);
}

function buildTemaLookup(state = {}) {
  const lookup = new Map();
  ["res", "vest"].forEach((platKey) => {
    (state[platKey]?.temas || []).forEach((tema) => {
      lookup.set(String(tema.id), { tema, plat: platKey });
    });
  });
  return lookup;
}

function stableMigrationEventId(topicId, index, stat = {}) {
  const stamp = stat.completedAt || stat.reviewedAt || stat.timestamp || stat.date || "sem-data";
  return `le_temaStats_${String(topicId).replace(/[^a-zA-Z0-9_-]/g, "_")}_${index}_${String(stamp).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32)}`;
}

export function migrateTemaStatsToLearningEventsState(state = {}) {
  const existingEvents = Array.isArray(state.learningEvents) ? state.learningEvents : [];
  const meta = { ...(state.meta || {}) };
  const shouldMigrate = existingEvents.length === 0
    && meta[TEMA_STATS_MIGRATION_FLAG] !== true
    && hasTemaStatsEntries(state.temaStats);

  if (!shouldMigrate) {
    return { ...state, learningEvents: existingEvents, meta };
  }

  const lookup = buildTemaLookup(state);
  const fallbackPlat = state.plat || "res";
  const migratedEvents = [];

  Object.entries(state.temaStats || {}).forEach(([topicId, logs]) => {
    if (!Array.isArray(logs)) return;
    const found = lookup.get(String(topicId)) || {};
    logs.forEach((stat, index) => {
      if (!stat || typeof stat !== "object") return;
      migratedEvents.push(createLearningEvent({
        id: stableMigrationEventId(topicId, index, stat),
        source: "review",
        topicId,
        topicName: found.tema?.nome || stat.topicName || "",
        area: found.tema?.esp || found.tema?.area || stat.area || "",
        plat: stat.plat || found.plat || fallbackPlat,
        stepKey: stat.stepKey || stat.key || stat.step || null,
        date: stat.date || stat.completedAt?.slice?.(0, 10) || stat.reviewedAt?.slice?.(0, 10),
        timestamp: stat.completedAt || stat.reviewedAt || stat.timestamp || stat.date,
        officialSchedulingImpact: stat.officialSchedulingImpact !== false,
        performance: {
          acerto: stat.acerto ?? stat.accuracy ?? null,
          previsao: stat.previsao ?? null,
          questoes: stat.questoes ?? stat.questions ?? null,
          rating: stat.rating ?? null,
        },
        regulation: {
          confianca: stat.confianca ?? null,
          ansiedade: stat.ansiedade ?? null,
          cansaco: stat.cansaco ?? null,
          foco: stat.foco ?? null,
          tempoMin: stat.tempoMin ?? null,
        },
        errors: {
          motivosErro: Array.isArray(stat.motivosErro) ? stat.motivosErro : [],
          dominantError: stat.dominantError ?? dominantErrorType(stat.erros || stat.motivosErro || []) ?? null,
        },
        tags: ["migrated_temaStats"],
        meta: {
          migratedFrom: "temaStats",
          legacyIndex: index,
          legacyCompletedAt: stat.completedAt || null,
          S: stat.S ?? stat.stability ?? null,
          D: stat.D ?? stat.difficulty ?? null,
        },
      }));
    });
  });

  return {
    ...state,
    learningEvents: migratedEvents.slice(-1000),
    meta: {
      ...meta,
      [TEMA_STATS_MIGRATION_FLAG]: true,
    },
  };
}

const timestampMiddleware = (config) => (set, get, api) => {
  const newSet = (entropy, replace) => {
    const current = get();
    const nextState = typeof entropy === "function" ? entropy(current) : entropy;

    const hasDataKeys = nextState && Object.keys(nextState).some((key) =>
      [
        "res",
        "vest",
        "meta",
        "userName",
        "userEmail",
        "onboardingDone",
        "brainDumpD1Data",
        "temaStats",
        "vistos",
        "cronogramaSel",
        "calendarProvider",
        "gamif",
        "enamedAnalises",
        "actionInboxState",
        "sessionReflections",
        "weeklyReviews",
        "sprint",
        "learningEvents",
      ].includes(key)
    );

    if (hasDataKeys && (!nextState || !nextState.hasOwnProperty("updatedAt"))) {
      set({ ...nextState, updatedAt: Date.now() }, replace);
    } else {
      set(nextState, replace);
    }
  };
  return config(newSet, get, api);
};

function getDoneReviewsForMentor(temas = []) {
  return temas
    .flatMap((tema) => STEPS.map((step) => {
      const review = tema.rev?.[step.key];
      if (!review) return null;
      return {
        ...review,
        esp: tema.esp,
        step,
        temaNome: tema.nome,
        temaId: tema.id,
      };
    }))
    .filter((review) =>
      review?.done
      && !review.skipped
      && review.skipReason !== "dominio_previo"
      && !review.skippeadoPorDominio
    );
}

function hasLowEnergySignal(state = {}) {
  const recentReflection = [...(state.sessionReflections || [])].reverse()
    .find((reflection) => reflection?.date);
  if (recentReflection?.mainIssue === "energia" || recentReflection?.nextAdjustment === "descanso") {
    return true;
  }

  const recentStat = Object.values(getLearningTemaStats(state))
    .flat()
    .filter((stat) => stat?.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];

  return String(recentStat?.cansaco || "").toLowerCase().startsWith("alt");
}

function getLearningTemaStats(state = {}, plat = state.plat || "res") {
  return getTemaStatsFromLearningEvents(state.learningEvents || [], {
    plat,
    fallbackTemaStats: state.temaStats || {},
  });
}

function buildDecisionSnapshotOptions(state = {}, today = todayStr()) {
  const plat = state.plat || "res";
  const platState = state[plat] || {};
  const temas = platState.temas || [];
  const simulados = platState.simulados || [];
  const meta = state.meta || {};
  const doneReviews = getDoneReviewsForMentor(temas);
  const readinessTemas = temas.map((tema) => ({
    ...tema,
    esp: tema.esp || tema.area || "",
  }));

  return {
    today,
    readinessData: getReadinessData({
      temas: readinessTemas,
      simulados,
      meta,
      plat,
      temaStats: getLearningTemaStats(state, plat),
    }),
    lowEnergy: hasLowEnergySignal(state),
    exhaustionDetected: isExhaustionDetected(getLearningTemaStats(state, plat), doneReviews),
  };
}

export const useStore = create(
  persist(
    timestampMiddleware(
      (set, get) => ({
        plat: "res",
        cronogramaSel: { res: "res-medcof-2026", vest: "vest-base" },
      calendarProvider: {
        activeId: "medcof",
        importedTopics: [],
        customTopics: [],
      },
      userName: "Estudante",
      userEmail: "",
      meta: { dataProva: "2026-09-13", acerto: 85, retencaoFSRS: 0.90, maxRevisoesDia: 30, tempoDisponivel: 2, intervaloMaxDias: 180, pausadoAte: null, isRetornoAcolhedor: false, lastActiveDate: null, provasAlvo: ["ENAMED"], isSegundaTentativa: false, areaPuxouBaixo: "", notasTentativaAnterior: {}, acertosAlvo: 0, totalQuestoesAlvo: 100, notaCorteAlvo: 0, streakFreezeAvailable: true, streakFreezeUsed: false, tomMentor: "gentil", estrategiaRefinada: false, metaQuestoesDia: 0, metaQuestoesTotal: 0, volumePorAreaModo: "fraqueza", mentorLog: [], ferramentas: { questoes: "MedEvo", flashcards: "Anki" }, metodoProgresso: {}, dicasVistas: [], notif: { enabled: false, hora: "08:00" }, prontidaoHist: [], ativacaoDispensada: false, trilhaDispensada: false, trilhaXpDados: {}, streakMaxAvisado: false, lastFocusSessionAt: null, lastReflectionAt: null, peakModePhase: "base", ankiAdesao: { datas: [] }, modulos: { raciocinioClinico: false }, onboarding: getOnboardingDefaults(), vestibularStart: { completed: false, targetExam: null, examDate: null, baselineMode: null, planMode: "mentor", completedAt: null }, temasPerWeek: 6, estrategiaStartDate: null },
      res: initialPlat(),
      vest: initialVestibularPlat(),
      undoStack: [],
      onboardingDone: false,
      sprint: { esps: [], ativa: false, semana: "" },
      gamif: {
        xp: 0,
        level: 1,
        streakCurrent: 0,
        streakBest: 0,
        lastStudyDate: null,
        freezesOwned: 1,
        freezesUsedDates: [],
        recoveryOwned: 0,
        badges: [],
        graceUsedThisWeek: false,
        focusBoostActive: false,
        xpAudit: { acertos: 0, constancia: 0, outros: 0 }
      },
      toast: null,
      confirmDialog: null,

      // ==================================================
      focusMode: false,
      modoSimples: true,
      mentorMode: true,
      modoProva: false,
      enamedAnalises: [],
      actionInbox: [],
      actionInboxState: initialActionInboxState(),
      decisionSnapshot: null,
      sessionReflections: [],
      weeklyReviews: [],
      learningEvents: [],
      brainDumpD1Data: {},
      temaStats: {},
      vistos: [],
      tourStep: null,
      setPlat: (p) => set({ plat: p }),
      setCronogramaSel: (platKey, id) => set((s) => ({ cronogramaSel: { ...s.cronogramaSel, [platKey]: id } })),
      setCalendarProvider: (providerId) =>
        set((s) => ({
          calendarProvider: {
            ...(s.calendarProvider || { activeId: "medcof", importedTopics: [], customTopics: [] }),
            activeId: providerId,
          },
        })),
      saveImportedCalendarTopics: (topics = []) =>
        set((s) => ({
          calendarProvider: {
            ...(s.calendarProvider || { activeId: "medcof", importedTopics: [], customTopics: [] }),
            importedTopics: Array.isArray(topics) ? topics : [],
          },
        })),
      saveCustomCalendarTopics: (topics = []) =>
        set((s) => ({
          calendarProvider: {
            ...(s.calendarProvider || { activeId: "medcof", importedTopics: [], customTopics: [] }),
            customTopics: Array.isArray(topics) ? topics : [],
          },
        })),
      setUserName: (name) => set({ userName: name }),
      setUserEmail: (email) => set({ userEmail: email }),
      setMeta: (meta) => set({ meta }),
      toggleModulo: (nome, valor) => set((s) => ({
        meta: {
          ...s.meta,
          modulos: {
            ...(s.meta?.modulos || {}),
            [nome]: valor,
          },
        },
      })),
      setModoProva: (modoProva) => set({ modoProva }),
      setOnboardingDone: () =>
        set((state) => ({
          onboardingDone: true,
          meta: {
            ...state.meta,
            onboarding: applyOnboardingChoice(state.meta, { completed: true }),
          },
        })),
      completeOnboarding: (choice = {}) =>
        set((state) => {
          const onboarding = applyOnboardingChoice(state.meta, { ...choice, completed: true });
          return {
            onboardingDone: true,
            mentorMode: onboarding.mentorMode === true,
            meta: {
              ...state.meta,
              modulos: {
                ...(state.meta?.modulos || {}),
                raciocinioClinico: onboarding.modules?.raciocinioClinico === true,
              },
              onboarding,
            },
          };
        }),
      resetOnboarding: () =>
        set((state) => ({
          onboardingDone: false,
          meta: {
            ...state.meta,
            onboarding: getOnboardingDefaults({}),
          },
        })),
      // ── Onboarding v2 ───────────────────────────────────────────────────────
      setOnboardingTrack: (track) =>
        set((state) => ({
          plat: track === "vest" ? "vest" : "res",
          meta: {
            ...state.meta,
            onboarding: {
              ...(state.meta?.onboarding || getOnboardingDefaults({})),
              track,
              version: 2,
            },
          },
        })),
      completePlanSetup: (planSetup = {}, scheduledTopics = []) =>
        set((state) => ({
          calendarProvider: {
            ...(state.calendarProvider || { activeId: "medcof", importedTopics: [], customTopics: [] }),
            scheduledTopics: Array.isArray(scheduledTopics) ? scheduledTopics : [],
          },
          meta: {
            ...state.meta,
            planSetup: {
              ...planSetup,
              completedAt: planSetup.completedAt || new Date().toISOString().slice(0, 10),
            },
            onboarding: {
              ...(state.meta?.onboarding || getOnboardingDefaults({})),
              version: 2,
              completed: true,
              completedAt: state.meta?.onboarding?.completedAt || new Date().toISOString().slice(0, 10),
            },
          },
          onboardingDone: true,
        })),
      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
      toggleModoSimples: () => set((state) => ({ modoSimples: !state.modoSimples })),
      toggleMentorMode: () => set((state) => ({ mentorMode: !state.mentorMode })),
      registrarAnaliseEnamed: (analise) =>
        set((s) => ({
          enamedAnalises: [...(s.enamedAnalises || []), { ...analise, id: Date.now() }],
        })),
      upsertAction: (actionInput) =>
        set((s) => {
          const normalized = createAction(actionInput);
          const filtered = (s.actionInbox || []).filter((action) => action.id !== normalized.id);
          return { actionInbox: sortActions([...filtered, normalized]) };
        }),
      markActionDone: (actionId) =>
        set((s) => ({
          actionInbox: (s.actionInbox || []).filter((action) => action.id !== actionId),
          actionInboxState: {
            ...(s.actionInboxState || initialActionInboxState()),
            done: {
              ...((s.actionInboxState || initialActionInboxState()).done || {}),
              [actionId]: todayStr(),
            },
          },
        })),
      dismissAction: (actionId) =>
        set((s) => ({
          actionInbox: (s.actionInbox || []).filter((action) => action.id !== actionId),
          actionInboxState: {
            ...(s.actionInboxState || initialActionInboxState()),
            dismissed: {
              ...((s.actionInboxState || initialActionInboxState()).dismissed || {}),
              [actionId]: todayStr(),
            },
          },
        })),
      acceptAction: (actionId) =>
        set((s) => ({
          actionInbox: (s.actionInbox || []).map((action) => (action.id === actionId ? { ...action, status: "accepted" } : action)),
          actionInboxState: {
            ...(s.actionInboxState || initialActionInboxState()),
            accepted: {
              ...((s.actionInboxState || initialActionInboxState()).accepted || {}),
              [actionId]: todayStr(),
            },
          },
        })),
      addSessionReflection: (input) =>
        set((s) => {
          const normalized = createSessionReflection(input);
          const nextReflections = [...(s.sessionReflections || []), normalized].slice(-400);
          const nextEvents = appendLearningEvent(s.learningEvents || [], {
            source: "session_reflection",
            topicName: normalized.tema || null,
            area: normalized.area || null,
            plat: s.plat || "res",
            date: normalized.date,
            officialSchedulingImpact: false,
            confianca: normalized.confidence,
            dominantError: normalized.mainIssue === "nenhum" ? null : normalized.mainIssue,
            tags: [normalized.outcome, normalized.nextAdjustment].filter(Boolean),
            meta: {
              reflectionId: normalized.id,
              outcome: normalized.outcome,
              mainIssue: normalized.mainIssue,
              nextAdjustment: normalized.nextAdjustment,
              note: normalized.note,
            },
          }, 1000);
          const today = todayStr();
          const decisionState = {
            ...s,
            sessionReflections: nextReflections,
            learningEvents: nextEvents,
          };
          const decisionOptions = buildDecisionSnapshotOptions(decisionState, today);
          const decisionSnapshot = buildDecisionCoreSnapshot(decisionState, decisionOptions);
          const nextInbox = buildActionInboxFromDecisionCore(decisionState, { ...decisionOptions, snapshot: decisionSnapshot });

          return {
            sessionReflections: nextReflections,
            learningEvents: nextEvents,
            actionInbox: nextInbox,
            decisionSnapshot,
            meta: {
              ...s.meta,
              lastReflectionAt: normalized.date,
            },
          };
        }),
      saveWeeklyReview: (reviewInput = {}) =>
        set((s) => {
          const normalized = {
            ...reviewInput,
            id: reviewInput.id || `wr_${todayStr()}_${Date.now()}`,
            date: reviewInput.date || todayStr(),
          };
          const weeklyReviews = [...(s.weeklyReviews || []).filter((item) => item.id !== normalized.id), normalized].slice(-52);
          return { weeklyReviews };
        }),
      rebuildActionInboxForToday: () =>
        set((s) => {
          const today = todayStr();
          const decisionOptions = buildDecisionSnapshotOptions(s, today);
          const decisionSnapshot = buildDecisionCoreSnapshot(s, decisionOptions);
          const nextInbox = buildActionInboxFromDecisionCore(s, { ...decisionOptions, snapshot: decisionSnapshot });
          const phase = getPeakPhase({ examDate: s.meta?.dataProva, today });

          return {
            actionInbox: nextInbox,
            decisionSnapshot,
            meta: {
              ...s.meta,
              peakModePhase: phase,
            },
          };
        }),
      rebuildDecisionSnapshot: () =>
        set((s) => {
          const today = todayStr();
          const decisionOptions = buildDecisionSnapshotOptions(s, today);
          return {
            decisionSnapshot: buildDecisionCoreSnapshot(s, decisionOptions),
          };
        }),
      adicionarVisto: (id) => set((state) => {
        if (state.vistos?.includes(id)) return {};
        return { vistos: [...(state.vistos || []), id] };
      }),
      setTourStep: (step) => set({ tourStep: step }),
      showToast: (msg, opts = {}) =>
        set({
          toast: {
            msg,
            undo: !!opts.undo,
            ms: opts.ms || 5000,
          },
        }),
      dismissToast: () => set({ toast: null }),
      openConfirm: ({ title = "Confirmar ação", message, onConfirm, confirmLabel = "Confirmar", cancelLabel = "Cancelar", danger = false }) =>
        set({
          confirmDialog: {
            title,
            message,
            onConfirm,
            confirmLabel,
            cancelLabel,
            danger,
          },
        }),
      closeConfirm: () => set({ confirmDialog: null }),
      useStreakFreeze: () => set((state) => ({ meta: { ...state.meta, streakFreezeAvailable: false, streakFreezeUsed: true } })),
      resetStreakFreeze: () => set((state) => ({ meta: { ...state.meta, streakFreezeAvailable: true, streakFreezeUsed: false } })),

      addXp: (amount, source = "outros") => set((s) => {
        const currentGamif = s.gamif || { xp: 0, level: 1, streakCurrent: 0, streakBest: 0, freezesOwned: 1, freezesUsedDates: [], recoveryOwned: 0, badges: [], graceUsedThisWeek: false, xpAudit: { acertos: 0, constancia: 0, outros: 0 } };
        const newXp = (currentGamif.xp || 0) + amount;
        const newLevel = Math.floor(Math.sqrt(newXp / 50)) + 1;
        
        const xpAudit = currentGamif.xpAudit ? { ...currentGamif.xpAudit } : { acertos: 0, constancia: 0, outros: 0 };
        xpAudit[source] = (xpAudit[source] || 0) + amount;

        return {
          gamif: {
            ...currentGamif,
            xp: newXp,
            level: newLevel,
            xpAudit
          }
        };
      }),
      buyItem: (itemKey, costXp, reqLevel) => set((s) => {
        const currentGamif = s.gamif || { xp: 0, level: 1, streakCurrent: 0, streakBest: 0, freezesOwned: 1, freezesUsedDates: [], recoveryOwned: 0, badges: [], graceUsedThisWeek: false, xpAudit: { acertos: 0, constancia: 0, outros: 0 } };
        if (itemKey === "freeze" && (currentGamif.freezesOwned || 0) >= 2) return {};
        if ((currentGamif.xp || 0) < costXp || (currentGamif.level || 1) < reqLevel) return {};
        const g = { ...currentGamif };
        g.xp = (g.xp || 0) - costXp;
        if (itemKey === "freeze") {
          g.freezesOwned = Math.min(2, (g.freezesOwned || 0) + 1);
        } else if (itemKey === "recovery") {
          g.recoveryOwned = (g.recoveryOwned || 0) + 1;
        } else if (itemKey === "boost") {
          g.focusBoostActive = true;
        }
        return { gamif: g };
      }),
      useRecovery: () => set((s) => {
        const currentGamif = s.gamif || { xp: 0, level: 1, streakCurrent: 0, streakBest: 0, freezesOwned: 1, freezesUsedDates: [], recoveryOwned: 0, badges: [], graceUsedThisWeek: false };
        const g = recoverStreak(currentGamif);
        return { gamif: g };
      }),
      updateGamifStreak: (todayStrVal) => set((s) => {
        const currentGamif = s.gamif || { xp: 0, level: 1, streakCurrent: 0, streakBest: 0, freezesOwned: 1, freezesUsedDates: [], recoveryOwned: 0, badges: [], graceUsedThisWeek: false };
        const g = computeStreakOnStudy(currentGamif, todayStrVal);
        return { gamif: g };
      }),

      autoCatchUp: () => set((s) => {
        const hoje = todayStr();
        const lastActive = s.meta.lastActiveDate;
        
        if (!lastActive) {
          return {
            meta: {
              ...s.meta,
              lastActiveDate: hoje
            }
          };
        }

        const diasAusente = diffDays(lastActive, hoje);
        if (diasAusente < 2) {
          return {
            meta: {
              ...s.meta,
              lastActiveDate: hoje
            }
          };
        }

        const rebalancePlat = (platKey) => {
          const temas = s[platKey].temas || [];
          if (temas.length === 0) return temas;
          
          const overdueSteps = [];
          temas.forEach(t => {
            if (t.unstarted) return;
            Object.keys(t.rev || {}).forEach(k => {
              const r = t.rev[k];
              if (r && !r.done && r.date < hoje) {
                overdueSteps.push({ temaId: t.id, stepKey: k, origDate: r.date });
              }
            });
          });

          if (overdueSteps.length === 0) return temas;

          overdueSteps.sort((a, b) => (a.origDate < b.origDate ? -1 : 1));

          const cap = s.meta.maxRevisoesDia || 30;
          let currentDayOffset = 0;
          let currentDayCount = 0;

          const getScheduledCount = (dateStr, list) => {
            let count = 0;
            list.forEach(t => {
              if (t.unstarted) return;
              Object.keys(t.rev || {}).forEach(k => {
                if (t.rev[k]?.date === dateStr && !t.rev[k]?.done) count++;
              });
            });
            return count;
          };

          const newTemas = temas.map(t => ({ ...t, rev: { ...t.rev } }));

          overdueSteps.forEach(stepRef => {
            while (true) {
              const targetDate = addDays(hoje, currentDayOffset);
              const alreadyScheduled = getScheduledCount(targetDate, newTemas) + currentDayCount;
              
              if (alreadyScheduled < cap) {
                const temaIndex = newTemas.findIndex(t => t.id === stepRef.temaId);
                if (temaIndex !== -1) {
                  newTemas[temaIndex].rev[stepRef.stepKey] = {
                    ...newTemas[temaIndex].rev[stepRef.stepKey],
                    date: targetDate
                  };
                }
                currentDayCount++;
                break;
              } else {
                currentDayOffset++;
                currentDayCount = 0;
              }
            }
          });

          return newTemas;
        };

        return {
          meta: {
            ...s.meta,
            lastActiveDate: hoje,
            isRetornoAcolhedor: true
          },
          res: {
            ...s.res,
            temas: rebalancePlat("res")
          },
          vest: {
            ...s.vest,
            temas: rebalancePlat("vest")
          }
        };
      }),

      iniciarFerias: (dias) => set((s) => {
        const hoje = todayStr();
        const diasNum = parseInt(dias, 10);
        if (isNaN(diasNum) || diasNum <= 0) return {};

        const shiftPlatTemas = (platKey) => {
          const temas = s[platKey].temas || [];
          return temas.map(t => {
            if (t.unstarted) return t;
            const nr = { ...t.rev };
            Object.keys(nr).forEach(k => {
              if (!nr[k].done && nr[k].date) {
                if (nr[k].date >= hoje) {
                  nr[k] = {
                    ...nr[k],
                    date: addDays(nr[k].date, diasNum)
                  };
                }
              }
            });
            return { ...t, rev: nr };
          });
        };

        const g = { ...s.gamif };
        if (g.lastStudyDate && g.lastStudyDate >= hoje) {
          g.lastStudyDate = addDays(g.lastStudyDate, diasNum);
        } else if (g.lastStudyDate) {
          g.lastStudyDate = addDays(hoje, diasNum - 1);
        }

        return {
          meta: {
            ...s.meta,
            pausadoAte: addDays(hoje, diasNum)
          },
          gamif: g,
          res: { ...s.res, temas: shiftPlatTemas("res") },
          vest: { ...s.vest, temas: shiftPlatTemas("vest") }
        };
      }),

      cancelarPausa: () => set((s) => {
        const hoje = todayStr();
        if (!s.meta.pausadoAte || s.meta.pausadoAte < hoje) {
          return { meta: { ...s.meta, pausadoAte: null } };
        }
        const diasRestantes = diffDays(hoje, s.meta.pausadoAte);
        if (diasRestantes <= 0) {
          return { meta: { ...s.meta, pausadoAte: null } };
        }

        const pullPlatTemas = (platKey) => {
          const temas = s[platKey].temas || [];
          return temas.map(t => {
            if (t.unstarted) return t;
            const nr = { ...t.rev };
            Object.keys(nr).forEach(k => {
              if (!nr[k].done && nr[k].date) {
                nr[k] = {
                  ...nr[k],
                  date: addDays(nr[k].date, -diasRestantes)
                };
              }
            });
            return { ...t, rev: nr };
          });
        };

        const g = { ...s.gamif };
        if (g.lastStudyDate) {
          g.lastStudyDate = addDays(g.lastStudyDate, -diasRestantes);
        }

        return {
          meta: {
            ...s.meta,
            pausadoAte: null
          },
          gamif: g,
          res: { ...s.res, temas: pullPlatTemas("res") },
          vest: { ...s.vest, temas: pullPlatTemas("vest") }
        };
      }),

      setBrainDumpD1: (temaId, data) =>
        set((state) => ({
          brainDumpD1Data: {
            ...state.brainDumpD1Data,
            [temaId]: { ...data, timestamp: new Date() },
          },
        })),

      // DEPRECATED: temaStats e mantido apenas para leitura/migracao legada.
      addTemaStats: () => undefined,
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
                parentTopic: null,
                ...tema,
                id: tema.id || Date.now(), // Fixed the bug: preserve ID if provided
                importancia: tema.importancia || "ALTA",
                ankiDeck: tema.ankiDeck || "",
                rev: buildRev(tema.d0, tema.esp),
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
            const prior = getAreaPrior(fields.esp || old.esp);
            newRev = buildRev(fields.d0, fields.esp || old.esp);
            STEPS.forEach((step) => {
              newRev[step.key].done = old.rev?.[step.key]?.done ?? false;
              newRev[step.key].acerto = old.rev?.[step.key]?.acerto ?? null;
              newRev[step.key].questoes = old.rev?.[step.key]?.questoes ?? null;
              newRev[step.key].S = old.rev?.[step.key]?.S ?? S_BASE[step.key];
              newRev[step.key].D = old.rev?.[step.key]?.D ?? prior.difBase;
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

      iniciarValidacaoDominioPrevio: (platKey, temaId) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            temas: s[platKey].temas.map((t) => {
              if (t.id !== temaId) return t;
              if (!isTemaNaoIniciado(t)) return t;
              return {
                ...t,
                dominioPrevio: criarValidacaoDominioPrevio(),
              };
            }),
          },
        })),

      finalizarValidacaoDominioPrevio: (platKey, temaId, { questoes, acertos }) => {
        let result = null;
        set((s) => {
          let validatedTema = null;
          const temasAtualizados = s[platKey].temas.map((t) => {
            if (t.id !== temaId) return t;
            validatedTema = applyDominioPrevioToTema(t, { questoes, acertos });
            result = validatedTema?.dominioPrevio || null;
            return validatedTema;
          });

          // Parte E — "Já domino" com raciocínio clínico intercalado.
          // Se o módulo está ligado e há um caso casado ao tema, semeia um
          // re-encontro clínico em casosProgresso (que já alimenta o action
          // inbox "clinical_case"). Fallback seguro: sem módulo OU sem caso
          // casado, nada é semeado e o comportamento é o skip simples atual.
          let casosProgresso = s[platKey].casosProgresso || {};
          if (validatedTema?.status === "validado_previo" && s.meta?.modulos?.raciocinioClinico) {
            const caso = clinicalCaseMatch(validatedTema, CASOS_CLINICOS);
            if (caso?.id && !casosProgresso[caso.id]) {
              const pct = Number.isFinite(Number(validatedTema.dominioPrevio?.percentual))
                ? Number(validatedTema.dominioPrevio.percentual)
                : (Number(questoes) > 0 ? Math.round((Number(acertos) / Number(questoes)) * 100) : 0);
              const seed = agendarReencontro({}, pct);
              casosProgresso = {
                ...casosProgresso,
                [caso.id]: {
                  casoId: caso.id,
                  temaId: validatedTema.id,
                  temaNome: validatedTema.nome,
                  origem: "ja_domino",
                  S: seed.S,
                  intervalo: seed.intervalo,
                  proximaData: seed.proximaData,
                  vistos: 0,
                  criadoEm: todayStr(),
                },
              };
            }
          }

          return {
            [platKey]: {
              ...s[platKey],
              temas: temasAtualizados,
              casosProgresso,
            },
          };
        });
        const rebuild = get().rebuildActionInboxForToday;
        if (typeof rebuild === "function") rebuild();
        return result;
      },

      cancelarValidacaoDominioPrevio: (platKey, temaId) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            temas: s[platKey].temas.map((t) => {
              if (t.id !== temaId) return t;
              const dp = t.dominioPrevio || {};
              if (dp.status !== "validacao_pendente") return t;
              return {
                ...t,
                dominioPrevio: {
                  status: "nao_avaliado",
                  iniciadoEm: null,
                  validadoEm: null,
                  metodo: "ja_domino",
                  questoesAlvo: dp.questoesAlvo || 15,
                  total: null,
                  acertos: null,
                  percentual: null,
                  intervaloInicial: null,
                  proximaRevisao: null,
                  observacao: null,
                },
              };
            }),
          },
        })),

      validarDominio: (platKey, temaId, { questoes, acertos }) =>
        get().finalizarValidacaoDominioPrevio(platKey, temaId, { questoes, acertos }),

      markStep: (platKey, temaId, stepKey, { acerto, previsao, questoes, motivosErro, erros, tempoMin, ansiedade, cansaco, confianca, dificuldade, foco, c1, c2, c3, c4, c5, modoReduzido, descansoPrescrito, interleaved, interleavingStatus, interleavingPlan }) =>
        set((s) => {
          const reviewedAt = todayStr();
          let relapsedTema = null;
          let topicName = "";
          let area = "";
          const temasAtualizados = s[platKey].temas.map((t) => {
            if (t.id !== temaId) return t;
            topicName = t.nome;
            area = t.esp;
            const currentStep = t.rev?.[stepKey] || {};
            const revMarked = {
              ...t.rev,
              meta: {
                ...(t.rev?.meta || {}),
                importancia: t.importancia,
              },
              [stepKey]: {
                ...currentStep,
                done: true,
                acerto,
                previsao,
                questoes,
                reviewedAt,
                completedAt: reviewedAt,
                scheduledAt: currentStep.scheduledAt || currentStep.date || reviewedAt,
                motivosErro: motivosErro || [],
                erros: erros || [],
                tempoMin: tempoMin ?? currentStep.tempoMin,
                ansiedade: ansiedade ?? currentStep.ansiedade,
                cansaco: cansaco ?? currentStep.cansaco,
                confianca: confianca ?? currentStep.confianca,
                dificuldade: dificuldade ?? currentStep.dificuldade,
                foco: foco ?? currentStep.foco,
                c1: c1 ?? currentStep.c1,
                c2: c2 ?? currentStep.c2,
                c3: c3 ?? currentStep.c3,
                c4: c4 ?? currentStep.c4,
                c5: c5 ?? currentStep.c5,
                modoReduzido: modoReduzido ?? currentStep.modoReduzido,
                descansoPrescrito: descansoPrescrito ?? currentStep.descansoPrescrito,
                interleaved: !!interleaved,
                interleavingStatus: interleavingStatus || interleavingPlan?.status || null,
                interleavingCandidateIds: Array.isArray(interleavingPlan?.candidates)
                  ? interleavingPlan.candidates.map((c) => c.temaId).filter(Boolean).slice(0, 5)
                  : [],
              },
            };
            const desiredRetention = getRetencaoArea(t.esp, s.meta?.retencaoFSRS ?? 0.90);
            const maxInterval = s.meta?.intervaloMaxDias ?? 180;
            const updated = { ...t, rev: recalcAfterMark(revMarked, stepKey, acerto, desiredRetention, maxInterval, t.esp, { tema: t }) };
            // G4: relapso de tema maduro com protocolo dirigido → marca p/ semear caso clínico.
            if (updated.rev?.relearning?.protocol?.clinicalCaseNext) {
              relapsedTema = updated;
            }
            return updated;
          });

          // G4: ao relapsar um tema maduro (<60%), agenda um re-encontro clínico próximo
          // (reusa a malha casosProgresso/action-inbox). Fallback seguro: sem módulo OU
          // sem caso casado, só o relapso FSRS + Brain Dump acontece (nada é semeado).
          let casosProgresso = s[platKey].casosProgresso || {};
          if (relapsedTema && s.meta?.modulos?.raciocinioClinico) {
            const caso = clinicalCaseMatch(relapsedTema, CASOS_CLINICOS);
            if (caso?.id && !casosProgresso[caso.id]) {
              const pct = Number.isFinite(Number(acerto))
                ? Math.round((Number(acerto) <= 1 ? Number(acerto) * 100 : Number(acerto)))
                : 0;
              const seed = agendarReencontro({}, pct);
              casosProgresso = {
                ...casosProgresso,
                [caso.id]: {
                  casoId: caso.id,
                  temaId: relapsedTema.id,
                  temaNome: relapsedTema.nome,
                  origem: "lapso",
                  S: seed.S,
                  intervalo: seed.intervalo,
                  proximaData: seed.proximaData,
                  vistos: 0,
                  criadoEm: reviewedAt,
                },
              };
            }
          }

          const nextEvents = appendLearningEvent(s.learningEvents || [], {
            source: "review",
            topicId: temaId,
            topicName,
            area,
            plat: platKey,
            stepKey,
            date: reviewedAt,
            officialSchedulingImpact: true,
            acerto,
            previsao,
            questoes,
            rating: toRating(acerto),
            confianca,
            ansiedade,
            cansaco,
            foco,
            tempoMin,
            motivosErro: motivosErro || [],
            dominantError: dominantErrorType([
              ...(erros || []),
              ...(motivosErro || []).map((tipoErro) => ({ tipoErro, acertou: false }))
            ])
          }, 1000);

          return {
            [platKey]: {
              ...s[platKey],
              temas: temasAtualizados,
              casosProgresso,
            },
            learningEvents: nextEvents,
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
                importancia: prioToImportancia(it.prio),
                obs: "MEDCOF 2026",
                pico: "",
                ankiDeck: "",
                d0,
                rev: buildRev(d0, it.esp),
              })),
            ],
          },
        })),

      optimize: (platKey) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            temas: s[platKey].temas.map((t) => {
              if (t.unstarted) return t;
              const nr = { ...t.rev };

              const firstUndoneStepIdx = STEPS.findIndex(
                (step) => nr[step.key] && !nr[step.key].done && nr[step.key].date <= todayStr()
              );

              if (firstUndoneStepIdx !== -1) {
                const firstStep = STEPS[firstUndoneStepIdx];
                if (nr[firstStep.key].date < todayStr()) {
                  nr[firstStep.key] = {
                    ...nr[firstStep.key],
                    date: todayStr(),
                  };
                }

                let prevDate = nr[firstStep.key].date;
                for (let i = firstUndoneStepIdx + 1; i < STEPS.length; i++) {
                  const step = STEPS[i];
                  const prevStep = STEPS[i - 1];
                  const minInterval = step.offset - prevStep.offset;

                  if (nr[step.key] && !nr[step.key].done) {
                    const minDate = addDays(prevDate, minInterval);
                    if (nr[step.key].date < minDate) {
                      nr[step.key] = {
                        ...nr[step.key],
                        date: minDate,
                      };
                    }
                    prevDate = nr[step.key].date;
                  }
                }
              }
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
        set((s) => {
          const newSim = { questoesErradas: [], statusCorrecao: "pendente", porArea: [], ...sim, id: Date.now() };
          let updatedTemas = [...s[platKey].temas];
          const hoje = todayStr();

          const erradas = newSim.questoesErradas || [];
          erradas.forEach(q => {
            const subtopicoStr = q.subtopico || q.enunciado || q.esp || "Geral";
            const areaStr = q.esp || q.area || q.materia || "Clínica Médica";

            const existIndex = updatedTemas.findIndex(t => 
              t.nome.toLowerCase() === subtopicoStr.toLowerCase()
            );

            if (existIndex !== -1) {
              const oldTema = updatedTemas[existIndex];
              const newRev = buildRev(hoje, oldTema.esp);
              updatedTemas[existIndex] = normalizeTema({
                ...oldTema,
                d0: hoje,
                rev: newRev
              });
            } else {
              const newTema = normalizeTema({
                id: Date.now() + Math.random(),
                nome: subtopicoStr,
                esp: areaStr,
                prio: "Alta",
                importancia: "ALTA",
                d0: hoje,
                rev: buildRev(hoje, areaStr),
                parentTopic: null,
                ankiDeck: "",
                obs: `Auto-gerado via erro em simulado (${q.tipoErro || "Geral"})`
              });
              updatedTemas.push(newTema);
            }
          });

          return {
            [platKey]: {
              ...s[platKey],
              simulados: [...s[platKey].simulados, newSim],
              temas: updatedTemas
            }
          };
        }),

      deleteSim: (platKey, id) =>
        set((s) => ({ [platKey]: { ...s[platKey], simulados: s[platKey].simulados.filter((x) => x.id !== id) } })),

      addQuestaoErrada: (platKey, simId, questao) =>
        set((s) => {
          const simMap = s[platKey].simulados.map((sim) =>
            sim.id !== simId
              ? sim
              : {
                  ...sim,
                  questoesErradas: [...(sim.questoesErradas || []), { ...questao, id: Date.now() }],
                  statusCorrecao: "parcial",
                }
          );

          const subtopicoStr = questao.subtopico || questao.enunciado || "Geral";
          const areaStr = questao.area || questao.materia || "Clínica Médica";

          const existIndex = s[platKey].temas.findIndex(t => 
            t.nome.toLowerCase() === subtopicoStr.toLowerCase()
          );

          let updatedTemas = [...s[platKey].temas];
          const hoje = todayStr();

          if (existIndex !== -1) {
            const oldTema = s[platKey].temas[existIndex];
            const newRev = buildRev(hoje, oldTema.esp);
            updatedTemas[existIndex] = normalizeTema({
              ...oldTema,
              d0: hoje,
              rev: newRev
            });
          } else {
            const newTema = normalizeTema({
              id: Date.now() + Math.random(),
              nome: subtopicoStr,
              esp: areaStr,
              prio: "Alta",
              importancia: "ALTA",
              d0: hoje,
              rev: buildRev(hoje, areaStr),
              parentTopic: null,
              ankiDeck: "",
              obs: `Auto-gerado via erro em simulado (${questao.tipoErro || "Geral"})`
            });
            updatedTemas.push(newTema);
          }

          return {
            [platKey]: {
              ...s[platKey],
              simulados: simMap,
              temas: updatedTemas
            }
          };
        }),

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

      marcarAnkiHoje: () =>
        set((s) => {
          const hoje = todayStr();
          const datas = s.meta?.ankiAdesao?.datas || [];
          const exists = datas.includes(hoje);
          return {
            meta: {
              ...s.meta,
              ankiAdesao: {
                datas: exists ? datas.filter((d) => d !== hoje) : [...datas, hoje],
              },
            },
          };
        }),

      registrarCaso: (platKey, casoId, payload = {}) =>
        set((s) => {
          const platState = s[platKey] || initialPlat();
          const progressoAtual = platState.casosProgresso || {};
          const anterior = progressoAtual[casoId] || {};
          const hoje = todayStr();
          const acertou = payload.acertou ?? payload.fase2Acerto ?? payload.sctAcerto ?? false;
          return {
            [platKey]: {
              ...platState,
              casosProgresso: {
                ...progressoAtual,
                [casoId]: {
                  ...anterior,
                  ...payload,
                  vistos: payload.vistos ?? ((anterior.vistos || 0) + 1),
                  proximaData: addDays(hoje, acertou ? 7 : 2),
                  atualizadoEm: hoje,
                },
              },
            },
          };
        }),

      registrarCasoClinico: (platKey, casoId, payload = {}) =>
        get().registrarCaso(platKey, casoId, payload),

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

      resetStore: (options = {}) =>
        set({
          plat: "res",
          cronogramaSel: { res: "res-medcof-2026", vest: "vest-base" },
          calendarProvider: {
            activeId: "medcof",
            importedTopics: [],
            customTopics: [],
          },
          res: initialPlat(),
          vest: initialVestibularPlat(),
          undoStack: [],
          userName: "Estudante",
          userEmail: "",
          meta: { dataProva: "2026-09-13", acerto: 85, retencaoFSRS: 0.90, maxRevisoesDia: 30, tempoDisponivel: 2, intervaloMaxDias: 180, pausadoAte: null, isRetornoAcolhedor: false, lastActiveDate: null, provasAlvo: ["ENAMED"], isSegundaTentativa: false, areaPuxouBaixo: "", notasTentativaAnterior: {}, acertosAlvo: 0, totalQuestoesAlvo: 100, notaCorteAlvo: 0, streakFreezeAvailable: true, streakFreezeUsed: false, tomMentor: "gentil", estrategiaRefinada: false, metaQuestoesDia: 0, metaQuestoesTotal: 0, volumePorAreaModo: "fraqueza", mentorLog: [], ferramentas: { questoes: "MedEvo", flashcards: "Anki" }, metodoProgresso: {}, dicasVistas: [], notif: { enabled: false, hora: "08:00" }, prontidaoHist: [], ativacaoDispensada: false, trilhaDispensada: false, trilhaXpDados: {}, streakMaxAvisado: false, lastFocusSessionAt: null, lastReflectionAt: null, peakModePhase: "base", ankiAdesao: { datas: [] }, modulos: { raciocinioClinico: false }, onboarding: getOnboardingDefaults(), vestibularStart: { completed: false, targetExam: null, examDate: null, baselineMode: null, planMode: "mentor", completedAt: null }, temasPerWeek: 6, estrategiaStartDate: null },
          onboardingDone: false,
          sprint: { esps: [], ativa: false, semana: "" },
          focusMode: false,
          modoSimples: true,
          mentorMode: true,
          modoProva: false,
          enamedAnalises: [],
          actionInbox: [],
          actionInboxState: initialActionInboxState(),
          decisionSnapshot: null,
          sessionReflections: [],
          weeklyReviews: [],
          learningEvents: [],
          brainDumpD1Data: {},
          temaStats: {},
          vistos: [],
          toast: null,
          confirmDialog: null,
          tourStep: null,
          updatedAt: options.touchUpdatedAt === false ? 0 : Date.now(),
          gamif: {
            xp: 0,
            level: 1,
            streakCurrent: 0,
            streakBest: 0,
            lastStudyDate: null,
            freezesOwned: 1,
            freezesUsedDates: [],
            recoveryOwned: 0,
            badges: [],
            graceUsedThisWeek: false,
            focusBoostActive: false,
            xpAudit: { acertos: 0, constancia: 0, outros: 0 },
          },
        }),
      })
    ),
    {
      name: DEFAULT_PERSIST_SCOPE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        plat: s.plat,
        cronogramaSel: s.cronogramaSel,
        calendarProvider: s.calendarProvider,
        meta: s.meta,
        res: s.res,
        vest: s.vest,
        userName: s.userName,
        userEmail: s.userEmail,
        onboardingDone: s.onboardingDone,
        focusMode: s.focusMode,
        modoSimples: s.modoSimples,
        mentorMode: s.mentorMode,
        modoProva: s.modoProva,
        enamedAnalises: s.enamedAnalises,
        actionInboxState: s.actionInboxState,
        sessionReflections: s.sessionReflections,
        weeklyReviews: s.weeklyReviews,
        learningEvents: s.learningEvents,
        brainDumpD1Data: s.brainDumpD1Data,
        temaStats: s.temaStats,
        vistos: s.vistos,
        sprint: s.sprint,
        updatedAt: s.updatedAt,
        gamif: s.gamif,
      }),
      merge: (persisted, initial) => {
        const persistedVest = persisted.vest || {};
        const resolvedVest = (persistedVest.temas?.length > 0)
          ? { ...initial.vest, ...persistedVest }
          : { ...initial.vest, ...persistedVest, temas: initial.vest?.temas || [] };
        const migratedMeta = { ...(persisted.meta || {}) };
        if (migratedMeta.dataProva === "2026-10-25") {
          migratedMeta.dataProva = "2026-09-13";
        }

        const normalizePlatTemas = (platObj) => {
          if (!platObj || !Array.isArray(platObj.temas)) return platObj;
          return {
            ...platObj,
            temas: platObj.temas.map(t => normalizeTema(t))
          };
        };

        const mergedRes = normalizePlatTemas({ ...initial.res, ...(persisted.res || {}) });
        const mergedVest = normalizePlatTemas(resolvedVest);

        const preMigrationState = {
          ...persisted,
          plat: persisted.plat ?? initial.plat,
          meta: migratedMeta,
          res: mergedRes,
          vest: mergedVest,
          learningEvents: persisted.learningEvents ?? initial.learningEvents,
          temaStats: persisted.temaStats ?? initial.temaStats,
        };
        const migratedState = migrateTemaStatsToLearningEventsState(preMigrationState);
        const finalMigratedMeta = migratedState.meta || migratedMeta;

        return {
          ...initial,
          ...persisted,
          cronogramaSel: persisted.cronogramaSel ? { ...initial.cronogramaSel, ...persisted.cronogramaSel } : initial.cronogramaSel,
          calendarProvider: persisted.calendarProvider
            ? {
              ...initial.calendarProvider,
              ...persisted.calendarProvider,
              importedTopics: persisted.calendarProvider.importedTopics || [],
              customTopics: persisted.calendarProvider.customTopics || [],
              scheduledTopics: persisted.calendarProvider.scheduledTopics || [],
            }
            : initial.calendarProvider,
          meta: (persisted.meta || finalMigratedMeta[TEMA_STATS_MIGRATION_FLAG] === true) ? {
            ...initial.meta,
            ...finalMigratedMeta,
            modulos: { ...initial.meta.modulos, ...(finalMigratedMeta.modulos || {}) },
            ankiAdesao: { ...initial.meta.ankiAdesao, ...(finalMigratedMeta.ankiAdesao || {}) },
            onboarding: applyOnboardingChoice(
              { ...initial.meta, ...finalMigratedMeta, onboarding: getOnboardingDefaults(finalMigratedMeta) },
              persisted.onboardingDone ? { completed: true } : {}
            ),
          } : initial.meta,
          res: mergedRes,
          vest: mergedVest,
          userEmail: persisted.userEmail ?? initial.userEmail,
          focusMode: persisted.focusMode ?? initial.focusMode,
          modoSimples: persisted.modoSimples ?? initial.modoSimples,
          mentorMode: persisted.mentorMode ?? initial.mentorMode,
          modoProva: persisted.modoProva ?? initial.modoProva,
          enamedAnalises: persisted.enamedAnalises ?? initial.enamedAnalises,
          actionInboxState: persisted.actionInboxState ?? initial.actionInboxState,
          sessionReflections: persisted.sessionReflections ?? initial.sessionReflections,
          weeklyReviews: persisted.weeklyReviews ?? initial.weeklyReviews,
          learningEvents: migratedState.learningEvents ?? initial.learningEvents,
          brainDumpD1Data: persisted.brainDumpD1Data ?? initial.brainDumpD1Data,
          temaStats: persisted.temaStats ?? initial.temaStats,
          vistos: persisted.vistos ?? initial.vistos,
          sprint: persisted.sprint ?? initial.sprint,
          onboardingDone: persisted.onboardingDone ?? isOnboardingComplete(persisted.meta || {}) ?? initial.onboardingDone,
          updatedAt: persisted.updatedAt ?? initial.updatedAt,
          gamif: persisted.gamif ? { ...initial.gamif, ...persisted.gamif } : initial.gamif,
        };
      },
    }
  )
);
