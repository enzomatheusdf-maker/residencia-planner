# ASK_CHATGPT — Auditoria automática

Aja como auditor sênior de engenharia de software. Audite somente o delta abaixo. Procure regressões, bugs, integração incompleta, problemas de arquitetura, encoding, testes, build, UX e riscos de dados persistidos. Priorize P0/P1/P2 e diga exatamente o que corrigir.


## Git status

```txt
 M package.json
 M src/App.js
 M src/components/Dashboard.jsx
 M src/components/Modals.jsx
 M src/components/StatsPanel.jsx
 M src/components/WeeklyReview.jsx
 M src/core/domainValidation.js
 M src/core/fsrs.js
 M src/core/fsrs.test.js
 M src/core/mentorAutopilot.js
 M src/core/mentorAutopilot.test.js
 M src/core/store.js
 M src/hooks/useMetrics.js
 M src/hooks/useMetrics.test.js
?? Cronograma_Estrategia_Extensivo_Completo.md
?? MEDREV_BLOCO_K_FSRS_LITE_V2_MENTOR_PREP.md
?? MEDREV_BLOCO_L_v2_MENTOR_POS_K.md
?? MEDREV_BLOCO_M_REORGANIZADO_EM_SUBBLOCOS.md
?? audit/
?? scripts/audit.mjs
?? src/core/mentorAuditReadiness.js
?? src/core/mentorAuditReadiness.test.js
?? src/core/mentorDecisionPolicy.js
?? src/core/mentorDecisionPolicy.test.js
?? src/core/mentorSignals.js
?? src/core/mentorSignals.test.js

```

## Diff stat

```txt
 package.json                     |   1 +
 src/App.js                       |   2 +-
 src/components/Dashboard.jsx     | 150 ++++++-----
 src/components/Modals.jsx        |   5 +-
 src/components/StatsPanel.jsx    |  13 +-
 src/components/WeeklyReview.jsx  |   8 +-
 src/core/domainValidation.js     |  17 +-
 src/core/fsrs.js                 | 549 +++++++++++++++++++++++++++++++++++----
 src/core/fsrs.test.js            | 189 +++++++++++++-
 src/core/mentorAutopilot.js      | 194 +++-----------
 src/core/mentorAutopilot.test.js |  42 ++-
 src/core/store.js                |  79 +++---
 src/hooks/useMetrics.js          |  83 +++++-
 src/hooks/useMetrics.test.js     |  51 +++-
 14 files changed, 1011 insertions(+), 372 deletions(-)

```

## Changed files

```txt
package.json
src/App.js
src/components/Dashboard.jsx
src/components/Modals.jsx
src/components/StatsPanel.jsx
src/components/WeeklyReview.jsx
src/core/domainValidation.js
src/core/fsrs.js
src/core/fsrs.test.js
src/core/mentorAutopilot.js
src/core/mentorAutopilot.test.js
src/core/store.js
src/hooks/useMetrics.js
src/hooks/useMetrics.test.js

```

## Untracked files

```txt
Cronograma_Estrategia_Extensivo_Completo.md
MEDREV_BLOCO_K_FSRS_LITE_V2_MENTOR_PREP.md
MEDREV_BLOCO_L_v2_MENTOR_POS_K.md
MEDREV_BLOCO_M_REORGANIZADO_EM_SUBBLOCOS.md
audit/ASK_CHATGPT.md
scripts/audit.mjs
src/core/mentorAuditReadiness.js
src/core/mentorAuditReadiness.test.js
src/core/mentorDecisionPolicy.js
src/core/mentorDecisionPolicy.test.js
src/core/mentorSignals.js
src/core/mentorSignals.test.js

```

## Full diff

```diff
diff --git a/package.json b/package.json
index efde6624..3f474f67 100644
--- a/package.json
+++ b/package.json
@@ -25,6 +25,7 @@
     "build": "node scripts/check-mojibake.mjs && react-scripts build",
     "test": "react-scripts test",
     "eject": "react-scripts eject",
+    "audit": "node scripts/audit.mjs",
     "prepare": "git config core.hooksPath .githooks || exit 0"
   },
   "eslintConfig": {
diff --git a/src/App.js b/src/App.js
index bf45e5e1..33c76b0d 100644
--- a/src/App.js
+++ b/src/App.js
@@ -476,7 +476,7 @@ export default function App() {
     const temasList = state[plat]?.temas || [];
     const maxRevisoesDia = state.meta?.maxRevisoesDia || 30;
     const proj = getWorkloadProjection(temasList, 7);
-    const exceeds = Object.values(proj).some((count) => count > maxRevisoesDia);
+    const exceeds = Object.values(proj).some((day) => (day?.count || 0) > maxRevisoesDia);
     if (exceeds) {
       showToast("Atenção: próxima semana já está carregada de revisões.");
     }
diff --git a/src/components/Dashboard.jsx b/src/components/Dashboard.jsx
index 4f554ef5..2ccbc158 100644
--- a/src/components/Dashboard.jsx
+++ b/src/components/Dashboard.jsx
@@ -1,11 +1,12 @@
 // src/components/Dashboard.jsx
-import React, { useMemo, useState, useEffect } from "react";
+import React, { useMemo, useState, useEffect, useCallback } from "react";
 import { createPortal } from "react-dom";
 import { Edit2, Info, TrendingUp, TrendingDown, CheckCircle, ChevronDown, ChevronUp, Brain, Flame, Calendar, AlertTriangle, X, Zap, BookOpen, Layers, Share2, Unlock, Lightbulb, GraduationCap } from "lucide-react";
 import { useStore } from "../core/store";
 import { STEPS, ESP_COLORS, isOverdue, todayStr, addDays, fmtDate, fmtFull, getRetrievability, getWorkloadProjection } from "../core/fsrs";
 import { calcTrueRetention, calcBleedingScore, useFilaInteligente, PESOS_PROVA_VEST } from "../hooks/useMetrics";
 import { getMentorDiagnosis, getMentorVoice, getMentorPhrase, getRecentPhrases, trackRecentPhrase, isExhaustionDetected } from "../core/mentor";
+import { buildMentorContext, getMentorNextAction, getMentorTodayPlan } from "../core/mentorAutopilot";
 import { getReadinessData } from "../core/readiness";
 import { getUserState } from "../core/userState";
 import { TourBalloon, Modal, Btn, ConfettiOverlay, ProgressiveTooltip, InfoTooltip } from "./Primitives";
@@ -31,9 +32,10 @@ import EmptyState from "./EmptyState";
 /* --- CARGA FUTURA WIDGET --- */
 function CargaFuturaWidget({ temas, maxRevisoesDia }) {
   const proj = getWorkloadProjection(temas, 14);
-  const dates = Object.keys(proj);
-  const maxCount = Math.max(...Object.values(proj), maxRevisoesDia, 1);
-  const diasSobrecarga = Object.values(proj).filter((count) => count > maxRevisoesDia).length;
+  const dayEntries = Object.values(proj);
+  const dates = dayEntries.map((entry) => entry.date);
+  const maxCount = Math.max(...dayEntries.map((entry) => entry?.count || 0), maxRevisoesDia, 1);
+  const diasSobrecarga = dayEntries.filter((entry) => (entry?.count || 0) > maxRevisoesDia).length;
   
   return (
     <div className="medrev-card medrev-card-hover p-5 select-none animate-fade-in">
@@ -47,7 +49,9 @@ function CargaFuturaWidget({ temas, maxRevisoesDia }) {
       
       <div className="flex items-end justify-between h-24 gap-1.5 pt-4">
         {dates.map((date) => {
-          const count = proj[date];
+          const entry = proj[date] || { count: 0, estimatedMinutes: 0 };
+          const count = entry.count || 0;
+          const minutes = entry.estimatedMinutes || 0;
           const pct = (count / maxCount) * 100;
           const exceeds = count > maxRevisoesDia;
           const today = date === todayStr();
@@ -56,7 +60,7 @@ function CargaFuturaWidget({ temas, maxRevisoesDia }) {
             <div key={date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
               <div className="relative w-full flex justify-center">
                 <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 text-[9px] text-gray-300 rounded px-1.5 py-0.5 whitespace-nowrap z-50 pointer-events-none font-mono">
-                  {count} revs
+                  {count} revs · {minutes} min
                 </span>
               </div>
               <div 
@@ -795,7 +799,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       esp: item.esp || "Outro",
       prio: "Alta",
       importancia: "ALTA",
-      obs: "Criado pelo Dashboard para validacao de dominio previo.",
+      obs: "Criado pelo Dashboard para validação de domínio prévio.",
       unstarted: true,
       d0: todayStr(),
     };
@@ -1018,7 +1022,13 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
   }, [diag]);
   const hasExhaustionNow = useMemo(() => isExhaustionDetected(temaStats, done), [temaStats, done]);
   const totalSessions = useMemo(() => {
-    return temas.flatMap((t) => Object.values(t.rev)).filter((r) => r.done).length;
+    return temas
+      .flatMap((t) => [
+        ...STEPS.map((s) => t.rev?.[s.key]),
+        t.rev?.manutencao,
+      ])
+      .filter((r) => r?.done === true)
+      .length;
   }, [temas]);
 
   const doneDays = useMemo(() => new Set(done.map((r) => r.date)), [done]);
@@ -1169,67 +1179,59 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
     });
   }, [readinessData, trueRet, totalSessions, temasFiltrados, totalRevisoesFeitas]);
 
-  const comandoDoDia = useMemo(() => {
-    if (hasExhaustionNow) {
-      return {
-        eyebrow: "Comando do dia",
-        title: "Proteja o sistema antes de acelerar",
-        subtitle: "Seu padrão recente sugere fadiga. Faça revisão leve hoje e ajuste a carga.",
-        primaryLabel: pending > 0 ? "Fazer revisão leve" : "Abrir cronograma",
-        secondaryLabel: "Ver estatísticas",
-        tone: "amber",
-      };
-    }
-
-    if (overdue.length > 0 && topFilaItem) {
-      return {
-        eyebrow: "Comando do dia",
-        title: `Recuperar revisão vencida: ${topFilaItem.temaNome}`,
-        subtitle: naReserva > 0
-          ? `${pending} revisões na fila de hoje e ${naReserva} na reserva. Comece pela revisão mais crítica.`
-          : `${pending} revisões na fila de hoje. Comece pela revisão mais crítica.`,
-        primaryLabel: "Iniciar revisão crítica",
-        secondaryLabel: "Ver estatísticas",
-        tone: "red",
-      };
-    }
-
-    if (topFilaItem?.isOptimal) {
-      return {
-        eyebrow: "Comando do dia",
-        title: `Janela ideal: ${topFilaItem.temaNome}`,
-        subtitle: "Este item está no ponto ótimo de recuperação. Melhor custo-benefício cognitivo agora.",
-        primaryLabel: "Iniciar no ponto ideal",
-        secondaryLabel: "Ver estatísticas",
-        tone: "blue",
-      };
-    }
+  const mentorContext = useMemo(() => {
+    const state = useStore.getState();
+    return buildMentorContext(state, plat, {
+      readinessData,
+      lowEnergy: hasExhaustionNow,
+      exhaustionDetected: hasExhaustionNow,
+    });
+  }, [plat, readinessData, hasExhaustionNow]);
 
-    if (pending > 0 && topFilaItem) {
-      return {
-        eyebrow: "Comando do dia",
-        title: `Comece por: ${topFilaItem.temaNome}`,
-        subtitle: naReserva > 0
-          ? `${pending} revisões programadas hoje e ${naReserva} fora do teto diário.`
-          : "A fila já está ordenada por urgência, peso e custo cognitivo.",
-        primaryLabel: "Iniciar foco",
-        secondaryLabel: "Ver estatísticas",
-        tone: "blue",
-      };
-    }
+  const mentorNextAction = useMemo(() => getMentorNextAction(mentorContext), [mentorContext]);
+  const mentorTodayPlan = useMemo(() => getMentorTodayPlan(mentorContext), [mentorContext]);
 
-    const gargalo = readinessData?.priorityList?.[0];
+  const comandoDoDia = useMemo(() => {
+    const action = mentorNextAction || {};
+    const tone = action.safety === "critical"
+      ? "red"
+      : action.safety === "caution"
+      ? "amber"
+      : action.type === "new_topic" || action.type === "rest" || action.type === "anki_check"
+      ? "emerald"
+      : "blue";
+    const subtitle = action.subtitle
+      || action.reason
+      || mentorTodayPlan.slice(1).join(" ");
     return {
       eyebrow: "Comando do dia",
-      title: gargalo?.area ? `Fila zerada. Avance em ${gargalo.area}.` : "Fila zerada. Avance sem pressa.",
-      subtitle: gargalo?.area
-        ? "Sem revisões pendentes. Use o tempo para iniciar tema de alta incidência ou baixa cobertura."
-        : "Sua curva está protegida hoje. Você pode iniciar tema novo ou descansar sem culpa.",
-      primaryLabel: gargalo?.area ? "Escolher tema prioritário" : "Abrir cronograma",
+      title: action.title || "Manter consistência leve",
+      subtitle: subtitle || "Sem urgência crítica detectada. Siga o plano com ritmo sustentável.",
+      primaryLabel: action.cta || "Executar ação",
       secondaryLabel: "Ver estatísticas",
-      tone: "emerald",
+      tone,
+      action,
     };
-  }, [hasExhaustionNow, overdue.length, topFilaItem, pending, naReserva, readinessData?.priorityList]);
+  }, [mentorNextAction, mentorTodayPlan]);
+
+  const runMentorPrimaryAction = useCallback(() => {
+    const action = mentorNextAction || {};
+    const target = action.target || {};
+    if (target.temaId && target.stepKey && onStudy) {
+      onStudy(target.temaId, target.stepKey);
+      return;
+    }
+    const view = action.ctaView || target.view || "dash";
+    if (view === "focus") {
+      if (topFilaItem && onStudy) {
+        onStudy(topFilaItem.temaId, topFilaItem.stepKey);
+      } else if (setView) {
+        setView("dash");
+      }
+      return;
+    }
+    if (setView) setView(view);
+  }, [mentorNextAction, onStudy, setView, topFilaItem]);
 
   const days = Array.from({ length: 35 }, (_, i) => {
     const d = new Date(); d.setDate(d.getDate() - 34 + i);
@@ -1429,8 +1431,17 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
         <EmptyState
           icon={GraduationCap}
           title="Comece em 2 minutos"
-          description={"1. Escolha um calendario.\n2. Deixe o Mentor montar a primeira acao.\n3. Faca uma sessao curta."}
-          primaryAction={{ label: "Configurar agora", onClick: () => setView && setView("crono") }}
+          description={"1. Escolha um calendário.\n2. Deixe o Mentor montar a primeira ação.\n3. Faça uma sessão curta."}
+          primaryAction={{
+            label: "Configurar agora",
+            onClick: () => {
+              if (onOpenAjustes) {
+                onOpenAjustes();
+                return;
+              }
+              if (setView) setView("crono");
+            },
+          }}
           className="my-4 whitespace-pre-line"
         />
       </div>
@@ -1526,10 +1537,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
             <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
               <button
                 type="button"
-                onClick={() => {
-                  if (pending > 0 && topFilaItem) onStudy(topFilaItem.temaId, topFilaItem.stepKey);
-                  else setView && setView("crono");
-                }}
+                onClick={runMentorPrimaryAction}
                 className={`medrev-cta-primary min-h-[44px] rounded-xl px-5 py-3 text-sm font-extrabold shadow-lg border-none cursor-pointer ${
                   comandoDoDia.tone === "red"
                     ? "bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-red-950/25 hover:from-red-500 hover:to-orange-400"
@@ -1549,7 +1557,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
               >
                 {comandoDoDia.secondaryLabel}
               </button>
-              {topFilaItem?.isOptimal && (
+              {topFilaItem?.isOptimal && comandoDoDia.action?.type === "fila_do_dia" && (
                 <span className="text-[11px] font-bold text-amber-300">
                   Ponto exato de esquecimento detectado
                 </span>
@@ -1891,7 +1899,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       {(() => {
         const proj = getWorkloadProjection(temas, 14);
         const cap_ = meta.maxRevisoesDia || 30;
-        const diasSobrecarga = Object.values(proj).filter(n => n > cap_).length;
+        const diasSobrecarga = Object.values(proj).filter((day) => (day?.count || 0) > cap_).length;
         const retAtual = meta?.retencaoFSRS || 0.90;
         if (diasSobrecarga >= 3 && retAtual >= 0.90) {
           return (
diff --git a/src/components/Modals.jsx b/src/components/Modals.jsx
index 59036b3f..fb736a1d 100644
--- a/src/components/Modals.jsx
+++ b/src/components/Modals.jsx
@@ -1571,7 +1571,10 @@ export function AjustesModal({ onClose, overdueCount, onResetOnboarding }) {
                   <button
                     type="button"
                     onClick={() => {
-                      const avgWorkload = Math.round(Object.values(getWorkloadProjection(temas, 14)).reduce((a,b)=>a+b, 0) / 14) || 10;
+                      const avgWorkload = Math.round(
+                        Object.values(getWorkloadProjection(temas, 14))
+                          .reduce((sum, day) => sum + (day?.count || 0), 0) / 14
+                      ) || 10;
                       saveMeta({ metaDiaria: avgWorkload });
                       showToast(`Meta diária calibrada em ${avgWorkload} revisões/dia.`);
                     }}
diff --git a/src/components/StatsPanel.jsx b/src/components/StatsPanel.jsx
index 96117a68..eb2fd61a 100644
--- a/src/components/StatsPanel.jsx
+++ b/src/components/StatsPanel.jsx
@@ -20,6 +20,7 @@ export default function StatsPanel({ setView }) {
   const temas = useStore((s) => s[plat]?.temas || []);
   const simulados = useStore((s) => s[plat]?.simulados || []);
   const weeklyReviews = useStore((s) => s.weeklyReviews || []);
+  const enamedAnalises = useStore((s) => s.enamedAnalises || []);
 
   const personalStats = useMemo(() => {
     const startedTemas = temas.filter(t => !t.unstarted);
@@ -344,11 +345,13 @@ export default function StatsPanel({ setView }) {
                     if (setView) setView("crono");
                   }}
                 />
-                <AdvancedSection title="Analise ENAMED detalhada" defaultOpen={false} storageKey="stats-enamed-advanced">
-                  <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando análise ENAMED...</div>}>
-                    <EnamedProvaAnalyzer />
-                  </Suspense>
-                </AdvancedSection>
+                {enamedAnalises.length > 0 && (
+                  <AdvancedSection title="Analise ENAMED detalhada" defaultOpen={false} storageKey="stats-enamed-advanced">
+                    <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando análise ENAMED...</div>}>
+                      <EnamedProvaAnalyzer />
+                    </Suspense>
+                  </AdvancedSection>
+                )}
               </>
             )}
 
diff --git a/src/components/WeeklyReview.jsx b/src/components/WeeklyReview.jsx
index 1c91d74c..2e6f7834 100644
--- a/src/components/WeeklyReview.jsx
+++ b/src/components/WeeklyReview.jsx
@@ -1,4 +1,5 @@
 import React, { useMemo, useState } from "react";
+import { createPortal } from "react-dom";
 import { CalendarCheck2, ChevronDown, ChevronUp, X } from "lucide-react";
 import { addDays, STEPS, todayStr } from "../core/fsrs";
 import { buildWeeklyReview } from "../core/sessionReflection";
@@ -142,8 +143,8 @@ export default function WeeklyReview({ onAdjust, onAction }) {
         </div>
       )}
 
-      {showAdjustModal && (
-        <div className="fixed inset-0 z-[410] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:pl-60" onClick={() => setShowAdjustModal(false)}>
+      {showAdjustModal && typeof document !== "undefined" && createPortal(
+        <div className="fixed inset-0 z-[410] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdjustModal(false)}>
           <div
             className="w-full max-w-lg bg-[var(--surface-2)] border border-white/10 rounded-2xl p-4 space-y-3"
             onClick={(event) => event.stopPropagation()}
@@ -192,7 +193,8 @@ export default function WeeklyReview({ onAdjust, onAction }) {
               </button>
             </div>
           </div>
-        </div>
+        </div>,
+        document.body
       )}
     </section>
   );
diff --git a/src/core/domainValidation.js b/src/core/domainValidation.js
index bc550bde..269cc319 100644
--- a/src/core/domainValidation.js
+++ b/src/core/domainValidation.js
@@ -1,7 +1,7 @@
 // src/core/domainValidation.js
 // Lógica de validação de domínio prévio (puramente funcional).
 
-import { STEPS, S_BASE, addDays, todayStr, getAreaPrior } from "./fsrs";
+import { STEPS, S_BASE, addDays, todayStr, getAreaPrior, inferPhaseFromStep } from "./fsrs";
 
 export const DOMINIO_PREVIO_MIN_QUESTOES = 15;
 export const DOMINIO_PREVIO_MIN_ACERTO = 80;
@@ -165,20 +165,26 @@ export function buildRevComDominio(d0, esp, importancia, classificacao, pctAcert
   const acertoFrac = Math.max(0, Math.min(1, Number(pctAcerto || 0) / 100));
   const rev = {};
   STEPS.forEach((step) => {
+    const stepDate = addDays(hoje, step.offset);
     rev[step.key] = {
-      date: addDays(hoje, step.offset),
+      date: stepDate,
+      scheduledAt: stepDate,
+      reviewedAt: null,
       done: false,
       acerto: null,
       questoes: null,
       S: S_BASE[step.key],
       D: prior.difBase,
       motivosErro: [],
+      phase: inferPhaseFromStep(step.key),
     };
   });
 
   rev.d0 = {
     ...rev.d0,
     date: baseDate,
+    scheduledAt: baseDate,
+    reviewedAt: baseDate,
     done: true,
     acerto: acertoFrac,
     questoes: null,
@@ -188,19 +194,26 @@ export function buildRevComDominio(d0, esp, importancia, classificacao, pctAcert
   rev.d1 = {
     ...rev.d1,
     date: addDays(hoje, intervaloInicial),
+    scheduledAt: addDays(hoje, intervaloInicial),
   };
   rev.d4 = {
     ...rev.d4,
     date: addDays(hoje, intervaloInicial + 3),
+    scheduledAt: addDays(hoje, intervaloInicial + 3),
   };
   rev.d7 = {
     ...rev.d7,
     date: addDays(hoje, intervaloInicial + 7),
+    scheduledAt: addDays(hoje, intervaloInicial + 7),
   };
   rev.d21 = {
     ...rev.d21,
     date: addDays(hoje, intervaloInicial + 21),
+    scheduledAt: addDays(hoje, intervaloInicial + 21),
   };
+  rev.reviewHistory = [];
+  rev.phase = "learning";
+  rev.relearning = null;
 
   return rev;
 }
diff --git a/src/core/fsrs.js b/src/core/fsrs.js
index ef24e42d..55eb9976 100644
--- a/src/core/fsrs.js
+++ b/src/core/fsrs.js
@@ -16,31 +16,122 @@ export function addDays(dateStr, n) {
 
 export const diffDays = (a, b) => Math.round((new Date(b) - new Date(a)) / 86_400_000);
 
+export const STEP_ESTIMATED_MINUTES = {
+  d0: 45,
+  d1: 12,
+  d4: 25,
+  d7: 30,
+  d21: 35,
+  manutencao: 25,
+  relearning: 20,
+};
+
+const WORKLOAD_LEVEL_BY_MINUTES = (minutes) => {
+  if (minutes > 120) return "high";
+  if (minutes > 60) return "moderate";
+  return "ok";
+};
+
+const STEP_SEQUENCE = ["d0", "d1", "d4", "d7", "d21"];
+const STEP_INDEX = STEP_SEQUENCE.reduce((acc, key, idx) => ({ ...acc, [key]: idx }), {});
+const STEP_MIN_GAP = {
+  d0: 1,
+  d1: 3,
+  d4: 3,
+  d7: 14,
+  d21: 45,
+};
+
+function normalizeAcerto(acerto) {
+  if (acerto == null) return null;
+  const num = Number(acerto);
+  if (Number.isNaN(num)) return null;
+  if (num > 1) return Math.max(0, Math.min(1, num / 100));
+  return Math.max(0, Math.min(1, num));
+}
+
+function ensureStepMetadata(step = {}, fallbackDate, fallbackPhase) {
+  const date = step.date || fallbackDate;
+  const scheduledAt = step.scheduledAt || date || fallbackDate;
+  const reviewedAt = step.reviewedAt || (step.done ? (date || fallbackDate) : null);
+  return {
+    ...step,
+    date,
+    scheduledAt,
+    reviewedAt,
+    phase: step.phase || fallbackPhase,
+  };
+}
+
+function clearOperationalStepState(step = {}, extra = {}) {
+  return {
+    ...step,
+    done: false,
+    reviewedAt: null,
+    completedAt: null,
+    acerto: null,
+    questoes: null,
+    ...extra,
+  };
+}
+
+function getEstimatedMinutesForStep(stepKey, step = {}) {
+  if (step?.phase === "relearning") return STEP_ESTIMATED_MINUTES.relearning;
+  if (stepKey === "manutencao") return STEP_ESTIMATED_MINUTES.manutencao;
+  return STEP_ESTIMATED_MINUTES[stepKey] || STEP_ESTIMATED_MINUTES.d4;
+}
+
 export function getWorkloadProjection(temas, numDays = 14) {
   const projection = {};
   const today = todayStr();
   
-  // Initialize projection keys for the next N days
   for (let i = 0; i < numDays; i++) {
     const dateStr = addDays(today, i);
-    projection[dateStr] = 0;
+    projection[dateStr] = {
+      date: dateStr,
+      count: 0,
+      estimatedMinutes: 0,
+      items: [],
+      overload: false,
+      overloadLevel: "ok",
+    };
   }
   
-  // Count pending reviews scheduled on each date
   temas.forEach(t => {
     if (t.unstarted) return;
     Object.keys(t.rev).forEach(stepKey => {
+      if (stepKey === "reviewHistory" || stepKey === "meta" || stepKey === "phase" || stepKey === "relearning") return;
       const r = t.rev[stepKey];
       if (r && !r.done && r.date) {
-        // If it is overdue, it counts towards today's workload
+        const minutes = getEstimatedMinutesForStep(stepKey, r);
+        const payload = {
+          temaId: t.id,
+          temaNome: t.nome,
+          stepKey,
+          phase: r.phase || inferPhaseFromStep(stepKey, stepKey === "manutencao"),
+          scheduledAt: r.scheduledAt || r.date,
+          date: r.date,
+          estimatedMinutes: minutes,
+          overdue: r.date < today,
+        };
         if (r.date < today) {
-          projection[today]++;
+          projection[today].count += 1;
+          projection[today].estimatedMinutes += minutes;
+          projection[today].items.push(payload);
         } else if (projection.hasOwnProperty(r.date)) {
-          projection[r.date]++;
+          projection[r.date].count += 1;
+          projection[r.date].estimatedMinutes += minutes;
+          projection[r.date].items.push(payload);
         }
       }
     });
   });
+
+  Object.keys(projection).forEach((date) => {
+    const level = WORKLOAD_LEVEL_BY_MINUTES(projection[date].estimatedMinutes);
+    projection[date].overloadLevel = level;
+    projection[date].overload = level !== "ok";
+  });
   
   return projection;
 }
@@ -68,7 +159,7 @@ export function fmtRelativo(dateStr) {
 }
 
 export const fmtMonth = (d) => {
-  const [, m, y] = d.split("-");
+  const [y, m] = d.split("-");
   const M = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
   return `${M[+m - 1]} ${y}`;
 };
@@ -131,32 +222,184 @@ export const getAreaPrior = (esp) => AREA_PRIORS[getCanonicalArea(esp)] || AREA_
 
 export const DEMO_TEMA_ID = (plat) => plat === "vest" ? "demo-funcoes" : "demo-apendicite";
 
+export function getLastOfficialReview(history = []) {
+  for (let i = history.length - 1; i >= 0; i--) {
+    const item = history[i];
+    if (item && item.official !== false) return item;
+  }
+  return null;
+}
+
+export function getLastReviewForStep(history = [], stepKey) {
+  for (let i = history.length - 1; i >= 0; i--) {
+    const item = history[i];
+    if (!item || item.official === false) continue;
+    if (item.stepKey === stepKey) return item;
+  }
+  return null;
+}
+
+export function appendReviewHistory(rev = {}, event, limit = 100) {
+  const history = Array.isArray(rev.reviewHistory) ? rev.reviewHistory : [];
+  const normalized = {
+    id: event?.id || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
+    official: true,
+    source: "fsrs-lite",
+    ...event,
+  };
+  return [...history, normalized].slice(-limit);
+}
+
+export function inferPhaseFromStep(stepKey, manutencao = false) {
+  if (manutencao || stepKey === "manutencao") return "maintenance";
+  if (stepKey === "d21") return "review";
+  if (["d0", "d1", "d4", "d7"].includes(stepKey)) return "learning";
+  return "learning";
+}
+
+export function getAgainSeverity(acerto) {
+  const normalized = normalizeAcerto(acerto);
+  if (normalized == null) return null;
+  return normalized < 0.30 ? "severe" : "common";
+}
+
+export function resolveAgainPolicy(stepKey, acerto, context = {}) {
+  const severity = getAgainSeverity(acerto) || "common";
+  const severe = severity === "severe";
+  if (stepKey === "manutencao" || context?.isMaintenance) {
+    return severe
+      ? { targetStep: "d7", delayDays: 1, phaseAfter: "relearning", severity, shouldPushFuture: true }
+      : { targetStep: "manutencao", delayDays: 5, phaseAfter: "maintenance", severity, shouldPushFuture: false };
+  }
+  if (stepKey === "d21") {
+    return severe
+      ? { targetStep: "d7", delayDays: 1, phaseAfter: "relearning", severity, shouldPushFuture: true }
+      : { targetStep: "d21", delayDays: 2, phaseAfter: "review", severity, shouldPushFuture: false };
+  }
+  if (stepKey === "d7") {
+    return severe
+      ? { targetStep: "d4", delayDays: 1, phaseAfter: "relearning", severity, shouldPushFuture: true }
+      : { targetStep: "d7", delayDays: 1, phaseAfter: "learning", severity, shouldPushFuture: false };
+  }
+  if (stepKey === "d4") {
+    return severe
+      ? { targetStep: "d1", delayDays: 1, phaseAfter: "learning", severity, shouldPushFuture: true }
+      : { targetStep: "d4", delayDays: 1, phaseAfter: "learning", severity, shouldPushFuture: false };
+  }
+  if (stepKey === "d1") {
+    return severe
+      ? { targetStep: "d0", delayDays: 1, phaseAfter: "learning", severity, shouldPushFuture: true }
+      : { targetStep: "d1", delayDays: 1, phaseAfter: "learning", severity, shouldPushFuture: false };
+  }
+  return { targetStep: "d0", delayDays: 1, phaseAfter: "learning", severity, shouldPushFuture: false };
+}
+
+export function pushFutureStepsAfterDowngrade(rev, targetStep, targetDate, options = {}) {
+  const nextRev = { ...rev };
+  const baseIdx = STEP_INDEX[targetStep];
+  if (baseIdx == null) return nextRev;
+
+  let prevKey = targetStep;
+  let prevDate = targetDate;
+  for (let i = baseIdx + 1; i < STEP_SEQUENCE.length; i++) {
+    const key = STEP_SEQUENCE[i];
+    const step = nextRev[key];
+    if (!step || step.done) {
+      prevKey = key;
+      prevDate = step?.date || prevDate;
+      continue;
+    }
+    const minGap = STEP_MIN_GAP[prevKey] || 1;
+    const minDate = addDays(prevDate, minGap);
+    const finalDate = step.date && step.date > minDate ? step.date : minDate;
+    nextRev[key] = {
+      ...step,
+      date: finalDate,
+      scheduledAt: finalDate,
+      phase: step.phase || inferPhaseFromStep(key),
+    };
+    prevKey = key;
+    prevDate = finalDate;
+  }
+
+  if (options?.pushMaintenance && nextRev.manutencao && !nextRev.manutencao.done) {
+    const minDate = addDays(prevDate, STEP_MIN_GAP.d21);
+    const finalDate = nextRev.manutencao.date && nextRev.manutencao.date > minDate
+      ? nextRev.manutencao.date
+      : minDate;
+    nextRev.manutencao = {
+      ...nextRev.manutencao,
+      date: finalDate,
+      scheduledAt: finalDate,
+      phase: "maintenance",
+    };
+  }
+
+  return nextRev;
+}
+
+export function applyRelearningRecoveryBonus(S, rating, context = {}) {
+  if (!context?.wasRelearning) return S;
+  if (rating === "easy") return S * 1.12;
+  if (rating === "good") return S * 1.05;
+  return S;
+}
+
+export function getLastReviewedAt(tema, stepKey) {
+  const history = tema?.rev?.reviewHistory || tema?.reviewHistory || [];
+  const byStep = stepKey ? getLastReviewForStep(history, stepKey) : getLastOfficialReview(history);
+  if (byStep?.reviewedAt) return byStep.reviewedAt;
+
+  const rev = tema?.rev || {};
+  if (stepKey && rev[stepKey]) {
+    if (rev[stepKey]?.reviewedAt) return rev[stepKey].reviewedAt;
+    if (rev[stepKey]?.done && rev[stepKey]?.date) return rev[stepKey].date;
+  }
+
+  if (!stepKey) {
+    for (let i = STEP_SEQUENCE.length - 1; i >= 0; i--) {
+      const key = STEP_SEQUENCE[i];
+      const step = rev[key];
+      if (!step || !step.done) continue;
+      if (step.reviewedAt) return step.reviewedAt;
+      if (step.date) return step.date;
+    }
+  }
+
+  return tema?.createdAt || tema?.d0 || todayStr();
+}
+
 export function getRetrievability(tema, stepKey) {
   if (stepKey === "d0") return 1.0;
   const stepIdx = STEPS.findIndex((s) => s.key === stepKey);
   if (stepIdx <= 0) return 1.0;
   const prevKey = STEPS[stepIdx - 1].key;
-  const lastDate = tema.rev[prevKey]?.date || tema.d0 || todayStr();
+  const lastDate = getLastReviewedAt(tema, prevKey);
   const t = Math.max(0, diffDays(lastDate, todayStr()));
   const S = tema.rev[stepKey]?.S || S_BASE[stepKey] || 1;
   return (1 + FSRS_FACTOR * t / S) ** FSRS_DECAY;
 }
 
 export function toRating(acerto) {
-  if (acerto == null) return "good";
-  if (acerto < 0.55) return "again";
-  if (acerto < 0.75) return "hard";
-  if (acerto < 0.90) return "good";
+  const normalized = normalizeAcerto(acerto);
+  if (normalized == null) return null;
+  if (normalized < 0.55) return "again";
+  if (normalized < 0.75) return "hard";
+  if (normalized < 0.90) return "good";
   return "easy";
 }
 
 export function updateDifficulty(D_prev, acerto) {
-  const delta = { again: +0.15, hard: +0.05, good: -0.02, easy: -0.08 }[toRating(acerto)];
+  const rating = toRating(acerto);
+  const delta = { again: +0.15, hard: +0.05, good: -0.02, easy: -0.08 }[rating];
+  if (delta == null) return D_prev ?? 0.5;
   return Math.min(1, Math.max(0, (D_prev ?? 0.5) + delta));
 }
 
 export function updateStability(S_prev, acerto, D = 0.5, sMult = 1.0) {
-  const base = { again: -0.8, hard: 0.05, good: 0.3, easy: 0.7 }[toRating(acerto)];
+  const rating = toRating(acerto);
+  const base = { again: -0.8, hard: 0.05, good: 0.3, easy: 0.7 }[rating];
+  if (base == null) return S_prev;
   const ganho = base * (1.1 - 0.4 * D) * sMult;
   return Math.max(0.5, S_prev * Math.exp(ganho));
 }
@@ -193,115 +436,313 @@ export function buildRev(d0, esp = "Outro") {
   const r = {};
   const prior = getAreaPrior(esp);
   STEPS.forEach((s) => {
-    r[s.key] = { date: addDays(d0, s.offset), done: false, acerto: null, questoes: null, S: S_BASE[s.key], D: prior.difBase, motivosErro: [] };
+    const stepDate = addDays(d0, s.offset);
+    r[s.key] = {
+      date: stepDate,
+      scheduledAt: stepDate,
+      reviewedAt: null,
+      done: false,
+      acerto: null,
+      questoes: null,
+      S: S_BASE[s.key],
+      D: prior.difBase,
+      motivosErro: [],
+      phase: inferPhaseFromStep(s.key),
+    };
   });
+  r.reviewHistory = [];
+  r.phase = "learning";
+  r.relearning = null;
   return r;
 }
 
 export function recalcAfterMark(rev, doneKey, acerto, desiredRetention = 0.90, maxInterval = 180, esp = "Outro") {
   const rating = toRating(acerto);
+  const eventStep = doneKey === "manutencao" ? rev?.manutencao : rev?.[doneKey];
+  if (!eventStep) return rev;
   const prior = getAreaPrior(esp);
+  const now = todayStr();
+  const phaseBefore = rev.phase || inferPhaseFromStep(doneKey, doneKey === "manutencao");
+  const wasRelearning = phaseBefore === "relearning" || rev?.relearning?.startedAt;
   const prevS = doneKey === "manutencao" 
     ? (rev.manutencao?.S ?? 45) 
     : (rev[doneKey]?.S ?? S_BASE[doneKey]);
   const prevD = doneKey === "manutencao"
     ? (rev.manutencao?.D ?? prior.difBase)
     : (rev[doneKey]?.D ?? prior.difBase);
+  if (rating == null) {
+    const currentStep = doneKey === "manutencao" ? rev.manutencao : rev[doneKey];
+    return {
+      ...rev,
+      [doneKey]: clearOperationalStepState(currentStep || {}, {
+        phase: currentStep?.phase || inferPhaseFromStep(doneKey, doneKey === "manutencao"),
+      }),
+      phase: rev.phase || inferPhaseFromStep(doneKey, doneKey === "manutencao"),
+      meta: {
+        ...(rev.meta || {}),
+        schedulerWarning: "missing_rating",
+      },
+    };
+  }
+
   const D_new = updateDifficulty(prevD, acerto);
-  const S_new = updateStability(prevS, acerto, D_new, prior.sMult);
+  const computedS = updateStability(prevS, acerto, D_new, prior.sMult);
+  const S_new = applyRelearningRecoveryBonus(computedS, rating, { wasRelearning });
+  const scheduledAt = eventStep.scheduledAt || eventStep.date || now;
+  const reviewedAt = eventStep.reviewedAt || now;
+  const atrasoDias = Math.max(0, diffDays(scheduledAt, reviewedAt));
+  const severity = rating === "again" ? getAgainSeverity(acerto) : null;
+  const historyBase = {
+    stepKey: doneKey,
+    phaseBefore,
+    scheduledAt,
+    reviewedAt,
+    atrasoDias,
+    acerto: normalizeAcerto(acerto),
+    questoes: eventStep.questoes ?? null,
+    rating,
+    severity,
+    S_before: prevS,
+    S_after: S_new,
+    D_before: prevD,
+    D_after: D_new,
+    intervalBefore: eventStep.interval ?? null,
+    official: true,
+    source: "fsrs-lite",
+  };
 
   if (rating === "again") {
-    if (doneKey === "manutencao") {
-      return {
-        ...rev,
-        manutencao: {
-          ...rev.manutencao,
-          S: S_new,
-          D: D_new,
-          date: addDays(todayStr(), 1),
+    const policy = resolveAgainPolicy(doneKey, acerto, { isMaintenance: doneKey === "manutencao" });
+    const targetDate = addDays(now, policy.delayDays);
+    const targetPhase = policy.phaseAfter || inferPhaseFromStep(policy.targetStep, policy.targetStep === "manutencao");
+
+    let nextRev = {
+      ...rev,
+      phase: targetPhase,
+      relearning: policy.phaseAfter === "relearning"
+        ? {
+          fromStep: doneKey,
+          targetStep: policy.targetStep,
+          startedAt: now,
+          reason: "again_severe",
         }
-      };
+        : rev.relearning || null,
+      meta: {
+        ...(rev.meta || {}),
+        schedulerWarning: null,
+      },
+    };
+
+    const failedMeta = {
+      lastFailedAt: now,
+      lastFailedAcerto: normalizeAcerto(acerto),
+      lastFailedRating: "again",
+    };
+    nextRev[doneKey] = clearOperationalStepState(nextRev[doneKey] || {}, failedMeta);
+
+    if (policy.targetStep !== doneKey) {
+      const targetIndex = STEP_INDEX[policy.targetStep];
+      if (targetIndex != null) {
+        for (let idx = targetIndex; idx < STEP_SEQUENCE.length; idx++) {
+          const key = STEP_SEQUENCE[idx];
+          if (!nextRev[key]) continue;
+          nextRev[key] = clearOperationalStepState(nextRev[key], {
+            phase: key === policy.targetStep ? targetPhase : inferPhaseFromStep(key),
+          });
+        }
+        if (nextRev.manutencao && (nextRev.manutencao.date || now) >= now) {
+          nextRev.manutencao = clearOperationalStepState(nextRev.manutencao, { phase: "maintenance" });
+        }
+      }
     }
-    return {
-      ...rev,
-      [doneKey]: {
-        ...rev[doneKey],
+
+    if (policy.targetStep === "manutencao") {
+      nextRev.manutencao = {
+        ...clearOperationalStepState(nextRev.manutencao || rev.manutencao || {}),
+        date: targetDate,
+        scheduledAt: targetDate,
         S: S_new,
         D: D_new,
-        done: false,
-        date: addDays(todayStr(), 1),
-        acerto: null,
-        questoes: null,
-      },
+        phase: "maintenance",
+      };
+    } else {
+      const current = nextRev[policy.targetStep] || {};
+      nextRev[policy.targetStep] = {
+        ...clearOperationalStepState(current),
+        date: targetDate,
+        scheduledAt: targetDate,
+        S: policy.targetStep === doneKey ? S_new : (current.S ?? S_BASE[policy.targetStep] ?? prevS),
+        D: policy.targetStep === doneKey ? D_new : (current.D ?? prior.difBase),
+        phase: targetPhase,
+      };
+      if (policy.shouldPushFuture) {
+        nextRev = pushFutureStepsAfterDowngrade(nextRev, policy.targetStep, targetDate, { pushMaintenance: true });
+      }
+    }
+
+    const historyEvent = {
+      ...historyBase,
+      phaseAfter: targetPhase,
+      intervalAfter: policy.delayDays,
     };
+    nextRev.reviewHistory = appendReviewHistory(nextRev, historyEvent, 100);
+    return nextRev;
   }
 
   if (doneKey === "manutencao") {
     const prevInterval = rev.manutencao?.interval || 45;
     const nextInt = nextInterval(S_new, prevInterval * 2, desiredRetention, maxInterval, D_new);
-    const baseDate = rev.manutencao.date >= todayStr() ? rev.manutencao.date : todayStr();
-    return {
+    const baseDate = rev.manutencao.date >= now ? rev.manutencao.date : now;
+    const nextDate = addDays(baseDate, nextInt);
+    const nextRev = {
       ...rev,
+      phase: "maintenance",
+      relearning: (wasRelearning && (rating === "good" || rating === "easy")) ? null : rev.relearning,
       manutencao: {
         done: false,
-        date: addDays(baseDate, nextInt),
+        date: nextDate,
+        scheduledAt: nextDate,
+        reviewedAt: null,
+        acerto: null,
+        questoes: null,
         S: S_new,
         D: D_new,
-        interval: prevInterval * 2
-      }
+        interval: nextInt,
+        targetInterval: prevInterval * 2,
+        phase: "maintenance",
+      },
+      meta: {
+        ...(rev.meta || {}),
+        schedulerWarning: null,
+      },
     };
+    nextRev.reviewHistory = appendReviewHistory(nextRev, {
+      ...historyBase,
+      phaseAfter: "maintenance",
+      intervalAfter: nextInt,
+      intervalBefore: prevInterval,
+    }, 100);
+    return nextRev;
   }
 
   if (doneKey === "d21") {
     const nextInt = nextInterval(S_new, 45, desiredRetention, maxInterval, D_new);
-    const baseDate = rev.d21.date >= todayStr() ? rev.d21.date : todayStr();
-    return {
+    const baseDate = rev.d21.date >= now ? rev.d21.date : now;
+    const nextDate = addDays(baseDate, nextInt);
+    const nextRev = {
       ...rev,
-      d21: { ...rev.d21, S: S_new, D: D_new },
+      phase: (wasRelearning && (rating === "good" || rating === "easy")) ? "maintenance" : "review",
+      relearning: (wasRelearning && (rating === "good" || rating === "easy")) ? null : rev.relearning,
+      d21: { ...rev.d21, S: S_new, D: D_new, phase: "review" },
       manutencao: {
         done: false,
-        date: addDays(baseDate, nextInt),
+        date: nextDate,
+        scheduledAt: nextDate,
+        reviewedAt: null,
+        acerto: null,
+        questoes: null,
         S: S_new,
         D: D_new,
-        interval: 45
-      }
+        interval: nextInt,
+        targetInterval: 45,
+        phase: "maintenance",
+      },
+      meta: {
+        ...(rev.meta || {}),
+        schedulerWarning: null,
+      },
     };
+    nextRev.reviewHistory = appendReviewHistory(nextRev, {
+      ...historyBase,
+      phaseAfter: nextRev.phase,
+      intervalAfter: nextInt,
+      intervalBefore: 45,
+    }, 100);
+    return nextRev;
   }
 
   const doneIdx = STEPS.findIndex((s) => s.key === doneKey);
   const nextStep = STEPS[doneIdx + 1];
   if (!nextStep) return rev;
   const interval = nextInterval(S_new, nextStep.offset, desiredRetention, maxInterval, D_new);
-  const baseDate = rev[doneKey].date >= todayStr() ? rev[doneKey].date : todayStr();
-  return {
+  const baseDate = rev[doneKey].date >= now ? rev[doneKey].date : now;
+  const nextDate = addDays(baseDate, interval);
+  const phaseAfter = (wasRelearning && (rating === "good" || rating === "easy"))
+    ? inferPhaseFromStep(nextStep.key)
+    : (rev.phase || inferPhaseFromStep(nextStep.key));
+  const nextRev = {
     ...rev,
-    [doneKey]: { ...rev[doneKey], S: S_new, D: D_new },
-    [nextStep.key]: { ...rev[nextStep.key], date: addDays(baseDate, interval) },
+    phase: phaseAfter,
+    relearning: (wasRelearning && (rating === "good" || rating === "easy")) ? null : rev.relearning,
+    [doneKey]: { ...rev[doneKey], S: S_new, D: D_new, phase: inferPhaseFromStep(doneKey) },
+    [nextStep.key]: { ...rev[nextStep.key], date: nextDate, scheduledAt: nextDate, phase: inferPhaseFromStep(nextStep.key) },
+    meta: {
+      ...(rev.meta || {}),
+      schedulerWarning: null,
+    },
   };
+  nextRev.reviewHistory = appendReviewHistory(nextRev, {
+    ...historyBase,
+    phaseAfter,
+    intervalAfter: interval,
+  }, 100);
+  return nextRev;
 }
 
 export function normalizeTema(t) {
   if (!t) return t;
   const rev = { ...t.rev };
   const prior = getAreaPrior(t.esp);
+  const defaultD0 = t.d0 || todayStr();
   STEPS.forEach((s) => {
     if (!rev[s.key]) {
       rev[s.key] = {
         date: t.d0 ? addDays(t.d0, s.offset) : todayStr(),
+        scheduledAt: t.d0 ? addDays(t.d0, s.offset) : todayStr(),
+        reviewedAt: null,
         done: false,
         acerto: null,
         questoes: null,
         S: S_BASE[s.key],
         D: prior.difBase,
         motivosErro: [],
+        phase: inferPhaseFromStep(s.key),
       };
-    } else if (rev[s.key].D == null) {
-      rev[s.key] = {
-        ...rev[s.key],
-        D: prior.difBase,
-      };
+    } else {
+      rev[s.key] = ensureStepMetadata(
+        rev[s.key],
+        t.d0 ? addDays(t.d0, s.offset) : todayStr(),
+        inferPhaseFromStep(s.key)
+      );
+      if (rev[s.key].D == null) {
+        rev[s.key].D = prior.difBase;
+      }
     }
   });
+  if (rev.manutencao) {
+    rev.manutencao = ensureStepMetadata(
+      rev.manutencao,
+      addDays(defaultD0, 45),
+      "maintenance"
+    );
+    if (rev.manutencao.D == null) {
+      rev.manutencao.D = prior.difBase;
+    }
+  }
+  if (!Array.isArray(rev.reviewHistory)) {
+    rev.reviewHistory = [];
+  }
+  rev.reviewHistory = rev.reviewHistory.map((event) => ({
+    official: true,
+    source: "fsrs-lite",
+    ...event,
+  })).slice(-100);
+  if (!rev.phase) {
+    rev.phase = "learning";
+  }
+  if (!Object.prototype.hasOwnProperty.call(rev, "relearning")) {
+    rev.relearning = null;
+  }
   if (rev.manutencao && rev.manutencao.D == null) {
     rev.manutencao = {
       ...rev.manutencao,
diff --git a/src/core/fsrs.test.js b/src/core/fsrs.test.js
index 98e13b86..00536418 100644
--- a/src/core/fsrs.test.js
+++ b/src/core/fsrs.test.js
@@ -11,7 +11,10 @@ import {
   getWorkloadProjection,
   getAreaPrior,
   getRetencaoArea,
-  updateDifficulty
+  updateDifficulty,
+  toRating,
+  applyRelearningRecoveryBonus,
+  appendReviewHistory
 } from "./fsrs";
 
 describe("FSRS Core Logic Test Suite", () => {
@@ -63,6 +66,12 @@ describe("FSRS Core Logic Test Suite", () => {
     expect(updateDifficulty(0.5, 1.0)).toBeCloseTo(0.42);
   });
 
+  test("toRating returns null for null/undefined/NaN", () => {
+    expect(toRating(null)).toBeNull();
+    expect(toRating(undefined)).toBeNull();
+    expect(toRating("abc")).toBeNull();
+  });
+
   test("recalcAfterMark with rating again reschedules same step for tomorrow", () => {
     const initialRev = {
       d0: { date: "2026-05-29", done: false, acerto: null, questoes: null, S: 1.0, D: 0.55 },
@@ -167,9 +176,10 @@ describe("FSRS Core Logic Test Suite", () => {
     ];
 
     const proj = getWorkloadProjection(mockTemas, 3);
-    expect(proj[today]).toBe(1); // Only active non-done scheduled for today or earlier
-    expect(proj[addDays(today, 1)]).toBe(0);
-    expect(proj[addDays(today, 2)]).toBe(1);
+    expect(proj[today].count).toBe(1); // Only active non-done scheduled for today or earlier
+    expect(proj[addDays(today, 1)].count).toBe(0);
+    expect(proj[addDays(today, 2)].count).toBe(1);
+    expect(proj[today].estimatedMinutes).toBeGreaterThan(0);
   });
 
   test("recalcAfterMark with D1 dynamic acertos recalcs correctly", () => {
@@ -190,4 +200,175 @@ describe("FSRS Core Logic Test Suite", () => {
     expect(rev2.d1.S).toBeLessThan(1.0);
     expect(rev2.d1.D).toBeGreaterThan(0.5);
   });
+
+  test("D7 with again common repeats D7 tomorrow", () => {
+    const today = todayStr();
+    const initialRev = buildRev(today, "GO");
+    const marked = {
+      ...initialRev,
+      d7: {
+        ...initialRev.d7,
+        done: true,
+        reviewedAt: today,
+        scheduledAt: addDays(today, -1),
+        acerto: 0.4,
+      },
+    };
+
+    const updated = recalcAfterMark(marked, "d7", 0.4);
+    expect(updated.d7.done).toBe(false);
+    expect(updated.d7.date).toBe(addDays(today, 1));
+    expect(updated.phase).toBe("learning");
+  });
+
+  test("D7 with again severe downgrades to D4 and enters relearning", () => {
+    const today = todayStr();
+    const initialRev = buildRev(today, "GO");
+    const marked = {
+      ...initialRev,
+      d7: {
+        ...initialRev.d7,
+        done: true,
+        reviewedAt: today,
+        scheduledAt: addDays(today, -2),
+        acerto: 0.2,
+      },
+    };
+
+    const updated = recalcAfterMark(marked, "d7", 0.2);
+    expect(updated.phase).toBe("relearning");
+    expect(updated.relearning?.fromStep).toBe("d7");
+    expect(updated.d7.done).toBe(false);
+    expect(updated.d4.done).toBe(false);
+    expect(updated.d4.date).toBe(addDays(today, 1));
+  });
+
+  test("D21 with again severe enters relearning and targets D7", () => {
+    const today = todayStr();
+    const initialRev = buildRev(addDays(today, -21), "GO");
+    const marked = {
+      ...initialRev,
+      d21: {
+        ...initialRev.d21,
+        done: true,
+        reviewedAt: today,
+        scheduledAt: addDays(today, -3),
+        acerto: 0.2,
+      },
+      manutencao: {
+        done: false,
+        date: addDays(today, 40),
+        scheduledAt: addDays(today, 40),
+        S: 30,
+        D: 0.5,
+      },
+    };
+
+    const updated = recalcAfterMark(marked, "d21", 0.2);
+    expect(updated.phase).toBe("relearning");
+    expect(updated.d21.done).toBe(false);
+    expect(updated.d7.done).toBe(false);
+    expect(updated.d7.date).toBe(addDays(today, 1));
+  });
+
+  test("missing rating does not leave step completed", () => {
+    const today = todayStr();
+    const initialRev = buildRev(today, "GO");
+    const marked = {
+      ...initialRev,
+      d1: {
+        ...initialRev.d1,
+        done: true,
+        scheduledAt: today,
+        reviewedAt: today,
+      },
+    };
+    const updated = recalcAfterMark(marked, "d1", null);
+    expect(updated.d1.done).toBe(false);
+    expect(updated.d1.reviewedAt).toBeNull();
+    expect(updated.meta?.schedulerWarning).toBe("missing_rating");
+  });
+
+  test("maintenance with again severe returns to D7 relearning", () => {
+    const today = todayStr();
+    const initialRev = buildRev(addDays(today, -60), "GO");
+    const marked = {
+      ...initialRev,
+      manutencao: {
+        done: true,
+        date: addDays(today, -1),
+        scheduledAt: addDays(today, -3),
+        reviewedAt: today,
+        acerto: 0.2,
+        S: 40,
+        D: 0.5,
+        interval: 45,
+      },
+    };
+
+    const updated = recalcAfterMark(marked, "manutencao", 0.2);
+    expect(updated.phase).toBe("relearning");
+    expect(updated.d7.date).toBe(addDays(today, 1));
+  });
+
+  test("applyRelearningRecoveryBonus is small and bounded", () => {
+    expect(applyRelearningRecoveryBonus(10, "easy", { wasRelearning: true })).toBeCloseTo(11.2);
+    expect(applyRelearningRecoveryBonus(10, "good", { wasRelearning: true })).toBeCloseTo(10.5);
+    expect(applyRelearningRecoveryBonus(10, "hard", { wasRelearning: true })).toBeCloseTo(10);
+  });
+
+  test("maintenance saves real next interval", () => {
+    const today = todayStr();
+    const initialRev = buildRev(addDays(today, -30), "GO");
+    const marked = {
+      ...initialRev,
+      manutencao: {
+        done: true,
+        date: today,
+        scheduledAt: today,
+        reviewedAt: today,
+        acerto: 0.9,
+        S: 45,
+        D: 0.5,
+        interval: 45,
+      },
+    };
+
+    const updated = recalcAfterMark(marked, "manutencao", 0.9);
+    expect(updated.manutencao.interval).toBeDefined();
+    expect(updated.manutencao.targetInterval).toBe(90);
+    expect(updated.manutencao.date).toBe(addDays(today, updated.manutencao.interval));
+  });
+
+  test("reviewHistory receives events and is limited", () => {
+    const today = todayStr();
+    const rev = buildRev(today, "GO");
+    const withHistory = {
+      ...rev,
+      reviewHistory: Array.from({ length: 100 }, (_, idx) => ({
+        id: `h_${idx}`,
+        stepKey: "d1",
+        reviewedAt: today,
+      })),
+      d1: {
+        ...rev.d1,
+        done: true,
+        reviewedAt: today,
+        scheduledAt: today,
+      },
+    };
+
+    const updated = recalcAfterMark(withHistory, "d1", 0.9);
+    expect(updated.reviewHistory.length).toBe(100);
+    expect(updated.reviewHistory[99].stepKey).toBe("d1");
+    expect(updated.reviewHistory[99].reviewedAt).toBe(today);
+  });
+
+  test("appendReviewHistory enforces limit", () => {
+    const rev = { reviewHistory: Array.from({ length: 3 }, (_, idx) => ({ id: `x_${idx}` })) };
+    const out = appendReviewHistory(rev, { id: "x_3", stepKey: "d1" }, 3);
+    expect(out.length).toBe(3);
+    expect(out[0].id).toBe("x_1");
+    expect(out[2].id).toBe("x_3");
+  });
 });
diff --git a/src/core/mentorAutopilot.js b/src/core/mentorAutopilot.js
index 7c5aaad9..16c29e09 100644
--- a/src/core/mentorAutopilot.js
+++ b/src/core/mentorAutopilot.js
@@ -1,169 +1,51 @@
-import { buildActionInbox, pickPrimaryAction, sortActions } from "./actionInbox";
-import { adjustActionForPeakMode, getPeakModePolicy, getPeakPhase, shouldLimitNewTopics } from "./peakMode";
-import { featureEnabled } from "./platformFeatures";
+import { buildMentorContext } from "./mentorSignals";
+import { buildMentorTodayPlan, decideMentorAction } from "./mentorDecisionPolicy";
 
-function buildAction(type, priority, title, reason, ctaView = null, target = {}) {
-  return { type, priority, title, reason, ctaView, target };
-}
-
-function toInboxAction(action = {}) {
+function normalizeLegacyContext(context = {}) {
+  if (context.scheduler) return context;
   return {
-    id: `mentor_${action.type}_${action.target?.area || action.target?.tema || "root"}`,
-    type: action.type,
-    title: action.title,
-    reason: action.reason,
-    priority: action.priority,
-    source: "mentor",
-    dueDate: action.dueDate,
-    target: { ...action.target, view: action.ctaView || action.target?.view || null },
+    plat: context.plat || "res",
+    meta: context.meta || {},
+    scheduler: {
+      overdueCount: Number(context.overdue || 0),
+      dueTodayCount: Number(context.pending || 0),
+      todayMinutes: Number(context.todayMinutes || 0),
+      overloadLevelToday: context.overloadLevelToday || "ok",
+      overloadDays: Number(context.overloadDays || 0),
+      relearningCount: Number(context.relearningCount || 0),
+      relearningItems: context.relearningItems || [],
+      missingRatingWarnings: Number(context.missingRatingWarnings || 0),
+      missingReviewedAtCount: Number(context.missingReviewedAtCount || 0),
+      nextDueItem: context.nextDueItem || null,
+      maxDelayDays: Number(context.maxDelayDays || 0),
+      trueRetentionCollecting: Boolean(context.trueRetentionCollecting),
+    },
+    enamed: context.enamed || null,
+    weakSubject: context.materiaFracaVest || context.weakSubject || null,
+    clinical: context.clinical || { dueCount: 0, dueItems: [] },
+    pendingExamAnalysis: Boolean(context.pendingExamAnalysis),
+    calendarProvider: context.calendarProvider || {},
+    userAvailableMinutes: context.userAvailableMinutes || null,
+    lowEnergy: Boolean(context.lowEnergy),
+    exhaustionDetected: Boolean(context.exhaustionDetected),
+    readinessData: context.readinessData || null,
   };
 }
 
 export function getMentorNextAction(context = {}) {
-  const plat = context.plat || "res";
-  const pending = Number(context.pending || 0);
-  const overdue = Number(context.overdue || 0);
-  const enamed = context.enamed || {};
-  const areaCritica = enamed?.resumo?.areaCritica || null;
-  const materiaFracaVest = context.materiaFracaVest || context.weakSubject || null;
-  const readiness = Number(context.readiness || 0);
-  const examDate = context.examDate || context.meta?.dataProva;
-
-  const phase = getPeakPhase({ examDate, today: context.today });
-  const policy = getPeakModePolicy(phase);
-
-  const candidates = [];
-  if (overdue > 0) {
-    candidates.push(
-      buildAction(
-        "revisao_vencida",
-        100,
-        "Resolver revisoes vencidas agora",
-        "Ha revisoes vencidas, e isso corroi retencao de curto prazo.",
-        "dash",
-        { tema: "fila_vencida" }
-      )
-    );
-  }
-  if (pending > 0) {
-    candidates.push(
-      buildAction(
-        "fila_do_dia",
-        90,
-        "Zerar fila de hoje",
-        "Completar a fila de hoje mantem cadencia e protege a ofensiva.",
-        "dash",
-        { tema: "fila_do_dia" }
-      )
-    );
-  }
-  if (featureEnabled(plat, "enamed") && areaCritica) {
-    candidates.push(
-      buildAction(
-        "enamed_critico",
-        80,
-        `Atacar lacuna de ${areaCritica}`,
-        "A analise ENAMED apontou esta area como maior gargalo recente.",
-        "stats",
-        { area: areaCritica }
-      )
-    );
-  } else if (!featureEnabled(plat, "enamed") && materiaFracaVest) {
-    candidates.push(
-      buildAction(
-        "vestibular_materia_fraca",
-        80,
-        `Reforcar ${materiaFracaVest} hoje`,
-        "Seu último simulado mostrou perda de pontos nesta matéria.",
-        "stats",
-        { area: materiaFracaVest }
-      )
-    );
-  }
-  if (readiness < 60) {
-    candidates.push(
-      buildAction(
-        "fundamentos",
-        70,
-        "Reforcar fundamentos antes de avancar",
-        featureEnabled(plat, "enamed")
-          ? "Preparo estimado ainda baixo; reduzir novidade melhora eficiencia."
-          : "Preparo estimado ainda baixo para a prova; consolidar base melhora acerto.",
-        "crono"
-      )
-    );
-  }
-
-  if (!shouldLimitNewTopics({ phase, backlog: context.backlog || pending, coverage: context.coverage || readiness })) {
-    candidates.push(
-      buildAction(
-        "new_topic",
-        55,
-        featureEnabled(plat, "enamed") ? "Iniciar tema novo estrategico" : "Iniciar matéria nova estratégica",
-        featureEnabled(plat, "enamed")
-          ? "Com a fila sob controle, o melhor ganho vem de cobertura em tema de incidencia."
-          : "Com a fila sob controle, avance na cobertura da matéria com maior peso de prova.",
-        "crono"
-      )
-    );
-  }
-
-  if (!candidates.length) {
-    return {
-      ...buildAction(
-        "manutencao",
-        10,
-        "Manter consistencia leve",
-        "Sem urgencia critica detectada. Siga o plano e preserve constancia.",
-        "dash"
-      ),
-      peakPhase: phase,
-      peakPolicy: policy,
-    };
-  }
-
-  const adapted = candidates.map((action) => adjustActionForPeakMode(toInboxAction(action), policy));
-  const inbox = buildActionInbox({
-    actions: adapted,
-    actionInboxState: context.actionInboxState || {},
-    reflectionActions: context.reflectionActions || [],
-    shouldRest: Boolean(context.lowEnergy || context.exhaustionDetected),
-  });
-  const primary = pickPrimaryAction(inbox) || sortActions(adapted)[0];
-  const fallback = candidates.find((item) => item.type === primary?.type);
-
-  return {
-    ...(fallback || {
-      type: primary?.type || "manutencao",
-      priority: primary?.priority || 10,
-      title: primary?.title || "Manter consistencia leve",
-      reason: primary?.reason || "Sem acao prioritaria.",
-      ctaView: primary?.target?.view || "dash",
-    }),
-    peakPhase: phase,
-    peakPolicy: policy,
-  };
+  return decideMentorAction(normalizeLegacyContext(context));
 }
 
 export function getMentorTodayPlan(context = {}) {
-  const next = getMentorNextAction(context);
-  const plat = context.plat || "res";
-  const plan = [next.title];
-  if (next.type !== "revisao_vencida" && Number(context.pending || 0) > 0) {
-    plan.push("Fechar a fila restante do dia");
-  }
-  if (featureEnabled(plat, "enamed") && context.enamed?.resumo?.areaCritica) {
-    plan.push(`Reservar bloco para ${context.enamed.resumo.areaCritica}`);
-  } else if (!featureEnabled(plat, "enamed") && (context.materiaFracaVest || context.weakSubject)) {
-    plan.push(`Treinar ${context.materiaFracaVest || context.weakSubject} com simulado dirigido`);
-  }
-  if (next.peakPhase && next.peakPhase !== "base") {
-    plan.push(`Aplicar politica de ${next.peakPhase.replace("_", " ")}`);
-  }
-  return plan;
+  return buildMentorTodayPlan(normalizeLegacyContext(context));
 }
 
 export function explainMentorAction(action = {}) {
-  if (!action?.title) return "Sem acao definida.";
-  return `${action.title}: ${action.reason || "sem justificativa disponivel."}`;
+  if (!action?.title) return "Sem ação definida.";
+  const explain = Array.isArray(action.explain) && action.explain.length > 0
+    ? action.explain[0]
+    : (action.reason || "sem justificativa disponível.");
+  return `${action.title}: ${explain}`;
 }
+
+export { buildMentorContext };
diff --git a/src/core/mentorAutopilot.test.js b/src/core/mentorAutopilot.test.js
index 1e9e7a61..aae74510 100644
--- a/src/core/mentorAutopilot.test.js
+++ b/src/core/mentorAutopilot.test.js
@@ -2,43 +2,41 @@ import { explainMentorAction, getMentorNextAction, getMentorTodayPlan } from "./
 
 describe("mentorAutopilot", () => {
   test("prioriza revisão vencida quando existe", () => {
-    const action = getMentorNextAction({ pending: 6, overdue: 2, readiness: 70 });
+    const action = getMentorNextAction({ overdue: 2, pending: 4 });
     expect(action.type).toBe("revisao_vencida");
+    expect(action.target).toBeDefined();
   });
 
-  test("usa lacuna ENAMED quando não há pendência urgente", () => {
-    const action = getMentorNextAction({
-      pending: 0,
-      overdue: 0,
-      enamed: { resumo: { areaCritica: "GO" } },
-      readiness: 75,
-    });
-    expect(action.type).toBe("enamed_critico");
+  test("gera ação com schema completo", () => {
+    const action = getMentorNextAction({ pending: 0, overdue: 0, userAvailableMinutes: 120 });
+    expect(action.id).toBeTruthy();
+    expect(typeof action.priority).toBe("number");
+    expect(Array.isArray(action.explain)).toBe(true);
+    expect(action.target).toBeDefined();
   });
 
-  test("gera plano de hoje com pelo menos uma ação", () => {
-    const plan = getMentorTodayPlan({ pending: 0, overdue: 0, readiness: 85 });
-    expect(Array.isArray(plan)).toBe(true);
-    expect(plan.length).toBeGreaterThan(0);
-  });
-
-  test("vest prioriza matéria fraca e não usa ação ENAMED", () => {
+  test("vest usa matéria fraca e não usa ENAMED", () => {
     const action = getMentorNextAction({
       plat: "vest",
       pending: 0,
       overdue: 0,
-      enamed: { resumo: { areaCritica: "GO" } },
       weakSubject: "Matemática",
-      readiness: 75,
+      enamed: { resumo: { areaCritica: "GO" } },
     });
     expect(action.type).toBe("vestibular_materia_fraca");
   });
 
-  test("explicação textual inclui motivo", () => {
+  test("plano diário retorna lista de ações explicáveis", () => {
+    const plan = getMentorTodayPlan({ pending: 1, overdue: 0 });
+    expect(Array.isArray(plan)).toBe(true);
+    expect(plan.length).toBeGreaterThan(0);
+  });
+
+  test("explicação textual inclui motivo estruturado", () => {
     const text = explainMentorAction({
-      title: "Zerar fila",
-      reason: "evitar acúmulo",
+      title: "Fechar fila",
+      explain: ["Evitar acúmulo nas próximas 24h."],
     });
-    expect(text).toMatch("evitar acúmulo");
+    expect(text).toMatch("Evitar acúmulo");
   });
 });
diff --git a/src/core/store.js b/src/core/store.js
index c08f2186..b63bb88c 100644
--- a/src/core/store.js
+++ b/src/core/store.js
@@ -850,42 +850,49 @@ export const useStore = create(
         get().finalizarValidacaoDominioPrevio(platKey, temaId, { questoes, acertos }),
 
       markStep: (platKey, temaId, stepKey, { acerto, previsao, questoes, motivosErro, erros, tempoMin, ansiedade, cansaco, confianca, dificuldade, foco, c1, c2, c3, c4, c5, modoReduzido, descansoPrescrito }) =>
-        set((s) => ({
-          [platKey]: {
-            ...s[platKey],
-            temas: s[platKey].temas.map((t) => {
-              if (t.id !== temaId) return t;
-              const revMarked = {
-                ...t.rev,
-                [stepKey]: {
-                  ...t.rev[stepKey],
-                  done: true,
-                  acerto,
-                  previsao,
-                  questoes,
-                  motivosErro: motivosErro || [],
-                  erros: erros || [],
-                  tempoMin: tempoMin ?? t.rev[stepKey].tempoMin,
-                  ansiedade: ansiedade ?? t.rev[stepKey].ansiedade,
-                  cansaco: cansaco ?? t.rev[stepKey].cansaco,
-                  confianca: confianca ?? t.rev[stepKey].confianca,
-                  dificuldade: dificuldade ?? t.rev[stepKey].dificuldade,
-                  foco: foco ?? t.rev[stepKey].foco,
-                  c1: c1 ?? t.rev[stepKey].c1,
-                  c2: c2 ?? t.rev[stepKey].c2,
-                  c3: c3 ?? t.rev[stepKey].c3,
-                  c4: c4 ?? t.rev[stepKey].c4,
-                  c5: c5 ?? t.rev[stepKey].c5,
-                  modoReduzido: modoReduzido ?? t.rev[stepKey].modoReduzido,
-                  descansoPrescrito: descansoPrescrito ?? t.rev[stepKey].descansoPrescrito,
-                },
-              };
-              const desiredRetention = getRetencaoArea(t.esp, s.meta?.retencaoFSRS ?? 0.90);
-              const maxInterval = s.meta?.intervaloMaxDias ?? 180;
-              return { ...t, rev: recalcAfterMark(revMarked, stepKey, acerto, desiredRetention, maxInterval, t.esp) };
-            }),
-          },
-        })),
+        set((s) => {
+          const reviewedAt = todayStr();
+          return {
+            [platKey]: {
+              ...s[platKey],
+              temas: s[platKey].temas.map((t) => {
+                if (t.id !== temaId) return t;
+                const currentStep = t.rev?.[stepKey] || {};
+                const revMarked = {
+                  ...t.rev,
+                  [stepKey]: {
+                    ...currentStep,
+                    done: true,
+                    acerto,
+                    previsao,
+                    questoes,
+                    reviewedAt,
+                    completedAt: reviewedAt,
+                    scheduledAt: currentStep.scheduledAt || currentStep.date || reviewedAt,
+                    motivosErro: motivosErro || [],
+                    erros: erros || [],
+                    tempoMin: tempoMin ?? currentStep.tempoMin,
+                    ansiedade: ansiedade ?? currentStep.ansiedade,
+                    cansaco: cansaco ?? currentStep.cansaco,
+                    confianca: confianca ?? currentStep.confianca,
+                    dificuldade: dificuldade ?? currentStep.dificuldade,
+                    foco: foco ?? currentStep.foco,
+                    c1: c1 ?? currentStep.c1,
+                    c2: c2 ?? currentStep.c2,
+                    c3: c3 ?? currentStep.c3,
+                    c4: c4 ?? currentStep.c4,
+                    c5: c5 ?? currentStep.c5,
+                    modoReduzido: modoReduzido ?? currentStep.modoReduzido,
+                    descansoPrescrito: descansoPrescrito ?? currentStep.descansoPrescrito,
+                  },
+                };
+                const desiredRetention = getRetencaoArea(t.esp, s.meta?.retencaoFSRS ?? 0.90);
+                const maxInterval = s.meta?.intervaloMaxDias ?? 180;
+                return { ...t, rev: recalcAfterMark(revMarked, stepKey, acerto, desiredRetention, maxInterval, t.esp) };
+              }),
+            },
+          };
+        }),
 
       importTemas: (platKey, items, d0) =>
         set((s) => ({
diff --git a/src/hooks/useMetrics.js b/src/hooks/useMetrics.js
index e73f6be2..f29b5ddb 100644
--- a/src/hooks/useMetrics.js
+++ b/src/hooks/useMetrics.js
@@ -328,22 +328,83 @@ export function calcBleedingScore(temas) {
 }
 
 export function calcTrueRetention(temas) {
-  const vals = [];
+  const detailed = calcTrueRetentionDetailed(temas);
+  return detailed?.pct ?? null;
+}
+
+function shouldCountLongRetentionEvent(event = {}, now = todayStr()) {
+  if (!event || event.acerto == null) return false;
+  if (event.official === false) return false;
+  if (event.stepKey === "d21") return true;
+  if (event.phase === "maintenance" || event.phaseAfter === "maintenance") return true;
+  if (Number(event.intervalBefore) >= 15) return true;
+  if (event.scheduledAt && event.reviewedAt) {
+    return Math.max(0, diffDays(event.scheduledAt, event.reviewedAt)) >= 15;
+  }
+  if (event.reviewedAt && event.previousReviewedAt) {
+    return Math.max(0, diffDays(event.previousReviewedAt, event.reviewedAt)) >= 15;
+  }
+  return false;
+}
+
+export function calcTrueRetentionDetailed(temas = []) {
+  let weightedHits = 0;
+  let weightedTotal = 0;
+  let n = 0;
+  let totalQuestoes = 0;
+  const now = todayStr();
+
   for (let i = 0; i < temas.length; i++) {
     const t = temas[i];
-    if (t.unstarted) continue;
-    for (let j = 0; j < STEPS.length; j++) {
-      const s = STEPS[j];
-      if (s.offset > 15) {
-        const r = t.rev[s.key];
-        if (r && r.done && r.acerto != null) {
-          vals.push(r.acerto);
-        }
+    if (!t || t.unstarted) continue;
+    const history = Array.isArray(t.rev?.reviewHistory) ? t.rev.reviewHistory : [];
+
+    for (let j = 0; j < history.length; j++) {
+      const event = history[j];
+      if (!shouldCountLongRetentionEvent(event, now)) continue;
+      const acerto = Number(event.acerto);
+      if (Number.isNaN(acerto)) continue;
+      const questoes = Number(event.questoes);
+      const weight = Number.isFinite(questoes) && questoes > 0 ? questoes : 1;
+      weightedHits += acerto * weight;
+      weightedTotal += weight;
+      totalQuestoes += Number.isFinite(questoes) && questoes > 0 ? questoes : 0;
+      n += 1;
+    }
+
+    if (!history.length) {
+      const d21 = t.rev?.d21;
+      if (d21?.done && d21.acerto != null) {
+        const questoes = Number(d21.questoes);
+        const weight = Number.isFinite(questoes) && questoes > 0 ? questoes : 1;
+        weightedHits += Number(d21.acerto) * weight;
+        weightedTotal += weight;
+        totalQuestoes += Number.isFinite(questoes) && questoes > 0 ? questoes : 0;
+        n += 1;
       }
     }
   }
-  if (!vals.length) return null;
-  return Math.round((vals.reduce((a, b) => a + b) / vals.length) * 100);
+
+  if (weightedTotal <= 0 || n <= 0) {
+    return {
+      value: null,
+      pct: null,
+      n: 0,
+      totalQuestoes: 0,
+      source: "d21+maintenance",
+      collecting: true,
+    };
+  }
+
+  const value = weightedHits / weightedTotal;
+  return {
+    value,
+    pct: Math.round(value * 100),
+    n,
+    totalQuestoes,
+    source: "d21+maintenance",
+    collecting: false,
+  };
 }
 
 // ─── CUSTOM REACT HOOK WRAPPERS ──────────────────────────────────────────────
diff --git a/src/hooks/useMetrics.test.js b/src/hooks/useMetrics.test.js
index 1872cb0b..d8bc4bae 100644
--- a/src/hooks/useMetrics.test.js
+++ b/src/hooks/useMetrics.test.js
@@ -99,29 +99,68 @@ describe("Metrics Calculation Test Suite", () => {
         id: 1,
         esp: "Pediatria",
         rev: {
-          d0: { done: true, acerto: 0.9 }, // Skip (not D21)
-          d21: { done: true, acerto: 0.8 } // Include
+          reviewHistory: [
+            { stepKey: "d21", reviewedAt: "2026-06-01", acerto: 0.8, questoes: 20, official: true },
+            { stepKey: "manutencao", phaseAfter: "maintenance", reviewedAt: "2026-06-10", acerto: 0.9, questoes: 10, official: true },
+          ],
+          d0: { done: true, acerto: 0.9 },
+          d21: { done: true, acerto: 0.8 }
         }
       },
       {
         id: 2,
         esp: "Clinica",
         rev: {
-          d21: { done: true, acerto: 0.6 } // Include
+          reviewHistory: [
+            { stepKey: "d21", reviewedAt: "2026-06-01", acerto: 0.6, questoes: 30, official: true },
+          ],
+          d21: { done: true, acerto: 0.6 }
         }
       },
       {
         id: 3,
         esp: "GO",
         rev: {
-          d21: { done: false, acerto: null } // Skip (not done)
+          reviewHistory: [
+            { stepKey: "d7", reviewedAt: "2026-06-01", acerto: 1.0, questoes: 50, official: true },
+          ],
+          d21: { done: false, acerto: null }
         }
       }
     ];
 
     const trueRetention = calcTrueRetention(mockTemas);
-    // Average of 80% and 60% is 70%
-    expect(trueRetention).toBe(70);
+    // Weighted: (0.8*20 + 0.9*10 + 0.6*30) / (20+10+30) = 0.716...
+    expect(trueRetention).toBe(72);
+  });
+
+  test("calcTrueRetention returns null when no long-retention evidence exists", () => {
+    const mockTemas = [
+      {
+        id: 1,
+        esp: "GO",
+        rev: {
+          reviewHistory: [{ stepKey: "d7", reviewedAt: "2026-06-01", acerto: 0.9, official: true }],
+          d7: { done: true, acerto: 0.9 },
+        },
+      },
+    ];
+    expect(calcTrueRetention(mockTemas)).toBeNull();
+  });
+
+  test("calcTrueRetention ignores unofficial review events", () => {
+    const mockTemas = [
+      {
+        id: 1,
+        esp: "GO",
+        rev: {
+          reviewHistory: [
+            { stepKey: "d21", reviewedAt: "2026-06-01", acerto: 1, questoes: 100, official: false },
+          ],
+        },
+      },
+    ];
+    expect(calcTrueRetention(mockTemas)).toBeNull();
   });
 
   test("calcBleedingScore scores the lowest areas with sufficient question counts", () => {

```

## Untracked file contents


### Cronograma_Estrategia_Extensivo_Completo.md

```txt
# Cronograma Estratégia MED — Extensivo

> Extraído do PDF enviado pelo usuário: `Cronograma Estratégia Extensivo para o Chat.pdf`.
> Observação: este arquivo é uma transcrição operacional para importação/uso pessoal no MedRev. Não trate como conteúdo oficial público da plataforma de origem.

## Resumo

- Total de semanas identificadas: **50**
- Total de tópicos identificados: **330**
- Formato: `ÁREA — Tema`

## Semana 1

- **CARDIOLOGIA** — Hipertensão Arterial Sistêmica (Parte 1): Diagnóstico, Classificação, Avaliação
- **CIRURGIA** — Trauma - Avaliação Inicial, Vias Aéreas e Trauma Torácico
- **GINECOLOGIA** — Anatomia e Embriologia do Trato Genital Feminino
- **OBSTETRÍCIA** — Modificações Fisiológicas da Gestação
- **PEDIATRIA** — Imunizações
- **PREVENTIVA** — História do SUS

## Semana 2

- **CIRURGIA** — Trauma - Choque
- **ENDOCRINO** — Introdução ao Diabetes Mellitus
- **GASTRO** — Disfagia, Alterações Estruturais e Distúrbios da Motilidade do Esôfago
- **GINECOLOGIA** — Ciclo Menstrual
- **INFECTOLOGIA** — Antibióticos
- **PEDIATRIA** — Aleitamento Materno

## Semana 3

- **CARDIOLOGIA** — Hipertensão Arterial Sistêmica (Parte 2): Tratamento
- **CIRURGIA** — Trauma Abdominal e Pélvico
- **NEFROLOGIA** — Doença Renal Crônica (DRC) - Parte I
- **OBSTETRÍCIA** — Pré-Natal
- **PEDIATRIA** — Crescimento
- **PREVENTIVA** — Princípios e Diretrizes do SUS

## Semana 4

- **CIRURGIA** — Trauma Populações Especiais (Pediátrico, Gestante e Idosos)
- **ENDOCRINO** — Diabetes Mellitus Tipo 2
- **GINECOLOGIA** — Miomatose Uterina
- **INFECTOLOGIA** — Tuberculose
- **NEURO** — Anatomia, Fisiologia e Semiologia Neurológica
- **PEDIATRIA** — Puberdade

## Semana 5

- **CARDIOLOGIA** — Hipertensão Arterial Sistêmica (Parte 3): Secundária e Crise Hipertensiva
- **CIRURGIA** — Trauma de Face e Cervical
- **OBSTETRÍCIA** — Bacia Obstétrica, Pelvimetria e Estática Fetal
- **PEDIATRIA** — Diagnóstico Nutricional
- **PNEUMO** — Introdução a Pneumologia
- **PREVENTIVA** — Marcos legais do Sistema Único de Saúde

## Semana 6

- **CIRURGIA** — Trauma Vascular de Extremidades e Musculoesquelético
- **ENDOCRINO** — Diabetes Mellitus - Insulinoterapia e Cirurgia Metabólica
- **GASTRO** — Doença do Refluxo Gastroesofágico, Esofagites Não-Pépticas e Ingestão de Corpo Estranho
- **GINECOLOGIA** — Adenomiose
- **INFECTOLOGIA** — Leptospirose
- **PEDIATRIA** — Desenvolvimento Neuropsicomotor

## Semana 7

- **CARDIOLOGIA** — Insuficiência Cardíaca (Parte 1): Classificação, Fisiopatologia, Diagnóstico
- **CIRURGIA** — Queimaduras e Trauma Elétrico
- **GINECOLOGIA** — Endometriose
- **OBSTETRÍCIA** — Mecanismo de Parto e Fases Clínicas do Parto
- **PEDIATRIA** — Deficiências Vitamínicas e Profilaxias
- **PREVENTIVA** — Financiamento em Saúde

## Semana 8

- **CIRURGIA** — Urgências Abdominais - Abdome Agudo
- **ENDOCRINO** — Diabetes Mellitus - Complicações Agudas
- **INFECTOLOGIA** — Malária
- **NEFROLOGIA** — Doença Renal Crônica (DRC) - Parte II
- **NEURO** — Coma e Alterações da Consciência
- **PEDIATRIA** — Cuidados Neonatais

## Semana 9

- **CARDIOLOGIA** — Insuficiência Cardíaca (Parte 2): Tratamento
- **CIRURGIA** — Abdome Agudo Inflamatório - Apendicite Aguda
- **GINECOLOGIA** — Pólipos Uterinos
- **OBSTETRÍCIA** — Partograma e Distocias
- **PEDIATRIA** — Reanimação neonatal
- **PREVENTIVA** — Processos de Descentralização e Regionalização do SUS

## Semana 10

- **CIRURGIA** — Abdome Agudo Inflamatório - Colecistite e Colangite Aguda
- **ENDOCRINO** — Diabetes Mellitus - Complicações Crônicas
- **GASTRO** — Anatomofisiologia Gástrica, Gastrites, Gastroparesia e Dispepsia Funcional
- **INFECTOLOGIA** — Síndrome Febril Íctero-Hemorrágica
- **PEDIATRIA** — Distúrbios Respiratórios do Período Neonatal
- **REUMATO** — Introdução à Reumatologia

## Semana 11

- **CARDIOLOGIA** — Insuficiência Cardíaca Aguda
- **CIRURGIA** — Abdome Agudo Inflamatório - Diverticulite Aguda
- **GINECOLOGIA** — Dor Pélvica Crônica e Dismenorreia
- **OBSTETRÍCIA** — Assistência ao Parto
- **PEDIATRIA** — Distúrbios Metabólicos Neonatais
- **PREVENTIVA** — Atenção Primária à Saúde

## Semana 12

- **CIRURGIA** — Abdome Agudo Perfurativo
- **ENDOCRINO** — Diabetes Mellitus - Hiperglicemia Hospitalar
- **GINECOLOGIA** — Abdome Agudo em Ginecologia
- **INFECTOLOGIA** — Neutropenia Febril e Febre de Origem Indeterminada
- **NEFROLOGIA** — Lesão Renal Aguda (LRA)
- **PEDIATRIA** — Infecções Congênitas

## Semana 13

- **CARDIOLOGIA** — Dislipidemia e Estratificação de Risco Cardiovascular
- **CIRURGIA** — Abdome Agudo Obstrutivo
- **NEURO** — Cefaleias
- **OBSTETRÍCIA** — Parto Vaginal Operatório
- **PEDIATRIA** — Icterícia e Sepse Neonatal
- **PREVENTIVA** — Políticas de Saúde

## Semana 14

- **CIRURGIA** — Abdome Agudo Vascular
- **ENDOCRINO** — Perioperatório - Controle Glicêmico e Manejo dos Glicocorticóides
- **GASTRO** — Doença Ulcerosa Péptica, IBPs e H. Pylori
- **GINECOLOGIA** — Assistência à Vítima de Violência Sexual
- **INFECTOLOGIA** — HIV
- **PEDIATRIA** — Síndromes Genéticas, Erros Inatos do Metabolismo e da Imunidade

## Semana 15

- **CARDIOLOGIA** — Doença Arterial Coronariana Estável (DAC Estável)
- **CIRURGIA** — Abdome Agudo Hemorrágico
- **OBSTETRÍCIA** — Indução do Parto e Pós-Datismo
- **PEDIATRIA** — Pneumonias na Infância
- **PNEUMO** — Derrame Pleural
- **PREVENTIVA** — Medicina de Família e Comunidade

## Semana 16

- **CIRURGIA** — Medicina Perioperatória
- **ENDOCRINO** — Tireoide - Fisiologia, Semiologia e Avaliação Diagnóstica
- **GINECOLOGIA** — Sangramento Uterino Anormal
- **INFECTOLOGIA** — Endocardite Bacteriana - Endocardite Infecciosa
- **NEFROLOGIA** — Infecção do Trato Urinário
- **PEDIATRIA** — Bronquiolite

## Semana 17

- **CARDIOLOGIA** — SCASSST - Síndrome Coronária Aguda Sem Supra do Segmento ST
- **CIRURGIA** — Resposta Endócrino-Metabólica ao Trauma
- **GINECOLOGIA** — Amenorreia
- **OBSTETRÍCIA** — Hemorragia Pós-Parto
- **PEDIATRIA** — Coqueluche
- **PREVENTIVA** — Saúde do Idoso

## Semana 18

- **CIRURGIA** — Nutrição em Cirurgia e Aceleração da Recuperação Pós-Operatória
- **ENDOCRINO** — Tireoide - Hipotireoidismo
- **GASTRO** — Anatomia e Fisiologia do Pâncreas e Neoplasias Pancreáticas
- **INFECTOLOGIA** — Arboviroses (Dengue, Chikungunya e Zika)
- **NEURO** — Demências
- **PEDIATRIA** — Asma

## Semana 19

- **CARDIOLOGIA** — IAMCSST (Infarto Agudo do Miocárdio com Supradesnivelamento de Segmento ST)
- **CIRURGIA** — Complicações Pós-Operatórias
- **GINECOLOGIA** — Síndrome dos Ovários Policísticos
- **OBSTETRÍCIA** — Infecção Puerperal
- **PEDIATRIA** — Fibrose Cística
- **PREVENTIVA** — Ética Médica

## Semana 20

- **CIRURGIA** — Cicatrização de Feridas
- **ENDOCRINO** — Tireoide - Tireotoxicose: Diagnóstico, Etiologia, Tratamento
- **INFECTOLOGIA** — Pneumonias Bacterianas
- **NEFROLOGIA** — Distúrbios Ácido-Básicos
- **PEDIATRIA** — Doenças Exantemáticas
- **PNEUMO** — Doença Pulmonar Obstrutiva Crônica (DPOC)

## Semana 21

- **CARDIOLOGIA** — Semiologia Cardíaca
- **CIRURGIA** — Hérnias da Parede Abdominal
- **GINECOLOGIA** — Planejamento Familiar
- **OBSTETRÍCIA** — Sangramento da Primeira Metade
- **PEDIATRIA** — Tuberculose na Infância
- **PREVENTIVA** — Processo Saúde-Doença

## Semana 22

- **CIRURGIA** — Cirurgia Bariátrica e Metabólica
- **ENDOCRINO** — Obesidade e Síndrome Metabólica
- **GASTRO** — Pancreatite Aguda e Crônica
- **GINECOLOGIA** — Climatério e Terapia Hormonal
- **INFECTOLOGIA** — Animais Peçonhentos
- **PEDIATRIA** — Febre na Pediatria

## Semana 23

- **CARDIOLOGIA** — Fibrilação e Flutter Atrial
- **CIRURGIA** — Vesícula e Vias Biliares
- **NEURO** — Epilepsias
- **OBSTETRÍCIA** — Sangramento da Segunda Metade
- **PEDIATRIA** — Cardiopatias Congênitas
- **PREVENTIVA** — Medidas de Saúde Coletiva - Indicadores de Morbidade

## Semana 24

- **CIRURGIA** — Proctologia
- **ENDOCRINO** — Metabolismo Ósseo e Mineral - Hipercalcemia
- **GINECOLOGIA** — Infertilidade Conjugal
- **INFECTOLOGIA** — Sepse
- **NEFROLOGIA** — Análise da Gasometria Arterial
- **PEDIATRIA** — Diarreia

## Semana 25

- **CARDIOLOGIA** — Taquiarritmias
- **CIRURGIA** — Cirurgia Infantil - Parte I
- **OBSTETRÍCIA** — Prematuridade e Trabalho de Parto Prematuro
- **PEDIATRIA** — Doença do Refluxo Gastroesofágico em Pediatria
- **PNEUMO** — Tromboembolismo Pulmonar (TEP)
- **PREVENTIVA** — Medidas de Saúde Coletiva - Indicadores de Mortalidade

## Semana 26

- **CIRURGIA** — Cirurgia Infantil - Parte II
- **ENDOCRINO** — Metabolismo Ósseo e Mineral - Hipocalcemia
- **GASTRO** — Anatomia e Fisiologia do Cólon e Síndrome do Intestino Irritável
- **GINECOLOGIA** — Síndrome Pré-Menstrual
- **INFECTOLOGIA** — Micoses Invasivas
- **PEDIATRIA** — Infecção de Trato Urinário em Pediatria

## Semana 27

- **CARDIOLOGIA** — Bradiarritmias
- **CIRURGIA** — Cirurgia Infantil - Parte III
- **GINECOLOGIA** — Cervicites
- **OBSTETRÍCIA** — Rotura Prematura de Membranas
- **PEDIATRIA** — Doença de Kawasaki
- **PREVENTIVA** — Medidas de Saúde Coletiva - Indicadores Demográficos

## Semana 28

- **CIRURGIA** — Cirurgia Vascular
- **ENDOCRINO** — Metabolismo Ósseo e Mineral - Osteoporose e Doença de Paget
- **INFECTOLOGIA** — Meningites (Infecções do SNC)
- **NEFROLOGIA** — Doenças Glomerulares
- **NEURO** — Acidentes Vasculares Cerebrais
- **PEDIATRIA** — Febre Reumática

## Semana 29

- **CARDIOLOGIA** — Parada Cardiorrespiratória (PCR)
- **CIRURGIA** — Urologia
- **GINECOLOGIA** — Doença Inflamatória Pélvica
- **OBSTETRÍCIA** — Abortamento de Repetição
- **PEDIATRIA** — Emergências Pediátricas
- **PREVENTIVA** — Processos Epidêmicos e Epidemiologia das Doenças Infecciosas

## Semana 30

- **CIRURGIA** — Cirurgia Plástica
- **ENDOCRINO** — Adrenal - Hipocortisolismo (Insuficiência Adrenal)
- **GASTRO** — Distúrbios Disabsortivos
- **INFECTOLOGIA** — Hepatoesplenomegalias Infecciosas
- **PEDIATRIA** — Choque em Pediatria
- **PNEUMO** — Pneumologia Intensiva

## Semana 31

- **CARDIOLOGIA** — Síncope
- **CIRURGIA** — Cirurgia Torácica
- **GINECOLOGIA** — Úlceras Genitais
- **OBSTETRÍCIA** — Gestação Múltipla
- **PEDIATRIA** — Convulsão Febril
- **PREVENTIVA** — Vigilância em Saúde

## Semana 32

- **CIRURGIA** — Temas Gerais em Cirurgia
- **ENDOCRINO** — Adrenal - Hipercortisolismo (Síndrome de Cushing)
- **GINECOLOGIA** — Vulvovaginites
- **INFECTOLOGIA** — Influenza
- **NEFROLOGIA** — Nefrolitíase
- **PEDIATRIA** — Anafilaxia e Urticária

## Semana 33

- **CARDIOLOGIA** — Eletrocardiograma
- **NEURO** — Doenças Neuromusculares (Neuropatias, Miopatias, Junção, Neurônio Motor)
- **OBSTETRÍCIA** — Síndromes Hipertensivas da Gestação
- **PEDIATRIA** — Hiperplasia Adrenal Congênita
- **PREVENTIVA** — Sistemas de Informação em Saúde
- **REUMATO** — Artrite Reumatoide

## Semana 34

- **ENDOCRINO** — Adrenal - Feocromocitoma, Hiperaldosteronismo e Incidentaloma
- **GASTRO** — Doença Inflamatória Intestinal
- **GINECOLOGIA** — Rastreamento do Câncer de Colo Uterino
- **HEMATO** — Introdução ao Estudo das Anemias
- **INFECTOLOGIA** — Parasitoses
- **PEDIATRIA** — Alergia Alimentar

## Semana 35

- **CARDIOLOGIA** — Síndromes Aórticas Agudas
- **OBSTETRÍCIA** — Diabetes Mellitus na Gestação
- **PEDIATRIA** — Obesidade Infantil e na Adolescência
- **PNEUMO** — Asma
- **PREVENTIVA** — Pesquisa Epidemiológica e Medidas de Associação
- **REUMATO** — Espondiloartrites

## Semana 36

- **ENDOCRINO** — Hipófise - Hiperprolactinemia
- **GINECOLOGIA** — Câncer de Colo Uterino
- **HEMATO** — Anemias Microcíticas
- **INFECTOLOGIA** — Covid 19
- **NEFROLOGIA** — Distúrbios do Potássio
- **PEDIATRIA** — Constipação Intestinal

## Semana 37

- **CARDIOLOGIA** — Choque
- **GINECOLOGIA** — Tumores Anexiais e Câncer de Ovário
- **NEURO** — Distúrbios do Movimento
- **OBSTETRÍCIA** — Sífilis na Gestação e Sífilis Congênitas
- **PEDIATRIA** — Desnutrição na Infância
- **PREVENTIVA** — Testes Diagnósticos

## Semana 38

- **ENDOCRINO** — Neoplasias Endócrinas Múltiplas
- **GASTRO** — Hemorragia Digestiva Alta Varicosa
- **HEMATO** — Anemias Macrocíticas
- **INFECTOLOGIA** — Infecções Relacionadas à Assistência em Saúde
- **PEDIATRIA** — Hipertensão Arterial na Criança e Adolescente
- **REUMATO** — Artrites Microcristalinas

## Semana 39

- **CARDIOLOGIA** — Cardiomiopatias
- **GINECOLOGIA** — Doenças de Vulva e Vagina
- **OBSTETRÍCIA** — Ultrassom em Obstetrícia
- **PEDIATRIA** — Púrpura de Hennoch Schonlein-Vasculite por IGA
- **PREVENTIVA** — Estatística Médica
- **PSIQUIATRIA** — Dependência Química

## Semana 40

- **HEMATO** — Anemias Hemolíticas
- **INFECTOLOGIA** — Raiva, Tétano, Mordedura e Arranhadura Animal
- **NEFROLOGIA** — Distúrbios do Sódio - Disnatremias
- **PEDIATRIA** — Artrite Idiopática Juvenil
- **PNEUMO** — Neoplasias Pulmonares
- **REUMATO** — Artropatias Infecciosas

## Semana 41

- **DERMATO** — Histologia e Fisiologia da Pele e Lesões Elementares
- **GINECOLOGIA** — Câncer do Corpo do Útero
- **NEURO** — Traumatismo Cranioencefálico
- **OBSTETRÍCIA** — Vitalidade Fetal
- **PEDIATRIA** — Tópicos em Pediatria
- **PREVENTIVA** — Bases de Saúde do Trabalhador e Normas Regulamentadoras

## Semana 42

- **DERMATO** — Dermatoses Infecciosas
- **GASTRO** — Hemorragia Digestiva Alta Não Varicosa
- **GINECOLOGIA** — Doenças Benignas da Mama
- **HEMATO** — Anemias Associadas a Condições Não Hematológicas
- **INFECTOLOGIA** — Sífilis e Outras ISTs
- **PSIQUIATRIA** — Transtornos do Humor
- **REUMATO** — Vasculites

## Semana 43

- **DERMATO** — Hanseníase
- **GASTRO** — Introdução a Hepatologia
- **HEMATO** — Hemostasia I: Conceitos Básicos e Anticoagulantes
- **OBSTETRÍCIA** — Alteração do Volume de Líquido Amniótico
- **ORTOPEDIA** — Doenças da Coluna Vertebral
- **OTORRINO** — Infecções de Vias Aéreas Superiores - Parte I
- **PSIQUIATRIA** — Transtornos de Ansiedade
- **REUMATO** — Doenças Autoimunes do Tecido Conjuntivo - Parte 1

## Semana 44

- **DERMATO** — Oncologia Cutânea (Câncer de Pele)
- **GASTRO** — Hepatites Virais
- **GINECOLOGIA** — Rastreamento do Câncer de Mama
- **HEMATO** — Hemostasia II: Doenças Hemostáticas
- **NEFROLOGIA** — Túbulo-Interstício Renal
- **ORTOPEDIA** — Doenças do Ombro e Cotovelo
- **OTORRINO** — Infecções de Vias Aéreas Superiores - Parte II
- **PSIQUIATRIA** — Transtornos Psicóticos
- **REUMATO** — Doenças Autoimunes do Tecido Conjuntivo - Parte 2

## Semana 45

- **DERMATO** — Dermatoses Eczematosas
- **GINECOLOGIA** — Câncer de Mama
- **HEMATO** — Leucemias Agudas
- **NEURO** — Distúrbios do Sono
- **OBSTETRÍCIA** — Restrição de Crescimento Fetal e Óbito Fetal
- **OFTALMO** — Síndrome do Olho Vermelho
- **ORTOPEDIA** — Doenças da Mão e Síndromes Compressivas
- **OTORRINO** — Infecções de Vias Aéreas Superiores - Parte III
- **PSIQUIATRIA** — Intoxicações Exógenas
- **REUMATO** — Doenças do Osso e da Cartilagem

## Semana 46

- **DERMATO** — Farmacodermias
- **GASTRO** — Hemorragia Digestiva Baixa
- **GASTRO** — Cirrose Hepática
- **GINECOLOGIA** — Incontinência Urinária
- **HEMATO** — Leucemias Crônicas, Linfomas, Mielodisplasias
- **OFTALMO** — Córnea e Cristalino
- **ORTOPEDIA** — Oncologia Ortopédica e Osteomielite
- **OTORRINO** — Otoneurologia, Vertigens e Audiologia
- **PSIQUIATRIA** — Psiquiatria Infantil
- **REUMATO** — Síndromes Dolorosas Crônicas

## Semana 47

- **DERMATO** — Dermatoses Papuloescamosas
- **GASTRO** — Neoplasias de Estômago e Esôfago
- **GINECOLOGIA** — Prolapso de Órgãos Pélvicos
- **HEMATO** — Mieloma Múltiplo (Gamopatias Monoclonais)
- **OBSTETRÍCIA** — Infecções Congênitas na Gestação
- **ORTOPEDIA** — Quadril Pediátrico
- **ORTOPEDIA** — Ombro e Joelho Pediátrico
- **OTORRINO** — Cirurgia de Cabeça e Pescoço - Laringologia, Apneia
- **PSIQUIATRIA** — Transtornos Alimentares
- **REUMATO** — Reumatologia Pediátrica

## Semana 48

- **DERMATO** — Dermatoses Vesicobolhosas
- **GASTRO** — Polipose Intestinal e Câncer Colorretal
- **GASTRO** — Outras Causas de Hepatopatia Crônica
- **HEMATO** — Medicina Transfusional
- **OFTALMO** — Glaucoma
- **ORTOPEDIA** — Desenvolvimento Ortopédico da Criança
- **ORTOPEDIA** — Maus Tratos
- **OTORRINO** — Cirurgia de Cabeça e Pescoço - Nódulos Tireoide
- **PSIQUIATRIA** — Transtornos de Personalidade
- **REUMATO** — Miscelânea

## Semana 49

- **DERMATO** — Síndromes Verrucosas
- **GASTRO** — Hepatopatias Autoimunes
- **GASTRO** — Complicações da Cirrose Hepática
- **NEURO** — Doenças Desmielinizantes e Encefalites Autoimunes
- **OBSTETRÍCIA** — Aloimunização Materna e Doença Hemolítica Perinatal
- **ORTOPEDIA** — Conceitos Básicos do Trauma Ortopédico
- **ORTOPEDIA** — Fratura Exposta
- **OTORRINO** — Cirurgia de Cabeça e Pescoço - Neoplasias Benignas e Malignas
- **PSIQUIATRIA** — Psicofarmacologia
- **PSIQUIATRIA** — TOC, Transtornos Somáticos, Dissociativos e Estresse

## Semana 50

- **DERMATO** — Piodermites
- **DERMATO** — Miscelânea
- **GASTRO** — Síndrome Hepatorrenal e Síndrome Hepatopulmonar
- **GASTRO** — Tumores Hepáticos
- **OFTALMO** — Distúrbios da Refração
- **ORTOPEDIA** — Complicações do Trauma Ortopédico
- **ORTOPEDIA** — Fraturas e Luxações
- **ORTOPEDIA** — Politrauma Ortopédico
- **PSIQUIATRIA** — Psicopatologia
- **PSIQUIATRIA** — Psiquiatria Social e Reforma Psiquiátrica

```

### MEDREV_BLOCO_K_FSRS_LITE_V2_MENTOR_PREP.md

```txt
# MEDREV — BLOCO K: FSRS-lite v2, Relearning, Review History, True Retention e Preparação para Auditoria do Mentor

> **Executor:** Codex / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `high` para execução normal; `xhigh` se houver regressão no store, muitos testes quebrados ou conflito com o Modo Mentor.  
> **Modo:** agent com aprovação manual.  
> **Objetivo:** corrigir e evoluir o scheduler atual inspirado em FSRS sem trocar toda a arquitetura. Implementar hardening do FSRS-lite, histórico real de revisões, relearning, True Retention ponderada, workload por minutos e preparar dados confiáveis para uma auditoria posterior do Mentor.

---

## 0. Contexto técnico

O projeto usa React/CRA + Zustand + Tailwind + Firebase.

O scheduler atual é um **FSRS-lite**, não FSRS completo. Ele combina:

```txt
D0 → D1 → D4 → D7 → D21
+ manutenção pós-D21
+ estabilidade S
+ dificuldade D
+ rating derivado de acerto
+ fila inteligente por desempenho/prova/incidência
```

Comportamento atual observado:

```txt
acerto <55%   → again
55–74%        → hard
75–89%        → good
>=90%         → easy
```

Quando o aluno vai mal (`again`), o sistema atual tende a:

```txt
reabrir a mesma etapa
marcar done=false
agendar a mesma etapa para amanhã
```

Exemplo:

```txt
D7 ruim → D7 volta amanhã
D21 ruim → D21 volta amanhã
```

Ele **não volta para D0 automaticamente**, o que é bom. Porém falta uma política mais rica para falha grave, relearning e recalibração das datas seguintes.

---

## 1. Problemas que este bloco precisa resolver

### P0 — Alta prioridade

1. **Data real da revisão ausente ou inconsistente**
   - `date` representa data agendada.
   - Falta `reviewedAt` / `completedAt` consistente.
   - Retrievability, atraso, mentor e histórico ficam imprecisos.

2. **`acerto == null` não pode virar `good`**
   - Se o aluno marca algo sem acerto/rating, o scheduler não pode assumir bom desempenho.
   - Isso cria falso avanço.

3. **Manutenção salva intervalo potencialmente divergente**
   - Se `nextInt` foi calculado com `maxInterval`/dificuldade, o campo salvo deve refletir `nextInt`.
   - Não salvar `prevInterval * 2` se a data usou outro valor.

4. **True Retention precisa incluir D21 + manutenção**
   - Hoje a retenção longa fica estreita demais.
   - Deve incluir revisões longas e manutenções, ponderadas por número de questões quando disponível.

5. **Workload precisa ser por tempo estimado, não só contagem**
   - 5 revisões D1 não equivalem a 5 revisões D21.
   - O Mentor precisa saber minutos estimados e sobrecarga real.

### P1 — Prioridade alta/média

6. **Criar `reviewHistory`**
   - Guardar eventos de revisão sem sobrescrever evidência antiga.
   - Limitar histórico para evitar crescimento infinito.

7. **Criar estado formal de fase**
   - `learning`
   - `review`
   - `relearning`
   - `maintenance`

8. **Política de falha grave**
   - Falha leve: repetir mesma etapa.
   - Falha grave: voltar 1–2 etapas, mas não necessariamente D0.
   - Recalcular/empurrar etapas futuras para evitar calendário incoerente.

9. **Bônus pequeno de recuperação**
   - Se o aluno entra em relearning e recupera bem, estabilidade pode crescer um pouco mais.
   - Bônus pequeno, não explosivo.

10. **Corrigir bugs periféricos**
   - Exemplo: `fmtMonth` se estiver parseando `YYYY-MM-DD` errado.
   - Corrigir apenas bugs comprovados.

### P2 — Preparação para Mentor

11. Expor sinais confiáveis para o Mentor:
   - atraso real;
   - minutos estimados;
   - fase do tema;
   - status de relearning;
   - risco de sobrecarga;
   - retenção longa ponderada;
   - estabilidade/dificuldade antes/depois;
   - quantidade de revisões por fase.

---

## 2. Regras inegociáveis

Antes de editar:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Durante a edição:

- Não instalar bibliotecas.
- Não converter tudo para FSRS real agora.
- Não remover D0/D1/D4/D7/D21.
- Não quebrar dados antigos do Zustand/localStorage.
- Não apagar progresso do usuário.
- Não fazer commit/deploy/push.
- Não mascarar teste quebrado.
- Não mexer no Mentor profundamente neste bloco; apenas preparar dados e criar relatório para auditoria posterior.
- Manter UTF-8 sem BOM.
- Não introduzir mojibake.
- Não fazer refactor cosmético amplo.
- Corrigir apenas o necessário para o scheduler ficar confiável.

---

## 3. Arquivos prováveis

Audite e altere conforme arquitetura real:

```txt
src/core/fsrs.js                         [PATCH PRINCIPAL]
src/core/store.js                        [PATCH]
src/core/useMetrics.js                   [PATCH]
src/core/readiness.js                    [PATCH mínimo, se consumir retenção/workload]
src/core/mastery.js                      [PATCH mínimo, se consumir estado/datas]
src/core/mentorAutopilot.js              [PREPARAÇÃO mínima ou apenas adapters]
src/core/fsrs.test.js                    [CRIAR/PATCH]
src/core/scheduler.test.js               [CRIAR se fizer sentido]
src/core/mentorAuditReadiness.js         [NOVO, relatório de sinais para auditoria do Mentor]
src/core/mentorAuditReadiness.test.js    [NOVO]
```

Se algum arquivo não existir, procure equivalente. Não invente duplicata se já houver core equivalente.

---

## 4. FASE K0 — Auditoria inicial do scheduler

Antes de implementar, rode buscas:

```bash
grep -R "function .*fsrs\|buildRev\|recalcAfterMark\|toRating\|nextInterval\|calcTrueRetention\|getRetrievability\|manutencao\|D21\|d21" -n src/core src/components || true
grep -R "markStep\|registrar\|reviewHistory\|reviewedAt\|completedAt\|acerto\|questoes" -n src/core src/components || true
grep -R "getWorkloadProjection\|Carga\|workload\|mentorAutopilot" -n src || true
```

PowerShell equivalente:

```powershell
Select-String -Path "src\**\*" -Pattern "buildRev","recalcAfterMark","toRating","nextInterval","calcTrueRetention","getRetrievability","manutencao","markStep","reviewHistory","reviewedAt","getWorkloadProjection","mentorAutopilot" -CaseSensitive:$false
```

Documente internamente:

```txt
1. onde a revisão é criada;
2. onde o aluno marca revisão;
3. como o rating é derivado;
4. como S/D são atualizados;
5. como datas futuras são calculadas;
6. como manutenção funciona;
7. como True Retention é calculada;
8. como workload entra no Dashboard/Mentor.
```

Não responda ao usuário ainda. Implemente depois da auditoria.

---

## 5. FASE K1 — Datas reais: `reviewedAt`, `scheduledAt` e migração defensiva

### 5.1 Objetivo

Diferenciar:

```txt
scheduledAt/date = quando era para revisar
reviewedAt       = quando realmente revisou
```

### 5.2 Regras

- Não remover `date`, para compatibilidade.
- Adicionar `reviewedAt` quando etapa for marcada como feita.
- Adicionar `scheduledAt` se ainda não existir.
- Em dados antigos:
  - se `done === true` e não há `reviewedAt`, usar `date` como fallback.
  - não fazer migração destrutiva.

### 5.3 Implementação

Ao criar revisão em `buildRev`, cada step deve ter:

```js
{
  date: "...",
  scheduledAt: "...",
  reviewedAt: null,
  done: false,
  acerto: null,
  questoes: null,
  S,
  D,
  motivosErro: []
}
```

Ao marcar etapa concluída:

```js
step.reviewedAt = todayStr()
step.completedAt = todayStr() // opcional, se padrão do app já usa completedAt
```

Se estiver reagendando por `again`:

```js
step.done = false
step.reviewedAt = null
step.acerto = null
step.questoes = null
step.date = addDays(todayStr(), 1)
step.scheduledAt = step.date
```

No `reviewHistory`, o evento deve preservar o `reviewedAt` que acabou de ocorrer, mesmo se a etapa for reaberta.

---

## 6. FASE K2 — Rating seguro: `acerto == null` não vira `good`

### 6.1 Problema

Se `toRating(null)` retorna `good`, qualquer UI incompleta pode avançar o aluno indevidamente.

### 6.2 Regra nova

```js
toRating(null) → null
toRating(undefined) → null
```

Se determinada etapa não usa acerto numérico, ela deve fornecer rating explícito ou score qualitativo:

```txt
Não lembrei → again
Parcial → hard
Lembrei bem → good/easy
```

### 6.3 Implementação

Ajustar `toRating`:

```js
export function toRating(acerto) {
  if (acerto == null || Number.isNaN(Number(acerto))) return null;
  const pct = Number(acerto);
  if (pct < 55) return "again";
  if (pct < 75) return "hard";
  if (pct < 90) return "good";
  return "easy";
}
```

No `recalcAfterMark`:

- Se rating `null`, não recalcular S/D.
- Ou exigir `ratingManual`.
- Não avançar automaticamente.

Retorno recomendado:

```js
{
  ...rev,
  meta: {
    ...rev.meta,
    schedulerWarning: "missing_rating"
  }
}
```

Mas não quebrar UI. Se a UI precisa marcar uma etapa sem questões, solicitar rating manual.

---

## 7. FASE K3 — Review History real

### 7.1 Objetivo

Registrar cada evento de revisão.

Adicionar por tema:

```js
reviewHistory: [
  {
    id: "rev_...",
    stepKey: "d7",
    phaseBefore: "review",
    phaseAfter: "relearning",
    scheduledAt: "2026-06-01",
    reviewedAt: "2026-06-04",
    atrasoDias: 3,
    acerto: 42,
    questoes: 20,
    rating: "again",
    severity: "common" | "severe",
    S_before: 7,
    S_after: 3.1,
    D_before: 0.55,
    D_after: 0.70,
    intervalBefore: 7,
    intervalAfter: 1,
    source: "fsrs-lite",
  }
]
```

### 7.2 Regras

- Limitar a 100 eventos por tema.
- Não sobrescrever eventos antigos.
- Refazer/treino livre, se existir, pode entrar com `official: false`.
- Eventos oficiais entram com `official: true`.

### 7.3 Helpers

Criar no `fsrs.js` ou arquivo core apropriado:

```js
export function appendReviewHistory(temaOrRev, event, limit = 100) {}

export function getLastOfficialReview(history = []) {}

export function getLastReviewForStep(history = [], stepKey) {}
```

Se o histórico fica no tema e não no `rev`, adaptar ao shape real.

---

## 8. FASE K4 — Política de falha: same-step, downgrade e relearning

### 8.1 Objetivo

Substituir a regra simplista “again sempre repete a mesma etapa amanhã” por uma regra mais inteligente.

### 8.2 Severidade

Criar:

```js
export function getAgainSeverity(acerto) {
  if (acerto == null) return null;
  return Number(acerto) < 30 ? "severe" : "common";
}
```

### 8.3 Tabela desejada

| Etapa atual | Again comum | Again grave |
|---|---|---|
| D0 | repetir D0 amanhã | repetir D0 amanhã |
| D1 | repetir D1 amanhã | D0 ou D1 amanhã |
| D4 | repetir D4 amanhã | voltar para D1 amanhã |
| D7 | repetir D7 amanhã | voltar para D4 amanhã |
| D21 | repetir D21 em 2 dias | voltar para D7 amanhã |
| Manutenção | manutenção curta em 3–7 dias | voltar para D7 amanhã |

Regras:

- Não voltar para D0 sempre.
- D0 é aquisição inicial, não punição universal.
- Falha grave em D21/manutenção vira `relearning`.
- Falha comum repete etapa atual.

### 8.4 Função nova

```js
export function resolveAgainPolicy(stepKey, acerto, context = {}) {
  // retorna:
  // {
  //   targetStep: "d7",
  //   delayDays: 1,
  //   phaseAfter: "relearning",
  //   severity: "severe",
  //   shouldPushFuture: true
  // }
}
```

### 8.5 Relearning

Adicionar estado:

```js
phase: "learning" | "review" | "relearning" | "maintenance"
```

Função:

```js
export function inferPhaseFromStep(stepKey, manutencao = false) {
  if (manutencao) return "maintenance";
  if (["d0", "d1", "d4", "d7"].includes(stepKey)) return "learning";
  if (stepKey === "d21") return "review";
  return "learning";
}
```

Quando falha grave em D7/D21/manutenção:

```js
phase = "relearning"
relearning = {
  fromStep: stepKey,
  targetStep,
  startedAt: todayStr(),
  reason: "again_severe"
}
```

### 8.6 Empurrar datas futuras

Se o aluno voltou para uma etapa anterior, empurrar etapas futuras para não ficarem incoerentes.

Exemplo:

```txt
D7 grave → volta para D4 amanhã
D7 novo = D4 + 3 a 5 dias
D21 novo = D7 + 10 a 18 dias
```

Implementar helper conservador:

```js
export function pushFutureStepsAfterDowngrade(rev, targetStep, targetDate, options = {}) {}
```

Regras mínimas:

```js
D1 depois de D0: +1 dia
D4 depois de D1: +3 dias
D7 depois de D4: +3 dias
D21 depois de D7: +14 dias
```

Não alterar steps já concluídos, exceto se forem posteriores e logicamente inválidos? Preferência:

- Steps concluídos permanecem no histórico.
- Steps futuros `done:false` são empurrados.
- Se step posterior já estava `done:true`, não apagar; mas relearning deve criar uma nova trilha/estado. Se isso for complexo, não sobrescrever concluídos, apenas agendar target e manutenção/relearning.

---

## 9. FASE K5 — Estabilidade e bônus de recuperação

### 9.1 Regra atual

`again` reduz S, `easy` aumenta bastante.

### 9.2 Regra nova

Não aumentar agressivamente por recuperação.

Se o tema está em `relearning` e o aluno acerta bem:

```txt
rating = good → S_new *= 1.05
rating = easy → S_new *= 1.10 a 1.15
rating = hard → sem bônus
rating = again → continua relearning
```

Criar:

```js
export function applyRelearningRecoveryBonus(S, rating, context = {}) {
  if (!context?.wasRelearning) return S;
  if (rating === "easy") return S * 1.12;
  if (rating === "good") return S * 1.05;
  return S;
}
```

Aplicar após cálculo normal de S.

Limitar com clamp se já existir.

---

## 10. FASE K6 — Manutenção correta

### 10.1 Correção do intervalo

Quando calcular `nextInt`, salvar:

```js
interval: nextInt
```

Não salvar:

```js
interval: prevInterval * 2
```

a menos que `nextInt === prevInterval * 2`.

Se quiser preservar alvo teórico:

```js
targetInterval: prevInterval * 2
```

### 10.2 Falha em manutenção

Se manutenção `again`:

- comum:
  ```txt
  manutenção curta em 3–7 dias
  phase = maintenance
  ```
- grave:
  ```txt
  voltar para D7 amanhã
  phase = relearning
  ```

Não voltar para D0.

---

## 11. FASE K7 — True Retention ponderada

### 11.1 Objetivo

Incluir:

```txt
D21 + manutenções + revisões longas no reviewHistory
```

### 11.2 Regras

- Só incluir revisões com maturidade suficiente:
  - `stepKey === "d21"`, ou
  - `phase === "maintenance"`, ou
  - `intervalBefore >= 15`, ou
  - `scheduledAt/reviewedAt` com atraso desde última revisão >=15 dias.
- Ponderar por `questoes`, se existir.
- Se `questoes` ausente, peso = 1.
- Ignorar acerto ausente.
- Retornar `null` se não houver dados.

Função:

```js
export function calcTrueRetention(temasOrState, options = {}) {
  // retornar:
  // {
  //   value: 0.82,
  //   pct: 82,
  //   n: 12,
  //   totalQuestoes: 180,
  //   source: "d21+maintenance",
  //   collecting: false
  // }
}
```

Se a API atual espera só número, manter compatibilidade:

```js
export function calcTrueRetentionValue(...) {}
```

ou retornar shape antigo onde usado, adaptando UI.

### 11.3 Texto de UI

Quando sem dados:

```txt
Coletando D21+
```

Quando com dados:

```txt
Retenção longa 82%
```

Não chamar de True Retention se UI para usuário comum estiver em PT-BR.

---

## 12. FASE K8 — Workload por minutos

### 12.1 Custo estimado por etapa

Criar:

```js
export const STEP_ESTIMATED_MINUTES = {
  d0: 45,
  d1: 12,
  d4: 25,
  d7: 30,
  d21: 35,
  manutencao: 25,
  relearning: 20,
};
```

Ajuste se o projeto já usa outros tempos.

### 12.2 `getWorkloadProjection`

Retornar por dia:

```js
{
  date: "YYYY-MM-DD",
  count: 5,
  estimatedMinutes: 130,
  items: [...],
  overload: true,
  overloadLevel: "ok" | "moderate" | "high"
}
```

Critérios sugeridos:

```js
<=60 min ok
61–120 moderate
>120 high
```

Ou usar config do usuário, se existir.

### 12.3 Mentor

Não reescrever o Mentor neste bloco.

Apenas garantir que `mentorAutopilot` consegue consumir:

```js
workloadProjection[].estimatedMinutes
workloadProjection[].overloadLevel
```

Se necessário, criar adapter:

```js
export function getSchedulerSignalsForMentor(state, plat) {}
```

---

## 13. FASE K9 — Retrievability usando revisão real

### 13.1 Problema

Não usar só a data agendada.

### 13.2 Regra

`getRetrievability` deve usar:

```txt
última revisão oficial real
reviewedAt
```

Fallbacks:

1. `reviewHistory` último evento oficial.
2. `step.reviewedAt`.
3. `step.date` em dados antigos concluídos.
4. `tema.createdAt` ou hoje.

### 13.3 Função

```js
export function getLastReviewedAt(tema, stepKey) {}
```

Depois:

```js
elapsedDays = diffDays(todayStr(), lastReviewedAt)
R = Math.exp(-elapsedDays / S)
```

ou fórmula atual equivalente.

---

## 14. FASE K10 — Correções periféricas

Corrigir bugs pequenos comprovados:

### 14.1 `fmtMonth`

Se houver:

```js
const [, m, y] = d.split("-");
```

para data `YYYY-MM-DD`, corrigir:

```js
const [y, m] = d.split("-");
```

### 14.2 Imports não usados

Corrigir warnings óbvios gerados pelas mudanças.

### 14.3 BOM/mojibake

Rodar `npm run check:mojibake`.

---

## 15. FASE K11 — Preparar terreno para auditoria do Mentor

### 15.1 Não refatorar o Mentor ainda

Este bloco deve apenas criar os sinais e um relatório de saúde.

Criar:

```txt
src/core/mentorAuditReadiness.js
```

Funções:

```js
export function collectSchedulerSignalsForMentor(context = {}) {}

export function auditMentorInputCompleteness(context = {}) {}

export function buildMentorAuditSnapshot(context = {}) {}
```

### 15.2 `collectSchedulerSignalsForMentor`

Retornar:

```js
{
  trueRetention: {
    pct,
    n,
    totalQuestoes,
    collecting
  },
  workload: {
    todayMinutes,
    next7DaysMinutes,
    overloadDays,
    maxDayMinutes
  },
  overdue: {
    count,
    maxDelayDays,
    items
  },
  relearning: {
    count,
    items
  },
  stability: {
    medianS,
    lowStabilityCount
  },
  difficulty: {
    highDifficultyCount,
    areas
  },
  reviewHealth: {
    missingReviewedAtCount,
    missingRatingCount,
    historyEvents
  }
}
```

### 15.3 `auditMentorInputCompleteness`

Checar se o Mentor tem dados suficientes:

```js
{
  ok: true/false,
  missing: ["workload", "trueRetention", "calendarProvider"],
  warnings: ["trueRetention ainda coletando", "muitos temas sem reviewHistory"],
  recommendations: [...]
}
```

### 15.4 Objetivo

A próxima auditoria do Mentor deve conseguir responder:

```txt
O Mentor recomenda ações com base em dados reais?
Ele usa atraso real ou data agendada?
Ele considera workload em minutos?
Ele evita tema novo quando há sobrecarga?
Ele sabe quando o aluno está em relearning?
Ele não interpreta retenção coletando como preparo alto?
```

---

## 16. Testes obrigatórios

Criar ou atualizar testes.

### 16.1 `src/core/fsrs.test.js`

Cobrir:

1. `toRating(null)` retorna `null`.
2. D7 com `again` comum repete D7 amanhã.
3. D7 com `again` grave volta para D4 amanhã.
4. D21 com `again` grave entra em relearning.
5. Manutenção com `again` grave volta para D7/relearning.
6. Relearning com `easy` aplica bônus pequeno.
7. Manutenção salva `interval: nextInt`.
8. `reviewedAt` é salvo ao marcar revisão.
9. `reviewHistory` recebe evento.
10. Histórico é limitado.

### 16.2 True Retention

Testar:

1. retorna `null` sem D21/manutenção.
2. inclui D21.
3. inclui manutenção.
4. pondera por questões.
5. ignora acerto ausente.

### 16.3 Workload

Testar:

1. retorna count e estimatedMinutes.
2. D0 pesa mais que D1.
3. marca overload quando passa limite.
4. próximos 7/14 dias funcionam.

### 16.4 Mentor audit readiness

Criar:

```txt
src/core/mentorAuditReadiness.test.js
```

Cobrir:

1. detecta falta de reviewHistory.
2. detecta true retention coletando.
3. calcula overloadDays.
4. lista relearning count.
5. retorna recomendações de auditoria.

---

## 17. QA manual

Depois dos testes:

1. Criar tema novo.
2. Fazer D0 com acerto bom.
3. Confirmar D1/D4/D7/D21.
4. Fazer D7 com 40%.
   - Deve repetir D7 amanhã.
5. Fazer D7 com 20%.
   - Deve voltar para D4 amanhã ou entrar em relearning conforme política.
6. Confirmar que D21 futuro não fica incoerente.
7. Fazer D21 com 20%.
   - Deve entrar em relearning, não voltar D0.
8. Fazer manutenção com erro grave.
   - Deve voltar para D7/relearning.
9. Fazer recuperação com easy.
   - S cresce com bônus pequeno.
10. Ver True Retention coletando antes de D21.
11. Ver True Retention após D21/manutenção.
12. Ver Carga futura com minutos.
13. Confirmar Dashboard/Mentor não quebraram.
14. Confirmar Vestibular não quebrou.
15. Confirmar build.

---

## 18. Comandos finais

Ao fim:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
git status --short
```

Não executar:

```bash
git commit
firebase deploy
git push
```

sem autorização explícita.

---

## 19. Critérios de aceite

Bloco K aprovado se:

- `toRating(null)` não retorna `good`.
- Revisões concluídas têm `reviewedAt`.
- Dados antigos não quebram.
- `reviewHistory` existe e é preenchido.
- Falha comum repete etapa.
- Falha grave regride 1–2 etapas, não sempre D0.
- D21/manutenção grave entram em `relearning`.
- Datas futuras não ficam absurdamente incoerentes.
- Relearning tem bônus pequeno de recuperação.
- Manutenção salva `interval` real.
- True Retention inclui D21 + manutenção e pondera por questões.
- Workload retorna minutos estimados.
- Retrievability usa revisão real.
- Mentor recebe sinais preparados por `mentorAuditReadiness`.
- Testes passam.
- Build passa.
- Mojibake passa.

---

## 20. Nota final ao executor

Não tente transformar o scheduler em FSRS científico completo agora.

A meta é tornar o motor atual confiável:

```txt
datas reais
falha tratada corretamente
relearning sem punição excessiva
retenção longa honesta
workload realista
sinais bons para o Mentor
```

Depois desse bloco, a próxima etapa será auditar o Mentor para garantir que ele usa esses sinais corretamente.

```

### MEDREV_BLOCO_L_v2_MENTOR_POS_K.md

```txt
# MEDREV — BLOCO L v2: Mentor Decision Engine pós-FSRS-lite v2

> **Executor:** Codex / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `xhigh`  
> **Modo:** agent com aprovação manual.  
> **Objetivo:** refatorar o Mentor para usar dados reais do FSRS-lite v2, corrigindo antes as inconsistências detectadas no delta do Bloco K. O Mentor deve virar motor de decisão explicável, com sinais confiáveis de revisão, workload, relearning, retenção longa, calendário/provider, ENAMED, Vestibular, casos clínicos e Action Inbox.

---

## 0. Diagnóstico pós-Bloco K

O Bloco K avançou bastante:

- `getWorkloadProjection` agora retorna objeto por dia com `count`, `estimatedMinutes`, `items`, `overload` e `overloadLevel`.
- `toRating(null)` agora retorna `null`.
- `buildRev` e `normalizeTema` passaram a incluir `scheduledAt`, `reviewedAt`, `phase`, `reviewHistory` e `relearning`.
- `recalcAfterMark` ganhou política de `again`, `relearning`, `reviewHistory`, manutenção com `interval` real e bônus de recuperação.
- `calcTrueRetention` passou a usar histórico e ponderação por questões.
- Build e mojibake passaram no delta enviado.

Mas há correções obrigatórias antes de auditar/implementar o Mentor.

---

## 1. P0/P1 antes do Mentor

### 1.1 Bug: falha grave pode deixar a etapa original como `done: true`

No fluxo atual do delta:

```txt
D7 grave → targetStep D4
```

Mas `markStep` marca D7 como `done:true` antes de chamar `recalcAfterMark`. Em `recalcAfterMark`, quando a política manda voltar para D4, o código agenda D4, mas não garante que D7 volte para `done:false`.

Risco:

```txt
O aluno falha D7, entra em relearning, mas D7 continua registrado como concluído.
```

Isso quebra:

- fila;
- retrievability;
- Mentor;
- readiness;
- true retention futura;
- coerência do cronograma.

#### Correção obrigatória

Em qualquer `rating === "again"`:

1. Registrar o evento no `reviewHistory`.
2. Limpar o estado operacional da etapa original falhada:
   ```js
   nextRev[doneKey] = {
     ...nextRev[doneKey],
     done: false,
     reviewedAt: null,
     completedAt: null,
     acerto: null,
     questoes: null,
     lastFailedAt: now,
     lastFailedAcerto: normalizeAcerto(acerto),
     lastFailedRating: "again",
   };
   ```
3. Se `policy.targetStep !== doneKey`, limpar/reabrir também as etapas futuras dependentes, pelo menos:
   ```txt
   targetStep, steps depois do targetStep até d21, manutenção se existir e estiver futura
   ```
4. Preservar resultado antigo apenas no `reviewHistory`.

Regra de produto:

```txt
Histórico guarda o que aconteceu.
Estado operacional mostra o que falta fazer.
```

---

### 1.2 Bug: `rating == null` ainda pode deixar step `done:true`

No delta, `toRating(null)` retorna `null`, mas `store.markStep` já marcou a etapa como `done:true` antes de `recalcAfterMark`.

Quando `recalcAfterMark` detecta `rating == null`, ele retorna `rev` com `schedulerWarning`, mas não desfaz o `done:true`.

Risco:

```txt
Etapa sem acerto/rating pode sumir da fila sem atualização S/D.
```

#### Correção obrigatória

Escolher uma das duas abordagens:

##### Opção A — bloquear no store

Em `markStep`, antes de marcar `done:true`:

```js
if (acerto == null && ratingManual == null) {
  // não marca a etapa como feita
  // registra warning/toast se houver mecanismo
  return state;
}
```

##### Opção B — reverter em `recalcAfterMark`

Se `rating == null`:

```js
return {
  ...rev,
  [doneKey]: {
    ...rev[doneKey],
    done: false,
    reviewedAt: null,
    completedAt: null,
    acerto: null,
    questoes: null,
  },
  meta: {
    ...(rev.meta || {}),
    schedulerWarning: "missing_rating",
  },
};
```

Recomendação: **Opção B + teste**, porque protege qualquer chamada futura.

---

### 1.3 True Retention deve ignorar eventos `official:false`

O cálculo novo de retenção longa percorre `reviewHistory`, mas precisa ignorar explicitamente tentativas não oficiais:

```js
if (event.official === false) continue;
```

Risco:

```txt
Refazer caso/revisão livre ou treino não oficial pode inflar ou derrubar a retenção longa.
```

Corrigir em `calcTrueRetentionDetailed`.

---

### 1.4 `mentorAuditReadiness.js` está untracked e não foi incluído no diff completo

No audit enviado, aparecem:

```txt
?? src/core/mentorAuditReadiness.js
?? src/core/mentorAuditReadiness.test.js
```

Mas o `git diff` padrão não inclui conteúdo de arquivos untracked. Então ainda não dá para auditar a implementação desses arquivos.

#### Correção do script de auditoria

Atualizar `scripts/audit.mjs` para também incluir untracked relevantes:

```js
run("Untracked files", "git ls-files --others --exclude-standard");

appendFileSync(out, "\n## Untracked file contents\n\n", "utf8");
const untracked = execSync("git ls-files --others --exclude-standard", { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((f) => f.startsWith("src/") || f.startsWith("scripts/") || f.endsWith(".md"));

for (const file of untracked) {
  appendFileSync(out, `\n### ${file}\n\n\`\`\`txt\n`, "utf8");
  appendFileSync(out, readFileSync(file, "utf8"), "utf8");
  appendFileSync(out, "\n```\n", "utf8");
}
```

---

## 2. Bloco L agora deve consumir o FSRS-lite v2

O Mentor não deve mais raciocinar em cima de contagens simples.

### 2.1 Workload mudou de shape

Antes:

```js
projection[date] = 3;
```

Agora:

```js
projection[date] = {
  date,
  count,
  estimatedMinutes,
  items,
  overload,
  overloadLevel,
};
```

Qualquer código do Mentor que faça:

```js
Object.values(proj).reduce((a, b) => a + b, 0)
```

está errado.

Deve fazer:

```js
Object.values(proj).reduce((sum, day) => sum + (day?.estimatedMinutes || 0), 0)
```

ou para contagem:

```js
Object.values(proj).reduce((sum, day) => sum + (day?.count || 0), 0)
```

### 2.2 Mentor deve ler sinais do scheduler

Criar/ajustar `src/core/mentorSignals.js` para retornar:

```js
{
  scheduler: {
    workloadProjection,
    todayCount,
    todayMinutes,
    next7DaysMinutes,
    overloadLevelToday,
    overloadDays,
    maxDayMinutes,

    overdueCount,
    dueTodayCount,
    maxDelayDays,
    nextDueItem,

    relearningCount,
    relearningItems,

    missingRatingWarnings,
    missingReviewedAtCount,
    reviewHistoryEvents,

    trueRetentionPct,
    trueRetentionN,
    trueRetentionTotalQuestoes,
    trueRetentionCollecting,
  }
}
```

### 2.3 Mentor deve distinguir “coletando” de dado confiável

Se `trueRetentionCollecting === true`, o Mentor não pode interpretar como preparo alto ou baixo. Ele deve dizer:

```txt
Retenção longa ainda coletando; vou priorizar revisões vencidas, carga e desempenho recente.
```

---

## 3. Política de decisão do Mentor pós-K

A ordem de prioridade deve ser:

```txt
P0 — dados inválidos / scheduler warning crítico
P1 — sobrecarga alta
P2 — relearning
P3 — revisões vencidas
P4 — revisão de hoje
P5 — prova/simulado pendente de análise
P6 — gargalo ENAMED ou matéria fraca
P7 — caso clínico devido
P8 — tema novo se carga permite
P9 — Anki/check rápido
P10 — descanso/bloco leve
```

### 3.1 Bloqueio de tema novo

Nunca recomendar tema novo se:

```js
scheduler.overloadLevelToday === "high"
scheduler.overloadDays >= 2
scheduler.relearningCount > 0
scheduler.overdueCount > 0
scheduler.todayMinutes > userAvailableMinutes * 1.2
```

Fallback se não houver `userAvailableMinutes`:

```txt
>120 minutos hoje = alta carga
```

### 3.2 Relearning ganha de tema novo

Se há `relearningItems`:

```txt
Ação principal: recuperar tema instável
Motivo: queda significativa recente; recuperar agora custa menos do que abrir tema novo.
```

### 3.3 Revisões vencidas ganham de ENAMED

Se há revisão vencida, o Mentor não deve pular direto para hot topic ENAMED.

```txt
Preservar retenção primeiro; depois gargalo ENAMED.
```

### 3.4 Caso clínico só para Residência

Se `plat === "vest"`:

- não sugerir caso clínico;
- não sugerir illness script;
- não sugerir ENAMED como ação principal.

### 3.5 Vestibular

Para `plat === "vest"`, usar:

```txt
revisão vencida
matéria fraca em simulado
tema novo do cronograma
carga futura
proximidade da prova
descanso
```

---

## 4. Arquitetura-alvo do Mentor

Criar/ajustar:

```txt
src/core/mentorSignals.js
src/core/mentorDecisionPolicy.js
src/core/mentorAutopilot.js
src/core/mentorSignals.test.js
src/core/mentorDecisionPolicy.test.js
src/core/mentorAutopilot.test.js
```

Manter:

```txt
src/core/mentor.js
```

Mas `mentor.js` deve virar camada legada/narrativa:

```txt
frases
voz
diagnóstico textual
compatibilidade com Dashboard antigo
```

Não deve ser o motor principal de próxima ação.

---

## 5. Schema único de ação

Toda ação do Mentor deve ter:

```js
{
  id,
  type,
  priority,
  title,
  subtitle,
  reason,
  explain: [],
  cta,
  ctaView,
  estimatedMinutes,
  confidence,
  safety,
  source,
  target,
}
```

Exemplo:

```js
{
  type: "relearning",
  priority: 96,
  title: "Recuperar Apendicite Aguda",
  reason: "Tema entrou em reaprendizado após queda em D7.",
  explain: [
    "Você teve queda significativa em uma revisão longa.",
    "Abrir tema novo agora aumentaria a carga futura.",
    "Recuperar em 24–48h tende a custar menos tempo."
  ],
  cta: "Recuperar agora",
  ctaView: "focus",
  estimatedMinutes: 20,
  safety: "caution",
  target: {
    temaId,
    stepKey: "d4",
    phase: "relearning"
  }
}
```

---

## 6. Ajustes obrigatórios no Bloco L original

Substituir o início do Bloco L anterior por estas pré-fases:

### L0 — Validar pós-K

Antes de qualquer Mentor:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Depois rodar testes específicos:

```bash
npm test -- --watchAll=false --testPathPattern=fsrs
npm test -- --watchAll=false --testPathPattern=useMetrics
npm test -- --watchAll=false --testPathPattern=mentorAuditReadiness
```

Se `testPathPattern` não funcionar no CRA, usar o teste completo.

### L0.1 — Corrigir bug de etapa falhada ainda concluída

Adicionar testes:

```js
test("D7 severe again clears D7 operational done state", () => {
  const updated = recalcAfterMark(markedD7, "d7", 0.2);
  expect(updated.d7.done).toBe(false);
  expect(updated.d4.done).toBe(false);
  expect(updated.phase).toBe("relearning");
});

test("D21 severe again clears D21 operational done state", () => {
  const updated = recalcAfterMark(markedD21, "d21", 0.2);
  expect(updated.d21.done).toBe(false);
  expect(updated.d7.done).toBe(false);
});
```

### L0.2 — Corrigir rating ausente

Adicionar teste:

```js
test("missing rating does not leave step completed", () => {
  const updated = recalcAfterMark(markedD1WithoutAcerto, "d1", null);
  expect(updated.d1.done).toBe(false);
  expect(updated.meta.schedulerWarning).toBe("missing_rating");
});
```

### L0.3 — True Retention ignora treino livre

Adicionar teste:

```js
test("true retention ignores unofficial review events", () => {
  const temas = [{
    rev: {
      reviewHistory: [
        { stepKey: "d21", acerto: 1, questoes: 100, official: false },
      ],
    },
  }];
  expect(calcTrueRetention(temas)).toBeNull();
});
```

---

## 7. Dashboard depois do Mentor

O Dashboard deve usar:

```js
buildMentorContext(state, plat)
getMentorNextAction(context)
getMentorTodayPlan(context)
```

A ação principal deve ser a fonte do “Comando do Dia”.

Não chamar diretamente `proximaAcao` como motor principal, exceto como wrapper legado.

---

## 8. Testes mínimos do Mentor v2

Criar/atualizar:

```txt
src/core/mentorSignals.test.js
src/core/mentorAutopilot.test.js
src/core/mentorDecisionPolicy.test.js
```

Cobrir:

1. sobrecarga alta bloqueia tema novo;
2. relearning ganha de tema novo;
3. revisão vencida ganha de ENAMED;
4. true retention coletando não vira preparo alto;
5. ação sempre tem `target`;
6. ação sempre tem `explain`;
7. `plat === "vest"` não gera ação ENAMED;
8. `plat === "vest"` não gera caso clínico;
9. provider ativo influencia tema novo;
10. ação de prova pendente aparece quando fila está segura.

---

## 9. Critérios de aceite v2

Este Bloco L v2 só está aprovado se:

- bugs pós-K foram corrigidos;
- etapa falhada não permanece `done:true`;
- rating ausente não conclui etapa;
- true retention ignora eventos não oficiais;
- Mentor lê workload por minutos;
- Mentor lê relearning;
- Mentor lê true retention com estado `collecting`;
- Mentor bloqueia tema novo em sobrecarga;
- Mentor separa Residência e Vestibular;
- Dashboard usa autopilot real;
- `mentor.js` não é mais o motor principal da próxima ação;
- testes passam;
- build passa;
- mojibake passa.

---

## 10. Comando para o executor

Execute esta versão depois do Bloco K:

```txt
Corrija primeiro as inconsistências pós-K listadas neste Bloco L v2. Depois refatore o Mentor para consumir os sinais novos. Pare ao primeiro erro de teste/build causado por alteração recente e corrija antes de avançar. Não faça commit, deploy ou push.
```

```

### MEDREV_BLOCO_M_REORGANIZADO_EM_SUBBLOCOS.md

```txt
# MEDREV — BLOCO M REORGANIZADO: Auditoria Geral dividida em sub-blocos executáveis

> **Executor:** Codex / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Estratégia:** não executar o M inteiro. Executar **M0 → M1 → M2 → M3 → M4 → M5**, um por vez.  
> **Pré-condição crítica:** executar o **Bloco N — Multiusuário/Auth/Isolamento de dados** antes de qualquer sub-bloco que registre histórico, activity log, backup ou dados persistentes novos.

---

## 0. Por que o Bloco M original ficou grande demais

O M original junta cinco mudanças de produto diferentes:

```txt
1. arquitetura de informação / sidebar;
2. governança de métricas;
3. centro de erros e ações corretivas;
4. raciocínio clínico v2 dentro do FSRS;
5. calendário histórico/activity log;
6. reorganização de Stats/Mentor.
```

Isso é grande demais para um único patch seguro.

Riscos se executar tudo junto:

```txt
- Codex alucinar arquivos/funções;
- quebrar navegação;
- criar UI sem core;
- criar core sem UI;
- misturar activity log com store ainda sem isolamento por uid;
- poluir Dashboard;
- quebrar Vestibular;
- aumentar muito o bundle;
- gerar dívida nova.
```

Portanto, o Bloco M deve virar uma **série de sub-blocos**, cada um com objetivo claro, testes e critério de aceite.

---

# Ordem correta

## P0 antes de tudo

Executar primeiro:

```txt
Bloco N — Multiusuário/Auth/Isolamento de dados
```

Motivo: Activity log, histórico, backup, calendário e ações corretivas são dados privados. Não faz sentido construir isso se ainda há risco de dados de usuários diferentes se misturarem.

Depois:

```txt
Bloco K — FSRS-lite v2
Bloco L v2 — Mentor Decision Engine pós-FSRS
```

Depois executar M dividido:

```txt
M0 — Auditoria geral sem implementação pesada
M1 — Navegação + arquitetura de informação
M2 — Métricas + Centro de Erros
M3 — Raciocínio Clínico v2 + FSRS multimodal
M4 — Activity Log + Calendário histórico/futuro
M5 — Stats/Mentor unificados + polish final
```

---

# M0 — Auditoria Geral de Integração

## Objetivo

Auditar o produto atual sem sair implementando.

Descobrir:

```txt
- quais features existem;
- quais aparecem na sidebar;
- quais têm core mas não UI;
- quais têm UI mas não persistem;
- quais alimentam o Mentor;
- quais alimentam Stats;
- quais registram eventos;
- onde há duplicidade;
- onde Vestibular está vazando feature médica;
- onde métricas confundem;
- onde Raciocínio Clínico está desconectado.
```

## Arquivos esperados

Não criar feature grande.

Pode criar apenas:

```txt
docs/MEDREV_AUDITORIA_GERAL_M0.md
```

## Comandos de auditoria

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build

grep -R "setView\|view ===\|Sidebar\|BottomNav" -n src || true
grep -R "Raciocinio\|Raciocínio\|illness\|sct\|casosProgresso" -n src || true
grep -R "mentor\|Mentor\|ActionInbox\|proximaAcao" -n src || true
grep -R "metric\|Preparo\|Retenção\|readiness\|coletando" -n src || true
grep -R "erro\|motivoErro\|tipoErro\|errorTaxonomy" -n src || true
grep -R "activityLog\|reviewHistory\|weeklyReviews\|sessionReflection" -n src || true
```

## Entrega

Gerar relatório:

```txt
docs/MEDREV_AUDITORIA_GERAL_M0.md
```

Com tabela:

```txt
Feature | Local UI | Core | Store | Mentor usa? | Stats usa? | Evento registrado? | Problema | Prioridade
```

## Critério de aceite

- Nenhuma feature alterada.
- Relatório claro.
- Lista de P0/P1/P2.
- Próximos sub-blocos priorizados.

---

# M1 — Navegação e arquitetura de informação

## Objetivo

Reduzir a confusão da sidebar sem remover funções.

## Regra de produto

O usuário comum deve ver poucos caminhos:

```txt
Hoje
Plano
Estudar
Estatísticas
Banco de Dados
Mais
```

Dentro de `Mais`:

```txt
Raciocínio Clínico
Simulados / ENAMED
Anki Audit
Weekly Review
Data Safety
Guia
Ajustes
```

## Criar

```txt
src/core/navigationModel.js
src/core/navigationModel.test.js
```

## Schema

```js
{
  id: "today",
  label: "Hoje",
  view: "dash",
  icon: "LayoutDashboard",
  primary: true,
  platforms: ["res", "vest"],
}

{
  id: "clinical-reasoning",
  label: "Raciocínio Clínico",
  view: "raciocinio",
  primary: false,
  group: "more",
  platforms: ["res"],
}
```

## Funções

```js
getPrimaryNavItems(plat, features)
getMoreNavItems(plat, features)
resolveViewLabel(view, plat)
```

## Patch provável

```txt
src/components/Sidebar.jsx
src/components/BottomNav.jsx
src/App.js
src/core/platformFeatures.js
```

## Regras

- Não remover feature.
- Apenas reorganizar.
- Vestibular não deve ver Raciocínio Clínico/ENAMED como item principal.
- Mobile deve ter no máximo 4–5 itens.

## Testes

```txt
res tem Raciocínio em Mais;
vest não tem Raciocínio;
itens principais <= 5;
view antiga continua resolvendo.
```

## Critério de aceite

- Sidebar menos poluída.
- Todas as features continuam acessíveis.
- Mobile fica mais limpo.
- Build/testes passam.

---

# M2 — Métricas e Centro de Erros

## Objetivo

Transformar métricas e erros em orientação concreta.

## Parte A — Métricas

Criar:

```txt
src/core/metricsRegistry.js
src/core/metricsRegistry.test.js
```

Schema:

```js
{
  id: "trueRetention",
  label: "Retenção longa",
  shortLabel: "Retenção",
  owner: "fsrs",
  description: "Estimativa baseada em revisões D21+ e manutenção.",
  confidenceRule: "requires_long_reviews",
  emptyState: "Coletando D21+",
  actionWhenLow: "Priorizar revisões longas e reduzir tema novo.",
  dashboardLevel: "compact",
  platforms: ["res", "vest"],
}
```

Regras:

```txt
- Dashboard só mostra métrica que leva a ação.
- Stats explica as métricas.
- Sem dados = coletando, não 100%.
- Baixo n = baixa confiança.
```

## Parte B — Centro de Erros

Criar:

```txt
src/core/errorActionMap.js
src/core/errorActionMap.test.js
src/components/ErrorActionCenter.jsx
```

Tipos mínimos:

```txt
conteudo
memoria
raciocinio
representacao_problema
diferencial
incerteza_sct
conduta_prescricao
interpretacao
distracao
tempo
confianca_mal_calibrada
estrategia_prova
```

Exemplo de ação corretiva:

```js
{
  type: "raciocinio",
  label: "Raciocínio",
  definition: "Você tinha dados, mas não organizou hipóteses ou fechou cedo.",
  correctiveActions: [
    "Fazer caso clínico guiado.",
    "Escrever problem representation.",
    "Listar 3 diferenciais e 1 não-pode-perder.",
    "Fazer SCT curto."
  ],
  preferredTask: "clinical_case",
}
```

## Patch provável

```txt
src/components/StatsPanel.jsx
src/components/EnamedProvaAnalyzer.jsx
src/components/SessionClosureModal.jsx
src/core/provaAnalyzer.js
src/core/errorTaxonomy.js
src/core/mentorAutopilot.js
```

## Regras

- Não criar nova aba principal se a sidebar já estiver cheia.
- Colocar em Estatísticas ou Mais.
- Vestibular usa subset sem “conduta/prescrição”.

## Critério de aceite

- Usuário entende tipos de erro.
- Cada erro tem ação corretiva.
- Mentor consegue usar `preferredTask`.
- Stats mostra erro dominante com recomendação.

---

# M3 — Raciocínio Clínico v2 + FSRS multimodal

## Objetivo

Tirar Raciocínio Clínico do isolamento e integrá-lo ao ciclo de revisão.

## Tese

Raciocínio Clínico deve ter dois modos:

```txt
1. Caso completo
2. Revisão curta dentro do FSRS
```

## Modo A — Caso completo

Fluxo:

```txt
1. Vinheta
2. Problem representation
3. Hipóteses + must-not-miss
4. Illness script de memória
5. SCT / nova informação
6. Conduta e prescrição simulada
7. Diagnóstico final + feedback + reencontro
```

## Modo B — Revisão FSRS multimodal

Para temas clínicos:

```txt
D1: Brain dump estruturado
D4: Illness Script recall
D7: Mini caso + diferenciais
D21: SCT curto + conduta
Manutenção: caso rápido ou prescrição simulada
```

## Criar

```txt
src/core/reviewTaskPlanner.js
src/core/reviewTaskPlanner.test.js
src/core/clinicalReasoningScoring.js
src/core/clinicalReasoningScoring.test.js
```

## Função principal

```js
getReviewTaskForStep({ tema, stepKey, history, errors, platform })
```

Retorna:

```js
{
  taskType: "questions" | "brain_dump" | "illness_script" | "mini_case" | "sct" | "management_station" | "anki",
  title,
  instructions,
  estimatedMinutes,
  requiredInputs,
  scoring,
}
```

## Brain dump estruturado para temas grandes

Campos:

```txt
1. Definição/quadro geral
2. Diagnóstico
3. Diferenciais/armadilhas
4. Conduta
5. Não pode perder
```

## Conduta e prescrição simulada

Campos:

```txt
1. Primeira medida / estabilização
2. Exames iniciais
3. Tratamento inicial
4. Medicações/classes/doses se houver checklist
5. Interna ou ambulatorial?
6. Red flags / contraindicações
7. Seguimento
```

Aviso obrigatório:

```txt
Uso educacional. Não usar para paciente real.
```

## Regras

- Não aplicar illness script a todo tema.
- Aplicar a temas clínicos/síndromes/emergências/casos seed.
- Preventiva conceitual, bioestatística, história do SUS: usar questions/brain dump, não illness script.

## Patch provável

```txt
src/components/RaciocinioClinico.jsx
src/components/FocusMode.jsx
src/core/fsrs.js
src/core/store.js
src/core/casosClinicos.js ou constants/casosClinicos.js
src/core/mentorAutopilot.js
```

## Critério de aceite

- Raciocínio Clínico vira tarefa de revisão quando adequado.
- Conduta/prescrição é cobrada educacionalmente.
- Brain dump é estruturado para temas grandes.
- Erro clínico gera ação corretiva.
- Mentor pode recomendar “mini caso”, “illness script” ou “management station”.

---

# M4 — Activity Log + Calendário histórico/futuro

## Pré-condição obrigatória

Executar **Bloco N** antes.

## Objetivo

Criar um histórico rastreável do que foi feito e do que está por vir.

## Criar

```txt
src/core/activityLog.js
src/core/activityLog.test.js
src/components/ActivityCalendar.jsx
src/components/ActivityDayDrawer.jsx
src/components/ActivityDetailModal.jsx
```

## Schema

```js
{
  id: "actevt_...",
  platform: "res" | "vest",
  type: "fsrs_review" | "focus_session" | "clinical_case" | "exam_analysis" | "anki" | "simulado" | "calendar_import" | "weekly_review" | "mentor_action" | "domain_validation",
  status: "scheduled" | "completed" | "skipped" | "failed" | "rescheduled",
  title: "D7 — Apendicite Aguda",
  startAt: "2026-06-01T08:30:00",
  endAt: "2026-06-01T09:05:00",
  date: "2026-06-01",
  source: "focus_mode",
  target: {
    temaId,
    stepKey,
    casoId,
    provaId,
    actionId
  },
  summary: {
    acerto,
    questoes,
    rating,
    estimatedMinutes,
    actualMinutes,
    errors,
    score
  },
  snapshot: {
    brainDump,
    problemRep,
    hypotheses,
    managementPlan,
    sctAnswers,
    feedback
  },
  createdAt,
  updatedAt
}
```

## Retenção

```js
MAX_ACTIVITY_EVENTS = 5000
MAX_SNAPSHOT_CHARS = 4000
MAX_RICH_DETAIL_DAYS = 30
MAX_HISTORY_MONTHS = 12
```

## Eventos a registrar

```txt
markStep
domínio prévio
caso clínico
Modo Foco
prova/simulado
Anki
importação de calendário
ação do Mentor
Weekly Review
```

## UI

```txt
Calendário
[Hoje] [Semana] [Mês]

Dia expandido:
08:00 — D1 Apendicite
09:10 — Caso Pré-eclâmpsia
14:30 — Simulado ENAMED
```

Clique mostra:

```txt
tipo
tema
etapa
horário
duração
questões/acertos
brain dump
hipóteses
conduta/prescrição
erros
próxima revisão
```

## Critério de aceite

- Mostra passado do último mês com detalhe.
- Mostra histórico até 12 meses resumido.
- Mostra tarefas futuras.
- Clicar abre detalhe.
- Não explode localStorage.
- É user-scoped pelo Bloco N.

---

# M5 — Stats/Mentor unificados + polish final

## Objetivo

Conectar tudo ao Mentor e reorganizar Estatísticas.

## Stats reorganizadas

Tabs/seções:

```txt
Resumo
Aprendizagem
Erros
Raciocínio Clínico
Provas/Simulados
Atividade
Sistema
```

## Mentor deve usar

```txt
activityLog
errorActionMap
reviewTaskPlanner
metricsRegistry
FSRS-lite v2
calendar provider
clinical reasoning
prova/simulado
platformFeatures
```

Exemplos de ação nova:

```txt
"Fazer D7 de Apendicite como mini caso"
"Recuperar SCA com Illness Script de memória"
"Revisar erro de conduta em pré-eclâmpsia"
"Hoje não abra tema novo; sua carga estimada já passou de 120 min"
```

## Regras

- Não criar mais cards no topo do Dashboard.
- Dashboard mostra ação principal e 2 próximas.
- Stats guarda diagnóstico profundo.
- Mentor explica porquê.

## Critério de aceite

- Mentor usa erros e activity log.
- Stats fica organizado por domínio.
- Dashboard fica limpo.
- Vestibular preservado.
- Build/testes passam.

---

# Como executar

## Comando para M0

```txt
Execute somente o M0 do MEDREV_BLOCO_M_REORGANIZADO.md. Não implemente features. Audite e gere docs/MEDREV_AUDITORIA_GERAL_M0.md. Rode check:mojibake, testes e build. Não faça commit, deploy ou push.
```

## Comando para M1

```txt
Execute somente o M1. Reorganize a navegação com navigationModel, sem remover features. Rode check:mojibake, testes e build. Não faça commit, deploy ou push.
```

## Comando para M2

```txt
Execute somente o M2. Crie metricsRegistry e ErrorActionCenter/errorActionMap. Integre sem poluir Dashboard. Rode check:mojibake, testes e build.
```

## Comando para M3

```txt
Execute somente o M3. Implemente reviewTaskPlanner e Raciocínio Clínico v2 integrado ao FSRS. Inclua conduta/prescrição simulada educacional. Rode check:mojibake, testes e build.
```

## Comando para M4

```txt
Execute somente o M4, mas apenas depois do Bloco N. Crie activityLog e calendário histórico/futuro user-scoped. Rode check:mojibake, testes e build.
```

## Comando para M5

```txt
Execute somente o M5. Reorganize Stats e conecte Mentor aos sinais criados. Rode check:mojibake, testes e build.
```

---

# Modelo recomendado

Para M0:

```txt
gpt-5.3-codex
effort: xhigh
```

Para M1–M5:

```txt
gpt-5.3-codex
effort: high
```

Use `xhigh` se mexer simultaneamente em Dashboard + Store + Mentor + Activity Log.

---

# Nota final

O M original era uma visão correta, mas grande demais.

A versão dividida evita o erro clássico:

```txt
mais features soltas
mais confusão
mais dívida técnica
```

A regra agora é:

```txt
cada sub-bloco deve registrar evento, corrigir erro, alimentar métrica e ser usado pelo Mentor.
```

```

### audit/ASK_CHATGPT.md

```txt
# ASK_CHATGPT — Auditoria automática

Aja como auditor sênior de engenharia de software. Audite somente o delta abaixo. Procure regressões, bugs, integração incompleta, problemas de arquitetura, encoding, testes, build, UX e riscos de dados persistidos. Priorize P0/P1/P2 e diga exatamente o que corrigir.


## Git status

```txt
 M package.json
 M src/App.js
 M src/components/Dashboard.jsx
 M src/components/Modals.jsx
 M src/components/StatsPanel.jsx
 M src/components/WeeklyReview.jsx
 M src/core/domainValidation.js
 M src/core/fsrs.js
 M src/core/fsrs.test.js
 M src/core/mentorAutopilot.js
 M src/core/mentorAutopilot.test.js
 M src/core/store.js
 M src/hooks/useMetrics.js
 M src/hooks/useMetrics.test.js
?? Cronograma_Estrategia_Extensivo_Completo.md
?? MEDREV_BLOCO_K_FSRS_LITE_V2_MENTOR_PREP.md
?? MEDREV_BLOCO_L_v2_MENTOR_POS_K.md
?? MEDREV_BLOCO_M_REORGANIZADO_EM_SUBBLOCOS.md
?? audit/
?? scripts/audit.mjs
?? src/core/mentorAuditReadiness.js
?? src/core/mentorAuditReadiness.test.js
?? src/core/mentorDecisionPolicy.js
?? src/core/mentorDecisionPolicy.test.js
?? src/core/mentorSignals.js
?? src/core/mentorSignals.test.js

```

## Diff stat

```txt
 package.json                     |   1 +
 src/App.js                       |   2 +-
 src/components/Dashboard.jsx     | 150 ++++++-----
 src/components/Modals.jsx        |   5 +-
 src/components/StatsPanel.jsx    |  13 +-
 src/components/WeeklyReview.jsx  |   8 +-
 src/core/domainValidation.js     |  17 +-
 src/core/fsrs.js                 | 549 +++++++++++++++++++++++++++++++++++----
 src/core/fsrs.test.js            | 189 +++++++++++++-
 src/core/mentorAutopilot.js      | 194 +++-----------
 src/core/mentorAutopilot.test.js |  42 ++-
 src/core/store.js                |  79 +++---
 src/hooks/useMetrics.js          |  83 +++++-
 src/hooks/useMetrics.test.js     |  51 +++-
 14 files changed, 1011 insertions(+), 372 deletions(-)

```

## Changed files

```txt
package.json
src/App.js
src/components/Dashboard.jsx
src/components/Modals.jsx
src/components/StatsPanel.jsx
src/components/WeeklyReview.jsx
src/core/domainValidation.js
src/core/fsrs.js
src/core/fsrs.test.js
src/core/mentorAutopilot.js
src/core/mentorAutopilot.test.js
src/core/store.js
src/hooks/useMetrics.js
src/hooks/useMetrics.test.js

```

## Untracked files

```txt
Cronograma_Estrategia_Extensivo_Completo.md
MEDREV_BLOCO_K_FSRS_LITE_V2_MENTOR_PREP.md
MEDREV_BLOCO_L_v2_MENTOR_POS_K.md
MEDREV_BLOCO_M_REORGANIZADO_EM_SUBBLOCOS.md
audit/ASK_CHATGPT.md
scripts/audit.mjs
src/core/mentorAuditReadiness.js
src/core/mentorAuditReadiness.test.js
src/core/mentorDecisionPolicy.js
src/core/mentorDecisionPolicy.test.js
src/core/mentorSignals.js
src/core/mentorSignals.test.js

```

## Full diff

```diff
diff --git a/package.json b/package.json
index efde6624..3f474f67 100644
--- a/package.json
+++ b/package.json
@@ -25,6 +25,7 @@
     "build": "node scripts/check-mojibake.mjs && react-scripts build",
     "test": "react-scripts test",
     "eject": "react-scripts eject",
+    "audit": "node scripts/audit.mjs",
     "prepare": "git config core.hooksPath .githooks || exit 0"
   },
   "eslintConfig": {
diff --git a/src/App.js b/src/App.js
index bf45e5e1..33c76b0d 100644
--- a/src/App.js
+++ b/src/App.js
@@ -476,7 +476,7 @@ export default function App() {
     const temasList = state[plat]?.temas || [];
     const maxRevisoesDia = state.meta?.maxRevisoesDia || 30;
     const proj = getWorkloadProjection(temasList, 7);
-    const exceeds = Object.values(proj).some((count) => count > maxRevisoesDia);
+    const exceeds = Object.values(proj).some((day) => (day?.count || 0) > maxRevisoesDia);
     if (exceeds) {
       showToast("Atenção: próxima semana já está carregada de revisões.");
     }
diff --git a/src/components/Dashboard.jsx b/src/components/Dashboard.jsx
index 4f554ef5..2ccbc158 100644
--- a/src/components/Dashboard.jsx
+++ b/src/components/Dashboard.jsx
@@ -1,11 +1,12 @@
 // src/components/Dashboard.jsx
-import React, { useMemo, useState, useEffect } from "react";
+import React, { useMemo, useState, useEffect, useCallback } from "react";
 import { createPortal } from "react-dom";
 import { Edit2, Info, TrendingUp, TrendingDown, CheckCircle, ChevronDown, ChevronUp, Brain, Flame, Calendar, AlertTriangle, X, Zap, BookOpen, Layers, Share2, Unlock, Lightbulb, GraduationCap } from "lucide-react";
 import { useStore } from "../core/store";
 import { STEPS, ESP_COLORS, isOverdue, todayStr, addDays, fmtDate, fmtFull, getRetrievability, getWorkloadProjection } from "../core/fsrs";
 import { calcTrueRetention, calcBleedingScore, useFilaInteligente, PESOS_PROVA_VEST } from "../hooks/useMetrics";
 import { getMentorDiagnosis, getMentorVoice, getMentorPhrase, getRecentPhrases, trackRecentPhrase, isExhaustionDetected } from "../core/mentor";
+import { buildMentorContext, getMentorNextAction, getMentorTodayPlan } from "../core/mentorAutopilot";
 import { getReadinessData } from "../core/readiness";
 import { getUserState } from "../core/userState";
 import { TourBalloon, Modal, Btn, ConfettiOverlay, ProgressiveTooltip, InfoTooltip } from "./Primitives";
@@ -31,9 +32,10 @@ import EmptyState from "./EmptyState";
 /* --- CARGA FUTURA WIDGET --- */
 function CargaFuturaWidget({ temas, maxRevisoesDia }) {
   const proj = getWorkloadProjection(temas, 14);
-  const dates = Object.keys(proj);
-  const maxCount = Math.max(...Object.values(proj), maxRevisoesDia, 1);
-  const diasSobrecarga = Object.values(proj).filter((count) => count > maxRevisoesDia).length;
+  const dayEntries = Object.values(proj);
+  const dates = dayEntries.map((entry) => entry.date);
+  const maxCount = Math.max(...dayEntries.map((entry) => entry?.count || 0), maxRevisoesDia, 1);
+  const diasSobrecarga = dayEntries.filter((entry) => (entry?.count || 0) > maxRevisoesDia).length;
   
   return (
     <div className="medrev-card medrev-card-hover p-5 select-none animate-fade-in">
@@ -47,7 +49,9 @@ function CargaFuturaWidget({ temas, maxRevisoesDia }) {
       
       <div className="flex items-end justify-between h-24 gap-1.5 pt-4">
         {dates.map((date) => {
-          const count = proj[date];
+          const entry = proj[date] || { count: 0, estimatedMinutes: 0 };
+          const count = entry.count || 0;
+          const minutes = entry.estimatedMinutes || 0;
           const pct = (count / maxCount) * 100;
           const exceeds = count > maxRevisoesDia;
           const today = date === todayStr();
@@ -56,7 +60,7 @@ function CargaFuturaWidget({ temas, maxRevisoesDia }) {
             <div key={date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
               <div className="relative w-full flex justify-center">
                 <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 text-[9px] text-gray-300 rounded px-1.5 py-0.5 whitespace-nowrap z-50 pointer-events-none font-mono">
-                  {count} revs
+                  {count} revs · {minutes} min
                 </span>
               </div>
               <div 
@@ -795,7 +799,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       esp: item.esp || "Outro",
       prio: "Alta",
       importancia: "ALTA",
-      obs: "Criado pelo Dashboard para validacao de dominio previo.",
+      obs: "Criado pelo Dashboard para validação de domínio prévio.",
       unstarted: true,
       d0: todayStr(),
     };
@@ -1018,7 +1022,13 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
   }, [diag]);
   const hasExhaustionNow = useMemo(() => isExhaustionDetected(temaStats, done), [temaStats, done]);
   const totalSessions = useMemo(() => {
-    return temas.flatMap((t) => Object.values(t.rev)).filter((r) => r.done).length;
+    return temas
+      .flatMap((t) => [
+        ...STEPS.map((s) => t.rev?.[s.key]),
+        t.rev?.manutencao,
+      ])
+      .filter((r) => r?.done === true)
+      .length;
   }, [temas]);
 
   const doneDays = useMemo(() => new Set(done.map((r) => r.date)), [done]);
@@ -1169,67 +1179,59 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
     });
   }, [readinessData, trueRet, totalSessions, temasFiltrados, totalRevisoesFeitas]);
 
-  const comandoDoDia = useMemo(() => {
-    if (hasExhaustionNow) {
-      return {
-        eyebrow: "Comando do dia",
-        title: "Proteja o sistema antes de acelerar",
-        subtitle: "Seu padrão recente sugere fadiga. Faça revisão leve hoje e ajuste a carga.",
-        primaryLabel: pending > 0 ? "Fazer revisão leve" : "Abrir cronograma",
-        secondaryLabel: "Ver estatísticas",
-        tone: "amber",
-      };
-    }
-
-    if (overdue.length > 0 && topFilaItem) {
-      return {
-        eyebrow: "Comando do dia",
-        title: `Recuperar revisão vencida: ${topFilaItem.temaNome}`,
-        subtitle: naReserva > 0
-          ? `${pending} revisões na fila de hoje e ${naReserva} na reserva. Comece pela revisão mais crítica.`
-          : `${pending} revisões na fila de hoje. Comece pela revisão mais crítica.`,
-        primaryLabel: "Iniciar revisão crítica",
-        secondaryLabel: "Ver estatísticas",
-        tone: "red",
-      };
-    }
-
-    if (topFilaItem?.isOptimal) {
-      return {
-        eyebrow: "Comando do dia",
-        title: `Janela ideal: ${topFilaItem.temaNome}`,
-        subtitle: "Este item está no ponto ótimo de recuperação. Melhor custo-benefício cognitivo agora.",
-        primaryLabel: "Iniciar no ponto ideal",
-        secondaryLabel: "Ver estatísticas",
-        tone: "blue",
-      };
-    }
+  const mentorContext = useMemo(() => {
+    const state = useStore.getState();
+    return buildMentorContext(state, plat, {
+      readinessData,
+      lowEnergy: hasExhaustionNow,
+      exhaustionDetected: hasExhaustionNow,
+    });
+  }, [plat, readinessData, hasExhaustionNow]);
 
-    if (pending > 0 && topFilaItem) {
-      return {
-        eyebrow: "Comando do dia",
-        title: `Comece por: ${topFilaItem.temaNome}`,
-        subtitle: naReserva > 0
-          ? `${pending} revisões programadas hoje e ${naReserva} fora do teto diário.`
-          : "A fila já está ordenada por urgência, peso e custo cognitivo.",
-        primaryLabel: "Iniciar foco",
-        secondaryLabel: "Ver estatísticas",
-        tone: "blue",
-      };
-    }
+  const mentorNextAction = useMemo(() => getMentorNextAction(mentorContext), [mentorContext]);
+  const mentorTodayPlan = useMemo(() => getMentorTodayPlan(mentorContext), [mentorContext]);
 
-    const gargalo = readinessData?.priorityList?.[0];
+  const comandoDoDia = useMemo(() => {
+    const action = mentorNextAction || {};
+    const tone = action.safety === "critical"
+      ? "red"
+      : action.safety === "caution"
+      ? "amber"
+      : action.type === "new_topic" || action.type === "rest" || action.type === "anki_check"
+      ? "emerald"
+      : "blue";
+    const subtitle = action.subtitle
+      || action.reason
+      || mentorTodayPlan.slice(1).join(" ");
     return {
       eyebrow: "Comando do dia",
-      title: gargalo?.area ? `Fila zerada. Avance em ${gargalo.area}.` : "Fila zerada. Avance sem pressa.",
-      subtitle: gargalo?.area
-        ? "Sem revisões pendentes. Use o tempo para iniciar tema de alta incidência ou baixa cobertura."
-        : "Sua curva está protegida hoje. Você pode iniciar tema novo ou descansar sem culpa.",
-      primaryLabel: gargalo?.area ? "Escolher tema prioritário" : "Abrir cronograma",
+      title: action.title || "Manter consistência leve",
+      subtitle: subtitle || "Sem urgência crítica detectada. Siga o plano com ritmo sustentável.",
+      primaryLabel: action.cta || "Executar ação",
       secondaryLabel: "Ver estatísticas",
-      tone: "emerald",
+      tone,
+      action,
     };
-  }, [hasExhaustionNow, overdue.length, topFilaItem, pending, naReserva, readinessData?.priorityList]);
+  }, [mentorNextAction, mentorTodayPlan]);
+
+  const runMentorPrimaryAction = useCallback(() => {
+    const action = mentorNextAction || {};
+    const target = action.target || {};
+    if (target.temaId && target.stepKey && onStudy) {
+      onStudy(target.temaId, target.stepKey);
+      return;
+    }
+    const view = action.ctaView || target.view || "dash";
+    if (view === "focus") {
+      if (topFilaItem && onStudy) {
+        onStudy(topFilaItem.temaId, topFilaItem.stepKey);
+      } else if (setView) {
+        setView("dash");
+      }
+      return;
+    }
+    if (setView) setView(view);
+  }, [mentorNextAction, onStudy, setView, topFilaItem]);
 
   const days = Array.from({ length: 35 }, (_, i) => {
     const d = new Date(); d.setDate(d.getDate() - 34 + i);
@@ -1429,8 +1431,17 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
         <EmptyState
           icon={GraduationCap}
           title="Comece em 2 minutos"
-          description={"1. Escolha um calendario.\n2. Deixe o Mentor montar a primeira acao.\n3. Faca uma sessao curta."}
-          primaryAction={{ label: "Configurar agora", onClick: () => setView && setView("crono") }}
+          description={"1. Escolha um calendário.\n2. Deixe o Mentor montar a primeira ação.\n3. Faça uma sessão curta."}
+          primaryAction={{
+            label: "Configurar agora",
+            onClick: () => {
+              if (onOpenAjustes) {
+                onOpenAjustes();
+                return;
+              }
+              if (setView) setView("crono");
+            },
+          }}
           className="my-4 whitespace-pre-line"
         />
       </div>
@@ -1526,10 +1537,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
             <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
               <button
                 type="button"
-                onClick={() => {
-                  if (pending > 0 && topFilaItem) onStudy(topFilaItem.temaId, topFilaItem.stepKey);
-                  else setView && setView("crono");
-                }}
+                onClick={runMentorPrimaryAction}
                 className={`medrev-cta-primary min-h-[44px] rounded-xl px-5 py-3 text-sm font-extrabold shadow-lg border-none cursor-pointer ${
                   comandoDoDia.tone === "red"
                     ? "bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-red-950/25 hover:from-red-500 hover:to-orange-400"
@@ -1549,7 +1557,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
               >
                 {comandoDoDia.secondaryLabel}
               </button>
-              {topFilaItem?.isOptimal && (
+              {topFilaItem?.isOptimal && comandoDoDia.action?.type === "fila_do_dia" && (
                 <span className="text-[11px] font-bold text-amber-300">
                   Ponto exato de esquecimento detectado
                 </span>
@@ -1891,7 +1899,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       {(() => {
         const proj = getWorkloadProjection(temas, 14);
         const cap_ = meta.maxRevisoesDia || 30;
-        const diasSobrecarga = Object.values(proj).filter(n => n > cap_).length;
+        const diasSobrecarga = Object.values(proj).filter((day) => (day?.count || 0) > cap_).length;
         const retAtual = meta?.retencaoFSRS || 0.90;
         if (diasSobrecarga >= 3 && retAtual >= 0.90) {
           return (
diff --git a/src/components/Modals.jsx b/src/components/Modals.jsx
index 59036b3f..fb736a1d 100644
--- a/src/components/Modals.jsx
+++ b/src/components/Modals.jsx
@@ -1571,7 +1571,10 @@ export function AjustesModal({ onClose, overdueCount, onResetOnboarding }) {
                   <button
                     type="button"
                     onClick={() => {
-                      const avgWorkload = Math.round(Object.values(getWorkloadProjection(temas, 14)).reduce((a,b)=>a+b, 0) / 14) || 10;
+                      const avgWorkload = Math.round(
+                        Object.values(getWorkloadProjection(temas, 14))
+                          .reduce((sum, day) => sum + (day?.count || 0), 0) / 14
+                      ) || 10;
                       saveMeta({ metaDiaria: avgWorkload });
                       showToast(`Meta diária calibrada em ${avgWorkload} revisões/dia.`);
                     }}
diff --git a/src/components/StatsPanel.jsx b/src/components/StatsPanel.jsx
index 96117a68..eb2fd61a 100644
--- a/src/components/StatsPanel.jsx
+++ b/src/components/StatsPanel.jsx
@@ -20,6 +20,7 @@ export default function StatsPanel({ setView }) {
   const temas = useStore((s) => s[plat]?.temas || []);
   const simulados = useStore((s) => s[plat]?.simulados || []);
   const weeklyReviews = useStore((s) => s.weeklyReviews || []);
+  const enamedAnalises = useStore((s) => s.enamedAnalises || []);
 
   const personalStats = useMemo(() => {
     const startedTemas = temas.filter(t => !t.unstarted);
@@ -344,11 +345,13 @@ export default function StatsPanel({ setView }) {
                     if (setView) setView("crono");
                   }}
                 />
-                <AdvancedSection title="Analise ENAMED detalhada" defaultOpen={false} storageKey="stats-enamed-advanced">
-                  <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando análise ENAMED...</div>}>
-                    <EnamedProvaAnalyzer />
-                  </Suspense>
-                </AdvancedSection>
+                {enamedAnalises.length > 0 && (
+                  <AdvancedSection title="Analise ENAMED detalhada" defaultOpen={false} storageKey="stats-enamed-advanced">
+                    <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando análise ENAMED...</div>}>
+                      <EnamedProvaAnalyzer />
+                    </Suspense>
+                  </AdvancedSection>
+                )}
               </>
             )}
 
diff --git a/src/components/WeeklyReview.jsx b/src/components/WeeklyReview.jsx
index 1c91d74c..2e6f7834 100644
--- a/src/components/WeeklyReview.jsx
+++ b/src/components/WeeklyReview.jsx
@@ -1,4 +1,5 @@
 import React, { useMemo, useState } from "react";
+import { createPortal } from "react-dom";
 import { CalendarCheck2, ChevronDown, ChevronUp, X } from "lucide-react";
 import { addDays, STEPS, todayStr } from "../core/fsrs";
 import { buildWeeklyReview } from "../core/sessionReflection";
@@ -142,8 +143,8 @@ export default function WeeklyReview({ onAdjust, onAction }) {
         </div>
       )}
 
-      {showAdjustModal && (
-        <div className="fixed inset-0 z-[410] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:pl-60" onClick={() => setShowAdjustModal(false)}>
+      {showAdjustModal && typeof document !== "undefined" && createPortal(
+        <div className="fixed inset-0 z-[410] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdjustModal(false)}>
           <div
             className="w-full max-w-lg bg-[var(--surface-2)] border border-white/10 rounded-2xl p-4 space-y-3"
             onClick={(event) => event.stopPropagation()}
@@ -192,7 +193,8 @@ export default function WeeklyReview({ onAdjust, onAction }) {
               </button>
             </div>
           </div>
-        </div>
+        </div>,
+        document.body
       )}
     </section>
   );
diff --git a/src/core/domainValidation.js b/src/core/domainValidation.js
index bc550bde..269cc319 100644
--- a/src/core/domainValidation.js
+++ b/src/core/domainValidation.js
@@ -1,7 +1,7 @@
 // src/core/domainValidation.js
 // Lógica de validação de domínio prévio (puramente funcional).
 
-import { STEPS, S_BASE, addDays, todayStr, getAreaPrior } from "./fsrs";
+import { STEPS, S_BASE, addDays, todayStr, getAreaPrior, inferPhaseFromStep } from "./fsrs";
 
 export const DOMINIO_PREVIO_MIN_QUESTOES = 15;
 export const DOMINIO_PREVIO_MIN_ACERTO = 80;
@@ -165,20 +165,26 @@ export function buildRevComDominio(d0, esp, importancia, classificacao, pctAcert
   const acertoFrac = Math.max(0, Math.min(1, Number(pctAcerto || 0) / 100));
   const rev = {};
   STEPS.forEach((step) => {
+    const stepDate = addDays(hoje, step.offset);
     rev[step.key] = {
-      date: addDays(hoje, step.offset),
+      date: stepDate,
+      scheduledAt: stepDate,
+      reviewedAt: null,
       done: false,
       acerto: null,
       questoes: null,
       S: S_BASE[step.key],
       D: prior.difBase,
       motivosErro: [],
+      phase: inferPhaseFromStep(step.key),
     };
   });
 
   rev.d0 = {
     ...rev.d0,
     date: baseDate,
+    scheduledAt: baseDate,
+    reviewedAt: baseDate,
     done: true,
     acerto: acertoFrac,
     questoes: null,
@@ -188,19 +194,26 @@ export function buildRevComDominio(d0, esp, importancia, classificacao, pctAcert
   rev.d1 = {
     ...rev.d1,
     date: addDays(hoje, intervaloInicial),
+    scheduledAt: addDays(hoje, intervaloInicial),
   };
   rev.d4 = {
     ...rev.d4,
     date: addDays(hoje, intervaloInicial + 3),
+    scheduledAt: addDays(hoje, intervaloInicial + 3),
   };
   rev.d7 = {
     ...rev.d7,
     date: addDays(hoje, intervaloInicial + 7),
+    scheduledAt: addDays(hoje, intervaloInicial + 7),
   };
   rev.d21 = {
     ...rev.d21,
     date: addDays(hoje, intervaloInicial + 21),
+    scheduledAt: addDays(hoje, intervaloInicial + 21),
   };
+  rev.reviewHistory = [];
+  rev.phase = "learning";
+  rev.relearning = null;
 
   return rev;
 }
diff --git a/src/core/fsrs.js b/src/core/fsrs.js
index ef24e42d..55eb9976 100644
--- a/src/core/fsrs.js
+++ b/src/core/fsrs.js
@@ -16,31 +16,122 @@ export function addDays(dateStr, n) {
 
 export const diffDays = (a, b) => Math.round((new Date(b) - new Date(a)) / 86_400_000);
 
+export const STEP_ESTIMATED_MINUTES = {
+  d0: 45,
+  d1: 12,
+  d4: 25,
+  d7: 30,
+  d21: 35,
+  manutencao: 25,
+  relearning: 20,
+};
+
+const WORKLOAD_LEVEL_BY_MINUTES = (minutes) => {
+  if (minutes > 120) return "high";
+  if (minutes > 60) return "moderate";
+  return "ok";
+};
+
+const STEP_SEQUENCE = ["d0", "d1", "d4", "d7", "d21"];
+const STEP_INDEX = STEP_SEQUENCE.reduce((acc, key, idx) => ({ ...acc, [key]: idx }), {});
+const STEP_MIN_GAP = {
+  d0: 1,
+  d1: 3,
+  d4: 3,
+  d7: 14,
+  d21: 45,
+};
+
+function normalizeAcerto(acerto) {
+  if (acerto == null) return null;
+  const num = Number(acerto);
+  if (Number.isNaN(num)) return null;
+  if (num > 1) return Math.max(0, Math.min(1, num / 100));
+  return Math.max(0, Math.min(1, num));
+}
+
+function ensureStepMetadata(step = {}, fallbackDate, fallbackPhase) {
+  const date = step.date || fallbackDate;
+  const scheduledAt = step.scheduledAt || date || fallbackDate;
+  const reviewedAt = step.reviewedAt || (step.done ? (date || fallbackDate) : null);
+  return {
+    ...step,
+    date,
+    scheduledAt,
+    reviewedAt,
+    phase: step.phase || fallbackPhase,
+  };
+}
+
+function clearOperationalStepState(step = {}, extra = {}) {
+  return {
+    ...step,
+    done: false,
+    reviewedAt: null,
+    completedAt: null,
+    acerto: null,
+    questoes: null,
+    ...extra,
+  };
+}
+
+function getEstimatedMinutesForStep(stepKey, step = {}) {
+  if (step?.phase === "relearning") return STEP_ESTIMATED_MINUTES.relearning;
+  if (stepKey === "manutencao") return STEP_ESTIMATED_MINUTES.manutencao;
+  return STEP_ESTIMATED_MINUTES[stepKey] || STEP_ESTIMATED_MINUTES.d4;
+}
+
 export function getWorkloadProjection(temas, numDays = 14) {
   const projection = {};
   const today = todayStr();
   
-  // Initialize projection keys for the next N days
   for (let i = 0; i < numDays; i++) {
     const dateStr = addDays(today, i);
-    projection[dateStr] = 0;
+    projection[dateStr] = {
+      date: dateStr,
+      count: 0,
+      estimatedMinutes: 0,
+      items: [],
+      overload: false,
+      overloadLevel: "ok",
+    };
   }
   
-  // Count pending reviews scheduled on each date
   temas.forEach(t => {
     if (t.unstarted) return;
     Object.keys(t.rev).forEach(stepKey => {
+      if (stepKey === "reviewHistory" || stepKey === "meta" || stepKey === "phase" || stepKey === "relearning") return;
       const r = t.rev[stepKey];
       if (r && !r.done && r.date) {
-        // If it is overdue, it counts towards today's workload
+        const minutes = getEstimatedMinutesForStep(stepKey, r);
+        const payload = {
+          temaId: t.id,
+          temaNome: t.nome,
+          stepKey,
+          phase: r.phase || inferPhaseFromStep(stepKey, stepKey === "manutencao"),
+          scheduledAt: r.scheduledAt || r.date,
+          date: r.date,
+          estimatedMinutes: minutes,
+          overdue: r.date < today,
+        };
         if (r.date < today) {
-          projection[today]++;
+          projection[today].count += 1;
+          projection[today].estimatedMinutes += minutes;
+          projection[today].items.push(payload);
         } else if (projection.hasOwnProperty(r.date)) {
-          projection[r.date]++;
+          projection[r.date].count += 1;
+          projection[r.date].estimatedMinutes += minutes;
+          projection[r.date].items.push(payload);
         }
       }
     });
   });
+
+  Object.keys(projection).forEach((date) => {
+    const level = WORKLOAD_LEVEL_BY_MINUTES(projection[date].estimatedMinutes);
+    projection[date].overloadLevel = level;
+    projection[date].overload = level !== "ok";
+  });
   
   return projection;
 }
@@ -68,7 +159,7 @@ export function fmtRelativo(dateStr) {
 }
 
 export const fmtMonth = (d) => {
-  const [, m, y] = d.split("-");
+  const [y, m] = d.split("-");
   const M = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
   return `${M[+m - 1]} ${y}`;
 };
@@ -131,32 +222,184 @@ export const getAreaPrior = (esp) => AREA_PRIORS[getCanonicalArea(esp)] || AREA_
 
 export const DEMO_TEMA_ID = (plat) => plat === "vest" ? "demo-funcoes" : "demo-apendicite";
 
+export function getLastOfficialReview(history = []) {
+  for (let i = history.length - 1; i >= 0; i--) {
+    const item = history[i];
+    if (item && item.official !== false) return item;
+  }
+  return null;
+}
+
+export function getLastReviewForStep(history = [], stepKey) {
+  for (let i = history.length - 1; i >= 0; i--) {
+    const item = history[i];
+    if (!item || item.official === false) continue;
+    if (item.stepKey === stepKey) return item;
+  }
+  return null;
+}
+
+export function appendReviewHistory(rev = {}, event, limit = 100) {
+  const history = Array.isArray(rev.reviewHistory) ? rev.reviewHistory : [];
+  const normalized = {
+    id: event?.id || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
+    official: true,
+    source: "fsrs-lite",
+    ...event,
+  };
+  return [...history, normalized].slice(-limit);
+}
+
+export function inferPhaseFromStep(stepKey, manutencao = false) {
+  if (manutencao || stepKey === "manutencao") return "maintenance";
+  if (stepKey === "d21") return "review";
+  if (["d0", "d1", "d4", "d7"].includes(stepKey)) return "learning";
+  return "learning";
+}
+
+export function getAgainSeverity(acerto) {
+  const normalized = normalizeAcerto(acerto);
+  if (normalized == null) return null;
+  return normalized < 0.30 ? "severe" : "common";
+}
+
+export function resolveAgainPolicy(stepKey, acerto, context = {}) {
+  const severity = getAgainSeverity(acerto) || "common";
+  const severe = severity === "severe";
+  if (stepKey === "manutencao" || context?.isMaintenance) {
+    return severe
+      ? { targetStep: "d7", delayDays: 1, phaseAfter: "relearning", severity, shouldPushFuture: true }
+      : { targetStep: "manutencao", delayDays: 5, phaseAfter: "maintenance", severity, shouldPushFuture: false };
+  }
+  if (stepKey === "d21") {
+    return severe
+      ? { targetStep: "d7", delayDays: 1, phaseAfter: "relearning", severity, shouldPushFuture: true }
+      : { targetStep: "d21", delayDays: 2, phaseAfter: "review", severity, shouldPushFuture: false };
+  }
+  if (stepKey === "d7") {
+    return severe
+      ? { targetStep: "d4", delayDays: 1, phaseAfter: "relearning", severity, shouldPushFuture: true }
+      : { targetStep: "d7", delayDays: 1, phaseAfter: "learning", severity, shouldPushFuture: false };
+  }
+  if (stepKey === "d4") {
+    return severe
+      ? { targetStep: "d1", delayDays: 1, phaseAfter: "learning", severity, shouldPushFuture: true }
+      : { targetStep: "d4", delayDays: 1, phaseAfter: "learning", severity, shouldPushFuture: false };
+  }
+  if (stepKey === "d1") {
+    return severe
+      ? { targetStep: "d0", delayDays: 1, phaseAfter: "learning", severity, shouldPushFuture: true }
+      : { targetStep: "d1", delayDays: 1, phaseAfter: "learning", severity, shouldPushFuture: false };
+  }
+  return { targetStep: "d0", delayDays: 1, phaseAfter: "learning", severity, shouldPushFuture: false };
+}
+
+export function pushFutureStepsAfterDowngrade(rev, targetStep, targetDate, options = {}) {
+  const nextRev = { ...rev };
+  const baseIdx = STEP_INDEX[targetStep];
+  if (baseIdx == null) return nextRev;
+
+  let prevKey = targetStep;
+  let prevDate = targetDate;
+  for (let i = baseIdx + 1; i < STEP_SEQUENCE.length; i++) {
+    const key = STEP_SEQUENCE[i];
+    const step = nextRev[key];
+    if (!step || step.done) {
+      prevKey = key;
+      prevDate = step?.date || prevDate;
+      continue;
+    }
+    const minGap = STEP_MIN_GAP[prevKey] || 1;
+    const minDate = addDays(prevDate, minGap);
+    const finalDate = step.date && step.date > minDate ? step.date : minDate;
+    nextRev[key] = {
+      ...step,
+      date: finalDate,
+      scheduledAt: finalDate,
+      phase: step.phase || inferPhaseFromStep(key),
+    };
+    prevKey = key;
+    prevDate = finalDate;
+  }
+
+  if (options?.pushMaintenance && nextRev.manutencao && !nextRev.manutencao.done) {
+    const minDate = addDays(prevDate, STEP_MIN_GAP.d21);
+    const finalDate = nextRev.manutencao.date && nextRev.manutencao.date > minDate
+      ? nextRev.manutencao.date
+      : minDate;
+    nextRev.manutencao = {
+      ...nextRev.manutencao,
+      date: finalDate,
+      scheduledAt: finalDate,
+      phase: "maintenance",
+    };
+  }
+
+  return nextRev;
+}
+
+export function applyRelearningRecoveryBonus(S, rating, context = {}) {
+  if (!context?.wasRelearning) return S;
+  if (rating === "easy") return S * 1.12;
+  if (rating === "good") return S * 1.05;
+  return S;
+}
+
+export function getLastReviewedAt(tema, stepKey) {
+  const history = tema?.rev?.reviewHistory || tema?.reviewHistory || [];
+  const byStep = stepKey ? getLastReviewForStep(history, stepKey) : getLastOfficialReview(history);
+  if (byStep?.reviewedAt) return byStep.reviewedAt;
+
+  const rev = tema?.rev || {};
+  if (stepKey && rev[stepKey]) {
+    if (rev[stepKey]?.reviewedAt) return rev[stepKey].reviewedAt;
+    if (rev[stepKey]?.done && rev[stepKey]?.date) return rev[stepKey].date;
+  }
+
+  if (!stepKey) {
+    for (let i = STEP_SEQUENCE.length - 1; i >= 0; i--) {
+      const key = STEP_SEQUENCE[i];
+      const step = rev[key];
+      if (!step || !step.done) continue;
+      if (step.reviewedAt) return step.reviewedAt;
+      if (step.date) return step.date;
+    }
+  }
+
+  return tema?.createdAt || tema?.d0 || todayStr();
+}
+
 export function getRetrievability(tema, stepKey) {
   if (stepKey === "d0") return 1.0;
   const stepIdx = STEPS.findIndex((s) => s.key === stepKey);
   if (stepIdx <= 0) return 1.0;
   const prevKey = STEPS[stepIdx - 1].key;
-  const lastDate = tema.rev[prevKey]?.date || tema.d0 || todayStr();
+  const lastDate = getLastReviewedAt(tema, prevKey);
   const t = Math.max(0, diffDays(lastDate, todayStr()));
   const S = tema.rev[stepKey]?.S || S_BASE[stepKey] || 1;
   return (1 + FSRS_FACTOR * t / S) ** FSRS_DECAY;
 }
 
 export function toRating(acerto) {
-  if (acerto == null) return "good";
-  if (acerto < 0.55) return "again";
-  if (acerto < 0.75) return "hard";
-  if (acerto < 0.90) return "good";
+  const normalized = normalizeAcerto(acerto);
+  if (normalized == null) return null;
+  if (normalized < 0.55) return "again";
+  if (normalized < 0.75) return "hard";
+  if (normalized < 0.90) return "good";
   return "easy";
 }
 
 export function updateDifficulty(D_prev, acerto) {
-  const delta = { again: +0.15, hard: +0.05, good: -0.02, easy: -0.08 }[toRating(acerto)];
+  const rating = toRating(acerto);
+  const delta = { again: +0.15, hard: +0.05, good: -0.02, easy: -0.08 }[rating];
+  if (delta == null) return D_prev ?? 0.5;
   return Math.min(1, Math.max(0, (D_prev ?? 0.5) + delta));
 }
 
 export function updateStability(S_prev, acerto, D = 0.5, sMult = 1.0) {
-  const base = { again: -0.8, hard: 0.05, good: 0.3, easy: 0.7 }[toRating(acerto)];
+  const rating = toRating(acerto);
+  const base = { again: -0.8, hard: 0.05, good: 0.3, easy: 0.7 }[rating];
+  if (base == null) return S_prev;
   const ganho = base * (1.1 - 0.4 * D) * sMult;
   return Math.max(0.5, S_prev * Math.exp(ganho));
 }
@@ -193,115 +436,313 @@ export function buildRev(d0, esp = "Outro") {
   const r = {};
   const prior = getAreaPrior(esp);
   STEPS.forEach((s) => {
-    r[s.key] = { date: addDays(d0, s.offset), done: false, acerto: null, questoes: null, S: S_BASE[s.key], D: prior.difBase, motivosErro: [] };
+    const stepDate = addDays(d0, s.offset);
+    r[s.key] = {
+      date: stepDate,
+      scheduledAt: stepDate,
+      reviewedAt: null,
+      done: false,
+      acerto: null,
+      questoes: null,
+      S: S_BASE[s.key],
+      D: prior.difBase,
+      motivosErro: [],
+      phase: inferPhaseFromStep(s.key),
+    };
   });
+  r.reviewHistory = [];
+  r.phase = "learning";
+  r.relearning = null;
   return r;
 }
 
 export function recalcAfterMark(rev, doneKey, acerto, desiredRetention = 0.90, maxInterval = 180, esp = "Outro") {
   const rating = toRating(acerto);
+  const eventStep = doneKey === "manutencao" ? rev?.manutencao : rev?.[doneKey];
+  if (!eventStep) return rev;
   const prior = getAreaPrior(esp);
+  const now = todayStr();
+  const phaseBefore = rev.phase || inferPhaseFromStep(doneKey, doneKey === "manutencao");
+  const wasRelearning = phaseBefore === "relearning" || rev?.relearning?.startedAt;
   const prevS = doneKey === "manutencao" 
     ? (rev.manutencao?.S ?? 45) 
     : (rev[doneKey]?.S ?? S_BASE[doneKey]);
   const prevD = doneKey === "manutencao"
     ? (rev.manutencao?.D ?? prior.difBase)
     : (rev[doneKey]?.D ?? prior.difBase);
+  if (rating == null) {
+    const currentStep = doneKey === "manutencao" ? rev.manutencao : rev[doneKey];
+    return {
+      ...rev,
+      [doneKey]: clearOperationalStepState(currentStep || {}, {
+        phase: currentStep?.phase || inferPhaseFromStep(doneKey, doneKey === "manutencao"),
+      }),
+      phase: rev.phase || inferPhaseFromStep(doneKey, doneKey === "manutencao"),
+      meta: {
+        ...(rev.meta || {}),
+        schedulerWarning: "missing_rating",
+      },
+    };
+  }
+
   const D_new = updateDifficulty(prevD, acerto);
-  const S_new = updateStability(prevS, acerto, D_new, prior.sMult);
+  const computedS = updateStability(prevS, acerto, D_new, prior.sMult);
+  const S_new = applyRelearningRecoveryBonus(computedS, rating, { wasRelearning });
+  const scheduledAt = eventStep.scheduledAt || eventStep.date || now;
+  const reviewedAt = eventStep.reviewedAt || now;
+  const atrasoDias = Math.max(0, diffDays(scheduledAt, reviewedAt));
+  const severity = rating === "again" ? getAgainSeverity(acerto) : null;
+  const historyBase = {
+    stepKey: doneKey,
+    phaseBefore,
+    scheduledAt,
+    reviewedAt,
+    atrasoDias,
+    acerto: normalizeAcerto(acerto),
+    questoes: eventStep.questoes ?? null,
+    rating,
+    severity,
+    S_before: prevS,
+    S_after: S_new,
+    D_before: prevD,
+    D_after: D_new,
+    intervalBefore: eventStep.interval ?? null,
+    official: true,
+    source: "fsrs-lite",
+  };
 
   if (rating === "again") {
-    if (doneKey === "manutencao") {
-      return {
-        ...rev,
-        manutencao: {
-          ...rev.manutencao,
-          S: S_new,
-          D: D_new,
-          date: addDays(todayStr(), 1),
+    const policy = resolveAgainPolicy(doneKey, acerto, { isMaintenance: doneKey === "manutencao" });
+    const targetDate = addDays(now, policy.delayDays);
+    const targetPhase = policy.phaseAfter || inferPhaseFromStep(policy.targetStep, policy.targetStep === "manutencao");
+
+    let nextRev = {
+      ...rev,
+      phase: targetPhase,
+      relearning: policy.phaseAfter === "relearning"
+        ? {
+          fromStep: doneKey,
+          targetStep: policy.targetStep,
+          startedAt: now,
+          reason: "again_severe",
         }
-      };
+        : rev.relearning || null,
+      meta: {
+        ...(rev.meta || {}),
+        schedulerWarning: null,
+      },
+    };
+
+    const failedMeta = {
+      lastFailedAt: now,
+      lastFailedAcerto: normalizeAcerto(acerto),
+      lastFailedRating: "again",
+    };
+    nextRev[doneKey] = clearOperationalStepState(nextRev[doneKey] || {}, failedMeta);
+
+    if (policy.targetStep !== doneKey) {
+      const targetIndex = STEP_INDEX[policy.targetStep];
+      if (targetIndex != null) {
+        for (let idx = targetIndex; idx < STEP_SEQUENCE.length; idx++) {
+          const key = STEP_SEQUENCE[idx];
+          if (!nextRev[key]) continue;
+          nextRev[key] = clearOperationalStepState(nextRev[key], {
+            phase: key === policy.targetStep ? targetPhase : inferPhaseFromStep(key),
+          });
+        }
+        if (nextRev.manutencao && (nextRev.manutencao.date || now) >= now) {
+          nextRev.manutencao = clearOperationalStepState(nextRev.manutencao, { phase: "maintenance" });
+        }
+      }
     }
-    return {
-      ...rev,
-      [doneKey]: {
-        ...rev[doneKey],
+
+    if (policy.targetStep === "manutencao") {
+      nextRev.manutencao = {
+        ...clearOperationalStepState(nextRev.manutencao || rev.manutencao || {}),
+        date: targetDate,
+        scheduledAt: targetDate,
         S: S_new,
         D: D_new,
-        done: false,
-        date: addDays(todayStr(), 1),
-        acerto: null,
-        questoes: null,
-      },
+        phase: "maintenance",
+      };
+    } else {
+      const current = nextRev[policy.targetStep] || {};
+      nextRev[policy.targetStep] = {
+        ...clearOperationalStepState(current),
+        date: targetDate,
+        scheduledAt: targetDate,
+        S: policy.targetStep === doneKey ? S_new : (current.S ?? S_BASE[policy.targetStep] ?? prevS),
+        D: policy.targetStep === doneKey ? D_new : (current.D ?? prior.difBase),
+        phase: targetPhase,
+      };
+      if (policy.shouldPushFuture) {
+        nextRev = pushFutureStepsAfterDowngrade(nextRev, policy.targetStep, targetDate, { pushMaintenance: true });
+      }
+    }
+
+    const historyEvent = {
+      ...historyBase,
+      phaseAfter: targetPhase,
+      intervalAfter: policy.delayDays,
     };
+    nextRev.reviewHistory = appendReviewHistory(nextRev, historyEvent, 100);
+    return nextRev;
   }
 
   if (doneKey === "manutencao") {
     const prevInterval = rev.manutencao?.interval || 45;
     const nextInt = nextInterval(S_new, prevInterval * 2, desiredRetention, maxInterval, D_new);
-    const baseDate = rev.manutencao.date >= todayStr() ? rev.manutencao.date : todayStr();
-    return {
+    const baseDate = rev.manutencao.date >= now ? rev.manutencao.date : now;
+    const nextDate = addDays(baseDate, nextInt);
+    const nextRev = {
       ...rev,
+      phase: "maintenance",
+      relearning: (wasRelearning && (rating === "good" || rating === "easy")) ? null : rev.relearning,
       manutencao: {
         done: false,
-        date: addDays(baseDate, nextInt),
+        date: nextDate,
+        scheduledAt: nextDate,
+        reviewedAt: null,
+        acerto: null,
+        questoes: null,
         S: S_new,
         D: D_new,
-        interval: prevInterval * 2
-      }
+        interval: nextInt,
+        targetInterval: prevInterval * 2,
+        phase: "maintenance",
+      },
+      meta: {
+        ...(rev.meta || {}),
+        schedulerWarning: null,
+      },
     };
+    nextRev.reviewHistory = appendReviewHistory(nextRev, {
+      ...historyBase,
+      phaseAfter: "maintenance",
+      intervalAfter: nextInt,
+      intervalBefore: prevInterval,
+    }, 100);
+    return nextRev;
   }
 
   if (doneKey === "d21") {
     const nextInt = nextInterval(S_new, 45, desiredRetention, maxInterval, D_new);
-    const baseDate = rev.d21.date >= todayStr() ? rev.d21.date : todayStr();
-    return {
+    const baseDate = rev.d21.date >= now ? rev.d21.date : now;
+    const nextDate = addDays(baseDate, nextInt);
+    const nextRev = {
       ...rev,
-      d21: { ...rev.d21, S: S_new, D: D_new },
+      phase: (wasRelearning && (rating === "good" || rating === "easy")) ? "maintenance" : "review",
+      relearning: (wasRelearning && (rating === "good" || rating === "easy")) ? null : rev.relearning,
+      d21: { ...rev.d21, S: S_new, D: D_new, phase: "review" },
       manutencao: {
         done: false,
-        date: addDays(baseDate, nextInt),
+        date: nextDate,
+        scheduledAt: nextDate,
+        reviewedAt: null,
+        acerto: null,
+        questoes: null,
         S: S_new,
         D: D_new,
-        interval: 45
-      }
+        interval: nextInt,
+        targetInterval: 45,
+        phase: "maintenance",
+      },
+      meta: {
+        ...(rev.meta || {}),
+        schedulerWarning: null,
+      },
     };
+    nextRev.reviewHistory = appendReviewHistory(nextRev, {
+      ...historyBase,
+      phaseAfter: nextRev.phase,
+      intervalAfter: nextInt,
+      intervalBefore: 45,
+    }, 100);
+    return nextRev;
   }
 
   const doneIdx = STEPS.findIndex((s) => s.key === doneKey);
   const nextStep = STEPS[doneIdx + 1];
   if (!nextStep) return rev;
   const interval = nextInterval(S_new, nextStep.offset, desiredRetention, maxInterval, D_new);
-  const baseDate = rev[doneKey].date >= todayStr() ? rev[doneKey].date : todayStr();
-  return {
+  const baseDate = rev[doneKey].date >= now ? rev[doneKey].date : now;
+  const nextDate = addDays(baseDate, interval);
+  const phaseAfter = (wasRelearning && (rating === "good" || rating === "easy"))
+    ? inferPhaseFromStep(nextStep.key)
+    : (rev.phase || inferPhaseFromStep(nextStep.key));
+  const nextRev = {
     ...rev,
-    [doneKey]: { ...rev[doneKey], S: S_new, D: D_new },
-    [nextStep.key]: { ...rev[nextStep.key], date: addDays(baseDate, interval) },
+    phase: phaseAfter,
+    relearning: (wasRelearning && (rating === "good" || rating === "easy")) ? null : rev.relearning,
+    [doneKey]: { ...rev[doneKey], S: S_new, D: D_new, phase: inferPhaseFromStep(doneKey) },
+    [nextStep.key]: { ...rev[nextStep.key], date: nextDate, scheduledAt: nextDate, phase: inferPhaseFromStep(nextStep.key) },
+    meta: {
+      ...(rev.meta || {}),
+      schedulerWarning: null,
+    },
   };
+  nextRev.reviewHistory = appendReviewHistory(nextRev, {
+    ...historyBase,
+    phaseAfter,
+    intervalAfter: interval,
+  }, 100);
+  return nextRev;
 }
 
 export function normalizeTema(t) {
   if (!t) return t;
   const rev = { ...t.rev };
   const prior = getAreaPrior(t.esp);
+  const defaultD0 = t.d0 || todayStr();
   STEPS.forEach((s) => {
     if (!rev[s.key]) {
       rev[s.key] = {
         date: t.d0 ? addDays(t.d0, s.offset) : todayStr(),
+        scheduledAt: t.d0 ? addDays(t.d0, s.offset) : todayStr(),
+        reviewedAt: null,
         done: false,
         acerto: null,
         questoes: null,
         S: S_BASE[s.key],
         D: prior.difBase,
         motivosErro: [],
+        phase: inferPhaseFromStep(s.key),
       };
-    } else if (rev[s.key].D == null) {
-      rev[s.key] = {
-        ...rev[s.key],
-        D: prior.difBase,
-      };
+    } else {
+      rev[s.key] = ensureStepMetadata(
+        rev[s.key],
+        t.d0 ? addDays(t.d0, s.offset) : todayStr(),
+        inferPhaseFromStep(s.key)
+      );
+      if (rev[s.key].D == null) {
+        rev[s.key].D = prior.difBase;
+      }
     }
   });
+  if (rev.manutencao) {
+    rev.manutencao = ensureStepMetadata(
+      rev.manutencao,
+      addDays(defaultD0, 45),
+      "maintenance"
+    );
+    if (rev.manutencao.D == null) {
+      rev.manutencao.D = prior.difBase;
+    }
+  }
+  if (!Array.isArray(rev.reviewHistory)) {
+    rev.reviewHistory = [];
+  }
+  rev.reviewHistory = rev.reviewHistory.map((event) => ({
+    official: true,
+    source: "fsrs-lite",
+    ...event,
+  })).slice(-100);
+  if (!rev.phase) {
+    rev.phase = "learning";
+  }
+  if (!Object.prototype.hasOwnProperty.call(rev, "relearning")) {
+    rev.relearning = null;
+  }
   if (rev.manutencao && rev.manutencao.D == null) {
     rev.manutencao = {
       ...rev.manutencao,
diff --git a/src/core/fsrs.test.js b/src/core/fsrs.test.js
index 98e13b86..00536418 100644
--- a/src/core/fsrs.test.js
+++ b/src/core/fsrs.test.js
@@ -11,7 +11,10 @@ import {
   getWorkloadProjection,
   getAreaPrior,
   getRetencaoArea,
-  updateDifficulty
+  updateDifficulty,
+  toRating,
+  applyRelearningRecoveryBonus,
+  appendReviewHistory
 } from "./fsrs";
 
 describe("FSRS Core Logic Test Suite", () => {
@@ -63,6 +66,12 @@ describe("FSRS Core Logic Test Suite", () => {
     expect(updateDifficulty(0.5, 1.0)).toBeCloseTo(0.42);
   });
 
+  test("toRating returns null for null/undefined/NaN", () => {
+    expect(toRating(null)).toBeNull();
+    expect(toRating(undefined)).toBeNull();
+    expect(toRating("abc")).toBeNull();
+  });
+
   test("recalcAfterMark with rating again reschedules same step for tomorrow", () => {
     const initialRev = {
       d0: { date: "2026-05-29", done: false, acerto: null, questoes: null, S: 1.0, D: 0.55 },
@@ -167,9 +176,10 @@ describe("FSRS Core Logic Test Suite", () => {
     ];
 
     const proj = getWorkloadProjection(mockTemas, 3);
-    expect(proj[today]).toBe(1); // Only active non-done scheduled for today or earlier
-    expect(proj[addDays(today, 1)]).toBe(0);
-    expect(proj[addDays(today, 2)]).toBe(1);
+    expect(proj[today].count).toBe(1); // Only active non-done scheduled for today or earlier
+    expect(proj[addDays(today, 1)].count).toBe(0);
+    expect(proj[addDays(today, 2)].count).toBe(1);
+    expect(proj[today].estimatedMinutes).toBeGreaterThan(0);
   });
 
   test("recalcAfterMark with D1 dynamic acertos recalcs correctly", () => {
@@ -190,4 +200,175 @@ describe("FSRS Core Logic Test Suite", () => {
     expect(rev2.d1.S).toBeLessThan(1.0);
     expect(rev2.d1.D).toBeGreaterThan(0.5);
   });
+
+  test("D7 with again common repeats D7 tomorrow", () => {
+    const today = todayStr();
+    const initialRev = buildRev(today, "GO");
+    const marked = {
+      ...initialRev,
+      d7: {
+        ...initialRev.d7,
+        done: true,
+        reviewedAt: today,
+        scheduledAt: addDays(today, -1),
+        acerto: 0.4,
+      },
+    };
+
+    const updated = recalcAfterMark(marked, "d7", 0.4);
+    expect(updated.d7.done).toBe(false);
+    expect(updated.d7.date).toBe(addDays(today, 1));
+    expect(updated.phase).toBe("learning");
+  });
+
+  test("D7 with again severe downgrades to D4 and enters relearning", () => {
+    const today = todayStr();
+    const initialRev = buildRev(today, "GO");
+    const marked = {
+      ...initialRev,
+      d7: {
+        ...initialRev.d7,
+        done: true,
+        reviewedAt: today,
+        scheduledAt: addDays(today, -2),
+        acerto: 0.2,
+      },
+    };
+
+    const updated = recalcAfterMark(marked, "d7", 0.2);
+    expect(updated.phase).toBe("relearning");
+    expect(updated.relearning?.fromStep).toBe("d7");
+    expect(updated.d7.done).toBe(false);
+    expect(updated.d4.done).toBe(false);
+    expect(updated.d4.date).toBe(addDays(today, 1));
+  });
+
+  test("D21 with again severe enters relearning and targets D7", () => {
+    const today = todayStr();
+    const initialRev = buildRev(addDays(today, -21), "GO");
+    const marked = {
+      ...initialRev,
+      d21: {
+        ...initialRev.d21,
+        done: true,
+        reviewedAt: today,
+        scheduledAt: addDays(today, -3),
+        acerto: 0.2,
+      },
+      manutencao: {
+        done: false,
+        date: addDays(today, 40),
+        scheduledAt: addDays(today, 40),
+        S: 30,
+        D: 0.5,
+      },
+    };
+
+    const updated = recalcAfterMark(marked, "d21", 0.2);
+    expect(updated.phase).toBe("relearning");
+    expect(updated.d21.done).toBe(false);
+    expect(updated.d7.done).toBe(false);
+    expect(updated.d7.date).toBe(addDays(today, 1));
+  });
+
+  test("missing rating does not leave step completed", () => {
+    const today = todayStr();
+    const initialRev = buildRev(today, "GO");
+    const marked = {
+      ...initialRev,
+      d1: {
+        ...initialRev.d1,
+        done: true,
+        scheduledAt: today,
+        reviewedAt: today,
+      },
+    };
+    const updated = recalcAfterMark(marked, "d1", null);
+    expect(updated.d1.done).toBe(false);
+    expect(updated.d1.reviewedAt).toBeNull();
+    expect(updated.meta?.schedulerWarning).toBe("missing_rating");
+  });
+
+  test("maintenance with again severe returns to D7 relearning", () => {
+    const today = todayStr();
+    const initialRev = buildRev(addDays(today, -60), "GO");
+    const marked = {
+      ...initialRev,
+      manutencao: {
+        done: true,
+        date: addDays(today, -1),
+        scheduledAt: addDays(today, -3),
+        reviewedAt: today,
+        acerto: 0.2,
+        S: 40,
+        D: 0.5,
+        interval: 45,
+      },
+    };
+
+    const updated = recalcAfterMark(marked, "manutencao", 0.2);
+    expect(updated.phase).toBe("relearning");
+    expect(updated.d7.date).toBe(addDays(today, 1));
+  });
+
+  test("applyRelearningRecoveryBonus is small and bounded", () => {
+    expect(applyRelearningRecoveryBonus(10, "easy", { wasRelearning: true })).toBeCloseTo(11.2);
+    expect(applyRelearningRecoveryBonus(10, "good", { wasRelearning: true })).toBeCloseTo(10.5);
+    expect(applyRelearningRecoveryBonus(10, "hard", { wasRelearning: true })).toBeCloseTo(10);
+  });
+
+  test("maintenance saves real next interval", () => {
+    const today = todayStr();
+    const initialRev = buildRev(addDays(today, -30), "GO");
+    const marked = {
+      ...initialRev,
+      manutencao: {
+        done: true,
+        date: today,
+        scheduledAt: today,
+        reviewedAt: today,
+        acerto: 0.9,
+        S: 45,
+        D: 0.5,
+        interval: 45,
+      },
+    };
+
+    const updated = recalcAfterMark(marked, "manutencao", 0.9);
+    expect(updated.manutencao.interval).toBeDefined();
+    expect(updated.manutencao.targetInterval).toBe(90);
+    expect(updated.manutencao.date).toBe(addDays(today, updated.manutencao.interval));
+  });
+
+  test("reviewHistory receives events and is limited", () => {
+    const today = todayStr();
+    const rev = buildRev(today, "GO");
+    const withHistory = {
+      ...rev,
+      reviewHistory: Array.from({ length: 100 }, (_, idx) => ({
+        id: `h_${idx}`,
+        stepKey: "d1",
+        reviewedAt: today,
+      })),
+      d1: {
+        ...rev.d1,
+        done: true,
+        reviewedAt: today,
+        scheduledAt: today,
+      },
+    };
+
+    const updated = recalcAfterMark(withHistory, "d1", 0.9);
+    expect(updated.reviewHistory.length).toBe(100);
+    expect(updated.reviewHistory[99].stepKey).toBe("d1");
+    expect(updated.reviewHistory[99].reviewedAt).toBe(today);
+  });
+
+  test("appendReviewHistory enforces limit", () => {
+    const rev = { reviewHistory: Array.from({ length: 3 }, (_, idx) => ({ id: `x_${idx}` })) };
+    const out = appendReviewHistory(rev, { id: "x_3", stepKey: "d1" }, 3);
+    expect(out.length).toBe(3);
+    expect(out[0].id).toBe("x_1");
+    expect(out[2].id).toBe("x_3");
+  });
 });
diff --git a/src/core/mentorAutopilot.js b/src/core/mentorAutopilot.js
index 7c5aaad9..16c29e09 100644
--- a/src/core/mentorAutopilot.js
+++ b/src/core/mentorAutopilot.js
@@ -1,169 +1,51 @@
-import { buildActionInbox, pickPrimaryAction, sortActions } from "./actionInbox";
-import { adjustActionForPeakMode, getPeakModePolicy, getPeakPhase, shouldLimitNewTopics } from "./peakMode";
-import { featureEnabled } from "./platformFeatures";
+import { buildMentorContext } from "./mentorSignals";
+import { buildMentorTodayPlan, decideMentorAction } from "./mentorDecisionPolicy";
 
-function buildAction(type, priority, title, reason, ctaView = null, target = {}) {
-  return { type, priority, title, reason, ctaView, target };
-}
-
-function toInboxAction(action = {}) {
+function normalizeLegacyContext(context = {}) {
+  if (context.scheduler) return context;
   return {
-    id: `mentor_${action.type}_${action.target?.area || action.target?.tema || "root"}`,
-    type: action.type,
-    title: action.title,
-    reason: action.reason,
-    priority: action.priority,
-    source: "mentor",
-    dueDate: action.dueDate,
-    target: { ...action.target, view: action.ctaView || action.target?.view || null },
+    plat: context.plat || "res",
+    meta: context.meta || {},
+    scheduler: {
+      overdueCount: Number(context.overdue || 0),
+      dueTodayCount: Number(context.pending || 0),
+      todayMinutes: Number(context.todayMinutes || 0),
+      overloadLevelToday: context.overloadLevelToday || "ok",
+      overloadDays: Number(context.overloadDays || 0),
+      relearningCount: Number(context.relearningCount || 0),
+      relearningItems: context.relearningItems || [],
+      missingRatingWarnings: Number(context.missingRatingWarnings || 0),
+      missingReviewedAtCount: Number(context.missingReviewedAtCount || 0),
+      nextDueItem: context.nextDueItem || null,
+      maxDelayDays: Number(context.maxDelayDays || 0),
+      trueRetentionCollecting: Boolean(context.trueRetentionCollecting),
+    },
+    enamed: context.enamed || null,
+    weakSubject: context.materiaFracaVest || context.weakSubject || null,
+    clinical: context.clinical || { dueCount: 0, dueItems: [] },
+    pendingExamAnalysis: Boolean(context.pendingExamAnalysis),
+    calendarProvider: context.calendarProvider || {},
+    userAvailableMinutes: context.userAvailableMinutes || null,
+    lowEnergy: Boolean(context.lowEnergy),
+    exhaustionDetected: Boolean(context.exhaustionDetected),
+    readinessData: context.readinessData || null,
   };
 }
 
 export function getMentorNextAction(context = {}) {
-  const plat = context.plat || "res";
-  const pending = Number(context.pending || 0);
-  const overdue = Number(context.overdue || 0);
-  const enamed = context.enamed || {};
-  const areaCritica = enamed?.resumo?.areaCritica || null;
-  const materiaFracaVest = context.materiaFracaVest || context.weakSubject || null;
-  const readiness = Number(context.readiness || 0);
-  const examDate = context.examDate || context.meta?.dataProva;
-
-  const phase = getPeakPhase({ examDate, today: context.today });
-  const policy = getPeakModePolicy(phase);
-
-  const candidates = [];
-  if (overdue > 0) {
-    candidates.push(
-      buildAction(
-        "revisao_vencida",
-        100,
-        "Resolver revisoes vencidas agora",
-        "Ha revisoes vencidas, e isso corroi retencao de curto prazo.",
-        "dash",
-        { tema: "fila_vencida" }
-      )
-    );
-  }
-  if (pending > 0) {
-    candidates.push(
-      buildAction(
-        "fila_do_dia",
-        90,
-        "Zerar fila de hoje",
-        "Completar a fila de hoje mantem cadencia e protege a ofensiva.",
-        "dash",
-        { tema: "fila_do_dia" }
-      )
-    );
-  }
-  if (featureEnabled(plat, "enamed") && areaCritica) {
-    candidates.push(
-      buildAction(
-        "enamed_critico",
-        80,
-        `Atacar lacuna de ${areaCritica}`,
-        "A analise ENAMED apontou esta area como maior gargalo recente.",
-        "stats",
-        { area: areaCritica }
-      )
-    );
-  } else if (!featureEnabled(plat, "enamed") && materiaFracaVest) {
-    candidates.push(
-      buildAction(
-        "vestibular_materia_fraca",
-        80,
-        `Reforcar ${materiaFracaVest} hoje`,
-        "Seu último simulado mostrou perda de pontos nesta matéria.",
-        "stats",
-        { area: materiaFracaVest }
-      )
-    );
-  }
-  if (readiness < 60) {
-    candidates.push(
-      buildAction(
-        "fundamentos",
-        70,
-        "Reforcar fundamentos antes de avancar",
-        featureEnabled(plat, "enamed")
-          ? "Preparo estimado ainda baixo; reduzir novidade melhora eficiencia."
-          : "Preparo estimado ainda baixo para a prova; consolidar base melhora acerto.",
-        "crono"
-      )
-    );
-  }
-
-  if (!shouldLimitNewTopics({ phase, backlog: context.backlog || pending, coverage: context.coverage || readiness })) {
-    candidates.push(
-      buildAction(
-        "new_topic",
-        55,
-        featureEnabled(plat, "enamed") ? "Iniciar tema novo estrategico" : "Iniciar matéria nova estratégica",
-        featureEnabled(plat, "enamed")
-          ? "Com a fila sob controle, o melhor ganho vem de cobertura em tema de incidencia."
-          : "Com a fila sob controle, avance na cobertura da matéria com maior peso de prova.",
-        "crono"
-      )
-    );
-  }
-
-  if (!candidates.length) {
-    return {
-      ...buildAction(
-        "manutencao",
-        10,
-        "Manter consistencia leve",
-        "Sem urgencia critica detectada. Siga o plano e preserve constancia.",
-        "dash"
-      ),
-      peakPhase: phase,
-      peakPolicy: policy,
-    };
-  }
-
-  const adapted = candidates.map((action) => adjustActionForPeakMode(toInboxAction(action), policy));
-  const inbox = buildActionInbox({
-    actions: adapted,
-    actionInboxState: context.actionInboxState || {},
-    reflectionActions: context.reflectionActions || [],
-    shouldRest: Boolean(context.lowEnergy || context.exhaustionDetected),
-  });
-  const primary = pickPrimaryAction(inbox) || sortActions(adapted)[0];
-  const fallback = candidates.find((item) => item.type === primary?.type);
-
-  return {
-    ...(fallback || {
-      type: primary?.type || "manutencao",
-      priority: primary?.priority || 10,
-      title: primary?.title || "Manter consistencia leve",
-      reason: primary?.reason || "Sem acao prioritaria.",
-      ctaView: primary?.target?.view || "dash",
-    }),
-    peakPhase: phase,
-    peakPolicy: policy,
-  };
+  return decideMentorAction(normalizeLegacyContext(context));
 }
 
 export function getMentorTodayPlan(context = {}) {
-  const next = getMentorNextAction(context);
-  const plat = context.plat || "res";
-  const plan = [next.title];
-  if (next.type !== "revisao_vencida" && Number(context.pending || 0) > 0) {
-    plan.push("Fechar a fila restante do dia");
-  }
-  if (featureEnabled(plat, "enamed") && context.enamed?.resumo?.areaCritica) {
-    plan.push(`Reservar bloco para ${context.enamed.resumo.areaCritica}`);
-  } else if (!featureEnabled(plat, "enamed") && (context.materiaFracaVest || context.weakSubject)) {
-    plan.push(`Treinar ${context.materiaFracaVest || context.weakSubject} com simulado dirigido`);
-  }
-  if (next.peakPhase && next.peakPhase !== "base") {
-    plan.push(`Aplicar politica de ${next.peakPhase.replace("_", " ")}`);
-  }
-  return plan;
+  return buildMentorTodayPlan(normalizeLegacyContext(context));
 }
 
 export function explainMentorAction(action = {}) {
-  if (!action?.title) return "Sem acao definida.";
-  return `${action.title}: ${action.reason || "sem justificativa disponivel."}`;
+  if (!action?.title) return "Sem ação definida.";
+  const explain = Array.isArray(action.explain) && action.explain.length > 0
+    ? action.explain[0]
+    : (action.reason || "sem justificativa disponível.");
+  return `${action.title}: ${explain}`;
 }
+
+export { buildMentorContext };
diff --git a/src/core/mentorAutopilot.test.js b/src/core/mentorAutopilot.test.js
index 1e9e7a61..aae74510 100644
--- a/src/core/mentorAutopilot.test.js
+++ b/src/core/mentorAutopilot.test.js
@@ -2,43 +2,41 @@ import { explainMentorAction, getMentorNextAction, getMentorTodayPlan } from "./
 
 describe("mentorAutopilot", () => {
   test("prioriza revisão vencida quando existe", () => {
-    const action = getMentorNextAction({ pending: 6, overdue: 2, readiness: 70 });
+    const action = getMentorNextAction({ overdue: 2, pending: 4 });
     expect(action.type).toBe("revisao_vencida");
+    expect(action.target).toBeDefined();
   });
 
-  test("usa lacuna ENAMED quando não há pendência urgente", () => {
-    const action = getMentorNextAction({
-      pending: 0,
-      overdue: 0,
-      enamed: { resumo: { areaCritica: "GO" } },
-      readiness: 75,
-    });
-    expect(action.type).toBe("enamed_critico");
+  test("gera ação com schema completo", () => {
+    const action = getMentorNextAction({ pending: 0, overdue: 0, userAvailableMinutes: 120 });
+    expect(action.id).toBeTruthy();
+    expect(typeof action.priority).toBe("number");
+    expect(Array.isArray(action.explain)).toBe(true);
+    expect(action.target).toBeDefined();
   });
 
-  test("gera plano de hoje com pelo menos uma ação", () => {
-    const plan = getMentorTodayPlan({ pending: 0, overdue: 0, readiness: 85 });
-    expect(Array.isArray(plan)).toBe(true);
-    expect(plan.length).toBeGreaterThan(0);
-  });
-
-  test("vest prioriza matéria fraca e não usa ação ENAMED", () => {
+  test("vest usa matéria fraca e não usa ENAMED", () => {
     const action = getMentorNextAction({
       plat: "vest",
       pending: 0,
       overdue: 0,
-      enamed: { resumo: { areaCritica: "GO" } },
       weakSubject: "Matemática",
-      readiness: 75,
+      enamed: { resumo: { areaCritica: "GO" } },
     });
     expect(action.type).toBe("vestibular_materia_fraca");
   });
 
-  test("explicação textual inclui motivo", () => {
+  test("plano diário retorna lista de ações explicáveis", () => {
+    const plan = getMentorTodayPlan({ pending: 1, overdue: 0 });
+    expect(Array.isArray(plan)).toBe(true);
+    expect(plan.length).toBeGreaterThan(0);
+  });
+
+  test("explicação textual inclui motivo estruturado", () => {
     const text = explainMentorAction({
-      title: "Zerar fila",
-      reason: "evitar acúmulo",
+      title: "Fechar fila",
+      explain: ["Evitar acúmulo nas próximas 24h."],
     });
-    expect(text).toMatch("evitar acúmulo");
+    expect(text).toMatch("Evitar acúmulo");
   });
 });
diff --git a/src/core/store.js b/src/core/store.js
index c08f2186..b63bb88c 100644
--- a/src/core/store.js
+++ b/src/core/store.js
@@ -850,42 +850,49 @@ export const useStore = create(
         get().finalizarValidacaoDominioPrevio(platKey, temaId, { questoes, acertos }),
 
       markStep: (platKey, temaId, stepKey, { acerto, previsao, questoes, motivosErro, erros, tempoMin, ansiedade, cansaco, confianca, dificuldade, foco, c1, c2, c3, c4, c5, modoReduzido, descansoPrescrito }) =>
-        set((s) => ({
-          [platKey]: {
-            ...s[platKey],
-            temas: s[platKey].temas.map((t) => {
-              if (t.id !== temaId) return t;
-              const revMarked = {
-                ...t.rev,
-                [stepKey]: {
-                  ...t.rev[stepKey],
-                  done: true,
-                  acerto,
-                  previsao,
-                  questoes,
-                  motivosErro: motivosErro || [],
-                  erros: erros || [],
-                  tempoMin: tempoMin ?? t.rev[stepKey].tempoMin,
-                  ansiedade: ansiedade ?? t.rev[stepKey].ansiedade,
-                  cansaco: cansaco ?? t.rev[stepKey].cansaco,
-                  confianca: confianca ?? t.rev[stepKey].confianca,
-                  dificuldade: dificuldade ?? t.rev[stepKey].dificuldade,
-                  foco: foco ?? t.rev[stepKey].foco,
-                  c1: c1 ?? t.rev[stepKey].c1,
-                  c2: c2 ?? t.rev[stepKey].c2,
-                  c3: c3 ?? t.rev[stepKey].c3,
-                  c4: c4 ?? t.rev[stepKey].c4,
-                  c5: c5 ?? t.rev[stepKey].c5,
-                  modoReduzido: modoReduzido ?? t.rev[stepKey].modoReduzido,
-                  descansoPrescrito: descansoPrescrito ?? t.rev[stepKey].descansoPrescrito,
-                },
-              };
-              const desiredRetention = getRetencaoArea(t.esp, s.meta?.retencaoFSRS ?? 0.90);
-              const maxInterval = s.meta?.intervaloMaxDias ?? 180;
-              return { ...t, rev: recalcAfterMark(revMarked, stepKey, acerto, desiredRetention, maxInterval, t.esp) };
-            }),
-          },
-        })),
+        set((s) => {
+          const reviewedAt = todayStr();
+          return {
+            [platKey]: {
+              ...s[platKey],
+              temas: s[platKey].temas.map((t) => {
+                if (t.id !== temaId) return t;
+                const currentStep = t.rev?.[stepKey] || {};
+                const revMarked = {
+                  ...t.rev,
+                  [stepKey]: {
+                    ...currentStep,
+                    done: true,
+                    acerto,
+                    previsao,
+                    questoes,
+                    reviewedAt,
+                    completedAt: reviewedAt,
+                    scheduledAt: currentStep.scheduledAt || currentStep.date || reviewedAt,
+                    motivosErro: motivosErro || [],
+                    erros: erros || [],
+                    tempoMin: tempoMin ?? currentStep.tempoMin,
+                    ansiedade: ansiedade ?? currentStep.ansiedade,
+                    cansaco: cansaco ?? currentStep.cansaco,
+                    confianca: confianca ?? currentStep.confianca,
+                    dificuldade: dificuldade ?? currentStep.dificuldade,
+                    foco: foco ?? currentStep.foco,
+                    c1: c1 ?? currentStep.c1,
+                    c2: c2 ?? currentStep.c2,
+                    c3: c3 ?? currentStep.c3,
+                    c4: c4 ?? currentStep.c4,
+                    c5: c5 ?? currentStep.c5,
+                    modoReduzido: modoReduzido ?? currentStep.modoReduzido,
+                    descansoPrescrito: descansoPrescrito ?? currentStep.descansoPrescrito,
+                  },
+                };
+                const desiredRetention = getRetencaoArea(t.esp, s.meta?.retencaoFSRS ?? 0.90);
+                const maxInterval = s.meta?.intervaloMaxDias ?? 180;
+                return { ...t, rev: recalcAfterMark(revMarked, stepKey, acerto, desiredRetention, maxInterval, t.esp) };
+              }),
+            },
+          };
+        }),
 
       importTemas: (platKey, items, d0) =>
         set((s) => ({
diff --git a/src/hooks/useMetrics.js b/src/hooks/useMetrics.js
index e73f6be2..f29b5ddb 100644
--- a/src/hooks/useMetrics.js
+++ b/src/hooks/useMetrics.js
@@ -328,22 +328,83 @@ export function calcBleedingScore(temas) {
 }
 
 export function calcTrueRetention(temas) {
-  const vals = [];
+  const detailed = calcTrueRetentionDetailed(temas);
+  return detailed?.pct ?? null;
+}
+
+function shouldCountLongRetentionEvent(event = {}, now = todayStr()) {
+  if (!event || event.acerto == null) return false;
+  if (event.official === false) return false;
+  if (event.stepKey === "d21") return true;
+  if (event.phase === "maintenance" || event.phaseAfter === "maintenance") return true;
+  if (Number(event.intervalBefore) >= 15) return true;
+  if (event.scheduledAt && event.reviewedAt) {
+    return Math.max(0, diffDays(event.scheduledAt, event.reviewedAt)) >= 15;
+  }
+  if (event.reviewedAt && event.previousReviewedAt) {
+    return Math.max(0, diffDays(event.previousReviewedAt, event.reviewedAt)) >= 15;
+  }
+  return false;
+}
+
+export function calcTrueRetentionDetailed(temas = []) {
+  let weightedHits = 0;
+  let weightedTotal = 0;
+  let n = 0;
+  let totalQuestoes = 0;
+  const now = todayStr();
+
   for (let i = 0; i < temas.length; i++) {
     const t = temas[i];
-    if (t.unstarted) continue;
-    for (let j = 0; j < STEPS.length; j++) {
-      const s = STEPS[j];
-      if (s.offset > 15) {
-        const r = t.rev[s.key];
-        if (r && r.done && r.acerto != null) {
-          vals.push(r.acerto);
-        }
+    if (!t || t.unstarted) continue;
+    const history = Array.isArray(t.rev?.reviewHistory) ? t.rev.reviewHistory : [];
+
+    for (let j = 0; j < history.length; j++) {
+      const event = history[j];
+      if (!shouldCountLongRetentionEvent(event, now)) continue;
+      const acerto = Number(event.acerto);
+      if (Number.isNaN(acerto)) continue;
+      const questoes = Number(event.questoes);
+      const weight = Number.isFinite(questoes) && questoes > 0 ? questoes : 1;
+      weightedHits += acerto * weight;
+      weightedTotal += weight;
+      totalQuestoes += Number.isFinite(questoes) && questoes > 0 ? questoes : 0;
+      n += 1;
+    }
+
+    if (!history.length) {
+      const d21 = t.rev?.d21;
+      if (d21?.done && d21.acerto != null) {
+        const questoes = Number(d21.questoes);
+        const weight = Number.isFinite(questoes) && questoes > 0 ? questoes : 1;
+        weightedHits += Number(d21.acerto) * weight;
+        weightedTotal += weight;
+        totalQuestoes += Number.isFinite(questoes) && questoes > 0 ? questoes : 0;
+        n += 1;
       }
     }
   }
-  if (!vals.length) return null;
-  return Math.round((vals.reduce((a, b) => a + b) / vals.length) * 100);
+
+  if (weightedTotal <= 0 || n <= 0) {
+    return {
+      value: null,
+      pct: null,
+      n: 0,
+      totalQuestoes: 0,
+      source: "d21+maintenance",
+      collecting: true,
+    };
+  }
+
+  const value = weightedHits / weightedTotal;
+  return {
+    value,
+    pct: Math.round(value * 100),
+    n,
+    totalQuestoes,
+    source: "d21+maintenance",
+    collecting: false,
+  };
 }
 
 // ─── CUSTOM REACT HOOK WRAPPERS ──────────────────────────────────────────────
diff --git a/src/hooks/useMetrics.test.js b/src/hooks/useMetrics.test.js
index 1872cb0b..d8bc4bae 100644
--- a/src/hooks/useMetrics.test.js
+++ b/src/hooks/useMetrics.test.js
@@ -99,29 +99,68 @@ describe("Metrics Calculation Test Suite", () => {
         id: 1,
         esp: "Pediatria",
         rev: {
-          d0: { done: true, acerto: 0.9 }, // Skip (not D21)
-          d21: { done: true, acerto: 0.8 } // Include
+          reviewHistory: [
+            { stepKey: "d21", reviewedAt: "2026-06-01", acerto: 0.8, questoes: 20, official: true },
+            { stepKey: "manutencao", phaseAfter: "maintenance", reviewedAt: "2026-06-10", acerto: 0.9, questoes: 10, official: true },
+          ],
+          d0: { done: true, acerto: 0.9 },
+          d21: { done: true, acerto: 0.8 }
         }
       },
       {
         id: 2,
         esp: "Clinica",
         rev: {
-          d21: { done: true, acerto: 0.6 } // Include
+          reviewHistory: [
+            { stepKey: "d21", reviewedAt: "2026-06-01", acerto: 0.6, questoes: 30, official: true },
+          ],
+          d21: { done: true, acerto: 0.6 }
         }
       },
       {
         id: 3,
         esp: "GO",
         rev: {
-          d21: { done: false, acerto: null } // Skip (not done)
+          reviewHistory: [
+            { stepKey: "d7", reviewedAt: "2026-06-01", acerto: 1.0, questoes: 50, official: true },
+          ],
+          d21: { done: false, acerto: null }
         }
       }
     ];
 
     const trueRetention = calcTrueRetention(mockTemas);
-    // Average of 80% and 60% is 70%
-    expect(trueRetention).toBe(70);
+    // Weighted: (0.8*20 + 0.9*10 + 0.6*30) / (20+10+30) = 0.716...
+    expect(trueRetention).toBe(72);
+  });
+
+  test("calcTrueRetention returns null when no long-retention evidence exists", () => {
+    const mockTemas = [
+      {
+        id: 1,
+        esp: "GO",
+        rev: {
+          reviewHistory: [{ stepKey: "d7", reviewedAt: "2026-06-01", acerto: 0.9, official: true }],
+          d7: { done: true, acerto: 0.9 },
+        },
+      },
+    ];
+    expect(calcTrueRetention(mockTemas)).toBeNull();
+  });
+
+  test("calcTrueRetention ignores unofficial review events", () => {
+    const mockTemas = [
+      {
+        id: 1,
+        esp: "GO",
+        rev: {
+          reviewHistory: [
+            { stepKey: "d21", reviewedAt: "2026-06-01", acerto: 1, questoes: 100, official: false },
+          ],
+        },
+      },
+    ];
+    expect(calcTrueRetention(mockTemas)).toBeNull();
   });
 
   test("calcBleedingScore scores the lowest areas with sufficient question counts", () => {

```

## Untracked file contents


### Cronograma_Estrategia_Extensivo_Completo.md

```txt
# Cronograma Estratégia MED — Extensivo

> Extraído do PDF enviado pelo usuário: `Cronograma Estratégia Extensivo para o Chat.pdf`.
> Observação: este arquivo é uma transcrição operacional para importação/uso pessoal no MedRev. Não trate como conteúdo oficial público da plataforma de origem.

## Resumo

- Total de semanas identificadas: **50**
- Total de tópicos identificados: **330**
- Formato: `ÁREA — Tema`

## Semana 1

- **CARDIOLOGIA** — Hipertensão Arterial Sistêmica (Parte 1): Diagnóstico, Classificação, Avaliação
- **CIRURGIA** — Trauma - Avaliação Inicial, Vias Aéreas e Trauma Torácico
- **GINECOLOGIA** — Anatomia e Embriologia do Trato Genital Feminino
- **OBSTETRÍCIA** — Modificações Fisiológicas da Gestação
- **PEDIATRIA** — Imunizações
- **PREVENTIVA** — História do SUS

## Semana 2

- **CIRURGIA** — Trauma - Choque
- **ENDOCRINO** — Introdução ao Diabetes Mellitus
- **GASTRO** — Disfagia, Alterações Estruturais e Distúrbios da Motilidade do Esôfago
- **GINECOLOGIA** — Ciclo Menstrual
- **INFECTOLOGIA** — Antibióticos
- **PEDIATRIA** — Aleitamento Materno

## Semana 3

- **CARDIOLOGIA** — Hipertensão Arterial Sistêmica (Parte 2): Tratamento
- **CIRURGIA** — Trauma Abdominal e Pélvico
- **NEFROLOGIA** — Doença Renal Crônica (DRC) - Parte I
- **OBSTETRÍCIA** — Pré-Natal
- **PEDIATRIA** — Crescimento
- **PREVENTIVA** — Princípios e Diretrizes do SUS

## Semana 4

- **CIRURGIA** — Trauma Populações Especiais (Pediátrico, Gestante e Idosos)
- **ENDOCRINO** — Diabetes Mellitus Tipo 2
- **GINECOLOGIA** — Miomatose Uterina
- **INFECTOLOGIA** — Tuberculose
- **NEURO** — Anatomia, Fisiologia e Semiologia Neurológica
- **PEDIATRIA** — Puberdade

## Semana 5

- **CARDIOLOGIA** — Hipertensão Arterial Sistêmica (Parte 3): Secundária e Crise Hipertensiva
- **CIRURGIA** — Trauma de Face e Cervical
- **OBSTETRÍCIA** — Bacia Obstétrica, Pelvimetria e Estática Fetal
- **PEDIATRIA** — Diagnóstico Nutricional
- **PNEUMO** — Introdução a Pneumologia
- **PREVENTIVA** — Marcos legais do Sistema Único de Saúde

## Semana 6

- **CIRURGIA** — Trauma Vascular de Extremidades e Musculoesquelético
- **ENDOCRINO** — Diabetes Mellitus - Insulinoterapia e Cirurgia Metabólica
- **GASTRO** — Doença do Refluxo Gastroesofágico, Esofagites Não-Pépticas e Ingestão de Corpo Estranho
- **GINECOLOGIA** — Adenomiose
- **INFECTOLOGIA** — Leptospirose
- **PEDIATRIA** — Desenvolvimento Neuropsicomotor

## Semana 7

- **CARDIOLOGIA** — Insuficiência Cardíaca (Parte 1): Classificação, Fisiopatologia, Diagnóstico
- **CIRURGIA** — Queimaduras e Trauma Elétrico
- **GINECOLOGIA** — Endometriose
- **OBSTETRÍCIA** — Mecanismo de Parto e Fases Clínicas do Parto
- **PEDIATRIA** — Deficiências Vitamínicas e Profilaxias
- **PREVENTIVA** — Financiamento em Saúde

## Semana 8

- **CIRURGIA** — Urgências Abdominais - Abdome Agudo
- **ENDOCRINO** — Diabetes Mellitus - Complicações Agudas
- **INFECTOLOGIA** — Malária
- **NEFROLOGIA** — Doença Renal Crônica (DRC) - Parte II
- **NEURO** — Coma e Alterações da Consciência
- **PEDIATRIA** — Cuidados Neonatais

## Semana 9

- **CARDIOLOGIA** — Insuficiência Cardíaca (Parte 2): Tratamento
- **CIRURGIA** — Abdome Agudo Inflamatório - Apendicite Aguda
- **GINECOLOGIA** — Pólipos Uterinos
- **OBSTETRÍCIA** — Partograma e Distocias
- **PEDIATRIA** — Reanimação neonatal
- **PREVENTIVA** — Processos de Descentralização e Regionalização do SUS

## Semana 10

- **CIRURGIA** — Abdome Agudo Inflamatório - Colecistite e Colangite Aguda
- **ENDOCRINO** — Diabetes Mellitus - Complicações Crônicas
- **GASTRO** — Anatomofisiologia Gástrica, Gastrites, Gastroparesia e Dispepsia Funcional
- **INFECTOLOGIA** — Síndrome Febril Íctero-Hemorrágica
- **PEDIATRIA** — Distúrbios Respiratórios do Período Neonatal
- **REUMATO** — Introdução à Reumatologia

## Semana 11

- **CARDIOLOGIA** — Insuficiência Cardíaca Aguda
- **CIRURGIA** — Abdome Agudo Inflamatório - Diverticulite Aguda
- **GINECOLOGIA** — Dor Pélvica Crônica e Dismenorreia
- **OBSTETRÍCIA** — Assistência ao Parto
- **PEDIATRIA** — Distúrbios Metabólicos Neonatais
- **PREVENTIVA** — Atenção Primária à Saúde

## Semana 12

- **CIRURGIA** — Abdome Agudo Perfurativo
- **ENDOCRINO** — Diabetes Mellitus - Hiperglicemia Hospitalar
- **GINECOLOGIA** — Abdome Agudo em Ginecologia
- **INFECTOLOGIA** — Neutropenia Febril e Febre de Origem Indeterminada
- **NEFROLOGIA** — Lesão Renal Aguda (LRA)
- **PEDIATRIA** — Infecções Congênitas

## Semana 13

- **CARDIOLOGIA** — Dislipidemia e Estratificação de Risco Cardiovascular
- **CIRURGIA** — Abdome Agudo Obstrutivo
- **NEURO** — Cefaleias
- **OBSTETRÍCIA** — Parto Vaginal Operatório
- **PEDIATRIA** — Icterícia e Sepse Neonatal
- **PREVENTIVA** — Políticas de Saúde

## Semana 14

- **CIRURGIA** — Abdome Agudo Vascular
- **ENDOCRINO** — Perioperatório - Controle Glicêmico e Manejo dos Glicocorticóides
- **GASTRO** — Doença Ulcerosa Péptica, IBPs e H. Pylori
- **GINECOLOGIA** — Assistência à Vítima de Violência Sexual
- **INFECTOLOGIA** — HIV
- **PEDIATRIA** — Síndromes Genéticas, Erros Inatos do Metabolismo e da Imunidade

## Semana 15

- **CARDIOLOGIA** — Doença Arterial Coronariana Estável (DAC Estável)
- **CIRURGIA** — Abdome Agudo Hemorrágico
- **OBSTETRÍCIA** — Indução do Parto e Pós-Datismo
- **PEDIATRIA** — Pneumonias na Infância
- **PNEUMO** — Derrame Pleural
- **PREVENTIVA** — Medicina de Família e Comunidade

## Semana 16

- **CIRURGIA** — Medicina Perioperatória
- **ENDOCRINO** — Tireoide - Fisiologia, Semiologia e Avaliação Diagnóstica
- **GINECOLOGIA** — Sangramento Uterino Anormal
- **INFECTOLOGIA** — Endocardite Bacteriana - Endocardite Infecciosa
- **NEFROLOGIA** — Infecção do Trato Urinário
- **PEDIATRIA** — Bronquiolite

## Semana 17

- **CARDIOLOGIA** — SCASSST - Síndrome Coronária Aguda Sem Supra do Segmento ST
- **CIRURGIA** — Resposta Endócrino-Metabólica ao Trauma
- **GINECOLOGIA** — Amenorreia
- **OBSTETRÍCIA** — Hemorragia Pós-Parto
- **PEDIATRIA** — Coqueluche
- **PREVENTIVA** — Saúde do Idoso

## Semana 18

- **CIRURGIA** — Nutrição em Cirurgia e Aceleração da Recuperação Pós-Operatória
- **ENDOCRINO** — Tireoide - Hipotireoidismo
- **GASTRO** — Anatomia e Fisiologia do Pâncreas e Neoplasias Pancreáticas
- **INFECTOLOGIA** — Arboviroses (Dengue, Chikungunya e Zika)
- **NEURO** — Demências
- **PEDIATRIA** — Asma

## Semana 19

- **CARDIOLOGIA** — IAMCSST (Infarto Agudo do Miocárdio com Supradesnivelamento de Segmento ST)
- **CIRURGIA** — Complicações Pós-Operatórias
- **GINECOLOGIA** — Síndrome dos Ovários Policísticos
- **OBSTETRÍCIA** — Infecção Puerperal
- **PEDIATRIA** — Fibrose Cística
- **PREVENTIVA** — Ética Médica

## Semana 20

- **CIRURGIA** — Cicatrização de Feridas
- **ENDOCRINO** — Tireoide - Tireotoxicose: Diagnóstico, Etiologia, Tratamento
- **INFECTOLOGIA** — Pneumonias Bacterianas
- **NEFROLOGIA** — Distúrbios Ácido-Básicos
- **PEDIATRIA** — Doenças Exantemáticas
- **PNEUMO** — Doença Pulmonar Obstrutiva Crônica (DPOC)

## Semana 21

- **CARDIOLOGIA** — Semiologia Cardíaca
- **CIRURGIA** — Hérnias da Parede Abdominal
- **GINECOLOGIA** — Planejamento Familiar
- **OBSTETRÍCIA** — Sangramento da Primeira Metade
- **PEDIATRIA** — Tuberculose na Infância
- **PREVENTIVA** — Processo Saúde-Doença

## Semana 22

- **CIRURGIA** — Cirurgia Bariátrica e Metabólica
- **ENDOCRINO** — Obesidade e Síndrome Metabólica
- **GASTRO** — Pancreatite Aguda e Crônica
- **GINECOLOGIA** — Climatério e Terapia Hormonal
- **INFECTOLOGIA** — Animais Peçonhentos
- **PEDIATRIA** — Febre na Pediatria

## Semana 23

- **CARDIOLOGIA** — Fibrilação e Flutter Atrial
- **CIRURGIA** — Vesícula e Vias Biliares
- **NEURO** — Epilepsias
- **OBSTETRÍCIA** — Sangramento da Segunda Metade
- **PEDIATRIA** — Cardiopatias Congênitas
- **PREVENTIVA** — Medidas de Saúde Coletiva - Indicadores de Morbidade

## Semana 24

- **CIRURGIA** — Proctologia
- **ENDOCRINO** — Metabolismo Ósseo e Mineral - Hipercalcemia
- **GINECOLOGIA** — Infertilidade Conjugal
- **INFECTOLOGIA** — Sepse
- **NEFROLOGIA** — Análise da Gasometria Arterial
- **PEDIATRIA** — Diarreia

## Semana 25

- **CARDIOLOGIA** — Taquiarritmias
- **CIRURGIA** — Cirurgia Infantil - Parte I
- **OBSTETRÍCIA** — Prematuridade e Trabalho de Parto Prematuro
- **PEDIATRIA** — Doença do Refluxo Gastroesofágico em Pediatria
- **PNEUMO** — Tromboembolismo Pulmonar (TEP)
- **PREVENTIVA** — Medidas de Saúde Coletiva - Indicadores de Mortalidade

## Semana 26

- **CIRURGIA** — Cirurgia Infantil - Parte II
- **ENDOCRINO** — Metabolismo Ósseo e Mineral - Hipocalcemia
- **GASTRO** — Anatomia e Fisiologia do Cólon e Síndrome do Intestino Irritável
- **GINECOLOGIA** — Síndrome Pré-Menstrual
- **INFECTOLOGIA** — Micoses Invasivas
- **PEDIATRIA** — Infecção de Trato Urinário em Pediatria

## Semana 27

- **CARDIOLOGIA** — Bradiarritmias
- **CIRURGIA** — Cirurgia Infantil - Parte III
- **GINECOLOGIA** — Cervicites
- **OBSTETRÍCIA** — Rotura Prematura de Membranas
- **PEDIATRIA** — Doença de Kawasaki
- **PREVENTIVA** — Medidas de Saúde Coletiva - Indicadores Demográficos

## Semana 28

- **CIRURGIA** — Cirurgia Vascular
- **ENDOCRINO** — Metabolismo Ósseo e Mineral - Osteoporose e Doença de Paget
- **INFECTOLOGIA** — Meningites (Infecções do SNC)
- **NEFROLOGIA** — Doenças Glomerulares
- **NEURO** — Acidentes Vasculares Cerebrais
- **PEDIATRIA** — Febre Reumática

## Semana 29

- **CARDIOLOGIA** — Parada Cardiorrespiratória (PCR)
- **CIRURGIA** — Urologia
- **GINECOLOGIA** — Doença Inflamatória Pélvica
- **OBSTETRÍCIA** — Abortamento de Repetição
- **PEDIATRIA** — Emergências Pediátricas
- **PREVENTIVA** — Processos Epidêmicos e Epidemiologia das Doenças Infecciosas

## Semana 30

- **CIRURGIA** — Cirurgia Plástica
- **ENDOCRINO** — Adrenal - Hipocortisolismo (Insuficiência Adrenal)
- **GASTRO** — Distúrbios Disabsortivos
- **INFECTOLOGIA** — Hepatoesplenomegalias Infecciosas
- **PEDIATRIA** — Choque em Pediatria
- **PNEUMO** — Pneumologia Intensiva

## Semana 31

- **CARDIOLOGIA** — Síncope
- **CIRURGIA** — Cirurgia Torácica
- **GINECOLOGIA** — Úlceras Genitais
- **OBSTETRÍCIA** — Gestação Múltipla
- **PEDIATRIA** — Convulsão Febril
- **PREVENTIVA** — Vigilância em Saúde

## Semana 32

- **CIRURGIA** — Temas Gerais em Cirurgia
- **ENDOCRINO** — Adrenal - Hipercortisolismo (Síndrome de Cushing)
- **GINECOLOGIA** — Vulvovaginites
- **INFECTOLOGIA** — Influenza
- **NEFROLOGIA** — Nefrolitíase
- **PEDIATRIA** — Anafilaxia e Urticária

## Semana 33

- **CARDIOLOGIA** — Eletrocardiograma
- **NEURO** — Doenças Neuromusculares (Neuropatias, Miopatias, Junção, Neurônio Motor)
- **OBSTETRÍCIA** — Síndromes Hipertensivas da Gestação
- **PEDIATRIA** — Hiperplasia Adrenal Congênita
- **PREVENTIVA** — Sistemas de Informação em Saúde
- **REUMATO** — Artrite Reumatoide

## Semana 34

- **ENDOCRINO** — Adrenal - Feocromocitoma, Hiperaldosteronismo e Incidentaloma
- **GASTRO** — Doença Inflamatória Intestinal
- **GINECOLOGIA** — Rastreamento do Câncer de Colo Uterino
- **HEMATO** — Introdução ao Estudo das Anemias
- **INFECTOLOGIA** — Parasitoses
- **PEDIATRIA** — Alergia Alimentar

## Semana 35

- **CARDIOLOGIA** — Síndromes Aórticas Agudas
- **OBSTETRÍCIA** — Diabetes Mellitus na Gestação
- **PEDIATRIA** — Obesidade Infantil e na Adolescência
- **PNEUMO** — Asma
- **PREVENTIVA** — Pesquisa Epidemiológica e Medidas de Associação
- **REUMATO** — Espondiloartrites

## Semana 36

- **ENDOCRINO** — Hipófise - Hiperprolactinemia
- **GINECOLOGIA** — Câncer de Colo Uterino
- **HEMATO** — Anemias Microcíticas
- **INFECTOLOGIA** — Covid 19
- **NEFROLOGIA** — Distúrbios do Potássio
- **PEDIATRIA** — Constipação Intestinal

## Semana 37

- **CARDIOLOGIA** — Choque
- **GINECOLOGIA** — Tumores Anexiais e Câncer de Ovário
- **NEURO** — Distúrbios do Movimento
- **OBSTETRÍCIA** — Sífilis na Gestação e Sífilis Congênitas
- **PEDIATRIA** — Desnutrição na Infância
- **PREVENTIVA** — Testes Diagnósticos

## Semana 38

- **ENDOCRINO** — Neoplasias Endócrinas Múltiplas
- **GASTRO** — Hemorragia Digestiva Alta Varicosa
- **HEMATO** — Anemias Macrocíticas
- **INFECTOLOGIA** — Infecções Relacionadas à Assistência em Saúde
- **PEDIATRIA** — Hipertensão Arterial na Criança e Adolescente
- **REUMATO** — Artrites Microcristalinas

## Semana 39

- **CARDIOLOGIA** — Cardiomiopatias
- **GINECOLOGIA** — Doenças de Vulva e Vagina
- **OBSTETRÍCIA** — Ultrassom em Obstetrícia
- **PEDIATRIA** — Púrpura de Hennoch Schonlein-Vasculite por IGA
- **PREVENTIVA** — Estatística Médica
- **PSIQUIATRIA** — Dependência Química

## Semana 40

- **HEMATO** — Anemias Hemolíticas
- **INFECTOLOGIA** — Raiva, Tétano, Mordedura e Arranhadura Animal
- **NEFROLOGIA** — Distúrbios do Sódio - Disnatremias
- **PEDIATRIA** — Artrite Idiopática Juvenil
- **PNEUMO** — Neoplasias Pulmonares
- **REUMATO** — Artropatias Infecciosas

## Semana 41

- **DERMATO** — Histologia e Fisiologia da Pele e Lesões Elementares
- **GINECOLOGIA** — Câncer do Corpo do Útero
- **NEURO** — Traumatismo Cranioencefálico
- **OBSTETRÍCIA** — Vitalidade Fetal
- **PEDIATRIA** — Tópicos em Pediatria
- **PREVENTIVA** — Bases de Saúde do Trabalhador e Normas Regulamentadoras

## Semana 42

- **DERMATO** — Dermatoses Infecciosas
- **GASTRO** — Hemorragia Digestiva Alta Não Varicosa
- **GINECOLOGIA** — Doenças Benignas da Mama
- **HEMATO** — Anemias Associadas a Condições Não Hematológicas
- **INFECTOLOGIA** — Sífilis e Outras ISTs
- **PSIQUIATRIA** — Transtornos do Humor
- **REUMATO** — Vasculites

## Semana 43

- **DERMATO** — Hanseníase
- **GASTRO** — Introdução a Hepatologia
- **HEMATO** — Hemostasia I: Conceitos Básicos e Anticoagulantes
- **OBSTETRÍCIA** — Alteração do Volume de Líquido Amniótico
- **ORTOPEDIA** — Doenças da Coluna Vertebral
- **OTORRINO** — Infecções de Vias Aéreas Superiores - Parte I
- **PSIQUIATRIA** — Transtornos de Ansiedade
- **REUMATO** — Doenças Autoimunes do Tecido Conjuntivo - Parte 1

## Semana 44

- **DERMATO** — Oncologia Cutânea (Câncer de Pele)
- **GASTRO** — Hepatites Virais
- **GINECOLOGIA** — Rastreamento do Câncer de Mama
- **HEMATO** — Hemostasia II: Doenças Hemostáticas
- **NEFROLOGIA** — Túbulo-Interstício Renal
- **ORTOPEDIA** — Doenças do Ombro e Cotovelo
- **OTORRINO** — Infecções de Vias Aéreas Superiores - Parte II
- **PSIQUIATRIA** — Transtornos Psicóticos
- **REUMATO** — Doenças Autoimunes do Tecido Conjuntivo - Parte 2

## Semana 45

- **DERMATO** — Dermatoses Eczematosas
- **GINECOLOGIA** — Câncer de Mama
- **HEMATO** — Leucemias Agudas
- **NEURO** — Distúrbios do Sono
- **OBSTETRÍCIA** — Restrição de Crescimento Fetal e Óbito Fetal
- **OFTALMO** — Síndrome do Olho Vermelho
- **ORTOPEDIA** — Doenças da Mão e Síndromes Compressivas
- **OTORRINO** — Infecções de Vias Aéreas Superiores - Parte III
- **PSIQUIATRIA** — Intoxicações Exógenas
- **REUMATO** — Doenças do Osso e da Cartilagem

## Semana 46

- **DERMATO** — Farmacodermias
- **GASTRO** — Hemorragia Digestiva Baixa
- **GASTRO** — Cirrose Hepática
- **GINECOLOGIA** — Incontinência Urinária
- **HEMATO** — Leucemias Crônicas, Linfomas, Mielodisplasias
- **OFTALMO** — Córnea e Cristalino
- **ORTOPEDIA** — Oncologia Ortopédica e Osteomielite
- **OTORRINO** — Otoneurologia, Vertigens e Audiologia
- **PSIQUIATRIA** — Psiquiatria Infantil
- **REUMATO** — Síndromes Dolorosas Crônicas

## Semana 47

- **DERMATO** — Dermatoses Papuloescamosas
- **GASTRO** — Neoplasias de Estômago e Esôfago
- **GINECOLOGIA** — Prolapso de Órgãos Pélvicos
- **HEMATO** — Mieloma Múltiplo (Gamopatias Monoclonais)
- **OBSTETRÍCIA** — Infecções Congênitas na Gestação
- **ORTOPEDIA** — Quadril Pediátrico
- **ORTOPEDIA** — Ombro e Joelho Pediátrico
- **OTORRINO** — Cirurgia de Cabeça e Pescoço - Laringologia, Apneia
- **PSIQUIATRIA** — Transtornos Alimentares
- **REUMATO** — Reumatologia Pediátrica

## Semana 48

- **DERMATO** — Dermatoses Vesicobolhosas
- **GASTRO** — Polipose Intestinal e Câncer Colorretal
- **GASTRO** — Outras Causas de Hepatopatia Crônica
- **HEMATO** — Medicina Transfusional
- **OFTALMO** — Glaucoma
- **ORTOPEDIA** — Desenvolvimento Ortopédico da Criança
- **ORTOPEDIA** — Maus Tratos
- **OTORRINO** — Cirurgia de Cabeça e Pescoço - Nódulos Tireoide
- **PSIQUIATRIA** — Transtornos de Personalidade
- **REUMATO** — Miscelânea

## Semana 49

- **DERMATO** — Síndromes Verrucosas
- **GASTRO** — Hepatopatias Autoimunes
- **GASTRO** — Complicações da Cirrose Hepática
- **NEURO** — Doenças Desmielinizantes e Encefalites Autoimunes
- **OBSTETRÍCIA** — Aloimunização Materna e Doença Hemolítica Perinatal
- **ORTOPEDIA** — Conceitos Básicos do Trauma Ortopédico
- **ORTOPEDIA** — Fratura Exposta
- **OTORRINO** — Cirurgia de Cabeça e Pescoço - Neoplasias Benignas e Malignas
- **PSIQUIATRIA** — Psicofarmacologia
- **PSIQUIATRIA** — TOC, Transtornos Somáticos, Dissociativos e Estresse

## Semana 50

- **DERMATO** — Piodermites
- **DERMATO** — Miscelânea
- **GASTRO** — Síndrome Hepatorrenal e Síndrome Hepatopulmonar
- **GASTRO** — Tumores Hepáticos
- **OFTALMO** — Distúrbios da Refração
- **ORTOPEDIA** — Complicações do Trauma Ortopédico
- **ORTOPEDIA** — Fraturas e Luxações
- **ORTOPEDIA** — Politrauma Ortopédico
- **PSIQUIATRIA** — Psicopatologia
- **PSIQUIATRIA** — Psiquiatria Social e Reforma Psiquiátrica

```

### MEDREV_BLOCO_K_FSRS_LITE_V2_MENTOR_PREP.md

```txt
# MEDREV — BLOCO K: FSRS-lite v2, Relearning, Review History, True Retention e Preparação para Auditoria do Mentor

> **Executor:** Codex / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `high` para execução normal; `xhigh` se houver regressão no store, muitos testes quebrados ou conflito com o Modo Mentor.  
> **Modo:** agent com aprovação manual.  
> **Objetivo:** corrigir e evoluir o scheduler atual inspirado em FSRS sem trocar toda a arquitetura. Implementar hardening do FSRS-lite, histórico real de revisões, relearning, True Retention ponderada, workload por minutos e preparar dados confiáveis para uma auditoria posterior do Mentor.

---

## 0. Contexto técnico

O projeto usa React/CRA + Zustand + Tailwind + Firebase.

O scheduler atual é um **FSRS-lite**, não FSRS completo. Ele combina:

```txt
D0 → D1 → D4 → D7 → D21
+ manutenção pós-D21
+ estabilidade S
+ dificuldade D
+ rating derivado de acerto
+ fila inteligente por desempenho/prova/incidência
```

Comportamento atual observado:

```txt
acerto <55%   → again
55–74%        → hard
75–89%        → good
>=90%         → easy
```

Quando o aluno vai mal (`again`), o sistema atual tende a:

```txt
reabrir a mesma etapa
marcar done=false
agendar a mesma etapa para amanhã
```

Exemplo:

```txt
D7 ruim → D7 volta amanhã
D21 ruim → D21 volta amanhã
```

Ele **não volta para D0 automaticamente**, o que é bom. Porém falta uma política mais rica para falha grave, relearning e recalibração das datas seguintes.

---

## 1. Problemas que este bloco precisa resolver

### P0 — Alta prioridade

1. **Data real da revisão ausente ou inconsistente**
   - `date` representa data agendada.
   - Falta `reviewedAt` / `completedAt` consistente.
   - Retrievability, atraso, mentor e histórico ficam imprecisos.

2. **`acerto == null` não pode virar `good`**
   - Se o aluno marca algo sem acerto/rating, o scheduler não pode assumir bom desempenho.
   - Isso cria falso avanço.

3. **Manutenção salva intervalo potencialmente divergente**
   - Se `nextInt` foi calculado com `maxInterval`/dificuldade, o campo salvo deve refletir `nextInt`.
   - Não salvar `prevInterval * 2` se a data usou outro valor.

4. **True Retention precisa incluir D21 + manutenção**
   - Hoje a retenção longa fica estreita demais.
   - Deve incluir revisões longas e manutenções, ponderadas por número de questões quando disponível.

5. **Workload precisa ser por tempo estimado, não só contagem**
   - 5 revisões D1 não equivalem a 5 revisões D21.
   - O Mentor precisa saber minutos estimados e sobrecarga real.

### P1 — Prioridade alta/média

6. **Criar `reviewHistory`**
   - Guardar eventos de revisão sem sobrescrever evidência antiga.
   - Limitar histórico para evitar crescimento infinito.

7. **Criar estado formal de fase**
   - `learning`
   - `review`
   - `relearning`
   - `maintenance`

8. **Política de falha grave**
   - Falha leve: repetir mesma etapa.
   - Falha grave: voltar 1–2 etapas, mas não necessariamente D0.
   - Recalcular/empurrar etapas futuras para evitar calendário incoerente.

9. **Bônus pequeno de recuperação**
   - Se o aluno entra em relearning e recupera bem, estabilidade pode crescer um pouco mais.
   - Bônus pequeno, não explosivo.

10. **Corrigir bugs periféricos**
   - Exemplo: `fmtMonth` se estiver parseando `YYYY-MM-DD` errado.
   - Corrigir apenas bugs comprovados.

### P2 — Preparação para Mentor

11. Expor sinais confiáveis para o Mentor:
   - atraso real;
   - minutos estimados;
   - fase do tema;
   - status de relearning;
   - risco de sobrecarga;
   - retenção longa ponderada;
   - estabilidade/dificuldade antes/depois;
   - quantidade de revisões por fase.

---

## 2. Regras inegociáveis

Antes de editar:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Durante a edição:

- Não instalar bibliotecas.
- Não converter tudo para FSRS real agora.
- Não remover D0/D1/D4/D7/D21.
- Não quebrar dados antigos do Zustand/localStorage.
- Não apagar progresso do usuário.
- Não fazer commit/deploy/push.
- Não mascarar teste quebrado.
- Não mexer no Mentor profundamente neste bloco; apenas preparar dados e criar relatório para auditoria posterior.
- Manter UTF-8 sem BOM.
- Não introduzir mojibake.
- Não fazer refactor cosmético amplo.
- Corrigir apenas o necessário para o scheduler ficar confiável.

---

## 3. Arquivos prováveis

Audite e altere conforme arquitetura real:

```txt
src/core/fsrs.js                         [PATCH PRINCIPAL]
src/core/store.js                        [PATCH]
src/core/useMetrics.js                   [PATCH]
src/core/readiness.js                    [PATCH mínimo, se consumir retenção/workload]
src/core/mastery.js                      [PATCH mínimo, se consumir estado/datas]
src/core/mentorAutopilot.js              [PREPARAÇÃO mínima ou apenas adapters]
src/core/fsrs.test.js                    [CRIAR/PATCH]
src/core/scheduler.test.js               [CRIAR se fizer sentido]
src/core/mentorAuditReadiness.js         [NOVO, relatório de sinais para auditoria do Mentor]
src/core/mentorAuditReadiness.test.js    [NOVO]
```

Se algum arquivo não existir, procure equivalente. Não invente duplicata se já houver core equivalente.

---

## 4. FASE K0 — Auditoria inicial do scheduler

Antes de implementar, rode buscas:

```bash
grep -R "function .*fsrs\|buildRev\|recalcAfterMark\|toRating\|nextInterval\|calcTrueRetention\|getRetrievability\|manutencao\|D21\|d21" -n src/core src/components || true
grep -R "markStep\|registrar\|reviewHistory\|reviewedAt\|completedAt\|acerto\|questoes" -n src/core src/components || true
grep -R "getWorkloadProjection\|Carga\|workload\|mentorAutopilot" -n src || true
```

PowerShell equivalente:

```powershell
Select-String -Path "src\**\*" -Pattern "buildRev","recalcAfterMark","toRating","nextInterval","calcTrueRetention","getRetrievability","manutencao","markStep","reviewHistory","reviewedAt","getWorkloadProjection","mentorAutopilot" -CaseSensitive:$false
```

Documente internamente:

```txt
1. onde a revisão é criada;
2. onde o aluno marca revisão;
3. como o rating é derivado;
4. como S/D são atualizados;
5. como datas futuras são calculadas;
6. como manutenção funciona;
7. como True Retention é calculada;
8. como workload entra no Dashboard/Mentor.
```

Não responda ao usuário ainda. Implemente depois da auditoria.

---

## 5. FASE K1 — Datas reais: `reviewedAt`, `scheduledAt` e migração defensiva

### 5.1 Objetivo

Diferenciar:

```txt
scheduledAt/date = quando era para revisar
reviewedAt       = quando realmente revisou
```

### 5.2 Regras

- Não remover `date`, para compatibilidade.
- Adicionar `reviewedAt` quando etapa for marcada como feita.
- Adicionar `scheduledAt` se ainda não existir.
- Em dados antigos:
  - se `done === true` e não há `reviewedAt`, usar `date` como fallback.
  - não fazer migração destrutiva.

### 5.3 Implementação

Ao criar revisão em `buildRev`, cada step deve ter:

```js
{
  date: "...",
  scheduledAt: "...",
  reviewedAt: null,
  done: false,
  acerto: null,
  questoes: null,
  S,
  D,
  motivosErro: []
}
```

Ao marcar etapa concluída:

```js
step.reviewedAt = todayStr()
step.completedAt = todayStr() // opcional, se padrão do app já usa completedAt
```

Se estiver reagendando por `again`:

```js
step.done = false
step.reviewedAt = null
step.acerto = null
step.questoes = null
step.date = addDays(todayStr(), 1)
step.scheduledAt = step.date
```

No `reviewHistory`, o evento deve preservar o `reviewedAt` que acabou de ocorrer, mesmo se a etapa for reaberta.

---

## 6. FASE K2 — Rating seguro: `acerto == null` não vira `good`

### 6.1 Problema

Se `toRating(null)` retorna `good`, qualquer UI incompleta pode avançar o aluno indevidamente.

### 6.2 Regra nova

```js
toRating(null) → null
toRating(undefined) → null
```

Se determinada etapa não usa acerto numérico, ela deve fornecer rating explícito ou score qualitativo:

```txt
Não lembrei → again
Parcial → hard
Lembrei bem → good/easy
```

### 6.3 Implementação

Ajustar `toRating`:

```js
export function toRating(acerto) {
  if (acerto == null || Number.isNaN(Number(acerto))) return null;
  const pct = Number(acerto);
  if (pct < 55) return "again";
  if (pct < 75) return "hard";
  if (pct < 90) return "good";
  return "easy";
}
```

No `recalcAfterMark`:

- Se rating `null`, não recalcular S/D.
- Ou exigir `ratingManual`.
- Não avançar automaticamente.

Retorno recomendado:

```js
{
  ...rev,
  meta: {
    ...rev.meta,
    schedulerWarning: "missing_rating"
  }
}
```

Mas não quebrar UI. Se a UI precisa marcar uma etapa sem questões, solicitar rating manual.

---

## 7. FASE K3 — Review History real

### 7.1 Objetivo

Registrar cada evento de revisão.

Adicionar por tema:

```js
reviewHistory: [
  {
    id: "rev_...",
    stepKey: "d7",
    phaseBefore: "review",
    phaseAfter: "relearning",
    scheduledAt: "2026-06-01",
    reviewedAt: "2026-06-04",
    atrasoDias: 3,
    acerto: 42,
    questoes: 20,
    rating: "again",
    severity: "common" | "severe",
    S_before: 7,
    S_after: 3.1,
    D_before: 0.55,
    D_after: 0.70,
    intervalBefore: 7,
    intervalAfter: 1,
    source: "fsrs-lite",
  }
]
```

### 7.2 Regras

- Limitar a 100 eventos por tema.
- Não sobrescrever eventos antigos.
- Refazer/treino livre, se existir, pode entrar com `official: false`.
- Eventos oficiais entram com `official: true`.

### 7.3 Helpers

Criar no `fsrs.js` ou arquivo core apropriado:

```js
export function appendReviewHistory(temaOrRev, event, limit = 100) {}

export function getLastOfficialReview(history = []) {}

export function getLastReviewForStep(history = [], stepKey) {}
```

Se o histórico fica no tema e não no `rev`, adaptar ao shape real.

---

## 8. FASE K4 — Política de falha: same-step, downgrade e relearning

### 8.1 Objetivo

Substituir a regra simplista “again sempre repete a mesma etapa amanhã” por uma regra mais inteligente.

### 8.2 Severidade

Criar:

```js
export function getAgainSeverity(acerto) {
  if (acerto == null) return null;
  return Number(acerto) < 30 ? "severe" : "common";
}
```

### 8.3 Tabela desejada

| Etapa atual | Again comum | Again grave |
|---|---|---|
| D0 | repetir D0 amanhã | repetir D0 amanhã |
| D1 | repetir D1 amanhã | D0 ou D1 amanhã |
| D4 | repetir D4 amanhã | voltar para D1 amanhã |
| D7 | repetir D7 amanhã | voltar para D4 amanhã |
| D21 | repetir D21 em 2 dias | voltar para D7 amanhã |
| Manutenção | manutenção curta em 3–7 dias | voltar para D7 amanhã |

Regras:

- Não voltar para D0 sempre.
- D0 é aquisição inicial, não punição universal.
- Falha grave em D21/manutenção vira `relearning`.
- Falha comum repete etapa atual.

### 8.4 Função nova

```js
export function resolveAgainPolicy(stepKey, acerto, context = {}) {
  // retorna:
  // {
  //   targetStep: "d7",
  //   delayDays: 1,
  //   phaseAfter: "relearning",
  //   severity: "severe",
  //   shouldPushFuture: true
  // }
}
```

### 8.5 Relearning

Adicionar estado:

```js
phase: "learning" | "review" | "relearning" | "maintenance"
```

Função:

```js
export function inferPhaseFromStep(stepKey, manutencao = false) {
  if (manutencao) return "maintenance";
  if (["d0", "d1", "d4", "d7"].includes(stepKey)) return "learning";
  if (stepKey === "d21") return "review";
  return "learning";
}
```

Quando falha grave em D7/D21/manutenção:

```js
phase = "relearning"
relearning = {
  fromStep: stepKey,
  targetStep,
  startedAt: todayStr(),
  reason: "again_severe"
}
```

### 8.6 Empurrar datas futuras

Se o aluno voltou para uma etapa anterior, empurrar etapas futuras para não ficarem incoerentes.

Exemplo:

```txt
D7 grave → volta para D4 amanhã
D7 novo = D4 + 3 a 5 dias
D21 novo = D7 + 10 a 18 dias
```

Implementar helper conservador:

```js
export function pushFutureStepsAfterDowngrade(rev, targetStep, targetDate, options = {}) {}
```

Regras mínimas:

```js
D1 depois de D0: +1 dia
D4 depois de D1: +3 dias
D7 depois de D4: +3 dias
D21 depois de D7: +14 dias
```

Não alterar steps já concluídos, exceto se forem posteriores e logicamente inválidos? Preferência:

- Steps concluídos permanecem no histórico.
- Steps futuros `done:false` são empurrados.
- Se step posterior já estava `done:true`, não apagar; mas relearning deve criar uma nova trilha/estado. Se isso for complexo, não sobrescrever concluídos, apenas agendar target e manutenção/relearning.

---

## 9. FASE K5 — Estabilidade e bônus de recuperação

### 9.1 Regra atual

`again` reduz S, `easy` aumenta bastante.

### 9.2 Regra nova

Não aumentar agressivamente por recuperação.

Se o tema está em `relearning` e o aluno acerta bem:

```txt
rating = good → S_new *= 1.05
rating = easy → S_new *= 1.10 a 1.15
rating = hard → sem bônus
rating = again → continua relearning
```

Criar:

```js
export function applyRelearningRecoveryBonus(S, rating, context = {}) {
  if (!context?.wasRelearning) return S;
  if (rating === "easy") return S * 1.12;
  if (rating === "good") return S * 1.05;
  return S;
}
```

Aplicar após cálculo normal de S.

Limitar com clamp se já existir.

---

## 10. FASE K6 — Manutenção correta

### 10.1 Correção do intervalo

Quando calcular `nextInt`, salvar:

```js
interval: nextInt
```

Não salvar:

```js
interval: prevInterval * 2
```

a menos que `nextInt === prevInterval * 2`.

Se quiser preservar alvo teórico:

```js
targetInterval: prevInterval * 2
```

### 10.2 Falha em manutenção

Se manutenção `again`:

- comum:
  ```txt
  manutenção curta em 3–7 dias
  phase = maintenance
  ```
- grave:
  ```txt
  voltar para D7 amanhã
  phase = relearning
  ```

Não voltar para D0.

---

## 11. FASE K7 — True Retention ponderada

### 11.1 Objetivo

Incluir:

```txt
D21 + manutenções + revisões longas no reviewHistory
```

### 11.2 Regras

- Só incluir revisões com maturidade suficiente:
  - `stepKey === "d21"`, ou
  - `phase === "maintenance"`, ou
  - `intervalBefore >= 15`, ou
  - `scheduledAt/reviewedAt` com atraso desde última revisão >=15 dias.
- Ponderar por `questoes`, se existir.
- Se `questoes` ausente, peso = 1.
- Ignorar acerto ausente.
- Retornar `null` se não houver dados.

Função:

```js
export function calcTrueRetention(temasOrState, options = {}) {
  // retornar:
  // {
  //   value: 0.82,
  //   pct: 82,
  //   n: 12,
  //   totalQuestoes: 180,
  //   source: "d21+maintenance",
  //   collecting: false
  // }
}
```

Se a API atual espera só número, manter compatibilidade:

```js
export function calcTrueRetentionValue(...) {}
```

ou retornar shape antigo onde usado, adaptando UI.

### 11.3 Texto de UI

Quando sem dados:

```txt
Coletando D21+
```

Quando com dados:

```txt
Retenção longa 82%
```

Não chamar de True Retention se UI para usuário comum estiver em PT-BR.

---

## 12. FASE K8 — Workload por minutos

### 12.1 Custo estimado por etapa

Criar:

```js
export const STEP_ESTIMATED_MINUTES = {
  d0: 45,
  d1: 12,
  d4: 25,
  d7: 30,
  d21: 35,
  manutencao: 25,
  relearning: 20,
};
```

Ajuste se o projeto já usa outros tempos.

### 12.2 `getWorkloadProjection`

Retornar por dia:

```js
{
  date: "YYYY-MM-DD",
  count: 5,
  estimatedMinutes: 130,
  items: [...],
  overload: true,
  overloadLevel: "ok" | "moderate" | "high"
}
```

Critérios sugeridos:

```js
<=60 min ok
61–120 moderate
>120 high
```

Ou usar config do usuário, se existir.

### 12.3 Mentor

Não reescrever o Mentor neste bloco.

Apenas garantir que `mentorAutopilot` consegue consumir:

```js
workloadProjection[].estimatedMinutes
workloadProjection[].overloadLevel
```

Se necessário, criar adapter:

```js
export function getSchedulerSignalsForMentor(state, plat) {}
```

---

## 13. FASE K9 — Retrievability usando revisão real

### 13.1 Problema

Não usar só a data agendada.

### 13.2 Regra

`getRetrievability` deve usar:

```txt
última revisão oficial real
reviewedAt
```

Fallbacks:

1. `reviewHistory` último evento oficial.
2. `step.reviewedAt`.
3. `step.date` em dados antigos concluídos.
4. `tema.createdAt` ou hoje.

### 13.3 Função

```js
export function getLastReviewedAt(tema, stepKey) {}
```

Depois:

```js
elapsedDays = diffDays(todayStr(), lastReviewedAt)
R = Math.exp(-elapsedDays / S)
```

ou fórmula atual equivalente.

---

## 14. FASE K10 — Correções periféricas

Corrigir bugs pequenos comprovados:

### 14.1 `fmtMonth`

Se houver:

```js
const [, m, y] = d.split("-");
```

para data `YYYY-MM-DD`, corrigir:

```js
const [y, m] = d.split("-");
```

### 14.2 Imports não usados

Corrigir warnings óbvios gerados pelas mudanças.

### 14.3 BOM/mojibake

Rodar `npm run check:mojibake`.

---

## 15. FASE K11 — Preparar terreno para auditoria do Mentor

### 15.1 Não refatorar o Mentor ainda

Este bloco deve apenas criar os sinais e um relatório de saúde.

Criar:

```txt
src/core/mentorAuditReadiness.js
```

Funções:

```js
export function collectSchedulerSignalsForMentor(context = {}) {}

export function auditMentorInputCompleteness(context = {}) {}

export function buildMentorAuditSnapshot(context = {}) {}
```

### 15.2 `collectSchedulerSignalsForMentor`

Retornar:

```js
{
  trueRetention: {
    pct,
    n,
    totalQuestoes,
    collecting
  },
  workload: {
    todayMinutes,
    next7DaysMinutes,
    overloadDays,
    maxDayMinutes
  },
  overdue: {
    count,
    maxDelayDays,
    items
  },
  relearning: {
    count,
    items
  },
  stability: {
    medianS,
    lowStabilityCount
  },
  difficulty: {
    highDifficultyCount,
    areas
  },
  reviewHealth: {
    missingReviewedAtCount,
    missingRatingCount,
    historyEvents
  }
}
```

### 15.3 `auditMentorInputCompleteness`

Checar se o Mentor tem dados suficientes:

```js
{
  ok: true/false,
  missing: ["workload", "trueRetention", "calendarProvider"],
  warnings: ["trueRetention ainda coletando", "muitos temas sem reviewHistory"],
  recommendations: [...]
}
```

### 15.4 Objetivo

A próxima auditoria do Mentor deve conseguir responder:

```txt
O Mentor recomenda ações com base em dados reais?
Ele usa atraso real ou data agendada?
Ele considera workload em minutos?
Ele evita tema novo quando há sobrecarga?
Ele sabe quando o aluno está em relearning?
Ele não interpreta retenção coletando como preparo alto?
```

---

## 16. Testes obrigatórios

Criar ou atualizar testes.

### 16.1 `src/core/fsrs.test.js`

Cobrir:

1. `toRating(null)` retorna `null`.
2. D7 com `again` comum repete D7 amanhã.
3. D7 com `again` grave volta para D4 amanhã.
4. D21 com `again` grave entra em relearning.
5. Manutenção com `again` grave volta para D7/relearning.
6. Relearning com `easy` aplica bônus pequeno.
7. Manutenção salva `interval: nextInt`.
8. `reviewedAt` é salvo ao marcar revisão.
9. `reviewHistory` recebe evento.
10. Histórico é limitado.

### 16.2 True Retention

Testar:

1. retorna `null` sem D21/manutenção.
2. inclui D21.
3. inclui manutenção.
4. pondera por questões.
5. ignora acerto ausente.

### 16.3 Workload

Testar:

1. retorna count e estimatedMinutes.
2. D0 pesa mais que D1.
3. marca overload quando passa limite.
4. próximos 7/14 dias funcionam.

### 16.4 Mentor audit readiness

Criar:

```txt
src/core/mentorAuditReadiness.test.js
```

Cobrir:

1. detecta falta de reviewHistory.
2. detecta true retention coletando.
3. calcula overloadDays.
4. lista relearning count.
5. retorna recomendações de auditoria.

---

## 17. QA manual

Depois dos testes:

1. Criar tema novo.
2. Fazer D0 com acerto bom.
3. Confirmar D1/D4/D7/D21.
4. Fazer D7 com 40%.
   - Deve repetir D7 amanhã.
5. Fazer D7 com 20%.
   - Deve voltar para D4 amanhã ou entrar em relearning conforme política.
6. Confirmar que D21 futuro não fica incoerente.
7. Fazer D21 com 20%.
   - Deve entrar em relearning, não voltar D0.
8. Fazer manutenção com erro grave.
   - Deve voltar para D7/relearning.
9. Fazer recuperação com easy.
   - S cresce com bônus pequeno.
10. Ver True Retention coletando antes de D21.
11. Ver True Retention após D21/manutenção.
12. Ver Carga futura com minutos.
13. Confirmar Dashboard/Mentor não quebraram.
14. Confirmar Vestibular não quebrou.
15. Confirmar build.

---

## 18. Comandos finais

Ao fim:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
git status --short
```

Não executar:

```bash
git commit
firebase deploy
git push
```

sem autorização explícita.

---

## 19. Critérios de aceite

Bloco K aprovado se:

- `toRating(null)` não retorna `good`.
- Revisões concluídas têm `reviewedAt`.
- Dados antigos não quebram.
- `reviewHistory` existe e é preenchido.
- Falha comum repete etapa.
- Falha grave regride 1–2 etapas, não sempre D0.
- D21/manutenção grave entram em `relearning`.
- Datas futuras não ficam absurdamente incoerentes.
- Relearning tem bônus pequeno de recuperação.
- Manutenção salva `interval` real.
- True Retention inclui D21 + manutenção e pondera por questões.
- Workload retorna minutos estimados.
- Retrievability usa revisão real.
- Mentor recebe sinais preparados por `mentorAuditReadiness`.
- Testes passam.
- Build passa.
- Mojibake passa.

---

## 20. Nota final ao executor

Não tente transformar o scheduler em FSRS científico completo agora.

A meta é tornar o motor atual confiável:

```txt
datas reais
falha tratada corretamente
relearning sem punição excessiva
retenção longa honesta
workload realista
sinais bons para o Mentor
```

Depois desse bloco, a próxima etapa será auditar o Mentor para garantir que ele usa esses sinais corretamente.

```

### MEDREV_BLOCO_L_v2_MENTOR_POS_K.md

```txt
# MEDREV — BLOCO L v2: Mentor Decision Engine pós-FSRS-lite v2

> **Executor:** Codex / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `xhigh`  
> **Modo:** agent com aprovação manual.  
> **Objetivo:** refatorar o Mentor para usar dados reais do FSRS-lite v2, corrigindo antes as inconsistências detectadas no delta do Bloco K. O Mentor deve virar motor de decisão explicável, com sinais confiáveis de revisão, workload, relearning, retenção longa, calendário/provider, ENAMED, Vestibular, casos clínicos e Action Inbox.

---

## 0. Diagnóstico pós-Bloco K

O Bloco K avançou bastante:

- `getWorkloadProjection` agora retorna objeto por dia com `count`, `estimatedMinutes`, `items`, `overload` e `overloadLevel`.
- `toRating(null)` agora retorna `null`.
- `buildRev` e `normalizeTema` passaram a incluir `scheduledAt`, `reviewedAt`, `phase`, `reviewHistory` e `relearning`.
- `recalcAfterMark` ganhou política de `again`, `relearning`, `reviewHistory`, manutenção com `interval` real e bônus de recuperação.
- `calcTrueRetention` passou a usar histórico e ponderação por questões.
- Build e mojibake passaram no delta enviado.

Mas há correções obrigatórias antes de auditar/implementar o Mentor.

---

## 1. P0/P1 antes do Mentor

### 1.1 Bug: falha grave pode deixar a etapa original como `done: true`

No fluxo atual do delta:

```txt
D7 grave → targetStep D4
```

Mas `markStep` marca D7 como `done:true` antes de chamar `recalcAfterMark`. Em `recalcAfterMark`, quando a política manda voltar para D4, o código agenda D4, mas não garante que D7 volte para `done:false`.

Risco:

```txt
O aluno falha D7, entra em relearning, mas D7 continua registrado como concluído.
```

Isso quebra:

- fila;
- retrievability;
- Mentor;
- readiness;
- true retention futura;
- coerência do cronograma.

#### Correção obrigatória

Em qualquer `rating === "again"`:

1. Registrar o evento no `reviewHistory`.
2. Limpar o estado operacional da etapa original falhada:
   ```js
   nextRev[doneKey] = {
     ...nextRev[doneKey],
     done: false,
     reviewedAt: null,
     completedAt: null,
     acerto: null,
     questoes: null,
     lastFailedAt: now,
     lastFailedAcerto: normalizeAcerto(acerto),
     lastFailedRating: "again",
   };
   ```
3. Se `policy.targetStep !== doneKey`, limpar/reabrir também as etapas futuras dependentes, pelo menos:
   ```txt
   targetStep, steps depois do targetStep até d21, manutenção se existir e estiver futura
   ```
4. Preservar resultado antigo apenas no `reviewHistory`.

Regra de produto:

```txt
Histórico guarda o que aconteceu.
Estado operacional mostra o que falta fazer.
```

---

### 1.2 Bug: `rating == null` ainda pode deixar step `done:true`

No delta, `toRating(null)` retorna `null`, mas `store.markStep` já marcou a etapa como `done:true` antes de `recalcAfterMark`.

Quando `recalcAfterMark` detecta `rating == null`, ele retorna `rev` com `schedulerWarning`, mas não desfaz o `done:true`.

Risco:

```txt
Etapa sem acerto/rating pode sumir da fila sem atualização S/D.
```

#### Correção obrigatória

Escolher uma das duas abordagens:

##### Opção A — bloquear no store

Em `markStep`, antes de marcar `done:true`:

```js
if (acerto == null && ratingManual == null) {
  // não marca a etapa como feita
  // registra warning/toast se houver mecanismo
  return state;
}
```

##### Opção B — reverter em `recalcAfterMark`

Se `rating == null`:

```js
return {
  ...rev,
  [doneKey]: {
    ...rev[doneKey],
    done: false,
    reviewedAt: null,
    completedAt: null,
    acerto: null,
    questoes: null,
  },
  meta: {
    ...(rev.meta || {}),
    schedulerWarning: "missing_rating",
  },
};
```

Recomendação: **Opção B + teste**, porque protege qualquer chamada futura.

---

### 1.3 True Retention deve ignorar eventos `official:false`

O cálculo novo de retenção longa percorre `reviewHistory`, mas precisa ignorar explicitamente tentativas não oficiais:

```js
if (event.official === false) continue;
```

Risco:

```txt
Refazer caso/revisão livre ou treino não oficial pode inflar ou derrubar a retenção longa.
```

Corrigir em `calcTrueRetentionDetailed`.

---

### 1.4 `mentorAuditReadiness.js` está untracked e não foi incluído no diff completo

No audit enviado, aparecem:

```txt
?? src/core/mentorAuditReadiness.js
?? src/core/mentorAuditReadiness.test.js
```

Mas o `git diff` padrão não inclui conteúdo de arquivos untracked. Então ainda não dá para auditar a implementação desses arquivos.

#### Correção do script de auditoria

Atualizar `scripts/audit.mjs` para também incluir untracked relevantes:

```js
run("Untracked files", "git ls-files --others --exclude-standard");

appendFileSync(out, "\n## Untracked file contents\n\n", "utf8");
const untracked = execSync("git ls-files --others --exclude-standard", { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((f) => f.startsWith("src/") || f.startsWith("scripts/") || f.endsWith(".md"));

for (const file of untracked) {
  appendFileSync(out, `\n### ${file}\n\n\`\`\`txt\n`, "utf8");
  appendFileSync(out, readFileSync(file, "utf8"), "utf8");
  appendFileSync(out, "\n```\n", "utf8");
}
```

---

## 2. Bloco L agora deve consumir o FSRS-lite v2

O Mentor não deve mais raciocinar em cima de contagens simples.

### 2.1 Workload mudou de shape

Antes:

```js
projection[date] = 3;
```

Agora:

```js
projection[date] = {
  date,
  count,
  estimatedMinutes,
  items,
  overload,
  overloadLevel,
};
```

Qualquer código do Mentor que faça:

```js
Object.values(proj).reduce((a, b) => a + b, 0)
```

está errado.

Deve fazer:

```js
Object.values(proj).reduce((sum, day) => sum + (day?.estimatedMinutes || 0), 0)
```

ou para contagem:

```js
Object.values(proj).reduce((sum, day) => sum + (day?.count || 0), 0)
```

### 2.2 Mentor deve ler sinais do scheduler

Criar/ajustar `src/core/mentorSignals.js` para retornar:

```js
{
  scheduler: {
    workloadProjection,
    todayCount,
    todayMinutes,
    next7DaysMinutes,
    overloadLevelToday,
    overloadDays,
    maxDayMinutes,

    overdueCount,
    dueTodayCount,
    maxDelayDays,
    nextDueItem,

    relearningCount,
    relearningItems,

    missingRatingWarnings,
    missingReviewedAtCount,
    reviewHistoryEvents,

    trueRetentionPct,
    trueRetentionN,
    trueRetentionTotalQuestoes,
    trueRetentionCollecting,
  }
}
```

### 2.3 Mentor deve distinguir “coletando” de dado confiável

Se `trueRetentionCollecting === true`, o Mentor não pode interpretar como preparo alto ou baixo. Ele deve dizer:

```txt
Retenção longa ainda coletando; vou priorizar revisões vencidas, carga e desempenho recente.
```

---

## 3. Política de decisão do Mentor pós-K

A ordem de prioridade deve ser:

```txt
P0 — dados inválidos / scheduler warning crítico
P1 — sobrecarga alta
P2 — relearning
P3 — revisões vencidas
P4 — revisão de hoje
P5 — prova/simulado pendente de análise
P6 — gargalo ENAMED ou matéria fraca
P7 — caso clínico devido
P8 — tema novo se carga permite
P9 — Anki/check rápido
P10 — descanso/bloco leve
```

### 3.1 Bloqueio de tema novo

Nunca recomendar tema novo se:

```js
scheduler.overloadLevelToday === "high"
scheduler.overloadDays >= 2
scheduler.relearningCount > 0
scheduler.overdueCount > 0
scheduler.todayMinutes > userAvailableMinutes * 1.2
```

Fallback se não houver `userAvailableMinutes`:

```txt
>120 minutos hoje = alta carga
```

### 3.2 Relearning ganha de tema novo

Se há `relearningItems`:

```txt
Ação principal: recuperar tema instável
Motivo: queda significativa recente; recuperar agora custa menos do que abrir tema novo.
```

### 3.3 Revisões vencidas ganham de ENAMED

Se há revisão vencida, o Mentor não deve pular direto para hot topic ENAMED.

```txt
Preservar retenção primeiro; depois gargalo ENAMED.
```

### 3.4 Caso clínico só para Residência

Se `plat === "vest"`:

- não sugerir caso clínico;
- não sugerir illness script;
- não sugerir ENAMED como ação principal.

### 3.5 Vestibular

Para `plat === "vest"`, usar:

```txt
revisão vencida
matéria fraca em simulado
tema novo do cronograma
carga futura
proximidade da prova
descanso
```

---

## 4. Arquitetura-alvo do Mentor

Criar/ajustar:

```txt
src/core/mentorSignals.js
src/core/mentorDecisionPolicy.js
src/core/mentorAutopilot.js
src/core/mentorSignals.test.js
src/core/mentorDecisionPolicy.test.js
src/core/mentorAutopilot.test.js
```

Manter:

```txt
src/core/mentor.js
```

Mas `mentor.js` deve virar camada legada/narrativa:

```txt
frases
voz
diagnóstico textual
compatibilidade com Dashboard antigo
```

Não deve ser o motor principal de próxima ação.

---

## 5. Schema único de ação

Toda ação do Mentor deve ter:

```js
{
  id,
  type,
  priority,
  title,
  subtitle,
  reason,
  explain: [],
  cta,
  ctaView,
  estimatedMinutes,
  confidence,
  safety,
  source,
  target,
}
```

Exemplo:

```js
{
  type: "relearning",
  priority: 96,
  title: "Recuperar Apendicite Aguda",
  reason: "Tema entrou em reaprendizado após queda em D7.",
  explain: [
    "Você teve queda significativa em uma revisão longa.",
    "Abrir tema novo agora aumentaria a carga futura.",
    "Recuperar em 24–48h tende a custar menos tempo."
  ],
  cta: "Recuperar agora",
  ctaView: "focus",
  estimatedMinutes: 20,
  safety: "caution",
  target: {
    temaId,
    stepKey: "d4",
    phase: "relearning"
  }
}
```

---

## 6. Ajustes obrigatórios no Bloco L original

Substituir o início do Bloco L anterior por estas pré-fases:

### L0 — Validar pós-K

Antes de qualquer Mentor:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Depois rodar testes específicos:

```bash
npm test -- --watchAll=false --testPathPattern=fsrs
npm test -- --watchAll=false --testPathPattern=useMetrics
npm test -- --watchAll=false --testPathPattern=mentorAuditReadiness
```

Se `testPathPattern` não funcionar no CRA, usar o teste completo.

### L0.1 — Corrigir bug de etapa falhada ainda concluída

Adicionar testes:

```js
test("D7 severe again clears D7 operational done state", () => {
  const updated = recalcAfterMark(markedD7, "d7", 0.2);
  expect(updated.d7.done).toBe(false);
  expect(updated.d4.done).toBe(false);
  expect(updated.phase).toBe("relearning");
});

test("D21 severe again clears D21 operational done state", () => {
  const updated = recalcAfterMark(markedD21, "d21", 0.2);
  expect(updated.d21.done).toBe(false);
  expect(updated.d7.done).toBe(false);
});
```

### L0.2 — Corrigir rating ausente

Adicionar teste:

```js
test("missing rating does not leave step completed", () => {
  const updated = recalcAfterMark(markedD1WithoutAcerto, "d1", null);
  expect(updated.d1.done).toBe(false);
  expect(updated.meta.schedulerWarning).toBe("missing_rating");
});
```

### L0.3 — True Retention ignora treino livre

Adicionar teste:

```js
test("true retention ignores unofficial review events", () => {
  const temas = [{
    rev: {
      reviewHistory: [
        { stepKey: "d21", acerto: 1, questoes: 100, official: false },
      ],
    },
  }];
  expect(calcTrueRetention(temas)).toBeNull();
});
```

---

## 7. Dashboard depois do Mentor

O Dashboard deve usar:

```js
buildMentorContext(state, plat)
getMentorNextAction(context)
getMentorTodayPlan(context)
```

A ação principal deve ser a fonte do “Comando do Dia”.

Não chamar diretamente `proximaAcao` como motor principal, exceto como wrapper legado.

---

## 8. Testes mínimos do Mentor v2

Criar/atualizar:

```txt
src/core/mentorSignals.test.js
src/core/mentorAutopilot.test.js
src/core/mentorDecisionPolicy.test.js
```

Cobrir:

1. sobrecarga alta bloqueia tema novo;
2. relearning ganha de tema novo;
3. revisão vencida ganha de ENAMED;
4. true retention coletando não vira preparo alto;
5. ação sempre tem `target`;
6. ação sempre tem `explain`;
7. `plat === "vest"` não gera ação ENAMED;
8. `plat === "vest"` não gera caso clínico;
9. provider ativo influencia tema novo;
10. ação de prova pendente aparece quando fila está segura.

---

## 9. Critérios de aceite v2

Este Bloco L v2 só está aprovado se:

- bugs pós-K foram corrigidos;
- etapa falhada não permanece `done:true`;
- rating ausente não conclui etapa;
- true retention ignora eventos não oficiais;
- Mentor lê workload por minutos;
- Mentor lê relearning;
- Mentor lê true retention com estado `collecting`;
- Mentor bloqueia tema novo em sobrecarga;
- Mentor separa Residência e Vestibular;
- Dashboard usa autopilot real;
- `mentor.js` não é mais o motor principal da próxima ação;
- testes passam;
- build passa;
- mojibake passa.

---

## 10. Comando para o executor

Execute esta versão depois do Bloco K:

```txt
Corrija primeiro as inconsistências pós-K listadas neste Bloco L v2. Depois refatore o Mentor para consumir os sinais novos. Pare ao primeiro erro de teste/build causado por alteração recente e corrija antes de avançar. Não faça commit, deploy ou push.
```

```

### MEDREV_BLOCO_M_REORGANIZADO_EM_SUBBLOCOS.md

```txt
# MEDREV — BLOCO M REORGANIZADO: Auditoria Geral dividida em sub-blocos executáveis

> **Executor:** Codex / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Estratégia:** não executar o M inteiro. Executar **M0 → M1 → M2 → M3 → M4 → M5**, um por vez.  
> **Pré-condição crítica:** executar o **Bloco N — Multiusuário/Auth/Isolamento de dados** antes de qualquer sub-bloco que registre histórico, activity log, backup ou dados persistentes novos.

---

## 0. Por que o Bloco M original ficou grande demais

O M original junta cinco mudanças de produto diferentes:

```txt
1. arquitetura de informação / sidebar;
2. governança de métricas;
3. centro de erros e ações corretivas;
4. raciocínio clínico v2 dentro do FSRS;
5. calendário histórico/activity log;
6. reorganização de Stats/Mentor.
```

Isso é grande demais para um único patch seguro.

Riscos se executar tudo junto:

```txt
- Codex alucinar arquivos/funções;
- quebrar navegação;
- criar UI sem core;
- criar core sem UI;
- misturar activity log com store ainda sem isolamento por uid;
- poluir Dashboard;
- quebrar Vestibular;
- aumentar muito o bundle;
- gerar dívida nova.
```

Portanto, o Bloco M deve virar uma **série de sub-blocos**, cada um com objetivo claro, testes e critério de aceite.

---

# Ordem correta

## P0 antes de tudo

Executar primeiro:

```txt
Bloco N — Multiusuário/Auth/Isolamento de dados
```

Motivo: Activity log, histórico, backup, calendário e ações corretivas são dados privados. Não faz sentido construir isso se ainda há risco de dados de usuários diferentes se misturarem.

Depois:

```txt
Bloco K — FSRS-lite v2
Bloco L v2 — Mentor Decision Engine pós-FSRS
```

Depois executar M dividido:

```txt
M0 — Auditoria geral sem implementação pesada
M1 — Navegação + arquitetura de informação
M2 — Métricas + Centro de Erros
M3 — Raciocínio Clínico v2 + FSRS multimodal
M4 — Activity Log + Calendário histórico/futuro
M5 — Stats/Mentor unificados + polish final
```

---

# M0 — Auditoria Geral de Integração

## Objetivo

Auditar o produto atual sem sair implementando.

Descobrir:

```txt
- quais features existem;
- quais aparecem na sidebar;
- quais têm core mas não UI;
- quais têm UI mas não persistem;
- quais alimentam o Mentor;
- quais alimentam Stats;
- quais registram eventos;
- onde há duplicidade;
- onde Vestibular está vazando feature médica;
- onde métricas confundem;
- onde Raciocínio Clínico está desconectado.
```

## Arquivos esperados

Não criar feature grande.

Pode criar apenas:

```txt
docs/MEDREV_AUDITORIA_GERAL_M0.md
```

## Comandos de auditoria

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build

grep -R "setView\|view ===\|Sidebar\|BottomNav" -n src || true
grep -R "Raciocinio\|Raciocínio\|illness\|sct\|casosProgresso" -n src || true
grep -R "mentor\|Mentor\|ActionInbox\|proximaAcao" -n src || true
grep -R "metric\|Preparo\|Retenção\|readiness\|coletando" -n src || true
grep -R "erro\|motivoErro\|tipoErro\|errorTaxonomy" -n src || true
grep -R "activityLog\|reviewHistory\|weeklyReviews\|sessionReflection" -n src || true
```

## Entrega

Gerar relatório:

```txt
docs/MEDREV_AUDITORIA_GERAL_M0.md
```

Com tabela:

```txt
Feature | Local UI | Core | Store | Mentor usa? | Stats usa? | Evento registrado? | Problema | Prioridade
```

## Critério de aceite

- Nenhuma feature alterada.
- Relatório claro.
- Lista de P0/P1/P2.
- Próximos sub-blocos priorizados.

---

# M1 — Navegação e arquitetura de informação

## Objetivo

Reduzir a confusão da sidebar sem remover funções.

## Regra de produto

O usuário comum deve ver poucos caminhos:

```txt
Hoje
Plano
Estudar
Estatísticas
Banco de Dados
Mais
```

Dentro de `Mais`:

```txt
Raciocínio Clínico
Simulados / ENAMED
Anki Audit
Weekly Review
Data Safety
Guia
Ajustes
```

## Criar

```txt
src/core/navigationModel.js
src/core/navigationModel.test.js
```

## Schema

```js
{
  id: "today",
  label: "Hoje",
  view: "dash",
  icon: "LayoutDashboard",
  primary: true,
  platforms: ["res", "vest"],
}

{
  id: "clinical-reasoning",
  label: "Raciocínio Clínico",
  view: "raciocinio",
  primary: false,
  group: "more",
  platforms: ["res"],
}
```

## Funções

```js
getPrimaryNavItems(plat, features)
getMoreNavItems(plat, features)
resolveViewLabel(view, plat)
```

## Patch provável

```txt
src/components/Sidebar.jsx
src/components/BottomNav.jsx
src/App.js
src/core/platformFeatures.js
```

## Regras

- Não remover feature.
- Apenas reorganizar.
- Vestibular não deve ver Raciocínio Clínico/ENAMED como item principal.
- Mobile deve ter no máximo 4–5 itens.

## Testes

```txt
res tem Raciocínio em Mais;
vest não tem Raciocínio;
itens principais <= 5;
view antiga continua resolvendo.
```

## Critério de aceite

- Sidebar menos poluída.
- Todas as features continuam acessíveis.
- Mobile fica mais limpo.
- Build/testes passam.

---

# M2 — Métricas e Centro de Erros

## Objetivo

Transformar métricas e erros em orientação concreta.

## Parte A — Métricas

Criar:

```txt
src/core/metricsRegistry.js
src/core/metricsRegistry.test.js
```

Schema:

```js
{
  id: "trueRetention",
  label: "Retenção longa",
  shortLabel: "Retenção",
  owner: "fsrs",
  description: "Estimativa baseada em revisões D21+ e manutenção.",
  confidenceRule: "requires_long_reviews",
  emptyState: "Coletando D21+",
  actionWhenLow: "Priorizar revisões longas e reduzir tema novo.",
  dashboardLevel: "compact",
  platforms: ["res", "vest"],
}
```

Regras:

```txt
- Dashboard só mostra métrica que leva a ação.
- Stats explica as métricas.
- Sem dados = coletando, não 100%.
- Baixo n = baixa confiança.
```

## Parte B — Centro de Erros

Criar:

```txt
src/core/errorActionMap.js
src/core/errorActionMap.test.js
src/components/ErrorActionCenter.jsx
```

Tipos mínimos:

```txt
conteudo
memoria
raciocinio
representacao_problema
diferencial
incerteza_sct
conduta_prescricao
interpretacao
distracao
tempo
confianca_mal_calibrada
estrategia_prova
```

Exemplo de ação corretiva:

```js
{
  type: "raciocinio",
  label: "Raciocínio",
  definition: "Você tinha dados, mas não organizou hipóteses ou fechou cedo.",
  correctiveActions: [
    "Fazer caso clínico guiado.",
    "Escrever problem representation.",
    "Listar 3 diferenciais e 1 não-pode-perder.",
    "Fazer SCT curto."
  ],
  preferredTask: "clinical_case",
}
```

## Patch provável

```txt
src/components/StatsPanel.jsx
src/components/EnamedProvaAnalyzer.jsx
src/components/SessionClosureModal.jsx
src/core/provaAnalyzer.js
src/core/errorTaxonomy.js
src/core/mentorAutopilot.js
```

## Regras

- Não criar nova aba principal se a sidebar já estiver cheia.
- Colocar em Estatísticas ou Mais.
- Vestibular usa subset sem “conduta/prescrição”.

## Critério de aceite

- Usuário entende tipos de erro.
- Cada erro tem ação corretiva.
- Mentor consegue usar `preferredTask`.
- Stats mostra erro dominante com recomendação.

---

# M3 — Raciocínio Clínico v2 + FSRS multimodal

## Objetivo

Tirar Raciocínio Clínico do isolamento e integrá-lo ao ciclo de revisão.

## Tese

Raciocínio Clínico deve ter dois modos:

```txt
1. Caso completo
2. Revisão curta dentro do FSRS
```

## Modo A — Caso completo

Fluxo:

```txt
1. Vinheta
2. Problem representation
3. Hipóteses + must-not-miss
4. Illness script de memória
5. SCT / nova informação
6. Conduta e prescrição simulada
7. Diagnóstico final + feedback + reencontro
```

## Modo B — Revisão FSRS multimodal

Para temas clínicos:

```txt
D1: Brain dump estruturado
D4: Illness Script recall
D7: Mini caso + diferenciais
D21: SCT curto + conduta
Manutenção: caso rápido ou prescrição simulada
```

## Criar

```txt
src/core/reviewTaskPlanner.js
src/core/reviewTaskPlanner.test.js
src/core/clinicalReasoningScoring.js
src/core/clinicalReasoningScoring.test.js
```

## Função principal

```js
getReviewTaskForStep({ tema, stepKey, history, errors, platform })
```

Retorna:

```js
{
  taskType: "questions" | "brain_dump" | "illness_script" | "mini_case" | "sct" | "management_station" | "anki",
  title,
  instructions,
  estimatedMinutes,
  requiredInputs,
  scoring,
}
```

## Brain dump estruturado para temas grandes

Campos:

```txt
1. Definição/quadro geral
2. Diagnóstico
3. Diferenciais/armadilhas
4. Conduta
5. Não pode perder
```

## Conduta e prescrição simulada

Campos:

```txt
1. Primeira medida / estabilização
2. Exames iniciais
3. Tratamento inicial
4. Medicações/classes/doses se houver checklist
5. Interna ou ambulatorial?
6. Red flags / contraindicações
7. Seguimento
```

Aviso obrigatório:

```txt
Uso educacional. Não usar para paciente real.
```

## Regras

- Não aplicar illness script a todo tema.
- Aplicar a temas clínicos/síndromes/emergências/casos seed.
- Preventiva conceitual, bioestatística, história do SUS: usar questions/brain dump, não illness script.

## Patch provável

```txt
src/components/RaciocinioClinico.jsx
src/components/FocusMode.jsx
src/core/fsrs.js
src/core/store.js
src/core/casosClinicos.js ou constants/casosClinicos.js
src/core/mentorAutopilot.js
```

## Critério de aceite

- Raciocínio Clínico vira tarefa de revisão quando adequado.
- Conduta/prescrição é cobrada educacionalmente.
- Brain dump é estruturado para temas grandes.
- Erro clínico gera ação corretiva.
- Mentor pode recomendar “mini caso”, “illness script” ou “management station”.

---

# M4 — Activity Log + Calendário histórico/futuro

## Pré-condição obrigatória

Executar **Bloco N** antes.

## Objetivo

Criar um histórico rastreável do que foi feito e do que está por vir.

## Criar

```txt
src/core/activityLog.js
src/core/activityLog.test.js
src/components/ActivityCalendar.jsx
src/components/ActivityDayDrawer.jsx
src/components/ActivityDetailModal.jsx
```

## Schema

```js
{
  id: "actevt_...",
  platform: "res" | "vest",
  type: "fsrs_review" | "focus_session" | "clinical_case" | "exam_analysis" | "anki" | "simulado" | "calendar_import" | "weekly_review" | "mentor_action" | "domain_validation",
  status: "scheduled" | "completed" | "skipped" | "failed" | "rescheduled",
  title: "D7 — Apendicite Aguda",
  startAt: "2026-06-01T08:30:00",
  endAt: "2026-06-01T09:05:00",
  date: "2026-06-01",
  source: "focus_mode",
  target: {
    temaId,
    stepKey,
    casoId,
    provaId,
    actionId
  },
  summary: {
    acerto,
    questoes,
    rating,
    estimatedMinutes,
    actualMinutes,
    errors,
    score
  },
  snapshot: {
    brainDump,
    problemRep,
    hypotheses,
    managementPlan,
    sctAnswers,
    feedback
  },
  createdAt,
  updatedAt
}
```

## Retenção

```js
MAX_ACTIVITY_EVENTS = 5000
MAX_SNAPSHOT_CHARS = 4000
MAX_RICH_DETAIL_DAYS = 30
MAX_HISTORY_MONTHS = 12
```

## Eventos a registrar

```txt
markStep
domínio prévio
caso clínico
Modo Foco
prova/simulado
Anki
importação de calendário
ação do Mentor
Weekly Review
```

## UI

```txt
Calendário
[Hoje] [Semana] [Mês]

Dia expandido:
08:00 — D1 Apendicite
09:10 — Caso Pré-eclâmpsia
14:30 — Simulado ENAMED
```

Clique mostra:

```txt
tipo
tema
etapa
horário
duração
questões/acertos
brain dump
hipóteses
conduta/prescrição
erros
próxima revisão
```

## Critério de aceite

- Mostra passado do último mês com detalhe.
- Mostra histórico até 12 meses resumido.
- Mostra tarefas futuras.
- Clicar abre detalhe.
- Não explode localStorage.
- É user-scoped pelo Bloco N.

---

# M5 — Stats/Mentor unificados + polish final

## Objetivo

Conectar tudo ao Mentor e reorganizar Estatísticas.

## Stats reorganizadas

Tabs/seções:

```txt
Resumo
Aprendizagem
Erros
Raciocínio Clínico
Provas/Simulados
Atividade
Sistema
```

## Mentor deve usar

```txt
activityLog
errorActionMap
reviewTaskPlanner
metricsRegistry
FSRS-lite v2
calendar provider
clinical reasoning
prova/simulado
platformFeatures
```

Exemplos de ação nova:

```txt
"Fazer D7 de Apendicite como mini caso"
"Recuperar SCA com Illness Script de memória"
"Revisar erro de conduta em pré-eclâmpsia"
"Hoje não abra tema novo; sua carga estimada já passou de 120 min"
```

## Regras

- Não criar mais cards no topo do Dashboard.
- Dashboard mostra ação principal e 2 próximas.
- Stats guarda diagnóstico profundo.
- Mentor explica porquê.

## Critério de aceite

- Mentor usa erros e activity log.
- Stats fica organizado por domínio.
- Dashboard fica limpo.
- Vestibular preservado.
- Build/testes passam.

---

# Como executar

## Comando para M0

```txt
Execute somente o M0 do MEDREV_BLOCO_M_REORGANIZADO.md. Não implemente features. Audite e gere docs/MEDREV_AUDITORIA_GERAL_M0.md. Rode check:mojibake, testes e build. Não faça commit, deploy ou push.
```

## Comando para M1

```txt
Execute somente o M1. Reorganize a navegação com navigationModel, sem remover features. Rode check:mojibake, testes e build. Não faça commit, deploy ou push.
```

## Comando para M2

```txt
Execute somente o M2. Crie metricsRegistry e ErrorActionCenter/errorActionMap. Integre sem poluir Dashboard. Rode check:mojibake, testes e build.
```

## Comando para M3

```txt
Execute somente o M3. Implemente reviewTaskPlanner e Raciocínio Clínico v2 integrado ao FSRS. Inclua conduta/prescrição simulada educacional. Rode check:mojibake, testes e build.
```

## Comando para M4

```txt
Execute somente o M4, mas apenas depois do Bloco N. Crie activityLog e calendário histórico/futuro user-scoped. Rode check:mojibake, testes e build.
```

## Comando para M5

```txt
Execute somente o M5. Reorganize Stats e conecte Mentor aos sinais criados. Rode check:mojibake, testes e build.
```

---

# Modelo recomendado

Para M0:

```txt
gpt-5.3-codex
effort: xhigh
```

Para M1–M5:

```txt
gpt-5.3-codex
effort: high
```

Use `xhigh` se mexer simultaneamente em Dashboard + Store + Mentor + Activity Log.

---

# Nota final

O M original era uma visão correta, mas grande demais.

A versão dividida evita o erro clássico:

```txt
mais features soltas
mais confusão
mais dívida técnica
```

A regra agora é:

```txt
cada sub-bloco deve registrar evento, corrigir erro, alimentar métrica e ser usado pelo Mentor.
```

```

### audit/ASK_CHATGPT.md

```txt

```

### scripts/audit.mjs

```txt
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from "node:fs";

mkdirSync("audit", { recursive: true });

const out = "audit/ASK_CHATGPT.md";

function run(title, command) {
  appendFileSync(out, `\n## ${title}\n\n\`\`\`txt\n`, "utf8");

  try {
    const result = execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
      maxBuffer: 1024 * 1024 * 50,
    });

    appendFileSync(out, result || "(sem saída)\n", "utf8");
  } catch (err) {
    const stdout = err.stdout?.toString?.() || "";
    const stderr = err.stderr?.toString?.() || "";
    appendFileSync(out, `${stdout}\n${stderr}\n`, "utf8");
  }

  appendFileSync(out, "\n```\n", "utf8");
}

writeFileSync(
  out,
  `# ASK_CHATGPT — Auditoria automática

Aja como auditor sênior de engenharia de software. Audite somente o delta abaixo. Procure regressões, bugs, integração incompleta, problemas de arquitetura, encoding, testes, build, UX e riscos de dados persistidos. Priorize P0/P1/P2 e diga exatamente o que corrigir.

`,
  "utf8"
);

run("Git status", "git status --short");
run("Diff stat", "git diff --stat");
run("Changed files", "git diff --name-only");
run("Untracked files", "git ls-files --others --exclude-standard");

appendFileSync(out, "\n## Full diff\n\n```diff\n", "utf8");
try {
  const diff = execSync("git diff -- src package.json package-lock.json public", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    maxBuffer: 1024 * 1024 * 100,
  });
  appendFileSync(out, diff || "(sem diff)\n", "utf8");
} catch (err) {
  appendFileSync(out, `${err.stdout || ""}\n${err.stderr || ""}\n`, "utf8");
}
appendFileSync(out, "\n```\n", "utf8");

appendFileSync(out, "\n## Untracked file contents\n\n", "utf8");
let untrackedFiles = [];
try {
  untrackedFiles = execSync("git ls-files --others --exclude-standard", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    maxBuffer: 1024 * 1024 * 10,
  })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => file.startsWith("src/") || file.startsWith("scripts/") || file.endsWith(".md"));
} catch {
  untrackedFiles = [];
}

for (const file of untrackedFiles) {
  appendFileSync(out, `\n### ${file}\n\n\`\`\`txt\n`, "utf8");
  try {
    appendFileSync(out, readFileSync(file, "utf8"), "utf8");
  } catch (err) {
    appendFileSync(out, `erro ao ler ${file}: ${String(err?.message || err)}\n`, "utf8");
  }
  appendFileSync(out, "\n```\n", "utf8");
}

run("Mojibake check", "npm run check:mojibake");
run("Tests", "npm test -- --watchAll=false");
run("Build", "npm run build");

console.log(`Arquivo criado: ${out}`);

```

### src/core/mentorAuditReadiness.js

```txt
import { STEPS, todayStr, diffDays, getWorkloadProjection } from "./fsrs";
import { calcTrueRetentionDetailed } from "../hooks/useMetrics";

function median(values = []) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function collectLatestStep(rev = {}) {
  if (rev?.manutencao?.S != null) return rev.manutencao;
  for (let i = STEPS.length - 1; i >= 0; i--) {
    const step = rev[STEPS[i].key];
    if (step?.S != null) return step;
  }
  return null;
}

export function collectSchedulerSignalsForMentor(context = {}) {
  const temas = context.temas || [];
  const horizonDays = context.horizonDays || 7;
  const today = context.today || todayStr();

  const trueRetention = calcTrueRetentionDetailed(temas);
  const workloadProjection = getWorkloadProjection(temas, horizonDays);
  const workloadDays = Object.values(workloadProjection);
  const todayEntry = workloadProjection[today] || { estimatedMinutes: 0 };

  const overdueItems = [];
  const relearningItems = [];
  const stabilityValues = [];
  let lowStabilityCount = 0;
  const highDifficultyAreas = {};
  let highDifficultyCount = 0;
  let missingReviewedAtCount = 0;
  let missingRatingCount = 0;
  let historyEvents = 0;

  for (let i = 0; i < temas.length; i++) {
    const tema = temas[i];
    if (!tema || tema.unstarted) continue;
    const rev = tema.rev || {};
    const history = Array.isArray(rev.reviewHistory) ? rev.reviewHistory : [];
    historyEvents += history.length;

    if (rev.phase === "relearning" || rev.relearning?.startedAt) {
      relearningItems.push({
        temaId: tema.id,
        temaNome: tema.nome,
        area: tema.esp,
        fromStep: rev.relearning?.fromStep || null,
        targetStep: rev.relearning?.targetStep || null,
      });
    }

    const latestStep = collectLatestStep(rev);
    if (latestStep?.S != null) {
      stabilityValues.push(latestStep.S);
      if (latestStep.S < 5) lowStabilityCount += 1;
    }
    if (latestStep?.D != null && latestStep.D >= 0.7) {
      highDifficultyCount += 1;
      highDifficultyAreas[tema.esp || "Outro"] = (highDifficultyAreas[tema.esp || "Outro"] || 0) + 1;
    }

    for (let j = 0; j < STEPS.length; j++) {
      const key = STEPS[j].key;
      const step = rev[key];
      if (!step) continue;
      if (!step.done && step.date && step.date < today) {
        overdueItems.push({
          temaId: tema.id,
          temaNome: tema.nome,
          area: tema.esp,
          stepKey: key,
          date: step.date,
          delayDays: Math.max(0, diffDays(step.date, today)),
        });
      }
      if (step.done && !step.reviewedAt) {
        missingReviewedAtCount += 1;
      }
      if (step.done && step.acerto == null) {
        missingRatingCount += 1;
      }
    }
  }

  const overloadDays = workloadDays.filter((day) => day.overloadLevel !== "ok").length;
  const next7DaysMinutes = workloadDays.reduce((sum, day) => sum + (day.estimatedMinutes || 0), 0);
  const maxDayMinutes = workloadDays.reduce((max, day) => Math.max(max, day.estimatedMinutes || 0), 0);
  const maxDelayDays = overdueItems.reduce((max, item) => Math.max(max, item.delayDays || 0), 0);

  return {
    trueRetention: {
      pct: trueRetention.pct,
      n: trueRetention.n,
      totalQuestoes: trueRetention.totalQuestoes,
      collecting: trueRetention.collecting,
    },
    workload: {
      todayMinutes: todayEntry.estimatedMinutes || 0,
      next7DaysMinutes,
      overloadDays,
      maxDayMinutes,
    },
    overdue: {
      count: overdueItems.length,
      maxDelayDays,
      items: overdueItems.slice(0, 25),
    },
    relearning: {
      count: relearningItems.length,
      items: relearningItems.slice(0, 25),
    },
    stability: {
      medianS: median(stabilityValues),
      lowStabilityCount,
    },
    difficulty: {
      highDifficultyCount,
      areas: Object.entries(highDifficultyAreas)
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => b.count - a.count),
    },
    reviewHealth: {
      missingReviewedAtCount,
      missingRatingCount,
      historyEvents,
    },
  };
}

export function auditMentorInputCompleteness(context = {}) {
  const signals = context.signals || collectSchedulerSignalsForMentor(context);
  const missing = [];
  const warnings = [];
  const recommendations = [];

  if (!signals.workload || signals.workload.next7DaysMinutes == null) {
    missing.push("workload");
  }
  if (!signals.trueRetention || signals.trueRetention.collecting) {
    warnings.push("trueRetention ainda coletando");
    if (!signals.trueRetention || signals.trueRetention.pct == null) {
      missing.push("trueRetention");
    }
  }
  if ((signals.reviewHealth?.historyEvents || 0) <= 0) {
    warnings.push("muitos temas sem reviewHistory");
    missing.push("reviewHistory");
  }
  if ((signals.reviewHealth?.missingReviewedAtCount || 0) > 0) {
    warnings.push("existem revisões concluídas sem reviewedAt");
    recommendations.push("rodar migração defensiva de reviewedAt para temas legados");
  }
  if ((signals.workload?.overloadDays || 0) >= 3) {
    recommendations.push("evitar tema novo até reduzir sobrecarga da semana");
  }
  if ((signals.relearning?.count || 0) > 0) {
    recommendations.push("priorizar temas em relearning antes de expansão de cobertura");
  }

  return {
    ok: missing.length === 0,
    missing: Array.from(new Set(missing)),
    warnings: Array.from(new Set(warnings)),
    recommendations: Array.from(new Set(recommendations)),
  };
}

export function buildMentorAuditSnapshot(context = {}) {
  const signals = collectSchedulerSignalsForMentor(context);
  const completeness = auditMentorInputCompleteness({ ...context, signals });
  return {
    generatedAt: todayStr(),
    signals,
    completeness,
  };
}

```

### src/core/mentorAuditReadiness.test.js

```txt
import {
  collectSchedulerSignalsForMentor,
  auditMentorInputCompleteness,
  buildMentorAuditSnapshot,
} from "./mentorAuditReadiness";
import { todayStr, addDays } from "./fsrs";

describe("mentorAuditReadiness", () => {
  test("detects lack of reviewHistory and marks completeness as not ok", () => {
    const today = todayStr();
    const temas = [
      {
        id: 1,
        nome: "Tema A",
        esp: "GO",
        rev: {
          phase: "learning",
          d0: { done: true, date: addDays(today, -1), reviewedAt: null, acerto: null },
          d1: { done: false, date: today },
        },
      },
    ];

    const audit = auditMentorInputCompleteness({ temas });
    expect(audit.ok).toBe(false);
    expect(audit.missing).toContain("reviewHistory");
  });

  test("flags true retention as collecting when no D21+ evidence exists", () => {
    const today = todayStr();
    const temas = [
      {
        id: 1,
        nome: "Tema B",
        esp: "Cirurgia",
        rev: {
          phase: "learning",
          reviewHistory: [],
          d0: { done: true, date: addDays(today, -1), reviewedAt: addDays(today, -1), acerto: 0.8 },
          d1: { done: false, date: today },
        },
      },
    ];

    const signals = collectSchedulerSignalsForMentor({ temas });
    expect(signals.trueRetention.collecting).toBe(true);
  });

  test("computes overloadDays from minute-based workload", () => {
    const today = todayStr();
    const temas = Array.from({ length: 5 }).map((_, idx) => ({
      id: idx + 1,
      nome: `Tema ${idx + 1}`,
      esp: "Preventiva",
      rev: {
        phase: "review",
        reviewHistory: [],
        d21: { done: false, date: today, phase: "review" },
        d7: { done: true, date: addDays(today, -1), reviewedAt: addDays(today, -1), acerto: 0.9 },
      },
    }));

    const signals = collectSchedulerSignalsForMentor({ temas, horizonDays: 3 });
    expect(signals.workload.overloadDays).toBeGreaterThanOrEqual(1);
  });

  test("lists relearning count correctly", () => {
    const today = todayStr();
    const temas = [
      {
        id: 1,
        nome: "Tema C",
        esp: "Clínica Médica",
        rev: {
          phase: "relearning",
          relearning: { fromStep: "d21", targetStep: "d7", startedAt: today },
          reviewHistory: [],
          d7: { done: false, date: today },
        },
      },
    ];
    const signals = collectSchedulerSignalsForMentor({ temas });
    expect(signals.relearning.count).toBe(1);
  });

  test("buildMentorAuditSnapshot returns recommendations when overloaded", () => {
    const today = todayStr();
    const temas = Array.from({ length: 6 }).map((_, idx) => ({
      id: idx + 1,
      nome: `Tema ${idx + 1}`,
      esp: "GO",
      rev: {
        phase: idx === 0 ? "relearning" : "review",
        relearning: idx === 0 ? { fromStep: "d21", targetStep: "d7", startedAt: today } : null,
        reviewHistory: [{ stepKey: "d21", reviewedAt: addDays(today, -20), acerto: 0.8, questoes: 10, official: true }],
        d21: { done: false, date: today, phase: "review" },
        d7: { done: true, date: addDays(today, -1), reviewedAt: addDays(today, -1), acerto: 0.8 },
      },
    }));

    const snapshot = buildMentorAuditSnapshot({ temas });
    expect(snapshot.signals.workload.overloadDays).toBeGreaterThanOrEqual(1);
    expect(snapshot.completeness.recommendations.length).toBeGreaterThan(0);
  });
});

```

### src/core/mentorDecisionPolicy.js

```txt
function buildAction(partial = {}) {
  const type = partial.type || "manutencao";
  const target = partial.target || {};
  const explain = Array.isArray(partial.explain) && partial.explain.length > 0
    ? partial.explain
    : ["Sem justificativa estruturada disponível."];
  return {
    id: partial.id || `mentor_${type}_${target.temaId || target.area || target.casoId || "root"}`,
    type,
    priority: Number.isFinite(partial.priority) ? partial.priority : 10,
    title: partial.title || "Manter consistência leve",
    subtitle: partial.subtitle || "",
    reason: partial.reason || "Sem urgência crítica detectada.",
    explain,
    cta: partial.cta || "Executar ação",
    ctaView: partial.ctaView || target.view || "dash",
    estimatedMinutes: Number.isFinite(partial.estimatedMinutes) ? partial.estimatedMinutes : 15,
    confidence: Number.isFinite(partial.confidence) ? partial.confidence : 0.7,
    safety: partial.safety || "ok",
    source: partial.source || "mentor-v2",
    target: {
      ...target,
      view: target.view || partial.ctaView || "dash",
    },
  };
}

function canSuggestNewTopic(context = {}) {
  const scheduler = context.scheduler || {};
  const available = Number(context.userAvailableMinutes || 0);
  if (scheduler.overloadLevelToday === "high") return false;
  if (Number(scheduler.overloadDays || 0) >= 2) return false;
  if (Number(scheduler.relearningCount || 0) > 0) return false;
  if (Number(scheduler.overdueCount || 0) > 0) return false;
  if (available > 0 && Number(scheduler.todayMinutes || 0) > available * 1.2) return false;
  if (available <= 0 && Number(scheduler.todayMinutes || 0) > 120) return false;
  return true;
}

function collectingSuffix(context = {}) {
  return context?.scheduler?.trueRetentionCollecting
    ? "Retenção longa ainda coletando; priorizo carga, atrasos e desempenho recente."
    : null;
}

export function decideMentorAction(context = {}) {
  const plat = context.plat || "res";
  const scheduler = context.scheduler || {};
  const areaCritica = context.enamed?.resumo?.areaCritica || null;
  const weakSubject = context.weakSubject || null;
  const providerId = context.calendarProvider?.activeId || "medcof";
  const collectingNote = collectingSuffix(context);

  if (Number(scheduler.missingRatingWarnings || 0) > 0 || Number(scheduler.missingReviewedAtCount || 0) > 0) {
    return buildAction({
      type: "scheduler_warning",
      priority: 100,
      title: "Corrigir inconsistências de revisão antes de avançar",
      subtitle: "Há revisões concluídas com dados faltando.",
      reason: "Dados incompletos podem distorcer fila, retenção e recomendações do Mentor.",
      explain: [
        `Alertas de avaliação ausente: ${scheduler.missingRatingWarnings || 0}.`,
        `Revisões sem reviewedAt: ${scheduler.missingReviewedAtCount || 0}.`,
        "Regularize o histórico para recuperar previsibilidade do plano.",
      ],
      cta: "Auditar revisões",
      ctaView: "stats",
      estimatedMinutes: 15,
      confidence: 0.95,
      safety: "critical",
      target: { area: "scheduler", action: "audit_review_data" },
    });
  }

  if (scheduler.overloadLevelToday === "high" || Number(scheduler.overloadDays || 0) >= 2) {
    return buildAction({
      type: "workload_relief",
      priority: 95,
      title: "Reduzir sobrecarga antes de tema novo",
      subtitle: `Carga hoje: ${scheduler.todayMinutes || 0} min.`,
      reason: "Sobrecarga elevada aumenta risco de atraso em cadeia nas revisões.",
      explain: [
        `Dias sobrecarregados no horizonte: ${scheduler.overloadDays || 0}.`,
        "Tema novo fica bloqueado até estabilizar a fila.",
        collectingNote || "Priorize revisões críticas para recuperar controle.",
      ].filter(Boolean),
      cta: "Rebalancear hoje",
      ctaView: "dash",
      estimatedMinutes: 25,
      confidence: 0.9,
      safety: "caution",
      target: { action: "rebalance_workload", overloadLevel: scheduler.overloadLevelToday },
    });
  }

  if (Number(scheduler.relearningCount || 0) > 0) {
    const item = scheduler.relearningItems?.[0] || {};
    return buildAction({
      type: "relearning",
      priority: 94,
      title: item.temaNome ? `Recuperar ${item.temaNome}` : "Recuperar tema em reaprendizado",
      subtitle: "Tema instável detectado; recuperação vem antes de expansão.",
      reason: "Reaprendizado ativo deve ser tratado antes de abrir conteúdo novo.",
      explain: [
        "Houve queda recente em revisão espaçada.",
        "Recuperar em 24-48h reduz custo cognitivo futuro.",
        collectingNote || "Abrir tema novo agora aumenta risco de sobrecarga.",
      ].filter(Boolean),
      cta: "Recuperar agora",
      ctaView: "focus",
      estimatedMinutes: 20,
      confidence: 0.9,
      safety: "caution",
      target: {
        temaId: item.temaId || null,
        stepKey: item.targetStep || "d4",
        phase: "relearning",
        temaNome: item.temaNome || null,
      },
    });
  }

  if (Number(scheduler.overdueCount || 0) > 0) {
    const due = scheduler.nextDueItem || {};
    return buildAction({
      type: "revisao_vencida",
      priority: 92,
      title: due.temaNome ? `Resolver vencida: ${due.temaNome}` : "Resolver revisões vencidas",
      subtitle: `Atraso máximo atual: ${scheduler.maxDelayDays || 0} dias.`,
      reason: "Revisão vencida tem prioridade sobre gargalo de conteúdo.",
      explain: [
        "Preservar retenção vem antes de abrir frente nova.",
        areaCritica ? `Gargalo ENAMED (${areaCritica}) entra depois da fila.` : "Depois da fila, volte aos gargalos.",
        collectingNote || "Eliminar atrasos estabiliza o algoritmo.",
      ].filter(Boolean),
      cta: "Começar revisão",
      ctaView: "dash",
      estimatedMinutes: 30,
      confidence: 0.9,
      safety: "caution",
      target: {
        temaId: due.temaId || null,
        stepKey: due.stepKey || null,
        temaNome: due.temaNome || null,
      },
    });
  }

  if (Number(scheduler.dueTodayCount || 0) > 0) {
    return buildAction({
      type: "fila_do_dia",
      priority: 88,
      title: "Fechar fila de hoje",
      subtitle: `${scheduler.dueTodayCount} revisão(ões) para hoje.`,
      reason: "Fechar a fila diária mantém ritmo e evita acúmulo amanhã.",
      explain: [
        `Carga estimada hoje: ${scheduler.todayMinutes || 0} minutos.`,
        collectingNote || "Constância diária mantém o plano previsível.",
      ].filter(Boolean),
      cta: "Executar fila de hoje",
      ctaView: "dash",
      estimatedMinutes: Math.max(20, scheduler.todayMinutes || 20),
      confidence: 0.85,
      safety: "ok",
      target: { action: "close_today_queue" },
    });
  }

  if (context.pendingExamAnalysis && canSuggestNewTopic(context)) {
    return buildAction({
      type: "exam_analysis",
      priority: 80,
      title: "Analisar simulado pendente",
      subtitle: "Fila segura; transformar resultado em plano tático.",
      reason: "Sem análise, você perde sinais de gargalo e alocação ótima de tempo.",
      explain: [
        "A fila de revisão está sob controle.",
        "A análise do simulado define o próximo alvo com maior retorno.",
      ],
      cta: "Abrir análise",
      ctaView: "sims",
      estimatedMinutes: 20,
      confidence: 0.8,
      safety: "ok",
      target: { action: "analyze_exam" },
    });
  }

  if (plat === "res" && areaCritica) {
    return buildAction({
      type: "enamed_critico",
      priority: 76,
      title: `Atacar lacuna em ${areaCritica}`,
      subtitle: "Gargalo ENAMED identificado na última análise.",
      reason: "Com fila segura, vale converter energia em ganho de nota no gargalo crítico.",
      explain: [
        "Sem revisões vencidas e sem relearning ativo.",
        collectingNote || "Prioridade orientada por incidência e desempenho recente.",
      ].filter(Boolean),
      cta: "Focar área crítica",
      ctaView: "stats",
      estimatedMinutes: 35,
      confidence: 0.8,
      safety: "ok",
      target: { area: areaCritica },
    });
  }

  if (plat === "vest" && weakSubject) {
    return buildAction({
      type: "vestibular_materia_fraca",
      priority: 76,
      title: `Reforçar ${weakSubject}`,
      subtitle: "Matéria fraca detectada por simulado.",
      reason: "Com fila segura, o maior ganho marginal vem da matéria mais fraca.",
      explain: [
        "Revisões críticas estão controladas.",
        "Treino dirigido aumenta eficiência da próxima bateria.",
      ],
      cta: "Treinar matéria",
      ctaView: "sims",
      estimatedMinutes: 40,
      confidence: 0.8,
      safety: "ok",
      target: { area: weakSubject },
    });
  }

  if (plat === "res" && Number(context.clinical?.dueCount || 0) > 0) {
    const dueCase = context.clinical?.dueItems?.[0] || {};
    return buildAction({
      type: "clinical_case",
      priority: 72,
      title: "Treinar caso clínico pendente",
      subtitle: "Reencontro clínico venceu o prazo sugerido.",
      reason: "Raciocínio clínico vence após revisar base para evitar esquecimento aplicado.",
      explain: [
        "Fila FSRS está controlada para abrir espaço de treino aplicado.",
        "Casos vencidos ajudam a consolidar decisão diagnóstica.",
      ],
      cta: "Abrir caso",
      ctaView: "raciocinio",
      estimatedMinutes: 25,
      confidence: 0.75,
      safety: "ok",
      target: { casoId: dueCase.casoId || null },
    });
  }

  if (canSuggestNewTopic(context)) {
    const area = plat === "res"
      ? (areaCritica || context.readinessData?.priorityList?.[0]?.area || null)
      : (weakSubject || null);
    const providerName = providerId ? ` (${providerId})` : "";
    return buildAction({
      type: "new_topic",
      priority: 66,
      title: area ? `Abrir tema novo em ${area}` : "Abrir tema novo estratégico",
      subtitle: `Carga sob controle; calendário ativo${providerName}.`,
      reason: "Sem sobrecarga e sem atrasos, expansão de cobertura tem melhor retorno.",
      explain: [
        "Bloqueios de segurança para tema novo estão liberados.",
        providerId ? `Use o calendário ativo ${providerId} para manter consistência.` : "Use o cronograma ativo.",
      ],
      cta: "Abrir cronograma",
      ctaView: "crono",
      estimatedMinutes: 45,
      confidence: 0.72,
      safety: "ok",
      target: { area, providerId, action: "start_new_topic" },
    });
  }

  if (plat === "res") {
    return buildAction({
      type: "anki_check",
      priority: 40,
      title: "Rodar bloco rápido de Anki",
      subtitle: "Sem urgências críticas no momento.",
      reason: "Bloco curto mantém trilha ativa com baixo custo.",
      explain: [
        "Fila principal está estável.",
        "Reforço leve evita perda de ritmo.",
      ],
      cta: "Abrir Anki Audit",
      ctaView: "anki",
      estimatedMinutes: 12,
      confidence: 0.68,
      safety: "ok",
      target: { action: "anki_quick_block" },
    });
  }

  return buildAction({
    type: "rest",
    priority: 30,
    title: "Bloco leve ou descanso ativo",
    subtitle: "Sem urgências; priorize recuperação.",
    reason: "Descanso intencional preserva consistência de longo prazo.",
    explain: [
      "Sem atrasos críticos e sem sobrecarga imediata.",
      "Recuperação agora reduz risco de fadiga cumulativa.",
    ],
    cta: "Ver estatísticas",
    ctaView: "stats",
    estimatedMinutes: 20,
    confidence: 0.65,
    safety: "ok",
    target: { action: "light_block_or_rest" },
  });
}

export function buildMentorTodayPlan(context = {}) {
  const action = decideMentorAction(context);
  const explain = Array.isArray(action.explain) ? action.explain : [];
  const plan = [action.title];
  if (explain[0]) plan.push(explain[0]);
  if (explain[1]) plan.push(explain[1]);
  return plan;
}

export { buildAction as buildMentorAction };

```

### src/core/mentorDecisionPolicy.test.js

```txt
import { decideMentorAction } from "./mentorDecisionPolicy";

function baseContext(overrides = {}) {
  return {
    plat: "res",
    scheduler: {
      overdueCount: 0,
      dueTodayCount: 0,
      todayMinutes: 30,
      overloadLevelToday: "ok",
      overloadDays: 0,
      maxDelayDays: 0,
      relearningCount: 0,
      relearningItems: [],
      missingRatingWarnings: 0,
      missingReviewedAtCount: 0,
      trueRetentionCollecting: false,
      ...overrides.scheduler,
    },
    calendarProvider: { activeId: "medcof" },
    enamed: null,
    weakSubject: null,
    clinical: { dueCount: 0, dueItems: [] },
    pendingExamAnalysis: false,
    userAvailableMinutes: 120,
    ...overrides,
  };
}

describe("mentorDecisionPolicy", () => {
  test("sobrecarga alta bloqueia tema novo", () => {
    const action = decideMentorAction(baseContext({
      scheduler: { overloadLevelToday: "high", overloadDays: 3, todayMinutes: 150 },
    }));
    expect(action.type).toBe("workload_relief");
  });

  test("relearning ganha de tema novo", () => {
    const action = decideMentorAction(baseContext({
      scheduler: {
        relearningCount: 1,
        relearningItems: [{ temaId: 1, temaNome: "Apendicite", targetStep: "d4" }],
      },
    }));
    expect(action.type).toBe("relearning");
  });

  test("revisão vencida ganha de ENAMED", () => {
    const action = decideMentorAction(baseContext({
      enamed: { resumo: { areaCritica: "GO" } },
      scheduler: {
        overdueCount: 1,
        nextDueItem: { temaId: 10, temaNome: "Tema X", stepKey: "d7", date: "2026-06-01" },
      },
    }));
    expect(action.type).toBe("revisao_vencida");
  });

  test("true retention coletando não vira preparo alto/baixo", () => {
    const action = decideMentorAction(baseContext({
      scheduler: { dueTodayCount: 2, trueRetentionCollecting: true },
    }));
    expect(action.explain.join(" ")).toMatch(/coletando/i);
  });

  test("ação sempre tem target e explain", () => {
    const action = decideMentorAction(baseContext());
    expect(action.target).toBeDefined();
    expect(Array.isArray(action.explain)).toBe(true);
    expect(action.explain.length).toBeGreaterThan(0);
  });

  test("plat vest não gera ação ENAMED", () => {
    const action = decideMentorAction(baseContext({
      plat: "vest",
      enamed: { resumo: { areaCritica: "GO" } },
    }));
    expect(action.type).not.toBe("enamed_critico");
  });

  test("plat vest não gera caso clínico", () => {
    const action = decideMentorAction(baseContext({
      plat: "vest",
      clinical: { dueCount: 2, dueItems: [{ casoId: "c1" }] },
    }));
    expect(action.type).not.toBe("clinical_case");
  });

  test("provider ativo influencia sugestão de tema novo", () => {
    const action = decideMentorAction(baseContext({
      calendarProvider: { activeId: "custom_provider" },
    }));
    expect(action.type).toBe("new_topic");
    expect(action.target.providerId).toBe("custom_provider");
  });

  test("ação de prova pendente aparece quando fila está segura", () => {
    const action = decideMentorAction(baseContext({
      pendingExamAnalysis: true,
    }));
    expect(action.type).toBe("exam_analysis");
  });
});

```

### src/core/mentorSignals.js

```txt
import { STEPS, todayStr, diffDays, getWorkloadProjection } from "./fsrs";
import { calcTrueRetentionDetailed } from "../hooks/useMetrics";

function getStepEntries(rev = {}) {
  const entries = [];
  for (const step of STEPS) {
    if (rev?.[step.key]) entries.push([step.key, rev[step.key]]);
  }
  if (rev?.manutencao) entries.push(["manutencao", rev.manutencao]);
  return entries;
}

function inferWeakSubjectFromSimulados(simulados = []) {
  const latest = simulados[simulados.length - 1];
  if (!latest) return null;
  const rows = Array.isArray(latest.porArea) ? latest.porArea : [];
  if (rows.length > 0) {
    const normalized = rows
      .map((row) => {
        const total = Number(row.total || row.questoes || 0);
        const acertos = Number(row.acertos || row.hits || 0);
        if (total <= 0) return null;
        return {
          area: row.area || row.esp || row.nome || null,
          pct: (acertos / total) * 100,
        };
      })
      .filter(Boolean);
    if (normalized.length > 0) {
      normalized.sort((a, b) => a.pct - b.pct);
      return normalized[0].area || null;
    }
  }
  return null;
}

function collectClinicalCaseSignals(casosProgresso = {}, today = todayStr()) {
  const due = Object.entries(casosProgresso)
    .filter(([, item]) => item?.proximaData && item.proximaData <= today)
    .map(([casoId, item]) => ({
      casoId,
      proximaData: item.proximaData,
      atualizadoEm: item.atualizadoEm || null,
    }));
  return {
    dueCount: due.length,
    dueItems: due.slice(0, 20),
  };
}

export function collectMentorSchedulerSignals(temas = [], options = {}) {
  const today = options.today || todayStr();
  const projectionDays = options.projectionDays || 14;
  const workloadProjection = getWorkloadProjection(temas, projectionDays);
  const workloadEntries = Object.values(workloadProjection);
  const todayEntry = workloadProjection[today] || {
    count: 0,
    estimatedMinutes: 0,
    overloadLevel: "ok",
  };
  const next7DaysMinutes = workloadEntries
    .slice(0, 7)
    .reduce((sum, day) => sum + (day?.estimatedMinutes || 0), 0);
  const maxDayMinutes = workloadEntries.reduce((max, day) => Math.max(max, day?.estimatedMinutes || 0), 0);
  const overloadDays = workloadEntries.filter((day) => day?.overloadLevel !== "ok").length;

  let overdueCount = 0;
  let dueTodayCount = 0;
  let maxDelayDays = 0;
  let missingReviewedAtCount = 0;
  let missingRatingWarnings = 0;
  let reviewHistoryEvents = 0;
  const dueItems = [];
  const relearningItems = [];

  for (const tema of temas) {
    if (!tema || tema.unstarted) continue;
    const rev = tema.rev || {};
    const history = Array.isArray(rev.reviewHistory) ? rev.reviewHistory : [];
    reviewHistoryEvents += history.length;
    if (rev.meta?.schedulerWarning === "missing_rating") {
      missingRatingWarnings += 1;
    }
    if (rev.phase === "relearning" || rev.relearning?.startedAt) {
      relearningItems.push({
        temaId: tema.id,
        temaNome: tema.nome,
        esp: tema.esp,
        fromStep: rev.relearning?.fromStep || null,
        targetStep: rev.relearning?.targetStep || null,
        startedAt: rev.relearning?.startedAt || null,
      });
    }

    for (const [stepKey, step] of getStepEntries(rev)) {
      if (!step) continue;
      if (step.done && !step.reviewedAt) {
        missingReviewedAtCount += 1;
      }
      if (step.done && step.acerto == null) {
        missingRatingWarnings += 1;
      }
      if (step.done || !step.date) continue;

      if (step.date < today) {
        overdueCount += 1;
        const delayDays = Math.max(0, diffDays(step.date, today));
        maxDelayDays = Math.max(maxDelayDays, delayDays);
        dueItems.push({
          temaId: tema.id,
          temaNome: tema.nome,
          esp: tema.esp,
          stepKey,
          date: step.date,
          delayDays,
          phase: step.phase || null,
        });
      } else if (step.date === today) {
        dueTodayCount += 1;
        dueItems.push({
          temaId: tema.id,
          temaNome: tema.nome,
          esp: tema.esp,
          stepKey,
          date: step.date,
          delayDays: 0,
          phase: step.phase || null,
        });
      }
    }
  }

  dueItems.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const nextDueItem = dueItems[0] || null;
  const trueRetention = calcTrueRetentionDetailed(temas);

  return {
    workloadProjection,
    todayCount: todayEntry.count || 0,
    todayMinutes: todayEntry.estimatedMinutes || 0,
    next7DaysMinutes,
    overloadLevelToday: todayEntry.overloadLevel || "ok",
    overloadDays,
    maxDayMinutes,
    overdueCount,
    dueTodayCount,
    maxDelayDays,
    nextDueItem,
    relearningCount: relearningItems.length,
    relearningItems,
    missingRatingWarnings,
    missingReviewedAtCount,
    reviewHistoryEvents,
    trueRetentionPct: trueRetention.pct,
    trueRetentionN: trueRetention.n,
    trueRetentionTotalQuestoes: trueRetention.totalQuestoes,
    trueRetentionCollecting: trueRetention.collecting,
  };
}

export function buildMentorContext(state = {}, platArg, extras = {}) {
  const plat = platArg || state.plat || "res";
  const today = extras.today || todayStr();
  const platState = state[plat] || {};
  const temas = extras.temas || platState.temas || [];
  const simulados = extras.simulados || platState.simulados || [];
  const meta = extras.meta || state.meta || {};
  const scheduler = collectMentorSchedulerSignals(temas, {
    today,
    projectionDays: extras.projectionDays || 14,
  });

  const enamedAnalises = extras.enamedAnalises || state.enamedAnalises || [];
  const latestEnamed = enamedAnalises[enamedAnalises.length - 1] || null;
  const weakSubject = extras.weakSubject
    || meta?.areaPuxouBaixo
    || inferWeakSubjectFromSimulados(simulados);
  const clinical = collectClinicalCaseSignals(platState.casosProgresso || {}, today);
  const userAvailableMinutes = Number(meta?.tempoDisponivel || 0) > 0
    ? Number(meta.tempoDisponivel) * 60
    : null;
  const pendingExamAnalysis = Boolean(simulados.length > 0 && !latestEnamed);

  return {
    plat,
    today,
    meta,
    calendarProvider: state.calendarProvider || {},
    actionInbox: state.actionInbox || [],
    sessionReflections: state.sessionReflections || [],
    scheduler,
    enamed: latestEnamed,
    weakSubject: weakSubject || null,
    pendingExamAnalysis,
    clinical,
    readinessData: extras.readinessData || null,
    userAvailableMinutes,
    lowEnergy: Boolean(extras.lowEnergy),
    exhaustionDetected: Boolean(extras.exhaustionDetected),
  };
}

```

### src/core/mentorSignals.test.js

```txt
import { addDays, todayStr } from "./fsrs";
import { buildMentorContext, collectMentorSchedulerSignals } from "./mentorSignals";

describe("mentorSignals", () => {
  test("collectMentorSchedulerSignals expõe workload por minutos", () => {
    const today = todayStr();
    const temas = [
      {
        id: 1,
        nome: "Tema A",
        esp: "GO",
        rev: {
          phase: "review",
          reviewHistory: [],
          d1: { done: false, date: today, phase: "learning" },
          d7: { done: false, date: addDays(today, -1), phase: "review" },
        },
      },
    ];
    const signals = collectMentorSchedulerSignals(temas, { today, projectionDays: 7 });
    expect(signals.workloadProjection[today]).toBeDefined();
    expect(signals.todayCount).toBeGreaterThan(0);
    expect(signals.todayMinutes).toBeGreaterThan(0);
    expect(signals.overdueCount).toBeGreaterThan(0);
  });

  test("collectMentorSchedulerSignals conta relearning e warnings", () => {
    const today = todayStr();
    const temas = [
      {
        id: 2,
        nome: "Tema B",
        esp: "Clínica Médica",
        rev: {
          phase: "relearning",
          relearning: { fromStep: "d21", targetStep: "d7", startedAt: today },
          meta: { schedulerWarning: "missing_rating" },
          reviewHistory: [{ stepKey: "d21", reviewedAt: today, acerto: 0.7, official: true }],
          d21: { done: true, date: today, reviewedAt: null, acerto: null },
        },
      },
    ];
    const signals = collectMentorSchedulerSignals(temas, { today });
    expect(signals.relearningCount).toBe(1);
    expect(signals.missingRatingWarnings).toBeGreaterThan(0);
    expect(signals.missingReviewedAtCount).toBeGreaterThan(0);
  });

  test("buildMentorContext agrega provider e sinais de plataforma", () => {
    const today = todayStr();
    const state = {
      plat: "vest",
      meta: { tempoDisponivel: 2, areaPuxouBaixo: "Matemática" },
      calendarProvider: { activeId: "vest-base" },
      vest: {
        temas: [],
        simulados: [{ id: 1, porArea: [] }],
        casosProgresso: {},
      },
      enamedAnalises: [],
      actionInbox: [],
      sessionReflections: [],
    };
    const context = buildMentorContext(state, "vest", { today });
    expect(context.plat).toBe("vest");
    expect(context.calendarProvider.activeId).toBe("vest-base");
    expect(context.userAvailableMinutes).toBe(120);
    expect(context.weakSubject).toBe("Matemática");
  });
});

```

## Mojibake check

```txt

> residencia-planner@0.1.0 check:mojibake
> node scripts/check-mojibake.mjs

check-mojibake: OK - 113 arquivos versionados sem mojibake.

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

check-mojibake: OK - 113 arquivos versionados sem mojibake.
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:

  378.83 kB  build\static\js\main.28d59d34.js
  12.18 kB   build\static\css\main.a1650174.css
  5.4 kB     build\static\js\82.fabc047e.chunk.js
  3.26 kB    build\static\js\399.fbccb79f.chunk.js
  2.49 kB    build\static\js\108.d859648a.chunk.js
  1.6 kB     build\static\js\508.2045e8fe.chunk.js
  1.16 kB    build\static\js\420.24c44b27.chunk.js

The project was built assuming it is hosted at /residencia-planner/.
You can control this with the homepage field in your package.json.

The build folder is ready to be deployed.

Find out more about deployment here:

  https://cra.link/deployment


```
