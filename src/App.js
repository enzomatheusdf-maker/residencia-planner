// src/App.js
// Main entry point for MedRev - Clean & Modular Architecture
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AlertCircle, Eye, EyeOff, Settings } from "lucide-react";

// Camada Core & State
import { useStore } from "./core/store";
import { STEPS, isOverdue, todayStr, normalizeTema } from "./core/fsrs";

// Camada de Hooks/Estatísticas
import { calcFilaInteligente } from "./hooks/useMetrics";
import { getMentorPhrase, getRecentPhrases } from "./core/mentor";

// Camada de Serviços
import {
  monitorarAuth,
  sincronizarComFirebase,
  carregarDadosUsuario,
  fazerLogout
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
import FocusMode from "./components/FocusMode";
import AuthModal from "./components/AuthModal";

// Modais e Primitivos
import {
  HelpModal,
  CycleCompleteModal,
  OnboardingModal,
  TemaModal,
  AjustesModal,
  GlobalSearchModal
} from "./components/Modals";

import {
  MedRevLogo,
  Btn,
  Input,
  Toast,
  ConfettiOverlay,
  Modal,
  playTick,
  CheckmarkOverlay
} from "./components/Primitives";

/* ERROR BOUNDARY ─────────────────────────────────────────────────────────────── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-[13px] text-red-400 font-semibold">
            Instabilidade detectada na renderização.
          </p>
          <Btn onClick={() => this.setState({ error: null })} variant="ghost">
            Reiniciar Módulo
          </Btn>
        </div>
      );
    }
    return this.props.children;
  }
}

/* APP ROOT MAIN ENTRY ────────────────────────────────────────────────────────── */
export default function App() {
  const {
    plat,
    setPlat,
    meta,
    setMeta,
    pushUndo,
    undo,
    markStep,
    addTema,
    updateTema,
    deleteTema,
    userName,
    setUserName,
    onboardingDone,
    resetOnboarding,
    focusMode,
    toggleFocusMode,
    modoSimples,
    toggleModoSimples,
    setBrainDumpD1,
    addTemaStats,
    resetStore,
    tourStep,
    setTourStep
  } = useStore();

  const temas = useStore((s) => s[plat]?.temas || []);

  // ─── AUTENTICAÇÃO FIREBASE ────────────────────────────────────────────────
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const [view, setView] = useState("login");
  const [helpModal, setHelpModal] = useState(false);

  const [toast, setToast] = useState(null);
  const [temaEdit, setTemaEdit] = useState(null);
  const [ajustes, setAjustes] = useState(false);
  const [editName, setEditName] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [cycleComplete, setCycleComplete] = useState(null);
  const [targetedFocusItem, setTargetedFocusItem] = useState(null);
  const [syncStatus, setSyncStatus] = useState(navigator.onLine ? "saved" : "offline");
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

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
    let isMounted = true;
    let timeoutId;

    const unsubscribe = monitorarAuth(async (user) => {
      if (!isMounted) return;
      console.log("🔐 monitorarAuth callback:", user ? `Logado como ${user.email}` : "NÃO logado");

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
            console.log("📥 Dados remotos do Firebase são mais recentes. Atualizando Zustand.");

            const normalizePlatTemas = (platObj, initialPlatObj) => {
              if (!platObj) return initialPlatObj;
              const temasList = Array.isArray(platObj.temas) ? platObj.temas : [];
              return {
                ...initialPlatObj,
                ...platObj,
                temas: temasList.map(t => normalizeTema(t))
              };
            };

            const resolvedOnboardingDone = currentState.onboardingDone || (dados.onboardingDone ?? false);

            const firebaseVest = dados.vest || {};
            const resolvedVest = (firebaseVest.temas?.length > 0)
              ? firebaseVest
              : { ...currentState.vest, ...(firebaseVest || {}), temas: currentState.vest.temas };

            useStore.setState({
              plat: dados.plat || "res",
              userName: dados.userName || user.displayName || user.email?.split("@")[0] || "Estudante",
              userEmail: user.email || "",
              meta: dados.meta || { dataProva: "2026-10-25", acerto: 85, metaDiaria: 0 },
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
            console.log("📤 Estado do localStorage é mais recente ou igual. Sincronizando com Firebase.");
            const stateToSave = {
              plat: currentState.plat,
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
        console.log("⚠️ Firebase auth timeout - terminando carregamento");
        setCarregandoAuth(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [setUserName, setPlat, setMeta]);

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



  const filaHoje = useMemo(() => calcFilaInteligente(temas), [temas]);
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

  const showToast = useCallback((msg, withUndo = false) => setToast({ msg, undo: withUndo }), []);
  const dismissToast = useCallback(() => setToast(null), []);

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
        });
        markStep(plat, temaId, "d1", {
          acerto: 1.0,
          questoes: 1,
          motivosErro: [],
        });
        showToast("🧠 Brain Dump consolidado e gravado no perfil!");
      } else if (stepKey === "d0") {
        pushUndo(plat);
        markStep(plat, temaId, "d0", {
          acerto: markData.acerto !== undefined ? markData.acerto : 1.0,
          questoes: markData.questoes !== undefined ? markData.questoes : 0,
          motivosErro: markData.motivosErro || [],
          erros: markData.erros || [],
        });
        addTemaStats(temaId, {
          stepKey: "d0",
          acerto: markData.acerto !== undefined ? markData.acerto : 1.0,
          questoes: markData.questoes !== undefined ? markData.questoes : 0,
          motivosErro: markData.motivosErro || [],
          erros: markData.erros || [],
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
          questoes: markData.questoes,
          motivosErro: markData.motivosErro,
          erros: markData.erros || [],
        });
        addTemaStats(temaId, {
          stepKey,
          acerto: markData.acerto,
          questoes: markData.questoes,
          motivosErro: markData.motivosErro,
          erros: markData.erros || [],
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
            }
          }, 100);
        }

        showToast(`✓ Etapa computada com sucesso!`, true);
      }

      // Milestone check
      const allDone = Object.values(useStore.getState().temaStats).flat().length + 1;
      if ([7, 14, 30, 100, 200].includes(allDone)) {
        setTimeout(() => showToast(`🎯 Marco de ${allDone} revisões concluídas!`), 1500);
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
    [plat, pushUndo, setBrainDumpD1, addTemaStats, markStep, updateTema, showToast, meta.metaDiaria, concluidosHoje]
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
        {!onboardingDone && !tourStep && (
          <OnboardingModal
            onComplete={(nome, foco, metaConfig) => {
              setUserName(nome);
              setPlat(foco);
              if (metaConfig) setMeta({ ...meta, ...metaConfig });
              setTourStep("crono");
              setView("crono");
            }}
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
      {!onboardingDone && !tourStep && (
        <OnboardingModal
          onComplete={(nome, foco, metaConfig) => {
            setUserName(nome);
            setPlat(foco);
            if (metaConfig) setMeta({ ...meta, ...metaConfig });
            setTourStep("crono");
            setView("crono");
          }}
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
        onLogout={async () => {
          const state = useStore.getState();
          const stateToSave = {
            plat: state.plat,
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
                    className="h-full bg-violet-600 transition-all"
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
                  ? "bg-violet-600 text-white border-violet-500"
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
            <ErrorBoundary>
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
              />
            </ErrorBoundary>
          )}
          {view === "crono" && plat === "res" && (
            <Cronograma
              onStep={handleStudyTrigger}
              onEdit={(t) => setTemaEdit(t)}
              onIniciarTema={(temaConfig) => {
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
            <ErrorBoundary>
              <CronogramaVestHub
                onStep={handleStudyTrigger}
                onEdit={(t) => setTemaEdit(t)}
                onIniciarTema={(temaConfig) => {
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
            <ErrorBoundary>
              <StatsPanel />
            </ErrorBoundary>
          )}
          {view === "sims" && (
            <ErrorBoundary>
              <Simulados />
            </ErrorBoundary>
          )}
          {view === "anki" && <AnkiAudit />}
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
            const novoId = Date.now();
            addTema(plat, {
              nome: catalogItem.nome,
              esp: catalogItem.esp,
              prio: catalogItem.prio || "Média",
              importancia: "ALTA",
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
    </div>
  );
}