// src/App.js
// Main entry point for MedRev - Clean & Modular Architecture
import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import { Eye, EyeOff, Settings } from "lucide-react";

// Camada Core & State
import { useStore } from "./core/store";
import { STEPS, isOverdue, todayStr, normalizeTema, getWorkloadProjection } from "./core/fsrs";
import { xpForReview } from "./core/gamif";
import { ACHIEVEMENTS } from "./core/achievements";
import { getReadinessData } from "./core/readiness";
import { exportMedrevBackup } from "./core/backup";
import { applyOnboardingChoice, getOnboardingDefaults, isOnboardingComplete } from "./core/onboarding";
import { featureEnabled } from "./core/platformFeatures";

// Camada de Hooks/Estatísticas
import { useFilaInteligente } from "./hooks/useMetrics";
import { getMentorPhrase, getRecentPhrases, trackRecentPhrase } from "./core/mentor";

// Camada de Serviços
import {
  monitorarAuth,
  sincronizarComFirebase,
  carregarDadosUsuario,
  fazerLogout,
  trackEvent
} from "./services/firebase";

// Camada de Componentes
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import Dashboard from "./components/Dashboard";
import Cronograma from "./components/Cronograma";
import CronogramaVestHub from "./components/CronogramaVestHub";
import BancoDados from "./components/BancoDados";
import StatsPanel from "./components/StatsPanel";
import Simulados from "./components/Simulados";
import AnkiAudit from "./components/AnkiAudit";
import AcademiaMetodo from "./components/AcademiaMetodo";
import FocusMode from "./components/FocusMode";
import AuthModal from "./components/AuthModal";
import OnboardingWizard from "./components/OnboardingWizard";
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
function prioToImportancia(prio) {
  switch ((prio || "").toLowerCase()) {
    case "diamante": return "CRITICA";
    case "alta":     return "ALTA";
    case "média": case "media": return "MEDIA";
    case "baixa": case "bônus": case "bonus": return "MEDIA";
    default: return "ALTA";
  }
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

  const [view, setView] = useState("login");
  const [helpModal, setHelpModal] = useState(false);

  const [temaEdit, setTemaEdit] = useState(null);
  const [ajustes, setAjustes] = useState(false);
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
  const shouldShowOnboarding = !onboardingCompleted && !tourStep;

  const exportBackupNow = useCallback(() => {
    try {
      const backup = exportMedrevBackup(useStore.getState());
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
  }, [showToastStore]);

  useEffect(() => {
    if (!usuarioLogado || trackedReturnRef.current) return;
    const lastActive = useStore.getState().meta?.lastActiveDate;
    if (!lastActive) return;
    const gap = Math.max(0, Math.round((new Date(todayStr()) - new Date(lastActive)) / (1000 * 60 * 60 * 24)));
    if (gap >= 1) {
      trackEvent(gap >= 7 ? "retorno_d7" : "retorno_d1", { gap_dias: gap, uid: usuarioLogado.uid });
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
    
    const readiness = getReadinessData({
      temas: currentTemas,
      simulados: currentSims,
      meta: currentMeta,
      plat: currentPlat
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

      if (user) {
        setUsuarioLogado(user);
        
        // Instant updates to Zustand state:
        useStore.setState({
          userName: user.displayName || user.email?.split("@")[0] || "Estudante",
          userEmail: user.email || ""
        });

        // Carregar dados completos do Firebase
        const resultado = await carregarDadosUsuario(user.uid);
        if (resultado.sucesso) {
          const dados = resultado.dados;
          const currentState = useStore.getState();

          const remoteTime = dados.updatedAt || 0;
          const localTime = currentState.updatedAt || 0;

          if (remoteTime > localTime) {
            if (Math.abs(remoteTime - localTime) > 24 * 60 * 60 * 1000) {
              showToastStore("Dados da nuvem mais recentes — atualizando.");
            }

            const normalizePlatTemas = (platObj, initialPlatObj) => {
              if (!platObj) return initialPlatObj;
              const temasList = Array.isArray(platObj.temas) ? platObj.temas : [];
              return {
                ...initialPlatObj,
                ...platObj,
                temas: temasList.map(t => normalizeTema(t))
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
            const resolvedOnboardingDone = currentState.onboardingDone || (dados.onboardingDone ?? false) || resolvedOnboarding.completed === true;

            const firebaseVest = dados.vest || {};
            const resolvedVest = (firebaseVest.temas?.length > 0)
              ? firebaseVest
              : { ...currentState.vest, ...(firebaseVest || {}), temas: currentState.vest.temas };

            useStore.setState({
              plat: dados.plat || "res",
              cronogramaSel: dados.cronogramaSel || currentState.cronogramaSel,
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
              brainDumpD1Data: dados.brainDumpD1Data || {},
              temaStats: dados.temaStats || {},
              vistos: dados.vistos || [],
              sprint: dados.sprint || currentState.sprint || { esps: [], ativa: false, semana: "" },
              updatedAt: remoteTime,
            });
          } else {
            const stateToSave = {
              plat: currentState.plat,
              cronogramaSel: currentState.cronogramaSel,
              gamif: currentState.gamif,
              meta: currentState.meta,
              res: currentState.res,
              vest: currentState.vest,
              userName: currentState.userName,
              onboardingDone: currentState.onboardingDone,
              focusMode: currentState.focusMode,
              modoSimples: currentState.modoSimples,
              brainDumpD1Data: currentState.brainDumpD1Data,
              temaStats: currentState.temaStats,
              vistos: currentState.vistos || [],
              sprint: currentState.sprint,
              updatedAt: localTime || Date.now(),
            };
            sincronizarComFirebase(user.uid, stateToSave)
              .catch((err) => console.error("Erro ao sincronizar dados locais mais recentes:", err));
          }
          setView("dash");
        } else {
          setView("dash");
        }
      } else {
        setUsuarioLogado(null);
        setView("login");
      }

      if (isMounted) {
        setCarregandoAuth(false);
        clearTimeout(timeoutId);
      }
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
      unsubscribe();
    };
  }, [setUserName, setPlat, showToastStore]);

  // ─── SINCRONIZAR DADOS COM FIREBASE (AO MUDAR ESTADO) ──────────────────────
  useEffect(() => {
    if (!usuarioLogado) return;

    let timeoutId;
    let lastSavedJSON = "";

    const unsubscribe = useStore.subscribe((state) => {
      setSyncStatus((current) => (current === "offline" ? "offline" : "saving"));
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const stateToSave = {
          plat: state.plat,
          cronogramaSel: state.cronogramaSel,
          gamif: state.gamif,
          meta: state.meta,
          res: state.res,
          vest: state.vest,
          userName: state.userName,
          onboardingDone: state.onboardingDone,
          focusMode: state.focusMode,
          modoSimples: state.modoSimples,
          brainDumpD1Data: state.brainDumpD1Data,
          temaStats: state.temaStats,
          vistos: state.vistos || [],
          sprint: state.sprint,
          updatedAt: state.updatedAt || Date.now(),
        };

        const { updatedAt, ...dataToCompare } = stateToSave;
        const currentJSON = JSON.stringify(dataToCompare);
        if (currentJSON === lastSavedJSON) {
          setSyncStatus("saved");
          return;
        }

        lastSavedJSON = currentJSON;
        setSyncStatus("saving");
        sincronizarComFirebase(usuarioLogado.uid, stateToSave)
          .then((res) => {
            if (res.sucesso) {
              setSyncStatus("saved");
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
  }, [usuarioLogado]);

  // ─── GARANTIR FLUSH ANTES DE SAIR DA PÁGINA ───────────────────────────────
  useEffect(() => {
    if (!usuarioLogado) return;

    const handleFlush = () => {
      const state = useStore.getState();
      const stateToSave = {
        plat: state.plat,
        cronogramaSel: state.cronogramaSel,
        gamif: state.gamif,
        meta: state.meta,
        res: state.res,
        vest: state.vest,
        userName: state.userName,
        onboardingDone: state.onboardingDone,
        focusMode: state.focusMode,
        modoSimples: state.modoSimples,
        brainDumpD1Data: state.brainDumpD1Data,
        temaStats: state.temaStats,
        vistos: state.vistos || [],
        sprint: state.sprint,
        updatedAt: state.updatedAt || Date.now(),
      };
      sincronizarComFirebase(usuarioLogado.uid, stateToSave)
        .catch((err) => console.error("Erro no flush beforeunload:", err));
    };

    window.addEventListener("beforeunload", handleFlush);
    return () => {
      window.removeEventListener("beforeunload", handleFlush);
    };
  }, [usuarioLogado]);



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
    const exceeds = Object.values(proj).some((count) => count > maxRevisoesDia);
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
          descansoPrescrito: markData.descansoPrescrito
        });
        showToast("🧠 Brain Dump consolidado e gravado no perfil!");
      } else if (stepKey === "d0") {
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
          descansoPrescrito: markData.descansoPrescrito
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
          descansoPrescrito: markData.descansoPrescrito
        });
        updateTema(plat, temaId, {
          pico: markData.pico || "",
          ankiDeck: markData.ankiDeck || "",
        });
        showToast("✓ Tema iniciado com sucesso!");
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
          descansoPrescrito: markData.descansoPrescrito
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
          descansoPrescrito: markData.descansoPrescrito
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

        showToast(`✓ Etapa computada com sucesso!`, true);
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
      const allDone = Object.values(useStore.getState().temaStats).flat().length + 1;
      if ([7, 14, 30, 100, 200].includes(allDone)) {
        setTimeout(() => showToast(`🎯 Marco de ${allDone} revisões concluídas!`), 1500);
      }

      const stateAfterTrack = useStore.getState();
      const analyticsMeta = stateAfterTrack.meta?.analytics || {};
      if (!analyticsMeta.primeira_revisao_done) {
        trackEvent("primeira_revisao", { uid: usuarioLogado?.uid, step: stepKey, plat });
        useStore.setState({
          meta: {
            ...stateAfterTrack.meta,
            analytics: { ...analyticsMeta, primeira_revisao_done: true }
          }
        });
      }
      if (totalFilaHoje === 1 && analyticsMeta.last_zero_day !== todayStr()) {
        trackEvent("revisoes_zeradas_dia", { uid: usuarioLogado?.uid, plat });
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
    [plat, pushUndo, setBrainDumpD1, addTemaStats, markStep, updateTema, showToast, meta.metaDiaria, concluidosHoje, addXp, updateGamifStreak, userName, totalFilaHoje, usuarioLogado?.uid]
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

  // ─── CARREGANDO AUTH ───────────────────────────────────────────────────────
  if (carregandoAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#07070f]">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <MedRevLogo size="lg" showTagline />
          </div>
          <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold font-mono">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // ─── NÃO AUTENTICADO ───────────────────────────────────────────────────────
  if (!usuarioLogado) {
    return (
      <AuthModal
        onSuccess={(user) => {
          setUsuarioLogado(user);
          useStore.setState({
            userName: user.displayName || user.email?.split("@")[0] || "Estudante",
            userEmail: user.email || ""
          });
          setView("dash");
        }}
      />
    );
  }

  if (focusMode) {
    return (
      <div className="flex h-screen bg-[#07070f] text-white font-sans antialiased overflow-hidden">
        {shouldShowOnboarding && (
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
      {shouldShowOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingFinish}
          onSkip={handleOnboardingFinish}
        />
      )}
      <Sidebar
        view={view}
        setView={setView}
        setAjustes={setAjustes}
        overdueCount={overdueCount}
        setHelpModal={setHelpModal}
        usuarioLogado={usuarioLogado}
        syncStatus={syncStatus}
        onOpenLoja={() => setLojaOpen(true)}
        onLogout={async () => {
          const state = useStore.getState();
          const stateToSave = {
            plat: state.plat,
            cronogramaSel: state.cronogramaSel,
            gamif: state.gamif,
            userName: state.userName,
            meta: state.meta,
            res: state.res,
            vest: state.vest,
            onboardingDone: state.onboardingDone,
            focusMode: state.focusMode,
            modoSimples: state.modoSimples,
            brainDumpD1Data: state.brainDumpD1Data,
            temaStats: state.temaStats,
            vistos: state.vistos || [],
            sprint: state.sprint,
            updatedAt: state.updatedAt || Date.now(),
          };
          await sincronizarComFirebase(usuarioLogado.uid, stateToSave);
          await fazerLogout();
          resetStore();
          setUsuarioLogado(null);
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
                  onClick={() => setAjustes(true)}
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
              onSuccess={(user) => {
                setUsuarioLogado(user);
                useStore.setState({
                  userName: user.displayName || user.email?.split("@")[0] || "Estudante",
                  userEmail: user.email || ""
                });
                setView("dash");
              }}
            />
          )}


          {view === "dash" && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <Dashboard
                onStudy={handleStudyTrigger}
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
                onOpenAjustes={() => setAjustes(true)}
              />
            </ErrorBoundary>
          )}
          {view === "crono" && plat === "res" && (
            <Cronograma
              onStep={handleStudyTrigger}
              onEdit={(t) => setTemaEdit(t)}
              onIniciarTema={(temaConfig) => {
                if (!checkWorkloadAndWarn()) return;
                if (temaConfig.id) {
                  updateTema(plat, temaConfig.id, { unstarted: false, d0: todayStr() });
                  handleStudyTrigger(temaConfig.id, "d0");
                } else {
                  const existing = temas.find(t => t.nome === temaConfig.nome);
                  if (existing) {
                    updateTema(plat, existing.id, { unstarted: false, d0: todayStr() });
                    handleStudyTrigger(existing.id, "d0");
                  } else {
                    const novoId = Date.now();
                    addTema(plat, { ...temaConfig, id: novoId, d0: todayStr() });
                    handleStudyTrigger(novoId, "d0");
                  }
                }
              }}
            />
          )}
          {view === "crono" && plat === "vest" && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <CronogramaVestHub
                onStep={handleStudyTrigger}
                onEdit={(t) => setTemaEdit(t)}
                onIniciarTema={(temaConfig) => {
                  if (!checkWorkloadAndWarn()) return;
                  if (temaConfig.id) {
                    updateTema(plat, temaConfig.id, { unstarted: false, d0: todayStr() });
                    handleStudyTrigger(temaConfig.id, "d0");
                  } else {
                    const existing = temas.find(t => t.nome === temaConfig.nome);
                    if (existing) {
                      updateTema(plat, existing.id, { unstarted: false, d0: todayStr() });
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
          {view === "sims" && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <Simulados onStudy={handleStudyTrigger} setView={setView} />
            </ErrorBoundary>
          )}
          {view === "anki" && <AnkiAudit />}
          {view === "raciocinio" && featureEnabled(plat, "raciocinioClinico") && meta.modulos?.raciocinioClinico === true && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <Suspense fallback={<div className="p-4 text-xs text-gray-500">Carregando módulo...</div>}>
                <RaciocinioClinico onStudy={handleStudyTrigger} setView={setView} />
              </Suspense>
            </ErrorBoundary>
          )}
          {view === "academia" && (
            <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
              <AcademiaMetodo />
            </ErrorBoundary>
          )}
        </main>
      </div>

      <BottomNav view={view} setView={setView} />

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
        />
      )}
      {lojaOpen && (
        <LojaModal onClose={() => setLojaOpen(false)} />
      )}

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
          try {
            confirmDialog?.onConfirm?.();
          } finally {
            closeConfirm();
          }
        }}
      />
    </div>
  );
}
