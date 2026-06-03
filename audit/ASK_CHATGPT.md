# ASK_CHATGPT — Auditoria automática

Aja como auditor sênior de engenharia de software. Audite somente o delta abaixo. Procure regressões, bugs, integração incompleta, problemas de arquitetura, encoding, testes, build, UX e riscos de dados persistidos. Priorize P0/P1/P2 e diga exatamente o que corrigir.


## Git status

```txt
 M audit/ASK_CHATGPT.md
 M firestore.rules
 M package.json
 M src/App.js
 M src/components/Dashboard.jsx
 M src/components/DataSafetyPanel.jsx
 M src/components/Modals.jsx
 M src/components/Primitives.jsx
 M src/components/Simulados.jsx
 M src/components/StatsPanel.jsx
 M src/components/WeeklyReview.jsx
 M src/core/backup.js
 M src/core/enamedIntel.js
 M src/core/enamedIntel.test.js
 M src/core/userDataMigration.test.js
 M src/core/userScope.test.js
 M src/services/userDataPaths.js
 M src/services/userDataPaths.test.js
?? MEDREV_AUDITORIA_INCREMENTAL_FUNCOES_RESTANTES.md
?? MEDREV_CODE_AUDIT_SAFETY_UX_VALIDATION_PLAN.md
?? docs/N0_DATA_SAFETY_CODE_AUDIT.md
?? src/core/dailyBriefing.js
?? src/core/dailyBriefing.test.js
?? src/core/dataIntegrity.js
?? src/core/dataIntegrity.test.js
?? src/core/numberInput.js
?? src/core/numberInput.test.js
?? src/core/onboardingGate.js
?? src/core/onboardingGate.test.js
?? src/core/readinessValidation.js
?? src/core/readinessValidation.test.js
?? src/core/telemetry.js
?? src/core/telemetry.test.js
?? src/core/weeklyReviewGate.js
?? src/core/weeklyReviewGate.test.js
?? test-log.txt

```

## Diff stat

```txt
 audit/ASK_CHATGPT.md               | 13217 +----------------------------------
 firestore.rules                    |    24 +-
 package.json                       |     2 +
 src/App.js                         |    11 +-
 src/components/Dashboard.jsx       |   427 +-
 src/components/DataSafetyPanel.jsx |    32 +-
 src/components/Modals.jsx          |    43 +-
 src/components/Primitives.jsx      |    51 +-
 src/components/Simulados.jsx       |     5 +-
 src/components/StatsPanel.jsx      |    40 +-
 src/components/WeeklyReview.jsx    |    83 +-
 src/core/backup.js                 |    10 +
 src/core/enamedIntel.js            |    44 +
 src/core/enamedIntel.test.js       |    13 +
 src/core/userDataMigration.test.js |    10 +-
 src/core/userScope.test.js         |     4 +
 src/services/userDataPaths.js      |     7 +
 src/services/userDataPaths.test.js |    10 +-
 18 files changed, 544 insertions(+), 13489 deletions(-)

```

## Changed files

```txt
audit/ASK_CHATGPT.md
firestore.rules
package.json
src/App.js
src/components/Dashboard.jsx
src/components/DataSafetyPanel.jsx
src/components/Modals.jsx
src/components/Primitives.jsx
src/components/Simulados.jsx
src/components/StatsPanel.jsx
src/components/WeeklyReview.jsx
src/core/backup.js
src/core/enamedIntel.js
src/core/enamedIntel.test.js
src/core/userDataMigration.test.js
src/core/userScope.test.js
src/services/userDataPaths.js
src/services/userDataPaths.test.js

```

## Untracked files

```txt
MEDREV_AUDITORIA_INCREMENTAL_FUNCOES_RESTANTES.md
MEDREV_CODE_AUDIT_SAFETY_UX_VALIDATION_PLAN.md
docs/N0_DATA_SAFETY_CODE_AUDIT.md
src/core/dailyBriefing.js
src/core/dailyBriefing.test.js
src/core/dataIntegrity.js
src/core/dataIntegrity.test.js
src/core/numberInput.js
src/core/numberInput.test.js
src/core/onboardingGate.js
src/core/onboardingGate.test.js
src/core/readinessValidation.js
src/core/readinessValidation.test.js
src/core/telemetry.js
src/core/telemetry.test.js
src/core/weeklyReviewGate.js
src/core/weeklyReviewGate.test.js
test-log.txt

```

## Full diff

```diff
diff --git a/package.json b/package.json
index 3f474f67..c75ceb1c 100644
--- a/package.json
+++ b/package.json
@@ -19,6 +19,8 @@
   "scripts": {
     "check:mojibake": "node scripts/check-mojibake.mjs",
     "audit:encoding": "node scripts/audit-encoding.mjs",
+    "audit:quick": "node scripts/audit.mjs",
+    "audit:full": "node scripts/audit.mjs",
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build",
     "start": "react-scripts start",
diff --git a/src/App.js b/src/App.js
index 2a61fe4a..d986bdd8 100644
--- a/src/App.js
+++ b/src/App.js
@@ -32,8 +32,8 @@ import {
   sincronizarComFirebase,
   carregarDadosUsuario,
   fazerLogout,
-  trackEvent
 } from "./services/firebase";
+import { safeTrackEvent } from "./core/telemetry";
 
 // Camada de Componentes
 import Sidebar from "./components/Sidebar";
@@ -294,7 +294,7 @@ export default function App() {
     if (!lastActive) return;
     const gap = Math.max(0, Math.round((new Date(todayStr()) - new Date(lastActive)) / (1000 * 60 * 60 * 24)));
     if (gap >= 1) {
-      trackEvent(gap >= 7 ? "retorno_d7" : "retorno_d1", { gap_dias: gap, uid: usuarioLogado.uid });
+      safeTrackEvent(gap >= 7 ? "retorno_d7" : "retorno_d1", { gap_dias: gap }, { state: useStore.getState() });
       trackedReturnRef.current = true;
     }
   }, [usuarioLogado]);
@@ -868,16 +868,19 @@ export default function App() {
       const stateAfterTrack = useStore.getState();
       const analyticsMeta = stateAfterTrack.meta?.analytics || {};
       if (!analyticsMeta.primeira_revisao_done) {
-        trackEvent("primeira_revisao", { uid: usuarioLogado?.uid, step: stepKey, plat });
+        safeTrackEvent("activation_first_review_done", { step: stepKey, plat }, { state: useStore.getState() });
+        safeTrackEvent("review_completed", { step: stepKey, plat }, { state: useStore.getState() });
         useStore.setState({
           meta: {
             ...stateAfterTrack.meta,
             analytics: { ...analyticsMeta, primeira_revisao_done: true }
           }
         });
+      } else {
+        safeTrackEvent("review_completed", { step: stepKey, plat }, { state: useStore.getState() });
       }
       if (totalFilaHoje === 1 && analyticsMeta.last_zero_day !== todayStr()) {
-        trackEvent("revisoes_zeradas_dia", { uid: usuarioLogado?.uid, plat });
+        safeTrackEvent("revisoes_zeradas_dia", { plat }, { state: useStore.getState() });
         useStore.setState({
           meta: {
             ...useStore.getState().meta,
diff --git a/src/components/Dashboard.jsx b/src/components/Dashboard.jsx
index b62fb96d..1654393a 100644
--- a/src/components/Dashboard.jsx
+++ b/src/components/Dashboard.jsx
@@ -1,11 +1,10 @@
 // src/components/Dashboard.jsx
-import React, { useMemo, useState, useEffect, useCallback } from "react";
-import { createPortal } from "react-dom";
-import { Edit2, Info, TrendingUp, TrendingDown, CheckCircle, ChevronDown, ChevronUp, Brain, Flame, Calendar, AlertTriangle, X, Zap, BookOpen, Layers, Share2, Unlock, GraduationCap, BarChart3, ClipboardList, Target } from "lucide-react";
+import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
+import { Edit2, Info, TrendingUp, TrendingDown, CheckCircle, ChevronDown, ChevronUp, Brain, Flame, Calendar, AlertTriangle, X, Zap, Layers, Share2, Unlock, GraduationCap, BarChart3, ClipboardList, Target } from "lucide-react";
 import { useStore } from "../core/store";
 import { STEPS, ESP_COLORS, isOverdue, todayStr, addDays, fmtDate, fmtFull, getRetrievability, getWorkloadProjection } from "../core/fsrs";
 import { calcTrueRetention, calcBleedingScore, useFilaInteligente, PESOS_PROVA_VEST } from "../hooks/useMetrics";
-import { getMentorDiagnosis, getMentorVoice, isExhaustionDetected } from "../core/mentor";
+import { getMentorDiagnosis, isExhaustionDetected } from "../core/mentor";
 import { buildMentorContext, getMentorNextAction, getMentorTodayPlan } from "../core/mentorAutopilot";
 import { getReadinessData } from "../core/readiness";
 import { TourBalloon, Modal, Btn, ConfettiOverlay, ProgressiveTooltip, InfoTooltip } from "./Primitives";
@@ -18,11 +17,19 @@ import RetrievabilitySpark from "./RetrievabilitySpark";
 import DicaContextual from "./DicaContextual";
 import TrilhaJornada from "./TrilhaJornada";
 import useCountUp from "../hooks/useCountUp";
-import { trackEvent } from "../services/firebase";
+import { auth } from "../services/firebase";
 import { CALENDAR_PROVIDERS, CALENDAR_PROVIDER_IDS } from "../constants/calendarProviders";
 import { getPeakModePolicy, getPeakPhase } from "../core/peakMode";
 import { parseCatalogEntry } from "../constants/catalogos";
 import { resolveCatalogo, getCronogramaById } from "../constants/cronogramas";
+import { safeTrackEvent } from "../core/telemetry";
+import {
+  buildDailyBriefing,
+  canShowDailyBriefing,
+  dismissDailyBriefing,
+  getDailyBriefingStorageKey,
+} from "../core/dailyBriefing";
+import { getEnamedBottleneckExplanation, getEnamedIntel } from "../core/enamedIntel";
 import ActionInbox from "./ActionInbox";
 import WeeklyReview from "./WeeklyReview";
 import EmptyState from "./EmptyState";
@@ -133,157 +140,61 @@ function getPreparoCalibration({ readinessData, trueRet, totalSessions, temasFil
 }
 
 /* --- WELCOME POPUP --- */
-function WelcomePopup({ userName, pending, streakCurrent, totalSessions, onClose, onStartFocus, meta, naReserva, totalRevisoesFeitas, prontidao, forceFluencia = false, forceExhausted = false }) {
-  const [visible, setVisible] = useState(false);
-
-  useEffect(() => {
-    // pequeno delay para a animação de entrada
-    const t = setTimeout(() => setVisible(true), 80);
-    return () => clearTimeout(t);
-  }, []);
-
-  const { plat } = useStore();
-  const mentorMsg = useMemo(() => {
-    return getMentorVoice({
-      situation: forceFluencia ? "fluencia" : "boas_vindas_diario",
-      userName,
-      pending,
-      streakCurrent,
-      meta: { ...meta, isExhaustedNow: forceExhausted },
-      plat,
-      tom: meta?.tomMentor || "gentil",
-      totalSessions,
-      totalRevisoesFeitas,
-      prontidao
-    });
-  }, [userName, pending, streakCurrent, meta, plat, totalSessions, totalRevisoesFeitas, prontidao, forceFluencia, forceExhausted]);
+function WelcomePopup({ briefing, streakCurrent, onClose, onStartFocus }) {
+  if (!briefing) return null;
 
-  const handleClose = () => {
-    setVisible(false);
-    if (meta?.isRetornoAcolhedor) {
-      useStore.setState({ meta: { ...meta, isRetornoAcolhedor: false } });
-    }
-    setTimeout(onClose, 250);
-  };
-
-  const handleStart = () => {
-    setVisible(false);
-    if (meta?.isRetornoAcolhedor) {
-      useStore.setState({ meta: { ...meta, isRetornoAcolhedor: false } });
-    }
-    setTimeout(onStartFocus, 250);
-  };
-
-  useEffect(() => {
-    const prev = document.body.style.overflow;
-    document.body.style.overflow = "hidden";
-    return () => { document.body.style.overflow = prev; };
-  }, []);
-
-  return createPortal(
-    <div
-      className="fixed inset-0 z-[400] flex items-start sm:items-center justify-center p-4 overflow-y-auto"
-      style={{
-        background: "rgba(5,5,12,0.75)",
-        backdropFilter: "blur(8px)",
-        WebkitBackdropFilter: "blur(8px)",
-        transition: "opacity 0.25s ease",
-        opacity: visible ? 1 : 0,
-      }}
-      onClick={handleClose}
-    >
-      <div
-        className="relative w-full max-w-[min(24rem,calc(100vw-2rem))]"
-        style={{
-          transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
-          transform: visible ? "scale(1) translateY(0)" : "scale(0.93) translateY(16px)",
-          opacity: visible ? 1 : 0,
-        }}
-        onClick={(e) => e.stopPropagation()}
-      >
-        {/* glow ambiental */}
-        <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-blue-600/20 via-sky-600/10 to-transparent blur-3xl pointer-events-none" />
-
-        <div className="relative bg-[var(--surface-2)] border border-blue-500/25 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-950/50">
-          {/* barra de acento superior */}
-          <div className="h-[3px] w-full bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600" />
-
-          {/* header */}
-          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
-            <div className="flex items-center gap-2">
-              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-900/40">
-                <span className="text-sm">🧠</span>
-              </div>
-              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-400">
-                Mentora · MedRev
-              </span>
-            </div>
-            <button
-              onClick={handleClose}
-              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all"
-            >
-              <X size={15} />
-            </button>
-          </div>
+  return (
+    <section className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/35 via-[var(--surface-1)] to-sky-950/20 p-4 shadow-lg shadow-slate-950/30">
+      <div className="flex items-start justify-between gap-3">
+        <div>
+          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">Resumo do dia</p>
+          <h3 className="mt-1 text-sm font-black text-white">{briefing.title}</h3>
+          <p className="mt-1 text-[12px] leading-relaxed text-gray-300">{briefing.priority}</p>
+        </div>
+        <button
+          type="button"
+          onClick={onClose}
+          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 hover:text-gray-200"
+          aria-label="Fechar resumo do dia"
+        >
+          <X size={15} />
+        </button>
+      </div>
 
-          {/* mensagem */}
-          <div className="px-5 py-4">
-            <p className="text-[13px] leading-relaxed text-gray-200 font-semibold">
-              {mentorMsg}
-            </p>
-          </div>
+      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
+        <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
+          <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">Revisões de hoje</p>
+          <p className="mt-1 text-[14px] font-black text-white">{briefing.reviewsToday}</p>
+        </div>
+        <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
+          <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">Tempo estimado</p>
+          <p className="mt-1 text-[14px] font-black text-white">{briefing.estimatedMinutes} min</p>
+        </div>
+        <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
+          <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">Streak</p>
+          <p className="mt-1 text-[14px] font-black text-white">{streakCurrent}/7 dias</p>
+        </div>
+      </div>
 
-          {/* stats row */}
-          {totalSessions > 0 && (
-            <div className="mx-5 mb-4 grid grid-cols-2 gap-2">
-              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
-                <Flame size={14} className={streakCurrent > 0 ? "text-orange-400" : "text-gray-600"} />
-                <div>
-                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Streak</p>
-                  <p className="text-[13px] font-black text-white">{streakCurrent}/7 dias</p>
-                </div>
-              </div>
-              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
-                <BookOpen size={14} className="text-blue-400" />
-                <div>
-                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Hoje</p>
-                  <p className={`text-[13px] font-black ${pending > 0 ? "text-amber-400" : "text-emerald-400"}`}>
-                    {pending > 0 ? `${pending} pendente${pending === 1 ? "" : "s"}${naReserva > 0 ? ` (+${naReserva})` : ""}` : "Fila zerada ✓"}
-                  </p>
-                </div>
-              </div>
-            </div>
-          )}
+      <p className="mt-3 text-[11px] leading-relaxed text-gray-400">{briefing.helperText}</p>
 
-          {/* actions */}
-          <div className="flex flex-col sm:flex-row gap-2 px-5 pb-5">
-            {pending > 0 ? (
-              <button
-                onClick={handleStart}
-                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-black text-[12px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-900/30"
-              >
-                <Zap size={13} />
-                Iniciar Foco Agora
-              </button>
-            ) : (
-              <button
-                onClick={handleClose}
-                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-black text-[12px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-900/30"
-              >
-                Entendido!
-              </button>
-            )}
-            <button
-              onClick={handleClose}
-              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-gray-400 hover:text-gray-200 font-semibold text-[12px] border border-white/8 transition-all w-full sm:w-auto"
-            >
-              Fechar
-            </button>
-          </div>
-        </div>
+      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
+        <button
+          type="button"
+          onClick={onStartFocus}
+          className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2.5 text-[12px] font-black text-white shadow-lg shadow-blue-950/25"
+        >
+          {briefing.primaryCta}
+        </button>
+        <button
+          type="button"
+          onClick={onClose}
+          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[12px] font-semibold text-gray-300"
+        >
+          {briefing.secondaryCta}
+        </button>
       </div>
-    </div>,
-    document.body
+    </section>
   );
 }
 
@@ -398,11 +309,11 @@ function MiniCronogramaWidget({
 
       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 
-        {/* ── Column 1: Curva de revisão hoje ── */}
+        {/* ── Column 1: Revisões de hoje ── */}
         <div className="flex flex-col gap-2 rounded-xl border border-blue-500/15 bg-gradient-to-b from-blue-950/30 to-transparent p-3 min-h-[150px]">
           <div className="flex items-center justify-between">
             <span className="text-[9px] font-black uppercase tracking-wider text-blue-300/70">
-              Curva de revisão hoje
+              Revisões de hoje
             </span>
             <span className={`text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
               dueTodayItems.length === 0
@@ -465,7 +376,7 @@ function MiniCronogramaWidget({
         <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/[0.015] p-3 min-h-[150px]">
           <div className="flex items-center justify-between">
             <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">
-              Cronograma
+              Plano da semana
             </span>
             <div className="flex items-center gap-1.5">
               <span className="text-[8.5px] font-bold text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
@@ -693,8 +604,6 @@ function MetacognitiveChart({ doneReviews }) {
   );
 }
 
-const SESSION_KEY = "medrev_welcome_shown";
-
 function DashboardKpiCard({ label, value, tone = "text-white", children, action, tooltip, className = "", delayMs = 0, icon, accentColor }) {
   return (
     <div
@@ -767,6 +676,7 @@ function DailyProgressRing({ value, goal }) {
 }
 
 export default function Dashboard({ onStudy, onDelete, userName, onEditName, focusMode, modoSimples, toggleModoSimples, setView, showToast, onOpenAjustes }) {
+  const currentUid = auth.currentUser?.uid || null;
   const { plat, sprint, tourStep, setTourStep, setOnboardingDone, onboardingDone } = useStore();
   const showToastGlobal = useStore((s) => s.showToast);
   const openConfirm = useStore((s) => s.openConfirm);
@@ -780,6 +690,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
   const enamedAnalises = useStore((s) => s.enamedAnalises || []);
   const sessionReflections = useStore((s) => s.sessionReflections || []);
   const rebuildActionInboxForToday = useStore((s) => s.rebuildActionInboxForToday);
+  const telemetryState = useStore((s) => ({ meta: s.meta }));
   const calendarProvider = useStore((s) => s.calendarProvider || { activeId: "medcof" });
   const cronogramaSel = useStore((s) => s.cronogramaSel);
   const providerAtivoLabel = useMemo(() => {
@@ -867,7 +778,9 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
   const [showWelcome, setShowWelcome] = useState(false);
   const [showCompleto, setShowCompleto] = useState(!modoSimples);
   const [showSetupFlow, setShowSetupFlow] = useState(false);
+  const [showHeroMeta, setShowHeroMeta] = useState(false);
   const [temaValidando, setTemaValidando] = useState(null);
+  const lastMentorSeenRef = useRef("");
 
   const hour = new Date().getHours();
   const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
@@ -898,6 +811,11 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
     }
     return list;
   }, [temas, sprint, tourStep, plat]);
+  const enamedBottleneck = useMemo(() => (
+    plat === "res"
+      ? getEnamedBottleneckExplanation(getEnamedIntel(temasFiltrados), { minimumStarted: 2 })
+      : null
+  ), [plat, temasFiltrados]);
 
   const autoCatchUp = useStore((s) => s.autoCatchUp);
   useEffect(() => {
@@ -1014,10 +932,6 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
     if (!diag || !diag.insights) return [];
     return diag.insights.filter(ins => ins.type !== "alerta" && ins.type !== "vies_excesso" && ins.type !== "vies_inseguranca");
   }, [diag]);
-  const hasFluenciaTrigger = useMemo(() => {
-    if (!diag?.insights) return false;
-    return diag.insights.some((ins) => ins.type === "tendencia_baixa" || ins.type === "vies_excesso");
-  }, [diag]);
   const hasExhaustionNow = useMemo(() => isExhaustionDetected(temaStats, done), [temaStats, done]);
   const totalSessions = useMemo(() => {
     return temas
@@ -1101,15 +1015,17 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
   }, [modoSimples]);
 
   useEffect(() => {
-    if (!onboardingDone) return;       // still in tour — don't show
-    if (tourStep) return;              // tour in progress
-    if (sessionStorage.getItem(SESSION_KEY)) return;
-    const t = setTimeout(() => {
-      setShowWelcome(true);
-      sessionStorage.setItem(SESSION_KEY, "1");
-    }, 600);                           // small delay so UI renders first
-    return () => clearTimeout(t);
-  }, [onboardingDone, tourStep]);
+    const shouldShow = canShowDailyBriefing({
+      state: { plat, meta, onboardingDone, tourStep, userName },
+      context: {
+        pendingCount: pending,
+        overdueCount: overdue.length,
+        estimatedMinutes: pending * 12,
+      },
+      uid: currentUid,
+    });
+    setShowWelcome(shouldShow);
+  }, [currentUid, meta, onboardingDone, overdue.length, pending, plat, tourStep, userName]);
 
   const acertoMedio = useMemo(() => {
     const rs = done.filter(r => r.acerto != null);
@@ -1205,9 +1121,16 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
   const runMentorPrimaryAction = useCallback(() => {
     const action = mentorNextAction || {};
     const target = action.target || {};
+    const actionType = action.type || target.view || action.ctaView || "mentor";
+    safeTrackEvent(
+      "mentor_action_started",
+      { plat, action_type: actionType, source: action.source || "mentor" },
+      { state: telemetryState }
+    );
     // 1. Alvo explícito de revisão (tema + etapa): inicia o Modo Foco direto.
     if (target.temaId && target.stepKey && onStudy) {
       onStudy(target.temaId, target.stepKey);
+      safeTrackEvent("mentor_action_completed", { plat, action_type: actionType, source: action.source || "mentor" }, { state: telemetryState });
       return;
     }
     // 2. Comandos de fila/revisão sem alvo explícito (ex.: "Fechar fila de hoje").
@@ -1221,11 +1144,13 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       } else if (setView) {
         setView("crono");
       }
+      safeTrackEvent("mentor_action_completed", { plat, action_type: actionType, source: action.source || "mentor" }, { state: telemetryState });
       return;
     }
     // 3. Demais comandos: navega para a tela correspondente.
     if (setView) setView(view);
-  }, [mentorNextAction, onStudy, setView, topFilaItem]);
+    safeTrackEvent("mentor_action_completed", { plat, action_type: actionType, source: action.source || "mentor" }, { state: telemetryState });
+  }, [mentorNextAction, onStudy, plat, setView, telemetryState, topFilaItem]);
 
   const days = Array.from({ length: 35 }, (_, i) => {
     const d = new Date(); d.setDate(d.getDate() - 34 + i);
@@ -1421,13 +1346,42 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       ? ` · ${todayLoadSignals.relearningCount} reaprendendo`
       : "";
     return `${todayLoadSignals.dueTodayCount} revisões · ${todayLoadSignals.todayMinutes} min · carga ${loadLabel}${relearningText}`;
-  }, [todayLoadSignals]);
+    }, [todayLoadSignals]);
+  const dailyBriefing = useMemo(() => buildDailyBriefing({
+    state: { plat, meta, onboardingDone, tourStep, userName },
+    context: {
+      pendingCount: pending,
+      overdueCount: overdue.length,
+      estimatedMinutes: todayLoadSignals.todayMinutes,
+    },
+  }), [meta, onboardingDone, overdue.length, pending, plat, todayLoadSignals.todayMinutes, tourStep, userName]);
   const [showAdvanced, setShowAdvanced] = useState(false);
   const [showMentorWhy, setShowMentorWhy] = useState(false);
   const vestibularStartComplete = useMemo(() => {
     if (plat !== "vest") return true;
     return isVestibularStartComplete(meta);
   }, [plat, meta]);
+  const dismissWelcome = useCallback(() => {
+    dismissDailyBriefing(
+      typeof window !== "undefined" ? window.localStorage : null,
+      getDailyBriefingStorageKey({ uid: currentUid })
+    );
+    setShowWelcome(false);
+  }, [currentUid]);
+
+  useEffect(() => {
+    const actionType = comandoDoDia.action?.type;
+    if (!actionType) return;
+    const eventKey = `${todayStr()}:${plat}:${actionType}`;
+    if (lastMentorSeenRef.current === eventKey) return;
+    safeTrackEvent(
+      "mentor_action_seen",
+      { plat, action_type: actionType, source: comandoDoDia.action?.source || "mentor" },
+      { state: telemetryState }
+    );
+    lastMentorSeenRef.current = eventKey;
+  }, [comandoDoDia.action, plat, telemetryState]);
+
   useEffect(() => {
     if (streakCurrent >= 100 && !meta?.streakMaxAvisado) {
       (showToast || showToastGlobal)("Streak consolidado: agora priorize retenção real, não o número.");
@@ -1515,6 +1469,17 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
                 <button type="button" onClick={onEditName} className="text-gray-500 hover:text-gray-300 transition-colors border-none p-1 bg-transparent cursor-pointer" aria-label="Editar nome">
                   <Edit2 size={14} />
                 </button>
+              </div>
+              <div className="flex items-center gap-2">
+                <button
+                  type="button"
+                  onClick={() => setShowHeroMeta((prev) => !prev)}
+                  className="md:hidden rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-300"
+                >
+                  {showHeroMeta ? "Ocultar detalhes" : "Ver detalhes"}
+                </button>
+              </div>
+              <div className={`${showHeroMeta ? "flex" : "hidden"} md:flex flex-wrap items-center gap-2.5`}>
                 {plat === "res" && (
                   <>
                     <span className="text-[9px] uppercase tracking-wider font-bold text-blue-300 border border-blue-500/30 bg-blue-500/10 rounded-lg px-2 py-1">
@@ -1529,8 +1494,6 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
                     </button>
                   </>
                 )}
-              </div>
-              <div className="flex flex-wrap items-center gap-2.5">
                 <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-black/25 px-2.5 py-1.5">
                   <span className="text-[8.5px] font-bold text-gray-500 uppercase tracking-wider mr-1 select-none flex items-center gap-1">
                     Consistencia
@@ -1570,6 +1533,20 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
               </div>
             </div>
 
+            {showWelcome && (
+              <WelcomePopup
+                briefing={dailyBriefing}
+                streakCurrent={streakCurrent}
+                onClose={dismissWelcome}
+                onStartFocus={() => {
+                  dismissWelcome();
+                  if (topFilaItem) {
+                    onStudy(topFilaItem.temaId, topFilaItem.stepKey);
+                  }
+                }}
+              />
+            )}
+
             <div className="space-y-3">
               <p className="text-[10px] font-bold uppercase tracking-wide text-blue-300">{comandoDoDia.eyebrow}</p>
               <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
@@ -1632,6 +1609,26 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
 
       <ActionInbox mode={modoSimples ? "mentor" : "manual"} onStudy={onStudy} setView={setView} />
 
+      <MiniCronogramaWidget
+        plat={plat}
+        setView={setView}
+        onStudy={onStudy}
+        onMarkMastery={handleMarkMastery}
+        overdue={overdue}
+        today_={today_}
+        temas={temasFiltrados}
+        calendarProvider={calendarProvider}
+        cronogramaSel={cronogramaSel}
+        temasPerWeek={meta?.temasPerWeek}
+        estrategiaStartDate={meta?.estrategiaStartDate}
+        onAdjustWeeklyTopics={handleAdjustWeeklyTopics}
+      />
+
+      <WeeklyReview
+        onAdjust={() => setView && setView("crono")}
+        onAction={(action) => handleInsightAction(action)}
+      />
+
       {/* Alertas compactos inline */}
       {(hasPendingClosure || peakModeAtivo) && (
         <div className="flex flex-wrap gap-2">
@@ -1670,7 +1667,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       {/* KPIs — 4 métricas primárias */}
       <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 select-none">
         <DashboardKpiCard
-          label="Fila de hoje"
+          label="Revisões de hoje"
           icon={<ClipboardList size={13} className="text-amber-300" />}
           accentColor={pending > 0 ? "#f59e0b" : "#10b981"}
           value={String(pendingCountUp) + (naReserva > 0 ? " +" + naReserva : "")}
@@ -1760,7 +1757,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
             <TrendingDown size={11} className="text-red-400" />
             {plat === "vest" ? "Frente prioritária" : "Gargalo ENAMED"}
           </p>
-          {readinessData?.priorityList?.[0] ? (
+          {plat === "vest" && readinessData?.priorityList?.[0] ? (
             <>
               <div>
                 <p className="text-sm font-black text-white leading-tight">{readinessData.priorityList[0].area}</p>
@@ -1777,6 +1774,25 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
                 Ver mapa completo →
               </button>
             </>
+          ) : plat === "res" && enamedBottleneck ? (
+            <>
+              <div>
+                <p className="text-sm font-black text-white leading-tight">{enamedBottleneck.area || "Ainda coletando gargalos"}</p>
+                <p className="text-[10px] text-gray-400 mt-0.5">{enamedBottleneck.motivo}</p>
+              </div>
+              <div className="space-y-1">
+                {enamedBottleneck.evidencias.slice(0, 2).map((item) => (
+                  <p key={item} className="text-[10px] text-gray-500">• {item}</p>
+                ))}
+              </div>
+              <button
+                type="button"
+                onClick={() => setView && setView(enamedBottleneck.target?.view || "stats")}
+                className="self-start px-2.5 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 text-[10px] font-bold cursor-pointer transition-colors"
+              >
+                {enamedBottleneck.actionLabel} →
+              </button>
+            </>
           ) : (
             <p className="text-[11px] text-gray-500 leading-relaxed">Complete revisões e simulados para gerar o mapa de prioridades.</p>
           )}
@@ -1824,25 +1840,6 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
         </div>
       </section>
 
-      <MiniCronogramaWidget
-        plat={plat}
-        setView={setView}
-        onStudy={onStudy}
-        onMarkMastery={handleMarkMastery}
-        overdue={overdue}
-        today_={today_}
-        temas={temasFiltrados}
-        calendarProvider={calendarProvider}
-        cronogramaSel={cronogramaSel}
-        temasPerWeek={meta?.temasPerWeek}
-        estrategiaStartDate={meta?.estrategiaStartDate}
-        onAdjustWeeklyTopics={handleAdjustWeeklyTopics}
-      />
-
-      <WeeklyReview
-        onAdjust={() => setView && setView("crono")}
-        onAction={(action) => handleInsightAction(action)}
-      />
         </>
       )}
 
@@ -2610,27 +2607,6 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       </div>
     </div>
   )}
-      {showWelcome && (
-        <WelcomePopup
-          userName={userName}
-          pending={pending}
-          streakCurrent={streakCurrent}
-          totalSessions={totalSessions}
-          totalRevisoesFeitas={totalRevisoesFeitas}
-          prontidao={prontidao}
-          forceFluencia={hasFluenciaTrigger}
-          forceExhausted={hasExhaustionNow}
-          meta={meta}
-          naReserva={naReserva}
-          onClose={() => setShowWelcome(false)}
-          onStartFocus={() => {
-            setShowWelcome(false);
-            if (topFilaItem) {
-              onStudy(topFilaItem.temaId, topFilaItem.stepKey);
-            }
-          }}
-        />
-      )}
 
       {tourStep === "dash" && showTourBalloon && (
         <TourBalloon
@@ -2651,14 +2627,15 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
           onConfirm={({ questoes, acertos }) => {
             const resultado = validarDominio(plat, temaValidando.id, { questoes, acertos });
             (showToast || showToastGlobal)(resultado?.observacao || "Validação de domínio registrada para este tema.");
-            if (trackEvent) {
-              trackEvent("dominio_previo_avaliado", {
-                plat,
-                tema_id: temaValidando.id,
-                percentual: resultado?.percentual,
-                status: resultado?.status,
-              });
-            }
+              safeTrackEvent(
+                "dominio_previo_avaliado",
+                {
+                  plat,
+                  percentual: resultado?.percentual,
+                  status: resultado?.status,
+                },
+                { state: telemetryState }
+              );
             setTemaValidando(null);
           }}
           onStartLater={() => {
@@ -2673,7 +2650,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       {showCompletionModal && (
         <Modal onClose={() => {
           setShowCompletionModal(false);
-          trackEvent("onboarding_done");
+            safeTrackEvent("onboarding_done", {}, { state: telemetryState });
           setOnboardingDone();
           setTourStep(null);
         }}>
@@ -2693,7 +2670,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
               className="w-full py-3"
               onClick={() => {
                 setShowCompletionModal(false);
-                trackEvent("onboarding_done");
+                safeTrackEvent("onboarding_done", {}, { state: telemetryState });
                 setOnboardingDone();
                 setTourStep(null);
                 setView && setView("crono");
diff --git a/src/components/DataSafetyPanel.jsx b/src/components/DataSafetyPanel.jsx
index ae93ee92..d7109609 100644
--- a/src/components/DataSafetyPanel.jsx
+++ b/src/components/DataSafetyPanel.jsx
@@ -1,6 +1,7 @@
 import React, { useMemo, useState } from "react";
 import { Download, HardDrive, ShieldCheck, Upload, Database, RefreshCcw } from "lucide-react";
 import { exportMedrevBackup, importMedrevBackup, validateMedrevBackup } from "../core/backup";
+import { validateStateIntegrity } from "../core/dataIntegrity";
 import {
   backupLegacyGlobalStore,
   detectLegacyGlobalStore,
@@ -66,11 +67,22 @@ export default function DataSafetyPanel() {
   const handleValidateLocal = () => {
     const payload = readPersistedPayload(storageKey);
     if (!payload) {
-      setValidation({ valid: false, errors: ["Nao foi encontrado backup local neste escopo."], warnings: [], summary: null });
+      setValidation({ valid: false, errors: ["Nao foi encontrado backup local neste escopo."], warnings: [], criticals: [], summary: null });
       return;
     }
     const localBackup = exportMedrevBackup(payload, { ownerUid: currentUid });
-    setValidation(validateMedrevBackup(localBackup));
+    const backupValidation = validateMedrevBackup(localBackup);
+    const integrity = validateStateIntegrity(localBackup);
+    setValidation({
+      ...backupValidation,
+      criticals: integrity.criticals,
+      warnings: [...backupValidation.warnings, ...integrity.warnings.map((item) => `${item.path}: ${item.message}`)],
+      summary: {
+        ...backupValidation.summary,
+        criticalCount: integrity.summary.criticalCount,
+        warningCount: integrity.summary.warningCount,
+      },
+    });
   };
 
   const handleImportFile = (event) => {
@@ -85,7 +97,7 @@ export default function DataSafetyPanel() {
         setImportValidation(result);
       } catch (error) {
         setImportCandidate(null);
-        setImportValidation({ valid: false, errors: [error.message], warnings: [], summary: null });
+        setImportValidation({ valid: false, errors: [error.message], warnings: [], criticals: [], summary: null });
       }
     };
     reader.readAsText(file);
@@ -236,9 +248,17 @@ export default function DataSafetyPanel() {
       </div>
 
       {validation && (
-        <p className={`text-[10px] ${validation.valid ? "text-emerald-300" : "text-red-300"}`}>
-          {validation.valid ? "Estrutura local valida." : validation.errors.join(" | ")}
-        </p>
+        <div className={`rounded-xl border p-3 text-[10px] ${validation.valid ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : "border-red-500/20 bg-red-500/10 text-red-200"}`}>
+          <p className="font-bold">
+            {validation.valid ? "Estrutura local valida." : validation.errors.join(" | ")}
+          </p>
+          <p className="mt-1 text-gray-300">
+            Criticos: {validation.summary?.criticalCount || validation.criticals?.length || 0} · Warnings: {validation.summary?.warningCount || validation.warnings?.length || 0}
+          </p>
+          {validation.warnings?.length > 0 && (
+            <p className="mt-1 text-yellow-200">{validation.warnings.join(" | ")}</p>
+          )}
+        </div>
       )}
     </section>
   );
diff --git a/src/components/Modals.jsx b/src/components/Modals.jsx
index 32744c03..000c66e6 100644
--- a/src/components/Modals.jsx
+++ b/src/components/Modals.jsx
@@ -14,6 +14,7 @@ import {
   DOMINIO_META,
   DOMINIO_PREVIO_MIN_QUESTOES,
 } from "../core/domainValidation";
+import { readSanitizedNumber, sanitizeNumericInput } from "../core/numberInput";
 import { getAnonymousStorageKey, getOrCreateAnonymousSessionId, getUserScopedStorageKey } from "../core/userScope";
 import { detectLegacyGlobalStore, migrateLegacyStoreToUserScope } from "../core/userDataMigration";
 import { getReadinessData } from "../core/readiness";
@@ -1287,6 +1288,14 @@ export function AjustesModal({
   const saveMeta = (newFields) => {
     setMeta({ ...meta, ...newFields, estrategiaRefinada: true });
   };
+  const saveMetaNumber = (field, rawValue, options, fallback = null) => {
+    const value = readSanitizedNumber(rawValue, options);
+    if (value == null) {
+      if (fallback != null) saveMeta({ [field]: fallback });
+      return;
+    }
+    saveMeta({ [field]: value });
+  };
   const esps = plat === "res" ? ESPS_RES : ESPS_VEST;
 
   const readiness = getReadinessData({ temas, simulados, meta, plat });
@@ -1609,7 +1618,7 @@ export function AjustesModal({
                   <Input type="date" value={meta.dataProva} onChange={(e) => saveMeta({ dataProva: e.target.value })} />
                 </Field>
                 <Field label="Meta de acerto (%)" info="A porcentagem de acertos em simulados que você deseja atingir no final da preparação.">
-                  <Input type="number" min={50} max={100} step={0.1} value={meta.acerto} onChange={(e) => saveMeta({ acerto: parseFloat(e.target.value) || 85 })} />
+                  <Input type="number" min={50} max={100} step={0.1} value={meta.acerto} onChange={(e) => saveMetaNumber("acerto", e.target.value, { allowDecimal: true, maxDecimals: 1, min: 50, max: 100 }, 85)} />
                 </Field>
               </div>
               <p className="text-[9.5px] text-gray-500 pl-1 -mt-2">
@@ -1618,10 +1627,10 @@ export function AjustesModal({
 
               <div className="grid grid-cols-2 gap-3">
                 <Field label="Teto diário de revisões" info="O número máximo de cards de revisão exibidos no Dashboard por dia. Excessos são movidos de forma inteligente para a fila reserva para amanhã, aliviando a carga mental.">
-                  <Input type="number" min={5} max={500} value={meta.maxRevisoesDia || 30} onChange={(e) => saveMeta({ maxRevisoesDia: parseInt(e.target.value, 10) || 30 })} />
+                  <Input type="number" min={5} max={500} value={meta.maxRevisoesDia ?? 30} onChange={(e) => saveMetaNumber("maxRevisoesDia", e.target.value, { min: 5, max: 500 }, 30)} />
                 </Field>
                 <Field label="Intervalo Máximo (Dias)" info="O limite máximo de dias para o agendamento de uma revisão. Garante que você revise todos os temas consolidados pelo menos uma vez a cada N dias.">
-                  <Input type="number" min={30} max={365} value={meta.intervaloMaxDias || 180} onChange={(e) => saveMeta({ intervaloMaxDias: parseInt(e.target.value, 10) || 180 })} />
+                  <Input type="number" min={30} max={365} value={meta.intervaloMaxDias ?? 180} onChange={(e) => saveMetaNumber("intervaloMaxDias", e.target.value, { min: 30, max: 365 }, 180)} />
                 </Field>
               </div>
 
@@ -1641,7 +1650,7 @@ export function AjustesModal({
 
               <Field label="Meta diária de revisões (0 = ilimitada)" info="Número de revisões que você se compromete a fazer diariamente como meta pessoal (não confunda com o Teto Diário do FSRS).">
                 <div className="flex gap-2">
-                  <Input type="number" min={0} value={meta.metaDiaria || 0} onChange={(e) => saveMeta({ metaDiaria: +e.target.value })} className="flex-1" />
+                  <Input type="number" min={0} value={meta.metaDiaria ?? 0} onChange={(e) => saveMetaNumber("metaDiaria", e.target.value, { min: 0 }, 0)} className="flex-1" />
                   <button
                     type="button"
                     onClick={() => {
@@ -1661,10 +1670,10 @@ export function AjustesModal({
 
               <div className="grid grid-cols-2 gap-3">
                 <Field label="Meta diária de questões (0 = inativo)" info="Quantidade de questões resolvidas que você quer atingir por dia (utilizado para calcular o Saldo de Ritmo na aba de Preparo).">
-                  <Input type="number" min={0} value={meta.metaQuestoesDia || 0} onChange={(e) => saveMeta({ metaQuestoesDia: parseInt(e.target.value, 10) || 0 })} />
+                  <Input type="number" min={0} value={meta.metaQuestoesDia ?? 0} onChange={(e) => saveMetaNumber("metaQuestoesDia", e.target.value, { min: 0 }, 0)} />
                 </Field>
                 <Field label="Meta total de questões (0 = inativo)" info="Quantidade total de questões resolvidas que você quer atingir ao final da preparação.">
-                  <Input type="number" min={0} value={meta.metaQuestoesTotal || 0} onChange={(e) => saveMeta({ metaQuestoesTotal: parseInt(e.target.value, 10) || 0 })} />
+                  <Input type="number" min={0} value={meta.metaQuestoesTotal ?? 0} onChange={(e) => saveMetaNumber("metaQuestoesTotal", e.target.value, { min: 0 }, 0)} />
                 </Field>
               </div>
 
@@ -1953,7 +1962,7 @@ export function AjustesModal({
 
               <div className="grid grid-cols-2 gap-3">
                 <Field label="Horas disponíveis / dia" info="Média de horas diárias dedicadas ao estudo. Auxilia o Mentor na recomendação e limite de carga.">
-                  <Input type="number" min={1} max={24} value={meta.tempoDisponivel || 2} onChange={(e) => saveMeta({ tempoDisponivel: +e.target.value })} />
+                  <Input type="number" min={1} max={24} value={meta.tempoDisponivel ?? 2} onChange={(e) => saveMetaNumber("tempoDisponivel", e.target.value, { min: 1, max: 24 }, 2)} />
                 </Field>
               </div>
 
@@ -1973,10 +1982,10 @@ export function AjustesModal({
                       <Input
                         type="number"
                         min={0}
-                        value={meta.acertosAlvo || 0}
+                        value={meta.acertosAlvo ?? 0}
                         onChange={(e) => {
-                          const val = +e.target.value;
-                          const tot = meta.totalQuestoesAlvo || 100;
+                          const val = readSanitizedNumber(e.target.value, { min: 0 }) ?? 0;
+                          const tot = meta.totalQuestoesAlvo ?? 100;
                           const pct = tot > 0 ? parseFloat(((val / tot) * 100).toFixed(2)) : 0;
                           saveMeta({ acertosAlvo: val, notaCorteAlvo: pct });
                         }}
@@ -1987,10 +1996,10 @@ export function AjustesModal({
                       <Input
                         type="number"
                         min={1}
-                        value={meta.totalQuestoesAlvo || 100}
+                        value={meta.totalQuestoesAlvo ?? 100}
                         onChange={(e) => {
-                          const tot = +e.target.value;
-                          const val = meta.acertosAlvo || 0;
+                          const tot = readSanitizedNumber(e.target.value, { min: 1 }) ?? 1;
+                          const val = meta.acertosAlvo ?? 0;
                           const pct = tot > 0 ? parseFloat(((val / tot) * 100).toFixed(2)) : 0;
                           saveMeta({ totalQuestoesAlvo: tot, notaCorteAlvo: pct });
                         }}
@@ -2397,8 +2406,8 @@ export function ModalValidarDominio({ tema, onConfirm, onCancel, onStartLater })
   const [acertos, setAcertos] = React.useState("");
   const [submitted, setSubmitted] = React.useState(false);
 
-  const qtd = parseInt(questoes, 10) || 0;
-  const acertosNum = parseInt(acertos, 10);
+  const qtd = readSanitizedNumber(questoes, { min: 1, max: 50 }) ?? 0;
+  const acertosNum = readSanitizedNumber(acertos, { min: 0, max: qtd || 50 });
   const pct = qtd > 0 && !isNaN(acertosNum) ? Math.round((acertosNum / qtd) * 100) : null;
   const classificacao = pct != null ? classificarDominio(pct) : null;
   const meta_ = classificacao ? DOMINIO_META[classificacao] : null;
@@ -2434,7 +2443,7 @@ export function ModalValidarDominio({ tema, onConfirm, onCancel, onStartLater })
               min="1"
               max="50"
               value={questoes}
-              onChange={(e) => setQuestoes(e.target.value)}
+              onChange={(e) => setQuestoes(sanitizeNumericInput(e.target.value, { min: 1, max: 50 }).text)}
               placeholder={String(DOMINIO_PREVIO_MIN_QUESTOES)}
             />
           </Field>
@@ -2444,7 +2453,7 @@ export function ModalValidarDominio({ tema, onConfirm, onCancel, onStartLater })
               min="0"
               max={qtd || 50}
               value={acertos}
-              onChange={(e) => setAcertos(e.target.value)}
+              onChange={(e) => setAcertos(sanitizeNumericInput(e.target.value, { min: 0, max: qtd || 50 }).text)}
               placeholder="ex: 13"
             />
           </Field>
diff --git a/src/components/Primitives.jsx b/src/components/Primitives.jsx
index 98ce69b3..32ada614 100644
--- a/src/components/Primitives.jsx
+++ b/src/components/Primitives.jsx
@@ -128,12 +128,22 @@ export function Field({ label, info, children }) {
 
 export function SmartTooltip({ content, children, preferred = "top" }) {
   const [open, setOpen] = useState(false);
+  const [isMobile, setIsMobile] = useState(false);
   const [pos, setPos] = useState({ top: 0, left: 0, placement: preferred });
   const anchorRef = useRef(null);
   const bubbleRef = useRef(null);
 
+  useEffect(() => {
+    if (typeof window === "undefined") return undefined;
+    const media = window.matchMedia("(max-width: 767px)");
+    const sync = () => setIsMobile(media.matches);
+    sync();
+    media.addEventListener("change", sync);
+    return () => media.removeEventListener("change", sync);
+  }, []);
+
   useLayoutEffect(() => {
-    if (!open || !anchorRef.current || !bubbleRef.current) return;
+    if (!open || isMobile || !anchorRef.current || !bubbleRef.current) return;
     const a = anchorRef.current.getBoundingClientRect();
     const b = bubbleRef.current.getBoundingClientRect();
     const gap = 8;
@@ -146,18 +156,22 @@ export function SmartTooltip({ content, children, preferred = "top" }) {
     let left = a.left + (a.width / 2) - (b.width / 2);
     left = Math.max(8, Math.min(left, window.innerWidth - b.width - 8));
     setPos({ top, left, placement });
-  }, [open, preferred]);
+  }, [isMobile, open, preferred]);
 
   useEffect(() => {
     if (!open) return undefined;
     const close = () => setOpen(false);
-    window.addEventListener("scroll", close, true);
+    if (!isMobile) {
+      window.addEventListener("scroll", close, true);
+    }
     window.addEventListener("resize", close);
     return () => {
-      window.removeEventListener("scroll", close, true);
+      if (!isMobile) {
+        window.removeEventListener("scroll", close, true);
+      }
       window.removeEventListener("resize", close);
     };
-  }, [open]);
+  }, [isMobile, open]);
 
   return (
     <span ref={anchorRef} className="inline-flex items-center">
@@ -171,7 +185,7 @@ export function SmartTooltip({ content, children, preferred = "top" }) {
       >
         {children}
       </span>
-      {open &&
+      {open && !isMobile &&
         createPortal(
           <div
             ref={bubbleRef}
@@ -189,6 +203,31 @@ export function SmartTooltip({ content, children, preferred = "top" }) {
           </div>,
           document.body
         )}
+      {open && isMobile &&
+        createPortal(
+          <div className="fixed inset-0 z-[720] flex items-end justify-center bg-black/60 backdrop-blur-sm p-3" onClick={() => setOpen(false)}>
+            <div
+              role="dialog"
+              aria-label="Detalhes"
+              className="w-full max-w-md rounded-[1.4rem] border border-white/10 bg-[#141418] p-4 shadow-2xl"
+              onClick={(e) => e.stopPropagation()}
+            >
+              <div className="mb-3 flex items-center justify-between gap-3">
+                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-300">Detalhe</p>
+                <button
+                  type="button"
+                  onClick={() => setOpen(false)}
+                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300"
+                  aria-label="Fechar detalhe"
+                >
+                  <X size={15} />
+                </button>
+              </div>
+              <div className="text-[12px] leading-relaxed text-gray-200">{content}</div>
+            </div>
+          </div>,
+          document.body
+        )}
     </span>
   );
 }
diff --git a/src/components/Simulados.jsx b/src/components/Simulados.jsx
index 066ad703..a842c6ea 100644
--- a/src/components/Simulados.jsx
+++ b/src/components/Simulados.jsx
@@ -8,7 +8,7 @@ import { Btn, Modal, Field, Input, Select, Tabs } from "./Primitives";
 import { getReadinessData, matchesArea, pickTargetProva } from "../core/readiness";
 import { totalQuestoesFeitas, saldoRitmo } from "../core/volume";
 import { getSimRecommendation, getResultActions, getSimuladoGuidance, getSimuladoProtocolo } from "../core/simStrategy";
-import { trackEvent } from "../services/firebase";
+import { safeTrackEvent } from "../core/telemetry";
 
 const ZONA_UI = {
   vermelha: {
@@ -974,7 +974,7 @@ export default function Simulados({ onStudy, setView }) {
           onClose={() => setModalOpen(false)}
           onSave={(sim) => {
             addSim(plat, sim);
-            trackEvent("simulado_registrado", { plat, pct: sim?.pct ?? 0, total: sim?.total ?? 0 });
+            safeTrackEvent("simulation_result_recorded", { plat, pct: sim?.pct ?? 0, total: sim?.total ?? 0 }, { state: useStore.getState() });
             setModalOpen(false);
           }}
         />
@@ -982,4 +982,3 @@ export default function Simulados({ onStudy, setView }) {
     </div>
   );
 }
-
diff --git a/src/components/StatsPanel.jsx b/src/components/StatsPanel.jsx
index 5c9d368b..44e2bc32 100644
--- a/src/components/StatsPanel.jsx
+++ b/src/components/StatsPanel.jsx
@@ -1,7 +1,7 @@
 // src/components/StatsPanel.jsx
 // Estatisticas reorganizadas em 7 secoes diagnosticaveis.
 // Cada secao responde: o que mede / da pra confiar / o que fazer.
-import React, { useMemo, useState, lazy, Suspense } from "react";
+import React, { useMemo, useState, useEffect, useRef, lazy, Suspense } from "react";
 import {
   BarChart3, Flame, BookOpen, AlertCircle, Trophy,
   Brain, Activity,
@@ -17,6 +17,8 @@ import {
 import {
   evaluateMetric, formatMetricValue, METRIC_STATUS,
 } from "../core/metricsRegistry";
+import { compareReadinessToSimulado, createReadinessSnapshot } from "../core/readinessValidation";
+import { safeTrackEvent } from "../core/telemetry";
 import { calcTrueRetentionDetailed } from "../hooks/useMetrics";
 import { calculateClinicalReasoningScoreDetailed } from "../core/clinicalReasoningScoring";
 import EnamedMapa from "./EnamedMapa";
@@ -186,6 +188,7 @@ export default function StatsPanel({ setView = null }) {
   const sessionReflections = useStore((s) => s.sessionReflections || []);
 
   const [activeSection, setActiveSection] = useState("resumo");
+  const lastReadinessTelemetryRef = useRef("");
 
   // Filtrar secoes para plataforma atual
   const availableSections = SECTIONS.filter(
@@ -209,6 +212,28 @@ export default function StatsPanel({ setView = null }) {
     () => getReadinessData({ temas, simulados, meta, plat, casosProgresso }),
     [temas, simulados, meta, plat, casosProgresso]
   );
+  const readinessValidation = useMemo(() => {
+    const latestSimulado = simulados[simulados.length - 1] || null;
+    return compareReadinessToSimulado(
+      createReadinessSnapshot({ score: readinessData.score, plat }),
+      latestSimulado || {}
+    );
+  }, [plat, readinessData.score, simulados]);
+
+  useEffect(() => {
+    if (readinessData.score == null) return;
+    const key = `${todayStr()}:${plat}:${readinessData.score}:${readinessValidation.status}:${readinessValidation.absoluteError ?? "na"}`;
+    if (lastReadinessTelemetryRef.current === key) return;
+    safeTrackEvent("readiness_snapshot", { plat, score: readinessData.score, confidence: readinessData.confidence || "coletando" }, { state: { meta } });
+    if (readinessValidation.status !== "coletando") {
+      safeTrackEvent(
+        "readiness_vs_simulado_result",
+        { plat, status: readinessValidation.status, absolute_error: readinessValidation.absoluteError },
+        { state: { meta } }
+      );
+    }
+    lastReadinessTelemetryRef.current = key;
+  }, [meta, plat, readinessData.confidence, readinessData.score, readinessValidation.absoluteError, readinessValidation.status]);
 
   // Sparkline de prontidao
   const sparklinePath = useMemo(() => {
@@ -534,6 +559,19 @@ export default function StatsPanel({ setView = null }) {
             />
           </div>
 
+          <div className="rounded-2xl border border-white/5 bg-[#111113] p-4">
+            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Validação do preparo</p>
+            <p className="mt-1 text-[12px] text-gray-300">
+              {readinessValidation.status === "coletando"
+                ? "Ainda coletando validação. Registre simulados para comparar preparo estimado com resultado real."
+                : readinessValidation.status === "alinhado"
+                ? `Preparo estimado alinhado ao resultado real (erro absoluto ${readinessValidation.absoluteError} pts).`
+                : readinessValidation.status === "superestimado"
+                ? `Preparo estimado acima do resultado real (erro absoluto ${readinessValidation.absoluteError} pts).`
+                : `Preparo estimado abaixo do resultado real (erro absoluto ${readinessValidation.absoluteError} pts).`}
+            </p>
+          </div>
+
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
             <MetricCard
               label={metricsEvaluated.relearningCount.label}
diff --git a/src/components/WeeklyReview.jsx b/src/components/WeeklyReview.jsx
index 860dd18b..9028ee46 100644
--- a/src/components/WeeklyReview.jsx
+++ b/src/components/WeeklyReview.jsx
@@ -4,6 +4,11 @@ import { CalendarCheck2, ChevronDown, ChevronUp, X } from "lucide-react";
 import { addDays, STEPS, todayStr } from "../core/fsrs";
 import { buildWeeklyReview } from "../core/sessionReflection";
 import { dominantErrorType, ERROR_TYPE_LABEL } from "../core/errorTaxonomy";
+import {
+  buildContextualWeeklyActions,
+  canShowWeeklyReview,
+  WEEKLY_REVIEW_LOCKED_MESSAGE,
+} from "../core/weeklyReviewGate";
 import { useStore } from "../core/store";
 
 function countRecentDoneSteps(temas = [], days = 7) {
@@ -20,6 +25,7 @@ export default function WeeklyReview({ onAdjust, onAction }) {
   const casosProgresso = useStore((s) => s[plat]?.casosProgresso || {});
   const enamedAnalises = useStore((s) => s.enamedAnalises || []);
   const actionInbox = useStore((s) => s.actionInbox || []);
+  const cronogramas = useStore((s) => s[plat]?.cronogramas || []);
   const sessionReflections = useStore((s) => s.sessionReflections || []);
   const weeklyReviews = useStore((s) => s.weeklyReviews || []);
   const saveWeeklyReview = useStore((s) => s.saveWeeklyReview);
@@ -103,7 +109,22 @@ export default function WeeklyReview({ onAdjust, onAction }) {
 
   const lastReviewDate = weeklyReviews.slice(-1)[0]?.date;
   const alreadyReviewedThisWeek = Boolean(lastReviewDate && lastReviewDate >= addDays(todayStr(), -6));
-  const suggestedArea = review.blocked.areaFraca || review.plan.priorities[0]?.split(":")[0] || null;
+  const overdueCount = actionInbox.filter((action) => action.type === "review").length;
+  const reviewUnlocked = canShowWeeklyReview({
+    today: todayStr(),
+    temas,
+    simulados,
+    sessionReflections,
+    sessionsCompleted: review.executed.sessions,
+    trackedVolume: review.executed.sessions + review.executed.revisoes + simulados.length,
+  });
+  const contextualActions = buildContextualWeeklyActions({
+    hasSchedule: cronogramas.length > 0,
+    sessionsCompleted: review.executed.sessions,
+    weakArea: review.blocked.areaFraca,
+    hasUnstartedTopics: temas.some((tema) => tema?.unstarted),
+    overdueCount,
+  });
 
   const handleAccept = () => {
     if (saveWeeklyReview) saveWeeklyReview({ ...review, status: "accepted" });
@@ -137,7 +158,13 @@ export default function WeeklyReview({ onAdjust, onAction }) {
         {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
       </button>
 
-      {expanded && (
+      {!reviewUnlocked && (
+        <div className="border-t border-white/5 px-4 pb-4 pt-3">
+          <p className="text-[12px] leading-relaxed text-gray-400">{WEEKLY_REVIEW_LOCKED_MESSAGE}</p>
+        </div>
+      )}
+
+      {expanded && reviewUnlocked && (
         <div className="px-4 pb-4 space-y-4 border-t border-white/5">
           <div className="pt-3">
             <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">1. O que voce executou</p>
@@ -151,7 +178,7 @@ export default function WeeklyReview({ onAdjust, onAction }) {
             <p className="text-[12px] text-gray-300 mt-1">
               {review.blocked.baixaEnergia ? "Baixa energia detectada. " : ""}
               {review.blocked.errosRecorrentes ? `Erro recorrente: ${review.blocked.errosRecorrentes}. ` : ""}
-              {review.blocked.areaFraca ? `Area mais fraca: ${review.blocked.areaFraca}.` : "Sem bloqueio dominante."}
+              {review.blocked.areaFraca ? `Area mais fraca: ${review.blocked.areaFraca}.` : "Nenhum bloqueio dominante apareceu com confiança suficiente."}
             </p>
           </div>
 
@@ -161,11 +188,11 @@ export default function WeeklyReview({ onAdjust, onAction }) {
               {review.plan.priorities.length > 0 ? (
                 review.plan.priorities.map((priority) => <li key={priority}>• {priority}</li>)
               ) : (
-                <li>• Definir 3 prioridades no inicio da semana.</li>
+                <li>• Ainda sem prioridade forte o bastante para um plano fechado.</li>
               )}
-              <li>• Tema novo: {review.plan.newTopic || "a definir"}</li>
-              <li>• Revisao critica: {review.plan.criticalReview || "a definir"}</li>
-              <li>• Caso clinico: {review.plan.clinicalCase || "a definir"}</li>
+              {review.plan.newTopic ? <li>• Tema novo: {review.plan.newTopic}</li> : null}
+              {review.plan.criticalReview ? <li>• Revisao critica: {review.plan.criticalReview}</li> : null}
+              {review.plan.clinicalCase ? <li>• Caso clinico: {review.plan.clinicalCase}</li> : null}
             </ul>
           </div>
 
@@ -218,34 +245,20 @@ export default function WeeklyReview({ onAdjust, onAction }) {
               Escolha o que quer ajustar agora. Isso sincroniza o plano do Mentor com o Dashboard.
             </p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
-              <button
-                type="button"
-                onClick={() => triggerAction({ type: "focar", esp: suggestedArea || "prioridades da semana", label: "Focar área fraca" })}
-                className="px-3 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 border border-blue-500/25 text-[11px] font-bold text-left cursor-pointer"
-              >
-                Focar área fraca
-              </button>
-              <button
-                type="button"
-                onClick={() => triggerAction({ type: "setView", view: "crono", label: "Selecionar temas da semana" })}
-                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-[11px] font-bold text-left cursor-pointer"
-              >
-                Selecionar temas da semana
-              </button>
-              <button
-                type="button"
-                onClick={() => triggerAction({ type: "import_calendar", label: "Importar cronograma" })}
-                className="px-3 py-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/25 text-[11px] font-bold text-left cursor-pointer"
-              >
-                Importar cronograma
-              </button>
-              <button
-                type="button"
-                onClick={() => triggerAction({ type: "ja_domino", label: "Marcar já domino" })}
-                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-[11px] font-bold text-left cursor-pointer"
-              >
-                Usar "Já domino"
-              </button>
+              {contextualActions.length > 0 ? contextualActions.map((item) => (
+                <button
+                  key={item.id}
+                  type="button"
+                  onClick={() => triggerAction(item.action)}
+                  className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-[11px] font-bold text-left cursor-pointer"
+                >
+                  {item.label}
+                </button>
+              )) : (
+                <p className="text-[11px] text-gray-500 leading-relaxed">
+                  Ainda não há ajuste contextual forte o bastante para automatizar.
+                </p>
+              )}
             </div>
           </div>
         </div>,
diff --git a/src/core/backup.js b/src/core/backup.js
index 7a10dc66..d0f4ddd5 100644
--- a/src/core/backup.js
+++ b/src/core/backup.js
@@ -1,3 +1,5 @@
+import { validateStateIntegrity } from "./dataIntegrity";
+
 export const MEDREV_BACKUP_VERSION = "reviewflow-v6-backup";
 export const MEDREV_BACKUP_SCHEMA = "medrev-backup-v1";
 
@@ -75,6 +77,14 @@ export function validateMedrevBackup(backup) {
   if (!isObject(backup.res)) errors.push("Campo 'res' invalido.");
   if (!isObject(backup.vest)) errors.push("Campo 'vest' invalido.");
 
+  const integrity = validateStateIntegrity(backup);
+  if (integrity.criticals.length > 0) {
+    errors.push(...integrity.criticals.map((item) => `${item.path}: ${item.message}`));
+  }
+  if (integrity.warnings.length > 0) {
+    warnings.push(...integrity.warnings.map((item) => `${item.path}: ${item.message}`));
+  }
+
   const resTemas = Array.isArray(backup.res?.temas) ? backup.res.temas.length : 0;
   const vestTemas = Array.isArray(backup.vest?.temas) ? backup.vest.temas.length : 0;
   const reflections = Array.isArray(backup.sessionReflections) ? backup.sessionReflections.length : 0;
diff --git a/src/core/enamedIntel.js b/src/core/enamedIntel.js
index b82ed32d..c896c405 100644
--- a/src/core/enamedIntel.js
+++ b/src/core/enamedIntel.js
@@ -273,3 +273,47 @@ export function getEnamedAction(intel) {
     area: gargalo.area,
   };
 }
+
+export function getEnamedBottleneckExplanation(intel, options = {}) {
+  const minimumStarted = options.minimumStarted ?? 2;
+  const minimumCoverage = options.minimumCoverage ?? 1;
+  const fallbackArea = intel?.lista?.find((item) => item.iniciados >= minimumStarted && item.cobertura >= minimumCoverage) || null;
+  const gargalo = (() => {
+    if (!intel?.gargalo) return fallbackArea;
+    if (intel.gargalo.iniciados >= minimumStarted && intel.gargalo.cobertura >= minimumCoverage) return intel.gargalo;
+    return fallbackArea;
+  })();
+
+  if (!gargalo || !intel?.temDados || gargalo.iniciados < minimumStarted || gargalo.cobertura < minimumCoverage) {
+    return {
+      area: null,
+      motivo: "Ainda coletando gargalos",
+      evidencias: [
+        `Faça pelo menos ${minimumStarted} sessões ou avance os primeiros temas da área para estimar com confiança.`,
+      ],
+      actionLabel: "Ver plano",
+      target: { view: "crono" },
+      confidence: "baixa",
+      collecting: true,
+    };
+  }
+
+  const hotPending = gargalo.hotTopicsPendentes?.[0]?.subarea || gargalo.hotTopics?.[0]?.subarea || null;
+  const evidencias = [
+    `Cobertura ${gargalo.cobertura}% na área.`,
+    `Retenção ${gargalo.retencao ?? "coletando"}%.`,
+  ];
+  if (hotPending) {
+    evidencias.push(`Subtópico quente ainda pouco coberto: ${hotPending}.`);
+  }
+
+  return {
+    area: gargalo.area,
+    motivo: `${gargalo.motivo}.`,
+    evidencias,
+    actionLabel: hotPending ? "Ver plano da área" : "Ver mapa completo",
+    target: hotPending ? { view: "crono", area: gargalo.area, subarea: hotPending } : { view: "stats" },
+    confidence: gargalo.retencao == null ? "media" : "alta",
+    collecting: false,
+  };
+}
diff --git a/src/core/enamedIntel.test.js b/src/core/enamedIntel.test.js
index 61b01bab..fa80ef1f 100644
--- a/src/core/enamedIntel.test.js
+++ b/src/core/enamedIntel.test.js
@@ -4,6 +4,7 @@ import {
   calcPreparoEnamed,
   topHotness,
   getEnamedAction,
+  getEnamedBottleneckExplanation,
 } from "./enamedIntel";
 
 const rev = (acerto) => ({ d0: { done: true, acerto } });
@@ -60,4 +61,16 @@ describe("enamedIntel", () => {
     const action = getEnamedAction(intel);
     expect(action.title).toMatch(/Foque|Comece/);
   });
+
+  test("gera explicacao acionavel para gargalo", () => {
+    const intel = getEnamedIntel([
+      { esp: "Cirurgia", tema: "Apendicite", unstarted: false, rev: rev(0.50) },
+      { esp: "Cirurgia", tema: "Abdome agudo", unstarted: false, rev: rev(0.40) },
+      { esp: "Clínica Médica", tema: "Cardiologia", unstarted: false, rev: rev(0.85) },
+    ]);
+    const explanation = getEnamedBottleneckExplanation(intel, { minimumStarted: 1 });
+    expect(explanation.collecting).toBe(false);
+    expect(explanation.area).toBeTruthy();
+    expect(explanation.evidencias.length).toBeGreaterThan(0);
+  });
 });
diff --git a/src/core/userDataMigration.test.js b/src/core/userDataMigration.test.js
index 81cecadd..060456ad 100644
--- a/src/core/userDataMigration.test.js
+++ b/src/core/userDataMigration.test.js
@@ -40,6 +40,15 @@ describe("userDataMigration", () => {
     expect(localStorage.getItem(result.to)).toContain("\"state\"");
   });
 
+  test("nao sobrescreve escopo destino existente sem overwrite", () => {
+    localStorage.setItem("reviewflow-v6", "{\"state\":{\"res\":{\"temas\":[1]}}}");
+    localStorage.setItem("medrev:prod:user:uid-a:store", "{\"state\":{\"res\":{\"temas\":[2]}}}");
+    const result = migrateLegacyStoreToUserScope("uid-a", { confirm: true, env: "prod" });
+    expect(result.ok).toBe(false);
+    expect(result.error).toBe("target_scope_already_has_data");
+    expect(localStorage.getItem("medrev:prod:user:uid-a:store")).toContain("[2]");
+  });
+
   test("limpa legado apenas com confirmacao", () => {
     localStorage.setItem("reviewflow-v6", "{}");
     const denied = clearLegacyGlobalStoreAfterConfirm();
@@ -51,4 +60,3 @@ describe("userDataMigration", () => {
     expect(localStorage.getItem("reviewflow-v6")).toBeNull();
   });
 });
-
diff --git a/src/core/userScope.test.js b/src/core/userScope.test.js
index 3e7819e5..474e6498 100644
--- a/src/core/userScope.test.js
+++ b/src/core/userScope.test.js
@@ -29,6 +29,10 @@ describe("userScope", () => {
     expect(getAnonymousStorageKey("", "dev")).toBe("medrev:dev:anonymous:default:store");
   });
 
+  test("uids diferentes geram escopos diferentes", () => {
+    expect(getUserScopedStorageKey("u1", "prod")).not.toBe(getUserScopedStorageKey("u2", "prod"));
+  });
+
   test("cria sessao anonima persistida em sessionStorage", () => {
     const sid1 = getOrCreateAnonymousSessionId("test", sessionStorage);
     const sid2 = getOrCreateAnonymousSessionId("test", sessionStorage);
diff --git a/src/services/userDataPaths.js b/src/services/userDataPaths.js
index 7f71707c..e8aec092 100644
--- a/src/services/userDataPaths.js
+++ b/src/services/userDataPaths.js
@@ -17,6 +17,10 @@ export function userCalendarImportPath(uid) {
   return [...getUserRootPath(uid), "calendarImports"];
 }
 
+export function userTelemetryPath(uid) {
+  return [...getUserRootPath(uid), "telemetry"];
+}
+
 export function userStateDoc(db, uid) {
   return doc(db, ...userStatePath(assertUid(uid)));
 }
@@ -29,3 +33,6 @@ export function userBackupCollection(db, uid) {
   return collection(db, ...userBackupPath(assertUid(uid)));
 }
 
+export function userTelemetryCollection(db, uid) {
+  return collection(db, ...userTelemetryPath(assertUid(uid)));
+}
diff --git a/src/services/userDataPaths.test.js b/src/services/userDataPaths.test.js
index 7305b3b6..d636a42d 100644
--- a/src/services/userDataPaths.test.js
+++ b/src/services/userDataPaths.test.js
@@ -3,6 +3,7 @@ import {
   userActivityPath,
   userBackupPath,
   userCalendarImportPath,
+  userTelemetryPath,
 } from "./userDataPaths";
 
 describe("userDataPaths", () => {
@@ -21,5 +22,12 @@ describe("userDataPaths", () => {
   test("calendar imports path inclui uid", () => {
     expect(userCalendarImportPath("u1")).toEqual(["usuarios", "u1", "calendarImports"]);
   });
-});
 
+  test("telemetry path inclui uid", () => {
+    expect(userTelemetryPath("u1")).toEqual(["usuarios", "u1", "telemetry"]);
+  });
+
+  test("uid obrigatorio", () => {
+    expect(() => userStatePath("")).toThrow("Missing authenticated user uid");
+  });
+});

```

## Untracked file contents


### MEDREV_AUDITORIA_INCREMENTAL_FUNCOES_RESTANTES.md

```txt
# MEDREV — Auditoria Incremental Pós-Implementação: Funções Restantes

> **Premissa corrigida:** a auditoria anterior é tratada como **baseline já implementado**. Este documento **não** tenta reaplicar o plano antigo. O foco agora é o que falta para o produto virar um sistema executável de estudo: histórico real, ações do mentor acionáveis, calendário/importação madura, fechamento de sessão útil, backup, multiusuário e hardening de lançamento.
>
> **Código auditado:** `Bro (18).zip`.
>
> **Leitura obrigatória antes de implementar:** `docs/MEDREV_CONTEXT_FOR_AI.md`, `docs/MEDREV_PRODUCT_CHARTER.md`, `src/core/platformFeatures.js`, `src/core/store.js`, `src/core/actionInbox.js`, `src/core/sessionReflection.js`.
>
> **Regra anti-regressão:** não refazer FSRS/Interface/Raciocínio/Estatísticas da auditoria anterior salvo quando for necessário para conectar as novas funções. Cada etapa abaixo é pequena, com arquivos permitidos/proibidos e DoD.

---

## 0. O que foi corrigido no escopo

Eu havia confundido o arquivo de auditoria anterior com trabalho ainda não aplicado. A leitura correta é:

1. **A auditoria anterior é baseline.** Não gastar token implementando de novo os mesmos blocos.
2. **Nova auditoria = camada de produto que falta em volta do core:** o aluno precisa saber o que fez, o mentor precisa mandar para uma ação real, a agenda importada precisa ser confiável, o fechamento de sessão precisa virar dado, e o backup/multiusuário precisa proteger tudo.
3. **Não criar “features bonitas” sem contrato de execução.** Toda função nova deve responder: que evento registra, que ação gera, onde aparece, como é recuperada e como é testada.

---

## 1. Sumário executivo — achados novos

### P0 — implementar antes de adicionar mais tela

| Prioridade | Achado | Evidência no código | Risco de produto | Correção proposta |
|---|---|---|---|---|
| P0 | **Não existe Activity Log global.** Existem `reviewHistory`, `sessionReflections`, `weeklyReviews`, análises ENAMED e progresso de caso, mas nada forma uma linha do tempo única. | `store.js` tem `sessionReflections` e `weeklyReviews`, mas não `activityLog`; `userDataPaths.js` já prevê `activityLog`, não usado. | O app não consegue explicar “o que aconteceu”, gerar weekly review robusto, debugar mentor, nem reconstruir jornada do usuário. | Criar `src/core/activityLog.js`, persistir `activityLog` no store, logar eventos principais e expor UI simples. |
| P0 | **Action Inbox gera ações sem execução real.** | `ActionInbox.jsx:6-17` só executa `target.temaId+stepKey` ou `target.view`. Mas `actionInbox.js`/`store.js` geram `target:{tema:"fila_vencida"}`, `{area}`, `{casoId}` etc. | Mentor recomenda, mas o botão “Iniciar” some ou vira “Marcar feito” sem ação concreta. Isso destrói confiança. | Criar contrato de target/CTA centralizado; fazer cada ação sair com rota executável. |
| P0 | **Fechamento de sessão salva reflexão, mas não vira evento canônico nem plano confiável.** | `sessionReflection.js` cria reflexão e ação; `Dashboard.jsx` detecta `hasPendingClosure`, mas botão manda para `stats`, não reabre fechamento. | O usuário fecha sessão, mas o app não transforma isso em aprendizado operacional. | Integrar `SessionClosureModal` ao ActivityLog e corrigir CTA de sessão pendente. |
| P0 | **Importação de calendário é funcional, mas rasa.** | `CalendarImportWizard.jsx` aceita texto/JSON; `CalendarMappingPanel.jsx` é display-only; `Cronograma.jsx` ainda mostra “Usar amostra de desenvolvimento”. | Usuário importa cronograma real, mas não corrige mapeamento; em produção aparece ferramenta dev; confiança cai. | Import v2: overrides manuais, snapshot, log, esconder sample dev. |
| P1 | **Weekly Review existe, mas deveria nascer do Activity Log.** | `WeeklyReview.jsx` usa reflexões/action inbox/casos/análises, mas não linha do tempo canônica. | Review semanal vira opinião parcial, não auditoria do estudo. | Recalcular com `activityLog` + reflexões. |
| P1 | **Backup não inclui Activity Log porque ele não existe.** | `backup.js` inclui `sessionReflections` e `weeklyReviews`; sem `activityLog`. | Perde histórico e auditabilidade em troca de dispositivo/conta. | Estender backup schema. |
| P1 | **Multiusuário está bem desenhado, mas incompleto para a nova camada.** | `userScope.js`, `userDataPaths.js` e `firestore.rules` já têm base por usuário. | Se ActivityLog entrar errado, mistura usuário anônimo/autenticado. | Persistir primeiro no store escopado; Firestore subcollection fica etapa futura. |

---

## 2. Fundamentação externa usada para decidir o plano

Esta auditoria incremental usa quatro critérios de produto, não só “mais features”:

1. **Revisão espaçada precisa de dado operacional confiável.** O manual do Anki recomenda 90% como retenção desejada padrão e alerta que elevar retenção aumenta a carga rapidamente; isso reforça que o MedRev precisa medir carga, execução e atrasos antes de tentar “forçar mais retenção”. Fonte: Anki Manual — Deck Options, seção FSRS.
2. **FSRS moderno suporta adiantamento/atraso e se adapta ao histórico do usuário.** Isso torna um Activity Log estruturado valioso para auditoria futura e, depois, possível otimização de parâmetros. Fonte: open-spaced-repetition/free-spaced-repetition-scheduler.
3. **Learning analytics só ajuda quando é acionável.** Revisões recentes de Learning Analytics Dashboards mostram que dashboards crus podem impor carga cognitiva sem melhorar desempenho; feedback motivacional e visualizações de baixa inferência tendem a ser mais úteis. Fonte: revisão MDPI 2025 sobre learning analytics dashboards.
4. **Raciocínio clínico e SCT funcionam melhor com resposta + feedback + comparação.** A etapa incremental não deve criar mais telas soltas; deve registrar resposta, feedback, conduta, incerteza e evolução. Fonte: literatura sobre illness scripts e Script Concordance Test em educação médica.

**Implicação de engenharia:** antes de expandir tela, criar uma espinha dorsal de eventos e ações. Sem isso, o mentor vira texto motivacional e as estatísticas viram painel decorativo.

---

## 3. Arquitetura-alvo incremental

### 3.1 Estado atual simplificado

Hoje o app tem vários “minibancos”:

```txt
Tema.rev[step].reviewHistory     -> histórico local do tema
sessionReflections[]             -> fechamento de sessão
weeklyReviews[]                  -> revisão semanal
casosProgresso{}                 -> progresso em casos clínicos
analisesEnamed[]                 -> análise de prova
simulados[]                      -> simulados
calendario/importedTopics        -> cronograma importado
```

O problema é que eles não conversam em uma linha do tempo.

### 3.2 Estado-alvo

Criar um **Activity Log canônico**:

```txt
activityLog[]
  ├─ fsrs_review
  ├─ focus_session
  ├─ session_reflection
  ├─ mentor_action
  ├─ clinical_case
  ├─ exam_analysis
  ├─ calendar_import
  ├─ weekly_review
  ├─ backup
  └─ domain_validation
```

Esse log não substitui os estados especializados. Ele é um **índice operacional** para:

- timeline do aluno;
- Weekly Review confiável;
- depuração do mentor;
- métricas de consistência;
- backup/auditoria;
- futuras sincronizações incrementais.

---

## 4. Etapa A — Activity Log Core

### Objetivo

Criar o núcleo de eventos sem mexer na UI. Depois disso, cada ação importante do app deixa uma trilha.

### Arquivos permitidos

- `src/core/activityLog.js` **novo**
- `src/core/activityLog.test.js` **novo**
- `src/core/store.js`
- `src/core/backup.js`

### Arquivos proibidos

- componentes grandes (`Dashboard.jsx`, `StatsPanel.jsx`, `Cronograma.jsx`) nesta etapa;
- FSRS matemático;
- Firebase service.

### 4.1 Criar `src/core/activityLog.js`

```js
// src/core/activityLog.js

function pad2(value) {
  return String(value).padStart(2, "0");
}

export function toIsoDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toIsoDateTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function slug(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

export const ACTIVITY_EVENT_TYPE = Object.freeze({
  FSRS_REVIEW: "fsrs_review",
  FOCUS_SESSION: "focus_session",
  SESSION_REFLECTION: "session_reflection",
  MENTOR_ACTION: "mentor_action",
  CLINICAL_CASE: "clinical_case",
  EXAM_ANALYSIS: "exam_analysis",
  CALENDAR_IMPORT: "calendar_import",
  WEEKLY_REVIEW: "weekly_review",
  BACKUP: "backup",
  DOMAIN_VALIDATION: "domain_validation",
});

export const ACTIVITY_EVENT_STATUS = Object.freeze({
  DONE: "done",
  OPEN: "open",
  ACCEPTED: "accepted",
  DISMISSED: "dismissed",
  SKIPPED: "skipped",
  ERROR: "error",
});

export const MAX_ACTIVITY_EVENTS = 1500;

export function buildActivityId(input = {}) {
  if (input.id) return input.id;
  const type = input.type || "event";
  const date = input.date || toIsoDate();
  const target = input.target || {};
  const seed = [
    type,
    input.source || "app",
    target.temaId || target.casoId || target.actionId || target.providerId || target.id || input.title || "item",
    target.stepKey || target.view || "",
    input.createdAt || date,
  ].join("|");
  return `log_${slug(seed).slice(0, 96)}`;
}

export function createActivityEvent(input = {}) {
  const createdAt = input.createdAt || toIsoDateTime();
  const date = input.date || toIsoDate(createdAt);
  const type = input.type || ACTIVITY_EVENT_TYPE.FOCUS_SESSION;

  return {
    id: buildActivityId({ ...input, createdAt, date, type }),
    type,
    status: input.status || ACTIVITY_EVENT_STATUS.DONE,
    title: String(input.title || "Evento registrado").trim(),
    summary: String(input.summary || "").trim(),
    source: input.source || "app",
    date,
    createdAt,
    target: input.target && typeof input.target === "object" ? input.target : {},
    metrics: input.metrics && typeof input.metrics === "object" ? input.metrics : {},
    meta: input.meta && typeof input.meta === "object" ? input.meta : {},
  };
}

export function upsertActivityEvent(events = [], event) {
  if (!event) return Array.isArray(events) ? events : [];
  const normalized = createActivityEvent(event);
  const withoutSame = (Array.isArray(events) ? events : []).filter((item) => item?.id !== normalized.id);
  return capActivityLog([...withoutSame, normalized]);
}

export function capActivityLog(events = [], max = MAX_ACTIVITY_EVENTS) {
  const normalized = (Array.isArray(events) ? events : [])
    .filter(Boolean)
    .map((item) => createActivityEvent(item));
  return sortActivityEvents(normalized).slice(0, max);
}

export function sortActivityEvents(events = []) {
  return [...events].sort((a, b) => {
    const byTime = String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    if (byTime !== 0) return byTime;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

export function getActivityEventsForDate(events = [], date = toIsoDate()) {
  return sortActivityEvents(events).filter((event) => event.date === date);
}

export function summarizeActivity(events = [], { from, to } = {}) {
  const list = sortActivityEvents(events).filter((event) => {
    if (from && event.date < from) return false;
    if (to && event.date > to) return false;
    return true;
  });

  const byType = {};
  const byStatus = {};
  let studyMinutes = 0;
  let reviewsDone = 0;
  let clinicalCases = 0;
  let examAnalyses = 0;

  for (const event of list) {
    byType[event.type] = (byType[event.type] || 0) + 1;
    byStatus[event.status] = (byStatus[event.status] || 0) + 1;
    studyMinutes += Number(event.metrics?.minutes || 0) || 0;
    if (event.type === ACTIVITY_EVENT_TYPE.FSRS_REVIEW) reviewsDone += 1;
    if (event.type === ACTIVITY_EVENT_TYPE.CLINICAL_CASE) clinicalCases += 1;
    if (event.type === ACTIVITY_EVENT_TYPE.EXAM_ANALYSIS) examAnalyses += 1;
  }

  return {
    total: list.length,
    byType,
    byStatus,
    studyMinutes,
    reviewsDone,
    clinicalCases,
    examAnalyses,
  };
}

export function activityFromFsrsReview({ tema, stepKey, step, platKey }) {
  if (!tema || !stepKey || !step) return null;
  return createActivityEvent({
    type: ACTIVITY_EVENT_TYPE.FSRS_REVIEW,
    title: `Revisao concluida: ${tema.nome || tema.id || "tema"}`,
    summary: `${String(stepKey).toUpperCase()} concluido${step?.acerto != null ? ` com ${Math.round(Number(step.acerto) * 100)}%` : ""}.`,
    source: "fsrs",
    date: step.reviewedAt || step.date || toIsoDate(),
    target: {
      temaId: tema.id,
      stepKey,
      area: tema.area || "",
      platKey: platKey || "",
    },
    metrics: {
      acerto: step.acerto ?? null,
      stability: step.S ?? null,
      difficulty: step.D ?? null,
    },
    meta: {
      status: step.status || "",
      atrasoDias: step.atrasoDias ?? null,
      rating: step.rating || "",
    },
  });
}

export function activityFromMentorAction(action, status = ACTIVITY_EVENT_STATUS.OPEN) {
  if (!action) return null;
  return createActivityEvent({
    type: ACTIVITY_EVENT_TYPE.MENTOR_ACTION,
    status,
    title: action.title || "Acao do mentor",
    summary: action.reason || "",
    source: action.source || "mentor",
    date: action.dueDate || action.createdAt || toIsoDate(),
    target: {
      ...(action.target || {}),
      actionId: action.id,
      actionType: action.type,
    },
    metrics: {
      priority: action.priority ?? null,
    },
  });
}
```

### 4.2 Criar `src/core/activityLog.test.js`

```js
import {
  ACTIVITY_EVENT_TYPE,
  capActivityLog,
  createActivityEvent,
  getActivityEventsForDate,
  summarizeActivity,
  upsertActivityEvent,
} from "./activityLog";

describe("activityLog core", () => {
  test("normaliza evento minimo", () => {
    const event = createActivityEvent({ title: "Teste" });
    expect(event.id).toMatch(/^log_/);
    expect(event.title).toBe("Teste");
    expect(event.status).toBe("done");
  });

  test("upsert substitui mesmo id", () => {
    const a = createActivityEvent({ id: "x", title: "A" });
    const b = createActivityEvent({ id: "x", title: "B" });
    const list = upsertActivityEvent([a], b);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("B");
  });

  test("filtra eventos por data", () => {
    const events = [
      createActivityEvent({ id: "a", date: "2026-06-01", title: "A" }),
      createActivityEvent({ id: "b", date: "2026-06-02", title: "B" }),
    ];
    expect(getActivityEventsForDate(events, "2026-06-02")).toHaveLength(1);
  });

  test("sumariza revisoes e minutos", () => {
    const events = [
      createActivityEvent({ type: ACTIVITY_EVENT_TYPE.FSRS_REVIEW, metrics: { minutes: 20 } }),
      createActivityEvent({ type: ACTIVITY_EVENT_TYPE.CLINICAL_CASE, metrics: { minutes: 10 } }),
    ];
    const summary = summarizeActivity(events);
    expect(summary.total).toBe(2);
    expect(summary.reviewsDone).toBe(1);
    expect(summary.clinicalCases).toBe(1);
    expect(summary.studyMinutes).toBe(30);
  });

  test("limita tamanho do log", () => {
    const events = Array.from({ length: 20 }, (_, i) => createActivityEvent({ id: `e${i}`, title: `E${i}` }));
    expect(capActivityLog(events, 5)).toHaveLength(5);
  });
});
```

### 4.3 Patch em `store.js`

#### Importar helpers

No topo de `src/core/store.js`, adicionar:

```js
import {
  ACTIVITY_EVENT_STATUS,
  ACTIVITY_EVENT_TYPE,
  activityFromFsrsReview,
  activityFromMentorAction,
  capActivityLog,
  createActivityEvent,
  upsertActivityEvent,
} from "./activityLog";
```

#### Estado inicial

No estado inicial, perto de `sessionReflections`/`weeklyReviews`, adicionar:

```js
activityLog: [],
```

#### Métodos novos

Adicionar junto dos métodos de action/reflection:

```js
logActivityEvent: (event) =>
  set((s) => ({
    activityLog: upsertActivityEvent(s.activityLog || [], event),
  })),

appendActivityEvents: (events = []) =>
  set((s) => ({
    activityLog: capActivityLog([...(s.activityLog || []), ...events]),
  })),
```

#### Atualizar `markStep`

No retorno de `markStep`, depois de montar `temasAtualizados`, criar evento:

```js
const updatedTema = temasAtualizados.find((tema) => tema.id === temaId);
const completedStep = updatedTema?.rev?.[stepKey];
const reviewEvent = activityFromFsrsReview({
  tema: updatedTema,
  stepKey,
  step: completedStep,
  platKey: s.plat,
});
```

No objeto retornado por `set`, incluir:

```js
activityLog: reviewEvent
  ? upsertActivityEvent(s.activityLog || [], reviewEvent)
  : (s.activityLog || []),
```

> **Cuidado:** não logar antes do `recalcAfterMark`, senão o evento fica sem `S`, `D`, `reviewedAt` e acerto final.

#### Atualizar `addSessionReflection`

Dentro de `addSessionReflection`, depois de `const action = reflectionToAction(normalized);`, criar:

```js
const reflectionEvent = createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.SESSION_REFLECTION,
  title: normalized.tema ? `Fechamento: ${normalized.tema}` : "Fechamento de sessao",
  summary: normalized.mainIssue === "nenhum" ? "Sessao registrada." : `Ponto principal: ${normalized.mainIssue}.`,
  source: normalized.source || "focus",
  date: normalized.date,
  target: {
    reflectionId: normalized.id,
    tema: normalized.tema || "",
    area: normalized.area || "",
  },
  metrics: {
    confidence: normalized.confidence,
    outcome: normalized.outcome,
  },
  meta: {
    nextAdjustment: normalized.nextAdjustment,
    note: normalized.note || "",
  },
});
```

No retorno, incluir:

```js
activityLog: capActivityLog([
  ...(s.activityLog || []),
  reflectionEvent,
  activityFromMentorAction(action, ACTIVITY_EVENT_STATUS.OPEN),
].filter(Boolean)),
```

#### Atualizar ações do mentor

Em `acceptAction`, `dismissAction`, `markActionDone`, além de atualizar `actionInboxState`, logar o status:

```js
const action = (s.actionInbox || []).find((item) => item.id === actionId);
const event = activityFromMentorAction(action, ACTIVITY_EVENT_STATUS.ACCEPTED); // ou DONE/DISMISSED
return {
  actionInboxState: { ... },
  activityLog: event ? upsertActivityEvent(s.activityLog || [], event) : (s.activityLog || []),
};
```

#### Partialize/persistência

Em `partialize`, incluir:

```js
activityLog: s.activityLog,
```

No reset/merge de usuário, onde já entram `sessionReflections` e `weeklyReviews`, adicionar:

```js
activityLog: persisted.activityLog ?? initial.activityLog,
```

### 4.4 Patch em `backup.js`

Em `createBackupPayload`:

```js
activityLog: state.activityLog ?? [],
```

Em `inspectBackupPayload`:

```js
const activityLog = Array.isArray(backup.activityLog) ? backup.activityLog.length : 0;
```

E retornar:

```js
activityLog,
```

Em `restoreStateFromBackup`:

```js
activityLog: backup.activityLog ?? [],
```

### DoD da Etapa A

- `activityLog.test.js` verde.
- `check:mojibake` verde.
- Marcar uma revisão cria um evento `fsrs_review`.
- Fechar sessão cria `session_reflection` e `mentor_action`.
- Aceitar/concluir/dispensar ação registra status no log.
- Exportar backup inclui `activityLog`.

---

## 5. Etapa B — Timeline de atividade

### Objetivo

Criar uma visualização simples, útil e barata: “o que eu fiz hoje/semana”. Não é dashboard avançado. É linha do tempo operacional.

### Arquivos permitidos

- `src/components/ActivityTimeline.jsx` **novo**
- `src/components/StatsPanel.jsx` ou `src/App.js`/`navigationModel.js` se decidir abrir por “Mais”

### Recomendação de produto

Primeiro colocar em **Estatísticas > Atividade**. Depois, se ficar bom, adicionar item em “Mais”. Não criar nova aba principal.

### 5.1 Criar `ActivityTimeline.jsx`

```jsx
// src/components/ActivityTimeline.jsx
import React, { useMemo, useState } from "react";
import { Activity, CalendarDays, CheckCircle2, Clock, Target } from "lucide-react";
import { useStore } from "../core/store";
import { getActivityEventsForDate, summarizeActivity, toIsoDate } from "../core/activityLog";
import EmptyState from "./EmptyState";

const TYPE_LABELS = {
  fsrs_review: "Revisao",
  focus_session: "Sessao",
  session_reflection: "Fechamento",
  mentor_action: "Mentor",
  clinical_case: "Caso clinico",
  exam_analysis: "Prova",
  calendar_import: "Calendario",
  weekly_review: "Weekly Review",
  backup: "Backup",
  domain_validation: "Dominio previo",
};

function shiftDate(iso, days) {
  const base = iso ? new Date(`${iso}T12:00:00`) : new Date();
  base.setDate(base.getDate() + days);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
}

export default function ActivityTimeline({ initialDate }) {
  const activityLog = useStore((s) => s.activityLog || []);
  const [selectedDate, setSelectedDate] = useState(initialDate || toIsoDate());

  const events = useMemo(
    () => getActivityEventsForDate(activityLog, selectedDate),
    [activityLog, selectedDate]
  );

  const weekSummary = useMemo(() => {
    const from = shiftDate(selectedDate, -6);
    return summarizeActivity(activityLog, { from, to: selectedDate });
  }, [activityLog, selectedDate]);

  return (
    <section className="bg-[var(--surface-1)] border border-white/5 rounded-3xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-black">Linha do tempo</p>
          <h3 className="text-lg font-black text-white">Atividade registrada</h3>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="rounded-2xl bg-black/20 border border-white/5 p-3">
          <CalendarDays size={15} className="text-blue-300 mb-1" />
          <p className="text-xl font-black text-white">{weekSummary.total}</p>
          <p className="text-[10px] text-gray-500 font-bold">eventos em 7 dias</p>
        </div>
        <div className="rounded-2xl bg-black/20 border border-white/5 p-3">
          <CheckCircle2 size={15} className="text-emerald-300 mb-1" />
          <p className="text-xl font-black text-white">{weekSummary.reviewsDone}</p>
          <p className="text-[10px] text-gray-500 font-bold">revisoes</p>
        </div>
        <div className="rounded-2xl bg-black/20 border border-white/5 p-3">
          <Target size={15} className="text-purple-300 mb-1" />
          <p className="text-xl font-black text-white">{weekSummary.clinicalCases}</p>
          <p className="text-[10px] text-gray-500 font-bold">casos</p>
        </div>
        <div className="rounded-2xl bg-black/20 border border-white/5 p-3">
          <Clock size={15} className="text-amber-300 mb-1" />
          <p className="text-xl font-black text-white">{weekSummary.studyMinutes}</p>
          <p className="text-[10px] text-gray-500 font-bold">min estimados</p>
        </div>
      </div>

      {!events.length ? (
        <EmptyState
          icon={Activity}
          title="Sem eventos neste dia"
          description="Quando voce revisar, fechar sessoes, importar calendario ou executar acoes do mentor, tudo aparece aqui."
        />
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-blue-300 font-black">
                    {TYPE_LABELS[event.type] || event.type}
                  </p>
                  <h4 className="text-sm font-black text-white">{event.title}</h4>
                  {event.summary && <p className="text-[11px] text-gray-400 mt-1">{event.summary}</p>}
                </div>
                <span className="text-[10px] text-gray-500 font-bold">{event.status}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

### 5.2 Integrar em `StatsPanel.jsx`

Import lazy:

```jsx
const ActivityTimeline = React.lazy(() => import("./ActivityTimeline"));
```

Na seção `atividade`, adicionar abaixo dos cartões existentes:

```jsx
<Suspense fallback={<div className="text-sm text-gray-500">Carregando atividade...</div>}>
  <ActivityTimeline />
</Suspense>
```

### DoD da Etapa B

- `Stats > Atividade` mostra timeline.
- Se não há eventos, aparece empty state.
- Depois de uma revisão, a timeline do dia mostra o evento.
- Sem nova aba principal.

---

## 6. Etapa C — Action Inbox com contrato executável

### Objetivo

Toda ação do mentor deve ter uma rota. Sem isso, a UI promete e não entrega.

### Diagnóstico de código

`ActionInbox.jsx` só entende:

```js
target.temaId + target.stepKey
// ou
target.view
```

Mas o core gera:

```js
target: { tema: "fila_vencida" }
target: { tema: "fila_do_dia" }
target: { area: "..." }
target: { casoId }
target: { tema, temaId }
```

Resultado: várias ações não têm CTA. O usuário só consegue “marcar feito”, que é uma saída falsa.

### Arquivos permitidos

- `src/core/actionInbox.js`
- `src/core/store.js`
- `src/components/ActionInbox.jsx`

### 6.1 Adicionar helper de execução em `actionInbox.js`

```js
export function resolveActionExecution(action = {}) {
  const target = action.target || {};

  if (target.temaId && target.stepKey) {
    return {
      kind: "study",
      label: "Iniciar",
      temaId: target.temaId,
      stepKey: target.stepKey,
    };
  }

  if (target.view) {
    return {
      kind: "view",
      label: target.label || "Abrir",
      view: target.view,
    };
  }

  if (target.casoId) {
    return {
      kind: "view",
      label: "Abrir caso",
      view: "raciocinio",
      params: { casoId: target.casoId },
    };
  }

  if (action.type === "rest") {
    return {
      kind: "noop",
      label: "Registrar descanso",
    };
  }

  return null;
}
```

### 6.2 Garantir que as ações saiam com target certo

Em `store.js`, criar helper perto de `buildActionCandidatesFromState`:

```js
function findFirstDueReview(temas = [], today, mode = "today") {
  for (const tema of temas) {
    const rev = tema?.rev || {};
    for (const stepKey of ["d0", "d1", "d4", "d7", "d21", "manutencao"]) {
      const step = rev[stepKey];
      if (!step || step.status === "done") continue;
      if (!step.date) continue;
      if (mode === "overdue" && step.date < today) return { temaId: tema.id, stepKey };
      if (mode === "today" && step.date <= today) return { temaId: tema.id, stepKey };
    }
  }
  return null;
}
```

Dentro de `buildActionCandidatesFromState`, trocar targets genéricos:

#### Revisões vencidas

De:

```js
target: { tema: "fila_vencida" },
```

Para:

```js
const firstOverdue = findFirstDueReview(state.temas || [], today, "overdue");
// ...
target: firstOverdue
  ? { ...firstOverdue, queue: "overdue" }
  : { view: "dash", queue: "overdue" },
```

#### Fila de hoje

```js
const firstToday = findFirstDueReview(state.temas || [], today, "today");
// ...
target: firstToday
  ? { ...firstToday, queue: "today" }
  : { view: "dash", queue: "today" },
```

#### Área fraca ENAMED

```js
target: { view: "sims", area: latestEnamed.resumo.areaCritica },
```

#### Caso clínico

Se já existe `casoId`, manter:

```js
target: { view: "raciocinio", casoId },
```

#### Tema novo

```js
target: { view: "crono", area: latestEnamed?.resumo?.areaCritica || "" },
```

### 6.3 Atualizar `ActionInbox.jsx`

Importar:

```js
import { resolveActionExecution } from "../core/actionInbox";
```

Substituir `resolveActionCTA` local por:

```jsx
function executeAction(action, execution, { onStudy, setView, markActionDone }) {
  if (!execution) return;
  if (execution.kind === "study" && onStudy) {
    onStudy(execution.temaId, execution.stepKey || "d0");
    return;
  }
  if (execution.kind === "view" && setView) {
    setView(execution.view);
    return;
  }
  if (execution.kind === "noop") {
    markActionDone && markActionDone(action.id);
  }
}
```

No render:

```jsx
const primaryExecution = resolveActionExecution(primary);
```

Botão:

```jsx
{primaryExecution && (
  <button
    type="button"
    onClick={() => executeAction(primary, primaryExecution, { onStudy, setView, markActionDone })}
    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold border-none cursor-pointer inline-flex items-center gap-1"
  >
    <Play size={12} /> {primaryExecution.label}
  </button>
)}
```

Para ações secundárias, renderizar o botão também. Hoje elas só têm “Marcar feito” e “Dispensar”; isso mantém as recomendações secundárias pouco úteis.

### DoD da Etapa C

- Ação “Resolver revisões vencidas” abre uma revisão real.
- Ação “Fechar fila de hoje” abre uma revisão real.
- Ação de caso clínico abre `raciocinio`.
- Ação de área fraca abre `sims` ou `crono`, não fica sem CTA.
- Ações aceitas/concluídas/dispensadas aparecem no Activity Log.

---

## 7. Etapa D — Fechamento de sessão como dado de aprendizagem

### Objetivo

Fechamento de sessão não deve ser “modal bonitinho”. Deve virar dado que alimenta ação, weekly review e timeline.

### Diagnóstico

- `SessionClosureModal.jsx` já existe.
- `sessionReflection.js` normaliza outcome, issue, confidence e ajuste.
- `addSessionReflection` salva reflexão e gera uma action.
- Porém, sem Activity Log, isso não vira evento operacional.
- `Dashboard.jsx` detecta pendência (`hasPendingClosure`), mas o CTA atual manda para `stats`, o que não resolve a pendência.

### Arquivos permitidos

- `src/components/Dashboard.jsx`
- `src/components/SessionClosureModal.jsx` somente se precisar prop nova
- `src/core/store.js` já modificado na Etapa A

### 7.1 Corrigir CTA de sessão pendente no Dashboard

No Dashboard, criar estado:

```jsx
const [closureOpen, setClosureOpen] = useState(false);
```

No alerta de sessão pendente, trocar:

```jsx
onClick={() => setView("stats")}
```

por:

```jsx
onClick={() => setClosureOpen(true)}
```

No fim do componente, renderizar:

```jsx
<SessionClosureModal
  open={closureOpen}
  onClose={() => setClosureOpen(false)}
  source="dashboard"
/>
```

Se `SessionClosureModal` exige props específicas de tema/sessão, passe fallback:

```jsx
session={{ source: "dashboard", tema: "", area: "" }}
```

### 7.2 Melhorar taxonomia do fechamento sem inventar sistema paralelo

O `sessionReflection.js` usa:

```js
conteudo, raciocinio, tempo, energia, distracao, nenhum, memoria
```

Isso é bom para fechamento rápido. Não expandir demais. O erro seria tentar colocar 20 categorias e matar adesão.

Adicionar somente um campo opcional:

```js
intensity: "baixa" | "media" | "alta"
```

Mas **não fazer agora** se isso exigir mexer na UI. Primeiro estabilizar Activity Log.

### DoD da Etapa D

- Se há sessão pendente, o CTA abre fechamento, não estatísticas.
- Fechar sessão aparece na timeline.
- Fechar sessão gera ação executável no Action Inbox.
- Weekly Review passa a enxergar a reflexão.

---

## 8. Etapa E — Importação de calendário v2

### Objetivo

Transformar a importação em uma função confiável para cronogramas reais, sem depender de amostra dev e sem mapeamento caixa-preta.

### Diagnóstico de código

- `CalendarImportWizard.jsx` aceita texto/JSON e gera preview.
- `calendarProvider.js` normaliza e tenta mapear tópicos.
- `CalendarMappingPanel.jsx` só mostra mapeamento; não permite corrigir.
- `Cronograma.jsx` mostra botão “Usar amostra de desenvolvimento”, perigoso em produção.

### Arquivos permitidos

- `src/core/calendarProvider.js`
- `src/components/CalendarImportWizard.jsx`
- `src/components/CalendarMappingPanel.jsx`
- `src/components/Cronograma.jsx`
- `src/core/store.js`
- `src/core/calendarProvider.test.js`

### 8.1 Esconder amostra de desenvolvimento

Em `Cronograma.jsx`, envolver o botão:

```jsx
{process.env.NODE_ENV !== "production" && (
  <button ...>
    Usar amostra de desenvolvimento
  </button>
)}
```

Ou melhor, usar feature flag explícita:

```js
const SHOW_DEV_CALENDAR_SAMPLE = process.env.NODE_ENV !== "production";
```

### 8.2 Criar overrides manuais de mapeamento

Em `calendarProvider.js`, adicionar suporte a `mappingOverrides`:

```js
export function applyCalendarMappingOverrides(importedTopics = [], overrides = {}) {
  return importedTopics.map((topic) => {
    const override = overrides?.[topic.id] || overrides?.[topic.rawTitle];
    if (!override) return topic;
    return {
      ...topic,
      matchedTemaId: override.temaId || topic.matchedTemaId,
      matchedTemaNome: override.temaNome || topic.matchedTemaNome,
      matchConfidence: override.confidence ?? 1,
      matchSource: "manual",
    };
  });
}
```

### 8.3 Store para overrides

No estado:

```js
calendarMappingOverrides: {},
```

Método:

```js
saveCalendarMappingOverride: (importedTopicId, override) =>
  set((s) => ({
    calendarMappingOverrides: {
      ...(s.calendarMappingOverrides || {}),
      [importedTopicId]: {
        temaId: override.temaId,
        temaNome: override.temaNome,
        confidence: 1,
        updatedAt: new Date().toISOString(),
      },
    },
  })),
```

No `partialize`:

```js
calendarMappingOverrides: s.calendarMappingOverrides,
```

### 8.4 UI de correção em `CalendarMappingPanel.jsx`

Hoje o painel é display-only. Transformar em tabela com seletor simples:

```jsx
export default function CalendarMappingPanel({ importedTopics = [], medcofTemas = [], onSaveOverride }) {
  return (
    <div className="space-y-2">
      {importedTopics.map((topic) => (
        <div key={topic.id || topic.rawTitle} className="rounded-xl border border-white/5 bg-black/20 p-3">
          <p className="text-sm font-bold text-white">{topic.rawTitle || topic.nome}</p>
          <p className="text-[11px] text-gray-400">Match atual: {topic.matchedTemaNome || "Sem match"}</p>
          <select
            className="mt-2 w-full bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-xs text-white"
            value={topic.matchedTemaId || ""}
            onChange={(event) => {
              const tema = medcofTemas.find((item) => item.id === event.target.value);
              if (!tema || !onSaveOverride) return;
              onSaveOverride(topic.id || topic.rawTitle, {
                temaId: tema.id,
                temaNome: tema.nome,
              });
            }}
          >
            <option value="">Selecionar tema...</option>
            {medcofTemas.map((tema) => (
              <option key={tema.id} value={tema.id}>{tema.nome}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
```

### 8.5 Logar importação

Quando salvar importação no store:

```js
const importEvent = createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.CALENDAR_IMPORT,
  title: "Calendario importado",
  summary: `${topics.length} topicos importados; ${matchedCount} com match automatico.`,
  source: "calendar_import",
  target: { providerId: "user_imported" },
  metrics: {
    totalTopics: topics.length,
    matchedTopics: matchedCount,
    unmatchedTopics: topics.length - matchedCount,
  },
});
```

### DoD da Etapa E

- Em produção, amostra dev não aparece.
- Usuário consegue corrigir match de tópico importado.
- Override persiste.
- Reabrir Cronograma mantém correções.
- Importação aparece no Activity Log.
- Backup inclui overrides.

---

## 9. Etapa F — Weekly Review baseado em eventos

### Objetivo

Fazer o Weekly Review parar de depender só de reflexões soltas e action inbox. Ele deve auditar a semana real.

### Arquivos permitidos

- `src/core/sessionReflection.js`
- `src/components/WeeklyReview.jsx`
- `src/core/store.js`

### 9.1 Estender `buildWeeklyReview` para receber `activityLog`

Em `sessionReflection.js`:

```js
import { summarizeActivity } from "./activityLog";
```

Dentro de `buildWeeklyReview`:

```js
const activitySummary = summarizeActivity(context.activityLog || [], {
  from: shiftDays(today, -6),
  to: today,
});
```

Trocar `executed` por:

```js
executed: {
  sessions: context.sessionsCompleted ?? summary.total,
  revisoes: context.revisoesDone ?? activitySummary.reviewsDone,
  casosClinicos: context.clinicalCases ?? activitySummary.clinicalCases,
  provasAnalisadas: context.examAnalyses ?? activitySummary.examAnalyses,
  minutos: activitySummary.studyMinutes,
},
```

Adicionar:

```js
activitySummary,
```

### 9.2 Salvar Weekly Review no Activity Log

Em `saveWeeklyReview` no store, após normalizar review:

```js
const weeklyReviewEvent = createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.WEEKLY_REVIEW,
  title: "Weekly Review concluido",
  summary: `${normalized.executed?.revisoes || 0} revisoes, ${normalized.executed?.casosClinicos || 0} casos, ${normalized.executed?.provasAnalisadas || 0} provas.`,
  source: "weekly_review",
  date: normalized.date,
  target: { weeklyReviewId: normalized.id },
  metrics: normalized.executed || {},
});
```

No retorno:

```js
activityLog: upsertActivityEvent(s.activityLog || [], weeklyReviewEvent),
```

### DoD da Etapa F

- Weekly Review mostra números coerentes com Activity Log.
- Salvar Weekly Review cria evento.
- Sem eventos suficientes, o review mostra “coletando dados”, não inventa diagnóstico.

---

## 10. Etapa G — Data Safety e backup v2

### Objetivo

Garantir que as novas camadas não sejam perdidas e que o usuário tenha confiança para evoluir o app.

### Arquivos permitidos

- `src/core/backup.js`
- `src/components/DataSafetyPanel.jsx`
- `src/App.js`
- `src/core/navigationModel.js`

### 10.1 Backup schema version

Em `backup.js`, elevar versão:

```js
const BACKUP_SCHEMA_VERSION = 2;
```

Garantir campos:

```js
activityLog: state.activityLog ?? [],
calendarMappingOverrides: state.calendarMappingOverrides ?? {},
```

### 10.2 Data Safety direto em “Mais”

A aba “Sistema” não deve ser dependência de produção. `navigationModel.js` já tem labels para `data_safety`, mas `MORE_ITEMS` não expõe corretamente. Adicionar:

```js
{
  view: "data_safety",
  label: "Seguranca de Dados",
  description: "Backup, exportacao e integridade dos seus dados.",
},
```

Em `App.js`, render direto:

```jsx
{view === "data_safety" && (
  <DataSafetyPanel />
)}
```

E remover a regra que redireciona `data_safety` para `statsSection("sistema")`.

### 10.3 Logar backup/export/import

Quando exportar backup, chamar:

```js
logActivityEvent(createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.BACKUP,
  title: "Backup exportado",
  source: "data_safety",
  target: { action: "export" },
}));
```

Quando importar:

```js
logActivityEvent(createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.BACKUP,
  title: "Backup importado",
  source: "data_safety",
  target: { action: "import" },
}));
```

### DoD da Etapa G

- Backup exportado contém `activityLog` e overrides.
- Import restaura timeline.
- Data Safety abre em “Mais”, sem depender da seção Sistema.
- Backup export/import aparece no Activity Log.

---

## 11. Etapa H — Multiusuário e sincronização segura

### Objetivo

Não quebrar usuários anônimos/autenticados quando `activityLog` entrar.

### Diagnóstico

A base está boa:

- `userScope.js` cria chave por usuário.
- `userDataPaths.js` já prevê `getUserActivityPath(uid)`.
- `firestore.rules` restringe `/usuarios/{uid}` ao próprio usuário.

### Decisão recomendada

**Não criar subcoleção Firestore agora.** Primeiro persistir `activityLog` no mesmo Zustand escopado e no backup. Motivo: reduz risco e mantém merge remoto/local atual.

Subcoleção futura só quando:

- `activityLog` passar de 1500 eventos com frequência;
- sync remoto ficar pesado;
- houver auditoria de conflitos.

### Patch mínimo em `App.js`

Onde o estado remoto/local é serializado, incluir:

```js
activityLog: state.activityLog,
calendarMappingOverrides: state.calendarMappingOverrides,
```

Onde mergeia dados remotos:

```js
activityLog: dados.activityLog || [],
calendarMappingOverrides: dados.calendarMappingOverrides || {},
```

### DoD da Etapa H

- Login troca escopo e mantém Activity Log do usuário correto.
- Logout não mistura dados do usuário autenticado com anônimo.
- Backup de usuário A não aparece para usuário B.

---

## 12. Etapa I — Raciocínio clínico: registrar atividade sem refazer banco de casos

### Objetivo

Não reabrir a auditoria antiga de casos/illness script. Aqui o foco é registrar atividade e deixar ação executável.

### Diagnóstico

- `RaciocinioClinico.jsx` tem abas boas: Illness Scripts, Casos, SCT, Anamnese, Conduta.
- `managementScore` existe na UI.
- `ClinicalTaskPanel.jsx` ainda guarda respostas em estado local no ZIP auditado, mas isso pertence à auditoria anterior.

### Patch incremental

Sempre que um caso clínico for registrado em `casosProgresso`, logar:

```js
const clinicalEvent = createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.CLINICAL_CASE,
  title: `Caso clinico: ${caso?.tema || casoId}`,
  summary: `Fase ${fase || ""} concluida.`,
  source: "raciocinio",
  target: { casoId, tema: caso?.tema || "", area: caso?.area || "" },
  metrics: {
    fase2Acerto: progresso?.fase2Acerto ?? null,
    sctAcerto: progresso?.sctAcerto ?? null,
    managementScore: progresso?.managementScore ?? null,
  },
});
```

### DoD da Etapa I

- Concluir caso/SCT/conduta cria evento `clinical_case`.
- Action Inbox consegue abrir `raciocinio` quando recomendar caso.
- Weekly Review contabiliza casos pela timeline.

---

## 13. Etapa J — ENAMED/provas: fechar o ciclo de análise

### Objetivo

Análise de prova não deve ficar só como registro. Deve gerar ação, evento e retorno ao cronograma.

### Arquivos permitidos

- `src/core/store.js`
- componente de análise ENAMED/simulados correspondente
- `src/core/actionInbox.js`

### Patch em `registrarAnaliseEnamed`

Depois de salvar análise:

```js
const examEvent = createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.EXAM_ANALYSIS,
  title: "Analise ENAMED registrada",
  summary: analysis?.resumo?.areaCritica
    ? `Area critica: ${analysis.resumo.areaCritica}.`
    : "Prova analisada.",
  source: "enamed",
  target: {
    area: analysis?.resumo?.areaCritica || "",
    analysisId: analysis?.id || "",
  },
  metrics: {
    score: analysis?.score ?? null,
    totalQuestoes: analysis?.totalQuestoes ?? null,
  },
});
```

Gerar ação executável:

```js
createAction({
  type: "new_topic",
  title: "Atacar area fraca da prova",
  reason: `Sua ultima analise apontou ${areaCritica}.`,
  priority: 96,
  source: "enamed",
  target: { view: "crono", area: areaCritica },
});
```

### DoD da Etapa J

- Registrar análise ENAMED aparece na timeline.
- Action Inbox direciona para Cronograma filtrado/área, ou pelo menos abre Cronograma.
- Weekly Review conta prova analisada.

---

## 14. Etapa K — Remover dependências dev da experiência de produção

### Objetivo

Cortar ruído de sistema/desenvolvimento na experiência final.

### Itens obrigatórios

1. `Cronograma.jsx`: esconder “Usar amostra de desenvolvimento” em produção.
2. `StatsPanel.jsx`: se a aba “Sistema” ainda existir no branch atual, remover ou manter apenas em dev real. Como a auditoria anterior já cobria isso, aqui só fazer checagem.
3. `navigationModel.js`: “Mais” deve expor ferramentas úteis ao usuário, não debug.
4. `LaunchChecklistPanel`: manter `devOnly` ou esconder em produção.
5. Strings visíveis: não usar “FSRS”, “overload”, “debug”, “dev sample” para usuário final.

### Comando de varredura

```bash
git grep -nE "Sistema|dev|debug|amostra de desenvolvimento|FSRS|overload|Data Safety|LaunchChecklist" src
```

### DoD da Etapa K

- Usuário final não vê amostra de desenvolvimento.
- Usuário final não vê aba Sistema.
- Data Safety aparece como ferramenta de segurança, não painel dev.
- Launch Checklist não aparece para usuário comum.

---

## 15. Ordem recomendada de implementação

### Bloco 1 — Espinha dorsal

1. **Etapa A — Activity Log Core**
2. **Etapa C — Action Inbox executável**
3. **Etapa D — Fechamento de sessão como dado**

> Depois desse bloco, o app para de “falar” e começa a “executar”.

### Bloco 2 — Produto utilizável

4. **Etapa B — Timeline de atividade**
5. **Etapa E — Importação de calendário v2**
6. **Etapa G — Data Safety/backup v2**

### Bloco 3 — Consolidação

7. **Etapa F — Weekly Review baseado em eventos**
8. **Etapa H — Multiusuário seguro**
9. **Etapa I — Raciocínio clínico registra atividade**
10. **Etapa J — ENAMED/provas fecha ciclo**
11. **Etapa K — Hardening de produção**

---

## 16. Prompts prontos para implementação por blocos

### Prompt 1 — Activity Log + Action Inbox

```txt
Você é um engenheiro sênior React/Zustand. Implemente apenas o Bloco 1 do arquivo MEDREV_AUDITORIA_INCREMENTAL_FUNCOES_RESTANTES.md.

Escopo:
1. Criar src/core/activityLog.js e src/core/activityLog.test.js.
2. Integrar activityLog ao src/core/store.js.
3. Logar eventos de revisão FSRS, fechamento de sessão e ações do mentor.
4. Corrigir ActionInbox para que toda ação com target executável tenha CTA real.

Regras:
- Não mexer no motor matemático do FSRS.
- Não refatorar Dashboard inteiro.
- Não alterar shape de casos clínicos.
- Não criar nova aba principal.
- Manter strings novas visíveis com UTF-8 correto ou escapes unicode se necessário.
- Rodar npm run check:mojibake, npm test -- --watchAll=false e npm run build.

Entrega:
- Código implementado.
- Lista de arquivos alterados.
- Testes criados/atualizados.
- QA manual: marcar revisão, fechar sessão, aceitar ação, ver eventos no store.
```

### Prompt 2 — Timeline + Backup + Data Safety

```txt
Implemente o Bloco 2 do arquivo MEDREV_AUDITORIA_INCREMENTAL_FUNCOES_RESTANTES.md.

Escopo:
1. Criar ActivityTimeline.jsx.
2. Integrar timeline em Stats > Atividade.
3. Estender backup.js para incluir activityLog e calendarMappingOverrides.
4. Expor DataSafetyPanel em Mais como data_safety, sem depender de Stats > Sistema.
5. Logar export/import de backup como evento.

Proibido:
- Não mexer no motor FSRS.
- Não criar subcoleção Firestore.
- Não mostrar LaunchChecklist para usuário final.

Rodar:
npm run check:mojibake && npm test -- --watchAll=false && npm run build
```

### Prompt 3 — Calendário v2

```txt
Implemente a Etapa E do arquivo MEDREV_AUDITORIA_INCREMENTAL_FUNCOES_RESTANTES.md.

Escopo:
1. Esconder "Usar amostra de desenvolvimento" em produção.
2. Criar suporte a calendarMappingOverrides.
3. Transformar CalendarMappingPanel em painel corrigível com select de temas MEDCOF.
4. Persistir overrides no store e backup.
5. Logar calendar_import no Activity Log.
6. Criar testes para applyCalendarMappingOverrides.

Proibido:
- Não implementar OCR/PDF agora.
- Não instalar dependências novas.
- Não alterar a base MEDCOF.
```

### Prompt 4 — Weekly Review + ENAMED + clínico

```txt
Implemente as Etapas F, I e J do arquivo MEDREV_AUDITORIA_INCREMENTAL_FUNCOES_RESTANTES.md.

Escopo:
1. Weekly Review deve usar summarizeActivity(activityLog).
2. Salvar Weekly Review cria evento weekly_review.
3. Concluir caso clínico/SCT/conduta cria evento clinical_case.
4. Registrar análise ENAMED cria evento exam_analysis e ação executável para Cronograma/Sims.

Proibido:
- Não reescrever RaciocinioClinico.jsx inteiro.
- Não alterar shape dos casos clínicos.
- Não refazer score clínico da auditoria anterior.
```

---

## 17. Checklist de QA manual

### Activity Log

- [ ] Marque D0/D1/D4 de um tema.
- [ ] Abra `Stats > Atividade`.
- [ ] Verifique se aparecem eventos `Revisao`.
- [ ] Feche sessão.
- [ ] Verifique se aparece `Fechamento`.
- [ ] Aceite uma ação do mentor.
- [ ] Verifique se aparece `Mentor` com status `accepted`.

### Action Inbox

- [ ] Gere revisão vencida.
- [ ] Ação “Resolver revisões vencidas” deve ter botão `Iniciar`.
- [ ] Clique e confirme que abre FocusMode no tema correto.
- [ ] Gere ação de caso clínico.
- [ ] Clique e confirme que abre Raciocínio Clínico.
- [ ] Gere ação de área fraca e confirme que abre Cronograma/Sims.

### Calendário

- [ ] Importar texto simples com 3 tópicos.
- [ ] Ver preview.
- [ ] Corrigir manualmente 1 match.
- [ ] Recarregar app e confirmar override.
- [ ] Confirmar evento `Calendario importado` na timeline.
- [ ] Em build de produção, botão de amostra dev não aparece.

### Backup

- [ ] Exportar backup.
- [ ] Confirmar JSON com `activityLog`.
- [ ] Importar backup em estado limpo.
- [ ] Timeline reaparece.

### Multiusuário

- [ ] Usar anônimo e gerar eventos.
- [ ] Fazer login.
- [ ] Verificar que eventos do anônimo não vazam automaticamente sem merge pretendido.
- [ ] Logout retorna escopo anônimo.

---

## 18. Riscos e decisões que NÃO devem ser tomadas agora

### Não instalar `ts-fsrs` agora

Apesar de o ecossistema `ts-fsrs` estar ativo e ter scheduler/optimizer, isso não resolve o problema atual. O gargalo é execução e telemetria, não trocar biblioteca. Além disso, a stack atual é CRA/Zustand; instalar biblioteca nova sem necessidade aumenta risco. Deixe para uma etapa futura de otimização com dados reais.

### Não criar Firestore subcollection agora

`userDataPaths.js` já prevê `activityLog`, mas criar subcoleção antes do log estabilizar aumenta complexidade de merge/sync. Primeiro store + backup. Depois subcoleção.

### Não transformar Weekly Review em rede social de estatísticas

Weekly Review deve responder:

1. o que executei;
2. o que travou;
3. qual ajuste vem primeiro;
4. qual ação abre agora.

Qualquer coisa além disso entra em “avançado”.

### Não expandir fechamento de sessão demais

Fechamento de sessão precisa levar menos de 20 segundos. Se ficar clínico demais, o aluno não usa.

---

## 19. Definition of Done global

Para qualquer bloco:

- [ ] `npm run check:mojibake` verde.
- [ ] `npm test -- --watchAll=false` verde ou falhas documentadas como pré-existentes.
- [ ] `npm run build` verde.
- [ ] Nenhuma string dev visível para usuário final.
- [ ] Toda ação do mentor tem target executável ou é explicitamente `noop`.
- [ ] Toda função nova cria evento no Activity Log.
- [ ] Backup exporta/importa estado novo.
- [ ] Não vaza feature de residência para vestibular sem `platformFeatures`.
- [ ] Não cria taxonomia paralela se já existe core para isso.
- [ ] Sem commit/deploy automático.

---

## 20. Conclusão técnica

O próximo salto do MedRev não é adicionar mais cards. É criar **auditabilidade operacional**.

A sequência certa é:

```txt
Activity Log -> Action Inbox executável -> Fechamento útil -> Timeline -> Calendário corrigível -> Backup -> Weekly Review real
```

Isso transforma o MedRev de “app com bons módulos” em **sistema de estudo que lembra, decide, executa e explica**. Depois disso, faz sentido voltar para refinamentos de FSRS, score clínico e dashboards avançados com dados reais.

---

## 21. Fontes externas consultadas

- Anki Manual — Deck Options / FSRS: retenção desejada, carga e uso correto de Again.
- open-spaced-repetition/free-spaced-repetition-scheduler: dificuldade, estabilidade, recuperabilidade e adaptação a histórico.
- ts-fsrs README: ecossistema JS/TS de scheduler/optimizer FSRS.
- Revisão MDPI 2025 sobre Learning Analytics Dashboards: feedback acionável e baixa inferência.
- Literatura de illness scripts e Script Concordance Test em educação médica: raciocínio sob incerteza, feedback estruturado e scripts de expert.
- AMBOSS e plataformas de estudo médico: referência de posicionamento para ferramenta clínica/exame, não como banco de questões substituto.

```

### MEDREV_CODE_AUDIT_SAFETY_UX_VALIDATION_PLAN.md

```txt
# MEDREV — Auditoria Profunda do Código Atual nas Funções Críticas e Plano Integrado

> **Arquivo sugerido no repo:** `docs/MEDREV_CODE_AUDIT_SAFETY_UX_VALIDATION_PLAN.md`  
> **Fonte analisada:** `Bro (19).zip`  
> **Escopo:** Data Safety, escopo por usuário, Firestore, backup/restore, onboarding, welcome/resumo do dia, Dashboard mobile, inputs numéricos, tooltips, Weekly Review, Gargalo ENAMED, telemetria/validação do preparo estimado.  
> **Objetivo:** transformar o estado real do código em um plano cirúrgico para GPT-5.4/GPT-5.5/Claude implementar sem alucinar.

---

## 0. Limitação da auditoria

A análise foi feita por inspeção estática do código extraído do ZIP.

Não foi possível rodar a suíte localmente neste ambiente porque o ZIP não trouxe `node_modules` e `react-scripts` não está instalado no sandbox:

```txt
sh: 1: react-scripts: not found
```

Portanto, a validação final deve ser feita no seu ambiente com:

```powershell
npm install
npm run check:mojibake
npm test -- --watchAll=false
npm run build
npm run audit
```

Observação: no `package.json` atual existe `audit`, mas **não existe `audit:full`**. Muitos prompts antigos mandam rodar `npm run audit:full`; isso precisa ser corrigido ou adicionado.

---

# 1. Diagnóstico executivo

O código já avançou bastante. Não estamos no zero.

Já existem:

```txt
userScope.js
authSession.js
userDataMigration.js
userDataPaths.js
firestore.rules
DataSafetyPanel.jsx
backup.js
navigationModel.js com Data Safety em Mais
WeeklyReview.jsx
OnboardingWizard.jsx
VestibularStartTrail.jsx
WelcomePopup dentro do Dashboard
SmartTooltip/InfoTooltip em Primitives.jsx
reviewTaskPlanner atualizado para D21 mini_case
```

Mas ainda há lacunas importantes.

## P0 — antes de lançamento aberto

```txt
1. Data Safety está parcialmente implementado, mas ainda não é robusto o bastante para beta aberto.
2. localStorage já tem chave por uid, mas o fluxo de troca de usuário/hidratação ainda precisa de teste de isolamento end-to-end.
3. Firestore Rules estão escopadas por uid, mas ainda amplas dentro de /usuarios/{uid}; devem ser endurecidas e documentadas.
4. Backup/restore existe, mas a verificação de integridade ainda é superficial; falta dataIntegrity real.
5. Telemetria atual usa Firebase Analytics diretamente e envia uid em alguns eventos; falta sanitização e opt-out.
6. Dashboard mobile ainda mistura ação, diagnóstico e avançado.
7. Onboarding e resumo do dia têm estados paralelos e podem reaparecer/sumir de forma errada.
8. Inputs numéricos aceitam strings inválidas porque dependem de `type=number`, `parseInt` e `+e.target.value`.
9. Tooltips dependem de hover/click simples e fecham no scroll; mobile precisa de bottom sheet/popover seguro.
10. Weekly Review aparece cedo demais e gera conteúdo genérico.
```

---

# 2. Estado real por área

---

## 2.1 Data Safety / escopo de usuário

### Arquivos relevantes

```txt
src/core/userScope.js
src/core/authSession.js
src/core/userDataMigration.js
src/services/userDataPaths.js
src/services/firebase.js
src/core/store.js
src/components/DataSafetyPanel.jsx
src/core/backup.js
firestore.rules
```

### O que está bom

`userScope.js` já cria chave local por ambiente e uid:

```js
getUserScopedStorageKey(uid, env) -> medrev:<env>:user:<uid>:store
```

E chave anônima:

```js
getAnonymousStorageKey(sessionId, env) -> medrev:<env>:anonymous:<sessionId>:store
```

`authSession.js` já monta sessão com `scopeKey` e bloqueia sync divergente com:

```js
assertActiveUserScope(activeUid, currentUid)
```

`App.js` já faz uma sequência importante no login/logout:

```txt
1. detecta uid atual;
2. calcula scopeKey;
3. setAuthSession(...hydrated:false);
4. resetStore();
5. useStore.persist.setOptions({ name: scopeKey });
6. useStore.persist.rehydrate();
7. carrega Firebase se usuário autenticado;
8. salva/mescla conforme updatedAt.
```

`services/firebase.js` também valida uid antes de escrever:

```js
assertWriteScope(uid)
```

Isso é bom. Já reduz bastante o risco de vazamento entre contas.

### O que ainda está frágil

#### 1. Store ainda nasce com chave anônima default

Em `store.js`:

```js
const DEFAULT_PERSIST_SCOPE_KEY = getAnonymousStorageKey(getOrCreateAnonymousSessionId());

persist(..., {
  name: DEFAULT_PERSIST_SCOPE_KEY,
  storage: createJSONStorage(() => localStorage),
})
```

Isso é aceitável, mas precisa de teste end-to-end garantindo que:

```txt
usuário A loga -> carrega escopo A;
usuário A desloga -> não deixa dados A visíveis;
usuário B loga -> não carrega dados A;
usuário anônimo -> não herda dados de usuário autenticado.
```

Hoje a proteção existe, mas não há prova suficiente.

#### 2. Paths usam coleção `usuarios`, não `/users/{uid}`

`userScope.js` define:

```js
const USER_COLLECTION = "usuarios";
```

`userDataPaths.js` retorna paths como:

```txt
["usuarios", uid]
["usuarios", uid, "activityLog"]
["usuarios", uid, "backups"]
```

Isso não é errado, mas todos os docs novos falam em `/users/{uid}`. Precisa escolher uma convenção.

Recomendação:

```txt
Manter "usuarios" se já está em produção/dev e não quiser migração agora.
Mas documentar que o path canônico atual é /usuarios/{uid}.
Não misturar /users e /usuarios.
```

#### 3. `firestore.rules` está owner-only, mas amplo dentro do usuário

Atual:

```js
match /usuarios/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;

  match /{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
}
```

Isso impede outro usuário de ler/escrever dados de outro uid. Bom.

Mas ainda permite qualquer escrita dentro de qualquer subpath do próprio usuário. Para beta pequeno, isso é aceitável. Para lançamento, melhor restringir por subcoleções permitidas:

```txt
/usuarios/{uid}
/usuarios/{uid}/activityLog/{eventId}
/usuarios/{uid}/backups/{backupId}
/usuarios/{uid}/telemetry/{eventId}
/usuarios/{uid}/calendarImports/{importId}
```

#### 4. DataSafetyPanel é real, mas verificação é superficial

`DataSafetyPanel.jsx` já faz:

```txt
Exportar backup JSON
Importar backup JSON
Validar local
Migrar legado
Limpar caches temporários
Mostrar UID atual
Mostrar escopo local
Mostrar store legada
Mostrar tamanho local
```

Mas a validação usa `validateMedrevBackup` de `backup.js`, que checa estrutura geral:

```txt
version
schema
ownerUid
meta/res/vest object
contagem de temas
```

Falta validar integridade do estado:

```txt
temas array;
tema.id;
tema.nome;
rev object;
datas válidas;
domínio prévio coerente;
D7/D21/D14 sem contradição;
reviewHistory;
acertos normalizados;
steps inválidos.
```

#### 5. Duplicação de backup no Ajustes e em DataSafetyPanel

Há backup/import/migração também em `Modals.jsx` dentro do modal de Ajustes. Isso cria duas fontes de verdade para Data Safety.

Recomendação:

```txt
DataSafetyPanel deve ser a fonte principal.
Ajustes pode ter apenas um botão: "Abrir Segurança dos dados".
```

---

## 2.2 Telemetria / validação do preparo estimado

### Estado atual

Não existem arquivos:

```txt
src/core/telemetry.js
src/core/readinessValidation.js
src/core/dataIntegrity.js
```

A telemetria atual está espalhada em `services/firebase.js`, `App.js`, `Dashboard.jsx` e `Simulados.jsx`.

`services/firebase.js` usa Firebase Analytics:

```js
export async function trackEvent(name, params = {}) {
  const analytics = await getAnalyticsSafe();
  logEvent(analytics, name, params);
}
```

Eventos atuais encontrados:

```txt
retorno_d7 / retorno_d1
primeira_revisao
revisoes_zeradas_dia
dominio_previo_avaliado
onboarding_done
simulado_registrado
```

### Problema P0/P1

Alguns eventos enviam `uid` explicitamente nos params, por exemplo:

```js
trackEvent("primeira_revisao", { uid: usuarioLogado?.uid, step: stepKey, plat });
```

Isso não é ideal para uma instrumentação privada. Mesmo que Firebase Analytics já tenha user/session internamente, o app não deveria colocar `uid` no payload de evento operacional.

Também não há:

```txt
opt-out;
sanitização central;
bloqueio de texto livre;
eventos de aderência ao Mentor;
snapshots de readiness;
comparação readiness vs simulado.
```

### Decisão

Antes de qualquer telemetria nova:

```txt
1. criar src/core/telemetry.js;
2. sanitizar payload;
3. remover uid de payloads;
4. criar flag de opt-out;
5. criar eventos mínimos;
6. não criar BI pesado.
```

---

## 2.3 Dashboard mobile

### Arquivo principal

```txt
src/components/Dashboard.jsx
```

### Estado atual observado no código

O Dashboard tem:

```txt
Comando do Mentor
top bar com provider/importar/consistência/prova
ActionInbox
Avançado colapsável
KPIs dentro do Avançado
Gargalo ENAMED / Raciocínio clínico
MiniCronogramaWidget dentro do Avançado
WeeklyReview dentro do Avançado
WelcomePopup
VestibularStartTrail
TourBalloon
```

### Problemas confirmados pelo código e prints

#### 1. Top bar mobile está carregada demais

No hero, linhas do `Dashboard.jsx` mostram:

```txt
Provider: ...
Importar
Consistência
Prova
Reta final
Editar nome
```

Isso explica o print: no mobile a barra superior não comporta tudo.

#### 2. Revisão & Cronograma está dentro do Avançado

No código, `MiniCronogramaWidget` aparece dentro de:

```jsx
{showAdvanced && (
  <>
    KPIs
    Gargalo ENAMED
    MiniCronogramaWidget
    WeeklyReview
  </>
)}
```

Isso confirma o bug: `Revisão & Cronograma` é operacional, mas está escondido dentro de Avançado.

#### 3. WeeklyReview também está no Avançado e aparece cedo

`WeeklyReview` é renderizado sempre que `showAdvanced` está aberto. O próprio componente monta planos mesmo com poucos dados, gerando:

```txt
0 sessões;
a definir;
sem bloqueio dominante;
funções genéricas.
```

#### 4. Gargalo ENAMED é inespecífico

O card usa:

```js
readinessData.priorityList[0].area
coverage
retention
```

Mas não explica:

```txt
por que é gargalo;
qual evidência usou;
qual ação tomar;
qual tema específico;
se a amostra é suficiente.
```

#### 5. "FSRS/Curva de revisão hoje" vs "Fila cronológica" confunde

O código ainda usa labels como:

```txt
Curva de revisão hoje
Cronograma
Fila de hoje
```

A distinção operacional precisa virar:

```txt
Revisões de hoje
Próximas revisões
Plano da semana
```

#### 6. Avançado vira depósito de tudo

O `Advanced` contém coisas que não deveriam estar juntas:

```txt
KPIs
gargalo
raciocínio clínico
revisão & cronograma
weekly review
```

Isso é a causa da sensação de confusão no mobile.

---

## 2.4 Tooltips mobile

### Arquivo principal

```txt
src/components/Primitives.jsx
```

`SmartTooltip` usa:

```txt
onMouseEnter
onMouseLeave
onClick
position fixed
fecha no scroll
fecha no resize
```

### Problema

No mobile:

```txt
não existe hover;
o tooltip pode abrir e fechar de forma instável;
scroll fecha imediatamente;
posição calculada pode ficar ruim em cards dentro de containers scrolláveis;
não há bottom sheet;
não há fundo clicável;
não há X no tooltip.
```

### Decisão

No mobile, `InfoTooltip` deve abrir como:

```txt
bottom sheet pequeno;
ou popover centralizado;
com X;
fecha por backdrop;
não fecha só porque a página scrollou;
não ultrapassa viewport.
```

---

## 2.5 Inputs numéricos

### Arquivo principal

```txt
src/components/Modals.jsx
```

### Estado atual

Há vários inputs do tipo `number` com `parseInt`, `parseFloat` ou `+e.target.value`:

```jsx
<Input type="number" ... onChange={(e) => saveMeta({ metaDiaria: +e.target.value })} />
<Input type="number" ... onChange={(e) => saveMeta({ maxRevisoesDia: parseInt(e.target.value, 10) || 30 })} />
```

### Problema

`type="number"` não é suficiente. Dependendo do browser/mobile, o usuário ainda pode digitar:

```txt
O10
1e5
-
.
```

Além disso, os fallbacks com `||` podem transformar valor legítimo `0` em default incorreto em alguns campos.

### Decisão

Criar helper canônico:

```txt
src/core/numberInput.js
src/core/numberInput.test.js
```

E usar em todos os inputs críticos.

---

## 2.6 Onboarding e trilha inicial

### Arquivos relevantes

```txt
src/core/onboarding.js
src/components/OnboardingWizard.jsx
src/core/vestibularOnboarding.js
src/components/VestibularStartTrail.jsx
src/components/Dashboard.jsx
src/core/store.js
```

### Estado atual

Há dois sistemas paralelos:

```txt
meta.onboarding / onboardingDone
meta.vestibularStart
```

`OnboardingWizard` completa `meta.onboarding`.

`VestibularStartTrail` depende de:

```js
isVestibularStartComplete(meta)
```

que só verifica:

```js
meta.vestibularStart.completed === true
```

### Problema

Isso explica a sensação de “trilha inicial configurada toda hora”.

O usuário pode completar um onboarding geral, mas a trilha específica do vestibular continuar incompleta. Ou o app pode não ter uma regra unificada para decidir:

```txt
mostrar onboarding geral;
mostrar trilha vestibular;
mostrar resumo do dia;
não mostrar nada.
```

### Decisão

Criar helper canônico:

```txt
src/core/onboardingGate.js
```

Com funções:

```js
shouldShowGlobalOnboarding(state)
shouldShowVestibularStartTrail(state)
shouldShowDailyBriefing(state)
markOnboardingDismissed(...)
markDailyBriefingDismissed(...)
```

---

## 2.7 WelcomePopup / Resumo do dia

### Estado atual

`Dashboard.jsx` tem `WelcomePopup`, mas a exibição depende de:

```js
const SESSION_KEY = "medrev_welcome_shown";
sessionStorage.getItem(SESSION_KEY)
```

### Problemas

```txt
1. A chave não é por uid.
2. A chave não é por dia.
3. Pode sumir pelo resto da sessão mesmo se o usuário trocar de conta.
4. Não existe dismissal diário.
5. Não usa o escopo local seguro.
6. Compete com onboarding/tour.
```

### Decisão

Substituir por `DailyBriefing`:

```txt
src/core/dailyBriefing.js
src/core/dailyBriefing.test.js
src/components/DailyBriefingCard.jsx
```

Regras:

```txt
mostrar no primeiro acesso do dia;
não mostrar se onboarding obrigatório está ativo;
não mostrar se dismissado hoje;
chave por uid/data;
não ser modal agressivo por padrão;
conteúdo: revisões, minutos, prioridade, atraso, CTA.
```

---

## 2.8 Weekly Review

### Estado atual

`WeeklyReview.jsx` calcula tudo localmente e chama `buildWeeklyReview`.

Ele aparece no Dashboard quando Advanced está aberto, sem critério mínimo de maturidade.

### Problemas

```txt
1. Aparece cedo demais.
2. Gera plano genérico.
3. Ações são sempre exibidas, mesmo sem contexto.
4. "Focar área fraca" pode aparecer sem área real.
5. "Selecionar temas", "Importar cronograma", "Já domino" aparecem como menu genérico.
```

### Decisão

Criar gating:

```txt
min 7 dias desde início
OU 5 sessões
OU 20 revisões/questões
```

Antes disso:

```txt
Sua revisão semanal será liberada após alguns dias de uso. Por enquanto, conclua o primeiro ciclo.
```

Ações devem ser condicionais:

```txt
sem cronograma -> Importar/criar cronograma;
sem sessões -> Começar primeiro ciclo;
área fraca real -> Focar área fraca;
tema não iniciado -> Usar Já domino;
revisão vencida -> Recuperar atrasadas.
```

---

## 2.9 Já domino

### Estado atual

`domainValidation.js` usa:

```txt
80–89% -> D7
>=90% -> D21
```

O copy em `Modals.jsx` também fala:

```txt
D7 (80–89%) ou D21 (90%+)
```

### Atenção estratégica

Em planos anteriores, foi discutido D14 para >=90%. O código atual consolidou D21. Isso precisa ser uma decisão explícita.

### Recomendação

Para evitar retrabalho:

```txt
Manter o comportamento atual D21 se essa foi a decisão mais recente.
Atualizar todos os docs antigos que ainda falem D14.
Ou, se você quiser voltar para D14, fazer bloco específico.
```

No momento, **não mexer nisso junto com UX/Data Safety**.

---

# 3. Plano integrado atualizado

## Ordem correta agora

```txt
0. Checkpoint/backup local.
1. Se testes estiverem quebrados: corrigir primeiro.
2. UX1 — inputs numéricos seguros.
3. UX3 — onboarding/trilhas não repetirem.
4. UX4 — resumo do dia por uid/dia.
5. UX2 — tooltips mobile.
6. UX5 — Dashboard mobile e hierarquia.
7. UX6 — Weekly Review útil/contextual.
8. UX7 — Gargalo ENAMED específico.
9. N0 — auditoria final Data Safety.
10. N1/N2/N3/N4 — endurecimento Data Safety.
11. V1 — telemetry privada mínima.
12. V2 — validação do preparo estimado.
13. Beta fechado.
```

Se for lançar para estudantes reais, inverta UX e Data Safety assim:

```txt
1. Testes verdes.
2. N0–N4 Data Safety.
3. UX1/UX3/UX4/UX5.
4. V1/V2.
5. Beta fechado.
```

Minha recomendação direta:

```txt
Faça UX1 e UX3 agora porque são pequenos e afetam confiança.
Depois faça N0–N4 antes de qualquer beta real.
```

---

# 4. Blocos mastigados para implementação

---

## BLOCO CHECK — Normalizar scripts de validação

### Modelo

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
package.json
scripts/audit.mjs
```

### Problema

Prompts antigos usam `npm run audit:full`, mas o script não existe.

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO CHECK — normalizar scripts de validação.

Problema:
O package.json atual possui "audit", mas não possui "audit:full". Muitos fluxos/prompt mandam rodar "npm run audit:full", causando erro operacional.

Arquivos permitidos:
- package.json
- scripts/audit.mjs, apenas se necessário

Tarefas:
1. Adicionar script:
   "audit:full": "node scripts/audit.mjs"
2. Opcionalmente adicionar:
   "audit:quick": "node scripts/audit.mjs"
3. Não alterar lógica do app.
4. Não instalar libs.
5. Não mexer em src.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build
npm run audit:full

Pare e entregue relatório.
```

---

## BLOCO UX1 — Inputs numéricos seguros

### Modelo

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
src/core/numberInput.js
src/core/numberInput.test.js
src/components/Modals.jsx
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX1 — inputs numéricos seguros.

Problema confirmado no código:
Modals.jsx usa vários <Input type="number"> com parseInt/parseFloat/+e.target.value. Isso permite casos como "O10", "1e5", "-", "." e strings inválidas em campos de ajuste.

Objetivo:
Criar sanitização/validação numérica centralizada e aplicar nos campos críticos de Ajustes e "Já domino".

Arquivos permitidos:
- src/core/numberInput.js
- src/core/numberInput.test.js
- src/components/Modals.jsx

Não alterar:
- fsrs.js
- store.js
- Dashboard
- Stats
- Firebase/Auth/localStorage

Tarefas:
1. Criar helper sanitizeNumericInput(value, options).
2. Converter "O" e "o" para "0".
3. Remover caracteres não numéricos.
4. Bloquear notação científica.
5. Permitir decimal apenas quando allowDecimal=true.
6. Aplicar min/max.
7. Preservar zero quando zero é válido.
8. Aplicar nos campos:
   - meta de acerto;
   - teto diário de revisões;
   - intervalo máximo;
   - meta diária de revisões;
   - meta diária de questões;
   - meta total de questões;
   - dias personalizados de pausa;
   - "Já domino": total de questões e acertos.
9. Mostrar erro curto se valor inválido.
10. Adicionar testes.

Rode:
npm test -- --watchAll=false src/core/numberInput.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO UX2 — Onboarding e trilhas não repetirem

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/onboardingGate.js
src/core/onboardingGate.test.js
src/core/onboarding.js
src/core/vestibularOnboarding.js
src/components/Dashboard.jsx
src/components/OnboardingWizard.jsx
src/components/VestibularStartTrail.jsx
src/core/store.js apenas se for necessário adicionar campos de estado já dentro de meta
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX2 — onboarding e trilhas não repetirem.

Problema confirmado:
Existem estados paralelos:
- onboardingDone/meta.onboarding;
- meta.vestibularStart.
A trilha inicial pode aparecer repetidamente porque a regra de exibição não está centralizada.

Objetivo:
Criar gating canônico para onboarding geral, trilha vestibular e resumo do dia.

Arquivos permitidos:
- src/core/onboardingGate.js
- src/core/onboardingGate.test.js
- src/core/onboarding.js
- src/core/vestibularOnboarding.js
- src/components/Dashboard.jsx
- src/components/OnboardingWizard.jsx
- src/components/VestibularStartTrail.jsx
- src/core/store.js apenas se necessário dentro de meta

Não alterar:
- Firebase/Auth/localStorage paths
- FSRS
- Mentor decision policy
- Stats
- FocusMode

Tarefas:
1. Criar shouldShowGlobalOnboarding(state/context).
2. Criar shouldShowVestibularStartTrail(state/context).
3. Regras:
   - onboarding geral aparece só se setup realmente não foi concluído;
   - trilha vestibular aparece só em plat="vest" e se meta.vestibularStart.completed !== true;
   - se o usuário dismissou hoje, não mostrar de novo hoje;
   - se há plano ativo e primeira ação possível, não bloquear Dashboard com onboarding.
4. Persistir completedAt/dismissedAt/version dentro de meta.onboarding e meta.vestibularStart quando aplicável.
5. Permitir reabrir manualmente via Ajustes/Mais, se já houver ação de reset.
6. Adicionar testes:
   - usuário novo sem plano -> mostra;
   - usuário com plano -> não mostra;
   - dismissado hoje -> não mostra;
   - vestibular completo -> não mostra;
   - residência não mostra trilha vestibular.

Rode:
npm test -- --watchAll=false src/core/onboardingGate.test.js src/core/onboarding.test.js src/core/vestibularOnboarding.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO UX3 — Resumo do dia por usuário e por data

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/dailyBriefing.js
src/core/dailyBriefing.test.js
src/components/Dashboard.jsx
src/components/DailyBriefingCard.jsx ou componente equivalente
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX3 — Resumo do dia.

Problema confirmado:
WelcomePopup usa SESSION_KEY global "medrev_welcome_shown", em sessionStorage, sem uid e sem data. Isso faz o resumo sumir ou reaparecer de forma errada.

Objetivo:
Criar Resumo do dia leve, por uid/data, que aparece no máximo uma vez ao dia e não compete com o Comando do Mentor.

Arquivos permitidos:
- src/core/dailyBriefing.js
- src/core/dailyBriefing.test.js
- src/components/Dashboard.jsx
- src/components/DailyBriefingCard.jsx ou adaptar WelcomePopup se preferir

Não alterar:
- Mentor decision policy
- FSRS
- Store persist profunda
- Firebase/Auth/localStorage paths

Tarefas:
1. Criar buildDailyBriefing({ state, context }).
2. Conteúdo:
   - N revisões hoje;
   - tempo estimado;
   - prioridade do dia;
   - atraso se houver;
   - CTA Começar agora;
   - CTA secundário Ver plano.
3. Criar chave de dismissal:
   medrev:<env>:user:<uid>:dailyBriefing:<YYYY-MM-DD>
   ou usar scopeKey atual + data.
4. Não mostrar se onboarding obrigatório estiver ativo.
5. Não mostrar se dismissado no dia.
6. Não abrir como modal agressivo por padrão; preferir card leve/top banner.
7. Remover dependência de SESSION_KEY global.
8. Adicionar testes.

Rode:
npm test -- --watchAll=false src/core/dailyBriefing.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO UX4 — Tooltips mobile como bottom sheet

### Modelo

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
src/components/Primitives.jsx
src/components/Dashboard.jsx somente se necessário
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX4 — tooltips mobile.

Problema confirmado:
SmartTooltip usa hover/click e fecha no scroll. No mobile, tooltips do Dashboard/Avançado não aparecem ou aparecem fora da tela.

Objetivo:
Em mobile, InfoTooltip deve abrir por tap como bottom sheet/popover seguro.

Arquivos permitidos:
- src/components/Primitives.jsx
- src/components/Dashboard.jsx somente se precisar ajustar uso

Não alterar:
- lógica de métricas
- Mentor
- FSRS
- Store

Tarefas:
1. Detectar mobile por viewport ou media query.
2. Desktop mantém tooltip atual.
3. Mobile:
   - abre por tap;
   - renderiza bottom sheet ou popover centralizado;
   - tem X;
   - tem backdrop clicável;
   - não ultrapassa viewport;
   - não fecha imediatamente no scroll dentro da página.
4. Garantir z-index acima dos cards.
5. Garantir acessibilidade básica: role dialog/tooltip, aria-label.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO UX5 — Dashboard mobile: hierarquia e compactação

### Modelo

```txt
GPT-5.5 High
```

### Arquivo permitido

```txt
src/components/Dashboard.jsx
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX5 — Dashboard mobile compacto.

Problemas confirmados no código:
1. Top bar do hero mostra provider, importar, consistência, prova e reta final no mesmo bloco.
2. Revisão & Cronograma está dentro de showAdvanced.
3. WeeklyReview está dentro de showAdvanced.
4. Gargalo ENAMED está no Dashboard, mas inespecífico.
5. Dashboard mistura ação, diagnóstico e projeção.

Objetivo:
Reorganizar a hierarquia visual do Dashboard sem mexer no motor do Mentor.

Arquivo permitido:
- src/components/Dashboard.jsx

Não alterar:
- mentorDecisionPolicy.js
- mentorSignals.js
- fsrs.js
- store.js
- StatsPanel
- FocusMode
- Firestore/Auth/localStorage

Nova ordem mobile:
1. Comando do Mentor / caixa principal de ação.
2. ActionInbox como "Fila do plano" curta.
3. Revisão & Cronograma compacto fora do Avançado.
4. Continuar estudando, se houver.
5. Atalhos principais, se já existirem.
6. Avançado colapsado com KPIs diagnósticos.

Tarefas:
1. Mover MiniCronogramaWidget para fora de showAdvanced.
2. Posicionar logo abaixo de ActionInbox/caixa de ações.
3. Remover WeeklyReview do Dashboard inicial; se mantiver, exibir apenas via gating do bloco UX6.
4. Em mobile, top bar deve mostrar só:
   - saudação/título;
   - carga curta;
   - menu compacto de ações.
5. Mover provider/importar/consistência/prova para menu/linha secundária colapsável.
6. Remover "Carga de revisões próximos 14 dias" do Dashboard se existir; isso pertence ao Plano/Stats.
7. Renomear:
   - "Curva de revisão hoje" -> "Revisões de hoje"
   - "Fila cronológica" -> "Próximas revisões"
8. Evitar mostrar "Revisões de hoje" e "Próximas revisões" no mesmo bloco.
9. Não remover funcionalidades; apenas reclassificar/colapsar.
10. Garantir layout mobile sem overflow horizontal.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO UX6 — Weekly Review útil e ações contextuais

### Modelo

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
src/components/WeeklyReview.jsx
src/core/weeklyReviewGate.js
src/core/weeklyReviewGate.test.js
src/core/sessionReflection.js somente se necessário
src/components/Dashboard.jsx somente para renderização/gating
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX6 — Weekly Review útil e ações contextuais.

Problema confirmado:
WeeklyReview aparece cedo demais e gera frases como "0 sessões", "a definir" e ações genéricas.

Objetivo:
Exibir Weekly Review só quando houver dados mínimos e tornar ações contextuais.

Arquivos permitidos:
- src/components/WeeklyReview.jsx
- src/core/weeklyReviewGate.js
- src/core/weeklyReviewGate.test.js
- src/core/sessionReflection.js apenas se necessário
- src/components/Dashboard.jsx apenas para gating/render

Não alterar:
- Store
- FSRS
- Mentor core
- Stats
- Firebase/Auth

Regras:
Weekly Review só aparece se:
- pelo menos 7 dias desde início; ou
- pelo menos 5 sessões concluídas; ou
- pelo menos 20 revisões/questões registradas.

Antes disso:
mostrar estado vazio curto:
"Sua revisão semanal será liberada após alguns dias de uso. Por enquanto, conclua o primeiro ciclo."

Ajustes contextuais:
- sem cronograma -> Importar/criar cronograma;
- sem sessões -> Começar primeiro ciclo;
- área fraca real -> Focar área fraca;
- temas não iniciados -> Usar Já domino;
- revisões vencidas -> Recuperar atrasadas;
- sem dado -> não mostrar ação genérica.

Tarefas:
1. Criar helper canShowWeeklyReview.
2. Criar helper buildContextualWeeklyActions.
3. Remover "a definir" quando não há dado; usar estado vazio honesto.
4. Adicionar testes.

Rode:
npm test -- --watchAll=false src/core/weeklyReviewGate.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO UX7 — Gargalo ENAMED específico

### Modelo

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
src/core/enamedIntel.js
src/core/enamedIntel.test.js
src/components/Dashboard.jsx
src/core/mentorSignals.js somente se já fornece o sinal
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX7 — Gargalo ENAMED específico.

Problema confirmado:
O card "Gargalo ENAMED" mostra só área/cobertura/acerto. Isso é inespecífico e não gera ação clara.

Objetivo:
Tornar o gargalo explicável e acionável.

Arquivos permitidos:
- src/core/enamedIntel.js
- src/core/enamedIntel.test.js
- src/components/Dashboard.jsx
- src/core/mentorSignals.js somente se necessário para expor sinal já existente

Não alterar:
- Store
- FSRS
- StatsPanel
- Raciocínio Clínico
- Vestibular

Tarefas:
1. Criar ou ajustar função getEnamedBottleneckExplanation.
2. Retornar:
   - area;
   - motivo;
   - evidencias;
   - actionLabel;
   - target/view;
   - confidence;
   - collecting true/false.
3. Se não houver dados suficientes, mostrar:
   "Ainda coletando gargalos"
   "Faça pelo menos X sessões ou Y questões para estimar."
4. Não mostrar ENAMED no Vestibular.
5. CTA:
   - se target existe, navegar;
   - se não, "Ver plano".

Exemplo:
Gargalo ENAMED
Preventiva
Motivo: baixa cobertura e poucos acertos coletados.
Ação: faça 15 questões de indicadores de saúde ou revise o próximo tema vencido.

Rode:
npm test -- --watchAll=false src/core/enamedIntel.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

# 5. Blocos Data Safety revisados a partir do código real

---

## BLOCO N0 — Auditoria Data Safety no repo atual

### Modelo

```txt
GPT-5.5 High ou Claude Opus Planning
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO N0 — Auditoria Data Safety do código atual.

Não implemente nada.

Contexto:
O código já possui userScope.js, authSession.js, userDataMigration.js, userDataPaths.js, firestore.rules, DataSafetyPanel.jsx e backup.js. A tarefa é auditar o que já existe e apontar lacunas, não recriar do zero.

Use apenas:
git status --short
git ls-files src firebase.json firestore.rules docs scripts package.json
git grep -n "localStorage\\|sessionStorage\\|persist(\\|createJSONStorage\\|firestore\\|firebase\\|auth\\|uid\\|scopeKey\\|userScope\\|DataSafety\\|trackEvent" -- src firestore.rules firebase.json package.json

Não use ls -R, dir /s, tree, find . ou Get-ChildItem -Recurse.

Crie:
docs/N0_DATA_SAFETY_CODE_AUDIT.md

O relatório deve responder:
1. localStorage está realmente escopado por uid?
2. o que acontece ao trocar de usuário?
3. quais chaves legadas existem?
4. DataSafetyPanel exporta/importa com ownerUid?
5. restore bloqueia backup de outro uid?
6. Firestore rules permitem acesso cruzado?
7. rules estão amplas demais dentro do uid?
8. trackEvent envia uid ou dados sensíveis?
9. quais testes cobrem isolamento?
10. quais testes faltam?
11. quais blocos N1-N4 ainda são necessários?

Não edite código.
```

---

## BLOCO N1 — Testes end-to-end de isolamento local

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/userScope.test.js
src/core/authSession.test.js
src/core/userDataMigration.test.js
src/core/storeScope.test.js ou teste equivalente
```

### Prompt

```txt
Execute somente BLOCO N1 — testes de isolamento local.

Objetivo:
Provar com testes que dados de usuários diferentes não se misturam no localStorage/Zustand persist.

Arquivos permitidos:
- src/core/userScope.test.js
- src/core/authSession.test.js
- src/core/userDataMigration.test.js
- src/core/storeScope.test.js, se necessário criar

Não alterar:
- App.js
- store.js
- Firebase
- UI

Tarefas:
1. Testar build de chave por uid.
2. Testar chave anônima por sessionId.
3. Testar que uid A e uid B geram chaves diferentes.
4. Testar que chaves legadas são detectadas.
5. Testar que migração não sobrescreve target existente.
6. Testar que import/migração exige confirmação.
7. Se viável, criar teste unitário de helper de persist scope sem renderizar React.

Rode:
npm test -- --watchAll=false src/core/userScope.test.js src/core/authSession.test.js src/core/userDataMigration.test.js
npm test -- --watchAll=false
npm run build
```

---

## BLOCO N2 — dataIntegrity real

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/dataIntegrity.js
src/core/dataIntegrity.test.js
src/components/DataSafetyPanel.jsx
src/core/backup.js somente se necessário integrar validação
```

### Prompt

```txt
Execute somente BLOCO N2 — dataIntegrity real.

Objetivo:
Adicionar verificação de integridade do estado do MedRev e conectar ao DataSafetyPanel.

Arquivos permitidos:
- src/core/dataIntegrity.js
- src/core/dataIntegrity.test.js
- src/components/DataSafetyPanel.jsx
- src/core/backup.js somente se necessário

Não alterar:
- FSRS
- Store
- Mentor
- Stats
- Firebase/Auth paths

Tarefas:
1. Criar validateStateIntegrity(state).
2. Criar validateTemaIntegrity(tema).
3. Verificar:
   - res.temas e vest.temas arrays;
   - tema.id;
   - tema.nome;
   - tema.rev object;
   - datas ISO-like;
   - steps desconhecidos;
   - dominioPrevio coerente;
   - primeira revisão de domínio prévio não exibida como D1;
   - reviewHistory array quando existir;
   - acerto normalizável;
   - ownerUid, se existir.
4. DataSafetyPanel deve mostrar:
   - OK;
   - warnings;
   - críticos;
   - resumo por quantidade.
5. Restore deve rodar validateStateIntegrity antes de aplicar.
6. Não criar Activity Log.

Rode:
npm test -- --watchAll=false src/core/dataIntegrity.test.js
npm test -- --watchAll=false
npm run build
```

---

## BLOCO N3 — Firestore Rules mais explícitas

### Modelo

```txt
GPT-5.4 Medium ou GPT-5.5 High
```

### Arquivos permitidos

```txt
firestore.rules
src/services/userDataPaths.js
src/services/userDataPaths.test.js
```

### Prompt

```txt
Execute somente BLOCO N3 — Firestore Rules explícitas.

Objetivo:
Manter owner-only por uid, mas tornar os paths e rules mais explícitos.

Arquivos permitidos:
- firestore.rules
- src/services/userDataPaths.js
- src/services/userDataPaths.test.js

Não alterar:
- App.js
- store.js
- Firebase service
- UI
- Activity Log

Decisão:
O projeto atual usa coleção "usuarios". Não migrar para "users" neste bloco.

Tarefas:
1. Manter /usuarios/{uid}.
2. Permitir somente quando request.auth.uid == uid.
3. Definir explicitamente:
   - /usuarios/{uid}
   - /usuarios/{uid}/activityLog/{eventId}
   - /usuarios/{uid}/backups/{backupId}
   - /usuarios/{uid}/telemetry/{eventId}
   - /usuarios/{uid}/calendarImports/{importId}
4. Bloquear catch-all fora desses paths.
5. userDataPaths deve expor:
   - userStatePath(uid)
   - userActivityPath(uid)
   - userBackupPath(uid)
   - userCalendarImportPath(uid)
   - userTelemetryPath(uid)
6. Testes devem garantir uid obrigatório.
7. Não implementar Activity Log nem Telemetry ainda.

Rode:
npm test -- --watchAll=false src/services/userDataPaths.test.js
npm test -- --watchAll=false
npm run build
```

---

## BLOCO V1 — Telemetria privada mínima e sanitizada

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/telemetry.js
src/core/telemetry.test.js
src/services/firebase.js
src/App.js
src/components/Dashboard.jsx
src/components/Simulados.jsx
```

### Prompt

```txt
Execute somente BLOCO V1 — Telemetria privada mínima.

Problema confirmado:
Eventos trackEvent estão espalhados e alguns enviam uid no payload. Não há sanitização central nem opt-out.

Objetivo:
Criar camada de telemetria privada mínima, sanitizada, com opt-out e sem texto livre.

Arquivos permitidos:
- src/core/telemetry.js
- src/core/telemetry.test.js
- src/services/firebase.js
- src/App.js
- src/components/Dashboard.jsx
- src/components/Simulados.jsx

Não alterar:
- FSRS
- Store persist profundo
- DataSafetyPanel
- Activity Log
- UI grande

Regras:
1. Não enviar uid no payload.
2. Não enviar texto livre clínico.
3. Não enviar conteúdo de questão.
4. Payload deve ser sanitizado.
5. Deve existir flag disabled/opt-out.
6. Eventos mínimos:
   - activation_first_plan_created
   - activation_first_review_done
   - mentor_action_seen
   - mentor_action_started
   - mentor_action_completed
   - review_completed
   - simulation_result_recorded
   - readiness_snapshot
   - readiness_vs_simulado_result
7. Substituir chamadas diretas críticas de trackEvent por wrapper seguro.
8. Não criar dashboard de BI.

Rode:
npm test -- --watchAll=false src/core/telemetry.test.js
npm test -- --watchAll=false
npm run build
```

---

## BLOCO V2 — Validação do preparo estimado

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/readinessValidation.js
src/core/readinessValidation.test.js
src/core/metricsRegistry.js
src/components/StatsPanel.jsx
```

### Prompt

```txt
Execute somente BLOCO V2 — validação do preparo estimado.

Objetivo:
Criar estrutura leve para comparar preparo estimado com resultado real de simulado/prova.

Arquivos permitidos:
- src/core/readinessValidation.js
- src/core/readinessValidation.test.js
- src/core/metricsRegistry.js
- src/components/StatsPanel.jsx

Não alterar:
- FSRS
- Store persistence profunda
- Mentor decision policy
- Telemetry além do wrapper já criado

Tarefas:
1. Criar createReadinessSnapshot.
2. Criar compareReadinessToSimulado.
3. Calcular erro absoluto:
   abs(preparoEstimado - resultadoReal)
4. Classificar:
   - coletando;
   - alinhado;
   - superestimado;
   - subestimado.
5. Stats deve mostrar estado simples:
   "Ainda coletando validação"
   ou "Preparo estimado acima/abaixo do resultado real".
6. Não usar para decisão automática ainda.
7. Não criar BI pesado.

Rode:
npm test -- --watchAll=false src/core/readinessValidation.test.js
npm test -- --watchAll=false
npm run build
```

---

# 6. Ordem final recomendada para você executar

## Se quer corrigir bugs visíveis primeiro

```txt
CHECK
UX1
UX2
UX3
UX4
UX5
UX6
UX7
N0
N1
N2
N3
V1
V2
```

## Se quer segurança antes de qualquer estudante real

```txt
CHECK
N0
N1
N2
N3
V1
UX1
UX2
UX3
UX4
UX5
UX6
UX7
V2
Beta fechado
```

Minha recomendação prática:

```txt
1. CHECK
2. UX1
3. UX2
4. N0
5. N1
6. N2
7. N3
8. UX5
9. V1
10. V2
```

Porque UX1/UX2 são bugs de confiança e não mexem em persistência profunda.

---

# 7. Prompt base para GPT-5.4/5.5

```txt
Antes de implementar, leia:
- docs/MEDREV_CONTEXT_FOR_AI.md
- docs/MEDREV_CODE_AUDIT_SAFETY_UX_VALIDATION_PLAN.md

Execute somente o BLOCO [NOME].

Não execute blocos futuros.
Não mexa fora dos arquivos permitidos.
Não faça refactor global.
Não instale libs.
Não faça commit, push ou deploy.
Não liste workspace inteiro.
Use git grep/git ls-files.

Se precisar mexer em store.js, Firebase/Auth/localStorage ou paths de persistência fora do escopo, pare e peça autorização.

Ao final rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare e entregue relatório:
- arquivos alterados;
- o que mudou;
- testes;
- build;
- riscos;
- pendências.
```

---

# 8. Modelo por bloco

```txt
CHECK: GPT-5.4 Medium
UX1: GPT-5.4 Medium
UX2 onboarding: GPT-5.5 High
UX3 daily briefing: GPT-5.5 High
UX4 tooltip: GPT-5.4 Medium
UX5 dashboard: GPT-5.5 High
UX6 weekly review: GPT-5.4 Medium
UX7 gargalo: GPT-5.4 Medium
N0 auditoria: GPT-5.5 High / Claude Opus Planning
N1 testes isolamento: GPT-5.5 High
N2 dataIntegrity: GPT-5.5 High
N3 rules/paths: GPT-5.4 Medium ou GPT-5.5 High
V1 telemetry: GPT-5.5 High
V2 readiness validation: GPT-5.5 High
```

---

# 9. Alertas finais

## Não mexer agora

```txt
Activity Log
notificações
editor de casos
compartilhamento colaborativo
BI pesado
novos painéis de Stats
novo motor FSRS
```

## Cuidado com docs antigas

Há documentos antigos falando D14 para “Já domino” alto. O código atual usa D21. Antes de mandar IA mexer nisso, decidir explicitamente:

```txt
Manter D21?
Voltar para D14?
```

Não misturar essa decisão com Data Safety ou Dashboard.

## Cuidado com Analytics

Antes de beta real, remover `uid` dos payloads de eventos.

## Cuidado com backup duplicado

Centralizar backup/restore em DataSafetyPanel. Ajustes deve apontar para Data Safety, não duplicar lógica.

---

# 10. Critério de pronto para beta fechado

```txt
npm test verde.
npm build verde.
check:mojibake verde.
localStorage por uid testado.
Firestore owner-only.
DataSafetyPanel exporta/importa/valida.
Restore bloqueia uid divergente.
Dashboard mobile sem overflow.
Onboarding não aparece repetidamente.
Resumo do dia aparece no máximo 1x/dia por usuário.
Inputs numéricos seguros.
Tooltips mobile funcionam.
Telemetria sem uid no payload e com opt-out.
Vestibular sem ENAMED/Raciocínio Clínico.
```

```

### docs/N0_DATA_SAFETY_CODE_AUDIT.md

```txt
# N0 Data Safety Code Audit

## Escopo auditado

- `src/core/userScope.js`
- `src/core/authSession.js`
- `src/core/userDataMigration.js`
- `src/core/backup.js`
- `src/core/dataIntegrity.js`
- `src/services/userDataPaths.js`
- `src/services/firebase.js`
- `src/components/DataSafetyPanel.jsx`
- `src/core/store.js`
- `firestore.rules`

## Respostas objetivas

1. `localStorage` está escopado por `uid`.
   A chave atual segue `medrev:<env>:user:<uid>:store`.
   Há fallback anônimo por sessão.

2. Na troca de usuário, o app recalcula `scopeKey`, reseta a store, reidrata o escopo novo e protege sync com `assertActiveUserScope`.

3. Chaves legadas conhecidas:
   `reviewflow-v6`, `medrev-store`, `residencia-planner`, `medrev`.

4. `DataSafetyPanel` exporta backup com `ownerUid`.

5. `restore` bloqueia backup de outro `uid`.
   `importMedrevBackup` falha quando `backup.ownerUid !== currentUid`, salvo override explícito.

6. `Firestore Rules` não permitem acesso cruzado entre usuários.
   O owner check é `request.auth.uid == uid`.

7. As rules estavam amplas demais dentro do `uid`; agora os paths explícitos estão limitados a:
   - `/usuarios/{uid}`
   - `/usuarios/{uid}/activityLog/{eventId}`
   - `/usuarios/{uid}/backups/{backupId}`
   - `/usuarios/{uid}/telemetry/{eventId}`
   - `/usuarios/{uid}/calendarImports/{importId}`

8. Telemetria antes enviava `uid` em alguns eventos.
   Agora os call sites usam `safeTrackEvent`, com schema permitido e sem `uid`/texto livre.

9. Cobertura de testes já existente:
   - `src/core/userScope.test.js`
   - `src/core/authSession.test.js`
   - `src/core/userDataMigration.test.js`
   - `src/services/userDataPaths.test.js`

10. Testes ainda desejáveis:
   - troca A -> logout -> B com rehidratação real do persist;
   - restore de backup válido porém com `state` semanticamente inconsistente;
   - sincronização Firebase após troca rápida de conta.

11. Blocos ainda relevantes após este audit:
   - N1: ampliar prova de isolamento end-to-end do persist;
   - N2: evoluir `dataIntegrity` para regras mais profundas de domínio;
   - N4: se quiser beta mais duro, adicionar smoke test de troca de conta + sync real.

## Estado atual

- Escopo local por usuário: presente.
- Migração de store legada: presente.
- Export/import com `ownerUid`: presente.
- Validação estrutural de backup: presente.
- Validação de integridade do estado: presente, mas ainda pode ser aprofundada.
- Rules explícitas por subcoleção: presentes.
- Telemetria sanitizada: presente.

## Risco residual

O principal risco remanescente não é mais o pathing básico; é a falta de prova automatizada mais próxima de fluxo real de troca de conta e restore em cima da store persistida do Zustand.

```

### src/core/dailyBriefing.js

```txt
import { todayStr } from "./fsrs";
import { getAppEnvironment } from "./userScope";
import { shouldShowDailyBriefing } from "./onboardingGate";

export function getDailyBriefingStorageKey({ uid, scopeKey, env = getAppEnvironment(), date = todayStr() } = {}) {
  if (scopeKey) return `${scopeKey}:dailyBriefing:${date}`;
  if (uid) return `medrev:${env}:user:${uid}:dailyBriefing:${date}`;
  return `medrev:${env}:anonymous:dailyBriefing:${date}`;
}

export function isDailyBriefingDismissed(storage, key) {
  if (!storage || !key) return false;
  return storage.getItem(key) === "1";
}

export function dismissDailyBriefing(storage, key) {
  if (!storage || !key) return;
  storage.setItem(key, "1");
}

export function buildDailyBriefing({ state = {}, context = {} } = {}) {
  const pendingCount = Number(context.pendingCount ?? context.dueTodayCount ?? 0);
  const overdueCount = Number(context.overdueCount ?? 0);
  const estimatedMinutes = Number(context.estimatedMinutes ?? context.todayMinutes ?? pendingCount * 12);
  const priority = context.priority || (overdueCount > 0
    ? "Recuperar revisões vencidas primeiro."
    : pendingCount > 0
    ? "Fechar a fila de hoje mantém a curva estável."
    : "Dia leve: avance um tema novo ou revise o plano.");

  return {
    title: overdueCount > 0 ? "Resumo do dia" : "Seu plano de hoje",
    reviewsToday: pendingCount,
    estimatedMinutes,
    overdueCount,
    priority,
    helperText: overdueCount > 0
      ? `${overdueCount} revisão${overdueCount === 1 ? "" : "ões"} em atraso precisando de atenção.`
      : "Sem atraso crítico. Foque em manter o ritmo sustentável.",
    primaryCta: "Começar agora",
    secondaryCta: "Ver plano",
    userName: state.userName || "Estudante",
  };
}

export function canShowDailyBriefing({
  state = {},
  context = {},
  uid = null,
  scopeKey = null,
  env,
  date = todayStr(),
  storage = typeof window !== "undefined" ? window.localStorage : null,
} = {}) {
  if (!shouldShowDailyBriefing(state)) return false;
  const key = getDailyBriefingStorageKey({ uid, scopeKey, env, date });
  if (isDailyBriefingDismissed(storage, key)) return false;
  const pendingCount = Number(context.pendingCount ?? context.dueTodayCount ?? 0);
  const estimatedMinutes = Number(context.estimatedMinutes ?? context.todayMinutes ?? 0);
  return pendingCount > 0 || estimatedMinutes > 0 || Number(context.overdueCount ?? 0) > 0;
}

```

### src/core/dailyBriefing.test.js

```txt
import {
  buildDailyBriefing,
  canShowDailyBriefing,
  dismissDailyBriefing,
  getDailyBriefingStorageKey,
} from "./dailyBriefing";

describe("dailyBriefing", () => {
  test("gera chave por uid e data", () => {
    expect(getDailyBriefingStorageKey({ uid: "u1", env: "prod", date: "2026-06-02" }))
      .toBe("medrev:prod:user:u1:dailyBriefing:2026-06-02");
  });

  test("monta resumo com revisoes e atraso", () => {
    const briefing = buildDailyBriefing({
      state: { userName: "Ana" },
      context: { pendingCount: 8, overdueCount: 2, estimatedMinutes: 34 },
    });
    expect(briefing.reviewsToday).toBe(8);
    expect(briefing.overdueCount).toBe(2);
    expect(briefing.priority).toMatch(/Recuperar/);
  });

  test("respeita dismissal diario", () => {
    const storage = new Map();
    storage.getItem = storage.get.bind(storage);
    storage.setItem = storage.set.bind(storage);
    const key = getDailyBriefingStorageKey({ uid: "u1", env: "dev", date: "2026-06-02" });

    expect(
      canShowDailyBriefing({
        state: { onboardingDone: true, meta: { onboarding: { completed: true } } },
        context: { pendingCount: 3 },
        uid: "u1",
        env: "dev",
        date: "2026-06-02",
        storage,
      })
    ).toBe(true);

    dismissDailyBriefing(storage, key);

    expect(
      canShowDailyBriefing({
        state: { onboardingDone: true, meta: { onboarding: { completed: true } } },
        context: { pendingCount: 3 },
        uid: "u1",
        env: "dev",
        date: "2026-06-02",
        storage,
      })
    ).toBe(false);
  });
});

```

### src/core/dataIntegrity.js

```txt
import { STEPS } from "./fsrs";

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIsoLike(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value);
}

function normalizeAccuracy(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  if (value >= 0 && value <= 1) return value * 100;
  return value;
}

function pushIssue(target, severity, path, message) {
  target[severity].push({ path, message });
}

export function validateTemaIntegrity(tema = {}, path = "tema") {
  const issues = { criticals: [], warnings: [] };

  if (!isObject(tema)) {
    pushIssue(issues, "criticals", path, "Tema inválido.");
    return issues;
  }

  if (!tema.id) pushIssue(issues, "criticals", `${path}.id`, "Tema sem id.");
  if (!tema.nome) pushIssue(issues, "criticals", `${path}.nome`, "Tema sem nome.");
  if (!isObject(tema.rev)) pushIssue(issues, "criticals", `${path}.rev`, "Tema sem objeto de revisão.");

  if (isObject(tema.rev)) {
    const knownSteps = new Set([...STEPS.map((step) => step.key), "manutencao"]);
    for (const [stepKey, review] of Object.entries(tema.rev)) {
      if (stepKey === "reviewHistory") {
        if (!Array.isArray(review)) {
          pushIssue(issues, "warnings", `${path}.rev.reviewHistory`, "reviewHistory deveria ser array.");
        }
        continue;
      }

      if (!knownSteps.has(stepKey)) {
        pushIssue(issues, "warnings", `${path}.rev.${stepKey}`, "Step desconhecido.");
      }

      if (!isObject(review)) continue;

      for (const field of ["date", "scheduledAt", "reviewedAt"]) {
        if (review[field] && !isIsoLike(review[field])) {
          pushIssue(issues, "warnings", `${path}.rev.${stepKey}.${field}`, "Data fora do formato esperado.");
        }
      }

      const accuracy = normalizeAccuracy(review.acerto);
      if (accuracy != null && (accuracy < 0 || accuracy > 100)) {
        pushIssue(issues, "warnings", `${path}.rev.${stepKey}.acerto`, "Acerto fora do intervalo esperado.");
      }
    }
  }

  const dominio = tema.dominioPrevio;
  if (isObject(dominio)) {
    if (dominio.validado === true && !dominio.primeiraRevisao) {
      pushIssue(issues, "warnings", `${path}.dominioPrevio.primeiraRevisao`, "Domínio prévio validado sem primeira revisão.");
    }
    if (String(dominio.primeiraRevisao || "").toLowerCase() === "d1") {
      pushIssue(issues, "warnings", `${path}.dominioPrevio.primeiraRevisao`, "Domínio prévio não deveria iniciar em D1.");
    }
  }

  return issues;
}

export function validateStateIntegrity(state = {}) {
  const issues = { criticals: [], warnings: [] };
  const sections = [
    ["res.temas", state.res?.temas],
    ["vest.temas", state.vest?.temas],
  ];

  if (state.ownerUid != null && typeof state.ownerUid !== "string") {
    pushIssue(issues, "criticals", "ownerUid", "ownerUid inválido.");
  }

  for (const [path, temas] of sections) {
    if (!Array.isArray(temas)) {
      pushIssue(issues, "criticals", path, "Coleção de temas inválida.");
      continue;
    }

    temas.forEach((tema, index) => {
      const temaIssues = validateTemaIntegrity(tema, `${path}[${index}]`);
      issues.criticals.push(...temaIssues.criticals);
      issues.warnings.push(...temaIssues.warnings);
    });
  }

  return {
    valid: issues.criticals.length === 0,
    criticals: issues.criticals,
    warnings: issues.warnings,
    summary: {
      criticalCount: issues.criticals.length,
      warningCount: issues.warnings.length,
    },
  };
}

```

### src/core/dataIntegrity.test.js

```txt
import { validateStateIntegrity, validateTemaIntegrity } from "./dataIntegrity";

describe("dataIntegrity", () => {
  test("detecta tema sem id/nome/rev", () => {
    const result = validateTemaIntegrity({}, "res.temas[0]");
    expect(result.criticals.length).toBeGreaterThan(0);
  });

  test("aceita estado simples bem formado", () => {
    const result = validateStateIntegrity({
      ownerUid: "u1",
      res: { temas: [{ id: "t1", nome: "Cardio", rev: { d0: { date: "2026-06-02", acerto: 0.8 } } }] },
      vest: { temas: [] },
    });
    expect(result.valid).toBe(true);
    expect(result.summary.criticalCount).toBe(0);
  });

  test("marca warning para dominio previo incoerente", () => {
    const result = validateStateIntegrity({
      res: { temas: [{ id: "t1", nome: "Cardio", rev: { d0: {} }, dominioPrevio: { validado: true, primeiraRevisao: "d1" } }] },
      vest: { temas: [] },
    });
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

```

### src/core/numberInput.js

```txt
function clamp(value, min, max) {
  let next = value;
  if (typeof min === "number") next = Math.max(min, next);
  if (typeof max === "number") next = Math.min(max, next);
  return next;
}

function normalizeDecimalSeparator(value, allowDecimal) {
  if (!allowDecimal) return value;
  return value.replace(/,/g, ".");
}

export function sanitizeNumericInput(rawValue, options = {}) {
  const {
    allowDecimal = false,
    maxDecimals = allowDecimal ? 2 : 0,
    min,
    max,
  } = options;

  const source = normalizeDecimalSeparator(String(rawValue ?? "").replace(/[oO]/g, "0"), allowDecimal);
  const digitCount = [...source].filter((char) => char >= "0" && char <= "9").length;
  let text = "";
  let hasDecimal = false;

  for (const char of source) {
    if (char >= "0" && char <= "9") {
      text += char;
      continue;
    }

    if (allowDecimal && char === "." && !hasDecimal) {
      text += ".";
      hasDecimal = true;
    }
  }

  if (allowDecimal && text.startsWith(".")) {
    text = `0${text}`;
  }

  if (allowDecimal && Number.isInteger(maxDecimals) && maxDecimals >= 0 && text.includes(".")) {
    const [whole, decimals] = text.split(".");
    text = `${whole}.${decimals.slice(0, maxDecimals)}`;
  }

  if (!allowDecimal) {
    text = text.replace(/\./g, "");
  }

  if (digitCount === 0 || text === "" || text === ".") {
    return { text: "", value: null, isEmpty: true };
  }

  const numeric = allowDecimal ? Number.parseFloat(text) : Number.parseInt(text, 10);
  if (!Number.isFinite(numeric)) {
    return { text: "", value: null, isEmpty: true };
  }

  const value = clamp(numeric, min, max);
  const normalizedText = allowDecimal
    ? String(value).replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1")
    : String(Math.trunc(value));

  return {
    text: normalizedText,
    value,
    isEmpty: false,
  };
}

export function readSanitizedNumber(rawValue, options = {}) {
  return sanitizeNumericInput(rawValue, options).value;
}

```

### src/core/numberInput.test.js

```txt
import { readSanitizedNumber, sanitizeNumericInput } from "./numberInput";

describe("numberInput", () => {
  test("converte O e o para zero", () => {
    expect(sanitizeNumericInput("O10").text).toBe("10");
    expect(readSanitizedNumber("1o", { min: 0 })).toBe(10);
  });

  test("remove notacao cientifica e caracteres invalidos", () => {
    expect(sanitizeNumericInput("1e5", { max: 500 }).value).toBe(15);
    expect(sanitizeNumericInput("12-3.4", { allowDecimal: true, maxDecimals: 1 }).text).toBe("123.4");
  });

  test("aplica min e max preservando zero valido", () => {
    expect(readSanitizedNumber("0", { min: 0, max: 10 })).toBe(0);
    expect(readSanitizedNumber("999", { min: 0, max: 30 })).toBe(30);
  });

  test("aceita decimal apenas quando permitido", () => {
    expect(sanitizeNumericInput("85,75", { allowDecimal: true, maxDecimals: 1 }).text).toBe("85.7");
    expect(sanitizeNumericInput("85.75", { allowDecimal: false }).text).toBe("8575");
  });

  test("retorna vazio para entrada vazia", () => {
    expect(sanitizeNumericInput("-", { min: 0 }).value).toBeNull();
    expect(sanitizeNumericInput(".", { allowDecimal: true }).value).toBeNull();
  });
});

```

### src/core/onboardingGate.js

```txt
import { isOnboardingComplete } from "./onboarding";
import { isVestibularStartComplete } from "./vestibularOnboarding";

export function shouldShowGlobalOnboarding(state = {}) {
  if (state.tourStep) return false;
  if (state.onboardingDone) return false;
  return !isOnboardingComplete(state.meta || {});
}

export function shouldShowVestibularStartTrail(state = {}) {
  if ((state.plat || "res") !== "vest") return false;
  if (shouldShowGlobalOnboarding(state)) return false;
  return !isVestibularStartComplete(state.meta || {});
}

export function shouldShowDailyBriefing(state = {}) {
  if (state.tourStep) return false;
  if (shouldShowGlobalOnboarding(state)) return false;
  if (shouldShowVestibularStartTrail(state)) return false;
  return true;
}

```

### src/core/onboardingGate.test.js

```txt
import {
  shouldShowDailyBriefing,
  shouldShowGlobalOnboarding,
  shouldShowVestibularStartTrail,
} from "./onboardingGate";

describe("onboardingGate", () => {
  test("mostra onboarding global quando ainda nao concluiu", () => {
    expect(shouldShowGlobalOnboarding({ onboardingDone: false, meta: { onboarding: { completed: false } } })).toBe(true);
  });

  test("nao mostra onboarding global quando ja concluiu", () => {
    expect(shouldShowGlobalOnboarding({ onboardingDone: true, meta: { onboarding: { completed: true } } })).toBe(false);
  });

  test("mostra trilha vestibular quando onboarding geral terminou mas a trilha nao", () => {
    expect(
      shouldShowVestibularStartTrail({
        plat: "vest",
        onboardingDone: true,
        meta: { onboarding: { completed: true }, vestibularStart: { completed: false } },
      })
    ).toBe(true);
  });

  test("bloqueia daily briefing enquanto onboarding ou trilha inicial estiverem ativos", () => {
    expect(shouldShowDailyBriefing({ onboardingDone: false, meta: { onboarding: { completed: false } } })).toBe(false);
    expect(
      shouldShowDailyBriefing({
        plat: "vest",
        onboardingDone: true,
        meta: { onboarding: { completed: true }, vestibularStart: { completed: false } },
      })
    ).toBe(false);
  });
});

```

### src/core/readinessValidation.js

```txt
import { todayStr } from "./fsrs";

function toScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function createReadinessSnapshot(input = {}) {
  const score = toScore(input.score ?? input.readinessScore ?? input.preparoEstimado);
  return {
    id: input.id || `readiness_${Date.now()}`,
    recordedAt: input.recordedAt || todayStr(),
    plat: input.plat || "res",
    score,
    confidence: input.confidence || "coletando",
    sampleSize: Number(input.sampleSize ?? 0),
  };
}

export function compareReadinessToSimulado(snapshot = {}, simulado = {}) {
  const estimated = toScore(snapshot.score);
  const actual = toScore(simulado.pct ?? simulado.resultadoReal);

  if (estimated == null || actual == null) {
    return {
      status: "coletando",
      estimated,
      actual,
      absoluteError: null,
    };
  }

  const delta = estimated - actual;
  const absoluteError = Math.abs(delta);
  let status = "alinhado";
  if (delta > 5) status = "superestimado";
  if (delta < -5) status = "subestimado";

  return {
    status,
    estimated,
    actual,
    absoluteError,
  };
}

```

### src/core/readinessValidation.test.js

```txt
import { compareReadinessToSimulado, createReadinessSnapshot } from "./readinessValidation";

describe("readinessValidation", () => {
  test("cria snapshot padronizado", () => {
    const snapshot = createReadinessSnapshot({ score: 74.6, plat: "vest" });
    expect(snapshot.score).toBe(75);
    expect(snapshot.plat).toBe("vest");
  });

  test("classifica alinhado/superestimado/subestimado", () => {
    expect(compareReadinessToSimulado({ score: 80 }, { pct: 77 }).status).toBe("alinhado");
    expect(compareReadinessToSimulado({ score: 90 }, { pct: 70 }).status).toBe("superestimado");
    expect(compareReadinessToSimulado({ score: 60 }, { pct: 80 }).status).toBe("subestimado");
  });

  test("retorna coletando quando faltam dados", () => {
    expect(compareReadinessToSimulado({}, {}).status).toBe("coletando");
  });
});

```

### src/core/telemetry.js

```txt
import { trackEvent as trackFirebaseEvent } from "../services/firebase";

const EVENT_SCHEMAS = {
  activation_first_plan_created: ["plat"],
  activation_first_review_done: ["plat", "step"],
  mentor_action_seen: ["plat", "action_type", "source"],
  mentor_action_started: ["plat", "action_type", "source"],
  mentor_action_completed: ["plat", "action_type", "source"],
  review_completed: ["plat", "step"],
  simulation_result_recorded: ["plat", "pct", "total"],
  readiness_snapshot: ["plat", "score", "confidence"],
  readiness_vs_simulado_result: ["plat", "status", "absolute_error"],
  retorno_d1: ["gap_dias"],
  retorno_d7: ["gap_dias"],
  revisoes_zeradas_dia: ["plat"],
  dominio_previo_avaliado: ["plat", "percentual", "status"],
  onboarding_done: [],
};

function sanitizeString(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_:-]/g, "")
    .slice(0, 40);
}

function sanitizeValue(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 100) / 100;
  if (typeof value === "string") {
    const normalized = sanitizeString(value);
    return normalized || undefined;
  }
  return undefined;
}

export function isTelemetryDisabled(state = {}) {
  return Boolean(state?.meta?.analytics?.disabled);
}

export function sanitizeTelemetryPayload(eventName, payload = {}) {
  const allowedKeys = EVENT_SCHEMAS[eventName] || [];
  const sanitized = {};

  for (const key of allowedKeys) {
    if (/(uid|email|name|message|note|texto|tema)/i.test(key)) continue;
    const value = sanitizeValue(payload[key]);
    if (value !== undefined) sanitized[key] = value;
  }

  return sanitized;
}

export function safeTrackEvent(eventName, payload = {}, options = {}) {
  if (!eventName || isTelemetryDisabled(options.state)) return false;
  const sanitized = sanitizeTelemetryPayload(eventName, payload);
  trackFirebaseEvent(eventName, sanitized);
  return true;
}

```

### src/core/telemetry.test.js

```txt
import { isTelemetryDisabled, sanitizeTelemetryPayload } from "./telemetry";

describe("telemetry", () => {
  test("remove campos sensiveis e preserva schema permitido", () => {
    expect(
      sanitizeTelemetryPayload("activation_first_review_done", {
        plat: "RES",
        step: "D21",
        uid: "abc",
        tema: "Cardio",
      })
    ).toEqual({ plat: "res", step: "d21" });
  });

  test("mantem metricas numericas finitas", () => {
    expect(
      sanitizeTelemetryPayload("simulation_result_recorded", {
        plat: "vest",
        pct: 78.333,
        total: 120,
      })
    ).toEqual({ plat: "vest", pct: 78.33, total: 120 });
  });

  test("respeita opt-out em meta.analytics.disabled", () => {
    expect(isTelemetryDisabled({ meta: { analytics: { disabled: true } } })).toBe(true);
  });
});

```

### src/core/weeklyReviewGate.js

```txt
import { addDays, todayStr } from "./fsrs";

function collectDates(context = {}) {
  const dates = [];

  for (const tema of context.temas || []) {
    if (tema?.d0) dates.push(tema.d0);
    if (tema?.createdAt) dates.push(String(tema.createdAt).slice(0, 10));
  }

  for (const reflection of context.sessionReflections || []) {
    if (reflection?.date) dates.push(reflection.date);
  }

  for (const simulado of context.simulados || []) {
    if (simulado?.data) dates.push(simulado.data);
  }

  return dates.filter(Boolean).sort();
}

export function canShowWeeklyReview(context = {}) {
  const sessionsCompleted = Number(context.sessionsCompleted ?? context.sessionReflections?.length ?? 0);
  const trackedVolume = Number(context.trackedVolume ?? 0);
  if (sessionsCompleted >= 5 || trackedVolume >= 20) return true;

  const firstDate = context.firstActivityDate || collectDates(context)[0];
  if (!firstDate) return false;

  const threshold = addDays(context.today || todayStr(), -6);
  return firstDate <= threshold;
}

export function buildContextualWeeklyActions(context = {}) {
  const actions = [];

  if (!context.hasSchedule) {
    actions.push({ id: "import_calendar", label: "Importar cronograma", action: { type: "import_calendar", label: "Importar cronograma" } });
  }
  if ((context.sessionsCompleted ?? 0) === 0) {
    actions.push({ id: "first_cycle", label: "Começar primeiro ciclo", action: { type: "setView", view: "crono", label: "Começar primeiro ciclo" } });
  }
  if (context.weakArea) {
    actions.push({ id: "focus_area", label: "Focar área fraca", action: { type: "focar", esp: context.weakArea, label: "Focar área fraca" } });
  }
  if (context.hasUnstartedTopics) {
    actions.push({ id: "ja_domino", label: "Usar Já domino", action: { type: "ja_domino", label: "Usar Já domino" } });
  }
  if ((context.overdueCount ?? 0) > 0) {
    actions.push({ id: "recover_overdue", label: "Recuperar atrasadas", action: { type: "setView", view: "crono", label: "Recuperar atrasadas" } });
  }

  return actions.slice(0, 3);
}

export const WEEKLY_REVIEW_LOCKED_MESSAGE =
  "Sua revisão semanal será liberada após alguns dias de uso. Por enquanto, conclua o primeiro ciclo.";

```

### src/core/weeklyReviewGate.test.js

```txt
import {
  buildContextualWeeklyActions,
  canShowWeeklyReview,
  WEEKLY_REVIEW_LOCKED_MESSAGE,
} from "./weeklyReviewGate";

describe("weeklyReviewGate", () => {
  test("libera por numero minimo de sessoes", () => {
    expect(canShowWeeklyReview({ sessionsCompleted: 5 })).toBe(true);
  });

  test("libera por volume rastreado", () => {
    expect(canShowWeeklyReview({ trackedVolume: 20 })).toBe(true);
  });

  test("bloqueia quando ainda nao ha maturidade", () => {
    expect(canShowWeeklyReview({ today: "2026-06-08", firstActivityDate: "2026-06-05", sessionsCompleted: 2, trackedVolume: 5 })).toBe(false);
    expect(WEEKLY_REVIEW_LOCKED_MESSAGE).toMatch(/alguns dias de uso/);
  });

  test("monta acoes contextuais sem itens genericos", () => {
    const actions = buildContextualWeeklyActions({
      hasSchedule: false,
      sessionsCompleted: 0,
      weakArea: "Preventiva",
      hasUnstartedTopics: true,
      overdueCount: 4,
    });
    expect(actions.map((item) => item.label)).toContain("Importar cronograma");
    expect(actions.map((item) => item.label)).toContain("Começar primeiro ciclo");
    expect(actions.some((item) => item.label === "Focar área fraca" || item.label === "Recuperar atrasadas")).toBe(true);
  });
});

```

## Mojibake check

```txt

> residencia-planner@0.1.0 check:mojibake
> node scripts/check-mojibake.mjs

check-mojibake: OK - 149 arquivos versionados sem mojibake.

```

## Tests

```txt

> residencia-planner@0.1.0 test
> react-scripts test --watchAll=false


```

## Build

```txt

> residencia-planner@0.1.0 build
> node scripts/check-mojibake.mjs && react-scripts build

check-mojibake: OK - 149 arquivos versionados sem mojibake.
Creating an optimized production build...
Compiled with warnings.

[eslint] 
src\App.js
  Line 907:5:  React Hook useCallback has an unnecessary dependency: 'usuarioLogado.uid'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

Search for the keywords to learn more about each warning.
To ignore, add // eslint-disable-next-line to the line before.

File sizes after gzip:

  416.23 kB  build\static\js\main.0aa043bd.js
  13.01 kB   build\static\css\main.4eed25c1.css
  5.5 kB     build\static\js\840.30a3b145.chunk.js
  3.14 kB    build\static\js\74.45c5fe3d.chunk.js
  1.6 kB     build\static\js\508.2045e8fe.chunk.js
  1.16 kB    build\static\js\420.24c44b27.chunk.js

The project was built assuming it is hosted at /residencia-planner/.
You can control this with the homepage field in your package.json.

The build folder is ready to be deployed.

Find out more about deployment here:

  https://cra.link/deployment


```
