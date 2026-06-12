# MEDREV — BLOCO J v2: Auditoria Pós-G, Calendário/Provider no Plano Ativo, Estratégia Completo, Vestibular e Performance

> **Executor:** Claude Code / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `high`  
> Use `very high` se o build estiver quebrando ou se muitas integrações dos blocos D–I estiverem incompletas.  
> **Modo:** agent com aprovação manual.  
> **Objetivo:** corrigir a integração pós-Bloco G, reorganizar calendário/provider dentro de “Plano Ativo + Prioridades”, garantir que o Estratégia mostre todos os temas importados/seedados, adicionar “Já domino” como botão secundário nos cards de matéria, preservar/otimizar Vestibular, reduzir peso de build e auditar regressões.

---

## 0. Contexto real auditado no código atual

Código enviado já tem parte do Bloco G, mas com problemas de integração.

Achados principais:

1. `CalendarProviderSelector` aparece como bloco separado no topo do Cronograma.
   - Isso polui a tela.
   - O usuário pediu que as opções de calendário fiquem **somente dentro da aba/seção “Plano Ativo + Prioridades”**, tudo junto ali.

2. `CalendarMappingPanel` também aparece separado.
   - Ele deveria ficar dentro de “Plano Ativo + Prioridades” ou dentro de uma aba “Mapeamento”.
   - Hoje ele mostra apenas `importedTopics.slice(0, 8)`, ou seja, não mostra tudo.

3. O seed do Estratégia está incompleto.
   - `DEV_ESTRATEGIA_SAMPLE` tem só 5 itens.
   - O usuário quer ver **todos os temas do Estratégia na aba dele**, não apenas 5.
   - Se houver cronograma importado pelo usuário, mostrar todos os tópicos importados.
   - Se estiver usando seed/dev, criar um seed maior ou um fallback explícito, mas não fingir que 5 itens são o cronograma completo.

4. O parser do Estratégia está fraco.
   - O PDF/texto do Estratégia vem em padrão:
     ```txt
     CARDIOLOGIA
     Hipertensão Arterial Sistêmica...
     CIRURGIA
     Trauma...
     ```
   - O parser atual só entende linhas tipo:
     ```txt
     Segunda - Cardiologia
     ```
   - Resultado: áreas podem virar temas, temas ficam sem área, e matching fica ruim.

5. O schema do calendário está simplificado demais.
   - Falta `areaOriginal`, `areaCanonica`, `temaNormalizado`, `temaMedcofMatch`, `mappingStatus`, `enamedScore`, `hasCasoClinico`.
   - Sem isso, Mentor, ENAMED e casos clínicos não se conectam bem.

6. `attachCalendarIntelligence(topic)` usa `topic.area`.
   - Mas para importado do Estratégia o ideal é `areaOriginal -> areaCanonica`.
   - Exemplo: `CARDIOLOGIA → Clínica Médica`, `GINECOLOGIA/OBSTETRÍCIA → GO`.

7. `CalendarImportWizard` usa `setError("")` dentro de `useMemo`.
   - Isso é side effect durante render.
   - Corrigir para não fazer setState dentro de `useMemo`.

8. Quando seleciona provider importado sem tópicos, `Cronograma.jsx` auto-carrega `getProviderSeed(...)`.
   - Isso é perigoso. O app parece importar algo sem consentimento.
   - Deve abrir modal/CTA de importação ou oferecer “Usar amostra de desenvolvimento” explicitamente.

9. Cards de matéria não têm botão secundário “Já domino” no Cronograma.
   - O botão existe em Dashboard e FocusMode, mas não nos cards do Cronograma.
   - O usuário pediu explicitamente:
     ```txt
     colocar o botão secundário "já domino" em cada card de matéria como botão secundário
     ```
   - Regra: somente em tema não iniciado.

10. O Vestibular pode ter sido prejudicado pelos blocos recentes.
    - Calendar provider e Modo Mentor precisam respeitar `plat === "vest"`.
    - ENAMED/Raciocínio Clínico não devem aparecer como eixo central do Vestibular.
    - Vestibular precisa continuar com cronograma, foco, simulado, stats, action inbox e backup.

11. `RaciocinioClinico.jsx` parece ainda estar em modelo de tabs (`Illness Scripts`, `Casos`, `SCT`, `Anamnese`), não no fluxo de 6 etapas prometido.
    - Não corrigir isso neste J v2, salvo se build exigir.
    - Documentar como pendência se ainda não tiver sido implementado no Bloco E.
    - O foco deste bloco é calendário, vestibular, build e regressão.

---

## 1. Regras inegociáveis

Antes de alterar:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Se build demorar:
- Não cancelar antes de 10 minutos.
- CRA/Webpack pode demorar após muitas mudanças.
- Se estourar timeout do Codex, rodar manualmente e capturar log completo.

Não fazer:
- `git commit`
- `firebase deploy`
- `git push`

Sem confirmação explícita.

Não remover:
- MEDCOF
- Estratégia/importação
- Custom
- Vestibular
- Modo Mentor
- ENAMED
- Raciocínio Clínico
- “Já domino”
- Modo Foco
- Dashboard/Stats

Não instalar libs novas.

---

## 2. Prioridade de execução

Execute nesta ordem:

```txt
J0 — Build/encoding baseline
J1 — Reorganizar Provider/Mapeamento dentro de Plano Ativo + Prioridades
J2 — Corrigir Estratégia: parser + schema + todos os temas importados/seedados
J3 — Adicionar “Já domino” como botão secundário em cards de matéria
J4 — Vestibular: feature flags, linguagem e regressão
J5 — Performance/build: lazy loading e imports
J6 — QA final
```

Não avance para a próxima etapa se build/testes quebrarem por alteração recente.

---

## 3. J0 — Baseline

Rode:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Se houver warnings de imports não usados, corrija os óbvios.

Se houver BOM/mojibake, corrija antes de tudo.

---

## 4. J1 — Provider e mapeamento só dentro de “Plano Ativo + Prioridades”

### 4.1 Estado atual

Em `src/components/Cronograma.jsx`:

- `CalendarProviderSelector` aparece no topo do Cronograma.
- `CalendarMappingPanel` aparece logo abaixo.
- Depois vem “Plano Ativo + Prioridades”.

O usuário quer:

```txt
Tudo de calendário/provider/mapeamento dentro de "Plano Ativo + Prioridades".
```

### 4.2 Implementação requerida

No `Cronograma.jsx`, reorganizar:

```txt
[Plano Ativo + Prioridades]
  - Cards dos planos MEDCOF/importado/custom
  - Selector de calendário-base
  - Botões:
    - Importar Estratégia
    - Usar amostra dev
    - Ver mapeamento
  - Mapeamento MEDCOF colapsável
```

Remover do topo:

```jsx
<CalendarProviderSelector ... />
<CalendarMappingPanel ... />
```

e mover para dentro do painel `showPlanPanel`.

### 4.3 UX recomendada

Dentro de “Plano Ativo + Prioridades”:

```txt
Calendário-base
[MEDCOF] [Estratégia MED importado] [Custom]

Plano ativo
[MEDCOF 2026] ou [Estratégia MED importado]

Ações
[Importar cronograma] [Ver mapeamento] [Usar amostra dev]
```

Se provider ativo for Estratégia:

```txt
Estratégia MED — importado pelo usuário
X tópicos importados · Y mapeados · Z pendentes
```

Se provider ativo for Custom:

```txt
Custom
Trilho montado manualmente
```

### 4.4 Critério

Depois da alteração:
- A tela não deve mostrar provider/mapping fora da seção “Plano Ativo + Prioridades”.
- O painel pode ser minimizado.
- Ao minimizar, provider/mapping somem com o painel.
- O restante da lista de temas continua visível.

---

## 5. J2 — Estratégia completo: parser, schema, todos os temas

### 5.1 Problema

`DEV_ESTRATEGIA_SAMPLE` atual tem apenas 5 itens.

O app não deve mostrar só 5 temas na aba Estratégia se o usuário importou/quer o cronograma completo.

### 5.2 Corrigir constants

Atualizar `src/constants/calendarProviders.js`.

Substituir o seed mínimo por uma amostra maior **somente dev**, idealmente cobrindo várias semanas e temas do PDF enviado.

Importante:
- Não chamar de oficial.
- Nomear como dev/user sample.

Exemplo:

```js
// Amostra DEV baseada em cronograma importado pelo usuário.
// Não é cronograma oficial público.
export const DEV_ESTRATEGIA_SAMPLE = [
  { semana: 1, ordem: 1, areaOriginal: "CARDIOLOGIA", temaOriginal: "Hipertensão Arterial Sistêmica (Parte 1): Diagnóstico, Classificação, Avaliação" },
  { semana: 1, ordem: 2, areaOriginal: "CIRURGIA", temaOriginal: "Trauma - Avaliação Inicial, Vias Aéreas e Trauma Torácico" },
  ...
]
```

Incluir pelo menos:
- todas as semanas/temas que já estiverem disponíveis em arquivo de importação, se houver;
- caso contrário, usar um seed dev amplo com as semanas extraídas do PDF enviado anteriormente.

Se o cronograma completo não estiver no repo, não inventar. Em vez disso:
- melhorar importação por texto;
- mostrar mensagem clara:
  ```txt
  Para ver todos os temas do Estratégia, importe o texto completo do seu cronograma.
  ```
- e manter um botão:
  ```txt
  Usar amostra de desenvolvimento
  ```

### 5.3 Corrigir parser do Estratégia

Arquivo: `src/core/calendarProvider.js`.

O parser deve aceitar padrão do PDF:

```txt
Semana 8
CARDIOLOGIA
Insuficiência Cardíaca (Parte 2): Tratamento
CIRURGIA
Abdome Agudo Inflamatório - Apendicite Aguda
GINECOLOGIA
Pólipos Uterinos
```

Implementar:

```js
const AREA_SET = new Set([
  "CARDIOLOGIA", "CIRURGIA", "ENDOCRINO", "GASTRO", "GINECOLOGIA",
  "INFECTOLOGIA", "PEDIATRIA", "OBSTETRÍCIA", "OBSTETRICIA",
  "PREVENTIVA", "NEFROLOGIA", "NEURO", "PNEUMO", "REUMATO",
  "HEMATO", "DERMATO", "PSIQUIATRIA", "ORTOPEDIA", "OTORRINO",
  "OFTALMO"
]);
```

Regra:
- se linha é `Semana X`, atualizar semana.
- se linha é área, guardar `currentArea`.
- se linha é tema e `currentArea` existe, criar tópico com `areaOriginal: currentArea`.
- ignorar linhas de navegação, números, percentuais e vazios.

### 5.4 Schema unificado

Atualizar `normalizeCalendarTopic` para aceitar:

```js
raw.areaOriginal
raw.temaOriginal
raw.semana
raw.ordem
```

Retornar:

```js
{
  id,
  providerId,
  sourceType,
  semana,
  ordem,
  areaOriginal,
  areaCanonica,
  area,
  temaOriginal,
  temaNormalizado,
  temaMedcofMatch,
  mappingStatus,
  enamedScore,
  hasCasoClinico,
  casoClinicoIds,
  meta
}
```

`area` pode ser alias de `areaCanonica` para compatibilidade.

### 5.5 Mapeamento de área

Criar ou usar:

```js
CARDIOLOGIA → Clínica Médica
ENDOCRINO → Clínica Médica
GASTRO → Clínica Médica
INFECTOLOGIA → Clínica Médica
NEFROLOGIA → Clínica Médica
NEURO → Clínica Médica
PNEUMO → Clínica Médica
REUMATO → Clínica Médica
HEMATO → Clínica Médica
DERMATO → Clínica Médica
PSIQUIATRIA → Clínica Médica

CIRURGIA → Cirurgia
ORTOPEDIA → Cirurgia
OTORRINO → Cirurgia
OFTALMO → Cirurgia

GINECOLOGIA → GO
OBSTETRÍCIA/OBSTETRICIA → GO

PEDIATRIA → Pediatria
PREVENTIVA → Preventiva
```

### 5.6 Normalização de tema

Adicionar regras mínimas:

```txt
Abdome Agudo Inflamatório - Apendicite Aguda → Apendicite Aguda
Abdome Agudo Inflamatório - Colecistite e Colangite Aguda → Colecistite Aguda / Colangite
Diabetes Mellitus - Complicações Agudas → Emergências Hiperglicêmicas - CAD e EHH
Síndromes Hipertensivas da Gestação → Síndromes Hipertensivas na Gestação
Rastreamento do Câncer de Colo Uterino → Rastreamento do Câncer do Colo do Útero
Bronquiolite → Bronquiolite
Hemorragia Pós-Parto → Hemorragia Pós-Parto
Tuberculose → Tuberculose
```

Não precisa cobrir 100% agora; o painel de mapeamento corrige o resto.

### 5.7 Mostrar todos os tópicos

Em `Cronograma.jsx`, quando provider ativo for Estratégia:
- renderizar todos os `providerTopics`;
- agrupar por `semana`;
- não usar `.slice(0, 5)` ou `.slice(0, 8)` na lista principal;
- se houver muitos temas, usar colapso por semana e filtro, não truncamento.

`CalendarMappingPanel` pode mostrar:
- resumo;
- pendentes;
- e botão “Ver todos”.
Mas a aba/lista principal deve mostrar todos.

### 5.8 Corrigir `CalendarImportWizard`

Remover `setError("")` dentro de `useMemo`.

Fazer:

```js
const previewResult = useMemo(() => {
  try { return { items: parseCalendarImport(raw, tab), error: "" }; }
  catch { return { items: [], error: "..." }; }
}, [raw, tab]);

const preview = previewResult.items;
const error = previewResult.error;
```

Ou calcular em handler `Pré-visualizar`.

---

## 6. J3 — Botão secundário “Já domino” nos cards de matéria

### 6.1 Regra

Mostrar “Já domino” somente em tema não iniciado.

Não marcar domínio direto.
Deve abrir o mesmo modal/fluxo existente de validação de domínio prévio.

### 6.2 Locais obrigatórios em `Cronograma.jsx`

Adicionar botão secundário nos três cenários:

#### A) Card de tema simples não iniciado

Hoje tem:

```txt
Iniciar Ciclo Hoje
```

Adicionar abaixo ou ao lado:

```txt
Já domino
```

Layout recomendado:

```txt
[Iniciar Ciclo Hoje]
[Já domino]
```

ou desktop:

```txt
[Iniciar Ciclo Hoje] [Já domino]
```

Mobile: empilhado.

#### B) Subtópico não iniciado

Hoje tem:

```txt
Iniciar FSRS
```

Adicionar:

```txt
Já domino
```

#### C) Tema importado do Estratégia/Custom

Como esses entram pelo mesmo fluxo de catálogo transformado, garantir que também têm o botão.

### 6.3 Eventos

Botão deve:

```js
e.stopPropagation()
```

para não abrir edição do card.

Chamar action/handler existente:

```js
iniciarValidacaoDominioPrevio(plat, tema.id)
```

Mas para tema ainda não criado, é preciso criar/iniciar tema primeiro ou abrir modal com payload temporário.

Implementação recomendada:

1. Se `tema` existe:
   - abrir modal de domínio com `tema`.
2. Se `tema` não existe:
   - criar tema como `unstarted`/iniciado mínimo? Melhor:
   - chamar `onIniciarTema` com flag:
     ```js
     onIniciarTema(payload, { startDomainValidation: true })
     ```
   - se `onIniciarTema` não suporta options, criar handler local:
     - criar tema;
     - depois iniciar validação.
   - Escolha menor mudança compatível com store real.

### 6.4 Não contar como dominado

Manter regra:
- `validado_previo` não é `dominado`.
- Só agenda revisão inicial.
- Não incrementa streak como sessão comum.

### 6.5 UI

Usar ícone `BadgeCheck` ou `CheckCircle2` de `lucide-react`.

Não usar emoji.

Texto tooltip:

```txt
Use se você já estudou este tema. O app cria uma validação curta: 15+ questões e 80%+ para pular exposição inicial e entrar no ciclo de revisão.
```

---

## 7. J4 — Vestibular

### 7.1 Criar feature flags por plataforma

Criar:

```txt
src/core/platformFeatures.js
src/core/platformFeatures.test.js
```

```js
export const PLATFORM = {
  RES: "res",
  VEST: "vest",
};

export function getPlatformFeatures(plat) {
  const isVest = plat === PLATFORM.VEST;
  return {
    enamed: !isVest,
    raciocinioClinico: !isVest,
    illnessScript: !isVest,
    casosClinicos: !isVest,

    vestibularStats: isVest,
    vestibularCalendar: isVest,

    calendarProviders: true,
    customCalendar: true,
    mentor: true,
    fsrs: true,
    actionInbox: true,
    backup: true,
    focusMode: true,
    weeklyReview: true,
    peakMode: true,
  };
}

export function featureEnabled(plat, feature) {
  return Boolean(getPlatformFeatures(plat)[feature]);
}
```

### 7.2 Dashboard adaptado

Se `plat === "vest"`:

Não mostrar como principal:
- ENAMED;
- Raciocínio Clínico;
- casos clínicos;
- illness script.

Mostrar:
- Comando do Dia;
- revisão vencida;
- tema novo recomendado;
- análise de simulado;
- carga futura;
- cronograma;
- consistência;
- Action Inbox.

Trocar textos:
- “ENAMED” → “Simulado/Prova”
- “área médica” → “matéria/frente”
- “raciocínio clínico” oculto.

### 7.3 Stats adaptado

Se `plat === "vest"`:

Mostrar:
- desempenho por matéria;
- simulados;
- padrão de erros;
- retenção por matéria;
- carga futura;
- cronograma.

Ocultar/colapsar:
- ENAMED Intel;
- Raciocínio Clínico;
- casos clínicos.

### 7.4 Mentor adaptado

`mentorAutopilot.js` deve aceitar plataforma.

Para `vest`:
1. revisão vencida;
2. matéria fraca em simulado;
3. tema novo do cronograma;
4. treino externo recomendado;
5. descanso/sobrecarga.

Não usar ENAMED hotness para vestibular.

---

## 8. J5 — Performance/build

### 8.1 Build lento

2–4 minutos em CRA após muitas alterações não é automaticamente erro.

Só investigar pesado se:
- >10 minutos;
- trava sem saída;
- erro de heap/memória;
- build falha.

### 8.2 Lazy loading

Aplicar `React.lazy` para telas pesadas:

```txt
RaciocinioClinico
EnamedProvaAnalyzer
CalendarImportWizard
CalendarMappingPanel
DataSafetyPanel
WeeklyReview
```

Não lazy-load:
- Dashboard;
- Sidebar;
- store;
- core mínimo do Mentor.

### 8.3 Limpar imports

Corrigir:
- imports não usados;
- variáveis não usadas;
- console.log;
- componentes mortos.

Não fazer rewrite gigante.

---

## 9. J6 — Testes obrigatórios

Criar/ajustar:

```txt
src/core/calendarProvider.test.js
src/core/platformFeatures.test.js
```

Testes `calendarProvider`:

1. parseia padrão área + tema do Estratégia.
2. ignora linhas de navegação.
3. detecta semana.
4. mapeia área original para canônica.
5. normaliza tema conhecido.
6. não trunca tópicos.
7. retorna mappingStatus.
8. `getProviderSeed` retorna mais que 5 itens se seed dev for usado.

Testes `platformFeatures`:

1. `res` tem ENAMED e Raciocínio.
2. `vest` não tem ENAMED/Raciocínio.
3. ambos têm Mentor/FSRS/Action Inbox.
4. `featureEnabled` funciona.

---

## 10. QA manual

### Residência

1. Abrir Cronograma.
2. Ver que provider/calendário só aparece dentro de “Plano Ativo + Prioridades”.
3. Selecionar MEDCOF.
4. Selecionar Estratégia importado.
5. Importar texto com padrão:
   ```txt
   Semana 8
   CIRURGIA
   Abdome Agudo Inflamatório - Apendicite Aguda
   PEDIATRIA
   Bronquiolite
   ```
6. Ver todos os itens importados.
7. Ver semana agrupada.
8. Ver mapeamento.
9. Ver “Já domino” nos cards não iniciados.
10. Validar domínio prévio.
11. Confirmar que não vira dominado definitivo.

### Vestibular

1. Trocar para Vestibular.
2. Dashboard não mostra ENAMED/Raciocínio como principais.
3. Cronograma funciona.
4. Modo Mentor recomenda revisão/tema novo de vestibular.
5. Stats não mostra ENAMED como eixo central.
6. Modo Foco funciona.

### Build

1. `npm run check:mojibake`
2. `npm test -- --watchAll=false`
3. `npm run build`

Reportar tempo de build.

---

## 11. Critérios de aceite

J v2 aprovado se:

- Provider/mapeamento aparecem somente dentro de “Plano Ativo + Prioridades”.
- Estratégia mostra todos os temas importados/seedados, não só 5.
- Parser aceita padrão real do PDF: área em uma linha, tema na seguinte.
- Schema de tópico tem área original/canônica e mapping status.
- “Já domino” aparece como botão secundário em cards de matéria não iniciada.
- Botão “Já domino” abre o fluxo real de validação.
- Vestibular fica limpo e funcional.
- ENAMED/Raciocínio não vazam para o Vestibular como foco principal.
- Build passa.
- Tests passam.
- Mojibake passa.
- Nenhuma feature existente é removida.

---

## 12. Nota final ao executor

Não use este bloco para criar features novas.

Este bloco corrige integração e UX:

```txt
menos coisa espalhada
mais coerência
Estratégia completo quando importado
Vestibular preservado
cards com ação secundária correta
build confiável
```

Se algo não couber, priorize:
1. provider no Plano Ativo;
2. parser Estratégia real;
3. “Já domino” nos cards;
4. Vestibular;
5. performance.
