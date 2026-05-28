// src/App.js
// Main entry point for MedRev - Clean & Modular Architecture
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AlertCircle, Eye, EyeOff, X } from "lucide-react";

// Camada Core & State
import { useStore } from "./core/store";
import { STEPS, isOverdue, todayStr } from "./core/fsrs";

// Camada de Hooks/Estatísticas
import { calcFilaInteligente } from "./hooks/useMetrics";

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
import CronogramaCecilia from "./components/CronogramaCecilia_MEGA";
import BancoDados from "./components/BancoDados";
import StatsPanel from "./components/StatsPanel";
import Simulados from "./components/Simulados";
import AnkiAudit from "./components/AnkiAudit";
import SessaoPage from "./components/SessaoPage";
import AuthModal from "./components/AuthModal";

// Modais e Primitivos
import {
  HelpModal,
  CycleCompleteModal,
  OnboardingModal,
  MarkModal,
  TemaModal,
  AjustesModal,
  BrainDumpD1Modal
} from "./components/Modals";

import {
  MedRevLogo,
  Btn,
  Input,
  Toast,
  ConfettiOverlay,
  Modal
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
    setOnboardingDone,
    resetOnboarding,
    focusMode,
    toggleFocusMode,
    modoSimples,
    toggleModoSimples,
    setBrainDumpD1,
    addTemaStats,
    resetStore
  } = useStore();

  const temas = useStore((s) => s[plat]?.temas || []);

  // ─── AUTENTICAÇÃO FIREBASE ────────────────────────────────────────────────
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const [view, setView] = useState("login");
  const [temaParaIniciar, setTemaParaIniciar] = useState(null);
  const [interactiveBrainDump, setInteractiveBrainDump] = useState(null);
  const [helpModal, setHelpModal] = useState(false);

  const [toast, setToast] = useState(null);
  const [marking, setMarking] = useState(null);
  const [temaEdit, setTemaEdit] = useState(null);
  const [ajustes, setAjustes] = useState(false);
  const [editName, setEditName] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cycleComplete, setCycleComplete] = useState(null);

  // ─── MONITORAR AUTENTICAÇÃO E CARREGAR DADOS DO FIREBASE ───────────────────
  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const unsubscribe = monitorarAuth(async (user) => {
      if (!isMounted) return;
      console.log("🔐 monitorarAuth callback:", user ? `Logado como ${user.email}` : "NÃO logado");

      if (user) {
        setUsuarioLogado(user);
        setUserName(user.displayName || user.email);

        // Carregar dados completos do Firebase
        const resultado = await carregarDadosUsuario(user.uid);
        if (resultado.sucesso) {
          const dados = resultado.dados;
          useStore.setState({
            plat: dados.plat || "res",
            userName: dados.userName || dados.nome || "Estudante",
            meta: dados.meta || { dataProva: "2026-10-25", acerto: 85, metaDiaria: 0 },
            res: dados.res || { temas: [], simulados: [], ankiLog: [], cronogramas: [] },
            vest: dados.vest || { temas: [], simulados: [], ankiLog: [], cronogramas: [] },
            onboardingDone: dados.onboardingDone ?? false,
            focusMode: dados.focusMode ?? false,
            modoSimples: dados.modoSimples ?? true,
            brainDumpD1Data: dados.brainDumpD1Data || {},
            temaStats: dados.temaStats || {},
          });
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
    const unsubscribe = useStore.subscribe((state) => {
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
        };
        sincronizarComFirebase(usuarioLogado.uid, stateToSave)
          .catch((err) => console.error("Erro na sincronização reativa:", err));
      }, 3000); // 3 seconds debounce
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [usuarioLogado]);

  // ─── BLINDAGEM DE TRANSIÇÃO (EVITAR TELA PRETA) ────────────────────────────
  useEffect(() => {
    if (view === "sessao" && !temaParaIniciar) {
      setView("dash");
    }
  }, [view, temaParaIniciar]);

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

  const handleMarkConfirm = useCallback(
    ({ acerto, questoes, motivosErro }) => {
      if (!marking) return;
      pushUndo(plat);
      markStep(plat, marking.temaId, marking.stepKey, { acerto, questoes, motivosErro });
      addTemaStats(marking.temaId, { stepKey: marking.stepKey, acerto, questoes, motivosErro });

      // Detectar D21 (mostrar confetes)
      if (marking.stepKey === "d21") {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);
      }

      // Detectar ciclo completo (após postfix)
      setTimeout(() => {
        const state = useStore.getState();
        const temaAtualizado = state[plat].temas.find((t) => t.id === marking.temaId);
        if (temaAtualizado && STEPS.every((s) => temaAtualizado.rev[s.key].done)) {
          setCycleComplete(temaAtualizado);
        }
      }, 100);

      // Detectar milestones de streak
      const allDone = Object.values(useStore.getState().temaStats).flat().length + 1;
      if ([7, 14, 30, 100, 200].includes(allDone)) {
        setTimeout(() => showToast(`🎯 Marco de ${allDone} revisões concluídas!`), 1500);
      }

      // Detectar meta diária atingida
      if ((meta.metaDiaria || 0) > 0 && concluidosHoje + 1 >= meta.metaDiaria) {
        setTimeout(
          () => showToast(`🎯 Meta diária atingida! Volte amanhã para manter o streak`),
          1500
        );
      }

      setMarking(null);
      showToast(`✓ Etapa computada com sucesso!`, true);
    },
    [marking, plat, pushUndo, markStep, showToast, addTemaStats, meta.metaDiaria, concluidosHoje]
  );

  const handleSaveTema = useCallback(
    (f) => {
      pushUndo(plat);
      if (!temaEdit?.id) {
        addTema(plat, f);
        showToast(`✓ "${f.nome}" acoplado à grade`, true);
      } else {
        updateTema(plat, temaEdit.id, f);
        showToast("✓ Configurações do tema atualizadas", true);
      }
      setTemaEdit(null);
    },
    [plat, temaEdit, pushUndo, addTema, updateTema, showToast]
  );

  const handleStudyTrigger = (temaId, stepKey) => {
    const targetTema = temas.find((t) => t.id === temaId);
    if (!targetTema) return;
    if (stepKey === "d1") {
      setInteractiveBrainDump({ tema: targetTema, stepKey });
    } else {
      setMarking({ temaId, stepKey });
    }
  };

  const handleBrainDumpComplete = (fields) => {
    if (!interactiveBrainDump) return;
    pushUndo(plat);
    setBrainDumpD1(interactiveBrainDump.tema.id, {
      ...fields,
      completedAt: new Date().toISOString(),
    });
    addTemaStats(interactiveBrainDump.tema.id, {
      stepKey: interactiveBrainDump.stepKey,
      brainDump: true,
      ...fields,
    });
    markStep(plat, interactiveBrainDump.tema.id, interactiveBrainDump.stepKey, {
      acerto: 1.0,
      questoes: 1,
      motivosErro: [],
    });
    setInteractiveBrainDump(null);
    showToast("🧠 Brain Dump consolidado e gravado no perfil!");
  };

  // ─── CARREGANDO AUTH ───────────────────────────────────────────────────────
  if (carregandoAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#07070f]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Carregando...</p>
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
          setView("dash");
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#07070f] text-white font-sans antialiased overflow-hidden">
      {!onboardingDone && (
        <OnboardingModal
          onComplete={(nome, foco, metaConfig) => {
            setUserName(nome);
            setPlat(foco);
            if (metaConfig) setMeta(metaConfig);
            setOnboardingDone();
          }}
        />
      )}
      <Sidebar
        view={view}
        setView={setView}
        setAjustes={setAjustes}
        overdueCount={overdueCount}
        setHelpModal={setHelpModal}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-[#07070f]/95 border-b border-white/5 shrink-0 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <MedRevLogo size="sm" />
            </div>
            <span className="hidden sm:inline-flex text-[10px] font-bold text-gray-600 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              v7.1
            </span>
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

            {/* Perfil & Sair */}
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] text-gray-600">logado como</p>
                <p className="text-[11px] font-bold text-gray-300 truncate max-w-[100px]">
                  {usuarioLogado?.displayName || usuarioLogado?.email?.split("@")[0]}
                </p>
              </div>
              <button
                title="Sair"
                onClick={async () => {
                  const state = useStore.getState();
                  await sincronizarComFirebase(usuarioLogado.uid, {
                    plat: state.plat,
                    userName: state.userName,
                    temas: state[state.plat]?.temas || [],
                    meta: state.meta,
                    res: state.res,
                    vest: state.vest,
                    onboardingDone: state.onboardingDone,
                    focusMode: state.focusMode,
                    modoSimples: state.modoSimples,
                    brainDumpD1Data: state.brainDumpD1Data,
                    temaStats: state.temaStats,
                  });
                  await fazerLogout();
                  resetStore();
                  setUsuarioLogado(null);
                }}
                className="p-1.5 rounded-lg text-[11px] font-bold bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all border border-red-600/30 flex items-center gap-1"
              >
                <X size={14} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-7 md:py-6 pb-28 md:pb-6">
          {view === "login" && (
            <AuthModal
              onSuccess={(user) => {
                setUsuarioLogado(user);
                setView("dash");
              }}
            />
          )}
          {view === "sessao" && temaParaIniciar && (
            <SessaoPage
              temaInicial={temaParaIniciar}
              onCancel={() => {
                setTemaParaIniciar(null);
                setView("crono");
              }}
              onComplete={(temaCompletado) => {
                const novoId = Date.now();
                addTema(plat, { ...temaCompletado, id: novoId, d0: todayStr() });
                setMarking({ temaId: novoId, stepKey: "d0" });
                setTemaParaIniciar(null);
                setView("dash");
              }}
            />
          )}

          {view === "dash" && (
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
            />
          )}
          {view === "crono" && plat === "res" && (
            <Cronograma
              onStep={handleStudyTrigger}
              onEdit={(t) => setTemaEdit(t)}
              onIniciarTema={(tema) => {
                setTemaParaIniciar(tema);
                setView("sessao");
              }}
            />
          )}
          {view === "crono" && plat === "vest" && (
            <ErrorBoundary>
              <CronogramaCecilia />
            </ErrorBoundary>
          )}
          {view === "banco" && <BancoDados />}
          {view === "stats" && <StatsPanel />}
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
      {marking && temas.find((t) => t.id === marking.temaId) && (
        <MarkModal
          tema={temas.find((t) => t.id === marking.temaId)}
          stepKey={marking.stepKey}
          onConfirm={handleMarkConfirm}
          onCancel={() => setMarking(null)}
        />
      )}
      {interactiveBrainDump && (
        <BrainDumpD1Modal
          tema={interactiveBrainDump.tema}
          onConfirm={handleBrainDumpComplete}
          onCancel={() => setInteractiveBrainDump(null)}
        />
      )}
      {temaEdit !== null && (
        <TemaModal
          initial={temaEdit?.id ? temaEdit : null}
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