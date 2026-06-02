# ASK_CHATGPT — Auditoria automática

Aja como auditor sênior de engenharia de software. Audite somente o delta abaixo. Procure regressões, bugs, integração incompleta, problemas de arquitetura, encoding, testes, build, UX e riscos de dados persistidos. Priorize P0/P1/P2 e diga exatamente o que corrigir.


## Git status

```txt
 M audit/ASK_CHATGPT.md
 M src/App.js
 M src/components/ActionInbox.jsx
 M src/components/AdvancedSection.jsx
 M src/components/AnkiAudit.jsx
 M src/components/Cronograma.jsx
 M src/components/CronogramaVest.jsx
 M src/components/Dashboard.jsx
 M src/components/FocusMode.jsx
 M src/components/Modals.jsx
 M src/components/OnboardingWizard.jsx
 M src/components/RaciocinioClinico.jsx
 M src/components/RetrievabilitySpark.jsx
 M src/components/Simulados.jsx
 M src/components/StatsPanel.jsx
 M src/core/achievements.js
 M src/core/actionInbox.js
 M src/core/domainValidation.js
 M src/core/domainValidation.test.js
 M src/core/enamedIntel.js
 M src/core/errorTaxonomy.js
 M src/core/fsrs.js
 M src/core/fsrs.test.js
 M src/core/illnessScript.js
 M src/core/illnessScript.test.js
 M src/core/launchReadiness.js
 M src/core/mentorDecisionPolicy.js
 M src/core/mentorSignals.js
 M src/core/mentorSignals.test.js
 M src/core/navigationModel.js
 M src/core/navigationModel.test.js
 M src/core/readiness.js
 M src/core/simStrategy.js
 M src/core/store.js
 M src/hooks/useMetrics.js
?? MEDREV_HOTFIX_JA_DOMINO_D7_D14_FILA.md
?? MEDREV_P1_HOTFIX_JA_DOMINO_COPY_VESTIBULAR.md
?? MEDREV_P2_P3_P4_OPUS_ROADMAP.md
?? MEDREV_P2_P3_P4_REVISADO_PELA_AUDITORIA.md
?? MEDREV_P2_STATS_METRICS_REGISTRY.md
?? MEDREV_PRODUCT_PERSONA_UX_AUDIT_PROMPT.md
?? docs/COPY_GUIDE_PT_BR.md
?? docs/MEDREV_PRODUCT_CHARTER.md
?? docs/P2_P3_P4_OPUS_AUDIT_PLAN.md
?? "docs/PRODUCT_PERSONA_UX_AUDIT.md colado"
?? src/components/ClinicalTaskPanel.jsx
?? src/components/ErrorActionCenter.jsx
?? src/components/ErrorActionPrompt.jsx
?? src/components/MetricCard.jsx
?? src/components/VestibularStartTrail.jsx
?? src/core/clinicalReasoningScoring.js
?? src/core/clinicalReasoningScoring.test.js
?? src/core/copy.js
?? src/core/copy.test.js
?? src/core/errorActionMap.js
?? src/core/errorActionMap.test.js
?? src/core/metricsRegistry.js
?? src/core/metricsRegistry.test.js
?? src/core/reviewTaskPlanner.js
?? src/core/reviewTaskPlanner.test.js
?? src/core/vestibularOnboarding.js
?? src/core/vestibularOnboarding.test.js

```

## Diff stat

```txt
 audit/ASK_CHATGPT.md                   | 10839 +------------------------------
 src/App.js                             |    58 +-
 src/components/ActionInbox.jsx         |     8 +-
 src/components/AdvancedSection.jsx     |     4 +-
 src/components/AnkiAudit.jsx           |     2 +-
 src/components/Cronograma.jsx          |    91 +-
 src/components/CronogramaVest.jsx      |     6 +-
 src/components/Dashboard.jsx           |   320 +-
 src/components/FocusMode.jsx           |    54 +-
 src/components/Modals.jsx              |    70 +-
 src/components/OnboardingWizard.jsx    |    28 +-
 src/components/RaciocinioClinico.jsx   |   200 +-
 src/components/RetrievabilitySpark.jsx |    68 +-
 src/components/Simulados.jsx           |    22 +-
 src/components/StatsPanel.jsx          |  1467 +++--
 src/core/achievements.js               |     2 +-
 src/core/actionInbox.js                |     2 +-
 src/core/domainValidation.js           |   268 +-
 src/core/domainValidation.test.js      |   208 +-
 src/core/enamedIntel.js                |    23 +
 src/core/errorTaxonomy.js              |    47 +-
 src/core/fsrs.js                       |     2 +-
 src/core/fsrs.test.js                  |    18 +
 src/core/illnessScript.js              |    44 +-
 src/core/illnessScript.test.js         |    14 +-
 src/core/launchReadiness.js            |    34 +-
 src/core/mentorDecisionPolicy.js       |    29 +
 src/core/mentorSignals.js              |    53 +
 src/core/mentorSignals.test.js         |    35 +
 src/core/navigationModel.js            |    78 +-
 src/core/navigationModel.test.js       |     9 +-
 src/core/readiness.js                  |    20 +-
 src/core/simStrategy.js                |     2 +-
 src/core/store.js                      |    49 +-
 src/hooks/useMetrics.js                |    19 +-
 35 files changed, 2254 insertions(+), 11939 deletions(-)

```

## Changed files

```txt
audit/ASK_CHATGPT.md
src/App.js
src/components/ActionInbox.jsx
src/components/AdvancedSection.jsx
src/components/AnkiAudit.jsx
src/components/Cronograma.jsx
src/components/CronogramaVest.jsx
src/components/Dashboard.jsx
src/components/FocusMode.jsx
src/components/Modals.jsx
src/components/OnboardingWizard.jsx
src/components/RaciocinioClinico.jsx
src/components/RetrievabilitySpark.jsx
src/components/Simulados.jsx
src/components/StatsPanel.jsx
src/core/achievements.js
src/core/actionInbox.js
src/core/domainValidation.js
src/core/domainValidation.test.js
src/core/enamedIntel.js
src/core/errorTaxonomy.js
src/core/fsrs.js
src/core/fsrs.test.js
src/core/illnessScript.js
src/core/illnessScript.test.js
src/core/launchReadiness.js
src/core/mentorDecisionPolicy.js
src/core/mentorSignals.js
src/core/mentorSignals.test.js
src/core/navigationModel.js
src/core/navigationModel.test.js
src/core/readiness.js
src/core/simStrategy.js
src/core/store.js
src/hooks/useMetrics.js

```

## Untracked files

```txt
MEDREV_HOTFIX_JA_DOMINO_D7_D14_FILA.md
MEDREV_P1_HOTFIX_JA_DOMINO_COPY_VESTIBULAR.md
MEDREV_P2_P3_P4_OPUS_ROADMAP.md
MEDREV_P2_P3_P4_REVISADO_PELA_AUDITORIA.md
MEDREV_P2_STATS_METRICS_REGISTRY.md
MEDREV_PRODUCT_PERSONA_UX_AUDIT_PROMPT.md
docs/COPY_GUIDE_PT_BR.md
docs/MEDREV_PRODUCT_CHARTER.md
docs/P2_P3_P4_OPUS_AUDIT_PLAN.md
docs/PRODUCT_PERSONA_UX_AUDIT.md colado
src/components/ClinicalTaskPanel.jsx
src/components/ErrorActionCenter.jsx
src/components/ErrorActionPrompt.jsx
src/components/MetricCard.jsx
src/components/VestibularStartTrail.jsx
src/core/clinicalReasoningScoring.js
src/core/clinicalReasoningScoring.test.js
src/core/copy.js
src/core/copy.test.js
src/core/errorActionMap.js
src/core/errorActionMap.test.js
src/core/metricsRegistry.js
src/core/metricsRegistry.test.js
src/core/reviewTaskPlanner.js
src/core/reviewTaskPlanner.test.js
src/core/vestibularOnboarding.js
src/core/vestibularOnboarding.test.js

```

## Full diff

```diff
diff --git a/src/App.js b/src/App.js
index 063c14f2..cd6edb7d 100644
--- a/src/App.js
+++ b/src/App.js
@@ -1,7 +1,11 @@
 // src/App.js
 // Main entry point for MedRev - Clean & Modular Architecture
 import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
-import { Eye, EyeOff, Settings } from "lucide-react";
+import {
+  Eye, EyeOff, Settings,
+  Brain, Layers, CalendarCheck, GraduationCap, ShieldCheck,
+  Rocket, BookOpen, SlidersHorizontal, ArrowRight,
+} from "lucide-react";
 
 // Camada Core & State
 import { useStore } from "./core/store";
@@ -70,29 +74,53 @@ import {
 
 const RaciocinioClinico = lazy(() => import("./components/RaciocinioClinico"));
 
+// Metadados visuais por ferramenta da aba Mais: icone + paleta de cor.
+const MORE_TOOL_META = {
+  raciocinio:       { icon: Brain,            color: "text-teal-300",    bg: "bg-teal-500/10",    ring: "border-teal-500/20",    glow: "group-hover:border-teal-400/40" },
+  anki:             { icon: Layers,           color: "text-purple-300",  bg: "bg-purple-500/10",  ring: "border-purple-500/20",  glow: "group-hover:border-purple-400/40" },
+  weekly_review:    { icon: CalendarCheck,    color: "text-blue-300",    bg: "bg-blue-500/10",    ring: "border-blue-500/20",    glow: "group-hover:border-blue-400/40" },
+  academia:         { icon: GraduationCap,    color: "text-amber-300",   bg: "bg-amber-500/10",   ring: "border-amber-500/20",   glow: "group-hover:border-amber-400/40" },
+  data_safety:      { icon: ShieldCheck,      color: "text-emerald-300", bg: "bg-emerald-500/10", ring: "border-emerald-500/20", glow: "group-hover:border-emerald-400/40" },
+  launch_checklist: { icon: Rocket,           color: "text-rose-300",    bg: "bg-rose-500/10",    ring: "border-rose-500/20",    glow: "group-hover:border-rose-400/40" },
+  guia:             { icon: BookOpen,         color: "text-sky-300",     bg: "bg-sky-500/10",     ring: "border-sky-500/20",     glow: "group-hover:border-sky-400/40" },
+  ajustes:          { icon: SlidersHorizontal,color: "text-gray-300",    bg: "bg-white/5",        ring: "border-white/10",       glow: "group-hover:border-white/25" },
+};
+
+const DEFAULT_TOOL_META = { icon: SlidersHorizontal, color: "text-gray-300", bg: "bg-white/5", ring: "border-white/10", glow: "group-hover:border-white/25" };
+
 function MoreToolsHub({ items, onOpen }) {
   return (
-    <section className="max-w-5xl mx-auto space-y-4">
+    <section className="max-w-5xl mx-auto space-y-5">
       <div className="space-y-1">
         <p className="text-[11px] font-black uppercase tracking-wider text-blue-300">Ferramentas</p>
         <h1 className="text-2xl font-black text-white tracking-tight">Mais</h1>
         <p className="text-[12px] text-gray-400">Acesso rapido aos recursos avancados sem poluir a jornada diaria.</p>
       </div>
 
-      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
-        {items.map((item) => (
-          <article key={item.view} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
-            <h2 className="text-sm font-black text-white">{item.label}</h2>
-            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{item.description}</p>
+      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
+        {items.map((item) => {
+          const meta = MORE_TOOL_META[item.view] || DEFAULT_TOOL_META;
+          const Icon = meta.icon;
+          return (
             <button
+              key={item.view}
               type="button"
               onClick={() => onOpen(item.view)}
-              className="mt-3 px-3 py-2 rounded-xl border border-blue-500/25 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[11px] font-bold transition-colors cursor-pointer"
+              className={`group text-left rounded-2xl border border-white/8 bg-white/[0.02] p-4 flex items-start gap-3.5 transition-all hover:bg-white/[0.04] ${meta.glow} hover:-translate-y-0.5 cursor-pointer`}
             >
-              Abrir
+              <div className={`shrink-0 w-11 h-11 rounded-xl ${meta.bg} border ${meta.ring} flex items-center justify-center transition-colors`}>
+                <Icon size={20} className={meta.color} />
+              </div>
+              <div className="flex-1 min-w-0">
+                <div className="flex items-center justify-between gap-2">
+                  <h2 className="text-[13px] font-black text-white truncate">{item.label}</h2>
+                  <ArrowRight size={15} className="text-gray-600 group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all shrink-0" />
+                </div>
+                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{item.description}</p>
+              </div>
             </button>
-          </article>
-        ))}
+          );
+        })}
       </div>
     </section>
   );
@@ -189,6 +217,9 @@ export default function App() {
     raciocinioClinico: featureEnabled(plat, "raciocinioClinico") && meta.modulos?.raciocinioClinico === true,
   }), [meta.modulos, plat]);
   const moreNavItems = useMemo(() => getMoreNavItems(plat, navFeatures), [plat, navFeatures]);
+  // Secao alvo do StatsPanel quando aberto a partir da aba Mais (Sistema, etc.)
+  const [statsSection, setStatsSection] = useState(null);
+  const [statsSectionTrigger, setStatsSectionTrigger] = useState(0);
   const openFromMore = useCallback((targetView) => {
     if (targetView === NAV_VIEW.GUIDE) {
       setHelpModal(true);
@@ -198,11 +229,14 @@ export default function App() {
       openAjustes({ initialTab: "ajustes" });
       return;
     }
+    // DataSafety, WeeklyReview e LaunchChecklist vivem na secao "Sistema" do StatsPanel.
     if (
       targetView === NAV_VIEW.DATA_SAFETY
       || targetView === NAV_VIEW.WEEKLY_REVIEW
       || targetView === NAV_VIEW.LAUNCH_CHECKLIST
     ) {
+      setStatsSection("sistema");
+      setStatsSectionTrigger((n) => n + 1);
       setView(NAV_VIEW.STATS);
       return;
     }
@@ -1144,7 +1178,7 @@ export default function App() {
           {view === "banco" && <BancoDados />}
           {view === "stats" && (
             <ErrorBoundary onBackToDashboard={() => setView("dash")} onExportBackup={exportBackupNow}>
-              <StatsPanel setView={setView} />
+              <StatsPanel setView={setView} initialSection={statsSection} sectionTrigger={statsSectionTrigger} />
             </ErrorBoundary>
           )}
           {view === "sims" && (
diff --git a/src/components/ActionInbox.jsx b/src/components/ActionInbox.jsx
index ea7ae843..a5e84386 100644
--- a/src/components/ActionInbox.jsx
+++ b/src/components/ActionInbox.jsx
@@ -38,8 +38,8 @@ export default function ActionInbox({ mode = "mentor", onStudy, setView }) {
     return (
       <EmptyState
         icon={Inbox}
-        title="Nada urgente agora"
-        description="Quando houver revisao, prova analisada ou caso vencido, o Mentor colocara aqui."
+        title="Plano executado por enquanto"
+        description="Quando o Comando do Mentor gerar próximos passos, eles aparecem aqui como execução do plano."
       />
     );
   }
@@ -52,7 +52,7 @@ export default function ActionInbox({ mode = "mentor", onStudy, setView }) {
       <div className="flex items-center justify-between gap-2">
         <div className="flex items-center gap-2">
           <Inbox size={16} className="text-blue-400" />
-          <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">Caixa de Acoes</h3>
+          <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">Execução do plano</h3>
         </div>
         {openActions.length > 3 && mode !== "manual" && (
           <button
@@ -66,7 +66,7 @@ export default function ActionInbox({ mode = "mentor", onStudy, setView }) {
       </div>
 
       <article className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 space-y-2">
-        <p className="text-[10px] uppercase tracking-wider font-black text-blue-300">Acao principal</p>
+        <p className="text-[10px] uppercase tracking-wider font-black text-blue-300">Próximo passo do comando</p>
         <p className="text-sm font-black text-white">{primary.title}</p>
         <p className="text-[11px] text-gray-300">{primary.reason}</p>
         <div className="flex flex-wrap gap-2 pt-1">
diff --git a/src/components/AdvancedSection.jsx b/src/components/AdvancedSection.jsx
index 60f46af9..df5b3130 100644
--- a/src/components/AdvancedSection.jsx
+++ b/src/components/AdvancedSection.jsx
@@ -9,7 +9,7 @@ function readPersistedState(storageKey, fallback) {
 }
 
 export default function AdvancedSection({
-  title = "Painel avancado",
+  title = "Painel avan\u00e7ado",
   defaultOpen = false,
   storageKey,
   children,
@@ -30,7 +30,7 @@ export default function AdvancedSection({
         className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left bg-transparent border-none cursor-pointer"
       >
         <div>
-          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-black">Avancado</p>
+          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-black">Avan\u00e7ado</p>
           <h3 className="text-sm font-bold text-white">{title}</h3>
         </div>
         <span className="text-gray-300">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
diff --git a/src/components/AnkiAudit.jsx b/src/components/AnkiAudit.jsx
index 7a538bff..4b2eb6d1 100644
--- a/src/components/AnkiAudit.jsx
+++ b/src/components/AnkiAudit.jsx
@@ -123,7 +123,7 @@ export default function AnkiAudit() {
         <div className="space-y-1">
           <p className="text-[10.5px] uppercase tracking-wider font-semibold text-gray-500">Adesão diária</p>
           <p className="text-[12px] text-gray-300">
-            Marque quando revisar seus cards. Esse check entra com peso leve no Score de Prontidão.
+            Marque quando revisar seus cards. Esse check entra com peso leve no Preparo estimado.
           </p>
         </div>
         <Btn onClick={marcarAnkiHoje} disabled={ankiFeitoHoje} className="gap-2 sm:shrink-0">
diff --git a/src/components/Cronograma.jsx b/src/components/Cronograma.jsx
index 0955f455..12882ffc 100644
--- a/src/components/Cronograma.jsx
+++ b/src/components/Cronograma.jsx
@@ -8,6 +8,13 @@ import { getCronogramasByPlat, getDefaultCronogramaId, resolveCatalogo } from ".
 import { stepState, STATE_DOT, STATE_TW, Badge, SBadge, Btn, Input, TourBalloon, InfoTooltip } from "./Primitives";
 import { CALENDAR_PROVIDER_IDS } from "../constants/calendarProviders";
 import { attachCalendarIntelligence, getProviderSeed, matchMedcofTopic } from "../core/calendarProvider";
+import {
+  calcularDominioPrevio,
+  getDominioPrevioStatus,
+  getNextReviewForTema,
+  getReviewDisplayMeta,
+} from "../core/domainValidation";
+import { getEnamedContextBadge } from "../core/enamedIntel";
 import CalendarProviderSelector from "./CalendarProviderSelector";
 import { ModalValidarDominio } from "./Modals";
 import RetrievabilitySpark from "./RetrievabilitySpark";
@@ -26,12 +33,28 @@ function prioToImportancia(prio) {
   }
 }
 
-export function CronoCard({ tema, onStep, onEdit, onIniciarTema }) {
+function formatShortDate(date) {
+  if (!date) return "agendada";
+  const [year, month, day] = String(date).split("-");
+  if (!year || !month || !day) return date;
+  return `${day}/${month}`;
+}
+
+export function CronoCard({ tema, onStep, onEdit, onIniciarTema, plat = "res" }) {
   const esp     = ESP_COLORS[tema.esp] || "#94a3b8";
-  const allDone = STEPS.every((s) => tema.rev[s.key].done);
-  const next    = STEPS.find((s) => !tema.rev[s.key].done);
+  const dominioStatus = getDominioPrevioStatus(tema);
+  const semanticNextReview = getNextReviewForTema(tema);
+  const allDone = STEPS.every((s) => tema.rev[s.key].done || tema.rev[s.key].skipped) && !semanticNextReview;
+  const next    = semanticNextReview
+    ? { key: semanticNextReview.stepKey, label: semanticNextReview.label, desc: semanticNextReview.label }
+    : STEPS.find((s) => !tema.rev[s.key].done && !tema.rev[s.key].skipped);
+  const nextMeta = next ? getReviewDisplayMeta(tema, next.key) : null;
   const nextState = next ? stepState(tema.rev[next.key]) : "done";
   const imp     = IMPORTANCIA[tema.importancia || "ALTA"];
+  const dominioPrevio = tema?.dominioPrevio || {};
+  const enamedBadge = plat === "res" ? getEnamedContextBadge(tema.esp, tema.nome) : null;
+  const isValidadoPrevio = dominioStatus.isValidated || dominioPrevio.status === "validado_previo";
+  const acertoValidacao = dominioStatus.acerto != null ? Math.round(dominioStatus.acerto * 100) : null;
 
   const stepsWithData = STEPS.map(s => tema.rev[s.key]).filter(r => r && r.done && r.confianca != null && r.acerto != null);
   const hasVies = stepsWithData.length >= 2 && (() => {
@@ -56,6 +79,21 @@ export function CronoCard({ tema, onStep, onEdit, onIniciarTema }) {
               <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500 truncate">{tema.esp}</p>
               {imp && <Badge color={imp.color}>{imp.label}</Badge>}
               {next && <SBadge S={tema.rev[next.key]?.S} nextDate={tema.rev[next.key]?.date} />}
+              {enamedBadge && (
+                <span
+                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 shrink-0 ${
+                    enamedBadge.nivel === "alto"
+                      ? "bg-orange-500/15 text-orange-400 border border-orange-500/25"
+                      : enamedBadge.nivel === "medio"
+                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
+                      : "bg-white/5 text-gray-500 border border-white/10"
+                  }`}
+                  title={`${enamedBadge.subarea} · ${enamedBadge.pctAbsoluto}% de ${enamedBadge.area} no ENAMED${enamedBadge.questoes ? ` (~${enamedBadge.questoes} questões)` : ""}`}
+                  onClick={(e) => e.stopPropagation()}
+                >
+                  Hot {enamedBadge.questoes ? `~${enamedBadge.questoes}q` : `${enamedBadge.pctAbsoluto}%`}
+                </span>
+              )}
               {hasVies && (
                 <span
                   className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded font-medium flex items-center gap-1"
@@ -78,16 +116,29 @@ export function CronoCard({ tema, onStep, onEdit, onIniciarTema }) {
             {tema.pico}
           </p>
         )}
+        {isValidadoPrevio && (
+          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
+            <p className="text-[10px] font-bold text-emerald-200 truncate">
+              Validado previamente
+              {acertoValidacao != null ? ` · ${acertoValidacao}%` : ""}
+              {" · Próxima revisão: "}
+              <span className="text-emerald-100">
+                {dominioStatus.firstReviewLabel || nextMeta?.label || "D7"} · {formatShortDate(dominioStatus.firstReviewDate || nextMeta?.date)}
+              </span>
+            </p>
+          </div>
+        )}
         <div className="flex items-center justify-between gap-3 flex-wrap">
           <div className="flex-1 flex gap-1.5 min-w-[120px]">
             {STEPS.map((s) => {
               const st2 = stepState(tema.rev[s.key]);
-              return <div key={s.key} title={`${s.label} · ${s.desc}`} className={`flex-1 h-2 rounded-full transition-all ${tema.rev[s.key].done ? "bg-emerald-500" : STATE_DOT[st2]}`} />;
+              const meta = getReviewDisplayMeta(tema, s.key);
+              return <div key={s.key} title={`${meta.label} · ${s.desc}${meta.skipped ? " · pulado por domínio prévio" : ""}`} className={`flex-1 h-2 rounded-full transition-all ${meta.skipped ? "bg-emerald-500/40" : tema.rev[s.key].done ? "bg-emerald-500" : STATE_DOT[st2]}`} />;
             })}
           </div>
           <div className="flex items-center gap-2 shrink-0">
             <RetrievabilitySpark tema={tema} />
-            <span className={`text-[11px] font-semibold ${STATE_TW[nextState]}`}>RO: {next ? next.label : "Fixação"}</span>
+            <span className={`text-[11px] font-semibold ${STATE_TW[nextState]}`}>RO: {nextMeta ? nextMeta.label : "Fixação"}</span>
           </div>
         </div>
       </div>
@@ -503,7 +554,11 @@ export default function Cronograma({ onStep, onEdit, onIniciarTema, catalogo })
                                   const isStarted = subTema && !subTema.unstarted;
 
                                   if (isStarted) {
-                                    const next = STEPS.find((s) => !subTema.rev[s.key].done);
+                                    const semanticNext = getNextReviewForTema(subTema);
+                                    const next = semanticNext
+                                      ? { key: semanticNext.stepKey, label: semanticNext.label, desc: semanticNext.label }
+                                      : STEPS.find((s) => !subTema.rev[s.key].done && !subTema.rev[s.key].skipped);
+                                    const nextMeta = next ? getReviewDisplayMeta(subTema, next.key) : null;
                                     const nextState = next ? stepState(subTema.rev[next.key]) : "done";
 
                                     return (
@@ -515,15 +570,15 @@ export default function Cronograma({ onStep, onEdit, onIniciarTema, catalogo })
                                               {STEPS.map((s) => (
                                                 <div
                                                   key={s.key}
-                                                  title={`${s.label} · ${s.desc}`}
-                                                  className={`h-1.5 rounded-full flex-1 ${subTema.rev[s.key].done ? "bg-emerald-500" : STATE_DOT[stepState(subTema.rev[s.key])]}`}
+                                                  title={`${getReviewDisplayMeta(subTema, s.key).label} · ${s.desc}${subTema.rev[s.key].skipped ? " · pulado por domínio prévio" : ""}`}
+                                                  className={`h-1.5 rounded-full flex-1 ${subTema.rev[s.key].skipped ? "bg-emerald-500/40" : subTema.rev[s.key].done ? "bg-emerald-500" : STATE_DOT[stepState(subTema.rev[s.key])]}`}
                                                 />
                                               ))}
                                             </div>
                                             <div className="flex items-center gap-2">
                                               <RetrievabilitySpark tema={subTema} />
                                               <span className={`text-[9.5px] font-bold ${STATE_TW[nextState]}`}>
-                                                RO: {next ? next.label : "Fixado"}
+                                                RO: {nextMeta ? nextMeta.label : "Fixado"}
                                               </span>
                                             </div>
                                           </div>
@@ -560,7 +615,7 @@ export default function Cronograma({ onStep, onEdit, onIniciarTema, catalogo })
                                           onClick={() => onIniciarTema(subTema || { nome: subName, esp, prio: topPrio, parentTopic: topNome })}
                                           className="px-2.5 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-black transition-all border border-blue-500/10 cursor-pointer"
                                         >
-                                          Iniciar FSRS
+                                          Iniciar revisão
                                         </button>
                                         <button
                                           type="button"
@@ -584,7 +639,7 @@ export default function Cronograma({ onStep, onEdit, onIniciarTema, catalogo })
                       }
 
                       const tema = temaMap.get(topNome);
-                      if (tema && !tema.unstarted) return <CronoCard key={topNome} tema={tema} onStep={onStep} onEdit={onEdit} onIniciarTema={onIniciarTema} />;
+                      if (tema && !tema.unstarted) return <CronoCard key={topNome} tema={tema} plat={plat} onStep={onStep} onEdit={onEdit} onIniciarTema={onIniciarTema} />;
 
                       const espC  = ESP_COLORS[esp] || "#94a3b8";
                       const currentPrio = tema ? tema.prio : topPrio;
@@ -681,9 +736,19 @@ export default function Cronograma({ onStep, onEdit, onIniciarTema, catalogo })
         <ModalValidarDominio
           tema={temaValidando}
           onConfirm={({ questoes, acertos }) => {
+            const resultado = calcularDominioPrevio({ total: questoes, acertos });
             validarDominio(plat, temaValidando.id, { questoes, acertos });
-            const pct = Math.round((acertos / questoes) * 100);
-            if (showToast) showToast(`Validação de domínio registrada (${pct}%).`);
+            if (showToast) {
+              if (resultado.valido) {
+                if ((resultado.intervaloInicial || 7) >= 14) {
+                  showToast("Tema validado com alta segurança. Próxima revisão: D14.");
+                } else {
+                  showToast("Tema validado. Próxima revisão: D7.");
+                }
+              } else {
+                showToast("Validação insuficiente. Comece pelo estudo guiado para proteger sua base.");
+              }
+            }
             setTemaValidando(null);
           }}
           onStartLater={() => {
diff --git a/src/components/CronogramaVest.jsx b/src/components/CronogramaVest.jsx
index 50b24fc7..60b8b5b6 100644
--- a/src/components/CronogramaVest.jsx
+++ b/src/components/CronogramaVest.jsx
@@ -220,7 +220,7 @@ export function gerarCronogramaInteligente(titulo, dataInicio, numSemanas, horas
           topicIndex++;
         }
       } else if (b.tipo === "revisao") {
-        conteudo = "Revisar fila inteligente do FSRS + Anki";
+        conteudo = "Revisar fila inteligente da curva de revisão + Anki";
       } else if (b.tipo === "questoes") {
         conteudo = "Resolver 15-20 questões do simulado anterior";
       } else {
@@ -311,7 +311,7 @@ export function DiaCard({ dia, diaIdx, eHoje, semanaIdx, crono, plat, toggleBloc
             {(reviewsCount > 0 || newStudiesCount > 0) && (
               <div className="flex items-center gap-1.5 flex-wrap">
                 <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25">
-                  📚 Carga: {reviewsCount} revisões FSRS + {newStudiesCount} novos estudos
+                  Carga: {reviewsCount} revisões da curva + {newStudiesCount} novos estudos
                 </span>
               </div>
             )}
@@ -372,7 +372,7 @@ export function DiaCard({ dia, diaIdx, eHoje, semanaIdx, crono, plat, toggleBloc
                         }}
                         className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-black transition-all border border-blue-500/20"
                       >
-                        ⚡ Iniciar FSRS
+                        Iniciar revisão
                       </button>
                     )}
                   </div>
diff --git a/src/components/Dashboard.jsx b/src/components/Dashboard.jsx
index 04fdf6b3..4ca45974 100644
--- a/src/components/Dashboard.jsx
+++ b/src/components/Dashboard.jsx
@@ -1,14 +1,13 @@
 // src/components/Dashboard.jsx
 import React, { useMemo, useState, useEffect, useCallback } from "react";
 import { createPortal } from "react-dom";
-import { Edit2, Info, TrendingUp, TrendingDown, CheckCircle, ChevronDown, ChevronUp, Brain, Flame, Calendar, AlertTriangle, X, Zap, BookOpen, Layers, Share2, Unlock, Lightbulb, GraduationCap } from "lucide-react";
+import { Edit2, Info, TrendingUp, TrendingDown, CheckCircle, ChevronDown, ChevronUp, Brain, Flame, Calendar, AlertTriangle, X, Zap, BookOpen, Layers, Share2, Unlock, GraduationCap, BarChart3, ClipboardList, Target } from "lucide-react";
 import { useStore } from "../core/store";
 import { STEPS, ESP_COLORS, isOverdue, todayStr, addDays, fmtDate, fmtFull, getRetrievability, getWorkloadProjection } from "../core/fsrs";
 import { calcTrueRetention, calcBleedingScore, useFilaInteligente, PESOS_PROVA_VEST } from "../hooks/useMetrics";
-import { getMentorDiagnosis, getMentorVoice, getMentorPhrase, getRecentPhrases, trackRecentPhrase, isExhaustionDetected } from "../core/mentor";
+import { getMentorDiagnosis, getMentorVoice, isExhaustionDetected } from "../core/mentor";
 import { buildMentorContext, getMentorNextAction, getMentorTodayPlan } from "../core/mentorAutopilot";
 import { getReadinessData } from "../core/readiness";
-import { getUserState } from "../core/userState";
 import { TourBalloon, Modal, Btn, ConfettiOverlay, ProgressiveTooltip, InfoTooltip } from "./Primitives";
 import { ModalValidarDominio } from "./Modals";
 import {
@@ -28,6 +27,8 @@ import { resolveCatalogo, getCronogramaById } from "../constants/cronogramas";
 import ActionInbox from "./ActionInbox";
 import WeeklyReview from "./WeeklyReview";
 import EmptyState from "./EmptyState";
+import VestibularStartTrail from "./VestibularStartTrail";
+import { isVestibularStartComplete } from "../core/vestibularOnboarding";
 
 /* --- CARGA FUTURA WIDGET --- */
 function CargaFuturaWidget({ temas, maxRevisoesDia }) {
@@ -41,8 +42,9 @@ function CargaFuturaWidget({ temas, maxRevisoesDia }) {
     <div className="medrev-card medrev-card-hover p-5 select-none animate-fade-in">
       <div className="flex items-center justify-between mb-4">
         <h4 className="text-[12px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
-          📊 Carga de Revisões (Próximos 14 dias)
-          <InfoTooltip texto="Projeção das revisões pendentes agendadas para os próximos 14 dias com base no algoritmo FSRS." />
+          <BarChart3 size={13} className="text-blue-400" />
+          Carga de Revisões (Próximos 14 dias)
+          <InfoTooltip texto="Projeção das revisões pendentes agendadas para os próximos 14 dias com base na curva de revisão." />
         </h4>
         <span className="text-[10px] text-gray-500 font-mono">Teto: {maxRevisoesDia}/dia · {diasSobrecarga} dias acima do teto</span>
       </div>
@@ -397,11 +399,11 @@ function MiniCronogramaWidget({
 
       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 
-        {/* ── Column 1: FSRS de Hoje ── */}
+        {/* ── Column 1: Curva de revisão hoje ── */}
         <div className="flex flex-col gap-2 rounded-xl border border-blue-500/15 bg-gradient-to-b from-blue-950/30 to-transparent p-3 min-h-[150px]">
           <div className="flex items-center justify-between">
             <span className="text-[9px] font-black uppercase tracking-wider text-blue-300/70">
-              FSRS de Hoje
+              Curva de revisão hoje
             </span>
             <span className={`text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
               dueTodayItems.length === 0
@@ -847,7 +849,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       (showToast || showToastGlobal)("Abra o bloco azul de calendário e use 'Importar cronograma'.");
     } else if (action.type === "ja_domino") {
       setView && setView("crono");
-      (showToast || showToastGlobal)("No calendário da semana, use o botão 'Ja domino' no tema desejado.");
+      (showToast || showToastGlobal)("No plano da semana, use o botão 'Já domino' no tema desejado.");
     } else if (action.type === "aliviar") {
       const currentCap = meta.maxRevisoesDia || 30;
       const newCap = Math.max(5, Math.round(currentCap / 2));
@@ -864,7 +866,6 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
   const [showCompletionModal, setShowCompletionModal] = useState(false);
   const [showConfettiLocal, setShowConfettiLocal] = useState(false);
   const [showWelcome, setShowWelcome] = useState(false);
-  const [showWeeklyDiag, setShowWeeklyDiag] = useState(false);
   const [showCompleto, setShowCompleto] = useState(!modoSimples);
   const [showSetupFlow, setShowSetupFlow] = useState(false);
   const [temaValidando, setTemaValidando] = useState(null);
@@ -904,7 +905,9 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
     autoCatchUp();
   }, [autoCatchUp]);
 
-  const done    = temasFiltrados.flatMap((t) => STEPS.map((s) => ({ ...t.rev[s.key], esp: t.esp, step: s, temaNome: t.nome, temaId: t.id, ankiDeck: t.ankiDeck }))).filter((r) => r.done);
+  const done    = temasFiltrados
+    .flatMap((t) => STEPS.map((s) => ({ ...t.rev[s.key], esp: t.esp, step: s, temaNome: t.nome, temaId: t.id, ankiDeck: t.ankiDeck })))
+    .filter((r) => r.done && !r.skipped && r.skipReason !== "dominio_previo" && !r.skippeadoPorDominio);
 
   const filaInteligente = useFilaInteligente(temasFiltrados);
 
@@ -945,18 +948,6 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
   }, [exibidosHoje, temasFiltrados]);
 
   const pending = overdue.length + today_.length;
-  const userState = useMemo(() => {
-    const dataCriacao = meta?.createdAt || meta?.lastActiveDate || todayStr();
-    const datasSessoes = done.map((r) => r.date).filter(Boolean);
-    return getUserState(dataCriacao, datasSessoes, todayStr());
-  }, [meta?.createdAt, meta?.lastActiveDate, done]);
-  const userStateMentorMsg = useMemo(() => {
-    const key = `estado_${userState}`;
-    const recent = getRecentPhrases();
-    const phrase = getMentorPhrase(key, { userName }, recent, plat, meta?.tomMentor || "gentil");
-    if (phrase?.id) trackRecentPhrase(phrase.id);
-    return phrase?.text || "";
-  }, [userState, userName, plat, meta?.tomMentor]);
 
   const diag = useMemo(() => {
     return getMentorDiagnosis(userName, temasFiltrados, done, temaStats, plat, meta);
@@ -1035,7 +1026,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
         ...STEPS.map((s) => t.rev?.[s.key]),
         t.rev?.manutencao,
       ])
-      .filter((r) => r?.done === true)
+      .filter((r) => r?.done === true && !r.skipped && r.skipReason !== "dominio_previo" && !r.skippeadoPorDominio)
       .length;
   }, [temas]);
 
@@ -1113,23 +1104,13 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
   useEffect(() => {
     if (!onboardingDone) return;       // still in tour — don't show
     if (tourStep) return;              // tour in progress
-    const shown = sessionStorage.getItem(SESSION_KEY);
-    if (shown) {
-      if (diag && diag.status !== "calibracao" && diag.insights && diag.insights.length > 0) {
-        const lastShown = meta.lastWeeklyDiagnosisDate;
-        const today = todayStr();
-        if (!lastShown || (new Date(today) - new Date(lastShown)) / (1000 * 60 * 60 * 24) >= 7) {
-          setShowWeeklyDiag(true);
-        }
-      }
-      return;
-    }
+    if (sessionStorage.getItem(SESSION_KEY)) return;
     const t = setTimeout(() => {
       setShowWelcome(true);
       sessionStorage.setItem(SESSION_KEY, "1");
     }, 600);                           // small delay so UI renders first
     return () => clearTimeout(t);
-  }, [onboardingDone, tourStep, diag, meta.lastWeeklyDiagnosisDate]);
+  }, [onboardingDone, tourStep]);
 
   const acertoMedio = useMemo(() => {
     const rs = done.filter(r => r.acerto != null);
@@ -1216,7 +1197,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       title: action.title || "Manter consistência leve",
       subtitle: subtitle || "Sem urgência crítica detectada. Siga o plano com ritmo sustentável.",
       primaryLabel: action.cta || "Executar ação",
-      secondaryLabel: "Ver estatísticas",
+      secondaryLabel: "Ver por quê",
       tone,
       action,
     };
@@ -1225,24 +1206,25 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
   const runMentorPrimaryAction = useCallback(() => {
     const action = mentorNextAction || {};
     const target = action.target || {};
+    // 1. Alvo explícito de revisão (tema + etapa): inicia o Modo Foco direto.
     if (target.temaId && target.stepKey && onStudy) {
       onStudy(target.temaId, target.stepKey);
       return;
     }
+    // 2. Comandos de fila/revisão sem alvo explícito (ex.: "Fechar fila de hoje").
+    //    O Mentor planeja, o aluno executa: abrimos a próxima revisão da fila.
     const view = action.ctaView || target.view || "dash";
-    if (!target.temaId && view === "focus" && !topFilaItem) {
-      console.warn("[Mentor] Action without executable target in Dashboard");
-      if (setView) setView("crono");
-      return;
-    }
-    if (view === "focus") {
+    const isQueueCommand =
+      ["fila_do_dia", "revisao_vencida", "relearning"].includes(action.type) || view === "focus";
+    if (isQueueCommand) {
       if (topFilaItem && onStudy) {
         onStudy(topFilaItem.temaId, topFilaItem.stepKey);
       } else if (setView) {
-        setView("dash");
+        setView("crono");
       }
       return;
     }
+    // 3. Demais comandos: navega para a tela correspondente.
     if (setView) setView(view);
   }, [mentorNextAction, onStudy, setView, topFilaItem]);
 
@@ -1421,12 +1403,6 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
   const showMilestoneCelebration = useMemo(() => {
     return streakCurrent > 0 && (streakCurrent === 7 || streakCurrent === 30 || streakCurrent === 100);
   }, [streakCurrent]);
-  const nextTwoActions = useMemo(() => {
-    return (Array.isArray(mentorTodayPlan) ? mentorTodayPlan : [])
-      .filter(Boolean)
-      .slice(0, 2)
-      .map((item) => (typeof item === "string" ? { title: item } : item));
-  }, [mentorTodayPlan]);
   const todayLoadSignals = useMemo(() => {
     const scheduler = mentorContext?.scheduler || {};
     return {
@@ -1436,7 +1412,23 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       relearningCount: Number(scheduler.relearningCount ?? 0),
     };
   }, [mentorContext, pending]);
+  const todayLoadSummary = useMemo(() => {
+    const loadLabel = {
+      high: "alta",
+      moderate: "moderada",
+      ok: "tranquila",
+    }[todayLoadSignals.overloadLevelToday] || "tranquila";
+    const relearningText = todayLoadSignals.relearningCount > 0
+      ? ` · ${todayLoadSignals.relearningCount} reaprendendo`
+      : "";
+    return `${todayLoadSignals.dueTodayCount} revisões · ${todayLoadSignals.todayMinutes} min · carga ${loadLabel}${relearningText}`;
+  }, [todayLoadSignals]);
   const [showAdvanced, setShowAdvanced] = useState(false);
+  const [showMentorWhy, setShowMentorWhy] = useState(false);
+  const vestibularStartComplete = useMemo(() => {
+    if (plat !== "vest") return true;
+    return isVestibularStartComplete(meta);
+  }, [plat, meta]);
   useEffect(() => {
     if (streakCurrent >= 100 && !meta?.streakMaxAvisado) {
       (showToast || showToastGlobal)("Streak consolidado: agora priorize retenção real, não o número.");
@@ -1511,12 +1503,6 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
 
   return (
     <div className="flex flex-col gap-6 md:gap-8 animate-fade-up text-left max-w-6xl mx-auto">
-      {(userState === "at_risk" || userState === "dormant" || userState === "resurrected") && userStateMentorMsg && (
-        <div className="bg-[var(--surface-1)] border border-amber-500/25 rounded-2xl p-3">
-          <p className="text-[10px] uppercase tracking-wider text-amber-400 font-black">Intervenção do Mentor</p>
-          <p className="text-xs text-gray-200 mt-1">{userStateMentorMsg}</p>
-        </div>
-      )}
       {/* Camada primaria: mentor + acao do dia + progresso */}
       <section
         className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--surface-2)] p-5 md:p-7 shadow-[0_1px_0_rgba(255,255,255,.03)_inset,0_18px_42px_-28px_rgba(37,99,235,.45)]"
@@ -1593,6 +1579,9 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
               <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-2)]">
                 {comandoDoDia.subtitle}
               </p>
+              <p className="inline-flex w-fit rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-200">
+                {todayLoadSummary}
+              </p>
             </div>
 
             <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
@@ -1613,7 +1602,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
               </button>
               <button
                 type="button"
-                onClick={() => setView && setView("stats")}
+                onClick={() => setShowMentorWhy((prev) => !prev)}
                 className="min-h-[44px] rounded-xl px-4 py-3 text-sm font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
               >
                 {comandoDoDia.secondaryLabel}
@@ -1624,52 +1613,23 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
                 </span>
               )}
             </div>
+            {showMentorWhy && (
+              <div className="max-w-2xl rounded-2xl border border-white/10 bg-black/20 p-3 text-[12px] text-gray-300">
+                <p className="mb-2 font-black uppercase tracking-wider text-[10px] text-blue-300">Por que o Mentor escolheu isso</p>
+                {(comandoDoDia.action?.explain?.length ? comandoDoDia.action.explain : [comandoDoDia.action?.reason || comandoDoDia.subtitle]).slice(0, 4).map((item, index) => (
+                  <p key={`${item}-${index}`} className="leading-relaxed">• {item}</p>
+                ))}
+              </div>
+            )}
           </div>
 
           <DailyProgressRing value={dailyProgress} goal={dailyGoal} />
         </div>
       </section>
 
-      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
-        <article className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4">
-          <p className="text-[10px] font-black uppercase tracking-wider text-blue-300">Proximas 2 acoes</p>
-          {nextTwoActions.length > 0 ? (
-            <div className="mt-2 space-y-2">
-              {nextTwoActions.map((item, idx) => (
-                <div key={idx} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
-                  <p className="text-[11px] font-bold text-white">{item.title || "Acao sugerida"}</p>
-                  {item.subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{item.subtitle}</p>}
-                </div>
-              ))}
-            </div>
-          ) : (
-            <p className="text-[11px] text-gray-500 mt-2">Sem acoes pendentes no plano de hoje.</p>
-          )}
-        </article>
-        <article className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-4">
-          <p className="text-[10px] font-black uppercase tracking-wider text-blue-300">Carga de hoje</p>
-          <div className="mt-2 grid grid-cols-2 gap-2">
-            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
-              <p className="text-[9px] text-gray-500 uppercase tracking-wider">Revisoes</p>
-              <p className="text-sm font-black text-white">{todayLoadSignals.dueTodayCount}</p>
-            </div>
-            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
-              <p className="text-[9px] text-gray-500 uppercase tracking-wider">Minutos</p>
-              <p className="text-sm font-black text-white">{todayLoadSignals.todayMinutes}</p>
-            </div>
-            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
-              <p className="text-[9px] text-gray-500 uppercase tracking-wider">Relearning</p>
-              <p className="text-sm font-black text-white">{todayLoadSignals.relearningCount}</p>
-            </div>
-            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
-              <p className="text-[9px] text-gray-500 uppercase tracking-wider">Overload</p>
-              <p className={`text-sm font-black ${todayLoadSignals.overloadLevelToday === "high" ? "text-red-400" : todayLoadSignals.overloadLevelToday === "moderate" ? "text-amber-300" : "text-emerald-300"}`}>
-                {todayLoadSignals.overloadLevelToday}
-              </p>
-            </div>
-          </div>
-        </article>
-      </section>
+      {plat === "vest" && !vestibularStartComplete && (
+        <VestibularStartTrail setView={setView} onOpenAjustes={onOpenAjustes} />
+      )}
 
       <ActionInbox mode={modoSimples ? "mentor" : "manual"} onStudy={onStudy} setView={setView} />
 
@@ -1701,7 +1661,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
           onClick={() => setShowAdvanced((prev) => !prev)}
           className="w-full text-left flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider text-gray-300 hover:text-white cursor-pointer border-none bg-transparent"
         >
-          <span>Avancado</span>
+          <span>Avançado</span>
           <span className="text-[10px] text-gray-500">{showAdvanced ? "ocultar" : "mostrar"}</span>
         </button>
       </section>
@@ -1712,7 +1672,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 select-none">
         <DashboardKpiCard
           label="Fila de hoje"
-          icon="📋"
+          icon={<ClipboardList size={13} className="text-amber-300" />}
           accentColor={pending > 0 ? "#f59e0b" : "#10b981"}
           value={String(pendingCountUp) + (naReserva > 0 ? " +" + naReserva : "")}
           tone={pending > 0 ? "text-amber-400" : "text-emerald-400"}
@@ -1726,7 +1686,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
 
         <DashboardKpiCard
           label="Preparo"
-          icon="🎯"
+          icon={<Target size={13} className="text-blue-300" />}
           accentColor="#3b82f6"
           value={String(readinessCountUp) + "%"}
           tone="text-blue-400"
@@ -1760,7 +1720,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
 
         <DashboardKpiCard
           label="Acerto"
-          icon="✅"
+          icon={<CheckCircle size={13} className="text-emerald-300" />}
           accentColor={acertoMedio != null ? (acertoMedio >= 80 ? "#10b981" : acertoMedio >= 65 ? "#3b82f6" : "#ef4444") : "#6b7280"}
           value={acertoMedio != null ? String(acertoCountUp) + "%" : "—"}
           tone={acertoMedio != null ? (acertoMedio >= 80 ? "text-emerald-400" : acertoMedio >= 65 ? "text-blue-400" : "text-red-400") : "text-gray-500"}
@@ -1772,7 +1732,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
 
         <DashboardKpiCard
           label="Streak"
-          icon="🔥"
+          icon={<Flame size={13} className="text-orange-300" />}
           accentColor="#f97316"
           value={String(streakCountUp) + "/7"}
           tone="text-orange-400"
@@ -1981,7 +1941,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
                 <InfoTooltip texto="Defina detalhes cruciais como a data da prova, meta de acertos e seu banco de questões para que o algoritmo do MedRev trabalhe perfeitamente ajustado ao seu objetivo." />
               </h4>
               <p className="text-[11px] text-gray-400 mt-1">
-                Você está utilizando configurações padrão. Personalize suas datas e metas de acerto para calibrar o motor FSRS.
+                Você está utilizando configurações padrão. Personalize suas datas e metas de acerto para calibrar a curva de revisão.
               </p>
             </div>
           </div>
@@ -2012,7 +1972,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
       {/* Camada terciaria: carga e detalhes */}
       <CargaFuturaWidget temas={temas} maxRevisoesDia={meta.maxRevisoesDia || 30} />
 
-      {/* DICA P5: retenção FSRS alta demais → sobrecarga */}
+      {/* DICA P5: retenção alta demais → sobrecarga */}
       {(() => {
         const proj = getWorkloadProjection(temas, 14);
         const cap_ = meta.maxRevisoesDia || 30;
@@ -2022,7 +1982,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
           return (
             <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
               <div>
-                <p className="text-[10px] uppercase tracking-wider text-amber-400 font-black">Dica de Eficiência FSRS</p>
+                <p className="text-[10px] uppercase tracking-wider text-amber-400 font-black">Dica de eficiência da curva</p>
                 <p className="text-[11.5px] text-gray-300 mt-1 leading-relaxed max-w-lg">
                   Você está afogado em revisões por {diasSobrecarga} dias. Considere baixar a retenção-alvo para 85% temporariamente — menos revisões/dia, mantendo a maior parte do conhecimento.
                 </p>
@@ -2144,14 +2104,14 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
         </div>
       )}
 
-      {/* ZONA 2 — Diagnóstico do Mentor */}
+      {/* ZONA 2 — Análise de desempenho (dados, não voz do mentor) */}
       <div className="medrev-card p-5 flex flex-col gap-4 relative overflow-hidden">
         <div className="absolute -left-12 -bottom-12 w-28 h-28 rounded-full bg-cyan-600/5 blur-2xl pointer-events-none" />
-        
+
         <div className="flex items-center justify-between border-b border-white/5 pb-2">
           <div className="flex items-center gap-2 flex-wrap">
-            <Brain size={16} className="text-blue-400" />
-            <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-wider mr-2">Diagnóstico do Mentor</h3>
+            <BarChart3 size={16} className="text-blue-400" />
+            <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-wider mr-2">Análise de Desempenho</h3>
             <span className="text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
               {totalSessions < 7 ? "Fase 1: Calibração" : totalSessions < 30 ? "Fase 2: Ritmo" : "Fase 3: Elite"}
             </span>
@@ -2166,10 +2126,10 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
         {diag.status === "calibracao" ? (
           <div className="space-y-4">
             <div className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl flex-col sm:flex-row">
-              <div className="text-2xl shrink-0">🤖</div>
+              <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
               <div className="space-y-2 flex-1">
                 <p className="text-xs text-gray-300 leading-relaxed font-semibold">
-                  Estou calibrando meu algoritmo de inteligência cognitiva para seu perfil.
+                  Dados insuficientes para análise completa. Conclua mais sessões para liberar as métricas avançadas.
                 </p>
                 <div className="space-y-1">
                   <div className="bg-white/5 rounded-full h-2 overflow-hidden border border-white/5 relative">
@@ -2188,48 +2148,45 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
 
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
-                <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-wide"><Unlock size={11} className="shrink-0" /> Nível 7+ (Calibrado)</span>
+                <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-wide"><Unlock size={11} className="shrink-0" /> A partir de 7 sessões</span>
                 <p className="text-[10.5px] text-gray-400 leading-relaxed">
-                  Desbloqueia análise de horário ótimo, fraquezas por especialidade e detecção de viés de confiança.
+                  Libera análise de horário ótimo, fraquezas por especialidade e detecção de viés de confiança.
                 </p>
               </div>
               <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
-                <span className="flex items-center gap-1.5 text-[10px] font-black text-sky-400 uppercase tracking-wide"><Unlock size={11} className="shrink-0" /> Nível 30+ (Elite)</span>
+                <span className="flex items-center gap-1.5 text-[10px] font-black text-sky-400 uppercase tracking-wide"><Unlock size={11} className="shrink-0" /> A partir de 30 sessões</span>
                 <p className="text-[10.5px] text-gray-400 leading-relaxed">
-                  Desbloqueia projeção estatística de nota/aprovação com base no seu histórico e peso das provas.
+                  Libera projeção estatística de nota/aprovação com base no seu histórico e peso das provas.
                 </p>
               </div>
             </div>
           </div>
         ) : (
           <div className="flex flex-col gap-2.5">
-            <div className="flex items-start gap-3 p-3 bg-blue-500/5 text-blue-300 border border-blue-500/10 rounded-xl mb-1">
-              <span className="text-base shrink-0 mt-0.5">🧠</span>
-              <p className="text-[12px] leading-relaxed font-bold">
-                {totalSessions < 30 
-                  ? "Já conheço seu ritmo. Ajustei a fila para seus horários de pico." 
-                  : "Perfil completo. A fila agora é 100% sua."}
-              </p>
-            </div>
+            <p className="text-[11px] text-gray-500 leading-relaxed pl-1 mb-0.5">
+              {totalSessions < 30
+                ? "Fila ajustada aos seus horários de maior desempenho."
+                : "Histórico suficiente: fila calibrada 100% pelo seu desempenho real."}
+            </p>
             {nonCriticalInsights.map((insight, idx) => {
-              let icon = "💡";
+              let InsightIcon = Info;
               let colorClass = "bg-white/[0.02] text-gray-300 border border-white/5";
               if (insight.type === "alerta" || insight.type === "vies_excesso") {
-                icon = "🤝";
+                InsightIcon = AlertTriangle;
                 colorClass = "bg-amber-500/5 text-amber-300 border border-amber-500/10";
               } else if (insight.type === "tendencia_baixa") {
-                icon = "🤝";
+                InsightIcon = TrendingDown;
                 colorClass = "bg-red-500/5 text-red-300 border border-red-500/10";
               } else if (insight.type === "tendencia_alta") {
-                icon = "🤝";
+                InsightIcon = TrendingUp;
                 colorClass = "bg-emerald-500/5 text-emerald-300 border border-emerald-500/10";
               } else if (insight.type === "horario") {
-                icon = "🤝";
+                InsightIcon = Zap;
                 colorClass = "bg-indigo-500/5 text-indigo-300 border border-indigo-500/10";
               }
               return (
                 <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${colorClass}`}>
-                  <span className="text-base shrink-0 mt-0.5">{icon}</span>
+                  <InsightIcon size={16} className="shrink-0 mt-0.5" />
                   <div className="flex-1 flex flex-col gap-1.5 text-left">
                     <p className="text-[12px] leading-relaxed font-medium">{insight.text}</p>
                     <div className="flex items-center justify-between gap-2 mt-0.5 flex-wrap">
@@ -2298,18 +2255,18 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
               <span className="text-[10px] text-gray-500 block mt-1">Nenhum tema ativo</span>
             )}
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[min(13rem,calc(100vw-2rem))] bg-[#141417] border border-white/10 rounded-xl p-3 text-[10px] text-gray-400 shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed">
-              Número de temas cadastrados que completaram com sucesso todas as etapas da curva FSRS (D0 até o D21).
+              Número de temas cadastrados que completaram com sucesso todas as etapas da curva de revisão (D0 até o D21).
             </div>
           </div>
 
-          {/* True Retention */}
+          {/* Retenção longa */}
           <ProgressiveTooltip
             tooltipId="true_retention"
-            text="Mentor: True Retention mede a taxa de acerto nas revisões de longo prazo (D21+). Manter esse índice acima de 80% indica retenção sólida de conteúdo."
+            text="Mentor: Retenção longa mede a taxa de acerto nas revisões de longo prazo (D21+). Manter esse índice acima de 80% indica retenção sólida de conteúdo."
           >
             <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative group w-full">
               <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5 cursor-help">
-                True Retention
+                Retenção longa
                 <Info size={13} className="text-gray-600 hover:text-gray-400 transition-colors" />
               </p>
               {trueRet != null ? (
@@ -2470,7 +2427,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
                           <div className="flex items-center gap-1 flex-wrap">
                             <p className="text-xs font-bold text-white truncate">{r.temaNome}</p>
                             {isOptimalItem && (
-                              <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-black shrink-0" title="Retrievabilidade FSRS em ~87%: Ponto ideal de revisibilidade deliberada">
+                              <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-black shrink-0" title="Ponto ideal de revisão em ~87% de retenção projetada">
                                 🎯 Ponto Ótimo
                               </span>
                             )}
@@ -2666,16 +2623,7 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
           forceExhausted={hasExhaustionNow}
           meta={meta}
           naReserva={naReserva}
-          onClose={() => {
-            setShowWelcome(false);
-            if (diag && diag.status !== "calibracao" && diag.insights && diag.insights.length > 0) {
-              const lastShown = meta.lastWeeklyDiagnosisDate;
-              const today = todayStr();
-              if (!lastShown || (new Date(today) - new Date(lastShown)) / (1000 * 60 * 60 * 24) >= 7) {
-                setShowWeeklyDiag(true);
-              }
-            }
-          }}
+          onClose={() => setShowWelcome(false)}
           onStartFocus={() => {
             setShowWelcome(false);
             if (topFilaItem) {
@@ -2685,79 +2633,6 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
         />
       )}
 
-      {showWeeklyDiag && (
-        <div
-          className="fixed inset-0 z-[400] flex items-center justify-center p-4"
-          style={{
-            background: "rgba(5,5,12,0.85)",
-            backdropFilter: "blur(12px)",
-            WebkitBackdropFilter: "blur(12px)",
-            transition: "opacity 0.25s ease",
-          }}
-          onClick={() => {
-            setShowWeeklyDiag(false);
-            useStore.setState({ meta: { ...meta, lastWeeklyDiagnosisDate: todayStr() } });
-          }}
-        >
-          <div
-            className="relative w-full max-w-[min(26rem,calc(100vw-2rem))] animate-fade-up bg-[var(--surface-2)] border border-blue-500/25 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-950/50"
-            onClick={(e) => e.stopPropagation()}
-          >
-            <div className="h-[3px] w-full bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600" />
-            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
-              <div className="flex items-center gap-2">
-                <Brain size={18} className="text-blue-400" />
-                <h3 className="text-sm font-black text-white uppercase tracking-wider">Ritual de Retorno</h3>
-              </div>
-              <button
-                onClick={() => {
-                  setShowWeeklyDiag(false);
-                  useStore.setState({ meta: { ...meta, lastWeeklyDiagnosisDate: todayStr() } });
-                }}
-                className="text-gray-500 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
-              >
-                <X size={16} />
-              </button>
-            </div>
-
-            <div className="p-5 space-y-4">
-              <div className="space-y-1">
-                <h4 className="text-base font-extrabold text-white leading-tight">Sua semana em 3 frases:</h4>
-                <p className="text-xs text-gray-400">Aqui está o ajuste de rota recomendado pelo seu Mentor:</p>
-              </div>
-
-              <div className="space-y-3">
-                {diag?.insights && diag.insights.map((insight, idx) => {
-                  let InsightIcon = Lightbulb;
-                  if (insight.type === "alerta" || insight.type === "vies_excesso") InsightIcon = AlertTriangle;
-                  else if (insight.type === "tendencia_baixa") InsightIcon = TrendingDown;
-                  else if (insight.type === "tendencia_alta") InsightIcon = TrendingUp;
-                  else if (insight.type === "horario") InsightIcon = Zap;
-
-                  return (
-                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-gray-300">
-                      <InsightIcon size={16} className="shrink-0 mt-0.5" />
-                      <p className="text-xs leading-relaxed font-medium">{insight.text}</p>
-                    </div>
-                  );
-                })}
-              </div>
-
-              <button
-                type="button"
-                onClick={() => {
-                  setShowWeeklyDiag(false);
-                  useStore.setState({ meta: { ...meta, lastWeeklyDiagnosisDate: todayStr() } });
-                }}
-                className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl font-black text-xs tracking-wider transition-all active:scale-[0.98] cursor-pointer border-none shadow-lg shadow-indigo-900/25"
-              >
-                Bora ajustar! →
-              </button>
-            </div>
-          </div>
-        </div>
-      )}
-
       {tourStep === "dash" && showTourBalloon && (
         <TourBalloon
           text="Mentor: Viu as datas de D1, D4, D7, D21 que apareceram? Eu calculei quando você vai esquecer e agendei as revisões. Você nunca mais decide quando revisar — eu decido."
@@ -2777,19 +2652,20 @@ export default function Dashboard({ onStudy, onDelete, userName, onEditName, foc
           onConfirm={({ questoes, acertos }) => {
             const resultado = calcularDominioPrevio({ total: questoes, acertos });
             validarDominio(plat, temaValidando.id, { questoes, acertos });
-            const pct = Math.round((acertos / questoes) * 100);
             if (resultado.valido) {
-              (showToast || showToastGlobal)(
-                `Domínio prévio validado: ${pct}% — próxima revisão em D${resultado.intervaloInicial}.`
-              );
+              if ((resultado.intervaloInicial || 7) >= 14) {
+                (showToast || showToastGlobal)("Tema validado com alta segurança. Próxima revisão: D14.");
+              } else {
+                (showToast || showToastGlobal)("Tema validado. Próxima revisão: D7.");
+              }
             } else {
-              (showToast || showToastGlobal)(`Domínio ainda não está estável (${pct}%). Tema mantido no fluxo normal.`);
+              (showToast || showToastGlobal)("Validação insuficiente. Comece pelo estudo guiado para proteger sua base.");
             }
             if (trackEvent) {
               trackEvent("dominio_previo_avaliado", {
                 plat,
                 tema_id: temaValidando.id,
-                percentual: pct,
+                percentual: resultado.percentual,
                 status: resultado.status,
               });
             }
diff --git a/src/components/FocusMode.jsx b/src/components/FocusMode.jsx
index ce4526cd..378683b7 100644
--- a/src/components/FocusMode.jsx
+++ b/src/components/FocusMode.jsx
@@ -12,6 +12,10 @@ import { getMentorPhrase, getRecentPhrases, trackRecentPhrase, isExhaustionDetec
 import { getFaseItem, todayStr, addDays, STEPS } from "../core/fsrs";
 import { ERROR_TYPE, dominantErrorType } from "../core/errorTaxonomy";
 import { createSessionReflection } from "../core/sessionReflection";
+import ErrorActionPrompt from "./ErrorActionPrompt";
+import ClinicalTaskPanel from "./ClinicalTaskPanel";
+import { getReviewTaskForStep } from "../core/reviewTaskPlanner";
+import { CASOS_CLINICOS } from "../constants/casosClinicos";
 
 const STEP_ICONS = { pretest: FileText, leitura: BookOpen, esqueleto: Layers, braindump: Brain, questoes: PenTool, anki: Zap };
 
@@ -53,6 +57,7 @@ export default function FocusMode({ onExit, plat, temas, onCompleteStep, targete
   const temaStats = useStore((s) => s.temaStats || {});
   const addSessionReflection = useStore((s) => s.addSessionReflection);
   const rebuildActionInboxForToday = useStore((s) => s.rebuildActionInboxForToday);
+  const casosProgresso = useStore((s) => s[plat]?.casosProgresso || {});
 
   const doneReviews = useMemo(() => {
     return temas.flatMap((t) => STEPS.map((s) => t.rev[s.key])).filter(r => r && r.done);
@@ -106,6 +111,20 @@ export default function FocusMode({ onExit, plat, temas, onCompleteStep, targete
 
   const tema = activeReviewItem?.tema;
   const stepKey = activeReviewItem?.stepKey;
+
+  // P4-C: tarefa clinica multimodal para o step atual (res only, gated por modulo)
+  const clinicalTask = useMemo(() => {
+    if (!tema || !stepKey || plat !== "res") return null;
+    return getReviewTaskForStep({
+      tema,
+      stepKey,
+      casos: CASOS_CLINICOS,
+      progresso: casosProgresso,
+      plat,
+      modulos: meta?.modulos,
+    });
+  }, [tema, stepKey, plat, casosProgresso, meta?.modulos]);
+
   const fase = useMemo(() => {
     if (!tema || !stepKey) return null;
     return getFaseItem(tema, stepKey);
@@ -135,6 +154,7 @@ export default function FocusMode({ onExit, plat, temas, onCompleteStep, targete
 
   const [showTransitionScreen, setShowTransitionScreen] = useState(false);
   const [lastCompletedItem, setLastCompletedItem] = useState(null);
+  const [lastDominantError, setLastDominantError] = useState(null);
   const [showSessionClosure, setShowSessionClosure] = useState(false);
   const [closureDraft, setClosureDraft] = useState(null);
 
@@ -153,9 +173,16 @@ export default function FocusMode({ onExit, plat, temas, onCompleteStep, targete
   const inferMainIssue = useCallback((markData = {}) => {
     const dominant = dominantErrorType(markData.erros || []);
     if (dominant === ERROR_TYPE.CONTENT || dominant === ERROR_TYPE.MEMORY) return "conteudo";
-    if (dominant === ERROR_TYPE.REASONING) return "raciocinio";
+    // Raciocinio clinico: inclui os 5 novos tipos de P3-A
+    if (
+      dominant === ERROR_TYPE.REASONING ||
+      dominant === ERROR_TYPE.PROBLEM_REPRESENTATION ||
+      dominant === ERROR_TYPE.DIFFERENTIAL ||
+      dominant === ERROR_TYPE.SCT_UNCERTAINTY ||
+      dominant === ERROR_TYPE.MANAGEMENT
+    ) return "raciocinio";
     if (dominant === ERROR_TYPE.INTERPRETATION || dominant === ERROR_TYPE.DISTRACTION) return "distracao";
-    if (dominant === ERROR_TYPE.TIME) return "tempo";
+    if (dominant === ERROR_TYPE.TIME || dominant === ERROR_TYPE.EXAM_STRATEGY) return "tempo";
     if (String(markData.cansaco || "").toLowerCase().startsWith("alt")) return "energia";
     return "nenhum";
   }, []);
@@ -200,6 +227,10 @@ export default function FocusMode({ onExit, plat, temas, onCompleteStep, targete
     const nextAdjustment = inferNextAdjustment(mainIssue, outcome);
     const confidenceRaw = String(markData.confianca || confianca || "media").toLowerCase();
     const confidence = confidenceRaw.startsWith("alt") ? "alta" : confidenceRaw.startsWith("baix") ? "baixa" : "media";
+    // Captura erro dominante para exibir apos fechamento
+    const stepErrors = Array.isArray(markData.erros) ? markData.erros : [];
+    const stepDominant = dominantErrorType(stepErrors);
+    setLastDominantError(stepDominant || null);
     setClosureDraft({
       source: "focus",
       tema: currentTemaName,
@@ -452,7 +483,7 @@ export default function FocusMode({ onExit, plat, temas, onCompleteStep, targete
       : nextItem.esp === "Preventiva"
       ? "Preventiva tem peso estratégico no ENAMED (12%) e alto retorno por tempo de estudo."
       : nextItem.overdue
-      ? "Este item está atrasado no agendamento do FSRS e atingiu o ponto ideal de revisão."
+      ? "Este item está atrasado na curva de revisão e atingiu o ponto ideal de revisão."
       : "Item de alta prevalência e prioridade de memorização para a prova.") : "";
 
     const lowestComp = lastCompletedItem?.esp === "Redação" && lastCompletedItem.c1 !== undefined
@@ -501,6 +532,16 @@ export default function FocusMode({ onExit, plat, temas, onCompleteStep, targete
             )}
           </div>
 
+          {lastDominantError && (
+            <ErrorActionPrompt
+              dominantError={lastDominantError}
+              context="pos-sessao"
+              tema={lastCompletedItem?.nome || null}
+              onAction={() => setShowTransitionScreen(false)}
+              onDismiss={() => setLastDominantError(null)}
+            />
+          )}
+
           <div className="flex flex-col gap-2 pt-2">
             {nextItem && (
               <button
@@ -921,7 +962,7 @@ export default function FocusMode({ onExit, plat, temas, onCompleteStep, targete
               <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                 <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide">Finalização do Estudo Ativo (D0)</h4>
                 <p className="text-xs text-gray-400 leading-relaxed mt-1.5">
-                  Informe o resultado das questões feitas para registrar seu ponto de partida e calibrar o algoritmo FSRS.
+                  Informe o resultado das questões feitas para registrar seu ponto de partida e calibrar a curva de revisão.
                 </p>
               </div>
 
@@ -1323,6 +1364,11 @@ export default function FocusMode({ onExit, plat, temas, onCompleteStep, targete
                 </p>
               </div>
 
+              {/* P4-C: Tarefa clinica multimodal (res only, gated por modulo) */}
+              {clinicalTask && tema?.esp !== "Redação" && (
+                <ClinicalTaskPanel task={clinicalTask} />
+              )}
+
               {tema?.esp !== "Redação" && (
                 <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-2xl text-left space-y-1.5 animate-fade-in">
                   <div className="flex items-center gap-2">
diff --git a/src/components/Modals.jsx b/src/components/Modals.jsx
index 12cb3f6d..9c6bde5a 100644
--- a/src/components/Modals.jsx
+++ b/src/components/Modals.jsx
@@ -17,6 +17,7 @@ import {
 import { getAnonymousStorageKey, getOrCreateAnonymousSessionId, getUserScopedStorageKey } from "../core/userScope";
 import { detectLegacyGlobalStore, migrateLegacyStoreToUserScope } from "../core/userDataMigration";
 import { getReadinessData } from "../core/readiness";
+import { getEnamedContextBadge } from "../core/enamedIntel";
 
 import {
   STEPS, IMPORTANCIA, ESPS_RES, ESPS_VEST,
@@ -40,7 +41,7 @@ const PROVA_STATS = {
 export function HelpModal({ onClose }) {
   const [tab, setTab] = useState("secoes");
   const sections = [
-    { icon: LayoutDashboard, color: "#a78bfa", title: "Dashboard", desc: "Painel central com fila cronológica, fila inteligente (score algorítmico), heatmap de consistência 35 dias, True Retention D21 e Zonas de Alerta por especialidade." },
+    { icon: LayoutDashboard, color: "#a78bfa", title: "Hoje", desc: "Painel central com fila cronológica, fila inteligente, heatmap de consistência 35 dias, retenção longa D21 e zonas de alerta por especialidade." },
     { icon: Calendar, color: "#60a5fa", title: "Cronograma", desc: "Grade MEDCOF 2026 completa (26 blocos, 23 especialidades). Inicie ciclos direto de um tema ou monte cronogramas semanais com criação manual ou importação de PDF." },
     { icon: BarChart3, color: "#34d399", title: "Banco de Dados", desc: "Tabela de todos os temas. Ordene por nome, progresso, questões ou acerto. Exporte em CSV para análise externa." },
     { icon: FileText, color: "#f472b6", title: "Estatísticas", desc: "Análise de provas-alvo (ENAMED, USP-SP, UNIFESP) com incidência por área e tópicos de risco 2026. Inclui aba 'Meu Desempenho' com seus dados pessoais." },
@@ -48,7 +49,7 @@ export function HelpModal({ onClose }) {
     { icon: Zap, color: "#fbbf24", title: "Anki Audit", desc: "Monitore a calibração do Anki. Registre sessões e acompanhe a taxa de 'Again' — ideal abaixo de 15% para retenção de longo prazo." },
   ];
   const workflow = [
-    { step: "D0", icon: BookOpen, color: "#a78bfa", label: "Estudo Inicial", desc: "Leia o conteúdo, resolva questões e registre o acerto. O FSRS-Lite calcula automaticamente a data das próximas revisões." },
+    { step: "D0", icon: BookOpen, color: "#a78bfa", label: "Estudo Inicial", desc: "Leia o conteúdo, resolva questões e registre o acerto. A curva de revisão calcula automaticamente a data das próximas revisões." },
     { step: "D1", icon: Edit2, color: "#60a5fa", label: "Brain Dump", desc: "No dia seguinte, abra o assistente e escreva tudo que lembra (5 min, material fechado). Isso consolida a memória de trabalho para longo prazo." },
     { step: "D4", icon: Target, color: "#34d399", label: "Revisão Ativa", desc: "Questões focadas no tema. Seu acerto ajusta o intervalo da próxima revisão via curva de esquecimento." },
     { step: "D7", icon: TrendingUp, color: "#fb923c", label: "Questões + Anki", desc: "Sétimo dia: questões de prova + revisão do deck Anki correspondente. Corrija os erros do simulado se houver." },
@@ -61,7 +62,7 @@ export function HelpModal({ onClose }) {
           <MedRevLogo size="md" />
           <div>
             <h2 className="text-[16px] font-bold text-white">Guia de Uso</h2>
-            <p className="text-[11px] text-gray-500">Motor FSRS-Lite · v7.1</p>
+            <p className="text-[11px] text-gray-500">Curva de revisão · v7.1</p>
           </div>
         </div>
 
@@ -117,7 +118,7 @@ export function HelpModal({ onClose }) {
             <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
               <span className="text-xs font-black text-blue-400 font-mono">FSRS (Free Spaced Repetition Scheduler)</span>
               <p className="text-[11px] text-gray-400 leading-relaxed">
-                Algoritmo matemático de repetição espaçada que estima o nível de estabilidade da memória baseado nas suas taxas de acertos e calcula a data ideal de revisão para garantir 90% de retenção (True Retention).
+                Algoritmo matemático de repetição espaçada que estima o nível de estabilidade da memória baseado nas suas taxas de acertos e calcula a data ideal de revisão para garantir retenção longa.
               </p>
             </div>
             <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
@@ -127,7 +128,7 @@ export function HelpModal({ onClose }) {
               </p>
             </div>
             <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
-              <span className="text-xs font-black text-blue-400 font-mono">True Retention D21+</span>
+              <span className="text-xs font-black text-blue-400 font-mono">Retenção longa D21+</span>
               <p className="text-[11px] text-gray-400 leading-relaxed">
                 A porcentagem real de acertos nas revisões de longo prazo (etapas D21 em diante). É a métrica mais pura do seu nível de aprendizado real. Ideal acima de 80%.
               </p>
@@ -1122,6 +1123,10 @@ export function TemaModal({ initial, platKey, onSave, onCancel, onDelete }) {
 
   const filteredProvas = (meta.provasAlvo || []).filter(p => (platKey === "res" ? PROVAS_RES : PROVAS_VEST).includes(p));
   const rec = getRecomendacao(f.esp, filteredProvas);
+  const enamedBadge = useMemo(
+    () => platKey === "res" ? getEnamedContextBadge(f.esp, f.nome) : null,
+    [platKey, f.esp, f.nome]
+  );
 
   useEffect(() => {
     setF((prev) => ({ ...prev, prio: rec.nivel }));
@@ -1167,6 +1172,35 @@ export function TemaModal({ initial, platKey, onSave, onCancel, onDelete }) {
             {rec.msg}
           </div>
         </div>
+        {enamedBadge && (
+          <div className="col-span-2">
+            <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-1.5">
+              Incidência no ENAMED
+            </p>
+            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
+              enamedBadge.nivel === "alto"
+                ? "bg-orange-500/5 border-orange-500/20"
+                : enamedBadge.nivel === "medio"
+                ? "bg-amber-500/5 border-amber-500/20"
+                : "bg-white/5 border-white/10"
+            }`}>
+              <span className="text-base shrink-0 leading-none mt-0.5">🔥</span>
+              <div>
+                <p className={`text-[11.5px] font-bold leading-snug ${
+                  enamedBadge.nivel === "alto" ? "text-orange-300"
+                  : enamedBadge.nivel === "medio" ? "text-amber-300"
+                  : "text-gray-400"
+                }`}>
+                  {enamedBadge.subarea}
+                  {enamedBadge.questoes ? ` · ~${enamedBadge.questoes} questões` : ` · ${enamedBadge.pctAbsoluto}%`}
+                </p>
+                <p className="text-[10.5px] text-gray-500 mt-0.5">
+                  {enamedBadge.pctAbsoluto}% de {enamedBadge.area} no corpus ENAMED analisado
+                </p>
+              </div>
+            </div>
+          </div>
+        )}
         <div className="col-span-2">
           <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-1.5">Importância Prova</p>
           <div className="flex gap-1 bg-black border border-white/10 rounded-xl p-0.5">
@@ -1621,7 +1655,7 @@ export function AjustesModal({
               </Field>
 
               <div className="grid grid-cols-2 gap-3">
-                <Field label="Meta diária de questões (0 = inativo)" info="Quantidade de questões resolvidas que você quer atingir por dia (utilizado para calcular o Saldo de Ritmo na aba de Prontidão).">
+                <Field label="Meta diária de questões (0 = inativo)" info="Quantidade de questões resolvidas que você quer atingir por dia (utilizado para calcular o Saldo de Ritmo na aba de Preparo).">
                   <Input type="number" min={0} value={meta.metaQuestoesDia || 0} onChange={(e) => saveMeta({ metaQuestoesDia: parseInt(e.target.value, 10) || 0 })} />
                 </Field>
                 <Field label="Meta total de questões (0 = inativo)" info="Quantidade total de questões resolvidas que você quer atingir ao final da preparação.">
@@ -1984,14 +2018,16 @@ export function AjustesModal({
               <p className="text-[11.5px] text-gray-500 leading-relaxed">
                 Exporte seu progresso estruturado ou restaure a partir de um backup JSON.
               </p>
-              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-[10px] text-gray-300 space-y-1">
-                <p><span className="text-gray-500">Usuario atual:</span> {userEmail || "sem email"} / {currentUid || "nao autenticado"}</p>
-                <p className="break-all"><span className="text-gray-500">Escopo local:</span> {scopeKey}</p>
-                <p><span className="text-gray-500">Ultima hidratacao:</span> {authScope?.lastHydratedAt ? new Date(authScope.lastHydratedAt).toLocaleString() : "pendente"}</p>
-                <p><span className="text-gray-500">Ultimo sync:</span> {authScope?.lastSyncAt ? new Date(authScope.lastSyncAt).toLocaleString() : "sem sync"}</p>
-                <p><span className="text-gray-500">Status:</span> {isolationStatus} · sync {syncStatus}</p>
-              </div>
-              <div className="grid grid-cols-3 gap-2">
+              {process.env.NODE_ENV !== "production" && (
+                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-[10px] text-gray-300 space-y-1">
+                  <p><span className="text-gray-500">Usuario atual:</span> {userEmail || "sem email"} / {currentUid || "nao autenticado"}</p>
+                  <p className="break-all"><span className="text-gray-500">Escopo local:</span> {scopeKey}</p>
+                  <p><span className="text-gray-500">Ultima hidratacao:</span> {authScope?.lastHydratedAt ? new Date(authScope.lastHydratedAt).toLocaleString() : "pendente"}</p>
+                  <p><span className="text-gray-500">Ultimo sync:</span> {authScope?.lastSyncAt ? new Date(authScope.lastSyncAt).toLocaleString() : "sem sync"}</p>
+                  <p><span className="text-gray-500">Status:</span> {isolationStatus} · sync {syncStatus}</p>
+                </div>
+              )}
+              <div className="grid grid-cols-2 gap-2">
                 <button
                   type="button"
                   onClick={handleExportBackup}
@@ -2008,14 +2044,16 @@ export function AjustesModal({
                     className="hidden"
                   />
                 </label>
+              </div>
+              {process.env.NODE_ENV !== "production" && (
                 <button
                   type="button"
                   onClick={handleMigrateLegacy}
-                  className="px-3 py-2 bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-bold transition-all"
+                  className="w-full px-3 py-2 bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-bold transition-all"
                 >
                   Migrar legado
                 </button>
-              </div>
+              )}
               {importFeedback?.warnings?.length > 0 && (
                 <p className="text-[10px] text-yellow-300">{importFeedback.warnings.join(" | ")}</p>
               )}
diff --git a/src/components/OnboardingWizard.jsx b/src/components/OnboardingWizard.jsx
index 6b55e95a..2dd96e21 100644
--- a/src/components/OnboardingWizard.jsx
+++ b/src/components/OnboardingWizard.jsx
@@ -3,20 +3,20 @@ import { Brain, CalendarDays, Compass, SkipForward } from "lucide-react";
 import { getRecommendedDefaultsForGoal } from "../core/onboarding";
 
 const GOAL_OPTIONS = [
-  { id: "enamed", label: "ENAMED", hint: "Prioriza trilha ENAMED e recomendacoes por area." },
-  { id: "residencia", label: "Residencia medica", hint: "Prioriza cronograma de residencia e rotina clinica." },
-  { id: "ambos", label: "Os dois", hint: "Combina ENAMED e residencia no mesmo fluxo." },
+  { id: "enamed", label: "ENAMED", hint: "Prioriza trilha ENAMED e recomendações por área." },
+  { id: "residencia", label: "Residência médica", hint: "Prioriza plano de residência e rotina clínica." },
+  { id: "ambos", label: "Os dois", hint: "Combina ENAMED e residência no mesmo fluxo." },
 ];
 
 const CALENDAR_OPTIONS = [
-  { id: "medcof", label: "MEDCOF", hint: "Base pronta para comecar agora." },
-  { id: "estrategia_extensivo_user", label: "Estrategia MED", hint: "Importe seu cronograma ou configure depois." },
+  { id: "medcof", label: "MEDCOF", hint: "Base pronta para começar agora." },
+  { id: "estrategia_extensivo_user", label: "Estratégia MED", hint: "Importe seu calendário ou configure depois." },
   { id: "custom", label: "Personalizado", hint: "Monte seu plano manualmente." },
 ];
 
 const MODE_OPTIONS = [
-  { id: "mentor", label: "Modo Mentor recomendado", hint: "O app escolhe a proxima melhor acao." },
-  { id: "manual", label: "Modo Manual", hint: "Voce ve mais paineis e decide o fluxo." },
+  { id: "mentor", label: "Modo Mentor recomendado", hint: "O app escolhe a próxima melhor ação." },
+  { id: "manual", label: "Modo Manual", hint: "Você vê mais painéis e decide o fluxo." },
 ];
 
 function ChoiceCard({ selected, label, hint, onClick }) {
@@ -64,7 +64,7 @@ export default function OnboardingWizard({ onComplete, onSkip, onOpenImport }) {
           <div className="flex items-center justify-between gap-3">
             <div>
               <p className="text-[10px] uppercase tracking-wider text-blue-300 font-black">Primeiros 2 minutos</p>
-              <h2 className="text-xl font-black text-white">Vamos configurar seu inicio</h2>
+              <h2 className="text-xl font-black text-white">Vamos configurar seu início</h2>
             </div>
             <span className="text-[11px] text-gray-400 font-bold">{step + 1}/3</span>
           </div>
@@ -77,7 +77,7 @@ export default function OnboardingWizard({ onComplete, onSkip, onOpenImport }) {
             <section className="space-y-3">
               <div className="flex items-center gap-2">
                 <Compass size={16} className="text-blue-300" />
-                <h3 className="text-sm font-bold text-white">Qual e seu foco agora?</h3>
+                <h3 className="text-sm font-bold text-white">Qual é seu foco agora?</h3>
               </div>
               <div className="space-y-2">
                 {GOAL_OPTIONS.map((item) => (
@@ -90,7 +90,7 @@ export default function OnboardingWizard({ onComplete, onSkip, onOpenImport }) {
                   />
                 ))}
               </div>
-              <p className="text-[11px] text-gray-500">Isso muda o peso das recomendacoes do Mentor. Voce pode alterar depois.</p>
+              <p className="text-[11px] text-gray-500">Isso muda o peso das recomendações do Mentor. Você pode alterar depois.</p>
             </section>
           )}
 
@@ -98,7 +98,7 @@ export default function OnboardingWizard({ onComplete, onSkip, onOpenImport }) {
             <section className="space-y-3">
               <div className="flex items-center gap-2">
                 <CalendarDays size={16} className="text-blue-300" />
-                <h3 className="text-sm font-bold text-white">Como voce quer organizar os temas?</h3>
+                <h3 className="text-sm font-bold text-white">Como você quer organizar os temas?</h3>
               </div>
               <div className="space-y-2">
                 {CALENDAR_OPTIONS.map((item) => (
@@ -113,7 +113,7 @@ export default function OnboardingWizard({ onComplete, onSkip, onOpenImport }) {
               </div>
               {calendarProvider === "estrategia_extensivo_user" && (
                 <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
-                  <p className="text-[11px] text-blue-100">Voce pode importar agora ou configurar depois sem travar o acesso.</p>
+                  <p className="text-[11px] text-blue-100">Você pode importar agora ou configurar depois sem travar o acesso.</p>
                   {onOpenImport && (
                     <button
                       type="button"
@@ -132,7 +132,7 @@ export default function OnboardingWizard({ onComplete, onSkip, onOpenImport }) {
             <section className="space-y-3">
               <div className="flex items-center gap-2">
                 <Brain size={16} className="text-blue-300" />
-                <h3 className="text-sm font-bold text-white">Como voce quer comecar?</h3>
+                <h3 className="text-sm font-bold text-white">Como você quer começar?</h3>
               </div>
               <div className="space-y-2">
                 {MODE_OPTIONS.map((item) => (
@@ -151,7 +151,7 @@ export default function OnboardingWizard({ onComplete, onSkip, onOpenImport }) {
           {showSkipWarn && (
             <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3">
               <p className="text-[11px] text-amber-100">
-                Voce pode pular, mas o Mentor tera menos contexto.
+                Você pode pular, mas o Mentor terá menos contexto.
               </p>
             </div>
           )}
diff --git a/src/components/RaciocinioClinico.jsx b/src/components/RaciocinioClinico.jsx
index 9f6a14d3..74651911 100644
--- a/src/components/RaciocinioClinico.jsx
+++ b/src/components/RaciocinioClinico.jsx
@@ -1,18 +1,32 @@
 // src/components/RaciocinioClinico.jsx
 import React, { useMemo, useState } from "react";
-import { Brain, ClipboardList, MessageSquareText, Stethoscope, CheckCircle, Eye, CalendarDays } from "lucide-react";
+import { Brain, ClipboardList, MessageSquareText, Stethoscope, CheckCircle, Eye, CalendarDays, Pill, AlertTriangle } from "lucide-react";
 import { CASOS_CLINICOS } from "../constants/casosClinicos";
 import { useStore } from "../core/store";
 import { Btn, Textarea, Tabs, InfoTooltip } from "./Primitives";
 import { fmtRelativo } from "../core/fsrs";
 import SessionClosureModal from "./SessionClosureModal";
 import EmptyState from "./EmptyState";
+import { calculateClinicalReasoningScore } from "../core/clinicalReasoningScoring";
 
 const FASES = [
   { k: "script", label: "Illness Scripts", icon: Brain },
   { k: "caso", label: "Casos", icon: ClipboardList },
   { k: "sct", label: "SCT", icon: MessageSquareText },
   { k: "anamnese", label: "Anamnese", icon: Stethoscope },
+  { k: "conduta", label: "Conduta", icon: Pill },
+];
+
+// Campos da fase de conduta simulada
+const CONDUTA_FIELDS = [
+  { key: "estabilizacao", label: "Estabilizacao inicial", placeholder: "Vias aereas, acesso venoso, monitoracao, posicao, O2..." },
+  { key: "examesIniciais", label: "Exames iniciais", placeholder: "Laboratoriais, imagem, ECG, culturas..." },
+  { key: "tratamento", label: "Tratamento definitivo", placeholder: "Cirurgia, clinico, procedimento, internacao..." },
+  { key: "medicacoes", label: "Medicacoes e doses", placeholder: "Nome, dose, via, frequencia (uso educacional)" },
+  { key: "internacao", label: "Internacao ou ambulatorio", placeholder: "Criterios de internacao / ambulatorio / UTI" },
+  { key: "redFlags", label: "Red flags para reavaliacao", placeholder: "Sinais de alarme que exigem reavaliacao imediata" },
+  { key: "contraindicacoes", label: "Contraindicacoes relevantes", placeholder: "O que NAO fazer neste caso especifico" },
+  { key: "seguimento", label: "Seguimento e retorno", placeholder: "Consulta de retorno, exames de controle, orientacoes de alta" },
 ];
 
 function dificuldadeClass(dificuldade) {
@@ -21,16 +35,8 @@ function dificuldadeClass(dificuldade) {
   return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
 }
 
-function calcRaciocinioScore(casosProgresso) {
-  const vistos = Object.values(casosProgresso || {}).filter((p) => p?.vistos > 0);
-  const scores = vistos.flatMap((p) => [
-    typeof p.fase2Acerto === "number" ? p.fase2Acerto : null,
-    typeof p.sctAcerto === "number" ? p.sctAcerto : null,
-  ]).filter((v) => v != null);
-
-  if (!scores.length) return null;
-  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
-}
+// Removido: calcRaciocinioScore local substituida por calculateClinicalReasoningScore
+// de clinicalReasoningScoring.js (fonte canonica unica — P4-A)
 
 export default function RaciocinioClinico() {
   const plat = useStore((s) => s.plat);
@@ -51,10 +57,14 @@ export default function RaciocinioClinico() {
   const [anamneseRevelada, setAnamneseRevelada] = useState(false);
   const [showClosure, setShowClosure] = useState(false);
   const [closureDraft, setClosureDraft] = useState(null);
+  // P4-D: fase conduta
+  const [conductaAvisoAceito, setConductaAvisoAceito] = useState(false);
+  const [conductaRespostas, setConductaRespostas] = useState({});
+  const [conductaRevelada, setConductaRevelada] = useState(false);
 
   const caso = CASOS_CLINICOS.find((item) => item.id === activeCasoId) || CASOS_CLINICOS[0];
   const progresso = casosProgresso[caso?.id] || {};
-  const raciocinioScore = useMemo(() => calcRaciocinioScore(casosProgresso), [casosProgresso]);
+  const raciocinioScore = useMemo(() => calculateClinicalReasoningScore(casosProgresso), [casosProgresso]);
   const casosFeitos = useMemo(
     () => Object.values(casosProgresso || {}).filter((item) => item?.vistos > 0).length,
     [casosProgresso]
@@ -130,6 +140,26 @@ export default function RaciocinioClinico() {
     });
   };
 
+  // P4-D: revelar e pontuar conduta simulada
+  const revelarConduta = () => {
+    setConductaRevelada(true);
+    // Score por cobertura: campos preenchidos / total
+    const preenchidos = CONDUTA_FIELDS.filter((f) =>
+      String(conductaRespostas[f.key] || "").trim().length >= 5
+    ).length;
+    const managementScore = Math.round((preenchidos / CONDUTA_FIELDS.length) * 100);
+    registrar({
+      managementScore,
+      acertou: managementScore >= 60,
+      confianca: managementScore >= 75 ? 4 : 2,
+    });
+    abrirFechamento({
+      outcome: managementScore >= 80 ? "bom" : managementScore >= 60 ? "medio" : "ruim",
+      mainIssue: managementScore < 80 ? "raciocinio" : "nenhum",
+      nextAdjustment: managementScore < 80 ? "caso" : "manter",
+    });
+  };
+
   return (
     <div className="flex flex-col gap-4 animate-fade-up text-left">
       <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
@@ -177,6 +207,9 @@ export default function RaciocinioClinico() {
                   setCasoRevelado(false);
                   setSctRevelado(false);
                   setAnamneseRevelada(false);
+                  setConductaRevelada(false);
+                  setConductaRespostas({});
+                  setConductaAvisoAceito(false);
                 }}
                 className={`text-left rounded-2xl border p-3 transition-all ${ativo ? "bg-blue-500/10 border-blue-500/30" : "bg-[#111113] border-white/5 hover:border-white/10"}`}
               >
@@ -314,6 +347,149 @@ export default function RaciocinioClinico() {
               )}
             </div>
           )}
+
+          {/* P4-D: Conduta / Prescricao simulada */}
+          {activeFase === "conduta" && (
+            <div className="space-y-4">
+              {/* Aviso educacional obrigatorio — deve ser aceito antes de prosseguir */}
+              {!conductaAvisoAceito ? (
+                <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-5 space-y-4">
+                  <div className="flex items-start gap-3">
+                    <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
+                    <div className="space-y-2">
+                      <p className="text-[13px] font-bold text-amber-300">Aviso obrigatorio antes de continuar</p>
+                      <p className="text-[12px] text-gray-300 leading-relaxed">
+                        Esta fase simula a elaboracao de conduta e prescricao para fins exclusivamente educacionais.
+                      </p>
+                      <ul className="space-y-1.5 mt-2">
+                        {[
+                          "Nao aplicar qualquer decisao terapeutica em pacientes reais com base neste exercicio.",
+                          "Doses e medicamentos sugeridos sao hipoteticos e nao substituem diretrizes clinicas vigentes.",
+                          "Utilize esta fase apenas para treinar raciocinio de conduta, nao para prescricao real.",
+                        ].map((item, i) => (
+                          <li key={i} className="flex items-start gap-2 text-[11.5px] text-gray-400">
+                            <span className="text-amber-500 mt-0.5 shrink-0">•</span>
+                            {item}
+                          </li>
+                        ))}
+                      </ul>
+                    </div>
+                  </div>
+                  <button
+                    type="button"
+                    onClick={() => setConductaAvisoAceito(true)}
+                    className="w-full py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-bold text-[12px] rounded-xl transition-colors"
+                  >
+                    Entendi — iniciar simulacao educacional
+                  </button>
+                </div>
+              ) : (
+                <>
+                  <p className="text-[12px] text-gray-400 leading-relaxed">
+                    Simule a conduta completa para <strong className="text-gray-200">{caso.tema}</strong>.
+                    Preencha o maximo que conseguir antes de revelar o gabarito.
+                  </p>
+
+                  {/* Lembrete compacto pos-aceite */}
+                  <div className="flex items-center gap-2 bg-amber-950/10 border border-amber-500/10 rounded-xl px-3 py-2">
+                    <AlertTriangle size={11} className="text-amber-500 shrink-0" />
+                    <p className="text-[10px] text-amber-600">Uso educacional. Nao aplicar em paciente real.</p>
+                  </div>
+
+                  {/* Campos de conduta simulada */}
+                  <div className="space-y-3">
+                    {CONDUTA_FIELDS.map((field) => (
+                      <div key={field.key} className="space-y-1">
+                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
+                          {field.label}
+                        </label>
+                        <Textarea
+                          rows={2}
+                          value={conductaRespostas[field.key] || ""}
+                          onChange={(e) =>
+                            setConductaRespostas((prev) => ({ ...prev, [field.key]: e.target.value }))
+                          }
+                          placeholder={field.placeholder}
+                        />
+                      </div>
+                    ))}
+                  </div>
+
+                  {/* Indicador de preenchimento */}
+                  {!conductaRevelada && (() => {
+                    const preenchidos = CONDUTA_FIELDS.filter(
+                      (f) => String(conductaRespostas[f.key] || "").trim().length >= 5
+                    ).length;
+                    return (
+                      <div className="flex items-center gap-3">
+                        <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
+                          <div
+                            className="h-full bg-blue-600 rounded-full transition-all"
+                            style={{ width: `${(preenchidos / CONDUTA_FIELDS.length) * 100}%` }}
+                          />
+                        </div>
+                        <span className="text-[10px] text-gray-500 shrink-0">
+                          {preenchidos}/{CONDUTA_FIELDS.length} campos
+                        </span>
+                      </div>
+                    );
+                  })()}
+
+                  {!conductaRevelada && (
+                    <Btn onClick={revelarConduta}>
+                      <Eye size={14} /> Revelar gabarito de conduta
+                    </Btn>
+                  )}
+
+                  {/* Gabarito pos-revelacao */}
+                  {conductaRevelada && (
+                    <div className="space-y-3">
+                      <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
+                        <p className="text-[10px] uppercase tracking-wider text-blue-300 font-bold">Gabarito educacional</p>
+                        <div className="grid gap-2 sm:grid-cols-2">
+                          <div>
+                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Conduta base</p>
+                            <p className="text-[12px] text-gray-200 leading-relaxed">
+                              {caso.script?.management || "Conduta especifica nao descrita neste caso."}
+                            </p>
+                          </div>
+                          {caso.workup?.length > 0 && (
+                            <div>
+                              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Workup inicial</p>
+                              <p className="text-[12px] text-gray-200 leading-relaxed">
+                                {caso.workup.join(", ")}
+                              </p>
+                            </div>
+                          )}
+                        </div>
+                        {caso.anamnese?.redFlags?.length > 0 && (
+                          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
+                            <p className="text-[10px] uppercase tracking-wider text-red-300 font-black mb-1">Red flags</p>
+                            <p className="text-[12px] text-gray-200">{caso.anamnese.redFlags.join(", ")}</p>
+                          </div>
+                        )}
+                      </div>
+                      {/* Score de cobertura */}
+                      {(() => {
+                        const preenchidos = CONDUTA_FIELDS.filter(
+                          (f) => String(conductaRespostas[f.key] || "").trim().length >= 5
+                        ).length;
+                        const pct = Math.round((preenchidos / CONDUTA_FIELDS.length) * 100);
+                        return (
+                          <div className="flex items-center gap-3 bg-[#111113] border border-white/5 rounded-xl px-4 py-3">
+                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Cobertura da conduta</p>
+                            <p className={`text-xl font-black tabular-nums ml-auto ${pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400"}`}>
+                              {pct}%
+                            </p>
+                          </div>
+                        );
+                      })()}
+                    </div>
+                  )}
+                </>
+              )}
+            </div>
+          )}
         </div>
       </div>
       <SessionClosureModal
diff --git a/src/components/RetrievabilitySpark.jsx b/src/components/RetrievabilitySpark.jsx
index 025adcdb..6d103ca0 100644
--- a/src/components/RetrievabilitySpark.jsx
+++ b/src/components/RetrievabilitySpark.jsx
@@ -1,10 +1,51 @@
 import React, { useMemo } from "react";
 import { todayStr, addDays, diffDays, FSRS_FACTOR, FSRS_DECAY, STEPS, S_BASE } from "../core/fsrs";
+import { getDominioPrevioStatus } from "../core/domainValidation";
+
+function clampRetention(value) {
+  return Math.max(0.01, Math.min(1, value));
+}
+
+function getDominioInitialRetention(dominioStatus) {
+  const raw = Number(dominioStatus?.acerto);
+  if (!Number.isFinite(raw)) return null;
+  return clampRetention(raw > 1 ? raw / 100 : raw);
+}
+
+function getDominioHorizonDays(dominioStatus, today) {
+  const fromDate = dominioStatus?.validatedAt || today;
+  const toDate = dominioStatus?.firstReviewDate;
+  if (toDate) {
+    return Math.max(1, diffDays(fromDate, toDate));
+  }
+  return dominioStatus?.firstReviewStep === "d14" ? 14 : 7;
+}
 
 export default function RetrievabilitySpark({ tema }) {
+  const dominioStatus = getDominioPrevioStatus(tema);
+  const awaitingFirstDominioReview = dominioStatus.isValidated
+    && dominioStatus.firstReviewStep
+    && !tema?.rev?.[dominioStatus.firstReviewStep]?.done;
+
   const curve = useMemo(() => {
+    if (awaitingFirstDominioReview) {
+      const today = todayStr();
+      const horizonDays = getDominioHorizonDays(dominioStatus, today);
+      const initialRetention = getDominioInitialRetention(dominioStatus);
+      if (initialRetention == null) return [];
+
+      const currentS = horizonDays;
+      const points = [];
+      for (let i = 0; i <= horizonDays; i++) {
+        const targetDate = addDays(today, i);
+        const t = Math.max(0, diffDays(today, targetDate));
+        const modeled = (1 + FSRS_FACTOR * t / currentS) ** FSRS_DECAY;
+        points.push(Math.round(clampRetention(initialRetention * modeled) * 100));
+      }
+      return points;
+    }
     if (!tema || tema.unstarted) {
-      return Array(14).fill(100);
+      return [];
     }
 
     const today = todayStr();
@@ -16,13 +57,14 @@ export default function RetrievabilitySpark({ tema }) {
     const activeStepKey = STEPS.find(s => !tema.rev[s.key]?.done)?.key || "manutencao";
 
     if (activeStepKey === "d0") {
-      return Array(14).fill(100);
+      return [];
     }
 
     // Encontrar o último passo concluído
     let latestDoneStepIdx = -1;
     for (let i = STEPS.length - 1; i >= 0; i--) {
-      if (tema.rev[STEPS[i].key]?.done) {
+      const review = tema.rev[STEPS[i].key];
+      if (review?.done && !review?.skipped && review?.skipReason !== "dominio_previo" && !review?.skippeadoPorDominio) {
         latestDoneStepIdx = i;
         break;
       }
@@ -33,8 +75,7 @@ export default function RetrievabilitySpark({ tema }) {
       lastReviewDate = tema.rev[key]?.date || tema.d0 || today;
       currentS = tema.rev[key]?.S || S_BASE[key] || 1.0;
     } else {
-      lastReviewDate = tema.d0 || today;
-      currentS = S_BASE.d0 || 1.0;
+      return [];
     }
 
     if (activeStepKey === "manutencao" && tema.rev.manutencao) {
@@ -50,10 +91,10 @@ export default function RetrievabilitySpark({ tema }) {
       points.push(Math.round(R * 100));
     }
     return points;
-  }, [tema]);
+  }, [tema, awaitingFirstDominioReview, dominioStatus]);
 
   const sparklineData = useMemo(() => {
-    if (curve.length < 2) return { path: "", fillPath: "", color: "#10b981" };
+    if (curve.length < 2) return { path: "", fillPath: "", color: "#10b981", finalVal: null, finalY: 8 };
     const width = 60;
     const height = 16;
     const padding = 1.5;
@@ -73,20 +114,23 @@ export default function RetrievabilitySpark({ tema }) {
     // Cor dinâmica com base na retentibilidade final (daqui a 14 dias)
     const finalVal = curve[curve.length - 1];
     let color = "#10b981"; // verde (excelente)
-    let gradientId = `grad-${tema.id || "default"}`;
+    let gradientId = `grad-${tema?.id || "default"}`;
     if (finalVal < 65) {
       color = "#ef4444"; // vermelho (esquecimento crítico)
     } else if (finalVal < 85) {
       color = "#3b82f6"; // azul (necessita atenção)
     }
 
-    return { path, fillPath, color, finalVal, gradientId };
-  }, [curve, tema.id]);
+    return { path, fillPath, color, finalVal, gradientId, finalY: coords[coords.length - 1]?.y ?? 8 };
+  }, [curve, tema?.id]);
 
   if (!tema || tema.unstarted) return null;
+  if (curve.length < 2 || sparklineData.finalVal == null) return null;
+
+  const horizonLabel = awaitingFirstDominioReview ? dominioStatus.firstReviewLabel : "D14";
 
   return (
-    <div className="flex items-center gap-1.5 select-none" title={`Retentibilidade FSRS projetada para 14 dias. Hoje: ${curve[0]}% · D14: ${sparklineData.finalVal}%`}>
+    <div className="flex items-center gap-1.5 select-none" title={`Retenção projetada até ${horizonLabel}. Hoje: ${curve[0]}% · ${horizonLabel}: ${sparklineData.finalVal}%`}>
       <svg width="60" height="16" className="overflow-visible">
         <defs>
           <linearGradient id={sparklineData.gradientId} x1="0" y1="0" x2="0" y2="1">
@@ -102,7 +146,7 @@ export default function RetrievabilitySpark({ tema }) {
         {curve.length > 0 && (
           <circle 
             cx="60" 
-            cy={sparklineData.path ? sparklineData.path.split(" ").slice(-2)[1] : 8} 
+            cy={sparklineData.finalY} 
             r="1.8" 
             fill={sparklineData.color} 
           />
diff --git a/src/components/Simulados.jsx b/src/components/Simulados.jsx
index 9dacd1e5..066ad703 100644
--- a/src/components/Simulados.jsx
+++ b/src/components/Simulados.jsx
@@ -255,7 +255,7 @@ export default function Simulados({ onStudy, setView }) {
   }, [todosErros]);
 
   const tabs = [
-    { k: "painel", label: "Prontidão", icon: Target },
+    { k: "painel", label: "Preparo", icon: Target },
     { k: "correcao", label: "Revisão D7", icon: Award },
     { k: "area", label: "Por Área", icon: BarChart3 },
     { k: "metricas", label: "Elite", icon: ShieldAlert }
@@ -340,10 +340,10 @@ export default function Simulados({ onStudy, setView }) {
 
     if (type === "lacuna") {
       return tom === "gentil"
-        ? `Notei que boa parte dos seus erros se deve a ${typeName}. É super normal esquecer detalhes, especialmente com o volume de matérias. Sugiro priorizar as revisões do FSRS para consolidar esses pontos e preencher os buracos na teoria antes de prosseguir.`
+        ? `Notei que boa parte dos seus erros se deve a ${typeName}. É super normal esquecer detalhes, especialmente com o volume de matérias. Sugiro priorizar as revisões da curva para consolidar esses pontos e preencher os buracos na teoria antes de prosseguir.`
         : tom === "firme"
         ? `Seu calcanhar de Aquiles é ${typeName}. Não adianta correr com matéria nova se a base está instável. Vá para o anki e finalize todas as revisões ativas pendentes antes de fechar o dia de hoje.`
-        : `Identifiquei predominância de ${typeName} nos erros de simulado. Recomendo pausar avanços rápidos no cronograma e focar o FSRS na consolidação ativa dos tópicos que apresentaram falhas.`;
+        : `Identifiquei predominância de ${typeName} nos erros de simulado. Recomendo pausar avanços rápidos no cronograma e focar a curva de revisão na consolidação ativa dos tópicos que apresentaram falhas.`;
     } else if (type === "descuido") {
       return tom === "gentil"
         ? `Identifiquei que desatenção ou descuido (${typeName}) é o padrão dominante de erros. Geralmente é cansaço acumulado. Tente respirar fundo, alongar e, na hora da prova, fazer uma leitura reversa das alternativas para manter o foco.`
@@ -372,7 +372,7 @@ export default function Simulados({ onStudy, setView }) {
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2">
         <div className="flex items-center gap-2">
           <Target size={20} className="text-orange-400" />
-          <h2 className="text-[15px] font-bold text-gray-100">Prontidão e Simulados</h2>
+          <h2 className="text-[15px] font-bold text-gray-100">Preparo e Simulados</h2>
         </div>
         <Btn onClick={() => setModalOpen(true)} className="gap-1.5"><Plus size={16} /> Registrar Simulado</Btn>
       </div>
@@ -382,7 +382,7 @@ export default function Simulados({ onStudy, setView }) {
         <Tabs items={tabs} active={activeTab} onChange={setActiveTab} />
       </div>
 
-      {/* Conteúdo Aba 1: Prontidão */}
+      {/* Conteúdo Aba 1: Preparo */}
       {activeTab === "painel" && (
         <div className="flex flex-col gap-5">
           <div className="bg-[var(--surface-1)] border border-blue-500/20 rounded-2xl p-4">
@@ -454,13 +454,13 @@ export default function Simulados({ onStudy, setView }) {
           })()}
           {/* BLOCK 1: PRONTIDÃO GERAL (KPIs & Volume & Ritmo) */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
-            {/* Score de Prontidão */}
+            {/* Preparo estimado */}
             <div className="bg-[var(--surface-1)] border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
               <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-blue-600/5 blur-2xl pointer-events-none" />
               <div>
                 <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
-                  Score de Prontidão
-                  <Info size={11} className="text-gray-600 cursor-help" title="Cálculo combinado: acertos simulados (média móvel 4 últimos), True Retention D21+, cobertura e ritmo. Componentes sem dados ainda (simulados, retenção D21) não entram no cálculo e são incluídos automaticamente quando houver histórico." />
+                  Preparo estimado
+                  <Info size={11} className="text-gray-600 cursor-help" title="Cálculo combinado: acertos simulados (média móvel 4 últimos), retenção longa D21+, cobertura e ritmo. Componentes sem dados ainda (simulados, retenção D21) não entram no cálculo e são incluídos automaticamente quando houver histórico." />
                 </p>
                 <div className="flex items-baseline gap-2 mt-2">
                   <p className={`text-4xl font-black tabular-nums ${readiness.score !== null ? (readiness.score >= 75 ? "text-emerald-400" : readiness.score >= 60 ? "text-blue-400" : "text-amber-400") : "text-gray-600"}`}>
@@ -512,7 +512,7 @@ export default function Simulados({ onStudy, setView }) {
                 )}
               </div>
               <p className="text-[9.5px] text-gray-600 mt-3">
-                Soma cumulativa de questões resolvidas em sessões ativas do FSRS.
+                Soma cumulativa de questões resolvidas em sessões ativas da curva de revisão.
               </p>
             </div>
 
@@ -537,7 +537,7 @@ export default function Simulados({ onStudy, setView }) {
                 ) : (
                   <div className="mt-2 space-y-2">
                     <p className="text-xl font-bold text-gray-500">—</p>
-                    <p className="text-[10px] text-gray-500 italic">Meta diária não configurada. Defina nos Ajustes para ativar o Equilíbrio de Ritmo e o Score de Prontidão completo.</p>
+                    <p className="text-[10px] text-gray-500 italic">Meta diária não configurada. Defina nos Ajustes para ativar o Equilíbrio de Ritmo e o Preparo estimado completo.</p>
                     <button
                       type="button"
                       onClick={() => setView && setView("ajustes")}
@@ -983,5 +983,3 @@ export default function Simulados({ onStudy, setView }) {
   );
 }
 
-
-
diff --git a/src/components/StatsPanel.jsx b/src/components/StatsPanel.jsx
index eb2fd61a..c104406f 100644
--- a/src/components/StatsPanel.jsx
+++ b/src/components/StatsPanel.jsx
@@ -1,72 +1,303 @@
 // src/components/StatsPanel.jsx
-import React, { useMemo, lazy, Suspense } from "react";
-import { BarChart3, Flame } from "lucide-react";
+// Estatisticas reorganizadas em 7 secoes diagnosticaveis.
+// Cada secao responde: o que mede / da pra confiar / o que fazer.
+import React, { useMemo, useState, useEffect, lazy, Suspense } from "react";
+import {
+  BarChart3, Flame, BookOpen, AlertCircle, Trophy,
+  Brain, Activity, Settings, ChevronRight,
+} from "lucide-react";
 import { useStore } from "../core/store";
 import { STEPS, ESP_COLORS, todayStr, addDays, fmtDate } from "../core/fsrs";
 import { calcCalibration } from "../core/calibration";
 import { getMentorPhrase } from "../core/mentor";
 import { getReadinessData } from "../core/readiness";
-import { ERROR_TYPE_LABEL, dominantErrorType, summarizeErrors } from "../core/errorTaxonomy";
+import {
+  ERROR_TYPE_LABEL, dominantErrorType, summarizeErrors,
+} from "../core/errorTaxonomy";
+import {
+  evaluateMetric, formatMetricValue, METRIC_STATUS,
+} from "../core/metricsRegistry";
+import { calcTrueRetentionDetailed } from "../hooks/useMetrics";
+import { calculateClinicalReasoningScoreDetailed } from "../core/clinicalReasoningScoring";
 import EnamedMapa from "./EnamedMapa";
 import AdvancedSection from "./AdvancedSection";
 import LaunchChecklistPanel from "./LaunchChecklistPanel";
+import MetricCard from "./MetricCard";
+import ErrorActionCenter from "./ErrorActionCenter";
 
 const EnamedProvaAnalyzer = lazy(() => import("./EnamedProvaAnalyzer"));
 const WeeklyReview = lazy(() => import("./WeeklyReview"));
 const DataSafetyPanel = lazy(() => import("./DataSafetyPanel"));
 
-export default function StatsPanel({ setView }) {
+// ─── Secoes ───────────────────────────────────────────────────────────────────
+
+const SECTIONS = [
+  { id: "resumo",      label: "Resumo",     icon: BarChart3,     forPlat: ["res", "vest"] },
+  { id: "aprendizagem",label: "Aprendizagem",icon: BookOpen,      forPlat: ["res", "vest"] },
+  { id: "erros",       label: "Erros",      icon: AlertCircle,   forPlat: ["res", "vest"] },
+  { id: "provas",      label: "Provas",     icon: Trophy,        forPlat: ["res", "vest"] },
+  { id: "raciocinio",  label: "Raciocinio", icon: Brain,         forPlat: ["res"] },
+  { id: "atividade",   label: "Atividade",  icon: Activity,      forPlat: ["res", "vest"] },
+  // Sistema: ferramentas de manutencao/lancamento (dev). Oculta no build de producao.
+  { id: "sistema",     label: "Sistema",    icon: Settings,      forPlat: ["res", "vest"], devOnly: true },
+];
+
+// ─── Navegacao entre secoes ──────────────────────────────────────────────────
+
+function SectionNav({ sections, active, onChange }) {
+  return (
+    <div className="w-full overflow-x-auto pb-1">
+      <div className="flex gap-1 min-w-max">
+        {sections.map((s) => {
+          const Icon = s.icon;
+          const isActive = s.id === active;
+          return (
+            <button
+              key={s.id}
+              type="button"
+              onClick={() => onChange(s.id)}
+              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${
+                isActive
+                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
+                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
+              }`}
+            >
+              <Icon size={12} />
+              {s.label}
+            </button>
+          );
+        })}
+      </div>
+    </div>
+  );
+}
+
+// ─── Heatmap ─────────────────────────────────────────────────────────────────
+
+function Heatmap({ heatmapDays, doneDays, monthLabels }) {
+  return (
+    <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
+      <div>
+        <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
+          <Flame size={15} className="text-orange-400" /> Consistencia (Ultimas 12 Semanas)
+        </h3>
+        <p className="text-[11px] text-gray-500 mt-0.5">Dias ativos na plataforma.</p>
+      </div>
+      <div className="w-full overflow-x-auto select-none py-2">
+        <div className="min-w-[420px] max-w-lg mx-auto">
+          <div className="flex gap-2 mb-1">
+            <div className="w-8 shrink-0" />
+            <div className="grid grid-cols-12 gap-1.5 w-full">
+              {monthLabels.map((lbl, i) => (
+                <span key={i} className="text-[9px] text-gray-500 font-bold text-center uppercase tracking-wider block truncate">
+                  {lbl}
+                </span>
+              ))}
+            </div>
+          </div>
+          <div className="flex gap-2 items-start justify-center">
+            <div className="flex flex-col justify-between text-[9px] text-gray-500 h-28 pr-1 py-1 font-semibold uppercase tracking-wider select-none shrink-0">
+              <span>Dom</span><span>Qua</span><span>Sab</span>
+            </div>
+            <div className="grid grid-flow-col grid-rows-7 gap-1.5 h-28 w-full">
+              {heatmapDays.map((d) => {
+                const studied = doneDays.has(d);
+                return (
+                  <div
+                    key={d}
+                    title={`${fmtDate(d)}: ${studied ? "Estudo Realizado" : "Nenhuma Atividade"}`}
+                    className={`aspect-square w-3.5 h-3.5 rounded-sm transition-all duration-300 ${
+                      studied
+                        ? "bg-gradient-to-br from-blue-500 to-sky-500 shadow-sm shadow-slate-950/50"
+                        : "bg-white/[0.03] hover:bg-white/[0.08]"
+                    }`}
+                  />
+                );
+              })}
+            </div>
+          </div>
+        </div>
+      </div>
+    </div>
+  );
+}
+
+// ─── Grafico SVG de evolucao de acertos ──────────────────────────────────────
+
+const SVG_W = 500;
+const SVG_H = 130;
+
+function AccuracyChart({ data }) {
+  const { line, area, pts } = useMemo(() => {
+    if (!data || data.length < 2) return { line: "", area: "", pts: [] };
+    const len = data.length;
+    const startX = 15;
+    const endX = SVG_W - 15;
+    const ptsArr = data.map((p, i) => {
+      const x = (i / (len - 1)) * (endX - startX) + startX;
+      const y = SVG_H - (p.acerto / 100) * (SVG_H - 25) - 15;
+      return { x, y, val: p.acerto };
+    });
+    const l = `M ${ptsArr.map((p) => `${p.x},${p.y}`).join(" L ")}`;
+    const a = `${l} L ${ptsArr[ptsArr.length - 1].x},${SVG_H - 10} L ${ptsArr[0].x},${SVG_H - 10} Z`;
+    return { line: l, area: a, pts: ptsArr };
+  }, [data]);
+
+  if (!data || data.length < 2) {
+    return (
+      <p className="text-[11.5px] text-gray-500 text-center leading-relaxed p-8">
+        Insuficientes dados para grafico cronologico. Continue estudando.
+      </p>
+    );
+  }
+  return (
+    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
+      <defs>
+        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
+          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
+          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
+        </linearGradient>
+        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
+          <stop offset="0%" stopColor="#8b5cf6" />
+          <stop offset="100%" stopColor="#ec4899" />
+        </linearGradient>
+      </defs>
+      <line x1="15" y1={SVG_H - 10} x2={SVG_W - 15} y2={SVG_H - 10} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
+      <line x1="15" y1={(SVG_H - 25) * 0.5 + 15} x2={SVG_W - 15} y2={(SVG_H - 25) * 0.5 + 15} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
+      <line x1="15" y1="15" x2={SVG_W - 15} y2="15" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
+      <text x="17" y={SVG_H - 14} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">0%</text>
+      <text x="17" y={(SVG_H - 25) * 0.5 + 20} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">50%</text>
+      <text x="17" y="23" fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">100%</text>
+      {area && <path d={area} fill="url(#areaGrad)" />}
+      {line && <path d={line} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
+      {pts.map((p, i) => (
+        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#ec4899" stroke="#0e0e18" strokeWidth="1.5">
+          <title>{`Sessao ${i + 1}: ${p.val}%`}</title>
+        </circle>
+      ))}
+    </svg>
+  );
+}
+
+// ─── StatsPanel principal ─────────────────────────────────────────────────────
+
+export default function StatsPanel({ setView, initialSection = null, sectionTrigger = 0 }) {
   const { plat, temaStats, userName, meta } = useStore();
   const temas = useStore((s) => s[plat]?.temas || []);
   const simulados = useStore((s) => s[plat]?.simulados || []);
   const weeklyReviews = useStore((s) => s.weeklyReviews || []);
   const enamedAnalises = useStore((s) => s.enamedAnalises || []);
+  const casosProgresso = useStore((s) => s[plat]?.casosProgresso || {});
+  const sessionReflections = useStore((s) => s.sessionReflections || []);
+
+  // Secao ativa — padrao "resumo" (ou a secao inicial solicitada via navegacao)
+  const [activeSection, setActiveSection] = useState(initialSection || "resumo");
+
+  // Permite que a navegacao externa (ex.: aba Mais) abra uma secao especifica.
+  // O sectionTrigger garante que cada solicitacao force o salto, mesmo repetida.
+  useEffect(() => {
+    if (initialSection) setActiveSection(initialSection);
+    // eslint-disable-next-line react-hooks/exhaustive-deps
+  }, [sectionTrigger]);
+
+  // Filtrar secoes para plataforma atual
+  const availableSections = SECTIONS.filter(
+    (s) => s.forPlat.includes(plat) && (!s.devOnly || process.env.NODE_ENV !== "production")
+  );
 
-  const personalStats = useMemo(() => {
-    const startedTemas = temas.filter(t => !t.unstarted);
-    if (!startedTemas.length) return null;
-    const byEsp = {};
-    let totalQuestoes = 0, totalDoneSteps = 0;
-    startedTemas.forEach(t => {
-      if (!byEsp[t.esp]) byEsp[t.esp] = { questoes: 0, acertos: [], doneSteps: 0, total: 0 };
-      STEPS.forEach(s => {
-        const r = t.rev[s.key];
-        byEsp[t.esp].total++;
-        if (r.done) {
-          byEsp[t.esp].doneSteps++;
-          totalDoneSteps++;
-          if (r.questoes) { byEsp[t.esp].questoes += r.questoes; totalQuestoes += r.questoes; }
-          if (r.acerto != null) byEsp[t.esp].acertos.push(r.acerto);
-        }
-      });
-    });
-    const espStats = Object.entries(byEsp).map(([esp, v]) => ({
-      esp,
-      acc: v.acertos.length ? Math.round(v.acertos.reduce((a, b) => a + b) / v.acertos.length * 100) : null,
-      questoes: v.questoes,
-      doneSteps: v.doneSteps,
-      total: v.total,
-      progress: Math.round(v.doneSteps / v.total * 100),
-    })).sort((a, b) => b.questoes - a.questoes);
-    const withAcc = espStats.filter(e => e.acc != null);
-    const bestEsp  = withAcc.length ? [...withAcc].sort((a, b) => b.acc - a.acc)[0]  : null;
-    const worstEsp = withAcc.length ? [...withAcc].sort((a, b) => a.acc - b.acc)[0]  : null;
-    const allAcertos = startedTemas.flatMap(t => STEPS.map(s => t.rev[s.key])).filter(r => r.done && r.acerto != null);
-    const overallAcc = allAcertos.length ? Math.round(allAcertos.reduce((a, r) => a + r.acerto, 0) / allAcertos.length * 100) : null;
-    const totalConcluidos = startedTemas.filter(t => STEPS.every(s => t.rev[s.key].done)).length;
-    return { espStats, totalQuestoes, totalDoneSteps, bestEsp, worstEsp, overallAcc, totalConcluidos };
-  }, [temas]);
+  // Garantir que secao ativa e valida para esta plataforma
+  const currentSection = availableSections.find((s) => s.id === activeSection)
+    ? activeSection
+    : availableSections[0]?.id || "resumo";
+
+  // ─── Calculos compartilhados ────────────────────────────────────────────────
+
+  const startedTemas = useMemo(() => temas.filter((t) => !t.unstarted), [temas]);
 
-  // 12-Week Heatmap generation
+  // Retencao real
+  const retentionDetailed = useMemo(() => calcTrueRetentionDetailed(temas), [temas]);
+
+  // Readiness
+  const readinessData = useMemo(
+    () => getReadinessData({ temas, simulados, meta, plat, casosProgresso }),
+    [temas, simulados, meta, plat, casosProgresso]
+  );
+
+  // Sparkline de prontidao
+  const sparklinePath = useMemo(() => {
+    const hist = meta.prontidaoHist || [];
+    if (hist.length < 2) return "";
+    const width = 100;
+    const height = 20;
+    const padding = 2;
+    const dx = width / (hist.length - 1);
+    return hist
+      .map((p, i) => {
+        const x = i * dx;
+        const y = height - padding - (p.score / 100) * (height - padding * 2);
+        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
+      })
+      .join(" ");
+  }, [meta.prontidaoHist]);
+
+  // Erros
+  const errorAnalytics = useMemo(() => {
+    const fromReviews = temas.flatMap((tema) =>
+      STEPS.flatMap((step) => {
+        const review = tema.rev?.[step.key];
+        if (!review?.done) return [];
+        const structured = Array.isArray(review.erros) ? review.erros : [];
+        const fallback = Array.isArray(review.motivosErro)
+          ? review.motivosErro.map((tipoErro) => ({ tipoErro, acertou: false, confianca: review.confianca }))
+          : [];
+        return [...structured, ...fallback];
+      })
+    );
+    const fromSimulados = simulados.flatMap((sim) =>
+      (sim.questoesErradas || []).map((q) => ({
+        tipoErro: q.tipoErro,
+        acertou: false,
+        confianca: q.confianca,
+        tempoExcedido: Boolean(q.tempoExcedido),
+      }))
+    );
+    const errors = [...fromReviews, ...fromSimulados];
+    const summary = summarizeErrors(errors);
+    const dominant = dominantErrorType(errors);
+    return {
+      total: errors.length,
+      summary,
+      dominant,
+      confidenceMismatch: summary.confianca_mal_calibrada || 0,
+      reasoning: summary.raciocinio || 0,
+      time: summary.tempo || 0,
+    };
+  }, [temas, simulados]);
+
+  // Calibracao
+  const calibrationData = useMemo(() => {
+    const flatStats = Object.values(temaStats || {}).flat();
+    return calcCalibration(flatStats);
+  }, [temaStats]);
+
+  const calibrationMentorPhrase = useMemo(() => {
+    if (!calibrationData || calibrationData.status === "coletando") {
+      const remaining = 5 - (calibrationData?.n || 0);
+      return `Ainda reunindo dados. Faltam mais ${remaining} ${remaining === 1 ? "revisao" : "revisoes"} com previsao preenchida.`;
+    }
+    const key = `calibracao_${calibrationData.tendencia}`;
+    const phraseObj = getMentorPhrase(key, { userName: userName || "Estudante" }, [], plat);
+    return phraseObj.text;
+  }, [calibrationData, userName, plat]);
+
+  // Heatmap 12 semanas
   const heatmapDays = useMemo(() => {
     const days = [];
     const today = new Date();
-    // Go back to the Sunday of 11 weeks ago (total 12 weeks = 84 days)
     const startDay = new Date(today);
     startDay.setDate(today.getDate() - 83);
-    const dayOfWeek = startDay.getDay();
-    startDay.setDate(startDay.getDate() - dayOfWeek); // Adjust to Sunday
-
+    const dow = startDay.getDay();
+    startDay.setDate(startDay.getDate() - dow);
     for (let i = 0; i < 84; i++) {
       const d = new Date(startDay);
       d.setDate(startDay.getDate() + i);
@@ -77,20 +308,16 @@ export default function StatsPanel({ setView }) {
 
   const doneDays = useMemo(() => {
     const dates = new Set();
-    temas.forEach(t => {
-      STEPS.forEach(s => {
+    temas.forEach((t) => {
+      STEPS.forEach((s) => {
         const r = t.rev?.[s.key];
-        if (r && r.done && r.date) {
-          dates.add(r.date);
-        }
+        if (r?.done && r.date) dates.add(r.date);
       });
     });
-    Object.values(temaStats || {}).forEach(logs => {
+    Object.values(temaStats || {}).forEach((logs) => {
       if (Array.isArray(logs)) {
-        logs.forEach(log => {
-          if (log.completedAt) {
-            dates.add(log.completedAt.slice(0, 10));
-          }
+        logs.forEach((log) => {
+          if (log.completedAt) dates.add(log.completedAt.slice(0, 10));
         });
       }
     });
@@ -101,667 +328,611 @@ export default function StatsPanel({ setView }) {
     const labels = [];
     let lastMonth = "";
     for (let i = 0; i < 12; i++) {
-      const dayIndex = i * 7;
-      const dateStr = heatmapDays[dayIndex];
-      if (!dateStr) {
-        labels.push("");
-        continue;
-      }
+      const dateStr = heatmapDays[i * 7];
+      if (!dateStr) { labels.push(""); continue; }
       const date = new Date(dateStr + "T12:00:00");
       const monthName = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
-      if (monthName !== lastMonth) {
-        labels.push(monthName);
-        lastMonth = monthName;
-      } else {
-        labels.push("");
-      }
+      if (monthName !== lastMonth) { labels.push(monthName); lastMonth = monthName; }
+      else labels.push("");
     }
     return labels;
   }, [heatmapDays]);
 
-  // Chronological Accuracy Trend Data
+  // Grafico de acertos cronologico
   const chronologicalAccuracy = useMemo(() => {
     const list = [];
-    Object.entries(temaStats || {}).forEach(([temaId, logs]) => {
+    Object.entries(temaStats || {}).forEach(([, logs]) => {
       if (Array.isArray(logs)) {
-        logs.forEach(log => {
+        logs.forEach((log) => {
           if (log.acerto != null && log.completedAt) {
-            list.push({
-              completedAt: new Date(log.completedAt),
-              acerto: Math.round(log.acerto * 100)
-            });
+            list.push({ completedAt: new Date(log.completedAt), acerto: Math.round(log.acerto * 100) });
           }
         });
       }
     });
-    list.sort((a, b) => a.completedAt - b.completedAt);
-    return list;
+    return list.sort((a, b) => a.completedAt - b.completedAt);
   }, [temaStats]);
 
-  const svgWidth = 500;
-  const svgHeight = 130;
-  const pointsInfo = useMemo(() => {
-    if (chronologicalAccuracy.length < 2) return { line: "", area: "", pts: [] };
-    const len = chronologicalAccuracy.length;
-    const startX = 15;
-    const endX = svgWidth - 15;
-    const bottomY = svgHeight - 10;
-    
-    const pts = chronologicalAccuracy.map((p, i) => {
-      const x = (i / (len - 1)) * (endX - startX) + startX;
-      const y = svgHeight - (p.acerto / 100) * (svgHeight - 25) - 15;
-      return { x, y, val: p.acerto };
-    });
-    
-    const line = `M ${pts.map(p => `${p.x},${p.y}`).join(" L ")}`;
-    const area = `${line} L ${pts[pts.length - 1].x},${bottomY} L ${pts[0].x},${bottomY} Z`;
-    
-    return { line, area, pts };
-  }, [chronologicalAccuracy]);
-
-  // Chronological Redação Competency Trend Data (only for vest)
-  const redacaoHistory = useMemo(() => {
-    const list = [];
-    Object.entries(temaStats || {}).forEach(([temaId, logs]) => {
-      if (Array.isArray(logs)) {
-        logs.forEach(log => {
-          if (log.c1 !== undefined && log.completedAt) {
-            list.push({
-              completedAt: new Date(log.completedAt),
-              c1: log.c1 || 0,
-              c2: log.c2 || 0,
-              c3: log.c3 || 0,
-              c4: log.c4 || 0,
-              c5: log.c5 || 0,
-            });
-          }
-        });
-      }
+  // Forecast FSRS 14 dias
+  const forecastData = useMemo(() => {
+    const counts = {};
+    for (let i = 0; i < 14; i++) counts[addDays(todayStr(), i)] = 0;
+    temas.forEach((t) => {
+      STEPS.forEach((s) => {
+        const r = t.rev?.[s.key];
+        if (r && !r.done && r.date && counts[r.date] !== undefined) counts[r.date]++;
+      });
     });
-    list.sort((a, b) => a.completedAt - b.completedAt);
-    return list;
-  }, [temaStats]);
+    return Object.entries(counts).map(([date, count]) => ({ date, label: fmtDate(date), count }));
+  }, [temas]);
 
-  const redacaoPoints = useMemo(() => {
-    if (redacaoHistory.length < 2) return { c1: { path: "", pts: [] }, c2: { path: "", pts: [] }, c3: { path: "", pts: [] }, c4: { path: "", pts: [] }, c5: { path: "", pts: [] } };
-    const len = redacaoHistory.length;
-    const startX = 15;
-    const endX = svgWidth - 15;
-
-    const buildPath = (key) => {
-      const pts = redacaoHistory.map((p, i) => {
-        const x = (i / (len - 1)) * (endX - startX) + startX;
-        const val = p[key]; // 0 to 200
-        const y = svgHeight - (val / 200) * (svgHeight - 25) - 15;
-        return { x, y, val };
+  // Stats por especialidade
+  const personalStats = useMemo(() => {
+    if (!startedTemas.length) return null;
+    const byEsp = {};
+    let totalQuestoes = 0;
+    startedTemas.forEach((t) => {
+      if (!byEsp[t.esp]) byEsp[t.esp] = { questoes: 0, acertos: [], doneSteps: 0, total: 0 };
+      STEPS.forEach((s) => {
+        const r = t.rev[s.key];
+        byEsp[t.esp].total++;
+        if (r.done) {
+          byEsp[t.esp].doneSteps++;
+          if (r.questoes) { byEsp[t.esp].questoes += r.questoes; totalQuestoes += r.questoes; }
+          if (r.acerto != null) byEsp[t.esp].acertos.push(r.acerto);
+        }
       });
-      const path = `M ${pts.map(p => `${p.x},${p.y}`).join(" L ")}`;
-      return { path, pts };
+    });
+    const espStats = Object.entries(byEsp).map(([esp, v]) => ({
+      esp,
+      acc: v.acertos.length ? Math.round(v.acertos.reduce((a, b) => a + b) / v.acertos.length * 100) : null,
+      questoes: v.questoes,
+      doneSteps: v.doneSteps,
+      total: v.total,
+      progress: Math.round(v.doneSteps / v.total * 100),
+    })).sort((a, b) => b.questoes - a.questoes);
+    const withAcc = espStats.filter((e) => e.acc != null);
+    return {
+      espStats,
+      totalQuestoes,
+      totalConcluidos: startedTemas.filter((t) => STEPS.every((s) => t.rev[s.key].done)).length,
+      bestEsp: withAcc.length ? [...withAcc].sort((a, b) => b.acc - a.acc)[0] : null,
+      worstEsp: withAcc.length ? [...withAcc].sort((a, b) => a.acc - b.acc)[0] : null,
+      overallAcc: (() => {
+        const all = startedTemas.flatMap((t) => STEPS.map((s) => t.rev[s.key])).filter((r) => r.done && r.acerto != null);
+        return all.length ? Math.round(all.reduce((a, r) => a + r.acerto, 0) / all.length * 100) : null;
+      })(),
     };
+  }, [startedTemas]);
 
+  // Raciocinio clinico — dados existentes sem calculo duplicado
+  // P4-A: usa fonte canonica de clinicalReasoningScoring.js
+  const raciocinioStats = useMemo(() => {
+    const detailed = calculateClinicalReasoningScoreDetailed(casosProgresso);
+    const casosFeitos = detailed.byCase.filter((c) => c.vistos > 0).length;
     return {
-      c1: buildPath("c1"),
-      c2: buildPath("c2"),
-      c3: buildPath("c3"),
-      c4: buildPath("c4"),
-      c5: buildPath("c5"),
+      casosFeitos,
+      score: detailed.score,
+      n: detailed.n,
+      collecting: detailed.collecting,
+      confident: detailed.confident,
     };
-  }, [redacaoHistory]);
+  }, [casosProgresso]);
 
-  // FSRS Forecast: count number of uncompleted cards scheduled for each of next 14 days
-  const forecastData = useMemo(() => {
-    const counts = {};
-    for (let i = 0; i < 14; i++) {
-      const d = addDays(todayStr(), i);
-      counts[d] = 0;
+  // Dias ativos (ultima semana, para consistencia)
+  const activeLastWeek = useMemo(() => {
+    let count = 0;
+    for (let i = 0; i < 7; i++) {
+      if (doneDays.has(addDays(todayStr(), -i))) count++;
     }
-    temas.forEach(t => {
-      STEPS.forEach(s => {
+    return count;
+  }, [doneDays]);
+
+  // Vencidas e relearning
+  const { overdueCount, relearningCount, todayPending } = useMemo(() => {
+    const today = todayStr();
+    let overdue = 0;
+    let relearning = 0;
+    let pending = 0;
+    temas.forEach((t) => {
+      STEPS.forEach((s) => {
         const r = t.rev?.[s.key];
-        if (r && !r.done && r.date) {
-          if (counts[r.date] !== undefined) counts[r.date]++;
-        }
+        if (!r || r.done) return;
+        if (r.date && r.date < today) overdue++;
+        if (r.date === today) pending++;
+        if (s.key === "relearning" && !r.done) relearning++;
       });
     });
-    return Object.entries(counts).map(([date, count]) => ({
-      date,
-      label: fmtDate(date),
-      count
-    }));
+    return { overdueCount: overdue, relearningCount: relearning, todayPending: pending };
   }, [temas]);
 
-  const calibrationData = useMemo(() => {
-    const flatStats = Object.values(temaStats || {}).flat();
-    return calcCalibration(flatStats);
-  }, [temaStats]);
-
-  const calibrationMentorPhrase = useMemo(() => {
-    if (!calibrationData || calibrationData.status === "coletando") {
-      const remaining = 5 - (calibrationData?.n || 0);
-      return `Ainda estou reunindo dados. Faltam mais ${remaining} ${remaining === 1 ? "revisão" : "revisões"} com previsão preenchida para calibrarmos seu viés.`;
-    }
-    const key = `calibracao_${calibrationData.tendencia}`;
-    const phraseObj = getMentorPhrase(key, { userName: userName || "Estudante" }, [], plat);
-    return phraseObj.text;
-  }, [calibrationData, userName, plat]);
-
-  const readinessTrend = useMemo(() => {
-    const hist = meta.prontidaoHist || [];
-    if (hist.length === 0) {
-      const state = useStore.getState();
-      const simulados = state[plat]?.simulados || [];
-      const score = getReadinessData({ temas, simulados, meta, plat }).score || 0;
-      return { current: score, delta7: 0, delta30: 0 };
-    }
-    
-    const current = hist[hist.length - 1]?.score || 0;
-    
-    const sevenDaysAgo = addDays(todayStr(), -7);
-    const rec7 = hist.find(r => r.d >= sevenDaysAgo) || hist[0];
-    const val7 = rec7 ? rec7.score : current;
-    
-    const thirtyDaysAgo = addDays(todayStr(), -30);
-    const rec30 = hist.find(r => r.d >= thirtyDaysAgo) || hist[0];
-    const val30 = rec30 ? rec30.score : current;
-    
-    return {
-      current,
-      delta7: current - val7,
-      delta30: current - val30
-    };
-  }, [temas, plat, meta]);
-
-  const sparklinePath = useMemo(() => {
-    const hist = meta.prontidaoHist || [];
-    if (hist.length < 2) return "";
-    const width = 100;
-    const height = 20;
-    const padding = 2;
-    const maxVal = 100;
-    const dx = width / (hist.length - 1);
-    
-    return hist.map((p, i) => {
-      const x = i * dx;
-      const y = height - padding - (p.score / maxVal) * (height - padding * 2);
-      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
-    }).join(" ");
-  }, [meta.prontidaoHist]);
-
-  const errorAnalytics = useMemo(() => {
-    const fromReviews = temas.flatMap((tema) =>
-      STEPS.flatMap((step) => {
-        const review = tema.rev?.[step.key];
-        if (!review?.done) return [];
-        const structured = Array.isArray(review.erros) ? review.erros : [];
-        const fallback = Array.isArray(review.motivosErro)
-          ? review.motivosErro.map((tipoErro) => ({ tipoErro, acertou: false, confianca: review.confianca }))
-          : [];
-        return [...structured, ...fallback];
-      })
-    );
-
-    const fromSimulados = simulados.flatMap((simulado) =>
-      (simulado.questoesErradas || []).map((questao) => ({
-        tipoErro: questao.tipoErro,
-        acertou: false,
-        confianca: questao.confianca,
-        tempoExcedido: Boolean(questao.tempoExcedido),
-      }))
+  // Adesao Anki (ultima semana)
+  const ankiAdherencePct = useMemo(() => {
+    const datas = meta?.ankiAdesao?.datas || [];
+    if (!datas.length) return null;
+    let hits = 0;
+    for (let i = 0; i < 7; i++) if (datas.includes(addDays(todayStr(), -i))) hits++;
+    return Math.round((hits / 7) * 100);
+  }, [meta]);
+
+  // ─── Metricas avaliadas via registry ────────────────────────────────────────
+
+  const metricsEvaluated = useMemo(() => ({
+    trueRetention: evaluateMetric("trueRetention", retentionDetailed?.pct ?? null, { n: retentionDetailed?.n ?? 0 }),
+    overdueReviews: evaluateMetric("overdueReviews", overdueCount, {}),
+    relearningCount: evaluateMetric("relearningCount", relearningCount, {}),
+    dominantError: evaluateMetric("dominantError", errorAnalytics.dominant, { total: errorAnalytics.total }),
+    simuladoAccuracy: evaluateMetric("simuladoAccuracy", readinessData.acertoSimulado, { n: simulados.length }),
+    clinicalReasoningScore: evaluateMetric("clinicalReasoningScore", raciocinioStats.score, { n: raciocinioStats.n }),
+    ankiAdherence: evaluateMetric("ankiAdherence", ankiAdherencePct, { days: (meta?.ankiAdesao?.datas || []).length }),
+    weeklyConsistency: evaluateMetric("weeklyConsistency", activeLastWeek, { totalDays: 7 }),
+    coverageByArea: evaluateMetric("coverageByArea", readinessData.cobertura, { total: temas.length }),
+    enamedGap: evaluateMetric("enamedGap", null, { hasAnalise: enamedAnalises.length > 0 }),
+  }), [
+    retentionDetailed, overdueCount, relearningCount, errorAnalytics,
+    readinessData, simulados, raciocinioStats, ankiAdherencePct, meta,
+    activeLastWeek, temas, enamedAnalises,
+  ]);
+
+  // ─── Empty state global ─────────────────────────────────────────────────────
+
+  if (!temas.length) {
+    return (
+      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
+        <BarChart3 size={40} className="text-gray-700" />
+        <p className="text-[13px] text-gray-500">Adicione temas ao seu banco para ver estat\u00edsticas pessoais.</p>
+      </div>
     );
+  }
 
-    const errors = [...fromReviews, ...fromSimulados];
-    const summary = summarizeErrors(errors);
-    const dominant = dominantErrorType(errors);
-
-    return {
-      total: errors.length,
-      summary,
-      dominant,
-      confidenceMismatch: summary.confianca_mal_calibrada || 0,
-      reasoning: summary.raciocinio || 0,
-      time: summary.tempo || 0,
-    };
-  }, [simulados, temas]);
+  // ─── Renderizacao por secao ──────────────────────────────────────────────────
 
   return (
-    <div className="space-y-5 animate-fade-up text-left">
+    <div className="space-y-4 animate-fade-up text-left">
+      {/* Header */}
       <div className="flex items-center gap-2 border-b border-white/5 pb-2">
         <BarChart3 size={20} className="text-indigo-400" />
-        <h2 className="text-[15px] font-bold text-gray-100">Histórico de Desempenho</h2>
+        <h2 className="text-[15px] font-bold text-gray-100">Estat\u00edsticas</h2>
       </div>
 
-      <div className="space-y-5">
-        {!temas.length ? (
-          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
-            <BarChart3 size={40} className="text-gray-700" />
-            <p className="text-[13px] text-gray-500">Adicione temas ao seu banco para ver estatísticas pessoais.</p>
-          </div>
-        ) : (
-          <>
-            {plat === "res" && (
-              <>
-                <EnamedMapa
-                  onFocar={() => {
-                    if (setView) setView("crono");
-                  }}
-                />
-                {enamedAnalises.length > 0 && (
-                  <AdvancedSection title="Analise ENAMED detalhada" defaultOpen={false} storageKey="stats-enamed-advanced">
-                    <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando análise ENAMED...</div>}>
-                      <EnamedProvaAnalyzer />
-                    </Suspense>
-                  </AdvancedSection>
-                )}
-              </>
-            )}
-
-            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-3 shadow-lg">
-              <div>
-                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Padrao de Erros</h3>
-                <p className="text-[11px] text-gray-500 mt-0.5">Classificacao unificada para reduzir falsa confianca e ajustar o treino.</p>
+      {/* Navegacao */}
+      <SectionNav
+        sections={availableSections}
+        active={currentSection}
+        onChange={setActiveSection}
+      />
+
+      {/* ── SECAO 1: RESUMO ─────────────────────────────────────────────────── */}
+      {currentSection === "resumo" && (
+        <div className="space-y-4">
+          <p className="text-[11px] text-gray-500">Diagnostico rapido: como voce esta de verdade agora.</p>
+
+          {/* Preparo + KPIs */}
+          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
+            {/* Preparo estimado — card especial com sparkline */}
+            <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between min-h-[100px] sm:col-span-2">
+              <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Preparo estimado</p>
+              <div className="flex items-baseline gap-1.5">
+                <p className="text-3xl font-black tabular-nums text-blue-400">
+                  {readinessData.score != null ? `${readinessData.score}%` : "—"}
+                </p>
               </div>
-              {errorAnalytics.total === 0 ? (
-                <p className="text-[11px] text-gray-500">Sem erros suficientes para padrao dominante.</p>
-              ) : (
-                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
-                  <div className="bg-black/30 border border-white/5 rounded-xl p-3">
-                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Dominante</p>
-                    <p className="text-sm font-black text-white mt-1">{ERROR_TYPE_LABEL[errorAnalytics.dominant] || errorAnalytics.dominant || "—"}</p>
-                  </div>
-                  <div className="bg-black/30 border border-white/5 rounded-xl p-3">
-                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Alta confianca + erro</p>
-                    <p className="text-sm font-black text-amber-300 mt-1">{errorAnalytics.confidenceMismatch}</p>
-                  </div>
-                  <div className="bg-black/30 border border-white/5 rounded-xl p-3">
-                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Erro por tempo</p>
-                    <p className="text-sm font-black text-blue-300 mt-1">{errorAnalytics.time}</p>
-                  </div>
-                  <div className="bg-black/30 border border-white/5 rounded-xl p-3">
-                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Erro de raciocinio</p>
-                    <p className="text-sm font-black text-red-300 mt-1">{errorAnalytics.reasoning}</p>
-                  </div>
+              <p className="text-[10px] text-gray-600 mt-1">
+                Score ponderado: retencao + simulados + cobertura + ritmo + Anki.
+              </p>
+              {sparklinePath && (
+                <div className="absolute bottom-0 left-0 right-0 h-5 opacity-40 pointer-events-none">
+                  <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
+                    <path d={sparklinePath} fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
+                  </svg>
                 </div>
               )}
             </div>
 
-            {/* KPIs */}
-            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
-              {[
-                { 
-                  label: "Preparo estimado",
-                  value: `${readinessTrend.current}%`, 
-                  color: "text-blue-400",
-                  trend: readinessTrend.delta7,
-                  trend30: readinessTrend.delta30
-                },
-                { label: "Temas", value: temas.length, color: "text-indigo-400" },
-                { label: "Questões", value: (personalStats?.totalQuestoes || 0).toLocaleString("pt-BR"), color: "text-blue-400" },
-                { label: "Ciclos Completos", value: personalStats?.totalConcluidos ?? 0, color: "text-emerald-400" },
-                { label: "Acerto Médio", value: personalStats?.overallAcc != null ? `${personalStats.overallAcc}%` : "—",
-                  color: personalStats?.overallAcc == null ? "text-gray-500" : personalStats.overallAcc >= 80 ? "text-emerald-400" : personalStats.overallAcc >= 65 ? "text-yellow-400" : "text-red-400" },
-              ].map(s => (
-                <div key={s.label} className="bg-[#111113] border border-white/5 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between min-h-[92px]">
-                  <div>
-                    <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
-                    <div className="flex items-baseline gap-1.5 flex-wrap">
-                      <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
-                      {s.trend !== undefined && (
-                        <span className={`text-[9px] font-bold ${s.trend >= 0 ? "text-emerald-400" : "text-red-400"}`} title={`Acumulado de 7d/30d`}>
-                          {s.trend >= 0 ? `▲ +${s.trend}%` : `▼ ${s.trend}%`}
-                        </span>
-                      )}
-                    </div>
-                  </div>
-                  {s.label === "Preparo estimado" && sparklinePath && (
-                    <div className="absolute bottom-0 left-0 right-0 h-5 opacity-40 pointer-events-none">
-                      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
-                        <path d={sparklinePath} fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
-                      </svg>
-                    </div>
-                  )}
-                </div>
-              ))}
-            </div>
+            <MetricCard
+              label={metricsEvaluated.trueRetention.label}
+              value={formatMetricValue("trueRetention", metricsEvaluated.trueRetention.value)}
+              status={metricsEvaluated.trueRetention.status}
+              description={metricsEvaluated.trueRetention.description}
+              emptyState={metricsEvaluated.trueRetention.emptyState}
+              action={metricsEvaluated.trueRetention.action}
+            />
+            <MetricCard
+              label={metricsEvaluated.overdueReviews.label}
+              value={formatMetricValue("overdueReviews", metricsEvaluated.overdueReviews.value)}
+              status={metricsEvaluated.overdueReviews.status}
+              description="Revisoes com data passada nao feitas."
+              emptyState="Nenhuma revisao vencida"
+              action={metricsEvaluated.overdueReviews.action}
+            />
+          </div>
 
-            {/* Heatmap Section */}
-            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
-              <div>
-                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
-                  <Flame size={15} className="text-orange-400" /> Consistência de Estudos (Últimas 12 Semanas)
-                </h3>
-                <p className="text-[11px] text-gray-500 mt-0.5">Visualize seus dias ativos na plataforma. Cada bloco colorido indica uma sessão finalizada.</p>
+          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
+            <MetricCard
+              label={metricsEvaluated.relearningCount.label}
+              value={formatMetricValue("relearningCount", metricsEvaluated.relearningCount.value)}
+              status={metricsEvaluated.relearningCount.status}
+              description="Temas que escaparam da memoria."
+              emptyState="Nenhum em relearning"
+              action={metricsEvaluated.relearningCount.action}
+            />
+            <MetricCard
+              label="Carga de hoje"
+              value={`${todayPending}`}
+              status={todayPending === 0 ? METRIC_STATUS.OK : METRIC_STATUS.WARNING}
+              description="Revisoes programadas para hoje."
+              emptyState="Nenhuma revisao hoje"
+              action={todayPending > 10 ? "Fila alta — priorize as mais antigas." : null}
+            />
+            <MetricCard
+              label={metricsEvaluated.ankiAdherence.label}
+              value={formatMetricValue("ankiAdherence", metricsEvaluated.ankiAdherence.value)}
+              status={metricsEvaluated.ankiAdherence.status}
+              description="Dias com Anki nos ultimos 7."
+              emptyState={metricsEvaluated.ankiAdherence.emptyState}
+              action={metricsEvaluated.ankiAdherence.action}
+            />
+            <MetricCard
+              label={metricsEvaluated.weeklyConsistency.label}
+              value={formatMetricValue("weeklyConsistency", metricsEvaluated.weeklyConsistency.value)}
+              status={metricsEvaluated.weeklyConsistency.status}
+              description="Dias de estudo nos ultimos 7."
+              emptyState={metricsEvaluated.weeklyConsistency.emptyState}
+              action={metricsEvaluated.weeklyConsistency.action}
+            />
+          </div>
+
+          {/* Proxima acao do Mentor */}
+          {readinessData.score != null && (
+            <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-2xl p-4">
+              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1">Proximo passo recomendado</p>
+              <p className="text-[12px] text-gray-300 leading-relaxed">
+                {overdueCount > 0
+                  ? `Resolva as ${overdueCount} revisoes vencidas antes de qualquer coisa.`
+                  : relearningCount > 0
+                  ? `${relearningCount} temas em relearning — priorize recupera-los.`
+                  : retentionDetailed?.collecting
+                  ? "Continue as revisoes D21+ para estimar retencao real."
+                  : "Continue o ritmo — fila do dia em dia."}
+              </p>
+            </div>
+          )}
+        </div>
+      )}
+
+      {/* ── SECAO 2: APRENDIZAGEM ────────────────────────────────────────────── */}
+      {currentSection === "aprendizagem" && (
+        <div className="space-y-4">
+          <p className="text-[11px] text-gray-500">Cobertura, retencao por area e evolucao cronologica.</p>
+
+          {/* KPIs rapidos */}
+          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
+            {[
+              { label: "Temas totais", value: temas.length, color: "text-indigo-400" },
+              { label: "Iniciados", value: startedTemas.length, color: "text-blue-400" },
+              { label: "Ciclos completos", value: personalStats?.totalConcluidos ?? 0, color: "text-emerald-400" },
+              {
+                label: "Acerto medio",
+                value: personalStats?.overallAcc != null ? `${personalStats.overallAcc}%` : "—",
+                color: personalStats?.overallAcc == null ? "text-gray-500" : personalStats.overallAcc >= 80 ? "text-emerald-400" : personalStats.overallAcc >= 65 ? "text-yellow-400" : "text-red-400",
+              },
+            ].map((s) => (
+              <div key={s.label} className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[80px]">
+                <p className="text-[10px] text-gray-500 uppercase font-semibold">{s.label}</p>
+                <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
               </div>
-              
-              <div className="w-full overflow-x-auto select-none py-2">
-                <div className="min-w-[420px] max-w-lg mx-auto">
-                  {/* Months header */}
-                  <div className="flex gap-2 mb-1">
-                    <div className="w-8 shrink-0" />
-                    <div className="grid grid-cols-12 gap-1.5 w-full">
-                      {monthLabels.map((lbl, i) => (
-                        <span key={i} className="text-[9px] text-gray-500 font-bold text-center uppercase tracking-wider block truncate">
-                          {lbl}
-                        </span>
-                      ))}
-                    </div>
-                  </div>
+            ))}
+          </div>
 
-                  <div className="flex gap-2 items-start justify-center">
-                    {/* Day Labels */}
-                    <div className="flex flex-col justify-between text-[9px] text-gray-500 h-28 pr-1 py-1 font-semibold uppercase tracking-wider select-none shrink-0">
-                      <span>Dom</span>
-                      <span>Qua</span>
-                      <span>Sáb</span>
-                    </div>
+          {/* Cobertura */}
+          <MetricCard
+            label={metricsEvaluated.coverageByArea.label}
+            value={formatMetricValue("coverageByArea", metricsEvaluated.coverageByArea.value)}
+            status={metricsEvaluated.coverageByArea.status}
+            description={metricsEvaluated.coverageByArea.description}
+            emptyState={metricsEvaluated.coverageByArea.emptyState}
+            action={metricsEvaluated.coverageByArea.action}
+            className="sm:col-span-2"
+          />
+
+          {/* Grafico de acertos */}
+          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-3 shadow-lg">
+            <div>
+              <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Evolucao Cronologica de Acertos</h3>
+              <p className="text-[11px] text-gray-500 mt-0.5">Precisao media de cada sessao em ordem cronologica.</p>
+            </div>
+            <div className="h-44 flex items-center justify-center bg-black/40 border border-white/5 rounded-xl p-3">
+              <AccuracyChart data={chronologicalAccuracy} />
+            </div>
+          </div>
 
-                    {/* Heatmap Grid */}
-                    <div className="grid grid-flow-col grid-rows-7 gap-1.5 h-28 w-full">
-                      {heatmapDays.map((d) => {
-                        const studied = doneDays.has(d);
-                        return (
-                          <div
-                            key={d}
-                            title={`${fmtDate(d)}: ${studied ? "Estudo Realizado" : "Nenhuma Atividade"}`}
-                            className={`aspect-square w-3.5 h-3.5 rounded-sm transition-all duration-300 ${
-                              studied
-                                ? "bg-gradient-to-br from-blue-500 to-sky-500 shadow-sm shadow-slate-950/50"
-                                : "bg-white/[0.03] hover:bg-white/[0.08]"
-                            }`}
-                          />
-                        );
-                      })}
+          {/* Forecast FSRS */}
+          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-3 shadow-lg">
+            <div>
+              <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Previsao de Carga FSRS (14 dias)</h3>
+              <p className="text-[11px] text-gray-500 mt-0.5">Revisoes programadas por dia.</p>
+            </div>
+            <div className="w-full overflow-x-auto select-none pt-2">
+              <div className="flex items-end justify-between gap-2.5 min-w-[500px] h-32 border-b border-white/5 pb-2 px-2">
+                {forecastData.map((d, idx) => {
+                  const maxCount = Math.max(...forecastData.map((x) => x.count), 1);
+                  const h = (d.count / maxCount) * 80;
+                  return (
+                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
+                      <span className="text-[9.5px] font-mono text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity select-none">{d.count}</span>
+                      <div
+                        style={{ height: `${Math.max(4, h)}px` }}
+                        className={`w-full rounded-t transition-all ${
+                          d.count === 0 ? "bg-white/5" : idx === 0 ? "bg-gradient-to-t from-blue-600 to-sky-500" : "bg-blue-500/60 group-hover:bg-blue-400"
+                        }`}
+                      />
+                      <span className={`text-[9px] font-mono font-bold mt-1 ${idx === 0 ? "text-sky-400 font-black" : "text-gray-600"}`}>
+                        {idx === 0 ? "Hoje" : d.label}
+                      </span>
                     </div>
-                  </div>
-                </div>
+                  );
+                })}
               </div>
             </div>
+          </div>
 
-            {/* Calibração Metacognitiva */}
-            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
-              <div className="flex items-center justify-between">
-                <div>
-                  <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
-                    🎯 Calibração Metacognitiva
-                  </h3>
-                  <p className="text-[11px] text-gray-500 mt-0.5">Mede o alinhamento entre o que você acha que vai acertar e seu acerto real.</p>
-                </div>
-                {calibrationData.status === "ok" && (
-                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
-                    calibrationData.tendencia === "calibrado" 
-                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
-                      : calibrationData.tendencia === "subestima"
-                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
-                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
-                  }`}>
-                    {calibrationData.tendencia === "calibrado" ? "Calibrado" : calibrationData.tendencia === "subestima" ? "Subestima" : "Excesso de Confiança"}
-                  </span>
-                )}
-              </div>
-
-              {calibrationData.status === "coletando" ? (
-                <div className="bg-black/25 border border-white/5 p-4 rounded-xl text-center space-y-1.5">
-                  <p className="text-[11px] text-gray-400">
-                    💡 <strong>Coletando dados:</strong> Faltam {5 - calibrationData.n} sessões com previsões de acerto informadas para gerar sua calibração.
-                  </p>
-                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
-                    <div className="bg-blue-600 h-full transition-all" style={{ width: `${(calibrationData.n / 5) * 100}%` }} />
-                  </div>
-                </div>
-              ) : (
-                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
-                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center">
-                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Precisão de Previsão</span>
-                    <span className="text-3xl font-black font-mono text-blue-400">{calibrationData.precisao}%</span>
-                    <span className="text-[9px] text-gray-600 mt-1">Proximidade com o resultado real</span>
-                  </div>
-
-                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center">
-                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Viés de Confiança</span>
-                    <span className={`text-3xl font-black font-mono ${calibrationData.vies > 0 ? "text-amber-400" : calibrationData.vies < 0 ? "text-blue-400" : "text-emerald-400"}`}>
-                      {calibrationData.vies > 0 ? `+${calibrationData.vies}%` : `${calibrationData.vies}%`}
-                    </span>
-                    <span className="text-[9px] text-gray-600 mt-1">{calibrationData.vies > 0 ? "Otimista / Confiante" : calibrationData.vies < 0 ? "Pessimista / Prudente" : "Totalmente Alinhado"}</span>
+          {/* Desempenho por especialidade */}
+          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
+            <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">
+              {plat === "vest" ? "Desempenho por Materia" : "Desempenho por Especialidade"}
+            </h3>
+            <div className="space-y-4">
+              {personalStats?.espStats.map((e) => {
+                const espC = ESP_COLORS[e.esp] || "#94a3b8";
+                const accColor = e.acc == null ? "text-gray-600" : e.acc >= 80 ? "text-emerald-400" : e.acc >= 65 ? "text-yellow-400" : "text-red-400";
+                return (
+                  <div key={e.esp} className="space-y-1.5">
+                    <div className="flex justify-between text-[12px]">
+                      <span className="font-semibold text-gray-300">{e.esp}</span>
+                      <div className="flex items-center gap-3">
+                        <span className="text-gray-600 text-[11px]">{e.questoes.toLocaleString("pt-BR")} questoes</span>
+                        <span className={`font-black tabular-nums ${accColor}`}>{e.acc != null ? `${e.acc}%` : "—"}</span>
+                      </div>
+                    </div>
+                    <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
+                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${e.progress}%`, background: espC + "cc" }} />
+                    </div>
+                    <p className="text-[10px] text-gray-600">{e.doneSteps}/{e.total} etapas · {e.progress}% do ciclo</p>
                   </div>
+                );
+              })}
+            </div>
+          </div>
 
-                  <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-4 col-span-1 sm:col-span-1 flex flex-col justify-center text-left">
-                    <span className="text-[9.5px] font-bold text-indigo-300 uppercase tracking-wider block mb-1 flex items-center gap-1">🤖 Mentor Metacognitivo</span>
-                    <p className="text-[11.5px] text-gray-400 leading-relaxed mt-0.5 italic">
-                      "{calibrationMentorPhrase}"
-                    </p>
-                  </div>
-                </div>
+          {/* Calibracao metacognitiva */}
+          <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
+            <div className="flex items-center justify-between">
+              <div>
+                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Calibracao Metacognitiva</h3>
+                <p className="text-[11px] text-gray-500 mt-0.5">Alinhamento entre o que voce acha que vai acertar e o resultado real.</p>
+              </div>
+              {calibrationData.status === "ok" && (
+                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
+                  calibrationData.tendencia === "calibrado"
+                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
+                    : calibrationData.tendencia === "subestima"
+                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
+                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
+                }`}>
+                  {calibrationData.tendencia === "calibrado" ? "Calibrado" : calibrationData.tendencia === "subestima" ? "Subestima" : "Excesso de Confianca"}
+                </span>
               )}
             </div>
-
-            {/* Histórico e Evolução */}
-            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
-              {/* Gráfico de Evolução de Acertos */}
-              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
-                <div>
-                  <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Evolução Cronológica de Acertos</h3>
-                  <p className="text-[11px] text-gray-500 mt-0.5">Acompanhe a precisão média de cada sessão executada em ordem cronológica.</p>
-                </div>
-                
-                <div className="h-44 flex items-center justify-center bg-black/40 border border-white/5 rounded-xl p-3">
-                  {chronologicalAccuracy.length < 2 ? (
-                    <p className="text-[11.5px] text-gray-500 text-center leading-relaxed">
-                      ℹ️ Insuficientes dados para traçar gráfico de linha cronológica. Continue estudando!
-                    </p>
-                  ) : (
-                    <div className="w-full h-full relative">
-                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
-                        <defs>
-                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
-                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4"/>
-                            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0"/>
-                          </linearGradient>
-                          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
-                            <stop offset="0%" stopColor="#8b5cf6" />
-                            <stop offset="100%" stopColor="#ec4899" />
-                          </linearGradient>
-                        </defs>
-                        
-                        {/* Grid Lines */}
-                        <line x1="15" y1={svgHeight - 10} x2={svgWidth - 15} y2={svgHeight - 10} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
-                        <line x1="15" y1={(svgHeight - 25) * 0.5 + 15} x2={svgWidth - 15} y2={(svgHeight - 25) * 0.5 + 15} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
-                        <line x1="15" y1={(svgHeight - 25) * 0.2 + 15} x2={svgWidth - 15} y2={(svgHeight - 25) * 0.2 + 15} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
-                        <line x1="15" y1="15" x2={svgWidth - 15} y2="15" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
-                        
-                        {/* Labels */}
-                        <text x="17" y={svgHeight - 14} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">0%</text>
-                        <text x="17" y={(svgHeight - 25) * 0.5 + 20} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">50%</text>
-                        <text x="17" y={(svgHeight - 25) * 0.2 + 20} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">80%</text>
-                        <text x="17" y="23" fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">100%</text>
-
-                        {/* Gradient Shading */}
-                        {pointsInfo.area && <path d={pointsInfo.area} fill="url(#areaGrad)" />}
-                        
-                        {/* Path Line */}
-                        {pointsInfo.line && <path d={pointsInfo.line} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
-
-                        {/* Dots */}
-                        {pointsInfo.pts.map((p, i) => (
-                          <circle
-                            key={i}
-                            cx={p.x}
-                            cy={p.y}
-                            r="3.5"
-                            fill="#ec4899"
-                            stroke="#0e0e18"
-                            strokeWidth="1.5"
-                            className="hover:r-5 cursor-help transition-all"
-                          >
-                            <title>{`Sessão ${i + 1}: ${p.val}%`}</title>
-                          </circle>
-                        ))}
-                      </svg>
-                    </div>
-                  )}
+            {calibrationData.status === "coletando" ? (
+              <div className="bg-black/25 border border-white/5 p-4 rounded-xl text-center space-y-1.5">
+                <p className="text-[11px] text-gray-400">
+                  Coletando dados — faltam {5 - calibrationData.n} revisoes com previsao preenchida.
+                </p>
+                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
+                  <div className="bg-blue-600 h-full transition-all" style={{ width: `${(calibrationData.n / 5) * 100}%` }} />
                 </div>
               </div>
-
-              {/* Forecast Section (Previsão de Carga FSRS) */}
-              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
-                <div>
-                  <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Previsão de Carga FSRS (Próximos 14 dias)</h3>
-                  <p className="text-[11px] text-gray-500 mt-0.5">Estimativa de revisões programadas por dia para guiar seu planejamento.</p>
+            ) : (
+              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
+                <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center">
+                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Precisao de Previsao</span>
+                  <span className="text-3xl font-black font-mono text-blue-400">{calibrationData.precisao}%</span>
+                  <span className="text-[9px] text-gray-600 mt-1">Proximidade com o resultado real</span>
                 </div>
-                
-                <div className="w-full overflow-x-auto select-none pt-2">
-                  <div className="flex items-end justify-between gap-2.5 min-w-[500px] h-32 border-b border-white/5 pb-2 px-2">
-                    {forecastData.map((d, idx) => {
-                      const maxCount = Math.max(...forecastData.map(x => x.count), 1);
-                      const heightPercent = (d.count / maxCount) * 80;
-                      const isToday = idx === 0;
-                      return (
-                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
-                          <span className="text-[9.5px] font-mono text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity select-none">
-                            {d.count}
-                          </span>
-                          <div 
-                            style={{ height: `${Math.max(4, heightPercent)}px` }}
-                            className={`w-full rounded-t transition-all ${
-                              d.count === 0 
-                                ? "bg-white/5" 
-                                : isToday 
-                                ? "bg-gradient-to-t from-blue-600 to-sky-500" 
-                                : "bg-blue-500/60 group-hover:bg-blue-400"
-                            }`}
-                          />
-                          <span className={`text-[9px] font-mono font-bold mt-1 ${isToday ? "text-sky-400 font-black" : "text-gray-600"}`}>
-                            {isToday ? "Hoje" : d.label}
-                          </span>
-                        </div>
-                      );
-                    })}
-                  </div>
+                <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center">
+                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Vies de Confianca</span>
+                  <span className={`text-3xl font-black font-mono ${calibrationData.vies > 0 ? "text-amber-400" : calibrationData.vies < 0 ? "text-blue-400" : "text-emerald-400"}`}>
+                    {calibrationData.vies > 0 ? `+${calibrationData.vies}%` : `${calibrationData.vies}%`}
+                  </span>
+                  <span className="text-[9px] text-gray-600 mt-1">
+                    {calibrationData.vies > 0 ? "Otimista" : calibrationData.vies < 0 ? "Pessimista" : "Alinhado"}
+                  </span>
+                </div>
+                <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-4 flex flex-col justify-center text-left">
+                  <span className="text-[9.5px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">Mentor Metacognitivo</span>
+                  <p className="text-[11.5px] text-gray-400 leading-relaxed mt-0.5 italic">"{calibrationMentorPhrase}"</p>
                 </div>
               </div>
+            )}
+          </div>
+        </div>
+      )}
+
+      {/* ── SECAO 3: ERROS ──────────────────────────────────────────────────── */}
+      {currentSection === "erros" && (
+        <div className="space-y-4">
+          <p className="text-[11px] text-gray-500">Padroes de erro para acao corretiva direcionada.</p>
+
+          {errorAnalytics.total === 0 ? (
+            <div className="bg-[#111113] border border-white/5 rounded-2xl p-8 text-center text-gray-500 text-[12px]">
+              Sem erros suficientes para identificar padrao dominante.
+              <br />
+              Complete mais sessoes e simulados.
             </div>
-
-            {/* Redação ENEM Competencies for Vestibular */}
-            {plat === "vest" && (
-              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
-                <div>
-                  <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Evolução por Competência (Redação ENEM)</h3>
-                  <p className="text-[11px] text-gray-500 mt-0.5">Evolução detalhada nas 5 competências do ENEM ao longo de suas redações escritas.</p>
+          ) : (
+            <>
+              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
+                <MetricCard
+                  label="Erro dominante"
+                  value={ERROR_TYPE_LABEL[errorAnalytics.dominant] || errorAnalytics.dominant || "—"}
+                  status={metricsEvaluated.dominantError.status}
+                  description="Tipo de erro mais frequente."
+                  emptyState="Sem dados suficientes"
+                  action={null}
+                />
+                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
+                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Alta conf + erro</p>
+                  <p className="text-2xl font-black text-amber-300 tabular-nums">{errorAnalytics.confidenceMismatch}</p>
+                  <p className="text-[10px] text-gray-600">Acertei com alta confianca — ou o contrario.</p>
+                </div>
+                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
+                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Erro por tempo</p>
+                  <p className="text-2xl font-black text-blue-300 tabular-nums">{errorAnalytics.time}</p>
+                  <p className="text-[10px] text-gray-600">Questoes perdidas por pressao de tempo.</p>
+                </div>
+                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
+                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Erro de raciocinio</p>
+                  <p className="text-2xl font-black text-red-300 tabular-nums">{errorAnalytics.reasoning}</p>
+                  <p className="text-[10px] text-gray-600">Raciocinio clinico ou diagnostico falhou.</p>
                 </div>
-                
-                {redacaoHistory.length === 0 ? (
-                  <div className="p-8 text-center text-gray-600 text-xs border border-white/5 rounded-xl bg-black/20">
-                    Nenhuma redação registrada ainda. Conclua o ciclo de estudos D0 ou revisões em temas de redação para ver a evolução.
-                  </div>
-                ) : redacaoHistory.length < 2 ? (
-                  <div className="space-y-4">
-                    <p className="text-xs text-gray-400 italic">Uma redação registrada. Registre pelo menos duas para visualizar a linha de tendência.</p>
-                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
-                      {[
-                        { label: "C1: Norma Culta", val: redacaoHistory[0].c1 },
-                        { label: "C2: Tema/Gênero", val: redacaoHistory[0].c2 },
-                        { label: "C3: Argumentação", val: redacaoHistory[0].c3 },
-                        { label: "C4: Coesão", val: redacaoHistory[0].c4 },
-                        { label: "C5: Proposta", val: redacaoHistory[0].c5 }
-                      ].map((c, idx) => (
-                        <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-3 text-center">
-                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-1">{c.label}</span>
-                          <span className="text-lg font-black text-blue-400">{c.val} pts</span>
-                        </div>
-                      ))}
-                    </div>
-                  </div>
-                ) : (
-                  <div className="space-y-4">
-                    {/* SVG Chart */}
-                    <div className="h-44 flex items-center justify-center bg-black/40 border border-white/5 rounded-xl p-3">
-                      <div className="w-full h-full relative">
-                        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
-                          {/* Grid Lines */}
-                          <line x1="15" y1={svgHeight - 10} x2={svgWidth - 15} y2={svgHeight - 10} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
-                          <line x1="15" y1={(svgHeight - 25) * 0.4 + 15} x2={svgWidth - 15} y2={(svgHeight - 25) * 0.4 + 15} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
-                          <line x1="15" y1={(svgHeight - 25) * 0.8 + 15} x2={svgWidth - 15} y2={(svgHeight - 25) * 0.8 + 15} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
-                          <line x1="15" y1="15" x2={svgWidth - 15} y2="15" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
-                          
-                          {/* Labels */}
-                          <text x="17" y={svgHeight - 14} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">0</text>
-                          <text x="17" y={(svgHeight - 25) * 0.4 + 20} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">120</text>
-                          <text x="17" y={(svgHeight - 25) * 0.8 + 20} fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">160</text>
-                          <text x="17" y="23" fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold">200</text>
-
-                          {/* C1 Line */}
-                          <path d={redacaoPoints.c1.path} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
-                          {/* C2 Line */}
-                          <path d={redacaoPoints.c2.path} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
-                          {/* C3 Line */}
-                          <path d={redacaoPoints.c3.path} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
-                          {/* C4 Line */}
-                          <path d={redacaoPoints.c4.path} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
-                          {/* C5 Line */}
-                          <path d={redacaoPoints.c5.path} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
-                        </svg>
-                      </div>
-                    </div>
-                    
-                    {/* Legend */}
-                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-wider">
-                      <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> C1: Norma Culta</span>
-                      <span className="flex items-center gap-1.5 text-red-400"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> C2: Tema/Gênero</span>
-                      <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> C3: Argumentação</span>
-                      <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> C4: Coesão</span>
-                      <span className="flex items-center gap-1.5 text-indigo-400"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> C5: Proposta</span>
-                    </div>
-                  </div>
-                )}
               </div>
-            )}
 
-            {/* Performance by Specialty */}
-            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
-              <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">
-                {plat === "vest" ? "Desempenho por Matéria" : "Desempenho por Especialidade"}
-              </h3>
-              <div className="space-y-4">
-                {personalStats?.espStats.map(e => {
-                  const espC = ESP_COLORS[e.esp] || "#94a3b8";
-                  const accColor = e.acc == null ? "text-gray-600" : e.acc >= 80 ? "text-emerald-400" : e.acc >= 65 ? "text-yellow-400" : "text-red-400";
-                  return (
-                    <div key={e.esp} className="space-y-1.5">
-                      <div className="flex justify-between text-[12px]">
-                        <span className="font-semibold text-gray-300">{e.esp}</span>
-                        <div className="flex items-center gap-3">
-                          <span className="text-gray-600 text-[11px]">{e.questoes.toLocaleString("pt-BR")} questões</span>
-                          <span className={`font-black tabular-nums ${accColor}`}>{e.acc != null ? `${e.acc}%` : "—"}</span>
-                        </div>
-                      </div>
-                      <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
-                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${e.progress}%`, background: espC + "cc" }} />
-                      </div>
-                      <p className="text-[10px] text-gray-600">{e.doneSteps}/{e.total} etapas · {e.progress}% do ciclo concluído</p>
-                    </div>
-                  );
-                })}
-              </div>
+              <ErrorActionCenter />
+            </>
+          )}
+        </div>
+      )}
+
+      {/* ── SECAO 4: PROVAS/SIMULADOS ────────────────────────────────────────── */}
+      {currentSection === "provas" && (
+        <div className="space-y-4">
+          <p className="text-[11px] text-gray-500">Desempenho em provas e simulados.</p>
+
+          <MetricCard
+            label={metricsEvaluated.simuladoAccuracy.label}
+            value={formatMetricValue("simuladoAccuracy", metricsEvaluated.simuladoAccuracy.value)}
+            status={metricsEvaluated.simuladoAccuracy.status}
+            description={metricsEvaluated.simuladoAccuracy.description}
+            emptyState={metricsEvaluated.simuladoAccuracy.emptyState}
+            action={metricsEvaluated.simuladoAccuracy.action}
+          />
+
+          {plat === "res" && (
+            <>
+              <EnamedMapa onFocar={() => setView && setView("crono")} />
+              {enamedAnalises.length > 0 && (
+                <AdvancedSection title="An\u00e1lise ENAMED detalhada" defaultOpen={false} storageKey="stats-enamed-advanced">
+                  <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando an\u00e1lise ENAMED...</div>}>
+                    <EnamedProvaAnalyzer />
+                  </Suspense>
+                </AdvancedSection>
+              )}
+            </>
+          )}
+
+          {plat === "vest" && simulados.length === 0 && (
+            <div className="bg-[#111113] border border-white/5 rounded-2xl p-8 text-center text-gray-500 text-[12px]">
+              Nenhum simulado registrado ainda. Registre simulados para ver evolu\u00e7\u00e3o.
             </div>
+          )}
+        </div>
+      )}
+
+      {/* ── SECAO 5: RACIOCINIO CLINICO (res only) ───────────────────────────── */}
+      {currentSection === "raciocinio" && (
+        <div className="space-y-4">
+          <p className="text-[11px] text-gray-500">Score atual de racioc\u00ednio cl\u00ednico — dados existentes (n\u00e3o duplica c\u00e1lculo).</p>
+
+          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
+            <MetricCard
+              label="Score de racioc\u00ednio"
+              value={formatMetricValue("clinicalReasoningScore", raciocinioStats.score)}
+              status={metricsEvaluated.clinicalReasoningScore.status}
+              description="Media ponderada: casos (60%) + SCT (40%)."
+              emptyState="Nenhum caso clinico concluido"
+              action={metricsEvaluated.clinicalReasoningScore.action}
+            />
+            <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
+              <p className="text-[10px] text-gray-500 uppercase font-semibold">Casos feitos</p>
+              <p className="text-2xl font-black text-blue-400 tabular-nums">{raciocinioStats.casosFeitos}</p>
+              <p className="text-[10px] text-gray-600">Casos clinicos ja visitados.</p>
+            </div>
+            <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
+              <p className="text-[10px] text-gray-500 uppercase font-semibold">Estado</p>
+              <p className={`text-sm font-black ${raciocinioStats.confident ? "text-emerald-400" : "text-amber-400"}`}>
+                {raciocinioStats.n === 0 ? "Sem dados" : raciocinioStats.collecting ? "Amostra baixa" : "Confiavel"}
+              </p>
+              <p className="text-[10px] text-gray-600">
+                {raciocinioStats.collecting
+                  ? `Faltam ${Math.max(0, 3 - raciocinioStats.n)} casos para score confiavel.`
+                  : "Score baseado em amostra suficiente."}
+              </p>
+            </div>
+          </div>
 
-            <AdvancedSection title="Paineis avancados de lancamento" defaultOpen={false} storageKey="stats-launch-advanced">
-              <div className="space-y-4">
-                <LaunchChecklistPanel />
-                <div className="space-y-2">
-                  <div className="flex items-center justify-between">
-                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Revisoes executivas</span>
-                    <span className="text-[10px] text-gray-500">{weeklyReviews.length} registradas</span>
-                  </div>
-                  <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando revisão semanal...</div>}>
-                    <WeeklyReview onAdjust={() => setView && setView("crono")} />
-                  </Suspense>
-                </div>
-                <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando painel de segurança...</div>}>
-                  <DataSafetyPanel />
-                </Suspense>
-              </div>
-            </AdvancedSection>
-          </>
-        )}
-      </div>
+          {/* Placeholder P4 */}
+          <div className="bg-indigo-950/10 border border-indigo-500/10 rounded-2xl p-5 flex items-start gap-3">
+            <Brain size={16} className="text-indigo-400 mt-0.5 shrink-0" />
+            <div>
+              <p className="text-[12px] font-bold text-indigo-300">Racioc\u00ednio Cl\u00ednico integrado \u00e0 curva de revis\u00e3o (P4)</p>
+              <p className="text-[11px] text-gray-500 mt-1">
+                Em breve: revis\u00e3o multimodal por est\u00e1gio da curva (D1 recorda\u00e7\u00e3o estruturada, D4 racioc\u00ednio diagn\u00f3stico, D7 mini caso, D21 concord\u00e2ncia cl\u00ednica + conduta),
+                score \u00fanico e conduta/prescri\u00e7\u00e3o simulada.
+              </p>
+            </div>
+          </div>
+        </div>
+      )}
+
+      {/* ── SECAO 6: ATIVIDADE ──────────────────────────────────────────────── */}
+      {currentSection === "atividade" && (
+        <div className="space-y-4">
+          <p className="text-[11px] text-gray-500">Consistencia de estudos e historico recente.</p>
+
+          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
+            <MetricCard
+              label="Consistencia semanal"
+              value={formatMetricValue("weeklyConsistency", activeLastWeek)}
+              status={metricsEvaluated.weeklyConsistency.status}
+              description="Dias ativos nos ultimos 7."
+              emptyState={metricsEvaluated.weeklyConsistency.emptyState}
+              action={metricsEvaluated.weeklyConsistency.action}
+            />
+            <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
+              <p className="text-[10px] text-gray-500 uppercase font-semibold">Sessoes registradas</p>
+              <p className="text-2xl font-black text-indigo-400 tabular-nums">{sessionReflections.length}</p>
+              <p className="text-[10px] text-gray-600">Fechamentos de sessao acumulados.</p>
+            </div>
+            <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 min-h-[100px]">
+              <p className="text-[10px] text-gray-500 uppercase font-semibold">Revisoes executivas</p>
+              <p className="text-2xl font-black text-emerald-400 tabular-nums">{weeklyReviews.length}</p>
+              <p className="text-[10px] text-gray-600">Revisoes semanais registradas.</p>
+            </div>
+          </div>
+
+          <Heatmap heatmapDays={heatmapDays} doneDays={doneDays} monthLabels={monthLabels} />
+        </div>
+      )}
+
+      {/* ── SECAO 7: SISTEMA ─────────────────────────────────────────────────── */}
+      {currentSection === "sistema" && (
+        <div className="space-y-4">
+          <p className="text-[11px] text-gray-500">Integridade de dados, backup e ferramentas de manutencao.</p>
+
+          <div className="space-y-2">
+            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Revisao executiva semanal</p>
+            <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando revisao semanal...</div>}>
+              <WeeklyReview onAdjust={() => setView && setView("crono")} />
+            </Suspense>
+          </div>
+
+          <LaunchChecklistPanel />
+
+          <Suspense fallback={<div className="text-[11px] text-gray-500">Carregando painel de seguranca...</div>}>
+            <DataSafetyPanel />
+          </Suspense>
+        </div>
+      )}
     </div>
   );
 }
diff --git a/src/core/achievements.js b/src/core/achievements.js
index 5dd2c00b..4cc3647b 100644
--- a/src/core/achievements.js
+++ b/src/core/achievements.js
@@ -75,7 +75,7 @@ export const ACHIEVEMENTS = [
   {
     id: "high_retention",
     nome: "Retenção de Elite",
-    desc: "Alcançou True Retention global igual ou superior a 80%",
+    desc: "Alcançou reten\u00e7\u00e3o longa global igual ou superior a 80%",
     icon: "📈",
     xpReward: 120,
     criterio: (s) => {
diff --git a/src/core/actionInbox.js b/src/core/actionInbox.js
index f977289a..aecd5228 100644
--- a/src/core/actionInbox.js
+++ b/src/core/actionInbox.js
@@ -38,7 +38,7 @@ export function createAction(input = {}) {
   return {
     id: buildActionId({ ...input, createdAt, dueDate }),
     type: input.type || "rest",
-    title: input.title || "Acao recomendada",
+    title: input.title || "Ação recomendada",
     reason: input.reason || "Sem motivo informado.",
     priority: toNumber(input.priority, 50),
     source: input.source || "manual",
diff --git a/src/core/domainValidation.js b/src/core/domainValidation.js
index 269cc319..b4346ae5 100644
--- a/src/core/domainValidation.js
+++ b/src/core/domainValidation.js
@@ -6,6 +6,20 @@ import { STEPS, S_BASE, addDays, todayStr, getAreaPrior, inferPhaseFromStep } fr
 export const DOMINIO_PREVIO_MIN_QUESTOES = 15;
 export const DOMINIO_PREVIO_MIN_ACERTO = 80;
 
+const REVIEW_DISPLAY_ORDER = ["d0", "d1", "d4", "d7", "d14", "d21", "manutencao"];
+
+function getStepLabel(stepKey) {
+  const step = STEPS.find((item) => item.key === stepKey);
+  if (step?.label) return step.label;
+  if (stepKey === "d14") return "D14";
+  if (stepKey === "manutencao") return "Manutenção";
+  return String(stepKey || "").toUpperCase();
+}
+
+function isSkippedReview(step = {}) {
+  return step?.skipped === true || step?.skipReason === "dominio_previo" || step?.skippeadoPorDominio === true;
+}
+
 export function isTemaNaoIniciado(tema = {}) {
   const dp = tema.dominioPrevio || tema.validacaoDominio || {};
   if (["validacao_pendente", "validado_previo", "reprovado"].includes(dp.status)) return false;
@@ -97,7 +111,7 @@ export function calcularDominioPrevio({ acertos, total }) {
       valido: false,
       status: "reprovado",
       percentual,
-      motivo: "Domínio ainda não está estável; o tema volta para o fluxo normal.",
+      motivo: "Melhor iniciar pelo estudo guiado. Este tema ainda não está seguro para pular a exposicao inicial.",
     };
   }
 
@@ -110,8 +124,8 @@ export function calcularDominioPrevio({ acertos, total }) {
     proximaRevisao: addDays(todayStr(), intervaloInicial),
     motivo:
       percentual >= 90
-        ? "Domínio prévio forte: tema entra em revisão inicial D14."
-        : "Domínio prévio suficiente: tema entra em revisão inicial D7.",
+        ? "Validado com alta seguranca. Proxima revisao em D14."
+        : "Validado. Proxima revisao em D7.",
   };
 }
 
@@ -133,6 +147,7 @@ export function criarValidacaoDominioPrevio() {
 
 export function finalizarValidacaoDominioPrevio({ acertos, total }) {
   const resultado = calcularDominioPrevio({ acertos, total });
+  const primeiraRevisao = resultado.intervaloInicial >= 14 ? "d14" : resultado.intervaloInicial === 7 ? "d7" : null;
   return {
     status: resultado.valido ? "validado_previo" : "reprovado",
     iniciadoEm: todayStr(),
@@ -144,6 +159,9 @@ export function finalizarValidacaoDominioPrevio({ acertos, total }) {
     percentual: resultado.percentual,
     intervaloInicial: resultado.intervaloInicial || null,
     proximaRevisao: resultado.proximaRevisao || null,
+    primeiraRevisao,
+    primeiraRevisaoLabel: primeiraRevisao ? getStepLabel(primeiraRevisao) : null,
+    primeiraRevisaoDate: resultado.proximaRevisao || null,
     observacao: resultado.motivo,
   };
 }
@@ -189,27 +207,68 @@ export function buildRevComDominio(d0, esp, importancia, classificacao, pctAcert
     acerto: acertoFrac,
     questoes: null,
     skippeadoPorDominio: true,
+    source: "dominio_previo",
   };
 
   rev.d1 = {
     ...rev.d1,
-    date: addDays(hoje, intervaloInicial),
-    scheduledAt: addDays(hoje, intervaloInicial),
+    done: true,
+    skipped: true,
+    skipReason: "dominio_previo",
+    reviewedAt: hoje,
+    completedAt: hoje,
+    acerto: acertoFrac,
+    source: "dominio_previo",
   };
   rev.d4 = {
     ...rev.d4,
-    date: addDays(hoje, intervaloInicial + 3),
-    scheduledAt: addDays(hoje, intervaloInicial + 3),
+    done: true,
+    skipped: true,
+    skipReason: "dominio_previo",
+    reviewedAt: hoje,
+    completedAt: hoje,
+    acerto: acertoFrac,
+    source: "dominio_previo",
   };
   rev.d7 = {
     ...rev.d7,
-    date: addDays(hoje, intervaloInicial + 7),
-    scheduledAt: addDays(hoje, intervaloInicial + 7),
+    date: addDays(hoje, 7),
+    scheduledAt: addDays(hoje, 7),
+    ...(intervaloInicial >= 14 ? {
+      done: true,
+      skipped: true,
+      skipReason: "dominio_previo",
+      reviewedAt: hoje,
+      completedAt: hoje,
+      acerto: acertoFrac,
+      source: "dominio_previo",
+    } : {
+      done: false,
+      skipped: false,
+      skipReason: null,
+      source: "dominio_previo",
+    }),
   };
+  if (intervaloInicial >= 14) {
+    rev.d14 = {
+      date: addDays(hoje, 14),
+      scheduledAt: addDays(hoje, 14),
+      reviewedAt: null,
+      done: false,
+      skipped: false,
+      acerto: null,
+      questoes: null,
+      S: 14,
+      D: prior.difBase,
+      motivosErro: [],
+      phase: "review",
+      source: "dominio_previo",
+    };
+  }
   rev.d21 = {
     ...rev.d21,
-    date: addDays(hoje, intervaloInicial + 21),
-    scheduledAt: addDays(hoje, intervaloInicial + 21),
+    date: addDays(hoje, 21),
+    scheduledAt: addDays(hoje, 21),
   };
   rev.reviewHistory = [];
   rev.phase = "learning";
@@ -218,6 +277,193 @@ export function buildRevComDominio(d0, esp, importancia, classificacao, pctAcert
   return rev;
 }
 
+function normalizeAcertoInput(rawAcertos, total) {
+  const totalNum = Number(total);
+  const acertosNum = Number(rawAcertos);
+  if (!Number.isFinite(acertosNum) || !Number.isFinite(totalNum) || totalNum <= 0) {
+    return Number.NaN;
+  }
+  if (acertosNum <= 1) {
+    return Math.round(acertosNum * totalNum);
+  }
+  return Math.round(acertosNum);
+}
+
+export function applyDominioPrevioToTema(tema, resultado, options = {}) {
+  if (!tema || !resultado) return tema;
+  const total = Number(resultado.questoes ?? resultado.total);
+  const acertosNormalizados = normalizeAcertoInput(
+    resultado.acertos ?? resultado.acerto,
+    total
+  );
+  const validacao = calcularDominioPrevio({ acertos: acertosNormalizados, total });
+
+  if (!validacao.valido) {
+    return {
+      ...tema,
+      status: tema.status || "novo",
+      unstarted: tema.unstarted !== false,
+      dominioPrevio: finalizarValidacaoDominioPrevio({ total, acertos: acertosNormalizados }),
+    };
+  }
+
+  const registro = criarRegistroDominio(total, acertosNormalizados);
+  const novoRevBase = buildRevComDominio(
+    tema.d0 || todayStr(),
+    tema.esp,
+    tema.importancia,
+    registro.classificacao,
+    registro.pctAcerto
+  ) || tema.rev;
+  const hoje = todayStr();
+  const acertoFrac = Math.max(0, Math.min(1, Number(total > 0 ? acertosNormalizados / total : 0)));
+  const intervalo = validacao.intervaloInicial || 7;
+  const primeiraRevisao = intervalo >= 14 ? "d14" : "d7";
+  const reviewEvent = {
+    stepKey: "d0",
+    reviewedAt: hoje,
+    source: "dominio_previo",
+    rating: intervalo >= 14 ? "easy" : "good",
+    acerto: acertoFrac,
+    questoes: total,
+    official: true,
+  };
+  const reviewHistory = Array.isArray(novoRevBase?.reviewHistory) ? novoRevBase.reviewHistory : [];
+  const nextRev = {
+    ...novoRevBase,
+    d0: {
+      ...(novoRevBase?.d0 || {}),
+      done: true,
+      reviewedAt: hoje,
+      completedAt: hoje,
+      scheduledAt: novoRevBase?.d0?.scheduledAt || hoje,
+      date: novoRevBase?.d0?.date || hoje,
+      acerto: acertoFrac,
+      questoes: total,
+      source: "dominio_previo",
+      skippeadoPorDominio: true,
+    },
+    reviewHistory: [...reviewHistory, reviewEvent].slice(-100),
+  };
+  const dominioPrevio = {
+    ...finalizarValidacaoDominioPrevio({ total, acertos: acertosNormalizados }),
+    validado: true,
+    questoes: total,
+    acerto: acertoFrac,
+    validatedAt: hoje,
+    primeiraRevisao,
+    primeiraRevisaoLabel: getStepLabel(primeiraRevisao),
+    primeiraRevisaoDate: validacao.proximaRevisao || nextRev?.[primeiraRevisao]?.date || null,
+    source: "ja_domino",
+  };
+
+  return {
+    ...tema,
+    status: "validado_previo",
+    unstarted: false,
+    dominio: registro,
+    dominioPrevio,
+    rev: nextRev,
+    parentTopic: tema.parentTopic || options.parentTopic || null,
+  };
+}
+
+export function getDominioPrevioStatus(tema = {}) {
+  const dp = tema?.dominioPrevio || {};
+  const isValidated = dp.validado === true || dp.status === "validado_previo";
+  if (!isValidated) return { isValidated: false };
+
+  const firstReviewStep = dp.primeiraRevisao || (Number(dp.intervaloInicial || 0) >= 14 ? "d14" : "d7");
+  const firstReviewLabel = dp.primeiraRevisaoLabel || getStepLabel(firstReviewStep);
+  const firstReviewDate = dp.primeiraRevisaoDate || dp.proximaRevisao || tema?.rev?.[firstReviewStep]?.date || null;
+  const acerto = Number.isFinite(Number(dp.acerto))
+    ? Number(dp.acerto)
+    : Number.isFinite(Number(dp.percentual))
+    ? Number(dp.percentual) / 100
+    : null;
+
+  return {
+    isValidated: true,
+    acerto,
+    questoes: Number(dp.questoes ?? dp.total ?? 0) || null,
+    validatedAt: dp.validatedAt || dp.validadoEm || null,
+    firstReviewStep,
+    firstReviewLabel,
+    firstReviewDate,
+  };
+}
+
+export function getReviewDisplayLabel(tema, stepKey) {
+  const status = getDominioPrevioStatus(tema);
+  if (status.isValidated) {
+    if (stepKey === status.firstReviewStep) return status.firstReviewLabel;
+    const step = tema?.rev?.[stepKey];
+    if (!isSkippedReview(step) && step?.date === status.firstReviewDate) {
+      return status.firstReviewLabel;
+    }
+  }
+  return getStepLabel(stepKey);
+}
+
+export function getReviewDisplayMeta(tema, stepKey) {
+  const step = tema?.rev?.[stepKey] || {};
+  return {
+    stepKey,
+    label: getReviewDisplayLabel(tema, stepKey),
+    date: step.date || step.scheduledAt || null,
+    source: step.source || null,
+    skipped: isSkippedReview(step),
+  };
+}
+
+export function getNextReviewForTema(tema = {}, today = todayStr()) {
+  const rev = tema?.rev || {};
+  const status = getDominioPrevioStatus(tema);
+
+  if (status.isValidated && status.firstReviewStep) {
+    const firstRuntimeStepKey = rev[status.firstReviewStep]
+      ? status.firstReviewStep
+      : Object.keys(rev).find((key) => {
+        const step = rev[key];
+        return step && typeof step === "object" && !step.done && !isSkippedReview(step) && step.date === status.firstReviewDate;
+      });
+    const firstStep = rev[firstRuntimeStepKey] || {};
+    if (!firstStep.done && !isSkippedReview(firstStep)) {
+      return {
+        stepKey: firstRuntimeStepKey || status.firstReviewStep,
+        label: status.firstReviewLabel,
+        date: firstStep.date || firstStep.scheduledAt || status.firstReviewDate,
+        source: "dominio_previo",
+        overdue: Boolean((firstStep.date || status.firstReviewDate) < today),
+      };
+    }
+  }
+
+  const keys = Object.keys(rev)
+    .filter((key) => rev[key] && typeof rev[key] === "object")
+    .filter((key) => !["reviewHistory", "meta", "phase", "relearning"].includes(key))
+    .sort((a, b) => {
+      const orderA = REVIEW_DISPLAY_ORDER.includes(a) ? REVIEW_DISPLAY_ORDER.indexOf(a) : 99;
+      const orderB = REVIEW_DISPLAY_ORDER.includes(b) ? REVIEW_DISPLAY_ORDER.indexOf(b) : 99;
+      if (orderA !== orderB) return orderA - orderB;
+      return String(rev[a]?.date || "").localeCompare(String(rev[b]?.date || ""));
+    });
+
+  for (const key of keys) {
+    const step = rev[key];
+    if (step.done || isSkippedReview(step) || !step.date) continue;
+    return {
+      stepKey: key,
+      label: getReviewDisplayLabel(tema, key),
+      date: step.date,
+      source: step.source || null,
+      overdue: step.date < today,
+    };
+  }
+
+  return null;
+}
+
 export function criarRegistroDominio(questoes, acertos) {
   const pct = questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;
   return {
diff --git a/src/core/domainValidation.test.js b/src/core/domainValidation.test.js
index 553b6966..69667e38 100644
--- a/src/core/domainValidation.test.js
+++ b/src/core/domainValidation.test.js
@@ -1,24 +1,30 @@
 import {
+  applyDominioPrevioToTema,
   calcularDominioPrevio,
   DOMINIO_PREVIO_MIN_QUESTOES,
   DOMINIO_PREVIO_MIN_ACERTO,
+  getDominioPrevioStatus,
+  getNextReviewForTema,
+  getReviewDisplayLabel,
 } from "./domainValidation";
+import { addDays, buildRev, todayStr } from "./fsrs";
+import { calcFilaInteligente } from "../hooks/useMetrics";
 
 describe("dominio previo", () => {
-  test("rejeita amostra insuficiente", () => {
+  test("rejects dominio previo with fewer than 15 questions", () => {
     const r = calcularDominioPrevio({ acertos: 10, total: 12 });
     expect(r.valido).toBe(false);
     expect(r.status).toBe("amostra_insuficiente");
   });
 
-  test("reprova abaixo de 80%", () => {
+  test("rejects dominio previo below 80 percent", () => {
     const r = calcularDominioPrevio({ acertos: 11, total: 15 });
     expect(r.valido).toBe(false);
     expect(r.status).toBe("reprovado");
     expect(r.percentual).toBeLessThan(DOMINIO_PREVIO_MIN_ACERTO);
   });
 
-  test("valida com 80-89 e agenda D7", () => {
+  test("80 to 89 percent schedules first review at D7", () => {
     const r = calcularDominioPrevio({ acertos: 12, total: 15 });
     expect(r.valido).toBe(true);
     expect(r.status).toBe("validado_previo");
@@ -26,7 +32,7 @@ describe("dominio previo", () => {
     expect(r.proximaRevisao).toBeTruthy();
   });
 
-  test("valida com 90+ e agenda D14", () => {
+  test("90 percent or more schedules first review at D14", () => {
     const r = calcularDominioPrevio({ acertos: 18, total: 20 });
     expect(r.valido).toBe(true);
     expect(r.status).toBe("validado_previo");
@@ -43,4 +49,198 @@ describe("dominio previo", () => {
   test("constante minima de questoes permanece 15", () => {
     expect(DOMINIO_PREVIO_MIN_QUESTOES).toBe(15);
   });
+
+  test("validated topic is no longer unstarted", () => {
+    const tema = {
+      id: 1,
+      nome: "Tema",
+      esp: "Clínica Médica",
+      importancia: "ALTA",
+      d0: todayStr(),
+      unstarted: true,
+      rev: buildRev(todayStr(), "Clínica Médica"),
+    };
+    const updated = applyDominioPrevioToTema(tema, { questoes: 15, acertos: 13 });
+    expect(updated.unstarted).toBe(false);
+    expect(updated.status).toBe("validado_previo");
+  });
+
+  test("validated topic receives dominioPrevio metadata", () => {
+    const tema = {
+      id: 2,
+      nome: "Tema 2",
+      esp: "Clínica Médica",
+      importancia: "ALTA",
+      d0: todayStr(),
+      unstarted: true,
+      rev: buildRev(todayStr(), "Clínica Médica"),
+    };
+    const updated = applyDominioPrevioToTema(tema, { questoes: 15, acertos: 14 });
+    expect(updated.dominioPrevio?.validado).toBe(true);
+    expect(updated.dominioPrevio?.source).toBe("ja_domino");
+    expect(updated.dominioPrevio?.primeiraRevisao).toBe("d14");
+  });
+
+  test("validated topic receives reviewHistory event", () => {
+    const tema = {
+      id: 3,
+      nome: "Tema 3",
+      esp: "Clínica Médica",
+      importancia: "ALTA",
+      d0: todayStr(),
+      unstarted: true,
+      rev: buildRev(todayStr(), "Clínica Médica"),
+    };
+    const updated = applyDominioPrevioToTema(tema, { questoes: 15, acertos: 12 });
+    const history = updated.rev?.reviewHistory || [];
+    expect(history.length).toBeGreaterThan(0);
+    expect(history[history.length - 1].source).toBe("dominio_previo");
+    expect(history[history.length - 1].stepKey).toBe("d0");
+  });
+
+  test("acerto can be input as 85 or 0.85", () => {
+    const temaBase = {
+      id: 4,
+      nome: "Tema 4",
+      esp: "Clínica Médica",
+      importancia: "ALTA",
+      d0: todayStr(),
+      unstarted: true,
+      rev: buildRev(todayStr(), "Clínica Médica"),
+    };
+    const percentInput = applyDominioPrevioToTema(temaBase, { questoes: 20, acertos: 17 });
+    const fractionInput = applyDominioPrevioToTema(temaBase, { questoes: 20, acertos: 0.85 });
+    expect(percentInput.status).toBe("validado_previo");
+    expect(fractionInput.status).toBe("validado_previo");
+    expect(fractionInput.dominioPrevio?.percentual).toBe(85);
+  });
+
+  test("does not mark as mastered or dominado definitivo", () => {
+    const tema = {
+      id: 5,
+      nome: "Tema 5",
+      esp: "Clínica Médica",
+      importancia: "ALTA",
+      d0: todayStr(),
+      unstarted: true,
+      rev: buildRev(todayStr(), "Clínica Médica"),
+    };
+    const updated = applyDominioPrevioToTema(tema, { questoes: 20, acertos: 18 });
+    expect(updated.status).toBe("validado_previo");
+    expect(updated.dominio?.classificacao).not.toBe("dominado_definitivo");
+  });
+
+  test("80 to 89 percent schedules D7 and never D1", () => {
+    const tema = {
+      id: 6,
+      nome: "Tema 6",
+      esp: "Clínica Médica",
+      importancia: "ALTA",
+      d0: todayStr(),
+      unstarted: true,
+      rev: buildRev(todayStr(), "Clínica Médica"),
+    };
+    const updated = applyDominioPrevioToTema(tema, { questoes: 20, acertos: 17 });
+    const next = getNextReviewForTema(updated);
+
+    expect(getDominioPrevioStatus(updated).firstReviewLabel).toBe("D7");
+    expect(next.label).toBe("D7");
+    expect(next.stepKey).toBe("d7");
+    expect(getReviewDisplayLabel(updated, next.stepKey)).toBe("D7");
+    expect(getReviewDisplayLabel(updated, next.stepKey)).not.toBe("D1");
+    expect(updated.rev.d1.skipped).toBe(true);
+    expect(updated.rev.d4.skipped).toBe(true);
+    expect(updated.rev.d7.done).toBe(false);
+  });
+
+  test("90 percent or more schedules D14 and never D1", () => {
+    const tema = {
+      id: 7,
+      nome: "Tema 7",
+      esp: "Clínica Médica",
+      importancia: "ALTA",
+      d0: todayStr(),
+      unstarted: true,
+      rev: buildRev(todayStr(), "Clínica Médica"),
+    };
+    const updated = applyDominioPrevioToTema(tema, { questoes: 20, acertos: 19 });
+    const next = getNextReviewForTema(updated);
+
+    expect(getDominioPrevioStatus(updated).firstReviewLabel).toBe("D14");
+    expect(next.label).toBe("D14");
+    expect(next.stepKey).toBe("d14");
+    expect(getReviewDisplayLabel(updated, next.stepKey)).toBe("D14");
+    expect(getReviewDisplayLabel(updated, next.stepKey)).not.toBe("D1");
+    expect(updated.rev.d1.skipped).toBe(true);
+    expect(updated.rev.d4.skipped).toBe(true);
+    expect(updated.rev.d7.skipped).toBe(true);
+    expect(updated.rev.d14.done).toBe(false);
+  });
+
+  test("validated topic display accuracy uses dominioPrevio acerto", () => {
+    const tema = {
+      id: 8,
+      nome: "Tema 8",
+      esp: "Clínica Médica",
+      importancia: "ALTA",
+      d0: todayStr(),
+      unstarted: true,
+      rev: buildRev(todayStr(), "Clínica Médica"),
+    };
+    const updated = applyDominioPrevioToTema(tema, { questoes: 20, acertos: 18 });
+    expect(getDominioPrevioStatus(updated).acerto).toBeCloseTo(0.9);
+  });
+
+  test("legacy validated d1 container displays first review label instead of D1", () => {
+    const legacy = {
+      id: 9,
+      nome: "Tema 9",
+      esp: "Clínica Médica",
+      importancia: "ALTA",
+      unstarted: false,
+      dominioPrevio: {
+        status: "validado_previo",
+        validado: true,
+        acerto: 0.92,
+        questoes: 15,
+        intervaloInicial: 14,
+        primeiraRevisao: "d14",
+        proximaRevisao: addDays(todayStr(), 14),
+      },
+      rev: {
+        ...buildRev(todayStr(), "Clínica Médica"),
+        d0: { done: true, date: todayStr(), acerto: 0.92 },
+        d1: { done: false, date: addDays(todayStr(), 14) },
+      },
+    };
+    const next = getNextReviewForTema(legacy);
+    expect(next.stepKey).toBe("d1");
+    expect(next.label).toBe("D14");
+    expect(getReviewDisplayLabel(legacy, "d1")).toBe("D14");
+  });
+
+  test("skipped steps are ignored by queue", () => {
+    const tema = {
+      id: 10,
+      nome: "Tema 10",
+      esp: "Clínica Médica",
+      importancia: "ALTA",
+      d0: todayStr(),
+      unstarted: true,
+      rev: buildRev(todayStr(), "Clínica Médica"),
+    };
+    const updated = applyDominioPrevioToTema(tema, { questoes: 20, acertos: 18 });
+    const dueD14 = {
+      ...updated,
+      rev: {
+        ...updated.rev,
+        d14: { ...updated.rev.d14, date: todayStr(), scheduledAt: todayStr() },
+      },
+    };
+    const queue = calcFilaInteligente([dueD14], "res", {});
+    expect(queue).toHaveLength(1);
+    expect(queue[0].stepKey).toBe("d14");
+    expect(queue[0].step.label).toBe("D14");
+    expect(queue.some((item) => item.stepKey === "d1")).toBe(false);
+  });
 });
diff --git a/src/core/enamedIntel.js b/src/core/enamedIntel.js
index bb19bbda..b82ed32d 100644
--- a/src/core/enamedIntel.js
+++ b/src/core/enamedIntel.js
@@ -5,6 +5,7 @@
 import {
   ENAMED_BLUEPRINT,
   ENAMED_HOTNESS,
+  ENAMED_MACRO_QUESTOES,
   MACRO_PESO_ENAMED,
 } from "../constants/enamedIncidencia";
 import { STEPS } from "./fsrs";
@@ -226,6 +227,28 @@ export function calcPreparoEnamed(temas = []) {
 // Alias temporário se algum patch antigo já chamou calcProntidaoEnamed.
 export const calcProntidaoEnamed = calcPreparoEnamed;
 
+/**
+ * Retorna dados quantitativos de incidência no ENAMED para um tema específico.
+ * Usado pelo balão contextual no modal de tema e no card do cronograma.
+ */
+export function getEnamedContextBadge(area, temaName) {
+  if (!area || !temaName) return null;
+  const match = findHotnessSubarea(area, temaName);
+  if (!match) return null;
+  const totalArea = ENAMED_MACRO_QUESTOES[match.area] ?? null;
+  const questoes = totalArea ? Math.round(match.peso * totalArea) : null;
+  const nivel = match.normalizado >= 0.7 ? "alto" : match.normalizado >= 0.35 ? "medio" : "baixo";
+  return {
+    subarea: match.subarea,
+    area: match.area,
+    questoes,
+    pctAbsoluto: Math.round(match.peso * 100),
+    normalizado: Math.round(match.normalizado * 100),
+    nivel,
+    matchType: match.match,
+  };
+}
+
 export function getEnamedAction(intel) {
   const gargalo = intel?.gargalo;
   if (!gargalo) {
diff --git a/src/core/errorTaxonomy.js b/src/core/errorTaxonomy.js
index f09b9070..76d658ef 100644
--- a/src/core/errorTaxonomy.js
+++ b/src/core/errorTaxonomy.js
@@ -1,4 +1,5 @@
 export const ERROR_TYPE = Object.freeze({
+  // Tipos originais (mantidos)
   CONTENT: "conteudo",
   REASONING: "raciocinio",
   INTERPRETATION: "interpretacao",
@@ -7,6 +8,12 @@ export const ERROR_TYPE = Object.freeze({
   GUESS: "chute",
   CONFIDENCE_MISMATCH: "confianca_mal_calibrada",
   MEMORY: "memoria",
+  // Tipos novos (P3-A)
+  PROBLEM_REPRESENTATION: "representacao_problema",
+  DIFFERENTIAL: "diferencial",
+  SCT_UNCERTAINTY: "incerteza_sct",
+  MANAGEMENT: "conduta_prescricao",
+  EXAM_STRATEGY: "estrategia_prova",
 });
 
 export const ERROR_TYPE_LABEL = Object.freeze({
@@ -18,6 +25,29 @@ export const ERROR_TYPE_LABEL = Object.freeze({
   [ERROR_TYPE.GUESS]: "Chute",
   [ERROR_TYPE.CONFIDENCE_MISMATCH]: "Confianca mal calibrada",
   [ERROR_TYPE.MEMORY]: "Memoria",
+  [ERROR_TYPE.PROBLEM_REPRESENTATION]: "Representacao do problema",
+  [ERROR_TYPE.DIFFERENTIAL]: "Diferencial",
+  [ERROR_TYPE.SCT_UNCERTAINTY]: "Incerteza SCT",
+  [ERROR_TYPE.MANAGEMENT]: "Conduta / prescricao",
+  [ERROR_TYPE.EXAM_STRATEGY]: "Estrategia de prova",
+});
+
+// Plataformas nas quais cada tipo e valido.
+// "conduta_prescricao" e exclusivo de Residencia (P3-A decision).
+export const ERROR_TYPE_PLATFORMS = Object.freeze({
+  [ERROR_TYPE.CONTENT]: ["res", "vest"],
+  [ERROR_TYPE.REASONING]: ["res", "vest"],
+  [ERROR_TYPE.INTERPRETATION]: ["res", "vest"],
+  [ERROR_TYPE.DISTRACTION]: ["res", "vest"],
+  [ERROR_TYPE.TIME]: ["res", "vest"],
+  [ERROR_TYPE.GUESS]: ["res", "vest"],
+  [ERROR_TYPE.CONFIDENCE_MISMATCH]: ["res", "vest"],
+  [ERROR_TYPE.MEMORY]: ["res", "vest"],
+  [ERROR_TYPE.PROBLEM_REPRESENTATION]: ["res"],
+  [ERROR_TYPE.DIFFERENTIAL]: ["res"],
+  [ERROR_TYPE.SCT_UNCERTAINTY]: ["res"],
+  [ERROR_TYPE.MANAGEMENT]: ["res"],
+  [ERROR_TYPE.EXAM_STRATEGY]: ["res", "vest"],
 });
 
 const LEGACY_ERROR_MAP = Object.freeze({
@@ -27,16 +57,23 @@ const LEGACY_ERROR_MAP = Object.freeze({
   raciocinio: ERROR_TYPE.REASONING,
   "raciocinio_clinico": ERROR_TYPE.REASONING,
   interpretacao: ERROR_TYPE.INTERPRETATION,
-  distractor: ERROR_TYPE.DISTRACTION,
+  // distractor → diferencial: erro por ser enganado por um diferencial plausivel
+  distractor: ERROR_TYPE.DIFFERENTIAL,
   distracao: ERROR_TYPE.DISTRACTION,
   descuido: ERROR_TYPE.DISTRACTION,
   tempo: ERROR_TYPE.TIME,
   chute: ERROR_TYPE.GUESS,
   memoria: ERROR_TYPE.MEMORY,
   confianca_mal_calibrada: ERROR_TYPE.CONFIDENCE_MISMATCH,
+  // novos aliases uteis
+  representacao_problema: ERROR_TYPE.PROBLEM_REPRESENTATION,
+  diferencial: ERROR_TYPE.DIFFERENTIAL,
+  incerteza_sct: ERROR_TYPE.SCT_UNCERTAINTY,
+  conduta_prescricao: ERROR_TYPE.MANAGEMENT,
+  estrategia_prova: ERROR_TYPE.EXAM_STRATEGY,
 });
 
-function normalizeErrorType(rawType) {
+export function normalizeErrorType(rawType) {
   if (!rawType) return null;
   const key = String(rawType).trim().toLowerCase();
   return LEGACY_ERROR_MAP[key] || key;
@@ -74,10 +111,16 @@ export function errorSeverity(error = {}) {
   if (!tipo) return 0;
   if (tipo === ERROR_TYPE.CONFIDENCE_MISMATCH) return 100;
   if (tipo === ERROR_TYPE.REASONING) return 90;
+  if (tipo === ERROR_TYPE.MANAGEMENT) return 88;
+  if (tipo === ERROR_TYPE.PROBLEM_REPRESENTATION) return 85;
   if (tipo === ERROR_TYPE.CONTENT) return 75;
+  if (tipo === ERROR_TYPE.DIFFERENTIAL) return 72;
   if (tipo === ERROR_TYPE.INTERPRETATION) return 65;
+  if (tipo === ERROR_TYPE.SCT_UNCERTAINTY) return 60;
   if (tipo === ERROR_TYPE.TIME) return 55;
+  if (tipo === ERROR_TYPE.EXAM_STRATEGY) return 52;
   if (tipo === ERROR_TYPE.DISTRACTION) return 45;
+  if (tipo === ERROR_TYPE.MEMORY) return 42;
   if (tipo === ERROR_TYPE.GUESS) return 40;
   return 50;
 }
diff --git a/src/core/fsrs.js b/src/core/fsrs.js
index 55eb9976..a6b4f359 100644
--- a/src/core/fsrs.js
+++ b/src/core/fsrs.js
@@ -102,7 +102,7 @@ export function getWorkloadProjection(temas, numDays = 14) {
     Object.keys(t.rev).forEach(stepKey => {
       if (stepKey === "reviewHistory" || stepKey === "meta" || stepKey === "phase" || stepKey === "relearning") return;
       const r = t.rev[stepKey];
-      if (r && !r.done && r.date) {
+      if (r && !r.done && !r.skipped && r.skipReason !== "dominio_previo" && !r.skippeadoPorDominio && r.date) {
         const minutes = getEstimatedMinutesForStep(stepKey, r);
         const payload = {
           temaId: t.id,
diff --git a/src/core/fsrs.test.js b/src/core/fsrs.test.js
index 00536418..c6613bb6 100644
--- a/src/core/fsrs.test.js
+++ b/src/core/fsrs.test.js
@@ -182,6 +182,24 @@ describe("FSRS Core Logic Test Suite", () => {
     expect(proj[today].estimatedMinutes).toBeGreaterThan(0);
   });
 
+  test("getWorkloadProjection ignores skipped domain validation steps", () => {
+    const today = todayStr();
+    const temas = [
+      {
+        unstarted: false,
+        rev: {
+          d1: { done: true, skipped: true, skipReason: "dominio_previo", date: today },
+          d4: { done: true, skipped: true, skipReason: "dominio_previo", date: today },
+          d7: { done: false, date: today, source: "dominio_previo" },
+        },
+      },
+    ];
+
+    const proj = getWorkloadProjection(temas, 1);
+    expect(proj[today].count).toBe(1);
+    expect(proj[today].items[0].stepKey).toBe("d7");
+  });
+
   test("recalcAfterMark with D1 dynamic acertos recalcs correctly", () => {
     const today = todayStr();
     const initialRev = {
diff --git a/src/core/illnessScript.js b/src/core/illnessScript.js
index 19d302b0..fd030362 100644
--- a/src/core/illnessScript.js
+++ b/src/core/illnessScript.js
@@ -11,6 +11,7 @@
 // 6. Reencontro espaçado: agenda o caso conforme desempenho.
 
 import { addDays, todayStr } from "./fsrs";
+import { calculateClinicalReasoningScore, calcCoverageByArea as calcCoverageByAreaCanonical } from "./clinicalReasoningScoring";
 
 export const PESO_FASE = Object.freeze({
   problemRep: 0.20,
@@ -421,41 +422,14 @@ export function casosDeHoje(casos = [], progresso = {}, areasPrioritarias = [],
   return [...devidos, ...novosSelecionados];
 }
 
-export function calcRaciocinioScore(progresso = {}) {
-  const notas = Object.values(progresso || {})
-    .filter((p) => p && Number(p.vistos || 0) > 0 && typeof p.notaCaso === "number")
-    .map((p) => clamp(p.notaCaso));
-
-  if (!notas.length) return null;
-  return Math.round(notas.reduce((acc, nota) => acc + nota, 0) / notas.length);
-}
+// P4-A: calcRaciocinioScore substituida por calculateClinicalReasoningScore (fonte canonica).
+// A versao antiga lia notaCaso — campo nunca gravado pela UI, retornando sempre null.
+// Re-exportamos para manter compatibilidade de importacao com callers existentes.
+export { calculateClinicalReasoningScore as calcRaciocinioScore };
 
+// P4-A: coberturaRaciocinioPorArea substituida por calcCoverageByArea (fonte canonica).
+// A versao antiga lia notaCaso — campo nunca gravado, retornando notaMedia sempre null.
+// Re-exportamos com o nome antigo para compatibilidade.
 export function coberturaRaciocinioPorArea(casos = [], progresso = {}) {
-  const out = {};
-
-  for (const caso of casos || []) {
-    if (!caso?.area) continue;
-    const area = caso.area;
-    if (!out[area]) {
-      out[area] = { total: 0, vistos: 0, somaNota: 0, comNota: 0, pctCobertura: 0, notaMedia: null };
-    }
-
-    out[area].total += 1;
-    const p = progresso?.[caso.id];
-    if (Number(p?.vistos || 0) > 0) {
-      out[area].vistos += 1;
-      if (typeof p.notaCaso === "number") {
-        out[area].somaNota += clamp(p.notaCaso);
-        out[area].comNota += 1;
-      }
-    }
-  }
-
-  for (const area of Object.keys(out)) {
-    const row = out[area];
-    row.pctCobertura = row.total ? Math.round((row.vistos / row.total) * 100) : 0;
-    row.notaMedia = row.comNota ? Math.round(row.somaNota / row.comNota) : null;
-  }
-
-  return out;
+  return calcCoverageByAreaCanonical(casos, progresso);
 }
diff --git a/src/core/illnessScript.test.js b/src/core/illnessScript.test.js
index 8f552768..c35c9dc4 100644
--- a/src/core/illnessScript.test.js
+++ b/src/core/illnessScript.test.js
@@ -123,21 +123,25 @@ describe("illnessScript engine", () => {
     expect(fila[1].caso.id).toBe("cm-1");
   });
 
-  test("calcRaciocinioScore e cobertura por área resumem progresso", () => {
+  test("calcRaciocinioScore e cobertura por área resumem progresso (P4-A: campos reais)", () => {
+    // P4-A: notaCaso nunca e gravado pela UI — fixture atualizado para fase2Acerto/sctAcerto.
+    // Formula canonica: fase2Acerto*0.6 + sctAcerto*0.4 (peso adaptativo se um ausente).
     const casos = [
       { id: "a", area: "Cirurgia" },
       { id: "b", area: "Cirurgia" },
       { id: "c", area: "GO" },
     ];
     const progresso = {
-      a: { vistos: 1, notaCaso: 80 },
-      c: { vistos: 2, notaCaso: 60 },
+      // a: fase2=80 sct=80 -> 80
+      a: { vistos: 1, fase2Acerto: 80, sctAcerto: 80 },
+      // c: fase2=60 sct=60 -> 60
+      c: { vistos: 2, fase2Acerto: 60, sctAcerto: 60 },
     };
-
+    // media dos scores: (80 + 60) / 2 = 70
     expect(calcRaciocinioScore(progresso)).toBe(70);
 
     const cobertura = coberturaRaciocinioPorArea(casos, progresso);
-    expect(cobertura.Cirurgia.pctCobertura).toBe(50);
+    expect(cobertura.Cirurgia.pctCobertura).toBe(50); // 1 de 2 visitado
     expect(cobertura.GO.pctCobertura).toBe(100);
     expect(cobertura.GO.notaMedia).toBe(60);
   });
diff --git a/src/core/launchReadiness.js b/src/core/launchReadiness.js
index c54bf5f3..38299d3c 100644
--- a/src/core/launchReadiness.js
+++ b/src/core/launchReadiness.js
@@ -22,50 +22,50 @@ export function checkLaunchReadiness(context = {}) {
       label: "Onboarding configurado",
       status: onboarding.completed === true ? "ok" : "warn",
       reason: onboarding.completed === true
-        ? "Onboarding concluido."
-        : "Onboarding ainda nao concluido; o Mentor pode ter pouco contexto.",
+        ? "Onboarding conclu\u00eddo."
+        : "Onboarding ainda n\u00e3o conclu\u00eddo; o Mentor pode ter pouco contexto.",
     },
     {
       id: "calendar-provider",
-      label: "Calendario-base selecionado",
+      label: "Calend\u00e1rio-base selecionado",
       status: (calendarProvider.activeId || onboarding.calendarProvider) ? "ok" : "fail",
       reason: (calendarProvider.activeId || onboarding.calendarProvider)
-        ? "Provider de calendario definido."
-        : "Nenhum calendario-base selecionado.",
+        ? "Provider de calend\u00e1rio definido."
+        : "Nenhum calend\u00e1rio-base selecionado.",
     },
     {
       id: "mentor-action",
-      label: "Mentor gera acao principal",
+      label: "Mentor gera a\u00e7\u00e3o principal",
       status: hasOpenMentorAction(actionInbox) ? "ok" : "warn",
       reason: hasOpenMentorAction(actionInbox)
-        ? "Ha acao principal para hoje."
-        : "Ainda sem acao principal disponivel no Mentor.",
+        ? "H\u00e1 a\u00e7\u00e3o principal para hoje."
+        : "Ainda sem a\u00e7\u00e3o principal dispon\u00edvel no Mentor.",
     },
     {
       id: "enamed",
-      label: "ENAMED Intel disponivel",
+      label: "ENAMED Intel dispon\u00edvel",
       status: modules.enamed === false ? "warn" : enamedAnalises.length > 0 ? "ok" : "warn",
       reason: modules.enamed === false
-        ? "Modulo ENAMED desativado."
+        ? "M\u00f3dulo ENAMED desativado."
         : enamedAnalises.length > 0
-        ? "Analise ENAMED registrada."
+        ? "An\u00e1lise ENAMED registrada."
         : "ENAMED ativo, mas sem prova analisada.",
     },
     {
       id: "raciocinio",
-      label: "Raciocinio Clinico acessivel",
+      label: "Racioc\u00ednio Cl\u00ednico acess\u00edvel",
       status: modules.raciocinioClinico === true ? "ok" : "warn",
       reason: modules.raciocinioClinico === true
-        ? "Modulo de raciocinio habilitado."
-        : "Modulo de raciocinio ainda desativado.",
+        ? "M\u00f3dulo de racioc\u00ednio habilitado."
+        : "M\u00f3dulo de racioc\u00ednio ainda desativado.",
     },
     {
       id: "backup",
-      label: "Backup/exportacao disponivel",
+      label: "Backup/exporta\u00e7\u00e3o dispon\u00edvel",
       status: context.backupAvailable === false ? "fail" : "ok",
       reason: context.backupAvailable === false
-        ? "Backup indisponivel neste ambiente."
-        : "Exportacao de backup disponivel.",
+        ? "Backup indispon\u00edvel neste ambiente."
+        : "Exporta\u00e7\u00e3o de backup dispon\u00edvel.",
     },
   ];
 
diff --git a/src/core/mentorDecisionPolicy.js b/src/core/mentorDecisionPolicy.js
index f33c965a..1fad2726 100644
--- a/src/core/mentorDecisionPolicy.js
+++ b/src/core/mentorDecisionPolicy.js
@@ -186,6 +186,35 @@ export function decideMentorAction(context = {}) {
     });
   }
 
+  // Erro dominante forte com acao corretiva disponivel
+  // Prioridade 78: apos analise de simulado pendente, antes de gargalo ENAMED e caso clinico.
+  if (context.dominantErrorIsStrong && context.dominantErrorAction) {
+    const da = context.dominantErrorAction;
+    return buildAction({
+      type: da.mentorActionType || "review",
+      priority: 78,
+      title: `Acao corretiva: ${da.label}`,
+      subtitle: "Padrao de erro recorrente identificado.",
+      reason: da.definition,
+      explain: [
+        da.correctiveActions[0] || "Aplique a acao corretiva recomendada.",
+        da.correctiveActions[1] || null,
+        da.fsrsEffect || null,
+      ].filter(Boolean),
+      cta: "Ver acao corretiva",
+      ctaView: "stats",
+      estimatedMinutes: 20,
+      confidence: 0.82,
+      safety: "ok",
+      target: {
+        area: "erros",
+        errorType: context.dominantError,
+        preferredTask: da.preferredTask,
+        action: "corrective_action",
+      },
+    });
+  }
+
   if (plat === "res" && areaCritica) {
     return buildAction({
       type: "enamed_critico",
diff --git a/src/core/mentorSignals.js b/src/core/mentorSignals.js
index 13dc5cb4..273e48b3 100644
--- a/src/core/mentorSignals.js
+++ b/src/core/mentorSignals.js
@@ -1,11 +1,15 @@
 import { STEPS, todayStr, diffDays, getWorkloadProjection } from "./fsrs";
 import { calcTrueRetentionDetailed } from "../hooks/useMetrics";
+import { dominantErrorType, summarizeErrors, normalizeErrorType } from "./errorTaxonomy";
+import { getCorrectiveAction } from "./errorActionMap";
+import { getReviewDisplayLabel } from "./domainValidation";
 
 function getStepEntries(rev = {}) {
   const entries = [];
   for (const step of STEPS) {
     if (rev?.[step.key]) entries.push([step.key, rev[step.key]]);
   }
+  if (rev?.d14) entries.push(["d14", rev.d14]);
   if (rev?.manutencao) entries.push(["manutencao", rev.manutencao]);
   return entries;
 }
@@ -48,6 +52,46 @@ function collectClinicalCaseSignals(casosProgresso = {}, today = todayStr()) {
   };
 }
 
+/**
+ * Analisa erros recentes (revisoes + simulados) e retorna o tipo dominante
+ * com sua acao corretiva quando houver amostra suficiente.
+ */
+function collectDominantErrorSignal(temas = [], simulados = [], plat = "res") {
+  const fromReviews = temas.flatMap((tema) =>
+    STEPS.flatMap((step) => {
+      const review = tema.rev?.[step.key];
+      if (!review?.done) return [];
+      const structured = Array.isArray(review.erros) ? review.erros : [];
+      const fallback = Array.isArray(review.motivosErro)
+        ? review.motivosErro.map((tipoErro) => ({ tipoErro, acertou: false }))
+        : [];
+      return [...structured, ...fallback];
+    })
+  );
+  const fromSimulados = simulados.flatMap((sim) =>
+    (sim.questoesErradas || []).map((q) => ({
+      tipoErro: q.tipoErro,
+      acertou: false,
+      tempoExcedido: Boolean(q.tempoExcedido),
+    }))
+  );
+  const allErrors = [...fromReviews, ...fromSimulados];
+  const dominant = dominantErrorType(allErrors);
+  const total = allErrors.length;
+  const summary = summarizeErrors(allErrors);
+  const dominantCount = dominant ? (summary[dominant] || 0) : 0;
+  const isStrong = total >= 5 && dominantCount >= 3;
+  const correctiveAction = isStrong ? getCorrectiveAction(dominant) : null;
+
+  return {
+    dominantError: isStrong ? dominant : null,
+    dominantErrorCount: dominantCount,
+    dominantErrorTotal: total,
+    dominantErrorAction: correctiveAction,
+    dominantErrorIsStrong: isStrong,
+  };
+}
+
 export function collectMentorSchedulerSignals(temas = [], options = {}) {
   const today = options.today || todayStr();
   const projectionDays = options.projectionDays || 14;
@@ -94,6 +138,9 @@ export function collectMentorSchedulerSignals(temas = [], options = {}) {
 
     for (const [stepKey, step] of getStepEntries(rev)) {
       if (!step) continue;
+      if (step.skipped || step.skipReason === "dominio_previo" || step.skippeadoPorDominio) {
+        continue;
+      }
       if (step.done && !step.reviewedAt) {
         missingReviewedAtCount += 1;
       }
@@ -111,6 +158,7 @@ export function collectMentorSchedulerSignals(temas = [], options = {}) {
           temaNome: tema.nome,
           esp: tema.esp,
           stepKey,
+          label: getReviewDisplayLabel(tema, stepKey),
           date: step.date,
           delayDays,
           phase: step.phase || null,
@@ -122,6 +170,7 @@ export function collectMentorSchedulerSignals(temas = [], options = {}) {
           temaNome: tema.nome,
           esp: tema.esp,
           stepKey,
+          label: getReviewDisplayLabel(tema, stepKey),
           date: step.date,
           delayDays: 0,
           phase: step.phase || null,
@@ -180,6 +229,7 @@ export function buildMentorContext(state = {}, platArg, extras = {}) {
     ? Number(meta.tempoDisponivel) * 60
     : null;
   const pendingExamAnalysis = Boolean(simulados.length > 0 && !latestEnamed);
+  const errorSignal = collectDominantErrorSignal(temas, simulados, plat);
 
   return {
     plat,
@@ -197,5 +247,8 @@ export function buildMentorContext(state = {}, platArg, extras = {}) {
     userAvailableMinutes,
     lowEnergy: Boolean(extras.lowEnergy),
     exhaustionDetected: Boolean(extras.exhaustionDetected),
+    dominantError: errorSignal.dominantError,
+    dominantErrorAction: errorSignal.dominantErrorAction,
+    dominantErrorIsStrong: errorSignal.dominantErrorIsStrong,
   };
 }
diff --git a/src/core/mentorSignals.test.js b/src/core/mentorSignals.test.js
index bc148693..bd20816f 100644
--- a/src/core/mentorSignals.test.js
+++ b/src/core/mentorSignals.test.js
@@ -46,6 +46,41 @@ describe("mentorSignals", () => {
     expect(signals.missingReviewedAtCount).toBeGreaterThan(0);
   });
 
+  test("mentor signal labels validated previous domain as D14 and not D1", () => {
+    const today = todayStr();
+    const temas = [
+      {
+        id: 3,
+        nome: "Tema validado",
+        esp: "Clínica Médica",
+        unstarted: false,
+        dominioPrevio: {
+          status: "validado_previo",
+          validado: true,
+          acerto: 0.92,
+          questoes: 15,
+          intervaloInicial: 14,
+          primeiraRevisao: "d14",
+          primeiraRevisaoDate: today,
+        },
+        rev: {
+          phase: "learning",
+          reviewHistory: [],
+          d1: { done: true, skipped: true, skipReason: "dominio_previo", date: today, reviewedAt: today, acerto: 0.92 },
+          d4: { done: true, skipped: true, skipReason: "dominio_previo", date: today, reviewedAt: today, acerto: 0.92 },
+          d7: { done: true, skipped: true, skipReason: "dominio_previo", date: today, reviewedAt: today, acerto: 0.92 },
+          d14: { done: false, date: today, source: "dominio_previo" },
+        },
+      },
+    ];
+
+    const signals = collectMentorSchedulerSignals(temas, { today });
+    expect(signals.dueTodayCount).toBe(1);
+    expect(signals.nextDueItem.stepKey).toBe("d14");
+    expect(signals.nextDueItem.label).toBe("D14");
+    expect(signals.nextDueItem.label).not.toBe("D1");
+  });
+
   test("buildMentorContext agrega provider e sinais de plataforma", () => {
     const today = todayStr();
     const state = {
diff --git a/src/core/navigationModel.js b/src/core/navigationModel.js
index ab61b222..b945b578 100644
--- a/src/core/navigationModel.js
+++ b/src/core/navigationModel.js
@@ -1,31 +1,37 @@
+import { COPY } from "./copy";
+
+// Itens marcados como devOnly so aparecem no build de desenvolvimento.
+// No build de producao (o que o usuario recebe) eles ficam ocultos.
+const IS_DEV = process.env.NODE_ENV !== "production";
+
 const PRIMARY_ITEMS = [
   {
     view: "dash",
-    label: "Hoje",
-    mobileLabel: "Hoje",
+    label: COPY.views.dash,
+    mobileLabel: COPY.views.dash,
     description: "Resumo do dia com comando do Mentor.",
     desktop: true,
     mobile: true,
   },
   {
     view: "crono",
-    label: "Plano",
-    mobileLabel: "Plano",
+    label: COPY.views.crono,
+    mobileLabel: COPY.views.crono,
     description: "Cronograma e planejamento de temas.",
     desktop: true,
     mobile: true,
   },
   {
     view: "sims",
-    label: "Estudar",
-    mobileLabel: "Estudar",
+    label: COPY.views.sims,
+    mobileLabel: COPY.views.sims,
     description: "Fluxo principal de estudo e simulados.",
     desktop: true,
     mobile: true,
   },
   {
     view: "stats",
-    label: "Estatisticas",
+    label: COPY.views.stats,
     mobileLabel: "Stats",
     description: "Metricas e paineis de progresso.",
     desktop: true,
@@ -33,7 +39,7 @@ const PRIMARY_ITEMS = [
   },
   {
     view: "banco",
-    label: "Banco",
+    label: COPY.views.banco,
     mobileLabel: "Banco",
     description: "Banco de dados e consultas.",
     desktop: true,
@@ -41,8 +47,8 @@ const PRIMARY_ITEMS = [
   },
   {
     view: "more",
-    label: "Mais",
-    mobileLabel: "Mais",
+    label: COPY.views.more,
+    mobileLabel: COPY.views.more,
     description: "Ferramentas avancadas e sistema.",
     desktop: true,
     mobile: true,
@@ -52,8 +58,8 @@ const PRIMARY_ITEMS = [
 const MORE_ITEMS = [
   {
     view: "raciocinio",
-    label: "Raciocinio Clinico",
-    description: "Treine problem representation, hipoteses e illness scripts.",
+    label: "Racioc\u00ednio Cl\u00ednico",
+    description: "Treine racioc\u00ednio diagn\u00f3stico, hip\u00f3teses e condutas simuladas.",
     onlyPlat: "res",
     requiresFeature: "raciocinioClinico",
   },
@@ -62,35 +68,16 @@ const MORE_ITEMS = [
     label: "Anki Audit",
     description: "Auditoria de aderencia e consistencia no Anki.",
   },
-  {
-    view: "weekly_review",
-    label: "Weekly Review",
-    description: "Revisao executiva da semana com acoes sugeridas.",
-  },
   {
     view: "academia",
-    label: "Academia / Metodo",
-    description: "Fundamentos do metodo e guias de estudo.",
-  },
-  {
-    view: "data_safety",
-    label: "Data Safety",
-    description: "Checklist de seguranca de dados e confiabilidade.",
-  },
-  {
-    view: "launch_checklist",
-    label: "Launch Checklist",
-    description: "Checklist de prontidao para lancamento.",
-  },
-  {
-    view: "guia",
-    label: "Guia",
-    description: "Guia rapido de uso do MedRev.",
+    label: "Academia / M\u00e9todo",
+    description: "Fundamentos do m\u00e9todo e guias de estudo.",
   },
   {
-    view: "ajustes",
-    label: "Ajustes",
-    description: "Configuracoes de conta, plano e aplicativo.",
+    view: "weekly_review",
+    label: "Weekly Review",
+    description: "Revisao executiva da semana com acoes sugeridas.",
+    devOnly: true,
   },
 ];
 
@@ -122,16 +109,16 @@ const LEGACY_VIEW_MAP = {
 };
 
 const LABELS_BY_VIEW = {
-  dash: "Hoje",
-  crono: "Plano",
-  sims: "Estudar",
-  stats: "Estatisticas",
-  banco: "Banco",
-  more: "Mais",
-  raciocinio: "Raciocinio Clinico",
+  dash: COPY.views.dash,
+  crono: COPY.views.crono,
+  sims: COPY.views.sims,
+  stats: COPY.views.stats,
+  banco: COPY.views.banco,
+  more: COPY.views.more,
+  raciocinio: "Racioc\u00ednio Cl\u00ednico",
   anki: "Anki Audit",
   weekly_review: "Weekly Review",
-  academia: "Academia / Metodo",
+  academia: "Academia / M\u00e9todo",
   data_safety: "Data Safety",
   launch_checklist: "Launch Checklist",
   guia: "Guia",
@@ -170,6 +157,7 @@ function isRaciocinioEnabled(plat, features = {}) {
 }
 
 function isItemAvailable(item, plat, features = {}) {
+  if (item.devOnly && !IS_DEV) return false;
   if (item.onlyPlat && item.onlyPlat !== plat) return false;
   if (item.requiresFeature === "raciocinioClinico") {
     return isRaciocinioEnabled(plat, features);
diff --git a/src/core/navigationModel.test.js b/src/core/navigationModel.test.js
index 79eadfd1..3e8aeac9 100644
--- a/src/core/navigationModel.test.js
+++ b/src/core/navigationModel.test.js
@@ -36,13 +36,16 @@ test("raciocinio is not available for vestibular", () => {
   expect(isViewAvailable("raciocinio", "vest", { raciocinioClinico: true })).toBe(false);
 });
 
-test("settings remains reachable", () => {
+test("guide, settings and hidden system tools are not visible in more", () => {
   const views = getMoreNavItems("res").map((item) => item.view);
-  expect(views).toContain(NAV_VIEW.SETTINGS);
+  expect(views).not.toContain(NAV_VIEW.GUIDE);
+  expect(views).not.toContain(NAV_VIEW.SETTINGS);
+  expect(views).not.toContain(NAV_VIEW.DATA_SAFETY);
+  expect(views).not.toContain(NAV_VIEW.LAUNCH_CHECKLIST);
 });
 
 test("legacy view labels still resolve", () => {
   expect(normalizeView("dashboard")).toBe("dash");
   expect(resolveViewLabel("simulados")).toBe("Estudar");
-  expect(resolveViewLabel("estatisticas")).toBe("Estatisticas");
+  expect(resolveViewLabel("estatisticas")).toBe("Estatísticas");
 });
diff --git a/src/core/readiness.js b/src/core/readiness.js
index cf49cd35..9b6326fa 100644
--- a/src/core/readiness.js
+++ b/src/core/readiness.js
@@ -3,6 +3,7 @@ import { PROVA_STATS_RES, PROVA_STATS_VEST, PROVAS_RES, PROVAS_VEST } from "../c
 import { saldoRitmo, scoreProntidao } from "./volume";
 import { calcTrueRetention, calcTrend } from "../hooks/useMetrics";
 import { getEnamedIntel, calcPreparoEnamed } from "./enamedIntel";
+import { calculateClinicalReasoningScore } from "./clinicalReasoningScoring";
 
 export function pickTargetProva(provasAlvo, plat) {
   const list = plat === "res" ? PROVAS_RES : PROVAS_VEST;
@@ -22,21 +23,8 @@ export function matchesArea(studentEsp, examAreaName) {
   return false;
 }
 
-function calcRaciocinioScore(casosProgresso) {
-  const vistos = Object.values(casosProgresso || {}).filter((p) => p?.vistos > 0);
-  const scores = vistos.map((p) => {
-    const parts = [
-      typeof p.fase2Acerto === "number" ? { value: p.fase2Acerto, weight: 0.6 } : null,
-      typeof p.sctAcerto === "number" ? { value: p.sctAcerto, weight: 0.4 } : null,
-    ].filter(Boolean);
-    if (!parts.length) return null;
-    const weightSum = parts.reduce((sum, part) => sum + part.weight, 0);
-    return parts.reduce((sum, part) => sum + part.value * part.weight, 0) / weightSum;
-  }).filter((score) => score != null);
-
-  if (!scores.length) return null;
-  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
-}
+// Removido: calcRaciocinioScore local substituida por calculateClinicalReasoningScore
+// de clinicalReasoningScoring.js (fonte canonica unica — P4-A)
 
 export function getReadinessData({ temas, simulados, meta, plat, casosProgresso = {} }) {
   const startedTemas = temas.filter(t => !t.unstarted);
@@ -95,7 +83,7 @@ export function getReadinessData({ temas, simulados, meta, plat, casosProgresso
     adesaoAnkiNorm: adesaoAnkiNorm
   });
   const raciocinioScore = meta?.modulos?.raciocinioClinico
-    ? calcRaciocinioScore(casosProgresso)
+    ? calculateClinicalReasoningScore(casosProgresso)
     : null;
 
   // 6. Confidence range (e.g. +/- 6 points, bounded by 0-100)
diff --git a/src/core/simStrategy.js b/src/core/simStrategy.js
index 4d39431f..1a3b391b 100644
--- a/src/core/simStrategy.js
+++ b/src/core/simStrategy.js
@@ -216,7 +216,7 @@ export function getSimuladoProtocolo(tipo) {
     { t: "Não persiga o número", d: "Primeiras provas pontuam 40–55% e isso é normal. O que vale é a tendência da média móvel, não um simulado isolado." },
     { t: "Triagem de erro obrigatória", d: "Para cada erro, classifique a causa (lacuna / raciocínio / distrator / descuido / interpretação / não visto). Sem isso o simulado vira só uma nota." },
     { t: "Revise o racional de TODAS as erradas", d: "Leia o comentário inteiro, inclusive de acertos por chute. Re-leitura passiva engana; explicar o porquê consolida." },
-    { t: "Refaça só as erradas em 48–72h", d: "Relearning sucessivo: reencontrar o que você errou alguns dias depois é o que fixa de verdade. Lacunas viram tema no FSRS + card atômico (cloze)." },
+    { t: "Refa\u00e7a s\u00f3 as erradas em 48\u201372h", d: "Reaprendizado sucessivo: reencontrar o que voc\u00ea errou alguns dias depois \u00e9 o que fixa de verdade. Lacunas viram tema na curva de revis\u00e3o + card at\u00f4mico (cloze)." },
     { t: "Use provas NOVAS para prever desempenho", d: "Refazer prova já vista infla a nota por reconhecimento. Reaproveite provas antigas só como treino de erro, nunca como previsão." },
   ];
   if (tipo === "Confirmação") {
diff --git a/src/core/store.js b/src/core/store.js
index dd7224c9..a82be233 100644
--- a/src/core/store.js
+++ b/src/core/store.js
@@ -11,11 +11,8 @@ import { adjustActionForPeakMode, getPeakModePolicy, getPeakPhase } from "./peak
 import { applyOnboardingChoice, getOnboardingDefaults, isOnboardingComplete } from "./onboarding";
 import { getAnonymousStorageKey, getOrCreateAnonymousSessionId } from "./userScope";
 import {
-  criarRegistroDominio,
-  buildRevComDominio,
-  calcularDominioPrevio,
+  applyDominioPrevioToTema,
   criarValidacaoDominioPrevio,
-  finalizarValidacaoDominioPrevio,
   isTemaNaoIniciado,
 } from "./domainValidation";
 
@@ -222,7 +219,7 @@ export const useStore = create(
       },
       userName: "Estudante",
       userEmail: "",
-      meta: { dataProva: "2026-09-13", acerto: 85, retencaoFSRS: 0.90, maxRevisoesDia: 30, tempoDisponivel: 2, intervaloMaxDias: 180, pausadoAte: null, isRetornoAcolhedor: false, lastActiveDate: null, provasAlvo: ["ENAMED"], isSegundaTentativa: false, areaPuxouBaixo: "", notasTentativaAnterior: {}, acertosAlvo: 0, totalQuestoesAlvo: 100, notaCorteAlvo: 0, streakFreezeAvailable: true, streakFreezeUsed: false, tomMentor: "gentil", estrategiaRefinada: false, metaQuestoesDia: 0, metaQuestoesTotal: 0, volumePorAreaModo: "fraqueza", mentorLog: [], ferramentas: { questoes: "MedEvo", flashcards: "Anki" }, metodoProgresso: {}, dicasVistas: [], notif: { enabled: false, hora: "08:00" }, prontidaoHist: [], ativacaoDispensada: false, trilhaDispensada: false, trilhaXpDados: {}, streakMaxAvisado: false, lastFocusSessionAt: null, lastReflectionAt: null, peakModePhase: "base", ankiAdesao: { datas: [] }, modulos: { raciocinioClinico: false }, onboarding: getOnboardingDefaults(), temasPerWeek: 6, estrategiaStartDate: null },
+      meta: { dataProva: "2026-09-13", acerto: 85, retencaoFSRS: 0.90, maxRevisoesDia: 30, tempoDisponivel: 2, intervaloMaxDias: 180, pausadoAte: null, isRetornoAcolhedor: false, lastActiveDate: null, provasAlvo: ["ENAMED"], isSegundaTentativa: false, areaPuxouBaixo: "", notasTentativaAnterior: {}, acertosAlvo: 0, totalQuestoesAlvo: 100, notaCorteAlvo: 0, streakFreezeAvailable: true, streakFreezeUsed: false, tomMentor: "gentil", estrategiaRefinada: false, metaQuestoesDia: 0, metaQuestoesTotal: 0, volumePorAreaModo: "fraqueza", mentorLog: [], ferramentas: { questoes: "MedEvo", flashcards: "Anki" }, metodoProgresso: {}, dicasVistas: [], notif: { enabled: false, hora: "08:00" }, prontidaoHist: [], ativacaoDispensada: false, trilhaDispensada: false, trilhaXpDados: {}, streakMaxAvisado: false, lastFocusSessionAt: null, lastReflectionAt: null, peakModePhase: "base", ankiAdesao: { datas: [] }, modulos: { raciocinioClinico: false }, onboarding: getOnboardingDefaults(), vestibularStart: { completed: false, targetExam: null, examDate: null, baselineMode: null, planMode: "mentor", completedAt: null }, temasPerWeek: 6, estrategiaStartDate: null },
       res: initialPlat(),
       vest: initialVestibularPlat(),
       undoStack: [],
@@ -795,30 +792,22 @@ export const useStore = create(
           },
         })),
 
-      finalizarValidacaoDominioPrevio: (platKey, temaId, { questoes, acertos }) =>
-        set((s) => ({
-          [platKey]: {
-            ...s[platKey],
-            temas: s[platKey].temas.map((t) => {
-              if (t.id !== temaId) return t;
-              const resultado = calcularDominioPrevio({ total: questoes, acertos });
-              const registro = criarRegistroDominio(questoes, acertos);
-              const novoRev = buildRevComDominio(
-                t.d0,
-                t.esp,
-                t.importancia,
-                registro.classificacao,
-                registro.pctAcerto
-              );
-              return {
-                ...t,
-                dominio: registro,
-                dominioPrevio: finalizarValidacaoDominioPrevio({ total: questoes, acertos }),
-                rev: resultado.valido ? (novoRev ?? t.rev) : t.rev,
-              };
-            }),
-          },
-        })),
+      finalizarValidacaoDominioPrevio: (platKey, temaId, { questoes, acertos }) => {
+        set((s) => {
+          const temasAtualizados = s[platKey].temas.map((t) => {
+            if (t.id !== temaId) return t;
+            return applyDominioPrevioToTema(t, { questoes, acertos });
+          });
+          return {
+            [platKey]: {
+              ...s[platKey],
+              temas: temasAtualizados,
+            },
+          };
+        });
+        const rebuild = get().rebuildActionInboxForToday;
+        if (typeof rebuild === "function") rebuild();
+      },
 
       cancelarValidacaoDominioPrevio: (platKey, temaId) =>
         set((s) => ({
@@ -1210,7 +1199,7 @@ export const useStore = create(
           undoStack: [],
           userName: "Estudante",
           userEmail: "",
-          meta: { dataProva: "2026-09-13", acerto: 85, retencaoFSRS: 0.90, maxRevisoesDia: 30, tempoDisponivel: 2, intervaloMaxDias: 180, pausadoAte: null, isRetornoAcolhedor: false, lastActiveDate: null, provasAlvo: ["ENAMED"], isSegundaTentativa: false, areaPuxouBaixo: "", notasTentativaAnterior: {}, acertosAlvo: 0, totalQuestoesAlvo: 100, notaCorteAlvo: 0, streakFreezeAvailable: true, streakFreezeUsed: false, tomMentor: "gentil", estrategiaRefinada: false, metaQuestoesDia: 0, metaQuestoesTotal: 0, volumePorAreaModo: "fraqueza", mentorLog: [], ferramentas: { questoes: "MedEvo", flashcards: "Anki" }, metodoProgresso: {}, dicasVistas: [], notif: { enabled: false, hora: "08:00" }, prontidaoHist: [], ativacaoDispensada: false, trilhaDispensada: false, trilhaXpDados: {}, streakMaxAvisado: false, lastFocusSessionAt: null, lastReflectionAt: null, peakModePhase: "base", ankiAdesao: { datas: [] }, modulos: { raciocinioClinico: false }, onboarding: getOnboardingDefaults(), temasPerWeek: 6, estrategiaStartDate: null },
+          meta: { dataProva: "2026-09-13", acerto: 85, retencaoFSRS: 0.90, maxRevisoesDia: 30, tempoDisponivel: 2, intervaloMaxDias: 180, pausadoAte: null, isRetornoAcolhedor: false, lastActiveDate: null, provasAlvo: ["ENAMED"], isSegundaTentativa: false, areaPuxouBaixo: "", notasTentativaAnterior: {}, acertosAlvo: 0, totalQuestoesAlvo: 100, notaCorteAlvo: 0, streakFreezeAvailable: true, streakFreezeUsed: false, tomMentor: "gentil", estrategiaRefinada: false, metaQuestoesDia: 0, metaQuestoesTotal: 0, volumePorAreaModo: "fraqueza", mentorLog: [], ferramentas: { questoes: "MedEvo", flashcards: "Anki" }, metodoProgresso: {}, dicasVistas: [], notif: { enabled: false, hora: "08:00" }, prontidaoHist: [], ativacaoDispensada: false, trilhaDispensada: false, trilhaXpDados: {}, streakMaxAvisado: false, lastFocusSessionAt: null, lastReflectionAt: null, peakModePhase: "base", ankiAdesao: { datas: [] }, modulos: { raciocinioClinico: false }, onboarding: getOnboardingDefaults(), vestibularStart: { completed: false, targetExam: null, examDate: null, baselineMode: null, planMode: "mentor", completedAt: null }, temasPerWeek: 6, estrategiaStartDate: null },
           onboardingDone: false,
           sprint: { esps: [], ativa: false, semana: "" },
           focusMode: false,
diff --git a/src/hooks/useMetrics.js b/src/hooks/useMetrics.js
index f29b5ddb..ebac3949 100644
--- a/src/hooks/useMetrics.js
+++ b/src/hooks/useMetrics.js
@@ -5,6 +5,7 @@ import { useMemo } from "react";
 import { STEPS, IMPORTANCIA, todayStr, diffDays, addDays } from "../core/fsrs";
 import { getAreaWeight, findHotnessSubarea, BONUS_RETORNO_RAPIDO } from "../core/provasStats";
 import { useStore } from "../core/store";
+import { getDominioPrevioStatus, getNextReviewForTema } from "../core/domainValidation";
 
 // ─── VESTIBULAR WEIGHTS & SCORE ──────────────────────────────────────────────
 
@@ -82,10 +83,11 @@ export function calcFilaInteligente(temas, plat, meta) {
     let sumAcertos = 0;
     let doneStepsCount = 0;
     
-    for (let j = 0; j < STEPS.length; j++) {
-      const stepKey = STEPS[j].key;
+    const stepKeys = Array.from(new Set([...STEPS.map((step) => step.key), "d14"]));
+    for (let j = 0; j < stepKeys.length; j++) {
+      const stepKey = stepKeys[j];
       const r = rev[stepKey];
-      if (r && r.done && r.acerto != null) {
+      if (r && r.done && !r.skipped && r.skipReason !== "dominio_previo" && !r.skippeadoPorDominio && r.acerto != null) {
         sumAcertos += r.acerto;
         doneStepsCount++;
       }
@@ -95,10 +97,15 @@ export function calcFilaInteligente(temas, plat, meta) {
     const imp = t.importancia || "ALTA";
     const pesoImp = IMPORTANCIA[imp]?.peso || 2.0;
     
-    for (let j = 0; j < STEPS.length; j++) {
-      const s = STEPS[j];
+    const isDominioPrevio = getDominioPrevioStatus(t).isValidated;
+    const nextReview = isDominioPrevio ? getNextReviewForTema(t, today) : null;
+    const queueSteps = isDominioPrevio && nextReview
+      ? [{ key: nextReview.stepKey, label: nextReview.label, offset: 0, desc: nextReview.label, checkbox: false }]
+      : STEPS;
+    for (let j = 0; j < queueSteps.length; j++) {
+      const s = queueSteps[j];
       const r = rev[s.key];
-      if (!r || r.done) continue;
+      if (!r || r.done || r.skipped || r.skipReason === "dominio_previo" || r.skippeadoPorDominio) continue;
       
       const rDate = r.date;
       if (!rDate) continue;

```

## Untracked file contents


### MEDREV_HOTFIX_JA_DOMINO_D7_D14_FILA.md

```txt
# MEDREV — HOTFIX P1: “Já domino” agenda D7/D14 de verdade e corrige fila/progresso

> **Prioridade:** P0/P1 de UX e confiança  
> **Executor recomendado:** GPT-5.5 / High ou Sonnet High  
> **Objetivo:** corrigir o fluxo de “Já domino” para que ele altere o estado real do tema, mostre a revisão correta na UI e entre corretamente na fila como D7 ou D14, nunca como D1.

---

## 0. Diagnóstico do bug observado

Após registrar “Já domino”, o card muda para:

```txt
STATUS: VALIDADO PREVIAMENTE
Próxima revisão: D14 em 2026-06-16
```

Mas a parte inferior e a fila ainda mostram:

```txt
RO: D1
```

Além disso, vários temas validados ficam com o mesmo cálculo visual/progresso, como se o fluxo estivesse usando um valor default.

Isso indica que o app está fazendo uma destas coisas:

```txt
1. Usa internamente `rev.d1` para armazenar a primeira revisão pós-validação.
2. A UI lê `stepKey === "d1"` e renderiza “D1”, ignorando `dominioPrevio.primeiraRevisao`.
3. A fila inteligente usa o step real (`d1`) em vez do label semântico (`D7` ou `D14`).
4. O progresso/acerto do card usa fallback fixo, provavelmente 50%, em vez do acerto validado.
5. O tema sai visualmente de “não iniciado”, mas a semântica da revisão continua errada.
```

Esse bug quebra confiança: o usuário vê “D14” no status e “D1” na fila/card.

---

## 1. Regra de produto

“Já domino” é **validação de domínio prévio**, não revisão D1.

Depois de validar:

```txt
15+ questões e 80–89% → primeira revisão deve aparecer como D7.
15+ questões e >=90% → primeira revisão deve aparecer como D14.
<15 questões ou <80% → não valida; iniciar D0 normal.
```

O app nunca deve mostrar “RO: D1” para um tema validado previamente cuja primeira revisão é D7 ou D14.

---

## 2. Regra técnica obrigatória

Separar:

```txt
stepKey interno
label semântico exibido ao usuário
data real da próxima revisão
```

Criar helpers canônicos para evitar cada componente calcular de um jeito.

---

## 3. Criar/ajustar helper canônico

Criar ou ajustar em:

```txt
src/core/domainValidation.js
```

ou arquivo equivalente:

```js
export function getDominioPrevioStatus(tema) {}

export function getNextReviewForTema(tema, today = todayStr()) {}

export function getReviewDisplayLabel(tema, stepKey) {}

export function getReviewDisplayMeta(tema, stepKey) {}
```

### 3.1 `getDominioPrevioStatus(tema)`

Retorna:

```js
{
  isValidated: true,
  acerto: 0.92,
  questoes: 15,
  validatedAt: "YYYY-MM-DD",
  firstReviewLabel: "D14",
  firstReviewDate: "YYYY-MM-DD",
}
```

ou:

```js
{ isValidated: false }
```

### 3.2 `getNextReviewForTema(tema)`

Deve retornar a próxima revisão com semântica correta:

```js
{
  stepKey: "d14", // se existir
  label: "D14",
  date: "YYYY-MM-DD",
  source: "dominio_previo",
}
```

ou:

```js
{
  stepKey: "d7",
  label: "D7",
  date: "YYYY-MM-DD",
  source: "dominio_previo",
}
```

Não retornar `label: "D1"` para tema validado.

### 3.3 `getReviewDisplayLabel(tema, stepKey)`

Se tema tem `dominioPrevio.validado === true`, e aquele step é a primeira revisão de domínio prévio, retornar:

```txt
D7
```

ou:

```txt
D14
```

Mesmo que a arquitetura antiga ainda use outro `stepKey` internamente temporariamente.

---

## 4. Implementação recomendada — opção robusta

Evitar usar `d1` como contêiner de D7/D14.

### 4.1 Para 80–89%

Ao validar:

```txt
d0 = validação prévia concluída
d1 = skipped por domínio prévio
d4 = skipped por domínio prévio
d7 = primeira revisão real, date = hoje + 7
d21 = futuro, recalculado depois do d7
```

Estado esperado:

```js
tema.dominioPrevio = {
  validado: true,
  questoes,
  acerto,
  validatedAt,
  primeiraRevisao: "d7",
  primeiraRevisaoLabel: "D7",
  primeiraRevisaoDate,
  source: "ja_domino",
};

tema.rev.d0 = {
  done: true,
  source: "dominio_previo",
  reviewedAt: today,
  acerto,
  questoes,
};

tema.rev.d1 = {
  ...tema.rev.d1,
  done: true,
  skipped: true,
  skipReason: "dominio_previo",
};

tema.rev.d4 = {
  ...tema.rev.d4,
  done: true,
  skipped: true,
  skipReason: "dominio_previo",
};

tema.rev.d7 = {
  ...tema.rev.d7,
  done: false,
  date: addDays(today, 7),
  scheduledAt: addDays(today, 7),
  source: "dominio_previo",
};
```

### 4.2 Para >=90%

Preferência: criar suporte opcional a `d14`.

```js
tema.rev.d14 = {
  done: false,
  date: addDays(today, 14),
  scheduledAt: addDays(today, 14),
  source: "dominio_previo",
  S: 14,
  D: tema.rev?.d0?.D ?? defaultD,
};
```

E marcar D1/D4/D7 como pulados:

```js
d1.skipped = true
d4.skipped = true
d7.skipped = true
```

O próximo item deve ser:

```txt
D14
```

Nunca D1.

Se adicionar `d14` for muito invasivo, é aceitável usar internamente outro step por compatibilidade, mas a fila e a UI devem usar `getNextReviewForTema` e mostrar label D14. O ideal, porém, é suportar `d14` explicitamente.

---

## 5. Corrigir todos os consumidores

Auditar com:

```bash
git grep -n "RO:\|D1\|d1\|nextReview\|proximaRevisao\|próxima revisão\|dominioPrevio\|validado_previo" -- src
```

Corrigir:

```txt
src/components/Cronograma.jsx
src/components/Dashboard.jsx
src/components/FocusMode.jsx
src/core/fsrs.js
src/core/store.js
src/core/useMetrics.js
src/core/mentorSignals.js
src/core/mentorDecisionPolicy.js
src/core/domainValidation.js
```

Qualquer lugar que mostre:

```txt
RO: D1
```

deve passar pelo helper:

```js
getReviewDisplayMeta(tema, stepKey)
```

---

## 6. Corrigir cálculo visual/progresso

O card validado previamente não pode usar fallback fixo.

Para tema validado:

```txt
Mostrar acerto da validação: 85%, 92%, etc.
Mostrar status: Validado previamente.
Mostrar próxima revisão real: D7/D14.
Não mostrar vermelho fixo 50% se não corresponde ao acerto real.
```

Regra:

```js
if (tema.dominioPrevio?.validado) {
  displayAccuracy = tema.dominioPrevio.acerto;
  displayStatus = "Validado previamente";
  nextReview = getNextReviewForTema(tema);
}
```

Se o sparkline não tiver dados reais suficientes:

```txt
mostrar “Aguardando primeira revisão”
```

em vez de gráfico vermelho genérico.

---

## 7. Corrigir fila inteligente

A fila deve usar o helper canônico.

Se `getNextReviewForTema(tema)` retornar D14, a fila deve mostrar:

```txt
RO: D14
```

Se retornar D7:

```txt
RO: D7
```

Não usar `Object.keys(rev).find(...)` sem filtrar skips e sem display label.

Ignorar etapas:

```js
step.skipped === true
```

na fila de revisão.

---

## 8. Corrigir Mentor

Mentor não deve recomendar:

```txt
Fazer D1
```

para tema validado previamente se a próxima revisão é D7/D14.

`mentorSignals` deve usar:

```js
getNextReviewForTema(tema)
```

para montar target e label.

---

## 9. Copy PT-BR

Corrigir textos visíveis:

```txt
STATUS: VALIDADO PREVIAMENTE → Status: validado previamente
Próxima revisão: D14 em 2026-06-16 → Próxima revisão: D14 em 16/06
Use “Revisar” quando vencer ou abra no plano para ajustar. → Quando vencer, use “Revisar” ou ajuste no Plano.
```

Preferir:

```txt
Validado previamente
Próxima revisão: D14 · 16/06
Aguardando primeira revisão
```

Evitar caixa alta gritada.

---

## 10. Testes obrigatórios

Criar/ajustar:

```txt
src/core/domainValidation.test.js
src/core/fsrs.test.js
src/core/mentorSignals.test.js
```

### 10.1 Domínio prévio

```js
test("80 to 89 percent schedules D7 and never D1")
test("90 percent or more schedules D14 and never D1")
test("validated topic skips d1 and d4")
test("validated high-confidence topic skips d1, d4 and d7 when d14 exists")
test("getNextReviewForTema returns D7 for 85 percent")
test("getNextReviewForTema returns D14 for 92 percent")
test("getReviewDisplayLabel never returns D1 for validated previous domain")
```

### 10.2 UI/metrics core

```js
test("validated topic display accuracy uses dominioPrevio.acerto")
test("validated topic without review history shows awaiting first review")
test("skipped steps are ignored by queue")
```

### 10.3 Mentor

```js
test("mentor signal labels validated previous domain as D7 or D14")
test("mentor does not recommend D1 for validated previous domain")
```

---

## 11. QA manual obrigatório

### Caso 1 — 15 questões, 85%

```txt
1. Criar tema novo.
2. Clicar Já domino.
3. Registrar 15 questões e 85%.
4. Card deve mostrar:
   Validado previamente
   Próxima revisão: D7
5. Rodapé/card/fila NÃO pode mostrar RO: D1.
6. Fila deve mostrar D7 quando vencer.
```

### Caso 2 — 15 questões, 92%

```txt
1. Criar tema novo.
2. Clicar Já domino.
3. Registrar 15 questões e 92%.
4. Card deve mostrar:
   Validado previamente
   Próxima revisão: D14
5. Rodapé/card/fila NÃO pode mostrar RO: D1.
6. Fila deve mostrar D14 quando vencer.
```

### Caso 3 — 10 questões, 95%

```txt
Não valida.
Tema continua com Iniciar ciclo hoje.
```

### Caso 4 — 15 questões, 70%

```txt
Não valida.
Tema continua com Iniciar ciclo hoje.
```

---

## 12. Comandos

Antes:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Depois:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
npm run audit:full
```

---

## 13. Critério de aceite

A correção está pronta se:

```txt
Já domino 85% agenda e mostra D7.
Já domino 92% agenda e mostra D14.
Nenhum tema validado mostra RO: D1.
Steps skipped não entram na fila.
Card usa acerto real da validação.
Sparkline não usa 50% fake.
Mentor não recomenda D1 para tema validado.
Copy está em PT-BR natural.
check:mojibake passa.
testes passam.
build passa.
```

---

## 14. Prompt curto para executor

```txt
Execute somente o hotfix do fluxo “Já domino” descrito neste arquivo.

Bug:
Após validar “Já domino”, o card mostra “Próxima revisão: D14”, mas a fila/rodapé mostra “RO: D1” e o progresso fica com cálculo fixo. Corrija a semântica end-to-end.

Objetivo:
“Já domino” 80–89% deve agendar e exibir D7.
“Já domino” >=90% deve agendar e exibir D14.
Nunca mostrar D1 para tema validado previamente.
Ignorar steps skipped na fila.
Usar acerto real da validação no card.
Não usar gráfico 50% fake.

Não implementar P2/P3/P4.
Não mexer em Firebase/Auth/localStorage.
Não criar Activity Log.
Não refatorar Mentor inteiro.
Não instalar libs.
Não fazer commit/deploy/push.

Rode check:mojibake, testes, build e audit:full.
```

```

### MEDREV_P1_HOTFIX_JA_DOMINO_COPY_VESTIBULAR.md

```txt
# MEDREV — P1-HOTFIX: “Já domino” funcional, Português consistente e Trilha inicial do Vestibular

> **Executor recomendado:** `gpt-5.3-codex` ou Sonnet  
> **Reasoning effort:** `high`  
> **Modo:** agent com aprovação manual  
> **Prioridade:** antes de P2/P3/P4  
> **Objetivo:** corrigir três falhas de experiência que quebram confiança do usuário:  
> 1. “Já domino” não altera nada visível após registro;  
> 2. textos/português ruins nas implementações;  
> 3. Vestibular não tem trilha clara de início.

---

## 0. Por que este hotfix vem antes do P2/P3/P4

A auditoria P2/P3/P4 confirmou problemas estruturais em Stats, Erros e Raciocínio Clínico, mas estes três problemas são mais urgentes para uso real:

```txt
Usuário clica “Já domino” e nada muda → perde confiança.
Usuário vê português ruim → produto parece amador.
Usuário de Vestibular entra e não sabe começar → abandona antes de usar.
```

Portanto:

```txt
P1-HOTFIX → P2 Stats → P3 Erros → P4 Raciocínio
```

Não continuar com Stats/Erros/Raciocínio antes de corrigir estes fluxos de entrada e confiança.

---

## 1. Regras inegociáveis

Antes de editar:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Durante:

```txt
Não instalar libs.
Não mexer em Firebase/Auth/localStorage.
Não criar Activity Log.
Não refatorar Stats inteiro.
Não refatorar Mentor inteiro.
Não remover features.
Não fazer commit/deploy/push.
Não listar workspace inteiro.
Não usar ls -R, dir /s, tree, find . ou Get-ChildItem -Recurse.
Manter UTF-8 sem BOM.
Não introduzir mojibake.
```

Usar comandos escopados:

```bash
git grep -n "Já domino\|Ja domino\|dominio\|domínio\|validacao\|validação\|buildRevComDominio\|DOMINIO_PREVIO" -- src
git grep -n "vest\|Vestibular\|simulado\|trilha\|onboarding\|primeiro acesso\|modo mentor" -- src
git grep -n "Prontidão\|prontidao\|True Retention\|coletando\|Analise\|Acao\|Nao\|Voce\|Faca\|calendario" -- src
git grep -n "unstarted\|buildRev\|markStep\|addTema\|updateTema\|saveTema" -- src/core src/components
```

---

# PARTE A — Corrigir “Já domino” end-to-end

## 2. Diagnóstico provável

O usuário registra “Já domino”, mas nada muda visualmente ou funcionalmente.

Causas prováveis:

```txt
1. validação calcula resultado, mas não grava no tema correto;
2. tema continua `unstarted: true`;
3. `rev` não é substituído por `buildRevComDominio`;
4. datas D7/D14 são criadas, mas UI ainda mostra card antigo;
5. store não chama save/update persistente;
6. modal fecha sem toast/feedback;
7. “Já domino” cria tema temporário, mas não vincula ao tema do cronograma;
8. acerto está em 0–1 em um lugar e 0–100 em outro;
9. o cronograma importado/tema provider não tem `temaId` real;
10. Mentor/Fila não enxerga a primeira revisão gerada.
```

## 3. Comportamento esperado do produto

Quando o aluno clica em **Já domino**:

### 3.1 Antes da validação

Mostrar explicação:

```txt
Use se você já estudou este tema antes.
Você fará uma validação curta. Se for bem, o app pula a exposição inicial e agenda uma revisão.
```

Critério:

```txt
mínimo 15 questões
mínimo 80% de acerto
```

### 3.2 Se não validar

Se:

```txt
questões < 15
ou acerto < 80%
```

Resultado:

```txt
não marcar como dominado
manter/iniciar D0 normal
mostrar orientação:
“Melhor iniciar pelo estudo guiado. Este tema ainda não está seguro para pular a exposição inicial.”
```

### 3.3 Se validar 80–89%

Resultado:

```txt
status: validado_previo
unstarted: false
d0.done: true como validação prévia
primeira revisão: D7
não contar como domínio definitivo
não inflar streak
mostrar card:
“Validado. Próxima revisão em D7.”
```

### 3.4 Se validar >=90%

Resultado:

```txt
status: validado_previo
unstarted: false
d0.done: true como validação prévia
primeira revisão: D14
não contar como domínio definitivo
mostrar card:
“Validado com alta segurança. Próxima revisão em D14.”
```

---

## 4. Arquivos prováveis

Auditar e corrigir:

```txt
src/core/domainValidation.js
src/core/store.js
src/core/fsrs.js
src/components/Cronograma.jsx
src/components/Dashboard.jsx
src/components/FocusMode.jsx
src/components/Modals.jsx
src/components/DomainValidationModal.jsx   [se existir]
src/core/domainValidation.test.js           [criar/ajustar]
```

---

## 5. Contrato de dados esperado

Ao validar domínio prévio, o tema deve ficar assim:

```js
{
  id,
  nome,
  esp,
  unstarted: false,
  status: "validado_previo",
  dominioPrevio: {
    validado: true,
    questoes: 15,
    acerto: 0.86,
    validatedAt: "YYYY-MM-DD",
    primeiraRevisao: "d7",
    source: "ja_domino"
  },
  rev: {
    d0: {
      done: true,
      reviewedAt: "YYYY-MM-DD",
      scheduledAt: "YYYY-MM-DD",
      acerto: 0.86,
      questoes: 15,
      source: "dominio_previo"
    },
    d1: {
      done: false,
      date: "YYYY-MM-DD", // D7 ou D14, conforme regra existente
      scheduledAt: "YYYY-MM-DD"
    },
    reviewHistory: [
      {
        stepKey: "d0",
        source: "dominio_previo",
        rating: "good" | "easy",
        acerto: 0.86,
        questoes: 15,
        official: true
      }
    ]
  }
}
```

Se a arquitetura atual usa `buildRevComDominio`, manter compatibilidade, mas garantir que a UI enxergue:

```txt
unstarted: false
próxima revisão visível
histórico mínimo
toast de sucesso
```

---

## 6. Correções obrigatórias

### 6.1 Criar função única de aplicação

Criar/ajustar no core:

```js
export function applyDominioPrevioToTema(tema, resultado, options = {}) {}
```

Ela deve:

```txt
validar questão/acerto;
normalizar acerto 0–1;
criar ou atualizar `rev`;
setar `unstarted: false`;
setar `status: validado_previo`;
registrar `dominioPrevio`;
registrar reviewHistory;
retornar tema atualizado.
```

### 6.2 Store deve usar essa função

No store, criar/ajustar action:

```js
registrarDominioPrevio(plat, temaId, resultado)
```

ou adaptar existente.

Ela deve:

```txt
encontrar tema real por id;
aplicar applyDominioPrevioToTema;
substituir tema no array;
persistir;
rebuildActionInboxForToday se existir;
mostrar toast/evento se mecanismo existir.
```

### 6.3 Tema de provider/importado

Se “Já domino” for clicado em tema ainda não materializado no banco:

```txt
1. criar tema real;
2. aplicar domínio prévio nele;
3. vincular providerTopicId/origem;
4. atualizar UI do cronograma.
```

Não registrar em objeto temporário sem persistir.

### 6.4 UI feedback obrigatório

Após sucesso:

```txt
Tema validado.
Próxima revisão: D7 em DD/MM.
```

ou:

```txt
Tema validado com alta segurança.
Próxima revisão: D14 em DD/MM.
```

Após falha:

```txt
Validação insuficiente.
Comece pelo estudo guiado para proteger sua base.
```

### 6.5 Card deve mudar

O card não pode continuar igual.

Depois de validar, ele deve mostrar:

```txt
Status: Validado previamente
Próxima revisão: D7/D14
Botão: Fazer revisão quando vencer / Ver no plano
```

---

## 7. Testes obrigatórios de “Já domino”

Criar/ajustar:

```txt
src/core/domainValidation.test.js
```

Cobrir:

```js
test("rejects dominio previo with fewer than 15 questions")
test("rejects dominio previo below 80 percent")
test("80 to 89 percent schedules first review at D7")
test("90 percent or more schedules first review at D14")
test("validated topic is no longer unstarted")
test("validated topic receives dominioPrevio metadata")
test("validated topic receives reviewHistory event")
test("acerto can be input as 85 or 0.85")
test("does not mark as mastered/dominado definitivo")
```

Se houver store tests:

```js
test("registrarDominioPrevio updates the real topic in store")
test("registrarDominioPrevio works for provider/imported topic")
```

---

# PARTE B — Corrigir português e copy do produto

## 8. Problema

As implementações estão com português ruim, sem acento, termos mistos e inconsistência de linguagem.

Isso destrói confiança.

Exemplos a procurar:

```txt
Analise → Análise
Acao → Ação
Nao → Não
Voce → Você
Faca → Faça
calendario → calendário
validacao → validação
dominio → domínio
Prontidão → Preparo estimado
True Retention → Retenção longa
Modo Simples → Modo Mentor
Crono → Plano
Dashboard → Hoje
```

## 9. Criar glossário central

Criar:

```txt
src/core/copy.js
src/core/copy.test.js
docs/COPY_GUIDE_PT_BR.md
```

### 9.1 `copy.js`

Exportar labels principais:

```js
export const COPY = {
  views: {
    dash: "Hoje",
    crono: "Plano",
    sims: "Estudar",
    stats: "Estatísticas",
    banco: "Banco",
    more: "Mais",
  },
  metrics: {
    readiness: "Preparo estimado",
    trueRetention: "Retenção longa",
    workload: "Carga de hoje",
  },
  actions: {
    startNow: "Começar agora",
    seeWhy: "Ver por quê",
    configurePlan: "Configurar plano",
    jaDomino: "Já domino",
  },
};
```

### 9.2 `COPY_GUIDE_PT_BR.md`

Definir padrão:

```txt
Dashboard → Hoje
Cronograma → Plano
Simulados → Estudar quando for navegação
Prontidão → Preparo estimado
True Retention → Retenção longa
Modo Simples → Modo Mentor
Coletando D21+ → Coletando revisões longas
```

## 10. Correção por busca

Corrigir textos visíveis em:

```txt
src/components
src/core se retorna copy para UI
```

Não mexer em IDs internos se quebrar compatibilidade.

Exemplo:

```txt
view key: "dash" permanece
label: "Hoje"
```

## 11. Teste simples de copy

Criar teste que bloqueia strings ruins visíveis mais comuns:

```js
const FORBIDDEN_VISIBLE_COPY = [
  "Prontidão",
  "True Retention",
  "Modo Simples",
  "Analise ",
  "Acao ",
  "Nao ",
  "Voce ",
  "Faca ",
  "calendario",
  "validacao",
  "dominio",
];
```

Aplicar apenas em arquivos de componentes, evitando falso positivo em docs/fixtures se necessário.

---

# PARTE C — Trilha inicial do Vestibular

## 12. Problema

Vestibular não tem trilha clara de início.

O aluno entra e não sabe:

```txt
1. qual prova escolher;
2. como montar plano;
3. se precisa fazer simulado;
4. o que estudar primeiro;
5. como o Mentor decide;
6. como o FSRS entra.
```

P1-A organiza navegação, mas Vestibular precisa de **first-run journey**.

---

## 13. Resultado esperado para Vestibular

Ao entrar pela primeira vez em `plat === "vest"`:

```txt
1. Escolher prova-alvo
2. Definir data ou janela da prova
3. Escolher trilha inicial
4. Fazer ou registrar simulado diagnóstico
5. Gerar plano inicial
6. Receber primeira ação do Mentor
```

---

## 14. Criar trilha de início

Criar/ajustar:

```txt
src/core/vestibularOnboarding.js
src/core/vestibularOnboarding.test.js
src/components/VestibularStartTrail.jsx
```

Não criar nova persistência complexa antes do Bloco N. Usar `meta` existente se já persistido.

## 15. Estado mínimo

Em `meta` ou `state.vest.meta`, conforme arquitetura atual:

```js
vestibularStart: {
  completed: false,
  targetExam: null, // "ENEM" | "Fuvest" | "Unicamp" | "Outro"
  examDate: null,
  baselineMode: null, // "simulado" | "sem_simulado"
  planMode: null, // "mentor" | "manual"
  completedAt: null,
}
```

Se já houver onboarding geral, integrar sem duplicar.

---

## 16. Fluxo de UI

### Passo 1 — Prova-alvo

```txt
Qual prova você quer priorizar?

[ENEM]
[Fuvest]
[Unicamp]
[Outra]
```

### Passo 2 — Data

```txt
Quando é a prova ou quando você quer estar pronto?

[Selecionar data]
[Não sei ainda]
```

### Passo 3 — Diagnóstico

```txt
Você já tem um simulado recente?

[Sim, quero registrar]
[Não, começar sem simulado]
```

### Passo 4 — Modo

```txt
Como quer começar?

[Modo Mentor]
O app escolhe a próxima melhor ação.

[Manual]
Eu escolho por matéria.
```

### Passo 5 — Primeira ação

Gerar:

```txt
Comece por:
- revisar matéria fraca se simulado existe;
- iniciar tema de alta prioridade se não existe;
- configurar plano se não há plano;
- fazer simulado diagnóstico se faltam dados.
```

---

## 17. Dashboard do Vestibular

Se `plat === "vest"` e `vestibularStart.completed !== true`:

Mostrar no Dashboard/Hoje:

```txt
Configure sua trilha de Vestibular
Leva 2 minutos. Isso permite que o Mentor monte sua primeira ação.
[Começar trilha]
```

Não mostrar ENAMED/Raciocínio.

---

## 18. Mentor no Vestibular

Garantir que o Mentor para Vestibular prioriza:

```txt
1. revisão vencida;
2. simulado pendente/análise de simulado;
3. matéria fraca;
4. tema novo do plano;
5. carga/sobrecarga;
6. descanso.
```

Não usar:

```txt
ENAMED
Raciocínio Clínico
Illness Script
Casos clínicos
Conduta médica
```

---

## 19. Testes obrigatórios de Vestibular

Criar:

```txt
src/core/vestibularOnboarding.test.js
```

Cobrir:

```js
test("vestibular start is incomplete by default")
test("selecting target exam stores target")
test("simulado baseline path recommends registering simulado")
test("without simulado recommends plan setup or first topic")
test("mentor mode is default")
test("clinical reasoning is never recommended for vest")
test("ENAMED is never recommended for vest")
```

Se houver navigation tests:

```js
test("vest primary nav does not include raciocinio")
test("vest dashboard shows start trail when incomplete")
```

---

# PARTE D — Ordem de implementação

Executar nesta ordem:

```txt
1. Já domino funcional
2. Português/copy central
3. Trilha inicial do Vestibular
```

Motivo:

```txt
Já domino quebrado = bug funcional.
Português ruim = perda de confiança.
Vestibular sem trilha = abandono inicial.
```

---

# PARTE E — QA manual

## 20. QA Já domino

```txt
1. Criar tema novo.
2. Clicar Já domino.
3. Registrar 10 questões, 90% → deve rejeitar por menos de 15.
4. Registrar 15 questões, 70% → deve rejeitar por acerto.
5. Registrar 15 questões, 85% → deve validar e agendar D7.
6. Registrar 15 questões, 92% → deve validar e agendar D14.
7. Card deve mudar imediatamente.
8. Reabrir app e confirmar persistência.
9. Mentor/fila deve enxergar a próxima revisão.
```

## 21. QA Português

```txt
1. Abrir Dashboard/Hoje.
2. Abrir Plano.
3. Abrir Estudar.
4. Abrir Estatísticas.
5. Abrir Mais.
6. Conferir labels principais.
7. Rodar busca por termos proibidos.
8. check:mojibake passa.
```

## 22. QA Vestibular

```txt
1. Trocar para Vestibular.
2. Dashboard mostra trilha inicial se incompleta.
3. Completar trilha.
4. Mentor gera primeira ação.
5. Não aparece ENAMED.
6. Não aparece Raciocínio Clínico.
7. Plano funciona.
8. Simulados aparecem como caminho de diagnóstico.
```

---

# PARTE F — Critérios de aceite

Aprovado se:

```txt
“Já domino” muda o estado do tema e a UI imediatamente.
“Já domino” agenda D7/D14 corretamente.
“Já domino” não marca domínio definitivo.
Tema validado sai de unstarted.
Português visível foi corrigido nas telas principais.
Glossário PT-BR existe.
Vestibular tem trilha inicial clara.
Mentor do Vestibular não recomenda medicina.
check:mojibake passa.
testes passam.
build passa.
```

---

# Prompt curto para execução

```txt
Execute o arquivo MEDREV_P1_HOTFIX_JA_DOMINO_COPY_VESTIBULAR.md.

Prioridade:
1. Corrigir “Já domino” end-to-end.
2. Corrigir português/copy visível e criar glossário PT-BR.
3. Criar trilha inicial do Vestibular.

Não implemente P2/P3/P4 agora.
Não mexa em Firebase/auth/localStorage.
Não crie Activity Log.
Não refatore Stats inteiro.
Não refatore Mentor inteiro.
Não liste workspace inteiro.
Use git grep/git ls-files.

Rode check:mojibake, testes e build.
Não faça commit, deploy ou push.
```

```

### MEDREV_P2_P3_P4_OPUS_ROADMAP.md

```txt
# MEDREV — P2/P3/P4: Roadmap de Integração UX pós-P1-A

> **Executor inicial:** Claude Code / Opus Thinking em modo planejamento  
> **Executor de implementação:** `gpt-5.3-codex` ou Sonnet, por sub-bloco  
> **Objetivo:** continuar a reorganização do MedRev depois do P1-A, atacando a experiência de “usuário entra e fica perdido”.  
> **Regra:** este arquivo é um roadmap. O Opus deve auditar e planejar antes de qualquer implementação.

---

## 0. Diagnóstico

O P1-A melhora a primeira camada da experiência:

```txt
Hoje
Plano
Estudar
Estatísticas
Banco
Mais
```

Isso reduz a sensação de “muitas abas”. Mas **não resolve sozinho** o problema principal: o usuário ainda pode ficar perdido dentro das funções se:

```txt
Stats continuar parecendo depósito de gráfico;
Mentor recomendar ação sem explicar bem;
erros não virarem ação corretiva;
raciocínio clínico continuar como aba lateral;
simulado não criar plano;
revisão não explicar por que aquele formato foi escolhido;
calendário/histórico não mostrar o que foi feito e o que vem depois.
```

Portanto, depois do P1-A, a sequência correta é:

```txt
P2 — Estatísticas + métricas com governança + explicação acionável
P3 — Centro de Erros + ações corretivas + fechamento do loop pós-sessão/prova
P4 — Raciocínio Clínico integrado ao FSRS + revisão multimodal
```

Activity Log / calendário histórico deve ficar para depois do Bloco N de multiusuário.

---

## 1. Pré-condições obrigatórias

Antes de P2/P3/P4:

```txt
1. Snapshot/commit de segurança.
2. Bloco N resolvido ou, no mínimo, não tocar em dados persistentes novos.
3. P1-A concluído ou em fase final.
4. Mentor v2 commitado/estabilizado.
5. Build/test/check:mojibake passando.
```

Rodar:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Se houver arquivos críticos untracked, parar e pedir snapshot.

---

## 2. Como o Opus Thinking deve trabalhar

Você está em modo planejamento.

Não implemente ainda.

Não edite arquivos.

Não liste o workspace inteiro.

Use apenas comandos escopados:

```bash
git status --short
git ls-files src package.json docs
git grep -n "StatsPanel\|Preparo\|Retenção\|readiness\|metric\|coletando\|AdvancedSection" -- src
git grep -n "erro\|motivoErro\|tipoErro\|errorTaxonomy\|ActionInbox\|sessionReflection" -- src
git grep -n "Raciocinio\|Raciocínio\|illness\|sct\|casosProgresso\|calcRaciocinioScore" -- src
git grep -n "mentorNextAction\|mentorTodayPlan\|mentorDecisionPolicy\|target\|explain" -- src
git grep -n "featureEnabled\|platformFeatures\|plat === \"vest\"\|plat === 'vest'" -- src
```

Criar somente:

```txt
docs/P2_P3_P4_OPUS_AUDIT_PLAN.md
```

com diagnóstico e plano em sequência.

---

# P2 — Estatísticas e Métricas Acionáveis

## Objetivo

Transformar Estatísticas de “depósito de gráficos” em **área de diagnóstico compreensível**.

## Problema

Stats mistura:

```txt
readiness
ENAMED
weekly review
data safety
launch checklist
heatmap
painéis avançados
métricas sem ação
```

O usuário não sabe:

```txt
o que significa;
se dá para confiar;
o que fazer com aquilo.
```

## Resultado esperado

Stats deve ser organizada em seções:

```txt
1. Resumo
2. Aprendizagem
3. Erros
4. Provas/Simulados
5. Raciocínio Clínico
6. Atividade
7. Sistema
```

## Entregáveis P2

```txt
src/core/metricsRegistry.js
src/core/metricsRegistry.test.js
src/components/StatsPanel.jsx
docs/P2_STATS_DECISIONS.md
```

## Métricas mínimas no registry

```txt
retencaoLonga
cargaHoje
revisoesVencidas
relearningAberto
coberturaCronograma
acertoSimulado
erroDominante
calibracaoConfianca
raciocinioScore
adesaoAnki
```

Cada métrica deve ter:

```js
{
  id,
  label,
  description,
  emptyState,
  confidenceRule,
  actionWhenLow,
  dashboardLevel,
  statsSection,
  platforms,
}
```

## Regra de UX

Toda métrica deve responder:

```txt
O que mede?
Dá para confiar?
O que faço se estiver ruim?
```

Se não responder, não entra no topo.

---

# P3 — Centro de Erros e Ações Corretivas

## Objetivo

Fechar o loop:

```txt
errei → classifiquei → entendi → recebi ação corretiva → Mentor usa → FSRS/Plano agenda
```

## Problema

Hoje o sistema registra `motivosErro`, `tipoErro` e reflexões, mas o usuário não tem uma tela clara para entender:

```txt
errei por conteúdo?
memória?
raciocínio?
interpretação?
tempo?
conduta?
confiança?
o que faço agora?
```

## Entregáveis P3

```txt
src/core/errorActionMap.js
src/core/errorActionMap.test.js
src/components/ErrorActionCenter.jsx
src/components/ErrorActionPrompt.jsx
docs/P3_ERROR_ACTION_DECISIONS.md
```

## Taxonomia mínima

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

## Mapa ação corretiva

Exemplos:

```txt
conteudo → revisão curta + questões externas
memoria → FSRS/Anki
raciocinio → mini caso + problem representation
diferencial → listar 3 diferenciais + must-not-miss
conduta_prescricao → management station educacional
tempo → bloco cronometrado
confianca_mal_calibrada → estimativa prévia + revisão calibrada
```

## Integrações

P3 deve integrar com:

```txt
FocusMode
EnamedProvaAnalyzer
sessionReflection
ActionInbox
Mentor
Stats
```

## Regra

Não criar Centro de Erros como mais uma aba solta. Ele deve aparecer:

```txt
em Stats → seção Erros;
em Mais → como ferramenta;
no pós-sessão → CTA;
no pós-simulado → CTA;
no Mentor → ação corretiva.
```

---

# P4 — Raciocínio Clínico integrado ao FSRS

## Objetivo

Transformar Raciocínio Clínico de módulo lateral em **modo de revisão quando fizer sentido**.

## Problema

Hoje o raciocínio clínico existe, mas não fecha o loop com o tema pai e o FSRS. A auditoria identificou:

```txt
calcRaciocinioScore triplicado;
clinicalCaseMatch ausente;
reviewTaskPlanner ausente;
brain dump genérico;
conduta/prescrição simulada ausente;
casos insuficientes.
```

## Entregáveis P4

```txt
src/core/reviewTaskPlanner.js
src/core/reviewTaskPlanner.test.js
src/core/clinicalReasoningScoring.js
src/core/clinicalReasoningScoring.test.js
src/components/RaciocinioClinico.jsx
src/components/FocusMode.jsx
docs/P4_CLINICAL_REASONING_FSRS_DECISIONS.md
```

## Dois modos

### Modo 1 — Caso completo

```txt
1. Vinheta
2. Problem representation
3. Hipóteses + must-not-miss
4. Illness script de memória
5. SCT / nova informação
6. Conduta e prescrição simulada
7. Feedback + reencontro
```

### Modo 2 — Revisão FSRS multimodal

```txt
D1  → Brain dump estruturado
D4  → Illness Script recall
D7  → Mini caso + diferenciais
D21 → SCT curto + conduta
Manutenção → Caso rápido / prescrição simulada
```

## Brain dump estruturado

Para temas grandes:

```txt
1. Definição / quadro geral
2. Diagnóstico
3. Diferenciais
4. Conduta
5. Não pode perder
```

## Conduta/prescrição simulada

Campos:

```txt
estabilização
exames iniciais
tratamento inicial
medicações/classes/doses quando houver checklist
internação ou ambulatório
red flags
contraindicações
seguimento
```

Aviso obrigatório:

```txt
Uso educacional. Não aplicar em paciente real.
```

## Regra de plataforma

P4 é apenas Residência.

Para Vestibular:

```txt
não renderizar Raciocínio Clínico;
não usar illness script;
não usar casos clínicos;
não usar conduta médica.
```

---

## 3. Ordem de execução recomendada

```txt
P2-A — metricsRegistry + reorganização leve de Stats
P2-B — Stats com seções e explicações
P3-A — errorActionMap
P3-B — ErrorActionCenter integrado ao pós-sessão/prova
P4-A — unificar calcRaciocinioScore
P4-B — reviewTaskPlanner
P4-C — FocusMode multimodal
P4-D — Raciocínio Clínico com conduta/prescrição simulada
```

Não executar tudo junto.

---

## 4. Critério de aceite global

P2/P3/P4 aprovados se:

```txt
Stats explica métricas e ações;
Erro vira ação corretiva;
Mentor usa erro dominante;
Raciocínio Clínico entra no FSRS quando apropriado;
Dashboard não ganha mais cards soltos;
Vestibular não recebe medicina indevida;
Build/test/mojibake passam;
Usuário novo entende o que fazer.
```

---

## 5. Prompt para Opus Thinking

```txt
Aja como engenheiro de software sênior, designer de produto sênior e pesquisador em ciência da aprendizagem médica.

Você está em modo planejamento. Não implemente nada.

Use o arquivo MEDREV_P2_P3_P4_OPUS_ROADMAP.md como fonte de verdade.

Audite o código real com git grep/git ls-files, sem listar o workspace inteiro.

Objetivo: criar docs/P2_P3_P4_OPUS_AUDIT_PLAN.md com:
1. diagnóstico do estado atual de Stats, Erros e Raciocínio Clínico;
2. riscos de integração;
3. plano P2, P3 e P4 em sequência;
4. arquivos a tocar em cada fase;
5. testes necessários;
6. critérios de aceite;
7. o que NÃO implementar agora.

Não faça commit, deploy ou push.
Não instale libs.
Não edite arquivos de implementação.
```

```

### MEDREV_P2_P3_P4_REVISADO_PELA_AUDITORIA.md

```txt
# MEDREV — P2/P3/P4 REVISADO PELA AUDITORIA OPUS

> **Fonte base:** `P2_P3_P4_OPUS_AUDIT_PLAN.md`  
> **Executor de implementação:** `gpt-5.3-codex` ou Sonnet  
> **Reasoning effort:** `high`; usar `xhigh` apenas se mexer em Store + Mentor + Stats + FocusMode no mesmo bloco  
> **Regra:** não executar tudo de uma vez. Implementar em sub-blocos pequenos, com testes entre cada etapa.  
> **Prioridade atual:** rodar antes apenas o hotfix de “Já domino”, português/copy e trilha inicial do Vestibular.

---

## 0. Decisão após auditoria

A auditoria mudou o plano original.

O plano antigo dizia:

```txt
P2 — Estatísticas
P3 — Centro de Erros
P4 — Raciocínio Clínico
```

Isso continua correto, mas agora sabemos os problemas reais:

```txt
1. StatsPanel é um depósito vertical de componentes, sem seções claras.
2. Existem três taxonomias de erro divergentes.
3. calcRaciocinioScore está triplicado e inconsistente.
4. Mentor não consome erro dominante.
5. Raciocínio Clínico não conversa com o FSRS.
6. Não existe metricsRegistry, errorActionMap nem reviewTaskPlanner.
7. Vestibular está bem gateado hoje, mas qualquer feature nova pode vazar medicina se não usar featureEnabled.
```

Portanto, o plano revisado é:

```txt
P2-A — Metrics Registry
P2-B — StatsPanel em 7 seções
P3-A — Unificar taxonomia de erro + errorActionMap
P3-B — ErrorActionCenter + integração pós-sessão/prova/Mentor
P4-A — Unificar score de raciocínio clínico
P4-B — reviewTaskPlanner
P4-C — FocusMode multimodal
P4-D — Conduta/prescrição simulada no Raciocínio Clínico
```

**Não executar P4 antes de P3.**  
O Raciocínio Clínico depende de erro clínico bem classificado.

**Não executar P3 antes de P2-A.**  
Stats precisa de governança para receber erro sem virar outra bagunça.

---

## 1. Pré-condições obrigatórias

Antes de qualquer sub-bloco:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Se houver arquivos untracked críticos:

```txt
mentorSignals
mentorDecisionPolicy
mentorAutopilot
navigationModel
hotfix de domínio/copy/vestibular
```

fazer snapshot/commit antes.

Não fazer:

```txt
commit
deploy
push
instalar libs
mexer em Firebase/Auth/localStorage
criar Activity Log
```

Activity Log fica **pós-Bloco N**.

---

# P2 — Estatísticas e Metrics Registry

## 2. Diagnóstico auditado

A auditoria mostrou que `StatsPanel.jsx` tem cerca de 767 linhas e renderiza, em sequência, ENAMED, padrão de erros, KPIs, heatmap, calibração, forecast, redação ENEM, desempenho por área e painéis avançados.

Problema: isso é um **stream vertical de componentes heterogêneos**, não uma área de diagnóstico.

Também foi confirmado:

```txt
metricsRegistry não existe.
"coletando" está hardcoded.
Raciocínio Clínico não tem seção.
Sistema/DataSafety/LaunchChecklist estão misturados com aprendizagem.
```

---

## P2-A — Criar Metrics Registry

### Objetivo

Centralizar a definição das métricas para que toda métrica tenha:

```txt
o que mede
se dá para confiar
estado vazio
ação recomendada
plataforma
seção
```

### Criar

```txt
src/core/metricsRegistry.js
src/core/metricsRegistry.test.js
```

### API

```js
export const METRIC_STATUS = {
  COLLECTING: "collecting",
  LOW_CONFIDENCE: "low_confidence",
  OK: "ok",
  WARNING: "warning",
  CRITICAL: "critical",
};

export function getMetricDefinition(id) {}

export function evaluateMetric(id, value, context = {}) {}

export function getMetricsForSection(section, plat = "res") {}

export function formatMetricValue(id, value, context = {}) {}
```

### Métricas obrigatórias

```txt
trueRetention
todayWorkloadMinutes
overdueReviews
relearningCount
coverageByArea
simuladoAccuracy
enamedGap
dominantError
clinicalReasoningScore
ankiAdherence
weeklyConsistency
```

### Definição padrão

```js
{
  id: "trueRetention",
  label: "Retenção longa",
  shortLabel: "Retenção",
  section: "resumo",
  description: "Estimativa baseada em revisões D21+ e manutenção.",
  emptyState: "Coletando revisões longas",
  confidenceRule: ({ n }) => n >= 5,
  actionWhenLow: "Priorize revisões longas e reduza temas novos por enquanto.",
  platforms: ["res", "vest"],
}
```

### Regras

```txt
Não mostrar 100% com baixa amostra.
Não mostrar ENAMED no Vestibular.
Não mostrar Raciocínio Clínico no Vestibular.
Não duplicar cálculo de readiness.
Não criar dependência circular com Dashboard.
```

### Testes

```js
test("all mandatory metrics have definitions")
test("trueRetention returns collecting without enough data")
test("vest does not receive enamedGap")
test("vest does not receive clinicalReasoningScore")
test("formatMetricValue does not break with null")
test("getMetricsForSection returns section metrics")
```

---

## P2-B — Reorganizar StatsPanel em 7 seções

### Objetivo

Transformar Estatísticas em diagnóstico.

### Alterar

```txt
src/components/StatsPanel.jsx
```

Criar se ajudar:

```txt
src/components/MetricCard.jsx
src/components/StatsSection.jsx
docs/P2_STATS_DECISIONS.md
```

### Nova estrutura

```txt
1. Resumo
2. Aprendizagem
3. Erros
4. Provas/Simulados
5. Raciocínio Clínico
6. Atividade
7. Sistema
```

### Seção 1 — Resumo

Mostrar no máximo:

```txt
Preparo estimado
Retenção longa
Carga de hoje/semana
Revisões vencidas
Relearning aberto
Próxima ação do Mentor
```

Cada card deve ter:

```txt
valor
estado de confiança
descrição curta
ação recomendada
```

### Seção 2 — Aprendizagem

```txt
retenção por área
cobertura por área
temas iniciados/consolidados
FSRS por fase: learning/review/relearning/maintenance
carga futura por minutos
```

### Seção 3 — Erros

Antes do P3:

```txt
erro dominante
erros recentes
alta confiança + erro
tempo
raciocínio
CTA: Centro de Erros será ativado no P3
```

Depois do P3:

```txt
ErrorActionCenter embutido ou linkado
ação corretiva recomendada
```

### Seção 4 — Provas/Simulados

Residência:

```txt
ENAMED / residência
área crítica
gap por área
questões erradas
análise detalhada
```

Vestibular:

```txt
simulados
matéria fraca
evolução de acertos
prova-alvo
```

### Seção 5 — Raciocínio Clínico

Residência apenas.

Antes do P4:

```txt
dados existentes
score, se confiável
casos feitos
casos pendentes
estado coletando se amostra baixa
```

Não criar novo cálculo aqui.

### Seção 6 — Atividade

Antes do Activity Log:

```txt
reviewHistory
sessionReflections
weeklyReviews
enamedAnalises/simulados
heatmap simples
dias ativos
```

Não criar calendário completo.

### Seção 7 — Sistema

Mover para cá:

```txt
DataSafetyPanel
LaunchChecklistPanel
WeeklyReview
integridade
backup
status de sync/auth, se existir
```

### Testes/QA

```txt
Stats mostra 7 seções.
Vestibular não mostra ENAMED.
Vestibular não mostra Raciocínio Clínico.
DataSafety está em Sistema.
Métrica coletando tem explicação.
Build/test/mojibake passam.
```

---

# P3 — Centro de Erros e Ações Corretivas

## 3. Diagnóstico auditado

A auditoria encontrou **três taxonomias de erro divergentes**:

```txt
1. errorTaxonomy.js — moderna/canônica: 8 tipos.
2. readiness.js — legada: lacuna, raciocinio, distractor, descuido, nao_visto, interpretacao.
3. sessionReflection.js — reflexão: conteudo, raciocinio, tempo, energia, distracao, nenhum, memoria.
```

O roadmap pedia 12 tipos.

Erro crítico: se criarmos uma quarta taxonomia, piora tudo.

A solução é:

```txt
estender errorTaxonomy.js
preservar LEGACY_ERROR_MAP
fazer errorActionMap consumir a taxonomia canônica
```

Outro achado importante:

```txt
Mentor hoje não consome erro dominante.
```

P3 deve corrigir isso.

---

## P3-A — Estender taxonomia e criar errorActionMap

### Criar

```txt
src/core/errorActionMap.js
src/core/errorActionMap.test.js
```

### Alterar

```txt
src/core/errorTaxonomy.js
```

### Regra principal

Não criar enum paralelo.

Usar `errorTaxonomy.js` como fonte canônica.

### Tipos canônicos finais

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
chute
```

Observação:

```txt
chute pode permanecer como tipo técnico legado/canônico se já existir.
energia e nenhum devem ser tratados como reflection issue, não necessariamente erro de questão.
```

### Compatibilidade legada

Manter mapeamentos:

```txt
lacuna → conteudo
nao_visto → conteudo
distractor → diferencial ou interpretacao
descuido → distracao
raciocinio → raciocinio
interpretacao → interpretacao
```

### errorActionMap

Cada tipo deve gerar:

```js
{
  type,
  label,
  definition,
  correctiveActions,
  preferredTask,
  mentorActionType,
  fsrsEffect,
  platforms
}
```

Exemplos:

```txt
conteudo → revisão curta + questões externas
memoria → FSRS/Anki
raciocinio → mini caso + problem representation
representacao_problema → escrever one-liner + dados discriminantes
diferencial → listar 3 diferenciais + must-not-miss
incerteza_sct → SCT curto
conduta_prescricao → management station educacional
interpretacao → treino de leitura diagnóstica
distracao → bloco cronometrado com checklist
tempo → bloco cronometrado
confianca_mal_calibrada → estimativa prévia + revisão calibrada
estrategia_prova → análise de prova/simulado
```

### Testes

```js
test("all canonical error types have corrective action")
test("legacy lacuna maps to conteudo")
test("legacy distractor maps safely")
test("conduta_prescricao is res only")
test("vest does not receive clinical management task")
test("generated corrective action is compatible with actionInbox")
test("dedupe does not drop corrective actions incorrectly")
```

---

## P3-B — ErrorActionCenter + integração real

### Criar

```txt
src/components/ErrorActionCenter.jsx
src/components/ErrorActionPrompt.jsx
docs/P3_ERROR_ACTION_DECISIONS.md
```

### Alterar

```txt
src/components/StatsPanel.jsx
src/components/FocusMode.jsx
src/components/EnamedProvaAnalyzer.jsx
src/core/mentorSignals.js
src/core/mentorDecisionPolicy.js
```

### Onde aparece

Não criar aba solta.

O Centro de Erros deve aparecer:

```txt
Stats → seção Erros
Mais → ferramenta
Pós-sessão → CTA
Pós-simulado → CTA
Mentor → ação corretiva quando erro dominante é forte
```

### Fluxo após sessão

Depois de FocusMode com erros:

```txt
Sessão concluída.
Erro dominante: Raciocínio.
Ação recomendada: mini caso + problem representation.
[Ver ação corretiva]
```

### Fluxo após simulado

Depois de EnamedProvaAnalyzer:

```txt
Seu erro dominante foi Interpretação.
Ação recomendada: treino de leitura diagnóstica.
[Ver ações]
```

### Mentor

Adicionar em `mentorSignals`:

```js
dominantError
dominantErrorAction
recentErrorPattern
```

Adicionar em `mentorDecisionPolicy`:

```txt
erro dominante com ação corretiva entra depois de prova/simulado pendente e antes de caso clínico/tema novo
```

Não reescrever o Mentor inteiro.

### Critério de aceite

```txt
Erro vira ação.
Mentor usa erro dominante.
Stats seção Erros mostra ação corretiva.
Pós-sessão mostra CTA.
Pós-simulado mostra CTA.
Vestibular recebe ações compatíveis.
Conduta/prescrição não aparece no Vestibular.
```

---

# P4 — Raciocínio Clínico integrado ao FSRS

## 4. Diagnóstico auditado

A auditoria encontrou:

```txt
calcRaciocinioScore triplicado.
illnessScript.js usa notaCaso, mas RaciocinioClinico não grava notaCaso.
RaciocinioClinico grava fase1Ok, fase2Acerto, sctAcerto, anamneseCobertura.
readiness usa fórmula 0.6 fase2 + 0.4 SCT.
UI usa média simples.
Só existem 2 casos clínicos.
Não existe reviewTaskPlanner.
Não existe clinicalCaseMatch.
Brain dump D1 existe, mas é genérico.
Conduta/prescrição simulada ausente.
```

Logo, P4 precisa começar por score, não por UI.

---

## P4-A — Unificar score de raciocínio clínico

### Criar

```txt
src/core/clinicalReasoningScoring.js
src/core/clinicalReasoningScoring.test.js
```

### Alterar

```txt
src/core/readiness.js
src/core/illnessScript.js
src/components/RaciocinioClinico.jsx
src/core/store.js, se necessário
```

### Decisão técnica

Definir contrato único.

Opção recomendada:

```js
{
  problemRepresentationScore,
  hypothesisScore,
  illnessScriptScore,
  sctScore,
  managementScore,
  safetyScore,
  overallScore
}
```

Enquanto dados antigos usam:

```js
fase1Ok
fase2Acerto
sctAcerto
anamneseCobertura
```

Criar adaptador:

```js
normalizeClinicalReasoningProgress(progress)
calculateClinicalReasoningScore(progress)
```

### Fórmula inicial

Sem conduta ainda:

```txt
fase2Acerto 60%
sctAcerto 40%
```

Com conduta no futuro:

```txt
problem representation 20%
hypotheses/differential 25%
illness script recall 20%
SCT 20%
management/safety 15%
```

Mas não aplicar peso de campo inexistente.

### Testes

```js
test("returns null with insufficient data")
test("legacy fase2Acerto/sctAcerto produces expected score")
test("RaciocinioClinico and readiness use the same score")
test("does not show high confidence with only one case")
test("vest returns null or unavailable")
```

---

## P4-B — reviewTaskPlanner

### Criar

```txt
src/core/reviewTaskPlanner.js
src/core/reviewTaskPlanner.test.js
```

### Objetivo

Escolher o tipo de tarefa de revisão conforme:

```txt
tema
stepKey FSRS
erros recentes
plataforma
disponibilidade de caso clínico
```

### API

```js
export function getReviewTaskForStep({ tema, stepKey, history, errors, platform, features }) {}
```

### Retorno

```js
{
  taskType,
  title,
  instructions,
  estimatedMinutes,
  requiredInputs,
  scoring,
  target,
}
```

### Mapeamento inicial

Residência, tema clínico:

```txt
D1 → brain_dump_structured
D4 → illness_script_recall
D7 → mini_case_differential
D21 → sct_management
maintenance → quick_case_or_management
```

Tema não clínico:

```txt
questions
brain_dump_structured
anki
```

Vestibular:

```txt
questions
brain_dump_structured
simulado_review
anki
```

Nunca:

```txt
illness_script
clinical_case
management_station
```

para Vestibular.

### clinicalCaseMatch

Criar helper:

```js
findClinicalCaseForTema(tema, casos, options)
```

Base inicial:

```txt
temaId
temaNormalizado
areaCanonica
keywords
```

Se não houver caso:

```txt
usar mini caso genérico apenas se seguro;
senão cair para questions/brain_dump.
```

### Testes

```js
test("D1 clinical topic returns structured brain dump")
test("D7 clinical topic returns mini case if case exists")
test("D21 clinical topic returns sct_management")
test("vest never returns clinical_case")
test("non clinical topic falls back to questions or brain dump")
```

---

## P4-C — FocusMode multimodal

### Alterar

```txt
src/components/FocusMode.jsx
```

### Objetivo

FocusMode deixa de ser só questões/brain dump genérico.

Ele deve renderizar tarefa vinda de `reviewTaskPlanner`.

### D1 — Brain dump estruturado

Campos:

```txt
1. Definição / quadro geral
2. Diagnóstico
3. Diferenciais
4. Conduta
5. Não pode perder
```

### D4 — Illness Script Recall

Campos:

```txt
Epidemiologia/contexto
Fisiopatologia resumida
Quadro típico
Achados discriminantes
Diagnósticos diferenciais
Conduta inicial
Armadilhas
```

### D7 — Mini caso + diferenciais

Campos:

```txt
problem representation
3 hipóteses
must-not-miss
exame inicial
conduta inicial
```

### D21 — SCT + conduta

Campos:

```txt
hipótese inicial
nova informação
muda probabilidade?
conduta
red flags
```

### Regras

```txt
Só Residência.
Só se meta.modulos.raciocinioClinico === true.
Fallback para fluxo atual se reviewTaskPlanner não retornar tarefa clínica.
Não quebrar questões/acertos.
Não alterar FSRS profundamente.
```

---

## P4-D — Conduta/prescrição simulada em Raciocínio Clínico

### Alterar

```txt
src/components/RaciocinioClinico.jsx
src/core/clinicalReasoningScoring.js
src/constants/casosClinicos.js, se necessário
```

### Adicionar fase

```txt
Conduta e prescrição simulada
```

Campos:

```txt
estabilização
exames iniciais
tratamento inicial
medicações/classes/doses quando houver checklist
internação ou ambulatório
red flags
contraindicações
seguimento
```

### Aviso obrigatório

```txt
Uso educacional. Não aplicar em paciente real.
```

### Score

Adicionar:

```txt
managementScore
safetyScore
dispositionScore
contraindicationScore
```

Se o caso não tiver checklist:

```txt
não pontuar dose específica;
avaliar estrutura do plano.
```

### Critério de aceite

```txt
Raciocínio Clínico cobra conduta.
Score usa mesma fonte canônica.
Erro de conduta_prescricao pode ir para ErrorActionCenter.
Nada aparece no Vestibular.
```

---

# Ordem final de execução

## Agora

Antes de P2/P3/P4:

```txt
HOTFIX — Já domino + copy PT-BR + trilha vestibular
```

Depois:

```txt
P2-A — metricsRegistry
P2-B — StatsPanel em 7 seções
P3-A — errorActionMap + taxonomia unificada
P3-B — ErrorActionCenter + Mentor usando erro dominante
P4-A — clinicalReasoningScoring
P4-B — reviewTaskPlanner
P4-C — FocusMode multimodal
P4-D — conduta/prescrição simulada
```

---

# Prompt curto para executor

```txt
Execute o plano revisado do arquivo MEDREV_P2_P3_P4_REVISADO_PELA_AUDITORIA.md.

Não execute tudo de uma vez. Comece por P2-A.

Regra:
- cada sub-bloco deve rodar check:mojibake, testes e build;
- não instale libs;
- não mexa em Firebase/auth/localStorage;
- não crie Activity Log;
- não faça commit, deploy ou push;
- não liste workspace inteiro.

Ordem:
P2-A → P2-B → P3-A → P3-B → P4-A → P4-B → P4-C → P4-D.
```

```

### MEDREV_P2_STATS_METRICS_REGISTRY.md

```txt
# MEDREV — P2: Redesign da Aba Estatísticas + Metrics Registry

> **Executor inicial:** Opus Thinking em modo planejamento  
> **Executor posterior:** `gpt-5.3-codex` ou Sonnet  
> **Reasoning effort:** `high`; usar `xhigh` se mexer em Stats + Mentor + Dashboard juntos  
> **Objetivo:** transformar a aba Estatísticas em área de diagnóstico, explicação e ação. Não deve ser painel confuso de cards.

---

## 0. Diagnóstico

A aba Estatísticas hoje tende a funcionar como depósito de componentes:

```txt
readiness
ENAMED
EnamedMapa
EnamedProvaAnalyzer
WeeklyReview
DataSafety
LaunchChecklist
heatmap
painéis avançados
```

O usuário entra e não sabe:

```txt
Qual métrica importa?
O que significa?
Dá para confiar?
O que fazer agora?
```

A auditoria P1 identificou `metricsRegistry` ausente e estados "coletando" hardcoded espalhados. Portanto, P2 deve criar governança de métricas e reorganizar Stats.

---

## 1. Escopo

### Implementar

```txt
src/core/metricsRegistry.js
src/core/metricsRegistry.test.js
src/components/StatsPanel.jsx
src/components/MetricCard.jsx       [se não existir]
src/components/StatsSection.jsx     [se ajudar]
docs/P2_STATS_DECISIONS.md
```

### Não implementar

```txt
Activity Log completo
Centro de Erros completo
Raciocínio Clínico v2
Refactor profundo do Mentor
Firebase/auth/localStorage
```

---

## 2. Nova arquitetura da aba Estatísticas

Stats deve ter 7 seções:

```txt
1. Resumo
2. Aprendizagem
3. Erros
4. Provas/Simulados
5. Raciocínio Clínico
6. Atividade
7. Sistema
```

Pode ser:

```txt
tabs
accordion
cards com navegação interna
```

Preferência: tabs/segmented control no topo em desktop e accordion no mobile se necessário.

---

## 3. Seção 1 — Resumo

Objetivo: responder “como estou de verdade?”

Mostrar no máximo:

```txt
Preparo estimado
Retenção longa
Carga semanal
Revisões vencidas
Relearning aberto
Próxima melhor ação do Mentor
```

Não mostrar gráfico complexo.

Cada card deve ter:

```txt
valor
estado de confiança
explicação curta
ação recomendada
```

Exemplo:

```txt
Retenção longa
Coletando D21+
Ainda preciso de revisões longas para estimar retenção real.
Ação: mantenha as revisões; evite interpretar isso como nota.
```

---

## 4. Seção 2 — Aprendizagem

Mostrar:

```txt
retenção por área
cobertura por área
temas iniciados/consolidados
FSRS: learning/review/relearning/maintenance
carga futura por minutos
```

Ação:

```txt
"Reduzir tema novo"
"Priorizar revisões longas"
"Recuperar temas em relearning"
```

---

## 5. Seção 3 — Erros

Nesta fase P2, se ErrorActionCenter ainda não existir, criar apenas placeholders funcionais de leitura, não a feature completa.

Mostrar:

```txt
erro dominante
erro por área
erros recentes
confiança mal calibrada, se houver dados
CTA: Ver ações corretivas
```

Se `errorActionMap` ainda não existe:

```txt
mostrar "Centro de Erros será ativado no P3"
```

Não criar lógica duplicada. P3 cria o core definitivo.

---

## 6. Seção 4 — Provas/Simulados

Residência:

```txt
ENAMED / residência
área crítica
gap por área
questões erradas
análise detalhada
```

Vestibular:

```txt
simulados
matéria fraca
evolução de acertos
prova-alvo
```

Regra:

```txt
ENAMED não aparece no Vestibular.
```

---

## 7. Seção 5 — Raciocínio Clínico

Residência apenas.

Mostrar:

```txt
score de raciocínio
casos feitos
casos devidos
score por fase:
- problem representation
- hipóteses
- illness recall
- SCT
- conduta/prescrição
```

Se P4 ainda não foi implementado:

```txt
mostrar seção simples com dados existentes;
não inventar métricas;
não criar calcRaciocinioScore duplicado.
```

Vestibular:

```txt
não mostrar esta seção.
```

---

## 8. Seção 6 — Atividade

Antes do Activity Log completo:

```txt
usar dados existentes:
reviewHistory
sessionReflections
weeklyReviews
enamedAnalises
simulados
```

Mostrar:

```txt
dias ativos
sessões recentes
heatmap simples
volume semanal
```

Não criar calendário histórico completo aqui. Isso é P1-E/Pós-N.

---

## 9. Seção 7 — Sistema

Mover para cá:

```txt
DataSafetyPanel
LaunchChecklistPanel
WeeklyReview
debug de integridade
backup
status de sync/auth, se existir
```

Se a UX ficar pesada:

```txt
Data Safety e Launch Checklist podem ir para Mais > Sistema.
```

---

## 10. Metrics Registry

Criar `src/core/metricsRegistry.js`.

### API

```js
export const METRIC_STATUS = {
  COLLECTING: "collecting",
  LOW_CONFIDENCE: "low_confidence",
  OK: "ok",
  WARNING: "warning",
  CRITICAL: "critical",
};

export function getMetricDefinition(id) {}

export function evaluateMetric(id, value, context = {}) {}

export function getMetricsForSection(section, plat = "res") {}

export function formatMetricValue(id, value, context = {}) {}
```

### Definição mínima

```js
{
  id: "trueRetention",
  label: "Retenção longa",
  shortLabel: "Retenção",
  section: "resumo",
  description: "Estimativa baseada em revisões D21+ e manutenção.",
  emptyState: "Coletando D21+",
  confidenceRule: ({ n }) => n >= 5,
  actionWhenLow: "Priorize revisões longas e reduza tema novo.",
  platforms: ["res", "vest"],
}
```

### Métricas obrigatórias

```txt
trueRetention
todayWorkloadMinutes
overdueReviews
relearningCount
coverageByArea
simuladoAccuracy
enamedGap
dominantError
clinicalReasoningScore
ankiAdherence
weeklyConsistency
```

---

## 11. Regras de UX para métricas

Toda métrica deve ter:

```txt
label humano
descrição curta
estado vazio
confiança
ação recomendada
plataforma
seção
```

Proibido:

```txt
mostrar 100% sem amostra
mostrar métrica sem explicação
misturar ENAMED no Vestibular
colocar Data Safety no meio de aprendizagem
exibir painel técnico no topo
```

---

## 12. Integração com Dashboard

Dashboard “Hoje” não deve importar tudo de Stats.

Dashboard pode mostrar apenas:

```txt
1. carga de hoje
2. revisões vencidas
3. relearning
4. retenção longa se confiável
```

Stats guarda a explicação profunda.

Não criar dependência circular.

---

## 13. Testes obrigatórios

Criar/ajustar:

```txt
src/core/metricsRegistry.test.js
```

Cobrir:

```txt
metricDefinition existe para métricas obrigatórias
trueRetention retorna collecting sem n suficiente
trueRetention retorna low_confidence com n baixo
vest não recebe ENAMED
clinicalReasoningScore só res
getMetricsForSection retorna seções corretas
formatMetricValue não quebra null
```

Se houver teste de StatsPanel, atualizar smoke.

---

## 14. QA manual

### Residência

```txt
Abrir Estatísticas.
Ver seções: Resumo, Aprendizagem, Erros, Provas, Raciocínio, Atividade, Sistema.
ENAMED aparece em Provas.
Raciocínio aparece.
Data Safety está em Sistema.
Métrica "coletando" tem explicação.
```

### Vestibular

```txt
Abrir Estatísticas.
Não aparece ENAMED.
Não aparece Raciocínio Clínico.
Aparecem Simulados, Aprendizagem, Atividade, Sistema.
```

### Mobile

```txt
Seções acessíveis.
Sem scroll infinito confuso.
Cards com explicação curta.
```

---

## 15. Critérios de aceite

P2 aprovado se:

```txt
metricsRegistry existe e tem testes.
StatsPanel está dividido em seções.
Dashboard não fica mais pesado.
Métricas têm emptyState/confidence/action.
ENAMED não aparece no Vestibular.
Raciocínio não aparece no Vestibular.
DataSafety/LaunchChecklist não poluem aprendizagem.
check:mojibake passa.
testes passam.
build passa.
```

---

## 16. Prompt curto para execução

```txt
Execute somente o P2 do arquivo MEDREV_P2_STATS_METRICS_REGISTRY.md.

Objetivo: reorganizar a aba Estatísticas em seções e criar metricsRegistry.
Não implemente Activity Log, Centro de Erros completo, Raciocínio Clínico v2 ou Firebase/auth.
Não mexa profundamente no Mentor.
Não liste workspace inteiro.
Use git grep/git ls-files.

Crie metricsRegistry + testes.
Reorganize StatsPanel em:
Resumo, Aprendizagem, Erros, Provas/Simulados, Raciocínio Clínico, Atividade, Sistema.

Preserve Residência e Vestibular.
Rode check:mojibake, testes e build.
Não faça commit, deploy ou push.
```

```

### MEDREV_PRODUCT_PERSONA_UX_AUDIT_PROMPT.md

```txt
# MEDREV — Prompt para Auditoria de Produto por Persona, UX e Coerência

> **Executor recomendado:** Claude Opus Thinking / Claude Code em modo planejamento  
> **Executor posterior:** Sonnet ou `gpt-5.3-codex`, fase por fase  
> **Objetivo:** melhorar o site/app com base na persona real, decidindo o que faz sentido, o que confunde, o que deve ser principal, o que deve ir para Mais/Stats/Avançado e o que deve ser removido/adiado.

---

## 0. Contexto

O MedRev é uma plataforma complementar para preparação de residência médica e, opcionalmente, vestibular.

Ele não deve ser um banco de questões.

A proposta correta é:

```txt
Banco de questões = onde o aluno responde.
MedRev = sistema operacional de estudo.
```

O MedRev deve ajudar o aluno a:

```txt
saber o que estudar agora;
revisar no momento certo;
corrigir erros;
interpretar prova/simulado;
evitar sobrecarga;
desenvolver raciocínio clínico;
manter histórico e progresso;
confiar no plano.
```

Problema atual percebido:

```txt
muita função;
experiência confusa;
métricas demais;
sidebar cheia;
Mentor e Stats competindo;
raciocínio clínico lateral;
Vestibular sem trilha clara;
copy/PT-BR inconsistente;
algumas features parecem boas no papel, mas não ficam claras para o usuário.
```

Este trabalho deve responder:

```txt
O que faz sentido para a persona?
O que não faz sentido?
O que deve ficar no fluxo principal?
O que deve ir para Mais/Avançado?
O que deve ir para Stats?
O que deve ser removido, escondido ou adiado?
O que deve ser explicado melhor?
Qual é a experiência ideal do primeiro uso?
```

---

## 1. Personas

### Persona A — Estudante de medicina / residência

Perfil:

```txt
Aluno de medicina ou médico recém-formado;
quer passar em residência/ENAMED;
usa ou já usa banco de questões;
tem ansiedade pelo volume de conteúdo;
não sabe priorizar;
quer um sistema que diga o próximo passo.
```

Dor principal:

```txt
Tenho conteúdo demais, questões demais e métricas demais. Quero saber o que fazer hoje para aumentar minha chance de aprovação.
```

Jobs to be done:

```txt
Quando eu abro o app, quero saber minha próxima ação.
Quando erro uma questão, quero saber que tipo de erro foi e como corrigir.
Quando atraso revisão, quero saber o que recuperar primeiro.
Quando faço simulado, quero transformar isso em plano.
Quando estudo um tema clínico, quero treinar raciocínio e conduta, não só decorar.
Quando estou sobrecarregado, quero que o sistema reduza a carga.
```

Valor percebido:

```txt
clareza;
priorização;
ação concreta;
segurança;
evolução visível;
revisão inteligente;
explicação do porquê;
baixo atrito.
```

O que essa persona não quer:

```txt
mais um dashboard cheio de gráfico;
mais uma lista manual de tarefas;
métrica sem explicação;
feature bonita mas sem consequência;
configuração demais antes de entender valor;
linguagem ruim ou amadora.
```

---

### Persona B — Vestibulando

Perfil:

```txt
Estudante que se prepara para ENEM/Fuvest/Unicamp/outros;
precisa de cronograma, revisão e análise de simulado;
não precisa de ENAMED, raciocínio clínico, illness script ou conduta médica.
```

Dor principal:

```txt
Quero começar rápido, saber minha prova-alvo, o que estudar primeiro e como revisar.
```

Regra:

Vestibular não deve exibir:

```txt
ENAMED como eixo;
Raciocínio Clínico;
Illness Script;
Casos clínicos;
Conduta médica;
Prescrição.
```

Vestibular deve exibir:

```txt
trilha inicial;
prova-alvo;
simulados;
matéria fraca;
cronograma;
revisão espaçada;
Mentor;
Estatísticas simples.
```

---

## 2. Tarefa do Opus Thinking

Você está em **modo planejamento**.

Não implemente nada.

Não edite arquivos.

Não faça commit, deploy ou push.

Não instale bibliotecas.

Não liste o workspace inteiro.

Use apenas comandos escopados:

```bash
git status --short
git ls-files src package.json docs
git grep -n "Sidebar\|BottomNav\|Dashboard\|StatsPanel\|Mentor\|Raciocinio\|Raciocínio\|Vestibular\|ENAMED\|Simulados\|Anki\|WeeklyReview\|DataSafety\|Onboarding" -- src
git grep -n "Prontidão\|True Retention\|Modo Simples\|Analise\|Acao\|Nao\|Voce\|Faca\|validacao\|dominio\|calendario" -- src
git grep -n "featureEnabled\|platformFeatures\|plat === \"vest\"\|plat === 'vest'" -- src
git grep -n "mentorNextAction\|mentorTodayPlan\|target\|ctaView\|explain" -- src
git grep -n "metricsRegistry\|errorActionMap\|reviewTaskPlanner\|clinicalReasoningScoring" -- src
```

Criar somente:

```txt
docs/PRODUCT_PERSONA_UX_AUDIT.md
```

---

## 3. O que auditar

### 3.1 Primeira impressão

Responder:

```txt
O usuário entende o que é o MedRev em 10 segundos?
O Dashboard/Hoje diz o que fazer agora?
A navegação está por jornada ou por módulo?
A pessoa sabe onde clicar primeiro?
A plataforma parece confiável?
O português passa segurança?
```

### 3.2 Fluxo de primeiro uso

Auditar separadamente:

```txt
Residência:
1. primeiro login;
2. configurar plano;
3. primeira ação do Mentor;
4. primeira revisão;
5. primeiro erro;
6. primeiro simulado.

Vestibular:
1. escolher prova-alvo;
2. escolher data;
3. registrar ou não simulado;
4. primeira recomendação;
5. primeiro plano;
6. primeira revisão.
```

### 3.3 Coerência das features

Para cada feature, classificar:

```txt
Core diário
Diagnóstico
Ferramenta avançada
Configuração
Sistema
Remover/adiar
```

Features a avaliar:

```txt
Hoje/Dashboard
Plano/Cronograma
Estudar/Simulados
Estatísticas
Banco de Dados
Raciocínio Clínico
Illness Script
Já domino
Mentor
Action Inbox
Centro de Erros
Anki Audit
Weekly Review
Peak Mode
Data Safety
Launch Checklist
Guia
Onboarding
Activity Log futuro
Vestibular Start Trail
```

### 3.4 Avaliar se cada feature responde

```txt
Qual problema resolve?
Para qual persona?
Em que momento da jornada aparece?
Cria tarefa?
Registra dado?
Gera ação corretiva?
Alimenta o Mentor?
Alimenta Stats?
Fica no fluxo principal ou avançado?
```

### 3.5 Avaliar o que não faz sentido

Procurar:

```txt
feature que duplica outra;
métrica que não muda decisão;
painel técnico demais;
card que só aumenta ansiedade;
termo pouco claro;
função avançada aparecendo cedo demais;
item médico vazando no Vestibular;
configuração antes do valor;
botão sem consequência visível;
ação sem feedback.
```

---

## 4. Saída obrigatória

Criar `docs/PRODUCT_PERSONA_UX_AUDIT.md` com:

### 4.1 Diagnóstico executivo

```txt
O produto está claro?
O usuário novo fica perdido?
Qual é o maior problema de UX?
Qual é o maior problema de produto?
Qual é o maior problema técnico que afeta UX?
```

### 4.2 Personas e jornadas

Tabela:

```txt
Persona | Objetivo | Dor | Primeira ação ideal | O que não deve ver cedo
```

### 4.3 Mapa de features por valor

Tabela:

```txt
Feature | Persona | Valor real | Momento certo | Local ideal | Problema atual | Decisão
```

Decisões possíveis:

```txt
Manter principal
Mover para Mais
Mover para Stats
Unificar
Colapsar
Adiar
Remover do fluxo
```

### 4.4 Navegação ideal

Propor:

```txt
Hoje
Plano
Estudar
Estatísticas
Banco
Mais
```

E justificar o que fica em cada item.

### 4.5 Dashboard/Hoje ideal

Desenhar:

```txt
Comando do Mentor
Próximas 2 ações
Carga de hoje
Alertas
Avançado colapsado
```

Indicar o que deve sair.

### 4.6 Stats ideal

Indicar seções:

```txt
Resumo
Aprendizagem
Erros
Provas/Simulados
Raciocínio Clínico
Atividade
Sistema
```

Indicar quais métricas entram e quais saem.

### 4.7 Mentor ideal

Definir:

```txt
o que o Mentor deve decidir;
o que ele não deve decidir;
como explicar a recomendação;
quando não recomendar tema novo;
quando recomendar descanso;
quando recomendar erro/ação corretiva;
quando recomendar raciocínio clínico.
```

### 4.8 Raciocínio Clínico

Responder:

```txt
deve ficar no fluxo principal?
deve ser modo de revisão?
quando aparece?
quais temas usam?
como cobrar conduta/prescrição?
como evitar complexidade cedo demais?
```

### 4.9 Vestibular

Responder:

```txt
a trilha inicial existe?
o aluno entende como começar?
o que deve ser escondido?
o que deve aparecer?
qual é a jornada ideal?
```

### 4.10 Copy e linguagem

Listar:

```txt
termos ruins;
termos a substituir;
tom correto;
frases que precisam ser reescritas;
padrão PT-BR.
```

### 4.11 Top 10 mudanças de maior impacto

Classificar por:

```txt
impacto no usuário
esforço
risco técnico
prioridade
```

### 4.12 Plano de implementação

Separar em:

```txt
P1 — clareza inicial
P2 — Stats e métricas
P3 — erros e ações corretivas
P4 — raciocínio clínico integrado
P5 — histórico/calendário pós-Bloco N
P6 — polish final
```

Para cada uma:

```txt
objetivo
arquivos prováveis
o que fazer
o que não fazer
testes
critério de aceite
```

---

## 5. Regras de decisão de produto

### Manter no fluxo principal se:

```txt
é usado diariamente;
gera próxima ação;
reduz dúvida;
tem CTA claro;
é essencial para começar.
```

### Mover para Mais se:

```txt
é útil, mas ocasional;
é avançado;
é configuração;
é diagnóstico secundário;
pode confundir usuário novo.
```

### Mover para Stats se:

```txt
é diagnóstico;
é retrospectivo;
explica desempenho;
não precisa ser visto todo dia.
```

### Colapsar se:

```txt
é útil para power user;
mas polui a tela inicial.
```

### Adiar/remover do fluxo se:

```txt
não tem ação clara;
não alimenta Mentor;
duplica outra função;
não tem persona clara;
exige muito esforço cognitivo cedo.
```

---

## 6. Importante: não confundir melhoria de UX com feature nova

O objetivo agora não é criar mais coisas.

O objetivo é:

```txt
menos telas competindo;
menos métricas soltas;
menos texto ruim;
mais orientação;
mais consequência visível;
mais coerência com a persona.
```

Se a solução proposta for “criar mais uma aba”, rejeite por padrão.

Preferir:

```txt
integrar;
reclassificar;
colapsar;
explicar melhor;
transformar em ação do Mentor.
```

---

## 7. Prompt curto para o Opus

```txt
Aja como engenheiro de software sênior, designer de produto sênior e pesquisador em ciência da aprendizagem médica.

Você está em modo planejamento. Não implemente nada.

Eu não quero só corrigir bugs. Quero que você avalie o produto pela persona: o que faz sentido, o que não faz, o que confunde, o que deveria ser principal, o que deveria ir para Mais/Stats/Avançado e como o usuário deve entender o app.

Use o arquivo MEDREV_PRODUCT_PERSONA_UX_AUDIT_PROMPT.md como fonte de verdade.

Audite o código com git grep/git ls-files, sem listar workspace inteiro.

Crie docs/PRODUCT_PERSONA_UX_AUDIT.md com:
- diagnóstico executivo;
- personas e jornadas;
- mapa de features por valor;
- navegação ideal;
- Dashboard/Hoje ideal;
- Stats ideal;
- Mentor ideal;
- Raciocínio Clínico;
- Vestibular;
- copy/PT-BR;
- top 10 mudanças de maior impacto;
- plano de implementação em fases.

Não edite arquivos de implementação.
Não faça commit, deploy ou push.
Não instale libs.
```

```

### docs/COPY_GUIDE_PT_BR.md

```txt
# COPY GUIDE PT-BR

## Navegação
- Dashboard -> Hoje
- Cronograma -> Plano
- Simulados -> Estudar (quando for item de navegação)
- Estatísticas -> Estatísticas
- Banco de Dados -> Banco

## Métricas
- Prontidão -> Preparo estimado
- True Retention -> Retenção longa
- Carga diária -> Carga de hoje

## Ações
- Começar agora
- Ver por quê
- Configurar plano
- Já domino

## Convenções de escrita
- Usar acentuação correta em textos visíveis.
- Evitar abreviações inconsistentes como `Crono` em labels principais.
- Manter chaves técnicas (`dash`, `crono`, `sims`) sem alterar compatibilidade interna.

## Terminologia de onboarding
- Modo Simples -> Modo Mentor
- Coletando D21+ -> Coletando revisões longas

```

### docs/MEDREV_PRODUCT_CHARTER.md

```txt
# MEDREV — Product Charter e Contexto Permanente para IA

> **Uso:** colar este documento no início de prompts do Claude/Codex ou manter no repositório como `docs/MEDREV_PRODUCT_CHARTER.md`.  
> **Objetivo:** impedir que a IA crie features soltas, piore a UX ou modifique o produto fora da proposta central.  
> **Regra:** qualquer criação, exclusão ou modificação deve respeitar este documento.

---

## 1. O que é o MedRev

O **MedRev** é um sistema operacional de estudo para preparação de residência médica e, opcionalmente, vestibular.

Ele não é o lugar principal onde o aluno resolve milhares de questões.

A tese do produto é:

```txt
Banco de questões = onde o aluno responde.
MedRev = onde o aluno decide o que fazer, registra o que aconteceu, corrige erros e mantém revisão inteligente.
```

O MedRev existe para responder:

```txt
O que eu estudo hoje?
Por que isso é prioridade?
Como faço essa tarefa?
O que eu errei?
O que faço para corrigir?
Quando devo reencontrar esse tema?
Como evito sobrecarga?
Estou evoluindo de verdade?
```

---

## 2. O que o MedRev NÃO é

O MedRev **não** é:

```txt
1. Banco de questões completo.
2. Plataforma para competir com MedQ, MedCof, Estratégia, MedEvo ou bancos de questão.
3. Dashboard de BI cheio de gráfico sem ação.
4. Repositório de métricas bonitas, mas inúteis.
5. App de anotações genérico.
6. App de agenda genérico.
7. Prontuário ou ferramenta assistencial.
8. Ferramenta de prescrição real.
9. Plataforma de IA médica para paciente real.
10. Coleção de features soltas.
11. Produto onde o usuário precisa configurar tudo manualmente.
12. Produto que joga ENAMED/Raciocínio Clínico no Vestibular.
```

Se uma sugestão da IA empurrar o produto para qualquer uma dessas direções, **rejeitar por padrão**.

---

## 3. Persona principal

## Persona A — Estudante de medicina / residência

### Perfil

```txt
Estudante de medicina ou médico recém-formado;
quer passar em residência/ENAMED;
usa banco de questões;
tem muito conteúdo acumulado;
fica ansioso com volume;
não sabe priorizar;
quer uma ação clara para hoje.
```

### Dor principal

```txt
Tenho conteúdo demais, questões demais e métricas demais. Quero saber o que fazer hoje para aumentar minha chance de aprovação.
```

### Jobs to be Done

```txt
Quando eu abro o app, quero saber minha próxima ação.
Quando erro, quero saber que tipo de erro foi e como corrigir.
Quando atraso, quero saber o que recuperar primeiro.
Quando faço simulado, quero transformar o resultado em plano.
Quando estudo tema clínico, quero treinar raciocínio, diferenciais e conduta.
Quando estou sobrecarregado, quero que o sistema reduza a carga.
```

### Valor percebido

```txt
clareza;
priorização;
ação concreta;
segurança;
baixo atrito;
evolução visível;
revisão inteligente;
explicação do porquê.
```

---

## 4. Persona secundária

## Persona B — Vestibulando

### Perfil

```txt
Estudante preparando ENEM, Fuvest, Unicamp ou outra prova;
precisa de cronograma, revisão e análise de simulado;
não precisa de raciocínio clínico nem ENAMED.
```

### Dor principal

```txt
Quero começar rápido, escolher minha prova-alvo e saber o que estudar primeiro.
```

### Vestibular deve ter

```txt
trilha inicial;
prova-alvo;
data ou janela de prova;
simulados;
matéria fraca;
cronograma;
revisão espaçada;
Mentor;
Estatísticas simples.
```

### Vestibular NÃO deve ter

```txt
ENAMED como eixo principal;
Raciocínio Clínico;
Illness Script;
Casos clínicos;
Conduta médica;
Prescrição;
SCT médico;
linguagem de residência médica.
```

Toda feature nova precisa passar por `featureEnabled(plat, feature)`.

---

## 5. Ciclo central do produto

Toda função do MedRev deve se encaixar neste ciclo:

```txt
1. Planejar
2. Executar
3. Registrar
4. Corrigir
5. Reagendar
6. Decidir o próximo passo
```

Se uma feature não participa desse ciclo, ela provavelmente deve ir para:

```txt
Mais;
Stats;
Sistema;
Avançado;
ou ser adiada/removida.
```

---

## 6. Perguntas obrigatórias antes de criar ou modificar qualquer feature

Antes de implementar qualquer coisa, responder:

```txt
1. Para qual persona isso existe?
2. Qual dor real resolve?
3. Em que momento da jornada aparece?
4. Cria qual tarefa?
5. Registra qual dado?
6. Corrige qual erro?
7. Agenda ou altera qual revisão?
8. Alimenta o Mentor?
9. Alimenta Estatísticas?
10. Tem estado vazio claro?
11. Tem CTA claro?
12. Funciona em Residência, Vestibular ou ambos?
13. Pode confundir usuário novo?
14. Deve ficar principal, Stats, Mais, Sistema ou Avançado?
15. Que teste prova que isso funciona?
```

Se a IA não conseguir responder, **não implementar**.

---

## 7. Regra de navegação

A navegação deve ser por jornada, não por módulo interno.

### Navegação principal

```txt
Hoje
Plano
Estudar
Estatísticas
Banco
Mais
```

### O que cada item significa

## Hoje

Tela de decisão diária.

Deve responder:

```txt
O que faço agora?
Por que isso?
Quanto tempo leva?
O que vem depois?
Existe algum alerta?
```

## Plano

Cronograma e calendário-base.

Inclui:

```txt
MEDCOF;
Estratégia;
Custom;
temas;
prioridades;
“Já domino”;
tema novo recomendado.
```

## Estudar

Execução.

Inclui:

```txt
simulados;
análise de prova;
modo foco;
revisão;
tarefas guiadas.
```

## Estatísticas

Diagnóstico.

Inclui:

```txt
aprendizagem;
erros;
provas/simulados;
raciocínio clínico;
atividade;
sistema.
```

## Banco

Cadastros e bases.

Inclui:

```txt
temas;
casos;
cronogramas;
catálogos.
```

## Mais

Ferramentas ocasionais.

Inclui:

```txt
Raciocínio Clínico;
Anki Audit;
Weekly Review;
Data Safety;
Launch Checklist;
Guia;
Ajustes;
Academia/Método.
```

---

## 8. Regra do Dashboard / Hoje

O Dashboard não é lugar para todos os gráficos.

A tela **Hoje** deve conter:

```txt
1. Comando do Mentor.
2. Próximas 2 ações.
3. Carga de hoje.
4. Alertas importantes.
5. Avançado colapsado.
```

Não colocar no topo:

```txt
gráficos longos;
painéis avançados;
métricas sem ação;
configuração;
histórico longo;
diagnóstico profundo;
feature experimental.
```

Regra:

```txt
Dashboard = ação.
Stats = diagnóstico.
Mais = ferramenta.
Sistema = configuração/segurança.
```

---

## 9. Regra do Mentor

O Mentor é o motor de decisão do produto.

Ele não é frase motivacional.

Ele deve decidir com base em:

```txt
FSRS;
relearning;
revisões vencidas;
carga de hoje;
cronograma;
prova/simulado;
erro dominante;
raciocínio clínico;
Vestibular/Residência;
sinais de sobrecarga.
```

### Ordem de prioridade

```txt
1. risco de dados/sync/estado inválido;
2. sobrecarga;
3. relearning;
4. revisões vencidas;
5. revisão de hoje;
6. simulado/prova pendente de análise;
7. erro dominante com ação corretiva;
8. caso clínico devido;
9. tema novo se carga permite;
10. descanso/bloco leve.
```

### Regra crítica

Ação do Mentor precisa ter `target` executável.

Se não tiver:

```txt
não pode ser botão principal;
deve virar “Ver plano”;
deve gerar warning interno.
```

---

## 10. Regra das Estatísticas

Stats não é painel de vaidade.

Stats deve explicar:

```txt
o que está acontecendo;
se dá para confiar;
o que fazer.
```

Toda métrica precisa ter:

```txt
label humano;
descrição;
estado vazio;
nível de confiança;
ação recomendada;
plataforma;
seção.
```

### Seções de Stats

```txt
Resumo
Aprendizagem
Erros
Provas/Simulados
Raciocínio Clínico
Atividade
Sistema
```

### Proibido em Stats

```txt
mostrar 100% sem amostra;
mostrar “coletando” sem explicar;
misturar Data Safety com aprendizagem;
mostrar ENAMED no Vestibular;
mostrar Raciocínio Clínico no Vestibular.
```

---

## 11. Regra de erros

Erro precisa virar ação.

Não basta registrar erro.

Fluxo correto:

```txt
errou → classifica → entende → recebe ação corretiva → Mentor usa → revisão/plano ajusta
```

Taxonomia canônica deve ficar em `errorTaxonomy.js`.

Não criar taxonomias paralelas.

`errorActionMap.js` deve mapear:

```txt
conteudo → revisão curta + questões externas;
memoria → FSRS/Anki;
raciocinio → mini caso + problem representation;
representacao_problema → one-liner + dados discriminantes;
diferencial → 3 diferenciais + must-not-miss;
incerteza_sct → SCT curto;
conduta_prescricao → management station educacional;
interpretacao → leitura diagnóstica;
distracao → checklist/bloco cronometrado;
tempo → bloco cronometrado;
confianca_mal_calibrada → estimativa prévia + revisão calibrada;
estrategia_prova → análise de simulado/prova.
```

Vestibular não deve receber `conduta_prescricao`.

---

## 12. Regra do Raciocínio Clínico

Raciocínio Clínico não deve ser só uma aba lateral.

Ele deve existir em dois modos:

## Modo 1 — Caso completo

```txt
Vinheta;
Problem representation;
Hipóteses + must-not-miss;
Illness script de memória;
SCT / nova informação;
Conduta e prescrição simulada;
Feedback + reencontro.
```

## Modo 2 — Revisão FSRS multimodal

```txt
D1  → Brain dump estruturado;
D4  → Illness Script recall;
D7  → Mini caso + diferenciais;
D21 → SCT curto + conduta;
Manutenção → caso rápido ou prescrição simulada.
```

### Brain dump estruturado

Para temas grandes, não usar “escreva tudo que lembra”.

Usar:

```txt
1. Definição/quadro geral;
2. Diagnóstico;
3. Diferenciais;
4. Conduta;
5. Não pode perder.
```

### Conduta/prescrição

Apenas simulação educacional.

Aviso obrigatório:

```txt
Uso educacional. Não aplicar em paciente real.
```

---

## 13. Regra do “Já domino”

“Já domino” não marca domínio definitivo.

Ele é uma validação de domínio prévio.

### Critério

```txt
mínimo 15 questões;
mínimo 80% de acerto.
```

### Resultado

```txt
80–89% → agenda primeira revisão em D7;
>=90% → agenda primeira revisão em D14;
<80% ou <15 questões → não valida, iniciar D0.
```

Após validar, o tema deve:

```txt
sair de unstarted;
ter status validado_previo;
registrar dominioPrevio;
mudar card imediatamente;
entrar no ciclo de revisão;
aparecer na fila quando vencer.
```

---

## 14. Regra de copy e linguagem

Português precisa passar confiança.

### Preferir

```txt
Hoje;
Plano;
Estudar;
Preparo estimado;
Retenção longa;
Modo Mentor;
Carga de hoje;
Revisões vencidas;
Coletando revisões longas;
Ação corretiva;
Domínio prévio;
Validação;
```

### Evitar/substituir

```txt
Dashboard → Hoje;
Cronograma → Plano;
Prontidão → Preparo estimado;
True Retention → Retenção longa;
Modo Simples → Modo Mentor;
Crono → Plano;
Analise → Análise;
Acao → Ação;
Nao → Não;
Voce → Você;
Faca → Faça;
calendario → calendário;
validacao → validação;
dominio → domínio.
```

IDs internos podem permanecer. Labels visíveis devem seguir o glossário.

---

## 15. Regra de dados e privacidade

Multiusuário é P0.

Dados privados precisam ser escopados por `uid`.

Não criar novos logs ou históricos persistentes se o isolamento de conta não estiver resolvido.

Não criar Activity Log antes do Bloco N.

Arquitetura esperada:

```txt
localStorage:
medrev:<env>:user:<uid>:store

Firestore:
/users/{uid}/state/main
/users/{uid}/activityLog
/users/{uid}/backups
```

---

## 16. Regra de criação, exclusão e modificação

## Criar quando

```txt
resolve dor clara;
encaixa no ciclo do produto;
tem CTA;
registra dado útil;
alimenta Mentor ou Stats;
tem teste;
não aumenta confusão.
```

## Modificar quando

```txt
melhora clareza;
reduz fricção;
unifica lógica duplicada;
corrige estado invisível;
melhora feedback;
preserva compatibilidade.
```

## Excluir/adiar quando

```txt
duplica outra função;
é só visual;
não tem ação;
não tem persona clara;
cria métrica sem decisão;
confunde usuário novo;
vaza medicina para Vestibular;
exige persistência antes do Bloco N.
```

## Mover para Mais quando

```txt
é útil, mas ocasional;
é avançado;
é configuração;
é método/guia;
é segurança/sistema.
```

## Mover para Stats quando

```txt
é diagnóstico;
é retrospectivo;
é métrica;
não precisa aparecer todo dia.
```

---

## 17. Regras técnicas para IA

Antes de editar:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Não usar:

```txt
ls -R
dir /s
tree
find .
Get-ChildItem -Recurse
busca em node_modules/build/audit/backups
```

Usar:

```bash
git grep
git ls-files
```

Depois de editar:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
npm run audit:full
```

Não fazer:

```txt
commit;
deploy;
push;
instalar libs;
refactor gigante;
mexer em múltiplas fases sem autorização.
```

---

## 18. Definition of Done

Uma mudança só está pronta se:

```txt
tem propósito por persona;
tem CTA claro;
não aumenta navegação;
não cria métrica solta;
não quebra Vestibular;
não vaza medicina para Vestibular;
não cria taxonomia paralela;
não cria score paralelo;
passa mojibake;
passa testes;
passa build;
tem QA manual descrito.
```

---

## 19. Prompt base para Claude/Codex

Use isto no início de qualquer tarefa:

```txt
Antes de implementar, leia docs/MEDREV_PRODUCT_CHARTER.md.

Você deve respeitar o que o MedRev é e o que não é.

Não crie features soltas.
Não crie dashboards sem ação.
Não crie métricas sem explicação.
Não crie taxonomias paralelas.
Não crie lógica médica no Vestibular.
Não mexa em persistência sem autorização.
Não crie Activity Log antes do isolamento multiusuário.

Toda mudança deve responder:
- Para qual persona?
- Qual dor resolve?
- Onde aparece na jornada?
- Qual tarefa cria?
- Qual dado registra?
- Qual ação corretiva gera?
- Como o Mentor usa?
- Como Stats usa?
- Qual teste prova?

Se não souber responder, pare e peça decisão.
```

```

### docs/P2_P3_P4_OPUS_AUDIT_PLAN.md

```txt
# MEDREV — P2/P3/P4: Plano de Auditoria e Integracao (Opus Thinking)

> **Modo:** planejamento. Nenhuma implementacao foi feita.
> **Fonte de verdade:** `MEDREV_P2_P3_P4_OPUS_ROADMAP.md` e `MEDREV_P2_STATS_METRICS_REGISTRY.md`.
> **Metodo:** auditoria do codigo real via `git grep` / `git ls-files` (sem listar workspace inteiro).
> **Executor de implementacao previsto:** `gpt-5.3-codex` ou Sonnet, por sub-bloco.
> **Data da auditoria:** 2026-06-01. Branch `main`, HEAD `94e97cf5` (feat: P1-A v2 navegacao e dashboard hoje).

---

## 0. Estado do repositorio no momento da auditoria

- Working tree limpo, exceto 2 untracked (os proprios roadmaps `.md`). Nenhum arquivo critico de codigo pendente.
- Scripts disponiveis em `package.json`: `check:mojibake`, `test` (react-scripts), `build` (roda mojibake + build), `start`.
- `docs/` ja existe (`P1_AUDITORIA_INTEGRACAO_UX.md`, `P1_A_NAV_DASHBOARD_DECISIONS.md`, `RELEASE_CHECKLIST.md`).
- **Greenfield confirmado** (nenhum destes arquivos existe ainda):
  - `src/core/metricsRegistry.js` / `.test.js`
  - `src/core/errorActionMap.js` / `.test.js`
  - `src/core/reviewTaskPlanner.js` / `.test.js`
  - `src/core/clinicalReasoningScoring.js` / `.test.js`
  - `src/components/ErrorActionCenter.jsx`, `ErrorActionPrompt.jsx`, `MetricCard.jsx`, `StatsSection.jsx`

---

## 1. Diagnostico do estado atual

### 1.1 Estatisticas (P2)

`src/components/StatsPanel.jsx` (767 linhas) e hoje um **deposito de graficos** sem governanca, confirmando o diagnostico do roadmap. Estrutura atual, em ordem de render:

1. `EnamedMapa` + `AdvancedSection` com `EnamedProvaAnalyzer` (so `plat === "res"`).
2. Card "Padrao de Erros" (dominante / alta confianca+erro / tempo / raciocinio).
3. KPIs (`Preparo estimado`, `Temas`, `Questoes`, `Ciclos`, `Acerto Medio`).
4. Heatmap 12 semanas.
5. Calibracao metacognitiva.
6. Evolucao cronologica de acertos + Forecast FSRS 14 dias.
7. Redacao ENEM (so `plat === "vest"`).
8. Desempenho por especialidade/materia.
9. `AdvancedSection` "Paineis avancados" com `LaunchChecklistPanel` + `WeeklyReview` + `DataSafetyPanel`.

Problemas concretos:

- **Sem secoes nomeadas.** Nao existem as 7 secoes do roadmap (Resumo, Aprendizagem, Erros, Provas/Simulados, Raciocinio Clinico, Atividade, Sistema). Tudo e um stream vertical.
- **Estados "coletando" hardcoded e dispersos.** Ex.: `StatsPanel.jsx:241` (calibracao "Faltam mais X revisoes"), `StatsPanel.jsx:504` (`5 - calibrationData.n`), `StatsPanel.jsx:548` ("Insuficientes dados"). Nao ha regra de confianca central.
- **Sem `metricsRegistry`.** Cada metrica define label/empty/threshold inline. Nenhuma responde de forma padronizada "o que mede / da pra confiar / o que faco".
- **Calculo duplicado de preparo.** `StatsPanel.readinessTrend` (`StatsPanel.jsx:248`) chama `getReadinessData` direto; o Dashboard tambem consome readiness. Risco de divergencia visual entre abas.
- **Raciocinio Clinico ausente de Stats.** Nao ha secao 5 mesmo em `res`.
- **Sistema misturado com aprendizagem.** DataSafety/LaunchChecklist/WeeklyReview ficam num accordion no fim, nao numa secao "Sistema".

### 1.2 Erros (P3)

Existem **tres taxonomias de erro divergentes e nao reconciliadas** — este e o achado mais critico:

| Fonte | Local | Conjunto | Uso |
|---|---|---|---|
| Moderna (canonica) | `src/core/errorTaxonomy.js` | 8 tipos: `conteudo, raciocinio, interpretacao, distracao, tempo, chute, confianca_mal_calibrada, memoria` | `StatsPanel` (card Padrao de Erros), `classifyError`, `summarizeErrors`, `dominantErrorType` |
| Legada | `src/core/readiness.js:181` | 6 tipos: `lacuna, raciocinio, distractor, descuido, nao_visto, interpretacao` | `errorCounts` + `dominantError` no objeto de readiness |
| Reflexao | `src/core/sessionReflection.js:22` (`ALLOWED_ISSUES`) | 7 issues: `conteudo, raciocinio, tempo, energia, distracao, nenhum, memoria` | fechamento de sessao -> `suggestAdjustmentFromReflection` -> ActionInbox |

O roadmap P3 pede uma taxonomia de **12 tipos** (`conteudo, memoria, raciocinio, representacao_problema, diferencial, incerteza_sct, conduta_prescricao, interpretacao, distracao, tempo, confianca_mal_calibrada, estrategia_prova`). Nenhuma das tres cobre isso.

Outros pontos:

- **`errorTaxonomy.js` tem normalizador legado** (`LEGACY_ERROR_MAP`, `errorTaxonomy.js:23`) que ja mapeia `lacuna/nao_visto/distractor/descuido` -> tipos modernos. **Esse e o ponto de ancoragem natural** para unificar a taxonomia em P3 sem perder dados antigos.
- **`readiness.errorCounts` so le `simulados[].questoesErradas`** (`readiness.js:184`), ignorando os erros estruturados de revisoes (`tema.rev[step].erros`) que o `StatsPanel.errorAnalytics` (`StatsPanel.jsx:290`) ja agrega. Ou seja, o "dominantError" do readiness e mais pobre que o do Stats.
- **Mentor NAO consome erro dominante.** `git grep dominantError|erroDominante` em `mentor.js`, `mentorSignals.js`, `mentorDecisionPolicy.js`, `mentorAutopilot.js`, `Dashboard.jsx` retorna vazio. O loop "Mentor usa erro dominante" do criterio de aceite **nao existe hoje**.
- **Loop pos-erro parcialmente montado.** `sessionReflection.reflectionToAction` (`sessionReflection.js:90`) ja gera acoes (`review/exam_analysis/clinical_case/anki/rest`) e o `store.addSessionReflection` (`store.js:376`) ja injeta no ActionInbox. Mas o mapeamento e por `mainIssue` (7 valores), nao por taxonomia de erro de questao, e nao ha tela dedicada de "Centro de Erros".

### 1.3 Raciocinio Clinico (P4)

- **`calcRaciocinioScore` triplicado com formulas e campos divergentes** (confirma a auditoria do roadmap):
  - `RaciocinioClinico.jsx:24` — media simples de `fase2Acerto` e `sctAcerto`.
  - `readiness.js:25` — media ponderada 0.6 `fase2Acerto` / 0.4 `sctAcerto`.
  - `illnessScript.js:424` — media de `notaCaso`.
- **Risco silencioso grave:** `RaciocinioClinico` (`registrarCaso`, ver `RaciocinioClinico.jsx:93-131`) grava `fase1Ok / fase2Acerto / sctAcerto / anamneseCobertura`, mas **nunca grava `notaCaso`**. Logo, `illnessScript.calcRaciocinioScore` retorna `null` na pratica (ramo morto), enquanto a UI mostra a versao nao-ponderada e o readiness usa a ponderada. Tres numeros possiveis para a "mesma" metrica.
- **Casos insuficientes:** `src/constants/casosClinicos.js` tem **apenas 2 casos** (`apendicite-classica`, `pre-eclampsia-grave`).
- **Sem `reviewTaskPlanner` e sem `clinicalCaseMatch`.** Nao ha vinculo do caso clinico com o tema-pai do cronograma nem agendamento por estagio FSRS (D1/D4/D7/D21).
- **Brain dump existe, mas generico.** `FocusMode.jsx` ja tem fluxo `d1` ("D1 BRAIN DUMP FLUX", `FocusMode.jsx:1168`) ligado ao step FSRS, **nao** o brain dump estruturado em 5 campos (definicao/diagnostico/diferenciais/conduta/nao-pode-perder) do roadmap. Nao ha modo de revisao multimodal por estagio.
- **Conduta/prescricao simulada ausente.** `git grep prescric` em FocusMode = vazio.
- **Plataforma ja gateia corretamente.** `platformFeatures.js` expoe `raciocinioClinico/illnessScript/casosClinicos = !isVest`. `App.js:1156` e `BottomNav.jsx:56` exigem `featureEnabled(plat,...) && meta.modulos?.raciocinioClinico === true`. `readiness.js:97` so calcula score se `meta.modulos.raciocinioClinico`. Boa base; P4 deve reusar esse gate, nao criar novo.

---

## 2. Riscos de integracao

| # | Risco | Evidencia | Mitigacao |
|---|---|---|---|
| R1 | **Triplicacao de score** continua e gera numeros diferentes entre Stats/Readiness/UI | `calcRaciocinioScore` em 3 arquivos com campos divergentes | P4-A: 1 fonte canonica em `clinicalReasoningScoring.js`; os outros 2 viram re-export/adaptador. Manter teste de equivalencia. |
| R2 | **Quarta taxonomia de erro.** P3 introduzir 12 tipos sem reconciliar as 3 atuais multiplica o problema | tabela 1.2 | P3-A: `errorActionMap` deve consumir o tipo **canonico de `errorTaxonomy.js`**, estendendo-o (nao criar enum paralelo). Reusar `LEGACY_ERROR_MAP`. |
| R3 | **Divergencia Stats vs Dashboard de "Preparo".** Ambos derivam de readiness por caminhos proprios | `StatsPanel.jsx:248`, readiness consumido em Dashboard | P2: metrica `trueRetention`/`readiness` passa pelo registry; Dashboard e Stats leem o mesmo `evaluateMetric`. Sem dependencia circular (roadmap secao 12). |
| R4 | **Vazamento de medicina no Vestibular.** Nova secao Raciocinio/Erros pode renderizar em `vest` | gate existe mas e por-call-site | P2/P3/P4: toda secao nova consulta `featureEnabled(plat, ...)`/`getMetricsForSection(section, plat)`. Teste explicito "vest nao recebe ENAMED nem Raciocinio". |
| R5 | **Mojibake.** Projeto tem barreira `check:mojibake` no build | `package.json:20,25` | Escrever todos os arquivos novos em UTF-8 limpo; rodar `npm run check:mojibake` antes de qualquer commit (commit fora de escopo aqui). |
| R6 | **`illnessScript.calcRaciocinioScore` e ramo morto** (le `notaCaso` nunca gravado) | `illnessScript.js:424` vs `RaciocinioClinico.jsx:93` | P4-A decide: ou `registrarCaso` passa a gravar `notaCaso` canonico, ou a funcao e descontinuada. Nao deixar 3 contratos. |
| R7 | **ActionInbox dedupe pode engolir acoes corretivas.** `dedupeActions` usa chave `type|tema|area|dueDate` | `actionInbox.js:52` | P3: acoes corretivas devem ter `type`/`target` que nao colidam com revisoes diarias; validar com teste de dedupe. |
| R8 | **Lazy/Suspense em Stats.** `EnamedProvaAnalyzer/WeeklyReview/DataSafetyPanel` sao lazy | `StatsPanel.jsx:14-16` | Ao reorganizar em secoes, preservar os boundaries de Suspense para nao quebrar code-splitting. |
| R9 | **Bloco N (multiusuario) nao concluido.** Roadmap pre-condicao 2 pede nao tocar dados persistentes novos | `MEDREV_BLOCO_N...md` existe | P2/P3/P4 nao criam novas chaves persistidas alem do minimo; reusar `casosProgresso`, `sessionReflections`, `actionInbox`. Activity Log fica pos-N. |
| R10 | **2 casos clinicos** tornam metricas de raciocinio nao confiaveis | `casosClinicos.js` | P4: registry marca `clinicalReasoningScore` como `collecting`/`low_confidence` ate amostra minima; nao mostrar 100% com 1 caso. |

---

## 3. Plano em sequencia (P2 -> P3 -> P4)

Ordem obrigatoria (roadmap secao 3). **Nao executar tudo junto.** Cada sub-bloco e um PR pequeno com build/test/mojibake verdes.

### P2 — Estatisticas e metricas acionaveis

**P2-A — `metricsRegistry` + reorganizacao leve**
- Criar `src/core/metricsRegistry.js` com API do roadmap: `METRIC_STATUS`, `getMetricDefinition`, `evaluateMetric`, `getMetricsForSection(section, plat)`, `formatMetricValue`.
- Metricas obrigatorias (nomes do registry detalhado): `trueRetention, todayWorkloadMinutes, overdueReviews, relearningCount, coverageByArea, simuladoAccuracy, enamedGap, dominantError, clinicalReasoningScore, ankiAdherence, weeklyConsistency`.
- Cada definicao com `{ id, label, shortLabel, section, description, emptyState, confidenceRule, actionWhenLow, platforms }`.
- `dominantError` deve ler o tipo canonico de `errorTaxonomy.js`; `clinicalReasoningScore` deve ter `platforms: ["res"]`.
- Centralizar os "coletando" hardcoded de StatsPanel via `confidenceRule`/`emptyState`.

**P2-B — `StatsPanel` em 7 secoes**
- Refatorar `StatsPanel.jsx` para tabs/segmented (desktop) + accordion (mobile): Resumo, Aprendizagem, Erros, Provas/Simulados, Raciocinio Clinico, Atividade, Sistema.
- Resumo usa registry (max 6 cards: preparo, retencao longa, carga, vencidas, relearning, proxima acao do Mentor).
- Erros: reusar `errorAnalytics` atual; se `errorActionMap` nao existir, placeholder "Centro de Erros sera ativado no P3".
- Raciocinio Clinico: so `res`, com dados existentes; **nao** criar novo `calcRaciocinioScore`.
- Sistema: mover DataSafety/Launch/WeeklyReview para ca, preservando lazy/Suspense.
- Dashboard nao ganha cards novos; le do mesmo registry.

### P3 — Centro de Erros e acoes corretivas

**P3-A — `errorActionMap` (core)**
- Criar `src/core/errorActionMap.js` estendendo a taxonomia canonica de `errorTaxonomy.js` para os 12 tipos do roadmap (acrescentar `representacao_problema, diferencial, incerteza_sct, conduta_prescricao, estrategia_prova`; manter retrocompatibilidade via `LEGACY_ERROR_MAP`).
- Mapa tipo->acao corretiva (ex.: `memoria -> FSRS/Anki`, `raciocinio -> mini caso + problem representation`, `diferencial -> 3 diferenciais + must-not-miss`, `conduta_prescricao -> management station educacional`, `tempo -> bloco cronometrado`, `confianca_mal_calibrada -> estimativa previa + revisao calibrada`).
- Saida deve casar com `actionInbox.createAction` (type/target/priority) para nao quebrar dedupe (R7).

**P3-B — `ErrorActionCenter` + `ErrorActionPrompt` integrados**
- `ErrorActionCenter.jsx`: tela de leitura/acao (errei por que -> o que faco agora), alimentada por `errorActionMap` + `errorTaxonomy.summarizeErrors`.
- `ErrorActionPrompt.jsx`: CTA reutilizavel em pos-sessao e pos-simulado.
- Pontos de integracao (roadmap): Stats secao Erros; Mais como ferramenta; pos-sessao (CTA); pos-simulado (CTA); Mentor (acao corretiva). **Nao** criar aba solta.
- **Fechar o loop do Mentor (R-aceite):** Mentor passa a consumir `dominantError` (hoje ausente) via signal novo em `mentorSignals.js`, alimentando a "proxima melhor acao".

### P4 — Raciocinio Clinico integrado ao FSRS (apenas Residencia)

**P4-A — Unificar `calcRaciocinioScore`**
- Criar `src/core/clinicalReasoningScoring.js` como fonte unica (definir contrato: campos de `casosProgresso` e pesos). Resolver R6: decidir `notaCaso` canonico ou descontinuar.
- `readiness.js`, `RaciocinioClinico.jsx` e `illnessScript.js` passam a importar dessa fonte (re-export/adaptador). Teste de equivalencia para garantir 1 numero.

**P4-B — `reviewTaskPlanner`**
- Criar `src/core/reviewTaskPlanner.js`: mapeia estagio FSRS do tema-pai -> modalidade de revisao (D1 brain dump, D4 illness recall, D7 mini caso, D21 SCT+conduta, manutencao caso rapido). Inclui `clinicalCaseMatch` (caso <-> tema-pai).

**P4-C — `FocusMode` multimodal**
- Estender `FocusMode.jsx` para renderizar a modalidade vinda do `reviewTaskPlanner` quando o tema for clinico e `plat === "res"`. Brain dump estruturado em 5 campos. Reusar gate de plataforma.

**P4-D — Raciocinio Clinico com conduta/prescricao simulada**
- Adicionar fase de conduta/prescricao em `RaciocinioClinico.jsx` (campos do roadmap: estabilizacao, exames, tratamento, doses quando houver checklist, internacao/ambulatorio, red flags, contraindicacoes, seguimento) com aviso obrigatorio "Uso educacional. Nao aplicar em paciente real."
- (Opcional, fora do core de codigo) ampliar `casosClinicos.js` para reduzir R10 — tratar como conteudo, nao bloqueia o codigo.

---

## 4. Arquivos a tocar por fase

| Fase | Criar | Editar | So leitura/refs |
|---|---|---|---|
| P2-A | `src/core/metricsRegistry.js`, `src/core/metricsRegistry.test.js` | — | `readiness.js`, `useMetrics.js`, `errorTaxonomy.js`, `calibration.js` |
| P2-B | `src/components/MetricCard.jsx`*, `src/components/StatsSection.jsx`*, `docs/P2_STATS_DECISIONS.md` | `src/components/StatsPanel.jsx` | `Dashboard.jsx` (garantir que nao engorda), `App.js:1145` |
| P3-A | `src/core/errorActionMap.js`, `src/core/errorActionMap.test.js` | `src/core/errorTaxonomy.js` (estender) | `actionInbox.js`, `sessionReflection.js` |
| P3-B | `src/components/ErrorActionCenter.jsx`, `src/components/ErrorActionPrompt.jsx`, `docs/P3_ERROR_ACTION_DECISIONS.md` | `StatsPanel.jsx` (secao Erros), `FocusMode.jsx`/`EnamedProvaAnalyzer.jsx` (CTA pos-sessao/prova), `mentor.js`/`mentorSignals.js` (consumir dominantError) | `store.js:376,405` (ActionInbox) |
| P4-A | `src/core/clinicalReasoningScoring.js`, `.test.js`, `docs/P4_CLINICAL_REASONING_FSRS_DECISIONS.md` | `readiness.js:25`, `RaciocinioClinico.jsx:24`, `illnessScript.js:424` | `store.js:1132` (`registrarCaso`) |
| P4-B | `src/core/reviewTaskPlanner.js`, `.test.js` | — | `fsrs.js`, `illnessScript.js`, `casosClinicos.js` |
| P4-C | — | `src/components/FocusMode.jsx` | `platformFeatures.js`, `reviewTaskPlanner.js` |
| P4-D | — | `src/components/RaciocinioClinico.jsx` | `casosClinicos.js`, `SessionClosureModal.jsx` |

`*` criar so se ajudar; o roadmap marca `MetricCard`/`StatsSection` como opcionais.

---

## 5. Testes necessarios

**P2 (`metricsRegistry.test.js`):**
- `getMetricDefinition` existe para todas as metricas obrigatorias.
- `trueRetention` -> `collecting` sem `n` suficiente; `low_confidence` com `n` baixo.
- `getMetricsForSection("...", "vest")` nao retorna `enamedGap` nem `clinicalReasoningScore`.
- `clinicalReasoningScore` so em `res`.
- `getMetricsForSection` devolve as secoes corretas.
- `formatMetricValue` nao quebra com `null`.
- Smoke de `StatsPanel` (se houver) atualizado para as 7 secoes.

**P3 (`errorActionMap.test.js`):**
- Todos os 12 tipos tem acao corretiva mapeada.
- Tipos legados (`lacuna, nao_visto, distractor, descuido`) normalizam para o canonico antes de mapear.
- Acao gerada e compativel com `actionInbox.createAction` (campos `type/target/priority`) e nao colide no `dedupeActions`.
- `dominantError` integrado ao Mentor produz a acao esperada (teste de signal).

**P4:**
- `clinicalReasoningScoring.test.js`: um unico score para o mesmo `casosProgresso`; equivalencia entre os call-sites; retorna `null`/`collecting` com amostra insuficiente (R10).
- `reviewTaskPlanner.test.js`: estagio FSRS -> modalidade correta; `clinicalCaseMatch` liga caso ao tema-pai; nada gerado quando `plat === "vest"`.

**Transversal:** `npm test -- --watchAll=false`, `npm run check:mojibake`, `npm run build` verdes ao fim de cada sub-bloco.

---

## 6. Criterios de aceite

Herdados do roadmap (secao 4 global + secao 15 do registry), tornados verificaveis:

- [ ] Stats dividido em 7 secoes nomeadas; cada metrica do Resumo tem valor + confianca + explicacao + acao.
- [ ] `metricsRegistry` existe com testes verdes.
- [ ] Dashboard nao ganhou cards novos e nao tem dependencia circular com Stats.
- [ ] ENAMED nao aparece em `vest`; Raciocinio Clinico nao aparece em `vest`.
- [ ] DataSafety/LaunchChecklist nao poluem a secao Aprendizagem (estao em Sistema).
- [ ] Centro de Erros aparece em Stats/Mais/pos-sessao/pos-simulado/Mentor — nao como aba solta.
- [ ] Erro vira acao corretiva e o Mentor usa o erro dominante (signal novo verificavel).
- [ ] `calcRaciocinioScore` tem fonte unica; os 3 call-sites convergem para o mesmo valor.
- [ ] Raciocinio Clinico entra no FSRS via `reviewTaskPlanner` quando apropriado (so `res`).
- [ ] Conduta/prescricao simulada exibe o aviso "Uso educacional. Nao aplicar em paciente real."
- [ ] `check:mojibake`, testes e build passam em cada sub-bloco.

---

## 7. O que NAO implementar agora

- **Activity Log / calendario historico completo** — fica pos-Bloco N (roadmap secao 0 e registry secao 8).
- **Bloco N (multiusuario/isolamento de dados)** — nao criar novas chaves persistidas; reusar as existentes (R9).
- **Refactor profundo do Mentor** — em P3 apenas adicionar consumo de `dominantError`, sem reescrever a politica de decisao.
- **Firebase/auth/localStorage novos** — fora de escopo.
- **Bibliotecas novas** — proibido instalar libs.
- **Reescrever `errorTaxonomy.js` do zero** — apenas estender (preservar `LEGACY_ERROR_MAP` para nao perder dados antigos).
- **Tudo de uma vez** — respeitar a sequencia P2-A -> P2-B -> P3-A -> P3-B -> P4-A -> P4-B -> P4-C -> P4-D.
- **Commit / push / deploy** — nenhum, nesta auditoria nem implicitamente nas fases (responsabilidade do operador humano).
- **Expandir massa de casos clinicos** como bloqueio de codigo — e tarefa de conteudo; o codigo deve degradar bem com poucos casos (R10).

---

## Apendice — evidencias (file:line)

- Stats sem secoes / coletando hardcoded: `src/components/StatsPanel.jsx:241,290,501,548`.
- 3 taxonomias de erro: `src/core/errorTaxonomy.js:1`, `src/core/readiness.js:181`, `src/core/sessionReflection.js:22`.
- Normalizador legado reusavel: `src/core/errorTaxonomy.js:23`.
- Mentor sem consumo de erro dominante: `git grep dominantError|erroDominante` em mentor* / Dashboard = vazio.
- Loop pos-sessao existente: `src/core/sessionReflection.js:90`, `src/core/store.js:376,405`.
- `calcRaciocinioScore` triplicado: `src/components/RaciocinioClinico.jsx:24`, `src/core/readiness.js:25`, `src/core/illnessScript.js:424`.
- `notaCaso` nunca gravado por `registrarCaso`: `src/components/RaciocinioClinico.jsx:93-131` vs `src/core/illnessScript.js:424`.
- 2 casos clinicos: `src/constants/casosClinicos.js` (`apendicite-classica`, `pre-eclampsia-grave`).
- Brain dump generico ja existente: `src/components/FocusMode.jsx:1168` (`stepKey === "d1"`).
- Gate de plataforma: `src/core/platformFeatures.js:6`, `src/App.js:1156`, `src/components/BottomNav.jsx:56`, `src/core/readiness.js:97`.
</content>
</invoke>

```

### src/components/ClinicalTaskPanel.jsx

```txt
// src/components/ClinicalTaskPanel.jsx
// Painel de tarefa clinica multimodal para FocusMode.
// Aparece nos steps D4 (illness recall), D7 (mini caso), D21/manutencao (SCT).
// O D1 ja tem brain dump proprio no FocusMode — nao e substituido.
//
// Comportamento:
//   - Colapsavel: comeca fechado para nao bloquear o fluxo padrao
//   - Respostas sao estado local (nao gravadas no store — P4-C)
//   - Nao substitui AcertoInputs — e um painel adicional
//   - Feature-gated: so renderiza quando task != null
//   - Aviso de uso educacional em conduta/SCT
import React, { useState } from "react";
import { Brain, ChevronDown, ChevronUp, BookOpen, Stethoscope, FlaskConical } from "lucide-react";
import { TASK_TYPE } from "../core/reviewTaskPlanner";

// ─── Icone por tipo ───────────────────────────────────────────────────────────

const TASK_ICON = {
  [TASK_TYPE.BRAIN_DUMP]: Brain,
  [TASK_TYPE.ILLNESS_RECALL]: BookOpen,
  [TASK_TYPE.MINI_CASE]: Stethoscope,
  [TASK_TYPE.SCT]: FlaskConical,
};

const TASK_COLOR = {
  [TASK_TYPE.BRAIN_DUMP]: "text-purple-400",
  [TASK_TYPE.ILLNESS_RECALL]: "text-blue-400",
  [TASK_TYPE.MINI_CASE]: "text-teal-400",
  [TASK_TYPE.SCT]: "text-amber-400",
};

const TASK_BORDER = {
  [TASK_TYPE.BRAIN_DUMP]: "border-purple-500/20",
  [TASK_TYPE.ILLNESS_RECALL]: "border-blue-500/20",
  [TASK_TYPE.MINI_CASE]: "border-teal-500/20",
  [TASK_TYPE.SCT]: "border-amber-500/20",
};

const TASK_BG = {
  [TASK_TYPE.BRAIN_DUMP]: "bg-purple-950/10",
  [TASK_TYPE.ILLNESS_RECALL]: "bg-blue-950/10",
  [TASK_TYPE.MINI_CASE]: "bg-teal-950/10",
  [TASK_TYPE.SCT]: "bg-amber-950/10",
};

// ─── Campo de resposta ────────────────────────────────────────────────────────

function TaskField({ field, value, onChange, color }) {
  return (
    <div className="space-y-1.5">
      <label className={`block text-[10px] font-bold uppercase tracking-wider ${color}`}>
        {field.label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-[12px] text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-white/20 transition-colors leading-relaxed"
      />
    </div>
  );
}

// ─── ClinicalTaskPanel ────────────────────────────────────────────────────────

/**
 * Props:
 *   task    object|null  resultado de getReviewTaskForStep
 *   className string
 */
export default function ClinicalTaskPanel({ task, className = "" }) {
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState({});

  if (!task || task.taskType === TASK_TYPE.STANDARD) return null;

  const { taskType, description, caso, tema } = task;
  const Icon = TASK_ICON[taskType] || Brain;
  const color = TASK_COLOR[taskType] || "text-blue-400";
  const border = TASK_BORDER[taskType] || "border-blue-500/20";
  const bg = TASK_BG[taskType] || "bg-blue-950/10";

  const handleChange = (key, val) => setResponses((prev) => ({ ...prev, [key]: val }));
  const filledCount = Object.values(responses).filter((v) => String(v || "").trim().length > 0).length;
  const totalFields = description.fields.length;

  const isSctOrManagement = taskType === TASK_TYPE.SCT;

  return (
    <div className={`${bg} border ${border} rounded-2xl overflow-hidden ${className}`}>
      {/* Header colapsavel */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon size={15} className={`${color} shrink-0`} />
          <div className="text-left min-w-0">
            <p className={`text-[11px] font-bold ${color}`}>
              {description.shortLabel} — {description.label}
            </p>
            {caso && (
              <p className="text-[10px] text-gray-500 truncate">
                Caso: {caso.tema || caso.area || "clinico"}
              </p>
            )}
            {!caso && tema && (
              <p className="text-[10px] text-gray-500 truncate">
                Tema: {tema.nome}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {open && filledCount > 0 && (
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-900/30 border border-emerald-600/20 px-2 py-0.5 rounded-full">
              {filledCount}/{totalFields}
            </span>
          )}
          <span className="text-[9px] text-gray-600 font-semibold uppercase tracking-wide">
            {open ? "fechar" : `${description.durationMin} min`}
          </span>
          {open ? <ChevronUp size={13} className="text-gray-500" /> : <ChevronDown size={13} className="text-gray-500" />}
        </div>
      </button>

      {/* Conteudo */}
      {open && (
        <div className="p-4 pt-0 space-y-4">
          {/* Instrucao */}
          <div className="border-t border-white/5 pt-4">
            <p className="text-[11px] text-gray-400 leading-relaxed">{description.instruction}</p>
          </div>

          {/* Vinheta do caso (se disponivel) */}
          {caso?.vinheta && (
            <div className="bg-black/30 border border-white/5 rounded-xl p-3">
              <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">Vinheta clinica</p>
              <p className="text-[12px] text-gray-300 leading-relaxed">{caso.vinheta}</p>
            </div>
          )}

          {/* Campos de resposta */}
          <div className="space-y-3">
            {description.fields.map((field) => (
              <TaskField
                key={field.key}
                field={field}
                value={responses[field.key] || ""}
                onChange={handleChange}
                color={color}
              />
            ))}
          </div>

          {/* Aviso educacional para SCT/conduta */}
          {isSctOrManagement && (
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3">
              <p className="text-[10px] text-amber-400 font-bold">Aviso educacional</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Esta atividade e exclusivamente para fins de estudo. Nao aplicar decisoes terapeuticas
                em pacientes reais com base neste exercicio.
              </p>
            </div>
          )}

          {/* Indicador de preenchimento */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <p className="text-[10px] text-gray-600">
              {filledCount}/{totalFields} campos preenchidos
            </p>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex-1 mx-3">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  filledCount === totalFields ? "bg-emerald-500" : `bg-gradient-to-r from-blue-600 to-sky-400`
                }`}
                style={{ width: `${(filledCount / totalFields) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-600">{description.durationMin} min</p>
          </div>
        </div>
      )}
    </div>
  );
}

```

### src/components/ErrorActionCenter.jsx

```txt
// src/components/ErrorActionCenter.jsx
// Centro de Erros: mostra padrao de erros + acoes corretivas especificas por tipo.
// Aparece em: Stats > Erros, Mais > ferramentas.
// Nao e uma aba solta — e embutido nas secoes corretas.
import React, { useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { useStore } from "../core/store";
import { STEPS } from "../core/fsrs";
import {
  ERROR_TYPE_LABEL, dominantErrorType, summarizeErrors, normalizeErrorType,
} from "../core/errorTaxonomy";
import { getCorrectiveAction, getActionsForPlatform } from "../core/errorActionMap";

// ─── Helpers ────────────────────────────────────────────────────────────────

function severityColor(count, max) {
  if (count === 0) return "text-gray-600";
  const ratio = max > 0 ? count / max : 0;
  if (ratio >= 0.5) return "text-red-400";
  if (ratio >= 0.25) return "text-amber-400";
  return "text-blue-400";
}

// ─── Linha de tipo de erro ────────────────────────────────────────────────────

function ErrorTypeRow({ tipo, count, max, action, expanded, onToggle }) {
  const label = ERROR_TYPE_LABEL[tipo] || tipo;
  const color = severityColor(count, max);

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-[#111113] hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-xl font-black tabular-nums w-8 text-right shrink-0 ${color}`}>{count}</span>
          <span className="text-[12px] font-semibold text-gray-200 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {count === 0 && <span className="text-[10px] text-gray-600">sem ocorrencias</span>}
          {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </div>
      </button>

      {expanded && action && count > 0 && (
        <div className="bg-black/30 border-t border-white/5 p-4 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">O que e</p>
            <p className="text-[12px] text-gray-300 leading-relaxed">{action.definition}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Acoes corretivas</p>
            <ul className="space-y-1.5">
              {action.correctiveActions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-gray-400 leading-relaxed">
                  <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
          {action.fsrsEffect && (
            <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold mb-0.5">Efeito no FSRS</p>
              <p className="text-[11px] text-gray-400">{action.fsrsEffect}</p>
            </div>
          )}
        </div>
      )}

      {expanded && count === 0 && (
        <div className="bg-black/20 border-t border-white/5 p-3">
          <p className="text-[11px] text-gray-600">Nenhuma ocorrencia deste tipo de erro ainda.</p>
        </div>
      )}
    </div>
  );
}

// ─── ErrorActionCenter ────────────────────────────────────────────────────────

/**
 * Props:
 *   compact  bool    se true, mostra apenas os top 3 erros com > 0 ocorrencias
 */
export default function ErrorActionCenter({ compact = false }) {
  const plat = useStore((s) => s.plat);
  const temas = useStore((s) => s[plat]?.temas || []);
  const simulados = useStore((s) => s[plat]?.simulados || []);

  const [expanded, setExpanded] = useState({});
  const toggleExpanded = (tipo) => setExpanded((prev) => ({ ...prev, [tipo]: !prev[tipo] }));

  // Coletar erros de revisoes e simulados
  const { errors, summary, dominant, total } = useMemo(() => {
    const fromReviews = temas.flatMap((tema) =>
      STEPS.flatMap((step) => {
        const review = tema.rev?.[step.key];
        if (!review?.done) return [];
        const structured = Array.isArray(review.erros) ? review.erros : [];
        const fallback = Array.isArray(review.motivosErro)
          ? review.motivosErro.map((tipoErro) => ({ tipoErro, acertou: false, confianca: review.confianca }))
          : [];
        return [...structured, ...fallback];
      })
    );
    const fromSimulados = simulados.flatMap((sim) =>
      (sim.questoesErradas || []).map((q) => ({
        tipoErro: q.tipoErro,
        acertou: false,
        confianca: q.confianca,
        tempoExcedido: Boolean(q.tempoExcedido),
      }))
    );
    const allErrors = [...fromReviews, ...fromSimulados];
    return {
      errors: allErrors,
      summary: summarizeErrors(allErrors),
      dominant: dominantErrorType(allErrors),
      total: allErrors.length,
    };
  }, [temas, simulados]);

  // Tipos validos para a plataforma
  const platformActions = useMemo(() => getActionsForPlatform(plat), [plat]);
  const platformTypes = platformActions.map((a) => a.type);

  // Ordenar tipos por contagem decrescente, depois por tipo
  const sortedTypes = useMemo(() => {
    return platformTypes
      .map((tipo) => ({ tipo, count: summary[tipo] || 0 }))
      .sort((a, b) => b.count - a.count || a.tipo.localeCompare(b.tipo));
  }, [platformTypes, summary]);

  const maxCount = sortedTypes[0]?.count || 1;

  // Modo compacto: so tipos com > 0 ocorrencias (max 4)
  const displayTypes = compact
    ? sortedTypes.filter((t) => t.count > 0).slice(0, 4)
    : sortedTypes;

  if (total === 0) {
    return (
      <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 text-center space-y-2">
        <Info size={24} className="text-gray-700 mx-auto" />
        <p className="text-[12px] text-gray-500">
          Sem erros suficientes para padrao dominante.
        </p>
        <p className="text-[11px] text-gray-600">
          Complete mais sessoes e simulados para ver o painel de acoes corretivas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[13px] font-bold text-white">Centro de Erros</p>
          <p className="text-[11px] text-gray-500">
            {total} ocorrencias · Erro dominante:{" "}
            <span className="text-amber-300 font-semibold">
              {dominant ? (ERROR_TYPE_LABEL[dominant] || dominant) : "—"}
            </span>
          </p>
        </div>
        {dominant && (
          <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-900/30 text-amber-400 border border-amber-600/20 flex items-center gap-1 shrink-0">
            <AlertTriangle size={9} /> {ERROR_TYPE_LABEL[dominant] || dominant}
          </span>
        )}
      </div>

      {/* Lista de tipos */}
      <div className="space-y-1.5">
        {displayTypes.map(({ tipo, count }) => {
          const action = getCorrectiveAction(tipo);
          return (
            <ErrorTypeRow
              key={tipo}
              tipo={tipo}
              count={count}
              max={maxCount}
              action={action}
              expanded={Boolean(expanded[tipo])}
              onToggle={() => toggleExpanded(tipo)}
            />
          );
        })}
      </div>

      {compact && sortedTypes.filter((t) => t.count > 0).length > 4 && (
        <p className="text-[10px] text-gray-600 text-center">
          + {sortedTypes.filter((t) => t.count > 0).length - 4} outros tipos. Veja a secao Erros completa.
        </p>
      )}
    </div>
  );
}

```

### src/components/ErrorActionPrompt.jsx

```txt
// src/components/ErrorActionPrompt.jsx
// CTA compacto de acao corretiva — aparece pos-sessao, pos-simulado e no Mentor.
// Nao e uma aba solta. E um componente embutido em contextos especificos.
import React from "react";
import { AlertTriangle, ChevronRight, X } from "lucide-react";
import { getCorrectiveAction } from "../core/errorActionMap";
import { ERROR_TYPE_LABEL } from "../core/errorTaxonomy";

/**
 * ErrorActionPrompt
 *
 * Props:
 *   dominantError   string        tipo canonico de erro dominante
 *   context         string        "pos-sessao" | "pos-simulado" | "mentor" | "stats"
 *   tema            string|null   nome do tema (opcional)
 *   onAction        fn()          callback quando usuario clica em Ver acao corretiva
 *   onDismiss       fn()|null     callback para fechar (null = nao mostra X)
 *   className       string
 */
export default function ErrorActionPrompt({
  dominantError,
  context = "pos-sessao",
  tema = null,
  onAction,
  onDismiss = null,
  className = "",
}) {
  const action = dominantError ? getCorrectiveAction(dominantError) : null;
  if (!action) return null;

  const label = ERROR_TYPE_LABEL[dominantError] || dominantError;
  const firstAction = action.correctiveActions[0] || "";

  const CONTEXT_PREFIX = {
    "pos-sessao": "Sessao concluida.",
    "pos-simulado": "Simulado analisado.",
    "mentor": "Padrao identificado.",
    "stats": "Padrao de erros.",
  };

  return (
    <div className={`bg-amber-950/20 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 ${className}`}>
      <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-amber-300 font-bold">
          {CONTEXT_PREFIX[context] || ""}{" "}
          <span className="text-amber-200">Erro dominante: {label}.</span>
        </p>
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{firstAction}</p>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors"
          >
            Ver acao corretiva <ChevronRight size={12} />
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-gray-600 hover:text-gray-400 transition-colors shrink-0 mt-0.5"
          aria-label="Fechar"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

```

### src/components/MetricCard.jsx

```txt
// src/components/MetricCard.jsx
// Card padrao para exibir uma metrica do registry com:
//   valor, status de confianca, descricao curta, acao recomendada.
import React from "react";
import { AlertTriangle, Info, TrendingUp, TrendingDown } from "lucide-react";
import { METRIC_STATUS } from "../core/metricsRegistry";

const STATUS_STYLE = {
  [METRIC_STATUS.COLLECTING]: {
    badge: "bg-gray-700/60 text-gray-400 border-gray-600/30",
    label: "Coletando",
    icon: Info,
    valueColor: "text-gray-500",
  },
  [METRIC_STATUS.LOW_CONFIDENCE]: {
    badge: "bg-yellow-900/30 text-yellow-400 border-yellow-600/20",
    label: "Baixa amostra",
    icon: Info,
    valueColor: "text-yellow-400",
  },
  [METRIC_STATUS.OK]: {
    badge: "bg-emerald-900/30 text-emerald-400 border-emerald-600/20",
    label: "OK",
    icon: null,
    valueColor: "text-emerald-400",
  },
  [METRIC_STATUS.WARNING]: {
    badge: "bg-amber-900/30 text-amber-400 border-amber-600/20",
    label: "Atencao",
    icon: AlertTriangle,
    valueColor: "text-amber-400",
  },
  [METRIC_STATUS.CRITICAL]: {
    badge: "bg-red-900/30 text-red-400 border-red-600/20",
    label: "Critico",
    icon: AlertTriangle,
    valueColor: "text-red-400",
  },
};

/**
 * MetricCard
 *
 * Props:
 *   label       string          nome da metrica
 *   value       string          valor ja formatado (use formatMetricValue)
 *   status      METRIC_STATUS   define a cor/badge
 *   description string          descricao curta do que mede
 *   emptyState  string          texto quando coletando
 *   action      string|null     acao recomendada quando ruim
 *   trend       number|null     delta numerico (+5/-3) para sparkline textual
 *   className   string          classes extras
 */
export default function MetricCard({
  label,
  value,
  status = METRIC_STATUS.COLLECTING,
  description,
  emptyState,
  action,
  trend,
  className = "",
}) {
  const style = STATUS_STYLE[status] || STATUS_STYLE[METRIC_STATUS.COLLECTING];
  const StatusIcon = style.icon;
  const isCollecting = status === METRIC_STATUS.COLLECTING || status === METRIC_STATUS.LOW_CONFIDENCE;

  return (
    <div
      className={`bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col justify-between gap-2 min-h-[100px] ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] text-gray-500 uppercase font-semibold leading-tight flex-1">{label}</p>
        <span
          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${style.badge}`}
        >
          {StatusIcon && <StatusIcon size={9} />}
          {style.label}
        </span>
      </div>

      {/* Valor */}
      <div className="flex items-baseline gap-2">
        <p className={`text-2xl font-black tabular-nums leading-none ${style.valueColor}`}>
          {isCollecting ? "—" : value}
        </p>
        {trend != null && !isCollecting && (
          <span
            className={`text-[10px] font-bold flex items-center gap-0.5 ${
              trend > 0 ? "text-emerald-400" : trend < 0 ? "text-red-400" : "text-gray-500"
            }`}
          >
            {trend > 0 ? <TrendingUp size={11} /> : trend < 0 ? <TrendingDown size={11} /> : null}
            {trend > 0 ? `+${trend}` : trend}
          </span>
        )}
      </div>

      {/* Descricao / estado vazio */}
      {isCollecting ? (
        <p className="text-[10px] text-gray-500 leading-relaxed">
          {status === METRIC_STATUS.LOW_CONFIDENCE
            ? `Amostra insuficiente — ${description}`
            : emptyState}
        </p>
      ) : description ? (
        <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-2">{description}</p>
      ) : null}

      {/* Acao recomendada */}
      {action && !isCollecting && (
        <p className={`text-[10px] leading-relaxed border-t border-white/5 pt-1.5 mt-0.5 ${style.valueColor} opacity-80`}>
          {action}
        </p>
      )}
    </div>
  );
}

```

### src/components/VestibularStartTrail.jsx

```txt
import React, { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useStore } from "../core/store";
import {
  getVestibularStart,
  updateVestibularStart,
  recommendVestibularFirstAction,
} from "../core/vestibularOnboarding";

const EXAM_OPTIONS = ["ENEM", "Fuvest", "Unicamp", "Outra"];

export default function VestibularStartTrail({ setView, onOpenAjustes }) {
  const plat = useStore((s) => s.plat);
  const meta = useStore((s) => s.meta || {});
  const temas = useStore((s) => s[plat]?.temas || []);
  const simulados = useStore((s) => s[plat]?.simulados || []);
  const showToast = useStore((s) => s.showToast);
  const [step, setStep] = useState(0);
  const [examDateInput, setExamDateInput] = useState("");

  const start = useMemo(() => getVestibularStart(meta), [meta]);
  const recommendation = useMemo(
    () => recommendVestibularFirstAction({ meta, temas, simulados }),
    [meta, temas, simulados]
  );

  if (plat !== "vest" || start.completed) return null;

  const applyPatch = (patch) => {
    const nextStart = updateVestibularStart(meta, patch);
    const nextMeta = { ...meta, vestibularStart: nextStart };
    if (nextStart.targetExam) {
      nextMeta.provasAlvo = [nextStart.targetExam];
    }
    if (nextStart.examDate) {
      nextMeta.dataProva = nextStart.examDate;
    }
    useStore.setState({ meta: nextMeta });
  };

  const completeTrail = () => {
    applyPatch({ completed: true });
    if (showToast) showToast("Trilha inicial do Vestibular concluída.");
  };

  const openRecommendation = () => {
    if (recommendation.view === "ajustes") {
      if (onOpenAjustes) onOpenAjustes({ initialTab: "ajustes" });
      return;
    }
    if (setView) setView(recommendation.view);
  };

  return (
    <section className="bg-[var(--surface-1)] border border-blue-500/20 rounded-2xl p-4 space-y-4">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-wider text-blue-300">Vestibular</p>
        <h3 className="text-sm font-black text-white">Configure sua trilha inicial</h3>
        <p className="text-[11px] text-gray-400">Leva 2 minutos e libera a primeira ação útil do Mentor.</p>
      </div>

      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all" style={{ width: `${((step + 1) / 5) * 100}%` }} />
      </div>

      {step === 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-gray-200">1. Qual prova você quer priorizar?</p>
          <div className="grid grid-cols-2 gap-2">
            {EXAM_OPTIONS.map((exam) => (
              <button
                key={exam}
                type="button"
                onClick={() => applyPatch({ targetExam: exam })}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${start.targetExam === exam ? "bg-blue-600/20 border-blue-500/30 text-blue-200" : "bg-white/5 border-white/10 text-gray-300"}`}
              >
                {exam}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-gray-200">2. Quando é a prova ou quando você quer estar pronto?</p>
          <div className="flex gap-2">
            <input
              type="date"
              value={examDateInput || start.examDate || ""}
              onChange={(e) => setExamDateInput(e.target.value)}
              className="flex-1 rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-[11px] text-gray-200"
            />
            <button
              type="button"
              onClick={() => applyPatch({ examDate: examDateInput || null })}
              className="px-3 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-200 text-[11px] font-bold cursor-pointer"
            >
              Salvar
            </button>
          </div>
          <button
            type="button"
            onClick={() => applyPatch({ examDate: null })}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold cursor-pointer"
          >
            Não sei ainda
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-gray-200">3. Você já tem simulado diagnóstico recente?</p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => applyPatch({ baselineMode: "simulado" })}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${start.baselineMode === "simulado" ? "bg-blue-600/20 border-blue-500/30 text-blue-200" : "bg-white/5 border-white/10 text-gray-300"}`}
            >
              Sim, quero registrar
            </button>
            <button
              type="button"
              onClick={() => applyPatch({ baselineMode: "sem_simulado" })}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${start.baselineMode === "sem_simulado" ? "bg-blue-600/20 border-blue-500/30 text-blue-200" : "bg-white/5 border-white/10 text-gray-300"}`}
            >
              Não, começar sem simulado
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-gray-200">4. Como quer começar?</p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => applyPatch({ planMode: "mentor" })}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${start.planMode === "mentor" ? "bg-blue-600/20 border-blue-500/30 text-blue-200" : "bg-white/5 border-white/10 text-gray-300"}`}
            >
              Modo Mentor
            </button>
            <button
              type="button"
              onClick={() => applyPatch({ planMode: "manual" })}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${start.planMode === "manual" ? "bg-blue-600/20 border-blue-500/30 text-blue-200" : "bg-white/5 border-white/10 text-gray-300"}`}
            >
              Manual
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">5. Primeira ação recomendada</p>
          <p className="text-sm font-black text-white">{recommendation.title}</p>
          <p className="text-[11px] text-emerald-100/90">{recommendation.description}</p>
          <button
            type="button"
            onClick={openRecommendation}
            className="px-3 py-2 rounded-xl bg-emerald-600/25 border border-emerald-500/30 text-emerald-100 text-[11px] font-bold cursor-pointer"
          >
            {recommendation.cta}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold cursor-pointer"
          disabled={step === 0}
        >
          Voltar
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((value) => Math.min(4, value + 1))}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold border-none cursor-pointer"
          >
            Próximo
          </button>
        ) : (
          <button
            type="button"
            onClick={completeTrail}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold border-none cursor-pointer inline-flex items-center gap-1"
          >
            <CheckCircle2 size={13} />
            Concluir trilha
          </button>
        )}
      </div>
    </section>
  );
}

```

### src/core/clinicalReasoningScoring.js

```txt
// src/core/clinicalReasoningScoring.js
// UNICA fonte de calculo do score de raciocinio clinico.
// Substitui 3 implementacoes divergentes:
//   readiness.js:25    -> ponderada 0.6/0.4, weightSum adaptativo
//   RaciocinioClinico.jsx:24 -> media simples (errada — ignora pesos)
//   illnessScript.js:424    -> usa notaCaso que nunca e gravado pela UI
//
// Campos de casosProgresso gravados por registrarCaso (store.js):
//   fase2Acerto      number   acerto do caso estruturado (0-100)
//   sctAcerto        number   score SCT (0-100)
//   vistos           number   quantas vezes o caso foi visitado
//
// Formula canonica (fase atual):
//   Quando ambos disponíveis: fase2Acerto * 0.6 + sctAcerto * 0.4
//   Quando só um disponível: usa o que tem (weightSum adaptativo)
//   Threshold de confianca: n >= 3 casos com score
//
// P4-D futuro adicionara: problem_representation 0.20, hypotheses 0.25,
//   illness_recall 0.20, sct 0.20, management_safety 0.15

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v, min = 0, max = 100) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

// ─── Score por caso ───────────────────────────────────────────────────────────

/**
 * Deriva score normalizado (0-100) para UM caso a partir dos campos gravados.
 * Usa pesos adaptativos: se faltar um componente, normaliza pelo peso restante.
 * Retorna null se nao houver dados (caso nunca visitado ou sem acertos registrados).
 *
 * @param {object} casoProg  - entrada de casosProgresso para UM caso
 * @returns {number|null}
 */
export function normalizeClinicalReasoningProgress(casoProg) {
  if (!casoProg || Number(casoProg.vistos || 0) === 0) return null;

  const fase2 = clamp(casoProg.fase2Acerto);
  const sct = clamp(casoProg.sctAcerto);

  if (fase2 == null && sct == null) return null;

  // Pesos adaptativos: normaliza pelo peso total disponível
  const parts = [
    fase2 != null ? { value: fase2, weight: 0.6 } : null,
    sct != null ? { value: sct, weight: 0.4 } : null,
  ].filter(Boolean);

  const weightSum = parts.reduce((sum, p) => sum + p.weight, 0);
  const raw = parts.reduce((sum, p) => sum + p.value * p.weight, 0) / weightSum;
  return Math.round(raw);
}

// ─── Score geral ─────────────────────────────────────────────────────────────

/**
 * Calcula o score geral de raciocinio clinico.
 * Retorna null se sem dados suficientes.
 *
 * @param {object} casosProgresso  - mapa casoId -> progresso
 * @returns {number|null}
 */
export function calculateClinicalReasoningScore(casosProgresso) {
  const scores = Object.values(casosProgresso || {})
    .map((p) => normalizeClinicalReasoningProgress(p))
    .filter((s) => s != null);

  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

// ─── Score detalhado (com governanca de confianca) ───────────────────────────

/**
 * @param {object} casosProgresso
 * @returns {{
 *   score: number|null,
 *   n: number,
 *   collecting: boolean,
 *   confident: boolean,
 *   byCase: { casoId: string, score: number|null, vistos: number }[]
 * }}
 */
export function calculateClinicalReasoningScoreDetailed(casosProgresso) {
  const entries = Object.entries(casosProgresso || {});
  const byCase = entries.map(([casoId, p]) => ({
    casoId,
    score: normalizeClinicalReasoningProgress(p),
    vistos: Number(p?.vistos || 0),
  }));

  const withScore = byCase.filter((c) => c.score != null);
  const n = withScore.length;

  if (n === 0) {
    return { score: null, n: 0, collecting: true, confident: false, byCase };
  }

  const score = Math.round(withScore.reduce((sum, c) => sum + c.score, 0) / n);
  return {
    score,
    n,
    collecting: n < 3,
    confident: n >= 3,
    byCase,
  };
}

// ─── Cobertura por area ───────────────────────────────────────────────────────

/**
 * Calcula cobertura e nota media por area.
 * Substitui coberturaRaciocinioPorArea(illnessScript.js) que lia notaCaso
 * — campo nunca gravado pela UI, resultando sempre em null.
 *
 * @param {object[]} casos           - lista de casos clinicos
 * @param {object}   casosProgresso  - mapa casoId -> progresso
 * @returns {object}  mapa area -> { total, vistos, notaMedia, pctCobertura }
 */
export function calcCoverageByArea(casos, casosProgresso) {
  const out = {};

  for (const caso of casos || []) {
    if (!caso?.area) continue;
    const area = caso.area;
    if (!out[area]) {
      out[area] = { total: 0, vistos: 0, somaScore: 0, comScore: 0, pctCobertura: 0, notaMedia: null };
    }
    out[area].total += 1;
    const p = casosProgresso?.[caso.id];
    if (Number(p?.vistos || 0) > 0) {
      out[area].vistos += 1;
      const score = normalizeClinicalReasoningProgress(p);
      if (score != null) {
        out[area].somaScore += score;
        out[area].comScore += 1;
      }
    }
  }

  for (const area of Object.keys(out)) {
    const row = out[area];
    row.pctCobertura = row.total ? Math.round((row.vistos / row.total) * 100) : 0;
    row.notaMedia = row.comScore ? Math.round(row.somaScore / row.comScore) : null;
  }

  return out;
}

```

### src/core/clinicalReasoningScoring.test.js

```txt
// src/core/clinicalReasoningScoring.test.js
import {
  normalizeClinicalReasoningProgress,
  calculateClinicalReasoningScore,
  calculateClinicalReasoningScoreDetailed,
  calcCoverageByArea,
} from "./clinicalReasoningScoring";

// ─── normalizeClinicalReasoningProgress ──────────────────────────────────────

describe("normalizeClinicalReasoningProgress", () => {
  test("retorna null para progresso nulo", () => {
    expect(normalizeClinicalReasoningProgress(null)).toBeNull();
    expect(normalizeClinicalReasoningProgress(undefined)).toBeNull();
  });

  test("retorna null para caso nao visitado (vistos=0)", () => {
    expect(normalizeClinicalReasoningProgress({ vistos: 0, fase2Acerto: 80, sctAcerto: 90 })).toBeNull();
  });

  test("retorna null se nao ha fase2Acerto nem sctAcerto", () => {
    expect(normalizeClinicalReasoningProgress({ vistos: 1 })).toBeNull();
  });

  test("formula ponderada correta: 80*0.6 + 70*0.4 = 76", () => {
    const score = normalizeClinicalReasoningProgress({ vistos: 1, fase2Acerto: 80, sctAcerto: 70 });
    expect(score).toBe(76);
  });

  test("formula adaptativa: so fase2 disponivel usa 100% do peso", () => {
    const score = normalizeClinicalReasoningProgress({ vistos: 1, fase2Acerto: 75 });
    expect(score).toBe(75);
  });

  test("formula adaptativa: so sct disponivel usa 100% do peso", () => {
    const score = normalizeClinicalReasoningProgress({ vistos: 1, sctAcerto: 60 });
    expect(score).toBe(60);
  });

  test("clamp: nao excede 100", () => {
    const score = normalizeClinicalReasoningProgress({ vistos: 1, fase2Acerto: 150, sctAcerto: 200 });
    expect(score).toBeLessThanOrEqual(100);
  });

  test("clamp: nao fica abaixo de 0", () => {
    const score = normalizeClinicalReasoningProgress({ vistos: 1, fase2Acerto: -10, sctAcerto: -20 });
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test("strings nao-numericas resultam em null", () => {
    expect(normalizeClinicalReasoningProgress({ vistos: 1, fase2Acerto: "abc" })).toBeNull();
  });
});

// ─── calculateClinicalReasoningScore ─────────────────────────────────────────

describe("calculateClinicalReasoningScore", () => {
  test("retorna null para progresso vazio", () => {
    expect(calculateClinicalReasoningScore({})).toBeNull();
    expect(calculateClinicalReasoningScore(null)).toBeNull();
  });

  test("retorna null se todos os casos nao visitados", () => {
    expect(calculateClinicalReasoningScore({ c1: { vistos: 0, fase2Acerto: 80 } })).toBeNull();
  });

  test("media de 2 casos com scores diferentes", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 }, // 76
      c2: { vistos: 1, fase2Acerto: 60, sctAcerto: 50 }, // 56
    };
    // (76 + 56) / 2 = 66
    expect(calculateClinicalReasoningScore(prog)).toBe(66);
  });

  test("ignora casos sem score", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 }, // 76
      c2: { vistos: 0 }, // null — ignorado
    };
    expect(calculateClinicalReasoningScore(prog)).toBe(76);
  });

  test("score 100 possivel com acertos maximos", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 100, sctAcerto: 100 },
    };
    expect(calculateClinicalReasoningScore(prog)).toBe(100);
  });
});

// ─── calculateClinicalReasoningScoreDetailed ─────────────────────────────────

describe("calculateClinicalReasoningScoreDetailed", () => {
  test("collecting=true e n=0 para progresso vazio", () => {
    const result = calculateClinicalReasoningScoreDetailed({});
    expect(result.score).toBeNull();
    expect(result.n).toBe(0);
    expect(result.collecting).toBe(true);
    expect(result.confident).toBe(false);
  });

  test("collecting=true quando n < 3", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 },
      c2: { vistos: 1, fase2Acerto: 60 },
    };
    const result = calculateClinicalReasoningScoreDetailed(prog);
    expect(result.n).toBe(2);
    expect(result.collecting).toBe(true);
    expect(result.confident).toBe(false);
  });

  test("confident=true quando n >= 3", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 },
      c2: { vistos: 1, fase2Acerto: 60, sctAcerto: 50 },
      c3: { vistos: 1, fase2Acerto: 90, sctAcerto: 85 },
    };
    const result = calculateClinicalReasoningScoreDetailed(prog);
    expect(result.n).toBe(3);
    expect(result.collecting).toBe(false);
    expect(result.confident).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  test("byCase inclui todos os casos com seus scores", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 },
      c2: { vistos: 0 },
    };
    const result = calculateClinicalReasoningScoreDetailed(prog);
    expect(result.byCase).toHaveLength(2);
    const c1 = result.byCase.find((c) => c.casoId === "c1");
    const c2 = result.byCase.find((c) => c.casoId === "c2");
    expect(c1.score).toBe(76);
    expect(c2.score).toBeNull();
  });
});

// ─── calcCoverageByArea ───────────────────────────────────────────────────────

describe("calcCoverageByArea", () => {
  const casos = [
    { id: "c1", area: "Cardiologia" },
    { id: "c2", area: "Cardiologia" },
    { id: "c3", area: "Pneumologia" },
  ];

  test("retorna objeto vazio para listas vazias", () => {
    expect(calcCoverageByArea([], {})).toEqual({});
    expect(calcCoverageByArea(null, {})).toEqual({});
  });

  test("cobertura 0% para casos nao visitados", () => {
    const result = calcCoverageByArea(casos, {});
    expect(result.Cardiologia.pctCobertura).toBe(0);
    expect(result.Cardiologia.notaMedia).toBeNull();
  });

  test("cobertura 50% para 1 de 2 casos em Cardiologia", () => {
    const prog = { c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 } };
    const result = calcCoverageByArea(casos, prog);
    expect(result.Cardiologia.pctCobertura).toBe(50);
    expect(result.Cardiologia.notaMedia).toBe(76);
  });

  test("cobertura 100% para area com 1 caso visitado", () => {
    const prog = { c3: { vistos: 1, fase2Acerto: 60, sctAcerto: 50 } };
    const result = calcCoverageByArea(casos, prog);
    expect(result.Pneumologia.pctCobertura).toBe(100);
    expect(result.Pneumologia.notaMedia).toBe(56);
  });

  test("nota media de 2 casos com scores diferentes", () => {
    const prog = {
      c1: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 }, // 76
      c2: { vistos: 1, fase2Acerto: 60, sctAcerto: 50 }, // 56
    };
    const result = calcCoverageByArea(casos, prog);
    // (76 + 56) / 2 = 66
    expect(result.Cardiologia.notaMedia).toBe(66);
    expect(result.Cardiologia.pctCobertura).toBe(100);
  });

  test("ignora casos sem area definida", () => {
    const casosComSemArea = [...casos, { id: "c4" }];
    const result = calcCoverageByArea(casosComSemArea, {});
    expect(Object.keys(result)).not.toContain(undefined);
    expect(Object.keys(result)).not.toContain("undefined");
  });
});

// ─── Consistencia com readiness.js (formula de referencia) ──────────────────

describe("paridade com formula de readiness.js", () => {
  // readiness.js usa pesos adaptativos identicos — verifica paridade exata
  const referenceCases = [
    { input: { vistos: 1, fase2Acerto: 80, sctAcerto: 70 }, expected: 76 },
    { input: { vistos: 1, fase2Acerto: 100, sctAcerto: 100 }, expected: 100 },
    { input: { vistos: 1, fase2Acerto: 0, sctAcerto: 0 }, expected: 0 },
    { input: { vistos: 1, fase2Acerto: 50 }, expected: 50 }, // so fase2
    { input: { vistos: 1, sctAcerto: 90 }, expected: 90 }, // so sct
  ];

  referenceCases.forEach(({ input, expected }) => {
    test(`fase2=${input.fase2Acerto} sct=${input.sctAcerto} -> ${expected}`, () => {
      expect(normalizeClinicalReasoningProgress(input)).toBe(expected);
    });
  });
});

```

### src/core/copy.js

```txt
export const COPY = {
  views: {
    dash: "Hoje",
    crono: "Plano",
    sims: "Estudar",
    stats: "Estatísticas",
    banco: "Banco",
    more: "Mais",
  },
  metrics: {
    readiness: "Preparo estimado",
    trueRetention: "Retenção longa",
    workload: "Carga de hoje",
  },
  actions: {
    startNow: "Começar agora",
    seeWhy: "Ver por quê",
    configurePlan: "Configurar plano",
    jaDomino: "Já domino",
  },
};

export function resolveViewCopy(viewKey) {
  return COPY.views[viewKey] || COPY.views.dash;
}

```

### src/core/copy.test.js

```txt
import fs from "fs";
import path from "path";
import { COPY, resolveViewCopy } from "./copy";

const FORBIDDEN_VISIBLE_COPY = [
  "Prontidão",
  "True Retention",
  "Modo Simples",
  "Analise ",
  "Acao ",
  "Nao ",
  "Voce ",
  "Faca ",
  "calendario",
  "validacao",
  "dominio",
];

describe("copy glossary", () => {
  test("exports key PT-BR labels", () => {
    expect(COPY.views.dash).toBe("Hoje");
    expect(COPY.views.crono).toBe("Plano");
    expect(COPY.metrics.readiness).toBe("Preparo estimado");
    expect(COPY.metrics.trueRetention).toBe("Retenção longa");
    expect(COPY.actions.jaDomino).toBe("Já domino");
    expect(resolveViewCopy("sims")).toBe("Estudar");
  });

  test("forbidden visible copy is absent from primary UI files", () => {
    const files = [
      path.resolve(__dirname, "../components/ActionInbox.jsx"),
      path.resolve(__dirname, "../components/BottomNav.jsx"),
      path.resolve(__dirname, "../components/Sidebar.jsx"),
      path.resolve(__dirname, "../components/OnboardingWizard.jsx"),
    ];

    const offenders = [];
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, "utf8");
      FORBIDDEN_VISIBLE_COPY.forEach((term) => {
        if (content.includes(term)) {
          offenders.push(`${path.basename(filePath)}: ${term}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});

```

### src/core/errorActionMap.js

```txt
// src/core/errorActionMap.js
// Mapeia tipo canonico de erro -> acao corretiva.
// Consome APENAS os tipos de errorTaxonomy.js — nao cria enum paralelo.
// Saida compativel com actionInbox.createAction (type/target/priority).

import { ERROR_TYPE, ERROR_TYPE_LABEL, ERROR_TYPE_PLATFORMS, normalizeErrorType } from "./errorTaxonomy";

// ─── Mapa tipo -> definicao de acao corretiva ────────────────────────────────

/**
 * Cada entrada define:
 *   type             string       tipo canonico de erro
 *   label            string       rotulo legivel
 *   definition       string       o que este erro significa (1 linha)
 *   correctiveActions string[]    lista de acoes em linguagem natural
 *   preferredTask    string       acao principal ("revisao"|"caso"|"questoes"|"anki"|"sct"|"conduta"|"bloco_cronometrado")
 *   mentorActionType string       tipo compativel com actionInbox.createAction.type
 *   fsrsEffect       string       como afeta o agendamento FSRS
 *   platforms        string[]     plataformas validas (herda de ERROR_TYPE_PLATFORMS)
 */
const ACTION_MAP = Object.freeze({
  [ERROR_TYPE.CONTENT]: {
    type: ERROR_TYPE.CONTENT,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.CONTENT],
    definition: "Nao sabe o conteudo — lacuna de conhecimento basico.",
    correctiveActions: [
      "Revisao curta do topico (max 20 min).",
      "Resolver questoes externas sobre o tema.",
      "Adicionar flashcard Anki com o conceito central.",
    ],
    preferredTask: "revisao",
    mentorActionType: "review",
    fsrsEffect: "Reagendar tema para D1 se lacuna grave.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.CONTENT],
  },

  [ERROR_TYPE.MEMORY]: {
    type: ERROR_TYPE.MEMORY,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.MEMORY],
    definition: "Sabia, mas nao conseguiu recuperar na hora da prova.",
    correctiveActions: [
      "Revisao FSRS/Anki no proximo dia.",
      "Brain dump rapido do topico sem consultar fonte.",
      "Criar cue visual ou mnemonica para o ponto critico.",
    ],
    preferredTask: "anki",
    mentorActionType: "anki",
    fsrsEffect: "Reducao do intervalo FSRS para o step atual.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.MEMORY],
  },

  [ERROR_TYPE.REASONING]: {
    type: ERROR_TYPE.REASONING,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.REASONING],
    definition: "Sabe o conteudo, mas o raciocinio diagnostico falhou.",
    correctiveActions: [
      "Mini caso clinico com problem representation.",
      "Listar hipoteses antes de revelar o diagnostico.",
      "Refazer o raciocinio da questao passo a passo.",
    ],
    preferredTask: "caso",
    mentorActionType: "clinical_case",
    fsrsEffect: "Planejar caso clinico no D7.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.REASONING],
  },

  [ERROR_TYPE.PROBLEM_REPRESENTATION]: {
    type: ERROR_TYPE.PROBLEM_REPRESENTATION,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.PROBLEM_REPRESENTATION],
    definition: "Nao conseguiu sintetizar os dados clinicos em um one-liner diagnostico.",
    correctiveActions: [
      "Escrever um one-liner com: paciente + contexto + queixa principal + dados discriminantes.",
      "Identificar os 2-3 dados mais importantes da vinheta antes de pensar em hipoteses.",
      "Comparar seu problem representation com o do gabarito.",
    ],
    preferredTask: "caso",
    mentorActionType: "clinical_case",
    fsrsEffect: "Incluir etapa de problem representation no proximo caso.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.PROBLEM_REPRESENTATION],
  },

  [ERROR_TYPE.DIFFERENTIAL]: {
    type: ERROR_TYPE.DIFFERENTIAL,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.DIFFERENTIAL],
    definition: "Foi enganado por um diferencial plausivel ou nao considerou o must-not-miss.",
    correctiveActions: [
      "Listar 3 diferenciais + must-not-miss do caso.",
      "Comparar o diferencial correto com o que voce escolheu: quais dados discriminavam?",
      "Revisar os achados discriminantes da doenca-armadilha.",
    ],
    preferredTask: "caso",
    mentorActionType: "clinical_case",
    fsrsEffect: "Adicionar illness script comparativo ao plano de revisao.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.DIFFERENTIAL],
  },

  [ERROR_TYPE.SCT_UNCERTAINTY]: {
    type: ERROR_TYPE.SCT_UNCERTAINTY,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.SCT_UNCERTAINTY],
    definition: "Dificuldade em ajustar probabilidade diante de nova informacao (raciocinio bayesiano clinico).",
    correctiveActions: [
      "Praticar SCT curto: hipotese → nova informacao → quanto muda a probabilidade?",
      "Rever o racional do SCT da questao errada.",
      "Treinar calibracao: estimar 0-100 antes de revelar o painel.",
    ],
    preferredTask: "sct",
    mentorActionType: "clinical_case",
    fsrsEffect: "Planejar sessao SCT no D21.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.SCT_UNCERTAINTY],
  },

  [ERROR_TYPE.MANAGEMENT]: {
    type: ERROR_TYPE.MANAGEMENT,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.MANAGEMENT],
    definition: "Sabe o diagnostico, mas errou a conduta, prescricao ou disposicao do paciente.",
    correctiveActions: [
      "Management station educacional: estabilizacao, exames iniciais, tratamento.",
      "Revisar doses e classes de medicamentos do tema.",
      "Verificar criterios de internacao/ambulatorio e red flags.",
    ],
    preferredTask: "conduta",
    mentorActionType: "clinical_case",
    fsrsEffect: "Adicionar fase de conduta ao proximo caso clinico.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.MANAGEMENT],
  },

  [ERROR_TYPE.INTERPRETATION]: {
    type: ERROR_TYPE.INTERPRETATION,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.INTERPRETATION],
    definition: "Interpretou incorretamente dados da questao (exame, imagem, ECG, lab).",
    correctiveActions: [
      "Treino de leitura diagnostica: voltar para a questao e reler sistematicamente.",
      "Resolver questoes de interpretacao do mesmo tipo de exame.",
      "Revisar criterios de interpretacao do exame especifico.",
    ],
    preferredTask: "questoes",
    mentorActionType: "exam_analysis",
    fsrsEffect: "Resolver questoes do mesmo tipo na proxima sessao.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.INTERPRETATION],
  },

  [ERROR_TYPE.DISTRACTION]: {
    type: ERROR_TYPE.DISTRACTION,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.DISTRACTION],
    definition: "Sabia a resposta, mas cometeu erro de descuido ou falta de atencao.",
    correctiveActions: [
      "Bloco cronometrado com checklist de leitura (releia a ultima linha da questao).",
      "Reduzir distractores no ambiente de estudo.",
      "Marcar questoes em que houve erro de descuido para revisao critica.",
    ],
    preferredTask: "bloco_cronometrado",
    mentorActionType: "review",
    fsrsEffect: "Repetir questoes do mesmo tema com tempo controlado.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.DISTRACTION],
  },

  [ERROR_TYPE.TIME]: {
    type: ERROR_TYPE.TIME,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.TIME],
    definition: "Nao finalizou ou apressou a questao por falta de tempo.",
    correctiveActions: [
      "Bloco cronometrado: 1-2 min por questao, sem parar.",
      "Praticar abandono estrategico de questoes dificeis.",
      "Revisar questao errada para identificar onde perdeu tempo.",
    ],
    preferredTask: "bloco_cronometrado",
    mentorActionType: "exam_analysis",
    fsrsEffect: "Treinar em condicoes de tempo real.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.TIME],
  },

  [ERROR_TYPE.CONFIDENCE_MISMATCH]: {
    type: ERROR_TYPE.CONFIDENCE_MISMATCH,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.CONFIDENCE_MISMATCH],
    definition: "Alta confianca + erro — ou baixa confianca + acerto. Calibracao metacognitiva falhando.",
    correctiveActions: [
      "Estimativa previa antes de cada sessao: 'Vou acertar X%.'",
      "Revisao calibrada: comparar estimativa vs resultado real.",
      "Identificar os temas com maior discrepancia de confianca.",
    ],
    preferredTask: "revisao",
    mentorActionType: "review",
    fsrsEffect: "Ajustar nivel de confianca nos proximos flashcards.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.CONFIDENCE_MISMATCH],
  },

  [ERROR_TYPE.EXAM_STRATEGY]: {
    type: ERROR_TYPE.EXAM_STRATEGY,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.EXAM_STRATEGY],
    definition: "Erro de estrategia de prova: ordem, eliminacao, gestao de tempo ou nervosismo.",
    correctiveActions: [
      "Analisar o simulado completo focando na estrategia, nao so no conteudo.",
      "Praticar a tecnica de 2 leituras (rapida + revisao).",
      "Ensaiar condicoes de prova real (barulho, pressao de tempo, postura).",
    ],
    preferredTask: "questoes",
    mentorActionType: "exam_analysis",
    fsrsEffect: "Incluir simulado completo no proximo ciclo.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.EXAM_STRATEGY],
  },

  [ERROR_TYPE.GUESS]: {
    type: ERROR_TYPE.GUESS,
    label: ERROR_TYPE_LABEL[ERROR_TYPE.GUESS],
    definition: "Acertou por chute ou respondeu sem base — falsa confianca no resultado.",
    correctiveActions: [
      "Revisar o conteudo do topico como se tivesse errado.",
      "Marcar questoes de chute para revisao explicita.",
      "Avaliar calibracao: voce sabia ou sorte?",
    ],
    preferredTask: "revisao",
    mentorActionType: "review",
    fsrsEffect: "Considerar step como nao-consolidado.",
    platforms: ERROR_TYPE_PLATFORMS[ERROR_TYPE.GUESS],
  },
});

// ─── API publica ──────────────────────────────────────────────────────────────

/**
 * Retorna a definicao de acao corretiva para um tipo de erro.
 * Aceita tanto o tipo canonico quanto valores legados — normaliza internamente.
 *
 * @param {string} rawType  - tipo de erro (canonico ou legado)
 * @returns {object|null}
 */
export function getCorrectiveAction(rawType) {
  if (!rawType) return null;
  const canonical = normalizeErrorType(rawType);
  return ACTION_MAP[canonical] ?? null;
}

/**
 * Retorna todas as acoes corretivas validas para uma plataforma.
 *
 * @param {string} plat  - "res" | "vest"
 * @returns {object[]}
 */
export function getActionsForPlatform(plat = "res") {
  return Object.values(ACTION_MAP).filter((a) => a.platforms.includes(plat));
}

/**
 * Converte um tipo de erro dominante em uma action compativel com actionInbox.createAction.
 * Nao chama createAction — retorna um objeto plano para o caller montar a acao.
 *
 * @param {string} rawDominantType  - tipo de erro dominante
 * @param {object} context          - { tema, area, dueDate, plat }
 * @returns {{ type, title, reason, priority, source, dueDate, target } | null}
 */
export function dominantErrorToInboxAction(rawDominantType, context = {}) {
  const action = getCorrectiveAction(rawDominantType);
  if (!action) return null;

  const plat = context.plat || "res";
  if (!action.platforms.includes(plat)) return null;

  return {
    type: action.mentorActionType,
    title: context.tema
      ? `Acao corretiva (${action.label}): ${context.tema}`
      : `Acao corretiva: ${action.label}`,
    reason: action.definition,
    priority: 80,
    source: "error_action",
    dueDate: context.dueDate || null,
    target: {
      tema: context.tema || undefined,
      area: context.area || undefined,
      errorType: action.type,
      preferredTask: action.preferredTask,
    },
  };
}

/**
 * Retorna os tipos canonicos de erro ordenados por severidade decrescente.
 * @returns {string[]}
 */
export function getErrorTypesBySeverity() {
  return Object.keys(ACTION_MAP);
}

export { ACTION_MAP };

```

### src/core/errorActionMap.test.js

```txt
// src/core/errorActionMap.test.js
import {
  getCorrectiveAction,
  getActionsForPlatform,
  dominantErrorToInboxAction,
  getErrorTypesBySeverity,
  ACTION_MAP,
} from "./errorActionMap";
import { ERROR_TYPE, normalizeErrorType } from "./errorTaxonomy";

// ─── Todos os tipos canonicos tem acao corretiva ──────────────────────────────

describe("errorActionMap — cobertura de tipos canonicos", () => {
  const CANONICAL_TYPES = [
    ERROR_TYPE.CONTENT,
    ERROR_TYPE.MEMORY,
    ERROR_TYPE.REASONING,
    ERROR_TYPE.PROBLEM_REPRESENTATION,
    ERROR_TYPE.DIFFERENTIAL,
    ERROR_TYPE.SCT_UNCERTAINTY,
    ERROR_TYPE.MANAGEMENT,
    ERROR_TYPE.INTERPRETATION,
    ERROR_TYPE.DISTRACTION,
    ERROR_TYPE.TIME,
    ERROR_TYPE.CONFIDENCE_MISMATCH,
    ERROR_TYPE.EXAM_STRATEGY,
    ERROR_TYPE.GUESS,
  ];

  test("todos os tipos canonicos tem acao corretiva", () => {
    CANONICAL_TYPES.forEach((tipo) => {
      const action = getCorrectiveAction(tipo);
      expect(action).not.toBeNull();
      expect(action.type).toBe(tipo);
    });
  });

  test("cada acao tem correctiveActions com pelo menos 1 item", () => {
    CANONICAL_TYPES.forEach((tipo) => {
      const action = getCorrectiveAction(tipo);
      expect(Array.isArray(action.correctiveActions)).toBe(true);
      expect(action.correctiveActions.length).toBeGreaterThan(0);
    });
  });

  test("cada acao tem mentorActionType e preferredTask definidos", () => {
    CANONICAL_TYPES.forEach((tipo) => {
      const action = getCorrectiveAction(tipo);
      expect(typeof action.mentorActionType).toBe("string");
      expect(typeof action.preferredTask).toBe("string");
    });
  });
});

// ─── Mapeamento legado ────────────────────────────────────────────────────────

describe("normalizeErrorType — compatibilidade legada", () => {
  test("lacuna mapeia para conteudo", () => {
    expect(normalizeErrorType("lacuna")).toBe(ERROR_TYPE.CONTENT);
  });

  test("nao_visto mapeia para conteudo", () => {
    expect(normalizeErrorType("nao_visto")).toBe(ERROR_TYPE.CONTENT);
  });

  test("distractor mapeia para diferencial", () => {
    expect(normalizeErrorType("distractor")).toBe(ERROR_TYPE.DIFFERENTIAL);
  });

  test("descuido mapeia para distracao", () => {
    expect(normalizeErrorType("descuido")).toBe(ERROR_TYPE.DISTRACTION);
  });

  test("raciocinio_clinico mapeia para raciocinio", () => {
    expect(normalizeErrorType("raciocinio_clinico")).toBe(ERROR_TYPE.REASONING);
  });

  test("getCorrectiveAction aceita tipo legado lacuna", () => {
    const action = getCorrectiveAction("lacuna");
    expect(action).not.toBeNull();
    expect(action.type).toBe(ERROR_TYPE.CONTENT);
  });

  test("getCorrectiveAction aceita tipo legado distractor", () => {
    const action = getCorrectiveAction("distractor");
    expect(action).not.toBeNull();
    expect(action.type).toBe(ERROR_TYPE.DIFFERENTIAL);
  });
});

// ─── Isolamento por plataforma ────────────────────────────────────────────────

describe("getActionsForPlatform — isolamento vest", () => {
  test("conduta_prescricao nao aparece no vestibular", () => {
    const vestActions = getActionsForPlatform("vest");
    const types = vestActions.map((a) => a.type);
    expect(types).not.toContain(ERROR_TYPE.MANAGEMENT);
  });

  test("representacao_problema nao aparece no vestibular", () => {
    const vestActions = getActionsForPlatform("vest");
    const types = vestActions.map((a) => a.type);
    expect(types).not.toContain(ERROR_TYPE.PROBLEM_REPRESENTATION);
  });

  test("diferencial nao aparece no vestibular", () => {
    const vestActions = getActionsForPlatform("vest");
    const types = vestActions.map((a) => a.type);
    expect(types).not.toContain(ERROR_TYPE.DIFFERENTIAL);
  });

  test("incerteza_sct nao aparece no vestibular", () => {
    const vestActions = getActionsForPlatform("vest");
    const types = vestActions.map((a) => a.type);
    expect(types).not.toContain(ERROR_TYPE.SCT_UNCERTAINTY);
  });

  test("conteudo, memoria, tempo aparecem no vestibular", () => {
    const vestActions = getActionsForPlatform("vest");
    const types = vestActions.map((a) => a.type);
    expect(types).toContain(ERROR_TYPE.CONTENT);
    expect(types).toContain(ERROR_TYPE.MEMORY);
    expect(types).toContain(ERROR_TYPE.TIME);
  });

  test("todos os tipos aparecem no res", () => {
    const resActions = getActionsForPlatform("res");
    const types = resActions.map((a) => a.type);
    expect(types).toContain(ERROR_TYPE.MANAGEMENT);
    expect(types).toContain(ERROR_TYPE.PROBLEM_REPRESENTATION);
    expect(types).toContain(ERROR_TYPE.DIFFERENTIAL);
    expect(types).toContain(ERROR_TYPE.SCT_UNCERTAINTY);
  });
});

// ─── dominantErrorToInboxAction — compatibilidade com actionInbox ─────────────

describe("dominantErrorToInboxAction — geracao de action para inbox", () => {
  test("retorna objeto compativel com actionInbox para tipo valido", () => {
    const result = dominantErrorToInboxAction(ERROR_TYPE.REASONING, {
      tema: "Apendicite Aguda",
      area: "Cirurgia",
      plat: "res",
      dueDate: "2026-06-01",
    });
    expect(result).not.toBeNull();
    expect(result.type).toBe("clinical_case");
    expect(result.title).toContain("Apendicite Aguda");
    expect(result.priority).toBeGreaterThan(0);
    expect(result.source).toBe("error_action");
    expect(result.target.errorType).toBe(ERROR_TYPE.REASONING);
    expect(result.target.preferredTask).toBe("caso");
  });

  test("retorna null para tipo invalido", () => {
    expect(dominantErrorToInboxAction("tipo_que_nao_existe")).toBeNull();
  });

  test("retorna null quando plataforma nao e valida para o tipo", () => {
    const result = dominantErrorToInboxAction(ERROR_TYPE.MANAGEMENT, {
      tema: "Matematica",
      plat: "vest",
    });
    expect(result).toBeNull();
  });

  test("funciona sem tema/area no contexto", () => {
    const result = dominantErrorToInboxAction(ERROR_TYPE.CONTENT, { plat: "res" });
    expect(result).not.toBeNull();
    expect(typeof result.title).toBe("string");
  });

  test("action gerada nao colide em dedupe: tem type e target distintos", () => {
    const r1 = dominantErrorToInboxAction(ERROR_TYPE.CONTENT, { tema: "Topico A", plat: "res", dueDate: "2026-06-01" });
    const r2 = dominantErrorToInboxAction(ERROR_TYPE.REASONING, { tema: "Topico B", plat: "res", dueDate: "2026-06-01" });
    expect(r1.type).not.toBe(r2.type);
    expect(r1.target.errorType).not.toBe(r2.target.errorType);
  });
});

// ─── getErrorTypesBySeverity ──────────────────────────────────────────────────

describe("getErrorTypesBySeverity", () => {
  test("retorna lista com todos os tipos do ACTION_MAP", () => {
    const list = getErrorTypesBySeverity();
    expect(list.length).toBe(Object.keys(ACTION_MAP).length);
  });
});

// ─── Novos tipos — taxonomia extendida ──────────────────────────────────────

describe("errorTaxonomy — novos tipos do P3-A", () => {
  test("ERROR_TYPE.PROBLEM_REPRESENTATION existe e tem valor correto", () => {
    expect(ERROR_TYPE.PROBLEM_REPRESENTATION).toBe("representacao_problema");
  });

  test("ERROR_TYPE.DIFFERENTIAL existe e tem valor correto", () => {
    expect(ERROR_TYPE.DIFFERENTIAL).toBe("diferencial");
  });

  test("ERROR_TYPE.SCT_UNCERTAINTY existe e tem valor correto", () => {
    expect(ERROR_TYPE.SCT_UNCERTAINTY).toBe("incerteza_sct");
  });

  test("ERROR_TYPE.MANAGEMENT existe e tem valor correto", () => {
    expect(ERROR_TYPE.MANAGEMENT).toBe("conduta_prescricao");
  });

  test("ERROR_TYPE.EXAM_STRATEGY existe e tem valor correto", () => {
    expect(ERROR_TYPE.EXAM_STRATEGY).toBe("estrategia_prova");
  });
});

```

### src/core/metricsRegistry.js

```txt
// src/core/metricsRegistry.js
// Governa toda metrica exibida no StatsPanel e no Dashboard.
// Cada metrica responde: o que mede / da para confiar / o que fazer se ruim.
// Nao importa React nem hooks. Nao computa metricas — apenas define e avalia.

// ─── STATUS ──────────────────────────────────────────────────────────────────

export const METRIC_STATUS = Object.freeze({
  COLLECTING: "collecting",
  LOW_CONFIDENCE: "low_confidence",
  OK: "ok",
  WARNING: "warning",
  CRITICAL: "critical",
});

// ─── DEFINICOES ──────────────────────────────────────────────────────────────

/**
 * Cada definicao segue o contrato:
 * {
 *   id            string       identificador unico (camelCase)
 *   label         string       nome legivel
 *   shortLabel    string       versao curta para cards
 *   section       string       uma das 7 secoes: resumo|aprendizagem|erros|provas|raciocinio|atividade|sistema
 *   description   string       o que mede (1 linha)
 *   emptyState    string       texto quando nao ha dados suficientes
 *   confidenceRule fn(ctx)     retorna true quando o valor e confiavel
 *   actionWhenLow string       o que fazer quando estiver ruim ou coletando
 *   warningThreshold number|null  valor abaixo do qual e WARNING (0-100 ou unidade da metrica)
 *   criticalThreshold number|null valor abaixo do qual e CRITICAL
 *   higherIsBetter bool        false para metricas como overdueReviews
 *   unit          string       sufixo de exibicao: "%"|"min"|""|etc.
 *   platforms     string[]     ["res","vest"] | ["res"]
 * }
 */
const DEFINITIONS = [
  {
    id: "trueRetention",
    label: "Retencao longa",
    shortLabel: "Retencao",
    section: "resumo",
    description: "Acerto ponderado em revisoes D21+ e manutencao — proxy real de quanto ficou na memoria de longo prazo.",
    emptyState: "Coletando revisoes longas (D21+)",
    confidenceRule: ({ n = 0 }) => n >= 5,
    actionWhenLow: "Priorize revisoes longas e reduza temas novos por enquanto.",
    warningThreshold: 70,
    criticalThreshold: 55,
    higherIsBetter: true,
    unit: "%",
    platforms: ["res", "vest"],
  },
  {
    id: "todayWorkloadMinutes",
    label: "Carga de hoje",
    shortLabel: "Carga",
    section: "resumo",
    description: "Estimativa de minutos necessarios para fechar a fila de hoje (pendentes + vencidos).",
    emptyState: "Nenhuma revisao programada para hoje",
    confidenceRule: () => true,
    actionWhenLow: null,
    warningThreshold: null,
    criticalThreshold: null,
    higherIsBetter: false,
    unit: "min",
    platforms: ["res", "vest"],
  },
  {
    id: "overdueReviews",
    label: "Revisoes vencidas",
    shortLabel: "Vencidas",
    section: "resumo",
    description: "Revisoes com data passada ainda nao feitas. Acumulo compromete a retencao.",
    emptyState: "Nenhuma revisao vencida",
    confidenceRule: () => true,
    actionWhenLow: "Resolva a fila atrasada antes de iniciar temas novos.",
    warningThreshold: null,
    criticalThreshold: null,
    higherIsBetter: false,
    unit: "",
    platforms: ["res", "vest"],
  },
  {
    id: "relearningCount",
    label: "Reaprendendo",
    shortLabel: "Reaprendendo",
    section: "resumo",
    description: "Temas em fase de reaprendizagem — conteudo que escapou da memoria e precisa ser recuperado.",
    emptyState: "Nenhum tema em relearning",
    confidenceRule: () => true,
    actionWhenLow: "Feche os relearnings antes de abrir novos temas.",
    warningThreshold: null,
    criticalThreshold: null,
    higherIsBetter: false,
    unit: "",
    platforms: ["res", "vest"],
  },
  {
    id: "coverageByArea",
    label: "Cobertura do cronograma",
    shortLabel: "Cobertura",
    section: "aprendizagem",
    description: "Percentual de temas do cronograma que ja foram iniciados pelo menos uma vez.",
    emptyState: "Nenhum tema iniciado ainda",
    confidenceRule: ({ total = 0 }) => total >= 3,
    actionWhenLow: "Inicie os temas prioritarios do cronograma.",
    warningThreshold: 40,
    criticalThreshold: 20,
    higherIsBetter: true,
    unit: "%",
    platforms: ["res", "vest"],
  },
  {
    id: "simuladoAccuracy",
    label: "Acerto em simulados",
    shortLabel: "Simulados",
    section: "provas",
    description: "Media movel dos ultimos 4 simulados. Proxy de desempenho em condicoes de prova.",
    emptyState: "Nenhum simulado registrado ainda",
    confidenceRule: ({ n = 0 }) => n >= 2,
    actionWhenLow: "Analise os erros dos simulados por tipo e area.",
    warningThreshold: 60,
    criticalThreshold: 45,
    higherIsBetter: true,
    unit: "%",
    platforms: ["res", "vest"],
  },
  {
    id: "enamedGap",
    label: "Gap ENAMED",
    shortLabel: "ENAMED",
    section: "provas",
    description: "Diferenca entre seu desempenho estimado e a media historica do ENAMED por area.",
    emptyState: "Analise ENAMED ainda nao registrada",
    confidenceRule: ({ hasAnalise = false }) => hasAnalise,
    actionWhenLow: "Foque nas areas com maior gap. Veja o mapa ENAMED.",
    warningThreshold: null,
    criticalThreshold: null,
    higherIsBetter: false,
    unit: "pts",
    platforms: ["res"],
  },
  {
    id: "dominantError",
    label: "Tipo de erro dominante",
    shortLabel: "Erro dom.",
    section: "erros",
    description: "Tipo de erro mais frequente nas ultimas sessoes e simulados. Base para acao corretiva.",
    emptyState: "Sem erros suficientes para padrao dominante",
    confidenceRule: ({ total = 0 }) => total >= 5,
    actionWhenLow: "Continue registrando erros para identificar o padrao.",
    warningThreshold: null,
    criticalThreshold: null,
    higherIsBetter: false,
    unit: "",
    platforms: ["res", "vest"],
  },
  {
    id: "clinicalReasoningScore",
    label: "Score de raciocinio clinico",
    shortLabel: "Raciocinio",
    section: "raciocinio",
    description: "Media ponderada de acerto em casos clinicos (fase2 60%, SCT 40%). So Residencia.",
    emptyState: "Nenhum caso clinico concluido ainda",
    confidenceRule: ({ n = 0 }) => n >= 3,
    actionWhenLow: "Treine mais casos clinicos para calibrar o score.",
    warningThreshold: 65,
    criticalThreshold: 50,
    higherIsBetter: true,
    unit: "%",
    platforms: ["res"],
  },
  {
    id: "ankiAdherence",
    label: "Adesao ao Anki",
    shortLabel: "Anki",
    section: "atividade",
    description: "Percentual de dias nos ultimos 7 com sessao Anki registrada.",
    emptyState: "Nenhuma sessao Anki registrada esta semana",
    confidenceRule: ({ days = 0 }) => days >= 3,
    actionWhenLow: "Mantenha o Anki diario — mesmo 10 min protegem a retencao.",
    warningThreshold: 57,
    criticalThreshold: 30,
    higherIsBetter: true,
    unit: "%",
    platforms: ["res", "vest"],
  },
  {
    id: "weeklyConsistency",
    label: "Consistencia semanal",
    shortLabel: "Consistencia",
    section: "atividade",
    description: "Dias de estudo nos ultimos 7. Consistencia e mais importante que volume pontual.",
    emptyState: "Ainda nao ha historico desta semana",
    confidenceRule: ({ totalDays = 0 }) => totalDays >= 7,
    actionWhenLow: "Estude pelo menos 5 dias por semana para manter o ritmo.",
    warningThreshold: 4,
    criticalThreshold: 2,
    higherIsBetter: true,
    unit: "dias",
    platforms: ["res", "vest"],
  },
];

// Indice para lookup O(1)
const DEFINITIONS_MAP = Object.fromEntries(DEFINITIONS.map((d) => [d.id, d]));

// IDs obrigatorios (usados nos testes)
export const MANDATORY_METRIC_IDS = DEFINITIONS.map((d) => d.id);

// ─── API PUBLICA ──────────────────────────────────────────────────────────────

/**
 * Retorna a definicao de uma metrica pelo id.
 * @param {string} id
 * @returns {object|null}
 */
export function getMetricDefinition(id) {
  return DEFINITIONS_MAP[id] ?? null;
}

/**
 * Avalia o status de uma metrica dado o valor computado e o contexto.
 *
 * @param {string} id       - id da metrica
 * @param {*}      value    - valor ja computado (null = sem dados)
 * @param {object} context  - dados de contexto para confidenceRule (n, total, hasAnalise, etc.)
 * @returns {{ status: string, value: *, label: string, description: string,
 *             emptyState: string, action: string|null, confident: boolean }}
 */
export function evaluateMetric(id, value, context = {}) {
  const def = DEFINITIONS_MAP[id];
  if (!def) {
    return {
      status: METRIC_STATUS.COLLECTING,
      value: null,
      label: id,
      description: "",
      emptyState: "",
      action: null,
      confident: false,
    };
  }

  // Sem dados
  if (value == null) {
    return {
      status: METRIC_STATUS.COLLECTING,
      value: null,
      label: def.label,
      description: def.description,
      emptyState: def.emptyState,
      action: def.actionWhenLow,
      confident: false,
    };
  }

  const confident = def.confidenceRule(context);

  if (!confident) {
    return {
      status: METRIC_STATUS.LOW_CONFIDENCE,
      value,
      label: def.label,
      description: def.description,
      emptyState: def.emptyState,
      action: def.actionWhenLow,
      confident: false,
    };
  }

  // Metricas higherIsBetter com thresholds numericos
  let status = METRIC_STATUS.OK;
  if (def.higherIsBetter && typeof value === "number") {
    if (def.criticalThreshold != null && value < def.criticalThreshold) {
      status = METRIC_STATUS.CRITICAL;
    } else if (def.warningThreshold != null && value < def.warningThreshold) {
      status = METRIC_STATUS.WARNING;
    }
  } else if (!def.higherIsBetter && typeof value === "number") {
    // Metricas onde menor e melhor (ex: overdueReviews, relearningCount)
    // Qualquer valor > 0 e pelo menos WARNING, > 5 e CRITICAL
    if (id === "overdueReviews" || id === "relearningCount") {
      if (value >= 10) status = METRIC_STATUS.CRITICAL;
      else if (value > 0) status = METRIC_STATUS.WARNING;
    }
  }

  return {
    status,
    value,
    label: def.label,
    description: def.description,
    emptyState: def.emptyState,
    action: status !== METRIC_STATUS.OK ? def.actionWhenLow : null,
    confident: true,
  };
}

/**
 * Retorna as definicoes das metricas de uma secao para a plataforma especificada.
 *
 * @param {string} section  - nome da secao
 * @param {string} plat     - "res" | "vest"
 * @returns {object[]}
 */
export function getMetricsForSection(section, plat = "res") {
  return DEFINITIONS.filter(
    (d) => d.section === section && d.platforms.includes(plat)
  );
}

/**
 * Formata o valor de uma metrica para exibicao.
 * Nunca lanca excecao — retorna "—" se valor for null/undefined.
 *
 * @param {string} id
 * @param {*}      value
 * @param {object} context  - opcional, pode conter { locale }
 * @returns {string}
 */
export function formatMetricValue(id, value, context = {}) {
  if (value == null) return "—";
  const def = DEFINITIONS_MAP[id];
  if (!def) return String(value);

  const locale = context.locale || "pt-BR";

  // Valores textuais (ex: dominantError retorna string do tipo)
  if (typeof value === "string") return value;

  if (typeof value === "number") {
    const rounded = Number.isInteger(value) ? value : Math.round(value);
    const formatted = rounded.toLocaleString(locale);
    return def.unit ? `${formatted}${def.unit}` : formatted;
  }

  return String(value);
}

/**
 * Retorna todas as secoes distintas presentes nas definicoes.
 * @returns {string[]}
 */
export function getAllSections() {
  return [...new Set(DEFINITIONS.map((d) => d.section))];
}

```

### src/core/metricsRegistry.test.js

```txt
// src/core/metricsRegistry.test.js
import {
  METRIC_STATUS,
  MANDATORY_METRIC_IDS,
  getMetricDefinition,
  evaluateMetric,
  getMetricsForSection,
  formatMetricValue,
  getAllSections,
} from "./metricsRegistry";

// ─── Definicoes obrigatorias ──────────────────────────────────────────────────

describe("metricsRegistry — definicoes obrigatorias", () => {
  const REQUIRED = [
    "trueRetention",
    "todayWorkloadMinutes",
    "overdueReviews",
    "relearningCount",
    "coverageByArea",
    "simuladoAccuracy",
    "enamedGap",
    "dominantError",
    "clinicalReasoningScore",
    "ankiAdherence",
    "weeklyConsistency",
  ];

  test("MANDATORY_METRIC_IDS contem todos os ids exigidos", () => {
    REQUIRED.forEach((id) => {
      expect(MANDATORY_METRIC_IDS).toContain(id);
    });
  });

  test("getMetricDefinition retorna objeto valido para cada metrica obrigatoria", () => {
    REQUIRED.forEach((id) => {
      const def = getMetricDefinition(id);
      expect(def).not.toBeNull();
      expect(def.id).toBe(id);
      expect(typeof def.label).toBe("string");
      expect(typeof def.description).toBe("string");
      expect(typeof def.emptyState).toBe("string");
      expect(typeof def.confidenceRule).toBe("function");
      expect(Array.isArray(def.platforms)).toBe(true);
      expect(def.platforms.length).toBeGreaterThan(0);
    });
  });

  test("getMetricDefinition retorna null para id desconhecido", () => {
    expect(getMetricDefinition("metricaInexistente")).toBeNull();
  });
});

// ─── trueRetention — regra de confianca ──────────────────────────────────────

describe("trueRetention — status baseado em amostra", () => {
  test("retorna COLLECTING quando value e null", () => {
    const result = evaluateMetric("trueRetention", null, { n: 0 });
    expect(result.status).toBe(METRIC_STATUS.COLLECTING);
    expect(result.confident).toBe(false);
  });

  test("retorna LOW_CONFIDENCE quando n < 5 mesmo com value preenchido", () => {
    const result = evaluateMetric("trueRetention", 80, { n: 3 });
    expect(result.status).toBe(METRIC_STATUS.LOW_CONFIDENCE);
    expect(result.confident).toBe(false);
  });

  test("retorna OK quando n >= 5 e value acima do threshold de warning", () => {
    const result = evaluateMetric("trueRetention", 80, { n: 5 });
    expect(result.status).toBe(METRIC_STATUS.OK);
    expect(result.confident).toBe(true);
  });

  test("retorna WARNING quando n >= 5 mas value abaixo de 70", () => {
    const result = evaluateMetric("trueRetention", 65, { n: 7 });
    expect(result.status).toBe(METRIC_STATUS.WARNING);
  });

  test("retorna CRITICAL quando n >= 5 e value abaixo de 55", () => {
    const result = evaluateMetric("trueRetention", 50, { n: 6 });
    expect(result.status).toBe(METRIC_STATUS.CRITICAL);
  });
});

// ─── Plataforma — vest nao recebe metricas exclusivas de res ─────────────────

describe("getMetricsForSection — isolamento por plataforma", () => {
  test("vest nao recebe enamedGap", () => {
    const vestSections = ["resumo", "aprendizagem", "erros", "provas", "raciocinio", "atividade", "sistema"];
    const vestMetrics = vestSections.flatMap((s) => getMetricsForSection(s, "vest"));
    const ids = vestMetrics.map((m) => m.id);
    expect(ids).not.toContain("enamedGap");
  });

  test("vest nao recebe clinicalReasoningScore", () => {
    const vestMetrics = getMetricsForSection("raciocinio", "vest");
    expect(vestMetrics).toHaveLength(0);
  });

  test("res recebe enamedGap", () => {
    const resMetrics = getMetricsForSection("provas", "res");
    const ids = resMetrics.map((m) => m.id);
    expect(ids).toContain("enamedGap");
  });

  test("res recebe clinicalReasoningScore", () => {
    const resMetrics = getMetricsForSection("raciocinio", "res");
    const ids = resMetrics.map((m) => m.id);
    expect(ids).toContain("clinicalReasoningScore");
  });

  test("trueRetention aparece em res e vest", () => {
    const resMetrics = getMetricsForSection("resumo", "res");
    const vestMetrics = getMetricsForSection("resumo", "vest");
    expect(resMetrics.map((m) => m.id)).toContain("trueRetention");
    expect(vestMetrics.map((m) => m.id)).toContain("trueRetention");
  });
});

// ─── formatMetricValue — resistencia a null ──────────────────────────────────

describe("formatMetricValue — seguranca com valores invalidos", () => {
  test("retorna — para null", () => {
    expect(formatMetricValue("trueRetention", null)).toBe("—");
  });

  test("retorna — para undefined", () => {
    expect(formatMetricValue("trueRetention", undefined)).toBe("—");
  });

  test("formata numero com unidade de percentual", () => {
    const result = formatMetricValue("trueRetention", 85);
    expect(result).toContain("85");
    expect(result).toContain("%");
  });

  test("formata numero sem unidade para overdueReviews", () => {
    const result = formatMetricValue("overdueReviews", 3);
    expect(result).toBe("3");
  });

  test("retorna — mesmo para id desconhecido com valor null", () => {
    expect(formatMetricValue("metricaDesconhecida", null)).toBe("—");
  });

  test("nao lanca excecao para value zero", () => {
    expect(() => formatMetricValue("trueRetention", 0)).not.toThrow();
  });

  test("formata string para dominantError", () => {
    expect(formatMetricValue("dominantError", "raciocinio")).toBe("raciocinio");
  });
});

// ─── evaluateMetric — comportamentos gerais ──────────────────────────────────

describe("evaluateMetric — comportamentos gerais", () => {
  test("retorna objeto com campos esperados para metrica valida", () => {
    const result = evaluateMetric("simuladoAccuracy", 70, { n: 4 });
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("value");
    expect(result).toHaveProperty("label");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("emptyState");
    expect(result).toHaveProperty("action");
    expect(result).toHaveProperty("confident");
  });

  test("id inexistente retorna COLLECTING sem lancar excecao", () => {
    expect(() => evaluateMetric("naoExiste", 50, {})).not.toThrow();
    const result = evaluateMetric("naoExiste", 50, {});
    expect(result.status).toBe(METRIC_STATUS.COLLECTING);
  });

  test("overdueReviews = 0 retorna OK", () => {
    const result = evaluateMetric("overdueReviews", 0, {});
    expect(result.status).toBe(METRIC_STATUS.OK);
  });

  test("overdueReviews = 5 retorna WARNING", () => {
    const result = evaluateMetric("overdueReviews", 5, {});
    expect(result.status).toBe(METRIC_STATUS.WARNING);
  });

  test("overdueReviews = 12 retorna CRITICAL", () => {
    const result = evaluateMetric("overdueReviews", 12, {});
    expect(result.status).toBe(METRIC_STATUS.CRITICAL);
  });

  test("action e null quando status OK", () => {
    const result = evaluateMetric("simuladoAccuracy", 80, { n: 4 });
    expect(result.action).toBeNull();
  });

  test("action e string quando status WARNING", () => {
    const result = evaluateMetric("simuladoAccuracy", 55, { n: 4 });
    expect(typeof result.action).toBe("string");
    expect(result.action.length).toBeGreaterThan(0);
  });
});

// ─── getAllSections ───────────────────────────────────────────────────────────

describe("getAllSections", () => {
  test("retorna array com as 7 secoes esperadas", () => {
    const sections = getAllSections();
    const expected = ["resumo", "aprendizagem", "erros", "provas", "raciocinio", "atividade"];
    expected.forEach((s) => expect(sections).toContain(s));
  });
});

```

### src/core/reviewTaskPlanner.js

```txt
// src/core/reviewTaskPlanner.js
// Mapeia step FSRS -> tarefa de revisao multimodal para Residencia.
// Gera uma tarefa especifica por step baseada em:
//   - estagio FSRS (D1, D4, D7, D21/manutencao)
//   - historico de erros do tema (tipo dominante)
//   - disponibilidade de casos clinicos para o tema/area
//   - flag de plataforma (res only)
//   - feature flag: meta.modulos.raciocinioClinico
//
// Nao tem React, nao tem Zustand, nao tem efeitos colaterais.
// Retorna um objeto de tarefa ou null se nao aplicavel.

// ─── Tipos de tarefa multimodal ──────────────────────────────────────────────

export const TASK_TYPE = Object.freeze({
  BRAIN_DUMP: "brain_dump",         // D1: recuperacao ativa livre
  ILLNESS_RECALL: "illness_recall", // D4: illness script recall estruturado
  MINI_CASE: "mini_case",           // D7: mini caso + diferenciais
  SCT: "sct",                       // D21/manutencao: SCT + conduta simulada
  STANDARD: "standard",             // fallback: revisao padrao sem modalidade clinica
});

// ─── Mapeamento step -> tarefa ────────────────────────────────────────────────

const STEP_TASK_MAP = Object.freeze({
  d1:          TASK_TYPE.BRAIN_DUMP,
  d4:          TASK_TYPE.ILLNESS_RECALL,
  d7:          TASK_TYPE.MINI_CASE,
  d21:         TASK_TYPE.SCT,
  manutencao:  TASK_TYPE.SCT,
  // Steps sem modalidade clinica — retornam null (fallback padrao)
  d0:          null,
  pretest:     null,
  relearning:  null,
});

// ─── Descricoes por tipo de tarefa ───────────────────────────────────────────

export const TASK_DESCRIPTIONS = Object.freeze({
  [TASK_TYPE.BRAIN_DUMP]: {
    label: "Recorda\u00e7\u00e3o estruturada",
    shortLabel: "D1",
    instruction: "Escreva tudo que lembra sobre o tema sem consultar nada. Foque nos 5 campos: defini\u00e7\u00e3o, diagn\u00f3stico, diferenciais, conduta e n\u00e3o-pode-perder.",
    fields: [
      { key: "definicao", label: "Defini\u00e7\u00e3o / epidemiologia", placeholder: "O que \u00e9? Quem pega? Por que?" },
      { key: "diagnostico", label: "Como diagnosticar", placeholder: "Cl\u00ednica, exames, crit\u00e9rios" },
      { key: "diferenciais", label: "Principais diferenciais", placeholder: "Quais condi\u00e7\u00f5es mimetizam? O que discrimina?" },
      { key: "conduta", label: "Conduta inicial", placeholder: "Estabiliza\u00e7\u00e3o, exames, tratamento" },
      { key: "naoPodePerder", label: "N\u00e3o pode perder", placeholder: "Qual diagn\u00f3stico grave n\u00e3o posso esquecer?" },
    ],
    durationMin: 10,
  },
  [TASK_TYPE.ILLNESS_RECALL]: {
    label: "Racioc\u00ednio diagn\u00f3stico",
    shortLabel: "D4",
    instruction: "Sem consultar: complete o racioc\u00ednio diagn\u00f3stico do tema: contexto, mecanismo, consequ\u00eancias e conduta.",
    fields: [
      { key: "enabling", label: "Contexto de risco", placeholder: "Quem tem risco? Fisiologia predisponente" },
      { key: "fault", label: "Mecanismo da doen\u00e7a", placeholder: "O que d\u00e1 errado e como evolui?" },
      { key: "consequences", label: "Consequ\u00eancias cl\u00ednicas", placeholder: "Sinais, sintomas, exames alterados" },
      { key: "management", label: "Conduta", placeholder: "Tratamento, doses, crit\u00e9rios de interna\u00e7\u00e3o" },
    ],
    durationMin: 8,
  },
  [TASK_TYPE.MINI_CASE]: {
    label: "Mini caso cl\u00ednico",
    shortLabel: "D7",
    instruction: "Resolva o mini caso: racioc\u00ednio diagn\u00f3stico -> hip\u00f3teses ranqueadas -> justificativa.",
    fields: [
      { key: "problemRep", label: "Racioc\u00ednio diagn\u00f3stico", placeholder: "Paciente de X anos, contexto, queixa principal + dados discriminantes" },
      { key: "hipoteses", label: "Top 3 hip\u00f3teses + n\u00e3o-pode-perder", placeholder: "1. ... 2. ... 3. ... N\u00e3o-pode-perder: ..." },
      { key: "justificativa", label: "Por que o diagn\u00f3stico principal vence", placeholder: "Dados que confirmam e que afastam os diferenciais" },
    ],
    durationMin: 15,
  },
  [TASK_TYPE.SCT]: {
    label: "Concord\u00e2ncia cl\u00ednica + conduta",
    shortLabel: "D21",
    instruction: "Teste de concord\u00e2ncia cl\u00ednica: para cada nova informa\u00e7\u00e3o, ajuste a probabilidade da hip\u00f3tese. Depois simule a conduta.",
    fields: [
      { key: "hipotese", label: "Hip\u00f3tese de trabalho", placeholder: "Qual \u00e9 o diagn\u00f3stico mais prov\u00e1vel?" },
      { key: "sct1", label: "Nova informa\u00e7\u00e3o 1 -> ajuste de probabilidade", placeholder: "Se... a hip\u00f3tese: aumenta / reduz / n\u00e3o muda. Por que?" },
      { key: "sct2", label: "Nova informa\u00e7\u00e3o 2 -> ajuste de probabilidade", placeholder: "Se... a hip\u00f3tese: aumenta / reduz / n\u00e3o muda. Por que?" },
      { key: "conduta", label: "Conduta simulada (educacional)", placeholder: "Estabiliza\u00e7\u00e3o, exames, tratamento, interna\u00e7\u00e3o/ambulat\u00f3rio" },
    ],
    durationMin: 20,
  },
});

// ─── Funcoes principais ───────────────────────────────────────────────────────

/**
 * Verifica se as pre-condicoes estao satisfeitas para tarefas clinicas.
 * Nao acessa store — recebe os dados por parametro.
 *
 * @param {{ plat: string, modulos: object }} options
 * @returns {boolean}
 */
export function isClinicalTaskEnabled({ plat, modulos } = {}) {
  return plat === "res" && Boolean(modulos?.raciocinioClinico);
}

/**
 * Encontra o caso clinico mais relevante para um tema/area.
 * Match por tema.nome (exato ou parcial) ou por area/esp.
 *
 * @param {object}   tema          - objeto tema do store
 * @param {object[]} casos         - lista de CASOS_CLINICOS
 * @param {object}   progresso     - casosProgresso do store
 * @returns {object|null}          - caso clinico ou null
 */
export function findClinicalCaseForTema(tema, casos = [], progresso = {}) {
  if (!tema || !casos.length) return null;

  const nomeNorm = (tema.nome || "").toLowerCase().replace(/[^a-z0-9À-ɏ]/g, " ").trim();
  const espNorm = (tema.esp || "").toLowerCase().trim();

  // 1. Match exato por tema
  const exactMatch = casos.find((c) => {
    const temaField = (c.tema || "").toLowerCase().replace(/[^a-z0-9À-ɏ]/g, " ").trim();
    return nomeNorm && temaField && (nomeNorm.includes(temaField) || temaField.includes(nomeNorm));
  });
  if (exactMatch) return exactMatch;

  // 2. Match por area/especialidade — prioriza casos nao visitados
  const areaMatches = casos.filter((c) => {
    const area = (c.area || "").toLowerCase().trim();
    return area && (area === espNorm || espNorm.includes(area) || area.includes(espNorm));
  });

  if (!areaMatches.length) return null;

  // Prioriza nao visitados, depois mais antigos (menos recentes)
  const sorted = [...areaMatches].sort((a, b) => {
    const visitedA = Number(progresso[a.id]?.vistos || 0);
    const visitedB = Number(progresso[b.id]?.vistos || 0);
    if (visitedA !== visitedB) return visitedA - visitedB; // menos visitado primeiro
    return 0;
  });

  return sorted[0];
}

/**
 * Retorna a tarefa de revisao para um step FSRS especifico.
 * Retorna null se:
 *   - plat nao e res
 *   - modulo nao habilitado
 *   - step nao tem modalidade clinica (d0, pretest, relearning)
 *   - nenhum caso clinico disponivel para o tema
 *
 * @param {object} params
 * @param {object}   params.tema        - objeto tema (com .nome, .esp)
 * @param {string}   params.stepKey     - chave do step FSRS ("d1", "d4", "d7", "d21", "manutencao")
 * @param {object[]} params.casos       - lista CASOS_CLINICOS
 * @param {object}   params.progresso   - casosProgresso do store
 * @param {string}   params.plat        - "res" | "vest"
 * @param {object}   params.modulos     - meta.modulos
 * @returns {{
 *   taskType: string,
 *   stepKey: string,
 *   tema: object,
 *   caso: object|null,
 *   description: object,
 *   responses: object,
 * } | null}
 */
export function getReviewTaskForStep({ tema, stepKey, casos = [], progresso = {}, plat, modulos } = {}) {
  if (!isClinicalTaskEnabled({ plat, modulos })) return null;

  const taskType = STEP_TASK_MAP[stepKey];
  if (!taskType) return null;

  const description = TASK_DESCRIPTIONS[taskType];
  if (!description) return null;

  // Encontrar caso associado (opcional para brain dump e illness recall que sao sobre o tema)
  const caso = [TASK_TYPE.MINI_CASE, TASK_TYPE.SCT].includes(taskType)
    ? findClinicalCaseForTema(tema, casos, progresso)
    : null;

  // Para mini caso e SCT, preferimos ter um caso associado
  // Para brain dump e illness recall, o tema e suficiente
  if ([TASK_TYPE.MINI_CASE, TASK_TYPE.SCT].includes(taskType) && !caso) {
    // Se nao tem caso estruturado, fallback para illness recall (disponivel sem caso)
    if (taskType === TASK_TYPE.MINI_CASE) {
      return {
        taskType: TASK_TYPE.ILLNESS_RECALL,
        stepKey,
        tema,
        caso: null,
        description: TASK_DESCRIPTIONS[TASK_TYPE.ILLNESS_RECALL],
        responses: {},
      };
    }
    return null; // SCT sem caso nao e possivel
  }

  return {
    taskType,
    stepKey,
    tema,
    caso,
    description,
    responses: {},
  };
}

/**
 * Calcula tempo estimado total de uma tarefa (incluindo revisao padrao).
 * @param {object|null} task
 * @param {number} standardMinutes  - tempo da revisao padrao (ex: minutos da sessao)
 * @returns {number}
 */
export function estimateTaskDuration(task, standardMinutes = 20) {
  if (!task) return standardMinutes;
  return (task.description?.durationMin || 15) + standardMinutes;
}

```

### src/core/reviewTaskPlanner.test.js

```txt
// src/core/reviewTaskPlanner.test.js
import {
  TASK_TYPE,
  TASK_DESCRIPTIONS,
  isClinicalTaskEnabled,
  findClinicalCaseForTema,
  getReviewTaskForStep,
  estimateTaskDuration,
} from "./reviewTaskPlanner";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TEMA_CIRUGIA = { id: "t1", nome: "Apendicite Aguda", esp: "Cirurgia" };
const TEMA_CARDIO = { id: "t2", nome: "Infarto Agudo do Miocardio", esp: "Cardiologia" };
const TEMA_SEM_ESP = { id: "t3", nome: "Generico", esp: "" };

const CASOS = [
  { id: "c1", area: "Cirurgia", tema: "Apendicite Aguda", dificuldade: "media", vinheta: "..." },
  { id: "c2", area: "Cirurgia", tema: "Colecistite Aguda", dificuldade: "facil", vinheta: "..." },
  { id: "c3", area: "Cardiologia", tema: "IAM com supra", dificuldade: "dificil", vinheta: "..." },
];

const PROGRESSO = {
  c1: { vistos: 2, fase2Acerto: 80, sctAcerto: 70 },
  c2: { vistos: 0 },
  c3: { vistos: 1, fase2Acerto: 60 },
};

// ─── isClinicalTaskEnabled ────────────────────────────────────────────────────

describe("isClinicalTaskEnabled", () => {
  test("habilitado para res com modulo ativo", () => {
    expect(isClinicalTaskEnabled({ plat: "res", modulos: { raciocinioClinico: true } })).toBe(true);
  });

  test("desabilitado para vest mesmo com modulo ativo", () => {
    expect(isClinicalTaskEnabled({ plat: "vest", modulos: { raciocinioClinico: true } })).toBe(false);
  });

  test("desabilitado para res com modulo inativo", () => {
    expect(isClinicalTaskEnabled({ plat: "res", modulos: { raciocinioClinico: false } })).toBe(false);
  });

  test("desabilitado sem modulos", () => {
    expect(isClinicalTaskEnabled({ plat: "res" })).toBe(false);
  });

  test("desabilitado sem plat", () => {
    expect(isClinicalTaskEnabled({ modulos: { raciocinioClinico: true } })).toBe(false);
  });
});

// ─── findClinicalCaseForTema ─────────────────────────────────────────────────

describe("findClinicalCaseForTema", () => {
  test("retorna null para lista vazia", () => {
    expect(findClinicalCaseForTema(TEMA_CIRUGIA, [], {})).toBeNull();
  });

  test("retorna null para tema nulo", () => {
    expect(findClinicalCaseForTema(null, CASOS, {})).toBeNull();
  });

  test("match exato por nome de tema", () => {
    const result = findClinicalCaseForTema(TEMA_CIRUGIA, CASOS, {});
    expect(result).not.toBeNull();
    expect(result.id).toBe("c1");
  });

  test("match por area quando nao ha match de tema", () => {
    // TEMA_CARDIO.nome = "Infarto Agudo do Miocardio" — nao tem match exato
    // mas CASOS tem c3 com area "Cardiologia"
    const result = findClinicalCaseForTema(TEMA_CARDIO, CASOS, {});
    expect(result).not.toBeNull();
    expect(result.area).toBe("Cardiologia");
  });

  test("prioriza caso nao visitado quando match por area", () => {
    const progresso = { c1: { vistos: 5 }, c2: { vistos: 0 } };
    // c1 e c2 sao ambos Cirurgia, mas c1 foi mais visitado
    const result = findClinicalCaseForTema(TEMA_CIRUGIA, CASOS, progresso);
    // Deve retornar c1 por match exato de tema (ignora vistos para match exato)
    expect(result.id).toBe("c1");
  });

  test("prioriza menos visitado quando match so por area", () => {
    const temaSemMatchExato = { id: "t9", nome: "Outra Doenca", esp: "Cirurgia" };
    const progresso = { c1: { vistos: 5 }, c2: { vistos: 0 } };
    const result = findClinicalCaseForTema(temaSemMatchExato, CASOS, progresso);
    expect(result.id).toBe("c2"); // menos visitado
  });

  test("retorna null quando nao ha casos na area", () => {
    const temaSemArea = { id: "t9", nome: "Algo", esp: "Dermatologia" };
    const result = findClinicalCaseForTema(temaSemArea, CASOS, {});
    expect(result).toBeNull();
  });
});

// ─── TASK_TYPE e mapeamento de steps ─────────────────────────────────────────

describe("TASK_TYPE enum", () => {
  test("BRAIN_DUMP mapeado para d1", () => {
    const task = getReviewTaskForStep({
      tema: TEMA_CIRUGIA, stepKey: "d1", casos: CASOS, progresso: PROGRESSO,
      plat: "res", modulos: { raciocinioClinico: true },
    });
    expect(task?.taskType).toBe(TASK_TYPE.BRAIN_DUMP);
  });

  test("ILLNESS_RECALL mapeado para d4", () => {
    const task = getReviewTaskForStep({
      tema: TEMA_CIRUGIA, stepKey: "d4", casos: CASOS, progresso: PROGRESSO,
      plat: "res", modulos: { raciocinioClinico: true },
    });
    expect(task?.taskType).toBe(TASK_TYPE.ILLNESS_RECALL);
  });

  test("MINI_CASE mapeado para d7 quando caso disponivel", () => {
    const task = getReviewTaskForStep({
      tema: TEMA_CIRUGIA, stepKey: "d7", casos: CASOS, progresso: PROGRESSO,
      plat: "res", modulos: { raciocinioClinico: true },
    });
    expect(task?.taskType).toBe(TASK_TYPE.MINI_CASE);
    expect(task?.caso).not.toBeNull();
  });

  test("SCT mapeado para d21 quando caso disponivel", () => {
    const task = getReviewTaskForStep({
      tema: TEMA_CIRUGIA, stepKey: "d21", casos: CASOS, progresso: PROGRESSO,
      plat: "res", modulos: { raciocinioClinico: true },
    });
    expect(task?.taskType).toBe(TASK_TYPE.SCT);
    expect(task?.caso).not.toBeNull();
  });

  test("SCT mapeado para manutencao", () => {
    const task = getReviewTaskForStep({
      tema: TEMA_CIRUGIA, stepKey: "manutencao", casos: CASOS, progresso: PROGRESSO,
      plat: "res", modulos: { raciocinioClinico: true },
    });
    expect(task?.taskType).toBe(TASK_TYPE.SCT);
  });
});

// ─── getReviewTaskForStep ─────────────────────────────────────────────────────

describe("getReviewTaskForStep", () => {
  const OPTS = { tema: TEMA_CIRUGIA, casos: CASOS, progresso: PROGRESSO, plat: "res", modulos: { raciocinioClinico: true } };

  test("retorna null para vest", () => {
    const task = getReviewTaskForStep({ ...OPTS, plat: "vest" });
    expect(task).toBeNull();
  });

  test("retorna null para modulo inativo", () => {
    const task = getReviewTaskForStep({ ...OPTS, modulos: { raciocinioClinico: false } });
    expect(task).toBeNull();
  });

  test("retorna null para d0 (sem modalidade clinica)", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "d0" });
    expect(task).toBeNull();
  });

  test("retorna null para relearning", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "relearning" });
    expect(task).toBeNull();
  });

  test("retorna null para SCT sem caso disponivel", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "d21", casos: [] });
    expect(task).toBeNull();
  });

  test("d7 sem caso faz fallback para illness_recall", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "d7", casos: [] });
    expect(task).not.toBeNull();
    expect(task.taskType).toBe(TASK_TYPE.ILLNESS_RECALL);
  });

  test("task retornada tem tema, description e responses", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "d1" });
    expect(task).not.toBeNull();
    expect(task.tema).toBe(TEMA_CIRUGIA);
    expect(task.description).toBeDefined();
    expect(task.description.fields).toBeInstanceOf(Array);
    expect(task.responses).toEqual({});
  });

  test("description de brain dump tem 5 campos", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "d1" });
    expect(task.description.fields).toHaveLength(5);
  });

  test("description de sct tem 4 campos", () => {
    const task = getReviewTaskForStep({ ...OPTS, stepKey: "d21" });
    expect(task.description.fields).toHaveLength(4);
  });
});

// ─── TASK_DESCRIPTIONS ───────────────────────────────────────────────────────

describe("TASK_DESCRIPTIONS", () => {
  test("todos os tipos tem label, instruction, fields e durationMin", () => {
    Object.values(TASK_TYPE).forEach((tipo) => {
      if (tipo === TASK_TYPE.STANDARD) return; // sem descricao — e o fallback
      const desc = TASK_DESCRIPTIONS[tipo];
      expect(desc).toBeDefined();
      expect(typeof desc.label).toBe("string");
      expect(typeof desc.instruction).toBe("string");
      expect(Array.isArray(desc.fields)).toBe(true);
      expect(desc.fields.length).toBeGreaterThan(0);
      expect(typeof desc.durationMin).toBe("number");
    });
  });
});

// ─── estimateTaskDuration ────────────────────────────────────────────────────

describe("estimateTaskDuration", () => {
  test("retorna standardMinutes para task nula", () => {
    expect(estimateTaskDuration(null, 20)).toBe(20);
  });

  test("soma durationMin da task com standardMinutes", () => {
    const task = getReviewTaskForStep({
      tema: TEMA_CIRUGIA, stepKey: "d1", casos: CASOS, progresso: PROGRESSO,
      plat: "res", modulos: { raciocinioClinico: true },
    });
    const expected = (task.description.durationMin || 15) + 20;
    expect(estimateTaskDuration(task, 20)).toBe(expected);
  });
});

```

### src/core/vestibularOnboarding.js

```txt
function toIsoNow() {
  return new Date().toISOString();
}

export const DEFAULT_VESTIBULAR_START = {
  completed: false,
  targetExam: null,
  examDate: null,
  baselineMode: null,
  planMode: "mentor",
  completedAt: null,
};

export function getVestibularStart(meta = {}) {
  const incoming = meta?.vestibularStart || {};
  return {
    ...DEFAULT_VESTIBULAR_START,
    ...incoming,
    completed: incoming.completed === true,
    planMode: incoming.planMode || "mentor",
  };
}

export function updateVestibularStart(meta = {}, patch = {}) {
  const current = getVestibularStart(meta);
  const next = {
    ...current,
    ...patch,
  };
  if (patch.completed === true) {
    next.completedAt = current.completedAt || toIsoNow();
  }
  return next;
}

export function isVestibularStartComplete(meta = {}) {
  return getVestibularStart(meta).completed === true;
}

function hasStartedTema(temas = []) {
  return (temas || []).some((tema) => tema?.unstarted === false);
}

export function recommendVestibularFirstAction({
  meta = {},
  temas = [],
  simulados = [],
}) {
  const start = getVestibularStart(meta);
  const sims = Array.isArray(simulados) ? simulados : [];
  const started = hasStartedTema(temas);

  if (start.baselineMode === "simulado" && sims.length === 0) {
    return {
      key: "registrar_simulado",
      title: "Registrar simulado diagnóstico",
      description: "Você escolheu começar com baseline. Registre um simulado recente para o Mentor priorizar a matéria fraca.",
      cta: "Abrir Estudar",
      view: "sims",
    };
  }

  if (!started) {
    return {
      key: "iniciar_tema",
      title: "Iniciar primeiro tema do plano",
      description: "Sem tema iniciado, o próximo melhor passo é abrir o Plano e começar um tópico de alta prioridade.",
      cta: "Abrir Plano",
      view: "crono",
    };
  }

  if (!start.examDate) {
    return {
      key: "configurar_data",
      title: "Configurar data-alvo",
      description: "Definir uma data ajuda o Mentor a calibrar ritmo, carga e prioridade de revisão.",
      cta: "Abrir Ajustes",
      view: "ajustes",
    };
  }

  return {
    key: "seguir_mentor",
    title: "Executar próxima ação do Mentor",
    description: "Com baseline e plano ativos, siga a próxima ação diária para manter consistência.",
    cta: "Ir para Hoje",
    view: "dash",
  };
}

```

### src/core/vestibularOnboarding.test.js

```txt
import {
  getVestibularStart,
  updateVestibularStart,
  recommendVestibularFirstAction,
} from "./vestibularOnboarding";

test("vestibular start is incomplete by default", () => {
  const state = getVestibularStart({});
  expect(state.completed).toBe(false);
});

test("selecting target exam stores target", () => {
  const updated = updateVestibularStart({}, { targetExam: "ENEM" });
  expect(updated.targetExam).toBe("ENEM");
});

test("simulado baseline path recommends registering simulado", () => {
  const recommendation = recommendVestibularFirstAction({
    meta: { vestibularStart: { baselineMode: "simulado" } },
    simulados: [],
    temas: [],
  });
  expect(recommendation.key).toBe("registrar_simulado");
  expect(recommendation.view).toBe("sims");
});

test("without simulado recommends plan setup or first topic", () => {
  const recommendation = recommendVestibularFirstAction({
    meta: { vestibularStart: { baselineMode: "sem_simulado" } },
    simulados: [],
    temas: [{ id: 1, unstarted: true }],
  });
  expect(recommendation.key).toBe("iniciar_tema");
  expect(recommendation.view).toBe("crono");
});

test("mentor mode is default", () => {
  const state = getVestibularStart({});
  expect(state.planMode).toBe("mentor");
});

test("clinical reasoning is never recommended for vest", () => {
  const recommendation = recommendVestibularFirstAction({
    meta: { vestibularStart: { baselineMode: "simulado" } },
    simulados: [],
    temas: [],
  });
  expect(recommendation.title.toLowerCase()).not.toContain("raciocinio");
  expect(recommendation.description.toLowerCase()).not.toContain("clinico");
});

test("ENAMED is never recommended for vest", () => {
  const recommendation = recommendVestibularFirstAction({
    meta: { vestibularStart: { baselineMode: "sem_simulado" } },
    simulados: [],
    temas: [],
  });
  expect(recommendation.title.toLowerCase()).not.toContain("enamed");
  expect(recommendation.description.toLowerCase()).not.toContain("enamed");
});

```

## Mojibake check

```txt

> residencia-planner@0.1.0 check:mojibake
> node scripts/check-mojibake.mjs

check-mojibake: OK - 131 arquivos versionados sem mojibake.

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

check-mojibake: OK - 131 arquivos versionados sem mojibake.
Creating an optimized production build...
Compiled with warnings.

[eslint] 
src\components\ErrorActionCenter.jsx
  Line 12:57:  'normalizeErrorType' is defined but never used  no-unused-vars
  Line 99:11:  'errors' is assigned a value but never used     no-unused-vars

src\components\StatsPanel.jsx
  Line 7:30:  'ChevronRight' is defined but never used  no-unused-vars

src\core\mentorSignals.js
  Line 3:46:  'normalizeErrorType' is defined but never used  no-unused-vars

Search for the keywords to learn more about each warning.
To ignore, add // eslint-disable-next-line to the line before.

File sizes after gzip:

  401.46 kB  build\static\js\main.80b94937.js
  12.96 kB   build\static\css\main.e4325da7.css
  5.5 kB     build\static\js\840.59e723e0.chunk.js
  3.5 kB     build\static\js\481.f626420b.chunk.js
  3.14 kB    build\static\js\74.d9105171.chunk.js
  1.6 kB     build\static\js\508.e77141cc.chunk.js
  1.16 kB    build\static\js\420.24c44b27.chunk.js

The project was built assuming it is hosted at /residencia-planner/.
You can control this with the homepage field in your package.json.

The build folder is ready to be deployed.

Find out more about deployment here:

  https://cra.link/deployment


```
