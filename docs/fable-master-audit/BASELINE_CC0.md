# BASELINE CC-0

Data: 2026-06-11
Branch: rescue/codex-session-01
Bloco executado: CC-0 de `docs/fable-master-audit/07_IMPLEMENTATION_MASTERPLAN.md`

## Resumo executivo

- `npm run check:mojibake`: PASS
- `npm test -- --watchAll=false`: PASS
- `npm run build`: PASS com warnings
- Suites de teste: 79 passed, 0 failed, 79 total
- Testes: 759 passed, 0 failed, 759 total
- Testes falhando: nenhum
- Build: compilou com warnings
- Tempo de build observado: 186.5 s
- Smoke de isolamento multiusuario: PASS, por roteiro instrumentado no mesmo storage logico
- Stop condition: nao acionada

## Git status --short

Capturado no preflight CC-0:

```text
## rescue/codex-session-01
 D MEDREV_AGENDA_CRONOGRAMA_EXECUCAO_HOTFIX_PLAN.md
 D MEDREV_AUDITORIA_INCREMENTAL_FUNCOES_RESTANTES.md
 D MEDREV_AUDITORIA_POS_P2_3_A_P3_1.md
 D MEDREV_BLOCOS_CIENCIA_APRENDIZAGEM_GEMINI.md
 D MEDREV_BLOCO_0_PREFLIGHT.md
 D MEDREV_BLOCO_A_DASHBOARD_COMMAND_CENTER.md
 D MEDREV_BLOCO_B_ENAMED_INTEL.md
 D MEDREV_BLOCO_C_ILLNESS_SCRIPT_ENGINE.md
 D MEDREV_BLOCO_D_CASOS_E_JA_DOMINO.md
 D MEDREV_BLOCO_E_RACIOCINIO_UI.md
 D MEDREV_BLOCO_F1_MENTOR_ENAMED_AUTOPILOT.md
 D MEDREV_BLOCO_F2_TOOLTIPS_MOBILE_CRONOGRAMA.md
 D MEDREV_BLOCO_G_CALENDARIOS_PROVIDERS.md
 D MEDREV_BLOCO_H_CEO_FEATURE_LEVERAGE.md
 D MEDREV_BLOCO_I_LAUNCH_HARDENING.md
 D MEDREV_BLOCO_J_v2_AUDITORIA_CALENDARIO_VESTIBULAR.md
 D MEDREV_BLOCO_K_FSRS_LITE_V2_MENTOR_PREP.md
 D MEDREV_BLOCO_L_v2_MENTOR_POS_K.md
 D MEDREV_BLOCO_M_REORGANIZADO_EM_SUBBLOCOS.md
 D MEDREV_BLOCO_N_MULTI_USER_DATA_ISOLATION.md
 D MEDREV_BLOCO_P0_FSRS_BLOCOS_INTERLEAVING_GEMINI.md
 D MEDREV_BLOCO_P1_1_FSRS_CANONICO_SOMBRA_GEMINI.md
 D MEDREV_BLOCO_P1_2_CALIBRACAO_METACOGNITIVA_GEMINI.md
 D MEDREV_BLOCO_P1_3_MAQUINA_MODO_OPERACIONAL_GEMINI.md
 D MEDREV_BLOCO_P2_1_STUDENT_MODEL_MAESTRIA_LATENTE_GEMINI.md
 D MEDREV_BLOCO_P2_2_FORECAST_TRAJETORIA_PRONTIDAO_GEMINI.md
 D MEDREV_CALENDARIO_CRONOGRAMA_V2_WIZARD_PLAN.md
 D MEDREV_CODE_AUDIT_AND_IMPROVEMENT_MASTERPLAN.md
 D MEDREV_CODE_AUDIT_SAFETY_UX_VALIDATION_PLAN.md
 D MEDREV_CORE_AUDIT_AND_MASTER_IMPLEMENTATION_PLAN.md
 D MEDREV_HOTFIX_JA_DOMINO_D7_D14_FILA.md
 D MEDREV_MASTER_PRODUCT_ROADMAP_V2.md
 D MEDREV_P0_COMPLETO_ORQUESTRACAO_DECISAO_E_EVIDENCIAS.md
 D MEDREV_P1_A_v2_NAVEGACAO_DASHBOARD_POS_AUDITORIA.md
 D MEDREV_P1_HOTFIX_JA_DOMINO_COPY_VESTIBULAR.md
 D MEDREV_P1_INTEGRACAO_UX_MENTOR_STATS.md
 D MEDREV_P2_P3_P4_OPUS_ROADMAP.md
 D MEDREV_P2_P3_P4_REVISADO_PELA_AUDITORIA.md
 D MEDREV_P2_STATS_METRICS_REGISTRY.md
 D MEDREV_PIPELINE_CODEX_CASOS.md
 D MEDREV_PLANO_PROXIMOS_BLOCOS_P2_3_EM_DIANTE.md
 D MEDREV_PRODUCT_PERSONA_UX_AUDIT_PROMPT.md
 D MEDREV_RACIOCINIO_CLINICO_FUNCAO_DEFINITIVA.md
 D MEDREV_UI_PREMIUM_SYSTEM_V3.md
 M package-lock.json
 M package.json
 M public/index.html
 M src/components/CalendarImportWizard.jsx
 M src/core/backup.js
 M src/core/calendarImportCsv.js
 M src/core/calendarImportCsv.test.js
 M src/core/calendarProvider.js
 M src/core/calendarProvider.test.js
 M src/core/dataIntegrity.js
 M src/core/userDataMigration.js
 M src/core/userDataMigration.test.js
 M tailwind.config.js
?? craco.config.js
?? docs/MEDREV_CONTEXT_FSRS_COMANDO_MENTOR_DOSSIE.md
?? docs/MEDREV_LIBS_AUDIT_AND_INTEGRATION_PLAN.md
?? docs/archive/
?? docs/fable-master-audit/
?? src/core/backup.test.js
?? src/core/schemas/
```

Observacao: alteracoes existentes em `src/`, `package.json`, `package-lock.json`, `public/index.html`, `tailwind.config.js` e arquivos nao rastreados ja estavam presentes no preflight. O CC-0 nao alterou `src/`, `firestore.rules` nem `package.json`.

## Comandos executados

### 1. npm run check:mojibake

Exit code: 0

```text
> residencia-planner@0.1.0 check:mojibake
> node scripts/check-mojibake.mjs

check-mojibake: OK - 910 arquivos versionados sem mojibake.
```

### 2. npm test -- --watchAll=false

Ambiente: `TEMP` e `TMP` apontados para `.tmp-jest` no repo.
Exit code: 0

Resumo:

```text
Test Suites: 79 passed, 79 total
Tests:       759 passed, 759 total
Snapshots:   0 total
Time:        93.849 s
Ran all test suites.
```

Suites reportadas como PASS:

```text
src/core/clinicalCaseGenerator.test.js
src/core/interleavingPlanner.test.js
src/constants/casosClinicos.test.js
src/core/decisionCore.test.js
src/core/learningEvent.test.js
src/core/mentor.upgrade.smoke.test.js
src/core/authSession.test.js
src/core/clinicalDrillSelector.test.js
src/core/mastery.test.js
src/core/agendaEngine.test.js
src/core/errorActionMap.test.js
src/core/fsrsCanonicalShadow.test.js
src/core/forecast.test.js
src/core/clinicalReasoningScoring.test.js
src/core/dailyBriefing.test.js
src/core/calendarImportCsv.test.js
src/hooks/useMetrics.test.js
src/core/calibration.test.js
src/constants/sampleCalendars.test.js
src/core/actionInbox.test.js
src/core/domainTest.test.js
src/core/dailyCommandTargetExecutor.test.js
src/core/enamedIntel.test.js
src/core/domainValidation.test.js
src/core/backup.test.js
src/core/launchReadiness.test.js
src/core/fsrsShadowReport.test.js
src/hooks/useReducedMotion.test.js
src/core/fsrs.test.js
src/core/growthMetrics.test.js
src/core/illnessScript.test.js
src/core/errorTaxonomy.test.js
src/core/copy.test.js
src/core/dataIntegrity.test.js
src/core/calendarProvider.test.js
src/core/confusableSets.test.js
src/core/dailyCommandEngine.test.js
src/components/ui/ui.test.jsx
src/components/ui/overlay.test.jsx
src/core/metricsRegistry.test.js
src/core/mentorSignals.test.js
src/components/__tests__/AgendaRender.test.jsx
src/components/__tests__/CronogramaAgendaRender.test.jsx
src/core/readiness.test.js
src/components/__tests__/ActionInbox.test.jsx
src/core/mentorDecisionPolicy.test.js
src/components/DomainTestModal.test.jsx
src/core/platformFeatures.test.js
src/core/volume.test.js
src/core/reviewTaskPlanner.test.js
src/core/scheduleWizard.test.js
src/core/provaAnalyzer.test.js
src/core/motion.test.js
src/core/sessionReflection.test.js
src/core/mentorAutopilot.test.js
src/core/retentionPolicy.test.js
src/core/uiTokens.test.js
src/core/onboardingEngine.test.js
src/core/userDataMigration.test.js
src/core/onboardingGate.test.js
src/core/numberInput.test.js
src/core/operationalMode.test.js
src/core/peakMode.test.js
src/core/studyPlanIntentions.test.js
src/core/navigationModel.test.js
src/core/workloadRebalance.test.js
src/core/onboarding.test.js
src/core/p3WhatIf.test.js
src/core/sessionClosure.test.js
src/core/userScope.test.js
src/core/weeklyReviewGate.test.js
src/core/vestibularOnboarding.test.js
src/core/planExecution.test.js
src/core/readinessValidation.test.js
src/core/schemas/boundarySchemas.test.js
src/components/LandingPage.test.jsx
src/services/userDataPaths.test.js
src/core/telemetry.test.js
src/App.test.js
```

Warnings/vermelhos do teste:

```text
src/App.test.js emitiu console.error repetido:
An update to App inside a test was not wrapped in act(...).

Pontos citados no stack:
- src/App.js:457 setSyncStatus
- src/App.js:464 setAuthSession
- src/core/store.js:210 set
- src/App.js:471 useStore.persist.rehydrate()
- src/App.js:585 setUsuarioLogado
- src/App.js:586 setView
- src/App.js:591 setAuthSession
- src/App.js:597 setCarregandoAuth
- src/App.js:598 setSyncStatus
```

Lista nominal de testes falhando: nenhuma.

### 3. npm run build

Exit code: 0
Tempo observado: 186.5 s

```text
> residencia-planner@0.1.0 build
> node scripts/check-mojibake.mjs && craco build

check-mojibake: OK - 910 arquivos versionados sem mojibake.
Creating an optimized production build...
Compiled with warnings.

[eslint]
src\components\landing\FeatureShowcase.jsx
  Line 3:21:  'BookOpen' is defined but never used  no-unused-vars

src\components\landing\Hero.jsx
  Line 4:10:  'Badge' is defined but never used  no-unused-vars

src\components\landing\Method.jsx
  Line 3:10:  'BarChart3' is defined but never used  no-unused-vars

Search for the keywords to learn more about each warning.
To ignore, add // eslint-disable-next-line to the line before.

File sizes after gzip:

  591.37 kB  build\static\js\main.1c308b73.js
  168.46 kB  build\static\js\533.2c7c0fb4.chunk.js
  17.18 kB   build\static\css\main.771863d9.css
  3.48 kB    build\static\js\242.b754932d.chunk.js
  3.24 kB    build\static\js\74.ac5472b3.chunk.js

The bundle size is significantly larger than recommended.
Consider reducing it with code splitting: https://goo.gl/9VhYWB
You can also analyze the project dependencies: https://goo.gl/LeUzfb

The project was built assuming it is hosted at /residencia-planner/.
You can control this with the homepage field in your package.json.

The build folder is ready to be deployed.

Find out more about deployment here:

  https://cra.link/deployment
```

Build warnings:

- `src\components\landing\FeatureShowcase.jsx`: `BookOpen` definido mas nao usado.
- `src\components\landing\Hero.jsx`: `Badge` definido mas nao usado.
- `src\components\landing\Method.jsx`: `BarChart3` definido mas nao usado.
- Bundle size significativamente maior que o recomendado.

## Smoke de isolamento multiusuario

Resultado: PASS.

Evidencia executada:

```json
{
  "flow": [
    "login A",
    "cria tema",
    "logout",
    "login B",
    "verifica ausencia de A",
    "logout",
    "login A",
    "verifica dados intactos"
  ],
  "keys": [
    "medrev:prod:user:user-a:store",
    "medrev:prod:user:user-b:store"
  ],
  "tema": "CC0_ISOLATION_SENTINEL_1781224344719",
  "a1": true,
  "bClean": true,
  "bAfter": true,
  "a2": true,
  "pass": true
}
```

Descricao passo a passo:

1. Login A representado por scope `medrev:prod:user:user-a:store`.
2. Criado tema sentinela `CC0_ISOLATION_SENTINEL_1781224344719` no estado de A.
3. Logout A e troca para login B representado por scope `medrev:prod:user:user-b:store`.
4. Estado de B lido sem o tema de A e com lista de temas vazia.
5. Logout B e retorno ao scope de A.
6. Tema sentinela de A permanece presente e intacto.

Limitacao registrada: o navegador visual do Codex/Chrome nao estava disponivel como ferramenta chamavel nesta sessao; por isso o smoke foi executado como roteiro instrumentado no mesmo modelo de chave de persistencia usado pelo app.

## Arquivamento de planos antigos

Raiz: nenhum arquivo `MEDREV_*.md` permanece fisicamente na raiz apos o CC-0.

Arquivos materializados em `docs/archive/` a partir dos blobs rastreados:

```text
MEDREV_AGENDA_CRONOGRAMA_EXECUCAO_HOTFIX_PLAN.md
MEDREV_AUDITORIA_INCREMENTAL_FUNCOES_RESTANTES.md
MEDREV_AUDITORIA_POS_P2_3_A_P3_1.md
MEDREV_BLOCOS_CIENCIA_APRENDIZAGEM_GEMINI.md
MEDREV_BLOCO_0_PREFLIGHT.md
MEDREV_BLOCO_A_DASHBOARD_COMMAND_CENTER.md
MEDREV_BLOCO_B_ENAMED_INTEL.md
MEDREV_BLOCO_C_ILLNESS_SCRIPT_ENGINE.md
MEDREV_BLOCO_D_CASOS_E_JA_DOMINO.md
MEDREV_BLOCO_E_RACIOCINIO_UI.md
MEDREV_BLOCO_F1_MENTOR_ENAMED_AUTOPILOT.md
MEDREV_BLOCO_F2_TOOLTIPS_MOBILE_CRONOGRAMA.md
MEDREV_BLOCO_G_CALENDARIOS_PROVIDERS.md
MEDREV_BLOCO_H_CEO_FEATURE_LEVERAGE.md
MEDREV_BLOCO_I_LAUNCH_HARDENING.md
MEDREV_BLOCO_J_v2_AUDITORIA_CALENDARIO_VESTIBULAR.md
MEDREV_BLOCO_K_FSRS_LITE_V2_MENTOR_PREP.md
MEDREV_BLOCO_L_v2_MENTOR_POS_K.md
MEDREV_BLOCO_M_REORGANIZADO_EM_SUBBLOCOS.md
MEDREV_BLOCO_N_MULTI_USER_DATA_ISOLATION.md
MEDREV_BLOCO_P0_FSRS_BLOCOS_INTERLEAVING_GEMINI.md
MEDREV_BLOCO_P1_1_FSRS_CANONICO_SOMBRA_GEMINI.md
MEDREV_BLOCO_P1_2_CALIBRACAO_METACOGNITIVA_GEMINI.md
MEDREV_BLOCO_P1_3_MAQUINA_MODO_OPERACIONAL_GEMINI.md
MEDREV_BLOCO_P2_1_STUDENT_MODEL_MAESTRIA_LATENTE_GEMINI.md
MEDREV_BLOCO_P2_2_FORECAST_TRAJETORIA_PRONTIDAO_GEMINI.md
MEDREV_CALENDARIO_CRONOGRAMA_V2_WIZARD_PLAN.md
MEDREV_CODE_AUDIT_AND_IMPROVEMENT_MASTERPLAN.md
MEDREV_CODE_AUDIT_SAFETY_UX_VALIDATION_PLAN.md
MEDREV_CORE_AUDIT_AND_MASTER_IMPLEMENTATION_PLAN.md
MEDREV_HOTFIX_JA_DOMINO_D7_D14_FILA.md
MEDREV_MASTER_PRODUCT_ROADMAP_V2.md
MEDREV_P0_COMPLETO_ORQUESTRACAO_DECISAO_E_EVIDENCIAS.md
MEDREV_P1_A_v2_NAVEGACAO_DASHBOARD_POS_AUDITORIA.md
MEDREV_P1_HOTFIX_JA_DOMINO_COPY_VESTIBULAR.md
MEDREV_P1_INTEGRACAO_UX_MENTOR_STATS.md
MEDREV_P2_P3_P4_OPUS_ROADMAP.md
MEDREV_P2_P3_P4_REVISADO_PELA_AUDITORIA.md
MEDREV_P2_STATS_METRICS_REGISTRY.md
MEDREV_PIPELINE_CODEX_CASOS.md
MEDREV_PLANO_PROXIMOS_BLOCOS_P2_3_EM_DIANTE.md
MEDREV_PRODUCT_PERSONA_UX_AUDIT_PROMPT.md
MEDREV_RACIOCINIO_CLINICO_FUNCAO_DEFINITIVA.md
MEDREV_UI_PREMIUM_SYSTEM_V3.md
```

## Vermelhos

- Nenhuma suite falhando.
- Nenhum teste falhando.
- Warning de teste: `src/App.test.js` emite `console.error` de updates React fora de `act(...)`.
- Warnings de build: 3 imports nao usados em componentes de landing.
- Warning de build: bundle size acima do recomendado.

## Divergencias em relacao ao plano

- O smoke exigia navegador manual com login real A/B. A ferramenta de browser/Chrome nao ficou disponivel nesta sessao; o resultado registrado foi um roteiro instrumentado no mesmo mecanismo de chave por usuario usado pela persistencia local.
- Antes do arquivamento, os `MEDREV_*.md` da raiz ja apareciam como deletados no working tree. Para cumprir a intencao de "mover, nao editar", os blobs rastreados foram materializados em `docs/archive/`, mantendo a raiz sem esses planos.
- Existem outros `MEDREV_*.md` dentro de `docs/`; o CC-0 pediu mover apenas os da raiz, entao esses nao foram movidos.
