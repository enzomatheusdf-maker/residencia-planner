// src/App.js
// Main entry point for MedRev - Clean & Modular Architecture
import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import {
  Eye, EyeOff, Settings,
  Brain, Layers, CalendarCheck, GraduationCap, ShieldCheck,
  Rocket, BookOpen, SlidersHorizontal, ArrowRight,
  BarChart3, Database, Trophy, Timer, FileText,
} from "lucide-react";

// Camada Core & State
import { migrateTemaStatsToLearningEventsState, useStore } from "./core/store";
import { STEPS, isOverdue, todayStr, normalizeTema, getWorkloadProjection } from "./core/fsrs";
import { xpForReview } from "./core/gamif";
import { ACHIEVEMENTS } from "./core/achievements";
import { getReadinessData } from "./core/readiness";
import { describeCurrentReviewTransition } from "./core/reviewOutcome";
import { exportMedrevBackup } from "./core/backup";
import { buildAuthSession, getInitialAuthSession, assertActiveUserScope } from "./core/authSession";
import {
  assertOwnerUidMatchesScope,
  getAnonymousStorageKey,
  getOrCreateAnonymousSessionId,
  getUserScopedStorageKey,
} from "./core/userScope";
import { applyOnboardingChoice, getOnboardingDefaults, isOnboardingComplete } from "./core/onboarding";
import { shouldShowOnboardingV2 } from "./core/onboardingGate";
import { featureEnabled } from "./core/platformFeatures";
import { NAV_VIEW, buildPlanAgendaTarget, getMoreNavItems } from "./core/navigationModel";
import { getLearningEventStatsList, getTemaStatsFromLearningEvents } from "./core/learningEvent";

// Camada de Hooks/Estatísticas
import { useFilaInteligente } from "./hooks/useMetrics";
import { getMentorPhrase, getRecentPhrases, trackRecentPhrase } from "./core/mentor";

// Camada de Serviços
import {
  auth,
  monitorarAuth,
  sincronizarComFirebase,
  carregarDadosUsuario,
  fazerLogout,
} from "./services/firebase";
import { safeTrackEvent } from "./core/telemetry";

// Camada de Componentes
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import Dashboard from "./components/Dashboard";
import Cronograma from "./components/Cronograma";
import CronogramaVestHub from "./components/CronogramaVestHub";
import BancoDados from "./components/BancoDados";
import StatsPanel from "./components/StatsPanel";
import WeeklyReview from "./components/WeeklyReview";
import DataSafetyPanel from "./components/DataSafetyPanel";
import LaunchChecklistPanel from "./components/LaunchChecklistPanel";
import Simulados from "./components/Simulados";
import AnkiAudit from "./components/AnkiAudit";
import AcademiaMetodo from "./components/AcademiaMetodo";
import Conquistas from "./components/Conquistas";
import PomodoroWidget from "./components/PomodoroWidget";
import FocusMode from "./components/FocusMode";
import AuthModal from "./components/AuthModal";
import LandingPage from "./components/LandingPage";
import OnboardingWizard from "./components/OnboardingWizard";
import OnboardingWizardV2 from "./components/OnboardingWizardV2";
import ErrorBoundary from "./components/ErrorBoundary";

// Modais e Primitivos
import {
  HelpModal,
  CycleCompleteModal,
  TemaModal,
  AjustesModal,
  GlobalSearchModal,
  LojaModal
} from "./components/Modals";

import {
  MedRevLogo,
  Btn,
  Input,
  Toast,
  ConfirmDialog,
  ConfettiOverlay,
  Modal,
  playTick,
  CheckmarkOverlay
} from "./components/Primitives";

const RaciocinioClinico = lazy(() => import("./components/RaciocinioClinico"));

// Metadados visuais por ferramenta da aba Mais: icone + paleta de cor.
const MORE_TOOL_META = {
  raciocinio:       { icon: Brain,            color: "text-teal-300",    bg: "bg-teal-500/10",    ring: "border-teal-500/20",    glow: "group-hover:border-teal-400/40" },
  anki:             { icon: Layers,           color: "text-purple-300",  bg: "bg-purple-500/10",  ring: "border-purple-500/20",  glow: "group-hover:border-purple-400/40" },
  weekly_review:    { icon: CalendarCheck,    color: "text-blue-300",    bg: "bg-blue-500/10",    ring: "border-blue-500/20",    glow: "group-hover:border-blue-400/40" },
  stats:            { icon: BarChart3,        color: "text-indigo-300",  bg: "bg-indigo-500/10", ring: "border-indigo-500/20", glow: "group-hover:border-indigo-400/40" },
  banco:            { icon: Database,         color: "text-cyan-300",    bg: "bg-cyan-500/10",   ring: "border-cyan-500/20",   glow: "group-hover:border-cyan-400/40" },
  academia:         { icon: GraduationCap,    color: "text-amber-300",   bg: "bg-amber-500/10",   ring: "border-amber-500/20",   glow: "group-hover:border-amber-400/40" },
  data_safety:      { icon: ShieldCheck,      color: "text-emerald-300", bg: "bg-emerald-500/10", ring: "border-emerald-500/20", glow: "group-hover:border-emerald-400/40" },
  launch_checklist: { icon: Rocket,           color: "text-rose-300",    bg: "bg-rose-500/10",    ring: "border-rose-500/20",    glow: "group-hover:border-rose-400/40" },
  guia:             { icon: BookOpen,         color: "text-sky-300",     bg: "bg-sky-500/10",     ring: "border-sky-500/20",     glow: "group-hover:border-sky-400/40" },
  conquistas:       { icon: Trophy,           color: "text-amber-300",   bg: "bg-amber-500/10",   ring: "border-amber-500/20",   glow: "group-hover:border-amber-400/40" },
};

const DEFAULT_TOOL_META = { icon: SlidersHorizontal, color: "text-gray-300", bg: "bg-white/5", ring: "border-white/10", glow: "group-hover:border-white/25" };

function MoreToolsHub({ items, onOpen }) {
  const gamif = useStore((s) => s.gamif || {});
  const plannedTools = [
    {
      title: "Conquistas",
      description: `${gamif.badges?.length || 0}/${ACHIEVEMENTS.length} marcos desbloqueados. Timeline completa fica no Perfil por enquanto.`,
      icon: Trophy,
      tone: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Pomodoro",
      description: "Bloco reservado para foco, pausas e associacao ao tema atual.",
      icon: Timer,
      tone: "text-rose-300 bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Politicas do site",
      description: "Atalho estrutural para conta, privacidade, backup e termos.",
      icon: FileText,
      tone: "text-gray-300 bg-white/5 border-white/10",
    },
  ];
  return (
    <section className="max-w-5xl mx-auto space-y-5">
      <div className="space-y-1">
        <p className="text-[11px] font-black uppercase tracking-wider text-blue-300">Ferramentas</p>
        <h1 className="text-2xl font-black text-white tracking-tight">Mais</h1>
        <p className="text-[12px] text-gray-400">Acesso rapido aos recursos avancados sem poluir a jornada diaria.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const meta = MORE_TOOL_META[item.view] || DEFAULT_TOOL_META;
          const Icon = meta.icon;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onOpen(item.view)}
              className={`group text-left rounded-2xl border border-white/8 bg-white/[0.02] p-4 flex items-start gap-3.5 transition-all hover:bg-white/[0.04] ${meta.glow} hover:-translate-y-0.5 cursor-pointer`}
            >
              <div className={`shrink-0 w-11 h-11 rounded-xl ${meta.bg} border ${meta.ring} flex items-center justify-center transition-colors`}>
                <Icon size={20} className={meta.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[13px] font-black text-white truncate">{item.label}</h2>
                  <ArrowRight size={15} className="text-gray-600 group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Blocos planejados</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {plannedTools.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={`rounded-2xl border p-4 ${item.tone}`}>
                <Icon size={18} />
                <p className="mt-2 text-[12px] font-black text-white">{item.title}</p>
                <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function prioToImportancia(prio) {
  switch ((prio || "").toLowerCase()) {
    case "diamante": return "CRITICA";
    case "alta":     return "ALTA";
    case "média": case "media": return "MEDIA";
    case "baixa": case "bônus": case "bonus": return "MEDIA";
    default: return "ALTA";
  }
}

function getPostReviewMessage(plat, temaId, stepKey) {
  const state = useStore.getState();
  const updatedTema = state[plat]?.temas?.find((t) => t.id === temaId);
  return describeCurrentReviewTransition({ tema: updatedTema, stepKey })?.message || "Etapa computada com sucesso.";
}

/* APP ROOT MAIN ENTRY ────────────────────────────────────────────────────────── */
export default function App() {
  const {
    plat,
    setPlat,
    setCalendarProvider,
    meta,
    pushUndo,
    undo,
    markStep,
    addTema,
    updateTema,
    deleteTema,
    userName,
    setUserName,
    onboardingDone,
    completeOnboarding,
    resetOnboarding,
    focusMode,
    toggleFocusMode,
    modoSimples,
    toggleModoSimples,
    setBrainDumpD1,
    addTemaStats,
    resetStore,
    tourStep,
    setTourStep,
    addXp,
    updateGamifStreak
  } = useStore();

  const temas = useStore((s) => s[plat]?.temas || []);

  // ─── AUTENTICAÇÃO FIREBASE ────────────────────────────────────────────────
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");
  const [authSession, setAuthSession] = useState(getInitialAuthSession());
  const authTransitionRef = useRef(0);
  const defaultAnonymousScopeRef = useRef(getAnonymousStorageKey(getOrCreateAnonymousSessionId()));

  const [view, setView] = useState("login");
  const [planNavigationTarget, setPlanNavigationTarget] = useState(null);
  const [vestCronoSubViewTarget, setVestCronoSubViewTarget] = useState(null);
  const [clinicalNavigationTarget, setClinicalNavigationTarget] = useState(null);
  const [helpModal, setHelpModal] = useState(false);

  const [temaEdit, setTemaEdit] = useState(null);
  const [ajustes, setAjustes] = useState(false);
  const [ajustesContext, setAjustesContext] = useState({ initialTab: "perfil" });
  const [editName, setEditName] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [cycleComplete, setCycleComplete] = useState(null);
  const [targetedFocusItem, setTargetedFocusItem] = useState(null);
  const [syncStatus, setSyncStatus] = useState(navigator.onLine ? "saved" : "offline");
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [lojaOpen, setLojaOpen] = useState(false);
  const toast = useStore((s) => s.toast);
  const dismissToast = useStore((s) => s.dismissToast);
  const showToastStore = useStore((s) => s.showToast);
  const confirmDialog = useStore((s) => s.confirmDialog);
  const closeConfirm = useStore((s) => s.closeConfirm);
  const trackedReturnRef = useRef(false);
  const onboardingMeta = useMemo(() => getOnboardingDefaults(meta || {}), [meta]);
  const onboardingCompleted = onboardingDone || isOnboardingComplete({ onboarding: onboardingMeta });
  const shouldShowV2 = shouldShowOnboardingV2({ tourStep, meta, onboardingDone });
  const shouldShowOnboarding = !shouldShowV2 && !onboardingCompleted && !tourStep;
  const openAjustes = useCallback((payload = true) => {
    if (payload === false) {
      setAjustes(false);
      return;
    }
    const validTabs = ["perfil", "ajustes", "dados", "conta"];
    const nextTab =
      payload && typeof payload === "object" && validTabs.includes(payload.initialTab)
        ? payload.initialTab
        : "perfil";
    setAjustesContext({ initialTab: nextTab });
    setAjustes(true);
  }, []);
  const navFeatures = useMemo(() => ({
    modulos: meta.modulos,
    raciocinioClinico: featureEnabled(plat, "raciocinioClinico") && meta.modulos?.raciocinioClinico === true,
  }), [meta.modulos, plat]);
  const moreNavItems = useMemo(() => getMoreNavItems(plat, navFeatures), [plat, navFeatures]);
  const openFromMore = useCallback((targetView) => {
    if (targetView === NAV_VIEW.GUIDE) {
      setHelpModal(true);
      return;
    }
    if (targetView === NAV_VIEW.SETTINGS) {
      openAjustes({ initialTab: "ajustes" });
      return;
    }
    setView(targetView);
  }, [openAjustes]);
  const openPlanAgenda = useCallback((date = todayStr()) => {
    setPlanNavigationTarget(plat === "res" ? buildPlanAgendaTarget({ date }) : null);
    setView(NAV_VIEW.PLAN);
  }, [plat]);
  const openClinicalCase = useCallback((target = {}) => {
    setClinicalNavigationTarget({
      caseId: target.caseId || null,
      phase: target.phase || "caso",
    });
    setView("raciocinio");
  }, []);
  const openVestWeeklyPlan = useCallback(() => {
    setVestCronoSubViewTarget("semanal");
    setView(NAV_VIEW.PLAN);
  }, []);

  const openAuthModal = useCallback((mode = "login") => {
    setAuthModalMode(mode === "signup" ? "signup" : "login");
    setAuthModalOpen(true);
  }, []);

  const exportBackupNow = useCallback(() => {
    try {
      const backup = exportMedrevBackup(useStore.getState(), {
        ownerUid: authSession.uid,
        appVersion: process.env.REACT_APP_VERSION || process.env.npm_package_version || "unknown",
      });
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `medrev_backup_${todayStr()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (showToastStore) showToastStore("Backup exportado.");
    } catch (error) {
      if (showToastStore) showToastStore("Falha ao exportar backup.");
      console.error("Falha ao exportar backup no fallback:", error);
    }
  }, [authSession.uid, showToastStore]);

  const buildStateToSync = useCallback((state, uidOverride = null) => ({
    plat: state.plat,
    cronogramaSel: state.cronogramaSel,
    calendarProvider: state.calendarProvider,
    gamif: state.gamif,
    meta: state.meta,
    res: state.res,
    vest: state.vest,
    userName: state.userName,
    userEmail: state.userEmail,
    onboardingDone: state.onboardingDone,
    focusMode: state.focusMode,
    modoSimples: state.modoSimples,
    mentorMode: state.mentorMode,
    modoProva: state.modoProva,
    enamedAnalises: state.enamedAnalises,
    actionInboxState: state.actionInboxState,
    sessionReflections: state.sessionReflections,
    weeklyReviews: state.weeklyReviews,
    learningEvents: state.learningEvents,
    brainDumpD1Data: state.brainDumpD1Data,
    temaStats: state.temaStats,
    vistos: state.vistos || [],
    sprint: state.sprint,
    ownerUid: uidOverride || authSession.uid || null,
    updatedAt: state.updatedAt || Date.now(),
  }), [authSession.uid]);

  useEffect(() => {
    if (!usuarioLogado || trackedReturnRef.current) return;
    const lastActive = useStore.getState().meta?.lastActiveDate;
    if (!lastActive) return;
    const gap = Math.max(0, Math.round((new Date(todayStr()) - new Date(lastActive)) / (1000 * 60 * 60 * 24)));
    if (gap >= 1) {
      safeTrackEvent(gap >= 7 ? "retorno_d7" : "retorno_d1", { gap_dias: gap }, { state: useStore.getState() });
      trackedReturnRef.current = true;
    }
  }, [usuarioLogado]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowGlobalSearch((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOnline = () => setSyncStatus("saved");
    const handleOffline = () => setSyncStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (view === "raciocinio" && meta.modulos?.raciocinioClinico !== true) {
      setView("dash");
    }
  }, [meta.modulos?.raciocinioClinico, view]);

  useEffect(() => {
    if (!usuarioLogado) return;
    const hoje = todayStr();
    const currentMeta = useStore.getState().meta || {};
    const hist = currentMeta.prontidaoHist || [];
    const lastRecord = hist[hist.length - 1];
    
    const currentState = useStore.getState();
    const currentPlat = currentState.plat;
    const currentTemas = currentState[currentPlat]?.temas || [];
    const currentSims = currentState[currentPlat]?.simulados || [];
    const currentTemaStats = getTemaStatsFromLearningEvents(currentState.learningEvents || [], {
      plat: currentPlat,
      fallbackTemaStats: currentState.temaStats || {},
    });
    
    const readiness = getReadinessData({
      temas: currentTemas,
      simulados: currentSims,
      meta: currentMeta,
      plat: currentPlat,
      temaStats: currentTemaStats
    });
    const score = readiness.score || 0;
    
    if (!lastRecord || lastRecord.d !== hoje || lastRecord.score !== score) {
      const newHist = [...hist];
      if (lastRecord && lastRecord.d === hoje) {
        newHist[newHist.length - 1] = { d: hoje, score };
      } else {
        newHist.push({ d: hoje, score });
      }
      useStore.setState({
        meta: {
          ...currentMeta,
          prontidaoHist: newHist.slice(-120)
        }
      });
    }
  }, [usuarioLogado, temas]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const unsubscribe = monitorarAuth(async (user) => {
      if (!isMounted) return;
      const transitionId = ++authTransitionRef.current;
      setCarregandoAuth(true);
      setSyncStatus(navigator.onLine ? "saving" : "offline");

      const uid = user?.uid || null;
      const scopeKey = uid
        ? getUserScopedStorageKey(uid)
        : defaultAnonymousScopeRef.current;

      setAuthSession(buildAuthSession({ user, hydrated: false, scopeKey }));

      resetStore({ touchUpdatedAt: false });
      if (useStore.persist?.setOptions) {
        useStore.persist.setOptions({ name: scopeKey });
      }
      if (useStore.persist?.rehydrate) {
        await useStore.persist.rehydrate();
      }

      if (!isMounted || transitionId !== authTransitionRef.current) return;

      const hydratedLocalState = useStore.getState();
      const localTime = hydratedLocalState.updatedAt || 0;

      if (user) {
        setUsuarioLogado(user);

        useStore.setState({
          userName: user.displayName || user.email?.split("@")[0] || "Estudante",
          userEmail: user.email || "",
        });

        const resultado = await carregarDadosUsuario(user.uid);
        if (!isMounted || transitionId !== authTransitionRef.current) return;

        if (resultado.sucesso) {
          const dados = resultado.dados || {};
          const currentState = useStore.getState();
          const remoteTime = dados.updatedAt || 0;
          let remoteScopeValid = true;

          try {
            assertOwnerUidMatchesScope(dados.ownerUid || dados.uid, uid, "remote user state");
          } catch (scopeError) {
            remoteScopeValid = false;
            console.error("Dados remotos ignorados por escopo divergente:", scopeError);
            if (showToastStore) showToastStore("Dados da nuvem ignorados por escopo divergente.");
          }

          if (remoteScopeValid && remoteTime > localTime) {
            if (Math.abs(remoteTime - localTime) > 24 * 60 * 60 * 1000) {
              showToastStore("Dados da nuvem mais recentes - atualizando.");
            }

            const normalizePlatTemas = (platObj, initialPlatObj) => {
              if (!platObj) return initialPlatObj;
              const temasList = Array.isArray(platObj.temas) ? platObj.temas : [];
              return {
                ...initialPlatObj,
                ...platObj,
                temas: temasList.map((t) => normalizeTema(t)),
              };
            };

            const mergedRemoteMeta = {
              ...currentState.meta,
              ...(dados.meta || {}),
              modulos: { ...(currentState.meta?.modulos || {}), ...(dados.meta?.modulos || {}) },
              ankiAdesao: { ...(currentState.meta?.ankiAdesao || {}), ...(dados.meta?.ankiAdesao || {}) },
            };
            const resolvedOnboarding = applyOnboardingChoice(
              mergedRemoteMeta,
              (dados.onboardingDone || currentState.onboardingDone) ? { completed: true } : {}
            );
            const resolvedOnboardingDone =
              currentState.onboardingDone ||
              (dados.onboardingDone ?? false) ||
              resolvedOnboarding.completed === true;

            const firebaseVest = dados.vest || {};
            const resolvedVest = (firebaseVest.temas?.length > 0)
              ? firebaseVest
              : { ...currentState.vest, ...(firebaseVest || {}), temas: currentState.vest.temas };

            const nextRemoteState = migrateTemaStatsToLearningEventsState({
              plat: dados.plat || "res",
              cronogramaSel: dados.cronogramaSel || currentState.cronogramaSel,
              calendarProvider: dados.calendarProvider || currentState.calendarProvider,
              gamif: dados.gamif ? { ...currentState.gamif, ...dados.gamif } : currentState.gamif,
              userName: dados.userName || user.displayName || user.email?.split("@")[0] || "Estudante",
              userEmail: user.email || "",
              meta: {
                ...mergedRemoteMeta,
                onboarding: resolvedOnboarding,
              },
              res: normalizePlatTemas(dados.res, currentState.res),
              vest: normalizePlatTemas(resolvedVest, currentState.vest),
              onboardingDone: resolvedOnboardingDone,
              focusMode: dados.focusMode ?? false,
              modoSimples: dados.modoSimples ?? true,
              mentorMode: dados.mentorMode ?? true,
              modoProva: dados.modoProva ?? false,
              enamedAnalises: dados.enamedAnalises || [],
              actionInboxState: dados.actionInboxState || currentState.actionInboxState,
              sessionReflections: dados.sessionReflections || [],
              weeklyReviews: dados.weeklyReviews || [],
              learningEvents: dados.learningEvents || [],
              brainDumpD1Data: dados.brainDumpD1Data || {},
              temaStats: dados.temaStats || {},
              vistos: dados.vistos || [],
              sprint: dados.sprint || currentState.sprint || { esps: [], ativa: false, semana: "" },
              ownerUid: uid,
              updatedAt: remoteTime,
            });
            useStore.setState(nextRemoteState);
          } else {
            const stateToSave = buildStateToSync(currentState, uid);
            await sincronizarComFirebase(uid, stateToSave).catch((err) => {
              console.error("Erro ao sincronizar dados locais mais recentes:", err);
            });
          }
        } else {
          const stateToSave = buildStateToSync(useStore.getState(), uid);
          await sincronizarComFirebase(uid, stateToSave).catch((err) => {
            console.error("Erro ao inicializar dados na nuvem:", err);
          });
        }

        setView("dash");
      } else {
        setUsuarioLogado(null);
        setView("login");
      }

      if (!isMounted || transitionId !== authTransitionRef.current) return;

      setAuthSession((prev) => ({
        ...prev,
        status: user ? "authenticated" : "signed_out",
        hydrated: true,
        lastHydratedAt: Date.now(),
      }));
      setCarregandoAuth(false);
      setSyncStatus(navigator.onLine ? "saved" : "offline");
      clearTimeout(timeoutId);
    });

    // Timeout de segurança: se Firebase não responder em 5s, mostra AuthModal
    timeoutId = setTimeout(() => {
      if (isMounted) {
        setCarregandoAuth(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [buildStateToSync, resetStore, showToastStore]);

  // ─── SINCRONIZAR DADOS COM FIREBASE (AO MUDAR ESTADO) ──────────────────────
  useEffect(() => {
    if (!usuarioLogado || !authSession.hydrated || !authSession.uid) return;
    const activeUid = authSession.uid;

    let timeoutId;
    let lastSavedJSON = "";

    const unsubscribe = useStore.subscribe((state) => {
      setSyncStatus((current) => (current === "offline" ? "offline" : "saving"));
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        let currentUid;
        try {
          currentUid = auth.currentUser?.uid || null;
          assertActiveUserScope(activeUid, currentUid);
        } catch (scopeError) {
          console.error("Bloqueio de sync por escopo divergente:", scopeError);
          setSyncStatus("offline");
          return;
        }

        const stateToSave = buildStateToSync(state, activeUid);

        const { updatedAt, ...dataToCompare } = stateToSave;
        const currentJSON = JSON.stringify(dataToCompare);
        if (currentJSON === lastSavedJSON) {
          setSyncStatus("saved");
          return;
        }

        lastSavedJSON = currentJSON;
        setSyncStatus("saving");
        sincronizarComFirebase(activeUid, stateToSave)
          .then((res) => {
            if (res.sucesso) {
              setSyncStatus("saved");
              setAuthSession((prev) => (
                prev.uid === activeUid
                  ? { ...prev, lastSyncAt: Date.now() }
                  : prev
              ));
            } else {
              setSyncStatus("offline");
            }
          })
          .catch((err) => {
            console.error("Erro na sincronização reativa:", err);
            setSyncStatus("offline");
          });
      }, 3000);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [authSession.hydrated, authSession.uid, buildStateToSync, usuarioLogado]);

  // ─── GARANTIR FLUSH ANTES DE SAIR DA PÁGINA ───────────────────────────────
  useEffect(() => {
    if (!usuarioLogado || !authSession.hydrated || !authSession.uid) return;
    const activeUid = authSession.uid;

    const handleFlush = () => {
      try {
        const currentUid = auth.currentUser?.uid || null;
        assertActiveUserScope(activeUid, currentUid);
      } catch (scopeError) {
        console.error("Flush bloqueado por escopo divergente:", scopeError);
        return;
      }

      const state = useStore.getState();
      const stateToSave = buildStateToSync(state, activeUid);
      sincronizarComFirebase(activeUid, stateToSave)
        .catch((err) => console.error("Erro no flush beforeunload:", err));
    };

    window.addEventListener("beforeunload", handleFlush);
    return () => {
      window.removeEventListener("beforeunload", handleFlush);
    };
  }, [authSession.hydrated, authSession.uid, buildStateToSync, usuarioLogado]);



  const filaHoje = useFilaInteligente();
  const totalFilaHoje = filaHoje.length;
  const concluidosHoje = useMemo(() => {
    return temas
      .flatMap((t) => STEPS.map((s) => t.rev[s.key]))
      .filter((r) => r.done && r.date === todayStr()).length;
  }, [temas]);

  const overdueCount = useMemo(() => {
    return temas.reduce(
      (a, t) =>
        a +
        STEPS.filter((s) => isOverdue(t.rev[s.key]?.date) && !t.rev[s.key]?.done)
          .length,
      0
    );
  }, [temas]);

  const showToast = useCallback((msg, withUndo = false) => showToastStore(msg, { undo: withUndo }), [showToastStore]);

  const checkWorkloadAndWarn = useCallback(() => {
    const state = useStore.getState();
    const temasList = state[plat]?.temas || [];
    const maxRevisoesDia = state.meta?.maxRevisoesDia || 30;
    const proj = getWorkloadProjection(temasList, 7);
    const exceeds = Object.values(proj).some((day) => (day?.count || 0) > maxRevisoesDia);
    if (exceeds) {
      showToast("Atenção: próxima semana já está carregada de revisões.");
    }
    return true;
  }, [plat, showToast]);

  const handleFocusModeCompleteStep = useCallback(
    (temaId, stepKey, markData) => {
      playTick();
      setShowCheckmark(true);

      if (stepKey === "d1") {
        pushUndo(plat);
        setBrainDumpD1(temaId, {
          ...markData.fields,
          completedAt: new Date().toISOString(),
        });
        addTemaStats(temaId, {
          stepKey: "d1",
          brainDump: true,
          ...markData.fields,
          modoReduzido: markData.modoReduzido,
          descansoPrescrito: markData.descansoPrescrito
        });
        markStep(plat, temaId, "d1", {
          acerto: markData.acerto !== undefined ? markData.acerto : 1.0,
          questoes: 1,
          motivosErro: [],
          tempoMin: markData.tempoMin,
          modoReduzido: markData.modoReduzido,
          descansoPrescrito: markData.descansoPrescrito,
          interleaved: !!markData.interleaved,
          interleavingStatus: markData.interleavingStatus || markData.interleavingPlan?.status || null,
          interleavingPlan: markData.interleavingPlan || null
        });
        showToast(getPostReviewMessage(plat, temaId, "d1"), true);
      } else if (stepKey === "d0") {
        const d0Questoes = Number(markData.questoes);
        if (!Number.isFinite(d0Questoes) || d0Questoes <= 0) {
          showToast("Informe pelo menos 1 questão feita para concluir o D0.", false, 5000);
          return;
        }
        pushUndo(plat);
        markStep(plat, temaId, "d0", {
          acerto: markData.acerto !== undefined ? markData.acerto : 1.0,
          questoes: markData.questoes !== undefined ? markData.questoes : 0,
          motivosErro: markData.motivosErro || [],
          erros: markData.erros || [],
          c1: markData.c1,
          c2: markData.c2,
          c3: markData.c3,
          c4: markData.c4,
          c5: markData.c5,
          modoReduzido: markData.modoReduzido,
          descansoPrescrito: markData.descansoPrescrito,
          interleaved: !!markData.interleaved,
          interleavingStatus: markData.interleavingStatus || markData.interleavingPlan?.status || null,
          interleavingPlan: markData.interleavingPlan || null
        });
        addTemaStats(temaId, {
          stepKey: "d0",
          acerto: markData.acerto !== undefined ? markData.acerto : 1.0,
          questoes: markData.questoes !== undefined ? markData.questoes : 0,
          motivosErro: markData.motivosErro || [],
          erros: markData.erros || [],
          c1: markData.c1,
          c2: markData.c2,
          c3: markData.c3,
          c4: markData.c4,
          c5: markData.c5,
          modoReduzido: markData.modoReduzido,
          descansoPrescrito: markData.descansoPrescrito,
          interleaved: !!markData.interleaved,
          interleavingStatus: markData.interleavingStatus || markData.interleavingPlan?.status || null,
          interleavingCandidateIds: markData.interleavingPlan?.candidates?.map((c) => c.temaId).filter(Boolean).slice(0, 5) || []
        });
        updateTema(plat, temaId, {
          pico: markData.pico || "",
          ankiDeck: markData.ankiDeck || "",
        });
        showToast(getPostReviewMessage(plat, temaId, "d0"));
      } else {
        pushUndo(plat);
        markStep(plat, temaId, stepKey, {
          acerto: markData.acerto,
          previsao: markData.previsao,
          questoes: markData.questoes,
          motivosErro: markData.motivosErro,
          erros: markData.erros || [],
          c1: markData.c1,
          c2: markData.c2,
          c3: markData.c3,
          c4: markData.c4,
          c5: markData.c5,
          modoReduzido: markData.modoReduzido,
          descansoPrescrito: markData.descansoPrescrito,
          interleaved: !!markData.interleaved,
          interleavingStatus: markData.interleavingStatus || markData.interleavingPlan?.status || null,
          interleavingPlan: markData.interleavingPlan || null
        });
        addTemaStats(temaId, {
          stepKey,
          acerto: markData.acerto,
          previsao: markData.previsao,
          questoes: markData.questoes,
          motivosErro: markData.motivosErro,
          erros: markData.erros || [],
          c1: markData.c1,
          c2: markData.c2,
          c3: markData.c3,
          c4: markData.c4,
          c5: markData.c5,
          modoReduzido: markData.modoReduzido,
          descansoPrescrito: markData.descansoPrescrito,
          interleaved: !!markData.interleaved,
          interleavingStatus: markData.interleavingStatus || markData.interleavingPlan?.status || null,
          interleavingCandidateIds: markData.interleavingPlan?.candidates?.map((c) => c.temaId).filter(Boolean).slice(0, 5) || []
        });

        // Confetti for D21
        if (stepKey === "d21") {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
          
          setTimeout(() => {
            const state = useStore.getState();
            const temaAtualizado = state[plat].temas.find((t) => t.id === temaId);
            if (temaAtualizado && STEPS.every((s) => temaAtualizado.rev[s.key].done)) {
              setCycleComplete(temaAtualizado);
              
              // Dispara frase do mentor pós-D21
              const recent = getRecentPhrases();
              const { text, id } = getMentorPhrase("ciclo_pos_d21", {
                userName: state.userName || "Estudante",
                tema: temaAtualizado.nome
              }, recent, plat, state.meta?.tomMentor || "gentil");
              if (id) trackRecentPhrase(id);
              setTimeout(() => {
                showToast(`🧠 Mentor: "${text}"`);
              }, 1500);
            }
          }, 100);
        }

        showToast(getPostReviewMessage(plat, temaId, stepKey), true);
      }

      // ─── CENTRALIZED GAMIFICATION LOGIC ─────────────────────────────────────
      const stateBefore = useStore.getState();
      const currentGamif = stateBefore.gamif || { xp: 0, level: 1, streakCurrent: 0, streakBest: 0, freezesOwned: 1, freezesUsedDates: [], recoveryOwned: 0, badges: [], graceUsedThisWeek: false };

      let acerto = 1.0;
      if (stepKey === "d1") {
        acerto = 1.0;
      } else if (stepKey === "d0") {
        acerto = markData.acerto !== undefined ? markData.acerto : 1.0;
      } else {
        acerto = markData.acerto !== undefined ? markData.acerto : 0;
      }
      const isInterleaved = !!markData.interleaved;
      const xpGained = xpForReview({ acerto, stepKey, isInterleaved });

      const source = acerto >= 0.8 ? "acertos" : "constancia";
      addXp(xpGained, source);
      updateGamifStreak(todayStr());

      const stateAfterStreak = useStore.getState();
      const gamifBefore = stateBefore.gamif || {};
      const gamifAfter = stateAfterStreak.gamif || {};

      if (gamifAfter.freezesOwned < gamifBefore.freezesOwned) {
        const recent = getRecentPhrases();
        const { text, id } = getMentorPhrase("descanso_saudavel", { userName: userName || "Estudante" }, recent, plat, stateAfterStreak.meta?.tomMentor || "gentil");
        trackRecentPhrase(id);
        setTimeout(() => {
          showToast(`❄️ Ofensiva Protegida! Mentor: "${text}"`, false, 6000);
        }, 1500);
      } else if (gamifAfter.graceUsedThisWeek && !gamifBefore.graceUsedThisWeek && (gamifAfter.streakCurrent === gamifBefore.streakCurrent)) {
        const recent = getRecentPhrases();
        const { text, id } = getMentorPhrase("descanso_saudavel", { userName: userName || "Estudante" }, recent, plat, stateAfterStreak.meta?.tomMentor || "gentil");
        trackRecentPhrase(id);
        setTimeout(() => {
          showToast(`🌱 Tolerância Ativa! Mentor: "${text}"`, false, 6000);
        }, 1500);
      } else if (gamifBefore.streakCurrent > 1 && gamifAfter.streakCurrent === 1 && gamifAfter.lostStreakDate === todayStr()) {
        const recent = getRecentPhrases();
        const { text, id } = getMentorPhrase("streak_perdida", { userName: userName || "Estudante" }, recent, plat, stateAfterStreak.meta?.tomMentor || "gentil");
        trackRecentPhrase(id);
        setTimeout(() => {
          showToast(`🔥 Ofensiva Reiniciada! Mentor: "${text}"`, false, 6000);
        }, 1500);
      }

      setTimeout(() => {
        const stateAfter = useStore.getState();
        const existingBadges = stateAfter.gamif?.badges || [];
        const newlyUnlocked = [];
        let totalXpBonus = 0;

        ACHIEVEMENTS.forEach((ach) => {
          if (!existingBadges.includes(ach.id) && ach.criterio(stateAfter)) {
            newlyUnlocked.push(ach.id);
            totalXpBonus += ach.xpReward;
            showToast(`🏆 Conquista Desbloqueada: ${ach.icon} ${ach.nome} (+${ach.xpReward} XP)!`);
          }
        });

        if (newlyUnlocked.length > 0) {
          useStore.setState((s) => {
            const g = s.gamif || {};
            const nextXp = (g.xp || 0) + totalXpBonus;
            const nextLvl = Math.floor(Math.sqrt(nextXp / 50)) + 1;
            
            const xpAudit = g.xpAudit ? { ...g.xpAudit } : { acertos: 0, constancia: 0, outros: 0 };
            xpAudit.outros = (xpAudit.outros || 0) + totalXpBonus;

            if (nextLvl > (g.level || 1)) {
              setTimeout(() => {
                showToast(`🎉 Nível Subiu: Você alcançou o Nível ${nextLvl}!`);
              }, 1000);
            }

            return {
              gamif: {
                ...g,
                xp: nextXp,
                level: nextLvl,
                badges: [...new Set([...(g.badges || []), ...newlyUnlocked])],
                xpAudit
              }
            };
          });
        } else {
          const nextLvl = stateAfter.gamif?.level || 1;
          const prevLvl = currentGamif.level || 1;
          if (nextLvl > prevLvl) {
            showToast(`🎉 Nível Subiu: Você alcançou o Nível ${nextLvl}!`);
          }
        }
      }, 250);

      // Milestone check
      const currentStateForMilestone = useStore.getState();
      const allDone = getLearningEventStatsList(currentStateForMilestone.learningEvents || [], {
        plat,
        fallbackTemaStats: currentStateForMilestone.temaStats || {},
      }).length;
      if ([7, 14, 30, 100, 200].includes(allDone)) {
        setTimeout(() => showToast(`🎯 Marco de ${allDone} revisões concluídas!`), 1500);
      }

      const stateAfterTrack = useStore.getState();
      const analyticsMeta = stateAfterTrack.meta?.analytics || {};
      if (!analyticsMeta.primeira_revisao_done) {
        safeTrackEvent("activation_first_review_done", { step: stepKey, plat }, { state: useStore.getState() });
        safeTrackEvent("review_completed", { step: stepKey, plat }, { state: useStore.getState() });
        useStore.setState({
          meta: {
            ...stateAfterTrack.meta,
            analytics: { ...analyticsMeta, primeira_revisao_done: true }
          }
        });
      } else {
        safeTrackEvent("review_completed", { step: stepKey, plat }, { state: useStore.getState() });
      }
      if (totalFilaHoje === 1 && analyticsMeta.last_zero_day !== todayStr()) {
        safeTrackEvent("revisoes_zeradas_dia", { plat }, { state: useStore.getState() });
        useStore.setState({
          meta: {
            ...useStore.getState().meta,
            analytics: { ...(useStore.getState().meta?.analytics || {}), last_zero_day: todayStr() }
          }
        });
      }

      // Meta diária check
      if ((meta.metaDiaria || 0) > 0 && concluidosHoje + 1 === meta.metaDiaria) {
        setTimeout(() => {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          
          const recent = getRecentPhrases();
          const { text } = getMentorPhrase("meta_diaria", {
            userName: useStore.getState().userName || "Estudante",
            totalQuestoes: markData.questoes || 15
          }, recent, plat);
          showToast(`🎯 Meta Cumprida: "${text}"`);
        }, 1500);
      }
    },
    [plat, pushUndo, setBrainDumpD1, addTemaStats, markStep, updateTema, showToast, meta.metaDiaria, concluidosHoje, addXp, updateGamifStreak, userName, totalFilaHoje]
  );

  const handleSaveTema = useCallback(
    (f) => {
      pushUndo(plat);
      if (!temaEdit?.id) {
        addTema(plat, f);
        showToast(f.unstarted ? `✓ "${f.nome}" priorizado no catálogo` : `✓ "${f.nome}" acoplado à grade`, true);
      } else {
        updateTema(plat, temaEdit.id, f);
        showToast("✓ Configurações do tema atualizadas", true);
      }
      setTemaEdit(null);
    },
    [plat, temaEdit, pushUndo, addTema, updateTema, showToast]
  );

  const handleStudyTrigger = (temaId, stepKey) => {
    if (temaId && typeof temaId === "object" && temaId.groupId) {
      setTargetedFocusItem({ groupId: temaId.groupId });
      useStore.setState({ focusMode: true });
      return;
    }
    setTargetedFocusItem({ temaId, stepKey });
    useStore.setState({ focusMode: true });
  };

  const handleOnboardingFinish = useCallback(
    (choice = {}) => {
      completeOnboarding(choice);
      if (choice.calendarProvider) setCalendarProvider(choice.calendarProvider);
      useStore.setState({
        mentorMode: choice.mentorMode !== false,
        modoSimples: choice.mentorMode !== false,
      });
      setTourStep(null);
      setView("dash");
    },
    [completeOnboarding, setCalendarProvider, setTourStep]
  );

  const handleOnboardingV2Finish = useCallback(() => {
    setView("dash");
  }, []);

  // ─── CARREGANDO AUTH ───────────────────────────────────────────────────────
  if (carregandoAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#07070f]">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <MedRevLogo size="lg" showTagline />
          </div>
          <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold font-mono">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  // ─── NÃO AUTENTICADO ───────────────────────────────────────────────────────
  if (!usuarioLogado) {
    return (
      <>
        <LandingPage
          onLogin={() => openAuthModal("login")}
          onSignup={() => openAuthModal("signup")}
        />
        {authModalOpen && (
          <AuthModal
            key={authModalMode}
            initialMode={authModalMode}
            onClose={() => setAuthModalOpen(false)}
            onSuccess={() => {
              setCarregandoAuth(true);
              setSyncStatus("saving");
            }}
          />
        )}
      </>
    );
  }

  if (focusMode) {
    return (
      <div className="flex h-screen bg-[#07070f] text-white font-sans antialiased overflow-hidden">
        {shouldShowV2 && (
          <OnboardingWizardV2
            onComplete={handleOnboardingV2Finish}
            onSkip={handleOnboardingFinish}
          />
        )}
        {!shouldShowV2 && shouldShowOnboarding && (
          <OnboardingWizard
            onComplete={handleOnboardingFinish}
            onSkip={handleOnboardingFinish}
          />
        )}
        <FocusMode
          targetedItem={targetedFocusItem}
          temas={temas}
          plat={plat}
          onExit={() => {
            setTargetedFocusItem(null);
            useStore.setState({ focusMode: false });
            if (useStore.getState().tourStep === "dash") {
              setView("dash");
            }
          }}
          onCompleteStep={(temaId, stepKey, markData) => {
            handleFocusModeCompleteStep(temaId, stepKey, markData);
            setTargetedFocusItem(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#07070f] text-white font-sans antialiased overflow-hidden">
      {shouldShowV2 && (
        <OnboardingWizardV2
          onComplete={handleOnboardingV2Finish}
          onSkip={handleOnboardingFinish}
        />
      )}
      {!shouldShowV2 && shouldShowOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingFinish}
          onSkip={handleOnboardingFinish}
        />
      )}
      <Sidebar
        view={view}
        setView={setView}
        setAjustes={openAjustes}
        overdueCount={overdueCount}
        setHelpModal={setHelpModal}
        usuarioLogado={usuarioLogado}
        syncStatus={syncStatus}
        onOpenLoja={() => setLojaOpen(true)}
        onLogout={async () => {
          const activeUid = authSession.uid || usuarioLogado?.uid || null;
          const activeScopeKey = activeUid ? getUserScopedStorageKey(activeUid) : null;
          if (activeUid) {
            const state = useStore.getState();
            const stateToSave = buildStateToSync(state, activeUid);
            await sincronizarComFirebase(activeUid, stateToSave);
          }
          const logoutResult = await fazerLogout();
          if (logoutResult?.sucesso && activeScopeKey && typeof window !== "undefined") {
            window.localStorage.removeItem(activeScopeKey);
          }
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-[#07070f]/95 border-b border-white/5 shrink-0 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <MedRevLogo size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!focusMode && (
              <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono font-bold">
                <span>Hoje:</span>
                <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{
                      width: `${
                        (meta.metaDiaria || 0) > 0
                          ? (concluidosHoje / meta.metaDiaria) * 100
                          : totalFilaHoje > 0
                          ? (concluidosHoje / (totalFilaHoje + concluidosHoje)) * 100
                          : 100
                      }%`,
                    }}
                  />
                </div>
                <span>
                  {concluidosHoje}/
                  {(meta.metaDiaria || 0) > 0
                    ? meta.metaDiaria
                    : totalFilaHoje + concluidosHoje}
                </span>
              </div>
            )}
            {!focusMode && (
              <div className="flex items-center gap-2">
                {syncStatus === 'saving' && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" title="Sincronizando..." />}
                {syncStatus === 'saved' && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Sincronizado com nuvem ✓" />}
                {syncStatus === 'offline' && <span className="w-2 h-2 rounded-full bg-red-500" title="Modo Offline" />}

                <button
                  type="button"
                  onClick={() => setPlat(plat === "res" ? "vest" : "res")}
                  className="md:hidden px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-sky-500/20 border border-blue-500/30 text-blue-300 hover:text-white flex items-center justify-center text-[10.5px] font-black tracking-wide uppercase shrink-0 transition-all active:scale-95 cursor-pointer"
                  title="Alternar Foco"
                >
                  {plat === "res" ? "Residência" : "Vestibular"}
                </button>
                <button
                  type="button"
                  onClick={() => openAjustes({ initialTab: "ajustes" })}
                  className="md:hidden p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center"
                  title="Ajustes"
                >
                  <Settings size={13} />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={toggleFocusMode}
              className={`px-3 py-1 rounded-xl text-[12px] font-bold transition-all border flex items-center gap-1 ${
                focusMode
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
              }`}
            >
              {focusMode ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{focusMode ? "Foco On" : "Modo Foco"}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-7 md:py-6 pb-28 md:pb-6">
          {view === "login" && (
            <AuthModal
              onSuccess={() => {
                setCarregandoAuth(true);
                setSyncStatus("saving");
              }}
            />
          )}


          {view === "dash" && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <Dashboard
                onStudy={handleStudyTrigger}
                onStudyGroup={(groupId) => handleStudyTrigger({ groupId })}
                onDelete={(id) => {
                  deleteTema(plat, id);
                  showToast("🗑 Tema deletado");
                }}
                userName={userName}
                onEditName={() => setEditName(true)}
                focusMode={focusMode}
                modoSimples={modoSimples}
                toggleModoSimples={toggleModoSimples}
                concluidosHoje={concluidosHoje}
                totalFilaHoje={totalFilaHoje}
                setView={setView}
                showToast={showToast}
                onOpenAjustes={openAjustes}
                onOpenAgenda={openPlanAgenda}
                onOpenClinicalCase={openClinicalCase}
                onOpenVestWeeklyPlan={openVestWeeklyPlan}
              />
            </ErrorBoundary>
          )}
          {view === "more" && (
            <MoreToolsHub items={moreNavItems} onOpen={openFromMore} />
          )}
          {view === "crono" && plat === "res" && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <Cronograma
                onStep={handleStudyTrigger}
                onEdit={(t) => setTemaEdit(t)}
                navigationTarget={planNavigationTarget}
                onNavigationTargetConsumed={() => setPlanNavigationTarget(null)}
                onIniciarTema={(temaConfig) => {
                  if (!checkWorkloadAndWarn()) return;
                  const startPatch = {
                    unstarted: false,
                    d0: todayStr(),
                    ...(temaConfig.obs ? { obs: temaConfig.obs } : {}),
                    ...(temaConfig.courseLocation ? { courseLocation: temaConfig.courseLocation } : {}),
                  };
                  if (temaConfig.id) {
                    updateTema(plat, temaConfig.id, startPatch);
                    handleStudyTrigger(temaConfig.id, "d0");
                  } else {
                    const existing = temas.find(t => t.nome === temaConfig.nome);
                    if (existing) {
                      updateTema(plat, existing.id, startPatch);
                      handleStudyTrigger(existing.id, "d0");
                    } else {
                      const novoId = Date.now();
                      addTema(plat, { ...temaConfig, id: novoId, d0: todayStr() });
                      handleStudyTrigger(novoId, "d0");
                    }
                  }
                }}
              />
            </ErrorBoundary>
          )}
          {view === "crono" && plat === "vest" && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <CronogramaVestHub
                onStep={handleStudyTrigger}
                onEdit={(t) => setTemaEdit(t)}
                initialSubView={vestCronoSubViewTarget}
                onSubViewTargetConsumed={() => setVestCronoSubViewTarget(null)}
                onIniciarTema={(temaConfig) => {
                  if (!checkWorkloadAndWarn()) return;
                  const startPatch = {
                    unstarted: false,
                    d0: todayStr(),
                    ...(temaConfig.obs ? { obs: temaConfig.obs } : {}),
                    ...(temaConfig.courseLocation ? { courseLocation: temaConfig.courseLocation } : {}),
                  };
                  if (temaConfig.id) {
                    updateTema(plat, temaConfig.id, startPatch);
                    handleStudyTrigger(temaConfig.id, "d0");
                  } else {
                    const existing = temas.find(t => t.nome === temaConfig.nome);
                    if (existing) {
                      updateTema(plat, existing.id, startPatch);
                      handleStudyTrigger(existing.id, "d0");
                    } else {
                      const novoId = Date.now();
                      addTema(plat, { ...temaConfig, id: novoId, d0: todayStr() });
                      handleStudyTrigger(novoId, "d0");
                    }
                  }
                }}
              />
            </ErrorBoundary>
          )}
          {view === "banco" && <BancoDados />}
          {view === "stats" && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <StatsPanel setView={setView} />
            </ErrorBoundary>
          )}
          {view === NAV_VIEW.WEEKLY_REVIEW && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <WeeklyReview onAdjust={() => setView("crono")} />
            </ErrorBoundary>
          )}
          {view === NAV_VIEW.DATA_SAFETY && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <DataSafetyPanel />
            </ErrorBoundary>
          )}
          {view === NAV_VIEW.LAUNCH_CHECKLIST && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <LaunchChecklistPanel />
            </ErrorBoundary>
          )}
          {view === "sims" && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <Simulados onStudy={handleStudyTrigger} setView={setView} />
            </ErrorBoundary>
          )}
          {view === "anki" && <AnkiAudit />}
          {view === "raciocinio" && featureEnabled(plat, "raciocinioClinico") && meta.modulos?.raciocinioClinico === true && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <Suspense fallback={<div className="p-4 text-xs text-gray-500">Carregando módulo...</div>}>
                <RaciocinioClinico
                  onStudy={handleStudyTrigger}
                  setView={setView}
                  navigationTarget={clinicalNavigationTarget}
                  onNavigationTargetConsumed={() => setClinicalNavigationTarget(null)}
                />
              </Suspense>
            </ErrorBoundary>
          )}
          {view === "academia" && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <AcademiaMetodo />
            </ErrorBoundary>
          )}
          {view === "conquistas" && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <Conquistas />
            </ErrorBoundary>
          )}
        </main>
      </div>

      <BottomNav
        view={view}
        setView={setView}
        onOpenAjustes={() => openAjustes({ initialTab: "ajustes" })}
        onOpenHelp={() => setHelpModal(true)}
      />

      {/* Renderização de Modais */}
      {temaEdit !== null && (
        <TemaModal
          initial={temaEdit}
          platKey={plat}
          onSave={handleSaveTema}
          onCancel={() => setTemaEdit(null)}
          onDelete={(id) => {
            deleteTema(plat, id);
            setTemaEdit(null);
            showToast("🗑 Tema removido");
          }}
        />
      )}
      {ajustes && (
        <AjustesModal
          onClose={() => setAjustes(false)}
          overdueCount={overdueCount}
          onResetOnboarding={resetOnboarding}
          initialTab={ajustesContext.initialTab}
          authScope={authSession}
          syncStatus={syncStatus}
        />
      )}
      {lojaOpen && (
        <LojaModal onClose={() => setLojaOpen(false)} />
      )}

      <PomodoroWidget />
      {showConfetti && <ConfettiOverlay />}
      {showCheckmark && (
        <CheckmarkOverlay onComplete={() => setShowCheckmark(false)} />
      )}
      {cycleComplete && (
        <CycleCompleteModal tema={cycleComplete} onClose={() => setCycleComplete(null)} />
      )}
      {helpModal && <HelpModal onClose={() => setHelpModal(false)} />}

      {editName && (
        <Modal onClose={() => setEditName(false)}>
          <h2 className="text-[14px] font-bold text-white mb-2">Alterar Identificação</h2>
          <Input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <Btn className="w-full mt-3" onClick={() => setEditName(false)}>
            Atualizar
          </Btn>
        </Modal>
      )}

      {showGlobalSearch && (
        <GlobalSearchModal
          onClose={() => setShowGlobalSearch(false)}
          temas={temas}
          plat={plat}
          onSelectTema={(t) => {
            const firstUndoneStep = STEPS.find(s => !t.rev[s.key]?.done);
            if (firstUndoneStep) {
              handleStudyTrigger(t.id, firstUndoneStep.key);
            } else {
              setView("banco");
              showToast(`Tema concluído! Abrindo Banco de Dados.`);
            }
          }}
          onIniciarTema={(catalogItem) => {
            if (!checkWorkloadAndWarn()) return;
            const novoId = Date.now();
            addTema(plat, {
              nome: catalogItem.nome,
              esp: catalogItem.esp,
              prio: catalogItem.prio || "Média",
              importancia: prioToImportancia(catalogItem.prio),
              obs: catalogItem.blockName,
              courseLocation: catalogItem.courseLocation || null,
              pico: "",
              ankiDeck: "",
              id: novoId,
              d0: todayStr(),
            });
            handleStudyTrigger(novoId, "d0");
          }}
        />
      )}

      <Toast
        toast={toast}
        onUndo={() => {
          undo();
          dismissToast();
          showToast("✓ Desfeito!");
        }}
        onDismiss={dismissToast}
      />
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        cancelLabel={confirmDialog?.cancelLabel}
        danger={confirmDialog?.danger}
        onCancel={closeConfirm}
        onConfirm={() => {
          const action = confirmDialog?.onConfirm;
          closeConfirm();
          action?.();
        }}
      />
    </div>
  );
}
